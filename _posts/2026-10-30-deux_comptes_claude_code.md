---
layout: post
title: "Mémo : deux comptes Claude Code, perso et pro, sans les mélanger"
date: 2026-10-30
categories:
- guide
- dev
author: "La Guite"
image: "vignette-deux-comptes-claude.svg"
---

Si, comme moi, vous naviguez entre deux comptes Claude, un perso et un pro, vous n'avez sans doute pas envie de mélanger les usages : les historiques et les logs de session, les réglages, le harnais (hooks, MCP, skills, `CLAUDE.md` global), tout ça n'a rien à faire d'un côté à l'autre.

Claude Code n'a pas de système de profils intégré : il ne garde qu'une seule connexion active. La parade est de lui donner **un dossier de configuration par compte**, avec la variable d'environnement `CLAUDE_CONFIG_DIR`.

<div class="tldr" markdown="1">
<p class="tldr-tag">tl;dr</p>

```bash
# ~/.zshrc (ou ~/.bashrc)
alias claude-perso='CLAUDE_CONFIG_DIR=~/.claude-perso claude'
alias claude-pro='CLAUDE_CONFIG_DIR=~/.claude-pro claude'

claude-perso   # puis /login (compte perso), une seule fois
claude-pro     # puis /login (compte pro), une seule fois
/status        # dans une session : quel compte est actif
```
</div>

---
## Un dossier par compte

```bash
CLAUDE_CONFIG_DIR=~/.claude-perso
CLAUDE_CONFIG_DIR=~/.claude-pro
```

`CLAUDE_CONFIG_DIR` indique à Claude Code où ranger sa configuration. Chaque dossier contient tout ce qui est propre au compte : connexion, `settings.json`, historique des sessions, hooks, serveurs MCP, `CLAUDE.md` global.

Le dossier par défaut `~/.claude` reste celui de la commande `claude` toute seule. Si vous avez déjà tout configuré dedans, vous pouvez le garder pour l'un des deux comptes et ne créer qu'un seul nouveau dossier.

---

## Les alias

```bash
alias claude-perso='CLAUDE_CONFIG_DIR=~/.claude-perso claude'
alias claude-pro='CLAUDE_CONFIG_DIR=~/.claude-pro claude'
```

Chaque alias lance `claude` avec la variable positionnée pour cette seule commande : le reste du terminal n'est pas touché. Ils vont dans `~/.zshrc` (ou `~/.bashrc` si votre shell est bash), puis on recharge le fichier :

```bash
source ~/.zshrc
```

### Sur Windows (PowerShell)

Pas d'alias avec variable en PowerShell : on passe par des fonctions, dans le profil (`notepad $PROFILE` pour l'ouvrir) :

```powershell
function claude-perso { $env:CLAUDE_CONFIG_DIR = "$HOME\.claude-perso"; try { claude @args } finally { Remove-Item Env:CLAUDE_CONFIG_DIR } }
function claude-pro   { $env:CLAUDE_CONFIG_DIR = "$HOME\.claude-pro";   try { claude @args } finally { Remove-Item Env:CLAUDE_CONFIG_DIR } }
```

Le `finally` retire la variable en sortant de Claude Code, pour que le terminal reste propre. Ouvrez ensuite un nouveau terminal.

---

## `/login`, une fois dans chaque

```bash
claude-perso
```

Dans la session, tapez `/login` et connectez-vous avec le compte **perso** dans le navigateur. Quittez, puis même chose avec l'autre :

```bash
claude-pro
```

`/login`, cette fois avec le compte **pro**. La connexion est enregistrée dans chaque dossier : c'est fait une fois pour toutes.

---

## `/status`, pour vérifier

```text
/status
```

Dans une session, `/status` indique le compte connecté. À faire au moins la première fois de chaque côté.

---

## Au quotidien

```bash
cd chemin/vers/projet-perso
claude-perso
```

```bash
cd chemin/vers/projet-pro
claude-pro
```

Les deux peuvent tourner **en même temps**, dans deux terminaux.

À savoir :

- **rien n'est partagé** entre les deux dossiers : un réglage, un serveur MCP ou un hook ajouté d'un côté est à refaire de l'autre si vous le voulez aussi ;
- en revanche, ce qui est **dans le dépôt** (`CLAUDE.md` et `.claude/` du projet) est lu quel que soit le compte : c'est le projet qui le fournit, pas le profil.
