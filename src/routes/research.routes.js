const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { runResearch, listResearch } = require('../controllers/research.controller');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.post('/', runResearch);
router.get('/', listResearch);

module.exports = router;
