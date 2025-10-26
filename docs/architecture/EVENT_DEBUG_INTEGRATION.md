# Event Debug System Integration Guide

## Overview

This document describes the specific changes needed to existing systems to support the Event Debug System.

## 1. MapManager Changes

**File**: `Classes/managers/MapManager.js`

### Current State

MapManager already provides:
- ✅ `getActiveMapId()` - Returns current level ID
- ✅ `getAllMapIds()` - Returns array of all level IDs
- ✅ `_activeMap` - Reference to current terrain
- ✅ `_activeMapId` - String identifier for current level

### Required Changes

**None - MapManager is ready!**

The EventDebugManager can use existing API:
```javascript
// Get current level
const levelId = mapManager.getActiveMapId();

// Get all levels
const allLevels = mapManager.getAllMapIds();
```

---

## 2. EventManager Changes

**File**: `Classes/managers/EventManager.js` (to be created)

### Required Implementation

**Hook 1: Trigger Notification**

When an event triggers, notify EventDebugManager for history tracking:

```javascript
class EventManager {
  triggerEvent(eventId, data = {}) {
    const event = this.events.get(eventId);
    if (!event) {
      console.error(`Event ${eventId} not found`);
      return false;
    }
    
    // Check if paused by higher priority
    if (this._isPausedByPriority(event)) {
      this._queueEvent(event);
      return false;
    }
    
    // Execute event
    event.execute(data);
    this.activeEvents.push(event);
    
    // 🔧 DEBUG HOOK: Notify debug manager
    if (window.eventDebugManager) {
      const levelId = window.mapManager?.getActiveMapId() || 'unknown';
      window.eventDebugManager.onEventTriggered(eventId, levelId);
    }
    
    return true;
  }
}
```

**Hook 2: Allow Debug Bypass**

Manual triggers from debug system should bypass restrictions:

```javascript
class EventManager {
  triggerEvent(eventId, data = {}) {
    const event = this.events.get(eventId);
    if (!event) return false;
    
    const isDebugTrigger = data.debugTriggered === true;
    
    // Skip level check if debug triggered
    if (!isDebugTrigger && event.levelId !== mapManager.getActiveMapId()) {
      return false;
    }
    
    // Skip one-time check if debug triggered
    if (!isDebugTrigger && event.hasTriggered && event.oneTime) {
      return false;
    }
    
    // ... continue with normal logic
  }
}
```

### No Breaking Changes

These hooks are **additive only** - existing functionality unchanged.

---

## 3. Level Editor Changes

**File**: `Classes/ui/LevelEditor.js` (existing)

### Current State

Level Editor has:
- ✅ `MaterialPalette` for terrain brushes
- ✅ `ToolBar` for tool selection
- ✅ `TerrainEditor` for map editing
- ✅ Click handlers for placement

### Required Changes

**Option A: Minimal Integration (Recommended)**

Add EventDebugManager rendering to existing level editor render:

```javascript
class LevelEditor {
  render() {
    // Existing terrain rendering
    this.terrainEditor.render();
    this.palette.render();
    this.toolbar.render();
    
    // 🔧 ADD: Event debug rendering
    if (window.eventDebugManager && window.eventDebugManager.enabled) {
      window.eventDebugManager.renderEventFlags();
    }
  }
}
```

**Option B: Full Integration with EventFlagLayer**

If `EventFlagLayer` is implemented:

```javascript
class EventFlagLayer {
  render() {
    // Normal flag rendering (invisible by default)
    this.flags.forEach(flag => {
      if (this.selectedFlagId === flag.id) {
        this.renderSelected(flag);
      }
    });
    
    // 🔧 ADD: Debug visualization
    if (window.eventDebugManager?.showEventFlags) {
      this.renderDebugFlags();
    }
  }
  
  renderDebugFlags() {
    this.flags.forEach(flag => {
      const event = window.eventManager.getEvent(flag.eventId);
      if (!event) return;
      
      const color = window.eventDebugManager.getEventTypeColor(event.type);
      const shouldGrey = window.eventDebugManager.shouldGreyOutEvent(
        flag.eventId, 
        this.levelId
      );
      
      push();
      
      // Set color with opacity
      if (shouldGrey) {
        fill(color[0], color[1], color[2], 80); // Greyed
        stroke(color[0], color[1], color[2], 120);
      } else {
        fill(color[0], color[1], color[2], 150); // Normal
        stroke(color[0], color[1], color[2], 255);
      }
      
      strokeWeight(2);
      circle(flag.x, flag.y, flag.radius * 2);
      
      // Label
      fill(255);
      textAlign(CENTER);
      text(flag.eventId, flag.x, flag.y - flag.radius - 10);
      
      pop();
    });
  }
}
```

