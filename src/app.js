const path = require('path');
const express = require('express');
const cors = require('cors');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const projectsRoutes = require('./routes/projects.routes');
const charactersRoutes = require('./routes/characters.routes');
const structureRoutes = require('./routes/structure.routes');
const frameworksRoutes = require('./routes/frameworks.routes');
const scenesRoutes = require('./routes/scenes.routes');
const aiRoutes = require('./routes/ai.routes');
const analysisRoutes = require('./routes/analysis.routes');
const setupsRoutes = require('./routes/setups.routes');
const versionsRoutes = require('./routes/versions.routes');
const relationshipsRoutes = require('./routes/relationships.routes');
const searchRoutes = require('./routes/search.routes');
const researchRoutes = require('./routes/research.routes');
const adminRoutes = require('./routes/admin.routes');
const customStructureRoutes = require('./routes/customStructure.routes');
const { genericRouter: learningRoutes, projectRouter: projectLearningRoutes } = require('./routes/learning.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, '..', 'public'), {
  etag: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
}));

app.use('/auth', authRoutes);
app.use('/frameworks', frameworksRoutes);
app.use('/projects', projectsRoutes);
app.use('/admin', adminRoutes);
app.use('/custom-structures', customStructureRoutes);
app.use('/learn', learningRoutes);

// Nested, project-scoped resources
app.use('/projects/:projectId/characters', charactersRoutes);
app.use('/projects/:projectId/scenes', scenesRoutes);
app.use('/projects/:projectId/ai', aiRoutes);
app.use('/projects/:projectId/analysis', analysisRoutes);
app.use('/projects/:projectId/setups', setupsRoutes);
app.use('/projects/:projectId/versions', versionsRoutes);
app.use('/projects/:projectId/relationships', relationshipsRoutes);
app.use('/projects/:projectId/search', searchRoutes);
app.use('/projects/:projectId/research', researchRoutes);
app.use('/projects/:projectId/learn', projectLearningRoutes);
app.use('/projects/:projectId', structureRoutes); // /structure, /structure/generate, /pacing

app.use(notFound);
app.use(errorHandler);

module.exports = app;
