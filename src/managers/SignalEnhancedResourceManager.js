/**
 * @fileoverview Signal-Enhanced Resource Manager
 * Resource management system with comprehensive signal system integration
 * for event-driven resource tracking and simplified API access.
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

// Note: GameObject, Signal, and eventBus are available globally from SignalSystem.js and EventBus.js

/**
 * Resource class representing individual resource nodes
 */
class Resource extends GameObject {
    constructor(id, type, amount, position, properties = {}) {
        super(`Resource_${id}`);
        
        this.id = id;
        this.type = type;
        this.amount = amount;
        this.maxAmount = properties.maxAmount || amount;
        this.position = { ...position };
        this.discoveredAt = Date.now();
        this.isDiscovered = false;
        this.isBeingHarvested = false;
        this.harvestersCount = 0;
        this.regenerationRate = properties.regenerationRate || 0;
        this.lastRegeneration = Date.now();
        
        // Resource properties
        this.difficulty = properties.difficulty || 1; // Mining/harvesting difficulty
        this.purity = properties.purity || 1.0; // Quality multiplier
        this.accessibility = properties.accessibility || 1.0; // How easy to reach
        
        // Visual properties
        this.sprite = properties.sprite || null;
        this.color = properties.color || '#666666';
        this.size = properties.size || 1.0;
        
        this.initializeSignals();
    }
    
    initializeSignals() {
        // Discovery signals
        this.declareSignal('discovered', 'resource', 'discoveredBy');
        this.declareSignal('visibility_changed', 'resource', 'isVisible');
        
        // Harvesting signals
        this.declareSignal('harvest_started', 'resource', 'harvester');
        this.declareSignal('harvest_completed', 'resource', 'harvester');
        this.declareSignal('harvested', 'resource', 'harvester', 'amount');
        this.declareSignal('harvest_failed', 'resource', 'harvester', 'reason');
        
        // Amount change signals
        this.declareSignal('amount_changed', 'resource', 'newAmount', 'previousAmount');
        this.declareSignal('depleted', 'resource', 'depletedBy');
        this.declareSignal('regenerated', 'resource', 'newAmount');
        
        // State signals
        this.declareSignal('properties_changed', 'resource', 'changedProperties');
        this.declareSignal('destroyed', 'resource', 'cause');
    }
    
    /**
     * Discover this resource
     * @param {object} discoverer - The entity that discovered this resource
     */
    discover(discoverer) {
        if (this.isDiscovered) return false;
        
        this.isDiscovered = true;
        
        this.discovered.emit(this, discoverer);
        eventBus.emit('resource_discovered', {
            resourceId: this.id,
            type: this.type,
            amount: this.amount,
            position: { ...this.position },
            discoveredBy: discoverer ? discoverer.id : null
        }, this);
        
        return true;
    }
    
    /**
     * Harvest amount from this resource
     * @param {object} harvester - The entity harvesting
     * @param {number} requestedAmount - Amount requested to harvest
     * @returns {number} Actual amount harvested
     */
    harvest(harvester, requestedAmount) {
        if (this.amount <= 0) {
            this.harvest_failed.emit(this, harvester, 'depleted');
            return 0;
        }
        
        const actualAmount = Math.min(requestedAmount, this.amount);
        const previousAmount = this.amount;
        
        this.amount -= actualAmount;
        
        this.harvested.emit(this, harvester, actualAmount);
        this.amount_changed.emit(this, this.amount, previousAmount);
        
        eventBus.emit('resource_collected', {
            collector: harvester,
            resource: { id: this.id, type: this.type },
            amount: actualAmount,
            remaining: this.amount
        }, this);
        
        // Check if depleted
        if (this.amount <= 0) {
            this.depleted.emit(this, harvester);
            eventBus.emit('resource_depleted', {
                resourceId: this.id,
                type: this.type,
                position: { ...this.position },
                depletedBy: harvester ? harvester.id : null
            }, this);
        }
        
        return actualAmount;
    }
    
    /**
     * Add amount to this resource (for regeneration or deposits)
     * @param {number} amount - Amount to add
     * @param {string} source - Source of the addition
     */
    addAmount(amount, source = 'regeneration') {
        const previousAmount = this.amount;
        this.amount = Math.min(this.amount + amount, this.maxAmount);
        
        if (this.amount !== previousAmount) {
            this.amount_changed.emit(this, this.amount, previousAmount);
            
            if (source === 'regeneration') {
                this.regenerated.emit(this, this.amount);
                eventBus.emit('resource_regenerated', {
                    resourceId: this.id,
                    type: this.type,
                    amount: this.amount,
                    added: this.amount - previousAmount
                }, this);
            }
        }
    }
    
