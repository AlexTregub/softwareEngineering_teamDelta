/**
 * TaskManager - Handles task queues, execution, and prioritization
 * Provides a clean command/task system for entities
 */
class TaskManager {
  constructor(entity) {
    this._entity = entity;
    this._taskQueue = [];
    this._currentTask = null;
    this._taskHistory = [];
    this._maxHistorySize = 10;
    
    // Task priorities (lower number = higher priority)
    this.TASK_PRIORITIES = {
      EMERGENCY: 0,
      HIGH: 1,
      NORMAL: 2,
      LOW: 3,
      IDLE: 4
    };

    // Task types and their default priorities
    this.TASK_DEFAULTS = {
      MOVE: { priority: this.TASK_PRIORITIES.NORMAL, timeout: 5000 },
      GATHER: { priority: this.TASK_PRIORITIES.NORMAL, timeout: 10000 },
      BUILD: { priority: this.TASK_PRIORITIES.HIGH, timeout: 15000 },
      FOLLOW: { priority: this.TASK_PRIORITIES.LOW, timeout: 0 }, // No timeout for follow
      ATTACK: { priority: this.TASK_PRIORITIES.HIGH, timeout: 3000 },
      FLEE: { priority: this.TASK_PRIORITIES.EMERGENCY, timeout: 2000 },
      IDLE: { priority: this.TASK_PRIORITIES.IDLE, timeout: 0 }
    };
  }

  // --- Public API ---

  /**
   * Add a task to the queue
   * @param {Object} task - Task object {type, priority?, timeout?, ...params}
   * @returns {string} - Task ID for tracking
   */
  addTask(task) {
    // Validate task
    if (!task || !task.type) {
      console.warn("Invalid task - missing type:", task);
      return null;
    }

    // Generate unique task ID
    const taskId = this.generateTaskId();
    
    // Apply defaults for task type
    const defaults = this.TASK_DEFAULTS[task.type] || this.TASK_DEFAULTS.IDLE;
    
    const enhancedTask = {
      id: taskId,
      type: task.type,
      priority: task.priority !== undefined ? task.priority : defaults.priority,
      timeout: task.timeout !== undefined ? task.timeout : defaults.timeout,
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: task.maxAttempts || 3,
      ...task // Include all original task parameters
    };

    // Add to queue and sort by priority
    this._taskQueue.push(enhancedTask);
    this.sortTaskQueue();

    return taskId;
  }

  /**
   * Process the task queue - call this every frame
   */
  update() {
    // Check if current task is complete or timed out
    if (this._currentTask) {
      if (this.isTaskComplete(this._currentTask) || this.isTaskTimedOut(this._currentTask)) {
        this.completeCurrentTask();
      }
    }

    // Start next task if no current task
    if (!this._currentTask && this._taskQueue.length > 0) {
      this.startNextTask();
    }

    // Update current task
    if (this._currentTask) {
      this.updateCurrentTask();
    }

    // Clean up old history
    this.cleanupHistory();
  }

  /**
   * Clear all tasks
   */
  clearAllTasks() {
    this._taskQueue = [];
    if (this._currentTask) {
      this.addToHistory(this._currentTask, "CANCELLED");
      this._currentTask = null;
    }
  }

  /**
   * Cancel specific task by ID
   * @param {string} taskId - Task ID to cancel
   * @returns {boolean} - True if task was found and cancelled
   */
  cancelTask(taskId) {
    // Check current task
    if (this._currentTask && this._currentTask.id === taskId) {
      this.addToHistory(this._currentTask, "CANCELLED");
      this._currentTask = null;
      return true;
    }

    // Check queue
    const index = this._taskQueue.findIndex(task => task.id === taskId);
    if (index !== -1) {
      const task = this._taskQueue.splice(index, 1)[0];
      this.addToHistory(task, "CANCELLED");
      return true;
    }

    return false;
  }

  /**
   * Get current task
   * @returns {Object|null} - Current task or null
   */
  getCurrentTask() {
    return this._currentTask;
  }

