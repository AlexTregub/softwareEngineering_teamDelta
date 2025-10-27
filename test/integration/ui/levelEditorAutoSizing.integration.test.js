const { expect } = require('chai');
const sinon = require('sinon');

// Import dependencies
const DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel');
const MaterialPalette = require('../../../Classes/ui/MaterialPalette');
const ToolBar = require('../../../Classes/ui/ToolBar');
const BrushSizeControl = require('../../../Classes/ui/BrushSizeControl');

describe('Level Editor Panel Auto-Sizing Integration', function() {
  let mockP5Functions;
  
  beforeEach(function() {
    // Mock global variables
    global.devConsoleEnabled = false;
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    };
    
    // Sync to window
    if (typeof window !== 'undefined') {
      window.devConsoleEnabled = global.devConsoleEnabled;
      window.localStorage = global.localStorage;
    }
    
    // Mock p5.js functions
    mockP5Functions = {
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      createVector: sinon.stub().callsFake((x, y) => ({ x, y })),
      translate: sinon.stub()
    };
    
    // Assign to global and window
    Object.keys(mockP5Functions).forEach(key => {
      global[key] = mockP5Functions[key];
      if (typeof window !== 'undefined') {
        window[key] = mockP5Functions[key];
      }
    });
  });
  
  afterEach(function() {
    sinon.restore();
    
    // Clean up global variables
    delete global.devConsoleEnabled;
    delete global.localStorage;
    
    if (typeof window !== 'undefined') {
      delete window.devConsoleEnabled;
      delete window.localStorage;
    }
    
    // Clean up global functions
    Object.keys(mockP5Functions).forEach(key => {
      delete global[key];
      if (typeof window !== 'undefined') {
        delete window[key];
      }
    });
  });
  
  describe('MaterialPalette Panel Auto-Sizing', function() {
    it('should auto-size panel based on MaterialPalette content', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']); // 3 materials = 2 rows
      
      const panel = new DraggablePanel({
        id: 'test-materials',
        title: 'Materials',
        position: { x: 10, y: 10 },
        size: { width: 200, height: 200 }, // Start with wrong size
        buttons: {
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          contentSizeCallback: () => palette.getContentSize()
        }
      });
      
      // Auto-resize is triggered in constructor
      // Expected: width = 95 (content) + 20 (padding) = 115px
      // Expected: height = ~26.8 (title) + 95 (content) + 20 (padding) = ~141.8px
      expect(panel.config.size.width).to.be.closeTo(115, 1);
      expect(panel.config.size.height).to.be.greaterThan(135);
      expect(panel.config.size.height).to.be.lessThan(145);
    });
    
    it('should adjust size when material count changes', function() {
      const palette = new MaterialPalette(['moss', 'stone']); // 2 materials = 1 row
      
      const panel = new DraggablePanel({
        id: 'test-materials-dynamic',
        title: 'Materials',
        position: { x: 10, y: 10 },
        size: { width: 200, height: 200 },
        buttons: {
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          contentSizeCallback: () => palette.getContentSize()
        }
      });
      
      // Initial size (1 row)
      panel.autoResizeToFitContent();
      const initialHeight = panel.config.size.height;
      
      // Add more materials (now 3 rows)
      palette.materials.push('grass', 'water', 'sand');
      
      // Trigger resize again
      panel.autoResizeToFitContent();
      const newHeight = panel.config.size.height;
      
      // Height should increase with more rows
      expect(newHeight).to.be.greaterThan(initialHeight);
    });
  });
  
  describe('ToolBar Panel Auto-Sizing', function() {
    it('should auto-size panel based on ToolBar content', function() {
      const toolbar = new ToolBar([
        { name: 'brush', icon: '🖌️', tooltip: 'Brush' },
        { name: 'fill', icon: '🪣', tooltip: 'Fill' },
        { name: 'rectangle', icon: '▭', tooltip: 'Rectangle' },
        { name: 'line', icon: '/', tooltip: 'Line' }
      ]); // 4 tools
      
      const panel = new DraggablePanel({
        id: 'test-tools',
        title: 'Tools',
        position: { x: 10, y: 10 },
        size: { width: 200, height: 200 }, // Start with wrong size
        buttons: {
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          contentSizeCallback: () => toolbar.getContentSize()
        }
      });
      
      // Trigger auto-resize
      panel.autoResizeToFitContent();
      
      // Expected: width = 45 (content) + 20 (padding) = 65px
      // Expected: height = ~26.8 (title) + 165 (4 tools) + 20 (padding) = ~211.8px
      expect(panel.config.size.width).to.be.closeTo(65, 1);
      expect(panel.config.size.height).to.be.greaterThan(205);
      expect(panel.config.size.height).to.be.lessThan(215);
    });
    
    it('should handle default toolbar with 7 tools', function() {
      const toolbar = new ToolBar(); // Default 7 tools
      
      const panel = new DraggablePanel({
        id: 'test-tools-default',
        title: 'Tools',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: {
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          contentSizeCallback: () => toolbar.getContentSize()
        }
      });
      
      panel.autoResizeToFitContent();
      
      // Expected: width = 45 + 20 = 65px
      // Expected: height = ~26.8 + 285 (7 tools) + 20 = ~331.8px
      expect(panel.config.size.width).to.be.closeTo(65, 1);
      expect(panel.config.size.height).to.be.greaterThan(325);
      expect(panel.config.size.height).to.be.lessThan(335);
    });
  });
  
  describe('BrushSizeControl Panel Auto-Sizing', function() {
    it('should auto-size panel based on BrushSizeControl content', function() {
      const control = new BrushSizeControl(3);
      
      const panel = new DraggablePanel({
        id: 'test-brush-size',
        title: 'Brush Size',
        position: { x: 10, y: 10 },
        size: { width: 200, height: 200 }, // Start with wrong size
        buttons: {
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          contentSizeCallback: () => control.getContentSize()
        }
      });
      
      // Trigger auto-resize
      panel.autoResizeToFitContent();
      
      // Expected: width = 90 (content) + 20 (padding) = 110px
      // Expected: height = ~26.8 (title) + 50 (content) + 20 (padding) = ~96.8px
      expect(panel.config.size.width).to.be.closeTo(110, 1);
      expect(panel.config.size.height).to.be.greaterThan(91);
      expect(panel.config.size.height).to.be.lessThan(101);
    });
    
    it('should maintain same size regardless of brush size changes', function() {
      const control = new BrushSizeControl(1);
      
      const panel = new DraggablePanel({
        id: 'test-brush-size-stable',
        title: 'Brush Size',
        position: { x: 10, y: 10 },
        size: { width: 200, height: 200 },
        buttons: {
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          contentSizeCallback: () => control.getContentSize()
        }
      });
      
      // Initial size
      panel.autoResizeToFitContent();
      const initialWidth = panel.config.size.width;
      const initialHeight = panel.config.size.height;
      
      // Change brush size
      control.setSize(9);
      
      // Resize again
      panel.autoResizeToFitContent();
      
      // Size should remain the same (BrushSizeControl has fixed dimensions)
      expect(panel.config.size.width).to.equal(initialWidth);
      expect(panel.config.size.height).to.equal(initialHeight);
    });
  });
  
  describe('Content Callback Error Handling', function() {
    it('should handle callback that throws error gracefully', function() {
      const panel = new DraggablePanel({
        id: 'test-error-handling',
        title: 'Error Test',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: {
          autoSizeToContent: true,
          contentSizeCallback: () => {
            throw new Error('Test error');
          }
        }
      });
      
      // Should not throw error
      expect(() => panel.autoResizeToFitContent()).to.not.throw();
      
      // Panel size should remain unchanged
      expect(panel.config.size.width).to.equal(100);
      expect(panel.config.size.height).to.equal(100);
    });
    
    it('should handle callback that returns invalid data', function() {
      const panel = new DraggablePanel({
        id: 'test-invalid-data',
        title: 'Invalid Data Test',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: {
          autoSizeToContent: true,
          contentSizeCallback: () => {
            return { width: 'invalid', height: null }; // Invalid types
          }
        }
      });
      
      // Should not throw error
      expect(() => panel.autoResizeToFitContent()).to.not.throw();
      
      // Panel size should remain unchanged (callback returned invalid data)
      expect(panel.config.size.width).to.equal(100);
      expect(panel.config.size.height).to.equal(100);
    });
    
    it('should handle missing callback gracefully', function() {
      const panel = new DraggablePanel({
        id: 'test-no-callback',
        title: 'No Callback Test',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: {
          autoSizeToContent: true,
          items: [] // No callback, no buttons
        }
      });
      
      // Should not throw error
      expect(() => panel.autoResizeToFitContent()).to.not.throw();
    });
  });
  
  describe('Padding Configuration', function() {
    it('should respect custom padding values', function() {
      const control = new BrushSizeControl(3);
      
      const panel = new DraggablePanel({
        id: 'test-custom-padding',
        title: 'Custom Padding',
        position: { x: 10, y: 10 },
        size: { width: 200, height: 200 },
        buttons: {
          autoSizeToContent: true,
          verticalPadding: 20, // Custom padding
          horizontalPadding: 30, // Custom padding
          contentSizeCallback: () => control.getContentSize()
        }
      });
      
      panel.autoResizeToFitContent();
      
      // Expected: width = 90 (content) + 60 (2×30 padding) = 150px
      // Expected: height = ~26.8 (title) + 50 (content) + 40 (2×20 padding) = ~116.8px
      expect(panel.config.size.width).to.be.closeTo(150, 1);
      expect(panel.config.size.height).to.be.greaterThan(111);
      expect(panel.config.size.height).to.be.lessThan(121);
    });
  });
});
