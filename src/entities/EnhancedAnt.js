/**
 * @fileoverview Enhanced Ant Class with Signal System Integration
 * Extends the base Ant class with comprehensive signal system support
 * for event-driven architecture and simplified API access.
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

// Note: GameObject, Signal, and eventBus are available globally from SignalSystem.js and EventBus.js

/**
 * Enhanced Ant class with signal system integration
 * Provides event-driven functionality for ant lifecycle and behavior
 */
class EnhancedAnt extends GameObject {
    constructor(id, position = { x: 0, y: 0 }, job = 'Worker', stats = {}) {
        super(`Ant_${id}`);
        
        // Core ant properties
        this.id = id;
        this.position = { ...position };
        this.job = job;
        this.previousJob = null;
        this.level = stats.level || 1;
        this.experience = stats.experience || 0;
        this.health = stats.health || 100;
        this.maxHealth = stats.maxHealth || 100;
        this.energy = stats.energy || 100;
        this.maxEnergy = stats.maxEnergy || 100;
        this.speed = stats.speed || 1.0;
        this.strength = stats.strength || 1.0;
        this.intelligence = stats.intelligence || 1.0;
        
        // State management
        this.isAlive = true;
        this.isSelected = false;
        this.currentTask = null;
        this.inventory = new Map();
        this.maxInventorySize = 10;
        
        // Movement and pathfinding
        this.targetPosition = null;
        this.path = [];
        this.movementSpeed = 2.0;
        this.isMoving = false;
        
        // Combat properties
        this.isInCombat = false;
        this.combatTarget = null;
        this.attackDamage = 10;
        this.defense = 5;
        
        // Declare ant-specific signals
        this.initializeSignals();
        
        // Emit spawn event
        this.emitSpawnEvent();
    }
    
    /**
     * Initialize all ant-specific signals
     * @private
     */
    initializeSignals() {
        // Lifecycle signals
        this.declareSignal('spawned', 'ant', 'position', 'job');
        this.declareSignal('destroyed', 'ant', 'cause');
        this.declareSignal('level_up', 'ant', 'newLevel', 'previousLevel');
        
        // Job and state signals
        this.declareSignal('job_changed', 'ant', 'newJob', 'previousJob');
        this.declareSignal('task_assigned', 'ant', 'task');
        this.declareSignal('task_completed', 'ant', 'task', 'result');
        this.declareSignal('task_failed', 'ant', 'task', 'reason');
        
        // Health and energy signals
        this.declareSignal('health_changed', 'ant', 'newHealth', 'previousHealth');
        this.declareSignal('energy_changed', 'ant', 'newEnergy', 'previousEnergy');
        this.declareSignal('died', 'ant', 'cause');
        this.declareSignal('revived', 'ant');
        
        // Movement signals
        this.declareSignal('movement_started', 'ant', 'targetPosition');
        this.declareSignal('movement_completed', 'ant', 'finalPosition');
        this.declareSignal('movement_interrupted', 'ant', 'reason');
        this.declareSignal('position_changed', 'ant', 'newPosition', 'previousPosition');
        
        // Inventory signals
        this.declareSignal('item_picked_up', 'ant', 'item', 'amount');
        this.declareSignal('item_dropped', 'ant', 'item', 'amount');
        this.declareSignal('inventory_full', 'ant');
        this.declareSignal('inventory_empty', 'ant');
        
        // Combat signals
        this.declareSignal('combat_started', 'ant', 'target');
        this.declareSignal('combat_ended', 'ant', 'target', 'result');
        this.declareSignal('attacked', 'ant', 'attacker', 'damage');
        this.declareSignal('attack_performed', 'ant', 'target', 'damage');
        
        // Selection and UI signals
        this.declareSignal('selected', 'ant');
        this.declareSignal('deselected', 'ant');
        this.declareSignal('status_changed', 'ant', 'newStatus');
    }
    
    /**
     * Emit spawn event through both signal system and event bus
     * @private
     */
    emitSpawnEvent() {
        // Emit through signal system
        this.spawned.emit(this, this.position, this.job);
        
        // Emit through event bus for global listeners
        eventBus.emit('ant_spawned', {
            id: this.id,
            position: { ...this.position },
            job: this.job,
            stats: this.getStats()
        }, this);
    }
    
