/**
 * EntityManager Module
 * 
 * Tracks entity counts by type and integrates with EventBus for real-time queries.
 * Provides a centralized registry for all game entities (ants, resources, buildings, etc.)
 */

class EntityManager {
    /**
     * Create an EntityManager
     * @param {Object} [options={}] - Configuration options
     * @param {EventBus} [options.eventBus] - EventBus instance for integration
     */
    constructor(options = {}) {
        // Use provided eventBus, module eventBus, or check global scope
        this.eventBus = options.eventBus || eventBus || (typeof global !== 'undefined' ? global.eventBus : null);
        
        // Entity storage: { type: { id: metadata } }
        this.entities = {};
        
        // Faction tracking: { faction: { type: count } }
        this.factions = {};
        
        // Ant job tracking: { jobName: count }
        this.antJobs = {};
        
        // Setup event listeners
        this._setupEventListeners();
    }
    
    /**
     * Setup EventBus listeners
     * @private
     */
    _setupEventListeners() {
        if (!this.eventBus) return;
        
        // Listen for entity registration
        this.entityRegisteredListener = (data) => {
            this.registerEntity(data.type, data.id, {
                ...data.metadata,
                faction: data.faction
            });
        };
        this.eventBus.on('ENTITY_REGISTERED', this.entityRegisteredListener);
        
        // Listen for entity unregistration
        this.entityUnregisteredListener = (data) => {
            this.unregisterEntity(data.type, data.id);
        };
        this.eventBus.on('ENTITY_UNREGISTERED', this.entityUnregisteredListener);
        
        // Listen for entity count queries
        this.queryCountsListener = (data) => this._handleQueryEntityCounts(data);
        this.eventBus.on('QUERY_ENTITY_COUNTS', this.queryCountsListener);
        
        // Listen for ant details queries
        this.queryAntDetailsListener = (data) => this._handleQueryAntDetails(data);
        this.eventBus.on('QUERY_ANT_DETAILS', this.queryAntDetailsListener);
    }
    
    /**
     * Handle QUERY_ENTITY_COUNTS event
     * @private
     */
    _handleQueryEntityCounts(data) {
        if (data && data.type) {
            // Specific type query
            const count = this.getCount(data.type);
            this.eventBus.emit('ENTITY_COUNTS_RESPONSE', {
                type: data.type,
                count: count
            });
        } else {
            // All counts query
            const counts = this.getCounts();
            const total = this.getTotalCount();
            this.eventBus.emit('ENTITY_COUNTS_RESPONSE', {
                counts: counts,
                total: total
            });
        }
    }
    
    /**
     * Handle QUERY_ANT_DETAILS event
     * @private
     */
    _handleQueryAntDetails(data) {
        const breakdown = this.getAntDetails();
        const total = this.getCount('ant');
        
        this.eventBus.emit('ANT_DETAILS_RESPONSE', {
            total: total,
            breakdown: breakdown
        });
    }
    
    /**
     * Register an entity
     * @param {string} type - Entity type (ant, resource, building, etc.)
     * @param {string} id - Unique entity ID
     * @param {Object} [metadata={}] - Additional entity metadata (jobName, faction, etc.)
     */
    registerEntity(type, id, metadata = {}) {
        // Validate inputs
        if (type == null || id == null) return;
        
        // Initialize type storage if needed
        if (!this.entities[type]) {
            this.entities[type] = {};
        }
        
        // Check if already registered (prevent double-counting)
        if (this.entities[type][id]) return;
        
        // Store entity with faction
        this.entities[type][id] = metadata;
        
        // Track by faction
        const faction = metadata.faction || 'neutral';
        if (!this.factions[faction]) {
            this.factions[faction] = {};
        }
        if (!this.factions[faction][type]) {
            this.factions[faction][type] = 0;
        }
        this.factions[faction][type]++;
        
        // Track ant jobs
        if (type === 'ant' && metadata.jobName) {
            this.antJobs[metadata.jobName] = (this.antJobs[metadata.jobName] || 0) + 1;
        }
        
        // Emit event
        if (this.eventBus) {
            this.eventBus.emit('ENTITY_REGISTERED', {
                type: type,
                id: id,
                metadata: metadata
            });
        }
    }
    
    /**
     * Unregister an entity
     * @param {string} type - Entity type
     * @param {string} id - Entity ID
     */
    unregisterEntity(type, id) {
        // Validate inputs
        if (type == null || id == null) return;
        if (!this.entities[type]) return;
        if (!this.entities[type][id]) return;
        
        // Get metadata before removing
        const metadata = this.entities[type][id];
        
        // Remove from faction tracking
        const faction = metadata.faction || 'neutral';
        if (this.factions[faction] && this.factions[faction][type]) {
            this.factions[faction][type]--;
            if (this.factions[faction][type] <= 0) {
                delete this.factions[faction][type];
            }
            // Clean up empty faction
            if (Object.keys(this.factions[faction]).length === 0) {
                delete this.factions[faction];
            }
        }
        
        // Remove from ant jobs tracking
        if (type === 'ant' && metadata.jobName) {
            this.antJobs[metadata.jobName]--;
            if (this.antJobs[metadata.jobName] <= 0) {
                delete this.antJobs[metadata.jobName];
            }
        }
        
        // Remove entity
        delete this.entities[type][id];
        
        // Clean up empty type
        if (Object.keys(this.entities[type]).length === 0) {
            delete this.entities[type];
        }
        
        // Emit event
        if (this.eventBus) {
            this.eventBus.emit('ENTITY_UNREGISTERED', {
                type: type,
                id: id,
                metadata: metadata
            });
        }
    }
    
