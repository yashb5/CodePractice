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
      const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(req.session.userId);
      req.user = user || null;
    } else {
      req.user = null;
    }
    // Make user available to templates
    res.locals.user = req.user;
    next();
  };
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    return res.status(403).send('Admin access required');
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  attachUser,
  requireAdmin
};
