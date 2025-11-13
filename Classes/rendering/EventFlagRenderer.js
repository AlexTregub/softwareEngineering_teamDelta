/**
 * EventFlagRenderer - Visual representation of event triggers on game map
 * 
 * Renders spatial event triggers as flag icons with radius circles.
 * Provides click-to-edit functionality for Level Editor.
 * 
 * Features:
 * - Flag icon rendering (emoji 🚩 at trigger position)
 * - Trigger radius circle (yellow, semi-transparent)
 * - Event ID labels (above flag)
 * - Camera transform integration (world coords → screen coords)
 * - Click hit test (detect flag clicks for editing)
 * 
 * Following TDD: Implementation written to pass integration tests.
 * 
 * @class EventFlagRenderer
 */

class EventFlagRenderer {
  constructor() {
    this._flagIconRadius = 16; // Radius for click detection (px)
    
    // Auto-register with RenderManager EFFECTS layer
    if (typeof RenderManager !== 'undefined' && RenderManager.layers) {
      RenderManager.addDrawableToLayer(RenderManager.layers.EFFECTS, () => {
        // Rendering will be called externally via renderEventFlags()
        // This registration ensures proper layer ordering
      });
    }
  }
  
  /**
   * Render all spatial event triggers as flags on the map
   * @param {Object} cameraManager - CameraManager for coordinate transforms
   */
  renderEventFlags(cameraManager) {
    // Get EventManager instance
    const eventManager = (typeof window !== 'undefined' && window.eventManager) || 
                         (typeof global !== 'undefined' && global.eventManager);
    
    if (!eventManager || !eventManager.triggers) {
      return; // No EventManager or triggers available
    }
    
    // Check if EventPropertyWindow is open with a trigger being edited
    const levelEditor = (typeof window !== 'undefined' && window.levelEditor) || 
                        (typeof global !== 'undefined' && global.levelEditor);
    const propertyWindow = levelEditor ? levelEditor.eventPropertyWindow : null;
    const isEditingTrigger = propertyWindow && propertyWindow.isVisible && propertyWindow.editForm;
    
    // Iterate all triggers and render spatial ones
    for (const [triggerId, trigger] of eventManager.triggers) {
      // Only render spatial triggers (have x, y, radius)
      if (trigger.type !== 'spatial' || !trigger.condition) {
        continue;
      }
      
      const { x, y, radius } = trigger.condition;
      
      // Skip if missing spatial data
      if (x === undefined || y === undefined || radius === undefined) {
        continue;
      }
      
      // Transform world coordinates to screen coordinates
      const screenPos = cameraManager.worldToScreen(x, y);
      
      // Check if this trigger is being edited in property window
      const isBeingEdited = isEditingTrigger && propertyWindow.trigger && propertyWindow.trigger.id === trigger.id;
      
      if (isBeingEdited && propertyWindow.editForm.condition && propertyWindow.editForm.condition.radius > 0) {
        // EDITING MODE: Render both saved (dashed yellow) and preview (solid orange) radius
        
        // 1. Render saved radius (yellow dashed circle for comparison)
        push();
        noFill(); // No fill for saved radius (just outline)
        stroke(255, 255, 0, 50); // Yellow border, faded
        strokeWeight(2);
        
        // Set dashed line style
        if (drawingContext && drawingContext.setLineDash) {
          drawingContext.setLineDash([10, 5]); // 10px dash, 5px gap
        }
        
        ellipse(screenPos.x, screenPos.y, radius * 2, radius * 2); // Saved diameter
        
        // Reset line dash
        if (drawingContext && drawingContext.setLineDash) {
          drawingContext.setLineDash([]);
        }
        pop();
        
        // 2. Render preview radius (orange solid circle)
        const previewRadius = propertyWindow.editForm.condition.radius;
        push();
        fill(255, 165, 0, 80); // Orange with alpha (solid)
        stroke(255, 165, 0, 150); // Orange border
        strokeWeight(2);
        ellipse(screenPos.x, screenPos.y, previewRadius * 2, previewRadius * 2); // Preview diameter
        pop();
        
        // 3. Render preview label
        push();
        textAlign(CENTER, TOP);
        textSize(12);
        fill(255); // White text
        stroke(0); // Black outline
        strokeWeight(1);
        text(`Preview: ${previewRadius}px`, screenPos.x, screenPos.y + Math.max(radius, previewRadius) + 10);
        pop();
      } else {
        // NORMAL MODE: Render saved radius only (yellow, semi-transparent)
        push();
        fill(255, 255, 0, 60); // Yellow with alpha
        stroke(255, 255, 0, 150); // Yellow border
        strokeWeight(2);
        ellipse(screenPos.x, screenPos.y, radius * 2, radius * 2); // Diameter = radius * 2
        pop();
      }
      
      // Render flag icon (emoji 🚩) - always render
      push();
      textAlign(CENTER, CENTER);
      textSize(24); // Flag emoji size
      fill(255, 0, 0); // Red text color (fallback if emoji not supported)
      text('🚩', screenPos.x, screenPos.y);
      pop();
      
      // Render event ID label above flag - always render
      push();
      textAlign(CENTER, BOTTOM);
      textSize(12); // Small label text
      fill(255); // White text
      stroke(0); // Black outline for visibility
      strokeWeight(1);
      text(trigger.eventId, screenPos.x, screenPos.y - 20); // 20px above flag
      pop();
    }
  }
  
  /**
   * Check if mouse click hit a flag icon (for editing)
   * @param {number} mouseX - Screen X coordinate
   * @param {number} mouseY - Screen Y coordinate
   * @param {Object} cameraManager - CameraManager for coordinate transforms
   * @returns {Object|null} - Trigger object if hit, null otherwise
   */
  checkFlagClick(mouseX, mouseY, cameraManager) {
    // Get EventManager instance
    const eventManager = (typeof window !== 'undefined' && window.eventManager) || 
                         (typeof global !== 'undefined' && global.eventManager);
    
    if (!eventManager || !eventManager.triggers) {
      return null;
    }
    
    // Convert screen coordinates to world coordinates
    const worldPos = cameraManager.screenToWorld(mouseX, mouseY);
    
    // Check all spatial triggers
    for (const [triggerId, trigger] of eventManager.triggers) {
      if (trigger.type !== 'spatial' || !trigger.condition) {
        continue;
      }
      
      const { x, y } = trigger.condition;
      
      // Skip if missing spatial data
      if (x === undefined || y === undefined) {
        continue;
      }
      
      // Calculate distance between click and flag position
      const distance = Math.sqrt(
        Math.pow(worldPos.x - x, 2) + Math.pow(worldPos.y - y, 2)
      );
      
      // Check if click is within flag icon radius
      if (distance <= this._flagIconRadius) {
        return trigger; // Return trigger object for editing
      }
    }
    
    return null; // No flag hit
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventFlagRenderer;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.EventFlagRenderer = EventFlagRenderer;
}

// Export for Node.js global (testing compatibility)
if (typeof global !== 'undefined') {
  global.EventFlagRenderer = EventFlagRenderer;
}
