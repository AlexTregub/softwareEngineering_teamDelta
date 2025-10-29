# Event Completion & Priority Queue System

## Event Completion Detection

### The Problem
**Question**: How does EventManager know when an event is "over"?

**Why it matters**:
- Remove from active events list
- Resume paused lower-priority events
- Mark one-time triggers as used
- Execute onComplete callbacks
- Free resources

### The Solution: Multiple Completion Strategies

Events support different completion methods based on their type and use case.

---

## Completion Strategy 1: User-Driven (Interactive)

**Use Case**: Dialogue, tutorials, confirmations

**How it works**: Event completes when user interacts (clicks button, presses key, etc.)

### Example: Dialogue with Buttons
```javascript
const dialogueEvent = {
  id: 'welcome_message',
  type: 'dialogue',
  content: {
    speaker: 'Queen Ant',
    message: 'Welcome to the colony! We need your help.',
    buttons: ['Got it!', 'Tell me more']
  },
  autoCompleteOnResponse: true  // ← Auto-complete when button clicked
};

// User clicks button
dialoguePanel.onButtonClick('Got it!');

// Internally:
dialogueEvent.handleResponse('Got it!');
// → calls this.complete()
// → eventManager removes from active events
// → onComplete callback fires
```

### Example: Tutorial Step Completion
```javascript
const tutorialEvent = {
  id: 'tutorial_gathering',
  type: 'tutorial',
  content: {
    steps: [
      { text: 'Select your ants' },
      { text: 'Right-click on resources' },
      { text: 'Watch them gather!' }
    ]
  }
};

// User progresses through steps
tutorialEvent.nextStep(); // Step 1 → 2
tutorialEvent.nextStep(); // Step 2 → 3
tutorialEvent.nextStep(); // Step 3 → Beyond last
// → Automatically calls this.complete()
```

---

## Completion Strategy 2: Time-Based (Auto-dismiss)

**Use Case**: Notifications, ambient dialogue, tooltips

**How it works**: Event auto-completes after specified duration

### Example: Notification
```javascript
const notificationEvent = {
  id: 'resource_full',
  type: 'dialogue',
  content: {
    message: 'Resource storage is full!'
  },
  autoCompleteAfter: 3000  // ← Auto-dismiss after 3 seconds
};

// In Event.update()
update() {
  if (this.autoCompleteAfter && this.active && !this.paused) {
    const elapsed = millis() - this.triggeredAt;
    if (elapsed >= this.autoCompleteAfter) {
      this.complete();
    }
  }
  
  // ... other update logic
}
```

### Example: Ambient Dialogue
```javascript
{
  id: 'night_ambient',
  type: 'dialogue',
  content: {
    message: 'The night grows cold... your ants move slower.',
  },
  autoCompleteAfter: 5000,
  priority: 8  // Low priority (won't interrupt important events)
}
```

---

## Completion Strategy 3: Condition-Based (Flag/State)

**Use Case**: Waves, boss fights, objectives

**How it works**: Event completes when a condition is met (flag value, enemy count, etc.)

### Example: Wave Completion
```javascript
const waveEvent = {
  id: 'wave_3',
  type: 'spawn',
  content: {
    wave: {
      number: 3,
      enemies: [
        { type: 'enemy_ant', count: 10 },
        { type: 'enemy_beetle', count: 2 }
      ]
    }
  },
  completeWhen: {
    type: 'flag',
    flag: 'wave_3_enemies_remaining',
    operator: '<=',
    value: 0
  }
};

// During gameplay:
// Enemy dies → eventManager.setFlag('wave_3_enemies_remaining', currentCount - 1)
// When count reaches 0 → event auto-completes
```

### Example: Boss Fight Completion
```javascript
const bossEvent = {
  id: 'boss_beetle',
  type: 'boss',
  content: {
    bossType: 'giant_beetle',
    health: 1000
  },
  completeWhen: {
    type: 'flag',
    flag: 'boss_beetle_defeated',
    value: true
  }
};

// When boss dies:
bossEntity.onDeath(() => {
  eventManager.setFlag('boss_beetle_defeated', true);
  // → Next update cycle, event checks completeWhen condition
  // → Condition met → event.complete() called
});
```

### Supported Operators
```javascript
completeWhen: {
  type: 'flag',
  flag: 'score',
  operator: '>=',  // >, >=, <, <=, ==, !=
  value: 100
}
```

