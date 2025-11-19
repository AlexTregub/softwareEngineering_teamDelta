/**
 * @fileoverview Unit tests for SelectionBox MVC system
 * Tests Model, View, and Controller in isolation with mocked dependencies
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const { setupP5Mocks, resetP5Mocks } = require('../../helpers/p5Mocks');

describe('SelectionBox MVC System - Unit Tests', function() {
  let SelectionBoxModel, SelectionBoxView, SelectionBoxController;
  let mockEntityManager;

  before(function() {
    // Ensure window object exists with console
    if (typeof global.window === 'undefined') {
      global.window = {};
    }
    if (typeof global.window.console === 'undefined') {
      global.window.console = {};
    }
    
    // Setup p5.js mocks using helper
    setupP5Mocks();
    
    // Mock p5 input constants and functions
    global.SHIFT = 16;
    global.window.SHIFT = 16;
    global.keyIsDown = sinon.stub().returns(false);
    global.window.keyIsDown = global.keyIsDown;
    
    // Mock cameraManager (identity mapping for unit tests)
    global.cameraManager = {
      screenToWorld: sinon.stub().callsFake((x, y) => ({ x: x, y: y }))
    };
    global.window.cameraManager = global.cameraManager;
    
    // Load classes
    SelectionBoxModel = require(path.resolve(__dirname, '../../../Classes/mvc/models/SelectionBoxModel.js'));
    SelectionBoxView = require(path.resolve(__dirname, '../../../Classes/mvc/views/SelectionBoxView.js'));
    SelectionBoxController = require(path.resolve(__dirname, '../../../Classes/mvc/controllers/SelectionBoxController.js'));
  });
  
  beforeEach(function() {
    // Reset p5 mocks between tests
    resetP5Mocks();
    
    // Reset keyIsDown stub
    if (global.keyIsDown && global.keyIsDown.resetHistory) {
      global.keyIsDown.resetHistory();
      global.keyIsDown.returns(false);
    }
    
    // Reset cameraManager stub
    if (global.cameraManager && global.cameraManager.screenToWorld && global.cameraManager.screenToWorld.resetHistory) {
      global.cameraManager.screenToWorld.resetHistory();
    }
    
    // Setup mock entityManager with fresh stub
    mockEntityManager = {
      getByType: sinon.stub().returns([])
    };
    global.window.entityManager = mockEntityManager;
  });
  
  after(function() {
    delete global.SHIFT;
    delete global.keyIsDown;
    delete global.cameraManager;
    delete global.window.SHIFT;
    delete global.window.keyIsDown;
    delete global.window.cameraManager;
    delete global.window.entityManager;
  });

  describe('SelectionBoxModel - Data Layer', function() {
    let model;

    beforeEach(function() {
      model = new SelectionBoxModel();
    });

    describe('Initialization', function() {
      it('should initialize with inactive state', function() {
        expect(model.isActive).to.be.false;
        expect(model.isDragging).to.be.false;
      });

      it('should have default positions at origin', function() {
        expect(model.startX).to.equal(0);
        expect(model.startY).to.equal(0);
        expect(model.endX).to.equal(0);
        expect(model.endY).to.equal(0);
      });

      it('should have default color configuration', function() {
        const colors = model.getColors();
        expect(colors.fillColor).to.deep.equal({ r: 0, g: 150, b: 255 });
        expect(colors.fillAlpha).to.equal(60);
        expect(colors.strokeColor).to.deep.equal({ r: 0, g: 120, b: 200 });
      });

      it('should have drag threshold of 5 pixels', function() {
        expect(model.dragThreshold).to.equal(5);
      });
    });

    describe('Start Position (Mouse Down)', function() {
      it('should set start position on setStart', function() {
        model.setStart(100, 200);
        
        expect(model.startX).to.equal(100);
        expect(model.startY).to.equal(200);
        expect(model.isActive).to.be.true;
      });

      it('should initialize end position to start position', function() {
        model.setStart(150, 250);
        
        expect(model.endX).to.equal(150);
        expect(model.endY).to.equal(250);
      });

      it('should not be dragging immediately after setStart', function() {
        model.setStart(100, 100);
        expect(model.isDragging).to.be.false;
      });
    });

    describe('End Position (Mouse Drag)', function() {
      beforeEach(function() {
        model.setStart(100, 100);
      });

      it('should update end position on setEnd', function() {
        model.setEnd(200, 250);
        
        expect(model.endX).to.equal(200);
        expect(model.endY).to.equal(250);
      });

      it('should start dragging when distance exceeds threshold', function() {
        model.setEnd(110, 110); // distance ~14px
        expect(model.isDragging).to.be.true;
      });

      it('should NOT start dragging when distance below threshold', function() {
        model.setEnd(102, 102); // distance ~3px
        expect(model.isDragging).to.be.false;
      });

      it('should calculate distance correctly for diagonal movement', function() {
        model.setEnd(103, 104); // distance = 5px (3^2 + 4^2 = 5^2)
        expect(model.isDragging).to.be.true; // exactly at threshold
      });
    });

    describe('Bounds Calculation', function() {
      it('should calculate bounds correctly for drag right-down', function() {
        model.setStart(100, 200);
        model.setEnd(300, 400);
        
        const bounds = model.getBounds();
        expect(bounds.minX).to.equal(100);
        expect(bounds.maxX).to.equal(300);
        expect(bounds.minY).to.equal(200);
        expect(bounds.maxY).to.equal(400);
        expect(bounds.width).to.equal(200);
        expect(bounds.height).to.equal(200);
      });

      it('should normalize bounds for drag left-up', function() {
        model.setStart(300, 400);
        model.setEnd(100, 200);
        
        const bounds = model.getBounds();
        expect(bounds.minX).to.equal(100);
        expect(bounds.maxX).to.equal(300);
        expect(bounds.minY).to.equal(200);
        expect(bounds.maxY).to.equal(400);
      });

      it('should handle mixed direction drag', function() {
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

      it('should handle zero-size bounds', function() {
        model.setStart(100, 100);
        model.setEnd(100, 100);
        
        const bounds = model.getBounds();
        expect(bounds.width).to.equal(0);
        expect(bounds.height).to.equal(0);
      });
    });

    describe('World Bounds Conversion', function() {
      it('should convert to world coordinates via cameraManager', function() {
        // Mock cameraManager to scale coordinates
        global.cameraManager.screenToWorld = sinon.stub().callsFake((x, y) => ({
          x: x * 2,
          y: y * 2
        }));

        model.setStart(100, 100);
        model.setEnd(200, 200);
        
        const worldBounds = model.getWorldBounds();
        expect(worldBounds.minX).to.equal(200);
        expect(worldBounds.maxX).to.equal(400);
      });

      it('should fallback to screen coords if cameraManager unavailable', function() {
        const tempCamera = global.cameraManager;
        global.cameraManager = undefined;

        model.setStart(100, 100);
        model.setEnd(200, 200);
        
        const worldBounds = model.getWorldBounds();
        expect(worldBounds.minX).to.equal(100);
        expect(worldBounds.maxX).to.equal(200);

        global.cameraManager = tempCamera;
      });
    });

    describe('Rendering State', function() {
      it('should NOT render when inactive', function() {
        expect(model.shouldRender()).to.be.false;
      });

      it('should NOT render when active but not dragging', function() {
        model.setStart(100, 100);
        model.setEnd(102, 102); // Below threshold
        
        expect(model.isActive).to.be.true;
        expect(model.isDragging).to.be.false;
        expect(model.shouldRender()).to.be.false;
      });

      it('should render when active AND dragging', function() {
        model.setStart(100, 100);
        model.setEnd(120, 120); // Above threshold
        
        expect(model.shouldRender()).to.be.true;
      });
    });

    describe('Color Configuration', function() {
      it('should update fill color', function() {
        const newFillColor = { r: 255, g: 0, b: 0 };
        model.updateColors({ fillColor: newFillColor });
        
        const colors = model.getColors();
        expect(colors.fillColor.r).to.equal(255);
        expect(colors.fillColor.g).to.equal(0);
        expect(colors.fillColor.b).to.equal(0);
      });

      it('should update fill alpha', function() {
        model.updateColors({ fillAlpha: 100 });
        
        const colors = model.getColors();
        expect(colors.fillAlpha).to.equal(100);
      });

      it('should update multiple colors at once', function() {
        model.updateColors({
          fillColor: { r: 255, g: 0, b: 0 },
          fillAlpha: 80,
          strokeColor: { r: 200, g: 0, b: 0 }
        });
        
        const colors = model.getColors();
        expect(colors.fillColor.r).to.equal(255);
        expect(colors.fillAlpha).to.equal(80);
        expect(colors.strokeColor.r).to.equal(200);
      });

      it('should not mutate config when getting colors', function() {
        const colors1 = model.getColors();
        colors1.fillColor.r = 999;
        
        const colors2 = model.getColors();
        expect(colors2.fillColor.r).to.equal(0);
      });
    });

    describe('Clear Operation', function() {
      it('should reset all state on clear', function() {
        model.setStart(100, 100);
        model.setEnd(200, 200);
        
        model.clear();
        
        expect(model.isActive).to.be.false;
        expect(model.isDragging).to.be.false;
        expect(model.startX).to.equal(0);
        expect(model.startY).to.equal(0);
        expect(model.endX).to.equal(0);
        expect(model.endY).to.equal(0);
      });
    });
  });

  describe('SelectionBoxView - Presentation Layer', function() {
    let model, view;

    beforeEach(function() {
      model = new SelectionBoxModel();
      view = new SelectionBoxView(model);
      
      // Reset p5 drawing function stubs
      resetP5Mocks();
    });

    describe('Initialization', function() {
      it('should store reference to model', function() {
        expect(view.model).to.equal(model);
      });

      it('should NOT render when model inactive', function() {
        view.render();
        
        expect(global.rect.called).to.be.false;
      });
    });

    describe('Rendering', function() {
      beforeEach(function() {
        model.setStart(100, 100);
        model.setEnd(200, 200);
      });

      it('should call p5 drawing functions when active', function() {
        view.render();
        
        expect(global.push.called).to.be.true;
        expect(global.pop.called).to.be.true;
        expect(global.rect.called).to.be.true;
      });

      it('should draw rectangle with correct dimensions', function() {
        view.render();
        
        const rectCall = global.rect.getCall(0);
        expect(rectCall.args[0]).to.equal(100); // x
        expect(rectCall.args[1]).to.equal(100); // y
        expect(rectCall.args[2]).to.equal(100); // width
        expect(rectCall.args[3]).to.equal(100); // height
      });

      it('should apply fill color with transparency', function() {
        view.render();
        
        const fillCall = global.fill.getCall(0);
        expect(fillCall.args[0]).to.equal(0);   // r
        expect(fillCall.args[1]).to.equal(150); // g
        expect(fillCall.args[2]).to.equal(255); // b
        expect(fillCall.args[3]).to.equal(60);  // alpha
      });

      it('should draw 8 corner lines', function() {
        view.render();
        
        expect(global.line.callCount).to.equal(8);
      });

      it('should use rectMode CORNER', function() {
        view.render();
        
        expect(global.rectMode.calledWith(global.CORNER)).to.be.true;
      });
    });

    describe('View Does NOT Mutate Model', function() {
      it('should only read from model during render', function() {
        model.setStart(100, 100);
        model.setEnd(200, 200);
        
        const initialBounds = model.getBounds();
        
        view.render();
        
        const afterBounds = model.getBounds();
        expect(afterBounds).to.deep.equal(initialBounds);
      });
    });
  });

  describe('SelectionBoxController - Orchestration Layer', function() {
    let model, view, controller;
    let mockAnts, selection1, selection2;

    beforeEach(function() {
      model = new SelectionBoxModel();
      view = new SelectionBoxView(model);
      controller = new SelectionBoxController(model, view);
      
      // Create persistent selection controller mocks
      selection1 = {
        setBoxHovered: sinon.stub(),
        setSelected: sinon.stub()
      };
      selection2 = {
        setBoxHovered: sinon.stub(),
        setSelected: sinon.stub()
      };
      
      // Mock ants with selection controllers
      // Ant 1 at (150, 150) - will be inside box from (100,100) to (200,200)
      // Ant 2 at (250, 250) - will be outside box
      mockAnts = [
        {
          id: 'ant-1',
          model: {
            getPosition: sinon.stub().returns({ x: 150, y: 150 }),
            getSize: sinon.stub().returns({ width: 32, height: 32 })
          },
          controller: {
            getController: sinon.stub().callsFake((type) => {
              if (type === 'selection') return selection1;
              return null;
            })
          }
        },
        {
          id: 'ant-2',
          model: {
            getPosition: sinon.stub().returns({ x: 250, y: 250 }),
            getSize: sinon.stub().returns({ width: 32, height: 32 })
          },
          controller: {
            getController: sinon.stub().callsFake((type) => {
              if (type === 'selection') return selection2;
              return null;
            })
          }
        }
      ];
      
      // Setup entityManager to return our mock ants
      mockEntityManager.getByType.returns(mockAnts);
    });

    describe('Mouse Down Handler', function() {
      it('should activate model on mouse down', function() {
        controller.onMouseDown(100, 200);
        
        expect(model.isActive).to.be.true;
        expect(model.startX).to.equal(100);
        expect(model.startY).to.equal(200);
      });

      it('should report active state', function() {
        expect(controller.isActive()).to.be.false;
        
        controller.onMouseDown(100, 100);
        expect(controller.isActive()).to.be.true;
      });
    });

    describe('Mouse Drag Handler', function() {
      beforeEach(function() {
        controller.onMouseDown(100, 100);
      });

      it('should update model end position', function() {
        controller.onMouseDrag(200, 200);
        
        expect(model.endX).to.equal(200);
        expect(model.endY).to.equal(200);
        expect(model.isDragging).to.be.true;
      });

      it('should detect entities under selection box', function() {
        // Drag box from (100,100) to (200,200) - covers ant-1 at (150,150)
        controller.onMouseDrag(200, 200);
        
        // Debug: Check if getByType was called
        expect(mockEntityManager.getByType.called).to.be.true;
        expect(mockEntityManager.getByType.calledWith('ant')).to.be.true;
        
        // Debug: Check what was called on selection1
        console.log('selection1.setBoxHovered called:', selection1.setBoxHovered.called);
        console.log('selection1.setBoxHovered call count:', selection1.setBoxHovered.callCount);
        console.log('selection1.setBoxHovered calls:', selection1.setBoxHovered.getCalls().map(c => c.args));
        
        // Verify ant-1's selection controller was called
        expect(selection1.setBoxHovered.called).to.be.true;
        expect(selection1.setBoxHovered.calledWith(true)).to.be.true;
      });

      it('should NOT hover entities outside box', function() {
        // Drag box from (100,100) to (180,180) - does NOT cover ant-2 at (250,250)
        controller.onMouseDrag(180, 180);
        
        // Verify ant-2's selection controller was NOT called with true
        expect(selection2.setBoxHovered.calledWith(true)).to.be.false;
      });

      it('should track hovered entity count', function() {
        controller.onMouseDrag(200, 200);
        
        expect(controller.getHoveredCount()).to.equal(1);
      });
    });

    describe('Mouse Up Handler (Selection Finalization)', function() {
      beforeEach(function() {
        controller.onMouseDown(100, 100);
        controller.onMouseDrag(200, 200);
      });

      it('should deactivate model on mouse up', function() {
        controller.onMouseUp();
        
        expect(model.isActive).to.be.false;
        expect(model.isDragging).to.be.false;
      });

      it('should convert boxHovered to selected', function() {
        controller.onMouseUp();
        
        // Verify ant-1 (which is under the box) was selected
        expect(selection1.setSelected.calledWith(true)).to.be.true;
      });

      it('should deselect all ants when NOT holding Shift', function() {
        global.keyIsDown.returns(false);
        
        controller.onMouseUp();
        
        // Both ants should have setSelected called (deselect all, then select hovered)
        expect(selection1.setSelected.called).to.be.true;
        expect(selection2.setSelected.called).to.be.true;
      });

      it('should NOT deselect when holding Shift (multi-select)', function() {
        global.keyIsDown.returns(true);
        
        const callCountBefore = selection2.setSelected.callCount;
        
        controller.onMouseUp();
        
        // Ant-2 (outside box) should not have setSelected called
        const callCountAfter = selection2.setSelected.callCount;
        expect(callCountAfter).to.equal(callCountBefore);
      });
    });

    describe('Color Configuration', function() {
      it('should delegate color updates to model', function() {
        const newColors = { fillColor: { r: 255, g: 0, b: 0 } };
        
        controller.updateColors(newColors);
        
        const colors = controller.getColors();
        expect(colors.fillColor.r).to.equal(255);
      });
    });

    describe('Rendering Delegation', function() {
      it('should delegate render to view', function() {
        const renderSpy = sinon.spy(view, 'render');
        
        controller.render();
        
        expect(renderSpy.called).to.be.true;
      });
    });

    describe('Controller Does NOT Render', function() {
      it('should NOT call p5 drawing functions directly', function() {
        global.rect.resetHistory();
        global.line.resetHistory();
        
        controller.onMouseDown(100, 100);
        controller.onMouseDrag(200, 200);
        
        // Controller should not draw anything directly
        expect(global.rect.called).to.be.false;
        expect(global.line.called).to.be.false;
      });
    });
  });
});
