# gueathub — décisions

Choix pris en cours de route, quand le cahier des charges (`_specs/gueathub-cahier-des-charges.md`)
ne tranchait pas ou a été arbitré. Fichier non publié (exclu dans `_config.yml`).

## Arbitrages validés (phase 0)

| Sujet | Décision |
|---|---|
| Build GitHub Pages | Mode classique (Jekyll 3.10) : pas de workflow de déploiement, pas de gem `github-pages`. Tout est testé en Jekyll 4.3 (local) **et** 3.10 (Gemfile `github-pages` séparé, hors repo). Aucun plugin ajouté. |
| Page Outils (§11) | **Option A** : on garde la convention du README. `pages/outils.md` reçoit seulement `permalink: /outils/` ; pas de `_data/outils.yml` ; l'article gueathub est en catégorie `tool` (calqué sur icomkr) ; Fléchettes et Yam's restent dans Projets. |
| Lien « Le Hub » | Pointe vers `/outils/`. |
| Jetons (§9.1) | Pas d'`@import` : `<link>` vers `/assets/css/tokens.css` dans `_layouts/default.html`, juste avant `style.css`. |
| Exclusions | `Gemfile`, `Gemfile.lock`, `node_modules` et `vendor` listés explicitement. |
| Contrôle « blog inchangé » | Référence = build du commit `3791e2e`, pages dont le changement est attendu ignorées. |
| Photos | Aucune pour l'instant : les avertissements « photo manquante » sont attendus. |
| Vignette de l'article | `assets/images/vignette-gueathub.ico`, fournie avant la phase 5. |
| Navigateurs | Tailwind v4 : Safari 16.4 et plus. |
| Nom du fichier de spec | `_specs/gueathub-cahier-des-charges.md` (le §4 dit `_specs/gueathub.md`) : gardé tel quel. |

## Phase 1 — contrat de données

- **Exclusions dès la phase 1.** La liste `exclude` prévue en phase 5 est ajoutée maintenant : sinon
  `package.json`, `scripts/` et les fixtures de test seraient publiés dès ce commit. Vérifié : en Jekyll 4
  comme en 3.10, le site généré est identique à la référence, à l'exception des 3 nouveaux fichiers
  (`recettes.json`, `ingredients.txt`, `schema/recette.schema.json`).
- **`photos` dans `recettes.json`.** En plus de `genere`, `categories` et `recettes`, le fichier généré
  contient `photos` : la liste des id qui ont un `assets/gueathub/recettes/<id>.webp`, calculée depuis
  `site.static_files`. L'app sait ainsi quelles photos existent, sans requête en 404 (utile hors ligne).
- **Rayon dans le schéma.** `categorie` n'est contrôlé que par un motif kebab-case dans le schéma ;
  l'appartenance à `categories.json` est vérifiée par le script. `categories.json` reste la source unique,
  et le schéma public n'a pas à être régénéré quand on ajoute un rayon.
- **Textes.** Les chaînes (`titre`, `description`, `precision`…) ne peuvent pas être vides ni commencer ou
  finir par un espace. `nom` interdit en plus les majuscules et les doubles espaces (schéma) ; le script
  exige la forme Unicode NFC, pour que la clé d'agrégation soit stable.
- **Limites non précisées.** `portionsUnite` : 30 caractères max. `minuteur` : entier ≥ 1 (minutes).
  `tags` : sans doublon.
- **`categories.json` validé aussi** : structure `{ id, libelle, icone }`, id uniques, rayon `autre`
  obligatoire (rayon par défaut des ajouts manuels).
- **Icônes des rayons** (noms Bootstrap Icons vérifiés dans la v1.13) : `apple`, `basket2`, `shop`, `egg`,
  `thermometer-low`, `box-seam`, `archive`, `droplet`, `globe-europe-africa`, `cake2`, `snow`, `cup-straw`,
  `house`, `three-dots`. Il n'existe pas d'icône pain, poisson ou bocal.
