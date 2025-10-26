/**
 * SaveDialog - UI component for terrain save dialog
 * 
 * Provides a dialog for saving terrain with:
 * - Filename validation
 * - Format selection (JSON, compressed, chunked)
 * - Overwrite warnings
 * - Size estimation
 */
class SaveDialog {
    /**
     * Create a save dialog
     */
    constructor() {
        this.filename = this._generateDefaultFilename();
        this.format = 'json';
        this.visible = false;
        this.existingFiles = [];
        
        // Available formats
        this.formats = {
            'json': { name: 'JSON (Standard)', extension: '.json' },
            'json-compressed': { name: 'JSON (Compressed)', extension: '.json' },
            'json-chunked': { name: 'JSON (Chunked)', extension: '.json' },
            'png': { name: 'PNG Image', extension: '.png' },
            'dat': { name: 'Binary Data', extension: '.dat' }
        };
    }
    
    /**
     * Generate default filename with timestamp
     * @returns {string} Default filename
     * @private
     */
    _generateDefaultFilename() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `terrain_${year}-${month}-${day}`;
    }
    
    /**
     * Set filename
     * @param {string} filename - Filename without extension
     */
    setFilename(filename) {
        this.filename = filename;
    }
    
    /**
     * Get current filename
     * @returns {string} Filename
     */
    getFilename() {
        return this.filename;
    }
    
    /**
     * Validate filename
     * @param {string} filename - Filename to validate
     * @returns {Object} {valid: boolean, error: string}
     */
    validateFilename(filename) {
        if (!filename || filename.trim() === '') {
            return { valid: false, error: 'Filename cannot be empty' };
        }
        
        // Check for invalid characters (only allow alphanumeric, underscore, hyphen, and dot)
        const invalidChars = /[^a-zA-Z0-9_\-\.]/;
        if (invalidChars.test(filename)) {
            return { valid: false, error: 'Filename contains invalid characters' };
        }
        
        return { valid: true };
    }
    
    /**
     * Set export format
     * @param {string} format - Format key
     * @returns {boolean} True if format exists
     */
    setFormat(format) {
        if (this.formats[format]) {
            this.format = format;
            return true;
        }
        return false;
    }
    
    /**
     * Get current format
     * @returns {string} Format key
     */
    getFormat() {
        return this.format;
    }
    
    /**
     * Get full filename with extension
     * @param {string} filename - Base filename (optional, uses current if not provided)
     * @returns {string} Filename with extension
     */
    getFullFilename(filename = null) {
        const base = filename || this.filename;
        const extension = this.formats[this.format].extension;
        
        // Don't add extension if already present
        if (base.endsWith(extension)) {
            return base;
        }
        
        return base + extension;
    }
    
    /**
     * Check if file exists (would overwrite)
     * @param {string} filename - Filename to check
     * @returns {boolean} True if file exists
     */
    checkOverwrite(filename) {
        return this.existingFiles.includes(filename);
    }
    
    /**
     * Set list of existing files
     * @param {Array<string>} files - Existing filenames
     */
    setExistingFiles(files) {
        this.existingFiles = files;
    }
    
    /**
     * Show save dialog
     * @param {string} defaultFilename - Optional default filename
     */
    show(defaultFilename = null) {
        this.visible = true;
        if (defaultFilename) {
            this.filename = defaultFilename;
        }
    }
    
    /**
     * Hide save dialog
     */
    hide() {
        this.visible = false;
    }
    
    /**
     * Check if dialog is visible
     * @returns {boolean} Visibility state
     */
    isVisible() {
        return this.visible;
    }
    
    /**
     * Estimate file size based on terrain data
     * @param {Object} terrainData - Terrain data to estimate
     * @returns {number} Estimated size in bytes
     */
    estimateSize(terrainData = null) {
        if (!terrainData) {
            return 0;
        }
        
        // Rough estimation based on JSON stringification
        const jsonString = JSON.stringify(terrainData);
        let size = jsonString.length;
        
        // Adjust for format
        if (this.format === 'json-compressed') {
            size = Math.floor(size * 0.4); // Assume ~60% compression
        } else if (this.format === 'json-chunked') {
            size = Math.floor(size * 1.1); // Slightly larger due to chunk metadata
        }
        
        return size;
    }
    
    /**
     * Format file size for display
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size (e.g., "1.50 KB")
     */
    formatSize(bytes) {
        if (bytes < 1024) {
            return bytes + ' B';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(2) + ' KB';
        } else {
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }
    }
    
    /**
     * Get available formats
     * @returns {Array<Object>} Formats with {key, name, extension}
     */
    getAvailableFormats() {
        return Object.entries(this.formats).map(([key, value]) => ({
            key: key,
            name: value.name,
            extension: value.extension
        }));
    }
    
    /**
     * Generate filename with timestamp
     * @param {string} prefix - Filename prefix
     * @returns {string} Generated filename
     */
    generateTimestampedFilename(prefix = 'terrain') {
        const date = new Date();
        const timestamp = date.getTime();
        return `${prefix}_${timestamp}`;
    }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaveDialog;
}
