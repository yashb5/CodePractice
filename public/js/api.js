// API utility functions
const API = {
  async request(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin'
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }

    return data;
  },

  // Auth
  async signup(username, email, password) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  },

  async login(username, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  async logout() {
    return this.request('/api/auth/logout', { method: 'POST' });
  },

  async getCurrentUser() {
    return this.request('/api/auth/me');
  },

  // Problems
  async getProblems(topic = null) {
    const url = topic ? `/api/problems?topic=${encodeURIComponent(topic)}` : '/api/problems';
    return this.request(url);
  },

  async getTopics() {
    return this.request('/api/problems/topics');
  },

  async getProblem(slug) {
    return this.request(`/api/problems/${slug}`);
  },

  // Submissions
  async runCode(problemSlug, code, language) {
    return this.request('/api/submissions/run', {
      method: 'POST',
      body: JSON.stringify({ problemSlug, code, language })
    });
  },

  async submitCode(problemSlug, code, language) {
    return this.request('/api/submissions/submit', {
      method: 'POST',
      body: JSON.stringify({ problemSlug, code, language })
    });
  },

  async getSubmissionHistory(problemSlug) {
    return this.request(`/api/submissions/history/${problemSlug}`);
  },

  async getAllSubmissions() {
    return this.request('/api/submissions/all');
  },

  async getSubmission(id) {
    return this.request(`/api/submissions/${id}`);
  }
};

// Global user state
let currentUser = null;

async function checkAuth() {
  try {
    const { user } = await API.getCurrentUser();
    currentUser = user;
    updateAuthUI();
    return user;
  } catch (e) {
    currentUser = null;
    updateAuthUI();
    return null;
  }
}

function updateAuthUI() {
  const authNav = document.getElementById('auth-nav');
  const userNav = document.getElementById('user-nav');
  const usernameSpan = document.getElementById('nav-username');

  if (!authNav || !userNav) return;

  if (currentUser) {
    authNav.classList.add('hidden');
    userNav.classList.remove('hidden');
    if (usernameSpan) {
      usernameSpan.textContent = currentUser.username;
    }
  } else {
    authNav.classList.remove('hidden');
    userNav.classList.add('hidden');
  }
}

async function handleLogout() {
  try {
    await API.logout();
    currentUser = null;
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Initialize auth check on page load
document.addEventListener('DOMContentLoaded', checkAuth);