    /**
     * Change the ant's job
     * @param {string} newJob - New job type
     * @returns {boolean} True if job was changed successfully
     */
    changeJob(newJob) {
        if (this.job === newJob) {
            return false;
        }
        
        const oldJob = this.job;
        this.previousJob = oldJob;
        this.job = newJob;
        
        // Emit signals
        this.job_changed.emit(this, newJob, oldJob);
        eventBus.emit('ant_job_changed', {
            id: this.id,
            newJob: newJob,
            previousJob: oldJob
        }, this);
        
        return true;
    }
    
    /**
     * Assign a task to the ant
     * @param {object} task - Task object
     */
    assignTask(task) {
        this.currentTask = task;
        this.task_assigned.emit(this, task);
        
        eventBus.emit('ant_task_assigned', {
            antId: this.id,
            task: task,
            assignedAt: Date.now()
        }, this);
    }
    
    /**
     * Complete the current task
     * @param {any} result - Task completion result
     */
    completeTask(result = null) {
        if (this.currentTask) {
            const completedTask = this.currentTask;
            this.currentTask = null;
            
            this.task_completed.emit(this, completedTask, result);
            eventBus.emit('ant_task_completed', {
                antId: this.id,
                task: completedTask,
                result: result,
                completedAt: Date.now()
            }, this);
        }
    }
    
    /**
     * Fail the current task
     * @param {string} reason - Reason for failure
     */
    failTask(reason = 'Unknown') {
        if (this.currentTask) {
            const failedTask = this.currentTask;
            this.currentTask = null;
            
            this.task_failed.emit(this, failedTask, reason);
            eventBus.emit('ant_task_failed', {
                antId: this.id,
                task: failedTask,
                reason: reason,
                failedAt: Date.now()
            }, this);
        }
    }
    
    /**
     * Change ant's health
     * @param {number} newHealth - New health value
     * @param {string} cause - Cause of health change
     */
    setHealth(newHealth, cause = 'unknown') {
        const previousHealth = this.health;
        this.health = Math.max(0, Math.min(newHealth, this.maxHealth));
        
        if (this.health !== previousHealth) {
            this.health_changed.emit(this, this.health, previousHealth);
            eventBus.emit('ant_health_changed', {
                antId: this.id,
                newHealth: this.health,
                previousHealth: previousHealth,
                cause: cause
            }, this);
            
            // Check for death
            if (this.health <= 0 && this.isAlive) {
                this.die(cause);
            }
        }
    }
    
    /**
     * Kill the ant
     * @param {string} cause - Cause of death
     */
    die(cause = 'unknown') {
        if (!this.isAlive) return;
        
        this.isAlive = false;
        this.health = 0;
        
        this.died.emit(this, cause);
        this.destroyed.emit(this, cause);
        
        eventBus.emit('ant_died', {
            antId: this.id,
            cause: cause,
            position: { ...this.position },
            diedAt: Date.now()
        }, this);
        
        eventBus.emit('ant_destroyed', {
            id: this.id,
            cause: cause,
            position: { ...this.position }
        }, this);
    }
    
    /**
     * Revive the ant
     * @param {number} healthAmount - Health to revive with
     */
    revive(healthAmount = null) {
        if (this.isAlive) return;
        
        this.isAlive = true;
        this.health = healthAmount !== null ? healthAmount : this.maxHealth;
        
        this.revived.emit(this);
        eventBus.emit('ant_revived', {
            antId: this.id,
            health: this.health,
            revivedAt: Date.now()
        }, this);
    }
    
    /**
     * Move ant to a target position
     * @param {object} targetPosition - Target {x, y} position
     * @param {Array} path - Optional pathfinding path
     */
    moveTo(targetPosition, path = []) {
        if (!this.isAlive) return false;
        
        this.targetPosition = { ...targetPosition };
        this.path = [...path];
        this.isMoving = true;
        
        this.movement_started.emit(this, targetPosition);
        eventBus.emit('ant_movement_started', {
            antId: this.id,
            from: { ...this.position },
            to: { ...targetPosition },
            path: [...path]
        }, this);
        
        return true;
    }
    
