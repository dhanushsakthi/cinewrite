const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  createCharacter, listCharacters, updateCharacter, deleteCharacter,
} = require('../controllers/characters.controller');

// mergeParams so :projectId from the parent router is available here
const router = express.Router({ mergeParams: true });
router.use(requireAuth);

router.post('/', createCharacter);
router.get('/', listCharacters);
router.put('/:id', updateCharacter);
router.delete('/:id', deleteCharacter);

module.exports = router;
