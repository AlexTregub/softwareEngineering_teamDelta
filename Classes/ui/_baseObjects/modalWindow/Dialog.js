/**
 * Dialog
 * Base class for modal dialogs
 * 
 * Extends UIObject to provide common dialog functionality:
 * - Show/hide with callbacks
 * - Keyboard handling (ESC, ENTER)
 * - Modal behavior
 * - Chrome rendering (title bar, border, buttons)
 * 
 * Subclasses must implement renderContent(buffer) for dialog-specific UI.
 * 
 * @extends UIObject
 */
class Dialog extends UIObject {
    /**
     * Create a dialog
     * @param {Object} config - Configuration object
     * @param {number} [config.width=500] - Dialog width in pixels
     * @param {number} [config.height=300] - Dialog height in pixels
     * @param {number} [config.x] - X position (auto-centered if not provided)
     * @param {number} [config.y] - Y position (auto-centered if not provided)
     * @param {string} [config.title='Dialog'] - Dialog title
     * @param {string} [config.message=''] - Initial message
     * @param {string} [config.cacheStrategy='fullBuffer'] - Cache strategy
     */
    constructor(config = {}) {
        // Dialog-specific defaults
        const dialogConfig = {
            width: config.width || 500,
            height: config.height || 300,
            x: config.x,
            y: config.y,
            visible: false, // Dialogs start hidden
            cacheStrategy: config.cacheStrategy || 'fullBuffer',
            ...config
        };
        
        super(dialogConfig);
        
        // Dialog properties
        this.title = config.title || 'Dialog';
        this.message = config.message || '';
        
        // Callbacks
        this.onConfirm = null;
        this.onCancel = null;

        this.overlay = null;
    }
    
    /**
     * Show the dialog
     * @param {string} message - Message to display
     * @param {Function} [onConfirm] - Callback when confirmed
     * @param {Function} [onCancel] - Callback when cancelled
     */
    show(message, onConfirm = null, onCancel = null) {
        this.message = message;
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
        this.setVisible(true);
        this.markDirty();
    }
    
    /**
     * Hide the dialog
     */
    hide() {
        this.setVisible(false);
        this.onConfirm = null;
        this.onCancel = null;
        this.markDirty();
    }
    
    /**
     * Confirm action (call onConfirm callback and hide)
     */
    confirm() {
        if (this.onConfirm) {
            this.onConfirm();
        }
        this.hide();
    }
    
    /**
     * Cancel action (call onCancel callback and hide)
     */
    cancel() {
        if (this.onCancel) {
            this.onCancel();
        }
        this.hide();
    }
    
    /**
     * Handle keyboard input
     * @param {number} keyCode - Key code (27=ESC, 13=ENTER)
     */
    handleKeyPress(keyCode) {
        if (keyCode === 27) { // ESC
            this.cancel();
        } else if (keyCode === 13) { // ENTER
            this.confirm();
        }
    }
    
    /**
     * Get centered position for given screen size
     * @param {number} screenWidth - Screen width
     * @param {number} screenHeight - Screen height
     * @returns {Object} {x, y} centered position
     */
    getCenteredPosition(screenWidth, screenHeight) {
        return {
            x: (screenWidth - this.width) / 2,
            y: (screenHeight - this.height) / 2
        };
    }
    
    /**
     * Render dialog chrome to cache buffer
     * @param {p5.Graphics} buffer - Graphics buffer to render to
     */
    renderToCache(buffer) {
        if (!buffer) return;
        
        // Background
        buffer.background(40, 40, 40, 240);
        
        // Border
        buffer.stroke(100, 150, 255);
        buffer.strokeWeight(2);
        buffer.noFill();
        buffer.rect(0, 0, this.width, this.height, 5);
        
        // Title bar
        buffer.fill(50, 50, 50);
        buffer.noStroke();
        buffer.rect(0, 0, this.width, 40, 5, 5, 0, 0);
        
        // Title text
        buffer.fill(100, 150, 255);
        buffer.textAlign(buffer.CENTER, buffer.CENTER);
        buffer.textSize(16);
        buffer.text(this.title, this.width / 2, 20);
        
        // Call subclass content rendering
        this.renderContent(buffer);
    }
    
