#!/usr/bin/env python3
"""
Serveur proxy Python pour Claude chatbot
Relaie les requêtes vers l'API Anthropic pour éviter les problèmes CORS
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__)
CORS(app)  # Active CORS pour toutes les requêtes

# URL de l'API Anthropic
ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
ANTHROPIC_API_VERSION = '2023-06-01'
MODEL = 'claude-opus-4-1-20250805'

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Endpoint proxy pour les messages de chat
    Reçoit: { message, apiKey, conversationHistory }
    Envoie: { message }
    """
    try:
        data = request.json
        message = data.get('message')
        api_key = data.get('apiKey')
        conversation_history = data.get('conversationHistory', [])

        # Validation
        if not message or not api_key:
            return jsonify({'error': 'Message ou clé API manquante'}), 400

        # Préparer les en-têtes pour Anthropic
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': api_key,
            'anthropic-version': ANTHROPIC_API_VERSION
        }

        # Préparer le payload
        payload = {
            'model': MODEL,
            'max_tokens': 1024,
            'messages': conversation_history[-10:]  # Garder les 10 derniers messages
        }

        # Faire la requête à Anthropic
        response = requests.post(ANTHROPIC_API_URL, headers=headers, json=payload)

        # Vérifier la réponse
        if not response.ok:
            error_data = response.json() if response.headers.get('content-type') == 'application/json' else {}
            error_msg = error_data.get('error', {}).get('message', response.text)
            return jsonify({
                'error': f'Erreur API Anthropic: {error_msg}',
                'status': response.status_code
            }), response.status_code

        # Extraire le message de la réponse
        response_data = response.json()
        bot_message = response_data['content'][0]['text']

        return jsonify({'message': bot_message})

    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Impossible de se connecter à l\'API Anthropic'}), 503
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Délai d\'attente dépassé avec l\'API Anthropic'}), 504
    except Exception as e:
        print(f'Erreur serveur: {str(e)}')
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Endpoint de vérification du statut"""
    return jsonify({'status': 'ok', 'service': 'Claude Chat Proxy'})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f'🚀 Serveur proxy démarré sur http://localhost:{port}')
    print(f'📝 Chatbot disponible sur http://localhost:3000/chatbot.html')
    app.run(debug=False, host='localhost', port=port)
