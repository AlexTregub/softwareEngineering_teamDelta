# Level Editor Integration - Event Trigger Flags

## Overview
Integration plan for adding event trigger flags to the Level Editor, allowing designers to place invisible spatial triggers that activate events when entities enter them.

## Current Level Editor Architecture

### Existing Components
- **LevelEditor** - Main controller
- **LevelEditorPanels** - Draggable panels (Materials, Tools, Brush Size)
- **TerrainEditor** - Terrain tile editing
- **MaterialPalette** - Terrain material selection
- **ToolBar** - Tool selection (paint, fill, eyedropper, select)
- **BrushSizeControl** - Brush size adjustment
- **DraggablePanelManager** - Panel system integration

### Export/Import System
- TerrainExporter - JSON export (terrain data)
- TerrainImporter - JSON import
- Needs extension for event triggers

## Integration Plan

### 1. Event Flag Layer System

#### New Layer Type
Add a separate **Event Layer** above terrain, below entities:

```javascript
// In LevelEditor.js
class LevelEditor {
  constructor() {
    // ... existing properties
    this.eventLayer = null; // NEW: Event trigger flag layer
    this.eventFlags = []; // NEW: Array of placed event flags
  }
  
  initialize(terrain) {
    // ... existing initialization
    
    // Create event layer
    this.eventLayer = new EventFlagLayer(terrain);
  }
}
```

#### EventFlagLayer Class (NEW)
```javascript
// Classes/systems/ui/EventFlagLayer.js
class EventFlagLayer {
  constructor(terrain) {
    this.terrain = terrain;
    this.flags = []; // Array of EventFlag instances
    this.selectedFlag = null; // Currently selected flag for editing
    this.tempFlag = null; // Flag following cursor during placement
  }
  
  addFlag(eventFlag) { /* Add flag to layer */ }
  removeFlag(flagId) { /* Remove flag by ID */ }
  getFlag(flagId) { /* Get flag by ID */ }
  getAllFlags() { /* Return all flags */ }
  render() { /* Render all flags (editor mode) */ }
  exportToJSON() { /* Serialize flags for export */ }
  importFromJSON(data) { /* Deserialize flags */ }
}
```

#### EventFlag Class (NEW)
```javascript
// Classes/events/EventFlag.js
class EventFlag {
  constructor(config) {
    this.id = config.id; // Unique flag ID
    this.x = config.x; // World position X
    this.y = config.y; // World position Y
    this.radius = config.radius || 64; // Trigger radius
    this.eventId = config.eventId; // Which event to trigger
    this.visualStyle = config.visualStyle || 'default'; // Visual appearance in editor
    this.oneTime = config.oneTime !== false; // Default: trigger once
    this.metadata = config.metadata || {}; // Custom data
  }
  
  render(editorMode = false) {
    // In editor: visible with icon/outline
    // In game: invisible (just collision detection)
  }
  
  containsPoint(x, y) {
    // Check if point is within trigger radius
    return dist(x, y, this.x, this.y) <= this.radius;
  }
  
  toJSON() {
    // Serialize for export
  }
  
  static fromJSON(data) {
    // Deserialize from import
  }
}
```

### 2. Level Editor UI Extensions

#### A. New Tool: "Event Flag Tool"

Add to ToolBar:
```javascript
// In LevelEditor.initialize()
this.toolbar = new ToolBar([
  { name: 'paint', icon: '🖌️', tooltip: 'Paint Tool' },
  { name: 'fill', icon: '🪣', tooltip: 'Fill Tool' },
  { name: 'eyedropper', icon: '💧', tooltip: 'Pick Material' },
  { name: 'select', icon: '⬚', tooltip: 'Select Region' },
  { name: 'eventflag', icon: '🚩', tooltip: 'Place Event Flag' } // NEW
]);
```

#### B. New Panel: "Event Flags"

```javascript
// In LevelEditorPanels.initialize()
this.panels.events = new DraggablePanel({
  id: 'level-editor-events',
  title: 'Event Flags',
  position: { x: 10, y: 470 },
  size: { width: 250, height: 300 },
  buttons: {
    layout: 'vertical',
    items: [
      {
        id: 'place-flag',
        text: 'Place Flag',
        icon: '🚩',
        onClick: () => this.startFlagPlacement()
      },
      {
        id: 'flag-list',
        text: 'Flag List',
        type: 'list', // Scrollable list of existing flags
        items: [] // Populated dynamically
      }
    ]
  },
  content: {
    customRender: (panel) => {
      // Render flag list with edit/delete buttons
      this.renderEventFlagList(panel);
    }
  }
});
```

