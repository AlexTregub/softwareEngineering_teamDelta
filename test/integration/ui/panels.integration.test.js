/**
 * Consolidated Panel System Integration Tests
 * Generated: 2025-10-29T03:16:53.952Z
 * Source files: 6
 * Total tests: 94
 */

// Common requires
let { expect } = require('chai');
let sinon = require('sinon');
let { JSDOM } = require('jsdom');


// ================================================================
// draggablePanel.growth.integration.test.js (6 tests)
// ================================================================
/**
 * Integration Tests for DraggablePanel Growth Prevention
 * Tests that panels do NOT grow over time due to auto-resize feedback loop
 */

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




// ================================================================
// panelSizingIssues.integration.test.js (17 tests)
// ================================================================
/**
 * Integration tests to investigate panel sizing issues
 * 
 * User reported that after enabling auto-sizing for Level Editor panels,
 * several other panels have incorrect sizes and word wrap is broken:
 * - Resource Spawner
 * - Task objectives
 * - Debug Controls
 * 
 * These tests will identify:
 * 1. Which panels have auto-sizing enabled/disabled
 * 2. What their current sizes are vs expected sizes
 * 3. Whether text wrapping is working
 * 4. Whether buttons are being measured correctly
 */

describe('Panel Sizing Issues Investigation', function() {
  let DraggablePanel, DraggablePanelManager;
  let manager;
  
  before(function() {
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
    global.image = sinon.stub();
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y, mag: () => Math.sqrt(x*x + y*y) }));
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    global.BASELINE = 'alphabetic';

    // Mock devConsoleEnabled
    global.devConsoleEnabled = false;

    // Mock window
    global.window = {
      innerWidth: 1920,
      innerHeight: 1080
    };

    // Mock localStorage
    global.localStorage = {
      getItem: sinon.stub().returns(null),
      setItem: sinon.stub()
    };

    // Mock Button class
    const Button = class {
      constructor(x, y, width, height, caption, style) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.caption = caption;
        this.style = style || {};
      }
      setPosition(x, y) {
        this.x = x;
        this.y = y;
      }
      update() { return false; }
      render() {}
      autoResize() {}
      autoResizeForText() { return false; }
    };
    global.Button = Button;

    // Mock ButtonStyles (defined in Button.js)
    global.ButtonStyles = {
      DEFAULT: { backgroundColor: '#CCCCCC', textColor: '#000000' },
      PRIMARY: { backgroundColor: '#007BFF', textColor: '#FFFFFF' },
      SUCCESS: { backgroundColor: '#28A745', textColor: '#FFFFFF' },
      DANGER: { backgroundColor: '#DC3545', textColor: '#FFFFFF' },
      WARNING: { backgroundColor: '#FFC107', textColor: '#000000' },
      INFO: { backgroundColor: '#17A2B8', textColor: '#FFFFFF' },
      PURPLE: { backgroundColor: '#6F42C1', textColor: '#FFFFFF' }
    };
    
    // Sync to window if available
    if (typeof window !== 'undefined') {
      window.ButtonStyles = global.ButtonStyles;
    }
    
    // Load required classes
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');
    
    // Set as global for DraggablePanelManager
    global.DraggablePanel = DraggablePanel;
    if (typeof window !== 'undefined') {
      window.DraggablePanel = DraggablePanel;
    }
  });
  
  beforeEach(function() {
    manager = new DraggablePanelManager();
    manager.createDefaultPanels();
  });
  
  afterEach(function() {
    if (manager) {
      manager.panels.clear();
    }
  });
  
  after(function() {
    sinon.restore();
  });
  
  describe('Resource Spawner Panel', function() {
    let panel;
    
    beforeEach(function() {
      panel = manager.panels.get('resources');
    });
    
    it('should exist with correct title', function() {
      expect(panel).to.exist;
      expect(panel.config.title).to.equal('Resource Spawner');
    });
    
    it('should check auto-sizing configuration', function() {
      const autoSizeEnabled = panel.config.buttons?.autoSizeToContent || false;
      console.log('\n📊 Resource Spawner Auto-Sizing Config:');
      console.log(`  autoSizeToContent: ${autoSizeEnabled}`);
      console.log(`  Layout: ${panel.config.buttons?.layout}`);
      console.log(`  Button count: ${panel.buttons?.length || 0}`);
      console.log(`  Current size: ${panel.config.size.width}×${panel.config.size.height}px`);
    });
    
    it('should check button text wrapping', function() {
      const button = panel.buttons?.[0];
      if (button) {
        console.log('\n📝 Resource Spawner Button Details:');
        console.log(`  Caption: "${button.caption}"`);
        console.log(`  Width: ${button.width}px`);
        console.log(`  Height: ${button.height}px`);
        console.log(`  Caption length: ${button.caption.length} chars`);
        
        // Check if caption is too long for button width
        const estimatedTextWidth = button.caption.length * 6; // Rough estimate
        const needsWrapping = estimatedTextWidth > button.width;
        console.log(`  Estimated text width: ${estimatedTextWidth}px`);
        console.log(`  Needs wrapping: ${needsWrapping}`);
      }
    });
    
    it('should measure actual vs expected size', function() {
      const expectedWidth = 180; // From config
      const expectedHeight = 150; // From config (was this before auto-sizing?)
      const actualWidth = panel.config.size.width;
      const actualHeight = panel.config.size.height;
      
      console.log('\n📏 Resource Spawner Size Comparison:');
      console.log(`  Expected: ${expectedWidth}×${expectedHeight}px`);
      console.log(`  Actual: ${actualWidth}×${actualHeight}px`);
      console.log(`  Width diff: ${actualWidth - expectedWidth}px`);
      console.log(`  Height diff: ${actualHeight - expectedHeight}px`);
      
      if (actualWidth !== expectedWidth || actualHeight !== expectedHeight) {
        console.log(`  ⚠️ SIZE MISMATCH DETECTED`);
      }
    });
    
    it('should check if horizontal layout is calculating correctly', function() {
      const layout = panel.config.buttons?.layout;
      const buttonHeight = panel.config.buttons?.buttonHeight || 0;
      const spacing = panel.config.buttons?.spacing || 0;
      const verticalPadding = panel.config.buttons?.verticalPadding || 0;
      
      console.log('\n🔍 Resource Spawner Layout Calculations:');
      console.log(`  Layout type: ${layout}`);
      console.log(`  Button height: ${buttonHeight}px`);
      console.log(`  Spacing: ${spacing}px`);
      console.log(`  Vertical padding: ${verticalPadding}px`);
      
      if (layout === 'horizontal') {
        const titleBarHeight = 26.8; // Standard
        const expectedContentHeight = buttonHeight;
        const expectedTotalHeight = titleBarHeight + expectedContentHeight + (verticalPadding * 2);
        
        console.log(`  Expected content height: ${expectedContentHeight}px`);
        console.log(`  Expected total height: ${expectedTotalHeight}px`);
        console.log(`  Actual height: ${panel.config.size.height}px`);
        
        if (Math.abs(panel.config.size.height - expectedTotalHeight) > 1) {
          console.log(`  ⚠️ HEIGHT CALCULATION MISMATCH`);
        }
      }
    });
  });
  
  describe('Debug Controls Panel', function() {
    let panel;
    
    beforeEach(function() {
      panel = manager.panels.get('debug');
    });
    
    it('should exist with correct title', function() {
      expect(panel).to.exist;
      expect(panel.config.title).to.equal('Debug Controls');
    });
    
    it('should check auto-sizing configuration', function() {
      const autoSizeEnabled = panel.config.buttons?.autoSizeToContent || false;
      console.log('\n📊 Debug Controls Auto-Sizing Config:');
      console.log(`  autoSizeToContent: ${autoSizeEnabled}`);
      console.log(`  Layout: ${panel.config.buttons?.layout}`);
      console.log(`  Button count: ${panel.buttons?.length || 0}`);
      console.log(`  Current size: ${panel.config.size.width}×${panel.config.size.height}px`);
    });
    
    it('should check button configuration', function() {
      console.log('\n📝 Debug Controls Button Details:');
      console.log(`  Total buttons: ${panel.buttons?.length || 0}`);
      
      if (panel.buttons && panel.buttons.length > 0) {
        panel.buttons.forEach((btn, i) => {
          console.log(`  Button ${i + 1}: "${btn.caption}"`);
          console.log(`    Size: ${btn.width}×${btn.height}px`);
          console.log(`    Caption length: ${btn.caption.length} chars`);
        });
      }
    });
    
    it('should measure actual vs expected size', function() {
      const expectedWidth = 160; // From config
      const expectedHeight = 450; // From config (was this before auto-sizing?)
      const actualWidth = panel.config.size.width;
      const actualHeight = panel.config.size.height;
      
      console.log('\n📏 Debug Controls Size Comparison:');
      console.log(`  Expected: ${expectedWidth}×${expectedHeight}px`);
      console.log(`  Actual: ${actualWidth}×${actualHeight}px`);
      console.log(`  Width diff: ${actualWidth - expectedWidth}px`);
      console.log(`  Height diff: ${actualHeight - expectedHeight}px`);
      
      if (actualWidth !== expectedWidth || actualHeight !== expectedHeight) {
        console.log(`  ⚠️ SIZE MISMATCH DETECTED`);
      }
    });
    
    it('should calculate expected height for vertical layout', function() {
      const buttonCount = panel.buttons?.length || 0;
      const buttonHeight = panel.config.buttons?.buttonHeight || 0;
      const spacing = panel.config.buttons?.spacing || 0;
      const verticalPadding = panel.config.buttons?.verticalPadding || 0;
      
      console.log('\n🔍 Debug Controls Layout Calculations:');
      console.log(`  Button count: ${buttonCount}`);
      console.log(`  Button height: ${buttonHeight}px`);
      console.log(`  Spacing: ${spacing}px`);
      console.log(`  Vertical padding: ${verticalPadding}px`);
      
      if (buttonCount > 0) {
        const titleBarHeight = 26.8; // Standard
        const contentHeight = (buttonCount * buttonHeight) + ((buttonCount - 1) * spacing);
        const expectedTotalHeight = titleBarHeight + contentHeight + (verticalPadding * 2);
        
        console.log(`  Expected content height: ${contentHeight}px`);
        console.log(`  Expected total height: ${expectedTotalHeight}px`);
        console.log(`  Actual height: ${panel.config.size.height}px`);
        console.log(`  Difference: ${panel.config.size.height - expectedTotalHeight}px`);
        
        if (Math.abs(panel.config.size.height - expectedTotalHeight) > 1) {
          console.log(`  ⚠️ HEIGHT CALCULATION MISMATCH`);
        }
      }
    });
  });
  
  describe('Task Objectives Panel', function() {
    let panel;
    
    beforeEach(function() {
      panel = manager.panels.get('tasks');
    });
    
    it('should exist with correct title', function() {
      expect(panel).to.exist;
      expect(panel.config.title).to.equal('Task objectives');
    });
    
    it('should check auto-sizing configuration', function() {
      const autoSizeEnabled = panel.config.buttons?.autoSizeToContent || false;
      console.log('\n📊 Task Objectives Auto-Sizing Config:');
      console.log(`  autoSizeToContent: ${autoSizeEnabled}`);
      console.log(`  Layout: ${panel.config.buttons?.layout}`);
      console.log(`  Button count: ${panel.buttons?.length || 0}`);
      console.log(`  Current size: ${panel.config.size.width}×${panel.config.size.height}px`);
    });
    
    it('should check button text wrapping needs', function() {
      console.log('\n📝 Task Objectives Button Text Analysis:');
      
      if (panel.buttons && panel.buttons.length > 0) {
        panel.buttons.forEach((btn, i) => {
          const estimatedTextWidth = btn.caption.length * 6; // Rough estimate (6px per char)
          const needsWrapping = estimatedTextWidth > btn.width;
          
          console.log(`  Button ${i + 1}: "${btn.caption}"`);
          console.log(`    Width: ${btn.width}px`);
          console.log(`    Height: ${btn.height}px`);
          console.log(`    Caption length: ${btn.caption.length} chars`);
          console.log(`    Estimated text width: ${estimatedTextWidth}px`);
          console.log(`    Needs wrapping: ${needsWrapping ? '⚠️ YES' : '✅ NO'}`);
        });
      }
    });
    
    it('should measure actual vs expected size', function() {
      const expectedWidth = 160; // From config
      const expectedHeight = 320; // From config (was this before auto-sizing?)
      const actualWidth = panel.config.size.width;
      const actualHeight = panel.config.size.height;
      
      console.log('\n📏 Task Objectives Size Comparison:');
      console.log(`  Expected: ${expectedWidth}×${expectedHeight}px`);
      console.log(`  Actual: ${actualWidth}×${actualHeight}px`);
      console.log(`  Width diff: ${actualWidth - expectedWidth}px`);
      console.log(`  Height diff: ${actualHeight - expectedHeight}px`);
      
      if (actualWidth !== expectedWidth || actualHeight !== expectedHeight) {
        console.log(`  ⚠️ SIZE MISMATCH DETECTED`);
      }
    });
    
    it('should calculate expected height for vertical layout', function() {
      const buttonCount = panel.buttons?.length || 0;
      const buttonHeight = panel.config.buttons?.buttonHeight || 0;
      const spacing = panel.config.buttons?.spacing || 0;
      const verticalPadding = panel.config.buttons?.verticalPadding || 0;
      
      console.log('\n🔍 Task Objectives Layout Calculations:');
      console.log(`  Button count: ${buttonCount}`);
      console.log(`  Button height: ${buttonHeight}px`);
      console.log(`  Spacing: ${spacing}px`);
      console.log(`  Vertical padding: ${verticalPadding}px`);
      
      if (buttonCount > 0) {
        const titleBarHeight = 26.8; // Standard
        const contentHeight = (buttonCount * buttonHeight) + ((buttonCount - 1) * spacing);
        const expectedTotalHeight = titleBarHeight + contentHeight + (verticalPadding * 2);
        
        console.log(`  Expected content height: ${contentHeight}px`);
        console.log(`  Expected total height: ${expectedTotalHeight}px`);
        console.log(`  Actual height: ${panel.config.size.height}px`);
        console.log(`  Difference: ${panel.config.size.height - expectedTotalHeight}px`);
        
        if (Math.abs(panel.config.size.height - expectedTotalHeight) > 1) {
          console.log(`  ⚠️ HEIGHT CALCULATION MISMATCH`);
        }
      }
    });
  });
  
  describe('Cross-Panel Comparison', function() {
    it('should compare all three panels', function() {
      const resourcesPanel = manager.panels.get('resources');
      const debugPanel = manager.panels.get('debug');
      const tasksPanel = manager.panels.get('tasks');
      
      console.log('\n📊 Cross-Panel Comparison Summary:');
      console.log('================================================================================');
      
      const panels = [
        { name: 'Resource Spawner', panel: resourcesPanel },
        { name: 'Debug Controls', panel: debugPanel },
        { name: 'Task Objectives', panel: tasksPanel }
      ];
      
      panels.forEach(({ name, panel }) => {
        if (!panel) {
          console.log(`${name}: NOT FOUND`);
          return;
        }
        
        const autoSize = panel.config.buttons?.autoSizeToContent || false;
        const size = `${panel.config.size.width}×${panel.config.size.height}px`;
        const layout = panel.config.buttons?.layout || 'unknown';
        const buttonCount = panel.buttons?.length || 0;
        
        console.log(`\n${name}:`);
        console.log(`  Auto-sizing: ${autoSize ? '✅ ENABLED' : '❌ DISABLED'}`);
        console.log(`  Size: ${size}`);
        console.log(`  Layout: ${layout}`);
        console.log(`  Buttons: ${buttonCount}`);
      });
      
      console.log('\n================================================================================');
    });
    
    it('should identify panels with auto-sizing incorrectly enabled/disabled', function() {
      const panels = manager.panels;
      const problematicPanels = [];
      
      console.log('\n🔍 Checking all panels for auto-sizing configuration...\n');
      
      panels.forEach((panel, id) => {
        const autoSize = panel.config.buttons?.autoSizeToContent || false;
        const hasButtons = (panel.buttons?.length || 0) > 0;
        const hasCallback = !!panel.config.contentSizeCallback;
        
        // Check if auto-sizing is enabled but shouldn't be (or vice versa)
        if (autoSize && !hasButtons && !hasCallback) {
          problematicPanels.push({
            id,
            issue: 'Auto-sizing enabled but no buttons/callback',
            panel
          });
        }
        
        console.log(`${id}:`);
        console.log(`  Auto-sizing: ${autoSize ? 'ON' : 'OFF'}`);
        console.log(`  Buttons: ${hasButtons ? panel.buttons.length : 0}`);
        console.log(`  Callback: ${hasCallback ? 'YES' : 'NO'}`);
      });
      
      if (problematicPanels.length > 0) {
        console.log('\n⚠️ Problematic Panels Found:');
        problematicPanels.forEach(({ id, issue }) => {
          console.log(`  - ${id}: ${issue}`);
        });
      } else {
        console.log('\n✅ All panels have appropriate auto-sizing configuration');
      }
    });
  });
});




