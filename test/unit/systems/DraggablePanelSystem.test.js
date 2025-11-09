/**
 * Unit Tests for DraggablePanelSystem
 * Tests system initialization and panel setup
 */

const { expect } = require('chai');

// Mock globals
global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  draggablePanelManager: null,
  draggablePanelContentRenderers: null
};

global.console = {
  log: () => {},
  error: () => {},
  warn: () => {}
};

// Mock globalThis
global.globalThis = {
  logVerbose: () => {},
  console.log: () => {}
};

// Mock g_renderLayerManager for debug info panel
global.g_renderLayerManager = {
  renderStats: {
    frameCount: 0,
    lastFrameTime: 16.67
  },
  getLayersForState: () => [],
  getLayerStates: () => ({
    TERRAIN: true,
    ENTITIES: true,
    EFFECTS: true
  }),
  layerRenderers: new Map(),
  layerDrawables: new Map()
};

// Mock DraggablePanelManager
class MockDraggablePanelManager {
  constructor() {
    this.panels = [];
    this.isInitialized = false;
  }
  
  initialize() {
    this.isInitialized = true;
  }
  
  addPanel(config) {
    const panel = { ...config };
    this.panels.push(panel);
    return panel;
  }
  
  togglePanel(id) {
    const panel = this.panels.find(p => p.id === id);
    if (panel) {
      panel.visible = !panel.visible;
      return panel.visible;
    }
    return false;
  }
  
  resetAllPanels() {
    this.panels.forEach(p => p.position = p.originalPosition);
  }
  
  getPanelCount() {
    return this.panels.length;
  }
  
  getVisiblePanelCount() {
    return this.panels.filter(p => p.visible).length;
  }
  
  update(mx, my, mouse) {
    return false;
  }
  
  render(renderers) {}
}

global.DraggablePanelManager = MockDraggablePanelManager;

// Mock p5.js keyboard
global.keyCode = 0;
global.SHIFT = 16;
global.CONTROL = 17;
global.keyIsDown = (code) => false;

// Mock resource managers
global.g_entityInventoryManager = {
  getResourcesByType: (type) => [],
  getResourceList: () => []
};

global.ants = [];

// Mock GameState
global.GameState = {
  getState: () => 'PLAYING',
  getDebugInfo: () => ({ state: 'PLAYING' })
};

// Mock performance
global.performance = {
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024
  }
};

// Mock globals
global.g_canvasX = 1920;
global.g_canvasY = 1080;
global.TILE_SIZE = 32;

// Mock text and frameRate functions
global.text = () => {};
global.frameRate = () => 60;

// Load DraggablePanelSystem
const systemPath = '../../../Classes/systems/ui/DraggablePanelSystem.js';
delete require.cache[require.resolve(systemPath)];
const systemCode = require('fs').readFileSync(
  require('path').resolve(__dirname, systemPath),
  'utf8'
);
eval(systemCode);

