/**
 * ServerUpload - Server integration for terrain upload/download
 * 
 * Handles server communication for:
 * - Uploading terrain files
 * - Downloading terrain files
 * - Error handling
 */
class ServerUpload {
    /**
     * Create a server upload handler
     * @param {string} uploadUrl - Server upload endpoint
     */
    constructor(uploadUrl = '/api/terrain/upload') {
        this.uploadUrl = uploadUrl;
        this.downloadUrl = '/api/terrain/download';
    }
    
    /**
     * Prepare upload request
     * @param {Object} data - Terrain data
     * @param {string} filename - Filename
     * @returns {Object} Request object {url, method, headers, body}
     */
    prepareRequest(data, filename) {
        const formData = {
            filename: filename,
            data: JSON.stringify(data),
            timestamp: new Date().toISOString()
        };
        
        return {
            url: this.uploadUrl,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        };
    }
    
    /**
     * Handle upload response
     * @param {number} statusCode - HTTP status code
     * @param {Object} response - Response data
     * @returns {Object} {success, fileId, url, error}
     */
    handleResponse(statusCode, response) {
        if (statusCode >= 200 && statusCode < 300) {
            return {
                success: true,
                fileId: response.fileId || null,
                url: response.url || null
            };
        }
        
        return {
            success: false,
            error: response.error || 'Upload failed'
        };
    }
    
    /**
     * Handle upload error
     * @param {string} errorType - Error type (NETWORK_ERROR, SERVER_ERROR, etc.)
     * @returns {string} User-friendly error message
     */
    handleError(errorType) {
        const errorMessages = {
            'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
            'SERVER_ERROR': 'Server error occurred. Please try again later.',
            'TIMEOUT': 'Upload timed out. Please try again.',
            'FILE_TOO_LARGE': 'File is too large to upload.',
            'INVALID_FORMAT': 'Invalid file format.',
            'UNAUTHORIZED': 'You are not authorized to upload files.'
        };
        
        return errorMessages[errorType] || 'An unknown error occurred.';
    }
    
    /**
     * Set upload URL
     * @param {string} url - Upload endpoint URL
     */
    setUploadUrl(url) {
        this.uploadUrl = url;
    }
    
    /**
     * Get upload URL
     * @returns {string} Upload endpoint URL
     */
    getUploadUrl() {
        return this.uploadUrl;
    }
}

/**
 * ServerDownload - Server integration for terrain download
 */
class ServerDownload {
    /**
     * Create a server download handler
     * @param {string} downloadUrl - Server download endpoint
     */
    constructor(downloadUrl = '/api/terrain/download') {
        this.downloadUrl = downloadUrl;
        this.listUrl = '/api/terrain/list';
    }
    
    /**
     * Fetch file list from server
     * @returns {Promise<Array>} Promise resolving to file list
     */
    async fetchFileList() {
        // In real implementation, this would make an HTTP request
        // For now, return a mock implementation
        return Promise.resolve([]);
    }
    
    /**
     * Generate download URL for a file
     * @param {string} fileId - File ID
     * @returns {string} Download URL
     */
    getDownloadUrl(fileId) {
        return `${this.downloadUrl}/${fileId}`;
    }
    
    /**
     * Prepare download request
     * @param {string} fileId - File ID to download
     * @returns {Object} Request object
     */
    prepareDownloadRequest(fileId) {
        return {
            url: this.getDownloadUrl(fileId),
            method: 'GET',
            headers: {}
        };
    }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ServerUpload, ServerDownload };
}
