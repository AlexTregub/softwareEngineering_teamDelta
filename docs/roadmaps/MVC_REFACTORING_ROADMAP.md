# MVC Refactoring Roadmap

## Overview

**Goal**: Refactor entire codebase from controller-based architecture to Model-View-Controller (MVC) pattern.

**Challenge**: Large codebase, many interdependencies, risk of breaking existing features.

**Strategy**: Incremental refactoring with **adapter pattern** for backward compatibility, strict TDD at every phase.

---

## Critical Principle: DON'T REFACTOR EVERYTHING AT ONCE

**The Wrong Approach** ❌:
- Refactor all Entity code at once
- Break the entire game
- Spend weeks debugging
- Lose track of what works

**The Right Approach** ✅:
- Refactor ONE system at a time
- Use **adapter pattern** for backward compatibility
- Keep game playable during migration
- Each phase is fully tested before moving on

---

## Phase 0: Preparation (Week 1)

### Goals
- Understand current architecture
- Identify all Entity-like classes
- Create baseline test coverage
- Set up migration infrastructure

### Tasks

#### 0.1: Map Current Architecture
- [ ] **List all Entity-based classes**
  ```bash
  # Find all classes that create/use Entity
  grep -r "new Entity" Classes/ --include="*.js"
  grep -r "extends Entity" Classes/ --include="*.js"
  ```
- [ ] **Document dependencies**
  - What classes depend on Entity?
  - What does Entity depend on?
  - Create dependency diagram
- [ ] **Identify high-risk areas**
  - Core gameplay systems (movement, combat, selection)
  - Save/load systems
  - Manager classes (AntManager, ResourceManager)

**Deliverable**: `docs/diagrams/CURRENT_ARCHITECTURE_MAP.md`

#### 0.2: Baseline Test Coverage
- [ ] **Run existing tests**
  ```bash
  npm test
  ```
- [ ] **Measure coverage**
  ```bash
  npm run test:coverage
  ```
- [ ] **Document coverage gaps**
  - Which systems have <80% coverage?
  - Priority: Core gameplay > UI > Debug tools

**Deliverable**: `docs/TEST_COVERAGE_BASELINE.md`

#### 0.3: Create MVC Base Classes ✅ COMPLETE
- [x] **Write tests for base Model class** (TDD - 23 tests)
  - Property storage
  - Change notifications
  - Serialization (toJSON/fromJSON)
- [x] **Implement BaseModel** (Classes/models/BaseModel.js - 151 lines)
  ```javascript
  // Classes/models/BaseModel.js
  class BaseModel {
    constructor() {
      this._changeListeners = [];
    }
    
    addChangeListener(callback) { ... }
    removeChangeListener(callback) { ... }
    _notifyChange(property, data) { ... }
    
    toJSON() { ... }
    static fromJSON(data) { ... }
  }
  ```
- [ ] **Write tests for base View class** (E2E)
- [ ] **Implement BaseView**
- [x] **Write tests for base View class** (23 tests)
- [x] **Implement BaseView** (Classes/views/BaseView.js - 117 lines)
- [x] **Write tests for base Controller class** (24 tests)
- [x] **Implement BaseController** (Classes/controllers/mvc/BaseController.js - 125 lines)
- [x] **Create test helpers** (test/helpers/mvcTestHelpers.js - 300+ lines)
  - setupTestEnvironment() - One call for complete test setup
  - cleanupTestEnvironment() - Automatic Sinon cleanup
  - loadMVCBaseClasses() - Load all base classes
  - Real CollisionBox2D (no mocks)
  - All 5 test files refactored to use helpers

**Deliverable**: Base classes with 100% test coverage (70 tests passing)

#### 0.4: Create Adapter Pattern Infrastructure
- [ ] **EntityAdapter** (makes MVC look like old Entity)
  ```javascript
  // Classes/adapters/EntityAdapter.js
  class EntityAdapter {
    constructor(entityController) {
      this._controller = entityController;
      
      // Proxy all Entity methods to controller
      this.setPosition = (x, y) => this._controller.setPosition(x, y);
      this.getPosition = () => this._controller.getPosition();
      this.render = () => this._controller.render();
      // ... all other Entity methods
    }
    
    // Old code can still call: entity.setPosition(x, y)
    // Adapter forwards to: controller.setPosition(x, y)
  }
  ```
