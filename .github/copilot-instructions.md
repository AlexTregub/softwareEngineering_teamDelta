# GitHub Copilot Instructions - Ant Colony Simulation Game

## ⚠️ CRITICAL: Development Principles

**BE CONCISE**: Short, focused responses. No unnecessary explanations unless prompted.

**REUSE FIRST**: Before creating anything new:
1. **Scan codebase** - Search for existing classes/functions that do what you need
2. **Use existing tests** - Add to existing test files instead of creating new ones
3. **Use test helpers** - Add to `test/helpers/mvcTestHelpers.js` if code used >1 time
4. **Check documentation** - Review `docs/` for existing patterns and APIs

**AVOID DUPLICATION**: If you write the same code twice, extract it to a helper/utility. For UI dialogs, see `docs/guides/DIALOG_REFACTORING_STRATEGY.md` for systematic refactoring patterns.

**NO CODE IN CHECKLISTS**: Checklists should only contain task descriptions, key design decisions, and algorithms used. Tests serve as implementation documentation.

### ⚠️ CRITICAL:  Test-Driven Development (TDD)

**WE FOLLOW STRICT TDD**. Write tests FIRST, then implement.

### TDD Workflow
1. **Write failing tests FIRST** before any implementation
2. **STOP - Wait for user review/approval of tests**
3. After approval: **Write minimal code** to make tests pass
4. **Run tests** - confirm they pass
5. **Refactor** - improve code while keeping tests green
6. **Repeat** for each feature/bugfix

### Test Type Expectations

**⚠️ CRITICAL: ALWAYS use test helpers** from `test/helpers/`:
- `mvcTestHelpers.js` - For MVC pattern tests (models, views, controllers)

**All Tests**:
- ✅ Use `setupTestEnvironment()` from helpers (NO manual JSDOM/mock setup)
- ✅ Use `cleanupTestEnvironment()` in afterEach hooks
- ❌ NEVER use "real", "actual", "fake" (see BDD_LANGUAGE_STYLE_GUIDE.md)
- ❌ NEVER hardcode test results
- ❌ NEVER duplicate test setup code (use helpers!)

**Unit Tests** (write FIRST):
- ✅ Test individual functions in isolation
- ✅ Use `setupTestEnvironment()` for consistent environment
- ✅ Fast (<10ms per test)
- ✅ Target 100% coverage for new code
- ✅ Use `loadMVCBaseClasses()` to load BaseModel/BaseView/BaseController
- ❌ NEVER test loop counters or internal mechanics
- ❌ NEVER manually set up JSDOM or p5.js mocks

**Integration Tests**:
- ✅ Test component interactions with real dependencies
- ✅ Verify data flows between systems
- ✅ Use `setupTestEnvironment({ rendering: true, sprite: true })` for full setup
- ✅ Use real CollisionBox2D (included in setupTestEnvironment)
- ❌ Don't mock core systems (MapManager, SpatialGrid)
- ❌ NEVER duplicate mock definitions

**BDD Tests** (Cucumber/Selenium, PRIMARY for user workflows):
- ✅ Test user-facing behavior with real browser
- ✅ Use plain language (no technical jargon)
- ✅ Test complete user workflows (create → interact → verify)
- ✅ Selenium WebDriver for browser automation
- ✅ Run headless for CI/CD
- ✅ Screenshot verification where applicable
- ✅ Integrated into main test suite (`npm test` runs all)
- ✅ Create feature files in `test/bdd/features/`
- ✅ Create step definitions in `test/bdd/steps/`

**Example Test Setup** (MVC):
```javascript
const { setupTestEnvironment, cleanupTestEnvironment, loadMVCBaseClasses } = require('../../helpers/mvcTestHelpers');

// Minimal setup - just JSDOM, p5.js, CollisionBox2D
setupTestEnvironment();

// With rendering - adds all p5.js rendering functions
setupTestEnvironment({ rendering: true });

// Full setup - adds rendering + Sprite2D mock
setupTestEnvironment({ rendering: true, sprite: true });

describe('MyTest', function() {
  let MyClass;
  
  before(function() {
    MyClass = require('../../../Classes/MyClass');
  });
  
  afterEach(function() {
    cleanupTestEnvironment(); // Restores all Sinon stubs
  });
  
  it('should work', function() {
    // Test code
  });
});
```

