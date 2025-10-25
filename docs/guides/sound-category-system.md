# Sound Category System Guide

## Overview

The SoundManager now supports categorized sounds with independent volume controls. This allows you to manage Music, Sound Effects, and System Sounds separately, making it easier to implement volume settings and balance audio in your game.

## Categories

The system provides three built-in categories:

- **Music**: Background music and ambient tracks (default volume: 0.5)
- **SoundEffects**: In-game sound effects like explosions, impacts, etc. (default volume: 0.75)
- **SystemSounds**: UI sounds like clicks, notifications, etc. (default volume: 0.8)

## Basic Usage

### Registering a Sound

To register a new sound in a category:

```javascript
soundManager.registerSound(name, path, category);
```

**Parameters:**
- `name` (string): Unique identifier for the sound
- `path` (string): Relative path to the sound file
- `category` (string): One of 'Music', 'SoundEffects', or 'SystemSounds'

**Example:**
```javascript
// Register a battle music track
soundManager.registerSound('battleMusic', 'sounds/battle_theme.mp3', 'Music');

// Register an explosion sound effect
soundManager.registerSound('explosion', 'sounds/boom.wav', 'SoundEffects');

// Register a button click sound
soundManager.registerSound('buttonClick', 'sounds/click.mp3', 'SystemSounds');
```

### Playing Categorized Sounds

Once registered, play sounds normally. The category volume is automatically applied:

```javascript
// Play with default volume (category volume will be applied)
soundManager.play('battleMusic');

// Play with custom volume (multiplied by category volume)
soundManager.play('explosion', 0.8); // Final volume = 0.8 * 0.75 = 0.6

// Play looped music
soundManager.play('battleMusic', 0.6, 1, true);
```

## Volume Control

### Setting Category Volume

Control the volume for all sounds in a category:

```javascript
// Set music volume to 30%
soundManager.setCategoryVolume('Music', 0.3);

// Set sound effects volume to 100%
soundManager.setCategoryVolume('SoundEffects', 1.0);

// Mute system sounds
soundManager.setCategoryVolume('SystemSounds', 0);
```

**Note:** Volume must be between 0.0 and 1.0

### Getting Category Volume

Retrieve the current volume setting for a category:

```javascript
const musicVolume = soundManager.getCategoryVolume('Music');
console.log(`Music is at ${musicVolume * 100}%`);
```

### Volume Calculation

When you play a sound, the final volume is calculated as:

```
Final Volume = Play Volume × Category Volume
```

**Example:**
```javascript
// Set category volume
soundManager.setCategoryVolume('SoundEffects', 0.5);

// Play with custom volume
soundManager.play('explosion', 0.8);
// Final volume = 0.8 × 0.5 = 0.4 (40%)
```

## Advanced Usage

### Checking Sound Category

Find out which category a sound belongs to:

```javascript
const category = soundManager.getSoundCategory('explosion');
console.log(category); // Output: "SoundEffects"

// Returns null for legacy sounds without a category
const legacyCategory = soundManager.getSoundCategory('click');
console.log(legacyCategory); // Output: null
```

### Real-time Volume Updates

Changing category volume affects all currently playing sounds in that category:

```javascript
// Start playing multiple sounds
soundManager.play('battleMusic', 1, 1, true);
soundManager.play('ambientWind', 1, 1, true);

// Later, adjust all music volume at once
soundManager.setCategoryVolume('Music', 0.3);
// Both battleMusic and ambientWind are now at 30% volume
```

## Integration Example: Settings Menu

Here's how to create a volume settings interface:

```javascript
class VolumeSettings {
  constructor() {
    this.musicSlider = createSlider(0, 100, 50);
    this.sfxSlider = createSlider(0, 100, 75);
    this.systemSlider = createSlider(0, 100, 80);
  }
  
  update() {
    // Convert slider values (0-100) to volume (0-1)
    soundManager.setCategoryVolume('Music', this.musicSlider.value() / 100);
    soundManager.setCategoryVolume('SoundEffects', this.sfxSlider.value() / 100);
    soundManager.setCategoryVolume('SystemSounds', this.systemSlider.value() / 100);
  }
  
  display() {
    // Draw sliders with labels
    text('Music Volume', 50, 100);
    text('Sound Effects Volume', 50, 150);
    text('System Sounds Volume', 50, 200);
  }
}
```

