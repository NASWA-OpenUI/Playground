import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();

  return (
    <header>
      <div className="header-container">
        <div className="logo">
          <svg width="40" height="40" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <style>
              {`.primary { fill: #2c3e50; }
                .secondary { fill: #3498db; }`}
            </style>
            <circle cx="60" cy="60" r="50" fill="white" stroke="#3498db" strokeWidth="4"/>
            <text x="60" y="70" fontFamily="Arial, sans-serif" fontSize="40" fontWeight="bold" textAnchor="middle" className="primary">ES</text>
            <path d="M40 40 L30 25 M80 40 L90 25 M40 80 L30 95 M80 80 L90 95" stroke="#3498db" strokeWidth="3" fill="none"/>
            <circle cx="30" cy="25" r="6" className="secondary"/>
            <circle cx="90" cy="25" r="6" className="secondary"/>
            <circle cx="30" cy="95" r="6" className="secondary"/>
            <circle cx="90" cy="95" r="6" className="secondary"/>
          </svg>
          <h1>Employer Services Portal</h1>
        </div>
        <nav>
          <ul>
            <li>
              <Link 
                to="/" 
                className={location.pathname === '/' ? 'active' : ''}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <a href="/api/health" target="_blank" rel="noopener noreferrer">
                Service Health
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;