### No Breaking Changes

Rendering hook is called **after** existing rendering - no conflicts.

---

## 4. Command Line Changes

**File**: `debug/commandLine.js` (existing)

### Current State

commandLine.js has:
- ✅ `handleUIDebugCommand()` pattern
- ✅ Command parsing with `split(' ')`
- ✅ Console output capture
- ✅ Command history

### Required Changes

**Extend handleCommand() function**:

```javascript
// In debug/commandLine.js

function handleCommand(command) {
  const args = command.split(' ');
  const baseCommand = args[0];
  
  // 🔧 ADD: Event debug commands
  if (baseCommand === 'eventDebug') {
    handleEventDebugCommand(args);
    return;
  }
  
  if (baseCommand === 'triggerEvent') {
    if (window.eventDebugManager && args[1]) {
      window.eventDebugManager.manualTriggerEvent(args[1]);
      console.log(`Triggered event: ${args[1]}`);
    } else {
      console.log('Usage: triggerEvent <eventId>');
    }
    return;
  }
  
  if (baseCommand === 'showEventFlags') {
    window.eventDebugManager?.toggleEventFlags();
    console.log(`Event flags: ${window.eventDebugManager?.showEventFlags ? 'ON' : 'OFF'}`);
    return;
  }
  
  if (baseCommand === 'showEventList') {
    window.eventDebugManager?.toggleEventList();
    console.log(`Event list: ${window.eventDebugManager?.showEventList ? 'ON' : 'OFF'}`);
    return;
  }
  
  if (baseCommand === 'showLevelInfo') {
    window.eventDebugManager?.toggleLevelInfo();
    console.log(`Level info: ${window.eventDebugManager?.showLevelInfo ? 'ON' : 'OFF'}`);
    return;
  }
  
  if (baseCommand === 'listEvents') {
    const events = window.eventDebugManager?.getAllEventCommands();
    if (events && events.length > 0) {
      console.log('All Events:');
      events.forEach(e => {
        console.log(`  ${e.id} (${e.type}) - ${e.command}`);
      });
    } else {
      console.log('No events found');
    }
    return;
  }
  
  // Existing commands...
  if (baseCommand === 'help') {
    // ...
  }
}

// 🔧 ADD: Event debug sub-command handler
function handleEventDebugCommand(args) {
  if (!window.eventDebugManager) {
    console.log('EventDebugManager not initialized');
    return;
  }
  
  const subCommand = args[1];
  
  switch(subCommand) {
    case 'on':
    case 'enable':
      window.eventDebugManager.enable();
      console.log('Event debug enabled');
      break;
      
    case 'off':
    case 'disable':
      window.eventDebugManager.disable();
      console.log('Event debug disabled');
      break;
      
    case 'toggle':
      window.eventDebugManager.toggle();
      console.log(`Event debug: ${window.eventDebugManager.enabled ? 'ON' : 'OFF'}`);
      break;
      
    default:
      console.log('Usage: eventDebug [on|off|toggle]');
  }
}
```

**Update help command** (optional but recommended):

```javascript
function showHelp() {
  console.log('Available Commands:');
  console.log('  help - Show this help');
  console.log('  clear - Clear console');
  
  // 🔧 ADD: Event debug commands to help
  console.log('');
  console.log('Event Debug Commands:');
  console.log('  eventDebug [on|off|toggle] - Control event debug system');
  console.log('  triggerEvent <eventId> - Manually trigger an event');
  console.log('  showEventFlags - Toggle event flag overlay');
  console.log('  showEventList - Toggle event list panel');
  console.log('  showLevelInfo - Toggle level event info panel');
  console.log('  listEvents - List all events with trigger commands');
}
```

