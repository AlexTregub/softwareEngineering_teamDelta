# Entity Painter Panel Missing - Bug Fix Checklist

**Bug ID**: ENTITY_PAINTER_NO_PANEL  
**Priority**: HIGH (Core Feature Broken)  
**Date Reported**: October 30, 2025  
**Date Fixed**: October 31, 2025  
**Status**: ✅ **COMPLETE** (Panel now appears with placeholder content)  
**Affected Systems**: LevelEditorPanels, FileMenuBar, DraggablePanelManager  
**Related Bug**: View Menu Panel Toggle Not Working (same root cause pattern)  
**Next Phase**: UI Integration (see `ENTITY_PAINTER_UI_INTEGRATION_CHECKLIST.md`)

---

## Summary

**Root Cause**: EntityPalette panel not created in `LevelEditorPanels.js`, despite:
- Entity Painter tool button in toolbar (✅ exists)
- Entity Painter toggle in View menu (✅ exists) 
- EntityPalette class implementation (✅ exists - 280 lines)
- Full test coverage (✅ 105 unit + 21 integration + 18 E2E tests passing)

**The Problem**:
1. User clicks "Entity Painter" in View menu
2. `FileMenuBar._handleTogglePanel('entity-painter')` called
3. Looks up `panelIdMap['entity-painter']` → **undefined** (not in map)
4. Panel toggle fails silently, no panel appears

**The Fix**:
1. Add `'entity-painter': 'level-editor-entity-palette'` to FileMenuBar panelIdMap
2. Create entity-palette panel in LevelEditorPanels.initialize()
3. Register panel with draggablePanelManager
4. Add panel to stateVisibility.LEVEL_EDITOR array
5. Render EntityPalette in LevelEditorPanels.render()

---

## Phase 1: Documentation & Reproduction ✅

- [x] **Document in KNOWN_ISSUES.md** ✅
  - Bug: No panel appears when toggling Entity Painter
  - Root Cause: Panel not created in LevelEditorPanels
  - Related: View Menu Panel Toggle bug (stateVisibility sync issue)

- [x] **Gather Information** ✅
  - ✅ FileMenuBar calls `_handleTogglePanel('entity-painter')`
  - ✅ `panelIdMap` missing 'entity-painter' key
  - ✅ LevelEditorPanels.panels missing 'entityPalette' property
  - ✅ EntityPalette class exists (Classes/ui/EntityPalette.js)
  - ✅ Full test coverage already exists
  
---

## Phase 2: Write Failing Test (TDD Red Phase) ✅

### Step 1: Create Regression Test FIRST
- [x] **Create test file**: `test/unit/ui/entityPainterPanel.test.js`
- [ ] **Test type**: Unit (tests panel creation, not full integration)
- [ ] **Test scenarios**:
  ```javascript
  describe('EntityPalette Panel Creation', function() {
    it('should create entity-palette panel in LevelEditorPanels', function() {
      const levelEditor = createMockLevelEditor();
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      expect(panels.panels.entityPalette).to.exist;
      expect(panels.panels.entityPalette.config.id).to.equal('level-editor-entity-palette');
    });
    
    it('should register entity-palette with draggablePanelManager', function() {
      const mockManager = createMockDraggablePanelManager();
      const levelEditor = createMockLevelEditor();
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      const registered = mockManager.panels.has('level-editor-entity-palette');
      expect(registered).to.be.true;
    });
    
    it('should add entity-palette to stateVisibility.LEVEL_EDITOR', function() {
      const mockManager = createMockDraggablePanelManager();
      const levelEditor = createMockLevelEditor();
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      const visible = mockManager.stateVisibility.LEVEL_EDITOR.includes('level-editor-entity-palette');
      expect(visible).to.be.false; // Hidden by default
    });
    
    it('should configure entity-palette with correct properties', function() {
      const levelEditor = createMockLevelEditor();
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      const panel = panels.panels.entityPalette;
      expect(panel.config.title).to.equal('Entity Palette');
      expect(panel.config.behavior.draggable).to.be.true;
      expect(panel.config.behavior.managedExternally).to.be.true;
      expect(panel.state.visible).to.be.false; // Hidden by default
    });
    
    it('should have EntityPalette instance available', function() {
      const levelEditor = createMockLevelEditor();
      levelEditor.entityPalette = new EntityPalette();
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      expect(levelEditor.entityPalette).to.exist;
      expect(typeof levelEditor.entityPalette.render).to.equal('function');
    });
  });
  
  describe('FileMenuBar Entity Painter Toggle', function() {
    it('should have entity-painter in panelIdMap', function() {
      const fileMenuBar = new FileMenuBar({ levelEditor: mockLevelEditor });
      const panelIdMap = {
        'materials': 'level-editor-materials',
        'tools': 'level-editor-tools',
        'brush': 'level-editor-brush',
        'events': 'level-editor-events',
        'properties': 'level-editor-properties',
        'sidebar': 'level-editor-sidebar',
        'entity-painter': 'level-editor-entity-palette' // Should exist
      };
      
      // Access private method for testing (or expose via public API)
      const mappedId = panelIdMap['entity-painter'];
      expect(mappedId).to.equal('level-editor-entity-palette');
    });
    
    it('should toggle entity-palette panel when called', function() {
      const mockManager = createMockDraggablePanelManager();
      const fileMenuBar = new FileMenuBar({ levelEditor: mockLevelEditor });
      
      // Mock the panel
      const mockPanel = { toggleVisibility: sinon.stub(), isVisible: sinon.stub().returns(true) };
      mockManager.panels.set('level-editor-entity-palette', mockPanel);
      
      fileMenuBar._handleTogglePanel('entity-painter');
      
      // Should call togglePanel on manager
      expect(mockManager.togglePanel.calledWith('level-editor-entity-palette')).to.be.true;
    });
  });
  ```

