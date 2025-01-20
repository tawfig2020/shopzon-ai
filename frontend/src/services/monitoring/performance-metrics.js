import { monitoringService } from './monitoring-service';

export const performanceMetrics = {
  // Page Load Performance
  measurePageLoad: (pageName) => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      monitoringService.trackPageLoad(pageName, duration);
    };
  },

  // API Call Performance
  measureApiCall: async (endpoint, apiCall) => {
    const start = performance.now();
    try {
      const result = await apiCall();
      const duration = performance.now() - start;
      monitoringService.trackApiCall(endpoint, duration, 'success');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      monitoringService.trackApiCall(endpoint, duration, 'error');
      throw error;
    }
  },

  // Custom Performance Measurement
  measurePerformance: (name, func) => {
    monitoringService.startTrace(name);
    try {
      const result = func();
      monitoringService.stopTrace(name);
      return result;
    } catch (error) {
      monitoringService.stopTrace(name);
      throw error;
    }
  },

  // Async Custom Performance Measurement
  measureAsyncPerformance: async (name, asyncFunc) => {
    monitoringService.startTrace(name);
    try {
      const result = await asyncFunc();
      monitoringService.stopTrace(name);
      return result;
    } catch (error) {
      monitoringService.stopTrace(name);
      throw error;
    }
  },
};
