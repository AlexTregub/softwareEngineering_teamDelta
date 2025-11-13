/**
 * EventFlag - Represents a spatial trigger for events in the Level Editor
 * Placed on the map to trigger events when entities enter the radius
 */
class EventFlag {
  constructor(config) {
    this.id = config.id || `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.radius = config.radius || 64;
    this.eventId = config.eventId || null;
    this.visualStyle = config.visualStyle || 'default';
    this.oneTime = config.oneTime !== false;
    this.metadata = config.metadata || {};
    this.triggered = false;
  }
  
  /**
   * Check if a point is within the trigger radius
   */
  containsPoint(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }
  
  /**
   * Render the flag (in editor mode - visible; in game mode - invisible)
   */
  render(editorMode = false) {
    if (!editorMode) return;
    
    push();
    // Draw trigger radius
    noFill();
    stroke(255, 165, 0, 100);
    strokeWeight(2);
    circle(this.x, this.y, this.radius * 2);
    
    // Draw flag icon
    fill(255, 165, 0);
    noStroke();
    circle(this.x, this.y, 12);
    
    // Draw flag pole
    stroke(255, 165, 0);
    strokeWeight(2);
    line(this.x, this.y, this.x, this.y - 20);
    
    // Draw flag
    fill(255, 0, 0);
    triangle(
      this.x, this.y - 20,
      this.x + 15, this.y - 15,
      this.x, this.y - 10
    );
    pop();
  }
  
  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      radius: this.radius,
      eventId: this.eventId,
      visualStyle: this.visualStyle,
      oneTime: this.oneTime,
      metadata: this.metadata
    };
  }
  
  /**
   * Deserialize from JSON
   */
  static fromJSON(data) {
    return new EventFlag(data);
  }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventFlag;
}
if (typeof window !== 'undefined') {
  window.EventFlag = EventFlag;
}
