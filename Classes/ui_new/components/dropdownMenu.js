/**
 * Dropdown Menu Component
 * @module ui_new/components/dropdownMenu
 *
 * This module defines the DropDownMenu class, which represents a collapsible
 * menu component that can display information lines and toggle between open/closed states.
 */

const { InformationLine, InformationLineSignals } = require('./informationLine');
const { ArrowComponent, ArrowComponentSignals } = require('./arrowComponent');

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

class DropDownMenu {
    /**
     * Creates a DropDownMenu instance.
     * @param {Object} p5Instance - p5.js instance for rendering
     * @param {Object} options - Configuration options
     * @param {InformationLine} [options.titleLine] - Custom title line
     * @param {Object} [options.position] - Menu position relative to screen center
     * @param {number} [options.position.x=0] - X coordinate
     * @param {number} [options.position.y=0] - Y coordinate
     * @param {Object} [options.size] - Menu size
     * @param {number} [options.size.width=200] - Width
     * @param {number} [options.size.height=300] - Height (when open)
     * @param {p5.Image} [options.openTexture] - Background texture for open state
     * @param {p5.Image} [options.closedTexture] - Background texture for closed state
     */
    constructor(p5Instance, options = {}) {
        this.p5 = p5Instance;
        
        // States
        this.states = {
            OPEN: 'open',
            CLOSED: 'closed'
        };
        this.currentState = this.states.CLOSED;
        this.isOpen = false;
        
        // Position and size
        this.position = {
            x: options.position?.x ?? 0,
            y: options.position?.y ?? 0
        };
        this.size = {
            width: options.size?.width ?? 200,
            height: options.size?.height ?? 300
        };
        
        // Textures
        this.openTexture = options.openTexture ?? {
            isVisible: false,
            opacity: 0,
            position: { x: 0, y: 0 }
        };
        this.closedTexture = options.closedTexture ?? {
            isVisible: true,
            opacity: 1,
            position: { x: 0, y: 0 }
        };
        
        if (this.openTexture && typeof this.openTexture === 'object') {
            this.openTexture.isVisible = false;
        }
        if (this.closedTexture && typeof this.closedTexture === 'object') {
            this.closedTexture.isVisible = true;
        }
        
        // Title line (always visible)
        this.titleLine = options.titleLine ?? new InformationLine({
            caption: "Menu",
            textSize: 14
        });
        this.titleLine.isVisible = true;
        
        // Information lines (visible only when open)
        this.informationLines = new Map();
        
        // Arrow component
        this.arrowComponent = new ArrowComponent({
            rotation: 0, // 0° = right (closed), 90° = down (open)
            size: { width: 24, height: 24 }
        });
        this.arrowSymbol = this.arrowComponent; // Alias for tests
        
        // Animation properties
        this.transitionProgress = 0;
        this.isTransitioning = false;
        this.transitionSpeed = 0.1;
        
        // Keybind
        this.toggleKey = '`';
        
        this._setupEventListeners();
        this._updateLayout();
    }
    
    /**
     * Set up event bus listeners
     * @private
     */
    _setupEventListeners() {
        if (eventBus) {
            this.arrowClickListener = () => this.toggle();
            eventBus.on(ArrowComponentSignals.ARROW_CLICKED, this.arrowClickListener);
        }
    }
    
    /**
     * Update layout positions for all elements
     * @private
     */
    _updateLayout() {
        const absolutePos = this.getAbsolutePosition();
        
        // Title line at top
        this.titleLine.position = {
            x: absolutePos.x + 10,
            y: absolutePos.y + 10
        };
        this.titleLine.size = {
            width: this.size.width - 20,
            height: 32
        };
        
        // Arrow below title
        this.arrowComponent.position = {
            x: absolutePos.x + (this.size.width - this.arrowComponent.size.width) / 2,
            y: this.titleLine.position.y + this.titleLine.size.height + 5
        };
        
        // Information lines stacked below arrow
        let currentY = this.arrowComponent.position.y + this.arrowComponent.size.height + 10;
        this.informationLines.forEach((line, id) => {
            line.position = {
                x: absolutePos.x + 10,
                y: currentY
            };
            line.size = {
                width: this.size.width - 20,
                height: 32
            };
            currentY += line.size.height + 5;
        });
    }
    
    /**
     * Get absolute position (relative to screen center)
     * @returns {Object} Absolute position {x, y}
     */
    getAbsolutePosition() {
        if (this.p5 && this.p5.width && this.p5.height) {
            return {
                x: (this.p5.width / 2) + this.position.x,
                y: (this.p5.height / 2) + this.position.y
            };
        }
        return { x: this.position.x, y: this.position.y };
    }
    
