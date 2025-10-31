/**
 * ToastNotification - User Feedback System
 * 
 * Provides temporary notification toasts for user actions:
 * - Success messages (green) - "Custom entity saved!"
 * - Error messages (red) - "Name cannot be empty"
 * - Info messages (blue) - "Entity deleted"
 * - Warning messages (yellow) - "LocalStorage quota exceeded"
 * 
 * Features:
 * - Auto-dismiss after timeout (default 3000ms)
 * - Manual dismiss by clicking toast
 * - Stack multiple toasts (max 5 visible)
 * - Icons for each type
 * - Positioned top-right corner
 * 
 * Usage:
 *   const toast = new ToastNotification();
 *   toast.show('Custom entity saved!', 'success');
 *   toast.show('Error occurred', 'error', 5000); // Custom duration
 *   toast.render(); // In draw() loop
 *   toast.update(); // In draw() loop for auto-dismiss
 *   toast.handleClick(mouseX, mouseY); // In mousePressed()
 */

class ToastNotification {
  constructor() {
    this.toasts = [];
    this.maxVisible = 5;
    this.defaultDuration = 3000; // 3 seconds
    
    // Type configurations
    this.typeConfig = {
      success: {
        icon: '✓',
        color: { r: 40, g: 167, b: 69 } // Green
      },
      error: {
        icon: '✗',
        color: { r: 220, g: 53, b: 69 } // Red
      },
      info: {
        icon: 'ℹ',
        color: { r: 13, g: 110, b: 253 } // Blue
      },
      warning: {
        icon: '⚠',
        color: { r: 255, g: 193, b: 7 } // Yellow
      }
    };
  }
  
  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {string} type - 'success', 'error', 'info', or 'warning' (default: 'info')
   * @param {number} duration - Duration in ms (default: 3000, 0 = persistent)
   */
  show(message, type = 'info', duration = null) {
    // Validate and normalize type
    if (!this.typeConfig[type]) {
      type = 'info';
    }
    
    // Validate duration
    if (duration === null) {
      duration = this.defaultDuration;
    } else if (duration < 0) {
      duration = this.defaultDuration;
    }
    
    const toast = {
      id: this._generateId(),
      message: message,
      type: type,
      icon: this.typeConfig[type].icon,
      color: this.typeConfig[type].color,
      timestamp: Date.now(),
      duration: duration,
      x: 0,
      y: 0,
      width: 250,
      height: 60
    };
    
    this.toasts.push(toast);
    
    // Limit to max visible
    if (this.toasts.length > this.maxVisible) {
      this.toasts.shift(); // Remove oldest
    }
  }
  
  /**
   * Update toasts (check for auto-dismiss)
   * Call this in draw() loop
   */
  update() {
    const now = Date.now();
    
    // Remove expired toasts
    this.toasts = this.toasts.filter(toast => {
      if (toast.duration === 0) return true; // Persistent
      return (now - toast.timestamp) < toast.duration;
    });
  }
  
  /**
   * Manually dismiss a toast by ID
   * @param {string} toastId - The toast ID
   */
  dismiss(toastId) {
    this.toasts = this.toasts.filter(toast => toast.id !== toastId);
  }
  
  /**
   * Clear all toasts
   */
  clearAll() {
    this.toasts = [];
  }
  
  /**
   * Render toasts (top-right corner, stacked vertically)
   * Call this in draw() loop
   */
  render() {
    if (this.toasts.length === 0) return;
    
    push();
    
    const padding = 20;
    const spacing = 10;
    let yOffset = padding;
    
    this.toasts.forEach(toast => {
      const x = (typeof width !== 'undefined' ? width : 1920) - toast.width - padding;
      const y = yOffset;
      
      // Update position for click detection
      toast.x = x;
      toast.y = y;
      
      // Background
      fill(toast.color.r, toast.color.g, toast.color.b, 200);
      noStroke();
      rect(x, y, toast.width, toast.height, 8);
      
      // Icon
      fill(255);
      textSize(24);
      textAlign(LEFT, CENTER);
      text(toast.icon, x + 15, y + toast.height / 2);
      
      // Message
      textSize(14);
      text(toast.message, x + 50, y + toast.height / 2);
      
      // Close button (X)
      textSize(16);
      textAlign(RIGHT, CENTER);
      fill(255, 200);
      text('×', x + toast.width - 10, y + toast.height / 2);
      
      yOffset += toast.height + spacing;
    });
    
    pop();
  }
  
  /**
   * Handle click on toasts
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @returns {boolean} - True if a toast was clicked
   */
  handleClick(mouseX, mouseY) {
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      const toast = this.toasts[i];
      
      if (mouseX >= toast.x && 
          mouseX <= toast.x + toast.width &&
          mouseY >= toast.y && 
          mouseY <= toast.y + toast.height) {
        this.dismiss(toast.id);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Generate unique ID for toast
   * @returns {string} - Unique ID
   * @private
   */
  _generateId() {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToastNotification;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.ToastNotification = ToastNotification;
}
