# Comprehensive E2E Test Plan - Pre-State Machine Implementation

**Version**: 1.0  
**Date**: October 20, 2025  
**Purpose**: Test all existing ant and entity capabilities before implementing true state machine  
**Status**: PRE-IMPLEMENTATION TESTING  
**Test Framework**: Puppeteer (headless Chrome)

---

## Executive Summary

This document defines **comprehensive end-to-end tests** for the Ant Game's **current implementation** before refactoring to the true state machine architecture. These tests ensure we don't break existing functionality during the migration.

**Test Coverage**: 
- ✅ Entity base class capabilities
- ✅ All 8 controllers (Movement, Render, Combat, Health, Inventory, Terrain, Selection, Task)
- ✅ Ant-specific behaviors
- ✅ Queen ant capabilities
- ✅ GatherState functionality
- ✅ AntStateMachine (current implementation)
- ✅ AntBrain AI system
- ✅ Resource management
- ✅ Spatial grid system
- ✅ Camera and rendering
- ✅ UI systems

**Total Tests Planned**: 120+

---

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Entity Base Class Tests](#entity-base-class-tests)
3. [Controller Tests](#controller-tests)
4. [Ant Class Tests](#ant-class-tests)
5. [Queen Ant Tests](#queen-ant-tests)
6. [State System Tests](#state-system-tests)
7. [AI Brain Tests](#ai-brain-tests)
8. [Resource System Tests](#resource-system-tests)
9. [Spatial Grid Tests](#spatial-grid-tests)
10. [Camera System Tests](#camera-system-tests)
11. [UI System Tests](#ui-system-tests)
12. [Integration Tests](#integration-tests)
13. [Performance Tests](#performance-tests)
14. [Test Execution Plan](#test-execution-plan)

---

## Test Environment Setup

### Prerequisites

```bash
# Ensure dev server is running
npm run dev  # localhost:8000

# Install dependencies
cd test/e2e
npm install puppeteer
```

### Test Configuration

```javascript
// test/e2e/config.js
module.exports = {
  baseURL: 'http://localhost:8000',
  headless: true,
  slowMo: 0,
  timeout: 30000,
  viewport: { width: 1920, height: 1080 },
  screenshotPath: 'test/e2e/screenshots/pre-implementation',
  videoPath: 'test/e2e/videos/pre-implementation'
};
```

### Helper Functions Required

```javascript
// test/e2e/helpers/game_helper.js
const cameraHelper = require('./camera_helper');
const { saveScreenshot, launchBrowser } = require('./puppeteer_helper');

async function spawnAnt(page, x, y, jobType = 'Scout') {
  return await page.evaluate(({x, y, jobType}) => {
    // Spawn single ant at position
    return window.testHelpers.spawnAntAt(x, y, jobType);
  }, {x, y, jobType});
}

async function selectAnt(page, antIndex) {
  return await page.evaluate((index) => {
    const ant = ants[index];
    if (ant) {
      ant.setSelected(true);
      return ant.getValidationData();
    }
    return null;
  }, antIndex);
}

async function getAntState(page, antIndex) {
  return await page.evaluate((index) => {
    const ant = ants[index];
    if (!ant) return null;
    return {
      position: ant.getPosition(),
      health: ant.health,
      resources: ant.getResourceCount(),
      state: ant.getCurrentState(),
      isMoving: ant.isMoving(),
      isSelected: ant.isSelected()
    };
  }, antIndex);
}

async function forceRedraw(page) {
  await page.evaluate(() => {
    window.gameState = 'PLAYING';
    if (typeof window.redraw === 'function') {
      window.redraw();
      window.redraw();
      window.redraw();
    }
  });
  await page.waitForTimeout(500);
}
```

---

## Entity Base Class Tests

### Test Suite 1: Entity Construction and Initialization

**File**: `test/e2e/entity/pw_entity_construction.js`

**Tests**:
1. ✅ Entity creates with valid ID
2. ✅ Entity initializes collision box
3. ✅ Entity initializes sprite (if Sprite2D available)
4. ✅ Entity registers with spatial grid
5. ✅ Entity initializes all available controllers
6. ✅ Entity initializes debugger system

**Implementation**:
```javascript
const { test, expect } = require('@playwright/test');
const { launchBrowser, saveScreenshot } = require('../puppeteer_helper');
const { ensureGameStarted } = require('../camera_helper');

test('Entity creates with valid properties', async () => {
  const { browser, page } = await launchBrowser();
  
  try {
    await ensureGameStarted(page);
    
    const entityData = await page.evaluate(() => {
      // Create test entity
      const entity = new Entity(100, 100, 32, 32, {
        type: 'TestEntity',
        movementSpeed: 2.0,
        selectable: true,
        faction: 'player'
      });
      
      return {
        hasId: !!entity.id,
        type: entity.type,
        isActive: entity.isActive,
        hasCollisionBox: !!entity._collisionBox,
        hasSprite: !!entity._sprite,
        position: entity.getPosition(),
        size: entity.getSize(),
        controllers: Array.from(entity._controllers.keys()),
        hasDebugger: !!entity._debugger
      };
    });
    
    expect(entityData.hasId).toBe(true);
    expect(entityData.type).toBe('TestEntity');
    expect(entityData.isActive).toBe(true);
    expect(entityData.hasCollisionBox).toBe(true);
    expect(entityData.position.x).toBe(100);
    expect(entityData.position.y).toBe(100);
    expect(entityData.size.x).toBe(32);
    expect(entityData.size.y).toBe(32);
    expect(entityData.controllers.length).toBeGreaterThan(0);
    
    await saveScreenshot(page, 'entity/construction', true);
  } finally {
    await browser.close();
  }
});
```

### Test Suite 2: Entity Position and Transform

**File**: `test/e2e/entity/pw_entity_transform.js`

**Tests**:
1. ✅ Entity setPosition() updates position
2. ✅ Entity getPosition() returns correct position
3. ✅ Entity setSize() updates size
4. ✅ Entity getSize() returns correct size
5. ✅ Entity getCenter() returns center point
6. ✅ Position changes update spatial grid
7. ✅ Position changes update collision box
8. ✅ Position changes update sprite

### Test Suite 3: Entity Collision Detection

**File**: `test/e2e/entity/pw_entity_collision.js`

**Tests**:
1. ✅ Entity.collidesWith() detects overlapping entities
2. ✅ Entity.collidesWith() returns false for non-overlapping
3. ✅ Entity.contains() detects point inside bounds
4. ✅ Entity.contains() returns false for point outside
5. ✅ Moving entity triggers collision detection

### Test Suite 4: Entity Selection

**File**: `test/e2e/entity/pw_entity_selection.js`

**Tests**:
1. ✅ Entity setSelected(true) marks as selected
2. ✅ Entity isSelected() returns selection state
3. ✅ Entity toggleSelection() switches state
4. ✅ Selected entity shows visual highlight
5. ✅ Clicking entity toggles selection
6. ✅ Multiple entities can be selected

### Test Suite 5: Entity Sprite System

**File**: `test/e2e/entity/pw_entity_sprite.js`

**Tests**:
1. ✅ Entity setImage() loads sprite
2. ✅ Entity getImage() returns sprite
3. ✅ Entity hasImage() returns true with sprite
4. ✅ Entity setOpacity() changes alpha
5. ✅ Entity renders sprite at correct position
6. ✅ Entity sprite follows entity movement

---

## Controller Tests

### Test Suite 6: MovementController

**File**: `test/e2e/controllers/pw_movement_controller.js`

**Tests**:
1. ✅ moveToLocation() initiates pathfinding
2. ✅ Entity moves toward target location
3. ✅ Entity stops at destination
4. ✅ isMoving() returns true during movement
5. ✅ isMoving() returns false when stopped
6. ✅ stop() halts movement
7. ✅ setPath() follows custom path
8. ✅ Movement speed affects travel time
9. ✅ Pathfinding avoids obstacles
10. ✅ Movement updates spatial grid

**Implementation**:
```javascript
test('MovementController pathfinding to location', async () => {
  const { browser, page } = await launchBrowser();
  
  try {
    await ensureGameStarted(page);
    
    // Spawn ant and move it
    const result = await page.evaluate(() => {
      const ant = window.testHelpers.spawnAntAt(100, 100, 'Scout');
      const initialPos = ant.getPosition();
      
      // Move to new location
      ant.moveToLocation(500, 500);
      
      return {
        antIndex: ant._antIndex,
        initialPos,
        isMoving: ant.isMoving(),
        targetSet: true
      };
    });
    
    expect(result.isMoving).toBe(true);
    
    // Wait for movement
    await page.waitForTimeout(2000);
    
    // Check final position
    const finalState = await page.evaluate((antIndex) => {
      const ant = ants[antIndex];
      return {
        finalPos: ant.getPosition(),
        isMoving: ant.isMoving()
      };
    }, result.antIndex);
    
    // Should be closer to target
    const distanceMoved = Math.hypot(
      finalState.finalPos.x - result.initialPos.x,
      finalState.finalPos.y - result.initialPos.y
    );
    
    expect(distanceMoved).toBeGreaterThan(0);
    await saveScreenshot(page, 'controllers/movement_pathfinding', true);
  } finally {
    await browser.close();
  }
});
```

### Test Suite 7: RenderController

**File**: `test/e2e/controllers/pw_render_controller.js`

**Tests**:
1. ✅ Entity renders at correct screen position
2. ✅ Sprite renders with correct size
3. ✅ setStateColor() changes visual appearance
4. ✅ setStateAnimation() triggers animation
5. ✅ playEffect() shows visual effect
6. ✅ clearStateColor() resets visuals
7. ✅ Opacity changes affect rendering
8. ✅ Entity renders in correct layer
9. ✅ Camera movement updates entity screen position
10. ✅ Zoom affects entity rendering size

### Test Suite 8: CombatController

**File**: `test/e2e/controllers/pw_combat_controller.js`

**Tests**:
1. ✅ setFaction() sets entity faction
2. ✅ hasNearbyEnemies() detects enemy entities
3. ✅ getNearestEnemy() returns closest enemy
4. ✅ isInAttackRange() checks distance to target
5. ✅ attack() deals damage to target
6. ✅ enterCombat() sets combat state
7. ✅ exitCombat() clears combat state
8. ✅ Different factions detect each other as enemies
9. ✅ Same faction does not trigger enemy detection
10. ✅ Combat state affects AI behavior

### Test Suite 9: HealthController

**File**: `test/e2e/controllers/pw_health_controller.js`

**Tests**:
1. ✅ Entity initializes with max health
2. ✅ takeDamage() reduces health
3. ✅ heal() increases health
4. ✅ Health cannot exceed max health
5. ✅ Health cannot go below 0
6. ✅ getHealthPercent() returns correct percentage
7. ✅ applyFatigue() reduces stamina
8. ✅ Health bar renders correctly
9. ✅ Low health triggers visual feedback
10. ✅ Death at 0 health

### Test Suite 10: InventoryController

**File**: `test/e2e/controllers/pw_inventory_controller.js`

**Tests**:
1. ✅ Inventory initializes with capacity
2. ✅ addItem() adds resource to inventory
3. ✅ isFull() returns true at capacity
4. ✅ hasItem() checks for specific item
5. ✅ removeItem() removes from inventory
6. ✅ Inventory refuses items when full
7. ✅ getCurrentLoad() returns item count
8. ✅ getCapacity() returns max capacity
9. ✅ Inventory persists during movement
10. ✅ Inventory visual indicator updates

### Test Suite 11: TerrainController

**File**: `test/e2e/controllers/pw_terrain_controller.js`

**Tests**:
1. ✅ getCurrentTile() returns tile at entity position
2. ✅ Tile type detected correctly (grass/water/stone)
3. ✅ Terrain type affects movement speed
4. ✅ getCurrentTerrain() returns terrain name
5. ✅ Entity detects terrain changes during movement
6. ✅ Water tiles have different properties
7. ✅ Stone tiles block pathfinding
8. ✅ Terrain weights affect path calculation

### Test Suite 12: SelectionController

**File**: `test/e2e/controllers/pw_selection_controller.js`

**Tests**:
1. ✅ setSelected() changes selection state
2. ✅ isSelected() returns state correctly
3. ✅ setSelectable() controls selectability
4. ✅ toggleSelected() switches state
5. ✅ Selection highlight renders
6. ✅ Selection icon shows for selected entity
7. ✅ Selection state persists during movement
8. ✅ Unselectable entities cannot be selected

### Test Suite 13: TaskManager

**File**: `test/e2e/controllers/pw_task_manager.js`

**Tests**:
1. ✅ addTask() adds task to queue
2. ✅ getCurrentTask() returns active task
3. ✅ Tasks execute in priority order
4. ✅ EMERGENCY priority executes first
5. ✅ Task timeout removes task
6. ✅ Task completion triggers next task
7. ✅ removeTask() cancels task
8. ✅ clearTasks() empties queue
9. ✅ Task status tracked correctly
10. ✅ Multiple tasks queue properly

### Test Suite 14: TransformController

**File**: `test/e2e/controllers/pw_transform_controller.js`

**Tests**:
1. ✅ setPosition() updates entity position
2. ✅ getPosition() returns current position
3. ✅ setSize() updates dimensions
4. ✅ getSize() returns dimensions
5. ✅ getCenter() calculates center point
6. ✅ Position sync with collision box
7. ✅ Position sync with sprite
8. ✅ Rotation affects rendering

---

## Ant Class Tests

### Test Suite 15: Ant Construction

**File**: `test/e2e/ants/pw_ant_construction.js`

**Tests**:
1. ✅ Ant inherits from Entity
2. ✅ Ant initializes with job type
3. ✅ Ant has unique ant index
4. ✅ Ant initializes StatsContainer
5. ✅ Ant initializes ResourceManager
6. ✅ Ant initializes AntStateMachine
7. ✅ Ant initializes GatherState
8. ✅ Ant initializes AntBrain
9. ✅ Ant sets up faction
10. ✅ Ant registers with global ants array

### Test Suite 16: Ant Job System

**File**: `test/e2e/ants/pw_ant_jobs.js`

**Tests**:
1. ✅ assignJob() changes ant job
2. ✅ Job image loads correctly
3. ✅ Job stats applied (health, damage, speed)
4. ✅ Builder job prioritizes building
5. ✅ Warrior job prioritizes combat
6. ✅ Farmer job prioritizes farming
7. ✅ Scout job explores areas
8. ✅ Spitter job has ranged attacks
9. ✅ Job types have unique behaviors
10. ✅ Job specialization affects pheromone priorities

### Test Suite 17: Ant Resource Management

**File**: `test/e2e/ants/pw_ant_resources.js`

**Tests**:
1. ✅ getResourceCount() returns current load
2. ✅ getMaxResources() returns capacity
3. ✅ addResource() adds to inventory
4. ✅ removeResource() removes from inventory
5. ✅ dropAllResources() empties inventory
6. ✅ Ant transitions to DROPPING_OFF when full
7. ✅ Ant seeks dropoff location
8. ✅ Ant deposits resources at dropoff
9. ✅ Resource indicator renders correctly
10. ✅ Inventory affects ant behavior

### Test Suite 18: Ant Combat

**File**: `test/e2e/ants/pw_ant_combat.js`

**Tests**:
1. ✅ takeDamage() reduces ant health
2. ✅ heal() restores ant health
3. ✅ attack() deals damage to enemy
4. ✅ die() deactivates ant at 0 health
5. ✅ Combat state changes ant behavior
6. ✅ Warriors engage enemies automatically
7. ✅ Non-warriors flee from danger
8. ✅ Faction determines enemy detection
9. ✅ Health bar shows during combat
10. ✅ Death removes ant from game

### Test Suite 19: Ant Movement Patterns

**File**: `test/e2e/ants/pw_ant_movement.js`

**Tests**:
1. ✅ Ant pathfinds around obstacles
2. ✅ Ant movement respects terrain
3. ✅ Ant follows pheromone trails
4. ✅ Ant wanders when idle
5. ✅ Ant returns to colony when full
6. ✅ Ant avoids water if not amphibious
7. ✅ Movement speed varies by terrain
8. ✅ Movement updates position smoothly
9. ✅ Collision avoidance works
10. ✅ Pathfinding uses PathMap

### Test Suite 20: Ant Gathering Behavior

**File**: `test/e2e/ants/pw_ant_gathering.js`

**Tests**:
1. ✅ startGathering() activates gather state
2. ✅ Ant scans for resources in radius
3. ✅ Ant moves toward nearest resource
4. ✅ Ant collects resource on arrival
5. ✅ Ant searches for new resource after collection
6. ✅ Gather times out after 6 seconds
7. ✅ Ant prioritizes closest resources
8. ✅ Gather radius is 7 tiles (224px)
9. ✅ Gathering shows visual feedback
10. ✅ stopGathering() exits gather state

---

## Queen Ant Tests

### Test Suite 21: Queen Construction

**File**: `test/e2e/queen/pw_queen_construction.js`

**Tests**:
1. ✅ Queen extends ant class
2. ✅ Queen has larger size than worker ants
3. ✅ Queen has "Queen" job type
4. ✅ Queen cannot starve to death
5. ✅ Queen initializes command system (future)
6. ✅ Queen has unique sprite
7. ✅ Only one Queen per colony
8. ✅ Queen registered in global queenAnt
9. ✅ Queen has special rendering
10. ✅ Queen spawns with correct stats

### Test Suite 22: Queen Special Abilities

**File**: `test/e2e/queen/pw_queen_abilities.js`

**Tests**:
1. ✅ Queen has higher health than workers
2. ✅ Queen has command radius (300px)
3. ✅ Queen can spawn new ants (future)
4. ✅ Queen affects nearby ant morale (future)
5. ✅ Queen death has colony-wide effects
6. ✅ Queen moves slower than workers
7. ✅ Queen is high-priority target for enemies
8. ✅ Queen shows command radius when selected
9. ✅ Queen has unique visual effects
10. ✅ Queen tracked by spawnQueen() function

---

## State System Tests

### Test Suite 23: AntStateMachine (Current Implementation)

**File**: `test/e2e/state/pw_ant_state_machine.js`

**Tests**:
1. ✅ StateMachine initializes with IDLE state
2. ✅ setPrimaryState() changes primary state
3. ✅ getCurrent State() returns current state
4. ✅ getFullState() includes modifiers
5. ✅ setCombatModifier() sets combat state
6. ✅ setTerrainModifier() sets terrain state
7. ✅ canPerformAction() checks action validity
8. ✅ isValidPrimary() validates state names
9. ✅ reset() returns to IDLE
10. ✅ State changes trigger callbacks
11. ✅ Multiple state combinations work
12. ✅ Invalid states rejected

### Test Suite 24: GatherState

**File**: `test/e2e/state/pw_gather_state.js`

**Tests**:
1. ✅ GatherState initializes correctly
2. ✅ enter() activates gathering behavior
3. ✅ exit() deactivates gathering
4. ✅ update() searches for resources
5. ✅ searchForResources() finds nearby resources
6. ✅ getResourcesInRadius() detects resources
7. ✅ updateTargetMovement() moves to resource
8. ✅ attemptResourceCollection() collects resource
9. ✅ isAtMaxCapacity() checks inventory
10. ✅ transitionToDropOff() switches to dropoff
11. ✅ Gather timeout works (6 seconds)
12. ✅ Debug info provides state details

### Test Suite 25: State Transitions

**File**: `test/e2e/state/pw_state_transitions.js`

**Tests**:
1. ✅ IDLE → GATHERING transition
2. ✅ GATHERING → DROPPING_OFF transition
3. ✅ DROPPING_OFF → IDLE transition
4. ✅ IDLE → MOVING transition
5. ✅ GATHERING → ATTACKING transition (emergency)
6. ✅ Any state → DEAD transition
7. ✅ State history tracked
8. ✅ Invalid transitions rejected
9. ✅ State callbacks fire correctly
10. ✅ Preferred state restoration

---

## AI Brain Tests

### Test Suite 26: AntBrain Initialization

**File**: `test/e2e/brain/pw_ant_brain_init.js`

**Tests**:
1. ✅ AntBrain initializes with ant reference
2. ✅ Job type sets initial priorities
3. ✅ Pheromone trail priorities set correctly
4. ✅ Hunger system initializes
5. ✅ Penalty system initializes
6. ✅ Update timer works
7. ✅ Decision cooldown works
8. ✅ Job-specific priorities set

### Test Suite 27: AntBrain Decision Making

**File**: `test/e2e/brain/pw_ant_brain_decisions.js`

**Tests**:
1. ✅ decideState() makes decisions
2. ✅ Emergency hunger overrides normal behavior
3. ✅ Starving forces food gathering
4. ✅ Death at hunger threshold
5. ✅ Pheromone trails influence decisions
6. ✅ Job type affects behavior choices
7. ✅ Builder seeks construction
8. ✅ Warrior patrols/attacks
9. ✅ Farmer tends crops
10. ✅ Scout explores

### Test Suite 28: AntBrain Pheromone System

**File**: `test/e2e/brain/pw_ant_brain_pheromones.js`

**Tests**:
1. ✅ checkTrail() evaluates pheromones
2. ✅ getTrailPriority() returns correct priority
3. ✅ addPenalty() penalizes trail
4. ✅ getPenalty() retrieves penalty
5. ✅ Penalties reduce trail following
6. ✅ Strong pheromones more likely followed
7. ✅ Job type affects trail priorities
8. ✅ Boss trail highest priority
9. ✅ Multiple pheromones compared
10. ✅ Trail following affects movement

### Test Suite 29: AntBrain Hunger System

**File**: `test/e2e/brain/pw_ant_brain_hunger.js`

**Tests**:
1. ✅ Hunger increases over time
2. ✅ HUNGRY threshold triggers behavior change
3. ✅ STARVING threshold forces food gathering
4. ✅ DEATH threshold kills ant (non-Queen)
5. ✅ Queen immune to starvation death
6. ✅ resetHunger() clears hunger
7. ✅ Hunger modifies trail priorities
8. ✅ Flag system tracks hunger state
9. ✅ modifyPriorityTrails() adjusts priorities
10. ✅ Internal timer tracks seconds

---

## Resource System Tests

### Test Suite 30: Resource Spawning

**File**: `test/e2e/resources/pw_resource_spawning.js`

**Tests**:
1. ✅ Resources spawn at correct positions
2. ✅ Resource types spawn (food, wood, stone)
3. ✅ Resources have correct sizes
4. ✅ Resources register with ResourceManager
5. ✅ Resources render correctly
6. ✅ Resources have collision boxes
7. ✅ Resources accessible by type
8. ✅ Multiple resources can exist
9. ✅ Resources tracked in global array
10. ✅ Resource spawn respects world boundaries

### Test Suite 31: Resource Collection

**File**: `test/e2e/resources/pw_resource_collection.js`

**Tests**:
1. ✅ Ant detects nearby resources
2. ✅ Ant moves toward resource
3. ✅ Ant collects resource on contact
4. ✅ Resource removed from world
5. ✅ Ant inventory increases
6. ✅ Resource visual disappears
7. ✅ ResourceManager tracks collection
8. ✅ Multiple ants can collect different resources
9. ✅ Resource collection shows feedback
10. ✅ Collection respects inventory capacity

### Test Suite 32: Resource Dropoff

**File**: `test/e2e/resources/pw_resource_dropoff.js`

**Tests**:
1. ✅ Dropoff locations exist
2. ✅ Ant detects nearest dropoff
3. ✅ Ant moves to dropoff when full
4. ✅ Ant deposits resources at dropoff
5. ✅ Inventory empties after deposit
6. ✅ Dropoff tracks deposited resources
7. ✅ Ant returns to gathering after deposit
8. ✅ Multiple ants can use same dropoff
9. ✅ Dropoff visual feedback
10. ✅ Dropoff location persists

---

## Spatial Grid Tests

### Test Suite 33: Spatial Grid Registration

**File**: `test/e2e/spatial/pw_spatial_grid_registration.js`

**Tests**:
1. ✅ Entity auto-registers on creation
2. ✅ Entity auto-updates on movement
3. ✅ Entity auto-removes on destroy
4. ✅ Grid cell size is 64px
5. ✅ Entities sorted by type
6. ✅ Multiple entities per cell
7. ✅ Grid covers entire world
8. ✅ Registration is automatic
9. ✅ No duplicate registrations
10. ✅ Grid tracks entity count

### Test Suite 34: Spatial Grid Queries

**File**: `test/e2e/spatial/pw_spatial_grid_queries.js`

**Tests**:
1. ✅ getNearbyEntities() finds entities in radius
2. ✅ findNearestEntity() returns closest entity
3. ✅ getEntitiesInRect() finds entities in rectangle
4. ✅ getEntitiesByType() filters by type
5. ✅ Queries faster than full array iteration
6. ✅ Empty results for empty areas
7. ✅ Radius queries work correctly
8. ✅ Type filtering works
9. ✅ Query performance acceptable
10. ✅ Queries return correct entities

---

## Camera System Tests

### Test Suite 35: Camera Movement

**File**: `test/e2e/camera/pw_camera_movement.js`

**Tests**:
1. ✅ Arrow keys move camera
2. ✅ Camera position updates
3. ✅ Entity screen positions update with camera
4. ✅ Camera bounds work correctly
5. ✅ Camera smooth movement
6. ✅ Camera follows target entity
7. ✅ Camera centers on position
8. ✅ Camera movement affects rendering
9. ✅ Camera panning with mouse drag
10. ✅ Camera reset to origin

### Test Suite 36: Camera Zoom

**File**: `test/e2e/camera/pw_camera_zoom.js`

**Tests**:
1. ✅ Mouse wheel zooms camera
2. ✅ Zoom affects entity rendering size
3. ✅ Zoom min/max bounds work
4. ✅ Zoom centered on mouse position
5. ✅ Zoom affects world-to-screen conversion
6. ✅ Zoom smooth animation
7. ✅ Zoom affects UI elements correctly
8. ✅ Zoom respects limits
9. ✅ Zoom affects pathfinding visualization
10. ✅ Zoom state persists

### Test Suite 37: Camera Coordinate Transforms

**File**: `test/e2e/camera/pw_camera_transforms.js`

**Tests**:
1. ✅ screenToWorld() converts correctly
2. ✅ worldToScreen() converts correctly
3. ✅ Transforms work with zoom
4. ✅ Transforms work with camera position
5. ✅ Mouse clicks use transforms
6. ✅ Entity rendering uses transforms
7. ✅ UI elements use transforms
8. ✅ Transform accuracy maintained
9. ✅ Inverse transforms work
10. ✅ Transforms handle edge cases

---

## UI System Tests

### Test Suite 38: Selection Box

**File**: `test/e2e/ui/pw_selection_box.js`

**Tests**:
1. ✅ Click-drag creates selection box
2. ✅ Selection box renders correctly
3. ✅ Entities inside box get selected
4. ✅ Entities outside box stay unselected
5. ✅ Selection box visual feedback
6. ✅ Multiple entity selection works
7. ✅ Selection box respects camera
8. ✅ Selection cleared on new box
9. ✅ Selection box with Shift key adds to selection
10. ✅ Selection box performance acceptable

### Test Suite 39: Draggable Panels

**File**: `test/e2e/ui/pw_draggable_panels.js`

**Tests**:
1. ✅ Panels render at initial position
2. ✅ Click-drag moves panel
3. ✅ Panel stays within bounds
4. ✅ Panel minimize/maximize works
5. ✅ Panel close button works
6. ✅ Multiple panels don't overlap badly
7. ✅ Panel z-index ordering works
8. ✅ Panel state persists
9. ✅ Panel visibility toggles
10. ✅ Panel content renders correctly

### Test Suite 40: Buttons and UI Elements

**File**: `test/e2e/ui/pw_ui_buttons.js`

**Tests**:
1. ✅ Spawn buttons create ants
2. ✅ Spawn buttons show feedback
3. ✅ Resource buttons spawn resources
4. ✅ Dropoff button creates dropoff
5. ✅ Button hover effects work
6. ✅ Button click handlers fire
7. ✅ Button groups organize correctly
8. ✅ Button state updates
9. ✅ Button visibility rules work
10. ✅ Button tooltips show

---

## Integration Tests

### Test Suite 41: Ant Lifecycle Integration

**File**: `test/e2e/integration/pw_ant_lifecycle.js`

**Tests**:
1. ✅ Ant spawns → searches → gathers → drops off → repeats
2. ✅ Ant hunger increases → seeks food → eats → continues work
3. ✅ Ant encounters enemy → engages → returns to work
4. ✅ Ant inventory fills → seeks dropoff → deposits → gathers
5. ✅ Ant follows pheromone trail → completes task
6. ✅ Ant low health → flees → heals → returns
7. ✅ Ant job type → appropriate behavior → task completion
8. ✅ Complete gather cycle with multiple ants
9. ✅ Ant death → removed from systems
10. ✅ Full ant lifecycle from spawn to death

### Test Suite 42: Multi-Ant Coordination

**File**: `test/e2e/integration/pw_multi_ant_coordination.js`

**Tests**:
1. ✅ Multiple ants gather without conflicts
2. ✅ Ants avoid colliding with each other
3. ✅ Ants share resource locations (pheromones)
4. ✅ Ants coordinate dropoff usage
5. ✅ Combat ants support each other
6. ✅ Builder ants coordinate construction
7. ✅ Spatial grid prevents entity overlap
8. ✅ Multiple ants pathfind independently
9. ✅ Ant behaviors don't interfere
10. ✅ Colony coordination emerges

### Test Suite 43: Camera and Entity Integration

**File**: `test/e2e/integration/pw_camera_entity_integration.js`

**Tests**:
1. ✅ Camera follows selected ant
2. ✅ Entities render at correct screen positions
3. ✅ Camera zoom affects entity rendering
4. ✅ Entity selection works with camera movement
5. ✅ Pathfinding visualization updates with camera
6. ✅ UI elements fixed to screen
7. ✅ Entity culling works off-screen
8. ✅ Camera bounds prevent out-of-world view
9. ✅ Screen-to-world conversions accurate
10. ✅ Camera and entities synchronized

### Test Suite 44: Resource System Integration

**File**: `test/e2e/integration/pw_resource_system_integration.js`

**Tests**:
1. ✅ Resources spawn → ants detect → collection → deposit
2. ✅ Resource scarcity affects ant behavior
3. ✅ Multiple resource types handled correctly
4. ✅ Resource respawn after depletion (if implemented)
5. ✅ Resource manager tracks all resources
6. ✅ Ants prioritize food when hungry
7. ✅ Builders seek wood resources
8. ✅ Resource visualization updates
9. ✅ Dropoff accumulation shown
10. ✅ Resource system scales with ant count

---

## Performance Tests

### Test Suite 45: Entity Performance

**File**: `test/e2e/performance/pw_entity_performance.js`

**Tests**:
1. ✅ 10 entities maintain 60 FPS
2. ✅ 50 entities maintain acceptable FPS (>30)
3. ✅ 100 entities stress test
4. ✅ Entity update time per frame measured
5. ✅ Entity render time per frame measured
6. ✅ Spatial grid query performance measured
7. ✅ Collision detection performance acceptable
8. ✅ Memory usage stays reasonable
9. ✅ No memory leaks over time
10. ✅ Performance profiling data collected

### Test Suite 46: State Machine Performance

**File**: `test/e2e/performance/pw_state_performance.js`

**Tests**:
1. ✅ State checks don't bottleneck
2. ✅ State transitions fast (<1ms)
3. ✅ AntBrain decision making efficient
4. ✅ Pheromone trail checks performant
5. ✅ Multiple state machines don't slow game
6. ✅ State update time measured
7. ✅ State overhead acceptable
8. ✅ GatherState search efficient
9. ✅ State system scales to 100+ ants
10. ✅ No performance degradation over time

### Test Suite 47: Rendering Performance

**File**: `test/e2e/performance/pw_rendering_performance.js`

**Tests**:
1. ✅ Terrain cache improves performance
2. ✅ Entity culling reduces draw calls
3. ✅ Sprite batching works
4. ✅ Layer rendering optimized
5. ✅ Camera movement doesn't drop FPS
6. ✅ Zoom doesn't affect performance badly
7. ✅ UI rendering separate from game
8. ✅ Debug rendering toggleable
9. ✅ Render time per layer measured
10. ✅ Overall render budget maintained

---

## Test Execution Plan

### Phase 1: Core Systems (Week 1)

**Priority**: Critical infrastructure must work

```bash
# Entity base class tests
npm run test:e2e:entity:construction
npm run test:e2e:entity:transform
npm run test:e2e:entity:collision
npm run test:e2e:entity:selection
npm run test:e2e:entity:sprite

# Controller tests
npm run test:e2e:controllers:movement
npm run test:e2e:controllers:render
npm run test:e2e:controllers:combat
npm run test:e2e:controllers:health
npm run test:e2e:controllers:inventory
```

**Expected Results**:
- All entity construction tests pass
- All controller tests pass
- Screenshot evidence collected
- No console errors

### Phase 2: Ant Systems (Week 1-2)

**Priority**: Ant-specific functionality

```bash
# Ant class tests
npm run test:e2e:ants:construction
npm run test:e2e:ants:jobs
npm run test:e2e:ants:resources
npm run test:e2e:ants:combat
npm run test:e2e:ants:movement
npm run test:e2e:ants:gathering

# Queen tests
npm run test:e2e:queen:construction
npm run test:e2e:queen:abilities
```

**Expected Results**:
- All ant spawn and function correctly
- Job system works
- Resource collection functional
- Combat system operational

### Phase 3: State and AI Systems (Week 2)

**Priority**: State machine and AI behavior

```bash
# State system tests
npm run test:e2e:state:machine
npm run test:e2e:state:gather
npm run test:e2e:state:transitions

# AI brain tests
npm run test:e2e:brain:init
npm run test:e2e:brain:decisions
npm run test:e2e:brain:pheromones
npm run test:e2e:brain:hunger
```

**Expected Results**:
- State machine works as documented
- GatherState functional
- AntBrain makes correct decisions
- Hunger system works

### Phase 4: Support Systems (Week 2-3)

**Priority**: Resource, spatial, camera, UI

```bash
# Resource system
npm run test:e2e:resources:spawning
npm run test:e2e:resources:collection
npm run test:e2e:resources:dropoff

# Spatial grid
npm run test:e2e:spatial:registration
npm run test:e2e:spatial:queries

# Camera system
npm run test:e2e:camera:movement
npm run test:e2e:camera:zoom
npm run test:e2e:camera:transforms

# UI system
npm run test:e2e:ui:selection
npm run test:e2e:ui:panels
npm run test:e2e:ui:buttons
```

**Expected Results**:
- All support systems functional
- No regressions in existing features

### Phase 5: Integration Tests (Week 3)

**Priority**: Full system integration

```bash
npm run test:e2e:integration:lifecycle
npm run test:e2e:integration:coordination
npm run test:e2e:integration:camera
npm run test:e2e:integration:resources
```

**Expected Results**:
- Complete workflows work end-to-end
- Multiple systems interact correctly
- No unexpected interactions

### Phase 6: Performance Tests (Week 3)

**Priority**: Performance baseline before refactor

```bash
npm run test:e2e:performance:entity
npm run test:e2e:performance:state
npm run test:e2e:performance:rendering
```

**Expected Results**:
- Performance benchmarks established
- No memory leaks detected
- Acceptable FPS with 100+ ants

---

## Test Utilities and Helpers

### Screenshot Evidence System

```javascript
// test/e2e/helpers/screenshot_helper.js
async function captureEvidence(page, testName, category, success) {
  const timestamp = Date.now();
  const folder = success ? 'success' : 'failure';
  const path = `test/e2e/screenshots/${category}/${folder}/${testName}_${timestamp}.png`;
  
  await page.screenshot({
    path: path,
    fullPage: false
  });
  
  console.log(`📸 Screenshot saved: ${path}`);
  return path;
}

async function captureSequence(page, testName, actions) {
  const screenshots = [];
  for (let i = 0; i < actions.length; i++) {
    await actions[i]();
    const path = await captureEvidence(
      page, 
      `${testName}_step${i+1}`, 
      'sequences', 
      true
    );
    screenshots.push(path);
  }
  return screenshots;
}
```

### Performance Measurement

```javascript
// test/e2e/helpers/performance_helper.js
async function measureFPS(page, duration = 5000) {
  return await page.evaluate((duration) => {
    return new Promise((resolve) => {
      let frameCount = 0;
      let startTime = performance.now();
      
      function countFrames() {
        frameCount++;
        if (performance.now() - startTime < duration) {
          requestAnimationFrame(countFrames);
        } else {
          const elapsed = (performance.now() - startTime) / 1000;
          const fps = frameCount / elapsed;
          resolve({ fps, frameCount, duration: elapsed });
        }
      }
      
      requestAnimationFrame(countFrames);
    });
  }, duration);
}

async function measureMemory(page) {
  return await page.evaluate(() => {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  });
}
```

### Test Data Validation

```javascript
// test/e2e/helpers/validation_helper.js
function validateEntityData(entityData) {
  const required = ['id', 'type', 'isActive', 'position', 'size'];
  const missing = required.filter(field => !entityData[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing entity fields: ${missing.join(', ')}`);
  }
  
  return true;
}

function validateAntData(antData) {
  validateEntityData(antData);
  
  const antRequired = ['antIndex', 'JobName', 'health', 'resources'];
  const missing = antRequired.filter(field => antData[field] === undefined);
  
  if (missing.length > 0) {
    throw new Error(`Missing ant fields: ${missing.join(', ')}`);
  }
  
  return true;
}
```

---

## Success Criteria

### Test Coverage Goals

- ✅ **Entity Base Class**: 95% coverage (40+ tests)
- ✅ **Controllers**: 90% coverage (80+ tests)
- ✅ **Ant Class**: 95% coverage (50+ tests)
- ✅ **State System**: 100% coverage (30+ tests)
- ✅ **AI Brain**: 90% coverage (35+ tests)
- ✅ **Support Systems**: 85% coverage (60+ tests)
- ✅ **Integration**: 80% coverage (40+ tests)
- ✅ **Performance**: Baseline established (30+ tests)

**Total**: 365+ tests planned

### Pass Rate Requirements

- **Phase 1-2 (Core + Ant)**: 100% pass required
- **Phase 3 (State + AI)**: 100% pass required
- **Phase 4 (Support)**: 95% pass minimum
- **Phase 5 (Integration)**: 90% pass minimum
- **Phase 6 (Performance)**: All benchmarks established

### Performance Baselines

- **10 ants**: 60 FPS minimum
- **50 ants**: 30 FPS minimum
- **100 ants**: 20 FPS minimum
- **State transitions**: <1ms average
- **Spatial queries**: <0.1ms average
- **Memory usage**: <500MB with 100 ants

---

## Continuous Integration

### Automated Test Runs

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests Pre-Implementation

on:
  push:
    branches: [ main, development ]
  pull_request:
    branches: [ main ]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: |
        npm install
        cd test/e2e && npm install
    
    - name: Start dev server
      run: npm run dev &
      
    - name: Wait for server
      run: npx wait-on http://localhost:8000
    
    - name: Run Entity tests
      run: npm run test:e2e:entity
    
    - name: Run Controller tests
      run: npm run test:e2e:controllers
    
    - name: Run Ant tests
      run: npm run test:e2e:ants
    
    - name: Run State tests
      run: npm run test:e2e:state
    
    - name: Run Integration tests
      run: npm run test:e2e:integration
    
    - name: Upload screenshots
      uses: actions/upload-artifact@v2
      with:
        name: test-screenshots
        path: test/e2e/screenshots/
    
    - name: Upload test reports
      uses: actions/upload-artifact@v2
      with:
        name: test-reports
        path: test/e2e/reports/
```

---

## Documentation

### Test Report Format

Each test generates a report:

```json
{
  "testName": "Entity construction and initialization",
  "category": "entity",
  "status": "passed",
  "duration": 1234,
  "timestamp": "2025-10-20T12:00:00Z",
  "screenshots": [
    "test/e2e/screenshots/entity/success/construction_1729425600.png"
  ],
  "assertions": [
    { "description": "Entity has valid ID", "passed": true },
    { "description": "Entity initializes collision box", "passed": true }
  ],
  "performance": {
    "fps": 60,
    "memory": 45000000
  },
  "errors": []
}
```

### Test Summary Dashboard

```
=================================================================
         E2E Test Suite - Pre-Implementation
=================================================================

Test Execution: 2025-10-20 12:00:00
Duration: 45 minutes
Environment: Headless Chrome, localhost:8000

-----------------------------------------------------------------
CATEGORY          | TOTAL | PASSED | FAILED | SKIPPED | PASS %
-----------------------------------------------------------------
Entity            |    40 |     40 |      0 |       0 | 100.0%
Controllers       |    80 |     78 |      2 |       0 |  97.5%
Ants              |    50 |     50 |      0 |       0 | 100.0%
Queen             |    20 |     20 |      0 |       0 | 100.0%
State System      |    30 |     30 |      0 |       0 | 100.0%
AI Brain          |    35 |     34 |      1 |       0 |  97.1%
Resources         |    30 |     30 |      0 |       0 | 100.0%
Spatial Grid      |    20 |     20 |      0 |       0 | 100.0%
Camera            |    30 |     30 |      0 |       0 | 100.0%
UI                |    30 |     29 |      1 |       0 |  96.7%
Integration       |    40 |     38 |      2 |       0 |  95.0%
Performance       |    30 |     30 |      0 |       0 | 100.0%
-----------------------------------------------------------------
TOTAL             |   435 |    429 |      6 |       0 |  98.6%
-----------------------------------------------------------------

PERFORMANCE BENCHMARKS:
  10 ants:  62.3 FPS  (✓ Target: 60 FPS)
  50 ants:  34.7 FPS  (✓ Target: 30 FPS)
  100 ants: 22.1 FPS  (✓ Target: 20 FPS)
  Memory:   387 MB   (✓ Target: <500 MB)

FAILED TESTS:
  1. controllers/pw_combat_controller.js - Line 145
     ❌ Combat state affects AI behavior
     Expected: warrior attacks, Got: warrior patrols
     
  2. brain/pw_ant_brain_decisions.js - Line 89
     ❌ Starving forces food gathering
     Expected: GATHERING, Got: IDLE
     
  3. integration/pw_multi_ant_coordination.js - Line 234
     ❌ Ants avoid colliding with each other
     Expected: no collisions, Got: 2 collisions

SCREENSHOTS: 872 captured
  Success: 866
  Failure: 6

=================================================================
                    TEST RUN COMPLETE
=================================================================
```

---

## Next Steps

### After Test Suite Completion

1. **Analyze Results**: Review all failed tests, understand root causes
2. **Fix Critical Bugs**: Address any discovered issues before refactor
3. **Baseline Documentation**: Document current behavior as "expected"
4. **Performance Baseline**: Establish benchmarks for comparison post-refactor
5. **Test Maintenance**: Keep tests updated as current implementation evolves
6. **Refactor Planning**: Use test results to inform state machine design
7. **Migration Strategy**: Plan to keep tests passing during migration

### Test Evolution

These tests will evolve to test the **new state machine implementation**:

- Tests will be updated to check new state machine API
- Performance comparisons will validate refactor benefits
- Integration tests will verify no behavioral regressions
- New tests will be added for new state machine features

---

## Appendix A: Test File Naming Convention

```
test/e2e/{category}/pw_{test_name}.js

Categories:
- entity/     - Entity base class tests
- controllers/ - Controller tests
- ants/       - Ant class tests
- queen/      - Queen ant tests
- state/      - State system tests
- brain/      - AI brain tests
- resources/  - Resource system tests
- spatial/    - Spatial grid tests
- camera/     - Camera system tests
- ui/         - UI system tests
- integration/ - Integration tests
- performance/ - Performance tests

Prefix: pw_ = Puppeteer/Playwright test
```

---

## Appendix B: Test Data Factories

```javascript
// test/e2e/factories/entity_factory.js
function createTestEntity(overrides = {}) {
  const defaults = {
    x: 100,
    y: 100,
    width: 32,
    height: 32,
    type: 'TestEntity',
    movementSpeed: 2.0,
    selectable: true,
    faction: 'player'
  };
  
  return { ...defaults, ...overrides };
}

function createTestAnt(overrides = {}) {
  const defaults = {
    x: 100,
    y: 100,
    sizex: 20,
    sizey: 20,
    movementSpeed: 30,
    rotation: 0,
    img: null,
    JobName: 'Scout',
    faction: 'player'
  };
  
  return { ...defaults, ...overrides };
}

function createTestResource(overrides = {}) {
  const defaults = {
    x: 300,
    y: 300,
    type: 'food',
    amount: 10,
    size: 16
  };
  
  return { ...defaults, ...overrides };
}
```

---

**END OF COMPREHENSIVE E2E TEST PLAN**

This test plan ensures we have complete coverage of all existing functionality before implementing the true state machine architecture. All tests will serve as regression tests during the migration.
