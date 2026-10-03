# Vérification du livrable

Vérifications exécutées dans le cloud le 3 octobre 2026 :

- `npm test` : un scénario d'intégration complet passé. Authentification, refus sans compte, isolation de deux utilisateurs, persistance, document transmis, événement SSE, clé API, révocation, réinitialisation par un processus local indépendant, refus d'origine étrangère et fournisseur compatible OpenAI simulé.
- Chromium : deux contextes navigateur indépendants, ordinateur et téléphone. Connexion, conversation, document, synchronisation, panneau repliable, génération/révocation de clé et déconnexion. Pas d'erreur JavaScript détectée, pas de débordement horizontal.
- `node scripts/check-server.mjs` : santé 200, page 200, API sans connexion 401.
- `scripts/install-linux.sh` exécuté dans des répertoires XDG temporaires : installation serveur, tests et configuration avec permissions 600.
- Création de compte par `scripts/account-linux.sh` testée dans un terminal interactif avec saisie masquée et dossier temporaire.
- Syntaxe des scripts shell et du client Electron vérifiée.
- Unité générée par `scripts/install-service.sh` validée par `systemd-analyze verify` sans avertissement. Le rechargement/démarrage systemd est indisponible dans le cloud faute de session utilisateur ; reste à valider sur M1A.

Non vérifiés : fournisseur de modèle réel, lancement graphique Electron, routage téléphone vers la machine M1A, domaine et certificat HTTPS, redémarrage du PC et restauration des services. Le téléchargement du binaire Electron a échoué dans le cloud avec `EAI_AGAIN github.com` ; aucun contournement de signature ou TLS n'a été utilisé.

L'application n'est pas déployée sur Internet. Le transfert du code sur le dépôt GitHub a été autorisé par l'utilisateur ; suivre les instructions de `REPRISE-LOCALE.md`. Le livrable ne contient aucun mot de passe ni clé réels.
