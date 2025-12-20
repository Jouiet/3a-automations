#!/usr/bin/env node
/**
 * AUDIT ACCENTS FRANÇAIS - 3A Automation
 * Détecte les fautes d'orthographe liées aux accents manquants
 * Date: 2025-12-20
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';

// Mots français courants avec leurs formes incorrectes (sans accent)
// Format: [forme_incorrecte, forme_correcte, contexte]
const ACCENT_ERRORS = [
  // É (e accent aigu)
  ['specialise', 'spécialisé', 'participe'],
  ['specialises', 'spécialisés', 'participe'],
  ['specialisee', 'spécialisée', 'participe'],
  ['integre', 'intègre', 'verbe'],
  ['integrer', 'intégrer', 'verbe'],
  ['integration', 'intégration', 'nom'],
  ['systeme', 'système', 'nom'],
  ['systemes', 'systèmes', 'nom'],
  ['methode', 'méthode', 'nom'],
  ['methodes', 'méthodes', 'nom'],
  ['probleme', 'problème', 'nom'],
  ['problemes', 'problèmes', 'nom'],
  ['reponse', 'réponse', 'nom'],
  ['reponses', 'réponses', 'nom'],
  ['resume', 'résumé', 'nom'],
  ['resultat', 'résultat', 'nom'],
  ['resultats', 'résultats', 'nom'],
  ['securite', 'sécurité', 'nom'],
  ['securites', 'sécurités', 'nom'],
  ['genere', 'génère', 'verbe'],
  ['generer', 'générer', 'verbe'],
  ['generation', 'génération', 'nom'],
  ['realise', 'réalisé', 'participe'],
  ['realiser', 'réaliser', 'verbe'],
  ['realisation', 'réalisation', 'nom'],
  ['cree', 'créé', 'participe'],
  ['creer', 'créer', 'verbe'],
  ['creation', 'création', 'nom'],
  ['equipe', 'équipe', 'nom'],
  ['equipes', 'équipes', 'nom'],
  ['experience', 'expérience', 'nom'],
  ['experiences', 'expériences', 'nom'],
  ['efficacite', 'efficacité', 'nom'],
  ['qualite', 'qualité', 'nom'],
  ['realite', 'réalité', 'nom'],
  ['verite', 'vérité', 'nom'],
  ['liberte', 'liberté', 'nom'],
  ['societe', 'société', 'nom'],
  ['activite', 'activité', 'nom'],
  ['activites', 'activités', 'nom'],
  ['automatise', 'automatisé', 'participe'],
  ['automatisee', 'automatisée', 'participe'],
  ['automatiser', 'automatiser', 'verbe'], // OK mais vérifier
  ['optimise', 'optimisé', 'participe'],
  ['optimisee', 'optimisée', 'participe'],
  ['optimiser', 'optimiser', 'verbe'],
  ['personnalise', 'personnalisé', 'participe'],
  ['personnalisee', 'personnalisée', 'participe'],
  ['donnees', 'données', 'nom'],
  ['donnee', 'donnée', 'nom'],
  ['entree', 'entrée', 'nom'],
  ['entrees', 'entrées', 'nom'],
  ['cle', 'clé', 'nom'],
  ['cles', 'clés', 'nom'],
  ['etape', 'étape', 'nom'],
  ['etapes', 'étapes', 'nom'],
  ['etat', 'état', 'nom'],
  ['etats', 'états', 'nom'],
  ['ete', 'été', 'nom/verbe'],
  ['evenement', 'événement', 'nom'],
  ['evenements', 'événements', 'nom'],
  ['ecran', 'écran', 'nom'],
  ['ecrans', 'écrans', 'nom'],
  ['email', 'email', 'nom'], // anglicisme OK
  ['echec', 'échec', 'nom'],
  ['echecs', 'échecs', 'nom'],
  ['echoue', 'échoué', 'participe'],
  ['echouer', 'échouer', 'verbe'],
  ['echange', 'échange', 'nom'],
  ['echanges', 'échanges', 'nom'],
  ['economie', 'économie', 'nom'],
  ['economique', 'économique', 'adj'],
  ['economiques', 'économiques', 'adj'],
  ['editeur', 'éditeur', 'nom'],
  ['editeurs', 'éditeurs', 'nom'],
  ['edition', 'édition', 'nom'],
  ['education', 'éducation', 'nom'],
  ['effectue', 'effectué', 'participe'],
  ['effectuer', 'effectuer', 'verbe'],
  ['efficace', 'efficace', 'adj'], // pas d'accent
  ['egal', 'égal', 'adj'],
  ['egalement', 'également', 'adv'],
  ['elabore', 'élaboré', 'participe'],
  ['elaborer', 'élaborer', 'verbe'],
  ['electronique', 'électronique', 'adj'],
  ['electroniques', 'électroniques', 'adj'],
  ['element', 'élément', 'nom'],
  ['elements', 'éléments', 'nom'],
  ['eleve', 'élevé', 'adj'],
  ['elevee', 'élevée', 'adj'],
  ['elimine', 'éliminé', 'participe'],
  ['eliminer', 'éliminer', 'verbe'],
  ['emet', 'émet', 'verbe'],
  ['emettre', 'émettre', 'verbe'],
  ['employe', 'employé', 'nom'],
  ['employes', 'employés', 'nom'],
  ['energie', 'énergie', 'nom'],
  ['enorme', 'énorme', 'adj'],
  ['enormes', 'énormes', 'adj'],
  ['enquete', 'enquête', 'nom'],
  ['enregistre', 'enregistré', 'participe'],
  ['enregistrer', 'enregistrer', 'verbe'],
  ['ensemble', 'ensemble', 'nom'], // pas d'accent
  ['entier', 'entier', 'adj'], // pas d'accent
  ['entiere', 'entière', 'adj'],
  ['entreprise', 'entreprise', 'nom'], // pas d'accent sur le e
  ['enumere', 'énuméré', 'participe'],
  ['enumerer', 'énumérer', 'verbe'],
  ['envoye', 'envoyé', 'participe'],
  ['envoyer', 'envoyer', 'verbe'],
  ['epreuve', 'épreuve', 'nom'],
  ['epreuves', 'épreuves', 'nom'],
  ['equipement', 'équipement', 'nom'],
  ['equipements', 'équipements', 'nom'],
  ['equitable', 'équitable', 'adj'],
  ['equivalence', 'équivalence', 'nom'],
  ['equivalent', 'équivalent', 'adj'],
  ['erreur', 'erreur', 'nom'], // pas d'accent
  ['essai', 'essai', 'nom'], // pas d'accent
  ['essentiel', 'essentiel', 'adj'], // pas d'accent
  ['etabli', 'établi', 'participe'],
  ['etablir', 'établir', 'verbe'],
  ['etablissement', 'établissement', 'nom'],
  ['etage', 'étage', 'nom'],
  ['etages', 'étages', 'nom'],
  ['etalage', 'étalage', 'nom'],
  ['etanche', 'étanche', 'adj'],
  ['etendre', 'étendre', 'verbe'],
  ['etendu', 'étendu', 'participe'],
  ['eternel', 'éternel', 'adj'],
  ['ethique', 'éthique', 'adj/nom'],
  ['etiquette', 'étiquette', 'nom'],
  ['etoile', 'étoile', 'nom'],
  ['etoiles', 'étoiles', 'nom'],
  ['etonnant', 'étonnant', 'adj'],
  ['etranger', 'étranger', 'adj/nom'],
  ['etrangere', 'étrangère', 'adj'],
  ['etre', 'être', 'verbe'],
  ['etroit', 'étroit', 'adj'],
  ['etude', 'étude', 'nom'],
  ['etudes', 'études', 'nom'],
  ['etudiant', 'étudiant', 'nom'],
  ['etudiants', 'étudiants', 'nom'],
  ['evalue', 'évalué', 'participe'],
  ['evaluer', 'évaluer', 'verbe'],
  ['evaluation', 'évaluation', 'nom'],
  ['evasion', 'évasion', 'nom'],
  ['eveille', 'éveillé', 'participe'],
  ['eveiller', 'éveiller', 'verbe'],
  ['evident', 'évident', 'adj'],
  ['evidente', 'évidente', 'adj'],
  ['evidemment', 'évidemment', 'adv'],
  ['evite', 'évité', 'participe'],
  ['eviter', 'éviter', 'verbe'],
  ['evolution', 'évolution', 'nom'],
  ['evolue', 'évolué', 'participe'],
  ['evoluer', 'évoluer', 'verbe'],
  ['exact', 'exact', 'adj'], // pas d'accent
  ['exactement', 'exactement', 'adv'], // pas d'accent
  ['interesse', 'intéressé', 'participe'],
  ['interesser', 'intéresser', 'verbe'],
  ['interessant', 'intéressant', 'adj'],
  ['prefere', 'préféré', 'participe'],
  ['preferer', 'préférer', 'verbe'],
  ['preference', 'préférence', 'nom'],
  ['presente', 'présenté', 'participe'],
  ['presenter', 'présenter', 'verbe'],
  ['presentation', 'présentation', 'nom'],
  ['prepare', 'préparé', 'participe'],
  ['preparer', 'préparer', 'verbe'],
  ['preparation', 'préparation', 'nom'],
  ['precis', 'précis', 'adj'],
  ['precise', 'précise', 'adj'],
  ['precisement', 'précisément', 'adv'],
  ['precision', 'précision', 'nom'],
  ['precedent', 'précédent', 'adj'],
  ['precedente', 'précédente', 'adj'],
  ['prevu', 'prévu', 'participe'],
  ['prevue', 'prévue', 'participe'],
  ['prevoir', 'prévoir', 'verbe'],
  ['premiere', 'première', 'adj'],
  ['premieres', 'premières', 'adj'],
  ['premier', 'premier', 'adj'], // pas d'accent
  ['defini', 'défini', 'participe'],
  ['definir', 'définir', 'verbe'],
  ['definition', 'définition', 'nom'],
  ['definitif', 'définitif', 'adj'],
  ['definitive', 'définitive', 'adj'],
  ['deja', 'déjà', 'adv'],
  ['delai', 'délai', 'nom'],
  ['delais', 'délais', 'nom'],
  ['delegue', 'délégué', 'nom'],
  ['delibere', 'délibéré', 'participe'],
  ['delicat', 'délicat', 'adj'],
  ['delicate', 'délicate', 'adj'],
  ['delivre', 'délivré', 'participe'],
  ['delivrer', 'délivrer', 'verbe'],
  ['demande', 'demande', 'nom'], // pas d'accent
  ['demander', 'demander', 'verbe'], // pas d'accent
  ['demarche', 'démarche', 'nom'],
  ['demarrer', 'démarrer', 'verbe'],
  ['demenage', 'déménagé', 'participe'],
  ['demeure', 'demeure', 'nom'], // pas d'accent
  ['demontre', 'démontré', 'participe'],
  ['demontrer', 'démontrer', 'verbe'],
  ['depart', 'départ', 'nom'],
  ['depasse', 'dépassé', 'participe'],
  ['depasser', 'dépasser', 'verbe'],
  ['depend', 'dépend', 'verbe'],
  ['dependre', 'dépendre', 'verbe'],
  ['dependance', 'dépendance', 'nom'],
  ['depense', 'dépense', 'nom'],
  ['depenses', 'dépenses', 'nom'],
  ['deplacement', 'déplacement', 'nom'],
  ['deplace', 'déplacé', 'participe'],
  ['deplacer', 'déplacer', 'verbe'],
  ['deploie', 'déploie', 'verbe'],
  ['deployer', 'déployer', 'verbe'],
  ['deploiement', 'déploiement', 'nom'],
  ['depose', 'déposé', 'participe'],
  ['deposer', 'déposer', 'verbe'],
  ['depuis', 'depuis', 'prép'], // pas d'accent
  ['derive', 'dérivé', 'nom'],
  ['dernier', 'dernier', 'adj'], // pas d'accent
  ['derniere', 'dernière', 'adj'],
  ['dernieres', 'dernières', 'adj'],
  ['deroule', 'déroule', 'verbe'],
  ['derouler', 'dérouler', 'verbe'],
  ['des', 'dès', 'prép'], // attention contexte
  ['desactive', 'désactivé', 'participe'],
  ['desactiver', 'désactiver', 'verbe'],
  ['desavantage', 'désavantage', 'nom'],
  ['descend', 'descend', 'verbe'], // pas d'accent
  ['description', 'description', 'nom'], // pas d'accent
  ['designe', 'désigné', 'participe'],
  ['designer', 'désigner', 'verbe'],
  ['desir', 'désir', 'nom'],
  ['desire', 'désiré', 'participe'],
  ['desirer', 'désirer', 'verbe'],
  ['desole', 'désolé', 'adj'],
  ['desordre', 'désordre', 'nom'],
  ['desormais', 'désormais', 'adv'],
  ['dessine', 'dessiné', 'participe'],
  ['dessiner', 'dessiner', 'verbe'], // pas d'accent sur 1er e
  ['destination', 'destination', 'nom'], // pas d'accent
  ['destine', 'destiné', 'participe'],
  ['destiner', 'destiner', 'verbe'], // pas d'accent sur 1er e
  ['detail', 'détail', 'nom'],
  ['details', 'détails', 'nom'],
  ['detaille', 'détaillé', 'participe'],
  ['detailler', 'détailler', 'verbe'],
  ['detecte', 'détecté', 'participe'],
  ['detecter', 'détecter', 'verbe'],
  ['detection', 'détection', 'nom'],
  ['determine', 'déterminé', 'participe'],
  ['determiner', 'déterminer', 'verbe'],
  ['detruit', 'détruit', 'participe'],
  ['detruire', 'détruire', 'verbe'],
  ['dette', 'dette', 'nom'], // pas d'accent
  ['developpe', 'développé', 'participe'],
  ['developper', 'développer', 'verbe'],
  ['developpement', 'développement', 'nom'],
  ['developpeur', 'développeur', 'nom'],
  ['devenir', 'devenir', 'verbe'], // pas d'accent
  ['deverse', 'déversé', 'participe'],
  ['devoile', 'dévoilé', 'participe'],
  ['devoiler', 'dévoiler', 'verbe'],
  ['devoir', 'devoir', 'verbe'], // pas d'accent
  ['devoue', 'dévoué', 'adj'],
  ['different', 'différent', 'adj'],
  ['differente', 'différente', 'adj'],
  ['differents', 'différents', 'adj'],
  ['differentes', 'différentes', 'adj'],
  ['difference', 'différence', 'nom'],
  ['difficile', 'difficile', 'adj'], // pas d'accent
  ['difficulte', 'difficulté', 'nom'],
  ['difficultes', 'difficultés', 'nom'],
  ['diffuse', 'diffusé', 'participe'],
  ['diffuser', 'diffuser', 'verbe'], // pas d'accent
  ['general', 'général', 'adj'],
  ['generale', 'générale', 'adj'],
  ['generalement', 'généralement', 'adv'],
  ['generer', 'générer', 'verbe'],
  ['genereux', 'généreux', 'adj'],
  ['generation', 'génération', 'nom'],
  ['gere', 'gère', 'verbe'],
  ['gerer', 'gérer', 'verbe'],
  ['gestion', 'gestion', 'nom'], // pas d'accent
  ['gestionnaire', 'gestionnaire', 'nom'], // pas d'accent
  ['immediat', 'immédiat', 'adj'],
  ['immediate', 'immédiate', 'adj'],
  ['immediatement', 'immédiatement', 'adv'],
  ['independant', 'indépendant', 'adj'],
  ['independante', 'indépendante', 'adj'],
  ['independance', 'indépendance', 'nom'],
  ['necessaire', 'nécessaire', 'adj'],
  ['necessaires', 'nécessaires', 'adj'],
  ['necessite', 'nécessité', 'nom'],
  ['negatif', 'négatif', 'adj'],
  ['negative', 'négative', 'adj'],
  ['neglige', 'négligé', 'participe'],
  ['negliger', 'négliger', 'verbe'],
  ['negocie', 'négocié', 'participe'],
  ['negocier', 'négocier', 'verbe'],
  ['negociation', 'négociation', 'nom'],
  ['numero', 'numéro', 'nom'],
  ['numeros', 'numéros', 'nom'],
  ['numerique', 'numérique', 'adj'],
  ['numeriques', 'numériques', 'adj'],
  ['opere', 'opère', 'verbe'],
  ['operer', 'opérer', 'verbe'],
  ['operation', 'opération', 'nom'],
  ['operations', 'opérations', 'nom'],
  ['opportunite', 'opportunité', 'nom'],
  ['opportunites', 'opportunités', 'nom'],
  ['periode', 'période', 'nom'],
  ['periodes', 'périodes', 'nom'],
  ['peripherique', 'périphérique', 'adj'],
  ['permanent', 'permanent', 'adj'], // pas d'accent
  ['permanente', 'permanente', 'adj'], // pas d'accent
  ['permet', 'permet', 'verbe'], // pas d'accent
  ['permettre', 'permettre', 'verbe'], // pas d'accent
  ['remunere', 'rémunéré', 'participe'],
  ['remunerer', 'rémunérer', 'verbe'],
  ['remuneration', 'rémunération', 'nom'],
  ['repete', 'répète', 'verbe'],
  ['repeter', 'répéter', 'verbe'],
  ['repetition', 'répétition', 'nom'],
  ['repond', 'répond', 'verbe'],
  ['repondre', 'répondre', 'verbe'],
  ['reponse', 'réponse', 'nom'],
  ['reponses', 'réponses', 'nom'],
  ['represente', 'représenté', 'participe'],
  ['representer', 'représenter', 'verbe'],
  ['representation', 'représentation', 'nom'],
  ['reserve', 'réservé', 'participe'],
  ['reserver', 'réserver', 'verbe'],
  ['reservation', 'réservation', 'nom'],
  ['resolu', 'résolu', 'participe'],
  ['resoudre', 'résoudre', 'verbe'],
  ['resolution', 'résolution', 'nom'],
  ['respecte', 'respecté', 'participe'],
  ['respecter', 'respecter', 'verbe'], // pas d'accent
  ['responsable', 'responsable', 'adj/nom'], // pas d'accent
  ['responsabilite', 'responsabilité', 'nom'],
  ['reste', 'reste', 'nom/verbe'], // pas d'accent
  ['rester', 'rester', 'verbe'], // pas d'accent
  ['resulte', 'résulte', 'verbe'],
  ['resulter', 'résulter', 'verbe'],
  ['resume', 'résumé', 'nom'],
  ['resumer', 'résumer', 'verbe'],
  ['retour', 'retour', 'nom'], // pas d'accent
  ['retrouve', 'retrouvé', 'participe'],
  ['retrouver', 'retrouver', 'verbe'], // pas d'accent
  ['reuni', 'réuni', 'participe'],
  ['reunir', 'réunir', 'verbe'],
  ['reunion', 'réunion', 'nom'],
  ['reussi', 'réussi', 'participe'],
  ['reussir', 'réussir', 'verbe'],
  ['reussite', 'réussite', 'nom'],
  ['revele', 'révélé', 'participe'],
  ['reveler', 'révéler', 'verbe'],
  ['revelation', 'révélation', 'nom'],
  ['revenu', 'revenu', 'nom'], // pas d'accent
  ['revenus', 'revenus', 'nom'], // pas d'accent
  ['rever', 'rêver', 'verbe'],
  ['reve', 'rêve', 'nom'],
  ['revise', 'révisé', 'participe'],
  ['reviser', 'réviser', 'verbe'],
  ['revision', 'révision', 'nom'],
  ['revolution', 'révolution', 'nom'],
  ['revolutionnaire', 'révolutionnaire', 'adj'],
  ['selecteur', 'sélecteur', 'nom'],
  ['selection', 'sélection', 'nom'],
  ['selectionne', 'sélectionné', 'participe'],
  ['selectionner', 'sélectionner', 'verbe'],
  ['separe', 'séparé', 'participe'],
  ['separer', 'séparer', 'verbe'],
  ['separation', 'séparation', 'nom'],
  ['serenite', 'sérénité', 'nom'],
  ['serieux', 'sérieux', 'adj'],
  ['serieuse', 'sérieuse', 'adj'],
  ['serie', 'série', 'nom'],
  ['series', 'séries', 'nom'],
  ['service', 'service', 'nom'], // pas d'accent
  ['strategie', 'stratégie', 'nom'],
  ['strategies', 'stratégies', 'nom'],
  ['strategique', 'stratégique', 'adj'],
  ['strategiques', 'stratégiques', 'adj'],
  ['succes', 'succès', 'nom'],
  ['suggere', 'suggère', 'verbe'],
  ['suggerer', 'suggérer', 'verbe'],
  ['suggestion', 'suggestion', 'nom'], // pas d'accent
  ['superieur', 'supérieur', 'adj'],
  ['superieure', 'supérieure', 'adj'],
  ['superieurs', 'supérieurs', 'adj'],
  ['superieures', 'supérieures', 'adj'],
  ['telephone', 'téléphone', 'nom'],
  ['telephones', 'téléphones', 'nom'],
  ['telephonique', 'téléphonique', 'adj'],
  ['telecharge', 'téléchargé', 'participe'],
  ['telecharger', 'télécharger', 'verbe'],
  ['telechargement', 'téléchargement', 'nom'],
  ['television', 'télévision', 'nom'],
  ['televisions', 'télévisions', 'nom'],
  ['temoignage', 'témoignage', 'nom'],
  ['temoignages', 'témoignages', 'nom'],
  ['temoin', 'témoin', 'nom'],
  ['temoins', 'témoins', 'nom'],
  ['temperature', 'température', 'nom'],
  ['tendance', 'tendance', 'nom'], // pas d'accent
  ['tente', 'tenté', 'participe'],
  ['tenter', 'tenter', 'verbe'], // pas d'accent
  ['termine', 'terminé', 'participe'],
  ['terminer', 'terminer', 'verbe'], // pas d'accent
  ['territoire', 'territoire', 'nom'], // pas d'accent
  ['teste', 'testé', 'participe'],
  ['tester', 'tester', 'verbe'], // pas d'accent
  ['tete', 'tête', 'nom'],
  ['texte', 'texte', 'nom'], // pas d'accent
  ['therapeute', 'thérapeute', 'nom'],
  ['therapeutique', 'thérapeutique', 'adj'],
  ['therapie', 'thérapie', 'nom'],
  ['these', 'thèse', 'nom'],
  ['theorie', 'théorie', 'nom'],
  ['theorique', 'théorique', 'adj'],
  ['tolere', 'toléré', 'participe'],
  ['tolerer', 'tolérer', 'verbe'],
  ['tolerance', 'tolérance', 'nom'],
  ['totalite', 'totalité', 'nom'],
  ['transfere', 'transféré', 'participe'],
  ['transferer', 'transférer', 'verbe'],
  ['transfert', 'transfert', 'nom'], // pas d'accent
  ['transforme', 'transformé', 'participe'],
  ['transformer', 'transformer', 'verbe'], // pas d'accent
  ['transmission', 'transmission', 'nom'], // pas d'accent
  ['travaille', 'travaillé', 'participe'],
  ['travailler', 'travailler', 'verbe'], // pas d'accent
  ['tres', 'très', 'adv'],
  ['unicite', 'unicité', 'nom'],
  ['unifie', 'unifié', 'participe'],
  ['unifier', 'unifier', 'verbe'], // pas d'accent
  ['unite', 'unité', 'nom'],
  ['unites', 'unités', 'nom'],
  ['universitaire', 'universitaire', 'adj'], // pas d'accent
  ['universite', 'université', 'nom'],
  ['urgence', 'urgence', 'nom'], // pas d'accent
  ['utilise', 'utilisé', 'participe'],
  ['utilisee', 'utilisée', 'participe'],
  ['utiliser', 'utiliser', 'verbe'], // pas d'accent
  ['utilisateur', 'utilisateur', 'nom'], // pas d'accent
  ['utilisateurs', 'utilisateurs', 'nom'], // pas d'accent
  ['utilite', 'utilité', 'nom'],
  ['validite', 'validité', 'nom'],
  ['valide', 'validé', 'participe'],
  ['valider', 'valider', 'verbe'], // pas d'accent
  ['variete', 'variété', 'nom'],
  ['vehicule', 'véhicule', 'nom'],
  ['vehicules', 'véhicules', 'nom'],
  ['veille', 'veille', 'nom'], // pas d'accent
  ['verifie', 'vérifié', 'participe'],
  ['verifier', 'vérifier', 'verbe'],
  ['verification', 'vérification', 'nom'],
  ['veritable', 'véritable', 'adj'],
  ['veritables', 'véritables', 'adj'],
  ['verite', 'vérité', 'nom'],
  ['video', 'vidéo', 'nom'],
  ['videos', 'vidéos', 'nom'],
  ['vitesse', 'vitesse', 'nom'], // pas d'accent
  ['volonte', 'volonté', 'nom'],
  ['zone', 'zone', 'nom'], // pas d'accent
  // Mots spécifiques au contexte e-commerce/marketing
  ['fidélite', 'fidélité', 'nom'],
  ['fidelite', 'fidélité', 'nom'],
  ['fidelisation', 'fidélisation', 'nom'],
  ['ameliore', 'amélioré', 'participe'],
  ['ameliorer', 'améliorer', 'verbe'],
  ['amelioration', 'amélioration', 'nom'],
  ['recupere', 'récupéré', 'participe'],
  ['recuperer', 'récupérer', 'verbe'],
  ['recuperation', 'récupération', 'nom'],
  ['reengagement', 'réengagement', 'nom'],
  ['reactif', 'réactif', 'adj'],
  ['reactive', 'réactive', 'adj'],
  ['reactiver', 'réactiver', 'verbe'],
  ['reactivation', 'réactivation', 'nom'],
  ['referencement', 'référencement', 'nom'],
  ['reference', 'référence', 'nom'],
  ['references', 'références', 'nom'],
  ['rentabilite', 'rentabilité', 'nom'],
  ['rentable', 'rentable', 'adj'], // pas d'accent
  ['monetisation', 'monétisation', 'nom'],
  ['monetise', 'monétisé', 'participe'],
  ['monetiser', 'monétiser', 'verbe'],
  ['delegue', 'délégué', 'nom/participe'],
  ['deleguer', 'déléguer', 'verbe'],
];

// Fichiers à scanner (pages FR uniquement)
const FR_PAGES = [
  '404.html',
  'a-propos.html',
  'automations.html',
  'cas-clients.html',
  'contact.html',
  'index.html',
  'legal/mentions-legales.html',
  'legal/politique-confidentialite.html',
  'pricing.html',
  'services/audit-gratuit.html',
  'services/ecommerce.html',
  'services/flywheel-360.html',
  'services/pme.html'
];

let totalErrors = 0;
let errorsByPage = {};
let allErrors = [];

function extractTextFromHTML(html) {
  // Enlever les scripts, styles, et tags HTML
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ');
  return text;
}

function findAccentErrors(text, page) {
  const errors = [];
  const textLower = text.toLowerCase();

  for (const [incorrect, correct, type] of ACCENT_ERRORS) {
    // Chercher le mot incorrect (avec word boundaries)
    const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
    let match;

    while ((match = regex.exec(textLower)) !== null) {
      // Vérifier le contexte (±30 caractères)
      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + incorrect.length + 30);
      const context = text.substring(start, end).replace(/\s+/g, ' ');

      // Éviter les faux positifs (URLs, code, attributs HTML)
      if (!context.includes('http') &&
          !context.includes('.js') &&
          !context.includes('.css') &&
          !context.includes('class=') &&
          !context.includes('id=')) {
        errors.push({
          page,
          incorrect: match[0],
          correct,
          type,
          context: `...${context}...`
        });
      }
    }
  }

  return errors;
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  AUDIT ACCENTS FRANÇAIS - 3A Automation');
console.log('  Date: ' + new Date().toISOString());
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

for (const page of FR_PAGES) {
  const filePath = path.join(SITE_DIR, page);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${page}: Fichier non trouvé`);
    continue;
  }

  const html = fs.readFileSync(filePath, 'utf-8');
  const text = extractTextFromHTML(html);
  const errors = findAccentErrors(text, page);

  if (errors.length > 0) {
    console.log(`\n📄 ${page}: ${errors.length} erreur(s) potentielle(s)`);
    console.log('─'.repeat(60));

    errorsByPage[page] = errors;

    for (const err of errors) {
      console.log(`  ❌ "${err.incorrect}" → "${err.correct}" (${err.type})`);
      console.log(`     ${err.context}`);
      allErrors.push(err);
    }

    totalErrors += errors.length;
  } else {
    console.log(`✅ ${page}: Aucune erreur détectée`);
  }
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  RÉSUMÉ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log(`  Pages scannées: ${FR_PAGES.length}`);
console.log(`  Erreurs totales: ${totalErrors}`);
console.log(`  Pages avec erreurs: ${Object.keys(errorsByPage).length}`);
console.log('');

if (totalErrors > 0) {
  console.log('  ERREURS PAR TYPE:');
  const byType = {};
  for (const err of allErrors) {
    const key = `${err.incorrect} → ${err.correct}`;
    byType[key] = (byType[key] || 0) + 1;
  }

  const sorted = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  for (const [key, count] of sorted.slice(0, 20)) {
    console.log(`    ${count}x ${key}`);
  }
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════');

process.exit(totalErrors > 0 ? 1 : 0);
