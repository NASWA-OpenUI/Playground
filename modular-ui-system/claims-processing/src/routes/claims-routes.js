// claims-processing/src/routes/claims-routes.js
const express = require('express');
const claimsController = require('../controllers/claims-controller');

const router = express.Router();

// GET all claims
router.get('/', claimsController.getAllClaims);

// GET claim by ID
router.get('/:claimId', claimsController.getClaimById);

// POST new claim
router.post('/', claimsController.createClaim);

// PUT update claim
router.put('/:claimId', claimsController.updateClaim);

// POST submit weekly certification
router.post('/:claimId/certify', claimsController.submitCertification);

// GET claim status
router.get('/:claimId/status', claimsController.getClaimStatus);

module.exports = router;