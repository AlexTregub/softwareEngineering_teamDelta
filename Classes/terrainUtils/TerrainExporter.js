/**
 * TerrainExporter - Export terrain data to various formats
 * Integrates with gridTerrain to save maps to files
 */

class TerrainExporter {
  constructor(terrain) {
    this._terrain = terrain;
  }

  /**
   * Export terrain to JSON format
   * @param {Object} options - Export options
   * @param {boolean} options.compressed - Use run-length encoding
   * @param {boolean} options.chunked - Use chunk-based format with default material
   * @param {Object} options.customMetadata - Additional metadata to include
   * @returns {Object} JSON representation of terrain
   */
  exportToJSON(options = {}) {
    const { compressed = false, chunked = false, customMetadata = {} } = options;

    const metadata = {
      version: '1.0',
      gridSizeX: this._terrain._gridSizeX,
      gridSizeY: this._terrain._gridSizeY,
      chunkSize: this._terrain._chunkSize,
      tileSize: this._terrain._tileSize,
      seed: this._terrain._seed,
      exportDate: new Date().toISOString(),
      ...customMetadata
    };

    let tileData;
    if (chunked) {
      tileData = this._exportChunked();
    } else if (compressed) {
      tileData = this._exportCompressed();
    } else {
      tileData = this._exportFull();
    }

    const exported = {
      metadata,
      tiles: tileData
    };

    return exported;
  }

  /**
   * Export full tile array (uncompressed)
   * @returns {Array} Array of material names
   * @private
   */
  _exportFull() {
    const tiles = [];
    const totalTilesX = this._terrain._gridSizeX * this._terrain._chunkSize;
    const totalTilesY = this._terrain._gridSizeY * this._terrain._chunkSize;

    for (let y = 0; y < totalTilesY; y++) {
      for (let x = 0; x < totalTilesX; x++) {
        const tile = this._terrain.getArrPos([x, y]);
        tiles.push(tile.getMaterial());
      }
    }

    return tiles;
  }

  /**
   * Export compressed tile data using run-length encoding
   * @returns {string} Compressed string representation
   * @private
   */
  _exportCompressed() {
    const tiles = this._exportFull();
    const compressed = [];
    
    let currentMaterial = tiles[0];
    let count = 1;

    for (let i = 1; i < tiles.length; i++) {
      if (tiles[i] === currentMaterial) {
        count++;
      } else {
        compressed.push(`${count}:${currentMaterial}`);
        currentMaterial = tiles[i];
        count = 1;
      }
    }
    compressed.push(`${count}:${currentMaterial}`);

    return compressed.join(',');
  }

  /**
   * Export chunk-based format with default material and exceptions
   * @returns {Object} Chunk-based representation
   * @private
   */
  _exportChunked() {
    const defaultMaterial = this._findMostCommonMaterial();
    const exceptions = [];
    
    const totalTilesX = this._terrain._gridSizeX * this._terrain._chunkSize;
    const totalTilesY = this._terrain._gridSizeY * this._terrain._chunkSize;

    for (let y = 0; y < totalTilesY; y++) {
      for (let x = 0; x < totalTilesX; x++) {
        const tile = this._terrain.getArrPos([x, y]);
        const material = tile.getMaterial();
        
        if (material !== defaultMaterial) {
          exceptions.push({
            x,
            y,
            material
          });
        }
      }
    }

    return {
      defaultMaterial,
      exceptions
    };
  }

  /**
   * Find the most common material in terrain
   * @returns {string} Most common material name
   * @private
   */
  _findMostCommonMaterial() {
    const materialCounts = {};
    const totalTilesX = this._terrain._gridSizeX * this._terrain._chunkSize;
    const totalTilesY = this._terrain._gridSizeY * this._terrain._chunkSize;

    for (let y = 0; y < totalTilesY; y++) {
      for (let x = 0; x < totalTilesX; x++) {
        const tile = this._terrain.getArrPos([x, y]);
        const material = tile.getMaterial();
        materialCounts[material] = (materialCounts[material] || 0) + 1;
      }
    }

    let mostCommon = null;
    let maxCount = 0;
    for (const [material, count] of Object.entries(materialCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = material;
      }
    }

    return mostCommon;
  }

