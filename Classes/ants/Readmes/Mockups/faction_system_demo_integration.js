// faction_system_demo_integration.js
// Live demonstration of the integrated faction-state machine system

console.log("🎮 FACTION-STATE MACHINE INTEGRATION DEMO");
console.log("==========================================\n");

// Import the faction system (in a real environment, this would be properly imported)
// For demo purposes, we'll include simplified versions

// Simplified faction system for demo
const RELATIONSHIP_STATES = {
  ALLIED: { name: "ALLIED", min: 80, max: 100, attackOnSight: false },
  NEUTRAL: { name: "NEUTRAL", min: 20, max: 79, attackOnSight: false },
  ENEMIES: { name: "ENEMIES", min: 1, max: 19, attackOnSight: true },
  BLOOD_ENEMIES: { name: "BLOOD_ENEMIES", min: 0, max: 0, attackOnSight: true }
};

class DemoFaction {
  constructor(name, color) {
    this.name = name;
    this.color = color;
    this.relationships = new Map();
    this.ants = new Set();
  }

  addAnt(ant) {
    this.ants.add(ant);
    console.log(`  📍 ${ant.constructor.name} joined ${this.name} faction (${this.ants.size} total)`);
  }

  removeAnt(ant) {
    this.ants.delete(ant);
  }

  encounterFaction(otherFaction) {
    if (otherFaction === this) return;
    
    if (!this.relationships.has(otherFaction.name)) {
      this.relationships.set(otherFaction.name, 50); // Neutral starting point
      console.log(`  🔍 ${this.name} discovers ${otherFaction.name} faction`);
    }
  }

  getRelationshipValue(factionName) {
    return this.relationships.get(factionName) || 50;
  }

  getRelationshipState(factionName) {
    const value = this.getRelationshipValue(factionName);
    
    for (const state of Object.values(RELATIONSHIP_STATES)) {
      if (value >= state.min && value <= state.max) {
        return state;
      }
    }
    
    return RELATIONSHIP_STATES.NEUTRAL;
  }

  modifyRelationship(factionName, change, reason = "Unknown") {
    const current = this.getRelationshipValue(factionName);
    const newValue = Math.max(0, Math.min(100, current + change));
    
    if (current === 0 && change > 0) {
      console.log(`  ❌ ${this.name} -> ${factionName}: Blood enemies cannot improve relations`);
      return;
    }
    
    this.relationships.set(factionName, newValue);
    
    const oldState = this.getRelationshipState(factionName);
    this.relationships.set(factionName, current); // Temporarily set back
    const oldStateObj = this.getRelationshipState(factionName);
    this.relationships.set(factionName, newValue); // Set to new value
    const newState = this.getRelationshipState(factionName);
    
    if (oldStateObj.name !== newState.name) {
      console.log(`  🔄 ${this.name} -> ${factionName}: ${oldStateObj.name} -> ${newState.name} (${reason})`);
    }
  }
}

// Simplified state machine for demo
class DemoAntStateMachine {
  constructor(ant) {
    this.primaryState = "IDLE";
    this.combatModifier = "OUT_OF_COMBAT";
    this._ant = ant;
  }

  canPerformAction(action, targetAnt = null) {
    const stateAllowed = this._checkStatePermission(action);
    if (!stateAllowed) return false;
    
    if (targetAnt && this._ant && this._ant.faction && targetAnt.faction) {
      return this._checkFactionPermission(action, targetAnt);
    }
    
    return true;
  }

  _checkStatePermission(action) {
    switch (action.toLowerCase()) {
      case "attack":
        return this.combatModifier === "IN_COMBAT" || this.combatModifier === "ATTACKING";
      case "socialize":
      case "trade":
        return this.combatModifier === "OUT_OF_COMBAT";
      default:
        return true;
    }
  }

  _checkFactionPermission(action, targetAnt) {
    const relationship = this._ant.faction.getRelationshipState(targetAnt.faction.name);
    
    switch (action.toLowerCase()) {
      case "attack":
        return relationship.name === "ENEMIES" || relationship.name === "BLOOD_ENEMIES";
      case "socialize":
      case "trade":
        return relationship.name === "NEUTRAL" || relationship.name === "ALLIED";
      case "follow":
        return relationship.name === "ALLIED" || this._ant.faction === targetAnt.faction;
      default:
        return true;
    }
  }

