const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  createCustomStructure, listCustomStructures, deleteCustomStructure,
} = require('../controllers/customStructure.controller');

// Not project-scoped — a user's custom structures are reusable across projects.
const router = express.Router();
router.use(requireAuth);
router.post('/', createCustomStructure);
router.get('/', listCustomStructures);
router.delete('/:id', deleteCustomStructure);

module.exports = router;
