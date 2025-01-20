import { getAnalytics, logEvent } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

import { monitoringService } from '../monitoring-service';

jest.mock('firebase/analytics');
jest.mock('firebase/performance');

describe('MonitoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('trackFeatureUsage logs event correctly', () => {
    const featureName = 'testFeature';
    const metadata = { action: 'click' };

    monitoringService.trackFeatureUsage(featureName, metadata);

    expect(logEvent).toHaveBeenCalledWith(
      expect.anything(),
      `feature_${featureName}`,
      expect.objectContaining({
        ...metadata,
        timestamp: expect.any(String),
      })
    );
  });

  test('logError records error correctly', () => {
    const error = new Error('Test error');
    const context = { component: 'TestComponent' };

    monitoringService.logError(error, context);

    expect(logEvent).toHaveBeenCalledWith(
      expect.anything(),
      'error',
      expect.objectContaining({
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        context,
      })
    );
  });

  test('trackApiCall increments metrics counter', () => {
    const initialCount = monitoringService.metrics.apiCalls;

    monitoringService.trackApiCall('/test', 100, 'success');

    expect(monitoringService.metrics.apiCalls).toBe(initialCount + 1);
  });

  test('trackPageLoad records load time', () => {
    const pageName = 'TestPage';
    const loadTime = 1000;

    monitoringService.trackPageLoad(pageName, loadTime);

    expect(logEvent).toHaveBeenCalledWith(
      expect.anything(),
      'page_load',
      expect.objectContaining({
        pageName,
        loadTime,
        timestamp: expect.any(String),
      })
    );
  });
});
