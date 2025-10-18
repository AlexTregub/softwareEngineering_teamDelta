# Copilot Instructions for Ant Game Project

## Core Architecture

This is a **p5.js-based ant simulation game** using a **composition-based entity system** with layered rendering and optional controllers. The codebase follows specific patterns and strict testing standards.

### Entity-Controller Pattern (Composition Over Inheritance)

- **Base Entity Class** (`Classes/containers/Entity.js`): Core game object with collision, sprite, and automatic debugger integration
- **Optional Controllers**: Entities compose controllers for specific behaviors (initialized only if available):
  - `MovementController`: Pathfinding and movement logic
  - `TaskManager`: Priority-based task queues with timeouts (EMERGENCY=0, HIGH=1, NORMAL=2, LOW=3, IDLE=4)
  - `RenderController`: Visual rendering and effects
  - `SelectionController`: Selection states and highlighting
  - `CombatController`, `HealthController`, `InventoryController`, `TerrainController`
- **Controller Access**: Use `entity.getController('controllerName')` or delegate methods like `entity.moveToLocation(x, y)`
- **Auto-registration**: Controllers initialize via `_initializeControllers()` and register in `_controllers` Map

### Layered Rendering System (Critical)

**RenderLayerManager** (`Classes/rendering/RenderLayerManager.js`) controls all rendering with strict layer ordering:
- **Layer Hierarchy**: `TERRAIN` → `ENTITIES` → `EFFECTS` → `UI_GAME` → `UI_DEBUG` → `UI_MENU`
- **Layer Functions**: Register renderers with `setLayerRenderer(layerName, renderFn)`, add drawables with `addDrawableToLayer(layerName, drawFn)`
- **Interactive System**: Use `addInteractiveDrawable(layerName, interactiveObj)` for mouse/pointer handling
- **Performance**: Layer timing tracked in `renderStats.layerTimes`, terrain caching via `cacheStatus`
- **Overrides**: `_RenderMangerOverwrite = true` + `_overwrittenRendererFn` for temporary renderer bypass (e.g., draggable panels)

### State Management Systems

- **AntStateMachine**: Manages layered states (primary: IDLE/MOVING/GATHERING, combat: IN_COMBAT/ATTACKING, terrain: IN_WATER/ON_ROUGH)
- **TaskManager**: Command pattern with priority-based execution
- **Global Managers**: `AntManager`, `ResourceManager`, `GameStateManager`, `TileInteractionManager` handle collections and systems
- **Menu States**: `gameState` variable controls MENU/PLAYING/OPTIONS transitions with fade effects

## Development Workflow

### Running the Game
```bash
npm run dev                    # Start local server on :8000
python -m http.server 8000     # Alternative (already running in background task)
```
**VS Code Task**: `startDevServer` task runs automatically (background), check with `get_task_output`

### p5.js Lifecycle (Critical Order)
1. **preload()**: Load all assets (images, fonts) via `*_Preloader()` functions
2. **setup()**: Initialize canvas, world, controllers, managers (called once)
3. **draw()**: Main game loop (60fps) - handles menu/game state rendering
4. **Input Handlers**: `mousePressed()`, `mouseDragged()`, `mouseReleased()`, `keyPressed()`

**Load Order in index.html**: Bootstrap → Rendering → Base Systems → Controllers → Game Logic

### Testing - CRITICAL PATTERNS (MANDATORY READING)
- **Primary Tests**: BDD tests in `test/bdd_new/` using Selenium + behave (**HEADLESS MODE ONLY**)
- **Test Commands**: 
  - `npm run test:bdd` - Full BDD suite
  - `npm run test:bdd:ants` - Ant-specific tests
  - `npm run test:python:core` - Core system tests
- **Browser Config**: Chrome headless with `--headless=new`, `--no-sandbox`, `--disable-dev-shm-usage`
- **BEFORE WRITING TESTS**: Read `docs/standards/testing/TESTING_METHODOLOGY_STANDARDS.md` + `BDD_LANGUAGE_STYLE_GUIDE.md`
- **Testing Standards**: ALL tests must use system APIs, catch real bugs, run headless

### Debug System Integration

**Universal Debugger** (`debug/UniversalDebugger.js`) auto-integrates with all entities:
- **Keyboard Controls**: 
  - `` ` `` = Toggle nearest debugger + performance graph
  - `Shift + `` ` `` = Show all debuggers (up to limit)
  - `Alt + `` ` `` = Hide all debuggers
  - `Ctrl + Shift + 1` = Performance overlay
  - `Ctrl + Shift + 2` = Entity inspector
  - `Ctrl + Shift + 3` = Debug console (also `` ` ``)
- **Console Commands**: `demonstrateEntityDebugger()`, `setDebugLimit(50)`, `forceShowAllDebuggers()`
- **Features**: Outline-only bounding boxes, property panels, performance graphs (update/render times, memory), automatic registration

## Project-Specific Conventions

### File Organization (Strict Loading Order)
```
index.html                    # Script load order: bootstrap → rendering → base → controllers
├── scripts/bootstrap-globals.js   # Early global initialization
├── Classes/
│   ├── rendering/           # RenderLayerManager, EntityLayerRenderer, UILayerRenderer
│   ├── containers/          # Entity (base class), StatsContainer
│   ├── controllers/         # Movement, Task, Render, Selection, Camera, Input
│   ├── managers/            # AntManager, ResourceManager, GameStateManager, TileInteractionManager
│   ├── ants/                # ant class, Species, AntWrapper, antStateMachine, JobComponent
│   ├── systems/             # CollisionBox2D, Button, Sprite2D, FramebufferManager
│   └── terrainUtils/        # Terrain generation and tile systems
├── debug/                   # UniversalDebugger, EntityDebugManager, testing.js
└── test/bdd_new/            # Headless browser automation tests
```

