# EntityService API Reference

**File**: `Classes/services/EntityService.js`  
**Phase**: 6.1 - Manager Elimination

Unified entity management service that consolidates AntManager, BuildingManager, and ResourceSystemManager into a single registry-based system.

---

## Description

EntityService provides a unified API for spawning, querying, updating, and destroying all game entities (Ants, Buildings, Resources). It uses a Map-based registry for O(1) lookups by ID and delegates entity creation to injected factories following the Factory pattern.

**Key Features**:
- Single source of truth for all entities (one registry)
- O(1) entity lookup by ID
- Type-based spawning with factory delegation
- Efficient querying by type, faction, or custom filters
- Automatic spatial grid integration
- Sequential ID generation (no collisions)

**Integration**:
- Receives factories via constructor (dependency injection)
- Integrates with SpatialGridManager for collision detection
- Works with MVC Controllers (AntController, BuildingController, ResourceController)

---

## Properties

| Type              | Property          | Default      | Description                                |
|-------------------|-------------------|--------------|--------------------------------------------|
| `Map<int, Object>`| `_entities`       | `new Map()`  | Registry mapping entity IDs to controllers|
| `int`             | `_nextId`         | `0`          | Sequential ID generator                    |
| `AntFactory`      | `_antFactory`     | `null`       | Factory for creating ants                  |
| `BuildingFactory` | `_buildingFactory`| `null`       | Factory for creating buildings             |
| `ResourceFactory` | `_resourceFactory`| `null`       | Factory for creating resources             |
| `SpatialGrid`     | `_spatialGrid`    | `null`       | Optional spatial grid for registration     |

---

## Methods

| Returns             | Method                                                                                    |
|---------------------|-------------------------------------------------------------------------------------------|
| `void`              | EntityService ( antFactory: `AntFactory`, buildingFactory: `BuildingFactory`, resourceFactory: `ResourceFactory` ) |
| `void`              | setSpatialGrid ( grid: `SpatialGrid` )                                                   |
| `Entity`            | spawn ( type: `String`, options: `Object` = {} )                                         |
| `Entity`            | getById ( id: `int` ) const                                                              |
| `Array<Entity>`     | getByType ( type: `String` ) const                                                       |
| `Array<Entity>`     | getByFaction ( faction: `String` ) const                                                 |
| `Array<Entity>`     | query ( filterFn: `Function` ) const                                                     |
| `Array<Entity>`     | getAllEntities ( ) const                                                                 |
| `int`               | getCount ( ) const                                                                       |
| `void`              | update ( deltaTime: `float` )                                                            |
| `bool`              | destroy ( id: `int` )                                                                    |
| `void`              | clearAll ( )                                                                             |

---

## Method Descriptions

### <span id="constructor"></span>**EntityService** ( antFactory: `AntFactory`, buildingFactory: `BuildingFactory`, resourceFactory: `ResourceFactory` )

Constructs a new EntityService with injected factories.

```javascript
const entityService = new EntityService(
  new AntFactory(antManager),
  BuildingFactory,
  ResourceFactory
);
```

**Parameters:**
- `antFactory` (AntFactory, **required**): Factory for creating ant entities
- `buildingFactory` (BuildingFactory, **required**): Factory for creating building entities
- `resourceFactory` (ResourceFactory, **required**): Factory for creating resource entities

Initializes empty entity registry and sets next ID to 0.

---

### <span id="setSpatialGrid"></span>void **setSpatialGrid** ( grid: `SpatialGrid` )

Sets the spatial grid for automatic entity registration.

```javascript
entityService.setSpatialGrid(spatialGridManager);
```

**Parameters:**
- `grid` (SpatialGrid, **required**): Spatial grid manager for collision detection

When set, all spawned entities are automatically registered with the spatial grid. Destroyed entities are automatically unregistered.

---

### <span id="spawn"></span>Entity **spawn** ( type: `String`, options: `Object` = {} )

Spawns a new entity of the specified type with given options.

```javascript
// Spawn ant
const ant = entityService.spawn('Ant', {
  x: 100,
  y: 100,
  jobName: 'Warrior',
  faction: 'player'
});

// Spawn building
const building = entityService.spawn('Building', {
  x: 200,
  y: 200,
  buildingType: 'AntCone',
  faction: 'player'
});

// Spawn resource
const resource = entityService.spawn('Resource', {
  x: 300,
  y: 300,
  resourceType: 'greenLeaf',
  amount: 100
});
```

