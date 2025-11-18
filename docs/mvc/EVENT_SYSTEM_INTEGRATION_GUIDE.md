# Event System Integration Guide - MVC with EventManager

**Date**: November 18, 2025  
**Status**: ✅ IMPLEMENTED  
**Systems**: EntityEvents, EventManager (pub/sub), AntController

---

## Overview

The ant MVC system uses **EventManager's pub/sub capability** for decoupled communication between components. Controllers emit lifecycle events (damage, death, job changes, etc.) which other systems can subscribe to.

### Benefits of Event-Driven Architecture

✅ **Decoupling**: Controllers don't need to know about AnimationManager, UI, stats tracking  
✅ **Extensibility**: Add new listeners without modifying controllers  
✅ **Testability**: Easy to mock events in unit tests  
✅ **Maintainability**: Central event constants with intellisense  
✅ **Debugging**: Single point to log all entity events  

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AntController                        │
│  (Emits events when state changes)                     │
└────────────────────┬────────────────────────────────────┘
                     │ emit()
                     ▼
┌─────────────────────────────────────────────────────────┐
│            EventManager (Singleton)                     │
│  Pub/Sub Event Bus with listeners Map                  │
└──┬──────────────┬──────────────┬────────────────┬──────┘
   │ notify       │ notify       │ notify         │ notify
   ▼              ▼              ▼                ▼
┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────────┐
│Animation│  │   UI    │  │  Stats   │  │   Custom     │
│Listener │  │Listener │  │ Tracker  │  │  Listeners   │
└─────────┘  └─────────┘  └──────────┘  └──────────────┘
```

---

## Core Components

### 1. EntityEvents (Event Constants)

**Location**: `Classes/events/EntityEvents.js`

**Purpose**: Centralized, intellisense-friendly event names

**Event Categories**:
- **Lifecycle**: ANT_CREATED, ANT_DIED, ANT_DESTROYED
- **Health**: ANT_DAMAGED, ANT_HEALED, ANT_HEALTH_CRITICAL
- **Combat**: ANT_ATTACKED, ANT_COMBAT_ENTERED, ANT_COMBAT_EXITED
- **State**: ANT_STATE_CHANGED, ANT_MOVE_STARTED, ANT_GATHERING_STARTED
- **Resources**: ANT_RESOURCE_COLLECTED, ANT_RESOURCE_DEPOSITED, ANT_CAPACITY_REACHED
- **Job**: ANT_JOB_CHANGED
- **Selection**: ANT_SELECTED, ANT_DESELECTED
- **Animation**: ANIMATION_PLAY_REQUESTED, ANIMATION_STARTED, ANIMATION_COMPLETED

**Example**:
```javascript
// Import (automatic in browser)
const eventName = EntityEvents.ANT_DAMAGED;

// Intellisense shows all available events when typing:
EntityEvents. // <-- Ctrl+Space shows all event constants
```

---

### 2. EventManager Pub/Sub API

**Location**: `Classes/managers/EventManager.js`

**New Methods** (added to existing EventManager):

#### `on(eventName, callback)`
Subscribe to an event. Returns unsubscribe function.

```javascript
const unsubscribe = EventManager.getInstance().on(
  EntityEvents.ANT_DAMAGED, 
  (data) => {
    console.log(`Ant ${data.ant.model.getAntIndex()} took ${data.damage} damage`);
  }
);

