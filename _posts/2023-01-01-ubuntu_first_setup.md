---
layout: post
title: Setup server Ubuntu
date: 2023-01-01
categories:
- guides
- sysadm
image: logo-ubuntu-1024x576.png
---

# Comment bien setup un petit server ubuntu

Guides des premières étapes de base au premier lancement d'un nouveau système(serveur) linux  
Valable à partie de Ubuntu >=20 environ

## 1. Premier setup 

### màj:
```bash
apt get update
```
```bash
apt get upgrade
```

### config IP:
if ipStatic  
src : [https://doc.ubuntu-fr.org/netplan](https://doc.ubuntu-fr.org/netplan)

```bash
nano \etc\netplan\xx-yyyyyy-config.yaml
```

```yaml
network:
    version: 2
    renderer: networkd
    ethernets:
        enp0s3:
            dhcp4: no
            addresses: [10.1.xxx.yyy/zz]
            gateway4: 10.1.xxx.yyy
            nameservers:
                addresses: [w.x.y.z,1.1.1.1]
```
(éventuellement passer direct renderer en [NetworkManager](https://ubuntu.com/core/docs/networkmanager))

on oublie pas de reset la config
```bash
netplan apply
```
ou
```bash
reboot
```

## 2. Config SSH

check état ssh  
cf : [https://doc.ubuntu-fr.org/ssh](https://doc.ubuntu-fr.org/ssh)

✅ avoir une clé  
✅ la copier sur le srv  
sinon cf : [https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys-on-ubuntu-1804-fr](https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys-on-ubuntu-1804-fr)

```bash
nano /etc/ssh/sshd_config
```
pour ajouter à la fin
```txt
#...
PasswordAuthentication no
PubkeyAuthentication yes
```

puis redémarrer le service ssh
```bash
sudo systemctl restart ssh
```

all done pour la console direct sur le serveur

### Sur le poste utilisateur
```
code ~/.ssh/config
```

```txt
Host {nom d'hôte}
    Hostname {ip ou nom d'hôte}
    IdentityFile ~/.ssh/{clé à utiliser}
```
  
enfin pour se connecter
```
ssh {compte}@{nom d'hôte}
```

un petit `reboot` ça fait jamais de mal
```bash
reboot
```

## 3. Je recommande l'installation de cockpit
cf : [COCKPIT](https://cockpit-project.org/)

reconnexion en ssh  
passe en sudo

update les repo si c'est pas déjà fait
```bash
apt update
```

install les packets
```bash
apt install cockpit -y
```

démarre le service
```bash
systemctl start cockpit cockpit.socket
```

auto activer cockpit au démarrage
```bash
systemctl enable cockpit cockpit.socket
```

💡 tips :  
>If you receive the message “cannot refresh cache whilst offline” from with Cockpit > Software Updates  

cf : https://caissyroger.com/2020/10/05/cockpit-cannot-refresh-cache-whilst-offline/

tldr : faut editer /etc/netplan/00-installer-config.yaml comme
```yaml
network:
    ethernets:
        enp2s0:
            dhcp4: true
        version: 2
        renderer: NetworkManager
```
  
monitor via  
https://{hostname}:9090/

---
*LaGuite © 09/2022*