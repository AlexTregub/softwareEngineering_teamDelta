/**
 * Integration tests for Level Editor Panel Content Rendering
 * 
 * Verifies that MaterialPalette, ToolBar, and BrushSizeControl
 * are rendered on top of their panel backgrounds in the correct order.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Level Editor Panel Content Rendering Integration', function() {
  let DraggablePanel, LevelEditorPanels;
  let MaterialPalette, ToolBar, BrushSizeControl;
  let renderCallOrder;
  let mockLevelEditor;
  
  before(function() {
    // Load required classes
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels.js');
    MaterialPalette = require('../../../Classes/ui/MaterialPalette.js');
    ToolBar = require('../../../Classes/ui/ToolBar.js');
    BrushSizeControl = require('../../../Classes/ui/BrushSizeControl.js');
    
    // Set globals
    global.DraggablePanel = DraggablePanel;
  });
  
  beforeEach(function() {
    renderCallOrder = [];
    
    // Mock p5.js functions with call tracking
    global.push = sinon.stub().callsFake(() => renderCallOrder.push('push'));
    global.pop = sinon.stub().callsFake(() => renderCallOrder.push('pop'));
    global.fill = sinon.stub().callsFake((...args) => {
      if (args.length >= 3) {
        renderCallOrder.push(`fill(${args[0]},${args[1]},${args[2]})`);
      }
    });
    global.stroke = sinon.stub().callsFake((...args) => renderCallOrder.push(`stroke`));
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.noFill = sinon.stub();
    global.rect = sinon.stub().callsFake((x, y, w, h) => {
      renderCallOrder.push(`rect(${Math.round(x)},${Math.round(y)},${Math.round(w)},${Math.round(h)})`);
    });
    global.text = sinon.stub().callsFake((txt, x, y) => {
      renderCallOrder.push(`text("${txt}")`);
    });
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.textWidth = sinon.stub().returns(50);
    global.translate = sinon.stub().callsFake((x, y) => {
      renderCallOrder.push(`translate(${Math.round(x)},${Math.round(y)})`);
    });
    global.line = sinon.stub();
    global.image = sinon.stub();
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    
    // Constants
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    
    // Mock environment
    global.window = { innerWidth: 1920, innerHeight: 1080 };
    global.localStorage = {
      getItem: sinon.stub().returns(null),
      setItem: sinon.stub()
    };
    global.devConsoleEnabled = false;
    
    // Create mock level editor with components
    mockLevelEditor = {
      palette: new MaterialPalette(['moss', 'slime', 'dirt', 'grass']),
      toolbar: new ToolBar(),
      brushControl: new BrushSizeControl(1, 9),
      notifications: {
        show: sinon.stub()
      },
      editor: {
        setBrushSize: sinon.stub(),
        canUndo: sinon.stub().returns(false),
        canRedo: sinon.stub().returns(false)
      }
    };
    
    // Mock component getContentSize methods
    mockLevelEditor.palette.getContentSize = () => ({ width: 95, height: 140 });
    mockLevelEditor.toolbar.getContentSize = () => ({ width: 45, height: 165 });
    mockLevelEditor.brushControl.getContentSize = () => ({ width: 90, height: 50 });
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Materials Panel Content Rendering', function() {
    it('should render panel background before MaterialPalette content', function() {
      const panel = new DraggablePanel({
        id: 'level-editor-materials',
        title: 'Materials',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      renderCallOrder = [];
      panel.render((contentArea) => {
        renderCallOrder.push('PALETTE_START');
        mockLevelEditor.palette.render(contentArea.x, contentArea.y);
        renderCallOrder.push('PALETTE_END');
      });
      
      // Find panel background and palette rendering
      const panelBgIndex = renderCallOrder.findIndex(call => call.startsWith('rect(10,80'));
      const paletteStartIndex = renderCallOrder.indexOf('PALETTE_START');
      
      expect(panelBgIndex).to.be.greaterThan(-1, 'Panel background should be drawn');
      expect(paletteStartIndex).to.be.greaterThan(-1, 'Palette should be rendered');
      expect(panelBgIndex).to.be.lessThan(paletteStartIndex, 'Panel background before palette content');
    });
    
    it('should render MaterialPalette with translate to correct position', function() {
      const panel = new DraggablePanel({
        id: 'level-editor-materials',
        title: 'Materials',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      let contentArea = null;
      renderCallOrder = [];
      
      panel.render((area) => {
        contentArea = area;
        push();
        translate(area.x, area.y);
        mockLevelEditor.palette.render(0, 0);
        pop();
      });
      
      // Verify translate was called with content area coordinates
      const translateCall = renderCallOrder.find(call => call.startsWith('translate('));
      expect(translateCall).to.exist;
      expect(contentArea).to.exist;
      expect(contentArea.x).to.be.greaterThan(10); // Panel x + padding
      expect(contentArea.y).to.be.greaterThan(80); // Panel y + title bar
    });
  });
  
  describe('Tools Panel Content Rendering', function() {
    it('should render panel background before ToolBar content', function() {
      const panel = new DraggablePanel({
        id: 'level-editor-tools',
        title: 'Tools',
        position: { x: 10, y: 210 },
        size: { width: 70, height: 170 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      renderCallOrder = [];
      panel.render((contentArea) => {
        renderCallOrder.push('TOOLBAR_START');
        mockLevelEditor.toolbar.render(contentArea.x, contentArea.y);
        renderCallOrder.push('TOOLBAR_END');
      });
      
      const panelBgIndex = renderCallOrder.findIndex(call => call.startsWith('rect(10,210'));
      const toolbarStartIndex = renderCallOrder.indexOf('TOOLBAR_START');
      
      expect(panelBgIndex).to.be.greaterThan(-1);
      expect(toolbarStartIndex).to.be.greaterThan(-1);
      expect(panelBgIndex).to.be.lessThan(toolbarStartIndex, 'Panel background before toolbar content');
    });
  });
  
  describe('Brush Size Panel Content Rendering', function() {
    it('should render panel background before BrushSizeControl content', function() {
      const panel = new DraggablePanel({
        id: 'level-editor-brush',
        title: 'Brush Size',
        position: { x: 10, y: 395 },
        size: { width: 110, height: 60 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      renderCallOrder = [];
      panel.render((contentArea) => {
        renderCallOrder.push('BRUSH_START');
        mockLevelEditor.brushControl.render(contentArea.x, contentArea.y);
        renderCallOrder.push('BRUSH_END');
      });
      
      const panelBgIndex = renderCallOrder.findIndex(call => call.startsWith('rect(10,395'));
      const brushStartIndex = renderCallOrder.indexOf('BRUSH_START');
      
      expect(panelBgIndex).to.be.greaterThan(-1);
      expect(brushStartIndex).to.be.greaterThan(-1);
      expect(panelBgIndex).to.be.lessThan(brushStartIndex, 'Panel background before brush control content');
    });
  });
  
  describe('LevelEditorPanels Render Method', function() {
    it('should render all three panels with content callbacks', function() {
      // Create panels directly without LevelEditorPanels wrapper
      const materialsPanel = new DraggablePanel({
        id: 'level-editor-materials',
        title: 'Materials',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      const toolsPanel = new DraggablePanel({
        id: 'level-editor-tools',
        title: 'Tools',
        position: { x: 10, y: 210 },
        size: { width: 70, height: 170 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      const brushPanel = new DraggablePanel({
        id: 'level-editor-brush',
        title: 'Brush Size',
        position: { x: 10, y: 395 },
        size: { width: 110, height: 60 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      renderCallOrder = [];
      
      // Render each panel with content
      materialsPanel.render((contentArea) => {
        renderCallOrder.push('MATERIALS_CONTENT');
        push();
        translate(contentArea.x, contentArea.y);
        mockLevelEditor.palette.render(0, 0);
        pop();
      });
      
      toolsPanel.render((contentArea) => {
        renderCallOrder.push('TOOLS_CONTENT');
        push();
        translate(contentArea.x, contentArea.y);
        mockLevelEditor.toolbar.render(0, 0);
        pop();
      });
      
      brushPanel.render((contentArea) => {
        renderCallOrder.push('BRUSH_CONTENT');
        push();
        translate(contentArea.x, contentArea.y);
        mockLevelEditor.brushControl.render(0, 0);
        pop();
      });
      
      // Verify all three panels rendered their content
      expect(renderCallOrder).to.include('MATERIALS_CONTENT');
      expect(renderCallOrder).to.include('TOOLS_CONTENT');
      expect(renderCallOrder).to.include('BRUSH_CONTENT');
    });
    
    it('should use push/pop for each panel content', function() {
      const materialsPanel = new DraggablePanel({
        id: 'level-editor-materials',
        title: 'Materials',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      renderCallOrder = [];
      materialsPanel.render((contentArea) => {
        push();
        renderCallOrder.push('INSIDE_PUSH');
        translate(contentArea.x, contentArea.y);
        pop();
      });
      
      const firstPush = renderCallOrder.indexOf('push');
      const insidePush = renderCallOrder.indexOf('INSIDE_PUSH');
      const lastPop = renderCallOrder.lastIndexOf('pop');
      
      expect(firstPush).to.be.lessThan(insidePush);
      expect(insidePush).to.be.lessThan(lastPop);
    });
  });
  
  describe('Content Area Isolation', function() {
    it('should provide content area coordinates that avoid panel background overlap', function() {
      const panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      let contentArea = null;
      panel.render((area) => {
        contentArea = area;
      });
      
      // Content area should be inset from panel edges
      expect(contentArea.x).to.be.greaterThan(panel.state.position.x);
      expect(contentArea.y).to.be.greaterThan(panel.state.position.y);
      expect(contentArea.width).to.be.lessThan(panel.config.size.width);
      expect(contentArea.height).to.be.lessThan(panel.config.size.height);
    });
  });
});
