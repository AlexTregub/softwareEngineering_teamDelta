# EntityService Migration Quickstart

## What Changed

Your ant update code has been refactored to use the new **EntityService** (Phase 6.1 - Unified Entity Management).

### Before (Legacy)
```javascript
// Update all ants manually
if (Array.isArray(ants) && ants.length > 0) {
  ants.forEach(ant => {
    if (ant && typeof ant.update === 'function') {
      ant.update();
    }
  });
}
```

### After (EntityService)
```javascript
// Update all entities via EntityService
if (typeof g_entityService !== 'undefined' && g_entityService) {
  g_entityService.update(deltaTime || 16.67);
} else {
  // LEGACY FALLBACK (Phase 6.1 migration in progress)
  // ... old code ...
}
```

## EntityService Benefits

✅ **Unified Registry**: All entities (Ants, Buildings, Resources) in one `Map<ID, Entity>`
✅ **O(1) Lookups**: Fast entity retrieval by ID
✅ **Automatic Updates**: Single call updates all entities
✅ **Spatial Grid Integration**: Automatic registration with SpatialGridManager
✅ **Sequential IDs**: Never reuse IDs (prevents stale reference bugs)

## EntityService API

### Spawning Entities

```javascript
// Spawn an ant
const ant = g_entityService.spawn('Ant', { 
  x: 100, 
  y: 100, 
  jobName: 'Worker', 
  faction: 'player' 
});

// Spawn a building
const building = g_entityService.spawn('Building', {
  x: 200,
  y: 200,
  buildingType: 'AntHill',
  faction: 'player'
});

// Spawn a resource
const resource = g_entityService.spawn('Resource', {
  x: 300,
  y: 300,
  resourceType: 'food',
  amount: 100
});
```

### Querying Entities

```javascript
// Get by ID (O(1))
const entity = g_entityService.getById(42);

// Get by type
const allAnts = g_entityService.getByType('Ant');
const allBuildings = g_entityService.getByType('Building');

// Get by faction
const playerEntities = g_entityService.getByFaction('player');
const enemyEntities = g_entityService.getByFaction('enemy');

// Custom queries
const lowHealthAnts = g_entityService.query(e => 
  e.type === 'Ant' && e.health < 50
);

const playerBuildings = g_entityService.query(e => 
  e.type === 'Building' && e.faction === 'player'
);
```

### Updating Entities

```javascript
// In draw() function - updates ALL entities
g_entityService.update(deltaTime || 16.67);
```

### Destroying Entities

```javascript
// Destroy by ID
g_entityService.destroy(entityId);

// Clear all entities
g_entityService.clearAll();
```

## Initialization Order (sketch.js)

```javascript
// 1. setUpManagers() - Initialize AntManager, BuildingManager
function setUpManagers() {
  antManager = AntManager.getInstance();
  buildingManager = new BuildingManager();
}

// 2. setUpFactories() - Initialize factories, then EntityService
function setUpFactories() {
  antFactory = new AntFactory(antManager);
  buildingFactory = new BuildingFactory();
  resourceFactory = new ResourceFactory();
  
  // EntityService depends on all 3 factories
  g_entityService = new EntityService(antFactory, buildingFactory, resourceFactory);
}

// 3. initGlobals() - Wire everything together
function initGlobals() {
  setUpManagers();
  setUpFactories();
  
  // Register spatial grid (AFTER EntityService created)
  if (g_entityService && spatialGridManager) {
    g_entityService.setSpatialGrid(spatialGridManager);
  }
}
```

## Migration Status

### ✅ Completed
- EntityService class created (`Classes/services/EntityService.js`)
- Added to `index.html` script load order
- Global variable `g_entityService` declared
- Initialization in `initGlobals()` with factory injection
- Spatial grid integration
- `draw()` function updated to use `g_entityService.update()`
- Legacy fallback code for gradual migration

### 🔄 In Progress (Phase 6.1)
- Migrate all `ants.push()` calls to `g_entityService.spawn('Ant', ...)`
- Migrate `Buildings.push()` to `g_entityService.spawn('Building', ...)`
- Migrate `resource_list.push()` to `g_entityService.spawn('Resource', ...)`
- Update selection systems to use `g_entityService.getByType('Ant')`
- Update render systems to use `g_entityService.getAllEntities()`

### 📋 TODO (Future)
- Remove legacy `ants[]`, `Buildings[]`, `resource_list[]` arrays
- Remove AntManager, BuildingManager, ResourceSystemManager (Phase 6.2)
- Update all factory methods to return EntityService-managed entities

## Testing EntityService

Open browser console and try:

```javascript
// Spawn test entities
const testAnt = g_entityService.spawn('Ant', { x: 100, y: 100, jobName: 'Worker', faction: 'player' });
console.log('Spawned ant:', testAnt._id);

// Query entities
console.log('All ants:', g_entityService.getByType('Ant').length);
console.log('Player entities:', g_entityService.getByFaction('player').length);
console.log('Total entities:', g_entityService.getCount());

// Check if entity exists
const found = g_entityService.getById(testAnt._id);
console.log('Found by ID:', found === testAnt);

// Destroy entity
g_entityService.destroy(testAnt._id);
console.log('Entity destroyed, count:', g_entityService.getCount());
```

## Related Documentation

- `Classes/services/EntityService.js` - Full API implementation
- `docs/checklists/active/PHASE_6.1_ENTITY_SERVICE.md` - Migration checklist
- `docs/roadmaps/MVC_REFACTORING_ROADMAP.md` - Overall refactoring plan

## Support

If you see errors like:
- ❌ `g_entityService is not defined` → Make sure `index.html` loads `EntityService.js`
- ❌ `Cannot read property 'spawn' of undefined` → Check `initGlobals()` is called in `setup()`
- ❌ `antFactory is not defined` → Ensure factories are created before EntityService

The legacy fallback code will keep your game working during the gradual migration to EntityService.
