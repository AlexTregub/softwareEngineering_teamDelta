// --- Job Lists ---
const _JobList = ["Builder", "Scout", "Farmer", "Warrior", "Spitter"];
const _specialJobList = ["DeLozier"];
const _allJob = [..._JobList, ..._specialJobList];

// --- Job Class ---
class Job extends ant {
  constructor(antObject, JobName, JobImage) {
    const JobStats = Job.getJobStats(JobName);
    const pos = antObject.getPosition();
    const size = antObject.getSize();
    super(
      pos.x,
      pos.y,
      size.x,
      size.y,
      JobStats.movementSpeed ?? 30,
      0,
      JobImage,
      JobName
    );
    this.img = JobImage;
    this.JobName = JobName;
    this.exp = antObject.StatsContainer?.exp || 0;
    // Apply Job-specific StatsContainer
    this._applyJobStats(JobStats);
    this.waypoints = [];
  }

  // Allow SelectionBoxController to check mouse over for Job-wrapped ants
  isMouseOver(mx, my) {
    if (typeof super.isMouseOver === 'function') {
      return super.isMouseOver(mx, my);
    }
    // fallback: use bounding box
    const pos = this.getPosition();
    const size = this.getSize();
    const inside = (
      mx >= pos.x &&
      mx <= pos.x + size.x &&
      my >= pos.y &&
      my <= pos.y + size.y
    );
    console.log(`[Job] isMouseOver: Job=${this.JobName}, mx=${mx}, my=${my}, pos=`, pos, 'size=', size, '->', inside);
    return inside;
  }

  _applyJobStats(JobStats) {
    this._maxHealth = JobStats.health;
    this._health = JobStats.health;
    this._damage = JobStats.strength;
    if (this.StatsContainer) {
      this.StatsContainer.strength.statValue = JobStats.strength;
      this.StatsContainer.health.statValue = JobStats.health;
      this.StatsContainer.gatherSpeed.statValue = JobStats.gatherSpeed;
      this.StatsContainer.movementSpeed.statValue = JobStats.movementSpeed;
    }
    const movementController = this.getController('movement');
    if (movementController) {
      movementController.movementSpeed = JobStats.movementSpeed;
    }
  }

  static getJobStats(JobName) {
    switch (JobName) {
      case "Builder":
        return { strength: 20, health: 120, gatherSpeed: 15, movementSpeed: 60 };
      case "Scout":
        return { strength: 10, health: 80, gatherSpeed: 10, movementSpeed: 80 };
      case "Farmer":
        return { strength: 15, health: 100, gatherSpeed: 30, movementSpeed: 60 };
      case "Warrior":
        return { strength: 40, health: 150, gatherSpeed: 5, movementSpeed: 60 };
      case "Spitter":
        return { strength: 30, health: 90, gatherSpeed: 8, movementSpeed: 60 };
      case "DeLozier":
        return { strength: 1000, health: 10000, gatherSpeed: 1, movementSpeed: 10000 };
      default:
        return { strength: 10, health: 100, gatherSpeed: 10, movementSpeed: 60 };
    }
  }

  update() {
    super.update();
    if (typeof outlinedText !== 'undefined') {
      const center = this.getCenter();
      push();
      rectMode(CENTER);
      const size = this.getSize();
      const labelY = center.y + size.y / 2 + 15;
      outlinedText(
        this.JobName,
        center.x,
        labelY,
        g_menuFont,
        13,
        color(255),
        color(0)
      );
      pop();
    }
  }

  ResolveMoment() {
    if (this._isMoving) {
      const pos = this.getPosition();
      const current = createVector(pos.x, pos.y);
      const target = createVector(
        this._stats.pendingPos.statValue.x,
        this._stats.pendingPos.statValue.y
      );
      const direction = p5.Vector.sub(target, current);
      const distance = direction.mag();
      if (distance > 1) {
        direction.normalize();
        const speedPerMs = this.movementSpeed / 1000;
        const step = Math.min(speedPerMs * deltaTime, distance);
        current.x += direction.x * step;
        current.y += direction.y * step;
        this.setPosition(current.x, current.y);
        this.setImage(current);
      } else {
        this.setPosition(target.x, target.y);
        this._isMoving = false;
        this.setImage(target);
        if(this.isDroppingOff || this.isMaxWeight ){
          for(let r of this.Resources){
            globalResource.push(r);
          }
          this.Resources = [];
          this.isDroppingOff = false;
          this.isMaxWeight  = false;
        }
      }
      this.render();
    }
  }

  getStatsSummary() {
    let expSummary = {};
    for (let [key, statObj] of this.StatsContainer.exp.entries()) {
      expSummary[key] = statObj.statValue;
    }
    return {
      Job: this.JobName,
      strength: this.StatsContainer.strength.statValue,
      health: this.StatsContainer.health.statValue,
      gatherSpeed: this.StatsContainer.gatherSpeed.statValue,
      movementSpeed: this.StatsContainer.movementSpeed.statValue,
      exp: expSummary
    };
  }
}

// --- Job Management Functions ---
function assignJob() {
  const JobList = !hasDeLozier ? _specialJobList : _JobList;
  const chosenJob = JobList[Math.floor(random(0, JobList.length))];
  if (chosenJob === "DeLozier") { 
    hasDeLozier = true; 
  }
  return chosenJob;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = Job;
}
