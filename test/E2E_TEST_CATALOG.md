# E2E Test Catalog - Level Editor User Flow Tests

**Purpose**: Catalog of reusable E2E test functions and complete test files for Level Editor functionality. **ALWAYS check this catalog before creating new tests** - reuse existing tests when possible.

**Location**: `test/e2e/levelEditor/userFlowHelpers.js`

---

## 🎯 Core Principles

1. **Real User Flows Only**: All tests simulate ACTUAL user interactions (mouse clicks, toolbar selections, etc.)
2. **System APIs**: Use `handleClick()`, `selectTool()`, etc. - NOT direct property manipulation
3. **Verify Level Data**: Check `_entitySpawnData` (actual level JSON), not just visual state
4. **Reuse First**: Use helper functions from `userFlowHelpers.js` before writing new code

---

## 📦 Reusable Helper Functions

### Level Editor Setup

#### `startLevelEditor(page)`
**Purpose**: Start Level Editor and ensure it's ready  
**Returns**: `{ started: boolean }`  
**Usage**:
```javascript
const { startLevelEditor } = require('./userFlowHelpers');
await startLevelEditor(page);
```

---

### Toolbar Interactions

#### `clickToolbarTool(page, toolName)`
**Purpose**: Click a toolbar tool button (eraser, brush, etc.)  
**Parameters**:
- `toolName` (string): Tool name ('eraser', 'brush', 'entity_painter', etc.)

**Returns**: `{ clicked: boolean, selectedTool: string }`  
**Usage**:
```javascript
const { clickToolbarTool } = require('./userFlowHelpers');
const result = await clickToolbarTool(page, 'eraser');
console.log(`Tool selected: ${result.selectedTool}`);
```

**Related Tests**:
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 6: Click eraser tool)
- `test/e2e/levelEditor/pw_tool_mode_toggles_mouse.js` (Tool selection tests)

---

### Entity Palette

#### `openEntityPalette(page)`
**Purpose**: Click entity_painter tool to open entity palette  
**Returns**: `{ opened: boolean }`  
**Usage**:
```javascript
const { openEntityPalette } = require('./userFlowHelpers');
await openEntityPalette(page);
```

**Related Tests**:
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 2)

---

#### `clickEntityTemplate(page, templateIndex = 0)`
**Purpose**: Click a template in the entity palette  
**Parameters**:
- `templateIndex` (number): Template index (0 = first template, 1 = second, etc.)

**Returns**: `{ selected: boolean, templateId: string, templateName: string }`  
**Usage**:
```javascript
const { clickEntityTemplate } = require('./userFlowHelpers');
const result = await clickEntityTemplate(page, 0); // Click first template
console.log(`Selected: ${result.templateName} (${result.templateId})`);
```

**Related Tests**:
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 3: Click Queen Ant template)

---

### Entity Placement

#### `placeEntityAtGrid(page, gridX, gridY)`
**Purpose**: Place an entity on the canvas at grid coordinates  
**Parameters**:
- `gridX` (number): Grid X coordinate
- `gridY` (number): Grid Y coordinate

**Returns**: `{ placed: boolean, gridX: number, gridY: number, entityDetails: Object }`  
**Usage**:
```javascript
const { placeEntityAtGrid } = require('./userFlowHelpers');
const result = await placeEntityAtGrid(page, 15, 15);
console.log(`Placed entity at (${result.gridX}, ${result.gridY})`);
```

**Notes**:
- Calls `LevelEditor.handleClick()` to route through proper system APIs
- Entity stored in `_entitySpawnData` (actual level data)
- Automatically converts grid → world → screen coordinates

**Related Tests**:
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 4: Place entity)

---

### Tool Mode Toggles

#### `clickToolModeToggle(page, mode)`
**Purpose**: Click a tool mode toggle button (ALL, TERRAIN, ENTITY, EVENTS)  
**Parameters**:
- `mode` (string): Mode name ('ALL', 'TERRAIN', 'ENTITY', 'EVENTS')

