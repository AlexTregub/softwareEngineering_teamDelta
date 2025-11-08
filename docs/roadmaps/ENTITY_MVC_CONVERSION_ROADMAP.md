# Entity Class MVC Conversion Roadmap

## 🎉 PHASE 1 COMPLETE: BaseMVC Foundation

**Status**: ✅ **COMPLETE** - 153 tests passing (100% TDD coverage)

**Completed Components**:
1. ✅ **EntityModel** (49 tests) - Pure data storage with event system
   - Core identity (ID, type, active state)
   - Transform data (position, size, rotation)
   - Visual data (image path, opacity)
   - Movement state (target, path, moving flag)
   - Selection state (selected, hovered, boxHovered)
   - Faction management
   - Event-driven architecture (on/off/emit)
   - Full validation with error handling

2. ✅ **EntityView** (36 tests) - Pure rendering without business logic
   - p5.js rendering with availability checks
   - Coordinate conversion (world ↔ screen) with camera integration
   - Highlight rendering (selection, hover, box) with proper colors
   - Sprite management and synchronization
   - Opacity support with tinting
   - Rotation rendering with proper transforms
   - Fallback rendering when sprites unavailable

3. ✅ **EntityController** (68 tests) - Business logic coordination
   - Model and View lifecycle management
   - Selection logic (click, hover, box selection)
   - Movement coordination (target, path, stop)
   - Update loop with spatial grid integration
   - Position/size/rotation management
   - Rendering coordination through View
   - Spatial queries (nearby, nearest)
   - Faction management and comparison
   - Event propagation from Model
   - Opacity fading (fadeIn, fadeOut)
   - Debug information aggregation

**Files Created**:
- `Classes/baseMVC/models/EntityModel.js` - Data model with validation
- `Classes/baseMVC/views/EntityView.js` - Rendering view
- `Classes/baseMVC/controllers/EntityController.js` - Business logic
- `test/unit/baseMVC/EntityModel.test.js` - 49 tests
- `test/unit/baseMVC/EntityView.test.js` - 36 tests  
- `test/unit/baseMVC/EntityController.test.js` - 68 tests
- Updated `index.html` - baseMVC scripts loaded before Entity.js

**TDD Process Verified**:
- Red phase: Tests written first, confirmed failing
- Green phase: Implementation written, tests pass
- All 153 tests passing in <250ms
- Zero regressions, full coverage

**Next Steps**: Phase 2 - Entity Adapter (connect baseMVC to current Entity class)

---

## ⚠️ EXECUTIVE SUMMARY: Consolidation Analysis Complete

**Analysis Status**: ✅ COMPLETE - All entity types and controllers analyzed

**Scope Analyzed**:
- ✅ Entity base class (843 lines)
- ✅ Ant subclass (997 lines) 
- ✅ Resource subclass (564 lines)
- ✅ Building subclass (~280 lines)
- ✅ **All 8 Controllers**: Transform, Movement, Selection, Render, Combat, Health, Terrain, TaskManager

**Duplicate Patterns Found**: **20 CRITICAL patterns** identified across entities and controllers

**Code Reduction Potential**:
- Entity subclasses: ~200+ lines of duplicate code
- Controllers: ~300+ lines of duplicate code
- **Total Savings: 500+ lines** consolidated into base MVC classes

**Key Findings**:
1. **Die/Cleanup Pattern** - All 3 subclasses duplicate array removal logic (100+ lines)
2. **Box Hover Rendering** - Ant + Building duplicate identical code (20+ lines)
3. **Delta Time Tracking** - Ant + Building duplicate frame timing (15+ lines each)
4. **Global Array Registration** - All 3 subclasses duplicate registration logic (30+ lines)
5. **Timed Check Pattern** - 4 controllers duplicate interval/timer logic (80+ lines)
6. **Position Change Detection** - 2 controllers duplicate change tracking (30+ lines)
7. **Debug Info Pattern** - ALL 8 controllers duplicate getDebugInfo() (80+ lines)
8. **Coordinate Conversion** - 2 controllers use DIFFERENT systems (inconsistency bug!)
9. **Callback Pattern** - 2 controllers duplicate callback arrays (40+ lines)
10. **Configuration Objects** - 2 controllers duplicate config management (50+ lines)

**Architecture Improvements**:
- ✅ Single source of truth for all state
- ✅ Consistent behavior across all entities  
- ✅ Reduced controller coupling
- ✅ Reusable utility classes (TimerBehavior, CacheBehavior)
- ✅ Standardized event system
- ✅ Unified coordinate handling (fixes inconsistency bug)
- ✅ Comprehensive debug aggregation

**Recommendation**: Proceed with MVC conversion using this roadmap. All consolidation opportunities identified and documented below.

---

## Overview

This document outlines the plan to convert the Entity class from its current controller-based composition pattern to a proper Model-View-Controller (MVC) architecture. The goal is to achieve better separation of concerns while retaining all current functionality.

**Current State**: Entity.js is a hybrid container that composes controllers but also contains direct logic, state, and rendering coordination.

**Target State**: Clean MVC separation with EntityModel (data), EntityView (rendering), and EntityController (logic/coordination).

---

## Current Architecture Overview

The Entity class currently uses a **controller-based composition pattern** where:
- Entity acts as a container and coordinator
- Multiple controllers handle specific concerns (movement, rendering, selection, etc.)
- Entity provides delegation methods and enhanced APIs
- Controllers have direct references to Entity (tight coupling)

**Controllers in Use:**
- TransformController - Position, rotation, scale
- MovementController - Pathfinding, movement speed
- RenderController - Visual rendering, effects
- SelectionController - Selection states, highlighting
- CombatController - Combat logic, enemy detection
- TerrainController - Terrain detection, modifiers
- TaskManager - Task queue, priority handling
- HealthController - Health management

---

## ⚠️ CRITICAL: Common Patterns That MUST Go in Base MVC

After analyzing Entity, Ant, Resource, and Building classes, the following patterns appear in **ALL or MOST** entity types and **MUST** be consolidated into the base MVC classes:

### 1. Die/Cleanup Pattern (ALL 3 subclasses duplicate this!)

**Current State**: Ant, Building, Resource all implement custom `die()` or cleanup with nearly **identical** array removal logic:

```javascript
// Ant.die() - Lines ~316-390 (ants.js)
die() {
  const index = ants.indexOf(this);
  if (index !== -1) ants.splice(index, 1);
  
  const sidx = selectables.indexOf(this);
  if (sidx !== -1) selectables.splice(sidx, 1);
  
  spatialGridManager.removeEntity(this);
  // ... more cleanup
}

// Building.die() - Lines ~290-307 (BuildingManager.js)
die() {
  this.isActive = false;
  this._isDead = true;
  const idx = Buildings.indexOf(this);
  if (idx !== -1) Buildings.splice(idx, 1);
  
  const sidx = selectables.indexOf(this);
  if (sidx !== -1) selectables.splice(sidx, 1);
  // ... more cleanup
}
```

**SOLUTION - Add to EntityController**:
- [ ] `die()` - Base death/cleanup method
- [ ] `unregisterFromGlobals()` - Remove from all global arrays (ants, Buildings, selectables, etc.)
- [ ] `cleanupSpatialGrid()` - Remove from spatial grid
- [ ] `cleanupControllers()` - Controller-specific cleanup
- [ ] Subclasses call `super.die()` then do entity-specific cleanup

**BENEFIT**: Eliminates ~100+ lines of duplicate cleanup code across 3 classes

### 2. Box Hover Rendering (Ant + Building duplicate this!)

**Current State**: Both Ant and Building have **identical** `isBoxHovered` + `_renderBoxHover()` pattern:

```javascript
// Ant property (line 58)
this.isBoxHovered = false;

// Ant method (lines 518-520)
_renderBoxHover() {
  this._renderController.highlightBoxHover();
}

// Ant render (lines 627-629)
if (this.isBoxHovered) {
  this._renderBoxHover();
}

// Building - EXACT SAME PATTERN (lines 114, 273-274, 285-286)
```

**SOLUTION - Add to EntityView**:
- [ ] `isBoxHovered` state → Move to EntityModel
- [ ] `_renderBoxHover()` → Consolidate in EntityView
- [ ] Auto-render in EntityView.render() if `model.isBoxHovered === true`
- [ ] Eliminate duplicate code in subclasses

**BENEFIT**: Eliminates ~20+ lines of duplicate hover rendering code

### 3. lastFrameTime Delta Tracking (Ant + Building duplicate this!)

**Current State**: Both Ant and Building track frame time for delta calculations:

```javascript
// Ant (line 59)
this.lastFrameTime = performance.now();

// Building (line 115)
this.lastFrameTime = performance.now();

// Building.update() (lines 220-222)
const now = performance.now();
const deltaTime = (now - this.lastFrameTime) / 1000;
this.lastFrameTime = now;
```

**SOLUTION - Add to EntityController**:
- [ ] `_lastFrameTime` property in EntityModel (or EntityController private)
- [ ] `update(deltaTime)` - Calculate deltaTime automatically in EntityController.update()
- [ ] Pass calculated `deltaTime` to behavior classes
- [ ] Subclasses receive pre-calculated deltaTime, no manual tracking

**BENEFIT**: Eliminates duplicate timing logic, ensures consistent delta calculations

### 4. Global Array Registration Pattern (ALL 3 need this!)

**Current State**: Ant, Building, Resource all manually register in global arrays:

```javascript
// Building.createBuilding() - Lines 327-337
if (typeof Buildings !== 'undefined' && !Buildings.includes(building)) 
  Buildings.push(building);

if (typeof selectables !== 'undefined' && !selectables.includes(building)) 
  selectables.push(building);

// Ant - Similar pattern in constructor/spawning
// Resource - Similar pattern in ResourceSystemManager
```

**SOLUTION - Add to EntityController**:
- [ ] `registerInGlobals()` - Smart registration based on entity type
- [ ] Type-to-array mapping: `{ "Ant": ants, "Building": Buildings, "Resource": globalResource }`
- [ ] Auto-register in EntityController constructor (optional flag to disable)
- [ ] `unregisterFromGlobals()` in die() automatically knows which arrays to clean

**BENEFIT**: Eliminates manual array management, prevents registration bugs, single source of truth

### 5. MovementController Nullification (Building needs this!)

**Current State**: Building explicitly nulls MovementController since buildings don't move:

```javascript
// Building constructor (line 125)
this._controllers.set('movement', null);
```

**SOLUTION - Add to Entity Constructor**:
- [ ] Add `movable: false` option to Entity constructor options
- [ ] Entity checks `movable` flag before initializing MovementController
- [ ] If `movable === false`, skip MovementController initialization entirely
- [ ] Buildings pass `movable: false` in super() call

**BENEFIT**: Cleaner API, no manual controller nullification, memory savings

### 6. Faction Property Storage (ALL entities use this!)

**Current State**: Ant, Building, Resource all store faction but in different ways:

