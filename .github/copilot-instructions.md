# GitHub Copilot Instructions - Ant Colony Simulation Game

## ⚠️ CRITICAL: Development Principles

**BE CONCISE**: Short, focused responses. No unnecessary explanations.

**REUSE FIRST**: Before creating anything new:
1. **Scan codebase** - Search for existing classes/functions that do what you need
2. **Use existing tests** - Add to existing test files instead of creating new ones
3. **Use test helpers** - Add to `test/helpers/uiTestHelpers.js` if code used >1 time
4. **Check documentation** - Review `docs/` for existing patterns and APIs

**AVOID DUPLICATION**: If you write the same code twice, extract it to a helper/utility.

### ⚠️ CRITICAL:  Test-Driven Development (TDD)

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

**BDD Tests** (Python Behave, PRIMARY for user-facing features):
- ✅ Test user-facing behavior in real browser (headless)
- ✅ Use plain language (no technical jargon)
- ✅ Verify complete workflows and user stories
- ✅ Test game state transitions and interactions
- ❌ NEVER use "real", "actual", "fake" (see BDD_LANGUAGE_STYLE_GUIDE.md)
- ❌ NEVER hardcode test results
- ❌ NEVER skip browser automation setup

**E2E Tests** (DEPRECATED - Use BDD instead):
- ❌ DO NOT write new E2E tests with Puppeteer
- ✅ Use BDD tests for browser-based testing
- ✅ Migrate existing E2E tests to BDD when touching them

## Core Architecture

### ⚠️ MANDATORY: MVC Pattern for ALL Features

**ALL NEW CODE MUST FOLLOW STRICT MVC SEPARATION**

**Why MVC?**
- ✅ **Testability**: Each layer tested independently (100% coverage achievable)
- ✅ **Maintainability**: Clear separation prevents tangled dependencies
- ✅ **Reusability**: Models/Views can be composed differently
- ✅ **Debugging**: Isolate issues to specific layer (data vs display vs logic)
- ✅ **Scalability**: Add features without breaking existing code

**When to use MVC:**
- ✅ ALL new game entities (ants, resources, buildings, enemies)
- ✅ ALL new UI components (panels, buttons, overlays)
- ✅ ALL new game systems (inventory, crafting, quests)
- ✅ ALL new visual effects (particles, animations, highlights)
- ❌ ONLY skip for: Simple utility functions, pure math helpers, one-line delegates

**Model (Data Layer)** - `Classes/mvc/models/`
- ✅ Store state ONLY (position, size, type, properties)
- ✅ Provide getters/setters for data access
- ✅ Return copies to prevent external mutation
- ❌ NO rendering logic
- ❌ NO update/game loop logic
- ❌ NO external system calls (no MapManager, no EffectsRenderer)
- ❌ NO business logic (orchestration)

**View (Presentation Layer)** - `Classes/mvc/views/`
- ✅ Render sprites, effects, highlights
- ✅ Read from model (NEVER modify)
- ✅ Handle visual transformations
- ❌ NO state mutations
- ❌ NO update methods
- ❌ NO controller logic
- ❌ NO data storage

**Controller (Orchestration Layer)** - `Classes/mvc/controllers/`
- ✅ Coordinate model + view
- ✅ Manage sub-controllers (movement, selection, combat)
- ✅ Handle game loop updates
- ✅ System integration (spatial grid, MapManager, EffectsRenderer)
- ❌ NO rendering (delegate to view)
- ❌ NO direct data storage (delegate to model)
- ❌ NO drawing methods (push, pop, rect, ellipse)

**Factory (Creation Pattern)** - `Classes/mvc/factories/`
- ✅ Create complete MVC triads
- ✅ Handle configuration/defaults
- ✅ Batch operations (createMultiple, createGrid, createCircle)

### MVC Integration Example

```javascript
// ✅ CORRECT: Strict MVC separation
const model = new EntityModel({ x: 100, y: 100, width: 32, height: 32, imagePath: 'ant.png' });
const view = new EntityView(model);
const controller = new EntityController(model, view);

// Controller orchestrates
controller.moveToLocation(200, 200);
controller.setSelected(true);
controller.getCurrentTerrain(); // Queries MapManager
controller.effects.damageNumber(10); // Delegates to EffectsRenderer
controller.highlight.spinning(); // Delegates to view

// View renders (no state changes)
view.render();
view.highlightSelected();

// Model stores data (no logic)
model.setPosition(200, 200);
model.getPosition(); // Returns copy
```

