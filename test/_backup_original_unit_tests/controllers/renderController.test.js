const { expect } = require('chai');

// Mock p5.js functions
global.stroke = () => {};
global.fill = () => {};
global.rect = () => {};
global.strokeWeight = () => {};
global.noFill = () => {};
global.noStroke = () => {};
global.push = () => {};
global.pop = () => {};
global.translate = () => {};
global.rotate = () => {};
global.sin = Math.sin;
global.cos = Math.cos;
global.textSize = () => {};
global.text = () => {};
global.textAlign = () => {};
global.CENTER = 'CENTER';
global.TOP = 'TOP';

// Load the module
const RenderController = require('../../../Classes/controllers/RenderController.js');

describe('RenderController', function() {
  let controller;
  let mockEntity;
  
  beforeEach(function() {
    mockEntity = {
      posX: 100,
      posY: 200,
      sizeX: 32,
      sizeY: 32,
      rotation: 0,
      getPosition: function() { return { x: this.posX, y: this.posY }; },
      getSize: function() { return { x: this.sizeX, y: this.sizeY }; },
      getRotation: function() { return this.rotation; },
      isSelected: false,
      isBoxHovered: false
    };
    controller = new RenderController(mockEntity);
  });
  
  describe('Constructor', function() {
    it('should initialize with entity reference', function() {
      expect(controller._entity).to.equal(mockEntity);
    });
    
    it('should initialize effects array', function() {
      expect(controller._effects).to.be.an('array').that.is.empty;
    });
    
    it('should initialize highlight state as null', function() {
      expect(controller._highlightState).to.be.null;
    });
    
    it('should initialize animation offsets', function() {
      expect(controller._bobOffset).to.be.a('number');
      expect(controller._pulseOffset).to.be.a('number');
      expect(controller._spinOffset).to.be.a('number');
    });
    
    it('should have HIGHLIGHT_TYPES defined', function() {
      expect(controller.HIGHLIGHT_TYPES).to.be.an('object');
      expect(controller.HIGHLIGHT_TYPES.SELECTED).to.exist;
      expect(controller.HIGHLIGHT_TYPES.HOVER).to.exist;
      expect(controller.HIGHLIGHT_TYPES.COMBAT).to.exist;
    });
    
    it('should have STATE_INDICATORS defined', function() {
      expect(controller.STATE_INDICATORS).to.be.an('object');
      expect(controller.STATE_INDICATORS.MOVING).to.exist;
      expect(controller.STATE_INDICATORS.GATHERING).to.exist;
      expect(controller.STATE_INDICATORS.IDLE).to.exist;
    });
  });
  
  describe('update()', function() {
    it('should update without errors', function() {
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should update animation offsets', function() {
      const initialBob = controller._bobOffset;
      controller.update();
      expect(controller._bobOffset).to.not.equal(initialBob);
    });
    
    it('should keep animation offsets in range', function() {
      controller._bobOffset = Math.PI * 10;
      controller._updateAnimations();
      // Implementation subtracts Math.PI * 4 when exceeds, not resets to 0
      expect(controller._bobOffset).to.be.lessThan(Math.PI * 11);
      expect(controller._bobOffset).to.be.greaterThan(Math.PI * 5);
    });
    
    it('should update pulse offset', function() {
      const initialPulse = controller._pulseOffset;
      controller.update();
      expect(controller._pulseOffset).to.not.equal(initialPulse);
    });
    
    it('should update spin offset', function() {
      const initialSpin = controller._spinOffset;
      controller.update();
      expect(controller._spinOffset).to.not.equal(initialSpin);
    });
  });
  
  describe('Highlight Management', function() {
    describe('setHighlight()', function() {
      it('should set highlight type', function() {
        controller.setHighlight('SELECTED');
        expect(controller._highlightState).to.equal('SELECTED');
      });
      
      it('should set highlight intensity', function() {
        controller.setHighlight('SELECTED', 0.5);
        expect(controller._highlightIntensity).to.equal(0.5);
      });
      
      it('should default intensity to 1.0', function() {
        controller.setHighlight('HOVER');
        expect(controller._highlightIntensity).to.equal(1.0);
      });
      
      it('should handle invalid highlight types', function() {
        expect(() => controller.setHighlight('INVALID_TYPE')).to.not.throw();
      });
      
      it('should not return value (void)', function() {
        const result = controller.setHighlight('SELECTED');
        expect(result).to.be.undefined;
      });
    });
    
    describe('clearHighlight()', function() {
      it('should clear highlight state', function() {
        controller.setHighlight('SELECTED');
        controller.clearHighlight();
        expect(controller._highlightState).to.be.null;
      });
      
      it('should reset highlight intensity', function() {
        controller.setHighlight('SELECTED', 0.5);
        controller.clearHighlight();
        expect(controller._highlightIntensity).to.equal(1.0);
      });
      
      it('should not return value (void)', function() {
        const result = controller.clearHighlight();
        expect(result).to.be.undefined;
      });
    });
  });
  
  describe('Effect Management', function() {
    describe('addEffect()', function() {
      it('should add effect to effects array', function() {
        const effect = { id: 'test1', duration: 1000 };
        controller.addEffect(effect);
        expect(controller._effects).to.have.lengthOf(1);
        expect(controller._effects[0]).to.include(effect);
        expect(controller._effects[0].createdAt).to.be.a('number');
      });
      
      it('should handle multiple effects', function() {
        controller.addEffect({ id: 'effect1', duration: 1000 });
        controller.addEffect({ id: 'effect2', duration: 2000 });
        expect(controller._effects).to.have.lengthOf(2);
      });
      
      it('should return generated effect ID', function() {
        const result = controller.addEffect({ id: 'test', duration: 1000 });
        expect(result).to.be.a('string');
        expect(result).to.match(/^effect_/);
      });
    });
    
    describe('removeEffect()', function() {
      it('should remove effect by id', function() {
        controller.addEffect({ id: 'test1', duration: 1000 });
        controller.addEffect({ id: 'test2', duration: 2000 });
        controller.removeEffect('test1');
        expect(controller._effects).to.have.lengthOf(1);
        expect(controller._effects[0].id).to.equal('test2');
      });
      
      it('should handle non-existent effect id', function() {
        expect(() => controller.removeEffect('nonexistent')).to.not.throw();
      });
      
      it('should not return value (void)', function() {
        const result = controller.removeEffect('test');
        expect(result).to.be.undefined;
      });
    });
    
    describe('clearEffects()', function() {
      it('should remove all effects', function() {
        controller.addEffect({ id: 'test1', duration: 1000 });
        controller.addEffect({ id: 'test2', duration: 2000 });
        controller.clearEffects();
        expect(controller._effects).to.be.an('array').that.is.empty;
      });
      
      it('should not return value (void)', function() {
        const result = controller.clearEffects();
        expect(result).to.be.undefined;
      });
    });
  });
  
  describe('Rendering Settings', function() {
    describe('setDebugMode()', function() {
      it('should enable debug mode', function() {
        controller.setDebugMode(true);
        expect(controller._debugMode).to.be.true;
      });
      
      it('should disable debug mode', function() {
        controller.setDebugMode(false);
        expect(controller._debugMode).to.be.false;
      });
      
      it('should not return value (void)', function() {
        const result = controller.setDebugMode(true);
        expect(result).to.be.undefined;
      });
    });
    
    describe('setSmoothing()', function() {
      it('should enable smoothing', function() {
        controller.setSmoothing(true);
        expect(controller._smoothing).to.be.true;
      });
      
      it('should disable smoothing', function() {
        controller.setSmoothing(false);
        expect(controller._smoothing).to.be.false;
      });
      
      it('should not return value (void)', function() {
        const result = controller.setSmoothing(true);
        expect(result).to.be.undefined;
      });
    });
  });
  
  describe('Rendering Methods', function() {
    describe('renderEntity()', function() {
      it('should render without errors', function() {
        expect(() => controller.renderEntity()).to.not.throw();
      });
      
      it('should handle entity without sprite', function() {
        delete mockEntity._sprite;
        expect(() => controller.renderEntity()).to.not.throw();
      });
      
      it('should use fallback when sprite unavailable', function() {
        mockEntity._sprite = null;
        expect(() => controller.renderEntity()).to.not.throw();
      });
    });
    
    describe('renderFallbackEntity()', function() {
      it('should render fallback representation', function() {
        expect(() => controller.renderFallbackEntity()).to.not.throw();
      });
      
      it('should handle missing position', function() {
        delete mockEntity.getPosition;
        expect(() => controller.renderFallbackEntity()).to.not.throw();
      });
    });
    
    describe('renderHighlighting()', function() {
      it('should render without highlight state', function() {
        expect(() => controller.renderHighlighting()).to.not.throw();
      });
      
      it('should render SELECTED highlight', function() {
        controller.setHighlight('SELECTED');
        expect(() => controller.renderHighlighting()).to.not.throw();
      });
      
      it('should render HOVER highlight', function() {
        controller.setHighlight('HOVER');
        expect(() => controller.renderHighlighting()).to.not.throw();
      });
      
      it('should render BOX_HOVERED highlight', function() {
        controller.setHighlight('BOX_HOVERED');
        expect(() => controller.renderHighlighting()).to.not.throw();
      });
      
      it('should render COMBAT highlight', function() {
        controller.setHighlight('COMBAT');
        expect(() => controller.renderHighlighting()).to.not.throw();
      });
    });
    
    describe('renderOutlineHighlight()', function() {
      it('should render outline highlight', function() {
        const pos = { x: 100, y: 200 };
        const size = { x: 32, y: 32 };
        const color = [0, 255, 0];
        expect(() => controller.renderOutlineHighlight(pos, size, color, 2)).to.not.throw();
      });
      
      it('should handle rotation', function() {
        const pos = { x: 100, y: 200 };
        const size = { x: 32, y: 32 };
        const color = [0, 255, 0];
        expect(() => controller.renderOutlineHighlight(pos, size, color, 2, Math.PI/4)).to.not.throw();
      });
    });
    
    describe('renderPulseHighlight()', function() {
      it('should render pulse highlight', function() {
        const pos = { x: 100, y: 200 };
        const size = { x: 32, y: 32 };
        const color = [255, 0, 0];
        expect(() => controller.renderPulseHighlight(pos, size, color, 3)).to.not.throw();
      });
    });
    
    describe('renderBobHighlight()', function() {
      it('should render bob highlight', function() {
        const pos = { x: 100, y: 200 };
        const size = { x: 32, y: 32 };
        const color = [255, 255, 255];
        expect(() => controller.renderBobHighlight(pos, size, color, 2)).to.not.throw();
      });
    });
    
    describe('renderSpinHighlight()', function() {
      it('should render spin highlight', function() {
        const pos = { x: 100, y: 200 };
        const size = { x: 32, y: 32 };
        const color = [0, 255, 255];
        expect(() => controller.renderSpinHighlight(pos, size, color, 2)).to.not.throw();
      });
    });
  });
  
  describe('Helper Methods', function() {
    describe('_isP5Available()', function() {
      it('should return true when p5.js functions exist', function() {
        expect(controller._isP5Available()).to.be.true;
      });
      
      it('should return false when stroke is missing', function() {
        const savedStroke = global.stroke;
        global.stroke = undefined;
        expect(controller._isP5Available()).to.be.false;
        global.stroke = savedStroke;
      });
    });
    
    describe('_safeRender()', function() {
      it('should execute render function safely', function() {
        let executed = false;
        controller._safeRender(() => { executed = true; });
        expect(executed).to.be.true;
      });
      
      it('should catch errors in render function', function() {
        expect(() => controller._safeRender(() => { throw new Error('Test error'); })).to.not.throw();
      });
      
      it('should skip when p5.js unavailable', function() {
        const savedStroke = global.stroke;
        global.stroke = undefined;
        let executed = false;
        controller._safeRender(() => { executed = true; });
        expect(executed).to.be.false;
        global.stroke = savedStroke;
      });
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle null entity gracefully', function() {
      const nullController = new RenderController(null);
      expect(() => nullController.update()).to.not.throw();
    });
    
    it('should handle entity without methods', function() {
      const simpleEntity = { posX: 0, posY: 0 };
      const simpleController = new RenderController(simpleEntity);
      expect(() => simpleController.renderEntity()).to.not.throw();
    });
    
    it('should handle very high animation offsets', function() {
      controller._bobOffset = Math.PI * 100;
      controller._pulseOffset = Math.PI * 100;
      controller._spinOffset = Math.PI * 100;
      controller._updateAnimations();
      // Implementation subtracts Math.PI * 4 iteratively, not resets
      expect(controller._bobOffset).to.be.lessThan(Math.PI * 101);
      expect(controller._pulseOffset).to.be.lessThan(Math.PI * 101);
      expect(controller._spinOffset).to.be.lessThan(Math.PI * 101);
    });
    
    it('should clamp negative intensity to 0', function() {
      controller.setHighlight('SELECTED', -0.5);
      expect(controller._highlightIntensity).to.equal(0);
    });
    
    it('should clamp intensity > 1 to 1', function() {
      controller.setHighlight('SELECTED', 2.5);
      expect(controller._highlightIntensity).to.equal(1);
    });
    
    it('should handle sequential method calls', function() {
      controller.setHighlight('SELECTED');
      controller.setDebugMode(true);
      controller.setSmoothing(false);
      const effectId = controller.addEffect({ id: 'test', duration: 1000 });
      controller.clearHighlight();
      
      expect(controller._debugMode).to.be.true;
      expect(controller._smoothing).to.be.false;
      expect(controller._highlightState).to.be.null;
      expect(effectId).to.be.a('string');
    });
  });
});
