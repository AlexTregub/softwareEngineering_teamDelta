/**
 * Dialogue System Demo Script
 * 
 * This script demonstrates the dialogue system by:
 * 1. Registering sample dialogue events with EventManager
 * 2. Providing helper functions to trigger dialogues
 * 3. Setting up example dialogue chains
 * 
 * To use in browser console:
 * - triggerDialogue('queen_welcome') - Show Queen's welcome message
 * - triggerDialogue('worker_request') - Show worker's resource request
 * - triggerDialogue('scout_report') - Show scout's food discovery
 * - showAllDialogues() - List all registered dialogues
 * 
 * Or use keyboard shortcuts (when game is running):
 * - Press '1' to trigger Queen's welcome
 * - Press '2' to trigger Worker's request
 * - Press '3' to trigger Scout's report
 */

// Wait for game to be ready
function initializeDialogueSystem() {
  if (!window.eventManager) {
    console.error('EventManager not available. Make sure game has loaded.');
    return false;
  }

  if (!window.DialogueEvent) {
    console.error('DialogueEvent class not available. Make sure Event.js is loaded.');
    return false;
  }

  logNormal('🎭 Initializing Dialogue System Demo...');

  // Register sample dialogues
  registerSampleDialogues();

  // Set up keyboard shortcuts
  setupDialogueKeyboardShortcuts();

  // Make helper functions globally available
  window.triggerDialogue = triggerDialogue;
  window.showAllDialogues = showAllDialogues;
  window.registerSampleDialogues = registerSampleDialogues;

  logNormal('✅ Dialogue System Demo Ready!');
  logNormal('\n📚 Available Functions:');
  logNormal('  triggerDialogue(id) - Trigger a specific dialogue');
  logNormal('  showAllDialogues() - List all registered dialogues');
  logNormal('\n⌨️  Keyboard Shortcuts:');
  logNormal('  Press 1 - Queen\'s Welcome');
  logNormal('  Press 2 - Worker\'s Request');
  logNormal('  Press 3 - Scout\'s Report');
  logNormal('\n💡 Example: triggerDialogue("queen_welcome")');

  return true;
}

/**
 * Register sample dialogue events
 */