    /**
     * Render dialog content (ABSTRACT - subclasses must implement)
     * @param {p5.Graphics} buffer - Graphics buffer to render to
     * @throws {Error} If not implemented by subclass
     */
    renderContent(buffer) {
        throw new Error(`${this.constructor.name} must implement renderContent(buffer)`);
    }
    
    // ===== HELPER METHODS (Phase 1 Refactoring) =====
    
    /**
     * Render semi-transparent modal overlay
     * @param {p5.Graphics} buffer - Graphics buffer to render to
     * @param {number} [opacity=180] - Overlay opacity (0-255)
     */
    renderOverlay(buffer, opacity = 180) {
        if (!buffer) return;
        buffer.fill(0, 0, 0, opacity);
        buffer.noStroke();
        buffer.rect(0, 0, buffer.width, buffer.height);
    }
    
    /**
     * Render an input field with label
     * @param {p5.Graphics} buffer - Graphics buffer to render to
     * @param {Object} config - Input field configuration
     * @param {string} config.label - Field label
     * @param {string|number} config.value - Current value
     * @param {number} config.x - X position
     * @param {number} config.y - Y position
     * @param {number} [config.width=160] - Field width
     * @param {number} [config.height=35] - Field height
     * @param {boolean} [config.isActive=false] - Whether field is active/focused
     * @param {string} [config.placeholder=''] - Placeholder text when value is empty
     * @param {string} [config.suffix=''] - Suffix text (e.g., 'px', 'tiles')
     * @returns {Object} Input bounds {x, y, width, height} for click detection
     */
    renderInputField(buffer, config) {
        if (!buffer) return { x: 0, y: 0, width: 0, height: 0 };
        
        const {
            label,
            value,
            x,
            y,
            width = 160,
            height = 35,
            isActive = false,
            placeholder = '',
            suffix = ''
        } = config;
        
        // Label above input
        buffer.fill(200);
        buffer.textAlign(buffer.LEFT, buffer.TOP);
        buffer.textSize(14);
        buffer.text(`${label}:`, x, y - 20);
        
        // Input box background
        buffer.fill(30);
        buffer.noStroke();
        buffer.rect(x, y, width, height, 3);
        
        // Border (highlight if active)
        if (isActive) {
            buffer.stroke(255, 200, 0); // Yellow
            buffer.strokeWeight(2);
        } else {
            buffer.stroke(80);
            buffer.strokeWeight(1);
        }
        buffer.noFill();
        buffer.rect(x, y, width, height, 3);
        
        // Value or placeholder text
        const displayText = (value === '' || value === null || value === undefined) ? placeholder : String(value);
        const isPlaceholder = (value === '' || value === null || value === undefined) && placeholder;
        
        buffer.fill(isPlaceholder ? 150 : 255);
        buffer.noStroke();
        buffer.textAlign(buffer.CENTER, buffer.CENTER);
        buffer.textSize(16);
        buffer.text(displayText, x + width / 2, y + height / 2);
        
        // Suffix text (if provided)
        if (suffix) {
            buffer.fill(150);
            buffer.textAlign(buffer.LEFT, buffer.CENTER);
            buffer.textSize(12);
            buffer.text(suffix, x + width + 10, y + height / 2);
        }
        
        // Return bounds for click detection
        return { x, y, width, height };
    }
    
    /**
     * Render a button to a buffer (for buffer-based rendering contexts).
     * 
     * For screen-based rendering, use Button.js component instead (see ModalDialog.js).
     * This helper is for buffer contexts where Button.js cannot be used.
     * 
     * @param {p5.Graphics} buffer - The buffer to render to
     * @param {Object} config - Button configuration
     * @param {string} config.label - Button text
     * @param {number} config.x - X position
     * @param {number} config.y - Y position
     * @param {number} config.width - Button width
     * @param {number} config.height - Button height
     * @param {boolean} [config.enabled=true] - Whether button is enabled
     * @param {boolean} [config.primary=false] - Use primary style
     * @returns {Object} Button bounds {x, y, width, height} for click detection
     */
    renderButton(buffer, config) {
        const {
            label,
            x,
            y,
            width,
            height,
            enabled = true,
            primary = false
        } = config;

        // Button styling
        buffer.noStroke();
        
        if (enabled) {
            if (primary) {
                buffer.fill(34, 139, 34); // Green for primary action
            } else {
                buffer.fill(100, 100, 100); // Gray for secondary
            }
        } else {
            buffer.fill(50, 50, 50); // Dark gray for disabled
        }
        
        buffer.rect(x, y, width, height, 5);
        
        // Button text
        buffer.fill(255);
        buffer.textAlign(buffer.CENTER, buffer.CENTER);
        buffer.textSize(14);
        buffer.text(label, x + width / 2, y + height / 2);

        return { x, y, width, height };
    }
    