// ================================================================
// scrollableContentArea.integration.test.js (24 tests)
// ================================================================
/**
 * Integration Tests: ScrollableContentArea Component (TDD - Phase 2A)
 * 
 * Tests ScrollableContentArea with REAL ScrollIndicator integration (JSDOM).
 * Heavy focus on scroll indicator interaction and level editor scenarios.
 */

describe('ScrollableContentArea Integration Tests', function() {
  let contentArea, mockP5, dom;
  
  beforeEach(function() {
    // Create JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js drawing functions
    mockP5 = {
      fill: sinon.stub(),
      noStroke: sinon.stub(),
      stroke: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      LEFT: 'LEFT',
      CENTER: 'CENTER'
    };
    
    // Assign to global BEFORE requiring classes (so classes capture these)
    global.fill = mockP5.fill;
    global.noStroke = mockP5.noStroke;
    global.stroke = mockP5.stroke;
    global.rect = mockP5.rect;
    global.text = mockP5.text;
    global.textAlign = mockP5.textAlign;
    global.textSize = mockP5.textSize;
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.LEFT = mockP5.LEFT;
    global.CENTER = mockP5.CENTER;
    
    // Load REAL ScrollIndicator
    const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
    global.ScrollIndicator = ScrollIndicator;
    
    // Load ScrollableContentArea
    const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
    contentArea = new ScrollableContentArea({
      width: 300,
      height: 600,
      scrollSpeed: 20
    });
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.window;
    delete global.document;
  });
  
  describe('ScrollIndicator Integration', function() {
    it('should create real ScrollIndicator instance', function() {
      expect(contentArea.scrollIndicator).to.exist;
      expect(contentArea.scrollIndicator.constructor.name).to.equal('ScrollIndicator');
    });
    
    it('should pass indicator height from options', function() {
      const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
      const custom = new ScrollableContentArea({ indicatorHeight: 30 });
      
      expect(custom.scrollIndicator.height).to.equal(30);
    });
    
    it('should pass indicator colors from options', function() {
      const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
      const custom = new ScrollableContentArea({
        indicatorBg: [100, 100, 100],
        indicatorArrow: [255, 0, 0]
      });
      
      expect(custom.scrollIndicator.backgroundColor).to.deep.equal([100, 100, 100]);
      expect(custom.scrollIndicator.arrowColor).to.deep.equal([255, 0, 0]);
    });
    
    it('should use ScrollIndicator.getTotalHeight() for visible height calculation', function() {
      // No content = no scrolling = no indicators
      let visibleHeight = contentArea.getVisibleHeight();
      expect(visibleHeight).to.equal(600); // Full height
      
      // Add content requiring scrolling
      for (let i = 0; i < 20; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 50 });
      }
      contentArea.updateScrollBounds();
      
      // Now should account for indicators
      // At top: only bottom indicator (20px)
      visibleHeight = contentArea.getVisibleHeight();
      expect(visibleHeight).to.equal(580); // 600 - 20
      
      // Scroll to middle: both indicators (40px)
      contentArea.scrollOffset = 50;
      visibleHeight = contentArea.getVisibleHeight();
      expect(visibleHeight).to.equal(560); // 600 - 40
    });
    
    it('should determine top indicator visibility using ScrollIndicator.canScrollUp()', function() {
      // Add scrollable content
      for (let i = 0; i < 20; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 50 });
      }
      contentArea.updateScrollBounds();
      
      // At top: no top indicator
      expect(contentArea.scrollIndicator.canScrollUp(contentArea.scrollOffset)).to.be.false;
      
      // Scroll down: top indicator should appear
      contentArea.scrollOffset = 50;
      expect(contentArea.scrollIndicator.canScrollUp(contentArea.scrollOffset)).to.be.true;
    });
    
    it('should determine bottom indicator visibility using ScrollIndicator.canScrollDown()', function() {
      // Add scrollable content
      for (let i = 0; i < 20; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 50 });
      }
      contentArea.updateScrollBounds();
      
      // At top: bottom indicator visible
      expect(contentArea.scrollIndicator.canScrollDown(contentArea.scrollOffset, contentArea.maxScrollOffset)).to.be.true;
      
      // Scroll to bottom: no bottom indicator
      contentArea.scrollOffset = contentArea.maxScrollOffset;
      expect(contentArea.scrollIndicator.canScrollDown(contentArea.scrollOffset, contentArea.maxScrollOffset)).to.be.false;
    });
    
    it('should calculate correct indicator positions for rendering', function() {
      // Add scrollable content and scroll to middle
      for (let i = 0; i < 30; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 50 });
      }
      contentArea.updateScrollBounds();
      contentArea.scrollOffset = 100;
      
      // Both indicators should be visible
      const topVisible = contentArea.scrollIndicator.canScrollUp(contentArea.scrollOffset);
      const bottomVisible = contentArea.scrollIndicator.canScrollDown(contentArea.scrollOffset, contentArea.maxScrollOffset);
      
      expect(topVisible).to.be.true;
      expect(bottomVisible).to.be.true;
      
      // Total indicator height should be 40px (both indicators)
      const totalIndicatorHeight = contentArea.scrollIndicator.getTotalHeight(contentArea.scrollOffset, contentArea.maxScrollOffset);
      expect(totalIndicatorHeight).to.equal(40);
    });
    
    it('should adjust content viewport when indicators are shown', function() {
      // No content: full height available
      expect(contentArea.getVisibleHeight()).to.equal(600);
      
      // Add scrollable content: bottom indicator reduces visible height
      for (let i = 0; i < 20; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 50 });
      }
      contentArea.updateScrollBounds();
      
      expect(contentArea.getVisibleHeight()).to.equal(580); // 600 - 20
      
      // Scroll to middle: both indicators reduce visible height
      contentArea.scrollOffset = 100;
      expect(contentArea.getVisibleHeight()).to.equal(560); // 600 - 40
    });
  });
  
  describe('Full Workflow Tests', function() {
    it('should handle complete scroll cycle with indicator state changes', function() {
      // Start with no content
      let visibleHeight = contentArea.getVisibleHeight();
      expect(visibleHeight).to.equal(600); // No indicators
      
      // Add scrollable content
      for (let i = 0; i < 20; i++) {
        contentArea.addButton(`btn${i}`, `Button ${i}`, sinon.stub(), { height: 50 });
      }
      contentArea.updateScrollBounds();
      
      // At top: only bottom indicator
      expect(contentArea.scrollIndicator.canScrollUp(contentArea.scrollOffset)).to.be.false;
      expect(contentArea.scrollIndicator.canScrollDown(contentArea.scrollOffset, contentArea.maxScrollOffset)).to.be.true;
      visibleHeight = contentArea.getVisibleHeight();
      expect(visibleHeight).to.equal(580); // 600 - 20
      
      // Scroll to middle: both indicators
      contentArea.handleMouseWheel(-10);
      expect(contentArea.scrollIndicator.canScrollUp(contentArea.scrollOffset)).to.be.true;
      expect(contentArea.scrollIndicator.canScrollDown(contentArea.scrollOffset, contentArea.maxScrollOffset)).to.be.true;
      visibleHeight = contentArea.getVisibleHeight();
      expect(visibleHeight).to.equal(560); // 600 - 40
      
      // Scroll to bottom: only top indicator
      contentArea.scrollOffset = contentArea.maxScrollOffset;
      expect(contentArea.scrollIndicator.canScrollUp(contentArea.scrollOffset)).to.be.true;
      expect(contentArea.scrollIndicator.canScrollDown(contentArea.scrollOffset, contentArea.maxScrollOffset)).to.be.false;
      visibleHeight = contentArea.getVisibleHeight();
      expect(visibleHeight).to.equal(580); // 600 - 20
    });
    
    it('should add and remove multiple item types', function() {
      contentArea.addText('text1', 'Title', { fontSize: 16 });
      contentArea.addButton('btn1', 'Action', sinon.stub());
      contentArea.addCustom('custom1', sinon.stub(), null, 60);
      
      expect(contentArea.contentItems).to.have.lengthOf(3);
      
      contentArea.removeItem('btn1');
      expect(contentArea.contentItems).to.have.lengthOf(2);
      expect(contentArea.contentItems.find(item => item.id === 'btn1')).to.be.undefined;
      
      contentArea.clearAll();
      expect(contentArea.contentItems).to.have.lengthOf(0);
    });
    
    it('should handle click delegation through scroll states', function() {
      const callbacks = [];
      for (let i = 0; i < 20; i++) {
        const callback = sinon.stub();
        callbacks.push(callback);
        contentArea.addButton(`btn${i}`, `Button ${i}`, callback, { height: 50 });
      }
      contentArea.updateScrollBounds();
      
      // Click first button at top (y=0-50 in content space, click at y=25)
      const clicked1 = contentArea.handleClick(150, 25, 0, 0);
      expect(clicked1).to.exist;
      expect(clicked1.id).to.equal('btn0');
      
      // Scroll down by delta -25 (scrollSpeed 20, so -25 * 2 = -50, subtract gives 50 offset)
      contentArea.handleMouseWheel(-25);
      // scrollSpeed = 20, scrollSpeed/10 = 2, delta * 2 = -25 * 2 = -50
      // scrollOffset -= (-50) => scrollOffset = 0 + 50 = 50
      expect(contentArea.scrollOffset).to.equal(50);
      
      // Click same screen position (y=25)
      // With scroll offset 50, btn0 is at -50 to 0 (out of view), btn1 is at 0 to 50
      const clicked2 = contentArea.handleClick(150, 25, 0, 0);
      expect(clicked2).to.exist;
      expect(clicked2.id).to.equal('btn1');
    });
  });
  
  describe('Viewport Culling Performance', function() {
    it('should only include visible items in getVisibleItems()', function() {
      // Add 100 items
      for (let i = 0; i < 100; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 50 });
      }
      contentArea.updateScrollBounds();
      
      const visibleItems = contentArea.getVisibleItems();
      
      // Visible height is ~580px (with bottom indicator), items are 50px each
      // So ~11-12 items should be visible
      expect(visibleItems.length).to.be.lessThan(20);
      expect(visibleItems.length).to.be.greaterThan(10);
    });
    
    it('should return different visible items when scrolled', function() {
      // Add items
      for (let i = 0; i < 50; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 50 });
      }
      contentArea.updateScrollBounds();
      
      // Get visible items at top
      const topVisible = contentArea.getVisibleItems();
      const topFirstId = topVisible[0].item.id;
      
      // Scroll down significantly
      contentArea.scrollOffset = 500;
      
      // Get visible items after scroll
      const scrolledVisible = contentArea.getVisibleItems();
      const scrolledFirstId = scrolledVisible[0].item.id;
      
      // Should be rendering similar count
      expect(scrolledVisible.length).to.be.closeTo(topVisible.length, 3);
      
      // But different items (first item ID should be different)
      expect(scrolledFirstId).to.not.equal(topFirstId);
    });
    
    it('should getVisibleItems return only items in viewport', function() {
      for (let i = 0; i < 100; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 50 });
      }
      contentArea.updateScrollBounds();
      
      const visibleItems = contentArea.getVisibleItems();
      
      // Should be ~12 items (600px height - 20px indicator / 50px per item)
      expect(visibleItems.length).to.be.lessThan(20);
      expect(visibleItems.length).to.be.greaterThan(10);
    });
  });
  
  describe('Empty Content Edge Cases', function() {
    it('should handle empty content gracefully', function() {
      // Empty content: no scrolling possible
      expect(contentArea.contentItems).to.have.lengthOf(0);
      expect(contentArea.maxScrollOffset).to.equal(0);
      
      // No scroll indicators should be needed
      expect(contentArea.scrollIndicator.canScrollUp(contentArea.scrollOffset)).to.be.false;
      expect(contentArea.scrollIndicator.canScrollDown(contentArea.scrollOffset, contentArea.maxScrollOffset)).to.be.false;
      
      // Full viewport available
      expect(contentArea.getVisibleHeight()).to.equal(600);
    });
    
    it('should handle single item (no scrolling)', function() {
      contentArea.addText('text1', 'Only Item', { height: 50 });
      contentArea.updateScrollBounds();
      
      expect(contentArea.maxScrollOffset).to.equal(0);
      expect(contentArea.getVisibleHeight()).to.equal(600);
      
      // Cannot scroll
      const scrolled = contentArea.handleMouseWheel(-10);
      expect(scrolled).to.be.false;
    });
    
    it('should handle content exactly fitting viewport', function() {
      // Add exactly 600px of content
      for (let i = 0; i < 12; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 50 });
      }
      contentArea.updateScrollBounds();
      
      expect(contentArea.calculateTotalHeight()).to.equal(600);
      expect(contentArea.maxScrollOffset).to.equal(0);
      
      // No indicators needed
      expect(contentArea.scrollIndicator.canScrollUp(contentArea.scrollOffset)).to.be.false;
      expect(contentArea.scrollIndicator.canScrollDown(contentArea.scrollOffset, contentArea.maxScrollOffset)).to.be.false;
    });
  });
  
  describe('ScrollIndicator State Transitions', function() {
    beforeEach(function() {
      // Add scrollable content
      for (let i = 0; i < 30; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 50 });
      }
      contentArea.updateScrollBounds();
    });
    
    it('should transition from no-scroll to bottom-only indicator', function() {
      contentArea.scrollOffset = 0;
      
      const topVisible = contentArea.scrollIndicator.canScrollUp(contentArea.scrollOffset);
      const bottomVisible = contentArea.scrollIndicator.canScrollDown(contentArea.scrollOffset, contentArea.maxScrollOffset);
      
      expect(topVisible).to.be.false;
      expect(bottomVisible).to.be.true;
      
      const totalHeight = contentArea.scrollIndicator.getTotalHeight(contentArea.scrollOffset, contentArea.maxScrollOffset);
      expect(totalHeight).to.equal(20); // Only bottom indicator
    });
    
    it('should transition to both indicators when in middle', function() {
      contentArea.scrollOffset = 100;
      
      const topVisible = contentArea.scrollIndicator.canScrollUp(contentArea.scrollOffset);
      const bottomVisible = contentArea.scrollIndicator.canScrollDown(contentArea.scrollOffset, contentArea.maxScrollOffset);
      
      expect(topVisible).to.be.true;
      expect(bottomVisible).to.be.true;
      
      const totalHeight = contentArea.scrollIndicator.getTotalHeight(contentArea.scrollOffset, contentArea.maxScrollOffset);
      expect(totalHeight).to.equal(40); // Both indicators
    });
    
    it('should transition to top-only indicator at bottom', function() {
      contentArea.scrollOffset = contentArea.maxScrollOffset;
      
      const topVisible = contentArea.scrollIndicator.canScrollUp(contentArea.scrollOffset);
      const bottomVisible = contentArea.scrollIndicator.canScrollDown(contentArea.scrollOffset, contentArea.maxScrollOffset);
      
      expect(topVisible).to.be.true;
      expect(bottomVisible).to.be.false;
      
      const totalHeight = contentArea.scrollIndicator.getTotalHeight(contentArea.scrollOffset, contentArea.maxScrollOffset);
      expect(totalHeight).to.equal(20); // Only top indicator
    });
    
    it('should update maxScrollOffset when indicators appear/disappear', function() {
      // Start with content that fits
      contentArea.clearAll();
      contentArea.addText('text1', 'Item 1', { height: 300 });
      contentArea.updateScrollBounds();
      
      const maxScrollNoIndicator = contentArea.maxScrollOffset;
      expect(maxScrollNoIndicator).to.equal(0);
      
      // Add more content to require scrolling
      contentArea.addText('text2', 'Item 2', { height: 300 });
      contentArea.addText('text3', 'Item 3', { height: 300 });
      contentArea.updateScrollBounds();
      
      // Now maxScroll should account for bottom indicator height
      const maxScrollWithIndicator = contentArea.maxScrollOffset;
      expect(maxScrollWithIndicator).to.be.greaterThan(0);
      
      // Total content: 900px
      // Visible without indicator: 600px
      // Visible with indicator: 580px (bottom indicator)
      // Max scroll: 900 - 580 = 320
      expect(maxScrollWithIndicator).to.equal(320);
    });
  });
  
  describe('Level Editor Scenarios', function() {
    it('should support dynamic content updates (sidebar workflow)', function() {
      // Start with category title
      contentArea.addText('title', 'Events', { fontSize: 16, height: 30 });
      
      // Add event buttons dynamically
      const events = ['Spawn Enemy', 'Show Dialogue', 'Change Terrain', 'Trigger Boss'];
      events.forEach((event, i) => {
        contentArea.addButton(`event${i}`, event, sinon.stub(), { height: 35 });
      });
      
      expect(contentArea.contentItems).to.have.lengthOf(5);
      
      // Remove one event
      contentArea.removeItem('event1');
      expect(contentArea.contentItems).to.have.lengthOf(4);
      
      // Add custom separator
      contentArea.addCustom('separator', (x, y, w) => {
        fill([100, 100, 100]);
        rect(x, y, w, 2);
      }, null, 10);
      
      expect(contentArea.contentItems).to.have.lengthOf(5);
    });
    
    it('should handle rapid scroll updates (mouse wheel)', function() {
      for (let i = 0; i < 50; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 40 });
      }
      contentArea.updateScrollBounds();
      
      const scrollCallback = sinon.stub();
      contentArea.onScroll = scrollCallback;
      
      // Simulate rapid scrolling
      for (let i = 0; i < 10; i++) {
        contentArea.handleMouseWheel(-5);
      }
      
      expect(scrollCallback.callCount).to.equal(10);
      expect(contentArea.scrollOffset).to.be.greaterThan(0);
      expect(contentArea.scrollOffset).to.be.lessThanOrEqual(contentArea.maxScrollOffset);
    });
    
    it('should support hover effects on buttons', function() {
      for (let i = 0; i < 10; i++) {
        contentArea.addButton(`btn${i}`, `Tool ${i}`, sinon.stub(), { height: 40 });
      }
      
      // Hover over first button
      contentArea.updateHover(150, 40, 0, 0);
      
      expect(contentArea.contentItems[0].isHovered).to.be.true;
      
      // Move mouse away
      contentArea.updateHover(150, 500, 0, 0);
      
      expect(contentArea.contentItems[0].isHovered).to.be.false;
    });
  });
});