// Later: unsubscribe()
```

#### `off(eventName, callback)`
Unsubscribe from an event.

```javascript
const handler = (data) => { /* ... */ };
EventManager.getInstance().on(EntityEvents.ANT_DAMAGED, handler);
EventManager.getInstance().off(EntityEvents.ANT_DAMAGED, handler);
```

#### `once(eventName, callback)`
Subscribe once (auto-unsubscribe after first trigger).

```javascript
EventManager.getInstance().once(EntityEvents.ANT_DIED, (data) => {
  console.log('First ant death detected!');
});
```

#### `emit(eventName, data)`
Publish an event (controllers use this internally).

```javascript
EventManager.getInstance().emit(EntityEvents.ANT_DAMAGED, {
  ant: controller,
  damage: 10,
  healthBefore: 100,
  healthAfter: 90
});
```

#### `listenerCount(eventName)`
Get number of subscribers.

```javascript
const count = EventManager.getInstance().listenerCount(EntityEvents.ANT_DAMAGED);
console.log(`${count} listeners for ANT_DAMAGED`);
```

#### `removeAllListeners(eventName)`
Remove all subscribers for an event.

```javascript
EventManager.getInstance().removeAllListeners(EntityEvents.ANT_DAMAGED);
```

---

### 3. AntController Event Emissions

**Location**: `Classes/mvc/controllers/AntController.js`

**Emits events automatically** when:

| Method | Event Emitted | Data |
|--------|---------------|------|
| `constructor()` | ANT_CREATED | ant, jobName, position |
| `setJob()` | ANT_JOB_CHANGED | ant, oldJob, newJob, stats |
| `setState()` | ANT_STATE_CHANGED | ant, oldState, newState |
| `setState('GATHERING')` | ANT_GATHERING_STARTED | ant |
| `collectResource()` | ANT_RESOURCE_COLLECTED | ant, amount, totalCarried, capacity |
| `collectResource()` (at max) | ANT_CAPACITY_REACHED | ant, capacity |
| `depositResources()` | ANT_RESOURCE_DEPOSITED | ant, amount, dropoff |
| `attack()` | ANT_ATTACKED | ant, target, damage |
| `attack()` | ANIMATION_PLAY_REQUESTED | entity, animationName='Attack' |
| `takeDamage()` | ANT_DAMAGED | ant, damage, healthBefore, healthAfter |
| `takeDamage()` (critical) | ANT_HEALTH_CRITICAL | ant, healthPercent |
| `takeDamage()` | ANIMATION_PLAY_REQUESTED | entity, animationName='Attack' |
| `die()` | ANT_DIED | ant, cause, position |
| `setCombatTarget()` | ANT_COMBAT_ENTERED | ant, enemy |
| `clearCombatTarget()` | ANT_COMBAT_EXITED | ant, reason |
| `setSelected(true)` | ANT_SELECTED | ant |
| `setSelected(false)` | ANT_DESELECTED | ant |
| `destroy()` | ANT_DESTROYED | antId, antIndex |

**Internal Implementation**:
```javascript
_emitEvent(eventName, data) {
  if (this._eventBus && typeof this._eventBus.emit === 'function') {
    this._eventBus.emit(eventName, data);
  }
}
```

---

### 4. AnimationEventListener (Example Listener)

**Location**: `Classes/events/AnimationEventListener.js`

**Purpose**: Bridges MVC events → AnimationManager

**Auto-subscriptions**:
- `ANIMATION_PLAY_REQUESTED` → triggers AnimationManager.play()
- `ANT_DAMAGED` → plays "Attack" animation
- `ANT_ATTACKED` → plays "Attack" animation
- `ANT_MOVE_STARTED` → plays "Walking" animation

**Usage**:
```javascript
// In sketch.js setup() or initialization
const animationListener = new AnimationEventListener();
```

That's it! Now all animation events are handled automatically.

---

## Usage Examples

### Example 1: Simple Event Listener

```javascript
// Subscribe to damage events
EventManager.getInstance().on(EntityEvents.ANT_DAMAGED, (data) => {
  console.log(`💥 Ant ${data.ant.model.getAntIndex()} damaged!`);
  console.log(`   Damage: ${data.damage}`);
  console.log(`   Health: ${data.healthBefore} → ${data.healthAfter}`);
});

// Now whenever ANY ant takes damage, this logs
```

### Example 2: UI Stats Tracker

```javascript
class UIStatsTracker {
  constructor() {
    this.eventBus = EventManager.getInstance();
    this._subscribe();
  }

  _subscribe() {
    // Track total damage dealt
    this.eventBus.on(EntityEvents.ANT_ATTACKED, (data) => {
      this.totalDamageDealt += data.damage;
      this.updateUI();
    });

    // Track resources collected
    this.eventBus.on(EntityEvents.ANT_RESOURCE_COLLECTED, (data) => {
      this.totalResourcesGathered += data.amount;
      this.updateUI();
    });

    // Track ant deaths
    this.eventBus.on(EntityEvents.ANT_DIED, (data) => {
      this.totalDeaths++;
      this.updateUI();
    });
  }

  updateUI() {
    // Update UI panels with stats
  }
}

// Initialize once
const statsTracker = new UIStatsTracker();
```

### Example 3: Achievement System

```javascript
class AchievementSystem {
  constructor() {
    this.eventBus = EventManager.getInstance();
    this.resourcesCollected = 0;
    this._subscribe();
  }

  _subscribe() {
    this.eventBus.on(EntityEvents.ANT_RESOURCE_COLLECTED, (data) => {
      this.resourcesCollected += data.amount;
      
      // Check achievements
      if (this.resourcesCollected >= 100) {
        this.unlockAchievement('Gatherer');
      }
      if (this.resourcesCollected >= 1000) {
        this.unlockAchievement('Master Gatherer');
      }
    });

    this.eventBus.on(EntityEvents.ANT_DIED, (data) => {
      if (data.cause === 'starvation') {
        this.unlockAchievement('Forgotten Colony');
      }
    });
  }

  unlockAchievement(name) {
    console.log(`🏆 Achievement Unlocked: ${name}`);
  }
}
```

### Example 4: Debug Logger

```javascript
class EntityEventLogger {
  constructor() {
    this.eventBus = EventManager.getInstance();
    this.enabled = true;
    this._subscribeToAll();
  }

