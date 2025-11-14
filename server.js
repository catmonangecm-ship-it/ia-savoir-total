import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize Claude client
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Context de conversation
const conversationHistory = new Map();

// === UTILITAIRES POUR RÉCUPÉRER DES DONNÉES RÉELLES ===

async function getWeatherData(city = 'Paris') {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`;
    const geoResp = await fetch(geoUrl);
    const geoData = await geoResp.json();

    if (geoData.results && geoData.results.length > 0) {
      const lat = geoData.results[0].latitude;
      const lon = geoData.results[0].longitude;
      const cityName = geoData.results[0].name;

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
      const weatherResp = await fetch(weatherUrl);
      const weatherData = await weatherResp.json();

      return {
        city: cityName,
        temperature: weatherData.current_weather.temperature,
        windSpeed: weatherData.current_weather.windspeed,
        weatherCode: weatherData.current_weather.weathercode
      };
    }
    return null;
  } catch (error) {
    console.error('Erreur météo:', error);
    return null;
  }
}

async function getWikipediaData(subject) {
  try {
    const searchUrl = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(subject)}`;
    const response = await fetch(searchUrl);

    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title,
        extract: data.extract,
        url: data.content_urls.desktop.page
      };
    }
    return null;
  } catch (error) {
    console.error('Erreur Wikipedia:', error);
    return null;
  }
}

async function getJokeData() {
  try {
    const response = await fetch('https://official-joke-api.appspot.com/random_joke');
    const data = await response.json();
    return data;
  } catch (error) {
    return { setup: "Pourquoi les plongeurs plongent-ils toujours en arrière?", punchline: "Parce que sinon ils tombent dans le bateau!" };
  }
}

// === ENDPOINT PRINCIPAL - CHAT AVEC CLAUDE ===

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message vide' });
    }

    // Récupérer l'historique de cette session
    let history = conversationHistory.get(sessionId) || [];

    // Construire le contexte avec des données réelles si nécessaire
    let contextData = "";
    const lowerMsg = message.toLowerCase();

    // Enrichir avec des données réelles pour certaines questions
    if (lowerMsg.includes('météo') || lowerMsg.includes('temps')) {
      const weatherMatch = message.match(/à\s+([a-zéèêàâ\s]+)/i);
      const city = weatherMatch ? weatherMatch[1].trim() : 'Paris';
      const weather = await getWeatherData(city);
      if (weather) {
        contextData += `\n[DONNÉES MÉTÉO RÉELLES pour ${weather.city}: ${weather.temperature}°C, vent ${weather.windSpeed}km/h]`;
      }
    }

    if (lowerMsg.includes('qui est') || lowerMsg.includes('qui a')) {
      const subject = message.replace(/^(qui est|qui a|c'est qui)/i, '').trim();
      const wiki = await getWikipediaData(subject);
      if (wiki) {
        contextData += `\n[DONNÉES WIKIPEDIA sur ${wiki.title}:\n${wiki.extract.substring(0, 500)}...\nSource: ${wiki.url}]`;
      }
    }

    if (lowerMsg.includes('blague') || lowerMsg.includes('rigolo')) {
      const joke = await getJokeData();
      contextData += `\n[BLAGUE: ${joke.setup} - ${joke.punchline}]`;
    }

    // Ajouter le message à l'historique
    history.push({
      role: 'user',
      content: message + contextData
    });

    // Appeler Claude
    const response = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 1024,
      system: `Tu es un assistant IA ultra-intelligent qui a réponse à TOUT.
- Réponds avec des FAITS RÉELS (utilise les données fournies)
- Sois concis, utile et amical
- Si tu as des données réelles, utilise-les en priorité
- Utilise des emojis pour rendre tes réponses plus agréables
- Sois toujours honnête et admets ce que tu ne sais pas`,
      messages: history.slice(-10) // Garder les 10 derniers messages
    });

    const botMessage = response.content[0].text;

    // Ajouter la réponse à l'historique
    history.push({
      role: 'assistant',
      content: botMessage
    });

    // Sauvegarder l'historique
    conversationHistory.set(sessionId, history);

    res.json({
      message: botMessage,
      sessionId
    });

  } catch (error) {
    console.error('Erreur API:', error);
    res.status(500).json({
      error: 'Erreur du serveur',
      details: error.message
    });
  }
});

// === ENDPOINT POUR RÉCUPÉRER LA MÉTÉO ===
app.post('/api/weather', async (req, res) => {
  try {
    const { city = 'Paris' } = req.body;
    const weather = await getWeatherData(city);

    if (weather) {
      res.json(weather);
    } else {
      res.status(404).json({ error: 'Ville non trouvée' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === ENDPOINT POUR RECHERCHER WIKIPEDIA ===
app.post('/api/search-wikipedia', async (req, res) => {
  try {
    const { query } = req.body;
    const result = await getWikipediaData(query);

    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ error: 'Pas trouvé sur Wikipedia' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Bot Omniscient démarré sur http://localhost:${PORT}`);
  console.log(`💬 Accédez au bot sur http://localhost:${PORT}`);
  console.log(`📝 Assurez-vous que ANTHROPIC_API_KEY est défini`);
});
