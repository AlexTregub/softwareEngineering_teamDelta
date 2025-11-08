# Random Events System - Integration Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [System Architecture](#system-architecture)
3. [Common Workflows](#common-workflows)
4. [Integration Patterns](#integration-patterns)
5. [Level Editor Integration](#level-editor-integration)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Quick Start

### 1. Basic Setup

The Random Events System is initialized automatically in `sketch.js`. The EventManager singleton is globally available:

```javascript
// EventManager is already initialized - access it directly
const eventManager = EventManager.getInstance();
```

### 2. Creating Your First Event

```javascript
// Register a simple dialogue event
const event = eventManager.registerEvent({
  id: 'welcome_message',
  type: 'dialogue',
  priority: 1,
  content: {
    speaker: 'Queen Ant',
    message: 'Welcome to the colony!',
    buttons: [
      { text: 'Thanks!', action: 'dismiss' }
    ]
  }
});
```

### 3. Adding a Time Trigger

```javascript
// Trigger the event after 5 seconds
eventManager.registerTrigger('welcome_message', {
  type: 'time',
  condition: { delay: 5000 } // 5000 milliseconds
});
```

### 4. Triggering Manually

```javascript
// You can also trigger events directly from code
eventManager.triggerEvent('welcome_message');
```

That's it! Your first event is ready. The EventManager will:
- Evaluate triggers automatically in the game loop
- Display the dialogue panel when triggered
- Handle button interactions
- Clean up when completed

---

## System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Game Code                         │
│  (sketch.js, AntManager, EntityInventoryManager, etc.)            │
└─────────────────────┬───────────────────────────────────────┘
                      │ Calls registerEvent(), setFlag()
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    EventManager (Singleton)                  │
│  • Manages all events and triggers                          │
│  • Evaluates triggers each frame                            │
│  • Maintains flag system                                    │
│  • Handles event lifecycle                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ Notifies
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                  EventEditorPanel (UI)                       │
│  • Level Editor interface                                   │
│  • Event creation/editing                                   │
│  • JSON import/export                                       │
└─────────────────────────────────────────────────────────────┘
```

### Event Lifecycle

```
1. REGISTRATION
   └─> registerEvent() → Event stored with 'pending' state
   
2. TRIGGER EVALUATION
   └─> update() called each frame
       └─> evaluateTriggers() checks all triggers
           └─> Matching trigger activates event
           
3. EVENT TRIGGERED
   └─> triggerEvent() sets state to 'active'
       └─> UI panel displays content
       
4. EVENT COMPLETED
   └─> User interacts or auto-completes
       └─> completeEvent() sets state to 'completed'
       └─> Completion flag set (event_id_completed = true)
       └─> One-time triggers removed
```

### Integration Points

The Random Events System integrates with:

1. **Game Loop** (`sketch.js::draw()`)
   - `eventManager.update()` called each frame
   - Evaluates triggers, progresses active events

2. **UI System** (`draggablePanelManager`)
   - `EventEditorPanel` for level editing
   - Dialogue panels for in-game events

3. **Flag System** (Global Game State)
   - Set flags: `eventManager.setFlag('flag_name', value)`
   - Check flags: `eventManager.getFlag('flag_name')`
   - Used for story progression, unlocks, conditions

4. **Entity System** (Spawn events)
   - Creates ants, enemies, resources via spawn events
   - Integrates with `AntManager`, `SpatialGridManager`

---

## Common Workflows

### Workflow 1: Time-Based Story Events

**Use Case**: Introduce story elements at specific times during gameplay.

```javascript
// Welcome message after 10 seconds
eventManager.registerEvent({
  id: 'intro_welcome',
  type: 'dialogue',
  priority: 1,
  content: {
    speaker: 'Queen Ant',
    message: 'Greetings, young colony! Your journey begins.',
    buttons: [{ text: 'Continue', action: 'dismiss' }]
  }
});

eventManager.registerTrigger('intro_welcome', {
  type: 'time',
  condition: { delay: 10000 }
});

// First enemy wave warning after 30 seconds
eventManager.registerEvent({
  id: 'enemy_warning',
  type: 'dialogue',
  priority: 2,
  content: {
    speaker: 'Scout Ant',
    message: 'Enemy forces detected approaching from the north!',
    buttons: [{ text: 'Prepare defenses!', action: 'dismiss' }]
  }
});

eventManager.registerTrigger('enemy_warning', {
  type: 'time',
  condition: { delay: 30000 }
});

// Spawn enemies 5 seconds after warning
eventManager.registerEvent({
  id: 'enemy_wave_1',
  type: 'spawn',
  priority: 3,
  content: {
    entityType: 'EnemyAnt',
    count: 5,
    faction: 'enemy',
    pattern: 'viewport-edge'
  }
});

eventManager.registerTrigger('enemy_wave_1', {
  type: 'flag',
  condition: { 
    flags: [{ flag: 'enemy_warning_completed', value: true }],
    operator: '=='
  }
});
```

**Result**: Story unfolds automatically with timed dialogue and enemy spawns.

---

### Workflow 2: Flag-Based Tutorial Chain

**Use Case**: Progressive tutorial that unlocks based on player actions.

```javascript
// Step 1: Explain movement (auto-trigger on game start)
eventManager.registerEvent({
  id: 'tutorial_movement',
  type: 'tutorial',
  priority: 1,
  content: {
    title: 'Tutorial: Movement',
    steps: [
      'Click anywhere on the map to move your ants',
      'Select ants by clicking and dragging',
      'Right-click to give move commands'
    ]
  }
});

eventManager.registerTrigger('tutorial_movement', {
  type: 'time',
  condition: { delay: 1000 } // Show after 1 second
});

// Step 2: Explain resource gathering (after movement tutorial)
eventManager.registerEvent({
  id: 'tutorial_gathering',
  type: 'tutorial',
  priority: 1,
  content: {
    title: 'Tutorial: Gathering Resources',
    steps: [
      'Click on food resources to assign ants',
      'Ants will automatically gather and return to the colony',
      'Gather 10 food to continue'
    ]
  }
});

eventManager.registerTrigger('tutorial_gathering', {
  type: 'flag',
  condition: {
    flags: [{ flag: 'tutorial_movement_completed', value: true }],
    operator: '=='
  }
});

// Step 3: Explain building (after gathering enough food)
eventManager.registerEvent({
  id: 'tutorial_building',
  type: 'tutorial',
  priority: 1,
  content: {
    title: 'Tutorial: Construction',
    steps: [
      'You now have enough food to build',
      'Open the build menu (B key)',
      'Construct your first worker chamber'
    ]
  }
});

eventManager.registerTrigger('tutorial_building', {
  type: 'flag',
  condition: {
    flags: [
      { flag: 'tutorial_gathering_completed', value: true },
      { flag: 'food_count', value: 10 }
    ],
    operator: '>='
  }
});

// IMPORTANT: Set the food_count flag when player gathers food
// In your resource gathering code:
function onResourceGathered(amount) {
  currentFood += amount;
  eventManager.setFlag('food_count', currentFood);
}
```

**Result**: Tutorials appear in sequence, each unlocking when the previous is completed.

---

### Workflow 3: Spatial Exploration Events

**Use Case**: Trigger events when player discovers specific areas.

```javascript
// Hidden resource cache in the northwest
eventManager.registerEvent({
  id: 'discover_cache',
  type: 'dialogue',
  priority: 1,
  content: {
    speaker: 'Scout Ant',
    message: 'We found a hidden cache of food! The ancient colony left resources here.',
    buttons: [{ text: 'Gather it!', action: 'claim_cache' }]
  }
});

eventManager.registerTrigger('discover_cache', {
  type: 'spatial',
  condition: {
    x: 200,
    y: 200,
    radius: 50,
    entityType: 'Ant' // Only trigger when an ant enters
  }
});

// Spawn the resources when player claims cache
eventManager.registerEvent({
  id: 'spawn_cache',
  type: 'spawn',
  priority: 2,
  content: {
    entityType: 'FoodResource',
    count: 1,
    amount: 50, // Custom property
    positions: [{ x: 200, y: 200 }]
  }
});

eventManager.registerTrigger('spawn_cache', {
  type: 'flag',
  condition: {
    flags: [{ flag: 'discover_cache_completed', value: true }],
    operator: '=='
  }
});

// IMPORTANT: Track ant positions in your game code
// In your ant update loop:
function updateAnts() {
  ants.forEach(ant => {
    ant.update();
    // Let EventManager check if ant triggers spatial events
    // (EventManager already does this via evaluateTriggers)
  });
}
```

**Result**: Players discover secrets by exploring the map.

---

### Workflow 4: Boss Battle with Phases

**Use Case**: Multi-phase boss fight with dynamic events.

```javascript
// Boss introduction
eventManager.registerEvent({
  id: 'boss_intro',
  type: 'boss',
  priority: 5,
  content: {
    name: 'Termite King',
    phases: [
      {
        healthPercent: 100,
        mechanics: ['charge', 'stomp']
      },
      {
        healthPercent: 50,
        mechanics: ['charge', 'stomp', 'summon_minions']
      },
      {
        healthPercent: 25,
        mechanics: ['charge', 'stomp', 'summon_minions', 'enrage']
      }
    ],
    introDialogue: {
      speaker: 'Termite King',
      message: 'Your colony ends here, ants!'
    }
  }
});

eventManager.registerTrigger('boss_intro', {
  type: 'flag',
  condition: {
    flags: [{ flag: 'player_level', value: 5 }],
    operator: '>='
  }
});

// Phase 2 transition (at 50% health)
eventManager.registerEvent({
  id: 'boss_phase_2',
  type: 'dialogue',
  priority: 4,
  content: {
    speaker: 'Termite King',
    message: 'You dare challenge me? I summon my guards!',
    buttons: [{ text: '...', action: 'dismiss' }]
  }
});

eventManager.registerTrigger('boss_phase_2', {
  type: 'conditional',
  condition: function() {
    // Custom function to check boss health
    const boss = entities.find(e => e.type === 'TermiteKing');
    if (!boss) return false;
    const healthPercent = (boss.health / boss.maxHealth) * 100;
    return healthPercent <= 50 && healthPercent > 49;
  }
});

// Spawn minions when phase 2 starts
eventManager.registerEvent({
  id: 'boss_minions',
  type: 'spawn',
  priority: 4,
  content: {
    entityType: 'TermiteGuard',
    count: 3,
    faction: 'enemy',
    pattern: 'radius',
    radius: 100,
    centerX: 400, // Boss position
    centerY: 300
  }
});

eventManager.registerTrigger('boss_minions', {
  type: 'flag',
  condition: {
    flags: [{ flag: 'boss_phase_2_completed', value: true }],
    operator: '=='
  }
});

// IMPORTANT: Update boss health flag in your combat code
function onBossDamaged(boss) {
  const healthPercent = (boss.health / boss.maxHealth) * 100;
  eventManager.setFlag('boss_health_percent', healthPercent);
}
```

**Result**: Dynamic boss fight that changes mechanics as player progresses.

---

### Workflow 5: Repeating Events (Day/Night Cycle)

**Use Case**: Events that occur repeatedly on an interval.

```javascript
// Nighttime warning every 60 seconds
eventManager.registerEvent({
  id: 'night_warning',
  type: 'dialogue',
  priority: 1,
  content: {
    speaker: 'Guard Ant',
    message: 'Night is falling. Enemy activity increases in the dark!',
    buttons: [{ text: 'Understood', action: 'dismiss' }]
  }
});

eventManager.registerTrigger('night_warning', {
  type: 'time',
  condition: { 
    interval: 60000 // Every 60 seconds
    // Note: No 'oneTime' flag means this repeats
  }
});

// Spawn night enemies every cycle
eventManager.registerEvent({
  id: 'night_spawn',
  type: 'spawn',
  priority: 2,
  content: {
    entityType: 'NocturnalPredator',
    count: 2,
    faction: 'enemy',
    pattern: 'viewport-edge'
  }
});

eventManager.registerTrigger('night_spawn', {
  type: 'time',
  condition: { interval: 60000 }
});
```

**Result**: Regular events create rhythm and challenge escalation.

---

## Integration Patterns

### Pattern 1: Integrating with Existing Systems

#### With AntManager (Spawn Events)

```javascript
// In EventManager.triggerEvent() for spawn events:
if (event.type === 'spawn') {
  const { entityType, count, faction, pattern, positions } = event.content;
  
  // Use existing AntManager to spawn
  if (entityType === 'Ant' || entityType === 'WorkerAnt') {
    for (let i = 0; i < count; i++) {
      const pos = this._calculateSpawnPosition(pattern, i, positions);
      const ant = new Ant(pos.x, pos.y);
      ant.faction = faction || 'player';
      ants.push(ant); // Global ants array
      if (window.antManager) {
        window.antManager.registerAnt(ant);
      }
    }
  }
}
```

#### With EntityInventoryManager (Rewards)

```javascript
// After dialogue with reward button
if (button.action === 'claim_reward') {
  const reward = event.content.reward;
  if (reward && window.EntityInventoryManager) {
    window.EntityInventoryManager.addResource(reward.type, reward.amount);
  }
  eventManager.completeEvent(event.id);
}
```

#### With Flag System (Unlocks)

```javascript
// Check if player has unlocked advanced units
eventManager.registerEvent({
  id: 'unlock_soldiers',
  type: 'dialogue',
  priority: 1,
  content: {
    speaker: 'Queen Ant',
    message: 'You have proven yourself! Soldier ants are now available.',
    buttons: [{ text: 'Excellent!', action: 'unlock_soldiers' }]
  }
});

eventManager.registerTrigger('unlock_soldiers', {
  type: 'flag',
  condition: {
    flags: [
      { flag: 'colony_size', value: 20 },
      { flag: 'barracks_built', value: true }
    ],
    operator: '>='
  }
});

// In your unit spawning code:
function canSpawnSoldier() {
  return eventManager.getFlag('unlock_soldiers_completed') === true;
}
```

---

### Pattern 2: Custom Event Handlers

You can add custom logic when events complete:

```javascript
// Listen for event completion in your game code
function onEventCompleted(eventId) {
  switch(eventId) {
    case 'tutorial_movement_completed':
      // Enable movement hints
      showMovementHints = true;
      break;
      
    case 'boss_defeated':
      // Unlock new area
      unlockArea('eastern_plains');
      // Spawn victory rewards
      spawnLoot(bossPosition.x, bossPosition.y, 'legendary');
      break;
      
    case 'discover_cache_completed':
      // Mark on map
      mapMarkers.push({ x: 200, y: 200, type: 'cache_found' });
      break;
  }
}

// In sketch.js draw() loop, check for completed events:
function draw() {
  // ... existing draw code ...
  
  // Check for newly completed events
  const completedEvents = eventManager.getAllEvents()
    .filter(e => e.state === 'completed' && !e.handlerCalled);
    
  completedEvents.forEach(event => {
    onEventCompleted(event.id);
    event.handlerCalled = true; // Mark as handled
  });
}
```

---

### Pattern 3: Dynamic Content Generation

Generate event content based on game state:

```javascript
function createDynamicRewardEvent(playerLevel) {
  const rewardAmount = playerLevel * 10;
  const enemyCount = Math.floor(playerLevel / 2) + 1;
  
  eventManager.registerEvent({
    id: `level_up_${playerLevel}`,
    type: 'dialogue',
    priority: 1,
    content: {
      speaker: 'Queen Ant',
      message: `Congratulations on reaching level ${playerLevel}! You've earned ${rewardAmount} food.`,
      buttons: [{ text: 'Thank you!', action: 'claim_reward' }],
      reward: { type: 'food', amount: rewardAmount }
    }
  });
  
  // Also spawn bonus enemies for challenge
  eventManager.registerEvent({
    id: `level_up_challenge_${playerLevel}`,
    type: 'spawn',
    priority: 2,
    content: {
      entityType: 'EnemyAnt',
      count: enemyCount,
      faction: 'enemy',
      pattern: 'viewport-edge'
    }
  });
  
  eventManager.registerTrigger(`level_up_${playerLevel}`, {
    type: 'flag',
    condition: {
      flags: [{ flag: 'player_level', value: playerLevel }],
      operator: '=='
    }
  });
  
  eventManager.registerTrigger(`level_up_challenge_${playerLevel}`, {
    type: 'flag',
    condition: {
      flags: [{ flag: `level_up_${playerLevel}_completed`, value: true }],
      operator: '=='
    }
  });
}

// Call when player levels up
function onPlayerLevelUp(newLevel) {
  createDynamicRewardEvent(newLevel);
}
```

---

### Pattern 4: Event Chains (Story Arcs)

Create multi-event story sequences:

```javascript
function createStoryArc_FirstContact() {
  // Chapter 1: Strange signals
  eventManager.registerEvent({
    id: 'story_signals',
    type: 'dialogue',
    priority: 1,
    content: {
      speaker: 'Scout Ant',
      message: 'Queen, we are detecting strange signals from the western border...',
      buttons: [{ text: 'Investigate', action: 'dismiss' }]
    }
  });
  
  eventManager.registerTrigger('story_signals', {
    type: 'time',
    condition: { delay: 30000 }
  });
  
  // Chapter 2: Discovery
  eventManager.registerEvent({
    id: 'story_discovery',
    type: 'dialogue',
    priority: 1,
    content: {
      speaker: 'Scout Ant',
      message: 'We found something... it\'s not termites. It\'s something new.',
      buttons: [{ text: 'What is it?', action: 'dismiss' }]
    }
  });
  
  eventManager.registerTrigger('story_discovery', {
    type: 'spatial',
    condition: {
      x: 100,
      y: 500,
      radius: 30,
      entityType: 'Ant'
    }
  });
  
  // Chapter 3: First contact
  eventManager.registerEvent({
    id: 'story_contact',
    type: 'dialogue',
    priority: 2,
    content: {
      speaker: 'Unknown Entity',
      message: 'Greetings, ant colony. We come in peace... for now.',
      buttons: [
        { text: 'Who are you?', action: 'reveal_identity' },
        { text: 'Leave our territory!', action: 'start_conflict' }
      ]
    }
  });
  
  eventManager.registerTrigger('story_contact', {
    type: 'flag',
    condition: {
      flags: [{ flag: 'story_discovery_completed', value: true }],
      operator: '=='
    }
  });
  
  // Chapter 4A: Peaceful path
  eventManager.registerEvent({
    id: 'story_peace',
    type: 'dialogue',
    priority: 1,
    content: {
      speaker: 'Alien Queen',
      message: 'We are refugees seeking shelter. We can help you in exchange.',
      buttons: [{ text: 'Welcome', action: 'unlock_alliance' }]
    }
  });
  
  eventManager.registerTrigger('story_peace', {
    type: 'flag',
    condition: {
      flags: [{ flag: 'story_contact_choice', value: 'reveal_identity' }],
      operator: '=='
    }
  });
  
  // Chapter 4B: Conflict path
  eventManager.registerEvent({
    id: 'story_conflict',
    type: 'spawn',
    priority: 3,
    content: {
      entityType: 'AlienWarrior',
      count: 5,
      faction: 'enemy',
      pattern: 'viewport-edge'
    }
  });
  
  eventManager.registerTrigger('story_conflict', {
    type: 'flag',
    condition: {
      flags: [{ flag: 'story_contact_choice', value: 'start_conflict' }],
      operator: '=='
    }
  });
}

// IMPORTANT: Set choice flags when player makes decisions
function onButtonClicked(button) {
  if (button.action === 'reveal_identity' || button.action === 'start_conflict') {
    eventManager.setFlag('story_contact_choice', button.action);
  }
}
```

**Result**: Branching narrative with player choices affecting outcomes.

---

## Level Editor Integration

### Using the EventEditorPanel

The `EventEditorPanel` is integrated into the Level Editor for visual event creation.

#### Opening the Panel

1. Launch the game (`npm run dev`)
2. Open Level Editor (press `L` or click Level Editor button)
3. Look for "Events" tab in the panel list

#### Creating Events Visually

1. **Click "Add Event"** in the EventEditorPanel
2. **Fill in fields**:
   - Event ID: Unique identifier (e.g., `welcome_msg`)
   - Type: Select from dropdown (dialogue, spawn, tutorial, boss)
   - Priority: 1-5 (1 = highest)
   - Content: Type-specific fields appear dynamically
3. **Click "Save Event"**

#### Adding Triggers

1. Select an event from the list
2. Click "Add Trigger" button
3. Choose trigger type
4. Fill in condition parameters
5. Click "Save Trigger"

#### Importing/Exporting

**Export current events**:
```javascript
// In browser console or via panel button:
const json = eventManager.exportToJSON();
console.log(json);
// Copy output and save to file
```

**Import events from JSON**:
```javascript
// Load JSON file content
const jsonContent = `{ "events": [...], "triggers": [...] }`;
eventManager.loadFromJSON(jsonContent);
```

**Via Panel UI**:
1. Click "Export" button → downloads JSON file
2. Click "Import" button → select JSON file to load

---

### Saving Events with Levels

Events are stored in the level JSON format:

```json
{
  "metadata": {
    "name": "Level 1: The Beginning",
    "version": "1.0",
    "created": "2025-01-15"
  },
  "terrain": {
    "width": 800,
    "height": 600,
    "tiles": [...]
  },
  "entities": [...],
  "events": {
    "events": [
      {
        "id": "welcome_message",
        "type": "dialogue",
        "priority": 1,
        "state": "pending",
        "content": {
          "speaker": "Queen Ant",
          "message": "Welcome to the colony!",
          "buttons": [{ "text": "Thanks!", "action": "dismiss" }]
        }
      }
    ],
    "triggers": [
      {
        "eventId": "welcome_message",
        "type": "time",
        "condition": { "delay": 5000 }
      }
    ]
  }
}
```

**Loading levels with events**:
```javascript
function loadLevel(levelData) {
  // Load terrain
  g_map2.loadTerrainFromJSON(levelData.terrain);
  
  // Load entities
  entities = loadEntitiesFromJSON(levelData.entities);
  
  // Load events
  if (levelData.events) {
    eventManager.loadFromJSON(JSON.stringify(levelData.events));
  }
}
```

---

## Troubleshooting

### Issue 1: "EventManager not initialized" Error

**Symptom**: Console error when accessing EventManager

**Cause**: Trying to access EventManager before it's created

**Solution**:
```javascript
// ❌ WRONG - Too early in setup()
function setup() {
  const eventManager = EventManager.getInstance(); // May not exist yet
}

// ✅ CORRECT - Access after initialization
function setup() {
  // EventManager is initialized in sketch.js setup()
}

function draw() {
  // Access EventManager here or in functions called from draw()
  const eventManager = EventManager.getInstance();
}
```

---

### Issue 2: Triggers Not Firing

**Symptom**: Event registered but never triggers

**Diagnosis Checklist**:
1. ✅ Is `eventManager.update()` being called in `draw()` loop?
2. ✅ Is the trigger condition correct?
3. ✅ Are required flags set?
4. ✅ Is event state 'pending' (not 'completed' or 'active')?

**Debug Code**:
```javascript
// Check if event exists
const event = eventManager.getEvent('my_event_id');
console.log('Event state:', event ? event.state : 'NOT FOUND');

// Check trigger conditions
const triggers = eventManager._triggers.get('my_event_id');
console.log('Triggers:', triggers);

// Check flags
console.log('All flags:', eventManager.getAllFlags());

// Manually test trigger
if (triggers && triggers.length > 0) {
  const shouldFire = eventManager._evaluateTriggerCondition(triggers[0]);
  console.log('Should fire:', shouldFire);
}
```

**Common Fixes**:
- Time trigger: Ensure delay is in milliseconds (5000 = 5 seconds)
- Flag trigger: Check flag name spelling exactly matches
- Spatial trigger: Verify coordinates are in world space, not screen space
- Conditional trigger: Add console.log() in condition function

---

### Issue 3: Events Triggering Multiple Times

**Symptom**: Event fires repeatedly when it should only fire once

**Cause**: Missing `oneTime` flag or repeated trigger evaluation

**Solution**:
```javascript
// For one-time events, use oneTime flag
eventManager.registerTrigger('my_event', {
  type: 'time',
  condition: { delay: 5000 },
  oneTime: true // ✅ Add this
});

// Or check event state before triggering
function myCustomTrigger() {
  const event = eventManager.getEvent('my_event');
  if (event && event.state === 'pending') {
    eventManager.triggerEvent('my_event');
  }
}
```

---

### Issue 4: Spawn Events Not Creating Entities

**Symptom**: Spawn event triggers but no entities appear

**Diagnosis**:
```javascript
// Check if spawn event content is correct
const event = eventManager.getEvent('spawn_event_id');
console.log('Spawn content:', event.content);

// Check pattern
console.log('Pattern:', event.content.pattern);

// Check entity type
console.log('Entity type exists:', typeof window[event.content.entityType] !== 'undefined');
```

**Common Fixes**:
- Verify `entityType` matches actual class name (case-sensitive)
- For 'exact' pattern, ensure `positions` array provided
- For 'radius' pattern, ensure `centerX`, `centerY`, `radius` provided
- Check that entity constructor accepts (x, y) parameters

---

### Issue 5: Dialogue Panel Not Showing

**Symptom**: Dialogue event triggers but no panel appears

**Diagnosis**:
1. Check if `draggablePanelManager` exists
2. Check if dialogue panel is registered
3. Check game state (panels may be hidden in certain states)

**Debug Code**:
```javascript
// Check panel manager
console.log('Panel manager:', window.draggablePanelManager);

// Check panels
console.log('All panels:', window.draggablePanelManager?.panels);

// Force show dialogue panel
if (window.draggablePanelManager) {
  const panel = window.draggablePanelManager.panels.find(p => p.id === 'dialogue-panel');
  if (panel) {
    panel.visible = true;
  }
}
```

**Solution**: Ensure dialogue panel is created in UI initialization:
```javascript
// In sketch.js or UI setup:
function setupUI() {
  // Create dialogue panel
  const dialoguePanel = new DialoguePanel(100, 100, 400, 200);
  draggablePanelManager.addPanel(dialoguePanel);
}
```

---

### Issue 6: JSON Import/Export Errors

**Symptom**: "Invalid JSON" or parsing errors

**Common Causes**:
1. Malformed JSON (missing commas, quotes, brackets)
2. Conditional triggers with functions (not serializable)
3. Incorrect file encoding

**Solutions**:
```javascript
// Validate JSON before importing
function validateEventJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data.events || !Array.isArray(data.events)) {
      throw new Error('Missing or invalid events array');
    }
    if (!data.triggers || !Array.isArray(data.triggers)) {
      throw new Error('Missing or invalid triggers array');
    }
    return true;
  } catch (error) {
    console.error('Invalid JSON:', error.message);
    return false;
  }
}

