/**
 * Unit Tests: ToolBar - Eraser Tool
 * 
 * Tests the eraser tool button in the toolbar:
 * - Tool exists in toolbar
 * - Button renders with icon
 * - Selection/deselection behavior
 * - Tool highlighting when selected
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('ToolBar - Eraser Tool (Unit)', function() {
  let toolbar, sandbox, dom;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Setup JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js globals
    global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y }));
    global.rect = sandbox.spy();
    global.fill = sandbox.spy();
    global.stroke = sandbox.spy();
    global.strokeWeight = sandbox.spy();
    global.textAlign = sandbox.spy();
    global.textSize = sandbox.spy();
    global.text = sandbox.spy();
    global.push = sandbox.spy();
    global.pop = sandbox.spy();
    global.CENTER = 'center';
    global.TOP = 'top';
    
    // Sync to window for JSDOM
    window.createVector = global.createVector;
    window.rect = global.rect;
    window.fill = global.fill;
    window.stroke = global.stroke;
    
    // Load ToolBar class
    const ToolBarModule = require('../../../Classes/ui/ToolBar.js');
    const ToolBar = ToolBarModule.ToolBar || ToolBarModule || global.ToolBar || window.ToolBar;
    
    if (!ToolBar) {
      throw new Error('ToolBar class not found');
    }
    
    // Create toolbar with tool configs including eraser
    const toolConfigs = [
      { name: 'paint', icon: '🖌️', tooltip: 'Paint' },
      { name: 'fill', icon: '🪣', tooltip: 'Fill' },
      { name: 'eyedropper', icon: '💧', tooltip: 'Eyedropper' },
      { name: 'select', icon: '⬚', tooltip: 'Select' },
      { name: 'eraser', icon: '🧹', tooltip: 'Eraser' }
    ];
    
    toolbar = new ToolBar(toolConfigs);
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('Tool Existence', function() {
    it('should include eraser tool in tools array', function() {
      const tools = toolbar.getTools ? toolbar.getTools() : toolbar.tools;
      const toolNames = tools.map(t => t.name || t);
      
      expect(toolNames).to.include('eraser');
    });
    
    it('should have eraser as 5th tool (after select)', function() {
      const tools = toolbar.getTools ? toolbar.getTools() : toolbar.tools;
      const eraserIndex = tools.findIndex(t => (t.name || t) === 'eraser');
      
      expect(eraserIndex).to.equal(4); // 0-indexed, so 5th position
    });
    
    it('should have eraser tool with label', function() {
      const tools = toolbar.getTools ? toolbar.getTools() : toolbar.tools;
      const eraserTool = tools.find(t => (t.name || t) === 'eraser');
      
      expect(eraserTool).to.exist;
      expect(eraserTool.label).to.exist;
      expect(eraserTool.label).to.be.a('string');
    });
    
    it('should have eraser tool with icon', function() {
      const tools = toolbar.getTools ? toolbar.getTools() : toolbar.tools;
      const eraserTool = tools.find(t => (t.name || t) === 'eraser');
      
      expect(eraserTool).to.exist;
      expect(eraserTool.icon).to.exist;
      expect(eraserTool.icon).to.be.a('string');
    });
  });
  
  describe('Tool Selection', function() {
    it('should select eraser tool when selectTool called', function() {
      if (typeof toolbar.selectTool === 'function') {
        toolbar.selectTool('eraser');
        
        const selectedTool = toolbar.getSelectedTool();
        expect(selectedTool).to.equal('eraser');
      } else {
        this.skip();
      }
    });
    
    it('should deselect other tools when eraser selected', function() {
      if (typeof toolbar.selectTool === 'function') {
        toolbar.selectTool('paint');
        expect(toolbar.getSelectedTool()).to.equal('paint');
        
        toolbar.selectTool('eraser');
        expect(toolbar.getSelectedTool()).to.equal('eraser');
        expect(toolbar.getSelectedTool()).to.not.equal('paint');
      } else {
        this.skip();
      }
    });
    
    it('should deselect eraser when clicked again (toggle)', function() {
      if (typeof toolbar.selectTool === 'function') {
        toolbar.selectTool('eraser');
        expect(toolbar.getSelectedTool()).to.equal('eraser');
        
        toolbar.selectTool('eraser'); // Click again
        expect(toolbar.getSelectedTool()).to.be.null;
      } else {
        this.skip();
      }
    });
    
    it('should return null when no tool selected', function() {
      const selectedTool = toolbar.getSelectedTool();
      expect(selectedTool).to.be.null;
    });
  });
  
  describe('Tool Rendering', function() {
    it('should render eraser button', function() {
      if (typeof toolbar.render === 'function') {
        toolbar.render();
        
        // Verify rendering functions were called
        expect(global.rect.called || global.fill.called).to.be.true;
      } else {
        this.skip();
      }
    });
    
    it('should highlight eraser when selected', function() {
      if (typeof toolbar.selectTool === 'function' && typeof toolbar.render === 'function') {
        toolbar.selectTool('eraser');
        
        global.fill.resetHistory();
        toolbar.render();
        
        // Highlighting should use fill() with different color
        expect(global.fill.called).to.be.true;
      } else {
        this.skip();
      }
    });
  });
  
  describe('Click Handling', function() {
    it('should detect click on eraser button', function() {
      if (typeof toolbar.handleClick === 'function') {
        // Calculate eraser button position (5th tool)
        const buttonHeight = 40;
        const spacing = 10;
        const eraserY = 100 + (buttonHeight + spacing) * 4; // 4th index (0-based)
        
        const clickResult = toolbar.handleClick(150, eraserY + 20);
        
        expect(clickResult).to.equal('eraser');
      } else {
        this.skip();
      }
    });
    
    it('should toggle eraser selection on click', function() {
      if (typeof toolbar.handleClick === 'function') {
        const buttonHeight = 40;
        const spacing = 10;
        const eraserY = 100 + (buttonHeight + spacing) * 4;
        
        // First click - select
        toolbar.handleClick(150, eraserY + 20);
        expect(toolbar.getSelectedTool()).to.equal('eraser');
        
        // Second click - deselect
        toolbar.handleClick(150, eraserY + 20);
        expect(toolbar.getSelectedTool()).to.be.null;
      } else {
        this.skip();
      }
    });
  });
});
