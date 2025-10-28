# EventManager

**Inherits:** Object  
**File:** `Classes/managers/EventManager.js`

Singleton event coordination system for managing random events, dialogue, tutorials, and enemy waves.

## Description

**EventManager** coordinates all random events in the game, from dialogue sequences and enemy spawns to tutorial triggers and boss fights. It provides a priority-based event queuing system with flag-based conditions and multiple trigger types.

The EventManager processes events based on priority (1 = highest priority, 10 = lowest). Higher priority events automatically pause lower priority events. Once a high-priority event completes, paused events resume automatically.

**Scene tree:** The EventManager is initialized in `sketch.js` during setup and runs in the main game loop. Events are evaluated each frame via the update() method.

**Flags:** Events can set flags (e.g., `event_tutorial_completed`) that persist and control trigger conditions. Flags are set automatically when events complete or manually via setFlag().

**Triggers:** The EventManager supports five trigger types:
- **Time triggers**: Fire after a specified delay
- **Flag triggers**: Fire when flags meet conditions  
- **Spatial triggers**: Fire when entities enter areas
- **Conditional triggers**: Fire when custom functions return true
- **Viewport triggers**: Fire when areas become visible

**Singleton pattern:** Access the EventManager via EventManager.getInstance() or the global `window.eventManager` reference created during initialization.

**Note:** The EventManager automatically integrates with EventDebugManager when available, providing real-time event monitoring in development builds.

## Tutorials

- [EventManager Integration Guide](../guides/EventManager_Integration.md)
- [Random Events Roadmap](../roadmaps/RANDOM_EVENTS_ROADMAP.md)

## Properties

| Type | Property | Default | Description |
|------|----------|---------|-------------|
| Map | events | `new Map()` | Registered events by ID |
| Map | triggers | `new Map()` | Registered triggers by ID |
| Array | activeEvents | `[]` | Currently active events |
| Object | flags | `{}` | Event flags for conditions |
| bool | _enabled | `true` | Whether event processing is enabled |

## Methods