    /**
     * Update entity metadata (e.g., job change)
     * @param {string} type - Entity type
     * @param {string} id - Entity ID
     * @param {Object} metadata - New metadata
     */
    updateEntityMetadata(type, id, metadata) {
        if (!this.entities[type] || !this.entities[type][id]) return;
        
        const oldMetadata = this.entities[type][id];
        
        // Update ant job tracking if job changed
        if (type === 'ant' && oldMetadata.jobName !== metadata.jobName) {
            // Decrement old job
            if (oldMetadata.jobName) {
                this.antJobs[oldMetadata.jobName]--;
                if (this.antJobs[oldMetadata.jobName] <= 0) {
                    delete this.antJobs[oldMetadata.jobName];
                }
            }
            
            // Increment new job
            if (metadata.jobName) {
                this.antJobs[metadata.jobName] = (this.antJobs[metadata.jobName] || 0) + 1;
            }
        }
        
        // Update metadata
        this.entities[type][id] = metadata;
    }
    
    /**
     * Get all entity counts by type
     * @returns {Object} Object with type keys and count values
     */
    getCounts() {
        const counts = {};
        
        for (const type in this.entities) {
            counts[type] = Object.keys(this.entities[type]).length;
        }
        
        return counts;
    }
    
    /**
     * Get count for specific entity type
     * @param {string} type - Entity type
     * @returns {number} Count of entities of that type
     */
    getCount(type) {
        if (!this.entities[type]) return 0;
        return Object.keys(this.entities[type]).length;
    }
    
    /**
     * Get total count across all entity types
     * @returns {number} Total entity count
     */
    getTotalCount() {
        let total = 0;
        
        for (const type in this.entities) {
            total += Object.keys(this.entities[type]).length;
        }
        
        return total;
    }
    
    /**
     * Get list of tracked entity types
     * @returns {string[]} Array of entity type names
     */
    getTypes() {
        return Object.keys(this.entities);
    }
    
    /**
     * Get detailed ant counts by job type
     * @returns {Object} Object with jobName keys and count values
     */
    getAntDetails() {
        return { ...this.antJobs };
    }
    
    /**
     * Get all factions and their entity counts
     * @returns {Object} Object with faction keys and type counts
     */
    getFactions() {
        return JSON.parse(JSON.stringify(this.factions));
    }
    
    /**
     * Get entity counts for a specific faction
     * @param {string} faction - Faction name
     * @returns {Object} Object with type keys and count values
     */
    getFactionCounts(faction) {
        if (!this.factions[faction]) return {};
        return { ...this.factions[faction] };
    }
    
    /**
     * Get total entity count for a specific faction
     * @param {string} faction - Faction name
     * @returns {number} Total entity count for faction
     */
    getFactionTotal(faction) {
        if (!this.factions[faction]) return 0;
        let total = 0;
        for (const type in this.factions[faction]) {
            total += this.factions[faction][type];
        }
        return total;
    }
    
    /**
     * Get count of specific entity type for a faction
     * @param {string} faction - Faction name
     * @param {string} type - Entity type
     * @returns {number} Count of that type for faction
     */
    getFactionTypeCount(faction, type) {
        if (!this.factions[faction]) return 0;
        return this.factions[faction][type] || 0;
    }
    
    /**
     * Reset all entity counts
     */
    reset() {
        this.entities = {};
        this.factions = {};
        this.antJobs = {};
        
        if (this.eventBus) {
            this.eventBus.emit('ENTITY_MANAGER_RESET', {});
        }
    }
    
    /**
     * Cleanup event listeners
     */
    destroy() {
        if (this.eventBus) {
            if (this.entityRegisteredListener) {
                this.eventBus.off('ENTITY_REGISTERED', this.entityRegisteredListener);
            }
            if (this.entityUnregisteredListener) {
                this.eventBus.off('ENTITY_UNREGISTERED', this.entityUnregisteredListener);
            }
            if (this.queryCountsListener) {
                this.eventBus.off('QUERY_ENTITY_COUNTS', this.queryCountsListener);
            }
            if (this.queryAntDetailsListener) {
                this.eventBus.off('QUERY_ANT_DETAILS', this.queryAntDetailsListener);
            }
        }
        
        this.entities = {};
        this.factions = {};
        this.antJobs = {};
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityManager;
}

// Export for browser
if (typeof window !== 'undefined') {
    window.EntityManager = EntityManager;
}
