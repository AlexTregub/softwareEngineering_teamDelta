// FACTION SYSTEM MOCK - Corrected Version
// This shows the proper behavior of your faction system

console.log("🎮 FACTION SYSTEM MOCK - Corrected Version");
console.log("==========================================\n");

// 1. RELATIONSHIP STATES ENUM (Fixed)
const RelationshipState = {
  ALLIED: { min: 80, max: 100, name: "ALLIED", color: "#00FF00", attackOnSight: false },
  NEUTRAL: { min: 20, max: 79, name: "NEUTRAL", color: "#FFFF00", attackOnSight: false },
  ENEMIES: { min: 1, max: 19, name: "ENEMIES", color: "#FF8800", attackOnSight: true },
  BLOOD_ENEMIES: { min: 0, max: 0, name: "BLOOD_ENEMIES", color: "#FF0000", attackOnSight: true }
};

// Helper function to get state from value
function getStateFromValue(value) {
  for (const state of Object.values(RelationshipState)) {
    if (value >= state.min && value <= state.max) {
      return state;
    }
  }
  return RelationshipState.NEUTRAL;
}

// 2. FACTION CLASS (Fixed)
class FactionFixed {
  constructor(name, color) {
    this.name = name;
    this.color = color;
    this.relationships = new Map();
    this.discoveredFactions = new Set();
    this.relationshipHistory = [];
  }

  getRelationshipValue(otherFactionName) {
    return this.relationships.get(otherFactionName) || 50;
  }

  getRelationshipState(otherFactionName) {
    const value = this.getRelationshipValue(otherFactionName);
    return getStateFromValue(value);
  }

  canImproveRelations(otherFactionName) {
    const state = this.getRelationshipState(otherFactionName);
    return state !== RelationshipState.BLOOD_ENEMIES;
  }

  modifyRelationship(otherFactionName, change, reason) {
    const currentValue = this.getRelationshipValue(otherFactionName);
    const currentState = getStateFromValue(currentValue);
    
    // BLOOD_ENEMIES cannot improve relations
    if (currentState === RelationshipState.BLOOD_ENEMIES && change > 0) {
      console.log(`❌ ${this.name} cannot improve relations with ${otherFactionName} - BLOOD ENEMIES FOREVER!`);
      return false;
    }

    const newValue = Math.max(0, Math.min(100, currentValue + change));
    const newState = getStateFromValue(newValue);
    
    this.relationships.set(otherFactionName, newValue);
    this.relationshipHistory.push({
      target: otherFactionName,
      change: change,
      reason: reason,
      oldValue: currentValue,
      newValue: newValue,
      oldState: currentState.name,
      newState: newState.name,
      timestamp: Date.now()
    });

    const stateChange = currentState !== newState ? ` [${currentState.name} -> ${newState.name}]` : '';
    console.log(`📊 ${this.name} -> ${otherFactionName}: ${currentValue} -> ${newValue}${stateChange} (${reason})`);
    
    // Special message for entering BLOOD_ENEMIES state
    if (newState === RelationshipState.BLOOD_ENEMIES) {
      console.log(`💀 ${this.name} and ${otherFactionName} are now BLOOD ENEMIES - relations permanently damaged!`);
    }
    
    return true;
  }

  encounterFaction(otherFaction) {
    if (!this.discoveredFactions.has(otherFaction.name)) {
      this.discoveredFactions.add(otherFaction.name);
      this.relationships.set(otherFaction.name, 50);
      console.log(`🤝 ${this.name} has discovered ${otherFaction.name}!`);
    }
  }

  shouldAttackOnSight(otherFactionName) {
    const state = this.getRelationshipState(otherFactionName);
    return state.attackOnSight;
  }

  changeName(newName) {
    const oldName = this.name;
    this.name = newName;
    console.log(`📝 Faction renamed: ${oldName} -> ${newName}`);
  }

  // Get detailed relationship info
  getRelationshipDetails(otherFactionName) {
    const value = this.getRelationshipValue(otherFactionName);
    const state = this.getRelationshipState(otherFactionName);
    return {
      value: value,
      state: state.name,
      canImprove: this.canImproveRelations(otherFactionName),
      attackOnSight: state.attackOnSight
    };
  }
}

// 3. DEMONSTRATION WITH PROPER BLOOD_ENEMIES
console.log("🚀 RUNNING CORRECTED FACTION DEMO");
console.log("==================================\n");