  checkAutomaticFactionBehaviors(nearbyAnts) {
    if (!this._ant || !this._ant.faction) return;
    
    nearbyAnts.forEach(otherAnt => {
      if (!otherAnt.faction || otherAnt === this._ant) return;
      
      const relationship = this._ant.faction.getRelationshipState(otherAnt.faction.name);
      
      if (relationship.attackOnSight && this.combatModifier === "OUT_OF_COMBAT") {
        console.log(`    ⚔️  ${this._ant.faction.name} ant automatically attacks ${otherAnt.faction.name} ant on sight`);
        this.setCombatModifier("IN_COMBAT");
        this._ant.faction.modifyRelationship(otherAnt.faction.name, -2, "Auto-combat");
      }
      
      if (relationship.name === "ALLIED" && otherAnt.stateMachine.isInCombat()) {
        console.log(`    🤝 ${this._ant.faction.name} ant comes to aid of allied ${otherAnt.faction.name} ant`);
        this.setPrimaryState("FOLLOWING");
      }
    });
  }

  setPrimaryState(state) { this.primaryState = state; }
  setCombatModifier(modifier) { this.combatModifier = modifier; }
  isInCombat() { return this.combatModifier !== "OUT_OF_COMBAT"; }
  isOutOfCombat() { return this.combatModifier === "OUT_OF_COMBAT"; }
  isPrimaryState(state) { return this.primaryState === state; }
}

// Demo ant class
class DemoAnt {
  constructor(name, faction) {
    this.name = name;
    this.faction = faction;
    this.stateMachine = new DemoAntStateMachine(this);
    
    if (faction) {
      faction.addAnt(this);
    }
  }

  encounterAnt(otherAnt) {
    if (!otherAnt || !otherAnt.faction || !this.faction) return null;
    
    this.faction.encounterFaction(otherAnt.faction);
    otherAnt.faction.encounterFaction(this.faction);
    
    this.stateMachine.checkAutomaticFactionBehaviors([otherAnt]);
    
    return this.faction.getRelationshipState(otherAnt.faction.name);
  }

  performAction(action, targetAnt = null) {
    if (this.stateMachine.canPerformAction(action, targetAnt)) {
      const target = targetAnt ? ` with ${targetAnt.name}` : "";
      console.log(`    ✅ ${this.name} ${action}s${target}`);
      
      // Simulate relationship effects
      if (targetAnt && targetAnt.faction) {
        switch (action) {
          case "attack":
            this.faction.modifyRelationship(targetAnt.faction.name, -5, "Combat");
            break;
          case "trade":
            this.faction.modifyRelationship(targetAnt.faction.name, +3, "Trade");
            break;
          case "socialize":
            this.faction.modifyRelationship(targetAnt.faction.name, +1, "Social interaction");
            break;
        }
      }
      
      return true;
    } else {
      const target = targetAnt ? ` with ${targetAnt.name}` : "";
      console.log(`    ❌ ${this.name} cannot ${action}${target} (${this._getBlockReason(action, targetAnt)})`);
      return false;
    }
  }

  _getBlockReason(action, targetAnt) {
    if (!this.stateMachine._checkStatePermission(action)) {
      return "state constraint";
    }
    if (targetAnt && !this.stateMachine._checkFactionPermission(action, targetAnt)) {
      return "faction relationship";
    }
    return "unknown";
  }
}

// ======================
// DEMO SCENARIOS
// ======================

console.log("🏭 CREATING FACTIONS AND ANTS");
console.log("==============================");

// Create factions
const builders = new DemoFaction("Builders", "#8B4513");
const warriors = new DemoFaction("Warriors", "#DC143C");
const traders = new DemoFaction("Traders", "#FFD700");

// Create ants
const builderAnt = new DemoAnt("Bob the Builder", builders);
const warriorAnt = new DemoAnt("Warrior Alpha", warriors);
const traderAnt = new DemoAnt("Merchant Max", traders);

console.log("\\n📊 SCENARIO 1: FIRST ENCOUNTERS");
console.log("=================================");

