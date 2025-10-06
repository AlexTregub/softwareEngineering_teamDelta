//Build a set of tasks available for each ant species
//Ants are updated each day, set of task are given each day
//there will be some sort of task library, so tasks are picked from library at rand
//Rewards/currency system for completing tasks
//tasks has to be completed by the player controlling the ants

// ...existing code...
class Task {
  constructor(type, params = {}, priority = 0, createdBy = null) {
    this.id = Task._nextId();
    this.type = type; // "GATHER", "BUILD", "MOVE", etc.
    this.params = params; // { x, y, resourceId, baseId, targetBuildingId, amount }
    this.priority = priority;
    this.state = "PENDING"; // PENDING, RUNNING, COMPLETE, FAILED, CANCELLED
    this.progress = 0;
    this.assignedAnts = []; // ant instances
    this.createdBy = createdBy; // optional reference to who requested task (queen or player id)
    this.createdAt = Date.now();
  }

  assignAnt(ant) {
    if (!this.assignedAnts.includes(ant)) {
      this.assignedAnts.push(ant);
      this.state = "RUNNING";
      if (ant && typeof ant.onTaskAssigned === 'function') ant.onTaskAssigned(this);
    }
  }

  unassignAnt(ant) {
    this.assignedAnts = this.assignedAnts.filter(a => a !== ant);
    if (this.assignedAnts.length === 0 && this.state === "RUNNING") this.state = "PENDING";
    if (ant && typeof ant.onTaskUnassigned === 'function') ant.onTaskUnassigned(this);
  }

  complete(resultPayload = null) {
    this.state = "COMPLETE";
    this.progress = 1;
    for (const a of this.assignedAnts) {
      if (a && typeof a.onTaskComplete === 'function') a.onTaskComplete(this);
    }

    // Notify the owning TaskManager (global helper) so it can route results to base/building.
    if (typeof window !== 'undefined' && window.taskManager && typeof window.taskManager.onTaskCompleted === 'function') {
      window.taskManager.onTaskCompleted(this, resultPayload);
    }
  }

  fail() {
    this.state = "FAILED";
    for (const a of this.assignedAnts) {
      if (a && typeof a.onTaskFailed === 'function') a.onTaskFailed(this);
    }
    if (typeof window !== 'undefined' && window.taskManager && typeof window.taskManager.onTaskFailed === 'function') {
      window.taskManager.onTaskFailed(this);
    }
  }

  tick(dt) {
    // optional automatic progression for timed tasks; kept empty for ant-driven tasks
  }

  static _nextId() {
    Task._id = (Task._id || 0) + 1;
    return Task._id;
  }
}

class TaskManager {
  constructor() {
    this.tasks = []; // all tasks
    this.queue = []; // pending tasks (priority sorted)
  }

  createTask(type, params = {}, priority = 0, createdBy = null) {
    const t = new Task(type, params, priority, createdBy);
    this.tasks.push(t);
    this.enqueue(t);
    return t;
  }