  /**
   * Validate exported data structure
   * @param {Object} data - Exported data
   * @returns {Object} Validation result
   */
  validateExport(data) {
    const errors = [];

    // Check required metadata fields
    if (!data.metadata) {
      errors.push('Missing metadata object');
    } else {
      if (!data.metadata.version) errors.push('Missing version');
      if (typeof data.metadata.gridSizeX !== 'number') errors.push('Invalid gridSizeX');
      if (typeof data.metadata.gridSizeY !== 'number') errors.push('Invalid gridSizeY');
    }

    // Check tiles data
    if (!data.tiles) {
      errors.push('Missing tiles data');
    } else if (typeof data.tiles === 'object' && data.tiles.defaultMaterial) {
      // Chunked format
      if (!Array.isArray(data.tiles.exceptions)) {
        errors.push('Invalid chunked format: exceptions must be array');
      }
    } else if (typeof data.tiles === 'string') {
      // Compressed format
      if (!data.tiles.match(/^\d+:\w+/)) {
        errors.push('Invalid compressed format');
      }
    } else if (!Array.isArray(data.tiles)) {
      errors.push('Invalid tiles format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate filename for exported terrain
   * @param {string} baseName - Base filename
   * @returns {string} Sanitized filename
   */
  generateFilename(baseName = 'terrain') {
    const sanitized = baseName.replace(/[^a-z0-9_-]/gi, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${sanitized}_${timestamp}.json`;
  }

  /**
   * Calculate export size in bytes
   * @param {Object} data - Exported data
   * @returns {number} Size in bytes
   */
  calculateSize(data) {
    return JSON.stringify(data).length;
  }

  /**
   * Get compression ratio
   * @param {Object} uncompressed - Uncompressed export
   * @param {Object} compressed - Compressed export
   * @returns {number} Compression ratio (0-1)
   */
  getCompressionRatio(uncompressed, compressed) {
    const uncompressedSize = this.calculateSize(uncompressed);
    const compressedSize = this.calculateSize(compressed);
    return compressedSize / uncompressedSize;
  }

  /**
   * Format size as human-readable string
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size (e.g., "1.5 KB")
   */
  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Export to JSON string
   * @param {Object} options - Export options
   * @returns {string} JSON string
   */
  exportToString(options = {}) {
    const data = this.exportToJSON(options);
    return JSON.stringify(data, null, 2);
  }

  /**
   * Get MIME type for export format
   * @returns {string} MIME type
   */
  getMimeType() {
    return 'application/json';
  }

  // ========================================
  // Convenience Methods for GridTerrain Integration
  // ========================================

  /**
   * Export compressed terrain data
   * Convenience method for exportToJSON({ compressed: true })
   * @param {Object} customMetadata - Additional metadata (optional)
   * @returns {Object} Compressed JSON export
   */
  exportCompressed(customMetadata = {}) {
    return this.exportToJSON({ compressed: true, customMetadata });
  }

  /**
   * Export chunked terrain data
   * Convenience method for exportToJSON({ chunked: true })
   * @param {Object} customMetadata - Additional metadata (optional)
   * @returns {Object} Chunked JSON export
   */
  exportChunked(customMetadata = {}) {
    return this.exportToJSON({ chunked: true, customMetadata });
  }

  /**
   * Export full uncompressed terrain data
   * Convenience method for exportToJSON() with no options
   * @param {Object} customMetadata - Additional metadata (optional)
   * @returns {Object} Full JSON export
   */
  exportFull(customMetadata = {}) {
    return this.exportToJSON({ customMetadata });
  }

  /**
   * Export in gridTerrain-compatible format
   * Returns flattened structure with version at top level
   * Alternative to the standard metadata/tiles structure
   * @param {Object} options - Export options
   * @returns {Object} GridTerrain-compatible export
   */
  exportForGridTerrain(options = {}) {
    const standard = this.exportToJSON(options);
    
    return {
      version: standard.metadata.version,
      terrain: {
        width: standard.metadata.gridSizeX,
        height: standard.metadata.gridSizeY,
        grid: standard.tiles,
        seed: standard.metadata.seed,
        chunkSize: standard.metadata.chunkSize,
        tileSize: standard.metadata.tileSize,
        exportDate: standard.metadata.exportDate
      }
    };
  }
}
