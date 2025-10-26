/**
 * LoadDialog - UI component for terrain load dialog
 * 
 * Provides a dialog for loading terrain with:
 * - File listing
 * - Date sorting
 * - Search filtering
 * - File preview
 * - Validation
 */
class LoadDialog {
    /**
     * Create a load dialog
     */
    constructor() {
        this.visible = false;
        this.files = [];
        this.selectedFile = null;
        this.searchTerm = '';
        this.sortOrder = 'date'; // 'date' or 'name'
    }
    
    /**
     * Set available files
     * @param {Array<Object>} files - Files with {name, date, size, preview}
     */
    setFiles(files) {
        this.files = files;
    }
    
    /**
     * Get file list (filtered and sorted)
     * @returns {Array<string>} File names
     */
    getFileList() {
        let filtered = this.files;
        
        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(f => 
                f.name.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        }
        
        // Return just names
        return filtered.map(f => f.name);
    }
    
    /**
     * Sort files by date (newest first)
     * @returns {Array<Object>} Sorted files
     */
    sortByDate() {
        const sorted = [...this.files].sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB - dateA; // Newest first
        });
        this.files = sorted;
        return sorted;
    }
    
    /**
     * Sort files by name
     * @returns {Array<Object>} Sorted files
     */
    sortByName() {
        const sorted = [...this.files].sort((a, b) => 
            a.name.localeCompare(b.name)
        );
        this.files = sorted;
        return sorted;
    }
    
    /**
     * Set search term
     * @param {string} term - Search term
     */
    search(term) {
        this.searchTerm = term;
    }
    
    /**
     * Select a file
     * @param {string} filename - File to select
     * @returns {boolean} True if file exists
     */
    selectFile(filename) {
        const file = this.files.find(f => f.name === filename);
        if (file) {
            this.selectedFile = file;
            return true;
        }
        return false;
    }
    
    /**
     * Get selected file
     * @returns {Object|null} Selected file
     */
    getSelectedFile() {
        return this.selectedFile;
    }
    
    /**
     * Get file preview data
     * @param {string} filename - File to preview (optional, uses selected)
     * @returns {Object|null} Preview data
     */
    getPreview(filename = null) {
        const file = filename 
            ? this.files.find(f => f.name === filename)
            : this.selectedFile;
            
        if (!file || !file.preview) return null;
        
        return file.preview;
    }
    
    /**
     * Validate file data before loading
     * @param {Object} data - File data to validate
     * @returns {Object} {valid: boolean, errors: Array}
     */
    validateFile(data) {
        const errors = [];
        
        if (!data) {
            errors.push('No data provided');
            return { valid: false, errors };
        }
        
        // Support both old format (data.version) and new format (data.metadata.version)
        if (!data.version && (!data.metadata || !data.metadata.version)) {
            errors.push('Missing version information');
        }
        
        // Support both old format (data.terrain.grid) and new format (data.tiles)
        if (!data.tiles && (!data.terrain || !data.terrain.grid)) {
            errors.push('Missing terrain data');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Show load dialog
     */
    show() {
        this.visible = true;
    }
    
    /**
     * Hide load dialog
     */
    hide() {
        this.visible = false;
        this.selectedFile = null;
        this.searchTerm = '';
    }
    
    /**
     * Check if dialog is visible
     * @returns {boolean} Visibility state
     */
    isVisible() {
        return this.visible;
    }
    
    /**
     * Clear search
     */
    clearSearch() {
        this.searchTerm = '';
    }
    
    /**
     * Get file count
     * @returns {number} Total files
     */
    getFileCount() {
        return this.files.length;
    }
    
    /**
     * Get filtered file count
     * @returns {number} Filtered files
     */
    getFilteredCount() {
        return this.getFileList().length;
    }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadDialog;
}
