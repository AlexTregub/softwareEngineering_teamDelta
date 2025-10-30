# New Map Size Dialog Enhancement - Checklist

**Feature**: Add modal dialog for "File → New" that prompts user to enter map dimensions before creating blank terrain

**Type**: Feature Enhancement (<8 hours)

**Created**: October 30, 2025

**Status**: 🟡 Pending Approval

---

## Overview

When user clicks "File → New" in the Level Editor menu bar, show a modal dialog that:
- Prompts for map width and height (in tiles)
- Validates input (positive integers, reasonable bounds)
- Creates a new blank terrain with specified dimensions
- Prompts to discard unsaved changes if terrain is modified

**Current Behavior**:
- `handleFileNew()` creates hardcoded blank terrain (no size input)
- Uses default dimensions (SparseTerrain with 32px tiles)

**New Behavior**:
- Shows `NewMapDialog` with width/height input fields
- User enters dimensions → Creates terrain with exact size
- Validation: 10-200 tiles for width/height (configurable)

---

## Key Design Decisions

### 1. Dialog Architecture
**Decision**: Extend `Dialog` base class (not `ConfirmationDialog`)
- **Rationale**: Need input fields (width/height), not just confirm/cancel
- **Pattern**: Follow `SaveDialog.js` and `LoadDialog.js` structure
- **Inheritance**: `Dialog` → `NewMapDialog`

### 2. Default Values
**Decision**: Default to 50x50 tiles (medium-sized map)
- **Rationale**: 
  - Small maps: 20-30 tiles (quick testing)
  - Medium maps: 40-60 tiles (balanced gameplay)
  - Large maps: 80-120 tiles (performance intensive)
- **User can override**: Input fields pre-populated with 50x50

### 3. Validation Bounds
**Decision**: Min 10 tiles, Max 200 tiles (both dimensions)
- **Rationale**:
  - <10 tiles: Too small for meaningful gameplay
  - >200 tiles: Performance concerns (40,000 tiles)
  - Configurable via constants for future tuning

### 4. Terrain Type Selection
**Decision**: Phase 1 uses SparseTerrain only (no dropdown)
- **Rationale**: 
  - SparseTerrain is current standard (lazy loading)
  - Avoids complexity in first iteration
  - Future enhancement: Add terrain type dropdown

### 5. Integration Point
**Decision**: Modify `LevelEditor.handleFileNew()` to show dialog
- **Current flow**: Check modified → Create terrain
- **New flow**: Check modified → Show dialog → (on confirm) Create terrain
- **Callback**: `NewMapDialog.onConfirm(width, height)` creates terrain

---

## Implementation Notes

### Dialog UI Layout
```
┌─────────────────────────────────────────┐
│  New Map                          [X]   │
├─────────────────────────────────────────┤
│                                         │
│  Enter map dimensions (tiles):         │
│                                         │
│  Width:  [_____50_____] tiles           │
│  Height: [_____50_____] tiles           │
│                                         │
│  Min: 10 tiles, Max: 200 tiles          │
│                                         │
│         [Cancel]    [Create]            │
│                                         │
└─────────────────────────────────────────┘
```

### Input Field Rendering
- Use `SaveDialog.js` as reference for text input rendering
- Active field highlighted with border
- Tab key switches between width/height fields
- Enter key confirms (if validation passes)
- Escape key cancels

### Validation Logic
```javascript
validateDimensions(width, height) {
  const min = 10;
  const max = 200;
  
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    return { valid: false, error: 'Dimensions must be integers' };
  }
  
  if (width < min || width > max || height < min || height > max) {
    return { valid: false, error: `Dimensions must be ${min}-${max} tiles` };
  }
  
  return { valid: true };
}
```

### Terrain Creation Algorithm
```javascript
// In handleFileNew() after dialog confirms:
createNewTerrain(width, height) {
  const tileSize = 32; // Standard tile size
  
  // Calculate pixel dimensions
  const pixelWidth = width * tileSize;
  const pixelHeight = height * tileSize;
  
  // Create SparseTerrain (lazy loading, black canvas)
  this.terrain = new SparseTerrain(tileSize, 'dirt');
  
  // Set metadata for bounds (optional, depends on SparseTerrain API)
  if (this.terrain.setDimensions) {
    this.terrain.setDimensions(width, height);
  }
  
  // Reinitialize editor components
  this.editor = new TerrainEditor(this.terrain);
  this.minimap = new MiniMap(this.terrain, 200, 200);
  // ... (rest of initialization)
}
```

---

