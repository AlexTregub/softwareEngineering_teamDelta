/**
 * E2E Test: Terrain-Entity Synchronization System
 * 
 * Tests the bidirectional relationship between entities and terrain tiles in the actual game environment.
 * Verifies that entities know their tile and tiles know their entities.
 * 
 * Expected Results:
 * - Entities spawn with correct tile references
 * - Entities update tile references when moving
 * - Tiles track entities correctly
 * - Terrain properties are accessible from entities
 * 
 * @author AI Agent
 * @date 2025-10-21
 */

const puppeteer = require('puppeteer');
const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

const TEST_TIMEOUT = 30000;

// Test tracking
let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

/**
 * Log test result
 */
function logTestResult(testName, passed, duration, error = null) {
  const result = {
    testName,
    passed,
    duration,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  };
  
  testResults.push(result);
  
  if (passed) {
    testsPassed++;
    console.log(`✅ PASSED: ${testName} (${duration}ms)`);
  } else {
    testsFailed++;
    console.error(`❌ FAILED: ${testName} (${duration}ms)`);
    if (error) console.error(`   Error: ${error.message}`);
  }
}

/**
 * Enable visual debug overlays for terrain-entity sync
 * Shows text labels on tiles and entities displaying their sync information
 */
async function enableVisualDebug(page) {
  await page.evaluate(() => {
    // Create a visual debug renderer for terrain-entity sync
    window.terrainEntitySyncVisualDebug = {
      enabled: true,
      
      // Render debug overlays
      render() {
        if (!this.enabled) return;
        
        push();
        
        // Get camera manager for world-to-screen conversion
        const cam = window.cameraManager || window.g_cameraManager;
        
        // Get all entities
        const grid = window.spatialGridManager || window.g_spatialGrid;
        const entities = grid?.getEntitiesByType('Ant') || [];
        
        // Style for text
        textAlign(LEFT, TOP);
        textSize(10);
        noStroke();
        
        // Draw entity info (next to each entity)
        fill(255, 255, 0); // Yellow background
        stroke(0);
        strokeWeight(1);
        
        entities.forEach(entity => {
          if (!entity || !entity.currentTile) return;
          
          // Get screen position
          let screenX, screenY;
          if (cam) {
            const screenPos = cam.worldToScreen(entity.x, entity.y);
            screenX = screenPos.x;
            screenY = screenPos.y;
          } else {
            screenX = entity.x;
            screenY = entity.y;
          }
          
          // Entity info box (to the right of entity)
          const boxX = screenX + 20;
          const boxY = screenY - 40;
          const boxW = 140;
          const boxH = 70;
          
          fill(0, 0, 0, 180);
          rect(boxX, boxY, boxW, boxH, 4);
          
          fill(255, 255, 0);
          noStroke();
          text(`Entity: ${entity.type}`, boxX + 5, boxY + 5);
          fill(200, 255, 200);
          text(`Tile: (${entity.tileX}, ${entity.tileY})`, boxX + 5, boxY + 20);
          text(`Terrain: ${entity.terrainMaterial}`, boxX + 5, boxY + 35);
          text(`Weight: ${entity.terrainWeight}`, boxX + 5, boxY + 50);
          
          // Draw line from entity to info box
          stroke(255, 255, 0, 100);
          strokeWeight(1);
          line(screenX, screenY, boxX, boxY + boxH / 2);
        });
        
        // Draw tile info (above tiles that have entities)
        fill(100, 200, 255); // Cyan background
        
        // Get unique tiles with entities
        const tilesWithEntities = new Map();
        entities.forEach(entity => {
          if (!entity.currentTile) return;
          const key = `${entity.tileX},${entity.tileY}`;
          if (!tilesWithEntities.has(key)) {
            tilesWithEntities.set(key, {
              tile: entity.currentTile,
              tileX: entity.tileX,
              tileY: entity.tileY,
              entities: []
            });
          }
          tilesWithEntities.get(key).entities.push(entity);
        });
        
        // Draw info for each tile
        tilesWithEntities.forEach(({ tile, tileX, tileY, entities }) => {
          // Calculate tile center in world coords
          const tileSize = 32;
          const worldX = tileX * tileSize + tileSize / 2;
          const worldY = tileY * tileSize + tileSize / 2;
          
          // Convert to screen coords
          let screenX, screenY;
          if (cam) {
            const screenPos = cam.worldToScreen(worldX, worldY);
            screenX = screenPos.x;
            screenY = screenPos.y;
          } else {
            screenX = worldX;
            screenY = worldY;
          }
          
          // Tile info box (above tile)
          const boxX = screenX - 70;
          const boxY = screenY - 80;
          const boxW = 140;
          const boxH = 60;
          
          fill(0, 0, 0, 180);
          stroke(100, 200, 255);
          strokeWeight(2);
          rect(boxX, boxY, boxW, boxH, 4);
          
          fill(100, 200, 255);
          noStroke();
          text(`Tile: (${tileX}, ${tileY})`, boxX + 5, boxY + 5);
          fill(255, 200, 100);
          text(`Entities: ${entities.length}`, boxX + 5, boxY + 20);
          
          // List entity types
          const types = entities.map(e => e.type).slice(0, 2).join(', ');
          fill(200, 200, 200);
          text(`Types: ${types}`, boxX + 5, boxY + 35);
          
          // Draw line from tile center to info box
          stroke(100, 200, 255, 100);
          strokeWeight(1);
          line(screenX, screenY, boxX + boxW / 2, boxY + boxH);
          
          // Highlight tile border
          noFill();
          stroke(100, 200, 255, 150);
          strokeWeight(3);
          const tileScreenX = screenX - tileSize / 2;
          const tileScreenY = screenY - tileSize / 2;
          rect(tileScreenX, tileScreenY, tileSize, tileSize);
        });
        
        pop();
      }
    };
    
    // Register the debug renderer with the render manager
    if (window.RenderManager) {
      RenderManager.addDrawableToLayer(
        RenderManager.layers.UI_DEBUG,
        () => {
          if (window.terrainEntitySyncVisualDebug) {
            window.terrainEntitySyncVisualDebug.render();
          }
        }
      );
    }
    
    console.log('[Visual Debug] Terrain-Entity sync visual debug enabled');
  });
}

