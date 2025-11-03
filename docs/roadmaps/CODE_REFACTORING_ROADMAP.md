# Code Refactoring Roadmap - Technical Debt Reduction

**Status**: Planning Phase  
**Goal**: Reduce codebase complexity by 50%, eliminate AI-generated technical debt, establish maintainable architecture  
**Timeline**: 12-20 weeks (phased approach with measurable milestones)  
**Priority**: HIGH - Blocking future development due to complexity

---

## Executive Summary

### Current State (Critical Issues)

**1. Global State Pollution (40+ globals)**
- sketch.js: 40+ global variables creating hidden dependencies
- Testing impossible (everything coupled to global scope)
- State changes ripple unpredictably through entire codebase
- Examples: `ants[]`, `Buildings[]`, `g_map2`, `queenAnt`, `cameraManager`, `g_mouseController`, `g_keyboardController`, `g_selectionBoxController`, `g_tileInteractionManager`, `g_globalTime`

**2. No Module System (280+ manual script tags)**
- index.html: 280+ `<script>` tags loaded sequentially
- Order-dependent loading (breaks if order changes)
- No tree-shaking, no code splitting, no lazy loading
- ~5-10s initial load time
- Every file pollutes global namespace

**3. Controller Explosion (8 controllers × every entity)**
- Entity.js: Creates 8 controllers whether needed or not
- Ant with 5 properties? Still gets 8 controllers (hundreds of lines of boilerplate)
- Manual typeof checks for every controller class
- Initialization overhead: 100+ lines per entity

**4. Manager Proliferation (30+ overlapping managers)**
- 30+ manager classes with unclear responsibilities
- AntManager, MapManager, GameStateManager, EventManager, CameraSystemManager, BuildingManager, TileInteractionManager, SpatialGridManager, soundManager, ShortcutManager, SettingsManager, ResourceSystemManager, ResourceManager, pheromoneControl, MiddleClickPan (and 15 more)
- Tight coupling, circular dependencies
- God objects managing everything

**5. Event System Spaghetti (15+ manual updates)**
- draw() function: Manually calls 15+ system updates
- Repetitive if-checks for game state
- No event queue, no priority system
- Brittle order-dependent execution

**6. Rendering System Chaos (Multiple Issues)**

**RenderLayerManager Issues:**
- **900+ lines** with inline implementations (should delegate to specialized renderers)
- **Tight coupling**: Direct access to globals (`g_map2`, `g_resourceList`, `ants[]`, `Buildings[]`, `g_selectionBoxController`)
- **Inconsistent state management**: Some layers check `gameState`, others don't
- **Manual drawable registration**: 100+ lines in `initialize()` checking globals and registering drawables
- **Renderer overwrite hack**: `_RenderMangerOverwrite`, `_RendererOverwritten`, `__RendererOverwriteTimer` - temporary timer-based override system (code smell)
- **Duplicate layer logic**: `getLayersForState()` returns different layer combinations for each state - should be data-driven
- **Scattered responsibility**: Handles terrain caching, button groups, queen panels, fireball effects, pause overlays, game over screens

**EntityLayerRenderer Issues:**
- **Frustum culling disabled** with comment "TEMPORARILY DISABLED FOR DEBUGGING" (technical debt marker)
- **Camera transform confusion**: Culling checks convert world → screen but comments indicate uncertainty
- **Performance tracking bloat**: PerformanceMonitor calls embedded in render loops
- **Console.log pollution**: Debugging logs left in production code (`console.log('[EntityRenderer] collectAnts()...'`)
- **Manual entity collection**: Separate methods for resources, ants, buildings (not extensible)

**UILayerRenderer Issues:**
- **Duplicate HUD rendering**: Checks for `draggablePanelManager` then falls back to hardcoded rendering
- **Unused initialization**: `buttons[]` array created but never properly managed
- **Fallback chaos**: Multiple fallback paths for toolbar, minimap, performance overlay
- **Button state leakage**: Manually managing button active states in render loop

**Coordinate Transform Madness:**
- **5+ different coordinate systems**: Screen, world, grid, canvas, viewport
- **No centralized converter**: Each system reimplements conversions (different formulas, different bugs)
- **Transform order confusion**: Some systems do `translate → scale`, others do `scale → translate`
- **push()/pop() hell**: 100+ push/pop pairs scattered across rendering code (easy to miss, causes visual bugs)

**Camera System Issues:**
- **3 camera classes**: CameraManager, CustomLevelCamera, CameraSystemManager (each 300-600 lines)
- **Duplicate logic**: All 3 implement pan, zoom, follow, bounds checking differently
- **State transfer fragility**: When switching cameras, manual property copying with fallbacks
- **Coordinate conversion duplicated**: Each camera class has its own `screenToWorld()`, `worldToScreen()` implementations

### Target State (After Refactoring)

**Metrics Table:**

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| **Total LOC** | ~45,000 | ~22,500 | **-50%** |
| **Script Tags** | 280 | 3-5 | **-99%** |
| **Global Variables** | 40+ | 2-3 | **-95%** |
| **Manager Classes** | 30+ | 10 | **-67%** |
| **Entity Boilerplate** | 100 lines/entity | 10 lines/entity | **-90%** |
| **Build Time** | 0s (no build) | 2-5s | n/a |
| **Load Time** | 5-10s | 1-2s | **-80%** |
| **Test Coverage** | ~60% | 85% | **+25%** |
| **Rendering Code** | 2000+ lines | 800 lines | **-60%** |
| **Coordinate Systems** | 5 incompatible | 1 unified | **-80%** |
| **Camera Classes** | 3 overlapping | 1 modular | **-67%** |

---

## Phase 1: Global State Elimination (Weeks 1-3)

**Goal**: Centralize all global state into managed contexts

### 1.1 Create GameContext Class (Week 1)

**Before:**
```javascript
// sketch.js (40+ globals)
let ants = [];
let Buildings = [];
let queenAnt = null;
let g_map2 = null;
let g_activeMap = null;
let cameraManager = null;
let g_mouseController = null;
let g_keyboardController = null;
// ... 32 more globals
```

**After:**
```javascript
// Classes/core/GameContext.js
class GameContext {
  constructor() {
    this.entities = new EntityManager();      // ants, buildings, resources
    this.world = new WorldManager();          // maps, terrain
    this.camera = new CameraSystem();         // camera, viewport
    this.input = new InputManager();          // mouse, keyboard, touch
    this.time = new TimeManager();            // deltaTime, gameClock
  }
  
  // Controlled access, no direct property modification
  getEntities(type) { return this.entities.getByType(type); }
  getActiveMap() { return this.world.activeMap; }
}

// sketch.js
const gameContext = new GameContext();
```

**Benefits:**
- ✅ Single source of truth
- ✅ Testable (mock GameContext)
- ✅ Type safety (can add TypeScript later)
- ✅ Clear ownership (who manages what)

**Checklist:**
- [ ] Create `Classes/core/GameContext.js` with TDD tests
- [ ] Create `EntityManager`, `WorldManager`, `CameraSystem`, `InputManager`, `TimeManager` stubs
- [ ] Migrate 5 highest-impact globals (ants, Buildings, g_map2, cameraManager, queenAnt)
- [ ] Update sketch.js to use `gameContext.entities.getAnts()` instead of `ants[]`
- [ ] Run full test suite (ensure no regressions)
- [ ] Migrate remaining 35 globals in batches of 5-10
- [ ] Update all files referencing old globals (grep search for each)
- [ ] Final test pass

**Expected Metrics:**
- Globals: 40 → 5 (-87%)
- Test setup time: 500ms → 50ms (-90%)
- Files touched: ~150

---

## Phase 2: Module System Migration (Weeks 4-6)

**Goal**: Replace manual script loading with modern ES6 modules + bundler

### 2.1 Setup Rollup Build System (Week 4)

**Before:**
```html
<!-- index.html (280+ script tags) -->
<script src="debug/verboseLogger.js"></script>
<script src="Classes/rendering/RenderLayerManager.js"></script>
<script src="Classes/rendering/EntityLayerRenderer.js"></script>
<script src="Classes/rendering/UILayerRenderer.js"></script>
<!-- ... 276 more tags -->
```

**After:**
```html
<!-- index.html (3 script tags) -->
<script type="module" src="dist/vendor.js"></script>  <!-- p5.js, libraries -->
<script type="module" src="dist/game.js"></script>    <!-- game code -->
<script type="module" src="dist/editor.js"></script>  <!-- level editor (lazy loaded) -->
```

