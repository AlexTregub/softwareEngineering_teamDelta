# softwareEngineering_teamDelta
Team contrib repo for Software Engineering course with Dr. Delozier (CS33901)

## 📁 Project Structure

```
├── Classes/                 # Core game classes and systems
│   ├── ants/               # Ant-related classes (ant, species, state machine)
│   ├── entities/           # Base entity classes (sprite2d, stats)
│   ├── systems/            # Controller classes (movement, task, render)
│   └── managers/           # Game managers (ant manager, resource manager)
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

### Node.js Tests
```bash
npm test                    # Run all tests
npm run test:ant           # Run ant-specific tests
npm run test:all           # Run comprehensive test suite
```

### Browser Tests
```bash
python -m http.server 8000                                    # Start server
# Then visit:
# http://localhost:8000/test/browser/integration-status.html  # Main integration tests
# http://localhost:8000/test/browser/error-test.html          # Error detection
# http://localhost:8000/test/browser/speed-test.html          # Speed validation
# http://localhost:8000/test/browser/validation-test.html     # Property validation
```

## 🎮 Running the Game

```bash
python -m http.server 8000
# Visit: http://localhost:8000
```

## 📖 Documentation

- **Development Reports**: See `docs/reports/` for detailed development history
- **Test Documentation**: See `test/browser/README.md` for browser test info  
- **Script Documentation**: See `scripts/README.md` for utility scripts

## 🏗️ Architecture

This project uses a controller pattern for ant behavior management:
- **MovementController**: Handles pathfinding and movement logic
- **TaskManager**: Manages priority-based task queues  
- **RenderController**: Handles visual rendering and effects