## Core Architecture

### MVC Pattern (NEW - Primary Pattern for New Code)

**⚠️ CRITICAL**: All new game entities MUST use MVC pattern. Legacy Entity-Controller pattern is being phased out.

**MVC Structure**:
- **Model** (`Classes/models/`) - Data and business logic ONLY
- **View** (`Classes/views/`) - Rendering and visual presentation ONLY
- **Controller** (`Classes/controllers/mvc/`) - Coordination between model and view

**Base Classes** (inherit from these):
- `BaseModel` - Change notification system, serialization, lifecycle
- `BaseView` - Model observation, rendering abstraction
- `BaseController` - Model-view coordination, input handling

**MVC Benefits**:
- Clear separation of concerns
- Easier testing (isolated components)
- Observable pattern for automatic view updates
- Better code reusability

**Example MVC Entity**:
```javascript
// Model - Data and logic
class ResourceModel extends BaseModel {
  constructor(x, y, width, height, options) {
    super();
    this._position = { x, y };
    this._amount = options.amount || 100;
  }
  
  reduceAmount(value) {
    this._amount = Math.max(0, this._amount - value);
    this._notifyChange('amount', this._amount);
    if (this._amount === 0) this._notifyChange('depleted', true);
  }
}

// View - Rendering
class ResourceView extends BaseView {
  constructor(model, options) {
    super(model, options);
    this._sprite = new Sprite2D(options.imagePath, model.position, model.size);
  }
  
  _onModelChange(property, data) {
    if (property === 'position') this._sprite.setPosition(data);
  }
  
  _renderContent() {
    this._sprite.render();
  }
}

// Controller - Public API
class ResourceController extends BaseController {
  constructor(x, y, width, height, options) {
    const model = new ResourceModel(x, y, width, height, options);
    const view = new ResourceView(model, options);
    super(model, view, options);
  }
  
  gather(amount) { this._model.reduceAmount(amount); }
  getPosition() { return this._model.position; }
}
```

### Entity-Controller Pattern (LEGACY - Being Phased Out)

**⚠️ WARNING**: Only for maintaining existing code. Use MVC for new features.

**Entity** (`Classes/containers/Entity.js`) - Base class with optional controllers:
- `TransformController` - Position, rotation, scale
- `MovementController` - Pathfinding, movement speed
- `TaskManager` - Priority queue (EMERGENCY=0, HIGH=1, NORMAL=2, LOW=3, IDLE=4)
- `RenderController` - Visual rendering, effects
- `SelectionController` - Selection states, highlighting
- `CombatController`, `HealthController`, `InventoryController`, `TerrainController`

Controllers auto-initialize if available. Access via `entity.getController('name')` or delegate methods.

### Creating MVC Classes - TDD CHECKLIST

**⚠️ ALWAYS use test helpers** from `test/helpers/mvcTestHelpers.js`

**STEP 1: Write Model Tests FIRST**
```javascript
// test/unit/models/MyModel.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup environment (JSDOM, p5.js, CollisionBox2D)
setupTestEnvironment();

describe('MyModel', function() {
  let BaseModel, MyModel;
  
  before(function() {
    BaseModel = require('../../../Classes/models/BaseModel');
    MyModel = require('../../../Classes/models/MyModel');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  it('should extend BaseModel', function() {
    const model = new MyModel(100, 100);
    expect(model).to.be.instanceOf(BaseModel);
  });
  
  it('should notify listeners on change', function() {
    const model = new MyModel(100, 100);
    const listener = sinon.spy();
    model.addChangeListener(listener);
    
    model.setMyProperty(newValue);
    
    expect(listener.calledOnce).to.be.true;
    expect(listener.firstCall.args[0]).to.equal('myProperty');
  });
});
```

**STEP 2: Create Model Class**
```javascript
// Classes/models/MyModel.js
const BaseModel = (typeof require !== 'undefined') ? require('./BaseModel') : window.BaseModel;

class MyModel extends BaseModel {
  constructor(x, y, options = {}) {
    super();
    this._position = { x, y };
    this._myProperty = options.myProperty || defaultValue;
  }
  
  get position() { return this._position; }
  get myProperty() { return this._myProperty; }
  
  setMyProperty(value) {
    if (this._myProperty !== value) {
      this._myProperty = value;
      this._notifyChange('myProperty', value);
    }
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      position: this._position,
      myProperty: this._myProperty
    };
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = MyModel;
if (typeof window !== 'undefined') window.MyModel = MyModel;
```

