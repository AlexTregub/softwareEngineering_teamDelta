/**
 * Unit tests for Level Editor Panel Rendering Order
 * 
 * Verifies that panel content (MaterialPalette, ToolBar, BrushSizeControl)
 * is rendered ON TOP of the panel background, not underneath it.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Level Editor Panel Rendering Order', function() {
  let DraggablePanel;
  let renderCallOrder;
  
  beforeEach(function() {
    renderCallOrder = [];
    
    // Mock p5.js rendering functions to track call order
    global.push = sinon.stub().callsFake(() => renderCallOrder.push('push'));
    global.pop = sinon.stub().callsFake(() => renderCallOrder.push('pop'));
    global.fill = sinon.stub().callsFake((...args) => {
      renderCallOrder.push(`fill(${args.join(',')})`);
    });
    global.stroke = sinon.stub().callsFake((...args) => {
      renderCallOrder.push(`stroke(${args.join(',')})`);
    });
    global.strokeWeight = sinon.stub().callsFake((w) => {
      renderCallOrder.push(`strokeWeight(${w})`);
    });
    global.noStroke = sinon.stub();
    global.rect = sinon.stub().callsFake((x, y, w, h) => {
      renderCallOrder.push(`rect(${x},${y},${w},${h})`);
    });
    global.text = sinon.stub().callsFake((txt, x, y) => {
      renderCallOrder.push(`text("${txt}",${x},${y})`);
    });
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.textWidth = sinon.stub().returns(50);
    global.translate = sinon.stub().callsFake((x, y) => {
      renderCallOrder.push(`translate(${x},${y})`);
    });
    global.line = sinon.stub().callsFake((x1, y1, x2, y2) => {
      renderCallOrder.push(`line(${x1},${y1},${x2},${y2})`);
    });
    global.noFill = sinon.stub();
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';
    
    // Mock window and localStorage
    global.window = { innerWidth: 1920, innerHeight: 1080 };
    global.localStorage = {
      getItem: sinon.stub().returns(null),
      setItem: sinon.stub()
    };
    global.devConsoleEnabled = false;
    
    // Load DraggablePanel
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    global.DraggablePanel = DraggablePanel;
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Panel Background vs Content Rendering Order', function() {
    it('should render background before content', function() {
      const panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      let contentRendered = false;
      const contentRenderer = () => {
        renderCallOrder.push('CONTENT_CALLBACK');
        contentRendered = true;
      };
      
      renderCallOrder = [];
      panel.render(contentRenderer);
      
      // Find indices of background rect and content callback
      const backgroundIndex = renderCallOrder.findIndex(call => call.startsWith('rect(10,10'));
      const contentIndex = renderCallOrder.indexOf('CONTENT_CALLBACK');
      
      expect(contentRendered).to.be.true;
      expect(backgroundIndex).to.be.greaterThan(-1, 'Background rect should be drawn');
      expect(contentIndex).to.be.greaterThan(-1, 'Content callback should be called');
      expect(backgroundIndex).to.be.lessThan(contentIndex, 'Background should be drawn BEFORE content');
    });
    
    it('should render title bar before content', function() {
      const panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Materials',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      let contentRendered = false;
      const contentRenderer = () => {
        renderCallOrder.push('CONTENT_CALLBACK');
        contentRendered = true;
      };
      
      renderCallOrder = [];
      panel.render(contentRenderer);
      
      // Find indices of title text and content callback
      const titleIndex = renderCallOrder.findIndex(call => call.includes('text("Materials"'));
      const contentIndex = renderCallOrder.indexOf('CONTENT_CALLBACK');
      
      expect(contentRendered).to.be.true;
      expect(titleIndex).to.be.greaterThan(-1, 'Title should be drawn');
      expect(contentIndex).to.be.greaterThan(-1, 'Content callback should be called');
      expect(titleIndex).to.be.lessThan(contentIndex, 'Title should be drawn BEFORE content');
    });
    
    it('should call content renderer with correct content area coordinates', function() {
      const panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      let contentArea = null;
      const contentRenderer = (area) => {
        contentArea = area;
      };
      
      panel.render(contentRenderer);
      
      expect(contentArea).to.exist;
      expect(contentArea.x).to.be.greaterThan(10, 'Content X should include left padding');
      expect(contentArea.y).to.be.greaterThan(80, 'Content Y should include title bar and top padding');
    });
    
    it('should use push/pop to isolate content rendering', function() {
      const panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      const contentRenderer = () => {
        renderCallOrder.push('CONTENT_START');
        // Simulate content rendering with translate
        if (typeof translate === 'function') {
          translate(5, 5);
        }
        renderCallOrder.push('CONTENT_END');
      };
      
      renderCallOrder = [];
      panel.render(contentRenderer);
      
      const firstPush = renderCallOrder.indexOf('push');
      const contentStart = renderCallOrder.indexOf('CONTENT_START');
      const contentEnd = renderCallOrder.indexOf('CONTENT_END');
      const lastPop = renderCallOrder.lastIndexOf('pop');
      
      expect(firstPush).to.be.lessThan(contentStart, 'push() before content');
      expect(contentEnd).to.be.lessThan(lastPop, 'pop() after content');
    });
  });
  
  describe('Minimized Panel Rendering', function() {
    it('should NOT call content renderer when panel is minimized', function() {
      const panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      panel.state.minimized = true;
      
      let contentRendered = false;
      const contentRenderer = () => {
        contentRendered = true;
      };
      
      panel.render(contentRenderer);
      
      expect(contentRendered).to.be.false;
    });
    
    it('should render background and title even when minimized', function() {
      const panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      panel.state.minimized = true;
      
      renderCallOrder = [];
      panel.render();
      
      const hasBackground = renderCallOrder.some(call => call.startsWith('rect('));
      const hasTitle = renderCallOrder.some(call => call.includes('text('));
      
      expect(hasBackground).to.be.true;
      expect(hasTitle).to.be.true;
    });
  });
  
  describe('Level Editor Panel Specific Tests', function() {
    it('should render MaterialPalette content on top of panel background', function() {
      const panel = new DraggablePanel({
        id: 'level-editor-materials',
        title: 'Materials',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        buttons: {
          layout: 'vertical',
          spacing: 0,
          items: [],
          managedExternally: true
        }
      });
      
      const contentRenderer = (contentArea) => {
        renderCallOrder.push('MATERIAL_PALETTE_START');
        // Simulate MaterialPalette rendering
        fill(0, 128, 0); // Green material
        rect(contentArea.x, contentArea.y, 40, 40);
        renderCallOrder.push('MATERIAL_PALETTE_END');
      };
      
      renderCallOrder = [];
      panel.render(contentRenderer);
      
      // Find panel background and material palette
      const panelBgIndex = renderCallOrder.findIndex(call => call.startsWith('rect(10,80'));
      const materialStartIndex = renderCallOrder.indexOf('MATERIAL_PALETTE_START');
      const materialEndIndex = renderCallOrder.indexOf('MATERIAL_PALETTE_END');
      
      expect(panelBgIndex).to.be.greaterThan(-1);
      expect(materialStartIndex).to.be.greaterThan(-1);
      expect(materialEndIndex).to.be.greaterThan(-1);
      expect(panelBgIndex).to.be.lessThan(materialStartIndex, 'Panel background before material palette');
      expect(materialStartIndex).to.be.lessThan(materialEndIndex, 'Material palette rendering sequence');
    });
  });
});
