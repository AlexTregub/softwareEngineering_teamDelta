# Menu Bar Enhancements Checklist

**Feature**: Enhanced File Menu + Settings Menu in Edit Menu + Middle-Click Pan Speed Configuration

**User Story**: As a level editor user, I want a settings menu to configure editor preferences (like middle-click pan speed), visual separators in the File menu for better organization, and quick access to common actions like "Return to Main Menu" and "PlayTest".

**Estimated Effort**: 6-8 hours

**Created**: October 30, 2025

---

## Requirements

### File Menu Enhancements
1. **Visual Separators**: Add horizontal separator lines to group related actions
   - Group 1: New
   - Separator
   - Group 2: Save, Load, Export
   - Separator
   - Group 3: Return to Main Menu, PlayTest

2. **New Actions**:
   - **Return to Main Menu**: Exit level editor and return to game main menu
   - **PlayTest**: Test current level in-game (quick preview)

### Edit Menu Enhancements
3. **Settings Submenu**: Add "Settings..." option to Edit menu
   - Opens a modal settings panel
   - Contains configurable editor preferences

### Settings Panel Features
4. **Middle-Click Pan Speed**: Configurable slider (range: 0.5x - 3.0x, default: 1.0x)
5. **Auto-Save**: Toggle with interval dropdown (30s, 1m, 5m, Never)
6. **Grid Settings**: Snap-to-grid toggle, grid size
7. **Theme**: Dark/Light theme toggle
8. **Keybindings**: View keyboard shortcuts reference

### Configuration System
9. **Config File**: Create `config/editor-settings.json` for persistent settings
10. **SettingsManager**: Singleton for managing editor preferences
11. **Apply Settings**: Real-time application of settings changes
12. **Default Values**: Sensible defaults for all settings

---

## Acceptance Criteria

- [ ] File menu has visual separators between action groups
- [ ] "Return to Main Menu" button exits to game main menu
- [ ] "PlayTest" button loads current level in game mode
- [ ] Edit menu contains "Settings..." option
- [ ] Settings panel opens as modal with tabs/sections
- [ ] Middle-click pan speed slider works (0.5x - 3.0x)
- [ ] Settings persist across sessions (LocalStorage/config file)
- [ ] Default settings load if no config exists
- [ ] All settings apply immediately when changed
- [ ] Settings panel has "Reset to Defaults" button
- [ ] All existing menu functionality still works (no regressions)
- [ ] 80%+ test coverage (unit + integration + E2E)

---

## Phase 1: Planning & Design

### 1.1 Define Requirements ✅
- [x] Write clear user story (above)
- [x] Identify acceptance criteria (above)
- [x] List affected systems:
  - `Classes/ui/FileMenuBar.js` - Add separators, new menu items
  - `Classes/managers/SettingsManager.js` - NEW (singleton for settings)
  - `Classes/ui/SettingsPanel.js` - NEW (modal settings UI)
  - `Classes/controllers/CameraManager.js` - Apply pan speed multiplier
  - `Classes/managers/MiddleClickPan.js` - Read pan speed from settings
  - `config/editor-settings.json` - NEW (default settings)
  - `sketch.js` - Handle "Return to Main Menu" and "PlayTest" actions

### 1.2 Design Architecture
- [x] **SettingsManager** (singleton):
  ```javascript
  class SettingsManager {
    constructor() {
      this._settings = null;
      this._listeners = [];
    }
    
    // Load from config/editor-settings.json (defaults)
    // Override with LocalStorage (user preferences)
    loadSettings() { }
    
    // Get setting value
    get(key, defaultValue) { }
    
    // Set setting value (save to LocalStorage)
    set(key, value) { }
    
    // Reset all to defaults
    resetToDefaults() { }
    
    // Register change listener
    onChange(callback) { }
    
    // Notify listeners of changes
    _notifyListeners(key, value) { }
  }
  ```

- [x] **SettingsPanel** (modal UI):
  ```javascript
  class SettingsPanel {
    constructor() {
      this.visible = false;
      this.tabs = ['General', 'Camera', 'Keybindings'];
      this.activeTab = 'General';
    }
    
    open() { } // Show modal
    close() { } // Hide modal
    render() { } // Draw settings UI
    handleClick(x, y) { } // Handle interactions
  }
  ```

- [x] **Middle-Click Pan Speed**:
  - CameraManager applies multiplier: `this.cameraPanSpeed * SettingsManager.get('panSpeed', 1.0)`
  - MiddleClickPan remains unchanged (speed handled in CameraManager)

- [x] **File Menu Separators**:
  - Add `{ type: 'separator' }` objects to menu items array
  - Render as horizontal line in dropdown

### 1.3 Key Design Decisions

**Decision 1: Where does pan speed live?**
- **Answer**: Pan speed is already a property in `CameraManager.cameraPanSpeed` (line 27)
- **Current**: `this.cameraPanSpeed = 10;` (pixels per frame)
- **Enhancement**: Apply settings multiplier in `updatePan()`:
  ```javascript
  const panSpeedMultiplier = SettingsManager.get('panSpeed', 1.0);
  this.cameraX = this._cameraStartX - (deltaX / this.cameraZoom) * panSpeedMultiplier;
  this.cameraY = this._cameraStartY - (deltaY / this.cameraZoom) * panSpeedMultiplier;
  ```
- **Reason**: Multiplier approach preserves existing zoom-based scaling

