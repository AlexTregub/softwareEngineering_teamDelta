# Level Editor Scrollable Sidebar Menu - Feature Development Checklist

**Feature**: Scrollable sidebar menu for Level Editor that houses user-configurable content with a top menu bar and visibility toggles in the View menu.

**Date Created**: October 28, 2025  
**Based On**: `FEATURE_DEVELOPMENT_CHECKLIST.md` template  
**Estimated Effort**: 4-5 hours (components: 5-7 hours)  
**Dependencies**: 
- `ScrollIndicator` component (see `SCROLL_INDICATOR_COMPONENT_CHECKLIST.md`)
- `ScrollableContentArea` component (see `SCROLLABLE_CONTENT_AREA_CHECKLIST.md`)

---

## ⚠️ IMPORTANT: Component Development Order

**DO NOT start this checklist until the component checklists are complete:**

1. ✅ **First**: Complete `SCROLL_INDICATOR_COMPONENT_CHECKLIST.md`
   - Implement `ScrollIndicator` class
   - All unit tests passing
   - All integration tests passing

2. ✅ **Second**: Complete `SCROLLABLE_CONTENT_AREA_CHECKLIST.md`
   - Implement `ScrollableContentArea` class (uses ScrollIndicator)
   - All unit tests passing
   - All integration tests passing

3. ✅ **Third**: Start this checklist (sidebar integration)

---

## Pre-Development

### Requirements Analysis
- [x] **Affected Systems**: 
  - `LevelEditor.js` - Main controller integration
  - `LevelEditorPanels.js` - Panel management
  - `FileMenuBar.js` - View menu toggles
  - `DraggablePanelManager` - Panel rendering system
- [x] **Core Requirements**:
  - Scrollable container for dynamic content (uses `ScrollableContentArea`)
  - Top menu bar with controls (minimize, add, clear)
  - Vertical scrolling for overflow content (delegated to `ScrollableContentArea`)
  - Scroll indicators (delegated to `ScrollIndicator`)
  - Draggable positioning (uses DraggablePanel)
  - Visibility toggle in View menu (FileMenuBar)
  - Persistent state (position, size, visibility)
  - Default position: Right side of screen
  - Default state: Hidden (user must toggle to show)
- [x] **Integration Points**:
  - `FileMenuBar` View menu - Add "Sidebar" toggle item
  - `LevelEditorPanels` - Initialize sidebar panel
  - `DraggablePanelManager` - Render in LEVEL_EDITOR state
- [x] **Design Decisions**:
  - Use existing `DraggablePanel` as base (inheritance)
  - Scroll container inside panel content area
  - Menu bar as fixed header (non-scrolling)
  - Content items as vertical stack (auto-layout)
