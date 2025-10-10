/**
 * Global Tooltip Integration
 * Provides global functions to integrate the new TooltipController system
 * with the existing game rendering pipeline
 */

/**
 * Render all active tooltips
 * Call this in your main rendering loop
 */
function renderTooltips() {
  TooltipController.renderCurrentTooltip();
}

/**
 * Hide all tooltips
 * Useful for state transitions or when tooltips should be cleared
 */
function hideAllTooltips() {
  TooltipController.hideCurrentTooltip();
}

/**
 * Legacy compatibility function - now uses TooltipController
 * @deprecated Use TooltipController.hideCurrentTooltip() instead
 */
function hideEntityTooltip() {
  TooltipController.hideCurrentTooltip();
}

/**
 * Initialize tooltip system (no longer needed but kept for compatibility)
 * @deprecated Tooltips are now automatically initialized with entities
 */
function initializeEntityTooltips() {
  console.log('🔧 TooltipController system is ready (auto-initialized)');
  return true;
}

/**
 * Check if tooltips are enabled globally
 * @returns {boolean} Always true - individual entities control their own tooltips
 */
function areEntityTooltipsEnabled() {
  return true;
}

/**
 * Legacy update function - no longer needed
 * @deprecated Tooltips now update automatically via entity controllers
 */
function updateEntityTooltips() {
  // No-op - tooltips update automatically
}

/**
 * Legacy render function - now calls renderTooltips()
 * @deprecated Use renderTooltips() instead
 */
function renderEntityTooltips() {
  renderTooltips();
}

// Make functions globally available
if (typeof window !== 'undefined') {
  window.renderTooltips = renderTooltips;
  window.hideAllTooltips = hideAllTooltips;
  
  // Legacy compatibility
  window.hideEntityTooltip = hideEntityTooltip;
  window.initializeEntityTooltips = initializeEntityTooltips;
  window.areEntityTooltipsEnabled = areEntityTooltipsEnabled;
  window.updateEntityTooltips = updateEntityTooltips;
  window.renderEntityTooltips = renderEntityTooltips;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderTooltips,
    hideAllTooltips,
    hideEntityTooltip,
    initializeEntityTooltips,
    areEntityTooltipsEnabled,
    updateEntityTooltips,
    renderEntityTooltips
  };
}