# GitHub Copilot Instructions - Ant Colony Simulation Game

## ⚠️ CRITICAL: Test-Driven Development (TDD)

**WE FOLLOW STRICT TDD**. Write tests FIRST, then implement.

### TDD Workflow
1. **Write failing tests FIRST** before any implementation
2. **Run tests** - confirm they fail for the right reason  
3. **Write minimal code** to make tests pass
4. **Run tests again** - confirm they pass
5. **Refactor** - improve code while keeping tests green
6. **Repeat** for each feature/bugfix

### Test Type Expectations

**Unit Tests** (862+ tests, write FIRST):
- ✅ Test individual functions in isolation
- ✅ Mock all external dependencies (p5.js, managers)
- ✅ Fast (<10ms per test)
- ✅ Target 100% coverage for new code
- ❌ NEVER test loop counters or internal mechanics
- ❌ NEVER test mocks (test real behavior)

**Integration Tests**:
- ✅ Test component interactions with real dependencies
- ✅ Verify data flows between systems
- ✅ Use JSDOM, sync `global` and `window` objects
- ❌ Don't mock core systems (MapManager, SpatialGrid)

**E2E Tests** (Puppeteer, PRIMARY with screenshots):
- ✅ Test complete workflows in real browser
- ✅ Provide screenshot proof (visual evidence)
- ✅ Use system APIs, not manual property injection
- ✅ Run headless for CI/CD
- ❌ NEVER skip `ensureGameStarted()` (must bypass menu)
- ❌ NEVER change state without `redraw()` calls
- ❌ NEVER skip screenshot verification

**BDD Tests** (Python Behave, headless):
- ✅ Test user-facing behavior
- ✅ Use plain language (no technical jargon)
- ❌ NEVER use "real", "actual", "fake" (see BDD_LANGUAGE_STYLE_GUIDE.md)
- ❌ NEVER hardcode test results

## Core Architecture

### Entity-Controller Pattern (Composition Over Inheritance)

**Entity** (`Classes/containers/Entity.js`) - Base class with optional controllers:
- `TransformController` - Position, rotation, scale
- `MovementController` - Pathfinding, movement speed
- `TaskManager` - Priority queue (EMERGENCY=0, HIGH=1, NORMAL=2, LOW=3, IDLE=4)
- `RenderController` - Visual rendering, effects
- `SelectionController` - Selection states, highlighting
- `CombatController`, `HealthController`, `InventoryController`, `TerrainController`

Controllers auto-initialize if available. Access via `entity.getController('name')` or delegate methods.

### Creating a New Controller - TDD CHECKLIST

**STEP 1: Write Tests FIRST**
```javascript
// test/unit/controllers/MyController.test.js
const { expect } = require('chai');
const sinon = require('sinon');

describe('MyController', function() {
  let entity, controller;
  
  beforeEach(function() {
    // Mock p5.js
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    window.createVector = global.createVector; // Sync for JSDOM
    
    entity = new Entity(0, 0, 32, 32);
    controller = entity.getController('myController'); // Will fail
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  it('should initialize with defaults', function() {
    expect(controller).to.exist;
    expect(controller.myProperty).to.equal(expectedValue);
  });
  
  it('should perform behavior', function() {
    controller.myMethod(arg);
    expect(controller.myProperty).to.equal(expectedResult);
  });
});
```

**STEP 2: Run tests (should fail)**
```bash
npx mocha "test/unit/controllers/MyController.test.js"
```

**STEP 3: Create controller class**
```javascript
// Classes/controllers/MyController.js
class MyController {
  constructor(entity) {
    this._entity = entity;
    this._myProperty = defaultValue;
  }
  
  myMethod(arg) {
    this._myProperty = transform(arg);
  }
  
  update() { /* called each frame */ }
  
  get myProperty() { return this._myProperty; }
}

// Global export
if (typeof window !== 'undefined') window.MyController = MyController;
if (typeof module !== 'undefined') module.exports = MyController;
```