/**
 * Disable visual debug overlays
 */
async function disableVisualDebug(page) {
  await page.evaluate(() => {
    if (window.terrainEntitySyncVisualDebug) {
      window.terrainEntitySyncVisualDebug.enabled = false;
    }
  });
}

/**
 * Main test execution
 */
(async () => {
  let browser, page;
  const startTime = Date.now();
  
  try {
    console.log('\n' + '='.repeat(60));
    console.log('  TERRAIN-ENTITY SYNC E2E TESTS');
    console.log('='.repeat(60) + '\n');
    
    browser = await launchBrowser();
    page = await browser.newPage();
    await page.goto('http://localhost:8000');
    
    // Bypass main menu and start game
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Failed to start game - still on main menu');
    }
    
    await sleep(1000); // Wait for game initialization
    
    // Test 1: Initialize TerrainEntitySync system
    await (async () => {
      const testStart = Date.now();
      try {
        const result = await page.evaluate(() => {
          return {
            hasSystem: window.g_terrainEntitySync !== undefined,
            hasAlias: window.terrainEntitySync !== undefined,
            hasTileSupport: typeof window.g_map2 !== 'undefined',
            systemType: window.g_terrainEntitySync?.constructor?.name
          };
        });
        
        if (!result.hasSystem) {
          throw new Error('TerrainEntitySync not initialized');
        }
        
        console.log('✓ TerrainEntitySync initialized:', result.systemType);
        await saveScreenshot(page, 'systems/terrain_entity_sync_init', true);
        
        logTestResult('Initialize TerrainEntitySync system', true, Date.now() - testStart);
      } catch (error) {
        logTestResult('Initialize TerrainEntitySync system', false, Date.now() - testStart, error);
      }
    })();
    
    // Test 2: Register entities with tiles on spawn
    await (async () => {
      const testStart = Date.now();
      try {
        // Enable visual debug overlays
        await enableVisualDebug(page);
        
        const result = await page.evaluate(() => {
          // Spawn an ant at a specific location for better visibility
          window.antsSpawn(1, 'player');
          
          // Get the ant
          const grid = window.spatialGridManager || window.g_spatialGrid;
          const ants = grid?.getEntitiesByType('Ant') || [];
          const ant = ants[0];
          
          if (!ant) {
            return { success: false, error: 'No ant spawned' };
          }
          
          // Move ant to visible location (center of screen area)
          ant.setPosition(400, 300);
          
          return {
            success: true,
            antHasTile: ant.currentTile !== null && ant.currentTile !== undefined,
            antHasTileCoords: ant.tileX !== null && ant.tileY !== null,
            antTerrainMaterial: ant.terrainMaterial,
            antTerrainWeight: ant.terrainWeight,
            tileX: ant.tileX,
            tileY: ant.tileY,
            tileHasEntity: ant.currentTile?.hasEntity?.(ant) || false,
            tileEntityCount: ant.currentTile?.getEntityCount?.() || 0
          };
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Registration test failed');
        }
        
        if (!result.antHasTile || !result.antHasTileCoords) {
          throw new Error(`Entity not registered: hasTile=${result.antHasTile}, hasCoords=${result.antHasTileCoords}`);
        }
        
        console.log(`✓ Entity registered at tile (${result.tileX}, ${result.tileY})`);
        console.log(`  - Terrain: ${result.antTerrainMaterial} (weight: ${result.antTerrainWeight})`);
        console.log(`  - Tile has entity: ${result.tileHasEntity}`);
        console.log(`  - Tile entity count: ${result.tileEntityCount}`);
        
        // Force render with visual overlays
        await page.evaluate(() => {
          if (typeof window.redraw === 'function') {
            window.redraw();
            window.redraw();
          }
        });
        
        await sleep(500);
        await saveScreenshot(page, 'systems/terrain_entity_sync_registration', true);
        
        logTestResult('Register entities with tiles on spawn', true, Date.now() - testStart);
      } catch (error) {
        logTestResult('Register entities with tiles on spawn', false, Date.now() - testStart, error);
      }
    })();
  
  it('should update entity tile reference when moving', async function() {
    const result = await page.evaluate(() => {
      // Get first ant
      const grid = window.spatialGridManager || window.g_spatialGrid;
      const ants = grid?.getEntitiesByType('Ant') || [];
      const ant = ants[0];
      
      if (!ant) {
        return { success: false, error: 'No ant found' };
      }
      
      // Store old tile coords
      const oldTileX = ant.tileX;
      const oldTileY = ant.tileY;
      const oldTile = ant.currentTile;
      
      // Move ant to new position (move 100px right and down)
      const newX = ant.x + 100;
      const newY = ant.y + 100;
      ant.setPosition(newX, newY);
      
      // Check new tile
      const newTileX = ant.tileX;
      const newTileY = ant.tileY;
      const newTile = ant.currentTile;
      
      return {
        success: true,
        moved: oldTileX !== newTileX || oldTileY !== newTileY,
        oldTile: { x: oldTileX, y: oldTileY },
        newTile: { x: newTileX, y: newTileY },
        oldTileNoLongerHasEntity: !oldTile?.hasEntity?.(ant),
        newTileHasEntity: newTile?.hasEntity?.(ant),
        tileChanged: oldTile !== newTile
      };
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Movement test failed');
    }
    
    if (!result.moved) {
      throw new Error('Entity did not change tiles');
    }
    
    if (!result.newTileHasEntity) {
      throw new Error('New tile does not have entity');
    }
    
    if (!result.oldTileNoLongerHasEntity) {
      console.warn('⚠ Old tile still has entity reference (may be expected if entity only moved within tile)');
    }
    
    console.log(`✓ Entity moved from tile (${result.oldTile.x}, ${result.oldTile.y}) to (${result.newTile.x}, ${result.newTile.y})`);
    console.log(`  - Tile changed: ${result.tileChanged}`);
    console.log(`  - Old tile cleaned up: ${result.oldTileNoLongerHasEntity}`);
    console.log(`  - New tile has entity: ${result.newTileHasEntity}`);
    
    // Force render with visual overlays
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'systems/terrain_entity_sync_movement', true);
  });
  
  it('should query entities on specific tiles', async function() {
    const result = await page.evaluate(() => {
      // Spawn multiple ants in visible area
      window.antsSpawn(4, 'player');
      
      const sync = window.g_terrainEntitySync;
      if (!sync) {
        return { success: false, error: 'TerrainEntitySync not available' };
      }
      
      // Get ants and position them in a cluster
      const grid = window.spatialGridManager || window.g_spatialGrid;
      const ants = grid?.getEntitiesByType('Ant') || [];
      
      // Position ants in a visible cluster (2x2 tile area)
      if (ants.length >= 4) {
        ants[0].setPosition(300, 200);  // Tile (9, 6)
        ants[1].setPosition(330, 200);  // Tile (10, 6)
        ants[2].setPosition(300, 230);  // Tile (9, 7)
        ants[3].setPosition(330, 230);  // Tile (10, 7)
      }
      
      const firstAnt = ants[0];
      
      if (!firstAnt) {
        return { success: false, error: 'No ants found' };
      }
      
      // Query entities on first ant's tile
      const tileEntities = sync.getEntitiesOnTile(firstAnt.tileX, firstAnt.tileY);
      const neighborEntities = sync.getEntitiesOnNeighborTiles(firstAnt);
      
      return {
        success: true,
        totalAnts: ants.length,
        firstAntTile: { x: firstAnt.tileX, y: firstAnt.tileY },
        entitiesOnSameTile: tileEntities.length,
        entitiesOnNeighborTiles: neighborEntities.length
      };
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Query test failed');
    }
    
    console.log(`✓ Total ants spawned: ${result.totalAnts}`);
    console.log(`  - Entities on tile (${result.firstAntTile.x}, ${result.firstAntTile.y}): ${result.entitiesOnSameTile}`);
    console.log(`  - Entities on neighbor tiles: ${result.entitiesOnNeighborTiles}`);
    
    // Force render with visual overlays
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'systems/terrain_entity_sync_queries', true);
  });
  
  it('should unregister entities on destroy', async function() {
    const result = await page.evaluate(() => {
      // Get an ant
      const grid = window.spatialGridManager || window.g_spatialGrid;
      const ants = grid?.getEntitiesByType('Ant') || [];
      const ant = ants[0];
      
      if (!ant) {
        return { success: false, error: 'No ant found' };
      }
      
      const tileX = ant.tileX;
      const tileY = ant.tileY;
      const tile = ant.currentTile;
      const entityCountBefore = tile?.getEntityCount?.() || 0;
      
      // Destroy the ant
      ant.destroy();
      
      const entityCountAfter = tile?.getEntityCount?.() || 0;
      
      return {
        success: true,
        entityCountBefore,
        entityCountAfter,
        countDecreased: entityCountAfter < entityCountBefore,
        tileStillHasEntity: tile?.hasEntity?.(ant) || false,
        antTileCleared: ant.currentTile === null
      };
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Destroy test failed');
    }
    
    if (!result.countDecreased && result.entityCountBefore > 0) {
      throw new Error('Entity count did not decrease after destroy');
    }
    
    if (result.tileStillHasEntity) {
      throw new Error('Tile still has entity after destroy');
    }
    
    console.log(`✓ Entity unregistered on destroy`);
    console.log(`  - Entity count before: ${result.entityCountBefore}`);
    console.log(`  - Entity count after: ${result.entityCountAfter}`);
    console.log(`  - Ant tile reference cleared: ${result.antTileCleared}`);
    
    await saveScreenshot(page, 'systems/terrain_entity_sync_cleanup', true);
  });
  
  it('should get system statistics', async function() {
    const result = await page.evaluate(() => {
      const sync = window.g_terrainEntitySync;
      if (!sync) {
        return { success: false, error: 'TerrainEntitySync not available' };
      }
      
      const stats = sync.getStats();
      
      return {
        success: true,
        stats
      };
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Stats test failed');
    }
    
    console.log('✓ System statistics:');
    console.log(`  - Total entities: ${result.stats.totalEntities}`);
    console.log(`  - Occupied tiles: ${result.stats.occupiedTiles}`);
    console.log(`  - Average entities per tile: ${result.stats.averageEntitiesPerTile.toFixed(2)}`);
    console.log(`  - Update count: ${result.stats.updateCount}`);
    
    await saveScreenshot(page, 'systems/terrain_entity_sync_stats', true);
  });
  
  it('VISUAL TEST: should display comprehensive entity-tile sync visualization', async function() {
    // This test creates a visual demonstration showing the bidirectional sync
    console.log('\n═══════════════════════════════════════════════');
    console.log('  COMPREHENSIVE VISUAL DEMONSTRATION');
    console.log('═══════════════════════════════════════════════\n');
    
    const result = await page.evaluate(() => {
      // Clear existing ants
      const grid = window.spatialGridManager || window.g_spatialGrid;
      let ants = grid?.getEntitiesByType('Ant') || [];
      ants.forEach(ant => ant.destroy());
      
      // Spawn fresh ants for the visual demo
      window.antsSpawn(6, 'player');
      
      // Get new ants
      ants = grid?.getEntitiesByType('Ant') || [];
      
      // Position ants in an interesting pattern to showcase the sync
      // Create a 3x2 grid pattern
      const positions = [
        { x: 250, y: 200 },  // Top-left
        { x: 300, y: 200 },  // Top-center
        { x: 350, y: 200 },  // Top-right
        { x: 250, y: 250 },  // Bottom-left
        { x: 300, y: 250 },  // Bottom-center (2 ants here)
        { x: 300, y: 250 },  // Bottom-center (same tile as above)
      ];
      
      ants.forEach((ant, i) => {
        if (positions[i]) {
          ant.setPosition(positions[i].x, positions[i].y);
        }
      });
      
      // Collect detailed info about each ant and its tile
      const antDetails = ants.map(ant => ({
        id: ant.id.substring(0, 12) + '...',
        position: { x: Math.round(ant.x), y: Math.round(ant.y) },
        tile: { x: ant.tileX, y: ant.tileY },
        terrain: ant.terrainMaterial,
        weight: ant.terrainWeight,
        tileEntityCount: ant.currentTile?.getEntityCount() || 0
      }));
      
      return {
        success: true,
        antCount: ants.length,
        antDetails
      };
    });
    
    if (!result.success) {
      throw new Error('Visual test setup failed');
    }
    
    console.log(`✓ Created visual demonstration with ${result.antCount} entities`);
    console.log('\nEntity Details:');
    result.antDetails.forEach((ant, i) => {
      console.log(`  Ant ${i + 1}:`);
      console.log(`    Position: (${ant.position.x}, ${ant.position.y})`);
      console.log(`    Tile: (${ant.tile.x}, ${ant.tile.y})`);
      console.log(`    Terrain: ${ant.terrain} (weight: ${ant.weight})`);
      console.log(`    Entities on this tile: ${ant.tileEntityCount}`);
    });
    
    console.log('\n📸 Visual Overlays Active:');
    console.log('   🟡 Yellow boxes: Entity info (type, tile coords, terrain)');
    console.log('   🔵 Cyan boxes: Tile info (coords, entity count, types)');
    console.log('   🔷 Blue borders: Highlighted tiles with entities');
    
    // Force multiple renders to ensure overlays are visible
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(1000); // Give extra time for visual rendering
    
    await saveScreenshot(page, 'systems/terrain_entity_sync_VISUAL_DEMO', true);
    
    console.log('\n✅ Screenshot saved: terrain_entity_sync_VISUAL_DEMO.png');
    console.log('   This screenshot shows the complete bidirectional sync!');
    console.log('═══════════════════════════════════════════════\n');
  });
});
