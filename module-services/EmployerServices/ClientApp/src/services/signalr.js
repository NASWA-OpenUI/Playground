import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.callbacks = {};
  }

  async start() {
    try {
      this.connection = new HubConnectionBuilder()
        .withUrl('/claimhub')
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      await this.connection.start();
      console.log('SignalR Connected');

      // Set up event handlers
      this.connection.on('ClaimVerified', (claimId) => {
        this.trigger('claimVerified', claimId);
      });

      this.connection.on('ClaimStatusChanged', (data) => {
        this.trigger('claimStatusChanged', data);
      });

    } catch (error) {
      console.error('SignalR Connection Error:', error);
    }
  }

  async stop() {
    if (this.connection) {
      await this.connection.stop();
    }
  }

  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  trigger(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }
}

export default new SignalRService();