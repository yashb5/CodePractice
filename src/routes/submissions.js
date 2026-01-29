const express = require('express');
const router = express.Router();
const codeExecutor = require('../utils/codeExecutor');
const { requireAuth } = require('../middleware/auth');

// Function name mapping for different problems and languages
const functionNameMap = {
  'two-sum': { 
    javascript: 'twoSum', 
    python: 'two_sum',
    java: 'twoSum',
    c: 'twoSum',
    cpp: 'twoSum',
    csharp: 'TwoSum'
  },
  'palindrome-number': { 
    javascript: 'isPalindrome', 
    python: 'is_palindrome',
    java: 'isPalindrome',
    c: 'isPalindrome',
    cpp: 'isPalindrome',
    csharp: 'IsPalindrome'
  },
  'valid-parentheses': { 
    javascript: 'isValid', 
    python: 'is_valid',
    java: 'isValid',
    c: 'isValid',
    cpp: 'isValid',
    csharp: 'IsValid'
  },
  'reverse-linked-list': { 
    javascript: 'reverseList', 
    python: 'reverse_list',
    java: 'reverseList',
    c: 'reverseList',
    cpp: 'reverseList',
    csharp: 'ReverseList'
  },
  'maximum-subarray': { 
    javascript: 'maxSubArray', 
    python: 'max_sub_array',
    java: 'maxSubArray',
    c: 'maxSubArray',
    cpp: 'maxSubArray',
    csharp: 'MaxSubArray'
  },
  'merge-intervals': { 
    javascript: 'merge', 
    python: 'merge',
    java: 'merge',
    c: 'merge',
    cpp: 'merge',
    csharp: 'Merge'
  },
  'longest-palindromic-substring': { 
    javascript: 'longestPalindrome', 
    python: 'longest_palindrome',
    java: 'longestPalindrome',
    c: 'longestPalindrome',
    cpp: 'longestPalindrome',
    csharp: 'LongestPalindrome'
  },
  'trapping-rain-water': { 
    javascript: 'trap', 
    python: 'trap',
    java: 'trap',
    c: 'trap',
    cpp: 'trap',
    csharp: 'Trap'
  },
  'binary-search': { 
    javascript: 'search', 
    python: 'search',
    java: 'search',
    c: 'search',
    cpp: 'search',
    csharp: 'Search'
  },
  'climbing-stairs': { 
    javascript: 'climbStairs', 
    python: 'climb_stairs',
    java: 'climbStairs',
    c: 'climbStairs',
    cpp: 'climbStairs',
    csharp: 'ClimbStairs'
  },
  'first-unique-character': { 
    javascript: 'firstUniqChar', 
    python: 'first_uniq_char',
    java: 'firstUniqChar',
    c: 'firstUniqChar',
    cpp: 'firstUniqChar',
    csharp: 'FirstUniqChar'
  },
  'fizzbuzz': { 
    javascript: 'fizzBuzz', 
    python: 'fizz_buzz',
    java: 'fizzBuzz',
    c: 'fizzBuzz',
    cpp: 'fizzBuzz',
    csharp: 'FizzBuzz'
  },
  'move-zeroes': { 
    javascript: 'moveZeroes', 
    python: 'move_zeroes',
    java: 'moveZeroes',
    c: 'moveZeroes',
    cpp: 'moveZeroes',
    csharp: 'MoveZeroes'
  },
  'contains-duplicate': { 
    javascript: 'containsDuplicate', 
    python: 'contains_duplicate',
    java: 'containsDuplicate',
    c: 'containsDuplicate',
    cpp: 'containsDuplicate',
    csharp: 'ContainsDuplicate'
  },
  'sliding-window-maximum': { 
    javascript: 'maxSlidingWindow', 
    python: 'max_sliding_window',
    java: 'maxSlidingWindow',
    c: 'maxSlidingWindow',
    cpp: 'maxSlidingWindow',
    csharp: 'MaxSlidingWindow'
  }
};

// Supported languages
const SUPPORTED_LANGUAGES = ['javascript', 'python', 'java', 'c', 'cpp', 'csharp'];

