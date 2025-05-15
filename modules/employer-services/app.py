from flask import Flask
from flask_cors import CORS
from flask_graphql import GraphQLView
from schema import schema
import os

app = Flask(__name__)
CORS(app)

# Add GraphQL endpoint
app.add_url_rule(
    '/graphql',
    view_func=GraphQLView.as_view(
        'graphql',
        schema=schema,
        graphiql=True  # Enable GraphiQL interface for testing
    )
)

# Keep health check endpoint
@app.route('/health')
def health_check():
    return {"status": "Employer Services GraphQL is running"}

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3003))
    app.run(host='0.0.0.0', port=port, debug=True)
