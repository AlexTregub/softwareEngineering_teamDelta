// AntStateMachine.js
// Manages the state of an ant character in a game, including primary activities and modifiers.
// Supports complex state combinations and provides methods to query and change states.
class AntStateMachine {
  constructor() {
    // Primary activity states
    this.primaryState = "IDLE";
    // added DROPPING_OFF so ants can transition to a dedicated dropoff state
    this.primaryStates = ["IDLE", "MOVING", "GATHERING", "FOLLOWING", "BUILDING", "SOCIALIZING", "MATING", "PATROL", "DROPPING_OFF"];
    
    // Combat modifier states
    this.combatModifier = "OUT_OF_COMBAT";
    this.combatStates = ["OUT_OF_COMBAT","IN_COMBAT", "ATTACKING", "DEFENDING", "SPITTING"];
    
    // Terrain modifier states
    this.terrainModifier = "DEFAULT";
    this.terrainStates = ["DEFAULT","IN_WATER", "IN_MUD", "ON_SLIPPERY", "ON_ROUGH"];
    
    // State change callbacks
    this.onStateChange = null;
  }

  // Set the primary activity state
  setPrimaryState(newState) {
    if (this.primaryStates.includes(newState)) {
      const oldState = this.getFullState();
      this.primaryState = newState;
      this._notifyStateChange(oldState, this.getFullState());
      return true;
    }
    console.warn(`AntStateMachine: Invalid primary state '${newState}'`);
    return false;
  }

  // Set combat modifier (null to clear)
  setCombatModifier(newModifier) {
    if (newModifier === null || this.combatStates.includes(newModifier)) {
      const oldState = this.getFullState();
      this.combatModifier = newModifier;
      this._notifyStateChange(oldState, this.getFullState());
      return true;
    }
    console.warn(`AntStateMachine: Invalid combat modifier '${newModifier}'`);
    return false;
  }

  // Set terrain modifier (null to clear)
  setTerrainModifier(newModifier) {
    if (newModifier === null || this.terrainStates.includes(newModifier)) {
      const oldState = this.getFullState();
      this.terrainModifier = newModifier;
      this._notifyStateChange(oldState, this.getFullState());
      return true;
    }
    console.warn(`AntStateMachine: Invalid terrain modifier '${newModifier}'`);
    return false;
  }

  // Set multiple states at once
  setState(primary, combat = null, terrain = null) {
    const oldState = this.getFullState();
    let success = true;
    
    if (primary && !this.primaryStates.includes(primary)) {
      console.warn(`AntStateMachine: Invalid primary state '${primary}'`);
      success = false;
    }
    if (combat && combat !== null && !this.combatStates.includes(combat)) {
      console.warn(`AntStateMachine: Invalid combat modifier '${combat}'`);
      success = false;
    }
    if (terrain && terrain !== null && !this.terrainStates.includes(terrain)) {
      console.warn(`AntStateMachine: Invalid terrain modifier '${terrain}'`);
      success = false;
    }
    
    if (success) {
      if (primary) this.primaryState = primary;
      this.combatModifier = combat;
      this.terrainModifier = terrain;
      this._notifyStateChange(oldState, this.getFullState());
    }
    
    return success;
  }

  // Get the complete state as a string
  getFullState() {
    let state = this.primaryState;
    if (this.combatModifier) state += `_${this.combatModifier}`;
    if (this.terrainModifier) state += `_${this.terrainModifier}`;
    return state;
  }