// Use validation before loading
if (validateEventJSON(jsonContent)) {
  eventManager.loadFromJSON(jsonContent);
} else {
  console.error('JSON validation failed!');
}
```

**Conditional Trigger Limitation**:
Conditional triggers with custom functions cannot be exported to JSON. Document them separately:

```javascript
// In code (not exportable):
eventManager.registerTrigger('boss_phase_2', {
  type: 'conditional',
  condition: function() {
    return boss.health < boss.maxHealth * 0.5;
  }
});

// Equivalent flag-based approach (exportable):
// In boss damage code:
function onBossDamaged() {
  const healthPercent = (boss.health / boss.maxHealth) * 100;
  eventManager.setFlag('boss_health_percent', healthPercent);
}

// In event registration:
eventManager.registerTrigger('boss_phase_2', {
  type: 'flag',
  condition: {
    flags: [{ flag: 'boss_health_percent', value: 50 }],
    operator: '<='
  }
});
```

---

## Best Practices

### 1. Event ID Naming Convention

Use descriptive, hierarchical IDs:

```javascript
// ✅ GOOD
'tutorial_movement'
'story_chapter1_intro'
'boss_termite_king_phase2'
'spawn_wave_1_enemies'

// ❌ BAD
'event1'
'test'
'temp_event'
'aaa'
```

**Benefits**: Easy to search, understand purpose, avoid collisions

---

### 2. Priority Assignment

Use consistent priority levels:

| Priority | Use Case | Example |
|----------|----------|---------|
| 5 | Critical story/boss events | Boss introductions, major plot points |
| 4 | Important gameplay events | Mid-boss phases, key unlocks |
| 3 | Standard events | Regular enemy spawns, tutorials |
| 2 | Background events | Ambient dialogue, flavor text |
| 1 | Low-priority events | Optional hints, reminders |

---

### 3. Flag Management

Keep flags organized and documented:

```javascript
// Create a flags reference document or comment block
/**
 * GAME FLAGS REFERENCE
 * 
 * Tutorial Flags:
 * - tutorial_movement_completed: Player finished movement tutorial
 * - tutorial_gathering_completed: Player finished gathering tutorial
 * - tutorial_building_completed: Player finished building tutorial
 * 
 * Story Flags:
 * - story_chapter1_completed: Finished chapter 1
 * - story_met_aliens: Player encountered alien faction
 * - story_alliance_formed: Player allied with aliens
 * 
 * Progression Flags:
 * - player_level: Current player level (number)
 * - colony_size: Number of ants in colony (number)
 * - total_food_gathered: Total food collected (number)
 * 
 * Boss Flags:
 * - boss_termite_king_defeated: Defeated termite king
 * - boss_spider_queen_active: Spider queen boss is active
 */

