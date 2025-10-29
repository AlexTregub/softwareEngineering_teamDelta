# Random Events System - Unit Test Suite

## Overview
This document summarizes the comprehensive unit tests created for the Random Events System following strict TDD (Test-Driven Development) methodology.

**Status**: ✅ Tests written FIRST, awaiting review before implementation

## Test Files Created

### 1. EventManager Tests (`test/unit/managers/eventManager.test.js`)
**Total Tests**: ~60 test cases

#### Test Coverage:
- ✅ **Initialization**: Empty registries, flag system, enabled state
- ✅ **Event Registration**: Unique IDs, duplicate rejection, validation, configuration storage
- ✅ **Event Retrieval**: By ID, by type, all events, null handling
- ✅ **Event Triggering**: Activation, callbacks, duplicate prevention, custom data, enabled/disabled state
- ✅ **Active Event Management**: Active list, completion, callbacks
- ✅ **Trigger System**: Registration, evaluation, time-based, one-time vs repeatable
- ✅ **Event Flags**: Set/get/clear, numeric/string/object values, increment, exists check
- ✅ **Conditional Triggers**: Flag conditions, AND logic, comparison operators
- ✅ **Update Loop**: Active trigger/event updates, disabled state handling
- ✅ **JSON Loading**: Event/trigger configs, validation, error handling
- ✅ **Priority System**: Sorted active events
- ✅ **Enable/Disable**: State control, pause callbacks
- ✅ **Clear/Reset**: Active events, full reset, flag preservation

### 2. Event Class Tests (`test/unit/events/event.test.js`)
**Total Tests**: ~40 test cases

#### Event Base Class:
- ✅ **Constructor**: Required properties, defaults, priority, metadata
- ✅ **Lifecycle**: Trigger, complete, pause, resume, state validation
- ✅ **Callbacks**: onTrigger, onComplete, onUpdate, paused state handling
- ✅ **Duration**: Elapsed time tracking

#### DialogueEvent:
- ✅ **Constructor**: Title, message, buttons, speaker
- ✅ **Button Response**: Click handling, auto-complete option

#### SpawnEvent:
- ✅ **Constructor**: Enemy config, wave configuration
- ✅ **Spawn Location**: Viewport edge generation, custom spawn points
- ✅ **Enemy Spawning**: Callback execution with enemy data

#### TutorialEvent:
- ✅ **Constructor**: Instructional content, highlight elements, multi-step support
- ✅ **Step Navigation**: Next/previous, completion at last step, boundary handling

#### BossEvent:
- ✅ **Constructor**: Boss config, health, spawn location
- ✅ **Intro Dialogue**: Speaker/message support
- ✅ **Victory/Defeat Conditions**: Condition tracking
- ✅ **Boss Phases**: Multi-phase support, phase transitions

### 3. Event Trigger Tests (`test/unit/events/eventTrigger.test.js`)
**Total Tests**: ~50 test cases

#### EventTrigger Base:
- ✅ **Constructor**: Event ID, type, one-time/repeatable
- ✅ **Trigger State**: Activation, reset, duplicate prevention
- ✅ **Condition Checking**: Abstract method existence

#### TimeTrigger:
- ✅ **Delay-based**: After specified milliseconds, immediate (0 delay)
- ✅ **Interval-based**: Repeating at intervals
- ✅ **Specific Time**: Day/night cycle integration (ready for future system)

#### SpatialTrigger:
- ✅ **Radius-based**: Entity distance checking, entity type filtering
- ✅ **Region-based**: Rectangular regions
- ✅ **Entry/Exit Tracking**: onEnter/onExit callbacks, entity tracking
- ✅ **Level Editor Integration**: Flag positioning, visibility, JSON serialization

#### FlagTrigger:
- ✅ **Simple Flags**: Value matching, existence checking
- ✅ **Comparison Operators**: >, >=, <, <=, !=, ==
- ✅ **Multiple Flags**: AND logic for multiple conditions
- ✅ **Change Detection**: Trigger only on value changes

#### ConditionalTrigger:
- ✅ **Custom Functions**: Function-based conditions
- ✅ **Context Passing**: Custom data to condition functions
- ✅ **Complex Logic**: AND/OR combinations

#### ViewportSpawnTrigger:
- ✅ **Viewport Detection**: getViewSpan() integration with GridTerrain
- ✅ **Edge Spawn**: Positions at viewport edges
- ✅ **Distribution**: Even distribution across edges
- ✅ **SpawnEvent Integration**: Position generation for spawning

## Architecture Summary

### Core Classes Designed (tests written, implementation pending):

