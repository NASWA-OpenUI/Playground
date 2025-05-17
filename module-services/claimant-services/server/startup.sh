#!/bin/sh

# Wait for MongoDB to be ready before starting the server
echo "Waiting for MongoDB to be ready..."
sleep 5

# Seed the database with sample data if this is the first run
echo "Seeding the database with sample data..."
node src/data/seed.js

# Start the server
echo "Starting the server..."
exec node server.js