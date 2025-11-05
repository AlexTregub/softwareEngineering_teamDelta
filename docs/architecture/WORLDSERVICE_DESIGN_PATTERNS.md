# WorldService Design Patterns & Architecture

**Document**: WorldService Design Patterns Analysis  
**Date**: November 5, 2025  
**Phase**: 6 - Manager Elimination  
**Purpose**: Explain the design patterns and architectural decisions behind WorldService

---

## 📋 Overview

WorldService consolidates 40+ managers and 8 rendering classes into a single unified service (~1400 LOC). This document explains the design patterns used, trade-offs made, and architectural philosophy.

---

## 🏗️ Primary Design Patterns

### **1. Facade Pattern** ⭐ PRIMARY PATTERN

**Definition**: Provides a simplified, unified interface to a complex subsystem.

**Implementation**:
```javascript
// BEFORE: 40+ managers to coordinate
g_antManager.createAnt(x, y);
g_map2.getTileAt(x, y);
spatialGridManager.getNearbyEntities(x, y, r);
cameraManager.screenToWorld(x, y);
draggablePanelManager.registerPanel(panel);
RenderManager.render(gameState);

// AFTER: WorldService facade
world.spawnEntity('Ant', x, y);
world.getTileAt(x, y);
world.getNearbyEntities(x, y, r);
world.screenToWorld(x, y);
world.registerPanel(panel);
world.render();
```

**Benefits**:
- ✅ Hides complexity of 40+ subsystems
- ✅ Single entry point for all game world operations
- ✅ Drastically simplifies client code (sketch.js)
- ✅ Reduces cognitive load (one API to learn)

**Trade-offs**:
- ⚠️ Large interface (~100+ methods)
- ⚠️ Changes to subsystems may require facade updates

---

### **2. Service Locator Pattern**

**Definition**: Central registry providing access to services without tight coupling.

**Implementation**:
```javascript
class WorldService {
  constructor() {
    // WorldService IS the service locator
    this._entities = new Map();           // Entity registry service
    this._spatialGrid = new SpatialGrid(); // Spatial query service
    this._terrain = null;                 // Terrain service
    this._camera = { x: 0, y: 0, zoom: 1.0 }; // Camera service
    this._panels = new Map();             // UI panel service
    this._sounds = new Map();             // Audio service
  }
  
  // Clients get services through WorldService
  spawnEntity(type, x, y) { /* Entity service */ }
  getTileAt(x, y) { /* Terrain service */ }
  screenToWorld(x, y) { /* Camera service */ }
  registerPanel(panel) { /* UI service */ }
  playSound(name) { /* Audio service */ }
}
```

**Benefits**:
- ✅ Centralizes service access
- ✅ Reduces global variable pollution (40+ globals → 1)
- ✅ Easy to swap implementations (e.g., different terrain systems)
- ✅ Services are lazily initialized if needed

**Trade-offs**:
- ⚠️ Can hide dependencies (services coupled to WorldService)
- ⚠️ Testing requires full WorldService setup (mitigated by mocking)

---

### **3. Repository Pattern**

**Definition**: Mediates between domain layer and data mapping layer (acts like an in-memory collection).

**Implementation**:
```javascript
class WorldService {
  // Entity repository
  spawnEntity(type, x, y, options) { 
    const id = this._nextEntityId++;
    const entity = this._createEntity(type, x, y, options);
    this._entities.set(id, entity); // Add to repository
    return entity;
  }
  
  getEntityById(id) { 
    return this._entities.get(id); // Retrieve from repository
  }
  
  getEntitiesByType(type) { 
    return Array.from(this._entities.values())
      .filter(e => e.type === type); // Query repository
  }
  
  destroyEntity(id) { 
    const entity = this._entities.get(id);
    if (entity) {
      entity.destroy();
      this._entities.delete(id); // Remove from repository
    }
  }
  
  // UI Panel repository
  registerPanel(panel) { this._panels.set(panel.id, panel); }
  removePanel(id) { this._panels.delete(id); }
  
  // Sound repository
  loadSound(name, file) { this._sounds.set(name, loadSound(file)); }
  playSound(name) { this._sounds.get(name)?.play(); }
}
```

