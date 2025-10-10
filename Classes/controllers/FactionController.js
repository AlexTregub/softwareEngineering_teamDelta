/**
 * FactionController.js
 * Per-entity faction management controller
 * Integrates with the Entity/Controller architecture to provide faction-based behaviors
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

class FactionController {
  // PERFORMANCE: Global static cache to reduce controller lookups across ALL faction controllers
  static _globalFactionCache = new Map(); // entity -> factionId
  static _globalControllerCache = new Map(); // entity -> factionController
  static _globalCacheCleanupCounter = 0;
  constructor(entity) {
    this._entity = entity;
    this._factionId = entity.faction || entity._faction || 'neutral';
    this._homeTerritory = null;
    this._encroachmentTimers = new Map(); // other_faction -> { startTime, position }
    this._lastTerritoryCheck = 0;
    this._territoryCheckInterval = 1000; // Check every second
    this._discoveredFactions = new Set();
    this._lastDiscoveryCheck = 0;
    this._discoveryCheckInterval = 2000; // Check for new factions every 2 seconds
    this._discoveryRange = 120; // Range for discovering other factions
    
    // Behavioral modifiers based on faction relationships (NON-COMBAT)
    this._behaviorModifiers = {
      shareResources: false,        // Share resources with allies
      defendTerritory: true,        // Defend faction territory
      avoidNeutrals: false,        // Avoid neutral entities
      cooperateWithAllies: true,    // Work together with allied factions
      respectBorders: true         // Respect other faction territories
    };
    
    // PERFORMANCE: Cache for other entities' faction controllers
    this._controllerCache = new Map(); // entity -> factionController
    this._cacheCleanupCounter = 0;
    
    console.log(`🏴 FactionController initialized for entity (faction: ${this._factionId})`);
  }
  
  // ===== PUBLIC API =====
  
  /**
   * Update faction controller - call this in the entity's update loop
   */
  update() {
    const now = Date.now();
    
    // Periodic territory checks
    if (now - this._lastTerritoryCheck > this._territoryCheckInterval) {
      this._checkTerritorialStatus();
      this._lastTerritoryCheck = now;
    }
    
    // Periodic faction discovery
    if (now - this._lastDiscoveryCheck > this._discoveryCheckInterval) {
      this._checkForNewFactions();
      this._lastDiscoveryCheck = now;
    }
    
    // Update behavior modifiers based on current relationships
    this._updateBehaviorModifiers();
  }
  
  /**
   * Get the entity's faction ID
   * @returns {string} Faction identifier
   */
  getFactionId() {
    return this._factionId;
  }
  
  /**
   * Set the entity's faction
   * @param {string} factionId - New faction identifier
   */
  setFactionId(factionId) {
    const oldFaction = this._factionId;
    this._factionId = factionId;
    
    // Update entity's faction property (only _faction, not the getter-only faction property)
    if (this._entity._faction !== undefined) {
      this._entity._faction = factionId;
    }
    
    // Only try to set faction property if it has a setter (not getter-only)
    const factionDescriptor = Object.getOwnPropertyDescriptor(this._entity, 'faction') || 
                             Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this._entity), 'faction');
    
    if (factionDescriptor && factionDescriptor.set) {
      // Has a setter, safe to assign
      this._entity.faction = factionId;
    } else if (this._entity.faction !== undefined && typeof this._entity.faction !== 'function') {
      // It's a regular property (not a getter), safe to assign
      try {
        this._entity.faction = factionId;
      } catch (error) {
        // If it fails, just continue - we already set _faction
        console.warn(`🏴 Could not set faction property: ${error.message}`);
      }
    }
    
    console.log(`🏴 Entity faction changed: ${oldFaction} → ${factionId}`);
  }
  
  /**
   * Check if this entity's faction is hostile to another entity's faction
   * (Used by CombatController to determine combat eligibility)
   * @param {Object} otherEntity - Entity to check
   * @returns {boolean} True if factions are hostile to each other
   */
  areFactionsHostile(otherEntity) {
    const otherFaction = this._getEntityFaction(otherEntity);
    if (!otherFaction || otherFaction === this._factionId) return false;
    
    const factionManager = getFactionManager();
    if (!factionManager) return this._fallbackHostilityCheck(otherFaction);
    
    const relationshipTier = factionManager.getRelationshipTier(this._factionId, otherFaction);
    
    // Hostile relationships that could lead to combat
    return relationshipTier === 'ENEMY' || relationshipTier === 'BLOOD_ENEMY';
  }

  /**
   * Get the hostility level between factions (for combat intensity decisions)
   * @param {Object} otherEntity - Entity to check
   * @returns {string} Hostility level: 'BLOOD_ENEMY', 'ENEMY', 'NEUTRAL', 'ALLY', etc.
   */
  getHostilityLevel(otherEntity) {
    const otherFaction = this._getEntityFaction(otherEntity);
    if (!otherFaction) return 'NEUTRAL';
    if (otherFaction === this._factionId) return 'SAME_FACTION';
    
    const factionManager = getFactionManager();
    if (!factionManager) {
      // Simple fallback logic
      return (otherFaction === 'neutral' || this._factionId === 'neutral') ? 'NEUTRAL' : 'ENEMY';
    }
    
    return factionManager.getRelationshipTier(this._factionId, otherFaction);
  }
  
  /**
   * Check if can receive gifts from another faction
   * @param {string} fromFaction - Faction offering the gift
   * @returns {boolean} True if can receive gifts
   */
  canReceiveGifts(fromFaction) {
    if (fromFaction === this._factionId) return true; // Same faction
    
    const factionManager = getFactionManager();
    if (!factionManager) return false;
    
    const relationshipTier = factionManager.getRelationshipTier(this._factionId, fromFaction);
    
    // Can receive gifts from non-enemies
    return relationshipTier !== 'ENEMY' && relationshipTier !== 'BLOOD_ENEMY';
  }
  
  /**
   * Check if should assist another entity (non-combat decision)
   * This is about resource sharing, territory defense, etc. - not combat assistance
   * @param {Object} allyEntity - Potential ally to assist
   * @returns {boolean} True if should provide assistance
   */
  shouldAssistAlly(allyEntity) {
    const allyFaction = this._getEntityFaction(allyEntity);
    if (!allyFaction) return false;
    
    const factionManager = getFactionManager();
    if (!factionManager) return allyFaction === this._factionId; // Only assist same faction
    
    const allyRelationship = factionManager.getRelationshipTier(this._factionId, allyFaction);
    
    // Assist allies and same faction members
    return allyRelationship === 'ALLIED' || allyFaction === this._factionId;
  }
  
  /**
   * Check if entity is currently in its own faction's territory
   * @returns {boolean} True if in own territory
   */
  isInOwnTerritory() {
    const factionManager = getFactionManager();
    if (!factionManager) return false;
    
    const position = this._entity.getPosition ? this._entity.getPosition() : 
                    { x: this._entity.posX || this._entity.x, y: this._entity.posY || this._entity.y };
    
    return factionManager.isInTerritory(this._factionId, position);
  }
  
  /**
   * Check if entity is in another faction's territory
   * @returns {string|null} Other faction's ID if in their territory, null otherwise
   */
  getEncroachingTerritory() {
    const factionManager = getFactionManager();
    if (!factionManager) return null;
    
    const position = this._entity.getPosition ? this._entity.getPosition() : 
                    { x: this._entity.posX || this._entity.x, y: this._entity.posY || this._entity.y };
    
    const allFactions = factionManager.getAllFactions();
    
    for (const faction of allFactions) {
      if (faction.id !== this._factionId && factionManager.isInTerritory(faction.id, position)) {
        return faction.id;
      }
    }
    
    return null;
  }
  
  /**
   * Handle gift giving to another entity
   * @param {Object} targetEntity - Entity receiving the gift
   * @param {string} giftType - Type of gift ('resources', 'ants', etc.)
   * @param {Object} giftData - Data about the gift
   */
  giveGift(targetEntity, giftType, giftData) {
    const targetFaction = this._getEntityFaction(targetEntity);
    if (!targetFaction || targetFaction === this._factionId) return false;
    
    const factionManager = getFactionManager();
    if (!factionManager) return false;
    
    // Check if target can receive gifts (use cached lookup)
    let targetController = this._controllerCache.get(targetEntity);
    if (targetController === undefined) {
      targetController = targetEntity.getController ? targetEntity.getController('faction') : null;
      this._controllerCache.set(targetEntity, targetController);
    }
    
    if (targetController && !targetController.canReceiveGifts(this._factionId)) {
      return false;
    }
    
    // Handle the gift based on type
    let actionType = null;
    switch (giftType) {
      case 'resources':
        actionType = 'GIFT_RESOURCES';
        break;
      case 'ants':
        actionType = 'GIFT_ANTS';
        break;
      default:
        console.warn(`🏴 Unknown gift type: ${giftType}`);
        return false;
    }
    
    // Apply relationship change
    factionManager.handleRelationshipAction(this._factionId, targetFaction, actionType, giftData);
    
    console.log(`🏴 ${this._factionId} gave ${giftType} to ${targetFaction}`);
    return true;
  }
  
  /**
   * Get behavior modifiers for this entity
   * @returns {Object} Behavior modifier flags
   */
  getBehaviorModifiers() {
    return { ...this._behaviorModifiers };
  }
  
  /**
   * Get discovered factions
   * @returns {Set} Set of discovered faction IDs
   */
  getDiscoveredFactions() {
    return new Set(this._discoveredFactions);
  }
  
  // ===== PRIVATE METHODS =====
  
  /**
   * Get faction ID from another entity (MEGA PERFORMANCE OPTIMIZED WITH GLOBAL CACHING)
   * @param {Object} entity - Entity to check
   * @returns {string|null} Faction ID or null
   */
  _getEntityFaction(entity) {
    if (!entity) return null;
    
    // PERFORMANCE BOOST: Check global faction cache first (fastest path)
    const cachedFaction = FactionController._globalFactionCache.get(entity);
    if (cachedFaction !== undefined) {
      return cachedFaction;
    }
    
    // PERFORMANCE: Use global controller cache
    let factionController = FactionController._globalControllerCache.get(entity);
    if (factionController === undefined) {
      // Try to get controller, but don't fail if it doesn't exist
      factionController = entity.getController ? entity.getController('faction') : null;
      FactionController._globalControllerCache.set(entity, factionController);
    }
    
    // Get faction ID and cache it globally for super-fast future lookups
    let factionId = null;
    if (factionController) {
      factionId = factionController.getFactionId();
    } else {
      // Fallback to direct faction property
      factionId = entity.faction || entity._faction || 'neutral';
    }
    
    // Cache the result globally for all controllers to use
    FactionController._globalFactionCache.set(entity, factionId);
    
    // Global cache cleanup (less frequent since it's shared)
    FactionController._globalCacheCleanupCounter++;
    if (FactionController._globalCacheCleanupCounter > 200) {
      this._cleanupGlobalCache();
      FactionController._globalCacheCleanupCounter = 0;
    }
    
    if (factionController) {
      return factionController.getFactionId();
    }
    
    // Fall back to entity properties
    return entity._faction || entity.faction || null;
  }
  
  /**
   * Check territorial status and handle encroachment
   */
  _checkTerritorialStatus() {
    const encroachingTerritory = this.getEncroachingTerritory();
    const factionManager = getFactionManager();
    if (!factionManager) return;
    
    if (encroachingTerritory) {
      // Start or continue encroachment tracking
      factionManager.handleTerritorialEncroachment(
        this._factionId, 
        encroachingTerritory, 
        this._entity.getPosition ? this._entity.getPosition() : 
        { x: this._entity.posX || this._entity.x, y: this._entity.posY || this._entity.y }
      );
    } else {
      // Clear any existing encroachments
      const allFactions = factionManager.getAllFactions();
      allFactions.forEach(faction => {
        if (faction.id !== this._factionId) {
          factionManager.clearTerritorialEncroachment(this._factionId, faction.id);
        }
      });
    }
  }
  
  /**
   * Check for new factions in discovery range
   */
  _checkForNewFactions() {
    const factionManager = getFactionManager();
    if (!factionManager) return;
    
    const myPosition = this._entity.getPosition ? this._entity.getPosition() : 
                      { x: this._entity.posX || this._entity.x, y: this._entity.posY || this._entity.y };
    
    // Check global entities for new factions (this would be improved with spatial indexing)
    if (typeof ants !== 'undefined' && ants) {
      ants.forEach(antWrapper => {
        const otherEntity = antWrapper.antObject || antWrapper;
        if (otherEntity === this._entity) return;
        
        const otherFaction = this._getEntityFaction(otherEntity);
        if (!otherFaction || otherFaction === this._factionId) return;
        
        // Check if already discovered
        if (this._discoveredFactions.has(otherFaction)) return;
        
        // Check distance
        const otherPosition = otherEntity.getPosition ? otherEntity.getPosition() : 
                            { x: otherEntity.posX || otherEntity.x, y: otherEntity.posY || otherEntity.y };
        
        const dx = myPosition.x - otherPosition.x;
        const dy = myPosition.y - otherPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this._discoveryRange) {
          // Discover the faction
          factionManager.discoverFaction(this._factionId, otherFaction);
          this._discoveredFactions.add(otherFaction);
        }
      });
    }
  }
  
  /**
   * Update behavior modifiers based on current faction relationships
   */
  _updateBehaviorModifiers() {
    const factionManager = getFactionManager();
    if (!factionManager) return;
    
    // Get faction data to determine behavioral tendencies
    const faction = factionManager.getFaction(this._factionId);
    if (!faction) return;
    
    // Determine if this faction is generally aggressive, peaceful, etc.
    const knownFactions = factionManager.getKnownFactions(this._factionId);
    let averageRelationship = 0;
    let enemyCount = 0;
    let allyCount = 0;
    
    knownFactions.forEach(otherFactionId => {
      const relationship = factionManager.getRelationship(this._factionId, otherFactionId);
      const tier = factionManager.getRelationshipTier(this._factionId, otherFactionId);
      
      averageRelationship += relationship;
      if (tier === 'ENEMY' || tier === 'BLOOD_ENEMY') enemyCount++;
      if (tier === 'ALLIED') allyCount++;
    });
    
    if (knownFactions.length > 0) {
      averageRelationship /= knownFactions.length;
    }
    
    // Update behavior modifiers
    this._behaviorModifiers.attackOnSight = enemyCount > 0;
    this._behaviorModifiers.shareResources = allyCount > 0;
    this._behaviorModifiers.assistInCombat = allyCount > 0;
    this._behaviorModifiers.defendTerritory = averageRelationship < 0;
    this._behaviorModifiers.avoidNeutrals = enemyCount > allyCount;
  }
  
  /**
   * Fallback hostility check when FactionManager is not available
   * @param {string} otherFaction - Other faction ID
   * @returns {boolean} Whether factions are hostile
   */
  _fallbackHostilityCheck(otherFaction) {
    // Simple fallback: different non-neutral factions are potentially hostile
    return otherFaction !== 'neutral' && this._factionId !== 'neutral' && otherFaction !== this._factionId;
  }
  
  /**
   * Clean up cached controller references to prevent memory leaks
   * PERFORMANCE: Removes stale controller references
   */
  _cleanupControllerCache() {
    // Only keep references to entities that still exist and are active
    const entitiesToKeep = new Set();
    
    if (typeof ants !== 'undefined') {
      for (const ant of ants) {
        if (ant && ant._isActive) {
          entitiesToKeep.add(ant);
        }
      }
    }
    
    // Remove stale entries
    for (const [entity] of this._controllerCache.entries()) {
      if (!entitiesToKeep.has(entity)) {
        this._controllerCache.delete(entity);
      }
    }
  }

  /**
   * Clean up global caches to prevent memory leaks
   * PERFORMANCE: Shared cleanup for all faction controllers
   */
  _cleanupGlobalCache() {
    // Only keep references to entities that still exist and are active
    const entitiesToKeep = new Set();
    
    if (typeof ants !== 'undefined') {
      for (const ant of ants) {
        if (ant && ant._isActive) {
          entitiesToKeep.add(ant);
        }
      }
    }
    
    // Clean up global faction cache
    for (const [entity] of FactionController._globalFactionCache.entries()) {
      if (!entitiesToKeep.has(entity)) {
        FactionController._globalFactionCache.delete(entity);
      }
    }
    
    // Clean up global controller cache
    for (const [entity] of FactionController._globalControllerCache.entries()) {
      if (!entitiesToKeep.has(entity)) {
        FactionController._globalControllerCache.delete(entity);
      }
    }
    
    console.log(`🧹 Cleaned global faction caches (${FactionController._globalFactionCache.size} factions, ${FactionController._globalControllerCache.size} controllers)`);
  }

  /**
   * Get debug information
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      factionId: this._factionId,
      discoveredFactions: Array.from(this._discoveredFactions),
      isInOwnTerritory: this.isInOwnTerritory(),
      encroachingTerritory: this.getEncroachingTerritory(),
      behaviorsModifiers: this._behaviorModifiers,
      discoveryRange: this._discoveryRange,
      controllerCacheSize: this._controllerCache.size
    };
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FactionController;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.FactionController = FactionController;
}