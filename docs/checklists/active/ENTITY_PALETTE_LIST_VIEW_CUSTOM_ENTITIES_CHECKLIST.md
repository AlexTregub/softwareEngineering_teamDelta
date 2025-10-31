# Entity Palette List View & Custom Entities - Feature Enhancement Checklist

**Feature**: EntityPalette List View + Custom Entity Save/Load System  
**Priority**: HIGH (Major UX Improvement + New Feature)  
**Date Created**: October 31, 2025  
**Estimated Time**: 12-16 hours  
**Depends On**: ENTITY_PAINTER_UI_INTEGRATION_CHECKLIST.md (✅ Complete)

---

## Summary

**Current State**: EntityPalette shows compact 32x32 grid with 3-letter abbreviations

**New Requirements**:
1. **List View**: Replace grid with detailed list showing 64x64 sprites + full entity info
2. **Custom Entities Category**: New 4th category (💾) for saving custom-configured entities
3. **Save/Load System**: LocalStorage persistence for custom entities
4. **CRUD Operations**: Create, Rename, Delete custom entities with confirmation prompts

**Visual Mockups**:
- Basic list view: `test/e2e/screenshots/entity_palette_mockup.html`
- Custom entities: `test/e2e/screenshots/entity_palette_custom_mockup.html`

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
```javascript
{
  customEntities: [
    {
      id: 'custom_uuid_1234',          // Unique ID
      customName: 'My Elite Squad',    // User-defined name
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
  ]
}
```

### 4. LocalStorage Persistence
**Storage Key**: `'antGame_customEntities'`

**Operations**:
- `saveCustomEntity(entity)` - Add new or update existing
- `loadCustomEntities()` - Load from LocalStorage on init
- `deleteCustomEntity(id)` - Remove from storage + memory
- `renameCustomEntity(id, newName)` - Update name

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
- `test/unit/ui/entityPaletteListView.test.js` (15 tests)
  - List item rendering (64x64 sprites, text info)
  - Scrolling behavior
  - Click detection on list items
  - Dynamic height calculation

**Custom Entities**:
- `test/unit/ui/entityPaletteCustom.test.js` (20 tests)
  - LocalStorage save/load
  - addCustomEntity()
  - renameCustomEntity()
  - deleteCustomEntity()
  - Custom category rendering
  - "Add New" button rendering

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

---

## Phases

### Phase 1: List View Refactor ⏳

#### 1.1 Write Unit Tests (TDD Red)
- [ ] **Create**: `test/unit/ui/entityPaletteListView.test.js`
- [ ] **Test**: List item rendering (15 tests)
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
- [ ] **Run**: `npx mocha "test/unit/ui/entityPaletteListView.test.js"` (expect failures)

#### 1.2 Implement List View
- [ ] **Modify**: `EntityPalette.js render()` method
  - Replace grid layout with list layout
  - Render 64x64 sprites
  - Render text info (name, type, custom, additional)
  - Add selection highlighting
  - Add hover effects
- [ ] **Modify**: `EntityPalette.js getContentSize()`
  - Calculate height based on list items (80px each)
  - Add padding between items
- [ ] **Modify**: `EntityPalette.js handleClick()`
  - Detect clicks on list items
  - Calculate correct item index from Y position
- [ ] **Run**: Unit tests (should pass)

#### 1.3 Integration Tests
- [ ] **Create**: `test/integration/ui/entityPaletteListViewIntegration.integration.test.js`
- [ ] **Test**: Real component interaction (10 tests)
  - List view renders with real templates
  - Click detection works across all categories
  - Selection persists across category switches
  - Panel resizes correctly for different template counts
- [ ] **Run**: Integration tests (should pass)

#### 1.4 E2E Tests with Screenshots
- [ ] **Create**: `test/e2e/ui/pw_entity_palette_list_view.js`
- [ ] **Test**: Browser visual verification (8 tests)
  - Entities list view screenshot
  - Buildings list view screenshot
  - Resources list view screenshot
  - Selected item screenshot (gold border)
  - Hover effect screenshot
  - Scrolling with many items screenshot
- [ ] **Run**: E2E tests (should pass with screenshots)

---

### Phase 2: Custom Entities Category ⏳

#### 2.1 Write Unit Tests (TDD Red)
- [ ] **Create**: `test/unit/ui/entityPaletteCustomCategory.test.js`
- [ ] **Test**: Custom category functionality (12 tests)
  - Should add 4th category button (💾)
  - Should load custom entities from LocalStorage
  - Should save custom entities to LocalStorage
  - Should render empty state message
  - Should render custom entity header with name
  - Should render rename button
  - Should render delete button
  - Should render "Add New" button at bottom
  - Should handle missing LocalStorage gracefully
- [ ] **Run**: Tests (expect failures)

#### 2.2 Implement Custom Category
- [ ] **Modify**: `CategoryRadioButtons.js`
  - Add 4th category: `{ id: 'custom', label: 'Custom', icon: '💾' }`
