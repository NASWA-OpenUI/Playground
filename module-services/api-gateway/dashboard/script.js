/**
 * API Gateway Dashboard
 * 
 * This script handles the dashboard functionality for visualizing
 * the API Gateway operations, routes, and service status.
 */

// Dashboard configuration
const config = {
    refreshInterval: 5000, // Refresh interval in milliseconds
    apiGatewayEndpoint: '/api/gateway',
    traefikApiEndpoint: '/api/traefik'
};

// Dashboard state
let dashboardState = {
    routes: [],
    services: {
        claimantService: { status: 'online' },
        claimsProcessing: { status: 'online' },
        protocolConverter: { status: 'online' }
    },
    metrics: {
        totalConversions: 0,
        successRate: '100%',
        avgResponseTime: '45ms'
    },
    conversions: [
        // Sample data for initial display
        { time: formatTime(new Date()), operation: 'submitClaim', status: 'success' },
        { time: formatTime(new Date(new Date().getTime() - 60000)), operation: 'getClaimById', status: 'success' },
        { time: formatTime(new Date(new Date().getTime() - 120000)), operation: 'getClaimsByUser', status: 'success' }
    ]
};

// Sample route data for initial display
const sampleRoutes = [
    { route: '/graphql', service: 'Claimant Services', status: 'active' },
    { route: '/api/claims', service: 'Claims Processing', status: 'active' },
    { route: '/convert/graphql-to-rest', service: 'Protocol Converter', status: 'active' },
    { route: '/claimant', service: 'Claimant UI', status: 'active' },
    { route: '/processor', service: 'Claims UI', status: 'active' },
    { route: '/gateway-dashboard', service: 'Gateway Dashboard', status: 'active' }
];

// Initialize dashboard
function initDashboard() {
    // Initialize metrics
    updateMetrics();
    
    // Initialize routes
    updateRoutes(sampleRoutes);
    
    // Initialize conversions
    updateConversions();
    
    // Initialize service status
    updateServiceStatus();
    
    // Set up refresh interval
    setInterval(refreshDashboard, config.refreshInterval);
}

// Refresh dashboard data
async function refreshDashboard() {
    try {
        // In a real implementation, we would fetch the actual data from the API
        // For this demo, we'll just simulate changing data
        
        // Simulate route changes
        updateRoutes(sampleRoutes);
        
        // Simulate new conversion
        const operations = ['submitClaim', 'getClaimById', 'getClaimsByUser', 'updateClaimStatus'];
        const statuses = ['success', 'success', 'success', 'error'];
        
        const randomOperation = operations[Math.floor(Math.random() * operations.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        dashboardState.conversions.unshift({
            time: formatTime(new Date()),
            operation: randomOperation,
            status: randomStatus
        });
        
        // Keep only the most recent 10 conversions
        if (dashboardState.conversions.length > 10) {
            dashboardState.conversions.pop();
        }
        
        // Update conversions table
        updateConversions();
        
        // Update metrics
        dashboardState.metrics.totalConversions += 1;
        const successCount = dashboardState.conversions.filter(c => c.status === 'success').length;
        dashboardState.metrics.successRate = `${Math.round((successCount / dashboardState.conversions.length) * 100)}%`;
        dashboardState.metrics.avgResponseTime = `${Math.floor(Math.random() * 50 + 30)}ms`;
        
        updateMetrics();
        
        // Randomly change service status occasionally
        if (Math.random() < 0.05) {
            const services = ['claimantService', 'claimsProcessing', 'protocolConverter'];
            const randomService = services[Math.floor(Math.random() * services.length)];
            const currentStatus = dashboardState.services[randomService].status;
            
            dashboardState.services[randomService].status = currentStatus === 'online' ? 'warning' : 'online';
            
            updateServiceStatus();
        }
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
    }
}

// Update routes table
function updateRoutes(routes) {
    const routesBody = document.getElementById('routes-body');
    routesBody.innerHTML = '';
    
    routes.forEach(route => {
        const row = document.createElement('tr');
        
        const routeCell = document.createElement('td');
        routeCell.textContent = route.route;
        
        const serviceCell = document.createElement('td');
        serviceCell.textContent = route.service;
        
        const statusCell = document.createElement('td');
        statusCell.textContent = route.status;
        statusCell.className = `status-cell ${route.status === 'active' ? 'success' : 'error'}`;
        
        row.appendChild(routeCell);
        row.appendChild(serviceCell);
        row.appendChild(statusCell);
        
        routesBody.appendChild(row);
    });
}

// Update conversions table
function updateConversions() {
    const conversionsBody = document.getElementById('conversion-body');
    conversionsBody.innerHTML = '';
    
    dashboardState.conversions.forEach(conversion => {
        const row = document.createElement('tr');
        
        const timeCell = document.createElement('td');
        timeCell.textContent = conversion.time;
        
        const operationCell = document.createElement('td');
        operationCell.textContent = conversion.operation;
        
        const statusCell = document.createElement('td');
        statusCell.textContent = conversion.status;
        statusCell.className = `status-cell ${conversion.status === 'success' ? 'success' : 'error'}`;
        
        row.appendChild(timeCell);
        row.appendChild(operationCell);
        row.appendChild(statusCell);
        
        conversionsBody.appendChild(row);
    });
}

// Update metrics display
function updateMetrics() {
    document.getElementById('total-conversions').textContent = dashboardState.metrics.totalConversions;
    document.getElementById('success-rate').textContent = dashboardState.metrics.successRate;
    document.getElementById('avg-time').textContent = dashboardState.metrics.avgResponseTime;
}

// Update service status display
function updateServiceStatus() {
    // Update Claimant Service status
    updateServiceElement('claimant-service', dashboardState.services.claimantService.status);
    
    // Update Claims Processing status
    updateServiceElement('claims-processing', dashboardState.services.claimsProcessing.status);
    
    // Update Protocol Converter status
    updateServiceElement('protocol-converter', dashboardState.services.protocolConverter.status);
}

// Update a single service element
function updateServiceElement(elementId, status) {
    const element = document.getElementById(elementId);
    const statusElement = element.querySelector('.service-status');
    
    statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    statusElement.className = 'service-status';
    
    if (status !== 'online') {
        statusElement.classList.add(status);
    }
}

// Format time for display
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Initialize dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);