**Parameters:**
- `type` (String, **required**): Entity type ('Ant', 'Building', 'Resource')
- `options` (Object, optional): Configuration options passed to factory

**Returns**: Entity controller (AntController, BuildingController, or ResourceController)

**Throws**: Error if type is unknown

**Algorithm**:
1. Generate unique sequential ID
2. Delegate creation to appropriate factory based on type
3. Assign ID to entity controller
4. Store in registry (Map)
5. Register with spatial grid (if available)
6. Set entity.type property for queries
7. Return entity controller

---

### <span id="getById"></span>Entity **getById** ( id: `int` ) const

Retrieves entity by unique ID (O(1) lookup).

```javascript
const entity = entityService.getById(5);
if (entity) {
  console.log('Found entity:', entity.type);
}
```

**Parameters:**
- `id` (int, **required**): Entity ID

**Returns**: Entity controller or undefined if not found

**Performance**: O(1) - constant time Map lookup

---

### <span id="getByType"></span>Array<Entity> **getByType** ( type: `String` ) const

Retrieves all entities of the specified type.

```javascript
// Get all ants
const ants = entityService.getByType('Ant');

// Get all buildings
const buildings = entityService.getByType('Building');

// Get all resources
const resources = entityService.getByType('Resource');
```

**Parameters:**
- `type` (String, **required**): Entity type to filter by

**Returns**: Array of entity controllers (may be empty)

**Performance**: O(n) - iterates entire registry

---

### <span id="getByFaction"></span>Array<Entity> **getByFaction** ( faction: `String` ) const

Retrieves all entities belonging to the specified faction.

```javascript
// Get player entities
const playerEntities = entityService.getByFaction('player');

// Get enemy entities
const enemyEntities = entityService.getByFaction('enemy');

// Get neutral entities
const neutralEntities = entityService.getByFaction('neutral');
```

**Parameters:**
- `faction` (String, **required**): Faction to filter by ('player', 'enemy', 'neutral')

**Returns**: Array of entity controllers (may be empty)

**Performance**: O(n) - iterates entire registry

**Note**: Uses consistent `entity.faction` getter across all controller types (AntController, BuildingController, ResourceController).

---

### <span id="query"></span>Array<Entity> **query** ( filterFn: `Function` ) const

Retrieves entities matching custom filter function.

```javascript
// Get all ants with health below 50%
const damagedAnts = entityService.query(entity => {
  return entity.type === 'Ant' && entity.health < entity.maxHealth * 0.5;
});

// Get all player buildings ready to spawn
const readyBuildings = entityService.query(entity => {
  return entity.type === 'Building' && 
         entity.faction === 'player' &&
         entity.getSpawnConfig().timer >= entity.getSpawnConfig().interval;
});

// Get all resources with amount > 50
const largeResources = entityService.query(entity => {
  return entity.type === 'Resource' && entity.amount > 50;
});
```

**Parameters:**
- `filterFn` (Function, **required**): Filter function (entity) => boolean

**Returns**: Array of entity controllers matching filter (may be empty)

**Performance**: O(n) - iterates entire registry

---

### <span id="getAllEntities"></span>Array<Entity> **getAllEntities** ( ) const

Retrieves all entities in the registry.

```javascript
const allEntities = entityService.getAllEntities();
console.log(`Total entities: ${allEntities.length}`);
```

**Returns**: Array of all entity controllers

**Performance**: O(n) - converts Map values to Array

---

### <span id="getCount"></span>int **getCount** ( ) const

Gets the total number of entities in the registry.

```javascript
const count = entityService.getCount();
console.log(`Entity count: ${count}`);
```

**Returns**: Number of entities

**Performance**: O(1) - returns Map size

---

### <span id="update"></span>void **update** ( deltaTime: `float` )

Updates all entities in the registry.

```javascript
function draw() {
  const deltaTime = 1000 / 60; // 16.67ms per frame
  entityService.update(deltaTime);
}
```

**Parameters:**
- `deltaTime` (float, **required**): Time elapsed since last update (milliseconds)

Iterates through all entities and calls their `update()` method. Skips inactive entities.

**Performance**: O(n) - iterates entire registry

---

### <span id="destroy"></span>bool **destroy** ( id: `int` )

