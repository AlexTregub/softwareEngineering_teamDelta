/**
 * @fileoverview Unit tests for TimeOfDayOverlay class
 * Tests color interpolation, alpha blending, state transitions, and configuration
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs');

describe('TimeOfDayOverlay - Unit Tests', function() {
  let TimeOfDayOverlay;
  let mockGlobalTime;
  let overlay;
  
  before(function() {
    // Load the Nature.js file which contains TimeOfDayOverlay
    const naturePath = path.join(__dirname, '../../../Classes/systems/Nature.js');
    const natureCode = fs.readFileSync(naturePath, 'utf8');
    
    // Execute in a sandbox to extract the class
    const sandbox = {
      console: console,
      performance: { now: () => Date.now() },
      module: { exports: {} },
      window: {}
    };
    
    const func = new Function('console', 'performance', 'module', 'window', natureCode);
    func(sandbox.console, sandbox.performance, sandbox.module, sandbox.window);
    
    TimeOfDayOverlay = sandbox.window.TimeOfDayOverlay;
    
    if (!TimeOfDayOverlay) {
      throw new Error('Failed to load TimeOfDayOverlay class from Nature.js');
    }
  });
  
  beforeEach(function() {
    // Create mock GlobalTime
    mockGlobalTime = {
      timeOfDay: 'day',
      transitionAlpha: 0,
      transitioning: false
    };
    
    overlay = new TimeOfDayOverlay(mockGlobalTime);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with default configuration', function() {
      expect(overlay.config).to.exist;
      expect(overlay.config.day).to.exist;
      expect(overlay.config.sunset).to.exist;
      expect(overlay.config.night).to.exist;
      expect(overlay.config.sunrise).to.exist;
    });
    
    it('should initialize current state to transparent', function() {
      expect(overlay.currentAlpha).to.equal(0);
      expect(overlay.currentColor).to.be.an('array');
    });
    
    it('should store reference to GlobalTime', function() {
      expect(overlay.globalTime).to.equal(mockGlobalTime);
    });
    
    it('should initialize state tracking properties', function() {
      expect(overlay.previousTimeOfDay).to.equal('day');
      expect(overlay.stateChangeProgress).to.equal(1.0);
      expect(overlay.stateChangeSpeed).to.be.a('number');
    });
    
    it('should have debug disabled by default', function() {
      expect(overlay.debugMode).to.be.undefined; // debug mode starts undefined until first toggle
    });
  });
  
  describe('Configuration Management', function() {
    it('should validate day configuration', function() {
      const dayConfig = overlay.config.day;
      expect(dayConfig.color).to.be.an('array').with.lengthOf(3);
      expect(dayConfig.alpha).to.be.a('number').within(0, 1);
    });
    
    it('should validate sunset configuration', function() {
      const sunsetConfig = overlay.config.sunset;
      expect(sunsetConfig.color).to.be.an('array').with.lengthOf(3);
      expect(sunsetConfig.alpha).to.be.a('number').within(0, 1);
      expect(sunsetConfig.alpha).to.be.above(0); // Should have some opacity
    });
    
    it('should validate night configuration', function() {
      const nightConfig = overlay.config.night;
      expect(nightConfig.color).to.be.an('array').with.lengthOf(3);
      expect(nightConfig.alpha).to.be.a('number').within(0, 1);
      expect(nightConfig.alpha).to.be.above(overlay.config.sunset.alpha); // Night should be darker
    });
    
    it('should validate sunrise configuration', function() {
      const sunriseConfig = overlay.config.sunrise;
      expect(sunriseConfig.color).to.be.an('array').with.lengthOf(3);
      expect(sunriseConfig.alpha).to.be.a('number').within(0, 1);
      expect(sunriseConfig.alpha).to.be.above(0); // Should have some opacity
    });
    
    it('should allow getting configuration', function() {
      const config = overlay.getConfig();
      expect(config).to.deep.equal(overlay.config);
      expect(config).to.not.equal(overlay.config); // Should be a copy
    });
    
    it('should allow setting configuration for a time period', function() {
      const newColor = [100, 150, 200];
      const newAlpha = 0.5;
      
      const result = overlay.setConfig('sunset', {
        color: newColor,
        alpha: newAlpha
      });
      
      expect(result).to.be.true;
      expect(overlay.config.sunset.color).to.deep.equal(newColor);
      expect(overlay.config.sunset.alpha).to.equal(newAlpha);
    });
    
    it('should reject invalid time of day', function() {
      const result = overlay.setConfig('midnight', { alpha: 0.5 });
      expect(result).to.be.false;
    });
    
    it('should validate RGB values are 0-255', function() {
      overlay.setConfig('day', { color: [255, 128, 0] });
      expect(overlay.config.day.color[0]).to.be.within(0, 255);
      expect(overlay.config.day.color[1]).to.be.within(0, 255);
      expect(overlay.config.day.color[2]).to.be.within(0, 255);
    });
  });
  
  describe('Interpolation Helpers', function() {
    describe('lerp()', function() {
      it('should interpolate between two numbers at t=0', function() {
        const result = overlay.lerp(0, 100, 0);
        expect(result).to.equal(0);
      });
      
      it('should interpolate between two numbers at t=1', function() {
        const result = overlay.lerp(0, 100, 1);
        expect(result).to.equal(100);
      });
      
      it('should interpolate between two numbers at t=0.5', function() {
        const result = overlay.lerp(0, 100, 0.5);
        expect(result).to.equal(50);
      });
      
      it('should handle negative numbers', function() {
        const result = overlay.lerp(-50, 50, 0.5);
        expect(result).to.equal(0);
      });
      
      it('should handle decimal results', function() {
        const result = overlay.lerp(0, 10, 0.33);
        expect(result).to.be.closeTo(3.3, 0.01);
      });
    });
    
    describe('lerpColor()', function() {
      it('should interpolate RGB colors at t=0', function() {
        const color1 = [255, 0, 0]; // Red
        const color2 = [0, 0, 255]; // Blue
        const result = overlay.lerpColor(color1, color2, 0);
        expect(result).to.deep.equal([255, 0, 0]);
      });
      
      it('should interpolate RGB colors at t=1', function() {
        const color1 = [255, 0, 0]; // Red
        const color2 = [0, 0, 255]; // Blue
        const result = overlay.lerpColor(color1, color2, 1);
        expect(result).to.deep.equal([0, 0, 255]);
      });
      
      it('should interpolate RGB colors at t=0.5', function() {
        const color1 = [255, 0, 0]; // Red
        const color2 = [0, 0, 255]; // Blue
        const result = overlay.lerpColor(color1, color2, 0.5);
        expect(result[0]).to.be.closeTo(128, 1);
        expect(result[2]).to.be.closeTo(128, 1);
      });
      
      it('should return integer RGB values', function() {
        const color1 = [100, 150, 200];
        const color2 = [200, 100, 50];
        const result = overlay.lerpColor(color1, color2, 0.33);
        expect(result[0]).to.be.a('number');
        expect(result[0] % 1).to.equal(0); // Should be integer
      });
      
      it('should handle identical colors', function() {
        const color = [128, 128, 128];
        const result = overlay.lerpColor(color, color, 0.5);
        expect(result).to.deep.equal(color);
      });
    });
    
    describe('easeInOutCubic()', function() {
      it('should return 0 at t=0', function() {
        const result = overlay.easeInOutCubic(0);
        expect(result).to.equal(0);
      });
      
      it('should return 1 at t=1', function() {
        const result = overlay.easeInOutCubic(1);
        expect(result).to.equal(1);
      });
      
      it('should return 0.5 at t=0.5', function() {
        const result = overlay.easeInOutCubic(0.5);
        expect(result).to.equal(0.5);
      });
      
      it('should ease in at start (t < 0.5)', function() {
        const result1 = overlay.easeInOutCubic(0.1);
        const result2 = overlay.easeInOutCubic(0.2);
        const diff1 = result1 - 0;
        const diff2 = result2 - result1;
        expect(diff2).to.be.greaterThan(diff1); // Should accelerate
      });
      
      it('should ease out at end (t > 0.5)', function() {
        const result1 = overlay.easeInOutCubic(0.8);
        const result2 = overlay.easeInOutCubic(0.9);
        const diff1 = result1 - overlay.easeInOutCubic(0.7);
        const diff2 = result2 - result1;
        expect(diff2).to.be.lessThan(diff1); // Should decelerate
      });
      
      it('should be symmetrical around 0.5', function() {
        const result1 = overlay.easeInOutCubic(0.3);
        const result2 = overlay.easeInOutCubic(0.7);
        expect(result1 + result2).to.be.closeTo(1, 0.01);
      });
    });
  });
  
  describe('State Updates - Day', function() {
    beforeEach(function() {
      mockGlobalTime.timeOfDay = 'day';
      mockGlobalTime.transitioning = false;
      mockGlobalTime.transitionAlpha = 0;
    });
    
    it('should have no overlay during day', function() {
      overlay.update();
      expect(overlay.currentAlpha).to.equal(0);
    });
    
    it('should use day color configuration', function() {
      overlay.update();
      expect(overlay.currentColor).to.deep.equal(overlay.config.day.color);
    });
  });
  
  describe('State Updates - Sunset Transition', function() {
    beforeEach(function() {
      mockGlobalTime.timeOfDay = 'sunset';
      mockGlobalTime.transitioning = true;
    });
    
    it('should start with no overlay at beginning of sunset', function() {
      mockGlobalTime.transitionAlpha = 0;
      overlay.update();
      expect(overlay.currentAlpha).to.be.closeTo(0, 0.01);
    });
    
    it('should have full sunset overlay at end of transition', function() {
      mockGlobalTime.transitionAlpha = 255;
      overlay.update();
      expect(overlay.currentAlpha).to.be.closeTo(overlay.config.sunset.alpha, 0.01);
    });
    
    it('should interpolate alpha during transition', function() {
      mockGlobalTime.transitionAlpha = 128;
      overlay.update();
      expect(overlay.currentAlpha).to.be.greaterThan(0);
      expect(overlay.currentAlpha).to.be.lessThan(overlay.config.sunset.alpha);
    });
    
    it('should interpolate color during transition', function() {
      mockGlobalTime.transitionAlpha = 128;
      overlay.update();
      const dayColor = overlay.config.day.color;
      const sunsetColor = overlay.config.sunset.color;
      
      // Should be between day and sunset colors
      expect(overlay.currentColor[0]).to.be.above(Math.min(dayColor[0], sunsetColor[0]));
      expect(overlay.currentColor[0]).to.be.below(Math.max(dayColor[0], sunsetColor[0]));
    });
    
    it('should apply easing to transition', function() {
      // Test that easing is applied (not linear)
      mockGlobalTime.transitionAlpha = 64; // 25%
      overlay.update();
      const alpha25 = overlay.currentAlpha;
      
      mockGlobalTime.transitionAlpha = 128; // 50%
      overlay.update();
      const alpha50 = overlay.currentAlpha;
      
      const diff1 = alpha25;
      const diff2 = alpha50 - alpha25;
      
      // With easing, second quarter should have different rate than first
      expect(Math.abs(diff1 - diff2)).to.be.greaterThan(0.01);
    });
  });
  
  describe('State Updates - Night Stable', function() {
    beforeEach(function() {
      mockGlobalTime.timeOfDay = 'night';
      mockGlobalTime.transitioning = false;
      mockGlobalTime.transitionAlpha = 255;
    });
    
    it('should settle into night state smoothly', function() {
      // Simulate state change from sunset to night
      overlay.previousTimeOfDay = 'sunset';
      overlay.stateChangeProgress = 0;
      
      overlay.update();
      
      expect(overlay.stateChangeProgress).to.be.greaterThan(0);
      expect(overlay.stateChangeProgress).to.be.lessThan(1);
    });
    
    it('should eventually reach full night values', function() {
      overlay.previousTimeOfDay = 'night';
      overlay.stateChangeProgress = 1.0;
      
      overlay.update();
      
      expect(overlay.currentAlpha).to.equal(overlay.config.night.alpha);
      expect(overlay.currentColor).to.deep.equal(overlay.config.night.color);
    });
    
    it('should interpolate from sunset to night', function() {
      overlay.previousTimeOfDay = 'sunset';
      overlay.stateChangeProgress = 0.5;
      
      overlay.update();
      
      const sunsetAlpha = overlay.config.sunset.alpha;
      const nightAlpha = overlay.config.night.alpha;
      
      expect(overlay.currentAlpha).to.be.above(sunsetAlpha);
      expect(overlay.currentAlpha).to.be.below(nightAlpha);
    });
  });
  
  describe('State Updates - Sunrise Transition', function() {
    beforeEach(function() {
      mockGlobalTime.timeOfDay = 'sunrise';
      mockGlobalTime.transitioning = true;
    });
    
    it('should start from night at beginning of sunrise', function() {
      mockGlobalTime.transitionAlpha = 255; // Start of sunrise
      overlay.update();
      
      // Should be close to night values
      expect(overlay.currentAlpha).to.be.closeTo(overlay.config.night.alpha, 0.1);
    });
    
    it('should end at day at end of sunrise', function() {
      mockGlobalTime.transitionAlpha = 0; // End of sunrise
      overlay.update();
      
      // Should be close to day values (no overlay)
      expect(overlay.currentAlpha).to.be.closeTo(0, 0.01);
    });
    
    it('should show sunrise colors in the middle', function() {
      mockGlobalTime.transitionAlpha = 128; // Middle of sunrise
      overlay.update();
      
      // Should have some sunrise tint
      expect(overlay.currentAlpha).to.be.greaterThan(0);
      expect(overlay.currentAlpha).to.be.lessThan(overlay.config.night.alpha);
    });
    
    it('should handle inverted transition direction correctly', function() {
      // transitionAlpha decreases during sunrise (255 -> 0)
      // but interpolation should still be smooth
      
      mockGlobalTime.transitionAlpha = 200;
      overlay.update();
      const alpha200 = overlay.currentAlpha;
      
      mockGlobalTime.transitionAlpha = 100;
      overlay.update();
      const alpha100 = overlay.currentAlpha;
      
      mockGlobalTime.transitionAlpha = 50;
      overlay.update();
      const alpha50 = overlay.currentAlpha;
      
      // Alpha should decrease as transitionAlpha decreases
      expect(alpha200).to.be.greaterThan(alpha100);
      expect(alpha100).to.be.greaterThan(alpha50);
    });
    
    it('should smoothly transition through night -> sunrise -> day', function() {
      const alphas = [];
      
      for (let alpha = 255; alpha >= 0; alpha -= 25) {
        mockGlobalTime.transitionAlpha = alpha;
        overlay.update();
        alphas.push(overlay.currentAlpha);
      }
      
      // Should be monotonically decreasing
      for (let i = 1; i < alphas.length; i++) {
        expect(alphas[i]).to.be.at.most(alphas[i-1]);
      }
    });
  });
  
  describe('State Change Detection', function() {
    it('should detect time of day changes', function() {
      mockGlobalTime.timeOfDay = 'day';
      overlay.update();
      expect(overlay.previousTimeOfDay).to.equal('day');
      
      mockGlobalTime.timeOfDay = 'sunset';
      overlay.update();
      expect(overlay.previousTimeOfDay).to.equal('sunset');
    });
    
    it('should reset state change progress on time change', function() {
      overlay.stateChangeProgress = 1.0;
      mockGlobalTime.timeOfDay = 'day';
      overlay.update();
      
      mockGlobalTime.timeOfDay = 'night';
      overlay.transitioning = false;
      overlay.update();
      
      expect(overlay.stateChangeProgress).to.be.lessThan(1.0);
    });
    
    it('should not reset progress if time hasn\'t changed', function() {
      // First establish the time of day
      mockGlobalTime.timeOfDay = 'night';
      mockGlobalTime.transitioning = false;
      overlay.previousTimeOfDay = 'night'; // Already at night
      overlay.stateChangeProgress = 0.5;
      
      overlay.update();
      
      // Should increase from 0.5 towards 1.0
      expect(overlay.stateChangeProgress).to.be.greaterThan(0.5);
    });
  });
  
  describe('Debug Mode', function() {
    it('should toggle debug mode', function() {
      expect(overlay.debugMode).to.be.undefined;
      overlay.toggleDebug();
      expect(overlay.debugMode).to.be.true;
      overlay.toggleDebug();
      expect(overlay.debugMode).to.be.false;
    });
    
    it('should return debug state when toggling', function() {
      const result1 = overlay.toggleDebug();
      expect(result1).to.be.true;
      
      const result2 = overlay.toggleDebug();
      expect(result2).to.be.false;
    });
  });
  
  describe('Force Time of Day', function() {
    it('should allow forcing day', function() {
      const result = overlay.forceTimeOfDay('day');
      expect(result).to.be.true;
      expect(mockGlobalTime.timeOfDay).to.equal('day');
      expect(mockGlobalTime.transitioning).to.be.false;
      expect(mockGlobalTime.transitionAlpha).to.equal(0);
    });
    
    it('should allow forcing sunset', function() {
      const result = overlay.forceTimeOfDay('sunset');
      expect(result).to.be.true;
      expect(mockGlobalTime.timeOfDay).to.equal('sunset');
    });
    
    it('should allow forcing night', function() {
      const result = overlay.forceTimeOfDay('night');
      expect(result).to.be.true;
      expect(mockGlobalTime.timeOfDay).to.equal('night');
      expect(mockGlobalTime.transitionAlpha).to.equal(255);
    });
    
    it('should allow forcing sunrise', function() {
      const result = overlay.forceTimeOfDay('sunrise');
      expect(result).to.be.true;
      expect(mockGlobalTime.timeOfDay).to.equal('sunrise');
      expect(mockGlobalTime.transitionAlpha).to.equal(255);
    });
    
    it('should reject invalid time of day', function() {
      const result = overlay.forceTimeOfDay('midnight');
      expect(result).to.be.false;
      expect(mockGlobalTime.timeOfDay).to.not.equal('midnight');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle missing GlobalTime reference', function() {
      overlay.globalTime = null;
      expect(() => overlay.update()).to.not.throw();
    });
    
    it('should handle unknown time of day gracefully', function() {
      mockGlobalTime.timeOfDay = 'invalid';
      const consoleSpy = sinon.spy(console, 'warn');
      overlay.update();
      expect(consoleSpy.calledWith(sinon.match(/Unknown time of day/))).to.be.true;
    });
    
    it('should clamp alpha values to 0-1 range', function() {
      overlay.setConfig('sunset', { alpha: 1.5 });
      expect(overlay.config.sunset.alpha).to.be.at.most(1);
      
      overlay.setConfig('sunset', { alpha: -0.5 });
      expect(overlay.config.sunset.alpha).to.be.at.least(0);
    });
    
    it('should handle rapid time changes', function() {
      const times = ['day', 'sunset', 'night', 'sunrise', 'day'];
      
      times.forEach(time => {
        mockGlobalTime.timeOfDay = time;
        expect(() => overlay.update()).to.not.throw();
      });
    });
    
    it('should maintain state consistency during updates', function() {
      for (let i = 0; i < 100; i++) {
        overlay.update();
        expect(overlay.currentAlpha).to.be.within(0, 1);
        expect(overlay.currentColor).to.be.an('array').with.lengthOf(3);
        overlay.currentColor.forEach(c => {
          expect(c).to.be.within(0, 255);
        });
      }
    });
  });
  
  describe('Performance', function() {
    it('should update quickly', function() {
      const iterations = 1000;
      const start = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        overlay.update();
      }
      
      const elapsed = Date.now() - start;
      const avgTime = elapsed / iterations;
      
      // Should complete in less than 1ms per update on average
      expect(avgTime).to.be.lessThan(1);
    });
    
    it('should not create new objects on every update', function() {
      overlay.update();
      const colorRef = overlay.currentColor;
      
      overlay.update();
      
      // Should mutate existing array, not create new one
      expect(overlay.currentColor).to.equal(colorRef);
    });
  });
});
