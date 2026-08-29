const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  createScene, listScenes, updateScene, deleteScene,
} = require('../controllers/scenes.controller');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

router.post('/', createScene);
router.get('/', listScenes);
router.put('/:id', updateScene);
router.delete('/:id', deleteScene);

module.exports = router;
