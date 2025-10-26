# Dialogue System Architecture

## Component Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      EVENT MANAGER                              │
│  - Loads events from JSON                                       │
│  - Tracks event flags (player choices)                          │
│  - Manages event lifecycle                                      │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ registerEvent()
             │ triggerEvent()
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DIALOGUE EVENT                               │
│  - Extends Event base class                                     │
│  - Stores speaker, message, choices                             │
│  - Handles choice selection logic                               │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ trigger() calls
             │ getOrCreatePanel()
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              DRAGGABLE PANEL MANAGER                            │
│  - Manages all UI panels                                        │
│  - Reuses 'dialogue-display' panel                              │
│  - Handles show/hide/update                                     │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ creates/updates
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DRAGGABLE PANEL                                │
│  ID: 'dialogue-display'                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Title: [Speaker Name]                          [─] [×]  │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │                                                           │ │
│  │  [Portrait]  Dialogue message text wraps                 │ │
│  │   (64x64)    across multiple lines as needed.            │ │
│  │              Rendered via contentSizeCallback().          │ │
│  │                                                           │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  [Choice 1]  [Choice 2]  [Choice 3]                      │ │
│  │  ← Horizontal button layout, auto-sized                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│  Properties:                                                    │
│  - Position: Bottom-center                                     │
│  - Draggable: false                                            │
│  - Closeable: false (must choose)                              │
│  - Auto-sized: true                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Player Selects Choice

```
User clicks choice button
       │
       ▼
Button onClick() handler
       │
       ├─> Execute choice.onSelect() callback (if exists)
       │
       ├─> Set event flag: eventManager.setFlag('{eventId}_choice', choiceIndex)
       │
       ├─> Trigger next event: eventManager.triggerEvent(choice.nextEventId)
       │
       ├─> Complete current dialogue: dialogue.complete()
       │
       └─> Hide panel: draggablePanelManager.hidePanel('dialogue-display')
```

## JSON Event Definition → Runtime

```json
{
  "id": "queen_welcome",
  "type": "dialogue",
  "content": {
    "speaker": "Queen Ant",
    "message": "Welcome!",
    "choices": [
      { "text": "Hello!", "nextEventId": "tutorial" }
    ]
  }
}
```

**Transforms to:**

```javascript
new DialogueEvent({
  id: 'queen_welcome',
  content: {
    speaker: 'Queen Ant',
    message: 'Welcome!',
    choices: [
      { text: 'Hello!', nextEventId: 'tutorial' }
    ]
  }
})
```

**When triggered:**

```javascript
dialogue.trigger()
  ↓
Creates DraggablePanel with:
  - title: "Queen Ant"
  - contentSizeCallback: renders "Welcome!"
  - buttons: [
      { caption: "Hello!", onClick: () => {
          eventManager.setFlag('queen_welcome_choice', 0)
          eventManager.triggerEvent('tutorial')
          dialogue.complete()
          panel.hide()
      }}
    ]
```

## Class Hierarchy

```
Event (base class)
  │
  ├─ properties: id, type, active, completed, priority
  ├─ methods: trigger(), complete(), pause(), resume(), update()
  │
  └─── DialogueEvent
         │
         ├─ properties: 
         │    - content.speaker
         │    - content.message
         │    - content.choices[]
         │    - content.portrait (optional)
         │    - content.autoContinue (optional)
         │
         └─ methods:
              - trigger() → creates panel
              - handleChoice(choice, index)
              - renderDialogueContent(contentArea)
              - getChoices()
```

## Panel Configuration Details

```javascript
{
  id: 'dialogue-display',              // Reused for all dialogues
  title: content.speaker || 'Dialogue', // Dynamic per dialogue
  position: {
    x: window.innerWidth / 2 - 250,    // Centered horizontally
    y: window.innerHeight - 200        // Bottom of screen
  },
  size: {
    width: 500,                         // Fixed width
    height: 160                         // Auto-adjusted by content
  },
  behavior: {
    draggable: false,                   // Can't drag dialogue
    closeable: false,                   // Must select choice
    minimizable: false                  // Can't minimize
  },
  buttons: {
    layout: 'horizontal',               // Choices side-by-side
    autoSizeToContent: true,            // Fit button area to choices
    spacing: 10,
    items: [/* generated from choices */]
  },
  contentSizeCallback: (area) => {
    // Custom rendering:
    // 1. Draw portrait (if exists)
    // 2. Render word-wrapped message
    // 3. Return content dimensions
  }
}
```

## Extension Points (Future Features)

### 1. **Portrait System**
```javascript
content: {
  portrait: 'Images/Characters/queen.png',
  portraitPosition: 'left' // or 'right'
}
```

### 2. **Animations**
```javascript
content: {
  animation: 'typewriter',
  animationSpeed: 50 // ms per character
}
```

### 3. **Voice Acting**
```javascript
metadata: {
  voiceFile: 'audio/dialogue/queen_01.mp3',
  autoPlay: true
}
```

### 4. **Dialogue History**
```javascript
DialogueEvent.history = [];
// Track all shown dialogues for replay/log
```

### 5. **Conditional Choices**
```javascript
choices: [
  {
    text: 'Mention the artifact',
    condition: {
      flag: 'has_artifact',
      value: true
    }
  }
]
```

## File Structure

```
Classes/
  events/
    Event.js              ← Base class (to be created)
    DialogueEvent.js      ← Main implementation (to be created)
    SpawnEvent.js         ← Other event types
    TutorialEvent.js
    
config/
  events/
    dialogue_examples.json ← Sample dialogues
    level_1_events.json    ← Level-specific events
    
test/
  unit/
    dialogue/
      DialogueEvent.test.js    ← Unit tests (✓ created)
      run-dialogue-tests.js    ← Isolated test runner (✓ created)
      README.md                ← Documentation (✓ created)
```

## Integration Checklist

- [ ] Create `Event.js` base class
- [ ] Implement `DialogueEvent.js`
- [ ] Add script tags to `index.html`
- [ ] Update `EventManager.js` to support 'dialogue' type
- [ ] Create dialogue JSON files
- [ ] Test with `npm run test:dialogue`
- [ ] Create integration tests with real DraggablePanel
- [ ] Add E2E tests with screenshot verification

## Performance Considerations

- **Panel Reuse**: Same panel instance for all dialogues (avoids creation overhead)
- **Lazy Portrait Loading**: Only load portraits when first needed
- **Text Caching**: Cache word-wrapped text to avoid recalculation
- **Event Cleanup**: Remove completed dialogues from memory

## Best Practices

1. **Keep messages concise**: 2-3 sentences max
2. **Limit choices**: 2-4 options per dialogue
3. **Use nextEventId**: Chain dialogues for branching stories
4. **Track choices**: Use event flags to remember player decisions
5. **Test in isolation**: Use `npm run test:dialogue` frequently
6. **JSON-first**: Define dialogues in JSON, not hardcoded

---

**Next Steps**: Run `npm run test:dialogue` to see the test suite in action!
