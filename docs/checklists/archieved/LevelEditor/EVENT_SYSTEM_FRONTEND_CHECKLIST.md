# Event System Frontend - Feature Development Checklist

**Date**: October 27, 2025  
**Status**: Planning Phase  
**Branch**: `DW_randomEvents`  
**Methodology**: Test-Driven Development (TDD)  
**Priority**: HIGH (Complete Random Events Feature)

---

## Pre-Development

### Current State Review

#### Already Complete (Phase 1-3)
- [x] EventManager - Full API with event registration, triggering, flags, triggers
- [x] EventEditorPanel - UI for event creation, editing, JSON import/export
- [x] Drag-to-Place System - EventEditorPanel has drag state management (startDragPlacement, updateDragPosition, completeDrag)
- [x] Level Editor Integration - EventEditorPanel registered in Tools panel
- [x] Documentation - API reference, event types guide, trigger types guide, integration guide

#### Missing Components (This Checklist)
- [ ] Wire EventEditorPanel to Tools Panel - Toggle button not functional
- [ ] Drag-and-Drop Visual Feedback - Show flag icon while dragging
- [ ] EventFlag Class - Visual flag entity with bounding box
- [ ] EventFlagLayer - Manage collection of flags on Level Editor canvas
- [ ] Spatial Trigger Creation - Convert drag-drop to SpatialTrigger registration
- [ ] Flag Customization UI - Edit trigger radius, shape, color, linked event
- [ ] Flag Rendering - Visible in editor, invisible in game
- [ ] Export/Import Integration - Save/load flags with terrain JSON

### Requirements Analysis

#### Affected Systems/Components
- EventEditorPanel (existing, needs wiring)
- LevelEditorPanels (needs Events button)
- EventFlag class (new, visual entity)
- EventFlagLayer class (new, collection manager)
- FlagPropertiesPanel (new, customization UI)
- EventFunctionRegistry (new, callable functions)
- TerrainExporter/Importer (extend for flags)
- EventManager (extend trigger evaluation)

#### Technical Decisions
- Use existing DraggablePanelManager for UI state
- EventFlag class will handle both rendering and trigger zone logic
- Flags invisible in game mode (editorMode parameter)
- Spatial triggers auto-registered on flag placement
- Function registry for extensible event actions
- Export flags with terrain JSON (single file)

---

### Phase 1: Tools Panel Integration (Wire-Up) - ✅ COMPLETE

**Goal**: Add Events button to Tools panel that toggles EventEditorPanel

**Status**: ✅ COMPLETE (All sub-phases A/B/C/D complete)

**Summary**: Successfully implemented Events button in Tools panel with toggle functionality. All tests passing (10 unit + 15 integration + 5 E2E).

**Changes Made**:
- Added `addButton()` method to ToolBar class for extensibility
- Modified `handleClick()` in ToolBar to support onClick callbacks
- Added `toggleEventsPanel()` method to LevelEditorPanels
- Added Events button (🚩) to toolbar in LevelEditor initialization
- Consolidated panel initialization (removed duplicate `draggablePanels`)
- E2E tests verify button visibility, panel toggle, and visual feedback

---

## Implementation Phase

### Phase 1: Tools Panel Integration (Wire-Up) - ✅ COMPLETE

**Goal**: Add Events button to Tools panel that toggles EventEditorPanel

#### Source Code Changes

**File to Modify**: `Classes/systems/ui/LevelEditorPanels.js`

- [x] Add "Events" button to Tools panel config
- [x] Implement `toggleEventsPanel()` method  
- [x] Connect to `draggablePanelManager.togglePanel('level-editor-events')`
- [x] Set default visibility: hidden
- [x] Update button highlight based on visibility state

**Files Modified**:
- `Classes/ui/ToolBar.js` - Added `addButton()` method for extensibility
- `Classes/systems/ui/LevelEditor.js` - Added Events button to toolbar, consolidated panel initialization

**Status**: ✅ COMPLETE

#### Code Quality
- [x] Add inline comments for panel toggle logic
- [x] Use descriptive variable names
- [x] Follow existing LevelEditorPanels pattern
- [x] Handle edge cases (panel not found)

#### Unit Tests (Write FIRST)

**Test File**: `test/unit/levelEditor/eventsToolsPanelIntegration.test.js`

- [x] Tools panel should have "Events" button
- [x] Clicking Events button should toggle EventEditorPanel visibility
- [x] Events button should highlight when panel visible
- [x] Panel should be hidden by default
- [x] Panel should persist visibility state in draggablePanelManager
- [x] Multiple clicks should toggle on/off correctly
- [x] Target 100% code coverage for new code

**Status**: ✅ COMPLETE - All 10 tests passing

#### Integration Tests

**Test File**: `test/integration/levelEditor/eventsPanel.integration.test.js`

- [x] Events panel toggles correctly in full Level Editor
- [x] Panel state persists across Level Editor deactivate/activate
- [x] Panel integrates with other Level Editor panels (no conflicts)
- [x] Panel closes when switching to PLAYING state
- [x] Mock external dependencies appropriately
- [x] Test error propagation

**Status**: ✅ COMPLETE - All 15 tests passing

#### E2E Tests

**Test File**: `test/e2e/levelEditor/pw_events_panel_toggle.js`

- [x] Test in browser automation (Puppeteer)
- [x] Verify Events button visible in Tools panel
- [x] Test clicking button shows EventEditorPanel
- [x] Verify panel contains event list and add button
- [x] Test clicking again hides panel
- [x] Capture screenshots for each state
- [x] Add timeouts to prevent hanging

**Test Results**: 5/5 passing (events button visible, panel hidden by default, panel shows on click, panel contains event editor, panel hides on second click)

**Screenshots Generated**:
- `test/e2e/screenshots/levelEditor/success/events_button_visible.png`
- `test/e2e/screenshots/levelEditor/success/panel_hidden_by_default.png`
- `test/e2e/screenshots/levelEditor/success/panel_shown_after_click.png`
- `test/e2e/screenshots/levelEditor/success/panel_with_content.png`
- `test/e2e/screenshots/levelEditor/success/panel_hidden_after_second_click.png`

**Status**: ✅ COMPLETE - All E2E tests passing with visual confirmation

---

### Phase 2: EventFlag Class (Visual Flag Entity)

**Goal**: Create EventFlag class for visual representation in Level Editor

**Status**: ✅ COMPLETE (Phase 2A + 2B)

**Summary**: Successfully implemented EventFlag class with full API. All 28 unit tests passing.

**Changes Made**:
- Created `EventFlag` class with circle and rectangle shapes
- Implemented trigger zone detection (`containsPoint`)
- Added editor-only rendering (invisible in game)
- JSON import/export support
- Unique ID generation
- Validation for required fields
- Edge case handling (negative radius, zero radius, large coordinates)

#### Source Code Changes

**File to Create**: `Classes/events/EventFlag.js`

- [x] Create `EventFlag` class
- [x] Constructor: Accept config `{id, x, y, radius, width, height, shape, eventId, color, oneTime, triggerType, condition}`
- [x] Property: `this.id` - Unique flag ID (auto-generate if not provided)
- [x] Property: `this.x, this.y` - World coordinates
- [x] Property: `this.shape` - 'circle' or 'rectangle'
- [x] Property: `this.radius` - Circle radius (default: 64)
- [x] Property: `this.width, this.height` - Rectangle dimensions
- [x] Property: `this.eventId` - Linked event ID
- [x] Property: `this.color` - Outline color (default: yellow)
- [x] Property: `this.oneTime` - Trigger once (default: false for repeatable)
- [x] Property: `this.triggerType` - 'spatial', 'flag', 'custom', 'combined'
- [x] Property: `this.condition` - Condition data for flag/custom triggers
- [x] Method: `containsPoint(x, y)` - Check if point in zone
- [x] Method: `render(editorMode)` - Render flag (visible only if editorMode true)
- [x] Method: `exportToJSON()` - Serialize
- [x] Method: `importFromJSON(data)` - Deserialize
- [x] Add to `index.html`

**Status**: ✅ COMPLETE

#### Code Quality
- [x] Add JSDoc comments to public functions
- [x] Document shape types (circle/rectangle)
- [x] Explain editorMode parameter
- [x] Add examples for API usage
- [x] Add null checks for required fields
- [x] Handle edge cases (negative radius, invalid shape)

#### Unit Tests (Write FIRST)

**Test File**: `test/unit/events/EventFlag.test.js`

