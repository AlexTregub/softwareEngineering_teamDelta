# Copilot Instructions for Ant Game Project

## Core Architecture

This is a **p5.js-based ant simulation game** using a **composition-based entity system** with optional controllers. The codebase follows specific patterns and testing standards.

### Entity-Controller Pattern

- **Base Entity Class** (`Classes/containers/Entity.js`): Core game object with collision, sprite, and automatic debugger integration
- **Optional Controllers**: Entities compose controllers for specific behaviors:
  - `MovementController`: Pathfinding and movement logic
  - `TaskManager`: Priority-based task queues with timeouts
  - `RenderController`: Visual rendering and effects
  - `SelectionController`: Selection states and highlighting
  - **Controller Access**: Use `entity.getController('name')` or delegate methods like `entity.moveToLocation(x, y)`

### State Management Systems

- **AntStateMachine**: Manages layered states (primary: IDLE/MOVING/GATHERING, combat: IN_COMBAT/ATTACKING, terrain: IN_WATER/ON_ROUGH)
- **TaskManager**: Command pattern with priorities (EMERGENCY=0, HIGH=1, NORMAL=2, LOW=3, IDLE=4)
- **Global Managers**: `AntManager`, `ResourceManager`, `GameStateManager` handle collections

## Development Workflow

### Running the Game
```bash
npm run dev                    # Start local server on :8000
python -m http.server 8000     # Alternative server command
```

### Testing - CRITICAL PATTERNS
- **Primary Tests**: BDD tests in `test/bdd_new/` using Selenium + behave (HEADLESS mode)
- **Test Commands**: `npm run test:bdd`, `npm run test:python:core`
- **Browser Requirements**: Chrome (headless), automatic ChromeDriver management via `webdriver-manager`
- **Testing Standards**: Read `docs/standards/testing/TESTING_METHODOLOGY_STANDARDS.md` before writing tests

### Debug System Integration

**Universal Debugger** automatically integrates with all entities:
- **Backtick Key Controls**: ` = toggle nearest, Shift+` = show all (up to 200), Alt+` = hide all
- **Performance Monitoring**: Real-time graphs for update/render times, memory usage
- **Console Commands**: `demonstrateEntityDebugger()`, `setDebugLimit(50)`, `forceShowAllDebuggers()`
- **Visual Features**: Outline-only bounding boxes, corner markers, type labels

## Project-Specific Conventions

### File Organization
- **Classes/**: Core game systems organized by type (ants/, controllers/, managers/, containers/)
- **debug/**: Universal debugging system with global manager
- **test/bdd_new/**: Primary test suite (headless browser automation)
- **Images/**: Game assets with specific tile size directories (16x16, 32x32)
- **docs/**: Extensive documentation including testing standards and development reports

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

#### State Machine Usage
```javascript
ant._stateMachine.setPrimaryState("GATHERING");
ant._stateMachine.setCombatModifier("IN_COMBAT");
// Check combined state: ant._stateMachine.getFullState() returns "GATHERING:IN_COMBAT:DEFAULT"
```

#### Task System
```javascript
// TaskManager handles priority queues with automatic defaults
ant.addTask({type: "MOVE", target: {x: 100, y: 100}});  // Gets NORMAL priority
ant.addTask({type: "FLEE", priority: 0});  // EMERGENCY overrides current task
```

### Testing Anti-Patterns (CRITICAL - Will Fail Review)

**Language RED FLAGS:**
- ❌ "REAL antsSpawn function" → ✅ "antsSpawn function"
- ❌ "actual game data" → ✅ "game data"
- ❌ "fake implementations" → ✅ Remove entirely

**Code RED FLAGS:**
- ❌ `expect(counter).to.equal(5)` - Testing loop counters
- ❌ `expect(true).to.be.true` - Placeholder tests
- ❌ `obj._privateMethod()` - Testing private methods
- ❌ Manual property injection without system constructors

**Quality Standard**: Every test must use system APIs and catch real bugs, not test internal logic.

### Camera System
- **CameraManager**: Unified camera with position, zoom, input handling
- **Coordinate Transforms**: `screenToWorld()`, `worldToScreen()` for mouse interactions
- **Input Separation**: Arrow keys for camera, WASD for ant movement

### Performance Considerations
- **Debug Limits**: Default 50 visible debuggers, override with Shift+` (up to 200)
- **Controller Pattern**: Optional composition prevents mandatory dependencies
- **Headless Testing**: All browser tests run headless for CI/CD compatibility

## Integration Points

### External Dependencies
- **p5.js**: Core rendering and input (loaded from `libraries/`)
- **Collision System**: `CollisionBox2D` for entity interactions
- **Sprite System**: `Sprite2D` for visual rendering
- **Testing**: Selenium WebDriver with automatic ChromeDriver management

### Cross-Component Communication
- **Entity Delegation**: Clean API via controller delegation methods
- **Task Queue**: Priority-based command system with timeout handling  
- **State Broadcasting**: State machine notifications via callbacks
- **Debug Integration**: Automatic debugger registration with global manager

When modifying this codebase, respect the composition patterns, testing standards, and headless automation requirements. The debugging system provides extensive runtime introspection - use it for development insights.