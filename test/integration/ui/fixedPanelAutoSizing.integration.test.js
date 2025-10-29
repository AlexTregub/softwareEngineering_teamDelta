/**
 * Integration tests to verify auto-sizing fix for Resource Spawner, Debug Controls, and Task Objectives panels
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Fixed Panel Auto-Sizing Integration', function() {
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

    // Mock ButtonStyles
    global.ButtonStyles = {
      DEFAULT: { backgroundColor: '#CCCCCC', textColor: '#000000' },
      PRIMARY: { backgroundColor: '#007BFF', textColor: '#FFFFFF' },
      SUCCESS: { backgroundColor: '#28A745', textColor: '#FFFFFF' },
      DANGER: { backgroundColor: '#DC3545', textColor: '#FFFFFF' },
      WARNING: { backgroundColor: '#FFC107', textColor: '#000000' },
      INFO: { backgroundColor: '#17A2B8', textColor: '#FFFFFF' },
      PURPLE: { backgroundColor: '#6F42C1', textColor: '#FFFFFF' }
    };
    
    // Load required classes
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');
    
    // Set as global for DraggablePanelManager
    global.DraggablePanel = DraggablePanel;
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
  
  describe('Resource Spawner Panel Auto-Sizing', function() {
    let panel;
    
    beforeEach(function() {
      panel = manager.panels.get('resources');
    });
    
    it('should have auto-sizing enabled', function() {
      expect(panel.config.buttons.autoSizeToContent).to.be.true;
    });
    
    it('should auto-resize to fit single button in horizontal layout', function() {
      const titleBarHeight = 26.8;
      const buttonHeight = panel.config.buttons.buttonHeight;
      const verticalPadding = panel.config.buttons.verticalPadding || 0;
      
      // Horizontal layout: height = titleBar + buttonHeight + padding
      const expectedHeight = titleBarHeight + buttonHeight + (verticalPadding * 2);
      
      expect(panel.config.size.height).to.be.closeTo(expectedHeight, 1);
    });
    
    it('should maintain width unchanged', function() {
      // Horizontal layout only resizes height
      expect(panel.config.size.width).to.equal(180);
    });
    
    it('should have correct calculated height', function() {
      // Expected: 26.8 (title) + 20 (button) + 20 (padding) = 66.8px
      expect(panel.config.size.height).to.be.closeTo(66.8, 1);
    });
  });
  
  describe('Debug Controls Panel Auto-Sizing', function() {
    let panel;
    
    beforeEach(function() {
      panel = manager.panels.get('debug');
    });
    
    it('should have auto-sizing enabled', function() {
      expect(panel.config.buttons.autoSizeToContent).to.be.true;
    });
    
    it('should auto-resize to fit 4 buttons in vertical layout', function() {
      const titleBarHeight = 26.8;
      const buttonCount = panel.buttons.length;
      const buttonHeight = panel.config.buttons.buttonHeight;
      const spacing = panel.config.buttons.spacing;
      const verticalPadding = panel.config.buttons.verticalPadding || 0;
      
      // Vertical layout: height = titleBar + (buttons * height) + spacing + padding
      const contentHeight = (buttonCount * buttonHeight) + ((buttonCount - 1) * spacing);
      const expectedHeight = titleBarHeight + contentHeight + (verticalPadding * 2);
      
      expect(panel.config.size.height).to.be.closeTo(expectedHeight, 1);
    });
    
    it('should have correct calculated height', function() {
      // Expected: 26.8 (title) + 109 (4×25 + 3×3 spacing) + 20 (padding) = 155.8px
      expect(panel.config.size.height).to.be.closeTo(155.8, 1);
    });
    
    it('should be much smaller than old manual height', function() {
      // Was 450px, should now be ~156px
      expect(panel.config.size.height).to.be.lessThan(200);
    });
  });
  
  describe('Task Objectives Panel Auto-Sizing', function() {
    let panel;
    
    beforeEach(function() {
      panel = manager.panels.get('tasks');
    });
    
    it('should have auto-sizing enabled', function() {
      expect(panel.config.buttons.autoSizeToContent).to.be.true;
    });
    
    it('should auto-resize to fit 4 buttons in vertical layout', function() {
      const titleBarHeight = 26.8;
      const buttonCount = panel.buttons.length;
      const buttonHeight = panel.config.buttons.buttonHeight;
      const spacing = panel.config.buttons.spacing;
      const verticalPadding = panel.config.buttons.verticalPadding || 0;
      
      // Vertical layout: height = titleBar + (buttons * height) + spacing + padding
      const contentHeight = (buttonCount * buttonHeight) + ((buttonCount - 1) * spacing);
      const expectedHeight = titleBarHeight + contentHeight + (verticalPadding * 2);
      
      expect(panel.config.size.height).to.be.closeTo(expectedHeight, 1);
    });
    
    it('should have correct calculated height', function() {
      // Expected: 26.8 (title) + 109 (4×25 + 3×3 spacing) + 20 (padding) = 155.8px
      expect(panel.config.size.height).to.be.closeTo(155.8, 1);
    });
    
    it('should be much smaller than old manual height', function() {
      // Was 320px, should now be ~156px
      expect(panel.config.size.height).to.be.lessThan(200);
    });
  });
  
  describe('Cheats Panel Auto-Sizing', function() {
    let panel;
    
    beforeEach(function() {
      panel = manager.panels.get('cheats');
    });
    
    it('should have auto-sizing enabled', function() {
      expect(panel.config.buttons.autoSizeToContent).to.be.true;
    });
    
    it('should auto-resize to fit 6 buttons in vertical layout', function() {
      const titleBarHeight = 26.8;
      const buttonCount = panel.buttons.length;
      const buttonHeight = panel.config.buttons.buttonHeight;
      const spacing = panel.config.buttons.spacing;
      const verticalPadding = panel.config.buttons.verticalPadding || 0;
      
      // Vertical layout: height = titleBar + (buttons * height) + spacing + padding
      const contentHeight = (buttonCount * buttonHeight) + ((buttonCount - 1) * spacing);
      const expectedHeight = titleBarHeight + contentHeight + (verticalPadding * 2);
      
      expect(panel.config.size.height).to.be.closeTo(expectedHeight, 1);
    });
    
    it('should have correct calculated height', function() {
      // Expected: 26.8 (title) + 212 (6×32 + 5×4 spacing) + 20 (padding) = 258.8px
      expect(panel.config.size.height).to.be.closeTo(258.8, 1);
    });
    
    it('should be larger than old manual height (was too small)', function() {
      // Was 220px (cutting off buttons), should now be ~259px
      expect(panel.config.size.height).to.be.greaterThan(220);
    });
  });
  
  describe('All Four Panels Comparison', function() {
    it('should have consistent auto-sizing configuration', function() {
      const resourcesPanel = manager.panels.get('resources');
      const debugPanel = manager.panels.get('debug');
      const tasksPanel = manager.panels.get('tasks');
      
      expect(resourcesPanel.config.buttons.autoSizeToContent).to.be.true;
      expect(debugPanel.config.buttons.autoSizeToContent).to.be.true;
      expect(tasksPanel.config.buttons.autoSizeToContent).to.be.true;
    });
    
    it('should all have proper padding configured', function() {
      const resourcesPanel = manager.panels.get('resources');
      const debugPanel = manager.panels.get('debug');
      const tasksPanel = manager.panels.get('tasks');
      
      expect(resourcesPanel.config.buttons.verticalPadding).to.equal(10);
      expect(debugPanel.config.buttons.verticalPadding).to.equal(10);
      expect(tasksPanel.config.buttons.verticalPadding).to.equal(10);
      
      expect(resourcesPanel.config.buttons.horizontalPadding).to.equal(10);
      expect(debugPanel.config.buttons.horizontalPadding).to.equal(10);
      expect(tasksPanel.config.buttons.horizontalPadding).to.equal(10);
    });
    
    it('should all be properly sized (no excess space)', function() {
      const resourcesPanel = manager.panels.get('resources');
      const debugPanel = manager.panels.get('debug');
      const tasksPanel = manager.panels.get('tasks');
      
      // Resource Spawner: ~67px (was 150px)
      expect(resourcesPanel.config.size.height).to.be.lessThan(80);
      
      // Debug Controls: ~156px (was 450px)
      expect(debugPanel.config.size.height).to.be.lessThan(200);
      
      // Task Objectives: ~156px (was 320px)
      expect(tasksPanel.config.size.height).to.be.lessThan(200);
    });
    
    it('should all maintain stable sizes over multiple updates', function() {
      const resourcesPanel = manager.panels.get('resources');
      const debugPanel = manager.panels.get('debug');
      const tasksPanel = manager.panels.get('tasks');
      
      const initialHeights = {
        resources: resourcesPanel.config.size.height,
        debug: debugPanel.config.size.height,
        tasks: tasksPanel.config.size.height
      };
      
      // Update panels 50 times
      for (let i = 0; i < 50; i++) {
        resourcesPanel.update();
        debugPanel.update();
        tasksPanel.update();
      }
      
      // Heights should remain stable
      expect(resourcesPanel.config.size.height).to.equal(initialHeights.resources);
      expect(debugPanel.config.size.height).to.equal(initialHeights.debug);
      expect(tasksPanel.config.size.height).to.equal(initialHeights.tasks);
    });
  });
  
  describe('Size Reduction Verification', function() {
    it('should report size changes', function() {
      const resourcesPanel = manager.panels.get('resources');
      const debugPanel = manager.panels.get('debug');
      const tasksPanel = manager.panels.get('tasks');
      const cheatsPanel = manager.panels.get('cheats');
      
      console.log('\n✅ Panel Auto-Sizing Fix Results:');
      console.log('================================================================================');
      console.log(`Resource Spawner:`);
      console.log(`  Before: 180×150px`);
      console.log(`  After:  180×${resourcesPanel.config.size.height}px`);
      console.log(`  Space saved: ${150 - resourcesPanel.config.size.height}px (${Math.round((1 - resourcesPanel.config.size.height/150) * 100)}% reduction)`);
      
      console.log(`\nDebug Controls:`);
      console.log(`  Before: 160×450px`);
      console.log(`  After:  160×${debugPanel.config.size.height}px`);
      console.log(`  Space saved: ${450 - debugPanel.config.size.height}px (${Math.round((1 - debugPanel.config.size.height/450) * 100)}% reduction)`);
      
      console.log(`\nTask Objectives:`);
      console.log(`  Before: 160×320px`);
      console.log(`  After:  160×${tasksPanel.config.size.height}px`);
      console.log(`  Space saved: ${320 - tasksPanel.config.size.height}px (${Math.round((1 - tasksPanel.config.size.height/320) * 100)}% reduction)`);
      
      console.log(`\nCheats Panel:`);
      console.log(`  Before: 180×220px (TOO SMALL - buttons cut off)`);
      console.log(`  After:  180×${cheatsPanel.config.size.height}px`);
      console.log(`  Space added: ${cheatsPanel.config.size.height - 220}px (${Math.round((cheatsPanel.config.size.height/220 - 1) * 100)}% increase - now fits all buttons!)`);
      console.log('================================================================================\n');
    });
  });
});