- **Quasi-doublons.** Le `s`/`x` final est retiré à la fin de **chaque mot**, pas seulement de la chaîne,
  pour attraper « pomme de terre » / « pommes de terre ».
- **Codes de problème.** Chaque erreur ou avertissement du script porte un code stable
  (`schema`, `json`, `id-fichier`, `id-doublon`, `categorie-inconnue`, `categorie-conflit`,
  `quantite-unite`, `nom-non-canonique`, `categories` ; `photo-manquante`, `photo-lourde`, `nom-proche`,
  `placard-conflit`, `tag-hors-vocabulaire`, `fichier-ignore`, et `photo-format` depuis la phase 6).
  Les tests s'appuient dessus.
- **`ingredients.txt`** est trié par le `sort` de Liquid, octet par octet : les noms qui commencent par une
  lettre accentuée ou « œ » arrivent en fin de liste. Sans importance pour le convertisseur.
- **Recettes d'exemple.** La quiche suit exactement la fixture du §6.5, y compris « lardons » au pluriel.
  La 3ᵉ recette (crêpes, végétarienne, sans photo) sert aussi à exercer les cas moins courants : `groupe`,
  `optionnel`, cuillères, `portionsUnite` et une quantité `null`.
- **CI.** Le workflow se déclenche aussi sur `package.json`, `package-lock.json` et sur lui-même.
  `actions/checkout@v5`, `actions/setup-node@v5`, `node-version: lts/*`.
- **Node.** `package.json` à la racine en `"type": "module"`, `engines.node >= 22` (motifs de fichiers pour
  `node --test`).

## Phase 2 — domaine

