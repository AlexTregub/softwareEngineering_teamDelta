# MVC Pattern Refactoring Example - Entity Class

## Overview

The **Model-View-Controller (MVC)** pattern separates concerns into three layers:

- **Model**: Pure data and business logic (no rendering, no user input)
- **View**: Presentation layer (rendering, visual effects, UI)
- **Controller**: Coordination layer (handles input, updates model, triggers view updates)

## Current Architecture vs MVC

### Current Entity Class (Controller-Based)
Your current `Entity` class mixes all three concerns:
- **Data** (position, size, type, active state)
- **Business Logic** (movement, collision, tasks)
- **Rendering** (via RenderController, sprite management)
- **Input Handling** (isMouseOver, onClick)

### MVC Entity Architecture

```
EntityController (Controller)
    ├── Handles user input (clicks, hover)
    ├── Coordinates between Model and View
    └── Updates EntityModel and triggers EntityView refresh

EntityModel (Model)
    ├── Pure data (position, size, type, faction)
    ├── Business logic (collision, pathfinding, tasks)
    └── No rendering, no input handling
    └── Emits events when data changes

EntityView (View)
    ├── Rendering logic only
    ├── Reads from EntityModel
    ├── No business logic
    └── Listens to model change events
```

---

## Example Implementation

### 1. EntityModel (Model Layer)

**File**: `Classes/models/EntityModel.js`

