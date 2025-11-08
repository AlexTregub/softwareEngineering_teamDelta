# Ant MVC Integration Test Checklist

**Status**: ✅ **COMPLETE** - 26/26 tests passing (8 skipped - browser-only systems)
**File**: `test/integration/baseMVC/antMVC.integration.test.js`
**Last Updated**: Phase 3 Complete

## Systems Ants Currently Interact With

### ✅ Core Systems
- [ ] **Entity** (base class) - position, size, rotation, active state
- [ ] **StatsContainer** - strength, health, gatherSpeed, movementSpeed stats
- [ ] **EntityInventoryManager** - resource storage (8 slots, 25 capacity)
- [ ] **AntStateMachine** - state transitions (IDLE, GATHERING, COMBAT, etc.)
- [ ] **GatherState** - gathering behavior logic
- [ ] **AntBrain** - AI decision making
- [ ] **JobComponent** - job system (Scout, Farmer, Builder, Soldier)

### ✅ Entity Controllers (via Entity base class)
- [ ] **MovementController** - pathfinding, movement, speed
- [ ] **TaskManager** - task queue, command processing
- [ ] **RenderController** - damage numbers, highlights
- [ ] **SelectionController** - selection state, box selection
- [ ] **CombatController** - combat actions (if available)
- [ ] **TransformController** - position/rotation transforms
- [ ] **TerrainController** - terrain interaction
- [ ] **InteractionController** - entity interactions
- [ ] **HealthController** - health bar rendering

### ✅ External Game Systems
- [ ] **Buildings** (global.buildings) - dropoff points (anthill)
- [ ] **Entities** (global.entities) - enemy detection
- [ ] **Ants Array** (global.ants) - game array management
- [ ] **SpatialGridManager** - spatial queries, nearby entities
- [ ] **MapManager** (g_map2) - terrain data, tile information

### ✅ Combat System
- [ ] **Enemy Tracking** - enemy array management
- [ ] **Combat Target** - current attack target
- [ ] **Health System** - damage, healing, death
- [ ] **Damage Calculation** - distance-based combat

### ✅ Resource/Dropoff System
- [ ] **Dropoff Finding** - nearest building search
- [ ] **Dropoff Arrival** - proximity detection
- [ ] **Resource Deposit** - building inventory interaction
- [ ] **Inventory Management** - add/remove/drop resources

### ✅ State Management
- [ ] **State Machine Callbacks** - state change notifications
- [ ] **Preferred State** - AI state preferences
- [ ] **Current State** - active behavior state

### ✅ Pathfinding & Movement
- [ ] **Path Type** - pathfinding type selection
- [ ] **Target Position** - movement destination
- [ ] **Movement Speed** - affected by stats
- [ ] **Idle Detection** - idle timer, timeout

### ✅ Visual/Rendering Systems
- [ ] **Sprite Management** - job-specific sprites (JobImages)
- [ ] **Resource Indicators** - visual resource count
- [ ] **Health Bars** - visual health display
- [ ] **Box Hover** - selection box highlight
- [ ] **Coordinate Conversion** - world/screen transforms (g_activeMap)

### ✅ Legacy Compatibility
- [ ] **posX/posY** - backwards compatible position access
- [ ] **isSelected** - selection state getter/setter
- [ ] **isMoving** - movement state query
- [ ] **faction** - faction system

### ✅ Performance/Optimization
- [ ] **Frame Timing** - lastFrameTime, delta time
- [ ] **Enemy Check Interval** - optimized enemy detection
- [ ] **Idle Timer** - behavior optimization

---

## Test Categories

### 1. Model Integration (Storage & Events)
- Verify AntModel correctly stores all system references
- Test event emission on all property changes
- Validate data immutability

### 2. View Integration (Rendering)
- Test rendering with real controllers (HealthController, RenderController)
- Verify coordinate conversion with MapManager
- Test sprite loading with JobImages

### 3. Controller Integration (Business Logic)
- Test with real StatsContainer (stat modifications)
- Test with real EntityInventoryManager (resource operations)
- Test with real AntStateMachine (state transitions)
- Test with real GatherState (gathering behavior)
- Test with real AntBrain (AI decisions)
- Test with real JobComponent (job assignments)

### 4. System Interactions
- Building system (dropoff operations)
- Entity system (enemy detection)
- Spatial grid (nearby queries)
- Combat system (damage, health)
- Movement system (pathfinding, controllers)

### 5. End-to-End Workflows
- Complete gather cycle (find resource → gather → dropoff)
- Complete combat cycle (detect enemy → engage → defeat)
- Job change workflow (assign job → apply stats → update behavior)
- State machine workflow (state transitions → behavior changes)

---

**Total Test Requirements**: ~40-50 integration tests covering all systems
**Test File**: test/integration/baseMVC/antMVC.integration.test.js
