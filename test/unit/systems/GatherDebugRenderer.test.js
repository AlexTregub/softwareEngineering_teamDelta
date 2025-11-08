/**
 * Unit Tests for GatherDebugRenderer
 * Tests gathering behavior visualization system
 */

const { expect } = require('chai');

// Mock p5.js functions
global.push = () => {};
global.pop = () => {};
global.fill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.noStroke = () => {};
global.noFill = () => {};
global.ellipse = () => {};
global.text = () => {};
global.textAlign = () => {};
global.textSize = () => {};
global.line = () => {};
global.CENTER = 'center';
global.BOTTOM = 'bottom';
global.LEFT = 'left';
global.TOP = 'top';

// Load GatherDebugRenderer
const GatherDebugRenderer = require('../../../Classes/systems/GatherDebugRenderer');

describe('GatherDebugRenderer', function() {
  
  let renderer;
  
  beforeEach(function() {
    renderer = new GatherDebugRenderer();
    
    // Mock global objects
    global.ants = [];
    global.g_entityInventoryManager = {
      getResourceList: () => []
    };
  });
  
  afterEach(function() {
    delete global.ants;
    delete global.g_entityInventoryManager;
  });
  
  describe('Constructor', function() {
    
    it('should create renderer with default settings', function() {
      expect(renderer).to.exist;
      expect(renderer.enabled).to.be.false;
      expect(renderer.showRanges).to.be.true;
      expect(renderer.showResourceInfo).to.be.true;
    });
    
    it('should initialize visual styling', function() {
      expect(renderer.rangeColor).to.be.an('array');
      expect(renderer.rangeColor).to.have.lengthOf(4);
      expect(renderer.resourceColor).to.be.an('array');
      expect(renderer.antColor).to.be.an('array');
    });
    
    it('should set default line visibility', function() {
      expect(renderer.showAllLines).to.be.false;
    });
  });
  
  describe('toggle()', function() {
    
    it('should toggle enabled state', function() {
      expect(renderer.enabled).to.be.false;
      
      renderer.toggle();
      expect(renderer.enabled).to.be.true;
      
      renderer.toggle();
      expect(renderer.enabled).to.be.false;
    });
  });
  
  describe('toggleAllLines()', function() {
    
    it('should toggle showAllLines state', function() {
      expect(renderer.showAllLines).to.be.false;
      
      renderer.toggleAllLines();
      expect(renderer.showAllLines).to.be.true;
      
      renderer.toggleAllLines();
      expect(renderer.showAllLines).to.be.false;
    });
  });
  
  describe('enable()', function() {
    
    it('should enable renderer', function() {
      renderer.enabled = false;
      
      renderer.enable();
      
      expect(renderer.enabled).to.be.true;
    });
  });
  
  describe('disable()', function() {
    
    it('should disable renderer', function() {
      renderer.enabled = true;
      
      renderer.disable();
      
      expect(renderer.enabled).to.be.false;
    });
  });
  
  describe('render()', function() {
    
    it('should not render when disabled', function() {
      renderer.enabled = false;
      
      // Should not throw
      expect(() => renderer.render()).to.not.throw();
    });
    
    it('should handle no ants gracefully', function() {
      renderer.enabled = true;
      global.ants = undefined;
      
      expect(() => renderer.render()).to.not.throw();
    });
    
    it('should handle empty ants array', function() {
      renderer.enabled = true;
      global.ants = [];
      
      expect(() => renderer.render()).to.not.throw();
    });
    
    it('should handle missing resource manager', function() {
      renderer.enabled = true;
      global.ants = [{
        state: 'GATHERING',
        getPosition: () => ({ x: 100, y: 100 })
      }];
      global.g_entityInventoryManager = undefined;
      
      expect(() => renderer.render()).to.not.throw();
    });
    
    it('should render gathering ants', function() {
      renderer.enabled = true;
      global.ants = [{
        state: 'GATHERING',
        getPosition: () => ({ x: 100, y: 100 })
      }];
      
      expect(() => renderer.render()).to.not.throw();
    });
  });
  
  describe('renderAntGatherInfo()', function() {
    
    it('should render ant position', function() {
      renderer.enabled = true;
      renderer.showAntInfo = true;
      
      const ant = {
        getPosition: () => ({ x: 150, y: 200 })
      };
      
      expect(() => {
        renderer.renderAntGatherInfo(ant, 0, []);
      }).to.not.throw();
    });
    
    it('should render gathering range when enabled', function() {
      renderer.enabled = true;
      renderer.showRanges = true;
      
      const ant = {
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      expect(() => {
        renderer.renderAntGatherInfo(ant, 0, []);
      }).to.not.throw();
    });
    
    it('should render distance lines to resources', function() {
      renderer.enabled = true;
      renderer.showDistances = true;
      
      const ant = {
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      const resources = [{
        getPosition: () => ({ x: 150, y: 150 })
      }];
      
      expect(() => {
        renderer.renderAntGatherInfo(ant, 0, resources);
      }).to.not.throw();
    });
  });
  
  describe('Visual Properties', function() {
    
    it('should have customizable colors', function() {
      renderer.rangeColor = [255, 0, 0, 100];
      renderer.antColor = [0, 255, 0];
      
      expect(renderer.rangeColor).to.deep.equal([255, 0, 0, 100]);
      expect(renderer.antColor).to.deep.equal([0, 255, 0]);
    });
    
    it('should maintain color arrays', function() {
      expect(renderer.rangeColor).to.have.lengthOf(4); // RGBA
      expect(renderer.rangeStrokeColor).to.have.lengthOf(4);
      expect(renderer.resourceColor).to.have.lengthOf(3); // RGB
      expect(renderer.antColor).to.have.lengthOf(3);
    });
  });
  
  describe('Feature Toggles', function() {
    
    it('should allow toggling ranges display', function() {
      renderer.showRanges = false;
      expect(renderer.showRanges).to.be.false;
      
      renderer.showRanges = true;
      expect(renderer.showRanges).to.be.true;
    });
    
    it('should allow toggling resource info display', function() {
      renderer.showResourceInfo = false;
      expect(renderer.showResourceInfo).to.be.false;
      
      renderer.showResourceInfo = true;
      expect(renderer.showResourceInfo).to.be.true;
    });
    
    it('should allow toggling distance display', function() {
      renderer.showDistances = false;
      expect(renderer.showDistances).to.be.false;
      
      renderer.showDistances = true;
      expect(renderer.showDistances).to.be.true;
    });
    
    it('should allow toggling ant info display', function() {
      renderer.showAntInfo = false;
      expect(renderer.showAntInfo).to.be.false;
      
      renderer.showAntInfo = true;
      expect(renderer.showAntInfo).to.be.true;
    });
  });
});

describe('Utility Functions', function() {
  
  beforeEach(function() {
    // Re-mock p5 functions for utility tests
    global.push = () => {};
    global.pop = () => {};
    global.fill = () => {};
    global.stroke = () => {};
    global.strokeWeight = () => {};
    global.text = () => {};
    global.line = () => {};
  });
  
  describe('drawLineBetweenEntities()', function() {
    
    it('should draw line without errors', function() {
      const obj1Pos = { x: 100, y: 100 };
      const obj2Pos = { x: 200, y: 200 };
      const lineColor = [255, 255, 255, 100];
      
      expect(() => {
        drawLineBetweenEntities(obj1Pos, obj2Pos, lineColor, 2);
      }).to.not.throw();
    });
  });
  
  describe('drawTextBetweenTwoObjects()', function() {
    
    it('should draw text without errors', function() {
      const obj1Pos = { x: 100, y: 100 };
      const obj2Pos = { x: 200, y: 200 };
      const textColor = [255, 255, 255, 255];
      
      expect(() => {
        drawTextBetweenTwoObjects(obj1Pos, obj2Pos, textColor, 'TEST', '100', 'px');
      }).to.not.throw();
    });
    
    it('should handle missing distance parameters', function() {
      const obj1Pos = { x: 100, y: 100 };
      const obj2Pos = { x: 200, y: 200 };
      const textColor = [255, 255, 255];
      
      expect(() => {
        drawTextBetweenTwoObjects(obj1Pos, obj2Pos, textColor, 'TEST');
      }).to.not.throw();
    });
  });
  
  describe('renderResourceInfo()', function() {
    
    beforeEach(function() {
      global.noStroke = () => {};
      global.ellipse = () => {};
      global.textAlign = () => {};
      global.textSize = () => {};
      global.CENTER = 'center';
      global.BOTTOM = 'bottom';
      global.LEFT = 'left';
      global.TOP = 'top';
    });
    
    it('should render resource information', function() {
      const resources = [{
        resourceType: 'stick',
        getPosition: () => ({ x: 100, y: 100 })
      }];
      const textColor = [255, 255, 255];
      const resourceColor = [0, 255, 0];
      
      expect(() => {
        renderResourceInfo(resources, textColor, resourceColor);
      }).to.not.throw();
    });
    
    it('should handle empty resources array', function() {
      const resources = [];
      const textColor = [255, 255, 255];
      const resourceColor = [0, 255, 0];
      
      expect(() => {
        renderResourceInfo(resources, textColor, resourceColor);
      }).to.not.throw();
    });
    
    it('should handle undefined parameters gracefully', function() {
      // Should handle undefined gracefully without throwing
      expect(() => {
        renderResourceInfo(undefined, undefined, undefined);
      }).to.not.throw();
    });
  });
});

describe('Global Instance', function() {
  
  it('should create global instance in browser', function() {
    // Simulate browser environment
    const mockWindow = {};
    global.window = mockWindow;
    
    // Reload module to trigger global creation
    delete require.cache[require.resolve('../../../Classes/systems/GatherDebugRenderer')];
    require('../../../Classes/systems/GatherDebugRenderer');
    
    expect(mockWindow.g_gatherDebugRenderer).to.exist;
    expect(mockWindow.g_gatherDebugRenderer).to.be.instanceOf(GatherDebugRenderer);
    
    delete global.window;
  });
});
