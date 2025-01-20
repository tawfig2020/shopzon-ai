import { logEvent } from 'firebase/analytics';
import { getPerformance, trace } from 'firebase/performance';

import { analytics } from '../config/firebase';

const perf = getPerformance();

export const analyticsService = {
  // Existing analytics methods
  trackEvent: (eventName, eventParams = {}) => {
    try {
      if (analytics) {
        logEvent(analytics, eventName, eventParams);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  },

  // Auth events
  trackSignIn: (method) => {
    analyticsService.trackEvent('login', { method });
  },

  trackSignOut: () => {
    analyticsService.trackEvent('logout');
  },

  trackSignUp: (method) => {
    analyticsService.trackEvent('sign_up', { method });
  },

  // Profile events
  trackProfileUpdate: (updatedFields) => {
    analyticsService.trackEvent('profile_update', {
      fields: updatedFields.join(','),
    });
  },

  trackProfileImageUpload: () => {
    analyticsService.trackEvent('profile_image_upload');
  },

  // Navigation events
  trackPageView: (pageName) => {
    try {
      if (analytics) {
        logEvent(analytics, 'page_view', {
          page_name: pageName,
        });
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  },

  // Error events
  trackError: (errorType, errorMessage) => {
    analyticsService.trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
    });
  },

  // Performance monitoring methods
  getResponseTimeMetrics: async () => {
    try {
      const response = await fetch('/api/metrics/response-time');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch response time metrics:', error);
      return [];
    }
  },

  getErrorRateMetrics: async () => {
    try {
      const response = await fetch('/api/metrics/error-rate');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch error rate metrics:', error);
      return [];
    }
  },

  getUserActivityMetrics: async () => {
    try {
      const response = await fetch('/api/metrics/user-activity');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user activity metrics:', error);
      return [];
    }
  },

  getResourceUsageMetrics: async () => {
    try {
      const response = await fetch('/api/metrics/resource-usage');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch resource usage metrics:', error);
      return {
        cpu: 0,
        memory: 0,
        storage: 0,
      };
    }
  },

  // Performance tracing
  startTrace: (traceName) => {
    try {
      if (perf) {
        return trace(perf, traceName);
      }
    } catch (error) {
      console.error('Performance tracing error:', error);
    }
    return null;
  },

  // Custom metrics
  recordCustomMetric: (metricName, value) => {
    analyticsService.trackEvent('custom_metric', {
      metric_name: metricName,
      value: value,
    });
  },
};
