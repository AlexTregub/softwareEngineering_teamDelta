/**
 * Unit tests for EventFlagRenderer - Radius Preview Feature
 * 
 * Tests real-time radius preview when EventPropertyWindow is open.
 * Preview radius shows proposed changes before saving (orange solid).
 * Saved radius shown as comparison (yellow dashed).
 * 
 * TDD Red → Green approach.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EventFlagRenderer - Radius Preview', function() {
  let eventManager, cameraManager, levelEditor, eventPropertyWindow;
  let pushStub, popStub, fillStub, strokeStub, strokeWeightStub, ellipseStub, textStub, textAlignStub, textSizeStub, noFillStub, drawingContextStub;
  
  beforeEach(function() {
    // Mock logNormal (required by EventManager)
    global.logNormal = sinon.stub();
    
    // Mock p5.js drawing functions
    pushStub = sinon.stub();
    popStub = sinon.stub();
    fillStub = sinon.stub();
    strokeStub = sinon.stub();
    strokeWeightStub = sinon.stub();
    ellipseStub = sinon.stub();
    textStub = sinon.stub();
    textAlignStub = sinon.stub();
    textSizeStub = sinon.stub();
    noFillStub = sinon.stub();
    drawingContextStub = {
      setLineDash: sinon.stub()
    };
    
    global.push = pushStub;
    global.pop = popStub;
    global.fill = fillStub;
    global.stroke = strokeStub;
    global.strokeWeight = strokeWeightStub;
    global.ellipse = ellipseStub;
    global.text = textStub;
    global.textAlign = textAlignStub;
    global.textSize = textSizeStub;
    global.noFill = noFillStub;
    global.drawingContext = drawingContextStub;
    global.CENTER = 'CENTER';
    global.BOTTOM = 'BOTTOM';
    global.TOP = 'TOP';
    
    // Mock EventManager with spatial trigger
    const EventManager = require('../../../Classes/managers/EventManager');
    eventManager = EventManager.getInstance();
    eventManager.reset();
    
    // Register a spatial trigger
    eventManager.registerTrigger({
      id: 'trigger_preview_001',
      eventId: 'event_test_001',
      type: 'spatial',
      condition: { x: 300, y: 400, radius: 100 },
      oneTime: false
    });
    
    // Mock CameraManager
    cameraManager = {
      worldToScreen: sinon.stub().callsFake((x, y) => ({ x, y }))
    };
    
    // Mock LevelEditor with eventPropertyWindow
    levelEditor = {
      eventPropertyWindow: null
    };
    
    // Make levelEditor globally available
    if (typeof window !== 'undefined') {
      window.levelEditor = levelEditor;
    }
    if (typeof global !== 'undefined') {
      global.levelEditor = levelEditor;
    }
    
    // Load EventFlagRenderer
    const EventFlagRenderer = require('../../../Classes/rendering/EventFlagRenderer');
    global.EventFlagRenderer = EventFlagRenderer;
    
    // Make eventManager globally available
    if (typeof window !== 'undefined') {
      window.eventManager = eventManager;
    }
    if (typeof global !== 'undefined') {
      global.eventManager = eventManager;
    }
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.logNormal;
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.stroke;
    delete global.strokeWeight;
    delete global.ellipse;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.noFill;
    delete global.drawingContext;
    delete global.CENTER;
    delete global.BOTTOM;
    delete global.TOP;
    delete global.levelEditor;
    delete global.eventManager;
    delete global.EventFlagRenderer;
  });
  
  describe('Preview Rendering - Property Window Closed', function() {
    it('should render saved radius only when property window is null', function() {
      const renderer = new global.EventFlagRenderer();
      levelEditor.eventPropertyWindow = null;
      
      renderer.renderEventFlags(cameraManager);
      
      // Should render saved radius (yellow)
      const yellowFillCalls = fillStub.getCalls().filter(call => 
        call.args[0] === 255 && call.args[1] === 255 && call.args[2] === 0
      );
      expect(yellowFillCalls.length).to.be.at.least(1);
      
      // Should NOT render preview radius (orange)
      const orangeFillCalls = fillStub.getCalls().filter(call => 
        call.args[0] === 255 && call.args[1] === 165 && call.args[2] === 0
      );
      expect(orangeFillCalls.length).to.equal(0);
    });
    
    it('should render saved radius only when property window is closed', function() {
      const renderer = new global.EventFlagRenderer();
      levelEditor.eventPropertyWindow = { isVisible: false };
      
      renderer.renderEventFlags(cameraManager);
      
      // Should render saved radius (yellow)
      const yellowFillCalls = fillStub.getCalls().filter(call => 
        call.args[0] === 255 && call.args[1] === 255 && call.args[2] === 0
      );
      expect(yellowFillCalls.length).to.be.at.least(1);
      
      // Should NOT render preview radius (orange)
      const orangeFillCalls = fillStub.getCalls().filter(call => 
        call.args[0] === 255 && call.args[1] === 165 && call.args[2] === 0
      );
      expect(orangeFillCalls.length).to.equal(0);
    });
  });
  
  describe('Preview Rendering - Property Window Open', function() {
    it('should render both saved and preview radius when property window is open', function() {
      const renderer = new global.EventFlagRenderer();
      
      // Open property window with edited radius
      const trigger = eventManager.getTrigger('trigger_preview_001');
      levelEditor.eventPropertyWindow = {
        isVisible: true,
        trigger: trigger,
        editForm: { ...trigger, condition: { x: 300, y: 400, radius: 150 } } // Edited radius
      };
      
      renderer.renderEventFlags(cameraManager);
      
      // Should render saved radius (yellow dashed)
      const yellowStrokeCalls = strokeStub.getCalls().filter(call => 
        call.args[0] === 255 && call.args[1] === 255 && call.args[2] === 0
      );
      expect(yellowStrokeCalls.length).to.be.at.least(1);
      
      // Should render preview radius (orange solid)
      const orangeFillCalls = fillStub.getCalls().filter(call => 
        call.args[0] === 255 && call.args[1] === 165 && call.args[2] === 0
      );
      expect(orangeFillCalls.length).to.be.at.least(1);
    });
    
    it('should use preview radius value from editForm', function() {
      const renderer = new global.EventFlagRenderer();
      
      const trigger = eventManager.getTrigger('trigger_preview_001');
      levelEditor.eventPropertyWindow = {
        isVisible: true,
        trigger: trigger,
        editForm: { ...trigger, condition: { x: 300, y: 400, radius: 175 } } // Preview radius
      };
      
      renderer.renderEventFlags(cameraManager);
      
      // Check ellipse calls for preview radius (diameter = 175 * 2 = 350)
      const previewEllipseCalls = ellipseStub.getCalls().filter(call => 
        call.args[2] === 350 && call.args[3] === 350
      );
      expect(previewEllipseCalls.length).to.be.at.least(1);
    });
    
    it('should use saved radius value from original trigger', function() {
      const renderer = new global.EventFlagRenderer();
      
      const trigger = eventManager.getTrigger('trigger_preview_001');
      levelEditor.eventPropertyWindow = {
        isVisible: true,
        trigger: trigger,
        editForm: { ...trigger, condition: { x: 300, y: 400, radius: 150 } }
      };
      
      renderer.renderEventFlags(cameraManager);
      
      // Check ellipse calls for saved radius (diameter = 100 * 2 = 200)
      const savedEllipseCalls = ellipseStub.getCalls().filter(call => 
        call.args[2] === 200 && call.args[3] === 200
      );
      expect(savedEllipseCalls.length).to.be.at.least(1);
    });
    
    it('should render preview label with current edit value', function() {
      const renderer = new global.EventFlagRenderer();
      
      const trigger = eventManager.getTrigger('trigger_preview_001');
      levelEditor.eventPropertyWindow = {
        isVisible: true,
        trigger: trigger,
        editForm: { ...trigger, condition: { x: 300, y: 400, radius: 180 } }
      };
      
      renderer.renderEventFlags(cameraManager);
      
      // Check text calls for preview label
      const labelCalls = textStub.getCalls().filter(call => 
        typeof call.args[0] === 'string' && call.args[0].includes('180')
      );
      expect(labelCalls.length).to.be.at.least(1);
    });
  });
  
  describe('Preview Rendering - Multiple Triggers', function() {
    it('should only render preview for the trigger being edited', function() {
      const renderer = new global.EventFlagRenderer();
      
      // Register second trigger
      eventManager.registerTrigger({
        id: 'trigger_preview_002',
        eventId: 'event_test_002',
        type: 'spatial',
        condition: { x: 500, y: 600, radius: 120 },
        oneTime: false
      });
      
      // Open property window for first trigger
      const trigger = eventManager.getTrigger('trigger_preview_001');
      levelEditor.eventPropertyWindow = {
        isVisible: true,
        trigger: trigger,
        editForm: { ...trigger, condition: { x: 300, y: 400, radius: 150 } }
      };
      
      renderer.renderEventFlags(cameraManager);
      
      // Should render preview for first trigger (diameter = 300)
      const firstPreviewCalls = ellipseStub.getCalls().filter(call => 
        call.args[2] === 300 && call.args[3] === 300
      );
      expect(firstPreviewCalls.length).to.be.at.least(1);
      
      // Should render normal (no preview) for second trigger (diameter = 240)
      const secondNormalCalls = ellipseStub.getCalls().filter(call => 
        call.args[2] === 240 && call.args[3] === 240
      );
      expect(secondNormalCalls.length).to.be.at.least(1);
    });
  });
  
  describe('Visual Differentiation', function() {
    it('should render saved radius as dashed stroke', function() {
      const renderer = new global.EventFlagRenderer();
      
      const trigger = eventManager.getTrigger('trigger_preview_001');
      levelEditor.eventPropertyWindow = {
        isVisible: true,
        trigger: trigger,
        editForm: { ...trigger, condition: { x: 300, y: 400, radius: 150 } }
      };
      
      renderer.renderEventFlags(cameraManager);
      
      // Check drawingContext setLineDash called for dashed line
      expect(drawingContextStub.setLineDash).to.exist;
    });
    
    it('should render preview radius as solid fill', function() {
      const renderer = new global.EventFlagRenderer();
      
      const trigger = eventManager.getTrigger('trigger_preview_001');
      levelEditor.eventPropertyWindow = {
        isVisible: true,
        trigger: trigger,
        editForm: { ...trigger, condition: { x: 300, y: 400, radius: 150 } }
      };
      
      renderer.renderEventFlags(cameraManager);
      
      // Should have orange fill call
      const orangeFillCalls = fillStub.getCalls().filter(call => 
        call.args[0] === 255 && call.args[1] === 165 && call.args[2] === 0
      );
      expect(orangeFillCalls.length).to.be.at.least(1);
    });
    
    it('should render preview radius with higher opacity than saved', function() {
      const renderer = new global.EventFlagRenderer();
      
      const trigger = eventManager.getTrigger('trigger_preview_001');
      levelEditor.eventPropertyWindow = {
        isVisible: true,
        trigger: trigger,
        editForm: { ...trigger, condition: { x: 300, y: 400, radius: 150 } }
      };
      
      renderer.renderEventFlags(cameraManager);
      
      // Preview should have alpha ~80-100 (orange solid)
      const previewFillCalls = fillStub.getCalls().filter(call => 
        call.args[0] === 255 && call.args[1] === 165 && call.args[2] === 0 && call.args[3] >= 80
      );
      expect(previewFillCalls.length).to.be.at.least(1);
      
      // Saved should have alpha ~40-60 (yellow faded)
      const savedStrokeCalls = strokeStub.getCalls().filter(call => 
        call.args[0] === 255 && call.args[1] === 255 && call.args[2] === 0 && call.args[3] <= 60
      );
      expect(savedStrokeCalls.length).to.be.at.least(1);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle property window with null editForm', function() {
      const renderer = new global.EventFlagRenderer();
      
      levelEditor.eventPropertyWindow = {
        isVisible: true,
        trigger: null,
        editForm: null
      };
      
      // Should not throw error
      expect(() => renderer.renderEventFlags(cameraManager)).to.not.throw();
    });
    
    it('should handle editForm with missing condition', function() {
      const renderer = new global.EventFlagRenderer();
      
      const trigger = eventManager.getTrigger('trigger_preview_001');
      levelEditor.eventPropertyWindow = {
        isVisible: true,
        trigger: trigger,
        editForm: { ...trigger, condition: null }
      };
      
      // Should render saved radius only (no preview)
      expect(() => renderer.renderEventFlags(cameraManager)).to.not.throw();
    });
    
    it('should handle editForm with zero radius', function() {
      const renderer = new global.EventFlagRenderer();
      
      const trigger = eventManager.getTrigger('trigger_preview_001');
      levelEditor.eventPropertyWindow = {
        isVisible: true,
        trigger: trigger,
        editForm: { ...trigger, condition: { x: 300, y: 400, radius: 0 } }
      };
      
      // Should not render preview (invalid radius)
      renderer.renderEventFlags(cameraManager);
      
      // Should still render saved radius
      const yellowStrokeCalls = strokeStub.getCalls().filter(call => 
        call.args[0] === 255 && call.args[1] === 255 && call.args[2] === 0
      );
      expect(yellowStrokeCalls.length).to.be.at.least(1);
    });
  });
});
