/**
 * TerrainImporter - Import terrain data from various formats
 * Integrates with gridTerrain to load maps from files
 */

class TerrainImporter {
  constructor(terrain) {
    this._terrain = terrain;
    this._migrations = {
      '1.0': this._migrateFrom1_0.bind(this)
    };
  }

  /**
   * Import terrain from JSON data
   * @param {Object} data - Imported JSON data
   * @param {Object} options - Import options
   * @returns {boolean} Success status
   */
  importFromJSON(data, options = {}) {
    const { validate = true, applyDefaults = true } = options;

    // Validate data
    if (validate) {
      const validation = this.validateImport(data);
      if (!validation.valid) {
        console.error('Import validation failed:', validation.errors);
        return false;
      }
    }

    // Migrate if needed
    const migratedData = this._migrateData(data);

    // Apply defaults if missing
    const finalData = applyDefaults ? this._applyDefaults(migratedData) : migratedData;

    // Import tiles based on format
    if (typeof finalData.tiles === 'string') {
      this._importCompressed(this._terrain, finalData);
    } else if (finalData.tiles.defaultMaterial) {
      this._importChunked(this._terrain, finalData);
    } else if (Array.isArray(finalData.tiles)) {
      this._importFull(this._terrain, finalData);
    } else {
      console.error('Unknown tile format');
      return false;
    }

    // Import entities if present
    if (finalData.entities) {
      this._importEntities(this._terrain, finalData.entities);
    }

    // Import resources if present
    if (finalData.resources) {
      this._importResources(this._terrain, finalData.resources);
    }

    // Invalidate cache to force re-render
    if (this._terrain.invalidateCache) {
      this._terrain.invalidateCache();
    }

    return true;
  }

  /**
   * Import full tile array
   * @param {gridTerrain} terrain - Target terrain
   * @param {Object} data - Import data
   * @private
   */
  _importFull(terrain, data) {
    const totalTilesX = terrain._gridSizeX * terrain._chunkSize;
    const totalTilesY = terrain._gridSizeY * terrain._chunkSize;

    let index = 0;
    for (let y = 0; y < totalTilesY; y++) {
      for (let x = 0; x < totalTilesX; x++) {
        if (index < data.tiles.length) {
          const tile = terrain.getArrPos([x, y]);
          tile.setMaterial(data.tiles[index]);
          tile.assignWeight();
          index++;
        }
      }
    }
  }

  /**
   * Import compressed tile data (run-length encoded)
   * @param {gridTerrain} terrain - Target terrain
   * @param {Object} data - Import data
   * @private
   */
  _importCompressed(terrain, data) {
    const decompressed = this._decompressRLE(data.tiles);
    const modifiedData = { ...data, tiles: decompressed };
    this._importFull(terrain, modifiedData);
  }

  /**
   * Decompress run-length encoded string
   * @param {string} compressed - Compressed string
   * @returns {Array} Decompressed array
   * @private
   */
  _decompressRLE(compressed) {
    const parts = compressed.split(',');
    const decompressed = [];

    for (const part of parts) {
      const [count, material] = part.split(':');
      for (let i = 0; i < parseInt(count); i++) {
        decompressed.push(material);
      }
    }

    return decompressed;
  }

  /**
   * Import chunked format with default material
   * @param {gridTerrain} terrain - Target terrain
   * @param {Object} data - Import data
   * @private
   */
  _importChunked(terrain, data) {
    const totalTilesX = terrain._gridSizeX * terrain._chunkSize;
    const totalTilesY = terrain._gridSizeY * terrain._chunkSize;

    // Set all tiles to default material
    const defaultMaterial = data.tiles.defaultMaterial;
    for (let y = 0; y < totalTilesY; y++) {
      for (let x = 0; x < totalTilesX; x++) {
        const tile = terrain.getArrPos([x, y]);
        tile.setMaterial(defaultMaterial);
        tile.assignWeight();
      }
    }

    // Apply exceptions
    for (const exception of data.tiles.exceptions) {
      const tile = terrain.getArrPos([exception.x, exception.y]);
      tile.setMaterial(exception.material);
      tile.assignWeight();
    }
  }

  /**
   * Import entities into terrain
   * @param {gridTerrain} terrain - Target terrain
   * @param {Array} entities - Entity data
   * @private
   */
  _importEntities(terrain, entities) {
    for (const entityData of entities) {
      const { x, y, type, properties } = entityData;
      const tileX = Math.floor(x / terrain._tileSize);
      const tileY = Math.floor(y / terrain._tileSize);
      
      if (tileX >= 0 && tileX < terrain._gridSizeX * terrain._chunkSize &&
          tileY >= 0 && tileY < terrain._gridSizeY * terrain._chunkSize) {
        const tile = terrain.getArrPos([tileX, tileY]);
        
        // Create entity object (simplified - actual implementation may vary)
        const entity = {
          type,
          x,
          y,
          ...properties
        };
        
        if (tile.addEntity) {
          tile.addEntity(entity);
        }
      }
    }
  }

