const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');

module.exports = function(db) {
  // Get all contests
  router.get('/', requireAuth, (req, res) => {
    try {
      const { status } = req.query;
      let contestsQuery = `
        SELECT c.id, c.title, c.description, c.start_time, c.end_time, c.status, c.created_at,
               u.username as created_by_username,
               COUNT(cp.id) as problem_count
        FROM contests c
        JOIN users u ON c.created_by = u.id
        LEFT JOIN contest_problems cp ON c.id = cp.contest_id
        WHERE 1=1
      `;
      const params = [];

      if (req.user.role !== 'admin') {
        contestsQuery += ` AND c.status = 'published'`;
      } else if (status) {
        contestsQuery += ` AND c.status = ?`;
        params.push(status);
      }

      contestsQuery += `
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;

      const contests = db.prepare(contestsQuery).all(...params);

      // For each contest, add participant info if user is participating
      if (req.user) {
        contests.forEach(contest => {
          const participant = db.prepare(`
            SELECT score FROM contest_participants
            WHERE contest_id = ? AND user_id = ?
          `).get(contest.id, req.user.id);
          contest.userScore = participant ? participant.score : null;
        });
      }

      res.json({ contests });
    } catch (error) {
      console.error('Get contests error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create contest (admin only) - requires title, optionally includes problems
  router.post('/', requireAuth, requireAdmin, (req, res) => {
    try {
      const { title, description, problems } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Contest title is required' });
      }

      // Insert contest in draft state
      const insertContest = db.prepare(`
        INSERT INTO contests (title, description, start_time, end_time, status, created_by)
        VALUES (?, ?, '', '', 'draft', ?)
      `);
      const result = insertContest.run(title, description || '', req.user.id);
      const contestId = result.lastInsertRowid;

      // Add problems if provided
      if (problems && Array.isArray(problems) && problems.length > 0) {
        const insertProblem = db.prepare(`
          INSERT INTO contest_problems (contest_id, problem_id, marks, problem_order)
          VALUES (?, ?, ?, ?)
        `);

        problems.forEach((p, index) => {
          // Validate problem exists
          const problemExists = db.prepare('SELECT id FROM problems WHERE id = ?').get(p.problem_id);
          if (!problemExists) {
            throw new Error(`Problem with ID ${p.problem_id} does not exist`);
          }

          insertProblem.run(contestId, p.problem_id, p.marks || 100, index + 1);
        });
      }

      res.status(201).json({ contestId });
    } catch (error) {
      console.error('Create contest error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get contest details
  router.get('/:id', requireAuth, (req, res) => {
    try {
      const contestId = req.params.id;
      const contest = db.prepare(`
        SELECT c.id, c.title, c.description, c.start_time, c.end_time, c.status, c.created_at,
               u.username as created_by_username
        FROM contests c
        JOIN users u ON c.created_by = u.id
        WHERE c.id = ?
      `).get(contestId);

      if (!contest) {
        return res.status(404).json({ error: 'Contest not found' });
      }

      // Check if user can access (admins can see all, users only published/ended)
      if (req.user.role !== 'admin' && contest.status === 'draft') {
        return res.status(403).json({ error: 'Contest not accessible' });
      }

      // Calculate contest state for published contests
      let contestState = contest.status;
      if (contest.status === 'published' && contest.start_time && contest.end_time) {
        const now = new Date();
        const start = new Date(contest.start_time);
        const end = new Date(contest.end_time);

        if (now < start) {
          contestState = 'upcoming';
        } else if (now >= start && now <= end) {
          contestState = 'in-progress';

          // Auto-update status if needed
          if (contest.status !== 'in-progress') {
            db.prepare('UPDATE contests SET status = ? WHERE id = ?').run('in-progress', contestId);
            contest.status = 'in-progress';
          }
        } else {
          contestState = 'ended';

          // Auto-update status if needed
          if (contest.status !== 'ended') {
            db.prepare('UPDATE contests SET status = ? WHERE id = ?').run('ended', contestId);
            contest.status = 'ended';
          }
        }
      }

      // Get problems
      const problems = db.prepare(`
        SELECT cp.problem_order, cp.marks, p.id, p.title, p.slug, p.difficulty
        FROM contest_problems cp
        JOIN problems p ON cp.problem_id = p.id
        WHERE cp.contest_id = ?
        ORDER BY cp.problem_order
      `).all(contestId);

      // Get participant status
      let participant = null;
      if (req.user) {
        participant = db.prepare(`
          SELECT score, joined_at FROM contest_participants
          WHERE contest_id = ? AND user_id = ?
        `).get(contestId, req.user.id);
      }

      res.json({ contest: { ...contest, state: contestState }, problems, participant });
    } catch (error) {
      console.error('Get contest error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update contest basic info (admin only)
  router.put('/:id', requireAuth, requireAdmin, (req, res) => {
    try {
      const contestId = req.params.id;
      const { title, description } = req.body;

      // Check if contest exists and is in draft state
      const contest = db.prepare('SELECT * FROM contests WHERE id = ?').get(contestId);
      if (!contest) {
        return res.status(404).json({ error: 'Contest not found' });
      }

      if (contest.status !== 'draft') {
        return res.status(400).json({ error: 'Can only edit contests in draft state' });
      }

      // Update contest
      const updateContest = db.prepare(`
        UPDATE contests
        SET title = ?, description = ?
        WHERE id = ?
      `);
      updateContest.run(title || contest.title, description !== undefined ? description : contest.description, contestId);

      res.json({ success: true });
    } catch (error) {
      console.error('Update contest error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Publish contest (admin only)
  router.post('/:id/publish', requireAuth, requireAdmin, (req, res) => {
    try {
      const contestId = req.params.id;
      const { start_time, end_time } = req.body;

      if (!start_time || !end_time) {
        return res.status(400).json({ error: 'Start time and end time are required' });
      }

      // Validate times
      const start = new Date(start_time);
      const end = new Date(end_time);
      const now = new Date();

      if (start <= now) {
        return res.status(400).json({ error: 'Start time must be in the future' });
      }

      if (start >= end) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }

      // Check if contest exists and is in draft state
      const contest = db.prepare('SELECT * FROM contests WHERE id = ?').get(contestId);
      if (!contest) {
        return res.status(404).json({ error: 'Contest not found' });
      }

      if (contest.status !== 'draft') {
        return res.status(400).json({ error: 'Contest is already published' });
      }

      // Check if contest has problems
      const problemCount = db.prepare('SELECT COUNT(*) as count FROM contest_problems WHERE contest_id = ?').get(contestId).count;
      if (problemCount === 0) {
        return res.status(400).json({ error: 'Contest must have at least one problem to be published' });
      }

      // Publish contest
      const updateContest = db.prepare(`
        UPDATE contests
        SET start_time = ?, end_time = ?, status = 'published'
        WHERE id = ?
      `);
      updateContest.run(start_time, end_time, contestId);

      res.json({ success: true });
    } catch (error) {
      console.error('Publish contest error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Add problem to contest (admin only)
  router.post('/:id/problems', requireAuth, requireAdmin, (req, res) => {
    try {
      const contestId = req.params.id;
      const { problem_id, marks } = req.body;

      if (!problem_id) {
        return res.status(400).json({ error: 'Problem ID is required' });
      }

      // Check if contest exists and is in draft state
      const contest = db.prepare('SELECT * FROM contests WHERE id = ?').get(contestId);
      if (!contest) {
        return res.status(404).json({ error: 'Contest not found' });
      }

      if (contest.status !== 'draft') {
        return res.status(400).json({ error: 'Can only add problems to contests in draft state' });
      }

      // Check if problem exists
      const problem = db.prepare('SELECT id FROM problems WHERE id = ?').get(problem_id);
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      // Check if problem is already in contest
      const existing = db.prepare('SELECT id FROM contest_problems WHERE contest_id = ? AND problem_id = ?').get(contestId, problem_id);
      if (existing) {
        return res.status(400).json({ error: 'Problem is already in this contest' });
      }

      // Get next order
      const maxOrder = db.prepare('SELECT MAX(problem_order) as max_order FROM contest_problems WHERE contest_id = ?').get(contestId).max_order || 0;

      // Add problem
      const insertProblem = db.prepare(`
        INSERT INTO contest_problems (contest_id, problem_id, marks, problem_order)
        VALUES (?, ?, ?, ?)
      `);
      insertProblem.run(contestId, problem_id, marks || 100, maxOrder + 1);

      res.status(201).json({ success: true });
    } catch (error) {
      console.error('Add problem error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update problem marks in contest (admin only)
  router.put('/:id/problems/:problemId', requireAuth, requireAdmin, (req, res) => {
    try {
      const contestId = req.params.id;
      const problemId = req.params.problemId;
      const { marks } = req.body;

      if (!marks || marks < 1) {
        return res.status(400).json({ error: 'Valid marks are required' });
      }

      // Check if contest exists and is in draft state
      const contest = db.prepare('SELECT * FROM contests WHERE id = ?').get(contestId);
      if (!contest) {
        return res.status(404).json({ error: 'Contest not found' });
      }

      if (contest.status !== 'draft') {
        return res.status(400).json({ error: 'Can only update problems in contests in draft state' });
      }

      // Update marks
      const updateProblem = db.prepare(`
        UPDATE contest_problems
        SET marks = ?
        WHERE contest_id = ? AND problem_id = ?
      `);
      const result = updateProblem.run(marks, contestId, problemId);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Problem not found in this contest' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Update problem marks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Remove problem from contest (admin only)
  router.delete('/:id/problems/:problemId', requireAuth, requireAdmin, (req, res) => {
    try {
      const contestId = req.params.id;
      const problemId = req.params.problemId;

      // Check if contest exists and is in draft state
      const contest = db.prepare('SELECT * FROM contests WHERE id = ?').get(contestId);
      if (!contest) {
        return res.status(404).json({ error: 'Contest not found' });
      }

      if (contest.status !== 'draft') {
        return res.status(400).json({ error: 'Can only remove problems from contests in draft state' });
      }

      // Remove problem
      const deleteProblem = db.prepare(`
        DELETE FROM contest_problems
        WHERE contest_id = ? AND problem_id = ?
      `);
      const result = deleteProblem.run(contestId, problemId);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Problem not found in this contest' });
      }

      // Reorder remaining problems
      const remainingProblems = db.prepare(`
        SELECT id, problem_id FROM contest_problems
        WHERE contest_id = ?
        ORDER BY problem_order
      `).all(contestId);

      remainingProblems.forEach((problem, index) => {
        db.prepare(`
          UPDATE contest_problems
          SET problem_order = ?
          WHERE id = ?
        `).run(index + 1, problem.id);
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Remove problem error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Join contest
  router.post('/:id/join', requireAuth, (req, res) => {
    try {
      const contestId = req.params.id;

      // Check if contest exists and is published
      const contest = db.prepare('SELECT id, status FROM contests WHERE id = ?').get(contestId);
      if (!contest || contest.status !== 'published') {
        return res.status(404).json({ error: 'Contest not found or not available' });
      }

      // Check if already participating
      const existing = db.prepare(`
        SELECT id FROM contest_participants WHERE contest_id = ? AND user_id = ?
      `).get(contestId, req.user.id);
      if (existing) {
        return res.status(400).json({ error: 'Already participating' });
      }

      // Join contest
      const insert = db.prepare(`
        INSERT INTO contest_participants (contest_id, user_id) VALUES (?, ?)
      `);
      insert.run(contestId, req.user.id);

      res.json({ success: true });
    } catch (error) {
      console.error('Join contest error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get contest leaderboard
  router.get('/:id/leaderboard', requireAuth, (req, res) => {
    try {
      const contestId = req.params.id;

      // Check if contest exists
      const contest = db.prepare('SELECT id FROM contests WHERE id = ?').get(contestId);
      if (!contest) {
        return res.status(404).json({ error: 'Contest not found' });
      }

      // Get leaderboard
      const leaderboard = db.prepare(`
        SELECT u.username, cp.score, cp.joined_at
        FROM contest_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.contest_id = ?
        ORDER BY cp.score DESC, cp.joined_at ASC
      `).all(contestId);

      res.json({ leaderboard });
    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};