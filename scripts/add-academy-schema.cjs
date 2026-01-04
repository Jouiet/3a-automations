#!/usr/bin/env node
/**
 * Add Schema.org Course/LearningResource to Academy Pages
 * Session 134 - 04/01/2026
 */

const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '..', 'landing-page-hostinger');
let totalAdded = 0;

// Course metadata
const courseMeta = {
  'demarrer.html': {
    name: 'Démarrer avec 3A Automation',
    description: 'Connexion de vos comptes, tour du tableau de bord, premières automations.',
    duration: 'PT30M',
    level: 'Débutant'
  },
  'leads.html': {
    name: 'Générer des Leads Qualifiés',
    description: 'Stratégies de génération de leads avec automatisation marketing.',
    duration: 'PT45M',
    level: 'Intermédiaire'
  },
  'emails.html': {
    name: 'Emails qui Convertissent',
    description: 'Création de séquences email performantes et automatisées.',
    duration: 'PT60M',
    level: 'Intermédiaire'
  },
  'analytics.html': {
    name: 'Piloter par la Data',
    description: 'Analytics et reporting pour optimiser vos performances.',
    duration: 'PT45M',
    level: 'Avancé'
  },
  'ecommerce.html': {
    name: 'Optimiser Votre Boutique',
    description: 'Automatisation e-commerce pour Shopify et WooCommerce.',
    duration: 'PT60M',
    level: 'Intermédiaire'
  },
  'contenu.html': {
    name: 'Contenu qui Engage',
    description: 'Création et distribution automatisée de contenu.',
    duration: 'PT45M',
    level: 'Intermédiaire'
  }
};

// Parcours metadata
const parcoursMeta = {
  'e-commerce.html': {
    name: 'Parcours E-commerce Optimisé',
    description: 'Maîtrisez l\'automatisation complète de votre boutique en ligne.',
    duration: 'PT4H',
    level: 'Débutant à Avancé'
  },
  'marketing-automation.html': {
    name: 'Parcours Marketing Automation',
    description: 'Devenez expert en automatisation marketing multi-canal.',
    duration: 'PT6H',
    level: 'Intermédiaire à Avancé'
  },
  'growth.html': {
    name: 'Parcours Growth Accéléré',
    description: 'Stratégies de croissance rapide avec l\'IA et l\'automatisation.',
    duration: 'PT5H',
    level: 'Avancé'
  }
};

function createCourseSchema(meta, url) {
  return `
  <!-- Schema.org Course -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "${meta.name}",
    "description": "${meta.description}",
    "provider": {
      "@type": "Organization",
      "name": "3A Automation",
      "url": "https://3a-automation.com"
    },
    "url": "${url}",
    "educationalLevel": "${meta.level}",
    "timeRequired": "${meta.duration}",
    "inLanguage": "fr",
    "isAccessibleForFree": true,
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "courseWorkload": "${meta.duration}"
    }
  }
  </script>`;
}

function createLearningResourceSchema(title, description, url) {
  return `
  <!-- Schema.org LearningResource -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": "${title}",
    "description": "${description}",
    "provider": {
      "@type": "Organization",
      "name": "3A Automation",
      "url": "https://3a-automation.com"
    },
    "url": "${url}",
    "educationalUse": "reference",
    "learningResourceType": "tutorial",
    "inLanguage": "fr",
    "isAccessibleForFree": true
  }
  </script>`;
}

function addSchemaToFile(filePath, schema) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has schema
  if (content.includes('application/ld+json')) {
    return false;
  }

  // Insert before </head>
  content = content.replace('</head>', `${schema}\n</head>`);
  fs.writeFileSync(filePath, content);
  return true;
}

// Process cours pages
const coursDir = path.join(basePath, 'academie', 'cours');
if (fs.existsSync(coursDir)) {
  fs.readdirSync(coursDir).filter(f => f.endsWith('.html')).forEach(file => {
    const filePath = path.join(coursDir, file);
    const meta = courseMeta[file];
    if (meta) {
      const url = `https://3a-automation.com/academie/cours/${file}`;
      const schema = createCourseSchema(meta, url);
      if (addSchemaToFile(filePath, schema)) {
        console.log(`✅ Added Course schema: academie/cours/${file}`);
        totalAdded++;
      }
    }
  });
}

// Process parcours pages
const parcoursDir = path.join(basePath, 'academie', 'parcours');
if (fs.existsSync(parcoursDir)) {
  fs.readdirSync(parcoursDir).filter(f => f.endsWith('.html')).forEach(file => {
    const filePath = path.join(parcoursDir, file);
    const meta = parcoursMeta[file];
    if (meta) {
      const url = `https://3a-automation.com/academie/parcours/${file}`;
      const schema = createCourseSchema(meta, url);
      if (addSchemaToFile(filePath, schema)) {
        console.log(`✅ Added Course schema: academie/parcours/${file}`);
        totalAdded++;
      }
    }
  });
}

// Process guides.html
const guidesPath = path.join(basePath, 'academie', 'guides.html');
if (fs.existsSync(guidesPath)) {
  const schema = createLearningResourceSchema(
    'Guides Rapides 3A Automation',
    'Collection de guides pratiques pour configurer et optimiser vos automatisations.',
    'https://3a-automation.com/academie/guides.html'
  );
  if (addSchemaToFile(guidesPath, schema)) {
    console.log('✅ Added LearningResource schema: academie/guides.html');
    totalAdded++;
  }
}

console.log(`\n📊 Total schemas added: ${totalAdded}`);