**Benefits**:
- ✅ Abstracts storage implementation (Map, Array, Database)
- ✅ Provides collection-like interface
- ✅ Encapsulates query logic
- ✅ Easy to add caching/persistence later

**Trade-offs**:
- ⚠️ May be overkill for simple in-memory storage
- ⚠️ Additional abstraction layer

---

### **4. Factory Method Pattern** (Delegated)

**Definition**: Defines interface for creating objects, but delegates instantiation to factories.

**Implementation**:
```javascript
class WorldService {
  constructor(antFactory, buildingFactory, resourceFactory) {
    // Dependency injection - factories passed in
    this._antFactory = antFactory;
    this._buildingFactory = buildingFactory;
    this._resourceFactory = resourceFactory;
  }
  
  spawnEntity(type, x, y, options) {
    // Delegate to appropriate factory
    let entity;
    
    switch(type) {
      case 'Ant':
        // Factory knows HOW to create ants
        entity = this._antFactory.createScout(x, y, options.faction);
        break;
        
      case 'Building':
        // Factory knows HOW to create buildings
        entity = this._buildingFactory.createAntCone(x, y, options.faction);
        break;
        
      case 'Resource':
        // Factory knows HOW to create resources
        entity = this._resourceFactory.createResource(options.resourceType, x, y);
        break;
    }
    
    // WorldService only knows WHEN/WHERE to create entities
    entity._id = this._nextEntityId++;
    this._entities.set(entity._id, entity);
    this._spatialGrid.insert(entity);
    
    return entity;
  }
}
```

**Benefits**:
- ✅ WorldService doesn't know HOW to create entities (separation of concerns)
- ✅ Easy to add new entity types (just inject new factory)
- ✅ Factories can be tested independently
- ✅ Follows Dependency Inversion Principle

**Trade-offs**:
- ⚠️ Requires factory injection (more setup code)
- ⚠️ Switch statement could be replaced with strategy pattern

---

### **5. Observer Pattern** (Implicit)

**Definition**: Objects notify observers when state changes.

**Implementation**:
```javascript
class WorldService {
  update(deltaTime) {
    // WorldService observes time changes
    for (const entity of this._entities.values()) {
      // Entities self-manage their state updates
      entity.update(deltaTime);
    }
    
    // Update spatial grid based on entity position changes
    for (const entity of this._entities.values()) {
      this._spatialGrid.update(entity);
    }
  }
  
  render() {
    // WorldService observes entity state for rendering
    const entities = Array.from(this._entities.values());
    
    // Sort by depth (entities with lower Y render first)
    entities.sort((a, b) => a.position.y - b.position.y);
    
    // Entities decide HOW to render themselves
    for (const entity of entities) {
      entity.render(); // Delegation, not micromanagement
    }
  }
}
```

