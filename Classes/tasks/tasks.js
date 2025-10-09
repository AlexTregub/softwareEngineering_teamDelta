//Build a set of tasks available for each ant species
//Ants are updated each day, set of task are given each day
//there will be some sort of task library, so tasks are picked from library at rand
//Rewards/currency system for completing tasks
//tasks has to be completed by the player controlling the ants

console.log("loading tasks.js");
class Task {
  constructor(ID, antSpecie, taskReward, taskType, status) {
    this.ID = ID; // identifier for the task
    this.antSpecie = antSpecie; // "GATHER", "BUILD", "MOVE", etc.
    this.taskType = taskType; // "Food", "Water", "Nest", etc.
    this.status = status; // task will be "Incomplete", "InProgress", "Complete"
    this.taskReward = taskReward;
    this.createdAt = Date.now();
  }
}

class TaskLibrary {
  constructor() {
    this.availableTasks = [];
    this.initializeDefaultTasks(); 
  }

  // Adds a task to the library
  addTask(task) {
    this.availableTasks.push(task);
  }

  // Loads a predefined set of tasks
  initializeDefaultTasks() {
    this.addTask(new Task("001","ALL", 10, "Gather", "Incomplete"));
    this.addTask(new Task("002","Builder", 20, "Build", "Incomplete"));
    this.addTask(new Task("003","Warrior", 15, "Defend", "Incomplete"));
    this.addTask(new Task("004","Farmer", 12, "Harvest", "Incomplete"));
    this.addTask(new Task("005","Scout", 8, "Explore", "Incomplete"));
  }

  // Get all tasks for a specific species
  getTasksForSpecies(species) {
    return this.availableTasks.filter(
      t => t.antSpecie === species || t.antSpecie === "ALL"
    );
  }

  // Get task(s) by type
  getTaskByType(type) {
    return this.availableTasks.filter(t => t.taskType === type);
  }

  // Optional: print the library for debugging
  printAllTasks() {
    console.table(this.availableTasks);
  }
  
  //add in statement to avoid duplicates
  //just a place holder for now
  //a more detailed implementation will include minimum requirements for the task list
  assignTask(numberOfTasks){
  let arrTask = []
  for (let i = 0; i < numberOfTasks; i++){
    let newTask = random(availableTasks);
    arrTask.push(newTask)
  }
  return arrTask;
  }

//how do i want to determine a task to be completed?
//tasks should be collectables, ants should be able ot bring collected items back to task base
//make the base a collectable area
//maybe make a dropoff area for the task base


  collectItem(item){
    //ant is commanded to dropoff item at task base/dropoff box
  }
  
  completeTask(task){
    //if item collected === item in task... check it off as complete
  }
  
  rewardCount(reward){
    //take in the reward and convert it to game currency
  }
 
}
