/**
 * @fileoverview Integration tests for SelectionBox MVC system
 * Tests complete Model-View-Controller interaction with real dependencies
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

describe('SelectionBox MVC Integration Tests', function() {
  let SelectionBoxModel, SelectionBoxView, SelectionBoxController;
  let EventManager, EntityEvents, RenderManager;
  let model, view, controller;
  let eventBus;

  before(function() {
    // Mock p5.js globals
    global.SHIFT = 16;
    global.CORNER = 'corner';
    global.LEFT = 'left';
    global.TOP = 'top';
    global.keyIsDown = sinon.stub().returns(false);
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noFill = sinon.stub();
    global.noStroke = sinon.stub();
    global.rectMode = sinon.stub();
    global.rect = sinon.stub();
    global.line = sinon.stub();
    global.textSize = sinon.stub();
    global.textAlign = sinon.stub();
    global.text = sinon.stub();

    // Mock cameraManager
    global.cameraManager = {
      screenToWorld: sinon.stub().callsFake((x, y) => ({ x: x * 2, y: y * 2 })),
      worldToScreen: sinon.stub().callsFake((x, y) => ({ x: x / 2, y: y / 2 }))
    };

    // Load EventManager
    EventManager = require(path.resolve(__dirname, '../../../Classes/managers/EventManager.js'));
    global.EventManager = EventManager;
    
    // Load EntityEvents
    EntityEvents = require(path.resolve(__dirname, '../../../Classes/events/EntityEvents.js'));
    global.EntityEvents = EntityEvents;

    // Mock RenderManager
    RenderManager = {
      layers: {
        UI_GAME: 'ui_game'
      },
      addDrawableToLayer: sinon.stub()
    };
    global.RenderManager = RenderManager;

    // Load SelectionBox classes
    SelectionBoxModel = require(path.resolve(__dirname, '../../../Classes/mvc/models/SelectionBoxModel.js'));
    SelectionBoxView = require(path.resolve(__dirname, '../../../Classes/mvc/views/SelectionBoxView.js'));
    SelectionBoxController = require(path.resolve(__dirname, '../../../Classes/mvc/controllers/SelectionBoxController.js'));
  });

  after(function() {
    delete global.SHIFT;
    delete global.CORNER;
    delete global.LEFT;
    delete global.TOP;
    delete global.keyIsDown;
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.stroke;
    delete global.strokeWeight;
    delete global.noFill;
    delete global.noStroke;
    delete global.rectMode;
    delete global.rect;
    delete global.line;
    delete global.textSize;
    delete global.textAlign;
    delete global.text;
    delete global.cameraManager;
    delete global.EventManager;
    delete global.EntityEvents;
    delete global.RenderManager;
  });

  beforeEach(function() {
    // Reset EventManager singleton
    eventBus = EventManager.getInstance();
    // Clear all listeners (if EventManager supports it)
    if (eventBus.clearAll) {
      eventBus.clearAll();
    }

    // Create MVC triad
    model = new SelectionBoxModel();
    view = new SelectionBoxView(model);
    controller = new SelectionBoxController(model, view);

    // Reset p5 stubs
    global.push.resetHistory();
    global.pop.resetHistory();
    global.rect.resetHistory();
    global.line.resetHistory();

    // Mock entityManager
    global.window = {
      entityManager: {
        getByType: sinon.stub().returns([])
      }
    };
  });

  describe('Complete Selection Workflow', function() {
    it('should coordinate all MVC layers during selection', function() {
      // Mouse down
      controller.onMouseDown(100, 100);
      expect(model.isActive).to.be.true;
      expect(controller.isActive()).to.be.true;

      // Mouse drag
      controller.onMouseDrag(300, 300);
      expect(model.isDragging).to.be.true;
      expect(model.endX).to.equal(300);
      expect(model.endY).to.equal(300);

      // Render
      view.render();
      expect(global.rect.called).to.be.true;
      expect(global.line.callCount).to.equal(8); // 8 corner lines

      // Mouse up
      controller.onMouseUp();
      expect(model.isActive).to.be.false;
      expect(controller.isActive()).to.be.false;
    });

    it('should NOT render if drag threshold not exceeded', function() {
      controller.onMouseDown(100, 100);
      controller.onMouseDrag(102, 102); // Below threshold

      view.render();

      expect(global.rect.called).to.be.false;
    });

    it('should render once drag threshold exceeded', function() {
      controller.onMouseDown(100, 100);
      controller.onMouseDrag(120, 120); // Above threshold

      view.render();

      expect(global.rect.called).to.be.true;
    });
  });

  describe('Entity Detection Integration', function() {
    let mockAnts;

    beforeEach(function() {
      // Create mock ants with SelectionController
      mockAnts = [
        {
          id: 'ant-1',
          model: {
            getPosition: () => ({ x: 150, y: 150 }),
            getSize: () => ({ width: 32, height: 32 })
          },
          controller: {
            getController: (type) => {
              if (type === 'selection') {
                return {
                  setBoxHovered: sinon.stub(),
                  setSelected: sinon.stub()
                };
              }
            }
          }
        },
        {
          id: 'ant-2',
          model: {
            getPosition: () => ({ x: 500, y: 500 }),
            getSize: () => ({ width: 32, height: 32 })
          },
          controller: {
            getController: (type) => {
              if (type === 'selection') {
                return {
                  setBoxHovered: sinon.stub(),
                  setSelected: sinon.stub()
                };
              }
            }
          }
        }
      ];

      global.window.entityManager.getByType = sinon.stub().returns(mockAnts);
    });

    it('should detect ants within selection box', function() {
      // Drag box over ant-1 (at 150,150) in screen coords
      // World coords: 300,300 (2x scale)
      controller.onMouseDown(50, 50);   // World: 100,100
      controller.onMouseDrag(100, 100); // World: 200,200

      // Ant-1 at world (150,150) should be outside this box
      const selection1 = mockAnts[0].controller.getController('selection');
      expect(selection1.setBoxHovered.calledWith(true)).to.be.false;

      // Expand box to include ant-1
      controller.onMouseDrag(200, 200); // World: 400,400

      // Ant-1 at world (150,150) should now be inside
      expect(selection1.setBoxHovered.calledWith(true)).to.be.true;
    });

    it('should NOT detect ants outside selection box', function() {
      // Small box that won't reach ant-2 at (500,500)
      controller.onMouseDown(50, 50);
      controller.onMouseDrag(100, 100);

      const selection2 = mockAnts[1].controller.getController('selection');
      expect(selection2.setBoxHovered.calledWith(true)).to.be.false;
    });

    it('should convert boxHovered to selected on mouse up', function() {
      // Select ant-1
      controller.onMouseDown(50, 50);
      controller.onMouseDrag(200, 200);

      const selection1 = mockAnts[0].controller.getController('selection');
      expect(selection1.setBoxHovered.calledWith(true)).to.be.true;

      controller.onMouseUp();

      expect(selection1.setSelected.calledWith(true)).to.be.true;
      expect(selection1.setBoxHovered.calledWith(false)).to.be.true;
    });

    it('should deselect other ants when NOT holding Shift', function() {
      global.keyIsDown.returns(false);

      controller.onMouseDown(50, 50);
      controller.onMouseDrag(200, 200);
      controller.onMouseUp();

      // Both ants should have setSelected called (deselect all, then select hovered)
      mockAnts.forEach(ant => {
        const selection = ant.controller.getController('selection');
        expect(selection.setSelected.called).to.be.true;
      });
    });

    it('should preserve selection when holding Shift', function() {
      global.keyIsDown.returns(true);

      controller.onMouseDown(50, 50);
      controller.onMouseDrag(200, 200);
      controller.onMouseUp();

      // Only hovered ant should be selected (no deselect all)
      const selection1 = mockAnts[0].controller.getController('selection');
      expect(selection1.setSelected.calledWith(true)).to.be.true;

      // Ant-2 should not be touched
      const selection2 = mockAnts[1].controller.getController('selection');
      expect(selection2.setSelected.called).to.be.false;
    });

    it('should track hovered entity count', function() {
      controller.onMouseDown(50, 50);
      expect(controller.getHoveredCount()).to.equal(0);

      controller.onMouseDrag(200, 200); // Covers ant-1
      expect(controller.getHoveredCount()).to.equal(1);

      controller.onMouseDrag(300, 300); // Covers both ants
      expect(controller.getHoveredCount()).to.equal(2);
    });
  });

  describe('Event Bus Integration', function() {
    it('should emit SELECTION_BOX_UPDATE during drag', function(done) {
      const listener = sinon.stub();
      eventBus.on(EntityEvents.SELECTION_BOX_UPDATE, listener);

      controller.onMouseDown(100, 100);
      controller.onMouseDrag(200, 200);

      // Event should be emitted
      setTimeout(() => {
        expect(listener.called).to.be.true;
        
        const eventData = listener.getCall(0).args[0];
        expect(eventData).to.have.property('worldBounds');
        expect(eventData).to.have.property('screenBounds');
        expect(eventData).to.have.property('entityCount');
        
        done();
      }, 10);
    });

    it('should emit SELECTION_BOX_COMPLETE on mouse up', function(done) {
      const listener = sinon.stub();
      eventBus.on(EntityEvents.SELECTION_BOX_COMPLETE, listener);

      controller.onMouseDown(100, 100);
      controller.onMouseDrag(200, 200);
      controller.onMouseUp();

      setTimeout(() => {
        expect(listener.called).to.be.true;
        
        const eventData = listener.getCall(0).args[0];
        expect(eventData).to.have.property('selectedCount');
        expect(eventData).to.have.property('entities');
        
        done();
      }, 10);
    });

    it('should emit rendering registration event from View', function(done) {
      const listener = sinon.stub();
      eventBus.on(EntityEvents.RENDER_REGISTER_DRAWABLE, listener);

      // Create new view (triggers registration in constructor)
      const newModel = new SelectionBoxModel();
      const newView = new SelectionBoxView(newModel);

      setTimeout(() => {
        expect(listener.called).to.be.true;
        
        const eventData = listener.getCall(0).args[0];
        expect(eventData.layer).to.equal('ui_game');
        expect(eventData.id).to.equal('selection-box-view');
        expect(eventData.drawFn).to.be.a('function');
        
        done();
      }, 10);
    });
  });

  describe('Coordinate System Integration', function() {
    it('should convert screen to world coordinates correctly', function() {
      // Camera scales by 2x (see mock)
      controller.onMouseDown(100, 100); // Screen coords
      controller.onMouseDrag(200, 200);

      const worldBounds = model.getWorldBounds();
      
      // Should be scaled by cameraManager
      expect(worldBounds.minX).to.equal(200); // 100 * 2
      expect(worldBounds.maxX).to.equal(400); // 200 * 2
    });

    it('should handle normalized bounds (drag in any direction)', function() {
      // Drag from bottom-right to top-left
      controller.onMouseDown(200, 200);
      controller.onMouseDrag(100, 100);

      const bounds = model.getBounds();
      
      expect(bounds.minX).to.equal(100);
      expect(bounds.maxX).to.equal(200);
      expect(bounds.minY).to.equal(100);
      expect(bounds.maxY).to.equal(200);
    });
  });

  describe('Color Configuration Integration', function() {
    it('should apply custom colors throughout MVC stack', function() {
      const customColors = {
        fillColor: { r: 255, g: 0, b: 0 },
        fillAlpha: 100,
        strokeColor: { r: 200, g: 0, b: 0 }
      };

      controller.updateColors(customColors);

      // Should be stored in model
      const modelColors = model.getColors();
      expect(modelColors.fillColor.r).to.equal(255);
      expect(modelColors.fillAlpha).to.equal(100);

      // Should be used by view when rendering
      controller.onMouseDown(100, 100);
      controller.onMouseDrag(200, 200);
      view.render();

      const fillCall = global.fill.getCall(0);
      expect(fillCall.args[0]).to.equal(255); // Custom red
      expect(fillCall.args[3]).to.equal(100); // Custom alpha
    });
  });

  describe('State Management Integration', function() {
    it('should maintain consistent state across all layers', function() {
      // Initial state
      expect(model.isActive).to.be.false;
      expect(controller.isActive()).to.be.false;
      expect(controller.shouldRender()).to.be.false;

      // After mouse down
      controller.onMouseDown(100, 100);
      expect(model.isActive).to.be.true;
      expect(controller.isActive()).to.be.true;
      expect(controller.shouldRender()).to.be.false; // Not dragging yet

      // After drag
      controller.onMouseDrag(200, 200);
      expect(model.isDragging).to.be.true;
      expect(controller.shouldRender()).to.be.true;

      // After mouse up
      controller.onMouseUp();
      expect(model.isActive).to.be.false;
      expect(controller.isActive()).to.be.false;
      expect(controller.shouldRender()).to.be.false;
    });
  });

  describe('View Lifecycle Integration', function() {
    it('should register with RenderLayerManager on creation', function(done) {
      const listener = sinon.stub();
      eventBus.on(EntityEvents.RENDER_REGISTER_DRAWABLE, listener);

      const newModel = new SelectionBoxModel();
      const newView = new SelectionBoxView(newModel);

      setTimeout(() => {
        expect(listener.called).to.be.true;
        done();
      }, 10);
    });

    it('should unregister on destroy', function(done) {
      const listener = sinon.stub();
      eventBus.on(EntityEvents.RENDER_UNREGISTER_DRAWABLE, listener);

      view.destroy();

      setTimeout(() => {
        expect(listener.called).to.be.true;
        
        const eventData = listener.getCall(0).args[0];
        expect(eventData.id).to.equal('selection-box-view');
        
        done();
      }, 10);
    });
  });

  describe('Error Handling Integration', function() {
    it('should handle missing entityManager gracefully', function() {
      delete global.window.entityManager;

      expect(() => {
        controller.onMouseDown(100, 100);
        controller.onMouseDrag(200, 200);
        controller.onMouseUp();
      }).to.not.throw();

      // Restore
      global.window.entityManager = {
        getByType: sinon.stub().returns([])
      };
    });

    it('should handle ants without selection controllers', function() {
      const brokenAnt = {
        model: {
          getPosition: () => ({ x: 150, y: 150 }),
          getSize: () => ({ width: 32, height: 32 })
        },
        controller: null // No controller
      };

      global.window.entityManager.getByType = sinon.stub().returns([brokenAnt]);

      expect(() => {
        controller.onMouseDown(50, 50);
        controller.onMouseDrag(200, 200);
        controller.onMouseUp();
      }).to.not.throw();
    });

    it('should handle missing cameraManager', function() {
      const tempCamera = global.cameraManager;
      global.cameraManager = undefined;

      controller.onMouseDown(100, 100);
      controller.onMouseDrag(200, 200);

      // Should fallback to screen = world
      const worldBounds = model.getWorldBounds();
      expect(worldBounds.minX).to.equal(100);
      expect(worldBounds.maxX).to.equal(200);

      global.cameraManager = tempCamera;
    });
  });

  describe('Performance Integration', function() {
    it('should handle large numbers of entities efficiently', function() {
      const manyAnts = [];
      for (let i = 0; i < 100; i++) {
        manyAnts.push({
          id: `ant-${i}`,
          model: {
            getPosition: () => ({ x: i * 10, y: i * 10 }),
            getSize: () => ({ width: 32, height: 32 })
          },
          controller: {
            getController: () => ({
              setBoxHovered: sinon.stub(),
              setSelected: sinon.stub()
            })
          }
        });
      }

      global.window.entityManager.getByType = sinon.stub().returns(manyAnts);

      const startTime = Date.now();

      controller.onMouseDown(0, 0);
      controller.onMouseDrag(1000, 1000);
      controller.onMouseUp();

      const duration = Date.now() - startTime;

      expect(duration).to.be.lessThan(100); // Should complete in <100ms
    });
  });
});