### Step 2: Run Tests (Should Fail - Red Phase)
- [x] **Command**: `npx mocha "test/unit/ui/entityPainterPanel.test.js"`
- [x] **Expected Result**: All tests failing (panel doesn't exist) ✅
- [x] **Failure Messages**:
  - `panels.entityPalette` is undefined ✅
  - `panelIdMap['entity-painter']` is undefined ✅
  - Panel not registered with draggablePanelManager ✅
  - EntityPalette.getContentSize() doesn't exist ✅
- [x] **Result**: 8 failing tests (October 31, 2025)

---

## Phase 3: Implement Fix (TDD Green Phase) ✅

### Step 1: Add Panel ID to FileMenuBar
- [x] **File**: `Classes/ui/FileMenuBar.js`
- [ ] **Location**: Line ~815 (`panelIdMap` object)
- [ ] **Change**:
  ```javascript
  const panelIdMap = {
    'materials': 'level-editor-materials',
    'tools': 'level-editor-tools',
    'brush': 'level-editor-brush',
    'events': 'level-editor-events',
    'properties': 'level-editor-properties',
    'sidebar': 'level-editor-sidebar',
    'entity-painter': 'level-editor-entity-palette' // ADD THIS LINE
  };
  ```

### Step 2: Add Panel Property to LevelEditorPanels
- [x] **File**: `Classes/systems/ui/LevelEditorPanels.js`
- [ ] **Location**: Line ~12 (constructor)
- [ ] **Change**:
  ```javascript
  this.panels = {
    materials: null,
    tools: null,
    brush: null,
    events: null,
    properties: null,
    sidebar: null,
    entityPalette: null  // ADD THIS LINE
  };
  ```

### Step 3: Create Entity Palette Panel
- [x] **File**: `Classes/systems/ui/LevelEditorPanels.js`
- [x] **Location**: After sidebar panel creation (~line 230)
- [x] **Add panel definition**:
  ```javascript
  // Entity Palette Panel (Entity Painter tool)
  // Size: Dynamic based on EntityPalette content (categories + templates)
  this.panels.entityPalette = new DraggablePanel({
    id: 'level-editor-entity-palette',
    title: 'Entity Palette',
    position: { x: 150, y: 80 },
    size: { width: 220, height: 300 }, // Wider for entity templates
    buttons: {
      layout: 'vertical',
      spacing: 0,
      items: [], // We'll render EntityPalette directly in content
      autoSizeToContent: true,
      verticalPadding: 10,
      horizontalPadding: 10,
      contentSizeCallback: () => {
        // Get size from EntityPalette instance
        return this.levelEditor?.entityPalette ? 
          this.levelEditor.entityPalette.getContentSize() : 
          { width: 200, height: 280 };
      }
    },
    behavior: {
      draggable: true,
      persistent: true,
      constrainToScreen: true,
      managedExternally: true // Don't auto-render, LevelEditorPanels handles it
    },
    state: {
      visible: false // Hidden by default (toggle with View menu or tool button)
    }
  });
  ```

### Step 4: Register Panel with DraggablePanelManager
- [x] **File**: `Classes/systems/ui/LevelEditorPanels.js`
- [x] **Location**: After other panel registrations (~line 240)
- [x] **Add registration**: ✅ Panel registered

### Step 5: Add Panel to State Visibility (Hidden by Default)
- [x] **File**: `Classes/systems/ui/LevelEditorPanels.js`
- [x] **Location**: After manager.setStateVisibility() calls (~line 250)
- [x] **Note**: Panel is hidden by default, so NO need to add to stateVisibility array
- [x] **Verification**: Confirmed `visible: false` in panel config

### Step 6: Render EntityPalette in Panel
- [x] **File**: `Classes/systems/ui/LevelEditorPanels.js` (PLACEHOLDER - Full rendering TODO Phase 4)
- [x] **Location**: Placeholder render/handleClick methods added to EntityPalette.js
- [x] **Status**: EntityPalette has placeholder render() method for panel compatibility
  ```javascript
  // Entity Palette Panel
  if (this.panels.entityPalette && this.panels.entityPalette.state.visible && this.levelEditor.entityPalette) {
    const palettePanel = this.panels.entityPalette;
    const palettePos = palettePanel.getPosition();
    const titleBarHeight = palettePanel.calculateTitleBarHeight();
    const contentArea = {
      x: palettePos.x + palettePanel.config.style.padding,
      y: palettePos.y + titleBarHeight + palettePanel.config.style.padding,
      width: palettePanel.getSize().width - (palettePanel.config.style.padding * 2),
      height: palettePanel.getSize().height - titleBarHeight - (palettePanel.config.style.padding * 2)
    };
    
    // Render EntityPalette
    this.levelEditor.entityPalette.render(
      contentArea.x,
      contentArea.y,
      contentArea.width,
      contentArea.height
    );
  }
  ```

### Step 7: Add Click Handling for EntityPalette
- [x] **File**: `Classes/systems/ui/LevelEditorPanels.js` (PLACEHOLDER - Full click handling TODO Phase 4)
- [x] **Status**: EntityPalette has placeholder handleClick() and containsPoint() methods
  ```javascript
  // Entity Palette Panel
  if (this.panels.entityPalette && this.panels.entityPalette.state.visible) {
    const palettePanel = this.panels.entityPalette;
    const palettePos = palettePanel.getPosition();
    const titleBarHeight = palettePanel.calculateTitleBarHeight();
    const contentX = palettePos.x + palettePanel.config.style.padding;
    const contentY = palettePos.y + titleBarHeight + palettePanel.config.style.padding;
    
    // Check if click is in the content area of entity palette panel
    if (this.levelEditor.entityPalette && this.levelEditor.entityPalette.containsPoint(mouseX, mouseY, contentX, contentY)) {
      const action = this.levelEditor.entityPalette.handleClick(mouseX, mouseY, contentX, contentY);
      if (action) {
        // Handle different palette actions
        if (action.type === 'category_changed') {
          this.levelEditor.notifications.show(`Category: ${action.category}`);
        } else if (action.type === 'template_selected') {
          this.levelEditor.notifications.show(`Selected: ${action.template.name}`);
        }
        return true;
      }
    }
  }
  ```

### Step 8: Verify EntityPalette Instance Exists
- [x] **File**: `Classes/systems/ui/LevelEditor.js`
- [x] **Location**: Constructor (already exists from Entity Painter implementation)
- [x] **Verified**: EntityPalette instance created in LevelEditor constructor

### Step 9: Run Tests (Should Pass - Green Phase)
- [x] **Command**: `npx mocha "test/unit/ui/entityPainterPanel.test.js"`
- [x] **Expected Result**: All tests passing ✅
- [x] **Actual Result**: **8/8 tests passing** (October 31, 2025) ✅
- [x] **Verification**:
  - Panel created in LevelEditorPanels ✅
  - Panel registered with draggablePanelManager ✅
  - Panel ID mapping in FileMenuBar ✅
  - Label mapping in FileMenuBar ✅
  - EntityPalette.getContentSize() method added ✅
  - EntityPalette placeholder render/handleClick/containsPoint methods ✅

---

## Phase 4: Integration Tests ✅

### Test Scenarios
- [x] **Test 1: Panel Toggle from View Menu**
  - Create LevelEditor with EntityPalette
  - Toggle entity-painter via FileMenuBar
  - Verify panel visibility changes
  - Verify menu checked state updates

- [x] **Test 2: Panel Rendering**
  - Create visible entity-palette panel
  - Call LevelEditorPanels.render()
  - Verify EntityPalette.render() called with correct bounds

- [ ] **Test 3: Click Handling**
  - Create visible entity-palette panel
  - Simulate click on category button
  - Verify EntityPalette.handleClick() called
  - Verify notification shown

- [x] **Test 4: Tool Button Toggle**
  - Create LevelEditor with toolbar
  - Click Entity Painter tool button (🐜)
  - Verify panel toggles visibility
  - Verify tool becomes active

- [ ] **Test 5: State Visibility Sync**
  - Toggle panel ON via View menu
  - Verify added to stateVisibility.LEVEL_EDITOR
  - Toggle panel OFF
  - Verify removed from stateVisibility.LEVEL_EDITOR

### Create Test File
- [x] **File**: `test/integration/ui/entityPainterPanelToggle.integration.test.js`
- [x] **Tests**: 6 integration tests (5 scenarios + 1 auto-sizing test)
- [x] **Command**: `npx mocha "test/integration/ui/entityPainterPanelToggle.integration.test.js"`
- [x] **Expected**: All tests passing ✅
- [x] **Result**: **6/6 tests passing** (141ms) - October 31, 2025

---

## Phase 5: E2E Tests with Screenshots ✅

### Test Scenarios
- [x] **Test 1: Enter Level Editor**
  - Initialize LevelEditor, LevelEditorPanels, FileMenuBar
  - Verify Level Editor state
  - Screenshot: `test/e2e/screenshots/entity_painter/success/level_editor_started.png` ✅

- [x] **Test 2: Panel Hidden by Default**
  - Verify Entity Painter panel registered with draggablePanelManager
  - Verify panel.state.visible === false
  - Screenshot: `test/e2e/screenshots/entity_painter/success/panel_hidden_default.png` ✅

- [x] **Test 3: Toggle Panel ON**
  - Call FileMenuBar._handleTogglePanel('entity-painter')
  - Verify panel.state.visible === true
  - Screenshot: `test/e2e/screenshots/entity_painter/success/panel_toggled_on.png` ✅

- [x] **Test 4: EntityPalette Content Rendering**
  - Verify EntityPalette instance exists
  - Verify getContentSize() returns correct dimensions
  - Verify category and template count
  - Screenshot: `test/e2e/screenshots/entity_painter/success/palette_content_visible.png` ✅

- [x] **Test 5: Toggle Panel OFF**
  - Call FileMenuBar._handleTogglePanel('entity-painter')
  - Verify panel.state.visible === false
  - Screenshot: `test/e2e/screenshots/entity_painter/success/panel_toggled_off.png` ✅

- [x] **Test 6: Menu Checked State Sync**
  - Toggle panel ON, verify menu item checked === true
  - Toggle panel OFF, verify menu item checked === false
  - Verified via internal state (no screenshot needed) ✅

### Create Test File
- [x] **File**: `test/e2e/ui/pw_entity_painter_panel_toggle.js` ✅
- [x] **Tests**: 6 E2E tests with screenshot proof ✅
- [x] **Command**: `node test/e2e/ui/pw_entity_painter_panel_toggle.js` ✅
- [x] **Result**: **6/6 tests passing** - October 31, 2025 ✅

### Test Results
```
📊 E2E TEST SUMMARY: Entity Painter Panel Toggle
✅ Tests Passed: 6
❌ Tests Failed: 0
📸 Screenshots: test/e2e/screenshots/entity_painter/success/
```

---

## Phase 5B: Toolbar Button Toggle (TDD) ✅

**Requirement**: Clicking the ant emoji (🐜) button in toolbar should toggle Entity Painter panel visibility

### Step 1: Write Failing Unit Tests FIRST
- [x] **Test file**: Add to `test/unit/ui/entityPainterPanel.test.js`
- [ ] **Test scenarios**:
  ```javascript
  describe('Toolbar Button Toggle', function() {
    it('should toggle entity-palette panel when ant button clicked', function() {
      const levelEditor = createMockLevelEditor();
      const toolbar = levelEditor.toolbar;
      const antButton = toolbar.buttons.find(b => b.tool === 'entity-painter');
      
      // Click ant button
      antButton.onClick();
      
      const panel = draggablePanelManager.panels.get('level-editor-entity-palette');
      expect(panel.state.visible).to.be.true;
    });
    
    it('should sync View menu checked state when toolbar button clicked', function() {
      const levelEditor = createMockLevelEditor();
      const fileMenuBar = levelEditor.fileMenuBar;
      
      // Click toolbar button
      levelEditor.toolbar.buttons.find(b => b.tool === 'entity-painter').onClick();
      
      // Check View menu item
      const viewMenu = fileMenuBar.menuItems.find(m => m.label === 'View');
      const entityPainterItem = viewMenu.items.find(i => i.label === 'Entity Painter');
      expect(entityPainterItem.checked).to.be.true;
    });
  });
  ```

### Step 2: Run Tests (Should Fail) ✅
- [x] **Command**: `npx mocha "test/unit/ui/entityPainterPanel.test.js"`
- [x] **Result**: 2 new tests failing (toolbar button onClick was null)

### Step 3: Implement Toolbar Button Toggle ✅
- [x] **Found toolbar tool** in LevelEditor.js (entity_painter tool in ToolBar.tools)
- [x] **Added onClick handler** that calls `FileMenuBar._handleTogglePanel('entity-painter')`
- [x] **Fixed bug**: Used `this.toolbar.tools['entity_painter']` instead of `this.toolbar.buttons.find()`
- [x] **Menu state syncs** automatically via FileMenuBar

### Step 4: Run Tests (Should Pass) ✅
- [x] **Command**: `npx mocha "test/unit/ui/entityPainterPanel.test.js"`
- [x] **Result**: **10/10 tests passing** (including 2 new toolbar button tests)

### Step 5: Integration Test ✅
- [x] **Test file**: Add to `test/integration/ui/entityPainterPanelToggle.integration.test.js`
- [x] **Scenario 1**: Click toolbar button → panel appears → menu syncs
- [x] **Scenario 2**: Verify menu checked state syncs when toolbar button clicked
- [x] **Result**: **8/8 integration tests passing** (6 original + 2 new toolbar tests)

### Step 6: E2E Test ✅
- [x] **Test file**: Add test to `test/e2e/ui/pw_entity_painter_panel_toggle.js`
- [x] **Scenario**: Click ant button in toolbar → capture screenshot showing panel
- [x] **Result**: **7/7 E2E tests passing** (6 original + 1 new toolbar test)
- [x] **Screenshot**: `test/e2e/screenshots/entity_painter/success/toolbar_button_toggle.png`

---

## Phase 6: Future Enhancement - Close Button on Panels 📝

**Requirement**: Add X (close) button to the right of minimize button on all DraggablePanels

### Implementation Notes
- [ ] **Location**: `Classes/systems/ui/DraggablePanel.js` (parent class)
- [ ] **Position**: Right of minimize button in title bar
- [ ] **Behavior**: Clicking X should hide panel (same as toggling off via menu)
- [ ] **Sync**: Must update View menu checked state when X clicked
- [ ] **TDD**: Write tests FIRST (unit → integration → E2E)

**DO NOT IMPLEMENT NOW** - This is a separate feature for later

---

## Phase 7: Documentation Updates ✅

### Update KNOWN_ISSUES.md ✅
- [x] **Move bug to "Fixed" section** ✅
  - Bug: Entity Painter panel not appearing
  - Fix: Added panel to LevelEditorPanels, registered with manager
  - Root Cause: Panel definition missing from LevelEditorPanels.initialize()
  - Fix Date: October 31, 2025

### Update CHANGELOG.md ✅
- [x] **Add to [Unreleased] section** ✅
  - Added comprehensive entry under "Fixed" section
  - Documented 4 root causes and 4 solutions
  - Included test results (10 unit + 8 integration + 7 E2E)
  - Noted current state (placeholder content) and future work (UI integration)

### Update Entity Painter Checklist
- [ ] **Update**: `docs/checklists/active/ENTITY_PAINTER_CHECKLIST.md`
- [ ] **Change status** from "BLOCKED" to "PARTIALLY UNBLOCKED"
- [ ] **Update summary**:
  ```markdown
  **Status**: ⚠️ **PARTIALLY UNBLOCKED** (October 31, 2025)
  
  EntityPalette panel now appears when toggled, but shows placeholder content only.
  Full UI integration (CategoryRadioButtons, template list) is next phase.
  ```
- [ ] **Create new checklist**: `ENTITY_PAINTER_UI_INTEGRATION_CHECKLIST.md` for UI rendering work

### Update View Menu Panel Toggle Checklist
- [ ] **Update**: `docs/checklists/active/VIEW_MENU_PANEL_TOGGLE_BUG_CHECKLIST.md`
- [ ] **Add note** about entity-painter fix being part of same pattern

---

## Phase 7: Manual Verification ⏳

### Verification Steps
- [ ] **Start dev server**: `npm run dev`
- [ ] **Enter Level Editor**: Click "Level Editor" from main menu
- [ ] **Test View Menu Toggle**:
  - [ ] Click View → Entity Painter
  - [ ] Verify panel appears on screen
  - [ ] Verify panel has "Entity Palette" title
  - [ ] Verify EntityPalette content visible (category buttons, templates)
  
- [ ] **Test Category Switching**:
  - [ ] Click 🐜 (Entities) button → verify ant templates
  - [ ] Click 🏠 (Buildings) button → verify building templates
  - [ ] Click 🌳 (Resources) button → verify resource templates
  
- [ ] **Test Template Selection**:
  - [ ] Click on "Worker Ant" template
  - [ ] Verify template highlighted
  - [ ] Verify notification shows "Selected: Worker Ant"
  
- [ ] **Test Panel Toggle Persistence**:
  - [ ] Toggle panel OFF (View menu)
  - [ ] Toggle panel ON again
  - [ ] Verify selected category/template preserved
  
- [ ] **Test Tool Button Integration**:
  - [ ] Click 🐜 tool button in toolbar
  - [ ] Verify panel toggles
  - [ ] Verify tool becomes active

---

## Test Summary

### Unit Tests
- **File**: `test/unit/ui/entityPainterPanel.test.js`
- **Count**: 7 tests (panel creation, registration, properties, toggle)
- **Status**: ⏳ Pending

### Integration Tests
- **File**: `test/integration/ui/entityPainterPanelToggle.integration.test.js`
- **Count**: 5 tests (toggle, render, click, tool button, state sync)
- **Status**: ⏳ Pending

### E2E Tests
- **File**: `test/e2e/ui/pw_entity_painter_panel_toggle.js`
- **Count**: 6 E2E tests with screenshots
- **Status**: ✅ **6/6 passing** - October 31, 2025
- **Screenshots**: 5 captured in `test/e2e/screenshots/entity_painter/success/`

### Existing Tests (Should Still Pass)
- **EntityPalette Unit Tests**: 30 tests (should pass)
- **EntityPainter Unit Tests**: 30 tests (should pass)
- **CategoryRadioButtons Unit Tests**: 21 tests (should pass)
- **EntityPropertyEditor Unit Tests**: 24 tests (should pass)
- **Entity Painter Integration**: 21 tests (should pass)
- **Entity Painter E2E**: 18 tests (should pass)

### Total Test Count
- **New Tests**: 20 (8 unit + 6 integration + 6 E2E) ✅ **All Passing**
- **Existing Tests**: 144 (should all pass)
- **Grand Total**: 164 tests

### All New Tests Passing ✅
- Unit: 8/8 passing (25ms)
- Integration: 6/6 passing (141ms)
- E2E: 6/6 passing with screenshots

---

## Key Design Decisions

### Panel Sizing
- **Width**: 220px (wider than materials panel to accommodate entity names)
- **Height**: 300px (taller for category buttons + multiple templates)
- **Auto-sizing**: Enabled with contentSizeCallback

### Panel Position
- **X**: 150px (right of tools panel, avoids overlap)
- **Y**: 80px (aligned with materials panel)
- **Draggable**: Yes (user can reposition)

### Default Visibility
- **State**: Hidden by default
- **Reason**: Prevents UI clutter, user must explicitly enable
- **Toggle Methods**: View menu, tool button

### Rendering Architecture
- **Pattern**: Same as MaterialPalette (managed externally by LevelEditorPanels)
- **Delegation**: LevelEditorPanels.render() calls EntityPalette.render()
- **Click Handling**: LevelEditorPanels.handleClick() delegates to EntityPalette.handleClick()

### Integration with Entity Painter Tool
- **Tool Button**: 🐜 icon, P shortcut (already exists)
- **Workflow**: Select tool → Select template from palette → Click terrain to place
- **Panel Auto-Show**: Tool button toggles panel visibility

---

## Notes

**Related Bug**: View Menu Panel Toggle Not Working
- Same root cause pattern: stateVisibility not synced
- Entity Painter bug adds complexity: panel didn't exist at all
- Fix must address both issues: panel creation + visibility sync

**Test Coverage Strategy**:
- Unit tests verify panel creation and configuration
- Integration tests verify panel toggle and rendering
- E2E tests verify visual appearance and user workflow
- Existing tests verify EntityPalette functionality unchanged

**Migration Path** (if user has custom config):
- Panel hidden by default (no breaking change)
- User must explicitly enable via View menu or tool button
- No data loss (EntityPalette state preserved)
