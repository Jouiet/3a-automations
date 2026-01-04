# 3A Automation - Landing Page

Landing page statique pour Hostinger.

**Domaine:** 3a-automation.com
**Email:** contact@3a-automation.com

## Fichiers

```
landing-page-hostinger/
├── index.html     # Page principale
├── styles.css     # Styles CSS
├── script.js      # Scripts JS
└── README.md      # Ce fichier
```

## Déploiement sur Hostinger

### Option 1: File Manager (Simple)

1. Connexion Hostinger → **hPanel**
2. **Files** → **File Manager**
3. Naviguer vers `public_html/`
4. **Upload** → Sélectionner les 3 fichiers (index.html, styles.css, script.js)
5. Terminé

### Option 2: FTP

1. Connexion via FileZilla/Cyberduck
2. Credentials: hPanel → **Files** → **FTP Accounts**
3. Upload vers `/public_html/`

## Configuration

### Formulaire de contact

Le formulaire utilise [Formspree](https://formspree.io/) (gratuit jusqu'à 50 soumissions/mois).

1. Créer compte sur https://formspree.io
2. Créer un nouveau formulaire
3. Copier l'ID du formulaire
4. Remplacer `YOUR_FORM_ID` dans `index.html`:

```html
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

### Personnalisation

- **Couleurs**: Modifier les variables CSS dans `:root` (styles.css)
- **Textes**: Modifier directement dans index.html
- **Email**: Remplacer par votre email (contact@3a-automation.com)

## Checklist avant déploiement

- [ ] Remplacer YOUR_FORM_ID par ID Formspree réel
- [ ] Mettre à jour l'email de contact
- [ ] Vérifier tous les textes
- [ ] Tester le formulaire
- [ ] Ajouter favicon (optionnel)

## Support

Pour modifications: éditer les fichiers et re-uploader sur Hostinger.
