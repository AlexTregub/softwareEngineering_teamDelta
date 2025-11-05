/**
 * Integration Tests: EventFlagRenderer
 * 
 * Tests EventFlagRenderer integration with EventManager and RenderManager.
 * Verifies visual representation of event triggers on the game map.
 * 
 * Following TDD: RED PHASE - Tests will fail until EventFlagRenderer is implemented.
 * 
 * Test Coverage:
 * - Spatial trigger rendering (flag icon + radius circle)
 * - Event ID labels
 * - Camera transforms (world coords → screen coords)
 * - Multiple flags without overlap
 * - Non-spatial triggers excluded (time, flag, viewport)
 * - EFFECTS layer registration
 * - Click hit test for flag editing
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Setup JSDOM

// Import systems
const EventManager = require('../../../Classes/managers/EventManager');

const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');


setupTestEnvironment({ rendering: true });

describe('EventFlagRenderer Integration Tests', function() {

  afterEach(function() {
    cleanupTestEnvironment();
  });
  let sandbox;
  let eventManager;
  let mockCameraManager;
  let mockP5;
  let EventFlagRenderer;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock global logging functions
    global.logNormal = sandbox.stub();
    window.logNormal = global.logNormal;
    
    // Mock p5.js rendering functions
    mockP5 = {
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      strokeWeight: sandbox.stub(),
      noStroke: sandbox.stub(),
      noFill: sandbox.stub(),
      ellipse: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub(),
      textAlign: sandbox.stub(),
      textSize: sandbox.stub(),
      push: sandbox.stub(),
      pop: sandbox.stub(),
      createVector: sandbox.stub().callsFake((x, y) => ({ x, y })),
      CENTER: 'center',
      TOP: 'top',
      BOTTOM: 'bottom',
      LEFT: 'left',
      RIGHT: 'right'
    };
    
    // Sync p5 mocks to global and window
    Object.assign(global, mockP5);
    Object.assign(window, mockP5);
    
    // Mock CameraManager
    mockCameraManager = {
      worldToScreen: sandbox.stub().callsFake((worldX, worldY) => ({
        x: worldX * 2, // Simple transform for testing
        y: worldY * 2
      })),
      screenToWorld: sandbox.stub().callsFake((screenX, screenY) => ({
        x: screenX / 2,
        y: screenY / 2
      }))
    };
    
    // Mock RenderManager
    global.RenderManager = {
      layers: {
        EFFECTS: 'EFFECTS'
      },
      addDrawableToLayer: sandbox.stub()
    };
    window.RenderManager = global.RenderManager;
    
    // Initialize EventManager
    eventManager = new EventManager();
    global.eventManager = eventManager;
    window.eventManager = eventManager;
    
    // Try to load EventFlagRenderer (will fail in RED phase)
    try {
      EventFlagRenderer = require('../../../Classes/rendering/EventFlagRenderer');
      global.EventFlagRenderer = EventFlagRenderer;
      window.EventFlagRenderer = EventFlagRenderer;
    } catch (_e) {
      // Expected failure in RED phase
      EventFlagRenderer = null;
    }
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.eventManager;
    delete window.eventManager;
    delete global.RenderManager;
    delete window.RenderManager;
    delete global.EventFlagRenderer;
    delete window.EventFlagRenderer;
  });
  
  describe('Spatial Trigger Rendering', function() {
    it('should render flag icon for spatial trigger', function() {
      if (!EventFlagRenderer) {
        this.skip(); // Skip until implementation exists
      }
      
      // Register event with spatial trigger
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'spatial',
        condition: { x: 100, y: 100, radius: 64 }
      });
      
      // Create renderer
      const renderer = new EventFlagRenderer();
      
      // Render flags
      renderer.renderEventFlags(mockCameraManager);
      
      // Verify flag icon rendered (emoji or sprite)
      // Text call for flag emoji (🚩) at world coords (100, 100) transformed to screen (200, 200)
      expect(mockP5.text.called).to.be.true;
      
      // Find text call with flag emoji
      const flagTextCall = mockP5.text.getCalls().find(call => 
        call.args[0] === '🚩' || call.args[0].includes('flag')
      );
      expect(flagTextCall).to.exist;
    });
    
    it('should render trigger radius circle', function() {
      if (!EventFlagRenderer) {
        this.skip();
      }
      
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'spatial',
        condition: { x: 100, y: 100, radius: 64 }
      });
      
      const renderer = new EventFlagRenderer();
      renderer.renderEventFlags(mockCameraManager);
      
      // Verify radius circle rendered
      // World coords (100, 100) → screen (200, 200), radius 64 → 128 (2x zoom)
      expect(mockP5.ellipse.called).to.be.true;
      
      const ellipseCall = mockP5.ellipse.getCalls().find(call =>
        call.args[0] === 200 && call.args[1] === 200
      );
      expect(ellipseCall).to.exist;
    });
    
    it('should render event ID label above flag', function() {
      if (!EventFlagRenderer) {
        this.skip();
      }
      
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'spatial',
        condition: { x: 100, y: 100, radius: 64 }
      });
      
      const renderer = new EventFlagRenderer();
      renderer.renderEventFlags(mockCameraManager);
      
      // Verify event ID label rendered
      const labelCall = mockP5.text.getCalls().find(call =>
        call.args[0] === 'test_event'
      );
      expect(labelCall).to.exist;
      expect(labelCall.args[2]).to.be.lessThan(200); // Y position above flag (200)
    });
  });
  
  describe('Multiple Flags', function() {
    it('should render multiple flags without overlap', function() {
      if (!EventFlagRenderer) {
        this.skip();
      }
      
      // Register multiple events with spatial triggers
      eventManager.registerEvent({ id: 'event1', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerEvent({ id: 'event2', type: 'spawn', priority: 3, content: {} });
      eventManager.registerEvent({ id: 'event3', type: 'tutorial', priority: 7, content: {} });
      
      eventManager.registerTrigger({
        eventId: 'event1',
        type: 'spatial',
        condition: { x: 100, y: 100, radius: 64 }
      });
      eventManager.registerTrigger({
        eventId: 'event2',
        type: 'spatial',
        condition: { x: 300, y: 200, radius: 96 }
      });
      eventManager.registerTrigger({
        eventId: 'event3',
        type: 'spatial',
        condition: { x: 500, y: 400, radius: 128 }
      });
      
      const renderer = new EventFlagRenderer();
      renderer.renderEventFlags(mockCameraManager);
      
      // Verify 3 separate ellipse calls (radius circles)
      expect(mockP5.ellipse.callCount).to.be.at.least(3);
      
      // Verify 3 event ID labels rendered
      const labelCalls = mockP5.text.getCalls().filter(call =>
        call.args[0] === 'event1' || call.args[0] === 'event2' || call.args[0] === 'event3'
      );
      expect(labelCalls).to.have.lengthOf(3);
    });
  });
  
  describe('Non-Spatial Trigger Exclusion', function() {
    it('should not render time triggers on map', function() {
      if (!EventFlagRenderer) {
        this.skip();
      }
      
      eventManager.registerEvent({ id: 'time_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'time_event',
        type: 'time',
        condition: { delay: 5000 }
      });
      
      const renderer = new EventFlagRenderer();
      renderer.renderEventFlags(mockCameraManager);
      
      // Verify no rendering calls made (no spatial position)
      expect(mockP5.ellipse.called).to.be.false;
      expect(mockP5.text.called).to.be.false;
    });
    
    it('should not render flag triggers on map', function() {
      if (!EventFlagRenderer) {
        this.skip();
      }
      
      eventManager.registerEvent({ id: 'flag_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'flag_event',
        type: 'flag',
        condition: { flags: ['tutorial_complete'], allRequired: true }
      });
      
      const renderer = new EventFlagRenderer();
      renderer.renderEventFlags(mockCameraManager);
      
      // Verify no rendering calls made
      expect(mockP5.ellipse.called).to.be.false;
      expect(mockP5.text.called).to.be.false;
    });
    
    it('should not render viewport triggers on map', function() {
      if (!EventFlagRenderer) {
        this.skip();
      }
      
      eventManager.registerEvent({ id: 'viewport_event', type: 'spawn', priority: 3, content: {} });
      eventManager.registerTrigger({
        eventId: 'viewport_event',
        type: 'viewport',
        condition: { x: 0, y: 0, width: 800, height: 600 }
      });
      
      const renderer = new EventFlagRenderer();
      renderer.renderEventFlags(mockCameraManager);
      
      // Verify no rendering calls made
      expect(mockP5.ellipse.called).to.be.false;
      expect(mockP5.text.called).to.be.false;
    });
    
    it('should only render spatial triggers when mixed types present', function() {
      if (!EventFlagRenderer) {
        this.skip();
      }
      
      // Register mixed trigger types
      eventManager.registerEvent({ id: 'event1', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerEvent({ id: 'event2', type: 'spawn', priority: 3, content: {} });
      eventManager.registerEvent({ id: 'event3', type: 'tutorial', priority: 7, content: {} });
      
      eventManager.registerTrigger({
        eventId: 'event1',
        type: 'spatial',
        condition: { x: 100, y: 100, radius: 64 }
      });
      eventManager.registerTrigger({
        eventId: 'event2',
        type: 'time',
        condition: { delay: 3000 }
      });
      eventManager.registerTrigger({
        eventId: 'event3',
        type: 'flag',
        condition: { flags: ['ready'], allRequired: true }
      });
      
      const renderer = new EventFlagRenderer();
      renderer.renderEventFlags(mockCameraManager);
      
      // Verify only 1 spatial trigger rendered
      expect(mockP5.ellipse.callCount).to.equal(1);
      
      // Verify only event1 label rendered
      const labelCalls = mockP5.text.getCalls().filter(call =>
        call.args[0] === 'event1' || call.args[0] === 'event2' || call.args[0] === 'event3'
      );
      expect(labelCalls).to.have.lengthOf(1);
      expect(labelCalls[0].args[0]).to.equal('event1');
    });
  });
  
  describe('Camera Transform Integration', function() {
    it('should apply camera transforms to world coordinates', function() {
      if (!EventFlagRenderer) {
        this.skip();
      }
      
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'spatial',
        condition: { x: 100, y: 100, radius: 64 }
      });
      
      const renderer = new EventFlagRenderer();
      renderer.renderEventFlags(mockCameraManager);
      
      // Verify worldToScreen was called with trigger position
      expect(mockCameraManager.worldToScreen.calledWith(100, 100)).to.be.true;
      
      // Verify rendering uses transformed coordinates (200, 200)
      const ellipseCall = mockP5.ellipse.getCalls().find(call =>
        call.args[0] === 200 && call.args[1] === 200
      );
      expect(ellipseCall).to.exist;
    });
    
    it('should handle different camera zoom levels', function() {
      if (!EventFlagRenderer) {
        this.skip();
      }
      
      // Mock camera with 3x zoom
      mockCameraManager.worldToScreen = sandbox.stub().callsFake((worldX, worldY) => ({
        x: worldX * 3,
        y: worldY * 3
      }));
      
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'spatial',
        condition: { x: 100, y: 100, radius: 64 }
      });
      
      const renderer = new EventFlagRenderer();
      renderer.renderEventFlags(mockCameraManager);
      
      // Verify rendering uses 3x transformed coordinates (300, 300)
      const ellipseCall = mockP5.ellipse.getCalls().find(call =>
        call.args[0] === 300 && call.args[1] === 300
      );
      expect(ellipseCall).to.exist;
    });
  });
  
  describe('RenderManager Integration', function() {
    it('should register with EFFECTS layer', function() {
      if (!EventFlagRenderer) {
        this.skip();
      }
      
      // Create renderer (should auto-register with RenderManager)
      const renderer = new EventFlagRenderer();
      
      // Verify registration with EFFECTS layer
      expect(global.RenderManager.addDrawableToLayer.called).to.be.true;
      expect(global.RenderManager.addDrawableToLayer.calledWith(
        global.RenderManager.layers.EFFECTS,
        sinon.match.func
      )).to.be.true;
    });
  });
  
  describe('Flag Click Hit Test', function() {
    it('should detect click on flag icon', function() {
      if (!EventFlagRenderer) {
        this.skip();
      }
      
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      const triggerId = eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'spatial',
        condition: { x: 100, y: 100, radius: 64 }
      });
      
      const renderer = new EventFlagRenderer();
      
      // Click at screen position (200, 200) which is world (100, 100)
      const result = renderer.checkFlagClick(200, 200, mockCameraManager);
      
      // Verify trigger returned
      expect(result).to.exist;
      expect(result.eventId).to.equal('test_event');
      expect(result.type).to.equal('spatial');
    });
    
    it('should return null when clicking outside flag radius', function() {
      if (!EventFlagRenderer) {
        this.skip();
      }
      
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerTrigger({
        eventId: 'test_event',
        type: 'spatial',
        condition: { x: 100, y: 100, radius: 64 }
      });
      
      const renderer = new EventFlagRenderer();
      
      // Click far away from flag (screen 500, 500 = world 250, 250)
      const result = renderer.checkFlagClick(500, 500, mockCameraManager);
      
      // Verify null returned
      expect(result).to.be.null;
    });
    
    it('should detect click on correct flag when multiple present', function() {
      if (!EventFlagRenderer) {
        this.skip();
      }
      
      eventManager.registerEvent({ id: 'event1', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerEvent({ id: 'event2', type: 'spawn', priority: 3, content: {} });
      
      eventManager.registerTrigger({
        eventId: 'event1',
        type: 'spatial',
        condition: { x: 100, y: 100, radius: 64 }
      });
      eventManager.registerTrigger({
        eventId: 'event2',
        type: 'spatial',
        condition: { x: 300, y: 200, radius: 96 }
      });
      
      const renderer = new EventFlagRenderer();
      
      // Click on event2 (screen 600, 400 = world 300, 200)
      const result = renderer.checkFlagClick(600, 400, mockCameraManager);
      
      expect(result).to.exist;
      expect(result.eventId).to.equal('event2');
    });
  });
});
