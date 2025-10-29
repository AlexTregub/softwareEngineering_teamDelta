/**
 * Middle-Click Pan Integration
 * 
 * Registers middle-click pan shortcuts with ShortcutManager and provides
 * event handler wrappers for sketch.js integration.
 * 
 * This module keeps sketch.js clean by encapsulating all pan-related
 * shortcut registration and event handling.
 * 
 * Usage in sketch.js:
 * 
 * function mousePressed() {
 *   if (mouseButton === CENTER) {
 *     if (MiddleClickPan.handlePress()) return;
 *   }
 *   // ... rest of mousePressed logic
 * }
 * 
 * function mouseDragged() {
 *   if (mouseButton === CENTER) {
 *     if (MiddleClickPan.handleDrag()) return;
 *   }
 *   // ... rest of mouseDragged logic
 * }
 * 
 * function mouseReleased() {
 *   if (mouseButton === CENTER) {
 *     if (MiddleClickPan.handleRelease()) return;
 *   }
 *   // ... rest of mouseReleased logic
 * }
 */

class MiddleClickPan {
  /**
   * Initialize and register middle-click pan shortcuts
   * Call this once in setup() or after ShortcutManager is loaded
   */
  static initialize() {
    // Register press (start pan)
    ShortcutManager.register({
      id: 'camera-pan-start',
      trigger: { event: 'middleclick', action: 'press' },
      action: (context) => {
        context.startPan(mouseX, mouseY);
      }
    });
    
    // Register drag (update pan)
    ShortcutManager.register({
      id: 'camera-pan-update',
      trigger: { event: 'middleclick', action: 'drag' },
      action: (context) => {
        context.updatePan(mouseX, mouseY);
      }
    });
    
    // Register release (end pan)
    ShortcutManager.register({
      id: 'camera-pan-end',
      trigger: { event: 'middleclick', action: 'release' },
      action: (context) => {
        context.endPan();
      }
    });
  }
  
  /**
   * Get shortcut context with camera pan methods
   * @returns {Object} Context object for shortcut actions
   */
  static _getContext() {
    return {
      startPan: (x, y) => {
        if (typeof cameraManager !== 'undefined' && cameraManager) {
          cameraManager.startPan(x, y);
        }
      },
      updatePan: (x, y) => {
        if (typeof cameraManager !== 'undefined' && cameraManager) {
          cameraManager.updatePan(x, y);
        }
      },
      endPan: () => {
        if (typeof cameraManager !== 'undefined' && cameraManager) {
          cameraManager.endPan();
        }
      }
    };
  }
  
  /**
   * Get current modifier key states
   * @returns {Object} Modifier states { shift, ctrl, alt }
   */
  static _getModifiers() {
    return {
      shift: typeof keyIsDown === 'function' ? keyIsDown(SHIFT) : false,
      ctrl: typeof keyIsDown === 'function' ? keyIsDown(CONTROL) : false,
      alt: typeof keyIsDown === 'function' ? keyIsDown(ALT) : false
    };
  }
  
  /**
   * Handle middle-click press event
   * Call this from mousePressed() when mouseButton === CENTER
   * @returns {boolean} True if handled, false otherwise
   */
  static handlePress() {
    if (typeof ShortcutManager === 'undefined') return false;
    
    const modifiers = this._getModifiers();
    const context = this._getContext();
    
    return ShortcutManager.handleMiddleClick('press', modifiers, context);
  }
  
  /**
   * Handle middle-click drag event
   * Call this from mouseDragged() when mouseButton === CENTER
   * @returns {boolean} True if handled, false otherwise
   */
  static handleDrag() {
    if (typeof ShortcutManager === 'undefined') return false;
    
    const modifiers = this._getModifiers();
    const context = this._getContext();
    
    return ShortcutManager.handleMiddleClick('drag', modifiers, context);
  }
  
  /**
   * Handle middle-click release event
   * Call this from mouseReleased() when mouseButton === CENTER
   * @returns {boolean} True if handled, false otherwise
   */
  static handleRelease() {
    if (typeof ShortcutManager === 'undefined') return false;
    
    const modifiers = this._getModifiers();
    const context = this._getContext();
    
    return ShortcutManager.handleMiddleClick('release', modifiers, context);
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.MiddleClickPan = MiddleClickPan;
}

// Module export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MiddleClickPan;
}
