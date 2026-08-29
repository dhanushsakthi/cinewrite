const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { askAI } = require('../controllers/ai.controller');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

router.post('/ask', askAI);

module.exports = router;
