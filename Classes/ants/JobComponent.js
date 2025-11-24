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
        return { strength: 30, health: 120, gatherSpeed: 15, movementSpeed: 55 };

      case "Scout":
        return { strength: 30, health: 70, gatherSpeed: 8, movementSpeed: 85 };

      case "Farmer":
        return { strength: 30, health: 100, gatherSpeed: 35, movementSpeed: 50 };

      case "Warrior":
        return { strength: 45, health: 300, gatherSpeed: 5, movementSpeed: 45 };

      case "Spitter":
        return { strength: 40, health: 110, gatherSpeed: 5, movementSpeed: 55 };

      case "DeLozier":
        return { strength: 45, health: 160, gatherSpeed: 5, movementSpeed: 45 };

      case "Queen":
        // Playable queen ant stats
        return { strength: 25, health: 500, gatherSpeed: 1, movementSpeed: 100 };

      case "Spider":
        return { strength: 80, health: 500, gatherSpeed: 3, movementSpeed: 40 };

      case "AntEater":
        return { strength: 40, health: 500, gatherSpeed: 3, movementSpeed: 40 };

      default:
        return { strength: 15, health: 100, gatherSpeed: 10, movementSpeed: 60 };
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
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JobComponent;
}

// Browser global
if (typeof window !== 'undefined') {
  window.JobComponent = JobComponent;
}