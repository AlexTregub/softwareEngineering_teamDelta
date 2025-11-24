/*
 * soundManager.js
 * Centralized sound management system for the game.
 * Handles loading, playing, and organizing all sound effects + music.
 * Add new sounds easily by editing the `soundList` object.
 * Provides simple methods to play, stop, and toggle sounds.
 * Developed by Anthony, if you have any questions feel free to ask!
 */

class SoundManager {
  constructor() {
    this.sounds = {};
    this.loaded = false;
    this.bgmCheckInterval = null;
    this.currentBGM = null;
    this.bgmVolume = 0.125;
    this.fadeOutDuration = 1000; // Fade out duration in milliseconds (1 second)
    this.isFading = false;
    this.drawCounter = 0; // Track how many times draw has been called
    this.musicRestartThreshold = 500; // Restart music after this many draw calls
    this.musicRestarted = false;
    this.musicCorrect = false;

    // Default volume settings
    const defaultVolumes = {
      Music: 0.5,
      SoundEffects: 0.2,
      SystemSounds: 0.8
    };

    // Load saved volume settings from localStorage, or use defaults
    const savedVolumes = this.loadVolumeSettings();

    // Sound categories with independent volume controls
    this.categories = {
      Music: {
        volume: savedVolumes.Music !== undefined ? savedVolumes.Music : defaultVolumes.Music,
        sounds: {}
      },
      SoundEffects: {
        volume: savedVolumes.SoundEffects !== undefined ? savedVolumes.SoundEffects : defaultVolumes.SoundEffects,
        sounds: {}
      },
      SystemSounds: {
        volume: savedVolumes.SystemSounds !== undefined ? savedVolumes.SystemSounds : defaultVolumes.SystemSounds,
        sounds: {}
      }
    };

    logNormal('🔊 Audio settings loaded:', {
      Music: this.categories.Music.volume,
      SoundEffects: this.categories.SoundEffects.volume,
      SystemSounds: this.categories.SystemSounds.volume
    });

    // define all sounds here with labels
    this.soundList = {
      click: "sounds/clickSound.mp3",
      bgMusic: "sounds/bgMusic.mp3",
      finalFlash: "sounds/finalFlash.mp3",
      finalFlashCharge: "sounds/finalFlashCharge.mp3",
      prisonMusic: "sounds/prison.mp3",
      tonyMusic: "sounds/TonyTheme.mp3",
    };

    // Map game states to their background music
    this.stateBGMMap = {
      "MENU": "bgMusic",
      "OPTIONS": "bgMusic",
      "DEBUG_MENU": "bgMusic",
      "PLAYING": "prisonMusic", // No BGM during gameplay
      "PAUSED": null,
      "GAME_OVER": null,
      "KANBAN": null
    };
  }

  preload() {
    // load all sounds before setup()
    for (let key in this.soundList) {
      this.sounds[key] = loadSound(this.soundList[key]);
    }
    
    // Register sounds in their categories after loading
    this.registerSound('bgMusic', this.soundList.bgMusic, 'Music');
    this.registerSound('click', this.soundList.click, 'SystemSounds');
    this.registerSound('finalFlash', this.soundList.finalFlash, 'SoundEffects');
    this.registerSound('finalFlashCharge', this.soundList.finalFlashCharge, 'SoundEffects');
    this.loaded = true;
  }

