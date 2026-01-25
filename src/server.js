const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database');
const { attachUser } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth')(db);
const problemsRoutes = require('./routes/problems')(db);
const submissionsRoutes = require('./routes/submissions')(db);
const bookmarksRoutes = require('./routes/bookmarks')(db);
const timelineRoutes = require('./routes/timeline')(db);

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/timeline', timelineRoutes);

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
