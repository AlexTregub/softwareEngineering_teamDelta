# E2E Test Catalog - Complete Helper Functions Reference

**Purpose**: Comprehensive catalog of ALL reusable E2E test functions for Level Editor, Game, and UI testing. **ALWAYS check this catalog before creating new tests** - reuse existing tests when possible.

**Location**: `test/e2e/levelEditor/userFlowHelpers.js`

**Last Updated**: November 1, 2025

---

## 🎯 Core Principles

1. **Real User Flows Only**: All tests simulate ACTUAL user interactions (mouse clicks, toolbar selections, etc.)
2. **System APIs**: Use `handleClick()`, `selectTool()`, etc. - NOT direct property manipulation
3. **Verify Level Data**: Check `_entitySpawnData` (actual level JSON), not just visual state
4. **Reuse First**: Use helper functions from `userFlowHelpers.js` before writing new code
5. **Gherkin-Style Supported**: Use `given/when/then` for behavior-driven testing

---

## 🎭 Gherkin-Style Testing (NEW!)

The helper module now supports **Gherkin-like syntax** for readable, behavior-driven tests:

### Traditional Approach:
```javascript
const helpers = require('./levelEditor/userFlowHelpers');

await helpers.startLevelEditor(page);
await helpers.selectTool(page, 'paint');
await helpers.selectMaterial(page, 'moss');
await helpers.paintTile(page, 100, 100);
const result = await helpers.verifyTerrainMaterial(page, 100, 100, 'moss');
```

### Gherkin-Style Approach (Same Functions, More Readable):
```javascript
const { given, when, and, then } = require('./levelEditor/userFlowHelpers');

await given.levelEditorIsOpen(page);
await when.userSelectsTool(page, 'paint');
await and.userSelectsMaterial(page, 'moss');
await and.userPaintsAtPosition(page, 100, 100);
await then.materialShouldBe(page, 100, 100, 'moss');
```

**Benefits**:
- ✅ More readable test code (reads like English)
- ✅ Clear test structure (given/when/then pattern)
- ✅ Same underlying functions (no duplication)
- ✅ Easy to understand test intent
- ✅ Consistent with BDD methodology
- ✅ Works seamlessly with existing tests

**Gherkin Aliases Available**:
- `given.*` - Setup preconditions
- `when.*` - User actions
- `and.*` - Additional actions (alias of `when`)
- `then.*` - Assertions and verifications

---

## 📦 Helper Function Categories

### 1. Initialization Helpers
### 2. Toolbar Helpers
### 3. Entity Placement Helpers
### 4. Tool Mode Helpers
### 5. Material & Painting Helpers
### 6. Panel Helpers
### 7. Camera Helpers
### 8. Verification Helpers
### 9. Utility Helpers
### 10. Gherkin-Style Aliases

---

## 1️⃣ Initialization Helpers

### `startLevelEditor(page)`
**Purpose**: Start Level Editor and ensure it's ready  
**Returns**: `{ started: boolean, diagnostics: Object }`  
**Gherkin Alias**: `given.levelEditorIsOpen(page)`  
**Usage**:
```javascript
const { startLevelEditor } = require('./userFlowHelpers');
await startLevelEditor(page);

// Gherkin-style:
const { given } = require('./userFlowHelpers');
await given.levelEditorIsOpen(page);
```
**Related Tests**: All Level Editor tests

---

### `ensureGameStarted(page)`
**Purpose**: Bypass main menu and ensure game is running  
**Returns**: `{ started: boolean, diagnostics: Object }`  
**Gherkin Alias**: `given.gameIsStarted(page)`  
**Usage**:
```javascript
const { ensureGameStarted } = require('./userFlowHelpers');
const result = await ensureGameStarted(page);
if (!result.started) throw new Error('Game failed to start');

// Gherkin-style:
await given.gameIsStarted(page);
```
**Related Tests**: All game tests requiring gameplay state

---

### `switchToLevelEditor(page)`
**Purpose**: Switch game state to LEVEL_EDITOR  
**Returns**: `Promise<void>`  
**Usage**:
```javascript
const { switchToLevelEditor } = require('./userFlowHelpers');
await switchToLevelEditor(page);
```
**Related Tests**: Tests that need to manually switch to editor mode

---