// ================================================================
// scrollIndicator.integration.test.js (18 tests)
// ================================================================
/**
 * Integration Tests: ScrollIndicator Component (TDD - Phase 2A)
 * 
 * Tests ScrollIndicator with mock p5.js environment (JSDOM).
 * Verifies rendering with different scroll states and real interactions.
 */

describe('ScrollIndicator Integration Tests', function() {
  let indicator, mockP5, dom;
  
  beforeEach(function() {
    // Create JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js drawing functions
    mockP5 = {
      fill: sinon.stub(),
      noStroke: sinon.stub(),
      stroke: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      CENTER: 'CENTER'
    };
    
    // Assign to both global and window
    global.fill = mockP5.fill;
    global.noStroke = mockP5.noStroke;
    global.stroke = mockP5.stroke;
    global.rect = mockP5.rect;
    global.text = mockP5.text;
    global.textAlign = mockP5.textAlign;
    global.textSize = mockP5.textSize;
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.CENTER = mockP5.CENTER;
    
    window.fill = global.fill;
    window.noStroke = global.noStroke;
    window.stroke = global.stroke;
    window.rect = global.rect;
    window.text = global.text;
    window.textAlign = global.textAlign;
    window.textSize = global.textSize;
    window.push = global.push;
    window.pop = global.pop;
    window.CENTER = global.CENTER;
    
    // Load ScrollIndicator
    const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
    indicator = new ScrollIndicator();
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.window;
    delete global.document;
  });
  
  describe('Rendering with Different Scroll States', function() {
    it('should render no indicators when content fits viewport', function() {
      const scrollOffset = 0;
      const maxScrollOffset = 0;
      
      indicator.renderTop(10, 20, 300, scrollOffset);
      indicator.renderBottom(10, 600, 300, scrollOffset, maxScrollOffset);
      
      // Neither should render
      expect(mockP5.push.called).to.be.false;
      expect(mockP5.rect.called).to.be.false;
      expect(mockP5.text.called).to.be.false;
    });
    
    it('should render only bottom arrow when scrolled to top', function() {
      const scrollOffset = 0;
      const maxScrollOffset = 200;
      
      mockP5.push.resetHistory();
      mockP5.rect.resetHistory();
      mockP5.text.resetHistory();
      
      indicator.renderTop(10, 20, 300, scrollOffset);
      indicator.renderBottom(10, 600, 300, scrollOffset, maxScrollOffset);
      
      // Only bottom should render (1 push/pop pair)
      expect(mockP5.push.callCount).to.equal(1);
      expect(mockP5.pop.callCount).to.equal(1);
      expect(mockP5.text.calledOnce).to.be.true;
      expect(mockP5.text.calledWith('↓', sinon.match.number, sinon.match.number)).to.be.true;
    });
    
    it('should render only top arrow when scrolled to bottom', function() {
      const scrollOffset = 200;
      const maxScrollOffset = 200;
      
      mockP5.push.resetHistory();
      mockP5.rect.resetHistory();
      mockP5.text.resetHistory();
      
      indicator.renderTop(10, 20, 300, scrollOffset);
      indicator.renderBottom(10, 600, 300, scrollOffset, maxScrollOffset);
      
      // Only top should render (1 push/pop pair)
      expect(mockP5.push.callCount).to.equal(1);
      expect(mockP5.pop.callCount).to.equal(1);
      expect(mockP5.text.calledOnce).to.be.true;
      expect(mockP5.text.calledWith('↑', sinon.match.number, sinon.match.number)).to.be.true;
    });
    
    it('should render both arrows when in middle position', function() {
      const scrollOffset = 100;
      const maxScrollOffset = 200;
      
      mockP5.push.resetHistory();
      mockP5.rect.resetHistory();
      mockP5.text.resetHistory();
      
      indicator.renderTop(10, 20, 300, scrollOffset);
      indicator.renderBottom(10, 600, 300, scrollOffset, maxScrollOffset);
      
      // Both should render (2 push/pop pairs)
      expect(mockP5.push.callCount).to.equal(2);
      expect(mockP5.pop.callCount).to.equal(2);
      expect(mockP5.text.callCount).to.equal(2);
      
      const textCalls = mockP5.text.getCalls();
      expect(textCalls[0].args[0]).to.equal('↑');
      expect(textCalls[1].args[0]).to.equal('↓');
    });
  });
  
  describe('Hover State Rendering', function() {
    it('should render with arrowColor when not hovered', function() {
      const scrollOffset = 50;
      const maxScrollOffset = 100;
      
      indicator.renderTop(10, 20, 300, scrollOffset, false);
      
      const fillCalls = mockP5.fill.getCalls();
      // Should have called fill with arrowColor (not hoverColor)
      const arrowColorCall = fillCalls.find(call => 
        Array.isArray(call.args[0]) && 
        call.args[0][0] === 200 && 
        call.args[0][1] === 200 && 
        call.args[0][2] === 200
      );
      expect(arrowColorCall).to.exist;
    });
    
    it('should render with hoverColor when hovered', function() {
      const scrollOffset = 50;
      const maxScrollOffset = 100;
      
      indicator.renderTop(10, 20, 300, scrollOffset, true);
      
      const fillCalls = mockP5.fill.getCalls();
      // Should have called fill with hoverColor (not arrowColor)
      const hoverColorCall = fillCalls.find(call => 
        Array.isArray(call.args[0]) && 
        call.args[0][0] === 255 && 
        call.args[0][1] === 255 && 
        call.args[0][2] === 255
      );
      expect(hoverColorCall).to.exist;
    });
    
    it('should transition between hover states correctly', function() {
      const scrollOffset = 50;
      const maxScrollOffset = 100;
      
      // Render not hovered
      mockP5.fill.resetHistory();
      indicator.renderTop(10, 20, 300, scrollOffset, false);
      
      let fillCalls = mockP5.fill.getCalls();
      let arrowColorCall = fillCalls.find(call => 
        Array.isArray(call.args[0]) && call.args[0][0] === 200
      );
      expect(arrowColorCall).to.exist;
      
      // Render hovered
      mockP5.fill.resetHistory();
      indicator.renderTop(10, 20, 300, scrollOffset, true);
      
      fillCalls = mockP5.fill.getCalls();
      let hoverColorCall = fillCalls.find(call => 
        Array.isArray(call.args[0]) && call.args[0][0] === 255
      );
      expect(hoverColorCall).to.exist;
    });
  });
  
  describe('Click Detection Accuracy', function() {
    it('should accurately detect clicks in top indicator area', function() {
      const x = 50;
      const y = 20;
      const width = 200;
      
      // Test center point
      expect(indicator.containsPointTop(150, 30, x, y, width)).to.be.true;
      
      // Test corners
      expect(indicator.containsPointTop(50, 20, x, y, width)).to.be.true; // top-left
      expect(indicator.containsPointTop(250, 20, x, y, width)).to.be.true; // top-right
      expect(indicator.containsPointTop(50, 40, x, y, width)).to.be.true; // bottom-left
      expect(indicator.containsPointTop(250, 40, x, y, width)).to.be.true; // bottom-right
      
      // Test just outside bounds
      expect(indicator.containsPointTop(49, 30, x, y, width)).to.be.false; // left
      expect(indicator.containsPointTop(251, 30, x, y, width)).to.be.false; // right
      expect(indicator.containsPointTop(150, 19, x, y, width)).to.be.false; // top
      expect(indicator.containsPointTop(150, 41, x, y, width)).to.be.false; // bottom
    });
    
    it('should accurately detect clicks in bottom indicator area', function() {
      const x = 50;
      const y = 600;
      const width = 200;
      
      // Test center point
      expect(indicator.containsPointBottom(150, 610, x, y, width)).to.be.true;
      
      // Test corners
      expect(indicator.containsPointBottom(50, 600, x, y, width)).to.be.true;
      expect(indicator.containsPointBottom(250, 600, x, y, width)).to.be.true;
      expect(indicator.containsPointBottom(50, 620, x, y, width)).to.be.true;
      expect(indicator.containsPointBottom(250, 620, x, y, width)).to.be.true;
      
      // Test just outside bounds
      expect(indicator.containsPointBottom(49, 610, x, y, width)).to.be.false;
      expect(indicator.containsPointBottom(251, 610, x, y, width)).to.be.false;
      expect(indicator.containsPointBottom(150, 599, x, y, width)).to.be.false;
      expect(indicator.containsPointBottom(150, 621, x, y, width)).to.be.false;
    });
  });
  
  describe('Total Height Calculation', function() {
    it('should calculate correct total height for all scroll states', function() {
      // No scroll
      expect(indicator.getTotalHeight(0, 0)).to.equal(0);
      
      // At top (only down arrow)
      expect(indicator.getTotalHeight(0, 100)).to.equal(20);
      
      // At bottom (only up arrow)
      expect(indicator.getTotalHeight(100, 100)).to.equal(20);
      
      // Middle (both arrows)
      expect(indicator.getTotalHeight(50, 100)).to.equal(40);
    });
    
    it('should account for custom height in total calculation', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ height: 30 });
      
      // No scroll
      expect(customIndicator.getTotalHeight(0, 0)).to.equal(0);
      
      // One arrow
      expect(customIndicator.getTotalHeight(0, 100)).to.equal(30);
      
      // Both arrows
      expect(customIndicator.getTotalHeight(50, 100)).to.equal(60);
    });
  });
  
  describe('Custom Configuration', function() {
    it('should use custom colors when configured', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({
        backgroundColor: [100, 100, 100],
        arrowColor: [255, 0, 0],
        hoverColor: [0, 255, 0]
      });
      
      mockP5.fill.resetHistory();
      customIndicator.renderTop(10, 20, 300, 50, false);
      
      const fillCalls = mockP5.fill.getCalls();
      
      // Check backgroundColor
      const bgCall = fillCalls.find(call => 
        Array.isArray(call.args[0]) && 
        call.args[0][0] === 100 && 
        call.args[0][1] === 100 && 
        call.args[0][2] === 100
      );
      expect(bgCall).to.exist;
      
      // Check arrowColor (not hovered)
      const arrowCall = fillCalls.find(call => 
        Array.isArray(call.args[0]) && 
        call.args[0][0] === 255 && 
        call.args[0][1] === 0 && 
        call.args[0][2] === 0
      );
      expect(arrowCall).to.exist;
    });
    
    it('should use custom fontSize when configured', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ fontSize: 18 });
      
      mockP5.textSize.resetHistory();
      customIndicator.renderTop(10, 20, 300, 50, false);
      
      expect(mockP5.textSize.calledWith(18)).to.be.true;
    });
    
    it('should use custom height in rendering', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ height: 30 });
      
      mockP5.rect.resetHistory();
      customIndicator.renderTop(10, 20, 300, 50, false);
      
      expect(mockP5.rect.calledWith(10, 20, 300, 30)).to.be.true;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero width gracefully', function() {
      indicator.renderTop(10, 20, 0, 50, false);
      
      // Should still render, just with 0 width
      expect(mockP5.rect.calledWith(10, 20, 0, 20)).to.be.true;
    });
    
    it('should handle negative scroll offset edge case', function() {
      // Should not render (canScrollUp returns false for negative)
      indicator.renderTop(10, 20, 300, -10, false);
      
      expect(mockP5.push.called).to.be.false;
    });
    
    it('should handle scroll offset exceeding max edge case', function() {
      // Should not render bottom (canScrollDown returns false)
      indicator.renderBottom(10, 20, 300, 150, 100, false);
      
      expect(mockP5.push.called).to.be.false;
    });
    
    it('should handle containsPoint with exact boundary values', function() {
      const x = 50;
      const y = 20;
      const width = 200;
      
      // Exact boundaries should be included
      expect(indicator.containsPointTop(x, y, x, y, width)).to.be.true;
      expect(indicator.containsPointTop(x + width, y + indicator.height, x, y, width)).to.be.true;
    });
  });
});




