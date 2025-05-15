// modules/claims-processing/grpcClient.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load the proto file
const PROTO_PATH = path.join(__dirname, 'protos', 'payment.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const paymentProto = grpc.loadPackageDefinition(packageDefinition).payment;

// Create gRPC client
const client = new paymentProto.PaymentService(
  'benefits-admin:3004',
  grpc.credentials.createInsecure()
);

module.exports = {
  authorizePayment: (request) => {
    return new Promise((resolve, reject) => {
      client.authorizePayment(request, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });
  }
};