## 2️⃣ Toolbar Helpers

### `clickToolbarTool(page, toolName)`
**Purpose**: Click a toolbar tool button via REAL mouse click workflow  
**Parameters**:
- `toolName` (string): Tool name ('eraser', 'brush', 'entity_painter', 'fill', 'select', etc.)

**Returns**: `{ clicked: boolean, selectedTool: string }`  
**Gherkin Alias**: `when.userClicksToolbarTool(page, toolName)`  
**Usage**:
```javascript
const { clickToolbarTool } = require('./userFlowHelpers');
const result = await clickToolbarTool(page, 'eraser');
console.log(`Tool selected: ${result.selectedTool}`);

// Gherkin-style:
await when.userClicksToolbarTool(page, 'eraser');
```
**Related Tests**:
- `test/e2e/levelEditor/pw_toolbar_click_detection.js`
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 6)

---

### `selectTool(page, toolName)`
**Purpose**: Select toolbar tool via API (faster, for setup)  
**Parameters**:
- `toolName` (string): Tool name

**Returns**: `Promise<void>`  
**Gherkin Alias**: `when.userSelectsTool(page, toolName)` or `given.toolIsSelected(page, toolName)`  
**Usage**:
```javascript
const { selectTool } = require('./userFlowHelpers');
await selectTool(page, 'paint');

// Gherkin-style:
await when.userSelectsTool(page, 'paint');
// OR for setup:
await given.toolIsSelected(page, 'paint');
```
**Related Tests**: Tests needing fast tool selection

---

### `deselectTool(page)`
**Purpose**: Deselect current tool (sets activeTool to null)  
**Returns**: `Promise<void>`  
**Gherkin Alias**: `when.userDeselectsTool(page)`  
**Usage**:
```javascript
const { deselectTool } = require('./userFlowHelpers');
await deselectTool(page);

// Gherkin-style:
await when.userDeselectsTool(page);
```
**Related Tests**:
- `test/e2e/levelEditor/pw_tool_mode_toggles.js` (Deselect tests)

---

### `getToolbarInfo(page)`
**Purpose**: Get toolbar state and available tools  
**Returns**: `{ toolsCount, toolNames, activeTool, activeMode, hasHandleClick, isArray }`  
**Usage**:
```javascript
const { getToolbarInfo } = require('./userFlowHelpers');
const info = await getToolbarInfo(page);
console.log(`Available tools: ${info.toolNames.join(', ')}`);
console.log(`Active tool: ${info.activeTool}`);
```
**Related Tests**: Toolbar inspection tests

---

### `getActiveToolMode(page)`
**Purpose**: Get currently active tool and mode  
**Returns**: `{ tool: string|null, mode: string|null }`  
**Usage**:
```javascript
const { getActiveToolMode } = require('./userFlowHelpers');
const state = await getActiveToolMode(page);
console.log(`Tool: ${state.tool}, Mode: ${state.mode}`);
```
**Related Tests**: Tool mode verification tests

---

## 3️⃣ Entity Placement Helpers

### `openEntityPalette(page)`
**Purpose**: Click entity_painter tool to open entity palette  
**Returns**: `{ opened: boolean }`  
**Gherkin Alias**: `when.userOpensEntityPalette(page)`  
**Usage**:
```javascript
const { openEntityPalette } = require('./userFlowHelpers');
await openEntityPalette(page);

// Gherkin-style:
await when.userOpensEntityPalette(page);
```
**Related Tests**:
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 2)
- `test/e2e/levelEditor/pw_entity_palette_content_visible.js`

---

### `clickEntityTemplate(page, templateIndex = 0)`
**Purpose**: Click a template in the entity palette  
**Parameters**:
- `templateIndex` (number): Template index (0 = first, 1 = second, etc.)

**Returns**: `{ selected: boolean, templateId: string, templateName: string }`  
**Gherkin Alias**: `when.userClicksEntityTemplate(page, templateIndex)`  
**Usage**:
```javascript
const { clickEntityTemplate } = require('./userFlowHelpers');
const result = await clickEntityTemplate(page, 0);
console.log(`Selected: ${result.templateName}`);

// Gherkin-style:
await when.userClicksEntityTemplate(page, 0);
```
**Related Tests**:
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 3)

---

