/*
 * soundmanager.js
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

    // define all sounds here with labels
    this.soundList = {
      click: "/sounds/clickSound.mp3",
      bgMusic: "/sounds/bgMusic.mp3",
      antonyTheme: "/sounds/ayeTony.mp3",
      optionPop: "/sounds/optionPopup.mp3",
    };
  }

  preload() {
    // load all sounds before setup()
    for (let key in this.soundList) {
      this.sounds[key] = loadSound(this.soundList[key]);
    }
    this.loaded = true;
  }

  play(name, volume = 1, rate = 1, loop = false) {
      const s = this.sounds[name];
      if (!s) {
        console.warn(`There is no sound with the name: ${name}`);
        return;
      }
    
      s.setVolume(volume);
      s.rate(rate);
    
      // stop before replaying if it's already playing
      if (s.isPlaying()) s.stop();
    
      if (loop) {
        s.loop(); // built-in looping method
      } else {
        s.play();
      }
    }

  stop(name) {
    const s = this.sounds[name];
    if (s && s.isPlaying()) s.stop();
  }

  toggleMusic(name = "bgMusic") {
    const s = this.sounds[name];
    if (!s) return;
    if (s.isPlaying()) s.pause();
    else s.loop();
  }

  // Example helper for debug testing
  testSounds() {
    console.log("Testing sounds...");
    Object.keys(this.sounds).forEach((name, i) => {
      setTimeout(() => {
        console.log(`Playing: ${name}`);
        this.play(name);
      }, i * 1500);
    });
  }
}

// global instance
let soundManager = new SoundManager();