  _subscribeToAll() {
    // Log ALL entity events
    for (const eventName in EntityEvents) {
      this.eventBus.on(EntityEvents[eventName], (data) => {
        if (this.enabled) {
          console.log(`[EVENT] ${eventName}`, data);
        }
      });
    }
  }

  enable() { this.enabled = true; }
  disable() { this.enabled = false; }
}

// Debug mode
const logger = new EntityEventLogger();
logger.enable(); // See ALL events in console
```

### Example 5: Sound Effect System

```javascript
class SoundEffectManager {
  constructor() {
    this.eventBus = EventManager.getInstance();
    this._subscribe();
  }

  _subscribe() {
    this.eventBus.on(EntityEvents.ANT_DAMAGED, (data) => {
      this.playSound('hit', 0.5);
    });

    this.eventBus.on(EntityEvents.ANT_DIED, (data) => {
      this.playSound('death', 0.7);
    });

    this.eventBus.on(EntityEvents.ANT_RESOURCE_COLLECTED, (data) => {
      this.playSound('collect', 0.3);
    });

    this.eventBus.on(EntityEvents.ANT_COMBAT_ENTERED, (data) => {
      this.playSound('combat_start', 0.6);
    });
  }

  playSound(soundName, volume) {
    // Play p5.sound or Web Audio API sound
    console.log(`🔊 Playing sound: ${soundName} at ${volume * 100}%`);
  }
}
```

---

## Integration with Existing Systems

### AnimationManager Integration (Already Implemented)

**Before** (direct coupling):
```javascript
// In AntController.takeDamage()
if (animationManager.isAnimation("Attack")) {
  animationManager.play(this, "Attack");
}
```

**After** (event-driven):
```javascript
// In AntController.takeDamage()
this._emitEvent(EntityEvents.ANIMATION_PLAY_REQUESTED, {
  entity: this,
  animationName: 'Attack'
});

