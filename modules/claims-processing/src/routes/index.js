// Modules/claims-processing/src/routes/index.js
const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');

// Routes for claim management
router.post('/', claimController.createClaim);
router.get('/', claimController.getAllClaims);
router.get('/:claimId', claimController.getClaimById);
router.get('/:claimId/status', claimController.getClaimStatus);
router.patch('/:claimId/status', claimController.updateClaimStatus);

// Routes for employer verification
router.post('/:claimId/employer-verification', claimController.requestEmployerVerification);
router.patch('/:claimId/employer-verification', claimController.processEmployerVerification);

// Routes for benefit calculation
router.post('/:claimId/calculate-benefits', claimController.calculateBenefits);

module.exports = router;
