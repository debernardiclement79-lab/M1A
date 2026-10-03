# Reprise dans « configuration environnement M1A »

## Objectif validé avec l'utilisateur

M1A est l'ordinateur Linux de l'utilisateur, pas un hébergeur cloud. Installer sur cette machine le serveur qui fournit la page web au téléphone. La même application Electron doit utiliser ce serveur et afficher les conversations synchronisées. Style terminal épuré, accents cyberpunk. Comptes et sessions par utilisateur, mots de passe, réinitialisation exclusivement depuis le terminal local, pièces jointes textuelles et clés API générables/révocables. API de modèle compatible OpenAI configurable ; elle peut pointer vers un moteur déjà installé sur M1A. Ne pas exposer les moteurs de modèle directement sur Internet.

La session locale existante a été repérée en lecture seule : titre exact « configuration environnement M1A », identifiant `01a10270-c241-7601-a179-87ebd2cea7bb`. Ses téléchargements de modèles et ses travaux en cours sont indépendants de cette interface : les préserver et ne pas les relancer. L'archive de cette interface ne contient aucun modèle.

## Transfert

Le code a été produit dans `/workspace/M1A` dans le cloud. Le transfert retenu, autorisé par l'utilisateur, passe par le dépôt GitHub `debernardiclement79-lab/M1A`, branche `main`.

Dans la session locale, cloner dans un nouveau dossier libre :

```bash
git clone --branch main https://github.com/debernardiclement79-lab/M1A.git m1a-interface
cd m1a-interface
```

Lire ce guide avant installation. Si un clone existe déjà, inspecter ses remotes, son état et ses changements avant de le mettre à jour ; ne jamais écraser les travaux locaux. Utiliser l'authentification GitHub locale existante si le dépôt est privé, sans demander de clé dans le chat. Aucun compte, secret, historique réel, modèle ou `node_modules` n'est inclus dans le dépôt. L'archive ZIP reste un livrable cloud facultatif ; son chemin `/workspace` n'est pas accessible depuis la machine locale.

## Installation locale

1. Lire les éventuels `AGENTS.md` locaux. Repérer le dossier extrait, la distribution Linux, Node, systemd et les services existants. Préserver les modifications et configurations existantes. Vérifier les ports utilisés.
2. Depuis le dossier extrait : `bash scripts/install-linux.sh`. Requiert Node 24+, Python 3 pour la génération du service et systemd utilisateur pour le démarrage automatique. Aucun droit administrateur utilisé par ce script. Les dépendances serveur sont natives à Node ; Electron est optionnel.
3. Créer le premier compte : `bash scripts/account-linux.sh NOM_UTILISATEUR`. Saisie interactive masquée du mot de passe, aucun secret dans les prompts/chat/arguments. Les données se trouvent dans `~/.local/state/m1a/` (ou XDG_STATE_HOME).
4. Éditer localement `~/.config/m1a/server.env` (ou XDG_CONFIG_HOME), permissions 600. Identifier l'API du moteur existant via ses instructions et vérifier `/v1/models` si pris en charge. Configurer MODEL_BASE_URL et MODEL_NAME, éventuellement MODEL_API_KEY, sans afficher de clé. Le fournisseur n'est pas encore choisi au-delà de la compatibilité OpenAI. Sans configuration : démonstration explicitement annoncée.
5. `bash scripts/install-service.sh` génère un service utilisateur avec les chemins réels et ne remplace pas un service existant. Après vérification : `systemctl --user enable --now m1a.service`. Pour continuer après déconnexion et au démarrage, vérifier le statut linger puis, si nécessaire, `sudo loginctl enable-linger "$USER"` selon les autorisations de la session locale.
6. `node scripts/check-server.mjs` vérifie page, santé et protection de l'API. Ouvrir la page locale, se connecter, envoyer un message à un modèle réel et vérifier la réponse. Vérifier aussi que le compte local et le service utilisent le même dossier de données.
7. Bureau facultatif : `npm ci`, `npm run desktop`. Vérifier les bibliothèques Linux requises par Electron. Ne pas désactiver son sandbox. L'exécutable Electron n'a pas pu être téléchargé dans le cloud (résolution DNS GitHub) ; le bureau n'est pas déclaré validé.

## Accès téléphone / Internet

Le besoin est un accès web au M1A, y compris potentiellement depuis Internet. L'adresse publique, le domaine et la méthode d'accès ne sont pas encore choisis. Continuer d'abord les tests locaux.

- Pour Internet : utiliser un reverse proxy HTTPS sur M1A (modèle `deploy/Caddyfile.example`) avec domaine/DNS et routage adaptés, ou un tunnel HTTPS sécurisé si le réseau ne permet pas d'accès entrant. Ne pas créer un compte fournisseur ou publier le service sans les paramètres correspondants.
- Conserver HOST=127.0.0.1 pour que le backend soit uniquement accessible via le proxy/tunnel. Utiliser PUBLIC_ORIGIN avec l'origine HTTPS exacte et COOKIE_SECURE=1. Redémarrer le service après modification.
- Vérifier DNS, NAT/CGNAT, pare-feu, certificat et alimentation/veille du M1A avant d'annoncer un accès permanent. N'ouvrir que les ports nécessaires à la solution retenue ; ne jamais exposer l'API brute du moteur.
- Le client bureau doit utiliser la même origine HTTPS avec M1A_SERVER_URL si les cookies Secure sont activés. Exemple : `M1A_SERVER_URL=https://ADRESSE npm run desktop`.
- Sur téléphone, tester connexion, envoi, pièces jointes et synchronisation avec un deuxième client. Vérifier aussi les refus sans authentification et la séparation des comptes.

## Validation déjà réalisée dans le cloud

`npm test` exerce réellement connexion/refus, séparation des utilisateurs, conversation et document, notification SSE, stockage, clés API et révocation, réinitialisation, refus d'origine étrangère et requête à un faux fournisseur compatible OpenAI. Le faux fournisseur prouve le format de l'intégration, pas le fonctionnement du futur modèle réel.

L'interface a aussi été testée avec Chromium et deux clients indépendants, dont un écran de téléphone de 390 × 844 : connexion, envoi, document joint, synchronisation, panneau repliable, création/révocation de clé et déconnexion. Aucune erreur JavaScript ni débordement horizontal détecté. Captures fournies séparément. `install-linux.sh` a été exécuté avec des répertoires XDG temporaires ; le fichier de configuration créé a les permissions 600. L'unité systemd générée a passé `systemd-analyze verify` sans avertissement. Le démarrage systemd et le client Electron restent à vérifier sur la machine réelle.

## Limites explicites

Les modes Agent/Recherche/Code sont des choix désactivés. Le panneau repliable affiche des informations sur le contexte, jamais le raisonnement privé du modèle. Pas de support PDF/Word/images. Pas d'API d'entrée OpenAI `/v1/chat/completions` : les clés donnent accès aux endpoints M1A documentés. Stockage JSON pour une seule instance ; ne pas lancer plusieurs serveurs simultanément sur le même dossier. Arrêter le serveur pendant les modifications locales de comptes (le script fourni gère le service utilisateur). Prévoir les quotas et une limitation des tentatives au proxy avant un usage public important. Les historiques ne sont pas chiffrés au repos ; protéger et sauvegarder le dossier de données sans publier ses secrets. Aucune mise en ligne ni installation réelle sur M1A n'a été effectuée depuis le cloud.