### Common MVC Violations (DO NOT DO)

**❌ WRONG: Model with logic**
```javascript
class BadModel {
  update() { // Models should NOT have update logic
    this.position.x += this.velocity.x;
  }
  render() { // Models should NEVER render
    rect(this.position.x, this.position.y, 32, 32);
  }
}
```

**✅ CORRECT: Pure data model**
```javascript
class GoodModel {
  getPosition() { return { x: this.position.x, y: this.position.y }; }
  setPosition(x, y) { this.position.x = x; this.position.y = y; }
  // Data only, no logic
}
```

**❌ WRONG: View mutating state**
```javascript
class BadView {
  render() {
    this.model.position.x += 5; // NEVER modify model in view
    rect(this.model.position.x, this.model.position.y, 32, 32);
  }
}
```

**✅ CORRECT: Read-only view**
```javascript
class GoodView {
  render() {
    const pos = this.model.getPosition(); // Read only
    rect(pos.x, pos.y, 32, 32);
  }
}
```

**❌ WRONG: Controller with rendering**
```javascript
class BadController {
  render() { // Controllers should NOT render
    push();
    rect(this.model.getX(), this.model.getY(), 32, 32);
    pop();
  }
}
```

**✅ CORRECT: Controller orchestrates**
```javascript
class GoodController {
  update() {
    // Orchestrate systems
    this._updateMovement();
    this._checkCollisions();
  }
  
  render() {
    this.view.render(); // Delegate to view
  }
}
```

**❌ WRONG: Direct data storage in controller**
```javascript
class BadController {
  constructor(model, view) {
    this.position = { x: 0, y: 0 }; // Don't store data
    this.size = { x: 32, y: 32 }; // Use model instead
  }
}
```

**✅ CORRECT: Controller delegates to model**
```javascript
class GoodController {
  constructor(model, view) {
    this.model = model; // Reference to model
    this.view = view;   // Reference to view
  }
  
  getPosition() {
    return this.model.getPosition(); // Delegate to model
  }
}
```

### Legacy Entity-Controller Pattern (DEPRECATED)

**Entity** (`Classes/containers/Entity.js`) - ONLY use for backward compatibility:
- Legacy system with controllers
- NEW features MUST use MVC pattern above
- DO NOT extend Entity for new features

### Creating New MVC Components - TDD CHECKLIST

**STEP 1: Write Model Tests FIRST**
```javascript
// test/unit/mvc/MyFeatureModel.test.js
describe('MyFeatureModel', function() {
  it('should store data only (no logic)', function() {
    const model = new MyFeatureModel({ x: 100, y: 200 });
    expect(model.getPosition()).to.deep.equal({ x: 100, y: 200 });
  });
  
  it('should NOT have render methods', function() {
    const model = new MyFeatureModel();
    expect(model.render).to.be.undefined;
  });
});
```

**STEP 2: Implement Model**
```javascript
// Classes/mvc/models/MyFeatureModel.js
class MyFeatureModel {
  constructor(options = {}) {
    this.position = { x: options.x || 0, y: options.y || 0 };
    // Data storage ONLY
  }
  
  getPosition() { return { x: this.position.x, y: this.position.y }; }
  setPosition(x, y) { this.position.x = x; this.position.y = y; }
}
```

**STEP 3: Write View Tests**
```javascript
// test/unit/mvc/MyFeatureView.test.js
describe('MyFeatureView', function() {
  it('should render without modifying model', function() {
    const model = new MyFeatureModel({ x: 100, y: 100 });
    const view = new MyFeatureView(model);
    
    view.render();
    
    expect(model.getPosition()).to.deep.equal({ x: 100, y: 100 });
  });
});
```

**STEP 4: Implement View**
```javascript
// Classes/mvc/views/MyFeatureView.js
class MyFeatureView {
  constructor(model) {
    this.model = model;
  }
  
  render() {
    const pos = this.model.getPosition(); // Read only
    push();
    rect(pos.x, pos.y, 32, 32);
    pop();
  }
}
```

