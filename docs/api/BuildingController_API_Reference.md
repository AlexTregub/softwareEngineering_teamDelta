# BuildingController

**Inherits:** [BaseController](BaseController_API_Reference.md)

**File:** `Classes/controllers/mvc/BuildingController.js`

Controller class for building entities using MVC pattern. Provides public API for building operations, coordinates BuildingModel and BuildingView, and handles input events.

## Description

BuildingController is the main interface for interacting with buildings in the game. It follows the MVC pattern by delegating data/logic to BuildingModel and rendering to BuildingView, while providing a clean public API.

**Key Features:**
- Health management (damage, healing, death)
- Spawn system coordination (timers, intervals)
- Upgrade system (level progression, stat increases)
- Input handling (click detection)
- Serialization/deserialization

**Typical Usage:**
```javascript
const building = new BuildingController(x, y, 64, 64, {
  type: 'AntCone',
  faction: 'player',
  imagePath: 'Images/Buildings/Cone/Cone1.png',
  health: 80,
  spawnInterval: 8,
  spawnCount: 1
});

// In game loop
building.update(deltaTime);
building.render();

// Handle damage
building.takeDamage(25);
if (building.isDead()) {
  // Remove from game
}
```

## Tutorials

- [MVC Refactoring Example](../guides/MVC_REFACTORING_EXAMPLE.md)
- [Buildings MVC Roadmap](../roadmaps/MVC_REFACTORING_ROADMAP.md)

## Properties

| Type       | Property    | Default | Description                          |
|------------|-------------|---------|--------------------------------------|
| `Object`   | `_model`    | -       | Internal BuildingModel instance      |
| `Object`   | `_view`     | -       | Internal BuildingView instance       |
| `Object`   | `_options`  | `{}`    | Configuration options                |

## Methods

| Returns      | Method                                                                                    |
|--------------|-------------------------------------------------------------------------------------------|
| `Object`     | getPosition ( ) const                                                                     |
| `Object`     | getSize ( ) const                                                                         |
| `int`        | getHealth ( ) const                                                                       |
| `int`        | getMaxHealth ( ) const                                                                    |
| `void`       | takeDamage ( amount: `int` )                                                              |
| `void`       | heal ( amount: `int` )                                                                    |
| `bool`       | isDead ( ) const                                                                          |
| `Object`     | getSpawnConfig ( ) const                                                                  |
| `void`       | updateSpawnTimer ( deltaTime: `float` )                                                   |
| `bool`       | canUpgrade ( availableResources: `int` ) const                                            |
| `bool`       | upgrade ( imageCallback: `Function` = null )                                              |
| `String`     | getType ( ) const                                                                         |
| `String`     | getFaction ( ) const                                                                      |
| `void`       | update ( deltaTime: `float` )                                                             |
| `void`       | handleInput ( type: `String`, data: `Object` )                                            |
| `Object`     | toJSON ( ) const                                                                          |

## Method Descriptions

### <span id="constructor"></span>BuildingController **BuildingController** ( x: `int`, y: `int`, width: `int`, height: `int`, options: `Object` = {} )

Creates a new building controller with specified position, size, and configuration.

```javascript
const building = new BuildingController(100, 100, 64, 64, {
  type: 'AntCone',
  faction: 'player',
  imagePath: 'Images/Buildings/Cone/Cone1.png',
  health: 80,
  maxHealth: 80,
  spawnInterval: 8,
  spawnCount: 1,
  upgradeTree: [
    { level: 2, cost: 100, spawnInterval: 6, spawnCount: 1 },
    { level: 3, cost: 250, spawnInterval: 4, spawnCount: 2 }
  ],
  showHealthBar: true
});
```

**Parameters:**
- `x` (int, **required**): X position in world coordinates
- `y` (int, **required**): Y position in world coordinates
- `width` (int, **required**): Building width in pixels
- `height` (int, **required**): Building height in pixels
- `options` (Object, optional): Configuration options (default: {})
  - `type` (String): Building type ('AntCone', 'AntHill', 'HiveSource') (default: 'Building')
  - `faction` (String): Building faction ('player', 'enemy', 'neutral') (default: 'neutral')
  - `imagePath` (String): Path to building sprite image
  - `health` (int): Initial health (default: 100)
  - `maxHealth` (int): Maximum health (default: 100)
  - `spawnInterval` (float): Spawn interval in seconds (default: 10)
  - `spawnCount` (int): Units to spawn per interval (default: 1)
  - `upgradeTree` (Array): Upgrade progression tree
  - `showHealthBar` (bool): Show health bar when damaged (default: true)

