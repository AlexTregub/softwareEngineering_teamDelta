# True State Machine Architecture Design Document

**Version**: 1.0  
**Date**: October 20, 2025  
**Status**: Design Phase - No Implementation Yet  
**Author**: Software Engineering Team Delta

---

## Executive Summary

This document describes the **proposed architecture** for refactoring the Ant Game's current state management system into a **true finite state machine (FSM)**. The current `AntStateMachine` class is actually a **state container with validation**, not a true state machine. This refactor will introduce:

1. **True State Machine**: Enforced transitions with legal state flow
2. **State Objects**: Each state is an object with behavior (`enter()`, `update()`, `exit()`)
3. **AntBrain AI Integration**: Brain decides what to do, state machine enforces rules
4. **Controller Integration**: States use existing controllers for mechanics
5. **Queen Command System**: Queen can issue direct commands to nearby ants

---

## Table of Contents

1. [Current vs Proposed Architecture](#current-vs-proposed-architecture)
2. [Core Components](#core-components)
3. [Architecture Layers](#architecture-layers)
4. [State Machine Implementation](#state-machine-implementation)
5. [State Objects](#state-objects)
6. [AntBrain Integration](#antbrain-integration)
7. [Controller Integration](#controller-integration)
8. [Queen Command System](#queen-command-system)
9. [Priority System](#priority-system)
10. [Implementation Checklist](#implementation-checklist)
11. [Migration Strategy](#migration-strategy)

---

## Current vs Proposed Architecture

### Current System (State Container)

```
┌─────────────────────────────────────┐
│      AntStateMachine                │
│  • primaryState: "GATHERING"        │
│  • combatModifier: "IN_COMBAT"      │
│  • terrainModifier: "IN_WATER"      │
│                                     │
│  setPrimaryState(newState)          │
│  ✗ No transition rules              │
│  ✗ No entry/exit behavior           │
│  ✗ Multiple independent states      │
└─────────────────────────────────────┘
```

**Problems:**
- Any state can change to any other state
- State logic scattered across `ant.js` update methods
- No automatic cleanup when exiting states
- Multiple state variables can create invalid combinations

### Proposed System (True State Machine)

```
┌─────────────────────────────────────────────────────────────┐
│                    AntStateMachine                          │
│  • currentState: GatherState instance                       │
│  • states: { IDLE, MOVING, GATHERING, ... }                │
│  • transitions: { IDLE→[MOVING,GATHERING], ... }           │
│                                                             │
│  transitionTo(newState, data)                               │
│  ✓ Validates transition is legal                            │
│  ✓ Calls oldState.exit() → newState.enter()                │
│  ✓ Single current state                                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    GatherState                              │
│  extends BaseState                                          │
│                                                             │
│  enter(data) { /* Initialize gathering behavior */ }        │
│  update() { /* Search for and collect resources */ }        │
│  checkTransitions() { /* Return next state or null */ }     │
│  exit() { /* Cleanup gathering */ }                         │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- Illegal transitions blocked automatically
- State behavior encapsulated in state objects
- Clean entry/exit lifecycle hooks
- Self-documenting transition rules

---

## Core Components

### 1. AntStateMachine (State Machine Controller)

**File**: `Classes/ants/antStateMachine.js` (to be refactored)

**Responsibilities:**
- Store all possible states as objects
- Define legal transitions between states
- Validate transition requests
- Execute state transitions (exit → enter)
- Update current state every frame
- Check for automatic state transitions

**Key Methods:**
```javascript
transitionTo(stateName, data)      // Request state change
canTransitionTo(stateName)          // Check if transition is legal
getCurrentStateName()               // Get current state name
forceTransitionTo(stateName, data)  // Bypass rules (emergencies)
update()                            // Update current state + check transitions
```

### 2. BaseState (Abstract State Class)

**File**: `Classes/ants/states/BaseState.js` (new file)

**Responsibilities:**
- Provide common state interface
- Track time in state
- Store reference to ant entity

**Key Methods:**
```javascript
enter(data)              // Called when entering state
update()                 // Called every frame while in state
exit()                   // Called when exiting state
checkTransitions()       // Return next state or null
getTimeInState()         // Milliseconds in current state
```

### 3. Concrete States

**Location**: `Classes/ants/states/`

**All States:**
- `IdleState.js` - Resting, waiting for tasks
- `MovingState.js` - Pathfinding to destination
- `GatheringState.js` - Collecting resources (refactor existing `GatherState.js`)
- `DroppingOffState.js` - Delivering resources to dropoff
- `AttackingState.js` - Combat with enemies
- `DefendingState.js` - Blocking/defensive stance
- `BuildingState.js` - Constructing structures
- `PatrolState.js` - Following patrol route
- `FollowingState.js` - Following another entity
- `SocializingState.js` - Interacting with friendly ants
- `MatingState.js` - Reproduction behavior
- `FleeingState.js` - Escaping from danger
- `DeadState.js` - Terminal state

### 4. AntBrain (AI Decision Engine)

**File**: `Classes/ants/antBrain.js` (to be enhanced)

**Responsibilities:**
- Analyze situation (hunger, health, enemies, pheromones)
- Decide which state ant should be in
- Request state transitions from state machine
- Manage pheromone trail priorities
- Handle job-based behavior (Builder, Warrior, etc.)
- Process Queen commands

**Decision Hierarchy:**
1. Death (absolute override)
2. Queen commands (highest priority)
3. Emergency situations (hunger, danger)
4. Pheromone trail following
5. Job-based behavior
6. Social/default behavior

### 5. Controllers (Existing System)

**Location**: `Classes/controllers/`

**Role in New Architecture:**
- States **use** controllers to execute mechanics
- Controllers handle "how" (pathfinding, rendering, combat)
- States handle "what" (game logic, behavior, decisions)

**Key Controllers:**
- `MovementController` - Pathfinding and movement
- `RenderController` - Visual rendering and effects
- `CombatController` - Enemy detection and attacks
- `HealthController` - Health and damage
- `InventoryController` - Resource management
- `TerrainController` - Tile detection and terrain types
- `SelectionController` - Selection state and UI
- `TransformController` - Position and orientation

### 6. QueenAnt (Command System)

**File**: `Classes/ants/Queen.js` (to be enhanced)

**Responsibilities:**
- Issue commands to ants within radius
- Track active commands and assigned ants
- Cancel/expire commands
- Provide commands to AntBrain for execution

**Command Types:**
- `GATHER_AT_LOCATION` - Send ants to gather at area
- `BUILD_STRUCTURE` - Construct building
- `ATTACK_TARGET` - Engage enemy
- `DEFEND_LOCATION` - Guard area
- `MOVE_TO_LOCATION` - Move to position
- `FOLLOW_QUEEN` - Follow Queen
- `RETREAT` - Fall back to safety
- `REST` - Take break from work

---

## Architecture Layers

### Layer 1: Entity & Controllers (Foundation)

```
┌─────────────────────────────────────────────────────────────┐
│                         Entity                              │
│  Base class with collision, sprite, controllers             │
│                                                             │
│  Controllers (composition-based):                           │
│  • MovementController, RenderController, etc.              │
│  • Handle mechanics ("how to do things")                    │
└─────────────────────────────────────────────────────────────┘
```

**Status**: ✅ Already implemented, no changes needed

### Layer 2: States (Behavior Implementation)

```
┌─────────────────────────────────────────────────────────────┐
│                    State Objects                            │
│  GatherState, AttackingState, BuildingState, etc.           │
│                                                             │
│  • Use controllers to execute behavior                      │
│  • Implement game logic ("what to do")                      │
│  • Self-manage transitions                                  │
└─────────────────────────────────────────────────────────────┘
```

**Status**: 🔨 To be implemented (GatherState exists, needs refactor)

### Layer 3: State Machine (Transition Enforcement)

```
┌─────────────────────────────────────────────────────────────┐
│                   AntStateMachine                           │
│  • Validates transitions                                     │
│  • Manages state lifecycle                                   │
│  • Enforces rules                                            │
└─────────────────────────────────────────────────────────────┘
```

**Status**: 🔨 To be refactored (current is state container)

### Layer 4: AI Brain (Decision Making)

```
┌─────────────────────────────────────────────────────────────┐
│                      AntBrain                               │
│  • Analyzes environment                                      │
│  • Decides next state                                        │
│  • Requests transitions                                      │
└─────────────────────────────────────────────────────────────┘
```

**Status**: 🔨 To be enhanced (basic structure exists)

### Layer 5: Queen Commands (Priority Override)

```
┌─────────────────────────────────────────────────────────────┐
│                     QueenAnt                                │
│  • Issues direct commands                                    │
│  • Overrides normal AI                                       │
│  • RTS-style control                                         │
└─────────────────────────────────────────────────────────────┘
```

**Status**: 🔨 To be implemented (Queen class exists, needs commands)

---

## State Machine Implementation

### State Definition Structure

```javascript
// AntStateMachine.js
class AntStateMachine {
  constructor(ant) {
    this.ant = ant;
    this.currentState = null;
    this.previousState = null;
    
    // All possible states (instances)
    this.states = {
      IDLE: new IdleState(this.ant),
      MOVING: new MovingState(this.ant),
      GATHERING: new GatherState(this.ant),
      DROPPING_OFF: new DroppingOffState(this.ant),
      ATTACKING: new AttackingState(this.ant),
      DEFENDING: new DefendingState(this.ant),
      BUILDING: new BuildingState(this.ant),
      PATROL: new PatrolState(this.ant),
      FOLLOWING: new FollowingState(this.ant),
      SOCIALIZING: new SocializingState(this.ant),
      MATING: new MatingState(this.ant),
      FLEEING: new FleeingState(this.ant),
      DEAD: new DeadState(this.ant)
    };
    
    // Legal transitions (finite state machine rules)
    this.transitions = {
      IDLE: ['MOVING', 'GATHERING', 'ATTACKING', 'DEFENDING', 'BUILDING', 
             'SOCIALIZING', 'PATROL', 'FOLLOWING', 'MATING', 'FLEEING', 'DEAD'],
      MOVING: ['IDLE', 'GATHERING', 'ATTACKING', 'DROPPING_OFF', 'FLEEING', 'DEAD'],
      GATHERING: ['IDLE', 'MOVING', 'DROPPING_OFF', 'ATTACKING', 'FLEEING', 'DEAD'],
      DROPPING_OFF: ['IDLE', 'GATHERING', 'MOVING', 'FLEEING', 'DEAD'],
      ATTACKING: ['IDLE', 'MOVING', 'DEFENDING', 'FLEEING', 'DEAD'],
      DEFENDING: ['IDLE', 'ATTACKING', 'FLEEING', 'DEAD'],
      BUILDING: ['IDLE', 'GATHERING', 'FLEEING', 'DEAD'],
      PATROL: ['IDLE', 'MOVING', 'ATTACKING', 'DEFENDING', 'DEAD'],
      FOLLOWING: ['IDLE', 'MOVING', 'ATTACKING', 'DEFENDING', 'DEAD'],
      SOCIALIZING: ['IDLE', 'MOVING', 'DEAD'],
      MATING: ['IDLE', 'DEAD'],
      FLEEING: ['IDLE', 'MOVING', 'DEAD'],
      DEAD: [] // Terminal state
    };
    
    // Start in IDLE
    this.transitionTo('IDLE');
  }
  
  transitionTo(newStateName, transitionData = {}) {
    // Validate state exists
    if (!this.states[newStateName]) {
      console.error(`AntStateMachine: Unknown state '${newStateName}'`);
      return false;
    }
    
    // Check if transition is legal
    if (this.currentState) {
      const currentStateName = this.getStateName(this.currentState);
      const allowedTransitions = this.transitions[currentStateName] || [];
      
      if (!allowedTransitions.includes(newStateName)) {
        console.warn(`AntStateMachine: Illegal transition from ${currentStateName} to ${newStateName}`);
        return false;
      }
      
      // Exit current state
      this.currentState.exit();
    }
    
    // Store previous
    this.previousState = this.currentState;
    
    // Transition to new state
    this.currentState = this.states[newStateName];
    this.currentState.enter(transitionData);
    
    console.log(`AntStateMachine: Transitioned to ${newStateName}`);
    return true;
  }
  
  update() {
    if (this.currentState && typeof this.currentState.update === 'function') {
      this.currentState.update();
      
      // Check if state wants to transition
      const requestedTransition = this.currentState.checkTransitions();
      if (requestedTransition) {
        this.transitionTo(requestedTransition.stateName, requestedTransition.data);
      }
    }
  }
  
  canTransitionTo(stateName) {
    if (!this.currentState) return true;
    const currentStateName = this.getStateName(this.currentState);
    const allowedTransitions = this.transitions[currentStateName] || [];
    return allowedTransitions.includes(stateName);
  }
  
  getCurrentStateName() {
    return this.getStateName(this.currentState);
  }
  
  getStateName(stateInstance) {
    for (const [name, state] of Object.entries(this.states)) {
      if (state === stateInstance) return name;
    }
    return 'UNKNOWN';
  }
  
  forceTransitionTo(newStateName, transitionData = {}) {
    if (!this.states[newStateName]) {
      console.error(`AntStateMachine: Unknown state '${newStateName}'`);
      return false;
    }
    
    if (this.currentState) {
      this.currentState.exit();
    }
    
    this.previousState = this.currentState;
    this.currentState = this.states[newStateName];
    this.currentState.enter(transitionData);
    
    console.warn(`AntStateMachine: FORCED transition to ${newStateName}`);
    return true;
  }
}
```

---

## State Objects

### Base State Class

```javascript
// Classes/ants/states/BaseState.js
class BaseState {
  constructor(ant) {
    this.ant = ant;
    this.isActive = false;
    this.stateStartTime = 0;
  }
  
  enter(data = {}) {
    this.isActive = true;
    this.stateStartTime = performance.now();
    console.log(`${this.constructor.name}: Entered`);
  }
  
  update() {
    // Override in subclass
  }
  
  exit() {
    this.isActive = false;
    console.log(`${this.constructor.name}: Exited`);
  }
  
  checkTransitions() {
    // Override in subclass
    // Return {stateName: 'IDLE', data: {}} or null
    return null;
  }
  
  getTimeInState() {
    return performance.now() - this.stateStartTime;
  }
}
```

### Example: GatherState

```javascript
// Classes/ants/states/GatherState.js
class GatherState extends BaseState {
  constructor(ant) {
    super(ant);
    this.gatherRadius = 7; // tiles
    this.pixelRadius = this.gatherRadius * 32;
    this.targetResource = null;
    this.searchCooldown = 0;
    this.searchInterval = 30; // frames
    this.gatherTimeout = 6000; // ms
  }

  enter(data = {}) {
    super.enter(data);
    
    this.targetResource = null;
    this.searchCooldown = 0;
    
    // USE RENDER CONTROLLER - Set gathering visual
    const renderController = this.ant.getController('render');
    if (renderController) {
      renderController.setStateColor([0, 255, 0]); // Green
      renderController.setStateAnimation('gathering');
    }
    
    // USE SELECTION CONTROLLER - Show gathering icon
    const selectionController = this.ant.getController('selection');
    if (selectionController) {
      selectionController.setStateIcon('🌾');
    }
  }

  update() {
    if (!this.isActive) return;

    if (this.searchCooldown > 0) {
      this.searchCooldown--;
    }

    if (this.targetResource) {
      this.updateTargetMovement();
    } else if (this.searchCooldown <= 0) {
      this.searchForResources();
      this.searchCooldown = this.searchInterval;
    }
  }

  updateTargetMovement() {
    if (!this.targetResource) return;

    // USE TRANSFORM CONTROLLER - Get position
    const transformController = this.ant.getController('transform');
    if (!transformController) return;
    const antPos = transformController.getPosition();

    const distance = this.getDistance(
      antPos.x, antPos.y, 
      this.targetResource.x, this.targetResource.y
    );

    if (distance <= 15) {
      this.attemptResourceCollection();
    } else {
      // USE MOVEMENT CONTROLLER - Move to resource
      const movementController = this.ant.getController('movement');
      if (movementController) {
        movementController.moveToLocation(
          this.targetResource.x, 
          this.targetResource.y
        );
      }
    }
  }

  attemptResourceCollection() {
    if (!this.targetResource) return;

    // USE INVENTORY CONTROLLER - Add resource
    const inventoryController = this.ant.getController('inventory');
    if (inventoryController) {
      const collected = inventoryController.addItem(this.targetResource.resource);
      
      if (collected) {
        this.removeResourceFromSystem(this.targetResource.resource);
        
        // USE RENDER CONTROLLER - Show effect
        const renderController = this.ant.getController('render');
        if (renderController) {
          renderController.playEffect('resource_collected', {
            type: this.targetResource.type
          });
        }
      }
    }

    this.targetResource = null;
  }

  searchForResources() {
    const transformController = this.ant.getController('transform');
    if (!transformController) return;
    const antPos = transformController.getPosition();

    const nearbyResources = this.getResourcesInRadius(
      antPos.x, antPos.y, 
      this.pixelRadius
    );

    if (nearbyResources.length > 0) {
      nearbyResources.sort((a, b) => {
        const distA = this.getDistance(antPos.x, antPos.y, a.x, a.y);
        const distB = this.getDistance(antPos.x, antPos.y, b.x, b.y);
        return distA - distB;
      });

      this.targetResource = nearbyResources[0];
    }
  }

  checkTransitions() {
    // USE INVENTORY CONTROLLER - Check if full
    const inventoryController = this.ant.getController('inventory');
    if (inventoryController && inventoryController.isFull()) {
      return {
        stateName: 'DROPPING_OFF',
        data: { reason: 'inventory_full' }
      };
    }

    // USE COMBAT CONTROLLER - Check for threats
    const combatController = this.ant.getController('combat');
    if (combatController && combatController.hasNearbyEnemies()) {
      return {
        stateName: 'ATTACKING',
        data: { target: combatController.getNearestEnemy() }
      };
    }

    // USE HEALTH CONTROLLER - Check if injured
    const healthController = this.ant.getController('health');
    if (healthController && healthController.getHealthPercent() < 0.3) {
      return {
        stateName: 'FLEEING',
        data: { reason: 'low_health' }
      };
    }

    // Timeout check
    if (this.getTimeInState() >= this.gatherTimeout) {
      return {
        stateName: 'IDLE',
        data: { reason: 'gather_timeout' }
      };
    }

    return null; // Stay in GATHERING
  }

  exit() {
    // USE MOVEMENT CONTROLLER - Stop movement
    const movementController = this.ant.getController('movement');
    if (movementController) {
      movementController.stop();
    }

    // USE RENDER CONTROLLER - Clear visuals
    const renderController = this.ant.getController('render');
    if (renderController) {
      renderController.clearStateColor();
      renderController.clearStateAnimation();
    }

    this.targetResource = null;
    super.exit();
  }

  getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getResourcesInRadius(x, y, radius) {
    // Implementation from existing GatherState
    const nearbyResources = [];
    if (typeof g_entityInventoryManager !== 'undefined' && g_entityInventoryManager) {
      const resourceList = g_entityInventoryManager.getResourceList() || [];
      for (const resource of resourceList) {
        const rx = resource.x || resource.posX;
        const ry = resource.y || resource.posY;
        if (rx !== undefined && ry !== undefined) {
          const distance = this.getDistance(x, y, rx, ry);
          if (distance <= radius) {
            nearbyResources.push({
              resource: resource,
              x: rx,
              y: ry,
              distance: distance,
              type: resource.type || 'unknown'
            });
          }
        }
      }
    }
    return nearbyResources;
  }

  removeResourceFromSystem(resource) {
    if (g_entityInventoryManager && g_entityInventoryManager.removeResource) {
      g_entityInventoryManager.removeResource(resource);
    }
  }
}
```

---

## AntBrain Integration

### Enhanced AntBrain with State Machine

```javascript
// Classes/ants/antBrain.js (enhanced version)
class AntBrain {
  constructor(antInstance, antType) {
    this.ant = antInstance;
    this.antType = antType;
    this.flag_ = "";
    this.hunger = 0;

    // Pheromone trail priorities
    this.followBuildTrail = 0;
    this.followForageTrail = 0;
    this.followFarmTrail = 0;
    this.followEnemyTrail = 0;
    this.followBossTrail = 100;
    this.penalizedTrails = [];

    // Decision-making
    this._accumulator = 0;
    this._decisionCooldown = 0;
    this._decisionInterval = 60; // frames

    // Queen command system
    this.queenCommand = null;
    this.queenCommandPriority = 1000;
    this.queenCommandRadius = 300;
    this.lastQueenCheckTime = 0;
    this.queenCheckInterval = 30;

    this.setPriority(antType, 1);
  }

  update(deltaTime) {
    this.internalTimer(deltaTime);
    this._decisionCooldown--;

    if (this._decisionCooldown <= 0) {
      this.makeDecision();
      this._decisionCooldown = this._decisionInterval;
    }
  }

  makeDecision() {
    const stateMachine = this.ant._stateMachine;
    if (!stateMachine) return;

    // PRIORITY 0: Death (absolute override)
    if (this.hunger >= DEATH) {
      if (this.antType !== "Queen") {
        stateMachine.forceTransitionTo('DEAD', { reason: 'starvation' });
      }
      return;
    }

    // PRIORITY 1: Queen commands
    const queenState = this.checkQueenCommands();
    if (queenState) {
      this.requestStateTransition(queenState.state, queenState.data);
      return;
    }

    // PRIORITY 2: Emergencies
    const emergencyState = this.checkEmergencies();
    if (emergencyState) {
      this.requestStateTransition(emergencyState.state, emergencyState.data);
      return;
    }

    // PRIORITY 3: Pheromone trails
    const trailState = this.checkPheromoneTrails();
    if (trailState) {
      this.requestStateTransition(trailState.state, trailState.data);
      return;
    }

    // PRIORITY 4: Job-based behavior
    const jobState = this.decideJobBehavior();
    if (jobState) {
      this.requestStateTransition(jobState.state, jobState.data);
      return;
    }

    // PRIORITY 5: Social behavior
    const currentState = stateMachine.getCurrentStateName();
    if (currentState === 'IDLE' && Math.random() < 0.1) {
      const nearbyAnts = this.getNearbyFriendlyAnts(50);
      if (nearbyAnts.length > 0) {
        this.requestStateTransition('SOCIALIZING', {
          target: nearbyAnts[0]
        });
        return;
      }
    }

    // PRIORITY 6: Default idle timeout
    if (currentState === 'IDLE') {
      const idleTime = stateMachine.currentState.getTimeInState();
      if (idleTime > 3000) {
        this.requestStateTransition('GATHERING', {
          reason: 'idle_timeout'
        });
      }
    }
  }

  checkEmergencies() {
    // Starving
    if (this.hunger >= STARVING) {
      return {
        state: 'GATHERING',
        data: {
          priority: 'EMERGENCY',
          targetResource: 'food',
          reason: 'starving'
        }
      };
    }

    // Low health
    const healthController = this.ant.getController('health');
    if (healthController && healthController.getHealthPercent() < 0.2) {
      return {
        state: 'FLEEING',
        data: {
          destination: this.findSafeLocation(),
          reason: 'low_health'
        }
      };
    }

    // Enemy nearby (Warriors only)
    if (this.antType === 'Warrior' || this.antType === 'Spitter') {
      const combatController = this.ant.getController('combat');
      if (combatController && combatController.hasNearbyEnemies()) {
        return {
          state: 'ATTACKING',
          data: {
            target: combatController.getNearestEnemy(),
            reason: 'enemy_detected'
          }
        };
      }
    }

    // Inventory full
    const inventoryController = this.ant.getController('inventory');
    if (inventoryController && inventoryController.isFull()) {
      return {
        state: 'DROPPING_OFF',
        data: { reason: 'inventory_full' }
      };
    }

    return null;
  }

  checkPheromoneTrails() {
    const nearbyPheromones = this.detectNearbyPheromones(100);
    if (nearbyPheromones.length === 0) return null;

    const sortedPheromones = nearbyPheromones.sort((a, b) => {
      const priorityA = this.getTrailPriority(a.name) * (a.strength / a.initial);
      const priorityB = this.getTrailPriority(b.name) * (b.strength / b.initial);
      return priorityB - priorityA;
    });

    for (const pheromone of sortedPheromones) {
      if (this.checkTrail(pheromone)) {
        const stateForTrail = this.getStateForPheromone(pheromone);
        if (stateForTrail) {
          return {
            state: stateForTrail.state,
            data: {
              reason: 'following_pheromone',
              pheromoneType: pheromone.name,
              destination: pheromone.source
            }
          };
        }
      }
    }

    return null;
  }

  getStateForPheromone(pheromone) {
    switch (pheromone.name) {
      case "Build":
        return { state: 'BUILDING', data: { target: pheromone.source } };
      case "Forage":
        return { state: 'GATHERING', data: { area: pheromone.source } };
      case "Farm":
        return { state: 'GATHERING', data: { area: pheromone.source, type: 'farm' } };
      case "Enemy":
        return { state: 'ATTACKING', data: { area: pheromone.source } };
      case "Boss":
        return { state: 'FOLLOWING', data: { target: pheromone.source } };
      default:
        return null;
    }
  }

  decideJobBehavior() {
    switch (this.antType) {
      case "Builder":
        return this.builderBehavior();
      case "Scout":
        return this.scoutBehavior();
      case "Farmer":
        return this.farmerBehavior();
      case "Warrior":
        return this.warriorBehavior();
      case "Spitter":
        return this.spitterBehavior();
      default:
        return this.defaultBehavior();
    }
  }

  builderBehavior() {
    if (this.hunger >= HUNGRY) {
      return { state: 'GATHERING', data: { targetResource: 'food' } };
    }
    const incompleteBuilding = this.findNearestIncompleteBuilding(500);
    if (incompleteBuilding) {
      return { state: 'BUILDING', data: { target: incompleteBuilding } };
    }
    return { state: 'GATHERING', data: { targetResource: 'wood' } };
  }

  warriorBehavior() {
    if (this.hunger >= HUNGRY) {
      return { state: 'GATHERING', data: { targetResource: 'food' } };
    }
    const combatController = this.ant.getController('combat');
    if (combatController) {
      const enemy = combatController.getNearestEnemy(300);
      if (enemy) {
        return { state: 'ATTACKING', data: { target: enemy } };
      }
    }
    return {
      state: 'PATROL',
      data: { 
        route: this.getPatrolRoute(),
        reason: 'no_threats'
      }
    };
  }

  farmerBehavior() {
    if (this.hunger >= HUNGRY) {
      return { state: 'GATHERING', data: { targetResource: 'food' } };
    }
    const farmPlot = this.findNearestFarmPlot(500);
    if (farmPlot && farmPlot.needsTending) {
      return { state: 'FARMING', data: { target: farmPlot } };
    }
    return { state: 'GATHERING', data: { targetResource: 'seeds' } };
  }

  scoutBehavior() {
    if (this.hunger >= HUNGRY) {
      return { state: 'GATHERING', data: { targetResource: 'food' } };
    }
    const unexploredArea = this.findUnexploredArea(1000);
    if (unexploredArea) {
      return {
        state: 'MOVING',
        data: {
          destination: unexploredArea,
          reason: 'exploring'
        }
      };
    }
    return { state: 'GATHERING', data: {} };
  }

  defaultBehavior() {
    if (this.hunger >= HUNGRY) {
      return { state: 'GATHERING', data: { targetResource: 'food' } };
    }
    return { state: 'GATHERING', data: {} };
  }

  requestStateTransition(stateName, data = {}) {
    const stateMachine = this.ant._stateMachine;
    if (!stateMachine) {
      console.warn('AntBrain: No state machine available');
      return false;
    }

    if (!stateMachine.canTransitionTo(stateName)) {
      logVerbose(`AntBrain: Cannot transition to ${stateName}`);
      return false;
    }

    const success = stateMachine.transitionTo(stateName, data);
    if (success) {
      logVerbose(`AntBrain: Transitioned to ${stateName}`);
    }
    return success;
  }

  checkQueenCommands() {
    // Throttle checks
    if (frameCount - this.lastQueenCheckTime < this.queenCheckInterval) {
      if (this.queenCommand && !this.isQueenCommandComplete()) {
        return this.executeQueenCommand();
      }
      return null;
    }
    this.lastQueenCheckTime = frameCount;

    const queen = this.findQueen();
    if (!queen) {
      this.queenCommand = null;
      return null;
    }

    // Check range
    const antPos = this.ant.getPosition();
    const queenPos = queen.getPosition();
    const distance = Math.hypot(queenPos.x - antPos.x, queenPos.y - antPos.y);

    if (distance > this.queenCommandRadius) {
      if (this.queenCommand) {
        console.log(`Ant ${this.ant._antIndex}: Out of Queen's range`);
        this.queenCommand = null;
      }
      return null;
    }

    // Get command
    const newCommand = queen.getCommandForAnt(this.ant);
    if (newCommand) {
      this.queenCommand = newCommand;
      console.log(`Ant ${this.ant._antIndex}: Queen command: ${newCommand.type}`);
      return this.executeQueenCommand();
    }

    if (this.queenCommand && !this.isQueenCommandComplete()) {
      return this.executeQueenCommand();
    }

    return null;
  }

  executeQueenCommand() {
    if (!this.queenCommand) return null;

    switch (this.queenCommand.type) {
      case 'GATHER_AT_LOCATION':
        return {
          state: 'GATHERING',
          data: {
            area: this.queenCommand.location,
            radius: this.queenCommand.radius || 100,
            queenCommand: true
          }
        };
      case 'BUILD_STRUCTURE':
        return {
          state: 'BUILDING',
          data: {
            target: this.queenCommand.buildingTarget,
            queenCommand: true
          }
        };
      case 'ATTACK_TARGET':
        return {
          state: 'ATTACKING',
          data: {
            target: this.queenCommand.target,
            queenCommand: true
          }
        };
      case 'DEFEND_LOCATION':
        return {
          state: 'PATROL',
          data: {
            location: this.queenCommand.location,
            radius: this.queenCommand.radius || 150,
            queenCommand: true
          }
        };
      case 'MOVE_TO_LOCATION':
        return {
          state: 'MOVING',
          data: {
            destination: this.queenCommand.location,
            queenCommand: true
          }
        };
      case 'FOLLOW_QUEEN':
        return {
          state: 'FOLLOWING',
          data: {
            target: this.findQueen(),
            queenCommand: true
          }
        };
      case 'RETREAT':
        return {
          state: 'FLEEING',
          data: {
            destination: this.queenCommand.safeLocation,
            queenCommand: true
          }
        };
      case 'REST':
        return {
          state: 'IDLE',
          data: {
            duration: this.queenCommand.duration || 5000,
            queenCommand: true
          }
        };
      default:
        return null;
    }
  }

  isQueenCommandComplete() {
    // Implementation depends on command type
    return false;
  }

  findQueen() {
    if (typeof queenAnt !== 'undefined' && queenAnt && queenAnt.isActive) {
      return queenAnt;
    }
    if (typeof ants !== 'undefined' && Array.isArray(ants)) {
      return ants.find(ant => 
        ant && ant.isActive && ant._JobName === 'Queen' && ant.faction === this.ant.faction
      );
    }
    return null;
  }

  // Existing methods preserved
  checkHunger() { /* ... */ }
  resetHunger() { /* ... */ }
  checkTrail(pheromone) { /* ... */ }
  addPenalty(pheromoneName, penaltyValue) { /* ... */ }
  getPenalty(pheromoneName) { /* ... */ }
  getTrailPriority(trailType) { /* ... */ }
  modifyPriorityTrails() { /* ... */ }
  setPriority(antType, mult) { /* ... */ }
  internalTimer(deltaTime) { /* ... */ }
}
```

---

## Controller Integration

### How States Use Controllers

**Key Principle**: States **orchestrate** controllers, controllers execute mechanics.

### MovementController Usage

```javascript
// In any state that needs movement
const movementController = this.ant.getController('movement');
if (movementController) {
  movementController.moveToLocation(x, y);          // Start pathfinding
  movementController.stop();                         // Stop movement
  const isMoving = movementController.isMoving();    // Check if moving
  const isBlocked = movementController.isPathBlocked(); // Check obstacles
}
```

### RenderController Usage

```javascript
// Visual feedback for state
const renderController = this.ant.getController('render');
if (renderController) {
  renderController.setStateColor([255, 0, 0]);      // Red for attacking
  renderController.setStateAnimation('attacking');   // Animation
  renderController.playEffect('melee_attack', {});   // One-shot effect
  renderController.clearStateColor();                // Reset
}
```

### CombatController Usage

```javascript
// Combat logic
const combatController = this.ant.getController('combat');
if (combatController) {
  const hasEnemies = combatController.hasNearbyEnemies();
  const enemy = combatController.getNearestEnemy();
  const inRange = combatController.isInAttackRange(target);
  const damage = combatController.attack(target);
  combatController.enterCombat(target);
  combatController.exitCombat();
}
```

### HealthController Usage

```javascript
// Health management
const healthController = this.ant.getController('health');
if (healthController) {
  const percent = healthController.getHealthPercent();
  healthController.takeDamage(amount);
  healthController.heal(amount);
  healthController.applyFatigue(1);
}
```

### InventoryController Usage

```javascript
// Resource management
const inventoryController = this.ant.getController('inventory');
if (inventoryController) {
  const isFull = inventoryController.isFull();
  const added = inventoryController.addItem(resource);
  const hasItem = inventoryController.hasItem('wood', 5);
  inventoryController.removeItem('wood', 1);
}
```

### TerrainController Usage

```javascript
// Terrain detection
const terrainController = this.ant.getController('terrain');
if (terrainController) {
  const tile = terrainController.getCurrentTile();
  const type = tile.type; // 'grass', 'water', 'stone', etc.
  // Apply movement penalties based on terrain
}
```

### Controller Usage Matrix

| Controller | States Using It | Primary Purpose |
|-----------|----------------|----------------|
| MovementController | Moving, Gathering, Attacking, Building, Patrol, Following, Fleeing | Pathfinding and positioning |
| RenderController | ALL states | Visual feedback and effects |
| CombatController | Attacking, Defending, Patrol, Gathering | Enemy detection and combat |
| HealthController | ALL states (for checks) | Health and stamina tracking |
| InventoryController | Gathering, Dropping Off, Building | Resource management |
| TerrainController | Moving, Gathering, Building | Terrain type and penalties |
| SelectionController | ALL states (when selected) | Selection UI and markers |
| TransformController | ALL states | Position queries |

---

## Queen Command System

### QueenAnt Class Enhancement

```javascript
// Classes/ants/Queen.js
class QueenAnt extends ant {
  constructor(antInstance) {
    Object.setPrototypeOf(antInstance, QueenAnt.prototype);
    
    antInstance.commandRadius = 300;
    antInstance.activeCommands = new Map();
    antInstance.assignedAnts = new Map();
    antInstance.nextCommandId = 1;
    
    return antInstance;
  }

  issueCommand(commandType, commandData = {}) {
    const commandId = this.nextCommandId++;
    
    const command = {
      id: commandId,
      type: commandType,
      issuedAt: performance.now(),
      expiresAt: commandData.duration ? 
        performance.now() + commandData.duration : null,
      cancelled: false,
      ...commandData
    };

    this.activeCommands.set(commandId, command);

    const nearbyAnts = this.getAntsInCommandRadius();
    const targetAnts = commandData.targetJobType ? 
      nearbyAnts.filter(ant => ant._JobName === commandData.targetJobType) :
      nearbyAnts;

    const antsToCommand = commandData.maxAnts ? 
      targetAnts.slice(0, commandData.maxAnts) : 
      targetAnts;

    antsToCommand.forEach(ant => {
      this.assignedAnts.set(ant._antIndex, commandId);
    });

    console.log(`Queen issued ${commandType} to ${antsToCommand.length} ants`);
    this.showCommandEffect(commandType, commandData);

    return commandId;
  }

  getCommandForAnt(ant) {
    const commandId = this.assignedAnts.get(ant._antIndex);
    if (!commandId) return null;

    const command = this.activeCommands.get(commandId);
    if (!command || command.cancelled) {
      this.assignedAnts.delete(ant._antIndex);
      return null;
    }

    if (command.expiresAt && performance.now() > command.expiresAt) {
      this.cancelCommand(commandId);
      return null;
    }

    return command;
  }

  cancelCommand(commandId) {
    const command = this.activeCommands.get(commandId);
    if (command) {
      command.cancelled = true;
    }
    for (const [antIndex, assignedCommandId] of this.assignedAnts.entries()) {
      if (assignedCommandId === commandId) {
        this.assignedAnts.delete(antIndex);
      }
    }
  }

  getAntsInCommandRadius() {
    const queenPos = this.getPosition();
    const nearbyAnts = [];

    if (typeof ants !== 'undefined' && Array.isArray(ants)) {
      for (const ant of ants) {
        if (!ant || !ant.isActive || ant === this || ant.faction !== this.faction) continue;

        const antPos = ant.getPosition();
        const distance = Math.hypot(queenPos.x - antPos.x, queenPos.y - antPos.y);

        if (distance <= this.commandRadius) {
          nearbyAnts.push(ant);
        }
      }
    }

    return nearbyAnts;
  }

  showCommandEffect(commandType, commandData) {
    const renderController = this.getController('render');
    if (renderController) {
      renderController.playEffect('command_issued', {
        type: commandType,
        radius: this.commandRadius
      });
    }
  }

  render() {
    super.render();

    if (this.isSelected) {
      push();
      noFill();
      stroke(255, 215, 0, 100);
      strokeWeight(2);
      
      const screenPos = cameraManager.worldToScreen(this.posX, this.posY);
      const radiusOnScreen = this.commandRadius * cameraManager.zoom;
      circle(screenPos.x, screenPos.y, radiusOnScreen * 2);
      pop();

      if (this.assignedAnts.size > 0) {
        push();
        fill(255, 215, 0);
        textAlign(CENTER);
        text(`Commanding: ${this.assignedAnts.size}`, screenPos.x, screenPos.y - 40);
        pop();
      }
    }
  }
}
```

### Queen Command Types

1. **GATHER_AT_LOCATION** - Send ants to gather at specific area
2. **BUILD_STRUCTURE** - Command construction of building
3. **ATTACK_TARGET** - Engage specific enemy
4. **DEFEND_LOCATION** - Guard area against threats
5. **MOVE_TO_LOCATION** - Move to position (attack-move)
6. **FOLLOW_QUEEN** - Follow Queen's movements
7. **RETREAT** - Fall back to safe location
8. **REST** - Take break from work

---

## Priority System

### Complete Decision Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ ABSOLUTE PRIORITY: Death (hunger >= 200)                    │
│ • Force DEAD state, nothing can override                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ HIGHEST PRIORITY: Queen Commands                            │
│ • GATHER_AT_LOCATION, BUILD_STRUCTURE, ATTACK_TARGET        │
│ • DEFEND_LOCATION, MOVE_TO_LOCATION, FOLLOW_QUEEN           │
│ • RETREAT, REST                                              │
│ • Overrides all normal behavior (except death)              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ EMERGENCY PRIORITY: Critical Survival                       │
│ • Starving (hunger >= 160) → GATHERING (food)               │
│ • Very low health (< 20%) → FLEEING                         │
│ • Inventory full → DROPPING_OFF                             │
│ • Enemy nearby (Warriors) → ATTACKING                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ NORMAL PRIORITY: Pheromone Trails                           │
│ • Boss trail (100% priority) → FOLLOWING                    │
│ • Enemy trail (Warrior: 100%) → ATTACKING                   │
│ • Build trail (Builder: 90%) → BUILDING                     │
│ • Farm trail (Farmer: 85%) → GATHERING (farm)               │
│ • Forage trail → GATHERING                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ LOW PRIORITY: Job-Based Behavior                            │
│ • Builder → Look for buildings → BUILDING or GATHERING      │
│ • Warrior → Scan for enemies → ATTACKING or PATROL          │
│ • Farmer → Check farm plots → FARMING or GATHERING          │
│ • Scout → Find unexplored → MOVING (explore)                │
│ • Default → GATHERING                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ IDLE PRIORITY: Social/Default                               │
│ • Nearby friendly ants → SOCIALIZING                        │
│ • Idle > 3 seconds → GATHERING                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Core State Machine (Week 1)

- [ ] Create `Classes/ants/states/` folder
- [ ] Implement `BaseState.js` abstract class
- [ ] Refactor `AntStateMachine.js` to true state machine
  - [ ] Add states map (object instances)
  - [ ] Add transitions map (legal transitions)
  - [ ] Implement `transitionTo()` with validation
  - [ ] Implement `update()` with auto-transition checking
  - [ ] Add `canTransitionTo()` and `forceTransitionTo()`
- [ ] Write unit tests for state machine
  - [ ] Test legal transitions
  - [ ] Test illegal transitions blocked
  - [ ] Test state lifecycle (enter/exit)
  - [ ] Test force transition

### Phase 2: Basic States (Week 2)

- [ ] Implement `IdleState.js`
- [ ] Refactor existing `GatherState.js` to extend `BaseState`
- [ ] Implement `MovingState.js`
- [ ] Implement `DroppingOffState.js`
- [ ] Implement `AttackingState.js`
- [ ] Test each state in isolation
- [ ] Test state transitions between basic states

### Phase 3: Advanced States (Week 3)

- [ ] Implement `DefendingState.js`
- [ ] Implement `BuildingState.js`
- [ ] Implement `PatrolState.js`
- [ ] Implement `FollowingState.js`
- [ ] Implement `SocializingState.js`
- [ ] Implement `MatingState.js`
- [ ] Implement `FleeingState.js`
- [ ] Implement `DeadState.js`
- [ ] Test all states with controller integration

### Phase 4: AntBrain Enhancement (Week 4)

- [ ] Add decision-making system to `AntBrain.js`
  - [ ] Implement `makeDecision()` method
  - [ ] Implement `checkEmergencies()`
  - [ ] Implement `checkPheromoneTrails()`
  - [ ] Implement `decideJobBehavior()`
  - [ ] Add job-specific behavior methods
- [ ] Add `requestStateTransition()` method
- [ ] Test AntBrain decision priority system
- [ ] Test pheromone trail integration

### Phase 5: Queen Command System (Week 5)

- [ ] Enhance `Queen.js` with command system
  - [ ] Implement `issueCommand()` method
  - [ ] Implement `getCommandForAnt()` method
  - [ ] Implement `cancelCommand()` method
  - [ ] Add command tracking (activeCommands, assignedAnts)
- [ ] Add Queen command checking to `AntBrain.js`
  - [ ] Implement `checkQueenCommands()`
  - [ ] Implement `executeQueenCommand()`
  - [ ] Implement `isQueenCommandComplete()`
- [ ] Add UI for Queen commands (radial menu)
- [ ] Test Queen command system
  - [ ] Test command issuance
  - [ ] Test command execution
  - [ ] Test command cancellation
  - [ ] Test range-based command validity

### Phase 6: Integration & Testing (Week 6)

- [ ] Integration testing
  - [ ] Test full ant lifecycle with state machine
  - [ ] Test AntBrain + State Machine integration
  - [ ] Test Queen commands + State Machine
  - [ ] Test all controllers with states
- [ ] E2E testing (see separate test plan)
- [ ] Performance testing
  - [ ] Test with 100+ ants
  - [ ] Profile state machine overhead
  - [ ] Optimize hot paths
- [ ] Bug fixes and polish

### Phase 7: Documentation & Migration (Week 7)

- [ ] Update all documentation
- [ ] Create migration guide for developers
- [ ] Update testing standards
- [ ] Code review and cleanup
- [ ] Merge to main branch

---

## Migration Strategy

### Backward Compatibility

**Critical**: The new system must maintain compatibility with existing code during transition.

### Migration Phases

#### Phase 1: Parallel Systems (Weeks 1-3)

- New state machine runs alongside old system
- Feature flag to enable new system: `USE_TRUE_STATE_MACHINE = false`
- Old code paths preserved

```javascript
// In ants.js
update() {
  if (USE_TRUE_STATE_MACHINE) {
    // New system
    this.brain.update(deltaTime);
    this._stateMachine.update();
  } else {
    // Old system
    this._updateStateMachine();
    this.brain.update(deltaTime);
  }
}
```

#### Phase 2: Gradual Rollout (Weeks 4-5)

- Enable new system for subset of ants
- Test in production-like scenarios
- Monitor for bugs and performance issues

```javascript
// Enable for Scout ants first
if (this._JobName === 'Scout' || USE_TRUE_STATE_MACHINE) {
  // New system
} else {
  // Old system
}
```

#### Phase 3: Full Migration (Week 6)

- Enable for all ants
- Old code paths still present but unused
- Extensive testing

#### Phase 4: Cleanup (Week 7)

- Remove old code paths
- Remove feature flags
- Final documentation update

### Breaking Changes

**None expected** - API surface remains compatible:

```javascript
// These still work (delegated to new system)
ant.getCurrentState()  // Returns state name
ant.setState(newState) // Requests transition
ant.isGathering()      // Checks current state
```

---

## Testing Requirements

See **COMPREHENSIVE E2E TEST PLAN** (separate document) for detailed testing strategy.

### Testing Coverage Required

1. **Unit Tests**: Each state class, state machine transitions
2. **Integration Tests**: AntBrain + State Machine + Controllers
3. **E2E Tests**: Full ant behaviors in browser
4. **Performance Tests**: 100+ ants with state machine
5. **Queen Command Tests**: Command issuance and execution

### Critical Test Scenarios

- [ ] State transitions respect legal transition rules
- [ ] Illegal transitions are blocked
- [ ] State enter() and exit() called correctly
- [ ] Controllers accessed properly from states
- [ ] AntBrain makes correct decisions based on priority
- [ ] Queen commands override normal behavior
- [ ] Queen commands expire/cancel correctly
- [ ] Hunger system integrates with state decisions
- [ ] Pheromone trails influence state changes
- [ ] Job types behave according to specialization
- [ ] Multiple simultaneous states don't conflict
- [ ] Performance acceptable with 100+ ants

---

## Appendix A: State Transition Diagram

```
                    ┌──────────────┐
                    │     IDLE     │◄─────────┐
                    └──────┬───────┘          │
                           │                  │
        ┌──────────────────┼──────────────────┼────────────┐
        │                  │                  │            │
        ▼                  ▼                  │            ▼
   ┌─────────┐        ┌─────────┐            │      ┌──────────┐
   │ MOVING  │◄──────►│GATHERING│────────────┤      │ATTACKING │
   └────┬────┘        └────┬────┘            │      └─────┬────┘
        │                  │                  │            │
        │                  ▼                  │            ▼
        │           ┌──────────────┐          │      ┌──────────┐
        └──────────►│DROPPING_OFF  │          └─────►│DEFENDING │
                    └──────────────┘                 └──────────┘
                           │                               │
                           │                               │
                           ▼                               ▼
                    ┌──────────┐                     ┌─────────┐
                    │ BUILDING │                     │FLEEING  │
                    └──────────┘                     └────┬────┘
                           │                              │
                           │                              │
                    ┌──────┴───────────────────────────┬─┘
                    │                                  │
                    ▼                                  ▼
              ┌──────────┐                       ┌────────┐
              │SOCIALIZING│                       │ DEAD   │ (terminal)
              └──────────┘                       └────────┘
                    │
                    ▼
              ┌──────────┐
              │ MATING   │
              └──────────┘
                    │
                    ▼
              ┌──────────┐
              │ PATROL   │
              └──────────┘
                    │
                    ▼
              ┌──────────┐
              │FOLLOWING │
              └──────────┘
```

**Note**: All non-DEAD states can transition to DEAD. DEAD is terminal.

---

## Appendix B: Controller Responsibilities

| Controller | What It Does | What It Doesn't Do |
|-----------|-------------|-------------------|
| MovementController | Pathfinding, movement execution, obstacle avoidance | Decide where to move, when to stop |
| RenderController | Draw sprites, effects, animations | Decide what state to show |
| CombatController | Damage calculation, attack execution, range checks | Decide when to attack, target selection strategy |
| HealthController | Track health, apply damage, healing | Decide to flee when low health |
| InventoryController | Store items, capacity checks | Decide what to gather, when to drop off |
| TerrainController | Tile detection, terrain type | Decide movement strategy based on terrain |
| SelectionController | Selection state, UI highlighting | Decide user interaction behavior |
| TransformController | Position, rotation storage | Decide where to move |

**Golden Rule**: Controllers are **mechanics**, States are **logic**.

---

## Appendix C: Glossary

- **State Machine**: System that manages transitions between discrete states according to rules
- **Finite State Machine (FSM)**: State machine with finite number of states and defined transitions
- **State Object**: Object implementing a behavior (enter, update, exit, checkTransitions)
- **Transition**: Change from one state to another
- **Legal Transition**: Allowed state change defined in transitions map
- **Illegal Transition**: Blocked state change not in transitions map
- **State Lifecycle**: Sequence of enter() → update() (repeated) → exit()
- **Controller**: Component handling specific game mechanic (movement, rendering, combat, etc.)
- **Composition**: Design pattern where objects contain other objects (Entity has controllers)
- **Delegation**: Forwarding method calls to composed objects
- **Priority System**: Ordered list of decision criteria (emergencies before social behavior)
- **Queen Command**: Direct order from Queen that overrides normal ant behavior
- **Pheromone Trail**: Chemical trail that influences ant pathfinding and state decisions
- **Job Type**: Ant specialization (Builder, Warrior, Farmer, Scout, Spitter)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-20 | Team Delta | Initial architecture design document |

---

**END OF DOCUMENT**
