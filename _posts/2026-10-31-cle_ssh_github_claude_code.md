---
layout: post
title: "Mémo : clé SSH pour GitHub et Claude Code, sur Windows, macOS et Linux"
date: 2026-10-31
categories:
- guide
- dev
author: "La Guite"
---

Le pense-bête de la manip qu'on ne fait qu'une fois par machine, et donc qu'on oublie à chaque fois : créer une clé SSH **ed25519**, la déclarer sur GitHub, vérifier que ça marche, puis installer **Claude Code** dans le terminal.

Partout où vous voyez `vous@exemple.com`, `utilisateur` ou `depot`, remplacez par vos propres valeurs.

---

## 1. Ouvrir un terminal

| Système | Terminal à utiliser |
|---|---|
| **Windows 10/11** | **PowerShell** (le client OpenSSH est intégré à Windows). |
| **macOS** | **Terminal** ou iTerm2 (shell `zsh` par défaut). |
| **Linux** | Le terminal de votre choix (`bash` ou `zsh`). |

Vérifiez au passage que `ssh` répond :

```bash
ssh -V
```

---

## 2. Générer la clé

La commande est la même sur les trois systèmes :

```bash
ssh-keygen -t ed25519 -C "vous@exemple.com"
```

- Le `-C` n'est qu'un commentaire, qui sert à reconnaître la clé. Une adresse e-mail ou un libellé comme `"portable-perso"` conviennent tous les deux.
- Appuyez sur **Entrée** pour garder l'emplacement par défaut :
  - Windows : `C:\Users\<vous>\.ssh\id_ed25519` ;
  - macOS / Linux : `~/.ssh/id_ed25519`.
- Choisissez une **passphrase**. Ce n'est pas obligatoire, mais c'est recommandé : l'agent SSH (étape suivante) évite de la retaper sans arrêt.

On obtient deux fichiers :

- `id_ed25519` : la **clé privée**. Elle ne quitte **jamais** la machine.
- `id_ed25519.pub` : la **clé publique**. C'est elle qu'on donne à GitHub.

---

## 3. Charger la clé dans l'agent SSH

L'agent garde la clé déverrouillée en mémoire : on saisit la passphrase une seule fois.

### Windows (PowerShell en administrateur)

Le service `ssh-agent` est désactivé par défaut sur Windows. Il faut l'activer une fois pour toutes :

```powershell
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
```

Puis, dans un PowerShell normal :

```powershell
ssh-add $env:USERPROFILE\.ssh\id_ed25519
```