Destroys an entity and removes it from the registry.

```javascript
const success = entityService.destroy(entityId);
if (success) {
  console.log('Entity destroyed');
}
```

**Parameters:**
- `id` (int, **required**): Entity ID to destroy

**Returns**: True if entity was found and destroyed, false otherwise

**Algorithm**:
1. Look up entity in registry
2. If found, call entity.destroy() (cleanup)
3. Remove from spatial grid (if available)
4. Remove from registry
5. Return true

**Performance**: O(1) - constant time Map deletion

---

### <span id="clearAll"></span>void **clearAll** ( )

Destroys all entities and resets the registry.

```javascript
entityService.clearAll();
console.log('All entities cleared');
```

Calls `destroy()` on each entity, then clears the registry and resets ID counter to 0.

**Use Case**: Level transitions, game resets, testing cleanup

---

## Common Workflows

### Spawning Multiple Entities

```javascript
// Spawn 5 worker ants
for (let i = 0; i < 5; i++) {
  entityService.spawn('Ant', {
    x: 100 + i * 50,
    y: 100,
    jobName: 'Worker',
    faction: 'player'
  });
}

// Spawn enemy base with defenders
const base = entityService.spawn('Building', {
  x: 500,
  y: 500,
  buildingType: 'AntHill',
  faction: 'enemy'
});

for (let i = 0; i < 3; i++) {
  entityService.spawn('Ant', {
    x: 500 + i * 30,
    y: 500,
    jobName: 'Warrior',
    faction: 'enemy'
  });
}
```

### Querying and Acting on Entities

```javascript
// Find all player ants
const playerAnts = entityService.getByFaction('player');

// Move all player ants to location
playerAnts.forEach(ant => {
  if (ant.type === 'Ant') {
    ant.moveTo(targetX, targetY);
  }
});

// Find all damaged entities
const damaged = entityService.query(entity => {
  return entity.health && entity.health < entity.maxHealth * 0.3;
});

damaged.forEach(entity => {
  console.log(`Low health: ${entity.type} ${entity._id}`);
});
```

### Entity Lifecycle Management

```javascript
// Spawn entity
const ant = entityService.spawn('Ant', {
  x: 100,
  y: 100,
  jobName: 'Scout',
  faction: 'player'
});

// Store ID for later
const antId = ant._id;

// ... game loop ...

// Update all entities
entityService.update(deltaTime);

// ... later ...

// Destroy specific entity
entityService.destroy(antId);
```

### Performance Monitoring

```javascript
// Check entity count
console.log(`Entities: ${entityService.getCount()}`);

// Count by type
const antCount = entityService.getByType('Ant').length;
const buildingCount = entityService.getByType('Building').length;
const resourceCount = entityService.getByType('Resource').length;

console.log(`Ants: ${antCount}, Buildings: ${buildingCount}, Resources: ${resourceCount}`);
```

---

## Notes

**ID Generation**: IDs are sequential integers starting from 0. IDs are never reused, even after entity destruction.

**Type Property**: EntityService sets `entity.type` = type during spawn for efficient filtering. This is separate from controller-specific type getters (e.g., `building.buildingType`, `resource.resourceType`).

**Spatial Grid Integration**: When spatial grid is set, entities are automatically registered/unregistered. If no spatial grid is set, EntityService still functions (queries work, but no collision detection).

**Factory Pattern**: EntityService never directly instantiates entity classes. All creation is delegated to factories, following dependency injection principles.

**Performance**: Registry uses Map for O(1) lookups by ID. Type/faction queries are O(n) but acceptable for typical entity counts (<1000). Consider indexing if performance becomes an issue.

**MVC Integration**: EntityService works with MVC Controllers (AntController, BuildingController, ResourceController), which coordinate Models and Views. All entities in the registry are Controllers, not raw Model instances.

---

## Related Documentation

- **Manager Elimination Roadmap**: `docs/roadmaps/PHASE_6_MANAGER_ELIMINATION_ROADMAP.md`
- **AntController API**: `docs/api/AntController_API_Reference.md`
- **BuildingController API**: `docs/api/BuildingController_API_Reference.md`
- **ResourceController API**: `docs/api/ResourceController_API_Reference.md`
- **Migration Guide**: `docs/guides/ENTITY_SERVICE_MIGRATION_QUICKSTART.md`