  /**
   * Import resources into terrain
   * @param {gridTerrain} terrain - Target terrain
   * @param {Array} resources - Resource data
   * @private
   */
  _importResources(terrain, resources) {
    for (const resourceData of resources) {
      const { x, y, type, amount } = resourceData;
      const tileX = Math.floor(x / terrain._tileSize);
      const tileY = Math.floor(y / terrain._tileSize);
      
      if (tileX >= 0 && tileX < terrain._gridSizeX * terrain._chunkSize &&
          tileY >= 0 && tileY < terrain._gridSizeY * terrain._chunkSize) {
        const tile = terrain.getArrPos([tileX, tileY]);
        
        // Store resource data
        if (!tile.resources) {
          tile.resources = [];
        }
        tile.resources.push({ type, amount });
      }
    }
  }

  /**
   * Migrate data from older versions
   * @param {Object} data - Import data
   * @returns {Object} Migrated data
   * @private
   */
  _migrateData(data) {
    if (!data.metadata || !data.metadata.version) {
      return data;
    }

    const currentVersion = data.metadata.version;
    const targetVersion = '2.0'; // Latest version

    if (currentVersion === targetVersion) {
      return data;
    }

    // Chain migrations
    let migratedData = { ...data };
    if (this._migrations[currentVersion]) {
      migratedData = this._migrations[currentVersion](migratedData);
    }

    return migratedData;
  }

  /**
   * Migrate from version 1.0
   * @param {Object} data - Version 1.0 data
   * @returns {Object} Migrated data
   * @private
   */
  _migrateFrom1_0(data) {
    // Example migration: add new fields, transform data
    const migrated = {
      ...data,
      metadata: {
        ...data.metadata,
        version: '2.0',
        migrated: true,
        originalVersion: '1.0'
      }
    };

    // Preserve existing data
    if (data.tiles) {
      migrated.tiles = data.tiles;
    }

    return migrated;
  }

  /**
   * Apply default values to missing fields
   * @param {Object} data - Import data
   * @returns {Object} Data with defaults
   * @private
   */
  _applyDefaults(data) {
    const defaults = {
      metadata: {
        chunkSize: CHUNK_SIZE || 8,
        tileSize: TILE_SIZE || 32,
        seed: Math.floor(Math.random() * 1000000)
      }
    };

    return {
      ...data,
      metadata: {
        ...defaults.metadata,
        ...data.metadata
      }
    };
  }

  /**
   * Validate import data structure
   * @param {Object} data - Data to validate
   * @returns {Object} Validation result
   */
  validateImport(data) {
    const errors = [];

    // Check for required fields
    if (!data) {
      errors.push('No data provided');
      return { valid: false, errors };
    }

    if (!data.metadata) {
      errors.push('Missing metadata');
    } else {
      if (!data.metadata.version) errors.push('Missing version');
      if (typeof data.metadata.gridSizeX !== 'number') errors.push('Invalid gridSizeX');
      if (typeof data.metadata.gridSizeY !== 'number') errors.push('Invalid gridSizeY');
    }

    if (!data.tiles) {
      errors.push('Missing tiles data');
    }

    // Validate tile data format
    if (data.tiles) {
      if (typeof data.tiles === 'object' && data.tiles.defaultMaterial) {
        // Chunked format
        if (!data.tiles.defaultMaterial) {
          errors.push('Chunked format missing defaultMaterial');
        }
        if (!Array.isArray(data.tiles.exceptions)) {
          errors.push('Chunked format exceptions must be array');
        }
      } else if (typeof data.tiles === 'string') {
        // Compressed format
        if (!data.tiles.match(/^\d+:\w+/)) {
          errors.push('Invalid run-length encoding format');
        }
      } else if (!Array.isArray(data.tiles)) {
        errors.push('Tiles must be array, string, or chunked object');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse JSON string
   * @param {string} jsonString - JSON string
   * @returns {Object|null} Parsed data or null on error
   */
  parseJSON(jsonString) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return null;
    }
  }

  /**
   * Check if terrain is too large for memory
   * @param {Object} data - Import data
   * @returns {boolean} True if streaming recommended
   */
  shouldStream(data) {
    const totalTiles = data.metadata.gridSizeX * 
                      data.metadata.gridSizeY * 
                      (data.metadata.chunkSize || 8) * 
                      (data.metadata.chunkSize || 8);
    
    // Recommend streaming for terrains larger than 10,000 tiles
    return totalTiles > 10000;
  }
}