#### C. Event Flag Properties Panel

When a flag is selected, show properties:
```javascript
this.panels.eventProperties = new DraggablePanel({
  id: 'event-flag-properties',
  title: 'Flag Properties',
  position: { x: 270, y: 470 },
  size: { width: 300, height: 400 },
  content: {
    customRender: (panel) => {
      if (!this.selectedFlag) return;
      
      // Render editable properties:
      // - Flag ID (text input)
      // - Event ID (dropdown of registered events)
      // - Trigger Radius (slider)
      // - One-time trigger (checkbox)
      // - Visual Style (dropdown)
      // - Position (X, Y inputs)
    }
  }
});
```

### 3. Placement Workflow

#### User Flow (Click-to-Place)
1. **Select Event Flag Tool** - Click 🚩 icon in toolbar
2. **Click "Place Flag"** - Opens flag configuration
3. **Configure Flag** - Set event ID, radius, etc.
4. **Click on Map** - Flag follows cursor, click to place
5. **Fine-tune** - Select flag, adjust properties in panel

#### Implementation (Click-to-Place System)

```javascript
// In LevelEditor.js
class LevelEditor {
  startFlagPlacement(eventId = 'new_event') {
    this.toolbar.selectTool('eventflag');
    
    // Create temporary flag that follows cursor
    this.tempFlag = new EventFlag({
      id: `flag_${Date.now()}`,
      x: 0,
      y: 0,
      radius: 64,
      eventId: eventId,
      visualStyle: 'default'
    });
    
    this.placementMode = true;
    console.log('Flag placement mode activated - click on map to place');
  }
  
  handleClick(mouseX, mouseY) {
    if (!this.active) return;
    
    // Check tool selection
    const tool = this.toolbar.getSelectedTool();
    
    if (tool === 'eventflag' && this.placementMode) {
      // Convert screen coords to world coords
      const worldPos = this.editorCamera.screenToWorld(mouseX, mouseY);
      
      // Place the temp flag at click position
      this.tempFlag.x = worldPos.x;
      this.tempFlag.y = worldPos.y;
      
      // Add to event layer
      this.eventLayer.addFlag(this.tempFlag);
      
      // Clear temp flag and exit placement mode
      this.tempFlag = null;
      this.placementMode = false;
      
      console.log(`Flag placed at (${worldPos.x}, ${worldPos.y})`);
      
      // Optionally, immediately select the placed flag for editing
      this.selectedFlag = this.eventLayer.flags[this.eventLayer.flags.length - 1];
      
      return;
    }
    
    // ... existing terrain editing logic
  }
  
  update() {
    if (!this.active) return;
    
    // Update temp flag position to follow cursor
    if (this.placementMode && this.tempFlag) {
      const worldPos = this.editorCamera.screenToWorld(mouseX, mouseY);
      this.tempFlag.x = worldPos.x;
      this.tempFlag.y = worldPos.y;
    }
    
    // ... existing update logic
  }
  
  render() {
    if (!this.active) return;
    
    // ... existing terrain rendering
    
    // Render event flags (if editor mode)
    if (this.eventLayer) {
      this.eventLayer.render(true); // editorMode = true
    }
    
    // Render temp flag (semi-transparent, following cursor)
    if (this.tempFlag) {
      push();
      tint(255, 200); // Semi-transparent
      this.tempFlag.render(true);
      pop();
    }
    
    // ... existing UI rendering
  }
}
```

### 4. Visual Design (Editor Mode)

#### Flag Appearance in Editor
```javascript
// In EventFlag.render()
render(editorMode = false) {
  if (!editorMode) return; // Invisible in game mode
  
  push();
  
  // Trigger radius circle
  noFill();
  stroke(255, 200, 0, 100); // Yellow, semi-transparent
  strokeWeight(2);
  circle(this.x, this.y, this.radius * 2);
  
  // Flag icon in center
  fill(255, 200, 0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(24);
  text('🚩', this.x, this.y);
  
  // Flag ID label below icon
  fill(255);
  textSize(10);
  text(this.id, this.x, this.y + 20);
  
  // Highlight if selected
  if (this.selected) {
    noFill();
    stroke(0, 255, 0); // Green highlight
    strokeWeight(3);
    circle(this.x, this.y, this.radius * 2);
  }
  
  pop();
}
```