## Phase 1: Unit Tests (TDD - Write FIRST) ✅ COMPLETE

### Test File: `test/unit/ui/NewMapDialog.test.js`

**Setup**:
- [x] Mock p5.js globals (createGraphics, rect, text, etc.)
- [x] Mock Dialog base class (if needed)
- [x] Create test instance of NewMapDialog

**Core Functionality**:
- [ ] **Test**: Dialog initializes with default values (50x50)
- [ ] **Test**: Dialog renders title "New Map"
- [ ] **Test**: Dialog renders width input field
- [ ] **Test**: Dialog renders height input field
- [ ] **Test**: Dialog renders Create/Cancel buttons
- [ ] **Test**: Dialog shows validation hint text (Min/Max bounds)

**Input Handling**:
- [ ] **Test**: Tab key switches between width and height fields
- [ ] **Test**: Backspace removes characters from active field
- [ ] **Test**: Numeric keys append to active field value
- [ ] **Test**: Non-numeric keys are ignored (except Tab, Enter, Esc)
- [ ] **Test**: Enter key triggers confirm (if validation passes)
- [ ] **Test**: Escape key triggers cancel

**Validation**:
- [ ] **Test**: Validates positive integers only
- [ ] **Test**: Rejects dimensions < 10 tiles
- [ ] **Test**: Rejects dimensions > 200 tiles
- [ ] **Test**: Accepts valid dimensions (10-200)
- [ ] **Test**: Shows error message for invalid input
- [ ] **Test**: Disables Create button when validation fails
- [ ] **Test**: Enables Create button when validation passes

**Callbacks**:
- [ ] **Test**: Calls `onConfirm(width, height)` when Create clicked
- [ ] **Test**: Calls `onCancel()` when Cancel clicked
- [ ] **Test**: Hides dialog after confirm
- [ ] **Test**: Hides dialog after cancel

**Run Tests** (should FAIL):
```powershell
npx mocha "test/unit/ui/NewMapDialog.test.js" --timeout 5000
```

---

## Phase 2: Implementation

### Step 1: Create NewMapDialog Class
**File**: `Classes/ui/NewMapDialog.js`

- [ ] **Create file** `Classes/ui/NewMapDialog.js`
- [ ] **Extend Dialog** base class
- [ ] **Constructor**: Initialize with defaults (width=50, height=50)
- [ ] **Properties**:
  - `_width` (number): Map width in tiles
  - `_height` (number): Map height in tiles
  - `_activeField` (string): 'width' or 'height'
  - `_validationError` (string): Error message (empty if valid)
  - `MIN_DIMENSION` (constant): 10
  - `MAX_DIMENSION` (constant): 200

- [ ] **Methods**:
  - `renderContent(buffer)`: Render width/height inputs, buttons
  - `handleKeyPress(key, keyCode)`: Handle input, Tab, Enter, Esc
  - `handleClick(mouseX, mouseY)`: Handle button clicks, field focus
  - `setActiveField(field)`: Switch between width/height fields
  - `validateDimensions()`: Validate width/height bounds
  - `getDimensions()`: Return {width, height}
  - `confirm()`: Override to include dimensions in callback
  - `show()`: Override to reset to defaults
  - `hide()`: Override to clear input state

- [ ] **Rendering**:
  - Title: "New Map"
  - Label: "Enter map dimensions (tiles):"
  - Input field: Width (with current value)
  - Input field: Height (with current value)
  - Hint text: "Min: 10 tiles, Max: 200 tiles"
  - Buttons: Cancel (left), Create (right, primary)
  - Error message (if validation fails, red text below inputs)

- [ ] **Styling**:
  - Active input field: Yellow border (highlight)
  - Inactive input field: Gray border
  - Create button: Blue background (enabled), Gray (disabled)
  - Error text: Red, centered below inputs

### Step 2: Add to index.html
- [ ] **Add script tag** in correct load order (after Dialog.js, before LevelEditor.js)
```html
<script src="Classes/ui/Dialog.js"></script>
<script src="Classes/ui/NewMapDialog.js"></script>
```

### Step 3: Integrate with LevelEditor
**File**: `Classes/systems/ui/LevelEditor.js`

- [ ] **Add property**: `this.newMapDialog = null;` in constructor
- [ ] **Initialize dialog** in `initialize()` method:
```javascript
// Create new map dialog
this.newMapDialog = new NewMapDialog();
this.newMapDialog.onConfirm = (width, height) => {
  this._createNewTerrain(width, height);
  this.newMapDialog.hide();
};
this.newMapDialog.onCancel = () => {
  this.newMapDialog.hide();
};
```

