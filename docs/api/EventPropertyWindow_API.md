# EventPropertyWindow

**Inherits:** Object  
**File:** `Classes/ui/EventPropertyWindow.js`

Draggable property editor window for editing event trigger properties.

---

## Description

EventPropertyWindow provides a standalone UI component for editing trigger properties in the Level Editor. When a user clicks an event flag on the terrain, this window opens with the trigger's current configuration. Users can modify properties like radius (spatial triggers), delay (time triggers), and the one-time setting (all trigger types). Changes are validated and persisted to the EventManager on save.

**Key Features:**
- **CRUD Operations**: Create, Read, Update, Delete trigger properties
- **Type-Specific UI**: Different input fields based on trigger type (spatial, time, flag, viewport)
- **Real-Time Preview**: Modifications to spatial radius trigger visual preview on map (see EventFlagRenderer)
- **Validation**: Input validation before saving (e.g., radius > 0, delay >= 0)
- **Action Buttons**: Save Changes (green), Cancel (gray), Delete (red)

**Integration:**
- Opened via `LevelEditor.openEventPropertyWindow(trigger)`
- Updates EventManager on save via `eventManager.updateTrigger()`
- Closes on save, cancel, or delete

---

## Tutorials

- [Level Editor Setup Guide](../LEVEL_EDITOR_SETUP.md) - Overall Level Editor architecture
- [Level Editor Roadmap](../checklists/roadmaps/LEVEL_EDITOR_ROADMAP.md) - Phase 3.4 Event Property Editor
- [Event Property Window Checklist](../checklists/active/EVENT_FLAG_PROPERTY_WINDOW.md) - Implementation phases
- [EventManager API](EventManager_API_Reference.md) - Event and trigger management system

---

## Properties

| Type      | Property                  | Default                        | Description                                      |
|-----------|---------------------------|--------------------------------|--------------------------------------------------|
| `int`     | `x`                       | Constructor parameter          | Window X position (screen coordinates)           |
| `int`     | `y`                       | Constructor parameter          | Window Y position (screen coordinates)           |
| `int`     | `width`                   | Constructor parameter          | Window width in pixels                           |
| `int`     | `height`                  | Constructor parameter          | Window height in pixels                          |
| `Object`  | `trigger`                 | Constructor parameter          | Original trigger object (read-only reference)    |
| `Object`  | `eventManager`            | Constructor parameter          | EventManager instance for CRUD operations        |
| `Object`  | `editForm`                | Deep copy of trigger           | Editable copy of trigger (isolated from original)|
| `bool`    | `isVisible`               | `true`                         | Whether window is visible                        |
| `bool`    | `isMinimized`             | `false`                        | Whether window is minimized                      |
| `bool`    | `isDragging`              | `false`                        | Whether window is being dragged                  |
| `String`  | `title`                   | `'Event Property Editor'`      | Title bar text                                   |
| `int`     | `titleBarHeight`          | `30`                           | Title bar height in pixels                       |
| `int`     | `padding`                 | `15`                           | Internal padding for content                     |
| `int`     | `lineHeight`              | `25`                           | Vertical spacing between lines                   |
| `int`     | `inputHeight`             | `30`                           | Input field height                               |
| `int`     | `buttonHeight`            | `35`                           | Action button height                             |
| `int`     | `buttonSpacing`           | `10`                           | Spacing between buttons                          |
| `String`  | `activeInput`             | `null`                         | Currently focused input field name               |
| `String`  | `inputValue`              | `''`                           | Current input value as string                    |
| `Object`  | `saveButtonBounds`        | `null`                         | Save button click bounds (calculated in render)  |
| `Object`  | `cancelButtonBounds`      | `null`                         | Cancel button click bounds                       |
| `Object`  | `deleteButtonBounds`      | `null`                         | Delete button click bounds                       |
| `Object`  | `radiusInputBounds`       | `null`                         | Radius input field bounds (spatial triggers)     |
| `Object`  | `delayInputBounds`        | `null`                         | Delay input field bounds (time triggers)         |
| `Object`  | `oneTimeCheckboxBounds`   | `null`                         | One-Time checkbox bounds                         |