- **Fiche recette aux portions d'origine : quantités telles qu'écrites.** Quand les portions affichées
  sont celles de la recette (facteur 1), chaque quantité est montrée exactement comme dans les données
  (« 12 g », « 100 ml », « 4 c. à c. »), sans arrondi métier. L'arrondi au plus proche du §6.3
  s'applique dès que les portions changent. Sinon, 12 g de beurre s'afficheraient « 10 g » alors que la
  recette dit 12 g (« l'app fait confiance aux données »).
- **Jamais d'arrondi à zéro.** Au plus proche, une petite quantité qui s'arrondirait à 0 (2 g, 0,2 c. à c.)
  reste affichée telle quelle. Les dénombrables gardent leur minimum de 0,5 (§6.3).
- **Unité d'affichage choisie après l'arrondi.** 995 g arrondis vers le haut donnent 1000 g, affichés
  « 1 kg » ; 97 ml donnent « 10 cl ». Le pas d'arrondi, lui, dépend de la valeur avant arrondi.
- **Cuillères.** Si la valeur arrondie atteint 3 c. à c., on repart de la quantité exacte, convertie en
  c. à s. et arrondie au 0,5 c. à s. (4 c. à c. → « 1,5 c. à s. », et non « 1,33 c. à s. »).
- **Libellés.** Aucun pluriel pour les symboles (g, kg, ml, cl, l, c. à c., c. à s.). « boîte » prend son
  accent à l'affichage ; « rouleau » fait « rouleaux ».
- **Familles mixtes.** Les quantités sont listées dans l'ordre où leur famille apparaît dans la sélection,
  séparées par « + ».
- **Placard.** Côté données, une ligne est « placard » seulement si toutes ses occurrences le sont
  (comme `optionnel`). En cas de doute, l'article reste dans la liste à acheter.
- **Sources.** Une entrée par occurrence d'ingrédient, avec son `groupe` : une recette qui utilise du beurre
  pour la pâte et pour la garniture donne deux sources. `quantiteAffichee` est celle de la fiche recette
  (au plus proche, ou telle qu'écrite aux portions d'origine).
- **Coches.** La signature est la quantité affichée dans la liste (chaîne vide pour « au goût »). Une coche
  dont la signature ne correspond plus donne l'état `stale` (« quantité modifiée »), affiché non coché ;
  recocher la ligne met la signature à jour. Si la quantité revient à la valeur cochée, la ligne redevient
  cochée. Les ajouts manuels gardent leur propre `coche` et ne passent pas par les signatures.
- **Rayons.** L'ordre perso est nettoyé (rayons inconnus et doublons retirés), puis complété par les rayons
  manquants dans l'ordre par défaut. Une ligne dont le rayon n'existe plus va dans « autre ».
- **Tri dans un rayon.** Non cochés (y compris « quantité modifiée ») d'abord, cochés en fin, puis ordre
  alphabétique français (`Intl.Collator`, casse et accents ignorés : « œuf » se range comme « oeuf »).
- **Progression et badge.** Ils comptent les lignes des rayons et les ajouts, **hors** section
  « À vérifier au placard » (repliée par défaut).
- **Texte copié.** Un bloc par rayon (libellé, puis `- nom : quantité`, suivi de « (facultatif) » si besoin),
  blocs séparés par une ligne vide, « À vérifier au placard » en dernier ; rayons dont tout est coché omis.
- **Recherche.** Tous les mots de la requête doivent apparaître dans le titre ou les noms d'ingrédients.
  Les ligatures sont dépliées (« oeuf » trouve « œuf »). Les tags sélectionnés sont cumulatifs (ET).
  Tri « temps » : temps total croissant, puis titre.
- **Fonctions en plus des 4 prévues au §6.** `text.js` porte aussi le filtre et le tri des recettes,
  `scale.js` le regroupement des ingrédients de la fiche, `aggregate.js` les coches, les rayons, la
  progression et le texte copié : tout ce qui est calculable sans DOM est testé ici.
- **Script de validation.** Il réutilise `normalize` et `nearDuplicateKey` de `text.js` (plus de copie).
- **Couverture.** `npm test` impose 100 % des lignes, branches et fonctions de `js/domain/`
  (`--experimental-test-coverage`, Node ≥ 22.8). L'exemple du §6.5 est testé sur une copie figée des deux
  recettes (`tests/fixtures/reference/`), pour que modifier les vraies recettes ne casse pas le test.

## Phase 3 — interface

### Blog
- **Jetons.** Les trois blocs de variables de `style.css` (`:root`, `prefers-color-scheme`, `[data-theme="dark"]`)
  sont déplacés tels quels dans `assets/css/tokens.css`, chargé par un `<link>` juste avant `style.css` dans
  `_layouts/default.html` (arbitrage : pas d'`@import`). `--measure` et `--pad` font partie du bloc `:root`
  et suivent. Contrôle, en Jekyll 4.3 et 3.10, par rapport au build de `3791e2e` : les 24 pages HTML ne
  diffèrent que par cette ligne, et `tokens.css` + `style.css` redonnent exactement l'ancien `style.css`
  (commentaires mis à part). icomkr, Fléchettes et Yam's gardent leurs variables en ligne : inchangés.

### Structure
- **Fichiers en plus de l'arborescence du §4** : `js/actions.js` (toutes les modifications d'état, avec
  « Annuler »), `js/labels.js` (libellés et icônes des types, tags, difficultés), `js/views/parts.js`
  (boutons, puces, compteur, photo), `js/ui/theme.js`, `js/ui/wakelock.js`, `scripts/gueathub-icons.mjs`.
- **Icônes générées.** `js/ui/icons.js` est produit par `npm run icons` depuis le paquet `bootstrap-icons`
  (devDependency) : icônes de l'interface + toutes les `icone` de `categories.json`. `npm run check`
  signale une icône de rayon absente. La CI vérifie que `icons.js` et `app.css` commités sont à jour.
- **Tailwind.** `@import "tailwindcss" source(none)` puis `@source` explicites : sans cela, Tailwind
  scannerait tout le blog. `color-scheme` suit le thème (cases à cocher, listes et barres de défilement
  natives en sombre). Focus visible global : contour `--accent` de 2 px.
- **`--watch`.** `npm run css:watch` s'utilise dans un terminal : sans terminal attaché (script, CI), la CLI
  Tailwind s'arrête aussitôt ; utiliser alors `--watch=always`. L'avertissement npm sur le script
  d'installation de `@parcel/watcher` est sans effet : le binaire précompilé est utilisé.
- **Version de l'app** : constante `APP_VERSION` dans `js/main.js` (1.0.0), à incrémenter à la main.
  La date de génération des recettes (`genere`) est affichée à côté.
- **Rendu.** Gabarits `html` avec échappement systématique, rendu par `innerHTML` qui restaure le focus
  (attribut `data-focus`) et le défilement. Recherche : seuls filtres, compteur et grille sont redessinés,
  le champ n'est jamais remplacé (pas de perte de saisie ni de composition d'accents). Cochage : seuls la
  section du rayon, le placard et la progression sont redessinés (et le focus reste sur la case) ; si les
  articles cochés sont masqués, rendu complet et focus sur la ligne voisine.

