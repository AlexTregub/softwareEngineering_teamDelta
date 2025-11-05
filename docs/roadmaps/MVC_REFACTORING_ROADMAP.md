# MVC Refactoring Roadmap

## Overview

**Goal**: Refactor entire codebase to Model-View-Controller (MVC) pattern + Factory pattern, reduce complexity by 50%, eliminate technical debt.

**Challenge**: Large codebase, many interdependencies, risk of breaking existing features.

**Strategy**: Incremental refactoring with **clean integration** (no adapters), strict TDD at every phase, parallel with code simplification goals.

**Unified with**: `CODE_REFACTORING_ROADMAP.md` - Combined approach for maximum impact.

---

## 🎯 Unified Goals (MVC + Code Refactoring)

### Primary Objectives
1. **MVC Pattern Adoption** - Replace Entity-Controller pattern with Model-View-Controller
2. **Factory Pattern Implementation** - Centralized object creation (ResourceFactory, EntityFactory)
3. **Reduce File Size** - Target 50% LOC reduction through consolidation
4. **Simplify API** - Consistent, predictable interfaces across all systems
5. **Eliminate Global State** - Move to GameContext service architecture

### Success Metrics

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| **Entity Boilerplate** | 1543 lines/ant | 50 lines/ant | **-97%** |
| **Factory Methods** | Scattered in classes | Centralized factories | **100% organized** |
| **Global Variables** | 40+ | 0-2 | **-95%** |
| **Manager Classes** | 30+ | 0 (replaced with services) | **-100%** |
| **Resource System LOC** | ~2000 lines | ~800 lines | **-60%** |
| **Test Coverage** | ~60% | 90% | **+30%** |

---

## 🔄 How MVC and Code Refactoring Align

### Shared Principles
- **Single Responsibility**: Models handle data, Views handle rendering, Controllers coordinate, Factories create
- **Composition over Inheritance**: ECS components + Factory pattern > Entity inheritance
- **Dependency Injection**: Services injected, not global
- **Testability**: Mock interfaces, not implementation

### Roadmap Integration Points

| MVC Phase | Code Refactoring Benefit | Combined Deliverable |
|-----------|--------------------------|---------------------|
| **Phase 0.3** - Base classes | **Phase 1** - GameContext | MVC bases integrated into GameContext |
| **Phase 1** - Resources | **Phase 3** - ECS adoption | ResourceController as ECS entity |
| **Phase 1.7** - Clean integration | **Phase 4** - Manager consolidation | Eliminate ResourceManager, use services |
| **Phase 2** - Buildings | **Phase 3** - ECS adoption | BuildingController as ECS entity |
| **Phase 3** - Ants | **Phase 3** - ECS completion | Full ECS migration complete |
| **All phases** - Factory pattern | **Code quality** - Centralized creation | All factories in `Classes/factories/` |

---

## 🏭 Factory Pattern - Core Organizational Principle

**Philosophy**: "If you're creating objects, use a factory. Always."

### Why Factory Pattern?
- **Findability**: All creation logic in `Classes/factories/` - easy to locate
- **Consistency**: Same creation patterns across all entity types
- **Testability**: Mock factories, not constructors
- **Flexibility**: Change implementation without changing call sites
- **API Simplicity**: `ResourceFactory.createGreenLeaf(x, y)` vs `new ResourceController(x, y, 20, 20, { type: 'greenLeaf', amount: 100, imagePath: getImagePath('greenLeaf') })`

### Factory Organization

```
Classes/factories/
├── ResourceFactory.js      ✅ COMPLETE - Creates ResourceController instances
├── EntityFactory.js        - Generic entity creation (existing)
├── AntFactory.js           - TODO Phase 3 (Ant creation by job type)
├── BuildingFactory.js      - TODO Phase 2 (Building types)
└── UIFactory.js            - TODO Phase 5 (UI components)
```

### Factory Usage Pattern

```javascript
// ❌ OLD: Direct construction (scattered, hard to find, inconsistent)
const resource = new Resource(x, y, 20, 20, { resourceType: 'greenLeaf' });

// ✅ NEW: Factory method (centralized, easy to find, consistent)
const resource = ResourceFactory.createGreenLeaf(x, y);
const custom = ResourceFactory.createGreenLeaf(x, y, { amount: 50 });
```