- [ ] **Modify handleFileNew()**: Show dialog instead of direct creation
```javascript
handleFileNew() {
  // Check if terrain has been modified
  if (this.isModified) {
    const confirmed = confirm("Discard unsaved changes?");
    if (!confirmed) return false;
  }
  
  // Show new map dialog
  this.newMapDialog.show();
  return true;
}
```

- [ ] **Add _createNewTerrain() helper**:
```javascript
_createNewTerrain(width, height) {
  const tileSize = 32;
  
  // Create new terrain with specified dimensions
  if (typeof SparseTerrain !== 'undefined') {
    this.terrain = new SparseTerrain(tileSize, 'dirt');
    // TODO: Set bounds metadata if SparseTerrain supports it
  } else if (typeof CustomTerrain !== 'undefined') {
    this.terrain = new CustomTerrain(width, height);
  } else {
    this.terrain = new gridTerrain(width, height);
  }
  
  // Reinitialize editor components (existing logic from handleFileNew)
  this.editor = new TerrainEditor(this.terrain);
  this.minimap = new MiniMap(this.terrain, 200, 200);
  // ... (rest of reinitialization)
  
  this.currentFilename = 'Untitled';
  this.isModified = false;
  
  this.notifications.show(`New ${width}x${height} map created`, 'success');
}
```

- [ ] **Update render()**: Add dialog rendering
```javascript
render() {
  // ... (existing rendering)
  
  // Render new map dialog if visible
  if (this.newMapDialog && this.newMapDialog.isVisible()) {
    this.newMapDialog.render();
  }
}
```

- [ ] **Update handleClick()**: Add dialog click delegation
```javascript
handleClick(mouseX, mouseY) {
  // PRIORITY 1: Check if new map dialog is open
  if (this.newMapDialog && this.newMapDialog.isVisible()) {
    const consumed = this.newMapDialog.handleClick(mouseX, mouseY);
    return; // Block terrain interaction
  }
  
  // ... (existing click handling)
}
```

- [ ] **Update handleKeyPress()**: Add dialog keyboard handling
```javascript
handleKeyPress(key) {
  // PRIORITY: Handle new map dialog keyboard input
  if (this.newMapDialog && this.newMapDialog.isVisible()) {
    const consumed = this.newMapDialog.handleKeyPress(key, keyCode);
    if (consumed) return;
  }
  
  // ... (existing keyboard handling)
}
```

### Step 4: Run Unit Tests (should PASS)
```powershell
npx mocha "test/unit/ui/NewMapDialog.test.js" --timeout 5000
```

**Verify**:
- [ ] All unit tests pass
- [ ] No new errors in other test suites
- [ ] Code coverage >80% for NewMapDialog.js

---

## Phase 3: Integration Tests

### Test File: `test/integration/ui/newMapDialog.integration.test.js`

**Setup**:
- [ ] Use JSDOM for DOM environment
- [ ] Sync `global` and `window` objects
- [ ] Initialize LevelEditor with real components

**Integration Scenarios**:
- [ ] **Test**: LevelEditor initializes with NewMapDialog instance
- [ ] **Test**: handleFileNew() shows NewMapDialog (dialog.visible === true)
- [ ] **Test**: Dialog confirm creates terrain with specified dimensions
- [ ] **Test**: Dialog cancel does not create terrain
- [ ] **Test**: Modified terrain prompts "discard changes" before showing dialog
- [ ] **Test**: Dialog blocks terrain interaction when visible
- [ ] **Test**: Dialog keyboard input does not trigger level editor shortcuts

**Run Tests**:
```powershell
npx mocha "test/integration/ui/newMapDialog.integration.test.js" --timeout 10000
```

---

## Phase 4: E2E Tests with Screenshots (PRIMARY VALIDATION)

### Test File: `test/e2e/levelEditor/pw_new_map_dialog.js`

**Setup**:
- [ ] Launch headless browser
- [ ] Navigate to `http://localhost:8000?test=1`
- [ ] Use `ensureGameStarted()` to bypass main menu
- [ ] Switch to LEVEL_EDITOR state

**Test Scenarios**:

#### Scenario 1: Dialog Opens on File → New
- [ ] **Action**: Click "File" menu → Click "New"
- [ ] **Verify**: NewMapDialog visible (check for title "New Map")
- [ ] **Screenshot**: `levelEditor/new_map_dialog_open.png` (success/)
- [ ] **Assertion**: Dialog contains width/height input fields