**Build Config:**
```javascript
// rollup.config.js
export default {
  input: 'src/main.js',
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true,
    manualChunks: {
      vendor: ['p5'], // Separate vendor bundle
      editor: ['./src/levelEditor/LevelEditor.js'] // Lazy load editor
    }
  },
  plugins: [
    resolve(),        // Resolve node_modules
    commonjs(),       // Convert CJS to ES6
    terser()          // Minify production
  ]
};
```

**Benefits:**
- ✅ Tree-shaking (remove unused code automatically)
- ✅ Code splitting (load editor only when needed)
- ✅ Hot module replacement (faster dev iteration)
- ✅ Minification + source maps (smaller bundles, easier debugging)
- ✅ TypeScript support (add later)

**Checklist:**
- [ ] Install Rollup + plugins (`npm install --save-dev rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs rollup-plugin-terser`)
- [ ] Create `rollup.config.js` with 3 entry points (game, editor, vendor)
- [ ] Convert sketch.js to ES6 module (`import GameContext from './core/GameContext.js'`)
- [ ] Convert Entity.js to ES6 module (export class Entity)
- [ ] Create migration script to auto-convert 280 files:
  ```bash
  # Convert global assignments to exports
  sed -i 's/window\.\([A-Z][a-zA-Z]*\) = /export /g' Classes/**/*.js
  sed -i 's/if (typeof module !== "undefined") module.exports = /export default /g' Classes/**/*.js
  ```
- [ ] Test build (`npm run build` → verify dist/ output)
- [ ] Test in browser (verify game loads correctly)
- [ ] Setup dev server with live reload (`rollup -c -w`)
- [ ] Update package.json scripts (`npm run dev`, `npm run build`)
- [ ] Update CI/CD to run build before tests

**Expected Metrics:**
- Script tags: 280 → 3 (-99%)
- Bundle size: 3.5MB → 1.2MB (-66% with minification)
- Load time: 5-10s → 1-2s (-80%)
- Build time: 0s → 2-5s

---

## Phase 3: Entity Component System (ECS) (Weeks 7-10)

**Goal**: Replace controller explosion with true composition pattern

**CRITICAL CONTEXT - Current Entity System Problems:**

**Ant Class (700+ lines):**
- Extends Entity (843 lines) → **1543 lines total to create one ant**
- **Duplicate state management**: StatsContainer, ResourceManager, AntStateMachine, GatherState, _health, _maxHealth, _damage
- **Controller access boilerplate**: 9 getter properties just for test compatibility
- **God object**: Handles combat, movement, resources, state, rendering, death, cleanup
- **Global pollution**: 12+ globals (`ants[]`, `antIndex`, `queenSize`, `hasDeLozier`, `hasQueen`, `selectedAnt`, `JobImages`, `antManager`)
- **Manual cleanup nightmare**: `_removeFromGame()` manually clears 5+ different systems
- **Hardcoded job stats**: `_getFallbackJobStats()` switch statement with 7 cases

**Resource Class (200+ lines):**
- **Backward compatibility hell**: 5+ different constructor signatures
- **Rendering chaos**: Calls `super.render()`, then applies highlight manually
- **Deprecated methods**: `isMouseOver()` with console warnings
- **Resource type confusion**: Both `type` and `resourceType` exist
- **Carried state confusion**: Resources track carrier but update position every frame with try-catch fallbacks

**Entity Class (843 lines):**
- **Always creates 8 controllers** whether needed or not
- **Tile offset confusion**: `+0.5 tile offset` for "visual centering" (architecture smell)
- **Manual controller initialization**: 80+ lines of typeof checks and try-catch
- **Enhanced API over-engineering**: `highlight`, `effects`, `rendering`, `config` namespace objects
- **Spatial grid coupling**: Auto-registers with `spatialGridManager`
- **Debugger overhead**: Creates UniversalDebugger for every entity

