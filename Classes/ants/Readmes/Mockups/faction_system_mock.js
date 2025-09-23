// FACTION SYSTEM MOCK - Design Preview
// This shows how your faction system would work before implementation

console.log("🎮 FACTION SYSTEM MOCK - Design Preview");
console.log("=====================================\n");

// 1. RELATIONSHIP STATES ENUM
const RelationshipState = {
  ALLIED: { min: 80, max: 100, name: "ALLIED", color: "#00FF00" },
  NEUTRAL: { min: 20, max: 79, name: "NEUTRAL", color: "#FFFF00" },
  ENEMIES: { min: 1, max: 19, name: "ENEMIES", color: "#FF8800" },
  BLOOD_ENEMIES: { min: 0, max: 0, name: "BLOOD_ENEMIES", color: "#FF0000" }
};

// 2. FACTION CLASS MOCK
class FactionMock {
  constructor(name, color) {
    this.name = name;
    this.color = color; // Hex color for shaders
    this.relationships = new Map(); // faction_name -> relationship_value
    this.discoveredFactions = new Set();
    this.relationshipHistory = [];
  }

  // Get current relationship value with another faction
  getRelationshipValue(otherFactionName) {
    return this.relationships.get(otherFactionName) || 50; // Default neutral
  }

  // Get relationship state based on value
  getRelationshipState(otherFactionName) {
    const value = this.getRelationshipValue(otherFactionName);
    for (const state of Object.values(RelationshipState)) {
      if (value >= state.min && value <= state.max) {
        return state;
      }
    }
    return RelationshipState.NEUTRAL; // Fallback
  }

  // Check if faction can improve relations (BLOOD_ENEMIES cannot)
  canImproveRelations(otherFactionName) {
    const state = this.getRelationshipState(otherFactionName);
    return state !== RelationshipState.BLOOD_ENEMIES;
  }

  // Modify relationship with another faction
  modifyRelationship(otherFactionName, change, reason) {
    if (!this.canImproveRelations(otherFactionName) && change > 0) {
      console.log(`❌ ${this.name} cannot improve relations with ${otherFactionName} - BLOOD ENEMIES!`);
      return false;
    }

    const currentValue = this.getRelationshipValue(otherFactionName);
    const newValue = Math.max(0, Math.min(100, currentValue + change));
    
    this.relationships.set(otherFactionName, newValue);
    this.relationshipHistory.push({
      target: otherFactionName,
      change: change,
      reason: reason,
      oldValue: currentValue,
      newValue: newValue,
      timestamp: Date.now()
    });

    console.log(`📊 ${this.name} -> ${otherFactionName}: ${currentValue} -> ${newValue} (${reason})`);
    return true;
  }

  // First contact with another faction
  encounterFaction(otherFaction) {
    if (!this.discoveredFactions.has(otherFaction.name)) {
      this.discoveredFactions.add(otherFaction.name);
      // Set initial neutral relationship
      this.relationships.set(otherFaction.name, 50);
      console.log(`🤝 ${this.name} has discovered ${otherFaction.name}!`);
    }
  }

  // Combat behavior based on relationship
  shouldAttackOnSight(otherFactionName) {
    const state = this.getRelationshipState(otherFactionName);
    return state === RelationshipState.ENEMIES || state === RelationshipState.BLOOD_ENEMIES;
  }

  // Change faction name (player can rename their faction)
  changeName(newName) {
    const oldName = this.name;
    this.name = newName;
    console.log(`📝 Faction renamed: ${oldName} -> ${newName}`);
  }
}

// 3. MASTER FACTION MANAGER MOCK
class FactionManagerMock {
  constructor() {
    this.allFactions = new Map(); // name -> faction
    this.playerFaction = null;
  }

  // Register new faction (validates a-zA-Z names)
  registerFaction(faction, isPlayer = false) {
    if (!/^[a-zA-Z]+$/.test(faction.name)) {
      console.log(`❌ Invalid faction name: ${faction.name} (only a-zA-Z allowed)`);
      return false;
    }

    if (this.allFactions.has(faction.name)) {
      console.log(`⚠️  Faction ${faction.name} already exists!`);
      return false;
    }

    this.allFactions.set(faction.name, faction);
    
    if (isPlayer) {
      this.playerFaction = faction;
      console.log(`👑 Player faction set: ${faction.name}`);
    }

    // Trigger first contact with all existing factions
    this.allFactions.forEach(existingFaction => {
      if (existingFaction !== faction) {
        faction.encounterFaction(existingFaction);
        existingFaction.encounterFaction(faction);
      }
    });

    console.log(`✅ Registered faction: ${faction.name} (Total: ${this.allFactions.size})`);
    return true;
  }

  // Get all faction names for debugging
  getAllFactionNames() {
    return Array.from(this.allFactions.keys());
  }

