/**
 * @fileoverview Button class for creating interactive UI buttons
 * Provides customizable buttons with captions, colors, and click handling.
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Creates interactive buttons with customizable appearance and behavior.
 * Supports hover effects, click handling, and dynamic styling.
 * 
 * @class Button
 */
class Button {
  /**
   * Creates a new Button instance.
   * 
   * @param {number} x - X position of the button
   * @param {number} y - Y position of the button
   * @param {number} width - Width of the button
   * @param {number} height - Height of the button
   * @param {string} caption - Text to display on the button
   * @param {Object} [options={}] - Optional configuration
   * @param {string} [options.backgroundColor='#4CAF50'] - Button background color
   * @param {string} [options.hoverColor='#45a049'] - Color when hovering
   * @param {string} [options.textColor='white'] - Text color
   * @param {string} [options.borderColor='#333'] - Border color
   * @param {number} [options.borderWidth=2] - Border thickness
   * @param {number} [options.cornerRadius=5] - Corner rounding radius
   * @param {string} [options.fontFamily='Arial'] - Font family for text
   * @param {number} [options.fontSize=16] - Font size for text
   * @param {Function} [options.onClick=null] - Click handler function
   * @param {boolean} [options.enabled=true] - Whether button is clickable
   */
  constructor(x, y, width, height, caption, options = {}) {
    // Position and dimensions using CollisionBox2D
    this.bounds = new CollisionBox2D(x, y, width, height);
    this.caption = caption;
    
    // Style options with defaults
    this.backgroundColor = options.backgroundColor || '#4CAF50';
    this.hoverColor = options.hoverColor || '#45a049';
    this.textColor = options.textColor || 'white';
    this.borderColor = options.borderColor || '#333';
    this.borderWidth = options.borderWidth || 2;
    this.cornerRadius = options.cornerRadius || 5;
    this.fontFamily = options.fontFamily || 'Arial';
    this.fontSize = options.fontSize || 16;
    
    // Interaction
    this.onClick = options.onClick || null;
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    
    // State tracking
    this.isHovered = false;
    this.isPressed = false;
    this.wasClicked = false;
  }

  // Getter properties for accessing bounds
  get x() { return this.bounds.x; }
  get y() { return this.bounds.y; }
  get width() { return this.bounds.width; }
  get height() { return this.bounds.height; }

  /**
   * Updates the button state based on mouse interaction.
   * Should be called each frame before render.
   * 
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position
   * @param {boolean} isMousePressed - Whether mouse button is currently pressed
   */
  update(mouseX, mouseY, isMousePressed) {
    if (!this.enabled) {
      this.isHovered = false;
      this.isPressed = false;
      return;
    }

    // Check if mouse is over button
    const wasHovered = this.isHovered;
    this.isHovered = this.isMouseOver(mouseX, mouseY);
    
    // Handle mouse press/release
    if (this.isHovered && isMousePressed && !this.isPressed) {
      this.isPressed = true;
    } else if (!isMousePressed && this.isPressed) {
      // Mouse released
      if (this.isHovered) {
        this.wasClicked = true;
        if (this.onClick && typeof this.onClick === 'function') {
          this.onClick(this);
        }
      }
      this.isPressed = false;
    }
  }

  /**
   * Checks if the mouse is currently over the button.
   * 
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @returns {boolean} True if mouse is over button
   */
  isMouseOver(mouseX, mouseY) {
    return this.bounds.contains(mouseX, mouseY);
  }

  /**
   * Renders the button to the canvas.
   * Uses p5.js drawing functions for rendering.
   */
  render() {
    if (typeof push === 'undefined') {
      console.warn('Button: p5.js drawing functions not available');
      return;
    }

    push();
    
    // Determine current color based on state
    let currentBgColor = this.backgroundColor;
    if (!this.enabled) {
      currentBgColor = '#cccccc'; // Gray for disabled
    } else if (this.isPressed) {
      currentBgColor = this.darkenColor(this.hoverColor, 0.2);
    } else if (this.isHovered) {
      currentBgColor = this.hoverColor;
    }

    // Draw button background
    fill(currentBgColor);
    stroke(this.borderColor);
    strokeWeight(this.borderWidth);
    
    if (this.cornerRadius > 0) {
      rect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, this.cornerRadius);
    } else {
      rect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
    }

