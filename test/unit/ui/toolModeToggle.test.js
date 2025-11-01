/**
 * Unit Tests for Tool Mode Toggle UI
 * 
 * Tests the radio-button style mode selector in menu bar
 * TDD Red Phase - Write failing tests FIRST
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('ToolModeToggle', function() {
  let ToolModeToggle;
  let modeToggle;
  let mockP5;
  let mockCallbacks;

  beforeEach(function() {
    // Mock p5.js functions
    mockP5 = {
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      noFill: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      rectMode: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      text: sinon.stub(),
      mouseX: 0,
      mouseY: 0,
      CORNERS: 0,
      CENTER: 1,
      LEFT: 2,
      RIGHT: 3
    };

    // Sync to global and window
    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
      if (typeof window !== 'undefined') window[key] = mockP5[key];
    });

    // Mock callbacks
    mockCallbacks = {
      onModeChange: sinon.stub()
    };

    // Load ToolModeToggle class
    try {
      ToolModeToggle = require('../../../Classes/ui/ToolModeToggle');
    } catch (e) {
      // Expected to fail in TDD Red phase
      ToolModeToggle = null;
    }

    if (ToolModeToggle) {
      const modes = ['ALL', 'TERRAIN', 'ENTITY', 'EVENTS'];
      modeToggle = new ToolModeToggle(200, 35, modes, mockCallbacks.onModeChange);
    }
  });

  afterEach(function() {
    sinon.restore();
    Object.keys(mockP5).forEach(key => {
      delete global[key];
      if (typeof window !== 'undefined') delete window[key];
    });
  });

  describe('Constructor', function() {
    it('should initialize with default mode (first in array)', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      expect(modeToggle.currentMode).to.equal('ALL');
    });

    it('should store mode options array', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      expect(modeToggle.modes).to.deep.equal(['ALL', 'TERRAIN', 'ENTITY', 'EVENTS']);
    });

    it('should store position parameters', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      expect(modeToggle.x).to.equal(200);
      expect(modeToggle.y).to.equal(35);
    });

    it('should store callback function', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      expect(modeToggle.onModeChange).to.equal(mockCallbacks.onModeChange);
    });

    it('should calculate button dimensions from constants', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      expect(modeToggle.buttonWidth).to.equal(80);
      expect(modeToggle.buttonHeight).to.equal(28);
      expect(modeToggle.buttonSpacing).to.equal(8);
    });
  });

  describe('Set Mode', function() {
    it('should change current mode', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      modeToggle.setMode('TERRAIN');
      expect(modeToggle.currentMode).to.equal('TERRAIN');

      modeToggle.setMode('ENTITY');
      expect(modeToggle.currentMode).to.equal('ENTITY');
    });

    it('should trigger callback when mode changes', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      modeToggle.setMode('EVENTS');

      expect(mockCallbacks.onModeChange.calledOnce).to.be.true;
      expect(mockCallbacks.onModeChange.calledWith('EVENTS')).to.be.true;
    });

    it('should reject invalid mode', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      expect(() => modeToggle.setMode('INVALID')).to.throw();
    });

    it('should not trigger callback if mode unchanged', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      modeToggle.setMode('ALL'); // Already default mode
      expect(mockCallbacks.onModeChange.called).to.be.false;
    });
  });

  describe('Get Current Mode', function() {
    it('should return current mode string', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      expect(modeToggle.getCurrentMode()).to.equal('ALL');

      modeToggle.setMode('TERRAIN');
      expect(modeToggle.getCurrentMode()).to.equal('TERRAIN');
    });
  });

  describe('Hit Test - Click Detection', function() {
    it('should detect click on ALL button', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      // ALL button at x=200, y=35, width=80, height=28
      const clickX = 240; // Center of button
      const clickY = 49;  // Center of button

      const hit = modeToggle.hitTest(clickX, clickY);

      expect(hit).to.be.true;
    });

    it('should detect click on TERRAIN button (second button)', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      // TERRAIN button at x=288 (200 + 80 + 8)
      const clickX = 328; // Center of button
      const clickY = 49;

      const hit = modeToggle.hitTest(clickX, clickY);

      expect(hit).to.be.true;
    });

    it('should return false for click outside buttons', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      const hit = modeToggle.hitTest(100, 100); // Far outside
      expect(hit).to.be.false;
    });

    it('should return false for click in gap between buttons', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      // Gap between ALL and TERRAIN (x=280 to x=288)
      const clickX = 284;
      const clickY = 49;

      const hit = modeToggle.hitTest(clickX, clickY);

      expect(hit).to.be.false;
    });
  });

  describe('Handle Click - Mode Selection', function() {
    it('should change mode when clicking button', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      // Click TERRAIN button
      const clickX = 328;
      const clickY = 49;

      modeToggle.handleClick(clickX, clickY);

      expect(modeToggle.currentMode).to.equal('TERRAIN');
    });

    it('should trigger callback on successful click', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      const clickX = 328; // TERRAIN button
      const clickY = 49;

      modeToggle.handleClick(clickX, clickY);

      expect(mockCallbacks.onModeChange.calledOnce).to.be.true;
      expect(mockCallbacks.onModeChange.calledWith('TERRAIN')).to.be.true;
    });

    it('should not change mode when clicking outside', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      const originalMode = modeToggle.currentMode;
      modeToggle.handleClick(100, 100); // Outside

      expect(modeToggle.currentMode).to.equal(originalMode);
      expect(mockCallbacks.onModeChange.called).to.be.false;
    });

    it('should not change mode when clicking currently active button', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      // Click ALL button (already active)
      const clickX = 240;
      const clickY = 49;

      modeToggle.handleClick(clickX, clickY);

      expect(mockCallbacks.onModeChange.called).to.be.false;
    });
  });

  describe('Rendering', function() {
    it('should have a render method', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      expect(modeToggle.render).to.be.a('function');
    });

    it('should render all mode buttons', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      modeToggle.render();

      // Should draw 4 rectangles (one per mode)
      expect(mockP5.rect.callCount).to.equal(4);
    });

    it('should render text labels for each mode', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      modeToggle.render();

      // Should draw 4 text labels
      expect(mockP5.text.callCount).to.equal(4);
      expect(mockP5.text.calledWith('ALL')).to.be.true;
      expect(mockP5.text.calledWith('TERRAIN')).to.be.true;
      expect(mockP5.text.calledWith('ENTITY')).to.be.true;
      expect(mockP5.text.calledWith('EVENTS')).to.be.true;
    });

    it('should use different style for active mode', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      modeToggle.setMode('TERRAIN');
      mockP5.fill.resetHistory();

      modeToggle.render();

      // Should have different fill for active button (blue)
      // Active: rgb(100, 150, 255), Inactive: rgb(200, 200, 200)
      const fillCalls = mockP5.fill.getCalls();
      const blueFill = fillCalls.find(call => 
        call.args[0] === 100 && call.args[1] === 150 && call.args[2] === 255
      );
      expect(blueFill).to.exist;
    });

    it('should highlight button on hover', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      // Simulate hover over TERRAIN button
      global.mouseX = 328;
      global.mouseY = 49;
      if (typeof window !== 'undefined') {
        window.mouseX = 328;
        window.mouseY = 49;
      }

      modeToggle.render();

      // Should apply hover highlight (lighter fill)
      const fillCalls = mockP5.fill.getCalls();
      const hoverFill = fillCalls.find(call => 
        call.args[0] === 220 && call.args[1] === 220 && call.args[2] === 220
      );
      expect(hoverFill).to.exist;
    });
  });

  describe('Get Button Bounds', function() {
    it('should return bounds for each mode button', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      const allBounds = modeToggle.getButtonBounds('ALL');
      expect(allBounds).to.deep.equal({
        x: 200,
        y: 35,
        width: 80,
        height: 28
      });

      const terrainBounds = modeToggle.getButtonBounds('TERRAIN');
      expect(terrainBounds).to.deep.equal({
        x: 288, // 200 + 80 + 8
        y: 35,
        width: 80,
        height: 28
      });
    });

    it('should return null for invalid mode', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      const bounds = modeToggle.getButtonBounds('INVALID');
      expect(bounds).to.be.null;
    });
  });

  describe('Edge Cases', function() {
    it('should handle single mode array', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      const singleMode = new ToolModeToggle(200, 35, ['ONLY'], mockCallbacks.onModeChange);
      expect(singleMode.currentMode).to.equal('ONLY');
      expect(singleMode.modes.length).to.equal(1);
    });

    it('should handle empty callback (optional)', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      const noCallback = new ToolModeToggle(200, 35, ['ALL', 'TERRAIN']);
      expect(() => noCallback.setMode('TERRAIN')).to.not.throw();
    });

    it('should handle clicks at exact button boundaries', function() {
      if (!ToolModeToggle) {
        this.skip();
      }

      // Click at left edge of ALL button
      const leftEdge = modeToggle.hitTest(200, 49);
      expect(leftEdge).to.be.true;

      // Click at right edge of ALL button
      const rightEdge = modeToggle.hitTest(280, 49);
      expect(rightEdge).to.be.true;
    });
  });
});
