class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Set();
  }

  trackMetric(name, value) {
    this.metrics.set(name, value);
    this.notifyObservers({ name, value });
  }

  addObserver(observer) {
    this.observers.add(observer);
  }

  removeObserver(observer) {
    this.observers.delete(observer);
  }

  notifyObservers(metric) {
    this.observers.forEach((observer) => observer(metric));
  }

  getMetric(name) {
    return this.metrics.get(name);
  }

  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  reset() {
    this.metrics.clear();
    this.observers.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();