function registerSampleDialogues() {
  if (!window.eventManager || !window.DialogueEvent) {
    console.error('Cannot register dialogues - EventManager or DialogueEvent not available');
    return;
  }

  logNormal('📝 Registering sample dialogues...');

  // Dialogue 1: Queen's Welcome
  const queenWelcome = new DialogueEvent({
    id: 'queen_welcome',
    priority: 1,
    content: {
      speaker: 'Queen Ant',
      message: 'Welcome to our colony! I am the Queen, and I oversee all operations here. We work together to build a thriving community.',
      choices: [
        { 
          text: 'Thank you, Your Majesty!',
          onSelect: () => {
            logNormal('Player chose: Thank you');
          }
        },
        { 
          text: 'What can I do to help?',
          nextEventId: 'worker_request',
          onSelect: () => {
            logNormal('Player chose: Help');
          }
        },
        {
          text: 'Tell me about the colony',
          nextEventId: 'colony_info',
          onSelect: () => {
            logNormal('Player chose: Colony info');
          }
        }
      ]
    }
  });

  // Dialogue 2: Worker's Request
  const workerRequest = new DialogueEvent({
    id: 'worker_request',
    priority: 2,
    content: {
      speaker: 'Worker Ant',
      message: 'We need more resources! The colony is growing rapidly. Food and building materials are running low. Can you help us gather supplies?',
      choices: [
        { 
          text: 'I will gather resources',
          nextEventId: 'scout_report',
          onSelect: () => {
            logNormal('Player accepted gathering mission');
            // Set flag to track mission acceptance
            if (window.eventManager) {
              window.eventManager.setFlag('gathering_mission_accepted', true);
            }
          }
        },
        { 
          text: 'How many workers do we have?',
          nextEventId: 'worker_stats',
          onSelect: () => {
            logNormal('Player asked about workers');
          }
        },
        {
          text: 'Not right now',
          onSelect: () => {
            logNormal('Player declined mission');
          }
        }
      ]
    }
  });

  // Dialogue 3: Scout's Report
  const scoutReport = new DialogueEvent({
    id: 'scout_report',
    priority: 3,
    content: {
      speaker: 'Scout Ant',
      message: 'I found a large food source to the east! There are plenty of leaves and seeds. However, I also spotted rival ants nearby. Should we investigate?',
      choices: [
        { 
          text: 'Yes, send a team!',
          onSelect: () => {
            logNormal('Player sent team to food source');
            if (window.eventManager) {
              window.eventManager.setFlag('food_mission_started', true);
              window.eventManager.setFlag('scout_location_investigated', true);
            }
          }
        },
        { 
          text: 'No, too risky',
          onSelect: () => {
            logNormal('Player avoided risk');
            if (window.eventManager) {
              window.eventManager.setFlag('avoided_risk', true);
            }
          }
        },
        {
          text: 'Tell me more about the rivals',
          nextEventId: 'rival_info',
          onSelect: () => {
            logNormal('Player wants more info');
          }
        }
      ]
    }
  });

  // Dialogue 4: Colony Information
  const colonyInfo = new DialogueEvent({
    id: 'colony_info',
    priority: 4,
    content: {
      speaker: 'Queen Ant',
      message: 'Our colony was founded just a few seasons ago. We have grown from a small group to over 500 ants! We specialize in leaf-cutting and fungus farming.',
      choices: [
        {
          text: 'Fascinating!',
          nextEventId: 'queen_welcome'
        },
        {
          text: 'How can I contribute?',
          nextEventId: 'worker_request'
        }
      ]
    }
  });

  // Dialogue 5: Worker Statistics
  const workerStats = new DialogueEvent({
    id: 'worker_stats',
    priority: 5,
    content: {
      speaker: 'Worker Ant',
      message: 'We currently have 300 workers, 150 soldiers, 30 scouts, and 20 nursery attendants. We could use more of each type as the colony expands!',
      choices: [
        {
          text: 'That\'s a lot of ants!',
          nextEventId: 'worker_request'
        },
        {
          text: 'I\'ll help recruit more',
          onSelect: () => {
            logNormal('Player will help recruit');
            if (window.eventManager) {
              window.eventManager.setFlag('recruiting_mission', true);
            }
          }
        }
      ]
    }
  });

  // Dialogue 6: Rival Information
  const rivalInfo = new DialogueEvent({
    id: 'rival_info',
    priority: 6,
    content: {
      speaker: 'Scout Ant',
      message: 'The rival colony is smaller than ours, but they are aggressive. They have been expanding their territory. If we move quickly, we can secure the food source before they do.',
      choices: [
        {
          text: 'Let\'s move now!',
          onSelect: () => {
            logNormal('Player chose aggressive strategy');
            if (window.eventManager) {
              window.eventManager.setFlag('aggressive_expansion', true);
              window.eventManager.setFlag('food_mission_started', true);
            }
          }
        },
        {
          text: 'We should be cautious',
          nextEventId: 'scout_report'
        }
      ]
    }
  });

  // Dialogue 7: Tutorial Dialogue (auto-continue example)
  const tutorial = new DialogueEvent({
    id: 'tutorial_start',
    priority: 10,
    content: {
      speaker: 'Narrator',
      message: 'Welcome to Ant Colony Simulator! Use the mouse to select ants and give them orders.',
      autoContinue: true,
      autoContinueDelay: 3000,
      choices: [
        {
          text: 'Continue',
          nextEventId: 'queen_welcome'
        }
      ]
    }
  });

  // Register all dialogues with EventManager
  const dialogues = [
    queenWelcome,
    workerRequest,
    scoutReport,
    colonyInfo,
    workerStats,
    rivalInfo,
    tutorial
  ];

  let registered = 0;
  dialogues.forEach(dialogue => {
    if (window.eventManager.registerEvent(dialogue)) {
      registered++;
      logNormal(`  ✅ Registered: ${dialogue.id}`);
    } else {
      console.warn(`  ⚠️  Failed to register: ${dialogue.id}`);
    }
  });

  logNormal(`✅ Registered ${registered}/${dialogues.length} dialogues`);
  return registered;
}