---

## Methods

| Returns | Method                                                                                      |
|---------|---------------------------------------------------------------------------------------------|
| `void`  | constructor ( x: `int`, y: `int`, width: `int`, height: `int`, trigger: `Object`, eventManager: `Object` ) |
| `void`  | render ( )                                                                                  |
| `bool`  | handleClick ( relX: `int`, relY: `int` )                                                   |
| `bool`  | saveChanges ( )                                                                             |
| `void`  | deleteTrigger ( )                                                                           |
| `void`  | cancel ( )                                                                                  |
| `void`  | close ( )                                                                                   |
| `bool`  | containsPoint ( x: `int`, y: `int` ) const                                                 |
| `bool`  | handleMouseWheel ( delta: `int` )                                                          |

---

## Property Descriptions

### <span id="trigger"></span>Object **trigger**

Original trigger object being edited (read-only reference). This is the trigger from EventManager, not modified directly. All edits go to `editForm` until save is clicked.

**Structure:**
```javascript
{
  id: 'trigger_001',
  type: 'spatial', // 'time', 'flag', or 'viewport'
  eventId: 'event_dialogue_001',
  condition: {
    radius: 100, // spatial
    x: 250, y: 300 // spatial
  },
  oneTime: false
}
```

---

### <span id="editForm"></span>Object **editForm**

Editable copy of trigger properties. Changes to this object don't affect the original trigger until `saveChanges()` is called. This isolation prevents accidental modification and allows for cancel functionality.

Created via `JSON.parse(JSON.stringify(trigger))` in constructor.

---

### <span id="isVisible"></span>bool **isVisible**

Whether the window is visible. Set to `false` by `close()` method. Used to skip rendering and input handling when window is closed.

---

## Method Descriptions

### <span id="constructor"></span>void **constructor** ( x: `int`, y: `int`, width: `int`, height: `int`, trigger: `Object`, eventManager: `Object` )

Creates a new EventPropertyWindow instance.

**Parameters:**
- `x` (int, **required**): Screen X position for window
- `y` (int, **required**): Screen Y position for window
- `width` (int, **required**): Window width in pixels (typically 300)
- `height` (int, **required**): Window height in pixels (typically 400)
- `trigger` (Object, **required**): Trigger object to edit (from EventManager)
- `eventManager` (Object, **required**): EventManager instance for CRUD operations

**Example:**
```javascript
const trigger = eventManager.getTrigger('trigger_001');
const propertyWindow = new EventPropertyWindow(100, 100, 300, 400, trigger, eventManager);
```

**Note:** Constructor automatically creates a deep copy of trigger as `editForm` for isolated editing.

---

### <span id="render"></span>void **render** ( )

Renders the property editor window to the canvas. Called each frame from LevelEditor's rendering loop.

**Rendering includes:**
- Panel background with border
- Title bar ("Event Property Editor")
- Read-only fields: Trigger ID, Type
- Type-specific inputs: Radius (spatial), Delay (time)
- One-Time checkbox (all types)
- Action buttons: Save Changes, Cancel, Delete

**Example:**
```javascript
// In LevelEditor draw loop
if (this.eventPropertyWindow && this.eventPropertyWindow.isVisible) {
  this.eventPropertyWindow.render();
}
```

**Note:** Automatically skips rendering if `isVisible === false` or `isMinimized === true`.

---

### <span id="handleClick"></span>bool **handleClick** ( relX: `int`, relY: `int` )

Handles click events within the window. Detects clicks on input fields, checkboxes, and buttons.

**Parameters:**
- `relX` (int, **required**): X coordinate relative to window's left edge
- `relY` (int, **required**): Y coordinate relative to window's top edge