### `placeEntityAtGrid(page, gridX, gridY)`
**Purpose**: Place entity at grid coordinates via REAL user workflow  
**Parameters**:
- `gridX` (number): Grid X coordinate
- `gridY` (number): Grid Y coordinate

**Returns**: `{ placed: boolean, gridX, gridY, entityDetails }`  
**Gherkin Alias**: `when.userPlacesEntityAtGrid(page, gridX, gridY)`  
**Usage**:
```javascript
const { placeEntityAtGrid } = require('./userFlowHelpers');
const result = await placeEntityAtGrid(page, 15, 15);

// Gherkin-style:
await when.userPlacesEntityAtGrid(page, 15, 15);
```
**Related Tests**:
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 5)
- `test/e2e/levelEditor/pw_entity_painter_integration.js`

---

### `eraseEntityAtGrid(page, gridX, gridY)`
**Purpose**: Erase entity at grid coordinates via REAL user workflow  
**Parameters**:
- `gridX` (number): Grid X coordinate
- `gridY` (number): Grid Y coordinate

**Returns**: `{ erased: boolean, gridX, gridY }`  
**Gherkin Alias**: `when.userErasesEntityAtGrid(page, gridX, gridY)`  
**Usage**:
```javascript
const { eraseEntityAtGrid } = require('./userFlowHelpers');
await eraseEntityAtGrid(page, 15, 15);

// Gherkin-style:
await when.userErasesEntityAtGrid(page, 15, 15);
```
**Related Tests**:
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 11)

---

## 4️⃣ Tool Mode Helpers

### `clickToolModeToggle(page, mode)`
**Purpose**: Click tool mode toggle button (TERRAIN, ENTITY, ALL, etc.)  
**Parameters**:
- `mode` (string): Mode name ('TERRAIN', 'ENTITY', 'ALL', 'EVENTS', 'PAINT')

**Returns**: `{ clicked: boolean, activeMode: string }`  
**Gherkin Alias**: `when.userClicksToolMode(page, mode)`  
**Usage**:
```javascript
const { clickToolModeToggle } = require('./userFlowHelpers');
await clickToolModeToggle(page, 'ENTITY');

// Gherkin-style:
await when.userClicksToolMode(page, 'ENTITY');
```
**Related Tests**:
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 7)
- `test/e2e/levelEditor/pw_tool_mode_toggles.js`

---

### `setToolMode(page, mode)`
**Purpose**: Set tool mode via API (faster, for setup)  
**Parameters**:
- `mode` (string): Mode name

**Returns**: `Promise<void>`  
**Usage**:
```javascript
const { setToolMode } = require('./userFlowHelpers');
await setToolMode(page, 'ENTITY');
```
**Related Tests**: Tool mode setup tests

---

## 5️⃣ Material & Painting Helpers

### `selectMaterial(page, materialName)`
**Purpose**: Select material from palette  
**Parameters**:
- `materialName` (string): Material name ('moss', 'stone', 'dirt', 'grass', etc.)

**Returns**: `{ success: boolean, selectedMaterial: string, isMaterialName: boolean }`  
**Gherkin Alias**: `when.userSelectsMaterial(page, materialName)` or `given.materialIsSelected(page, materialName)`  
**Usage**:
```javascript
const { selectMaterial } = require('./userFlowHelpers');
const result = await selectMaterial(page, 'moss');
console.log(`Selected: ${result.selectedMaterial}`);

// Gherkin-style:
await when.userSelectsMaterial(page, 'moss');
// OR for setup:
await given.materialIsSelected(page, 'moss');
```
**Related Tests**:
- `test/e2e/ui/pw_material_palette_painting.js`

---

### `paintTile(page, worldX, worldY)`
**Purpose**: Paint tile at world coordinates  
**Parameters**:
- `worldX` (number): World X coordinate
- `worldY` (number): World Y coordinate

**Returns**: `Promise<void>`  
**Gherkin Alias**: `when.userPaintsAtPosition(page, worldX, worldY)`  
**Usage**:
```javascript
const { paintTile } = require('./userFlowHelpers');
await paintTile(page, 160, 160);

// Gherkin-style:
await when.userPaintsAtPosition(page, 160, 160);
```
**Related Tests**:
- `test/e2e/ui/pw_material_palette_painting.js`

---

