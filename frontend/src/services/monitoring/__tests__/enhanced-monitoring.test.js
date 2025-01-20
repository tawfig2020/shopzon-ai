import { getAnalytics, logEvent } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

import { enhancedMonitoring } from '../enhanced-monitoring';

jest.mock('firebase/analytics');
jest.mock('firebase/performance');

describe('EnhancedMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('trackMemoryUsage records memory stats', () => {
    const mockMemory = {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
    };

    global.performance.memory = mockMemory;
    enhancedMonitoring.trackMemoryUsage();

    expect(enhancedMonitoring.memoryUsage[0]).toEqual(
      expect.objectContaining({
        usedJSHeapSize: mockMemory.usedJSHeapSize,
        totalJSHeapSize: mockMemory.totalJSHeapSize,
      })
    );
  });

  test('trackNetworkRequest logs network activity', () => {
    const requestData = {
      url: 'https://api.example.com',
      method: 'GET',
      duration: 500,
      status: 200,
    };

    enhancedMonitoring.trackNetworkRequest(
      requestData.url,
      requestData.method,
      requestData.duration,
      requestData.status
    );

    expect(logEvent).toHaveBeenCalledWith(
      expect.anything(),
      'network_request',
      expect.objectContaining(requestData)
    );
  });

  test('trackInteraction increments interaction count', () => {
    const initialCount = enhancedMonitoring.interactionCount;

    enhancedMonitoring.trackInteraction('button-1', 'click');

    expect(enhancedMonitoring.interactionCount).toBe(initialCount + 1);
    expect(logEvent).toHaveBeenCalledWith(
      expect.anything(),
      'user_interaction',
      expect.objectContaining({
        elementId: 'button-1',
        interactionType: 'click',
      })
    );
  });

  test('session duration calculation', () => {
    enhancedMonitoring.startSession();
    jest.advanceTimersByTime(5000);

    const duration = enhancedMonitoring.getSessionDuration();
    expect(duration).toBe(5000);
  });

  test('trackError with severity levels', () => {
    const error = new Error('Test error');
    const severity = 'critical';
    const metadata = { component: 'TestComponent' };

    enhancedMonitoring.trackError(error, severity, metadata);

    expect(logEvent).toHaveBeenCalledWith(
      expect.anything(),
      'error_occurred',
      expect.objectContaining({
        message: error.message,
        severity,
        component: metadata.component,
      })
    );
  });
});
