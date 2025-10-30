/**
 * Unit Tests: ToolBar - No Tool Mode
 * 
 * Tests for the "No Tool" default state functionality.
 * When no tool is selected (selectedTool = null), clicking terrain should do nothing.
 * ESC key should deselect the current tool and return to No Tool mode.
 * 
 * TDD Phase: RED (Write failing tests FIRST)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const ToolBar = require('../../../Classes/ui/ToolBar');

describe('ToolBar - No Tool Mode', function() {
  let toolbar;
  let onToolChangeStub;

  beforeEach(function() {
    // Create toolbar instance
    toolbar = new ToolBar();
    
    // Create callback stub
    onToolChangeStub = sinon.stub();
    toolbar.onToolChange = onToolChangeStub;
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Initialization', function() {
    it('should initialize with selectedTool = null (No Tool mode)', function() {
      expect(toolbar.selectedTool).to.be.null;
    });

    it('should return null from getSelectedTool() when no tool selected', function() {
      const tool = toolbar.getSelectedTool();
      expect(tool).to.be.null;
    });

    it('should return false from hasActiveTool() when selectedTool is null', function() {
      expect(toolbar.hasActiveTool()).to.be.false;
    });
  });

  describe('Tool Selection from No Tool Mode', function() {
    it('should select tool when selectTool() called from No Tool mode', function() {
      const result = toolbar.selectTool('brush');
      
      expect(result).to.be.true;
      expect(toolbar.selectedTool).to.equal('brush');
      expect(toolbar.getSelectedTool()).to.equal('brush');
    });

    it('should return true from hasActiveTool() after selecting a tool', function() {
      toolbar.selectTool('brush');
      expect(toolbar.hasActiveTool()).to.be.true;
    });

    it('should call onToolChange callback when selecting from No Tool mode', function() {
      toolbar.selectTool('brush');
      
      expect(onToolChangeStub.calledOnce).to.be.true;
      expect(onToolChangeStub.calledWith('brush', null)).to.be.true;
    });
  });

  describe('deselectTool() Method', function() {
    it('should exist as a method', function() {
      expect(toolbar.deselectTool).to.be.a('function');
    });

    it('should set selectedTool to null', function() {
      // First select a tool (use valid tool name)
      const selectResult = toolbar.selectTool('brush');
      expect(selectResult).to.be.true;
      expect(toolbar.selectedTool).to.equal('brush');
      
      // Then deselect
      toolbar.deselectTool();
      expect(toolbar.selectedTool).to.be.null;
    });

    it('should call onToolChange callback with (null, oldTool)', function() {
      // Select a tool first
      toolbar.selectTool('fill');
      onToolChangeStub.resetHistory();
      
      // Deselect
      toolbar.deselectTool();
      
      expect(onToolChangeStub.calledOnce).to.be.true;
      expect(onToolChangeStub.calledWith(null, 'fill')).to.be.true;
    });

    it('should NOT call onToolChange when already in No Tool mode', function() {
      // Ensure we're in No Tool mode
      expect(toolbar.selectedTool).to.be.null;
      onToolChangeStub.resetHistory();
      
      // Deselect again (already null)
      toolbar.deselectTool();
      
      expect(onToolChangeStub.called).to.be.false;
    });

    it('should handle deselectTool() when onToolChange is null', function() {
      toolbar.selectTool('brush');
      toolbar.onToolChange = null; // No callback
      
      // Should not throw error
      expect(() => toolbar.deselectTool()).to.not.throw();
      expect(toolbar.selectedTool).to.be.null;
    });
  });

  describe('hasActiveTool() Method', function() {
    it('should exist as a method', function() {
      expect(toolbar.hasActiveTool).to.be.a('function');
    });

    it('should return false when selectedTool is null', function() {
      toolbar.selectedTool = null;
      expect(toolbar.hasActiveTool()).to.be.false;
    });

    it('should return true when selectedTool is a tool name', function() {
      toolbar.selectTool('eraser');
      expect(toolbar.hasActiveTool()).to.be.true;
    });

    it('should return false after deselectTool() is called', function() {
      toolbar.selectTool('eyedropper');
      expect(toolbar.hasActiveTool()).to.be.true;
      
      toolbar.deselectTool();
      expect(toolbar.hasActiveTool()).to.be.false;
    });
  });

  describe('Rendering with No Tool', function() {
    beforeEach(function() {
      // Mock p5.js functions
      global.push = sinon.stub();
      global.pop = sinon.stub();
      global.fill = sinon.stub();
      global.stroke = sinon.stub();
      global.strokeWeight = sinon.stub();
      global.rect = sinon.stub();
      global.noStroke = sinon.stub();
      global.textAlign = sinon.stub();
      global.textSize = sinon.stub();
      global.text = sinon.stub();
      global.CENTER = 'center';
    });

    afterEach(function() {
      delete global.push;
      delete global.pop;
      delete global.fill;
      delete global.stroke;
      delete global.strokeWeight;
      delete global.rect;
      delete global.noStroke;
      delete global.textAlign;
      delete global.textSize;
      delete global.text;
      delete global.CENTER;
    });

    it('should render without errors when selectedTool is null', function() {
      expect(toolbar.selectedTool).to.be.null;
      expect(() => toolbar.render(10, 10)).to.not.throw();
    });

    it('should not highlight any button when selectedTool is null', function() {
      toolbar.selectedTool = null;
      toolbar.render(10, 10);
      
      // Check that fill was never called with selection color (100, 150, 255)
      const fillCalls = global.fill.getCalls();
      const selectionColorCalls = fillCalls.filter(call => 
        call.args[0] === 100 && call.args[1] === 150 && call.args[2] === 255
      );
      
      expect(selectionColorCalls.length).to.equal(0);
    });

    it('should highlight button when tool is selected', function() {
      toolbar.selectTool('brush');
      toolbar.render(10, 10);
      
      // Check that fill was called with selection color at least once
      const fillCalls = global.fill.getCalls();
      const selectionColorCalls = fillCalls.filter(call => 
        call.args[0] === 100 && call.args[1] === 150 && call.args[2] === 255
      );
      
      expect(selectionColorCalls.length).to.be.at.least(1);
    });
  });

  describe('Edge Cases', function() {
    it('should handle selectTool() after deselectTool() correctly', function() {
      toolbar.selectTool('paint');
      toolbar.deselectTool();
      toolbar.selectTool('fill');
      
      expect(toolbar.selectedTool).to.equal('fill');
      expect(toolbar.hasActiveTool()).to.be.true;
    });

    it('should handle multiple deselectTool() calls without errors', function() {
      toolbar.selectTool('eraser');
      toolbar.deselectTool();
      
      expect(() => toolbar.deselectTool()).to.not.throw();
      expect(() => toolbar.deselectTool()).to.not.throw();
      expect(toolbar.selectedTool).to.be.null;
    });

    it('should handle hasActiveTool() when selectedTool is undefined', function() {
      toolbar.selectedTool = undefined;
      
      // Should treat undefined as false (no active tool)
      // Note: This tests robustness, but null is the intended value
      expect(toolbar.hasActiveTool()).to.be.false;
    });
  });

  describe('Custom Tool Configs', function() {
    it('should initialize with null when custom tools provided', function() {
      const customToolbar = new ToolBar([
        { name: 'custom1', icon: '🔧', tooltip: 'Custom Tool 1' },
        { name: 'custom2', icon: '🛠️', tooltip: 'Custom Tool 2' }
      ]);
      
      expect(customToolbar.selectedTool).to.be.null;
    });

    it('should allow tool selection and deselection with custom tools', function() {
      const customToolbar = new ToolBar([
        { name: 'custom1', icon: '🔧', tooltip: 'Custom Tool 1' }
      ]);
      
      customToolbar.selectTool('custom1');
      expect(customToolbar.hasActiveTool()).to.be.true;
      
      customToolbar.deselectTool();
      expect(customToolbar.hasActiveTool()).to.be.false;
    });
  });
});
