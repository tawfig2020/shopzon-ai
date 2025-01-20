import { getAnalytics, logEvent } from 'firebase/analytics';

import { app } from '../../firebase';

class AnalyticsEvents {
  constructor() {
    this.analytics = getAnalytics(app);
  }

  // User Events
  trackUserEngagement(action, metadata = {}) {
    logEvent(this.analytics, 'user_engagement', {
      action,
      ...metadata,
      timestamp: Date.now(),
    });
  }

  trackUserPreference(preferenceType, value, metadata = {}) {
    logEvent(this.analytics, 'user_preference', {
      preferenceType,
      value,
      ...metadata,
      timestamp: Date.now(),
    });
  }

  // Shopping List Events
  trackListCreation(listName, itemCount, metadata = {}) {
    logEvent(this.analytics, 'list_creation', {
      listName,
      itemCount,
      ...metadata,
      timestamp: Date.now(),
    });
  }

  trackListModification(listId, action, metadata = {}) {
    logEvent(this.analytics, 'list_modification', {
      listId,
      action,
      ...metadata,
      timestamp: Date.now(),
    });
  }

  trackItemInteraction(itemId, action, metadata = {}) {
    logEvent(this.analytics, 'item_interaction', {
      itemId,
      action,
      ...metadata,
      timestamp: Date.now(),
    });
  }

  // AI Feature Events
  trackAISuggestion(suggestionType, accepted, metadata = {}) {
    logEvent(this.analytics, 'ai_suggestion', {
      suggestionType,
      accepted,
      ...metadata,
      timestamp: Date.now(),
    });
  }

  trackAIInteraction(featureType, success, metadata = {}) {
    logEvent(this.analytics, 'ai_interaction', {
      featureType,
      success,
      ...metadata,
      timestamp: Date.now(),
    });
  }

  // Household Events
  trackHouseholdActivity(householdId, action, metadata = {}) {
    logEvent(this.analytics, 'household_activity', {
      householdId,
      action,
      ...metadata,
      timestamp: Date.now(),
    });
  }

  trackMemberInteraction(memberId, action, metadata = {}) {
    logEvent(this.analytics, 'member_interaction', {
      memberId,
      action,
      ...metadata,
      timestamp: Date.now(),
    });
  }

  // Performance Events
  trackPerformanceMetric(metricName, value, metadata = {}) {
    logEvent(this.analytics, 'performance_metric', {
      metricName,
      value,
      ...metadata,
      timestamp: Date.now(),
    });
  }

  // Custom Events
  trackCustomEvent(eventName, metadata = {}) {
    logEvent(this.analytics, eventName, {
      ...metadata,
      timestamp: Date.now(),
    });
  }

  // Conversion Events
  trackConversion(type, value, metadata = {}) {
    logEvent(this.analytics, 'conversion', {
      type,
      value,
      ...metadata,
      timestamp: Date.now(),
    });
  }
}

export const analyticsEvents = new AnalyticsEvents();
