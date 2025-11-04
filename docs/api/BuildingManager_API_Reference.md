# BuildingManager

**File:** `Classes/managers/BuildingManager.js`

Simplified manager for building lifecycle coordination. Provides central tracking of all buildings and delegates creation to BuildingFactory.

## Description

BuildingManager acts as a central coordinator for all buildings in the game. It maintains a buildings array, handles creation/removal, and coordinates updates. This manager follows the MVC pattern by delegating actual building creation to BuildingFactory.

**Key Responsibilities:**
- Central tracking of all buildings
- Building creation (delegates to BuildingFactory)
- Update coordination (calls update() on all buildings)
- Lifecycle management (add/remove buildings)

**Typical Usage:**
```javascript
// Initialize manager (usually in setup())
const buildingManager = new BuildingManager();

// Create buildings
const cone = buildingManager.createBuilding('antcone', 100, 100, 'player');
const hill = buildingManager.createBuilding('anthill', 300, 300, 'enemy');

// In game loop
buildingManager.update(deltaTime);

// Get all buildings for rendering
buildingManager.getAllBuildings().forEach(building => {
  building.render();
});
```

## Tutorials

- [MVC Refactoring Example](../guides/MVC_REFACTORING_EXAMPLE.md)
- [Buildings MVC Roadmap](../roadmaps/MVC_REFACTORING_ROADMAP.md)

## Properties

| Type     | Property    | Default | Description                          |
|----------|-------------|---------|--------------------------------------|
| `Array`  | `buildings` | `[]`    | Central tracking array for all buildings |

## Methods

| Returns               | Method                                                                                    |
|-----------------------|-------------------------------------------------------------------------------------------|
| `BuildingController`  | createBuilding ( type: `String`, x: `int`, y: `int`, faction: `String` = 'neutral' )    |
| `void`                | update ( deltaTime: `float` )                                                             |
| `Array`               | getAllBuildings ( ) const                                                                 |
| `int`                 | getBuildingCount ( ) const                                                                |
| `void`                | removeBuilding ( building: `BuildingController` )                                         |
| `void`                | clear ( )                                                                                 |

## Method Descriptions

### <span id="constructor"></span>BuildingManager **BuildingManager** ( )

Creates a new BuildingManager instance. Initializes empty buildings array.

```javascript
// Usually created once in setup()
const buildingManager = new BuildingManager();
window.g_buildingManager = buildingManager;
```

**Note:** Typically you want a singleton manager for the entire game.

---

### <span id="createbuilding"></span>BuildingController **createBuilding** ( type: `String`, x: `int`, y: `int`, faction: `String` = 'neutral' )

Creates a building and adds it to tracking. Delegates to BuildingFactory for actual creation.

```javascript
// Create different building types
const cone = manager.createBuilding('antcone', 100, 100, 'player');
const hill = manager.createBuilding('anthill', 300, 300, 'enemy');
const hive = manager.createBuilding('hivesource', 500, 500, 'neutral');

// Case-insensitive type matching
const cone2 = manager.createBuilding('AntCone', 200, 200, 'player'); // Works
const hill2 = manager.createBuilding('ANTHILL', 400, 400, 'enemy'); // Works
```

**Parameters:**
- `type` (String, **required**): Building type ('antcone', 'anthill', 'hivesource')
  - Case-insensitive ('AntCone', 'ANTCONE', 'antcone' all work)
- `x` (int, **required**): X position in world coordinates
- `y` (int, **required**): Y position in world coordinates
- `faction` (String, optional): Building faction ('player', 'enemy', 'neutral') (default: 'neutral')

Returns [BuildingController](BuildingController_API_Reference.md) instance if successful, `null` if type invalid.

**Note:** Automatically adds building to `buildings` array for tracking.

---

### <span id="update"></span>void **update** ( deltaTime: `float` )

Updates all tracked buildings. Calls `update(deltaTime)` on each building.

```javascript
// In game loop (typically in draw() function)
function draw() {
  const deltaTime = 1/60; // 60 FPS
  buildingManager.update(deltaTime);
  
  // Render after update
  buildingManager.getAllBuildings().forEach(building => {
    building.render();
  });
}
```

**Parameters:**
- `deltaTime` (float, **required**): Time elapsed in seconds since last frame

**Note:** Call this every frame to ensure spawn timers work correctly.

---

### <span id="getallbuildings"></span>Array **getAllBuildings** ( ) const

Returns array of all tracked buildings.

```javascript
// Render all buildings
buildingManager.getAllBuildings().forEach(building => {
  building.render();
});

// Count player buildings
const playerBuildings = buildingManager.getAllBuildings()
  .filter(b => b.getFaction() === 'player');
console.log(`Player has ${playerBuildings.length} buildings`);
```

Returns Array of [BuildingController](BuildingController_API_Reference.md) instances.

**Note:** Returns direct reference to internal array (not a copy).

---

### <span id="getbuildingcount"></span>int **getBuildingCount** ( ) const

Returns the number of tracked buildings.

```javascript
const count = buildingManager.getBuildingCount();
console.log(`Total buildings: ${count}`);

if (count === 0) {
  console.log('No buildings left!');
}
```

Returns int representing number of buildings.

---

### <span id="removebuilding"></span>void **removeBuilding** ( building: `BuildingController` )

Removes a building from tracking. Does NOT destroy the building object.

```javascript
// Remove destroyed buildings
buildingManager.getAllBuildings().forEach(building => {
  if (building.isDead()) {
    buildingManager.removeBuilding(building);
  }
});

// Remove specific building
const cone = buildingManager.createBuilding('antcone', 100, 100, 'player');
buildingManager.removeBuilding(cone);
```