### No Breaking Changes

New commands added **after** existing command checks - no conflicts.

---

## 5. DraggablePanelManager Changes

**File**: `Classes/managers/DraggablePanelManager.js` (existing)

### Current State

DraggablePanelManager handles:
- ✅ Panel registration
- ✅ Drag/resize functionality
- ✅ Z-order management
- ✅ State-based visibility

### Required Changes

**Option A: Register Debug Panels Manually (Recommended)**

EventDebugManager creates its own panels and registers them:

```javascript
// In EventDebugManager constructor
constructor() {
  // ... existing init
  
  this.levelInfoPanel = this._createLevelInfoPanel();
  this.eventListPanel = this._createEventListPanel();
  
  // Register with DraggablePanelManager
  if (window.draggablePanelManager) {
    window.draggablePanelManager.registerPanel('eventDebugLevelInfo', this.levelInfoPanel);
    window.draggablePanelManager.registerPanel('eventDebugEventList', this.eventListPanel);
  }
}
```

**Option B: Use Existing Panel System**

If panels use standardized interface:

```javascript
// EventDebugManager implements DraggablePanel interface
class EventListPanel {
  constructor() {
    this.id = 'eventDebugEventList';
    this.x = 10;
    this.y = 100;
    this.width = 400;
    this.height = 600;
    this.draggable = true;
    this.visible = false;
  }
  
  render() {
    // Panel rendering...
  }
  
  handleMousePressed(mouseX, mouseY) {
    // Click handling...
  }
  
  // Standard panel interface
  show() { this.visible = true; }
  hide() { this.visible = false; }
  toggle() { this.visible = !this.visible; }
}
```

### No Breaking Changes

Panels are **opt-in** - existing panels unaffected.

---

## 6. Rendering Pipeline Changes

**File**: `Classes/rendering/RenderLayerManager.js` (existing)

### Current State

RenderLayerManager has:
- ✅ `UI_DEBUG` layer for debug overlays
- ✅ State-based visibility system
- ✅ `addDrawableToLayer()` registration

### Required Changes

**Register event debug rendering in UI_DEBUG layer**:

```javascript
// In initialization (sketch.js setup() or bootstrap)
function initializeEventDebugRendering() {
  if (!window.RenderManager || !window.eventDebugManager) return;
  
  // 🔧 ADD: Event flag overlay
  RenderManager.addDrawableToLayer(RenderManager.layers.UI_DEBUG, () => {
    if (eventDebugManager.enabled && eventDebugManager.showEventFlags) {
      eventDebugManager.renderEventFlags();
    }
  });
  
  // 🔧 ADD: Level info panel
  RenderManager.addDrawableToLayer(RenderManager.layers.UI_DEBUG, () => {
    if (eventDebugManager.enabled && eventDebugManager.showLevelInfo) {
      eventDebugManager.renderLevelInfo();
    }
  });
  
  // 🔧 ADD: Event list panel
  RenderManager.addDrawableToLayer(RenderManager.layers.UI_DEBUG, () => {
    if (eventDebugManager.enabled && eventDebugManager.showEventList) {
      eventDebugManager.renderEventList();
    }
  });
}

// Call during setup
function setup() {
  // ... existing setup
  
  initializeEventDebugRendering();
}
```

**Update state visibility** (if needed):

```javascript
// If UI_DEBUG layer not visible in PLAYING state
RenderManager.stateVisibility.PLAYING.push(RenderManager.layers.UI_DEBUG);
```

### No Breaking Changes

Drawables registered **in addition to** existing UI_DEBUG content.

---

## 7. Global State Changes

**File**: `sketch.js` or `scripts/bootstrap-globals.js`

### Required Changes

**Add EventDebugManager global**:

```javascript
// In sketch.js preload() or bootstrap
let eventDebugManager;

function setup() {
  // ... existing setup
  
  // 🔧 ADD: Initialize event debug manager
  if (typeof EventDebugManager !== 'undefined') {
    eventDebugManager = new EventDebugManager();
    window.eventDebugManager = eventDebugManager;
  }
}
```

