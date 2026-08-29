const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createSetup, listSetups, updateSetup, deleteSetup } = require('../controllers/setups.controller');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.post('/', createSetup);
router.get('/', listSetups);
router.put('/:id', updateSetup);
router.delete('/:id', deleteSetup);

module.exports = router;
