/**
 * AntController
 * =============
 * Orchestration layer for ant entities (extends EntityController).
 * 
 * RESPONSIBILITIES:
 * - Coordinate AntModel and AntView
 * - Manage ant-specific systems (brain, state machine, job)
 * - Handle resource gathering and combat
 * - Integrate with existing ant systems (AntBrain, JobComponent, StateMachine)
 * - Publish lifecycle events via EventManager (ANT_DAMAGED, ANT_DIED, etc.)
 * - NO rendering (delegates to view)
 * - NO data storage (delegates to model)
 * 
 * This extends EntityController with ant-specific orchestration.
 */

// Load dependencies
if (typeof EntityEvents === 'undefined') {
  if (typeof require !== 'undefined') {
    const EntityEvents = require('../../events/EntityEvents.js');
    if (typeof window !== 'undefined') window.EntityEvents = EntityEvents;
    if (typeof global !== 'undefined') global.EntityEvents = EntityEvents;
  }
}

// Load parent class
if (typeof EntityController === 'undefined') {
  if (typeof require !== 'undefined') {
    const EntityController = require('./EntityController.js');
    if (typeof window !== 'undefined') {
      window.EntityController = EntityController;
    }
    if (typeof global !== 'undefined') {
      global.EntityController = EntityController;
    }
  }
}

class AntController extends EntityController {
  /**
   * Create an ant controller
   * @param {AntModel} model - The ant data model
   * @param {AntView} view - The ant presentation layer
   * @param {Object} options - Configuration options
   */
  constructor(model, view, options = {}) {
    super(model, view, options);

    // Get EventManager instance for pub/sub
    this._eventBus = typeof EventManager !== 'undefined' ? EventManager.getInstance() : null;

    // Initialize ant-specific components
    this._initializeBrain();
    this._initializeStateMachine();
    this._initializeJobComponent();
    this._initializeAntEnhancedAPI();
    
    // Emit creation event
    this._emitEvent(EntityEvents.ANT_CREATED, {
      ant: this,
      jobName: this.model.getJobName(),
      position: this.model.getPosition()
    });
  }

  // ===== EVENT SYSTEM =====

  /**
   * Emit event via EventManager
   * @private
   * @param {string} eventName - Event name from EntityEvents
   * @param {Object} data - Event data
   */
  _emitEvent(eventName, data) {
    if (this._eventBus && typeof this._eventBus.emit === 'function') {
      this._eventBus.emit(eventName, data);
    }
  }

  // ===== ANT-SPECIFIC INITIALIZATION =====

  /**
   * Initialize brain component
   * @private
   */
  _initializeBrain() {
    // Load AntBrain if available
    const AntBrain = (typeof window !== 'undefined' && window.AntBrain) || 
                     (typeof global !== 'undefined' && global.AntBrain) || null;
    
    if (AntBrain) {
      const jobName = this.model.getJobName();
      this.brain = new AntBrain(this, jobName);
    } else {
      // Create minimal brain for testing
      this.brain = {
        antType: this.model.getJobName(),
        hunger: 0,
        flag_: '',
        followBuildTrail: 0.25,
        followForageTrail: 0.5,
        followFarmTrail: 0.25,
        followEnemyTrail: 0.25,
        followBossTrail: 100,
        penalizedTrails: [],
        setPriority: function(antType, mult) {
          this.antType = antType;
        },
        checkTrail: function(pheromone) { return false; },
        addPenalty: function(name, penalty) {},
        getPenalty: function(name) { return 1; },
        getTrailPriority: function(type) { return 0.5; },
        modifyPriorityTrails: function() {}
      };
    }
  }

  /**
   * Initialize state machine
   * @private
   */
  _initializeStateMachine() {
    // Load StateMachine if available
    const StateMachine = (typeof window !== 'undefined' && window.StateMachine) || 
                         (typeof global !== 'undefined' && global.StateMachine) || null;
    
    if (StateMachine) {
      this.stateMachine = new StateMachine(this);
    } else {
      // Create minimal state machine for testing
      this.stateMachine = {
        currentState: 'IDLE',
        setState: (state) => {
          const validStates = ['IDLE', 'MOVING', 'GATHERING', 'COMBAT', 'RETURNING'];
          if (validStates.includes(state)) {
            this.stateMachine.currentState = state;
          }
        },
        getCurrentState: () => this.stateMachine.currentState,
        canPerformAction: (action) => {
          // IDLE can do anything, COMBAT can't gather, etc.
          if (this.stateMachine.currentState === 'IDLE') return true;
          if (this.stateMachine.currentState === 'COMBAT' && action === 'gather') return false;
          return true;
        },
        update: () => {}
      };
    }
  }

