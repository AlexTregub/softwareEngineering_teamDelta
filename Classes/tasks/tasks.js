//Build a set of tasks available for each ant species
//Ants are updated each day, set of task are given each day
//there will be some sort of task library, so tasks are picked from library at rand
//Rewards/currency system for completing tasks
//tasks has to be completed by the player controlling the ants

console.log("loading tasks.js");
class Task {
  constructor(ID, description){
    this.ID = ID; //unique identifier for the task
    this.description = description; //text description of the task
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
    this.addTask(new Task("T1", "Gather 10 sticks"));
    this.addTask(new Task("T2", "Spawn 5 new ants"));
    this.addTask(new Task("T3", "Kill 10 ants"));
    this.addTask(new Task("T4", "Gather 20 leaves"));
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

}