### `verifyTerrainMaterial(page, worldX, worldY, expectedMaterial)`
**Purpose**: Verify terrain material at world coordinates  
**Parameters**:
- `worldX` (number): World X coordinate
- `worldY` (number): World Y coordinate
- `expectedMaterial` (string): Expected material name

**Returns**: `{ matches: boolean, actual: string, expected: string, isColorCode: boolean }`  
**Gherkin Alias**: `then.materialShouldBe(page, worldX, worldY, expectedMaterial)`  
**Usage**:
```javascript
const { verifyTerrainMaterial } = require('./userFlowHelpers');
const result = await verifyTerrainMaterial(page, 160, 160, 'moss');
if (!result.matches) throw new Error(`Expected ${result.expected}, got ${result.actual}`);

// Gherkin-style:
await then.materialShouldBe(page, 160, 160, 'moss');
```
**Related Tests**:
- `test/e2e/ui/pw_material_palette_painting.js`

---

## 6️⃣ Panel Helpers

### `openPanel(page, panelId)`
**Purpose**: Open panel by ID  
**Parameters**:
- `panelId` (string): Panel ID ('level-editor-tools', 'entity-palette', etc.)

**Returns**: `{ opened: boolean, visible: boolean }`  
**Gherkin Alias**: `when.userOpensPanel(page, panelId)` or `given.panelIsOpen(page, panelId)`  
**Usage**:
```javascript
const { openPanel } = require('./userFlowHelpers');
await openPanel(page, 'entity-palette');

// Gherkin-style:
await when.userOpensPanel(page, 'entity-palette');
```
**Related Tests**: Panel visibility tests

---

### `closePanel(page, panelId)`
**Purpose**: Close panel by ID  
**Parameters**:
- `panelId` (string): Panel ID

**Returns**: `{ closed: boolean, visible: boolean }`  
**Gherkin Alias**: `when.userClosesPanel(page, panelId)` or `given.panelIsClosed(page, panelId)`  
**Usage**:
```javascript
const { closePanel } = require('./userFlowHelpers');
await closePanel(page, 'entity-palette');

// Gherkin-style:
await when.userClosesPanel(page, 'entity-palette');
```
**Related Tests**: Panel visibility tests

---

### `minimizePanel(page, panelId)`
**Purpose**: Toggle panel minimize state  
**Parameters**:
- `panelId` (string): Panel ID

**Returns**: `{ minimized: boolean, titleBarHeight: number }`  
**Gherkin Alias**: `when.userMinimizesPanel(page, panelId)`  
**Usage**:
```javascript
const { minimizePanel } = require('./userFlowHelpers');
const result = await minimizePanel(page, 'test-panel');
console.log(`Panel minimized: ${result.minimized}`);

// Gherkin-style:
await when.userMinimizesPanel(page, 'test-panel');
```
**Related Tests**:
- `test/e2e/ui/pw_panel_minimize.js`

---

### `getPanelState(page, panelId)`
**Purpose**: Get panel state (visible, minimized, position, size)  
**Parameters**:
- `panelId` (string): Panel ID

**Returns**: `{ visible, minimized, position, size }`  
**Usage**:
```javascript
const { getPanelState } = require('./userFlowHelpers');
const state = await getPanelState(page, 'test-panel');
console.log(`Panel visible: ${state.visible}, minimized: ${state.minimized}`);
```
**Related Tests**: Panel state verification tests

---

## 7️⃣ Camera Helpers

### `setCameraPosition(page, x, y)`
**Purpose**: Set camera position  
**Parameters**:
- `x` (number): Camera X position
- `y` (number): Camera Y position

**Returns**: `Promise<void>`  
**Gherkin Alias**: `given.cameraIsAt(page, x, y)`  
**Usage**:
```javascript
const { setCameraPosition } = require('./userFlowHelpers');
await setCameraPosition(page, 500, 300);

// Gherkin-style:
await given.cameraIsAt(page, 500, 300);
```
**Related Tests**:
- `test/e2e/camera/pw_camera_movement.js`

---

### `zoomCamera(page, zoomLevel)`
**Purpose**: Set camera zoom level  
**Parameters**:
- `zoomLevel` (number): Zoom level (1.0 = 100%, 2.0 = 200%, 0.5 = 50%)