**Note:** Automatically creates internal BuildingModel and BuildingView instances.

---

### <span id="getposition"></span>Object **getPosition** ( ) const

Returns the building's world position.

```javascript
const pos = building.getPosition();
console.log(`Building at (${pos.x}, ${pos.y})`);
```

Returns Object with `x` and `y` properties.

---

### <span id="getsize"></span>Object **getSize** ( ) const

Returns the building's dimensions.

```javascript
const size = building.getSize();
console.log(`Building size: ${size.width}x${size.height}`);
```

Returns Object with `width` and `height` properties.

---

### <span id="gethealth"></span>int **getHealth** ( ) const

Returns the building's current health.

```javascript
const health = building.getHealth();
if (health < 50) {
  console.log('Building is heavily damaged!');
}
```

Returns int representing current health value.

---

### <span id="getmaxhealth"></span>int **getMaxHealth** ( ) const

Returns the building's maximum health.

```javascript
const maxHealth = building.getMaxHealth();
const healthPercent = (building.getHealth() / maxHealth) * 100;
```

Returns int representing maximum health value.

---

### <span id="takedamage"></span>void **takeDamage** ( amount: `int` )

Reduces building health by the specified amount. Notifies listeners of health change. Triggers 'died' event if health reaches 0.

```javascript
building.takeDamage(30);
console.log(`Remaining health: ${building.getHealth()}`);

if (building.isDead()) {
  console.log('Building destroyed!');
}
```

**Parameters:**
- `amount` (int, **required**): Damage amount (health cannot go below 0)

**Note:** Automatically clamps health to 0 minimum.

---

### <span id="heal"></span>void **heal** ( amount: `int` )

Increases building health by the specified amount. Cannot exceed maxHealth.

```javascript
building.heal(50);
console.log(`Health restored to: ${building.getHealth()}`);
```

**Parameters:**
- `amount` (int, **required**): Heal amount (health cannot exceed maxHealth)

**Note:** Automatically clamps health to maxHealth.

---

### <span id="isdead"></span>bool **isDead** ( ) const

Checks if the building is dead (health = 0).

```javascript
if (building.isDead()) {
  // Remove from game world
  Buildings = Buildings.filter(b => b !== building);
}
```

Returns bool. True if health is 0, false otherwise.

---

### <span id="getspawnconfig"></span>Object **getSpawnConfig** ( ) const

Returns the building's spawn configuration.

```javascript
const config = building.getSpawnConfig();
console.log(`Spawns ${config.count} units every ${config.interval}s`);
console.log(`Timer at: ${config.timer}s`);
```

Returns Object with:
- `interval` (float): Spawn interval in seconds
- `count` (int): Number of units to spawn
- `timer` (float): Current timer value
- `enabled` (bool): Whether spawning is enabled

---

### <span id="updatespawntimer"></span>void **updateSpawnTimer** ( deltaTime: `float` )

Updates the spawn timer. When timer exceeds interval, notifies listeners with 'spawn' event and resets timer.

```javascript
// In game loop
const deltaTime = 1/60; // 60 FPS
building.updateSpawnTimer(deltaTime);
```

**Parameters:**
- `deltaTime` (float, **required**): Time elapsed in seconds since last frame

**Note:** Only updates if spawn is enabled. Call this in your game loop.

---

### <span id="canupgrade"></span>bool **canUpgrade** ( availableResources: `int` ) const

Checks if building can be upgraded based on available resources and upgrade tree.

```javascript
const playerResources = 150;
if (building.canUpgrade(playerResources)) {
  console.log('Upgrade available!');
  building.upgrade((level) => loadImage(`Cone${level}.png`));
}
```

**Parameters:**
- `availableResources` (int, **required**): Available resources for upgrade

Returns bool. True if upgrade is available and affordable, false otherwise.

**Note:** Returns false if no upgrade tree or insufficient resources.

---

### <span id="upgrade"></span>bool **upgrade** ( imageCallback: `Function` = null )

Applies the next upgrade from the upgrade tree. Increases level, improves stats, and optionally updates sprite image.

```javascript
building.upgrade((level) => {
  const imagePath = `Images/Buildings/Cone/Cone${level}.png`;
  return loadImage(imagePath);
});
```

**Parameters:**
- `imageCallback` (Function, optional): Callback to load new image (level => Image)

Returns bool. True if upgrade successful, false if no upgrade available.

**Note:** Notifies listeners with 'upgraded' event. Image callback receives new level as parameter.

---

### <span id="gettype"></span>String **getType** ( ) const