    // Draw button text
    fill(this.enabled ? this.textColor : '#666666');
    noStroke();
    textAlign(CENTER, CENTER);
    textFont(this.fontFamily);
    textSize(this.fontSize);
    
    const center = this.bounds.getCenter();
    const textX = center.x;
    const textY = center.y;
    text(this.caption, textX, textY);
    
    pop();
  }

  /**
   * Sets the button's background color.
   * 
   * @param {string} color - New background color (hex, rgb, or named color)
   */
  setBackgroundColor(color) {
    this.backgroundColor = color;
  }

  /**
   * Sets the button's hover color.
   * 
   * @param {string} color - New hover color (hex, rgb, or named color)
   */
  setHoverColor(color) {
    this.hoverColor = color;
  }

  /**
   * Sets the button's text color.
   * 
   * @param {string} color - New text color (hex, rgb, or named color)
   */
  setTextColor(color) {
    this.textColor = color;
  }

  /**
   * Sets the button's caption text.
   * 
   * @param {string} newCaption - New caption text
   */
  setCaption(newCaption) {
    this.caption = newCaption;
  }

  /**
   * Sets the button's position.
   * 
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  setPosition(x, y) {
    this.bounds.x = x;
    this.bounds.y = y;
  }

  /**
   * Sets the button's size.
   * 
   * @param {number} width - New width
   * @param {number} height - New height
   */
  setSize(width, height) {
    this.bounds.width = width;
    this.bounds.height = height;
  }

  /**
   * Enables or disables the button.
   * 
   * @param {boolean} enabled - Whether button should be enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.isHovered = false;
      this.isPressed = false;
    }
  }

  /**
   * Sets the click handler function.
   * 
   * @param {Function} handler - Function to call when button is clicked
   */
  setOnClick(handler) {
    this.onClick = handler;
  }

  /**
   * Checks if the button was clicked this frame and resets the flag.
   * 
   * @returns {boolean} True if button was clicked this frame
   */
  wasClickedThisFrame() {
    const clicked = this.wasClicked;
    this.wasClicked = false;
    return clicked;
  }

  /**
   * Darkens a color by a specified amount.
   * 
   * @param {string} color - Color to darken (hex format)
   * @param {number} amount - Amount to darken (0-1)
   * @returns {string} Darkened color in hex format
   * @private
   */
  darkenColor(color, amount) {
    // Simple color darkening for hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const num = parseInt(hex, 16);
      const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
      const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - amount)));
      const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - amount)));
      return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }
    return color; // Return original if not hex
  }

  /**
   * Gets the button's current bounds.
   * 
   * @returns {Object} Object with x, y, width, height properties
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  /**
   * Gets debug information about the button state.
   * 
   * @returns {Object} Debug information object
   */
  getDebugInfo() {
    return {
      position: { x: this.x, y: this.y },
      size: { width: this.width, height: this.height },
      caption: this.caption,
      enabled: this.enabled,
      isHovered: this.isHovered,
      isPressed: this.isPressed,
      colors: {
        background: this.backgroundColor,
        hover: this.hoverColor,
        text: this.textColor,
        border: this.borderColor
      }
    };
  }
}

// Button factory function with predefined styles
function createMenuButton(x, y, width, height, caption, style = 'default', clickHandler = null) {
  const styles = {
    default: {
      backgroundColor: '#2196F3',
      hoverColor: '#1976D2',
      textColor: 'white',
      borderColor: '#0D47A1'
    },
    success: {
      backgroundColor: '#4CAF50',
      hoverColor: '#45a049',
      textColor: 'white',
      borderColor: '#2E7D32'
    },
    warning: {
      backgroundColor: '#FF9800',
      hoverColor: '#F57C00',
      textColor: 'white',
      borderColor: '#E65100'
    },
    danger: {
      backgroundColor: '#F44336',
      hoverColor: '#D32F2F',
      textColor: 'white',
      borderColor: '#B71C1C'
    },
    purple: {
      backgroundColor: '#9C27B0',
      hoverColor: '#7B1FA2',
      textColor: 'white',
      borderColor: '#4A148C'
    }
  };

  const buttonStyle = {
    ...styles[style],
    borderWidth: 2,
    cornerRadius: 8,
    onClick: clickHandler || (() => console.log(`${caption} clicked!`))
  };

  return new Button(x, y, width, height, caption, buttonStyle);
}

// Export for Node.js compatibility
if (typeof module !== "undefined" && module.exports) {
  module.exports = Button;
}