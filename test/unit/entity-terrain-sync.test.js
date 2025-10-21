/**
 * Unit Tests: Entity-Terrain Synchronization System
 * 
 * Tests the bidirectional relationship between entities and terrain tiles.
 * Entities should know which tile they're on, and tiles should know which entities are on them.
 * 
 * This defines the contract for a new TerrainEntitySync system that will:
 * 1. Track entity positions on the terrain grid
 * 2. Update tile references when entities move
 * 3. Provide fast lookups in both directions (entity→tile, tile→entities)
 * 4. Handle spawn, move, and destroy events
 */

const assert = require('assert');
const TerrainEntitySync = require('../../Classes/systems/TerrainEntitySync');

describe('Entity-Terrain Synchronization System', () => {
  
  let terrainGrid;
  let entityTileSync;
  let testEntity;
  
  beforeEach(() => {
    // Mock terrain grid
    terrainGrid = createMockTerrainGrid(10, 10, 32); // 10x10 tiles, 32px each
    
    // Mock entity
    testEntity = createMockEntity(64, 64, 'Ant'); // At tile (2, 2)
    
    // System under test
    entityTileSync = new TerrainEntitySync(terrainGrid);
  });
  
  // =========================================================================
  // Test Suite 1: Entity Registration
  // =========================================================================
  
  describe('Entity Registration', () => {
    
    it('should register entity with correct tile on spawn', () => {
      // Arrange: Entity at (64, 64) = tile (2, 2)
      
      // Act
      entityTileSync.registerEntity(testEntity);
      
      // Assert
      assert.strictEqual(testEntity.currentTile, terrainGrid.getTileAt(2, 2));
      assert.strictEqual(testEntity.tileX, 2);
      assert.strictEqual(testEntity.tileY, 2);
    });
    
    it('should add entity to tile\'s entity list', () => {
      // Act
      entityTileSync.registerEntity(testEntity);
      
      // Assert
      const tile = terrainGrid.getTileAt(2, 2);
      assert(tile.hasEntity(testEntity));
      assert.strictEqual(tile.getEntityCount(), 1);
      assert(tile.getEntities().includes(testEntity));
    });
    
    it('should handle multiple entities on same tile', () => {
      // Arrange
      const entity2 = createMockEntity(80, 80, 'Ant'); // Also on tile (2, 2)
      const entity3 = createMockEntity(70, 70, 'Ant'); // Also on tile (2, 2)
      
      // Act
      entityTileSync.registerEntity(testEntity);
      entityTileSync.registerEntity(entity2);
      entityTileSync.registerEntity(entity3);
      
      // Assert
      const tile = terrainGrid.getTileAt(2, 2);
      assert.strictEqual(tile.getEntityCount(), 3);
      assert(tile.hasEntity(testEntity));
      assert(tile.hasEntity(entity2));
      assert(tile.hasEntity(entity3));
    });
    
    it('should store entity terrain properties', () => {
      // Arrange
      const tile = terrainGrid.getTileAt(2, 2);
      tile.material = 'water';
      tile.weight = 5;
      
      // Act
      entityTileSync.registerEntity(testEntity);
      
      // Assert
      assert.strictEqual(testEntity.getTerrainMaterial(), 'water');
      assert.strictEqual(testEntity.getTerrainWeight(), 5);
    });
    
    it('should not register entity twice', () => {
      // Act
      entityTileSync.registerEntity(testEntity);
      entityTileSync.registerEntity(testEntity); // Try again
      
      // Assert
      const tile = terrainGrid.getTileAt(2, 2);
      assert.strictEqual(tile.getEntityCount(), 1); // Still only 1
    });
  });
  
  // =========================================================================
  // Test Suite 2: Entity Movement
  // =========================================================================
  
  describe('Entity Movement', () => {
    
    beforeEach(() => {
      entityTileSync.registerEntity(testEntity);
    });
    
    it('should update tile reference when entity moves to new tile', () => {
      // Arrange: Entity at tile (2, 2), moving to tile (3, 3)
      const oldTile = terrainGrid.getTileAt(2, 2);
      const newTile = terrainGrid.getTileAt(3, 3);
      
      // Act
      testEntity.x = 96; // Move to tile (3, 3)
      testEntity.y = 96;
      entityTileSync.updateEntityPosition(testEntity);
      
      // Assert
      assert.strictEqual(testEntity.currentTile, newTile);
      assert.strictEqual(testEntity.tileX, 3);
      assert.strictEqual(testEntity.tileY, 3);
    });
    
    it('should remove entity from old tile', () => {
      // Arrange
      const oldTile = terrainGrid.getTileAt(2, 2);
      
      // Act
      testEntity.x = 96;
      testEntity.y = 96;
      entityTileSync.updateEntityPosition(testEntity);
      
      // Assert
      assert(!oldTile.hasEntity(testEntity));
      assert.strictEqual(oldTile.getEntityCount(), 0);
    });
    
    it('should add entity to new tile', () => {
      // Arrange
      const newTile = terrainGrid.getTileAt(3, 3);
      
      // Act
      testEntity.x = 96;
      testEntity.y = 96;
      entityTileSync.updateEntityPosition(testEntity);
      
      // Assert
      assert(newTile.hasEntity(testEntity));
      assert.strictEqual(newTile.getEntityCount(), 1);
    });
    
    it('should not update if entity stays on same tile', () => {
      // Arrange
      const tile = terrainGrid.getTileAt(2, 2);
      const updateCount = entityTileSync.getUpdateCount();
      
      // Act: Move within same tile (64→70 is still tile 2)
      testEntity.x = 70;
      testEntity.y = 70;
      entityTileSync.updateEntityPosition(testEntity);
      
      // Assert: No unnecessary updates
      assert.strictEqual(entityTileSync.getUpdateCount(), updateCount);
      assert.strictEqual(tile.getEntityCount(), 1);
      assert.strictEqual(testEntity.currentTile, tile);
    });
    
    it('should handle rapid movement across multiple tiles', () => {
      // Act: Move entity across 5 tiles
      const positions = [
        { x: 96, y: 96, tileX: 3, tileY: 3 },
        { x: 128, y: 128, tileX: 4, tileY: 4 },
        { x: 160, y: 160, tileX: 5, tileY: 5 },
        { x: 192, y: 192, tileX: 6, tileY: 6 },
        { x: 224, y: 224, tileX: 7, tileY: 7 }
      ];
      
      positions.forEach(pos => {
        testEntity.x = pos.x;
        testEntity.y = pos.y;
        entityTileSync.updateEntityPosition(testEntity);
        
        // Assert after each move
        assert.strictEqual(testEntity.tileX, pos.tileX);
        assert.strictEqual(testEntity.tileY, pos.tileY);
      });
      
      // Assert final position
      const finalTile = terrainGrid.getTileAt(7, 7);
      assert(finalTile.hasEntity(testEntity));
      assert.strictEqual(finalTile.getEntityCount(), 1);
      
      // Assert old tiles are cleaned up
      positions.slice(0, -1).forEach(pos => {
        const oldTile = terrainGrid.getTileAt(pos.tileX, pos.tileY);
        assert(!oldTile.hasEntity(testEntity));
      });
    });
    
    it('should update terrain properties when moving to different terrain', () => {
      // Arrange
      const waterTile = terrainGrid.getTileAt(3, 3);
      waterTile.material = 'water';
      waterTile.weight = 5;
      
      // Act
      testEntity.x = 96;
      testEntity.y = 96;
      entityTileSync.updateEntityPosition(testEntity);
      
      // Assert
      assert.strictEqual(testEntity.getTerrainMaterial(), 'water');
      assert.strictEqual(testEntity.getTerrainWeight(), 5);
    });
  });
  
  // =========================================================================
  // Test Suite 3: Entity Deregistration
  // =========================================================================
  
  describe('Entity Deregistration', () => {
    
    beforeEach(() => {
      entityTileSync.registerEntity(testEntity);
    });
    
    it('should remove entity from tile on destroy', () => {
      // Arrange
      const tile = terrainGrid.getTileAt(2, 2);
      
      // Act
      entityTileSync.unregisterEntity(testEntity);
      
      // Assert
      assert(!tile.hasEntity(testEntity));
      assert.strictEqual(tile.getEntityCount(), 0);
    });
    
    it('should clear entity tile reference on destroy', () => {
      // Act
      entityTileSync.unregisterEntity(testEntity);
      
      // Assert
      assert.strictEqual(testEntity.currentTile, null);
      assert.strictEqual(testEntity.tileX, null);
      assert.strictEqual(testEntity.tileY, null);
    });
    
    it('should not affect other entities on same tile', () => {
      // Arrange
      const entity2 = createMockEntity(70, 70, 'Ant');
      entityTileSync.registerEntity(entity2);
      const tile = terrainGrid.getTileAt(2, 2);
      
      // Act
      entityTileSync.unregisterEntity(testEntity);
      
      // Assert
      assert(!tile.hasEntity(testEntity));
      assert(tile.hasEntity(entity2));
      assert.strictEqual(tile.getEntityCount(), 1);
    });
  });
  
  // =========================================================================
  // Test Suite 4: Tile Queries
  // =========================================================================
  
  describe('Tile Queries', () => {
    
    it('should get all entities on a tile', () => {
      // Arrange
      const entity1 = createMockEntity(64, 64, 'Ant');
      const entity2 = createMockEntity(70, 70, 'Ant');
      const entity3 = createMockEntity(80, 80, 'Resource');
      
      entityTileSync.registerEntity(entity1);
      entityTileSync.registerEntity(entity2);
      entityTileSync.registerEntity(entity3);
      
      // Act
      const entities = entityTileSync.getEntitiesOnTile(2, 2);
      
      // Assert
      assert.strictEqual(entities.length, 3);
      assert(entities.includes(entity1));
      assert(entities.includes(entity2));
      assert(entities.includes(entity3));
    });
    
    it('should filter entities by type on tile', () => {
      // Arrange
      const ant1 = createMockEntity(64, 64, 'Ant');
      const ant2 = createMockEntity(70, 70, 'Ant');
      const resource = createMockEntity(80, 80, 'Resource');
      
      entityTileSync.registerEntity(ant1);
      entityTileSync.registerEntity(ant2);
      entityTileSync.registerEntity(resource);
      
      // Act
      const ants = entityTileSync.getEntitiesOnTile(2, 2, 'Ant');
      
      // Assert
      assert.strictEqual(ants.length, 2);
      assert(ants.includes(ant1));
      assert(ants.includes(ant2));
      assert(!ants.includes(resource));
    });
    
    it('should check if tile has any entities', () => {
      // Arrange
      entityTileSync.registerEntity(testEntity);
      
      // Act & Assert
      assert.strictEqual(entityTileSync.hasTileEntities(2, 2), true);
      assert.strictEqual(entityTileSync.hasTileEntities(3, 3), false);
    });
    
    it('should get entity count on tile', () => {
      // Arrange
      const entity2 = createMockEntity(70, 70, 'Ant');
      const entity3 = createMockEntity(80, 80, 'Ant');
      
      entityTileSync.registerEntity(testEntity);
      entityTileSync.registerEntity(entity2);
      entityTileSync.registerEntity(entity3);
      
      // Act
      const count = entityTileSync.getEntityCountOnTile(2, 2);
      
      // Assert
      assert.strictEqual(count, 3);
    });
    
    it('should get entities in tile range', () => {
      // Arrange: Place entities on multiple tiles
      const entities = [
        createMockEntity(64, 64, 'Ant'),   // Tile (2, 2) - in range
        createMockEntity(96, 64, 'Ant'),   // Tile (3, 2) - in range
        createMockEntity(96, 96, 'Ant'),   // Tile (3, 3) - in range
        createMockEntity(128, 128, 'Ant'), // Tile (4, 4) - out of range
        createMockEntity(160, 160, 'Ant')  // Tile (5, 5) - out of range
      ];
      
      entities.forEach(e => entityTileSync.registerEntity(e));
      
      // Act: Get entities in 2x2 tile area starting at (2, 2)
      // Should cover tiles (2,2), (2,3), (3,2), (3,3)
      const inRange = entityTileSync.getEntitiesInTileRange(2, 2, 2, 2);
      
      // Assert
      assert.strictEqual(inRange.length, 3);
      assert(!inRange.includes(entities[3])); // Tile (4,4) - out of range
      assert(!inRange.includes(entities[4])); // Tile (5,5) - out of range
    });
  });
  
  // =========================================================================
  // Test Suite 5: Entity Queries
  // =========================================================================
  
  describe('Entity Queries', () => {
    
    beforeEach(() => {
      entityTileSync.registerEntity(testEntity);
    });
    
    it('should get tile coordinates for entity', () => {
      // Act
      const coords = entityTileSync.getEntityTileCoords(testEntity);
      
      // Assert
      assert.deepStrictEqual(coords, { x: 2, y: 2 });
    });
    
    it('should get tile object for entity', () => {
      // Act
      const tile = entityTileSync.getEntityTile(testEntity);
      
      // Assert
      assert.strictEqual(tile, terrainGrid.getTileAt(2, 2));
    });
    
    it('should get terrain material for entity', () => {
      // Arrange
      const tile = terrainGrid.getTileAt(2, 2);
      tile.material = 'water';
      
      // Act
      const material = entityTileSync.getEntityTerrainMaterial(testEntity);
      
      // Assert
      assert.strictEqual(material, 'water');
    });
    
    it('should get terrain weight for entity', () => {
      // Arrange
      const tile = terrainGrid.getTileAt(2, 2);
      tile.weight = 5;
      
      // Act
      const weight = entityTileSync.getEntityTerrainWeight(testEntity);
      
      // Assert
      assert.strictEqual(weight, 5);
    });
    
    it('should check if entity is on specific terrain type', () => {
      // Arrange
      const tile = terrainGrid.getTileAt(2, 2);
      tile.material = 'water';
      
      // Act & Assert
      assert.strictEqual(entityTileSync.isEntityOnTerrain(testEntity, 'water'), true);
      assert.strictEqual(entityTileSync.isEntityOnTerrain(testEntity, 'grass'), false);
    });
    
    it('should get neighboring tiles for entity', () => {
      // Act
      const neighbors = entityTileSync.getEntityNeighborTiles(testEntity);
      
      // Assert: Should get 8 neighbors (or less at edges)
      assert(neighbors.length >= 3 && neighbors.length <= 8);
      assert(neighbors.includes(terrainGrid.getTileAt(1, 1))); // Top-left
      assert(neighbors.includes(terrainGrid.getTileAt(2, 1))); // Top
      assert(neighbors.includes(terrainGrid.getTileAt(3, 1))); // Top-right
    });
    
    it('should get entities on neighboring tiles', () => {
      // Arrange: Place entities on neighboring tiles
      const neighbor1 = createMockEntity(96, 64, 'Ant');  // Tile (3, 2)
      const neighbor2 = createMockEntity(64, 96, 'Ant');  // Tile (2, 3)
      const farAway = createMockEntity(160, 160, 'Ant');  // Tile (5, 5)
      
      entityTileSync.registerEntity(neighbor1);
      entityTileSync.registerEntity(neighbor2);
      entityTileSync.registerEntity(farAway);
      
      // Act
      const neighbors = entityTileSync.getEntitiesOnNeighborTiles(testEntity);
      
      // Assert
      assert.strictEqual(neighbors.length, 2);
      assert(neighbors.includes(neighbor1));
      assert(neighbors.includes(neighbor2));
      assert(!neighbors.includes(farAway));
    });
  });
  
  // =========================================================================
  // Test Suite 6: Performance & Edge Cases
  // =========================================================================
  
  describe('Performance & Edge Cases', () => {
    
    it('should handle entity at grid boundary', () => {
      // Arrange: Entity at edge tile (0, 0)
      const edgeEntity = createMockEntity(0, 0, 'Ant');
      
      // Act
      entityTileSync.registerEntity(edgeEntity);
      
      // Assert
      assert.strictEqual(edgeEntity.tileX, 0);
      assert.strictEqual(edgeEntity.tileY, 0);
      const tile = terrainGrid.getTileAt(0, 0);
      assert(tile.hasEntity(edgeEntity));
    });
    
    it('should handle entity outside grid bounds', () => {
      // Arrange: Entity outside grid
      const outsideEntity = createMockEntity(1000, 1000, 'Ant');
      
      // Act & Assert: Should not crash
      assert.doesNotThrow(() => {
        entityTileSync.registerEntity(outsideEntity);
      });
      
      // Should be marked as out-of-bounds
      assert.strictEqual(outsideEntity.currentTile, null);
      assert.strictEqual(outsideEntity.isOutOfBounds, true);
    });
    
    it('should handle negative coordinates', () => {
      // Arrange
      const negativeEntity = createMockEntity(-10, -10, 'Ant');
      
      // Act & Assert
      assert.doesNotThrow(() => {
        entityTileSync.registerEntity(negativeEntity);
      });
      
      assert.strictEqual(negativeEntity.isOutOfBounds, true);
    });
    
    it('should handle many entities efficiently', () => {
      // Arrange: Create 1000 entities
      const entities = [];
      for (let i = 0; i < 1000; i++) {
        const x = (i % 10) * 32;
        const y = Math.floor(i / 10) * 32;
        entities.push(createMockEntity(x, y, 'Ant'));
      }
      
      // Act: Register all
      const startTime = Date.now();
      entities.forEach(e => entityTileSync.registerEntity(e));
      const registrationTime = Date.now() - startTime;
      
      // Assert: Should be fast (< 100ms)
      assert(registrationTime < 100, `Registration took ${registrationTime}ms`);
      
      // Act: Update all positions
      const updateStart = Date.now();
      entities.forEach(e => {
        e.x += 32;
        entityTileSync.updateEntityPosition(e);
      });
      const updateTime = Date.now() - updateStart;
      
      // Assert: Updates should be fast (< 100ms)
      assert(updateTime < 100, `Updates took ${updateTime}ms`);
    });
    
    it('should handle concurrent updates to same tile', () => {
      // Arrange: Multiple entities on same tile
      const entities = [];
      for (let i = 0; i < 10; i++) {
        entities.push(createMockEntity(64, 64, 'Ant'));
      }
      
      // Act: Register all simultaneously
      entities.forEach(e => entityTileSync.registerEntity(e));
      
      // Assert: All registered correctly
      const tile = terrainGrid.getTileAt(2, 2);
      assert.strictEqual(tile.getEntityCount(), 10);
      entities.forEach(e => assert(tile.hasEntity(e)));
    });
  });
  
  // =========================================================================
  // Test Suite 7: Terrain Changes
  // =========================================================================
  
  describe('Terrain Changes', () => {
    
    beforeEach(() => {
      entityTileSync.registerEntity(testEntity);
    });
    
    it('should update entity when tile material changes', () => {
      // Arrange
      const tile = terrainGrid.getTileAt(2, 2);
      
      // Act: Change terrain
      tile.material = 'water';
      entityTileSync.notifyTerrainChange(2, 2);
      
      // Assert: Entity knows about change
      assert.strictEqual(testEntity.getTerrainMaterial(), 'water');
    });
    
    it('should notify all entities on tile of terrain change', () => {
      // Arrange
      const entity2 = createMockEntity(70, 70, 'Ant');
      entityTileSync.registerEntity(entity2);
      const tile = terrainGrid.getTileAt(2, 2);
      
      // Act: Change terrain
      tile.material = 'lava';
      tile.weight = 10;
      entityTileSync.notifyTerrainChange(2, 2);
      
      // Assert: Both entities updated
      assert.strictEqual(testEntity.getTerrainMaterial(), 'lava');
      assert.strictEqual(entity2.getTerrainMaterial(), 'lava');
      assert.strictEqual(testEntity.getTerrainWeight(), 10);
      assert.strictEqual(entity2.getTerrainWeight(), 10);
    });
  });
  
  // =========================================================================
  // Test Suite 8: Debug & Utilities
  // =========================================================================
  
  describe('Debug & Utilities', () => {
    
    it('should get system statistics', () => {
      // Arrange
      entityTileSync.registerEntity(testEntity);
      const entity2 = createMockEntity(96, 96, 'Ant');
      entityTileSync.registerEntity(entity2);
      
      // Act
      const stats = entityTileSync.getStats();
      
      // Assert
      assert.strictEqual(stats.totalEntities, 2);
      assert.strictEqual(stats.occupiedTiles, 2);
      assert(stats.averageEntitiesPerTile >= 0);
    });
    
    it('should visualize entity-tile relationships for debugging', () => {
      // Arrange
      entityTileSync.registerEntity(testEntity);
      
      // Act
      const visualization = entityTileSync.getDebugVisualization(2, 2);
      
      // Assert
      assert(visualization.includes('Tile (2, 2)'));
      assert(visualization.includes('Entities: 1'));
      assert(visualization.includes(testEntity.type));
    });
    
    it('should validate system integrity', () => {
      // Arrange: Create some entities
      const entities = [
        createMockEntity(64, 64, 'Ant'),
        createMockEntity(96, 96, 'Ant')
      ];
      entities.forEach(e => entityTileSync.registerEntity(e));
      
      // Act
      const isValid = entityTileSync.validateIntegrity();
      
      // Assert
      assert.strictEqual(isValid, true);
    });
  });
});