**Returns**: `{ selected: boolean, mode: string }`  
**Usage**:
```javascript
const { clickToolModeToggle } = require('./userFlowHelpers');
const result = await clickToolModeToggle(page, 'ENTITY');
console.log(`Mode selected: ${result.mode}`);
```

**Related Tests**:
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 8: Change to ENTITY mode)
- `test/e2e/levelEditor/pw_tool_mode_toggles_mouse.js` (All mode toggle tests)

---

### Entity Erasure

#### `eraseEntityAtGrid(page, gridX, gridY)`
**Purpose**: Erase entity at grid coordinates using eraser tool  
**Parameters**:
- `gridX` (number): Grid X coordinate
- `gridY` (number): Grid Y coordinate

**Returns**: `{ erased: boolean, gridX: number, gridY: number }`  
**Usage**:
```javascript
const { eraseEntityAtGrid } = require('./userFlowHelpers');
const result = await eraseEntityAtGrid(page, 15, 15);
console.log(`Entity erased at (${result.gridX}, ${result.gridY})`);
```

**Notes**:
- Calls `LevelEditor.handleClick()` with eraser tool selected
- Removes from `_entitySpawnData` (actual level data) AND `placedEntities`
- Throws error if entity not erased

**Related Tests**:
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 10: Click on entity to erase)
- `test/e2e/levelEditor/pw_entity_eraser_modes_mouse.js` (Eraser mode tests)

---

### Verification Helpers

#### `verifyEntityAtGrid(page, gridX, gridY)`
**Purpose**: Verify entity exists at grid coordinates in level data  
**Parameters**:
- `gridX` (number): Grid X coordinate
- `gridY` (number): Grid Y coordinate

**Returns**: `{ exists: boolean, entityDetails: Object|null, totalEntities: number }`  
**Usage**:
```javascript
const { verifyEntityAtGrid } = require('./userFlowHelpers');
const result = await verifyEntityAtGrid(page, 15, 15);
if (result.exists) {
  console.log('Entity found:', result.entityDetails);
}
```

**Related Tests**:
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 5: Verify entity on canvas)

---

#### `verifyEntityErasedAtGrid(page, gridX, gridY)`
**Purpose**: Verify entity does NOT exist at grid coordinates (throws error if still exists)  
**Parameters**:
- `gridX` (number): Grid X coordinate
- `gridY` (number): Grid Y coordinate

**Returns**: `{ erased: boolean }`  
**Usage**:
```javascript
const { verifyEntityErasedAtGrid } = require('./userFlowHelpers');
await verifyEntityErasedAtGrid(page, 15, 15); // Throws if entity still exists
console.log('Entity confirmed erased');
```

**Related Tests**:
- `test/e2e/levelEditor/pw_entity_eraser_user_flow.js` (Step 11: Verify entity erased)

---

## 📋 Complete E2E Test Files

### Entity Eraser User Flow Test
**File**: `test/e2e/levelEditor/pw_entity_eraser_user_flow.js`  
**Purpose**: Complete end-to-end test of entity placement and erasure workflow  
**Steps**:
1. Start Level Editor
2. Open entity palette (click entity_painter tool)
3. Click template (Queen Ant)
4. Place entity on canvas at grid(15, 15)
5. **TEST**: Verify entity on canvas
6. Click eraser tool
7. **TEST**: Verify eraser selected
8. Click ENTITY mode toggle
9. **TEST**: Verify ENTITY mode selected
10. Click on placed entity to erase
11. **TEST**: Verify entity erased from placedEntities
12. **FINAL TEST**: Verify entity erased from `_entitySpawnData` (level JSON)

**Key Features**:
- ✅ Real user workflow (mouse clicks, toolbar selection)
- ✅ System API calls (`handleClick()`, not direct manipulation)
- ✅ Verifies actual level data (`_entitySpawnData`), not just visual state
- ✅ Comprehensive data structure checks

**Exit Code**: 0 = all tests pass, 1 = any test fails

