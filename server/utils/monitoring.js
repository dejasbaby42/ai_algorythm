/**
 * Logs an error with contextual information.
 * @param {string} message - A descriptive error message.
 * @param {Error} error - The error object.
 * @param {object} context - Additional context for the error (e.g., user ID, request path).
 */
function logError(message, error, context = {}) {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
  console.error(error);
  if (Object.keys(context).length > 0) {
    console.error('Context:', JSON.stringify(context, null, 2));
  }
}

/**
 * Tracks performance metrics.
 * @param {string} metricName - The name of the metric (e.g., 'api_response_time', 'db_query_duration').
 * @param {number} durationMs - The duration in milliseconds.
 * @param {object} tags - Optional tags for the metric (e.g., { endpoint: '/api/chat' }).
 */
function trackPerformance(metricName, durationMs, tags = {}) {
  console.log(`[PERF] ${new Date().toISOString()} - ${metricName}: ${durationMs}ms`, tags);
  // In a real application, you would send this to a monitoring service like Prometheus, Datadog, etc.
}

module.exports = {
  logError,
  trackPerformance
};
