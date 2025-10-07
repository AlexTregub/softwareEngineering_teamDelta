// JobComponent - Simple component for job data and stats
// Replaces the complex Job inheritance system with composition

class JobComponent {
  constructor(name, image = null) {
    this.name = name;
    this.image = image;
    this.stats = JobComponent.getJobStats(name);
  }

  // === JOB PROGRESSION & EXPERIENCE SYSTEM ===
  
  // Static storage for ant experience data
  static experienceData = new Map(); // antId -> experience points
  
  /**
   * Add experience points to an ant
   * @param {string} antId - Unique identifier for the ant
   * @param {number} amount - Amount of experience to add
   */
  static addExperience(antId, amount) {
    if (!antId || amount <= 0) return;
    
    const current = this.experienceData.get(antId) || 0;
    this.experienceData.set(antId, current + amount);
  }
  
  /**
   * Get current experience points for an ant
   * @param {string} antId - Unique identifier for the ant
   * @returns {number} Current experience points
   */
  static getExperience(antId) {
    return this.experienceData.get(antId) || 0;
  }
  
  /**
   * Get experience requirements for a specific level
   * @param {number} level - Target level
   * @returns {number} Experience points required for that level
   */
  static getLevelRequirements(level) {
    if (level <= 1) return 0;
    
    // Exponential progression curve
    const baseExp = 100;
    const multiplier = 1.5;
    
    switch (level) {
      case 2: return 100;
      case 3: return 250; 
      case 4: return 500;
      case 5: return 1000;
      default: return Math.floor(baseExp * Math.pow(multiplier, level - 2));
    }
  }
  
  /**
   * Calculate current level based on experience
   * @param {string} antId - Unique identifier for the ant
   * @returns {number} Current level (1-10)
   */
  static getLevel(antId) {
    const experience = this.getExperience(antId);
    let level = 1;
    const maxLevel = 10;
    
    while (level < maxLevel && experience >= this.getLevelRequirements(level + 1)) {
      level++;
    }
    
    return level;
  }
  
  /**
   * Get job-specific level bonuses
   * @param {string} jobName - Name of the job
   * @param {number} level - Current level
   * @returns {Object} Bonus stats and abilities for this job/level combination
   */
  static getLevelBonus(jobName, level) {
    if (level <= 1) {
      return { strength: 0, health: 0, gatherSpeed: 0, movementSpeed: 0, specialAbilities: [] };
    }
    
    const bonusMultiplier = level - 1; // Level 1 = no bonuses
    
    const jobBonusConfig = {
      Builder: {
        strength: bonusMultiplier * 2,
        health: bonusMultiplier * 12,
        gatherSpeed: Math.floor(bonusMultiplier / 2) + (level >= 3 ? 1 : 0),
        movementSpeed: 0,
        specialAbilities: level >= 5 ? ['Advanced Construction'] : []
      },
      
      Warrior: {
        strength: bonusMultiplier * 4,
        health: bonusMultiplier * 15,
        gatherSpeed: 0,
        movementSpeed: Math.floor(bonusMultiplier / 3),
        specialAbilities: level >= 5 ? ['Charge Attack'] : []
      },
      
      Scout: {
        strength: bonusMultiplier * 1,
        health: bonusMultiplier * 8,
        gatherSpeed: level === 3 ? 2 : bonusMultiplier * 2,
        movementSpeed: level === 3 ? 12 : level === 5 ? 20 : bonusMultiplier * 4,
        specialAbilities: level >= 5 ? ['Sprint Burst'] : []
      },
      
      Farmer: {
        strength: bonusMultiplier * 1.5,
        health: bonusMultiplier * 10,
        gatherSpeed: bonusMultiplier * 3,
        movementSpeed: 0,
        specialAbilities: level >= 5 ? ['Efficient Harvest'] : []
      },
      
      Spitter: {
        strength: bonusMultiplier * 3,
        health: bonusMultiplier * 9,
        gatherSpeed: bonusMultiplier * 1,
        movementSpeed: bonusMultiplier * 2,
        specialAbilities: level >= 5 ? ['Acid Splash'] : []
      },
      
      DeLozier: {
        strength: bonusMultiplier * 100,
        health: bonusMultiplier * 1000,
        gatherSpeed: 0,
        movementSpeed: bonusMultiplier * 100,
        specialAbilities: level >= 2 ? ['Divine Power'] : []
      }
    };
    
    return jobBonusConfig[jobName] || {
      strength: bonusMultiplier,
      health: bonusMultiplier * 10,
      gatherSpeed: bonusMultiplier,
      movementSpeed: bonusMultiplier,
      specialAbilities: []
    };
  }
  
