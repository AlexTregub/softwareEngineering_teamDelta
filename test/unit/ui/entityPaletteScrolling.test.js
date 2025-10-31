/**
 * Unit Tests - EntityPalette Scrolling
 * Tests for scrolling functionality in Entity Palette panel
 * 
 * TDD Red Phase: All tests should fail initially
 * Reference: MaterialPalette scrolling implementation
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityPalette Scrolling', function() {
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
      clip: sandbox.stub(), // For canvas clipping
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

  describe('Scroll Properties', function() {
    it('should have scrollOffset property', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette).to.have.property('scrollOffset');
      expect(palette.scrollOffset).to.be.a('number');
      expect(palette.scrollOffset).to.equal(0); // Default
    });

    it('should have maxScrollOffset property', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette).to.have.property('maxScrollOffset');
      expect(palette.maxScrollOffset).to.be.a('number');
    });

    it('should have viewportHeight property', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette).to.have.property('viewportHeight');
      expect(palette.viewportHeight).to.be.a('number');
      expect(palette.viewportHeight).to.equal(320); // 4 entries * 80px per entry
    });

    it('should initialize scrollOffset to 0', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.scrollOffset).to.equal(0);
    });
  });

  describe('handleMouseWheel Method', function() {
    it('should have handleMouseWheel method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.handleMouseWheel).to.be.a('function');
    });

    it('should adjust scrollOffset on wheel down', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.scrollOffset = 0;
      palette.maxScrollOffset = 500;
      
      // Wheel down (delta > 0)
      palette.handleMouseWheel(10, 100, 100, 50, 50, 220);
      
      expect(palette.scrollOffset).to.be.greaterThan(0);
    });

    it('should adjust scrollOffset on wheel up', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.scrollOffset = 100;
      palette.maxScrollOffset = 500;
      
      // Wheel up (delta < 0)
      palette.handleMouseWheel(-10, 100, 100, 50, 50, 220);
      
      expect(palette.scrollOffset).to.be.lessThan(100);
    });

    it('should clamp scrollOffset to [0, maxScrollOffset]', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.scrollOffset = 0;
      palette.maxScrollOffset = 100;
      
      // Try to scroll up past 0
      palette.handleMouseWheel(-50, 100, 100, 50, 50, 220);
      expect(palette.scrollOffset).to.equal(0);
      
      // Try to scroll down past max
      palette.scrollOffset = 100;
      palette.handleMouseWheel(50, 100, 100, 50, 50, 220);
      expect(palette.scrollOffset).to.equal(100);
    });

    it('should only scroll when mouse is over panel', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.scrollOffset = 50;
      palette.containsPoint = sandbox.stub().returns(false); // Not over panel
      
      // Wheel event outside panel
      palette.handleMouseWheel(10, 500, 500, 50, 50, 220);
      
      // ScrollOffset should not change
      expect(palette.scrollOffset).to.equal(50);
    });

    it('should return true when scroll was handled', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.scrollOffset = 50;
      palette.maxScrollOffset = 500;
      palette.containsPoint = sandbox.stub().returns(true);
      
      const result = palette.handleMouseWheel(10, 100, 100, 50, 50, 220);
      
      expect(result).to.be.true;
    });

    it('should return false when scroll was not handled', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.containsPoint = sandbox.stub().returns(false);
      
      const result = palette.handleMouseWheel(10, 500, 500, 50, 50, 220);
      
      expect(result).to.be.false;
    });
  });

  describe('updateScrollBounds Method', function() {
    it('should have updateScrollBounds method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.updateScrollBounds).to.be.a('function');
    });

    it('should calculate maxScrollOffset based on content height', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('entities'); // Has multiple templates
      palette.viewportHeight = 320; // 4 entries visible
      
      palette.updateScrollBounds();
      
      // maxScrollOffset = max(0, totalContentHeight - viewportHeight)
      expect(palette.maxScrollOffset).to.be.a('number');
      expect(palette.maxScrollOffset).to.be.at.least(0);
    });

    it('should set maxScrollOffset to 0 when content fits in viewport', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('custom'); // Empty, no templates
      palette.viewportHeight = 320;
      
      palette.updateScrollBounds();
      
      expect(palette.maxScrollOffset).to.equal(0);
    });

    it('should clamp scrollOffset after updating bounds', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.scrollOffset = 500; // Large scroll
      palette.setCategory('custom'); // Switch to category with little content
      
      palette.updateScrollBounds(); // Should clamp scrollOffset
      
      expect(palette.scrollOffset).to.be.at.most(palette.maxScrollOffset);
    });
  });

  describe('Render with Scrolling', function() {
    it('should apply canvas clipping in render', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('entities');
      palette.render(50, 50, 220);
      
      // Should call clip() to constrain rendering
      expect(global.clip.called).to.be.true;
    });

    it('should translate by -scrollOffset when rendering', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('entities');
      palette.scrollOffset = 100;
      
      palette.render(50, 50, 220);
      
      // Should translate by negative scrollOffset
      // translate() should be called with (0, -scrollOffset)
      const translateCalls = global.translate.getCalls();
      const hasScrollTranslate = translateCalls.some(call => 
        call.args[0] === 0 && call.args[1] === -100
      );
      
      expect(hasScrollTranslate).to.be.true;
    });

    it('should limit visible height to viewportHeight', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('entities');
      palette.viewportHeight = 320;
      
      palette.render(50, 50, 220);
      
      // Clipping rect should have height = viewportHeight
      expect(global.clip.called).to.be.true;
      const clipCall = global.clip.getCalls()[0];
      
      // clip(x, y, width, viewportHeight)
      expect(clipCall.args[3]).to.equal(320);
    });
  });

  describe('Scroll and Click Interaction', function() {
    it('should adjust click Y coordinate by scrollOffset', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('entities');
      palette.scrollOffset = 100;
      
      // Click at visual Y=150 with scrollOffset=100 means logical Y=250
      const result = palette.handleClick(50, 150, 0, 0, 220);
      
      // Should detect item at logical Y=250, not visual Y=150
      expect(result).to.exist;
    });

    it('should call updateScrollBounds after category change', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      sandbox.spy(palette, 'updateScrollBounds');
      
      palette.setCategory('buildings');
      
      expect(palette.updateScrollBounds.calledOnce).to.be.true;
    });
  });
});
