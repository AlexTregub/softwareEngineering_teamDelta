/**
 * EventTemplates - Predefined event templates for Level Editor
 * 
 * Provides common event configurations that users can select
 * to quickly create events without manual configuration.
 * 
 * Templates include:
 * - Dialogue events (show message when player enters area)
 * - Spawn events (spawn entities at location)
 * - Tutorial events (show tutorial popups)
 * - Boss events (trigger boss encounters)
 * 
 * @author Software Engineering Team Delta
 */

const EVENT_TEMPLATES = {
  dialogue: {
    id: 'dialogue_template',
    name: 'Dialogue',
    description: 'Show dialogue when player enters area',
    type: 'dialogue',
    priority: 5,
    icon: '💬', // Speech bubble emoji
    defaultContent: {
      speaker: 'NPC',
      message: 'Welcome to the forest!',
      duration: 3000
    },
    defaultTrigger: {
      type: 'spatial',
      radius: 64,
      oneTime: true
    }
  },
  
  spawn: {
    id: 'spawn_template',
    name: 'Spawn',
    description: 'Spawn entities at location',
    type: 'spawn',
    priority: 5,
    icon: '🐜', // Ant emoji
    defaultContent: {
      entityType: 'Ant',
      count: 5,
      spread: 32,
      jobName: 'Worker'
    },
    defaultTrigger: {
      type: 'time',
      delay: 5000,
      oneTime: true
    }
  },
  
  tutorial: {
    id: 'tutorial_template',
    name: 'Tutorial',
    description: 'Show tutorial message',
    type: 'tutorial',
    priority: 10,
    icon: '💡', // Light bulb emoji
    defaultContent: {
      title: 'Tip',
      message: 'Click to collect resources',
      duration: 5000,
      position: 'top-center'
    },
    defaultTrigger: {
      type: 'viewport',
      oneTime: true
    }
  },
  
  boss: {
    id: 'boss_template',
    name: 'Boss',
    description: 'Trigger boss encounter',
    type: 'boss',
    priority: 1,
    icon: '👑', // Crown emoji
    defaultContent: {
      bossType: 'QueenAnt',
      music: 'boss_battle.mp3',
      healthMultiplier: 5.0
    },
    defaultTrigger: {
      type: 'flag',
      requiredFlags: ['area_cleared'],
      oneTime: true
    }
  }
};

/**
 * Get all available templates as array
 * @returns {Array} Array of template objects
 */
function getEventTemplates() {
  return Object.values(EVENT_TEMPLATES);
}

/**
 * Get template by ID
 * @param {string} id - Template ID
 * @returns {Object|null} Template object or null if not found
 */
function getTemplateById(id) {
  return EVENT_TEMPLATES[id] || null;
}

/**
 * Get template by type
 * @param {string} type - Event type (dialogue, spawn, tutorial, boss)
 * @returns {Object|null} Template object or null if not found
 */
function getTemplateByType(type) {
  const templates = Object.values(EVENT_TEMPLATES);
  return templates.find(t => t.type === type) || null;
}

// Global exports
if (typeof window !== 'undefined') {
  window.EVENT_TEMPLATES = EVENT_TEMPLATES;
  window.getEventTemplates = getEventTemplates;
  window.getTemplateById = getTemplateById;
  window.getTemplateByType = getTemplateByType;
}

// Node.js exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EVENT_TEMPLATES,
    getEventTemplates,
    getTemplateById,
    getTemplateByType
  };
}
