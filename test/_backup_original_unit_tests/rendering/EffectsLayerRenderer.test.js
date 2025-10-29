const { expect } = require('chai');
const path = require('path');

describe('EffectsLayerRenderer', () => {
  let EffectsLayerRenderer;
  
  before(() => {
    // Mock p5.js globals
    global.push = () => {};
    global.pop = () => {};
    global.translate = () => {};
    global.rotate = () => {};
    global.fill = () => {};
    global.noStroke = () => {};
    global.stroke = () => {};
    global.strokeWeight = () => {};
    global.rect = () => {};
    global.circle = () => {};
    global.image = () => {};
    global.width = 800;
    global.height = 600;
    global.performance = {
      now: () => Date.now()
    };
    
    // Load the class
    const effectsPath = path.join(__dirname, '../../../Classes/rendering/EffectsLayerRenderer.js');
    EffectsLayerRenderer = require(effectsPath);
  });
  
  afterEach(() => {
    // Clean up any global instances
    if (typeof window !== 'undefined' && window.EffectsRenderer) {
      delete window.EffectsRenderer;
    }
    if (typeof global !== 'undefined' && global.EffectsRenderer) {
      delete global.EffectsRenderer;
    }
  });
  
  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.config).to.exist;
      expect(renderer.config.enableParticles).to.be.true;
      expect(renderer.config.enableVisualEffects).to.be.true;
      expect(renderer.config.enableAudioEffects).to.be.true;
      expect(renderer.config.maxParticles).to.equal(500);
      expect(renderer.config.particlePoolSize).to.equal(1000);
      expect(renderer.config.enablePerformanceScaling).to.be.true;
    });
    
    it('should initialize particle pools', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.particlePools).to.exist;
      expect(renderer.particlePools.combat).to.be.an('array');
      expect(renderer.particlePools.environment).to.be.an('array');
      expect(renderer.particlePools.interactive).to.be.an('array');
      expect(renderer.particlePools.magical).to.be.an('array');
    });
    
    it('should initialize active effects arrays', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.activeParticleEffects).to.be.an('array').that.is.empty;
      expect(renderer.activeVisualEffects).to.be.an('array').that.is.empty;
      expect(renderer.activeAudioEffects).to.be.an('array').that.is.empty;
    });
    
    it('should initialize selection box state', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.selectionBox).to.exist;
      expect(renderer.selectionBox.active).to.be.false;
      expect(renderer.selectionBox.startX).to.equal(0);
      expect(renderer.selectionBox.startY).to.equal(0);
      expect(renderer.selectionBox.endX).to.equal(0);
      expect(renderer.selectionBox.endY).to.equal(0);
      expect(renderer.selectionBox.color).to.deep.equal([0, 200, 255]);
      expect(renderer.selectionBox.strokeWidth).to.equal(2);
      expect(renderer.selectionBox.fillAlpha).to.equal(30);
      expect(renderer.selectionBox.entities).to.be.an('array').that.is.empty;
    });
    
    it('should initialize effect types registry with Map', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.effectTypes).to.be.instanceOf(Map);
      expect(renderer.effectTypes.size).to.be.greaterThan(0);
    });
    
    it('should register combat effect types', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.effectTypes.has('BLOOD_SPLATTER')).to.be.true;
      expect(renderer.effectTypes.get('BLOOD_SPLATTER')).to.deep.equal({
        type: 'particle',
        category: 'combat',
        duration: 1000
      });
      
      expect(renderer.effectTypes.has('IMPACT_SPARKS')).to.be.true;
      expect(renderer.effectTypes.has('WEAPON_TRAIL')).to.be.true;
    });
    
    it('should register environmental effect types', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.effectTypes.has('DUST_CLOUD')).to.be.true;
      expect(renderer.effectTypes.has('FALLING_LEAVES')).to.be.true;
      expect(renderer.effectTypes.has('WEATHER_RAIN')).to.be.true;
      expect(renderer.effectTypes.get('WEATHER_RAIN').duration).to.equal(-1); // Continuous
    });
    
    it('should register interactive effect types', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.effectTypes.has('SELECTION_SPARKLE')).to.be.true;
      expect(renderer.effectTypes.has('MOVEMENT_TRAIL')).to.be.true;
      expect(renderer.effectTypes.has('GATHERING_SPARKLE')).to.be.true;
      expect(renderer.effectTypes.has('SELECTION_BOX')).to.be.true;
    });
    
    it('should register visual effect types', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.effectTypes.has('SCREEN_SHAKE')).to.be.true;
      expect(renderer.effectTypes.has('FADE_TRANSITION')).to.be.true;
      expect(renderer.effectTypes.has('HIGHLIGHT_GLOW')).to.be.true;
      expect(renderer.effectTypes.has('DAMAGE_FLASH')).to.be.true;
    });
    
    it('should register audio effect types', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.effectTypes.has('COMBAT_SOUND')).to.be.true;
      expect(renderer.effectTypes.has('FOOTSTEP_SOUND')).to.be.true;
      expect(renderer.effectTypes.has('UI_CLICK')).to.be.true;
      expect(renderer.effectTypes.has('AMBIENT_NATURE')).to.be.true;
    });
    
    it('should initialize screen effects state', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.screenEffects.shake).to.deep.equal({
        active: false,
        intensity: 0,
        timeLeft: 0
      });
      
      expect(renderer.screenEffects.fade).to.deep.equal({
        active: false,
        alpha: 0,
        direction: 1,
        timeLeft: 0
      });
      
      expect(renderer.screenEffects.flash).to.deep.equal({
        active: false,
        color: [255, 255, 255],
        alpha: 0,
        timeLeft: 0
      });
    });
    
    it('should initialize performance stats', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.stats).to.exist;
      expect(renderer.stats.activeParticles).to.equal(0);
      expect(renderer.stats.activeVisualEffects).to.equal(0);
      expect(renderer.stats.activeAudioEffects).to.equal(0);
      expect(renderer.stats.lastRenderTime).to.equal(0);
      expect(renderer.stats.poolHits).to.equal(0);
      expect(renderer.stats.poolMisses).to.equal(0);
    });
  });
  
  describe('Particle Effect Creation', () => {
    it('should create blood splatter effect', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('BLOOD_SPLATTER', { x: 100, y: 200, particleCount: 5 });
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('BLOOD_SPLATTER');
      expect(effect.category).to.equal('combat');
      expect(effect.x).to.equal(100);
      expect(effect.y).to.equal(200);
      expect(effect.particles).to.be.an('array').with.lengthOf(5);
    });
    
    it('should create impact sparks effect', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('IMPACT_SPARKS', { x: 150, y: 250, particleCount: 8 });
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('IMPACT_SPARKS');
      expect(effect.particles).to.be.an('array').with.lengthOf(8);
    });
    
    it('should create dust cloud effect', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('DUST_CLOUD', { x: 200, y: 300 });
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('DUST_CLOUD');
      expect(effect.category).to.equal('environment');
    });
    
    it('should create selection sparkle effect', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('SELECTION_SPARKLE', { x: 250, y: 350, particleCount: 10 });
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('SELECTION_SPARKLE');
      expect(effect.category).to.equal('interactive');
      expect(effect.particles).to.have.lengthOf(10);
    });
    
    it('should use default particle count if not specified', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('IMPACT_SPARKS', { x: 100, y: 100 });
      
      expect(effect.particles).to.be.an('array').with.length.greaterThan(0);
    });
    
    it('should set effect position correctly', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('DUST_CLOUD', { x: 123, y: 456 });
      
      expect(effect.x).to.equal(123);
      expect(effect.y).to.equal(456);
      expect(effect.centerX).to.equal(123);
      expect(effect.centerY).to.equal(456);
    });
    
    it('should apply custom particle color', () => {
      const renderer = new EffectsLayerRenderer();
      const customColor = [255, 0, 255];
      const effect = renderer.addEffect('BLOOD_SPLATTER', { 
        x: 100, y: 100, 
        color: customColor,
        particleCount: 3
      });
      
      expect(effect.particles[0].color).to.deep.equal(customColor);
    });
    
    it('should add effect to active list', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('IMPACT_SPARKS', { x: 100, y: 100 });
      
      expect(renderer.activeParticleEffects).to.include(effect);
    });
    
    it('should warn on unknown effect type', () => {
      const renderer = new EffectsLayerRenderer();
      const consoleWarn = console.warn;
      let warnMessage = null;
      console.warn = (msg) => { warnMessage = msg; };
      
      const result = renderer.addEffect('UNKNOWN_EFFECT', {});
      
      console.warn = consoleWarn;
      expect(warnMessage).to.include('Unknown effect type');
      expect(result).to.be.null;
    });
  });
  
  describe('Visual Effect Creation', () => {
    it('should create screen shake effect', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addEffect('SCREEN_SHAKE', { intensity: 10 });
      
      expect(renderer.screenEffects.shake.active).to.be.true;
      expect(renderer.screenEffects.shake.intensity).to.equal(10);
      expect(renderer.screenEffects.shake.timeLeft).to.equal(300);
    });
    
    it('should use default intensity for screen shake', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addEffect('SCREEN_SHAKE', {});
      
      expect(renderer.screenEffects.shake.intensity).to.equal(5);
    });
    
    it('should create fade transition effect', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addEffect('FADE_TRANSITION', { direction: -1 });
      
      expect(renderer.screenEffects.fade.active).to.be.true;
      expect(renderer.screenEffects.fade.direction).to.equal(-1);
      expect(renderer.screenEffects.fade.timeLeft).to.equal(1000);
    });
    
    it('should create damage flash effect', () => {
      const renderer = new EffectsLayerRenderer();
      const flashColor = [255, 100, 100];
      renderer.addEffect('DAMAGE_FLASH', { color: flashColor });
      
      expect(renderer.screenEffects.flash.active).to.be.true;
      expect(renderer.screenEffects.flash.color).to.deep.equal(flashColor);
      expect(renderer.screenEffects.flash.timeLeft).to.equal(150);
    });
    
    it('should use default flash color', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addEffect('DAMAGE_FLASH', {});
      
      expect(renderer.screenEffects.flash.color).to.deep.equal([255, 0, 0]);
    });
  });
  
  describe('Audio Effect Creation', () => {
    it('should create audio effect', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('COMBAT_SOUND', { volume: 0.8, position: { x: 100, y: 100 } });
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('COMBAT_SOUND');
      expect(effect.volume).to.equal(0.8);
      expect(effect.position).to.deep.equal({ x: 100, y: 100 });
    });
    
    it('should use default audio volume', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('UI_CLICK', {});
      
      expect(effect.volume).to.equal(1.0);
    });
    
    it('should add audio effect to active list', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addEffect('FOOTSTEP_SOUND', {});
      
      expect(renderer.activeAudioEffects).to.have.lengthOf(1);
    });
  });
  
  describe('Particle Update Methods', () => {
    it('should update blood splatter particles', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'BLOOD_SPLATTER',
        timeLeft: 500,
        particles: [
          { x: 100, y: 100, velocityX: 2, velocityY: -3, alpha: 255, size: 5 }
        ]
      };
      
      const result = renderer.updateParticleEffect(effect);
      
      expect(result).to.be.true;
      expect(effect.timeLeft).to.equal(484); // Reduced by ~16ms
      expect(effect.particles[0].x).to.equal(102); // Moved by velocityX
      expect(effect.particles[0].y).to.be.lessThan(100); // velocityY = -3, gravity adds 0.2, so y decreases (particle moves up initially)
    });
    
    it('should update impact sparks particles', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'IMPACT_SPARKS',
        timeLeft: 300,
        particles: [
          { x: 100, y: 100, velocityX: 5, velocityY: 5, size: 10 }
        ]
      };
      
      const initialSize = effect.particles[0].size;
      renderer.updateParticleEffect(effect);
      
      expect(effect.particles[0].size).to.be.lessThan(initialSize); // Shrinking
    });
    
    it('should update dust cloud particles', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'DUST_CLOUD',
        timeLeft: 1500,
        particles: [
          { x: 100, y: 100, velocityX: 1, velocityY: 1, alpha: 100, size: 5 }
        ]
      };
      
      const initialSize = effect.particles[0].size;
      renderer.updateParticleEffect(effect);
      
      expect(effect.particles[0].size).to.be.greaterThan(initialSize); // Expanding
      expect(effect.particles[0].alpha).to.be.lessThan(100); // Fading
    });
    
    it('should remove dead particles', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'BLOOD_SPLATTER',
        timeLeft: 500,
        particles: [
          { x: 100, y: 100, velocityX: 0, velocityY: 0, alpha: 1, size: 5 } // alpha=1, after -=2 becomes -1 (dead)
        ]
      };
      
      renderer.updateParticleEffect(effect);
      
      // Alpha should drop below 0, marking particle as dead
      expect(effect.particles).to.have.lengthOf(0);
    });
    
    it('should return false when effect expires', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'IMPACT_SPARKS',
        timeLeft: 0,
        particles: []
      };
      
      const result = renderer.updateParticleEffect(effect);
      
      expect(result).to.be.false;
    });
    
    it('should update selection sparkle particles with orbital motion', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'SELECTION_SPARKLE',
        timeLeft: 1000,
        centerX: 100,
        centerY: 100,
        particles: [
          { angle: 0, radius: 20, radiusGrowth: 0.5, alpha: 255, x: 120, y: 100 }
        ]
      };
      
      const initialAngle = effect.particles[0].angle;
      const initialRadius = effect.particles[0].radius;
      renderer.updateParticleEffect(effect);
      
      expect(effect.particles[0].angle).to.be.greaterThan(initialAngle);
      expect(effect.particles[0].radius).to.be.greaterThan(initialRadius);
    });
    
    it('should update gathering sparkle with spiral inward motion', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'GATHERING_SPARKLE',
        timeLeft: 500,
        centerX: 100,
        centerY: 100,
        particles: [
          { angle: 0, radius: 50, x: 150, y: 100 }
        ]
      };
      
      const initialRadius = effect.particles[0].radius;
      renderer.updateParticleEffect(effect);
      
      expect(effect.particles[0].radius).to.be.lessThan(initialRadius); // Spiraling inward
    });
    
    it('should use generic particle update for unknown types', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'CUSTOM_EFFECT',
        timeLeft: 500,
        particles: [
          { x: 100, y: 100, velocityX: 1, velocityY: 1, alpha: 255, fadeRate: 2 }
        ]
      };
      
      const initialAlpha = effect.particles[0].alpha;
      renderer.updateParticleEffect(effect);
      
      expect(effect.particles[0].alpha).to.be.lessThan(initialAlpha);
    });
  });
  
  describe('Visual Effect Updates', () => {
    it('should update screen shake', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.screenEffects.shake = { active: true, intensity: 10, timeLeft: 100 };
      
      renderer.updateVisualEffects();
      
      expect(renderer.screenEffects.shake.timeLeft).to.equal(84); // Reduced by ~16ms
    });
    
    it('should deactivate screen shake when expired', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.screenEffects.shake = { active: true, intensity: 10, timeLeft: 10 };
      
      renderer.updateVisualEffects();
      
      expect(renderer.screenEffects.shake.active).to.be.false;
      expect(renderer.screenEffects.shake.intensity).to.equal(0);
    });
    
    it('should update screen fade alpha', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.screenEffects.fade = { active: true, direction: 1, timeLeft: 500, alpha: 0 };
      
      renderer.updateVisualEffects();
      
      expect(renderer.screenEffects.fade.alpha).to.be.greaterThan(0);
    });
    
    it('should deactivate screen fade when expired', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.screenEffects.fade = { active: true, direction: 1, timeLeft: 10, alpha: 0 };
      
      renderer.updateVisualEffects();
      
      expect(renderer.screenEffects.fade.active).to.be.false;
    });
    
    it('should update screen flash alpha', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.screenEffects.flash = { active: true, color: [255, 0, 0], timeLeft: 150, alpha: 100 };
      
      renderer.updateVisualEffects();
      
      expect(renderer.screenEffects.flash.timeLeft).to.be.lessThan(150);
    });
    
    it('should track active visual effects count', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.screenEffects.shake = { active: true, intensity: 5, timeLeft: 100 };
      renderer.screenEffects.fade = { active: true, direction: 1, timeLeft: 500, alpha: 0 };
      
      renderer.updateVisualEffects();
      
      expect(renderer.stats.activeVisualEffects).to.equal(2);
    });
  });
  
  describe('Audio Effect Updates', () => {
    it('should update audio effects time', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.activeAudioEffects.push({
        effectType: 'COMBAT_SOUND',
        timeLeft: 300,
        sound: null
      });
      
      renderer.updateAudioEffects();
      
      expect(renderer.activeAudioEffects[0].timeLeft).to.equal(284);
    });
    
    it('should remove expired audio effects', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.activeAudioEffects.push({
        effectType: 'UI_CLICK',
        timeLeft: 10,
        sound: { stop: () => {} }
      });
      
      renderer.updateAudioEffects();
      
      expect(renderer.activeAudioEffects).to.have.lengthOf(0);
    });
    
    it('should track active audio effects count', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.activeAudioEffects.push(
        { effectType: 'COMBAT_SOUND', timeLeft: 300 },
        { effectType: 'FOOTSTEP_SOUND', timeLeft: 150 }
      );
      
      renderer.updateAudioEffects();
      
      expect(renderer.stats.activeAudioEffects).to.equal(2);
    });
  });
  
  describe('Particle Pooling System', () => {
    it('should get particle from pool when available', () => {
      const renderer = new EffectsLayerRenderer();
      const pooledEffect = { particles: [], timeLeft: 0 };
      renderer.particlePools.combat.push(pooledEffect);
      
      const result = renderer.getParticleFromPool('combat');
      
      expect(result).to.equal(pooledEffect);
      expect(renderer.stats.poolHits).to.equal(1);
      expect(renderer.particlePools.combat).to.have.lengthOf(0);
    });
    
    it('should return null when pool is empty', () => {
      const renderer = new EffectsLayerRenderer();
      
      const result = renderer.getParticleFromPool('combat');
      
      expect(result).to.be.null;
      expect(renderer.stats.poolMisses).to.equal(1);
    });
    
    it('should return particle to pool', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        category: 'interactive',
        particles: [{ x: 100 }],
        timeLeft: 500
      };
      
      renderer.returnParticleToPool(effect);
      
      expect(renderer.particlePools.interactive).to.have.lengthOf(1);
      expect(effect.particles).to.be.empty;
      expect(effect.timeLeft).to.equal(0);
    });
    
    it('should create new pool category if needed', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        category: 'newCategory',
        particles: [],
        timeLeft: 0
      };
      
      renderer.returnParticleToPool(effect);
      
      expect(renderer.particlePools.newCategory).to.exist;
    });
    
    it('should create new particle effect when pool empty', () => {
      const renderer = new EffectsLayerRenderer();
      
      const newEffect = renderer.createNewParticleEffect();
      
      expect(newEffect).to.exist;
      expect(newEffect.effectType).to.be.null;
      expect(newEffect.particles).to.be.an('array').that.is.empty;
      expect(newEffect.timeLeft).to.equal(0);
    });
  });
  
  describe('Selection Box System', () => {
    it('should start selection box', () => {
      const renderer = new EffectsLayerRenderer();
      
      renderer.startSelectionBox(100, 150);
      
      expect(renderer.selectionBox.active).to.be.true;
      expect(renderer.selectionBox.startX).to.equal(100);
      expect(renderer.selectionBox.startY).to.equal(150);
      expect(renderer.selectionBox.endX).to.equal(100);
      expect(renderer.selectionBox.endY).to.equal(150);
    });
    
    it('should apply custom selection box styling', () => {
      const renderer = new EffectsLayerRenderer();
      const customColor = [255, 0, 0];
      
      renderer.startSelectionBox(100, 100, {
        color: customColor,
        strokeWidth: 4,
        fillAlpha: 50
      });
      
      expect(renderer.selectionBox.color).to.deep.equal(customColor);
      expect(renderer.selectionBox.strokeWidth).to.equal(4);
      expect(renderer.selectionBox.fillAlpha).to.equal(50);
    });
    
    it('should call onStart callback when starting selection', () => {
      const renderer = new EffectsLayerRenderer();
      let callbackCalled = false;
      let callbackX, callbackY;
      
      renderer.startSelectionBox(100, 150, {
        onStart: (x, y) => {
          callbackCalled = true;
          callbackX = x;
          callbackY = y;
        }
      });
      
      expect(callbackCalled).to.be.true;
      expect(callbackX).to.equal(100);
      expect(callbackY).to.equal(150);
    });
    
    it('should update selection box end position', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.startSelectionBox(100, 100);
      
      renderer.updateSelectionBox(200, 250);
      
      expect(renderer.selectionBox.endX).to.equal(200);
      expect(renderer.selectionBox.endY).to.equal(250);
    });
    
    it('should call onUpdate callback when updating selection', () => {
      const renderer = new EffectsLayerRenderer();
      let callbackCalled = false;
      
      renderer.startSelectionBox(100, 100, {
        onUpdate: (bounds, entities) => {
          callbackCalled = true;
        }
      });
      
      renderer.updateSelectionBox(200, 200);
      
      expect(callbackCalled).to.be.true;
    });
    
    it('should not update if selection is not active', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.selectionBox.active = false;
      
      renderer.updateSelectionBox(200, 200);
      
      expect(renderer.selectionBox.endX).to.equal(0);
    });
    
    it('should end selection box and return entities', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.startSelectionBox(100, 100);
      renderer.selectionBox.entities = [{ id: 1 }, { id: 2 }];
      
      const result = renderer.endSelectionBox();
      
      expect(result).to.deep.equal([{ id: 1 }, { id: 2 }]);
      expect(renderer.selectionBox.active).to.be.false;
      expect(renderer.selectionBox.entities).to.be.empty;
    });
    
    it('should call onEnd callback when ending selection', () => {
      const renderer = new EffectsLayerRenderer();
      let callbackCalled = false;
      
      renderer.startSelectionBox(100, 100, {
        onEnd: (bounds, entities) => {
          callbackCalled = true;
        }
      });
      
      renderer.endSelectionBox();
      
      expect(callbackCalled).to.be.true;
    });
    
    it('should return empty array if selection not active', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.selectionBox.active = false;
      
      const result = renderer.endSelectionBox();
      
      expect(result).to.be.an('array').that.is.empty;
    });
    
    it('should cancel selection box without callbacks', () => {
      const renderer = new EffectsLayerRenderer();
      let callbackCalled = false;
      
      renderer.startSelectionBox(100, 100, {
        onEnd: () => { callbackCalled = true; }
      });
      
      renderer.cancelSelectionBox();
      
      expect(callbackCalled).to.be.false;
      expect(renderer.selectionBox.active).to.be.false;
    });
    
    it('should get selection box bounds', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.startSelectionBox(100, 100);
      renderer.updateSelectionBox(200, 250);
      
      const bounds = renderer.getSelectionBoxBounds();
      
      expect(bounds.x1).to.equal(100);
      expect(bounds.y1).to.equal(100);
      expect(bounds.x2).to.equal(200);
      expect(bounds.y2).to.equal(250);
      expect(bounds.width).to.equal(100);
      expect(bounds.height).to.equal(150);
      expect(bounds.area).to.equal(15000);
    });
    
    it('should return null bounds if selection not active', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.selectionBox.active = false;
      
      const bounds = renderer.getSelectionBoxBounds();
      
      expect(bounds).to.be.null;
    });
    
    it('should set entity list for selection detection', () => {
      const renderer = new EffectsLayerRenderer();
      const entities = [{ id: 1 }, { id: 2 }];
      
      renderer.setSelectionEntities(entities);
      
      expect(renderer.selectionBox.entityList).to.deep.equal(entities);
    });
    
    it('should detect entity in selection box', () => {
      const renderer = new EffectsLayerRenderer();
      const entity = { x: 150, y: 150, width: 20, height: 20 };
      const bounds = { x1: 100, y1: 100, x2: 200, y2: 200 };
      
      const result = renderer.isEntityInSelectionBox(entity, bounds);
      
      expect(result).to.be.true;
    });
    
    it('should detect entity outside selection box', () => {
      const renderer = new EffectsLayerRenderer();
      const entity = { x: 300, y: 300, width: 20, height: 20 };
      const bounds = { x1: 100, y1: 100, x2: 200, y2: 200 };
      
      const result = renderer.isEntityInSelectionBox(entity, bounds);
      
      expect(result).to.be.false;
    });
    
    it('should chain selection box methods', () => {
      const renderer = new EffectsLayerRenderer();
      
      const result = renderer.startSelectionBox(100, 100)
        .updateSelectionBox(200, 200)
        .cancelSelectionBox();
      
      expect(result).to.equal(renderer);
    });
  });
  
  describe('Convenience Methods', () => {
    it('should create blood splatter with convenience method', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.bloodSplatter(100, 200, { particleCount: 5 });
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('BLOOD_SPLATTER');
    });
    
    it('should create impact sparks with convenience method', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.impactSparks(100, 200);
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('IMPACT_SPARKS');
    });
    
    it('should create dust cloud with convenience method', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.dustCloud(100, 200);
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('DUST_CLOUD');
    });
    
    it('should create screen shake with convenience method', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.screenShake(10);
      
      expect(renderer.screenEffects.shake.active).to.be.true;
      expect(renderer.screenEffects.shake.intensity).to.equal(10);
    });
    
    it('should create damage flash with convenience method', () => {
      const renderer = new EffectsLayerRenderer();
      const color = [255, 0, 0];
      renderer.damageFlash(color);
      
      expect(renderer.screenEffects.flash.active).to.be.true;
      expect(renderer.screenEffects.flash.color).to.deep.equal(color);
    });
    
    it('should create fade transition with convenience method', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.fadeTransition(-1);
      
      expect(renderer.screenEffects.fade.active).to.be.true;
      expect(renderer.screenEffects.fade.direction).to.equal(-1);
    });
    
    it('should create flash effect with backwards compatibility', () => {
      const renderer = new EffectsLayerRenderer();
      const result = renderer.flash(100, 200, { count: 5 });
      
      expect(result).to.be.true;
    });
    
    it('should spawn particle burst', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.spawnParticleBurst(100, 200, { count: 8 });
      
      expect(effect).to.exist;
      expect(effect.particles).to.have.lengthOf(8);
    });
  });
  
  describe('Visual Effect Helpers', () => {
    it('should add visual effect with screen shake type', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addVisualEffect({ type: 'screen_shake', intensity: 8, duration: 500 });
      
      expect(renderer.screenEffects.shake.active).to.be.true;
      expect(renderer.screenEffects.shake.intensity).to.equal(8);
    });
    
    it('should add visual effect with screen flash type', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addVisualEffect({ type: 'screen_flash', color: [255, 255, 0], duration: 200 });
      
      expect(renderer.screenEffects.flash.active).to.be.true;
      expect(renderer.screenEffects.flash.color).to.deep.equal([255, 255, 0]);
    });
    
    it('should add custom visual effect to active list', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addVisualEffect({ type: 'custom', duration: 1000 });
      
      expect(renderer.activeVisualEffects).to.have.lengthOf(1);
    });
    
    it('should generate unique ID for visual effects', () => {
      const renderer = new EffectsLayerRenderer();
      const id1 = renderer.addVisualEffect({ type: 'custom' });
      const id2 = renderer.addVisualEffect({ type: 'custom' });
      
      expect(id1).to.not.equal(id2);
    });
  });
  
  describe('Configuration and Stats', () => {
    it('should update configuration', () => {
      const renderer = new EffectsLayerRenderer();
      
      renderer.updateConfig({ maxParticles: 1000, enableParticles: false });
      
      expect(renderer.config.maxParticles).to.equal(1000);
      expect(renderer.config.enableParticles).to.be.false;
    });
    
    it('should get stats copy', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.stats.activeParticles = 50;
      
      const stats = renderer.getStats();
      
      expect(stats.activeParticles).to.equal(50);
      stats.activeParticles = 100; // Modify copy
      expect(renderer.stats.activeParticles).to.equal(50); // Original unchanged
    });
    
    it('should get active particles count', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.activeParticleEffects = [
        { particles: [1, 2, 3] },
        { particles: [4, 5] }
      ];
      
      const count = renderer.getActiveParticlesCount();
      
      expect(count).to.equal(5);
    });
    
    it('should get active effects summary', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.activeParticleEffects = [{}];
      renderer.activeVisualEffects = [{}, {}];
      renderer.screenEffects.shake.active = true;
      
      const summary = renderer.getActiveEffectsSummary();
      
      expect(summary.particleEffects).to.equal(1);
      expect(summary.visualEffects).to.equal(2);
      expect(summary.screenEffects.shake).to.be.true;
    });
    
    it('should get configuration copy', () => {
      const renderer = new EffectsLayerRenderer();
      
      const config = renderer.getConfig();
      
      expect(config.enableParticles).to.be.true;
      config.enableParticles = false;
      expect(renderer.config.enableParticles).to.be.true; // Original unchanged
    });
    
    it('should set and return new configuration', () => {
      const renderer = new EffectsLayerRenderer();
      
      const newConfig = renderer.setConfig({ maxParticles: 750 });
      
      expect(newConfig.maxParticles).to.equal(750);
      expect(renderer.config.maxParticles).to.equal(750);
    });
    
    it('should toggle particles enabled', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.config.enableParticles = true;
      
      const result = renderer.toggleParticles();
      
      expect(result).to.be.false;
      expect(renderer.config.enableParticles).to.be.false;
    });
    
    it('should toggle particles with explicit parameter', () => {
      const renderer = new EffectsLayerRenderer();
      
      renderer.toggleParticles(true);
      
      expect(renderer.config.enableParticles).to.be.true;
    });
    
    it('should clear all effects', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.activeParticleEffects = [{}];
      renderer.activeVisualEffects = [{}];
      renderer.activeAudioEffects = [{}];
      renderer.screenEffects.shake.active = true;
      
      renderer.clearAllEffects();
      
      expect(renderer.activeParticleEffects).to.be.empty;
      expect(renderer.activeVisualEffects).to.be.empty;
      expect(renderer.activeAudioEffects).to.be.empty;
      expect(renderer.screenEffects.shake.active).to.be.false;
    });
  });
  
  describe('Main Render Method', () => {
    it('should track render time', () => {
      const renderer = new EffectsLayerRenderer();
      
      renderer.renderEffects('PLAYING');
      
      expect(renderer.stats.lastRenderTime).to.be.a('number');
      expect(renderer.stats.lastRenderTime).to.be.at.least(0);
    });
    
    it('should skip particles if disabled', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.config.enableParticles = false;
      renderer.activeParticleEffects = [
        { effectType: 'IMPACT_SPARKS', timeLeft: 500, particles: [{}] }
      ];
      
      renderer.renderEffects('PLAYING');
      
      // Particles not updated, so active effects remain
      expect(renderer.activeParticleEffects).to.have.lengthOf(1);
    });
    
    it('should skip visual effects if disabled', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.config.enableVisualEffects = false;
      renderer.screenEffects.shake = { active: true, intensity: 5, timeLeft: 100 };
      
      renderer.renderEffects('PLAYING');
      
      // Visual effects not updated
      expect(renderer.screenEffects.shake.timeLeft).to.equal(100);
    });
    
    it('should skip audio effects if disabled', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.config.enableAudioEffects = false;
      renderer.activeAudioEffects = [{ timeLeft: 100 }];
      
      renderer.renderEffects('PLAYING');
      
      // Audio effects not updated
      expect(renderer.activeAudioEffects[0].timeLeft).to.equal(100);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle null particle pools gracefully', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.particlePools = null;
      
      expect(() => renderer.getParticleFromPool('combat')).to.throw;
    });
    
    it('should handle empty effect type in particle update', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: null,
        timeLeft: 100,
        particles: [{ x: 100, y: 100, alpha: 255 }]
      };
      
      const result = renderer.updateParticleEffect(effect);
      
      expect(result).to.be.true; // Falls back to generic update
    });
    
    it('should handle missing entity properties in selection detection', () => {
      const renderer = new EffectsLayerRenderer();
      const entity = {}; // No position or size
      const bounds = { x1: 100, y1: 100, x2: 200, y2: 200 };
      
      const result = renderer.isEntityInSelectionBox(entity, bounds);
      
      expect(result).to.not.throw;
    });
    
    it('should handle very large particle counts', () => {
      const renderer = new EffectsLayerRenderer();
      
      const effect = renderer.addEffect('IMPACT_SPARKS', { 
        x: 100, 
        y: 100, 
        particleCount: 1000 
      });
      
      expect(effect.particles).to.have.lengthOf(1000);
    });
    
    it('should handle negative coordinates', () => {
      const renderer = new EffectsLayerRenderer();
      
      const effect = renderer.addEffect('DUST_CLOUD', { x: -100, y: -200 });
      
      expect(effect.x).to.equal(-100);
      expect(effect.y).to.equal(-200);
    });
    
    it('should handle zero duration effects', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'IMPACT_SPARKS',
        timeLeft: 0,
        particles: [{}]
      };
      
      const result = renderer.updateParticleEffect(effect);
      
      expect(result).to.be.false;
    });
  });
  
  describe('Integration Scenarios', () => {
    it('should handle full particle lifecycle', () => {
      const renderer = new EffectsLayerRenderer();
      
      // Create effect
      const effect = renderer.addEffect('BLOOD_SPLATTER', { x: 100, y: 100, particleCount: 3 });
      expect(renderer.activeParticleEffects).to.have.lengthOf(1);
      
      // Update effect multiple times
      for (let i = 0; i < 100; i++) {
        renderer.updateParticleEffects();
      }
      
      // Effect should expire and be returned to pool
      expect(renderer.activeParticleEffects).to.have.lengthOf(0);
    });
    
    it('should manage multiple concurrent effects', () => {
      const renderer = new EffectsLayerRenderer();
      
      renderer.addEffect('IMPACT_SPARKS', { x: 100, y: 100 });
      renderer.addEffect('DUST_CLOUD', { x: 200, y: 200 });
      renderer.addEffect('SCREEN_SHAKE', { intensity: 5 });
      renderer.addEffect('COMBAT_SOUND', {});
      
      expect(renderer.activeParticleEffects.length).to.be.greaterThan(0);
      expect(renderer.screenEffects.shake.active).to.be.true;
      expect(renderer.activeAudioEffects.length).to.be.greaterThan(0);
    });
    
    it('should handle full selection box workflow', () => {
      const renderer = new EffectsLayerRenderer();
      const entities = [
        { x: 150, y: 150, width: 20, height: 20 },
        { x: 300, y: 300, width: 20, height: 20 }
      ];
      
      renderer.setSelectionEntities(entities);
      renderer.startSelectionBox(100, 100);
      renderer.updateSelectionBox(200, 200);
      
      const bounds = renderer.getSelectionBoxBounds();
      expect(bounds.width).to.equal(100);
      
      const selected = renderer.endSelectionBox();
      expect(selected).to.be.an('array');
    });
  });
});