  // Check if ant can perform specific actions
  canPerformAction(action) {
    switch (action.toLowerCase()) {
      case "move":
        // Can't move while attacking, spitting, building, mating, or on slippery terrain
        return this.combatModifier !== "ATTACKING" && 
               this.combatModifier !== "SPITTING" &&
               this.primaryState !== "BUILDING" &&
               this.primaryState !== "MATING" &&
               this.terrainModifier !== "ON_SLIPPERY";
      
      case "gather":
        // Can't gather while in combat, following, building, socializing, mating, patrolling, or dropping off
        return this.combatModifier === "OUT_OF_COMBAT" && 
               this.primaryState !== "FOLLOWING" &&
               this.primaryState !== "BUILDING" &&
               this.primaryState !== "SOCIALIZING" &&
               this.primaryState !== "PATROL" &&
               this.primaryState !== "MATING" &&
               this.primaryState !== "DROPPING_OFF";
      
      case "attack":
        // Can only attack when in combat states, not while building or mating
        return (this.combatModifier === "IN_COMBAT" || 
                this.combatModifier === "ATTACKING") &&
               this.primaryState !== "BUILDING" &&
               this.primaryState !== "MATING";
      
      case "defend":
        // Can defend when in combat, not while building or mating
        return (this.combatModifier === "IN_COMBAT" || 
                this.combatModifier === "DEFENDING") &&
               this.primaryState !== "BUILDING" &&
               this.primaryState !== "MATING";
      
      case "spit":
        // Can spit when in combat, not while building or mating
        return (this.combatModifier === "IN_COMBAT" || 
                this.combatModifier === "SPITTING") &&
               this.primaryState !== "BUILDING" &&
               this.primaryState !== "MATING";
      
      case "follow":
        // Can't follow while attacking, spitting, building, or mating
        return this.combatModifier !== "ATTACKING" && 
               this.combatModifier !== "SPITTING" &&
               this.primaryState !== "BUILDING" &&
               this.primaryState !== "MATING";
      
      case "build":
        // Can only build when out of combat and not engaged in other activities
        return this.combatModifier === "OUT_OF_COMBAT" &&
               this.primaryState !== "MATING" &&
               this.primaryState !== "SOCIALIZING";
      
      case "socialize":
        // Can socialize when out of combat, not while building or mating
        return this.combatModifier === "OUT_OF_COMBAT" &&
               this.primaryState !== "BUILDING" &&
               this.primaryState !== "MATING";
      
      case "mate":
        // Can only mate when out of combat and not engaged in other activities
        return this.combatModifier === "OUT_OF_COMBAT" &&
               this.primaryState !== "BUILDING" &&
               this.primaryState !== "SOCIALIZING";
      
      case "patrol":
        // Can't patrol while engaged in other activities
        return this.primaryState !== "BUILDING" &&
               this.primaryState !== "SOCIALIZING";
      
      default:
        return true;
    }
  }

  // Check current states
  isPrimaryState(state) { return this.primaryState === state; }
  isDroppingOff() { return this.primaryState === "DROPPING_OFF"; }
  isInCombat() { return this.combatModifier !== "OUT_OF_COMBAT" && this.combatModifier !== null; }
  isOutOfCombat() { return this.combatModifier === "OUT_OF_COMBAT"; }
  isOnTerrain(terrain) { return this.terrainModifier === terrain; }
  isInState(fullState) {  return this.getFullState() === fullState; }

  // State queries
  isIdle() { return this.primaryState === "IDLE" && this.isOutOfCombat(); }
  isMoving() { return this.primaryState === "MOVING"; }
  isGathering() { return this.primaryState === "GATHERING"; }
  isFollowing() { return this.primaryState === "FOLLOWING"; }
  isBuilding() { return this.primaryState === "BUILDING"; }
  isSocializing() { return this.primaryState === "SOCIALIZING"; }
  isMating() { return this.primaryState === "MATING"; }
  
  // Terrain queries
  isOnDefaultTerrain() { return this.terrainModifier === "DEFAULT"; }
  isInWater() { return this.terrainModifier === "IN_WATER"; }
  isInMud() { return this.terrainModifier === "IN_MUD"; }
  isOnSlipperyTerrain() { return this.terrainModifier === "ON_SLIPPERY"; }
  isOnRoughTerrain() { return this.terrainModifier === "ON_ROUGH"; }

