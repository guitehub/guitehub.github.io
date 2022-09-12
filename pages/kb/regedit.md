# A quoi servent et comment s'organisent les **Registres Windows** (regedit)

Sur fond de [Wiki](https://fr.wikipedia.org/wiki/Base_de_registre)

"Regedit" c'est C:\Windows\System32\regedt32.exe

HKEY signifie "Handle to registry KEY" (descripteur de clé de registre) et est un typedef disponible en c++ sur Windows

5 sortent de HKEY:
- HKEY_CLASSES_ROOT (HKCR) contient les informations sur les applications enregistrées ; cela inclut entre autres les associations entre extensions de fichiers et identifiants de classe

- HKEY_CURRENT_USER (HKCU) contient les informations concernant l'utilisateur connecté. Ce n'est qu'une sous-branche de HKEY_USERS

- *HKEY_LOCAL_MACHINE* (HKLM) contient les informations qui sont générales à tous les utilisateurs de l'ordinateur

- *HKEY_USERS* contient les informations spécifiques de chaque utilisateur. La sous-branche correspondant à l'utilisateur courant est l'équivalent de HKEY_CURRENT_USER. Attention, cette ruche n'est visible que si l'utilisateur associé est connecté

- HKEY_CURRENT_CONFIG contient des informations qui sont mises à jour immédiatement, elles sont régénérées après chaque boot
