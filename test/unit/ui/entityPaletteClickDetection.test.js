/**
 * Unit Tests - EntityPalette Click Detection
 * Tests for click handling in Entity Palette panel
 * 
 * TDD Red Phase: All tests should fail initially
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityPalette Click Detection', function() {
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
      window.localStorage = global.localStorage;
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

  describe('Click Detection Methods', function() {
    it('should have handleClick method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.handleClick).to.be.a('function');
    });

    it('should have containsPoint method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.containsPoint).to.be.a('function');
    });
  });

  describe('Category Button Clicks', function() {
    it('should detect clicks on category buttons', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      // Mock CategoryRadioButtons to return a click result
      palette.categoryButtons.handleClick = sandbox.stub().returns({ id: 'buildings' });
      
      // Click in category button area (top 30px)
      const result = palette.handleClick(50, 15, 0, 0, 220);
      
      expect(result).to.exist;
      expect(result.type).to.equal('category');
      expect(result.category).to.equal('buildings');
    });

    it('should return null when category buttons return null', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.categoryButtons.handleClick = sandbox.stub().returns(null);
      
      const result = palette.handleClick(50, 15, 0, 0, 220);
      
      expect(result).to.be.null;
    });
  });

  describe('Entity Template Clicks', function() {
    it('should detect clicks on entity templates', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('entities');
      
      // Click on first template (below buttons, around Y=80)
      // Layout: Y 0-30 buttons, Y 38-68 (no search in entities), Y 76+ first entity
      const result = palette.handleClick(50, 100, 0, 0, 220);
      
      expect(result).to.exist;
      expect(result.type).to.equal('template');
      expect(result.template).to.exist;
    });

    it('should select the clicked template', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('entities');
      
      const result = palette.handleClick(50, 100, 0, 0, 220);
      
      expect(palette._selectedTemplateId).to.exist;
      expect(result.template.id).to.equal(palette._selectedTemplateId);
    });

    it('should handle clicks on multiple templates', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('entities');
      
      // Click first template
      const result1 = palette.handleClick(50, 100, 0, 0, 220);
      const firstId = result1.template.id;
      
      // Click second template (first + header(0) + itemHeight(80) + padding(8) = ~188)
      const result2 = palette.handleClick(50, 188, 0, 0, 220);
      
      expect(result2.template.id).to.not.equal(firstId);
    });
  });

  describe('Custom Category Clicks', function() {
    it('should detect clicks on "Add New" button', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('custom');
      
      // Add button is at bottom of list
      // With no custom entities: buttons(30) + padding(8) + search(30+8) + padding(8) + addButton starts
      const buttonY = 30 + 8 + 30 + 8 + 8;
      
      const result = palette.handleClick(50, buttonY + 20, 0, 0, 220);
      
      expect(result).to.exist;
      expect(result.type).to.equal('addCustomEntity');
    });

    it('should detect clicks on rename button', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Test Entity', 'ant_worker', { faction: 'player' });
      palette.setCategory('custom');
      
      // Click rename button (pencil icon) in header
      // Layout: buttons(30) + padding(8) + search(38) + headerY(0-20)
      // Rename button is right side, before delete: width(220) - padding(8) - 60 to - padding(8) - 20
      const headerY = 30 + 8 + 38 + 10;
      const renameX = 220 - 8 - 40; // Right side, before delete
      
      const result = palette.handleClick(renameX, headerY, 0, 0, 220);
      
      expect(result).to.exist;
      expect(result.type).to.equal('rename');
      expect(result.entity).to.exist;
    });

    it('should detect clicks on delete button', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Test Entity', 'ant_worker', { faction: 'player' });
      palette.setCategory('custom');
      
      // Click delete button (✕) in header
      // Layout: buttons(30) + padding(8) + search(38) + headerY(0-20)
      // Delete button is far right: width(220) - padding(8) - 10
      const headerY = 30 + 8 + 38 + 10;
      const deleteX = 220 - 8 - 10; // Far right
      
      const result = palette.handleClick(deleteX, headerY, 0, 0, 220);
      
      expect(result).to.exist;
      expect(result.type).to.equal('delete');
      expect(result.entity).to.exist;
    });

    it('should detect clicks on search box', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('custom');
      
      // Click search box area
      // Layout: buttons(30) + padding(8) + searchY(0-30)
      const searchY = 30 + 8 + 15; // Middle of search box
      
      const result = palette.handleClick(50, searchY, 0, 0, 220);
      
      expect(result).to.exist;
      expect(result.type).to.equal('searchBoxClick');
    });

    it('should detect clicks on clear search button', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('custom');
      palette.setSearchQuery('test'); // Activate clear button
      
      // Click clear button (far right of search box)
      // Layout: buttons(30) + padding(8) + searchY(0-30)
      const searchY = 30 + 8 + 15;
      const clearX = 220 - 8 - 20; // Far right of search box
      
      const result = palette.handleClick(clearX, searchY, 0, 0, 220);
      
      expect(result).to.exist;
      expect(result.type).to.equal('clearSearch');
    });
  });

  describe('Bounds Checking', function() {
    it('should return null for clicks outside panel bounds', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('entities');
      
      // Click way below panel content
      const result = palette.handleClick(50, 1000, 0, 0, 220);
      
      expect(result).to.be.null;
    });

    it('should return null for clicks in empty space', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('custom'); // Empty custom category
      
      // Click between search box and add button (empty space)
      const emptyY = 30 + 8 + 38 + 5; // Just after search box
      
      const result = palette.handleClick(50, emptyY, 0, 0, 220);
      
      // Should be null (no content there) or addCustomEntity (if add button at top)
      // Either is acceptable depending on implementation
      expect(result).to.satisfy(r => r === null || r.type === 'addCustomEntity');
    });

    it('should use containsPoint for bounds checking', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('entities');
      
      // containsPoint should return true for coordinates inside panel
      const inside = palette.containsPoint(50, 100, 0, 0, 220);
      expect(inside).to.be.true;
      
      // containsPoint should return false for coordinates outside panel
      const outside = palette.containsPoint(50, 1000, 0, 0, 220);
      expect(outside).to.be.false;
    });
  });

  describe('Toast Click Delegation', function() {
    it('should check toast clicks first', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      // Mock toast with handleClick
      palette._toast = {
        handleClick: sandbox.stub().returns(true)
      };
      
      const result = palette.handleClick(50, 100, 0, 0, 220);
      
      expect(palette._toast.handleClick.calledOnce).to.be.true;
      expect(result.type).to.equal('toast');
    });

    it('should skip toast if no toast system', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette._toast = null;
      
      // Should not throw
      const result = palette.handleClick(50, 100, 0, 0, 220);
      
      // Should still process click normally
      expect(result).to.exist;
    });
  });
});
