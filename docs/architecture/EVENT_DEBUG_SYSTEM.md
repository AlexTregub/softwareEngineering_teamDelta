# Event Debug System Architecture

## Overview

The Event Debug System provides a comprehensive developer toolset for viewing, controlling, and testing the Random Events System during development and debugging.

## Core Components

### EventDebugManager Class

**Location**: `debug/EventDebugManager.js`

**Responsibilities**:
1. Visual overlay for event flags (color-coded by type)
2. Level-specific event information display
3. Triggered event history tracking
4. Manual event triggering (bypass restrictions)
5. Global event list with trigger commands
6. Command-line integration

**Global Access**: `window.eventDebugManager` (singleton)

---

## 6 Core Debug Features

### 1. Show Events Linked to Current Level

**Purpose**: Display all events tied to the active map/level with their trigger conditions

**Implementation**:
```javascript
// Get events for current level
eventDebugManager.getEventsForLevel(mapManager.getActiveMapId());

// Get triggers for those events
eventDebugManager.getTriggersForLevel(levelId);
```

**UI Panel**: Draggable "Level Events" panel showing:
- Event ID
- Event type (dialogue/spawn/tutorial/boss)
- Priority
- Trigger type (spatial/time/flag/conditional/viewport)
- Trigger condition summary
- Status (✓ triggered, ⏸ paused, ▶ active, ☐ ready)

**Toggle**: `eventDebugManager.toggleLevelInfo()`

---

### 2. Show Triggered Events History

**Purpose**: Track which events have been triggered for each level (one-time events marked)

**Implementation**:
```javascript
// Track when event triggers
eventDebugManager.onEventTriggered(eventId, levelId);

// Check if event was triggered
eventDebugManager.hasEventBeenTriggered(eventId, levelId);

// Get all triggered for level
eventDebugManager.getTriggeredEvents(levelId);
```

**Data Structure**:
```javascript
{
  triggeredEventsPerLevel: {
    'level_1': ['event_1', 'event_3', 'event_5'],
    'level_2': ['event_2'],
    'boss_level': []
  }
}
```

**Display**: Events marked with ✓ in Level Events panel, greyed out if one-time

---

### 3. Toggle Event Flag Visibility (Color-Coded)

**Purpose**: Visual overlay showing spatial event triggers in-game and level editor

**Implementation**:
```javascript
// Toggle visibility
eventDebugManager.toggleEventFlags();

// Render flags
eventDebugManager.renderEventFlags();

// Color coding
const color = eventDebugManager.getEventTypeColor(eventType);
```

**Color Scheme**:
- **Dialogue**: Blue (rgba(100, 150, 255, 0.6))
- **Spawn**: Red (rgba(255, 100, 100, 0.6))
- **Tutorial**: Green (rgba(100, 255, 150, 0.6))
- **Boss**: Purple (rgba(200, 100, 255, 0.6))
- **Unknown**: Grey (rgba(150, 150, 150, 0.6))

**Greyed Out**: Triggered one-time events rendered with alpha=0.3

**Visual Elements**:
- Circle at flag position (radius from trigger)
- Event ID label
- Trigger type icon
- Greyed if triggered + oneTime

**Integration**: Works with existing `EventFlagLayer` in level editor

---

### 4. Command to Toggle Visibility

**Purpose**: Console commands for quick debug control

**Available Commands**:

```javascript
// Toggle event flag overlay
> showEventFlags

// Toggle level info panel
> showLevelInfo

// Toggle global event list
> showEventList

// List all events
> listEvents

// Enable/disable entire debug system
> eventDebug on
> eventDebug off
```

**Command Integration**: Extends `debug/commandLine.js` with `handleEventDebugCommand()`

**Example Usage**:
```javascript
// In commandLine.js
function handleCommand(command) {
  const args = command.split(' ');
  
  if (args[0] === 'eventDebug') {
    handleEventDebugCommand(args);
    return;
  }
  
  // ... existing commands
}

function handleEventDebugCommand(args) {
  if (!window.eventDebugManager) return;
  
  const subCommand = args[1];
  
  switch(subCommand) {
    case 'on':
      eventDebugManager.enable();
      console.log('Event debug enabled');
      break;
    case 'off':
      eventDebugManager.disable();
      console.log('Event debug disabled');
      break;
    // ... other commands
  }
}
```

---

### 5. Manual Event Triggering (Bypass Restrictions)

**Purpose**: Test events without meeting normal trigger conditions (level, flags, etc.)

