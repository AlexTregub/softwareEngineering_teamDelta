# BuildingFactory

**File:** `Classes/factories/BuildingFactory.js`

Static factory class for creating building instances using MVC pattern. Provides preconfigured building types with specific stats, dimensions, and spawn rates.

## Description

BuildingFactory centralizes building creation logic and provides consistent configurations for each building type. Each factory method returns a fully configured [BuildingController](BuildingController_API_Reference.md) instance ready for use in the game.

**Available Building Types:**
- **AntCone**: Small spawn building (64x64, 80 HP, 8s spawn interval, 1 unit/spawn)
- **AntHill**: Medium spawn building (96x96, 150 HP, 12s spawn interval, 2 units/spawn)
- **HiveSource**: Large spawn building (128x128, 250 HP, 15s spawn interval, 3 units/spawn)

**Typical Usage:**
```javascript
// Create buildings with factory methods
const playerCone = BuildingFactory.createAntCone(100, 100, 'player');
const enemyHill = BuildingFactory.createAntHill(500, 500, 'enemy');
const neutralHive = BuildingFactory.createHiveSource(300, 300, 'neutral');

// All buildings are ready to use immediately
Buildings.push(playerCone, enemyHill, neutralHive);
```

## Tutorials

- [MVC Refactoring Example](../guides/MVC_REFACTORING_EXAMPLE.md)
- [Buildings MVC Roadmap](../roadmaps/MVC_REFACTORING_ROADMAP.md)

## Methods

| Returns               | Method                                                                      |
|-----------------------|-----------------------------------------------------------------------------|
| `BuildingController`  | createAntCone ( x: `int`, y: `int`, faction: `String` = 'neutral' ) static |
| `BuildingController`  | createAntHill ( x: `int`, y: `int`, faction: `String` = 'neutral' ) static |
| `BuildingController`  | createHiveSource ( x: `int`, y: `int`, faction: `String` = 'neutral' ) static |
| `Object`              | getConfig ( type: `String` ) static                                         |

## Building Configurations

### AntCone

Small, fast-spawning building. Ideal for early game or rapid unit production.

| Property          | Value                                      |
|-------------------|--------------------------------------------|
| Size              | 64x64 pixels                               |
| Health            | 80 HP                                      |
| Spawn Interval    | 8 seconds                                  |
| Spawn Count       | 1 unit per spawn                           |
| Image             | `Images/Buildings/Cone/Cone1.png`          |
| Upgrade Levels    | 3 levels (Cone1.png → Cone2.png → Cone3.png) |
| Upgrade Costs     | Level 2: 50 resources, Level 3: 100 resources |

### AntHill

Medium-sized building with balanced stats. Good all-around choice.

| Property          | Value                                      |
|-------------------|--------------------------------------------|
| Size              | 96x96 pixels                               |
| Health            | 150 HP                                     |
| Spawn Interval    | 12 seconds                                 |
| Spawn Count       | 2 units per spawn                          |
| Image             | `Images/Buildings/AntHill/Hill1.png`       |
| Upgrade Levels    | 3 levels (Hill1.png → Hill2.png → Hill3.png) |
| Upgrade Costs     | Level 2: 100 resources, Level 3: 200 resources |

### HiveSource

Large, heavily-fortified building. Slow spawn but high output.

| Property          | Value                                      |
|-------------------|--------------------------------------------|
| Size              | 128x128 pixels                             |
| Health            | 250 HP                                     |
| Spawn Interval    | 15 seconds                                 |
| Spawn Count       | 3 units per spawn                          |
| Image             | `Images/Buildings/HiveSource/Hive1.png`    |
| Upgrade Levels    | 3 levels (Hive1.png → Hive2.png → Hive3.png) |
| Upgrade Costs     | Level 2: 150 resources, Level 3: 300 resources |

## Method Descriptions

### <span id="createantcone"></span>BuildingController **createAntCone** ( x: `int`, y: `int`, faction: `String` = 'neutral' ) static

Creates an AntCone building at specified position.

```javascript
// Player-owned AntCone at (100, 100)
const playerCone = BuildingFactory.createAntCone(100, 100, 'player');
Buildings.push(playerCone);

// Neutral AntCone (uses default faction)
const neutralCone = BuildingFactory.createAntCone(200, 200);
```

**Parameters:**
- `x` (int, **required**): X position in world coordinates
- `y` (int, **required**): Y position in world coordinates
- `faction` (String, optional): Building faction (default: 'neutral')

Returns [BuildingController](BuildingController_API_Reference.md) instance configured as AntCone.

**Configuration:**
- Size: 64x64 pixels
- Health: 80 HP
- Spawn: 1 unit every 8 seconds
- 3 upgrade levels

---

### <span id="createanthill"></span>BuildingController **createAntHill** ( x: `int`, y: `int`, faction: `String` = 'neutral' ) static

Creates an AntHill building at specified position.

```javascript
// Enemy AntHill at (500, 500)
const enemyHill = BuildingFactory.createAntHill(500, 500, 'enemy');
Buildings.push(enemyHill);
```

**Parameters:**
- `x` (int, **required**): X position in world coordinates
- `y` (int, **required**): Y position in world coordinates
- `faction` (String, optional): Building faction (default: 'neutral')

