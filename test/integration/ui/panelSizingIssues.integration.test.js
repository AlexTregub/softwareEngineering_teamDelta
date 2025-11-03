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

const { expect } = require('chai');
const sinon = require('sinon');

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