#### Scenario 2: Default Values Pre-Populated
- [ ] **Action**: Open dialog
- [ ] **Verify**: Width field shows "50", Height field shows "50"
- [ ] **Screenshot**: `levelEditor/new_map_dialog_defaults.png` (success/)

#### Scenario 3: Input Validation - Valid Dimensions
- [ ] **Action**: Enter width=30, height=40
- [ ] **Verify**: No error message, Create button enabled
- [ ] **Screenshot**: `levelEditor/new_map_dialog_valid.png` (success/)

#### Scenario 4: Input Validation - Invalid Dimensions (Too Small)
- [ ] **Action**: Enter width=5, height=50
- [ ] **Verify**: Error message "Dimensions must be 10-200 tiles", Create button disabled
- [ ] **Screenshot**: `levelEditor/new_map_dialog_error_small.png` (failure/)

#### Scenario 5: Input Validation - Invalid Dimensions (Too Large)
- [ ] **Action**: Enter width=250, height=50
- [ ] **Verify**: Error message displayed, Create button disabled
- [ ] **Screenshot**: `levelEditor/new_map_dialog_error_large.png` (failure/)

#### Scenario 6: Terrain Created with Custom Dimensions
- [ ] **Action**: Enter width=25, height=30 → Click Create
- [ ] **Verify**: 
  - Dialog closes (not visible)
  - Terrain initialized (check `levelEditor.terrain`)
  - Notification shows "New 25x30 map created"
- [ ] **Screenshot**: `levelEditor/new_map_created.png` (success/)

#### Scenario 7: Cancel Does Not Create Terrain
- [ ] **Action**: Open dialog → Enter dimensions → Click Cancel
- [ ] **Verify**: Dialog closes, existing terrain unchanged
- [ ] **Screenshot**: `levelEditor/new_map_cancelled.png` (success/)

#### Scenario 8: Escape Key Cancels Dialog
- [ ] **Action**: Open dialog → Press Escape key
- [ ] **Verify**: Dialog closes without creating terrain
- [ ] **Screenshot**: `levelEditor/new_map_escape.png` (success/)

**Run E2E Tests**:
```powershell
node test\e2e\levelEditor\pw_new_map_dialog.js
```

**Verify Screenshots**:
- [ ] Check `test/e2e/screenshots/levelEditor/success/` for pass screenshots
- [ ] Check `test/e2e/screenshots/levelEditor/failure/` for error screenshots
- [ ] Verify dialog is visible (NOT main menu)
- [ ] Verify input fields, buttons, error messages render correctly

---

## Phase 5: Documentation Updates

### API Reference
**File**: `docs/api/NewMapDialog_API_Reference.md`

- [ ] **Create API reference** following Godot Engine format (see copilot instructions)
- [ ] **Sections**:
  - Class description
  - Inherits: Dialog
  - Properties table (width, height, activeField, MIN_DIMENSION, MAX_DIMENSION)
  - Methods table (show, hide, confirm, handleKeyPress, validateDimensions, etc.)
  - Method descriptions with code examples
  - Common Workflows (open dialog → enter dimensions → create map)
  - Related Docs (Dialog.js, LevelEditor.js)

### Level Editor Documentation
**File**: `docs/LEVEL_EDITOR_SETUP.md`

- [ ] **Add section**: "Creating a New Map"
- [ ] **Content**:
  - How to open File → New
  - Dialog UI explanation (width/height inputs)
  - Validation rules (10-200 tiles)
  - Keyboard shortcuts (Tab, Enter, Escape)
  - Default dimensions (50x50)
  - Screenshot of dialog (embed image)

### CHANGELOG.md
**File**: `CHANGELOG.md`

- [ ] **Add to [Unreleased] section**:

```markdown
## [Unreleased]

### User-Facing Changes

#### Added
- **New Map Size Dialog**: File → New now shows modal dialog for entering map dimensions (10-200 tiles)
  - Input validation with helpful error messages
  - Default dimensions: 50x50 tiles
  - Keyboard shortcuts: Tab (switch fields), Enter (create), Escape (cancel)
  - Creates terrain with exact user-specified dimensions

---

### Developer-Facing Changes

#### Added
- **NewMapDialog** (`Classes/ui/NewMapDialog.js`): Modal dialog for map dimension input
  - Extends `Dialog` base class
  - Methods: `validateDimensions()`, `getDimensions()`, `handleKeyPress()`, `renderContent()`
  - Properties: `_width`, `_height`, `_activeField`, `MIN_DIMENSION=10`, `MAX_DIMENSION=200`
- **LevelEditor._createNewTerrain(width, height)**: Helper method for terrain creation with custom dimensions
  - Replaces hardcoded terrain creation in `handleFileNew()`
  - Integrates with NewMapDialog callbacks
```