    /**
     * Update resource regeneration
     */
    updateRegeneration() {
        if (this.regenerationRate <= 0 || this.amount >= this.maxAmount) return;
        
        const now = Date.now();
        const timeDelta = (now - this.lastRegeneration) / 1000; // Convert to seconds
        const regenAmount = this.regenerationRate * timeDelta;
        
        if (regenAmount >= 1) {
            this.addAmount(Math.floor(regenAmount), 'regeneration');
            this.lastRegeneration = now;
        }
    }
    
    /**
     * Start harvesting process
     * @param {object} harvester - The harvester entity
     */
    startHarvesting(harvester) {
        this.isBeingHarvested = true;
        this.harvestersCount++;
        
        this.harvest_started.emit(this, harvester);
        eventBus.emit('resource_harvest_started', {
            resourceId: this.id,
            harvesterId: harvester.id,
            harvestersCount: this.harvestersCount
        }, this);
    }
    
    /**
     * Complete harvesting process
     * @param {object} harvester - The harvester entity
     */
    completeHarvesting(harvester) {
        this.harvestersCount = Math.max(0, this.harvestersCount - 1);
        
        if (this.harvestersCount === 0) {
            this.isBeingHarvested = false;
        }
        
        this.harvest_completed.emit(this, harvester);
        eventBus.emit('resource_harvest_completed', {
            resourceId: this.id,
            harvesterId: harvester.id,
            harvestersCount: this.harvestersCount
        }, this);
    }
    
    /**
     * Get resource status
     * @returns {object} Status object
     */
    getStatus() {
        return {
            id: this.id,
            type: this.type,
            amount: this.amount,
            maxAmount: this.maxAmount,
            position: { ...this.position },
            isDiscovered: this.isDiscovered,
            isBeingHarvested: this.isBeingHarvested,
            harvestersCount: this.harvestersCount,
            difficulty: this.difficulty,
            purity: this.purity,
            accessibility: this.accessibility,
            regenerationRate: this.regenerationRate
        };
    }
}

/**
 * Enhanced Resource Manager with signal system integration
 */
class SignalEnhancedResourceManager extends GameObject {
    constructor() {
        super('ResourceManager');
        
        this.resources = new Map(); // id -> Resource
        this.resourcesByType = new Map(); // type -> Set of resource ids
        this.discoveredResources = new Set();
        this.storage = new Map(); // type -> amount
        this.storageCapacity = new Map(); // type -> max capacity
        this.harvestingQueue = [];
        
        // Configuration
        this.globalRegenerationMultiplier = 1.0;
        this.discoveryRange = 50; // Range for automatic discovery
        this.maxStoragePerType = 10000;
        
        this.initializeSignals();
        this.startUpdateLoop();
    }
    
    initializeSignals() {
        // Resource management signals
        this.declareSignal('resource_added', 'manager', 'resource');
        this.declareSignal('resource_removed', 'manager', 'resourceId', 'reason');
        this.declareSignal('resource_type_registered', 'manager', 'resourceType');
        
        // Storage signals
        this.declareSignal('storage_changed', 'manager', 'resourceType', 'newAmount', 'previousAmount');
        this.declareSignal('storage_full', 'manager', 'resourceType', 'attemptedAmount');
        this.declareSignal('storage_empty', 'manager', 'resourceType');
        this.declareSignal('storage_capacity_changed', 'manager', 'resourceType', 'newCapacity');
        
        // Discovery signals
        this.declareSignal('area_surveyed', 'manager', 'area', 'resourcesFound');
        this.declareSignal('discovery_range_changed', 'manager', 'newRange');
        
        // Queue signals
        this.declareSignal('harvest_queued', 'manager', 'harvester', 'resource');
        this.declareSignal('harvest_queue_processed', 'manager', 'processedCount');
        
        // System signals
        this.declareSignal('regeneration_tick', 'manager', 'regeneratedResources');
        this.declareSignal('statistics_updated', 'manager', 'statistics');
    }
    
    /**
     * Add a new resource to the manager
     * @param {string} type - Resource type
     * @param {number} amount - Resource amount
     * @param {object} position - Resource position
     * @param {object} properties - Additional resource properties
     * @returns {Resource} The created resource
     */
    addResource(type, amount, position, properties = {}) {
        const id = this.generateResourceId();
        const resource = new Resource(id, type, amount, position, properties);
        
        this.resources.set(id, resource);
        
        // Track by type
        if (!this.resourcesByType.has(type)) {
            this.resourcesByType.set(type, new Set());
            this.resource_type_registered.emit(this, type);
        }
        this.resourcesByType.get(type).add(id);
        
        // Initialize storage for new types
        if (!this.storage.has(type)) {
            this.storage.set(type, 0);
            this.storageCapacity.set(type, this.maxStoragePerType);
        }
        
        // Connect to resource signals
        this.connectResourceSignals(resource);
        
        this.resource_added.emit(this, resource);
        eventBus.emit('resource_added', {
            resourceId: id,
            type: type,
            amount: amount,
            position: { ...position }
        }, this);
        
        return resource;
    }
    