  /**
   * Initialize job component
   * @private
   */
  _initializeJobComponent() {
    // Load JobComponent if available
    const JobComponent = (typeof window !== 'undefined' && window.JobComponent) || 
                         (typeof global !== 'undefined' && global.JobComponent) || null;
    
    if (JobComponent) {
      const jobName = this.model.getJobName();
      this.jobComponent = new JobComponent(jobName);
    } else {
      // Create minimal job component for testing
      this.jobComponent = {
        name: this.model.getJobName(),
        stats: this._getDefaultJobStats(this.model.getJobName())
      };
    }
  }

  /**
   * Get default job stats (fallback if JobComponent unavailable)
   * @private
   */
  _getDefaultJobStats(jobName) {
    const stats = {
      'Worker': { strength: 15, health: 100, gatherSpeed: 10, movementSpeed: 60 },
      'Warrior': { strength: 45, health: 300, gatherSpeed: 5, movementSpeed: 45 },
      'Scout': { strength: 10, health: 70, gatherSpeed: 8, movementSpeed: 85 },
      'Farmer': { strength: 15, health: 100, gatherSpeed: 35, movementSpeed: 50 },
      'Builder': { strength: 20, health: 120, gatherSpeed: 15, movementSpeed: 55 }
    };
    return stats[jobName] || stats['Worker'];
  }

  /**
   * Initialize ant-specific enhanced API
   * @private
   */
  _initializeAntEnhancedAPI() {
    // Job API namespace
    this.job = {
      set: (jobName) => this.setJob(jobName),
      get: () => this.model.getJobName(),
      getStats: () => this.model.getJobStats(),
      getAvailable: () => this.getAvailableJobs()
    };

    // Resource API namespace
    this.resources = {
      collect: (amount) => this.collectResource(amount),
      deposit: () => this.depositResources(),
      getCount: () => this.model.getResourceCount(),
      getCapacity: () => this.model.getResourceCapacity(),
      has: () => this.hasResources(),
      canGatherMore: () => this.canGatherMore()
    };

    // State API namespace
    this.state = {
      set: (state) => this.setState(state),
      get: () => this.getCurrentState(),
      canPerform: (action) => this.canPerformAction(action)
    };

    // Combat API namespace (extends parent)
    this.combat = {
      attack: (target) => this.attack(target),
      takeDamage: (damage) => this.takeDamage(damage),
      setTarget: (target) => this.setCombatTarget(target),
      getTarget: () => this.getCombatTarget(),
      clearTarget: () => this.clearCombatTarget(),
      isInCombat: () => this.isInCombat()
    };
  }

  // ===== JOB MANAGEMENT =====

  /**
   * Change ant's job
   * @param {string} jobName - New job name
   */
  setJob(jobName) {
    // Store old job for event
    const oldJob = this.model.getJobName();

    // Validate job name
    const validJobs = this.getAvailableJobs();
    if (!validJobs.includes(jobName)) {
      console.warn(`Invalid job name: ${jobName}, using Worker`);
      jobName = 'Worker';
    }

    // Update model
    this.model.setJobName(jobName);

    // Update job stats in model
    const stats = this._getJobStats(jobName);
    if (stats) {
      this.model.setJobStats(stats);
    }

    // Update brain
    if (this.brain && this.brain.setPriority) {
      this.brain.antType = jobName;
      this.brain.setPriority(jobName, 1);
    }

    // Update job component
    if (this.jobComponent) {
      this.jobComponent.name = jobName;
      this.jobComponent.stats = stats;
    }

    // Emit job changed event
    this._emitEvent(EntityEvents.ANT_JOB_CHANGED, {
      ant: this,
      oldJob: oldJob,
      newJob: jobName,
      stats: stats
    });
  }

  /**
   * Get job stats for a job name
   * @private
   */
  _getJobStats(jobName) {
    // Try JobComponent first
    const JobComponent = (typeof window !== 'undefined' && window.JobComponent) || 
                         (typeof global !== 'undefined' && global.JobComponent) || null;
    
    if (JobComponent && JobComponent.getJobStats) {
      return JobComponent.getJobStats(jobName);
    }

    // Fallback to defaults
    return this._getDefaultJobStats(jobName);
  }

