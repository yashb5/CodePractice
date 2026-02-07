const metrics = {
  startTime: Date.now(),
  apiEndpoints: {},
  dbQueries: { count: 0, totalDuration: 0, maxDuration: 0 },
  codeExecutions: { count: 0, totalDuration: 0, maxDuration: 0, errors: 0 },
  memorySnapshots: []
};

function recordApiMetrics(endpoint, duration, statusCode) {
  if (!metrics.apiEndpoints[endpoint]) {
    metrics.apiEndpoints[endpoint] = { count: 0, totalDuration: 0, maxDuration: 0, statusCodes: {} };
  }
  const ep = metrics.apiEndpoints[endpoint];
  ep.count++;
  ep.totalDuration += duration;
  ep.maxDuration = Math.max(ep.maxDuration, duration);
  ep.statusCodes[statusCode] = (ep.statusCodes[statusCode] || 0) + 1;
}

function recordDbQuery(duration) {
  metrics.dbQueries.count++;
  metrics.dbQueries.totalDuration += duration;
  metrics.dbQueries.maxDuration = Math.max(metrics.dbQueries.maxDuration, duration);
}

function recordCodeExecution(duration, success) {
  metrics.codeExecutions.count++;
  metrics.codeExecutions.totalDuration += duration;
  metrics.codeExecutions.maxDuration = Math.max(metrics.codeExecutions.maxDuration, duration);
  if (!success) metrics.codeExecutions.errors++;
}

function recordMemorySnapshot() {
  const mem = process.memoryUsage();
  metrics.memorySnapshots.push({
    timestamp: Date.now(),
    rss: mem.rss,
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal
  });
  if (metrics.memorySnapshots.length > 100) metrics.memorySnapshots.shift();
}

function getBusinessMetrics(db) {
  try {
    const activeUsers = db.prepare(`SELECT COUNT(DISTINCT user_id) as count FROM submissions WHERE created_at > datetime('now', '-1 day')`).get().count || 0;
    const langStats = db.prepare(`SELECT language, COUNT(*) as count FROM submissions GROUP BY language`).all();
    const probStats = db.prepare(`SELECT p.title, COUNT(*) as count FROM submissions s JOIN problems p ON s.problem_id = p.id GROUP BY p.id ORDER BY count DESC LIMIT 10`).all();
    const solveRate = db.prepare(`SELECT COUNT(CASE WHEN status = 'Accepted' THEN 1 END) * 100.0 / COUNT(*) as overall_rate, COUNT(CASE WHEN status = 'Accepted' THEN 1 END) as accepted, COUNT(*) as total FROM submissions`).get();
    const langRatios = db.prepare(`SELECT language, COUNT(CASE WHEN status = 'Accepted' THEN 1 END) as accepted, COUNT(*) as total, COUNT(CASE WHEN status = 'Accepted' THEN 1 END) * 100.0 / COUNT(*) as success_rate FROM submissions GROUP BY language`).all();
    const avgBookmarks = db.prepare(`SELECT COUNT(*) * 1.0 / COUNT(DISTINCT user_id) as avg FROM bookmarks`).get().avg || 0;
    const submissionsByLangProblem = db.prepare(`SELECT s.language, p.title as problem, COUNT(*) as count FROM submissions s JOIN problems p ON s.problem_id = p.id GROUP BY s.language, p.id`).all();
    return {
      activeUsers,
      submissionsByLanguage: langStats,
      submissionsByProblem: probStats,
      submissionsByLangProblem,
      overallSolveRate: solveRate.overall_rate || 0,
      submissionRatiosByLanguage: langRatios,
      averageBookmarksPerUser: avgBookmarks,
      totalSubmissions: solveRate.total || 0
    };
  } catch (e) {
    return { error: e.message };
  }
}

function getMetrics(db = null) {
  const uptime = (Date.now() - metrics.startTime) / 1000;
  const avgDb = metrics.dbQueries.count ? (metrics.dbQueries.totalDuration / metrics.dbQueries.count) : 0;
  const avgCode = metrics.codeExecutions.count ? (metrics.codeExecutions.totalDuration / metrics.codeExecutions.count) : 0;
  
  const apiSummary = {};
  Object.keys(metrics.apiEndpoints).forEach(ep => {
    const epData = metrics.apiEndpoints[ep];
    apiSummary[ep] = {
      calls: epData.count,
      avgResponseTime: epData.count ? (epData.totalDuration / epData.count) : 0,
      maxResponseTime: epData.maxDuration,
      statusCodes: epData.statusCodes
    };
  });

  return {
    uptime,
    api: apiSummary,
    database: {
      queries: metrics.dbQueries.count,
      avgQueryTime: avgDb,
      maxQueryTime: metrics.dbQueries.maxDuration
    },
    codeExecutor: {
      executions: metrics.codeExecutions.count,
      avgExecutionTime: avgCode,
      maxExecutionTime: metrics.codeExecutions.maxDuration,
      errors: metrics.codeExecutions.errors
    },
    memory: {
      current: process.memoryUsage(),
      snapshots: metrics.memorySnapshots.slice(-10),
      avgHeapUsed: metrics.memorySnapshots.length ? 
        metrics.memorySnapshots.reduce((sum, s) => sum + s.heapUsed, 0) / metrics.memorySnapshots.length : 0
    },
    business: db ? getBusinessMetrics(db) : {},
    timestamp: new Date().toISOString()
  };
}

