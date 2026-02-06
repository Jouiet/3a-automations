/**
 * 3A A/B Testing Framework v1.0
 * Lightweight client-side experiment runner with GA4 tracking.
 * Usage: ABTest.run('experiment-name', { A: fn, B: fn })
 */
var ABTest = (function () {
  'use strict';
  var STORAGE_KEY = '3a_ab_tests';
  var tracked = {};

  function getAssignments() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveAssignments(assignments) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
    } catch (e) { /* quota exceeded, silent */ }
  }

  function assign(experimentId, variants) {
    var assignments = getAssignments();
    if (assignments[experimentId] && variants.indexOf(assignments[experimentId]) !== -1) {
      return assignments[experimentId];
    }
    var variant = variants[Math.floor(Math.random() * variants.length)];
    assignments[experimentId] = variant;
    saveAssignments(assignments);
    return variant;
  }

  function trackExposure(experimentId, variant) {
    if (tracked[experimentId]) return;
    tracked[experimentId] = true;
    if (typeof gtag === 'function') {
      gtag('event', 'ab_test_exposure', {
        experiment_id: experimentId,
        variant: variant,
        page_path: location.pathname
      });
    }
  }

  function trackConversion(experimentId, action) {
    var assignments = getAssignments();
    var variant = assignments[experimentId];
    if (!variant) return;
    if (typeof gtag === 'function') {
      gtag('event', 'ab_test_conversion', {
        experiment_id: experimentId,
        variant: variant,
        action: action || 'click',
        page_path: location.pathname
      });
    }
  }

  /**
   * Run an A/B test.
   * @param {string} experimentId - Unique experiment name
   * @param {Object} handlers - { A: function, B: function } variant handlers
   */
  function run(experimentId, handlers) {
    var variants = Object.keys(handlers);
    if (variants.length < 2) return;
    var variant = assign(experimentId, variants);
    trackExposure(experimentId, variant);
    if (typeof handlers[variant] === 'function') {
      handlers[variant]();
    }
    return variant;
  }

  /**
   * Get the current variant for an experiment (without running it).
   */
  function getVariant(experimentId) {
    return getAssignments()[experimentId] || null;
  }

  return {
    run: run,
    getVariant: getVariant,
    trackConversion: trackConversion
  };
})();
