/**
 * BrushBase - Generic brush base class
 * Provides common brush behavior: activation, cursor/pulse updates, type cycling,
 * cooldown handling, and default mouse handlers. Specific brushes should extend
 * this and implement performAction(x,y,button) to provide left-click behavior.
 */
class BrushBase {
  constructor() {
    this.isActive = false;
    this.brushSize = 30;
    this.spawnCooldown = 100; // ms between actions
    this.lastSpawnTime = 0;

    // Visual feedback
    this.cursorPosition = { x: 0, y: 0 };
    this.pulseAnimation = 0;
    this.pulseSpeed = 0.05;

    // Type/cycling support (subclasses should populate this.availableTypes)
    this.availableTypes = [];
    this.currentIndex = 0;
    this.currentType = this.availableTypes[0] || null;

    // Optional callback when type changes
    this.onTypeChanged = null;
  }

  toggle() {
    this.isActive = !this.isActive;
    return this.isActive;
  }

  cycleType() {
    // Default directional cycle: step is +1 (next) or -1 (previous)
    return this.cycleTypeStep(1);
  }

  /**
   * Cycle types by a step (positive or negative)
   * @param {number} step - integer step to cycle by (e.g., 1 or -1)
   * @returns {Object|null} new currentType or null
   */
  cycleTypeStep(step = 1) {
    if (!this.availableTypes || this.availableTypes.length === 0) return null;
    const len = this.availableTypes.length;
    // Normalize step to integer
    const s = Math.sign(step) * Math.abs(Math.round(step)) || 0;
    if (s === 0) return this.currentType;
    // Compute new index with wrap
    this.currentIndex = ((this.currentIndex + s) % len + len) % len;
    this.currentType = this.availableTypes[this.currentIndex];
    if (typeof this.onTypeChanged === 'function') {
      try { this.onTypeChanged(this.currentType); } catch (e) { /* ignore */ }
    }
    return this.currentType;
  }

  // Backwards-compatible alias: old code may call cycleType(step)
  cycleType = function(step) { return this.cycleTypeStep(step || 1); }

  setType(typeKey) {
    if (!this.availableTypes || this.availableTypes.length === 0) return null;
    const idx = this.availableTypes.findIndex(t => t.type === typeKey || t.name === typeKey);
    if (idx === -1) return null;
    this.currentIndex = idx;
    this.currentType = this.availableTypes[this.currentIndex];
    if (typeof this.onTypeChanged === 'function') {
      try { this.onTypeChanged(this.currentType); } catch (e) { /* ignore */ }
    }
    return this.currentType;
  }

  update() {
    if (!this.isActive) return;
    if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
      this.cursorPosition.x = mouseX;
      this.cursorPosition.y = mouseY;
    }
    this.pulseAnimation += this.pulseSpeed;
    if (this.pulseAnimation > Math.PI * 2) this.pulseAnimation = 0;
  }

  /**
   * Default mouse pressed handler. LEFT triggers performAction (if implemented),
   * RIGHT cycles types. Subclasses can override performAction(x,y,button).
   */
  onMousePressed(x, y, button) {
    if (!this.isActive) return false;
    if (button === 'LEFT') {
      if (typeof this.performAction === 'function') {
        this.performAction(x, y, button);
        return true;
      }
      return false;
    }
    if (button === 'RIGHT') {
      this.cycleType();
      return true;
    }
    return false;
  }

  onMouseReleased(x, y, button) {
    if (!this.isActive) return false;
    return false;
  }

  getDebugInfo() {
    return {
      isActive: this.isActive,
      brushSize: this.brushSize,
      spawnCooldown: this.spawnCooldown,
      availableTypes: (this.availableTypes || []).map(t => t.name || t.type || String(t)),
      currentType: this.currentType ? (this.currentType.name || this.currentType.type) : null
    };
  }
}



/**
 * BrushHandling
 * Basic pattern
 * Handle DraggablePanel mouse events
 *   if (window.{BRUSH}.isActive) {
 *   const handled = window.draggablePanelManager.handleMouseEvents(mouseX, mouseY, true);
 *   if (handled) return; }
 */
function brushHandling() {
      // Handle Enemy Ant Brush events
  if (window.g_enemyAntBrush.isActive) {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      const handled = window.g_enemyAntBrush.onMousePressed(mouseX, mouseY, buttonName);
      if (handled) return; // Brush consumed the event, don't process other mouse events
  }

  // Handle Resource Brush events
  if (window.g_resourceBrush.isActive) {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      const handled = window.g_resourceBrush.onMousePressed(mouseX, mouseY, buttonName);
      if (handled) return; // Brush consumed the event, don't process other mouse events
  }

  // Handle Building Brush events
  if (window.g_buildingBrush.isActive) {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      const handled = window.g_buildingBrush.onMousePressed(mouseX, mouseY, buttonName);
      if (handled) return; // Brush consumed the event, don't process other mouse events
  }

  // Handle Lightning Aim Brush events
  if (window.g_lightningAimBrush.isActive) {
    const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
    const handled = window.g_lightningAimBrush.onMousePressed(mouseX, mouseY, buttonName);
    if (handled) return; // Brush consumed the event, don't process other mouse events
  }

  // Handle Queen Control Panel right-click for power cycling
  if (window.g_queenControlPanel && mouseButton === RIGHT) {
    const handled = window.g_queenControlPanel.handleRightClick();
    if (handled) return; // Queen panel consumed the right-click
  }
}

// Export globals for convenience
if (typeof window !== 'undefined') {
  window.BrushBase = BrushBase;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BrushBase };
}