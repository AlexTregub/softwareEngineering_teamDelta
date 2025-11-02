/**
 * Integration Tests - EntityPalette Scrolling Integration
 * Tests for LevelEditorPanels → EntityPalette wheel event routing and scroll integration
 * 
 * TDD Red Phase: All tests should fail initially
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('EntityPalette Scrolling Integration', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    setupUITestEnvironment();
  });

  afterEach(function() {
    sandbox.restore();
    cleanupUITestEnvironment();
  });

  describe('LevelEditorPanels Wheel Event Routing', function() {
    it('should route wheel events to EntityPalette when visible', function() {
      const LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
      const EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette');
      
      const panels = new LevelEditorPanels();
      
      const entityPalette = new EntityPalette();
      entityPalette.containsPoint = sandbox.stub().returns(true);
      entityPalette.handleMouseWheel = sandbox.stub().returns(true);
      
      panels.entityPalettePanel = entityPalette;
      
      const result = panels.handleMouseWheel(10, 100, 100, 50, 50, 220);
      
      expect(entityPalette.handleMouseWheel.calledOnce).to.be.true;
      expect(result).to.be.true;
    });

    it('should pass correct parameters to EntityPalette.handleMouseWheel', function() {
      const LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
      const EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette');
      
      const panels = new LevelEditorPanels();
      
      const entityPalette = new EntityPalette();
      entityPalette.containsPoint = sandbox.stub().returns(true);
      entityPalette.handleMouseWheel = sandbox.stub().returns(true);
      
      panels.entityPalettePanel = entityPalette;
      
      const delta = 10;
      const mouseX = 100;
      const mouseY = 150;
      const panelX = 50;
      const panelY = 60;
      const panelWidth = 220;
      
      panels.handleMouseWheel(delta, mouseX, mouseY, panelX, panelY, panelWidth);
      
      const call = entityPalette.handleMouseWheel.getCall(0);
      expect(call.args[0]).to.equal(delta);
      expect(call.args[1]).to.equal(mouseX);
      expect(call.args[2]).to.equal(mouseY);
      expect(call.args[3]).to.equal(panelX);
      expect(call.args[4]).to.equal(panelY);
      expect(call.args[5]).to.equal(panelWidth);
    });

    it('should skip EntityPalette if not visible', function() {
      const LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
      const EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette');
      
      const panels = new LevelEditorPanels();
      
      const entityPalette = new EntityPalette();
      entityPalette.visible = false;
      entityPalette.handleMouseWheel = sandbox.stub();
      
      panels.entityPalettePanel = entityPalette;
      
      panels.handleMouseWheel(10, 100, 100, 50, 50, 220);
      
      expect(entityPalette.handleMouseWheel.called).to.be.false;
    });

    it('should continue to other panels if EntityPalette returns false', function() {
      const LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
      const EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette');
      
      const panels = new LevelEditorPanels();
      
      const entityPalette = new EntityPalette();
      entityPalette.containsPoint = sandbox.stub().returns(false);
      entityPalette.handleMouseWheel = sandbox.stub().returns(false);
      
      const materialPalette = {
        containsPoint: sandbox.stub().returns(true),
        handleMouseWheel: sandbox.stub().returns(true),
        visible: true
      };
      
      panels.entityPalettePanel = entityPalette;
      panels.materialPalettePanel = materialPalette;
      
      panels.handleMouseWheel(10, 100, 100, 50, 50, 220);
      
      // Should try other panels
      expect(materialPalette.handleMouseWheel.called).to.be.true;
    });
  });

  describe('Scroll Bounds Updates', function() {
    it('should update scroll bounds when category changes', function() {
      const EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette');
      
      const palette = new EntityPalette();
      sandbox.spy(palette, 'updateScrollBounds');
      
      palette.setCategory('entities');
      
      expect(palette.updateScrollBounds.calledOnce).to.be.true;
    });

    it('should update scroll bounds when custom entities change', function() {
      const EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette');
      
      const palette = new EntityPalette();
      palette.setCategory('custom');
      
      sandbox.spy(palette, 'updateScrollBounds');
      
      palette.addCustomEntity('Test', 'ant_worker', {});
      
      expect(palette.updateScrollBounds.calledOnce).to.be.true;
    });

    it('should update scroll bounds when search filter changes', function() {
      const EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette');
      
      const palette = new EntityPalette();
      palette.setCategory('custom');
      palette.addCustomEntity('Test Entity', 'ant_worker', {});
      
      sandbox.spy(palette, 'updateScrollBounds');
      
      palette.setSearchQuery('test');
      
      expect(palette.updateScrollBounds.calledOnce).to.be.true;
    });
  });

  describe('Scroll and Content Interaction', function() {
    it('should maintain scroll position when content height does not change', function() {
      const EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette');
      
      const palette = new EntityPalette();
      palette.setCategory('entities');
      palette.scrollOffset = 100;
      
      // Trigger render (should not reset scroll)
      palette.render(50, 50, 220);
      
      expect(palette.scrollOffset).to.equal(100);
    });

    it('should clamp scroll when switching to shorter content', function() {
      const EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette');
      
      const palette = new EntityPalette();
      palette.setCategory('entities'); // Long list
      palette.scrollOffset = 500; // Scrolled far down
      
      palette.setCategory('custom'); // Empty/short list
      
      // scrollOffset should be clamped to new maxScrollOffset
      expect(palette.scrollOffset).to.be.at.most(palette.maxScrollOffset);
    });

    it('should preserve scroll position within valid range', function() {
      const EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette');
      
      const palette = new EntityPalette();
      palette.setCategory('entities');
      palette.scrollOffset = 50;
      
      // Switch to another category with similar content
      palette.setCategory('buildings');
      
      // If 50 is still valid, it should be preserved
      // (Unless buildings has less content, then clamped)
      expect(palette.scrollOffset).to.be.at.most(palette.maxScrollOffset);
      expect(palette.scrollOffset).to.be.at.least(0);
    });
  });
});
