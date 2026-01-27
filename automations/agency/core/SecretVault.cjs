/**
 * SecretVault.cjs - Infisical SDK Wrapper for Multi-Tenant Credential Management
 *
 * Version: 1.0
 * Created: 2026-01-28 | Session 180+
 *
 * Usage:
 *   const vault = require('./SecretVault.cjs');
 *   await vault.getSecret('tenant-id', 'SHOPIFY_ACCESS_TOKEN');
 *   await vault.setSecret('tenant-id', 'KLAVIYO_API_KEY', 'pk_xxx');
 *   await vault.getAllSecrets('tenant-id');
 *
 * Environment Variables Required:
 *   INFISICAL_URL          - Infisical server URL (default: http://localhost:8080)
 *   INFISICAL_CLIENT_ID    - Machine Identity Client ID
 *   INFISICAL_CLIENT_SECRET - Machine Identity Client Secret
 *   INFISICAL_ORG_ID       - Organization ID for project creation
 *
 * Features:
 *   - Multi-tenant credential isolation
 *   - In-memory cache with TTL (5 minutes default)
 *   - Project auto-creation for new tenants
 *   - Fallback to file-based storage when Infisical unavailable
 *   - Audit logging for all operations
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class SecretVault {
  constructor() {
    this.baseUrl = process.env.INFISICAL_URL || 'http://localhost:8080';
    this.clientId = process.env.INFISICAL_CLIENT_ID || '';
    this.clientSecret = process.env.INFISICAL_CLIENT_SECRET || '';
    this.orgId = process.env.INFISICAL_ORG_ID || '';

    // Cache configuration
    this.cache = new Map();
    this.cacheTTL = parseInt(process.env.VAULT_CACHE_TTL || '300000'); // 5 minutes

    // Token management
    this.accessToken = null;
    this.tokenExpiry = 0;

    // Fallback storage
    this.fallbackDir = path.join(process.cwd(), 'data', 'vault-fallback');

    // Audit log
    this.auditLogPath = path.join(process.cwd(), 'logs', 'vault-audit.log');

    // Project cache (tenantId -> projectId mapping)
    this.projectCache = new Map();

    // Infisical availability flag
    this.infisicalAvailable = null;
    this.lastHealthCheck = 0;
    this.healthCheckInterval = 60000; // 1 minute
  }

  // === AUTHENTICATION ===

  async authenticate() {
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      this.log('WARN', 'No Infisical credentials configured, using fallback');
      return null;
    }

    try {
      const response = await this._request('POST', '/api/v1/auth/universal-auth/login', {
        clientId: this.clientId,
        clientSecret: this.clientSecret
      });

      if (response.accessToken) {
        this.accessToken = response.accessToken;
        this.tokenExpiry = Date.now() + (response.expiresIn || 7200) * 1000;
        this.infisicalAvailable = true;
        return this.accessToken;
      }
    } catch (error) {
      this.log('ERROR', `Authentication failed: ${error.message}`);
      this.infisicalAvailable = false;
    }

    return null;
  }

  // === SECRET OPERATIONS ===

  async getSecret(tenantId, key, defaultValue = null) {
    const cacheKey = `${tenantId}:${key}`;
    const cached = this.cache.get(cacheKey);

    // Return cached value if valid
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      this.log('DEBUG', `Cache hit: ${tenantId}/${key}`);
      return cached.value;
    }

    // Try Infisical
    const token = await this.authenticate();
    if (token) {
      try {
        const projectId = await this._getProjectId(tenantId);
        if (projectId) {
          const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
          const response = await this._request(
            'GET',
            `/api/v3/secrets/raw/${encodeURIComponent(key)}?workspaceId=${projectId}&environment=${env}`,
            null,
            token
          );

          if (response.secret && response.secret.secretValue) {
            const value = response.secret.secretValue;
            this.cache.set(cacheKey, { value, timestamp: Date.now() });
            this.log('INFO', `Retrieved secret: ${tenantId}/${key}`);
            return value;
          }
        }
      } catch (error) {
        this.log('WARN', `Infisical get failed for ${tenantId}/${key}: ${error.message}`);
      }
    }

    // Fallback to file storage
    const fallbackValue = this._getFallbackSecret(tenantId, key);
    if (fallbackValue !== null) {
      this.log('INFO', `Fallback hit: ${tenantId}/${key}`);
      return fallbackValue;
    }

    // Return default
    this.log('DEBUG', `Secret not found: ${tenantId}/${key}, using default`);
    return defaultValue;
  }

  async setSecret(tenantId, key, value) {
    const token = await this.authenticate();

    if (token) {
      try {
        const projectId = await this._getProjectId(tenantId, true);
        const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';

        // Try to update first, create if not exists
        try {
          await this._request(
            'PATCH',
            `/api/v3/secrets/raw/${encodeURIComponent(key)}`,
            {
              workspaceId: projectId,
              environment: env,
              secretValue: value
            },
            token
          );
          this.log('INFO', `Updated secret: ${tenantId}/${key}`);
        } catch (updateError) {
          // Create new secret
          await this._request(
            'POST',
            '/api/v3/secrets/raw',
            {
              workspaceId: projectId,
              environment: env,
              secretName: key,
              secretValue: value,
              type: 'shared'
            },
            token
          );
          this.log('INFO', `Created secret: ${tenantId}/${key}`);
        }

        // Update cache
        const cacheKey = `${tenantId}:${key}`;
        this.cache.set(cacheKey, { value, timestamp: Date.now() });

        return true;
      } catch (error) {
        this.log('ERROR', `Failed to set secret ${tenantId}/${key}: ${error.message}`);
      }
    }

    // Fallback to file storage
    this._setFallbackSecret(tenantId, key, value);
    return true;
  }

  async deleteSecret(tenantId, key) {
    const token = await this.authenticate();

    if (token) {
      try {
        const projectId = await this._getProjectId(tenantId);
        if (projectId) {
          const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
          await this._request(
            'DELETE',
            `/api/v3/secrets/raw/${encodeURIComponent(key)}?workspaceId=${projectId}&environment=${env}`,
            null,
            token
          );
          this.log('INFO', `Deleted secret: ${tenantId}/${key}`);
        }
      } catch (error) {
        this.log('WARN', `Failed to delete from Infisical: ${error.message}`);
      }
    }

    // Remove from cache and fallback
    this.cache.delete(`${tenantId}:${key}`);
    this._deleteFallbackSecret(tenantId, key);

    return true;
  }

  async getAllSecrets(tenantId) {
    const token = await this.authenticate();
    const secrets = [];

    if (token) {
      try {
        const projectId = await this._getProjectId(tenantId);
        if (projectId) {
          const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
          const response = await this._request(
            'GET',
            `/api/v3/secrets/raw?workspaceId=${projectId}&environment=${env}`,
            null,
            token
          );

          if (response.secrets && Array.isArray(response.secrets)) {
            for (const secret of response.secrets) {
              secrets.push({
                key: secret.secretKey,
                value: secret.secretValue,
                version: secret.version,
                createdAt: secret.createdAt,
                updatedAt: secret.updatedAt
              });

              // Update cache
              const cacheKey = `${tenantId}:${secret.secretKey}`;
              this.cache.set(cacheKey, { value: secret.secretValue, timestamp: Date.now() });
            }
            return secrets;
          }
        }
      } catch (error) {
        this.log('WARN', `Failed to get all secrets from Infisical: ${error.message}`);
      }
    }

    // Fallback to file storage
    return this._getAllFallbackSecrets(tenantId);
  }

  // === PROJECT MANAGEMENT ===

  async createProject(tenantId, name) {
    const token = await this.authenticate();

    if (!token) {
      this.log('WARN', `Cannot create project without Infisical: ${tenantId}`);
      // Create fallback directory
      this._ensureFallbackDir(tenantId);
      return { projectId: `fallback-${tenantId}`, fallback: true };
    }

    if (!this.orgId) {
      throw new Error('INFISICAL_ORG_ID required for project creation');
    }

    try {
      const response = await this._request(
        'POST',
        '/api/v2/workspace',
        {
          projectName: tenantId,
          organizationId: this.orgId
        },
        token
      );

      if (response.workspace && response.workspace._id) {
        const projectId = response.workspace._id;
        this.projectCache.set(tenantId, projectId);

        // Create default environments
        await this._createEnvironment(projectId, 'dev', 'Development', token);
        await this._createEnvironment(projectId, 'prod', 'Production', token);

        this.log('INFO', `Created project: ${tenantId} (${projectId})`);
        return { projectId, name: tenantId };
      }
    } catch (error) {
      this.log('ERROR', `Failed to create project: ${error.message}`);
      throw error;
    }

    return null;
  }

  async deleteProject(tenantId) {
    const token = await this.authenticate();

    if (token) {
      try {
        const projectId = await this._getProjectId(tenantId);
        if (projectId) {
          await this._request('DELETE', `/api/v2/workspace/${projectId}`, null, token);
          this.projectCache.delete(tenantId);
          this.log('INFO', `Deleted project: ${tenantId}`);
        }
      } catch (error) {
        this.log('ERROR', `Failed to delete project: ${error.message}`);
      }
    }

    // Clear fallback data
    this._deleteFallbackTenant(tenantId);

    // Clear cache entries for this tenant
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${tenantId}:`)) {
        this.cache.delete(key);
      }
    }

    return true;
  }

  async listProjects() {
    const token = await this.authenticate();

    if (!token || !this.orgId) {
      // Return fallback projects
      return this._listFallbackProjects();
    }

    try {
      const response = await this._request(
        'GET',
        `/api/v2/organizations/${this.orgId}/workspaces`,
        null,
        token
      );

      if (response.workspaces) {
        return response.workspaces.map(w => ({
          id: w._id,
          name: w.name,
          createdAt: w.createdAt
        }));
      }
    } catch (error) {
      this.log('ERROR', `Failed to list projects: ${error.message}`);
    }

    return [];
  }

  // === HEALTH CHECK ===

  async healthCheck() {
    const status = {
      infisical: false,
      authenticated: false,
      projectCount: 0,
      cacheSize: this.cache.size,
      fallbackAvailable: fs.existsSync(this.fallbackDir)
    };

    try {
      // Check Infisical availability
      const healthResponse = await this._request('GET', '/api/status');
      status.infisical = healthResponse && healthResponse.status === 'ok';

      // Check authentication
      const token = await this.authenticate();
      status.authenticated = !!token;

      // Count projects
      if (token && this.orgId) {
        const projects = await this.listProjects();
        status.projectCount = projects.length;
      }
    } catch (error) {
      this.log('WARN', `Health check error: ${error.message}`);
    }

    return status;
  }

  // === PRIVATE METHODS ===

  async _getProjectId(tenantId, createIfMissing = false) {
    // Check cache
    if (this.projectCache.has(tenantId)) {
      return this.projectCache.get(tenantId);
    }

    const token = await this.authenticate();
    if (!token || !this.orgId) return null;

    try {
      const projects = await this.listProjects();
      const project = projects.find(p => p.name === tenantId);

      if (project) {
        this.projectCache.set(tenantId, project.id);
        return project.id;
      }

      if (createIfMissing) {
        const created = await this.createProject(tenantId);
        return created?.projectId;
      }
    } catch (error) {
      this.log('ERROR', `Failed to get project ID: ${error.message}`);
    }

    return null;
  }

  async _createEnvironment(projectId, slug, name, token) {
    try {
      await this._request(
        'POST',
        `/api/v1/workspace/${projectId}/environments`,
        { slug, name },
        token
      );
    } catch (error) {
      // Environment might already exist
      this.log('DEBUG', `Environment ${slug} creation: ${error.message}`);
    }
  }

  _request(method, endpoint, body = null, token = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      };

      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(parsed.message || `HTTP ${res.statusCode}`));
            }
          } catch (e) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({});
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  // === FALLBACK STORAGE ===

  _ensureFallbackDir(tenantId) {
    const tenantDir = path.join(this.fallbackDir, tenantId);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }
    return tenantDir;
  }

  _getFallbackSecret(tenantId, key) {
    const filePath = path.join(this.fallbackDir, tenantId, `${key}.secret`);
    if (fs.existsSync(filePath)) {
      try {
        return fs.readFileSync(filePath, 'utf8');
      } catch (error) {
        this.log('ERROR', `Failed to read fallback secret: ${error.message}`);
      }
    }
    return null;
  }

  _setFallbackSecret(tenantId, key, value) {
    const tenantDir = this._ensureFallbackDir(tenantId);
    const filePath = path.join(tenantDir, `${key}.secret`);
    try {
      fs.writeFileSync(filePath, value, { mode: 0o600 });
      this.log('INFO', `Fallback set: ${tenantId}/${key}`);
    } catch (error) {
      this.log('ERROR', `Failed to write fallback secret: ${error.message}`);
    }
  }

  _deleteFallbackSecret(tenantId, key) {
    const filePath = path.join(this.fallbackDir, tenantId, `${key}.secret`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        this.log('WARN', `Failed to delete fallback: ${error.message}`);
      }
    }
  }

  _deleteFallbackTenant(tenantId) {
    const tenantDir = path.join(this.fallbackDir, tenantId);
    if (fs.existsSync(tenantDir)) {
      try {
        fs.rmSync(tenantDir, { recursive: true });
      } catch (error) {
        this.log('WARN', `Failed to delete fallback tenant: ${error.message}`);
      }
    }
  }

  _getAllFallbackSecrets(tenantId) {
    const tenantDir = path.join(this.fallbackDir, tenantId);
    const secrets = [];

    if (fs.existsSync(tenantDir)) {
      try {
        const files = fs.readdirSync(tenantDir);
        for (const file of files) {
          if (file.endsWith('.secret')) {
            const key = file.replace('.secret', '');
            const value = fs.readFileSync(path.join(tenantDir, file), 'utf8');
            secrets.push({ key, value });
          }
        }
      } catch (error) {
        this.log('ERROR', `Failed to read fallback secrets: ${error.message}`);
      }
    }

    return secrets;
  }

  _listFallbackProjects() {
    const projects = [];

    if (fs.existsSync(this.fallbackDir)) {
      try {
        const dirs = fs.readdirSync(this.fallbackDir, { withFileTypes: true });
        for (const dir of dirs) {
          if (dir.isDirectory()) {
            projects.push({
              id: `fallback-${dir.name}`,
              name: dir.name,
              fallback: true
            });
          }
        }
      } catch (error) {
        this.log('ERROR', `Failed to list fallback projects: ${error.message}`);
      }
    }

    return projects;
  }

  // === LOGGING ===

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [SecretVault] [${level}] ${message}`;

    // Console output for DEBUG in development
    if (level !== 'DEBUG' || process.env.NODE_ENV !== 'production') {
      const prefix = {
        'DEBUG': '\x1b[90m',
        'INFO': '\x1b[32m',
        'WARN': '\x1b[33m',
        'ERROR': '\x1b[31m'
      }[level] || '';
      const reset = '\x1b[0m';
      console.log(`${prefix}${logLine}${reset}`);
    }

    // Audit log for important operations
    if (['INFO', 'WARN', 'ERROR'].includes(level)) {
      try {
        const logDir = path.dirname(this.auditLogPath);
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        fs.appendFileSync(this.auditLogPath, logLine + '\n');
      } catch (e) {
        // Silent fail for logging
      }
    }
  }

  // === CLI INTERFACE ===

  static async cli(args) {
    const vault = new SecretVault();
    const command = args[0];

    switch (command) {
      case '--health':
        const health = await vault.healthCheck();
        console.log('\n=== SecretVault Health Check ===');
        console.log(`Infisical Available: ${health.infisical ? '✅' : '❌'}`);
        console.log(`Authenticated: ${health.authenticated ? '✅' : '❌'}`);
        console.log(`Projects: ${health.projectCount}`);
        console.log(`Cache Size: ${health.cacheSize}`);
        console.log(`Fallback Available: ${health.fallbackAvailable ? '✅' : '❌'}`);
        break;

      case '--get':
        if (args.length < 3) {
          console.error('Usage: --get <tenantId> <key>');
          process.exit(1);
        }
        const value = await vault.getSecret(args[1], args[2]);
        console.log(value || '(not found)');
        break;

      case '--set':
        if (args.length < 4) {
          console.error('Usage: --set <tenantId> <key> <value>');
          process.exit(1);
        }
        await vault.setSecret(args[1], args[2], args[3]);
        console.log('✅ Secret set');
        break;

      case '--list':
        if (args.length < 2) {
          console.error('Usage: --list <tenantId>');
          process.exit(1);
        }
        const secrets = await vault.getAllSecrets(args[1]);
        console.log(`\n=== Secrets for ${args[1]} ===`);
        for (const s of secrets) {
          console.log(`  ${s.key}: ${'*'.repeat(Math.min(s.value?.length || 0, 20))}`);
        }
        console.log(`Total: ${secrets.length} secrets`);
        break;

      case '--projects':
        const projects = await vault.listProjects();
        console.log('\n=== Projects ===');
        for (const p of projects) {
          console.log(`  ${p.name} (${p.id})`);
        }
        console.log(`Total: ${projects.length} projects`);
        break;

      default:
        console.log(`
SecretVault CLI - Multi-Tenant Credential Management

Commands:
  --health              Check vault health
  --get <tenant> <key>  Get a secret
  --set <tenant> <key> <value>  Set a secret
  --list <tenant>       List all secrets for tenant
  --projects            List all projects

Environment Variables:
  INFISICAL_URL           Infisical server URL
  INFISICAL_CLIENT_ID     Machine Identity Client ID
  INFISICAL_CLIENT_SECRET Machine Identity Client Secret
  INFISICAL_ORG_ID        Organization ID
`);
    }
  }
}

// Export singleton instance
const vault = new SecretVault();
module.exports = vault;
module.exports.SecretVault = SecretVault;

// CLI entry point
if (require.main === module) {
  SecretVault.cli(process.argv.slice(2)).catch(console.error);
}