**Controllers (19 files, 5000+ lines):**
- Every controller stores `this._entity` (19 times)
- Every controller has `constructor(entity)` (19 times)
- Inconsistent update patterns (some have `update()`, some don't)
- No base class (all repeat entity reference storage)
- Tight coupling (controllers access `this._entity._stateMachine`, `this._entity._sprite` directly)
- **RenderController alone: 1053 lines** (10 highlight types, 7 state indicators, 4 terrain indicators)

**Expected Deletions:**
| File | Lines Deleted |
|------|---------------|
| ants.js | 700 |
| Resource.js | 200 |
| Entity.js | 843 |
| 19 Controllers | 5000+ |
| **Total** | **6743 lines deleted** |

**Expected Additions:**
| File | Lines Added |
|------|-------------|
| BaseComponent.js | 20 |
| 6 Component Classes | 180 |
| BaseSystem.js | 40 |
| 3 System Classes | 240 |
| Entity.js (new) | 80 |
| EntityFactory.js | 100 |
| EntityManager.js | 150 |
| **Total** | **810 lines added** |

**Net Change: -5933 lines (-88%!)**

---

### 3.1 ECS Architecture (Week 7)

**Before (Controller Explosion):**
```javascript
// Entity.js (843 lines with 100+ lines of boilerplate)
class Entity {
  constructor(x, y, width, height) {
    // Apply +0.5 tile offset for visual centering (architecture smell)
    const TILE_SIZE = typeof window !== 'undefined' && window.TILE_SIZE ? window.TILE_SIZE : 32;
    const centeredX = x + (TILE_SIZE * 0.5);
    const centeredY = y + (TILE_SIZE * 0.5);
    
    this._controllers = new Map();
    
    // Always create 8 controllers, even if unused
    const availableControllers = {
      'transform': typeof TransformController !== 'undefined' ? TransformController : null,
      'movement': typeof MovementController !== 'undefined' ? MovementController : null,
      'render': typeof RenderController !== 'undefined' ? RenderController : null,
      'selection': typeof SelectionController !== 'undefined' ? SelectionController : null,
      'combat': typeof CombatController !== 'undefined' ? CombatController : null,
      'terrain': typeof TerrainController !== 'undefined' ? TerrainController : null,
      'taskManager': typeof TaskManager !== 'undefined' ? TaskManager : null,
      'health': typeof HealthController !== 'undefined' ? HealthController : null,
    };
    
    // Manual initialization with try-catch (80+ lines)
    Object.entries(availableControllers).forEach(([name, ControllerClass]) => {
      if (ControllerClass) {
        try {
          this._controllers.set(name, new ControllerClass(this));
        } catch (error) {
          console.error(`Failed to initialize ${name} controller:`, error);
        }
      }
    });
    
    // Enhanced API over-engineering (60+ lines of namespace objects)
    this.highlight = { selected: () => {}, hover: () => {}, clear: () => {} /* +10 more */ };
    this.effects = { shake: () => {}, flash: () => {} /* +8 more */ };
    this.rendering = { /* 60+ lines */ };
    this.config = { /* 40+ lines */ };
    
    // Auto-register with spatial grid (tight coupling)
    if (typeof spatialGridManager !== 'undefined') {
      spatialGridManager.registerEntity(this);
    }
    
    // Create debugger for every entity (performance overhead)
    if (typeof UniversalDebugger !== 'undefined') {
      this._debugger = new UniversalDebugger(this);
    }
  }
}

// ants.js - Ant class extends Entity (700+ lines)
class ant extends Entity {
  constructor(x, y, w, h, options = {}) {
    super(x, y, w, h);
    
    // 9 getter properties just for test compatibility
    get _movementController() { return this.getController('movement'); }
    get _taskManager() { return this.getController('taskManager'); }
    get _renderController() { return this.getController('render'); }
    // ... 6 more getters
    
    // Duplicate position accessors (compatibility hell)
    get posX() { return this.getPosition().x; }
    set posX(value) { const p = this.getPosition(); this.setPosition(value, p.y); }
    
    // Manual cleanup nightmare (removes from 5+ systems)
    _removeFromGame() {
      const index = ants.indexOf(this);
      if (index !== -1) ants.splice(index, 1);
      g_tileInteractionManager.removeObjectFromTile(this, tileX, tileY);
      g_selectionBoxController.entities = ants;
      ants.forEach(otherAnt => {
        if (otherAnt._combatTarget === this) otherAnt._combatTarget = null;
      });
      updateUISelectionEntities();
      const sidx = selectables.indexOf(this);
      if (sidx !== -1) selectables.splice(sidx, 1);
    }
  }
}

// Every ant gets 8 controllers + 843 lines of Entity boilerplate
const ant = new ant(100, 100, 32, 32); // 1543 lines of code executed!
```

**After (True ECS - 810 lines vs 6743 lines, -88%):**

See detailed code examples in sections 3.2-3.4 below.

**Summary:**
- BaseComponent (20 lines) + 6 component classes (180 lines)
- BaseSystem (40 lines) + 3 system classes (240 lines)  
- Entity (80 lines), EntityFactory (100 lines), EntityManager (150 lines)
- **Total: 810 lines replaces 6743 lines of old code**

**Benefits:**
- ✅ Only pay for what you use (ant with 5 components = 50 lines, not 1543)
- ✅ Cache-friendly (systems iterate arrays, not maps)
- ✅ Parallel processing (systems can run in workers)
- ✅ Easy testing (mock individual components)
- ✅ Runtime composition (add/remove components dynamically)
- ✅ No global pollution (EntityManager replaces global ants[] array)
- ✅ No manual cleanup (EntityManager.destroy() handles everything)

---

### 3.2 Create Component System Foundation (Weeks 7-8)

#### 3.2.1 Create BaseComponent (Week 7, Day 1)

**Test First (TDD):**
```javascript
// test/unit/ecs/BaseComponent.test.js
const { expect } = require('chai');

describe('BaseComponent', function() {
  it('should store entity reference', function() {
    const entity = { id: 'test_1' };
    const component = new BaseComponent(entity);
    expect(component.entity).to.equal(entity);
  });
  
  it('should have enabled flag', function() {
    const component = new BaseComponent({});
    expect(component.enabled).to.be.true);
  });
  
  it('should be disableable', function() {
    const component = new BaseComponent({});
    component.enabled = false;
    expect(component.enabled).to.be.false;
  });
});
```

**Implementation** (see full code in Entity System Refactoring document for all components).

#### 3.2.2 Create Core Components (Week 7, Days 2-5)

Create 6 component classes:
1. **PositionComponent** (25 lines) - Replaces TransformController
2. **RenderComponent** (30 lines) - Replaces RenderController's 1053 lines
3. **HealthComponent** (30 lines) - Replaces scattered health properties
4. **MovementComponent** (40 lines) - Replaces MovementController
5. **CombatComponent** (35 lines) - Replaces combat logic in Ant
6. **ResourceComponent** (20 lines) - Replaces Resource class properties

**Checklist (Week 7):**
- [ ] Day 1: Write BaseComponent tests (TDD)
- [ ] Day 1: Implement BaseComponent
- [ ] Day 1: Run tests (should pass)
- [ ] Day 2: Write PositionComponent tests
- [ ] Day 2: Implement PositionComponent
- [ ] Day 3: Write RenderComponent tests
- [ ] Day 3: Implement RenderComponent
- [ ] Day 3: Write HealthComponent tests
- [ ] Day 3: Implement HealthComponent
- [ ] Day 4: Write MovementComponent tests
- [ ] Day 4: Implement MovementComponent
- [ ] Day 5: Write CombatComponent + ResourceComponent tests
- [ ] Day 5: Implement CombatComponent + ResourceComponent
- [ ] Day 5: Add all components to index.html (temporary, removed in Phase 2)

#### 3.2.3 Create BaseSystem (Week 8, Day 1)

**Test First (TDD):**
```javascript
// test/unit/ecs/BaseSystem.test.js
describe('BaseSystem', function() {
  it('should have priority', function() {
    const system = new BaseSystem(10);
    expect(system.priority).to.equal(10);
  });
  
  it('should filter entities by component requirements', function() {
    const system = new BaseSystem();
    system.requiredComponents = ['PositionComponent'];
    
    const entities = [
      { components: new Map([['PositionComponent', {}]]) },
      { components: new Map([['RenderComponent', {}]]) }
    ];
    
    const filtered = system.getEntitiesWithComponents(entities);
    expect(filtered.length).to.equal(1);
  });
});
```

#### 3.2.4 Create Core Systems (Week 8, Days 2-5)

Create 3 system classes:
1. **MovementSystem** (80 lines) - Replaces MovementController update logic
2. **RenderSystem** (100 lines) - Replaces RenderController render logic
3. **CombatSystem** (60 lines) - Replaces combat logic scattered in Ant

**Checklist (Week 8):**
- [ ] Day 1: Write BaseSystem tests
- [ ] Day 1: Implement BaseSystem
- [ ] Day 2: Write MovementSystem tests
- [ ] Day 2: Implement MovementSystem
- [ ] Day 3: Write RenderSystem tests
- [ ] Day 3: Implement RenderSystem (integrate with CoordinateSystem from Phase 5)
- [ ] Day 4: Write CombatSystem tests
- [ ] Day 4: Implement CombatSystem
- [ ] Day 5: Add all systems to index.html
- [ ] Day 5: Create `Classes/ecs/` directory structure
- [ ] Day 5: Run full component + system test suite

---

### 3.3 Create New Entity System (Week 9)

#### 3.3.1 Create Simplified Entity (Week 9, Days 1-2)

**New Entity** (80 lines vs current 843):

See full code in section 3.1 above. Key changes:
- No controller initialization (100+ lines removed)
- No enhanced API namespaces (60+ lines removed)
- No spatial grid coupling (removed)
- No debugger overhead (removed)
- No tile offset confusion (removed)

**Checklist:**
- [ ] Write Entity tests (TDD)
- [ ] Implement Entity (80 lines)
- [ ] Test addComponent/getComponent/removeComponent
- [ ] Test destroy() lifecycle
- [ ] Add Entity.js to index.html

#### 3.3.2 Create EntityFactory (Week 9, Days 3-4)

**Factory Pattern** (100 lines replaces 700-line Ant class + 200-line Resource class):

See full code in section 3.1 above. Key features:
- `createAnt(x, y, jobName, faction)` - Pre-configured ant entities
- `createResource(x, y, resourceType)` - Pre-configured resource entities
- Job stats lookup (speed, health, damage) - No more hardcoded switch statements

**Checklist:**
- [ ] Write EntityFactory tests
- [ ] Implement EntityFactory
- [ ] Test createAnt() (verify components added correctly)
- [ ] Test createResource()
- [ ] Test job stats (Scout vs Warrior vs Queen)
- [ ] Add EntityFactory.js to index.html

#### 3.3.3 Create EntityManager (Week 9, Day 5)

**EntityManager** (150 lines replaces global `ants[]` array and scattered management):

See full code in section 3.1 above. Key features:
- Centralized spawn/destroy (no more manual array management)
- Type-based queries (`getByType('Ant')`)
- Auto-cleanup of dead entities (no more manual `_removeFromGame()`)
- Performance stats (`getStats()` for debugging)

**Checklist:**
- [ ] Write EntityManager tests
- [ ] Implement EntityManager
- [ ] Test spawn/destroy lifecycle
- [ ] Test getByType filtering
- [ ] Test auto-cleanup of dead entities
- [ ] Add EntityManager.js to index.html

---

### 3.4 Migration Strategy (Week 10)

#### 3.4.1 Parallel Entity Systems

**Run old and new systems side-by-side:**

```javascript
// sketch.js - Modified draw() loop
function draw() {
  const deltaTime = (frameCount > 0) ? (millis() - lastFrameTime) / 1000 : 0.016;
  lastFrameTime = millis();
  
  // Update old system (legacy ants)
  if (FEATURE_FLAGS.USE_OLD_ENTITIES) {
    antsUpdate();
  }
  
  // Update new system (ECS entities)
  if (FEATURE_FLAGS.USE_ECS) {
    movementSystem.update(entityManager.getAllEntities(), deltaTime);
    combatSystem.update(entityManager.getAllEntities(), deltaTime);
    entityManager.update(); // Cleanup dead entities
  }
  
  // Render old system
  if (FEATURE_FLAGS.USE_OLD_ENTITIES) {
    antsRender();
  }
  
  // Render new system
  if (FEATURE_FLAGS.USE_ECS) {
    renderSystem.update(entityManager.getAllEntities(), deltaTime);
  }
}
```

**Feature Flags:**
```javascript
// Classes/core/FeatureFlags.js
const FEATURE_FLAGS = {
  USE_OLD_ENTITIES: true,  // Legacy ant system
  USE_ECS: true,           // New ECS system (parallel)
  MIGRATE_ANTS: false      // Gradually convert ants to ECS
};
```

#### 3.4.2 Gradual Migration (10 ants per day)

```javascript
// Classes/ecs/Migration.js
class EntityMigration {
  static convertAntToECS(oldAnt) {
    const pos = oldAnt.getPosition();
    const newAnt = EntityFactory.createAnt(pos.x, pos.y, oldAnt.JobName, oldAnt.faction);
    
    // Copy health
    const health = newAnt.getComponent('HealthComponent');
    health.current = oldAnt.health;
    health.max = oldAnt.maxHealth;
    
    // Copy movement target
    if (oldAnt.isMoving) {
      const movement = newAnt.getComponent('MovementComponent');
      const target = oldAnt._movementController.getTarget();
      if (target) movement.setTarget(target.x, target.y);
    }
    
    // Register with EntityManager
    entityManager.spawn(newAnt);
    
    // Remove old ant
    const index = ants.indexOf(oldAnt);
    if (index !== -1) ants.splice(index, 1);
    
    return newAnt;
  }
  
  static migrateOldestAnts(count = 10) {
    const toMigrate = ants.slice(0, count);
    for (const ant of toMigrate) {
      this.convertAntToECS(ant);
    }
  }
}
```

**Checklist (Week 10):**
- [ ] Day 1: Set up feature flags
- [ ] Day 1: Enable both old and new systems in parallel
- [ ] Day 1: Write migration script
- [ ] Day 1: Migrate 10 ants (verify no crashes)
- [ ] Day 2: Migrate 10 more ants (verify behavior matches old system)
- [ ] Day 3: Migrate 10 more ants
- [ ] Day 4: Migrate 10 more ants
- [ ] Day 5: Migrate remaining ants (all ants now ECS)
- [ ] Day 5: Disable old system (`FEATURE_FLAGS.USE_OLD_ENTITIES = false`)
- [ ] Day 5: Test game (full playthrough, verify no regressions)

---

### 3.5 Delete Legacy Code (Post-Week 10)

**Once all entities migrated and tested, delete old code:**

**Checklist:**
- [ ] Delete `Classes/ants/ants.js` (700 lines)
- [ ] Delete `Classes/resources/Resource.js` (200 lines)
- [ ] Delete `Classes/containers/Entity.js` (843 lines)
- [ ] Delete 19 controller files (Controllers/*.js, 5000+ lines total)
- [ ] Delete global variable declarations from sketch.js (15+ variables)
- [ ] Remove 280+ script tags from index.html (controllers, old entity)
- [ ] Add 14 script tags for ECS system:
  - BaseComponent.js, 6 component files
  - BaseSystem.js, 3 system files
  - Entity.js, EntityFactory.js, EntityManager.js, Migration.js
- [ ] Update all tests to use ECS API
- [ ] Run full test suite (`npm test` - no regressions)
- [ ] Performance test (1000 entities at 60fps)

**Expected Deletions:**
| File | Lines Deleted |
|------|---------------|
| ants.js | 700 |
| Resource.js | 200 |
| Entity.js | 843 |
| 19 Controllers | 5000+ |
| **Total** | **6743 lines deleted** |

**New Files Added:**
| File | Lines Added |
|------|-------------|
| BaseComponent.js | 20 |
| 6 Component Classes | 180 |
| BaseSystem.js | 40 |
| 3 System Classes | 240 |
| Entity.js (new) | 80 |
| EntityFactory.js | 100 |
| EntityManager.js | 150 |
| **Total** | **810 lines added** |

**Net Change: -5933 lines (-88%!)**

---

### 3.6 Expected Metrics (After Phase 3)

**Performance Improvements:**
- Entity boilerplate: 1543 lines → 50 lines (-97%)
- Memory per entity: 5KB → 500B (-90%)
- Entity creation time: 50ms → 5ms (-90%)
- LOC deleted: 6743 lines
- LOC added: 810 lines
- **Net reduction: -5933 lines (-88%)**

**Code Quality Improvements:**
- No more global `ants[]` array (managed by EntityManager)
- No more 8 mandatory controllers (only add what you need)
- No more manual cleanup (EntityManager handles it)
- No more hardcoded job stats (EntityFactory lookups)
- No more 9 getter properties for test compatibility
- No more duplicate position accessors
- No more controller access boilerplate

**Testability Improvements:**
- Components testable in isolation (mock entity reference)
- Systems testable in isolation (pass mock entity arrays)
- EntityManager testable (no global dependencies)
- EntityFactory testable (pure functions)

---

## Phase 4: Manager Consolidation (Weeks 11-14)

**Goal**: Reduce 30+ managers to 10 focused services

### 4.1 Service Architecture (Week 11)

**Current Managers (30+):**
```
AntManager               ResourceSystemManager    SpatialGridManager
MapManager              ResourceManager          soundManager
GameStateManager        pheromoneControl         ShortcutManager
EventManager            MiddleClickPan           SettingsManager
CameraSystemManager     (and 18 more...)
BuildingManager
TileInteractionManager
```

**Consolidated Services (10):**
```javascript
// Classes/services/
EntityService           // All entity management (ants, buildings, resources)
WorldService            // Maps, terrain, spatial grid
CameraService           // Camera, viewport, transforms
InputService            // Mouse, keyboard, shortcuts
AudioService            // Sound effects, music, volume
UIService               // Panels, dialogs, tooltips
EventService            // Event system, triggers
PhysicsService          // Collision, movement, pathfinding
AIService               // Ant behavior, state machines
SaveService             // Save/load, level import/export
```

**Before (Manager Chaos):**
```javascript
// Scattered across 30 files
class AntManager {
  spawnAnt() { ... }
  updateAnts() { ... }
  removeAnt() { ... }
}

class ResourceManager {
  spawnResource() { ... }
  updateResources() { ... }
  removeResource() { ... }
}

class BuildingManager {
  spawnBuilding() { ... }
  updateBuildings() { ... }
  removeBuilding() { ... }
}
// 27 more similar managers...
```

**After (Unified EntityService):**
```javascript
// Classes/services/EntityService.js
class EntityService {
  constructor() {
    this.entities = new Map(); // ID → entity
    this.entitiesByType = new Map(); // type → Set<entity>
  }
  
  spawn(type, config) {
    const entity = EntityFactory.create(type, config);
    this.entities.set(entity.id, entity);
    
    if (!this.entitiesByType.has(type)) {
      this.entitiesByType.set(type, new Set());
    }
    this.entitiesByType.get(type).add(entity);
    
    return entity;
  }
  
  getByType(type) {
    return Array.from(this.entitiesByType.get(type) || []);
  }
  
  remove(entityId) {
    const entity = this.entities.get(entityId);
    if (entity) {
      this.entitiesByType.get(entity.type).delete(entity);
      this.entities.delete(entityId);
    }
  }
  
  update(deltaTime) {
    for (const entity of this.entities.values()) {
      if (entity.update) entity.update(deltaTime);
    }
  }
}
```

**Responsibility Mapping:**

| Old Managers | New Service | Rationale |
|--------------|-------------|-----------|
| AntManager, ResourceManager, BuildingManager | EntityService | All entity CRUD operations |
| MapManager, SpatialGridManager | WorldService | World state, spatial queries |
| CameraSystemManager, CameraManager, CustomLevelCamera | CameraService | Single camera abstraction |
| g_mouseController, g_keyboardController, ShortcutManager | InputService | All input handling |
| soundManager, (audio managers) | AudioService | Sound/music management |
| pheromoneControl, MiddleClickPan, SettingsManager | (Delete or merge) | Functionality absorbed by other services |

**Checklist:**
- [ ] Create 10 service interfaces with TDD
- [ ] Migrate AntManager → EntityService (ants only)
- [ ] Migrate ResourceManager → EntityService (resources)
- [ ] Migrate BuildingManager → EntityService (buildings)
- [ ] Test EntityService with 100 entities (performance)
- [ ] Migrate MapManager + SpatialGridManager → WorldService
- [ ] Migrate 3 camera classes → CameraService
- [ ] Migrate input controllers → InputService
- [ ] Delete 20+ old manager files
- [ ] Update all references to old managers

**Expected Metrics:**
- Manager classes: 30 → 10 (-67%)
- LOC: ~8000 → ~3000 (-62%)
- Circular dependencies: 15 → 0 (-100%)
- Service initialization time: 200ms → 50ms (-75%)

---

## Phase 5: Rendering System Overhaul (Weeks 15-18)

**Goal**: Consolidate rendering code, unify coordinate systems, eliminate duplicati on

### 5.1 Unified Rendering Architecture (Week 15)

**Current Issues:**
- RenderLayerManager: 900+ lines, inline implementations, tight coupling
- EntityLayerRenderer: Disabled culling, camera confusion, console.log pollution
- UILayerRenderer: Duplicate HUD rendering, unused initialization
- 3 camera classes with duplicate logic
- 5 coordinate systems (screen, world, grid, canvas, viewport)
- 100+ push/pop pairs scattered everywhere

**New Architecture:**

```
RenderPipeline (orchestrator, 100 lines)
├── LayerRegistry (data-driven layer config)
├── CoordinateSystem (single source of truth)
├── Camera (unified camera, 200 lines)
└── Renderers
    ├── TerrainRenderer (delegates to MapManager)
    ├── EntityRenderer (iterates ECS entities)
    ├── EffectsRenderer (particles, visual effects)
    └── UIRenderer (HUD, panels, debug)
```

**5.1.1 Unified CoordinateSystem (Week 15)**

**Before (5 incompatible systems):**
```javascript
// System 1: Screen coords
const screenX = mouseX;
const screenY = mouseY;

// System 2: World coords (RenderLayerManager)
const worldX = screenX / zoom + cameraX;
const worldY = screenY / zoom + cameraY;

// System 3: World coords (CameraManager - DIFFERENT FORMULA!)
const worldX = (screenX - cameraX) / zoom;
const worldY = (screenY - cameraY) / zoom;

// System 4: Grid coords
const gridX = Math.floor(worldX / TILE_SIZE);
const gridY = Math.floor(worldY / TILE_SIZE);

// System 5: Canvas coords (Level Editor)
const canvasX = screenX - canvasOffsetX;
const canvasY = screenY - canvasOffsetY;
```

**After (Unified CoordinateSystem):**
```javascript
// Classes/rendering/CoordinateSystem.js
class CoordinateSystem {
  constructor(camera, tileSize = 32) {
    this.camera = camera;
    this.tileSize = tileSize;
  }
  
  // Single source of truth for all conversions
  screenToWorld(screenX, screenY) {
    const zoom = this.camera.getZoom();
    const cameraPos = this.camera.getPosition();
    return {
      x: (screenX / zoom) + cameraPos.x,
      y: (screenY / zoom) + cameraPos.y
    };
  }
  
  worldToScreen(worldX, worldY) {
    const zoom = this.camera.getZoom();
    const cameraPos = this.camera.getPosition();
    return {
      x: (worldX - cameraPos.x) * zoom,
      y: (worldY - cameraPos.y) * zoom
    };
  }
  
  worldToGrid(worldX, worldY) {
    return {
      x: Math.floor(worldX / this.tileSize),
      y: Math.floor(worldY / this.tileSize)
    };
  }
  
  gridToWorld(gridX, gridY) {
    return {
      x: gridX * this.tileSize,
      y: gridY * this.tileSize
    };
  }
  
  // Convenience methods
  mouseToWorld() {
    return this.screenToWorld(mouseX, mouseY);
  }
  
  mouseToGrid() {
    const world = this.mouseToWorld();
    return this.worldToGrid(world.x, world.y);
  }
}

// Usage (everywhere in codebase)
const coordSystem = gameContext.rendering.coordSystem;
const worldPos = coordSystem.screenToWorld(mouseX, mouseY);
const gridPos = coordSystem.worldToGrid(worldPos.x, worldPos.y);
```

**Benefits:**
- ✅ One formula, tested once, used everywhere
- ✅ No more coordinate bugs from inconsistent conversions
- ✅ Easy to add new coordinate spaces (viewport, tile, chunk)
- ✅ Testable (mock camera, verify conversions)

**5.1.2 Unified Camera System (Week 16)**

**Before (3 overlapping camera classes):**
- CameraManager.js (600 lines) - Procedural levels
- CustomLevelCamera.js (400 lines) - Custom levels
- CameraSystemManager.js (300 lines) - Switcher between the two

**After (1 modular Camera class):**
```javascript
// Classes/rendering/Camera.js (200 lines)
class Camera {
  constructor(viewport) {
    this.viewport = viewport; // { width, height }
    this.position = { x: 0, y: 0 };
    this.zoom = 1.0;
    
    // Modes (pluggable behaviors)
    this.modes = {
      free: new FreeCameraMode(this),
      follow: new FollowCameraMode(this),
      bounded: new BoundedCameraMode(this)
    };
    this.currentMode = this.modes.free;
  }
  
  setMode(modeName) {
    this.currentMode = this.modes[modeName];
  }
  
  update(deltaTime) {
    this.currentMode.update(deltaTime);
  }
  
  // Core camera API (same for all modes)
  getPosition() { return { ...this.position }; }
  setPosition(x, y) { this.position.x = x; this.position.y = y; }
  getZoom() { return this.zoom; }
  setZoom(zoom) { this.zoom = Math.max(0.1, Math.min(5, zoom)); }
  
  // Transform helpers
  applyTransform(p5Context) {
    p5Context.push();
    p5Context.translate(-this.position.x, -this.position.y);
    p5Context.scale(this.zoom);
  }
  
  restoreTransform(p5Context) {
    p5Context.pop();
  }
}

// Classes/rendering/camera/FreeCameraMode.js
class FreeCameraMode {
  constructor(camera) {
    this.camera = camera;
    this.isPanning = false;
  }
  
  update(deltaTime) {
    // Handle WASD/arrow keys for free movement
    if (keyIsDown(LEFT_ARROW)) this.camera.position.x -= 5;
    if (keyIsDown(RIGHT_ARROW)) this.camera.position.x += 5;
  }
}

// Classes/rendering/camera/FollowCameraMode.js
class FollowCameraMode {
  constructor(camera) {
    this.camera = camera;
    this.target = null;
    this.smoothing = 0.1;
  }
  
  setTarget(entity) { this.target = entity; }
  
  update(deltaTime) {
    if (!this.target) return;
    
    const targetPos = this.target.getComponent('PositionComponent');
    if (targetPos) {
      // Smooth camera follow
      this.camera.position.x += (targetPos.x - this.camera.position.x) * this.smoothing;
      this.camera.position.y += (targetPos.y - this.camera.position.y) * this.smoothing;
    }
  }
}

// Classes/rendering/camera/BoundedCameraMode.js (for custom levels)
class BoundedCameraMode extends FollowCameraMode {
  constructor(camera) {
    super(camera);
    this.bounds = null; // { x, y, width, height }
  }
  
  setBounds(bounds) { this.bounds = bounds; }
  
  update(deltaTime) {
    super.update(deltaTime); // Follow target
    
    // Clamp camera to bounds
    if (this.bounds) {
      const halfViewport = {
        x: this.camera.viewport.width / (2 * this.camera.zoom),
        y: this.camera.viewport.height / (2 * this.camera.zoom)
      };
      
      this.camera.position.x = Math.max(
        this.bounds.x + halfViewport.x,
        Math.min(this.bounds.x + this.bounds.width - halfViewport.x, this.camera.position.x)
      );
      this.camera.position.y = Math.max(
        this.bounds.y + halfViewport.y,
        Math.min(this.bounds.y + this.bounds.height - halfViewport.y, this.camera.position.y)
      );
    }
  }
}
```

**Benefits:**
- ✅ 1 camera class instead of 3 (1300 lines → 200 lines, -85%)
- ✅ Pluggable modes (easy to add new behaviors)
- ✅ No state transfer (same camera, different modes)
- ✅ Testable (mock modes, verify behavior)

**5.1.3 Data-Driven Rendering Pipeline (Week 17)**

**Before (Hardcoded Layer Logic):**
```javascript
// RenderLayerManager.js - getLayersForState()
getLayersForState(gameState) {
  switch (gameState) {
    case 'MENU':
      return [this.layers.TERRAIN, this.layers.UI_MENU];
    case 'PLAYING':
      return [this.layers.TERRAIN, this.layers.ENTITIES, this.layers.EFFECTS, this.layers.UI_GAME, this.layers.UI_DEBUG];
    case 'PAUSED':
      return [this.layers.TERRAIN, this.layers.ENTITIES, this.layers.EFFECTS, this.layers.UI_GAME];
    case 'LEVEL_EDITOR':
      return [this.layers.UI_GAME, this.layers.UI_DEBUG];
    // ... 5 more cases
  }
}
```

**After (Data-Driven Config):**
```javascript
// config/rendering-layers.json
{
  "layers": [
    { "name": "TERRAIN", "order": 0, "needsCamera": true },
    { "name": "ENTITIES", "order": 1, "needsCamera": true },
    { "name": "EFFECTS", "order": 2, "needsCamera": true },
    { "name": "UI_GAME", "order": 3, "needsCamera": false },
    { "name": "UI_DEBUG", "order": 4, "needsCamera": false },
    { "name": "UI_MENU", "order": 5, "needsCamera": false }
  ],
  "states": {
    "MENU": ["TERRAIN", "UI_MENU"],
    "PLAYING": ["TERRAIN", "ENTITIES", "EFFECTS", "UI_GAME", "UI_DEBUG"],
    "PAUSED": ["TERRAIN", "ENTITIES", "EFFECTS", "UI_GAME"],
    "LEVEL_EDITOR": ["UI_GAME", "UI_DEBUG"]
  }
}

// Classes/rendering/RenderPipeline.js (100 lines, not 900)
class RenderPipeline {
  constructor(layerConfig) {
    this.layers = new Map();
    this.stateConfig = layerConfig.states;
    
    // Register layers from config
    layerConfig.layers.forEach(layerDef => {
      this.layers.set(layerDef.name, {
        order: layerDef.order,
        needsCamera: layerDef.needsCamera,
        renderer: null // Set by layer registry
      });
    });
  }
  
  render(gameState, camera) {
    const activeLayerNames = this.stateConfig[gameState] || [];
    const activeLayers = activeLayerNames
      .map(name => this.layers.get(name))
      .sort((a, b) => a.order - b.order);
    
    for (const layer of activeLayers) {
      if (layer.needsCamera) {
        camera.applyTransform(window); // Apply camera transform
      }
      
      if (layer.renderer) {
        layer.renderer.render(gameState);
      }
      
      if (layer.needsCamera) {
        camera.restoreTransform(window); // Restore camera transform
      }
    }
  }
}
```

**Benefits:**
- ✅ No switch statements (add new states without code changes)
- ✅ Layer order configurable (designers can tweak)
- ✅ Easy to debug (JSON config is readable)
- ✅ Camera transform automatic (no manual push/pop)

**5.1.4 Specialized Renderers (Week 18)**

**TerrainRenderer (50 lines):**
```javascript
class TerrainRenderer {
  constructor(worldService) {
    this.worldService = worldService;
  }
  
  render(gameState) {
    const activeMap = this.worldService.getActiveMap();
    if (activeMap && activeMap.render) {
      activeMap.render();
    }
  }
}
```

**EntityRenderer (80 lines):**
```javascript
class EntityRenderer {
  constructor(entityService, coordSystem) {
    this.entityService = entityService;
    this.coordSystem = coordSystem;
  }
  
  render(gameState) {
    const entities = this.entityService.getAllVisible();
    
    // Optional: Frustum culling
    const visibleEntities = this.cullEntities(entities);
    
    // Render visible entities (sorted by Y for depth)
    visibleEntities
      .sort((a, b) => a.y - b.y)
      .forEach(entity => {
        const renderComp = entity.getComponent('RenderComponent');
        if (renderComp) renderComp.render();
      });
  }
  
  cullEntities(entities) {
    // Use CoordinateSystem to determine viewport bounds
    const viewport = this.coordSystem.camera.viewport;
    const topLeft = this.coordSystem.screenToWorld(0, 0);
    const bottomRight = this.coordSystem.screenToWorld(viewport.width, viewport.height);
    
    return entities.filter(entity => {
      const pos = entity.getComponent('PositionComponent');
      return pos && 
        pos.x >= topLeft.x && pos.x <= bottomRight.x &&
        pos.y >= topLeft.y && pos.y <= bottomRight.y;
    });
  }
}
```

**UIRenderer (100 lines):**
```javascript
class UIRenderer {
  constructor(uiService) {
    this.uiService = uiService;
  }
  
  render(gameState) {
    // Render HUD (always visible during gameplay)
    if (['PLAYING', 'PAUSED'].includes(gameState)) {
      this.uiService.renderHUD();
    }
    
    // Render active panels
    this.uiService.renderPanels(gameState);
    
    // Render tooltips (if any)
    this.uiService.renderTooltips();
  }
}
```

**Checklist:**
- [ ] Week 15: Create CoordinateSystem with comprehensive tests
- [ ] Week 15: Migrate all coordinate conversions to CoordinateSystem
- [ ] Week 15: Delete duplicate conversion functions (5+ places)
- [ ] Week 16: Create unified Camera class with mode plugins
- [ ] Week 16: Migrate CameraManager → Camera (free mode)
- [ ] Week 16: Migrate CustomLevelCamera → Camera (bounded mode)
- [ ] Week 16: Delete 3 old camera classes
- [ ] Week 17: Create rendering-layers.json config
- [ ] Week 17: Create RenderPipeline orchestrator
- [ ] Week 17: Register 4 specialized renderers
- [ ] Week 17: Delete RenderLayerManager inline implementations
- [ ] Week 18: Optimize EntityRenderer (enable culling, remove console.log)
- [ ] Week 18: Cleanup UIRenderer (remove fallback chaos)
- [ ] Week 18: Performance test (60fps with 1000 entities)

**Expected Metrics:**
- Rendering LOC: 2000+ → 800 (-60%)
- Camera LOC: 1300 → 200 (-85%)
- Coordinate conversions: 5 implementations → 1 (-80%)
- push/pop pairs: 100+ → 10 (-90%)
- Frustum culling: Working correctly
- Frame time: 20ms → 8ms (-60% with culling)

---

## Phase 6: Testing & Documentation (Weeks 19-20)

**Goal**: Ensure refactored codebase is testable and documented

### 6.1 Test Coverage Improvements (Week 19)

**Current Coverage:** ~60%  
**Target Coverage:** 85%

**Priorities:**
1. **Unit tests** for all services (EntityService, WorldService, CameraService, etc.)
2. **Integration tests** for ECS (systems processing components)
3. **E2E tests** for rendering pipeline (screenshot verification)
4. **Performance tests** (1000 entities at 60fps)

**Checklist:**
- [ ] Write unit tests for GameContext (TDD)
- [ ] Write unit tests for 10 services (EntityService, WorldService, etc.)
- [ ] Write integration tests for ECS (MovementSystem, RenderSystem)
- [ ] Write E2E tests for rendering (screenshots of each layer)
- [ ] Write performance benchmarks (entity creation, system updates)
- [ ] Run full test suite on CI/CD
- [ ] Fix any regressions
- [ ] Achieve 85% coverage

### 6.2 Documentation Updates (Week 20)

**Updates Required:**
- [ ] Update architecture diagrams (new services, ECS)
- [ ] Write API reference for GameContext
- [ ] Write API reference for ECS (Entity, Component, System)
- [ ] Write API reference for CoordinateSystem
- [ ] Write API reference for Camera
- [ ] Write migration guide (old API → new API)
- [ ] Update CHANGELOG.md
- [ ] Update README.md with new architecture
- [ ] Update copilot-instructions.md with new patterns

---

## Migration Strategy (Parallel Development)

**Critical:** Do NOT attempt "big bang" migration. Use parallel development.

### Parallel Entity Systems (Weeks 7-10)

```javascript
// sketch.js - Run BOTH systems in parallel
function draw() {
  // Old system (legacy entities)
  for (const ant of ants) {
    ant.update();
    ant.render();
  }
  
  // New system (ECS entities)
  gameContext.ecs.update(deltaTime);
  gameContext.ecs.render();
}

// Gradual migration: Convert 10 ants per day
// Day 1: 10 ants in ECS, 90 ants in old system
// Day 2: 20 ants in ECS, 80 ants in old system
// Day 10: 100 ants in ECS, 0 ants in old system
```

### Feature Flags (Weeks 1-20)

```javascript
// Classes/core/FeatureFlags.js
const FEATURE_FLAGS = {
  USE_GAME_CONTEXT: true,    // Phase 1
  USE_ES6_MODULES: true,      // Phase 2
  USE_ECS: true,              // Phase 3
  USE_NEW_SERVICES: true,     // Phase 4
  USE_NEW_RENDERING: true     // Phase 5
};

// Usage
if (FEATURE_FLAGS.USE_ECS) {
  gameContext.ecs.update(deltaTime);
} else {
  antsUpdate(); // Legacy
}
```

**Benefits:**
- ✅ Roll back instantly if bugs found
- ✅ A/B test performance (old vs new)
- ✅ Gradual rollout (1 feature at a time)

---

## Success Metrics & Validation

### Phase 1 Success Criteria
- [ ] All globals moved to GameContext
- [ ] sketch.js has <5 global variables
- [ ] Tests can mock GameContext
- [ ] No regressions in existing tests

### Phase 2 Success Criteria
- [ ] Build completes in <5s
- [ ] Bundle size <1.5MB (gzipped)
- [ ] Load time <2s
- [ ] All 280 files converted to ES6 modules

### Phase 3 Success Criteria
- [ ] All entities use ECS
- [ ] Entity creation <5ms
- [ ] Memory per entity <500B
- [ ] Old Entity.js deleted

### Phase 4 Success Criteria
- [ ] <10 manager classes remaining
- [ ] No circular dependencies
- [ ] Service initialization <50ms
- [ ] All old managers deleted

### Phase 5 Success Criteria
- [ ] Rendering code <800 LOC
- [ ] 1 coordinate system (not 5)
- [ ] 1 camera class (not 3)
- [ ] Frustum culling working
- [ ] 60fps with 1000 entities

### Phase 6 Success Criteria
- [ ] Test coverage >85%
- [ ] All APIs documented
- [ ] Migration guide complete
- [ ] No breaking changes for users

---

## Risk Mitigation

### High-Risk Areas

1. **Global State Migration (Phase 1)**
   - **Risk:** Breaking existing code that relies on globals
   - **Mitigation:** Keep globals as deprecated aliases for 2 weeks
   ```javascript
   // Temporary backwards compatibility
   Object.defineProperty(window, 'ants', {
     get() {
       console.warn('DEPRECATED: Use gameContext.entities.getAnts() instead');
       return gameContext.entities.getAnts();
     }
   });
   ```

2. **Module System Migration (Phase 2)**
   - **Risk:** Build failures, missing dependencies
   - **Mitigation:** Rollup dry run, manual testing of all features

3. **ECS Migration (Phase 3)**
   - **Risk:** Performance regression (ECS slower than old system)
   - **Mitigation:** Parallel development, A/B performance testing

4. **Rendering Overhaul (Phase 5)**
   - **Risk:** Visual bugs, coordinate conversion errors
   - **Mitigation:** E2E screenshot tests, pixel-perfect comparison

### Rollback Plan

**Each phase includes:**
1. Feature flag (instant disable)
2. Backup branch (git rollback)
3. Legacy code retention (delete after 2 weeks)

---

## Timeline Summary

| Phase | Weeks | Deliverables | Risk |
|-------|-------|--------------|------|
| **Phase 1: Global State** | 1-3 | GameContext, centralized state | Medium |
| **Phase 2: Module System** | 4-6 | Rollup build, ES6 modules | High |
| **Phase 3: ECS** | 7-10 | Entity Component System | Medium |
| **Phase 4: Manager Consolidation** | 11-14 | 10 focused services | Low |
| **Phase 5: Rendering Overhaul** | 15-18 | Unified rendering, camera, coordinates | High |
| **Phase 6: Testing & Docs** | 19-20 | 85% coverage, documentation | Low |

**Total Duration:** 20 weeks (5 months)  
**Team Size:** 2-3 developers  
**Estimated Effort:** 800-1200 developer-hours

---

## Phase 7: Additional System Refactorings (Weeks 21-24) - BONUS

**Goal**: Refactor remaining problematic systems discovered during deep analysis

### 7.1 Input System Overhaul (Week 21)

**Current Problems:**
- **MouseInputController**: Simple callback pattern but tightly coupled to p5.js
- **KeyboardInputController**: Similar callback pattern, no key mapping system
- **Manual event wiring**: Every system manually calls `controller.onClick()`, `controller.onKeyPress()`
- **No input buffering**: Lost inputs during frame lag
- **No input contexts**: Can't disable input during dialogs

**New Input System:**
```javascript
// Classes/input/InputManager.js (200 lines)
class InputManager {
  constructor() {
    this.contexts = new Map(); // 'game', 'menu', 'editor'
    this.activeContext = 'game';
    this.mouseState = { x: 0, y: 0, buttons: new Set() };
    this.keyboardState = { pressed: new Set(), released: new Set() };
    this.inputBuffer = []; // Frame-buffered inputs
  }
  
  // Context management
  pushContext(name) { this.activeContext = name; }
  popContext() { /* restore previous */ }
  
  // Unified input API
  isMousePressed(button = 'LEFT') { return this.mouseState.buttons.has(button); }
  isKeyDown(key) { return this.keyboardState.pressed.has(key); }
  wasKeyPressed(key) { /* check buffer */ }
  
  // Input mapping
  bindAction(action, keys) { /* map action to keys */ }
  isActionActive(action) { /* check mapped keys */ }
  
  update() { /* process buffer, clear released keys */ }
}