```javascript
/**
 * EntityModel
 * -----------
 * Pure data model for game entities.
 * 
 * Responsibilities:
 * - Store entity state (position, size, type, faction, etc.)
 * - Provide business logic (collision detection, terrain queries)
 * - Emit events when state changes (for view updates)
 * - NO rendering logic
 * - NO input handling
 */
class EntityModel {
  constructor(x = 0, y = 0, width = 32, height = 32, options = {}) {
    // Core identity
    this._id = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this._type = options.type || "Entity";
    this._isActive = true;
    this._faction = options.faction || 'neutral';
    
    // Position/Transform (single source of truth)
    this._position = { x, y };
    this._size = { width, height };
    this._rotation = 0;
    
    // Movement state
    this._movementSpeed = options.movementSpeed || 100;
    this._isMoving = false;
    this._path = [];
    this._targetPosition = null;
    
    // Selection state
    this._isSelected = false;
    this._isSelectable = options.selectable !== false;
    
    // Combat state
    this._isInCombat = false;
    this._health = options.health || 100;
    this._maxHealth = options.maxHealth || 100;
    
    // Task queue
    this._taskQueue = [];
    this._currentTask = null;
    
    // Change listeners (for view updates)
    this._changeListeners = [];
    
    // Collision box (business logic, not rendering)
    this._collisionBox = new CollisionBox2D(x, y, width, height);
  }
  
  // --- Getters/Setters (with change notifications) ---
  
  get id() { return this._id; }
  get type() { return this._type; }
  get isActive() { return this._isActive; }
  
  get position() { return { ...this._position }; }
  setPosition(x, y) {
    if (this._position.x !== x || this._position.y !== y) {
      this._position.x = x;
      this._position.y = y;
      this._collisionBox.setPosition(x, y);
      this._notifyChange('position', { x, y });
      
      // Update spatial grid
      if (typeof spatialGridManager !== 'undefined') {
        spatialGridManager.updateEntity(this);
      }
    }
  }
  
  get size() { return { ...this._size }; }
  setSize(width, height) {
    if (this._size.width !== width || this._size.height !== height) {
      this._size.width = width;
      this._size.height = height;
      this._collisionBox.setSize(width, height);
      this._notifyChange('size', { width, height });
    }
  }
  
  get isSelected() { return this._isSelected; }
  setSelected(selected) {
    if (this._isSelected !== selected) {
      this._isSelected = selected;
      this._notifyChange('selection', { isSelected: selected });
    }
  }
  
  get health() { return this._health; }
  setHealth(value) {
    const newHealth = Math.max(0, Math.min(value, this._maxHealth));
    if (this._health !== newHealth) {
      const oldHealth = this._health;
      this._health = newHealth;
      this._notifyChange('health', { health: newHealth, delta: newHealth - oldHealth });
    }
  }
  
  // --- Business Logic (collision, pathfinding, terrain) ---
  
  collidesWith(otherModel) {
    if (otherModel._collisionBox) {
      return this._collisionBox.intersects(otherModel._collisionBox);
    }
    return false;
  }
  
  contains(x, y) {
    return this._collisionBox.contains(x, y);
  }
  
  moveToLocation(targetX, targetY) {
    this._targetPosition = { x: targetX, y: targetY };
    // Calculate path using pathfinding system
    const path = this._calculatePath(this._position.x, this._position.y, targetX, targetY);
    this.setPath(path);
  }
  
  setPath(path) {
    this._path = path || [];
    this._isMoving = path && path.length > 0;
    this._notifyChange('movement', { isMoving: this._isMoving, path: this._path });
  }
  
  getCurrentTerrain() {
    if (typeof g_map2 !== 'undefined' && g_map2) {
      const tileSize = window.TILE_SIZE || 32;
      const tileX = Math.floor(this._position.x / tileSize);
      const tileY = Math.floor(this._position.y / tileSize);
      const tile = g_map2.getTileAtGridCoords(tileX, tileY);
      return tile ? tile.type : 'DEFAULT';
    }
    return 'DEFAULT';
  }
  
  addTask(task) {
    this._taskQueue.push(task);
    if (!this._currentTask) {
      this._currentTask = this._taskQueue.shift();
      this._notifyChange('task', { currentTask: this._currentTask });
    }
  }
  
  // --- Update Loop (business logic only, no rendering) ---
  
  update(deltaTime) {
    if (!this._isActive) return;
    
    // Update movement
    if (this._isMoving && this._path.length > 0) {
      this._updateMovement(deltaTime);
    }
    
    // Update current task
    if (this._currentTask) {
      this._updateTask(deltaTime);
    }
    
    // Update combat state
    if (this._isInCombat) {
      this._updateCombat(deltaTime);
    }
  }
  
  _updateMovement(deltaTime) {
    // Movement logic (follows path)
    if (this._path.length === 0) {
      this._isMoving = false;
      this._notifyChange('movement', { isMoving: false });
      return;
    }
    
    const target = this._path[0];
    const dx = target.x - this._position.x;
    const dy = target.y - this._position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 5) {
      this._path.shift();
      return;
    }
    
    const moveDistance = this._movementSpeed * (deltaTime / 1000);
    const moveX = (dx / distance) * moveDistance;
    const moveY = (dy / distance) * moveDistance;
    
    this.setPosition(this._position.x + moveX, this._position.y + moveY);
  }
  
  _updateTask(deltaTime) {
    // Task execution logic
    if (this._currentTask && this._currentTask.isComplete()) {
      this._currentTask = this._taskQueue.shift() || null;
      this._notifyChange('task', { currentTask: this._currentTask });
    }
  }
  
  _updateCombat(deltaTime) {
    // Combat logic
  }
  
  // --- Change Notification System ---
  
  addChangeListener(callback) {
    this._changeListeners.push(callback);
  }
  
  removeChangeListener(callback) {
    const index = this._changeListeners.indexOf(callback);
    if (index > -1) this._changeListeners.splice(index, 1);
  }
  
  _notifyChange(property, data) {
    this._changeListeners.forEach(listener => {
      try {
        listener(property, data, this);
      } catch (error) {
        console.warn('Error in change listener:', error);
      }
    });
  }
  
  // --- Helper Methods ---
  
  _calculatePath(startX, startY, endX, endY) {
    // Use existing pathfinding system
    if (typeof findPath === 'function') {
      return findPath(startX, startY, endX, endY);
    }
    return [{ x: endX, y: endY }];
  }
  
  // --- Serialization (for save/load) ---
  
  toJSON() {
    return {
      id: this._id,
      type: this._type,
      position: this._position,
      size: this._size,
      faction: this._faction,
      health: this._health,
      maxHealth: this._maxHealth,
      isSelected: this._isSelected,
      taskQueue: this._taskQueue
    };
  }
  
  static fromJSON(data) {
    const model = new EntityModel(
      data.position.x,
      data.position.y,
      data.size.width,
      data.size.height,
      {
        type: data.type,
        faction: data.faction,
        health: data.health,
        maxHealth: data.maxHealth
      }
    );
    model._id = data.id;
    model._isSelected = data.isSelected;
    model._taskQueue = data.taskQueue || [];
    return model;
  }
  
  destroy() {
    this._isActive = false;
    this._changeListeners = [];
    
    if (typeof spatialGridManager !== 'undefined') {
      spatialGridManager.removeEntity(this);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityModel;
}
```