/**
 * Trigger a dialogue by ID
 */
function triggerDialogue(dialogueId) {
  if (!window.eventManager) {
    console.error('EventManager not available');
    return false;
  }

  const dialogue = window.eventManager.getEvent(dialogueId);
  if (!dialogue) {
    console.error(`Dialogue "${dialogueId}" not found`);
    logNormal('Available dialogues:', window.eventManager.getAllEvents().map(e => e.id));
    return false;
  }

  logNormal(`🎭 Triggering dialogue: ${dialogueId}`);
  
  // Make sure we're in PLAYING state to show dialogue
  if (window.gameState !== 'PLAYING') {
    window.gameState = 'PLAYING';
    logNormal('Switched to PLAYING state');
  }

  // Create new DialogueEvent instance and trigger it
  const dialogueEvent = new DialogueEvent(dialogue);
  dialogueEvent.trigger();

  return true;
}

/**
 * Show all registered dialogues
 */
function showAllDialogues() {
  if (!window.eventManager) {
    console.error('EventManager not available');
    return;
  }

  const events = window.eventManager.getAllEvents();
  const dialogues = events.filter(e => e.type === 'dialogue');

  logNormal(`\n📋 Registered Dialogues (${dialogues.length}):\n`);
  
  dialogues.forEach((dialogue, index) => {
    logNormal(`${index + 1}. ${dialogue.id}`);
    logNormal(`   Speaker: ${dialogue.content.speaker}`);
    logNormal(`   Priority: ${dialogue.priority}`);
    logNormal(`   Choices: ${dialogue.content.choices ? dialogue.content.choices.length : 0}`);
    if (dialogue.content.autoContinue) {
      logNormal(`   Auto-continue: Yes (${dialogue.content.autoContinueDelay}ms)`);
    }
    logNormal('');
  });

  logNormal('💡 Trigger any dialogue: triggerDialogue("dialogue_id")');
}

/**
 * Set up keyboard shortcuts for triggering dialogues
 */
function setupDialogueKeyboardShortcuts() {
  // Store original keyPressed function if it exists
  const originalKeyPressed = window.keyPressed;

  window.keyPressed = function() {
    // Call original keyPressed first
    if (originalKeyPressed && typeof originalKeyPressed === 'function') {
      originalKeyPressed();
    }

    // Only trigger dialogues in PLAYING state
    if (window.gameState !== 'PLAYING') {
      return;
    }

    // Number key shortcuts
    if (window.key === '1') {
      triggerDialogue('queen_welcome');
    } else if (window.key === '2') {
      triggerDialogue('worker_request');
    } else if (window.key === '3') {
      triggerDialogue('scout_report');
    } else if (window.key === '4') {
      triggerDialogue('tutorial_start');
    } else if (window.key === 'd' || window.key === 'D') {
      // 'D' key to show all dialogues
      showAllDialogues();
    }
  };

  logNormal('⌨️  Keyboard shortcuts registered');
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  // Wait for game to be ready
  if (window.eventManager && window.DialogueEvent) {
    initializeDialogueSystem();
  } else {
    logNormal('⏳ Waiting for game to load...');
    
    // Poll for game readiness
    const checkInterval = setInterval(() => {
      if (window.eventManager && window.DialogueEvent) {
        clearInterval(checkInterval);
        initializeDialogueSystem();
      }
    }, 500);
    
    // Give up after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!window.eventManager || !window.DialogueEvent) {
        console.error('❌ Dialogue system initialization timed out');
        console.error('Make sure the game has fully loaded');
      }
    }, 10000);
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeDialogueSystem,
    registerSampleDialogues,
    triggerDialogue,
    showAllDialogues,
    setupDialogueKeyboardShortcuts
  };
}