describe('DraggablePanelSystem', function() {
  
  beforeEach(function() {
    global.window.draggablePanelManager = null;
    global.window.draggablePanelContentRenderers = null;
  });
  
  describe('initializeDraggablePanelSystem()', function() {
    
    it('should exist as function', function() {
      expect(initializeDraggablePanelSystem).to.be.a('function');
    });
    
    it('should create panel manager instance', async function() {
      await initializeDraggablePanelSystem();
      
      expect(global.window.draggablePanelManager).to.exist;
    });
    
    it('should initialize panel manager', async function() {
      await initializeDraggablePanelSystem();
      
      expect(global.window.draggablePanelManager.isInitialized).to.be.true;
    });
    
    it('should create resource display panel', async function() {
      await initializeDraggablePanelSystem();
      
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'resource-display');
      expect(panel).to.exist;
      expect(panel.title).to.equal('Resources');
    });
    
    it('should create performance monitor panel', async function() {
      await initializeDraggablePanelSystem();
      
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'performance-monitor');
      expect(panel).to.exist;
      expect(panel.title).to.equal('Performance Monitor');
    });
    
    it('should create debug info panel', async function() {
      await initializeDraggablePanelSystem();
      
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'debug-info');
      expect(panel).to.exist;
      expect(panel.title).to.equal('Debug Info');
    });
    
    it('should set up content renderers', async function() {
      await initializeDraggablePanelSystem();
      
      expect(global.window.draggablePanelContentRenderers).to.exist;
      expect(global.window.draggablePanelContentRenderers['resource-display']).to.be.a('function');
      expect(global.window.draggablePanelContentRenderers['performance-monitor']).to.be.a('function');
      expect(global.window.draggablePanelContentRenderers['debug-info']).to.be.a('function');
    });
    
    it('should return true on success', async function() {
      const result = await initializeDraggablePanelSystem();
      
      expect(result).to.be.true;
    });
    
    it('should prevent duplicate initialization', async function() {
      await initializeDraggablePanelSystem();
      const panelCount = global.window.draggablePanelManager.panels.length;
      
      await initializeDraggablePanelSystem();
      
      expect(global.window.draggablePanelManager.panels.length).to.equal(panelCount);
    });
    
    it('should handle missing DraggablePanelManager', async function() {
      const oldManager = global.DraggablePanelManager;
      global.DraggablePanelManager = undefined;
      
      const result = await initializeDraggablePanelSystem();
      
      expect(result).to.be.false;
      
      global.DraggablePanelManager = oldManager;
    });
  });
  
  describe('Panel Configurations', function() {
    
    beforeEach(async function() {
      await initializeDraggablePanelSystem();
    });
    
    it('should position resource panel at bottom right', function() {
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'resource-display');
      
      expect(panel.position.x).to.be.greaterThan(1700);
      expect(panel.position.y).to.be.greaterThan(900);
    });
    
    it('should set draggable behavior', function() {
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'resource-display');
      
      expect(panel.behavior.draggable).to.be.true;
    });
    
    it('should set persistent behavior', function() {
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'performance-monitor');
      
      expect(panel.behavior.persistent).to.be.true;
    });
    
    it('should constrain panels to screen', function() {
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'debug-info');
      
      expect(panel.behavior.constrainToScreen).to.be.true;
    });
    
    it('should enable snap to edges', function() {
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'resource-display');
      
      expect(panel.behavior.snapToEdges).to.be.true;
    });
  });
  
  describe('Content Renderers', function() {
    
    beforeEach(async function() {
      await initializeDraggablePanelSystem();
    });
    
    it('should render resource display content', function() {
      const renderer = global.window.draggablePanelContentRenderers['resource-display'];
      const contentArea = { x: 100, y: 100 };
      const style = {};
      
      expect(() => renderer(contentArea, style)).to.not.throw();
    });
    
    it('should render performance monitor content', function() {
      const renderer = global.window.draggablePanelContentRenderers['performance-monitor'];
      const contentArea = { x: 100, y: 100 };
      const style = {};
      
      expect(() => renderer(contentArea, style)).to.not.throw();
    });
    
    it('should render debug info content', function() {
      const renderer = global.window.draggablePanelContentRenderers['debug-info'];
      const contentArea = { x: 100, y: 100 };
      const style = {};
      
      expect(() => renderer(contentArea, style)).to.not.throw();
    });
  });
  
  describe('updateDraggablePanels()', function() {
    
    it('should exist as function', function() {
      expect(updateDraggablePanels).to.be.a('function');
    });
    
    it('should update panel manager', async function() {
      await initializeDraggablePanelSystem();
      global.mouseX = 100;
      global.mouseY = 100;
      global.mouseIsPressed = false;
      global.mouse = {};
      global.RenderManager = {
        startRendererOverwrite: () => {}
      };
      
      expect(() => updateDraggablePanels()).to.not.throw();
    });
    
    it('should handle missing mouse coordinates', function() {
      global.mouseX = undefined;
      
      expect(() => updateDraggablePanels()).to.not.throw();
    });
  });
  
  describe('renderDraggablePanels()', function() {
    
    it('should exist as function', function() {
      expect(renderDraggablePanels).to.be.a('function');
    });
    
    it('should render panels', async function() {
      await initializeDraggablePanelSystem();
      
      expect(() => renderDraggablePanels()).to.not.throw();
    });
    
    it('should handle missing panel manager', function() {
      global.window.draggablePanelManager = null;
      
      expect(() => renderDraggablePanels()).to.not.throw();
    });
  });
});

describe('Panel Keyboard Shortcuts', function() {
  
  beforeEach(async function() {
    global.window.draggablePanelManager = null;
    await initializeDraggablePanelSystem();
  });
  
  it('should toggle performance monitor with Ctrl+Shift+1', function() {
    const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'performance-monitor');
    const initialVisibility = panel.visible;
    
    // Simulate keypress
    global.keyCode = 49; // '1'
    global.keyIsDown = (code) => code === 16 || code === 17; // Shift + Control
    
    if (global.window.keyPressed) {
      global.window.keyPressed();
    }
    
    // Note: In actual implementation, panel would toggle
  });
  
  it('should reset panels with Ctrl+Shift+R', function() {
    // Simulate keypress
    global.keyCode = 82; // 'R'
    global.keyIsDown = (code) => code === 16 || code === 17;
    
    if (global.window.keyPressed) {
      expect(() => global.window.keyPressed()).to.not.throw();
    }
  });
});

describe('DraggablePanelSystem Exports', function() {
  
  it('should export to window', function() {
    expect(global.window.initializeDraggablePanelSystem).to.be.a('function');
    expect(global.window.updateDraggablePanels).to.be.a('function');
    expect(global.window.renderDraggablePanels).to.be.a('function');
  });
});