function getPrometheusMetrics(db = null) {
  const m = getMetrics(db);
  let out = '# HELP coding_platform_uptime_seconds Server uptime in seconds\n';
  out += '# TYPE coding_platform_uptime_seconds gauge\n';
  out += `coding_platform_uptime_seconds ${m.uptime}\n`;

  out += '# HELP coding_platform_api_requests_total API requests by endpoint and status\n';
  out += '# TYPE coding_platform_api_requests_total counter\n';
  Object.keys(m.api).forEach(ep => {
    const epData = m.api[ep];
    Object.keys(epData.statusCodes || {}).forEach(status => {
      out += `coding_platform_api_requests_total{endpoint="${ep}",status="${status}"} ${epData.statusCodes[status]}\n`;
    });
  });

  out += '# HELP coding_platform_db_queries_total Database queries\n';
  out += '# TYPE coding_platform_db_queries_total counter\n';
  out += `coding_platform_db_queries_total ${m.database.queries}\n`;
  out += '# HELP coding_platform_db_query_duration_seconds DB query duration stats\n';
  out += '# TYPE coding_platform_db_query_duration_seconds gauge\n';
  out += `coding_platform_db_query_duration_seconds{quantile="avg"} ${m.database.avgQueryTime / 1000}\n`;
  out += `coding_platform_db_query_duration_seconds{quantile="max"} ${m.database.maxQueryTime / 1000}\n`;

  out += '# HELP coding_platform_code_executions_total Code executions\n';
  out += '# TYPE coding_platform_code_executions_total counter\n';
  out += `coding_platform_code_executions_total ${m.codeExecutor.executions}\n`;
  out += `coding_platform_code_executions_total{error="true"} ${m.codeExecutor.errors}\n`;
  out += '# HELP coding_platform_code_execution_duration_seconds Code execution duration stats\n';
  out += '# TYPE coding_platform_code_execution_duration_seconds gauge\n';
  out += `coding_platform_code_execution_duration_seconds{quantile="avg"} ${m.codeExecutor.avgExecutionTime / 1000}\n`;
  out += `coding_platform_code_execution_duration_seconds{quantile="max"} ${m.codeExecutor.maxExecutionTime / 1000}\n`;

  const mem = m.memory.current;
  out += '# HELP coding_platform_memory_bytes Memory usage\n';
  out += '# TYPE coding_platform_memory_bytes gauge\n';
  out += `coding_platform_memory_bytes{type="rss"} ${mem.rss}\n`;
  out += `coding_platform_memory_bytes{type="heap_used"} ${mem.heapUsed}\n`;
  out += `coding_platform_memory_bytes{type="heap_total"} ${mem.heapTotal}\n`;

  if (m.business && !m.business.error) {
    out += '# HELP coding_platform_active_users Active users (last 24h)\n';
    out += '# TYPE coding_platform_active_users gauge\n';
    out += `coding_platform_active_users ${m.business.activeUsers}\n`;
    out += '# HELP coding_platform_submissions_total Submissions by language and problem\n';
    out += '# TYPE coding_platform_submissions_total gauge\n';
    m.business.submissionsByLangProblem.forEach(s => {
      out += `coding_platform_submissions_total{language="${s.language}",problem="${s.problem}"} ${s.count}\n`;
    });
    out += '# HELP coding_platform_solve_rate_percent Overall solve rate\n';
    out += '# TYPE coding_platform_solve_rate_percent gauge\n';
    out += `coding_platform_solve_rate_percent ${m.business.overallSolveRate}\n`;
    out += '# HELP coding_platform_average_bookmarks_per_user Average bookmarks\n';
    out += '# TYPE coding_platform_average_bookmarks_per_user gauge\n';
    out += `coding_platform_average_bookmarks_per_user ${m.business.averageBookmarksPerUser}\n`;
  }

  return out;
}

setInterval(recordMemorySnapshot, 30000);
recordMemorySnapshot();

module.exports = {
  recordApiMetrics,
  recordDbQuery,
  recordCodeExecution,
  getMetrics,
  getPrometheusMetrics,
  recordMemorySnapshot
};
