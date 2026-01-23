const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

module.exports = function(db) {
  // Default lists that are created for new users
  const DEFAULT_LISTS = [
    { name: 'Revise Later', description: 'Problems to review again', color: '#f59e0b', icon: '🔄' },
    { name: 'Interview Prep', description: 'Important for interviews', color: '#10b981', icon: '💼' },
    { name: 'Hard Problems', description: 'Challenging problems to practice', color: '#ef4444', icon: '🔥' },
    { name: 'Favorites', description: 'My favorite problems', color: '#ec4899', icon: '⭐' }
  ];

  // Helper function to ensure user has default lists
  function ensureDefaultLists(userId) {
    const existingLists = db.prepare('SELECT COUNT(*) as count FROM bookmark_lists WHERE user_id = ?').get(userId);
    
    if (existingLists.count === 0) {
      const insertStmt = db.prepare(`
        INSERT INTO bookmark_lists (user_id, name, description, color, icon, position)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      DEFAULT_LISTS.forEach((list, index) => {
        insertStmt.run(userId, list.name, list.description, list.color, list.icon, index);
      });
    }
  }

  // Get all bookmark lists for the current user
  router.get('/lists', requireAuth, (req, res) => {
    try {
      const userId = req.session.userId;
      
      // Ensure default lists exist
      ensureDefaultLists(userId);
      
      const lists = db.prepare(`
        SELECT bl.*, 
          (SELECT COUNT(*) FROM bookmarks b WHERE b.list_id = bl.id) as bookmark_count
        FROM bookmark_lists bl
        WHERE bl.user_id = ?
        ORDER BY bl.position, bl.created_at
      `).all(userId);
      
      res.json({ lists });
    } catch (error) {
      console.error('Get bookmark lists error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create a new bookmark list
  router.post('/lists', requireAuth, (req, res) => {
    try {
      const userId = req.session.userId;
      const { name, description, color, icon } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'List name is required' });
      }
      
      if (name.length > 50) {
        return res.status(400).json({ error: 'List name must be 50 characters or less' });
      }
      
      // Check for duplicate list name
      const existingList = db.prepare('SELECT id FROM bookmark_lists WHERE user_id = ? AND LOWER(name) = LOWER(?)').get(userId, name.trim());
      if (existingList) {
        return res.status(400).json({ error: 'A list with this name already exists' });
      }
      
      // Get max position for ordering
      const maxPos = db.prepare('SELECT MAX(position) as max FROM bookmark_lists WHERE user_id = ?').get(userId);
      const position = (maxPos.max || 0) + 1;
      
      const result = db.prepare(`
        INSERT INTO bookmark_lists (user_id, name, description, color, icon, position)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, name.trim(), description || '', color || '#3b82f6', icon || '📚', position);
      
      const newList = db.prepare('SELECT * FROM bookmark_lists WHERE id = ?').get(result.lastInsertRowid);
      
      res.json({ success: true, list: newList });
    } catch (error) {
      console.error('Create bookmark list error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update a bookmark list
  router.put('/lists/:id', requireAuth, (req, res) => {
    try {
      const userId = req.session.userId;
      const listId = req.params.id;
      const { name, description, color, icon } = req.body;
      
      // Check ownership
      const list = db.prepare('SELECT * FROM bookmark_lists WHERE id = ? AND user_id = ?').get(listId, userId);
      if (!list) {
        return res.status(404).json({ error: 'List not found' });
      }
      
      if (name && !name.trim()) {
        return res.status(400).json({ error: 'List name cannot be empty' });
      }
      
      if (name && name.length > 50) {
        return res.status(400).json({ error: 'List name must be 50 characters or less' });
      }
      
      // Check for duplicate list name (if name is being changed)
      if (name && name.trim().toLowerCase() !== list.name.toLowerCase()) {
        const existingList = db.prepare('SELECT id FROM bookmark_lists WHERE user_id = ? AND LOWER(name) = LOWER(?) AND id != ?').get(userId, name.trim(), listId);
        if (existingList) {
          return res.status(400).json({ error: 'A list with this name already exists' });
        }
      }
      
      db.prepare(`
        UPDATE bookmark_lists 
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            color = COALESCE(?, color),
            icon = COALESCE(?, icon)
        WHERE id = ? AND user_id = ?
      `).run(name?.trim(), description, color, icon, listId, userId);
      
      const updatedList = db.prepare('SELECT * FROM bookmark_lists WHERE id = ?').get(listId);
      
      res.json({ success: true, list: updatedList });
    } catch (error) {
      console.error('Update bookmark list error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete a bookmark list (and all its bookmarks)
  router.delete('/lists/:id', requireAuth, (req, res) => {
    try {
      const userId = req.session.userId;
      const listId = req.params.id;
      
      // Check ownership
      const list = db.prepare('SELECT * FROM bookmark_lists WHERE id = ? AND user_id = ?').get(listId, userId);
      if (!list) {
        return res.status(404).json({ error: 'List not found' });
      }
      
      // Delete bookmarks in this list first (cascade should handle this but being explicit)
      db.prepare('DELETE FROM bookmarks WHERE list_id = ?').run(listId);
      
      // Delete the list
      db.prepare('DELETE FROM bookmark_lists WHERE id = ? AND user_id = ?').run(listId, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete bookmark list error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all bookmarks for the current user (with filtering and sorting)
  router.get('/', requireAuth, (req, res) => {
    try {
      const userId = req.session.userId;
      const { listId, difficulty, topic, sortBy, sortOrder } = req.query;
      
      let query = `
        SELECT b.*, 
          p.title as problem_title, 
          p.slug as problem_slug, 
          p.difficulty,
          p.topics,
          bl.name as list_name,
          bl.color as list_color,
          bl.icon as list_icon
        FROM bookmarks b
        JOIN problems p ON b.problem_id = p.id
        JOIN bookmark_lists bl ON b.list_id = bl.id
        WHERE b.user_id = ?
      `;
      
      const params = [userId];
      
      // Filter by list
      if (listId) {
        query += ' AND b.list_id = ?';
        params.push(listId);
      }
      
      // Filter by difficulty
      if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
        query += ' AND p.difficulty = ?';
        params.push(difficulty);
      }
      
      // Sorting
      const validSortFields = {
        'title': 'p.title',
        'difficulty': "CASE p.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Hard' THEN 3 END",
        'created_at': 'b.created_at',
        'updated_at': 'b.created_at'  // Using created_at as we don't have updated_at
      };
      
      const sortField = validSortFields[sortBy] || 'b.created_at';
      const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
      
      query += ` ORDER BY ${sortField} ${order}`;
      
      let bookmarks = db.prepare(query).all(...params);
      
      // Parse topics JSON
      bookmarks.forEach(b => {
        b.topics = JSON.parse(b.topics || '[]');
      });
      
      // Filter by topic (done in JS since topics is JSON)
      if (topic) {
        bookmarks = bookmarks.filter(b => 
          b.topics.some(t => t.toLowerCase() === topic.toLowerCase())
        );
      }
      
      // Get all unique topics for filter dropdown
      const allBookmarksForTopics = db.prepare(`
        SELECT DISTINCT p.topics
        FROM bookmarks b
        JOIN problems p ON b.problem_id = p.id
        WHERE b.user_id = ?
      `).all(userId);
      
      const topicSet = new Set();
      allBookmarksForTopics.forEach(b => {
        const topics = JSON.parse(b.topics || '[]');
        topics.forEach(t => topicSet.add(t));
      });
      const availableTopics = Array.from(topicSet).sort();
      
      res.json({ bookmarks, availableTopics });
    } catch (error) {
      console.error('Get bookmarks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Helper function to extract the best Python solution from editorial
  function extractPythonSolution(editorial) {
    if (!editorial) return null;
    
    try {
      const editorialData = typeof editorial === 'string' ? JSON.parse(editorial) : editorial;
      
      if (!editorialData.approaches || editorialData.approaches.length === 0) {
        return null;
      }
      
      // Try to find the optimal solution (usually the last approach or one with better complexity)
      // Prefer approaches with "Optimal", "Hash", "O(n)" in name/description
      let bestApproach = null;
      
      for (const approach of editorialData.approaches) {
        if (approach.code?.python) {
          // Prefer optimal solutions
          const isOptimal = 
            approach.name?.toLowerCase().includes('optimal') ||
            approach.name?.toLowerCase().includes('hash') ||
            approach.timeComplexity?.includes('O(n)') ||
            approach.timeComplexity?.includes('O(log');
          
          if (!bestApproach || isOptimal) {
            bestApproach = approach;
          }
        }
      }
      
      if (bestApproach?.code?.python) {
        return {
          approach: bestApproach.name,
          timeComplexity: bestApproach.timeComplexity,
          spaceComplexity: bestApproach.spaceComplexity,
          code: bestApproach.code.python,
          description: bestApproach.description
        };
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }

  // Export bookmarks as JSON
  router.get('/export', requireAuth, (req, res) => {
    try {
      const userId = req.session.userId;
      const { listId } = req.query;
      
      // Get user info
      const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
      
      // Build query for bookmarks with full problem details including editorial
      let query = `
        SELECT 
          b.id as bookmark_id,
          b.notes,
          b.created_at as bookmarked_at,
          p.id as problem_id,
          p.title,
          p.slug,
          p.difficulty,
          p.description,
          p.topics,
          p.constraints,
          p.editorial,
          p.starter_code,
          bl.id as list_id,
          bl.name as list_name,
          bl.description as list_description,
          bl.color as list_color,
          bl.icon as list_icon
        FROM bookmarks b
        JOIN problems p ON b.problem_id = p.id
        JOIN bookmark_lists bl ON b.list_id = bl.id
        WHERE b.user_id = ?
      `;
      
      const params = [userId];
      
      if (listId) {
        query += ' AND b.list_id = ?';
        params.push(listId);
      }
      
      query += ' ORDER BY bl.name, p.title';
      
      const bookmarks = db.prepare(query).all(...params);
      
      // Get all lists for the user
      const lists = db.prepare(`
        SELECT id, name, description, color, icon, 
          (SELECT COUNT(*) FROM bookmarks WHERE list_id = bookmark_lists.id) as bookmark_count
        FROM bookmark_lists 
        WHERE user_id = ?
        ORDER BY position, name
      `).all(userId);
      
      // Format the export data with Python solutions
      const exportData = {
        exportInfo: {
          exportedAt: new Date().toISOString(),
          exportedBy: user.username,
          totalBookmarks: bookmarks.length,
          totalLists: lists.length,
          version: '1.1',
          note: 'Each problem includes a default Python solution when available'
        },
        lists: lists.map(list => ({
          id: list.id,
          name: list.name,
          description: list.description,
          color: list.color,
          icon: list.icon,
          bookmarkCount: list.bookmark_count
        })),
        bookmarks: bookmarks.map(b => {
          // Extract Python solution from editorial
          const pythonSolution = extractPythonSolution(b.editorial);
          
          // Extract Python starter code
          let starterCode = null;
          try {
            const starterCodeData = JSON.parse(b.starter_code || '{}');
            starterCode = starterCodeData.python || null;
          } catch (e) {}
          
          return {
            bookmarkId: b.bookmark_id,
            problem: {
              id: b.problem_id,
              title: b.title,
              slug: b.slug,
              difficulty: b.difficulty,
              description: b.description,
              topics: JSON.parse(b.topics || '[]'),
              constraints: b.constraints,
              url: `/problem/${b.slug}`,
              starterCode: {
                python: starterCode
              },
              solution: {
                python: pythonSolution
              }
            },
            list: {
              id: b.list_id,
              name: b.list_name,
              icon: b.list_icon
            },
            notes: b.notes,
            bookmarkedAt: b.bookmarked_at
          };
        })
      };
      
      // Set headers for file download
      const filename = listId 
        ? `bookmarks-${lists.find(l => l.id == listId)?.name || 'list'}-${new Date().toISOString().split('T')[0]}.json`
        : `all-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/[^a-z0-9.-]/gi, '-')}"`);
      
      res.json(exportData);
    } catch (error) {
      console.error('Export bookmarks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get bookmark status for a specific problem
  router.get('/problem/:problemId', requireAuth, (req, res) => {
    try {
      const userId = req.session.userId;
      const { problemId } = req.params;
      
      const bookmarks = db.prepare(`
        SELECT b.*, bl.name as list_name, bl.color as list_color, bl.icon as list_icon
        FROM bookmarks b
        JOIN bookmark_lists bl ON b.list_id = bl.id
        WHERE b.user_id = ? AND b.problem_id = ?
      `).all(userId, problemId);
      
      res.json({ 
        isBookmarked: bookmarks.length > 0,
        bookmarks 
      });
    } catch (error) {
      console.error('Get problem bookmark status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Add a bookmark
  router.post('/', requireAuth, (req, res) => {
    try {
      const userId = req.session.userId;
      const { problemId, listId, notes } = req.body;
      
      if (!problemId || !listId) {
        return res.status(400).json({ error: 'Problem ID and List ID are required' });
      }
      
      // Verify problem exists
      const problem = db.prepare('SELECT id FROM problems WHERE id = ?').get(problemId);
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }
      
      // Verify list exists and belongs to user
      const list = db.prepare('SELECT id FROM bookmark_lists WHERE id = ? AND user_id = ?').get(listId, userId);
      if (!list) {
        return res.status(404).json({ error: 'List not found' });
      }
      
      // Check if already bookmarked to this list
      const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND problem_id = ? AND list_id = ?').get(userId, problemId, listId);
      if (existing) {
        return res.status(400).json({ error: 'Problem already bookmarked to this list' });
      }
      
      const result = db.prepare(`
        INSERT INTO bookmarks (user_id, problem_id, list_id, notes)
        VALUES (?, ?, ?, ?)
      `).run(userId, problemId, listId, notes || '');
      
      const newBookmark = db.prepare(`
        SELECT b.*, 
          p.title as problem_title, 
          p.slug as problem_slug, 
          p.difficulty,
          bl.name as list_name,
          bl.color as list_color,
          bl.icon as list_icon
        FROM bookmarks b
        JOIN problems p ON b.problem_id = p.id
        JOIN bookmark_lists bl ON b.list_id = bl.id
        WHERE b.id = ?
      `).get(result.lastInsertRowid);
      
      res.json({ success: true, bookmark: newBookmark });
    } catch (error) {
      console.error('Add bookmark error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update bookmark notes
  router.put('/:id', requireAuth, (req, res) => {
    try {
      const userId = req.session.userId;
      const bookmarkId = req.params.id;
      const { notes, listId } = req.body;
      
      // Check ownership
      const bookmark = db.prepare('SELECT * FROM bookmarks WHERE id = ? AND user_id = ?').get(bookmarkId, userId);
      if (!bookmark) {
        return res.status(404).json({ error: 'Bookmark not found' });
      }
      
      // If changing list, verify new list exists and belongs to user
      if (listId && listId !== bookmark.list_id) {
        const list = db.prepare('SELECT id FROM bookmark_lists WHERE id = ? AND user_id = ?').get(listId, userId);
        if (!list) {
          return res.status(404).json({ error: 'Target list not found' });
        }
        
        // Check if already bookmarked to target list
        const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND problem_id = ? AND list_id = ?').get(userId, bookmark.problem_id, listId);
        if (existing) {
          return res.status(400).json({ error: 'Problem already bookmarked to target list' });
        }
      }
      
      db.prepare(`
        UPDATE bookmarks 
        SET notes = COALESCE(?, notes),
            list_id = COALESCE(?, list_id)
        WHERE id = ? AND user_id = ?
      `).run(notes, listId, bookmarkId, userId);
      
      const updatedBookmark = db.prepare(`
        SELECT b.*, 
          p.title as problem_title, 
          p.slug as problem_slug, 
          p.difficulty,
          bl.name as list_name,
          bl.color as list_color,
          bl.icon as list_icon
        FROM bookmarks b
        JOIN problems p ON b.problem_id = p.id
        JOIN bookmark_lists bl ON b.list_id = bl.id
        WHERE b.id = ?
      `).get(bookmarkId);
      
      res.json({ success: true, bookmark: updatedBookmark });
    } catch (error) {
      console.error('Update bookmark error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Remove a bookmark
  router.delete('/:id', requireAuth, (req, res) => {
    try {
      const userId = req.session.userId;
      const bookmarkId = req.params.id;
      
      // Check ownership
      const bookmark = db.prepare('SELECT * FROM bookmarks WHERE id = ? AND user_id = ?').get(bookmarkId, userId);
      if (!bookmark) {
        return res.status(404).json({ error: 'Bookmark not found' });
      }
      
      db.prepare('DELETE FROM bookmarks WHERE id = ? AND user_id = ?').run(bookmarkId, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete bookmark error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Remove bookmark by problem ID and list ID
  router.delete('/problem/:problemId/list/:listId', requireAuth, (req, res) => {
    try {
      const userId = req.session.userId;
      const { problemId, listId } = req.params;
      
      const result = db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND problem_id = ? AND list_id = ?').run(userId, problemId, listId);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Bookmark not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete bookmark by problem/list error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};