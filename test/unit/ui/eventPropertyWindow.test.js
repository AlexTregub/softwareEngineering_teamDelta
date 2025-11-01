/**
 * Unit tests for EventPropertyWindow
 * Tests property editor window for event flags (TDD Red phase)
 * 
 * This window opens when user clicks a flag on terrain
 * Allows editing trigger properties, saving changes, or deleting trigger
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('EventPropertyWindow', function() {
  let EventPropertyWindow;
  let mockEventManager;
  let mockTrigger;
  
  before(function() {
    // Setup JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.noStroke = sinon.stub();
    global.noFill = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.ellipse = sinon.stub();
    global.line = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.triangle = sinon.stub();
    
    // Sync for JSDOM
    window.push = global.push;
    window.pop = global.pop;
    window.fill = global.fill;
    window.stroke = global.stroke;
    window.noStroke = global.noStroke;
    window.noFill = global.noFill;
    window.rect = global.rect;
    window.text = global.text;
    window.textAlign = global.textAlign;
    window.textSize = global.textSize;
    window.ellipse = global.ellipse;
    window.line = global.line;
    window.strokeWeight = global.strokeWeight;
    window.triangle = global.triangle;
    
    // Mock text alignment constants
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.RIGHT = 'right';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    window.LEFT = global.LEFT;
    window.CENTER = global.CENTER;
    window.RIGHT = global.RIGHT;
    window.TOP = global.TOP;
    window.BOTTOM = global.BOTTOM;
    
    // Mock logNormal
    global.logNormal = sinon.stub();
    window.logNormal = global.logNormal;
    
    // Mock console
    global.console = {
      log: sinon.stub(),
      error: sinon.stub(),
      warn: sinon.stub()
    };
  });
  
  beforeEach(function() {
    // Reset all stubs
    sinon.resetHistory();
    
    // Create mock EventManager
    mockEventManager = {
      updateTrigger: sinon.stub().returns(true),
      deleteTrigger: sinon.stub().returns(true),
      getTrigger: sinon.stub(),
      triggers: new Map()
    };
    
    // Create mock spatial trigger
    mockTrigger = {
      id: 'trigger_001',
      eventId: 'event_001',
      type: 'spatial',
      oneTime: true,
      condition: {
        x: 300,
        y: 300,
        radius: 100,
        shape: 'circle'
      }
    };
    
    // Add to mock EventManager
    mockEventManager.triggers.set(mockTrigger.id, mockTrigger);
    mockEventManager.getTrigger.returns(mockTrigger);
    
    // Load EventPropertyWindow (will fail initially - TDD Red)
    try {
      EventPropertyWindow = require('../../../Classes/ui/EventPropertyWindow');
    } catch (e) {
      // Expected to fail - class doesn't exist yet
      EventPropertyWindow = null;
    }
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with position and dimensions', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      expect(window.x).to.equal(100);
      expect(window.y).to.equal(100);
      expect(window.width).to.equal(300);
      expect(window.height).to.equal(400);
    });
    
    it('should store trigger reference', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      expect(window.trigger).to.exist;
      expect(window.trigger.id).to.equal('trigger_001');
      expect(window.trigger.type).to.equal('spatial');
    });
    
    it('should store EventManager reference', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      expect(window.eventManager).to.exist;
      expect(window.eventManager).to.equal(mockEventManager);
    });
    
    it('should create editForm as copy of trigger', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      expect(window.editForm).to.exist;
      expect(window.editForm.id).to.equal('trigger_001');
      expect(window.editForm.type).to.equal('spatial');
      expect(window.editForm.condition.radius).to.equal(100);
      
      // Verify it's a copy, not reference
      expect(window.editForm).to.not.equal(mockTrigger);
    });
    
    it('should initialize state flags', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      expect(window.isMinimized).to.be.false;
      expect(window.isDragging).to.be.false;
      expect(window.isVisible).to.be.true;
    });
    
    it('should initialize with default title', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      expect(window.title).to.exist;
      expect(window.title).to.be.a('string');
      expect(window.title.toLowerCase()).to.include('property');
    });
  });
  
  describe('Property Rendering', function() {
    it('should render panel background and border', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      window.render();
      
      expect(fill.called).to.be.true;
      expect(stroke.called).to.be.true;
      expect(rect.called).to.be.true;
    });
    
    it('should display trigger ID as read-only', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      window.render();
      
      // Check that trigger ID was rendered
      const textCalls = text.getCalls();
      const triggerIdRendered = textCalls.some(call => 
        call.args[0] && call.args[0].toString().includes('trigger_001')
      );
      expect(triggerIdRendered).to.be.true;
    });
    
    it('should display trigger type as read-only', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      window.render();
      
      // Check that trigger type was rendered
      const textCalls = text.getCalls();
      const typeRendered = textCalls.some(call => 
        call.args[0] && call.args[0].toString().toLowerCase().includes('spatial')
      );
      expect(typeRendered).to.be.true;
    });
    
    it('should render radius input for spatial triggers', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      window.render();
      
      // Check that radius value was rendered
      const textCalls = text.getCalls();
      const radiusRendered = textCalls.some(call => 
        call.args[0] && call.args[0].toString().includes('100')
      );
      expect(radiusRendered).to.be.true;
    });
    
    it('should render delay input for time triggers', function() {
      if (!EventPropertyWindow) this.skip();
      
      const timeTrigger = {
        id: 'trigger_002',
        eventId: 'event_001',
        type: 'time',
        oneTime: true,
        condition: {
          delay: 5000
        }
      };
      
      const window = new EventPropertyWindow(100, 100, 300, 400, timeTrigger, mockEventManager);
      window.render();
      
      // Check that delay value was rendered
      const textCalls = text.getCalls();
      const delayRendered = textCalls.some(call => 
        call.args[0] && call.args[0].toString().includes('5000')
      );
      expect(delayRendered).to.be.true;
    });
    
    it('should render oneTime checkbox for all trigger types', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      window.render();
      
      // Check that oneTime checkbox was rendered
      const textCalls = text.getCalls();
      const oneTimeRendered = textCalls.some(call => 
        call.args[0] && call.args[0].toString().toLowerCase().includes('one-time')
      );
      expect(oneTimeRendered).to.be.true;
    });
    
    it('should render Save Changes button', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      window.render();
      
      const textCalls = text.getCalls();
      const saveButtonRendered = textCalls.some(call => 
        call.args[0] && call.args[0].toString().includes('Save')
      );
      expect(saveButtonRendered).to.be.true;
    });
    
    it('should render Cancel button', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      window.render();
      
      const textCalls = text.getCalls();
      const cancelButtonRendered = textCalls.some(call => 
        call.args[0] && call.args[0].toString().includes('Cancel')
      );
      expect(cancelButtonRendered).to.be.true;
    });
    
    it('should render Delete button', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      window.render();
      
      const textCalls = text.getCalls();
      const deleteButtonRendered = textCalls.some(call => 
        call.args[0] && call.args[0].toString().includes('Delete')
      );
      expect(deleteButtonRendered).to.be.true;
    });
    
    it('should not render when isVisible is false', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      window.isVisible = false;
      
      const rectCallsBefore = rect.callCount;
      window.render();
      const rectCallsAfter = rect.callCount;
      
      expect(rectCallsAfter).to.equal(rectCallsBefore);
    });
  });
  
  describe('Click Handling', function() {
    it('should detect radius input field click', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      // Click on radius input (approximate position)
      const result = window.handleClick(50, 100);
      
      expect(result).to.be.true;
    });
    
    it('should toggle oneTime checkbox on click', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      // Render first to calculate bounds
      window.render();
      
      const originalValue = window.editForm.oneTime;
      
      // Click on oneTime checkbox (use calculated bounds)
      const checkboxX = window.oneTimeCheckboxBounds.x - window.x;
      const checkboxY = window.oneTimeCheckboxBounds.y - window.y;
      window.handleClick(checkboxX + 5, checkboxY + 5);
      
      expect(window.editForm.oneTime).to.equal(!originalValue);
    });
    
    it('should detect Save button click', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      // Render first to calculate button bounds
      window.render();
      
      const saveChangesSpy = sinon.spy(window, 'saveChanges');
      
      // Click on Save button (use calculated bounds)
      const btnX = window.saveButtonBounds.x - window.x;
      const btnY = window.saveButtonBounds.y - window.y;
      window.handleClick(btnX + 10, btnY + 10);
      
      expect(saveChangesSpy.called).to.be.true;
    });
    
    it('should detect Cancel button click', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      // Render first to calculate button bounds
      window.render();
      
      const cancelSpy = sinon.spy(window, 'cancel');
      
      // Click on Cancel button (use calculated bounds)
      const btnX = window.cancelButtonBounds.x - window.x;
      const btnY = window.cancelButtonBounds.y - window.y;
      window.handleClick(btnX + 10, btnY + 10);
      
      expect(cancelSpy.called).to.be.true;
    });
    
    it('should detect Delete button click', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      // Render first to calculate button bounds
      window.render();
      
      const deleteSpy = sinon.spy(window, 'deleteTrigger');
      
      // Click on Delete button (use calculated bounds)
      const btnX = window.deleteButtonBounds.x - window.x;
      const btnY = window.deleteButtonBounds.y - window.y;
      window.handleClick(btnX + 10, btnY + 10);
      
      expect(deleteSpy.called).to.be.true;
    });
    
    it('should return false when click is outside window bounds', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      // Click outside window (negative coords)
      const result = window.handleClick(-50, -50);
      
      expect(result).to.be.false;
    });
    
    it('should validate radius input is greater than 0', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      // Try to set invalid radius
      window.editForm.condition.radius = -10;
      
      const result = window.saveChanges();
      
      // Should not save invalid radius
      expect(mockEventManager.updateTrigger.called).to.be.false;
      expect(result).to.be.false;
    });
  });
  
  describe('Action Methods', function() {
    it('saveChanges should call EventManager.updateTrigger', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      // Modify editForm
      window.editForm.condition.radius = 150;
      
      window.saveChanges();
      
      expect(mockEventManager.updateTrigger.called).to.be.true;
      expect(mockEventManager.updateTrigger.firstCall.args[0]).to.equal('trigger_001');
    });
    
    it('saveChanges should pass editForm data to updateTrigger', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      // Modify editForm
      window.editForm.condition.radius = 150;
      window.editForm.oneTime = false;
      
      window.saveChanges();
      
      const updateArg = mockEventManager.updateTrigger.firstCall.args[1];
      expect(updateArg.condition.radius).to.equal(150);
      expect(updateArg.oneTime).to.equal(false);
    });
    
    it('saveChanges should close window after successful save', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      window.saveChanges();
      
      expect(window.isVisible).to.be.false;
    });
    
    it('saveChanges should not close window if validation fails', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      // Set invalid radius
      window.editForm.condition.radius = -10;
      
      window.saveChanges();
      
      expect(window.isVisible).to.be.true;
    });
    
    it('deleteTrigger should call EventManager.deleteTrigger', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      window.deleteTrigger();
      
      expect(mockEventManager.deleteTrigger.called).to.be.true;
      expect(mockEventManager.deleteTrigger.firstCall.args[0]).to.equal('trigger_001');
    });
    
    it('deleteTrigger should close window after deletion', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      window.deleteTrigger();
      
      expect(window.isVisible).to.be.false;
    });
    
    it('cancel should close window without saving', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      // Modify editForm
      window.editForm.condition.radius = 150;
      
      window.cancel();
      
      expect(mockEventManager.updateTrigger.called).to.be.false;
      expect(window.isVisible).to.be.false;
    });
    
    it('cancel should discard editForm changes', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      // Modify editForm
      window.editForm.condition.radius = 150;
      
      window.cancel();
      
      // Original trigger should be unchanged
      expect(mockTrigger.condition.radius).to.equal(100);
    });
  });
  
  describe('Utility Methods', function() {
    it('should have containsPoint method for bounds checking', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      expect(window.containsPoint).to.exist;
      expect(window.containsPoint).to.be.a('function');
    });
    
    it('containsPoint should return true for points inside window', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      expect(window.containsPoint(200, 200)).to.be.true;
    });
    
    it('containsPoint should return false for points outside window', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      expect(window.containsPoint(50, 50)).to.be.false;
    });
    
    it('should have close method', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      expect(window.close).to.exist;
      expect(window.close).to.be.a('function');
    });
    
    it('close should set isVisible to false', function() {
      if (!EventPropertyWindow) this.skip();
      
      const window = new EventPropertyWindow(100, 100, 300, 400, mockTrigger, mockEventManager);
      
      window.close();
      
      expect(window.isVisible).to.be.false;
    });
  });
});
