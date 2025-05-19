/**
 * UI Demo JavaScript with Dynamic URL Management
 */

// Dynamic URL builder for different environments
function buildServiceUrl(port, path = '') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Check if we're in GitHub Codespaces
    if (hostname.includes('.app.github.dev')) {
        // Extract the base codespace name (everything before the port number)
        const baseUrl = hostname.replace(/-80\.app\.github\.dev$/, '');
        return `${protocol}//${baseUrl}-${port}.app.github.dev${path}`;
    }
    
    // Local development
    return `${protocol}//${hostname.split(':')[0]}:${port}${path}`;
}

document.addEventListener('DOMContentLoaded', function() {
    // === EXISTING FUNCTIONALITY ===
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Header scroll effect
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        }
    });
    
    // Add active class to current section in nav
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY + 150;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                const activeLink = document.querySelector(`nav a[href="#${sectionId}"]`);
                if (activeLink) activeLink.classList.add('active');
            } else {
                const inactiveLink = document.querySelector(`nav a[href="#${sectionId}"]`);
                if (inactiveLink) inactiveLink.classList.remove('active');
            }
        });
    });
    
    // === NEW DYNAMIC URL FUNCTIONALITY ===
    
    // Update service button URLs dynamically
    const buttons = {
        'api-gateway-btn': { port: 8080, path: '/camel/integration/api/v1/monitoring' },
        'claimant-btn': { port: 3001, path: '/' },
        'processor-btn': { port: 3002, path: '/' }
    };
    
    // Update all buttons
    Object.entries(buttons).forEach(([id, config]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.href = buildServiceUrl(config.port, config.path);
            btn.target = '_blank';
            
            // Add click tracking for demo purposes
            btn.addEventListener('click', function() {
                console.log(`Navigating to ${config.port === 8080 ? 'API Gateway' : config.port === 3001 ? 'Claimant Portal' : 'Claims Processor'}`);
            });
        }
    });
    
    // Update demo section links that reference services
    const demoLinks = document.querySelectorAll('.step a');
    demoLinks.forEach(link => {
        const text = link.textContent.toLowerCase();
        if (text.includes('claimant portal')) {
            link.href = buildServiceUrl(3001, '/');
            link.target = '_blank';
        } else if (text.includes('api gateway') || text.includes('gateway dashboard')) {
            link.href = buildServiceUrl(8080, '/camel/integration/api/v1/monitoring');
            link.target = '_blank';
        } else if (text.includes('claims processor')) {
            link.href = buildServiceUrl(3002, '/');
            link.target = '_blank';
        }
    });
    
    console.log('UI Demo loaded - URLs dynamically configured for environment:', window.location.hostname);
});