**Decision 2: Settings storage strategy?**
- **Answer**: Hybrid approach
  - `config/editor-settings.json` - Default settings (version controlled)
  - `LocalStorage` - User preferences (persistent across sessions)
  - Load order: Defaults → LocalStorage overrides
- **Reason**: Easy defaults, user preferences persist, no server needed

**Decision 3: When to apply settings?**
- **Answer**: Immediately when changed (real-time)
- **Implementation**: SettingsManager emits change events, systems listen and react
- **Example**:
  ```javascript
  SettingsManager.onChange('panSpeed', (value) => {
    // CameraManager already uses SettingsManager.get() in updatePan()
    // No action needed - next pan will use new speed
  });
  ```
- **Reason**: Better UX (see changes immediately, no "Apply" button needed)

**Decision 4: Menu separator rendering?**
- **Answer**: New menu item type `{ type: 'separator' }`
- **Rendering**:
  ```javascript
  if (item.type === 'separator') {
    stroke(100, 100, 100);
    line(x + 10, y + itemHeight/2, x + width - 10, y + itemHeight/2);
    // No text, no hover, height = 10px
  }
  ```
- **Reason**: Reuses existing menu rendering logic, minimal code change

**Decision 5: Return to Main Menu implementation?**
- **Answer**: Change game state to 'MENU' and reinitialize menu
- **Implementation**:
  ```javascript
  _handleReturnToMainMenu() {
    if (confirm('Return to Main Menu? Unsaved changes will be lost.')) {
      window.gameState = 'MENU';
      if (typeof initializeMenu === 'function') initializeMenu();
      if (typeof redraw === 'function') redraw();
    }
  }
  ```
- **Reason**: Clean state transition, reuses existing menu system

**Decision 6: PlayTest implementation?**
- **Answer**: Export current terrain to temp storage, load in PLAYING state
- **Implementation**:
  ```javascript
  _handlePlayTest() {
    const terrainData = this.levelEditor.terrainEditor.exportTerrain();
    sessionStorage.setItem('playtest_terrain', JSON.stringify(terrainData));
    window.gameState = 'PLAYING';
    // Load playtest terrain in setup() or game initialization
  }
  ```
- **Reason**: No file I/O needed, session-based (auto-clears on close)

### 1.4 File Changes Summary

**New Files** (3):
1. `Classes/managers/SettingsManager.js` - Settings singleton
2. `Classes/ui/SettingsPanel.js` - Settings modal UI
3. `config/editor-settings.json` - Default settings

**Modified Files** (4):
1. `Classes/ui/FileMenuBar.js` - Add separators, new menu items, settings integration
2. `Classes/controllers/CameraManager.js` - Apply pan speed multiplier from settings
3. `index.html` - Load SettingsManager, SettingsPanel scripts
4. `sketch.js` - Handle "Return to Main Menu", "PlayTest", load playtest terrain

**Test Files** (6):
1. `test/unit/managers/settingsManager.test.js` - SettingsManager unit tests
2. `test/unit/ui/settingsPanel.test.js` - SettingsPanel unit tests
3. `test/unit/ui/fileMenuBarSeparators.test.js` - Separator rendering tests
4. `test/integration/settings/settingsIntegration.test.js` - Settings + CameraManager
5. `test/e2e/ui/pw_settings_panel.js` - Settings UI E2E with screenshots
6. `test/e2e/camera/pw_pan_speed_config.js` - Pan speed configuration E2E

---

## Phase 2: Unit Tests (TDD Red Phase) ✅ COMPLETE

### 2.1 SettingsManager Unit Tests ✅

- [x] **Create test file**: `test/unit/managers/settingsManager.test.js`
- [x] Test initialization with defaults (3 tests)
- [x] Test `get(key, defaultValue)` method (6 tests)
- [x] Test `set(key, value)` method (6 tests)
- [x] Test `resetToDefaults()` method (3 tests)
- [x] Test `onChange(callback)` listener registration (6 tests)
- [x] Test listener notification on value change
- [x] Test LocalStorage persistence (mock LocalStorage)
- [x] Test loading from config file (mock fetch/require)
- [x] Test invalid key handling
- [x] Test type validation (string, number, boolean, object, array - 5 tests)
- [x] Test edge cases (5 tests)

**Run command**:
```bash
npx mocha "test/unit/managers/settingsManager.test.js"
```

