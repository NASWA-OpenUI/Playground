<template>
  <div id="app">
    <header>
      <div class="header-container">
        <div class="logo">
          <h1>Claims Processor</h1>
        </div>
        <nav>
          <router-link to="/">Dashboard</router-link>
          <router-link to="/queue">Claims Queue</router-link>
        </nav>
      </div>
    </header>
    
    <main>
      <router-view />
    </main>
    
    <footer>
      <div class="footer-container">
        <p>&copy; 2025 Unemployment Insurance System. Claims Processing Portal.</p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
:root {
  --primary-color: #2c3e50;
  --secondary-color: #3498db;
  --accent-color: #e74c3c;
  --success-color: #2ecc71;
  --warning-color: #f39c12;
  --light-color: #ecf0f1;
  --dark-color: #2c3e50;
  --text-color: #333;
  --background-color: #f8f9fa;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Roboto', sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

a {
  text-decoration: none;
  color: var(--secondary-color);
}

header {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 0;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.logo h1 {
  font-size: 1.5rem;
  font-weight: 700;
}

nav {
  display: flex;
  gap: 1.5rem;
}

nav a {
  color: white;
  font-weight: 500;
  padding: 0.5rem 0;
  position: relative;
}

nav a:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background-color: white;
  transition: width 0.3s;
}

nav a:hover:after,
nav a.router-link-active:after {
  width: 100%;
}

main {
  flex: 1;
  padding: 2rem 0;
}

footer {
  background-color: var(--light-color);
  padding: 1.5rem 0;
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  text-align: center;
  color: var(--primary-color);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.btn {
  display: inline-block;
  background-color: var(--secondary-color);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background-color 0.3s;
}

.btn:hover {
  background-color: #2980b9;
}

.btn-success {
  background-color: var(--success-color);
}

.btn-success:hover {
  background-color: #27ae60;
}

.btn-warning {
  background-color: var(--warning-color);
}

.btn-warning:hover {
  background-color: #f39c12;
}

.btn-danger {
  background-color: var(--accent-color);
}

.btn-danger:hover {
  background-color: #c0392b;
}

@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  nav {
    margin-top: 1rem;
  }
}
</style>