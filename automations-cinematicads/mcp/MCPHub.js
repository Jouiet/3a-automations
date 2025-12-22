// automations/mcp/MCPHub.js
// ⚠️ DEPRECATED - Use Claude Code native MCPs instead
// Claude Code manages MCPs natively via ~/.config/claude-code/mcp.json
//
// Available MCPs (configured in Claude Code):
// - chrome-devtools: Browser debugging, screenshots, DOM inspection
// - playwright: Browser automation, scraping, testing
// - github: Repository management, issues, PRs
// - hostinger: VPS management, deployment
// - klaviyo: Email marketing automation
// - google-analytics: GA4 data access
// - google-sheets: Spreadsheet automation
//
// Migration: Remove MCPHub usage from your code. MCPs are called directly
// by Claude Code when needed. No manual server management required.
//
// Example (old):
//   const mcp = new MCPHub();
//   await mcp.boot();
//   await mcp.callTool('playwright', 'navigate', { url: '...' });
//
// Example (new):
//   // Just ask Claude Code to use playwright - it handles MCP automatically
//   // "Use playwright to navigate to example.com and take a screenshot"

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Logger = require('../core/Logger');
const readline = require('readline');

/**
 * @deprecated Use Claude Code native MCPs instead
 * This class is kept for backward compatibility but should not be used in new code.
 */
class MCPHub {
    constructor() {
        this.logger = new Logger('MCP-Hub');
        this.logger.warn('⚠️ MCPHub is DEPRECATED. Use Claude Code native MCPs.');
        this.logger.warn('   MCPs: ~/.config/claude-code/mcp.json');
        this.configPath = path.join(__dirname, 'mcp-config.json');
        this.activeServers = new Map();
        this.pendingRequests = new Map();
    }

    /**
     * Initializes and starts all configured MCP servers.
     */
    async boot() {
        this.logger.info('Booting MCP Ecosystem...');
        if (!fs.existsSync(this.configPath)) {
            this.logger.error('mcp-config.json not found.');
            return;
        }
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));

        for (const [name, serverDef] of Object.entries(config.mcpServers)) {
            try {
                this.logger.info(`Starting MCP Server: ${name}...`);
                
                const serverProcess = spawn(serverDef.command, serverDef.args, {
                    env: { ...process.env, ...serverDef.env },
                    stdio: ['pipe', 'pipe', 'inherit']
                });

                const rl = readline.createInterface({
                    input: serverProcess.stdout,
                    terminal: false
                });

                rl.on('line', (line) => {
                    try {
                        const response = JSON.parse(line);
                        if (response.id && this.pendingRequests.has(response.id)) {
                            const { resolve, reject } = this.pendingRequests.get(response.id);
                            if (response.error) {
                                reject(response.error);
                            } else {
                                resolve(response.result);
                            }
                            this.pendingRequests.delete(response.id);
                        }
                    } catch (e) {
                        this.logger.warn(`Failed to parse MCP response from ${name}: ${line}`);
                    }
                });

                serverProcess.on('error', (err) => {
                    this.logger.error(`MCP Server ${name} process error: ${err.message}`);
                });

                serverProcess.on('exit', (code) => {
                    this.logger.warn(`MCP Server ${name} exited with code ${code}`);
                    this.activeServers.delete(name);
                });

                this.activeServers.set(name, serverProcess);
                this.logger.success(`MCP Server ${name} is ONLINE.`);

            } catch (error) {
                this.logger.error(`Failed to start ${name}: ${error.message}`);
            }
        }
    }

    /**
     * Sends a tool execution request to a specific MCP server and waits for response.
     */
    async callTool(serverName, toolName, params) {
        this.logger.info(`Invoking Tool [${toolName}] on [${serverName}]...`);
        const server = this.activeServers.get(serverName);
        
        if (!server) {
            throw new Error(`MCP Server ${serverName} is not active.`);
        }

        const id = Math.random().toString(36).substring(7);
        const request = {
            jsonrpc: "2.0",
            id: id,
            method: "tools/call",
            params: { name: toolName, arguments: params }
        };

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            server.stdin.write(JSON.stringify(request) + '\n');
            
            // Timeout safety
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`MCP Tool call timeout: ${toolName}`));
                }
            }, 30000);
        });
    }

    shutdown() {
        for (const [name, process] of this.activeServers) {
            this.logger.info(`Stopping ${name}...`);
            process.kill();
        }
    }
}

module.exports = MCPHub;