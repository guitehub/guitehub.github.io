---
layout: post
title: "Mise hors tension d’un hôte de vSAN stretched cluster"
date: 2024-12-08
categories:
- guide
- sysadm
author: "La Guite"
image: "VMwarevSAN.png"
---

Ce tutoriel détaille les étapes nécessaires pour éteindre temporairement un hôte ESXi dans un cluster vSAN stretched avec un witness. Nous intégrons les éléments critiques liés aux politiques de tolérance (FTT), aux pré-checks vSAN, et aux opérations vSAN (rebuild, santé du cluster, etc.).

## 1. Préparation et vérifications initiales

### 1.1 Vérifier la santé du cluster vSAN
1. Accédez à vSAN Health dans vSphere Web Client.
2. Confirmez que toutes les vérifications sont au vert :
    - Pas d’alertes critiques.
    - Le Witness Appliance est pleinement opérationnel.
3. Vérifiez que la connectivité réseau (vSAN et Witness) est fonctionnelle.

### 1.2 Vérifier la politique de stockage appliquée
Pour garantir que les données restent accessibles, assurez-vous que la politique de stockage permet au cluster de tolérer une défaillance :
1. Accédez à vSAN Cluster → Configuration → vSAN Policies.
2.Vérifiez que le paramètre "Failures to Tolerate (FTT)" est réglé sur 1.
    - Si FTT=1, cela signifie qu'une copie des données est disponible sur l’autre nœud (ou sur le Witness) et que le cluster peut tolérer l’arrêt d’un hôte.
> Exemple : Une configuration stretch cluster avec Fault domain failures to tolerate = 1 est conforme pour ce scénario.

![vsan storage policies](/assets/images/241208-cap1.png)

### 1.3 Vérifier et ajuster le timer des rebuilds
Par défaut, vSAN déclenche une reconstruction des données non conformes si un hôte reste hors ligne plus de 360 minutes (6 heures).
Si l’hôte doit être éteint pour 8 heures, modifiez ce timer pour éviter un rebuild inutile :
1. Accédez à vSAN Cluster → Advanced Options.
2. Recherchez le paramètre VSAN.ClomRepairDelay.
3. Changez sa valeur pour 600 minutes (ou une durée supérieure à votre fenêtre de maintenance).

![vsan cluster configuration](/assets/images/241208-cap2.png)

![vsan cluster advanced options](/assets/images/241208-cap3.png)

## 2. Pré-check et mise en mode maintenance

### 2.1 Migrer toutes les VM
Migrer manuellement les VM de l’hôte à éteindre vers l’hôte restant :
Utilisez vMotion pour déplacer les VM vers l’hôte actif.
Confirmez que toutes les VM sont opérationnelles sur l’autre hôte avant de continuer.

### 2.2 Effectuer le pré-check dans vSAN
Avant de passer en mode maintenance, utilisez l’outil de pré-check intégré dans vSphere pour garantir que toutes les conditions sont réunies.
1. Accédez à l’hôte concerné → Cliquez sur Enter Maintenance Mode.
2. Choisissez l’option "Ensure Accessibility" (recommandé pour votre configuration).
3. Laissez le système effectuer un pré-check automatique :
    - Ce pré-check vérifie :
Que toutes les données resteront accessibles avec l’option choisie.
Que la politique FTT sera respectée (si ce n’est pas le cas, une migration ou un rebuild peut être suggéré).
    - Un message similaire à ceci pourrait apparaître :
"A rebuild operation for any non-compliant objects will be triggered in 360 minutes, unless the host is taken out of maintenance mode. You can change this timer for the cluster in the vSAN advanced settings."
4. Si le pré-check est OK, confirmez la mise en mode maintenance directement depuis cette fenêtre.
> Note : Si le pré-check identifie des problèmes, réglez-les avant de poursuivre (par exemple, ajuster la politique de stockage ou déplacer manuellement des objets critiques).

![vsan data migration pre-check](/assets/images/241208-cap4.png)

## 3. Mise hors tension de l’hôte
Une fois que l’hôte est en mode maintenance, procédez à son extinction via l’interface vSphere.
Confirmez que l’hôte est éteint dans l’interface.
##4. Surveiller le cluster pendant la maintenance
Vérifiez régulièrement la santé du cluster dans vSAN Health.
Assurez-vous que :
Le cluster reste accessible et opérationnel.
Aucune alerte critique ne survient pendant les 8 heures.

## 4. Surveiller le cluster pendant la maintenance

1. Vérifiez régulièrement la santé du cluster dans vSAN Health.
2. Assurez-vous que :
    - Le cluster reste accessible et opérationnel.
    - Aucune alerte critique ne survient pendant les 8 heures.

![vsan cluster node offline](/assets/images/241208-cap4.png)

## 5. Remise en ligne de l’hôte

### 5.1 Redémarrer l’hôte
Allumez l’hôte via la console iDRAC, iLO, ou l’interface distante appropriée.
Attendez que l’hôte réintègre le cluster.

### 5.2 Résynchronisation des données (si nécessaire)
Si un rebuild a été déclenché, vSAN synchronisera automatiquement les données entre les nœuds pour restaurer leur conformité.
Vérifiez l’état de la synchronisation dans vSAN Health → Resyncing Objects.

## 6. Étape finale : Sortir du mode maintenance
Une fois que l’hôte est pleinement opérationnel et synchronisé :
Désactivez le mode maintenance.
Confirmez que l’hôte participe activement au cluster et que toutes les données sont conformes à la politique de stockage.
Résumé des points importants
Pré-check critique : Effectuez un pré-check vSAN pour valider que l’option "Ensure Accessibility" est suffisante pour votre configuration.
FTT=1 : Assurez-vous que la politique de stockage garantit une tolérance adéquate.
Ajustement du timer rebuild : Évitez des rebuilds inutiles en augmentant le délai (VSAN.ClomRepairDelay) si l’hôte est éteint plus de 6 heures.
Surveillez activement la santé du cluster avant, pendant, et après la maintenance.

Avec cette méthodologie, l'opération sera sécurisée, optimisée, et sans impact majeur.