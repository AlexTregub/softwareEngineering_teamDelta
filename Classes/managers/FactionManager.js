/**
 * FactionManager.js
 * Centralized faction system management for the ant game
 * Handles faction relationships, discoveries, diplomacy, and territorial interactions
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

/**
 * Faction relationship tiers and their numeric values
 */
const RELATIONSHIP_TIERS = {
  BLOOD_ENEMY: -10,  // Permanent enemies, cannot be changed
  ENEMY: -3,         // Attack on sight within detection range
  NEUTRAL: 0,        // Cautious, will attack if encroached upon too long
  ALLIED: 3          // Will not attack, may assist, share resources
};

/**
 * Actions that can affect faction relationships
 */
const RELATIONSHIP_ACTIONS = {
  // Positive actions
  GIFT_RESOURCES: { min: 0.1, max: 0.5, requiresAllied: false },
  GIFT_ANTS: { min: 0.3, max: 1.0, requiresAllied: false },
  DEFENSIVE_ASSISTANCE: { min: 0.2, max: 0.8, requiresAllied: true },
  TRADE_AGREEMENT: { min: 0.5, max: 1.5, requiresAllied: false },
  
  // Negative actions
  ATTACK_ANT: { min: -0.2, max: -0.8, fromCombat: true },
  ATTACK_QUEEN: { min: -5.0, max: -10.0, special: 'BLOOD_ENEMY' },
  TERRITORIAL_ENCROACHMENT: { min: -0.1, max: -0.3, overtime: true },
  RESOURCE_THEFT: { min: -0.3, max: -1.0, fromCombat: false },
  BETRAY_ALLIANCE: { min: -2.0, max: -4.0, fromAllied: true }
};

/**
 * Main faction management class
 */
class FactionManager {
  constructor() {
    // Core data structures
    this.factions = new Map(); // faction_id -> FactionData
    this.relationships = new Map(); // "faction1_faction2" -> relationship_value
    this.discoveries = new Map(); // "faction1_faction2" -> discovered_boolean
    this.playerFaction = null;
    this.nextFactionId = 1;
    
    // Event tracking
    this.relationshipHistory = [];
    this.territorialEncroachments = new Map(); // "faction1_faction2" -> { startTime, duration }
    
    // Configuration
    this.encroachmentThreshold = 10000; // 10 seconds in territory before hostility
    this.maxRelationshipChange = 2.0; // Maximum change per action
    
    console.log('🏴 FactionManager initialized');
  }
  
  // ===== FACTION MANAGEMENT =====
  
  /**
   * Create a new faction
   * @param {string} name - Faction display name
   * @param {Object} color - RGB color object {r, g, b}
   * @param {string} type - 'player', 'ai', 'neutral'
   * @param {Object} position - Starting position {x, y}
   * @returns {string} Faction ID
   */
  createFaction(name, color = {r: 128, g: 128, b: 128}, type = 'ai', position = {x: 400, y: 400}) {
    const factionId = `faction_${this.nextFactionId++}`;
    
    const factionData = {
      id: factionId,
      name: name,
      color: color,
      type: type, // 'player', 'ai', 'neutral'
      position: position,
      territory: {
        center: position,
        radius: 150 // Base territory radius
      },
      resources: {
        food: 100,
        materials: 50,
        population: 0
      },
      discovered: new Set(), // Other factions this one has discovered
      queens: [],
      createdAt: Date.now()
    };
    
    this.factions.set(factionId, factionData);
    
    // Set player faction if this is the first player-type faction
    if (type === 'player' && !this.playerFaction) {
      this.playerFaction = factionId;
    }
    
    console.log(`🏴 Created faction: ${name} (${factionId})`);
    return factionId;
  }
  
  /**
   * Get faction data by ID
   * @param {string} factionId - Faction identifier
   * @returns {Object|null} Faction data or null if not found
   */
  getFaction(factionId) {
    return this.factions.get(factionId) || null;
  }
  
  /**
   * Get all factions
   * @returns {Array} Array of faction data objects
   */
  getAllFactions() {
    return Array.from(this.factions.values());
  }
  
  /**
   * Update faction resources
   * @param {string} factionId - Faction identifier
   * @param {Object} resourceDelta - Changes to resources {food, materials, population}
   */
  updateFactionResources(factionId, resourceDelta) {
    const faction = this.getFaction(factionId);
    if (!faction) return false;
    
    Object.keys(resourceDelta).forEach(resource => {
      if (faction.resources[resource] !== undefined) {
        faction.resources[resource] = Math.max(0, faction.resources[resource] + resourceDelta[resource]);
      }
    });
    
    return true;
  }
  
