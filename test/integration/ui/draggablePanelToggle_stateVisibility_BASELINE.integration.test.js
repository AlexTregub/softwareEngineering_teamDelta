/**
 * BASELINE Integration Tests: DraggablePanelManager.togglePanel() State Visibility
 * 
 * Purpose: Establish baseline behavior BEFORE fixing the View menu panel toggle bug
 * Bug: togglePanel() only calls panel.toggleVisibility() but doesn't update stateVisibility array
 * Result: Panels flash and disappear because renderPanels() enforces stateVisibility every frame
 * 
 * Tests ALL known draggable panels in both PLAYING and LEVEL_EDITOR states
 * 
 * PLAYING state panels:
 * - ant_spawn
 * - health_controls
 * - tasks
 * - buildings
 * - resources
 * - cheats
 * - queen-powers-panel
 * 
 * LEVEL_EDITOR state panels:
 * - level-editor-materials
 * - level-editor-tools
 * - level-editor-brush
 * - level-editor-events
 * - level-editor-properties
 * - level-editor-sidebar
 * 
 * @author Software Engineering Team Delta
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('BASELINE: DraggablePanelManager.togglePanel() - State Visibility', function() {
  let sandbox;
  let DraggablePanelManager;
  let manager;
  let mockPanel;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    setupUITestEnvironment(sandbox);

    // Load DraggablePanelManager
    delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanelManager.js')];
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');

    manager = new DraggablePanelManager();
    global.draggablePanelManager = manager;
    window.draggablePanelManager = manager;

    // Create mock panel
    mockPanel = {
      state: { visible: false, minimized: false },
      toggleVisibility: sandbox.stub().callsFake(function() {
        this.state.visible = !this.state.visible;
      }),
      isVisible: sandbox.stub().callsFake(function() {
        return this.state.visible;
      }),
      show: sandbox.stub().callsFake(function() {
        this.state.visible = true;
      }),
      hide: sandbox.stub().callsFake(function() {
        this.state.visible = false;
      })
    };
  });

  afterEach(function() {
    cleanupUITestEnvironment();
    sandbox.restore();
  });

  describe('BASELINE: togglePanel() Method - PLAYING State', function() {
    const playingPanels = [
      'ant_spawn',
      'health_controls',
      'tasks',
      'buildings',
      'resources',
      'cheats',
      'queen-powers-panel'
    ];

    playingPanels.forEach(panelId => {
      describe(`PLAYING Panel: ${panelId}`, function() {
        beforeEach(function() {
          // Register panel
          manager.panels.set(panelId, mockPanel);
          
          // Initialize PLAYING state visibility
          if (!manager.stateVisibility.PLAYING) {
            manager.stateVisibility.PLAYING = [];
          }
          
          // Mock GameState
          global.GameState = { current: 'PLAYING' };
          window.GameState = global.GameState;
        });

        it(`BASELINE: should toggle ${panelId} visibility flag`, function() {
          // Start hidden
          expect(mockPanel.state.visible).to.be.false;
          
          // Toggle on
          const result1 = manager.togglePanel(panelId);
          
          expect(mockPanel.toggleVisibility.calledOnce).to.be.true;
          expect(mockPanel.state.visible).to.be.true;
          expect(result1).to.be.true;
          
          // Toggle off
          const result2 = manager.togglePanel(panelId);
          
          expect(mockPanel.toggleVisibility.calledTwice).to.be.true;
          expect(mockPanel.state.visible).to.be.false;
          expect(result2).to.be.false;
        });

        it(`BASELINE BUG: togglePanel() does NOT add ${panelId} to stateVisibility.PLAYING when starting empty`, function() {
          // Start with empty stateVisibility (simulate hidden-by-default panel)
          manager.stateVisibility.PLAYING = [];
          
          // Toggle on
          manager.togglePanel(panelId);
          
          // BUG: Panel visibility flag is true
          expect(mockPanel.state.visible).to.be.true;
          
          // BUG: But stateVisibility array NOT updated
          expect(manager.stateVisibility.PLAYING).to.not.include(panelId);
        });

        it(`BASELINE BUG: togglePanel() does NOT remove ${panelId} from stateVisibility.PLAYING when toggling off`, function() {
          // Manually add to stateVisibility first
          manager.stateVisibility.PLAYING.push(panelId);
          mockPanel.state.visible = true;
          
          expect(manager.stateVisibility.PLAYING).to.include(panelId);
          
          // Toggle off
          manager.togglePanel(panelId);
          
          // BUG: Panel visibility flag is false
          expect(mockPanel.state.visible).to.be.false;
          
          // BUG: But stateVisibility array NOT updated (still contains panel)
          expect(manager.stateVisibility.PLAYING).to.include(panelId);
        });
      });
    });
  });

  describe('BASELINE: togglePanel() Method - LEVEL_EDITOR State', function() {
    const editorPanels = [
      'level-editor-materials',
      'level-editor-tools',
      'level-editor-brush',
      'level-editor-events',
      'level-editor-properties',
      'level-editor-sidebar'
    ];

    editorPanels.forEach(panelId => {
      describe(`LEVEL_EDITOR Panel: ${panelId}`, function() {
        beforeEach(function() {
          // Register panel
          manager.panels.set(panelId, mockPanel);
          
          // Initialize LEVEL_EDITOR state visibility
          if (!manager.stateVisibility.LEVEL_EDITOR) {
            manager.stateVisibility.LEVEL_EDITOR = [];
          }
          
          // Mock GameState
          global.GameState = { current: 'LEVEL_EDITOR' };
          window.GameState = global.GameState;
        });

        it(`BASELINE: should toggle ${panelId} visibility flag`, function() {
          // Start hidden
          expect(mockPanel.state.visible).to.be.false;
          
          // Toggle on
          const result1 = manager.togglePanel(panelId);
          
          expect(mockPanel.toggleVisibility.calledOnce).to.be.true;
          expect(mockPanel.state.visible).to.be.true;
          expect(result1).to.be.true;
          
          // Toggle off
          const result2 = manager.togglePanel(panelId);
          
          expect(mockPanel.toggleVisibility.calledTwice).to.be.true;
          expect(mockPanel.state.visible).to.be.false;
          expect(result2).to.be.false;
        });

        it(`BASELINE BUG: togglePanel() does NOT add ${panelId} to stateVisibility.LEVEL_EDITOR`, function() {
          // Toggle on
          manager.togglePanel(panelId);
          
          // BUG: Panel visibility flag is true
          expect(mockPanel.state.visible).to.be.true;
          
          // BUG: But stateVisibility array NOT updated
          expect(manager.stateVisibility.LEVEL_EDITOR).to.not.include(panelId);
        });

        it(`BASELINE BUG: togglePanel() does NOT remove ${panelId} from stateVisibility.LEVEL_EDITOR`, function() {
          // Manually add to stateVisibility first
          manager.stateVisibility.LEVEL_EDITOR.push(panelId);
          mockPanel.state.visible = true;
          
          expect(manager.stateVisibility.LEVEL_EDITOR).to.include(panelId);
          
          // Toggle off
          manager.togglePanel(panelId);
          
          // BUG: Panel visibility flag is false
          expect(mockPanel.state.visible).to.be.false;
          
          // BUG: But stateVisibility array NOT updated (still contains panel)
          expect(manager.stateVisibility.LEVEL_EDITOR).to.include(panelId);
        });
      });
    });
  });

  describe('BASELINE: renderPanels() Enforces stateVisibility', function() {
    it('BASELINE: renderPanels() ignores panels not in stateVisibility.PLAYING', function() {
      const panelId = 'ant_spawn';
      manager.panels.set(panelId, mockPanel);
      
      // Panel visible but NOT in stateVisibility
      mockPanel.state.visible = true;
      manager.stateVisibility.PLAYING = []; // Empty
      
      // Mock render method
      mockPanel.render = sandbox.stub();
      
      // Call renderPanels for PLAYING state
      manager.renderPanels('PLAYING');
      
      // Panel should NOT render (not in stateVisibility)
      expect(mockPanel.render.called).to.be.false;
    });

    it('BASELINE: renderPanels() ignores panels not in stateVisibility.LEVEL_EDITOR', function() {
      const panelId = 'level-editor-materials';
      manager.panels.set(panelId, mockPanel);
      
      // Panel visible but NOT in stateVisibility
      mockPanel.state.visible = true;
      manager.stateVisibility.LEVEL_EDITOR = []; // Empty
      
      // Mock render method
      mockPanel.render = sandbox.stub();
      
      // Call renderPanels for LEVEL_EDITOR state
      manager.renderPanels('LEVEL_EDITOR');
      
      // Panel should NOT render (not in stateVisibility)
      expect(mockPanel.render.called).to.be.false;
    });
  });

  describe('BASELINE: Bug Impact - Panel Flash Effect', function() {
    it('BASELINE BUG: togglePanel() + renderPanels() causes flash effect (PLAYING)', function() {
      const panelId = 'tasks';
      manager.panels.set(panelId, mockPanel);
      manager.stateVisibility.PLAYING = [];
      
      mockPanel.render = sandbox.stub();
      
      // 1. User clicks View menu toggle
      manager.togglePanel(panelId);
      
      // Frame 1: Panel visible flag is true
      expect(mockPanel.state.visible).to.be.true;
      
      // Frame 1: Panel not in stateVisibility (BUG)
      expect(manager.stateVisibility.PLAYING).to.not.include(panelId);
      
      // 2. Next frame: renderPanels() is called
      manager.renderPanels('PLAYING');
      
      // Frame 2: Panel does NOT render (enforces stateVisibility)
      expect(mockPanel.render.called).to.be.false;
      
      // Result: Panel appears for 1 frame then disappears (FLASH EFFECT)
    });

    it('BASELINE BUG: togglePanel() + renderPanels() causes flash effect (LEVEL_EDITOR)', function() {
      const panelId = 'level-editor-sidebar';
      manager.panels.set(panelId, mockPanel);
      manager.stateVisibility.LEVEL_EDITOR = [];
      
      mockPanel.render = sandbox.stub();
      
      // 1. User clicks View menu toggle
      manager.togglePanel(panelId);
      
      // Frame 1: Panel visible flag is true
      expect(mockPanel.state.visible).to.be.true;
      
      // Frame 1: Panel not in stateVisibility (BUG)
      expect(manager.stateVisibility.LEVEL_EDITOR).to.not.include(panelId);
      
      // 2. Next frame: renderPanels() is called
      manager.renderPanels('LEVEL_EDITOR');
      
      // Frame 2: Panel does NOT render (enforces stateVisibility)
      expect(mockPanel.render.called).to.be.false;
      
      // Result: Panel appears for 1 frame then disappears (FLASH EFFECT)
    });
  });

  describe('BASELINE: Multiple Toggles', function() {
    it('BASELINE BUG: multiple toggles do not accumulate in stateVisibility (PLAYING)', function() {
      const panelId = 'resources';
      manager.panels.set(panelId, mockPanel);
      manager.stateVisibility.PLAYING = [];
      
      // Toggle on/off/on multiple times
      manager.togglePanel(panelId); // On
      manager.togglePanel(panelId); // Off
      manager.togglePanel(panelId); // On
      
      // Panel visible
      expect(mockPanel.state.visible).to.be.true;
      
      // BUG: Still not in stateVisibility
      expect(manager.stateVisibility.PLAYING).to.not.include(panelId);
    });

    it('BASELINE BUG: multiple toggles do not accumulate in stateVisibility (LEVEL_EDITOR)', function() {
      const panelId = 'level-editor-events';
      manager.panels.set(panelId, mockPanel);
      manager.stateVisibility.LEVEL_EDITOR = [];
      
      // Toggle on/off/on multiple times
      manager.togglePanel(panelId); // On
      manager.togglePanel(panelId); // Off
      manager.togglePanel(panelId); // On
      
      // Panel visible
      expect(mockPanel.state.visible).to.be.true;
      
      // BUG: Still not in stateVisibility
      expect(manager.stateVisibility.LEVEL_EDITOR).to.not.include(panelId);
    });
  });

  describe('BASELINE: Edge Cases', function() {
    it('BASELINE: togglePanel() returns null for non-existent panel', function() {
      const result = manager.togglePanel('non-existent-panel');
      expect(result).to.be.null;
    });

    it('BASELINE: togglePanel() handles missing GameState gracefully', function() {
      delete global.GameState;
      delete window.GameState;
      
      const panelId = 'ant_spawn';
      manager.panels.set(panelId, mockPanel);
      
      const result = manager.togglePanel(panelId);
      
      // Should still toggle visibility flag
      expect(mockPanel.toggleVisibility.calledOnce).to.be.true;
      expect(result).to.be.true;
    });
  });
});