**STEP 3: Write View Tests**
```javascript
// test/integration/views/MyView.integration.test.js
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup with rendering and sprite support
setupTestEnvironment({ rendering: true, sprite: true });

describe('MyView', function() {
  let MyModel, MyView;
  
  before(function() {
    MyModel = require('../../../Classes/models/MyModel');
    MyView = require('../../../Classes/views/MyView');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  it('should update on model change', function() {
    const model = new MyModel(100, 100);
    const view = new MyView(model);
    
    model.setMyProperty(newValue);
    
    // Assert view reacted to change
    expect(view.renderCalled).to.be.true;
  });
});
```

**STEP 4: Create View Class**
```javascript
// Classes/views/MyView.js
const BaseView = (typeof require !== 'undefined') ? require('./BaseView') : window.BaseView;

class MyView extends BaseView {
  constructor(model, options = {}) {
    super(model, options);
    this._sprite = new Sprite2D(options.imagePath, model.position, model.size);
  }
  
  _onModelChange(property, data) {
    if (property === 'position') {
      this._sprite.setPosition(data);
    }
  }
  
  _renderContent() {
    if (this._sprite) {
      this._sprite.render();
    }
  }
  
  destroy() {
    this._sprite = null;
    super.destroy();
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = MyView;
if (typeof window !== 'undefined') window.MyView = MyView;
```

**STEP 5: Write Controller Tests**
```javascript
// test/unit/controllers/MyController.test.js
const { setupTestEnvironment, cleanupTestEnvironment, loadMVCBaseClasses } = require('../../helpers/mvcTestHelpers');

setupTestEnvironment({ rendering: true, sprite: true });

describe('MyController', function() {
  let MyModel, MyView, MyController;
  
  before(function() {
    MyModel = require('../../../Classes/models/MyModel');
    MyView = require('../../../Classes/views/MyView');
    MyController = require('../../../Classes/controllers/mvc/MyController');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  it('should coordinate model and view', function() {
    const controller = new MyController(100, 100, { myProperty: initialValue });
    
    controller.setMyProperty(newValue);
    
    expect(controller.model.myProperty).to.equal(newValue);
  });
});
```

**STEP 6: Create Controller Class**
```javascript
// Classes/controllers/mvc/MyController.js
const BaseController = (typeof require !== 'undefined') ? require('./BaseController') : window.BaseController;
const MyModel = (typeof require !== 'undefined') ? require('../../models/MyModel') : window.MyModel;
const MyView = (typeof require !== 'undefined') ? require('../../views/MyView') : window.MyView;

class MyController extends BaseController {
  constructor(x, y, options = {}) {
    const model = new MyModel(x, y, options);
    const view = new MyView(model, options);
    super(model, view, options);
  }
  
  // Public API methods (delegate to model)
  getPosition() { return this._model.position; }
  getMyProperty() { return this._model.myProperty; }
  setMyProperty(value) { this._model.setMyProperty(value); }
  
  // Input handling (override from BaseController)
  handleInput(type, data) {
    if (type === 'click') {
      this._model.setSelected(true);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = MyController;
if (typeof window !== 'undefined') window.MyController = MyController;
```

**STEP 7: Add to index.html**
```html
<!-- MVC Base Classes (load first) -->
<script src="Classes/models/BaseModel.js"></script>
<script src="Classes/views/BaseView.js"></script>
<script src="Classes/controllers/mvc/BaseController.js"></script>

<!-- Your MVC Classes -->
<script src="Classes/models/MyModel.js"></script>
<script src="Classes/views/MyView.js"></script>
<script src="Classes/controllers/mvc/MyController.js"></script>
```

**STEP 8: Run All Tests**
```bash
npx mocha "test/unit/models/MyModel.test.js" "test/integration/views/MyView.integration.test.js" "test/unit/controllers/MyController.test.js"
```