  /**
   * Check if there are pending tasks
   * @returns {boolean}
   */
  hasPendingTasks() {
    return this._taskQueue.length > 0 || this._currentTask !== null;
  }

  /**
   * Get queue length
   * @returns {number}
   */
  getQueueLength() {
    return this._taskQueue.length;
  }

  /**
   * Add high priority emergency task (interrupts current task)
   * @param {Object} task - Emergency task
   */
  addEmergencyTask(task) {
    task.priority = this.TASK_PRIORITIES.EMERGENCY;
    
    // If there's a current task, put it back in queue
    if (this._currentTask && this._currentTask.priority > this.TASK_PRIORITIES.EMERGENCY) {
      this.pauseCurrentTask();
    }
    
    this.addTask(task);
  }

  // --- Convenience Methods ---

  /**
   * Add movement task
   * @param {number} x - Target X
   * @param {number} y - Target Y
   * @param {number} priority - Task priority (optional)
   */
  moveToTarget(x, y, priority) {
    return this.addTask({
      type: "MOVE",
      x: x,
      y: y,
      priority: priority
    });
  }

  /**
   * Add gathering task
   * @param {Object} target - Resource to gather (optional)
   */
  startGathering(target = null) {
    return this.addTask({
      type: "GATHER",
      target: target
    });
  }

  /**
   * Add building task
   * @param {Object} buildTarget - What to build
   */
  startBuilding(buildTarget) {
    return this.addTask({
      type: "BUILD",
      target: buildTarget
    });
  }

  /**
   * Add follow task
   * @param {Object} target - Entity to follow
   */
  followTarget(target) {
    return this.addTask({
      type: "FOLLOW",
      target: target
    });
  }

  /**
   * Add attack task
   * @param {Object} target - Entity to attack
   */
  attackTarget(target) {
    return this.addTask({
      type: "ATTACK",
      target: target,
      priority: this.TASK_PRIORITIES.HIGH
    });
  }

  /**
   * Add flee task
   * @param {Object} threat - What to flee from
   */
  fleeFrom(threat) {
    return this.addTask({
      type: "FLEE",
      threat: threat,
      priority: this.TASK_PRIORITIES.EMERGENCY
    });
  }

  // --- Private Methods ---