// AnimationEventListener handles it automatically
```

**Benefits**:
- Controllers don't depend on AnimationManager
- Can disable animations by removing listener
- Can add animation queuing/priority logic in listener
- Easier to test (mock events instead of AnimationManager)

---

## Testing with Events

### Unit Test Example

```javascript
describe('AntController Events', function() {
  let eventBus;
  let controller;

  beforeEach(function() {
    eventBus = EventManager.getInstance();
    const { model, view, controller: ctrl } = AntFactory.create({});
    controller = ctrl;
  });

  it('should emit ANT_DAMAGED event on takeDamage()', function() {
    const spy = sinon.spy();
    eventBus.on(EntityEvents.ANT_DAMAGED, spy);

    controller.takeDamage(10);

    expect(spy.calledOnce).to.be.true;
    expect(spy.firstCall.args[0].damage).to.equal(10);
  });

  it('should emit ANT_DIED event when health reaches 0', function() {
    const spy = sinon.spy();
    eventBus.on(EntityEvents.ANT_DIED, spy);

    controller.takeDamage(1000); // Kill it

    expect(spy.calledOnce).to.be.true;
    expect(spy.firstCall.args[0].ant).to.equal(controller);
  });

  it('should emit ANT_JOB_CHANGED event on setJob()', function() {
    const spy = sinon.spy();
    eventBus.on(EntityEvents.ANT_JOB_CHANGED, spy);

    controller.setJob('Warrior');

    expect(spy.calledOnce).to.be.true;
    expect(spy.firstCall.args[0].newJob).to.equal('Warrior');
  });
});
```

### Integration Test Example

```javascript
describe('Animation Event Integration', function() {
  it('should trigger animation on damage', function() {
    const animListener = new AnimationEventListener();
    const { controller } = AntFactory.create({ jobName: 'Warrior' });
    const animSpy = sinon.spy(animationManager, 'play');

    controller.takeDamage(10);

    expect(animSpy.called).to.be.true;
    expect(animSpy.firstCall.args[1]).to.equal('Attack');
  });
});
```

---

## Best Practices

### ✅ DO

1. **Use EntityEvents constants** (not magic strings)
   ```javascript
   ✅ eventBus.on(EntityEvents.ANT_DAMAGED, handler)
   ❌ eventBus.on('entity:ant:damaged', handler)
   ```

2. **Emit events for state changes** (not internal mechanics)
   ```javascript
   ✅ emit ANT_DAMAGED when health decreases
   ❌ emit ANT_FRAME_UPDATED every frame
   ```

3. **Keep event data simple** (primitives + references)
   ```javascript
   ✅ { ant: controller, damage: 10 }
   ❌ { ant: { ...deepClone(controller) } }
   ```

4. **Handle errors in listeners** (don't crash event system)
   ```javascript
   eventBus.on(EntityEvents.ANT_DAMAGED, (data) => {
     try {
       // ... listener code ...
     } catch (error) {
       console.error('Listener error:', error);
     }
   });
   ```

5. **Unsubscribe when done** (prevent memory leaks)
   ```javascript
   class MySystem {
     constructor() {
       this.unsubscribe = eventBus.on(EntityEvents.ANT_DAMAGED, ...);
     }
     destroy() {
       this.unsubscribe();
     }
   }
   ```

### ❌ DON'T

1. **Don't modify event data** (read-only)
   ```javascript
   eventBus.on(EntityEvents.ANT_DAMAGED, (data) => {
     ❌ data.damage = 0; // Don't mutate
     ✅ const modifiedDamage = data.damage * 0.5; // Create new values
   });
   ```

2. **Don't create infinite loops** (emit in listener)
   ```javascript
   ❌ eventBus.on(EntityEvents.ANT_DAMAGED, (data) => {
     data.ant.takeDamage(1); // Infinite loop!
   });
   ```

3. **Don't block update loop** (heavy computation in listener)
   ```javascript
   ❌ eventBus.on(EntityEvents.ANT_MOVED, (data) => {
     // Heavy pathfinding that takes 100ms
   });
   ✅ Use debouncing or async processing
   ```

4. **Don't use events for synchronous flow** (use method calls)
   ```javascript
   ❌ emit event and expect immediate response
   ✅ call method directly for sync operations
   ```

---

## Performance Considerations

### Event Bus Overhead

- **Minimal**: Map lookups O(1), Set iteration O(n) where n = listener count
- **Memory**: ~100 bytes per listener (Set entry + function reference)
- **Typical**: 10-20 listeners per event = negligible overhead

### Optimization Tips

1. **Debounce high-frequency events** (ENTITY_MOVED)
   ```javascript
   let moveDebounce = null;
   eventBus.on(EntityEvents.ENTITY_MOVED, (data) => {
     clearTimeout(moveDebounce);
     moveDebounce = setTimeout(() => {
       // Heavy operation here
     }, 100);
   });
   ```

2. **Batch event emissions** (multiple resources)
   ```javascript
   // Instead of emitting for each resource
   ❌ for (resource of resources) { emit(ANT_RESOURCE_COLLECTED, resource) }
   
   // Emit once with batch
   ✅ emit(ANT_RESOURCES_COLLECTED_BATCH, { resources, total })
   ```

3. **Use `once()` for one-time listeners** (auto-cleanup)
   ```javascript
   eventBus.once(EntityEvents.ANT_DIED, handler); // Auto-unsubscribe
   ```

---

## Migration Path

### Phase 1: Add Event System (✅ COMPLETE)
- ✅ Add pub/sub to EventManager
- ✅ Create EntityEvents constants
- ✅ Integrate events into AntController
- ✅ Create AnimationEventListener example

### Phase 2: Expand Coverage (TODO)
- ⬜ Add events to other entity controllers (Building, Resource, etc.)
- ⬜ Create UIEventListener for UI updates
- ⬜ Create StatsEventListener for tracking
- ⬜ Create SoundEventListener for audio

### Phase 3: Replace Direct Coupling (TODO)
- ⬜ Replace direct AnimationManager calls with events
- ⬜ Replace direct UI updates with events
- ⬜ Replace direct stat tracking with events

---

## Summary

### What We Built

✅ **EntityEvents** - Intellisense-friendly event constants (40+ events)  
✅ **EventManager pub/sub** - on(), off(), once(), emit(), listenerCount()  
✅ **AntController events** - Emits 15+ lifecycle events automatically  
✅ **AnimationEventListener** - Example listener that handles animations  

### Why Event-Driven Wins

**vs. Direct Coupling** (adding animation interface to controllers):
- ✅ **More flexible**: Add/remove listeners without changing controllers
- ✅ **More testable**: Mock events instead of systems
- ✅ **More maintainable**: Single source of truth for events
- ✅ **More extensible**: Add new systems without modifying existing code

**vs. Creating EventBus from Scratch**:
- ✅ **Faster**: Leveraged existing EventManager (already tested)
- ✅ **Consistent**: Same event system for game events + entity events
- ✅ **Integrated**: Works with existing architecture

### Next Steps

1. ✅ **Test event emissions** (unit tests for each event)
2. ✅ **Create example listeners** (UI, stats, sound)
3. ✅ **Document event data schemas** (TypeScript definitions)
4. ✅ **Expand to other entities** (Building, Resource, Enemy)

---

**Recommendation**: ✅ **USE EVENT SYSTEM**

Event-driven architecture is more scalable, maintainable, and testable than direct coupling. The EventManager integration is production-ready.