  // Debug: Print all relationships
  printAllRelationships() {
    console.log("\n🔍 ALL FACTION RELATIONSHIPS:");
    console.log("==============================");
    
    this.allFactions.forEach(faction => {
      console.log(`\n${faction.name} (${faction.color}):`);
      faction.relationships.forEach((value, targetName) => {
        const state = faction.getRelationshipState(targetName);
        console.log(`  -> ${targetName}: ${value} (${state.name})`);
      });
    });
  }
}

// 4. ANT WITH FACTION MOCK
class AntWithFactionMock {
  constructor(x, y, faction) {
    this.x = x;
    this.y = y;
    this.faction = faction; // Faction object reference
    this.id = Math.random().toString(36).substr(2, 9);
  }

  // Check relationship with another ant
  getRelationshipWith(otherAnt) {
    if (this.faction === otherAnt.faction) {
      return RelationshipState.ALLIED; // Same faction = allied
    }
    return this.faction.getRelationshipState(otherAnt.faction.name);
  }

  // Combat decision based on faction relationship
  shouldAttack(otherAnt) {
    const relationship = this.getRelationshipWith(otherAnt);
    return relationship === RelationshipState.ENEMIES || 
           relationship === RelationshipState.BLOOD_ENEMIES;
  }

  // Apply faction color shader (mock)
  applyFactionColor() {
    console.log(`🎨 Applying color shader ${this.faction.color} to ant ${this.id}`);
    // In real implementation: this.shader.setColor(this.faction.color);
  }
}

// 5. DEMONSTRATION OF THE SYSTEM
console.log("🚀 RUNNING FACTION SYSTEM DEMO");
console.log("===============================\n");

// Create faction manager
const factionManager = new FactionManagerMock();

// Create player faction (user named it "Builders" with blue color)
const playerFaction = new FactionMock("Builders", "#0066FF");
factionManager.registerFaction(playerFaction, true);

// Spawn some AI factions
const redFaction = new FactionMock("RedHorde", "#FF0000");
const greenFaction = new FactionMock("GreenGuards", "#00FF00");
const yellowFaction = new FactionMock("YellowWings", "#FFFF00");

factionManager.registerFaction(redFaction);
factionManager.registerFaction(greenFaction);
factionManager.registerFaction(yellowFaction);

console.log("\n📋 Current factions:", factionManager.getAllFactionNames());

// Simulate some interactions
console.log("\n🎭 SIMULATING FACTION INTERACTIONS:");
console.log("===================================");

// Trade agreement between player and green
playerFaction.modifyRelationship("GreenGuards", +15, "Trade Agreement");

// Border conflict between player and red
playerFaction.modifyRelationship("RedHorde", -30, "Border Conflict");

// Red attacks yellow - this makes them enemies
redFaction.modifyRelationship("YellowWings", -25, "Surprise Attack");
yellowFaction.modifyRelationship("RedHorde", -25, "Retaliation");

// Yellow attacks red again - now they're BLOOD ENEMIES
redFaction.modifyRelationship("YellowWings", -50, "Betrayal");
yellowFaction.modifyRelationship("RedHorde", -50, "Genocide");

// Try to improve BLOOD ENEMY relationship (should fail)
redFaction.modifyRelationship("YellowWings", +10, "Peace Offering");

// Print all relationships
factionManager.printAllRelationships();

// Test ant combat behavior
console.log("\n⚔️  ANT COMBAT BEHAVIOR TEST:");
console.log("=============================");

const builderAnt = new AntWithFactionMock(100, 100, playerFaction);
const redAnt = new AntWithFactionMock(120, 120, redFaction);
const greenAnt = new AntWithFactionMock(80, 80, greenFaction);
const yellowAnt = new AntWithFactionMock(110, 90, yellowFaction);

// Apply faction colors
builderAnt.applyFactionColor();
redAnt.applyFactionColor();

// Test combat decisions
console.log(`Builder ant vs Red ant: ${builderAnt.shouldAttack(redAnt) ? 'ATTACK' : 'PEACEFUL'}`);
console.log(`Builder ant vs Green ant: ${builderAnt.shouldAttack(greenAnt) ? 'ATTACK' : 'PEACEFUL'}`);
console.log(`Red ant vs Yellow ant: ${redAnt.shouldAttack(yellowAnt) ? 'ATTACK' : 'PEACEFUL'}`);

// Test faction renaming
console.log("\n📝 FACTION RENAMING TEST:");
console.log("=========================");
playerFaction.changeName("BlueBrotherhood");

console.log("\n✅ FACTION SYSTEM MOCK COMPLETE!");
console.log("This demonstrates:");
console.log("- Relationship states and values");
console.log("- Dynamic faction discovery");
console.log("- Relationship modification with reasons");
console.log("- BLOOD_ENEMIES permanent hostility");
console.log("- Combat behavior based on relationships");
console.log("- Color-based faction identification");
console.log("- Master faction registry");
console.log("- Player faction control");