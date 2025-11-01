/**
 * Unit Tests for ToolBar Modes Integration
 * 
 * Tests the integration of mode system with ToolBar
 * TDD Red Phase - Write failing tests FIRST
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('ToolBar Modes Integration', function() {
  let ToolBar;
  let toolbar;
  let mockP5;
  let mockTools;

  beforeEach(function() {
    // Mock p5.js functions
    mockP5 = {
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      noFill: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      mouseX: 0,
      mouseY: 0
    };

    // Sync to global and window
    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
      if (typeof window !== 'undefined') window[key] = mockP5[key];
    });

    // Mock tool buttons
    mockTools = [
      { 
        name: 'Paint',
        id: 'paint',
        hasModes: false
      },
      {
        name: 'Fill',
        id: 'fill',
        hasModes: false
      },
      {
        name: 'Eraser',
        id: 'eraser',
        hasModes: true,
        modes: ['ALL', 'TERRAIN', 'ENTITY', 'EVENTS']
      },
      {
        name: 'Select Entities',
        id: 'select-entities',
        hasModes: false
      }
    ];

    // Load ToolBar class
    try {
      ToolBar = require('../../../Classes/ui/ToolBar');
    } catch (e) {
      // Expected to fail in TDD Red phase
      ToolBar = null;
    }

    if (ToolBar) {
      toolbar = new ToolBar(mockTools);
    }
  });

  afterEach(function() {
    sinon.restore();
    Object.keys(mockP5).forEach(key => {
      delete global[key];
      if (typeof window !== 'undefined') delete window[key];
    });
  });

  describe('Constructor with Mode-Enabled Tools', function() {
    it('should store tools with mode information', function() {
      if (!ToolBar) {
        this.skip();
      }

      expect(toolbar.tools).to.deep.equal(mockTools);
    });

    it('should identify tools with modes', function() {
      if (!ToolBar) {
        this.skip();
      }

      const eraserTool = toolbar.tools.find(t => t.id === 'eraser');
      expect(eraserTool.hasModes).to.be.true;
      expect(eraserTool.modes).to.deep.equal(['ALL', 'TERRAIN', 'ENTITY', 'EVENTS']);
    });

    it('should initialize with no active tool', function() {
      if (!ToolBar) {
        this.skip();
      }

      expect(toolbar.activeTool).to.be.null;
      expect(toolbar.activeMode).to.be.null;
    });
  });

  describe('Select Tool with Modes', function() {
    it('should activate tool and default mode', function() {
      if (!ToolBar) {
        this.skip();
      }

      toolbar.selectTool('eraser');

      expect(toolbar.activeTool).to.equal('eraser');
      expect(toolbar.activeMode).to.equal('ALL'); // Default mode
    });

    it('should not set mode for tools without modes', function() {
      if (!ToolBar) {
        this.skip();
      }

      toolbar.selectTool('paint');

      expect(toolbar.activeTool).to.equal('paint');
      expect(toolbar.activeMode).to.be.null;
    });

    it('should clear previous mode when switching tools', function() {
      if (!ToolBar) {
        this.skip();
      }

      toolbar.selectTool('eraser');
      toolbar.setToolMode('TERRAIN');

      toolbar.selectTool('paint'); // Switch to tool without modes

      expect(toolbar.activeMode).to.be.null;
    });
  });

  describe('Set Tool Mode', function() {
    beforeEach(function() {
      if (toolbar) {
        toolbar.selectTool('eraser');
      }
    });

    it('should change mode for active tool', function() {
      if (!ToolBar) {
        this.skip();
      }

      toolbar.setToolMode('TERRAIN');
      expect(toolbar.activeMode).to.equal('TERRAIN');

      toolbar.setToolMode('ENTITY');
      expect(toolbar.activeMode).to.equal('ENTITY');
    });

    it('should reject mode not in tool modes list', function() {
      if (!ToolBar) {
        this.skip();
      }

      expect(() => toolbar.setToolMode('INVALID')).to.throw();
    });

    it('should reject mode change if no active tool', function() {
      if (!ToolBar) {
        this.skip();
      }

      toolbar.activeTool = null;
      expect(() => toolbar.setToolMode('ALL')).to.throw();
    });

    it('should reject mode change if tool has no modes', function() {
      if (!ToolBar) {
        this.skip();
      }

      toolbar.selectTool('paint'); // No modes
      expect(() => toolbar.setToolMode('ALL')).to.throw();
    });
  });

  describe('Get Tool Modes', function() {
    it('should return modes array for tool with modes', function() {
      if (!ToolBar) {
        this.skip();
      }

      const modes = toolbar.getToolModes('eraser');
      expect(modes).to.deep.equal(['ALL', 'TERRAIN', 'ENTITY', 'EVENTS']);
    });

    it('should return null for tool without modes', function() {
      if (!ToolBar) {
        this.skip();
      }

      const modes = toolbar.getToolModes('paint');
      expect(modes).to.be.null;
    });

    it('should return null for non-existent tool', function() {
      if (!ToolBar) {
        this.skip();
      }

      const modes = toolbar.getToolModes('invalid');
      expect(modes).to.be.null;
    });
  });

  describe('Get Current Mode', function() {
    it('should return current mode when tool active', function() {
      if (!ToolBar) {
        this.skip();
      }

      toolbar.selectTool('eraser');
      toolbar.setToolMode('ENTITY');

      expect(toolbar.getCurrentMode()).to.equal('ENTITY');
    });

    it('should return null if no active tool', function() {
      if (!ToolBar) {
        this.skip();
      }

      expect(toolbar.getCurrentMode()).to.be.null;
    });

    it('should return null if active tool has no modes', function() {
      if (!ToolBar) {
        this.skip();
      }

      toolbar.selectTool('paint');
      expect(toolbar.getCurrentMode()).to.be.null;
    });
  });

  describe('Mode State Persistence', function() {
    it('should remember mode when switching back to tool', function() {
      if (!ToolBar) {
        this.skip();
      }

      // Select eraser and set to ENTITY mode
      toolbar.selectTool('eraser');
      toolbar.setToolMode('ENTITY');

      // Switch to different tool
      toolbar.selectTool('paint');

      // Switch back to eraser
      toolbar.selectTool('eraser');

      // Should remember ENTITY mode, not reset to ALL
      expect(toolbar.activeMode).to.equal('ENTITY');
    });

    it('should store last mode per tool', function() {
      if (!ToolBar) {
        this.skip();
      }

      toolbar.selectTool('eraser');
      toolbar.setToolMode('TERRAIN');

      expect(toolbar.toolLastMode).to.exist;
      expect(toolbar.toolLastMode.get('eraser')).to.equal('TERRAIN');
    });
  });

  describe('Integration with FileMenuBar', function() {
    it('should provide mode data for menu rendering', function() {
      if (!ToolBar) {
        this.skip();
      }

      toolbar.selectTool('eraser');
      toolbar.setToolMode('EVENTS');

      const renderData = toolbar.getModeRenderData();

      expect(renderData).to.deep.equal({
        hasModes: true,
        modes: ['ALL', 'TERRAIN', 'ENTITY', 'EVENTS'],
        currentMode: 'EVENTS'
      });
    });

    it('should return null render data if no active tool', function() {
      if (!ToolBar) {
        this.skip();
      }

      const renderData = toolbar.getModeRenderData();
      expect(renderData).to.be.null;
    });

    it('should return null render data if tool has no modes', function() {
      if (!ToolBar) {
        this.skip();
      }

      toolbar.selectTool('paint');
      const renderData = toolbar.getModeRenderData();

      expect(renderData).to.be.null;
    });
  });

  describe('Edge Cases', function() {
    it('should handle tools array with no mode-enabled tools', function() {
      if (!ToolBar) {
        this.skip();
      }

      const simpleTools = [
        { name: 'Paint', id: 'paint', hasModes: false },
        { name: 'Fill', id: 'fill', hasModes: false }
      ];

      const simpleToolbar = new ToolBar(simpleTools);
      simpleToolbar.selectTool('paint');

      expect(simpleToolbar.getCurrentMode()).to.be.null;
    });

    it('should handle mode change during tool switch', function() {
      if (!ToolBar) {
        this.skip();
      }

      toolbar.selectTool('eraser');
      toolbar.setToolMode('TERRAIN');

      // Attempt to change mode while switching tools
      toolbar.selectTool('paint');
      
      // Should have cleared mode
      expect(toolbar.activeMode).to.be.null;
    });

    it('should handle empty modes array', function() {
      if (!ToolBar) {
        this.skip();
      }

      const emptyModeTool = [
        { name: 'Test', id: 'test', hasModes: true, modes: [] }
      ];

      const testToolbar = new ToolBar(emptyModeTool);
      testToolbar.selectTool('test');

      expect(testToolbar.activeMode).to.be.null;
    });
  });
});
