// JobComponent - Simple component for job data and stats
// Replaces the complex Job inheritance system with composition

class JobComponent {
  constructor(name, image = null) {
    this.name = name;
    this.image = image;
    this.stats = JobComponent.getJobStats(name);
  }

  // Static method - moved from Job class
  static getJobStats(jobName) {
    switch (jobName) {
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

  // Helper methods
  static getJobList() {
    return ["Builder", "Scout", "Farmer", "Warrior", "Spitter"];
  }

  static getSpecialJobs() {
    return ["DeLozier"];
  }

  static getAllJobs() {
    return [...JobComponent.getJobList(), ...JobComponent.getSpecialJobs()];
  }
}

// Export for Node.js testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = JobComponent;
}

// Browser global
if (typeof window !== 'undefined') {
  window.JobComponent = JobComponent;
}