---

## Completion Strategy 4: Manual (Code-Driven)

**Use Case**: Complex events, scripted sequences

**How it works**: Code explicitly calls `eventManager.completeEvent(id)`

### Example: Boss Cutscene
```javascript
const cutsceneEvent = {
  id: 'boss_intro_cutscene',
  type: 'dialogue',
  content: {
    speaker: 'Giant Beetle',
    message: 'You dare challenge me?!'
  }
  // No auto-completion - manual control
};

// Game code controls completion
setTimeout(() => {
  eventManager.completeEvent('boss_intro_cutscene');
  eventManager.triggerEvent('boss_fight_start');
}, 5000);
```

### Example: Multi-Stage Event
```javascript
// Stage 1: Dialogue
eventManager.triggerEvent('quest_start_dialogue');

// User clicks "Accept"
dialoguePanel.onButtonClick('Accept', () => {
  eventManager.completeEvent('quest_start_dialogue');
  
  // Stage 2: Objective
  eventManager.triggerEvent('quest_objective_1');
});

// When objective met
if (objectiveComplete) {
  eventManager.completeEvent('quest_objective_1');
  eventManager.triggerEvent('quest_reward');
}
```

---

## Completion Strategy 5: State-Based (Internal Logic)

**Use Case**: Multi-step tutorials, progressive events

**How it works**: Event tracks internal state, completes when reaching end state

### Example: Tutorial Steps
```javascript
class TutorialEvent extends Event {
  constructor(config) {
    super(config);
    this.currentStep = 0;
    this.steps = config.content.steps;
  }
  
  nextStep() {
    this.currentStep++;
    
    // Auto-complete when beyond last step
    if (this.currentStep >= this.steps.length) {
      this.complete();
    }
  }
}
```

---

## Priority Queue System (Option D)

### How It Works

When multiple events trigger simultaneously or while another is active:

1. **Queue all events** - Add to activeEvents array
2. **Sort by priority** - Lower number = higher priority
3. **Pause lower-priority** - Set `paused = true` on all except highest
4. **Update only highest** - Only non-paused events receive update() calls
5. **On completion** - Resume next-highest priority event

### Implementation Flow

```javascript
// EventManager.update()
update() {
  if (!this.enabled) return;
  
  // 1. Check triggers (may add new events to queue)
  this.updateTriggers();
  
  // 2. Sort active events by priority
  const sorted = this.getActiveEventsSorted();
  
  if (sorted.length === 0) return;
  
  // 3. Highest priority event is active, others paused
  const highestPriority = sorted[0];
  
  sorted.forEach((event, index) => {
    if (index === 0) {
      // Highest priority - ensure not paused
      if (event.paused) {
        event.resume();
      }
      // Update only this event
      event.update();
    } else {
      // Lower priority - pause
      if (!event.paused) {
        event.pause();
      }
    }
  });
  
  // 4. Clean up completed events
  this.activeEvents = this.activeEvents.filter(event => !event.completed);
}
```

### Example Scenario

```javascript
// Timeline:
// T=0s: Low priority dialogue triggers
eventManager.triggerEvent('ambient_dialogue');  // Priority 10
// → activeEvents: [ambient_dialogue (active)]

// T=2s: High priority tutorial triggers
eventManager.triggerEvent('tutorial_start');    // Priority 1
// → activeEvents: [tutorial_start (active), ambient_dialogue (PAUSED)]

// T=5s: User completes tutorial
tutorialEvent.complete();
// → activeEvents: [ambient_dialogue (RESUMED)]

// T=8s: Ambient dialogue auto-completes
// → activeEvents: []
```

### Pause/Resume Behavior

```javascript
class Event {
  pause() {
    if (!this.active) return false;
    
    this.paused = true;
    this.pausedAt = millis();
    
    // Execute onPause callback
    if (this.onPause) {
      this.onPause();
    }
    
    return true;
  }
  
  resume() {
    if (!this.paused) return false;
    
    this.paused = false;
    
    // Adjust trigger time to account for pause duration
    if (this.triggeredAt && this.pausedAt) {
      const pauseDuration = millis() - this.pausedAt;
      this.triggeredAt += pauseDuration;
    }
    
    // Execute onResume callback
    if (this.onResume) {
      this.onResume();
    }
    
    return true;
  }
}
```

### Priority Levels (Recommended)

