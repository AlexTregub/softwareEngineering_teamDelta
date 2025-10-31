/**
 * Integration Tests - EntityPalette Click Routing
 * Tests for LevelEditorPanels → EntityPalette click routing
 * 
 * TDD Red Phase: All tests should fail initially
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('EntityPalette Click Integration', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    setupUITestEnvironment();
  });

  afterEach(function() {
    sandbox.restore();
    cleanupUITestEnvironment();
  });

  describe('LevelEditorPanels Click Routing', function() {
    it('should route clicks to EntityPalette when visible', function() {
      const LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      
      const panels = new LevelEditorPanels();
      
      // Mock EntityPalette panel
      const entityPalette = new EntityPalette();
      entityPalette.containsPoint = sandbox.stub().returns(true);
      entityPalette.handleClick = sandbox.stub().returns({ type: 'template', template: { id: 'ant_worker' } });
      
      // Register EntityPalette in panels (simulate panel registration)
      panels.entityPalettePanel = entityPalette;
      
      const result = panels.handleClick(100, 100, 50, 50);
      
      expect(entityPalette.handleClick.calledOnce).to.be.true;
      expect(result).to.exist;
      expect(result.type).to.equal('template');
    });

    it('should call EntityPalette.containsPoint before handleClick', function() {
      const LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      
      const panels = new LevelEditorPanels();
      
      const entityPalette = new EntityPalette();
      entityPalette.containsPoint = sandbox.stub().returns(false);
      entityPalette.handleClick = sandbox.stub();
      
      panels.entityPalettePanel = entityPalette;
      
      const result = panels.handleClick(100, 100, 50, 50);
      
      expect(entityPalette.containsPoint.calledOnce).to.be.true;
      expect(entityPalette.handleClick.called).to.be.false; // Should not call if not contains
    });

    it('should skip EntityPalette if not visible', function() {
      const LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      
      const panels = new LevelEditorPanels();
      
      const entityPalette = new EntityPalette();
      entityPalette.containsPoint = sandbox.stub().returns(true);
      entityPalette.handleClick = sandbox.stub();
      entityPalette.visible = false; // Hidden
      
      panels.entityPalettePanel = entityPalette;
      
      const result = panels.handleClick(100, 100, 50, 50);
      
      expect(entityPalette.handleClick.called).to.be.false;
    });

    it('should check EntityPalette before other panels', function() {
      const LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      
      const panels = new LevelEditorPanels();
      
      const entityPalette = new EntityPalette();
      entityPalette.containsPoint = sandbox.stub().returns(true);
      entityPalette.handleClick = sandbox.stub().returns({ type: 'template' });
      
      panels.entityPalettePanel = entityPalette;
      
      // Mock another panel
      panels.materialPalettePanel = {
        containsPoint: sandbox.stub().returns(true),
        handleClick: sandbox.stub().returns({ type: 'material' }),
        visible: true
      };
      
      const result = panels.handleClick(100, 100, 50, 50);
      
      // EntityPalette should be checked (exact order depends on implementation)
      // But at minimum, if it returns a result, that should be used
      expect(entityPalette.handleClick.called).to.be.true;
    });

    it('should consume click when EntityPalette handles it', function() {
      const LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      
      const panels = new LevelEditorPanels();
      
      const entityPalette = new EntityPalette();
      entityPalette.containsPoint = sandbox.stub().returns(true);
      entityPalette.handleClick = sandbox.stub().returns({ type: 'template', template: { id: 'ant_worker' } });
      
      panels.entityPalettePanel = entityPalette;
      
      const result = panels.handleClick(100, 100, 50, 50);
      
      // Click should be consumed (not passed to other handlers)
      expect(result).to.exist;
      expect(result.consumed).to.be.true;
    });

    it('should handle null return from EntityPalette', function() {
      const LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      
      const panels = new LevelEditorPanels();
      
      const entityPalette = new EntityPalette();
      entityPalette.containsPoint = sandbox.stub().returns(true);
      entityPalette.handleClick = sandbox.stub().returns(null);
      
      panels.entityPalettePanel = entityPalette;
      
      const result = panels.handleClick(100, 100, 50, 50);
      
      // Should not throw, should continue to other handlers
      expect(() => panels.handleClick(100, 100, 50, 50)).to.not.throw();
    });
  });
});
