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
        
        // Callbacks
        this.onSave = null;
        this.onCancel = null;
        
        // Dialog dimensions (used for hit testing and rendering)
        this.dialogWidth = 500;
        this.dialogHeight = 300;
        
        // Use native file dialogs (false = custom UI, true = browser file picker)
        this.useNativeDialogs = false;
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
    
    /**
     * Render save dialog UI
     * Draws a centered modal dialog with filename input and save/cancel buttons
     */
    render() {
        if (!this.visible) return;
        
        push();
        
        // Use dialog dimensions from constructor
        const dialogX = (typeof g_canvasX !== 'undefined' ? g_canvasX : 1920) / 2 - this.dialogWidth / 2;
        const dialogY = (typeof g_canvasY !== 'undefined' ? g_canvasY : 1080) / 2 - this.dialogHeight / 2;
        
        // Draw semi-transparent overlay
        noStroke();
        fill(0, 0, 0, 180);
        rect(0, 0, typeof g_canvasX !== 'undefined' ? g_canvasX : 1920, typeof g_canvasY !== 'undefined' ? g_canvasY : 1080);
        
        // Draw dialog box
        fill(50, 50, 60);
        stroke(100, 100, 120);
        rect(dialogX, dialogY, this.dialogWidth, this.dialogHeight, 8);
        
        // Title
        fill(255);
        noStroke();
        textAlign(typeof CENTER !== 'undefined' ? CENTER : 'center', typeof TOP !== 'undefined' ? TOP : 'top');
        textSize(24);
        text('Save Terrain', dialogX + this.dialogWidth / 2, dialogY + 20);
        
        // Filename label
        textAlign(typeof LEFT !== 'undefined' ? LEFT : 'left', typeof TOP !== 'undefined' ? TOP : 'top');
        textSize(16);
        text('Filename:', dialogX + 30, dialogY + 80);
        
        // Filename input box
        fill(30, 30, 40);
        stroke(100, 100, 120);
        rect(dialogX + 30, dialogY + 110, this.dialogWidth - 60, 40, 4);
        
        // Filename text
        fill(255);
        noStroke();
        textAlign(typeof LEFT !== 'undefined' ? LEFT : 'left', typeof CENTER !== 'undefined' ? CENTER : 'center');
        textSize(16);
        const fullFilename = this.getFullFilename();
        text(fullFilename, dialogX + 40, dialogY + 130);
        
        // Format label
        textAlign(typeof LEFT !== 'undefined' ? LEFT : 'left', typeof TOP !== 'undefined' ? TOP : 'top');
        textSize(14);
        text('Format: ' + this.formats[this.format].name, dialogX + 30, dialogY + 170);
        
        // Buttons
        const buttonWidth = 120;
        const buttonHeight = 40;
        const buttonY = dialogY + this.dialogHeight - 60;
        const saveButtonX = dialogX + this.dialogWidth - 260;
        const cancelButtonX = dialogX + this.dialogWidth - 130;
        
        // Save button
        fill(60, 120, 60);
        stroke(80, 140, 80);
        rect(saveButtonX, buttonY, buttonWidth, buttonHeight, 4);
        fill(255);
        noStroke();
        textAlign(typeof CENTER !== 'undefined' ? CENTER : 'center', typeof CENTER !== 'undefined' ? CENTER : 'center');
        textSize(16);
        text('Save', saveButtonX + buttonWidth / 2, buttonY + buttonHeight / 2);
        
        // Cancel button
        fill(120, 60, 60);
        stroke(140, 80, 80);
        rect(cancelButtonX, buttonY, buttonWidth, buttonHeight, 4);
        fill(255);
        noStroke();
        text('Cancel', cancelButtonX + buttonWidth / 2, buttonY + buttonHeight / 2);
        
        pop();
    }
    
    /**
     * Check if a point is inside the dialog box
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if point is inside dialog
     */
    isPointInside(x, y) {
        if (!this.visible) return false;
        
        const dialogX = (typeof g_canvasX !== 'undefined' ? g_canvasX : 1920) / 2 - this.dialogWidth / 2;
        const dialogY = (typeof g_canvasY !== 'undefined' ? g_canvasY : 1080) / 2 - this.dialogHeight / 2;
        
        return x >= dialogX && x <= dialogX + this.dialogWidth &&
               y >= dialogY && y <= dialogY + this.dialogHeight;
    }
    
    /**
     * Handle mouse click on dialog
     * @param {number} x - X coordinate of click
     * @param {number} y - Y coordinate of click
     * @returns {boolean} True if click was consumed (inside dialog), false if passthrough
     */
    handleClick(x, y) {
        if (!this.visible) return false;
        
        const dialogX = (typeof g_canvasX !== 'undefined' ? g_canvasX : 1920) / 2 - this.dialogWidth / 2;
        const dialogY = (typeof g_canvasY !== 'undefined' ? g_canvasY : 1080) / 2 - this.dialogHeight / 2;
        
        // Check if click is outside dialog - allow passthrough
        if (!this.isPointInside(x, y)) {
            return false;
        }
        
        // Click is inside dialog - consume it
        const buttonWidth = 120;
        const buttonHeight = 40;
        const buttonY = dialogY + this.dialogHeight - 60;
        const saveButtonX = dialogX + this.dialogWidth - 260;
        const cancelButtonX = dialogX + this.dialogWidth - 130;
        
        // Check Save button
        if (x >= saveButtonX && x <= saveButtonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            if (this.onSave) this.onSave();
            return true;
        }
        
        // Check Cancel button
        if (x >= cancelButtonX && x <= cancelButtonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            if (this.onCancel) this.onCancel();
            return true;
        }
        
        // Click inside dialog but not on buttons - still consume
        return true;
    }
    
    /**
     * Handle keyboard input
     * @param {string} key - Key pressed
     * @returns {boolean} True if key was consumed
     */
    handleKeyPress(key) {
        if (!this.visible) return false;
        
        // Handle special keys
        if (key === 'Backspace') {
            if (this.filename.length > 0) {
                this.filename = this.filename.slice(0, -1);
            }
            return true;
        }
        
        if (key === 'Enter') {
            if (this.onSave) this.onSave();
            return true;
        }
        
        if (key === 'Escape') {
            if (this.onCancel) this.onCancel();
            return true;
        }
        
        // Handle alphanumeric and allowed characters
        if (key.length === 1) {
            const allowedChars = /[a-zA-Z0-9_\-\.]/;
            if (allowedChars.test(key)) {
                this.filename += key;
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Open native file dialog (browser's save dialog)
     * Creates a download link to trigger browser's save-as dialog
     * @param {Object} data - Data to save
     * @param {string} filename - Suggested filename
     */
    saveWithNativeDialog(data, filename) {
        // Check for document in both browser and test contexts
        const doc = (typeof document !== 'undefined') ? document : 
                    (typeof global !== 'undefined' && typeof global.document !== 'undefined') ? global.document : null;
        
        // Check for Blob in both browser and test contexts
        const BlobConstructor = (typeof Blob !== 'undefined') ? Blob :
                                (typeof global !== 'undefined' && typeof global.Blob !== 'undefined') ? global.Blob : null;
        
        // Check for URL in both browser and test contexts
        const URLObject = (typeof URL !== 'undefined') ? URL :
                          (typeof global !== 'undefined' && typeof global.URL !== 'undefined') ? global.URL : null;
        
        if (!doc || !BlobConstructor || !URLObject) {
            console.error('Native file dialog not supported in this environment');
            return;
        }
        
        try {
            // Convert data to JSON string
            const jsonString = JSON.stringify(data, null, 2);
            
            // Create blob with JSON data
            const blob = new BlobConstructor([jsonString], { type: 'application/json' });
            
            // Create download link
            const url = URLObject.createObjectURL(blob);
            const anchor = doc.createElement('a');
            anchor.setAttribute('href', url);
            anchor.setAttribute('download', filename || this.getFullFilename());
            
            // Only set style if it exists (for testing compatibility)
            if (anchor.style) {
                anchor.style.display = 'none';
            }
            
            // Trigger download
            doc.body.appendChild(anchor);
            anchor.click();
            
            // Cleanup
            doc.body.removeChild(anchor);
            URLObject.revokeObjectURL(url);
            
            // Hide dialog after save
            this.hide();
        } catch (error) {
            console.error('Error saving file with native dialog:', error);
        }
    }
    
    /**
     * Open native file picker (not typically used for save, but for consistency)
     * Note: Browser save dialogs are triggered via download links, not file inputs
     */
    openNativeFileDialog() {
        // Check for document in both browser and test contexts
        const doc = (typeof document !== 'undefined') ? document : 
                    (typeof global !== 'undefined' && typeof global.document !== 'undefined') ? global.document : null;
        
        if (!doc) {
            console.error('Native file dialog not supported in this environment');
            return;
        }
        
        // Create hidden file input
        const input = doc.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', '.json');
        
        // Only set style if it exists (for testing compatibility)
        if (input.style) {
            input.style.display = 'none';
        }
        
        // Trigger file picker
        doc.body.appendChild(input);
        input.click();
        
        // Cleanup
        setTimeout(() => {
            if (input.parentNode) {
                doc.body.removeChild(input);
            }
        }, 1000);
    }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaveDialog;
}
