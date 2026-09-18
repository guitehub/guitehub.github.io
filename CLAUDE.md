# CLAUDE.md

## gueathub (`outils/gueathub`)

- **Version de l'app.** Toute modification de l'app (code dans `js/`, CSS, `index.html`, `sw.js`, rayons)
  incrémente `APP_VERSION` dans `outils/gueathub/js/main.js`, affichée en bas de « Réglages » :
  - correctif ou petit ajustement : `1.1.0` → `1.1.1` ;
  - nouvelle fonctionnalité ou changement visible de l'interface : `1.1.0` → `1.2.0` ;
  - refonte ou changement incompatible des données enregistrées : `1.1.0` → `2.0.0`.

  Ajouter ou modifier seulement des recettes ne change pas la version : « Recettes générées le » l'indique déjà.
- **Décisions** notées dans `outils/gueathub/DECISIONS.md`.