- [x] Should initialize with position and radius
- [x] Should support circle and rectangle shapes
- [x] Should store linked event ID
- [x] Should have customizable color
- [x] Should have one-time vs repeatable flag
- [x] Should export to JSON
- [x] Should import from JSON
- [x] Should check if point is within trigger zone (circle)
- [x] Should check if point is within trigger zone (rectangle)
- [x] Should have unique ID generation
- [x] Should validate required fields (x, y, eventId)
- [x] Test edge cases and boundary conditions
- [x] Test error handling

**Test Results**: 28/28 passing
- Constructor: 8 tests
- Validation: 5 tests
- containsPoint(): 4 tests
- render(): 4 tests
- exportToJSON(): 3 tests
- importFromJSON(): 2 tests
- Edge Cases: 2 tests

**Status**: ✅ COMPLETE - All unit tests passing

---

### Phase 3: EventFlagLayer Class (Flag Collection Manager)

**Goal**: Manage collection of EventFlags in Level Editor

**Status**: ✅ COMPLETE (Phase 3A + 3B)

**Summary**: Successfully implemented EventFlagLayer class for managing flag collections. All 36 unit tests passing.

**Changes Made**:
- Created `EventFlagLayer` class with Map-based storage
- Implemented add/remove/get operations
- Added selection state management
- Spatial queries via `findFlagsAtPosition()`
- Batch rendering of all flags
- JSON import/export with clear-before-import behavior
- Edge case handling (null flags, large collections)

#### Source Code Changes

**File to Create**: `Classes/events/EventFlagLayer.js`

- [x] Create `EventFlagLayer` class
- [x] Constructor: Accept optional terrain reference
- [x] Property: `this.flags = new Map()` - Map of flagId => EventFlag
- [x] Property: `this.selectedFlagId = null` - Currently selected flag
- [x] Method: `addFlag(eventFlag)` - Add flag to collection
- [x] Method: `removeFlag(flagId)` - Remove flag
- [x] Method: `getFlag(flagId)` - Retrieve flag
- [x] Method: `getAllFlags()` - Return all flags as array
- [x] Method: `findFlagsAtPosition(x, y)` - Spatial query
- [x] Method: `selectFlag(flagId)` - Set selected flag
- [x] Method: `getSelectedFlag()` - Get selected flag instance
- [x] Method: `render(editorMode)` - Render all flags
- [x] Method: `exportToJSON()` - Serialize all flags
- [x] Method: `importFromJSON(data)` - Deserialize flags
- [x] Method: `clear()` - Remove all flags
- [x] Add to `index.html`

**Status**: ✅ COMPLETE

#### Code Quality
- [x] Add inline comments for complex logic
- [x] Use descriptive method names
- [x] Keep functions focused and single-purpose
- [x] Handle edge cases (duplicate IDs, null flags)
- [x] Adhere to DRY principle

#### Unit Tests (Write FIRST)

**Test File**: `test/unit/events/EventFlagLayer.test.js`

- [x] Should initialize with empty flag collection
- [x] Should add flag to collection
- [x] Should remove flag by ID
- [x] Should get flag by ID
- [x] Should get all flags
- [x] Should find flags at position (spatial query)
- [x] Should export all flags to JSON
- [x] Should import flags from JSON
- [x] Should clear all flags
- [x] Should handle duplicate IDs (replace with same ID)
- [x] Should render all flags in editor mode
- [x] Should not render flags in game mode
- [x] Should handle selection state
- [x] Should clear selection when removing selected flag
- [x] Ensure test isolation (no shared state)

**Test Results**: 36/36 passing
- Constructor: 3 tests
- addFlag(): 4 tests
- removeFlag(): 4 tests
- getFlag(): 2 tests
- getAllFlags(): 2 tests
- findFlagsAtPosition(): 3 tests
- selectFlag(): 4 tests
- getSelectedFlag(): 2 tests
- render(): 3 tests
- exportToJSON(): 2 tests
- importFromJSON(): 3 tests
- clear(): 2 tests
- Edge Cases: 2 tests

**Status**: ✅ COMPLETE - All unit tests passing

---

### Phase 4: Drag-and-Drop System

**Goal**: Enable dragging events from EventEditorPanel to Level Editor canvas

**Status**: PENDING (Next phase)

#### Source Code Changes

**Files to Modify**: 
- `Classes/systems/ui/LevelEditor.js`
- `Classes/systems/ui/EventEditorPanel.js`

**Implementation Tasks (LevelEditor.js)**:
- [ ] Add property: `this.eventFlagLayer = null`
- [ ] Initialize EventFlagLayer in `initialize()`
- [ ] Check `eventEditor.isDragging()` in `update()`
- [ ] Call `eventEditor.updateDragPosition(mouseX, mouseY)` during drag
- [ ] Render drag preview (flag icon at cursor)
- [ ] Handle mouseReleased when dragging
- [ ] Convert screen coords to world coords
- [ ] Call `eventEditor.completeDrag(worldX, worldY)`
- [ ] Create EventFlag from returned config
- [ ] Add flag to EventFlagLayer
- [ ] Handle Escape key: Call `eventEditor.cancelDrag()`
- [ ] Render EventFlagLayer in `render()`

**Implementation Tasks (EventEditorPanel.js)**:
- [ ] Verify `startDragPlacement(eventId)` is called on flag button click
- [ ] Verify `updateDragPosition(mouseX, mouseY)` updates cursor state
- [ ] Verify `completeDrag(worldX, worldY)` creates trigger config
- [ ] Return EventFlag config from `completeDrag()` for Level Editor to use

#### Code Quality
- [ ] Add comments for drag lifecycle
- [ ] Use descriptive variable names for coordinates
- [ ] Handle null checks (eventEditor might not exist)
- [ ] Follow existing LevelEditor patterns

#### Unit Tests (Write FIRST)

**Test File**: `test/unit/levelEditor/eventFlagDragDrop.test.js`

- [ ] Should start drag when clicking flag button on event
- [ ] Should track cursor position during drag
- [ ] Should convert screen coords to world coords
- [ ] Should create EventFlag at drop location
- [ ] Should register SpatialTrigger with EventManager
- [ ] Should cancel drag on Escape key
- [ ] Should prevent multiple simultaneous drags
- [ ] Should handle drag outside Level Editor bounds (cancel)
- [ ] Should update drag cursor position on mouseDrag
- [ ] Should complete drag on mouseReleased

#### Integration Tests

**Test File**: `test/integration/levelEditor/eventFlagDragDrop.integration.test.js`

- [ ] Full drag-drop workflow from EventEditorPanel to Level Editor
- [ ] EventFlag created at correct world coordinates
- [ ] SpatialTrigger registered with EventManager
- [ ] Flag appears in EventFlagLayer
- [ ] Flag visible in editor, invisible in game mode
- [ ] Multiple flags can be placed

#### E2E Tests

**Test File**: `test/e2e/levelEditor/pw_event_flag_drag_drop.js`

- [ ] Open EventEditorPanel, create test event
- [ ] Click flag button, verify drag starts
- [ ] Move cursor over canvas, verify preview renders
- [ ] Drop flag, verify placement
- [ ] Verify flag renders with outline
- [ ] Export terrain JSON, verify flag included
- [ ] Capture screenshots for verification

---

### Phase 5: Flag Properties Panel (Customization UI)

**Goal**: Allow editing of placed flags (radius, color, shape, event, conditions)

#### Source Code Changes

**File to Create**: `Classes/ui/FlagPropertiesPanel.js`

- [ ] Create `FlagPropertiesPanel` class
- [ ] Constructor: Accept eventFlagLayer and eventManager references
- [ ] Property: `this.selectedFlag = null`
- [ ] Method: `setSelectedFlag(flagId)` - Load flag for editing
- [ ] Method: `render(x, y, width, height)` - Render UI
- [ ] UI Elements: Flag ID input, Event dropdown, Radius slider, Shape selector, Color picker
- [ ] UI Elements: One-time toggle, Trigger type dropdown, Condition editor
- [ ] UI Elements: Save button, Cancel button
- [ ] Method: `handleClick(mouseX, mouseY, contentX, contentY)` - Handle UI interactions
- [ ] Method: `saveChanges()` - Apply changes to flag
- [ ] Method: `cancelEdits()` - Discard changes
- [ ] Add to `index.html`

**Files to Modify**: `Classes/systems/ui/LevelEditorPanels.js`

