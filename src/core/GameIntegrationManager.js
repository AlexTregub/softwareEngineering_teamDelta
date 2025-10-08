/**
 * @fileoverview Game System Integration - Signal-Based Architecture
 * Demonstrates how the signal system integrates with existing game systems
 * to provide event-driven architecture and simplified API access.
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

// Note: EnhancedAnt, SignalEnhancedResourceManager, and eventBus are available globally

/**
 * Game Integration Manager
 * Orchestrates the integration between different game systems using signals
 */
class GameIntegrationManager {
    constructor() {
        this.ants = new Map();
        this.resourceManager = new SignalEnhancedResourceManager();
        this.uiCallbacks = new Map();
        this.gameState = {
            isRunning: false,
            isPaused: false,
            level: 1,
            score: 0,
            time: 0
        };
        
        this.initializeSystemIntegration();
        this.setupEventListeners();
    }
    
    /**
     * Initialize integration between different systems
     * @private
     */
    initializeSystemIntegration() {
        // Setup cross-system event listeners
        this.setupAntResourceIntegration();
        this.setupUIIntegration();
        this.setupGameStateIntegration();
    }
    
    /**
     * Setup ant-resource system integration
     * @private
     */
    setupAntResourceIntegration() {
        // When an ant is created, automatically discover nearby resources
        eventBus.on('ant_spawned', (data, context) => {
            const ant = context;
            if (ant && ant.position) {
                // Auto-discover resources in spawn area
                const area = {
                    x: ant.position.x - 25,
                    y: ant.position.y - 25,
                    width: 50,
                    height: 50
                };
                this.resourceManager.surveyArea(area, ant);
            }
        });
        
        // When ant changes job to Gatherer, find nearby resources
        eventBus.on('ant_job_changed', (data, context) => {
            if (data.newJob === 'Gatherer') {
                const ant = context;
                const nearbyResources = this.resourceManager.findResourcesInRange(
                    ant.position, 100
                );
                
                // Auto-assign gathering task for closest resource
                if (nearbyResources.length > 0) {
                    const targetResource = nearbyResources[0];
                    ant.assignTask({
                        type: 'gather',
                        target: targetResource.id,
                        amount: 10
                    });
                }
            }
        });
        
        // Auto-collect resources when ant completes gathering task
        eventBus.on('ant_task_completed', (data, context) => {
            if (data.task && data.task.type === 'gather') {
                const ant = context;
                const resourceId = data.task.target;
                const resource = this.resourceManager.getResource(resourceId);
                
                if (resource) {
                    const harvested = resource.harvest(ant, data.task.amount);
                    if (harvested > 0) {
                        ant.pickUpItem(resource.type, harvested);
                    }
                }
            }
        });
    }
    
    /**
     * Setup UI system integration
     * @private
     */
    setupUIIntegration() {
        // Aggregate ant events for UI updates
        const uiUpdateData = {
            antCount: 0,
            selectedAnts: [],
            resources: {},
            notifications: []
        };
        
        eventBus.on('ant_spawned', (data) => {
            uiUpdateData.antCount++;
            uiUpdateData.notifications.push(`Ant ${data.id} spawned as ${data.job}`);
            this.notifyUI('ant_count_changed', uiUpdateData.antCount);
        });
        
        eventBus.on('ant_destroyed', (data) => {
            uiUpdateData.antCount--;
            uiUpdateData.notifications.push(`Ant ${data.id} was destroyed`);
            this.notifyUI('ant_count_changed', uiUpdateData.antCount);
        });
        
        eventBus.on('ui_selection_changed', (data) => {
            uiUpdateData.selectedAnts = data.selected;
            this.notifyUI('selection_changed', data);
        });
        
        eventBus.on('resource_collected', (data) => {
            const resourceType = data.resource.type;
            if (!uiUpdateData.resources[resourceType]) {
                uiUpdateData.resources[resourceType] = 0;
            }
            uiUpdateData.resources[resourceType] += data.amount;
            
            this.notifyUI('resource_updated', {
                type: resourceType,
                amount: uiUpdateData.resources[resourceType],
                change: data.amount
            });
        });
        
        // Batch UI updates to prevent spam
        setInterval(() => {
            if (uiUpdateData.notifications.length > 0) {
                this.notifyUI('notifications_batch', [...uiUpdateData.notifications]);
                uiUpdateData.notifications = [];
            }
        }, 1000);
    }
    