**STEP 5: Write Controller Tests**
```javascript
// test/unit/mvc/MyFeatureController.test.js
describe('MyFeatureController', function() {
  it('should orchestrate model and view', function() {
    const model = new MyFeatureModel();
    const view = new MyFeatureView(model);
    const controller = new MyFeatureController(model, view);
    
    controller.moveTo(200, 300);
    expect(model.getPosition()).to.deep.equal({ x: 200, y: 300 });
  });
  
  it('should NOT have render methods', function() {
    expect(controller.render).to.be.undefined;
  });
});
```

**STEP 6: Implement Controller**
```javascript
// Classes/mvc/controllers/MyFeatureController.js
class MyFeatureController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }
  
  moveTo(x, y) {
    this.model.setPosition(x, y); // Update model
    // View reads from model automatically
  }
  
  update() {
    // Game loop orchestration
  }
}
```

**STEP 7: Create Factory**
```javascript
// Classes/mvc/factories/MyFeatureFactory.js
class MyFeatureFactory {
  static create(options = {}) {
    const model = new MyFeatureModel(options);
    const view = new MyFeatureView(model);
    const controller = new MyFeatureController(model, view);
    return { model, view, controller };
  }
}
```

**STEP 8: Integration Tests**
```javascript
// test/integration/mvc/myFeature.integration.test.js
it('should coordinate all MVC layers', function() {
  const entity = MyFeatureFactory.create({ x: 100, y: 100 });
  entity.controller.moveTo(200, 200);
  entity.view.render();
  expect(entity.model.getPosition()).to.deep.equal({ x: 200, y: 200 });
});
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

## Current Systems Status

### EventManager System (COMPLETE)
**Status**: Production-ready, fully tested
- EventManager singleton with full API (`Classes/managers/EventManager.js`)
- Event types: dialogue, spawn, tutorial, boss
- Trigger system: time, flag, spatial, conditional, viewport
- Flag-based conditions and state tracking
- JSON import/export for level design
- EventEditorPanel integration (Level Editor)
- **API Reference**: `docs/api/EventManager_API_Reference.md`

### Level Editor System (IN PROGRESS - DEBUGGING)
**Status**: Core complete, debugging visual/rendering issues
- **Complete**:
  - Terrain editing (paint, fill, eyedropper, select tools)
  - Material palette (moss, stone, dirt, grass variants)
  - TerrainEditor, TerrainExporter, TerrainImporter
  - Save/Load dialogs with LocalStorage
  - MiniMap with cache system (performance optimized)
  - EventEditorPanel for random events
  - Full test coverage (unit, integration, E2E)
- **Current Focus**: Debugging rendering issues, panel visibility
- **Documentation**: `docs/LEVEL_EDITOR_SETUP.md`

### Upcoming Systems (Design Phase)

#### Pheromone System
**TDD Plan**:
1. Write unit tests for PheromoneManager (creation, decay, diffusion)
2. Write integration tests for ant-pheromone interaction
3. BDD tests: "When ant finds food, pheromone trail appears"
4. Add PheromoneController to Entity
5. Register in EFFECTS rendering layer

## BDD Testing Critical Patterns

**MANDATORY**: See `docs/guides/BDD_LANGUAGE_STYLE_GUIDE.md`

### 1. Server Setup
```bash
npm run dev  # Must be running on localhost:8000
```

### 2. Plain Language
```gherkin
Feature: Ant rendering
  Scenario: Player starts game
    Given the game is loaded
    When the player starts a new game
    Then ants should be visible on the map
```
**NEVER use**: "real", "actual", "fake", "mock"

### 3. Browser Automation (Python + Selenium)
```python
from selenium import webdriver
from selenium.webdriver.common.by import By

@given('the game is loaded')
def step_impl(context):
    context.browser.get('http://localhost:8000')
    
@when('the player starts a new game')
def step_impl(context):
    start_button = context.browser.find_element(By.ID, 'start-button')
    start_button.click()
```

### 4. Visual Verification
```python
@then('ants should be visible on the map')
def step_impl(context):
    # Wait for game to load
    WebDriverWait(context.browser, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, 'canvas'))
    )
    
    # Verify via JavaScript
    ant_count = context.browser.execute_script(
        'return window.entityManager ? window.entityManager.getCount("ant") : 0'
    )
    assert ant_count > 0, f"Expected ants but found {ant_count}"