**STEP 9: BDD Tests (Cucumber/Selenium)**
```gherkin
# test/bdd/features/my_feature.feature
Feature: My Feature
  As a player
  I want to interact with MyEntity
  So that I can achieve game goals

Scenario: Player clicks on entity
  Given the game is loaded
  And a MyEntity exists at position (100, 100)
  When I click on the entity
  Then the entity should be selected
  And the entity property should change
```

### Creating Legacy Entity Controllers - TDD CHECKLIST

**⚠️ WARNING**: Only use for maintaining existing Entity-based code. Prefer MVC pattern above.

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
3. E2E tests with visual pheromone trails (screenshots)
4. Add PheromoneController to Entity
5. Register in EFFECTS rendering layer

## BDD Testing with Cucumber/Selenium

**Structure**: Feature files (`test/bdd/features/`) + Step definitions (`test/bdd/steps/`)

**Creating BDD Tests**:

1. **Write Feature File** (Gherkin - plain language):
```gherkin
# test/bdd/features/my_feature.feature
Feature: My Feature
  As a player
  I want to do something
  So that I achieve a goal

@my-feature @core
Scenario: Player performs action
  Given the game is loaded on localhost:8000
  And the game has started
  When I create an entity at position (100, 100)
  Then the entity should exist
  And the entity should have correct properties
```

2. **Write Step Definitions** (Selenium WebDriver):
```javascript
// test/bdd/steps/my_feature_steps.js
const { Given, When, Then } = require('@cucumber/cucumber');
const { Builder } = require('selenium-webdriver');

Given('the game is loaded on localhost:8000', async function() {
  await driver.get('http://localhost:8000');
  await driver.sleep(2000);
});

When('I create an entity at position \\({int}, {int})', async function(x, y) {
  await driver.executeScript((posX, posY) => {
    window.testEntity = new Entity(posX, posY);
  }, x, y);
});

Then('the entity should exist', async function() {
  const exists = await driver.executeScript(() => {
    return window.testEntity !== undefined;
  });
  assert.strictEqual(exists, true);
});
```

3. **Run Tests**:
```bash
npm test  # Integrated into main suite
# OR
npm run test:bdd:my-feature  # Individual run
```

**Key Principles**:
- ✅ Plain language scenarios (no technical jargon)
- ✅ Real browser automation (headless Chrome)
- ✅ Test complete workflows (create → interact → verify)
- ✅ Screenshot capture for visual verification
- ✅ Integrated into `npm test` (automatic execution)

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
- `docs/checklists/templates/BUG_FIX_CHECKLIST.md` - Bug fixes (TDD with regression tests)
- `docs/checklists/templates/FEATURE_ENHANCEMENT_CHECKLIST.md` - New features <8 hours (TDD phases)
- `docs/checklists/templates/FEATURE_DEVELOPMENT_CHECKLIST.md` - Full development lifecycle >8 hours

### Bug Fix Process (TDD)

**Use checklist**: `docs/checklists/templates/BUG_FIX_CHECKLIST.md`

**CRITICAL**: Only add bugs to KNOWN_ISSUES.md AFTER feature is fully implemented (passed integration/BDD testing). Bugs found during development stay in active feature checklist.

1. **Document** in `KNOWN_ISSUES.md` (file, behavior, root cause, priority)
2. **Write failing test** reproducing the bug
3. **STOP - Wait for user review/approval of tests**
4. After approval: **Fix the bug** with minimal code change
5. **Run test** (confirm pass)
6. **Run full suite** (`npm test` - no regressions)
7. **Update docs** (move to "Fixed" section in KNOWN_ISSUES.md, add comments in code, update CHANGELOG.md)

### New Feature Process (TDD + Roadmap)

**MANDATORY**: Create a roadmap document for features requiring >8 hours work

1. **Create Roadmap** in `docs/roadmaps/[FEATURE_NAME]_ROADMAP.md`
   - Break feature into phases
   - Add checklists for each phase (TDD: unit → integration → BDD)
   - List deliverables, files affected, documentation needs
   - Estimate time per phase
   
