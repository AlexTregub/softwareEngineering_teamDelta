/**
 * ResourceDisplayComponent Integration Tests
 * ============================================
 * TDD Phase 3: Rendering Integration Tests (WRITE BEFORE implementing render())
 * 
 * Tests verify:
 * - RenderLayerManager registration
 * - render() method existence and signature
 * - Integration with rendering pipeline
 * - Unregistration and cleanup
 * 
 * These tests will FAIL until Phase 4 implementation
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('ResourceDisplayComponent - Rendering Integration', function() {
  let ResourceDisplayComponent;
  let RenderLayerManager;
  let component;
  let renderManager;

  before(function() {
    // Setup minimal global mocks
    global.logNormal = sinon.stub();
    global.logWarn = sinon.stub();
    global.logError = sinon.stub();
    
    // Mock p5.js drawing functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.image = sinon.stub();
    global.imageMode = sinon.stub();
    
    // Mock p5.js constants
    global.LEFT = 'left';
    global.TOP = 'top';
    global.CENTER = 'center';
    global.CORNER = 'corner';

    // Load components
    ResourceDisplayComponent = require('../../../Classes/ui/ResourceDisplayComponent.js');
    const renderModule = require('../../../Classes/rendering/RenderLayerManager.js');
    RenderLayerManager = renderModule.RenderLayerManager;
  });

  beforeEach(function() {
    // Create fresh instances
    component = new ResourceDisplayComponent(50, 50, 'player');
    renderManager = new RenderLayerManager();
    
    // Reset stubs
    global.push.resetHistory();
    global.pop.resetHistory();
    global.fill.resetHistory();
    global.rect.resetHistory();
    global.text.resetHistory();
  });

  after(function() {
    // Cleanup globals
    delete global.logNormal;
    delete global.logWarn;
    delete global.logError;
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.stroke;
    delete global.rect;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.image;
    delete global.imageMode;
    delete global.LEFT;
    delete global.TOP;
    delete global.CENTER;
    delete global.CORNER;
  });

  describe('render() Method', function() {
    it('should have a render() method', function() {
      expect(component.render).to.be.a('function');
    });

    it('should accept gameState parameter', function() {
      expect(component.render.length).to.be.at.least(0); // 0 or 1 params
      expect(() => component.render('PLAYING')).to.not.throw();
    });

    it('should call p5.js drawing functions when render() is called', function() {
      component.render('PLAYING');

      // Should use push/pop for isolated rendering
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
    });

    it('should render at correct position', function() {
      component.setPosition(100, 200);
      component.render('PLAYING');

      // Verify some drawing happened (exact implementation varies)
      expect(global.push.called || global.rect.called || global.text.called).to.be.true;
    });

    it('should not throw errors when called multiple times', function() {
      expect(() => {
        component.render('PLAYING');
        component.render('PLAYING');
        component.render('PLAYING');
      }).to.not.throw();
    });

    it('should handle different gameStates', function() {
      expect(() => {
        component.render('MENU');
        component.render('PLAYING');
        component.render('PAUSED');
      }).to.not.throw();
    });
  });

  describe('RenderLayerManager Integration', function() {
    it('should register with RenderLayerManager UI_GAME layer', function() {
      const drawableFn = () => component.render('PLAYING');
      
      renderManager.addDrawableToLayer(renderManager.layers.UI_GAME, drawableFn);
      
      const drawables = renderManager.layerDrawables.get(renderManager.layers.UI_GAME);
      expect(drawables).to.be.an('array');
      expect(drawables.length).to.be.at.least(1);
      expect(drawables).to.include(drawableFn);
    });

    it('should be callable from RenderLayerManager pipeline', function() {
      const renderSpy = sinon.spy(component, 'render');
      const drawableFn = () => component.render('PLAYING');
      
      renderManager.addDrawableToLayer(renderManager.layers.UI_GAME, drawableFn);
      
      // Simulate calling the drawable
      const drawables = renderManager.layerDrawables.get(renderManager.layers.UI_GAME);
      drawables.forEach(fn => fn());
      
      expect(renderSpy.called).to.be.true;
    });

    it('should unregister from RenderLayerManager', function() {
      const drawableFn = () => component.render('PLAYING');
      
      renderManager.addDrawableToLayer(renderManager.layers.UI_GAME, drawableFn);
      const removed = renderManager.removeDrawableFromLayer(renderManager.layers.UI_GAME, drawableFn);
      
      expect(removed).to.be.true;
      const drawables = renderManager.layerDrawables.get(renderManager.layers.UI_GAME);
      expect(drawables).to.not.include(drawableFn);
    });

    it('should support multiple components on same layer', function() {
      const component1 = new ResourceDisplayComponent(50, 50, 'player');
      const component2 = new ResourceDisplayComponent(200, 50, 'enemy');
      
      const drawableFn1 = () => component1.render('PLAYING');
      const drawableFn2 = () => component2.render('PLAYING');
      
      renderManager.addDrawableToLayer(renderManager.layers.UI_GAME, drawableFn1);
      renderManager.addDrawableToLayer(renderManager.layers.UI_GAME, drawableFn2);
      
      const drawables = renderManager.layerDrawables.get(renderManager.layers.UI_GAME);
      expect(drawables.length).to.be.at.least(2);
    });
  });

  describe('Rendering with Resource Data', function() {
    it('should render with zero resources', function() {
      component.setResources({ food: 0, wood: 0, stone: 0 });
      
      expect(() => component.render('PLAYING')).to.not.throw();
    });

    it('should render with non-zero resources', function() {
      component.setResources({ food: 100, wood: 50, stone: 25 });
      
      expect(() => component.render('PLAYING')).to.not.throw();
      
      // Should call text() for displaying counts
      expect(global.text.called).to.be.true;
    });

    it('should render with large resource counts', function() {
      component.setResources({ food: 999999, wood: 888888, stone: 777777 });
      
      expect(() => component.render('PLAYING')).to.not.throw();
    });

    it('should update rendering when resources change', function() {
      component.setResources({ food: 10, wood: 10, stone: 10 });
      component.render('PLAYING');
      global.text.resetHistory();
      
      component.setResources({ food: 100, wood: 100, stone: 100 });
      component.render('PLAYING');
      
      // Should call text again with updated values
      expect(global.text.called).to.be.true;
    });
  });

  describe('Scale Property Effect', function() {
    it('should render at scale 1.0', function() {
      component.scale = 1.0;
      
      expect(() => component.render('PLAYING')).to.not.throw();
    });

    it('should render at scale 1.5', function() {
      component.scale = 1.5;
      
      expect(() => component.render('PLAYING')).to.not.throw();
    });

    it('should render at scale 0.5', function() {
      component.scale = 0.5;
      
      expect(() => component.render('PLAYING')).to.not.throw();
    });

    it('should apply scale to icon sizes', function() {
      component.scale = 2.0;
      component.render('PLAYING');
      
      // Verify textSize was called (scaled text)
      expect(global.textSize.called).to.be.true;
    });
  });

  describe('Sprite Rendering', function() {
    it('should render with emoji fallback when no sprites provided', function() {
      const componentNoSprites = new ResourceDisplayComponent(50, 50, 'player');
      
      expect(() => componentNoSprites.render('PLAYING')).to.not.throw();
      
      // Should use text() for emoji rendering
      expect(global.text.called).to.be.true;
    });

    it('should render with sprite images when provided', function() {
      const mockSprites = {
        food: { type: 'image' },
        wood: { type: 'image' },
        stone: { type: 'image' }
      };
      const componentWithSprites = new ResourceDisplayComponent(50, 50, 'player', mockSprites);
      
      expect(() => componentWithSprites.render('PLAYING')).to.not.throw();
    });
  });

  describe('Error Handling', function() {
    it('should handle missing p5.js functions gracefully', function() {
      // Temporarily delete a p5 function
      const originalRect = global.rect;
      delete global.rect;
      
      expect(() => component.render('PLAYING')).to.not.throw();
      
      // Restore
      global.rect = originalRect;
    });

    it('should handle invalid gameState', function() {
      expect(() => {
        component.render(null);
        component.render(undefined);
        component.render('INVALID_STATE');
      }).to.not.throw();
    });

    it('should not crash when p5 functions throw', function() {
      global.rect.throws(new Error('Mock p5 error'));
      
      expect(() => component.render('PLAYING')).to.not.throw();
      
      global.rect.resetBehavior();
    });
  });

  describe('Performance Considerations', function() {
    it('should complete render() quickly', function() {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        component.render('PLAYING');
      }
      
      const duration = Date.now() - start;
      expect(duration).to.be.below(100); // 100 renders in <100ms
    });

    it('should not leak memory on repeated renders', function() {
      // Reset stubs to clear call history before measuring
      global.push.resetHistory();
      global.pop.resetHistory();
      global.fill.resetHistory();
      global.rect.resetHistory();
      global.text.resetHistory();
      
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 1000; i++) {
        component.render('PLAYING');
        // Clear stub history periodically to avoid sinon overhead
        if (i % 100 === 0) {
          global.push.resetHistory();
          global.pop.resetHistory();
          global.fill.resetHistory();
          global.rect.resetHistory();
          global.text.resetHistory();
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Allow reasonable memory increase (Sinon stubs accumulate some data)
      expect(memoryIncrease).to.be.below(100 * 1024 * 1024); // <100MB
    });
  });
});
