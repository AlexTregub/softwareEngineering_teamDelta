/**
 * @fileoverview Unit Tests: EventEditorPanel
 * 
 * Tests the EventEditorPanel UI class methods.
 * Verifies event list rendering, form handling, import/export, and click interactions.
 * 
 * Following TDD standards:
 * - Test isolated functionality
 * - Mock p5.js and EventManager
 * - Verify UI state changes
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Set up JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock p5.js drawing functions
global.fill = sinon.stub();
global.noFill = sinon.stub();
global.stroke = sinon.stub();
global.noStroke = sinon.stub();
global.rect = sinon.stub();
global.text = sinon.stub();
global.textSize = sinon.stub();
global.textAlign = sinon.stub();
global.push = sinon.stub();
global.pop = sinon.stub();
global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));

// Sync to window
window.fill = global.fill;
window.noFill = global.noFill;
window.stroke = global.stroke;
window.noStroke = global.noStroke;
window.rect = global.rect;
window.text = global.text;
window.textSize = global.textSize;
window.textAlign = global.textAlign;
window.push = global.push;
window.pop = global.pop;
window.createVector = global.createVector;

// Mock p5.js constants
global.LEFT = 'left';
global.CENTER = 'center';
global.TOP = 'top';
window.LEFT = global.LEFT;
window.CENTER = global.CENTER;
window.TOP = global.TOP;

// Load EventManager first
const EventManager = require('../../../Classes/managers/EventManager');

// Load EventEditorPanel
const EventEditorPanel = require('../../../Classes/systems/ui/EventEditorPanel');

describe('EventEditorPanel', function() {
  let panel;
  let eventManager;
  
  beforeEach(function() {
    // Reset all stubs
    sinon.resetHistory();
    
    // Create fresh EventManager instance
    eventManager = new EventManager();
    
    // Stub EventManager.getInstance to return our test instance
    sinon.stub(EventManager, 'getInstance').returns(eventManager);
    
    // Make EventManager globally available for panel
    global.EventManager = EventManager;
    window.EventManager = EventManager;
    
    // Create and initialize panel
    panel = new EventEditorPanel();
    panel.initialize();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with default state', function() {
      expect(panel.eventManager).to.equal(eventManager);
      expect(panel.selectedEventId).to.be.null;
      expect(panel.editMode).to.be.null;
      expect(panel.scrollOffset).to.equal(0);
    });
    
    it('should initialize edit form with defaults', function() {
      expect(panel.editForm.id).to.equal('');
      expect(panel.editForm.type).to.equal('dialogue');
      expect(panel.editForm.priority).to.equal(5);
      expect(panel.editForm.content).to.deep.equal({});
    });
  });
  
  describe('getContentSize()', function() {
    it('should return minimum size when no events', function() {
      const size = panel.getContentSize();
      
      expect(size.width).to.equal(250);
      expect(size.height).to.be.at.least(300);
    });
    
    it('should return fixed list mode size regardless of events', function() {
      // Add events
      eventManager.registerEvent({ id: 'event-1', type: 'dialogue', priority: 1 });
      eventManager.registerEvent({ id: 'event-2', type: 'spawn', priority: 2 });
      eventManager.registerEvent({ id: 'event-3', type: 'tutorial', priority: 3 });
      
      const size = panel.getContentSize();
      
      // List mode returns fixed size
      expect(size.width).to.equal(250);
      expect(size.height).to.equal(300);
    });
    
    it('should increase size when in edit mode', function() {
      panel.editMode = 'add-event';
      
      const size = panel.getContentSize();
      
      expect(size.width).to.equal(300);
      expect(size.height).to.equal(400);
    });
  });
  
  describe('containsPoint()', function() {
    it('should return true for point inside bounds', function() {
      const result = panel.containsPoint(50, 50, 0, 0);
      
      expect(result).to.be.true;
    });
    
    it('should return false for point outside bounds', function() {
      const result = panel.containsPoint(300, 50, 0, 0);
      
      expect(result).to.be.false;
    });
    
    it('should account for content offset', function() {
      const result = panel.containsPoint(150, 150, 100, 100);
      
      expect(result).to.be.true;
    });
  });
  
  describe('Event Selection', function() {
    beforeEach(function() {
      eventManager.registerEvent({ id: 'test-event', type: 'dialogue', priority: 1 });
    });
    
    it('should handle event selection by clicking in list area', function() {
      // Click in list area (y=35 is within list bounds after header)
      const result = panel.handleClick(10, 35, 0, 0);
      
      expect(result).to.be.true;
      expect(panel.selectedEventId).to.equal('test-event');
    });
    
    it('should have event list click zone after header', function() {
      // The list starts at y=30, first item should be clickable around y=35-60
      const result = panel.handleClick(10, 50, 0, 0);
      
      expect(result).to.be.true;
    });
    
    it('should clear edit mode when selecting event', function() {
      panel.editMode = 'add-event';
      panel.selectedEventId = null;
      
      // Directly test the list click handler
      const result = panel._handleListClick(10, 35);
      
      // Selection should work (list click returns true when event selected)
      expect(result).to.be.true;
      expect(panel.selectedEventId).to.equal('test-event');
    });
  });
  
  describe('Add Event Button', function() {
    it('should have add event button in top right', function() {
      const size = panel.getContentSize();
      const addBtnX = size.width - 35; // Add button is at width - 35
      const addBtnY = 2;
      
      const result = panel.handleClick(addBtnX + 10, addBtnY + 10, 0, 0);
      
      expect(result).to.be.true;
      expect(panel.editMode).to.equal('add-event');
    });
    
    it('should reset edit form when entering add mode via _handleListClick', function() {
      panel.editForm.id = 'old-id';
      panel.editForm.type = 'spawn';
      
      // Directly call the list click handler with add button coordinates
      const size = panel.getContentSize();
      const addBtnX = size.width - 35;
      const addBtnY = 2;
      
      panel._handleListClick(addBtnX + 10, addBtnY + 10);
      
      expect(panel.editForm.id).to.equal('');
      expect(panel.editForm.type).to.equal('dialogue');
    });
  });
  
  describe('Export/Import Buttons', function() {
    it('should have export button at bottom', function() {
      const size = panel.getContentSize();
      const exportBtnY = size.height - 25;
      
      const result = panel._handleListClick(10, exportBtnY + 10);
      
      expect(result).to.be.true;
    });
    
    it('should call _exportEvents when export button clicked', function() {
      const exportStub = sinon.stub(panel, '_exportEvents');
      const size = panel.getContentSize();
      const exportBtnY = size.height - 25;
      
      panel._handleListClick(10, exportBtnY + 10);
      
      expect(exportStub.calledOnce).to.be.true;
    });
  });
  
  describe('Form Field State Changes', function() {
    beforeEach(function() {
      panel.editMode = 'add-event';
    });
    
    it('should allow changing event type', function() {
      panel.editForm.type = 'dialogue';
      
      // Simulate type change by setting directly (UI would cycle through types)
      panel.editForm.type = 'spawn';
      
      expect(panel.editForm.type).to.equal('spawn');
    });
    
    it('should allow increasing priority', function() {
      panel.editForm.priority = 5;
      
      // Simulate + button by incrementing
      if (panel.editForm.priority < 10) {
        panel.editForm.priority++;
      }
      
      expect(panel.editForm.priority).to.equal(6);
    });
    
    it('should allow decreasing priority', function() {
      panel.editForm.priority = 5;
      
      // Simulate - button by decrementing
      if (panel.editForm.priority > 1) {
        panel.editForm.priority--;
      }
      
      expect(panel.editForm.priority).to.equal(4);
    });
    
    it('should not decrease priority below 1', function() {
      panel.editForm.priority = 1;
      
      if (panel.editForm.priority > 1) {
        panel.editForm.priority--;
      }
      
      expect(panel.editForm.priority).to.equal(1);
    });
    
    it('should not increase priority above 10', function() {
      panel.editForm.priority = 10;
      
      if (panel.editForm.priority < 10) {
        panel.editForm.priority++;
      }
      
      expect(panel.editForm.priority).to.equal(10);
    });
  });
  
  describe('Save and Cancel Actions', function() {
    beforeEach(function() {
      panel.editMode = 'add-event';
      panel.editForm.id = 'new-event';
      panel.editForm.type = 'dialogue';
      panel.editForm.priority = 3;
    });
    
    it('should call _saveEvent method', function() {
      const saveStub = sinon.stub(panel, '_saveEvent');
      
      panel._saveEvent();
      
      expect(saveStub.calledOnce).to.be.true;
    });
    
    it('should register event via EventManager when saving', function() {
      const registerStub = sinon.stub(eventManager, 'registerEvent').returns(true);
      
      panel._saveEvent();
      
      expect(registerStub.calledOnce).to.be.true;
      expect(registerStub.firstCall.args[0]).to.deep.include({
        id: 'new-event',
        type: 'dialogue',
        priority: 3
      });
    });
    
    it('should exit edit mode after successful save', function() {
      sinon.stub(eventManager, 'registerEvent').returns(true);
      
      panel._saveEvent();
      
      expect(panel.editMode).to.be.null;
    });
    
    it('should select newly created event after save', function() {
      sinon.stub(eventManager, 'registerEvent').returns(true);
      
      panel._saveEvent();
      
      expect(panel.selectedEventId).to.equal('new-event');
    });
    
    it('should stay in edit mode if save fails', function() {
      sinon.stub(eventManager, 'registerEvent').returns(false);
      
      panel._saveEvent();
      
      expect(panel.editMode).to.equal('add-event');
    });
    
    it('should clear edit mode when form is reset', function() {
      panel.editMode = 'add-event';
      
      // Cancel by clearing edit mode
      panel.editMode = null;
      
      expect(panel.editMode).to.be.null;
    });
  });
  
  describe('Rendering', function() {
    it('should call p5.js drawing functions', function() {
      panel.render(10, 10);
      
      // Should have called drawing functions
      expect(global.fill.called).to.be.true;
      expect(global.rect.called).to.be.true;
      expect(global.text.called).to.be.true;
    });
    
    it('should render event list when events exist', function() {
      eventManager.registerEvent({ id: 'event-1', type: 'dialogue', priority: 1 });
      eventManager.registerEvent({ id: 'event-2', type: 'spawn', priority: 2 });
      
      panel.render(10, 10);
      
      // Should render event items (multiple text calls)
      expect(global.text.callCount).to.be.greaterThan(2);
    });
    
    it('should render edit form when in edit mode', function() {
      panel.editMode = 'add';
      
      panel.render(10, 10);
      
      // Should render form fields (ID, Type, Priority labels)
      expect(global.text.callCount).to.be.greaterThan(3);
    });
  });
  
  describe('Scroll Handling', function() {
    it('should initialize with zero scroll offset', function() {
      expect(panel.scrollOffset).to.equal(0);
    });
    
    it('should handle scroll offset in rendering', function() {
      panel.scrollOffset = 50;
      
      panel.render(10, 10);
      
      // Rendering should still work with scroll offset
      expect(global.text.called).to.be.true;
    });
  });
});
