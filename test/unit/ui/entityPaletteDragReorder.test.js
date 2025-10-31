/**
 * Unit Tests - EntityPalette Drag-to-Reorder
 * Tests for drag-and-drop reordering of custom entities
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityPalette Drag-to-Reorder', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    // Mock p5.js functions
    const mockP5 = {
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      noFill: sandbox.stub(),
      stroke: sandbox.stub(),
      noStroke: sandbox.stub(),
      strokeWeight: sandbox.stub(),
      rect: sandbox.stub(),
      ellipse: sandbox.stub(),
      arc: sandbox.stub(),
      text: sandbox.stub(),
      textAlign: sandbox.stub(),
      textSize: sandbox.stub(),
      line: sandbox.stub(),
      triangle: sandbox.stub(),
      translate: sandbox.stub(),
      rotate: sandbox.stub(),
      image: sandbox.stub(),
      millis: sandbox.stub().returns(1000),
      cursor: sandbox.stub(),
      HAND: 'hand',
      MOVE: 'move',
      ARROW: 'arrow',
      HALF_PI: Math.PI / 2,
      TWO_PI: Math.PI * 2,
      CENTER: 'center',
      LEFT: 'left',
      RIGHT: 'right',
      TOP: 'top',
      BOTTOM: 'bottom',
      RADIUS: 'radius'
    };

    // Sync global and window
    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
    });

    // Mock localStorage
    global.localStorage = {
      getItem: sandbox.stub().returns(null),
      setItem: sandbox.stub(),
      removeItem: sandbox.stub()
    };

    // Mock window for JSDOM
    if (typeof window !== 'undefined') {
      Object.assign(window, mockP5);
      window.localStorage = global.localStorage;
    }

    // Mock CategoryRadioButtons
    global.CategoryRadioButtons = class {
      constructor(callback) {
        this.callback = callback;
        this.height = 30;
        this.selected = 'entities';
      }
      render() {}
      handleClick() { return null; }
    };
    
    if (typeof window !== 'undefined') {
      window.CategoryRadioButtons = global.CategoryRadioButtons;
    }

    // Mock ModalDialog
    global.ModalDialog = class {
      constructor() {
        this.visible = false;
      }
      show() { this.visible = true; }
      hide() { this.visible = false; }
      render() {}
      handleClick() {}
    };
    
    if (typeof window !== 'undefined') {
      window.ModalDialog = global.ModalDialog;
    }

    // Mock ToastNotification
    global.ToastNotification = class {
      constructor() {
        this.toasts = [];
      }
      show() {}
      update() {}
      render() {}
      handleClick() {}
    };
    
    if (typeof window !== 'undefined') {
      window.ToastNotification = global.ToastNotification;
    }
  });

  afterEach(function() {
    sandbox.restore();
    
    // Clean up globals
    if (typeof window !== 'undefined') {
      delete window.localStorage;
      delete window.CategoryRadioButtons;
      delete window.ModalDialog;
      delete window.ToastNotification;
    }
  });

  describe('Drag State Management', function() {
    it('should initialize with no drag state', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette._isDragging).to.be.false;
      expect(palette._draggedEntity).to.be.null;
      expect(palette._dragStartY).to.equal(0);
    });

    it('should have startDrag method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.startDrag).to.be.a('function');
    });

    it('should start drag with entity and position', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const entity = { id: 'test_1', customName: 'Test' };
      palette.startDrag(entity, 100);
      
      expect(palette._isDragging).to.be.true;
      expect(palette._draggedEntity).to.equal(entity);
      expect(palette._dragStartY).to.equal(100);
    });

    it('should have endDrag method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.endDrag).to.be.a('function');
    });

    it('should end drag and clear state', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const entity = { id: 'test_1', customName: 'Test' };
      palette.startDrag(entity, 100);
      palette.endDrag();
      
      expect(palette._isDragging).to.be.false;
      expect(palette._draggedEntity).to.be.null;
    });

    it('should track current drag Y position', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette._dragCurrentY).to.equal(0);
    });

    it('should update drag Y position', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const entity = { id: 'test_1', customName: 'Test' };
      palette.startDrag(entity, 100);
      palette.updateDragPosition(150);
      
      expect(palette._dragCurrentY).to.equal(150);
    });
  });

  describe('Drag Detection', function() {
    it('should have handleMousePressed method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.handleMousePressed).to.be.a('function');
    });

    it('should detect drag start on entity', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Test Entity', 'ant_worker', { faction: 'player' });
      palette.setCategory('custom');
      
      // Click at Y=80 (after button + padding + search box, within first entity)
      // Layout: Y 0-30 buttons, Y 38-68 search box, Y 76+ first entity
      const result = palette.handleMousePressed(10, 80, 0, 0, 200, 400);
      
      expect(result).to.exist;
      expect(palette._isDragging).to.be.true;
    });

    it('should not start drag in non-custom category', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('entities');
      palette.handleMousePressed(10, 50, 0, 0, 200, 400);
      
      expect(palette._isDragging).to.be.false;
    });

    it('should have handleMouseDragged method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.handleMouseDragged).to.be.a('function');
    });

    it('should update drag position while dragging', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const entity = { id: 'test_1', customName: 'Test' };
      palette.startDrag(entity, 100);
      
      palette.handleMouseDragged(10, 150, 0, 0, 200, 400);
      
      expect(palette._dragCurrentY).to.equal(150);
    });

    it('should have handleMouseReleased method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.handleMouseReleased).to.be.a('function');
    });

    it('should end drag on mouse release', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const entity = { id: 'test_1', customName: 'Test' };
      palette.startDrag(entity, 100);
      palette.handleMouseReleased();
      
      expect(palette._isDragging).to.be.false;
    });
  });

  describe('Drop Zone Detection', function() {
    it('should have getDropIndex method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.getDropIndex).to.be.a('function');
    });

    it('should calculate drop index based on Y position', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Entity 1', 'ant_worker', { faction: 'player' });
      palette.addCustomEntity('Entity 2', 'ant_soldier', { faction: 'player' });
      palette.addCustomEntity('Entity 3', 'ant_worker', { faction: 'player' });
      
      palette.setCategory('custom');
      
      const dropIndex = palette.getDropIndex(100);
      
      expect(dropIndex).to.be.a('number');
      expect(dropIndex).to.be.at.least(0);
      expect(dropIndex).to.be.at.most(3);
    });

    it('should return 0 for drop at top', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Entity 1', 'ant_worker', { faction: 'player' });
      palette.addCustomEntity('Entity 2', 'ant_soldier', { faction: 'player' });
      
      palette.setCategory('custom');
      
      const dropIndex = palette.getDropIndex(0);
      
      expect(dropIndex).to.equal(0);
    });

    it('should return last index for drop at bottom', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Entity 1', 'ant_worker', { faction: 'player' });
      palette.addCustomEntity('Entity 2', 'ant_soldier', { faction: 'player' });
      
      palette.setCategory('custom');
      
      const dropIndex = palette.getDropIndex(999999);
      
      expect(dropIndex).to.equal(2);
    });

    it('should handle empty list', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('custom');
      
      const dropIndex = palette.getDropIndex(100);
      
      expect(dropIndex).to.equal(0);
    });
  });

  describe('Reordering Logic', function() {
    it('should have reorderCustomEntity method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.reorderCustomEntity).to.be.a('function');
    });

    it('should reorder entity to new position', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Entity 1', 'ant_worker', { faction: 'player' });
      palette.addCustomEntity('Entity 2', 'ant_soldier', { faction: 'player' });
      palette.addCustomEntity('Entity 3', 'ant_worker', { faction: 'player' });
      
      const entity1 = palette._templates.custom[0];
      palette.reorderCustomEntity(entity1.id, 2);
      
      const templates = palette._templates.custom;
      expect(templates[0].customName).to.equal('Entity 2');
      expect(templates[1].customName).to.equal('Entity 3');
      expect(templates[2].customName).to.equal('Entity 1');
    });

    it('should move entity up in list', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Entity 1', 'ant_worker', { faction: 'player' });
      palette.addCustomEntity('Entity 2', 'ant_soldier', { faction: 'player' });
      palette.addCustomEntity('Entity 3', 'ant_worker', { faction: 'player' });
      
      const entity3 = palette._templates.custom[2];
      palette.reorderCustomEntity(entity3.id, 0);
      
      const templates = palette._templates.custom;
      expect(templates[0].customName).to.equal('Entity 3');
      expect(templates[1].customName).to.equal('Entity 1');
      expect(templates[2].customName).to.equal('Entity 2');
    });

    it('should move entity down in list', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Entity 1', 'ant_worker', { faction: 'player' });
      palette.addCustomEntity('Entity 2', 'ant_soldier', { faction: 'player' });
      palette.addCustomEntity('Entity 3', 'ant_worker', { faction: 'player' });
      
      const entity1 = palette._templates.custom[0];
      palette.reorderCustomEntity(entity1.id, 2);
      
      const templates = palette._templates.custom;
      expect(templates[2].customName).to.equal('Entity 1');
    });

    it('should handle invalid entity ID', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Entity 1', 'ant_worker', { faction: 'player' });
      
      const result = palette.reorderCustomEntity('invalid_id', 0);
      
      expect(result).to.be.false;
    });

    it('should handle invalid target index', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Entity 1', 'ant_worker', { faction: 'player' });
      
      const entity = palette._templates.custom[0];
      const result = palette.reorderCustomEntity(entity.id, -1);
      
      expect(result).to.be.false;
    });

    it('should persist reorder to LocalStorage', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Entity 1', 'ant_worker', { faction: 'player' });
      palette.addCustomEntity('Entity 2', 'ant_soldier', { faction: 'player' });
      
      const entity = palette._templates.custom[0];
      palette.reorderCustomEntity(entity.id, 1);
      
      expect(global.localStorage.setItem.called).to.be.true;
    });

    it('should not reorder if same position', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Entity 1', 'ant_worker', { faction: 'player' });
      palette.addCustomEntity('Entity 2', 'ant_soldier', { faction: 'player' });
      
      const originalOrder = palette._templates.custom.map(e => e.customName);
      const entity = palette._templates.custom[0];
      
      palette.reorderCustomEntity(entity.id, 0);
      
      const newOrder = palette._templates.custom.map(e => e.customName);
      expect(newOrder).to.deep.equal(originalOrder);
    });
  });

  describe('Visual Feedback', function() {
    it('should have renderDragGhost method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.renderDragGhost).to.be.a('function');
    });

    it('should render ghost while dragging', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const entity = { id: 'test_1', customName: 'Test Entity' };
      palette.startDrag(entity, 100);
      palette._dragCurrentY = 150;
      
      palette.renderDragGhost(0, 0, 200);
      
      expect(global.fill.called).to.be.true;
      expect(global.rect.called).to.be.true;
    });

    it('should not render ghost when not dragging', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      global.fill.resetHistory();
      palette.renderDragGhost(0, 0, 200);
      
      expect(global.fill.called).to.be.false;
    });

    it('should render drop indicator line', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Entity 1', 'ant_worker', { faction: 'player' });
      palette.addCustomEntity('Entity 2', 'ant_soldier', { faction: 'player' });
      
      const entity = palette._templates.custom[0];
      palette.startDrag(entity, 50);
      palette._dragCurrentY = 100;
      
      palette.renderDropIndicator(0, 0, 200, 400);
      
      expect(global.line.called).to.be.true;
    });

    it('should set cursor to MOVE when dragging', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const entity = { id: 'test_1', customName: 'Test' };
      palette.startDrag(entity, 100);
      palette.updateCursor();
      
      expect(global.cursor.calledWith(global.MOVE)).to.be.true;
    });

    it('should set cursor to HAND when hovering drag handle', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.updateCursor();
      
      // Default cursor when not dragging
      expect(global.cursor.called).to.be.false;
    });
  });

  describe('Integration with Render', function() {
    it('should render drag ghost in main render', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Entity 1', 'ant_worker', { faction: 'player' });
      palette.setCategory('custom');
      
      const entity = palette._templates.custom[0];
      palette.startDrag(entity, 50);
      palette._dragCurrentY = 100;
      
      global.rect.resetHistory();
      palette.render(0, 0, 200, 400);
      
      // Should have rendered drag ghost
      expect(global.rect.called).to.be.true;
    });

    it('should render drop indicator in main render', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Entity 1', 'ant_worker', { faction: 'player' });
      palette.setCategory('custom');
      
      const entity = palette._templates.custom[0];
      palette.startDrag(entity, 50);
      palette._dragCurrentY = 100;
      
      global.line.resetHistory();
      palette.render(0, 0, 200, 400);
      
      // Should have rendered drop indicator
      expect(global.line.called).to.be.true;
    });
  });

  describe('Edge Cases', function() {
    it('should handle drag with no entities', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('custom');
      palette.handleMousePressed(10, 50, 0, 0, 200, 400);
      
      expect(palette._isDragging).to.be.false;
    });

    it('should handle drag outside panel bounds', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Entity 1', 'ant_worker', { faction: 'player' });
      const entity = palette._templates.custom[0];
      
      palette.startDrag(entity, 100);
      palette.handleMouseDragged(500, 500, 0, 0, 200, 400);
      
      // Should still be dragging
      expect(palette._isDragging).to.be.true;
    });

    it('should handle rapid drag and release', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Entity 1', 'ant_worker', { faction: 'player' });
      palette.setCategory('custom');
      
      palette.handleMousePressed(10, 50, 0, 0, 200, 400);
      palette.handleMouseReleased();
      
      expect(palette._isDragging).to.be.false;
    });

    it('should handle drag with filtered results', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Worker 1', 'ant_worker', { faction: 'player' });
      palette.addCustomEntity('Soldier 1', 'ant_soldier', { faction: 'player' });
      palette.setCategory('custom');
      palette.setSearchQuery('worker');
      
      const templates = palette.getCurrentTemplates();
      expect(templates).to.have.lengthOf(1);
      
      // Dragging should still work with filtered results
      // Click at Y=80 (after button + padding + search box, within first entity)
      palette.handleMousePressed(10, 80, 0, 0, 200, 400);
      expect(palette._isDragging).to.be.true;
    });
  });
});