  /**
   * Load volume settings from localStorage
   * @returns {Object} Saved volume settings or empty object if none found
   */
  loadVolumeSettings() {
    try {
      const saved = localStorage.getItem('antgame.audioSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        logVerbose('✅ Loaded audio settings from localStorage:', settings);
        return settings;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load audio settings from localStorage:', error);
    }
    logNormal('ℹ️ No saved audio settings found, using defaults');
    return {};
  }

  /**
   * Save volume settings to localStorage
   */
  saveVolumeSettings() {
    try {
      const settings = {
        Music: this.categories.Music.volume,
        SoundEffects: this.categories.SoundEffects.volume,
        SystemSounds: this.categories.SystemSounds.volume
      };
      localStorage.setItem('antgame.audioSettings', JSON.stringify(settings));
      logNormal('💾 Saved audio settings to localStorage:', settings);
    } catch (error) {
      console.warn('⚠️ Failed to save audio settings to localStorage:', error);
    }
  }

  /**
   * Start automatic background music checking every 3 seconds
   * Ensures correct BGM is playing based on current game state
   */
  startBGMMonitoring() {
    if (this.bgmCheckInterval) {
      return; // Already monitoring
    }    
    // Check every 3 seconds
    this.bgmCheckInterval = setInterval(() => {
      this.checkAndCorrectBGM();
    }, 5000);
  }

  /**
   * Stop automatic background music checking
   */
  stopBGMMonitoring() {
    if (this.bgmCheckInterval) {
      clearInterval(this.bgmCheckInterval);
      this.bgmCheckInterval = null;
      logNormal("🎵 BGM monitoring stopped");
    }
  }

  /**
   * Called from draw() loop to track frames and restart music if needed
   */
  onDraw() {
    this.drawCounter++;
    
    if (this.drawCounter >= this.musicRestartThreshold && this.musicRestarted !== true) {
      this.musicRestarted = true;
      this.checkAndCorrectBGM();
    }
  }

  /**
   * Check if the correct BGM is playing for the current game state
   * If not, correct it automatically
   */
  checkAndCorrectBGM() {
    if (!this.loaded) { return;  }
    
    // Don't interfere while a fade is in progress
    if (this.isFading) {
      logNormal('🎵 BGM Check: Skipping check - fade in progress');
      return;
    }

    // Get current game state
    const currentState = typeof GameState !== 'undefined' ? GameState.getState() : "MENU";
    const expectedBGM = this.stateBGMMap[currentState];
    
    logNormal('🎵 BGM Check:', {
      currentState: currentState,
      expectedBGM: expectedBGM,
      currentBGM: this.currentBGM,
      isCurrentBGMPlaying: this.currentBGM && this.sounds[this.currentBGM] ? this.sounds[this.currentBGM].isPlaying() : 'N/A'
    });

    // Check if the expected BGM matches what's currently playing
    if (expectedBGM === null) {
      // No BGM should be playing in this state
      if (this.currentBGM && this.sounds[this.currentBGM]?.isPlaying()) {
        logNormal(`🎵 Fading out BGM (not needed in ${currentState} state)`);
        this.fadeOut(this.currentBGM);
      }
    } else {
      // BGM should be playing
      const expectedSound = this.sounds[expectedBGM];
      
      if (!expectedSound) {
        console.warn(`🎵 Expected BGM "${expectedBGM}" not found in sound list`);
        return;
      }

      // Check if the correct music is playing
      const isCorrectMusicPlaying = expectedSound.isPlaying();
      
      if (!isCorrectMusicPlaying) {
        logNormal(`🎵 Auto-correcting BGM: Starting "${expectedBGM}" for ${currentState} state at volume ${this.bgmVolume}`);
        this.currentBGM = expectedBGM;
        this.musicCorrect = false;
        this.play(expectedBGM, this.bgmVolume, 1, true);
        logNormal(`🎵 ✅ BGM "${expectedBGM}" is now playing`);
        this.musicCorrect = true;
      } else {
        logNormal(`🎵 ✅ Correct BGM "${expectedBGM}" is already playing`);
      }
    }
  }

  /**
   * Register a new sound in a specific category
   * @param {string} name - Name/identifier for the sound
   * @param {string} path - Path to the sound file
   * @param {string} category - Category: 'Music', 'SoundEffects', or 'SystemSounds'
   * @returns {boolean} - Returns false if invalid category, true if successful
   */
  registerSound(name, path, category) {
    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Sound name must be a non-empty string');
    }
    if (!path || typeof path !== 'string' || path.trim() === '') {
      throw new Error('Sound path must be a non-empty string');
    }
    if (!category || !this.categories[category]) {
      console.warn(`Invalid category: ${category}. Must be 'Music', 'SoundEffects', or 'SystemSounds'`);
      return false;
    }

    // Check if sound already exists in a different category
    const existingCategory = this.getSoundCategory(name);
    if (existingCategory && existingCategory !== category) {
      console.warn(`⚠️ Sound "${name}" already exists in category "${existingCategory}". Moving to "${category}"`);
      delete this.categories[existingCategory].sounds[name];
    }

    // Register the sound in the category
    this.categories[category].sounds[name] = {
      path: path,
      category: category
    };

    // Load the sound if not already loaded
    if (!this.sounds[name]) {
      // Check if loadSound is available (p5.js is ready)
      if (typeof loadSound === 'function') {
        this.sounds[name] = loadSound(path);
        logNormal(`🔊 Registered and loaded sound "${name}" in category "${category}" with path "${path}"`);
      } else {
        // Store for later loading
        console.warn(`⚠️ loadSound not available yet. Sound "${name}" registered but not loaded. Add to soundList for preload.`);
      }
    } else {
      logNormal(`🔊 Registered existing sound "${name}" in category "${category}"`);
    }
  }

