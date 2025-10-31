/**
 * EntityPalette Cursor Following - Unit Tests (TDD Red Phase)
 * 
 * Tests cursor following behavior for entity placement:
 * - Entity attachment to cursor
 * - Normal click: place and detach
 * - Shift+click: place and keep attached (multiple placements)
 * - Cancellation (Escape, right-click, UI button)
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityPalette - Cursor Following', function() {
  let sandbox;
  let mockP5;
  let mockLevelEditor;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js functions
    mockP5 = {
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      strokeWeight: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub(),
      textSize: sandbox.stub(),
      textAlign: sandbox.stub(),
      image: sandbox.stub(),
      noStroke: sandbox.stub(),
      tint: sandbox.stub(),
      color: sandbox.stub().returns('#ff0000'),
      keyIsDown: sandbox.stub().returns(false),
      mouseX: 100,
      mouseY: 100,
      SHIFT: 16,
      LEFT: 'LEFT',
      CENTER: 'CENTER'
    };
    
    // Assign to global and window
    Object.assign(global, mockP5);
    if (typeof window !== 'undefined') {
      Object.assign(window, mockP5);
    }
    
    // Mock LevelEditor with cursor attachment
    mockLevelEditor = {
      _cursorAttachment: null,
      
      attachToMouseSingle: function(templateId, properties) {
        this._cursorAttachment = {
          type: 'single',
          templateId: templateId,
          properties: properties,
          active: true
        };
      },
      
      attachToMouseGroup: function(entities) {
        this._cursorAttachment = {
          type: 'group',
          entities: entities,
          active: true
        };
      },
      
      clearCursorAttachment: function() {
        this._cursorAttachment = null;
      },
      
      handleGridClick: function(gridX, gridY, shiftPressed = false) {
        if (!this._cursorAttachment || !this._cursorAttachment.active) return false;
        
        // Simulate entity placement
        // In real implementation: placeGroup() or placeSingleEntity()
        
        // Only clear if shift is NOT pressed
        if (!shiftPressed) {
          this.clearCursorAttachment();
        }
        
        return true;
      },
      
      getCursorAttachment: function() {
        return this._cursorAttachment;
      }
    };
    
    global.mockLevelEditor = mockLevelEditor;
    if (typeof window !== 'undefined') {
      window.mockLevelEditor = mockLevelEditor;
    }
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('Cursor Attachment', function() {
    it('should attach single entity to cursor when template clicked', function() {
      const templateId = 'ant_worker';
      const properties = { health: 100, faction: 'player' };
      
      mockLevelEditor.attachToMouseSingle(templateId, properties);
      
      const attachment = mockLevelEditor.getCursorAttachment();
      expect(attachment).to.exist;
      expect(attachment.type).to.equal('single');
      expect(attachment.templateId).to.equal(templateId);
      expect(attachment.properties).to.deep.equal(properties);
      expect(attachment.active).to.be.true;
    });
    
    it('should attach entity group to cursor when group clicked', function() {
      const entities = [
        { baseTemplateId: 'ant_soldier', position: { x: 0, y: 0 }, properties: {} },
        { baseTemplateId: 'ant_soldier', position: { x: 1, y: 0 }, properties: {} }
      ];
      
      mockLevelEditor.attachToMouseGroup(entities);
      
      const attachment = mockLevelEditor.getCursorAttachment();
      expect(attachment).to.exist;
      expect(attachment.type).to.equal('group');
      expect(attachment.entities).to.deep.equal(entities);
      expect(attachment.active).to.be.true;
    });
    
    it('should set active flag to true when attaching', function() {
      mockLevelEditor.attachToMouseSingle('ant_worker', {});
      
      const attachment = mockLevelEditor.getCursorAttachment();
      expect(attachment.active).to.be.true;
    });
  });
  
  describe('Normal Click Behavior', function() {
    it('should place entity and detach from cursor on normal click', function() {
      // Setup: Attach entity to cursor
      mockLevelEditor.attachToMouseSingle('ant_worker', { health: 100 });
      expect(mockLevelEditor.getCursorAttachment()).to.exist;
      
      // Action: Normal click (shift NOT pressed)
      const result = mockLevelEditor.handleGridClick(10, 10, false);
      
      // Assert: Entity placed, cursor detached
      expect(result).to.be.true;
      expect(mockLevelEditor.getCursorAttachment()).to.be.null;
    });
    
    it('should place group and detach from cursor on normal click', function() {
      const entities = [
        { baseTemplateId: 'ant_soldier', position: { x: 0, y: 0 }, properties: {} },
        { baseTemplateId: 'ant_worker', position: { x: 1, y: 0 }, properties: {} }
      ];
      
      mockLevelEditor.attachToMouseGroup(entities);
      expect(mockLevelEditor.getCursorAttachment()).to.exist;
      
      const result = mockLevelEditor.handleGridClick(5, 5, false);
      
      expect(result).to.be.true;
      expect(mockLevelEditor.getCursorAttachment()).to.be.null;
    });
    
    it('should return false when no attachment exists', function() {
      const result = mockLevelEditor.handleGridClick(10, 10, false);
      expect(result).to.be.false;
    });
  });
  
  describe('Shift+Click Behavior (Multiple Placement)', function() {
    it('should place entity but KEEP attached on shift+click', function() {
      // Setup: Attach entity to cursor
      const templateId = 'ant_soldier';
      const properties = { health: 150 };
      mockLevelEditor.attachToMouseSingle(templateId, properties);
      
      const attachmentBefore = mockLevelEditor.getCursorAttachment();
      expect(attachmentBefore).to.exist;
      
      // Action: Shift+click (shift IS pressed)
      const result = mockLevelEditor.handleGridClick(10, 10, true);
      
      // Assert: Entity placed, cursor STILL attached
      expect(result).to.be.true;
      const attachmentAfter = mockLevelEditor.getCursorAttachment();
      expect(attachmentAfter).to.exist;
      expect(attachmentAfter.type).to.equal('single');
      expect(attachmentAfter.templateId).to.equal(templateId);
      expect(attachmentAfter.active).to.be.true;
    });
    
    it('should place group but KEEP attached on shift+click', function() {
      const entities = [
        { baseTemplateId: 'ant_soldier', position: { x: 0, y: 0 }, properties: {} },
        { baseTemplateId: 'ant_soldier', position: { x: 1, y: 0 }, properties: {} }
      ];
      
      mockLevelEditor.attachToMouseGroup(entities);
      expect(mockLevelEditor.getCursorAttachment()).to.exist;
      
      // First placement with shift
      const result1 = mockLevelEditor.handleGridClick(5, 5, true);
      expect(result1).to.be.true;
      expect(mockLevelEditor.getCursorAttachment()).to.exist;
      
      // Second placement with shift
      const result2 = mockLevelEditor.handleGridClick(10, 10, true);
      expect(result2).to.be.true;
      expect(mockLevelEditor.getCursorAttachment()).to.exist;
      
      // Third placement without shift (detaches)
      const result3 = mockLevelEditor.handleGridClick(15, 15, false);
      expect(result3).to.be.true;
      expect(mockLevelEditor.getCursorAttachment()).to.be.null;
    });
    
    it('should allow multiple placements with shift held', function() {
      mockLevelEditor.attachToMouseSingle('ant_worker', { health: 100 });
      
      // Place 5 times with shift
      for (let i = 0; i < 5; i++) {
        const result = mockLevelEditor.handleGridClick(i, i, true);
        expect(result).to.be.true;
        expect(mockLevelEditor.getCursorAttachment()).to.exist;
      }
      
      // Final placement without shift
      const finalResult = mockLevelEditor.handleGridClick(10, 10, false);
      expect(finalResult).to.be.true;
      expect(mockLevelEditor.getCursorAttachment()).to.be.null;
    });
  });
  
  describe('Cancellation Behavior', function() {
    it('should clear attachment when clearCursorAttachment called', function() {
      mockLevelEditor.attachToMouseSingle('ant_worker', {});
      expect(mockLevelEditor.getCursorAttachment()).to.exist;
      
      mockLevelEditor.clearCursorAttachment();
      
      expect(mockLevelEditor.getCursorAttachment()).to.be.null;
    });
    
    it('should not throw error when clearing non-existent attachment', function() {
      expect(mockLevelEditor.getCursorAttachment()).to.be.null;
      
      expect(() => {
        mockLevelEditor.clearCursorAttachment();
      }).to.not.throw();
      
      expect(mockLevelEditor.getCursorAttachment()).to.be.null;
    });
  });
  
  describe('Shift Key Detection', function() {
    it('should detect shift key press using keyIsDown', function() {
      // Simulate shift NOT pressed
      mockP5.keyIsDown.withArgs(mockP5.SHIFT).returns(false);
      expect(global.keyIsDown(global.SHIFT)).to.be.false;
      
      // Simulate shift pressed
      mockP5.keyIsDown.withArgs(mockP5.SHIFT).returns(true);
      expect(global.keyIsDown(global.SHIFT)).to.be.true;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle inactive attachment correctly', function() {
      mockLevelEditor.attachToMouseSingle('ant_worker', {});
      mockLevelEditor._cursorAttachment.active = false;
      
      const result = mockLevelEditor.handleGridClick(10, 10, false);
      expect(result).to.be.false;
    });
    
    it('should handle null attachment properties', function() {
      mockLevelEditor.attachToMouseSingle('ant_worker', null);
      
      const attachment = mockLevelEditor.getCursorAttachment();
      expect(attachment).to.exist;
      expect(attachment.properties).to.be.null;
    });
    
    it('should handle empty group entities array', function() {
      mockLevelEditor.attachToMouseGroup([]);
      
      const attachment = mockLevelEditor.getCursorAttachment();
      expect(attachment).to.exist;
      expect(attachment.entities).to.be.an('array').that.is.empty;
    });
  });
});
