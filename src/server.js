const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database');
const metrics = require('./utils/metrics');
const { attachUser } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth')(db);
const problemsRoutes = require('./routes/problems')(db);
const submissionsRoutes = require('./routes/submissions')(db);
const bookmarksRoutes = require('./routes/bookmarks')(db);
const timelineRoutes = require('./routes/timeline')(db);
const healthRoutes = require('./routes/health')(db);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));


// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'coding-platform-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Attach user to request
app.use(attachUser(db));

// Metrics middleware for API response times (per endpoint)
app.use((req, res, next) => {
  const start = Date.now();
  const endpoint = req.path || req.originalUrl;
  res.on('finish', () => {
    try {
      const duration = Date.now() - start;
      metrics.recordApiMetrics(endpoint, duration, res.statusCode || 0);
    } catch (e) {
      // Ignore metrics errors to not crash server
    }
  });
  next();
});

// Metrics endpoint for JSON (used by dashboard)
app.get('/api/metrics', (req, res) => {
  res.json(metrics.getMetrics(db));
});

// Prometheus format endpoint
app.get('/api/prometheus', (req, res) => {
  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(metrics.getPrometheusMetrics(db));
});


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/health', healthRoutes);

// Prometheus /metrics endpoint (standard path for collected metrics)
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(metrics.getPrometheusMetrics(db));
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'signup.html'));
});

app.get('/problems', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'problems.html'));
});

app.get('/problem/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'problem.html'));
});

app.get('/progress', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'progress.html'));
});

app.get('/bookmarks', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'bookmarks.html'));
});

app.get('/timeline', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'timeline.html'));
});

app.get('/interview', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'interview.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});


// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Coding Practice Platform running at http://localhost:${PORT}`);
  console.log(`📚 Database: ${path.join(__dirname, '..', 'data', 'coding_platform.db')}`);
});

module.exports = app;
