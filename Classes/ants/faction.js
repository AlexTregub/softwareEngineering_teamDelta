// faction.js - Faction System Implementation
// Manages relationships between different ant factions and their interactions

// Relationship state enum
const RELATIONSHIP_STATES = {
  ALLIED: { name: "ALLIED", min: 80, max: 100, attackOnSight: false },
  NEUTRAL: { name: "NEUTRAL", min: 20, max: 79, attackOnSight: false },
  ENEMIES: { name: "ENEMIES", min: 1, max: 19, attackOnSight: true },
  BLOOD_ENEMIES: { name: "BLOOD_ENEMIES", min: 0, max: 0, attackOnSight: true }
};

// Master faction registry
class FactionRegistry {
  constructor() {
    this.factions = new Map(); // name -> Faction object
  }

  registerFaction(faction) {
    this.factions.set(faction.name, faction);
    console.log(`Faction '${faction.name}' registered (Total: ${this.factions.size})`);
  }

  unregisterFaction(name) {
    if (this.factions.delete(name)) {
      console.log(`Faction '${name}' unregistered`);
    }
  }

  getFaction(name) {
    return this.factions.get(name);
  }

  getAllFactions() {
    return Array.from(this.factions.values());
  }

  getFactionNames() {
    return Array.from(this.factions.keys());
  }

  getFactionCount() {
    return this.factions.size;
  }

  printDebugInfo() {
    console.log("=== FACTION REGISTRY ===");
    console.log(`Total Factions: ${this.factions.size}`);
    this.factions.forEach((faction, name) => {
      console.log(`  ${name}: ${faction.getAntCount()} ants, ${faction.getKnownFactionCount()} relationships`);
    });
  }
}

// Faction class
class Faction {
  constructor(name, color = "#FFFFFF") {
    this.name = name;
    this.color = color;
    this.relationships = new Map(); // factionName -> relationship value (0-100)
    this.ants = new Set(); // Track ants in this faction
    this.lastContact = new Map(); // factionName -> timestamp of last interaction
    
    // Register this faction in the global registry
    if (typeof globalFactionRegistry !== 'undefined') {
      globalFactionRegistry.registerFaction(this);
    }
  }

  // Ant management
  addAnt(ant) {
    this.ants.add(ant);
    console.log(`${ant.constructor.name} joined ${this.name} faction (${this.ants.size} total)`);
  }

  removeAnt(ant) {
    this.ants.delete(ant);
    console.log(`${ant.constructor.name} left ${this.name} faction (${this.ants.size} remaining)`);
  }

  getAntCount() {
    return this.ants.size;
  }

  getAllAnts() {
    return Array.from(this.ants);
  }

  // Relationship management
  encounterFaction(otherFaction) {
    if (otherFaction === this) return;
    
    // First encounter - establish neutral relationship
    if (!this.relationships.has(otherFaction.name)) {
      this.relationships.set(otherFaction.name, 50); // Neutral starting point
      console.log(`${this.name} discovers ${otherFaction.name} faction`);
    }
    
    // Update last contact time
    this.lastContact.set(otherFaction.name, Date.now());
  }

  getRelationshipValue(factionName) {
    return this.relationships.has(factionName) ? this.relationships.get(factionName) : 50; // Default neutral
  }

  getRelationshipState(factionName, customValue = null) {
    const value = customValue || this.getRelationshipValue(factionName);
    
    // Check in specific order to handle overlapping ranges correctly
    if (value === 0) return RELATIONSHIP_STATES.BLOOD_ENEMIES;
    if (value >= 1 && value <= 19) return RELATIONSHIP_STATES.ENEMIES;
    if (value >= 20 && value <= 79) return RELATIONSHIP_STATES.NEUTRAL;
    if (value >= 80 && value <= 100) return RELATIONSHIP_STATES.ALLIED;
    
    // Debug output for unexpected values
    console.warn(`Unexpected relationship value: ${value} for ${factionName}`);
    return RELATIONSHIP_STATES.NEUTRAL; // Default fallback
  }

  modifyRelationship(factionName, change, reason = "Unknown") {
    const current = this.getRelationshipValue(factionName);
    const newValue = Math.max(0, Math.min(100, current + change));
    
    // Blood enemies cannot improve relations
    if (current === 0 && change > 0) {
      console.log(`${this.name} -> ${factionName}: Blood enemies cannot improve relations`);
      return;
    }
    
    this.relationships.set(factionName, newValue);
    
    const oldState = this.getRelationshipState(factionName, current);
    const newState = this.getRelationshipState(factionName);
    
    if (oldState.name !== newState.name) {
      console.log(`${this.name} -> ${factionName}: ${oldState.name} -> ${newState.name} (${reason})`);
      this.onRelationshipChange(factionName, oldState, newState, reason);
    }
  }

  onRelationshipChange(factionName, oldState, newState, reason) {
    // Notify all ants in faction of relationship change
    this.ants.forEach(ant => {
      if (ant.onFactionRelationshipChange) {
        ant.onFactionRelationshipChange(factionName, oldState, newState, reason);
      }
    });
  }

  // Change faction name (with validation)
  changeName(newName) {
    if (!newName || typeof newName !== 'string' || !/^[a-zA-Z]+$/.test(newName)) {
      console.warn(`Invalid faction name: ${newName}. Must be alphabetic characters only.`);
      return false;
    }
    
    const oldName = this.name;
    this.name = newName;
    console.log(`Faction renamed from '${oldName}' to '${newName}'`);
    
    // Update registry if it exists
    if (typeof globalFactionRegistry !== 'undefined') {
      globalFactionRegistry.unregisterFaction(oldName);
      globalFactionRegistry.registerFaction(this);
    }
    
    return true;
  }

  // Change faction color
  changeColor(newColor) {
    this.color = newColor;
    console.log(`${this.name} faction color changed to ${newColor}`);
    
    // Apply color to all ants in faction
    this.ants.forEach(ant => {
      if (ant.applyFactionColor) {
        ant.applyFactionColor(newColor);
      }
    });
  }

  // Debug and info methods
  getKnownFactionCount() {
    return this.relationships.size;
  }

  getAllRelationships() {
    const relationships = {};
    this.relationships.forEach((value, name) => {
      relationships[name] = {
        value: value,
        state: this.getRelationshipState(name).name,
        lastContact: this.lastContact.get(name) || null
      };
    });
    return relationships;
  }

  printRelationships() {
    console.log(`=== ${this.name} FACTION RELATIONSHIPS ===`);
    if (this.relationships.size === 0) {
      console.log("  No known factions");
      return;
    }
    
    this.relationships.forEach((value, name) => {
      const state = this.getRelationshipState(name);
      const lastContact = this.lastContact.get(name);
      const timeAgo = lastContact ? new Date(Date.now() - lastContact).toISOString().substr(14, 8) : "Never";
      console.log(`  ${name}: ${value}/100 (${state.name}) - Last contact: ${timeAgo} ago`);
    });
  }
}

// Utility functions
function createFaction(name, color = "#FFFFFF") {
  return new Faction(name, color);
}

function getFactionRegistry() {
  return globalFactionRegistry;
}

// Get player faction info for external use
function getPlayerFactionInfo() {
  return {
    name: playerFactionName,
    color: playerFactionColor
  };
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    Faction,
    FactionRegistry,
    RELATIONSHIP_STATES,
    createFaction,
    getFactionRegistry,
    globalFactionRegistry
  };
}

// Global faction registry instance - initialized after all class definitions
let globalFactionRegistry = new FactionRegistry();