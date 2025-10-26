# Trigger Types Guide

**Version**: 1.0.0  
**Last Updated**: October 26, 2025

---

## Table of Contents
1. [Overview](#overview)
2. [Time Triggers](#time-triggers)
3. [Flag Triggers](#flag-triggers)
4. [Spatial Triggers](#spatial-triggers)
5. [Conditional Triggers](#conditional-triggers)
6. [Viewport Triggers](#viewport-triggers)
7. [Trigger Registration](#trigger-registration)
8. [Best Practices](#best-practices)

---

## Overview

Triggers are conditions that automatically fire events when met. The Event System supports 5 trigger types:

| Type | Purpose | Use Cases |
|------|---------|-----------|
| **time** | Time-based delays | Timed waves, delayed dialogue, scheduled events |
| **flag** | Flag state conditions | Quest completion, achievement unlocks, progression gates |
| **spatial** | Position-based | Area entrance, proximity detection, zone triggers |
| **conditional** | Custom logic | Complex conditions, game state checks, custom rules |
| **viewport** | Camera viewport | Exploration triggers, area discovery, cinematic triggers |

### Trigger Lifecycle
1. **Registration**: `eventManager.registerTrigger(config)`
2. **Evaluation**: Checked every frame in `update()`
3. **Activation**: Fires `eventManager.triggerEvent()` when condition met
4. **One-time**: If `oneTime: true`, trigger removes itself after firing
5. **Repeatable**: If `oneTime: false`, continues checking and firing

---

## Time Triggers

### Purpose
Fire events after a time delay or at regular intervals.

### Schema
```javascript
{
  id: string,           // Unique trigger ID
  eventId: string,      // Event to fire
  type: 'time',         // Trigger type
  oneTime: boolean,     // Fire once or repeat
  condition: {
    delay?: number,     // One-time delay (ms)
    interval?: number   // Repeating interval (ms)
  }
}
```

### One-Time Delay
Fire an event once after a specific delay.

```javascript
// Welcome message 5 seconds after game starts
eventManager.registerTrigger({
  id: 'welcome-delay',
  eventId: 'welcome-dialogue',
  type: 'time',
  oneTime: true,
  condition: {
    delay: 5000  // 5 seconds
  }
});
```

### Repeating Interval
Fire an event repeatedly at regular intervals.

```javascript
// Enemy wave every 60 seconds
eventManager.registerTrigger({
  id: 'wave-spawner',
  eventId: 'enemy-wave',
  type: 'time',
  oneTime: false,
  condition: {
    interval: 60000  // Every 60 seconds
  }
});
```

### Progressive Difficulty
```javascript
// Wave 1 after 30 seconds
eventManager.registerTrigger({
  id: 'wave-1-timer',
  eventId: 'wave-1',
  type: 'time',
  oneTime: true,
  condition: { delay: 30000 }
});

// Wave 2 after 90 seconds
eventManager.registerTrigger({
  id: 'wave-2-timer',
  eventId: 'wave-2',
  type: 'time',
  oneTime: true,
  condition: { delay: 90000 }
});

// Wave 3 after 180 seconds
eventManager.registerTrigger({
  id: 'wave-3-timer',
  eventId: 'wave-3',
  type: 'time',
  oneTime: true,
  condition: { delay: 180000 }
});
```

### Time Conversion Helper
```javascript
const SECOND = 1000;
const MINUTE = 60 * SECOND;

// Readable time definitions
eventManager.registerTrigger({
  id: 'boss-warning',
  eventId: 'boss-approaching-dialogue',
  type: 'time',
  oneTime: true,
  condition: { delay: 5 * MINUTE }  // 5 minutes
});
```

---

## Flag Triggers

### Purpose
Fire events when flags meet specific conditions.

### Schema
```javascript
{
  id: string,           // Unique trigger ID
  eventId: string,      // Event to fire
  type: 'flag',         // Trigger type
  oneTime: boolean,     // Fire once or repeat
  condition: {
    // Single flag check
    flag?: string,      // Flag name
    value?: any,        // Expected value
    operator?: string,  // Comparison operator
    
    // Multiple flags (AND logic)
    flags?: [
      { flag: string, value: any, operator?: string }
    ]
  }
}
```

### Operators
- `==` or `===` - Equals (default)
- `!=` or `!==` - Not equals
- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal
- `<=` - Less than or equal

### Simple Flag Check
```javascript
// Trigger dialogue when tutorial completes
eventManager.registerTrigger({
  id: 'tutorial-complete-trigger',
  eventId: 'congratulations-dialogue',
  type: 'flag',
  oneTime: true,
  condition: {
    flag: 'tutorial_completed',
    value: true
  }
});
```

### Numeric Comparison
```javascript
// Trigger event when player collects 100 resources
eventManager.registerTrigger({
  id: 'milestone-100-resources',
  eventId: 'milestone-dialogue',
  type: 'flag',
  oneTime: true,
  condition: {
    flag: 'resources_collected',
    operator: '>=',
    value: 100
  }
});
```

### Multiple Flags (AND Logic)
```javascript
// Trigger boss fight when all objectives complete
eventManager.registerTrigger({
  id: 'boss-unlock-trigger',
  eventId: 'boss-fight-1',
  type: 'flag',
  oneTime: true,
  condition: {
    flags: [
      { flag: 'objective_north_complete', value: true },
      { flag: 'objective_south_complete', value: true },
      { flag: 'objective_east_complete', value: true },
      { flag: 'resources_collected', operator: '>=', value: 50 }
    ]
  }
});
```

### Event Completion Flags
Events auto-set completion flags when completed:
```javascript
// When event 'intro-dialogue' completes, flag 'event_intro-dialogue_completed' is set to true

// Trigger next event after intro completes
eventManager.registerTrigger({
  id: 'after-intro-trigger',
  eventId: 'tutorial-basics',
  type: 'flag',
  oneTime: true,
  condition: {
    flag: 'event_intro-dialogue_completed',
    value: true
  }
});
```

### Achievement System
```javascript
// Track kill count
let enemiesKilled = 0;
function onEnemyKilled() {
  enemiesKilled++;
  eventManager.setFlag('enemies_killed', enemiesKilled);
}

// Achievement at 50 kills
eventManager.registerTrigger({
  id: 'achievement-50-kills',
  eventId: 'achievement-warrior-dialogue',
  type: 'flag',
  oneTime: true,
  condition: {
    flag: 'enemies_killed',
    operator: '>=',
    value: 50
  }
});
```

---

## Spatial Triggers

### Purpose
Fire events when entities enter specific areas or proximity zones.

### Schema
```javascript
{
  id: string,           // Unique trigger ID
  eventId: string,      // Event to fire
  type: 'spatial',      // Trigger type
  oneTime: boolean,     // Fire once or repeat
  condition: {
    x: number,          // Center X position
    y: number,          // Center Y position
    radius: number,     // Trigger radius
    entityType?: string // Filter by entity type (optional)
  }
}
```

### Basic Area Trigger
```javascript
// Trigger dialogue when player enters sacred grove
eventManager.registerTrigger({
  id: 'sacred-grove-entrance',
  eventId: 'grove-dialogue',
  type: 'spatial',
  oneTime: true,
  condition: {
    x: 500,
    y: 500,
    radius: 100  // 100 pixel radius
  }
});
```

### Entity Type Filter
```javascript
// Only trigger when Queen enters throne room
eventManager.registerTrigger({
  id: 'throne-room-trigger',
  eventId: 'throne-dialogue',
  type: 'spatial',
  oneTime: true,
  condition: {
    x: 1000,
    y: 1000,
    radius: 150,
    entityType: 'Queen'  // Only Queen triggers this
  }
});
```

### Multiple Zone System
```javascript
// North zone
eventManager.registerTrigger({
  id: 'north-zone-trigger',
  eventId: 'north-area-dialogue',
  type: 'spatial',
  oneTime: true,
  condition: { x: 500, y: 0, radius: 200 }
});

// South zone
eventManager.registerTrigger({
  id: 'south-zone-trigger',
  eventId: 'south-area-dialogue',
  type: 'spatial',
  oneTime: true,
  condition: { x: 500, y: 1000, radius: 200 }
});

// East zone
eventManager.registerTrigger({
  id: 'east-zone-trigger',
  eventId: 'east-area-dialogue',
  type: 'spatial',
  oneTime: true,
  condition: { x: 1000, y: 500, radius: 200 }
});
```

### Proximity Warning
```javascript
// Warn player when approaching enemy base
eventManager.registerTrigger({
  id: 'enemy-base-proximity',
  eventId: 'danger-warning-dialogue',
  type: 'spatial',
  oneTime: false,  // Repeatable warning
  condition: {
    x: 800,
    y: 800,
    radius: 300
  }
});
```

### Boss Arena Entrance
```javascript
// Trigger boss fight when entering arena
eventManager.registerTrigger({
  id: 'boss-arena-entrance',
  eventId: 'boss-intro-dialogue',
  type: 'spatial',
  oneTime: true,
  condition: {
    x: 1200,
    y: 1200,
    radius: 250
  }
});
```

### Distance Calculation
The trigger checks distance using:
```javascript
const distance = Math.sqrt(
  Math.pow(entity.x - condition.x, 2) + 
  Math.pow(entity.y - condition.y, 2)
);
return distance <= condition.radius;
```

---

## Conditional Triggers

### Purpose
Fire events based on custom logic and complex game state.

### Schema
```javascript
{
  id: string,           // Unique trigger ID
  eventId: string,      // Event to fire
  type: 'conditional',  // Trigger type
  oneTime: boolean,     // Fire once or repeat
  condition: Function   // Custom condition function
}
```

The condition function should return `true` to fire the event.

### Basic Custom Condition
```javascript
// Trigger when player has low resources
eventManager.registerTrigger({
  id: 'low-resources-warning',
  eventId: 'resource-warning-dialogue',
  type: 'conditional',
  oneTime: false,  // Check repeatedly
  condition: () => {
    const food = eventManager.getFlag('food_count', 0);
    return food < 10;
  }
});
```

### Multiple Game State Checks
```javascript
// Trigger victory when all enemies defeated and resources safe
eventManager.registerTrigger({
  id: 'victory-condition',
  eventId: 'victory-dialogue',
  type: 'conditional',
  oneTime: true,
  condition: () => {
    const enemiesAlive = spatialGridManager.getEntitiesByType('enemy').length;
    const resourcesSafe = eventManager.getFlag('resources_collected', 0) >= 100;
    const wavesComplete = eventManager.getFlag('waves_defeated', 0) >= 5;
    
    return enemiesAlive === 0 && resourcesSafe && wavesComplete;
  }
});
```

### Time-of-Day Condition
```javascript
// Trigger night event when day/night cycle reaches night
eventManager.registerTrigger({
  id: 'night-event-trigger',
  eventId: 'night-dialogue',
  type: 'conditional',
  oneTime: false,
  condition: () => {
    // Assuming you have a day/night system
    return window.dayNightCycle && window.dayNightCycle.isNight();
  }
});
```

### Player Performance Check
```javascript
// Trigger hint if player is struggling
eventManager.registerTrigger({
  id: 'struggling-hint',
  eventId: 'helpful-hint-dialogue',
  type: 'conditional',
  oneTime: true,
  condition: () => {
    const deaths = eventManager.getFlag('ant_deaths', 0);
    const timeElapsed = millis();
    const wavesDefeated = eventManager.getFlag('waves_defeated', 0);
    
    // If player has lost many ants but not defeated waves
    return deaths > 20 && wavesDefeated === 0 && timeElapsed > 120000;
  }
});
```

### Boss Phase Transition
```javascript
// Trigger boss phase 2 based on health
eventManager.registerTrigger({
  id: 'boss-phase-2-trigger',
  eventId: 'boss-phase-2',
  type: 'conditional',
  oneTime: true,
  condition: () => {
    const boss = spatialGridManager.getEntitiesByType('BossAnt')[0];
    if (!boss) return false;
    
    const healthPercent = boss.health / boss.maxHealth;
    return healthPercent <= 0.66;  // 66% health
  }
});
```

### Combo System
```javascript
// Trigger special event for kill combo
eventManager.registerTrigger({
  id: 'kill-combo-trigger',
  eventId: 'combo-bonus-dialogue',
  type: 'conditional',
  oneTime: false,  // Can trigger multiple combos
  condition: () => {
    const recentKills = eventManager.getFlag('recent_kills', []);
    const now = millis();
    
    // Check if 5 kills in last 10 seconds
    const recentCount = recentKills.filter(time => now - time < 10000).length;
    return recentCount >= 5;
  }
});
```

---

## Viewport Triggers

### Purpose
Fire events when specific areas enter the player's viewport (camera view).

### Schema
```javascript
{
  id: string,           // Unique trigger ID
  eventId: string,      // Event to fire
  type: 'viewport',     // Trigger type
  oneTime: boolean,     // Fire once or repeat
  condition: {
    x: number,          // Area X position
    y: number,          // Area Y position
    width: number,      // Area width
    height: number      // Area height
  }
}
```

### Exploration Discovery
```javascript
// Trigger dialogue when player discovers northern region
eventManager.registerTrigger({
  id: 'discover-north',
  eventId: 'northern-region-dialogue',
  type: 'viewport',
  oneTime: true,
  condition: {
    x: 0,
    y: 0,
    width: 500,
    height: 500
  }
});
```

### Hidden Area Reveal
```javascript
// Multiple hidden areas
const hiddenAreas = [
  { id: 'secret-cave', x: 1500, y: 200, width: 200, height: 200 },
  { id: 'ancient-ruins', x: 300, y: 1800, width: 300, height: 300 },
  { id: 'treasure-room', x: 2000, y: 2000, width: 150, height: 150 }
];

hiddenAreas.forEach(area => {
  eventManager.registerTrigger({
    id: `discover-${area.id}`,
    eventId: `${area.id}-dialogue`,
    type: 'viewport',
    oneTime: true,
    condition: area
  });
});
```

### Map Exploration Progress
```javascript
// Track exploration percentage
let exploredAreas = [];

function registerExplorationZones() {
  const zones = [
    { id: 'zone-1', x: 0, y: 0, width: 400, height: 400 },
    { id: 'zone-2', x: 400, y: 0, width: 400, height: 400 },
    { id: 'zone-3', x: 800, y: 0, width: 400, height: 400 },
    // ... more zones
  ];
  
  zones.forEach((zone, index) => {
    eventManager.registerEvent({
      id: `explore-${zone.id}`,
      type: 'dialogue',
      priority: 10,
      content: { message: `Explored zone ${index + 1}` },
      onTrigger: () => {
        exploredAreas.push(zone.id);
        const percent = (exploredAreas.length / zones.length) * 100;
        eventManager.setFlag('exploration_percent', percent);
        
        if (percent === 100) {
          eventManager.triggerEvent('full-exploration-reward');
        }
      }
    });
    
    eventManager.registerTrigger({
      id: `trigger-${zone.id}`,
      eventId: `explore-${zone.id}`,
      type: 'viewport',
      oneTime: true,
      condition: zone
    });
  });
}
```

### Cinematic Trigger
```javascript
// Trigger cutscene when player views boss arena
eventManager.registerTrigger({
  id: 'boss-arena-reveal',
  eventId: 'boss-arena-cinematic',
  type: 'viewport',
  oneTime: true,
  condition: {
    x: 1000,
    y: 1000,
    width: 600,
    height: 600
  }
});
```

---

## Trigger Registration

### Registration Method
```javascript
const success = eventManager.registerTrigger(triggerConfig);
if (success) {
  console.log('Trigger registered successfully');
} else {
  console.error('Trigger registration failed');
}
```

### Validation
Triggers require:
- Valid `id` (unique)
- Valid `eventId` (event must be registered first)
- Valid `type` (time, flag, spatial, conditional, viewport)
- Valid `condition` (appropriate for trigger type)

### Common Registration Pattern
```javascript
// 1. Register event first
eventManager.registerEvent({
  id: 'my-event',
  type: 'dialogue',
  content: { speaker: 'Guide', message: 'Hello!' }
});

// 2. Register trigger
eventManager.registerTrigger({
  id: 'my-trigger',
  eventId: 'my-event',  // Must match registered event
  type: 'time',
  oneTime: true,
  condition: { delay: 5000 }
});
```

### Dynamic Trigger Creation
```javascript
// Create triggers based on game state
function createDifficultyTriggers(difficulty) {
  const waveIntervals = {
    easy: 120000,    // 2 minutes
    normal: 90000,   // 1.5 minutes
    hard: 60000      // 1 minute
  };
  
  eventManager.registerTrigger({
    id: 'wave-spawner',
    eventId: 'enemy-wave',
    type: 'time',
    oneTime: false,
    condition: { interval: waveIntervals[difficulty] }
  });
}
```

---

## Best Practices

### 1. Use One-Time for Unique Events
```javascript
// ✅ GOOD: One-time for unique story events
eventManager.registerTrigger({
  id: 'intro-trigger',
  eventId: 'intro-dialogue',
  type: 'time',
  oneTime: true,  // Only show intro once
  condition: { delay: 2000 }
});

// ❌ BAD: Repeatable for story events
eventManager.registerTrigger({
  id: 'intro-trigger',
  eventId: 'intro-dialogue',
  type: 'time',
  oneTime: false,  // Intro would repeat infinitely!
  condition: { interval: 2000 }
});
```

### 2. Register Events Before Triggers
```javascript
// ✅ GOOD: Event exists before trigger
eventManager.registerEvent({ id: 'my-event', ... });
eventManager.registerTrigger({ eventId: 'my-event', ... });

// ❌ BAD: Trigger references non-existent event
eventManager.registerTrigger({ eventId: 'my-event', ... });
// eventManager.registerEvent({ id: 'my-event', ... });  // Too late!
```

### 3. Name Triggers Descriptively
```javascript
// ✅ GOOD: Clear naming
'boss-phase-2-health-trigger'
'tutorial-complete-flag-trigger'
'north-area-entrance-spatial-trigger'

// ❌ BAD: Vague naming
'trigger-1'
'boss-trigger'
'event-trigger-a'
```

### 4. Avoid Expensive Conditionals
```javascript
// ✅ GOOD: Cheap condition check
condition: () => {
  return eventManager.getFlag('ready') === true;
}

// ❌ BAD: Expensive operation every frame
condition: () => {
  // This runs 60 times per second!
  const allEntities = spatialGridManager.getAllEntities();
  const processed = allEntities.map(e => complexCalculation(e));
  return processed.some(result => result.value > 1000);
}
```

### 5. Use Appropriate Trigger Types
```javascript
// ✅ GOOD: Time trigger for delays
eventManager.registerTrigger({
  type: 'time',
  condition: { delay: 5000 }
});

// ❌ BAD: Conditional for simple time check
eventManager.registerTrigger({
  type: 'conditional',
  condition: () => millis() > 5000  // Use time trigger instead!
});
```

### 6. Clean Up Triggers
```javascript
// Triggers with oneTime: true auto-remove
// For dynamic triggers, remove manually if needed:
function removeTrigger(triggerId) {
  // EventManager handles this internally
  // Trigger removes itself after firing if oneTime: true
}
```

### 7. Test Trigger Conditions
```javascript
// Test trigger logic separately
function testWaveCondition() {
  const enemiesAlive = spatialGridManager.getEntitiesByType('enemy').length;
  const waveComplete = enemiesAlive === 0;
  console.log(`Wave complete: ${waveComplete}`);
  return waveComplete;
}

// Use in trigger
eventManager.registerTrigger({
  type: 'conditional',
  condition: testWaveCondition  // Testable function
});
```

---

## JSON Examples

### Time Trigger JSON
```json
{
  "id": "wave-1-timer",
  "eventId": "wave-1",
  "type": "time",
  "oneTime": true,
  "condition": {
    "delay": 30000
  }
}
```

### Flag Trigger JSON
```json
{
  "id": "tutorial-complete-trigger",
  "eventId": "next-objective",
  "type": "flag",
  "oneTime": true,
  "condition": {
    "flag": "tutorial_completed",
    "value": true
  }
}
```

### Spatial Trigger JSON
```json
{
  "id": "boss-arena-trigger",
  "eventId": "boss-fight",
  "type": "spatial",
  "oneTime": true,
  "condition": {
    "x": 1000,
    "y": 1000,
    "radius": 200,
    "entityType": "Queen"
  }
}
```

### Viewport Trigger JSON
```json
{
  "id": "discover-north",
  "eventId": "north-dialogue",
  "type": "viewport",
  "oneTime": true,
  "condition": {
    "x": 0,
    "y": 0,
    "width": 500,
    "height": 500
  }
}
```

**Note**: Conditional triggers with function conditions cannot be serialized to JSON.

---

## Complete Example: Tutorial System

```javascript
// Tutorial events
eventManager.registerEvent({
  id: 'tutorial-welcome',
  type: 'tutorial',
  priority: 1,
  content: { title: 'Welcome', steps: ['Welcome to the colony!'] }
});

eventManager.registerEvent({
  id: 'tutorial-movement',
  type: 'tutorial',
  priority: 1,
  content: { title: 'Movement', steps: ['Click to select', 'Right-click to move'] }
});

eventManager.registerEvent({
  id: 'tutorial-complete',
  type: 'dialogue',
  priority: 1,
  content: { speaker: 'Guide', message: 'Tutorial complete!' }
});

// Trigger 1: Show welcome after 2 seconds (time)
eventManager.registerTrigger({
  id: 'welcome-trigger',
  eventId: 'tutorial-welcome',
  type: 'time',
  oneTime: true,
  condition: { delay: 2000 }
});

// Trigger 2: Show movement tutorial after welcome completes (flag)
eventManager.registerTrigger({
  id: 'movement-trigger',
  eventId: 'tutorial-movement',
  type: 'flag',
  oneTime: true,
  condition: {
    flag: 'event_tutorial-welcome_completed',
    value: true
  }
});

// Trigger 3: Show completion when player reaches target area (spatial)
eventManager.registerTrigger({
  id: 'tutorial-complete-trigger',
  eventId: 'tutorial-complete',
  type: 'spatial',
  oneTime: true,
  condition: {
    x: 300,
    y: 300,
    radius: 50
  }
});
```

---

**Related Documentation**:
- [EventManager API Reference](../api/EventManager_API_Reference.md)
- [Event Types Guide](Event_Types_Guide.md)
- [Integration Guide](Integration_Guide.md)
