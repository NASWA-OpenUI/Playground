# employer-services/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os
from app.schema import schema

# Import GraphQL dependencies
from flask_graphql import GraphQLView

app = Flask(__name__)
CORS(app)

# Configuration
API_GATEWAY_URL = os.environ.get('API_GATEWAY_URL', 'http://localhost:3000')

# Simple in-memory data store
employers = {}
verifications = []

# Health check endpoint
@app.route('/')
def health_check():
    return jsonify({
        'service': 'Employer Services',
        'status': 'operational',
        'protocol': 'GraphQL'
    })

# REST endpoint for event callbacks
@app.route('/api/callbacks/claim-submitted', methods=['POST'])
def claim_submitted_callback():
    data = request.json
    
    print(f"[EVENT CALLBACK] Received claim.submitted event: {data}")
    
    # Add to pending verifications
    verification = {
        'claimId': data.get('claimId'),
        'claimantName': data.get('claimantName'),
        'lastEmployer': data.get('lastEmployer'),
        'status': 'Pending'
    }
    
    verifications.append(verification)
    
    return jsonify({'success': True})

# Register GraphQL view
app.add_url_rule(
    '/graphql',
    view_func=GraphQLView.as_view(
        'graphql',
        schema=schema,
        graphiql=True  # Enable GraphiQL for browsing
    )
)

# Function to publish events to the event bus
def publish_event(event_name, data):
    try:
        print(f"[EVENT BUS] Publishing event: {event_name}")
        response = requests.post(
            f"{API_GATEWAY_URL}/api/events/publish",
            json={
                'eventName': event_name,
                'data': data
            }
        )
        return response.json()
    except Exception as e:
        print(f"Error publishing event {event_name}: {e}")
        return {'success': False, 'error': str(e)}

# Function to subscribe to events from the event bus
def subscribe_to_events():
    try:
        # Subscribe to claim submitted events
        requests.post(
            f"{API_GATEWAY_URL}/api/events/subscribe",
            json={
                'eventName': 'claim.submitted',
                'callbackUrl': 'http://localhost:3003/api/callbacks/claim-submitted'
            }
        )
        
        print("Successfully subscribed to Event Bus")
        return {'success': True}
    except Exception as e:
        print(f"Error subscribing to events: {e}")
        return {'success': False, 'error': str(e)}

# Called when the application starts
@app.before_first_request
def before_first_request():
    # Subscribe to events from the event bus
    subscribe_to_events()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3003, debug=True)