| Returns | Method |
|---------|--------|
| void | [registerEvent](#registerevent) ( eventConfig: Object ) |
| bool | [triggerEvent](#triggerevent) ( eventId: String, customData: Object = null ) |
| bool | [completeEvent](#completeevent) ( eventId: String ) |
| Object | [getEvent](#getevent) ( eventId: String ) const |
| Array | [getAllEvents](#getallevents) ( ) const |
| Array | [getEventsByType](#geteventsbytype) ( type: String ) const |
| bool | [isEventActive](#iseventactive) ( eventId: String ) const |
| Array | [getActiveEvents](#getactiveevents) ( sortByPriority: bool = false ) const |
| Array | [getActiveEventsSorted](#getactiveeventssorted) ( ) const |
| bool | [registerTrigger](#registertrigger) ( triggerConfig: Object ) |
| void | [setFlag](#setflag) ( flagName: String, value: Variant ) |
| Variant | [getFlag](#getflag) ( flagName: String, defaultValue: Variant = false ) const |
| bool | [hasFlag](#hasflag) ( flagName: String ) const |
| Object | [getAllFlags](#getallflags) ( ) const |
| void | [clearFlags](#clearflags) ( ) |
| Object | [loadFromJSON](#loadfromjson) ( json: String \| Object ) |
| String | [exportToJSON](#exporttojson) ( includeActiveState: bool = false ) const |
| void | [update](#update) ( ) |
| void | [enable](#enable) ( ) |
| void | [disable](#disable) ( ) |
| void | [clearAllEvents](#clearallevents) ( ) |
| void | [setEventDebugManager](#seteventdebugmanager) ( debugManager: EventDebugManager ) |
| EventManager | [getInstance](#getinstance) ( ) static |

## Enumerations

### EventType

Event type classification:

- **DIALOGUE** = `"dialogue"` – Story beats, character interactions
- **SPAWN** = `"spawn"` – Enemy waves, resource spawns
- **TUTORIAL** = `"tutorial"` – Player guidance, tips
- **BOSS** = `"boss"` – Boss fight triggers and phases

### TriggerType

Trigger activation conditions:

- **TIME** = `"time"` – Fires after delay (milliseconds)
- **FLAG** = `"flag"` – Fires when flag conditions met
- **SPATIAL** = `"spatial"` – Fires when entity enters radius
- **CONDITIONAL** = `"conditional"` – Fires when function returns true
- **VIEWPORT** = `"viewport"` – Fires when area visible in camera

## Property Descriptions

### Map **events**

Stores all registered events by their unique ID. Each event contains:
- `id`: Unique identifier
- `type`: Event type (dialogue, spawn, tutorial, boss)
- `priority`: Priority value (1-10, lower = higher priority)
- `content`: Type-specific event data
- `active`: Whether event is currently active
- `paused`: Whether event is paused by higher priority

**Note:** Direct access to the Map is not recommended. Use getEvent() or getAllEvents() instead.

### Map **triggers**

Stores all registered triggers by their auto-generated ID. Each trigger contains:
- `eventId`: ID of event to trigger
- `type`: Trigger type (time, flag, spatial, conditional, viewport)
- `condition`: Type-specific condition data
- `oneTime`: Whether trigger fires only once
- `triggered`: Whether trigger has fired

### Array **activeEvents**

Array of currently active events, maintained in trigger order. Higher priority events (lower priority numbers) appear first when sorted via getActiveEventsSorted().

### Object **flags**

Key-value store for event flags. Flags persist across game sessions and control trigger conditions. Common patterns:
- `event_{id}_completed`: Auto-set when event completes
- `tutorial_seen`: Manually set boolean flag
- `waves_completed`: Manually set counter

## Method Descriptions

### <span id="registerevent"></span>void **registerEvent** ( eventConfig: Object )

Registers a new event in the system. Events must be registered before they can be triggered.

```javascript
eventManager.registerEvent({
  id: 'intro-dialogue',
  type: 'dialogue',
  priority: 5,
  content: {
    speaker: 'Queen Ant',
    message: 'Welcome to the colony!'
  },
  onTrigger: (data) => {
    console.log('Dialogue started');
  },
  onComplete: () => {
    eventManager.setFlag('intro_seen', true);
  }
});
```

**Parameters:**
- `eventConfig.id` (String, **required**): Unique event identifier
- `eventConfig.type` (String, **required**): Event type ('dialogue', 'spawn', 'tutorial', 'boss')
- `eventConfig.content` (Object, **required**): Type-specific event data
- `eventConfig.priority` (int, optional): Priority 1-10 (default: 10)
- `eventConfig.onTrigger` (Function, optional): Callback when event triggers
- `eventConfig.onComplete` (Function, optional): Callback when event completes
- `eventConfig.onPause` (Function, optional): Callback when paused by higher priority
- `eventConfig.update` (Function, optional): Per-frame update while active

Returns `void`. If registration fails (duplicate ID, missing required fields), an error is logged to console.

---

### <span id="triggerevent"></span>bool **triggerEvent** ( eventId: String, customData: Object = null )

Triggers an event by ID, adding it to the active queue. The event's `onTrigger` callback is called immediately if defined.

```javascript
// Trigger with default data
eventManager.triggerEvent('intro-dialogue');

// Trigger with custom data
eventManager.triggerEvent('enemy-wave-1', {
  difficulty: 'hard',
  spawnCount: 20
});

// Check result
if (eventManager.triggerEvent('boss-fight-1')) {
  console.log('Boss fight started!');
}
```

Returns `true` if triggered successfully, `false` if event not found, already active, or EventManager disabled.

**Note:** Higher priority events automatically pause lower priority events until completed.

---

### <span id="completeevent"></span>bool **completeEvent** ( eventId: String )

Marks an event as complete, removing it from the active queue and auto-setting the `event_{id}_completed` flag. Paused events resume automatically if no higher priority events remain.

```javascript
// Complete active event
if (eventManager.completeEvent('intro-dialogue')) {
  console.log('Dialogue completed');
  // Auto-sets flag: event_intro-dialogue_completed = true
}

// Complete from button callback
function onDialogueButtonClick(action) {
  eventManager.completeEvent('intro-dialogue');
  if (action === 'start-tutorial') {
    eventManager.triggerEvent('tutorial-movement');
  }
}
```

Returns `true` if completed, `false` if event not active.

---

### <span id="getevent"></span>Object **getEvent** ( eventId: String ) const

Retrieves event configuration by ID.

```javascript
const event = eventManager.getEvent('intro-dialogue');
if (event) {
  console.log('Event type:', event.type);
  console.log('Priority:', event.priority);
  console.log('Is active:', event.active);
}
```

Returns event config Object or `undefined` if not found.

---

### <span id="getallevents"></span>Array **getAllEvents** ( ) const

Returns all registered events as an array.

```javascript
const allEvents = eventManager.getAllEvents();
console.log(`Total events: ${allEvents.length}`);

allEvents.forEach(event => {
  console.log(`${event.id}: ${event.type} (priority ${event.priority})`);
});
```

---

### <span id="geteventsbytype"></span>Array **getEventsByType** ( type: String ) const

Returns all events of a specific type.

```javascript
// Get all dialogue events
const dialogues = eventManager.getEventsByType('dialogue');

// Get all spawn events
const spawns = eventManager.getEventsByType('spawn');
spawns.forEach(spawn => {
  console.log(`Wave: ${spawn.id}, Count: ${spawn.content.count}`);
});
```

**Valid types:** `'dialogue'`, `'spawn'`, `'tutorial'`, `'boss'`

---

### <span id="iseventactive"></span>bool **isEventActive** ( eventId: String ) const

Checks if a specific event is currently active.

```javascript
if (eventManager.isEventActive('boss-fight-1')) {
  console.log('Boss fight in progress!');
  // Don't spawn regular enemies
}

// Check before triggering
if (!eventManager.isEventActive('intro-dialogue')) {
  eventManager.triggerEvent('intro-dialogue');
}
```

---

### <span id="getactiveevents"></span>Array **getActiveEvents** ( sortByPriority: bool = false ) const

Returns all currently active events. If `sortByPriority` is `true`, events are sorted by priority (1=highest first).

```javascript
// Get active events in trigger order
const active = eventManager.getActiveEvents();
console.log(`${active.length} events active`);

// Get active events sorted by priority
const sorted = eventManager.getActiveEvents(true);
sorted.forEach(event => {
  console.log(`${event.id} (priority ${event.priority})`);
});
```

---

### <span id="getactiveeventssorted"></span>Array **getActiveEventsSorted** ( ) const

Alias for getActiveEvents(true). Returns active events sorted by priority.

```javascript
const highest = eventManager.getActiveEventsSorted()[0];
if (highest) {
  console.log(`Highest priority: ${highest.id} (${highest.priority})`);
}
```

---

### <span id="registertrigger"></span>bool **registerTrigger** ( triggerConfig: Object )

Registers a trigger that automatically fires events when conditions are met.

**Time Trigger:**
```javascript
eventManager.registerTrigger({
  id: 'wave-timer',
  eventId: 'enemy-wave-1',
  type: 'time',
  oneTime: false,
  condition: { delay: 60000 } // 60 seconds
});
```

**Flag Trigger:**
```javascript
eventManager.registerTrigger({
  id: 'tutorial-complete-trigger',
  eventId: 'next-objective',
  type: 'flag',
  oneTime: true,
  condition: {
    flagName: 'tutorial_completed',
    value: true
  }
});
```

**Conditional Trigger:**
```javascript
eventManager.registerTrigger({
  id: 'low-resources-trigger',
  eventId: 'resource-warning',
  type: 'conditional',
  oneTime: false,
  condition: {
    check: () => window.resourceManager.getFoodCount() < 10
  }
});
```

**Parameters:**
- `triggerConfig.eventId` (String, **required**): Event to trigger
- `triggerConfig.type` (String, **required**): Trigger type
- `triggerConfig.oneTime` (bool, optional): Fire only once (default: true)
- `triggerConfig.condition` (Object, **required**): Type-specific condition data

Returns `true` if registered successfully.

---

### <span id="setflag"></span>void **setFlag** ( flagName: String, value: Variant )

Sets a flag value. Flags are used for event conditions and state tracking.

```javascript
// Set boolean flags
eventManager.setFlag('tutorial_completed', true);
eventManager.setFlag('boss_defeated', true);

// Set numeric flags
eventManager.setFlag('waves_completed', 5);

// Set string flags
eventManager.setFlag('current_objective', 'gather-food');
```

**Note:** Completing an event via completeEvent() auto-sets `event_{id}_completed = true`.

---

### <span id="getflag"></span>Variant **getFlag** ( flagName: String, defaultValue: Variant = false ) const

Gets a flag value with optional default.

```javascript
// Get with default
const tutorialDone = eventManager.getFlag('tutorial_completed', false);

// Check event completion flags
if (eventManager.getFlag('event_intro-dialogue_completed')) {
  console.log('Player has seen intro');
}

// Get numeric flags
const wavesCompleted = eventManager.getFlag('waves_completed', 0);
```

---

### <span id="hasflag"></span>bool **hasFlag** ( flagName: String ) const

Checks if a flag exists (has been set), regardless of value.

```javascript
if (eventManager.hasFlag('tutorial_completed')) {
  console.log('Tutorial flag exists');
  const value = eventManager.getFlag('tutorial_completed');
  console.log(`Value: ${value}`);
}
```

---

### <span id="getallflags"></span>Object **getAllFlags** ( ) const

Returns all flags as an object.

```javascript
const allFlags = eventManager.getAllFlags();
console.log('Current flags:', allFlags);
// Output: { tutorial_completed: true, event_intro-dialogue_completed: true, ... }
```

---

### <span id="clearflags"></span>void **clearFlags** ( )

Clears all flags. Use with caution.

```javascript
// Reset all event state
eventManager.clearFlags();
console.log('All flags cleared');
```

---

### <span id="loadfromjson"></span>Object **loadFromJSON** ( json: String | Object )

Loads events and triggers from JSON string or object. Returns result object with success status and counts.

```javascript
// From JSON string
const jsonString = `{
  "events": [
    {
      "id": "intro-dialogue",
      "type": "dialogue",
      "priority": 5,
      "content": {
        "speaker": "Queen",
        "message": "Welcome!"
      }
    }
  ],
  "triggers": [
    {
      "id": "intro-trigger",
      "eventId": "intro-dialogue",
      "type": "time",
      "oneTime": true,
      "condition": { "delay": 5000 }
    }
  ]
}`;

const result = eventManager.loadFromJSON(jsonString);
if (result.success) {
  console.log(`Loaded ${result.eventsLoaded} events, ${result.triggersLoaded} triggers`);
}

// From parsed object
const config = JSON.parse(jsonString);
eventManager.loadFromJSON(config);

// Load from file (async)
async function loadEventsFromFile() {
  const response = await fetch('events/level1.json');
  const json = await response.text();
  eventManager.loadFromJSON(json);
}
```

**Returns:** Object with properties:
- `success` (bool): Overall success
- `eventsLoaded` (int): Number of events loaded
- `triggersLoaded` (int): Number of triggers loaded
- `errors` (Array): Error messages if any

---

### <span id="exporttojson"></span>String **exportToJSON** ( includeActiveState: bool = false ) const

Exports all events and triggers to JSON string. Functions are removed during export (not serializable).

```javascript
// Export without active state (for templates)
const json = eventManager.exportToJSON();

// Export with active state (for save games)
const jsonWithState = eventManager.exportToJSON(true);

// Download as file
function downloadEvents() {
  const json = eventManager.exportToJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'events.json';
  a.click();
}
```

**Output format:**
```json
{
  "events": [
    {
      "id": "intro-dialogue",
      "type": "dialogue",
      "priority": 5,
      "content": { "speaker": "Queen", "message": "Welcome!" }
    }
  ],
  "triggers": [
    {
      "id": "intro-trigger",
      "eventId": "intro-dialogue",
      "type": "time",
      "oneTime": true,
      "condition": { "delay": 5000 }
    }
  ],
  "exportedAt": "2025-10-26T10:30:00.000Z"
}
```

---

### <span id="update"></span>void **update** ( )

Main update loop - evaluates triggers and updates active events. Called automatically each frame from `draw()` in `sketch.js`.

```javascript
// Already handled in sketch.js draw():
function draw() {
  // ... other updates ...
  if (window.eventManager) {
    eventManager.update();
  }
}
```

**Note:** You don't need to call this manually - it's integrated into the game loop.

---

### <span id="enable"></span>void **enable** ( )

Enables the event system (resumes event processing).

```javascript
eventManager.enable();
```

---

### <span id="disable"></span>void **disable** ( )

Disables the event system (pauses all event processing).

```javascript
// Disable events during cutscene
eventManager.disable();
playCutscene();

// Re-enable after cutscene
function onCutsceneEnd() {
  eventManager.enable();
}
```

---

### <span id="clearallevents"></span>void **clearAllEvents** ( )

Removes all registered events (does not clear active events or flags).

```javascript
// Typically used when loading new level
function loadNewLevel() {
  eventManager.clearAllEvents();
  eventManager.clearFlags();
  eventManager.loadFromJSON(levelData);
}
```

---

### <span id="seteventdebugmanager"></span>void **setEventDebugManager** ( debugManager: EventDebugManager )

Connects EventDebugManager for development tools.

```javascript
// Already handled in sketch.js setup():
if (window.eventDebugManager && window.eventManager) {
  eventManager.setEventDebugManager(window.eventDebugManager);
  console.log('Debug manager connected');
}
```

---

### <span id="getinstance"></span>EventManager **getInstance** ( ) static

Returns the singleton instance of EventManager.

```javascript
const eventManager = EventManager.getInstance();
```

## Event Priority Best Practices

**Priority 1-2**: Critical events (boss intro, game-over, urgent tutorials)  
**Priority 3-5**: Important events (enemy waves, story dialogue)  
**Priority 6-8**: Normal events (tips, hints)  
**Priority 9-10**: Low priority (ambient dialogue, flavor text)

Higher priority events (lower numbers) automatically pause lower priority events.

**Note:** Events with the same priority do NOT pause each other.

## Common Workflows

### Create and Trigger Event

```javascript
// 1. Register event
eventManager.registerEvent({
  id: 'welcome-message',
  type: 'dialogue',
  priority: 5,
  content: { speaker: 'Guide', message: 'Welcome!' }
});

// 2. Trigger immediately
eventManager.triggerEvent('welcome-message');

// 3. Complete when done
eventManager.completeEvent('welcome-message');
```

### Time-Based Event

```javascript
// Register event
eventManager.registerEvent({
  id: 'first-wave',
  type: 'spawn',
  priority: 3,
  content: { entityType: 'Warrior', count: 5, faction: 'enemy' }
});

// Register trigger (auto-fires after 30 seconds)
eventManager.registerTrigger({
  id: 'first-wave-timer',
  eventId: 'first-wave',
  type: 'time',
  oneTime: true,
  condition: { delay: 30000 }
});
```

### Conditional Event Chain

```javascript
// Event 1: Tutorial
eventManager.registerEvent({
  id: 'tutorial-basics',
  type: 'tutorial',
  priority: 1,
  content: { title: 'Basics' },
  onComplete: () => {
    eventManager.setFlag('tutorial_basics_done', true);
  }
});

// Event 2: Next step (triggered by flag)
eventManager.registerEvent({
  id: 'tutorial-combat',
  type: 'tutorial',
  priority: 1,
  content: { title: 'Combat' }
});

eventManager.registerTrigger({
  id: 'combat-tutorial-trigger',
  eventId: 'tutorial-combat',
  type: 'flag',
  oneTime: true,
  condition: { flagName: 'tutorial_basics_done', value: true }
});
```

### Save/Load Events

```javascript
// Save to localStorage
function saveEvents() {
  const json = eventManager.exportToJSON(true); // Include active state
  localStorage.setItem('eventData', json);
}

// Load from localStorage
function loadEvents() {
  const json = localStorage.getItem('eventData');
  if (json) {
    eventManager.loadFromJSON(json);
  }
}
```

## Notes

- Completing an event auto-sets `event_{id}_completed` flag
- Triggers are evaluated each frame in update()
- Functions (onTrigger, onComplete, etc.) are removed during export
- EventManager is automatically initialized in `sketch.js`

---

**Last Updated**: October 28, 2025  
**Related Docs**:
- [Random Events Roadmap](../roadmaps/RANDOM_EVENTS_ROADMAP.md)
- [EventManager Integration Guide](../guides/EventManager_Integration.md)
