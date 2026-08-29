const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { learnStage, applyToProject } = require('../controllers/learning.controller');

// GET /learn/:frameworkKey/:stageName is generic (not project-scoped) since
// learning content is the same regardless of which project you're viewing it
// from. The "apply to my story" variant lives under /projects/:projectId
// because it needs project context.
const genericRouter = express.Router();
genericRouter.get('/:frameworkKey/:stageName', learnStage);

const projectRouter = express.Router({ mergeParams: true });
projectRouter.use(requireAuth);
projectRouter.post('/:frameworkKey/:stageName/apply', applyToProject);

module.exports = { genericRouter, projectRouter };
