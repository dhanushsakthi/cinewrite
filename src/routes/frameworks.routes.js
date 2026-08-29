const express = require('express');
const { getAvailableFrameworks } = require('../controllers/structure.controller');

// Not project-scoped — spec section 43: GET /frameworks, POST /frameworks (custom, Phase 4+)
const router = express.Router();
router.get('/', getAvailableFrameworks);

module.exports = router;
