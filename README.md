# softwareEngineering_teamDelta
Team contrib repo for Software Engineering course with Dr. Delozier (CS33901)

## 📁 Project Structure

```
├── Classes/                 # Core game classes and systems
│   ├── ants/               # Ant-related classes (ant, Job, state machine)
│   ├── containers/         # Base entity classes (Entity, StatsContainer)
│   ├── controllers/        # Controller classes (movement, task, render, etc.)
│   ├── systems/            # Game systems (collision, buttons, sprites)
│   └── managers/           # Game managers (ant manager, resource manager)
├── debug/                  # Universal debugging system
│   ├── UniversalDebugger.js    # Core debugger with object introspection
│   ├── EntityDebugManager.js   # Global debug control and management
│   ├── debuggerDemo.js         # Usage examples and console commands
│   └── README.md               # Debugger documentation
├── test/                   # Test suites
│   ├── browser/            # Browser-based integration tests
│   └── *.test.js           # Node.js unit tests
├── docs/                   # Documentation and reports
│   └── reports/            # Development reports and fixes
├── scripts/                # Utility scripts for development
├── Images/                 # Game assets and sprites
└── libraries/              # External libraries (p5.js)
```

## 🧪 Testing

### Quick Start
```bash
npm run dev                # Start dev server (required for E2E tests)
npm test                   # Run all unit tests
npm run test:e2e          # Run all E2E browser tests
```

### E2E Browser Tests (Puppeteer)
```bash
npm run test:e2e:ui       # UI panel interaction tests
npm run test:e2e:camera   # Camera zoom/pan tests
npm run test:e2e:spawn    # Entity spawning tests
npm run test:e2e:combat   # Combat system tests

# Run individual test
node test/e2e/ui/pw_panel_minimize.js
```

**For AI Agents**: See [`docs/guides/E2E_TESTING_QUICKSTART.md`](docs/guides/E2E_TESTING_QUICKSTART.md) for complete E2E testing guide including:
- Server setup and management
- Advancing past main menu (critical!)
- Force rendering after state changes
- Screenshot verification expectations
- Complete working examples

Full E2E documentation: [`test/e2e/README.md`](test/e2e/README.md)

### Node.js Unit Tests
```bash
npm test                    # Run all tests
npm run test:ant           # Run ant-specific tests
npm run test:all           # Run comprehensive test suite
```

### Legacy Browser Tests (Being Migrated to E2E)
```bash
python -m http.server 8000                                    # Start server
# Then visit:
# http://localhost:8000/test/browser/integration-status.html  # Main integration tests
# http://localhost:8000/test/browser/error-test.html          # Error detection
# http://localhost:8000/test/browser/speed-test.html          # Speed validation
# http://localhost:8000/test/browser/validation-test.html     # Property validation
```

### Testing Standards
- **Methodology**: [`docs/standards/testing/TESTING_METHODOLOGY_STANDARDS.md`](docs/standards/testing/TESTING_METHODOLOGY_STANDARDS.md)
- **BDD Language**: [`docs/standards/testing/BDD_LANGUAGE_STYLE_GUIDE.md`](docs/standards/testing/BDD_LANGUAGE_STYLE_GUIDE.md)
- **Core Principle**: Tests must use system APIs and catch real bugs, not test internal mechanics

## 🎮 Running the Game

```bash
python -m http.server 8000
# Visit: http://localhost:8000
```

### 🔍 Debug Controls

The game includes a comprehensive entity debugging system:

| Key | Action |
|-----|--------|
| **`** | Toggle debug for nearest entities |
| **Shift + `** | Show ALL entity debuggers (up to 200) |
| **Alt + `** | Hide all entity debuggers |
| **Ctrl + `** | Cycle through selected entity debuggers |

**Console Commands:**
```javascript
setDebugLimit(50);           // Adjust debug limit
forceShowAllDebuggers();     // Override all limits
demonstrateEntityDebugger(); // Run debug demo
```

## 📖 Documentation

- **Development Reports**: See `docs/reports/` for detailed development history
- **Test Documentation**: See `test/browser/README.md` for browser test info  
- **Script Documentation**: See `scripts/README.md` for utility scripts
- **Debug System**: See `debug/README.md` for comprehensive debugger guide

## 🏗️ Architecture

### Entity-Controller Pattern
This project uses a controller-based architecture for behavior management:
- **Entity**: Base class with collision, sprite, and controller integration
- **MovementController**: Handles pathfinding and movement logic
- **TaskManager**: Manages priority-based task queues  
- **RenderController**: Handles visual rendering and effects
- **SelectionController**: Manages selection states and highlighting

### Debug System
- **UniversalDebugger**: Runtime object introspection and visualization
- **EntityDebugManager**: Global debug control with keyboard shortcuts
- **Automatic Integration**: All entities get debuggers with zero configuration

### Key Features
- **Hot-swappable debugging**: Toggle entity visualization on the fly
- **Multi-strategy bounds detection**: Works with various object structures
- **Performance optimized**: Smart limiting with override capabilities
- **Color-coded visualization**: 16-color palette for entity identification