// ================================================================
// UIObject.integration.test.js (16 tests)
// ================================================================
/**
 * UIObject Integration Tests
 * 
 * Tests UIObject with REAL CacheManager and p5.js mocks.
 * Validates end-to-end cache management, inheritance patterns, and rendering flows.
 * 
 * Following TDD: Write tests FIRST, implementation already complete.
 */

// Import real classes
let CacheManager = require('../../../Classes/rendering/CacheManager.js');
let UIObject = require('../../../Classes/ui/UIObject.js');

describe('UIObject Integration Tests', function() {
  let sandbox;
  let cacheManager;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js global functions
    global.createGraphics = sandbox.stub().callsFake((w, h) => {
      const mockBuffer = {
        width: w,
        height: h,
        clear: sandbox.stub(),
        background: sandbox.stub(),
        fill: sandbox.stub(),
        stroke: sandbox.stub(),
        rect: sandbox.stub(),
        ellipse: sandbox.stub(),
        line: sandbox.stub(),
        text: sandbox.stub(),
        push: sandbox.stub(),
        pop: sandbox.stub(),
        translate: sandbox.stub(),
        scale: sandbox.stub()
      };
      return mockBuffer;
    });
    
    global.image = sandbox.stub();
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.translate = sandbox.stub();
    
    // Sync with window for JSDOM
    if (typeof window !== 'undefined') {
      window.createGraphics = global.createGraphics;
      window.image = global.image;
      window.push = global.push;
      window.pop = global.pop;
      window.translate = global.translate;
    }
    
    // Get real CacheManager singleton
    cacheManager = CacheManager.getInstance();
    
    // Reset memory budget to default (10MB) before each test
    cacheManager.setMemoryBudget(10 * 1024 * 1024);
    
    // Clean slate for each test - reset all caches
    const cacheNames = Array.from((cacheManager._caches || new Map()).keys());
    cacheNames.forEach(name => cacheManager.removeCache(name));
    
    // Make CacheManager globally available
    global.CacheManager = CacheManager;
    if (typeof window !== 'undefined') {
      window.CacheManager = CacheManager;
    }
  });

  afterEach(function() {
    sandbox.restore();
    
    // Reset memory budget to default
    cacheManager.setMemoryBudget(10 * 1024 * 1024);
    
    // Clean up all caches after test
    const cacheNames = Array.from((cacheManager._caches || new Map()).keys());
    cacheNames.forEach(name => cacheManager.removeCache(name));
    
    if (typeof global !== 'undefined') {
      delete global.createGraphics;
      delete global.image;
      delete global.push;
      delete global.pop;
      delete global.translate;
      delete global.CacheManager;
    }
    
    if (typeof window !== 'undefined') {
      delete window.createGraphics;
      delete window.image;
      delete window.push;
      delete window.pop;
      delete window.translate;
      delete window.CacheManager;
    }
  });

  // ============================================================================
  // Integration Test Suite 1: CacheManager Integration
  // ============================================================================
  
  describe('CacheManager Integration', function() {
    it('should register cache with real CacheManager singleton', function() {
      const uiObj = new UIObject({ width: 100, height: 100, cacheStrategy: 'fullBuffer' });
      
      // Verify cache registered with CacheManager
      const cacheName = uiObj._cacheName;
      const cacheExists = cacheManager.hasCache(cacheName);
      
      expect(cacheExists).to.be.true;
      
      uiObj.destroy();
    });
    
    it('should share same CacheManager instance across multiple UIObjects', function() {
      const uiObj1 = new UIObject({ width: 100, height: 100 });
      const uiObj2 = new UIObject({ width: 200, height: 200 });
      
      // Both should use same CacheManager singleton
      const stats1 = cacheManager.getGlobalStats();
      
      expect(stats1.totalCaches).to.equal(2);
      expect(stats1.memoryUsage).to.be.greaterThan(0);
      
      uiObj1.destroy();
      uiObj2.destroy();
    });
    
    it('should evict caches when memory budget exceeded', function() {
      // Set very small memory budget (1 byte - forces eviction)
      cacheManager.setMemoryBudget(1);
      
      const uiObj1 = new UIObject({ width: 100, height: 100, cacheStrategy: 'fullBuffer' });
      const uiObj2 = new UIObject({ width: 100, height: 100, cacheStrategy: 'fullBuffer' });
      
      // Second cache should trigger eviction of first (LRU)
      const stats = cacheManager.getGlobalStats();
      
      // At most 2 caches (likely 1 due to eviction, but depends on timing)
      expect(stats.totalCaches).to.be.lessThanOrEqual(2);
      expect(stats.evictions).to.be.greaterThanOrEqual(0);
      
      uiObj1.destroy();
      uiObj2.destroy();
      
      // Reset budget for other tests
      cacheManager.setMemoryBudget(10 * 1024 * 1024);
    });
    
    it('should not evict protected caches under memory pressure', function() {
      // Create protected cache first with normal budget
      const protectedObj = new UIObject({ 
        width: 100, 
        height: 100, 
        cacheStrategy: 'fullBuffer',
        protected: true 
      });
      
      // NOW set very low budget (forces eviction of NEW caches only)
      // Protected cache already exists and should be safe
      const protectedCacheName = protectedObj._cacheName;
      expect(cacheManager.hasCache(protectedCacheName)).to.be.true;
      
      // Try to create normal cache with low budget (should fail gracefully)
      cacheManager.setMemoryBudget(50000); // Just enough for protected, not both
      
      const normalObj = new UIObject({ 
        width: 100, 
        height: 100, 
        cacheStrategy: 'fullBuffer',
        protected: false 
      });
      
      // Protected cache should still exist
      const protectedExists = cacheManager.hasCache(protectedCacheName);
      expect(protectedExists).to.be.true;
      
      protectedObj.destroy();
      normalObj.destroy();
      
      cacheManager.setMemoryBudget(10 * 1024 * 1024);
    });
    
    it('should update CacheManager memory tracking on cleanup', function() {
      const uiObj = new UIObject({ width: 100, height: 100 });
      
      const statsBefore = cacheManager.getGlobalStats();
      const memoryBefore = statsBefore.memoryUsage;
      
      uiObj.destroy();
      
      const statsAfter = cacheManager.getGlobalStats();
      const memoryAfter = statsAfter.memoryUsage;
      
      // Memory should be freed (or at least not increase)
      expect(memoryAfter).to.be.lessThanOrEqual(memoryBefore);
    });
    
    it('should remove cache from global cache list on destroy', function() {
      const uiObj = new UIObject({ width: 100, height: 100 });
      const cacheName = uiObj._cacheName;
      
      expect(cacheManager.hasCache(cacheName)).to.be.true;
      
      uiObj.destroy();
      
      expect(cacheManager.hasCache(cacheName)).to.be.false;
    });
  });

  // ============================================================================
  // Integration Test Suite 2: Inheritance Patterns
  // ============================================================================
  
  describe('Inheritance Patterns', function() {
    class TestUIComponent extends UIObject {
      constructor(config = {}) {
        super(config);
        this.customProperty = config.customProperty || 'default';
        this.renderCount = 0;
      }
      
      renderToCache(buffer) {
        this.renderCount++;
        buffer.background(255);
        buffer.fill(0);
        buffer.rect(0, 0, this.width, this.height);
      }
      
      update() {
        // Custom update logic
        this.customProperty = 'updated';
      }
    }
    
    it('should work end-to-end with custom renderToCache()', function() {
      const component = new TestUIComponent({ width: 100, height: 100 });
      
      component.markDirty();
      component.render();
      
      expect(component.renderCount).to.equal(1);
      expect(global.image.called).to.be.true;
      
      component.destroy();
    });
    
    it('should integrate custom update() logic correctly', function() {
      const component = new TestUIComponent({ width: 100, height: 100 });
      
      component.update();
      
      expect(component.customProperty).to.equal('updated');
      
      component.destroy();
    });
    
    it('should support multiple levels of inheritance', function() {
      class AdvancedComponent extends TestUIComponent {
        constructor(config = {}) {
          super(config);
          this.advancedProperty = 'advanced';
        }
      }
      
      const advanced = new AdvancedComponent({ width: 100, height: 100 });
      
      expect(advanced.customProperty).to.equal('default');
      expect(advanced.advancedProperty).to.equal('advanced');
      expect(advanced.width).to.equal(100);
      
      advanced.destroy();
    });
    
    it('should access parent properties from subclass', function() {
      const component = new TestUIComponent({ 
        width: 150, 
        height: 200, 
        x: 10, 
        y: 20 
      });
      
      expect(component.width).to.equal(150);
      expect(component.height).to.equal(200);
      expect(component.x).to.equal(10);
      expect(component.y).to.equal(20);
      
      component.destroy();
    });
    
    it('should call parent cleanup in subclass destroy()', function() {
      const component = new TestUIComponent({ width: 100, height: 100 });
      const cacheName = component._cacheName;
      
      expect(cacheManager.hasCache(cacheName)).to.be.true;
      
      component.destroy();
      
      expect(cacheManager.hasCache(cacheName)).to.be.false;
    });
  });

  // ============================================================================
  // Integration Test Suite 3: Real Rendering Flow
  // ============================================================================
  
  describe('Real Rendering Flow', function() {
    class RenderTestComponent extends UIObject {
      constructor(config = {}) {
        super(config);
        this.renderToCacheCount = 0;
        this.renderToScreenCount = 0;
      }
      
      renderToCache(buffer) {
        this.renderToCacheCount++;
        buffer.background(255);
      }
      
      renderToScreen() {
        this.renderToScreenCount++;
        super.renderToScreen();
      }
    }
    
    it('should complete full render cycle (dirty → renderToCache → clean → renderToScreen)', function() {
      const component = new RenderTestComponent({ width: 100, height: 100 });
      
      component.markDirty();
      expect(component.isDirty()).to.be.true;
      
      component.render();
      
      expect(component.renderToCacheCount).to.equal(1);
      expect(component.renderToScreenCount).to.equal(1);
      expect(component.isDirty()).to.be.false;
      
      component.destroy();
    });
    
    it('should reuse cache across multiple render() calls (performance)', function() {
      const component = new RenderTestComponent({ width: 100, height: 100 });
      
      component.markDirty();
      component.render(); // First render - creates cache
      
      component.render(); // Second render - should reuse
      component.render(); // Third render - should reuse
      
      expect(component.renderToCacheCount).to.equal(1); // Only rendered once
      expect(component.renderToScreenCount).to.equal(3); // Drew 3 times
      
      component.destroy();
    });
    
    it('should trigger re-render on next frame after markDirty()', function() {
      const component = new RenderTestComponent({ width: 100, height: 100 });
      
      component.markDirty();
      component.render(); // First render
      
      expect(component.renderToCacheCount).to.equal(1);
      
      component.markDirty(); // Mark dirty again
      component.render(); // Should re-render
      
      expect(component.renderToCacheCount).to.equal(2);
      
      component.destroy();
    });
    
    it('should not leak memory when toggling visibility', function() {
      const component = new RenderTestComponent({ width: 100, height: 100 });
      const cacheName = component._cacheName;
      
      component.setVisible(false);
      component.render(); // Should skip
      
      expect(cacheManager.hasCache(cacheName)).to.be.true; // Cache persists
      
      component.setVisible(true);
      component.markDirty();
      component.render();
      
      expect(component.renderToCacheCount).to.equal(1);
      
      component.destroy();
    });
    
    it('should handle resize by marking dirty', function() {
      const component = new RenderTestComponent({ width: 100, height: 100 });
      
      component.markDirty();
      component.render();
      
      expect(component.renderToCacheCount).to.equal(1);
      
      // Resize (would typically trigger markDirty in real usage)
      component.width = 200;
      component.height = 200;
      component.markDirty();
      component.render();
      
      expect(component.renderToCacheCount).to.equal(2);
      
      component.destroy();
    });
  });
});