    /**
     * Update ant position
     * @param {object} newPosition - New {x, y} position
     */
    setPosition(newPosition) {
        const previousPosition = { ...this.position };
        this.position = { ...newPosition };
        
        this.position_changed.emit(this, this.position, previousPosition);
        eventBus.emit('ant_position_changed', {
            antId: this.id,
            newPosition: { ...this.position },
            previousPosition: previousPosition
        }, this);
        
        // Check if reached target
        if (this.targetPosition && 
            Math.abs(this.position.x - this.targetPosition.x) < 1 && 
            Math.abs(this.position.y - this.targetPosition.y) < 1) {
            this.completeMovement();
        }
    }
    
    /**
     * Complete movement to target
     * @private
     */
    completeMovement() {
        this.isMoving = false;
        const finalPosition = { ...this.position };
        this.targetPosition = null;
        this.path = [];
        
        this.movement_completed.emit(this, finalPosition);
        eventBus.emit('ant_movement_completed', {
            antId: this.id,
            finalPosition: finalPosition,
            completedAt: Date.now()
        }, this);
    }
    
    /**
     * Pick up an item
     * @param {string} itemType - Type of item
     * @param {number} amount - Amount to pick up
     * @returns {boolean} True if item was picked up
     */
    pickUpItem(itemType, amount = 1) {
        if (this.getInventorySize() >= this.maxInventorySize) {
            this.inventory_full.emit(this);
            return false;
        }
        
        const currentAmount = this.inventory.get(itemType) || 0;
        this.inventory.set(itemType, currentAmount + amount);
        
        this.item_picked_up.emit(this, itemType, amount);
        eventBus.emit('resource_collected', {
            collector: { id: this.id, job: this.job },
            resource: { type: itemType },
            amount: amount
        }, this);
        
        return true;
    }
    
    /**
     * Drop an item
     * @param {string} itemType - Type of item
     * @param {number} amount - Amount to drop
     * @returns {boolean} True if item was dropped
     */
    dropItem(itemType, amount = 1) {
        const currentAmount = this.inventory.get(itemType) || 0;
        if (currentAmount <= 0) return false;
        
        const dropAmount = Math.min(amount, currentAmount);
        const newAmount = currentAmount - dropAmount;
        
        if (newAmount <= 0) {
            this.inventory.delete(itemType);
        } else {
            this.inventory.set(itemType, newAmount);
        }
        
        this.item_dropped.emit(this, itemType, dropAmount);
        eventBus.emit('ant_item_dropped', {
            antId: this.id,
            itemType: itemType,
            amount: dropAmount,
            position: { ...this.position }
        }, this);
        
        if (this.getInventorySize() === 0) {
            this.inventory_empty.emit(this);
        }
        
        return true;
    }
    
    /**
     * Get current inventory size
     * @returns {number} Number of different item types in inventory
     */
    getInventorySize() {
        return this.inventory.size;
    }
    
    /**
     * Start combat with target
     * @param {EnhancedAnt} target - Target ant
     */
    startCombat(target) {
        if (this.isInCombat || !this.isAlive || !target.isAlive) return;
        
        this.isInCombat = true;
        this.combatTarget = target;
        
        this.combat_started.emit(this, target);
        eventBus.emit('combat_initiated', {
            attacker: { id: this.id, job: this.job },
            defender: { id: target.id, job: target.job },
            startedAt: Date.now()
        }, this);
    }
    
    /**
     * Perform attack on target
     * @param {EnhancedAnt} target - Target to attack
     * @returns {number} Damage dealt
     */
    attack(target) {
        if (!this.isAlive || !target.isAlive) return 0;
        
        const damage = Math.max(1, this.attackDamage - target.defense);
        
        this.attack_performed.emit(this, target, damage);
        target.attacked.emit(target, this, damage);
        
        target.setHealth(target.health - damage, 'combat');
        
        eventBus.emit('ant_attack', {
            attackerId: this.id,
            targetId: target.id,
            damage: damage,
            timestamp: Date.now()
        }, this);
        
        return damage;
    }
    