    /**
     * Connect to a resource's signals
     * @param {Resource} resource - Resource to connect to
     * @private
     */
    connectResourceSignals(resource) {
        // Listen for resource events and relay them
        resource.harvested.connect((res, harvester, amount) => {
            this.handleResourceHarvested(res, harvester, amount);
        });
        
        resource.depleted.connect((res, depletedBy) => {
            this.handleResourceDepleted(res, depletedBy);
        });
        
        resource.discovered.connect((res, discoverer) => {
            this.discoveredResources.add(res.id);
        });
    }
    
    /**
     * Handle resource harvested event
     * @param {Resource} resource - Harvested resource
     * @param {object} harvester - Harvester entity
     * @param {number} amount - Amount harvested
     * @private
     */
    handleResourceHarvested(resource, harvester, amount) {
        // Add to storage
        this.addToStorage(resource.type, amount);
    }
    
    /**
     * Handle resource depleted event
     * @param {Resource} resource - Depleted resource
     * @param {object} depletedBy - Entity that depleted it
     * @private
     */
    handleResourceDepleted(resource, depletedBy) {
        // Schedule for removal if no regeneration
        if (resource.regenerationRate <= 0) {
            setTimeout(() => {
                this.removeResource(resource.id, 'depleted');
            }, 5000); // Remove after 5 seconds
        }
    }
    
    /**
     * Remove a resource from the manager
     * @param {string} resourceId - Resource ID to remove
     * @param {string} reason - Reason for removal
     * @returns {boolean} True if resource was removed
     */
    removeResource(resourceId, reason = 'unknown') {
        const resource = this.resources.get(resourceId);
        if (!resource) return false;
        
        // Remove from type tracking
        const typeSet = this.resourcesByType.get(resource.type);
        if (typeSet) {
            typeSet.delete(resourceId);
            if (typeSet.size === 0) {
                this.resourcesByType.delete(resource.type);
            }
        }
        
        // Remove from discovered set
        this.discoveredResources.delete(resourceId);
        
        // Destroy the resource
        resource.destroy();
        this.resources.delete(resourceId);
        
        this.resource_removed.emit(this, resourceId, reason);
        eventBus.emit('resource_removed', {
            resourceId: resourceId,
            type: resource.type,
            reason: reason
        }, this);
        
        return true;
    }
    
    /**
     * Add amount to storage
     * @param {string} resourceType - Type of resource
     * @param {number} amount - Amount to add
     * @returns {number} Actual amount added
     */
    addToStorage(resourceType, amount) {
        const currentAmount = this.storage.get(resourceType) || 0;
        const capacity = this.storageCapacity.get(resourceType) || this.maxStoragePerType;
        const availableSpace = capacity - currentAmount;
        const actualAmount = Math.min(amount, availableSpace);
        
        if (actualAmount <= 0) {
            this.storage_full.emit(this, resourceType, amount);
            eventBus.emit('resource_storage_full', {
                resourceType: resourceType,
                currentAmount: currentAmount,
                capacity: capacity,
                attemptedAmount: amount
            }, this);
            return 0;
        }
        
        const previousAmount = currentAmount;
        const newAmount = currentAmount + actualAmount;
        this.storage.set(resourceType, newAmount);
        
        this.storage_changed.emit(this, resourceType, newAmount, previousAmount);
        eventBus.emit('storage_updated', {
            resourceType: resourceType,
            newAmount: newAmount,
            previousAmount: previousAmount,
            change: actualAmount
        }, this);
        
        return actualAmount;
    }
    
    /**
     * Remove amount from storage
     * @param {string} resourceType - Type of resource
     * @param {number} amount - Amount to remove
     * @returns {number} Actual amount removed
     */
    removeFromStorage(resourceType, amount) {
        const currentAmount = this.storage.get(resourceType) || 0;
        const actualAmount = Math.min(amount, currentAmount);
        
        if (actualAmount <= 0) return 0;
        
        const previousAmount = currentAmount;
        const newAmount = currentAmount - actualAmount;
        this.storage.set(resourceType, newAmount);
        
        this.storage_changed.emit(this, resourceType, newAmount, previousAmount);
        
        if (newAmount === 0) {
            this.storage_empty.emit(this, resourceType);
            eventBus.emit('storage_empty', {
                resourceType: resourceType
            }, this);
        }
        
        return actualAmount;
    }
    
