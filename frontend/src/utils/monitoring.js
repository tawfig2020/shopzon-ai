import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export const initializeMonitoring = () => {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    beforeSend(event) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        return null;
      }
      return event;
    },
  });
};

export const trackError = (error, context = {}) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

export const trackPerformance = (name, data = {}) => {
  Sentry.addBreadcrumb({
    category: 'performance',
    message: name,
    data,
    level: 'info',
  });
};

export const setUserContext = (user) => {
  if (user) {
    Sentry.setUser({
      id: user.uid,
      email: user.email,
    });
  } else {
    Sentry.setUser(null);
  }
};