  // Clear all modifiers (return to primary state only)
  clearModifiers() {
    const oldState = this.getFullState();
    this.combatModifier = null;
    this.terrainModifier = null;
    this._notifyStateChange(oldState, this.getFullState());
  }

  // Reset to idle state
  reset() {
    const oldState = this.getFullState();
    this.primaryState = "IDLE";
    this.combatModifier = "OUT_OF_COMBAT";
    this.terrainModifier = "DEFAULT";
    this._notifyStateChange(oldState, this.getFullState());
  }

  // Set callback for state changes
  setStateChangeCallback(callback) {
    this.onStateChange = callback;
  }

  // Private method to notify state changes
  _notifyStateChange(oldState, newState) {
    if (oldState !== newState && this.onStateChange) {
      this.onStateChange(oldState, newState);
    }
  }

  // Debug: Print current state
  printState() {
    if (devConsoleEnabled) {
      console.log(`AntStateMachine State: ${this.getFullState()}`);
      console.log(`  Primary: ${this.primaryState}`);
      console.log(`  Combat: ${this.combatModifier || "None"}`);
      console.log(`  Terrain: ${this.terrainModifier || "None"}`);
    }
  }

  // Get state summary for debugging
  getStateSummary() {
    return {
      fullState: this.getFullState(),
      primary: this.primaryState,
      combat: this.combatModifier,
      terrain: this.terrainModifier,
      actions: {
        canMove: this.canPerformAction("move"),
        canGather: this.canPerformAction("gather"),
        canAttack: this.canPerformAction("attack"),
        canDefend: this.canPerformAction("defend"),
        canSpit: this.canPerformAction("spit"),
        canFollow: this.canPerformAction("follow"),
        canBuild: this.canPerformAction("build"),
        canSocialize: this.canPerformAction("socialize"),
        canMate: this.canPerformAction("mate")
      }
    };
  }

  // Update method for game loop integration
  update() {
    // Currently a no-op - state machine updates happen through explicit state changes
    // This method exists to satisfy the interface expected by ant.js
  }
}

/**
 * runAntStateCoverageTest
 * -----------------------
 * Exercise every state combination defined on AntStateMachine (primary × (null + combat) × (null + terrain)).
 * Automatically picks up any new states added to primaryStates/combatStates/terrainStates.
 * Returns a report object { total, checked, failures, visitedCount } and logs a concise summary.
 */
function runAntStateCoverageTest(selectedAnt = null, verbose = false) {
  selectedAnt ??= new AntWrapper();
  const failures = [];
  const visited = new Set();
  selectedAnt.getAntStateMachine().setStateChangeCallback((oldState, newState) => visited.add(newState));

  const primaries = Array.from(selectedAnt.primaryStates);
  const combats = [null].concat(Array.from(selectedAnt.combatStates));
  const terrains = [null].concat(Array.from(selectedAnt.terrainStates));

  function buildExpected(primary, combat, terrain) {
    let s = primary;
    if (combat) s += `_${combat}`;
    if (terrain) s += `_${terrain}`;
    return s;
  }

  let checked = 0;
  for (const p of primaries) {
    for (const c of combats) {
      for (const t of terrains) {
        checked++;
        const ok = sm.setState(p, c, t);
        const expected = buildExpected(p, c, t);
        const actual = sm.getFullState();
        if (!ok) failures.push({ primary: p, combat: c, terrain: t, reason: 'setState returned false' });
        if (actual !== expected) failures.push({ primary: p, combat: c, terrain: t, reason: 'state mismatch', expected, actual });
        if (verbose && failures.length === 0) {
          console.log(`OK: ${expected}`);
        }
      }
    }
  }

  const report = {
    total: primaries.length * combats.length * terrains.length,
    checked,
    failures,
    visitedCount: visited.size
  };

  console.log(`AntStateCoverage: checked ${checked} combinations, failures: ${failures.length}, visitedStateCount: ${visited.size}`);
  if (failures.length) console.table(failures);
  return report;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntStateMachine;
}