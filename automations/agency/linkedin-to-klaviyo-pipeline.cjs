#!/usr/bin/env node
/**
 * LINKEDIN → KLAVIYO PIPELINE
 *
 * Complete B2B lead generation workflow:
 * 1. Scrape LinkedIn profiles with emails (Apify)
 * 2. Intelligent segmentation by position/title
 * 3. Push to Klaviyo with rich properties
 * 4. Send personalized emails directly per segment
 *
 * USAGE:
 *   node linkedin-to-klaviyo-pipeline.cjs --search="marketing director morocco" --max=50
 *   node linkedin-to-klaviyo-pipeline.cjs --input=profiles.json
 *   node linkedin-to-klaviyo-pipeline.cjs --test  (dry run with mock data)
 *
 * SEGMENTS:
 *   decision_maker - CEO, Director, VP, Founder...
 *   marketing      - Marketing, Growth, Brand...
 *   sales          - Sales, Business Development...
 *   tech           - Developer, Engineer, CTO...
 *   hr             - HR, Recruiting, Talent...
 *   other          - Default fallback
 *
 * OUTPUT:
 *   - Profiles in Klaviyo with segment property
 *   - Segment-specific lists (auto-created)
 *   - Event "LinkedIn Lead Captured" for flow triggers
 *   - Personalized email content stored as properties
 *
 * Created: 2025-12-29 | Session 112
 * Category: B2B Lead Generation Pipeline
 * Reusable: YES - Core agency workflow
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');

// Import LinkedIn scraper module
const linkedinScraper = require('../generic/scrape-linkedin-profiles.cjs');

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
  // Klaviyo
  KLAVIYO_API_KEY: process.env.KLAVIYO_API_KEY,
  KLAVIYO_API_URL: 'https://a.klaviyo.com/api',
  KLAVIYO_REVISION: '2024-02-15',

  // Lists per segment (auto-created if don't exist)
  SEGMENT_LISTS: {
    decision_maker: 'LinkedIn - Decision Makers',
    marketing: 'LinkedIn - Marketing',
    sales: 'LinkedIn - Sales',
    tech: 'LinkedIn - Tech',
    hr: 'LinkedIn - HR',
    other: 'LinkedIn - Other',
  },

  // Output
  OUTPUT_DIR: path.join(__dirname, '..', '..', 'outputs'),

  // Rate limiting
  DELAY_BETWEEN_PROFILES: 200, // ms
};

// ========================================
// SEGMENTATION INTELLIGENCE
// ========================================

const SEGMENT_KEYWORDS = {
  decision_maker: [
    // C-Level
    'ceo', 'cfo', 'coo', 'cmo', 'cto', 'cio', 'cpo', 'cro',
    'chief', 'c-level',
    // Founders
    'founder', 'co-founder', 'cofounder', 'fondateur', 'cofondateur',
    // Directors
    'director', 'directeur', 'directrice', 'managing director',
    // VPs
    'vp ', 'vice president', 'vice-president', 'svp', 'evp', 'avp',
    // Heads
    'head of', 'head ', 'chef de',
    // Owners
    'owner', 'partner', 'associé', 'gérant', 'président', 'president',
    // General Manager
    'gm', 'general manager', 'directeur général', 'dg',
  ],

  marketing: [
    'marketing', 'growth', 'brand', 'branding',
    'content', 'social media', 'digital',
    'communication', 'communications', 'pr ', 'public relations',
    'user acquisition', 'customer acquisition', 'demand gen', 'demand generation',
    'seo', 'sem', 'ppc', 'performance marketing',
    'email marketing', 'crm ', 'lifecycle',
    'product marketing', 'pmm',
    'creative director', 'art director',
  ],

  sales: [
    'sales', 'vente', 'commercial',
    'business development', 'bd ', 'bdr', 'sdr',
    'account executive', 'account manager', 'ae ',
    'revenue', 'partnership', 'alliances',
    'customer success', 'cs ', 'csm',
    'key account', 'enterprise sales',
    'inside sales', 'field sales',
  ],

  tech: [
    'cto', 'vp engineering', 'vp of engineering',
    'developer', 'développeur', 'engineer', 'ingénieur',
    'software', 'backend', 'frontend', 'fullstack', 'full-stack',
    'devops', 'sre', 'infrastructure',
    'data scientist', 'data engineer', 'ml ', 'machine learning', 'ai ',
    'architect', 'tech lead', 'technical lead', 'lead dev',
    'it manager', 'it director', 'dsi', 'ciso',
    'product manager', 'product owner', 'pm ', 'po ',
  ],

  hr: [
    'hr ', 'human resources', 'ressources humaines', 'rh ',
    'talent', 'recruiter', 'recruiting', 'recruitment', 'recrutement',
    'people', 'people ops', 'people operations',
    'culture', 'employer branding',
    'compensation', 'benefits', 'payroll',
    'learning', 'l&d', 'training', 'formation',
    'hrbp', 'hr business partner',
  ],
};

// Segment priority (higher = checked first)
const SEGMENT_PRIORITY = ['decision_maker', 'tech', 'marketing', 'sales', 'hr', 'other'];

/**
 * Segment a profile based on position/headline
 */