  /**
   * Generate unique task ID
   * @returns {string}
   */
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sort task queue by priority
   */
  sortTaskQueue() {
    this._taskQueue.sort((a, b) => {
      // First sort by priority (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // If same priority, sort by creation time (FIFO)
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * Start the next task in the queue
   */
  startNextTask() {
    if (this._taskQueue.length === 0) return;

    this._currentTask = this._taskQueue.shift();
    this._currentTask.startedAt = Date.now();
    this._currentTask.attempts++;

    // Execute the task
    this.executeTask(this._currentTask);
  }

  /**
   * Execute a task
   * @param {Object} task - Task to execute
   */
  executeTask(task) {
    try {
      switch (task.type) {
        case "MOVE":
          this.executeMoveTask(task);
          break;
        case "GATHER":
          this.executeGatherTask(task);
          break;
        case "BUILD":
          this.executeBuildTask(task);
          break;
        case "FOLLOW":
          this.executeFollowTask(task);
          break;
        case "ATTACK":
          this.executeAttackTask(task);
          break;
        case "FLEE":
          this.executeFleeTask(task);
          break;
        case "IDLE":
          this.executeIdleTask(task);
          break;
        default:
          console.warn(`Unknown task type: ${task.type}`);
          this.completeCurrentTask("FAILED");
      }
    } catch (error) {
      console.error(`Error executing task ${task.type}:`, error);
      this.completeCurrentTask("ERROR");
    }
  }

  /**
   * Execute movement task
   * @param {Object} task - Move task
   */
  executeMoveTask(task) {
    if (task.x === undefined || task.y === undefined) {
      console.warn("Move task missing coordinates:", task);
      this.completeCurrentTask("FAILED");
      return;
    }

    // Use entity's movement controller if available
    if (this._entity._movementController) {
      const success = this._entity._movementController.moveToLocation(task.x, task.y);
      if (!success) {
        this.completeCurrentTask("FAILED");
      }
    } else if (this._entity.moveToLocation) {
      // Fallback to entity's direct method
      this._entity.moveToLocation(task.x, task.y);
    } else {
      console.warn("Entity has no movement capability");
      this.completeCurrentTask("FAILED");
    }

    // Update entity state machine if available
    if (this._entity._stateMachine && this._entity._stateMachine.canPerformAction("move")) {
      this._entity._stateMachine.setPrimaryState("MOVING");
    }
  }

  /**
   * Execute gather task
   * @param {Object} task - Gather task
   */
  executeGatherTask(task) {
    if (this._entity._stateMachine && this._entity._stateMachine.canPerformAction("gather")) {
      this._entity._stateMachine.setPrimaryState("GATHERING");
      // Add specific gathering logic here
    } else {
      this.completeCurrentTask("FAILED");
    }
  }

  /**
   * Execute build task
   * @param {Object} task - Build task
   */
  executeBuildTask(task) {
    if (this._entity._stateMachine && this._entity._stateMachine.canPerformAction("build")) {
      this._entity._stateMachine.setPrimaryState("BUILDING");
      // Add specific building logic here
    } else {
      this.completeCurrentTask("FAILED");
    }
  }

  /**
   * Execute follow task
   * @param {Object} task - Follow task
   */
  executeFollowTask(task) {
    if (this._entity._stateMachine && this._entity._stateMachine.canPerformAction("follow")) {
      this._entity._stateMachine.setPrimaryState("FOLLOWING");
      // Add following logic here - would need to track target position
    } else {
      this.completeCurrentTask("FAILED");
    }
  }

  /**
   * Execute attack task
   * @param {Object} task - Attack task
   */
  executeAttackTask(task) {
    if (this._entity._stateMachine) {
      this._entity._stateMachine.setCombatModifier("IN_COMBAT");
      this._entity._stateMachine.setPrimaryState("ATTACKING");
      // Add combat logic here
    } else {
      this.completeCurrentTask("FAILED");
    }
  }

  /**
   * Execute flee task
   * @param {Object} task - Flee task
   */
  executeFleeTask(task) {
    if (this._entity._stateMachine && this._entity._stateMachine.canPerformAction("move")) {
      this._entity._stateMachine.setPrimaryState("FLEEING");
      // Calculate flee direction and move
      // This would need to be implemented based on threat position
    } else {
      this.completeCurrentTask("FAILED");
    }
  }

  /**
   * Execute idle task
   * @param {Object} task - Idle task
   */
  executeIdleTask(task) {
    if (this._entity._stateMachine) {
      this._entity._stateMachine.setPrimaryState("IDLE");
    }
    // Idle tasks complete immediately
    this.completeCurrentTask("SUCCESS");
  }

  /**
   * Update the current task
   */
  updateCurrentTask() {
    if (!this._currentTask) return;

    // Task-specific update logic can be added here
    // For now, most tasks are handled by state machine and other controllers
  }

  /**
   * Check if current task is complete
   * @param {Object} task - Task to check
   * @returns {boolean}
   */
  isTaskComplete(task) {
    switch (task.type) {
      case "MOVE":
        // Movement is complete when entity is not moving
        return this._entity._movementController ? 
          !this._entity._movementController.getIsMoving() : 
          !this._entity._isMoving;
      
      case "GATHER":
        // Gathering is complete when no longer in gathering state
        return this._entity._stateMachine ? 
          !this._entity._stateMachine.isPrimaryState("GATHERING") : 
          true;
      
      case "BUILD":
        // Building is complete when no longer in building state
        return this._entity._stateMachine ? 
          !this._entity._stateMachine.isPrimaryState("BUILDING") : 
          true;
      
      case "FOLLOW":
        // Follow tasks don't auto-complete unless cancelled
        return false;
      
      case "ATTACK":
        // Attack complete when out of combat
        return this._entity._stateMachine ? 
          this._entity._stateMachine.isOutOfCombat() : 
          true;
      
      case "FLEE":
        // Flee complete when no longer fleeing
        return this._entity._stateMachine ? 
          !this._entity._stateMachine.isPrimaryState("FLEEING") : 
          true;
      
      case "IDLE":
        // Idle tasks complete immediately
        return true;
      
      default:
        return true;
    }
  }

  /**
   * Check if task has timed out
   * @param {Object} task - Task to check
   * @returns {boolean}
   */
  isTaskTimedOut(task) {
    if (!task.timeout || task.timeout === 0) return false;
    
    const elapsed = Date.now() - task.startedAt;
    return elapsed > task.timeout;
  }

  /**
   * Complete the current task
   * @param {string} status - Completion status (SUCCESS, FAILED, TIMEOUT, ERROR)
   */
  completeCurrentTask(status = "SUCCESS") {
    if (!this._currentTask) return;

    this._currentTask.completedAt = Date.now();
    this._currentTask.status = status;

    // Add to history
    this.addToHistory(this._currentTask, status);

    // Retry failed tasks if attempts remaining
    if ((status === "FAILED" || status === "TIMEOUT") && 
        this._currentTask.attempts < this._currentTask.maxAttempts) {
      
      // Add back to queue for retry with lower priority
      this._currentTask.priority = Math.min(this._currentTask.priority + 1, this.TASK_PRIORITIES.LOW);
      this._taskQueue.push(this._currentTask);
      this.sortTaskQueue();
    }

    this._currentTask = null;

    // Ensure idle transition if no more tasks
    if (this._taskQueue.length === 0) {
      this.ensureIdleTransition();
    }
  }

  /**
   * Pause current task and return to queue
   */
  pauseCurrentTask() {
    if (!this._currentTask) return;

    // Reset task state
    delete this._currentTask.startedAt;
    this._taskQueue.unshift(this._currentTask); // Add to front of queue
    this._currentTask = null;
  }

  /**
   * Ensure entity transitions to idle when appropriate
   */
  ensureIdleTransition() {
    if (this._entity._stateMachine) {
      const currentPrimary = this._entity._stateMachine.primaryState;
      
      // Only transition to idle from certain states
      if (currentPrimary === "MOVING" || 
          currentPrimary === "GATHERING" || 
          currentPrimary === "BUILDING" || 
          currentPrimary === "FOLLOWING") {
        
        if (this._entity._stateMachine.canPerformAction("move")) {
          this._entity._stateMachine.setPrimaryState("IDLE");
        }
      }
    }
  }

  /**
   * Add task to history
   * @param {Object} task - Task to add
   * @param {string} status - Final status
   */
  addToHistory(task, status) {
    this._taskHistory.unshift({
      ...task,
      finalStatus: status,
      historyAddedAt: Date.now()
    });
  }

  /**
   * Clean up old history entries
   */
  cleanupHistory() {
    if (this._taskHistory.length > this._maxHistorySize) {
      this._taskHistory = this._taskHistory.slice(0, this._maxHistorySize);
    }
  }

  /**
   * Get debug information
   * @returns {Object} - Debug info
   */
  getDebugInfo() {
    return {
      currentTask: this._currentTask ? {
        type: this._currentTask.type,
        priority: this._currentTask.priority,
        attempts: this._currentTask.attempts,
        elapsed: this._currentTask.startedAt ? Date.now() - this._currentTask.startedAt : 0
      } : null,
      queueLength: this._taskQueue.length,
      queueTypes: this._taskQueue.g_map(task => task.type),
      historyLength: this._taskHistory.length,
      recentHistory: this._taskHistory.slice(0, 3).g_map(task => ({
        type: task.type,
        status: task.finalStatus
      }))
    };
  }
}

// Export for Node.js testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = TaskManager;
}
