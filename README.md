# 🚀 Bot IA Omniscient - Qui a réponse à tout!

Un chatbot ultra-intelligent alimenté par Claude IA avec accès aux données réelles.

## 🌟 Capacités

- **Claude IA intégré**: Utilise les derniers modèles Claude pour répondre à TOUT
- **Données réelles**: Wikipedia, météo, blagues, etc.
- **Conversation contextuelle**: Garde l'historique pour une meilleure compréhension
- **Interface élégante**: Design moderne avec animations fluides
- **Multi-questions**: Pose n'importe quelle question!

## 🛠️ Installation

### 1. Cloner le repo
```bash
cd ia-savoir-total
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'API Claude
```bash
cp .env.example .env
# Éditer .env et ajouter votre clé API Anthropic
```

Obtenir une clé API: https://console.anthropic.com/

### 4. Démarrer le serveur
```bash
npm start
```

Le bot sera disponible sur: http://localhost:3000

## 📝 Utilisation

Ouvrez http://localhost:3000 dans votre navigateur et posez des questions!

### Exemples de questions:
- "Qui est Albert Einstein?"
- "Météo à Paris"
- "4 plus 5"
- "Dis-moi une blague"
- "Traduis hello en français"
- "Quelle est la capitale de la France?"
- "Définis le mot intelligence"

## 🚀 Mode développement
```bash
npm run dev
```

Utilise `node --watch` pour recharger automatiquement le serveur.

## 🔧 Architecture

```
ia-savoir-total/
├── index.html      # Interface frontend
├── server.js       # Backend Node.js avec Express
├── package.json    # Dépendances
└── .env            # Variables d'environnement
```

## 📚 API Endpoints

### POST /api/chat
Envoyer un message au bot
```json
{
  "message": "Qui est Claude?",
  "sessionId": "default" // optionnel
}
```

### POST /api/weather
Récupérer la météo
```json
{
  "city": "Paris"
}
```

### POST /api/search-wikipedia
Rechercher sur Wikipedia
```json
{
  "query": "Albert Einstein"
}
```

## 🔐 Sécurité

- La clé API est stockée localement dans .env
- Les conversations sont stockées en mémoire
- CORS est activé pour le développement local

## 📦 Dépendances

- **express**: Framework web
- **cors**: Gestion CORS
- **dotenv**: Variables d'environnement
- **@anthropic-ai/sdk**: SDK Claude

## 📄 Licence

MIT

## 🤝 Support

Si vous avez des problèmes:
1. Vérifiez que le serveur est démarré (`npm start`)
2. Assurez-vous que ANTHROPIC_API_KEY est défini dans .env
3. Vérifiez les logs du serveur pour les erreurs