function segmentProfile(profile) {
  const searchText = `${profile.position || ''} ${profile.headline || ''} ${profile.title || ''}`.toLowerCase();

  // Check segments in priority order
  for (const segment of SEGMENT_PRIORITY) {
    if (segment === 'other') continue;

    const keywords = SEGMENT_KEYWORDS[segment];
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return segment;
      }
    }
  }

  return 'other';
}

/**
 * Get segment display name
 */
function getSegmentDisplayName(segment) {
  const names = {
    decision_maker: 'Decision Maker',
    marketing: 'Marketing',
    sales: 'Sales',
    tech: 'Tech',
    hr: 'HR',
    other: 'General',
  };
  return names[segment] || segment;
}

// ========================================
// EMAIL TEMPLATES (Personalized per segment)
// ========================================

const EMAIL_TEMPLATES = {
  decision_maker: {
    subject: "{{first_name}} - Automatisation pour {{company}}",
    body: `Bonjour {{first_name}},

Nous avons identifié {{company}} comme une entreprise qui pourrait bénéficier de nos solutions d'automatisation.

3A Automation aide les dirigeants e-commerce et PME B2B à :
• Automatiser les tâches répétitives (reporting, emails, data sync)
• Récupérer 10-15h par semaine sur les processus manuels
• Connecter leurs outils existants sans friction

Résultat typique : nos clients obtiennent un ROI de 25%+ sur leur revenue email et éliminent les tâches manuelles chronophages.

Seriez-vous disponible pour un échange de 15 minutes ?

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },

  marketing: {
    subject: "{{first_name}} - Automatisation marketing pour {{company}}",
    body: `Bonjour {{first_name}},

En tant que professionnel du marketing chez {{company}}, vous connaissez le temps perdu sur les tâches répétitives.

3A Automation accompagne les équipes marketing pour :
• Automatiser newsletters et séquences email (gain: 8h/semaine)
• Synchroniser CRM ↔ Outils marketing en temps réel
• Créer des dashboards analytics automatisés
• Optimiser les flows Klaviyo et HubSpot

Notre expertise : Klaviyo, HubSpot, et les intégrations e-commerce.

Intéressé(e) par une démo de 15 minutes adaptée à {{company}} ?

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },

  sales: {
    subject: "{{first_name}} - Automatisation prospection {{company}}",
    body: `Bonjour {{first_name}},

Les équipes commerciales perdent en moyenne 20% de leur temps sur des tâches administratives.

3A Automation propose des solutions pour :
• Automatiser la prospection LinkedIn et l'enrichissement de leads
• Créer des séquences d'emails de suivi personnalisées
• Synchroniser automatiquement les données CRM
• Déclencher des relances intelligentes basées sur l'engagement

Résultat typique : +30% de temps dédié à la vente pure.

Souhaitez-vous voir comment {{company}} pourrait en bénéficier ?

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },

  tech: {
    subject: "{{first_name}} - APIs & Automations pour {{company}}",
    body: `Bonjour {{first_name}},

En tant que profil tech chez {{company}}, vous apprécierez notre approche technique :

• Intégrations API robustes (REST, webhooks, GraphQL)
• Workflows Node.js natifs et scripts maintenables
• Architecture event-driven et scalable
• Documentation technique complète

Notre stack : Node.js, Apify, Claude, Gemini, Klaviyo, Shopify.

Résultat : 90% de réduction du temps d'intégration grâce à notre approche hybride code + low-code.

Seriez-vous disponible pour un échange technique de 15 minutes ?

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },

  hr: {
    subject: "{{first_name}} - Automatisation RH pour {{company}}",
    body: `Bonjour {{first_name}},

Les équipes RH passent des heures sur des tâches répétitives :

• Tri de CVs et réponses automatiques → Automatisable
• Planification d'entretiens → Automatisable
• Onboarding des nouveaux collaborateurs → Automatisable
• Processus de recrutement et suivi des candidatures → Automatisable

Nos clients RH ont réduit de 60% leur temps admin grâce à nos automations.

Intéressé(e) par une discussion sur les besoins de {{company}} ?

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },

  other: {
    subject: "{{first_name}} - Automatisation pour {{company}}",
    body: `Bonjour {{first_name}},

3A Automation est une agence spécialisée en automatisation AI pour l'e-commerce et les PME B2B.

Nos domaines d'expertise :
• Email & Marketing Automation (Klaviyo, HubSpot)
• Intégrations et synchronisation de données
• Lead Generation & Nurturing automatisé
• Workflows métier sur mesure

Nos clients récupèrent 10-20h/semaine et augmentent leur revenue email de 25%+.

Seriez-vous disponible pour un échange de 15 minutes ?

Cordialement,
L'équipe 3A Automation
Automation. Analytics. AI.
https://3a-automation.com`,
  },
};