```
EventManager (Singleton)
├── events: Map<eventId, Event>
├── activeEvents: Event[]
├── triggers: Map<triggerId, Trigger>
└── flags: Object

Event (Base Class)
├── DialogueEvent
├── SpawnEvent
├── TutorialEvent
└── BossEvent

EventTrigger (Base Class)
├── TimeTrigger
├── SpatialTrigger
├── FlagTrigger
├── ConditionalTrigger
└── ViewportSpawnTrigger
```

### Key Features Tested:

1. **Event Registration & Management**
   - Unique ID enforcement
   - Type-based filtering
   - Priority sorting
   - Active event tracking

2. **Flexible Trigger System**
   - Time-based (delay, interval, game time)
   - Spatial (radius, region, entity type)
   - Flag-based (value, comparison, change detection)
   - Viewport-based (edge spawning using getViewSpan())
   - Custom conditional logic

3. **Event Flag System**
   - Any data type (boolean, number, string, object)
   - Comparison operators
   - Increment utility
   - Persistence control

4. **JSON Configuration**
   - Load events from JSON files
   - Load triggers from JSON files
   - Validation before loading
   - Level editor export ready

5. **Lifecycle Management**
   - Trigger → Active → Complete
   - Pause/Resume support
   - Enable/Disable control
   - Reset functionality

6. **Integration Points**
   - GridTerrain.getViewSpan() for viewport spawning ✅
   - Day/Night cycle (placeholder for future) ✅
   - Level editor flag placement ✅
   - Draggable panel system (for dialogue/tutorial UI)

## Design Decisions

### 1. Event-Driven Architecture
- **EventManager**: Central coordinator (singleton pattern)
- **Event**: Self-contained event logic (polymorphic via type)
- **EventTrigger**: Decoupled condition checking

### 2. JSON-First Configuration
- All events/triggers can be defined in JSON
- Supports level editor export/import
- Easy content creation without code changes

### 3. Separation of Concerns
- Events don't know about triggers
- Triggers don't know about event implementation
- Flags provide global state sharing

### 4. Flexible Trigger Composition
- Multiple triggers per event
- One-time or repeatable
- Custom condition functions for complex logic

### 5. Future-Proof Design
- Day/Night cycle: TimeTrigger ready with `gameTime` condition
- Boss AI: BossEvent provides phase system
- More event types: Extend Event base class

## Testing Strategy

### Unit Tests (Current - 150+ tests)
- ✅ Isolated component testing
- ✅ Mock all external dependencies
- ✅ Fast execution (<10ms per test)
- ✅ 100% coverage target

### Integration Tests (Next Phase)
- Event ↔ Trigger interaction
- EventManager ↔ GameState coordination
- Spatial triggers ↔ Entity system
- JSON loading ↔ File system

### E2E Tests (Final Phase)
- Dialogue box rendering with screenshots
- Tutorial popups with highlighting
- Wave spawn visual verification
- Level editor flag placement UI
- Boss event complete workflow

### BDD Tests (Documentation)
- User-facing behavior scenarios
- Level editor event creation workflow
- Complete event sequences

## Next Steps for Review

### Before Implementation:
1. **Review test coverage**: Are all requirements captured?
2. **API design check**: Do method names/signatures make sense?
3. **Missing scenarios**: Any edge cases not covered?
4. **Integration points**: Verify GridTerrain, GameState, Panel system compatibility

### Questions for You:
1. Should EventManager be a singleton or instance-based?
2. Do we need event categories (combat, tutorial, story, etc.)?
3. Should triggers have priority when multiple fire simultaneously?
4. Any specific dialogue/tutorial UI mockups to reference?
5. Enemy spawn integration - use existing entity spawning system or new one?

## File Structure (Planned)

```
Classes/
  managers/
    EventManager.js          (New)
  events/
    Event.js                 (New - Base)
    DialogueEvent.js         (New)
    SpawnEvent.js            (New)
    TutorialEvent.js         (New)
    BossEvent.js             (New)
  triggers/
    EventTrigger.js          (New - Base)
    TimeTrigger.js           (New)
    SpatialTrigger.js        (New)
    FlagTrigger.js           (New)
    ConditionalTrigger.js    (New)
    ViewportSpawnTrigger.js  (New)

test/
  unit/
    managers/
      eventManager.test.js   (✅ Created)
    events/
      event.test.js          (✅ Created)
      eventTrigger.test.js   (✅ Created)
```

## Test Execution

Once implementation is complete:

```bash
# Run all event system tests
npx mocha "test/unit/managers/eventManager.test.js"
npx mocha "test/unit/events/*.test.js"

# Run with coverage
npm run test:unit -- --grep "Event"
```

---

**Status**: ✅ Ready for review
**Next**: Review tests → Implement classes → Run tests (should all pass) → Integration tests