    /**
     * Setup game state integration
     * @private
     */
    setupGameStateIntegration() {
        // Update score based on resource collection
        eventBus.on('resource_collected', (data) => {
            const points = data.amount * 10; // 10 points per resource unit
            this.gameState.score += points;
            eventBus.emit('score_changed', {
                newScore: this.gameState.score,
                change: points,
                reason: `Collected ${data.amount} ${data.resource.type}`
            });
        });
        
        // Level progression based on ant count and resources
        eventBus.on('ant_spawned', () => {
            this.checkLevelProgression();
        });
        
        eventBus.on('resource_storage_full', () => {
            this.checkLevelProgression();
        });
    }
    
    /**
     * Setup global event listeners
     * @private
     */
    setupEventListeners() {
        // Global error handling
        eventBus.addGlobalListener((event) => {
            if (event.name.includes('error') || event.name.includes('failed')) {
                console.warn(`Game Event Warning: ${event.name}`, event.data);
            }
        }, 'error_monitor');
        
        // Performance monitoring
        eventBus.addGlobalListener((event) => {
            // Track high-frequency events for performance analysis
            const highFrequencyEvents = ['ant_position_changed', 'resource_regenerated'];
            if (highFrequencyEvents.includes(event.name)) {
                // Could implement throttling or batching here
            }
        }, 'performance_monitor');
    }
    
    /**
     * Create and spawn a new ant
     * @param {string} job - Ant job type
     * @param {object} position - Spawn position
     * @param {object} stats - Optional stat overrides
     * @returns {EnhancedAnt} The created ant
     */
    spawnAnt(job = 'Worker', position = null, stats = {}) {
        const id = this.generateAntId();
        const spawnPosition = position || this.getRandomSpawnPosition();
        
        const ant = new EnhancedAnt(id, spawnPosition, job, stats);
        this.ants.set(id, ant);
        
        // The ant will automatically emit its spawn events
        
        return ant;
    }
    
    /**
     * Get ant by ID
     * @param {string} antId - Ant ID
     * @returns {EnhancedAnt|null} Ant or null if not found
     */
    getAnt(antId) {
        return this.ants.get(antId) || null;
    }
    
    /**
     * Get all ants
     * @returns {Array<EnhancedAnt>} Array of all ants
     */
    getAllAnts() {
        return Array.from(this.ants.values());
    }
    
    /**
     * Get ants by job type
     * @param {string} job - Job type
     * @returns {Array<EnhancedAnt>} Array of ants with specified job
     */
    getAntsByJob(job) {
        return Array.from(this.ants.values()).filter(ant => ant.job === job);
    }
    
    /**
     * Remove an ant from the game
     * @param {string} antId - Ant ID
     * @param {string} cause - Cause of removal
     * @returns {boolean} True if ant was removed
     */
    removeAnt(antId, cause = 'removed') {
        const ant = this.ants.get(antId);
        if (!ant) return false;
        
        ant.die(cause);
        ant.destroy();
        this.ants.delete(antId);
        
        return true;
    }
    
    /**
     * Create resources in the game world
     * @param {Array} resourceConfigs - Array of resource configurations
     */
    createResources(resourceConfigs) {
        resourceConfigs.forEach(config => {
            this.resourceManager.addResource(
                config.type,
                config.amount,
                config.position,
                config.properties || {}
            );
        });
    }
    
