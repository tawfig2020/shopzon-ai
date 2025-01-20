import { getAnalytics, logEvent } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

import { app } from '../../firebase';

class EnhancedMonitoring {
  constructor() {
    this.analytics = getAnalytics(app);
    this.performance = getPerformance(app);
    this.sessionStartTime = null;
    this.interactionCount = 0;
    this.networkRequests = [];
    this.memoryUsage = [];
    this.fps = [];
  }

  // Memory Monitoring
  trackMemoryUsage() {
    if (performance.memory) {
      this.memoryUsage.push({
        timestamp: Date.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
      });
    }
  }

  // FPS Monitoring
  trackFPS() {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      const currentTime = performance.now();
      frameCount++;

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.fps.push({
          timestamp: Date.now(),
          fps,
        });
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  // Network Monitoring
  trackNetworkRequest(url, method, duration, status) {
    const request = {
      timestamp: Date.now(),
      url,
      method,
      duration,
      status,
    };
    this.networkRequests.push(request);
    logEvent(this.analytics, 'network_request', request);
  }

  // User Interaction Monitoring
  trackInteraction(elementId, interactionType, metadata = {}) {
    this.interactionCount++;
    logEvent(this.analytics, 'user_interaction', {
      elementId,
      interactionType,
      ...metadata,
      timestamp: Date.now(),
      sessionDuration: this.getSessionDuration(),
      interactionCount: this.interactionCount,
    });
  }

  // Session Monitoring
  startSession() {
    this.sessionStartTime = Date.now();
    logEvent(this.analytics, 'session_start', {
      timestamp: this.sessionStartTime,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
    });
  }

  getSessionDuration() {
    return this.sessionStartTime ? Date.now() - this.sessionStartTime : 0;
  }

  // Performance Metrics
  trackResourceTiming() {
    const resources = performance.getEntriesByType('resource');
    resources.forEach((resource) => {
      logEvent(this.analytics, 'resource_timing', {
        name: resource.name,
        duration: resource.duration,
        initiatorType: resource.initiatorType,
        timestamp: Date.now(),
      });
    });
  }

  // Error Tracking with Severity
  trackError(error, severity = 'error', metadata = {}) {
    logEvent(this.analytics, 'error_occurred', {
      message: error.message,
      stack: error.stack,
      severity,
      ...metadata,
      timestamp: Date.now(),
    });
  }

  // Feature Usage Analytics
  trackFeatureUsage(featureId, action, metadata = {}) {
    logEvent(this.analytics, 'feature_usage', {
      featureId,
      action,
      ...metadata,
      timestamp: Date.now(),
      sessionDuration: this.getSessionDuration(),
    });
  }

  // Get Monitoring Reports
  getPerformanceReport() {
    return {
      memoryUsage: this.memoryUsage,
      fps: this.fps,
      networkRequests: this.networkRequests,
      interactionCount: this.interactionCount,
      sessionDuration: this.getSessionDuration(),
    };
  }
}

export const enhancedMonitoring = new EnhancedMonitoring();
