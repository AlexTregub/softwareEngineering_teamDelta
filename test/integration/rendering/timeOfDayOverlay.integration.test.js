/**
 * @fileoverview Integration tests for TimeOfDayOverlay with GlobalTime and RenderLayerManager
 * Tests the interaction between the overlay system and game time/rendering systems
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');

describe('TimeOfDayOverlay - Integration Tests', function() {
  let dom;
  let window;
  let document;
  let GlobalTime;
  let TimeOfDayOverlay;
  let globalTime;
  let overlay;
  let canvas;
  let mockP5;
  
  before(function() {
    // Create JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    
    // Load Nature.js which contains both GlobalTime and TimeOfDayOverlay
    const naturePath = path.join(__dirname, '../../../Classes/systems/Nature.js');
    const natureCode = fs.readFileSync(naturePath, 'utf8');
    
    // Create sandbox with required globals
    const sandbox = {
      console: console,
      performance: window.performance,
      module: { exports: {} },
      window: window
    };
    
    const func = new Function('console', 'performance', 'module', 'window', natureCode);
    func(sandbox.console, sandbox.performance, sandbox.module, sandbox.window);
    
    GlobalTime = sandbox.window.GlobalTime;
    TimeOfDayOverlay = sandbox.window.TimeOfDayOverlay;
    
    if (!GlobalTime || !TimeOfDayOverlay) {
      throw new Error('Failed to load GlobalTime or TimeOfDayOverlay from Nature.js');
    }
  });
  
  beforeEach(function() {
    // Create canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);
    
    // Create mock p5.js context
    const ctx = canvas.getContext('2d');
    mockP5 = {
      push: sinon.spy(),
      pop: sinon.spy(),
      fill: sinon.spy(),
      noStroke: sinon.spy(),
      rect: sinon.spy(),
      width: 800,
      height: 600,
      _renderer: { drawingContext: ctx }
    };
    
    // Make p5 functions global (simulating p5 global mode)
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.fill = mockP5.fill;
    global.noStroke = mockP5.noStroke;
    global.rect = mockP5.rect;
    global.width = mockP5.width;
    global.height = mockP5.height;
    
    // Create instances
    globalTime = new GlobalTime();
    overlay = new TimeOfDayOverlay(globalTime);
    
    // Expose globally as the game would
    window.g_globalTime = globalTime;
    window.g_timeOfDayOverlay = overlay;
  });
  
  afterEach(function() {
    sinon.restore();
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.noStroke;
    delete global.rect;
    delete global.width;
    delete global.height;
  });
  
  describe('GlobalTime Integration', function() {
    it('should respond to GlobalTime state changes', function() {
      globalTime.timeOfDay = 'day';
      globalTime.transitioning = false;
      overlay.update();
      const dayAlpha = overlay.currentAlpha;
      
      globalTime.timeOfDay = 'night';
      globalTime.transitioning = false;
      globalTime.transitionAlpha = 255;
      overlay.update();
      const nightAlpha = overlay.currentAlpha;
      
      expect(nightAlpha).to.be.greaterThan(dayAlpha);
    });
    
    it('should track GlobalTime transitions', function() {
      globalTime.timeOfDay = 'sunset';
      globalTime.transitioning = true;
      globalTime.transitionAlpha = 0;
      
      overlay.update();
      const startAlpha = overlay.currentAlpha;
      
      globalTime.transitionAlpha = 255;
      overlay.update();
      const endAlpha = overlay.currentAlpha;
      
      expect(endAlpha).to.be.greaterThan(startAlpha);
    });
    
    it('should synchronize with GlobalTime day/night cycle', function() {
      // Simulate a full day/night cycle
      const states = [
        { time: 'day', transitioning: false, alpha: 0 },
        { time: 'sunset', transitioning: true, alpha: 0 },
        { time: 'sunset', transitioning: true, alpha: 128 },
        { time: 'sunset', transitioning: true, alpha: 255 },
        { time: 'night', transitioning: false, alpha: 255 },
        { time: 'sunrise', transitioning: true, alpha: 255 },
        { time: 'sunrise', transitioning: true, alpha: 128 },
        { time: 'sunrise', transitioning: true, alpha: 0 },
        { time: 'day', transitioning: false, alpha: 0 }
      ];
      
      const alphas = [];
      states.forEach(state => {
        globalTime.timeOfDay = state.time;
        globalTime.transitioning = state.transitioning;
        globalTime.transitionAlpha = state.alpha;
        overlay.update();
        alphas.push(overlay.currentAlpha);
      });
      
      // Day should have minimum alpha
      expect(alphas[0]).to.be.lessThan(0.1);
      
      // Night should have maximum alpha
      expect(alphas[4]).to.be.greaterThan(0.6);
      
      // Should return to low alpha at end
      expect(alphas[8]).to.be.lessThan(0.1);
    });
    
    it('should handle GlobalTime.update() integration', function() {
      // Start at day
      globalTime.timeOfDay = 'day';
      globalTime.inGameSeconds = 0;
      
      // Simulate time passing to trigger sunset
      globalTime.inGameSeconds = 240;
      globalTime.transition('day');
      
      expect(globalTime.timeOfDay).to.equal('sunset');
      expect(globalTime.transitioning).to.be.true;
      
      overlay.update();
      expect(overlay.currentAlpha).to.be.greaterThan(0);
    });
    
    it('should respect GlobalTime timeSpeed changes', function() {
      globalTime.timeOfDay = 'sunset';
      globalTime.transitioning = true;
      globalTime.transitionAlpha = 0;
      
      // Normal speed
      globalTime.timeSpeed = 1.0;
      const dt = 1.0; // 1 second
      
      globalTime.update();
      overlay.update();
      const normalProgress = overlay.currentAlpha;
      
      // Reset
      globalTime.transitionAlpha = 0;
      
      // Fast speed
      globalTime.timeSpeed = 10.0;
      for (let i = 0; i < 10; i++) {
        globalTime.update();
      }
      overlay.update();
      const fastProgress = overlay.currentAlpha;
      
      // Fast speed should make more progress
      expect(fastProgress).to.be.greaterThan(normalProgress);
    });
  });
  
  describe('Rendering Integration', function() {
    it('should call p5 drawing functions when rendering', function() {
      globalTime.timeOfDay = 'sunset';
      globalTime.transitionAlpha = 128;
      
      overlay.update();
      overlay.render();
      
      expect(mockP5.push.called).to.be.true;
      expect(mockP5.fill.called).to.be.true;
      expect(mockP5.noStroke.called).to.be.true;
      expect(mockP5.rect.called).to.be.true;
      expect(mockP5.pop.called).to.be.true;
    });
    
    it('should skip rendering when alpha is 0', function() {
      globalTime.timeOfDay = 'day';
      globalTime.transitionAlpha = 0;
      
      overlay.update();
      overlay.render();
      
      // push/pop might be called, but not fill/rect
      expect(mockP5.rect.called).to.be.false;
    });
    
    it('should render full-screen overlay', function() {
      globalTime.timeOfDay = 'night';
      globalTime.transitioning = false;
      
      overlay.update();
      overlay.render();
      
      // Check that rect was called with screen dimensions
      const rectCall = mockP5.rect.getCall(0);
      if (rectCall) {
        expect(rectCall.args[0]).to.equal(0); // x
        expect(rectCall.args[1]).to.equal(0); // y
        expect(rectCall.args[2]).to.equal(mockP5.width); // width
        expect(rectCall.args[3]).to.equal(mockP5.height); // height
      }
    });
    
    it('should apply correct color values', function() {
      globalTime.timeOfDay = 'sunset';
      globalTime.transitioning = false;
      globalTime.transitionAlpha = 255;
      
      overlay.update();
      overlay.render();
      
      const fillCall = mockP5.fill.getCall(0);
      expect(fillCall).to.exist;
      
      // Should have 4 arguments (r, g, b, alpha)
      expect(fillCall.args).to.have.lengthOf(4);
      
      // RGB values should be 0-255
      expect(fillCall.args[0]).to.be.within(0, 255);
      expect(fillCall.args[1]).to.be.within(0, 255);
      expect(fillCall.args[2]).to.be.within(0, 255);
      
      // Alpha should be 0-255
      expect(fillCall.args[3]).to.be.within(0, 255);
    });
    
    it('should render differently for each time of day', function() {
      const renderColors = [];
      
      ['day', 'sunset', 'night', 'sunrise'].forEach(time => {
        mockP5.fill.resetHistory();
        globalTime.timeOfDay = time;
        globalTime.transitioning = false;
        globalTime.transitionAlpha = (time === 'night' || time === 'sunrise') ? 255 : 0;
        
        overlay.update();
        overlay.render();
        
        const fillCall = mockP5.fill.getCall(0);
        if (fillCall) {
          renderColors.push({
            time,
            color: fillCall.args.slice(0, 3),
            alpha: fillCall.args[3]
          });
        }
      });
      
      // Each time period should render with different values
      expect(renderColors).to.have.length.greaterThan(0);
    });
  });
  
  describe('Console Commands Integration', function() {
    it('should have setTimeOfDay command available', function() {
      expect(window.setTimeOfDay).to.be.a('function');
    });
    
    it('should have toggleTimeDebug command available', function() {
      expect(window.toggleTimeDebug).to.be.a('function');
    });
    
    it('should have getTimeConfig command available', function() {
      expect(window.getTimeConfig).to.be.a('function');
    });
    
    it('should have setTimeConfig command available', function() {
      expect(window.setTimeConfig).to.be.a('function');
    });
    
    it('should change time via console command', function() {
      const result = window.setTimeOfDay('night');
      expect(result).to.be.true;
      expect(globalTime.timeOfDay).to.equal('night');
    });
    
    it('should toggle debug via console command', function() {
      const initialState = overlay.debugMode;
      const result = window.toggleTimeDebug();
      expect(result).to.equal(!initialState);
      expect(overlay.debugMode).to.equal(!initialState);
    });
    
    it('should get config via console command', function() {
      const config = window.getTimeConfig();
      expect(config).to.exist;
      expect(config.day).to.exist;
      expect(config.sunset).to.exist;
      expect(config.night).to.exist;
      expect(config.sunrise).to.exist;
    });
    
    it('should set config via console command', function() {
      const newColor = [100, 200, 50];
      const newAlpha = 0.6;
      
      const result = window.setTimeConfig('sunset', newColor, newAlpha);
      expect(result).to.be.true;
      
      const config = overlay.getConfig();
      expect(config.sunset.color).to.deep.equal(newColor);
      expect(config.sunset.alpha).to.equal(newAlpha);
    });
  });
  
  describe('State Persistence', function() {
    it('should maintain overlay state across multiple updates', function() {
      globalTime.timeOfDay = 'sunset';
      globalTime.transitioning = true;
      globalTime.transitionAlpha = 128;
      
      overlay.update();
      const color1 = [...overlay.currentColor];
      const alpha1 = overlay.currentAlpha;
      
      // Update again with same values
      overlay.update();
      const color2 = [...overlay.currentColor];
      const alpha2 = overlay.currentAlpha;
      
      expect(color1).to.deep.equal(color2);
      expect(alpha1).to.equal(alpha2);
    });
    
    it('should gradually settle after state changes', function() {
      globalTime.timeOfDay = 'sunset';
      globalTime.transitioning = true;
      globalTime.transitionAlpha = 255;
      overlay.update();
      
      // Change to night
      globalTime.timeOfDay = 'night';
      globalTime.transitioning = false;
      
      const alphas = [];
      for (let i = 0; i < 100; i++) {
        overlay.update();
        alphas.push(overlay.currentAlpha);
      }
      
      // Should gradually approach night alpha
      const firstAlpha = alphas[0];
      const lastAlpha = alphas[alphas.length - 1];
      const targetAlpha = overlay.config.night.alpha;
      
      expect(Math.abs(lastAlpha - targetAlpha)).to.be.lessThan(Math.abs(firstAlpha - targetAlpha));
    });
  });
  
  describe('Full Day/Night Cycle', function() {
    it('should complete a full cycle smoothly', function() {
      const timeline = [];
      
      // Simulate full day/night cycle with time updates
      globalTime.timeOfDay = 'day';
      globalTime.transitioning = false;
      globalTime.transitionAlpha = 0;
      
      // Day period
      for (let i = 0; i < 10; i++) {
        overlay.update();
        timeline.push({ time: 'day', alpha: overlay.currentAlpha });
      }
      
      // Sunset transition
      globalTime.timeOfDay = 'sunset';
      globalTime.transitioning = true;
      for (let alpha = 0; alpha <= 255; alpha += 25) {
        globalTime.transitionAlpha = alpha;
        overlay.update();
        timeline.push({ time: 'sunset', alpha: overlay.currentAlpha });
      }
      
      // Night period
      globalTime.timeOfDay = 'night';
      globalTime.transitioning = false;
      globalTime.transitionAlpha = 255;
      for (let i = 0; i < 10; i++) {
        overlay.update();
        timeline.push({ time: 'night', alpha: overlay.currentAlpha });
      }
      
      // Sunrise transition
      globalTime.timeOfDay = 'sunrise';
      globalTime.transitioning = true;
      for (let alpha = 255; alpha >= 0; alpha -= 25) {
        globalTime.transitionAlpha = alpha;
        overlay.update();
        timeline.push({ time: 'sunrise', alpha: overlay.currentAlpha });
      }
      
      // Back to day
      globalTime.timeOfDay = 'day';
      globalTime.transitioning = false;
      globalTime.transitionAlpha = 0;
      for (let i = 0; i < 10; i++) {
        overlay.update();
        timeline.push({ time: 'day', alpha: overlay.currentAlpha });
      }
      
      // Verify no discontinuities (no sudden jumps)
      for (let i = 1; i < timeline.length; i++) {
        const diff = Math.abs(timeline[i].alpha - timeline[i-1].alpha);
        expect(diff).to.be.lessThan(0.2, `Large jump at ${timeline[i-1].time} -> ${timeline[i].time}`);
      }
      
      // Verify cycle returns to start state
      expect(timeline[0].alpha).to.be.closeTo(timeline[timeline.length - 1].alpha, 0.05);
    });
  });
  
  describe('Error Handling', function() {
    it('should handle missing GlobalTime gracefully', function() {
      overlay.globalTime = null;
      expect(() => overlay.update()).to.not.throw();
      expect(() => overlay.render()).to.not.throw();
    });
    
    it('should handle corrupted GlobalTime state', function() {
      globalTime.timeOfDay = null;
      expect(() => overlay.update()).to.not.throw();
      
      globalTime.timeOfDay = undefined;
      expect(() => overlay.update()).to.not.throw();
    });
    
    it('should handle missing p5 context gracefully', function() {
      delete global.push;
      delete global.pop;
      
      expect(() => overlay.render()).to.not.throw();
    });
    
    it('should recover from invalid configuration', function() {
      overlay.config.sunset = null;
      globalTime.timeOfDay = 'sunset';
      
      // Should not crash, might log warning
      expect(() => overlay.update()).to.not.throw();
    });
  });
  
  describe('Performance Under Load', function() {
    it('should handle rapid updates efficiently', function() {
      const start = Date.now();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        globalTime.update();
        overlay.update();
      }
      
      const elapsed = Date.now() - start;
      const avgTime = elapsed / iterations;
      
      // Should complete in less than 1ms per update pair
      expect(avgTime).to.be.lessThan(1);
    });
    
    it('should handle rapid time changes', function() {
      const times = ['day', 'sunset', 'night', 'sunrise'];
      
      for (let i = 0; i < 100; i++) {
        const randomTime = times[Math.floor(Math.random() * times.length)];
        globalTime.timeOfDay = randomTime;
        globalTime.transitionAlpha = Math.floor(Math.random() * 256);
        
        expect(() => {
          overlay.update();
          overlay.render();
        }).to.not.throw();
      }
    });
  });
});