---

### Entity Eraser Modes Test
**File**: `test/e2e/levelEditor/pw_entity_eraser_modes_mouse.js`  
**Purpose**: Test entity eraser modes (ENTITY, TERRAIN, ALL)  
**Tests**:
1. **ENTITY mode**: Erases only entities (terrain/events intact)
2. **TERRAIN mode**: Erases only terrain (entities/events intact)
3. **ALL mode**: Erases everything (entities, terrain, events)

**Key Features**:
- ✅ Creates entities/terrain/events programmatically (setup)
- ✅ Calls `handleErase()` through system APIs
- ✅ Verifies selective erasure by checking data arrays

---

### Tool Mode Toggles Test
**File**: `test/e2e/levelEditor/pw_tool_mode_toggles_mouse.js`  
**Purpose**: Test mode toggle UI with mouse clicks  
**Tests**:
1. No tool → no toggles visible
2. Eraser selected → modes visible
3. Click ENTITY mode → ENTITY selected
4. Click TERRAIN mode → TERRAIN selected
5. Paint tool → toggles hide
6. Eraser reselected → toggles reappear

**Key Features**:
- ✅ Uses `page.mouse.click()` on mode toggle buttons
- ✅ Verifies `toolModeToggle.currentMode` changes

---

## 🔍 When to Reuse vs Create New Tests

### ✅ Reuse Existing Helpers When:
- Testing entity placement workflow
- Testing entity erasure workflow
- Testing toolbar tool selection
- Testing mode toggle selection
- Verifying level data integrity

### 🆕 Create New Helpers When:
- Testing NEW Level Editor features not covered above
- Testing different UI components (materials palette, terrain tools, etc.)
- Testing new entity types or placement modes
- Testing export/import workflows

---

## 📝 Test Naming Conventions

**Format**: `pw_<feature>_<action>_<method>.js`

**Examples**:
- `pw_entity_eraser_user_flow.js` - Complete user workflow test
- `pw_entity_eraser_modes_mouse.js` - Mouse-based mode testing
- `pw_tool_mode_toggles_mouse.js` - Mouse-based toggle testing

**Prefixes**:
- `pw_` = Puppeteer/Playwright E2E test
- `browser_` = Browser console test (manual)

**Suffixes**:
- `_mouse.js` = Uses mouse clicks
- `_user_flow.js` = Complete end-to-end user workflow
- `_api.js` = Uses system APIs only (minimal UI)

---

## 🚨 Critical Testing Rules

1. **ALWAYS use real user flows** (mouse clicks, system APIs) unless explicitly told otherwise by a developer
2. **NEVER bypass UI** with direct property manipulation in E2E tests
3. **ALWAYS verify level data** (`_entitySpawnData`), not just visual state
4. **ALWAYS check this catalog** before creating new tests
5. **ALWAYS use helper functions** from `userFlowHelpers.js` when applicable
6. **ALWAYS call `ensureGameStarted()` or `ensureLevelEditorStarted()`** at test start
7. **ALWAYS force redraw** after state changes: `window.redraw(); window.redraw(); window.redraw();`
8. **ALWAYS take screenshots** for visual proof (success/ and failure/ folders)

---

## 📚 Related Documentation

- **E2E Testing Quickstart**: `docs/guides/E2E_TESTING_QUICKSTART.md`
- **Testing Types Guide**: `docs/guides/TESTING_TYPES_GUIDE.md`
- **Testing Methodology**: `docs/standards/testing/TESTING_METHODOLOGY_STANDARDS.md`
- **BDD Language Style**: `docs/standards/testing/BDD_LANGUAGE_STYLE_GUIDE.md`

---

## 🔄 Maintenance

**Last Updated**: November 1, 2025  
**Maintainer**: Development Team  
**Update Frequency**: Add new helpers/tests as they are created

When adding new helpers:
1. Add function to `userFlowHelpers.js`
2. Document in this catalog with usage examples
3. Link related test files
4. Update copilot instructions reference