**Returns**: `Promise<void>`  
**Gherkin Alias**: `when.userZoomsCamera(page, zoomLevel)`  
**Usage**:
```javascript
const { zoomCamera } = require('./userFlowHelpers');
await zoomCamera(page, 1.5);

// Gherkin-style:
await when.userZoomsCamera(page, 1.5);
```
**Related Tests**:
- `test/e2e/camera/pw_camera_zoom.js`

---

### `panCamera(page, deltaX, deltaY)`
**Purpose**: Pan camera by delta  
**Parameters**:
- `deltaX` (number): Delta X
- `deltaY` (number): Delta Y

**Returns**: `Promise<void>`  
**Gherkin Alias**: `when.userPansCamera(page, deltaX, deltaY)`  
**Usage**:
```javascript
const { panCamera } = require('./userFlowHelpers');
await panCamera(page, 100, -50);

// Gherkin-style:
await when.userPansCamera(page, 100, -50);
```
**Related Tests**: Camera panning tests

---

## 8️⃣ Verification Helpers

### `verifyEntityAtGrid(page, gridX, gridY)`
**Purpose**: Verify entity exists at grid coordinates in level data  
**Parameters**:
- `gridX` (number): Grid X coordinate
- `gridY` (number): Grid Y coordinate

**Returns**: `{ exists: boolean, entityDetails: Object|null, totalEntities: number }`  
**Gherkin Alias**: `then.entityShouldExistAtGrid(page, gridX, gridY)`  
**Usage**:
```javascript
const { verifyEntityAtGrid } = require('./userFlowHelpers');
const result = await verifyEntityAtGrid(page, 15, 15);
if (!result.exists) throw new Error('Entity not found');

// Gherkin-style:
await then.entityShouldExistAtGrid(page, 15, 15);
```
**Related Tests**:
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 10)

---

### `verifyEntityErasedAtGrid(page, gridX, gridY)`
**Purpose**: Verify entity does NOT exist at grid coordinates  
**Parameters**:
- `gridX` (number): Grid X coordinate
- `gridY` (number): Grid Y coordinate

**Returns**: `{ erased: boolean }`  
**Throws**: Error if entity still exists  
**Gherkin Alias**: `then.entityShouldNotExistAtGrid(page, gridX, gridY)`  
**Usage**:
```javascript
const { verifyEntityErasedAtGrid } = require('./userFlowHelpers');
await verifyEntityErasedAtGrid(page, 15, 15);

// Gherkin-style:
await then.entityShouldNotExistAtGrid(page, 15, 15);
```
**Related Tests**:
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 12)

---

## 9️⃣ Utility Helpers

### `forceRedraw(page)`
**Purpose**: Force p5.js redraw (calls redraw() 3 times for layer rendering)  
**Returns**: `Promise<void>`  
**Usage**:
```javascript
const { forceRedraw } = require('./userFlowHelpers');
await forceRedraw(page);
```
**Related Tests**: All tests requiring render update

---

### `forceRenderPanels(page, gameState)`
**Purpose**: Force panel rendering for specified game state  
**Parameters**:
- `gameState` (string): Game state ('PLAYING', 'LEVEL_EDITOR', etc.)

**Returns**: `Promise<void>`  
**Usage**:
```javascript
const { forceRenderPanels } = require('./userFlowHelpers');
await forceRenderPanels(page, 'LEVEL_EDITOR');
```
**Related Tests**: Panel rendering tests

---

### `takeScreenshot(page, category, name, success = true)`
**Purpose**: Take screenshot with consistent naming  
**Parameters**:
- `category` (string): Category ('levelEditor', 'ui', 'camera', etc.)
- `name` (string): Screenshot name
- `success` (boolean): Success state (default: true)

**Returns**: `Promise<void>`  
**Usage**:
```javascript
const { takeScreenshot } = require('./userFlowHelpers');
await takeScreenshot(page, 'levelEditor', 'entity_placed', true);
```
**Related Tests**: All tests

---

### `waitForCondition(page, conditionFn, timeout = 5000, interval = 100)`
**Purpose**: Wait for condition to be true with timeout  
**Parameters**:
- `conditionFn` (Function): Function returning boolean
- `timeout` (number): Timeout in ms (default: 5000)
- `interval` (number): Check interval in ms (default: 100)