- [x] **Backward Compatibility**: 
  - No breaking changes (new feature, opt-in)
  - Existing panels unaffected
  - View menu extends (doesn't replace)

### Technical Decisions
- [x] **Class Structure**: `LevelEditorSidebar` (wrapper, NOT extending DraggablePanel)
- [x] **Component Architecture**: Composition pattern
  - Uses `ScrollableContentArea` for content management
  - Uses `ScrollIndicator` indirectly (via ScrollableContentArea)
  - Integrates with `DraggablePanel` (via LevelEditorPanels)
- [x] **Scroll Implementation**: Delegated to `ScrollableContentArea`
- [x] **Content Management**: Delegated to `ScrollableContentArea` (addText, addButton, addCustom)
- [x] **Menu Bar Design**: Fixed top bar with icon buttons (minimize, add, clear)
- [x] **Default Dimensions**: 300px width × 600px height
- [x] **Panel ID**: `'level-editor-sidebar'`

---

## Implementation Phase

### Phase 1: Core Sidebar Class (TDD)

#### 1A. Unit Tests FIRST (Write failing tests)
- [ ] **Test File**: `test/unit/ui/LevelEditorSidebar.test.js`
- [ ] Test sidebar initialization with defaults
- [ ] Test content item addition/removal
- [ ] Test scroll position tracking
- [ ] Test menu bar rendering
- [ ] Test content area boundaries
- [ ] Test mouse wheel scrolling
- [ ] Test content overflow detection
- [ ] Test visibility toggle
- [ ] **Run tests** (confirm all fail): `npx mocha "test/unit/ui/LevelEditorSidebar.test.js"`

#### 1B. Create Sidebar Class (Composition Pattern)
- [ ] **File**: `Classes/ui/LevelEditorSidebar.js`
- [ ] Class structure:
  ```javascript
  class LevelEditorSidebar {
    constructor(options = {}) {
      // Dimensions
      this.width = options.width || 300;
      this.height = options.height || 600;
      
      // Menu bar
      this.menuBarHeight = 30;
      this.menuButtons = this._createMenuButtons();
      
      // Scrollable content area (COMPOSITION)
      const contentHeight = this.height - this.menuBarHeight;
      this.contentArea = new ScrollableContentArea({
        width: this.width,
        height: contentHeight,
        scrollSpeed: options.scrollSpeed || 20,
        onItemClick: (item, x, y) => {
          console.log('Sidebar item clicked:', item.id);
        }
      });
    }
    
    // Delegate to ScrollableContentArea
    addText(id, text, options) {
      return this.contentArea.addText(id, text, options);
    }
    
    addButton(id, label, callback, options) {
      return this.contentArea.addButton(id, label, callback, options);
    }
    
    addCustom(id, renderFn, clickFn, height) {
      return this.contentArea.addCustom(id, renderFn, clickFn, height);
    }
    
    removeItem(id) {
      return this.contentArea.removeItem(id);
    }
    
    clearAll() {
      this.contentArea.clearAll();
    }
    
    // Menu bar rendering
    renderMenuBar(x, y) {
      push();
      
      // Background
      fill(45, 45, 45);
      noStroke();
      rect(x, y, this.width, this.menuBarHeight);
      
      // Render buttons (minimize, add, clear)
      this.menuButtons.forEach(btn => btn.render(x, y));
      
      pop();
    }
    
    // Main render (delegates to contentArea)
    render(x, y) {
      // Menu bar at top
      this.renderMenuBar(x, y);
      
      // Content area below menu bar
      const contentY = y + this.menuBarHeight;
      this.contentArea.render(x, contentY);
    }
    
    // Input delegation
    handleMouseWheel(delta) {
      return this.contentArea.handleMouseWheel(delta);
    }
    
    handleClick(mouseX, mouseY, x, y) {
      // Check menu bar first
      if (mouseY >= y && mouseY <= y + this.menuBarHeight) {
        return this._handleMenuClick(mouseX, mouseY, x, y);
      }
      
      // Delegate to content area
      const contentY = y + this.menuBarHeight;
      return this.contentArea.handleClick(mouseX, mouseY, x, contentY);
    }
    
    // Get total content size (for panel auto-sizing)
    getContentSize() {
      return { width: this.width, height: this.height };
    }
  }
  ```
- [ ] Implement menu buttons (minimize, add, clear)
- [ ] Add inline comments for delegation pattern
- [ ] **Run tests** (confirm all pass): `npx mocha "test/unit/ui/LevelEditorSidebar.test.js"`

#### 1C. Menu Bar Implementation
- [ ] Create internal menu bar structure
- [ ] Add buttons:
  - Minimize/Maximize toggle
  - Add Content (+) button
  - Clear All (×) button
- [ ] Implement button hover effects
- [ ] Implement button click handlers
- [ ] **Unit tests for menu bar interactions**
- [ ] **Run tests** (all passing)

### Phase 2: Integration with DraggablePanel System

#### 2A. Integration Tests FIRST
- [ ] **Test File**: `test/integration/ui/levelEditorSidebar.integration.test.js`
- [ ] Test sidebar registration in DraggablePanelManager
- [ ] Test sidebar in LEVEL_EDITOR state visibility
- [ ] Test sidebar position persistence
- [ ] Test sidebar drag behavior (inherits from DraggablePanel)
- [ ] Test sidebar rendering in level editor
- [ ] Test sidebar content rendering with real items
- [ ] **Run tests** (confirm failures): `npx mocha "test/integration/ui/levelEditorSidebar.integration.test.js"`

#### 2B. LevelEditorPanels Integration
- [ ] **File**: `Classes/systems/ui/LevelEditorPanels.js`
- [ ] Add `sidebar: null` to panels object
- [ ] Create sidebar panel in `initialize()`:
  ```javascript
  this.panels.sidebar = new DraggablePanel({
    id: 'level-editor-sidebar',
    title: 'Sidebar',
    position: { x: window.width - 320, y: 80 },
    size: { width: 300, height: 600 },
    visible: false, // Hidden by default
    buttons: {
      layout: 'vertical',
      spacing: 0,
      items: [],
      autoSizeToContent: false, // Fixed size
      verticalPadding: 0, // No padding (sidebar handles its own)
      horizontalPadding: 0
    },
    behavior: {
      draggable: true,
      persistent: true,
      constrainToScreen: true,
      managedExternally: true
    }
  });
  ```
- [ ] Initialize `LevelEditorSidebar` instance
- [ ] Add sidebar to panel manager
- [ ] **Do NOT** add to default LEVEL_EDITOR state visibility (hidden by default)
- [ ] Add render delegate in `render()` method
- [ ] Add click handler in `handleClick()` method
- [ ] **Run integration tests** (confirm passing)

#### 2C. LevelEditor Integration
- [ ] **File**: `Classes/systems/ui/LevelEditor.js`
- [ ] Add `this.sidebar = null;` to constructor
- [ ] Initialize sidebar in `initialize()` method
- [ ] Wire up sidebar to panels: `this.levelEditorPanels.sidebar`
- [ ] Add mouse wheel delegation to sidebar
- [ ] Add click delegation to sidebar
- [ ] **Run integration tests** (all passing)

### Phase 3: View Menu Toggle Integration

#### 3A. Unit Tests FIRST
- [ ] **Test File**: `test/unit/ui/fileMenuBar_sidebarToggle.test.js`
- [ ] Test "Sidebar" item exists in View menu
- [ ] Test sidebar toggle action calls `_handleTogglePanel('sidebar')`
- [ ] Test panel ID mapping: `'sidebar'` → `'level-editor-sidebar'`
- [ ] Test checked state synchronization
- [ ] Test keyboard shortcut (Ctrl+6)
- [ ] **Run tests** (confirm failures): `npx mocha "test/unit/ui/fileMenuBar_sidebarToggle.test.js"`

#### 3B. FileMenuBar Updates
- [ ] **File**: `Classes/ui/FileMenuBar.js`
- [ ] Add to View menu items (after Properties Panel):
  ```javascript
  { 
    label: 'Sidebar', 
    shortcut: 'Ctrl+6',
    enabled: true,
    checkable: true,
    checked: false, // Starts hidden
    action: () => this._handleTogglePanel('sidebar')
  }
  ```
- [ ] Update `_handleTogglePanel()` panelIdMap:
  ```javascript
  const panelIdMap = {
    'materials': 'level-editor-materials',
    'tools': 'level-editor-tools',
    'events': 'level-editor-events',
    'properties': 'level-editor-properties',
    'sidebar': 'level-editor-sidebar' // NEW
  };
  ```
- [ ] Update labelMap in `_handleTogglePanel()`:
  ```javascript
  const labelMap = {
    'materials': 'Materials Panel',
    'tools': 'Tools Panel',
    'events': 'Events Panel',
    'properties': 'Properties Panel',
    'sidebar': 'Sidebar' // NEW
  };
  ```
- [ ] Add keyboard shortcut handler for Ctrl+6
- [ ] **Run unit tests** (all passing)

### Phase 4: Content Management API (Delegation)

#### 4A. Content Item Structure (Handled by ScrollableContentArea)
- [ ] Content items managed by `ScrollableContentArea` component
- [ ] See `SCROLLABLE_CONTENT_AREA_CHECKLIST.md` for item structure
- [ ] Sidebar provides convenience wrappers:
  ```javascript
  // Sidebar delegates to contentArea
  addText(id, text, options) {
    return this.contentArea.addText(id, text, options);
  }
  ```

#### 4B. Public API Methods (Delegation Pattern)
- [ ] `sidebar.addText(id, text, options)` → `contentArea.addText()`
- [ ] `sidebar.addButton(id, label, callback, options)` → `contentArea.addButton()`
- [ ] `sidebar.addCustom(id, renderFn, clickFn, height)` → `contentArea.addCustom()`
- [ ] `sidebar.removeItem(id)` → `contentArea.removeItem()`
- [ ] `sidebar.clearAll()` → `contentArea.clearAll()`
- [ ] `sidebar.getContentSize()` - Return panel dimensions (for DraggablePanel)
- [ ] **Unit tests for delegation** (verify methods call contentArea)
- [ ] **Run tests** (all passing)

### Phase 5: Scroll System Integration (Delegation)

#### 5A. Scroll Logic (Handled by ScrollableContentArea)
- [ ] Scroll logic delegated to `ScrollableContentArea` component
- [ ] See `SCROLLABLE_CONTENT_AREA_CHECKLIST.md` for scroll implementation
- [ ] Sidebar provides simple delegation:
  ```javascript
  handleMouseWheel(delta) {
    return this.contentArea.handleMouseWheel(delta);
  }
  ```
- [ ] **Unit tests for delegation** (verify wheel events passed through)

#### 5B. Mouse Wheel Integration (LevelEditor)
- [ ] Wire up in `LevelEditor.handleMouseWheel()`:
  ```javascript
  // Check if mouse is over sidebar panel
  if (this.levelEditorPanels && this.levelEditorPanels.panels.sidebar) {
    const sidebarPanel = this.levelEditorPanels.panels.sidebar;
    const pos = sidebarPanel.getPosition();
    const size = sidebarPanel.getSize();
    
    if (mouseX >= pos.x && mouseX <= pos.x + size.width &&
        mouseY >= pos.y && mouseY <= pos.y + size.height) {
      // Delegate to sidebar instance
      if (this.sidebar && this.sidebar.handleMouseWheel(event.delta)) {
        return true; // Consumed
      }
    }
  }
  ```
- [ ] Test scroll speed (20px per wheel tick, configurable)
- [ ] **Integration tests for scrolling**

---

## Testing Strategy

### Unit Tests (Target: 100% coverage)
- [ ] **LevelEditorSidebar class**: 25+ tests
  - Initialization
  - Content management (add, remove, clear)
  - Scroll calculations
  - Menu bar interactions
  - Hit testing
  - Visibility toggles
- [ ] **FileMenuBar integration**: 8+ tests
  - View menu item exists
  - Toggle action
  - Keyboard shortcuts
  - State synchronization

### Integration Tests
- [ ] **Panel system integration**: 12+ tests
  - Sidebar registration
  - State visibility management
  - Render delegation
  - Click delegation
  - Mouse wheel delegation
  - Content rendering with real items
- [ ] **LevelEditor integration**: 8+ tests
  - Sidebar initialization
  - Input delegation
  - Visibility persistence
  - Panel interactions

### E2E Tests (Puppeteer with screenshots)
- [ ] **Test File**: `test/e2e/levelEditor/pw_sidebar_visibility.js`
- [ ] Test 1: Sidebar hidden by default
  - Screenshot: `levelEditor/sidebar_hidden_default`
- [ ] Test 2: View → Sidebar toggles visibility
  - Screenshot: `levelEditor/sidebar_visible_after_toggle`
- [ ] Test 3: Sidebar can be dragged
  - Screenshot: `levelEditor/sidebar_dragged`
- [ ] Test 4: Content items render correctly
  - Screenshot: `levelEditor/sidebar_with_content`
- [ ] Test 5: Scrolling works with mouse wheel
  - Screenshot: `levelEditor/sidebar_scrolled`
- [ ] Test 6: Menu bar buttons functional
  - Screenshot: `levelEditor/sidebar_menu_interactions`
- [ ] **All screenshots in `test/e2e/screenshots/levelEditor/`**
- [ ] **Run E2E tests**: `node test/e2e/levelEditor/pw_sidebar_visibility.js`

---

## Code Quality Checklist

### Implementation Standards
- [ ] DRY: No duplicate scroll logic
- [ ] SRP: Sidebar handles content, panel handles chrome
- [ ] Defensive programming: Null checks on all external calls
- [ ] Event consumption: Click/wheel events properly consumed
- [ ] Memory management: Clean up content items on destroy

### Documentation
- [ ] JSDoc comments on all public methods
- [ ] Inline comments for scroll calculations
- [ ] Usage examples in class header
- [ ] API reference document created

### Error Handling
- [ ] Graceful degradation if DraggablePanelManager missing
- [ ] Validation for content item structure
- [ ] Bounds checking for scroll offset
- [ ] Safe rendering with missing callbacks

---

## Key Design Decisions

### 1. Why Composition Over Inheritance?
**Decision**: Sidebar uses `ScrollableContentArea` via composition, NOT extends DraggablePanel  
**Rationale**:
- **Separation of concerns**: 
  - `ScrollableContentArea` handles content + scrolling
  - `LevelEditorSidebar` handles menu bar + integration
  - `DraggablePanel` handles dragging + chrome (via LevelEditorPanels)
- **Reusability**: ScrollableContentArea can be used in other contexts
- **Testability**: Test components independently
- **Flexibility**: Easy to swap implementations
- **Avoids deep inheritance**: Composition > inheritance

**Architecture**:
```
LevelEditorPanels (manages DraggablePanel)
  └── DraggablePanel (id: 'level-editor-sidebar')
        └── renderCallback: sidebar.render()
              └── LevelEditorSidebar (wrapper)
                    ├── Menu Bar (minimize, add, clear)
                    └── ScrollableContentArea (composition)
                          ├── Content items (text, buttons, custom)
                          └── ScrollIndicator (composition)
```

### 2. Why Hidden by Default?
**Decision**: Sidebar starts hidden, user toggles to show  
**Rationale**:
- Optional feature (not core workflow)
- Reduces screen clutter on first launch
- Matches Events Panel pattern (opt-in visibility)
- Power user feature (intentional discovery)

### 3. Scroll Implementation Strategy (Delegated)
**Decision**: Delegate all scroll logic to `ScrollableContentArea` component  
**Rationale**:
- **Component does it better**: ScrollableContentArea has viewport culling, scroll indicators
- **No duplication**: Don't reimplement scroll logic in sidebar
- **Testability**: Scroll logic tested independently in ScrollableContentArea tests
- **Maintainability**: One place to fix scroll bugs

**Delegation Pattern**:
```javascript
class LevelEditorSidebar {
  constructor() {
    this.contentArea = new ScrollableContentArea({ /* config */ });
  }
  
  // Simple delegation
  handleMouseWheel(delta) {
    return this.contentArea.handleMouseWheel(delta);
  }
  
  addButton(id, label, callback) {
    return this.contentArea.addButton(id, label, callback);
  }
  
  render(x, y) {
    this.renderMenuBar(x, y);
    this.contentArea.render(x, y + this.menuBarHeight);
  }
}
```

See `SCROLLABLE_CONTENT_AREA_CHECKLIST.md` for scroll algorithm details.

### 4. Content Item Architecture (Delegated)
**Decision**: Delegate content management to `ScrollableContentArea`  
**Rationale**:
- **Reusability**: ScrollableContentArea handles all item types
- **Consistency**: Same item structure across all scrollable panels
- **Testability**: Item rendering tested in ScrollableContentArea
- **Flexibility**: Sidebar just provides convenience wrappers

**Sidebar Usage** (delegates to contentArea):
```javascript
class LevelEditorSidebar {
  addButton(id, label, callback, options) {
    // Delegate to ScrollableContentArea
    return this.contentArea.addButton(id, label, callback, options);
  }
  
  addText(id, text, options) {
    return this.contentArea.addText(id, text, options);
  }
}
```

See `SCROLLABLE_CONTENT_AREA_CHECKLIST.md` for content item structure.

### 5. Menu Bar Controls
**Decision**: Minimize, Add, Clear buttons in top bar  
**Rationale**:
- **Minimize**: Quick hide without losing position
- **Add**: Visual affordance for extensibility
- **Clear**: Bulk delete for power users
- Icon-based (space efficient, language agnostic)

---

## Implementation Notes

### Coordinate System
```
Sidebar Panel (300×600)
┌──────────────────────────┐
│ Menu Bar (fixed, 30px)   │ ← Non-scrolling
├──────────────────────────┤
│ ↑ Scroll Up Indicator    │ ← Shown if scrollOffset > 0
├──────────────────────────┤
│                          │
│  Content Area            │ ← Scrollable viewport
│  (570px visible)         │
│                          │
│  [Content Item 1]        │
│  [Content Item 2]        │
│  [Content Item 3]        │ ← Items scroll vertically
│  ...                     │
│                          │
├──────────────────────────┤
│ ↓ Scroll Down Indicator  │ ← Shown if more content below
└──────────────────────────┘
```

### Scroll Math
```javascript
// Total content height
const totalHeight = this.contentItems.reduce((sum, item) => sum + item.height, 0);

// Visible area (panel height - menu bar - indicators)
const visibleHeight = this.size.height - 30 - 20; // 550px

// Max scroll (how far we can scroll down)
this.maxScrollOffset = Math.max(0, totalHeight - visibleHeight);

// On mouse wheel: delta negative = scroll down, positive = scroll up
this.scrollOffset += delta * 10; // 10px per tick
this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));
```

### Performance Considerations
- **Viewport culling**: Only render items in visible area
- **Batch rendering**: Single push/pop for all content
- **Lazy calculation**: Update scroll bounds only when content changes
- **Event consumption**: Stop propagation when sidebar handles event

---

## File Locations

### New Files
```
Classes/ui/
  └── LevelEditorSidebar.js        - Sidebar class

test/unit/ui/
  ├── LevelEditorSidebar.test.js   - Unit tests
  └── fileMenuBar_sidebarToggle.test.js - Menu integration tests

test/integration/ui/
  └── levelEditorSidebar.integration.test.js - Integration tests

test/e2e/levelEditor/
  └── pw_sidebar_visibility.js     - E2E tests with screenshots
```

### Modified Files
```
Classes/systems/ui/
  ├── LevelEditor.js               - Add sidebar initialization
  └── LevelEditorPanels.js         - Add sidebar panel

Classes/ui/
  └── FileMenuBar.js               - Add View → Sidebar toggle

index.html
  └── Add <script src="Classes/ui/LevelEditorSidebar.js"></script>
```

---

## Testing Commands

```powershell
# Unit tests (sidebar class)
npx mocha "test/unit/ui/LevelEditorSidebar.test.js" --reporter spec

# Unit tests (menu integration)
npx mocha "test/unit/ui/fileMenuBar_sidebarToggle.test.js" --reporter spec

# Integration tests
npx mocha "test/integration/ui/levelEditorSidebar.integration.test.js" --reporter spec

# E2E tests
node test\e2e\levelEditor\pw_sidebar_visibility.js

# All sidebar tests
npx mocha "test/unit/ui/LevelEditorSidebar*.test.js" "test/integration/ui/levelEditorSidebar.integration.test.js" --reporter spec

# Full test suite (verify no regressions)
npm test
```

---

## Verification Checklist

### Pre-Commit
- [ ] All unit tests passing (40+ tests)
- [ ] All integration tests passing (20+ tests)
- [ ] All E2E tests passing with screenshots
- [ ] No console errors in browser
- [ ] Sidebar hidden by default in Level Editor
- [ ] View → Sidebar toggle works
- [ ] Keyboard shortcut (Ctrl+6) works
- [ ] Scrolling works with mouse wheel
- [ ] Content items render correctly
- [ ] Menu bar buttons functional
- [ ] Dragging works (position persists)
- [ ] No regressions in existing panels
- [ ] Code coverage >80% for new code

### Documentation
- [ ] JSDoc comments complete
- [ ] API reference created
- [ ] Usage examples added
- [ ] CHANGELOG updated
- [ ] This checklist completed

---

## Success Criteria

**Feature is complete when**:
1. ✅ Sidebar class implemented with scrolling
2. ✅ Integrated into LevelEditorPanels
3. ✅ View menu toggle functional
4. ✅ Content API working (add/remove/clear)
5. ✅ Mouse wheel scrolling operational
6. ✅ Menu bar controls functional
7. ✅ All tests passing (unit, integration, E2E)
8. ✅ Screenshots prove visual correctness
9. ✅ Position/visibility persists across sessions
10. ✅ No regressions in existing features

---

## Resources

### Related Documentation
- `docs/LEVEL_EDITOR_SETUP.md` - Level Editor architecture
- `docs/checklists/FEATURE_DEVELOPMENT_CHECKLIST.md` - Template used
- `docs/guides/E2E_TESTING_QUICKSTART.md` - E2E testing patterns

### Related Classes
- `Classes/systems/ui/draggablePanels/DraggablePanel.js` - Base panel class
- `Classes/systems/ui/LevelEditorPanels.js` - Panel integration
- `Classes/ui/FileMenuBar.js` - Menu bar system
- `Classes/ui/ToolBar.js` - Similar vertical layout pattern

### Test Examples
- `test/unit/ui/viewMenuPanelToggle.test.js` - Panel toggle patterns
- `test/e2e/levelEditor/pw_brush_panel_hidden.js` - Panel visibility E2E
- `test/integration/ui/dynamicGridOverlay.integration.test.js` - Integration pattern