module.exports = function(db) {
  // Run code for interview mode (no tests, just execution)
  router.post('/interview-run', requireAuth, async (req, res) => {
    try {
      const { code, language } = req.body;

      if (!code || !language) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!SUPPORTED_LANGUAGES.includes(language)) {
        return res.status(400).json({ error: `Unsupported language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}` });
      }

      const result = await codeExecutor.runInterviewCode(code, language);

      res.json(result);
    } catch (error) {
      console.error('Interview run error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Run code against sample tests (no submission saved)
  router.post('/run', requireAuth, async (req, res) => {
    try {
      const { problemSlug, code, language } = req.body;

      if (!problemSlug || !code || !language) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!SUPPORTED_LANGUAGES.includes(language)) {
        return res.status(400).json({ error: `Unsupported language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}` });
      }

      const problem = db.prepare('SELECT * FROM problems WHERE slug = ?').get(problemSlug);
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      const allTestCases = JSON.parse(problem.test_cases);
      const sampleTests = allTestCases.filter(tc => !tc.isHidden);

      const functionName = functionNameMap[problemSlug]?.[language];
      if (!functionName) {
        return res.status(400).json({ error: 'Function name not configured for this problem' });
      }

      const result = await codeExecutor.execute(code, language, sampleTests, functionName);

      res.json({
        success: true,
        results: result.results,
        summary: result.summary
      });
    } catch (error) {
      console.error('Run code error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Submit solution (runs against all tests and saves result)
  router.post('/submit', requireAuth, async (req, res) => {
    try {
      const { problemSlug, code, language } = req.body;
      const userId = req.session.userId;

      if (!problemSlug || !code || !language) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!SUPPORTED_LANGUAGES.includes(language)) {
        return res.status(400).json({ error: `Unsupported language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}` });
      }

      const problem = db.prepare('SELECT * FROM problems WHERE slug = ?').get(problemSlug);
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      const allTestCases = JSON.parse(problem.test_cases);

      const functionName = functionNameMap[problemSlug]?.[language];
      if (!functionName) {
        return res.status(400).json({ error: 'Function name not configured for this problem' });
      }

      const result = await codeExecutor.execute(code, language, allTestCases, functionName);

      // Save submission
      const submission = db.prepare(`
        INSERT INTO submissions (user_id, problem_id, code, language, status, runtime_ms, memory_kb, output)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        problem.id,
        code,
        language,
        result.summary.status,
        Math.round(result.summary.totalRuntime),
        Math.round(result.summary.peakMemory),
        JSON.stringify({
          passed: result.summary.passed,
          total: result.summary.total,
          results: result.results.map(r => ({
            status: r.status,
            runtime: r.runtime,
            error: r.error
          }))
        })
      );

      // Insert timeline events
      // Check if first submission for this problem
      const existingSubmissions = db.prepare(`
        SELECT COUNT(*) as count FROM submissions WHERE user_id = ? AND problem_id = ?
      `).get(userId, problem.id).count;

      if (existingSubmissions === 1) {
        // This is the first submission, so 'started'
        db.prepare(`
          INSERT INTO timeline_events (user_id, event_type, problem_id)
          VALUES (?, 'started', ?)
        `).run(userId, problem.id);
      }

      if (result.summary.status === 'Accepted') {
        // Check if first Accepted
        const existingAccepted = db.prepare(`
          SELECT COUNT(*) as count FROM submissions WHERE user_id = ? AND problem_id = ? AND status = 'Accepted'
        `).get(userId, problem.id).count;

        if (existingAccepted === 1) {
          // This is the first Accepted, so 'completed'
          db.prepare(`
            INSERT INTO timeline_events (user_id, event_type, problem_id)
            VALUES (?, 'completed', ?)
          `).run(userId, problem.id);
        }
      }

      res.json({
        success: true,
        submissionId: submission.lastInsertRowid,
        status: result.summary.status,
        passed: result.summary.passed,
        total: result.summary.total,
        runtime: Math.round(result.summary.totalRuntime),
        memory: Math.round(result.summary.peakMemory),
        results: result.results.map((r, i) => ({
          testCase: i + 1,
          status: r.status,
          runtime: r.runtime,
          error: allTestCases[i].isHidden ? (r.error ? 'Error on hidden test case' : null) : r.error,
          // Only show input/output for non-hidden test cases
          input: allTestCases[i].isHidden ? null : allTestCases[i].input,
          expected: allTestCases[i].isHidden ? null : r.expected,
          output: allTestCases[i].isHidden ? null : r.output,
          isHidden: allTestCases[i].isHidden
        }))
      });
    } catch (error) {
      console.error('Submit error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all submissions for a user (for track progress page)
  router.get('/all', requireAuth, (req, res) => {
    try {
      const userId = req.session.userId;

      const submissions = db.prepare(`
        SELECT s.id, s.code, s.language, s.status, s.runtime_ms, s.memory_kb, s.created_at,
               p.id as problem_id, p.title as problem_title, p.slug as problem_slug, p.difficulty
        FROM submissions s
        JOIN problems p ON s.problem_id = p.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
        LIMIT 100
      `).all(userId);

      // Also get summary stats
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_submissions,
          SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) as accepted_submissions,
          COUNT(DISTINCT problem_id) as problems_attempted,
          (SELECT COUNT(DISTINCT problem_id) FROM submissions WHERE user_id = ? AND status = 'Accepted') as problems_solved
        FROM submissions
        WHERE user_id = ?
      `).get(userId, userId);

      res.json({ submissions, stats });
    } catch (error) {
      console.error('Get all submissions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get submission history for a problem
  router.get('/history/:problemSlug', requireAuth, (req, res) => {
    try {
      const { problemSlug } = req.params;
      const userId = req.session.userId;

      const problem = db.prepare('SELECT id FROM problems WHERE slug = ?').get(problemSlug);
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      const submissions = db.prepare(`
        SELECT id, code, language, status, runtime_ms, memory_kb, output, created_at
        FROM submissions
        WHERE user_id = ? AND problem_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `).all(userId, problem.id);

      submissions.forEach(s => {
        s.output = JSON.parse(s.output || '{}');
      });

      res.json({ submissions });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get a specific submission
  router.get('/:id', requireAuth, (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      const submission = db.prepare(`
        SELECT s.*, p.slug as problem_slug, p.title as problem_title
        FROM submissions s
        JOIN problems p ON s.problem_id = p.id
        WHERE s.id = ? AND s.user_id = ?
      `).get(id, userId);

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      submission.output = JSON.parse(submission.output || '{}');

      res.json({ submission });
    } catch (error) {
      console.error('Get submission error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
