const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

module.exports = function(db) {
  // Sign up
  router.post('/signup', async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ error: 'Username must be 3-20 characters' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Check if user exists
      const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
      if (existingUser) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      // Hash password and create user
      const passwordHash = await bcrypt.hash(password, 10);
      const result = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, passwordHash);

      // Auto login after signup
      req.session.userId = result.lastInsertRowid;

      res.json({ 
        success: true, 
        user: { id: result.lastInsertRowid, username, email } 
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Login
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      req.session.userId = user.id;

      res.json({ 
        success: true, 
        user: { id: user.id, username: user.username, email: user.email } 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Logout
  router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.json({ success: true });
    });
  });

  // Get current user
  router.get('/me', (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.json({ user: null });
    }

    const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(req.session.userId);
    res.json({ user: user || null });
  });

  return router;
};
