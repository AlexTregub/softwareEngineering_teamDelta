//Build a set of tasks available for each ant species
//Ants are updated each day, set of task are given each day
//there will be some sort of task library, so tasks are picked from library at rand
//Rewards/currency system for completing tasks
//tasks has to be completed by the player controlling the ants

logNormal("loading tasks.js");
class Task {
  constructor(ID, description, requiredResources = {}) {
    this.ID = ID;
    this.description = description;
    // Match the exact resource types from ResourceSystemManager
    this.requiredResources = {
      stick: 0,
      stone: 0, 
      mapleLeaf: 0,
      greenLeaf: 0,
      ...requiredResources
    };
  }
}

class TaskLibrary {
  constructor() {
    this.availableTasks = [];
    this.initializeDefaultTasks();
  }

  addTask(task){
    this.availableTasks.push(task);
  }

  initializeDefaultTasks() {
    // Use exact resource type names that match ResourceSystemManager
    this.addTask(new Task("T1", "Gather 10 sticks", { stick: 10 }));
    this.addTask(new Task("T2", "Gather 5 stones", { stone: 5 }));
    this.addTask(new Task("T3", "Gather 20 maple leaves", { mapleLeaf: 20 }));
    this.addTask(new Task("T4", "Gather 15 green leaves", { greenLeaf: 15 }));
  }

  // Return array of formatted strings for UI

/*  

 */

  getRandomTask() {
    if(this.availableTasks.length === 0) return null;
    const randIndex = Math.floor(Math.random() * this.availableTasks.length);
    return this.availableTasks[randIndex];
  }

  getTaskUi(){
    //should return random task description in UI
    const task = this.getRandomTask();
    if(!task) return "No tasks available";
    return `Task: ${task.description}`;
  }

  /**
   * Check whether a task's resource requirements are satisfied.
   * Accepts task ID string or Task object.
   * Returns true only if all resource counts meet or exceed requirements.
   */
  isTaskResourcesSatisfied(taskOrId) {
    const task = (typeof taskOrId === 'string') 
      ? this.availableTasks.find(t => t.ID === taskOrId)
      : taskOrId;
    
    if (!task) return false;

    // Get current resource totals
    const totals = (typeof window.getResourceTotals === 'function') 
      ? window.getResourceTotals() 
      : {};

    // Check each required resource against totals
    for (const [resourceType, needed] of Object.entries(task.requiredResources)) {
      const have = totals[resourceType] || 0;
      if (have < needed) return false;
    }
    return true;
  }

  /**
   * Return progress for a task's resource requirements.
   * { resourceType: { have, need, pct } }
   */
  getTaskResourceProgress(taskOrId) {
    const task = (typeof taskOrId === 'string')
      ? this.availableTasks.find(t => t.ID === taskOrId)
      : taskOrId;
    if (!task) return {};
    const req = task.requiredResources || {};
    const totals = (typeof window !== 'undefined' && typeof window.getResourceTotals === 'function') ? window.getResourceTotals() : {};
    const out = {};
    for (const k of Object.keys(req)) {
      const need = Number(req[k] || 0);
      const have = Number(totals[k] || 0);
      out[k] = { have, need, pct: need === 0 ? 1 : Math.min(1, have / need) };
    }
    return out;
  }

}