  /**
   * Set the volume for an entire category
   * @param {string} category - Category name
   * @param {number} volume - Volume level (0.0 to 1.0)
   * @returns {boolean} - Returns false if invalid category, true if successful
   */
  setCategoryVolume(category, volume) {
    if (!this.categories[category]) {
      console.warn(`Invalid category: ${category}. Must be 'Music', 'SoundEffects', or 'SystemSounds'`);
      return false;
    }
    
    // Clamp volume to valid range [0, 1]
    volume = Math.max(0, Math.min(1, volume));

    this.categories[category].volume = volume;
    logNormal(`🔊 Set ${category} volume to ${volume}`);

    // Save settings to localStorage
    this.saveVolumeSettings();

    // Update volume for all currently playing sounds in this category
    for (const soundName in this.categories[category].sounds) {
      const sound = this.sounds[soundName];
      if (sound && sound.isPlaying && sound.isPlaying()) {
        sound.setVolume(volume);
      }
    }
  }

  /**
   * Get the volume for a category
   * @param {string} category - Category name
   * @returns {number} Volume level (0.0 to 1.0)
   */
  getCategoryVolume(category) {
    if (!this.categories[category]) {
      throw new Error(`Invalid category: ${category}. Must be 'Music', 'SoundEffects', or 'SystemSounds'`);
    }
    return this.categories[category].volume;
  }

  /**
   * Get the category of a sound
   * @param {string} name - Sound name
   * @returns {string|null} Category name or null if not found
   */
  getSoundCategory(name) {
    for (const categoryName in this.categories) {
      if (this.categories[categoryName].sounds[name]) {
        return categoryName;
      }
    }
    return null; // Sound not found or is a legacy sound
  }

