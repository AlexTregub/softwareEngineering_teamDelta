// FACTION SYSTEM INTEGRATION WITH ANT STATE MACHINE
// This shows how to integrate the faction system with the existing state machine

console.log("🔗 FACTION-STATE MACHINE INTEGRATION DESIGN");
console.log("=============================================\n");

// 1. CURRENT ANT STATE MACHINE ANALYSIS
console.log("📊 CURRENT STATE MACHINE ANALYSIS:");
console.log("===================================");

const currentStateMachine = {
  "Primary States": ["IDLE", "MOVING", "GATHERING", "FOLLOWING", "BUILDING", "SOCIALIZING", "MATING"],
  "Combat Modifiers": ["OUT_OF_COMBAT", "IN_COMBAT", "ATTACKING", "DEFENDING", "SPITTING"],
  "Terrain Modifiers": ["DEFAULT", "IN_WATER", "IN_MUD", "ON_SLIPPERY", "ON_ROUGH"],
  "Key Methods": [
    "canPerformAction(action)",
    "isInCombat()",
    "setStateChangeCallback()",
    "setPrimaryState()",
    "setCombatModifier()"
  ]
};

console.log(JSON.stringify(currentStateMachine, null, 2));

// 2. INTEGRATION POINTS IDENTIFIED
console.log("\n🎯 FACTION INTEGRATION POINTS:");
console.log("==============================");

const integrationPoints = {
  "Combat Decision Making": {
    "trigger": "When ant encounters another ant",
    "current": "Basic combat states (IN_COMBAT, ATTACKING, etc.)",
    "enhanced": "Faction relationship determines if combat should initiate",
    "implementation": "Before setting IN_COMBAT, check faction relationships"
  },
  
  "Action Permissions": {
    "trigger": "Before performing any action",
    "current": "canPerformAction() checks state constraints",
    "enhanced": "Also check if action is allowed based on faction relationships",
    "implementation": "Extend canPerformAction() to include faction checks"
  },
  
  "State Change Events": {
    "trigger": "When state changes occur",
    "current": "State change callback for debugging",
    "enhanced": "Notify faction system of relevant state changes",
    "implementation": "Faction system listens to combat/social state changes"
  },
  
  "Social Interactions": {
    "trigger": "SOCIALIZING state activation",
    "current": "Generic socializing behavior",
    "enhanced": "Faction-aware social interactions (trade, diplomacy)",
    "implementation": "Different socializing behaviors based on faction relationships"
  }
};

console.log(JSON.stringify(integrationPoints, null, 2));

// 3. ENHANCED ANT STATE MACHINE MOCK
console.log("\n🔧 ENHANCED STATE MACHINE DESIGN:");
console.log("=================================");

// Mock of enhanced state machine that communicates with faction system
class EnhancedAntStateMachineMock {
  constructor(ant) {
    // Existing state machine functionality
    this.primaryState = "IDLE";
    this.combatModifier = "OUT_OF_COMBAT";
    this.terrainModifier = "DEFAULT";
    this.onStateChange = null;
    
    // NEW: Reference to the ant that owns this state machine
    this.ant = ant;
    
    // NEW: Faction-aware action checks
    this.factionActionChecks = {
      "attack": this.canAttackBasedOnFaction.bind(this),
      "socialize": this.canSocializeBasedOnFaction.bind(this),
      "follow": this.canFollowBasedOnFaction.bind(this),
      "trade": this.canTradeBasedOnFaction.bind(this)
    };
  }

  // ENHANCED: Action permission checking with faction awareness
  canPerformAction(action, targetAnt = null) {
    // Original state-based checks
    const stateAllows = this.originalCanPerformAction(action);
    if (!stateAllows) return false;
    
    // NEW: Faction-based checks if target is specified
    if (targetAnt && this.factionActionChecks[action]) {
      return this.factionActionChecks[action](targetAnt);
    }
    
    return true;
  }

  // NEW: Faction-aware combat decision
  canAttackBasedOnFaction(targetAnt) {
    if (!this.ant.faction || !targetAnt.faction) return true; // No faction = allow
    
    const relationship = this.ant.faction.getRelationshipState(targetAnt.faction.name);
    
    // Only attack enemies and blood enemies
    return relationship.name === "ENEMIES" || relationship.name === "BLOOD_ENEMIES";
  }