- [ ] Create FlagPropertiesPanel draggable panel
- [ ] Position: `{ x: 270, y: 470 }`
- [ ] Register in LEVEL_EDITOR state
- [ ] Hide by default, show when flag selected
- [ ] Update panel when different flag selected
- [ ] Close panel when flag deselected

#### Code Quality
- [ ] Add JSDoc comments for UI methods
- [ ] Document UI element positions
- [ ] Use descriptive names for form inputs
- [ ] Handle edge cases (no flag selected)

#### Unit Tests (Write FIRST)

**Test File**: `test/unit/ui/FlagPropertiesPanel.test.js`

- [ ] Should show properties of selected flag
- [ ] Should update flag ID on text input change
- [ ] Should update linked event ID from dropdown
- [ ] Should update trigger radius with slider
- [ ] Should update trigger shape (circle/rectangle)
- [ ] Should update color with color picker
- [ ] Should toggle one-time vs repeatable
- [ ] Should update trigger type (spatial/flag/custom/combined)
- [ ] Should show condition editor for flag/custom triggers
- [ ] Should save changes to flag
- [ ] Should cancel edits without saving
- [ ] Should handle no flag selected (show placeholder)

#### Integration Tests

**Test File**: `test/integration/levelEditor/flagPropertiesPanel.integration.test.js`

- [ ] Selecting flag shows FlagPropertiesPanel
- [ ] Editing radius updates flag and re-renders
- [ ] Changing event ID updates linked event
- [ ] Saving changes persists to flag
- [ ] Canceling edits reverts changes
- [ ] Deselecting flag hides panel

#### E2E Tests

**Test File**: `test/e2e/levelEditor/pw_flag_properties_panel.js`

- [ ] Place flag, click to select
- [ ] Properties panel appears
- [ ] Edit radius, verify visual update
- [ ] Change color, verify outline color changes
- [ ] Save changes, verify persistence
- [ ] Capture screenshots for verification

---

### Phase 6: Trigger Registration & Execution

**Goal**: Connect placed flags to EventManager trigger system

#### Source Code Changes

**Spatial Trigger Registration** (Already in EventEditorPanel.completeDrag):
- [ ] Verify `completeDrag()` registers SpatialTrigger with EventManager
- [ ] Verify trigger includes flag position, radius, eventId
- [ ] Verify oneTime property passed to trigger
- [ ] Test trigger fires when player enters zone

**Flag-Based Trigger Support**:
- [ ] Add flag condition editor to FlagPropertiesPanel
- [ ] Support flag name, operator, value in UI
- [ ] Create FlagTrigger when flag has flag-based condition
- [ ] Test flag trigger fires when condition met

**Custom Trigger Support**:
- [ ] Add JavaScript code editor to FlagPropertiesPanel
- [ ] Validate JavaScript syntax before saving
- [ ] Create ConditionalTrigger with user function
- [ ] Test custom trigger executes correctly

**Combined Trigger Support**:
- [ ] Support BOTH spatial AND flag/custom triggers
- [ ] Register both triggers with same eventId
- [ ] Test both conditions must be met (AND logic)

#### Integration Tests

**Test File**: `test/integration/events/flagTriggerExecution.integration.test.js`

- [ ] Spatial trigger fires when player enters zone
- [ ] Flag trigger fires when flag condition met
- [ ] Custom trigger fires when function returns true
- [ ] Combined trigger fires when both conditions met
- [ ] One-time trigger removes after firing
- [ ] Repeatable trigger fires multiple times

---

### Phase 7: Event Function Registry

**Goal**: Allow events to call registered game functions

#### Source Code Changes

**File to Create**: `Classes/managers/EventFunctionRegistry.js`

- [ ] Create `EventFunctionRegistry` singleton class
- [ ] Property: `this.functions = new Map()` - Map of functionId => function
- [ ] Method: `registerFunction(id, fn, metadata)` - Add function to registry
- [ ] Method: `unregisterFunction(id)` - Remove function
- [ ] Method: `getFunction(id)` - Retrieve function
- [ ] Method: `executeFunction(id, ...args)` - Call function with args
- [ ] Method: `getAllFunctions()` - Return all function metadata
- [ ] Method: `hasFunction(id)` - Check if function exists
- [ ] Global access: `window.eventFunctionRegistry`
- [ ] Add to `index.html`

**File to Create**: `Classes/events/registerEventFunctions.js`

Common Functions to Register:
- [ ] `spawn_enemies(count, type, faction)` - Spawn enemy ants
- [ ] `award_resources(type, amount)` - Add resources
- [ ] `show_dialogue(speaker, message)` - Display dialogue
- [ ] `unlock_feature(featureId)` - Enable game feature
- [ ] `start_tutorial(tutorialId)` - Begin tutorial sequence
- [ ] `set_day_time(hour)` - Change time of day
- [ ] `trigger_boss_fight(bossId)` - Start boss encounter

**Files to Modify**: 
- `Classes/managers/EventManager.js` - Execute registered functions in onTrigger
- `Classes/systems/ui/EventEditorPanel.js` - Function dropdown in event form

#### Code Quality
- [ ] Add JSDoc for all registry methods
- [ ] Document function metadata structure
- [ ] Add error handling for missing functions
- [ ] Validate function parameters

#### Unit Tests (Write FIRST)

**Test File**: `test/unit/managers/EventFunctionRegistry.test.js`

- [ ] Should register function with ID
- [ ] Should retrieve function by ID
- [ ] Should execute function with arguments
- [ ] Should handle missing function gracefully
- [ ] Should list all registered functions
- [ ] Should unregister function
- [ ] Should prevent duplicate IDs
- [ ] Should validate function is callable

#### Integration Tests

**Test File**: `test/integration/events/functionRegistry.integration.test.js`

- [ ] Event with function call executes function
- [ ] Function receives correct arguments
- [ ] Missing function logs warning but doesn't crash
- [ ] Function return value accessible (if needed)

---

### Phase 8: Export/Import Integration

**Goal**: Save/load event flags with terrain data

#### Source Code Changes

**Files to Modify**:
- `Classes/ui/TerrainExporter.js`
- `Classes/ui/TerrainImporter.js`

**Implementation Tasks (TerrainExporter.js)**:
- [ ] Add `eventFlags` property to exported JSON
- [ ] Call `eventFlagLayer.exportToJSON()` if layer exists
- [ ] Include flags array in terrain export

**Implementation Tasks (TerrainImporter.js)**:
- [ ] Check for `eventFlags` property in imported JSON
- [ ] Create EventFlagLayer if it doesn't exist
- [ ] Call `eventFlagLayer.importFromJSON(data.eventFlags)`
- [ ] Register SpatialTriggers for each imported flag

#### Code Quality
- [ ] Add comments for export/import process
- [ ] Handle missing eventFlags gracefully
- [ ] Validate JSON structure

#### Unit Tests (Write FIRST)

**Test File**: `test/unit/terrainUtils/eventFlagExportImport.test.js`

- [ ] Should export event flags to JSON
- [ ] Should include all flag properties (position, radius, eventId, etc.)
- [ ] Should import flags from JSON
- [ ] Should reconstruct EventFlag instances
- [ ] Should register SpatialTriggers on import
- [ ] Should handle empty flags array
- [ ] Should validate flag data structure

#### Integration Tests

**Test File**: `test/integration/levelEditor/eventFlagPersistence.integration.test.js`

- [ ] Export terrain with flags, verify flags in JSON
- [ ] Import terrain with flags, verify flags created
- [ ] Round-trip test: export → import → export, verify identical
- [ ] Flags re-register spatial triggers on import
- [ ] Flags visible in Level Editor after import

#### E2E Tests

**Test File**: `test/e2e/levelEditor/pw_event_flag_persistence.js`

- [ ] Place multiple flags
- [ ] Export terrain JSON
- [ ] Clear Level Editor
- [ ] Import terrain JSON
- [ ] Verify flags appear at correct positions
- [ ] Verify triggers fire correctly
- [ ] Capture screenshots for verification

---

### Phase 9: Runtime Integration (Game Mode)

**Goal**: Ensure flags work in PLAYING state (invisible but functional)

#### Source Code Changes

**Files to Modify**: 
- `Classes/events/EventFlag.js` - Render only in editor mode
- `Classes/managers/EventManager.js` - Spatial trigger evaluation
- Create `Classes/events/PlayerEntityTracker.js` (if needed)

