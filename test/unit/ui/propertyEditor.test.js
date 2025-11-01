/**
 * Unit Tests: EventEditorPanel Property Editor
 * 
 * Tests property editor for editing existing event triggers.
 * Property editor appears when user clicks on flag icon in Level Editor.
 * 
 * Following TDD: RED PHASE - Tests will fail until property editor is implemented.
 * 
 * Test Coverage:
 * - _enterEditMode(triggerId) - Load trigger into edit form
 * - _renderPropertyEditor(x, y, width, height) - Render readonly + editable fields
 * - _handlePropertyEditorClick(relX, relY) - Save Changes, Delete, Cancel clicks
 * - _updateTrigger() - Save changes to EventManager
 * - _deleteTrigger() - Remove trigger from EventManager
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Import EventEditorPanel
const EventEditorPanel = require('../../../Classes/systems/ui/EventEditorPanel');
const EventManager = require('../../../Classes/managers/EventManager');

describe('EventEditorPanel Property Editor Tests', function() {
  let sandbox;
  let panel;
  let eventManager;
  let mockP5;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock global logging
    global.logNormal = sandbox.stub();
    window.logNormal = global.logNormal;
    
    // Mock p5.js rendering functions
    mockP5 = {
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      strokeWeight: sandbox.stub(),
      noStroke: sandbox.stub(),
      noFill: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub(),
      textAlign: sandbox.stub(),
      textSize: sandbox.stub(),
      push: sandbox.stub(),
      pop: sandbox.stub(),
      ellipse: sandbox.stub(),
      createVector: sandbox.stub().callsFake((x, y) => ({ x, y })),
      CENTER: 'center',
      TOP: 'top',
      BOTTOM: 'bottom',
      LEFT: 'left',
      RIGHT: 'right'
    };
    
    // Sync to global and window
    Object.assign(global, mockP5);
    Object.assign(window, mockP5);
    
    // Initialize EventManager
    eventManager = new EventManager();
    global.eventManager = eventManager;
    window.eventManager = eventManager;
    
    // Create panel
    panel = new EventEditorPanel();
    panel.eventManager = eventManager; // Link EventManager to panel
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.eventManager;
    delete window.eventManager;
    delete global.logNormal;
    delete window.logNormal;
  });
  
  describe('_enterEditMode()', function() {
    it('should load trigger into editForm', function() {
      // Register event and trigger
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'spatial',
        condition: { x: 100, y: 200, radius: 64, shape: 'circle' },
        oneTime: true
      });
      
      // Get auto-generated trigger ID
      const triggerId = Array.from(eventManager.triggers.keys())[0];
      
      // Enter edit mode
      panel._enterEditMode(triggerId);
      
      // Verify editForm populated
      expect(panel.editForm.triggerId).to.equal(triggerId);
      expect(panel.editForm.eventId).to.equal('test_event');
      expect(panel.editForm.triggerType).to.equal('spatial');
      expect(panel.editForm.condition).to.deep.equal({ x: 100, y: 200, radius: 64, shape: 'circle' });
      expect(panel.editForm.oneTime).to.be.true;
    });
    
    it('should set editMode to "edit"', function() {
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'spatial',
        condition: { x: 100, y: 200, radius: 64 }
      });
      
      const triggerId = Array.from(eventManager.triggers.keys())[0];
      
      panel._enterEditMode(triggerId);
      
      expect(panel.editMode).to.equal('edit');
    });
    
    it('should return false if trigger not found', function() {
      const result = panel._enterEditMode('nonexistent_trigger');
      
      expect(result).to.be.false;
      expect(panel.editMode).to.not.equal('edit');
    });
  });
  
  describe('_renderPropertyEditor()', function() {
    let triggerId;
    
    beforeEach(function() {
      // Setup edit mode with trigger data
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'spatial',
        condition: { x: 100, y: 200, radius: 64, shape: 'circle' },
        oneTime: true
      });
      triggerId = Array.from(eventManager.triggers.keys())[0];
      panel._enterEditMode(triggerId);
    });
    
    it('should render "Edit Trigger" header', function() {
      panel._renderPropertyEditor(10, 10, 300, 400);
      
      const headerCall = mockP5.text.getCalls().find(call =>
        call.args[0] === 'Edit Trigger'
      );
      expect(headerCall).to.exist;
    });
    
    it('should render Event ID as readonly field', function() {
      panel._renderPropertyEditor(10, 10, 300, 400);
      
      // Check for "Event ID:" label
      const labelCall = mockP5.text.getCalls().find(call =>
        call.args[0] === 'Event ID:'
      );
      expect(labelCall).to.exist;
      
      // Check for event ID value
      const valueCall = mockP5.text.getCalls().find(call =>
        call.args[0] === 'test_event'
      );
      expect(valueCall).to.exist;
    });
    
    it('should render Trigger Type as readonly field', function() {
      panel._renderPropertyEditor(10, 10, 300, 400);
      
      // Check for "Type:" label
      const labelCall = mockP5.text.getCalls().find(call =>
        call.args[0] === 'Type:'
      );
      expect(labelCall).to.exist;
      
      // Check for type value
      const valueCall = mockP5.text.getCalls().find(call =>
        call.args[0] === 'spatial'
      );
      expect(valueCall).to.exist;
    });
    
    it('should render spatial trigger fields (editable)', function() {
      panel._renderPropertyEditor(10, 10, 300, 400);
      
      // Check for X, Y, Radius labels
      const xLabel = mockP5.text.getCalls().find(call => call.args[0] === 'X:');
      const yLabel = mockP5.text.getCalls().find(call => call.args[0] === 'Y:');
      const radiusLabel = mockP5.text.getCalls().find(call => call.args[0] === 'Radius:');
      
      expect(xLabel).to.exist;
      expect(yLabel).to.exist;
      expect(radiusLabel).to.exist;
      
      // Check for shape radio buttons
      const circleLabel = mockP5.text.getCalls().find(call => call.args[0] === 'Circle');
      const rectangleLabel = mockP5.text.getCalls().find(call => call.args[0] === 'Rectangle');
      
      expect(circleLabel).to.exist;
      expect(rectangleLabel).to.exist;
    });
    
    it('should render time trigger fields when type is time', function() {
      // Setup time trigger
      eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'time',
        condition: { delay: 5000 }
      });
      const timeTriggerId = Array.from(eventManager.triggers.keys())[1]; // Second trigger
      panel._enterEditMode(timeTriggerId);
      
      panel._renderPropertyEditor(10, 10, 300, 400);
      
      // Check for Delay label
      const delayLabel = mockP5.text.getCalls().find(call => call.args[0] === 'Delay (ms):');
      expect(delayLabel).to.exist;
      
      // Should NOT render spatial fields
      const xLabel = mockP5.text.getCalls().find(call => call.args[0] === 'X:');
      expect(xLabel).to.not.exist;
    });
    
    it('should render One-Time checkbox', function() {
      panel._renderPropertyEditor(10, 10, 300, 400);
      
      const checkboxLabel = mockP5.text.getCalls().find(call =>
        call.args[0] === 'One-Time (non-repeatable)'
      );
      expect(checkboxLabel).to.exist;
      
      // Check checkbox rendered (filled or unfilled based on state)
      expect(mockP5.rect.called).to.be.true;
    });
    
    it('should render Save Changes button', function() {
      panel._renderPropertyEditor(10, 10, 300, 400);
      
      const buttonLabel = mockP5.text.getCalls().find(call =>
        call.args[0] === 'Save Changes'
      );
      expect(buttonLabel).to.exist;
    });
    
    it('should render Delete button', function() {
      panel._renderPropertyEditor(10, 10, 300, 400);
      
      const buttonLabel = mockP5.text.getCalls().find(call =>
        call.args[0] === 'Delete Trigger'
      );
      expect(buttonLabel).to.exist;
    });
    
    it('should render Cancel button', function() {
      panel._renderPropertyEditor(10, 10, 300, 400);
      
      const buttonLabel = mockP5.text.getCalls().find(call =>
        call.args[0] === 'Cancel'
      );
      expect(buttonLabel).to.exist;
    });
  });
  
  describe('_handlePropertyEditorClick()', function() {
    let triggerId;
    
    beforeEach(function() {
      // Setup edit mode with spatial trigger
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'spatial',
        condition: { x: 100, y: 200, radius: 64, shape: 'circle' },
        oneTime: true
      });
      triggerId = Array.from(eventManager.triggers.keys())[0];
      panel._enterEditMode(triggerId);
      
      // Set panel dimensions needed for click detection
      panel.contentWidth = 300;
      panel.contentHeight = 400;
    });
    
    it('should detect Save Changes button click', function() {
      // Render to establish coordinates
      panel._renderPropertyEditor(10, 10, 300, 400);
      
      // Find Save Changes button Y position (near bottom)
      // buttonY = y + height - 50 = 10 + 400 - 50 = 360
      const saveY = 360;
      // Save button X position = x + 30 + buttonWidth * 2 + buttonWidth / 2
      // buttonWidth = (300 - 40) / 3 = 86.67
      // saveX = 10 + 30 + 86.67 * 2 + 86.67 / 2 = 10 + 30 + 173.34 + 43.33 = 256.67
      const saveX = 240;
      
      const result = panel._handlePropertyEditorClick(saveX, saveY);
      
      expect(result).to.exist;
      expect(result.action).to.equal('save');
    });
    
    it('should detect Delete button click', function() {
      panel._renderPropertyEditor(10, 10, 300, 400);
      
      // Find Delete button Y position
      const deleteY = 400 - 45; // Approximate position
      
      const result = panel._handlePropertyEditorClick(150, deleteY);
      
      expect(result).to.exist;
      expect(result.action).to.equal('delete');
    });
    
    it('should detect Cancel button click', function() {
      panel._renderPropertyEditor(10, 10, 300, 400);
      
      // Find Cancel button Y position
      const cancelY = 400 - 45; // Approximate position
      
      const result = panel._handlePropertyEditorClick(50, cancelY);
      
      expect(result).to.exist;
      expect(result.action).to.equal('cancel');
    });
    
    it('should detect One-Time checkbox click', function() {
      panel._renderPropertyEditor(10, 10, 300, 400);
      
      // Find checkbox Y position
      // checkboxY = buttonY - 90 = 360 - 90 = 270
      const checkboxY = 270;
      const checkboxX = 15; // 10 + a few pixels inside
      
      const result = panel._handlePropertyEditorClick(checkboxX, checkboxY);
      
      expect(result).to.exist;
      expect(result.action).to.equal('toggleOneTime');
    });
    
    it('should detect shape radio button clicks', function() {
      panel._renderPropertyEditor(10, 10, 300, 400);
      
      // Find Circle radio button position
      const shapeY = 150; // Approximate position
      
      const result = panel._handlePropertyEditorClick(30, shapeY);
      
      expect(result).to.exist;
      expect(result.action).to.equal('setShape');
      expect(result.shape).to.be.oneOf(['circle', 'rectangle']);
    });
  });
  
  describe('_updateTrigger()', function() {
    it('should update trigger in EventManager', function() {
      // Register trigger
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'spatial',
        condition: { x: 100, y: 200, radius: 64 },
        oneTime: false
      });
      
      const triggerId = Array.from(eventManager.triggers.keys())[0];
      
      // Enter edit mode and modify
      panel._enterEditMode(triggerId);
      panel.editForm.condition.x = 500;
      panel.editForm.condition.radius = 128;
      panel.editForm.oneTime = true;
      
      // Update trigger
      const result = panel._updateTrigger();
      
      expect(result).to.be.true;
      
      // Verify trigger updated in EventManager
      const trigger = eventManager.triggers.get(triggerId);
      expect(trigger.condition.x).to.equal(500);
      expect(trigger.condition.radius).to.equal(128);
      expect(trigger.repeatable).to.be.true; // oneTime:false = repeatable
    });
    
    it('should reset editMode after successful update', function() {
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'spatial',
        condition: { x: 100, y: 200, radius: 64 }
      });
      
      const triggerId = Array.from(eventManager.triggers.keys())[0];
      
      panel._enterEditMode(triggerId);
      panel._updateTrigger();
      
      expect(panel.editMode).to.equal('list');
    });
  });
  
  describe('_deleteTrigger()', function() {
    it('should remove trigger from EventManager', function() {
      // Register trigger
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'spatial',
        condition: { x: 100, y: 200, radius: 64 }
      });
      
      const triggerId = Array.from(eventManager.triggers.keys())[0];
      
      // Enter edit mode and delete
      panel._enterEditMode(triggerId);
      const result = panel._deleteTrigger();
      
      expect(result).to.be.true;
      
      // Verify trigger removed from EventManager
      const trigger = eventManager.triggers.get(triggerId);
      expect(trigger).to.be.undefined;
    });
    
    it('should reset editMode after successful delete', function() {
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'spatial',
        condition: { x: 100, y: 200, radius: 64 }
      });
      
      const triggerId = Array.from(eventManager.triggers.keys())[0];
      
      panel._enterEditMode(triggerId);
      panel._deleteTrigger();
      
      expect(panel.editMode).to.equal('list');
    });
  });
});