Returns `bool` - `true` if click was consumed (inside window bounds), `false` if outside

**Click Detection:**
- **Save Button**: Calls `saveChanges()`
- **Cancel Button**: Calls `cancel()`
- **Delete Button**: Calls `deleteTrigger()`
- **Radius Input**: Sets `activeInput = 'radius'` (spatial triggers)
- **Delay Input**: Sets `activeInput = 'delay'` (time triggers)
- **One-Time Checkbox**: Toggles `editForm.oneTime` value

**Example:**
```javascript
// In LevelEditor mousePressed()
const relX = mouseX - this.eventPropertyWindow.x;
const relY = mouseY - this.eventPropertyWindow.y;

if (this.eventPropertyWindow.handleClick(relX, relY)) {
  return; // Click was consumed by window
}
```

**Note:** Returns `false` for clicks outside window bounds (allows click passthrough).

---

### <span id="saveChanges"></span>bool **saveChanges** ( )

Validates input values and saves changes to EventManager. Closes window on successful save.

Returns `bool` - `true` if save successful, `false` if validation fails

**Validation Rules:**
- **Spatial triggers**: `radius > 0`
- **Time triggers**: `delay >= 0`

**EventManager Update:**
```javascript
eventManager.updateTrigger(trigger.id, editForm);
```

**Example:**
```javascript
const success = propertyWindow.saveChanges();
if (success) {
  console.log('Trigger updated successfully');
} else {
  console.error('Validation failed');
}
```

**Note:** Window remains open if validation fails, allowing user to correct errors.

---

### <span id="deleteTrigger"></span>void **deleteTrigger** ( )

Deletes trigger from EventManager and closes window. This action is immediate and cannot be undone (no confirmation dialog currently).

**EventManager Delete:**
```javascript
eventManager.deleteTrigger(trigger.id);
```

**Example:**
```javascript
propertyWindow.deleteTrigger();
// Trigger removed from EventManager, window closed
```

**Note:** Future enhancement could add confirmation dialog for delete action.

---

### <span id="cancel"></span>void **cancel** ( )

Discards all changes in `editForm` and closes window. Original trigger in EventManager remains unchanged.

**Example:**
```javascript
propertyWindow.cancel();
// editForm changes discarded, window closed
```

**Note:** Changes are automatically discarded since `editForm` is a separate copy from the original trigger.

---

### <span id="close"></span>void **close** ( )

Sets `isVisible = false` to hide window. Used internally by `saveChanges()`, `cancel()`, and `deleteTrigger()`.

**Example:**
```javascript
propertyWindow.close();
// Window hidden (can be reopened later if needed)
```

---

### <span id="containsPoint"></span>bool **containsPoint** ( x: `int`, y: `int` ) const

Checks if a point (in screen coordinates) is within window bounds. Useful for determining if mouse is over window.

**Parameters:**
- `x` (int, **required**): Screen X coordinate
- `y` (int, **required**): Screen Y coordinate

Returns `bool` - `true` if point is inside window, `false` otherwise

**Example:**
```javascript
if (propertyWindow.containsPoint(mouseX, mouseY)) {
  console.log('Mouse is over property window');
}
```

---

### <span id="handleMouseWheel"></span>bool **handleMouseWheel** ( delta: `int` )

Handles mouse wheel events for scrolling (not yet implemented).

**Parameters:**
- `delta` (int, **required**): Scroll delta (positive = scroll up, negative = scroll down)

Returns `bool` - `true` if scroll was consumed, `false` otherwise

**Example:**
```javascript
// TODO: Implement scrolling for overflowing content
propertyWindow.handleMouseWheel(delta);
```

**Note:** Currently returns `false` (no implementation). Future enhancement for scrollable content.

---

## Common Workflows

### Opening Property Window for Trigger Edit