```javascript
// Entity stores in options but doesn't expose as property
// Ant duplicates: this._faction = faction; (line 92)
// Building duplicates: this._faction = faction; (line 107)
```

**SOLUTION - Add to EntityModel**:
- [ ] `_faction` property in EntityModel (not just options)
- [ ] `getFaction()` / `setFaction()` methods
- [ ] Eliminate duplicate `_faction` in subclasses
- [ ] CombatController reads from model.getFaction()

**BENEFIT**: Single source of truth, eliminates 3 duplicate properties

### 7. Legacy isMouseOver() Deprecation (Resource has this!)

**Current State**: Resource has deprecated `isMouseOver()` that should use SelectionController:

```javascript
// Resource.isMouseOver() - Lines 514-527 (deprecated)
isMouseOver(mx, my) {
  console.warn('Resource.isMouseOver() is deprecated - use SelectionController.isHovered() instead');
  // ... legacy logic
}
```

**SOLUTION - Add to Entity**:
- [ ] Add `isMouseOver()` to Entity base class as **deprecated wrapper**
- [ ] Delegates to `SelectionController.isHovered()` with deprecation warning
- [ ] Provides migration path for legacy code
- [ ] Eventually remove in v2.0

**BENEFIT**: Consistent deprecation pattern across all entity types

### 8. Idle Timer System (Ant has this, could be generic!)

**Current State**: Ant has idle timer for skitter behavior:

```javascript
// Ant properties (lines 59-60)
this._idleTimer = 0;
this._idleTimerTimeout = 1;

// Used for idle movement/skitter behavior
```

**ANALYSIS**: This pattern could be useful for **any** entity type that needs periodic idle behaviors:
- Buildings could have idle animations
- Resources could have ambient effects
- NPCs could have idle routines

**RECOMMENDATION - Add to EntityController (optional behavior)**:
- [ ] Add `IdleBehavior` class (optional, composable)
- [ ] `_idleTimer` / `_idleTimeout` in EntityModel (if IdleBehavior enabled)
- [ ] EntityController automatically updates idle timer if behavior present
- [ ] Ant uses IdleBehavior for skitter, other entities can use for their idle logic

**BENEFIT**: Generic idle system, reusable across entity types

---

## ⚠️ CONTROLLER ANALYSIS: Additional Duplicate Patterns Found

After analyzing **ALL 8 current controllers**, I've identified additional patterns that appear across multiple controllers and should be consolidated:

### 11. Timed Check Pattern (4 Controllers Duplicate This!)

**Current State**: MovementController, SelectionController, CombatController, and TerrainController all implement **identical** timed check logic:

```javascript
// MovementController (lines 378-380) - Skitter timer
this._skitterTimer -= 1;
return this._skitterTimer <= 0;

// SelectionController (lines 40-49) - Hover check with camera tracking
const cameraX = typeof cameraManager !== 'undefined' ? cameraManager.cameraX : 0;
const cameraY = typeof cameraManager !== 'undefined' ? cameraManager.cameraY : 0;
const cameraMoved = (cameraX !== this._lastCameraX || cameraY !== this._lastCameraY);

// CombatController (lines 24-28) - Enemy detection
const now = Date.now();
if (now - this._lastEnemyCheck > this._enemyCheckInterval) {
  this.detectEnemies();
  this._lastEnemyCheck = now;
}

// TerrainController (lines 18-22) - Terrain detection
const now = Date.now();
if (now - this._lastTerrainCheck > this._terrainCheckInterval || this._hasPositionChanged()) {
  this.detectAndUpdateTerrain();
  this._lastTerrainCheck = now;
}
```

**SOLUTION - Add TimerBehavior utility class**:
- [ ] Create `TimerBehavior.js` with reusable timer patterns
- [ ] `IntervalTimer(interval, callback)` - Execute callback every N ms
- [ ] `CountdownTimer(duration, callback)` - Execute once after duration
- [ ] `FrameTimer(frames, callback)` - Execute every N frames
- [ ] Controllers use TimerBehavior instead of custom timing logic

**BENEFIT**: Eliminates 80+ lines of duplicate timing code, consistent timing behavior

### 12. Position Change Detection (2 Controllers Duplicate This!)

**Current State**: MovementController and TerrainController both detect position changes:

```javascript
// MovementController.updateStuckDetection() (lines 435-452)
const currentPos = this.getCurrentPosition();
if (this._lastPosition) {
  const distance = Math.sqrt(
    Math.pow(currentPos.x - this._lastPosition.x, 2) +
    Math.pow(currentPos.y - this._lastPosition.y, 2)
  );
  if (this._isMoving && distance < 0.1) {
    this._stuckCounter++;
  }
}
this._lastPosition = { x: currentPos.x, y: currentPos.y };

// TerrainController._hasPositionChanged() (lines 243-251)
const pos = this._getEntityPosition();
const threshold = 16; // pixels
return (
  Math.abs(pos.x - this._lastPosition.x) > threshold ||
  Math.abs(pos.y - this._lastPosition.y) > threshold
);
```

**SOLUTION - Add to TransformController**:
- [ ] `hasMovedSince(lastPos, threshold)` - Check if position changed beyond threshold
- [ ] `getDistanceFrom(pos)` - Get distance from position
- [ ] `_lastKnownPosition` tracking with auto-update
- [ ] Controllers query TransformController instead of manual tracking

**BENEFIT**: Eliminates 30+ lines duplicate position tracking, single source of truth

### 13. Cache Management Pattern (2 Controllers Have This!)

**Current State**: TransformController and TerrainController both implement caching:

```javascript
// TransformController (lines 13-23) - Cached transform values
this._lastPosition = { x: 0, y: 0 };
this._lastSize = { x: 32, y: 32 };
this._lastRotation = 0;

// TerrainController (lines 10-11, 79-84) - Terrain cache
this._terrainCache = new Map(); // Cache terrain lookups
// Later: Clean cache if it gets too large
if (this._terrainCache.size > 100) {
  const firstKey = this._terrainCache.keys().next().value;
  this._terrainCache.delete(firstKey);
}
```

**SOLUTION - Add CacheBehavior utility**:
- [ ] Create `CacheBehavior.js` with generic caching logic
- [ ] LRU (Least Recently Used) cache with size limits
- [ ] Time-based cache expiration
- [ ] Cache key generation utilities
- [ ] Controllers use CacheBehavior for caching needs

**BENEFIT**: Consistent caching strategy, eliminates manual cache management

### 14. Debug Info Pattern (ALL 8 Controllers Duplicate This!)

**Current State**: **Every single controller** implements `getDebugInfo()` with similar structure:

```javascript
// TransformController.getDebugInfo() (lines 231-241)
getDebugInfo() {
  return {
    position: this.getPosition(),
    size: this.getSize(),
    rotation: this.getRotation(),
    // ... more properties
  };
}

// MovementController, SelectionController, CombatController, TerrainController, 
// HealthController, TaskManager, RenderController - ALL have identical pattern
```

**SOLUTION - Add to EntityController base**:
- [ ] `getDebugInfo()` in EntityController aggregates all controller debug data
- [ ] Each behavior class provides `_getDebugData()` protected method
- [ ] EntityController collects all debug data automatically
- [ ] Single `entity.getDebugInfo()` call returns complete state

**BENEFIT**: Eliminates 80+ lines of duplicate debug code, comprehensive debug view

### 15. StatsContainer Synchronization (2 Controllers Duplicate This!)

**Current State**: TransformController and MovementController both sync with StatsContainer:

```javascript
// TransformController.setPosition() (lines 50-56)
if (this._entity._stats && 
    this._entity._stats.position && 
    this._entity._stats.position.statValue) {
  this._entity._stats.position.statValue.x = x;
  this._entity._stats.position.statValue.y = y;
}

// MovementController.setEntityPosition() (lines 338-343)
if (this._entity._stats && 
    this._entity._stats.position && 
    this._entity._stats.position.statValue) {
  this._entity._stats.position.statValue.x = position.x;
  this._entity._stats.position.statValue.y = position.y;
}
```

**ANALYSIS**: StatsContainer marked as OUT OF SCOPE, but this sync logic is **duplicate**.

**SOLUTION - Centralize in TransformController**:
- [ ] Remove StatsContainer sync from MovementController
- [ ] MovementController calls `TransformController.setPosition()` only
- [ ] TransformController handles all StatsContainer syncing
- [ ] Single point of synchronization

**BENEFIT**: Eliminates duplicate sync code, consistent state updates

### 16. P5.js Availability Check (RenderController Has This!)

**Current State**: RenderController checks if p5.js functions are available:

```javascript
// RenderController._isP5Available() (lines 130-137)
_isP5Available() {
  return typeof stroke === 'function' && 
         typeof fill === 'function' && 
         typeof rect === 'function' &&
         typeof strokeWeight === 'function' &&
         typeof noFill === 'function' &&
         typeof noStroke === 'function';
}

// RenderController._safeRender() (lines 144-150) - Wrapper for safe rendering
```

**SOLUTION - Add to EntityView**:
- [ ] `_checkRenderingAvailable()` in EntityView base class
- [ ] Called once during initialization
- [ ] Cached result prevents repeated checks
- [ ] EntityView provides safe render wrapper for all views
- [ ] Subclasses inherit safe rendering automatically

**BENEFIT**: Consistent p5.js availability checking, prevents runtime errors

### 17. Coordinate Conversion Pattern (SelectionController + HealthController Duplicate)

**Current State**: Both controllers convert between world and screen coordinates:

```javascript
// SelectionController.updateHoverState() (lines 149-155)
if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion) {
  const mouseTilePos = g_activeMap.renderConversion.convCanvasToPos([mouseX, mouseY]);
  const mouseWorldX = mouseTilePos[0] * TILE_SIZE;
  const mouseWorldY = mouseTilePos[1] * TILE_SIZE;
}

// HealthController.render() (lines 85-91)
let entityScreenX = pos.x;
let entityScreenY = pos.y;
if (typeof CoordinateConverter !== 'undefined' && CoordinateConverter.isAvailable()) {
  const entityScreenPos = CoordinateConverter.worldToScreen(pos.x, pos.y);
  entityScreenX = entityScreenPos.x;
  entityScreenY = entityScreenPos.y;
}
```

**ANALYSIS**: Uses **different** coordinate systems (g_activeMap vs CoordinateConverter)!

**SOLUTION - Standardize in EntityView**:
- [ ] EntityView provides unified coordinate conversion API
- [ ] `worldToScreen(x, y)` - Convert world to screen coordinates
- [ ] `screenToWorld(x, y)` - Convert screen to world coordinates
- [ ] Automatically detects available system (g_activeMap, CoordinateConverter, cameraManager)
- [ ] Consistent coordinate handling across all rendering

**BENEFIT**: Eliminates duplicate coordinate code, fixes inconsistent coordinate systems

### 18. Callback Pattern (SelectionController + TerrainController Duplicate)

**Current State**: Both controllers implement callback systems:

