// Modules/claimant-services/src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <div className="logo">UI Claimant Portal</div>
      <nav>
        <ul>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/new-claim">File New Claim</Link></li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