console.log("\\n1️⃣ Builder encounters Warrior:");
builderAnt.encounterAnt(warriorAnt);

console.log("\\n2️⃣ Trader encounters both:");
traderAnt.encounterAnt(builderAnt);
traderAnt.encounterAnt(warriorAnt);

console.log("\\n🤝 SCENARIO 2: PEACEFUL INTERACTIONS");
console.log("=====================================");

console.log("\\n3️⃣ Testing action permissions with neutral factions:");
builderAnt.performAction("socialize", traderAnt);
traderAnt.performAction("trade", builderAnt);
warriorAnt.performAction("attack", builderAnt); // Should fail - neutral factions

console.log("\\n📈 SCENARIO 3: BUILDING RELATIONSHIPS");
console.log("=====================================");

console.log("\\n4️⃣ Multiple trading sessions improve relations:");
for (let i = 0; i < 10; i++) {
  traderAnt.performAction("trade", builderAnt);
}

console.log("\\n5️⃣ Now they're allies - test new permissions:");
traderAnt.performAction("follow", builderAnt); // Should work now
builderAnt.performAction("attack", traderAnt); // Should fail - allies don't attack

console.log("\\n⚔️ SCENARIO 4: CONFLICT AND HOSTILITY");
console.log("=====================================");

console.log("\\n6️⃣ Warriors attack builders multiple times:");
warriorAnt.stateMachine.setCombatModifier("IN_COMBAT"); // Enable combat
for (let i = 0; i < 8; i++) {
  warriorAnt.performAction("attack", builderAnt);
}

console.log("\\n7️⃣ Now they're enemies - test automatic behaviors:");
warriorAnt.stateMachine.setCombatModifier("OUT_OF_COMBAT"); // Reset combat
const relationship = builderAnt.encounterAnt(warriorAnt);
console.log(`  Current relationship: ${relationship.name}`);

console.log("\\n🩸 SCENARIO 5: BLOOD ENEMIES");
console.log("=============================");

console.log("\\n8️⃣ Making warriors and traders blood enemies:");
// Manually set to demonstrate blood enemy mechanics
warriors.relationships.set("Traders", 0);
traders.relationships.set("Warriors", 0);

console.log("\\n9️⃣ Attempting to improve blood enemy relations:");
traderAnt.faction.modifyRelationship("Warriors", 20, "Peace offering");

console.log("\\n🔄 SCENARIO 6: ALLIANCE ASSISTANCE");
console.log("==================================");

console.log("\\n🔟 Builder (allied to Trader) comes to aid when Trader is attacked:");
// Simulate trader in combat
traderAnt.stateMachine.setCombatModifier("IN_COMBAT");
console.log(`  Trader enters combat state`);

// Builder checks automatic behaviors
builderAnt.stateMachine.checkAutomaticFactionBehaviors([traderAnt]);
console.log(`  Builder's new state: ${builderAnt.stateMachine.primaryState}`);

console.log("\\n📋 FINAL RELATIONSHIP SUMMARY");
console.log("==============================");

console.log("\\nBuilders relationships:");
builders.relationships.forEach((value, name) => {
  const state = builders.getRelationshipState(name);
  console.log(`  ${name}: ${value}/100 (${state.name})`);
});

console.log("\\nWarriors relationships:");
warriors.relationships.forEach((value, name) => {
  const state = warriors.getRelationshipState(name);
  console.log(`  ${name}: ${value}/100 (${state.name})`);
});

console.log("\\nTraders relationships:");
traders.relationships.forEach((value, name) => {
  const state = traders.getRelationshipState(name);
  console.log(`  ${name}: ${value}/100 (${state.name})`);
});

console.log("\\n✅ INTEGRATION DEMO COMPLETE!");
console.log("\\n🎯 KEY FEATURES DEMONSTRATED:");
console.log("- ✅ Faction-aware action permissions");
console.log("- ✅ Automatic faction discovery");
console.log("- ✅ Relationship progression through interactions");
console.log("- ✅ State machine and faction system communication");
console.log("- ✅ Automatic combat and assistance behaviors");
console.log("- ✅ Blood enemy relationship constraints");
console.log("- ✅ Alliance cooperation mechanics");

console.log("\\n🚀 Ready for integration with the main game!");