```javascript
// SelectionController (lines 266-277) - Selection callbacks
addSelectionCallback(callback) { this._selectionCallbacks.push(callback); }
_onSelectionChange(wasSelected, isSelected) {
  this._selectionCallbacks.forEach(callback => {
    try { callback(wasSelected, isSelected); }
    catch (error) { console.error("Selection callback error:", error); }
  });
}

// TerrainController (lines 267-274) - Terrain change callbacks
setTerrainChangeCallback(callback) {
  this._onTerrainChangeCallback = callback;
}
_onTerrainChange(oldTerrain, newTerrain) {
  if (this._onTerrainChangeCallback) { 
    this._onTerrainChangeCallback(oldTerrain, newTerrain); 
  }
}
```

**SOLUTION - Use EntityModel Event System**:
- [ ] EntityModel has built-in event system (`on()`, `off()`, `emit()`)
- [ ] Controllers emit events through model: `model.emit('selectionChanged', data)`
- [ ] External code listens: `model.on('selectionChanged', callback)`
- [ ] Remove duplicate callback arrays/functions from controllers
- [ ] Unified event handling for all state changes

**BENEFIT**: Eliminates duplicate callback code, standardized event system

### 19. State Validation Pattern (SelectionController, CombatController, MovementController)

**Current State**: Controllers validate state before operations:

```javascript
// MovementController.moveToLocation() (lines 33-36)
if (this._entity._stateMachine && !this._entity._stateMachine.canPerformAction("move")) {
  return false;
}

// Similar checks in multiple controllers for different actions
```

**SOLUTION - Add to EntityController**:
- [ ] `canPerformAction(action)` in EntityController
- [ ] Delegates to state machine if available
- [ ] Provides default "always allowed" if no state machine
- [ ] Controllers query controller instead of accessing state machine directly
- [ ] Consistent action validation across all controllers

**BENEFIT**: Decouples controllers from state machine, consistent validation

### 20. Configuration Objects (HealthController, RenderController Duplicate)

**Current State**: Both controllers have configuration objects:

```javascript
// HealthController.config (lines 10-21)
this.config = {
  barWidth: null,
  barHeight: 4,
  offsetY: 12,
  backgroundColor: [255, 0, 0],
  // ... more config
};

// RenderController.HIGHLIGHT_TYPES (lines 32-79)
this.HIGHLIGHT_TYPES = {
  SELECTED: { color: [0, 255, 0], strokeWeight: 3, style: "outline" },
  HOVER: { color: [255, 255, 0, 200], strokeWeight: 2, style: "outline" },
  // ... more types
};
```

**SOLUTION - Centralize in EntityModel**:
- [ ] `_renderConfig` / `_healthConfig` in EntityModel
- [ ] Controllers read config from model, not local storage
- [ ] Model provides defaults, allows per-entity overrides
- [ ] EntityFactory sets configs during entity creation
- [ ] Consistent configuration pattern

**BENEFIT**: Centralized configuration, easier per-entity customization

---

## Summary: Controller Consolidation Impact

**Total Duplicate Patterns Identified**: **20 critical patterns**
- 10 from entity subclasses (Ant, Resource, Building)
- 10 from controller implementations

**Code Reduction Estimate**:
- Entity subclasses: ~200+ lines eliminated
- Controllers: ~300+ lines eliminated
- **Total: 500+ lines of duplicate code removed**

**Architecture Improvements**:
- ✅ Single source of truth for all state
- ✅ Consistent behavior across all entities
- ✅ Reduced coupling between controllers
- ✅ Reusable utility classes (TimerBehavior, CacheBehavior)
- ✅ Standardized event system
- ✅ Unified coordinate handling
- ✅ Comprehensive debug system

**Next Step**: Use this analysis during MVC implementation to ensure **maximum consolidation** in base classes.

---

### 9. Entity Type-Specific Getters (Building has this!)

**Current State**: Building has convenience getters for controllers:

```javascript
// Building getters (lines 205-207)
get _renderController() { return this.getController('render'); }
get _healthController() { return this.getController('health'); }
get _selectionController() { return this.getController('selection'); }
```

**SOLUTION - Add to Entity Base Class**:
- [ ] Add common controller getters to Entity
- [ ] `get _renderController()` → All entities use this
- [ ] `get _selectionController()` → All entities use this
- [ ] `get _movementController()` → Most entities use this
- [ ] Subclasses inherit automatically

**BENEFIT**: Eliminates duplicate getter code, consistent API

### 10. Image/Sprite Management (Building overrides Entity pattern!)

**Current State**: Building uses `setImage(img)` but also manually handles images:

```javascript
// Building constructor (line 127)
if (img) this.setImage(img);

// Building.upgradeBuilding() (line 192)
this.setImage(nextImage);
```

**ANALYSIS**: Entity already has `_sprite` and image management via RenderController.

**SOLUTION - Enhance EntityModel**:
- [ ] Add `setImage(img)` to EntityController as public API
- [ ] Delegates to RenderController/Sprite2D
- [ ] All subclasses use consistent image API
- [ ] No direct sprite manipulation in subclasses

**BENEFIT**: Consistent image management, no special-case code

---

## 📋 Consolidation Checklist: Quick Reference

Use this checklist during MVC implementation to ensure all duplicates are consolidated:

### Entity Subclass Patterns (10 patterns)
- [ ] **1. Die/Cleanup Pattern** → EntityController.die(), unregisterFromGlobals()
- [ ] **2. Box Hover Rendering** → EntityView.renderBoxHover(), EntityModel.isBoxHovered
- [ ] **3. Delta Time Tracking** → EntityController._lastFrameTime, auto-calculate deltaTime
- [ ] **4. Global Array Registration** → EntityController.registerInGlobals(), type-to-array map
- [ ] **5. MovementController Nullification** → Entity constructor `movable: false` option
- [ ] **6. Faction Property Storage** → EntityModel._faction with getFaction()/setFaction()
- [ ] **7. Legacy isMouseOver()** → Entity.isMouseOver() deprecated wrapper
- [ ] **8. Idle Timer System** → Optional IdleBehavior class for generic idle logic
- [ ] **9. Controller Getters** → Entity base class common getters (_renderController, etc.)
- [ ] **10. Image/Sprite Management** → EntityController.setImage() delegates to RenderController

### Controller Patterns (10 patterns)
- [ ] **11. Timed Check Pattern** → TimerBehavior.js (IntervalTimer, CountdownTimer, FrameTimer)
- [ ] **12. Position Change Detection** → TransformController.hasMovedSince(), getDistanceFrom()
- [ ] **13. Cache Management** → CacheBehavior.js (LRU cache, expiration, size limits)
- [ ] **14. Debug Info Aggregation** → EntityController.getDebugInfo() aggregates all controllers
- [ ] **15. StatsContainer Sync** → TransformController only, remove from MovementController
- [ ] **16. P5.js Availability Check** → EntityView._checkRenderingAvailable(), cached result
- [ ] **17. Coordinate Conversion** → EntityView unified API (worldToScreen, screenToWorld)
- [ ] **18. Callback Pattern** → EntityModel event system (on, off, emit), remove callback arrays
- [ ] **19. State Validation** → EntityController.canPerformAction() delegates to state machine
- [ ] **20. Configuration Objects** → EntityModel._renderConfig, _healthConfig centralized

### Verification Steps
- [ ] Run full test suite (862+ tests) - all must pass
- [ ] Compare line counts: old Entity + subclasses vs new MVC classes
- [ ] Verify ~500+ lines reduction achieved
- [ ] Check for remaining duplicate code patterns (grep for common patterns)
- [ ] Profile performance - should be equivalent or better
- [ ] Review all controllers - ensure no direct entity._property access

---

## MVC Component Breakdown

### MODEL: EntityModel.js - Pure Data & State

**Purpose**: Store all entity data with no business logic or rendering code.

#### Core Identity & State
- [ ] `_id` - Unique identifier
- [ ] `_type` - Entity type string
- [ ] `_isActive` - Active flag
- [ ] `_faction` - Faction/team (currently in CombatController)
- [ ] `_jobName` - Current job name

#### Position & Transform Data
- [ ] `_collisionBox` - CollisionBox2D instance (data container)
- [ ] Position coordinates (x, y)
- [ ] Size (width, height)
- [ ] Rotation angle

#### Visual State Data
- [ ] `_sprite` - Sprite2D reference (as data container)
- [ ] Image path
- [ ] Opacity value
- [ ] Visibility flag

#### Controller State Data
- [ ] Movement state (isMoving, targetPosition, path)
- [ ] Selection state (isSelected)
- [ ] Combat state (inCombat, enemies list)
- [ ] Terrain data (currentTerrain, currentTile)
- [ ] Health data
- [ ] Task queue data

#### Model Responsibilities
- [ ] Store all entity data
- [ ] Provide getters/setters for properties
- [ ] Validate data changes
- [ ] Fire change events when data updates
- [ ] NO business logic (calculations, pathfinding, etc.)
- [ ] NO rendering code
- [ ] NO input handling

#### Model Methods to Implement
```javascript
// Data accessors
getId()
getType()
isActive()
setActive(boolean)
getPosition()
setPosition(x, y)
getSize()
setSize(width, height)
getRotation()
setRotation(angle)

// State accessors
isMoving()
setMoving(boolean)
getPath()
setPath(pathArray)
isSelected()
setSelected(boolean)
getFaction()
setFaction(faction)

// Event system
on(eventName, callback)
off(eventName, callback)
emit(eventName, data)

// Validation
validate()
```

---

### VIEW: EntityView.js - Pure Rendering

**Purpose**: Handle all visual representation, reading from model only.

#### From Entity.js
- [ ] `render()` method - Main render entry point
- [ ] Coordinate transformation logic (`getScreenPosition()`)
- [ ] Camera/viewport integration

#### From RenderController.js (entire class becomes EntityView)
- [ ] All rendering logic
- [ ] Highlight rendering (selected, hover, combat)
- [ ] Effect rendering (damage numbers, particles)
- [ ] Animation logic (bob, pulse, spin)
- [ ] Debug visualization (bounding boxes, debug panels)
- [ ] State indicators (moving, gathering, attacking)
- [ ] Terrain indicators (water, mud, etc.)
- [ ] Highlight types configuration
- [ ] State indicators configuration
- [ ] Terrain indicators configuration

#### From TransformController.js (visual sync only)
- [ ] `syncSprite()` - Sprite synchronization with model data
- [ ] Sprite rendering coordination

#### From DebugManager
- [ ] `_debugger` - UniversalDebugger instance
- [ ] Debug overlay rendering
- [ ] Debug panel rendering

#### View Responsibilities
- [ ] Render entity sprite
- [ ] Render highlights and effects
- [ ] Render debug overlays
- [ ] Convert world coordinates to screen coordinates
- [ ] Handle camera transforms
- [ ] Respond to model changes (observer pattern)
- [ ] NO data storage (read from model only)
- [ ] NO game logic