Returns [BuildingController](BuildingController_API_Reference.md) instance configured as AntHill.

**Configuration:**
- Size: 96x96 pixels
- Health: 150 HP
- Spawn: 2 units every 12 seconds
- 3 upgrade levels

---

### <span id="createhivesource"></span>BuildingController **createHiveSource** ( x: `int`, y: `int`, faction: `String` = 'neutral' ) static

Creates a HiveSource building at specified position.

```javascript
// Neutral HiveSource at (300, 300)
const neutralHive = BuildingFactory.createHiveSource(300, 300, 'neutral');
Buildings.push(neutralHive);

// Player HiveSource
const playerHive = BuildingFactory.createHiveSource(100, 500, 'player');
```

**Parameters:**
- `x` (int, **required**): X position in world coordinates
- `y` (int, **required**): Y position in world coordinates
- `faction` (String, optional): Building faction (default: 'neutral')

Returns [BuildingController](BuildingController_API_Reference.md) instance configured as HiveSource.

**Configuration:**
- Size: 128x128 pixels
- Health: 250 HP
- Spawn: 3 units every 15 seconds
- 3 upgrade levels

---

### <span id="getconfig"></span>Object **getConfig** ( type: `String` ) static

Returns the configuration object for a building type.

```javascript
const coneConfig = BuildingFactory.getConfig('AntCone');
console.log(`AntCone health: ${coneConfig.health}`);
console.log(`Spawn interval: ${coneConfig.spawnInterval}s`);
```

**Parameters:**
- `type` (String, **required**): Building type ('AntCone', 'AntHill', 'HiveSource')

Returns Object containing building configuration (type, width, height, health, spawnInterval, spawnCount, imagePath, upgradeTree).

**Note:** Useful for inspecting building stats without creating an instance.

---

## Best Practices

**DO:**
- ✅ Use factory methods instead of `new BuildingController()` directly
- ✅ Choose building type based on game strategy (fast vs. strong)
- ✅ Specify faction for player/enemy buildings
- ✅ Use `getConfig()` to inspect stats before creating

**DON'T:**
- ❌ Manually construct BuildingController with hardcoded configs
- ❌ Modify BUILDING_CONFIGS directly (use factory methods)
- ❌ Create buildings without specifying faction (defaults to 'neutral')

## Common Workflows

### Creating Buildings Based on Player Choice

```javascript
function placeBuildingFromUI(buildingType, x, y) {
  let building;
  
  switch(buildingType.toLowerCase()) {
    case 'antcone':
      building = BuildingFactory.createAntCone(x, y, 'player');
      break;
    case 'anthill':
      building = BuildingFactory.createAntHill(x, y, 'player');
      break;
    case 'hivesource':
      building = BuildingFactory.createHiveSource(x, y, 'player');
      break;
    default:
      console.error(`Unknown building type: ${buildingType}`);
      return null;
  }
  
  Buildings.push(building);
  return building;
}
```

### Building Selection Based on Strategy

```javascript
// Early game: Fast spawn
const earlyCone = BuildingFactory.createAntCone(100, 100, 'player');

// Mid game: Balanced
const midHill = BuildingFactory.createAntHill(300, 300, 'player');

// Late game: Maximum output
const lateHive = BuildingFactory.createHiveSource(500, 500, 'player');
```

### Displaying Building Stats in UI

```javascript
function showBuildingInfo(buildingType) {
  const config = BuildingFactory.getConfig(buildingType);
  
  console.log(`${config.type} Stats:`);
  console.log(`- Size: ${config.width}x${config.height}`);
  console.log(`- Health: ${config.health} HP`);
  console.log(`- Spawn: ${config.spawnCount} units every ${config.spawnInterval}s`);
  console.log(`- Upgrades: ${Object.keys(config.upgradeTree.progressions).length} levels`);
}
```

### Enemy Building Spawner

```javascript
function spawnEnemyBuildings(count) {
  for (let i = 0; i < count; i++) {
    const x = random(100, 700);
    const y = random(100, 700);
    
    // Mix of building types for enemy
    const buildingType = random(['AntCone', 'AntHill', 'HiveSource']);
    
    let building;
    switch(buildingType) {
      case 'AntCone':
        building = BuildingFactory.createAntCone(x, y, 'enemy');
        break;
      case 'AntHill':
        building = BuildingFactory.createAntHill(x, y, 'enemy');
        break;
      case 'HiveSource':
        building = BuildingFactory.createHiveSource(x, y, 'enemy');
        break;
    }
    
    Buildings.push(building);
  }
}
```

## Notes

- BuildingFactory is part of the MVC refactoring effort
- All factory methods return BuildingController instances
- Configurations include upgrade trees with 3 levels
- Images must exist at specified paths for rendering to work
- Use BuildingManager for global building coordination

## Related Docs

- [BuildingController](BuildingController_API_Reference.md) - Main building API
- [BuildingManager](BuildingManager_API_Reference.md) - Global building coordination
- [BuildingModel](BuildingModel_API_Reference.md) - Internal data and logic
- [BuildingView](BuildingView_API_Reference.md) - Rendering implementation
- [MVC Refactoring Roadmap](../roadmaps/MVC_REFACTORING_ROADMAP.md)
