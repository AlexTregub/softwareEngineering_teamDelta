/**
 * Dialog - Base class for modal dialogs
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
}

// Export for Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dialog;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.Dialog = Dialog;
}
