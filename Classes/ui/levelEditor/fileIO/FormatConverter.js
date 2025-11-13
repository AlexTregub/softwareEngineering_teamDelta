/**
 * FormatConverter - Convert between terrain file formats
 * 
 * Supports conversion between:
 * - JSON standard format
 * - JSON compressed format
 * - JSON chunked format
 */
class FormatConverter {
    /**
     * Create a format converter
     */
    constructor() {
        this.supportedFormats = ['json', 'json-compressed', 'json-chunked'];
    }
    
    /**
     * Convert data to compressed format
     * @param {Object} data - Terrain data
     * @returns {Object} Compressed data
     */
    toCompressed(data) {
        if (!data || !data.terrain || !data.terrain.grid) {
            return data;
        }
        
        const compressed = {
            version: data.version || '1.0',
            format: 'compressed',
            terrain: {
                width: data.terrain.width,
                height: data.terrain.height,
                grid: this._compressGrid(data.terrain.grid)
            }
        };
        
        // Copy other properties
        if (data.metadata) compressed.metadata = data.metadata;
        if (data.entities) compressed.entities = data.entities;
        if (data.resources) compressed.resources = data.resources;
        
        return compressed;
    }
    
    /**
     * Compress grid using RLE (Run-Length Encoding)
     * @param {Array} grid - Grid data
     * @returns {Object} Compressed grid
     * @private
     */
    _compressGrid(grid) {
        const runs = [];
        let currentMaterial = null;
        let count = 0;
        
        for (let i = 0; i < grid.length; i++) {
            const material = grid[i];
            
            if (material === currentMaterial) {
                count++;
            } else {
                if (currentMaterial !== null) {
                    runs.push({ material: currentMaterial, count: count });
                }
                currentMaterial = material;
                count = 1;
            }
        }
        
        // Add final run
        if (currentMaterial !== null) {
            runs.push({ material: currentMaterial, count: count });
        }
        
        return { type: 'rle', runs: runs };
    }
    
    /**
     * Check if conversion is possible
     * @param {string} fromFormat - Source format
     * @param {string} toFormat - Target format
     * @returns {boolean} True if conversion supported
     */
    canConvert(fromFormat, toFormat) {
        return this.supportedFormats.includes(fromFormat) && 
               this.supportedFormats.includes(toFormat);
    }
    
    /**
     * Convert data between formats
     * @param {Object} data - Source data
     * @param {string} targetFormat - Target format
     * @returns {Object} Converted data
     */
    convert(data, targetFormat) {
        if (!this.supportedFormats.includes(targetFormat)) {
            throw new Error(`Unsupported format: ${targetFormat}`);
        }
        
        // Normalize to standard format first
        let normalized = this._normalizeToStandard(data);
        
        // Convert to target format
        switch (targetFormat) {
            case 'json':
                return normalized;
            case 'json-compressed':
                return this.toCompressed(normalized);
            case 'json-chunked':
                return this._toChunked(normalized);
            default:
                return normalized;
        }
    }
    
    /**
     * Normalize any format to standard JSON
     * @param {Object} data - Data in any format
     * @returns {Object} Standard format data
     * @private
     */
    _normalizeToStandard(data) {
        if (!data || !data.terrain) return data;
        
        // If already standard, return as-is
        if (!data.format || data.format === 'standard') {
            return data;
        }
        
        // Decompress if needed
        if (data.format === 'compressed' && data.terrain.grid.type === 'rle') {
            return this._decompressRLE(data);
        }
        
        // De-chunk if needed
        if (data.format === 'chunked') {
            return this._dechunk(data);
        }
        
        return data;
    }
    
    /**
     * Decompress RLE format
     * @param {Object} data - Compressed data
     * @returns {Object} Decompressed data
     * @private
     */
    _decompressRLE(data) {
        const grid = [];
        const runs = data.terrain.grid.runs;
        
        for (const run of runs) {
            for (let i = 0; i < run.count; i++) {
                grid.push(run.material);
            }
        }
        
        return {
            version: data.version,
            format: 'standard',
            terrain: {
                width: data.terrain.width,
                height: data.terrain.height,
                grid: grid
            },
            metadata: data.metadata,
            entities: data.entities,
            resources: data.resources
        };
    }
    
    /**
     * Convert to chunked format
     * @param {Object} data - Standard format data
     * @returns {Object} Chunked data
     * @private
     */
    _toChunked(data) {
        // Simple implementation: divide grid into chunks
        const chunkSize = 16;
        const chunks = [];
        
        if (data.terrain && data.terrain.grid) {
            // For simplicity, just mark as chunked format
            return {
                ...data,
                format: 'chunked',
                chunkSize: chunkSize
            };
        }
        
        return data;
    }
    
    /**
     * Dechunk format
     * @param {Object} data - Chunked data
     * @returns {Object} Standard data
     * @private
     */
    _dechunk(data) {
        // Reverse of chunking
        return {
            ...data,
            format: 'standard'
        };
    }
    
    /**
     * Get supported formats
     * @returns {Array<string>} Supported format names
     */
    getSupportedFormats() {
        return [...this.supportedFormats];
    }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormatConverter;
}
