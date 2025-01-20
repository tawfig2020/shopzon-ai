import React, { useState, useEffect } from 'react';

import { errorTracker } from '../../services/monitoring/error-tracker';
import { featureTracker } from '../../services/monitoring/feature-tracker';
import { performanceMonitor } from '../../services/monitoring/performance-monitor';

function MonitoringDashboard() {
  const [metrics, setMetrics] = useState({
    performance: {},
    errors: {},
    features: {},
  });

  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [activeTab, setActiveTab] = useState('performance');

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics({
        performance: performanceMonitor.getMetrics(),
        errors: errorTracker.getErrorReport(),
        features: featureTracker.getFeatureUsageReport(),
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const renderPerformanceMetrics = () => (
    <div className='metrics-section'>
      <h3>Performance Metrics</h3>
      <div className='metrics-grid'>
        <div className='metric-card'>
          <h4>Page Load Times</h4>
          {Object.entries(metrics.performance.pageLoadTimes || {}).map(([page, data]) => (
            <div key={page}>
              {page}: {data.duration.toFixed(2)}ms
            </div>
          ))}
        </div>
        <div className='metric-card'>
          <h4>API Call Times</h4>
          {Object.entries(metrics.performance.apiCallTimes || {}).map(([endpoint, calls]) => (
            <div key={endpoint}>
              {endpoint}:{' '}
              {(calls.reduce((acc, call) => acc + call.duration, 0) / calls.length).toFixed(2)}
              ms avg
            </div>
          ))}
        </div>
        <div className='metric-card'>
          <h4>Memory Usage</h4>
          {metrics.performance.memory && (
            <>
              <div>
                Used Heap: {(metrics.performance.memory.usedJSHeapSize / 1048576).toFixed(2)} MB
              </div>
              <div>
                Total Heap: {(metrics.performance.memory.totalJSHeapSize / 1048576).toFixed(2)} MB
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderErrorMetrics = () => (
    <div className='metrics-section'>
      <h3>Error Tracking</h3>
      <div className='metrics-grid'>
        <div className='metric-card'>
          <h4>Error Summary</h4>
          <div>Total Errors: {metrics.errors.totalErrors}</div>
          <div>Critical Errors: {metrics.errors.criticalErrors?.length}</div>
        </div>
        <div className='metric-card'>
          <h4>Recent Errors</h4>
          {metrics.errors.recentErrors?.map((error, index) => (
            <div key={index} className='error-item'>
              {error.error.message}
            </div>
          ))}
        </div>
        <div className='metric-card'>
          <h4>Error Distribution</h4>
          {Object.entries(metrics.errors.errorCounts || {}).map(([error, count]) => (
            <div key={error}>
              {error}: {count}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFeatureMetrics = () => (
    <div className='metrics-section'>
      <h3>Feature Usage</h3>
      <div className='metrics-grid'>
        <div className='metric-card'>
          <h4>Feature Adoption</h4>
          {Object.entries(metrics.features || {}).map(([feature, data]) => (
            <div key={feature}>
              {feature}: {data.totalUses} uses
            </div>
          ))}
        </div>
        <div className='metric-card'>
          <h4>Recent Activity</h4>
          {Object.entries(metrics.features || {}).map(([feature, data]) => (
            <div key={feature}>
              {feature} last used: {new Date(data.lastUsed).toLocaleString()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className='monitoring-dashboard'>
      <div className='dashboard-header'>
        <h2>Monitoring Dashboard</h2>
        <div className='refresh-control'>
          <label>
            Refresh Interval:
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={15000}>15s</option>
              <option value={30000}>30s</option>
            </select>
          </label>
        </div>
      </div>

      <div className='dashboard-tabs'>
        <button
          className={activeTab === 'performance' ? 'active' : ''}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={activeTab === 'errors' ? 'active' : ''}
          onClick={() => setActiveTab('errors')}
        >
          Errors
        </button>
        <button
          className={activeTab === 'features' ? 'active' : ''}
          onClick={() => setActiveTab('features')}
        >
          Features
        </button>
      </div>

      <div className='dashboard-content'>
        {activeTab === 'performance' && renderPerformanceMetrics()}
        {activeTab === 'errors' && renderErrorMetrics()}
        {activeTab === 'features' && renderFeatureMetrics()}
      </div>

      <style>{`
        .monitoring-dashboard {
          padding: 20px;
          background: #f5f5f5;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .dashboard-tabs {
          margin-bottom: 20px;
        }

        .dashboard-tabs button {
          padding: 10px 20px;
          margin-right: 10px;
          border: none;
          background: #fff;
          cursor: pointer;
        }

        .dashboard-tabs button.active {
          background: #007bff;
          color: white;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .metric-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .error-item {
          padding: 5px;
          margin: 5px 0;
          background: #fff3f3;
          border-left: 3px solid #ff4444;
        }
      `}</style>
    </div>
  );
}

export default MonitoringDashboard;