**Returns**: `Promise<boolean>` - True if condition met, false if timeout  
**Usage**:
```javascript
const { waitForCondition } = require('./userFlowHelpers');
const ready = await waitForCondition(page, () => {
  return window.levelEditor !== undefined;
}, 5000);
```
**Related Tests**: Tests requiring async waits

---

### `getLevelData(page)`
**Purpose**: Get level JSON data (entity spawn data, terrain)  
**Returns**: `{ entitySpawnData: Array, terrainData: string }`  
**Usage**:
```javascript
const { getLevelData } = require('./userFlowHelpers');
const data = await getLevelData(page);
console.log(`Entities in level: ${data.entitySpawnData.length}`);
```
**Related Tests**: Level data verification tests

---

## 🔟 Gherkin-Style Aliases

### `given.*` - Setup Preconditions
- `given.levelEditorIsOpen(page)` → `startLevelEditor(page)`
- `given.gameIsStarted(page)` → `ensureGameStarted(page)`
- `given.toolIsSelected(page, tool)` → `selectTool(page, tool)`
- `given.materialIsSelected(page, mat)` → `selectMaterial(page, mat)`
- `given.cameraIsAt(page, x, y)` → `setCameraPosition(page, x, y)`
- `given.panelIsOpen(page, id)` → `openPanel(page, id)`
- `given.panelIsClosed(page, id)` → `closePanel(page, id)`

### `when.*` - User Actions
- `when.userClicksToolbarTool(page, tool)` → `clickToolbarTool(page, tool)`
- `when.userSelectsTool(page, tool)` → `selectTool(page, tool)`
- `when.userDeselectsTool(page)` → `deselectTool(page)`
- `when.userClicksToolMode(page, mode)` → `clickToolModeToggle(page, mode)`
- `when.userSelectsMaterial(page, mat)` → `selectMaterial(page, mat)`
- `when.userPaintsAtPosition(page, x, y)` → `paintTile(page, x, y)`
- `when.userPlacesEntityAtGrid(page, gx, gy)` → `placeEntityAtGrid(page, gx, gy)`
- `when.userErasesEntityAtGrid(page, gx, gy)` → `eraseEntityAtGrid(page, gx, gy)`
- `when.userOpensEntityPalette(page)` → `openEntityPalette(page)`
- `when.userClicksEntityTemplate(page, idx)` → `clickEntityTemplate(page, idx)`
- `when.userOpensPanel(page, id)` → `openPanel(page, id)`
- `when.userClosesPanel(page, id)` → `closePanel(page, id)`
- `when.userMinimizesPanel(page, id)` → `minimizePanel(page, id)`
- `when.userZoomsCamera(page, zoom)` → `zoomCamera(page, zoom)`
- `when.userPansCamera(page, dx, dy)` → `panCamera(page, dx, dy)`

### `and.*` - Additional Actions
Same as `when.*` (alias for readability)

### `then.*` - Assertions & Verifications
- `then.entityShouldExistAtGrid(page, gx, gy)` → `verifyEntityAtGrid(page, gx, gy)`
- `then.entityShouldNotExistAtGrid(page, gx, gy)` → `verifyEntityErasedAtGrid(page, gx, gy)`
- `then.materialShouldBe(page, x, y, mat)` → `verifyTerrainMaterial(page, x, y, mat)`
- `then.toolShouldBe(page, tool)` → Throws error if tool doesn't match
- `then.modeShouldBe(page, mode)` → Throws error if mode doesn't match
- `then.panelShouldBeVisible(page, id)` → Throws error if panel not visible
- `then.panelShouldBeMinimized(page, id)` → Throws error if panel not minimized

---

## 📋 Complete E2E Test Files

### 1. pw_entity_eraser_user_flow.js
**Location**: `test/e2e/levelEditor/pw_entity_eraser_user_flow.js`  
**Purpose**: Complete entity placement and erasure workflow  
**Steps**:
1. Start Level Editor
2. Open entity palette
3. Click entity template
4. Switch to place mode
5. Place entity at grid
6. Click eraser tool
7. Set eraser to ENTITY mode
8. Click erase mode toggle
9. Click at entity location
10. Verify entity erased from visual array
11. Verify entity erased from level JSON data

