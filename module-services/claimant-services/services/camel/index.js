const axios = require('axios');

class CamelService {
    constructor() {
        this.gatewayUrl = process.env.CAMEL_GATEWAY_URL || 'http://camel-gateway:8080';
        this.timeout = parseInt(process.env.CAMEL_TIMEOUT) || 5000;
        this.retryCount = parseInt(process.env.CAMEL_RETRY_COUNT) || 3;
        this.serviceName = process.env.SERVICE_NAME || 'claimant-services';
        this.servicePort = process.env.PORT || 3000;
        this.isRegistered = false;
        
        console.log(`CamelService initialized with gateway: ${this.gatewayUrl}`);
    }

    /**
     * Register this service with the gateway on startup
     */
    async registerWithGateway() {
        const registrationData = {
            serviceId: this.serviceName,
            name: 'Claimant Services',
            technology: 'Node.js + GraphQL',
            protocol: 'GraphQL',
            endpoint: `http://${this.serviceName}:${this.servicePort}/graphql`,
            healthEndpoint: `http://${this.serviceName}:${this.servicePort}/health`
        };

        try {
            console.log('Registering with gateway...', registrationData);
            
            const response = await axios.post(
                `${this.gatewayUrl}/api/services/register`,
                registrationData,
                {
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200 || response.status === 201) {
                this.isRegistered = true;
                console.log('✅ Successfully registered with gateway');
                return { success: true };
            } else {
                console.log('⚠️ Unexpected response from gateway:', response.status);
                return { success: false, error: `Unexpected status: ${response.status}` };
            }
        } catch (error) {
            console.log('❌ Failed to register with gateway:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send heartbeat to gateway to maintain connection status
     */
    async sendHeartbeat() {
        try {
            const heartbeatData = {
                serviceId: this.serviceName,
                timestamp: new Date().toISOString(),
                status: 'UP'
            };

            const response = await axios.post(
                `${this.gatewayUrl}/api/services/heartbeat`,
                heartbeatData,
                {
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                console.log('💓 Heartbeat sent successfully');
                return { success: true };
            } else {
                console.log('⚠️ Heartbeat failed with status:', response.status);
                return { success: false, error: `Status: ${response.status}` };
            }
        } catch (error) {
            console.log('❌ Heartbeat failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send claim to gateway using natural claimant-services format
     * This replaces the old sendClaimWithRetry method
     */
    async sendClaimToGateway(claim) {
        for (let attempt = 1; attempt <= this.retryCount; attempt++) {
            try {
                console.log(`Sending claim ${claim.claimId} to gateway (attempt ${attempt}/${this.retryCount})`);
                
                // Send the claim in its natural format - let Camel handle the transformation
                const claimData = {
                    claimId: claim.claimId,
                    userId: claim.userId,
                    firstName: claim.firstName,
                    lastName: claim.lastName,
                    ssn: claim.ssn,
                    dateOfBirth: claim.dateOfBirth.toISOString().split('T')[0],
                    email: claim.email,
                    phone: claim.phone,
                    address: claim.address,
                    employer: claim.employer,
                    employmentDates: {
                        startDate: claim.employmentDates.startDate.toISOString().split('T')[0],
                        endDate: claim.employmentDates.endDate.toISOString().split('T')[0]
                    },
                    separationReason: claim.separationReason,
                    separationDetails: claim.separationDetails || '',
                    wageData: claim.wageData,
                    status: claim.status,
                    submissionTimestamp: claim.submissionTimestamp.toISOString()
                };

                const response = await axios.post(
                    `${this.gatewayUrl}/api/submit`,
                    claimData,
                    {
                        timeout: this.timeout,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Source-Service': this.serviceName,
                            'X-Claim-ID': claim.claimId
                        }
                    }
                );

                if (response.status === 200) {
                    console.log(`✅ Successfully sent claim ${claim.claimId} to gateway`);
                    return { 
                        success: true, 
                        response: response.data,
                        attempt: attempt 
                    };
                } else {
                    console.log(`⚠️ Unexpected response status: ${response.status}`);
                    if (attempt === this.retryCount) {
                        return { 
                            success: false, 
                            error: `Failed after ${this.retryCount} attempts. Last status: ${response.status}` 
                        };
                    }
                }
            } catch (error) {
                console.log(`❌ Attempt ${attempt} failed:`, error.message);
                
                if (attempt === this.retryCount) {
                    return { 
                        success: false, 
                        error: `Failed after ${this.retryCount} attempts. Last error: ${error.message}` 
                    };
                }
                
                // Wait before retrying (exponential backoff)
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    /**
     * Start the heartbeat interval
     */
    startHeartbeat() {
        // Send heartbeat every 30 seconds
        const heartbeatInterval = 30000;
        
        setInterval(async () => {
            if (this.isRegistered) {
                await this.sendHeartbeat();
            }
        }, heartbeatInterval);
        
        console.log(`💓 Heartbeat started (every ${heartbeatInterval}ms)`);
    }

    /**
     * Initialize connection with gateway
     */
    async initialize() {
        console.log('🚀 Initializing gateway connection...');
        
        // Register with gateway
        const registrationResult = await this.registerWithGateway();
        
        if (registrationResult.success) {
            // Start heartbeat
            this.startHeartbeat();
            
            // Send initial heartbeat
            setTimeout(() => {
                this.sendHeartbeat();
            }, 2000);
        } else {
            console.log('⚠️ Gateway registration failed, will retry in 30 seconds');
            // Retry registration after 30 seconds
            setTimeout(() => {
                this.initialize();
            }, 30000);
        }
    }
}

// Create singleton instance
const camelService = new CamelService();

module.exports = camelService;