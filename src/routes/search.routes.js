const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { search } = require('../controllers/search.controller');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.get('/', search);

module.exports = router;