**Key Learning**: Always verify BOTH visual state AND level data

---

### 2. pw_toolbar_click_detection.js
**Location**: `test/e2e/levelEditor/pw_toolbar_click_detection.js`  
**Purpose**: Test toolbar button click detection  
**Tests**: Toolbar rendering, button clicks, tool selection, Events button

---

### 3. pw_entity_palette_content_visible.js
**Location**: `test/e2e/levelEditor/pw_entity_palette_content_visible.js`  
**Purpose**: Test entity palette content visibility and category switching  
**Tests**: Templates rendering, category buttons, scrolling, content size calculation

---

## 📊 Testing Patterns & Best Practices

### Pattern 1: Complete User Flow Test
```javascript
const { given, when, and, then } = require('./userFlowHelpers');

// Setup
await given.levelEditorIsOpen(page);

// Action
await when.userOpensEntityPalette(page);
await and.userClicksEntityTemplate(page, 0);
await and.userPlacesEntityAtGrid(page, 10, 10);

// Verify
await then.entityShouldExistAtGrid(page, 10, 10);
await takeScreenshot(page, 'levelEditor', 'entity_placed', true);
```

### Pattern 2: Multi-Step Workflow
```javascript
const { given, when, and, then } = require('./userFlowHelpers');

await given.levelEditorIsOpen(page);
await given.toolIsSelected(page, 'paint');
await given.materialIsSelected(page, 'moss');

await when.userPaintsAtPosition(page, 100, 100);
await then.materialShouldBe(page, 100, 100, 'moss');
```

### Pattern 3: State Verification
```javascript
const { getToolbarInfo, getPanelState } = require('./userFlowHelpers');

const toolbarInfo = await getToolbarInfo(page);
console.log(`Tools: ${toolbarInfo.toolNames}`);

const panelState = await getPanelState(page, 'test-panel');
console.log(`Panel visible: ${panelState.visible}`);
```

---

## 🚀 Quick Start Examples

### Example 1: Test Entity Placement
```javascript
const { given, when, then } = require('./levelEditor/userFlowHelpers');
const { launchBrowser, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000?test=1');
    
    await given.levelEditorIsOpen(page);
    await when.userOpensEntityPalette(page);
    await when.userClicksEntityTemplate(page, 0);
    await when.userPlacesEntityAtGrid(page, 15, 15);
    await then.entityShouldExistAtGrid(page, 15, 15);
    
    await saveScreenshot(page, 'levelEditor/entity_placed', true);
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    await saveScreenshot(page, 'levelEditor/entity_error', false);
    await browser.close();
    process.exit(1);
  }
})();
```

### Example 2: Test Material Painting
```javascript
const { given, when, then } = require('./levelEditor/userFlowHelpers');

await given.levelEditorIsOpen(page);
await when.userSelectsTool(page, 'paint');
await when.userSelectsMaterial(page, 'moss');
await when.userPaintsAtPosition(page, 100, 100);
await then.materialShouldBe(page, 100, 100, 'moss');
```

### Example 3: Test Panel Minimize
```javascript
const { given, when, then } = require('./levelEditor/userFlowHelpers');

await given.levelEditorIsOpen(page);
await when.userOpensPanel(page, 'test-panel');
await when.userMinimizesPanel(page, 'test-panel');
await then.panelShouldBeMinimized(page, 'test-panel');
```

---

## 📚 Related Documentation

- **E2E Testing Quickstart**: `docs/guides/E2E_TESTING_QUICKSTART.md`
- **Testing Types Guide**: `docs/guides/TESTING_TYPES_GUIDE.md`
- **Testing Methodology Standards**: `docs/standards/testing/TESTING_METHODOLOGY_STANDARDS.md`
- **Copilot Instructions**: `.github/copilot-instructions.md` (Section: "E2E Testing Critical Patterns")

---

## ✅ Summary

- **Total Helper Functions**: 35+
- **Gherkin-Style Aliases**: Full support (given/when/and/then)
- **Categories**: 10 (Initialization, Toolbar, Entity, Tool Modes, Materials, Panels, Camera, Verification, Utilities, Gherkin)
- **Complete Test Files**: 3+ examples
- **Testing Patterns**: 3 documented patterns

**ALWAYS check this catalog before creating new E2E tests!**
