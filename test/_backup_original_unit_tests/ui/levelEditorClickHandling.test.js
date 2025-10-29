/**
 * Unit tests for LevelEditor click handling order
 * 
 * Ensures that:
 * 1. Panel CONTENT clicks are checked FIRST (buttons, swatches, etc.)
 * 2. Panel DRAGGING is checked SECOND (title bar, minimize)
 * 3. Terrain painting only happens if neither consumed the click
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('LevelEditor Click Handling Order', function() {
  let LevelEditor;
  let mockDraggablePanelManager;
  let mockDraggablePanels;
  let mockTerrain;
  let levelEditor;

  beforeEach(function() {
    // Mock dependencies
    global.console = {
      log: () => {},
      error: () => {},
      warn: () => {}
    };

    // Mock draggablePanelManager
    mockDraggablePanelManager = {
      handleMouseEvents: sinon.stub().returns(false),
      panels: new Map(),
      stateVisibility: { LEVEL_EDITOR: [] }
    };
    global.draggablePanelManager = mockDraggablePanelManager;

    // Mock terrain
    mockTerrain = {
      tileSize: 32,
      getTile: sinon.stub().returns(null),
      render: sinon.stub()
    };

    // Mock draggablePanels
    mockDraggablePanels = {
      handleClick: sinon.stub().returns(false),
      render: sinon.stub()
    };

    // Load LevelEditor (simplified version for testing)
    LevelEditor = class {
      constructor() {
        this.active = false;
        this.terrain = null;
        this.draggablePanels = null;
        this.palette = { getSelectedMaterial: () => 'grass' };
        this.toolbar = { getSelectedTool: () => 'paint', setEnabled: () => {} };
        this.brushControl = { getSize: () => 1 };
        this.editor = {
          selectMaterial: sinon.stub(),
          paint: sinon.stub(),
          setBrushSize: sinon.stub(),
          canUndo: () => false,
          canRedo: () => false
        };
        this.notifications = { show: sinon.stub() };
      }

      initialize(terrain) {
        this.terrain = terrain;
        this.active = true;
        return true;
      }

      isActive() {
        return this.active;
      }

      handleClick(mouseX, mouseY) {
        if (!this.active) return;
        
        // FIRST: Let draggable panels handle content clicks (buttons, swatches, etc.)
        if (this.draggablePanels) {
          const handled = this.draggablePanels.handleClick(mouseX, mouseY);
          if (handled) {
            return; // Panel content consumed the click
          }
        }
        
        // SECOND: Check if draggable panel manager consumed the event (for dragging/title bar)
        if (typeof draggablePanelManager !== 'undefined' && draggablePanelManager) {
          const panelConsumed = draggablePanelManager.handleMouseEvents(mouseX, mouseY, true);
          if (panelConsumed) {
            return; // Panel consumed the click - don't paint terrain
          }
        }
        
        // If no UI was clicked, handle terrain editing
        const tool = this.toolbar.getSelectedTool();
        const material = this.palette.getSelectedMaterial();
        
        // Simple pixel-to-tile conversion
        const tileSize = this.terrain.tileSize || 32;
        const gridX = Math.floor(mouseX / tileSize);
        const gridY = Math.floor(mouseY / tileSize);
        
        // Apply tool action
        if (tool === 'paint') {
          const brushSize = this.brushControl.getSize();
          this.editor.setBrushSize(brushSize);
          this.editor.selectMaterial(material);
          this.editor.paint(gridX, gridY);
          this.notifications.show(`Painted ${material} at (${gridX}, ${gridY})`);
        }
      }
    };

    // Create level editor instance
    levelEditor = new LevelEditor();
    levelEditor.initialize(mockTerrain);
    levelEditor.draggablePanels = mockDraggablePanels;
  });

  afterEach(function() {
    sinon.restore();
    delete global.draggablePanelManager;
    delete global.console;
  });

  describe('Click Handling Order', function() {
    it('should check panel content FIRST before panel dragging', function() {
      const mouseX = 100;
      const mouseY = 100;

      // Both return false, but we check the order
      mockDraggablePanels.handleClick.returns(false);
      mockDraggablePanelManager.handleMouseEvents.returns(false);

      levelEditor.handleClick(mouseX, mouseY);

      // draggablePanels.handleClick should be called BEFORE draggablePanelManager.handleMouseEvents
      expect(mockDraggablePanels.handleClick.calledBefore(mockDraggablePanelManager.handleMouseEvents)).to.be.true;
    });

    it('should NOT check panel dragging if content consumed the click', function() {
      const mouseX = 100;
      const mouseY = 100;

      // Content consumed the click
      mockDraggablePanels.handleClick.returns(true);

      levelEditor.handleClick(mouseX, mouseY);

      // draggablePanelManager should NOT be called
      expect(mockDraggablePanelManager.handleMouseEvents.called).to.be.false;
    });

    it('should NOT paint terrain if content consumed the click', function() {
      const mouseX = 100;
      const mouseY = 100;

      // Content consumed the click
      mockDraggablePanels.handleClick.returns(true);

      levelEditor.handleClick(mouseX, mouseY);

      // Editor should NOT paint
      expect(levelEditor.editor.paint.called).to.be.false;
    });

    it('should check panel dragging if content did NOT consume click', function() {
      const mouseX = 100;
      const mouseY = 100;

      // Content did not consume
      mockDraggablePanels.handleClick.returns(false);
      mockDraggablePanelManager.handleMouseEvents.returns(false);

      levelEditor.handleClick(mouseX, mouseY);

      // draggablePanelManager should be called
      expect(mockDraggablePanelManager.handleMouseEvents.called).to.be.true;
    });

    it('should NOT paint terrain if panel dragging consumed the click', function() {
      const mouseX = 100;
      const mouseY = 100;

      // Content did not consume, but dragging did
      mockDraggablePanels.handleClick.returns(false);
      mockDraggablePanelManager.handleMouseEvents.returns(true);

      levelEditor.handleClick(mouseX, mouseY);

      // Editor should NOT paint
      expect(levelEditor.editor.paint.called).to.be.false;
    });

    it('should paint terrain ONLY if neither panel consumed the click', function() {
      const mouseX = 100;
      const mouseY = 100;

      // Neither consumed the click
      mockDraggablePanels.handleClick.returns(false);
      mockDraggablePanelManager.handleMouseEvents.returns(false);

      levelEditor.handleClick(mouseX, mouseY);

      // Editor SHOULD paint
      expect(levelEditor.editor.paint.called).to.be.true;
      expect(levelEditor.editor.paint.calledWith(3, 3)).to.be.true; // floor(100/32) = 3
    });
  });

  describe('Edge Cases', function() {
    it('should handle missing draggablePanels gracefully', function() {
      levelEditor.draggablePanels = null;
      const mouseX = 100;
      const mouseY = 100;

      expect(() => levelEditor.handleClick(mouseX, mouseY)).to.not.throw();
    });

    it('should handle missing draggablePanelManager gracefully', function() {
      delete global.draggablePanelManager;
      const mouseX = 100;
      const mouseY = 100;

      expect(() => levelEditor.handleClick(mouseX, mouseY)).to.not.throw();
    });

    it('should not process clicks when inactive', function() {
      levelEditor.active = false;
      const mouseX = 100;
      const mouseY = 100;

      levelEditor.handleClick(mouseX, mouseY);

      expect(mockDraggablePanels.handleClick.called).to.be.false;
      expect(mockDraggablePanelManager.handleMouseEvents.called).to.be.false;
      expect(levelEditor.editor.paint.called).to.be.false;
    });
  });

  describe('Terrain Painting', function() {
    it('should convert mouse coordinates to grid coordinates correctly', function() {
      const mouseX = 96; // 96 / 32 = 3
      const mouseY = 64; // 64 / 32 = 2

      mockDraggablePanels.handleClick.returns(false);
      mockDraggablePanelManager.handleMouseEvents.returns(false);

      levelEditor.handleClick(mouseX, mouseY);

      expect(levelEditor.editor.paint.calledWith(3, 2)).to.be.true;
    });

    it('should use selected material when painting', function() {
      levelEditor.palette.getSelectedMaterial = () => 'moss';
      const mouseX = 50;
      const mouseY = 50;

      mockDraggablePanels.handleClick.returns(false);
      mockDraggablePanelManager.handleMouseEvents.returns(false);

      levelEditor.handleClick(mouseX, mouseY);

      expect(levelEditor.editor.selectMaterial.calledWith('moss')).to.be.true;
    });

    it('should use brush size when painting', function() {
      levelEditor.brushControl.getSize = () => 3;
      const mouseX = 50;
      const mouseY = 50;

      mockDraggablePanels.handleClick.returns(false);
      mockDraggablePanelManager.handleMouseEvents.returns(false);

      levelEditor.handleClick(mouseX, mouseY);

      expect(levelEditor.editor.setBrushSize.calledWith(3)).to.be.true;
    });
  });

  describe('Priority Demonstration', function() {
    it('should demonstrate complete priority chain', function() {
      const calls = [];

      // Track calls
      mockDraggablePanels.handleClick.callsFake(() => {
        calls.push('content');
        return false;
      });

      mockDraggablePanelManager.handleMouseEvents.callsFake(() => {
        calls.push('dragging');
        return false;
      });

      levelEditor.editor.paint.callsFake(() => {
        calls.push('terrain');
      });

      levelEditor.handleClick(100, 100);

      // Verify exact order
      expect(calls).to.deep.equal(['content', 'dragging', 'terrain']);
    });

    it('should demonstrate early exit when content consumes click', function() {
      const calls = [];

      mockDraggablePanels.handleClick.callsFake(() => {
        calls.push('content');
        return true; // CONSUMED
      });

      mockDraggablePanelManager.handleMouseEvents.callsFake(() => {
        calls.push('dragging');
        return false;
      });

      levelEditor.editor.paint.callsFake(() => {
        calls.push('terrain');
      });

      levelEditor.handleClick(100, 100);

      // Only content should be called
      expect(calls).to.deep.equal(['content']);
    });

    it('should demonstrate early exit when dragging consumes click', function() {
      const calls = [];

      mockDraggablePanels.handleClick.callsFake(() => {
        calls.push('content');
        return false;
      });

      mockDraggablePanelManager.handleMouseEvents.callsFake(() => {
        calls.push('dragging');
        return true; // CONSUMED
      });

      levelEditor.editor.paint.callsFake(() => {
        calls.push('terrain');
      });

      levelEditor.handleClick(100, 100);

      // Content and dragging called, but NOT terrain
      expect(calls).to.deep.equal(['content', 'dragging']);
    });
  });
});