2. **Write unit tests FIRST** (tests will fail)
3. **Run tests** (confirm failure)
4. **Implement feature** (minimal code to pass)
5. **Run tests** (confirm pass)
6. **Integration tests** (real system interactions)
7. **BDD tests** (Cucumber/Selenium scenarios)
8. **Update roadmap** (mark phases complete, update existing doc)
9. **Update docs** (usage examples, architecture docs)
10. **Update CHANGELOG.md**:
    - Add to [Unreleased] section
    - User-facing changes in "User-Facing Changes" section
    - Developer-facing changes (refactorings, API changes, breaking changes) in "Developer-Facing Changes" section
    - Include function names, new workflows, breaking changes, migration guides
11. **Full test suite** (`npm test` - all pass before commit)

**Roadmap Template Structure**:
```markdown
# [Feature Name] Roadmap

## Overview
Brief description, goals, affected systems

## Phases

### Phase 1: Core Implementation
- [ ] Write unit tests (TDD)
- [ ] Implement core class
- [ ] Run tests (pass)
**Deliverables**: [List files created/modified]

### Phase 2: Integration
- [ ] Write integration tests
- [ ] Connect to existing systems
- [ ] Run tests (pass)
**Deliverables**: [List files]

### Phase 3: BDD & Documentation
- [ ] Write BDD scenarios with Cucumber/Selenium
- [ ] Create API reference
- [ ] Update architecture docs
**Deliverables**: [List docs]

## Testing Strategy
Unit → Integration → BDD breakdown

## Documentation Updates
- [ ] API reference
- [ ] Architecture docs
- [ ] Usage examples
```

**Example**: See `docs/roadmaps/RANDOM_EVENTS_ROADMAP.md` (EventManager implementation)

**CRITICAL: Checklist Requirements**:
When creating feature checklists (enhancement or development), **ALWAYS include**:
1. **User Stories** section (in Overview) - Write clear user stories in "As a [user], I want to [action] so that [benefit]" format
2. **Key Design Decisions** section - Document core algorithmic choices, trade-offs, architectural patterns
3. **Implementation Notes** section - Include code snippets showing algorithms, data structures, performance considerations
4. **Examples**: See `ENTITY_PAINTING_TOOLBAR_ENHANCEMENTS.md` for reference implementation

These sections provide:
- Clear understanding of WHO benefits and WHY (user stories)
- Clear understanding of WHY decisions were made (design decisions)
- Reference algorithms for implementation
- Context for future maintenance
- Learning material for team members

**User Story Format**:
```markdown
**User Stories**:
1. As a [role], I want to [action] so I can [benefit]
2. As a [role], I want to [action] so I can [benefit]
3. As a [role], I want to [action] so I can [benefit]
```

### Refactoring Process

**Reference Guide**: See `docs/guides/DIALOG_REFACTORING_STRATEGY.md` for comprehensive refactoring methodology with examples.

**Core Principle**: "Push Common Patterns Up" - If you see the same code in 2+ classes, move it to parent class.

**TDD Workflow**:
1. **Ensure coverage** (>80% for code being refactored)
2. **Write tests for parent method FIRST** (tests will fail)
3. **Implement parent method** (tests now pass)
4. **Refactor child classes** to use parent method
5. **Run all tests** (behavior unchanged)
6. **BDD verification** (user workflows unchanged)
7. **Clean JSDoc** - Remove refactoring commentary, keep brief professional docs

**Key Patterns** (see strategy guide for details):
- Hover state management (eliminate coordinate conversion duplication)
- Continuous rendering for animations (cursor blink, etc.)
- Text rendering helpers (instructions, hints, validation)
- Component creation with spread operator (eliminate construction duplication)
- Canvas dimension helpers (eliminate unnecessary guards)
- Professional JSDoc cleanup (remove "REFACTORED" tags, implementation explanations)

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

# BDD (Cucumber/Selenium)
npm run test:bdd:resources
npm run test:bdd:resources:core
npm run test:bdd:resources:api

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

## Level JSON File System

**⚠️ CRITICAL**: Level data must be stored in **ONE JSON file** containing both terrain and entities.

**Grid Coordinate System**:
- Entity positions stored as **grid coordinates** (tile-based), NOT world pixel coordinates
- Convert grid → world when loading: `worldX = gridX * TILE_SIZE`, `worldY = gridY * TILE_SIZE`
- Convert world → grid when saving: `gridX = Math.floor(worldX / TILE_SIZE)`, `gridY = Math.floor(worldY / TILE_SIZE)`