```

**Location**: `test/bdd/features/` and `test/bdd/steps/`

## Development Process & Checklists

**CRITICAL**: **ALWAYS use checklists** for feature development, bug fixes, and refactoring. Checklists ensure systematic, test-driven development and prevent missed steps.

### Why Checklists Matter

**Checklists enforce**:
- TDD at every phase (unit → integration → BDD)
- Systematic verification (no missed steps)
- Documentation updates (keep docs current)
- Quality gates (all tests pass before commit)
- Consistent process (reproducible outcomes)

**Available Checklists**:
- `docs/checklists/FEATURE_ENHANCEMENT_CHECKLIST.md` - New features (TDD phases)
- `docs/checklists/FEATURE_DEVELOPMENT_CHECKLIST.md` - Full development lifecycle
- Inline checklists in this document (Bug Fix, New Feature, Refactoring)

### Bug Fix Process (TDD)

1. **Document** in `test/KNOWN_ISSUES.md` (file, behavior, root cause, priority)
2. **Write failing test** reproducing the bug
3. **Run test** (confirm failure)
4. **Fix the bug** with minimal code change
5. **Run test** (confirm pass)
6. **Run full suite** (`npm test` - no regressions)
7. **Update docs** (move to "Fixed Issues", add comments in code)

### New Feature Process (TDD + Roadmap + MVC)

**MANDATORY**: Create a roadmap document for features requiring >2 hours work

**CRITICAL**: ALL NEW FEATURES MUST USE MVC PATTERN

1. **Create Roadmap** in `docs/roadmaps/[FEATURE_NAME]_ROADMAP.md`
   - Break feature into MVC phases (Model → View → Controller → Factory)
   - Add checklists for each phase (TDD: unit → integration → BDD)
   - List deliverables, files affected, documentation needs
   - Estimate time per phase
   
2. **Write unit tests FIRST** for Model (tests will fail)
3. **Run tests** (confirm failure)
4. **Implement Model** (minimal code to pass, data only)
5. **Run tests** (confirm pass)
6. **Write unit tests FIRST** for View (presentation only)
7. **Implement View** (rendering, no state mutations)
8. **Write unit tests FIRST** for Controller (orchestration)
9. **Implement Controller** (coordinates model/view/systems)
10. **Integration tests** (MVC triad working together)
11. **BDD tests** (browser automation with user-facing scenarios)
12. **Update roadmap** (mark phases complete, update existing doc)
13. **Update docs** (usage examples, CHANGELOG, architecture docs)
14. **Full test suite** (`npm test` then `npm run test:bdd` - all pass before commit)

**Roadmap Template Structure**:
```markdown
# [Feature Name] Roadmap

## Overview
Brief description, goals, affected systems

## Phases

### Phase 1: Model (Data Layer)
- [ ] Write unit tests (TDD)
- [ ] Implement model class (data storage only)
- [ ] Run tests (pass)
- [ ] Verify NO logic/rendering
**Deliverables**: [List files created/modified]

### Phase 2: View (Presentation Layer)
- [ ] Write unit tests
- [ ] Implement view class (rendering only)
- [ ] Run tests (pass)
- [ ] Verify NO state mutations
**Deliverables**: [List files]

### Phase 3: Controller (Orchestration)
- [ ] Write unit tests
- [ ] Implement controller class
- [ ] Run tests (pass)
- [ ] Verify NO rendering/data storage
**Deliverables**: [List files]

### Phase 4: Factory & Integration
- [ ] Create factory for MVC triad
- [ ] Write integration tests
- [ ] Connect to existing systems
- [ ] Run tests (pass)
**Deliverables**: [List files]

### Phase 5: BDD & Documentation
- [ ] Write BDD tests with user scenarios
- [ ] Create API reference
- [ ] Update architecture docs
**Deliverables**: [List docs]

## Testing Strategy
Unit → Integration → BDD breakdown

## MVC Compliance
- Model: Pure data, no logic
- View: Read-only, no mutations
- Controller: Orchestrates, no rendering

