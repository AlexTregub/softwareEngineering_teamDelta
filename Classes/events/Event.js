/**
 * Event Classes - Base class and specific event types
 * 
 * Events are triggered by EventTriggers and execute specific game actions.
 * Each event type handles different gameplay scenarios (dialogue, spawning, tutorials, bosses).
 * 
 * Following TDD: Implementation written to pass existing unit tests.
 * 
 * @class GameEvent - Base class for all game events
 * @class DialogueEvent - Display dialogue/messages to player
 * @class SpawnEvent - Spawn enemies/entities at specified locations
 * @class TutorialEvent - Interactive step-by-step tutorials
 * @class BossEvent - Boss fight encounters with phases
 */

/**
 * GameEvent - Base class for all game events
 */
class GameEvent {
  /**
   * Create a new event
   * @param {Object} config - Event configuration
   * @param {string} config.id - Unique event ID
   * @param {string} config.type - Event type (dialogue, spawn, tutorial, boss)
   * @param {Object} config.content - Event-specific content data
   * @param {number} [config.priority=999] - Event priority (lower = higher priority)
   * @param {Object} [config.metadata] - Optional metadata
   * @param {Function} [config.onTrigger] - Callback when event triggers
   * @param {Function} [config.onComplete] - Callback when event completes
   * @param {Function} [config.onUpdate] - Callback during event update
   * @param {number} [config.duration] - Auto-complete after duration (ms)
   * @param {Function} [config.completionCondition] - Auto-complete when condition met
   */
  constructor(config) {
    this.id = config.id;
    this.type = config.type;
    this.content = config.content || {};
    this.priority = config.priority !== undefined ? config.priority : 999;
    this.metadata = config.metadata;
    
    // State tracking
    this.active = false;
    this.completed = false;
    this.paused = false;
    this.triggeredAt = null;
    this.completedAt = null;
    this._pauseStartTime = null;
    this._totalPausedTime = 0;
    
    // Callbacks
    this.onTrigger = config.onTrigger;
    this.onComplete = config.onComplete;
    this.onUpdate = config.onUpdate;
    
    // Auto-completion strategies
    this.duration = config.duration;
    this.autoCompleteAfter = config.autoCompleteAfter; // Alternative duration name
    this.completionCondition = config.completionCondition;
    this.completeWhen = config.completeWhen; // Alternative condition name
    this.customCompletion = config.customCompletion;
  }
  
  /**
   * Trigger the event (start execution)
   * @param {*} data - Optional data to pass to onTrigger callback
   */
  trigger(data) {
    this.active = true;
    this.triggeredAt = typeof millis === 'function' ? millis() : Date.now();
    
    if (this.onTrigger) {
      this.onTrigger(data);
    }
  }
  
  /**
   * Complete the event
   * @returns {boolean} - True if completed, false if not active
   */
  complete() {
    if (!this.active) {
      return false;
    }
    
    this.completed = true;
    this.active = false;
    this.completedAt = typeof millis === 'function' ? millis() : Date.now();
    
    if (this.onComplete) {
      this.onComplete();
    }
    
    return true;
  }
  
  /**
   * Pause the event
   */
  pause() {
    if (this.active && !this.paused) {
      this.paused = true;
      this._pauseStartTime = typeof millis === 'function' ? millis() : Date.now();
    }
  }
  
  /**
   * Resume the event from pause
   */
  resume() {
    if (this.paused) {
      const currentTime = typeof millis === 'function' ? millis() : Date.now();
      this._totalPausedTime += (currentTime - this._pauseStartTime);
      this.paused = false;
      this._pauseStartTime = null;
    }
  }
  
  /**
   * Update event (called each frame)
   * Handles auto-completion strategies
   */
  update() {
    if (!this.active || this.paused) {
      return;
    }
    
    // Execute onUpdate callback
    if (this.onUpdate) {
      this.onUpdate();
    }
    
    // Check auto-completion strategies
    this._checkAutoCompletion();
  }
  
