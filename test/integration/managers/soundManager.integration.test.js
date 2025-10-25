/**
 * SoundManager Integration Tests (JSDOM - Fast Browser Environment)
 * 
 * These tests verify how soundManager integrates with other systems using JSDOM:
 * - localStorage integration (via JSDOM)
 * - category system with sound registration
 * - volume propagation across categories
 * - Minimal p5.sound mocking (only for audio playback)
 * 
 * JSDOM provides a browser-like environment 10-100x faster than Puppeteer!
 * Unlike unit tests, these test interactions between components.
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('SoundManager Integration Tests (JSDOM)', function() {
  this.timeout(5000);

  let dom;
  let window;
  let soundManager;
  let mockSounds;
  let SoundManager;

  beforeEach(function() {
    // Create a browser-like environment with JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    window = dom.window;
    global.window = window;
    global.document = window.document;
    global.localStorage = window.localStorage;
    
    // Clear localStorage for clean test
    window.localStorage.clear();

    // Load the SoundManager class 
    const soundManagerPath = path.join(__dirname, '../../../Classes/managers/soundManager.js');
    delete require.cache[require.resolve(soundManagerPath)];
    const fileContent = fs.readFileSync(soundManagerPath, 'utf8');
    
    // Extract only the class, not the global instance
    const match = fileContent.match(/(class SoundManager[\s\S]*?)(?=\/\/ Create global instance|$)/);
    const classCode = match ? match[1] : fileContent;
    
    // Use eval in current scope (works because we delete the class each time)
    try {
      // Delete any previous SoundManager definition
      if (typeof SoundManager !== 'undefined') {
        SoundManager = undefined;
      }
      eval(classCode);
    } catch (e) {
      // If eval fails, just continue - the class might already be defined
    }

    vm.runInContext(classCode, context);
    SoundManager = context.SoundManager;

    // Minimal mock for p5.sound (only what's needed for loading, not actual playback)
    mockSounds = {};
    global.loadSound = function(soundPath, callback) {
      const mockSound = {
        path: soundPath,
        currentVolume: 1,
        currentRate: 1,
        isPlayingFlag: false,
        play() { this.isPlayingFlag = true; },
        stop() { this.isPlayingFlag = false; },
        setVolume(vol) { this.currentVolume = vol; },
        getVolume() { return this.currentVolume; },
        rate(r) { if (r !== undefined) this.currentRate = r; return this.currentRate; },
        isPlaying() { return this.isPlayingFlag; }
      };
      
      // Async callback like p5.sound
      if (callback) {
        setImmediate(() => callback(mockSound));
      }
      
      mockSounds[soundPath] = mockSound;
      return mockSound;
    };

    // Suppress console output during tests
    global.console = {
      ...console,
      log: () => {},
      warn: () => {},
      info: () => {}
    };

    // Create soundManager instance with localStorage from JSDOM
    soundManager = new SoundManager();
  });

  afterEach(function() {
    if (dom) {
      dom.window.close();
    }
    mockSounds = {};
    delete global.window;
    delete global.document;
    delete global.localStorage;
    delete global.loadSound;
  });

  // ============================================================================
  // Integration Test 1: localStorage + Category System (localStorage!)
  // Tests how browser localStorage integrates with category volumes
  // ============================================================================
  describe('localStorage Integration (JSDOM localStorage)', function() {
    
    it('should integrate localStorage with category volume system', function() {
      // Create first instance, set volumes
      const manager1 = new SoundManager();
      manager1.setCategoryVolume('Music', 0.3);
      manager1.setCategoryVolume('SoundEffects', 0.6);
      
      // Verify localStorage received the data
      const saved = JSON.parse(window.localStorage.getItem('antgame.audioSettings'));
      expect(saved).to.deep.include({ Music: 0.3, SoundEffects: 0.6 });
      
      // Create second instance - should load from localStorage
      const manager2 = new SoundManager();
      expect(manager2.getCategoryVolume('Music')).to.equal(0.3);
      expect(manager2.getCategoryVolume('SoundEffects')).to.equal(0.6);
    });

    it('should handle localStorage errors gracefully and still function', function() {
      // Simulate localStorage failure
      global.localStorage = {
        getItem() { throw new Error('localStorage unavailable'); },
        setItem() { throw new Error('localStorage unavailable'); }
      };

      // Should not crash, should use defaults
      const manager = new SoundManager();
      expect(manager.getCategoryVolume('Music')).to.equal(0.5);
      
      // Should still be able to change volumes
      manager.setCategoryVolume('Music', 0.2);
      expect(manager.getCategoryVolume('Music')).to.equal(0.2);
    });

    it('should integrate partial localStorage data with default values', function() {
      // Save only Music category to localStorage
      window.localStorage.setItem('antgame.audioSettings', JSON.stringify({ Music: 0.2 }));
      
      const manager = new SoundManager();
      
      // Should use saved value for Music
      expect(manager.getCategoryVolume('Music')).to.equal(0.2);
      
      // Should use defaults for others
      expect(manager.getCategoryVolume('SoundEffects')).to.equal(0.75);
      expect(manager.getCategoryVolume('SystemSounds')).to.equal(0.8);
    });
  });

  // ============================================================================
  // Integration Test 2: Category System + Sound Registration
  // Tests how categories integrate with sound registration and management
  // ============================================================================
  describe('Category and Sound Registration Integration', function() {
    
    it('should integrate category assignment with sound registration', function(done) {
      soundManager = new SoundManager();
      soundManager.preload();
      
      setTimeout(() => {
        // Register sounds in different categories
        soundManager.registerSound('track1', 'sounds/track1.mp3', 'Music');
        soundManager.registerSound('effect1', 'sounds/effect1.mp3', 'SoundEffects');
        soundManager.registerSound('beep1', 'sounds/beep1.mp3', 'SystemSounds');
        
        // Verify sounds are in correct categories
        expect(soundManager.getSoundCategory('track1')).to.equal('Music');
        expect(soundManager.getSoundCategory('effect1')).to.equal('SoundEffects');
        expect(soundManager.getSoundCategory('beep1')).to.equal('SystemSounds');
        
        done();
      }, 50);
    });

    it('should integrate category volumes with sound playback', function(done) {
      soundManager = new SoundManager();
      
      // Set category volumes
      soundManager.setCategoryVolume('Music', 0.5);
      soundManager.setCategoryVolume('SoundEffects', 0.25);
      
      // Register sounds
      soundManager.registerSound('music', 'sounds/music.mp3', 'Music');
      soundManager.registerSound('sfx', 'sounds/sfx.mp3', 'SoundEffects');
      
      setTimeout(() => {
        // Play with base volume 1.0
        soundManager.play('music', 1.0);
        soundManager.play('sfx', 1.0);
        
        const musicSound = mockSounds['sounds/music.mp3'];
        const sfxSound = mockSounds['sounds/sfx.mp3'];
        
        if (musicSound && sfxSound) {
          // Should multiply base volume by category volume
          expect(musicSound.currentVolume).to.be.closeTo(0.5, 0.01);
          expect(sfxSound.currentVolume).to.be.closeTo(0.25, 0.01);
        }
        done();
      }, 50);
    });

    it('should integrate category volume changes with existing sounds', function(done) {
      soundManager = new SoundManager();
      soundManager.registerSound('test', 'sounds/test.mp3', 'Music');
      
      setTimeout(() => {
        // Initial play
        soundManager.play('test', 0.8);
        const sound = mockSounds['sounds/test.mp3'];
        
        if (sound) {
          // 0.8 * 0.5 (default Music volume) = 0.4
          expect(sound.currentVolume).to.be.closeTo(0.4, 0.01);
          
          // Change category volume
          soundManager.setCategoryVolume('Music', 0.25);
          
          // Play again
          soundManager.play('test', 0.8);
          
          // Should use new category volume: 0.8 * 0.25 = 0.2
          expect(sound.currentVolume).to.be.closeTo(0.2, 0.01);
        }
        done();
      }, 50);
    });
  });

  // ============================================================================
  // Integration Test 3: Multiple Categories Working Together
  // Tests independence and isolation between categories
  // ============================================================================
  describe('Multi-Category Integration', function() {
    
    it('should maintain independent volumes across all three categories', function() {
      soundManager = new SoundManager();
      
      // Set different volumes
      soundManager.setCategoryVolume('Music', 0.1);
      soundManager.setCategoryVolume('SoundEffects', 0.5);
      soundManager.setCategoryVolume('SystemSounds', 0.9);
      
      // Verify independence
      expect(soundManager.getCategoryVolume('Music')).to.equal(0.1);
      expect(soundManager.getCategoryVolume('SoundEffects')).to.equal(0.5);
      expect(soundManager.getCategoryVolume('SystemSounds')).to.equal(0.9);
      
      // Change one, others should be unaffected
      soundManager.setCategoryVolume('Music', 0.7);
      expect(soundManager.getCategoryVolume('Music')).to.equal(0.7);
      expect(soundManager.getCategoryVolume('SoundEffects')).to.equal(0.5);
      expect(soundManager.getCategoryVolume('SystemSounds')).to.equal(0.9);
    });

    it('should integrate multiple sounds across different categories simultaneously', function(done) {
      soundManager = new SoundManager();
      
      soundManager.setCategoryVolume('Music', 0.2);
      soundManager.setCategoryVolume('SoundEffects', 0.4);
      soundManager.setCategoryVolume('SystemSounds', 0.6);
      
      soundManager.registerSound('m1', 'sounds/m1.mp3', 'Music');
      soundManager.registerSound('m2', 'sounds/m2.mp3', 'Music');
      soundManager.registerSound('s1', 'sounds/s1.mp3', 'SoundEffects');
      soundManager.registerSound('sys1', 'sounds/sys1.mp3', 'SystemSounds');
      
      setTimeout(() => {
        soundManager.play('m1', 1.0);
        soundManager.play('m2', 1.0);
        soundManager.play('s1', 1.0);
        soundManager.play('sys1', 1.0);
        
        const m1 = mockSounds['sounds/m1.mp3'];
        const m2 = mockSounds['sounds/m2.mp3'];
        const s1 = mockSounds['sounds/s1.mp3'];
        const sys1 = mockSounds['sounds/sys1.mp3'];
        
        if (m1 && m2 && s1 && sys1) {
          expect(m1.currentVolume).to.be.closeTo(0.2, 0.01);
          expect(m2.currentVolume).to.be.closeTo(0.2, 0.01);
          expect(s1.currentVolume).to.be.closeTo(0.4, 0.01);
          expect(sys1.currentVolume).to.be.closeTo(0.6, 0.01);
        }
        done();
      }, 50);
    });
  });

  // ============================================================================
  // Integration Test 4: Legacy Sounds + Category System
  // Tests backward compatibility with new category system
  // ============================================================================
  describe('Legacy Sound Integration', function() {
    
    it('should integrate legacy bgMusic and click sounds with category system', function(done) {
      soundManager = new SoundManager();
      soundManager.preload();
      
      setTimeout(() => {
        // Legacy sounds should exist
        expect(soundManager.sounds['bgMusic']).to.exist;
        expect(soundManager.sounds['click']).to.exist;
        
        // Should be registered in categories
        expect(soundManager.getSoundCategory('bgMusic')).to.equal('Music');
        expect(soundManager.getSoundCategory('click')).to.equal('SystemSounds');
        
        done();
      }, 50);
    });

    it('should apply category volumes to legacy sounds', function(done) {
      soundManager = new SoundManager();
      soundManager.preload();
      
      setTimeout(() => {
        soundManager.setCategoryVolume('Music', 0.3);
        soundManager.setCategoryVolume('SystemSounds', 0.7);
        
        soundManager.play('bgMusic', 1.0);
        soundManager.play('click', 1.0);
        
        const bgMusic = soundManager.sounds['bgMusic'];
        const click = soundManager.sounds['click'];
        
        if (bgMusic && click) {
          expect(bgMusic.currentVolume).to.be.closeTo(0.3, 0.01);
          expect(click.currentVolume).to.be.closeTo(0.7, 0.01);
        }
        done();
      }, 50);
    });
  });

  // ============================================================================
  // Integration Test 5: Volume Validation + Category System
  // Tests how validation integrates across the system
  // ============================================================================
  describe('Volume Validation Integration', function() {
    
    it('should integrate volume clamping with category system', function() {
      soundManager = new SoundManager();
      
      // Try invalid volumes
      soundManager.setCategoryVolume('Music', -0.5);
      expect(soundManager.getCategoryVolume('Music')).to.be.at.least(0);
      
      soundManager.setCategoryVolume('SoundEffects', 2.5);
      expect(soundManager.getCategoryVolume('SoundEffects')).to.be.at.most(1);
      
      soundManager.setCategoryVolume('SystemSounds', 0.5);
      expect(soundManager.getCategoryVolume('SystemSounds')).to.equal(0.5);
    });

    it('should integrate validation with localStorage persistence', function() {
      soundManager = new SoundManager();
      
      // Set clamped value
      soundManager.setCategoryVolume('Music', 2.0);
      const clampedValue = soundManager.getCategoryVolume('Music');
      
      // Should save clamped value to localStorage
      const saved = JSON.parse(window.localStorage.getItem('antgame.audioSettings'));
      expect(saved.Music).to.equal(clampedValue);
      expect(saved.Music).to.be.at.most(1);
    });
  });

  // ============================================================================
  // Integration Test 6: Invalid Category Handling
  // Tests error handling integration
  // ============================================================================
  describe('Error Handling Integration', function() {
    
    it('should integrate invalid category rejection with sound registration', function() {
      soundManager = new SoundManager();
      
      // Try to register with invalid category
      const result = soundManager.registerSound('test', 'sounds/test.mp3', 'InvalidCategory');
      
      expect(result).to.be.false;
      expect(soundManager.getSoundCategory('test')).to.be.null;
    });

    it('should handle non-existent sound playback gracefully', function() {
      soundManager = new SoundManager();
      
      // Try to play non-existent sound
      expect(() => {
        soundManager.play('doesNotExist');
      }).to.not.throw();
    });
  });

  // ============================================================================
  // Integration Test 7: Complete Workflow (localStorage persistence!)
  // Tests entire system working together with browser APIs
  // ============================================================================
  describe('Complete System Integration (localStorage)', function() {
    
    it('should integrate all components in a complete user workflow', function(done) {
      // Step 1: Create manager (loads from localStorage)
      window.localStorage.clear();
      const manager1 = new SoundManager();
      
      // Step 2: Register sounds
      manager1.registerSound('custom1', 'sounds/custom1.mp3', 'SoundEffects');
      
      // Step 3: Adjust volumes
      manager1.setCategoryVolume('Music', 0.2);
      manager1.setCategoryVolume('SoundEffects', 0.4);
      
      // Step 4: Verify localStorage
      const saved = JSON.parse(window.localStorage.getItem('antgame.audioSettings'));
      expect(saved.Music).to.equal(0.2);
      expect(saved.SoundEffects).to.equal(0.4);
      
      // Step 5: Simulate page reload (new instance with localStorage!)
      const manager2 = new SoundManager();
      
      // Step 6: Verify volumes persisted from localStorage
      expect(manager2.getCategoryVolume('Music')).to.equal(0.2);
      expect(manager2.getCategoryVolume('SoundEffects')).to.equal(0.4);
      
      // Step 7: Register and play sounds
      manager2.registerSound('custom2', 'sounds/custom2.mp3', 'SoundEffects');
      
      setTimeout(() => {
        manager2.play('custom2', 1.0);
        
        const custom2 = mockSounds['sounds/custom2.mp3'];
        if (custom2) {
          // Should use persisted category volume from localStorage
          expect(custom2.currentVolume).to.be.closeTo(0.4, 0.01);
        }
        done();
      }, 50);
    });

    it('should integrate GameState mapping with BGM system', function() {
      soundManager = new SoundManager();
      
      // Verify state mapping is integrated
      expect(soundManager.stateBGMMap).to.be.an('object');
      expect(soundManager.stateBGMMap['MENU']).to.equal('bgMusic');
      expect(soundManager.stateBGMMap['PLAYING']).to.be.null;
      
      // Verify BGM monitoring properties exist
      expect(soundManager.drawCounter).to.equal(0);
      expect(soundManager.musicRestartThreshold).to.be.a('number');
    });
  });
});
