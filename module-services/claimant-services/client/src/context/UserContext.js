import React from 'react';
import { createContext } from 'react';

// Create User Context
const UserContext = createContext({
  user: null,
  setUser: () => {},
});

export default UserContext;