  enqueue(task) {
    this.queue.push(task);
    this.queue.sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);
  }

  getPending() {
    return this.queue.filter(t => t.state === "PENDING");
  }

  removeTask(task) {
    this.tasks = this.tasks.filter(t => t !== task);
    this.queue = this.queue.filter(t => t !== task);
  }

  assignAntToTask(ant, task = null) {
    if (!ant) return null;
    if (task) {
      task.assignAnt(ant);
      this.queue = this.queue.filter(t => t !== task);
      return task;
    }
    for (let i = 0; i < this.queue.length; i++) {
      const t = this.queue[i];
      if (this._isSuitable(t, ant)) {
        this.queue.splice(i, 1);
        t.assignAnt(ant);
        return t;
      }
    }
    return null;
  }

  _isSuitable(task, ant) {
    if (task.type === "GATHER" && ant && ant.StatsContainer) {
      return (ant.StatsContainer.gatherSpeed || 1) > 0;
    }
    return true;
  }

  // Called by Task.complete(...) to let the manager route results to the appropriate base/building
  onTaskCompleted(task, resultPayload = null) {
    // task.params.baseId is optional; if present prefer the base to accept results
    const baseId = task.params && task.params.baseId;
    let handled = false;

    if (baseId && typeof window !== 'undefined') {
      const base = (window.buildings && window.buildings.find) ? window.buildings.find(b => b.id === baseId) : null;
      if (base && typeof base.acceptTaskResult === 'function') {
        base.acceptTaskResult(task, resultPayload);
        handled = true;
      }
    }

    // generic fallback: emit an event or store results on TaskManager for UI
    if (!handled) {
      // keep a simple completedResults list for UI/inspection
      this.completedResults = this.completedResults || [];
      this.completedResults.push({ task, resultPayload, completedAt: Date.now() });
    }

    // cleanup the task from active lists
    this.removeTask(task);
  }

  onTaskFailed(task) {
    // For now just remove from pending queue; extend to retry logic if needed
    this.removeTask(task);
  }

  tick(dt) {
    if (window.ants && window.ants.length) {
      for (const a of ants) {
        if (a && typeof a.isIdle === 'function' && a.isIdle()) {
          this.assignAntToTask(a);
        }
      }
    }
    for (const t of this.tasks) {
      if (t.state === "RUNNING") t.tick(dt);
    }
    this.tasks = this.tasks.filter(t => t.state !== "COMPLETE" && t.state !== "CANCELLED");
    this.queue = this.queue.filter(t => t.state === "PENDING");
  }
}

// Light-weight Queen helper: queen may request tasks and request assignment, but does NOT own tasks
class QueenInterface {
  constructor(taskManager) {
    this.tm = taskManager || (typeof window !== 'undefined' ? window.taskManager : null);
  }

  // attach convenience methods to a queen ant instance
  registerQueen(queenAnt) {
    if (!queenAnt || !this.tm) return;
    queenAnt.createTask = (type, params = {}, priority = 0) => {
      return this.tm.createTask(type, params, priority, { requester: queenAnt });
    };
    queenAnt.requestAssign = (ant, task) => {
      return this.tm.assignAntToTask(ant, task);
    };
    // optionally allow queen to query pending tasks
    queenAnt.getPendingTasks = () => this.tm.getPending();
  }
}

// expose to browser / tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Task, TaskManager, QueenInterface };
}
if (typeof window !== 'undefined') {
  window.Task = Task;
  window.TaskManager = TaskManager;
  window.QueenInterface = QueenInterface;
}
// ...existing code...

// ...existing code...
class BaseBuilding {
  constructor(id, tileX, tileY, tileSize = 32, width = 1, height = 1) {
    this.id = id;
    this.tileX = tileX;
    this.tileY = tileY;
    this.tileSize = tileSize;
    this.width = width;
    this.height = height;
    this.inventory = []; // stored results / resources
  }

  getCenterPx() {
    return {
      x: (this.tileX + this.width / 2) * this.tileSize,
      y: (this.tileY + this.height / 2) * this.tileSize
    };
  }

  // Called by TaskManager when a task assigned with params.baseId completes
  acceptTaskResult(task, payload) {
    // payload is optional — if not provided, attempt to harvest from assigned ants' resource managers
    if (payload) {
      this.inventory.push({ taskId: task.id, payload });
      return true;
    }

    // fallback: try to collect resources from assigned ants
    for (const a of (task.assignedAnts || [])) {
      if (a && a.resourceManager && typeof a.resourceManager.dropAll === 'function') {
        const dropped = a.resourceManager.dropAll();
        if (dropped && dropped.length) this.inventory.push({ taskId: task.id, from: a.getAntIndex ? a.getAntIndex() : null, resources: dropped });
      }
    }
    return true;
  }
}

// register for global lookup if desired
if (typeof module !== 'undefined' && module.exports) module.exports = BaseBuilding;
if (typeof window !== 'undefined') {
  window.BaseBuilding = BaseBuilding;
  window.buildings = window.buildings || []; // simple registry
}