  // NEW: Faction-aware socializing
  canSocializeBasedOnFaction(targetAnt) {
    if (!this.ant.faction || !targetAnt.faction) return true;
    
    const relationship = this.ant.faction.getRelationshipState(targetAnt.faction.name);
    
    // Can socialize with neutral and allied factions
    return relationship.name === "NEUTRAL" || relationship.name === "ALLIED";
  }

  // NEW: Faction-aware following
  canFollowBasedOnFaction(targetAnt) {
    if (!this.ant.faction || !targetAnt.faction) return true;
    
    const relationship = this.ant.faction.getRelationshipState(targetAnt.faction.name);
    
    // Only follow allied or same faction ants
    return relationship.name === "ALLIED" || this.ant.faction === targetAnt.faction;
  }

  // NEW: Faction-aware trading
  canTradeBasedOnFaction(targetAnt) {
    if (!this.ant.faction || !targetAnt.faction) return false; // Need factions to trade
    
    const relationship = this.ant.faction.getRelationshipState(targetAnt.faction.name);
    
    // Can trade with neutral and allied factions
    return relationship.name === "NEUTRAL" || relationship.name === "ALLIED";
  }

  // ENHANCED: Combat initiation with faction awareness
  initiateComBat(targetAnt) {
    // Check if we should even be fighting
    if (!this.canAttackBasedOnFaction(targetAnt)) {
      console.log(`${this.ant.faction.name} ant refuses to attack ${targetAnt.faction.name} ant (faction relationship)`);
      return false;
    }

    // Proceed with normal combat state machine
    this.setCombatModifier("IN_COMBAT");
    console.log(`${this.ant.faction.name} ant enters combat with ${targetAnt.faction.name} ant`);
    
    // Update faction relationship (combat worsens relations)
    this.ant.faction.modifyRelationship(targetAnt.faction.name, -5, "Combat engagement");
    
    return true;
  }

  // ENHANCED: Social interaction with faction effects
  initiateSocialInteraction(targetAnt, interactionType) {
    if (!this.canSocializeBasedOnFaction(targetAnt)) {
      console.log(`${this.ant.faction.name} ant refuses to interact with ${targetAnt.faction.name} ant`);
      return false;
    }

    this.setPrimaryState("SOCIALIZING");
    
    // Apply faction relationship effects based on interaction type
    switch (interactionType) {
      case "trade":
        this.ant.faction.modifyRelationship(targetAnt.faction.name, +5, "Trade interaction");
        break;
      case "share_food":
        this.ant.faction.modifyRelationship(targetAnt.faction.name, +3, "Food sharing");
        break;
      case "information_exchange":
        this.ant.faction.modifyRelationship(targetAnt.faction.name, +2, "Information sharing");
        break;
    }
    
    console.log(`${this.ant.faction.name} ant ${interactionType} with ${targetAnt.faction.name} ant`);
    return true;
  }

  // NEW: Automatic faction-based behavior triggers
  checkForAutomaticBehaviors(nearbyAnts) {
    if (!this.ant.faction) return;

    nearbyAnts.forEach(otherAnt => {
      if (!otherAnt.faction || otherAnt === this.ant) return;
      
      const relationship = this.ant.faction.getRelationshipState(otherAnt.faction.name);
      
      // Automatic hostility for enemies/blood enemies
      if (relationship.attackOnSight && this.isOutOfCombat()) {
        console.log(`${this.ant.faction.name} ant automatically attacks ${otherAnt.faction.name} ant on sight`);
        this.initiateComBat(otherAnt);
      }
      
      // Automatic assistance for allies
      if (relationship.name === "ALLIED" && otherAnt.stateMachine.isInCombat()) {
        console.log(`${this.ant.faction.name} ant comes to aid of allied ${otherAnt.faction.name} ant`);
        this.setPrimaryState("FOLLOWING"); // Move to help ally
      }
    });
  }

  // Placeholder for original method
  originalCanPerformAction(action) {
    // This would be the existing canPerformAction logic
    return true; // Simplified for mock
  }

  // Existing methods remain the same
  setPrimaryState(state) { this.primaryState = state; }
  setCombatModifier(modifier) { this.combatModifier = modifier; }
  isOutOfCombat() { return this.combatModifier === "OUT_OF_COMBAT"; }
  isInCombat() { return this.combatModifier !== "OUT_OF_COMBAT"; }
}

// 4. ANT CLASS INTEGRATION EXAMPLE
console.log("\n🐜 ANT CLASS INTEGRATION EXAMPLE:");
console.log("=================================");

