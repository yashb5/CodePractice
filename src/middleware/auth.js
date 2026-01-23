// Authentication middleware
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return res.redirect('/login');
  }
  next();
}

function optionalAuth(req, res, next) {
  // Just pass through, user info will be available if logged in
  next();
}

function attachUser(db) {
  return (req, res, next) => {
    if (req.session && req.session.userId) {
      const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(req.session.userId);
      req.user = user || null;
    } else {
      req.user = null;
    }
    // Make user available to templates
    res.locals.user = req.user;
    next();
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  attachUser
};
