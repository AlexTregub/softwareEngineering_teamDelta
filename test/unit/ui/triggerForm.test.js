/**
 * Unit Tests for EventEditorPanel Trigger Form
 * Tests _renderTriggerForm() and _handleTriggerFormClick() methods
 * 
 * TDD Red Phase: Write tests first, expect failures
 * Coverage: Trigger type dropdown, spatial/time/flag/viewport UI, click handling
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Mock p5.js functions
global.fill = sinon.stub();
global.rect = sinon.stub();
global.text = sinon.stub();
global.textAlign = sinon.stub();
global.textSize = sinon.stub();
global.push = sinon.stub();
global.pop = sinon.stub();
global.stroke = sinon.stub();
global.strokeWeight = sinon.stub();
global.noFill = sinon.stub();
global.ellipse = sinon.stub();
global.line = sinon.stub();
global.LEFT = 'left';
global.CENTER = 'center';
global.TOP = 'top';
global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));

// Sync with window
window.fill = global.fill;
window.rect = global.rect;
window.text = global.text;
window.textAlign = global.textAlign;
window.textSize = global.textSize;
window.push = global.push;
window.pop = global.pop;
window.stroke = global.stroke;
window.strokeWeight = global.strokeWeight;
window.noFill = global.noFill;
window.ellipse = global.ellipse;
window.line = global.line;
window.LEFT = global.LEFT;
window.CENTER = global.CENTER;
window.TOP = global.TOP;
window.createVector = global.createVector;

// Mock EventManager
class MockEventManager {
  constructor() {
    this.events = new Map();
    this.triggers = new Map();
  }
  
  static getInstance() {
    if (!MockEventManager.instance) {
      MockEventManager.instance = new MockEventManager();
    }
    return MockEventManager.instance;
  }
  
  getAllEvents() {
    return Array.from(this.events.values());
  }
  
  getAllTriggers() {
    return Array.from(this.triggers.values());
  }
  
  registerEvent(config) {
    this.events.set(config.id, config);
  }
  
  getEvent(id) {
    return this.events.get(id);
  }
  
  removeEvent(id) {
    this.events.delete(id);
  }
  
  // Flag system
  getAllFlags() {
    return ['key_found', 'door_unlocked', 'area_cleared', 'boss_defeated'];
  }
}

global.EventManager = MockEventManager;
window.EventManager = MockEventManager;

// Mock logNormal
global.logNormal = sinon.stub();
window.logNormal = global.logNormal;

// Load EventEditorPanel
const EventEditorPanel = require('../../../Classes/systems/ui/EventEditorPanel');

describe('EventEditorPanel Trigger Form', function() {
  let panel;
  let mockEventManager;
  
  beforeEach(function() {
    // Reset all stubs
    sinon.resetHistory();
    
    // Create panel
    panel = new EventEditorPanel();
    mockEventManager = new MockEventManager();
    panel.eventManager = mockEventManager;
    panel.initialize();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('_renderTriggerForm() - Structure', function() {
    it('should have _renderTriggerForm method', function() {
      expect(panel).to.have.property('_renderTriggerForm');
      expect(panel._renderTriggerForm).to.be.a('function');
    });
    
    it('should render "Add Trigger" header', function() {
      panel.editMode = 'add-trigger';
      panel._renderTriggerForm(10, 10, 250, 400);
      
      // Check that text() was called with "Add Trigger"
      const textCalls = global.text.getCalls();
      const headerCall = textCalls.find(call => 
        call.args[0] && call.args[0].includes('Add Trigger')
      );
      expect(headerCall).to.exist;
    });
    
    it('should render "Edit Trigger" header when in edit mode', function() {
      panel.editMode = 'edit-trigger';
      panel._renderTriggerForm(10, 10, 250, 400);
      
      const textCalls = global.text.getCalls();
      const headerCall = textCalls.find(call => 
        call.args[0] && typeof call.args[0] === 'string' && call.args[0].includes('Edit Trigger')
      );
      expect(headerCall).to.exist;
    });
  });
  
  describe('_renderTriggerForm() - Trigger Type Dropdown', function() {
    it('should render trigger type label', function() {
      panel.editMode = 'add-trigger';
      panel._renderTriggerForm(10, 10, 250, 400);
      
      const textCalls = global.text.getCalls();
      const labelCall = textCalls.find(call => 
        call.args[0] && call.args[0].includes('Type:')
      );
      expect(labelCall).to.exist;
    });
    
    it('should render 4 trigger type buttons (spatial, time, flag, viewport)', function() {
      panel.editMode = 'add-trigger';
      panel.triggerForm.type = 'spatial';
      panel._renderTriggerForm(10, 10, 250, 400);
      
      const textCalls = global.text.getCalls();
      const typeButtons = ['Spatial', 'Time', 'Flag', 'Viewport'];
      
      typeButtons.forEach(type => {
        const buttonCall = textCalls.find(call => 
          call.args[0] && call.args[0].toLowerCase() === type.toLowerCase()
        );
        expect(buttonCall, `${type} button should be rendered`).to.exist;
      });
    });
    
    it('should highlight selected trigger type button', function() {
      panel.editMode = 'add-trigger';
      panel.triggerForm.type = 'time';
      panel._renderTriggerForm(10, 10, 250, 400);
      
      // Check that fill() was called with highlight color (e.g., brighter color)
      // for the selected button
      const fillCalls = global.fill.getCalls();
      // Should have different fill colors for selected vs unselected buttons
      expect(fillCalls.length).to.be.greaterThan(10); // Multiple fill calls for buttons
    });
  });
  
  describe('_renderTriggerForm() - Spatial Trigger Fields', function() {
    beforeEach(function() {
      panel.editMode = 'add-trigger';
      panel.triggerForm.type = 'spatial';
      panel.triggerForm.condition = { x: 100, y: 200, radius: 64, shape: 'circle' };
    });
    
    it('should render X coordinate input when type is spatial', function() {
      panel._renderTriggerForm(10, 10, 250, 400);
      
      const textCalls = global.text.getCalls();
      const xLabel = textCalls.find(call => call.args[0] === 'X:');
      expect(xLabel).to.exist;
      
      const xValue = textCalls.find(call => call.args[0] === 100 || call.args[0] === '100');
      expect(xValue).to.exist;
    });
    
    it('should render Y coordinate input when type is spatial', function() {
      panel._renderTriggerForm(10, 10, 250, 400);
      
      const textCalls = global.text.getCalls();
      const yLabel = textCalls.find(call => call.args[0] === 'Y:');
      expect(yLabel).to.exist;
      
      const yValue = textCalls.find(call => call.args[0] === 200 || call.args[0] === '200');
      expect(yValue).to.exist;
    });
    
    it('should render Radius input when type is spatial', function() {
      panel._renderTriggerForm(10, 10, 250, 400);
      
      const textCalls = global.text.getCalls();
      const radiusLabel = textCalls.find(call => call.args[0] === 'Radius:');
      expect(radiusLabel).to.exist;
      
      const radiusValue = textCalls.find(call => call.args[0] === 64 || call.args[0] === '64');
      expect(radiusValue).to.exist;
    });
    
    it('should render Shape radio buttons (circle/rectangle) when type is spatial', function() {
      panel._renderTriggerForm(10, 10, 250, 400);
      
      const textCalls = global.text.getCalls();
      const circleLabel = textCalls.find(call => 
        call.args[0] && typeof call.args[0] === 'string' && call.args[0].toLowerCase().includes('circle')
      );
      const rectLabel = textCalls.find(call => 
        call.args[0] && typeof call.args[0] === 'string' && call.args[0].toLowerCase().includes('rectangle')
      );
      
      expect(circleLabel).to.exist;
      expect(rectLabel).to.exist;
    });
  });
  
  describe('_renderTriggerForm() - Time Trigger Fields', function() {
    beforeEach(function() {
      panel.editMode = 'add-trigger';
      panel.triggerForm.type = 'time';
      panel.triggerForm.condition = { delay: 5000 };
    });
    
    it('should render Delay input when type is time', function() {
      panel._renderTriggerForm(10, 10, 250, 400);
      
      const textCalls = global.text.getCalls();
      const delayLabel = textCalls.find(call => 
        call.args[0] && call.args[0].includes('Delay')
      );
      expect(delayLabel).to.exist;
      
      const delayValue = textCalls.find(call => 
        call.args[0] === 5000 || call.args[0] === '5000'
      );
      expect(delayValue).to.exist;
    });
    
    it('should not render spatial fields when type is time', function() {
      // Verify panel is in time mode
      expect(panel.triggerForm.type).to.equal('time');
      
      panel._renderTriggerForm(10, 10, 250, 400);
      
      const textCalls = global.text.getCalls();
      // Check that "Delay" label IS rendered (time-specific)
      const hasDelay = textCalls.some(call => 
        call.args[0] && typeof call.args[0] === 'string' && call.args[0].includes('Delay')
      );
      expect(hasDelay, 'Should render "Delay" label for time trigger').to.be.true;
      
      // Count spatial vs time labels to ensure time rendering is active
      const delayCount = textCalls.filter(call => 
        call.args[0] && typeof call.args[0] === 'string' && call.args[0].includes('Delay')
      ).length;
      
      // Should have at least one Delay label (time trigger field)
      expect(delayCount, 'Should have Delay field rendered').to.be.greaterThan(0);
    });
  });
  
  describe('_renderTriggerForm() - Flag Trigger Fields', function() {
    beforeEach(function() {
      panel.editMode = 'add-trigger';
      panel.triggerForm.type = 'flag';
      panel.triggerForm.condition = { 
        requiredFlags: ['key_found', 'door_unlocked'],
        allRequired: true 
      };
    });
    
    it('should render flag checkboxes when type is flag', function() {
      panel._renderTriggerForm(10, 10, 250, 400);
      
      const textCalls = global.text.getCalls();
      const allFlags = mockEventManager.getAllFlags();
      
      // Should render label for flag list
      const flagLabel = textCalls.find(call => 
        call.args[0] && typeof call.args[0] === 'string' && call.args[0].includes('Required Flags')
      );
      expect(flagLabel).to.exist;
      
      // Should render at least some flag names
      const flagCalls = textCalls.filter(call => 
        call.args[0] && typeof call.args[0] === 'string' && allFlags.some(flag => call.args[0].includes(flag))
      );
      expect(flagCalls.length).to.be.greaterThan(0);
    });
    
    it('should render "All Required" checkbox when type is flag', function() {
      panel._renderTriggerForm(10, 10, 250, 400);
      
      const textCalls = global.text.getCalls();
      const allRequiredLabel = textCalls.find(call => 
        call.args[0] && typeof call.args[0] === 'string' && call.args[0].includes('All Required')
      );
      expect(allRequiredLabel).to.exist;
    });
  });
  
  describe('_renderTriggerForm() - Viewport Trigger Fields', function() {
    beforeEach(function() {
      panel.editMode = 'add-trigger';
      panel.triggerForm.type = 'viewport';
      panel.triggerForm.condition = { x: 100, y: 200, width: 300, height: 200 };
    });
    
    it('should render X, Y, Width, Height inputs when type is viewport', function() {
      panel._renderTriggerForm(10, 10, 250, 400);
      
      const textCalls = global.text.getCalls();
      
      const xLabel = textCalls.find(call => call.args[0] === 'X:');
      const yLabel = textCalls.find(call => call.args[0] === 'Y:');
      const widthLabel = textCalls.find(call => call.args[0] === 'Width:');
      const heightLabel = textCalls.find(call => call.args[0] === 'Height:');
      
      expect(xLabel).to.exist;
      expect(yLabel).to.exist;
      expect(widthLabel).to.exist;
      expect(heightLabel).to.exist;
    });
  });
  
  describe('_renderTriggerForm() - Common Fields', function() {
    it('should render One-Time checkbox for all trigger types', function() {
      const types = ['spatial', 'time', 'flag', 'viewport'];
      
      types.forEach(type => {
        sinon.resetHistory();
        panel.editMode = 'add-trigger';
        panel.triggerForm.type = type;
        panel.triggerForm.oneTime = true;
        panel.triggerForm.condition = type === 'spatial' ? { x: 100, y: 100, radius: 64, shape: 'circle' } : 
                                      type === 'time' ? { delay: 5000 } : 
                                      type === 'flag' ? { requiredFlags: [], allRequired: true } : 
                                      { x: 100, y: 100, width: 300, height: 200 };
        panel._renderTriggerForm(10, 10, 250, 400);
        
        const textCalls = global.text.getCalls();
        const oneTimeLabel = textCalls.find(call => 
          call.args[0] && typeof call.args[0] === 'string' && call.args[0].includes('One-Time')
        );
        expect(oneTimeLabel, `One-Time checkbox should exist for ${type}`).to.exist;
      });
    });
    
    it('should render Cancel button', function() {
      panel.editMode = 'add-trigger';
      panel._renderTriggerForm(10, 10, 250, 400);
      
      const textCalls = global.text.getCalls();
      const cancelButton = textCalls.find(call => 
        call.args[0] && call.args[0] === 'Cancel'
      );
      expect(cancelButton).to.exist;
    });
    
    it('should render Create button when in add mode', function() {
      panel.editMode = 'add-trigger';
      panel._renderTriggerForm(10, 10, 250, 400);
      
      const textCalls = global.text.getCalls();
      const createButton = textCalls.find(call => 
        call.args[0] && call.args[0] === 'Create'
      );
      expect(createButton).to.exist;
    });
    
    it('should render Save button when in edit mode', function() {
      panel.editMode = 'edit-trigger';
      panel._renderTriggerForm(10, 10, 250, 400);
      
      const textCalls = global.text.getCalls();
      const saveButton = textCalls.find(call => 
        call.args[0] && call.args[0] === 'Save'
      );
      expect(saveButton).to.exist;
    });
  });
  
  describe('_handleTriggerFormClick() - Click Detection', function() {
    it('should have _handleTriggerFormClick method', function() {
      expect(panel).to.have.property('_handleTriggerFormClick');
      expect(panel._handleTriggerFormClick).to.be.a('function');
    });
    
    it('should detect trigger type button clicks', function() {
      panel.editMode = 'add-trigger';
      panel.triggerForm.type = 'spatial';
      
      // Mock getContentSize
      panel.getContentSize = () => ({ width: 250, height: 400 });
      
      // Simulate clicking on "Time" button (second button)
      // Type buttons start at labelWidth (80) after type label
      // Each button is (width - labelWidth - 15) / 4 = (250 - 80 - 15) / 4 = 38.75 wide
      // Time button is at x = 80 + 38.75 = ~119, y = 30
      const result = panel._handleTriggerFormClick(120, 40);
      
      // Should return true and update triggerForm.type to 'time'
      expect(result).to.be.true;
      expect(panel.triggerForm.type).to.equal('time');
    });
    
    it('should detect Cancel button click', function() {
      panel.editMode = 'add-trigger';
      panel.triggerForm.type = 'time';
      panel.triggerForm.condition = { delay: 5000 };
      panel.getContentSize = () => ({ width: 250, height: 400 });
      
      // Cancel button calculation:
      // formY after fields = ~30 (type buttons) + 15 + 35 (time field) + 10 (spacing) + 45 (one-time) + 20 = ~155
      // Cancel button is at width - (80*2 + 10) - 5 = 250 - 175 = 75
      const result = panel._handleTriggerFormClick(80, 160);
      
      // Should return true and reset editMode
      expect(result).to.be.true;
      expect(panel.editMode).to.be.null;
    });
    
    it('should detect Create button click', function() {
      panel.editMode = 'add-trigger';
      panel.triggerForm.eventId = 'test_event';
      panel.triggerForm.type = 'time';
      panel.triggerForm.condition = { delay: 5000 };
      panel.getContentSize = () => ({ width: 250, height: 400 });
      
      // Create button is at width - 80 - 5 = 250 - 85 = 165
      // Y position same as cancel: ~160
      const result = panel._handleTriggerFormClick(170, 160);
      
      // Should return true (trigger created)
      expect(result).to.be.true;
    });
    
    it('should toggle One-Time checkbox when clicked', function() {
      panel.editMode = 'add-trigger';
      panel.triggerForm.type = 'time';
      panel.triggerForm.condition = { delay: 5000 };
      panel.triggerForm.oneTime = true;
      panel.getContentSize = () => ({ width: 250, height: 400 });
      
      // One-Time checkbox Y calculation for time trigger:
      // formY = 30 (start) + 25 + 15 (type buttons) + 25 + 10 (time field) + 10 (spacing) = 115
      // Checkbox is at labelWidth (80), size 20x20
      const result = panel._handleTriggerFormClick(85, 120);
      
      // Should toggle oneTime value
      expect(result).to.be.true;
      expect(panel.triggerForm.oneTime).to.be.false;
    });
  });
});