**Implementation**:
```javascript
// Trigger any event regardless of current level
eventDebugManager.manualTriggerEvent(eventId);

// With custom data
eventDebugManager.manualTriggerEvent(eventId, { testMode: true });
```

**Bypass Logic**:
- Ignores `levelId` requirement (can trigger level_2 events from level_1)
- Bypasses flag requirements
- Ignores oneTime restrictions (can re-trigger)
- Still respects priority queue
- Tracks as triggered for history

**Console Command**:
```javascript
> triggerEvent dialogue_intro
> triggerEvent wave_5_spawn
```

**Use Cases**:
- Testing dialogue flow without walking to trigger zone
- Testing wave spawns without waiting for timer
- Re-testing one-time events
- QA testing event completion logic

---

### 6. Full Event List with Invoke Commands

**Purpose**: Draggable panel showing all events in game with copy-paste trigger commands

**Implementation**:
```javascript
// Get all events with commands
const eventCommands = eventDebugManager.getAllEventCommands();

// Returns:
[
  {
    id: 'event_1',
    type: 'dialogue',
    priority: 1,
    levelId: 'level_1',
    command: 'triggerEvent event_1'
  },
  // ...
]
```

**UI Panel**: Draggable "All Events" panel showing:
- Event ID (clickable to copy command)
- Type + Priority
- Level ID
- Trigger command
- One-time status
- Triggered status (all levels)

**Panel Actions**:
- Click event ID → Copy `triggerEvent <id>` to clipboard
- Click "Trigger" button → Immediate execution
- Filter by type/level
- Search by ID

**Panel Implementation**:
```javascript
class EventListPanel {
  constructor() {
    this.x = 10;
    this.y = 100;
    this.width = 400;
    this.height = 600;
  }
  
  render() {
    if (!eventDebugManager.showEventList) return;
    
    // Panel background
    fill(0, 0, 0, 200);
    rect(this.x, this.y, this.width, this.height);
    
    // Header
    fill(255);
    text('All Events (Click to Trigger)', this.x + 10, this.y + 20);
    
    // Event list
    const events = eventDebugManager.getAllEventCommands();
    let yOffset = 50;
    
    events.forEach(event => {
      const isTriggered = eventDebugManager.hasEventBeenTriggered(event.id, 'any');
      
      fill(isTriggered ? [100, 100, 100] : [255, 255, 255]);
      text(`${event.id} (${event.type})`, this.x + 10, this.y + yOffset);
      text(event.command, this.x + 10, this.y + yOffset + 15);
      
      yOffset += 40;
    });
  }
  
  handleClick(mouseX, mouseY) {
    // Check if click is inside panel
    // Determine which event was clicked
    // Execute eventDebugManager.manualTriggerEvent(eventId)
  }
}
```

---

## Rendering Pipeline Integration

### Layer Assignment

**Event flag overlays**: `RenderManager.layers.UI_DEBUG`

**Debug panels**: `RenderManager.layers.UI_DEBUG`

**Visibility States**:
- `PLAYING`: Show if debug enabled
- `PAUSED`: Show if debug enabled
- `LEVEL_EDITOR`: Show event flags automatically
- `MENU`: Hidden

### Render Order

```javascript
// In sketch.js draw() loop
if (eventDebugManager && eventDebugManager.enabled) {
  eventDebugManager.renderEventFlags();
  eventDebugManager.renderLevelInfo();
  eventDebugManager.renderEventList();
}
```

**Or via RenderLayerManager**:

```javascript
// In initialization
RenderManager.addDrawableToLayer(RenderManager.layers.UI_DEBUG, () => {
  if (eventDebugManager && eventDebugManager.enabled) {
    eventDebugManager.renderEventFlags();
    eventDebugManager.renderLevelInfo();
    eventDebugManager.renderEventList();
  }
});
```

---

## Integration Points

### 1. MapManager Integration

**Required**:
```javascript
// Get current level
const levelId = mapManager.getActiveMapId();

// Get all levels
const allLevels = mapManager.getAllMapIds();
```

**Event Filtering**:
```javascript
getEventsForLevel(levelId) {
  return eventManager.getAllEvents()
    .filter(event => event.levelId === levelId);
}
```

### 2. EventManager Integration

**Hook into event triggering**:
```javascript
// In EventManager.triggerEvent()
triggerEvent(eventId, data = {}) {
  // ... existing logic
  
  // Notify debug manager
  if (window.eventDebugManager) {
    const levelId = window.mapManager?.getActiveMapId() || 'unknown';
    window.eventDebugManager.onEventTriggered(eventId, levelId);
  }
  
  // ... continue
}
```