**STEP 4: Register in Entity**
```javascript
// Classes/containers/Entity.js - _initializeControllers()
const availableControllers = {
  'myController': typeof MyController !== 'undefined' ? MyController : null,
  // ... other controllers
};
```

**STEP 5: Add delegate methods (optional)**
```javascript
// Classes/containers/Entity.js - _initializeEnhancedAPI()
const myController = this._controllers.get('myController');
if (myController) {
  this.myDelegateMethod = (arg) => myController.myMethod(arg);
}
```

**STEP 6: Add to index.html**
```html
<script src="Classes/controllers/MyController.js"></script>
```

**STEP 7: Run tests (should pass)**
```bash
npx mocha "test/unit/controllers/MyController.test.js"
```

**STEP 8: Integration tests**
```javascript
// test/integration/controllers/myController.integration.test.js
it('should work with real systems', function() {
  const entity = new Entity(100, 100, 32, 32);
  entity.myDelegateMethod(arg);
  expect(entity.getController('myController').myProperty).to.equal(expected);
});
```

**STEP 9: E2E tests with screenshots**
```javascript
// test/e2e/controllers/pw_my_controller.js
const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.goto('http://localhost:8000?test=1');
  
  // CRITICAL: Ensure game started
  const gameStarted = await cameraHelper.ensureGameStarted(page);
  if (!gameStarted.started) throw new Error('Game failed to start');
  
  const result = await page.evaluate(() => {
    const entity = new Entity(100, 100, 32, 32);
    entity.myDelegateMethod(testArg);
    return { success: entity.myProperty === expectedValue };
  });
  
  await saveScreenshot(page, 'controllers/my_controller', result.success);
  await browser.close();
  process.exit(result.success ? 0 : 1);
})();
```

## Rendering Pipeline

**RenderLayerManager** (`Classes/rendering/RenderLayerManager.js`) - Fixed layer order:

**Layers** (bottom to top): `TERRAIN` → `ENTITIES` → `EFFECTS` → `UI_GAME` → `UI_DEBUG` → `UI_MENU`

**State-based visibility**:
- `MENU`: TERRAIN + UI_MENU
- `PLAYING`: TERRAIN + ENTITIES + EFFECTS + UI_GAME + UI_DEBUG
- `PAUSED`: TERRAIN + ENTITIES + EFFECTS + UI_GAME

### Adding to RenderLayerManager - TDD CHECKLIST

**STEP 1: Write tests FIRST**
```javascript
// test/integration/rendering/myFeature.test.js
it('should register with correct layer', function() {
  const initialCount = RenderManager.getLayerDrawables(RenderManager.layers.ENTITIES).length;
  registerMyFeatureRenderer();
  expect(RenderManager.getLayerDrawables(RenderManager.layers.ENTITIES).length).to.equal(initialCount + 1);
});
```

**STEP 2: Register drawable**
```javascript
RenderManager.addDrawableToLayer(RenderManager.layers.ENTITIES, () => {
  push();
  myEntities.forEach(e => e.render());
  pop();
});
```

**STEP 3: For interactive elements**
```javascript
RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, {
  hitTest: (pointer) => pointer.x > x && pointer.x < x + width,
  onPointerDown: (pointer) => { /* handle click */ }
});
```

**STEP 4: E2E test with screenshots**
```javascript
await page.evaluate(() => {
  window.gameState = 'PLAYING';
  if (window.RenderManager) window.RenderManager.render('PLAYING');
  if (typeof window.redraw === 'function') {
    window.redraw(); window.redraw(); window.redraw(); // Multiple calls for layers
  }
});
await sleep(500);
await saveScreenshot(page, 'rendering/my_feature', true);
```

## Terrain System

**MapManager** (`Classes/managers/MapManager.js`) - Perlin noise generation, 32px tiles

