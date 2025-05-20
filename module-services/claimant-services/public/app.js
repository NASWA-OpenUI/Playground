// GraphQL endpoint
const GRAPHQL_ENDPOINT = '/graphql';

// Global variables
let currentClaim = null;

// DOM Elements
const claimForm = document.getElementById('claimForm');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const notificationClose = document.getElementById('notification-close');
const submitText = document.getElementById('submit-text');
const submitLoading = document.getElementById('submit-loading');
const statusContainer = document.querySelector('.status-container');
const claimDetails = document.getElementById('claim-details');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupFormValidation();
    
    // Check if there's a claim ID in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const claimId = urlParams.get('claimId');
    if (claimId) {
        fetchClaimStatus(claimId);
    }
});

// Event Listeners
function setupEventListeners() {
    claimForm.addEventListener('submit', handleClaimSubmission);
    notificationClose.addEventListener('click', hideNotification);
    
    // Format SSN input
    const ssnInput = document.getElementById('ssn');
    ssnInput.addEventListener('input', formatSSN);
    
    // Format EIN input
    const einInput = document.getElementById('employerEin');
    einInput.addEventListener('input', formatEIN);
    
    // Navigation smooth scrolling
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Form validation setup
function setupFormValidation() {
    // Add real-time validation feedback
    const inputs = claimForm.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

// Validate individual field
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // Remove any existing error styling
    field.classList.remove('error');
    
    // Check if required field is empty
    if (field.hasAttribute('required') && !value) {
        field.classList.add('error');
        return false;
    }
    
    // Specific validations
    switch (field.id) {
        case 'ssn':
            if (!/^\d{3}-\d{2}-\d{4}$/.test(value)) {
                field.classList.add('error');
                return false;
            }
            break;
        case 'email':
            if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value)) {
                field.classList.add('error');
                return false;
            }
            break;
        case 'employerEin':
            if (!/^\d{2}-\d{7}$/.test(value)) {
                field.classList.add('error');
                return false;
            }
            break;
    }
    
    return true;
}

// Clear field error styling
function clearFieldError(event) {
    event.target.classList.remove('error');
}

// Format SSN input
function formatSSN(event) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 3) {
        value = value.substring(0, 3) + '-' + value.substring(3);
    }
    if (value.length >= 6) {
        value = value.substring(0, 6) + '-' + value.substring(6, 10);
    }
    event.target.value = value;
}

// Format EIN input
function formatEIN(event) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '-' + value.substring(2, 9);
    }
    event.target.value = value;
}

