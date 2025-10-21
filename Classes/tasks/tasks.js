//Build a set of tasks available for each ant species
//Ants are updated each day, set of task are given each day
//there will be some sort of task library, so tasks are picked from library at rand
//Rewards/currency system for completing tasks
//tasks has to be completed by the player controlling the ants

console.log("loading tasks.js");
class Task {
  constructor(ID, description, requiredResources = {}) {
    this.ID = ID; //unique identifier for the task
    this.description = description; //text description of the task
    this.requiredResources = Object.assign({}, requiredResources); // e.g. { wood: 10, leaves: 5 }
  }
}

class TaskLibrary{
  constructor(){
    this.availableTasks = [];
    this.initializeDefaultTasks();
  }

  addTask(task){
    this.availableTasks.push(task);
  }

  initializeDefaultTasks(){
    // define resource goals (static)
    this.addTask(new Task("T1", "Gather 10 wood", { wood: 10 }));
    this.addTask(new Task("T2", "Spawn 5 new ants", { ants: 5 })); // non-resource example
    this.addTask(new Task("T3", "Kill 10 ants", { kills: 10 })); // non-resource example
    this.addTask(new Task("T4", "Gather 20 leaves", { leaves: 20 }));
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
    const req = task.requiredResources || {};
    // prefer global helper if available
    const getCount = (typeof window !== 'undefined' && typeof window.getResourceCount === 'function')
      ? window.getResourceCount
      : (type => {
          const totals = (typeof window !== 'undefined' && typeof window.getResourceTotals === 'function') ? window.getResourceTotals() : {};
          return totals[type] || 0;
        });

    for (const k of Object.keys(req)) {
      const need = Number(req[k] || 0);
      const have = Number(getCount(k) || 0);
      if (have < need) return false;
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