#### View Methods to Implement
```javascript
// Main rendering
render(model)
update(model)

// Highlight rendering
renderHighlight(model, type)
renderSelected(model)
renderHover(model)
renderCombat(model)

// Effects rendering
renderEffects(model)
addEffect(effect)
removeEffect(effectId)
clearEffects()

// Debug rendering
renderDebug(model)
toggleDebugMode()

// Coordinate conversion
worldToScreen(worldX, worldY)
screenToWorld(screenX, screenY)

// Sprite management
syncSprite(model)
updateSpriteTransform(model)

// Animation
updateAnimations(deltaTime)
```

---

### CONTROLLER: EntityController.js - Business Logic & Coordination

**Purpose**: Coordinate between model and view, execute game logic, handle input.

#### From Entity.js
- [ ] `update()` - Main update loop coordination
- [ ] Controller initialization logic (`_initializeControllers()`)
- [ ] Controller configuration (`_configureControllers()`)
- [ ] Delegate method pattern (`_delegate()`)
- [ ] Enhanced API coordination (`_initializeEnhancedAPI()`)
- [ ] Chainable API pattern
- [ ] Spatial grid registration/updates
- [ ] Debug system initialization

#### From MovementController.js
- [ ] `moveToLocation()` - Movement logic
- [ ] `setPath()` - Pathfinding integration
- [ ] Path following logic
- [ ] Stuck detection
- [ ] Skitter behavior (idle movement)
- [ ] Terrain cost integration

#### From SelectionController.js
- [ ] `setSelected()` - Selection state changes
- [ ] `toggleSelection()` - Selection toggling
- [ ] Selection state validation

#### From CombatController.js
- [ ] Enemy detection
- [ ] Combat state management
- [ ] Attack coordination

#### From TerrainController.js
- [ ] Terrain detection at entity position
- [ ] Terrain modifier application
- [ ] Tile material lookups

#### From TaskManager.js
- [ ] Task queue management
- [ ] Task priority handling
- [ ] Task execution coordination

#### From TransformController.js (logic only)
- [ ] Position update logic
- [ ] Size update logic
- [ ] Center calculation
- [ ] Dirty flag management

#### Interaction Logic
- [ ] `isMouseOver()` - Mouse collision detection
- [ ] `onClick()` - Click handling
- [ ] `collidesWith()` - Collision detection
- [ ] `contains()` - Point containment

#### Lifecycle Management
- [ ] `destroy()` - Cleanup logic
- [ ] Spatial grid removal
- [ ] Controller cleanup

#### Controller Responsibilities
- [ ] Coordinate between Model and View
- [ ] Handle input events (mouse, keyboard)
- [ ] Execute game logic (movement, combat, tasks)
- [ ] Update model data based on logic
- [ ] Trigger view updates
- [ ] Integrate with external systems (pathfinding, spatial grid, terrain)
- [ ] Manage entity lifecycle

#### Controller Methods to Implement
```javascript
// Initialization
constructor(model, view)
initialize(options)
destroy()

// Update loop
update(deltaTime)
lateUpdate()

// Movement
moveToLocation(x, y)
setPath(pathArray)
stop()
handleMovement(deltaTime)

// Selection
setSelected(boolean)
toggleSelection()
handleSelection()

// Combat
detectEnemies()
handleCombat()

// Terrain
updateTerrain()
getCurrentTerrain()
getCurrentTileMaterial()

// Tasks
addTask(task)
getCurrentTask()
processTasks()

// Input handling
handleClick(mouseX, mouseY)
handleMouseOver(mouseX, mouseY)

// Collision
collidesWith(other)
contains(x, y)

// External system integration
registerWithSpatialGrid()
updateSpatialGrid()
```

---

## Sub-Controller Integration

Current sub-controllers need refactoring into pure behavior classes.

### Keep as Utility Classes (Composable Logic)

These controllers should be renamed to "Behavior" classes and refactored to be stateless/pure where possible:

#### MovementBehavior.js (rename MovementController)
- [ ] Pure movement algorithms
- [ ] Pathfinding integration
- [ ] Path following calculations
- [ ] Stuck detection logic
- [ ] Receives model data as parameters
- [ ] Returns new state/data

#### SelectionBehavior.js (rename SelectionController)
- [ ] Pure selection logic
- [ ] Selection validation
- [ ] Group selection algorithms

#### CombatBehavior.js (rename CombatController)
- [ ] Pure combat logic
- [ ] Damage calculations
- [ ] Enemy detection algorithms
- [ ] Attack range calculations

#### TerrainBehavior.js (rename TerrainController)
- [ ] Pure terrain logic
- [ ] Terrain cost calculations
- [ ] Tile material lookups
- [ ] Terrain modifier application

#### TaskBehavior.js (rename TaskManager)
- [ ] Pure task logic
- [ ] Priority queue algorithms
- [ ] Task validation

#### HealthBehavior.js (rename HealthController)
- [ ] Pure health logic
- [ ] Damage application
- [ ] Healing calculations
- [ ] Death state management

**Behavior Class Pattern:**
```javascript
class MovementBehavior {
  // Stateless methods that receive data and return new state
  static calculatePath(startPos, endPos, terrain) { /* ... */ }
  static followPath(currentPos, path, speed, deltaTime) { /* ... */ }
  static detectStuck(currentPos, lastPos, threshold) { /* ... */ }
}
```

### Eliminate These (Absorbed into MVC)

- [ ] ~~TransformController~~ → Logic to EntityController, visual sync to EntityView
- [ ] ~~RenderController~~ → Becomes EntityView entirely

---

## Data Flow in New Architecture

### Example: Movement Command

```
1. Input Event (mouse click)
    ↓
2. EntityController.handleClick(mouseX, mouseY)
    ↓
3. EntityController calls MovementBehavior.calculatePath(model.getPosition(), targetPos, terrain)
    ↓
4. MovementBehavior returns new path data
    ↓
5. EntityController updates model.setPath(newPath)
    ↓
6. EntityModel fires "pathChanged" event
    ↓
7. EntityView receives event, reads model, renders updated path
```

### Example: Update Loop

```
1. Game Loop calls entityController.update(deltaTime)
    ↓
2. EntityController reads model state
    ↓
3. EntityController calls behavior classes with model data
    ↓
4. Behavior classes return new state
    ↓
5. EntityController updates model with new state
    ↓
6. Model fires change events
    ↓
7. EntityView receives events and re-renders affected parts
```

---

## Architectural Questions to Resolve

Before implementation, these design decisions must be made:

### 1. Enhanced API (`entity.highlight.selected()`, `entity.effects.add()`)
- [ ] **Option A**: Keep on EntityController as convenience facade
- [ ] **Option B**: Move to EntityView as view-specific API
- [ ] **Option C**: Eliminate and force direct controller method calls
- **Recommendation**: Option A - keeps API consistent for game code

### 2. Collision Box
- [ ] **Option A**: Keep in Model as pure data container
- [ ] **Option B**: Move collision detection logic to EntityController
- [ ] **Option C**: Create separate CollisionBehavior class
- **Recommendation**: Option A + B - data in model, logic in controller

### 3. Sprite2D
- [ ] **Option A**: Keep in Model as data container
- [ ] **Option B**: Move to View as rendering component
- [ ] **Option C**: Refactor Sprite2D itself into Model/View split
- **Recommendation**: Option A - model stores sprite data, view uses it for rendering

### 4. Debugger System
- [ ] **Option A**: Keep in EntityController as lifecycle management
- [ ] **Option B**: Move to EntityView as pure rendering concern
- [ ] **Option C**: Create separate DebugController
- **Recommendation**: Option B - debug visualization is a view concern

### 5. Controller Access (`entity.getController('movement')`)
- [ ] **Option A**: Eliminate external controller access entirely
- [ ] **Option B**: Keep as internal EntityController detail only
- [ ] **Option C**: Expose specific behavior methods instead
- **Recommendation**: Option A - force use of public API only

### 6. Chainable API
- [ ] **Option A**: Keep on EntityController for fluent commands
- [ ] **Option B**: Eliminate for explicit method calls
- [ ] **Option C**: Refactor to command pattern
- **Recommendation**: Option A - chainable API is useful and clear

### 7. Selenium Testing Getters (`getValidationData()`)
- [ ] **Option A**: Keep on EntityController as testing API
- [ ] **Option B**: Move to EntityModel as pure data access
- [ ] **Option C**: Create separate TestingAPI class
- **Recommendation**: Option A - controller provides testing interface

---

## Files to Create

### Core MVC Classes
- [ ] `Classes/mvc/EntityModel.js` - Pure data container
- [ ] `Classes/mvc/EntityView.js` - Pure rendering (absorbs RenderController)
- [ ] `Classes/mvc/EntityController.js` - Business logic coordinator

### Behavior Classes (Refactored Controllers)
- [ ] `Classes/mvc/behaviors/MovementBehavior.js` - Renamed/refactored MovementController
- [ ] `Classes/mvc/behaviors/SelectionBehavior.js` - Renamed/refactored SelectionController
- [ ] `Classes/mvc/behaviors/CombatBehavior.js` - Renamed/refactored CombatController
- [ ] `Classes/mvc/behaviors/TerrainBehavior.js` - Renamed/refactored TerrainController
- [ ] `Classes/mvc/behaviors/TaskBehavior.js` - Renamed/refactored TaskManager
- [ ] `Classes/mvc/behaviors/HealthBehavior.js` - Renamed/refactored HealthController

### Supporting Files
- [ ] `Classes/mvc/EntityFactory.js` - Factory for creating MVC entity sets
- [ ] `Classes/mvc/EventEmitter.js` - Event system for model changes (if not already available)

### Documentation
- [ ] `docs/api/EntityMVC_API_Reference.md` - API documentation for new MVC structure
- [ ] `docs/architecture/ENTITY_MVC_ARCHITECTURE.md` - Detailed architecture explanation
- [ ] `docs/guides/ENTITY_MVC_MIGRATION_GUIDE.md` - Migration guide for existing code

### Tests
- [ ] `test/unit/mvc/EntityModel.test.js` - Model unit tests
- [ ] `test/unit/mvc/EntityView.test.js` - View unit tests (with mock rendering)
- [ ] `test/unit/mvc/EntityController.test.js` - Controller unit tests
- [ ] `test/integration/mvc/EntityMVC.integration.test.js` - Integration tests
- [ ] `test/e2e/mvc/pw_entity_mvc.js` - E2E tests with screenshots

---

## Migration Strategy

### Option 1: Big Bang Approach
**Pros**: Clean break, no legacy code
**Cons**: High risk, all tests break at once

1. Create all MVC classes
2. Migrate all Entity functionality at once
3. Update all references in codebase
4. Fix all 862+ tests
5. Remove old Entity.js

### Option 2: Incremental Approach (RECOMMENDED)
**Pros**: Lower risk, gradual migration, tests can be updated incrementally
**Cons**: More complex, temporary duplication

