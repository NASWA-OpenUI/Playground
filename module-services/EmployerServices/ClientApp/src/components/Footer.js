import React from 'react';

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <p>&copy; 2025 UI Modernization Demo - Employer Services</p>
          <div className="footer-links">
            <a href="/">Dashboard</a>
            <a href="/api/health">Service Health</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;