    /**
     * End combat
     * @param {string} result - Combat result ('victory', 'defeat', 'interrupted')
     */
    endCombat(result = 'interrupted') {
        if (!this.isInCombat) return;
        
        const target = this.combatTarget;
        this.isInCombat = false;
        this.combatTarget = null;
        
        this.combat_ended.emit(this, target, result);
        eventBus.emit('combat_resolved', {
            participant1: { id: this.id, job: this.job },
            participant2: target ? { id: target.id, job: target.job } : null,
            result: result,
            endedAt: Date.now()
        }, this);
    }
    
    /**
     * Select this ant
     */
    select() {
        if (this.isSelected) return;
        
        this.isSelected = true;
        this.selected.emit(this);
        eventBus.emit('ui_selection_changed', {
            selected: [{ id: this.id, type: 'ant' }],
            deselected: []
        }, this);
    }
    
    /**
     * Deselect this ant
     */
    deselect() {
        if (!this.isSelected) return;
        
        this.isSelected = false;
        this.deselected.emit(this);
        eventBus.emit('ui_selection_changed', {
            selected: [],
            deselected: [{ id: this.id, type: 'ant' }]
        }, this);
    }
    
    /**
     * Level up the ant
     * @param {number} newLevel - New level (optional, defaults to current + 1)
     */
    levelUp(newLevel = null) {
        const previousLevel = this.level;
        this.level = newLevel || (this.level + 1);
        
        // Increase stats based on level
        this.maxHealth += 10;
        this.maxEnergy += 5;
        this.attackDamage += 2;
        this.defense += 1;
        
        // Restore health and energy
        this.health = this.maxHealth;
        this.energy = this.maxEnergy;
        
        this.level_up.emit(this, this.level, previousLevel);
        eventBus.emit('ant_level_up', {
            antId: this.id,
            newLevel: this.level,
            previousLevel: previousLevel,
            newStats: this.getStats()
        }, this);
    }
    
    /**
     * Get ant statistics
     * @returns {object} Stats object
     */
    getStats() {
        return {
            level: this.level,
            experience: this.experience,
            health: this.health,
            maxHealth: this.maxHealth,
            energy: this.energy,
            maxEnergy: this.maxEnergy,
            speed: this.speed,
            strength: this.strength,
            intelligence: this.intelligence,
            attackDamage: this.attackDamage,
            defense: this.defense
        };
    }
    
    /**
     * Get ant status for UI display
     * @returns {object} Status object
     */
    getStatus() {
        return {
            id: this.id,
            job: this.job,
            level: this.level,
            health: this.health,
            maxHealth: this.maxHealth,
            energy: this.energy,
            maxEnergy: this.maxEnergy,
            position: { ...this.position },
            isAlive: this.isAlive,
            isSelected: this.isSelected,
            isMoving: this.isMoving,
            isInCombat: this.isInCombat,
            currentTask: this.currentTask ? this.currentTask.type : null,
            inventoryCount: this.getInventorySize()
        };
    }
    
    /**
     * Create a simplified API interface for this ant
     * @returns {object} Simplified API object
     */
    getAPI() {
        return {
            // Basic properties
            id: this.id,
            position: () => ({ ...this.position }),
            job: () => this.job,
            health: () => this.health,
            isAlive: () => this.isAlive,
            
            // Actions
            moveTo: (pos, path) => this.moveTo(pos, path),
            changeJob: (job) => this.changeJob(job),
            pickUp: (item, amount) => this.pickUpItem(item, amount),
            drop: (item, amount) => this.dropItem(item, amount),
            attack: (target) => this.attack(target),
            
            // Event listening (simplified)
            onHealthChange: (callback) => this.health_changed.connect(callback),
            onJobChange: (callback) => this.job_changed.connect(callback),
            onTaskComplete: (callback) => this.task_completed.connect(callback),
            onDeath: (callback) => this.died.connect(callback),
            
            // Status
            getStatus: () => this.getStatus(),
            getStats: () => this.getStats()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EnhancedAnt
    };
}

// For browser environments
if (typeof window !== 'undefined') {
    window.EnhancedAnt = EnhancedAnt;
}