  /**
   * Get comprehensive progression statistics for an ant
   * @param {string} jobName - Name of the job
   * @param {number} level - Current level
   * @returns {Object} Complete progression stats including totals
   */
  static getProgressionStats(jobName, level) {
    const baseStats = this.getJobStats(jobName);
    const bonuses = this.getLevelBonus(jobName, level);
    
    const totalStats = {
      strength: baseStats.strength + bonuses.strength,
      health: baseStats.health + bonuses.health,
      gatherSpeed: baseStats.gatherSpeed + bonuses.gatherSpeed,
      movementSpeed: baseStats.movementSpeed + bonuses.movementSpeed
    };
    
    const currentLevelExp = this.getLevelRequirements(level);
    const nextLevelExp = this.getLevelRequirements(level + 1);
    
    return {
      currentLevel: level,
      baseStats: baseStats,
      bonuses: bonuses,
      totalStats: totalStats,
      specialAbilities: bonuses.specialAbilities || [],
      totalExperienceForCurrentLevel: currentLevelExp,
      experienceToNextLevel: level < 10 ? nextLevelExp - currentLevelExp : 0
    };
  }
  
  /**
   * Calculate experience gained from different activities
   * @param {string} activityType - Type of activity (building, gathering, combat, etc.)
   * @param {Object} activityData - Details about the activity
   * @returns {number} Experience points earned
   */
  static getExperienceFromActivity(activityType, activityData = {}) {
    const experienceRates = {
      building: {
        base: 15,
        multipliers: {
          nest: 2.0,
          tunnel: 1.5,
          storage: 1.2,
          defense: 1.8
        }
      },
      
      gathering: {
        base: 5,
        multipliers: {
          food: 1.0,
          materials: 1.2,
          rare: 2.0
        }
      },
      
      combat: {
        base: 20,
        multipliers: {
          victory: 1.0,
          defeat: 0.3,
          assist: 0.6
        }
      },
      
      exploration: {
        base: 10,
        multipliers: {
          newArea: 1.5,
          resource: 1.2,
          danger: 1.8
        }
      }
    };
    
    const config = experienceRates[activityType];
    if (!config) return 0;
    
    let experience = config.base;
    
    // Apply multipliers based on activity data
    switch (activityType) {
      case 'building':
        if (activityData.structureType && config.multipliers[activityData.structureType]) {
          experience *= config.multipliers[activityData.structureType];
        }
        if (activityData.complexity === 'high') experience *= 1.5;
        break;
        
      case 'gathering':
        if (activityData.resourceType && config.multipliers[activityData.resourceType]) {
          experience *= config.multipliers[activityData.resourceType];
        }
        if (activityData.amount) {
          experience *= Math.min(activityData.amount / 50, 2.0); // Scale with amount, cap at 2x
        }
        break;
        
      case 'combat':
        if (activityData.victory !== undefined) {
          experience *= activityData.victory ? config.multipliers.victory : config.multipliers.defeat;
        }
        if (activityData.enemyType === 'boss') experience *= 3.0;
        break;
        
      case 'exploration':
        if (activityData.newArea) experience *= config.multipliers.newArea;
        if (activityData.danger) experience *= config.multipliers.danger;
        break;
    }
    
    return Math.floor(experience);
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
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JobComponent;
}

// Browser global
if (typeof window !== 'undefined') {
  window.JobComponent = JobComponent;
}