  /**
   * Check auto-completion strategies
   * @private
   */
  _checkAutoCompletion() {
    // Duration-based auto-completion
    const durationMs = this.duration || this.autoCompleteAfter;
    if (durationMs !== undefined) {
      const elapsed = this.getElapsedTime();
      if (elapsed >= durationMs) {
        this.complete();
        return;
      }
    }
    
    // Condition-based auto-completion (custom function)
    if (this.completionCondition && typeof this.completionCondition === 'function') {
      if (this.completionCondition()) {
        this.complete();
        return;
      }
    }
    
    // Condition-based auto-completion (completeWhen object)
    if (this.completeWhen) {
      if (this._evaluateCompleteWhenCondition(this.completeWhen)) {
        this.complete();
        return;
      }
    }
    
    // Custom completion callback
    if (this.customCompletion && typeof this.customCompletion === 'function') {
      if (this.customCompletion()) {
        this.complete();
        return;
      }
    }
  }
  
  /**
   * Evaluate completeWhen condition object
   * @private
   */
  _evaluateCompleteWhenCondition(condition) {
    // Custom function condition
    if (condition.type === 'custom') {
      if (typeof condition.condition === 'function') {
        return condition.condition();
      }
      return false;
    }
    
    // Flag-based condition
    if (condition.type === 'flag') {
      const eventManager = (typeof global !== 'undefined' && global.eventManager) ||
                          (typeof window !== 'undefined' && window.eventManager);
      
      if (!eventManager || !eventManager.getFlag) {
        return false;
      }
      
      const flagValue = eventManager.getFlag(condition.flag);
      
      // Apply operator
      switch (condition.operator) {
        case '<=':
          return flagValue <= condition.value;
        case '>=':
          return flagValue >= condition.value;
        case '<':
          return flagValue < condition.value;
        case '>':
          return flagValue > condition.value;
        case '!=':
        case '!==':
          return flagValue !== condition.value;
        case '==':
        case '===':
        default:
          return flagValue === condition.value;
      }
    }
    
    return false;
  }
  
  /**
   * Get elapsed time since trigger (excluding paused time)
   * @returns {number} - Elapsed time in milliseconds
   */
  getElapsedTime() {
    if (!this.triggeredAt) {
      return 0;
    }
    
    const currentTime = typeof millis === 'function' ? millis() : Date.now();
    const pausedTime = this.paused ? 
      (currentTime - this._pauseStartTime + this._totalPausedTime) :
      this._totalPausedTime;
    
    return currentTime - this.triggeredAt - pausedTime;
  }
  
  /**
   * Serialize event for JSON export
   * @returns {Object} - JSON-serializable event data
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      content: this.content,
      priority: this.priority,
      metadata: this.metadata
    };
  }
}

/**
 * DialogueEvent - Display dialogue/messages to player
 * 
 * Shows text messages with optional title, speaker, and button responses.
 */
class DialogueEvent extends GameEvent {
  constructor(config) {
    super({ ...config, type: 'dialogue' });
    this._response = null;
    this.onResponse = config.onResponse;
    this.autoCompleteOnResponse = config.autoCompleteOnResponse;
  }
  
  /**
   * Handle button response
   * @param {string} buttonText - Text of clicked button
   */
  handleResponse(buttonText) {
    this._response = buttonText;
    
    if (this.onResponse) {
      this.onResponse(buttonText);
    }
    
    // Auto-complete on response if configured
    if (this.autoCompleteOnResponse) {
      this.complete();
    }
  }
  
  /**
   * Get the user's response
   * @returns {string|null} - Response text or null if no response yet
   */
  getResponse() {
    return this._response;
  }
}

/**
 * SpawnEvent - Spawn enemies/entities at specified locations
 * 
 * Generates spawn positions and triggers entity spawning callbacks.
 */
class SpawnEvent extends GameEvent {
  constructor(config) {
    super({ ...config, type: 'spawn' });
    
    // Support spawn callback
    this.spawnCallback = config.spawnCallback;
    this.onSpawn = config.onSpawn;
  }
  