- [ ] **Write adapter tests** (ensure old API still works)

**Deliverable**: Adapter pattern infrastructure with tests

**Time Estimate**: 40 hours (1 week)

---

## Phase 1: Refactor ONE Entity Type (Week 2-3)

### Goals
- Prove MVC pattern works in our codebase
- Establish refactoring workflow
- Keep game fully playable

### Strategy: Start with **simplest entity** (not most important)

**Candidates** (from simplest to most complex):
1. ✅ **Resource** (Food, Wood, Stone) - simplest, few behaviors
2. **Building** (Colony, Storage) - static, no movement
3. **Ant** (Worker, Soldier) - complex, many behaviors, state machine

**Choose Resource** - it's simple enough to learn the pattern, but real enough to validate it works.

### Tasks

#### 1.1: Write ResourceModel Tests (TDD) ✅ COMPLETE
- [x] **Unit tests for ResourceModel** (test/unit/models/ResourceModel.test.js - 29 tests)
  ```javascript
  // test/unit/models/ResourceModel.test.js
  describe('ResourceModel', function() {
    it('should store position data', function() {
      const model = new ResourceModel(100, 100, 32, 32, { type: 'Food' });
      expect(model.position.x).to.equal(100);
      expect(model.position.y).to.equal(100);
    });
    
    it('should notify listeners on position change', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      let notified = false;
      model.addChangeListener((prop, data) => {
        if (prop === 'position') notified = true;
      });
      model.setPosition(200, 200);
      expect(notified).to.be.true;
    });
    
    it('should serialize to JSON', function() {
      const model = new ResourceModel(100, 100, 32, 32, { type: 'Food' });
      const json = model.toJSON();
      expect(json.position.x).to.equal(100);
      expect(json.type).to.equal('Food');
    });
    
    it('should deserialize from JSON', function() {
      const json = { position: { x: 100, y: 100 }, type: 'Food' };
      const model = ResourceModel.fromJSON(json);
      expect(model.position.x).to.equal(100);
      expect(model.type).to.equal('Food');
    });
  });
  ```
- [ ] **Run tests** (should fail - no implementation yet)
  ```bash
  npx mocha "test/unit/models/ResourceModel.test.js"
  ```

