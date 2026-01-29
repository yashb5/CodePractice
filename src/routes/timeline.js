const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

module.exports = function(db) {
  // Get timeline events for the current user
  router.get('/', requireAuth, (req, res) => {
    try {
      const userId = req.session.userId;
      const { date_from, date_to, problem_status, tags, event_type, limit = 50, offset = 0 } = req.query;

      let query = `
        SELECT te.*,
          p.title as problem_title,
          p.slug as problem_slug,
          p.difficulty,
          p.topics,
          bl.name as bookmark_list_name,
          bl.color as bookmark_list_color,
          bl.icon as bookmark_list_icon
        FROM timeline_events te
        LEFT JOIN problems p ON te.problem_id = p.id
        LEFT JOIN bookmarks b ON te.bookmark_id = b.id
        LEFT JOIN bookmark_lists bl ON b.list_id = bl.id
        WHERE te.user_id = ?
      `;

      const params = [userId];

      // Date filters
      if (date_from) {
        query += ' AND te.created_at >= ?';
        params.push(date_from);
      }
      if (date_to) {
        query += ' AND te.created_at <= ?';
        params.push(date_to);
      }

      // Event type filter
      if (event_type) {
        const types = event_type.split(',').filter(t => ['started', 'completed', 'bookmark_added', 'bookmark_removed'].includes(t));
        if (types.length > 0) {
          query += ` AND te.event_type IN (${types.map(() => '?').join(',')})`;
          params.push(...types);
        }
      }

      query += ' ORDER BY te.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      let events = db.prepare(query).all(...params);

      // Parse topics JSON
      events.forEach(e => {
        if (e.topics) {
          e.topics = JSON.parse(e.topics);
        }
      });

      // Filter by tags (topics)
      if (tags) {
        const tagList = tags.split(',').map(t => t.trim().toLowerCase());
        events = events.filter(e =>
          e.topics && e.topics.some(t => tagList.includes(t.toLowerCase()))
        );
      }

      // Filter by problem status
      if (problem_status) {
        const statusList = problem_status.split(',').map(s => s.trim().toLowerCase());
        events = events.filter(e => {
          if (!e.problem_id) return false; // Skip non-problem events if filtering by status

          // Check if problem is solved (has 'completed' event)
          const hasCompleted = db.prepare(`
            SELECT COUNT(*) as count FROM timeline_events
            WHERE user_id = ? AND problem_id = ? AND event_type = 'completed'
          `).get(userId, e.problem_id).count > 0;

          // Check if attempted (has submissions)
          const hasSubmissions = db.prepare(`
            SELECT COUNT(*) as count FROM submissions
            WHERE user_id = ? AND problem_id = ?
          `).get(userId, e.problem_id).count > 0;

          // Check if bookmarked
          const isBookmarked = db.prepare(`
            SELECT COUNT(*) as count FROM bookmarks
            WHERE user_id = ? AND problem_id = ?
          `).get(userId, e.problem_id).count > 0;

          if (statusList.includes('solved') && hasCompleted) return true;
          if (statusList.includes('attempted') && hasSubmissions && !hasCompleted) return true;
          if (statusList.includes('bookmarked') && isBookmarked) return true;
          if (statusList.includes('not_started') && !hasSubmissions && !isBookmarked) return true;

          return false;
        });
      }

      // Get total count for pagination (without filters)
      const totalQuery = `
        SELECT COUNT(*) as count FROM timeline_events WHERE user_id = ?
      `;
      const totalParams = [userId];
      if (date_from) {
        totalQuery += ' AND created_at >= ?';
        totalParams.push(date_from);
      }
      if (date_to) {
        totalQuery += ' AND created_at <= ?';
        totalParams.push(date_to);
      }
      if (event_type) {
        const types = event_type.split(',').filter(t => ['started', 'completed', 'bookmark_added', 'bookmark_removed'].includes(t));
        if (types.length > 0) {
          totalQuery += ` AND event_type IN (${types.map(() => '?').join(',')})`;
          totalParams.push(...types);
        }
      }

      const totalResult = db.prepare(totalQuery).get(...totalParams);
      const total = totalResult.count;

      res.json({ events, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (error) {
      console.error('Get timeline error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};