**⚠️ CRITICAL BUG**: Grid.get() has inverted Y-axis boundary check. **Always use `MapManager.getTileAtGridCoords()`** instead.

**Terrain types**:
```javascript
const TERRAIN_TYPES = {
  GRASS: 0,   // 1.0x cost
  WATER: 1,   // 3.0x cost (slow)
  STONE: 2,   // Infinity (impassable)
  SAND: 3,    // 1.2x cost
  DIRT: 4     // 1.0x cost
};
```

**Correct usage**:
```javascript
// ✅ CORRECT
const tile = g_map2.getTileAtGridCoords(x, y);
const terrainType = tile ? tile.type : null;

// ❌ WRONG (Y-axis bug)
const tile = g_map2.grid.get([x, y]); // AVOID
```

## Pathfinding System

**A* algorithm** (`Classes/pathfinding.js`) with terrain cost integration

**MovementController integration**:
```javascript
entity.moveToLocation(targetX, targetY);
// Internally: MovementController → pathfinding → terrain costs → optimal path
```

**Testing pathfinding (TDD)**:
```javascript
it('should avoid water when pathfinding', function() {
  const mockTerrain = {
    getTileAtGridCoords: sinon.stub().callsFake((x, y) => {
      if (x >= 5 && x <= 7 && y >= 5 && y <= 7) return { type: TERRAIN_TYPES.WATER };
      return { type: TERRAIN_TYPES.GRASS };
    })
  };
  
  const path = findPath(0, 0, 10, 10, { terrain: mockTerrain, avoidWater: true });
  
  path.forEach(point => {
    const tile = mockTerrain.getTileAtGridCoords(point.x, point.y);
    expect(tile.type).to.not.equal(TERRAIN_TYPES.WATER);
  });
});
```

## Spatial Grid System

**SpatialGridManager** (`Classes/managers/SpatialGridManager.js`) - O(1) spatial queries

**Cell size**: 64px (TILE_SIZE * 2), entities auto-register

**Query methods**:
- `getNearbyEntities(x, y, radius)` - within radius
- `findNearestEntity(x, y)` - closest
- `getEntitiesInRect(x, y, w, h)` - in rectangle
- `getEntitiesByType('Ant')` - type filtering

**Performance**: 50-200x faster than iteration

## Upcoming Systems (Design Phase)

### Pheromone System
**TDD Plan**:
1. Write unit tests for PheromoneManager (creation, decay, diffusion)
2. Write integration tests for ant-pheromone interaction
3. E2E tests with visual pheromone trails (screenshots)
4. Add PheromoneController to Entity
5. Register in EFFECTS rendering layer

### Level Editor System
**Current**: LevelEditorPanels (partial)
**Planned**: Terrain editing, entity placement, save/load
**TDD Plan**:
- Unit tests for terrain modification (`setTileType()`, `paintBrush()`)
- Integration tests for JSON serialization roundtrip
- E2E tests for UI interactions with screenshots
- BDD tests for complete level creation workflow

## E2E Testing Critical Patterns

**MANDATORY**: See `docs/guides/E2E_TESTING_QUICKSTART.md`

### 1. Server Setup
```bash
npm run dev  # Must be running on localhost:8000
```

### 2. Menu Bypass (CRITICAL!)
```javascript
const cameraHelper = require('../camera_helper');
const gameStarted = await cameraHelper.ensureGameStarted(page);
if (!gameStarted.started) throw new Error('Failed to start - still on menu');
```
**Without this**: Screenshots show main menu, not game!

### 3. Force Rendering After State Changes
```javascript
await page.evaluate(() => {
  window.gameState = 'PLAYING';
  
  if (window.draggablePanelManager) {
    window.draggablePanelManager.renderPanels('PLAYING');
  }
  
  if (typeof window.redraw === 'function') {
    window.redraw(); window.redraw(); window.redraw();
  }
});
await sleep(500);
await saveScreenshot(page, 'category/name', true);
```
**Without this**: Screenshots show old state!