// Usage (no more manual onClick() wiring)
inputManager.bindAction('moveUp', ['w', 'W', 'ArrowUp']);
if (inputManager.isActionActive('moveUp')) {
  player.moveUp();
}
```

**Benefits:**
- ✅ Input buffering (no lost inputs)
- ✅ Context switching (disable game input during dialogs)
- ✅ Action mapping (rebindable keys)
- ✅ Unified API (mouse + keyboard + gamepad ready)

**Checklist:**
- [ ] Create InputManager with context system
- [ ] Create InputBuffer for frame-buffering
- [ ] Create ActionMap for key binding
- [ ] Migrate MouseInputController → InputManager
- [ ] Migrate KeyboardInputController → InputManager
- [ ] Delete old controllers
- [ ] Update all input-dependent systems

---

### 7.2 Manager Consolidation - Phase 2 (Week 22)

**Current Problems (15 manager files):**
- **AntManager** (243 lines) - Only manages `selectedAnt` state (should be in SelectionService)
- **ResourceSystemManager** (865 lines) - Combines spawning + collection (overcomplicated)
- **TileInteractionManager** - Tracks objects on tiles (should be in SpatialGrid)
- **MiddleClickPan** - Camera panning logic (should be in CameraService)
- **ShortcutManager** - Global keyboard shortcuts (should be in InputManager)
- **SettingsManager** - Game settings (should be in GameContext)
- **soundManager** - Audio playback (lowercase naming violation)
- **pheromoneControl** - Pheromone system (lowercase naming violation, experimental code)

**Consolidation Plan:**

| Old Manager | New Home | Rationale |
|-------------|----------|-----------|
| AntManager | SelectionService | Only manages selection state |
| ResourceSystemManager | EntityService + SpawnService | Split spawning from entity management |
| TileInteractionManager | SpatialGridManager | Spatial queries already handle this |
| MiddleClickPan | CameraService (FollowCameraMode) | Camera behavior belongs in camera |
| ShortcutManager | InputManager (ActionMap) | Input bindings |
| SettingsManager | GameContext.settings | Configuration belongs in context |
| soundManager | AudioService | Proper naming, service architecture |
| pheromoneControl | (Delete or PheromoneSystem) | Experimental, not used |
| BuildingManager | EntityService | Same as ants/resources |
| CameraSystemManager | CameraService | Already covered in Phase 5 |

**Expected Metrics:**
- Managers: 15 → 0 (all absorbed into services)
- LOC deleted: ~2500 lines (manager boilerplate)
- LOC added: ~500 lines (service methods)
- **Net reduction: -2000 lines (-80%)**

**Checklist:**
- [ ] Migrate AntManager.selectedAnt → SelectionService
- [ ] Split ResourceSystemManager → EntityService (collection) + SpawnService (spawning)
- [ ] Delete TileInteractionManager (use SpatialGridManager)
- [ ] Migrate MiddleClickPan → CameraService.modes.pan
- [ ] Migrate ShortcutManager → InputManager.actionMap
- [ ] Migrate SettingsManager → GameContext.settings
- [ ] Rename soundManager → AudioService
- [ ] Delete or refactor pheromoneControl
- [ ] Delete 15 manager files
- [ ] Update all references

---

### 7.3 Pathfinding System Cleanup (Week 23)

**Current Problems:**
- **Global state pollution**: `let path = []`, `currentStart`, `currentEnd`, `openSetStart`, `openSetEnd`, `openMapStart`, `openMapEnd`, `meetingNode`
- **Private property access**: `terrain._xCount`, `terrain._yCount`, `terrain._tileStore`, `terrain._tileSpan` (comment: "BAD IDEA TO USE PRIVATE VARS, fuck it we ball")
- **Commented-out code**: 50+ lines of dead code
- **PathMap class**: Creates full node grid for every terrain (memory inefficient)
- **Bidirectional A***: Overcomplicated for game with small maps
- **No caching**: Recalculates paths even when terrain unchanged

**New Pathfinding Architecture:**
```javascript
// Classes/pathfinding/PathfindingService.js (150 lines)
class PathfindingService {
  constructor(worldService) {
    this.worldService = worldService;
    this.cache = new Map(); // Cache paths
    this.nodePool = []; // Reuse nodes
  }
  
