# Dialogue System Tests

Isolated test suite for the dialogue system implementation using DraggablePanel infrastructure.

## 🎯 Design Goals

- **Reuse DraggablePanel**: Leverage existing panel system for dialogue UI
- **Event Integration**: Seamlessly integrate with EventManager
- **Easy Creation**: Simple JSON-based dialogue definitions
- **Branching Support**: Support dialogue trees via `nextEventId`
- **Extensible**: Easy to add portraits, animations, voice later

## 🏃 Running Tests (Isolated)

These tests run in **isolation** to avoid conflicts with other test suites:

```bash
# Run dialogue tests only
npm run test:dialogue

# Or directly
node test/unit/dialogue/run-dialogue-tests.js

# Watch mode for development
npm run test:dialogue:watch
```

## 📋 Test Coverage

### Core Functionality (21 tests)
- ✅ Constructor validation
- ✅ Panel creation and configuration
- ✅ Choice button generation
- ✅ Choice selection and callbacks
- ✅ Event flag tracking
- ✅ Panel reuse between dialogues

### Content Rendering (5 tests)
- ✅ contentSizeCallback integration
- ✅ Word-wrapped text rendering
- ✅ Text styling and formatting
- ✅ Rendering isolation (push/pop)

### Future Extensions (2 tests)
- ✅ Portrait rendering placeholder
- ✅ Portrait layout space reservation

### Integration (3 tests)
- ✅ Event base class inheritance
- ✅ Priority system support
- ✅ Lifecycle callback support

### JSON Configuration (1 test)
- ✅ Load from JSON event definitions

### Error Handling (2 tests)
- ✅ Graceful degradation without managers
- ✅ Missing dependency handling

**Total: 34 comprehensive tests**

## 📖 Usage Examples

### Basic Dialogue

```javascript
const dialogue = new DialogueEvent({
  id: 'welcome',
  content: {
    speaker: 'Queen Ant',
    message: 'Welcome to our colony!',
    choices: [
      { text: 'Thank you!', nextEventId: 'tutorial_start' }
    ]
  }
});

dialogue.trigger();
```

### Branching Dialogue

```javascript
const dialogue = new DialogueEvent({
  id: 'quest_offer',
  content: {
    speaker: 'Queen Ant',
    message: 'Will you help defend the colony?',
    choices: [
      { 
        text: 'Yes, I will help!',
        nextEventId: 'wave_1_start',
        onSelect: () => {
          eventManager.setFlag('player_helping', true);
        }
      },
      { 
        text: 'Tell me more first',
        nextEventId: 'quest_explanation'
      },
      { 
        text: 'Not right now',
        nextEventId: 'quest_declined',
        onSelect: () => {
          eventManager.setFlag('quest_declined', true);
        }
      }
    ]
  },
  priority: 1
});
```

### JSON-Based Dialogue (Recommended)

```json
{
  "id": "intro_dialogue",
  "type": "dialogue",
  "content": {
    "speaker": "Queen Ant",
    "message": "Enemies approach! We need your help gathering resources and defending the colony. Are you ready?",
    "portrait": "Images/Characters/queen.png",
    "choices": [
      {
        "text": "I'm ready to help!",
        "nextEventId": "tutorial_gathering"
      },
      {
        "text": "What kind of enemies?",
        "nextEventId": "enemy_info"
      }
    ]
  },
  "priority": 5,
  "metadata": {
    "questId": "main_quest_1",
    "voiceFile": "audio/queen_intro.mp3"
  }
}
```

### With Portrait (Future Feature)

```javascript
const dialogue = new DialogueEvent({
  id: 'queen_portrait',
  content: {
    speaker: 'Queen Ant',
    message: 'Look at my magnificent portrait!',
    portrait: 'Images/Characters/queen.png', // 64x64 recommended
    choices: [{ text: 'Beautiful!' }]
  }
});
```

### Auto-Continue Dialogue

```javascript
const dialogue = new DialogueEvent({
  id: 'notification',
  content: {
    speaker: 'System',
    message: 'Resources delivered to the colony!',
    autoContinue: true,
    autoContinueDelay: 2000 // Auto-close after 2 seconds
  }
});
```

## 🎨 Panel Configuration

DialogueEvent automatically configures DraggablePanel with:

- **Position**: Bottom-center of screen
- **Size**: Auto-sized based on content
- **Behavior**: 
  - ❌ Not draggable
  - ❌ Not closeable (must select choice)
  - ❌ Not minimizable
- **Buttons**: Horizontal layout with auto-sizing
- **Content**: Custom rendering via `contentSizeCallback`

## 🔗 Integration Points