> **Piège classique sur Windows** : Git for Windows embarque son propre `ssh`, qui ne connaît pas l'agent Windows. Pour que Git utilise l'OpenSSH de Windows (et donc l'agent ci-dessus) :
>
> ```powershell
> git config --global core.sshCommand "C:/Windows/System32/OpenSSH/ssh.exe"
> ```

### macOS

Créez (ou ouvrez) le fichier de configuration SSH :

```bash
touch ~/.ssh/config
open -e ~/.ssh/config
```

Ajoutez-y ce bloc, puis enregistrez :

```
Host github.com
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519
```

Ajoutez ensuite la clé à l'agent. La passphrase est alors enregistrée dans le **Trousseau** et ne vous sera plus demandée :

```bash
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

### Linux

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

Sur la plupart des bureaux (GNOME, KDE), un agent tourne déjà avec la session et `ssh-add` suffit. Pour charger la clé automatiquement à la première connexion, ajoutez dans `~/.ssh/config` :

```
Host github.com
  AddKeysToAgent yes
  IdentityFile ~/.ssh/id_ed25519
```

> `UseKeychain` n'existe que sur macOS. Si vous partagez le même `~/.ssh/config` entre plusieurs systèmes, ajoutez `IgnoreUnknown UseKeychain` en tête du fichier pour éviter l'erreur `Bad configuration option`.

---

## 4. Copier la clé **publique**

Attention à bien copier le fichier **`.pub`**.

```powershell
# Windows (PowerShell)
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
```

```bash
# macOS
pbcopy < ~/.ssh/id_ed25519.pub

# Linux (Wayland / X11)
wl-copy < ~/.ssh/id_ed25519.pub
xclip -selection clipboard < ~/.ssh/id_ed25519.pub

# N'importe où : afficher la clé et copier la ligne à la main
cat ~/.ssh/id_ed25519.pub
```

La clé tient sur une seule ligne qui commence par `ssh-ed25519 AAAA…`.

---

## 5. La déclarer sur GitHub

1. GitHub → photo de profil → **Settings** → **SSH and GPG keys** → **New SSH key**.
2. **Title** : le nom de la machine (par exemple « Portable perso » ou « PC bureau »). Il vous servira plus tard à savoir quelle clé révoquer.
3. **Key type** : *Authentication Key*.
4. Collez la clé, puis cliquez sur **Add SSH key**.

---

## 6. Tester

```bash
ssh -T git@github.com
```

À la première connexion, SSH demande de confirmer l'empreinte du serveur. Pour une clé ed25519, celle de GitHub est :

```
SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU
```

Si elle correspond, répondez `yes`. Vous pouvez la vérifier sur [la page officielle de GitHub](https://docs.github.com/fr/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints).

Résultat attendu :

```
Hi utilisateur! You've successfully authenticated, but GitHub does not provide shell access.
```

---

## 7. Utiliser SSH dans ses dépôts

Pour cloner un dépôt en SSH, utilisez l'URL qui commence par `git@` :

```bash
git clone git@github.com:utilisateur/depot.git
```

Pour un dépôt déjà cloné en HTTPS, vérifiez d'abord l'URL actuelle, puis basculez-le en SSH :

```bash
git remote -v
git remote set-url origin git@github.com:utilisateur/depot.git
```

---

## 8. Bonus : installer Claude Code dans le terminal

Claude Code demande un compte payant (Pro, Max, Team, Enterprise) ou un compte Console : le plan gratuit de claude.ai ne suffit pas. Il fonctionne sur macOS 13+, Windows 10 (1809+), Ubuntu 20.04+ et Debian 10+.

### Installation

```bash
# macOS, Linux, WSL
curl -fsSL https://claude.ai/install.sh | bash
```

```powershell
# Windows (PowerShell)
irm https://claude.ai/install.ps1 | iex
```

Variantes avec un gestionnaire de paquets :

```bash
brew install --cask claude-code         # macOS (Homebrew)
winget install Anthropic.ClaudeCode     # Windows (WinGet)
```

L'installateur officiel (`install.sh` / `install.ps1`) met Claude Code à jour tout seul. Avec Homebrew ou WinGet, c'est à vous de lancer `brew upgrade claude-code` ou `winget upgrade Anthropic.ClaudeCode`.

Sur Windows, installez aussi [Git for Windows](https://git-scm.com/downloads/win). Claude Code se sert alors de Git Bash pour exécuter ses commandes.

### Vérifier

Ouvrez un **nouveau** terminal, puis :

```bash
claude --version
```

Si vous obtenez `command not found` sur macOS ou Linux, le dossier `~/.local/bin` n'est pas dans le `PATH`. Pour l'y ajouter (remplacez `~/.zshrc` par `~/.bashrc` si votre shell est bash) :

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Sur Windows, le dossier à ajouter au `PATH` est `%USERPROFILE%\.local\bin`.

### Lancer

```bash
cd chemin/vers/mon-projet
claude
```

Au premier lancement, le navigateur s'ouvre pour vous connecter à votre compte. Ensuite, quelques commandes à retenir :

- `/init`, dans la session : analyse le projet et crée un `CLAUDE.md` qui sert de contexte à Claude ;
- `claude doctor` : diagnostic de l'installation ;
- `claude update` : force une mise à jour.

Claude Code utilise le Git de la machine. La clé SSH configurée plus haut sert donc aussi quand il fait un `git push`.

---

## Antisèche

```bash
ssh-keygen -t ed25519 -C "vous@exemple.com"   # 1. générer
ssh-add ~/.ssh/id_ed25519                      # 2. charger (macOS : --apple-use-keychain)
cat ~/.ssh/id_ed25519.pub                      # 3. copier → GitHub > Settings > SSH keys
ssh -T git@github.com                          # 4. tester
```