  /**
   * Get list of available jobs
   * @returns {string[]} Array of job names
   */
  getAvailableJobs() {
    // Try JobComponent first
    const JobComponent = (typeof window !== 'undefined' && window.JobComponent) || 
                         (typeof global !== 'undefined' && global.JobComponent) || null;
    
    if (JobComponent && JobComponent.getJobList) {
      return JobComponent.getJobList();
    }

    // Fallback list
    return ['Worker', 'Warrior', 'Scout', 'Farmer', 'Builder'];
  }

  // ===== BRAIN MANAGEMENT =====

  /**
   * Set ant's hunger level
   * @param {number} hunger - Hunger value
   */
  setHunger(hunger) {
    if (this.brain) {
      this.brain.hunger = hunger;

      // Update brain flags based on hunger
      if (hunger >= 200) {
        this.brain.flag_ = 'death';
      } else if (hunger >= 160) {
        this.brain.flag_ = 'starving';
      } else if (hunger >= 100) {
        this.brain.flag_ = 'hungry';
      } else {
        this.brain.flag_ = 'reset';
      }

      // Modify trail priorities
      if (this.brain.modifyPriorityTrails) {
        this.brain.modifyPriorityTrails();
      }
    }
  }

  /**
   * Get ant's hunger level
   * @returns {number} Hunger value
   */
  getHunger() {
    return this.brain ? this.brain.hunger : 0;
  }

  // ===== STATE MACHINE MANAGEMENT =====

  /**
   * Set ant's state
   * @param {string} state - State name (IDLE, MOVING, GATHERING, etc.)
   */
  setState(state) {
    const oldState = this.getCurrentState();

    if (this.stateMachine && this.stateMachine.setState) {
      this.stateMachine.setState(state);
      
      // Update model state for view rendering
      this.model.setState(state);

      // Emit state changed event
      this._emitEvent(EntityEvents.ANT_STATE_CHANGED, {
        ant: this,
        oldState: oldState,
        newState: state
      });

      // Emit specific state events
      if (state === 'GATHERING') {
        this._emitEvent(EntityEvents.ANT_GATHERING_STARTED, { ant: this });
      }
    }
  }

  /**
   * Get current state
   * @returns {string} Current state name
   */
  getCurrentState() {
    if (this.stateMachine && this.stateMachine.getCurrentState) {
      return this.stateMachine.getCurrentState();
    }
    return this.model.getState();
  }

  /**
   * Check if action is allowed in current state
   * @param {string} action - Action name (move, gather, attack, etc.)
   * @returns {boolean} True if allowed
   */
  canPerformAction(action) {
    if (this.stateMachine && this.stateMachine.canPerformAction) {
      return this.stateMachine.canPerformAction(action);
    }
    return true; // Allow all by default
  }

  // ===== RESOURCE MANAGEMENT =====

  /**
   * Collect resources
   * @param {number} amount - Amount to collect
   * @returns {number} Actual amount collected
   */
  collectResource(amount) {
    const current = this.model.getResourceCount();
    const capacity = this.model.getResourceCapacity();
    const space = capacity - current;
    const collected = Math.min(amount, space);

    this.model.setResourceCount(current + collected);

    // Emit resource collected event
    if (collected > 0) {
      this._emitEvent(EntityEvents.ANT_RESOURCE_COLLECTED, {
        ant: this,
        amount: collected,
        totalCarried: current + collected,
        capacity: capacity
      });

      // Check if at max capacity
      if (current + collected >= capacity) {
        this._emitEvent(EntityEvents.ANT_CAPACITY_REACHED, {
          ant: this,
          capacity: capacity
        });
      }
    }

    return collected;
  }

  /**
   * Deposit all resources
   * @returns {number} Amount deposited
   */
  depositResources() {
    const amount = this.model.getResourceCount();
    this.model.setResourceCount(0);

    // Emit resource deposited event
    if (amount > 0) {
      this._emitEvent(EntityEvents.ANT_RESOURCE_DEPOSITED, {
        ant: this,
        amount: amount,
        dropoff: null // Can be enhanced to track dropoff location
      });
    }

    return amount;
  }

  /**
   * Check if ant has resources
   * @returns {boolean} True if carrying resources
   */
  hasResources() {
    return this.model.getResourceCount() > 0;
  }