**Benefits**:
- ✅ Loose coupling (WorldService doesn't micromanage entities)
- ✅ Entities self-manage state
- ✅ Easy to add new entity behaviors
- ✅ Follows Open/Closed Principle

**Trade-offs**:
- ⚠️ Implicit observer pattern (no formal subscribe/notify)
- ⚠️ Can be harder to debug (state changes happen in entities)

---

### **6. Singleton Pattern** (via Global)

**Definition**: Ensures only one instance exists and provides global access.

**Implementation**:
```javascript
// sketch.js
let world; // ONE global instance

function setup() {
  // Create once
  world = new WorldService(
    antFactory, 
    buildingFactory, 
    resourceFactory
  );
  
  world.loadTerrain({ width: 1000, height: 1000, seed: 12345 });
}

function draw() {
  // Global access
  world.update(deltaTime);
  world.render();
}

function mousePressed() {
  // Global access
  world.handleMousePress(mouseX, mouseY);
}
```

**Benefits**:
- ✅ Only one game world exists (enforced by convention)
- ✅ Global access point (replaces 40+ globals with 1)
- ✅ Prevents multiple conflicting instances
- ✅ Easy to access from anywhere

**Trade-offs**:
- ⚠️ Global state (can make testing harder)
- ⚠️ Not enforced by code (rely on convention: "only create one instance")
- ⚠️ Alternative: Pass `world` as parameter everywhere (verbose)

**Mitigation**:
- Tests create isolated WorldService instances
- Clear documentation: "Create ONE instance in setup()"

---

### **7. Strategy Pattern** (Rendering/Effects)

**Definition**: Defines family of algorithms, encapsulates each one, makes them interchangeable.

**Implementation**:
```javascript
class WorldService {
  constructor() {
    this._renderStrategy = 'default';
    this._effectStrategy = 'full';
  }
  
  setRenderStrategy(strategy) {
    this._renderStrategy = strategy; // 'default', 'performance', 'quality'
  }
  
  render() {
    // Select rendering strategy
    switch(this._renderStrategy) {
      case 'performance':
        this._renderPerformanceMode();
        break;
        
      case 'quality':
        this._renderQualityMode();
        break;
        
      default:
        this._renderDefaultMode();
    }
  }
  
  _renderDefaultMode() {
    this._renderTerrain();
    this._renderEntities();
    this._renderEffects();
    this._renderHUD();
  }
  
  _renderPerformanceMode() {
    // Skip effects, reduce quality for FPS
    this._renderTerrain();
    this._renderEntitiesSimplified();
    this._renderHUD();
  }
  
  _renderQualityMode() {
    // Add post-processing, shadows, etc.
    this._renderTerrainHighRes();
    this._renderEntitiesWithShadows();
    this._renderEffectsHighRes();
    this._renderHUD();
  }
}
```

**Benefits**:
- ✅ Runtime strategy switching based on performance
- ✅ Easy to add new strategies
- ✅ Follows Open/Closed Principle

**Trade-offs**:
- ⚠️ More code to maintain (multiple render paths)
- ⚠️ Strategies may diverge over time

---

### **8. Command Pattern** (Input Handling)

**Definition**: Encapsulates requests as objects, allowing parameterization and queuing.

**Implementation**:
```javascript
class WorldService {
  constructor() {
    // Command registry (keyboard shortcuts)
    this._shortcuts = new Map([
      ['Escape', { execute: () => this.togglePause(), description: 'Pause game' }],
      ['H', { execute: () => this.toggleHUD(), description: 'Toggle HUD' }],
      ['D', { execute: () => this.toggleDebug(), description: 'Toggle debug' }],
      ['M', { execute: () => this.toggleMinimap(), description: 'Toggle minimap' }]
    ]);
    
    // Command history (for undo/redo - future)
    this._commandHistory = [];
  }
  
  handleKeyPress(key) {
    const command = this._shortcuts.get(key);
    
    if (command) {
      command.execute(); // Execute command
      
      // Optionally log for undo/redo
      this._commandHistory.push({ command, timestamp: Date.now() });
    }
  }
  
  // Rebind shortcuts at runtime
  rebindShortcut(key, action) {
    this._shortcuts.set(key, { execute: action });
  }
}
```

**Benefits**:
- ✅ Decouples input from actions
- ✅ Easy to rebind keys
- ✅ Can add undo/redo later
- ✅ Commands are testable in isolation

**Trade-offs**:
- ⚠️ More abstraction (simple callbacks might suffice)
- ⚠️ Command history adds memory overhead

---

## 🚨 Anti-Patterns We're AVOIDING

### ❌ **God Object**

**Risk**: WorldService does A LOT (~1400 LOC, 100+ methods)

**Is it a God Object?**

**NO**, because:

1. **Clear Subsystems**: Each area is well-defined (~100-250 LOC per subsystem)
   - Entities: ~250 LOC
   - Terrain: ~100 LOC
   - Camera: ~100 LOC
   - Input: ~150 LOC
   - Rendering: ~200 LOC
   - Effects: ~100 LOC
   - HUD: ~100 LOC
   - UI Panels: ~100 LOC
   - Audio: ~50 LOC

2. **Coordinator, Not Micromanager**:
   - WorldService provides **interfaces**
   - Entities provide **implementations**
   - Entities manage their own behavior (not micromanaged)

3. **Delegation**:
   - Entity creation → Factories
   - Entity rendering → RenderController
   - Entity updates → Entity.update()
   - Spatial queries → SpatialGrid

4. **Cohesion**:
   - All methods relate to "game world"
   - No unrelated functionality

**Comparison**:
- ❌ God Object: 5000+ LOC, 500+ methods, does everything
- ✅ WorldService: 1400 LOC, ~100 methods, coordinates subsystems

**Alternative (40+ managers)**: Worse (tight coupling, 40+ globals, hard to coordinate)

---

### ❌ **Big Ball of Mud**

**Risk**: Everything in one file could become unorganized spaghetti code.

**Mitigation**:

1. **Section Comments**:
```javascript
class WorldService {
  constructor() {
    // === ENTITIES ===
    // === TERRAIN ===
    // === CAMERA ===
    // === INPUT ===
    // === RENDERING ===
    // === UI ===
    // === AUDIO ===
  }
  
  // === ENTITY API ===
  spawnEntity() { /* ... */ }
  getEntityById() { /* ... */ }
  
  // === TERRAIN API ===
  loadTerrain() { /* ... */ }
  getTileAt() { /* ... */ }
  
  // === CAMERA API ===
  setCameraPosition() { /* ... */ }
  screenToWorld() { /* ... */ }
}
```

2. **Consistent Naming**:
   - Public methods: `spawnEntity()`, `getTileAt()`
   - Private methods: `_renderTerrain()`, `_updateEffects()`
   - Subsystems: `_entities`, `_terrain`, `_camera`

3. **Grouped Functionality**:
   - All entity methods together
   - All terrain methods together
   - All rendering methods together

4. **Small Methods**:
   - Each method does ONE thing
   - 10-30 lines per method
   - Extract complex logic to private helpers

---

### ❌ **Leaky Abstraction**

**Risk**: Internal implementation details leak to client code.

**Mitigation**:

1. **Hide Implementation**:
```javascript
// ❌ BAD: Exposes Map implementation
world.getEntityRegistry().get(id);

// ✅ GOOD: Hides Map implementation
world.getEntityById(id);
```

2. **Consistent Interface**:
```javascript
// All queries return Arrays (never Maps, Sets, etc.)
world.getEntitiesByType('Ant'); // → Array<Entity>
world.getNearbyEntities(x, y, r); // → Array<Entity>
```

3. **No Internal State Exposure**:
```javascript
// ❌ BAD: Direct access to internal Map
const entities = world._entities;

// ✅ GOOD: Method returns copy
const entities = world.getAllEntities(); // → Array copy
```

---

## 🎯 Design Philosophy

WorldService follows **"Simple Made Easy"** principles:

### **Simple** (One Concept)
- WorldService **IS** the game world
- One responsibility: Coordinate game world subsystems
- No mixed concerns (no menu logic, no save/load, no networking)

### **Easy** (Low Barrier)
- One import: `world = new WorldService()`
- Intuitive API: `world.spawnEntity('Ant', x, y)`
- No complex setup (factories injected once)

### **Cohesive** (Related Functionality)
- All world-related logic in one place
- Entities + Terrain + Camera + Rendering = "Game World"
- UI Panels are part of game world (not separate system)

### **Low Coupling** (Independence)
- Entities don't know about WorldService internals
- Factories are injected (can be swapped)
- Rendering delegates to RenderController per entity

### **High Cohesion** (Single Purpose)
- Every method relates to game world
- No unrelated utility functions
- Clear separation between subsystems

---

## 📊 Pattern Summary

| Pattern | Usage | Primary Benefit |
|---------|-------|-----------------|
| **Facade** ⭐ | Primary pattern | Simplifies 40+ subsystems into one API |
| **Service Locator** | Central service access | Reduces global variables (40+ → 1) |
| **Repository** | Entity/panel storage | Abstracts storage implementation |
| **Factory Method** | Delegated entity creation | Separation of concerns (creation vs coordination) |
| **Observer** | Update/render coordination | Loose coupling (entities self-manage) |
| **Singleton** | One world instance | Consistency (one source of truth) |
| **Strategy** | Swappable algorithms | Adaptability (performance vs quality) |
| **Command** | Input handling | Extensibility (rebind keys, undo/redo) |

---

## ✅ Is This Good Design?

### **YES**, because:

1. **Pragmatic**: Solves real problem (40+ globals → 1)
2. **Maintainable**: 1 file vs 39 files (easier to navigate)
3. **Testable**: Mock WorldService, test entities in isolation
4. **Readable**: Clear API, well-organized sections
5. **Performant**: No unnecessary abstraction layers
6. **Extensible**: Easy to add new entity types, features

### **Trade-offs Accepted**:

1. **Large Class** (~1400 LOC)
   - Mitigated by: Clear sections, small methods, delegation
   - Alternative (40+ managers) is worse

2. **Not "Pure" OOP**
   - Pragmatism over dogma
   - Game development values simplicity over purity
   - Alternative (service layer hell) adds complexity

3. **Global State** (one `world` instance)
   - Mitigated by: Isolated tests, clear conventions
   - Alternative (pass world everywhere) is verbose

---

## 🔮 Future Considerations

### **When WorldService Gets Too Big**

If WorldService exceeds ~2000 LOC, consider splitting:

**Option A**: Extract subsystems as internal classes
```javascript
class WorldService {
  constructor() {
    this._entitySystem = new EntitySystem(factories);
    this._renderSystem = new RenderSystem();
    this._inputSystem = new InputSystem();
  }
  
  // Delegate to subsystems
  spawnEntity(type, x, y) { 
    return this._entitySystem.spawn(type, x, y); 
  }
  
  render() { 
    this._renderSystem.render(this._entitySystem.getAllEntities()); 
  }
}
```

**Option B**: Split into feature modules (while keeping facade)
```javascript
// Classes/services/WorldService.js (main facade)
// Classes/services/systems/EntitySystem.js
// Classes/services/systems/RenderSystem.js
// Classes/services/systems/InputSystem.js

// Client code unchanged
world.spawnEntity('Ant', x, y);
```

### **When to Extract**

Only extract if:
- ✅ Subsystem exceeds 500 LOC
- ✅ Subsystem is reusable elsewhere
- ✅ Team agrees extraction adds value

Don't extract if:
- ❌ Just for "purity" (pragmatism first)
- ❌ Creates circular dependencies
- ❌ Makes testing harder

---

## 📚 References

- **Design Patterns**: Gang of Four (GoF)
- **Service Locator**: Martin Fowler
- **Facade Pattern**: GoF, Head First Design Patterns
- **Repository Pattern**: Eric Evans (Domain-Driven Design)
- **"Simple Made Easy"**: Rich Hickey (Clojure creator)

---

## 🎯 Conclusion

WorldService uses a **pragmatic mix** of design patterns to solve a real problem: eliminating 40+ managers and 8 rendering classes while maintaining simplicity.

The design prioritizes:
1. **Simplicity** over purity
2. **Maintainability** over abstraction
3. **Pragmatism** over dogma

This is **good game development architecture** - not perfect academic OOP, but practical, maintainable, and fit for purpose.

**Result**: -89% code reduction (-12,104 LOC), -92% file reduction (39 → 3 files), -98% global reduction (40+ → 1).