---

### 2. EntityView (View Layer)

**File**: `Classes/views/EntityView.js`

```javascript
/**
 * EntityView
 * ----------
 * Pure rendering layer for entities.
 * 
 * Responsibilities:
 * - Render entity sprite/image
 * - Render selection highlights
 * - Render visual effects (damage numbers, sparkles)
 * - Render debug overlays
 * - Listen to model changes and update visuals
 * - NO business logic
 * - NO input handling
 */
class EntityView {
  constructor(model, options = {}) {
    this._model = model;
    this._options = options;
    
    // Sprite component
    this._sprite = null;
    if (typeof Sprite2d !== 'undefined' && options.imagePath) {
      const pos = model.position;
      const size = model.size;
      this._sprite = new Sprite2d(
        options.imagePath,
        createVector(pos.x, pos.y),
        createVector(size.width, size.height),
        0
      );
    }
    
    // Visual state
    this._opacity = 1.0;
    this._highlightType = null;
    this._highlightIntensity = 0;
    this._effects = [];
    
    // Debug overlay
    this._debugger = null;
    if (typeof UniversalDebugger !== 'undefined') {
      this._debugger = new UniversalDebugger(model, options.debugConfig || {});
    }
    
    // Listen to model changes
    this._modelChangeHandler = this._onModelChange.bind(this);
    model.addChangeListener(this._modelChangeHandler);
  }
  
  // --- Rendering Methods ---
  
  render() {
    if (!this._model.isActive) return;
    
    push();
    
    // Apply transformations
    const pos = this._model.position;
    const size = this._model.size;
    
    // Render sprite
    if (this._sprite) {
      this._renderSprite(pos, size);
    } else {
      this._renderPlaceholder(pos, size);
    }
    
    // Render selection highlight
    if (this._model.isSelected) {
      this._renderSelectionHighlight(pos, size);
    }
    
    // Render hover highlight
    if (this._highlightType) {
      this._renderHighlight(pos, size);
    }
    
    // Render effects
    this._renderEffects();
    
    // Render debug overlay
    if (this._debugger && this._debugger.isActive) {
      this._debugger.render();
    }
    
    pop();
  }
  
  _renderSprite(pos, size) {
    push();
    translate(pos.x, pos.y);
    
    if (this._opacity < 1.0) {
      tint(255, this._opacity * 255);
    }
    
    this._sprite.render();
    
    pop();
  }
  
  _renderPlaceholder(pos, size) {
    push();
    
    // Default placeholder (white rectangle)
    fill(255, 255, 255, this._opacity * 255);
    stroke(0);
    strokeWeight(1);
    rectMode(CENTER);
    rect(pos.x, pos.y, size.width, size.height);
    
    pop();
  }
  
  _renderSelectionHighlight(pos, size) {
    push();
    
    noFill();
    stroke(0, 255, 0);
    strokeWeight(2);
    rectMode(CENTER);
    rect(pos.x, pos.y, size.width + 4, size.height + 4);
    
    pop();
  }
  
  _renderHighlight(pos, size) {
    push();
    
    // Highlight based on type
    switch (this._highlightType) {
      case 'hover':
        noFill();
        stroke(255, 255, 0, 150);
        strokeWeight(2);
        rectMode(CENTER);
        rect(pos.x, pos.y, size.width + 2, size.height + 2);
        break;
        
      case 'combat':
        noFill();
        stroke(255, 0, 0, 200);
        strokeWeight(3);
        rectMode(CENTER);
        rect(pos.x, pos.y, size.width + 6, size.height + 6);
        break;
        
      case 'spinning':
        // Spinning highlight effect
        const angle = (frameCount * 0.05) % TWO_PI;
        translate(pos.x, pos.y);
        rotate(angle);
        noFill();
        stroke(100, 200, 255, 150);
        strokeWeight(2);
        rectMode(CENTER);
        rect(0, 0, size.width + 4, size.height + 4);
        break;
    }
    
    pop();
  }
  
  _renderEffects() {
    this._effects.forEach((effect, index) => {
      effect.render();
      effect.update();
      
      if (effect.isComplete()) {
        this._effects.splice(index, 1);
      }
    });
  }
  
  // --- Model Change Handler ---
  
  _onModelChange(property, data, model) {
    switch (property) {
      case 'position':
        // Update sprite position
        if (this._sprite) {
          this._sprite.setPosition(createVector(data.x, data.y));
        }
        break;
        
      case 'size':
        // Update sprite size
        if (this._sprite) {
          this._sprite.setSize(createVector(data.width, data.height));
        }
        break;
        
      case 'selection':
        // Selection changed - view will render highlight on next frame
        break;
        
      case 'health':
        // Show damage/heal number
        if (data.delta < 0) {
          this.addDamageNumber(Math.abs(data.delta));
        } else if (data.delta > 0) {
          this.addHealNumber(data.delta);
        }
        break;
    }
  }
  
  // --- Visual Effects ---
  
  setHighlight(type, intensity = 1.0) {
    this._highlightType = type;
    this._highlightIntensity = intensity;
  }
  
  clearHighlight() {
    this._highlightType = null;
    this._highlightIntensity = 0;
  }
  
  addEffect(effect) {
    this._effects.push(effect);
  }
  
  addDamageNumber(damage) {
    const pos = this._model.position;
    const effect = new DamageNumberEffect(pos.x, pos.y - 20, `-${damage}`, [255, 0, 0]);
    this._effects.push(effect);
  }
  
  addHealNumber(heal) {
    const pos = this._model.position;
    const effect = new DamageNumberEffect(pos.x, pos.y - 20, `+${heal}`, [0, 255, 0]);
    this._effects.push(effect);
  }
  
  setOpacity(opacity) {
    this._opacity = Math.max(0, Math.min(1, opacity));
  }
  
  setImage(imagePath) {
    if (this._sprite) {
      this._sprite.setImage(imagePath);
    }
  }
  
  // --- Debug ---
  
  toggleDebugger(forceState) {
    if (this._debugger) {
      if (typeof forceState === 'boolean') {
        if (forceState) this._debugger.activate();
        else this._debugger.deactivate();
      } else {
        this._debugger.toggle();
      }
    }
  }
  
  // --- Cleanup ---
  
  destroy() {
    // Remove model listener
    if (this._model && this._modelChangeHandler) {
      this._model.removeChangeListener(this._modelChangeHandler);
    }
    
    // Clear effects
    this._effects = [];
    
    // Destroy sprite
    if (this._sprite) {
      this._sprite = null;
    }
    
    // Destroy debugger
    if (this._debugger) {
      this._debugger = null;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityView;
}
```

