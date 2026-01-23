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
`);

// Add unique constraint on bookmark list names per user (migration for existing DBs)
try {
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmark_lists_user_name ON bookmark_lists(user_id, name)`);
} catch (e) {
  // Index might already exist or there are duplicates, ignore
}

module.exports = db;