```javascript
// In LevelEditor.js - when user clicks event flag
const trigger = eventManager.getTrigger(triggerId);

if (trigger) {
  // Close existing window if open
  if (this.eventPropertyWindow) {
    this.eventPropertyWindow.close();
  }
  
  // Open new window at center of screen
  const windowX = width / 2 - 150; // Center horizontally
  const windowY = height / 2 - 200; // Center vertically
  
  this.eventPropertyWindow = new EventPropertyWindow(
    windowX, windowY, 300, 400, 
    trigger, this.eventManager
  );
}
```

---

### Integrating into Level Editor Render Loop

```javascript
// In LevelEditor.js - render() method
render() {
  // ... other rendering code ...
  
  // Render property window (always renders on top)
  if (this.eventPropertyWindow && this.eventPropertyWindow.isVisible) {
    this.eventPropertyWindow.render();
  }
}
```

---

### Handling Click Events from Level Editor

```javascript
// In LevelEditor.js - handleClick() method
handleClick(x, y) {
  // Check if property window consumed the click
  if (this.eventPropertyWindow && this.eventPropertyWindow.isVisible) {
    const relX = x - this.eventPropertyWindow.x;
    const relY = y - this.eventPropertyWindow.y;
    
    if (this.eventPropertyWindow.handleClick(relX, relY)) {
      return; // Click consumed by window
    }
  }
  
  // ... handle other clicks (terrain, flags, etc.) ...
}
```

---

### Editing Spatial Trigger Radius with Real-Time Preview

```javascript
// Open property window
const trigger = eventManager.getTrigger('trigger_spatial_001');
const propertyWindow = new EventPropertyWindow(100, 100, 300, 400, trigger, eventManager);

// User edits radius in window (editForm.condition.radius = 150)
// EventFlagRenderer automatically detects open window and renders preview

// In EventFlagRenderer.js - renderEventFlags()
if (levelEditor.eventPropertyWindow && levelEditor.eventPropertyWindow.isVisible) {
  const editForm = levelEditor.eventPropertyWindow.editForm;
  const previewRadius = editForm.condition.radius;
  
  // Render saved radius (yellow dashed)
  stroke(255, 255, 0, 50);
  drawingContext.setLineDash([10, 5]);
  circle(screenX, screenY, trigger.condition.radius * 2);
  
  // Render preview radius (orange solid)
  fill(255, 165, 0, 80);
  stroke(255, 165, 0, 150);
  drawingContext.setLineDash([]);
  circle(screenX, screenY, previewRadius * 2);
}

// User clicks "Save Changes" → preview becomes new saved radius
```

---

### Deleting a Trigger

```javascript
// User clicks Delete button in property window
propertyWindow.deleteTrigger();

// Internally calls:
// eventManager.deleteTrigger(trigger.id);
// this.close();

// Trigger removed from EventManager, flag removed from map
```

---

## Notes

- **Isolated Editing**: `editForm` is a deep copy of trigger, preventing accidental modification until save
- **Validation**: Input validation prevents invalid values (e.g., negative radius)
- **Real-Time Preview**: Works with EventFlagRenderer to show visual preview of radius changes
- **No Dragging Yet**: `isDragging` property exists but dragging not implemented (planned enhancement)
- **No Scrolling Yet**: `handleMouseWheel()` exists but scrolling not implemented (for future content overflow)
- **Type-Specific UI**: Renders different input fields based on trigger type (spatial, time, flag, viewport)
- **Action Feedback**: Console logs provide feedback for save/delete/cancel actions

---

## Related Docs

- [EventManager API](EventManager_API_Reference.md) - CRUD operations for events and triggers
- [EventFlagRenderer](EventFlagRenderer_API.md) - Visual rendering of event flags (planned)
- [Level Editor Setup](../LEVEL_EDITOR_SETUP.md) - Overall Level Editor architecture
- [Level Editor Roadmap](../checklists/roadmaps/LEVEL_EDITOR_ROADMAP.md) - Development phases