  /**
   * Generate spawn positions
   * @param {Object} [viewport] - Viewport bounds {minX, maxX, minY, maxY}
   * @returns {Array<Object>} - Array of {x, y} spawn positions
   */
  generateSpawnPositions(viewport) {
    // Custom spawn points
    if (this.content.spawnPoints && Array.isArray(this.content.spawnPoints)) {
      return this.content.spawnPoints;
    }
    
    // Edge spawning via ViewportSpawnTrigger integration
    if (this.content.spawnLocations === 'viewport_edge' || this.content.edgeSpawn || this.content.useViewportEdges) {
      return this._generateEdgePositions(viewport);
    }
    
    return [];
  }
  
  /**
   * Generate spawn positions at viewport edges
   * @private
   * @param {Object} [viewport] - Viewport bounds
   * @returns {Array<Object>} - Array of {x, y, edge} spawn positions
   */
  _generateEdgePositions(viewport) {
    const count = this.content.count || this.content.enemyCount || 1;
    
    // Use provided viewport or get from trigger
    if (viewport) {
      return this._generatePositionsAtEdges(count, viewport);
    }
    
    // Use ViewportSpawnTrigger if available
    if (typeof ViewportSpawnTrigger !== 'undefined') {
      const trigger = new ViewportSpawnTrigger({
        eventId: this.id,
        condition: {
          edgeSpawn: true,
          count: count,
          distributeEvenly: this.content.distributeEvenly !== false
        }
      });
      
      return trigger.generateEdgePositions(count);
    }
    
    return [];
  }
  
  /**
   * Generate positions at viewport edges
   * @private
   */
  _generatePositionsAtEdges(count, viewport) {
    const positions = [];
    const edges = ['top', 'right', 'bottom', 'left'];
    
    for (let i = 0; i < count; i++) {
      const edge = edges[i % edges.length];
      let pos;
      
      switch (edge) {
        case 'top':
          pos = {
            x: Math.random() * (viewport.maxX - viewport.minX) + viewport.minX,
            y: viewport.minY
          };
          break;
        case 'bottom':
          pos = {
            x: Math.random() * (viewport.maxX - viewport.minX) + viewport.minX,
            y: viewport.maxY
          };
          break;
        case 'left':
          pos = {
            x: viewport.minX,
            y: Math.random() * (viewport.maxY - viewport.minY) + viewport.minY
          };
          break;
        case 'right':
          pos = {
            x: viewport.maxX,
            y: Math.random() * (viewport.maxY - viewport.minY) + viewport.minY
          };
          break;
      }
      
      positions.push(pos);
    }
    
    return positions;
  }
  
  /**
   * Execute spawn at specific position
   * @param {Object} position - Spawn position {x, y}
   */
  executeSpawn(position) {
    if (this.onSpawn) {
      this.onSpawn({
        enemyType: this.content.enemyType,
        position: position
      });
    }
  }
  
  /**
   * Execute spawn (trigger spawn callback with enemy data)
   */
  spawn() {
    if (!this.spawnCallback) {
      return;
    }
    
    const positions = this.generateSpawnPositions();
    const enemies = this.content.enemies || [];
    
    positions.forEach((pos, index) => {
      const enemyType = enemies[index % enemies.length] || enemies[0] || 'default';
      
      this.spawnCallback({
        type: enemyType,
        x: pos.x,
        y: pos.y,
        edge: pos.edge,
        wave: this.content.wave
      });
    });
  }
  
  /**
   * Override trigger to auto-spawn
   */
  trigger(data) {
    super.trigger(data);
    this.spawn();
  }
}

/**
 * TutorialEvent - Interactive step-by-step tutorials
 * 
 * Multi-step guided tutorials with navigation (next/prev) and completion tracking.
 */
class TutorialEvent extends GameEvent {
  constructor(config) {
    super({ ...config, type: 'tutorial' });
    this.currentStep = 0;
  }
  
