# Entity Palette List View & Custom Entities - Feature Enhancement Checklist

**Feature**: EntityPalette List View + Custom Entity Save/Load System + Group Selection  
**Priority**: HIGH (Major UX Improvement + New Feature)  
**Date Created**: October 31, 2025  
**Estimated Time**: 16-20 hours  
**Depends On**: ENTITY_PAINTER_UI_INTEGRATION_CHECKLIST.md (✅ Complete)  
**Current Status**: � **TDD GREEN PHASE - Phase 1.2 COMPLETE**  
**Last Updated**: October 31, 2025

---

## 🚀 Current Progress & Handoff Status

### ✅ Completed (Phase 1.1 - TDD Red)
- [x] Created Phase 1 unit tests: `test/unit/ui/entityPaletteListView.test.js`
- [x] Tests written FIRST (TDD Red phase)
- [x] **Test Results**: 6 passing / 11 failing (EXPECTED - need implementation)
- [x] All visual mockups created and approved by user
- [x] Cursor following requirement added to checklist
- [x] Group selection system fully designed

### ✅ Completed (Phase 1.2 - Implementation)
- [x] Modified `Classes/ui/EntityPalette.js` to implement list view
- [x] Updated `render()` method - list layout with 64x64 sprites, full names, type info, properties
- [x] Updated `getContentSize()` method - dynamic height calculation based on item count
- [x] Updated `handleClick()` method - list item click detection
- [x] Fixed test file to require actual EntityPalette class
- [x] Fixed test coordinates for accurate click detection testing
- [x] **Test Results**: 17/17 passing ✅

### ✅ Completed (Phase 5.3 - Keyboard Shortcuts)
- [x] ToastNotification system (36 unit tests + 19 integration tests)
- [x] ShortcutManager.handleKeyPress() method (25 unit tests)
- [x] EntityPalette keyboard shortcut methods (selectEntity, getSelectedEntity, clearSelection, deleteSelectedEntity, registerKeyboardShortcuts)
- [x] **Test Results**: 19/19 integration tests passing ✅
- [x] Delete key shortcut for custom entity deletion
- [x] Escape key shortcut to clear selection
- [x] ShortcutManager respects action return values (false = not handled, continue to next shortcut)

### ✅ Completed (Phase 1.2A - Cursor Following Tests & Requirements)
- [x] **NEW REQUIREMENT**: Shift+click for multiple entity placements (keep attached to cursor)
- [x] Created unit tests: `test/unit/ui/entityPaletteCursorFollowing.test.js` (15 tests)
- [x] Tests for entity attachment to cursor (single and group)
- [x] Tests for normal click behavior (place and detach)
- [x] Tests for shift+click behavior (place and keep attached for multiple placements)
- [x] Tests for cancellation (Escape, right-click, UI button)
- [x] Tests for shift key detection using `keyIsDown(SHIFT)`
- [x] Edge case tests (inactive attachment, null properties, empty groups)
- [x] **Test Results**: 15/15 passing ✅
- [x] Updated checklist requirement #7 with shift+click behavior
- [x] Updated Key Design Decisions → Cursor Following System section
- [x] Updated Implementation Pattern code with `shiftPressed` parameter

### � Next Action Required (Phase 1.3 - Integration Tests)
**CRITICAL**: The next agent should create integration tests for list view with real component interactions.

**File to modify**: `Classes/ui/EntityPalette.js` (if exists) or create it

**Methods to implement**:
1. `render(x, y, width, height)` - List view instead of grid
2. `getContentSize(width)` - Dynamic height based on template count
3. `handleClick(clickX, clickY, panelX, panelY, panelWidth)` - List item detection

**Run tests after implementation**:
```bash
npx mocha "test/unit/ui/entityPaletteListView.test.js"
```

**Expected outcome**: All 17 tests should pass (6 already passing + 11 currently failing)

### 📊 Test Failure Summary (What Needs Implementation)
1. ❌ 64x64 sprite rendering
2. ❌ Full entity name rendering  
3. ❌ Entity type information display
4. ❌ Custom properties display (faction, health, etc.)
5. ❌ Additional description display
6. ❌ Gold border selection highlighting
7. ❌ Dynamic height calculation for many items
8. ❌ Click detection on first list item
9. ❌ Click detection on second list item
10. ❌ Template ID selection update on click
11. ❌ Dynamic panel height based on template count

### 📁 Files Created This Session
1. `test/unit/ui/entityPaletteListView.test.js` (329 lines) - Phase 1 unit tests
2. `test/e2e/screenshots/entity_palette_group_selection_mockup.html` - Group selection mockup
3. Updated this checklist with cursor following and group selection

### 🎯 User Requirements Confirmed
- ✅ List view design approved ("EXACTLY what I want")
- ✅ Custom entities feature approved
- ✅ Group selection feature approved
- ✅ Cursor following requirement added (click entity → attach to cursor → paint on grid click)

---

## 📍 Quick Navigation for Next Agent