**Add to global type definitions** (optional):

```javascript
// In types/global.d.ts or src/globals.d.ts
interface Window {
  eventDebugManager?: EventDebugManager;
  // ... existing
}
```

---

## 8. index.html Script Loading

**File**: `index.html`

### Required Changes

**Add script tags in correct order**:

```html
<!-- Event System (before debug system) -->
<script src="Classes/managers/EventManager.js"></script>
<script src="Classes/events/Event.js"></script>
<script src="Classes/events/EventTrigger.js"></script>
<script src="Classes/events/DialogueEvent.js"></script>
<script src="Classes/events/SpawnEvent.js"></script>
<script src="Classes/events/TutorialEvent.js"></script>
<script src="Classes/events/BossEvent.js"></script>

<!-- Event Debug System (after event system, before sketch.js) -->
<script src="debug/EventDebugManager.js"></script>
<script src="debug/EventListPanel.js"></script>
<script src="debug/LevelInfoPanel.js"></script>

<!-- Main sketch -->
<script src="sketch.js"></script>
```

**Placement**: After managers, before sketch.js

---

## 9. Keyboard Handler Changes

**File**: `sketch.js` (keyPressed function)

### Current State

keyPressed() handles:
- ✅ Camera controls
- ✅ Debug toggles (Ctrl+Shift+1/2/3)
- ✅ Game state changes

### Required Changes

**Add event debug shortcuts**:

```javascript
function keyPressed() {
  // Existing shortcuts...
  
  // 🔧 ADD: Event debug shortcuts
  if (keyCode === 69 && keyIsDown(CONTROL) && keyIsDown(SHIFT)) {
    // Ctrl+Shift+E - Toggle event debug
    eventDebugManager?.toggle();
    console.log(`Event debug: ${eventDebugManager?.enabled ? 'ON' : 'OFF'}`);
    return false;
  }
  
  if (keyCode === 70 && keyIsDown(CONTROL) && keyIsDown(SHIFT)) {
    // Ctrl+Shift+F - Toggle event flags
    eventDebugManager?.toggleEventFlags();
    console.log(`Event flags: ${eventDebugManager?.showEventFlags ? 'ON' : 'OFF'}`);
    return false;
  }
  
  if (keyCode === 76 && keyIsDown(CONTROL) && keyIsDown(SHIFT)) {
    // Ctrl+Shift+L - Toggle level info
    eventDebugManager?.toggleLevelInfo();
    console.log(`Level info: ${eventDebugManager?.showLevelInfo ? 'ON' : 'OFF'}`);
    return false;
  }
  
  if (keyCode === 65 && keyIsDown(CONTROL) && keyIsDown(SHIFT)) {
    // Ctrl+Shift+A - Toggle event list (All events)
    eventDebugManager?.toggleEventList();
    console.log(`Event list: ${eventDebugManager?.showEventList ? 'ON' : 'OFF'}`);
    return false;
  }
}
```

### No Breaking Changes

New shortcuts use **Ctrl+Shift** modifier - no conflicts with existing bindings.

---

## Summary of Changes

### ✅ No Changes Needed
1. **MapManager** - Already provides required API
2. **DraggablePanelManager** - Works with standard panel interface

### 🔧 Minimal Additive Changes
3. **EventManager** - Add 2 debug hooks (5 lines each)
4. **Level Editor** - Add 1 render call (3 lines)
5. **Command Line** - Add command handlers (50 lines)
6. **RenderLayerManager** - Register 3 drawables (15 lines)
7. **sketch.js** - Initialize EventDebugManager (5 lines)
8. **keyPressed()** - Add 4 keyboard shortcuts (20 lines)
9. **index.html** - Add 3 script tags (3 lines)

### 📊 Total Impact
- **9 files** modified
- **~100 lines** added (all additive, no deletions)
- **0 breaking changes**
- **100% backwards compatible**

All changes are **non-invasive** and follow existing patterns in the codebase.
