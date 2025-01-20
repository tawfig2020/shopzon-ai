import { getAnalytics, logEvent } from 'firebase/analytics';

import { app } from '../../firebase';

import { monitoringService } from './monitoring-service';

const analytics = getAnalytics(app);

class ErrorTracker {
  constructor() {
    this.errorCounts = {};
    this.criticalErrors = ['TypeError', 'ReferenceError', 'SyntaxError'];
  }

  trackError(category, error) {
    const errorKey = `${error.errorMessage}:${category}`;
    this.errorCounts[errorKey] = (this.errorCounts[errorKey] || 0) + 1;

    logEvent(analytics, 'error', {
      error_category: category,
      error_message: error.errorMessage,
      error_count: this.errorCounts[errorKey],
    });

    monitoringService.trackEvent({
      category: 'error',
      action: category,
      label: error.errorMessage,
    });

    if (this.isCriticalError(error)) {
      this.handleCriticalError(error, category);
    }
  }

  handleCriticalError(error, category) {
    logEvent(analytics, 'critical_error', {
      error_category: category,
      error_message: error.errorMessage,
    });

    monitoringService.trackEvent({
      category: 'critical_error',
      action: category,
      label: error.errorMessage,
      critical: true,
    });
  }

  isCriticalError(error) {
    return (
      this.criticalErrors.includes(error.name) ||
      this.errorCounts[`${error.name}:${error.message}`] >= 5
    );
  }

  reset() {
    this.errorCounts = {};
  }
}

export const errorTracker = new ErrorTracker();