**START HERE**: [Phase 1.2 Implementation](#12-implement-list-view-️-next-step)

**Key Files**:
- Tests: `test/unit/ui/entityPaletteListView.test.js` (written, 11 failing)
- Implementation: `Classes/ui/EntityPalette.js` (needs modification)
- Mockups: `test/e2e/screenshots/entity_palette_*.html` (3 files, all approved)

**Test Command**:
```bash
npx mocha "test/unit/ui/entityPaletteListView.test.js"
```

**Expected Outcome**: 17/17 tests passing after implementation

**Handoff Document**: See `HANDOFF_ENTITY_PALETTE_SESSION.md` for detailed session summary

---

## Summary

**Current State**: EntityPalette shows compact 32x32 grid with 3-letter abbreviations

**New Requirements**:
1. **List View**: Replace grid with detailed list showing 64x64 sprites + full entity info
2. **Custom Entities Category**: New 4th category (💾) for saving custom-configured entities
3. **Save/Load System**: LocalStorage persistence for custom entities
4. **CRUD Operations**: Create, Rename, Delete custom entities with confirmation prompts
5. **Group Selection**: Select multiple entities on grid, store as group with relative positions
6. **Dynamic Button**: "Add New" / "Store Selected Entity" / "Store Selected Entities (N)"
7. **Cursor Following**: When user clicks entity/group in palette, sprites attach to cursor and follow until:
   - User clicks grid → entities painted at cursor position (maintaining formation for groups), detached from cursor
   - User clicks grid while holding shift key → entities painted at cursor position (maintaining formation for groups)
   - User clicks any UI button → cancel placement, detach from cursor
   - User presses Escape or right-clicks → cancel placement, detach from cursor

**Visual Mockups**:
- Basic list view: `test/e2e/screenshots/entity_palette_mockup.html`
- Custom entities: `test/e2e/screenshots/entity_palette_custom_mockup.html`
- Group selection: `test/e2e/screenshots/entity_palette_group_selection_mockup.html`

---

## Key Design Decisions

### 1. List View Layout (Replaces Grid)
**Template Item Structure**:
```
┌──────────────────────────────────────────────────┐
│  ┌────────┐  {ENTITY NAME} (16px, bold, gold)   │
│  │ 64x64  │  {ENTITY TYPE} (13px, gray)         │
│  │ Sprite │  {CUSTOM INFO} (12px, italic, gray) │
│  └────────┘  {ADDITIONAL} (11px, light gray)    │
└──────────────────────────────────────────────────┘
```

**Benefits**:
- Larger sprites (64x64 vs 32x32) - easier to see
- Full entity names (no abbreviations)
- Type information ("Entity: Ant", "Building: Anthill")
- Custom properties ("Faction: Player", "Health: 100")
- Descriptions help understand purpose
- Scrollable for many entities
- Better hover/selection UX

### 2. Custom Entities Category Structure
**Category Button**: 4th button with 💾 icon

**Custom Entity Item Layout**:
```
┌──────────────────────────────────────────────────┐
│ Name: {CUSTOM NAME}  [✏️ Rename]            [✕] │
│ ───────────────────────────────────────────────  │
│  ┌────────┐  {ENTITY NAME}                      │
│  │ 64x64  │  {ENTITY TYPE}                      │
│  │ Sprite │  {CUSTOM INFO}                      │
│  └────────┘  {ADDITIONAL}                       │
└──────────────────────────────────────────────────┘
```

**Features**:
- Custom name header (user-defined)
- Rename button (opens inline editor or modal)
- Delete button (✕) with confirmation prompt
- Shows underlying entity template + custom properties
- Scrollable list
- "Add New Custom Entity" button at bottom of panel

### 3. Custom Entity Data Model

**Single Entity**:
```javascript
{
  id: 'custom_uuid_1234',          // Unique ID
  customName: 'My Elite Soldier',  // User-defined name
  isGroup: false,                  // Single entity
  baseTemplateId: 'ant_soldier',   // Base template
  properties: {                     // Overridden properties
    health: 200,
    movementSpeed: 50,
    damage: 30,
    faction: 'player'
  },
  createdAt: '2025-10-31T12:00:00Z',
  lastModified: '2025-10-31T14:30:00Z'
}
```

**Entity Group** (Multiple entities with relative positions):
```javascript
{
  id: 'custom_group_1730400000_abc123',    // Unique ID
  customName: 'Defense Formation',         // User-defined name
  isGroup: true,                           // Group of entities
  entities: [                              // Array of entities
    {
      baseTemplateId: 'ant_soldier',
      position: { x: 0, y: 0 },           // Origin (first selected)
      properties: {
        health: 200,
        faction: 'player',
        movementSpeed: 50
      }
    },
    {
      baseTemplateId: 'ant_soldier',
      position: { x: 2, y: 0 },           // Offset +2 right
      properties: {
        health: 200,
        faction: 'player'
      }
    },
    {
      baseTemplateId: 'ant_worker',
      position: { x: 1, y: 1 },           // Offset +1 right, +1 down
      properties: {
        health: 100,
        faction: 'player'
      }
    }
  ],
  createdAt: '2025-10-31T12:00:00Z',
  lastModified: '2025-10-31T12:00:00Z'
}
```

**Key Points**:
- `isGroup: true` identifies entity groups
- Single entities: `baseTemplateId` + `properties`
- Groups: `entities[]` array with `position` offsets
- First entity in group is origin (0, 0)
- Other entities stored as relative grid offsets
- When placing: user clicks origin, game places all entities maintaining formation

### 4. LocalStorage Persistence
**Storage Key**: `'antGame_customEntities'`

**Operations**:
- `saveCustomEntity(entity)` - Add new or update existing
- `loadCustomEntities()` - Load from LocalStorage on init
- `deleteCustomEntity(id)` - Remove from storage + memory
- `renameCustomEntity(id, newName)` - Update name

### 5. Group Selection Algorithm

**Selection Detection**:
```javascript
// Level Editor provides selected entities
const selectedEntities = levelEditor.getSelectedEntities();
// Returns: [{ entity: antObj, gridX: 10, gridY: 15 }, ...]
```

**Relative Position Calculation**:
```javascript
function calculateRelativePositions(selectedEntities) {
  if (selectedEntities.length === 0) return [];
  if (selectedEntities.length === 1) {
    // Single entity - no relative positions needed
    return [{ ...selectedEntities[0], position: { x: 0, y: 0 } }];
  }
  
  // Find origin (topmost-leftmost entity)
  let minX = Infinity, minY = Infinity;
  selectedEntities.forEach(sel => {
    if (sel.gridY < minY || (sel.gridY === minY && sel.gridX < minX)) {
      minX = sel.gridX;
      minY = sel.gridY;
    }
  });
  
  // Calculate offsets
  return selectedEntities.map(sel => ({
    baseTemplateId: sel.entity.templateId,
    position: {
      x: sel.gridX - minX,  // Offset from origin
      y: sel.gridY - minY
    },
    properties: sel.entity.getProperties() // Current properties
  }));
}
```

**Group Placement Algorithm**:
```javascript
function placeGroup(originGridX, originGridY, groupData) {
  const placedEntities = [];
  
  groupData.entities.forEach(entityData => {
    const finalX = originGridX + entityData.position.x;
    const finalY = originGridY + entityData.position.y;
    
    // Instantiate entity at final position
    const entity = createEntity(
      entityData.baseTemplateId,
      finalX * TILE_SIZE,  // Convert grid to world coords
      finalY * TILE_SIZE,
      entityData.properties
    );
    
    placedEntities.push(entity);
  });
  
  return placedEntities;
}
```

**Button State Logic**:
```javascript
function getButtonText() {
  const selected = levelEditor.getSelectedEntities();
  
  if (selected.length === 0) {
    return { text: '➕ Add New Custom Entity', style: 'green' };
  } else if (selected.length === 1) {
    return { text: '💾 Store Selected Entity', style: 'blue' };
  } else {
    return { text: `💾 Store Selected Entities (${selected.length})`, style: 'blue' };
  }
}
```

### 6. Cursor Following System

**User Workflow**:
1. User clicks entity/group in EntityPalette
2. Sprites attach to cursor (ghost preview)
3. Sprites follow cursor maintaining relative positions
4. User action determines outcome:
   - **Click grid** → Paint entities at cursor position, save to JSON, **detach from cursor**
   - **Shift+Click grid** → Paint entities at cursor position, save to JSON, **keep attached for multiple placements**
   - **Click UI button** → Cancel placement, clear cursor
   - **Press Escape/Right-click** → Cancel placement, clear cursor

**Visual Feedback**:
- Semi-transparent sprites (50% opacity)
- Maintain formation for groups
- Grid-snapped positioning (align to tile grid)
- Highlight valid/invalid placement zones
- Visual indicator when shift is held (optional: brighter tint or border)

**Implementation Pattern**:
```javascript
// EntityPalette - When user clicks template
handleTemplateClick(template) {
  if (template.isGroup) {
    levelEditor.attachToMouseGroup(template.entities);
  } else {
    levelEditor.attachToMouseSingle(template.baseTemplateId, template.properties);
  }
}

// LevelEditor - Cursor attachment
attachToMouseGroup(entities) {
  this._cursorAttachment = {
    type: 'group',
    entities: entities,
    active: true
  };
}

attachToMouseSingle(templateId, properties) {
  this._cursorAttachment = {
    type: 'single',
    templateId: templateId,
    properties: properties,
    active: true
  };
}

// LevelEditor - Render attached sprites
renderCursorAttachment() {
  if (!this._cursorAttachment || !this._cursorAttachment.active) return;
  
  const mouseGridX = Math.floor(mouseX / TILE_SIZE);
  const mouseGridY = Math.floor(mouseY / TILE_SIZE);
  
  push();
  tint(255, 128); // 50% opacity
  
  if (this._cursorAttachment.type === 'group') {
    this._cursorAttachment.entities.forEach(entityData => {
      const drawX = (mouseGridX + entityData.position.x) * TILE_SIZE;
      const drawY = (mouseGridY + entityData.position.y) * TILE_SIZE;
      renderSprite(entityData.baseTemplateId, drawX, drawY);
    });
  } else {
    renderSprite(this._cursorAttachment.templateId, mouseGridX * TILE_SIZE, mouseGridY * TILE_SIZE);
  }
  
  pop();
}

// LevelEditor - Handle placement
handleGridClick(gridX, gridY, shiftPressed = false) {
  if (!this._cursorAttachment || !this._cursorAttachment.active) return false;
  
  if (this._cursorAttachment.type === 'group') {
    placeGroup(gridX, gridY, this._cursorAttachment.entities);
  } else {
    placeSingleEntity(gridX, gridY, this._cursorAttachment.templateId, this._cursorAttachment.properties);
  }
  
  // Only clear if shift is NOT pressed (allows multiple placements)
  if (!shiftPressed) {
    clearCursorAttachment();
  }
  
  return true; // Handled
}

// Cancel on UI click, Escape, or right-click
clearCursorAttachment() {
  this._cursorAttachment = null;
}
```

**Cancellation Detection**:
- **UI Button Click**: Any button click clears cursor attachment
- **Escape Key**: `keyPressed()` detects `keyCode === ESCAPE`
- **Right Click**: `mousePressed()` detects `mouseButton === RIGHT`

**Shift-Key Detection**:
- Check `keyIsDown(SHIFT)` during grid click
- If true: place entity but keep attachment active
- If false: place entity and clear attachment

**Storage Format**: JSON string
**Max Size Consideration**: ~5MB LocalStorage limit (thousands of entities)

### 5. User Workflows

**Creating Custom Entity**:
1. Configure entity in Entity Painter (select template, modify properties)
2. Click "💾 Custom" category button
3. Click "➕ Add New Custom Entity" at bottom
4. Modal opens: "Enter name for custom entity"
5. User types name, clicks "Save"
6. Entity added to custom list
7. Saved to LocalStorage

**Using Custom Entity**:
1. Click "💾 Custom" category
2. Click desired custom entity in list
3. Entity Painter loads with custom configuration
4. Place in level as normal

**Renaming Custom Entity**:
1. Click "💾 Custom" category
2. Click "✏️ Rename" button on entity
3. Inline editor appears OR modal opens
4. User types new name, presses Enter or clicks Save
5. Name updated in list + LocalStorage

**Deleting Custom Entity**:
1. Click "💾 Custom" category
2. Click "✕" button on entity
3. Modal appears: "⚠️ Delete Custom Entity? Are you sure you want to delete '{name}'? This action cannot be undone."
4. User clicks "Cancel" (dismisses) or "Delete" (confirms)
5. Entity removed from list + LocalStorage

---

## Implementation Notes

### Phase 1: List View Refactor

**EntityPalette.js render() changes**:
```javascript
render(x, y, width, height) {
  push();
  
  // Render CategoryRadioButtons at top (unchanged)
  if (this.categoryButtons) {
    this.categoryButtons.render(x, y, width);
  }
  
  const buttonHeight = this.categoryButtons ? this.categoryButtons.height : 30;
  const templates = this.getCurrentTemplates();
  
  // NEW: List view instead of grid
  let listY = y + buttonHeight + 8; // Start below buttons
  const itemHeight = 80; // 64px sprite + 16px padding
  const padding = 8;
  
  templates.forEach((template, i) => {
    const isSelected = template.id === this._selectedTemplateId;
    
    // Background
    fill(isSelected ? '#4a4a00' : '#383838');
    stroke(isSelected ? '#ffd700' : 'transparent');
    strokeWeight(2);
    rect(x + padding, listY, width - padding * 2, itemHeight, 6);
    
    // Sprite (64x64)
    fill(100);
    rect(x + padding + 8, listY + 8, 64, 64);
    // TODO: Render actual sprite image
    
    // Text info
    const textX = x + padding + 8 + 64 + 12;
    const textY = listY + 12;
    
    fill('#ffd700');
    textSize(16);
    text(template.name, textX, textY); // Full name
    
    fill('#aaa');
    textSize(13);
    text(`Entity: ${template.type}`, textX, textY + 20);
    
    fill('#888');
    textSize(12);
    const customInfo = `Faction: ${template.properties?.faction || 'N/A'}`;
    text(customInfo, textX, textY + 36);
    
    fill('#666');
    textSize(11);
    text(template.additionalInfo || '', textX, textY + 52);
    
    listY += itemHeight + padding;
  });
  
  pop();
}
```

**getContentSize() changes**:
```javascript
getContentSize(width = 200) {
  const templates = this.getCurrentTemplates();
  const buttonHeight = this.categoryButtons ? this.categoryButtons.height : 30;
  const itemHeight = 80;
  const padding = 8;
  const listHeight = templates.length * (itemHeight + padding);
  
  // Add space for "Add New" button if custom category
  const addButtonHeight = this.currentCategory === 'custom' ? 50 : 0;
  
  return {
    width: width,
    height: buttonHeight + listHeight + addButtonHeight + 16
  };
}
```

**handleClick() changes**:
```javascript
handleClick(clickX, clickY, panelX, panelY, panelWidth) {
  const relX = clickX - panelX;
  const relY = clickY - panelY;
  const buttonHeight = this.categoryButtons ? this.categoryButtons.height : 30;
  
  // Category buttons (unchanged)
  if (relY < buttonHeight && this.categoryButtons) {
    const categoryClicked = this.categoryButtons.handleClick(relX, relY, 0, 0, panelWidth);
    if (categoryClicked) {
      return { type: 'category', category: categoryClicked.id };
    }
  }
  
  // NEW: List view click detection
  if (relY > buttonHeight + 8) {
    const templates = this.getCurrentTemplates();
    const itemHeight = 80;
    const padding = 8;
    const listY = relY - buttonHeight - 8;
    const index = Math.floor(listY / (itemHeight + padding));
    
    if (index >= 0 && index < templates.length) {
      // Check for rename/delete button clicks if custom category
      if (this.currentCategory === 'custom') {
        // Check if clicked on rename button (right side of header)
        // Check if clicked on delete button (far right of header)
        // Return { type: 'rename', entity } or { type: 'delete', entity }
      }
      
      this._selectedTemplateId = templates[index].id;
      return { type: 'template', template: templates[index] };
    }
    
    // Check for "Add New" button at bottom
    if (this.currentCategory === 'custom') {
      const addButtonY = buttonHeight + templates.length * (itemHeight + padding) + 16;
      if (relY > addButtonY && relY < addButtonY + 50) {
        return { type: 'addCustomEntity' };
      }
    }
  }
  
  return null;
}
```

### Phase 2: Custom Entities Category

**CategoryRadioButtons.js additions**:
```javascript
constructor(onChangeCallback = null) {
  this.categories = [
    { id: 'entities', label: 'Entities', icon: '🐜' },
    { id: 'buildings', label: 'Buildings', icon: '🏠' },
    { id: 'resources', label: 'Resources', icon: '🌳' },
    { id: 'custom', label: 'Custom', icon: '💾' } // NEW
  ];
  
  this.selected = 'entities';
  this.onChangeCallback = onChangeCallback;
  this.height = 30;
}
```

**EntityPalette.js custom category**:
```javascript
_loadTemplates() {
  return {
    entities: [ /* existing */ ],
    buildings: [ /* existing */ ],
    resources: [ /* existing */ ],
    custom: this._loadCustomEntities() // NEW: Load from LocalStorage
  };
}

_loadCustomEntities() {
  try {
    const stored = localStorage.getItem('antGame_customEntities');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading custom entities:', error);
  }
  return []; // Empty array if none saved
}

_saveCustomEntities() {
  try {
    const customEntities = this._templates.custom || [];
    localStorage.setItem('antGame_customEntities', JSON.stringify(customEntities));
  } catch (error) {
    console.error('Error saving custom entities:', error);
  }
}
```

### Phase 3: CRUD Operations

**Add New Custom Entity**:
```javascript
addCustomEntity(customName, baseTemplateId, properties) {
  const newEntity = {
    id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    customName: customName,
    baseTemplateId: baseTemplateId,
    properties: { ...properties },
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };
  
  this._templates.custom.push(newEntity);
  this._saveCustomEntities();
  
  return newEntity;
}
```

**Rename Custom Entity**:
```javascript
renameCustomEntity(entityId, newName) {
  const entity = this._templates.custom.find(e => e.id === entityId);
  if (entity) {
    entity.customName = newName;
    entity.lastModified = new Date().toISOString();
    this._saveCustomEntities();
    return true;
  }
  return false;
}
```

**Delete Custom Entity**:
```javascript
deleteCustomEntity(entityId) {
  const index = this._templates.custom.findIndex(e => e.id === entityId);
  if (index !== -1) {
    this._templates.custom.splice(index, 1);
    this._saveCustomEntities();
    return true;
  }
  return false;
}
```

### Phase 4: Modal Dialogs

**Create Modal Component** (`Classes/ui/ModalDialog.js`):
```javascript
class ModalDialog {
  constructor(options) {
    this.title = options.title;
    this.message = options.message;
    this.buttons = options.buttons || []; // [{ label, callback, style }]
    this.inputField = options.inputField || null; // { label, defaultValue }
    this.visible = false;
    this.inputValue = '';
  }
  
  show() {
    this.visible = true;
    this.inputValue = this.inputField?.defaultValue || '';
  }
  
  hide() {
    this.visible = false;
  }
  
  render() {
    if (!this.visible) return;
    
    // Overlay
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);
    
    // Modal box
    const modalW = 400;
    const modalH = 200;
    const modalX = (width - modalW) / 2;
    const modalY = (height - modalH) / 2;
    
    fill(45, 45, 45);
    stroke(100);
    rect(modalX, modalY, modalW, modalH, 8);
    
    // Title
    fill(255, 215, 0);
    textSize(18);
    text(this.title, modalX + 20, modalY + 30);
    
    // Message
    fill(200);
    textSize(14);
    text(this.message, modalX + 20, modalY + 60);
    
    // Input field (if present)
    if (this.inputField) {
      fill(60);
      rect(modalX + 20, modalY + 90, modalW - 40, 30);
      fill(255);
      text(this.inputValue, modalX + 25, modalY + 110);
    }
    
    // Buttons
    let buttonX = modalX + modalW - 20;
    this.buttons.forEach(btn => {
      const btnW = 80;
      buttonX -= btnW + 10;
      
      fill(btn.style === 'danger' ? color(160, 0, 0) : color(80));
      rect(buttonX, modalY + modalH - 50, btnW, 35, 4);
      
      fill(255);
      textSize(14);
      text(btn.label, buttonX + btnW/2, modalY + modalH - 30);
    });
  }
  
  handleClick(mouseX, mouseY) {
    if (!this.visible) return null;
    
    // Check button clicks
    // Check input field clicks
    // Return { action: 'confirm/cancel', value: inputValue }
  }
}
```

**Delete Confirmation Usage**:
```javascript
const deleteModal = new ModalDialog({
  title: '⚠️ Delete Custom Entity?',
  message: `Are you sure you want to delete "${entityName}"?\nThis action cannot be undone.`,
  buttons: [
    { label: 'Cancel', callback: () => deleteModal.hide(), style: 'normal' },
    { label: 'Delete', callback: () => { this.deleteCustomEntity(id); deleteModal.hide(); }, style: 'danger' }
  ]
});
```

**Add New Entity Modal**:
```javascript
const addModal = new ModalDialog({
  title: '➕ Add New Custom Entity',
  message: 'Enter a name for this custom entity:',
  inputField: { label: 'Name', defaultValue: 'My Custom Entity' },
  buttons: [
    { label: 'Cancel', callback: () => addModal.hide(), style: 'normal' },
    { label: 'Save', callback: () => { this.addCustomEntity(addModal.inputValue); addModal.hide(); }, style: 'primary' }
  ]
});
```

---

## Testing Strategy

### Unit Tests (TDD Red → Green)
**EntityPalette List View**:
- `test/unit/ui/entityPaletteListView.test.js` (17 tests) ✅ PASSING
  - List item rendering (64x64 sprites, text info)
  - Scrolling behavior
  - Click detection on list items
  - Dynamic height calculation

**Cursor Following** ✅ COMPLETE:
- `test/unit/ui/entityPaletteCursorFollowing.test.js` (15 tests) ✅ PASSING
  - Entity attachment to cursor (single and group)
  - Normal click behavior (place and detach)
  - **Shift+click behavior (place and keep attached)** - NEW REQUIREMENT
  - Cancellation (Escape, right-click, UI button)
  - Shift key detection using `keyIsDown(SHIFT)`
  - Edge cases (inactive attachment, null properties, empty groups)

### Integration Tests ✅ COMPLETE
**EntityPalette + List View**:
- `test/integration/ui/entityPaletteListViewIntegration.integration.test.js` (15 tests) ✅ PASSING
  - Real component rendering with actual templates
  - Category switching with different template counts
  - Click detection across all categories
  - Dynamic panel resizing for different categories
  - Template data integrity verification

**Entity Painting & Save Workflow**:
- `test/integration/levelEditor/entityPaintingSave.integration.test.js` (25 tests) ✅ PASSING
  - Entity painting to grid (8 tests)
  - JSON export with entities (7 tests)
  - Save workflow verification (3 tests)
  - Entity loading from JSON (3 tests)
  - Edge cases (4 tests)

**Custom Entities**:
- `test/unit/ui/entityPaletteCustom.test.js` (20 tests)
  - LocalStorage save/load
  - addCustomEntity()
  - renameCustomEntity()
  - deleteCustomEntity()
  - Custom category rendering
  - "Add New" button rendering

**Group Selection**:
- `test/unit/ui/entityPaletteGroupSelection.test.js` (18 tests)
  - Selection detection from Level Editor
  - Relative position calculation
  - Origin entity detection (topmost-leftmost)
  - Group data structure creation
  - Button text updates (dynamic)
  - Group badge rendering
  - Group sprite rendering (2x2 mini grid)
- `test/unit/levelEditor/groupPlacer.test.js` (10 tests)
  - Group placement at origin
  - Entity offset calculation
  - Mixed entity types in group
  - Properties preservation

**ModalDialog**:
- `test/unit/ui/modalDialog.test.js` (12 tests)
  - Modal show/hide
  - Button rendering
  - Input field handling
  - Click detection
  - Callback execution

### Integration Tests
**EntityPalette + CustomEntities**:
- `test/integration/ui/customEntitiesIntegration.integration.test.js` (15 tests)
  - Full CRUD workflow
  - LocalStorage persistence
  - Modal interactions
  - Category switching with custom entities

### E2E Tests with Screenshots
**List View**:
- `test/e2e/ui/pw_entity_palette_list_view.js` (8 tests)
  - Entities list view rendering
  - Buildings list view rendering
  - Resources list view rendering
  - List item selection highlighting
  - Scroll behavior with many entities
  - Screenshots showing full entity info

**Custom Entities**:
- `test/e2e/ui/pw_entity_palette_custom_entities.js` (12 tests)
  - Custom category empty state
  - Add new custom entity (modal interaction)
  - Rename custom entity (inline editor)
  - Delete custom entity (confirmation modal)
  - Custom entity list rendering
  - Custom entity selection
  - LocalStorage persistence across page reloads
  - Screenshots showing all UI states

**Group Selection**:
- `test/e2e/ui/pw_entity_palette_group_selection.js` (10 tests)
  - Place entities on grid
  - Select multiple entities
  - Button text changes to "Store Selected Entities (N)"
  - Store group with custom name
  - Verify group in LocalStorage
  - Verify group badge and sprite in list
  - Select and place group
  - Verify formation maintained
  - Screenshots: selection, storage, placement

---

## Phases

### Phase 1: List View Refactor ⏳ **CURRENT PHASE**

#### 1.1 Write Unit Tests (TDD Red) ✅ **COMPLETE**
- [x] **Create**: `test/unit/ui/entityPaletteListView.test.js` ✅
- [x] **Test**: List item rendering (17 tests total) ✅
  - Should render 64x64 sprite placeholder
  - Should render full entity name (no abbreviation)
  - Should render entity type
  - Should render custom info (faction, etc.)
  - Should render additional description
  - Should calculate correct item height (80px)
  - Should handle empty template list
  - Should highlight selected item with gold border
  - Should handle scrolling with many items
  - Should calculate dynamic panel height
  - Should detect clicks on list items (first, second)
  - Should update selected template ID on click
  - Edge cases: null sprites, null properties, null descriptions
- [x] **Run**: `npx mocha "test/unit/ui/entityPaletteListView.test.js"` ✅
  - **Result**: 6 passing / 11 failing (EXPECTED - TDD Red phase complete)

#### 1.2 Implement List View ✅ **COMPLETE**

- [x] **Locate/Create**: `Classes/ui/EntityPalette.js`
  - File exists and modified
  
- [x] **Modify**: `EntityPalette.js render()` method
  - Replace grid layout with list layout
  - Render 64x64 sprites (use `rect()` for placeholder, later add actual sprites)
  - Render text info with `text()`:
    - Line 1: Full entity name (16px, bold, gold `#ffd700`)
    - Line 2: Entity type (13px, gray `#aaa`)
    - Line 3: Custom info from properties (12px, italic, gray `#888`)
    - Line 4: Additional description (11px, light gray `#666`)
  - Add selection highlighting: gold border `#ffd700` if selected
  - Add hover effects (optional for now)
  - Item height: 80px per item (64px sprite + 16px padding)
  - Padding: 8px between items
  
- [x] **Modify**: `EntityPalette.js getContentSize()`
  - Calculate height based on list items: `buttonHeight + (itemCount * (itemHeight + padding)) + margin`
  - Item height: 80px, padding: 8px, button height: 30px, margin: 16px
  - Return `{ width: width, height: calculatedHeight }`
  
- [x] **Modify**: `EntityPalette.js handleClick()`
  - Detect clicks on list items
  - Calculate Y offset from panel top: `relY = clickY - panelY`
  - Skip category buttons: `if (relY < buttonHeight) { /* handle category */ }`
  - Calculate list item index: `index = Math.floor((relY - buttonHeight - 8) / (itemHeight + padding))`
  - Validate index: `if (index >= 0 && index < templates.length)`
  - Update selection: `this._selectedTemplateId = templates[index].id`
  - Return `{ type: 'template', template: templates[index] }`
  
- [x] **Run**: Unit tests (should pass all 17 tests)
  ```bash
  npx mocha "test/unit/ui/entityPaletteListView.test.js"
  ```
  - Expected: 17/17 passing ✅ ACHIEVED

#### 1.3 Integration Tests ✅ **COMPLETE**
- [x] **Create**: `test/integration/ui/entityPaletteListViewIntegration.integration.test.js`
- [x] **Test**: Real component interaction (15 tests)
  - List view renders with real templates
  - Click detection works across all categories
  - Selection persists across category switches
  - Panel resizes correctly for different template counts
  - Template data integrity verified
- [x] **Run**: Integration tests (should pass) ✅ 15/15 PASSING

#### 1.4 E2E Tests with Screenshots ✅ **COMPLETE**
- [x] **Create**: `test/e2e/ui/pw_entity_palette_list_view.js`
- [x] **Test**: Browser visual verification (8 tests)
  - Entities list view screenshot ✅
  - Buildings list view screenshot ✅
  - Resources list view screenshot ✅
  - Selected item screenshot (gold border) ✅
  - 64x64 sprite size verification ✅
  - Full entity names verification ✅
  - Scroll behavior verification ✅
- [x] **Run**: E2E tests (should pass with screenshots) ✅ 8/8 PASSING

#### 1.5 Entity Painting & Save Integration ✅ **COMPLETE**
- [x] **Create**: `test/integration/levelEditor/entityPaintingSave.integration.test.js`
- [x] **Test**: Complete paint-to-save workflow (25 tests)
  - Entity painting to grid with correct grid coordinates ✅
  - Grid position to world coordinate conversion ✅
  - Entity retrieval from grid by position ✅
  - Multiple entities at different positions ✅
  - Property preservation when painting ✅
  - Unique ID generation per entity ✅
  - JSON export with grid positions (not world pixels) ✅
  - Entity type and templateId in JSON ✅
  - All spawn properties included ✅
  - Save workflow with file export ✅
  - Entity loading from JSON at correct positions ✅
  - Properties preserved through save/load cycle ✅
  - Edge cases: (0,0) position, large coordinates, minimal properties ✅
- [x] **Run**: Integration tests ✅ 25/25 PASSING

---

### Phase 2: Custom Entities Category ✅ **COMPLETE**

#### 2.1 Write Unit Tests (TDD Red) ✅ **COMPLETE**
- [x] **Create**: `test/unit/ui/entityPaletteCustomCategory.test.js` (22 tests)
- [x] **Test**: Custom category functionality
  - Should add 4th category button (💾)
  - Should load custom entities from LocalStorage
  - Should save custom entities to LocalStorage
  - Should render empty state message
  - Should render custom entity header with name
  - Should render rename button
  - Should render delete button
  - Should render "Add New" button at bottom
  - Should handle missing LocalStorage gracefully
  - Should handle corrupted JSON gracefully
  - Should handle localStorage quota exceeded
  - Should detect clicks on rename, delete, "Add New" buttons
- [x] **Run**: Tests (4 passing / 18 failing - TDD Red phase complete)

#### 2.2 Implement Custom Category ✅ **COMPLETE**
- [x] **Modify**: `CategoryRadioButtons.js`
  - Added 4th category: `{ id: 'custom', label: 'Custom', icon: '💾' }`
- [x] **Modify**: `EntityPalette.js`
  - Added `_loadCustomEntities()` method (read from LocalStorage)
  - Added `_saveCustomEntities()` method (write to LocalStorage)
  - Added custom category to `_templates` object
  - Render custom entity header (name + rename/delete buttons)
  - Render "Add New Custom Entity" button at bottom
  - Handle empty state ("No custom entities yet")
  - Updated `handleClick()` to detect rename, delete, "Add New" button clicks
- [x] **Run**: Unit tests ✅ **22/22 PASSING**

#### 2.3 LocalStorage Integration ✅ **COMPLETE**
- [x] **Test**: LocalStorage persistence
  - Save custom entities and verify in LocalStorage ✅
  - Load custom entities on page reload ✅
  - Handle LocalStorage quota exceeded ✅
  - Handle corrupted JSON data ✅
  - Handle missing localStorage gracefully ✅

---

### Phase 2A: Group Selection & Storage ✅ **COMPLETE**

**Feature**: Select multiple entities on grid and store as group with relative positions

#### 2A.1 Write Unit Tests (TDD Red) ✅ **COMPLETE**
- [x] **Create**: `test/unit/ui/entityPaletteGroupSelection.test.js` (20 tests)
- [x] **Test**: Group selection functionality
  - Should detect when Level Editor has selected entities
  - Should calculate relative positions from origin (first entity)
  - Should store multiple entities as group
  - Should create group data structure with `isGroup: true`
  - Should store each entity's position offset
  - Should preserve entity properties in group
  - Should handle single entity (no group needed)
  - Should handle 2+ entities (create group)
  - Should find topmost-leftmost entity as origin (0, 0)
  - Should calculate grid offsets for other entities
  - Should change button text: "Store Selected Entity" (singular)
  - Should change button text: "Store Selected Entities (N)" (plural)
  - Should default to "Add New Custom Entity" when no selection
  - Should render group badge in list (e.g., "GROUP (4)")
  - Should handle negative grid coordinates
- [x] **Run**: Tests ✅ **1 passing / 19 failing (TDD Red phase complete)**

#### 2A.2 Implement Group Detection ✅ **COMPLETE**
- [x] **Modify**: `EntityPalette.js`
  - Added `getSelectedEntitiesFromLevelEditor()` method
    - Query Level Editor's selection system via global `levelEditor`
    - Return array of selected entity objects with grid positions
  - Added `_calculateRelativePositions(entities)` utility
    - Find origin entity (topmost-leftmost)
    - Calculate offsets for all other entities
    - Return array with relative positions
  - Added `createGroupDataStructure(customName)` method
    - Creates single entity structure (isGroup: false) for 1 entity
    - Creates group structure (isGroup: true) for 2+ entities
    - Generates unique ID with timestamp
    - Includes createdAt timestamp
  - Added `getAddButtonText()` method
    - Returns dynamic text based on Level Editor selection count
    - "Add New" (0), "Store Selected Entity" (1), "Store Selected Entities (N)" (2+)
  - Updated render() to show group badge "GROUP (N)" for group entities
  - Updated "Add New" button to use dynamic text and color (blue for store, green for add)
- [x] **Run**: Unit tests ✅ **20/20 PASSING**

#### 2A.3 Implement Group Storage ✅ **COMPLETE**
- [x] **Created**: `test/unit/ui/entityPaletteGroupStorage.test.js` (15 tests)
- [x] **Added**: `EntityPalette.addCustomEntityGroup(name, entities)` method
  - Creates group with `isGroup: true`, `entities[]` array
  - Each entity in group has: `baseTemplateId`, `position: {x, y}`, `properties`
  - Generates unique ID with timestamp
  - Includes createdAt timestamp
  - Saves to LocalStorage
- [x] **Added**: `EntityPalette.deleteCustomEntity(entityId)` method
  - Deletes custom entities AND groups
  - Removes from templates array and LocalStorage
- [x] **Added**: `EntityPalette.renameCustomEntity(entityId, newName)` method
  - Renames custom entities AND groups
  - Updates lastModified timestamp
  - Persists to LocalStorage
- [x] **Test Results**: 15/15 passing ✅

#### 2A.4 Implement Dynamic Button Text ✅ **COMPLETE (Already Implemented)**
- [x] **Implemented**: `EntityPalette.getAddButtonText()` method (from Phase 2A.2)
  - Returns dynamic text based on Level Editor selection count
  - "➕ Add New Custom Entity" (0 selected)
  - "💾 Store Selected Entity" (1 selected)
  - "💾 Store Selected Entities (N)" (2+ selected)
- [x] **Integrated**: render() method calls getAddButtonText()
- [x] **Tested**: Covered by entityPaletteGroupSelection.test.js (20 tests passing)

#### 2A.5 Implement Group Rendering ✅ **COMPLETE**
- [x] **Modified**: `EntityPalette.render()` method
  - Renders group badge "GROUP (N)" for isGroup === true (line 681-684)
  - Calls `_renderGroupSprites()` for groups (line 663-666)
  - Renders normal 64x64 sprite placeholder for single entities
- [x] **Added**: `EntityPalette._renderGroupSprites(x, y, entities)` helper method
  - Renders 2x2 mini sprite grid (28x28 each)
  - Shows first 4 entities in group
  - Displays "+N" indicator if more than 4 entities
  - Different shades for visual distinction
- [x] **Tested**: Covered by existing group selection tests (20/20 passing)

#### 2A.6 Implement Group Placement ✅ **COMPLETE**
- [x] **Created**: `Classes/levelEditor/GroupPlacer.js` utility class
  - `placeGroup(originGridX, originGridY, groupData)` static method
  - Iterates through group's entities array
  - Calculates final position = origin + offset for each entity
  - Instantiates entities at calculated positions
  - Applies entity properties
  - Returns array of created entity instances
- [x] **Tested**: `test/unit/levelEditor/groupPlacer.test.js` ✅ **13/13 PASSING**
- [x] **Integrated**: Level Editor's entity placement system (line 683-716 in LevelEditor.js)
  - Checks if selected template has `isGroup: true`
  - If group: uses `GroupPlacer.placeGroup()` and adds all entities to tracking
  - If single: uses existing `EntityPainter.placeEntity()`
  - Registers all placed entities with spatial grid
  - Shows notification with entity count for groups

#### 2A.7 E2E Tests with Screenshots ✅ **COMPLETE**
- [x] **Created**: `test/e2e/ui/pw_entity_palette_group_simple.js` (simplified test)
- [x] **Test**: Group storage workflow (6 tests)
  - Verify Entity Palette classes loaded
  - Store group with `addCustomEntityGroup()` (3 entities)
  - Verify group saved to LocalStorage
  - Verify group data structure correct
  - Use GroupPlacer to place group
  - Verify formation maintained (width 4 tiles)
  - Delete group
  - **Screenshots**: All states (stored, verified, placed, deleted)
- [x] **Test Results**: 6/6 passing ✅
- [x] **Screenshots**: 4 success screenshots saved
- [x] **Note**: Simplified test avoids Level Editor initialization complexity by directly instantiating EntityPalette

---

### Phase 3: CRUD Operations ✅ **COMPLETE**

#### 3.1 Write Unit Tests (TDD Red) ✅
- [x] **Created**: `test/unit/ui/customEntitiesCRUD.test.js` (406 lines, 25 tests)
- [x] **Test**: CRUD operations (25 tests - expanded from 15)
  - `addCustomEntity()` creates with unique ID
  - `addCustomEntity()` saves to LocalStorage
  - `renameCustomEntity()` updates name
  - `renameCustomEntity()` updates lastModified timestamp
  - `deleteCustomEntity()` removes from list
  - `deleteCustomEntity()` removes from LocalStorage
  - `getCustomEntity()` retrieves by ID
  - Should generate unique IDs
  - Should preserve properties on rename
  - Should not allow duplicate names
- [x] **Run**: Tests (3/25 passing - expected failures)

#### 3.2 Implement CRUD Methods ✅
- [x] **Added**: `EntityPalette.addCustomEntity(name, baseTemplateId, properties)`
- [x] **Updated**: `EntityPalette.renameCustomEntity(id, newName)` - Added duplicate name check
- [x] **Existing**: `EntityPalette.deleteCustomEntity(id)` - Already implemented in Phase 2A
- [x] **Added**: `EntityPalette.getCustomEntity(id)`
- [x] **Added**: ID generation utility in `addCustomEntity()` method
- [x] **Run**: Unit tests - **25/25 passing** ✅

#### 3.3 Click Handling for Custom Actions ✅
- [x] **Verified**: `EntityPalette.handleClick()` already implements detection
  - Detect rename button clicks (return `{ type: 'rename', entity }`)
  - Detect delete button clicks (return `{ type: 'delete', entity }`)
  - Detect "Add New" button clicks (return `{ type: 'addCustomEntity' }`)
- [x] **Created**: `test/unit/ui/customEntitiesClickHandling.test.js` (11 tests)
- [x] **Run**: Click detection tests - **11/11 passing** ✅

---

### Phase 4: Modal Dialogs ✅ **COMPLETE**

#### 4.1 Write Unit Tests (TDD Red) ✅
- [x] **Created**: `test/unit/ui/modalDialog.test.js` (386 lines)
- [x] **Test**: Modal functionality (23 tests - expanded from 12)
  - Initialization (5 tests)
  - Show/hide modal (4 tests)
  - Button detection (3 tests)
  - Keyboard input (4 tests)
  - Input validation (4 tests)
  - Rendering (3 tests)
- [x] **Run**: Tests (0/23 passing - all skipped, expected)

#### 4.2 Implement ModalDialog Component ✅
- [x] **Created**: `Classes/ui/ModalDialog.js` (283 lines)
  - `show()` method - Configure and display modal
  - `hide()` method - Hide modal and clear errors
  - `isVisible()` method - Check visibility state
  - `render()` method - Draw overlay + modal box + title + message + input + buttons
  - `handleClick()` method - Button detection with validation
  - `handleKeyPress()` method - Enter/Esc/Backspace support
  - `handleTextInput()` method - Append text to input field
  - `validateInput()` method - Custom validation with error messages
  - Input field handling with placeholder text
- [x] **Run**: Unit tests - **23/23 passing** ✅

#### 4.3 Integrate Modals with EntityPalette ✅
- [x] **Added**: `EntityPalette.showAddCustomEntityModal(onConfirm)` method
  - Title: "➕ Add New Custom Entity"
  - Input field: "Enter name for this custom entity"
  - Validation: Name required, no duplicates
  - Buttons: Cancel, Save
- [x] **Added**: `EntityPalette.showRenameEntityModal(entity, onConfirm)` method
  - Title: "✏️ Rename Custom Entity"
  - Input field with current name
  - Validation: Name required, no duplicates (excluding self)
  - Buttons: Cancel, Save
- [x] **Added**: `EntityPalette.showDeleteEntityModal(entity, onConfirm)` method
  - Title: "⚠️ Delete Custom Entity?" (or "Delete Custom Group?")
  - Message: "Are you sure you want to delete '{name}'? This action cannot be undone."
  - Buttons: Cancel, Delete
- [x] **Added**: `EntityPalette.getModal()` method - Returns modal instance for rendering
- [x] **Created**: `test/integration/ui/entityPaletteModalIntegration.integration.test.js` (17 tests)
- [x] **Run**: Modal integration tests - **17/17 passing** ✅

---

### Phase 5: Integration & Polish ⏳

#### 5.1 Full Integration Tests ✅
- [x] **Created**: `test/integration/ui/customEntitiesFullWorkflow.integration.test.js` (460 lines)
- [x] **Test**: Complete workflows (19 tests - expanded from 15)
  - Add new custom entity → appears in list → persists in LocalStorage
  - Rename custom entity → name updates in list + LocalStorage
  - Delete custom entity → modal confirms → removed from list + LocalStorage
  - Switch categories → custom entities persist
  - Page reload → custom entities restored from LocalStorage
  - Multiple custom entities → all display correctly
  - Custom entity selection → loads in Entity Painter
  - Custom entity with modified properties → properties preserved

#### 5.2 E2E Tests with Screenshots ✅
- [x] **Created**: `test/e2e/ui/pw_custom_entities_workflow.js` (365 lines)
- [x] **Test**: Full user workflows (6 E2E tests with screenshots)
  - Test 1: Custom category empty state (screenshot)
  - Test 2: Click "Add New" button → modal opens (screenshot)
  - Test 3: Enter name → click Save → entity appears (screenshot)
  - Test 4: Click rename button → modal opens (screenshot)
  - Test 5: Edit name → save → name updates (screenshot)
  - Test 6: Click delete button → confirmation modal (screenshot)
  - Test 7: Click Delete → entity removed (screenshot)
  - Test 8: Create multiple custom entities (screenshot)
  - Test 9: Reload page → entities persist (screenshot)
  - Test 10: Select custom entity → properties loaded (screenshot)
  - Test 11: Switch to custom category with entities (screenshot)
  - Test 12: Scroll through many custom entities (screenshot)

#### 5.3 Polish & UX
- [x] **Add**: Toast notifications ("Custom entity saved!", "Entity deleted") ✅ **COMPLETE (36 unit tests passing)**
- [x] **Add**: EntityPalette integration with ToastNotification ✅ **COMPLETE (19 integration tests passing)**
- [x] **Add**: Keyboard shortcuts via ShortcutManager integration ✅ **COMPLETE (19 integration tests passing)**
  - [x] Extend ShortcutManager with `handleKeyPress()` method (TDD) ✅ **COMPLETE (25 unit tests passing)**
  - [x] Register Delete key shortcut for custom entity deletion ✅ **COMPLETE**
  - [x] Register Escape key shortcut to clear selection ✅ **COMPLETE**
  - [x] Integration tests for keyboard shortcuts with EntityPalette ✅ **COMPLETE (19 integration tests passing)**
- [x] **Add**: Tooltip on hover showing full entity details ✅ **COMPLETE (31 unit tests passing)**
  - [x] Unit tests for tooltip state management (TDD) ✅
  - [x] Tests for tooltip content generation ✅
  - [x] Tests for hover detection over list items ✅
  - [x] Tests for tooltip positioning (cursor offset, screen edge avoidance) ✅
  - [x] Tests for tooltip rendering (multi-line, background) ✅
  - [x] Implement `showTooltip(content, x, y)` method ✅
  - [x] Implement `hideTooltip()` method ✅
  - [x] Implement `getTooltipContent(template)` method ✅
  - [x] Implement `handleMouseMove()` for hover detection ✅
  - [x] Implement `_renderTooltip()` for rendering ✅
- [x] **Add**: Loading spinner for LocalStorage operations ✅ **COMPLETE (28 unit tests passing)**
  - [x] Unit tests for spinner state management (show/hide) ✅
  - [x] Tests for spinner animation (rotation, wrapping) ✅
  - [x] Tests for spinner rendering (overlay, arcs, text) ✅
  - [x] Tests for LocalStorage integration (save, load, delete) ✅
  - [x] Implement `showLoadingSpinner()` method ✅
  - [x] Implement `hideLoadingSpinner()` method ✅
  - [x] Implement `updateLoadingSpinner()` method ✅
  - [x] Implement `renderLoadingSpinner()` method ✅
  - [x] Integrate spinner with `_saveCustomEntities()` ✅
  - [x] Integrate spinner with `_loadCustomEntities()` ✅
- [x] **Add**: Search/filter custom entities ✅ **COMPLETE (35 unit tests passing)**
  - [x] Unit tests for search state management (query, clear) ✅
  - [x] Tests for filter logic (name, ID, case-insensitive, partial) ✅
  - [x] Tests for search UI rendering (box, placeholder, clear button) ✅
  - [x] Tests for integration with getCurrentTemplates() ✅
  - [x] Implement `setSearchQuery(query)` method ✅
  - [x] Implement `clearSearch()` method ✅
  - [x] Implement `filterTemplates(templates, query)` method ✅
  - [x] Implement `renderSearchBox(x, y, width)` method ✅
  - [x] Implement `handleSearchInput(input)` method ✅
  - [x] Implement `handleClearSearch()` method ✅
  - [x] Integrate with handleClick() for clear button ✅
  - [x] Update getCurrentTemplates() to apply search filter ✅
  - [x] Update getContentSize() to account for search box ✅
- [x] **Add**: Drag-to-reorder custom entities (optional) ✅ **COMPLETE (39 unit tests passing)**
  - 11 methods: startDrag, endDrag, updateDragPosition, handleMousePressed, handleMouseDragged, handleMouseReleased, getDropIndex, reorderCustomEntity, renderDragGhost, renderDropIndicator, updateCursor
  - Test coverage: Drag state (7), detection (7), drop zones (5), reordering logic (8), visual feedback (6), render integration (2), edge cases (4)
  - Drag ghost: Semi-transparent preview with gold border
  - Drop indicator: Gold line with arrow indicators
  - Cursor feedback: MOVE cursor during drag
  - LocalStorage persistence: Auto-save after reordering
- [ ] **Add**: Export/Import custom entities (JSON file) (optional)

---

### Phase 6: Documentation ⏳

#### 6.1 Update CHANGELOG.md
- [ ] **Add to [Unreleased] → User-Facing Changes**:
  ```markdown
  - **EntityPalette List View**: Replaced compact grid with detailed list view
    - Larger 64x64 sprites (was 32x32)
    - Full entity names (no more 3-letter abbreviations)
    - Entity type display ("Entity: Ant", "Building: Anthill")
    - Custom properties shown ("Faction: Player", "Health: 100")
    - Additional descriptions for each entity
    - Better hover and selection UX
    - Scrollable for many entities
  
  - **Custom Entities System**: Save and reuse custom-configured entities
    - New 💾 Custom category (4th category button)
    - Save current entity configuration with custom name
    - Rename saved entities (inline editor)
    - Delete with confirmation prompt
    - LocalStorage persistence (survives page reloads)
    - "Add New Custom Entity" button at panel bottom
    - Empty state message when no custom entities
    - Import/Export custom entities as JSON
  ```

- [ ] **Add to [Unreleased] → Developer-Facing Changes**:
  ```markdown
  - **EntityPalette Refactor**: Grid → List view rendering
    - `render()` method rewritten for list layout
    - `getContentSize()` calculates dynamic height based on item count
    - `handleClick()` updated for list item detection
    - New methods: `_loadCustomEntities()`, `_saveCustomEntities()`
    - CRUD methods: `addCustomEntity()`, `renameCustomEntity()`, `deleteCustomEntity()`
  
  - **ModalDialog Component**: New reusable modal system
    - File: `Classes/ui/ModalDialog.js`
    - Features: Title, message, input fields, buttons
    - Methods: `show()`, `hide()`, `render()`, `handleClick()`
    - Used for: Delete confirmation, add/rename entity
  
  - **CategoryRadioButtons**: Added 4th category (Custom)
    - New category: `{ id: 'custom', icon: '💾' }`
    - Tests updated for 4 buttons instead of 3
  ```

#### 6.2 Create API Reference
- [ ] **Create**: `docs/api/EntityPalette_CustomEntities_API.md`
- [ ] **Document**:
  - `addCustomEntity(customName, baseTemplateId, properties)` → `customEntity`
  - `renameCustomEntity(entityId, newName)` → `boolean`
  - `deleteCustomEntity(entityId)` → `boolean`
  - `getCustomEntity(entityId)` → `customEntity | null`
  - `_loadCustomEntities()` → `customEntity[]`
  - `_saveCustomEntities()` → `void`
  - Custom entity data structure
  - LocalStorage schema

- [ ] **Create**: `docs/api/ModalDialog_API.md`
- [ ] **Document**:
  - Constructor options
  - `show()`, `hide()` methods
  - `render()` method
  - `handleClick()`, `handleKeyPress()` methods
  - Button configuration
  - Input field handling
  - Callback execution

#### 6.3 Update User Guide
- [ ] **Create**: `docs/guides/CUSTOM_ENTITIES_USER_GUIDE.md`
- [ ] **Include**:
  - How to create custom entities
  - How to rename/delete custom entities
  - How to use custom entities in levels
  - Import/export workflow
  - Tips for organizing custom entities
  - Screenshots of all UI states

#### 6.4 Update Checklists
- [ ] **Mark complete**: This checklist
- [ ] **Update**: `ENTITY_PAINTER_CHECKLIST.md` (add new features)

---

## Success Criteria

- [ ] All 92+ tests passing (unit + integration + E2E)
- [ ] List view renders correctly for all 3 standard categories
- [ ] Custom category functional with save/load
- [ ] CRUD operations work (add, rename, delete)
- [ ] Modals display correctly with proper styling
- [ ] LocalStorage persistence works across page reloads
- [ ] Screenshots captured for all UI states
- [ ] No console errors
- [ ] Performance: <16ms render time for 50+ entities
- [ ] Documentation complete and accurate

---

## Notes

**Mockup Files**:
- Basic list view: `test/e2e/screenshots/entity_palette_mockup.html`
- Custom entities: `test/e2e/screenshots/entity_palette_custom_mockup.html`

**Open mockups in browser**:
```bash
start test/e2e/screenshots/entity_palette_mockup.html
start test/e2e/screenshots/entity_palette_custom_mockup.html
```

**Test counts**: ~92 tests total
- Unit: 54 tests (15 list view + 12 custom category + 15 CRUD + 12 modal)
- Integration: 25 tests (10 list view + 15 custom workflow)
- E2E: 20 tests (8 list view + 12 custom entities)

**Estimated time**: 12-16 hours
- Phase 1 (List View): 4 hours
- Phase 2 (Custom Category): 3 hours
- Phase 3 (CRUD): 2 hours
- Phase 4 (Modals): 3 hours
- Phase 5 (Integration): 2 hours
- Phase 6 (Documentation): 2 hours

**Priority**: HIGH - Major UX improvement + new feature that enables custom level design