### 4. Panel Visibility System
```javascript
await page.evaluate(() => {
  if (!window.draggablePanelManager.stateVisibility.PLAYING) {
    window.draggablePanelManager.stateVisibility.PLAYING = [];
  }
  window.draggablePanelManager.stateVisibility.PLAYING.push('test-panel-id');
});
```
**Without this**: Panel won't render!

### 5. Screenshot Proof (MANDATORY)
```javascript
await saveScreenshot(page, 'ui/test_name', true);  // success/
await saveScreenshot(page, 'ui/test_error', false); // failure/ with timestamp
```

**Verify screenshots show**:
- ✅ Game terrain (NOT main menu)
- ✅ Expected UI elements
- ✅ Correct visual state
- ❌ Main menu = test failed

**Location**: `test/e2e/screenshots/{category}/{success|failure}/{name}.png`

## Development Process Checklists

### Bug Fix Process (TDD)

1. **Document** in `test/KNOWN_ISSUES.md` (file, behavior, root cause, priority)
2. **Write failing test** reproducing the bug
3. **Run test** (confirm failure)
4. **Fix the bug** with minimal code change
5. **Run test** (confirm pass)
6. **Run full suite** (`npm test` - no regressions)
7. **Update docs** (move to "Fixed Issues", add comments)

### New Feature Process (TDD)

1. **Design** (create doc in `docs/architecture/`, list affected systems)
2. **Write unit tests FIRST** (tests will fail)
3. **Run tests** (confirm failure)
4. **Implement feature** (minimal code to pass)
5. **Run tests** (confirm pass)
6. **Integration tests** (real system interactions)
7. **E2E tests** (browser with screenshots)
8. **Documentation** (usage examples, CHANGELOG)
9. **Full test suite** (`npm test` - all pass before commit)

### Refactoring Process

1. **Ensure coverage** (>80% for code being refactored)
2. **Refactor** (structure only, behavior unchanged)
3. **Run tests** (all must pass - behavior unchanged)
4. **Update tests** (only if public API changed)

## Testing Commands

```bash
# Unit (write FIRST for all features)
npm run test:unit
npm run test:unit:controllers
npx mocha "test/unit/path/to/file.test.js"

# Integration
npm run test:integration

# BDD (headless)
npm run test:bdd
npm run test:bdd:ants

# E2E (PRIMARY with screenshots)
npm run test:e2e
npm run test:e2e:ui
node test/e2e/ui/pw_panel_minimize.js

# All tests (CI/CD)
npm test  # unit → integration → BDD → E2E
```

## Development Workflow

### Running the Game
```bash
npm run dev  # Python server on :8000
```

### p5.js Lifecycle
1. `preload()` - Load assets via `*_Preloader()` functions
2. `setup()` - Initialize canvas, world, controllers (once)
3. `draw()` - Main loop (60fps), handles game states
4. Input handlers - `mousePressed()`, `keyPressed()`, etc.

**Load order**: Bootstrap → Rendering → Base Systems → Controllers → Game Logic

## File Organization

```
Classes/
  ants/          - Ant entities, state machine, job system
  controllers/   - Reusable behavior controllers
  managers/      - System managers (AntManager, ResourceManager, MapManager, SpatialGridManager)
  rendering/     - RenderLayerManager, EntityLayerRenderer, UILayerRenderer
  systems/       - CollisionBox2D, Button, Sprite2D
  terrainUtils/  - Terrain generation, MapManager
  pathfinding.js - A* with terrain costs
test/
  unit/          - Isolated tests (write FIRST)
  integration/   - Component interactions
  e2e/           - Puppeteer with screenshots (PRIMARY)
    ui/, camera/, controllers/, screenshots/
    puppeteer_helper.js, camera_helper.js (CRITICAL!)
  bdd/           - Behave (headless)
docs/
  guides/
    E2E_TESTING_QUICKSTART.md        - MUST READ
    TESTING_TYPES_GUIDE.md
  standards/testing/
    TESTING_METHODOLOGY_STANDARDS.md - Core philosophy
    BDD_LANGUAGE_STYLE_GUIDE.md
  FEATURE_DEVELOPMENT_CHECKLIST.md
```