**Parameters:**
- `building` (BuildingController, **required**): Building to remove

**Note:** Safe to call with non-existent building (no error thrown).

---

### <span id="clear"></span>void **clear** ( )

Removes all buildings from tracking. Resets buildings array to empty.

```javascript
// Clear all buildings (e.g., when loading new level)
buildingManager.clear();

// Verify cleared
console.log(`Buildings remaining: ${buildingManager.getBuildingCount()}`); // 0
```

**Note:** Does NOT destroy building objects, only clears tracking.

---

## Best Practices

**DO:**
- ✅ Use manager for all building creation (not direct factory calls)
- ✅ Call `update(deltaTime)` every frame
- ✅ Remove dead buildings to avoid memory leaks
- ✅ Use case-insensitive type names for convenience

**DON'T:**
- ❌ Modify `buildings` array directly (use manager methods)
- ❌ Skip `update()` calls (spawn system won't work)
- ❌ Forget to remove destroyed buildings

## Common Workflows

### Initializing Building System

```javascript
// In sketch.js setup()
let g_buildingManager;

function setup() {
    g_buildingManager = new BuildingManager();
}
```

### Creating Buildings from UI

```javascript
// Building placement tool
function placeBuilding(buildingType, x, y) {
  if (!g_buildingManager) {
    console.error('BuildingManager not initialized');
    return null;
  }
  
  const building = g_buildingManager.createBuilding(buildingType, x, y, 'player');
  
  if (building) {
    // Add to legacy Buildings[] array for compatibility
    if (typeof Buildings !== 'undefined') {
      Buildings.push(building);
    }
    
    // Register with other systems
    if (typeof g_tileInteractionManager !== 'undefined') {
      g_tileInteractionManager.addObject(building, 'building');
    }
    
    logNormal(`🏗️ Building placed: ${buildingType} at (${x}, ${y})`);
  }
  
  return building;
}
```

### Game Loop Integration

```javascript
function draw() {
  background(220);
  
  // Calculate delta time
  const currentTime = millis() / 1000;
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  // Update all buildings
  if (g_buildingManager) {
    g_buildingManager.update(deltaTime);
  }
  
  // Render all buildings
  if (g_buildingManager) {
    g_buildingManager.getAllBuildings().forEach(building => {
      building.render();
    });
  }
}
```

### Cleaning Up Destroyed Buildings

```javascript
function removeDestroyedBuildings() {
  if (!g_buildingManager) return;
  
  const deadBuildings = g_buildingManager.getAllBuildings()
    .filter(building => building.isDead());
  
  deadBuildings.forEach(building => {
    // Remove from manager
    g_buildingManager.removeBuilding(building);
    
    // Remove from legacy Buildings[] array
    if (typeof Buildings !== 'undefined') {
      Buildings = Buildings.filter(b => b !== building);
    }
    
    // Play destruction animation/sound
    playDestructionEffect(building.getPosition());
    
    logNormal(`💥 Building destroyed at ${building.getPosition()}`);
  });
}
```

### Level Loading/Saving

```javascript
// Save level
function saveLevelBuildings() {
  const buildingsData = g_buildingManager.getAllBuildings().map(building => {
    return building.toJSON();
  });
  
  localStorage.setItem('level_buildings', JSON.stringify(buildingsData));
}

// Load level
function loadLevelBuildings() {
  const buildingsData = JSON.parse(localStorage.getItem('level_buildings'));
  
  // Clear existing buildings
  g_buildingManager.clear();
  
  // Recreate buildings
  buildingsData.forEach(data => {
    const building = g_buildingManager.createBuilding(
      data.type.toLowerCase(),
      data.position.x,
      data.position.y,
      data.faction
    );
    
    // Restore health
    const healthLost = data.maxHealth - data.health;
    if (healthLost > 0) {
      building.takeDamage(healthLost);
    }
  });
}
```

### Building Statistics

```javascript
function getBuildingStats() {
  const buildings = g_buildingManager.getAllBuildings();
  
  const stats = {
    total: buildings.length,
    byType: {},
    byFaction: {},
    totalHealth: 0,
    averageHealth: 0
  };
  
  buildings.forEach(building => {
    const type = building.getType();
    const faction = building.getFaction();
    
    stats.byType[type] = (stats.byType[type] || 0) + 1;
    stats.byFaction[faction] = (stats.byFaction[faction] || 0) + 1;
    stats.totalHealth += building.getHealth();
  });
  
  stats.averageHealth = stats.totalHealth / stats.total || 0;
  
  return stats;
}
```

## Notes

- BuildingManager is part of the MVC refactoring effort
- Replaces old 347-line BuildingManager with tight Entity coupling
- Old global `createBuilding()` function removed (use manager method)
- Old `BuildingPreloader()` function removed (images handled by factory)
- Case-insensitive building type matching for convenience
- Manager automatically tracks buildings for easy access

## Migration from Old System

**OLD (Deprecated):**
```javascript
// Global function (removed)
const building = createBuilding('antcone', x, y, 'player');
Buildings.push(building);
```

**NEW (Current):**
```javascript
// Use manager method
const building = g_buildingManager.createBuilding('antcone', x, y, 'player');
// Manager automatically tracks building
```

## Related Docs

- [BuildingController](BuildingController_API_Reference.md) - Main building API
- [BuildingFactory](BuildingFactory_API_Reference.md) - Factory methods for building types
- [BuildingModel](BuildingModel_API_Reference.md) - Internal data and logic
- [BuildingView](BuildingView_API_Reference.md) - Rendering implementation
- [MVC Refactoring Roadmap](../roadmaps/MVC_REFACTORING_ROADMAP.md)
