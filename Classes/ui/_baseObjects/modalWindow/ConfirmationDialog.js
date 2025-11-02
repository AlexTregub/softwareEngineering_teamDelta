/**
 * ConfirmationDialog - UI component for confirmation prompts
 * 
 * Displays modal dialogs for destructive actions with:
 * - Confirm/cancel callbacks
 * - Custom messages
 * - Show/hide functionality
 */
class ConfirmationDialog {
    /**
     * Create a confirmation dialog
     */
    constructor() {
        this.visible = false;
        this.message = '';
        this.confirmCallback = null;
        this.cancelCallback = null;
    }
    
    /**
     * Show confirmation dialog
     * @param {string} message - Confirmation message
     * @param {Function} onConfirm - Callback when confirmed
     * @param {Function} onCancel - Callback when cancelled
     */
    show(message, onConfirm = null, onCancel = null) {
        this.visible = true;
        this.message = message;
        this.confirmCallback = onConfirm;
        this.cancelCallback = onCancel;
    }
    
    /**
     * Hide dialog
     */
    hide() {
        this.visible = false;
        this.message = '';
        this.confirmCallback = null;
        this.cancelCallback = null;
    }
    
    /**
     * Check if dialog is visible
     * @returns {boolean} Visibility state
     */
    isVisible() {
        return this.visible;
    }
    
    /**
     * Get current message
     * @returns {string} Dialog message
     */
    getMessage() {
        return this.message;
    }
    
    /**
     * Confirm action
     * @returns {boolean} True if callback executed
     */
    confirm() {
        if (this.confirmCallback) {
            this.confirmCallback();
        }
        this.hide();
        return true;
    }
    
    /**
     * Cancel action
     * @returns {boolean} True if callback executed
     */
    cancel() {
        if (this.cancelCallback) {
            this.cancelCallback();
        }
        this.hide();
        return true;
    }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfirmationDialog;
}