- [ ] **Modify**: `EntityPalette.js`
  - Add `_loadCustomEntities()` method (read from LocalStorage)
  - Add `_saveCustomEntities()` method (write to LocalStorage)
  - Add custom category to `_templates` object
  - Render custom entity header (name + buttons)
  - Render "Add New Custom Entity" button at bottom
  - Handle empty state ("No custom entities yet")
- [ ] **Run**: Unit tests (should pass)

#### 2.3 LocalStorage Integration
- [ ] **Test**: LocalStorage persistence
  - Save custom entities and verify in LocalStorage
  - Load custom entities on page reload
  - Handle LocalStorage quota exceeded
  - Handle corrupted JSON data

---

### Phase 3: CRUD Operations ⏳

#### 3.1 Write Unit Tests (TDD Red)
- [ ] **Create**: `test/unit/ui/customEntitiesCRUD.test.js`
- [ ] **Test**: CRUD operations (15 tests)
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
- [ ] **Run**: Tests (expect failures)

#### 3.2 Implement CRUD Methods
- [ ] **Add**: `EntityPalette.addCustomEntity(name, baseTemplateId, properties)`
- [ ] **Add**: `EntityPalette.renameCustomEntity(id, newName)`
- [ ] **Add**: `EntityPalette.deleteCustomEntity(id)`
- [ ] **Add**: `EntityPalette.getCustomEntity(id)`
- [ ] **Add**: ID generation utility
- [ ] **Run**: Unit tests (should pass)

#### 3.3 Click Handling for Custom Actions
- [ ] **Modify**: `EntityPalette.handleClick()`
  - Detect rename button clicks (return `{ type: 'rename', entity }`)
  - Detect delete button clicks (return `{ type: 'delete', entity }`)
  - Detect "Add New" button clicks (return `{ type: 'addCustomEntity' }`)
- [ ] **Test**: Click detection tests

---

### Phase 4: Modal Dialogs ⏳

#### 4.1 Write Unit Tests (TDD Red)
- [ ] **Create**: `test/unit/ui/modalDialog.test.js`
- [ ] **Test**: Modal functionality (12 tests)
  - Should show/hide modal
  - Should render title
  - Should render message
  - Should render input field
  - Should render buttons
  - Should detect button clicks
  - Should execute button callbacks
  - Should handle keyboard input (Enter to confirm, Esc to cancel)
  - Should validate input (empty names, special characters)
- [ ] **Run**: Tests (expect failures)

#### 4.2 Implement ModalDialog Component
- [ ] **Create**: `Classes/ui/ModalDialog.js`
  - `show()` method
  - `hide()` method
  - `render()` method (overlay + modal box)
  - `handleClick()` method (button detection)
  - `handleKeyPress()` method (Enter/Esc)
  - Input field handling
- [ ] **Run**: Unit tests (should pass)

#### 4.3 Integrate Modals with EntityPalette
- [ ] **Add**: Delete confirmation modal
  - "⚠️ Delete Custom Entity?"
  - Message: "Are you sure you want to delete '{name}'? This action cannot be undone."
  - Buttons: Cancel (gray), Delete (red)
- [ ] **Add**: Add new entity modal
  - "➕ Add New Custom Entity"
  - Input field: "Enter name for this custom entity"
  - Validation: Name required, no duplicates
  - Buttons: Cancel, Save
- [ ] **Add**: Rename entity modal (or inline editor)
  - Input field with current name
  - Buttons: Cancel, Save
- [ ] **Test**: Modal integration tests

---

### Phase 5: Integration & Polish ⏳

#### 5.1 Full Integration Tests
- [ ] **Create**: `test/integration/ui/customEntitiesFullWorkflow.integration.test.js`
- [ ] **Test**: Complete workflows (15 tests)
  - Add new custom entity → appears in list → persists in LocalStorage
  - Rename custom entity → name updates in list + LocalStorage
  - Delete custom entity → modal confirms → removed from list + LocalStorage
  - Switch categories → custom entities persist
  - Page reload → custom entities restored from LocalStorage
  - Multiple custom entities → all display correctly
  - Custom entity selection → loads in Entity Painter
  - Custom entity with modified properties → properties preserved

#### 5.2 E2E Tests with Screenshots
- [ ] **Create**: `test/e2e/ui/pw_custom_entities_workflow.js`
- [ ] **Test**: Full user workflows (12 tests)
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
- [ ] **Add**: Loading spinner for LocalStorage operations
- [ ] **Add**: Toast notifications ("Custom entity saved!", "Entity deleted")
- [ ] **Add**: Keyboard shortcuts (Delete key for selected entity)
- [ ] **Add**: Drag-to-reorder custom entities
- [ ] **Add**: Export/Import custom entities (JSON file)
- [ ] **Add**: Search/filter custom entities (if many)
- [ ] **Add**: Tooltip on hover showing full entity details

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