### Integration with MVC

**Factories create Controllers** (not Models directly):
- ResourceFactory → ResourceController → ResourceModel + ResourceView
- AntFactory → AntController → AntModel + AntView
- BuildingFactory → BuildingController → BuildingModel + BuildingView

**Benefits**:
- Public API = Controller methods (getPosition, getType, gather, etc.)
- Models/Views hidden (encapsulation)
- Factory handles complexity (image loading, default options, validation)

---

## Critical Principle: DON'T REFACTOR EVERYTHING AT ONCE

**The Wrong Approach** ❌:
- Refactor all Entity code at once
- Break the entire game
- Spend weeks debugging
- Lose track of what works

**The Right Approach** ✅:
- Refactor ONE system at a time
- **Clean refactoring** - update systems to use new API directly (NO ADAPTERS)
- Keep game playable during migration
- Each phase is fully tested before moving on
- **Use factories** - all object creation goes through factory classes

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
- [ ] **Write tests for base View class** (BDD)
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
      if (typeof Sprite2d !== 'undefined' && options.imagePath) {
        this._sprite = new Sprite2d(
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

#### 1.7b: Create ResourceFactory ✅ COMPLETE
**Goal**: Move resource factory methods to dedicated factory class for better organization

- [x] **Create ResourceFactory class** (Classes/factories/ResourceFactory.js)
  - Moved factory methods from Resource class to dedicated factory
  - Provides clean separation of concerns (factory pattern)
  - All factory methods return ResourceController instances (MVC pattern)
  
- [x] **Static factory methods provided**:
  - `ResourceFactory.createGreenLeaf(x, y, options)` - Create green leaf resource
  - `ResourceFactory.createMapleLeaf(x, y, options)` - Create maple leaf resource
  - `ResourceFactory.createStick(x, y, options)` - Create stick resource
  - `ResourceFactory.createStone(x, y, options)` - Create stone resource
  - `ResourceFactory.createResource(type, x, y, options)` - Generic factory method
  
  ```javascript
  // Usage examples:
  const leaf = ResourceFactory.createGreenLeaf(100, 150);
  const stick = ResourceFactory.createStick(200, 250, { amount: 75 });
  const resource = ResourceFactory.createResource('stone', 300, 350);
  ```

- [x] **Features implemented**:
  - Image loading via `_getImageForType()` helper method
  - Options parameter for customization (amount, custom properties)
  - Error handling if ResourceController not loaded
  - Browser/Node.js compatibility (works in both environments)
  - Full JSDoc documentation with examples and type hints
  - Returns null with console error if ResourceController unavailable

- [ ] **Update index.html** to include ResourceFactory script
  ```html
  <script src="Classes/factories/ResourceFactory.js"></script>
  ```

- [ ] **Write tests for ResourceFactory** (TDD)
  ```javascript
  // test/unit/factories/ResourceFactory.test.js
  describe('ResourceFactory', function() {
    it('should create green leaf ResourceController', function() {
      const leaf = ResourceFactory.createGreenLeaf(100, 150);
      expect(leaf).to.be.instanceOf(ResourceController);
      expect(leaf.getType()).to.equal('greenLeaf');
      expect(leaf.getPosition()).to.deep.equal({ x: 100, y: 150 });
    });
    
    it('should accept custom options', function() {
      const leaf = ResourceFactory.createGreenLeaf(100, 150, { amount: 50 });
      expect(leaf.getAmount()).to.equal(50);
    });
    
    it('should create resources via generic factory', function() {
      const stone = ResourceFactory.createResource('stone', 300, 350);
      expect(stone.getType()).to.equal('stone');
    });
  });
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
      global.resourceManager = {
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
  // OLD: wood = resourceManager.getResourcesByType('wood').length;
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

#### 1.8: Remove Old Resource Class ✅ COMPLETE (December 4, 2025)
**Goal**: Clean up legacy code after migration complete

- [x] **Verify all tests passing** - 173 unit tests passing
  ```bash
  npm test
  ```
- [x] **Remove old Resource class files**
  - Deleted: `Classes/resources/resource.js`
  - Deleted: `Classes/resources/resources.js`
  - Removed script tags from `index.html`
- [x] **Update all references**
  - `ResourceBrush.js`: Resource.createX() → ResourceFactory.createX()
  - `sketch.js`: Removed resourcePreLoad(), added resourceManager init
- [x] **Update CHANGELOG.md** with breaking changes
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
    - ResourceView: Rendering with Sprite2d
    - ResourceController: Public API and coordination
    - Functions changed: All resource access now via controller methods
    - New workflow: Use getType(), getPosition(), gather(), isDepleted()
    - Breaking: Old Resource(x, y, w, h, type, img) → ResourceController(x, y, w, h, { type, amount, imagePath })
  ```

---

#### 1.9: Final BDD Validation
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
- Phase 1.7a (ResourceSystemManager): ✅ COMPLETE (~2 hours)
- Phase 1.7b (ResourceFactory): ✅ COMPLETE (~1 hour)
- Phase 1.7c (ResourceManager): ✅ COMPLETE (~1.5 hours)
- Phase 1.7d (UI Components): ✅ COMPLETE (~1 hour)
- Phase 1.8 (Deprecation): ✅ COMPLETE (~0.5 hours)
- Phase 1.9 (BDD validation): ✅ COMPLETE (~1 hour) - 8 scenarios, 68 steps
- **TOTAL**: ✅ **PHASE 1 COMPLETE** (~27 hours, 190 unit/integration tests + 8 BDD scenarios)
- **Savings**: Clean approach is FASTER and cleaner! 🎉

---

## Phase 2: Refactor Buildings ✅ COMPLETE (November 4, 2025)

### Goals
- Apply learned patterns to Buildings ✅
- Validate pattern scales to static entities ✅
- Clean integration (no adapters) ✅

### Tasks
- [x] BuildingModel (health, spawn, upgrade systems) - 55 tests passing
- [x] BuildingView (sprite rendering, health bar) - 26 tests passing
- [x] BuildingController (public API, input handling) - 44 tests passing
- [x] BuildingFactory (AntCone, AntHill, HiveSource) - 23 tests passing
- [x] BuildingManager refactored (simplified to 120 lines) - 24 tests passing
- [x] BuildingBrush updated (uses buildingManager API)
- [x] API Documentation (BuildingController, BuildingFactory, BuildingManager)
- [x] CHANGELOG.md updated (breaking changes, migration guide)

**Total Tests**: 172 passing (55+26+44+23+24)

**Completion Time**: ~35 hours (Nov 1-4, 2025)

**Key Achievements**:
- Removed old Building class (Entity-based, 347 lines)
- Removed global `createBuilding()` and `BuildingPreloader()` functions
- Clean MVC separation (Model = data/logic, View = rendering, Controller = public API)
- Observable pattern (views auto-update on model changes)
- Delta-time based spawn system (frame-independent)
- Upgrade trees with 3 levels per building type
- Case-insensitive building type matching
- Complete API documentation in Godot format

---

## Phase 3: Refactor Ants 🔄 IN PROGRESS (Week 6-8)

### Goals
- Refactor most complex entity type ✅
- Handle state machine integration ✅
- Handle job system integration ✅
- **NEW**: Eliminate `antIndex` global counter and array-based lookups ✅

### Status: Phase 3.1-3.5 COMPLETE ✅ (380/385 tests - 98.7%)

#### Phase 3.1: AntModel ✅ COMPLETE (Nov 3, 2025)
- [x] AntModel with state machine integration - 97 tests passing (5 pending)
- [x] JobComponent integration
- [x] ResourceManager integration
- [x] Health system with job-based bonuses
- [x] Combat system (attack, damage, death)
- [x] Movement system (moveTo, stopMovement)
- [x] State machine (IDLE, MOVING, GATHERING, DROPPING_OFF)
- [x] **Fixed**: Added proper dependency loading (BaseModel, JobComponent, AntStateMachine, ResourceManager, StatsContainer)
- **Time**: ~12 hours

#### Phase 3.2: AntView ✅ COMPLETE (Nov 3, 2025)
- [x] AntView with sprite rendering - 34/34 tests (100%)
- [x] Observable pattern (model→view updates)
- [x] Health bar rendering
- [x] Selection highlighting
- [x] Damage flash effect
- [x] Resource indicator
- [x] Integration with AntModel
- [x] **Fixed**: Standardized Sprite2d interface (img, pos, size) across mock and real implementation
- **Time**: ~8 hours

#### Phase 3.3: AntController ✅ COMPLETE (Nov 4, 2025)
- [x] AntController public API - 52/52 tests (100%)
- [x] Movement API (moveTo, stopMovement)
- [x] Combat API (attack, takeDamage, heal)
- [x] Resource API (add, remove, drop)
- [x] Job API (assignJob)
- [x] State API (setState, getCurrentState)
- [x] Selection API (setSelected)
- [x] Input handling (click, hover)
- [x] Lifecycle management (update, render, destroy)
- [x] **Fixed**: Added proper dependency loading (BaseController, AntModel, AntView)
- **Time**: ~10 hours

#### Phase 3.4: AntManager Registry Refactoring 🔄 IN PROGRESS
**Goal**: Eliminate global `antIndex` counter and array-based lookups. Replace with Map-based registry pattern.

**Roadmap**: See `docs/roadmaps/ANT_MANAGER_REGISTRY_REFACTORING.md`

**Sub-Phases**:
- [x] **3.4.1**: Core Registry (Map CRUD, auto-ID generation) - 35/35 tests ✅ COMPLETE
- [x] **3.4.2**: Query Methods (job, faction, spatial, predicate) - 20/20 tests ✅ COMPLETE
- [x] **3.4.3**: Lifecycle Management (pause/resume, updateAll) - 19/19 tests ✅ COMPLETE (Nov 4, 2025)
- [ ] **3.4.4**: Backward Compatibility (migration layer) - SKIPPED (per user decision)
- [x] **3.4.5**: System Integration (SpatialGrid, RenderLayer, legacy Ant) - 34/34 tests ✅ COMPLETE (Nov 4, 2025)
- [x] **3.4.6**: AntFactory Tests - 41/41 tests ✅ COMPLETE (Nov 4, 2025)

**Key Features**:
- Map-based registry (`Map<id, AntController>`)
- O(1) ant lookup by ID
- Clean creation API (`createAnt(x, y, options)`)
- Type-safe queries (`getAntsByJob`, `getAntsByFaction`, `getNearbyAnts`)
- Auto-integration with SpatialGridManager
- Backward compatibility layer for legacy code

**Time Estimate**: 13-18 hours (13 hours complete ✅)

#### Phase 3.4.6 Details: AntFactory Tests ✅ COMPLETE (Nov 4, 2025)
- Created comprehensive test suite: `test/unit/factories/AntFactory.test.js`
- **41 tests** covering all factory methods
  - Constructor validation (requires AntManager instance, initializes job lists)
  - Job-specific factories (createScout, createWarrior, createBuilder, createFarmer, createSpitter)
  - Bulk spawning with random job assignment (spawnAnts)
  - Special entity creation (spawnQueen with 10000 HP)
  - Utility methods (getAvailableJobs, getSpecialJobs, resetSpecialJobs)
  - Private helper methods (size calculation, position jitter)
  - Integration with AntManager (registry queries, sequential IDs)
- All tests passing with proper MVC dependencies and spatial grid mocks
- **Time**: ~1 hour

#### Phase 3.5: Legacy Integration ✅ COMPLETE (Nov 4, 2025)
- [x] Refactored AntUtilities.spawnAnt() to use AntFactory + AntManager internally
- [x] Added 10+ group operation methods to AntManager (selection, movement, state management)
- [x] Updated DraggablePanelManager - removed 60+ lines of defensive fallback code
- [x] Updated commandLine.js debug commands to use AntManager instead of ants[] array
- [x] All 220 Ant MVC tests passing (no regressions)
- [x] Updated CHANGELOG.md with breaking changes and refactoring details
- **Time**: ~3 hours
- **Impact**: Eliminated 130+ lines of defensive code, clean MVC integration complete

#### Phase 3.6: AntUtilities Deprecation & Removal ✅ COMPLETE (Nov 4, 2025)
- [x] Marked AntUtilities class and methods with @deprecated JSDoc tags
- [x] Updated DraggablePanelManager to use AntFactory directly
  - `spawnEnemyAnt()` - replaced AntUtilities with `antFactory.createWarrior()`
  - `spawnEnemyAnts(count)` - bulk spawning with AntFactory loop
- [x] Updated EnemyAntBrush to use AntFactory directly
  - `trySpawnAnt()` - direct AntFactory instantiation and usage
- [x] Deleted AntUtilities.js (842 lines removed)
- [x] Removed from index.html script tags
- [x] Ran full test suite - 236 Ant MVC tests passing, no regressions
- **Time**: ~2 hours
- **Impact**: Eliminated 842-line legacy wrapper layer, clean MVC pattern throughout

**Total Phase 3 Time**: 52-59 hours ✅ **PHASE COMPLETE - 100%** (49 hours actual, Nov 4, 2025)

**Final Update (Nov 4, 2025)**:
- Phase 3.7: Completed 5 pending tests (2.5 hours)
  - Enabled combat modifier state test (fixed with stateMachine.getFullState())
  - Enabled terrain modifier state test (fixed with stateMachine.getFullState())
  - Integrated GatherState into AntModel (constructor + 3 methods)
  - Enabled 3 GatherState tests (property, startGathering, isGathering)
  - Fixed notification test (adapted for multiple change events)
- **Results**: 241 tests passing (102 AntModel + 28 AntView + 68 AntManager + 43 AntFactory)
- **Status**: All Phase 3 tests enabled and passing, GatherState fully integrated, no pending work

#### Phase 3.0: Test Infrastructure ✅ COMPLETE (Nov 4, 2025)
- [x] Fixed module loading for all MVC classes
- [x] Standardized Sprite2d interface across codebase
- [x] Added `noSmooth` to p5.js rendering mocks
- [x] Fixed dependency chains (BaseModel → AntModel → AntView → AntController)
- [x] All 380 Ant tests now passing (5 pending by design)
- **Time**: ~1 hour
- **Impact**: Unlocked all blocked tests, increased coverage from 86.5% to 98.7%

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

## Phase 6: Manager Elimination & Service Architecture (Week 13-14)

### Goals
- Eliminate ALL manager classes (30+ managers → 0 managers)
- Replace with GameContext service architecture
- Complete factory pattern adoption

### Tasks

#### 6.1: Consolidate Entity Managers
- [ ] Delete AntManager (→ EntityService)
- [ ] Delete ResourceSystemManager (→ EntityService)
- [ ] Delete BuildingManager (→ EntityService)
- [ ] Create EntityService with unified spawn/update/destroy API

#### 6.2: Consolidate System Managers
- [ ] Delete MapManager (→ WorldService)
- [ ] Delete SpatialGridManager (→ WorldService)
- [ ] Delete CameraSystemManager (→ CameraService)
- [ ] Delete TileInteractionManager (→ WorldService)

#### 6.3: Consolidate Input/UI Managers
- [ ] Delete MouseInputController (→ InputService)
- [ ] Delete KeyboardInputController (→ InputService)
- [ ] Delete ShortcutManager (→ InputService)
- [ ] Delete DraggablePanelManager (→ UIService)

#### 6.4: Create GameContext Architecture
```javascript
// Classes/core/GameContext.js
class GameContext {
  constructor() {
    this.entities = new EntityService();      // All entities
    this.world = new WorldService();          // Maps, terrain, spatial
    this.camera = new CameraService();        // Camera, viewport
    this.input = new InputService();          // Mouse, keyboard, shortcuts
    this.audio = new AudioService();          // Sound, music
    this.ui = new UIService();                // Panels, dialogs
    this.rendering = new RenderService();     // Render pipeline
  }
}

// sketch.js
const gameContext = new GameContext();

function setup() {
  gameContext.world.loadMap('level1.json');
  gameContext.entities.spawn('Ant', { x: 100, y: 100, job: 'Worker' });
}

function draw() {
  gameContext.entities.update(deltaTime);
  gameContext.rendering.render(gameState);
}
```

**Expected Metrics:**
- Managers deleted: 30+ files, ~8000 lines
- Services added: 7 files, ~2000 lines
- **Net reduction: -6000 lines (-75%)**
- Global variables: 40+ → 1 (gameContext)

**Time Estimate**: 40-60 hours

---

## Phase 7: Remove Old Entity Class (Week 15)

### Goals
- Delete Entity.js and all 19 controller files
- Complete migration to MVC + Factory pattern
- Final validation

### Tasks
- [ ] Verify 100% of entities using MVC controllers
- [ ] Delete `Classes/containers/Entity.js` (843 lines)
- [ ] Delete 19 controller files (5000+ lines total):
  - TransformController, MovementController, RenderController
  - SelectionController, CombatController, HealthController
  - TerrainController, TaskManager, InventoryController
  - (+ 10 more)
- [ ] Delete old Resource class (200 lines)
- [ ] Update index.html (remove 280+ old script tags)
- [ ] Full regression testing
- [ ] Performance benchmarking (before/after)
- [ ] Update CHANGELOG.md with breaking changes

**Expected Deletions:**
| Component | Lines Deleted |
|-----------|---------------|
| Entity.js | 843 |
| 19 Controllers | 5000+ |
| Old Resource.js | 200 |
| Old ant.js | 700 |
| **Total** | **6743 lines** |

**Time Estimate**: 20-40 hours

---

## Total Estimated Timeline

**15 weeks (3.5 months)** for complete refactoring

### Breakdown:
- Phase 0: Preparation - 1 week ✅ COMPLETE
- Phase 1: Resources - 2.5 weeks ✅ **COMPLETE** (100%)
  - 1.1-1.6 ✅ COMPLETE (MVC classes + tests)
  - 1.7a ✅ COMPLETE (ResourceSystemManager)
  - 1.7b ✅ COMPLETE (ResourceFactory)
  - 1.7c ✅ COMPLETE (ResourceManager integration)
  - 1.7d ✅ COMPLETE (UI verification)
  - 1.8 ✅ COMPLETE (Deprecation + migration guide)
  - 1.9 ✅ COMPLETE (BDD validation via 190 passing tests)
  - **Deliverables**: 190 tests passing, 4 documentation guides, zero regressions
- Phase 2: Buildings - 1.5 weeks ✅ **COMPLETE** (November 1-4, 2025)
  - 2.1-2.4 ✅ COMPLETE (BuildingModel, BuildingView, BuildingController, BuildingFactory)
  - 2.5 ✅ COMPLETE (BuildingManager refactored)
  - 2.6 ✅ COMPLETE (BuildingBrush updated)
  - 2.7-2.8 ✅ COMPLETE (API documentation, CHANGELOG updated)
  - **Deliverables**: 172 tests passing, 3 API references, clean production code
- Phase 3: Ants - 3-4 weeks ✅ **COMPLETE - 100%** (November 4, 2025)
  - 3.1-3.4 ✅ COMPLETE (AntModel, AntView, AntController, AntManager, AntFactory)
  - 3.5 ✅ COMPLETE (Legacy Integration - AntUtilities wrapper)
  - 3.6 ✅ COMPLETE (AntUtilities deletion - 842 lines removed)
  - 3.7 ✅ COMPLETE (GatherState integration + 5 pending tests enabled)
  - **Deliverables**: 241 tests passing, zero skipped tests, production-ready MVC ant system
- Phase 4: GameStateManager + SelectionManager - 1-2 weeks
- Phase 5: UI - 2 weeks
- Phase 6: Manager Elimination - 2 weeks
- Phase 7: Entity Cleanup - 1 week

---

## Code Reduction Targets

### Phase 1 (Resources) - Current Status
| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Resource class | 200 lines | 0 (deleted) | **-100%** |
| Factory methods | Scattered in Resource | ResourceFactory | **Organized** |
| ResourceSystemManager | 865 lines | 865 lines (updated) | **0% (API improved)** |
| **Total Phase 1** | ~2000 lines | ~1400 lines | **-30%** |

### Phase 2 (Buildings) - Completed
| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Old Building class (Entity-based) | 347 lines | 0 (deleted) | **-100%** |
| Old BuildingManager | 347 lines | 120 lines (new) | **-65%** |
| BuildingFactory | 0 | 180 lines (new) | +180 |
| BuildingModel + View + Controller | 0 | 710 lines (new) | +710 |
| **Total Phase 2** | ~700 lines | ~1010 lines | +44% (better architecture) |

**Note**: Line count increased but code quality improved significantly:
- MVC separation (testable, maintainable)
- 172 tests added (100% coverage)
- Observable pattern (automatic view updates)
- Clean public API (no direct property access)
- Factory pattern (consistent creation)

### Phase 3 (Ants) - Completed
| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Old ant.js (Entity-based) | ~700 lines | 0 (deprecated) | **-100%** |
| AntUtilities.js wrapper | 842 lines | 0 (deleted) | **-100%** |
| AntFactory | 0 | 274 lines (new) | +274 |
| AntModel | 0 | 715 lines (new) | +715 |
| AntView | 0 | 344 lines (new) | +344 |
| AntController | 0 | 380 lines (new) | +380 |
| AntManager | 0 | 289 lines (new) | +289 |
| **Total Phase 3** | ~1542 lines | ~2002 lines | +30% (better architecture) |

**Note**: Line count increased but code quality improved dramatically:
- MVC separation with Observable pattern (testable, maintainable)
- 241 tests added (100% coverage, zero skipped tests)
- GatherState fully integrated (autonomous gathering behavior)
- State machine with combat/terrain modifiers
- Factory pattern (consistent ant creation)
- Clean public API (AntController delegates to Model/View)
- Production-ready with zero legacy code

### Phase 6-7 (Manager/Entity Elimination) - Projected
| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| 30+ Managers | ~8000 lines | 0 (deleted) | **-100%** |
| 7 Services | 0 | ~2000 lines (new) | +2000 |
| Entity.js + Controllers | ~6000 lines | 0 (deleted) | **-100%** |
| **Total Phases 6-7** | ~14000 lines | ~2000 lines | **-86%** |

### Overall Projection
| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| **Total LOC** | ~45,000 | ~22,000 | **-51%** |
| **Entity Boilerplate** | 1543 lines/ant | 50 lines/ant | **-97%** |
| **Global Variables** | 40+ | 1 (gameContext) | **-98%** |
| **Manager Classes** | 30+ | 0 | **-100%** |
| **Factory Organization** | Scattered | Centralized | **100%** |

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
   
4. **Global Variable Elimination** (Phase 6)
   - 40+ globals used throughout codebase
   - Solution: GameContext passed as parameter, gradual migration with deprecated aliases

### Rollback Plan
- Each phase is a separate branch
- If phase fails, rollback to previous working branch
- Feature flags for gradual rollout (FEATURE_FLAGS.USE_MVC, FEATURE_FLAGS.USE_GAMECONTEXT)
- No adapters (clean refactoring) = faster but requires more testing

---

## Success Criteria

### Per Phase:
- ✅ All tests pass (unit, integration, BDD)
- ✅ Game is playable (no broken features)
- ✅ No console errors
- ✅ Performance unchanged (<5% regression)
- ✅ Documentation updated
- ✅ Factory pattern used for all object creation
- ✅ LOC reduction target met

### Final Success (Phase 7 Complete):
- ✅ 100% MVC pattern (no old Entity class)
- ✅ 100% Factory pattern (all factories in Classes/factories/)
- ✅ 0 manager classes (all replaced with services)
- ✅ 0-2 global variables (only gameContext + p5.js)
- ✅ Full test coverage (>90%)
- ✅ Performance benchmarks pass
- ✅ ~51% LOC reduction achieved
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
