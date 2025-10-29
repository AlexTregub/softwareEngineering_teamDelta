/**
 * FIXED Integration Tests: DraggablePanelManager.togglePanel() State Visibility
 * 
 * Purpose: Test fixed behavior AFTER implementing stateVisibility synchronization
 * Fix: togglePanel() now updates stateVisibility array when toggling panels
 * Expected: Panels stay visible after toggle (no flash effect)
 * 
 * Tests ALL known draggable panels in both PLAYING and LEVEL_EDITOR states
 * 
 * PLAYING state panels:
 * - ant_spawn, health_controls, tasks, buildings, resources, cheats, queen-powers-panel
 * 
 * LEVEL_EDITOR state panels:
 * - level-editor-materials, level-editor-tools, level-editor-brush, level-editor-events, level-editor-properties, level-editor-sidebar
 * 
 * @author Software Engineering Team Delta
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('FIXED: DraggablePanelManager.togglePanel() - State Visibility', function() {
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
      config: {
        behavior: {
          managedExternally: false
        }
      },
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
      }),
      render: sandbox.stub()
    };
  });

  afterEach(function() {
    cleanupUITestEnvironment();
    sandbox.restore();
  });

  describe('FIXED: togglePanel() Method - PLAYING State', function() {
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
          
          // Initialize PLAYING state visibility (empty to test adding)
          manager.stateVisibility.PLAYING = [];
          
          // Mock GameState
          global.GameState = { current: 'PLAYING' };
          window.GameState = global.GameState;
          
          // CRITICAL: Set manager.gameState (used by togglePanel)
          manager.gameState = 'PLAYING';
        });

        it(`FIXED: should toggle ${panelId} visibility flag`, function() {
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

        it(`FIXED: togglePanel() should ADD ${panelId} to stateVisibility.PLAYING when shown`, function() {
          // Start with empty stateVisibility
          expect(manager.stateVisibility.PLAYING).to.not.include(panelId);
          
          // Toggle on
          manager.togglePanel(panelId);
          
          // Panel visible
          expect(mockPanel.state.visible).to.be.true;
          
          // FIXED: stateVisibility updated
          expect(manager.stateVisibility.PLAYING).to.include(panelId);
        });

        it(`FIXED: togglePanel() should REMOVE ${panelId} from stateVisibility.PLAYING when hidden`, function() {
          // Manually add to stateVisibility first
          manager.stateVisibility.PLAYING.push(panelId);
          mockPanel.state.visible = true;
          
          expect(manager.stateVisibility.PLAYING).to.include(panelId);
          
          // Toggle off
          manager.togglePanel(panelId);
          
          // Panel hidden
          expect(mockPanel.state.visible).to.be.false;
          
          // FIXED: stateVisibility updated
          expect(manager.stateVisibility.PLAYING).to.not.include(panelId);
        });
      });
    });
  });

  describe('FIXED: togglePanel() Method - LEVEL_EDITOR State', function() {
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
          
          // Initialize LEVEL_EDITOR state visibility (empty to test adding)
          manager.stateVisibility.LEVEL_EDITOR = [];
          
          // Mock GameState
          global.GameState = { current: 'LEVEL_EDITOR' };
          window.GameState = global.GameState;
          
          // CRITICAL: Set manager.gameState (used by togglePanel)
          manager.gameState = 'LEVEL_EDITOR';
        });

        it(`FIXED: should toggle ${panelId} visibility flag`, function() {
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

        it(`FIXED: togglePanel() should ADD ${panelId} to stateVisibility.LEVEL_EDITOR when shown`, function() {
          // Start with empty stateVisibility
          expect(manager.stateVisibility.LEVEL_EDITOR).to.not.include(panelId);
          
          // Toggle on
          manager.togglePanel(panelId);
          
          // Panel visible
          expect(mockPanel.state.visible).to.be.true;
          
          // FIXED: stateVisibility updated
          expect(manager.stateVisibility.LEVEL_EDITOR).to.include(panelId);
        });

        it(`FIXED: togglePanel() should REMOVE ${panelId} from stateVisibility.LEVEL_EDITOR when hidden`, function() {
          // Manually add to stateVisibility first
          manager.stateVisibility.LEVEL_EDITOR.push(panelId);
          mockPanel.state.visible = true;
          
          expect(manager.stateVisibility.LEVEL_EDITOR).to.include(panelId);
          
          // Toggle off
          manager.togglePanel(panelId);
          
          // Panel hidden
          expect(mockPanel.state.visible).to.be.false;
          
          // FIXED: stateVisibility updated
          expect(manager.stateVisibility.LEVEL_EDITOR).to.not.include(panelId);
        });
      });
    });
  });

  describe('FIXED: renderPanels() Respects Updated stateVisibility', function() {
    it('FIXED: renderPanels() renders panels added to stateVisibility.PLAYING', function() {
      const panelId = 'ant_spawn';
      manager.panels.set(panelId, mockPanel);
      manager.stateVisibility.PLAYING = [];
      
      // Set game state
      global.GameState = { current: 'PLAYING' };
      window.GameState = global.GameState;
      manager.gameState = 'PLAYING';
      
      // Reset render stub
      mockPanel.render.resetHistory();
      
      // Toggle panel on (should add to stateVisibility)
      manager.togglePanel(panelId);
      
      // Panel visible and in stateVisibility
      expect(mockPanel.state.visible).to.be.true;
      expect(manager.stateVisibility.PLAYING).to.include(panelId);
      
      // Call renderPanels for PLAYING state
      manager.renderPanels('PLAYING');
      
      // Panel SHOULD render (in stateVisibility)
      expect(mockPanel.render.calledOnce).to.be.true;
    });

    it('FIXED: renderPanels() renders panels added to stateVisibility.LEVEL_EDITOR', function() {
      const panelId = 'level-editor-materials';
      manager.panels.set(panelId, mockPanel);
      manager.stateVisibility.LEVEL_EDITOR = [];
      
      // Set game state
      global.GameState = { current: 'LEVEL_EDITOR' };
      window.GameState = global.GameState;
      manager.gameState = 'LEVEL_EDITOR';
      
      // Reset render stub
      mockPanel.render.resetHistory();
      
      // Toggle panel on (should add to stateVisibility)
      manager.togglePanel(panelId);
      
      // Panel visible and in stateVisibility
      expect(mockPanel.state.visible).to.be.true;
      expect(manager.stateVisibility.LEVEL_EDITOR).to.include(panelId);
      
      // Call renderPanels for LEVEL_EDITOR state
      manager.renderPanels('LEVEL_EDITOR');
      
      // Panel SHOULD render (in stateVisibility)
      expect(mockPanel.render.calledOnce).to.be.true;
    });
  });

  describe('FIXED: Bug Impact - No Flash Effect', function() {
    it('FIXED: togglePanel() + renderPanels() NO flash effect (PLAYING)', function() {
      const panelId = 'tasks';
      manager.panels.set(panelId, mockPanel);
      manager.stateVisibility.PLAYING = [];
      
      // Set game state
      global.GameState = { current: 'PLAYING' };
      window.GameState = global.GameState;
      manager.gameState = 'PLAYING';
      
      // Reset render stub
      mockPanel.render.resetHistory();
      
      // 1. User clicks View menu toggle
      manager.togglePanel(panelId);
      
      // Frame 1: Panel visible flag is true
      expect(mockPanel.state.visible).to.be.true;
      
      // Frame 1: Panel IN stateVisibility (FIXED)
      expect(manager.stateVisibility.PLAYING).to.include(panelId);
      
      // 2. Next frame: renderPanels() is called
      manager.renderPanels('PLAYING');
      
      // Frame 2: Panel DOES render (respects stateVisibility)
      expect(mockPanel.render.calledOnce).to.be.true;
      
      // Result: Panel stays visible (NO FLASH EFFECT)
    });

    it('FIXED: togglePanel() + renderPanels() NO flash effect (LEVEL_EDITOR)', function() {
      const panelId = 'level-editor-sidebar';
      manager.panels.set(panelId, mockPanel);
      manager.stateVisibility.LEVEL_EDITOR = [];
      
      // Set game state
      global.GameState = { current: 'LEVEL_EDITOR' };
      window.GameState = global.GameState;
      manager.gameState = 'LEVEL_EDITOR';
      
      // Reset render stub
      mockPanel.render.resetHistory();
      
      // 1. User clicks View menu toggle
      manager.togglePanel(panelId);
      
      // Frame 1: Panel visible flag is true
      expect(mockPanel.state.visible).to.be.true;
      
      // Frame 1: Panel IN stateVisibility (FIXED)
      expect(manager.stateVisibility.LEVEL_EDITOR).to.include(panelId);
      
      // 2. Next frame: renderPanels() is called
      manager.renderPanels('LEVEL_EDITOR');
      
      // Frame 2: Panel DOES render (respects stateVisibility)
      expect(mockPanel.render.calledOnce).to.be.true;
      
      // Result: Panel stays visible (NO FLASH EFFECT)
    });
  });

  describe('FIXED: Multiple Toggles', function() {
    it('FIXED: multiple toggles correctly update stateVisibility (PLAYING)', function() {
      const panelId = 'resources';
      manager.panels.set(panelId, mockPanel);
      manager.stateVisibility.PLAYING = [];
      
      // Set game state
      global.GameState = { current: 'PLAYING' };
      window.GameState = global.GameState;
      manager.gameState = 'PLAYING';
      
      // Toggle on
      manager.togglePanel(panelId);
      expect(mockPanel.state.visible).to.be.true;
      expect(manager.stateVisibility.PLAYING).to.include(panelId);
      
      // Toggle off
      manager.togglePanel(panelId);
      expect(mockPanel.state.visible).to.be.false;
      expect(manager.stateVisibility.PLAYING).to.not.include(panelId);
      
      // Toggle on again
      manager.togglePanel(panelId);
      expect(mockPanel.state.visible).to.be.true;
      expect(manager.stateVisibility.PLAYING).to.include(panelId);
    });

    it('FIXED: multiple toggles correctly update stateVisibility (LEVEL_EDITOR)', function() {
      const panelId = 'level-editor-events';
      manager.panels.set(panelId, mockPanel);
      manager.stateVisibility.LEVEL_EDITOR = [];
      
      // Set game state
      global.GameState = { current: 'LEVEL_EDITOR' };
      window.GameState = global.GameState;
      manager.gameState = 'LEVEL_EDITOR';
      
      // Toggle on
      manager.togglePanel(panelId);
      expect(mockPanel.state.visible).to.be.true;
      expect(manager.stateVisibility.LEVEL_EDITOR).to.include(panelId);
      
      // Toggle off
      manager.togglePanel(panelId);
      expect(mockPanel.state.visible).to.be.false;
      expect(manager.stateVisibility.LEVEL_EDITOR).to.not.include(panelId);
      
      // Toggle on again
      manager.togglePanel(panelId);
      expect(mockPanel.state.visible).to.be.true;
      expect(manager.stateVisibility.LEVEL_EDITOR).to.include(panelId);
    });

    it('FIXED: should not duplicate panel IDs in stateVisibility (PLAYING)', function() {
      const panelId = 'tasks';
      manager.panels.set(panelId, mockPanel);
      manager.stateVisibility.PLAYING = [];
      
      // Set game state
      global.GameState = { current: 'PLAYING' };
      window.GameState = global.GameState;
      manager.gameState = 'PLAYING';
      
      // Toggle on twice
      manager.togglePanel(panelId); // On
      manager.togglePanel(panelId); // Off
      manager.togglePanel(panelId); // On
      
      // Should only appear once
      const occurrences = manager.stateVisibility.PLAYING.filter(id => id === panelId).length;
      expect(occurrences).to.equal(1);
    });

    it('FIXED: should not duplicate panel IDs in stateVisibility (LEVEL_EDITOR)', function() {
      const panelId = 'level-editor-properties';
      manager.panels.set(panelId, mockPanel);
      manager.stateVisibility.LEVEL_EDITOR = [];
      
      // Set game state
      global.GameState = { current: 'LEVEL_EDITOR' };
      window.GameState = global.GameState;
      manager.gameState = 'LEVEL_EDITOR';
      
      // Toggle on twice
      manager.togglePanel(panelId); // On
      manager.togglePanel(panelId); // Off
      manager.togglePanel(panelId); // On
      
      // Should only appear once
      const occurrences = manager.stateVisibility.LEVEL_EDITOR.filter(id => id === panelId).length;
      expect(occurrences).to.equal(1);
    });
  });

  describe('FIXED: Edge Cases', function() {
    it('FIXED: togglePanel() returns null for non-existent panel', function() {
      const result = manager.togglePanel('non-existent-panel');
      expect(result).to.be.null;
    });

    it('FIXED: togglePanel() handles missing GameState gracefully', function() {
      delete global.GameState;
      delete window.GameState;
      delete manager.gameState; // Also delete manager's internal state
      
      const panelId = 'ant_spawn';
      manager.panels.set(panelId, mockPanel);
      manager.stateVisibility.MENU = []; // Default fallback state (|| 'MENU')
      
      const result = manager.togglePanel(panelId);
      
      // Should still toggle and update stateVisibility (using default 'MENU' state)
      expect(mockPanel.toggleVisibility.calledOnce).to.be.true;
      expect(result).to.be.true;
      expect(manager.stateVisibility.MENU).to.include(panelId);
    });

    it('FIXED: togglePanel() creates missing state visibility array', function() {
      const panelId = 'test-panel';
      manager.panels.set(panelId, mockPanel);
      
      // Set manager.gameState to a new state that doesn't have an array yet
      manager.gameState = 'NEW_STATE';
      global.GameState = { current: 'NEW_STATE' };
      window.GameState = global.GameState;
      
      // State not initialized
      expect(manager.stateVisibility.NEW_STATE).to.be.undefined;
      
      // Toggle on
      manager.togglePanel(panelId);
      
      // State array should be created
      expect(manager.stateVisibility.NEW_STATE).to.exist;
      expect(manager.stateVisibility.NEW_STATE).to.be.an('array');
      expect(manager.stateVisibility.NEW_STATE).to.include(panelId);
    });
  });
});