**Level JSON Structure**:
```json
{
  "id": "level_001",
  "terrain": { ... },
  "entities": [
    {
      "id": "entity_001",
      "type": "Ant",
      "gridPosition": { "x": 10, "y": 15 },
      "properties": { "JobName": "Worker", "faction": "player" }
    }
  ]
}
```

**Parsing & Loading Algorithm**:
1. Read single JSON file
2. Parse terrain data → recreate terrain
3. Parse entities array → for each entity:
   - Extract grid coordinates
   - Convert to world coordinates
   - Determine entity type (Ant, Resource, Building)
   - Call appropriate constructor
   - Add to game world

## Documentation Standards

### Update, Don't Create

**ALWAYS update existing documentation** instead of creating new summary files.

**Correct approach**:
- Update existing `docs/roadmaps/[FEATURE]_ROADMAP.md` with progress
- Update `docs/api/[System]_API_Reference.md` with new methods
- Update `docs/LEVEL_EDITOR_SETUP.md` with new features
- Update `KNOWN_ISSUES.md` when fixing bugs (move to "Fixed" section, then archive after 2 weeks)
- Update `CHANGELOG.md` with user-facing and developer-facing changes (separate sections)
- Update `FEATURE_REQUESTS.md` with feature requests and optimization opportunities

**WRONG approach** (DO NOT DO THIS):
- Creating `FEATURE_COMPLETE_SUMMARY.md` (update roadmap instead)
- Creating `BUG_FIX_REPORT.md` (update KNOWN_ISSUES.md instead)
- Creating `TEST_RESULTS_[DATE].md` (update test docs instead)
- Creating duplicate documentation (confuses maintainers)

**Exception**: Only create NEW documentation for:
- New major features (architecture docs, API references)
- New subsystems (quick reference guides)
- Entirely new processes (testing guides, checklists)

### KNOWN_ISSUES.md Workflow

**Purpose**: Track bugs and technical debt discovered AFTER feature fully implemented (passed integration/E2E testing).

**What to track**:
- ✅ Bugs found by users
- ✅ Bugs found during internal testing (AFTER feature complete)
- ✅ Technical debt items
- ❌ Feature requests (use `FEATURE_REQUESTS.md` instead)
- ❌ Performance optimizations (use `FEATURE_REQUESTS.md` instead)
- ❌ Bugs found during feature development (keep in active feature checklist)

**Workflow**:
1. **Add new bug** to "Open" section (AFTER integration/E2E testing passes)
2. **Move to "Fixed"** section when bug resolved (include fix date)
3. **Archive after 2 weeks**: Move from "Fixed" to `KNOWN_ISSUES_ARCHIVE.md` (2 weeks after fix date)

**Format**:
```markdown
### Open ❌

- [ ] **Bug Title**
  - File: `path/to/file.js` (method/line if known)
  - Issue: Brief description of observed behavior
  - Priority: CRITICAL/HIGH/MEDIUM/LOW
  - Expected: What should happen
  - Current: What actually happens
  - Root Cause: Technical explanation (if known)

### Fixed ✅

- [x] **Bug Title**
  - File: `path/to/file.js`
  - Issue: Brief description
  - Priority: CRITICAL/HIGH/MEDIUM/LOW
  - Root Cause: Technical explanation
  - Fix: What changed and why
  - Fixed: October 28, 2025
```

**Open section goes FIRST** (above Fixed section) for visibility.

### CHANGELOG.md Workflow

**Purpose**: Track unreleased changes for user-facing and developer-facing audiences.