class FactionAwareAntMock {
  constructor(x, y, faction) {
    this.x = x;
    this.y = y;
    this.faction = faction; // Reference to faction object
    
    // Enhanced state machine with faction awareness
    this.stateMachine = new EnhancedAntStateMachineMock(this);
    
    // Set up faction-aware state change callback
    this.stateMachine.onStateChange = (oldState, newState) => {
      this.onStateChange(oldState, newState);
    };
  }

  // Enhanced encounter method with faction integration
  encounterOtherAnt(otherAnt) {
    console.log(`\\n${this.faction.name} ant encounters ${otherAnt.faction.name} ant`);
    
    // Faction systems learn about each other
    this.faction.encounterFaction(otherAnt.faction);
    otherAnt.faction.encounterFaction(this.faction);
    
    // Check automatic behaviors based on faction relationship
    this.stateMachine.checkForAutomaticBehaviors([otherAnt]);
    
    // Return what action was taken
    const relationship = this.faction.getRelationshipState(otherAnt.faction.name);
    return {
      relationship: relationship.name,
      actionTaken: this.stateMachine.isInCombat() ? "combat" : "peaceful"
    };
  }

  // Enhanced update method
  update() {
    // Regular ant update logic...
    
    // NEW: Check for nearby ants and apply faction behaviors
    const nearbyAnts = this.getNearbyAnts(); // Would get actual nearby ants
    this.stateMachine.checkForAutomaticBehaviors(nearbyAnts);
  }

  onStateChange(oldState, newState) {
    console.log(`${this.faction.name} ant: ${oldState} -> ${newState}`);
    
    // Notify faction system of relevant state changes
    if (newState.includes("IN_COMBAT")) {
      console.log(`  ${this.faction.name} faction notes combat engagement`);
    }
    if (newState.includes("SOCIALIZING")) {
      console.log(`  ${this.faction.name} faction notes diplomatic activity`);
    }
  }

  getNearbyAnts() {
    return []; // Mock - would return actual nearby ants
  }
}

// 5. INTEGRATION DEMO
console.log("\n🎭 INTEGRATION DEMONSTRATION:");
console.log("=============================");

// Create mock factions
const builderFaction = { 
  name: "Builders", 
  getRelationshipState: (name) => ({ name: "NEUTRAL", attackOnSight: false }),
  encounterFaction: (faction) => console.log(`Builders discover ${faction.name}`),
  modifyRelationship: (name, change, reason) => console.log(`Builders ${change > 0 ? 'improve' : 'worsen'} relations with ${name}: ${reason}`)
};

const warriorFaction = { 
  name: "Warriors", 
  getRelationshipState: (name) => ({ name: "ENEMIES", attackOnSight: true }),
  encounterFaction: (faction) => console.log(`Warriors discover ${faction.name}`),
  modifyRelationship: (name, change, reason) => console.log(`Warriors ${change > 0 ? 'improve' : 'worsen'} relations with ${name}: ${reason}`)
};

// Create ants
const builderAnt = new FactionAwareAntMock(100, 100, builderFaction);
const warriorAnt = new FactionAwareAntMock(120, 120, warriorFaction);

// Test faction-aware encounter
const encounterResult = builderAnt.encounterOtherAnt(warriorAnt);
console.log(`Encounter result:`, encounterResult);

// Test faction-aware action permissions
console.log(`\\nACTION PERMISSIONS:`);
console.log(`Builder can attack Warrior: ${builderAnt.stateMachine.canPerformAction("attack", warriorAnt)}`);
console.log(`Builder can socialize with Warrior: ${builderAnt.stateMachine.canPerformAction("socialize", warriorAnt)}`);
console.log(`Builder can trade with Warrior: ${builderAnt.stateMachine.canPerformAction("trade", warriorAnt)}`);

console.log("\\n✅ FACTION-STATE MACHINE INTEGRATION COMPLETE!");
console.log("\\n📋 IMPLEMENTATION ROADMAP:");
console.log("===========================");
console.log("1. ✅ Analyze existing state machine structure");
console.log("2. ✅ Identify integration points for faction awareness");
console.log("3. ✅ Design enhanced action permission system");
console.log("4. ✅ Plan automatic faction-based behaviors");
console.log("5. ✅ Create state change notification system");
console.log("6. ⏳ Implement faction property in ant class");
console.log("7. ⏳ Extend canPerformAction() with faction checks");
console.log("8. ⏳ Add faction-aware combat initiation");
console.log("9. ⏳ Implement automatic hostility/assistance behaviors");
console.log("10. ⏳ Create faction-aware social interaction system");
console.log("11. ⏳ Add comprehensive testing for all integrations");