/**
 * Personalize email template with profile data
 */
function personalizeEmail(template, profile) {
  let subject = template.subject;
  let body = template.body;

  const firstName = profile.firstName || profile.fullName?.split(' ')[0] || '';
  const lastName = profile.lastName || profile.fullName?.split(' ').slice(1).join(' ') || '';

  const replacements = {
    '{{first_name}}': firstName || 'there',
    '{{last_name}}': lastName,
    '{{full_name}}': profile.fullName || firstName,
    '{{company}}': profile.company || 'votre entreprise',
    '{{position}}': profile.position || profile.headline?.split(' at ')[0] || 'votre poste',
    '{{industry}}': profile.industry || 'votre secteur',
    '{{location}}': profile.location || '',
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  return { subject, body };
}

// ========================================
// KLAVIYO API
// ========================================

async function klaviyoRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Klaviyo-API-Key ${CONFIG.KLAVIYO_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'revision': CONFIG.KLAVIYO_REVISION,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${CONFIG.KLAVIYO_API_URL}${endpoint}`, options);

  // Handle 409 Conflict (duplicate) specially
  if (response.status === 409) {
    const error = await response.json();
    const duplicateId = error.errors?.[0]?.meta?.duplicate_profile_id;
    if (duplicateId) {
      return { duplicate: true, existingId: duplicateId };
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Klaviyo API ${response.status}: ${errorText}`);
  }

  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return { success: true };
  }

  return response.json();
}

/**
 * Get or create a Klaviyo list
 */
async function getOrCreateList(listName) {
  // Get existing lists
  const listsResponse = await klaviyoRequest('/lists/');
  const existingList = listsResponse.data?.find(l => l.attributes.name === listName);

  if (existingList) {
    return existingList.id;
  }

  // Create new list
  const createResponse = await klaviyoRequest('/lists/', 'POST', {
    data: {
      type: 'list',
      attributes: {
        name: listName,
      },
    },
  });

  console.log(`   📋 Created list: ${listName}`);
  return createResponse.data.id;
}

/**
 * Create or update a profile in Klaviyo
 */