  // ===== RELATIONSHIP MANAGEMENT =====
  
  /**
   * Get relationship value between two factions
   * @param {string} faction1 - First faction ID
   * @param {string} faction2 - Second faction ID
   * @returns {number} Relationship value (-10 to 3)
   */
  getRelationship(faction1, faction2) {
    if (faction1 === faction2) return RELATIONSHIP_TIERS.ALLIED; // Same faction
    
    const key = this._getRelationshipKey(faction1, faction2);
    return this.relationships.get(key) || RELATIONSHIP_TIERS.NEUTRAL;
  }
  
  /**
   * Set relationship between two factions
   * @param {string} faction1 - First faction ID
   * @param {string} faction2 - Second faction ID
   * @param {number} value - Relationship value
   * @param {string} reason - Reason for change (for history)
   */
  setRelationship(faction1, faction2, value, reason = 'manual') {
    if (faction1 === faction2) return; // Can't set relationship with self
    
    const key = this._getRelationshipKey(faction1, faction2);
    const oldValue = this.getRelationship(faction1, faction2);
    
    // Clamp value to valid range
    const newValue = Math.max(RELATIONSHIP_TIERS.BLOOD_ENEMY, Math.min(RELATIONSHIP_TIERS.ALLIED, value));
    
    this.relationships.set(key, newValue);
    
    // Log relationship change
    this.relationshipHistory.push({
      timestamp: Date.now(),
      faction1: faction1,
      faction2: faction2,
      oldValue: oldValue,
      newValue: newValue,
      reason: reason
    });
    
    console.log(`🏴 Relationship changed: ${this.getFactionName(faction1)} ↔ ${this.getFactionName(faction2)} = ${newValue} (${reason})`);
  }
  
  /**
   * Get relationship tier name
   * @param {string} faction1 - First faction ID
   * @param {string} faction2 - Second faction ID
   * @returns {string} Relationship tier name
   */
  getRelationshipTier(faction1, faction2) {
    const value = this.getRelationship(faction1, faction2);
    
    if (value <= RELATIONSHIP_TIERS.BLOOD_ENEMY) return 'BLOOD_ENEMY';
    if (value <= RELATIONSHIP_TIERS.ENEMY) return 'ENEMY';
    if (value <= RELATIONSHIP_TIERS.NEUTRAL) return 'NEUTRAL';
    return 'ALLIED';
  }
  
  /**
   * Check if relationship can be changed (BloodEnemies are permanent)
   * @param {string} faction1 - First faction ID
   * @param {string} faction2 - Second faction ID
   * @returns {boolean} True if relationship can be modified
   */
  canRelationshipChange(faction1, faction2) {
    const tier = this.getRelationshipTier(faction1, faction2);
    return tier !== 'BLOOD_ENEMY';
  }
  
  /**
   * Modify relationship based on an action
   * @param {string} actorFaction - Faction performing the action
   * @param {string} targetFaction - Faction receiving the action
   * @param {string} actionType - Type of action (from RELATIONSHIP_ACTIONS)
   * @param {Object} actionData - Additional data about the action
   */
  handleRelationshipAction(actorFaction, targetFaction, actionType, actionData = {}) {
    if (!this.canRelationshipChange(actorFaction, targetFaction)) {
      console.log(`🏴 Cannot change relationship: ${this.getFactionName(actorFaction)} ↔ ${this.getFactionName(targetFaction)} (BloodEnemies)`);
      return;
    }
    
    const action = RELATIONSHIP_ACTIONS[actionType];
    if (!action) {
      console.warn(`🏴 Unknown relationship action: ${actionType}`);
      return;
    }
    
    // Check if action is valid for current relationship
    const currentTier = this.getRelationshipTier(actorFaction, targetFaction);
    if (action.requiresAllied && currentTier !== 'ALLIED') {
      console.log(`🏴 Action ${actionType} requires ALLIED status`);
      return;
    }
    
    // Calculate relationship change
    let change = action.min + Math.random() * (action.max - action.min);
    
    // Apply intensity modifier if provided
    if (actionData.intensity) {
      change *= actionData.intensity;
    }
    
    // Clamp to maximum change
    change = Math.max(-this.maxRelationshipChange, Math.min(this.maxRelationshipChange, change));
    
    // Special handling for queen attacks
    if (action.special === 'BLOOD_ENEMY' && actionData.inOwnTerritory) {
      this.setRelationship(actorFaction, targetFaction, RELATIONSHIP_TIERS.BLOOD_ENEMY, `Queen attack in ${this.getFactionName(targetFaction)} territory`);
      return;
    }
    
    // Apply relationship change
    const currentValue = this.getRelationship(actorFaction, targetFaction);
    const newValue = currentValue + change;
    
    this.setRelationship(actorFaction, targetFaction, newValue, `${actionType} (${change > 0 ? '+' : ''}${change.toFixed(2)})`);
  }
  