### With EventManager

```javascript
// Register dialogue event
eventManager.registerEvent({
  id: 'welcome_dialogue',
  type: 'dialogue',
  content: { /* ... */ }
});

// Trigger via EventManager
eventManager.triggerEvent('welcome_dialogue');

// Or via trigger
eventManager.registerTrigger({
  eventId: 'welcome_dialogue',
  type: 'time',
  condition: { delay: 2000 }
});
```

### With DraggablePanelManager

DialogueEvent automatically uses `draggablePanelManager.getOrCreatePanel()` to:
- Reuse the same panel for all dialogues
- Update content dynamically
- Handle show/hide automatically

### Choice Tracking with Flags

Player choices are automatically tracked:

```javascript
// When player selects choice index 1 in dialogue 'quest_offer'
// Flag is automatically set:
eventManager.getFlag('quest_offer_choice'); // Returns: 1

// You can check choices later:
if (eventManager.getFlag('quest_offer_choice') === 0) {
  // Player chose "Yes, I will help!"
} else if (eventManager.getFlag('quest_offer_choice') === 2) {
  // Player chose "Not right now"
}
```

## 🛠️ Implementation Checklist

### Required Classes

- [ ] `DialogueEvent` extends `Event` base class
- [ ] Implements `trigger()` method
- [ ] Implements `complete()` method
- [ ] Implements `update()` for auto-continue

### Required Files

- [ ] `Classes/events/DialogueEvent.js` - Main implementation
- [ ] `Classes/events/Event.js` - Base class (if not exists)
- [ ] Update `index.html` with script tag

### Integration Steps

1. **Create DialogueEvent.js**
   ```javascript
   class DialogueEvent extends Event {
     constructor(config) { /* ... */ }
     trigger(data) { /* ... */ }
     handleChoice(choice, index) { /* ... */ }
     // ... other methods
   }
   
   if (typeof window !== 'undefined') window.DialogueEvent = DialogueEvent;
   if (typeof module !== 'undefined') module.exports = DialogueEvent;
   ```

2. **Add to index.html**
   ```html
   <script src="Classes/events/Event.js"></script>
   <script src="Classes/events/DialogueEvent.js"></script>
   ```

3. **Register with EventManager**
   ```javascript
   // In EventManager.js
   const EVENT_TYPES = {
     'dialogue': DialogueEvent,
     'spawn': SpawnEvent,
     'tutorial': TutorialEvent,
     // ...
   };
   ```

## 🔮 Future Extensions

The test suite includes placeholders for future features:

### Portrait Support
- Display character portraits (64x64px recommended)
- Position: Left side of dialogue
- Text offset to accommodate portrait

### Animation Support
- Typewriter text effect
- Fade in/out transitions
- Speaker bounce/highlight

### Audio Support
- Voice acting playback
- Sound effects for choices
- Background music per dialogue

### Advanced Features
- Multiple speakers in one dialogue
- Dialogue history/log
- Skip/fast-forward
- Save/load dialogue state

## 📊 Test Statistics

```
Total Tests: 34
├─ Constructor: 7 tests
├─ Panel Display: 6 tests
├─ Choice Buttons: 5 tests
├─ Choice Selection: 7 tests
├─ Content Rendering: 5 tests
├─ Panel Reuse: 2 tests
├─ Event Integration: 3 tests
├─ JSON Config: 1 test
├─ Error Handling: 2 tests
└─ Future Extensions: 2 tests
```

## 🐛 Debugging

If tests fail, check:

1. **Missing Dependencies**
   ```bash
   npm install mocha chai sinon --save-dev
   ```

2. **Module Exports**
   - DialogueEvent must export to both `window` and `module.exports`
   - Event base class must be available

3. **Mock Managers**
   - Tests mock `eventManager` and `draggablePanelManager`
   - Implementation should check for existence

4. **p5.js Functions**
   - All p5.js functions are mocked in tests
   - Use guards: `if (typeof textWidth === 'function')`

## 📝 Notes

- Tests are written **FIRST** following TDD methodology
- All tests currently **skip** until implementation is complete
- Tests are **isolated** and won't interfere with other test suites
- Run `npm run test:dialogue` anytime to check progress

## 🤝 Contributing

When adding new dialogue features:

1. Write tests FIRST in `DialogueEvent.test.js`
2. Run tests to verify they fail: `npm run test:dialogue`
3. Implement feature in `DialogueEvent.js`
4. Run tests to verify they pass
5. Add usage example to this README

---

**Ready to implement?** Start by creating `Classes/events/DialogueEvent.js` and run `npm run test:dialogue` to track your progress!
