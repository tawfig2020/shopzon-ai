import { getAnalytics, logEvent } from 'firebase/analytics';

import { app } from '../../firebase';

const analytics = getAnalytics(app);

class FeatureTracker {
  constructor() {
    this.features = new Map();
  }

  trackFeatureUse(feature, action, metadata = {}) {
    const key = `${feature}:${action}`;
    const count = (this.features.get(key) || 0) + 1;
    this.features.set(key, count);

    logEvent(analytics, 'feature_use', {
      feature_name: feature,
      action,
      count,
      ...metadata,
    });
  }

  getFeatureUsage(feature) {
    const usage = {};
    this.features.forEach((count, key) => {
      if (key.startsWith(feature + ':')) {
        const action = key.split(':')[1];
        usage[action] = count;
      }
    });
    return usage;
  }

  reset() {
    this.features.clear();
  }
}

export const featureTracker = new FeatureTracker();
