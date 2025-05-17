/**
 * Script to seed the MongoDB database with sample data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const sampleUsers = require('./sample-users');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/claimant';

async function seedDatabase() {
  try {
    // Connect to the database
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await User.deleteMany({});
    console.log('Cleared existing users');
    
    // Insert sample users
    const result = await User.insertMany(sampleUsers);
    console.log(`Added ${result.length} sample users`);
    
    console.log('Database seeding complete');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding function
seedDatabase();