### Code Patterns

#### Entity Creation with Controllers
```javascript
const ant = new Entity(x, y, 32, 32, {
  type: "Ant", 
  movementSpeed: 2.5,
  selectable: true,
  faction: "player"
});
// Controllers auto-initialize if available
ant.moveToLocation(targetX, targetY);  // Delegates to MovementController
ant.addTask({type: "GATHER", priority: 2});  // Delegates to TaskManager
```

#### Rendering Layer Registration
```javascript
// Register layer renderer
RenderManager.setLayerRenderer(RenderManager.layers.ENTITIES, (gameState) => {
  push();
  // Render entities
  pop();
});

// Add drawable to layer
RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, drawFunction);

// Add interactive (for mouse handling)
RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, {
  hitTest: (pointer) => true,
  onPointerDown: (pointer) => { /* handle click */ }
});
```

#### Camera Coordinate Transforms
```javascript
// Screen to world coordinates (for mouse clicks)
const worldPos = cameraManager.screenToWorld(mouseX, mouseY);

// World to screen coordinates (for rendering UI)
const screenPos = cameraManager.worldToScreen(entityX, entityY);
```

### Testing Anti-Patterns (IMMEDIATE REJECTION)

**Language RED FLAGS (See `BDD_LANGUAGE_STYLE_GUIDE.md`):**
- ❌ "**REAL** antsSpawn function" → ✅ "antsSpawn function"
- ❌ "**actual** game data" → ✅ "game data"
- ❌ "**fake implementations**" → ✅ Remove entirely
- ❌ "**authentic** testing" → ✅ "testing"

**Code RED FLAGS:**
- ❌ `expect(counter).to.equal(5)` - Testing loop counters/internal mechanics
- ❌ `expect(true).to.be.true` - Placeholder tests
- ❌ `obj._privateMethod()` - Testing private methods instead of public APIs
- ❌ `antObj.jobPriority = priority` - Manual property injection without system constructors
- ❌ `results['tests_passed'] = 17` - Hardcoded test results without execution
- ❌ Writing tests without first running dependency analysis
- ❌ Non-headless browser tests (breaks CI/CD)

**Quality Standard**: Every test must use system APIs, catch real bugs, and not just test internal logic, and run headless. We are transitioning to using puppeteer and having screenshots provided for evidence is valuable

### Camera System
- **CameraManager**: Unified camera with position, zoom, input handling
- **Coordinate Transforms**: `screenToWorld()`, `worldToScreen()` for mouse interactions
- **Input Separation**: Arrow keys for camera, WASD for ant movement
- **Integration**: Auto-initialized in `sketch.js setup()`, stored in global `cameraManager`

### Bootstrap & Global Initialization
- **Bootstrap Script**: `scripts/bootstrap-globals.js` initializes debug loggers, test runner flags, verbosity levels
- **Early Loading**: Loaded before any game code in `index.html`
- **Global APIs**: `enableTests()`, `disableTests()`, `setVerbosity()`, `createDebugLogger()`

## Integration Points

### External Dependencies
- **p5.js**: Core rendering and input (loaded from `libraries/p5.min.js`)
- **Collision System**: `CollisionBox2D` for entity interactions
- **Sprite System**: `Sprite2D` (in `Classes/rendering/Sprite2d.js`) for visual rendering
- **Testing**: Selenium WebDriver with automatic ChromeDriver management via `webdriver-manager`

### Cross-Component Communication
- **Entity Delegation**: Clean API via controller delegation methods (see `Entity._initializeEnhancedAPI()`)
- **Rendering Pipeline**: Layers communicate via `RenderLayerManager`, drawables register per-layer
- **Task Queue**: Priority-based command system with timeout handling  
- **State Broadcasting**: State machine notifications via callbacks
- **Debug Integration**: Automatic debugger registration with `EntityDebugManager` on entity construction
- **Input Flow**: MouseInputController → SelectionBoxController → Entity selection

### Performance Considerations
- **Debug Limits**: Default 50 visible debuggers, override with `Shift + `` ` `` (up to 200)
- **Controller Pattern**: Optional composition prevents mandatory dependencies
- **Terrain Caching**: RenderLayerManager caches terrain layer to reduce re-draws
- **Headless Testing**: All browser tests run headless for CI/CD compatibility
- **Layer Timing**: Track per-layer render time via `renderStats.layerTimes`

## Critical Reminders for AI Agents
1. **Script Load Order Matters**: Rendering classes load before Entity, Entity before controllers
2. **Always Use System APIs**: Never manually inject properties or bypass constructors in tests
3. **Headless Only**: ALL browser automation must use `--headless=new` Chrome option
4. **Read Testing Docs First**: `TESTING_METHODOLOGY_STANDARDS.md` before writing any test
5. **Coordinate Transforms**: Use `cameraManager.screenToWorld()` for mouse → world, `worldToScreen()` for world → screen
6. **Layer System**: All rendering goes through `RenderLayerManager` layers, never raw p5.js calls in game logic
7. **Entity Controllers Optional**: Check controller availability before delegation calls