# gueathub 2.0 — ajouter une recette depuis l'app

Plan pour une version future (non commencée). Objectif : envoyer une recette (JSON du convertisseur + photo)
depuis un écran de l'app, sans passer par un ordinateur ni `git`.

## Principe

L'app écrit dans le repo, via l'API GitHub, les mêmes fichiers qu'un commit fait à la main :

- `_data/gueathub/recettes/<id>.json`
- `assets/gueathub/recettes/<id>.webp`

GitHub Pages reconstruit alors le site comme après un `git push`. **Aucun changement de structure** : données,
schéma, `recettes.json`, service worker et déploiement restent tels quels. Pas de backend (Supabase écarté
pour ce besoin : il ne se justifierait que pour des comptes multi-utilisateurs ou des listes partagées).

**Version : 2.0.0**, choix assumé pour marquer le passage d'une app en lecture seule à une app qui publie.

## Ce qu'on ajoute

- **Écran « Ajouter une recette »** (`#/ajouter`) : JSON collé ou fichier choisi, photo, aperçu de la fiche,
  erreurs et avertissements, bouton « Publier ».
- **Module d'envoi** vers l'API GitHub.
- **Réglages** : champ « Clé GitHub » (enregistrer, retirer, tester).
- Sans clé enregistrée, l'écran d'ajout n'est pas proposé (confort, pas sécurité).

## API GitHub

`api.github.com` accepte les appels depuis le navigateur (CORS) : pas de serveur intermédiaire.

- **Retenu : API « Git Data »** : un seul commit atomique avec les deux fichiers, donc un seul build Pages.
  1. Lire le dernier commit de `main` (ref).
  2. Créer un blob par fichier (JSON, photo en base64).
  3. Créer un tree basé sur celui du dernier commit.
  4. Créer le commit (message « gueathub : recette <titre> »).
  5. Déplacer `main` sur ce commit (échec si `main` a bougé entre-temps : relire et recommencer).
- Écarté : API « Contents », qui donne un commit et un build par fichier.
- Après publication, la recette apparaît en une minute environ : `recettes.json` est chargé réseau d'abord,
  et la liste `photos` est recalculée au build.

## Ce que font les hooks, refait dans l'app

Un commit par l'API ne déclenche pas husky, et la CI `gueathub-check` **ne bloque pas** la publication.
Tout doit donc être fait avant l'envoi.

| Hook aujourd'hui | Dans l'app |
|---|---|
| `npm run photos` (WebP, 1200 px, orientation) | Canvas : décodage avec orientation EXIF appliquée, 1200 px de large au plus (jamais agrandie), export WebP qualité 0,8 |
| Suppression des métadonnées | Automatique : le réencodage par canvas ne recopie ni EXIF ni GPS |
| `npm run check` | Validation dans l'app, bloquante |
| Mise en forme JSON | Réécriture avec l'indentation du repo et un saut de ligne final (diffs propres) |

**Validation avant envoi.**
- Bloquant : schéma non respecté, rayon inconnu (l'app connaît `categories`), `id` invalide ou différent du
  nom de fichier, nom non canonique (NFC, minuscules).
- `id` déjà existant : proposer « Remplacer la recette ? » (il faut alors écrire par-dessus, pas créer).
- Avertissements (non bloquants) : nom proche d'un existant (`nearDuplicateKey` de `text.js`, déjà partagé
  avec le script), tag hors vocabulaire, pas de photo.
- À trancher : `ajv` n'est qu'une dépendance de dev et l'app n'a pas d'étape de build pour son JS. Soit un
  validateur écrit à la main calqué sur le schéma, soit une copie autonome d'ajv.
- Garder `npm run check` comme référence : les deux validations ne doivent pas diverger (tests communs).

## Authentification : jeton personnel « fine-grained »

GitHub → Settings → Developer settings → Personal access tokens → Fine-grained :

- **Repository access** : *Only select repositories* → `guitehub.github.io` uniquement.
- **Permissions** : *Contents : Read and write*, rien d'autre.
- **Expiration** : une date (par exemple 1 an), à renouveler.

Collé une fois par appareil dans les Réglages. Stocké en local sur l'appareil, jamais dans le repo, envoyé
seulement à `api.github.com` (en-tête `Authorization: Bearer …`). OAuth (« se connecter avec GitHub ») est
écarté : l'échange du code contre un jeton exige un serveur.

**Limites connues.**
- Le jeton donne l'écriture sur **tout** le repo (tout le blog), pas seulement sur un dossier. En cas de
  fuite : révocation en un clic sur GitHub, et l'historique git permet de tout annuler.
- Tout le site partage le même domaine, donc le même stockage local : une faille de script n'importe où sur
  le blog pourrait lire la clé. Risque faible (tout le code est maison), mais réel.
- Variante plus prudente : écrire sur une branche `ajouts` et ouvrir une pull request à fusionner depuis
  l'app GitHub (relecture avant publication, moins direct). Possible aussi : protéger `main`.

## Lecture par les autres

Inchangée. Les visiteurs lisent le site publié (`recettes.json`, photos) sans compte ni clé. Le repo reste
public ; seul le détenteur du jeton peut écrire.

## Conséquences pratiques

- Le repo local prend du retard sur `main` : `git pull` avant de pousser depuis l'ordinateur (pas de conflit
  attendu, les fichiers sont différents).
- Le service worker ne doit pas intercepter ni mettre en cache les appels à `api.github.com`.
- L'envoi se fait en ligne uniquement : message clair hors ligne, saisie conservée jusqu'à l'envoi.

## Décisions à prendre avant de coder

1. Commit direct sur `main` ou pull request depuis une branche ?
2. « Effacer les données de l'app » efface-t-il aussi la clé GitHub ? (Plutôt non, ou en le disant clairement.)
3. Validateur : écrit à la main ou ajv embarqué ?
4. Permettre de modifier une recette existante depuis l'app, ou seulement d'en ajouter ?

## Pistes écartées pour cette version

- **Supabase** : utile seulement pour (a) une app multi-utilisateurs avec leurs propres recettes, ou (b) une
  liste de courses partagée en temps réel. Points durs relevés : lexique d'ingrédients commun (sinon
  l'agrégation se dédouble), saisie des recettes sans le convertisseur, RGPD et contenus de tiers, hors ligne
  à resynchroniser, pause des projets gratuits après 7 jours d'inactivité. Liste partagée envisageable plus
  tard seule, par lien secret, en gardant les recettes statiques.