    /**
     * Check if a point is within bounds
     * @param {number} x - Point X coordinate
     * @param {number} y - Point Y coordinate
     * @param {Object} bounds - Bounds object {x, y, width, height}
     * @returns {boolean} True if point is inside bounds
     */
    isPointInBounds(x, y, bounds) {
        return x >= bounds.x && x <= bounds.x + bounds.width &&
               y >= bounds.y && y <= bounds.y + bounds.height;
    }
    
    // ===== COMMON DIALOG PATTERNS (Phase 3 Refactoring) =====
    
    /**
     * Show dialog with automatic centering on canvas
     * Replaces manual centering code in subclasses (NewMapDialog, etc.)
     * @param {...any} args - Arguments passed to onShow hook
     */
    showWithCentering(...args) {
        // Get canvas dimensions (from globals or defaults)
        const canvasWidth = (typeof g_canvasX !== 'undefined') ? g_canvasX : 1920;
        const canvasHeight = (typeof g_canvasY !== 'undefined') ? g_canvasY : 1080;
        
        // Center dialog on canvas
        const centered = this.getCenteredPosition(canvasWidth, canvasHeight);
        this.x = centered.x;
        this.y = centered.y;
        
        // Call subclass initialization hook (if overridden)
        this.onShow(...args);
        
        // Standard show behavior
        this.setVisible(true);
        this.markDirty();
    }
    
    /**
     * Hook for subclass-specific initialization when showing dialog
     * Subclasses can override this instead of show()
     * @param {...any} args - Arguments passed from showWithCentering()
     */
    onShow(...args) {
        // Default: do nothing
        // Subclasses override for custom initialization
    }
    
    /**
     * Convert screen coordinates to dialog-relative coordinates
     * Simplifies click handling in subclasses
     * @param {number} mouseX - Screen X coordinate
     * @param {number} mouseY - Screen Y coordinate
     * @returns {{x: number, y: number}} Dialog-relative coordinates
     */
    convertToDialogCoords(mouseX, mouseY) {
        return {
            x: mouseX - (this.x || 0),
            y: mouseY - (this.y || 0)
        };
    }
    