**Implementation Tasks (EventFlag.js)**:
- [ ] In `render()`, check `editorMode` parameter
- [ ] If `editorMode === false`, skip rendering (return early)
- [ ] If `editorMode === true`, render flag icon and outline
- [ ] Ensure `containsPoint()` still works regardless of render state

**Implementation Tasks (EventManager.js)**:
- [ ] Get player entity position (may need PlayerManager)
- [ ] In `_evaluateTriggerByType()` case 'spatial', check player position
- [ ] Call `trigger.containsPoint(player.x, player.y)` or similar
- [ ] Fire event if player in zone

#### Code Quality
- [ ] Add comments for game mode behavior
- [ ] Handle missing player entity gracefully
- [ ] Use defensive programming

#### Unit Tests (Write FIRST)

**Test File**: `test/unit/events/flagGameModeRendering.test.js`

- [ ] Flags should not render in game mode (editorMode=false)
- [ ] Triggers should still evaluate in game mode
- [ ] Spatial triggers should fire when player enters zone
- [ ] Flag outlines should not be visible to player
- [ ] Flag selection should be disabled in game mode

#### Integration Tests

**Test File**: `test/integration/events/spatialTriggerGameMode.integration.test.js`

- [ ] Player walking over flag triggers event
- [ ] Event fires only once if oneTime=true
- [ ] Event fires multiple times if oneTime=false
- [ ] Flag not visible to player in game mode
- [ ] Multiple flags work independently

#### E2E Tests

**Test File**: `test/e2e/events/pw_spatial_trigger_game_mode.js`

- [ ] Place flag in Level Editor
- [ ] Switch to PLAYING state
- [ ] Move player entity over flag
- [ ] Verify event triggers
- [ ] Verify flag NOT visible
- [ ] Capture screenshots (flag invisible, event active)

---

## Verification Phase

### Run Test Suites
- [ ] Run unit tests: `npm run test:unit`
- [ ] Run integration tests: `npm run test:integration`
- [ ] Run BDD tests: `npm run test:bdd`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Run full test suite: `npm test`

### Verify Test Results
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] BDD tests passing (if applicable)
- [ ] E2E tests passing

### Manual Testing
- [ ] Test in actual browser (Chrome/Firefox/Safari)
- [ ] Verify Events panel toggles correctly
- [ ] Test drag-drop workflow
- [ ] Verify flag rendering (visible in editor, invisible in game)
- [ ] Test flag customization UI
- [ ] Test export/import workflow
- [ ] Test spatial triggers fire correctly
- [ ] Check browser console for errors
- [ ] Verify performance (no lag during drag or rendering)

---

## Bug Fixes

### Identify Issues
- [ ] Review test failure messages
- [ ] Check browser console errors
- [ ] Analyze stack traces
- [ ] Reproduce issues
- [ ] Document error patterns

### Fix Common Problems
- [ ] Missing null checks → Add defensive programming
- [ ] Undefined variables → Check initialization order
- [ ] Function not found → Verify imports and global scope
- [ ] Test pollution → Add cleanup in beforeEach/afterEach
- [ ] Timing issues → Add proper async/await or timeouts
- [ ] Mock missing → Add required mock objects
- [ ] Coordinate conversion errors → Verify camera transform order

---

## Documentation

### Code Documentation
- [ ] Add JSDoc comments to EventFlag class
- [ ] Add JSDoc comments to EventFlagLayer class
- [ ] Add JSDoc comments to FlagPropertiesPanel class
- [ ] Add JSDoc comments to EventFunctionRegistry class
- [ ] Document drag-drop lifecycle in LevelEditor
- [ ] Explain editorMode vs game mode rendering
- [ ] Add examples for registering event functions

### Feature Documentation
- [ ] Update `LEVEL_EDITOR_SETUP.md` with event flag system
- [ ] Create API reference for EventFlag class
- [ ] Create API reference for EventFlagLayer class
- [ ] Create API reference for EventFunctionRegistry class
- [ ] Document event flag workflow (create → place → configure → export)
- [ ] Add troubleshooting guide for common issues
- [ ] Document trigger types and conditions

### Update CHANGELOG
- [ ] Add EventFlag system to CHANGELOG (when complete)
- [ ] Document new Level Editor features
- [ ] List new classes and files
- [ ] Note breaking changes (if any)

---

## Pre-Commit Checklist

### Code Quality
- [ ] No console.log statements (or marked for removal)
- [ ] No commented-out code (unless with explanation)
- [ ] No TODO comments without ticket reference
- [ ] Proper error handling throughout
- [ ] No hard-coded values (use constants)
- [ ] Follow naming conventions (camelCase, g_ for globals)

### Testing
- [ ] All tests passing locally
- [ ] Test coverage meets minimum threshold
- [ ] No skipped tests without justification
- [ ] Test names are descriptive
- [ ] No flaky tests

### Version Control
- [ ] Meaningful commit messages
- [ ] Commits are atomic (one logical change each)
- [ ] No merge conflicts
- [ ] Branch up to date with main/develop
- [ ] No accidentally committed files (node_modules, etc.)

---

## Post-Implementation Review

### Code Review
- [ ] Self-review all changes
- [ ] Check for potential performance issues
- [ ] Verify security implications (user-input JavaScript code)
- [ ] Ensure accessibility standards
- [ ] Review error messages for clarity

### Testing Summary
- [ ] Document test pass rates
- [ ] List any known issues
- [ ] Explain any skipped tests
- [ ] Document test environment issues
- [ ] Create summary report

### Cleanup
- [ ] Remove debug code
- [ ] Clean up temporary files
- [ ] Archive old documentation
- [ ] Update dependency versions if needed
- [ ] Remove unused imports

---

## Estimated Effort

### Time Estimates (per phase)
- **Phase 1**: Tools Panel Integration - 2-3 hours
- **Phase 2**: EventFlag Class - 3-4 hours
- **Phase 3**: EventFlagLayer Class - 3-4 hours
- **Phase 4**: Drag-and-Drop System - 4-5 hours
- **Phase 5**: Flag Properties Panel - 5-6 hours
- **Phase 6**: Trigger Registration - 3-4 hours
- **Phase 7**: Event Function Registry - 4-5 hours
- **Phase 8**: Export/Import Integration - 2-3 hours
- **Phase 9**: Runtime Integration - 3-4 hours
- **Phase 10**: Documentation - 2-3 hours

**Total Estimated Effort**: 31-41 hours

---

## Resources

### Testing Commands
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:bdd
npm run test:e2e

# Run specific test file
npx mocha "test/unit/path/to/test.js" --reporter spec

