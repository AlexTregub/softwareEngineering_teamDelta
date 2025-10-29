/**
 * Unit Tests for DraggablePanelManager.getOrCreatePanel()
 * 
 * Following TDD: Write tests FIRST, then implement.
 * 
 * Test the getOrCreatePanel() helper method which:
 * - Returns existing panel if it exists
 * - Creates new panel if it doesn't exist
 * - Updates existing panel config if updateIfExists is true
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('DraggablePanelManager.getOrCreatePanel()', function() {
  let dom;
  let window;
  let document;
  let sandbox;
  let DraggablePanelManager;
  let DraggablePanel;
  let manager;

  beforeEach(function() {
    // Create JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    window = dom.window;
    document = window.document;
    
    sandbox = sinon.createSandbox();

    // Set up globals
    global.window = window;
    global.document = document;
    window.innerWidth = 1920;
    window.innerHeight = 1080;
    
    // Mock p5.js functions
    const mockP5 = {
      createVector: (x, y) => ({ x, y }),
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      noStroke: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub()
    };
    
    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
      window[key] = mockP5[key];
    });

    // Load classes
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');
    
    global.DraggablePanel = DraggablePanel;
    window.DraggablePanel = DraggablePanel;
    
    // Mock ButtonStyles
    global.ButtonStyles = {
      PRIMARY: 'primary',
      SUCCESS: 'success',
      DANGER: 'danger'
    };
    window.ButtonStyles = global.ButtonStyles;
    
    // Mock Button class
    global.Button = class MockButton {
      constructor(config) {
        this.config = config;
        this.state = { visible: true };
        this.x = config.x || 0;
        this.y = config.y || 0;
      }
      setPosition(x, y) {
        this.x = x;
        this.y = y;
      }
      update() {}
      render() {}
    };
    window.Button = global.Button;
    
    // Mock devConsoleEnabled
    global.devConsoleEnabled = false;
    window.devConsoleEnabled = false;
    
    // Mock localStorage
    global.localStorage = {
      getItem: sandbox.stub().returns(null),
      setItem: sandbox.stub(),
      removeItem: sandbox.stub()
    };
    window.localStorage = global.localStorage;

    // Create manager instance
    manager = new DraggablePanelManager();
    manager.isInitialized = true; // Skip full initialization to avoid dependencies
  });

  afterEach(function() {
    sandbox.restore();
    delete global.window;
    delete global.document;
    delete global.DraggablePanel;
    delete global.ButtonStyles;
    delete global.Button;
    delete global.devConsoleEnabled;
    delete global.localStorage;
  });

  describe('Basic Functionality', function() {
    it('should return existing panel if it exists', function() {
      const config = {
        id: 'test-panel',
        title: 'Test Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
      };
      
      // Create panel first
      const originalPanel = manager.addPanel(config);
      
      // getOrCreatePanel should return same panel
      const retrievedPanel = manager.getOrCreatePanel('test-panel', config);
      
      expect(retrievedPanel).to.equal(originalPanel);
      expect(manager.getPanelCount()).to.equal(1); // Only one panel
    });

    it('should create new panel if it does not exist', function() {
      const config = {
        id: 'new-panel',
        title: 'New Panel',
        position: { x: 200, y: 200 },
        size: { width: 300, height: 200 }
      };
      
      expect(manager.getPanelCount()).to.equal(0);
      
      const panel = manager.getOrCreatePanel('new-panel', config);
      
      expect(panel).to.exist;
      expect(panel.config.id).to.equal('new-panel');
      expect(panel.config.title).to.equal('New Panel');
      expect(manager.getPanelCount()).to.equal(1);
    });

    it('should use panelId from first argument', function() {
      const config = {
        id: 'config-id', // This should be ignored
        title: 'Test',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 }
      };
      
      const panel = manager.getOrCreatePanel('actual-id', config);
      
      expect(panel.config.id).to.equal('actual-id');
      expect(manager.getPanel('actual-id')).to.equal(panel);
    });
  });

  describe('Config Update Behavior', function() {
    it('should NOT update existing panel config by default', function() {
      const originalConfig = {
        id: 'update-test',
        title: 'Original Title',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
      };
      
      manager.addPanel(originalConfig);
      
      const newConfig = {
        id: 'update-test',
        title: 'New Title',
        position: { x: 200, y: 200 },
        size: { width: 300, height: 250 }
      };
      
      const panel = manager.getOrCreatePanel('update-test', newConfig);
      
      // Should keep original config
      expect(panel.config.title).to.equal('Original Title');
      expect(panel.config.position.x).to.equal(100);
    });

    it('should update existing panel config when updateIfExists is true', function() {
      const originalConfig = {
        id: 'update-test',
        title: 'Original Title',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
      };
      
      manager.addPanel(originalConfig);
      
      const newConfig = {
        id: 'update-test',
        title: 'New Title',
        position: { x: 200, y: 200 },
        size: { width: 300, height: 250 }
      };
      
      const panel = manager.getOrCreatePanel('update-test', newConfig, true);
      
      // Should have updated config
      expect(panel.config.title).to.equal('New Title');
      expect(panel.config.position.x).to.equal(200);
      expect(panel.config.size.width).to.equal(300);
    });
  });

  describe('Edge Cases', function() {
    it('should handle missing config parameter', function() {
      // Should not throw, should return null or undefined
      const panel = manager.getOrCreatePanel('test-id');
      expect(panel).to.be.undefined;
    });

    it('should handle null panelId', function() {
      const config = {
        id: 'test',
        title: 'Test',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 }
      };
      
      // Should not throw
      const panel = manager.getOrCreatePanel(null, config);
      expect(panel).to.be.undefined;
    });

    it('should handle undefined panelId', function() {
      const config = {
        id: 'test',
        title: 'Test',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 }
      };
      
      // Should not throw
      const panel = manager.getOrCreatePanel(undefined, config);
      expect(panel).to.be.undefined;
    });
  });

  describe('Integration with addPanel and getPanel', function() {
    it('should work seamlessly with existing addPanel/getPanel methods', function() {
      const config1 = {
        id: 'panel-1',
        title: 'Panel 1',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
      };
      
      const config2 = {
        id: 'panel-2',
        title: 'Panel 2',
        position: { x: 300, y: 100 },
        size: { width: 200, height: 150 }
      };
      
      // Mix of addPanel and getOrCreatePanel
      manager.addPanel(config1);
      const panel2 = manager.getOrCreatePanel('panel-2', config2);
      const panel1Again = manager.getOrCreatePanel('panel-1', config1);
      
      expect(manager.getPanelCount()).to.equal(2);
      expect(manager.getPanel('panel-1')).to.equal(panel1Again);
      expect(manager.getPanel('panel-2')).to.equal(panel2);
    });

    it('should maintain panel references across multiple getOrCreatePanel calls', function() {
      const config = {
        id: 'stable-panel',
        title: 'Stable',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 }
      };
      
      const panel1 = manager.getOrCreatePanel('stable-panel', config);
      const panel2 = manager.getOrCreatePanel('stable-panel', config);
      const panel3 = manager.getOrCreatePanel('stable-panel', config);
      
      expect(panel1).to.equal(panel2);
      expect(panel2).to.equal(panel3);
      expect(manager.getPanelCount()).to.equal(1);
    });
  });

  describe('DialogueEvent Use Case', function() {
    it('should support dialogue panel reuse pattern', function() {
      // Simulate DialogueEvent behavior
      const dialogue1Config = {
        id: 'dialogue-display',
        title: 'Speaker 1',
        position: { x: 710, y: 880 },
        size: { width: 500, height: 160 },
        buttons: {
          layout: 'horizontal',
          items: [{ caption: 'Choice 1' }]
        }
      };
      
      const dialogue2Config = {
        id: 'dialogue-display',
        title: 'Speaker 2',
        position: { x: 710, y: 880 },
        size: { width: 500, height: 160 },
        buttons: {
          layout: 'horizontal',
          items: [{ caption: 'Choice A' }, { caption: 'Choice B' }]
        }
      };
      
      // First dialogue creates panel
      const panel1 = manager.getOrCreatePanel('dialogue-display', dialogue1Config);
      expect(panel1.config.title).to.equal('Speaker 1');
      
      // Second dialogue updates panel (with updateIfExists)
      const panel2 = manager.getOrCreatePanel('dialogue-display', dialogue2Config, true);
      expect(panel2).to.equal(panel1); // Same panel instance
      expect(panel2.config.title).to.equal('Speaker 2'); // Updated title
      expect(panel2.config.buttons.items).to.have.lengthOf(2); // Updated buttons
    });
  });
});
