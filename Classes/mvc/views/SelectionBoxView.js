/**
 * SelectionBoxView
 * =================
 * Presentation layer for drag selection box.
 * 
 * RESPONSIBILITIES:
 * - Render selection box rectangle
 * - Render corner indicators
 * - Apply colors and transparency
 * - NO state mutations
 * - NO update logic
 */

class SelectionBoxView {
  /**
   * Create a selection box view
   * @param {SelectionBoxModel} model - The data model to visualize
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Render the selection box
   */
  render() {
    if (!this.model.shouldRender()) {
      return;
    }

    const bounds = this.model.getBounds();
    const colors = this.model.getColors();

    push();

    // Draw main box
    this._renderBox(bounds, colors);

    // Draw corner indicators
    this._renderCorners(bounds, colors);

    pop();
  }

  /**
   * Render the main selection box rectangle
   * @param {Object} bounds - Box bounds
   * @param {Object} colors - Color configuration
   * @private
   */
  _renderBox(bounds, colors) {
    const { fillColor, fillAlpha, strokeColor, strokeAlpha, strokeWeight } = colors;

    // Fill
    fill(fillColor.r, fillColor.g, fillColor.b, fillAlpha);

    // Stroke
    stroke(strokeColor.r, strokeColor.g, strokeColor.b, strokeAlpha);
    strokeWeight(strokeWeight);

    // Draw rectangle
    rectMode(CORNER);
    rect(bounds.minX, bounds.minY, bounds.width, bounds.height);
  }

  /**
   * Render corner indicators
   * @param {Object} bounds - Box bounds
   * @param {Object} colors - Color configuration
   * @private
   */
  _renderCorners(bounds, colors) {
    const { cornerSize, cornerColor, cornerAlpha, strokeWeight } = colors;

    stroke(cornerColor.r, cornerColor.g, cornerColor.b, cornerAlpha);
    strokeWeight(strokeWeight + 1);
    noFill();

    // Top-left corner
    line(bounds.minX, bounds.minY, bounds.minX + cornerSize, bounds.minY);
    line(bounds.minX, bounds.minY, bounds.minX, bounds.minY + cornerSize);

    // Top-right corner
    line(bounds.maxX, bounds.minY, bounds.maxX - cornerSize, bounds.minY);
    line(bounds.maxX, bounds.minY, bounds.maxX, bounds.minY + cornerSize);

    // Bottom-left corner
    line(bounds.minX, bounds.maxY, bounds.minX + cornerSize, bounds.maxY);
    line(bounds.minX, bounds.maxY, bounds.minX, bounds.maxY - cornerSize);

    // Bottom-right corner
    line(bounds.maxX, bounds.maxY, bounds.maxX - cornerSize, bounds.maxY);
    line(bounds.maxX, bounds.maxY, bounds.maxX, bounds.maxY - cornerSize);
  }

  /**
   * Render debug information
   */
  renderDebug() {
    if (!this.model.shouldRender()) {
      return;
    }

    const bounds = this.model.getBounds();
    const worldBounds = this.model.getWorldBounds();

    push();
    fill(255);
    noStroke();
    textSize(10);
    textAlign(LEFT, TOP);

    const debugText = [
      `Screen: ${Math.round(bounds.minX)},${Math.round(bounds.minY)} → ${Math.round(bounds.maxX)},${Math.round(bounds.maxY)}`,
      `World: ${Math.round(worldBounds.minX)},${Math.round(worldBounds.minY)} → ${Math.round(worldBounds.maxX)},${Math.round(worldBounds.maxY)}`,
      `Size: ${Math.round(bounds.width)} x ${Math.round(bounds.height)}`
    ];

    let y = bounds.minY - 40;
    debugText.forEach(text => {
      text(text, bounds.minX, y);
      y += 12;
    });

    pop();
  }
}

// ===== EXPORTS =====
if (typeof window !== 'undefined') {
  window.SelectionBoxView = SelectionBoxView;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SelectionBoxView;
}