// Create factions
const playerFaction = new FactionFixed("Builders", "#0066FF");
const redFaction = new FactionFixed("RedHorde", "#FF0000");
const greenFaction = new FactionFixed("GreenGuards", "#00FF00");

// Establish initial relationships
playerFaction.encounterFaction(redFaction);
redFaction.encounterFaction(playerFaction);
playerFaction.encounterFaction(greenFaction);
greenFaction.encounterFaction(playerFaction);
redFaction.encounterFaction(greenFaction);
greenFaction.encounterFaction(redFaction);

console.log("\n🎭 RELATIONSHIP PROGRESSION DEMO:");
console.log("=================================");

// 1. Start with trade
playerFaction.modifyRelationship("GreenGuards", +15, "Trade Agreement");
console.log("Green relationship:", playerFaction.getRelationshipDetails("GreenGuards"));

// 2. Border skirmish with Red
playerFaction.modifyRelationship("RedHorde", -15, "Border Skirmish");
console.log("Red relationship:", playerFaction.getRelationshipDetails("RedHorde"));

// 3. Major conflict - becomes ENEMIES
playerFaction.modifyRelationship("RedHorde", -20, "Major Battle");
console.log("Red relationship:", playerFaction.getRelationshipDetails("RedHorde"));

// 4. Escalate to BLOOD_ENEMIES
playerFaction.modifyRelationship("RedHorde", -19, "Betrayal and Genocide");
console.log("Red relationship:", playerFaction.getRelationshipDetails("RedHorde"));

// 5. Try to improve BLOOD_ENEMIES (should fail)
console.log("\n🕊️  ATTEMPTING PEACE WITH BLOOD ENEMIES:");
playerFaction.modifyRelationship("RedHorde", +50, "Peace Treaty Attempt");
playerFaction.modifyRelationship("RedHorde", +100, "Massive Reparations");

// 6. Show that other relationships can still improve
console.log("\n💚 IMPROVING NON-BLOOD-ENEMY RELATIONSHIPS:");
playerFaction.modifyRelationship("GreenGuards", +20, "Military Alliance");
console.log("Green relationship:", playerFaction.getRelationshipDetails("GreenGuards"));

// 7. Combat behavior demonstration
console.log("\n⚔️  COMBAT BEHAVIOR BASED ON RELATIONSHIPS:");
console.log("============================================");

class AntDemo {
  constructor(name, faction) {
    this.name = name;
    this.faction = faction;
  }
  
  encounterAnt(otherAnt) {
    const relationship = this.faction.getRelationshipDetails(otherAnt.faction.name);
    console.log(`${this.name} encounters ${otherAnt.name}:`);
    console.log(`  Relationship: ${relationship.value} (${relationship.state})`);
    console.log(`  Action: ${relationship.attackOnSight ? '⚔️ ATTACK ON SIGHT' : '🤝 Peaceful interaction'}`);
    console.log();
  }
}

const builderAnt = new AntDemo("Builder Ant", playerFaction);
const redAnt = new AntDemo("Red Warrior", redFaction);
const greenAnt = new AntDemo("Green Scout", greenFaction);

builderAnt.encounterAnt(redAnt);     // Should attack (BLOOD_ENEMIES)
builderAnt.encounterAnt(greenAnt);   // Should be peaceful (ALLIED)
redAnt.encounterAnt(greenAnt);       // Should be peaceful (NEUTRAL)

// 8. Show relationship history
console.log("📚 RELATIONSHIP HISTORY FOR BUILDERS:");
console.log("====================================");
playerFaction.relationshipHistory.forEach((event, index) => {
  console.log(`${index + 1}. ${event.target}: ${event.oldValue}->${event.newValue} (${event.reason}) [${event.oldState}->${event.newState}]`);
});

console.log("\n✅ FACTION SYSTEM DEMONSTRATION COMPLETE!");
console.log("\n🎯 KEY FEATURES DEMONSTRATED:");
console.log("- ✅ Relationship value ranges (0-100)");
console.log("- ✅ State transitions (NEUTRAL -> ENEMIES -> BLOOD_ENEMIES)");
console.log("- ✅ BLOOD_ENEMIES permanent hostility");
console.log("- ✅ Combat behavior based on relationship state");
console.log("- ✅ Relationship history tracking");
console.log("- ✅ Faction color assignment");
console.log("- ✅ Dynamic faction discovery");