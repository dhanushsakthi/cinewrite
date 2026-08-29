const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  createProject, listProjects, getProject, updateProject, deleteProject,
} = require('../controllers/projects.controller');

const router = express.Router();
router.use(requireAuth);

router.post('/', createProject);
router.get('/', listProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