// Set flags with clear purpose
eventManager.setFlag('tutorial_movement_completed', true);
eventManager.setFlag('player_level', 5);
```

---

### 4. Testing Events

Test events in isolation before integrating:

```javascript
// Create a test function
function testEvent(eventId) {
  console.log('=== Testing Event:', eventId, '===');
  
  const event = eventManager.getEvent(eventId);
  if (!event) {
    console.error('Event not found!');
    return;
  }
  
  console.log('Event type:', event.type);
  console.log('Event state:', event.state);
  console.log('Event content:', event.content);
  
  // Manually trigger
  eventManager.triggerEvent(eventId);
  console.log('Event triggered. Check UI.');
}

// Test in browser console
testEvent('welcome_message');
```

---

### 5. Performance Considerations

**Conditional Triggers**: Keep condition functions fast
```javascript
// ❌ BAD - Expensive calculation every frame
eventManager.registerTrigger('my_event', {
  type: 'conditional',
  condition: function() {
    // Pathfinding calculation every frame!
    const path = findPath(playerPos, targetPos);
    return path.length < 10;
  }
});

// ✅ GOOD - Cache results, update periodically
let cachedPathLength = Infinity;
setInterval(() => {
  const path = findPath(playerPos, targetPos);
  cachedPathLength = path.length;
}, 1000); // Update every second