  /**
   * Fade out a sound over the specified duration
   * @param {string} name - Name of the sound to fade out
   * @param {number} duration - Duration of fade in milliseconds (default: 1000ms)
   */
  fadeOut(name, duration = this.fadeOutDuration) {
    const s = this.sounds[name];
    if (!s || !s.isPlaying()) return;

    this.isFading = true;
    const startVolume = s.getVolume();
    const startTime = Date.now();

    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        // Fade complete
        s.stop();
        clearInterval(fadeInterval);
        this.isFading = false;
        
        // Clear current BGM tracking if fading out the current BGM
        if (name === this.currentBGM) {
          this.currentBGM = null;
        }
        
        logNormal(`🎵 Fade out complete for "${name}"`);
      } else {
        // Calculate new volume (linear fade)
        const newVolume = startVolume * (1 - progress);
        s.setVolume(newVolume);
      }
    }, 50); // Update every 50ms for smooth fade
  }

  play(name, volume = 1, rate = 1, loop = false) {
      let s = this.sounds[name];
      
      // If sound not loaded but is registered in a category, try to load it now
      if (!s) {
        const category = this.getSoundCategory(name);
        if (category && this.categories[category].sounds[name]) {
          const path = this.categories[category].sounds[name].path;
          logNormal(`🔊 Lazy-loading sound "${name}" from path "${path}"`);
          if (typeof loadSound === 'function') {
            // Get category volume NOW (before async load) to apply when sound is ready
            const categoryVolume = this.categories[category].volume;
            const finalVolume = volume * categoryVolume;
            
            // Load with callback to play when ready
            this.sounds[name] = loadSound(path, () => {
              logNormal(`🔊 Sound "${name}" loaded and ready, playing with final volume: ${finalVolume.toFixed(3)} (base: ${volume.toFixed(3)} × category: ${categoryVolume.toFixed(3)})`);
              
              // Set volume before playing
              this.sounds[name].setVolume(finalVolume);
              this.sounds[name].rate(rate);
              
              // Play the sound
              if (loop) {
                this.sounds[name].loop();
                // Track current BGM and store the FINAL volume
                if (name === "bgMusic") {
                  this.currentBGM = name;
                  this.bgmVolume = finalVolume;
                }
              } else {
                this.sounds[name].play();
              }
            });
            return; // Exit early, callback will handle playing
          } else {
            console.error(`🔊 Cannot load sound "${name}" - loadSound function not available`);
            return;
          }
        } else {
          console.warn(`🔊 Cannot play sound "${name}" - not found in loaded sounds or registered categories`);
          console.warn(`🔊 Available sounds:`, Object.keys(this.sounds));
          return;
        }
      }
    
      // ALWAYS apply category volume settings
      // The passed 'volume' parameter is treated as a base/relative volume (0.0 to 1.0)
      // which is then multiplied by the category's volume setting
      const category = this.getSoundCategory(name);
      let finalVolume;
      
      if (category) {
        const categoryVolume = this.categories[category].volume;
        // Final volume = base volume × category volume (both 0.0 to 1.0)
        finalVolume = volume * categoryVolume;
        logNormal(`🔊 Playing "${name}" (${category}) - base: ${volume.toFixed(3)}, category: ${categoryVolume.toFixed(3)}, final: ${finalVolume.toFixed(3)}, rate: ${rate}, loop: ${loop}`);
      } else {
        // Legacy sound without category - use passed volume directly
        finalVolume = volume;
        console.warn(`⚠️ Playing "${name}" (no category) - using direct volume: ${volume.toFixed(3)}, rate: ${rate}, loop: ${loop}`);
      }
    
      s.setVolume(finalVolume);
      s.rate(rate);
    
      // stop before replaying if it's already playing
      if (s.isPlaying()) s.stop();
    
      if (loop) {
        s.loop(); // built-in looping method
        // Track current BGM and store the FINAL volume (after category adjustment)
        if (name === "bgMusic") {
          this.currentBGM = name;
          this.bgmVolume = finalVolume;
        }
      } else {
        s.play();
      }
    }

  stop(name, useFade = false) {
    if (useFade) {
      this.fadeOut(name);
      return;
    }
    
    const s = this.sounds[name];
    if (s && s.isPlaying()) s.stop();
    
    // Clear current BGM tracking if stopping the current BGM
    if (name === this.currentBGM) {
      this.currentBGM = null;
    }
  }

  toggleMusic(name = "bgMusic") {
    const s = this.sounds[name];
    if (!s) return;
    if (s.isPlaying()) s.pause();
    else s.loop();
  }

  // Example helper for debug testing
  testSounds() {
    logNormal("Testing sounds...");
    Object.keys(this.sounds).forEach((name, i) => {
      setTimeout(() => {
        logNormal(`Playing: ${name}`);
        this.play(name);
      }, i * 1500);
    });
  }
}

// Create global instance immediately after class definition
// This ensures soundManager is available when sketch.js uses it
console.log("bigglywiggly")
let soundManager = new SoundManager();

// Wrapper function for p5.js preload() compatibility
function soundManagerPreload() {
  if (soundManager && typeof soundManager.preload === 'function') {
    soundManager.preload();
  }
}