### Écrans
- **Recettes.** Types proposés : seulement ceux présents dans les données (masqués s'il n'y en a qu'un).
  Sur mobile, chaque rangée de puces défile horizontalement dans sa propre bande (la page, elle, ne
  défile jamais en largeur). Carte : tout le cadre ouvre la fiche (lien étiré) ; le bouton « Ajouter »
  ajoute les portions de la recette. Descendre sous 1 retire la recette (toast « Annuler »).
- **Fiche.** Sans photo, un simple bandeau avec l'icône du type (la place 4:3 est réservée aux cartes et
  aux vraies photos). Temps à 0 non affichés ; « Total » toujours affiché. Quantité `null` : « au goût ».
  Singulier des portions : le `s` final de l'unité est retiré sous 2 (« 1 personne », « 1 crêpe »).
- **Écran allumé.** Relâché en quittant la fiche ; redemandé au retour sur l'onglet tant qu'il est actif.
  En cas de refus du navigateur, l'interrupteur revient à « off » avec un toast.
- **Minuteurs.** Non conservés au rechargement. Calculés depuis l'heure de fin (justes même onglet en veille).
  Fin : vibration, trois bips (Web Audio, déverrouillé au lancement du minuteur) et toast de 15 s.
- **Liste.** Les ajouts manuels ont un bouton « Supprimer » à la place de « détails ». Le formulaire
  d'ajout reste disponible quand la liste est vide. Les boutons « détails » ouvrent la quantité totale,
  les sources et l'action placard ; revenir à la valeur des données efface la préférence.
  « Tout décocher » et la suppression d'un ajout proposent aussi « Annuler » (5 s).
- **Copier la liste.** Web Share API si disponible, sinon presse-papiers (puis ancienne méthode
  `execCommand`). Pas de toast après un partage réussi (le système a sa propre interface) ; « Liste copiée »
  après une copie.
