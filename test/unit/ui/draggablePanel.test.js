/**
 * Unit Tests for DraggablePanel
 * Tests panel auto-resize behavior and state management
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('DraggablePanel', () => {
  let DraggablePanel;
  let Button;
  let ButtonStyles;
  let panel;
  let saveStateStub;
  let localStorageGetItemStub;
  let localStorageSetItemStub;

  before(() => {
    // Mock p5.js functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.textSize = sinon.stub();
    global.textAlign = sinon.stub();
    global.text = sinon.stub();
    global.textWidth = sinon.stub().returns(50);
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';

    // Mock devConsoleEnabled
    global.devConsoleEnabled = false;

    // Mock window
    global.window = {
      innerWidth: 1920,
      innerHeight: 1080
    };

    // Mock localStorage
    localStorageGetItemStub = sinon.stub();
    localStorageSetItemStub = sinon.stub();
    global.localStorage = {
      getItem: localStorageGetItemStub,
      setItem: localStorageSetItemStub
    };

    // Mock Button class
    Button = class {
      constructor(x, y, width, height, caption, style) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.caption = caption;
        this.style = style;
      }
      setPosition(x, y) {
        this.x = x;
        this.y = y;
      }
      update() { return false; }
      render() {}
      autoResize() {}
    };
    global.Button = Button;

    // Mock ButtonStyles
    ButtonStyles = {
      DEFAULT: {
        backgroundColor: '#cccccc',
        color: '#000000'
      }
    };
    global.ButtonStyles = ButtonStyles;

    // Load DraggablePanel
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
  });

  beforeEach(() => {
    // Reset stubs
    localStorageGetItemStub.reset();
    localStorageSetItemStub.reset();
    localStorageGetItemStub.returns(null); // No saved state by default

    // Create a test panel with buttons
    panel = new DraggablePanel({
      id: 'test-panel',
      title: 'Test Panel',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      buttons: {
        layout: 'vertical',
        items: [
          { caption: 'Button 1', onClick: () => {} },
          { caption: 'Button 2', onClick: () => {} },
          { caption: 'Button 3', onClick: () => {} }
        ]
      }
    });

    // Stub saveState method for testing
    saveStateStub = sinon.stub(panel, 'saveState');
  });

  afterEach(() => {
    saveStateStub.restore();
  });

  describe('Auto-resize behavior', () => {
    it('should NOT call saveState() when auto-resizing content', () => {
      // Record initial height
      const initialHeight = panel.config.size.height;

      // Call autoResizeToFitContent
      panel.autoResizeToFitContent();

      // saveState should NOT be called
      expect(saveStateStub.called).to.be.false;
    });

    it('should update panel height without saving to localStorage', () => {
      // Force a resize scenario by modifying button heights
      panel.buttons.forEach(btn => {
        btn.height = 50; // Make buttons taller
      });

      // Call autoResizeToFitContent
      panel.autoResizeToFitContent();

      // Panel height should be updated
      expect(panel.config.size.height).to.be.greaterThan(150);

      // But saveState should NOT be called
      expect(saveStateStub.called).to.be.false;

      // localStorage should NOT be written to
      expect(localStorageSetItemStub.called).to.be.false;
    });

    it('should only save state when manually dragging (not auto-resize)', () => {
      // Restore the real saveState method temporarily
      saveStateStub.restore();
      
      // Spy on localStorage.setItem instead
      const setItemSpy = sinon.spy(global.localStorage, 'setItem');

      // Simulate manual drag (this SHOULD save state)
      panel.isDragging = true;
      panel.dragOffset = { x: 10, y: 10 };
      
      // Simulate drag movement
      panel.handleDragging(150, 150, true); // mouse pressed
      panel.handleDragging(150, 150, false); // mouse released (triggers saveState)

      // saveState should be called during drag release
      expect(setItemSpy.calledOnce).to.be.true;
      expect(setItemSpy.firstCall.args[0]).to.equal('draggable-panel-test-panel');

      setItemSpy.restore();
      
      // Re-stub saveState for cleanup
      saveStateStub = sinon.stub(panel, 'saveState');
    });

    it('should calculate content height correctly for vertical layout', () => {
      panel.buttons[0].height = 30;
      panel.buttons[1].height = 40;
      panel.buttons[2].height = 35;

      const contentHeight = panel.calculateContentHeight();

      // Should be: padding(10) + button1(30) + spacing(5) + button2(40) + spacing(5) + button3(35) + padding(10)
      // = 10 + 30 + 5 + 40 + 5 + 35 + 10 = 135
      expect(contentHeight).to.equal(135);
    });

    it('should update button positions after auto-resize', () => {
      const updatePositionsSpy = sinon.spy(panel, 'updateButtonPositions');

      panel.autoResizeToFitContent();

      expect(updatePositionsSpy.called).to.be.true;

      updatePositionsSpy.restore();
    });
  });

  describe('Panel growing prevention (bug fix)', () => {
    it('should maintain stable height across multiple update cycles', () => {
      const initialHeight = panel.config.size.height;

      // Simulate multiple update cycles (as would happen in the game loop)
      for (let i = 0; i < 100; i++) {
        panel.autoResizeToFitContent();
      }

      // Height should remain stable (within floating point tolerance)
      expect(Math.abs(panel.config.size.height - initialHeight)).to.be.lessThan(1);

      // saveState should NEVER be called
      expect(saveStateStub.called).to.be.false;
    });

    it('should not accumulate height from rounding errors', () => {
      const initialHeight = panel.config.size.height;

      // Simulate 1000 frames worth of updates (realistic for ~16 seconds at 60fps)
      for (let i = 0; i < 1000; i++) {
        panel.update(50, 50, false); // update includes autoResizeToFitContent
      }

      // Height should not have grown significantly
      const growth = panel.config.size.height - initialHeight;
      expect(growth).to.be.lessThan(5); // Less than the resize threshold

      // saveState should not be called from auto-resize
      expect(saveStateStub.called).to.be.false;
    });
  });

  describe('State persistence', () => {
    it('should load persisted position from localStorage on creation', () => {
      localStorageGetItemStub.returns(JSON.stringify({
        position: { x: 500, y: 300 },
        visible: true,
        minimized: false
      }));

      const newPanel = new DraggablePanel({
        id: 'persisted-panel',
        title: 'Persisted Panel',
        position: { x: 100, y: 100 }, // This will be overridden
        size: { width: 200, height: 150 }
      });

      expect(newPanel.state.position.x).to.equal(500);
      expect(newPanel.state.position.y).to.equal(300);
    });

    it('should save position when dragging ends', () => {
      saveStateStub.restore(); // Use real saveState

      const setItemSpy = sinon.spy(global.localStorage, 'setItem');

      // Start drag
      panel.isDragging = true;
      panel.dragOffset = { x: 10, y: 10 };
      panel.handleDragging(200, 200, true);

      // End drag (release mouse)
      panel.handleDragging(200, 200, false);

      // Should have saved state
      expect(setItemSpy.calledOnce).to.be.true;
      const savedData = JSON.parse(setItemSpy.firstCall.args[1]);
      expect(savedData.position).to.deep.equal({ x: 190, y: 190 });

      setItemSpy.restore();
      saveStateStub = sinon.stub(panel, 'saveState');
    });

    it('should NOT save size changes from auto-resize', () => {
      saveStateStub.restore(); // Use real saveState

      const setItemSpy = sinon.spy(global.localStorage, 'setItem');

      // Trigger auto-resize
      panel.buttons.forEach(btn => btn.height = 60);
      panel.autoResizeToFitContent();

      // Should NOT have saved
      expect(setItemSpy.called).to.be.false;

      setItemSpy.restore();
      saveStateStub = sinon.stub(panel, 'saveState');
    });
  });

  describe('Resize threshold', () => {
    it('should only resize when height difference exceeds threshold (5px)', () => {
      const initialHeight = panel.config.size.height;
      const initialButtonHeight = panel.buttons[0].height;

      // Make a small change (less than threshold)
      panel.buttons[0].height = initialButtonHeight + 1;
      panel.autoResizeToFitContent();

      // Panel height should not change (difference too small)
      expect(panel.config.size.height).to.equal(initialHeight);

      // Make a larger change (exceeds threshold)
      panel.buttons[0].height = initialButtonHeight + 20;
      panel.autoResizeToFitContent();

      // Panel height SHOULD change now
      expect(panel.config.size.height).to.be.greaterThan(initialHeight);
    });
  });
});
