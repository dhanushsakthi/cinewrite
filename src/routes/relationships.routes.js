const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createRelationship, getRelationshipGraph, deleteRelationship } = require('../controllers/relationships.controller');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.post('/', createRelationship);
router.get('/', getRelationshipGraph);
router.delete('/:id', deleteRelationship);

module.exports = router;