**Debug bypass**:
```javascript
// In EventDebugManager.manualTriggerEvent()
manualTriggerEvent(eventId, data = {}) {
  const event = eventManager.getEvent(eventId);
  if (!event) {
    console.error(`Event ${eventId} not found`);
    return false;
  }
  
  // Bypass all restrictions by directly calling trigger
  eventManager.triggerEvent(eventId, { ...data, debugTriggered: true });
  
  return true;
}
```

### 3. Level Editor Integration

**EventFlagLayer Access**:
```javascript
getEventFlagsInEditor() {
  if (!window.levelEditor?.eventLayer) {
    return [];
  }
  
  return window.levelEditor.eventLayer.flags;
}
```

**Render Integration**:
```javascript
// In EventFlagLayer.render()
render() {
  // Normal rendering
  this.flags.forEach(flag => this.renderFlag(flag));
  
  // Debug rendering
  if (eventDebugManager?.showEventFlags) {
    this.flags.forEach(flag => {
      const color = eventDebugManager.getEventTypeColor(flag.eventType);
      const shouldGrey = eventDebugManager.shouldGreyOutEvent(flag.eventId, this.levelId);
      
      this.renderDebugFlag(flag, color, shouldGrey);
    });
  }
}
```

### 4. Command Line Integration

**Extend commandLine.js**:
```javascript
// Add to handleCommand()
if (command.startsWith('eventDebug')) {
  handleEventDebugCommand(command.split(' '));
  return;
}

if (command.startsWith('triggerEvent')) {
  const eventId = command.split(' ')[1];
  if (eventDebugManager) {
    eventDebugManager.manualTriggerEvent(eventId);
  }
  return;
}

if (command === 'showEventFlags') {
  eventDebugManager?.toggleEventFlags();
  return;
}

if (command === 'showEventList') {
  eventDebugManager?.toggleEventList();
  return;
}

if (command === 'showLevelInfo') {
  eventDebugManager?.toggleLevelInfo();
  return;
}

if (command === 'listEvents') {
  const events = eventDebugManager?.getAllEventCommands();
  events?.forEach(e => {
    console.log(`${e.id} (${e.type}) - ${e.command}`);
  });
  return;
}
```

---

## File Structure

```
debug/
  EventDebugManager.js         - Main debug manager class
  eventDebugCommands.js        - Command definitions
  EventListPanel.js            - Draggable event list UI
  LevelInfoPanel.js            - Level-specific event info UI
```

**Load Order** (in index.html):
```html
<!-- Event System -->
<script src="Classes/managers/EventManager.js"></script>
<script src="Classes/events/Event.js"></script>
<script src="Classes/events/EventTrigger.js"></script>

<!-- Debug System (after event system) -->
<script src="debug/EventDebugManager.js"></script>
<script src="debug/EventListPanel.js"></script>
<script src="debug/LevelInfoPanel.js"></script>
```

---

## Keyboard Shortcuts

**Available (Ctrl+Shift combinations)**:
- `Ctrl+Shift+E` - Toggle event debug mode ON/OFF
- `Ctrl+Shift+F` - Toggle event flag overlay
- `Ctrl+Shift+L` - Toggle level info panel
- `Ctrl+Shift+A` - Toggle all events panel (list)

**Implementation** (in `sketch.js`):
```javascript
// In keyPressed() function (lines ~740-775)
if (keyIsDown(CONTROL) && keyIsDown(SHIFT) && window.eventDebugManager) {
  switch (keyCode) {
    case 69: // E - Toggle event debug system
      window.eventDebugManager.toggle();
      console.log(`🎮 Event debug: ${window.eventDebugManager.enabled ? 'ON' : 'OFF'}`);
      break;
      
    case 70: // F - Toggle event flags overlay
      window.eventDebugManager.toggleEventFlags();
      console.log(`🏴 Event flags: ${window.eventDebugManager.showEventFlags ? 'ON' : 'OFF'}`);
      break;
      
    case 76: // L - Toggle level info panel
      window.eventDebugManager.toggleLevelInfo();
      console.log(`ℹ️ Level info: ${window.eventDebugManager.showLevelInfo ? 'ON' : 'OFF'}`);
      break;
      
    case 65: // A - Toggle event list (All events)
      window.eventDebugManager.toggleEventList();
      console.log(`📋 Event list: ${window.eventDebugManager.showEventList ? 'ON' : 'OFF'}`);
      break;
  }
}
```

