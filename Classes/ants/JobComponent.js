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
        // Strong enough to build and carry, average mobility
        return { strength: 20, health: 120, gatherSpeed: 15, movementSpeed: 55 };

      case "Scout":
        // Fast and agile, but fragile
        return { strength: 10, health: 70, gatherSpeed: 8, movementSpeed: 85 };

      case "Farmer":
        // Focused on gathering efficiency
        return { strength: 15, health: 100, gatherSpeed: 35, movementSpeed: 50 };

      case "Warrior":
        // Heavy combat role: high strength and durability, slower speed
        return { strength: 45, health: 160, gatherSpeed: 5, movementSpeed: 45 };

      case "Spitter":
        // Ranged attacker: moderate health, good damage, slightly faster than warrior
        return { strength: 35, health: 110, gatherSpeed: 5, movementSpeed: 55 };

      case "DeLozier":
        return { strength: 45, health: 160, gatherSpeed: 5, movementSpeed: 45 };

      case "Queen":
        // Central unit: extremely durable but immobile and weak in combat
        return { strength: 25, health: 1000, gatherSpeed: 1, movementSpeed: 10 };

      case "Spider":
        return { strength: 80, health: 5000, gatherSpeed: 3, movementSpeed: 40 };

      default:
        // Generic fallback for untyped ants
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