#### Visual Styles (Customizable)
- **Default**: Yellow circle + 🚩 icon
- **Tutorial**: Blue circle + 📚 icon
- **Combat**: Red circle + ⚔️ icon
- **Story**: Purple circle + 📜 icon
- **Boss**: Orange circle + 👹 icon

### 5. Export/Import Integration

#### Extended JSON Format

```json
{
  "terrain": {
    "width": 320,
    "height": 320,
    "tiles": [ ... ]
  },
  "eventFlags": [
    {
      "id": "tutorial_flag_01",
      "x": 512,
      "y": 768,
      "radius": 64,
      "eventId": "tutorial_gathering",
      "oneTime": true,
      "visualStyle": "tutorial",
      "metadata": {
        "priority": 1,
        "description": "Triggers when queen crosses bridge"
      }
    },
    {
      "id": "wave_spawn_01",
      "x": 1024,
      "y": 256,
      "radius": 128,
      "eventId": "wave_3_enemies",
      "oneTime": false,
      "visualStyle": "combat"
    }
  ],
  "events": [
    {
      "id": "tutorial_gathering",
      "type": "tutorial",
      "content": { ... }
    },
    {
      "id": "wave_3_enemies",
      "type": "spawn",
      "content": {
        "wave": {
          "number": 3,
          "enemies": [ ... ]
        }
      }
    }
  ]
}
```

#### TerrainExporter Extension

```javascript
// In TerrainExporter.js
exportLevel(levelEditor) {
  const data = {
    terrain: this.exportTerrain(levelEditor.terrain),
    eventFlags: this.exportEventFlags(levelEditor.eventLayer), // NEW
    events: this.exportEvents(eventManager) // NEW (if events defined in level)
  };
  
  return JSON.stringify(data, null, 2);
}

exportEventFlags(eventLayer) {
  if (!eventLayer) return [];
  
  return eventLayer.flags.map(flag => flag.toJSON());
}
```

#### TerrainImporter Extension

```javascript
// In TerrainImporter.js
importLevel(jsonData, levelEditor) {
  // Import terrain
  this.importTerrain(jsonData.terrain, levelEditor);
  
  // Import event flags (NEW)
  if (jsonData.eventFlags) {
    this.importEventFlags(jsonData.eventFlags, levelEditor.eventLayer);
  }
  
  // Import events (NEW) - register with EventManager
  if (jsonData.events) {
    this.importEvents(jsonData.events, eventManager);
  }
}

importEventFlags(flagsData, eventLayer) {
  if (!eventLayer) return;
  
  eventLayer.flags = flagsData.map(data => EventFlag.fromJSON(data));
}
```

### 6. Runtime Integration (Game Mode)

#### Spatial Trigger Registration

When level is loaded in game mode:
```javascript
// In level loading code (sketch.js or GameStateManager)
function loadLevel(levelData) {
  // Load terrain
  g_map2 = new gridTerrain(...);
  
  // Load event flags and register as spatial triggers
  if (levelData.eventFlags && eventManager) {
    levelData.eventFlags.forEach(flagData => {
      // Create SpatialTrigger from EventFlag
      const trigger = new SpatialTrigger({
        eventId: flagData.eventId,
        condition: {
          x: flagData.x,
          y: flagData.y,
          radius: flagData.radius,
          flagId: flagData.id
        },
        oneTime: flagData.oneTime
      });
      
      // Register with EventManager
      eventManager.registerTrigger(trigger);
    });
  }
  
  // Load events
  if (levelData.events && eventManager) {
    levelData.events.forEach(eventData => {
      eventManager.registerEvent(eventData);
    });
  }
}
```

#### Entity Collision Detection

```javascript
// In Entity update loop or EventManager.update()
eventManager.update = function() {
  if (!this.enabled) return;
  
  // Check spatial triggers against entities
  this.triggers.forEach(trigger => {
    if (trigger.type !== 'spatial') return;
    
    // Get entities in trigger radius
    const nearbyEntities = spatialGridManager.getNearbyEntities(
      trigger.condition.x,
      trigger.condition.y,
      trigger.condition.radius
    );
    
    // Check if any entity enters trigger
    nearbyEntities.forEach(entity => {
      if (trigger.checkCondition(entity)) {
        // Trigger event!
        this.triggerEvent(trigger.eventId);
      }
    });
  });
  
  // ... existing update logic
};
```

