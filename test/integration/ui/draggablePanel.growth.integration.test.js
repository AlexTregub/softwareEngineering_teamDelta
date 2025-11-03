/**
 * Integration Tests for DraggablePanel Growth Prevention
 * Tests that panels do NOT grow over time due to auto-resize feedback loop
 */

const { expect } = require('chai');

describe('DraggablePanel Growth Prevention (Integration)', () => {
  let DraggablePanel;
  let Button;
  let ButtonStyles;
  let panel;
  let localStorageData = {};

  before(() => {
    // Mock p5.js functions (simple stubs, no sinon needed)
    global.push = () => {};
    global.pop = () => {};
    global.fill = () => {};
    global.stroke = () => {};
    global.strokeWeight = () => {};
    global.noStroke = () => {};
    global.rect = () => {};
    global.textSize = () => {};
    global.textAlign = () => {};
    global.text = () => {};
    global.textWidth = () => 50;
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

    // Mock localStorage with simple in-memory storage
    global.localStorage = {
      getItem: (key) => localStorageData[key] || null,
      setItem: (key, value) => { localStorageData[key] = value; }
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
    // Clear localStorage
    localStorageData = {};
  });

  describe('Long-running panel stability', () => {
    it('should NOT grow over 5000 update cycles (realistic game session)', () => {
      // Create panel with typical configuration
      panel = new DraggablePanel({
        id: 'stability-test-panel',
        title: 'Stability Test',
        position: { x: 100, y: 100 },
        size: { width: 250, height: 180 },
        buttons: {
          layout: 'vertical',
          items: [
            { caption: 'Action 1', onClick: () => {} },
            { caption: 'Action 2', onClick: () => {} },
            { caption: 'Action 3', onClick: () => {} },
            { caption: 'Action 4', onClick: () => {} }
          ]
        }
      });

      const initialHeight = panel.config.size.height;
      const heightHistory = [initialHeight];

      // Simulate 5000 update cycles (~83 seconds at 60fps)
      for (let i = 0; i < 5000; i++) {
        panel.update(50, 50, false); // includes autoResizeToFitContent
        
        // Record height every 500 cycles
        if (i % 500 === 0) {
          heightHistory.push(panel.config.size.height);
        }
      }

      const finalHeight = panel.config.size.height;
      const totalGrowth = finalHeight - initialHeight;

      // Panel should NOT have grown
      expect(totalGrowth).to.be.lessThan(1, 
        `Panel grew by ${totalGrowth}px over 5000 cycles. Height history: ${heightHistory.join(', ')}`);

      // localStorage should NOT have many writes (auto-resize doesn't save)
      const savedDataKeys = Object.keys(localStorageData);
      expect(savedDataKeys.length).to.be.lessThan(2, 'Auto-resize should not save to localStorage');
    });

    it('should NOT accumulate height from repeated load/save cycles', () => {
      // Simulate the bug scenario: panel loads from localStorage, auto-resizes, saves
      const iterations = 100;
      let currentHeight = 200;

      for (let i = 0; i < iterations; i++) {
        // Simulate loading saved state
        localStorageData['accumulation-test-panel'] = JSON.stringify({
          position: { x: 100, y: 100 },
          size: { height: currentHeight },
          visible: true,
          minimized: false
        });

        // Create new panel (simulates page refresh)
        const testPanel = new DraggablePanel({
          id: 'accumulation-test-panel',
          title: 'Test',
          position: { x: 100, y: 100 },
          size: { width: 200, height: 200 },
          buttons: {
            layout: 'vertical',
            items: [
              { caption: 'Button 1', onClick: () => {} },
              { caption: 'Button 2', onClick: () => {} }
            ]
          }
        });

        // Trigger auto-resize
        testPanel.autoResizeToFitContent();

        // Update current height for next iteration
        currentHeight = testPanel.config.size.height;
      }

      // Height should NOT have accumulated significantly
      const growth = currentHeight - 200;
      expect(growth).to.be.lessThan(5, 
        `Height accumulated ${growth}px over ${iterations} load/resize cycles`);
    });

    it('should maintain height stability with varying button content', () => {
      panel = new DraggablePanel({
        id: 'varying-content-panel',
        title: 'Dynamic Content',
        position: { x: 100, y: 100 },
        size: { width: 250, height: 180 },
        buttons: {
          layout: 'vertical',
          items: [
            { caption: 'Short', onClick: () => {} },
            { caption: 'Medium Button', onClick: () => {} },
            { caption: 'Very Long Button Caption', onClick: () => {} }
          ]
        }
      });

      const initialHeight = panel.config.size.height;
      const heightSnapshots = [];

      // Simulate 1000 cycles with occasional content changes
      for (let i = 0; i < 1000; i++) {
        // Occasionally trigger button auto-resize (simulates dynamic content)
        if (i % 100 === 0 && panel.buttons.length > 0) {
          panel.buttons[0].autoResize();
        }

        panel.update(50, 50, false);

        // Take snapshots
        if (i % 200 === 0) {
          heightSnapshots.push(panel.config.size.height);
        }
      }

      const finalHeight = panel.config.size.height;

      // Check for monotonic growth (bug symptom)
      let isMonotonicGrowth = true;
      for (let i = 1; i < heightSnapshots.length; i++) {
        if (heightSnapshots[i] <= heightSnapshots[i-1]) {
          isMonotonicGrowth = false;
          break;
        }
      }

      expect(isMonotonicGrowth).to.be.false;

      // Total growth should be minimal
      expect(Math.abs(finalHeight - initialHeight)).to.be.lessThan(5);
    });
  });

  describe('Panel lifecycle with persistence', () => {
    it('should NOT grow when repeatedly created and destroyed with saved state', () => {
      const initialHeight = 200;
      let savedHeight = initialHeight;
      const heightHistory = [initialHeight];

      // Simulate 50 page refreshes (create, auto-resize, destroy)
      for (let i = 0; i < 50; i++) {
        localStorageData['lifecycle-test-panel'] = JSON.stringify({
          position: { x: 100, y: 100 },
          size: { height: savedHeight },
          visible: true,
          minimized: false
        });

        const testPanel = new DraggablePanel({
          id: 'lifecycle-test-panel',
          title: 'Lifecycle Test',
          position: { x: 100, y: 100 },
          size: { width: 200, height: initialHeight },
          buttons: {
            layout: 'vertical',
            items: [
              { caption: 'Button 1', onClick: () => {} },
              { caption: 'Button 2', onClick: () => {} },
              { caption: 'Button 3', onClick: () => {} }
            ]
          }
        });

        // Simulate some updates
        for (let j = 0; j < 10; j++) {
          testPanel.update(50, 50, false);
        }

        // In the bug scenario, saveState would be called here
        // But with the fix, it should NOT be called
        savedHeight = testPanel.config.size.height;
        heightHistory.push(savedHeight);
      }

      const totalGrowth = savedHeight - initialHeight;

      expect(totalGrowth).to.be.lessThan(1,
        `Panel grew ${totalGrowth}px over 50 lifecycle iterations. History: ${heightHistory.slice(0, 10).join(', ')}...`);
    });

    it('should handle floating-point rounding without accumulation', () => {
      panel = new DraggablePanel({
        id: 'rounding-test-panel',
        title: 'Rounding Test',
        position: { x: 100, y: 100 },
        size: { width: 250, height: 200 }, // Integer initial height
        buttons: {
          layout: 'vertical',
          items: [
            { caption: 'Test 1', onClick: () => {} },
            { caption: 'Test 2', onClick: () => {} }
          ]
        }
      });

      // Set button heights to stable values
      panel.buttons[0].height = 30;
      panel.buttons[1].height = 40;

      const initialHeight = panel.config.size.height;
      const heightMeasurements = [];

      // Simulate 2000 cycles of auto-resize 
      for (let i = 0; i < 2000; i++) {
        panel.autoResizeToFitContent();
        
        if (i % 250 === 0) {
          heightMeasurements.push(panel.config.size.height);
        }
      }

      const finalHeight = panel.config.size.height;
      
      // Check that height stabilized (all measurements the same after initial resize)
      const uniqueHeights = [...new Set(heightMeasurements)];
      expect(uniqueHeights.length).to.be.lessThanOrEqual(2, 
        `Height should stabilize quickly. Unique heights: ${uniqueHeights.join(', ')}`);

      // The important thing is height doesn't keep growing
      expect(heightMeasurements[heightMeasurements.length - 1])
        .to.equal(heightMeasurements[heightMeasurements.length - 2],
          'Height should be stable in later measurements');
    });
  });

  describe('Manual drag vs auto-resize', () => {
    it('should save position during manual drag but NOT during auto-resize', () => {
      panel = new DraggablePanel({
        id: 'drag-vs-resize-panel',
        title: 'Drag Test',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        buttons: {
          layout: 'vertical',
          items: [
            { caption: 'Button', onClick: () => {} }
          ]
        }
      });

      // Run auto-resize cycles
      for (let i = 0; i < 100; i++) {
        panel.autoResizeToFitContent();
      }

      // Count localStorage writes
      const initialWriteCount = Object.keys(localStorageData).length;

      // Now simulate manual drag
      panel.isDragging = true;
      panel.dragOffset = { x: 10, y: 10 };
      panel.handleDragging(200, 200, true); // drag
      panel.handleDragging(200, 200, false); // release

      // Should have saved once from drag release
      const finalWriteCount = Object.keys(localStorageData).length;
      expect(finalWriteCount).to.be.greaterThan(initialWriteCount, 'Manual drag should save state');
    });
  });
});