---

### 3. EntityController (Controller Layer)

**File**: `Classes/controllers/EntityController.js`

```javascript
/**
 * EntityController
 * ----------------
 * Coordination layer between EntityModel and EntityView.
 * 
 * Responsibilities:
 * - Handle user input (mouse clicks, hover)
 * - Coordinate model updates and view refreshes
 * - Provide public API for game systems
 * - NO business logic (delegates to model)
 * - NO rendering (delegates to view)
 */
class EntityController {
  constructor(x = 0, y = 0, width = 32, height = 32, options = {}) {
    // Create model
    this._model = new EntityModel(x, y, width, height, options);
    
    // Create view
    this._view = new EntityView(this._model, options);
    
    // Input handling state
    this._isHovered = false;
  }
  
  // --- Public API (delegates to model/view) ---
  
  // Identity
  get id() { return this._model.id; }
  get type() { return this._model.type; }
  get isActive() { return this._model.isActive; }
  
  // Position/Transform
  getPosition() { return this._model.position; }
  setPosition(x, y) { this._model.setPosition(x, y); }
  getSize() { return this._model.size; }
  setSize(width, height) { this._model.setSize(width, height); }
  
  // Selection
  isSelected() { return this._model.isSelected; }
  setSelected(selected) { this._model.setSelected(selected); }
  toggleSelection() { this._model.setSelected(!this._model.isSelected); }
  
  // Movement
  moveToLocation(x, y) { this._model.moveToLocation(x, y); }
  setPath(path) { this._model.setPath(path); }
  isMoving() { return this._model._isMoving; }
  stop() { this._model.setPath([]); }
  
  // Combat
  takeDamage(damage) {
    const currentHealth = this._model.health;
    this._model.setHealth(currentHealth - damage);
  }
  
  heal(amount) {
    const currentHealth = this._model.health;
    this._model.setHealth(currentHealth + amount);
  }
  
  // Tasks
  addTask(task) { this._model.addTask(task); }
  getCurrentTask() { return this._model._currentTask; }
  
  // Collision
  collidesWith(otherController) {
    return this._model.collidesWith(otherController._model);
  }
  
  contains(x, y) { return this._model.contains(x, y); }
  
  // Terrain
  getCurrentTerrain() { return this._model.getCurrentTerrain(); }
  
  // Visual
  setImage(imagePath) { this._view.setImage(imagePath); }
  setOpacity(opacity) { this._view.setOpacity(opacity); }
  setHighlight(type, intensity) { this._view.setHighlight(type, intensity); }
  clearHighlight() { this._view.clearHighlight(); }
  
  // --- Input Handling ---
  
  handleMouseMove(mouseX, mouseY) {
    // Convert screen to world coordinates
    const worldMouse = (typeof CoordinateConverter !== 'undefined') ?
      CoordinateConverter.screenToWorld(mouseX, mouseY) :
      { x: mouseX, y: mouseY };
    
    const wasHovered = this._isHovered;
    this._isHovered = this._model.contains(worldMouse.x, worldMouse.y);
    
    // Trigger hover effects
    if (this._isHovered && !wasHovered) {
      this._onHoverEnter();
    } else if (!this._isHovered && wasHovered) {
      this._onHoverExit();
    }
    
    return this._isHovered;
  }
  
  handleMouseClick(mouseX, mouseY) {
    const worldMouse = (typeof CoordinateConverter !== 'undefined') ?
      CoordinateConverter.screenToWorld(mouseX, mouseY) :
      { x: mouseX, y: mouseY };
    
    if (this._model.contains(worldMouse.x, worldMouse.y)) {
      this._onClick();
      return true; // Click was handled
    }
    
    return false;
  }
  
  _onHoverEnter() {
    this._view.setHighlight('hover');
  }
  
  _onHoverExit() {
    this._view.clearHighlight();
  }
  
  _onClick() {
    // Toggle selection on click
    this.toggleSelection();
  }
  
  // --- Update/Render (delegates to model/view) ---
  
  update(deltaTime) {
    if (!this._model.isActive) return;
    
    // Update model (business logic)
    this._model.update(deltaTime);
  }
  
  render() {
    if (!this._model.isActive) return;
    
    // Render view
    this._view.render();
  }
  
  // --- Debug ---
  
  getDebugInfo() {
    return {
      id: this._model.id,
      type: this._model.type,
      position: this._model.position,
      size: this._model.size,
      isSelected: this._model.isSelected,
      isMoving: this._model._isMoving,
      health: this._model.health,
      isHovered: this._isHovered
    };
  }
  
  toggleDebugger(forceState) {
    this._view.toggleDebugger(forceState);
  }
  
  // --- Cleanup ---
  
  destroy() {
    this._model.destroy();
    this._view.destroy();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityController;
}
```