async function createOrUpdateProfile(profile, segment, emailContent) {
  const profileData = {
    data: {
      type: 'profile',
      attributes: {
        email: profile.email,
        first_name: profile.firstName || profile.fullName?.split(' ')[0],
        last_name: profile.lastName || profile.fullName?.split(' ').slice(1).join(' '),
        location: profile.location ? { city: profile.location } : undefined,
        properties: {
          // LinkedIn data
          linkedin_url: profile.linkedinUrl,
          linkedin_headline: profile.headline,
          company: profile.company,
          position: profile.position,
          industry: profile.industry,
          connections: profile.connections,
          experience_years: profile.experienceYears,

          // Segmentation
          lead_segment: segment,
          lead_segment_display: getSegmentDisplayName(segment),
          lead_source: 'linkedin_scraper',
          lead_scraped_at: profile.scrapedAt || new Date().toISOString(),

          // Pre-generated personalized email
          personalized_email_subject: emailContent.subject,
          personalized_email_body: emailContent.body,
        },
      },
    },
  };

  try {
    const response = await klaviyoRequest('/profiles/', 'POST', profileData);

    // Check for duplicate response
    if (response.duplicate) {
      // Update existing profile
      const updateData = { ...profileData };
      updateData.data.id = response.existingId;
      await klaviyoRequest(`/profiles/${response.existingId}/`, 'PATCH', updateData);
      return { success: true, id: response.existingId, isNew: false };
    }

    return { success: true, id: response.data.id, isNew: true };

  } catch (err) {
    // Re-throw for caller to handle
    throw err;
  }
}

/**
 * Add profiles to a list
 */