- **Réglages.** « Effacer les données de l'app sur cet appareil » : toast « Annuler » plutôt qu'une
  confirmation, comme « Vider la liste ». La clé `theme` du blog n'est pas effacée. Choisir « Système »
  retire la clé `theme` (comportement du blog quand aucun choix n'est fait).
- **Navigation.** Changement d'écran : défilement en haut et focus sur le titre de l'écran (sans contour).
  Le badge compte les articles restants hors placard (voir phase 2). Lien « Le Hub » vers `/outils/`
  (la page Outils y sera servie en phase 5).

### Robustesse
- **Recettes indisponibles** (premier chargement hors ligne, erreur serveur) : message et bouton « Réessayer ».
- **Bandeau hors ligne** : affiché si la réponse de `recettes.json` porte l'en-tête `X-Gueathub-Cache: 1`,
  que le service worker ajoutera en phase 4 quand il sert la copie en cache.
- **Stockage.** Sélection limitée à 99 portions par recette. Écriture forcée à `pagehide` et quand l'onglet
  passe en arrière-plan. Un état écrit par une version plus récente de l'app (champ `version` supérieur)
  n'est jamais écrasé : l'app travaille alors en mémoire.
- **Tests d'interface.** Routeur, store (migration, purge, écriture différée, mode mémoire) et gabarits
  (échappement) sont testés dans Node. Les parcours du §13 ont été validés dans Chromium (Playwright,
  hors repo) à 320, 375 et 1280 px, en clair et en sombre.

## Phase 4 — PWA

- **Icônes.** Générées par `npm run pwa-icons` (sharp, devDependency) : panier plein de Bootstrap Icons en
  blanc sur l'accent du blog (`#b4531f`). `icon-192.png` et `icon-512.png` (carré arrondi, « any »),
  `icon-maskable-512.png` (fond plein, pictogramme dans la zone sûre de 80 %), `apple-touch-icon.png`
  (180 px, fond plein : iOS n'utilise pas les icônes du manifest) et `icon.svg` (favicon). Le script est la
  source : pas de fichier SVG maître à maintenir. Pas de vérification « à jour » en CI pour ces PNG (le rendu
  de sharp peut varier d'une version à l'autre).
- **Manifest.** `id`, `start_url` et `scope` à `/outils/gueathub/`. Couleurs claires (`#ffffff`) : le
  manifest ne peut pas suivre le thème ; la barre du navigateur, elle, suit `theme-color` ajusté en direct.
  Pas d'`orientation` imposée (tablette, ordinateur). Raccourci « Liste de courses » (`#/liste`).
- **Caches versionnés.** `gueathub-<site.time>` pour la coquille et `gueathub-photos-<site.time>` pour les
  photos. Toute l'ancienne version est supprimée à l'activation, photos comprises : une photo remplacée sous
  le même nom est ainsi rafraîchie à la version suivante, au prix d'un nouveau téléchargement au fil des
  consultations.
- **Pré-cache.** `cache: "reload"` pour contourner le cache HTTP de GitHub Pages (10 min) et ne pas mélanger
  deux versions. La coquille est servie depuis le cache de *sa* version (jamais `caches.match` global, qui
  pourrait mélanger ancienne et nouvelle version pendant l'attente).
- **Navigations.** Seules `/outils/gueathub/` et `/outils/gueathub/index.html` sont servies depuis le cache ;
  les autres adresses du dossier (ex. `ingredients.txt`) passent par le réseau.
- **`recettes.json`.** Réseau d'abord ; la copie en cache est servie si le réseau échoue, répond en erreur
  ou met plus de **4 s** (connexion faible en magasin). Dans ce dernier cas la requête continue en
  arrière-plan et met le cache à jour. La copie servie porte l'en-tête `X-Gueathub-Cache: 1`, d'où le
  bandeau « Hors ligne — recettes du JJ/MM ».
- **Photos.** Cache d'abord, 80 entrées au plus (les plus anciennes sont retirées). Photo jamais vue et hors
  ligne : réponse 504 vide (image absente, sans icône cassée grâce à `alt=""`).
- **Mise à jour.** Pas de `skipWaiting` automatique : le toast « Nouvelle version disponible » (sans limite
  de temps, et qui revient si un autre message passe devant) propose « Recharger ». Première installation :
  `clients.claim()` pour fonctionner hors ligne tout de suite, sans recharger la page. Recherche de mise à
  jour à chaque retour au premier plan (app installée laissée ouverte).
- **« Effacer les données de l'app »** ne vide pas les caches hors ligne (arbitrage : ce ne sont pas des
  données personnelles, et ils se renouvellent à chaque version).
- **Développement local.** Avec `jekyll serve`, chaque régénération change `site.time`, donc la version :
  le toast de mise à jour apparaît après chaque modification. Pratique pour tester ; sinon, cocher « Update
  on reload » dans l'onglet Application des outils de développement.
- **Tests.** Validé dans Chromium (Playwright, hors repo, contexte persistant) : manifest sans erreur et
  aucune erreur d'installabilité (CDP), pré-cache, limite des 80 photos, mode avion (ouverture, recettes,
  bandeau, photo déjà vue, coches, rechargement), mise à jour avec « Recharger » et nettoyage des caches.
  Les parcours de la phase 3 repassent avec le service worker actif.

## Phase 5 — intégration au Hub

- **Vraies recettes.** Les recettes d'exemple (crêpes, quiche lorraine) ont été remplacées par les vraies
  (commit à part). Les tests ne dépendent plus d'aucune vraie recette : l'exemple du §6.5 et le test des
  photos utilisent les copies figées de `tests/fixtures/reference/`.
- **Page Outils (option A).** Seul changement : `permalink: /outils/` dans `pages/outils.md`. Pas de
  `_data/outils.yml` ni de nouvelle page. `/pages/outils.html` n'existe plus (404) : rien dans le repo n'y
  pointait et la nav suit d'elle-même ; pas de redirection ajoutée.
- **Article.** `_posts/2026-09-17-gueathub.md`, catégorie `tool`, calqué sur celui d'icomkr (titres en
  capitales soulignés, sections « À quoi ça sert », « Comment on l'utilise », « Sur quelle techno c'est
  bâti », « Ajouter une recette »). Chemins de fichiers en `code` pour que Markdown ne transforme pas les
  `_` en italique. Liens vers le schéma et `ingredients.txt`.