```javascript
const EVENT_PRIORITIES = {
  CRITICAL: 1,      // Game over, victory, boss intro
  HIGH: 3,          // Boss fights, major story
  NORMAL: 5,        // Tutorials, wave starts
  LOW: 7,           // Ambient dialogue, tips
  BACKGROUND: 10    // Environmental notifications
};

// Usage:
{
  id: 'boss_intro',
  type: 'dialogue',
  priority: EVENT_PRIORITIES.CRITICAL,
  content: { ... }
}
```

---

## Complete Event Lifecycle

```
1. REGISTRATION
   └─> eventManager.registerEvent(config)
       └─> Event stored in events Map

2. TRIGGERING
   └─> Trigger condition met OR manual trigger
       └─> eventManager.triggerEvent(id)
           └─> Event added to activeEvents array
           └─> event.trigger() called
           └─> onTrigger callback fires
           └─> Check priority queue
               ├─> If highest priority: event.active = true
               └─> If lower priority: event.pause()

3. ACTIVE/UPDATING
   └─> EventManager.update() called each frame
       └─> Only highest-priority event updates
           └─> event.update() called
               ├─> Check auto-completion (time, condition)
               ├─> Update internal state
               └─> onUpdate callback fires

4. COMPLETION
   └─> One of:
       ├─> User interaction (button click)
       ├─> Time elapsed (autoCompleteAfter)
       ├─> Condition met (completeWhen)
       ├─> Manual call (eventManager.completeEvent)
       └─> Internal state (tutorial end)
   └─> event.complete() called
       ├─> event.completed = true
       ├─> event.active = false
       ├─> onComplete callback fires
       └─> EventManager removes from activeEvents
           └─> Next-highest priority event resumes

5. CLEANUP
   └─> Event removed from activeEvents
   └─> If one-time trigger: trigger marked as used
   └─> Resources freed
```

---

## JSON Configuration Examples

### User-Driven Completion
```json
{
  "id": "quest_accept",
  "type": "dialogue",
  "priority": 3,
  "content": {
    "speaker": "Queen",
    "message": "Will you help defend the colony?",
    "buttons": ["Yes!", "Maybe later"]
  },
  "autoCompleteOnResponse": true
}
```

### Time-Based Completion
```json
{
  "id": "resource_tip",
  "type": "dialogue",
  "priority": 8,
  "content": {
    "message": "Tip: Gather food before winter!"
  },
  "autoCompleteAfter": 4000
}
```

### Condition-Based Completion
```json
{
  "id": "defend_wave",
  "type": "spawn",
  "priority": 5,
  "content": {
    "wave": { "number": 1, "enemies": [...] }
  },
  "completeWhen": {
    "type": "flag",
    "flag": "wave_1_active",
    "value": false
  }
}
```

### Combined Strategies
```json
{
  "id": "boss_fight",
  "type": "boss",
  "priority": 2,
  "content": {
    "bossType": "giant_beetle",
    "health": 1000
  },
  "completeWhen": {
    "type": "flag",
    "flag": "boss_defeated",
    "value": true
  },
  "onComplete": "trigger_victory_dialogue"
}
```

---

## Implementation Checklist

### Event Base Class
- [ ] `complete()` method
- [ ] `pause()` / `resume()` methods
- [ ] `update()` with auto-completion checks
- [ ] `autoCompleteAfter` time tracking
- [ ] `completeWhen` condition evaluation
- [ ] `pausedAt` / `triggeredAt` time adjustment

### EventManager
- [ ] `completeEvent(id)` method
- [ ] `getActiveEventsSorted()` priority sorting
- [ ] `update()` priority queue logic
- [ ] Pause/resume on priority changes
- [ ] Completed event cleanup

### Event Types
- [ ] DialogueEvent: `handleResponse()` → `complete()`
- [ ] TutorialEvent: `nextStep()` → auto-complete at end
- [ ] SpawnEvent: Condition-based completion
- [ ] BossEvent: Flag-based completion

### Tests
- [x] Priority pause/resume tests (added)
- [x] Auto-completion strategy tests (added)
- [ ] Multi-event completion order tests
- [ ] Time-based completion tests
- [ ] Condition-based completion tests

---

**Summary**: Events can complete via user interaction, time, conditions, manual calls, or internal state. The priority queue system pauses lower-priority events and resumes them when higher-priority events complete. This provides flexible, predictable event management for complex game scenarios.