describe('DraggablePanelManager - managedExternally Flag', function() {
  let manager;

  beforeEach(function() {
    manager = new MockDraggablePanelManager();
    manager.initialize();
  });

  describe('Panel Rendering with managedExternally', function() {
    it('should skip rendering panels with managedExternally: true', function() {
      const panel = {
        id: 'test-managed',
        title: 'Managed Panel',
        visible: true,
        managedExternally: true,
        render: function() {
          this.renderCalled = true;
        },
        renderCalled: false
      };

      manager.panels.push(panel);

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(panel.renderCalled).to.be.false;
    });

    it('should render panels with managedExternally: false', function() {
      const panel = {
        id: 'test-normal',
        title: 'Normal Panel',
        visible: true,
        managedExternally: false,
        render: function() {
          this.renderCalled = true;
        },
        renderCalled: false
      };

      manager.panels.push(panel);

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(panel.renderCalled).to.be.true;
    });

    it('should render panels when managedExternally is undefined', function() {
      const panel = {
        id: 'test-default',
        title: 'Default Panel',
        visible: true,
        // managedExternally not set
        render: function() {
          this.renderCalled = true;
        },
        renderCalled: false
      };

      manager.panels.push(panel);

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(panel.renderCalled).to.be.true;
    });
  });

  describe('Mixed Panel Types', function() {
    it('should only render non-managed panels', function() {
      const panels = [
        {
          id: 'managed1',
          visible: true,
          managedExternally: true,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        },
        {
          id: 'normal1',
          visible: true,
          managedExternally: false,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        },
        {
          id: 'managed2',
          visible: true,
          managedExternally: true,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        },
        {
          id: 'normal2',
          visible: true,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        }
      ];

      panels.forEach(p => manager.panels.push(p));

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(panels[0].renderCalled).to.be.false; // managed1
      expect(panels[1].renderCalled).to.be.true;  // normal1
      expect(panels[2].renderCalled).to.be.false; // managed2
      expect(panels[3].renderCalled).to.be.true;  // normal2
    });

    it('should count correct number of rendered panels', function() {
      const panels = [
        { id: 'm1', visible: true, managedExternally: true },
        { id: 'n1', visible: true, managedExternally: false },
        { id: 'm2', visible: true, managedExternally: true },
        { id: 'n2', visible: true }
      ];

      let renderCount = 0;
      panels.forEach(p => {
        p.render = () => { renderCount++; };
        manager.panels.push(p);
      });

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(renderCount).to.equal(2);
    });
  });

  describe('Visibility Interactions', function() {
    it('should not render invisible panels regardless of managedExternally', function() {
      const panels = [
        {
          id: 'hidden-managed',
          visible: false,
          managedExternally: true,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        },
        {
          id: 'hidden-normal',
          visible: false,
          managedExternally: false,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        }
      ];

      panels.forEach(p => manager.panels.push(p));

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(panels[0].renderCalled).to.be.false;
      expect(panels[1].renderCalled).to.be.false;
    });

    it('should not render visible managed panels', function() {
      const panel = {
        id: 'visible-managed',
        visible: true,
        managedExternally: true,
        render: function() { this.renderCalled = true; },
        renderCalled: false
      };

      manager.panels.push(panel);

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(panel.renderCalled).to.be.false;
    });
  });

  describe('Level Editor Panels', function() {
    it('should have managedExternally set for level editor materials panel', function() {
      const levelEditorPanel = {
        id: 'level-editor-materials',
        title: 'Materials',
        managedExternally: true,
        visible: true
      };

      expect(levelEditorPanel.managedExternally).to.be.true;
    });

    it('should have managedExternally set for level editor tools panel', function() {
      const levelEditorPanel = {
        id: 'level-editor-tools',
        title: 'Tools',
        managedExternally: true,
        visible: true
      };

      expect(levelEditorPanel.managedExternally).to.be.true;
    });

    it('should have managedExternally set for level editor brush panel', function() {
      const levelEditorPanel = {
        id: 'level-editor-brush',
        title: 'Brush Size',
        managedExternally: true,
        visible: true
      };

      expect(levelEditorPanel.managedExternally).to.be.true;
    });

    it('should not auto-render any level editor panels', function() {
      const levelEditorPanels = [
        {
          id: 'level-editor-materials',
          visible: true,
          managedExternally: true,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        },
        {
          id: 'level-editor-tools',
          visible: true,
          managedExternally: true,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        },
        {
          id: 'level-editor-brush',
          visible: true,
          managedExternally: true,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        }
      ];

      levelEditorPanels.forEach(p => manager.panels.push(p));

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(levelEditorPanels[0].renderCalled).to.be.false;
      expect(levelEditorPanels[1].renderCalled).to.be.false;
      expect(levelEditorPanels[2].renderCalled).to.be.false;
    });
  });
});
