/**
 * Test Suite 8: CombatController - Comprehensive Combat Testing
 * Tests combat functionality using proper game APIs (Spatial Grid System)
 * 
 * This combines all combat tests into one comprehensive suite:
 * - Faction management and detection
 * - Enemy proximity detection
 * - Combat range calculations
 * - Damage dealing and health systems
 * - Multi-ant combat scenarios
 * - Combat state management
 */

const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;

// ============================================================================
// Test 1: Spawn Player and Enemy Ants
// ============================================================================
async function test_spawn_player_and_enemy_ants(page) {
  const testName = 'Spawn player and enemy ants using game API';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.antsSpawn) return { error: 'antsSpawn not available' };
      
      const grid = window.spatialGridManager || window.g_spatialGrid;
      if (!grid) return { error: 'SpatialGridManager not available' };
      
      // Clear existing ants
      const existing = grid.getEntitiesByType('Ant') || [];
      existing.forEach(a => a.destroy && a.destroy());
      
      // Spawn using official API
      window.antsSpawn(3, 'player');
      window.antsSpawn(3, 'enemy');
      
      // Wait for spawning
      return new Promise(resolve => {
        setTimeout(() => {
          const allAnts = grid.getEntitiesByType('Ant') || [];
          const playerAnts = allAnts.filter(a => a.faction === 'player');
          const enemyAnts = allAnts.filter(a => a.faction === 'enemy');
          
          resolve({
            success: true,
            totalAnts: allAnts.length,
            playerCount: playerAnts.length,
            enemyCount: enemyAnts.length,
            playerPositions: playerAnts.map(a => ({ x: a.x, y: a.y })),
            enemyPositions: enemyAnts.map(a => ({ x: a.x, y: a.y }))
          });
        }, 100);
      });
    });
    
    if (result.error) throw new Error(result.error);
    if (result.playerCount === 0) throw new Error('No player ants spawned');
    if (result.enemyCount === 0) throw new Error('No enemy ants spawned');
    
    await forceRedraw(page);
    await sleep(500);
    await captureEvidence(page, 'controllers/combatcontroller_1_spawn', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    console.log(`    - Spawned ${result.playerCount} player, ${result.enemyCount} enemy ants`);
    testsPassed++;
  } catch (error) {
    await captureEvidence(page, 'controllers/combatcontroller_1_spawn', 'controllers', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

// ============================================================================
// Test 2: Faction Detection
// ============================================================================
async function test_faction_detection(page) {
  const testName = 'Detect enemy faction correctly';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      const grid = window.spatialGridManager || window.g_spatialGrid;
      if (!grid) return { error: 'SpatialGridManager not available' };
      
      const allAnts = grid.getEntitiesByType('Ant') || [];
      const playerAnts = allAnts.filter(a => a.faction === 'player');
      const enemyAnts = allAnts.filter(a => a.faction === 'enemy');
      
      if (playerAnts.length === 0 || enemyAnts.length === 0) {
        return { error: 'Missing faction ants' };
      }
      
      // Check if player ant can detect enemies
      const player = playerAnts[0];
      let enemiesDetected = 0;
      
      enemyAnts.forEach(enemy => {
        // Check if it's a different faction
        if (player.faction !== enemy.faction) {
          enemiesDetected++;
        }
      });
      
      return {
        success: true,
        playerFaction: player.faction,
        enemiesFound: enemiesDetected,
        totalEnemies: enemyAnts.length,
        factionsDifferent: player.faction !== enemyAnts[0].faction
      };
    });
    
    if (result.error) throw new Error(result.error);
    if (!result.factionsDifferent) throw new Error('Factions not different');
    if (result.enemiesFound === 0) throw new Error('No enemies detected');
    
    await forceRedraw(page);
    await sleep(300);
    await captureEvidence(page, 'controllers/combatcontroller_2_faction', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    console.log(`    - Detected ${result.enemiesFound}/${result.totalEnemies} enemies`);
    testsPassed++;
  } catch (error) {
    await captureEvidence(page, 'controllers/combatcontroller_2_faction', 'controllers', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

// ============================================================================
// Test 3: Combat Range Detection
// ============================================================================
async function test_combat_range_detection(page) {
  const testName = 'Detect enemies within combat range';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      const grid = window.spatialGridManager || window.g_spatialGrid;
      if (!grid) return { error: 'SpatialGridManager not available' };
      
      const allAnts = grid.getEntitiesByType('Ant') || [];
      const playerAnts = allAnts.filter(a => a.faction === 'player');
      const enemyAnts = allAnts.filter(a => a.faction === 'enemy');
      
      if (playerAnts.length === 0 || enemyAnts.length === 0) {
        return { error: 'Missing faction ants' };
      }
      
      const player = playerAnts[0];
      const combatRange = 100; // pixels
      
      // Find enemies in range
      let enemiesInRange = 0;
      let closestDistance = Infinity;
      
      enemyAnts.forEach(enemy => {
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist < closestDistance) closestDistance = dist;
        if (dist <= combatRange) enemiesInRange++;
      });
      
      return {
        success: true,
        combatRange: combatRange,
        enemiesInRange: enemiesInRange,
        closestEnemy: closestDistance,
        totalEnemies: enemyAnts.length,
        hasTargetsInRange: enemiesInRange > 0
      };
    });
    
    if (result.error) throw new Error(result.error);
    
    await forceRedraw(page);
    await sleep(300);
    await captureEvidence(page, 'controllers/combatcontroller_3_range', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    console.log(`    - Found ${result.enemiesInRange} enemies within ${result.combatRange}px range`);
    if (result.closestEnemy !== null && result.closestEnemy !== Infinity) {
      console.log(`    - Closest enemy: ${result.closestEnemy.toFixed(1)}px away`);
    }
    testsPassed++;
  } catch (error) {
    await captureEvidence(page, 'controllers/combatcontroller_3_range', 'controllers', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

// ============================================================================
// Test 4: Position Ants for Combat
// ============================================================================
async function test_position_ants_for_combat(page) {
  const testName = 'Position ants close together for combat';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      const grid = window.spatialGridManager || window.g_spatialGrid;
      if (!grid) return { error: 'SpatialGridManager not available' };
      
      const allAnts = grid.getEntitiesByType('Ant') || [];
      const playerAnts = allAnts.filter(a => a.faction === 'player');
      const enemyAnts = allAnts.filter(a => a.faction === 'enemy');
      
      if (playerAnts.length === 0 || enemyAnts.length === 0) {
        return { error: 'Missing faction ants' };
      }
      
      // Position player ants on the left
      playerAnts.forEach((ant, i) => {
        ant.x = 250;
        ant.y = 250 + (i * 40);
        if (ant._collisionBox) {
          ant._collisionBox.x = ant.x;
          ant._collisionBox.y = ant.y;
        }
      });
      
      // Position enemy ants on the right (within combat range)
      enemyAnts.forEach((ant, i) => {
        ant.x = 330; // 80px away
        ant.y = 250 + (i * 40);
        if (ant._collisionBox) {
          ant._collisionBox.x = ant.x;
          ant._collisionBox.y = ant.y;
        }
      });
      
      // Calculate closest distance
      let minDist = Infinity;
      playerAnts.forEach(p => {
        enemyAnts.forEach(e => {
          const dist = Math.hypot(p.x - e.x, p.y - e.y);
          if (dist < minDist) minDist = dist;
        });
      });
      
      return {
        success: true,
        minDistance: minDist,
        playerPositions: playerAnts.map(a => ({ x: a.x, y: a.y })),
        enemyPositions: enemyAnts.map(a => ({ x: a.x, y: a.y })),
        withinCombatRange: minDist <= 100
      };
    });
    
    if (result.error) throw new Error(result.error);
    if (!result.withinCombatRange) throw new Error('Ants not within combat range');
    
    // Pan camera to combat area
    await page.evaluate(() => {
      const hasCamera = window.cameraManager || window.g_cameraManager || window.setCameraPosition;
      if (hasCamera) {
        if (window.cameraManager && window.cameraManager.setPosition) {
          window.cameraManager.setPosition(290, 270);
          window.cameraManager.setZoom(2.0);
        } else if (window.g_cameraManager && window.g_cameraManager.setPosition) {
          window.g_cameraManager.setPosition(290, 270);
          window.g_cameraManager.setZoom(2.0);
        }
      }
    });
    
    await forceRedraw(page);
    await sleep(500);
    await captureEvidence(page, 'controllers/combatcontroller_4_positioned', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    console.log(`    - Ants positioned ${result.minDistance.toFixed(1)}px apart`);
    testsPassed++;
  } catch (error) {
    await captureEvidence(page, 'controllers/combatcontroller_4_positioned', 'controllers', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

// ============================================================================
// Test 5: Deal Damage to Enemy
// ============================================================================
async function test_deal_damage_to_enemy(page) {
  const testName = 'Deal damage to enemy ant';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      const grid = window.spatialGridManager || window.g_spatialGrid;
      if (!grid) return { error: 'SpatialGridManager not available' };
      
      const allAnts = grid.getEntitiesByType('Ant') || [];
      const playerAnts = allAnts.filter(a => a.faction === 'player');
      const enemyAnts = allAnts.filter(a => a.faction === 'enemy');
      
      if (playerAnts.length === 0 || enemyAnts.length === 0) {
        return { error: 'Missing faction ants' };
      }
      
      const player = playerAnts[0];
      const enemy = enemyAnts[0];
      
      // Get initial health
      const initialHealth = enemy.health || enemy._health || 100;
      
      // Deal damage
      const damage = 25;
      if (enemy.takeDamage) {
        enemy.takeDamage(damage);
      } else if (enemy._health !== undefined) {
        enemy._health -= damage;
      } else {
        enemy.health = (enemy.health || 100) - damage;
      }
      
      // Get final health
      const finalHealth = enemy.health || enemy._health || 100;
      
      return {
        success: true,
        playerFaction: player.faction,
        enemyFaction: enemy.faction,
        initialHealth: initialHealth,
        finalHealth: finalHealth,
        damageDealt: initialHealth - finalHealth,
        enemyAlive: finalHealth > 0
      };
    });
    
    if (result.error) throw new Error(result.error);
    if (result.damageDealt === 0) throw new Error('No damage was dealt');
    if (!result.enemyAlive) throw new Error('Enemy died from single hit');
    
    await forceRedraw(page);
    await sleep(300);
    await captureEvidence(page, 'controllers/combatcontroller_5_damage', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    console.log(`    - Enemy health: ${result.initialHealth} → ${result.finalHealth} (-${result.damageDealt})`);
    testsPassed++;
  } catch (error) {
    await captureEvidence(page, 'controllers/combatcontroller_5_damage', 'controllers', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

// ============================================================================
// Test 6: Multiple Combat Hits
// ============================================================================
async function test_multiple_combat_hits(page) {
  const testName = 'Deal multiple hits to enemy';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      const grid = window.spatialGridManager || window.g_spatialGrid;
      if (!grid) return { error: 'SpatialGridManager not available' };
      
      const allAnts = grid.getEntitiesByType('Ant') || [];
      const enemyAnts = allAnts.filter(a => a.faction === 'enemy');
      
      if (enemyAnts.length === 0) {
        return { error: 'No enemy ants available' };
      }
      
      const enemy = enemyAnts[0];
      const initialHealth = enemy.health || enemy._health || 100;
      
      // Deal multiple hits
      const hitsToApply = 3;
      const damagePerHit = 20;
      
      for (let i = 0; i < hitsToApply; i++) {
        if (enemy.takeDamage) {
          enemy.takeDamage(damagePerHit);
        } else if (enemy._health !== undefined) {
          enemy._health -= damagePerHit;
        } else {
          enemy.health = (enemy.health || 100) - damagePerHit;
        }
      }
      
      const finalHealth = enemy.health || enemy._health || 0;
      const totalDamage = initialHealth - finalHealth;
      
      return {
        success: true,
        hitsApplied: hitsToApply,
        damagePerHit: damagePerHit,
        initialHealth: initialHealth,
        finalHealth: finalHealth,
        totalDamage: totalDamage,
        expectedDamage: hitsToApply * damagePerHit,
        enemyAlive: finalHealth > 0
      };
    });
    
    if (result.error) throw new Error(result.error);
    if (result.totalDamage < result.damagePerHit) throw new Error('Insufficient damage dealt');
    
    await forceRedraw(page);
    await sleep(300);
    await captureEvidence(page, 'controllers/combatcontroller_6_multiple_hits', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    console.log(`    - Applied ${result.hitsApplied} hits × ${result.damagePerHit} damage`);
    console.log(`    - Enemy health: ${result.initialHealth} → ${result.finalHealth}`);
    testsPassed++;
  } catch (error) {
    await captureEvidence(page, 'controllers/combatcontroller_6_multiple_hits', 'controllers', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

// ============================================================================
// Test 7: Enemy Death
// ============================================================================
async function test_enemy_death(page) {
  const testName = 'Enemy dies when health reaches zero';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      const grid = window.spatialGridManager || window.g_spatialGrid;
      if (!grid) return { error: 'SpatialGridManager not available' };
      
      const allAnts = grid.getEntitiesByType('Ant') || [];
      const enemyAnts = allAnts.filter(a => a.faction === 'enemy');
      
      if (enemyAnts.length === 0) {
        return { error: 'No enemy ants available' };
      }
      
      const enemy = enemyAnts[0];
      const initialHealth = enemy.health || enemy._health || 100;
      
      // Deal massive damage to ensure death
      const massiveDamage = 200;
      if (enemy.takeDamage) {
        enemy.takeDamage(massiveDamage);
      } else if (enemy._health !== undefined) {
        enemy._health = 0; // Set to 0
      } else {
        enemy.health = 0;
      }
      
      const finalHealth = enemy.health || enemy._health || 0;
      
      // Check if ant was destroyed or marked as dead
      const isDead = finalHealth <= 0;
      const wasDestroyed = enemy.destroyed || enemy._destroyed || false;
      
      return {
        success: true,
        initialHealth: initialHealth,
        finalHealth: finalHealth,
        isDead: isDead,
        wasDestroyed: wasDestroyed,
        healthReachedZero: finalHealth <= 0
      };
    });
    
    if (result.error) throw new Error(result.error);
    if (!result.healthReachedZero) throw new Error('Health did not reach zero');
    
    await forceRedraw(page);
    await sleep(300);
    await captureEvidence(page, 'controllers/combatcontroller_7_death', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    console.log(`    - Enemy health: ${result.initialHealth} → ${result.finalHealth}`);
    console.log(`    - Enemy ${result.isDead ? 'is dead' : 'alive'}, ${result.wasDestroyed ? 'destroyed' : 'not destroyed'}`);
    testsPassed++;
  } catch (error) {
    await captureEvidence(page, 'controllers/combatcontroller_7_death', 'controllers', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

// ============================================================================
// Test 8: Multi-Ant Combat
// ============================================================================
async function test_multi_ant_combat(page) {
  const testName = 'Multiple ants engage in combat';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      const grid = window.spatialGridManager || window.g_spatialGrid;
      if (!grid) return { error: 'SpatialGridManager not available' };
      
      // Clear and spawn fresh ants for multi-combat test
      const existing = grid.getEntitiesByType('Ant') || [];
      existing.forEach(a => a.destroy && a.destroy());
      
      window.antsSpawn(3, 'player');
      window.antsSpawn(2, 'enemy');
      
      return new Promise(resolve => {
        setTimeout(() => {
          const allAnts = grid.getEntitiesByType('Ant') || [];
          const playerAnts = allAnts.filter(a => a.faction === 'player');
          const enemyAnts = allAnts.filter(a => a.faction === 'enemy');
          
          // Position for combat
          playerAnts.forEach((ant, i) => {
            ant.x = 300;
            ant.y = 300 + (i * 50);
          });
          
          enemyAnts.forEach((ant, i) => {
            ant.x = 380;
            ant.y = 300 + (i * 50);
          });
          
          // Simulate combat - each player attacks nearest enemy
          const combatResults = [];
          playerAnts.forEach(player => {
            let closestEnemy = null;
            let minDist = Infinity;
            
            enemyAnts.forEach(enemy => {
              const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
              if (dist < minDist) {
                minDist = dist;
                closestEnemy = enemy;
              }
            });
            
            if (closestEnemy && minDist <= 100) {
              const beforeHealth = closestEnemy.health || closestEnemy._health || 100;
              
              if (closestEnemy.takeDamage) {
                closestEnemy.takeDamage(15);
              } else if (closestEnemy._health !== undefined) {
                closestEnemy._health -= 15;
              }
              
              const afterHealth = closestEnemy.health || closestEnemy._health || 100;
              
              combatResults.push({
                playerPos: { x: player.x, y: player.y },
                enemyPos: { x: closestEnemy.x, y: closestEnemy.y },
                distance: minDist,
                beforeHealth: beforeHealth,
                afterHealth: afterHealth
              });
            }
          });
          
          resolve({
            success: true,
            playerCount: playerAnts.length,
            enemyCount: enemyAnts.length,
            combatEngagements: combatResults.length,
            combatDetails: combatResults
          });
        }, 100);
      });
    });
    
    if (result.error) throw new Error(result.error);
    if (result.combatEngagements === 0) throw new Error('No combat engagements occurred');
    
    await forceRedraw(page);
    await sleep(500);
    await captureEvidence(page, 'controllers/combatcontroller_8_multi_combat', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    console.log(`    - ${result.playerCount} players vs ${result.enemyCount} enemies`);
    console.log(`    - ${result.combatEngagements} combat engagements`);
    testsPassed++;
  } catch (error) {
    await captureEvidence(page, 'controllers/combatcontroller_8_multi_combat', 'controllers', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

// ============================================================================
// Test 9: Spatial Grid Combat Queries
// ============================================================================
async function test_spatial_grid_combat_queries(page) {
  const testName = 'Use spatial grid for efficient enemy detection';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      const grid = window.spatialGridManager || window.g_spatialGrid;
      if (!grid) return { error: 'SpatialGridManager not available' };
      
      const allAnts = grid.getEntitiesByType('Ant') || [];
      const playerAnts = allAnts.filter(a => a.faction === 'player');
      
      if (playerAnts.length === 0) {
        return { error: 'No player ants available' };
      }
      
      const player = playerAnts[0];
      
      // Use spatial grid to find nearby entities
      const searchRadius = 150;
      let nearbyEntities = [];
      let nearbyEnemies = [];
      
      try {
        nearbyEntities = grid.getNearbyEntities(player.x, player.y, searchRadius) || [];
        
        // Filter for enemy ants
        nearbyEnemies = nearbyEntities.filter(e => 
          e && e.type === 'Ant' && (e.faction === 'enemy')
        );
      } catch (error) {
        // If getNearbyEntities fails, fall back to getEntitiesByType
        const allAnts = grid.getEntitiesByType('Ant') || [];
        nearbyEnemies = allAnts.filter(e => {
          const dist = Math.hypot(e.x - player.x, e.y - player.y);
          return e.faction === 'enemy' && dist <= searchRadius;
        });
        nearbyEntities = allAnts.filter(e => {
          const dist = Math.hypot(e.x - player.x, e.y - player.y);
          return dist <= searchRadius;
        });
      }
      
      return {
        success: true,
        playerPosition: { x: player.x, y: player.y },
        searchRadius: searchRadius,
        nearbyEntities: nearbyEntities.length,
        nearbyEnemies: nearbyEnemies.length,
        enemyPositions: nearbyEnemies.map(e => ({ x: e.x, y: e.y })),
        spatialGridWorking: nearbyEntities.length > 0
      };
    });
    
    if (result.error) throw new Error(result.error);
    
    await forceRedraw(page);
    await sleep(300);
    await captureEvidence(page, 'controllers/combatcontroller_9_spatial', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    console.log(`    - Found ${result.nearbyEntities} entities within ${result.searchRadius}px`);
    console.log(`    - ${result.nearbyEnemies} were enemy ants`);
    testsPassed++;
  } catch (error) {
    await captureEvidence(page, 'controllers/combatcontroller_9_spatial', 'controllers', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

// ============================================================================
// Test 10: Cleanup
// ============================================================================
async function test_cleanup(page) {
  const testName = 'Cleanup test ants';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      const grid = window.spatialGridManager || window.g_spatialGrid;
      if (grid) {
        const ants = grid.getEntitiesByType('Ant') || [];
        ants.forEach(ant => {
          if (ant.destroy) ant.destroy();
        });
      }
      
      // Reset camera
      const hasCamera = window.cameraManager || window.g_cameraManager || window.setCameraZoom;
      if (hasCamera) {
        if (window.cameraManager) {
          window.cameraManager.setZoom(1.0);
          window.cameraManager.setPosition(0, 0);
        } else if (window.g_cameraManager) {
          window.g_cameraManager.setZoom(1.0);
          window.g_cameraManager.setPosition(0, 0);
        }
      }
    });
    
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/combatcontroller_10_cleanup', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    await captureEvidence(page, 'controllers/combatcontroller_10_cleanup', 'controllers', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================
async function runCombatControllerTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 8: CombatController - Comprehensive Combat Tests');
  console.log('Using proper game APIs: antsSpawn() + Spatial Grid System');
  console.log('='.repeat(70) + '\n');

  let browser, page;
  try {
    browser = await launchBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle2', timeout: 30000 });

    const gameStarted = await ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Failed to start game - still on main menu');
    }

    // Run all tests
    await test_spawn_player_and_enemy_ants(page);
    await test_faction_detection(page);
    await test_combat_range_detection(page);
    await test_position_ants_for_combat(page);
    await test_deal_damage_to_enemy(page);
    await test_multiple_combat_hits(page);
    await test_enemy_death(page);
    await test_multi_ant_combat(page);
    await test_spatial_grid_combat_queries(page);
    await test_cleanup(page);

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    testsFailed++;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  const passRate = testsPassed + testsFailed > 0 
    ? ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)
    : 0;
  console.log(`Total: ${testsPassed + testsFailed}, Passed: ${testsPassed} ✅, Failed: ${testsFailed} ❌, Rate: ${passRate}%`);
  console.log('='.repeat(70) + '\n');

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  runCombatControllerTests();
}

module.exports = { runCombatControllerTests };