  // ===== DISCOVERY SYSTEM =====
  
  /**
   * Mark one faction as discovered by another
   * @param {string} discovererFaction - Faction doing the discovering
   * @param {string} discoveredFaction - Faction being discovered
   */
  discoverFaction(discovererFaction, discoveredFaction) {
    if (discovererFaction === discoveredFaction) return;
    
    const discoverer = this.getFaction(discovererFaction);
    if (!discoverer) return;
    
    if (!discoverer.discovered.has(discoveredFaction)) {
      discoverer.discovered.add(discoveredFaction);
      
      const key = this._getDiscoveryKey(discovererFaction, discoveredFaction);
      this.discoveries.set(key, true);
      
      console.log(`🏴 ${this.getFactionName(discovererFaction)} discovered ${this.getFactionName(discoveredFaction)}`);
      
      // Mutual discovery for now (could be asymmetric later)
      const discovered = this.getFaction(discoveredFaction);
      if (discovered && !discovered.discovered.has(discovererFaction)) {
        discovered.discovered.add(discovererFaction);
        const mutualKey = this._getDiscoveryKey(discoveredFaction, discovererFaction);
        this.discoveries.set(mutualKey, true);
      }
    }
  }
  
  /**
   * Check if one faction has discovered another
   * @param {string} faction1 - First faction ID
   * @param {string} faction2 - Second faction ID
   * @returns {boolean} True if faction1 has discovered faction2
   */
  hasDiscovered(faction1, faction2) {
    const key = this._getDiscoveryKey(faction1, faction2);
    return this.discoveries.get(key) || false;
  }
  
  /**
   * Get all factions known to a specific faction
   * @param {string} factionId - Faction identifier
   * @returns {Array} Array of known faction IDs
   */
  getKnownFactions(factionId) {
    const faction = this.getFaction(factionId);
    if (!faction) return [];
    
    return Array.from(faction.discovered);
  }
  
  // ===== TERRITORIAL SYSTEM =====
  
  /**
   * Check if a position is within a faction's territory
   * @param {string} factionId - Faction identifier
   * @param {Object} position - Position to check {x, y}
   * @returns {boolean} True if position is in faction territory
   */
  isInTerritory(factionId, position) {
    const faction = this.getFaction(factionId);
    if (!faction) return false;
    
    const dx = position.x - faction.territory.center.x;
    const dy = position.y - faction.territory.center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= faction.territory.radius;
  }
  
  /**
   * Handle territorial encroachment
   * @param {string} encroachingFaction - Faction entering territory
   * @param {string} territoryOwner - Faction owning the territory
   * @param {Object} position - Position of encroachment
   */
  handleTerritorialEncroachment(encroachingFaction, territoryOwner, position) {
    if (encroachingFaction === territoryOwner) return;
    
    const encroachmentKey = `${encroachingFaction}_${territoryOwner}`;
    const now = Date.now();
    
    if (!this.territorialEncroachments.has(encroachmentKey)) {
      // Start tracking encroachment
      this.territorialEncroachments.set(encroachmentKey, {
        startTime: now,
        position: position,
        warned: false
      });
    } else {
      // Update existing encroachment
      const encroachment = this.territorialEncroachments.get(encroachmentKey);
      const duration = now - encroachment.startTime;
      
      // Trigger hostility after threshold
      if (duration > this.encroachmentThreshold && !encroachment.warned) {
        this.handleRelationshipAction(encroachingFaction, territoryOwner, 'TERRITORIAL_ENCROACHMENT', {
          duration: duration,
          intensity: Math.min(2.0, duration / this.encroachmentThreshold)
        });
        encroachment.warned = true;
      }
    }
  }
  
