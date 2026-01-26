// Timeline functionality
(function() {
  'use strict';

  let currentUser = null;
  let currentOffset = 0;
  const limit = 20;
  let hasMore = true;
  let isLoading = false;

  // DOM elements - get them safely
  function getElement(id) {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`Element with id '${id}' not found`);
      return { classList: { add: () => {}, remove: () => {} }, style: {}, textContent: '', innerHTML: '' };
    }
    return el;
  }

  const loginPrompt = getElement('login-prompt');
  const timelineContent = getElement('timeline-content');
  const timelineItems = getElement('timeline-items');
  const loadingState = getElement('loading-state');
  const emptyState = getElement('empty-state');
  const loadMore = getElement('load-more');
  const loadMoreBtn = getElement('load-more-btn');
  const applyFiltersBtn = getElement('apply-filters');
  const clearFiltersBtn = getElement('clear-filters');

  // Filter elements
  const dateFromInput = getElement('date-from');
  const dateToInput = getElement('date-to');
  const problemStatusSelect = getElement('problem-status');
  const tagsInput = getElement('tags');

  // Initialize
  async function init() {
    try {
      // Check if user is authenticated
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.user) {
          showTimeline();
          loadTimeline(true);
          return;
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }

    // Not authenticated, show login prompt
    if (loginPrompt) {
      loginPrompt.classList.remove('hidden');
    }
    if (timelineContent) {
      timelineContent.classList.add('hidden');
    }
  }

  function showTimeline() {
    if (loginPrompt) {
      loginPrompt.classList.add('hidden');
    }
    if (timelineContent) {
      timelineContent.classList.remove('hidden');
      timelineContent.style.display = 'block';
    }
  }

  function getFilters() {
    const filters = {};

    if (dateFromInput.value) {
      filters.date_from = dateFromInput.value;
    }
    if (dateToInput.value) {
      filters.date_to = dateToInput.value;
    }

    const selectedStatuses = Array.from(problemStatusSelect.selectedOptions).map(opt => opt.value);
    if (selectedStatuses.length > 0) {
      filters.problem_status = selectedStatuses.join(',');
    }

    if (tagsInput.value.trim()) {
      filters.tags = tagsInput.value.trim();
    }

    return filters;
  }

  async function loadTimeline(reset = false) {
    if (isLoading) return;

    isLoading = true;

    if (reset) {
      currentOffset = 0;
      hasMore = true;
      timelineItems.innerHTML = '';
      emptyState.classList.add('hidden');
    }

    loadingState.classList.remove('hidden');

    try {
      const filters = getFilters();
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
        ...filters
      });

      const response = await fetch(`/api/timeline?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.events && data.events.length === 0 && currentOffset === 0) {
        emptyState.classList.remove('hidden');
        loadMore.classList.add('hidden');
      } else if (data.events) {
        emptyState.classList.add('hidden');
        renderEvents(data.events);

        if (data.events.length < limit) {
          hasMore = false;
          loadMore.classList.add('hidden');
        } else {
          loadMore.classList.remove('hidden');
        }
      }

      currentOffset += limit;
      loadingState.classList.add('hidden');
      isLoading = false;

    } catch (error) {
      console.error('Load timeline error:', error);
      if (emptyState) {
        emptyState.innerHTML = '<div style="color: red; padding: 1rem;">Error loading timeline: ' + error.message + '</div>';
        emptyState.classList.remove('hidden');
      }
      loadingState.classList.add('hidden');
      isLoading = false;
    }
  }

  function renderEvents(events) {
    if (!timelineItems) return;

    events.forEach(event => {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      item.onclick = () => handleEventClick(event);

      const eventTypeText = getEventTypeText(event.event_type);
      const iconClass = `timeline-item-icon ${event.event_type}`;
      const icon = getEventIcon(event.event_type);

      let description = '';
      if (event.event_type === 'bookmark_added' || event.event_type === 'bookmark_removed') {
        description = event.bookmark_list_name ? `to "${event.bookmark_list_name}" list` : '';
      }

      const timeAgo = getTimeAgo(new Date(event.created_at));

      item.innerHTML = `
        <div class="${iconClass}">${icon}</div>
        <div class="timeline-item-header">
          <div>
            <h3 class="timeline-item-title">
              ${eventTypeText} ${event.problem_title || 'Unknown Problem'}
              <span class="difficulty difficulty-${event.difficulty?.toLowerCase() || 'easy'}">${event.difficulty || 'Easy'}</span>
            </h3>
            <div class="timeline-item-time">${timeAgo}</div>
          </div>
        </div>
        <div class="timeline-item-meta">
          <span>📝 ${event.problem_title}</span>
          ${event.topics && Array.isArray(event.topics) && event.topics.length > 0 ? `<span>🏷️ ${event.topics.slice(0, 3).join(', ')}</span>` : ''}
        </div>
        ${description ? `<div class="timeline-item-description">${description}</div>` : ''}
      `;

      timelineItems.appendChild(item);
    });
  }

  function getEventTypeText(eventType) {
    switch (eventType) {
      case 'started': return 'Started';
      case 'completed': return 'Completed';
      case 'bookmark_added': return 'Bookmarked';
      case 'bookmark_removed': return 'Removed bookmark from';
      default: return eventType;
    }
  }

  function getEventIcon(eventType) {
    switch (eventType) {
      case 'started': return '🚀';
      case 'completed': return '✅';
      case 'bookmark_added': return '🔖';
      case 'bookmark_removed': return '🗑️';
      default: return '📝';
    }
  }

  function handleEventClick(event) {
    if (event.problem_slug) {
      window.location.href = `/problem/${event.problem_slug}?load_user_code=1`;
    }
  }

  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  // Initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();