// ============================================================================
// Mock Helpers
// ============================================================================

function createMockTerrainGrid(width, height, tileSize) {
  const tiles = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.push(createMockTile(x, y, tileSize));
    }
  }
  
  return {
    width,
    height,
    tileSize,
    tiles,
    
    getTileAt(x, y) {
      if (x < 0 || y < 0 || x >= width || y >= height) return null;
      return tiles[y * width + x];
    },
    
    worldToTile(worldX, worldY) {
      return {
        x: Math.floor(worldX / tileSize),
        y: Math.floor(worldY / tileSize)
      };
    }
  };
}

function createMockTile(tileX, tileY, tileSize) {
  return {
    tileX,
    tileY,
    x: tileX * tileSize,
    y: tileY * tileSize,
    width: tileSize,
    height: tileSize,
    material: 'grass',
    weight: 1,
    entities: [],
    
    hasEntity(entity) {
      return this.entities.includes(entity);
    },
    
    addEntity(entity) {
      if (!this.entities.includes(entity)) {
        this.entities.push(entity);
      }
    },
    
    removeEntity(entity) {
      const index = this.entities.indexOf(entity);
      if (index !== -1) {
        this.entities.splice(index, 1);
      }
    },
    
    getEntities() {
      return [...this.entities];
    },
    
    getEntityCount() {
      return this.entities.length;
    }
  };
}

function createMockEntity(x, y, type) {
  return {
    x,
    y,
    type,
    currentTile: null,
    tileX: null,
    tileY: null,
    terrainMaterial: null,
    terrainWeight: null,
    isOutOfBounds: false,
    
    getTerrainMaterial() {
      return this.terrainMaterial;
    },
    
    getTerrainWeight() {
      return this.terrainWeight;
    }
  };
}

// Export mock helpers for use in other tests
module.exports = {
  createMockTerrainGrid,
  createMockTile,
  createMockEntity
};