// Handle claim submission
async function handleClaimSubmission(event) {
    event.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        showNotification('Please correct the errors in the form.', 'error');
        return;
    }
    
    // Disable submit button and show loading
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitLoading.style.display = 'inline';
    
    try {
        // Collect form data
        const formData = collectFormData();
        
        // Submit claim via GraphQL
        const result = await submitClaim(formData);
        
        if (result.success) {
            currentClaim = result.claim;
            showNotification('Claim submitted successfully!', 'success');
            
            // Show claim status
            displayClaimStatus(result.claim);
            
            // Scroll to status section
            document.getElementById('claim-status').scrollIntoView({
                behavior: 'smooth'
            });
            
            // Reset form
            claimForm.reset();
        } else {
            showNotification(`Error submitting claim: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Submission error:', error);
        showNotification('An unexpected error occurred. Please try again.', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitText.style.display = 'inline';
        submitLoading.style.display = 'none';
    }
}

// Validate entire form
function validateForm() {
    const inputs = claimForm.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField({ target: input })) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Collect form data
function collectFormData() {
    const formData = new FormData(claimForm);
    const data = {};
    
    // Basic fields
    data.firstName = formData.get('firstName');
    data.lastName = formData.get('lastName');
    data.ssn = formData.get('ssn');
    data.dateOfBirth = formData.get('dateOfBirth');
    data.email = formData.get('email');
    data.phone = formData.get('phone');
    
    // Address
    data.address = {
        street: formData.get('address.street'),
        city: formData.get('address.city'),
        state: formData.get('address.state'),
        zipCode: formData.get('address.zipCode')
    };
    
    // Employer
    data.employer = {
        name: formData.get('employer.name'),
        ein: formData.get('employer.ein'),
    };
    
    // Employment dates
    data.employmentDates = {
        startDate: formData.get('employmentDates.startDate'),
        endDate: formData.get('employmentDates.endDate')
    };
    
    // Separation info
    data.separationReason = formData.get('separationReason');
    data.separationDetails = formData.get('separationDetails') || '';
    
    // Wage data
    data.wageData = {
        lastQuarterEarnings: parseFloat(formData.get('wageData.lastQuarterEarnings')),
        annualEarnings: parseFloat(formData.get('wageData.annualEarnings'))
    };
    
    return data;
}

// Submit claim via GraphQL
async function submitClaim(claimData) {
    const mutation = `
        mutation CreateClaim($input: ClaimInput!) {
            createClaim(input: $input) {
                id
                claimId
                firstName
                lastName
                status
                statusDisplayName
                submissionTimestamp
                weeklyBenefitAmount
                maximumBenefitAmount
            }
        }
    `;
    
    try {
        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: mutation,
                variables: { input: claimData }
            })
        });
        
        const result = await response.json();
        
        if (result.errors) {
            return {
                success: false,
                error: result.errors[0].message
            };
        }
        
        return {
            success: true,
            claim: result.data.createClaim
        };
    } catch (error) {
        console.error('GraphQL error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Fetch claim status
async function fetchClaimStatus(claimId) {
    const query = `
        query GetClaim($claimId: String!) {
            getClaim(claimId: $claimId) {
                id
                claimId
                firstName
                lastName
                status
                statusDisplayName
                submissionTimestamp
                lastUpdated
                weeklyBenefitAmount
                maximumBenefitAmount
                statusHistory {
                    status
                    timestamp
                    notes
                }
            }
        }
    `;
    
    try {
        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: { claimId }
            })
        });
        
        const result = await response.json();
        
        if (result.errors) {
            showNotification(`Error fetching claim: ${result.errors[0].message}`, 'error');
            return;
        }
        
        if (result.data.getClaim) {
            currentClaim = result.data.getClaim;
            displayClaimStatus(result.data.getClaim);
        } else {
            showNotification('Claim not found.', 'error');
        }
    } catch (error) {
        console.error('Error fetching claim:', error);
        showNotification('Error fetching claim status.', 'error');
    }
}

// Display claim status
function displayClaimStatus(claim) {
    statusContainer.style.display = 'block';
    
    const statusBadgeClass = claim.status.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();
    
    claimDetails.innerHTML = `
        <div class="claim-summary">
            <div class="claim-info">
                <h4>Claim Information</h4>
                <p><strong>Claim ID:</strong> ${claim.claimId}</p>
                <p><strong>Applicant:</strong> ${claim.firstName} ${claim.lastName}</p>
                <p><strong>Status:</strong> <span class="status-badge ${statusBadgeClass}">${claim.statusDisplayName}</span></p>
                <p><strong>Submitted:</strong> ${formatDate(claim.submissionTimestamp)}</p>
                <p><strong>Last Updated:</strong> ${formatDate(claim.lastUpdated)}</p>
            </div>
            
            ${claim.weeklyBenefitAmount ? `
                <div class="claim-info">
                    <h4>Benefit Information</h4>
                    <p><strong>Weekly Benefit:</strong> $${claim.weeklyBenefitAmount.toFixed(2)}</p>
                    <p><strong>Maximum Benefit:</strong> $${claim.maximumBenefitAmount.toFixed(2)}</p>
                </div>
            ` : ''}
        </div>
        
        <div class="status-timeline">
            <h4>Status History</h4>
            ${(claim.statusHistory || []).map(entry => `
                <div class="timeline-item">
                    <div class="timeline-date">${formatDate(entry.timestamp)}</div>
                    <div class="timeline-content">
                        <div class="timeline-status">${entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}</div>
                        ${entry.notes ? `<div class="timeline-notes">${entry.notes}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show notification
function showNotification(message, type = 'info') {
    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    // Auto-hide success notifications after 5 seconds
    if (type === 'success') {
        setTimeout(hideNotification, 5000);
    }
}

// Hide notification
function hideNotification() {
    notification.style.display = 'none';
}
