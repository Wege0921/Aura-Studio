let app;
try {
  app = require('../backend/dist/app').default;
} catch (err) {
  console.error('Failed to load app:', err);
  module.exports = (req, res) => {
    res.status(500).json({ error: 'App initialization failed', message: err.message });
  };
  return;
}

module.exports = (req, res) => app(req, res);
