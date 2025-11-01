/**
 * ToolBar Click Handling Tests
 * Tests for toolbar click detection with array-based tool configuration
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('ToolBar Click Handling', function() {
  let ToolBar;
  
  before(function() {
    // Mock p5.js globals
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.noStroke = sinon.stub();
    global.stroke = sinon.stub();
    global.rect = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.text = sinon.stub();
    global.CENTER = 'CENTER';
    global.LEFT = 'LEFT';
    
    // Load ToolBar
    const ToolBarModule = require('../../../Classes/ui/ToolBar');
    ToolBar = ToolBarModule.ToolBar || ToolBarModule;
  });
  
  afterEach(function() {
    sinon.resetHistory();
  });
  
  after(function() {
    sinon.restore();
  });
  
  describe('getAllTools() with array-based config', function() {
    it('should return tool names, not array indices', function() {
      const toolConfigs = [
        { name: 'paint', icon: '🖌️' },
        { name: 'eraser', icon: '🧱' },
        { name: 'fill', icon: '🪣' }
      ];
      
      const toolbar = new ToolBar(toolConfigs);
      const allTools = toolbar.getAllTools();
      
      expect(allTools).to.be.an('array');
      expect(allTools).to.include('paint');
      expect(allTools).to.include('eraser');
      expect(allTools).to.include('fill');
      expect(allTools).to.not.include('0');
      expect(allTools).to.not.include('1');
      expect(allTools).to.not.include('2');
    });
    
    it('should return correct number of tools', function() {
      const toolConfigs = [
        { name: 'paint', icon: '🖌️' },
        { name: 'select', icon: '⬚' }
      ];
      
      const toolbar = new ToolBar(toolConfigs);
      const allTools = toolbar.getAllTools();
      
      expect(allTools.length).to.equal(2);
    });
  });
  
  describe('handleClick() with array-based config', function() {
    it('should detect click on first tool button', function() {
      const toolConfigs = [
        { name: 'paint', icon: '🖌️', id: 'paint', group: 'drawing' },
        { name: 'eraser', icon: '🧱', id: 'eraser', group: 'drawing' }
      ];
      
      const toolbar = new ToolBar(toolConfigs);
      
      // Panel at (100, 100), first button at (105, 105), size 35x35
      const clicked = toolbar.handleClick(120, 120, 100, 100);
      
      expect(clicked).to.equal('paint');
      expect(toolbar.activeTool).to.equal('paint');
    });
    
    it('should detect click on second tool button', function() {
      const toolConfigs = [
        { name: 'paint', icon: '🖌️', id: 'paint', group: 'drawing' },
        { name: 'eraser', icon: '🧱', id: 'eraser', group: 'drawing' }
      ];
      
      const toolbar = new ToolBar(toolConfigs);
      
      // Panel at (100, 100)
      // First button: y = 105, height 35, spacing 5
      // Second button: y = 105 + 35 + 5 = 145
      const clicked = toolbar.handleClick(120, 150, 100, 100);
      
      expect(clicked).to.equal('eraser');
      expect(toolbar.activeTool).to.equal('eraser');
    });
    
    it('should return null for click outside buttons', function() {
      const toolConfigs = [
        { name: 'paint', icon: '🖌️', id: 'paint' }
      ];
      
      const toolbar = new ToolBar(toolConfigs);
      
      // Click far away from panel
      const clicked = toolbar.handleClick(500, 500, 100, 100);
      
      expect(clicked).to.be.null;
      expect(toolbar.activeTool).to.be.null;
    });
    
    it('should call onClick callback for custom buttons', function() {
      const onClickSpy = sinon.spy();
      const toolConfigs = [
        { 
          name: 'events', 
          icon: '🚩', 
          id: 'events',
          onClick: onClickSpy 
        }
      ];
      
      const toolbar = new ToolBar(toolConfigs);
      
      // Click on events button
      toolbar.handleClick(120, 120, 100, 100);
      
      expect(onClickSpy.calledOnce).to.be.true;
    });
    
    it('should handle tools with modes correctly', function() {
      const toolConfigs = [
        { 
          name: 'eraser', 
          icon: '🧱', 
          id: 'eraser',
          group: 'drawing',
          hasModes: true,
          modes: ['ALL', 'TERRAIN', 'ENTITY']
        }
      ];
      
      const toolbar = new ToolBar(toolConfigs);
      
      // Click on eraser button
      const clicked = toolbar.handleClick(120, 120, 100, 100);
      
      expect(clicked).to.equal('eraser');
      expect(toolbar.activeTool).to.equal('eraser');
      expect(toolbar.activeMode).to.equal('ALL'); // Default to first mode
    });
  });
  
  describe('containsPoint() with array-based config', function() {
    it('should return true for point within toolbar bounds', function() {
      const toolConfigs = [
        { name: 'paint', icon: '🖌️' },
        { name: 'eraser', icon: '🧱' }
      ];
      
      const toolbar = new ToolBar(toolConfigs);
      
      // Panel at (100, 100), point inside
      const contains = toolbar.containsPoint(120, 120, 100, 100);
      
      expect(contains).to.be.true;
    });
    
    it('should return false for point outside toolbar bounds', function() {
      const toolConfigs = [
        { name: 'paint', icon: '🖌️' }
      ];
      
      const toolbar = new ToolBar(toolConfigs);
      
      // Panel at (100, 100), point far outside
      const contains = toolbar.containsPoint(500, 500, 100, 100);
      
      expect(contains).to.be.false;
    });
  });
  
  describe('Tool lookup with array-based config', function() {
    it('should find tool by name in array', function() {
      const toolConfigs = [
        { name: 'paint', icon: '🖌️', id: 'paint' },
        { name: 'eraser', icon: '🧱', id: 'eraser' }
      ];
      
      const toolbar = new ToolBar(toolConfigs);
      
      // Should be able to select tools by name
      const selected = toolbar.selectTool('eraser');
      
      expect(selected).to.be.true;
      expect(toolbar.activeTool).to.equal('eraser');
    });
    
    it('should return false for non-existent tool', function() {
      const toolConfigs = [
        { name: 'paint', icon: '🖌️', id: 'paint' }
      ];
      
      const toolbar = new ToolBar(toolConfigs);
      
      const selected = toolbar.selectTool('nonexistent');
      
      expect(selected).to.be.false;
      expect(toolbar.activeTool).to.be.null;
    });
  });
});