---

## Phase 6: Quality Gates

### Code Quality
- [ ] **Linting**: No ESLint warnings in new files
- [ ] **Code style**: Follows existing conventions (see copilot instructions)
- [ ] **Comments**: All methods documented with JSDoc
- [ ] **No console.logs**: Use `logNormal()`, `logVerbose()` instead

### Test Coverage
- [ ] **Unit tests**: >80% coverage for NewMapDialog.js
- [ ] **Integration tests**: All pass (no regressions)
- [ ] **E2E tests**: All pass with screenshot proof
- [ ] **BDD tests**: N/A (no user-facing behavior changes needing BDD)

### Documentation
- [ ] **API reference**: Complete with examples
- [ ] **User guide**: Updated with new feature
- [ ] **CHANGELOG**: User-facing and developer-facing sections updated
- [ ] **No new files**: Updated existing docs, no summaries created

### Full Test Suite
```powershell
npm test  # Unit → Integration → BDD → E2E
```

- [ ] **All tests pass** (no regressions)
- [ ] **Exit code**: 0 (success)

---

## Phase 7: Final Review & Commit

### Pre-Commit Checklist
- [ ] Run full test suite (all pass)
- [ ] Review all changed files (no unintended changes)
- [ ] Verify screenshots show correct UI (not main menu)
- [ ] Check CHANGELOG.md updated correctly
- [ ] Verify no emoji decoration (only checkmarks/warnings)
- [ ] Ensure all TODOs resolved or documented

### Git Workflow
```powershell
# Stage changes
git add Classes/ui/NewMapDialog.js
git add Classes/systems/ui/LevelEditor.js
git add test/unit/ui/NewMapDialog.test.js
git add test/integration/ui/newMapDialog.integration.test.js
git add test/e2e/levelEditor/pw_new_map_dialog.js
git add test/e2e/screenshots/levelEditor/
git add docs/api/NewMapDialog_API_Reference.md
git add docs/LEVEL_EDITOR_SETUP.md
git add CHANGELOG.md
git add index.html

# Commit with descriptive message
git commit -m "feat: Add New Map Size Dialog for Level Editor

- NewMapDialog allows user to specify map dimensions (10-200 tiles)
- File → New now prompts for dimensions instead of hardcoded size
- Input validation with error messages
- Keyboard shortcuts: Tab, Enter, Escape
- Default dimensions: 50x50 tiles
- Full test coverage: unit, integration, E2E with screenshots
- API reference and user guide updated"
```

---

## Completion Criteria

### Feature Complete When:
- ✅ All unit tests pass (NewMapDialog.test.js)
- ✅ All integration tests pass (newMapDialog.integration.test.js)
- ✅ All E2E tests pass with screenshots (pw_new_map_dialog.js)
- ✅ Full test suite passes (`npm test` exit code 0)
- ✅ Documentation updated (API reference, user guide, CHANGELOG)
- ✅ Code reviewed and committed to version control

### Success Metrics:
- User can create maps with custom dimensions via File → New
- Input validation prevents invalid dimensions (< 10 or > 200)
- Dialog UX is intuitive (defaults, keyboard shortcuts, error messages)
- No regressions in existing Level Editor functionality
- Screenshot proof shows dialog rendering correctly

---

## Notes

**Reuse Opportunities**:
- `Dialog.js` - Base class with rendering framework ✅
- `SaveDialog.js` - Reference for text input rendering ✅
- `LoadDialog.js` - Reference for button layout ✅
- Test helpers in `test/helpers/uiTestHelpers.js` ✅

**Future Enhancements** (NOT in this checklist):
- Terrain type selection dropdown (SparseTerrain vs CustomTerrain vs gridTerrain)
- Preset buttons (Small 20x20, Medium 50x50, Large 100x100)
- Recent dimensions dropdown (remember last used sizes)
- Tile size selection (16px, 32px, 64px)

**Known Limitations**:
- SparseTerrain may not enforce bounds (relies on lazy loading)
- CustomTerrain and gridTerrain have fixed bounds (easier to enforce)
- Future work: SparseTerrain.setDimensions() API for bounds metadata

---

## Status Log

| Date | Status | Notes |
|------|--------|-------|
| Oct 30, 2025 | 🟡 Pending | Checklist created, awaiting user approval to proceed |