  /**
   * Get current step index
   * @returns {number} - Current step (0-based)
   */
  getCurrentStep() {
    return this.currentStep;
  }
  
  /**
   * Get current step content
   * @returns {Object} - Current step data
   */
  getCurrentStepContent() {
    if (this.content.steps && this.content.steps[this.currentStep]) {
      return this.content.steps[this.currentStep];
    }
    return null;
  }
  
  /**
   * Advance to next step
   */
  nextStep() {
    if (!this.content.steps) {
      return;
    }
    
    if (this.currentStep < this.content.steps.length - 1) {
      this.currentStep++;
    } else {
      // At last step, complete tutorial
      this.complete();
    }
  }
  
  /**
   * Go back to previous step
   */
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }
}

/**
 * BossEvent - Boss fight encounters
 * 
 * Multi-phase boss fights with intro dialogue, victory/defeat conditions.
 */
class BossEvent extends GameEvent {
  constructor(config) {
    super({ ...config, type: 'boss' });
    this._currentPhase = 0;
  }
  
  /**
   * Get current boss phase based on health threshold
   * @param {number} [healthPercentage] - Boss health (0-1), if provided determines phase
   * @returns {number} - Current phase index (0-based) or phase number (1-based if health provided)
   */
  getCurrentPhase(healthPercentage) {
    // If health percentage provided, calculate phase based on thresholds
    if (healthPercentage !== undefined && this.content.phases) {
      for (let i = this.content.phases.length - 1; i >= 0; i--) {
        const phase = this.content.phases[i];
        if (healthPercentage <= phase.healthThreshold) {
          return i + 1; // Return 1-based phase number
        }
      }
      return 1; // Default to phase 1
    }
    
    // Otherwise return current phase index
    return this._currentPhase;
  }
  
  /**
   * Get current phase content
   * @returns {Object} - Current phase data
   */
  getCurrentPhaseContent() {
    if (this.content.phases && this.content.phases[this._currentPhase]) {
      return this.content.phases[this._currentPhase];
    }
    return null;
  }
  
  /**
   * Advance to next phase
   */
  nextPhase() {
    if (!this.content.phases) {
      return;
    }
    
    if (this._currentPhase < this.content.phases.length - 1) {
      this._currentPhase++;
    }
  }
  
  /**
   * Check victory condition
   * @returns {boolean} - True if victory condition met
   */
  checkVictory() {
    if (this.content.victoryCondition && typeof this.content.victoryCondition === 'function') {
      return this.content.victoryCondition();
    }
    return false;
  }
  
  /**
   * Check defeat condition
   * @returns {boolean} - True if defeat condition met
   */
  checkDefeat() {
    if (this.content.defeatCondition && typeof this.content.defeatCondition === 'function') {
      return this.content.defeatCondition();
    }
    return false;
  }
  
  /**
   * Override update to check victory/defeat
   */
  update() {
    super.update();
    
    if (this.checkVictory()) {
      this.complete();
    }
    
    if (this.checkDefeat()) {
      this.complete();
    }
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GameEvent,
    DialogueEvent,
    SpawnEvent,
    TutorialEvent,
    BossEvent
  };
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.GameEvent = GameEvent;
  window.DialogueEvent = DialogueEvent;
  window.SpawnEvent = SpawnEvent;
  window.TutorialEvent = TutorialEvent;
  window.BossEvent = BossEvent;
}

// Export for Node.js global (testing compatibility)
if (typeof global !== 'undefined') {
  global.GameEvent = GameEvent;
  global.DialogueEvent = DialogueEvent;
  global.SpawnEvent = SpawnEvent;
  global.TutorialEvent = TutorialEvent;
  global.BossEvent = BossEvent;
}
