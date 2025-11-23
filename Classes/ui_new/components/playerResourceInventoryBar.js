/**
 * Player Resource Inventory Bar Component
 * @module ui_new/components/playerResourceInventoryBar
 *
 * A specialized ResourceInventoryBar that tracks player faction resources
 * (Stone, Sticks, Leaves) by listening to ENTITY_REGISTERED events.
 */

const ResourceInventoryBar = require('./resourceInventoryBar');

// Import eventBus for both browser and Node.js environments
let eventBus;
if (typeof window !== 'undefined' && window.eventBus) {
    eventBus = window.eventBus;
} else if (typeof require !== 'undefined') {
    try {
        const eventBusModule = require('../../globals/eventBus');
        eventBus = eventBusModule.default || eventBusModule;
    } catch (e) {
        // EventBus not available, will be injected during tests
    }
}

class PlayerResourceInventoryBar extends ResourceInventoryBar {
    /**
     * Creates a PlayerResourceInventoryBar instance.
     * @param {Object} options - Configuration options
     * @param {string} [options.playerFaction='player'] - The faction to track
     * @param {Object} [options.sprites] - Sprite images for resources {stone, stick, leaf}
     */
    constructor(options = {}) {
        super(options);
        
        this.playerFaction = options.playerFaction || 'player';
        this.eventBus = eventBus;
        
        // Resource type mappings (multiple game resource types -> UI display type)
        this.resourceTypeMap = {
            'stone': 'stone',
            'stick': 'stick',
            'greenLeaf': 'leaf',
            'mapleLeaf': 'leaf',
            'leaf': 'leaf'
        };
        
        // Initialize the three resource lines
        this._setupResourceLines(options.sprites);
        
        // Setup event listeners
        this._setupEventListeners();
    }

    /**
     * Initialize the three resource lines (stone, stick, leaf)
     * @private
     * @param {Object} [sprites] - Optional sprite images
     */
    _setupResourceLines(sprites = {}) {
        // Stone
        this.addResource('stone', {
            sprite: sprites.stone || null,
            quantity: 0,
            color: '#CCCCCC'
        });
        
        // Stick
        this.addResource('stick', {
            sprite: sprites.stick || null,
            quantity: 0,
            color: '#8B4513'
        });
        
        // Leaf (combines greenLeaf and mapleLeaf)
        this.addResource('leaf', {
            sprite: sprites.leaf || null,
            quantity: 0,
            color: '#228B22'
        });
    }

    /**
     * Setup event listeners for entity events
     * @private
     */
    _setupEventListeners() {
        if (!this.eventBus) {
            return;
        }
        
        // Bind methods to maintain 'this' context
        this._entityRegisteredHandler = (data) => this.handleEntityRegistered(data);
        this._entityFactionChangedHandler = (data) => this.handleEntityFactionChanged(data);
        this._entityRemovedHandler = (data) => this.handleEntityRemoved(data);
        
        // Listen for entity registration
        this.eventBus.on('ENTITY_REGISTERED', this._entityRegisteredHandler);
        
        // Listen for faction changes
        this.eventBus.on('ENTITY_FACTION_CHANGED', this._entityFactionChangedHandler);
        
        // Listen for entity removal
        this.eventBus.on('ENTITY_REMOVED', this._entityRemovedHandler);
    }

    /**
     * Handle ENTITY_REGISTERED event
     * @param {Object} data - Event data
     * @param {string} data.type - Entity type
     * @param {string} data.faction - Entity faction
     * @param {Object} data.metadata - Additional metadata
     * @param {string} data.metadata.resourceType - Resource type (for resources)
     */
    handleEntityRegistered(data) {
        // Only track player faction resources
        if (data.faction !== this.playerFaction) {
            return;
        }
        
        // Only track resource entities
        if (data.type !== 'resource') {
            return;
        }
        
        // Get resource type from metadata
        const resourceType = data.metadata?.resourceType;
        if (!resourceType) {
            return;
        }
        
        // Map to UI resource type (e.g., greenLeaf -> leaf)
        const uiResourceType = this.resourceTypeMap[resourceType];
        if (!uiResourceType) {
            return; // Unknown resource type
        }
        
        // Increment the resource count
        this._incrementResource(uiResourceType);
    }

    /**
     * Handle ENTITY_FACTION_CHANGED event
     * @param {Object} data - Event data
     * @param {string} data.type - Entity type
     * @param {string} data.oldFaction - Previous faction
     * @param {string} data.newFaction - New faction
     * @param {Object} data.metadata - Additional metadata
     */
    handleEntityFactionChanged(data) {
        // Only track resource entities
        if (data.type !== 'resource') {
            return;
        }
        
        const resourceType = data.metadata?.resourceType;
        if (!resourceType) {
            return;
        }
        
        const uiResourceType = this.resourceTypeMap[resourceType];
        if (!uiResourceType) {
            return;
        }
        
        // If changing TO player faction, increment
        if (data.newFaction === this.playerFaction && data.oldFaction !== this.playerFaction) {
            this._incrementResource(uiResourceType);
        }
        // If changing FROM player faction, decrement
        else if (data.oldFaction === this.playerFaction && data.newFaction !== this.playerFaction) {
            this._decrementResource(uiResourceType);
        }
    }

    /**
     * Handle ENTITY_REMOVED event
     * @param {Object} data - Event data
     * @param {string} data.type - Entity type
     * @param {string} data.faction - Entity faction
     * @param {Object} data.metadata - Additional metadata
     */
    handleEntityRemoved(data) {
        // Only track player faction resources
        if (data.faction !== this.playerFaction) {
            return;
        }
        
        // Only track resource entities
        if (data.type !== 'resource') {
            return;
        }
        
        const resourceType = data.metadata?.resourceType;
        if (!resourceType) {
            return;
        }
        
        const uiResourceType = this.resourceTypeMap[resourceType];
        if (!uiResourceType) {
            return;
        }
        
        // Decrement the resource count
        this._decrementResource(uiResourceType);
    }

    /**
     * Increment a resource count
     * @private
     * @param {string} resourceType - Resource type (stone, stick, leaf)
     */
    _incrementResource(resourceType) {
        const resource = this.getResource(resourceType);
        if (!resource) {
            return;
        }
        
        const currentQty = parseInt(resource.caption) || 0;
        this.updateResource(resourceType, { quantity: currentQty + 1 });
    }

    /**
     * Decrement a resource count
     * @private
     * @param {string} resourceType - Resource type (stone, stick, leaf)
     */
    _decrementResource(resourceType) {
        const resource = this.getResource(resourceType);
        if (!resource) {
            return;
        }
        
        const currentQty = parseInt(resource.caption) || 0;
        const newQty = Math.max(0, currentQty - 1); // Don't go below 0
        this.updateResource(resourceType, { quantity: newQty });
    }

    /**
     * Cleanup and destroy the bar
     */
    destroy() {
        // Unregister event listeners
        if (this.eventBus) {
            if (this._entityRegisteredHandler) {
                this.eventBus.off('ENTITY_REGISTERED', this._entityRegisteredHandler);
            }
            if (this._entityFactionChangedHandler) {
                this.eventBus.off('ENTITY_FACTION_CHANGED', this._entityFactionChangedHandler);
            }
            if (this._entityRemovedHandler) {
                this.eventBus.off('ENTITY_REMOVED', this._entityRemovedHandler);
            }
        }
        
        // Call parent destroy
        super.destroy();
    }
}

module.exports = PlayerResourceInventoryBar;
