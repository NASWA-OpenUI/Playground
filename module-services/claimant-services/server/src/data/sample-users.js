/**
 * Sample Data for creating test users
 */

// Demo users for testing
const users = [
  {
    userId: 'USER123',
    fullName: 'John Smith',
    ssn: '123-45-6789',
    contactInfo: {
      email: 'john.smith@example.com',
      phone: '555-123-4567',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345'
      }
    }
  },
  {
    userId: 'USER456',
    fullName: 'Jane Doe',
    ssn: '987-65-4321',
    contactInfo: {
      email: 'jane.doe@example.com',
      phone: '555-987-6543',
      address: {
        street: '456 Oak Ave',
        city: 'Somewhere',
        state: 'NY',
        zip: '67890'
      }
    }
  }
];

module.exports = users;