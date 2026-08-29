const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createVersion, listVersions, compareVersions } = require('../controllers/versions.controller');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.post('/', createVersion);
router.get('/', listVersions);
router.get('/compare', compareVersions);

module.exports = router;
