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

#### 0.3: Create MVC Base Classes
- [ ] **Write tests for base Model class** (TDD)
  - Property storage
  - Change notifications
  - Serialization (toJSON/fromJSON)
- [ ] **Implement BaseModel**
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
  ```javascript
  // Classes/views/BaseView.js
  class BaseView {
    constructor(model) {
      this._model = model;
      this._modelChangeHandler = this._onModelChange.bind(this);
      model.addChangeListener(this._modelChangeHandler);
    }
    
    _onModelChange(property, data, model) { ... }
    render() { ... }
    destroy() { ... }
  }
  ```
- [ ] **Write tests for base Controller class** (Integration)
- [ ] **Implement BaseController**
  ```javascript
  // Classes/controllers/BaseController.js
  class BaseController {
    constructor(model, view) {
      this._model = model;
      this._view = view;
    }
    
    update(deltaTime) { this._model.update(deltaTime); }
    render() { this._view.render(); }
    destroy() { this._model.destroy(); this._view.destroy(); }
  }
  ```

**Deliverable**: Base classes with 100% test coverage

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

#### 1.1: Write ResourceModel Tests (TDD)
- [ ] **Unit tests for ResourceModel**
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

#### 1.2: Implement ResourceModel
- [ ] **Create ResourceModel class**
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

#### 1.3: Write ResourceView Tests (E2E with screenshots)
- [ ] **E2E tests for ResourceView**
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

#### 1.4: Implement ResourceView
- [ ] **Create ResourceView class**
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

#### 1.5: Write ResourceController Tests (Integration)
- [ ] **Integration tests**
  ```javascript
  // test/integration/controllers/ResourceController.test.js
  describe('ResourceController', function() {
    it('should coordinate model and view', function() {
      const controller = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      
      expect(controller.getPosition().x).to.equal(100);
      expect(controller.type).to.equal('Food');
      
      controller.setPosition(200, 200);
      expect(controller.getPosition().x).to.equal(200);
    });
    
    it('should handle resource gathering', function() {
      const controller = new ResourceController(100, 100, 32, 32, { amount: 100 });
      
      controller.gather(30);
      expect(controller.getAmount()).to.equal(70);
      
      controller.gather(70);
      expect(controller.getAmount()).to.equal(0);
      expect(controller.isDepleted()).to.be.true;
    });
  });
  ```
- [ ] **Run tests** (should fail)

#### 1.6: Implement ResourceController
- [ ] **Create ResourceController class**
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

#### 1.7: Create ResourceAdapter (Backward Compatibility)
- [ ] **Create adapter**
  ```javascript
  // Classes/adapters/ResourceAdapter.js
  class ResourceAdapter {
    constructor(resourceController) {
      this._controller = resourceController;
      
      // Make controller look like old Entity/Resource API
      this.id = this._controller.id;
      this.type = this._controller.type;
      this.getPosition = () => this._controller.getPosition();
      this.setPosition = (x, y) => this._controller.setPosition(x, y);
      this.render = () => this._controller.render();
      this.update = (dt) => this._controller.update(dt);
      this.gather = (amount) => this._controller.gather(amount);
      this.isDepleted = () => this._controller.isDepleted();
    }
  }
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResourceAdapter;
  }
  ```
- [ ] **Write adapter tests**
  ```javascript
  // test/integration/adapters/ResourceAdapter.test.js
  describe('ResourceAdapter', function() {
    it('should make controller look like old Resource API', function() {
      const controller = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      const adapter = new ResourceAdapter(controller);
      
      // Old code can still use old API
      const pos = adapter.getPosition();
      expect(pos.x).to.equal(100);
      
      adapter.setPosition(200, 200);
      expect(adapter.getPosition().x).to.equal(200);
      
      adapter.gather(30);
      expect(controller.getAmount()).to.equal(70);
    });
  });
  ```

#### 1.8: Update ResourceManager to Use MVC
- [ ] **Refactor ResourceManager**
  ```javascript
  // Classes/managers/ResourceManager.js
  class ResourceManager {
    constructor() {
      this._resources = []; // Array of ResourceController (not Entity)
    }
    
    addResource(x, y, type, amount) {
      const controller = new ResourceController(x, y, 32, 32, { type, amount });
      this._resources.push(controller);
      
      // Return adapter for backward compatibility
      return new ResourceAdapter(controller);
    }
    
    update(deltaTime) {
      this._resources.forEach(controller => controller.update(deltaTime));
    }
    
    render() {
      this._resources.forEach(controller => controller.render());
    }
    
    removeDepletedResources() {
      this._resources = this._resources.filter(c => !c.isDepleted());
    }
  }
  ```
- [ ] **Write manager tests**
- [ ] **Run full test suite**
  ```bash
  npm test
  ```

#### 1.9: E2E Validation (Game Still Works)
- [ ] **Play the game manually**
  - Can still gather resources?
  - Resources render correctly?
  - No console errors?
- [ ] **E2E test: Full resource workflow**
  ```javascript
  // test/e2e/workflows/pw_resource_gathering.js
  // Test: Ant walks to resource, gathers, resource depletes
  ```
- [ ] **Screenshot proof** (before/after comparison)

**Deliverable**: ResourceModel + ResourceView + ResourceController + ResourceAdapter, fully tested, game still works

**Time Estimate**: 60-80 hours (2-3 weeks)

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
