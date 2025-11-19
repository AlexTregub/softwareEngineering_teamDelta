# EntityManager Event Integration

## Overview

The `EntityManager` now automatically listens to `EventManager` events to track entity lifecycle. When entities are created or destroyed through the event system, they are automatically registered/unregistered.

## Automatic Event Tracking

### Supported Events

- **`EntityEvents.ANT_CREATED`** - Auto-registers ant controllers
- **`EntityEvents.ANT_DESTROYED`** - Auto-unregisters ant controllers  
- **`EntityEvents.ENTITY_CREATED`** - Auto-registers generic entity controllers
- **`EntityEvents.ENTITY_DESTROYED`** - Auto-unregisters generic entity controllers

## Usage

### Basic Example

```javascript
// Get singleton instances
const entityManager = EntityManager.getInstance();
const eventManager = EventManager.getInstance();

// Create an ant via event (auto-registered)
eventManager.emit(EntityEvents.ANT_CREATED, {
  ant: antController,
  jobName: 'Worker',
  position: { x: 100, y: 100 }
});

// Check ant count
console.log(`Ants alive: ${entityManager.getAntCount()}`);
// Output: Ants alive: 1

// Destroy ant via event (auto-unregistered)
eventManager.emit(EntityEvents.ANT_DESTROYED, {
  antId: antController.id,
  antIndex: 0
});

// Check ant count
console.log(`Ants alive: ${entityManager.getAntCount()}`);
// Output: Ants alive: 0
```

### Real-Time Ant Tracking

```javascript
// Track ant population in real-time
function updateAntDisplay() {
  const antCount = EntityManager.getInstance().getAntCount();
  const allAnts = EntityManager.getInstance().getByType('ant');
  
  console.log(`${antCount} ants alive`);
  console.log('Ant IDs:', allAnts.map(ant => ant.id));
}

// Call this in your game loop or UI update
function draw() {
  updateAntDisplay();
  // ... rest of game loop
}
```

### AntFactory Integration

```javascript
// AntFactory automatically emits ANT_CREATED events
const antTriad = AntFactory.create({
  x: 200,
  y: 300,
  jobName: 'Warrior'
});

// Ant is automatically registered via ANT_CREATED event
// No need to manually call entityManager.register()

console.log(EntityManager.getInstance().getAntCount());
// Output: 1
```

### Query Registered Entities

```javascript
const manager = EntityManager.getInstance();

// Get all ants
const allAnts = manager.getByType('ant');

// Get specific ant
const ant = manager.getById('ant_123');

// Get total entity count
const total = manager.getCount();

// Get ant count (convenience method)
const antCount = manager.getAntCount();

// Get stats
const stats = manager.getStats();
console.log(stats);
// Output: { total: 10, types: { ant: 8, building: 2 }, typeCount: 2 }
```

## Manual Registration (Optional)

You can still manually register entities if needed:

```javascript
const manager = EntityManager.getInstance();

// Manual registration (still supported)
manager.register(antController, 'ant');

// Manual unregistration
manager.unregister('ant_123');
```

## Event Data Structures

### ANT_CREATED Event Data

```javascript
{
  ant: AntController,        // The ant controller instance
  jobName: 'Worker',         // Job type (Worker, Warrior, Scout, etc.)
  position: { x: 100, y: 100 } // Spawn position
}
```

### ANT_DESTROYED Event Data

```javascript
{
  antId: 'ant_123',   // The ant's unique ID
  antIndex: 0         // The ant's index in global array
}
```

### ENTITY_CREATED Event Data

```javascript
{
  entity: EntityController, // The entity controller instance
  type: 'building'          // Entity type
}
```

### ENTITY_DESTROYED Event Data

```javascript
{
  entityId: 'entity_123', // The entity's unique ID
  type: 'building'        // Entity type
}
```

## Benefits

✅ **Automatic Tracking** - No manual register/unregister calls needed  
✅ **Real-Time Updates** - Entity counts always accurate  
✅ **Event-Driven** - Decoupled from entity creation logic  
✅ **Type Safety** - TypeScript/JSDoc support for event data  
✅ **Performance** - O(1) lookups via Map-based storage  
✅ **Legacy Compatible** - Works with existing manual registration  

## Testing

See `test/unit/mvc/managers/EntityManager.events.test.js` for comprehensive test coverage:

- ✅ Event listener setup
- ✅ Auto-registration via ANT_CREATED
- ✅ Auto-unregistration via ANT_DESTROYED  
- ✅ Generic entity events (ENTITY_CREATED/DESTROYED)
- ✅ Ant count tracking
- ✅ Integration with manual registration
- ✅ Edge cases (null data, missing fields)

**Result**: 21 passing tests

## Architecture

```
EventManager (pub/sub)
      ↓
   [emit ANT_CREATED]
      ↓
EntityManager._setupEventListeners()
      ↓
   [auto-register ant]
      ↓
EntityManager._entities Map
```

## Implementation Details

- Event listeners set up in `EntityManager` constructor
- Uses `EventManager.getInstance().on()` for subscriptions
- Gracefully handles missing EventManager/EntityEvents (logs warning)
- Prevents duplicate registrations (checks ID before adding)
- Safe event data handling (null checks)