**Note**: Shortcuts require event debug system to be initialized (`window.eventDebugManager` exists). Console feedback confirms state changes.

---

## Testing Strategy

### Unit Tests (Written First - TDD)

**File**: `test/unit/debug/eventDebugManager.test.js`

**Coverage**: 100+ tests covering:
- ✅ Enable/disable control
- ✅ Event flag visibility toggle
- ✅ Level event filtering
- ✅ Trigger tracking per level
- ✅ Manual event triggering with bypass
- ✅ One-time event greying
- ✅ Command execution
- ✅ Color coding by type
- ✅ Rendering (with p5.js mocks)
- ✅ MapManager integration
- ✅ EventManager integration
- ✅ Level editor integration

### Integration Tests

**File**: `test/integration/debug/eventDebug.integration.test.js`

**Tests**:
- Event triggering updates debug history
- Level switching clears appropriate data
- Manual triggering bypasses level restrictions
- Event flags render correctly in level editor

### E2E Tests (with Screenshots)

**File**: `test/e2e/debug/pw_event_debug.js`

**Tests**:
1. Event flag overlay renders with correct colors
2. Level info panel shows current level events
3. Event list panel displays all events
4. Manual trigger command works from console
5. One-time events grey out after triggering
6. Keyboard shortcuts toggle panels

**Screenshot Evidence**:
- `test/e2e/screenshots/debug/event_flags_overlay.png`
- `test/e2e/screenshots/debug/level_info_panel.png`
- `test/e2e/screenshots/debug/event_list_panel.png`
- `test/e2e/screenshots/debug/greyed_one_time_event.png`

---

## Example Usage

### Developer Workflow

**1. Enable Debug Mode**:
```javascript
> eventDebug on
// Event debug enabled
```

**2. View Events for Current Level**:
```javascript
> showLevelInfo
// Panel appears showing:
// Level: test_level
// Events:
//   - dialogue_intro (dialogue, P:1, spatial trigger, ✓ triggered)
//   - wave_1_spawn (spawn, P:5, time trigger, ready)
```

**3. View Event Flags**:
```javascript
> showEventFlags
// Blue circle appears at (100, 200) for dialogue_intro
// Red circle appears at (300, 400) for wave_1_spawn
// Greyed blue circle for triggered one-time event
```

**4. Test Event Without Walking There**:
```javascript
> triggerEvent wave_1_spawn
// Event triggers immediately, enemies spawn
// History updated: wave_1_spawn marked as triggered
```

**5. View All Events**:
```javascript
> showEventList
// Draggable panel appears with all events:
// dialogue_intro (dialogue) - triggerEvent dialogue_intro [✓]
// wave_1_spawn (spawn) - triggerEvent wave_1_spawn [✓]
// boss_fight (boss) - triggerEvent boss_fight [ ]
```

**6. Copy Command from Panel**:
- Click on `boss_fight` in event list
- Command `triggerEvent boss_fight` copied to clipboard
- Paste in console and execute

---

## Performance Considerations

**Rendering Optimization**:
- Only render when debug enabled
- Cache event lists per level
- Limit panel updates to 30fps
- Use spatial culling for event flags outside viewport

**Memory**:
- Triggered event history limited to 100 per level
- Auto-clear history for unloaded levels
- Event list sorted once, cached until event system changes

---

## Future Enhancements

1. **Event Timeline**: Visual timeline showing when events triggered
2. **Event Graph**: Dependency graph showing flag relationships
3. **Export Test Cases**: Save triggered events as test scenarios
4. **Event Recording**: Record player actions + events for playback
5. **Analytics**: Track event trigger rates, completion rates
6. **Filter/Search**: Search events by ID, type, trigger condition

---

## Summary

The Event Debug System provides 6 core features:

1. ✅ **Level Event Info** - Shows events linked to current level + conditions
2. ✅ **Trigger History** - Tracks triggered events per level, marks one-time
3. ✅ **Visual Overlays** - Color-coded event flag rendering (greyed if triggered)
4. ✅ **Console Commands** - Toggle visibility, list events, debug control
5. ✅ **Manual Triggering** - Bypass all restrictions for testing
6. ✅ **Event List Panel** - Global event list with copy-paste trigger commands

All features integrate seamlessly with existing systems (MapManager, EventManager, Level Editor, Command Line) and follow TDD methodology with 100+ unit tests written first.
