#!/usr/bin/env node
/**
 * env-loader.cjs
 * Chargement standardisé du fichier .env depuis n'importe quel script
 *
 * Usage dans les scripts:
 *   require('../lib/env-loader.cjs');
 *
 * OU pour scripts dans sous-dossiers:
 *   require('../../lib/env-loader.cjs');
 */

const path = require('path');
const fs = require('fs');

// Trouver la racine du projet (contient .env)
function findProjectRoot(startDir) {
  let currentDir = startDir;

  // Remonter jusqu'à trouver .env ou atteindre la racine
  while (currentDir !== path.dirname(currentDir)) {
    const envPath = path.join(currentDir, '.env');
    if (fs.existsSync(envPath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  // Fallback: essayer /Users/mac/Desktop/JO-AAA
  const fallback = '/Users/mac/Desktop/JO-AAA';
  if (fs.existsSync(path.join(fallback, '.env'))) {
    return fallback;
  }

  return null;
}

const projectRoot = findProjectRoot(__dirname);

if (!projectRoot) {
  console.error('❌ ERREUR: Fichier .env non trouvé dans le projet');
  console.error('   Vérifiez que .env existe à la racine du projet');
  process.exit(1);
}

// Charger .env
require('dotenv').config({ path: path.join(projectRoot, '.env') });

// Exporter le chemin racine pour utilisation dans les scripts
module.exports = {
  projectRoot,
  envPath: path.join(projectRoot, '.env'),
  outputsDir: path.join(projectRoot, 'outputs'),
};