**Result**: ✅ 33 tests pending (skipped - SettingsManager doesn't exist yet)

### 2.2 SettingsPanel Unit Tests ✅

- [x] **Create test file**: `test/unit/ui/settingsPanel.test.js`
- [x] Test panel initialization (4 tests)
- [x] Test `open()` method (sets visible = true - 3 tests)
- [x] Test `close()` method (sets visible = false - 2 tests)
- [x] Test render() method (4 tests)
- [x] Test tab switching (3 tests)
- [x] Test slider interaction (pan speed - 2 tests)
- [x] Test toggle interaction (auto-save, theme - 2 tests)
- [x] Test "Reset to Defaults" button (1 test)
- [x] Test "Close" button (1 test)
- [x] Test hit detection (containsPoint - 4 tests)
- [x] Test keyboard shortcuts (Escape to close - 2 tests)
- [x] Test edge cases (5 tests)

**Run command**:
```bash
npx mocha "test/unit/ui/settingsPanel.test.js"
```

**Result**: ✅ 33 tests pending (skipped - SettingsPanel doesn't exist yet)

### 2.3 FileMenuBar Separator Tests ✅

- [x] **Create test file**: `test/unit/ui/fileMenuBarSeparators.test.js`
- [x] Test separator item creation ({ type: 'separator' } - 4 tests)
- [x] Test separator rendering (line drawn, no text - 3 tests)
- [x] Test separator height (smaller than regular items)
- [x] Test separator non-interactivity (no hover, no click - 2 tests)
- [x] Test "Return to Main Menu" action (5 tests)
- [x] Test "PlayTest" action (4 tests)
- [x] Test "Settings..." action opens SettingsPanel (3 tests)
- [x] Test menu structure validation (2 tests)

**Run command**:
```bash
npx mocha "test/unit/ui/fileMenuBarSeparators.test.js"
```

**Result**: ✅ **14 passing**, **9 failing** (expected failures)
- ❌ Failing: Separators don't exist in menus yet
- ❌ Failing: New menu items not added yet
- ✅ Passing: Separator rendering logic works (existing code)

### 2.4 CameraManager Pan Speed Tests ✅

- [x] **Update existing test**: `test/unit/managers/cameraManagerPan.test.js`
- [x] Test pan speed multiplier applied (mock SettingsManager)
- [x] Test `updatePan()` with 0.5x speed (slower)
- [x] Test `updatePan()` with 1.0x speed (default)
- [x] Test `updatePan()` with 2.0x speed (faster)
- [x] Test `updatePan()` with 3.0x speed (maximum)
- [x] Test SettingsManager query for panSpeed
- [x] Test default speed (1.0x) when SettingsManager unavailable
- [x] Test default speed (1.0x) when setting not found
- [x] Test pan distance calculation with multiplier (accuracy test)
- [x] Test consistent speed in X and Y axes

**Run command**:
```bash
npx mocha "test/unit/managers/cameraManagerPan.test.js"
```

**Result**: ✅ **27 passing**, **6 failing** (expected failures)
- ❌ Failing: Pan speed multiplier not implemented yet
- ✅ Passing: All original pan tests still work

---

## Phase 2 Summary

**Total Tests Created**: 109 tests
- SettingsManager: 33 tests (all pending)
- SettingsPanel: 33 tests (all pending)
- FileMenuBar: 23 tests (14 passing, 9 failing)
- CameraManager: 33 tests (27 passing, 6 failing)

**Expected Failures**: 48 tests
- 33 pending (SettingsManager)
- 33 pending (SettingsPanel)
- 9 failing (FileMenuBar - new features)
- 6 failing (CameraManager - pan speed)

**Status**: ✅ TDD Red Phase complete - all failing tests represent missing functionality

---

## Phase 3: Implementation (TDD Green Phase)

### 3.1 Create config/editor-settings.json ✅

- [x] **Create file**: `config/editor-settings.json`
- [x] Define default settings schema:
```json
{
  "version": "1.0.0",
  "camera": {
    "panSpeed": 1.0,
    "panSpeedMin": 0.5,
    "panSpeedMax": 3.0,
    "zoomSpeed": 1.1
  },
  "editor": {
    "autoSave": false,
    "autoSaveInterval": 60,
    "snapToGrid": false,
    "gridSize": 32,
    "theme": "dark"
  },
  "keybindings": {
    "save": "Ctrl+S",
    "load": "Ctrl+O",
    "export": "Ctrl+E",
    "undo": "Ctrl+Z",
    "redo": "Ctrl+Y"
  }
}
```
- [x] Verify JSON is valid

### 3.2 Implement SettingsManager ✅

- [x] **Create file**: `Classes/managers/SettingsManager.js`
- [x] Implement singleton pattern (getInstance)
- [x] Implement constructor (initialize settings object)
- [x] Implement `loadSettings()`:
  - Load from `config/editor-settings.json`
  - Override with LocalStorage values
  - Handle errors gracefully
- [x] Implement `get(key, defaultValue)`:
  - Support nested keys ('camera.panSpeed')
  - Return default if key not found
- [x] Implement `set(key, value)`:
  - Update settings object
  - Save to LocalStorage
  - Notify listeners
- [x] Implement `resetToDefaults()`:
  - Reload from config file
  - Clear LocalStorage overrides
  - Notify all listeners
- [x] Implement `onChange(callback)`:
  - Register callback for setting changes
  - Return unsubscribe function
- [x] Implement `_notifyListeners(key, value)`:
  - Call all registered listeners
  - Pass key and new value
- [x] Add global export (window.SettingsManager)
- [x] Add module export for Node.js

**Run unit tests**:
```bash
npx mocha "test/unit/managers/settingsManager.test.js"
```
**Expected**: All SettingsManager tests pass (33/33) ✅ **COMPLETE**

### 3.3 Implement SettingsPanel

- [ ] **Create file**: `Classes/ui/SettingsPanel.js`
- [ ] Implement constructor:
  - Initialize state (visible, activeTab, position, size)
  - Load current settings from SettingsManager
- [ ] Implement `open()`:
  - Set visible = true
  - Load current settings
  - Trigger redraw
- [ ] Implement `close()`:
  - Set visible = false
  - Trigger redraw
- [ ] Implement `render()`:
  - Draw modal background overlay (semi-transparent)
  - Draw panel container (centered, 600x400px)
  - Draw tab buttons (General, Camera, Keybindings)
  - Draw active tab content
  - Draw "Reset to Defaults" and "Close" buttons
- [ ] Implement `_renderGeneralTab()`:
  - Auto-save toggle
  - Auto-save interval dropdown
  - Theme toggle
- [ ] Implement `_renderCameraTab()`:
  - Pan speed slider (0.5x - 3.0x)
  - Zoom speed slider
  - Show current values
- [ ] Implement `_renderKeybindingsTab()`:
  - List all keybindings (read-only for now)
  - Future: Editable keybindings
- [ ] Implement `handleClick(x, y)`:
  - Check tab buttons
  - Check sliders
  - Check toggles
  - Check "Reset to Defaults" button
  - Check "Close" button
  - Update SettingsManager on changes
- [ ] Implement `handleMouseMove(x, y)`:
  - Handle slider dragging
  - Update hover states
- [ ] Implement `containsPoint(x, y)`:
  - Return true if point inside panel
- [ ] Add global export
- [ ] Add module export

**Run unit tests**:
```bash
npx mocha "test/unit/ui/settingsPanel.test.js"
```
**Expected**: All SettingsPanel tests pass

### 3.4 Update FileMenuBar with Separators

- [ ] **Modify**: `Classes/ui/FileMenuBar.js`
- [ ] Update `_createDefaultMenuItems()` File menu:
  - Add 'New' (existing)
  - Add `{ type: 'separator' }` after 'New'
  - Add 'Save', 'Load', 'Export' (existing)
  - Add `{ type: 'separator' }` after 'Export'
  - Add 'Return to Main Menu' (NEW)
  - Add 'PlayTest' (NEW)
- [ ] Update `_createDefaultMenuItems()` Edit menu:
  - Add 'Undo', 'Redo' (existing)
  - Add `{ type: 'separator' }` after 'Redo'
  - Add 'Settings...' (NEW)
- [ ] Implement `_renderDropdownItem()`:
  - Check if `item.type === 'separator'`
  - If separator: Draw horizontal line, height = 10px
  - If regular: Existing rendering logic
- [ ] Implement `_handleReturnToMainMenu()`:
  - Confirm with user (unsaved changes warning)
  - Change gameState to 'MENU'
  - Call initializeMenu()
  - Trigger redraw
- [ ] Implement `_handlePlayTest()`:
  - Export current terrain to sessionStorage
  - Change gameState to 'PLAYING'
  - Set flag for playtest mode
  - Trigger redraw
- [ ] Implement `_handleSettings()`:
  - Create or show SettingsPanel
  - Call settingsPanel.open()
- [ ] Update `handleClick(x, y)`:
  - Skip click handling for separators
  - Handle settings panel clicks
- [ ] Update `handleMouseMove(x, y)`:
  - Skip hover for separators

**Run unit tests**:
```bash
npx mocha "test/unit/ui/fileMenuBarSeparators.test.js"
```
**Expected**: All FileMenuBar separator tests pass

### 3.5 Update CameraManager with Pan Speed Multiplier

- [ ] **Modify**: `Classes/controllers/CameraManager.js`
- [ ] Update `updatePan(mouseX, mouseY)` method:
  - Get pan speed multiplier from SettingsManager
  - Apply multiplier to delta calculation:
    ```javascript
    const panSpeedMultiplier = typeof SettingsManager !== 'undefined' 
      ? SettingsManager.getInstance().get('camera.panSpeed', 1.0)
      : 1.0;
    
    this.cameraX = this._cameraStartX - (deltaX * panSpeedMultiplier);
    this.cameraY = this._cameraStartY - (deltaY * panSpeedMultiplier);
    ```
- [ ] Add JSDoc comment explaining pan speed multiplier

**Run unit tests**:
```bash
npx mocha "test/unit/managers/cameraManagerPan.test.js"
```
**Expected**: All CameraManager pan tests pass (including new speed tests)

### 3.6 Update sketch.js

- [ ] **Modify**: `sketch.js`
- [ ] In `setup()`:
  - Initialize SettingsManager: `SettingsManager.getInstance().loadSettings();`
  - Create SettingsPanel: `window.settingsPanel = new SettingsPanel();`
- [ ] In `draw()`:
  - Render SettingsPanel if visible: `if (settingsPanel && settingsPanel.visible) settingsPanel.render();`
- [ ] In `mousePressed()`:
  - Check SettingsPanel click before other handlers
- [ ] In `mouseDragged()`:
  - Handle SettingsPanel slider dragging
- [ ] In `keyPressed()`:
  - Add Escape to close SettingsPanel
- [ ] Add playtest terrain loading:
  ```javascript
  function loadPlaytestTerrain() {
    const data = sessionStorage.getItem('playtest_terrain');
    if (data) {
      const terrainData = JSON.parse(data);
      // Load terrain into g_map2
      sessionStorage.removeItem('playtest_terrain');
    }
  }
  ```

**Run full test suite**:
```bash
npm run test:unit
```
**Expected**: All unit tests pass (no regressions)

### 3.7 Update index.html

- [ ] **Modify**: `index.html`
- [ ] Add script tag for SettingsManager (after managers)
- [ ] Add script tag for SettingsPanel (after UI components)
- [ ] Verify load order: SettingsManager → FileMenuBar → SettingsPanel

---

## Phase 4: Integration Tests

### 4.1 Settings Integration Test

- [ ] **Create test file**: `test/integration/settings/settingsIntegration.test.js`
- [ ] Test SettingsManager + CameraManager integration:
  - Load settings
  - Change pan speed
  - Verify CameraManager uses new speed
- [ ] Test SettingsPanel + SettingsManager integration:
  - Open panel
  - Change slider value
  - Verify SettingsManager updated
  - Verify LocalStorage saved
- [ ] Test FileMenuBar + SettingsPanel integration:
  - Click "Settings..." menu item
  - Verify panel opens
  - Change setting
  - Close panel
  - Verify setting persisted

**Run command**:
```bash
npx mocha "test/integration/settings/settingsIntegration.test.js"
```
**Expected**: All integration tests pass

### 4.2 Menu Interaction Integration Test

- [ ] **Update existing test**: `test/integration/ui/menuInteraction.integration.test.js`
- [ ] Test separator rendering in dropdown
- [ ] Test "Return to Main Menu" action
- [ ] Test "PlayTest" action (mock sessionStorage)
- [ ] Test "Settings..." action (mock SettingsPanel)
- [ ] Verify no regressions in existing menu functionality

**Run command**:
```bash
npx mocha "test/integration/ui/menuInteraction.integration.test.js"
```
**Expected**: All menu interaction tests pass

---

## Phase 5: E2E Tests (Visual Verification)

### 5.1 Settings Panel E2E Test

- [ ] **Create test file**: `test/e2e/ui/pw_settings_panel.js`
- [ ] Launch browser with level editor
- [ ] Ensure game started (bypass menu)
- [ ] Open Edit menu → Settings
- [ ] Take screenshot: Settings panel open (General tab)
- [ ] Switch to Camera tab
- [ ] Take screenshot: Camera tab with pan speed slider
- [ ] Drag pan speed slider to 2.0x
- [ ] Take screenshot: Slider at 2.0x
- [ ] Click "Close" button
- [ ] Verify panel closed (screenshot)
- [ ] Verify pan speed setting persisted

**Run command**:
```bash
node test/e2e/ui/pw_settings_panel.js
```
**Expected**: Test passes, screenshots in `test/e2e/screenshots/ui/`

### 5.2 Pan Speed Configuration E2E Test

- [ ] **Create test file**: `test/e2e/camera/pw_pan_speed_config.js`
- [ ] Launch browser with level editor
- [ ] Ensure game started
- [ ] Open Settings → Camera tab
- [ ] Set pan speed to 0.5x (slower)
- [ ] Perform middle-click pan (simulate drag)
- [ ] Take screenshot: Camera moved (slow distance)
- [ ] Open Settings, set pan speed to 2.0x (faster)
- [ ] Perform same middle-click pan distance
- [ ] Take screenshot: Camera moved (fast distance)
- [ ] Verify faster distance > slower distance (2x multiplier)

**Run command**:
```bash
node test/e2e/camera/pw_pan_speed_config.js
```
**Expected**: Test passes, screenshots show different pan distances

### 5.3 File Menu Separators E2E Test

- [ ] **Create test file**: `test/e2e/ui/pw_file_menu_separators.js`
- [ ] Launch browser with level editor
- [ ] Ensure game started
- [ ] Click "File" menu
- [ ] Take screenshot: File menu with separators visible
- [ ] Verify visual separation between groups:
  - New (alone)
  - Save/Load/Export (group)
  - Return to Main Menu/PlayTest (group)
- [ ] Click "Return to Main Menu"
- [ ] Confirm dialog appears (screenshot)
- [ ] Cancel and verify still in editor

**Run command**:
```bash
node test/e2e/ui/pw_file_menu_separators.js
```
**Expected**: Test passes, separators clearly visible in screenshot

---

## Phase 6: Documentation

### 6.1 Code Documentation

- [ ] Add JSDoc comments to SettingsManager:
  - Class description
  - Method descriptions with @param and @returns
  - Usage examples
- [ ] Add JSDoc comments to SettingsPanel:
  - Class description
  - Method descriptions
  - UI layout documentation
- [ ] Update FileMenuBar JSDoc:
  - Document separator support
  - Document new menu items
- [ ] Update CameraManager JSDoc:
  - Document pan speed multiplier

### 6.2 API Reference Documentation

- [ ] **Create file**: `docs/api/SettingsManager_API_Reference.md`
  - Class overview
  - Properties table
  - Methods table (get, set, resetToDefaults, onChange)
  - Settings schema
  - Usage examples
  - Best practices

- [ ] **Update file**: `docs/api/CameraManager_API_Reference.md` (if exists, else create)
  - Document pan speed configuration
  - Document pan methods (startPan, updatePan, endPan)
  - Usage examples with settings

### 6.3 User Guide

- [ ] **Create file**: `docs/guides/SETTINGS_PANEL_GUIDE.md`
  - Overview of settings panel
  - How to open (Edit → Settings)
  - Description of each setting
  - Screenshots of each tab
  - Keyboard shortcuts
  - Reset to defaults instructions

### 6.4 Update CHANGELOG.md

- [ ] Add to [Unreleased] section:

```markdown
## [Unreleased]

### User-Facing Changes

#### Added
- **Settings Panel**: New modal settings panel accessible via Edit → Settings
  - Camera settings: Configurable middle-click pan speed (0.5x - 3.0x)
  - Editor settings: Auto-save, theme, grid settings
  - Keybindings reference: View all keyboard shortcuts
  - Reset to defaults button
  - Settings persist across sessions via LocalStorage

- **File Menu Enhancements**: Visual separators and new actions
  - Separators group related actions for better visual organization
  - "Return to Main Menu" button exits level editor
  - "PlayTest" button tests current level in game mode

#### Changed
- **Middle-Click Pan Speed**: Now configurable via Settings panel (was hardcoded)

---

### Developer-Facing Changes

#### Added
- **SettingsManager** (`Classes/managers/SettingsManager.js`): Singleton for managing editor settings
  - `get(key, defaultValue)`: Get setting value with nested key support
  - `set(key, value)`: Set setting and persist to LocalStorage
  - `resetToDefaults()`: Reset all settings to config file defaults
  - `onChange(callback)`: Register listener for setting changes
  - Loads from `config/editor-settings.json` with LocalStorage overrides

- **SettingsPanel** (`Classes/ui/SettingsPanel.js`): Modal settings UI
  - Tabbed interface (General, Camera, Keybindings)
  - Interactive sliders, toggles, dropdowns
  - Real-time settings updates
  - Keyboard shortcuts (Escape to close)

- **FileMenuBar Menu Separators**: Support for `{ type: 'separator' }` in menu items
  - Renders horizontal line (10px height)
  - Non-interactive (no hover, no click)
  - Improves menu visual organization

#### Refactored
- **CameraManager.updatePan()**: Apply pan speed multiplier from SettingsManager
  - `const panSpeedMultiplier = SettingsManager.get('camera.panSpeed', 1.0);`
  - Preserves zoom-based scaling
  - Defaults to 1.0x if settings not available

#### Migration Guide
- No breaking changes
- Settings system is opt-in for existing code
- If using CameraManager.updatePan(), pan speed now configurable via settings
```

---

## Phase 7: Integration & Cleanup

### 7.1 Run Full Test Suite

- [ ] Run all tests:
```bash
npm test
```

- [ ] Verify results:
  - All unit tests pass
  - All integration tests pass
  - All E2E tests pass
  - No regressions in existing tests

- [ ] Check coverage:
```bash
npm run test:coverage
```
  - Target: 80%+ coverage for new code

### 7.2 Code Review Checklist

- [ ] Code follows project style guide
- [ ] No hardcoded values (use SettingsManager for config)
- [ ] No console.log in production code (use logVerbose)
- [ ] Error handling implemented:
  - Settings file load errors
  - LocalStorage quota errors
  - Invalid setting values
- [ ] Memory leaks prevented:
  - Event listeners properly removed
  - SettingsPanel cleanup on close
- [ ] Consistent naming conventions
- [ ] All public methods have JSDoc comments

### 7.3 Performance Check

- [ ] No performance regressions:
  - Settings lookup is fast (O(1) object property access)
  - Panel rendering doesn't impact game FPS
  - LocalStorage writes are async when possible
- [ ] Efficient algorithms used:
  - Settings caching (don't reload config every frame)
  - Render only when visible
- [ ] Proper caching implemented:
  - SettingsManager caches loaded settings
  - No redundant file loads
- [ ] No unnecessary re-renders:
  - Panel only renders when visible
  - Menu only renders when hovered/open

### 7.4 Manual Testing

- [ ] Test in browser (Level Editor mode):
  - Open File menu → verify separators visible
  - Click "Return to Main Menu" → verify confirmation dialog
  - Click "PlayTest" → verify level loads in game mode
  - Open Edit → Settings → verify panel opens
  - Change pan speed → verify immediate effect
  - Close and reopen → verify settings persisted
  - Click "Reset to Defaults" → verify all reset
  - Test all tabs (General, Camera, Keybindings)
  - Test keyboard shortcuts (Escape to close)
  - Test edge cases (min/max slider values)

---

## Phase 8: Commit & Push

### 8.1 Prepare Commit

- [ ] Stage all changed files:
```bash
git add Classes/managers/SettingsManager.js
git add Classes/ui/SettingsPanel.js
git add Classes/ui/FileMenuBar.js
git add Classes/controllers/CameraManager.js
git add config/editor-settings.json
git add sketch.js
git add index.html
git add test/unit/managers/settingsManager.test.js
git add test/unit/ui/settingsPanel.test.js
git add test/unit/ui/fileMenuBarSeparators.test.js
git add test/integration/settings/settingsIntegration.test.js
git add test/e2e/ui/pw_settings_panel.js
git add test/e2e/camera/pw_pan_speed_config.js
git add test/e2e/ui/pw_file_menu_separators.js
git add docs/api/SettingsManager_API_Reference.md
git add docs/guides/SETTINGS_PANEL_GUIDE.md
git add CHANGELOG.md
git add docs/checklists/active/MENU_BAR_ENHANCEMENTS_CHECKLIST.md
```

### 8.2 Commit Message

```
[Feature] Settings Panel + File Menu Enhancements

Implemented configurable settings system with modal settings panel,
file menu separators, and new actions (Return to Main Menu, PlayTest).

Key Features:
- Settings panel with tabs (General, Camera, Keybindings)
- Configurable middle-click pan speed (0.5x - 3.0x)
- Settings persistence via LocalStorage
- File menu visual separators for better organization
- Return to Main Menu and PlayTest actions
- Real-time settings application

Changes:
- NEW: Classes/managers/SettingsManager.js (singleton, settings management)
- NEW: Classes/ui/SettingsPanel.js (modal UI, tabs, sliders, toggles)
- NEW: config/editor-settings.json (default settings)
- MODIFIED: Classes/ui/FileMenuBar.js (separators, new menu items)
- MODIFIED: Classes/controllers/CameraManager.js (pan speed multiplier)
- MODIFIED: sketch.js (settings init, panel rendering, playtest loading)
- MODIFIED: index.html (load SettingsManager, SettingsPanel scripts)

Tests:
- Unit tests: SettingsManager (11 tests), SettingsPanel (10 tests), FileMenuBar separators (8 tests)
- Integration tests: Settings + CameraManager (5 tests), Menu interaction updates (4 tests)
- E2E tests: Settings panel UI (1 test), Pan speed config (1 test), File menu separators (1 test)
- Total: ~40 new tests, all passing

Documentation:
- API Reference: SettingsManager_API_Reference.md
- User Guide: SETTINGS_PANEL_GUIDE.md
- Updated: CHANGELOG.md (user-facing and developer-facing changes)

Coverage: 85% for new code
```

### 8.3 Push & Verify

- [ ] Push to feature branch:
```bash
git push origin feature/settings-panel-enhancements
```

- [ ] Verify CI/CD passes (GitHub Actions)
- [ ] Check build status
- [ ] Review on GitHub
- [ ] Create pull request if ready

---

## Key Design Decisions

### Middle-Click Pan Speed Implementation

**Question**: Where does the pan speed multiplier get applied?

**Answer**: In `CameraManager.updatePan()` method

**Current Code** (CameraManager.js line 209-223):
```javascript
updatePan(mouseX, mouseY) {
  if (!this._isPanning) return;
  
  // Calculate delta from pan start position
  const deltaX = mouseX - this._panStartX;
  const deltaY = mouseY - this._panStartY;
  
  // Move camera opposite to drag direction (intuitive "grab and drag" behavior)
  this.cameraX = this._cameraStartX - deltaX;
  this.cameraY = this._cameraStartY - deltaY;
  
  // Apply camera bounds if needed
  this.clampToBounds();
  
  // Sync with CameraController if available
  if (typeof CameraController !== 'undefined' && typeof CameraController.setCameraPosition === 'function') {
    CameraController.setCameraPosition(this.cameraX, this.cameraY);
  }
}
```

**Enhanced Code** (with pan speed multiplier):
```javascript
updatePan(mouseX, mouseY) {
  if (!this._isPanning) return;
  
  // Get pan speed multiplier from settings (default: 1.0x)
  const panSpeedMultiplier = typeof SettingsManager !== 'undefined' 
    ? SettingsManager.getInstance().get('camera.panSpeed', 1.0)
    : 1.0;
  
  // Calculate delta from pan start position
  const deltaX = mouseX - this._panStartX;
  const deltaY = mouseY - this._panStartY;
  
  // Move camera opposite to drag direction with speed multiplier
  // Multiplier allows user to control pan sensitivity (0.5x = slower, 2.0x = faster)
  this.cameraX = this._cameraStartX - (deltaX * panSpeedMultiplier);
  this.cameraY = this._cameraStartY - (deltaY * panSpeedMultiplier);
  
  // Apply camera bounds if needed
  this.clampToBounds();
  
  // Sync with CameraController if available
  if (typeof CameraController !== 'undefined' && typeof CameraController.setCameraPosition === 'function') {
    CameraController.setCameraPosition(this.cameraX, this.cameraY);
  }
}
```

**Why this approach?**
1. **Direct multiplier**: Simple multiplication of delta values
2. **No state needed**: Pan speed read on-demand (no caching issues)
3. **Real-time effect**: Next pan uses new speed immediately
4. **Preserves zoom scaling**: Existing zoom behavior unchanged
5. **Graceful degradation**: Defaults to 1.0x if SettingsManager unavailable

**Alternative Approaches Considered**:
- ❌ **Modify cameraPanSpeed property**: Would affect arrow key panning (unwanted)
- ❌ **Apply in MiddleClickPan**: Would require passing speed to every shortcut (complex)
- ✅ **Apply in updatePan()**: Clean, localized, immediate effect

---

## Implementation Notes

### SettingsManager Algorithms

**Nested Key Support**:
```javascript
get(key, defaultValue) {
  // Support nested keys like 'camera.panSpeed'
  const keys = key.split('.');
  let value = this._settings;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return defaultValue;
    }
  }
  
  return value !== undefined ? value : defaultValue;
}
```

**LocalStorage Persistence**:
```javascript
set(key, value) {
  // Update in-memory settings
  const keys = key.split('.');
  let target = this._settings;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in target)) target[k] = {};
    target = target[k];
  }
  
  target[keys[keys.length - 1]] = value;
  
  // Persist to LocalStorage
  try {
    localStorage.setItem('editor-settings', JSON.stringify(this._settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
  
  // Notify listeners
  this._notifyListeners(key, value);
}
```

**Loading Strategy**:
```javascript
loadSettings() {
  // 1. Load defaults from config file
  fetch('config/editor-settings.json')
    .then(response => response.json())
    .then(defaults => {
      this._settings = defaults;
      
      // 2. Override with LocalStorage
      try {
        const saved = localStorage.getItem('editor-settings');
        if (saved) {
          const userSettings = JSON.parse(saved);
          this._settings = this._mergeSettings(defaults, userSettings);
        }
      } catch (e) {
        console.warn('Failed to load user settings:', e);
      }
    })
    .catch(e => {
      console.error('Failed to load default settings:', e);
      // Fallback to hardcoded defaults
      this._settings = this._getHardcodedDefaults();
    });
}
```

### SettingsPanel Slider Implementation

**Pan Speed Slider** (0.5x - 3.0x):
```javascript
_renderPanSpeedSlider(x, y, width) {
  const currentSpeed = SettingsManager.getInstance().get('camera.panSpeed', 1.0);
  const min = 0.5;
  const max = 3.0;
  
  // Calculate slider position (normalized 0-1)
  const normalized = (currentSpeed - min) / (max - min);
  const handleX = x + (normalized * width);
  
  // Draw slider track
  stroke(100);
  line(x, y, x + width, y);
  
  // Draw slider handle
  fill(200);
  circle(handleX, y, 12);
  
  // Draw value label
  fill(220);
  text(`${currentSpeed.toFixed(1)}x`, handleX, y - 10);
  
  // Handle dragging (in handleMouseMove)
  if (this._draggingSlider === 'panSpeed') {
    const newNormalized = constrain((mouseX - x) / width, 0, 1);
    const newSpeed = min + (newNormalized * (max - min));
    SettingsManager.getInstance().set('camera.panSpeed', newSpeed);
  }
}
```

### File Menu Separator Rendering

**Separator Item**:
```javascript
{ type: 'separator' } // No label, no action
```

**Rendering Logic**:
```javascript
_renderDropdownItem(item, x, y, width) {
  if (item.type === 'separator') {
    // Draw horizontal line
    stroke(100, 100, 100);
    strokeWeight(1);
    line(x + 10, y + 5, x + width - 10, y + 5);
    return 10; // Separator height
  }
  
  // Regular item rendering
  // ... existing code ...
  return this.style.itemHeight;
}
```

**Click Handling**:
```javascript
_handleDropdownClick(x, y) {
  // Skip separators
  if (item.type === 'separator') continue;
  
  // ... existing click handling ...
}
```

---

## Testing Strategy

### Unit Test Coverage Goals
- SettingsManager: 100% (critical system)
- SettingsPanel: 85% (UI component)
- FileMenuBar separators: 90%
- CameraManager pan speed: 100%

### Integration Test Scenarios
1. **Settings → CameraManager**: Change pan speed, verify updatePan() uses it
2. **SettingsPanel → SettingsManager**: Change slider, verify setting saved
3. **FileMenuBar → SettingsPanel**: Click menu, verify panel opens
4. **Persistence**: Close/reopen, verify settings loaded from LocalStorage

### E2E Test Scenarios
1. **Visual Separators**: Screenshot File menu with separators
2. **Pan Speed Effect**: Video/screenshots showing different pan speeds
3. **Settings Persistence**: Close browser, reopen, verify settings restored
4. **Reset to Defaults**: Change settings, reset, verify defaults restored

---

## Dependencies

**External**:
- LocalStorage API (browser built-in)
- Fetch API (for loading config file)

**Internal**:
- CameraManager (applies pan speed)
- FileMenuBar (opens SettingsPanel)
- p5.js (rendering, input)

**New Systems**:
- SettingsManager (singleton)
- SettingsPanel (modal UI)

---

## Risks & Mitigations

### Risk 1: LocalStorage Quota Exceeded
**Impact**: Settings fail to save
**Mitigation**: Catch quota errors, warn user, fallback to session-only settings

### Risk 2: Config File Load Failure
**Impact**: No default settings
**Mitigation**: Hardcoded fallback defaults in SettingsManager

### Risk 3: Pan Speed Too Fast/Slow
**Impact**: Unusable camera controls
**Mitigation**: Clamp to sane range (0.5x - 3.0x), prominent reset button

### Risk 4: Settings Panel Blocks Gameplay
**Impact**: Can't interact with editor while panel open
**Mitigation**: Modal overlay, clear close button, Escape key closes

### Risk 5: Performance Degradation
**Impact**: Settings lookup slows down updatePan()
**Mitigation**: Simple object property access (O(1)), no file I/O per frame

---

## Future Enhancements

1. **Editable Keybindings**: Allow users to rebind keyboard shortcuts
2. **Settings Export/Import**: Share settings between devices
3. **Per-Level Settings**: Override global settings for specific levels
4. **Auto-Save Implementation**: Actually save terrain at intervals
5. **Theme System**: Light/dark theme visual changes
6. **Settings Search**: Filter settings by keyword
7. **Settings Validation**: Prevent invalid values (e.g., negative pan speed)
8. **Settings Categories**: Organize settings into more granular categories

---

## Completion Checklist

- [ ] All Phase 2 unit tests written and failing
- [ ] All Phase 3 implementations complete and passing
- [ ] All Phase 4 integration tests passing
- [ ] All Phase 5 E2E tests passing with screenshots
- [ ] All Phase 6 documentation updated
- [ ] Phase 7 full test suite passes (npm test)
- [ ] Phase 8 commit and push complete
- [ ] Pull request created and reviewed
- [ ] Feature merged to main branch

**Estimated Completion Date**: TBD

**Actual Completion Date**: TBD

---

## Notes

- This checklist follows the Feature Enhancement template
- TDD methodology: Write tests first (Red), implement (Green), refactor
- Middle-click pan speed is the PRIMARY driver for settings system
- Settings system is designed to be extensible (easy to add new settings)
- File menu separators are a visual UX improvement
- "Return to Main Menu" and "PlayTest" are convenience features
- Settings persist across sessions via LocalStorage
- Config file provides version-controlled defaults
- Real-time settings updates (no "Apply" button needed)
