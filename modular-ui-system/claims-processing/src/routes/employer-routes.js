// claims-processing/src/routes/employer-routes.js
const express = require('express');
const employerController = require('../controllers/employer-controller');

const router = express.Router();

// GET pending verifications
router.get('/pending-verifications', employerController.getPendingVerifications);

// POST employer verification
router.post('/verify/:claimId', employerController.verifyEmployment);

// POST verification callback (for event bus)
router.post('/verification-callback', employerController.handleVerificationCallback);

module.exports = router;