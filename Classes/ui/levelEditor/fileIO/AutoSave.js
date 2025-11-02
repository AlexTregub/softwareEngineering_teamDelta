/**
 * AutoSave - Automatic terrain saving system
 * 
 * Provides automatic saving with:
 * - Enable/disable toggle
 * - Configurable interval
 * - Dirty checking (only save if modified)
 */
class AutoSave {
    /**
     * Create an auto-save system
     * @param {number} interval - Save interval in ms (default: 60000 = 1 minute)
     */
    constructor(interval = 60000) {
        this.enabled = false;
        this.interval = interval;
        this.lastSave = 0;
        this.dirty = false;
        this.saveCallback = null;
    }
    
    /**
     * Enable auto-save
     * @param {Function} saveCallback - Function to call when saving
     */
    enable(saveCallback = null) {
        this.enabled = true;
        if (saveCallback) {
            this.saveCallback = saveCallback;
        }
    }
    
    /**
     * Disable auto-save
     */
    disable() {
        this.enabled = false;
    }
    
    /**
     * Toggle auto-save
     * @returns {boolean} New enabled state
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    /**
     * Check if auto-save is enabled
     * @returns {boolean} Enabled state
     */
    isEnabled() {
        return this.enabled;
    }
    
    /**
     * Set save interval
     * @param {number} interval - Interval in ms
     */
    setInterval(interval) {
        this.interval = interval;
    }
    
    /**
     * Get save interval
     * @returns {number} Interval in ms
     */
    getInterval() {
        return this.interval;
    }
    
    /**
     * Mark terrain as modified (dirty)
     */
    markDirty() {
        this.dirty = true;
    }
    
    /**
     * Mark terrain as saved (clean)
     */
    markClean() {
        this.dirty = false;
        this.lastSave = Date.now();
    }
    
    /**
     * Check if terrain has unsaved changes
     * @returns {boolean} True if dirty
     */
    isDirty() {
        return this.dirty;
    }
    
    /**
     * Check if it's time to save
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} True if should save
     */
    shouldSave(currentTime) {
        if (!this.enabled) return false;
        if (!this.dirty) return false;
        
        const elapsed = currentTime - this.lastSave;
        return elapsed >= this.interval;
    }
    
    /**
     * Perform auto-save if needed
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} True if save was performed
     */
    update(currentTime) {
        if (this.shouldSave(currentTime)) {
            if (this.saveCallback) {
                this.saveCallback();
            }
            this.markClean();
            return true;
        }
        return false;
    }
    
    /**
     * Set save callback
     * @param {Function} callback - Function to call when saving
     */
    setSaveCallback(callback) {
        this.saveCallback = callback;
    }
    
    /**
     * Get time since last save
     * @returns {number} Time in ms
     */
    getTimeSinceLastSave() {
        return Date.now() - this.lastSave;
    }
    
    /**
     * Get time until next save
     * @returns {number} Time in ms (negative if overdue)
     */
    getTimeUntilNextSave() {
        if (!this.enabled || !this.dirty) return Infinity;
        
        const timeSince = this.getTimeSinceLastSave();
        return this.interval - timeSince;
    }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoSave;
}
