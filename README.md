# 10K Performance Tracker

Mini app mobile-first pour suivre un programme hebdomadaire 10 km + musculation + football + nutrition.

## Fonctionnalités

- Navigation par jour de la semaine
- Suivi des séries de musculation
- Compteur de répétitions `+ / -`
- Validation de chaque série
- Saisie de la charge utilisée
- Validation de chaque répétition de fractionné
- Suivi des étapes des séances running
- Repas à cocher
- Progression hebdomadaire
- Sauvegarde automatique dans `localStorage`
- Aucun backend
- Aucune dépendance
- Responsive mobile

## Lancer en local

Tu peux ouvrir directement `index.html` dans un navigateur.

Pour un serveur local :

```bash
python3 -m http.server 8080
```

Puis ouvre :

```text
http://localhost:8080
```

## Mettre sur GitHub

```bash
git init
git add .
git commit -m "Initial 10K performance tracker"
git branch -M main
git remote add origin <URL_DE_TON_REPO>
git push -u origin main
```

## Structure

```text
10k-performance-tracker/
├── index.html
├── styles.css
├── app.js
├── README.md
└── .gitignore
```

## Données

La progression est stockée uniquement dans le navigateur via `localStorage`.

Clé utilisée :

```text
tenk-performance-tracker-v1
```

Si tu changes d'appareil ou de navigateur, la progression ne sera pas synchronisée.
