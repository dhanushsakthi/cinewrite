const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { runAnalysis, getAnalysis } = require('../controllers/analysis.controller');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.post('/run', runAnalysis);
router.get('/', getAnalysis);

module.exports = router;
