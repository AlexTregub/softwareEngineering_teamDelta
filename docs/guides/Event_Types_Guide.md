# Event Types Guide

**Version**: 1.0.0  
**Last Updated**: October 26, 2025

---

## Table of Contents
1. [Overview](#overview)
2. [Dialogue Events](#dialogue-events)
3. [Spawn Events](#spawn-events)
4. [Tutorial Events](#tutorial-events)
5. [Boss Events](#boss-events)
6. [JSON Schema Reference](#json-schema-reference)
7. [Best Practices](#best-practices)

---

## Overview

The Random Events System supports four core event types, each designed for specific game scenarios:

| Type | Purpose | Use Cases |
|------|---------|-----------|
| **dialogue** | Story, conversations, narrative | Introductions, quest dialogue, story beats |
| **spawn** | Entity spawning | Enemy waves, resource spawns, reinforcements |
| **tutorial** | Player guidance | Tips, hints, multi-step instructions |
| **boss** | Boss encounters | Boss fights, phase transitions, victory/defeat |

All event types share the same base structure and use the EventManager registration system.

---

## Dialogue Events

### Purpose
Display conversations, story beats, and narrative moments to the player.

### Content Schema
```javascript
{
  id: string,           // Unique identifier
  type: 'dialogue',     // Event type
  priority: number,     // 1-10 (1=highest, default=10)
  content: {
    speaker: string,    // Character name (required)
    message: string,    // Dialogue text (required)
    portrait?: string,  // Character portrait image path
    buttons?: [         // Optional response buttons
      {
        text: string,   // Button label
        action: string  // Action identifier for callback
      }
    ],
    voiceLine?: string, // Audio file path
    duration?: number   // Auto-dismiss after ms (if no buttons)
  }
}
```

### Basic Example
```javascript
eventManager.registerEvent({
  id: 'queen-greeting',
  type: 'dialogue',
  priority: 5,
  content: {
    speaker: 'Queen Ant',
    message: 'Welcome to our colony! We need your help to defend against invaders.',
    portrait: 'images/portraits/queen.png'
  }
});

// Trigger the dialogue
eventManager.triggerEvent('queen-greeting');
```

### With Response Buttons
```javascript
eventManager.registerEvent({
  id: 'tutorial-prompt',
  type: 'dialogue',
  priority: 1,
  content: {
    speaker: 'Guide',
    message: 'Would you like to learn the basics of colony management?',
    buttons: [
      { text: 'Yes, teach me', action: 'start-tutorial' },
      { text: 'No, I\'ll figure it out', action: 'skip-tutorial' }
    ]
  },
  onComplete: () => {
    // Check which button was clicked (implement in DialoguePanel)
    const choice = eventManager.getFlag('tutorial_choice');
    if (choice === 'start-tutorial') {
      eventManager.triggerEvent('tutorial-basics');
    }
  }
});
```

### Story Chain Example
```javascript
// Part 1
eventManager.registerEvent({
  id: 'story-intro',
  type: 'dialogue',
  priority: 1,
  content: {
    speaker: 'Elder Ant',
    message: 'Long ago, our ancestors built this great colony...'
  },
  onComplete: () => {
    // Chain to next dialogue
    setTimeout(() => {
      eventManager.triggerEvent('story-conflict');
    }, 2000);
  }
});

// Part 2
eventManager.registerEvent({
  id: 'story-conflict',
  type: 'dialogue',
  priority: 1,
  content: {
    speaker: 'Elder Ant',
    message: 'But now, a new threat emerges from the north.'
  },
  onComplete: () => {
    eventManager.setFlag('story_intro_complete', true);
  }
});
```

### Auto-Dismiss Example
```javascript
eventManager.registerEvent({
  id: 'hint-resources',
  type: 'dialogue',
  priority: 8,
  content: {
    speaker: 'Advisor',
    message: 'Tip: Gather food near the colony entrance.',
    duration: 5000 // Auto-dismiss after 5 seconds
  }
});
```

---

## Spawn Events

### Purpose
Spawn entities (enemies, resources, NPCs) into the game world.

### Content Schema
```javascript
{
  id: string,           // Unique identifier
  type: 'spawn',        // Event type
  priority: number,     // 1-10 (1=highest, default=10)
  content: {
    entityType: string, // Entity type to spawn (required)
    count: number,      // How many to spawn (required)
    faction: string,    // Faction/team (required)
    spawnPattern: string, // How to position spawns (optional)
    positions?: [       // Exact spawn positions (optional)
      { x: number, y: number }
    ],
    spawnRadius?: number, // Random radius around point
    centerX?: number,   // Center point for radius spawn
    centerY?: number,
    behavior?: string,  // AI behavior override
    customData?: {}     // Additional entity properties
  }
}
```

### Basic Enemy Wave
```javascript
eventManager.registerEvent({
  id: 'enemy-wave-1',
  type: 'spawn',
  priority: 3,
  content: {
    entityType: 'Warrior',
    count: 10,
    faction: 'enemy',
    spawnPattern: 'viewport-edge' // Spawn at screen edges
  },
  onTrigger: () => {
    console.log('Enemy wave incoming!');
    // Show warning UI
  },
  onComplete: () => {
    console.log('Wave spawned successfully');
    eventManager.setFlag('wave_1_spawned', true);
  }
});
```

### Specific Position Spawn
```javascript
eventManager.registerEvent({
  id: 'boss-spawn',
  type: 'spawn',
  priority: 1,
  content: {
    entityType: 'BossAnt',
    count: 1,
    faction: 'enemy',
    positions: [
      { x: 1000, y: 1000 } // Exact spawn location
    ],
    behavior: 'boss-aggressive',
    customData: {
      health: 500,
      damage: 20,
      bossPhase: 1
    }
  },
  onTrigger: () => {
    // Play boss music, show health bar
    eventManager.triggerEvent('boss-intro-dialogue');
  }
});
```

### Radius Spawn Pattern
```javascript
eventManager.registerEvent({
  id: 'resource-spawn',
  type: 'spawn',
  priority: 7,
  content: {
    entityType: 'FoodResource',
    count: 5,
    faction: 'neutral',
    spawnPattern: 'radius',
    centerX: 500,
    centerY: 500,
    spawnRadius: 100 // Spawn within 100 pixels of center
  }
});
```

### Progressive Wave System
```javascript
// Wave 1
eventManager.registerEvent({
  id: 'wave-1',
  type: 'spawn',
  priority: 3,
  content: {
    entityType: 'Worker',
    count: 5,
    faction: 'enemy',
    spawnPattern: 'viewport-edge'
  },
  onComplete: () => {
    // Trigger next wave after enemies defeated
    eventManager.registerTrigger({
      eventId: 'wave-2',
      type: 'conditional',
      oneTime: true,
      condition: () => {
        const enemiesAlive = spatialGridManager.getEntitiesByType('enemy').length;
        return enemiesAlive === 0 && eventManager.getFlag('wave_1_spawned');
      }
    });
  }
});

// Wave 2 (harder)
eventManager.registerEvent({
  id: 'wave-2',
  type: 'spawn',
  priority: 3,
  content: {
    entityType: 'Warrior',
    count: 10,
    faction: 'enemy',
    spawnPattern: 'viewport-edge'
  }
});
```

---

## Tutorial Events

### Purpose
Guide players through game mechanics with step-by-step instructions.

### Content Schema
```javascript
{
  id: string,           // Unique identifier
  type: 'tutorial',     // Event type
  priority: number,     // 1-10 (typically 1-2 for tutorials)
  content: {
    title: string,      // Tutorial title (required)
    steps: string[],    // Array of instruction steps (required)
    highlightElement?: string,  // UI element to highlight
    highlightPosition?: { x: number, y: number }, // World position
    allowSkip?: boolean,        // Can player skip? (default: true)
    completionCondition?: Function, // Check if player completed task
    rewards?: {         // Optional rewards for completion
      experience: number,
      resources: {}
    }
  }
}
```

### Basic Tutorial
```javascript
eventManager.registerEvent({
  id: 'tutorial-basics',
  type: 'tutorial',
  priority: 1,
  content: {
    title: 'Colony Basics',
    steps: [
      'Click on ants to select them',
      'Right-click to move selected ants',
      'Use WASD keys to pan the camera',
      'Press Space to pause/unpause'
    ],
    allowSkip: true
  },
  onComplete: () => {
    eventManager.setFlag('tutorial_basics_complete', true);
    // Trigger next tutorial
    eventManager.triggerEvent('tutorial-gathering');
  }
});
```

### Tutorial with Highlighting
```javascript
eventManager.registerEvent({
  id: 'tutorial-resource-gathering',
  type: 'tutorial',
  priority: 1,
  content: {
    title: 'Gathering Resources',
    steps: [
      'Select a worker ant',
      'Right-click on the food pile to gather',
      'Return to the colony to deposit food'
    ],
    highlightPosition: { x: 300, y: 200 }, // Highlight food location
    completionCondition: () => {
      // Check if player gathered food
      return eventManager.getFlag('food_gathered_count', 0) > 0;
    }
  },
  update: () => {
    // Check completion each frame
    if (this.content.completionCondition()) {
      eventManager.completeEvent('tutorial-resource-gathering');
    }
  }
});
```

### Multi-Stage Tutorial Chain
```javascript
// Stage 1: Movement
eventManager.registerEvent({
  id: 'tutorial-1-movement',
  type: 'tutorial',
  priority: 1,
  content: {
    title: 'Movement',
    steps: ['Click to select', 'Right-click to move']
  },
  onComplete: () => {
    eventManager.triggerEvent('tutorial-2-gathering');
  }
});

// Stage 2: Gathering
eventManager.registerEvent({
  id: 'tutorial-2-gathering',
  type: 'tutorial',
  priority: 1,
  content: {
    title: 'Gathering',
    steps: ['Select worker', 'Click food', 'Return to colony']
  },
  onComplete: () => {
    eventManager.triggerEvent('tutorial-3-combat');
  }
});

// Stage 3: Combat
eventManager.registerEvent({
  id: 'tutorial-3-combat',
  type: 'tutorial',
  priority: 1,
  content: {
    title: 'Combat',
    steps: ['Select warriors', 'Attack enemies']
  },
  onComplete: () => {
    eventManager.setFlag('all_tutorials_complete', true);
    // Give reward
    eventManager.triggerEvent('tutorial-complete-reward');
  }
});
```

---

## Boss Events

### Purpose
Orchestrate complex boss encounters with phases, dialogue, and special mechanics.

### Content Schema
```javascript
{
  id: string,           // Unique identifier
  type: 'boss',         // Event type
  priority: number,     // 1-2 (bosses are high priority)
  content: {
    bossName: string,   // Boss identifier (required)
    phase: number,      // Current phase (required)
    totalPhases: number, // How many phases (required)
    introDialogue?: string,  // Intro message
    phaseDialogue?: {},      // Dialogue per phase
    mechanics?: string[],    // Special abilities/mechanics
    victoryEvent?: string,   // Event ID to trigger on victory
    defeatEvent?: string,    // Event ID to trigger on defeat
    music?: string,          // Boss music track
    arena?: {                // Arena boundaries
      x: number,
      y: number,
      width: number,
      height: number
    }
  }
}
```

### Basic Boss Fight
```javascript
// Boss intro
eventManager.registerEvent({
  id: 'termite-king-intro',
  type: 'dialogue',
  priority: 1,
  content: {
    speaker: 'Termite King',
    message: 'You dare invade my territory?!',
    voiceLine: 'audio/boss/termite_king_intro.mp3'
  },
  onComplete: () => {
    // Start boss fight after dialogue
    eventManager.triggerEvent('termite-king-fight');
  }
});

// Boss fight event
eventManager.registerEvent({
  id: 'termite-king-fight',
  type: 'boss',
  priority: 1,
  content: {
    bossName: 'Termite King',
    phase: 1,
    totalPhases: 3,
    mechanics: ['ground-pound', 'summon-minions', 'charge-attack'],
    music: 'audio/music/boss_theme.mp3',
    arena: {
      x: 800,
      y: 800,
      width: 400,
      height: 400
    },
    victoryEvent: 'termite-king-defeated',
    defeatEvent: 'game-over'
  },
  onTrigger: () => {
    // Spawn boss entity
    eventManager.triggerEvent('boss-spawn');
    // Lock camera to arena
    // Start boss music
  }
});
```

### Multi-Phase Boss
```javascript
// Phase 1
eventManager.registerEvent({
  id: 'boss-phase-1',
  type: 'boss',
  priority: 1,
  content: {
    bossName: 'Fire Ant Queen',
    phase: 1,
    totalPhases: 3,
    phaseDialogue: {
      start: 'You will burn!',
      end: 'This isn\'t over!'
    },
    mechanics: ['fire-spit', 'burn-ground']
  },
  update: () => {
    // Check boss health for phase transition
    const boss = spatialGridManager.getEntitiesByType('FireAntQueen')[0];
    if (boss && boss.health < boss.maxHealth * 0.66) {
      eventManager.completeEvent('boss-phase-1');
      eventManager.triggerEvent('boss-phase-2');
    }
  }
});

// Phase 2 (66% health)
eventManager.registerEvent({
  id: 'boss-phase-2',
  type: 'boss',
  priority: 1,
  content: {
    bossName: 'Fire Ant Queen',
    phase: 2,
    totalPhases: 3,
    phaseDialogue: {
      start: 'Feel the heat of my fury!'
    },
    mechanics: ['fire-spit', 'burn-ground', 'summon-fire-ants']
  },
  onTrigger: () => {
    // Spawn fire ant minions
    eventManager.triggerEvent('fire-ant-spawn-phase-2');
  },
  update: () => {
    const boss = spatialGridManager.getEntitiesByType('FireAntQueen')[0];
    if (boss && boss.health < boss.maxHealth * 0.33) {
      eventManager.completeEvent('boss-phase-2');
      eventManager.triggerEvent('boss-phase-3');
    }
  }
});

// Phase 3 (33% health - enrage)
eventManager.registerEvent({
  id: 'boss-phase-3',
  type: 'boss',
  priority: 1,
  content: {
    bossName: 'Fire Ant Queen',
    phase: 3,
    totalPhases: 3,
    phaseDialogue: {
      start: 'I WILL INCINERATE YOU ALL!'
    },
    mechanics: ['fire-spit', 'burn-ground', 'summon-fire-ants', 'meteor-strike']
  },
  onTrigger: () => {
    // Boss enrages - faster attacks, more damage
  },
  update: () => {
    const boss = spatialGridManager.getEntitiesByType('FireAntQueen')[0];
    if (boss && boss.health <= 0) {
      eventManager.completeEvent('boss-phase-3');
      eventManager.triggerEvent('boss-victory');
    }
  }
});

// Victory
eventManager.registerEvent({
  id: 'boss-victory',
  type: 'dialogue',
  priority: 1,
  content: {
    speaker: 'Narrator',
    message: 'The Fire Ant Queen has been defeated! The colony is safe.'
  },
  onComplete: () => {
    eventManager.setFlag('fire_ant_queen_defeated', true);
    // Give rewards, unlock new area, etc.
  }
});
```

---

## JSON Schema Reference

### Complete Event Structure
```json
{
  "events": [
    {
      "id": "unique-event-id",
      "type": "dialogue | spawn | tutorial | boss",
      "priority": 1,
      "content": {
        // Type-specific content (see schemas above)
      }
    }
  ],
  "triggers": [
    {
      "id": "unique-trigger-id",
      "eventId": "unique-event-id",
      "type": "time | flag | spatial | conditional | viewport",
      "oneTime": true,
      "condition": {
        // Type-specific condition
      }
    }
  ]
}
```

### Dialogue Event JSON
```json
{
  "id": "welcome-dialogue",
  "type": "dialogue",
  "priority": 5,
  "content": {
    "speaker": "Queen Ant",
    "message": "Welcome to the colony!",
    "portrait": "images/queen.png",
    "buttons": [
      { "text": "Thanks!", "action": "accept" }
    ]
  }
}
```

### Spawn Event JSON
```json
{
  "id": "enemy-wave",
  "type": "spawn",
  "priority": 3,
  "content": {
    "entityType": "Warrior",
    "count": 10,
    "faction": "enemy",
    "spawnPattern": "viewport-edge"
  }
}
```

### Tutorial Event JSON
```json
{
  "id": "tutorial-basics",
  "type": "tutorial",
  "priority": 1,
  "content": {
    "title": "Movement",
    "steps": [
      "Click to select",
      "Right-click to move"
    ],
    "allowSkip": true
  }
}
```

### Boss Event JSON
```json
{
  "id": "boss-fight",
  "type": "boss",
  "priority": 1,
  "content": {
    "bossName": "Termite King",
    "phase": 1,
    "totalPhases": 3,
    "introDialogue": "Prepare to die!",
    "mechanics": ["ground-pound", "charge"],
    "victoryEvent": "boss-defeated",
    "defeatEvent": "game-over"
  }
}
```

---

## Best Practices

### Priority Guidelines
- **Priority 1-2**: Critical events (boss fights, game-over, required tutorials)
- **Priority 3-5**: Important events (enemy waves, story dialogue)
- **Priority 6-8**: Normal events (tips, hints)
- **Priority 9-10**: Low priority (ambient dialogue, flavor text)

### Event IDs
- Use kebab-case: `boss-fight-1`, `tutorial-movement`
- Be descriptive: `enemy-wave-north-gate` not `wave1`
- Include sequence numbers: `dialogue-intro-1`, `dialogue-intro-2`

### Content Structure
- **Required fields**: Always include `id`, `type`, `content`
- **Validation**: Validate content structure before registration
- **Null safety**: Provide defaults for optional fields
- **Callbacks**: Use `onTrigger`, `onComplete` for chaining

### Performance
- Limit active events (max 3-5 concurrent)
- Use `oneTime: true` for triggers that shouldn't repeat
- Complete events when done to free memory
- Avoid expensive operations in `update()` callbacks

### Testing
```javascript
// Test event registration
const success = eventManager.registerEvent(config);
console.assert(success, 'Event registration failed');

// Test event triggering
const triggered = eventManager.triggerEvent('test-event');
console.assert(triggered, 'Event trigger failed');

// Test completion
eventManager.completeEvent('test-event');
console.assert(!eventManager.isEventActive('test-event'), 'Event still active');
```

---

**Related Documentation**:
- [EventManager API Reference](EventManager_API_Reference.md)
- [Trigger Types Guide](Trigger_Types_Guide.md)
- [Integration Guide](Integration_Guide.md)
