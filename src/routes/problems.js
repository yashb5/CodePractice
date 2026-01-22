const express = require('express');
const router = express.Router();

module.exports = function(db) {
  // Get all topics
  router.get('/topics', (req, res) => {
    try {
      const problems = db.prepare('SELECT topics FROM problems').all();
      const topicSet = new Set();
      
      problems.forEach(p => {
        const topics = JSON.parse(p.topics || '[]');
        topics.forEach(t => topicSet.add(t));
      });
      
      const topics = Array.from(topicSet).sort();
      res.json({ topics });
    } catch (error) {
      console.error('Get topics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all problems (with optional topic filter)
  router.get('/', (req, res) => {
    try {
      const { topic } = req.query;
      
      let problems = db.prepare(`
        SELECT id, title, slug, difficulty, topics, created_at 
        FROM problems 
        ORDER BY 
          CASE difficulty 
            WHEN 'Easy' THEN 1 
            WHEN 'Medium' THEN 2 
            WHEN 'Hard' THEN 3 
          END,
          id
      `).all();

      // Parse topics and filter if topic is specified
      problems = problems.map(p => ({
        ...p,
        topics: JSON.parse(p.topics || '[]')
      }));

      if (topic && topic !== 'All') {
        problems = problems.filter(p => p.topics.includes(topic));
      }

      // If user is logged in, get their submission status for each problem
      if (req.session && req.session.userId) {
        const userId = req.session.userId;
        const submissions = db.prepare(`
          SELECT problem_id, status,
            (SELECT COUNT(*) FROM submissions s2 WHERE s2.problem_id = s1.problem_id AND s2.user_id = ?) as attempt_count
          FROM submissions s1
          WHERE user_id = ?
          GROUP BY problem_id
          HAVING id = MAX(id)
        `).all(userId, userId);

        const statusMap = {};
        submissions.forEach(s => {
          statusMap[s.problem_id] = {
            status: s.status,
            attempts: s.attempt_count
          };
        });

        problems.forEach(p => {
          p.userStatus = statusMap[p.id] || null;
        });
      }

      // Get all unique topics for the filter tabs
      const allProblems = db.prepare('SELECT topics FROM problems').all();
      const topicSet = new Set();
      allProblems.forEach(p => {
        const topics = JSON.parse(p.topics || '[]');
        topics.forEach(t => topicSet.add(t));
      });
      const allTopics = Array.from(topicSet).sort();

      res.json({ problems, topics: allTopics });
    } catch (error) {
      console.error('Get problems error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get single problem by slug
  router.get('/:slug', (req, res) => {
    try {
      const { slug } = req.params;
      const problem = db.prepare(`
        SELECT id, title, slug, difficulty, description, examples, constraints, starter_code, test_cases, topics, editorial
        FROM problems 
        WHERE slug = ?
      `).get(slug);

      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      // Parse JSON fields
      problem.examples = JSON.parse(problem.examples);
      problem.starter_code = JSON.parse(problem.starter_code);
      problem.topics = JSON.parse(problem.topics || '[]');
      problem.editorial = JSON.parse(problem.editorial || '{}');
      
      // Only return non-hidden test cases for the sample tests
      const allTestCases = JSON.parse(problem.test_cases);
      problem.sampleTests = allTestCases.filter(tc => !tc.isHidden);

      // Don't expose all test cases to the client
      delete problem.test_cases;

      res.json({ problem });
    } catch (error) {
      console.error('Get problem error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