  /**
   * Clear territorial encroachment (when faction leaves territory)
   * @param {string} encroachingFaction - Faction that was encroaching
   * @param {string} territoryOwner - Faction owning the territory
   */
  clearTerritorialEncroachment(encroachingFaction, territoryOwner) {
    const encroachmentKey = `${encroachingFaction}_${territoryOwner}`;
    this.territorialEncroachments.delete(encroachmentKey);
  }
  
  // ===== DIPLOMATIC INTERFACE =====
  
  /**
   * Get diplomatic status for player UI
   * @param {string} playerFactionId - Player's faction ID
   * @returns {Object} Diplomatic status data
   */
  getDiplomaticStatus(playerFactionId = this.playerFaction) {
    if (!playerFactionId) return null;
    
    const playerFaction = this.getFaction(playerFactionId);
    if (!playerFaction) return null;
    
    const knownFactions = this.getKnownFactions(playerFactionId);
    const diplomaticStatus = {
      playerFaction: playerFaction,
      knownFactions: [],
      totalFactions: this.factions.size,
      discoveredCount: knownFactions.length
    };
    
    knownFactions.forEach(factionId => {
      const faction = this.getFaction(factionId);
      if (faction) {
        diplomaticStatus.knownFactions.push({
          faction: faction,
          relationship: this.getRelationship(playerFactionId, factionId),
          relationshipTier: this.getRelationshipTier(playerFactionId, factionId),
          canChangeRelationship: this.canRelationshipChange(playerFactionId, factionId),
          inTerritory: this.isInTerritory(factionId, playerFaction.position)
        });
      }
    });
    
    return diplomaticStatus;
  }
  
  // ===== UTILITY METHODS =====
  
  /**
   * Get faction name by ID
   * @param {string} factionId - Faction identifier
   * @returns {string} Faction name or ID if not found
   */
  getFactionName(factionId) {
    const faction = this.getFaction(factionId);
    return faction ? faction.name : factionId;
  }
  
  /**
   * Generate relationship key for consistent storage
   * @param {string} faction1 - First faction ID
   * @param {string} faction2 - Second faction ID
   * @returns {string} Relationship key
   */
  _getRelationshipKey(faction1, faction2) {
    return faction1 < faction2 ? `${faction1}_${faction2}` : `${faction2}_${faction1}`;
  }
  
  /**
   * Generate discovery key for consistent storage
   * @param {string} discoverer - Discovering faction ID
   * @param {string} discovered - Discovered faction ID
   * @returns {string} Discovery key
   */
  _getDiscoveryKey(discoverer, discovered) {
    return `${discoverer}_discovers_${discovered}`;
  }
  
  /**
   * Get relationship history for debugging/UI
   * @param {number} limit - Maximum number of entries to return
   * @returns {Array} Recent relationship changes
   */
  getRelationshipHistory(limit = 50) {
    return this.relationshipHistory
      .slice(-limit)
      .map(entry => ({
        ...entry,
        faction1Name: this.getFactionName(entry.faction1),
        faction2Name: this.getFactionName(entry.faction2),
        timeAgo: Date.now() - entry.timestamp
      }));
  }
  
  /**
   * Get debug information about the faction system
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      totalFactions: this.factions.size,
      totalRelationships: this.relationships.size,
      totalDiscoveries: this.discoveries.size,
      playerFaction: this.playerFaction,
      activeEncroachments: this.territorialEncroachments.size,
      recentHistoryCount: this.relationshipHistory.length
    };
  }
}

// Create global instance
let g_factionManager = null;

/**
 * Initialize the faction manager system
 */
function initializeFactionManager() {
  g_factionManager = new FactionManager();
  console.log('🏴 Global FactionManager initialized');
  return g_factionManager;
}

/**
 * Get the global faction manager instance
 * @returns {FactionManager|null} Global faction manager
 */
function getFactionManager() {
  return g_factionManager;
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    FactionManager, 
    RELATIONSHIP_TIERS, 
    RELATIONSHIP_ACTIONS,
    initializeFactionManager,
    getFactionManager
  };
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.FactionManager = FactionManager;
  window.RELATIONSHIP_TIERS = RELATIONSHIP_TIERS;
  window.RELATIONSHIP_ACTIONS = RELATIONSHIP_ACTIONS;
  window.initializeFactionManager = initializeFactionManager;
  window.getFactionManager = getFactionManager;
}