    /**
     * Set the position of the menu
     * @param {number} x - X coordinate (relative to screen center)
     * @param {number} y - Y coordinate (relative to screen center)
     */
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        this._updateLayout();
    }
    
    /**
     * Set the size of the menu
     * @param {number} width - Width
     * @param {number} height - Height
     */
    setSize(width, height) {
        this.size.width = width;
        this.size.height = height;
        this._updateLayout();
    }
    
    /**
     * Add an information line to the menu
     * @param {Object} options - InformationLine options
     * @returns {InformationLine} The created information line
     */
    addInformationLine(options = {}) {
        const line = new InformationLine(options);
        this.informationLines.set(line.id, line);
        this._updateLayout();
        return line;
    }
    
    /**
     * Remove an information line from the menu
     * @param {string} lineId - ID of the line to remove
     */
    removeInformationLine(lineId) {
        const line = this.informationLines.get(lineId);
        if (line) {
            line.destroy();
            this.informationLines.delete(lineId);
            this._updateLayout();
        }
    }
    
    /**
     * Toggle between open and closed states
     */
    toggle() {
        if (this.currentState === this.states.CLOSED) {
            this._transitionToOpen();
        } else {
            this._transitionToClosed();
        }
    }
    
    /**
     * Transition to open state
     * @private
     */
    _transitionToOpen() {
        this.currentState = this.states.OPEN;
        this.isOpen = true;
        this.isTransitioning = true;
        this.transitionProgress = 0;
        
        // Update textures
        if (this.openTexture) this.openTexture.isVisible = true;
        if (this.closedTexture) this.closedTexture.isVisible = false;
        
        // Rotate arrow to point down
        this.arrowComponent.setRotation(90);
    }
    
    /**
     * Transition to closed state
     * @private
     */
    _transitionToClosed() {
        this.currentState = this.states.CLOSED;
        this.isOpen = false;
        this.isTransitioning = true;
        this.transitionProgress = 0;
        
        // Update textures
        if (this.openTexture) this.openTexture.isVisible = false;
        if (this.closedTexture) this.closedTexture.isVisible = true;
        
        // Rotate arrow to point right
        this.arrowComponent.setRotation(0);
    }
    
    /**
     * Update transition animations
     * @private
     */
    _updateTransition() {
        if (!this.isTransitioning) return;
        
        this.transitionProgress += this.transitionSpeed;
        
        if (this.transitionProgress >= 1) {
            this.transitionProgress = 1;
            this.isTransitioning = false;
        }
        
        // Fade information lines
        if (this.currentState === this.states.OPEN) {
            // Fade in bottom to top
            let index = 0;
            const lineArray = Array.from(this.informationLines.values());
            lineArray.reverse().forEach((line) => {
                const delay = index * 0.1;
                const progress = Math.max(0, Math.min(1, (this.transitionProgress - delay) / 0.5));
                line.setOpacity(progress);
                index++;
            });
        } else {
            // Fade out top to bottom
            let index = 0;
            this.informationLines.forEach((line) => {
                const delay = index * 0.1;
                const progress = Math.max(0, Math.min(1, (this.transitionProgress - delay) / 0.5));
                line.setOpacity(1 - progress);
                index++;
            });
        }
    }
    
    /**
     * Update the menu (call every frame)
     */
    update() {
        this._updateTransition();
        this.arrowComponent.update();
    }
    
    /**
     * Check if mouse is over the menu
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @returns {boolean} True if mouse is over menu
     */
    isMouseOver(mouseX, mouseY) {
        const pos = this.getAbsolutePosition();
        return mouseX >= pos.x &&
               mouseX <= pos.x + this.size.width &&
               mouseY >= pos.y &&
               mouseY <= pos.y + this.size.height;
    }
    
    /**
     * Handle mouse pressed event
     * @param {Object} event - Mouse event {x, y}
     */
    onMousePressed(event) {
        // Check if arrow was clicked
        if (this.arrowComponent.isMouseOver(event.x, event.y)) {
            this.arrowComponent.onMousePressed();
        }
    }
    
    /**
     * Handle mouse released event
     * @param {Object} event - Mouse event {x, y}
     */
    onMouseReleased(event) {
        // Handle if needed
    }
    
    /**
     * Handle touch start event
     * @param {Object} event - Touch event {x, y}
     */
    onTouchStart(event) {
        this.onMousePressed(event);
    }
    
    /**
     * Handle key pressed event
     * @param {Object} event - Key event {key}
     */
    onKeyPressed(event) {
        if (event.key === this.toggleKey) {
            this.toggle();
        }
    }
    
    /**
     * Handle key released event
     * @param {Object} event - Key event {key}
     */
    onKeyReleased(event) {
        // Handle if needed
    }
    
    /**
     * Render texture
     * @private
     */
    renderTexture() {
        if (!this.p5 || typeof push === 'undefined') return;
        
        const pos = this.getAbsolutePosition();
        
        push();
        
        // Render open texture if visible
        if (this.openTexture && this.openTexture.isVisible) {
            if (typeof this.openTexture.image !== 'undefined') {
                image(this.openTexture.image, pos.x, pos.y, this.size.width, this.size.height);
            }
        }
        
        // Render closed texture if visible (always renders on top)
        if (this.closedTexture && this.closedTexture.isVisible) {
            if (typeof this.closedTexture.image !== 'undefined') {
                image(this.closedTexture.image, pos.x, pos.y, this.size.width, this.size.height);
            }
        }
        
        pop();
    }
    
    /**
     * Render title line
     * @private
     */
    renderTitleLine() {
        if (this.titleLine && this.titleLine.isVisible) {
            this.titleLine.render();
        }
    }
    
    /**
     * Render information lines
     * @private
     */
    renderInformationLines() {
        if (this.currentState === this.states.OPEN || this.isTransitioning) {
            this.informationLines.forEach((line) => {
                line.render();
            });
        }
    }
    
    /**
     * Render the menu
     */
    render() {
        // Update animations
        this.update();
        
        // Render in order: texture, title line, information lines, arrow
        this.renderTexture();
        this.renderTitleLine();
        this.renderInformationLines();
        this.arrowComponent.render();
    }
    
    /**
     * Cleanup event listeners
     */
    destroy() {
        if (eventBus && this.arrowClickListener) {
            eventBus.off(ArrowComponentSignals.ARROW_CLICKED, this.arrowClickListener);
        }
        
        this.titleLine.destroy();
        this.informationLines.forEach((line) => line.destroy());
        this.arrowComponent.destroy();
    }
}

module.exports = DropDownMenu;