#### 1.2: Implement ResourceModel ✅ COMPLETE
- [x] **Create ResourceModel class** (Classes/models/ResourceModel.js - 218 lines, 29 tests passing)
  ```javascript
  // Classes/models/ResourceModel.js
  class ResourceModel extends BaseModel {
    constructor(x, y, width, height, options = {}) {
      super();
      this._id = `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this._type = options.type || 'Food'; // Food, Wood, Stone
      this._position = { x, y };
      this._size = { width, height };
      this._amount = options.amount || 100;
      this._isActive = true;
    }
    
    get id() { return this._id; }
    get type() { return this._type; }
    get position() { return { ...this._position }; }
    get amount() { return this._amount; }
    
    setPosition(x, y) {
      if (this._position.x !== x || this._position.y !== y) {
        this._position.x = x;
        this._position.y = y;
        this._notifyChange('position', { x, y });
      }
    }
    
    reduceAmount(value) {
      const newAmount = Math.max(0, this._amount - value);
      if (this._amount !== newAmount) {
        this._amount = newAmount;
        this._notifyChange('amount', { amount: newAmount, delta: newAmount - this._amount });
        
        if (this._amount === 0) {
          this._isActive = false;
          this._notifyChange('depleted', { id: this._id });
        }
      }
    }
    
    toJSON() {
      return {
        id: this._id,
        type: this._type,
        position: this._position,
        size: this._size,
        amount: this._amount
      };
    }
    
    static fromJSON(data) {
      const model = new ResourceModel(
        data.position.x,
        data.position.y,
        data.size.width,
        data.size.height,
        { type: data.type, amount: data.amount }
      );
      model._id = data.id;
      return model;
    }
    
    update(deltaTime) {
      // Resources don't update (static)
    }
  }
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResourceModel;
  }
  ```
- [ ] **Run tests** (should pass)

#### 1.3: Write ResourceView Tests (Integration) ✅ COMPLETE
- [x] **Integration tests for ResourceView** (test/integration/views/ResourceView.integration.test.js - 19 tests)
  ```javascript
  // test/e2e/views/pw_resource_view.js
  const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
  const cameraHelper = require('../camera_helper');
  
  (async () => {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto('http://localhost:8000?test=1');
    
    // Ensure game started
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) throw new Error('Game failed to start');
    
    const result = await page.evaluate(() => {
      // Create model
      const model = new ResourceModel(300, 300, 32, 32, { type: 'Food' });
      
      // Create view
      const view = new ResourceView(model, { imagePath: 'Images/Resources/food.png' });
      
      // Force render
      window.gameState = 'PLAYING';
      view.render();
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      return { success: true, type: model.type };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'views/resource_view', result.success);
    await browser.close();
    process.exit(result.success ? 0 : 1);
  })();
  ```
- [ ] **Run tests** (should fail - no implementation yet)

#### 1.4: Implement ResourceView ✅ COMPLETE
- [x] **Create ResourceView class** (Classes/views/ResourceView.js - 165 lines, 19 tests passing)
  ```javascript
  // Classes/views/ResourceView.js
  class ResourceView extends BaseView {
    constructor(model, options = {}) {
      super(model);
      
      const pos = model.position;
      const size = model.size;
      
      this._sprite = null;
      if (typeof Sprite2D !== 'undefined' && options.imagePath) {
        this._sprite = new Sprite2D(
          options.imagePath,
          createVector(pos.x, pos.y),
          createVector(size.width, size.height),
          0
        );
      }
    }
    
    render() {
      if (!this._model.isActive) return;
      
      push();
      
      const pos = this._model.position;
      const size = this._model.size;
      
      if (this._sprite) {
        this._sprite.render();
      } else {
        // Placeholder
        fill(255, 200, 0);
        noStroke();
        ellipse(pos.x, pos.y, size.width, size.height);
      }
      
      pop();
    }
    
    _onModelChange(property, data, model) {
      if (property === 'position' && this._sprite) {
        this._sprite.setPosition(createVector(data.x, data.y));
      }
    }
  }
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResourceView;
  }
  ```
- [ ] **Run tests** (should pass with screenshot proof)

#### 1.5: Write ResourceController Tests (Integration) ✅ COMPLETE
- [x] **Integration tests** (test/unit/controllers/ResourceController.test.js - 45 tests)
  - Constructor tests (6): extends BaseController, creates model/view, passes parameters
  - Position API tests (5): get/set position, triggers view updates
  - Type API tests (2): returns resource type
  - Amount API tests (5): get/gather/reduce amount with bounds
  - Depletion API tests (4): isDepleted check, inactive when depleted
  - Collision API tests (6): contains point, collides with other resources
  - Update/Render tests (4): delegates to model/view, respects inactive state
  - Input handling tests (5): click detection, gathering callbacks
  - Serialization tests (4): toJSON/fromJSON with full state
  - Lifecycle tests (4): destroy cleans up model/view/references
- [x] **Run tests** (45 passing)

#### 1.6: Implement ResourceController ✅ COMPLETE
- [x] **Create ResourceController class** (Classes/controllers/mvc/ResourceController.js - 230 lines)
  ```javascript
  // Classes/controllers/ResourceController.js
  class ResourceController extends BaseController {
    constructor(x, y, width, height, options = {}) {
      const model = new ResourceModel(x, y, width, height, options);
      const view = new ResourceView(model, options);
      super(model, view);
    }
    
    // Public API
    get id() { return this._model.id; }
    get type() { return this._model.type; }
    getPosition() { return this._model.position; }
    setPosition(x, y) { this._model.setPosition(x, y); }
    getAmount() { return this._model.amount; }
    
    gather(amount) {
      this._model.reduceAmount(amount);
      return this._model.amount;
    }
    
    isDepleted() {
      return this._model.amount === 0;
    }
  }
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResourceController;
  }
  ```
- [ ] **Run tests** (should pass)

#### 1.7: Clean Integration - NO ADAPTER! ✨
**Decision**: Skip adapter pattern - do clean refactoring instead!

**Why Clean Refactoring?**
- ✅ Consistent API everywhere (getPosition, getType, etc.)
- ✅ No wrapper/adapter complexity
- ✅ Better long-term maintainability
- ✅ Learning experience for team
- ✅ Sets precedent for Ants/Buildings migration

**What We're Changing**:
1. Resource class → Use ResourceController directly
2. ResourceSystemManager → Work with ResourceController API
3. ResourceManager (ant inventory) → Use ResourceController methods
4. ResourceSpawner → Spawn ResourceController instances
5. UI Components → Use consistent getType(), getPosition() API

**Expectations**:
- 🎯 **Game stays playable** at every step
- 🎯 **Test-driven** - write tests first, then change
- 🎯 **Incremental** - one system at a time
- 🎯 **Verify often** - run game + tests after each change
- 🎯 **Time estimate**: 4-6 hours total

---

#### 1.7a: Update ResourceSystemManager (Global Resource Registry)
**Goal**: Make global resource system work with ResourceController

- [ ] **Write tests for ResourceSystemManager** (TDD)
  ```javascript
  // test/integration/systems/ResourceSystemManager.test.js
  describe('ResourceSystemManager with ResourceController', function() {
    it('should add ResourceController to system', function() {
      const system = new ResourceSystemManager();
      const resource = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      
      system.addResource(resource);
      
      expect(system.getResourceList().length).to.equal(1);
      expect(system.getResourceList()[0]).to.equal(resource);
    });
    
    it('should get resources by type using getType()', function() {
      const system = new ResourceSystemManager();
      const food = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      const wood = new ResourceController(200, 200, 32, 32, { type: 'Wood' });
      
      system.addResource(food);
      system.addResource(wood);
      
      const foodResources = system.getResourcesByType('Food');
      expect(foodResources.length).to.equal(1);
      expect(foodResources[0].getType()).to.equal('Food');
    });
    
    it('should remove resources correctly', function() {
      const system = new ResourceSystemManager();
      const resource = new ResourceController(100, 100, 32, 32);
      
      system.addResource(resource);
      system.removeResource(resource);
      
      expect(system.getResourceList().length).to.equal(0);
    });
  });
  ```
- [ ] **Update ResourceSystemManager implementation**
  - Change `resource.type` → `resource.getType()`
  - Change `resource.x/resource.posX` → `resource.getPosition().x`
  - Change `resource.y/resource.posY` → `resource.getPosition().y`
  - Update all resource property access to use controller API
- [ ] **Run tests** (should pass)

---

#### 1.7b: Update ResourceSpawner
**Goal**: Spawn ResourceController instances instead of old Resource class

- [ ] **Write tests for ResourceSpawner** (TDD)
  ```javascript
  // test/integration/spawning/ResourceSpawner.test.js
  describe('ResourceSpawner with ResourceController', function() {
    it('should spawn ResourceController instances', function() {
      const spawner = new ResourceSpawner(1000, 10);
      const spawned = spawner.spawnResource(100, 100, 'Food');
      
      expect(spawned).to.be.instanceOf(ResourceController);
      expect(spawned.getType()).to.equal('Food');
      expect(spawned.getPosition().x).to.equal(100);
    });
  });
  ```
- [ ] **Update ResourceSpawner class**
  ```javascript
  // In resource.js or spawner file
  class ResourceSpawner {
    spawnResource(x, y, type) {
      // OLD: return new Resource(x, y, 32, 32, { resourceType: type });
      // NEW: return ResourceController instance
      return new ResourceController(x, y, 32, 32, { 
        type: type,
        amount: 100,
        imagePath: this._getImageForType(type)
      });
    }
  }
  ```
- [ ] **Update factory methods** (createGreenLeaf, createMapleLeaf, etc.)
  ```javascript
  // OLD Resource.createGreenLeaf()
  static createGreenLeaf(x, y) {
    return new Resource(x, y, 20, 20, { resourceType: 'greenLeaf' });
  }
  
  // NEW: Use ResourceController
  static createGreenLeaf(x, y) {
    return new ResourceController(x, y, 20, 20, { 
      type: 'greenLeaf',
      imagePath: greenLeaf || null
    });
  }
  ```
- [ ] **Run tests** (should pass)

---

#### 1.7c: Update ResourceManager (Ant Inventory)
**Goal**: Make ant resource collection work with ResourceController

- [ ] **Write tests for ResourceManager with ResourceController** (TDD)
  ```javascript
  // test/integration/managers/ResourceManager.test.js
  describe('ResourceManager with ResourceController', function() {
    it('should add ResourceController to inventory', function() {
      const ant = { posX: 100, posY: 100 };
      const manager = new ResourceManager(ant, 2);
      const resource = new ResourceController(110, 110, 32, 32, { type: 'Food' });
      
      const added = manager.addResource(resource);
      
      expect(added).to.be.true;
      expect(manager.getCurrentLoad()).to.equal(1);
    });
    
    it('should detect resources using getPosition()', function() {
      const ant = { posX: 100, posY: 100 };
      const manager = new ResourceManager(ant, 2, 25);
      
      // Mock global resource system with ResourceController
      global.g_resourceManager = {
        getResourceList: () => [
          new ResourceController(110, 110, 32, 32, { type: 'Food' })
        ],
        removeResource: sinon.spy()
      };
      
      manager.checkForNearbyResources();
      
      expect(manager.getCurrentLoad()).to.equal(1);
    });
  });
  ```
- [ ] **Update ResourceManager.checkForNearbyResources()**
  - Change `resource.x/resource.posX` → `resource.getPosition().x`
  - Change `resource.y/resource.posY` → `resource.getPosition().y`
  - Change `resource.type/resource._type/resource.resourceType` → `resource.getType()`
  - Remove `resource.pickUp()` calls (ResourceController doesn't need this)
  - Remove `resource.drop()` calls (ResourceController doesn't need this)
- [ ] **Update ResourceManager.processDropOff()**
  - Use `resource.getType()` for type checking
  - Resources are already ResourceController instances
- [ ] **Run tests** (should pass)

---

#### 1.7d: Update UI Components
**Goal**: Make UI work with ResourceController API

- [ ] **Update DraggablePanelSystem**
  ```javascript
  // OLD: wood = g_resourceManager.getResourcesByType('wood').length;
  // NEW: Same (getResourcesByType still works, but uses getType() internally)
  
  // If directly accessing resources:
  // OLD: resource.type or resource._type
  // NEW: resource.getType()
  ```
- [ ] **Update ResourceBrush (Level Editor)**
  - Change resource creation to use ResourceController
  - Update property access to use controller API
- [ ] **Update other UI components**
  - Search codebase for `resource.type`, `resource._type`, `resource.resourceType`
  - Replace with `resource.getType()`
  - Search for `resource.x`, `resource.posX` → `resource.getPosition().x`
- [ ] **Manual testing**: Open game, verify resource display works

---

#### 1.8: Remove Old Resource Class
**Goal**: Clean up legacy code after migration complete

- [ ] **Verify all tests passing**
  ```bash
  npm test
  ```
- [ ] **Verify game playable**
  - Start game
  - Spawn resources
  - Ants can gather resources
  - Resources render correctly
  - No console errors
- [ ] **Deprecate/remove Resource class**
  ```javascript
  // Classes/resources/resource.js
  
  // Keep factory methods but use ResourceController:
  class Resource {
    // DEPRECATED: Use ResourceController directly
    static createGreenLeaf(x, y) {
      console.warn('Resource.createGreenLeaf() deprecated - use ResourceController');
      return new ResourceController(x, y, 20, 20, { type: 'greenLeaf' });
    }
  }
  ```
- [ ] **Update CHANGELOG.md**
  ```markdown
  ## [Unreleased]
  
  ### BREAKING CHANGES
  - Resource class replaced with ResourceController (MVC pattern)
  - Old Entity-based Resource API deprecated
  - Migration: Use ResourceController instead of Resource
  
  ### Developer-Facing Changes
  
  #### Refactored
  - **Resource System**: Migrated to MVC pattern
    - ResourceModel: Data and business logic
    - ResourceView: Rendering with Sprite2D
    - ResourceController: Public API and coordination
    - Functions changed: All resource access now via controller methods
    - New workflow: Use getType(), getPosition(), gather(), isDepleted()
    - Breaking: Old Resource(x, y, w, h, type, img) → ResourceController(x, y, w, h, { type, amount, imagePath })
  ```

---

#### 1.9: Final E2E Validation
**Goal**: Prove complete resource system works end-to-end

- [ ] **BDD Test: Resource Gathering Workflow**
  ```gherkin
  # test/bdd/features/resource_gathering.feature
  Feature: Resource Gathering
    As a player
    I want my ants to gather resources
    So I can build my colony
  
  Scenario: Ant gathers food resource
    Given the game is running
    And a Food resource exists at grid position (10, 10)
    And an ant exists at grid position (8, 8)
    When the ant moves within 25 pixels of the resource
    Then the ant should collect the resource
    And the resource should be removed from the game
    And the ant inventory should show 1 Food
  ```
- [ ] **Manual gameplay test**
  - Start game
  - Spawn resources (Food, Wood, Stone)
  - Watch ants gather automatically
  - Verify resources deplete correctly
  - Check resource counts in UI
  - No console errors
- [ ] **Screenshot proof** (before/after comparison)
- [ ] **Performance check** (no frame rate drops)

**Deliverable**: ResourceModel + ResourceView + ResourceController fully integrated, 100% tests passing, game playable

**Time Estimate (Clean Refactoring)**: 
- Phase 1.1-1.6 (Base + Model + View + Controller): ✅ COMPLETE (~20 hours)
- Phase 1.7a (ResourceSystemManager): ~2 hours
- Phase 1.7b (ResourceSpawner): ~1 hour
- Phase 1.7c (ResourceManager - ant inventory): ~1.5 hours
- Phase 1.7d (UI Components): ~1 hour
- Phase 1.8 (Remove old Resource class): ~0.5 hours
- Phase 1.9 (E2E validation): ~1 hour
- **TOTAL**: ~27 hours (~1.5 weeks) vs 60-80 hours for adapter approach
- **Savings**: Clean approach is FASTER and cleaner! 🎉

---

## Phase 2: Refactor Buildings (Week 4-5)

### Goals
- Apply learned patterns to Buildings
- Validate pattern scales to static entities

### Tasks
- [ ] BuildingModel (Colony, Storage, etc.)
- [ ] BuildingView
- [ ] BuildingController
- [ ] BuildingAdapter
- [ ] Update BuildingManager
- [ ] E2E validation

**Time Estimate**: 40-60 hours (buildings simpler than entities)

---

## Phase 3: Refactor Ants (Week 6-8)

### Goals
- Refactor most complex entity type
- Handle state machine integration
- Handle job system integration

### Tasks
- [ ] AntModel (with state machine)
- [ ] AntView
- [ ] AntController
- [ ] AntAdapter
- [ ] Update AntManager
- [ ] Refactor JobComponent to work with AntModel
- [ ] Refactor AntStateMachine to work with AntModel
- [ ] E2E validation (movement, gathering, combat)

**Time Estimate**: 80-120 hours (ants are complex)

---

## Phase 4: Refactor Managers (Week 9-10)

### Goals
- Refactor manager classes to MVC
- GameStateManager, SelectionManager, CameraManager

### Tasks
- [ ] GameStateModel + GameStateView + GameStateController
- [ ] SelectionModel + SelectionView + SelectionController
- [ ] Update sketch.js to use controllers

**Time Estimate**: 60-80 hours

---

## Phase 5: Refactor UI (Week 11-12)

### Goals
- Refactor draggable panels to MVC
- DraggablePanelManager, dialog boxes

### Tasks
- [ ] PanelModel + PanelView + PanelController
- [ ] DialogModel + DialogView + DialogController
- [ ] Update DraggablePanelManager

**Time Estimate**: 40-60 hours

---

## Phase 6: Remove Adapters (Week 13)

### Goals
- Remove backward compatibility adapters
- Clean up old Entity class
- Final validation

### Tasks
- [ ] Remove all Adapter classes
- [ ] Remove old Entity class
- [ ] Update all references to use controllers directly
- [ ] Full regression testing
- [ ] Performance benchmarking (before/after)

**Time Estimate**: 20-40 hours

---

## Total Estimated Timeline

**12-13 weeks (3 months)** for complete refactoring

### Breakdown:
- Phase 0: Preparation - 1 week
- Phase 1: Resources - 2-3 weeks
- Phase 2: Buildings - 2 weeks
- Phase 3: Ants - 3-4 weeks
- Phase 4: Managers - 2 weeks
- Phase 5: UI - 2 weeks
- Phase 6: Cleanup - 1 week

---

## Risk Mitigation

### High-Risk Areas
1. **State Machine Integration** (Phase 3)
   - AntStateMachine tightly coupled to current Entity
   - Solution: Create StateModel that wraps AntModel
   
2. **Save/Load System**
   - Current system serializes Entity properties
   - Solution: Model.toJSON() handles serialization
   
3. **Performance**
   - Extra indirection (model → controller → view)
   - Solution: Benchmark after Phase 1, optimize if needed

### Rollback Plan
- Each phase is a separate branch
- If phase fails, rollback to previous working branch
- Adapter pattern ensures game stays playable during migration

---

## Success Criteria

### Per Phase:
- ✅ All tests pass (unit, integration, E2E)
- ✅ Game is playable (no broken features)
- ✅ No console errors
- ✅ Performance unchanged (<5% regression)
- ✅ Documentation updated

### Final Success:
- ✅ 100% MVC pattern (no old Entity class)
- ✅ All adapters removed
- ✅ Full test coverage (>80%)
- ✅ Performance benchmarks pass
- ✅ Clean, maintainable codebase

---

## Questions Before Starting

1. **Team Size**: How many developers working on this?
2. **Timeline Pressure**: Is 3 months acceptable? Can we push back features?
3. **Testing Requirements**: Do we need to maintain 100% test coverage during migration?
4. **Backward Compatibility**: Do we need to support old save files?
5. **Performance Budget**: What performance regression is acceptable?

---

## Getting Started (THIS WEEK)

### Immediate Action Items:
1. **Create feature checklist** using `docs/checklists/templates/FEATURE_DEVELOPMENT_CHECKLIST.md`
2. **Start Phase 0.1**: Map current architecture
   ```bash
   grep -r "new Entity" Classes/ --include="*.js" > docs/entity_usage.txt
   ```
3. **Run baseline tests**
   ```bash
   npm test
   ```
4. **Schedule team meeting** to review this roadmap

### First Code Task (Tomorrow):
**Phase 0.3: Create BaseModel class**
- Write unit tests for BaseModel
- Implement BaseModel
- Get tests passing
- **This is your foundation for everything else**

---

## Remember

> **"How do you eat an elephant? One bite at a time."**

This is a massive refactoring, but it's **100% achievable** if you:
1. ✅ Follow TDD strictly (tests first, always)
2. ✅ Refactor ONE system at a time
3. ✅ Keep game playable with adapters
4. ✅ Don't skip phases
5. ✅ Celebrate small wins (each phase completion)

You've got this! 🚀