Returns the building type.

```javascript
const type = building.getType();
if (type === 'HiveSource') {
  console.log('This is a HiveSource building');
}
```

Returns String representing building type ('AntCone', 'AntHill', 'HiveSource', etc.).

---

### <span id="getfaction"></span>String **getFaction** ( ) const

Returns the building faction.

```javascript
const faction = building.getFaction();
if (faction === 'player') {
  console.log('This is a player-owned building');
}
```

Returns String representing faction ('player', 'enemy', 'neutral').

---

### <span id="update"></span>void **update** ( deltaTime: `float` )

Updates building state. Currently updates spawn timer.

```javascript
// In game loop
Buildings.forEach(building => {
  building.update(deltaTime);
});
```

**Parameters:**
- `deltaTime` (float, **required**): Time elapsed in seconds

**Note:** Call this every frame for active buildings.

---

### <span id="handleinput"></span>void **handleInput** ( type: `String`, data: `Object` )

Handles input events. Currently supports click detection for selection.

```javascript
building.handleInput('click', {
  x: mouseX,
  y: mouseY
});
```

**Parameters:**
- `type` (String, **required**): Input type ('click', 'hover', etc.)
- `data` (Object, **required**): Input data containing pointer position

**Note:** Automatically checks if click is inside building bounds.

---

### <span id="tojson"></span>Object **toJSON** ( ) const

Serializes building state to JSON for saving/loading.

```javascript
const buildingData = building.toJSON();
localStorage.setItem('building', JSON.stringify(buildingData));

// Later: Load from JSON
const savedData = JSON.parse(localStorage.getItem('building'));
const building = new BuildingController(
  savedData.position.x,
  savedData.position.y,
  savedData.size.width,
  savedData.size.height,
  savedData
);
```

Returns Object containing all building state (position, size, type, faction, health, spawn config).

---

## Best Practices

**DO:**
- ✅ Use `update(deltaTime)` in game loop for spawn timers
- ✅ Check `isDead()` before operations
- ✅ Use `canUpgrade()` before calling `upgrade()`
- ✅ Provide image callback to `upgrade()` for visual progression

**DON'T:**
- ❌ Access `_model` or `_view` directly (use public API)
- ❌ Modify spawn config directly (use model methods)
- ❌ Skip `update()` calls (spawn system won't work)

## Common Workflows

### Creating and Managing Buildings

```javascript
// Create building
const building = new BuildingController(200, 200, 64, 64, {
  type: 'AntCone',
  faction: 'player',
  imagePath: 'Images/Buildings/Cone/Cone1.png',
  health: 80,
  spawnInterval: 8
});

// Add to game world
Buildings.push(building);

// Game loop
function update(deltaTime) {
  building.update(deltaTime);
  building.render();
}
```

### Health Management

```javascript
// Enemy attacks building
building.takeDamage(30);

// Repair building
building.heal(20);

// Check if destroyed
if (building.isDead()) {
  Buildings = Buildings.filter(b => b !== building);
}
```

### Spawn System

```javascript
// Listen for spawn events
building.model.addChangeListener((property, data) => {
  if (property === 'spawn') {
    const spawnCount = data.count;
    for (let i = 0; i < spawnCount; i++) {
      const ant = createAnt(building.getPosition());
      ants.push(ant);
    }
  }
});

// Update spawn timer every frame
building.update(deltaTime);
```

### Upgrade System

```javascript
// Check if player can upgrade
const playerResources = 150;
if (building.canUpgrade(playerResources)) {
  // Show upgrade UI
  showUpgradeDialog(building);
}

// Apply upgrade
const success = building.upgrade((level) => {
  return loadImage(`Images/Buildings/Cone/Cone${level}.png`);
});

if (success) {
  playerResources -= 100; // Deduct cost
  console.log('Upgrade applied!');
}
```

## Notes

- BuildingController is part of the MVC refactoring effort to separate concerns
- Old Building class (Entity-based) is deprecated
- Use BuildingFactory for creating specific building types
- BuildingManager handles global building coordination

## Related Docs

- [BuildingModel](BuildingModel_API_Reference.md) - Internal data and logic
- [BuildingView](BuildingView_API_Reference.md) - Rendering implementation
- [BuildingFactory](BuildingFactory_API_Reference.md) - Factory methods for building types
- [BuildingManager](BuildingManager_API_Reference.md) - Global building coordination
- [BaseController](BaseController_API_Reference.md) - Parent class
- [MVC Refactoring Roadmap](../roadmaps/MVC_REFACTORING_ROADMAP.md)
