const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'coding_platform.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    difficulty TEXT CHECK(difficulty IN ('Easy', 'Medium', 'Hard')) NOT NULL,
    description TEXT NOT NULL,
    examples TEXT NOT NULL,
    constraints TEXT,
    starter_code TEXT NOT NULL,
    test_cases TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    problem_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    status TEXT CHECK(status IN ('Accepted', 'Wrong Answer', 'Runtime Error', 'Time Limit Exceeded', 'Compilation Error')) NOT NULL,
    runtime_ms INTEGER,
    memory_kb INTEGER,
    output TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (problem_id) REFERENCES problems(id)
  );

  CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
  CREATE INDEX IF NOT EXISTS idx_submissions_problem ON submissions(problem_id);
  CREATE INDEX IF NOT EXISTS idx_submissions_user_problem ON submissions(user_id, problem_id);
`);

// Add topics column if it doesn't exist (for migration)
try {
  db.exec(`ALTER TABLE problems ADD COLUMN topics TEXT DEFAULT '[]'`);
} catch (e) {
  // Column already exists, ignore
}

// Add editorial column if it doesn't exist (for migration)
try {
  db.exec(`ALTER TABLE problems ADD COLUMN editorial TEXT DEFAULT ''`);
} catch (e) {
  // Column already exists, ignore
}

// Create bookmark lists table
db.exec(`
  CREATE TABLE IF NOT EXISTS bookmark_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT '📚',
    position INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    problem_id INTEGER NOT NULL,
    list_id INTEGER NOT NULL,
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (list_id) REFERENCES bookmark_lists(id) ON DELETE CASCADE,
    UNIQUE(user_id, problem_id, list_id)
  );

  CREATE INDEX IF NOT EXISTS idx_bookmark_lists_user ON bookmark_lists(user_id);
  CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
  CREATE INDEX IF NOT EXISTS idx_bookmarks_list ON bookmarks(list_id);
  CREATE INDEX IF NOT EXISTS idx_bookmarks_problem ON bookmarks(problem_id);

  CREATE TABLE IF NOT EXISTS timeline_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_type TEXT CHECK(event_type IN ('started', 'completed', 'bookmark_added', 'bookmark_removed')) NOT NULL,
    problem_id INTEGER,
    bookmark_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_timeline_events_user ON timeline_events(user_id);
  CREATE INDEX IF NOT EXISTS idx_timeline_events_type ON timeline_events(event_type);
  CREATE INDEX IF NOT EXISTS idx_timeline_events_problem ON timeline_events(problem_id);
  CREATE INDEX IF NOT EXISTS idx_timeline_events_created ON timeline_events(created_at);
`);

// Add unique constraint on bookmark list names per user (migration for existing DBs)
try {
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmark_lists_user_name ON bookmark_lists(user_id, name)`);
} catch (e) {
  // Index might already exist or there are duplicates, ignore
}

// Migration code removed - handling in application logic instead

// Add role column to users if not exists
try {
  db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`);
} catch (e) {
  // Column already exists, ignore
}

// Create contests tables
db.exec(`
  CREATE TABLE IF NOT EXISTS contests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    start_time DATETIME,
    end_time DATETIME,
    status TEXT CHECK(status IN ('draft', 'published', 'ongoing', 'ended')) DEFAULT 'draft',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS contest_problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contest_id INTEGER NOT NULL,
    problem_id INTEGER NOT NULL,
    marks INTEGER NOT NULL DEFAULT 100,
    problem_order INTEGER NOT NULL,
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS contest_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contest_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    score INTEGER DEFAULT 0,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(contest_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS contest_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contest_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    problem_id INTEGER NOT NULL,
    submission_id INTEGER NOT NULL,
    marks_awarded INTEGER NOT NULL DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
  CREATE INDEX IF NOT EXISTS idx_contests_created_by ON contests(created_by);
  CREATE INDEX IF NOT EXISTS idx_contest_problems_contest ON contest_problems(contest_id);
  CREATE INDEX IF NOT EXISTS idx_contest_participants_contest ON contest_participants(contest_id);
  CREATE INDEX IF NOT EXISTS idx_contest_participants_user ON contest_participants(user_id);
  CREATE INDEX IF NOT EXISTS idx_contest_submissions_contest ON contest_submissions(contest_id);
  CREATE INDEX IF NOT EXISTS idx_contest_submissions_user ON contest_submissions(user_id);
`);

module.exports = db;
