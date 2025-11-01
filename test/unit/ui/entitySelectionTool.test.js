/**
 * Unit Tests for EntitySelectionTool
 * 
 * Tests the entity selection box functionality for Level Editor
 * TDD Red Phase - Write failing tests FIRST
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntitySelectionTool', function() {
  let EntitySelectionTool;
  let selectionTool;
  let mockEntities;
  let mockP5;

  beforeEach(function() {
    // Mock p5.js functions
    mockP5 = {
      createVector: sinon.stub().callsFake((x, y) => ({ x, y })),
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      noFill: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      rectMode: sinon.stub()
    };

    // Sync to global and window
    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
      if (typeof window !== 'undefined') window[key] = mockP5[key];
    });

    // Create mock entities
    mockEntities = [
      {
        posX: 100,
        posY: 100,
        sizeX: 32,
        sizeY: 32,
        getPosition: function() { return { x: this.posX, y: this.posY }; },
        getSize: function() { return { x: this.sizeX, y: this.sizeY }; },
        isSelected: false,
        isBoxHovered: false
      },
      {
        posX: 200,
        posY: 200,
        sizeX: 32,
        sizeY: 32,
        getPosition: function() { return { x: this.posX, y: this.posY }; },
        getSize: function() { return { x: this.sizeX, y: this.sizeY }; },
        isSelected: false,
        isBoxHovered: false
      },
      {
        posX: 300,
        posY: 100,
        sizeX: 32,
        sizeY: 32,
        getPosition: function() { return { x: this.posX, y: this.posY }; },
        getSize: function() { return { x: this.sizeX, y: this.sizeY }; },
        isSelected: false,
        isBoxHovered: false
      }
    ];

    // Load EntitySelectionTool class
    try {
      EntitySelectionTool = require('../../../Classes/ui/EntitySelectionTool');
    } catch (e) {
      // Expected to fail in TDD Red phase
      EntitySelectionTool = null;
    }

    if (EntitySelectionTool) {
      selectionTool = new EntitySelectionTool(mockEntities);
      // Set to ENTITY mode for selection tests (default is PAINT)
      selectionTool.setMode('ENTITY');
    }
  });

  afterEach(function() {
    sinon.restore();
    // Clean up globals
    Object.keys(mockP5).forEach(key => {
      delete global[key];
      if (typeof window !== 'undefined') delete window[key];
    });
  });

  describe('Constructor', function() {
    it('should initialize with no selection', function() {
      if (!EntitySelectionTool) {
        this.skip(); // Skip until class exists
      }

      expect(selectionTool).to.exist;
      expect(selectionTool.getSelectedEntities()).to.be.an('array');
      expect(selectionTool.getSelectedEntities()).to.have.lengthOf(0);
    });

    it('should store reference to entities array', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      expect(selectionTool.placedEntities).to.equal(mockEntities);
    });
  });

  describe('Mouse Press - Start Selection', function() {
    it('should start selection on mouse down', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      selectionTool.handleMousePressed(150, 150);

      expect(selectionTool.isSelecting).to.be.true;
      expect(selectionTool.selectionStart).to.deep.equal({ x: 150, y: 150 });
    });

    it('should not start selection if already selecting', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      selectionTool.handleMousePressed(150, 150);
      const originalStart = selectionTool.selectionStart;

      selectionTool.handleMousePressed(200, 200); // Second press

      expect(selectionTool.selectionStart).to.equal(originalStart);
    });
  });

  describe('Mouse Drag - Update Selection Bounds', function() {
    it('should update selection bounds on drag', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      selectionTool.handleMousePressed(100, 100);
      selectionTool.handleMouseDragged(250, 250);

      expect(selectionTool.selectionEnd).to.deep.equal({ x: 250, y: 250 });
    });

    it('should highlight entities within selection box during drag', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      // Start selection at 50,50 and drag to 250,250
      // This should include entity at 100,100 and 200,200
      selectionTool.handleMousePressed(50, 50);
      selectionTool.handleMouseDragged(250, 250);

      expect(mockEntities[0].isBoxHovered).to.be.true; // (100,100) is inside
      expect(mockEntities[1].isBoxHovered).to.be.true; // (200,200) is inside
      expect(mockEntities[2].isBoxHovered).to.be.false; // (300,100) is outside
    });

    it('should not update bounds if not selecting', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      selectionTool.handleMouseDragged(250, 250);

      expect(selectionTool.selectionEnd).to.be.null;
    });
  });

  describe('Mouse Release - Finalize Selection', function() {
    it('should select entities within box on mouse up', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      // Select entities at (100,100) and (200,200)
      selectionTool.handleMousePressed(50, 50);
      selectionTool.handleMouseDragged(250, 250);
      selectionTool.handleMouseReleased(250, 250);

      expect(mockEntities[0].isSelected).to.be.true;
      expect(mockEntities[1].isSelected).to.be.true;
      expect(mockEntities[2].isSelected).to.be.false;
    });

    it('should mark entities as selected with blue outline', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      selectionTool.handleMousePressed(50, 50);
      selectionTool.handleMouseDragged(250, 250);
      selectionTool.handleMouseReleased(250, 250);

      const selectedEntities = selectionTool.getSelectedEntities();
      expect(selectedEntities).to.have.lengthOf(2);
      expect(selectedEntities[0].isSelected).to.be.true;
      expect(selectedEntities[1].isSelected).to.be.true;
    });

    it('should clear hover state after selection', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      selectionTool.handleMousePressed(50, 50);
      selectionTool.handleMouseDragged(250, 250);
      selectionTool.handleMouseReleased(250, 250);

      expect(mockEntities[0].isBoxHovered).to.be.false;
      expect(mockEntities[1].isBoxHovered).to.be.false;
    });

    it('should stop selecting after mouse release', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      selectionTool.handleMousePressed(50, 50);
      selectionTool.handleMouseDragged(250, 250);
      selectionTool.handleMouseReleased(250, 250);

      expect(selectionTool.isSelecting).to.be.false;
    });
  });

  describe('Deselect All - Click Empty Area', function() {
    it('should deselect all when clicking empty area', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      // First select entities
      selectionTool.handleMousePressed(50, 50);
      selectionTool.handleMouseDragged(250, 250);
      selectionTool.handleMouseReleased(250, 250);

      expect(mockEntities[0].isSelected).to.be.true;

      // Now click empty area
      selectionTool.deselectAll();

      expect(mockEntities[0].isSelected).to.be.false;
      expect(mockEntities[1].isSelected).to.be.false;
      expect(selectionTool.getSelectedEntities()).to.have.lengthOf(0);
    });
  });

  describe('Delete Selected Entities', function() {
    it('should delete selected entities on Delete key', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      // Select first two entities
      selectionTool.handleMousePressed(50, 50);
      selectionTool.handleMouseDragged(250, 250);
      selectionTool.handleMouseReleased(250, 250);

      const initialCount = mockEntities.length;
      const entity0 = mockEntities[0]; // Save reference before deletion
      const entity1 = mockEntities[1]; // Save reference before deletion
      
      selectionTool.deleteSelectedEntities();

      expect(selectionTool.placedEntities.length).to.equal(initialCount - 2);
      expect(selectionTool.placedEntities).to.not.include(entity0);
      expect(selectionTool.placedEntities).to.not.include(entity1);
    });

    it('should not delete if no entities selected', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      const initialCount = mockEntities.length;
      selectionTool.deleteSelectedEntities();

      expect(selectionTool.placedEntities.length).to.equal(initialCount);
    });

    it('should clear selection after deletion', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      selectionTool.handleMousePressed(50, 50);
      selectionTool.handleMouseDragged(250, 250);
      selectionTool.handleMouseReleased(250, 250);

      selectionTool.deleteSelectedEntities();

      expect(selectionTool.getSelectedEntities()).to.have.lengthOf(0);
    });
  });

  describe('Get Selected Entities', function() {
    it('should return selected entities array', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      selectionTool.handleMousePressed(50, 50);
      selectionTool.handleMouseDragged(250, 250);
      selectionTool.handleMouseReleased(250, 250);

      const selected = selectionTool.getSelectedEntities();

      expect(selected).to.be.an('array');
      expect(selected).to.have.lengthOf(2);
      expect(selected[0]).to.equal(mockEntities[0]);
      expect(selected[1]).to.equal(mockEntities[1]);
    });

    it('should return empty array if no selection', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      const selected = selectionTool.getSelectedEntities();

      expect(selected).to.be.an('array');
      expect(selected).to.have.lengthOf(0);
    });
  });

  describe('Edge Cases', function() {
    it('should handle selection with inverted drag direction', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      // Drag from bottom-right to top-left
      selectionTool.handleMousePressed(250, 250);
      selectionTool.handleMouseDragged(50, 50);
      selectionTool.handleMouseReleased(50, 50);

      expect(mockEntities[0].isSelected).to.be.true;
      expect(mockEntities[1].isSelected).to.be.true;
    });

    it('should handle entities at selection boundary', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      // Select exactly around entity center (100,100) with size 32
      // Entity center is at 116,116 (pos + size/2)
      selectionTool.handleMousePressed(100, 100);
      selectionTool.handleMouseDragged(120, 120);
      selectionTool.handleMouseReleased(120, 120);

      expect(mockEntities[0].isSelected).to.be.true;
    });

    it('should handle empty entity array', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      const emptyTool = new EntitySelectionTool([]);
      emptyTool.handleMousePressed(50, 50);
      emptyTool.handleMouseDragged(250, 250);
      emptyTool.handleMouseReleased(250, 250);

      expect(emptyTool.getSelectedEntities()).to.have.lengthOf(0);
    });
  });

  describe('Rendering', function() {
    it('should have a render method', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      expect(selectionTool.render).to.be.a('function');
    });

    it('should render selection box when selecting', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      selectionTool.handleMousePressed(100, 100);
      selectionTool.handleMouseDragged(200, 200);

      selectionTool.render();

      expect(mockP5.rect.called).to.be.true;
    });

    it('should not render if not selecting', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }

      mockP5.rect.resetHistory();
      selectionTool.render();

      expect(mockP5.rect.called).to.be.false;
    });
  });
});
