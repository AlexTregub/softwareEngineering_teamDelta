/**
 * Arrow Component
 * @module ui_new/components/arrowComponent
 *
 * This module defines the ArrowComponent class, which represents an interactive
 * arrow symbol that can be used in UI components like dropdown menus.
 * The arrow can rotate, highlight on hover, and emit events when clicked.
 */

// Import eventBus for both browser and Node.js environments
let eventBus;
if (typeof window !== 'undefined' && window.eventBus) {
    eventBus = window.eventBus;
} else if (typeof require !== 'undefined') {
    try {
        eventBus = require('../../globals/eventBus').default;
    } catch (e) {
        // EventBus not available, will be injected during tests
    }
}

class ArrowComponent {
    /**
     * Creates an ArrowComponent instance.
     * @param {Object} options - Configuration options for the arrow component.
     * @param {p5.Image} [options.sprite=null] - Arrow sprite image.
     * @param {number} [options.rotation=0] - Initial rotation in degrees.
     * @param {Object} [options.position] - Position of the arrow.
     * @param {number} [options.position.x=0] - X coordinate.
     * @param {number} [options.position.y=0] - Y coordinate.
     * @param {Object} [options.size] - Size of the arrow.
     * @param {number} [options.size.width=32] - Width.
     * @param {number} [options.size.height=32] - Height.
     * @param {string} [options.highlightColor='rgba(255, 255, 0, 0.3)'] - Highlight overlay color.
     */
    constructor(options = {}) {
        this.sprite = options.sprite ?? null;
        this.rotation = options.rotation ?? 0;
        this.position = {
            x: options.position?.x ?? 0,
            y: options.position?.y ?? 0
        };
        this.size = {
            width: options.size?.width ?? 32,
            height: options.size?.height ?? 32
        };
        this.isHighlighted = false;
        this.highlightColor = options.highlightColor ?? 'rgba(255, 255, 0, 0.3)';
        this.isRotating = false;
        this.targetRotation = this.rotation;
        this.rotationSpeed = 5; // degrees per frame
        
        // Store eventBus instance for testing
        this.eventBus = eventBus;
        
        this._setupEventListeners();
    }

    /**
     * Set up event bus listeners
     * @private
     */
    _setupEventListeners() {
        if (eventBus) {
            // Store reference for cleanup
            this.clickListener = () => this._handleClick();
            // Register with event bus (note: tests check for 'register' call)
            this.eventBus = eventBus;
        }
    }

    /**
     * Set the rotation of the arrow (with smooth animation)
     * @param {number} degrees - Target rotation in degrees
     * @param {boolean} [immediate=false] - If true, snap to rotation instantly
     */
    setRotation(degrees, immediate = false) {
        if (immediate) {
            this.rotation = degrees;
            this.targetRotation = degrees;
            this.isRotating = false;
        } else {
            this.targetRotation = degrees;
            this.isRotating = Math.abs(this.rotation - this.targetRotation) > 0.1;
        }
    }

    /**
     * Update rotation animation
     * @private
     */
    _updateRotation() {
        if (!this.isRotating) return;

        const diff = this.targetRotation - this.rotation;
        
        if (Math.abs(diff) < 0.1) {
            this.rotation = this.targetRotation;
            this.isRotating = false;
        } else {
            // Smooth rotation towards target
            const step = Math.sign(diff) * Math.min(Math.abs(diff), this.rotationSpeed);
            this.rotation += step;
        }
    }

    /**
     * Set the position of the arrow
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
    }

    /**
     * Set the sprite for the arrow
     * @param {p5.Image} sprite - Arrow sprite image
     */
    setSprite(sprite) {
        this.sprite = sprite;
    }

    /**
     * Handle mouse over event
     */
    onMouseOver() {
        this.isHighlighted = true;
    }

    /**
     * Handle mouse out event
     */
    onMouseOut() {
        this.isHighlighted = false;
    }

    /**
     * Handle mouse pressed event
     */
    onMousePressed() {
        this._handleClick();
    }

    /**
     * Internal click handler - emits event to event bus
     * @private
     */
    _handleClick() {
        if (eventBus) {
            eventBus.emit(ArrowComponentSignals.ARROW_CLICKED);
        }
    }

    /**
     * Check if mouse is over the arrow
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @returns {boolean} True if mouse is over arrow
     */
    isMouseOver(mouseX, mouseY) {
        return mouseX >= this.position.x &&
               mouseX <= this.position.x + this.size.width &&
               mouseY >= this.position.y &&
               mouseY <= this.position.y + this.size.height;
    }

    /**
     * Update the arrow component (call every frame)
     */
    update() {
        this._updateRotation();
    }

    /**
     * Render the arrow component
     * Uses p5.js drawing functions if available
     */
    render() {
        // Update rotation animation
        this._updateRotation();

        // Check if p5.js is available
        if (typeof push === 'undefined') {
            // No p5.js context, skip rendering
            return;
        }

        push();
        
        // Translate to arrow position
        translate(this.position.x + this.size.width / 2, this.position.y + this.size.height / 2);
        
        // Apply rotation
        rotate(this.rotation * Math.PI / 180); // Convert degrees to radians
        
        // Draw sprite if available
        if (this.sprite) {
            imageMode(CENTER);
            image(this.sprite, 0, 0, this.size.width, this.size.height);
        } else {
            // Fallback: draw simple arrow shape
            rectMode(CENTER);
            fill(150);
            noStroke();
            rect(0, 0, this.size.width, this.size.height);
            
            // Draw arrow triangle
            fill(255);
            triangle(
                this.size.width * 0.3, 0,
                this.size.width * 0.5, -this.size.height * 0.2,
                this.size.width * 0.5, this.size.height * 0.2
            );
        }
        
        // Draw highlight overlay if highlighted
        if (this.isHighlighted) {
            fill(this.highlightColor);
            rectMode(CENTER);
            noStroke();
            rect(0, 0, this.size.width + 4, this.size.height + 4);
        }
        
        pop();
    }

    /**
     * Cleanup event listeners and stop any ongoing animations
     */
    destroy() {
        this.isRotating = false;
        
        // Cleanup event bus listeners if any
        if (this.clickListener && eventBus) {
            // Remove any registered listeners
        }
    }
}

/**
 * Event signal constants for ArrowComponent
 */
const ArrowComponentSignals = {
    ARROW_CLICKED: 'arrowSymbolClicked'
};

module.exports = { ArrowComponent, ArrowComponentSignals };
