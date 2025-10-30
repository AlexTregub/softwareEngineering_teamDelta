/**
 * Overlay - Base class for full-screen overlays
 * 
 * Extends UIObject for overlays like grids and minimaps:
 * - Toggle visibility
 * - Opacity control
 * - Layering support
 */
class Overlay extends UIObject {
    /**
     * Create an overlay
     * @param {Object} config - Configuration
     * @param {number} config.opacity - Opacity 0-1 (default: 1)
     */
    constructor(config = {}) {
        super({
            x: config.x || 0,
            y: config.y || 0,
            width: config.width || 800,
            height: config.height || 600,
            visible: config.visible !== false, // Overlays start visible
            cacheStrategy: config.cacheStrategy || 'none',
            ...config
        });
        
        this.opacity = config.opacity !== undefined ? config.opacity : 1.0;
    }
    
    /**
     * Toggle visibility
     * @returns {boolean} New visibility state
     */
    toggle() {
        this.setVisible(!this.visible);
        this.markDirty();
        return this.visible;
    }
    
    /**
     * Set opacity
     * @param {number} value - Opacity 0-1
     */
    setOpacity(value) {
        this.opacity = Math.max(0, Math.min(1, value));
        this.markDirty();
    }
    
    /**
     * Get opacity
     * @returns {number} Current opacity
     */
    getOpacity() {
        return this.opacity;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Overlay;
}

if (typeof window !== 'undefined') {
    window.Overlay = Overlay;
}