    /**
     * Handle click with automatic coordinate conversion
     * Replaces manual conversion code in subclasses
     * @param {number} mouseX - Screen X coordinate
     * @param {number} mouseY - Screen Y coordinate
     * @returns {boolean} True if click was handled
     */
    handleClickWithConversion(mouseX, mouseY) {
        if (!this.visible) return false;
        
        // Convert to dialog-relative coordinates
        const coords = this.convertToDialogCoords(mouseX, mouseY);
        
        // Let subclass handle the click (with relative coords)
        const handled = this.handleDialogClick(coords.x, coords.y);
        if (handled) return true;
        
        // Click within dialog bounds = consume event (prevent click-through)
        if (coords.x >= 0 && coords.x <= this.width &&
            coords.y >= 0 && coords.y <= this.height) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Handle click within dialog (dialog-relative coordinates)
     * Subclasses override this instead of handleClick()
     * @param {number} relX - X coordinate relative to dialog
     * @param {number} relY - Y coordinate relative to dialog
     * @returns {boolean} True if click was handled
     */
    handleDialogClick(relX, relY) {
        // Default: not handled
        // Subclasses override for custom click handling
        return false;
    }
    
    /**
     * Render validation error message
     * @param {p5.Graphics} buffer - Graphics buffer to render to
     * @param {string} error - Error message to display
     * @param {number} x - X position (center-aligned)
     * @param {number} y - Y position (top-aligned)
     */
    renderValidationError(buffer, error, x, y) {
        if (!buffer || !error || error === '') return;
        
        buffer.fill(255, 100, 100); // Red
        buffer.textAlign(buffer.CENTER, buffer.TOP);
        buffer.textSize(12);
        buffer.text(error, x, y);
    }
    
    /**
     * Get canvas width from global or default
     * @returns {number} Canvas width in pixels
     */
    getCanvasWidth() {
        return (typeof g_canvasX !== 'undefined') ? g_canvasX : 1920;
    }
    
    /**
     * Get canvas height from global or default
     * @returns {number} Canvas height in pixels
     */
    getCanvasHeight() {
        return (typeof g_canvasY !== 'undefined') ? g_canvasY : 1080;
    }
    
    /**
     * Render modal overlay (semi-transparent full-screen background)
     * Call this in renderToScreen() before rendering dialog content
     * @param {number} [opacity=180] - Overlay opacity (0-255)
     */
    renderModalOverlay(opacity = 180) {
        push();
        fill(0, 0, 0, opacity);
        noStroke();
        rect(0, 0, this.getCanvasWidth(), this.getCanvasHeight());
        pop();
    }
    
    /**
     * Render instruction text (larger, brighter text for main instructions)
     * @param {p5.Graphics} buffer - Graphics buffer to render to
     * @param {string} text - Text to display
     * @param {number} x - X position (center-aligned)
     * @param {number} y - Y position (top-aligned)
     * @param {number} [size=14] - Text size in pixels
     * @param {number} [color=200] - Text brightness (0-255)
     */
    renderInstructionText(buffer, text, x, y, size = 14, color = 200) {
        if (!buffer) return;
        
        buffer.fill(color);
        buffer.textAlign(buffer.CENTER, buffer.TOP);
        buffer.textSize(size);
        buffer.text(text, x, y);
    }
    
    /**
     * Render hint text (smaller, dimmer text for hints/validation messages)
     * @param {p5.Graphics} buffer - Graphics buffer to render to
     * @param {string} text - Text to display
     * @param {number} x - X position (center-aligned)
     * @param {number} y - Y position (top-aligned)
     * @param {number} [size=12] - Text size in pixels
     * @param {number} [color=150] - Text brightness (0-255)
     */
    renderHintText(buffer, text, x, y, size = 12, color = 150) {
        if (!buffer) return;
        
        buffer.fill(color);
        buffer.textAlign(buffer.CENTER, buffer.TOP);
        buffer.textSize(size);
        buffer.text(text, x, y);
    }
    
    // ===== CHILD COMPONENT MANAGEMENT (Phase 4 Refactoring) =====
    
    /**
     * Update hover states for all hoverable child components
     * Converts global mouse coordinates to dialog-relative coordinates
     * and calls updateHover() on each child
     * 
     * Subclasses override getHoverableChildren() to return array of components
     */
    updateChildHovers() {
        if (typeof mouseX === 'undefined' || typeof mouseY === 'undefined') return;
        
        const relX = mouseX - (this.x || 0);
        const relY = mouseY - (this.y || 0);
        
        this.getHoverableChildren().forEach(child => {
            if (child && child.updateHover) {
                child.updateHover(relX, relY);
            }
        });
    }
    
    /**
     * Get array of child components that support hover states
     * Subclasses override to return their hoverable components (InputBoxes, etc.)
     * @returns {Array} Array of components with updateHover() method
     */
    getHoverableChildren() {
        return [];
    }
    
    /**
     * Get array of child components that need continuous rendering for animations
     * (e.g., blinking cursors, hover effects)
     * Subclasses override to return their animatable components
     * @returns {Array} Array of components with isFocused/isHovered properties
     */
    getAnimatableChildren() {
        return [];
    }
    
    /**
     * Override render to support continuous animation for child components
     * Automatically marks dialog dirty if any child is focused or hovered
     */
    render() {
        // Check if any animatable child needs continuous rendering
        const needsAnimation = this.getAnimatableChildren().some(child => 
            child && (child.isFocused || child.isHovered)
        );
        
        if (needsAnimation) {
            this.markDirty();
        }
        
        // Call parent render (UIObject.render)
        if (super.render) {
            super.render();
        }
    }
}

// Export for Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dialog;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.Dialog = Dialog;
}
