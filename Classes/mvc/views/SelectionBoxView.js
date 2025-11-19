/**
 * SelectionBoxView
 * =================
 * Presentation layer for drag selection box.
 * 
 * RESPONSIBILITIES:
 * - Render selection box rectangle
 * - Render corner indicators
 * - Apply colors and transparency
 * - Register itself with RenderLayerManager via signals
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
    
    // Get EventManager instance for rendering registration
    this._eventBus = typeof EventManager !== 'undefined' ? EventManager.getInstance() : null;
    
    // Register with RenderLayerManager via event signal
    this._registerWithRenderer();
  }

  /**
   * Register this view with RenderLayerManager via event signal
   * Views are responsible for their own rendering registration
   * @private
   */
  _registerWithRenderer() {
    if (!this._eventBus || typeof EntityEvents === 'undefined') {
      console.warn('SelectionBoxView: Cannot register - EventManager or EntityEvents not available');
      return;
    }

    this._eventBus.emit(EntityEvents.RENDER_REGISTER_DRAWABLE, {
      layer: 'ui_game', // RenderManager.layers.UI_GAME
      drawFn: this.render.bind(this),
      id: 'selection-box-view'
    });
  }

  /**
   * Unregister from RenderLayerManager
   * Called when view is destroyed
   */
  destroy() {
    if (this._eventBus && typeof EntityEvents !== 'undefined') {
      this._eventBus.emit(EntityEvents.RENDER_UNREGISTER_DRAWABLE, {
        id: 'selection-box-view'
      });
    }
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
    const { fillColor, fillAlpha, strokeColor, strokeAlpha, strokeWeight: weight } = colors;

    // Fill
    if (typeof fill !== 'undefined') fill(fillColor.r, fillColor.g, fillColor.b, fillAlpha);

    // Stroke
    if (typeof stroke !== 'undefined') stroke(strokeColor.r, strokeColor.g, strokeColor.b, strokeAlpha);
    if (typeof strokeWeight !== 'undefined') strokeWeight(weight);

    // Draw rectangle
    if (typeof rectMode !== 'undefined') rectMode(CORNER);
    if (typeof rect !== 'undefined') rect(bounds.minX, bounds.minY, bounds.width, bounds.height);
  }

  /**
   * Render corner indicators
   * @param {Object} bounds - Box bounds
   * @param {Object} colors - Color configuration
   * @private
   */
  _renderCorners(bounds, colors) {
    const { cornerSize, cornerColor, cornerAlpha, strokeWeight: weight } = colors;

    if (typeof stroke !== 'undefined') stroke(cornerColor.r, cornerColor.g, cornerColor.b, cornerAlpha);
    if (typeof strokeWeight !== 'undefined') strokeWeight(weight + 1);
    if (typeof noFill !== 'undefined') noFill();

    // Top-left corner
    if (typeof line !== 'undefined') {
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