---

## Usage Comparison

### Current Usage (Controller-Based)
```javascript
// Create entity
const ant = new Entity(100, 100, 32, 32, { type: 'Ant', faction: 'player' });

// Move entity
ant.moveToLocation(200, 200);

// Render entity
ant.render();

// Handle input (mixed in with other code)
if (ant.isMouseOver()) {
  ant.setSelected(true);
}
```

### MVC Usage
```javascript
// Create entity controller (creates model + view internally)
const antController = new EntityController(100, 100, 32, 32, { 
  type: 'Ant', 
  faction: 'player' 
});

// Move entity (delegates to model)
antController.moveToLocation(200, 200);

// Render entity (delegates to view)
antController.render();

// Handle input (controller responsibility)
function mousePressed() {
  entities.forEach(controller => {
    controller.handleMouseClick(mouseX, mouseY);
  });
}

function mouseMoved() {
  entities.forEach(controller => {
    controller.handleMouseMove(mouseX, mouseY);
  });
}
```

---

## Benefits of MVC Pattern

### 1. Separation of Concerns
- **Model** = Pure data/logic (easy to test, no p5.js dependencies)
- **View** = Pure rendering (can swap rendering systems)
- **Controller** = Coordination (clean input handling)

### 2. Testability
```javascript
// Test model without rendering
const model = new EntityModel(100, 100, 32, 32);
model.setPosition(200, 200);
assert.equal(model.position.x, 200);
assert.equal(model.position.y, 200);

// Test collision without rendering
const model1 = new EntityModel(100, 100, 32, 32);
const model2 = new EntityModel(110, 110, 32, 32);
assert.isTrue(model1.collidesWith(model2));
```