**What to track**:
- ✅ User-facing features (new functionality, UI changes)
- ✅ User-facing bug fixes (what was broken, how it's fixed)
- ✅ Developer-facing changes (refactorings, API changes, breaking changes)
- ✅ Migration guides for breaking changes
- ❌ Test counts or test-related information
- ❌ Semantic versioning (manual release process)
- ❌ Internal refactorings not affecting APIs

**Workflow**:
1. **Add to [Unreleased]** section immediately when feature/fix merged
2. **Separate sections**:
   - "BREAKING CHANGES" (top of section, if any)
   - "User-Facing Changes" (Added/Fixed/Changed)
   - "Developer-Facing Changes" (Added/Refactored)
   - "Migration Guides" (if breaking changes exist)
3. **Version sections created manually** during release process (not automatic)

**Format**:
```markdown
## [Unreleased]

### BREAKING CHANGES

- Brief description of breaking change
- Migration path

---

### User-Facing Changes

#### Added
- Feature name: Brief description, key capabilities

#### Fixed
- Bug name: Root cause, fix description

#### Changed
- Change description

---

### Developer-Facing Changes

#### Added
- New API/method: Purpose, usage

#### Refactored
- **FunctionName()**: Description of refactoring
  - Functions changed: `method1()`, `method2()`
  - New workflow: How it works now
  - Breaking: If API changed, migration notes

---

## Migration Guides

### Feature Name
Migration instructions with code examples
```

**CHANGELOG.md and KNOWN_ISSUES.md are independent** - no cross-references needed.

### API Reference Documentation

**Standard format** for all API reference docs (based on Godot Engine documentation):

**Required sections**:
1. **Header**: Class name, Inherits line, File path, brief description
2. **Description**: Comprehensive overview, key concepts, integration notes
3. **Tutorials**: Links to related guides/roadmaps
4. **Properties Table**: Expanded format with backticks
5. **Methods Table**: Expanded format with backticks
6. **Enumerations**: Constants and their values (if applicable)
7. **Property Descriptions**: Detailed explanations
8. **Method Descriptions**: Anchor links, type hints, code examples
9. **Best Practices**: Usage guidelines (if applicable)
10. **Common Workflows**: Practical multi-step examples
11. **Notes**: Important facts
12. **Related Docs**: Links at bottom

**Properties Table Format** (Option C - Expanded with backticks):
```markdown
## Properties

| Type     | Property       | Default         | Description                              |
|----------|----------------|-----------------|------------------------------------------|
| `Map`    | `events`       | `new Map()`     | Registered events by ID                  |
| `Array`  | `activeEvents` | `[]`            | Currently active events                  |
| `bool`   | `_enabled`     | `true`          | Whether processing is enabled            |
```

**Methods Table Format** (Expanded with backticks):
```markdown
## Methods

| Returns        | Method                                                                                    |
|----------------|-------------------------------------------------------------------------------------------|
| `void`         | registerEvent ( eventConfig: `Object` )                                                  |
| `bool`         | triggerEvent ( eventId: `String`, customData: `Object` = null )                         |
| `Object`       | getEvent ( eventId: `String` ) const                                                     |
| `EventManager` | getInstance ( ) static                                                                   |
```

**Method Description Format**:
```markdown
### <span id="methodname"></span>ReturnType **methodName** ( param1: Type, param2: Type = default )

Brief description of what the method does.

[Code example showing usage]

**Parameters:**
- `param1` (Type, **required**): Description
- `param2` (Type, optional): Description (default: value)

Returns ReturnType. Additional return details.

**Note:** Important usage notes or warnings.

---
```

**Key formatting rules**:
- ✅ Use backticks around all types (`String`, `Object`, `Array`, `bool`, `int`, `Variant`)
- ✅ Expanded table columns for readability
- ✅ Anchor links for all methods (`<span id="methodname"></span>`)
- ✅ Type hints in method signatures (param: `Type`)
- ✅ Include `const` and `static` keywords where applicable
- ✅ Code examples for every method
- ✅ Common Workflows section with practical multi-step examples
- ❌ NO scene tree references (we don't use scene trees)
- ❌ NO table of contents (redundant with Methods table)
- ❌ NO "Quick Reference" or "Complete Method Reference" sections (redundant)

**Example API reference**: `docs/api/EventManager_API_Reference_NEW.md`

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

## Test Helpers Reference

### MVC Test Helpers (`test/helpers/mvcTestHelpers.js`)

**Core Functions**:
```javascript
// Complete setup (one call does it all)
setupTestEnvironment({ rendering: true, sprite: true });

// Options:
// - rendering: true/false - Include p5.js rendering functions
// - sprite: true/false - Include Sprite2D mock

// Cleanup after each test
cleanupTestEnvironment(); // Restores all Sinon stubs

// Load MVC base classes
const { BaseModel, BaseView, BaseController } = loadMVCBaseClasses();

// Test utilities
const TestModel = createTestModel(BaseModel);
const TestView = createTestView(BaseView);
const pointer = createMockPointer(x, y, pressed);
assertChangeListenerCalled(spy, 'property', data);
```

**What setupTestEnvironment() provides**:
- JSDOM environment (window, document)
- p5.js globals (createVector)
- CollisionBox2D (real implementation)
- Optional: p5.js rendering functions (push, pop, fill, etc.)
- Optional: Sprite2D mock class

**Benefits**:
- Single source of truth for test setup
- No duplicate boilerplate
- Easy to extend with new mocks
- Consistent across all MVC tests

### UI Test Helpers (`test/helpers/uiTestHelpers.js`)

For UI components (dialogs, panels, buttons).

## Critical Reminders

1. **TDD ALWAYS** - Write tests before implementation (unit → integration → BDD)
2. **USE TEST HELPERS** - `mvcTestHelpers.js` for MVC, `uiTestHelpers.js` for UI
3. **MVC PATTERN** - All new entities use Model-View-Controller (Controllers in `Classes/controllers/mvc/`)
4. **USE CHECKLISTS** - Follow templates in `docs/checklists/templates/` for all features/bugs
5. **CREATE ROADMAPS** - Document phases for features >8 hours work
6. **UPDATE DOCS** - Modify existing docs, don't create new summaries
7. **Script load order matters** - BaseModel/BaseView/BaseController before entity-specific classes
8. **System APIs only** - Never manual property injection in tests
9. **Read testing docs** - TESTING_METHODOLOGY_STANDARDS.md before any test
10. **MapManager for terrain** - Never Grid.get() (Y-axis bug)
11. **BDD for user workflows** - Cucumber/Selenium, headless, plain language
12. **Controllers optional** - Check availability before delegation
13. **No emoji decoration** - Use only for visual clarity (checkmarks, warnings)
14. **KNOWN_ISSUES timing** - Only add bugs AFTER feature fully implemented (post-integration/BDD)
15. **Archive old fixes** - Move to KNOWN_ISSUES_ARCHIVE.md 2 weeks after fix

## Quick Reference

**Core APIs**:
- **Entity API**: `Classes/containers/Entity.js`
- **EventManager API**: `docs/api/EventManager_API_Reference_NEW.md`
- **Rendering**: `docs/pipelines/RENDERING_PIPELINE.md`
- **Spatial Grid**: `docs/quick-reference-spatial-grid.md`
- **MapManager**: `docs/quick-reference-mapmanager.md`

**Testing & Development**:
- **Testing Guide**: `docs/guides/TESTING_TYPES_GUIDE.md`
- **MVC Test Helpers**: `test/helpers/mvcTestHelpers.js` - Reusable MVC test utilities
- **UI Test Helpers**: `test/helpers/uiTestHelpers.js` - Reusable UI test utilities
- **Feature Enhancement Checklist**: `docs/checklists/templates/FEATURE_ENHANCEMENT_CHECKLIST.md`
- **Feature Development Checklist**: `docs/checklists/templates/FEATURE_DEVELOPMENT_CHECKLIST.md`
- **Bug Fix Checklist**: `docs/checklists/templates/BUG_FIX_CHECKLIST.md`
- **Known Issues**: `KNOWN_ISSUES.md`
- **Feature Requests**: `FEATURE_REQUESTS.md`
- **Changelog**: `CHANGELOG.md`

**MVC Pattern (Current Focus)**:
- **MVC Refactoring Example**: `docs/guides/MVC_REFACTORING_EXAMPLE.md`
- **MVC Refactoring Roadmap**: `docs/roadmaps/MVC_REFACTORING_ROADMAP.md`
- **Base Classes**: `Classes/models/BaseModel.js`, `Classes/views/BaseView.js`, `Classes/controllers/mvc/BaseController.js`
- **Example Implementation**: ResourceModel, ResourceView, ResourceController (Phase 1 in progress)

**Current Work**:
- **Level Editor Setup**: `docs/LEVEL_EDITOR_SETUP.md`
- **Random Events Roadmap**: `docs/roadmaps/RANDOM_EVENTS_ROADMAP.md` (Phase 3A complete)
- **MVC Refactoring**: Phase 1 - Resources (Model/View complete, Controller in progress)