## Global State

**Critical globals** (defined in sketch.js):
- `ants[]` - Global ant array (NOT antManager.ants)
- `selectables[]` - Selection entities
- `g_map2` - Active terrain map (MapManager)
- `spatialGridManager` - Spatial queries
- `draggablePanelManager` - UI panels
- `cameraManager` - Camera transforms
- `GameState` - State transitions

**JSDOM requirement**: Always sync `global` and `window`:
```javascript
global.SomeClass = MockClass;
window.SomeClass = global.SomeClass; // Required
```

## Testing Anti-Patterns (REJECT IMMEDIATELY)

**Language RED FLAGS**:
- ❌ "**REAL** function" → ✅ "function"
- ❌ "**actual** data" → ✅ "data"
- ❌ "**fake**" → ✅ Remove
- ❌ "**authentic**" → ✅ Remove

**Code RED FLAGS**:
- ❌ `expect(counter).to.equal(5)` - testing loop counters
- ❌ `expect(true).to.be.true` - placeholder tests
- ❌ `obj._privateMethod()` - testing private methods
- ❌ `antObj.jobPriority = priority` - manual injection without constructors
- ❌ `results['tests_passed'] = 17` - hardcoded results
- ❌ Non-headless browser tests

**Quality**: Use system APIs, catch real bugs, run headless, provide screenshots.

## Debug System

**Universal Debugger** (auto-integrates with all entities):

**Keyboard**:
- `` ` `` - Toggle nearest debugger
- `Shift + `` ` `` - Show all (up to 200)
- `Alt + `` ` `` - Hide all
- `Ctrl+Shift+1` - Performance overlay
- `Ctrl+Shift+2` - Entity inspector
- `Ctrl+Shift+3` - Debug console

**Console**: `demonstrateEntityDebugger()`, `setDebugLimit(50)`, `showPerformanceData()`

## Camera System

**CameraManager**: Position, zoom, input

**Transforms**:
- `screenToWorld(mouseX, mouseY)` - screen to world coords
- `worldToScreen(entityX, entityY)` - world to screen coords

## Critical Reminders

1. **TDD FIRST** - Write tests before implementation (unit → integration → E2E)
2. **Script load order matters** - Rendering before Entity, Entity before controllers
3. **System APIs only** - Never manual property injection in tests
4. **Headless only** - `--headless=new` for all browser tests
5. **Read testing docs** - TESTING_METHODOLOGY_STANDARDS.md before any test
6. **MapManager for terrain** - Never Grid.get() (Y-axis bug)
7. **E2E screenshots** - Visual proof required, not just internal state
8. **Force redraw** - Call `window.redraw()` multiple times after state changes
9. **Ensure game started** - Use `cameraHelper.ensureGameStarted()` in E2E
10. **Controllers optional** - Check availability before delegation

## Quick Reference

- **Entity API**: `Classes/containers/Entity.js`
- **Rendering**: `docs/pipelines/RENDERING_PIPELINE.md`
- **Spatial Grid**: `docs/quick-reference-spatial-grid.md`
- **MapManager**: `docs/quick-reference-mapmanager.md`
- **Testing Guide**: `docs/guides/TESTING_TYPES_GUIDE.md`
- **E2E Quickstart**: `docs/guides/E2E_TESTING_QUICKSTART.md`
- **Feature Checklist**: `docs/FEATURE_DEVELOPMENT_CHECKLIST.md`
- **Known Issues**: `test/KNOWN_ISSUES.md`
