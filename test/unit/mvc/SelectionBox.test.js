/**
 * @fileoverview Unit tests for SelectionBox MVC system
 * Tests Model, View, and Controller integration
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('SelectionBox MVC System', function() {
  let SelectionBoxModel, SelectionBoxView, SelectionBoxController;

  before(function() {
    // Mock global window object
    global.window = {
      entityManager: {
        getByType: sinon.stub().returns([])
      }
    };
    
    // Mock p5.js SHIFT constant
    global.SHIFT = 16;
    global.keyIsDown = sinon.stub().returns(false);
    
    // Load classes
    const path = require('path');
    SelectionBoxModel = require(path.resolve(__dirname, '../../../Classes/mvc/models/SelectionBoxModel.js'));
    SelectionBoxView = require(path.resolve(__dirname, '../../../Classes/mvc/views/SelectionBoxView.js'));
    SelectionBoxController = require(path.resolve(__dirname, '../../../Classes/mvc/controllers/SelectionBoxController.js'));
  });
  
  after(function() {
    delete global.window;
    delete global.SHIFT;
    delete global.keyIsDown;
  });

  describe('SelectionBoxModel', function() {
    it('should initialize with inactive state', function() {
      const model = new SelectionBoxModel();
      expect(model.isActive).to.be.false;
      expect(model.isDragging).to.be.false;
    });

    it('should set start position on setStart', function() {
      const model = new SelectionBoxModel();
      model.setStart(100, 200);
      
      expect(model.startX).to.equal(100);
      expect(model.startY).to.equal(200);
      expect(model.isActive).to.be.true;
    });

    it('should update end position and dragging state', function() {
      const model = new SelectionBoxModel();
      model.setStart(100, 100);
      model.setEnd(110, 110); // Below threshold (distance ~14px, threshold is 5px)
      
      // After moving 10 pixels in both directions, isDragging should be true
      expect(model.isDragging).to.be.true;
      
      model.setStart(100, 100); // Reset
      model.setEnd(102, 102); // Very small movement (distance ~3px)
      expect(model.isDragging).to.be.false; // Below threshold
    });

    it('should calculate bounds correctly', function() {
      const model = new SelectionBoxModel();
      model.setStart(100, 200);
      model.setEnd(300, 150);
      
      const bounds = model.getBounds();
      expect(bounds.minX).to.equal(100);
      expect(bounds.maxX).to.equal(300);
      expect(bounds.minY).to.equal(150);
      expect(bounds.maxY).to.equal(200);
      expect(bounds.width).to.equal(200);
      expect(bounds.height).to.equal(50);
    });

    it('should handle color updates', function() {
      const model = new SelectionBoxModel();
      const newFillColor = { r: 255, g: 0, b: 0 };
      
      model.updateColors({ fillColor: newFillColor, fillAlpha: 100 });
      
      const colors = model.getColors();
      expect(colors.fillColor.r).to.equal(255);
      expect(colors.fillAlpha).to.equal(100);
    });
  });

  describe('SelectionBoxController', function() {
    let model, view, controller;

    beforeEach(function() {
      model = new SelectionBoxModel();
      view = new SelectionBoxView(model);
      controller = new SelectionBoxController(model, view);
    });

    it('should handle mouse down', function() {
      controller.onMouseDown(100, 200);
      
      expect(model.isActive).to.be.true;
      expect(model.startX).to.equal(100);
      expect(model.startY).to.equal(200);
    });

    it('should handle mouse drag', function() {
      controller.onMouseDown(100, 100);
      controller.onMouseDrag(200, 200);
      
      expect(model.endX).to.equal(200);
      expect(model.endY).to.equal(200);
      expect(model.isDragging).to.be.true;
    });

    it('should clear on mouse up', function() {
      controller.onMouseDown(100, 100);
      controller.onMouseDrag(200, 200);
      controller.onMouseUp();
      
      expect(model.isActive).to.be.false;
      expect(model.isDragging).to.be.false;
    });

    it('should report active state correctly', function() {
      expect(controller.isActive()).to.be.false;
      
      controller.onMouseDown(100, 100);
      expect(controller.isActive()).to.be.true;
      
      controller.onMouseUp();
      expect(controller.isActive()).to.be.false;
    });
  });
});
