# CodePractice - Coding Practice Platform

A full-stack web application for practicing coding problems, similar to LeetCode.

## Features

### ✅ User Authentication
- Sign up with username, email, and password
- Log in with username or email
- Session-based authentication
- Secure password hashing with bcrypt

### ✅ Problem List
- Browse coding problems organized by difficulty (Easy/Medium/Hard)
- See your solved/attempted status for each problem
- 8 curated problems covering various algorithms and data structures

### ✅ Code Editor
- Integrated code editor with syntax highlighting-friendly styling
- Support for **6 programming languages**:
  - JavaScript
  - Python
  - Java
  - C++
  - C
  - C#
- Tab indentation support
- Language switching with starter code templates

### ✅ Code Execution
- Run code against sample test cases
- Sandboxed execution using child processes with timeouts
- See output, expected values, and error messages
- Runtime and memory metrics

### ✅ Solution Submission
- Submit solutions against all test cases (including hidden ones)
- Submission status tracking:
  - **Accepted** - All tests pass
  - **Wrong Answer** - Output doesn't match expected
  - **Runtime Error** - Code throws an exception
  - **Time Limit Exceeded** - Execution exceeds 5 seconds

### ✅ Interactive Problem Timeline
- Track your coding activity over time
- View started problems, completed solutions, and bookmark actions
- Filter by date, problem status, and tags
- Click timeline items to open problems with your last code

### ✅ Submission History
- View all past submissions for each problem
- See status, runtime, and timestamp
- Click to load previous code into the editor

## Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: HTML/CSS + Vanilla JavaScript
- **Database**: SQLite (via better-sqlite3)
- **Code Execution**: Sandboxed processes for multiple languages
  - JavaScript (Node.js)
  - Python (python3)
  - C (GCC)
  - C++ (G++)
  - Java (javac + java)
  - C# (Mono mcs)

## Project Structure

```
/testbed/zed-base/
├── public/                 # Static frontend files
│   ├── css/
│   │   └── style.css      # All styles
│   ├── js/
│   │   └── api.js         # API client & auth utilities
│   ├── index.html         # Landing page
│   ├── login.html         # Login page
│   ├── signup.html        # Signup page
│   ├── problems.html      # Problems list
│   ├── problem.html       # Problem detail & code editor
│   └── 404.html           # Not found page
├── src/
│   ├── routes/
│   │   ├── auth.js        # Authentication routes
│   │   ├── problems.js    # Problems API
│   │   └── submissions.js # Submissions API
│   ├── middleware/
│   │   └── auth.js        # Auth middleware
│   ├── utils/
│   │   └── codeExecutor.js # Sandboxed code execution
│   ├── database.js        # SQLite setup
│   ├── seed.js            # Seed problems
│   └── server.js          # Express server
├── data/
│   └── coding_platform.db # SQLite database
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - Log in user
- `POST /api/auth/logout` - Log out user
- `GET /api/auth/me` - Get current user

### Problems
- `GET /api/problems` - List all problems
- `GET /api/problems/:slug` - Get problem details

### Submissions
- `POST /api/submissions/run` - Run code against sample tests
- `POST /api/submissions/submit` - Submit solution
- `GET /api/submissions/history/:problemSlug` - Get submission history
- `GET /api/submissions/:id` - Get specific submission

### Timeline
- `GET /api/timeline` - Get user's activity timeline (requires authentication)

## Getting Started

### Prerequisites
- Node.js 16+ 
- Python 3 (for Python code execution)

### Installation

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd CodePractice

# Install dependencies
npm install

# Seed the database with problems
npm run seed

# Start the server
npm start
```

**Note:** The `npm run seed` command will create the database file and populate it with sample problems. You only need to run this once.

### Server Management

#### Starting the Server
```bash
npm start
```
The server will start on http://localhost:3000

#### Stopping the Server
To stop the server, press `Ctrl+C` in the terminal where it's running.

#### Restarting the Server
To restart the server:
1. Stop the server with `Ctrl+C`
2. Start it again with `npm start`

#### Troubleshooting

**Port 3000 Already in Use Error**
If you see an error like "EADDRINUSE: address already in use :::3000", it means another process is using port 3000.

**Solution:**
```bash
# Find the process using port 3000
ps aux | grep "node src/server.js"

# Kill the process (replace PID with the actual process ID)
kill PID

# Then start the server again
npm start
```

**Alternative - Use a Different Port**
You can modify the port in `src/server.js`:
```javascript
const PORT = process.env.PORT || 3001; // Change 3000 to another port
```

**Check if Server is Running**
```bash
# Check if port 3000 is in use
curl -s http://localhost:3000/ && echo "Server is running" || echo "Server is not running"
```

**Missing Language Compilers**
If you get errors about missing compilers when running code:

**For C/C++:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install gcc g++
```

**For Java:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install default-jdk
```

**For C#:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mono-mcs
```

**Note:** Python and JavaScript don't require additional installations as they're usually pre-installed.

**Database Issues**
If you encounter database-related errors:

**Reset the Database**
```bash
# Remove the existing database
rm data/coding_platform.db

# Re-seed the database
npm run seed
```

**Permission Issues**
If you get permission errors with the database file:
```bash
# Fix permissions on the data directory
chmod -R 755 data/
```

**Database File Location**
The database file is stored at `data/coding_platform.db` relative to the project root.

### Usage

1. Open http://localhost:3000 in your browser
2. Create an account or log in
3. Browse problems and select one to solve
4. Write your solution in the code editor
5. Click "Run" to test against sample cases
6. Click "Submit" to submit your solution

## Available Problems

| # | Title | Difficulty |
|---|-------|------------|
| 1 | Two Sum | Easy |
| 2 | Palindrome Number | Easy |
| 3 | Valid Parentheses | Easy |
| 4 | Reverse Linked List | Medium |
| 5 | Maximum Subarray | Medium |
| 6 | Merge Intervals | Medium |
| 7 | Longest Palindromic Substring | Hard |
| 8 | Trapping Rain Water | Hard |

## Security Notes

- Code execution is sandboxed with 10-second timeout
- Memory limit of 128MB for JavaScript execution
- Compilation timeout of 10 seconds for compiled languages
- Output size capped at 10KB
- Passwords hashed with bcrypt (10 rounds)
- Session-based authentication with HTTP-only cookies

## Supported Languages

| Language | Compiler/Runtime | Requirements |
|----------|------------------|--------------|
| JavaScript | Node.js | Built-in |
| Python | python3 | Built-in |
| C | GCC | `apt install gcc` |
| C++ | G++ | `apt install g++` |
| Java | OpenJDK | `apt install default-jdk` |
| C# | Mono | `apt install mono-mcs` |

> Note: Languages without the required compiler will show an appropriate error message.

## Development

```bash
# Run in development mode (same as start for this project)
npm run dev
```

## License

MIT