1. Create MVC classes alongside current Entity
2. Create EntityMVCAdapter that wraps MVC but exposes old Entity API
3. Gradually migrate systems to use MVC
4. Update tests as systems migrate
5. Once all systems migrated, remove adapter and old Entity

### Option 3: Parallel Architecture
**Pros**: Both architectures work simultaneously, easy rollback
**Cons**: Code duplication, maintenance burden

1. Create MVC classes in new namespace
2. Keep old Entity working
3. New features use MVC, old features use Entity
4. Gradually migrate old features to MVC
5. Remove old Entity when migration complete

**Recommendation**: **Option 2 (Incremental)** - Provides safety net while migrating

---

## Incremental Migration Phases

### Phase 1: Foundation (TDD)
**Goal**: Create core MVC structure with basic functionality

- [ ] Write unit tests for EntityModel (TDD)
- [ ] Implement EntityModel with basic properties
- [ ] Run tests (pass)
- [ ] Write unit tests for EntityView (TDD, mock rendering)
- [ ] Implement EntityView with basic rendering
- [ ] Run tests (pass)
- [ ] Write unit tests for EntityController (TDD)
- [ ] Implement EntityController with basic coordination
- [ ] Run tests (pass)
- [ ] Create EntityMVCAdapter for backward compatibility
- [ ] Write integration tests for MVC set
- [ ] Run tests (pass)

**Deliverables**:
- EntityModel.js
- EntityView.js
- EntityController.js
- EntityMVCAdapter.js
- Unit tests (all passing)
- Integration tests (all passing)

### Phase 2: Behavior Classes (TDD)
**Goal**: Refactor controllers into stateless behavior classes

- [ ] Write unit tests for MovementBehavior (TDD)
- [ ] Refactor MovementController → MovementBehavior
- [ ] Run tests (pass)
- [ ] Write unit tests for SelectionBehavior (TDD)
- [ ] Refactor SelectionController → SelectionBehavior
- [ ] Run tests (pass)
- [ ] Repeat for CombatBehavior, TerrainBehavior, TaskBehavior, HealthBehavior
- [ ] Integrate behavior classes into EntityController
- [ ] Run full test suite (pass)

**Deliverables**:
- MovementBehavior.js
- SelectionBehavior.js
- CombatBehavior.js
- TerrainBehavior.js
- TaskBehavior.js
- HealthBehavior.js
- Behavior unit tests (all passing)

### Phase 3: Adapter & Compatibility (TDD)
**Goal**: Ensure old code works with new MVC

- [ ] Implement complete EntityMVCAdapter
- [ ] Test adapter with existing game code
- [ ] Verify all old Entity API methods work
- [ ] Run existing Entity tests against adapter
- [ ] Fix compatibility issues
- [ ] Create side-by-side tests (old Entity vs MVC)
- [ ] Verify identical behavior

**Deliverables**:
- Complete EntityMVCAdapter.js
- Adapter tests (passing)
- Compatibility verification (passing)

### Phase 4: System Migration
**Goal**: Migrate game systems one at a time

**Priority Order** (migrate highest-impact systems first):
1. [ ] Ant spawning/creation (uses Entity constructor heavily)
2. [ ] Movement system (uses MovementController)
3. [ ] Selection system (uses SelectionController)
4. [ ] Rendering system (uses RenderController)
5. [ ] Combat system (uses CombatController)
6. [ ] Task system (uses TaskManager)
7. [ ] Debug system (uses debugger)
8. [ ] Level editor (creates entities)

**Per System**:
- [ ] Analyze system's Entity usage
- [ ] Update system to use EntityController API
- [ ] Update system tests
- [ ] Run system tests (pass)
- [ ] Run full regression suite (pass)
- [ ] Mark system as migrated

### Phase 5: Test Migration
**Goal**: Update all tests to use MVC

- [ ] Identify tests that use Entity directly
- [ ] Update unit tests to test MVC classes
- [ ] Update integration tests to use EntityController
- [ ] Update E2E tests to verify MVC rendering
- [ ] Remove tests for old Entity
- [ ] Verify 100% test coverage for MVC classes

**Deliverables**:
- All 862+ tests updated or replaced
- Test coverage report (>80% for MVC)

### Phase 6: Cleanup
**Goal**: Remove old architecture, finalize MVC

- [ ] Remove EntityMVCAdapter
- [ ] Remove old Entity.js
- [ ] Remove old controller files (TransformController, RenderController)
- [ ] Update index.html script loading order
- [ ] Update all documentation
- [ ] Final regression test (all pass)

**Deliverables**:
- Old code removed
- Documentation updated
- CHANGELOG.md updated
- All tests passing

### Phase 7: Documentation & Polish (TDD Complete)
**Goal**: Complete documentation and examples

- [ ] Write EntityMVC_API_Reference.md
- [ ] Write ENTITY_MVC_ARCHITECTURE.md
- [ ] Write ENTITY_MVC_MIGRATION_GUIDE.md
- [ ] Create usage examples
- [ ] Update CHANGELOG.md
- [ ] Update main README.md

**Deliverables**:
- Complete API documentation
- Architecture documentation
- Migration guide
- Usage examples

---

## Breaking Changes & Compatibility

### Breaking Changes
1. **Constructor signature changes**
   - Old: `new Entity(x, y, width, height, options)`
   - New: `EntityFactory.create(x, y, width, height, options)` returns {model, view, controller}

2. **Controller access removed**
   - Old: `entity.getController('movement')`
   - New: `entityController.moveToLocation()` (direct API)

3. **Internal properties hidden**
   - Old: `entity._collisionBox`
   - New: `entityModel.getCollisionBox()` (via getter)

4. **Event system changes**
   - Old: No events
   - New: `entityModel.on('positionChanged', callback)`

### Backward Compatibility Strategy

**EntityMVCAdapter Pattern**:
```javascript
class EntityMVCAdapter {
  constructor(model, view, controller) {
    this._model = model;
    this._view = view;
    this._controller = controller;
  }
  
  // Expose old Entity API
  get id() { return this._model.getId(); }
  getPosition() { return this._model.getPosition(); }
  moveToLocation(x, y) { return this._controller.moveToLocation(x, y); }
  render() { return this._view.render(this._model); }
  update() { return this._controller.update(); }
  
  // Old controller access (deprecated)
  getController(name) {
    console.warn('getController() is deprecated, use direct methods instead');
    return null;
  }
}
```

**Factory Pattern**:
```javascript
class EntityFactory {
  static create(x, y, width, height, options) {
    const model = new EntityModel(x, y, width, height, options);
    const view = new EntityView(model);
    const controller = new EntityController(model, view);
    
    // Return adapter for backward compatibility
    return new EntityMVCAdapter(model, view, controller);
  }
  
  static createMVC(x, y, width, height, options) {
    // Return raw MVC components for new code
    const model = new EntityModel(x, y, width, height, options);
    const view = new EntityView(model);
    const controller = new EntityController(model, view);
    return { model, view, controller };
  }
}
```

---

## Testing Strategy

### TDD Workflow (CRITICAL)
**ALWAYS follow this workflow for each component:**

1. **Write failing tests FIRST** before any implementation
2. **Run tests** - confirm they fail for the right reason
3. **Write minimal code** to make tests pass
4. **Run tests again** - confirm they pass
5. **Refactor** - improve code while keeping tests green
6. **Repeat** for each feature

### Unit Tests
**EntityModel.test.js**:
- [ ] Test all getters/setters
- [ ] Test data validation
- [ ] Test event emission
- [ ] Test state changes
- [ ] Mock all dependencies
- [ ] NO rendering tests
- [ ] NO logic tests

**EntityView.test.js**:
- [ ] Test rendering methods (mock canvas)
- [ ] Test coordinate conversions
- [ ] Test highlight rendering
- [ ] Test effect rendering
- [ ] Test sprite synchronization
- [ ] Mock model data
- [ ] NO business logic tests

**EntityController.test.js**:
- [ ] Test all business logic methods
- [ ] Test behavior class integration
- [ ] Test model updates
- [ ] Test view triggering
- [ ] Test input handling
- [ ] Mock model and view
- [ ] Mock behavior classes

### Integration Tests
**EntityMVC.integration.test.js**:
- [ ] Test Model → Controller → View flow
- [ ] Test event propagation
- [ ] Test real behavior classes (not mocked)
- [ ] Test external system integration (spatial grid, pathfinding)
- [ ] Use JSDOM for DOM/canvas
- [ ] Sync global and window objects

### E2E Tests
**pw_entity_mvc.js** (Puppeteer with screenshots):
- [ ] Test entity creation in browser
- [ ] Test entity movement (visual proof)
- [ ] Test entity rendering (visual proof)
- [ ] Test entity selection (visual proof)
- [ ] Test entity effects (visual proof)
- [ ] MUST use `ensureGameStarted()`
- [ ] MUST provide screenshot proof
- [ ] Run headless

---

## Success Criteria

### Technical
- [ ] All 862+ tests passing
- [ ] >80% test coverage for MVC classes
- [ ] Zero breaking changes with adapter
- [ ] Performance equivalent or better
- [ ] Memory usage equivalent or better

### Architecture
- [ ] Clean separation: Model (data), View (rendering), Controller (logic)
- [ ] No circular dependencies
- [ ] Behavior classes are stateless/pure
- [ ] Event-driven model updates
- [ ] Single Responsibility Principle followed

### Code Quality
- [ ] JSDoc comments on all public methods
- [ ] Type hints where appropriate
- [ ] No console.log (use proper logging)
- [ ] No magic numbers
- [ ] Descriptive variable names

### Documentation
- [ ] Complete API reference
- [ ] Architecture documentation
- [ ] Migration guide for existing code
- [ ] Usage examples
- [ ] CHANGELOG.md updated

---

## Risk Mitigation

### Risk 1: Breaking All Tests
**Mitigation**: Incremental migration with adapter pattern
**Contingency**: Keep old Entity.js until all tests pass

### Risk 2: Performance Degradation
**Mitigation**: Profile before and after, optimize hot paths
**Contingency**: Rollback if performance drops >10%

### Risk 3: Introducing Bugs
**Mitigation**: Comprehensive test coverage, side-by-side testing
**Contingency**: Feature flag to toggle old/new entity

### Risk 4: Timeline Overrun
**Mitigation**: Break into small phases, time-box each phase
**Contingency**: Ship partial migration if needed

### Risk 5: Developer Confusion
**Mitigation**: Clear documentation, examples, migration guide
**Contingency**: Training sessions, pair programming

---

## Timeline Estimate

**Phase 1 (Foundation)**: 8-12 hours
**Phase 2 (Behaviors)**: 10-15 hours
**Phase 3 (Adapter)**: 4-6 hours
**Phase 4 (System Migration)**: 20-30 hours
**Phase 5 (Test Migration)**: 15-20 hours
**Phase 6 (Cleanup)**: 4-6 hours
**Phase 7 (Documentation)**: 6-8 hours

**Total**: 67-97 hours (approximately 2-3 weeks of focused work)

