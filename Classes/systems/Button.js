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
   * @param {string} [options.fontFamily='Arial'] - g_menuFont family for text
   * @param {number} [options.fontSize=16] - g_menuFont size for text
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
    this.scale = 1;        // current scale (used for smooth animation)
    this.targetScale = 1;  // what scale we want (1 = normal, >1 = hovered)
    this.scaleSpeed = 0.1; // how fast it eases
    
    // Interaction
    this.onClick = options.onClick || null;
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    
    // State tracking
    this.isHovered = false;
    // Smooth hover scaling
    if (this.isHovered) {
    this.targetScale = 1.1; // grow 10% on hover
    } else {
    this.targetScale = 1;   // go back to normal
    }

    // Ease current scale toward target scale
    this.scale += (this.targetScale - this.scale) * this.scaleSpeed;
        
    this.isPressed = false;
    this.wasClicked = false;

    // Adding image support
    this.img = options.image || null;
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
    push();
    imageMode(CENTER);
    rectMode(CENTER);
    textAlign(CENTER, CENTER);
  
    const center = this.bounds.getCenter();
    const hovering = this.isHovered;
  
    // --- init scale if missing ---
    if (this.currentScale === undefined) this.currentScale = 1.0;
  
    // --- target scale ---
    let targetScale = hovering ? 1.1 : 1.0;
    this.currentScale += (targetScale - this.currentScale) * 0.1; // easing
  
    // --- float offset if hovered ---
    let hoverFloat = hovering ? sin(frameCount * 0.1) * 1 : 0;
  
    // --- visual tint ---
    if (hovering) tint(255, 220);
    else noTint();
  
    if (this.img) {
      // --- draw image button ---
      push();
      translate(center.x, center.y + hoverFloat);
      scale(this.currentScale);
      image(this.img, 0, 0, this.width, this.height);
      pop();
    } else {
      // --- draw rectangle button using configured style colors ---
      push();
      translate(center.x, center.y + hoverFloat);
      scale(this.currentScale);
      // Use configured colors (strings like '#rrggbb' or rgb) — fall back to green if something is wrong
      try {
        const bgColor = hovering ? (this.hoverColor || this.backgroundColor) : (this.backgroundColor || '#64C864');
        fill(bgColor);
      } catch (err) {
        fill(color(100, 200, 100));
      }
      try { stroke(this.borderColor || 255); } catch (err) { stroke(255); }
      strokeWeight(this.borderWidth || 2);
      rect(0, 0, this.width, this.height, this.cornerRadius || 5);

      // Text
      fill(this.textColor || 'white');
      noStroke();
      textFont(this.fontFamily);
      textSize(this.fontSize);
      text(this.caption, 0, 0);
      pop();
    }
  
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

/**
 * Global button styles - centralized styling for all buttons in the game
 * All button colors and styling should be defined here for consistency
 */
const ButtonStyles = {
  // Toolbar buttons (used in UILayerRenderer)
  TOOLBAR: {
    backgroundColor: '#3C3C3C',
    hoverColor: '#5A5A5A',
    textColor: '#FFFFFF',
    borderColor: '#222222',
    borderWidth: 1,
    cornerRadius: 3,
    fontSize: 12
  },
  TOOLBAR_ACTIVE: {
    backgroundColor: '#6496FF',
    hoverColor: '#5A88E6',
    textColor: '#FFFFFF',
    borderColor: '#4A78CC',
    borderWidth: 1,
    cornerRadius: 3,
    fontSize: 12
  },
  
  // Main menu buttons
  MAIN_MENU: {
    backgroundColor: '#3C3C3C',
    hoverColor: '#4A4A4A',
    textColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    borderWidth: 2,
    cornerRadius: 5,
    fontSize: 24
  },
  
  // Pause menu buttons
  PAUSE_MENU: {
    backgroundColor: '#3C3C3C',
    hoverColor: '#4A4A4A',
    textColor: '#FFFFFF',
    borderColor: '#C8C8C8',
    borderWidth: 1,
    cornerRadius: 5,
    fontSize: 18
  },
  
  // Debug fallback buttons
  DEBUG_FALLBACK: {
    backgroundColor: '#3C3C3C',
    hoverColor: '#4A4A4A',
    textColor: '#FFFFFF',
    borderColor: '#C8C8C8',
    borderWidth: 1,
    cornerRadius: 4,
    fontSize: 12
  },
  
  // Menu button styles (createMenuButton factory)
  DEFAULT: {
    backgroundColor: '#2196F3',
    hoverColor: '#1976D2',
    textColor: 'white',
    borderColor: '#0D47A1',
    borderWidth: 2,
    cornerRadius: 8
  },
  SUCCESS: {
    backgroundColor: '#4CAF50',
    hoverColor: '#45a049',
    textColor: 'white',
    borderColor: '#2E7D32',
    borderWidth: 2,
    cornerRadius: 8
  },
  WARNING: {
    backgroundColor: '#FF9800',
    hoverColor: '#F57C00',
    textColor: 'white',
    borderColor: '#E65100',
    borderWidth: 2,
    cornerRadius: 8
  },
  DANGER: {
    backgroundColor: '#F44336',
    hoverColor: '#D32F2F',
    textColor: 'white',
    borderColor: '#B71C1C',
    borderWidth: 2,
    cornerRadius: 8
  },
  PURPLE: {
    backgroundColor: '#9C27B0',
    hoverColor: '#7B1FA2',
    textColor: 'white',
    borderColor: '#4A148C',
    borderWidth: 2,
    cornerRadius: 8
  }
};

// Make ButtonStyles globally available
if (typeof window !== 'undefined') {
  window.ButtonStyles = ButtonStyles;
}
if (typeof global !== 'undefined') {
  global.ButtonStyles = ButtonStyles;
}

// Button factory function with predefined styles
function createMenuButton(x, y, width, height, caption, style = 'default', clickHandler = null, image = null) {
  const styleMap = {
    default: ButtonStyles.DEFAULT,
    success: ButtonStyles.SUCCESS,
    warning: ButtonStyles.WARNING,
    danger: ButtonStyles.DANGER,
    purple: ButtonStyles.PURPLE
  };

  const buttonStyle = {
    ...styleMap[style],
    onClick: clickHandler || (() => console.log(`${caption} clicked!`)),
    image: image
  };

  const btn = new Button(x, y, width, height, caption, buttonStyle);
  // Backwards compatibility: some code expects an `action` method/property.
  // Ensure both modern `onClick` and legacy `action` call the same handler.
  btn.action = function() { if (typeof btn.onClick === 'function') return btn.onClick(btn); };
  return btn;
}

// Export for Node.js compatibility
if (typeof module !== "undefined" && module.exports) {
  module.exports = Button;
  module.exports.ButtonStyles = ButtonStyles;
  module.exports.createMenuButton = createMenuButton;
}

let activeButtons = [];

function setActiveButtons(buttonList) {
  activeButtons = buttonList || [];
}

function handleButtonsClick() {
  activeButtons.forEach(btn => {
    if (btn.isHovered && typeof btn.action === 'function') {
      btn.action();
    }
  });
}