  findPath(startX, startY, endX, endY, options = {}) {
    const cacheKey = `${startX},${startY}-${endX},${endY}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Run A* (simpler unidirectional)
    const path = this._aStar(startX, startY, endX, endY, options);
    
    // Cache result
    this.cache.set(cacheKey, path);
    
    return path;
  }
  
  _aStar(startX, startY, endX, endY, options) {
    // Use worldService.getTile() instead of private properties
    // Single-direction A* (simpler, fast enough for game)
    // Return array of {x, y} coordinates
  }
  
  invalidateCache() { this.cache.clear(); }
}

// Usage (no more globals)
const path = pathfindingService.findPath(ant.x, ant.y, target.x, target.y);
ant.followPath(path);
```

**Benefits:**
- ✅ No global state
- ✅ Path caching (10x faster for repeated queries)
- ✅ Node pooling (reduce GC pressure)
- ✅ Simpler algorithm (unidirectional A* sufficient)
- ✅ No private property access

**Checklist:**
- [ ] Create PathfindingService with caching
- [ ] Implement unidirectional A* (remove bidirectional complexity)
- [ ] Use worldService.getTile() (remove private property access)
- [ ] Delete commented-out code (50+ lines)
- [ ] Delete global variables (8 globals)
- [ ] Update MovementComponent to use PathfindingService
- [ ] Performance test (verify caching speeds up repeated queries)

---

### 7.4 UI System Standardization (Week 24)

**Current Problems:**
- **100+ UI component files** (UIComponents/, _baseObjects/, eventTemplates/, levelEditor/, painter/)
- **Inconsistent patterns**: Some use CollisionBox2D, some use x/y/width/height, some use bounds objects
- **Duplicate input handling**: Every component implements `handleClick()`, `handleKeyPress()` differently
- **No component lifecycle**: Components never clean up (memory leaks)
- **InputBox**: Good pattern but only used in 3 places (should be standard)
- **Button**: Good pattern (Button.js) but not used in older code
- **Manual focus management**: Every dialog manually tracks focused inputs

**UI Component Standard:**
```javascript
// Classes/ui/core/UIComponent.js (base class)
class UIComponent {
  constructor(x, y, width, height) {
    this.bounds = new CollisionBox2D(x, y, width, height);
    this.enabled = true;
    this.visible = true;
    this.focused = false;
    this.hovered = false;
    this.parent = null;
    this.children = [];
  }
  
  // Lifecycle
  onMount() { /* override */ }
  onUnmount() { /* override */ }
  update(deltaTime) { /* override */ }
  render(buffer) { /* override */ }
  
  // Input handling (unified)
  handleClick(mouseX, mouseY) { return false; /* override */ }
  handleKeyPress(key, keyCode) { return false; /* override */ }
  
  // Hit testing (standard)
  containsPoint(x, y) { return this.bounds.contains(x, y); }
  
  // Hierarchy
  addChild(child) {
    child.parent = this;
    this.children.push(child);
    child.onMount();
  }
  
  removeChild(child) {
    child.onUnmount();
    child.parent = null;
    const index = this.children.indexOf(child);
    if (index !== -1) this.children.splice(index, 1);
  }
}

// All UI components extend UIComponent
class Button extends UIComponent { /* ... */ }
class InputBox extends UIComponent { /* ... */ }
class Dialog extends UIComponent { /* ... */ }
class Panel extends UIComponent { /* ... */ }
```

**Benefits:**
- ✅ Consistent API (all components work the same)
- ✅ Component hierarchy (parent-child relationships)
- ✅ Lifecycle management (mount/unmount for cleanup)
- ✅ Standard hit testing (no more manual bounds checks)
- ✅ Easier to create new components (extend base class)

**Checklist:**
- [ ] Create UIComponent base class
- [ ] Refactor Button to extend UIComponent (already close)
- [ ] Refactor InputBox to extend UIComponent
- [ ] Refactor Dialog to extend UIComponent
- [ ] Refactor Panel classes to extend UIComponent
- [ ] Create UIManager for global UI state (focused component, hover tracking)
- [ ] Update 20 most-used UI components (prioritize by usage)
- [ ] Deprecate old UI patterns (x/y/width/height without CollisionBox2D)

---

## Success Metrics & Validation (Updated)

### Phase 7 Success Criteria
- [ ] InputManager replaces MouseInputController + KeyboardInputController
- [ ] All 15 managers absorbed into services (0 managers remaining)
- [ ] PathfindingService eliminates 8 global variables
- [ ] UIComponent base class adopted by 20+ components
- [ ] Path caching speeds up repeated queries by 10x
- [ ] No private property access in pathfinding

### Overall Refactoring Metrics (Phases 1-7)

| Metric | Current | After Phase 6 | After Phase 7 | Total Improvement |
|--------|---------|---------------|---------------|-------------------|
| **Total LOC** | ~45,000 | ~22,500 | ~19,000 | **-58%** |
| **Script Tags** | 280 | 3-5 | 3-5 | **-99%** |
| **Global Variables** | 40+ | 2-3 | 0 | **-100%** |
| **Manager Classes** | 30+ | 10 | 0 | **-100%** |
| **Entity Boilerplate** | 100 lines/entity | 10 lines/entity | 10 lines/entity | **-90%** |
| **Input Controllers** | 2 fragmented | 2 fragmented | 1 unified | **-50%** |
| **Pathfinding Globals** | 8 | 8 | 0 | **-100%** |
| **UI Base Classes** | 0 | 0 | 1 standard | +1 |
| **Test Coverage** | ~60% | 85% | 90% | **+30%** |

---

## Timeline Summary (Updated)

| Phase | Weeks | Deliverables | Risk | Priority |
|-------|-------|--------------|------|----------|
| **Phase 1: Global State** | 1-3 | GameContext, centralized state | Medium | HIGH |
| **Phase 2: Module System** | 4-6 | Rollup build, ES6 modules | High | HIGH |
| **Phase 3: ECS** | 7-10 | Entity Component System | Medium | HIGH |
| **Phase 4: Manager Consolidation** | 11-14 | 10 focused services | Low | HIGH |
| **Phase 5: Rendering Overhaul** | 15-18 | Unified rendering, camera, coordinates | High | HIGH |
| **Phase 6: Testing & Docs** | 19-20 | 85% coverage, documentation | Low | HIGH |
| **Phase 7: Additional Systems** | 21-24 | Input, managers, pathfinding, UI | Medium | MEDIUM |

**Core Refactoring:** 20 weeks (Phases 1-6)  
**Extended Refactoring:** 24 weeks (Phases 1-7)  
**Team Size:** 2-3 developers  
**Estimated Effort:** 1000-1500 developer-hours (extended)

---

## Next Steps

1. **Review this roadmap** with team (estimate: 2 hours)
2. **Choose starting phase** (recommend Phase 1)
3. **Decide on scope**: Core (20 weeks) or Extended (24 weeks)?
4. **Create detailed checklist** for chosen phase (use `docs/checklists/templates/FEATURE_DEVELOPMENT_CHECKLIST.md`)
5. **Write first test** (TDD: GameContext unit test)
6. **Begin implementation** (Week 1: GameContext class)

**Questions for team:**
- Which phase should we start with? (Phase 1 recommended)
- Do we have 2-3 developers for 20-24 weeks?
- Should we use TypeScript for new code? (adds 2 weeks to Phase 2)
- Should we deploy incrementally (every 4 weeks) or at end (20-24 weeks)?
- Should we tackle Phase 7 (additional systems) or stop after Phase 6 (core)?

**Phase 7 Justification:**
- Input system refactoring enables gamepad support later
- Manager consolidation completes service architecture
- Pathfinding cleanup eliminates last major global state
- UI standardization makes future UI development 3x faster

---

**Document Status:** ✅ COMPLETE - Ready for Team Review  
**Last Updated:** November 3, 2025 (Extended with Phase 7)  
**Author:** GitHub Copilot (AI Assistant)
