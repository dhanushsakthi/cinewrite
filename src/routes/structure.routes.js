const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  generateStructure, getStructure, getPacing, getStructureLayers,
} = require('../controllers/structure.controller');

// Mounted at /projects/:projectId — mergeParams makes :projectId available.
const router = express.Router({ mergeParams: true });
router.use(requireAuth);

router.post('/structure/generate', generateStructure);
router.get('/structure', getStructure);
router.get('/structure/layers', getStructureLayers);
router.get('/pacing', getPacing);

module.exports = router;
