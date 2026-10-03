# M1A · Inference

Interface de discussion web et bureau, style terminal. Node.js 24 recommandé.

Pour l'installation sur l'ordinateur Linux M1A, commencer par [REPRISE-LOCALE.md](REPRISE-LOCALE.md). Les scripts `scripts/install-linux.sh`, `scripts/account-linux.sh` et `scripts/install-service.sh` préparent les dépendances, les comptes et le démarrage automatique sans remplacer une configuration existante. Un reverse proxy HTTPS est décrit dans `deploy/`.

## Web

`npm start` lance le serveur sur le port 3000 (adresse locale). Sans configuration, le mode démonstration est explicitement affiché. Pour un modèle réel, exporter `MODEL_BASE_URL`, `MODEL_NAME` et éventuellement `MODEL_API_KEY` avant le lancement (voir `.env.example` ; le fichier `.env` n'est pas chargé automatiquement). Le serveur utilise l'API compatible OpenAI `/chat/completions`, également proposée par Ollama.

## Bureau

`npm ci`, puis `npm run desktop`, avec le serveur web déjà lancé. Electron ouvre la même interface. Pour un serveur distant, exporter `M1A_SERVER_URL` avec son adresse HTTPS. Le bureau et le web doivent utiliser le même serveur pour partager les conversations ; les événements SSE mettent à jour les deux interfaces.

## Fonctionnalités et limites

- Conversations persistées dans `data/conversations.json`, synchronisation en direct.
- Documents textuels joints au fil et transmis au modèle : 8 maximum, 200 Ko chacun. PDF, Word et images ne sont pas encore pris en charge.
- Résumé explicatif repliable : il décrit le contexte utilisé, pas le raisonnement privé du modèle.
- Discussion disponible ; futurs modes Agent, Recherche et Code affichés mais désactivés.
- Clé du modèle conservée côté serveur. Messages rendus comme texte pour éviter l'injection HTML.
- Comptes séparés, connexion par mot de passe, sessions de 7 jours et clés API révocables. Les mots de passe utilisent scrypt et les clés sont stockées sous forme de condensats.
- Aucun formulaire de création ou de réinitialisation distant. Depuis le terminal du serveur : `node account.mjs alice`. Le mot de passe est saisi de façon masquée ; cette commande crée le compte ou remplace son mot de passe et révoque ses sessions et clés.
- Aucun compte ni mot de passe par défaut. Plusieurs connexions et conversations sont possibles par utilisateur.
- Le lancement Electron exige un environnement graphique. Aucun installateur bureau n'est encore fourni.

`npm test` vérifie le stockage, les pièces jointes, la démonstration et la diffusion des mises à jour.

## Mise en ligne

L'environnement de travail Codex ne constitue pas un hébergement permanent. Installer le projet sur une machine ou un VPS avec Node 24, conserver le dossier `data/` sur un disque persistant, créer les comptes localement et exécuter le serveur sous un gestionnaire de services. Sauvegarder `data/` : il contient les comptes et les conversations en clair au repos. Une seule instance serveur doit utiliser ce dossier.

Placer un reverse proxy HTTPS devant le port local 3000, puis exporter `PUBLIC_ORIGIN=https://votre-domaine.example` et `COOKIE_SECURE=1`. Ne pas exposer le port 3000 directement. Exemple Caddy (remplacer le domaine et configurer son DNS vers le serveur) :

```caddy
chat.votre-domaine.example {
  reverse_proxy 127.0.0.1:3000
}
```

La limitation des tentatives de connexion utilise l'adresse du proxy si celui-ci est devant le serveur : elle peut donc affecter plusieurs utilisateurs. Prévoir également une limitation au niveau du proxy. Les quotas d'utilisation du modèle, le chiffrement au repos et les installateurs bureau restent à ajouter avant un service destiné à un large public.

## API

Dans l'interface, ouvrir **Clés API**, puis **Générer une clé**. Copier la clé au moment de sa création ; elle ne sera plus affichée. Les appels utilisent `Authorization: Bearer VOTRE_CLE`.

- `GET /api/state` : conversations de l'utilisateur.
- `POST /api/conversations` avec `{}` : nouvelle conversation, retourne son `id`.
- `POST /api/messages` avec `{"conversationId":"ID","content":"Bonjour","documents":[]}` : message et réponse du modèle.
- `GET /api/events` : événements SSE des conversations.

Les clés permettent d'appeler le service de discussion M1A ; ce prototype n'expose pas encore une API `/v1/chat/completions` compatible OpenAI en entrée.