eventManager.registerTrigger('my_event', {
  type: 'conditional',
  condition: function() {
    return cachedPathLength < 10;
  }
});
```

**Trigger Count**: Don't register thousands of triggers
```javascript
// ❌ BAD - 1000 individual triggers
for (let i = 0; i < 1000; i++) {
  eventManager.registerTrigger(`tile_${i}`, {
    type: 'spatial',
    condition: { x: i * 32, y: 0, radius: 16 }
  });
}

// ✅ GOOD - Single conditional trigger
eventManager.registerTrigger('any_tile_entered', {
  type: 'conditional',
  condition: function() {
    return tiles.some(tile => tile.isPlayerNearby());
  }
});
```

---

### 6. Error Handling

Wrap event code in try-catch for robustness:

```javascript
function triggerEvent(eventId) {
  try {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }
    
    if (event.state !== 'pending') {
      console.warn(`Event ${eventId} already ${event.state}`);
      return;
    }
    
    // Trigger logic...
    event.state = 'active';
    
  } catch (error) {
    console.error(`Error triggering event ${eventId}:`, error);
    // Don't crash game, just log error
  }
}
```

---

### 7. Documentation in Code

Comment complex event setups:

```javascript
// Story Arc: First Contact with Aliens
// This chain triggers when player reaches level 5 and explores the western border.
// Player choices determine alliance or conflict outcome.

