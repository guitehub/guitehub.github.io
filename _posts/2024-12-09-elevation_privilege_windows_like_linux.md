---
layout: post
title: "Sécuriser Windows : mot de passe admin et UAC"
date: 2024-12-09
categories:
- guide
- sysadm
author: "La Guite"
image: "uac-windows-10.png"
---


### Donner un Comportement "Linux-like" à Windows pour les Élévations de Privilèges

Si vous êtes administrateur système et que vous trouvez le comportement par défaut de l’UAC (User Account Control) sous Windows un peu trop permissif, voici un petit conseil pour sécuriser un peu plus vos sessions. L’idée est de rapprocher Windows d’un comportement typique des systèmes Linux (Debian-like) : même depuis une session avec des droits administrateurs, toute action nécessitant une élévation demandera la saisie du mot de passe administrateur.

#### Pourquoi faire ça ?
Par défaut, Windows affiche un simple pop-up UAC avec une question "Oui/Non" pour confirmer les actions nécessitant des droits élevés. Cela peut laisser la porte ouverte à des erreurs ou des abus si quelqu’un accède temporairement à votre poste. En exigeant la saisie du mot de passe, vous ajoutez une couche de sécurité et rendez l’accès administratif plus intentionnel, comme avec `sudo` sous Linux.

#### Configuration
Pour activer cette fonctionnalité, il suffit de modifier une clé de registre :

1. **Ouvrez l’éditeur de registre** :  
   Exécutez `regedit` via le menu Démarrer ou en appuyant sur `Win + R`.

2. **Naviguez à la clé suivante** :  
   ```
   HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System
   ```

3. **Modifiez la valeur** :
   - Localisez (ou créez) une clé DWORD nommée `ConsentPromptBehaviorAdmin`.
   - Définissez sa valeur à `1`.

4. **Redémarrez la machine** pour appliquer le changement.

#### Résultat attendu
Avec cette configuration, chaque demande d’élévation affichera une invite vous demandant de saisir le mot de passe d’un compte administrateur valide, même si vous êtes déjà connecté avec des droits élevés.

#### Et pour les fans du "timeout sudo" ?
Malheureusement, Windows ne propose pas de mécanisme natif permettant de "mémoriser" la saisie du mot de passe pour quelques minutes, comme `sudo`. Une alternative consiste à utiliser un terminal PowerShell ou CMD élevé pour exécuter plusieurs commandes successives nécessitant des privilèges, mais cela reste une contrainte de l’écosystème Windows.



## Pour renforcer la sécurité d'une session Windows

En complément de la modification de la clé de registre `ConsentPromptBehaviorAdmin`, il est recommandé de régler l'UAC (User Account Control) au niveau maximum. Cela garantit que Windows vous avertira toujours lorsqu'une application ou un processus tente de modifier des paramètres système ou d'effectuer des actions nécessitant des privilèges élevés.

### Étapes pour régler l'UAC au maximum :

1. **Accédez aux paramètres de l'UAC** :
   - Ouvrez le menu Démarrer et tapez **"UAC"**.
   - Cliquez sur **"Modifier les paramètres de contrôle de compte d'utilisateur"**.

2. **Réglez le curseur sur le niveau le plus élevé** :
   - Faites glisser le curseur vers le haut, jusqu'à **"Toujours m'avertir"**.

3. **Validez le changement** :
   - Cliquez sur **OK** et acceptez l'élévation de privilège si une invite UAC apparaît.

---

### Résultat attendu :
- Vous serez averti chaque fois qu'une application tente d'apporter des modifications à votre système.
- Toute modification nécessitant des privilèges administratifs vous affichera une boîte de dialogue sur le **bureau sécurisé**, empêchant les interactions malveillantes d'autres applications.

### Pourquoi c'est important ?
Cette configuration :
- Ajoute une couche de protection contre les logiciels malveillants.
- Vous donne un contrôle total sur les actions qui touchent le système.
- Est particulièrement utile dans des environnements critiques ou partagés, où le risque d'exécution non intentionnelle de logiciels malveillants est plus élevé.