  /**
   * Check if ant can gather more resources
   * @returns {boolean} True if not at capacity
   */
  canGatherMore() {
    return this.model.getResourceCount() < this.model.getResourceCapacity();
  }

  // ===== COMBAT COORDINATION =====

  /**
   * Attack a target
   * @param {Object} target - Target entity (model or controller)
   */
  attack(target) {
    if (!target) return;

    // Set combat target
    this.setCombatTarget(target);

    // Set combat state
    this.setState('COMBAT');

    // Calculate damage
    const stats = this.model.getJobStats();
    const damage = stats.strength || 10;

    // Deal damage to target
    if (target.takeDamage) {
      target.takeDamage(damage);
    } else if (target.model && target.model.setHealth) {
      const targetHealth = target.model.getHealth();
      target.model.setHealth(targetHealth - damage);
    }

    // Emit attack event
    this._emitEvent(EntityEvents.ANT_ATTACKED, {
      ant: this,
      target: target,
      damage: damage
    });

    // Request animation
    this._emitEvent(EntityEvents.ANIMATION_PLAY_REQUESTED, {
      entity: this,
      animationName: 'Attack'
    });

    // Show damage effect
    if (this.effects && this.effects.damageNumber) {
      this.effects.damageNumber(damage);
    }
  }

  /**
   * Take damage
   * @param {number} damage - Damage amount
   */
  takeDamage(damage) {
    const currentHealth = this.model.getHealth();
    const newHealth = Math.max(0, currentHealth - damage);
    
    this.model.setHealth(newHealth);

    // Emit damaged event
    this._emitEvent(EntityEvents.ANT_DAMAGED, {
      ant: this,
      damage: damage,
      healthBefore: currentHealth,
      healthAfter: newHealth,
      attacker: null // Can be enhanced to track attacker
    });

    // Check critical health
    const healthPercent = this.model.getHealthPercentage();
    if (healthPercent < 0.3 && healthPercent > 0) {
      this._emitEvent(EntityEvents.ANT_HEALTH_CRITICAL, {
        ant: this,
        healthPercent: healthPercent
      });
    }

    // Request animation
    this._emitEvent(EntityEvents.ANIMATION_PLAY_REQUESTED, {
      entity: this,
      animationName: 'Attack'
    });

    // Die if health reaches zero
    if (newHealth <= 0) {
      this.die();
    }

    // Show damage effect
    if (this.effects && this.effects.damageNumber) {
      this.effects.damageNumber(damage, [255, 0, 0]);
    }
  }

  /**
   * Handle death
   * @private
   */
  die() {
    // Emit death event
    this._emitEvent(EntityEvents.ANT_DIED, {
      ant: this,
      cause: 'combat', // Can be enhanced to track actual cause
      position: this.model.getPosition()
    });

    this.model.setActive(false);
    this.setState('DEAD');
    
    // Drop resources
    if (this.hasResources()) {
      this.depositResources();
    }
  }

  /**
   * Set combat target
   * @param {Object} target - Target entity
   */
  setCombatTarget(target) {
    const hadTarget = this.model.combatTarget !== null;
    this.model.combatTarget = target;

    // Emit combat entered if new target
    if (target && !hadTarget) {
      this._emitEvent(EntityEvents.ANT_COMBAT_ENTERED, {
        ant: this,
        enemy: target
      });
    }
  }

  /**
   * Get combat target
   * @returns {Object|null} Current target or null
   */
  getCombatTarget() {
    return this.model.combatTarget || null;
  }

  /**
   * Clear combat target
   */
  clearCombatTarget() {
    const hadTarget = this.model.combatTarget !== null;
    this.model.combatTarget = null;
    
    // Emit combat exited if had target
    if (hadTarget) {
      this._emitEvent(EntityEvents.ANT_COMBAT_EXITED, {
        ant: this,
        reason: 'target_cleared'
      });
    }

    // Exit combat state if in combat
    if (this.getCurrentState() === 'COMBAT') {
      this.setState('IDLE');
    }
  }

  /**
   * Check if in combat
   * @returns {boolean} True if in combat
   */
  isInCombat() {
    const combatController = this.subControllers.get('combat');
    if (combatController && combatController.isInCombat) {
      return combatController.isInCombat();
    }
    
    // Fallback: check state and target
    return this.getCurrentState() === 'COMBAT' || this.getCombatTarget() !== null;
  }

