
// AntStateMachine.js
// Manages the state of an ant character in a game, including primary activities and modifiers.
// Supports complex state combinations and provides methods to query and change states.
class AntStateMachine {
  constructor() {
    // Primary activity states
    this.primaryState = "IDLE";
    this.primaryStates = ["IDLE", "MOVING", "GATHERING", "FOLLOWING"];
    
    // Combat modifier states
    this.combatModifier = null;
    this.combatStates = ["IN_COMBAT", "ATTACKING", "DEFENDING", "SPITTING"];
    
    // Terrain modifier states
    this.terrainModifier = null;
    this.terrainStates = ["IN_WATER", "IN_MUD"];
    
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
        return this.combatModifier !== "ATTACKING" && this.combatModifier !== "SPITTING";
      
      case "gather":
        return this.combatModifier !== "ATTACKING" && 
               this.combatModifier !== "SPITTING" && 
               this.primaryState !== "FOLLOWING";
      
      case "attack":
        return this.combatModifier === "IN_COMBAT" || 
               this.combatModifier === "ATTACKING";
      
      case "defend":
        return this.combatModifier === "IN_COMBAT" || 
               this.combatModifier === "DEFENDING";
      
      case "spit":
        return this.combatModifier === "IN_COMBAT" || 
               this.combatModifier === "SPITTING";
      
      case "follow":
        return this.combatModifier !== "ATTACKING" && 
               this.combatModifier !== "SPITTING";
      
      default:
        return true;
    }
  }

  // Check current states
  isPrimaryState(state) { return this.primaryState === state; }
  isInCombat() { return this.combatModifier !== null; }
  isOnTerrain(terrain) { return this.terrainModifier === terrain; }
  isInState(fullState) {  return this.getFullState() === fullState; }

  // State queries
  isIdle() { return this.primaryState === "IDLE" && !this.isInCombat(); }
  isMoving() { return this.primaryState === "MOVING"; }
  isGathering() { return this.primaryState === "GATHERING"; }
  isFollowing() { return this.primaryState === "FOLLOWING"; }

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
    this.combatModifier = null;
    this.terrainModifier = null;
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
    console.log(`AntStateMachine State: ${this.getFullState()}`);
    console.log(`  Primary: ${this.primaryState}`);
    console.log(`  Combat: ${this.combatModifier || "None"}`);
    console.log(`  Terrain: ${this.terrainModifier || "None"}`);
  }

  // Get state summary for debugging
  getStateSummary() {
    return {
      fullState: this.getFullState(),
      primary: this.primaryState,
      combat: this.combatModifier,
      terrain: this.terrainModifier,
      canMove: this.canPerformAction("move"),
      canGather: this.canPerformAction("gather"),
      canAttack: this.canPerformAction("attack")
    };
  }
}

function antSMtest() {
    // Create state machine for an ant
    let antSM = new AntStateMachine();
    
    // Set states
    antSM.setPrimaryState("MOVING");
    antSM.setCombatModifier("IN_COMBAT");
    antSM.setTerrainModifier("IN_MUD");
    
    console.log(antSM.getFullState()); // "MOVING_IN_COMBAT_IN_MUD"
    
    // Check capabilities
    console.log(antSM.canPerformAction("move")); // true
    console.log(antSM.canPerformAction("attack")); // true
    
    // Set callback for state changes
    antSM.setStateChangeCallback((oldState, newState) => {
      console.log(`Ant state changed from ${oldState} to ${newState}`);
    });
    
    // Reset to idle
    antSM.reset(); // "Ant state changed from MOVING_IN_COMBAT_IN_MUD to IDLE"
    antSM.printState();
    console.log(antSM.getStateSummary());
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = AntStateMachine;
}