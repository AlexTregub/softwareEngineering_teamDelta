/**
 * @fileoverview Unit tests for SelectionController view integration
 * Tests that selection boxes render correctly through MVC pattern
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('SelectionController View Integration', function() {
  let dom, window, document;
  let EntityModel, EntityView, SelectionController;
  
  before(function() {
    const html = '<!DOCTYPE html><html><body></body></html>';
    dom = new JSDOM(html, { pretendToBeVisual: true });
    window = dom.window;
    document = window.document;
    
    global.window = window;
    global.document = document;
    
    // Mock p5.js functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.noFill = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.rect = sinon.stub();
    global.rectMode = sinon.stub();
    global.line = sinon.stub();
    global.ellipse = sinon.stub();
    global.CENTER = 'CENTER';
    
    // Load classes
    const EntityModelPath = require('path').resolve(__dirname, '../../../Classes/mvc/models/EntityModel.js');
    const EntityViewPath = require('path').resolve(__dirname, '../../../Classes/mvc/views/EntityView.js');
    const SelectionControllerPath = require('path').resolve(__dirname, '../../../Classes/mvc/controllers/SelectionController.js');
    
    delete require.cache[EntityModelPath];
    delete require.cache[EntityViewPath];
    delete require.cache[SelectionControllerPath];
    
    EntityModel = require(EntityModelPath);
    EntityView = require(EntityViewPath);
    SelectionController = require(SelectionControllerPath);
  });

  after(function() {
    delete global.window;
    delete global.document;
    delete global.push;
    delete global.pop;
    delete global.noFill;
    delete global.fill;
    delete global.stroke;
    delete global.strokeWeight;
    delete global.rect;
    delete global.rectMode;
    delete global.line;
    delete global.ellipse;
  });

  beforeEach(function() {
    // Reset all stubs
    global.push.resetHistory();
    global.pop.resetHistory();
    global.noFill.resetHistory();
    global.fill.resetHistory();
    global.stroke.resetHistory();
    global.strokeWeight.resetHistory();
    global.rect.resetHistory();
    global.rectMode.resetHistory();
    global.line.resetHistory();
    global.ellipse.resetHistory();
  });

  describe('Selection Box Rendering', function() {
    it('should render green selection box when selected', function() {
      const model = new EntityModel({ x: 100, y: 100, width: 32, height: 32 });
      const view = new EntityView(model);
      const entity = { model, view };
      const selection = new SelectionController(entity);
      
      // Mock _getScreenPosition to return screen coords
      view._getScreenPosition = sinon.stub().returns({ x: 400, y: 300 });
      
      // Set selected state
      selection.setSelected(true);
      
      // Apply highlighting
      selection.applyHighlighting();
      
      // Verify green stroke was used
      expect(global.stroke.calledWith(0, 255, 0)).to.be.true;
      
      // Verify rect was drawn
      expect(global.rect.called).to.be.true;
      
      // Verify corner lines were drawn (8 lines for 4 corners)
      expect(global.line.callCount).to.equal(8);
      
      // Verify push/pop for state management
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
    });

    it('should render yellow hover box when hovered', function() {
      const model = new EntityModel({ x: 100, y: 100, width: 32, height: 32 });
      const view = new EntityView(model);
      const entity = { model, view };
      const selection = new SelectionController(entity);
      
      view._getScreenPosition = sinon.stub().returns({ x: 400, y: 300 });
      
      // Set hover state
      selection.setHovered(true);
      
      // Apply highlighting
      selection.applyHighlighting();
      
      // Verify yellow fill and stroke were used
      expect(global.fill.calledWith(255, 255, 0, 80)).to.be.true;
      expect(global.stroke.calledWith(255, 255, 0, 200)).to.be.true;
      
      // Verify rect was drawn
      expect(global.rect.called).to.be.true;
    });

    it('should render box hover when boxHovered', function() {
      const model = new EntityModel({ x: 100, y: 100, width: 32, height: 32 });
      const view = new EntityView(model);
      const entity = { model, view };
      const selection = new SelectionController(entity);
      
      view._getScreenPosition = sinon.stub().returns({ x: 400, y: 300 });
      
      // Set box hover state
      selection.setBoxHovered(true);
      
      // Apply highlighting
      selection.applyHighlighting();
      
      // Verify yellow was used
      expect(global.stroke.calledWith(255, 255, 0)).to.be.true;
      
      // Verify rect was drawn
      expect(global.rect.called).to.be.true;
    });

    it('should prioritize selected over hover', function() {
      const model = new EntityModel({ x: 100, y: 100, width: 32, height: 32 });
      const view = new EntityView(model);
      const entity = { model, view };
      const selection = new SelectionController(entity);
      
      view._getScreenPosition = sinon.stub().returns({ x: 400, y: 300 });
      
      // Set both states
      selection.setSelected(true);
      selection.setHovered(true);
      
      // Apply highlighting
      selection.applyHighlighting();
      
      // Should use green (selected), not yellow (hover)
      expect(global.stroke.calledWith(0, 255, 0)).to.be.true;
      
      // Should draw corner lines (selected feature)
      expect(global.line.callCount).to.equal(8);
    });
  });

  describe('Model State Management', function() {
    it('should store selected state in model', function() {
      const model = new EntityModel({ x: 100, y: 100, width: 32, height: 32 });
      const view = new EntityView(model);
      const entity = { model, view };
      const selection = new SelectionController(entity);
      
      expect(model.selected).to.be.false;
      
      selection.setSelected(true);
      expect(model.selected).to.be.true;
      
      selection.setSelected(false);
      expect(model.selected).to.be.false;
    });

    it('should store hovered state in model', function() {
      const model = new EntityModel({ x: 100, y: 100, width: 32, height: 32 });
      const view = new EntityView(model);
      const entity = { model, view };
      const selection = new SelectionController(entity);
      
      expect(model.hovered).to.be.false;
      
      selection.setHovered(true);
      expect(model.hovered).to.be.true;
      
      selection.setHovered(false);
      expect(model.hovered).to.be.false;
    });

    it('should store boxHovered state in model', function() {
      const model = new EntityModel({ x: 100, y: 100, width: 32, height: 32 });
      const view = new EntityView(model);
      const entity = { model, view };
      const selection = new SelectionController(entity);
      
      expect(model.boxHovered).to.be.false;
      
      selection.setBoxHovered(true);
      expect(model.boxHovered).to.be.true;
      
      selection.setBoxHovered(false);
      expect(model.boxHovered).to.be.false;
    });

    it('should update highlight type when state changes', function() {
      const model = new EntityModel({ x: 100, y: 100, width: 32, height: 32 });
      const view = new EntityView(model);
      const entity = { model, view };
      const selection = new SelectionController(entity);
      
      expect(selection.getHighlightType()).to.equal('none');
      
      selection.setHovered(true);
      expect(selection.getHighlightType()).to.equal('hover');
      
      selection.setSelected(true);
      expect(selection.getHighlightType()).to.equal('selected');
      
      selection.setSelected(false);
      expect(selection.getHighlightType()).to.equal('hover');
      
      selection.setHovered(false);
      expect(selection.getHighlightType()).to.equal('none');
    });
  });

  describe('View renders without state mutations', function() {
    it('should not modify model during rendering', function() {
      const model = new EntityModel({ x: 100, y: 100, width: 32, height: 32 });
      const view = new EntityView(model);
      const entity = { model, view };
      const selection = new SelectionController(entity);
      
      view._getScreenPosition = sinon.stub().returns({ x: 400, y: 300 });
      
      const originalSelected = model.selected;
      const originalHovered = model.hovered;
      const originalX = model.position.x;
      const originalY = model.position.y;
      
      selection.setSelected(true);
      selection.applyHighlighting();
      
      // Model state should be updated by controller
      expect(model.selected).to.be.true;
      
      // But position should not change during rendering
      expect(model.position.x).to.equal(originalX);
      expect(model.position.y).to.equal(originalY);
    });
  });
});