// Step 1: Scout reports strange signals (auto-trigger at level 5)
eventManager.registerEvent({
  id: 'story_signals',
  type: 'dialogue',
  priority: 1,
  content: { /* ... */ }
});

eventManager.registerTrigger('story_signals', {
  type: 'flag',
  condition: { 
    flags: [{ flag: 'player_level', value: 5 }],
    operator: '>='
  }
});

// Step 2: Discovery location (spatial trigger at x:100, y:500)
// ...
```

---

## Summary

The Random Events System provides a flexible framework for creating dynamic, story-driven gameplay. Key takeaways:

1. **Simple to start**: Register event → Add trigger → Done
2. **Flexible triggers**: Time, flags, spatial, conditional, viewport
3. **Extensible**: Integrate with any game system
4. **Visual editing**: Use EventEditorPanel in Level Editor
5. **Serializable**: Export/import events as JSON

**Next Steps**:
1. Review [EventManager API Reference](../api/EventManager_API_Reference.md)
2. Study [Event Types Guide](Event_Types_Guide.md)
3. Learn [Trigger Types Guide](Trigger_Types_Guide.md)
4. Experiment with examples in this guide
5. Create your first event!

**Need Help?**
- Check existing tests: `test/integration/systems/eventSystem.integration.test.js`
- See E2E examples: `test/e2e/ui/pw_event_*`
- Reference unit tests: `test/unit/systems/EventManager.test.js`

Happy event creating! 🐜