### 3. Multiple Views
```javascript
// Same model, different views
const model = new EntityModel(100, 100, 32, 32);

// Game view (full rendering)
const gameView = new EntityView(model, { imagePath: 'ant.png' });

// Minimap view (simplified rendering)
const minimapView = new MinimapEntityView(model, { color: 'blue' });

// Both views update when model changes
model.setPosition(200, 200); // Both views auto-update
```

### 4. Save/Load
```javascript
// Serialize model (no rendering state)
const modelData = antController._model.toJSON();
localStorage.setItem('savedAnt', JSON.stringify(modelData));

// Load model and recreate controller
const loadedData = JSON.parse(localStorage.getItem('savedAnt'));
const loadedModel = EntityModel.fromJSON(loadedData);
const loadedController = new EntityController(0, 0, 32, 32, {});
loadedController._model = loadedModel;
loadedController._view = new EntityView(loadedModel, { imagePath: 'ant.png' });
```

---

## Migration Strategy

### Phase 1: Create Model Classes (TDD)
1. Write unit tests for `EntityModel` (no rendering dependencies)
2. Implement `EntityModel` (pure data/logic)
3. Test collision, pathfinding, terrain queries

### Phase 2: Create View Classes (E2E)
1. Write E2E tests with screenshots
2. Implement `EntityView` (rendering only)
3. Test visual output matches current rendering

### Phase 3: Create Controller Classes (Integration)
1. Write integration tests (model + view + input)
2. Implement `EntityController` (coordination)
3. Test input handling, model updates, view refreshes

### Phase 4: Refactor Existing Code
1. Replace `Entity` with `EntityController` in game code
2. Update manager classes (AntManager, ResourceManager)
3. Run full test suite (ensure no regressions)

---

## Key Differences

| Aspect | Current (Controller-Based) | MVC Pattern |
|--------|---------------------------|-------------|
| **Data Storage** | Mixed in Entity class | EntityModel (pure data) |
| **Rendering** | RenderController in Entity | EntityView (separate class) |
| **Input Handling** | Mixed in Entity/game code | EntityController (dedicated) |
| **Testing** | Hard (p5.js dependencies) | Easy (model is pure JS) |
| **Serialization** | Complex (many properties) | Simple (model.toJSON()) |
| **Multiple Views** | Not possible | Easy (multiple views per model) |
| **Change Notifications** | Manual/implicit | Explicit (model events) |

---

## Questions to Consider

1. **Backward Compatibility**: Do we need to support old `Entity` class during migration?
2. **Manager Classes**: Do AntManager, ResourceManager need refactoring too?
3. **Performance**: Will extra indirection (model → controller → view) impact performance?
4. **Testing Strategy**: Unit tests first (model), then integration (controller), then E2E (view)?
5. **Naming Conventions**: EntityController vs EntityManager? EntityView vs EntityRenderer?
6. **Global Access**: Should models be accessible via `window.entities` for debugging?

---

## Next Steps

1. **Review this example** - Does this match your team's MVC vision?
2. **Create feature checklist** - Use `docs/checklists/templates/FEATURE_DEVELOPMENT_CHECKLIST.md`
3. **Start with one entity type** - Refactor Ant first (smallest scope)
4. **Write tests FIRST** - TDD for model, integration for controller, E2E for view
5. **Measure performance** - Benchmark before/after (ensure no regressions)

---

## Additional Resources

- **MVC Pattern**: https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller
- **Observer Pattern** (for model change notifications): https://refactoring.guru/design-patterns/observer
- **Testing Methodology**: `docs/standards/testing/TESTING_METHODOLOGY_STANDARDS.md`