---

## Next Steps

1. **Review this roadmap** with the team
2. **Make architectural decisions** (see Architectural Questions section)
3. **Create Phase 1 branch** (`feature/entity-mvc-phase1`)
4. **Write Phase 1 tests FIRST** (TDD)
5. **Begin Phase 1 implementation**
6. **Review and iterate** after each phase

---

## References

- **Current Entity**: `Classes/containers/Entity.js`
- **Current Controllers**: `Classes/controllers/`
- **Testing Methodology**: `docs/standards/testing/TESTING_METHODOLOGY_STANDARDS.md`
- **Feature Development Checklist**: `docs/checklists/FEATURE_DEVELOPMENT_CHECKLIST.md`
- **TDD Guide**: Follow existing patterns in test suite

---

## Ant Class Consolidation Opportunities

### Overview
The `ant` class (in `Classes/ants/ants.js`) **already extends Entity** and uses many of its controllers. During the MVC refactor, we can consolidate duplicate logic and ant-specific extensions.

### Current Ant Architecture
The ant class:
- ✅ Already extends Entity (inherits all controllers)
- ✅ Uses Entity's TransformController, MovementController, RenderController, SelectionController, CombatController
- ❌ Adds its own systems: AntBrain, AntStateMachine, GatherState, EntityInventoryManager, StatsContainer, JobComponent
- ❌ Has duplicate/overlapping properties with Entity (health, faction, combat)
- ❌ Overrides update() and render() with ant-specific logic

### Consolidation Strategy

#### 1. Move Ant-Specific Data to AntModel (extends EntityModel)

**AntModel Properties** (in addition to EntityModel):
- [ ] `_antIndex` - Unique ant identifier
- [ ] `_JobName` / `jobName` - Current job type
- [ ] `_brain` - AntBrain instance
- [ ] `_stateMachine` - AntStateMachine instance
- [ ] `_gatherState` - GatherState instance
- [ ] `_resourceManager` - EntityInventoryManager instance
- [ ] `_stats` - StatsContainer instance
- [ ] `_job` - JobComponent instance
- [ ] `_idleTimer` / `_idleTimerTimeout` - Idle behavior timing
- [ ] `pathType` - Path type for pathfinding
- [ ] `isBoxHovered` - Box hover state

**Eliminate Duplicates** (already in EntityModel):
- [ ] ~~`_health` / `_maxHealth`~~ → Use HealthController data
- [ ] ~~`_damage`~~ → Use CombatController data
- [ ] ~~`_faction`~~ → Use Entity faction (already in options)
- [ ] ~~`_enemies` / `_combatTarget`~~ → Use CombatController data
- [ ] ~~`_lastEnemyCheck` / `_enemyCheckInterval`~~ → Move to CombatBehavior

#### 2. Ant-Specific Behaviors

Create new behavior classes for ant logic:

**AntBrainBehavior.js** (wraps AntBrain):
- [ ] Brain update logic
- [ ] Decision making
- [ ] Hunger system
- [ ] Job-specific AI

**AntStateBehavior.js** (wraps AntStateMachine):
- [ ] State transitions (IDLE, GATHERING, DROPPING_OFF, COMBAT)
- [ ] State callbacks
- [ ] Preferred state management

**GatherBehavior.js** (wraps GatherState):
- [ ] Resource detection
- [ ] Gathering logic
- [ ] Dropoff navigation

**ResourceManagementBehavior.js** (wraps EntityInventoryManager):
- [ ] Resource capacity management
- [ ] Resource pickup/drop
- [ ] Inventory tracking

**JobBehavior.js** (wraps JobComponent):
- [ ] Job assignment
- [ ] Job stat application
- [ ] Job-specific abilities

#### 3. AntController (extends EntityController)

**Additional Ant Methods**:
- [ ] `assignJob(jobName, image)` - Job system integration
- [ ] `startGathering()` / `stopGathering()` - Gathering control
- [ ] `getResourceCount()` / `addResource()` / `dropAllResources()` - Resource API
- [ ] `getCurrentState()` / `setState()` - State machine API
- [ ] `die()` - Death handling with game system cleanup
- [ ] `_removeFromGame()` - Cleanup from ants array, spatial grid, selection

**Behavior Integration**:
```javascript
class AntController extends EntityController {
  constructor(model, view) {
    super(model, view);
    
    // Ant-specific behaviors
    this._brainBehavior = new AntBrainBehavior();
    this._stateBehavior = new AntStateBehavior();
    this._gatherBehavior = new GatherBehavior();
    this._resourceBehavior = new ResourceManagementBehavior();
    this._jobBehavior = new JobBehavior();
  }
  
  update(deltaTime) {
    super.update(deltaTime); // Entity update
    
    // Ant-specific updates
    this._brainBehavior.update(this._model, deltaTime);
    this._stateBehavior.update(this._model);
    this._resourceBehavior.update(this._model);
    this._gatherBehavior.update(this._model);
  }
}
```

#### 4. AntView (extends EntityView)

**Additional Ant Rendering**:
- [ ] `_renderResourceIndicator()` - Show resource count above ant
- [ ] Health bar rendering (delegates to HealthController)
- [ ] State indicators (gathering, dropping off, combat)

#### 5. Consolidate Duplicate Systems

**Health System**:
- [ ] Remove `_health`, `_maxHealth`, `_damage` from ant class
- [ ] Use Entity's HealthController exclusively
- [ ] Move `takeDamage()`, `heal()` to HealthBehavior
- [ ] Apply job stats to HealthController instead of ant properties

**Combat System**:
- [ ] Remove `_enemies`, `_combatTarget`, `_lastEnemyCheck` from ant class
- [ ] Use Entity's CombatController exclusively
- [ ] Move `_updateEnemyDetection()`, `_performCombatAttack()` to CombatBehavior
- [ ] Integrate with AntStateMachine for combat state

**Faction System**:
- [ ] Remove `_faction` from ant class
- [ ] Use Entity's faction (passed in constructor options)
- [ ] CombatController already handles faction-based enemy detection

**StatsContainer Integration**:
- [ ] StatsContainer currently duplicates Entity state (position, size, movementSpeed)
- [ ] **Option A**: Keep StatsContainer for ant-specific stats (strength, health, gatherSpeed)
- [ ] **Option B**: Eliminate StatsContainer, store stats in AntModel directly
- [ ] **Recommendation**: Option A - StatsContainer provides stat buffs/modifiers system

#### 6. Files to Refactor

**Existing Files**:
- [ ] `Classes/ants/ants.js` - Refactor ant class to use MVC
- [ ] `Classes/ants/antBrain.js` - Wrap in AntBrainBehavior
- [ ] `Classes/ants/antStateMachine.js` - Wrap in AntStateBehavior
- [ ] `Classes/ants/GatherState.js` - Wrap in GatherBehavior
- [ ] `Classes/ants/JobComponent.js` - Wrap in JobBehavior
- [ ] `Classes/ants/Queen.js` - Extend AntController with queen-specific logic

**New Files**:
- [ ] `Classes/mvc/AntModel.js` - Extends EntityModel
- [ ] `Classes/mvc/AntView.js` - Extends EntityView
- [ ] `Classes/mvc/AntController.js` - Extends EntityController
- [ ] `Classes/mvc/behaviors/AntBrainBehavior.js`
- [ ] `Classes/mvc/behaviors/AntStateBehavior.js`
- [ ] `Classes/mvc/behaviors/GatherBehavior.js`
- [ ] `Classes/mvc/behaviors/ResourceManagementBehavior.js`
- [ ] `Classes/mvc/behaviors/JobBehavior.js`

#### 7. Integration with Existing Systems

**Global Ants Array**:
- [ ] Keep `ants[]` global array
- [ ] Store AntController instances (with adapter if needed)
- [ ] Update `antsSpawn()`, `antsUpdate()`, `antsRender()` functions

**AntManager**:
- [ ] Integrate with MVC architecture
- [ ] Manage ant lifecycle (spawn, update, destroy)
- [ ] Factory methods for creating MVC ants

**Job System**:
- [ ] `assignJob()` function uses JobBehavior
- [ ] Job images and stats remain in JobComponent
- [ ] Apply job stats to AntModel via AntController

**Queen Ant**:
- [ ] QueenAnt extends AntController with additional powers
- [ ] Queen-specific behaviors (command ants, special abilities)
- [ ] Keep existing QueenAnt API for compatibility

#### 8. Migration Benefits

**Code Reduction**:
- Eliminate ~200 lines of duplicate health/combat/faction logic
- Consolidate position/transform code (currently spread across ant, Entity, StatsContainer)
- Remove redundant controller access wrappers

**Better Separation**:
- Brain AI logic isolated in AntBrainBehavior
- State management isolated in AntStateBehavior
- Resource logic isolated in ResourceManagementBehavior
- Each behavior testable independently

**Consistency**:
- All entities (ants, resources, buildings) use same MVC pattern
- Health system works identically for all entities
- Combat system consistent across entity types
- Selection/rendering/movement all unified

**Extensibility**:
- Easy to add new ant types (extend AntController)
- Easy to add new behaviors (compose into AntController)
- Easy to share behaviors between entity types

#### 9. Testing Implications

**Existing Tests** (862+ total):
- [ ] ~50+ ant-specific unit tests to update
- [ ] ~20+ ant integration tests to update
- [ ] ~30+ ant E2E tests to update
- [ ] All use existing ant API, need adapter for compatibility

**New Tests Needed**:
- [ ] AntModel unit tests
- [ ] AntView unit tests
- [ ] AntController unit tests
- [ ] AntBrainBehavior unit tests
- [ ] AntStateBehavior unit tests
- [ ] GatherBehavior unit tests
- [ ] ResourceManagementBehavior unit tests
- [ ] JobBehavior unit tests
- [ ] Ant MVC integration tests
- [ ] Ant MVC E2E tests with screenshots

#### 10. Ant-Specific Architectural Questions

**Question 1: StatsContainer**
- [ ] Keep StatsContainer for stat modifiers/buffs?
- [ ] Merge into AntModel as plain properties?
- [ ] Create generic StatsBehavior for all entities?
- **Recommendation**: Keep StatsContainer - provides buff/debuff system

**Question 2: AntBrain**
- [ ] Keep AntBrain as-is, wrap in behavior?
- [ ] Refactor AntBrain into pure functions?
- [ ] Move decision logic into AntController?
- **Recommendation**: Wrap in behavior - brain is complex, self-contained AI

**Question 3: AntStateMachine**
- [ ] Keep AntStateMachine separate from Entity state?
- [ ] Merge with Entity lifecycle states?
- [ ] Create generic StateMachineBehavior?
- **Recommendation**: Keep separate - ant states are domain-specific (GATHERING, DROPPING_OFF)

**Question 4: Job System**
- [ ] Keep JobComponent as global static class?
- [ ] Move to AntModel as instance data?
- [ ] Create JobManager system?
- **Recommendation**: Keep JobComponent static - shared job definitions across all ants

