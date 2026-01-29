// API utility functions
const API = {
  async request(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
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

  async runInterviewCode(code, language) {
    return this.request('/api/submissions/interview-run', {
      method: 'POST',
      body: JSON.stringify({ code, language })
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
  },

  // Bookmark Lists
  async getBookmarkLists() {
    return this.request('/api/bookmarks/lists');
  },

  async createBookmarkList(name, description = '', color = '#3b82f6', icon = '📚') {
    return this.request('/api/bookmarks/lists', {
      method: 'POST',
      body: JSON.stringify({ name, description, color, icon })
    });
  },

  async updateBookmarkList(listId, updates) {
    return this.request(`/api/bookmarks/lists/${listId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteBookmarkList(listId) {
    return this.request(`/api/bookmarks/lists/${listId}`, {
      method: 'DELETE'
    });
  },

  // Bookmarks
  async getBookmarks(listId = null) {
    const url = listId ? `/api/bookmarks?listId=${listId}` : '/api/bookmarks';
    return this.request(url);
  },

  async getProblemBookmarks(problemId) {
    return this.request(`/api/bookmarks/problem/${problemId}`);
  },

  async addBookmark(problemId, listId, notes = '') {
    return this.request('/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ problemId, listId, notes })
    });
  },

  async updateBookmark(bookmarkId, updates) {
    return this.request(`/api/bookmarks/${bookmarkId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async removeBookmark(bookmarkId) {
    return this.request(`/api/bookmarks/${bookmarkId}`, {
      method: 'DELETE'
    });
  },

  async removeBookmarkByProblemAndList(problemId, listId) {
    return this.request(`/api/bookmarks/problem/${problemId}/list/${listId}`, {
      method: 'DELETE'
    });
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

// ==================== TOAST NOTIFICATIONS ====================

function showToast(type, title, message, duration = 5000) {
  // Create container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-content">
      <div class="toast-title">${escapeHtmlForToast(title)}</div>
      ${message ? `<div class="toast-message">${escapeHtmlForToast(message)}</div>` : ''}
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }

  return toast;
}

function escapeHtmlForToast(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Convenience functions
function showSuccessToast(title, message) {
  return showToast('success', title, message);
}

function showErrorToast(title, message) {
  return showToast('error', title, message);
}

function showWarningToast(title, message) {
  return showToast('warning', title, message);
}