    /**
     * Register UI callback for specific event types
     * @param {string} eventType - Event type to listen for
     * @param {Function} callback - Callback function
     * @returns {string} Registration ID for unregistering
     */
    registerUICallback(eventType, callback) {
        const id = `ui_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        if (!this.uiCallbacks.has(eventType)) {
            this.uiCallbacks.set(eventType, new Map());
        }
        
        this.uiCallbacks.get(eventType).set(id, callback);
        
        return id;
    }
    
    /**
     * Unregister UI callback
     * @param {string} eventType - Event type
     * @param {string} registrationId - Registration ID
     * @returns {boolean} True if callback was removed
     */
    unregisterUICallback(eventType, registrationId) {
        const callbacks = this.uiCallbacks.get(eventType);
        if (callbacks) {
            return callbacks.delete(registrationId);
        }
        return false;
    }
    
    /**
     * Notify UI systems of events
     * @param {string} eventType - Event type
     * @param {any} data - Event data
     * @private
     */
    notifyUI(eventType, data) {
        const callbacks = this.uiCallbacks.get(eventType);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.warn(`UI callback error for ${eventType}:`, error);
                }
            });
        }
    }
    
    /**
     * Check if level progression conditions are met
     * @private
     */
    checkLevelProgression() {
        const totalAnts = this.ants.size;
        const totalResources = Object.values(this.resourceManager.getStatistics().storage)
            .reduce((sum, amount) => sum + amount, 0);
        
        // Simple level progression logic
        const requiredAnts = this.gameState.level * 5;
        const requiredResources = this.gameState.level * 100;
        
        if (totalAnts >= requiredAnts && totalResources >= requiredResources) {
            this.advanceLevel();
        }
    }
    
    /**
     * Advance to next level
     * @private
     */
    advanceLevel() {
        const previousLevel = this.gameState.level;
        this.gameState.level++;
        
        eventBus.emit('level_completed', {
            previousLevel: previousLevel,
            newLevel: this.gameState.level,
            score: this.gameState.score,
            statistics: {
                antCount: this.ants.size,
                resourcesCollected: this.resourceManager.getStatistics()
            }
        });
        
        // Bonus score for level completion
        this.gameState.score += previousLevel * 500;
    }
    
    /**
     * Generate unique ant ID
     * @returns {string} Unique ant ID
     * @private
     */
    generateAntId() {
        return `ant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get random spawn position
     * @returns {object} Random position
     * @private
     */
    getRandomSpawnPosition() {
        return {
            x: Math.random() * 800,
            y: Math.random() * 600
        };
    }
    
    /**
     * Start the game
     */
    startGame() {
        this.gameState.isRunning = true;
        this.gameState.isPaused = false;
        this.gameState.time = Date.now();
        
        eventBus.emit('game_started', {
            level: this.gameState.level,
            timestamp: this.gameState.time
        });
    }
    
    /**
     * Pause the game
     */
    pauseGame() {
        if (!this.gameState.isRunning || this.gameState.isPaused) return;
        
        this.gameState.isPaused = true;
        eventBus.emit('game_paused', {
            timestamp: Date.now()
        });
    }
    
    /**
     * Resume the game
     */
    resumeGame() {
        if (!this.gameState.isRunning || !this.gameState.isPaused) return;
        
        this.gameState.isPaused = false;
        eventBus.emit('game_resumed', {
            timestamp: Date.now()
        });
    }
    
    /**
     * End the game
     * @param {string} reason - Reason for ending
     */
    endGame(reason = 'user_request') {
        this.gameState.isRunning = false;
        this.gameState.isPaused = false;
        
        eventBus.emit('game_ended', {
            reason: reason,
            finalScore: this.gameState.score,
            level: this.gameState.level,
            duration: Date.now() - this.gameState.time,
            statistics: this.getGameStatistics()
        });
    }
    
    /**
     * Get comprehensive game statistics
     * @returns {object} Game statistics
     */
    getGameStatistics() {
        return {
            gameState: { ...this.gameState },
            antStatistics: {
                total: this.ants.size,
                byJob: this.getAntJobBreakdown(),
                alive: Array.from(this.ants.values()).filter(ant => ant.isAlive).length
            },
            resourceStatistics: this.resourceManager.getStatistics(),
            eventStatistics: eventBus.global().getStatistics()
        };
    }
    
    /**
     * Get breakdown of ants by job
     * @returns {object} Job breakdown
     * @private
     */
    getAntJobBreakdown() {
        const breakdown = {};
        for (const ant of this.ants.values()) {
            if (!breakdown[ant.job]) {
                breakdown[ant.job] = 0;
            }
            breakdown[ant.job]++;
        }
        return breakdown;
    }
    
    /**
     * Get simplified API for game management
     * @returns {object} Simplified API
     */
    getAPI() {
        return {
            // Ant management
            spawnAnt: (job, position, stats) => this.spawnAnt(job, position, stats),
            getAnt: (id) => this.getAnt(id),
            getAllAnts: () => this.getAllAnts(),
            getAntsByJob: (job) => this.getAntsByJob(job),
            
            // Resource management
            resources: this.resourceManager.getAPI(),
            
            // Game state
            startGame: () => this.startGame(),
            pauseGame: () => this.pauseGame(),
            resumeGame: () => this.resumeGame(),
            endGame: (reason) => this.endGame(reason),
            
            // UI integration
            onUIEvent: (eventType, callback) => this.registerUICallback(eventType, callback),
            offUIEvent: (eventType, id) => this.unregisterUICallback(eventType, id),
            
            // Statistics
            getStats: () => this.getGameStatistics(),
            
            // Events
            on: (eventName, callback) => eventBus.on(eventName, callback),
            emit: (eventName, data, context) => eventBus.emit(eventName, data, context)
        };
    }
}

/**
 * Example usage patterns demonstrating simplified ant game API
 */
const ExampleUsage = {
    /**
     * Basic game setup and ant management
     */
    basicSetup: () => {
        const game = new GameIntegrationManager();
        
        // Create some initial resources
        game.createResources([
            { type: 'Wood', amount: 100, position: { x: 200, y: 300 } },
            { type: 'Stone', amount: 75, position: { x: 400, y: 150 } },
            { type: 'Food', amount: 50, position: { x: 600, y: 400 } }
        ]);
        
        // Spawn initial ants
        const worker1 = game.spawnAnt('Worker', { x: 100, y: 200 });
        const gatherer1 = game.spawnAnt('Gatherer', { x: 150, y: 250 });
        const scout1 = game.spawnAnt('Scout', { x: 300, y: 100 });
        
        // Start the game
        game.startGame();
        
        return { game, ants: [worker1, gatherer1, scout1] };
    },
    
    /**
     * Event-driven ant behavior
     */
    eventDrivenBehavior: (game) => {
        // Listen for ant events and respond
        game.getAPI().on('ant_spawned', (data, context) => {
            console.log(`New ant spawned: ${data.id} as ${data.job}`);
            
            // Auto-assign task based on job
            if (data.job === 'Gatherer') {
                const ant = context;
                const nearbyResources = game.resourceManager.findResourcesInRange(
                    ant.position, 100, 'Wood'
                );
                
                if (nearbyResources.length > 0) {
                    ant.assignTask({
                        type: 'gather',
                        target: nearbyResources[0].id,
                        amount: 25
                    });
                }
            }
        });
        
        // Monitor resource collection for UI updates
        game.getAPI().on('resource_collected', (data) => {
            console.log(`Collected ${data.amount} ${data.resource.type}`);
            
            // Could update UI here
            // updateResourceDisplay(data.resource.type, data.amount);
        });
        
        // Handle level progression
        game.getAPI().on('level_completed', (data) => {
            console.log(`Level ${data.previousLevel} completed! Advancing to level ${data.newLevel}`);
            
            // Spawn bonus ants for new level
            const bonusAnts = Math.floor(data.newLevel / 2);
            for (let i = 0; i < bonusAnts; i++) {
                game.spawnAnt('Worker');
            }
        });
    },
    
    /**
     * UI integration example
     */
    uiIntegration: (game) => {
        // Register UI callbacks for different events
        const antCountId = game.getAPI().onUIEvent('ant_count_changed', (count) => {
            console.log(`UI Update: Ant count is now ${count}`);
            // document.getElementById('ant-count').textContent = count;
        });
        
        const resourceId = game.getAPI().onUIEvent('resource_updated', (data) => {
            console.log(`UI Update: ${data.type} now at ${data.amount} (+${data.change})`);
            // updateResourceBar(data.type, data.amount);
        });
        
        const notificationId = game.getAPI().onUIEvent('notifications_batch', (notifications) => {
            console.log(`UI Update: ${notifications.length} new notifications`);
            // showNotifications(notifications);
        });
        
        // Return cleanup function
        return () => {
            game.getAPI().offUIEvent('ant_count_changed', antCountId);
            game.getAPI().offUIEvent('resource_updated', resourceId);
            game.getAPI().offUIEvent('notifications_batch', notificationId);
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GameIntegrationManager,
        ExampleUsage
    };
}

// For browser environments
if (typeof window !== 'undefined') {
    window.GameIntegrationManager = GameIntegrationManager;
    window.ExampleUsage = ExampleUsage;
}