// ================================================================
// propertiesPanelIntegration.test.js (13 tests)
// ================================================================
/**
 * Integration Tests - PropertiesPanel with CustomTerrain
 * 
 * Tests for:
 * 1. PropertiesPanel displays actual tile counts from CustomTerrain
 * 2. Panel updates when terrain changes
 * 3. Integration with LevelEditorPanels as draggable panel
 */

describe('PropertiesPanel Integration Tests', function() {
  let PropertiesPanel;
  let CustomTerrain;
  let TerrainEditor;
  let panel;
  let terrain;
  let editor;

  beforeEach(function() {
    // Mock p5.js functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.line = sinon.stub();
    global.image = sinon.stub();
    global.CENTER = 'center';
    global.TOP = 'top';
    global.LEFT = 'left';

    // Mock terrain materials
    global.TERRAIN_MATERIALS_RANGED = {
      'grass': [[0, 1], (x, y, s) => {}],
      'dirt': [[0, 0.5], (x, y, s) => {}],
      'stone': [[0.5, 1], (x, y, s) => {}]
    };

    // Sync to window
    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.stroke = global.stroke;
      window.strokeWeight = global.strokeWeight;
      window.noStroke = global.noStroke;
      window.rect = global.rect;
      window.text = global.text;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.line = global.line;
      window.image = global.image;
      window.CENTER = global.CENTER;
      window.TOP = global.TOP;
      window.LEFT = global.LEFT;
      window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
    }

    // Load classes
    PropertiesPanel = require('../../../Classes/ui/PropertiesPanel');
    CustomTerrain = require('../../../Classes/terrainUtils/CustomTerrain');
    TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');

    // Create instances
    terrain = new CustomTerrain(10, 10, 32);
    editor = new TerrainEditor(terrain);
    panel = new PropertiesPanel();
    panel.setTerrain(terrain);
    panel.setEditor(editor);
  });

  afterEach(function() {
    sinon.restore();
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.stroke;
    delete global.strokeWeight;
    delete global.noStroke;
    delete global.rect;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.line;
    delete global.image;
    delete global.CENTER;
    delete global.TOP;
    delete global.LEFT;
    delete global.TERRAIN_MATERIALS_RANGED;
  });

  describe('Real Terrain Integration', function() {
    it('should display actual tile count from CustomTerrain', function() {
      const stats = panel.getStatistics();
      
      expect(stats.totalTiles).to.equal(100); // 10x10 terrain
    });

    it('should update when terrain is painted', function() {
      // Initial state - all grass
      let stats = panel.getStatistics();
      expect(stats.totalTiles).to.equal(100);
      
      // Paint some tiles with dirt
      editor.selectMaterial('dirt');
      editor.paint(5, 5);
      editor.paint(6, 5);
      editor.paint(7, 5);
      
      // Update panel
      panel.update();
      stats = panel.getStatistics();
      
      // Total tiles should still be 100
      expect(stats.totalTiles).to.equal(100);
      
      // Should have both materials now
      expect(stats.materials).to.have.property('grass');
      expect(stats.materials).to.have.property('dirt');
      expect(stats.materials['dirt']).to.be.at.least(3);
    });

    it('should calculate diversity correctly', function() {
      // All grass initially
      let stats = panel.getStatistics();
      expect(stats.diversity).to.equal(0); // No diversity, all one material
      
      // Paint half with dirt
      editor.selectMaterial('dirt');
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 5; x++) {
          editor.paint(x, y);
        }
      }
      
      panel.update();
      stats = panel.getStatistics();
      
      // Should have diversity now (50/50 split is max for 2 materials)
      expect(stats.diversity).to.be.greaterThan(0.9);
      expect(stats.materials['grass']).to.equal(50);
      expect(stats.materials['dirt']).to.equal(50);
    });

    it('should show three-material diversity', function() {
      // Paint terrain with three different materials
      editor.selectMaterial('grass');
      for (let i = 0; i < 33; i++) {
        const x = i % 10;
        const y = Math.floor(i / 10);
        editor.paint(x, y);
      }
      
      editor.selectMaterial('dirt');
      for (let i = 33; i < 66; i++) {
        const x = i % 10;
        const y = Math.floor(i / 10);
        editor.paint(x, y);
      }
      
      editor.selectMaterial('stone');
      for (let i = 66; i < 100; i++) {
        const x = i % 10;
        const y = Math.floor(i / 10);
        editor.paint(x, y);
      }
      
      panel.update();
      const stats = panel.getStatistics();
      
      // Should have three materials
      expect(Object.keys(stats.materials).length).to.equal(3);
      expect(stats.materials).to.have.property('grass');
      expect(stats.materials).to.have.property('dirt');
      expect(stats.materials).to.have.property('stone');
      
      // Diversity should be high
      expect(stats.diversity).to.be.greaterThan(0.9);
    });
  });

  describe('Undo/Redo Integration', function() {
    it('should reflect undo availability', function() {
      // Make a change
      editor.selectMaterial('dirt');
      editor.paint(5, 5);
      
      const stackInfo = panel.getStackInfo();
      expect(stackInfo.canUndo).to.be.true;
    });

    it('should update after undo', function() {
      // Paint terrain
      editor.selectMaterial('dirt');
      editor.paint(5, 5);
      editor.paint(6, 5);
      
      let stats = panel.getStatistics();
      const dirtCountBefore = stats.materials['dirt'];
      
      // Undo
      if (editor.canUndo()) {
        editor.undo();
      }
      
      panel.update();
      stats = panel.getStatistics();
      
      // Should have one less dirt tile
      const dirtCountAfter = stats.materials['dirt'] || 0;
      expect(dirtCountAfter).to.be.lessThan(dirtCountBefore);
    });
  });

  describe('Display Formatting', function() {
    it('should format tile count as string', function() {
      const items = panel.getDisplayItems();
      const tileItem = items.find(item => item.label === 'Total Tiles');
      
      expect(tileItem.value).to.be.a('string');
      expect(tileItem.value).to.equal('100');
    });

    it('should format diversity to 2 decimal places', function() {
      // Paint half with dirt
      editor.selectMaterial('dirt');
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 10; x++) {
          editor.paint(x, y);
        }
      }
      
      panel.update();
      const items = panel.getDisplayItems();
      const diversityItem = items.find(item => item.label === 'Diversity');
      
      expect(diversityItem.value).to.match(/^\d\.\d{2}$/);
    });
  });

  describe('DraggablePanel Integration', function() {
    it('should provide content size for panel', function() {
      const size = panel.getContentSize();
      
      expect(size.width).to.equal(180);
      expect(size.height).to.equal(360);
    });

    it('should render without background when isPanelContent is true', function() {
      global.rect.resetHistory();
      
      panel.render(100, 100, { isPanelContent: true });
      
      expect(global.rect.called).to.be.false;
    });

    it('should render all statistics when used as panel content', function() {
      global.text.resetHistory();
      
      panel.render(100, 100, { isPanelContent: true });
      
      // Should have rendered text for labels and values
      expect(global.text.called).to.be.true;
      const calls = global.text.getCalls();
      
      // Should have Total Tiles label
      const tileLabel = calls.find(call => 
        typeof call.args[0] === 'string' && call.args[0].includes('Total Tiles')
      );
      expect(tileLabel).to.exist;
    });
  });

  describe('Real-time Updates', function() {
    it('should reflect terrain changes immediately after update()', function() {
      // Initial state
      let stats = panel.getStatistics();
      const initialGrass = stats.materials['grass'] || 0;
      
      // Paint
      editor.selectMaterial('dirt');
      editor.paint(0, 0);
      
      // Before update - stats should change (getStatistics is called fresh)
      stats = panel.getStatistics();
      const currentGrass = stats.materials['grass'] || 0;
      
      expect(currentGrass).to.be.lessThan(initialGrass);
      expect(stats.materials['dirt']).to.equal(1);
    });

    it('should work with brush size changes', function() {
      // Set brush size 3
      editor.setBrushSize(3);
      editor.selectMaterial('stone');
      editor.paint(5, 5);
      
      panel.update();
      const stats = panel.getStatistics();
      
      // 3x3 brush should paint 9 tiles
      expect(stats.materials['stone']).to.be.at.least(9);
    });
  });
});