## Documentation Updates
- [ ] API reference
- [ ] Architecture docs
- [ ] Usage examples
```

**Example**: See `docs/roadmaps/RANDOM_EVENTS_ROADMAP.md` (EventManager implementation)

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

# BDD (PRIMARY - headless browser automation)
npm run test:bdd
npm run test:bdd:ants
python -m behave test/bdd/features/

# All tests (CI/CD)
npm test  # unit → integration
npm run test:bdd  # BDD scenarios
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
  bdd/           - Behave scenarios (PRIMARY for browser testing)
    features/    - .feature files (Gherkin)
    steps/       - Step definitions (Python)
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

## Documentation Standards

### Update, Don't Create

**ALWAYS update existing documentation** instead of creating new summary files.

**Correct approach**:
- Update existing `docs/roadmaps/[FEATURE]_ROADMAP.md` with progress
- Update `docs/api/[System]_API_Reference.md` with new methods
- Update `docs/LEVEL_EDITOR_SETUP.md` with new features
- Update `test/KNOWN_ISSUES.md` when fixing bugs
- Update `CHANGELOG.md` with user-facing changes

**WRONG approach** (DO NOT DO THIS):
- Creating `FEATURE_COMPLETE_SUMMARY.md` (update roadmap instead)
- Creating `BUG_FIX_REPORT.md` (update KNOWN_ISSUES.md instead)
- Creating `TEST_RESULTS_[DATE].md` (update test docs instead)
- Creating duplicate documentation (confuses maintainers)

**Exception**: Only create NEW documentation for:
- New major features (architecture docs, API references)
- New subsystems (quick reference guides)
- Entirely new processes (testing guides, checklists)

### Emoji Usage Policy

**Use emojis ONLY for visual clarity** in documentation, NOT in code comments.

**Allowed** (visual scanning):
- Checkmarks and X marks in checklists
- Warning symbols for critical sections
- Status indicators in roadmaps

**Examples**:
```markdown
<!-- CORRECT: Visual clarity in docs -->
- ✅ Unit tests passing
- ❌ E2E tests failing
- ⚠️ CRITICAL: Must call ensureGameStarted()

<!-- WRONG: Decorative emojis -->
- 🎨 Paint tool (use "Paint" instead)
- 🪣 Fill tool (use "Fill" instead)
- 💧 Eyedropper (use "Eyedropper" instead)
```

**Code comments**: NEVER use emojis
```javascript
// CORRECT
// CRITICAL: Must initialize before use

// WRONG
// ⚠️ CRITICAL: Must initialize before use
```

## Critical Reminders

1. **MVC ALWAYS** - ALL new features use Model-View-Controller pattern
2. **TDD ALWAYS** - Write tests before implementation (unit → integration → E2E)
3. **USE CHECKLISTS** - Follow `FEATURE_ENHANCEMENT_CHECKLIST.md` for all features
4. **CREATE ROADMAPS** - Document phases for features >2 hours work
5. **UPDATE DOCS** - Modify existing docs, don't create new summaries
6. **Script load order matters** - Rendering before Entity, Entity before controllers
7. **System APIs only** - Never manual property injection in tests
8. **Headless only** - `--headless=new` for all browser tests
9. **Read testing docs** - TESTING_METHODOLOGY_STANDARDS.md before any test
10. **MapManager for terrain** - Never Grid.get() (Y-axis bug)
11. **E2E screenshots** - Visual proof required, not just internal state
12. **Force redraw** - Call `window.redraw()` multiple times after state changes
13. **Ensure game started** - Use `cameraHelper.ensureGameStarted()` in E2E
14. **Controllers optional** - Check availability before delegation
15. **No emoji decoration** - Use only for visual clarity (checkmarks, warnings)
16. **MVC separation** - Model (data), View (render), Controller (orchestrate)

## Quick Reference

**Core APIs**:
- **Entity API**: `Classes/containers/Entity.js`
- **EventManager API**: `docs/api/EventManager_API_Reference.md`
- **Rendering**: `docs/pipelines/RENDERING_PIPELINE.md`
- **Spatial Grid**: `docs/quick-reference-spatial-grid.md`
- **MapManager**: `docs/quick-reference-mapmanager.md`

**Testing & Development**:
- **Testing Guide**: `docs/guides/TESTING_TYPES_GUIDE.md`
- **E2E Quickstart**: `docs/guides/E2E_TESTING_QUICKSTART.md`
- **Feature Enhancement Checklist**: `docs/checklists/FEATURE_ENHANCEMENT_CHECKLIST.md`
- **Feature Development Checklist**: `docs/checklists/FEATURE_DEVELOPMENT_CHECKLIST.md`
- **Known Issues**: `test/KNOWN_ISSUES.md`

**Current Work**:
- **Level Editor Setup**: `docs/LEVEL_EDITOR_SETUP.md`
- **Random Events Roadmap**: `docs/roadmaps/RANDOM_EVENTS_ROADMAP.md` (Phase 3A complete)