## Migration Guide

### Converting Legacy Sounds

Legacy sounds (registered before the category system) continue to work but don't benefit from category volume control.

**Before:**
```javascript
// Legacy sound in soundList
this.soundList = {
  click: "sounds/clickSound.mp3"
};
```

**After:**
```javascript
// Register in a category (add to preload())
soundManager.registerSound('click', 'sounds/clickSound.mp3', 'SystemSounds');
```

## Complete Example

```javascript
// In preload()
function preload() {
  soundManager.preload();
  
  // Register all game sounds in appropriate categories
  
  // Music
  soundManager.registerSound('menuMusic', 'sounds/menu_theme.mp3', 'Music');
  soundManager.registerSound('battleMusic', 'sounds/battle_theme.mp3', 'Music');
  soundManager.registerSound('victoryMusic', 'sounds/victory.mp3', 'Music');
  
  // Sound Effects
  soundManager.registerSound('explosion', 'sounds/explosion.wav', 'SoundEffects');
  soundManager.registerSound('lightningStrike', 'sounds/lightning_strike.wav', 'SoundEffects');
  soundManager.registerSound('footsteps', 'sounds/walk.wav', 'SoundEffects');
  
  // System Sounds
  soundManager.registerSound('buttonClick', 'sounds/click.mp3', 'SystemSounds');
  soundManager.registerSound('notification', 'sounds/notify.wav', 'SystemSounds');
  soundManager.registerSound('error', 'sounds/error.wav', 'SystemSounds');
}

// In setup()
function setup() {
  // Set initial volume preferences
  soundManager.setCategoryVolume('Music', 0.4);
  soundManager.setCategoryVolume('SoundEffects', 0.7);
  soundManager.setCategoryVolume('SystemSounds', 0.9);
}

// In game code
function gameLoop() {
  // Play sounds normally - category volumes are applied automatically
  if (gameState === 'MENU') {
    soundManager.play('menuMusic', 1, 1, true);
  }
  
  if (buttonClicked) {
    soundManager.play('buttonClick');
  }
  
  if (explosionTriggered) {
    soundManager.play('explosion', 0.8); // 80% of SoundEffects volume
  }
}
```

## Best Practices

1. **Register sounds during preload**: Call `registerSound()` in the `preload()` function to ensure sounds are loaded before use

2. **Use consistent categories**: Keep similar sounds in the same category for easier management

3. **Provide user controls**: Let players adjust category volumes in a settings menu

4. **Test volume ranges**: Make sure sounds are audible at different volume settings

5. **Document your sounds**: Keep track of which sounds belong to which category

## Error Handling

The category system includes built-in validation:

```javascript
// Invalid category - throws error
soundManager.registerSound('test', 'path.mp3', 'InvalidCategory');
// Error: Invalid category: InvalidCategory. Must be 'Music', 'SoundEffects', or 'SystemSounds'

// Invalid volume - throws error
soundManager.setCategoryVolume('Music', 1.5);
// Error: Volume must be a number between 0 and 1

// Missing parameters - throws error
soundManager.registerSound('', 'path.mp3', 'Music');
// Error: Sound name must be a non-empty string
```

## Testing

The category system includes comprehensive unit tests. Run them with:

```bash
npm test -- test/unit/managers/soundManager.test.js
```

## API Reference

### Methods

- `registerSound(name, path, category)` - Register a new sound in a category
- `setCategoryVolume(category, volume)` - Set volume for all sounds in a category (0-1)
- `getCategoryVolume(category)` - Get current volume for a category
- `getSoundCategory(name)` - Get the category a sound belongs to (returns null if not categorized)
- `play(name, volume, rate, loop)` - Play a sound (category volume is automatically applied)

### Categories

- `Music` - Background music and ambient tracks
- `SoundEffects` - In-game sound effects
- `SystemSounds` - UI and system sounds

## Support

For questions or issues with the sound category system, contact the development team or check the unit tests for usage examples.
