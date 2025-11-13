/**
 * LocalStorageManager - Browser localStorage management for terrains
 * 
 * Provides persistent storage with:
 * - Save/load terrain data
 * - List saved terrains
 * - Delete terrains
 * - Storage quota checking
 */
class LocalStorageManager {
    /**
     * Create a localStorage manager
     * @param {string} prefix - Key prefix for namespacing (default: 'terrain_')
     */
    constructor(prefix = 'terrain_') {
        this.prefix = prefix;
        this.storage = typeof localStorage !== 'undefined' ? localStorage : null;
    }
    
    /**
     * Check if localStorage is available
     * @returns {boolean} True if available
     * @private
     */
    _isAvailable() {
        return this.storage !== null;
    }
    
    /**
     * Get full key with prefix
     * @param {string} name - Terrain name
     * @returns {string} Full key
     * @private
     */
    _getKey(name) {
        return this.prefix + name;
    }
    
    /**
     * Save terrain data
     * @param {string} name - Terrain name
     * @param {Object} data - Terrain data
     * @returns {boolean} True if saved successfully
     */
    save(name, data) {
        if (!this._isAvailable()) return false;
        
        try {
            const key = this._getKey(name);
            const json = JSON.stringify(data);
            this.storage.setItem(key, json);
            
            // Store metadata
            const metadata = {
                name: name,
                date: new Date().toISOString(),
                size: json.length
            };
            this.storage.setItem(key + '_meta', JSON.stringify(metadata));
            
            return true;
        } catch (e) {
            // QuotaExceededError or other storage errors
            return false;
        }
    }
    
    /**
     * Load terrain data
     * @param {string} name - Terrain name
     * @returns {Object|null} Terrain data or null
     */
    load(name) {
        if (!this._isAvailable()) return null;
        
        try {
            const key = this._getKey(name);
            const json = this.storage.getItem(key);
            
            if (!json) return null;
            
            return JSON.parse(json);
        } catch (e) {
            return null;
        }
    }
    
    /**
     * List saved terrains (with optional filter)
     * @param {string} filter - Optional name filter
     * @returns {Array<Object>} Terrain metadata
     */
    list(filter = '') {
        if (!this._isAvailable()) return [];
        
        const terrains = [];
        
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            
            if (key.startsWith(this.prefix) && !key.endsWith('_meta')) {
                const name = key.substring(this.prefix.length);
                
                // Apply filter
                if (filter && !name.includes(filter)) {
                    continue;
                }
                
                // Get metadata
                const metaKey = key + '_meta';
                const metaJson = this.storage.getItem(metaKey);
                let metadata = { name: name };
                
                if (metaJson) {
                    try {
                        metadata = JSON.parse(metaJson);
                    } catch (e) {
                        // Use default metadata
                    }
                }
                
                terrains.push(metadata);
            }
        }
        
        return terrains;
    }
    
    /**
     * Delete terrain
     * @param {string} name - Terrain name
     * @returns {boolean} True if deleted
     */
    delete(name) {
        if (!this._isAvailable()) return false;
        
        try {
            const key = this._getKey(name);
            this.storage.removeItem(key);
            this.storage.removeItem(key + '_meta');
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Get storage usage information
     * @returns {Object} {used, available, percentage}
     */
    getUsage() {
        if (!this._isAvailable()) {
            return { used: 0, available: 0, percentage: 0 };
        }
        
        let used = 0;
        
        // Calculate used space
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            const value = this.storage.getItem(key);
            used += key.length + (value ? value.length : 0);
        }
        
        // Typical localStorage quota is 5-10 MB
        const available = 5 * 1024 * 1024; // Assume 5 MB
        const percentage = (used / available) * 100;
        
        return {
            used: used,
            available: available,
            percentage: Math.min(percentage, 100)
        };
    }
    
    /**
     * Clear all terrains (dangerous!)
     * @returns {number} Number of terrains cleared
     */
    clearAll() {
        if (!this._isAvailable()) return 0;
        
        const keys = [];
        
        // Collect keys to delete
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key.startsWith(this.prefix)) {
                keys.push(key);
            }
        }
        
        // Delete them
        keys.forEach(key => this.storage.removeItem(key));
        
        return keys.length;
    }
    
    /**
     * Check if terrain exists
     * @param {string} name - Terrain name
     * @returns {boolean} True if exists
     */
    exists(name) {
        if (!this._isAvailable()) return false;
        
        const key = this._getKey(name);
        return this.storage.getItem(key) !== null;
    }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalStorageManager;
}