# Run with debugging
npx mocha "test/unit/path/to/test.js" --inspect-brk
```

### Common Test Patterns
- **Unit**: Mock all dependencies, test in isolation
- **Integration**: Mock external systems only, test interactions
- **BDD**: Test user-facing behavior (if applicable)
- **E2E**: Full browser automation, test real workflows

### Key Documentation
- `docs/api/EventManager_API_Reference.md`
- `docs/guides/Event_Types_Guide.md`
- `docs/guides/Trigger_Types_Guide.md`
- `docs/guides/EventManager_Integration_Guide.md`
- `docs/LEVEL_EDITOR_SETUP.md`

**Current State**:
- EventEditorPanel has drag state (`isDragging`, `eventId`, `cursorX`, `cursorY`)
- Methods exist: `startDragPlacement()`, `updateDragPosition()`, `completeDrag()`
- No visual feedback during drag
- No placement on canvas

**Requirements**:
1. **Start Drag** - Clicking 🚩 button on event list item calls `startDragPlacement(eventId)`
2. **Visual Feedback** - While dragging, render semi-transparent flag icon following cursor
3. **Cursor Update** - `updateDragPosition(mouseX, mouseY)` called during mouseDrag
4. **World Coordinate Conversion** - Convert screen coords to world coords for placement
5. **Complete Drag** - On mouseReleased, call `completeDrag(worldX, worldY)`
6. **Create EventFlag** - EventFlag instance created at drop location
7. **Register Spatial Trigger** - SpatialTrigger registered with EventManager
8. **Visual Confirmation** - Placed flag appears on canvas with trigger zone outline

**Files to Create**:
- `Classes/events/EventFlag.js` - Visual flag entity
- `Classes/systems/ui/EventFlagLayer.js` - Flag collection manager

**Files to Modify**:
- `Classes/systems/ui/LevelEditor.js` - Handle drag lifecycle, coordinate conversion
- `Classes/systems/ui/EventEditorPanel.js` - Already has drag methods (may need tweaks)

---

### C. EventFlag Visual Customization

**User Requirements** (from prompt):
- Bounding box customization (color, size, shape)
- Trigger zone visible in editor, invisible in game
- Support for both spatial triggers AND custom conditions

**Requirements**:
1. **Bounding Box Shapes**: Circle (radius), Rectangle (width × height)
2. **Colors**: User-selectable outline color for visual distinction
3. **Trigger Conditions**:
   - **Spatial**: Player walks over flag (enters radius/rect)
   - **Flag-based**: Event fires when game flag condition met
   - **Custom**: User-defined condition function
   - **Combined**: Both spatial AND flag/custom (AND logic)
4. **Properties Panel**: Edit flag properties after placement
   - Flag ID (auto-generated, editable)
   - Linked Event ID (dropdown of registered events)
   - Trigger Type (spatial, flag, custom, combined)
   - Radius/Width/Height (numeric inputs with sliders)
   - Color picker for outline
   - One-time vs repeatable toggle
5. **Visual Rendering**:
   - Editor mode: Render flag icon (🚩) + colored bounding box outline
   - Game mode: No rendering (purely functional triggers)

**Files to Create**:
- `Classes/ui/FlagPropertiesPanel.js` - Draggable panel for editing selected flag

---

### D. Registering Events with Callable Functions

**User Requirement** (from prompt):
> "the user should be able to pull from a list of applicable calls from other functions that can be registered with the eventSystem"

**Interpretation**:
User wants a **Function Registry** so events can trigger game systems (spawn enemies, modify resources, unlock features, etc.)

**Requirements**:
1. **Function Registry** - Global registry of callable functions
   ```javascript
   window.eventFunctionRegistry = {
     'spawn_enemies': (count, type) => { /* spawn logic */ },
     'award_resources': (type, amount) => { /* resource logic */ },
     'unlock_feature': (featureId) => { /* unlock logic */ },
     'show_tutorial': (tutorialId) => { /* tutorial logic */ }
   };
   ```
2. **Event Content Schema** - Events can reference registered functions
   ```json
   {
     "id": "wave_1",
     "type": "spawn",
     "content": {
       "function": "spawn_enemies",
       "args": [10, "Warrior"]
     }
   }
   ```
3. **UI Integration** - EventEditorPanel shows dropdown of available functions
4. **Execution** - EventManager calls registered function when event triggers

**Files to Create**:
- `Classes/managers/EventFunctionRegistry.js` - Singleton function registry

**Files to Modify**:
- `Classes/managers/EventManager.js` - Execute registered functions in onTrigger
- `Classes/systems/ui/EventEditorPanel.js` - Function dropdown in event form

---

### E. Variable/Event Watching for Conditions

**User Requirement** (from prompt):
> "look for a variable/event for the eventManager to watch, and then the event should fire when the conditions are met"

**Interpretation**:
Support **ConditionalTrigger** with custom logic (already implemented in EventManager)

**Requirements**:
1. **Existing Support** - ConditionalTrigger already exists in `EventTrigger.js`
2. **UI for Conditions** - Allow user to specify condition logic
   - **Simple Conditions**: Dropdown + value input (e.g., "day >= 5")
   - **Advanced Conditions**: JavaScript code editor for complex logic
3. **Common Patterns**:
   - Day/night progression: `() => window.dayCount >= 5`
   - Resource thresholds: `() => window.resourceManager.getFood() < 10`
   - Enemy count: `() => window.enemyCount >= 20`
   - Combat waves: `() => window.waveNumber > 0 && window.enemiesAlive === 0`

**Files to Modify**:
- `Classes/systems/ui/EventEditorPanel.js` - Add condition editor to trigger form

---

## TDD Implementation Phases

### Phase 1: Tools Panel Integration (Wire-Up)

**Goal**: Add Events button to Tools panel that toggles EventEditorPanel

#### Source Code Changes
**Test File**: `test/unit/levelEditor/eventsToolsPanelIntegration.test.js`

**Tests to Write**:
- [ ] Tools panel should have "Events" button
- [ ] Clicking Events button should toggle EventEditorPanel visibility
- [ ] Events button should highlight when panel visible
- [ ] Panel should be hidden by default
- [ ] Panel should persist visibility state in draggablePanelManager
- [ ] Multiple clicks should toggle on/off correctly

**Status**: NOT STARTED

#### Phase 1B: Implementation
**Files to Modify**: `Classes/systems/ui/LevelEditorPanels.js`

**Implementation Tasks**:
- [ ] Add "Events" button to Tools panel config
  ```javascript
  // In createToolsPanel()
  {
    id: 'events-toggle',
    label: 'Events',
    icon: '🎬', // or '📋' or '⚡'
    onClick: () => this.toggleEventsPanel()
  }
  ```
- [ ] Implement `toggleEventsPanel()` method
- [ ] Connect to `draggablePanelManager.togglePanel('level-editor-events')`
- [ ] Set default visibility: hidden
- [ ] Update button highlight based on visibility state
- [ ] Run unit tests - verify they pass

**Status**: NOT STARTED

#### Phase 1C: Integration Tests
**Test File**: `test/integration/levelEditor/eventsPanel.integration.test.js`

**Tests to Write**:
- [ ] Events panel toggles correctly in full Level Editor
- [ ] Panel state persists across Level Editor deactivate/activate
- [ ] Panel integrates with other Level Editor panels (no conflicts)
- [ ] Panel closes when switching to PLAYING state

**Status**: NOT STARTED

#### Phase 1D: E2E Tests with Screenshots
**Test File**: `test/e2e/levelEditor/pw_events_panel_toggle.js`

**E2E Tests**:
- [ ] Test 1: Events button visible in Tools panel
- [ ] Test 2: Clicking Events button shows EventEditorPanel
- [ ] Test 3: Panel contains event list and add button
- [ ] Test 4: Clicking again hides panel
- [ ] Screenshot verification for each state

**Status**: NOT STARTED

---

### Phase 2: EventFlag Class (Visual Flag Entity)

**Goal**: Create EventFlag class for visual representation in Level Editor

#### Phase 2A: Unit Tests (Write FIRST)
**Test File**: `test/unit/events/EventFlag.test.js`

**Tests to Write**:
- [ ] Should initialize with position and radius
- [ ] Should support circle and rectangle shapes
- [ ] Should store linked event ID
- [ ] Should have customizable color
- [ ] Should have one-time vs repeatable flag
- [ ] Should export to JSON
- [ ] Should import from JSON
- [ ] Should check if point is within trigger zone (circle)
- [ ] Should check if point is within trigger zone (rectangle)
- [ ] Should have unique ID generation
- [ ] Should validate required fields (x, y, eventId)

**Status**: NOT STARTED

#### Phase 2B: Implementation
**File to Create**: `Classes/events/EventFlag.js`

**Implementation Tasks**:
- [ ] Create `EventFlag` class
- [ ] Constructor: Accept config `{id, x, y, radius, width, height, shape, eventId, color, oneTime, triggerType, condition}`
- [ ] Property: `this.id` - Unique flag ID (auto-generate if not provided)
- [ ] Property: `this.x, this.y` - World coordinates
- [ ] Property: `this.shape` - 'circle' or 'rectangle'
- [ ] Property: `this.radius` - Circle radius (default: 64)
- [ ] Property: `this.width, this.height` - Rectangle dimensions
- [ ] Property: `this.eventId` - Linked event ID
- [ ] Property: `this.color` - Outline color (default: yellow)
- [ ] Property: `this.oneTime` - Trigger once (default: true)
- [ ] Property: `this.triggerType` - 'spatial', 'flag', 'custom', 'combined'
- [ ] Property: `this.condition` - Condition data for flag/custom triggers
- [ ] Method: `containsPoint(x, y)` - Check if point in zone
- [ ] Method: `render(editorMode)` - Render flag (visible only if editorMode true)
- [ ] Method: `exportToJSON()` - Serialize
- [ ] Method: `importFromJSON(data)` - Deserialize
- [ ] Add to `index.html`
- [ ] Run unit tests - verify they pass

**Status**: NOT STARTED

---

### Phase 3: EventFlagLayer Class (Flag Collection Manager)

**Goal**: Manage collection of EventFlags in Level Editor

#### Phase 3A: Unit Tests (Write FIRST)
**Test File**: `test/unit/systems/EventFlagLayer.test.js`

**Tests to Write**:
- [ ] Should initialize with empty flag array
- [ ] Should add flag to collection
- [ ] Should remove flag by ID
- [ ] Should get flag by ID
- [ ] Should get all flags
- [ ] Should check if flag exists
- [ ] Should find flags at position (spatial query)
- [ ] Should export all flags to JSON
- [ ] Should import flags from JSON
- [ ] Should clear all flags
- [ ] Should handle duplicate IDs (reject or overwrite)
- [ ] Should render all flags in editor mode
- [ ] Should not render flags in game mode

**Status**: NOT STARTED

#### Phase 3B: Implementation
**File to Create**: `Classes/systems/ui/EventFlagLayer.js`

**Implementation Tasks**:
- [ ] Create `EventFlagLayer` class
- [ ] Constructor: Accept optional terrain reference
- [ ] Property: `this.flags = new Map()` - Map of flagId => EventFlag
- [ ] Property: `this.selectedFlagId = null` - Currently selected flag
- [ ] Method: `addFlag(eventFlag)` - Add flag to collection
- [ ] Method: `removeFlag(flagId)` - Remove flag
- [ ] Method: `getFlag(flagId)` - Retrieve flag
- [ ] Method: `getAllFlags()` - Return all flags as array
- [ ] Method: `findFlagsAtPosition(x, y)` - Spatial query
- [ ] Method: `selectFlag(flagId)` - Set selected flag
- [ ] Method: `getSelectedFlag()` - Get selected flag instance
- [ ] Method: `render(editorMode)` - Render all flags
- [ ] Method: `exportToJSON()` - Serialize all flags
- [ ] Method: `importFromJSON(data)` - Deserialize flags
- [ ] Method: `clear()` - Remove all flags
- [ ] Add to `index.html`
- [ ] Run unit tests - verify they pass

**Status**: NOT STARTED

---

### Phase 4: Drag-and-Drop System

**Goal**: Enable dragging events from EventEditorPanel to Level Editor canvas

#### Phase 4A: Unit Tests (Write FIRST)
**Test File**: `test/unit/levelEditor/eventFlagDragDrop.test.js`

**Tests to Write**:
- [ ] Should start drag when clicking 🚩 button on event
- [ ] Should track cursor position during drag
- [ ] Should convert screen coords to world coords
- [ ] Should create EventFlag at drop location
- [ ] Should register SpatialTrigger with EventManager
- [ ] Should cancel drag on Escape key
- [ ] Should prevent multiple simultaneous drags
- [ ] Should handle drag outside Level Editor bounds (cancel)
- [ ] Should update drag cursor position on mouseDrag
- [ ] Should complete drag on mouseReleased

**Status**: NOT STARTED

#### Phase 4B: Implementation
**Files to Modify**: 
- `Classes/systems/ui/LevelEditor.js`
- `Classes/systems/ui/EventEditorPanel.js`

**Implementation Tasks (LevelEditor.js)**:
- [ ] Add property: `this.eventFlagLayer = null`
- [ ] Initialize EventFlagLayer in `initialize()`
- [ ] Integrate drag lifecycle:
  - [ ] Check `eventEditor.isDragging()` in `update()`
  - [ ] Call `eventEditor.updateDragPosition(mouseX, mouseY)`
  - [ ] Render drag preview (flag icon at cursor)
- [ ] Handle mouseReleased:
  - [ ] Check if `eventEditor.isDragging()`
  - [ ] Convert screen to world coords: `screenToWorld(mouseX, mouseY)`
  - [ ] Call `eventEditor.completeDrag(worldX, worldY)`
  - [ ] Create EventFlag from result
  - [ ] Add flag to EventFlagLayer
- [ ] Handle Escape key: Call `eventEditor.cancelDrag()`
- [ ] Render EventFlagLayer in `render()`

**Implementation Tasks (EventEditorPanel.js)**:
- [ ] Verify `startDragPlacement(eventId)` is called on 🚩 button click
- [ ] Verify `updateDragPosition(mouseX, mouseY)` updates cursor state
- [ ] Verify `completeDrag(worldX, worldY)` creates trigger config
- [ ] Return EventFlag config from `completeDrag()` for Level Editor to use

**Status**: NOT STARTED

#### Phase 4C: Integration Tests
**Test File**: `test/integration/levelEditor/eventFlagDragDrop.integration.test.js`

**Tests to Write**:
- [ ] Full drag-drop workflow from EventEditorPanel to Level Editor
- [ ] EventFlag created at correct world coordinates
- [ ] SpatialTrigger registered with EventManager
- [ ] Flag appears in EventFlagLayer
- [ ] Flag visible in editor, invisible in game mode
- [ ] Multiple flags can be placed

**Status**: NOT STARTED

#### Phase 4D: E2E Tests with Screenshots
**Test File**: `test/e2e/levelEditor/pw_event_flag_drag_drop.js`

**E2E Tests**:
- [ ] Test 1: Open EventEditorPanel, create test event
- [ ] Test 2: Click 🚩 button, verify drag starts
- [ ] Test 3: Move cursor over canvas, verify preview renders
- [ ] Test 4: Drop flag, verify placement
- [ ] Test 5: Verify flag renders with outline
- [ ] Test 6: Export terrain JSON, verify flag included
- [ ] Screenshot verification for each state

**Status**: NOT STARTED

---

### Phase 5: Flag Properties Panel (Customization UI)

**Goal**: Allow editing of placed flags (radius, color, shape, event, conditions)

#### Phase 5A: Unit Tests (Write FIRST)
**Test File**: `test/unit/ui/FlagPropertiesPanel.test.js`

**Tests to Write**:
- [ ] Should show properties of selected flag
- [ ] Should update flag ID on text input change
- [ ] Should update linked event ID from dropdown
- [ ] Should update trigger radius with slider
- [ ] Should update trigger shape (circle/rectangle)
- [ ] Should update color with color picker
- [ ] Should toggle one-time vs repeatable
- [ ] Should update trigger type (spatial/flag/custom/combined)
- [ ] Should show condition editor for flag/custom triggers
- [ ] Should save changes to flag
- [ ] Should cancel edits without saving
- [ ] Should handle no flag selected (show placeholder)

**Status**: NOT STARTED

#### Phase 5B: Implementation
**File to Create**: `Classes/ui/FlagPropertiesPanel.js`

**Implementation Tasks**:
- [ ] Create `FlagPropertiesPanel` class
- [ ] Constructor: Accept eventFlagLayer and eventManager references
- [ ] Property: `this.selectedFlag = null`
- [ ] Method: `setSelectedFlag(flagId)` - Load flag for editing
- [ ] Method: `render(x, y, width, height)` - Render UI
- [ ] UI Elements:
  - [ ] Flag ID text input
  - [ ] Event ID dropdown (populated from eventManager.getAllEvents())
  - [ ] Trigger Type radio buttons (spatial, flag, custom, combined)
  - [ ] Shape selector (circle, rectangle)
  - [ ] Radius slider (for circle)
  - [ ] Width/Height inputs (for rectangle)
  - [ ] Color picker (for outline)
  - [ ] One-time checkbox
  - [ ] Condition editor (for flag/custom triggers)
  - [ ] Save button
  - [ ] Cancel button
- [ ] Method: `handleClick(mouseX, mouseY, contentX, contentY)` - Handle UI interactions
- [ ] Method: `saveChanges()` - Apply changes to flag
- [ ] Method: `cancelEdits()` - Discard changes
- [ ] Add to `index.html`
- [ ] Run unit tests - verify they pass

**Status**: NOT STARTED

#### Phase 5C: Integration with LevelEditorPanels
**Files to Modify**: `Classes/systems/ui/LevelEditorPanels.js`

**Implementation Tasks**:
- [ ] Create FlagPropertiesPanel draggable panel
- [ ] Position: `{ x: 270, y: 470 }`
- [ ] Size: Auto-size based on content
- [ ] Register in LEVEL_EDITOR state
- [ ] Hide by default, show when flag selected
- [ ] Update panel when different flag selected
- [ ] Close panel when flag deselected

**Status**: NOT STARTED

#### Phase 5D: Integration Tests
**Test File**: `test/integration/levelEditor/flagPropertiesPanel.integration.test.js`

**Tests to Write**:
- [ ] Selecting flag shows FlagPropertiesPanel
- [ ] Editing radius updates flag and re-renders
- [ ] Changing event ID updates linked event
- [ ] Saving changes persists to flag
- [ ] Canceling edits reverts changes
- [ ] Deselecting flag hides panel

**Status**: NOT STARTED

#### Phase 5E: E2E Tests with Screenshots
**Test File**: `test/e2e/levelEditor/pw_flag_properties_panel.js`

**E2E Tests**:
- [ ] Test 1: Place flag, click to select
- [ ] Test 2: Properties panel appears
- [ ] Test 3: Edit radius, verify visual update
- [ ] Test 4: Change color, verify outline color changes
- [ ] Test 5: Save changes, verify persistence
- [ ] Screenshot verification for each state

**Status**: NOT STARTED

---

### Phase 6: Trigger Registration & Execution

**Goal**: Connect placed flags to EventManager trigger system

#### Phase 6A: Spatial Trigger Registration
**Implementation Tasks** (Already in EventEditorPanel.completeDrag):
- [ ] Verify `completeDrag()` registers SpatialTrigger with EventManager
- [ ] Verify trigger includes flag position, radius, eventId
- [ ] Verify oneTime property passed to trigger
- [ ] Test trigger fires when player enters zone

**Status**: PARTIALLY COMPLETE (needs testing)

#### Phase 6B: Flag-Based Trigger Support
**Implementation Tasks**:
- [ ] Add flag condition editor to FlagPropertiesPanel
- [ ] Support flag name, operator, value in UI
- [ ] Create FlagTrigger when flag has flag-based condition
- [ ] Test flag trigger fires when condition met

**Status**: NOT STARTED

#### Phase 6C: Custom Trigger Support
**Implementation Tasks**:
- [ ] Add JavaScript code editor to FlagPropertiesPanel
- [ ] Validate JavaScript syntax before saving
- [ ] Create ConditionalTrigger with user function
- [ ] Test custom trigger executes correctly

**Status**: NOT STARTED

#### Phase 6D: Combined Trigger Support
**Implementation Tasks**:
- [ ] Support BOTH spatial AND flag/custom triggers
- [ ] Register both triggers with same eventId
- [ ] Test both conditions must be met (AND logic)

**Status**: NOT STARTED

#### Phase 6E: Integration Tests
**Test File**: `test/integration/events/flagTriggerExecution.integration.test.js`

**Tests to Write**:
- [ ] Spatial trigger fires when player enters zone
- [ ] Flag trigger fires when flag condition met
- [ ] Custom trigger fires when function returns true
- [ ] Combined trigger fires when both conditions met
- [ ] One-time trigger removes after firing
- [ ] Repeatable trigger fires multiple times

**Status**: NOT STARTED

---

### Phase 7: Event Function Registry

**Goal**: Allow events to call registered game functions

#### Phase 7A: Unit Tests (Write FIRST)
**Test File**: `test/unit/managers/EventFunctionRegistry.test.js`

**Tests to Write**:
- [ ] Should register function with ID
- [ ] Should retrieve function by ID
- [ ] Should execute function with arguments
- [ ] Should handle missing function gracefully
- [ ] Should list all registered functions
- [ ] Should unregister function
- [ ] Should prevent duplicate IDs
- [ ] Should validate function is callable

**Status**: NOT STARTED

#### Phase 7B: Implementation
**File to Create**: `Classes/managers/EventFunctionRegistry.js`

**Implementation Tasks**:
- [ ] Create `EventFunctionRegistry` singleton class
- [ ] Property: `this.functions = new Map()` - Map of functionId => function
- [ ] Method: `registerFunction(id, fn, metadata)` - Add function to registry
- [ ] Method: `unregisterFunction(id)` - Remove function
- [ ] Method: `getFunction(id)` - Retrieve function
- [ ] Method: `executeFunction(id, ...args)` - Call function with args
- [ ] Method: `getAllFunctions()` - Return all function metadata
- [ ] Method: `hasFunction(id)` - Check if function exists
- [ ] Global access: `window.eventFunctionRegistry`
- [ ] Add to `index.html`
- [ ] Run unit tests - verify they pass

**Status**: NOT STARTED

#### Phase 7C: Register Common Functions
**File to Create**: `Classes/events/registerEventFunctions.js`

**Common Functions to Register**:
- [ ] `spawn_enemies(count, type, faction)` - Spawn enemy ants
- [ ] `award_resources(type, amount)` - Add resources
- [ ] `show_dialogue(speaker, message)` - Display dialogue
- [ ] `unlock_feature(featureId)` - Enable game feature
- [ ] `start_tutorial(tutorialId)` - Begin tutorial sequence
- [ ] `set_day_time(hour)` - Change time of day
- [ ] `trigger_boss_fight(bossId)` - Start boss encounter

**Status**: NOT STARTED

#### Phase 7D: EventManager Integration
**Files to Modify**: `Classes/managers/EventManager.js`

**Implementation Tasks**:
- [ ] In `triggerEvent()`, check if `event.content.function` exists
- [ ] If yes, call `eventFunctionRegistry.executeFunction(event.content.function, ...event.content.args)`
- [ ] Handle errors gracefully (log warning, don't crash)
- [ ] Support both function calls AND callbacks (not mutually exclusive)

**Status**: NOT STARTED

#### Phase 7E: UI Integration
**Files to Modify**: `Classes/systems/ui/EventEditorPanel.js`

**Implementation Tasks**:
- [ ] Add "Function" dropdown to event form
- [ ] Populate dropdown from `eventFunctionRegistry.getAllFunctions()`
- [ ] Add argument inputs based on function metadata
- [ ] Save function and args to `event.content`

**Status**: NOT STARTED

#### Phase 7F: Integration Tests
**Test File**: `test/integration/events/functionRegistry.integration.test.js`

**Tests to Write**:
- [ ] Event with function call executes function
- [ ] Function receives correct arguments
- [ ] Missing function logs warning but doesn't crash
- [ ] Function return value accessible (if needed)

**Status**: NOT STARTED

---

### Phase 8: Export/Import Integration

**Goal**: Save/load event flags with terrain data

#### Phase 8A: Unit Tests (Write FIRST)
**Test File**: `test/unit/terrainUtils/eventFlagExportImport.test.js`

**Tests to Write**:
- [ ] Should export event flags to JSON
- [ ] Should include all flag properties (position, radius, eventId, etc.)
- [ ] Should import flags from JSON
- [ ] Should reconstruct EventFlag instances
- [ ] Should register SpatialTriggers on import
- [ ] Should handle empty flags array
- [ ] Should validate flag data structure

**Status**: NOT STARTED

#### Phase 8B: Implementation
**Files to Modify**:
- `Classes/ui/TerrainExporter.js`
- `Classes/ui/TerrainImporter.js`

**Implementation Tasks (TerrainExporter.js)**:
- [ ] Add `eventFlags` property to exported JSON
- [ ] Call `eventFlagLayer.exportToJSON()` if layer exists
- [ ] Include flags array in terrain export

**Implementation Tasks (TerrainImporter.js)**:
- [ ] Check for `eventFlags` property in imported JSON
- [ ] Create EventFlagLayer if it doesn't exist
- [ ] Call `eventFlagLayer.importFromJSON(data.eventFlags)`
- [ ] Register SpatialTriggers for each imported flag

**Status**: NOT STARTED

#### Phase 8C: Integration Tests
**Test File**: `test/integration/levelEditor/eventFlagPersistence.integration.test.js`

**Tests to Write**:
- [ ] Export terrain with flags, verify flags in JSON
- [ ] Import terrain with flags, verify flags created
- [ ] Round-trip test: export → import → export, verify identical
- [ ] Flags re-register spatial triggers on import
- [ ] Flags visible in Level Editor after import

**Status**: NOT STARTED

#### Phase 8D: E2E Tests with Screenshots
**Test File**: `test/e2e/levelEditor/pw_event_flag_persistence.js`

**E2E Tests**:
- [ ] Test 1: Place multiple flags
- [ ] Test 2: Export terrain JSON
- [ ] Test 3: Clear Level Editor
- [ ] Test 4: Import terrain JSON
- [ ] Test 5: Verify flags appear at correct positions
- [ ] Test 6: Verify triggers fire correctly
- [ ] Screenshot verification for each state

**Status**: NOT STARTED

---

### Phase 9: Runtime Integration (Game Mode)

**Goal**: Ensure flags work in PLAYING state (invisible but functional)

#### Phase 9A: Unit Tests (Write FIRST)
**Test File**: `test/unit/events/flagGameModeRendering.test.js`

**Tests to Write**:
- [ ] Flags should not render in game mode (editorMode=false)
- [ ] Triggers should still evaluate in game mode
- [ ] Spatial triggers should fire when player enters zone
- [ ] Flag outlines should not be visible to player
- [ ] Flag selection should be disabled in game mode

**Status**: NOT STARTED

#### Phase 9B: Implementation
**Files to Modify**: `Classes/events/EventFlag.js`

**Implementation Tasks**:
- [ ] In `render()`, check `editorMode` parameter
- [ ] If `editorMode === false`, skip rendering (return early)
- [ ] If `editorMode === true`, render flag icon and outline
- [ ] Ensure `containsPoint()` still works regardless of render state

**Status**: NOT STARTED

#### Phase 9C: Player Collision Detection
**Files to Modify**: 
- `Classes/managers/EventManager.js` (spatial trigger evaluation)
- Create `Classes/events/PlayerEntityTracker.js` (if needed)

**Implementation Tasks**:
- [ ] Get player entity position (may need PlayerManager or similar)
- [ ] In `_evaluateTriggerByType()` case 'spatial', check player position
- [ ] Call `trigger.containsPoint(player.x, player.y)` or similar
- [ ] Fire event if player in zone

**Status**: NOT STARTED

#### Phase 9D: Integration Tests
**Test File**: `test/integration/events/spatialTriggerGameMode.integration.test.js`

**Tests to Write**:
- [ ] Player walking over flag triggers event
- [ ] Event fires only once if oneTime=true
- [ ] Event fires multiple times if oneTime=false
- [ ] Flag not visible to player in game mode
- [ ] Multiple flags work independently

**Status**: NOT STARTED

#### Phase 9E: E2E Tests with Screenshots
**Test File**: `test/e2e/events/pw_spatial_trigger_game_mode.js`

**E2E Tests**:
- [ ] Test 1: Place flag in Level Editor
- [ ] Test 2: Switch to PLAYING state
- [ ] Test 3: Move player entity over flag
- [ ] Test 4: Verify event triggers
- [ ] Test 5: Verify flag NOT visible
- [ ] Screenshot verification (flag invisible, event active)

**Status**: NOT STARTED

---

## Phase 10: Polish & Documentation

### Tasks
- [ ] Update `LEVEL_EDITOR_SETUP.md` with event flag system
- [ ] Create API reference for EventFlag class
- [ ] Create API reference for EventFlagLayer class
- [ ] Create API reference for EventFunctionRegistry class
- [ ] Add usage examples to Event Types Guide
- [ ] Update CHANGELOG.md with features
- [ ] Mark roadmap phases complete
- [ ] Create designer guide: "How to Create Events with Flags"
- [ ] Example event library (JSON files with common patterns)

**Status**: NOT STARTED

---

## Files Summary

### Files to Create (17 new files)

**Core Classes** (7):
1. `Classes/events/EventFlag.js` - Visual flag entity
2. `Classes/systems/ui/EventFlagLayer.js` - Flag collection manager
3. `Classes/ui/FlagPropertiesPanel.js` - Flag editing UI
4. `Classes/managers/EventFunctionRegistry.js` - Callable function registry
5. `Classes/events/registerEventFunctions.js` - Pre-registered functions
6. `Classes/events/PlayerEntityTracker.js` - Player position tracking (if needed)
7. `docs/api/EventFlag_API_Reference.md` - API documentation

**Unit Tests** (8):
8. `test/unit/levelEditor/eventsToolsPanelIntegration.test.js`
9. `test/unit/events/EventFlag.test.js`
10. `test/unit/systems/EventFlagLayer.test.js`
11. `test/unit/levelEditor/eventFlagDragDrop.test.js`
12. `test/unit/ui/FlagPropertiesPanel.test.js`
13. `test/unit/managers/EventFunctionRegistry.test.js`
14. `test/unit/terrainUtils/eventFlagExportImport.test.js`
15. `test/unit/events/flagGameModeRendering.test.js`

**Integration Tests** (5):
16. `test/integration/levelEditor/eventsPanel.integration.test.js`
17. `test/integration/levelEditor/eventFlagDragDrop.integration.test.js`
18. `test/integration/levelEditor/flagPropertiesPanel.integration.test.js`
19. `test/integration/events/flagTriggerExecution.integration.test.js`
20. `test/integration/events/functionRegistry.integration.test.js`
21. `test/integration/levelEditor/eventFlagPersistence.integration.test.js`
22. `test/integration/events/spatialTriggerGameMode.integration.test.js`

**E2E Tests** (5):
23. `test/e2e/levelEditor/pw_events_panel_toggle.js`
24. `test/e2e/levelEditor/pw_event_flag_drag_drop.js`
25. `test/e2e/levelEditor/pw_flag_properties_panel.js`
26. `test/e2e/levelEditor/pw_event_flag_persistence.js`
27. `test/e2e/events/pw_spatial_trigger_game_mode.js`

### Files to Modify (8)
1. `Classes/systems/ui/LevelEditorPanels.js` - Add Events button, FlagPropertiesPanel
2. `Classes/systems/ui/LevelEditor.js` - EventFlagLayer integration, drag-drop
3. `Classes/systems/ui/EventEditorPanel.js` - Function dropdown, condition editor
4. `Classes/managers/EventManager.js` - Function execution, spatial trigger evaluation
5. `Classes/ui/TerrainExporter.js` - Export flags
6. `Classes/ui/TerrainImporter.js` - Import flags, register triggers
7. `index.html` - Add new script tags
8. `docs/LEVEL_EDITOR_SETUP.md` - Document event flags

---

## Success Criteria

- [ ] EventEditorPanel toggles via Tools panel button
- [ ] Events draggable from EventEditorPanel to Level Editor canvas
- [ ] Visual flag icon (🚩) and bounding box render in Level Editor
- [ ] Flags customizable (radius, color, shape, event, conditions)
- [ ] Flags export/import with terrain JSON
- [ ] Spatial triggers fire when player enters zone
- [ ] Flag/custom triggers fire when conditions met
- [ ] Function registry allows events to call game functions
- [ ] Flags invisible in game mode, visible in editor
- [ ] All unit tests pass (100% coverage target)
- [ ] All integration tests pass
- [ ] All E2E tests pass with visual screenshots
- [ ] Designer can create event-driven level in <10 minutes

---

## Estimated Effort

- **Phase 1 (Tools Panel)**: 2-3 hours
- **Phase 2 (EventFlag)**: 3-4 hours
- **Phase 3 (EventFlagLayer)**: 3-4 hours
- **Phase 4 (Drag-Drop)**: 4-5 hours
- **Phase 5 (Properties Panel)**: 5-6 hours
- **Phase 6 (Trigger Registration)**: 3-4 hours
- **Phase 7 (Function Registry)**: 4-5 hours
- **Phase 8 (Export/Import)**: 2-3 hours
- **Phase 9 (Runtime)**: 3-4 hours
- **Phase 10 (Polish)**: 2-3 hours

**Total**: 31-41 hours of development

---

## Current Status

**Phase**: Planning Complete ✅  
**Next Action**: Begin Phase 1A - Write Tools Panel Integration unit tests (TDD)

---

## Dependencies

### Required (Already Exist) ✅
- EventManager - Event/trigger management
- EventEditorPanel - Event creation UI (has drag state)
- DraggablePanelManager - UI system
- LevelEditor - Canvas, camera, coordinate conversion
- TerrainExporter/Importer - JSON persistence
- RenderLayerManager - Rendering layers

### To Be Created (This Checklist)
- EventFlag - Visual flag entity
- EventFlagLayer - Flag collection manager
- FlagPropertiesPanel - Customization UI
- EventFunctionRegistry - Callable functions
- PlayerEntityTracker - Player position (for spatial triggers)

---

## Notes

- Event flags are **visual triggers** for Level Editor, invisible in game
- Support both **spatial AND condition-based** triggers on same flag
- Function registry allows **modular event behaviors** without hardcoding
- Export/import ensures **designer workflow persistence**
- TDD ensures **quality and prevents regressions**

---

## Related Documentation

- `docs/roadmaps/RANDOM_EVENTS_ROADMAP.md` - Overall event system roadmap
- `docs/api/EventManager_API_Reference.md` - EventManager API
- `docs/guides/Event_Types_Guide.md` - Event type schemas
- `docs/guides/Trigger_Types_Guide.md` - Trigger type schemas
- `docs/architecture/LEVEL_EDITOR_EVENT_INTEGRATION.md` - Integration design
- `test/KNOWN_ISSUES.md` - Bug tracking
