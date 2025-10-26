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
        
        // Callbacks
        this.onLoad = null;
        this.onCancel = null;
        
        // Dialog dimensions (used for hit testing and rendering)
        this.dialogWidth = 600;
        this.dialogHeight = 400;
        
        // Use native file dialogs (false = custom UI, true = browser file picker)
        this.useNativeDialogs = false;
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
    
    /**
     * Render load dialog UI
     * Draws a centered modal dialog with file list and load/cancel buttons
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
        text('Load Terrain', dialogX + this.dialogWidth / 2, dialogY + 20);
        
        // File list area
        fill(30, 30, 40);
        stroke(100, 100, 120);
        rect(dialogX + 30, dialogY + 70, this.dialogWidth - 60, 240, 4);
        
        // Render file list
        fill(255);
        noStroke();
        textAlign(typeof LEFT !== 'undefined' ? LEFT : 'left', typeof TOP !== 'undefined' ? TOP : 'top');
        textSize(14);
        
        const fileList = this.getFileList();
        const maxFiles = 10; // Show max 10 files
        const fileY = dialogY + 85;
        const lineHeight = 22;
        
        if (fileList.length === 0) {
            fill(150);
            text('No files found', dialogX + 40, fileY);
        } else {
            fileList.slice(0, maxFiles).forEach((filename, i) => {
                const isSelected = this.selectedFile && this.selectedFile.name === filename;
                
                // Highlight selected file
                if (isSelected) {
                    fill(80, 100, 120, 180);
                    noStroke();
                    rect(dialogX + 35, fileY + i * lineHeight - 2, this.dialogWidth - 70, lineHeight - 2, 2);
                    fill(255, 255, 100);
                } else {
                    fill(255);
                }
                
                noStroke();
                text(filename, dialogX + 40, fileY + i * lineHeight);
            });
            
            // Show count if more files exist
            if (fileList.length > maxFiles) {
                fill(150);
                textSize(12);
                text(`... and ${fileList.length - maxFiles} more`, dialogX + 40, fileY + maxFiles * lineHeight);
            }
        }
        
        // Buttons
        const buttonWidth = 120;
        const buttonHeight = 40;
        const buttonY = dialogY + this.dialogHeight - 60;
        const loadButtonX = dialogX + this.dialogWidth - 260;
        const cancelButtonX = dialogX + this.dialogWidth - 130;
        
        // Load button (enabled only if file selected)
        const canLoad = this.selectedFile !== null;
        if (canLoad) {
            fill(60, 120, 60);
            stroke(80, 140, 80);
        } else {
            fill(40, 40, 50);
            stroke(60, 60, 70);
        }
        rect(loadButtonX, buttonY, buttonWidth, buttonHeight, 4);
        fill(canLoad ? 255 : 120);
        noStroke();
        textAlign(typeof CENTER !== 'undefined' ? CENTER : 'center', typeof CENTER !== 'undefined' ? CENTER : 'center');
        textSize(16);
        text('Load', loadButtonX + buttonWidth / 2, buttonY + buttonHeight / 2);
        
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
        const loadButtonX = dialogX + this.dialogWidth - 260;
        const cancelButtonX = dialogX + this.dialogWidth - 130;
        
        // Check Load button (only if file selected)
        if (x >= loadButtonX && x <= loadButtonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            if (this.selectedFile && this.onLoad) {
                this.onLoad();
            }
            return true;
        }
        
        // Check Cancel button
        if (x >= cancelButtonX && x <= cancelButtonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            if (this.onCancel) this.onCancel();
            return true;
        }
        
        // Check file list clicks
        const fileListX = dialogX + 30;
        const fileListY = dialogY + 70;
        const fileListWidth = this.dialogWidth - 60;
        const fileListHeight = 240;
        
        if (x >= fileListX && x <= fileListX + fileListWidth &&
            y >= fileListY && y <= fileListY + fileListHeight) {
            // Click in file list area
            const fileY = dialogY + 85;
            const lineHeight = 22;
            const fileList = this.getFileList();
            const maxFiles = 10;
            
            const clickedIndex = Math.floor((y - fileY) / lineHeight);
            if (clickedIndex >= 0 && clickedIndex < Math.min(fileList.length, maxFiles)) {
                this.selectFile(fileList[clickedIndex]);
            }
            return true;
        }
        
        // Click inside dialog but not on interactive elements - still consume
        return true;
    }
    
    /**
     * Open native file picker dialog (browser's open dialog)
     * Allows user to select a JSON file from their file system
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
        
        // Handle file selection (only if addEventListener is available)
        if (typeof input.addEventListener === 'function') {
            input.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    this.loadFromNativeDialog(file);
                }
                
                // Cleanup
                if (input.parentNode) {
                    doc.body.removeChild(input);
                }
            });
        }
        
        // Trigger file picker
        doc.body.appendChild(input);
        input.click();
    }
    
    /**
     * Load file from native dialog selection
     * @param {File} file - Selected file object from file input
     */
    loadFromNativeDialog(file) {
        if (!file) return;
        
        // Check if FileReader is available in both browser and test contexts
        const FileReaderConstructor = (typeof FileReader !== 'undefined') ? FileReader :
                                      (typeof global !== 'undefined' && typeof global.FileReader !== 'undefined') ? global.FileReader : null;
        
        if (!FileReaderConstructor) {
            console.error('FileReader not supported in this environment');
            return;
        }
        
        const reader = new FileReaderConstructor();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Store filename and data
                this.selectedFile = {
                    name: file.name,
                    data: data
                };
                
                // Call load callback with data
                if (this.onLoad) {
                    this.onLoad(data);
                }
                
                // Hide dialog
                this.hide();
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                if (typeof alert !== 'undefined') {
                    alert('Error: Invalid JSON file');
                }
            }
        };
        
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            if (typeof alert !== 'undefined') {
                alert('Error reading file');
            }
        };
        
        reader.readAsText(file);
    }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadDialog;
}
