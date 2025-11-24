/**
 * p5EventHandlers.js
 * ==================
 * Additional p5.js lifecycle event handlers.
 * Handles window resizing and other p5.js events that don't fit in mouse/keyboard categories.
 */

/**
 * windowResized
 * -------------
 * Called automatically by p5.js when the browser window is resized.
 * Updates canvas size, map conversions, and invalidates terrain cache.
 */
function windowResized() {
  if (g_activeMap && g_activeMap.renderConversion) {
    g_activeMap.renderConversion.setCanvasSize([windowWidth, windowHeight]);
  }
  g_canvasX = windowWidth;
  g_canvasY = windowHeight;

  g_activeMap.invalidateCache();

  resizeCanvas(g_canvasX, g_canvasY);
}
