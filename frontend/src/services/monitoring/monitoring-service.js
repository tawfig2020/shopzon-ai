import { getAnalytics, logEvent } from 'firebase/analytics';
import { getPerformance, trace } from 'firebase/performance';

import { app } from '../../firebase';

class MonitoringService {
  constructor() {
    this.analytics = getAnalytics(app);
    this.performance = getPerformance(app);
    this.traces = new Map();
    this.errors = [];
    this.metrics = {
      pageLoads: 0,
      apiCalls: 0,
      userActions: 0,
    };
  }

  // Performance Monitoring
  startTrace(traceName) {
    const newTrace = trace(this.performance, traceName);
    newTrace.start();
    this.traces.set(traceName, newTrace);
  }

  stopTrace(traceName) {
    const currentTrace = this.traces.get(traceName);
    if (currentTrace) {
      currentTrace.stop();
      this.traces.delete(traceName);
    }
  }

  // Error Logging
  logError(error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context,
      userId: this.getCurrentUserId(),
    };

    this.errors.push(errorLog);
    console.error('Error logged:', errorLog);

    logEvent(this.analytics, 'error', errorLog);
  }

  // Feature Usage Tracking
  trackFeatureUsage(featureName, metadata = {}) {
    logEvent(this.analytics, `feature_${featureName}`, {
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // User Activity Monitoring
  trackUserAction(actionName, actionData = {}) {
    this.metrics.userActions++;
    logEvent(this.analytics, actionName, {
      ...actionData,
      timestamp: new Date().toISOString(),
    });
  }

  // API Performance Monitoring
  trackApiCall(endpoint, duration, status) {
    this.metrics.apiCalls++;
    logEvent(this.analytics, 'api_call', {
      endpoint,
      duration,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  // Page Load Performance
  trackPageLoad(pageName, loadTime) {
    this.metrics.pageLoads++;
    logEvent(this.analytics, 'page_load', {
      pageName,
      loadTime,
      timestamp: new Date().toISOString(),
    });
  }

  // User Session Tracking
  startUserSession() {
    logEvent(this.analytics, 'session_start', {
      timestamp: new Date().toISOString(),
    });
  }

  endUserSession(sessionDuration) {
    logEvent(this.analytics, 'session_end', {
      duration: sessionDuration,
      timestamp: new Date().toISOString(),
    });
  }

  // Helper Methods
  getCurrentUserId() {
    return 'user-id'; // Replace with actual user ID from auth
  }

  getMetrics() {
    return this.metrics;
  }

  getErrors() {
    return this.errors;
  }
}

export const monitoringService = new MonitoringService();