    /**
     * Get resource by ID
     * @param {string} resourceId - Resource ID
     * @returns {Resource|null} Resource or null if not found
     */
    getResource(resourceId) {
        return this.resources.get(resourceId) || null;
    }
    
    /**
     * Get all resources of a specific type
     * @param {string} resourceType - Type of resource
     * @returns {Array<Resource>} Array of resources
     */
    getResourcesByType(resourceType) {
        const resourceIds = this.resourcesByType.get(resourceType);
        if (!resourceIds) return [];
        
        return Array.from(resourceIds)
            .map(id => this.resources.get(id))
            .filter(resource => resource !== undefined);
    }
    
    /**
     * Find resources within range of a position
     * @param {object} position - Center position
     * @param {number} range - Search range
     * @param {string} resourceType - Optional type filter
     * @returns {Array<Resource>} Resources within range
     */
    findResourcesInRange(position, range, resourceType = null) {
        const results = [];
        
        for (const resource of this.resources.values()) {
            if (resourceType && resource.type !== resourceType) continue;
            
            const distance = Math.sqrt(
                Math.pow(resource.position.x - position.x, 2) +
                Math.pow(resource.position.y - position.y, 2)
            );
            
            if (distance <= range) {
                results.push(resource);
            }
        }
        
        return results.sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.position.x - position.x, 2) + Math.pow(a.position.y - position.y, 2));
            const distB = Math.sqrt(Math.pow(b.position.x - position.x, 2) + Math.pow(b.position.y - position.y, 2));
            return distA - distB;
        });
    }
    
    /**
     * Survey an area for resources and discover them
     * @param {object} area - Area object with position and size
     * @param {object} surveyor - Entity performing the survey
     * @returns {Array<Resource>} Discovered resources
     */
    surveyArea(area, surveyor) {
        const discovered = [];
        
        for (const resource of this.resources.values()) {
            if (resource.isDiscovered) continue;
            
            // Check if resource is within area
            if (resource.position.x >= area.x && 
                resource.position.x <= area.x + area.width &&
                resource.position.y >= area.y && 
                resource.position.y <= area.y + area.height) {
                
                if (resource.discover(surveyor)) {
                    discovered.push(resource);
                }
            }
        }
        
        this.area_surveyed.emit(this, area, discovered);
        eventBus.emit('area_surveyed', {
            area: area,
            surveyorId: surveyor ? surveyor.id : null,
            resourcesFound: discovered.length,
            resources: discovered.map(r => ({ id: r.id, type: r.type, amount: r.amount }))
        }, this);
        
        return discovered;
    }
    
    /**
     * Queue a harvest operation
     * @param {object} harvester - Harvester entity
     * @param {string} resourceId - Resource to harvest
     * @param {number} amount - Amount to harvest
     */
    queueHarvest(harvester, resourceId, amount) {
        const harvestOperation = {
            harvester: harvester,
            resourceId: resourceId,
            amount: amount,
            queuedAt: Date.now()
        };
        
        this.harvestingQueue.push(harvestOperation);
        
        const resource = this.getResource(resourceId);
        this.harvest_queued.emit(this, harvester, resource);
        
        eventBus.emit('harvest_queued', {
            harvesterId: harvester.id,
            resourceId: resourceId,
            amount: amount,
            queuePosition: this.harvestingQueue.length
        }, this);
    }
    
    /**
     * Process the harvest queue
     */
    processHarvestQueue() {
        let processedCount = 0;
        const toProcess = [...this.harvestingQueue];
        this.harvestingQueue = [];
        
        for (const operation of toProcess) {
            const resource = this.getResource(operation.resourceId);
            
            if (resource && resource.amount > 0) {
                const harvested = resource.harvest(operation.harvester, operation.amount);
                if (harvested > 0) {
                    processedCount++;
                }
            }
        }
        
        if (processedCount > 0) {
            this.harvest_queue_processed.emit(this, processedCount);
        }
    }
    
    /**
     * Start the update loop for regeneration and queue processing
     * @private
     */
    startUpdateLoop() {
        const updateInterval = 1000; // 1 second
        
        setInterval(() => {
            this.updateRegeneration();
            this.processHarvestQueue();
            this.updateStatistics();
        }, updateInterval);
    }
    
    /**
     * Update resource regeneration
     * @private
     */
    updateRegeneration() {
        const regeneratedResources = [];
        
        for (const resource of this.resources.values()) {
            const previousAmount = resource.amount;
            resource.updateRegeneration();
            
            if (resource.amount > previousAmount) {
                regeneratedResources.push({
                    id: resource.id,
                    type: resource.type,
                    regenerated: resource.amount - previousAmount
                });
            }
        }
        
        if (regeneratedResources.length > 0) {
            this.regeneration_tick.emit(this, regeneratedResources);
        }
    }
    
    /**
     * Update and emit statistics
     * @private
     */
    updateStatistics() {
        const statistics = this.getStatistics();
        this.statistics_updated.emit(this, statistics);
        
        eventBus.emit('resource_statistics_updated', statistics, this);
    }
    
    /**
     * Generate a unique resource ID
     * @returns {string} Unique resource ID
     * @private
     */
    generateResourceId() {
        return `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get storage amount for a resource type
     * @param {string} resourceType - Resource type
     * @returns {number} Storage amount
     */
    getStorageAmount(resourceType) {
        return this.storage.get(resourceType) || 0;
    }
    
    /**
     * Get storage capacity for a resource type
     * @param {string} resourceType - Resource type
     * @returns {number} Storage capacity
     */
    getStorageCapacity(resourceType) {
        return this.storageCapacity.get(resourceType) || this.maxStoragePerType;
    }
    
    /**
     * Set storage capacity for a resource type
     * @param {string} resourceType - Resource type
     * @param {number} capacity - New capacity
     */
    setStorageCapacity(resourceType, capacity) {
        const oldCapacity = this.storageCapacity.get(resourceType) || this.maxStoragePerType;
        this.storageCapacity.set(resourceType, capacity);
        
        this.storage_capacity_changed.emit(this, resourceType, capacity);
        eventBus.emit('storage_capacity_changed', {
            resourceType: resourceType,
            newCapacity: capacity,
            previousCapacity: oldCapacity
        }, this);
    }
    
    /**
     * Get comprehensive statistics
     * @returns {object} Statistics object
     */
    getStatistics() {
        const stats = {
            totalResources: this.resources.size,
            discoveredResources: this.discoveredResources.size,
            resourceTypes: this.resourcesByType.size,
            storage: {},
            storageUsage: {},
            resourcesByType: {},
            harvestQueue: this.harvestingQueue.length,
            timestamp: Date.now()
        };
        
        // Storage statistics
        for (const [type, amount] of this.storage.entries()) {
            const capacity = this.getStorageCapacity(type);
            stats.storage[type] = amount;
            stats.storageUsage[type] = {
                amount: amount,
                capacity: capacity,
                percentage: capacity > 0 ? (amount / capacity) * 100 : 0
            };
        }
        
        // Resources by type statistics
        for (const [type, resourceIds] of this.resourcesByType.entries()) {
            const resources = Array.from(resourceIds).map(id => this.resources.get(id)).filter(r => r);
            stats.resourcesByType[type] = {
                count: resources.length,
                totalAmount: resources.reduce((sum, r) => sum + r.amount, 0),
                discovered: resources.filter(r => r.isDiscovered).length,
                beingHarvested: resources.filter(r => r.isBeingHarvested).length
            };
        }
        
        return stats;
    }
    
    /**
     * Get simplified API for resource management
     * @returns {object} Simplified API
     */
    getAPI() {
        return {
            // Resource management
            addResource: (type, amount, position, props) => this.addResource(type, amount, position, props),
            getResource: (id) => this.getResource(id),
            getResourcesByType: (type) => this.getResourcesByType(type),
            findNearby: (position, range, type) => this.findResourcesInRange(position, range, type),
            
            // Discovery
            survey: (area, surveyor) => this.surveyArea(area, surveyor),
            
            // Storage
            getStorage: (type) => this.getStorageAmount(type),
            getCapacity: (type) => this.getStorageCapacity(type),
            setCapacity: (type, capacity) => this.setStorageCapacity(type, capacity),
            
            // Harvesting
            queueHarvest: (harvester, resourceId, amount) => this.queueHarvest(harvester, resourceId, amount),
            
            // Statistics
            getStats: () => this.getStatistics(),
            
            // Event listening
            onResourceDiscovered: (callback) => this.resource_added.connect(callback),
            onStorageChanged: (callback) => this.storage_changed.connect(callback),
            onResourceDepleted: (callback) => eventBus.on('resource_depleted', callback)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Resource,
        SignalEnhancedResourceManager
    };
}

// For browser environments
if (typeof window !== 'undefined') {
    window.Resource = Resource;
    window.SignalEnhancedResourceManager = SignalEnhancedResourceManager;
}