**Question 5: Queen Ant**
- [ ] Queen extends AntController or separate QueenController?
- [ ] Queen powers as behaviors or direct methods?
- [ ] Queen coordination as separate system?
- **Recommendation**: QueenController extends AntController - reuses ant logic, adds powers

---

## Resource Class Consolidation Opportunities

### Overview
The `Resource` class (in `Classes/resource.js`) **already extends Entity** but has minimal custom logic. It's the simplest entity type and mostly delegates to Entity controllers already.

### Current Resource Architecture
The Resource class:
- ✅ Already extends Entity (inherits all controllers)
- ✅ Uses Entity's TransformController, RenderController, SelectionController
- ✅ Has minimal custom state (resourceType, isCarried, carrier)
- ✅ Delegates rendering to Entity (uses SelectionController.isHovered() for spinning highlight)
- ❌ Has legacy `isMouseOver()` method (deprecated, should use SelectionController)
- ❌ Mixed with EntityInventoryManager (entity-level resource inventory) - naming confusion

### Consolidation Strategy

#### 1. Resource Data - Stays Simple (ResourceModel extends EntityModel)

**ResourceModel Properties** (in addition to EntityModel):
- [ ] `_resourceIndex` - Unique resource identifier
- [ ] `_resourceType` - Type of resource (greenLeaf, mapleLeaf, stick, stone)
- [ ] `_isCarried` - Whether resource is being carried
- [ ] `_carrier` - Reference to entity carrying this resource

**That's it!** Resources are intentionally simple entities.

#### 2. No New Behaviors Needed