  // ===== UPDATE LOOP =====

  /**
   * Update ant controller and all components
   * Called each frame
   */
  update() {
    if (!this.model.isActive) return;

    // Update parent (EntityController) - handles sub-controllers
    super.update();

    // Update ant-specific components
    this._updateBrain();
    this._updateStateMachine();
    this._updateCombat();
  }

  /**
   * Update brain
   * @private
   */
  _updateBrain() {
    if (!this.brain) return;

    // Increment hunger over time
    this.brain.hunger += 0.1;

    // Update flags based on hunger
    const hunger = this.brain.hunger;
    if (hunger >= 200 && this.brain.flag_ !== 'death') {
      this.setHunger(hunger);
    } else if (hunger >= 160 && this.brain.flag_ !== 'starving') {
      this.setHunger(hunger);
    } else if (hunger >= 100 && this.brain.flag_ !== 'hungry') {
      this.setHunger(hunger);
    }
  }

  /**
   * Update state machine
   * @private
   */
  _updateStateMachine() {
    if (this.stateMachine && this.stateMachine.update) {
      this.stateMachine.update();
    }
  }

  /**
   * Update combat
   * @private
   */
  _updateCombat() {
    const target = this.getCombatTarget();
    
    // Clear dead targets
    if (target) {
      const targetActive = target.isActive !== undefined ? target.isActive : 
                          (target.model && target.model.isActive !== undefined ? target.model.isActive : true);
      
      if (!targetActive) {
        this.clearCombatTarget();
      }
    }
  }

  // ===== RENDERING DELEGATION =====

  /**
   * Render ant (delegates to view)
   */
  render() {
    if (this.view && this.view.render) {
      this.view.render();
    }
  }

  // ===== SELECTION COORDINATION (Override EntityController) =====

  /**
   * Set selection state
   * @param {boolean} selected - Selection state
   */
  setSelected(selected) {
    // Call parent
    super.setSelected(selected);
    
    // Ensure model is synced
    if (this.model && this.model.setSelected) {
      this.model.setSelected(selected);
    }

    // Emit selection events
    if (selected) {
      this._emitEvent(EntityEvents.ANT_SELECTED, { ant: this });
    } else {
      this._emitEvent(EntityEvents.ANT_DESELECTED, { ant: this });
    }
  }

  /**
   * Check if selected
   * @returns {boolean} True if selected
   */
  isSelected() {
    // Try parent first
    const parentSelected = super.isSelected();
    
    // Fallback to model
    if (this.model && this.model.getSelected) {
      return this.model.getSelected();
    }
    
    return parentSelected;
  }

  /**
   * Toggle selection
   */
  toggleSelection() {
    const current = this.isSelected();
    this.setSelected(!current);
  }

  // ===== LIFECYCLE =====

  /**
   * Destroy ant and cleanup
   */
  destroy() {
    // Emit destroyed event
    this._emitEvent(EntityEvents.ANT_DESTROYED, {
      antId: this.model.getId ? this.model.getId() : 'unknown',
      antIndex: this.model.getAntIndex()
    });

    // Clear combat target
    this.clearCombatTarget();

    // Clear brain
    if (this.brain) {
      this.brain = null;
    }

    // Clear state machine
    if (this.stateMachine) {
      this.stateMachine = null;
    }

    // Clear job component
    if (this.jobComponent) {
      this.jobComponent = null;
    }

    // Call parent destroy
    super.destroy();
  }

  // ===== ANIMATION INTERFACE (AnimationManager compatibility) =====

  /**
   * Get ant size (for AnimationManager sprite rendering)
   * @returns {{x: number, y: number}} Size object
   */
  getSize() {
    return this.model.getSize();
  }

  /**
   * Get job name (for AnimationManager sprite lookup)
   * @returns {string} Current job name
   */
  get jobName() {
    return this.model.getJobName();
  }

  /**
   * Get health value (for AnimationManager damage animations)
   * @returns {number} Current health
   */
  get _health() {
    return this.model.getHealth();
  }

  /**
   * Set sprite image (for AnimationManager sprite swapping)
   * @param {p5.Image} image - The sprite image
   */
  setImage(image) {
    this.model.setSprite(image);
  }
}

// ===== EXPORTS =====
if (typeof window !== 'undefined') {
  window.AntController = AntController;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntController;
}
