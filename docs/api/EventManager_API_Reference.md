# EventManager API Reference

**Version**: 1.0.0  
**File**: `Classes/managers/EventManager.js`  
**Pattern**: Singleton  
**Global Access**: `window.eventManager`

---

## Table of Contents
1. [Overview](#overview)
2. [Singleton Access](#singleton-access)
3. [Event Management](#event-management)
4. [Trigger Management](#trigger-management)
5. [Flag System](#flag-system)
6. [Import/Export](#importexport)
7. [System Control](#system-control)
8. [Debug Integration](#debug-integration)
9. [Complete Method Reference](#complete-method-reference)

---

## Overview

The **EventManager** is a singleton class that coordinates all random events in the game, including:
- **Dialogue Events**: Story beats, character interactions
- **Spawn Events**: Enemy waves, resource spawns
- **Tutorial Events**: Player guidance, tips
- **Boss Events**: Boss fight triggers and phases

### Key Features
- ✅ Event registration and triggering
- ✅ Priority-based event queuing
- ✅ Flag-based conditions (event_completed flags)
- ✅ Trigger system (time, spatial, conditional)
- ✅ JSON import/export for level design
- ✅ Debug integration for development

---

## Singleton Access

### Get Instance
```javascript
const eventManager = EventManager.getInstance();
```

**Global Access** (after initialization in `sketch.js`):
```javascript
window.eventManager.registerEvent({ ... });
```

**Initialization** (already done in `sketch.js` setup):
```javascript
// In setup()
window.eventManager = EventManager.getInstance();
```

---

## Event Management

### registerEvent(eventConfig)

Register a new event in the system.

**Parameters:**
- `eventConfig` (Object) - Event configuration object
  - `id` (string, **required**) - Unique event identifier
  - `type` (string, **required**) - Event type: `'dialogue'`, `'spawn'`, `'tutorial'`, `'boss'`
  - `content` (Object, **required**) - Type-specific event data
  - `priority` (number, optional) - Priority 1-10 (1=highest, default=10)
  - `onTrigger` (Function, optional) - Callback when event triggers
  - `onComplete` (Function, optional) - Callback when event completes
  - `onPause` (Function, optional) - Callback when paused by higher priority
  - `update` (Function, optional) - Called each frame while event is active

**Returns:** `boolean` - `true` if registered successfully, `false` if failed

**Example - Dialogue Event:**
```javascript
eventManager.registerEvent({
  id: 'intro-dialogue',
  type: 'dialogue',
  priority: 5,
  content: {
    speaker: 'Queen Ant',
    message: 'Welcome to the colony! We need your help.',
    buttons: [
      { text: 'Accept', action: 'start-tutorial' },
      { text: 'Decline', action: 'skip-tutorial' }
    ]
  },
  onTrigger: (data) => {
    console.log('Dialogue started:', data);
  },
  onComplete: () => {
    console.log('Dialogue completed');
    eventManager.setFlag('intro_seen', true);
  }
});
```

**Example - Spawn Event:**
```javascript
eventManager.registerEvent({
  id: 'enemy-wave-1',
  type: 'spawn',
  priority: 3,
  content: {
    entityType: 'Warrior',
    count: 10,
    faction: 'enemy',
    spawnPattern: 'viewport-edge'
  },
  onTrigger: () => {
    console.log('Enemy wave spawning!');
  }
});
```

**Example - Tutorial Event:**
```javascript
eventManager.registerEvent({
  id: 'tutorial-movement',
  type: 'tutorial',
  priority: 1,
  content: {
    title: 'Movement Controls',
    steps: [
      'Click to select ants',
      'Right-click to move selected ants',
      'Use WASD to pan the camera'
    ],
    highlightElement: 'ant-selection'
  }
});
```

---

### triggerEvent(eventId, customData)

Trigger an event by its ID. The event will be added to the active queue and processed according to priority.

**Parameters:**
- `eventId` (string, **required**) - ID of event to trigger
- `customData` (Object, optional) - Custom data to pass to event callbacks

**Returns:** `boolean` - `true` if triggered, `false` if failed (not found, already active, or disabled)

**Example:**
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
} else {
  console.log('Failed to start boss fight (already active or not found)');
}
```

---

### completeEvent(eventId)

Mark an event as complete, removing it from the active queue and auto-setting the `event_{id}_completed` flag.

**Parameters:**
- `eventId` (string, **required**) - ID of event to complete

**Returns:** `boolean` - `true` if completed, `false` if not active

**Example:**
```javascript
// Complete an active event
if (eventManager.completeEvent('intro-dialogue')) {
  console.log('Dialogue completed successfully');
  // Auto-sets flag: event_intro-dialogue_completed = true
}

// Complete event from button callback
function onDialogueButtonClick(action) {
  eventManager.completeEvent('intro-dialogue');
  if (action === 'start-tutorial') {
    eventManager.triggerEvent('tutorial-movement');
  }
}
```

---

### getEvent(eventId)

Retrieve event configuration by ID.

**Parameters:**
- `eventId` (string, **required**) - Event ID

**Returns:** `Object | undefined` - Event config or `undefined` if not found

**Example:**
```javascript
const event = eventManager.getEvent('intro-dialogue');
if (event) {
  console.log('Event type:', event.type);
  console.log('Priority:', event.priority);
  console.log('Is active:', event.active);
}
```

---

### getAllEvents()

Get all registered events.

**Returns:** `Array<Object>` - Array of all event configs

**Example:**
```javascript
const allEvents = eventManager.getAllEvents();
console.log(`Total events: ${allEvents.length}`);

allEvents.forEach(event => {
  console.log(`${event.id}: ${event.type} (priority ${event.priority})`);
});
```

---

### getEventsByType(type)

Get all events of a specific type.

**Parameters:**
- `type` (string, **required**) - Event type: `'dialogue'`, `'spawn'`, `'tutorial'`, `'boss'`

**Returns:** `Array<Object>` - Array of matching events

**Example:**
```javascript
// Get all dialogue events
const dialogues = eventManager.getEventsByType('dialogue');
console.log(`Found ${dialogues.length} dialogue events`);

// Get all spawn events
const spawns = eventManager.getEventsByType('spawn');
spawns.forEach(spawn => {
  console.log(`Wave: ${spawn.id}, Count: ${spawn.content.count}`);
});
```

---

### isEventActive(eventId)

Check if a specific event is currently active.

**Parameters:**
- `eventId` (string, **required**) - Event ID to check

**Returns:** `boolean` - `true` if event is in active queue

**Example:**
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

### getActiveEvents(sortByPriority)

Get all currently active events.

**Parameters:**
- `sortByPriority` (boolean, optional) - If `true`, sort by priority (1=highest first). Default: `false`

**Returns:** `Array<Object>` - Array of active events

**Example:**
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

### getActiveEventsSorted()

Alias for `getActiveEvents(true)` - returns active events sorted by priority.

**Returns:** `Array<Object>` - Active events sorted by priority (1=highest)

**Example:**
```javascript
const highest = eventManager.getActiveEventsSorted()[0];
if (highest) {
  console.log(`Highest priority event: ${highest.id} (${highest.priority})`);
}
```

---

## Trigger Management

### registerTrigger(triggerConfig)

Register a trigger that will automatically fire events when conditions are met.

**Parameters:**
- `triggerConfig` (Object) - Trigger configuration
  - `id` (string, **required**) - Unique trigger identifier
  - `eventId` (string, **required**) - Event to trigger
  - `type` (string, **required**) - Trigger type: `'time'`, `'flag'`, `'spatial'`, `'conditional'`, `'viewport'`
  - `oneTime` (boolean, optional) - Fire only once. Default: `true`
  - `condition` (Object, **required**) - Type-specific condition data

**Returns:** `boolean` - `true` if registered successfully

**Trigger Types:**

#### Time Trigger
Fires after a specified amount of time (in milliseconds).
```javascript
eventManager.registerTrigger({
  id: 'wave-timer',
  eventId: 'enemy-wave-1',
  type: 'time',
  oneTime: false, // Repeat
  condition: {
    delay: 60000 // 60 seconds
  }
});
```

#### Flag Trigger
Fires when a specific flag becomes true.
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

#### Spatial Trigger
Fires when player enters a radius around a point.
```javascript
eventManager.registerTrigger({
  id: 'boss-arena-trigger',
  eventId: 'boss-fight-1',
  type: 'spatial',
  oneTime: true,
  condition: {
    x: 500,
    y: 500,
    radius: 100,
    entityType: 'player' // Optional: specific entity type
  }
});
```

#### Conditional Trigger
Fires when a custom condition function returns true.
```javascript
eventManager.registerTrigger({
  id: 'low-resources-trigger',
  eventId: 'resource-warning',
  type: 'conditional',
  oneTime: false,
  condition: {
    check: () => {
      return window.resourceManager && window.resourceManager.getFoodCount() < 10;
    }
  }
});
```

#### Viewport Trigger
Fires when specific area enters viewport.
```javascript
eventManager.registerTrigger({
  id: 'explore-north-trigger',
  eventId: 'northern-dialogue',
  type: 'viewport',
  oneTime: true,
  condition: {
    x: 1000,
    y: 0,
    width: 200,
    height: 200
  }
});
```

---

### evaluateTriggers()

Manually evaluate all registered triggers (called automatically in `update()`).

**Returns:** `void`

**Note:** You typically don't need to call this manually - the EventManager's `update()` method calls it each frame.

---

## Flag System

### setFlag(flagName, value)

Set a flag value. Flags are used for event conditions and state tracking.

**Parameters:**
- `flagName` (string, **required**) - Flag identifier
- `value` (any, **required**) - Value to set (typically boolean)

**Returns:** `void`

**Example:**
```javascript
// Set boolean flags
eventManager.setFlag('tutorial_completed', true);
eventManager.setFlag('boss_defeated', true);

// Set numeric flags
eventManager.setFlag('waves_completed', 5);

// Set string flags
eventManager.setFlag('current_objective', 'gather-food');

// Auto-set flags (triggered by completeEvent)
// eventManager.completeEvent('intro-dialogue') auto-sets:
// flag: event_intro-dialogue_completed = true
```

---

### getFlag(flagName, defaultValue)

Get a flag value with optional default.

**Parameters:**
- `flagName` (string, **required**) - Flag identifier
- `defaultValue` (any, optional) - Value to return if flag not set. Default: `false`

**Returns:** `any` - Flag value or default

**Example:**
```javascript
// Get with default
const tutorialDone = eventManager.getFlag('tutorial_completed', false);

// Check event completion flags
if (eventManager.getFlag('event_intro-dialogue_completed')) {
  console.log('Player has seen intro');
}

// Get numeric flags
const wavesCompleted = eventManager.getFlag('waves_completed', 0);
console.log(`Waves completed: ${wavesCompleted}`);
```

---

### hasFlag(flagName)

Check if a flag exists (has been set).

**Parameters:**
- `flagName` (string, **required**) - Flag identifier

**Returns:** `boolean` - `true` if flag has been set (regardless of value)

**Example:**
```javascript
if (eventManager.hasFlag('tutorial_completed')) {
  console.log('Tutorial flag exists');
  const value = eventManager.getFlag('tutorial_completed');
  console.log(`Value: ${value}`);
} else {
  console.log('Tutorial flag not set yet');
}
```

---

### getAllFlags()

Get all flags as an object.

**Returns:** `Object` - All flags

**Example:**
```javascript
const allFlags = eventManager.getAllFlags();
console.log('Current flags:', allFlags);
// Output: { tutorial_completed: true, event_intro-dialogue_completed: true, ... }
```

---

### clearFlags()

Clear all flags (use with caution).

**Returns:** `void`

**Example:**
```javascript
// Reset all event state
eventManager.clearFlags();
console.log('All flags cleared');
```

---

## Import/Export

### loadFromJSON(json)

Load events and triggers from JSON string or object.

**Parameters:**
- `json` (string | Object, **required**) - JSON string or parsed object

**Returns:** `Object` - Result with success status and counts
  - `success` (boolean) - Overall success
  - `eventsLoaded` (number) - Number of events loaded
  - `triggersLoaded` (number) - Number of triggers loaded
  - `errors` (Array<string>) - Error messages if any

**Example:**
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
} else {
  console.error('Load errors:', result.errors);
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

---

### exportToJSON(includeActiveState)

Export all events and triggers to JSON string.

**Parameters:**
- `includeActiveState` (boolean, optional) - Include active/paused state. Default: `false`

**Returns:** `string` - JSON string with events and triggers

**Features:**
- ✅ Removes non-serializable functions (`onTrigger`, `onComplete`, etc.)
- ✅ Removes internal state (`_startTime`, `_lastCheckTime`)
- ✅ Includes ISO timestamp
- ✅ Pretty-printed (2-space indentation)

**Example:**
```javascript
// Export without active state (for saving templates)
const json = eventManager.exportToJSON();
console.log(json);

// Export with active state (for save games)
const jsonWithState = eventManager.exportToJSON(true);

// Download as file (browser)
function downloadEvents() {
  const json = eventManager.exportToJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'events.json';
  a.click();
}

// Copy to clipboard
async function copyEventsToClipboard() {
  const json = eventManager.exportToJSON();
  await navigator.clipboard.writeText(json);
  console.log('Events copied to clipboard');
}
```

**Output Format:**
```json
{
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
      "condition": {
        "delay": 5000
      }
    }
  ],
  "exportedAt": "2025-10-26T10:30:00.000Z"
}
```

---

## System Control

### update()

Main update loop - evaluates triggers and updates active events. Called automatically each frame from `draw()` in `sketch.js`.

**Returns:** `void`

**Note:** You don't need to call this manually - it's already integrated into the game loop.

```javascript
// Already handled in sketch.js draw():
function draw() {
  // ... other updates ...
  if (window.eventManager) {
    eventManager.update();
  }
}
```

---

### enable() / disable()

Enable or disable the event system (pauses all event processing).

**Returns:** `void`

**Example:**
```javascript
// Disable events during cutscene
eventManager.disable();
playCutscene();

// Re-enable after cutscene
function onCutsceneEnd() {
  eventManager.enable();
}

// Check if enabled
const isEnabled = eventManager._enabled;
```

---

### clearAllEvents()

Remove all registered events (does not clear active events).

**Returns:** `void`

**Example:**
```javascript
// Clear all registered events
eventManager.clearAllEvents();
console.log('All events cleared');

// Typically used when loading new level
function loadNewLevel() {
  eventManager.clearAllEvents();
  eventManager.clearFlags();
  eventManager.loadFromJSON(levelData);
}
```

---

## Debug Integration

### setEventDebugManager(debugManager)

Connect EventDebugManager for development tools.

**Parameters:**
- `debugManager` (EventDebugManager) - Debug manager instance

**Returns:** `void`

**Example:**
```javascript
// Already handled in sketch.js setup():
if (window.eventDebugManager && window.eventManager) {
  eventManager.setEventDebugManager(window.eventDebugManager);
  console.log('Debug manager connected');
}
```

---

## Complete Method Reference

### Event Management
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `registerEvent` | `eventConfig: Object` | `boolean` | Register new event |
| `triggerEvent` | `eventId: string, customData?: Object` | `boolean` | Trigger event by ID |
| `completeEvent` | `eventId: string` | `boolean` | Complete active event |
| `getEvent` | `eventId: string` | `Object \| undefined` | Get event by ID |
| `getAllEvents` | - | `Array<Object>` | Get all events |
| `getEventsByType` | `type: string` | `Array<Object>` | Get events by type |
| `isEventActive` | `eventId: string` | `boolean` | Check if event active |
| `getActiveEvents` | `sortByPriority?: boolean` | `Array<Object>` | Get active events |
| `getActiveEventsSorted` | - | `Array<Object>` | Get active events sorted |

### Trigger Management
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `registerTrigger` | `triggerConfig: Object` | `boolean` | Register new trigger |
| `evaluateTriggers` | - | `void` | Evaluate all triggers |

### Flag System
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `setFlag` | `flagName: string, value: any` | `void` | Set flag value |
| `getFlag` | `flagName: string, defaultValue?: any` | `any` | Get flag value |
| `hasFlag` | `flagName: string` | `boolean` | Check if flag exists |
| `getAllFlags` | - | `Object` | Get all flags |
| `clearFlags` | - | `void` | Clear all flags |

### Import/Export
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `loadFromJSON` | `json: string \| Object` | `Object` | Load from JSON |
| `exportToJSON` | `includeActiveState?: boolean` | `string` | Export to JSON |

### System Control
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `update` | - | `void` | Main update loop |
| `enable` | - | `void` | Enable event system |
| `disable` | - | `void` | Disable event system |
| `clearAllEvents` | - | `void` | Remove all events |

### Debug Integration
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `setEventDebugManager` | `debugManager: EventDebugManager` | `void` | Connect debug tools |

---

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

---

## Event Priority Best Practices

**Priority 1-2**: Critical events (boss intro, game-over, urgent tutorials)  
**Priority 3-5**: Important events (enemy waves, story dialogue)  
**Priority 6-8**: Normal events (tips, hints)  
**Priority 9-10**: Low priority (ambient dialogue, flavor text)

Higher priority events (lower numbers) will pause lower priority events that are already active.

---

## Notes

- Events with the same priority do NOT pause each other
- Completing an event auto-sets `event_{id}_completed` flag
- Triggers are evaluated each frame in `update()`
- Functions (`onTrigger`, `onComplete`, etc.) are removed during export
- EventManager is automatically initialized in `sketch.js`

---

**Last Updated**: October 26, 2025  
**Related Docs**:
- [Event Types Guide](Event_Types_Guide.md)
- [Trigger Types Guide](Trigger_Types_Guide.md)
- [Integration Guide](Integration_Guide.md)