- **Vignette.** `image: "vignette-gueathub.ico"` : le fichier `assets/images/vignette-gueathub.ico` doit
  être ajouté avant de publier (sinon image cassée sur l'accueil, la page Outils et l'article).
- **README du repo.** gueathub ajouté au tableau « Existant » (outil, dossier, `outils/gueathub/`).
- **Exclusions.** Déjà en place depuis la phase 1.
- **Contrôle du blog** (Jekyll 4.3 et 3.10, référence `3791e2e`, après normalisation du lien Outils et de la
  ligne `tokens.css`) : 62 fichiers identiques ; différences attendues uniquement : `/pages/outils.html`
  devenu `/outils/` (avec l'entrée gueathub), accueil (nouvel article en tête, le plus ancien des 8 sort de
  la liste), `feed.xml` (nouvel article), nouvel article, `README.md`, et `style.css` (jetons, phase 3).

## Phase 6 — documentation

- **`README.md` de l'app** (non publié) : ajouter une recette en 4 étapes, règles essentielles du contrat,
  commandes de développement. Volontairement court : le détail reste dans le schéma et ce fichier.
- **`npm run photos`** (option du §12, retenue) : `_photos/<id>.jpg|jpeg|png|webp` →
  `assets/gueathub/recettes/<id>.webp`, 1200 px de large au plus (jamais agrandie), WebP qualité 80,
  orientation EXIF appliquée. Les **métadonnées ne sont pas recopiées** (EXIF, position GPS des photos de
  téléphone). Nom de fichier ≠ id valide : photo ignorée, code de sortie 1 ; id sans recette : avertissement.
  `_photos/` est dans `.gitignore` et, commençant par « _ », n'est pas publié par Jekyll.
- **Photo mal formatée.** `npm run check` avertit (`photo-format`) quand un `.webp` n'a pas la signature
  WebP (par exemple un JPEG simplement renommé) : les navigateurs l'affichent, mais le poids et le format ne
  sont pas ceux attendus.
- **Procédure vérifiée** sur une copie du repo : nouvelle recette + photo en suivant le README seul →
  `npm run check` sans erreur, recette et photo présentes dans `recettes.json`, nom dans `ingredients.txt`.