Resources don't need custom behavior classes because:
- ✅ No AI/brain system (static objects)
- ✅ No autonomous movement (movementSpeed=0)
- ✅ No complex state machine (just carried/not carried)
- ✅ No combat system
- ✅ Pickup/drop handled by **owning entity** (ant's EntityInventoryManager)

**Resource "logic" is actually in the picker-upper, not the resource itself!**

#### 3. ResourceController (extends EntityController) - Minimal

**Resource Methods**:
- [ ] `pickUp(carrier)` - Mark as carried by entity
- [ ] `drop(x, y)` - Mark as dropped, update position
- [ ] `isCarried()` - Query carried state
- [ ] `getCarrier()` - Get carrying entity
- [ ] `getResourceType()` - Get resource type

**Update logic** (only if carried):
```javascript
class ResourceController extends EntityController {
  update(deltaTime) {
    super.update(deltaTime); // Entity update
    
    // If carried, follow carrier position
    if (this._model.isCarried && this._model.carrier) {
      const carrierPos = this._model.carrier.getPosition();
      this._model.setPosition(carrierPos.x, carrierPos.y);
    }
  }
}
```

**No behaviors needed** - Resource logic is handled by:
- **ResourceSystemManager** - Global resource spawning/management
- **EntityInventoryManager** - Entity inventory (ants carrying resources)
- **GatherBehavior** - Ant gathering logic (finds resources)
- **InventoryController** - Entity inventory slots

#### 4. ResourceView (extends EntityView) - Minimal

**Resource Rendering** (already working):
- [ ] Sprite rendering (delegates to Entity)
- [ ] Hover highlight (spinning animation via `entity.highlight.spinning()`)
- [ ] Selection highlight (if selectable)

**No custom rendering needed** - Entity's RenderController handles everything.

#### 5. Naming Confusion to Resolve

**Problem**: We have TWO things called "EntityInventoryManager":
1. **EntityInventoryManager** (`Classes/managers/EntityInventoryManager.js`) - Handles **entity inventory** (ant carrying resources)
2. **ResourceSystemManager** (`Classes/managers/ResourceSystemManager.js`) - Handles **global resource system** (spawning, tracking all resources)

**Solution**:
- [ ] Rename `EntityInventoryManager` → `EntityInventoryManager` or `CarryingController`
- [ ] Keep `ResourceSystemManager` as-is (global system)
- [ ] This clarifies: resources vs. resource-carrying

**Updated naming**:
- **Resource** (entity) - A thing that can be picked up
- **ResourceSystemManager** (global) - Manages all Resource entities in world
- **EntityInventoryManager** (per-entity) - Manages what an entity is carrying
- **InventoryController** (per-entity) - Simpler fixed-slot inventory (already exists)

#### 6. Eliminate Duplicate Logic

**Current duplicate**: Resource tracking exists in multiple places:
- [ ] ~~`globalResource[]` array~~ → Use ResourceSystemManager exclusively
- [ ] ~~`g_resourceList.resources`~~ → Delegates to ResourceSystemManager (good)
- [ ] ~~Resource.isMouseOver()~~ → Use SelectionController.isHovered()

**Consolidate**:
- All resource instances managed by ResourceSystemManager
- Entity carrying handled by EntityInventoryManager (renamed EntityInventoryManager)
- Mouse interaction via SelectionController (already works)

#### 7. Files to Refactor

**Existing Files**:
- [ ] `Classes/resource.js` - Refactor Resource class to use MVC
- [ ] `Classes/managers/EntityInventoryManager.js` - **RENAME** to `EntityInventoryManager.js`
- [ ] `Classes/managers/ResourceSystemManager.js` - Keep as-is (global system)
- [ ] `Classes/ants/GatherState.js` - Update references to renamed manager
- [ ] `Classes/controllers/InventoryController.js` - Keep as-is (simple slot inventory)

**New Files**:
- [ ] `Classes/mvc/ResourceModel.js` - Extends EntityModel (minimal)
- [ ] `Classes/mvc/ResourceView.js` - Extends EntityView (might not need, use EntityView directly)
- [ ] `Classes/mvc/ResourceController.js` - Extends EntityController (minimal)

**Alternative**: Resource is so simple, it might not need separate MVC files - just use Entity directly with `type: 'Resource'`.

#### 8. Integration with Existing Systems

**ResourceSystemManager** (global system):
- [ ] Manages all Resource instances in the world
- [ ] Spawns resources (greenLeaf, mapleLeaf, stick, stone)
- [ ] Tracks resources by type
- [ ] Removes resources when picked up
- [ ] Keep as-is, works well

**EntityInventoryManager** (renamed from EntityInventoryManager):
- [ ] Attached to entities that carry resources (ants)
- [ ] Handles pickup logic (`checkForNearbyResources()`)
- [ ] Manages carrying capacity
- [ ] Triggers drop-off behavior
- [ ] Update to use renamed class

**GatherBehavior**:
- [ ] Ant-specific gathering logic
- [ ] Searches for resources in radius
- [ ] Moves ant to resources
- [ ] Calls EntityInventoryManager to pick up
- [ ] Update references to renamed manager

**InventoryController**:
- [ ] Simple fixed-slot inventory (2 slots default)
- [ ] Calls `resource.pickUp(owner)` when storing
- [ ] Calls `resource.drop()` when removing
- [ ] Keep as-is, works with Resource MVC

#### 9. Migration Benefits

**Code Reduction**:
- Eliminate ~50 lines of legacy `isMouseOver()` code
- Remove duplicate resource tracking arrays
- Consolidate resource state into ResourceModel

**Better Separation**:
- Clear distinction: Resource entity vs. resource carrying vs. global resource system
- Resource entity has minimal logic (as it should - it's a passive object)
- Carrying logic in EntityInventoryManager (where it belongs)
- Global management in ResourceSystemManager (singleton pattern)

**Consistency**:
- Resources use same MVC pattern as ants, buildings, etc.
- Selection/rendering work identically
- Position/transform unified

**Simplicity**:
- Resource is the **simplest** entity type
- Good template for creating other simple entities (decorations, obstacles)
- Proves MVC pattern scales down (not just for complex entities)

#### 10. Testing Implications

**Existing Tests**:
- [ ] ~20+ resource unit tests to update
- [ ] ~10+ resource integration tests to update
- [ ] ~10+ resource E2E tests to update
- [ ] Most test ResourceSystemManager, not Resource class itself

**New Tests Needed**:
- [ ] ResourceModel unit tests (minimal)
- [ ] ResourceController unit tests (pickup/drop logic)
- [ ] Resource MVC integration tests
- [ ] Resource MVC E2E tests with screenshots

**Note**: Resources have fewer tests than ants because they're simpler (no AI, no state machine, no combat).

#### 11. Resource-Specific Architectural Questions

**Question 1: Separate ResourceView?**
- [ ] Create ResourceView class?
- [ ] Just use EntityView directly?
- [ ] Resources have no custom rendering
- **Recommendation**: Use EntityView directly - resources don't need custom rendering

**Question 2: ResourceController vs. Entity directly?**
- [ ] Create ResourceController with minimal logic?
- [ ] Use EntityController directly with just model changes?
- [ ] Resource logic is so minimal
- **Recommendation**: Create ResourceController for consistency, even if minimal

**Question 3: EntityInventoryManager renaming?**
- [ ] Rename to EntityInventoryManager?
- [ ] Rename to CarryingController?
- [ ] Keep EntityInventoryManager name?
- **Recommendation**: Rename to EntityInventoryManager - clarifies it's per-entity inventory, not global system

**Question 4: InventoryController vs. EntityInventoryManager?**
- [ ] Keep both (InventoryController for slots, EntityInventoryManager for resources)?
- [ ] Merge into one system?
- [ ] Different use cases?
- **Recommendation**: Keep both - InventoryController is generic slot-based, EntityInventoryManager is resource-specific with gathering logic

**Question 5: Static factory methods?**
- [ ] Keep `Resource.createGreenLeaf()`, `Resource.createStick()`, etc.?
- [ ] Move to ResourceSystemManager?
- [ ] Use ResourceFactory class?
- **Recommendation**: Keep on Resource class - convenient API, factory pattern

#### 12. Resource MVC Example

**Simplified Resource MVC** (since resource logic is minimal):

```javascript
// ResourceModel.js - Minimal data
class ResourceModel extends EntityModel {
  constructor(x, y, width, height, options = {}) {
    super(x, y, width, height, { ...options, type: 'Resource' });
    this._resourceIndex = resourceIndex++;
    this._resourceType = options.resourceType || 'leaf';
    this._isCarried = false;
    this._carrier = null;
  }
  
  get resourceType() { return this._resourceType; }
  get isCarried() { return this._isCarried; }
  get carrier() { return this._carrier; }
  
  pickUp(carrier) {
    this._isCarried = true;
    this._carrier = carrier;
    this.emit('pickedUp', { carrier });
  }
  
  drop(x, y) {
    this._isCarried = false;
    this._carrier = null;
    if (x !== null) this.setPosition(x, y);
    this.emit('dropped', { x, y });
  }
}

// ResourceController.js - Minimal logic
class ResourceController extends EntityController {
  update(deltaTime) {
    super.update(deltaTime);
    
    // Follow carrier if being carried
    if (this._model.isCarried && this._model.carrier) {
      const pos = this._model.carrier.getPosition();
      this._model.setPosition(pos.x, pos.y);
    }
  }
  
  pickUp(carrier) {
    return this._model.pickUp(carrier);
  }
  
  drop(x, y) {
    return this._model.drop(x, y);
  }
}

// No ResourceView needed - use EntityView directly
// Resource rendering is handled entirely by Entity's RenderController
```

**That's it!** Resources are intentionally simple.

---

## StatsContainer Consolidation - OUT OF SCOPE

**Note**: As agreed, StatsContainer consolidation is **beyond the scope** of this MVC refactor.

**Current state**: StatsContainer duplicates Entity position/size data but provides stat modifiers/buffs system.

**Future work**: Consider consolidating StatsContainer in a separate refactor:
- Move position/size to EntityModel exclusively
- Keep stat modifiers/buffs as StatsBehavior
- Integrate with job system for stat application

**For this refactor**: Keep StatsContainer as-is in ant class.

---

## Building Class Consolidation Opportunities

**Analysis**: Building class (Classes/managers/BuildingManager.js) extends Entity and has significant duplication with base Entity functionality. Buildings are stationary structures with health, faction, rendering, and spawn capabilities.

**Current Implementation**:
- **Building** extends Entity (~280 lines)
- **AbstractBuildingFactory** - Factory pattern for creating buildings
- **Concrete Factories**: AntCone, AntHill, HiveSource
- **DropoffLocation** - Separate grid-based dropoff system (NOT Entity-based)

### 1. Building Model Data (Duplicates Entity)

**Keep Building-Specific**:
- [ ] `_spawnEnabled` / `_spawnInterval` / `_spawnTimer` / `_spawnCount` - Ant spawning system
- [ ] `info` - Building upgrade progression data
- [ ] `effectRange` / `_buffedAnts` - AOE buff system for nearby ants
- [ ] `lastFrameTime` - Delta time tracking for spawning

**Eliminate Duplicates** (already in Entity/Controllers):
- [ ] ~~`_x` / `_y` / `_width` / `_height`~~ → Use TransformController
- [ ] ~~`_faction`~~ → Use Entity faction (already in options)
- [ ] ~~`_health` / `_maxHealth` / `_damage`~~ → Use HealthController / CombatController
- [ ] ~~`_isDead`~~ → Use HealthController state
- [ ] ~~`isBoxHovered`~~ → Move to SelectionController

### 2. Building-Specific Behaviors

Create new behavior classes for building logic:

**BuildingSpawnBehavior.js** (manages ant spawning):
- [ ] Spawn timer management (`_spawnTimer`, `_spawnInterval`)
- [ ] Spawn count logic (`_spawnCount`)
- [ ] Integration with global `antsSpawn()` function
- [ ] Spawn location calculation (building center)
- [ ] Enable/disable spawning (`_spawnEnabled`)

**BuildingBuffBehavior.js** (AOE stat buffing):
- [ ] Range-based ant detection (`effectRange`)
- [ ] Buff tracking (`_buffedAnts` Set)
- [ ] Stat modification (`statsBuff()` method)
- [ ] Buff application/removal based on proximity
- [ ] Per-faction filtering (`getAnts(faction)`)

**BuildingUpgradeBehavior.js** (upgrade system):
- [ ] Upgrade progression tracking (`info.progressions`)
- [ ] Resource cost validation (`info.upgradeCost`)
- [ ] Image swapping on upgrade
- [ ] Spawn rate improvements
- [ ] Upgrade validation logic

### 3. BuildingController (extends EntityController)

**Additional Building Methods**:
- [ ] `enableSpawning(interval, count)` - Configure spawn behavior
- [ ] `disableSpawning()` - Stop ant spawning
- [ ] `upgrade()` - Handle building upgrades
- [ ] `getBuffedAnts()` - Return Set of buffed ant IDs
- [ ] `setEffectRange(range)` - Configure buff radius

**Overrides**:
- [ ] `moveToLocation(x, y)` - Buildings don't move (currently empty override)
- [ ] `update()` - Add spawn timer + buff logic
- [ ] `die()` - Building-specific cleanup (remove from Buildings array)

### 4. Building Factory Pattern Integration

**Keep Factories** (production-ready pattern):
- [ ] `AbstractBuildingFactory` - Base factory interface
- [ ] `AntCone`, `AntHill`, `HiveSource` - Concrete factories
- [ ] `BuildingFactoryRegistry` - Type-to-factory mapping
- [ ] `createBuilding(type, x, y, faction)` - Global factory function

**Consolidate Factory Logic**:
- [ ] Factory stores upgrade progression data (`info` object)
- [ ] Factory defines building dimensions (width, height)
- [ ] Factory loads building images (Cone, Hill, Hive)
- [ ] Move factory data into BuildingModel instead of constructor

### 5. Building vs DropoffLocation Distinction

**CRITICAL**: Building and DropoffLocation are **separate systems**:

**Building** (Entity-based):
- Extends Entity (has health, faction, rendering)
- Spawns ants
- Provides AOE buffs
- Can be upgraded
- Selectable via SelectionController
- Uses HealthController for damage/healing

**DropoffLocation** (NOT Entity-based):
- Grid-based positioning (tile coordinates, not pixel coordinates)
- Has InventoryController (stores resources)
- No health, faction, or combat
- No rendering via Entity pipeline (custom `draw()` method)
- Expandable footprint (multi-tile coverage)
- Marks Grid instance with itself

**Decision**: Keep DropoffLocation separate - it's a **grid utility**, not an entity. Buildings are **entities with gameplay logic**. Different purposes, different inheritance hierarchies.

### 6. Building Rendering Consolidation

**Eliminate Custom Rendering**:
- [ ] ~~`_renderBoxHover()`~~ → Use SelectionController highlighting
- [ ] ~~Health rendering~~ → Use HealthController.render()
- [ ] ~~`super.render()`~~ → Entity already calls RenderController

**Keep Building-Specific**:
- [ ] Buff range visualization (optional debug overlay)
- [ ] Upgrade visual effects (optional)

### 7. Building Health System Consolidation

**Current Code** (duplicates Entity/HealthController):
```javascript
takeDamage(amount) {
  const oldHealth = this._health;
  this._health = Math.max(0, this._health - amount);
  if (this._healthController && oldHealth > this._health) {
    this._healthController.onDamage();
  }
  if (this._health <= 0) {
    console.log("Building has died.");
  }
  return this._health;
}

heal(amount) {
  this._health = Math.min(this._maxHealth, this._health + (amount || 0));
  const hc = this.getController?.('health');
  if (hc && typeof hc.onHeal === 'function') hc.onHeal(amount, this._health);
  return this._health;
}
```

**Consolidation**:
- [ ] Remove `takeDamage()` override - use HealthController
- [ ] Remove `heal()` override - use HealthController
- [ ] Remove `_health`, `_maxHealth` properties - use HealthController data
- [ ] Building-specific death logic → Override `die()` only

### 8. Building Controller Nullification

**Current Code**:
```javascript
this._controllers.set('movement', null);
```

**Analysis**: Buildings explicitly null MovementController since they don't move.

**Consolidation**:
- [ ] Remove manual null assignment
- [ ] Add `movable: false` option to Entity constructor
- [ ] Entity checks `movable` flag before initializing MovementController
- [ ] Buildings pass `movable: false` in options

### 9. Building Global State Management

**Current Code** (manual array management):
```javascript
if (typeof Buildings !== 'undefined' && !Buildings.includes(building)) Buildings.push(building);
if (typeof selectables !== 'undefined' && !selectables.includes(building)) selectables.push(building);
```

**Consolidation**:
- [ ] Move global array registration to Entity base class
- [ ] Entity checks `type` and registers in appropriate arrays
- [ ] Remove duplicate registration logic from `createBuilding()`
- [ ] Add `registerInGlobals()` method to Entity

### 10. Building Die() Method Consolidation

**Current Code** (manual cleanup):
```javascript
die() {
  this.isActive = false;
  this._isDead = true;
  const idx = Buildings.indexOf(this);
  if (idx !== -1) Buildings.splice(idx, 1);
  // ... remove from window.buildings, selectables, etc.
}
```

**Consolidation**:
- [ ] Extract array cleanup to Entity.unregisterFromGlobals()
- [ ] Building.die() calls `super.die()` then building-specific cleanup
- [ ] Building-specific: Clear `_buffedAnts` Set, stop spawning timer
- [ ] Remove manual array splicing (use base method)

### 11. Building Testing Considerations

**Unit Tests** (test/unit/managers/BuildingManager.test.js):
- 36 existing tests covering:
  - Constructor initialization
  - Faction, health, damage getters
  - takeDamage() / heal() behavior
  - Spawn system (timer, interval, count)
  - moveToLocation() override (no-op)
  - die() cleanup
  - Factory pattern (AntCone, AntHill, HiveSource)
  - createBuilding() function

**Integration Tests**:
- Building + HealthController integration
- Building + SelectionController integration
- Spawn system + global antsSpawn() integration
- Buff system + ant stat modification

**E2E Tests** (test/e2e/ and test/unit/systems/BuildingBrush.test.js):
- BuildingBrush tool (placement, grid snapping)
- Building rendering with RenderLayerManager
- Selection system integration

### 12. Building MVC Migration Priority

**Phase 4 - Building MVC Conversion** (from main roadmap):
```
Duration: 2-3 days
Dependencies: Phase 1 (Core MVC), Phase 2 (Entity Migration), Phase 3 (Ant Migration)
```

**Migration Order**:
1. **BuildingModel** - Migrate spawn data, buff data, upgrade info
2. **BuildingSpawnBehavior** - Extract spawning logic
3. **BuildingBuffBehavior** - Extract buff system
4. **BuildingUpgradeBehavior** - Extract upgrade logic
5. **BuildingController** - Coordinate behaviors
6. **Remove Duplicates** - Delete overridden health/damage/render methods
7. **Update Tests** - Migrate 36 unit tests to new architecture
8. **Factory Integration** - Update factories to create BuildingController

---

## 📚 Notes

### Naming Clarity
- **ResourceManager** → **EntityInventoryManager** (per-entity inventory)
- **ResourceSystemManager** (global resource management - no rename needed)
- Resource class (resource entities - no rename needed)

### Out of Scope
- **StatsContainer** consolidation marked as OUT OF SCOPE per user request

### Building vs DropoffLocation
- **Building** = Entity subclass (health, faction, combat, spawning, buffs, upgrades)
- **DropoffLocation** = Grid utility (inventory storage, multi-tile footprint, grid marking)
- **Keep separate** - different purposes, different inheritance hierarchies
- **Why separate**: DropoffLocation uses grid coordinates, has no entity lifecycle, provides spatial storage utility
- **Building purpose**: Gameplay entity with combat, rendering, selection, and strategic importance
- **DropoffLocation purpose**: Resource collection point, grid-based spatial storage

---

**Last Updated**: January 2025
**Status**: Planning Phase - All entity types analyzed (Entity, Ant, Resource, Building)
**Owner**: [Team to assign]