## Implementation Checklist (TDD Order)

### Phase 1: Core Classes (Week 1)
- [ ] **Unit tests** for EventFlag class
- [ ] **Implement** EventFlag (position, radius, serialization)
- [ ] **Unit tests** for EventFlagLayer
- [ ] **Implement** EventFlagLayer (add, remove, render)
- [ ] **Integration tests** EventFlag ↔ EventFlagLayer

### Phase 2: Level Editor UI (Week 2)
- [ ] **Unit tests** for flag placement logic
- [ ] **Implement** Event Flag tool in ToolBar
- [ ] **Implement** "Place Flag" click-to-place system
- [ ] **Unit tests** for Event Flags panel
- [ ] **Implement** Event Flags panel (list, add, delete)
- [ ] **Unit tests** for Properties panel
- [ ] **Implement** Flag Properties panel (edit radius, event ID, etc.)
- [ ] **Integration tests** LevelEditor ↔ EventFlagLayer

### Phase 3: Export/Import (Week 3)
- [ ] **Unit tests** for JSON serialization
- [ ] **Extend** TerrainExporter with eventFlags export
- [ ] **Extend** TerrainImporter with eventFlags import
- [ ] **Integration tests** export → import roundtrip
- [ ] **Validate** JSON schema

### Phase 4: Runtime Integration (Week 4)
- [ ] **Unit tests** for EventFlag → SpatialTrigger conversion
- [ ] **Implement** level loading with trigger registration
- [ ] **Integration tests** EventManager ↔ SpatialTrigger ↔ Entity
- [ ] **E2E tests** with screenshots (flag placement, trigger activation)
- [ ] **BDD tests** complete level design workflow

### Phase 5: Polish & Testing (Week 5)
- [ ] **E2E tests** full level editor workflow with flags
- [ ] **Visual verification** flag rendering in editor
- [ ] **Usability testing** click-to-place workflow
- [ ] **Documentation** level designer guide
- [ ] **Example levels** with various event flag types

## File Structure

```
Classes/
  events/
    EventFlag.js                 (NEW)
    EventFlagLayer.js            (NEW)
  systems/
    ui/
      LevelEditor.js             (EXTEND - add eventLayer)
      LevelEditorPanels.js       (EXTEND - add event panels)
  terrainUtils/
    TerrainExporter.js           (EXTEND - add eventFlags)
    TerrainImporter.js           (EXTEND - add eventFlags)

test/
  unit/
    events/
      eventFlag.test.js          (NEW)
      eventFlagLayer.test.js     (NEW)
    ui/
      levelEditorEvents.test.js  (NEW)
  integration/
    ui/
      eventFlagPlacement.integration.test.js (NEW)
    events/
      eventFlagRuntime.integration.test.js   (NEW)
  e2e/
    level_editor/
      pw_event_flag_placement.js (NEW)
      pw_event_flag_trigger.js   (NEW)

docs/
  guides/
    LEVEL_EDITOR_EVENT_FLAGS.md (NEW - Designer guide)
```

## Example Use Case

### Designer Workflow
1. Open Level Editor
2. Design terrain (grass, water, stone paths)
3. Click Event Flag tool 🚩
4. Click "Place Flag" → Configure: `tutorial_welcome` event
5. Click on spawn point → Flag placed
6. Click Event Flag tool 🚩 again
7. Click "Place Flag" → Configure: `wave_1_spawn` event
8. Click near enemy base → Flag placed
9. Export level → `my_level.json`
10. Load in game → Flags automatically become triggers

### Player Experience (Game Mode)
1. Level loads → Event flags invisible, triggers registered
2. Queen ant spawns near `tutorial_welcome` flag
3. Queen moves → Enters flag radius
4. Tutorial dialogue appears at bottom of screen
5. Player clicks "Got it!" → Dialogue closes
6. Queen explores → Enters `wave_1_spawn` flag
7. Enemy wave spawns at viewport edges
8. Combat begins!

---

**Dependencies**: EventManager, SpatialTrigger, DialoguePanel (TODO)
**Priority**: High (core feature for content creation)
**Estimated Effort**: 4-5 weeks