async function addProfilesToList(profileIds, listId) {
  if (profileIds.length === 0) return;

  // Klaviyo accepts max 100 profiles per request
  const chunks = [];
  for (let i = 0; i < profileIds.length; i += 100) {
    chunks.push(profileIds.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    await klaviyoRequest(`/lists/${listId}/relationships/profiles/`, 'POST', {
      data: chunk.map(id => ({ type: 'profile', id })),
    });
  }
}

/**
 * Track an event for a profile (triggers Flows)
 */
async function trackEvent(profileId, eventName, properties) {
  await klaviyoRequest('/events/', 'POST', {
    data: {
      type: 'event',
      attributes: {
        metric: {
          data: {
            type: 'metric',
            attributes: {
              name: eventName,
            },
          },
        },
        profile: {
          data: {
            type: 'profile',
            id: profileId,
          },
        },
        properties: properties,
        time: new Date().toISOString(),
      },
    },
  });
}

// ========================================
// PIPELINE
// ========================================

async function runPipeline(options) {
  console.log('================================================================================');
  console.log('LINKEDIN → KLAVIYO PIPELINE (Segmented + Personalized)');
  console.log('================================================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Mode: ${options.dryRun ? 'DRY RUN (no Klaviyo calls)' : 'LIVE'}`);
  console.log('================================================================================');

  // Validate configuration
  if (!options.dryRun && !CONFIG.KLAVIYO_API_KEY) {
    throw new Error('KLAVIYO_API_KEY not configured in .env');
  }

  let profiles = [];

  // ===== STEP 1: Get LinkedIn profiles =====
  if (options.testData) {
    console.log('\n📋 Using test data (mock profiles)...');
    profiles = generateTestData();
  } else if (options.inputFile) {
    console.log(`\n📂 Loading profiles from: ${options.inputFile}`);
    const data = fs.readFileSync(options.inputFile, 'utf-8');
    profiles = JSON.parse(data);
  } else if (options.search) {
    console.log(`\n🔍 Scraping LinkedIn for: "${options.search}"`);
    console.log(`   Max profiles: ${options.max}`);

    const rawProfiles = await linkedinScraper.scrapeProfilesBySearch(
      options.search,
      options.max || 50
    );
    profiles = rawProfiles.map(linkedinScraper.normalizeProfile);
  } else {
    throw new Error('No input specified. Use --search, --input, or --test');
  }

  console.log(`\n📊 Total profiles loaded: ${profiles.length}`);

  // Filter profiles with valid emails
  const profilesWithEmail = profiles.filter(p => p.email && p.email.includes('@'));
  console.log(`📧 Profiles with valid email: ${profilesWithEmail.length}`);

  if (profilesWithEmail.length === 0) {
    console.log('\n⚠️ No profiles with emails found.');
    if (profiles.length > 0) {
      console.log('   Hint: LinkedIn email extraction requires premium Apify actors.');
    }
    return { success: false, reason: 'no_emails' };
  }

  // ===== STEP 2: Segment profiles =====
  console.log('\n🏷️  Segmenting profiles by position...');

  const segmentedProfiles = profilesWithEmail.map(p => {
    const segment = segmentProfile(p);
    const template = EMAIL_TEMPLATES[segment];
    const emailContent = personalizeEmail(template, p);

    return {
      ...p,
      segment,
      segmentDisplay: getSegmentDisplayName(segment),
      emailSubject: emailContent.subject,
      emailBody: emailContent.body,
    };
  });

  // Count per segment
  const segmentCounts = {};
  for (const p of segmentedProfiles) {
    segmentCounts[p.segment] = (segmentCounts[p.segment] || 0) + 1;
  }

  console.log('\n   Segment distribution:');
  for (const [segment, count] of Object.entries(segmentCounts).sort((a, b) => b[1] - a[1])) {
    const pct = ((count / segmentedProfiles.length) * 100).toFixed(1);
    console.log(`   • ${getSegmentDisplayName(segment)}: ${count} (${pct}%)`);
  }

  // ===== STEP 3: Preview a sample =====
  console.log('\n📝 Sample personalized email (first profile):');
  const sample = segmentedProfiles[0];
  console.log(`   Segment: ${sample.segmentDisplay}`);
  console.log(`   To: ${sample.email}`);
  console.log(`   Subject: ${sample.emailSubject}`);
  console.log(`   ---`);
  console.log(sample.emailBody.split('\n').map(l => `   ${l}`).join('\n'));
  console.log(`   ---`);

  // Dry run stops here
  if (options.dryRun) {
    console.log('\n⚠️ DRY RUN - Stopping before Klaviyo API calls');
    saveResults(segmentedProfiles, options, { dryRun: true });
    return { success: true, dryRun: true, profiles: segmentedProfiles };
  }

  // ===== STEP 4: Create/get Klaviyo lists per segment =====
  console.log('\n📋 Setting up Klaviyo lists...');
  const listIds = {};

  for (const segment of Object.keys(segmentCounts)) {
    const listName = CONFIG.SEGMENT_LISTS[segment];
    listIds[segment] = await getOrCreateList(listName);
    console.log(`   ✅ ${listName}: ${listIds[segment]}`);
  }

  // ===== STEP 5: Push profiles to Klaviyo =====
  console.log('\n👥 Pushing profiles to Klaviyo...');

  const results = {
    created: 0,
    updated: 0,
    errors: 0,
    errorDetails: [],
    bySegment: {},
  };

  const profilesBySegment = {};

  for (let i = 0; i < segmentedProfiles.length; i++) {
    const profile = segmentedProfiles[i];

    try {
      // Create/update profile
      const emailContent = { subject: profile.emailSubject, body: profile.emailBody };
      const result = await createOrUpdateProfile(profile, profile.segment, emailContent);

      if (result.isNew) {
        results.created++;
      } else {
        results.updated++;
      }

      // Track for list addition
      if (!profilesBySegment[profile.segment]) {
        profilesBySegment[profile.segment] = [];
      }
      profilesBySegment[profile.segment].push(result.id);

      // Track event (triggers Klaviyo Flows)
      await trackEvent(result.id, 'LinkedIn Lead Captured', {
        segment: profile.segment,
        segment_display: profile.segmentDisplay,
        company: profile.company,
        position: profile.position,
        email_subject: profile.emailSubject,
        source: 'linkedin_to_klaviyo_pipeline',
      });

      // Progress indicator
      process.stdout.write(`   ${i + 1}/${segmentedProfiles.length}\r`);

      // Rate limiting
      await new Promise(r => setTimeout(r, CONFIG.DELAY_BETWEEN_PROFILES));

    } catch (err) {
      results.errors++;
      results.errorDetails.push({ email: profile.email, error: err.message });
      console.error(`\n   ❌ Error for ${profile.email}: ${err.message}`);
    }
  }

  console.log(`   Done!                    `);

  // ===== STEP 6: Add profiles to segment lists =====
  console.log('\n📋 Adding profiles to segment lists...');

  for (const [segment, profileIds] of Object.entries(profilesBySegment)) {
    if (profileIds.length > 0 && listIds[segment]) {
      await addProfilesToList(profileIds, listIds[segment]);
      console.log(`   ✅ ${CONFIG.SEGMENT_LISTS[segment]}: +${profileIds.length} profiles`);
      results.bySegment[segment] = profileIds.length;
    }
  }

  // ===== STEP 7: Save results =====
  const outputPath = saveResults(segmentedProfiles, options, results);

  // ===== Summary =====
  console.log('\n================================================================================');
  console.log('PIPELINE COMPLETE');
  console.log('================================================================================');
  console.log(`✅ Profiles created:  ${results.created}`);
  console.log(`🔄 Profiles updated:  ${results.updated}`);
  console.log(`❌ Errors:            ${results.errors}`);
  console.log('\n📊 By Segment:');
  for (const [segment, count] of Object.entries(results.bySegment)) {
    console.log(`   ${getSegmentDisplayName(segment)}: ${count}`);
  }
  console.log(`\n📁 Results saved to: ${outputPath}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Create Klaviyo Flow triggered on "LinkedIn Lead Captured" event');
  console.log('   2. Use profile property "personalized_email_subject" as subject');
  console.log('   3. Use profile property "personalized_email_body" as email body');
  console.log('   4. Or segment by "lead_segment" for different email templates');

  return results;
}

/**
 * Save results to JSON file
 */
function saveResults(profiles, options, results) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `linkedin-klaviyo-pipeline-${timestamp}.json`;
  const outputPath = path.join(CONFIG.OUTPUT_DIR, filename);

  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }

  const outputData = {
    timestamp: new Date().toISOString(),
    search: options.search || options.inputFile || 'test',
    totalProfiles: profiles.length,
    results: results,
    profiles: profiles,
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

  return outputPath;
}

/**
 * Generate test data for dry runs
 */
function generateTestData() {
  return [
    {
      email: 'sarah.marketing@example.com',
      firstName: 'Sarah',
      lastName: 'Martin',
      fullName: 'Sarah Martin',
      company: 'TechCorp Morocco',
      position: 'Marketing Director',
      headline: 'Marketing Director at TechCorp Morocco | Growth & Brand',
      industry: 'Technology',
      location: 'Casablanca, Morocco',
      linkedinUrl: 'https://linkedin.com/in/sarahmartin',
      connections: 1500,
      scrapedAt: new Date().toISOString(),
    },
    {
      email: 'ahmed.ceo@example.com',
      firstName: 'Ahmed',
      lastName: 'Benali',
      fullName: 'Ahmed Benali',
      company: 'StartupHub',
      position: 'CEO & Founder',
      headline: 'CEO & Founder at StartupHub | Entrepreneur',
      industry: 'Startups',
      location: 'Rabat, Morocco',
      linkedinUrl: 'https://linkedin.com/in/ahmedbenali',
      connections: 3000,
      scrapedAt: new Date().toISOString(),
    },
    {
      email: 'jean.dev@example.com',
      firstName: 'Jean',
      lastName: 'Dupont',
      fullName: 'Jean Dupont',
      company: 'CodeFactory',
      position: 'Senior Software Engineer',
      headline: 'Senior Software Engineer | Node.js & Python',
      industry: 'Software',
      location: 'Paris, France',
      linkedinUrl: 'https://linkedin.com/in/jeandupont',
      connections: 800,
      scrapedAt: new Date().toISOString(),
    },
    {
      email: 'fatima.sales@example.com',
      firstName: 'Fatima',
      lastName: 'El Amrani',
      fullName: 'Fatima El Amrani',
      company: 'SalesForce Partner',
      position: 'Business Development Manager',
      headline: 'Business Development Manager | B2B Sales',
      industry: 'Sales',
      location: 'Marrakech, Morocco',
      linkedinUrl: 'https://linkedin.com/in/fatimaelamrani',
      connections: 2200,
      scrapedAt: new Date().toISOString(),
    },
    {
      email: 'marie.hr@example.com',
      firstName: 'Marie',
      lastName: 'Lambert',
      fullName: 'Marie Lambert',
      company: 'PeopleFirst',
      position: 'HR Director',
      headline: 'HR Director | Talent Acquisition & Culture',
      industry: 'Human Resources',
      location: 'Lyon, France',
      linkedinUrl: 'https://linkedin.com/in/marielambert',
      connections: 1800,
      scrapedAt: new Date().toISOString(),
    },
  ];
}

// ========================================
// CLI
// ========================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
LINKEDIN → KLAVIYO PIPELINE

Complete B2B lead generation workflow with intelligent segmentation.

USAGE:
  node linkedin-to-klaviyo-pipeline.cjs --search="marketing director morocco" --max=50
  node linkedin-to-klaviyo-pipeline.cjs --input=profiles.json
  node linkedin-to-klaviyo-pipeline.cjs --test          # Dry run with mock data
  node linkedin-to-klaviyo-pipeline.cjs --test --live   # Test data, real Klaviyo

OPTIONS:
  --search=QUERY    LinkedIn search query (requires APIFY_TOKEN)
  --max=NUMBER      Maximum profiles to scrape (default: 50)
  --input=FILE      Load profiles from JSON file
  --test            Use mock test data (no Apify call)
  --dry-run         Preview without Klaviyo API calls
  --live            Actually call Klaviyo (with --test)
  --help, -h        Show this help

SEGMENTS:
  decision_maker    CEO, Director, VP, Founder, Head of...
  marketing         Marketing, Growth, Brand, Content, Digital...
  sales             Sales, Business Development, Account...
  tech              Developer, Engineer, CTO, Data...
  hr                HR, Recruiting, Talent, People...
  other             Default for unmatched profiles

KLAVIYO OUTPUT:
  - Profiles with rich properties (company, position, segment...)
  - Auto-created lists per segment (LinkedIn - Marketing, etc.)
  - Event "LinkedIn Lead Captured" for Flow triggers
  - Pre-personalized email subject/body as profile properties

ENVIRONMENT VARIABLES:
  APIFY_TOKEN       Required for LinkedIn scraping
  KLAVIYO_API_KEY   Required for Klaviyo integration

EXAMPLE WORKFLOW:
  1. Scrape: node linkedin-to-klaviyo-pipeline.cjs --search="cto france" --max=100
  2. Create Klaviyo Flow on event "LinkedIn Lead Captured"
  3. Email uses {{ personalized_email_subject }} and {{ personalized_email_body }}
    `);
    process.exit(0);
  }

  // Parse arguments
  const searchArg = args.find(a => a.startsWith('--search='));
  const inputArg = args.find(a => a.startsWith('--input='));
  const maxArg = args.find(a => a.startsWith('--max='));
  const testMode = args.includes('--test');
  const dryRun = args.includes('--dry-run') || (testMode && !args.includes('--live'));

  const options = {
    search: searchArg ? searchArg.split('=').slice(1).join('=') : null,
    inputFile: inputArg ? inputArg.split('=')[1] : null,
    max: maxArg ? parseInt(maxArg.split('=')[1]) : 50,
    testData: testMode,
    dryRun: dryRun,
  };

  if (!options.search && !options.inputFile && !options.testData) {
    console.error('❌ No input specified. Use --search, --input, or --test');
    console.error('   Run with --help for usage');
    process.exit(1);
  }

  try {
    await runPipeline(options);
  } catch (error) {
    console.error('\n❌ Pipeline error:', error.message);
    process.exit(1);
  }
}

// Export for module use
module.exports = {
  runPipeline,
  segmentProfile,
  personalizeEmail,
  EMAIL_TEMPLATES,
  SEGMENT_KEYWORDS,
  getSegmentDisplayName,
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}
