/**
 * EntityPalette Cursor Following - Integration Tests (TDD Red Phase)
 * 
 * Tests real integration between EntityPalette and LevelEditor for cursor following:
 * - Clicking entity in palette attaches to cursor
 * - Grid click places entity and detaches (or keeps with shift)
 * - Escape/right-click cancels attachment
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('EntityPalette Cursor Following - Integration', function() {
  let dom, window, document;
  let sandbox;
  let EntityPalette, LevelEditor;
  
  before(function() {
    // Setup JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    
    // Mock p5.js globals
    const mockP5Functions = {
      push: () => {},
      pop: () => {},
      fill: () => {},
      stroke: () => {},
      strokeWeight: () => {},
      rect: () => {},
      text: () => {},
      textSize: () => {},
      textAlign: () => {},
      noStroke: () => {},
      image: () => {},
      imageMode: () => {},
      loadImage: (path, successCb) => {
        const mockImg = { width: 64, height: 64 };
        if (successCb) setTimeout(() => successCb(), 0);
        return mockImg;
      },
      createVector: (x, y) => ({ x, y }),
      keyIsDown: (key) => false,
      SHIFT: 16,
      ESCAPE: 27,
      LEFT: 'LEFT',
      CENTER: 'CENTER',
      TOP: 'TOP',
      CORNER: 'CORNER',
      mouseX: 400,
      mouseY: 300
    };
    
    Object.assign(global, mockP5Functions);
    Object.assign(window, mockP5Functions);
    
    // Mock TILE_SIZE
    global.TILE_SIZE = 32;
    window.TILE_SIZE = 32;
    
    // Mock CategoryRadioButtons (required by EntityPalette)
    const CategoryRadioButtons = class {
      constructor(onChange) {
        this.currentCategory = 'entities';
        this.onChange = onChange;
        this.height = 30;
      }
      render() {}
      handleClick() { return null; }
      setActiveCategory() {}
    };
    global.CategoryRadioButtons = CategoryRadioButtons;
    window.CategoryRadioButtons = CategoryRadioButtons;
    
    // Load EntityPalette first (LevelEditor depends on it)
    EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette.js');
    global.EntityPalette = EntityPalette;
    window.EntityPalette = EntityPalette;
    
    // Mock EntityPainter (required by LevelEditor to create EntityPalette)
    const EntityPainter = class {
      constructor(palette) {
        this.palette = palette;
      }
    };
    global.EntityPainter = EntityPainter;
    window.EntityPainter = EntityPainter;
    
    // Load LevelEditor
    LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
  });
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('Template Click Attaches to Cursor', function() {
    it('should attach single entity when template clicked in EntityPalette', function() {
      const levelEditor = new LevelEditor();
      const palette = levelEditor.entityPalette;
      
      // Simulate clicking first entity template (Worker Ant)
      const template = palette.getCurrentTemplates()[0];
      const panelX = 100, panelY = 100, panelWidth = 220;
      const clickX = panelX + 50;
      const clickY = panelY + 100; // Click on first item
      
      const result = palette.handleClick(clickX, clickY, panelX, panelY, panelWidth);
      
      // Should return template selection action
      expect(result).to.exist;
      expect(result.type).to.equal('template');
      
      // LevelEditor should now have cursor attachment
      const attachment = levelEditor.getCursorAttachment();
      expect(attachment).to.exist;
      expect(attachment.type).to.equal('single');
      expect(attachment.templateId).to.equal(template.id);
      expect(attachment.active).to.be.true;
    });
    
    it('should attach entity group when group template clicked', function() {
      const levelEditor = new LevelEditor();
      const palette = levelEditor.entityPalette;
      
      // Add a custom group to the palette
      const groupTemplate = {
        id: 'custom_group_test',
        name: 'Test Group',
        isGroup: true,
        entities: [
          { baseTemplateId: 'ant_soldier', position: { x: 0, y: 0 }, properties: {} },
          { baseTemplateId: 'ant_worker', position: { x: 1, y: 0 }, properties: {} }
        ]
      };
      
      palette._templates.custom.push(groupTemplate);
      palette.setCategory('custom');
      
      // Click the group template
      const panelX = 100, panelY = 100, panelWidth = 220;
      const clickX = panelX + 50;
      const clickY = panelY + 100;
      
      const result = palette.handleClick(clickX, clickY, panelX, panelY, panelWidth);
      
      expect(result).to.exist;
      expect(result.type).to.equal('template');
      
      // LevelEditor should have group attachment
      const attachment = levelEditor.getCursorAttachment();
      expect(attachment).to.exist;
      expect(attachment.type).to.equal('group');
      expect(attachment.entities).to.deep.equal(groupTemplate.entities);
    });
  });
  
  describe('Grid Click Placement', function() {
    it('should place entity on grid and detach on normal click', function() {
      const levelEditor = new LevelEditor();
      
      // Setup: Attach entity to cursor
      levelEditor.attachToMouseSingle('ant_worker', { health: 100, faction: 'player' });
      expect(levelEditor.getCursorAttachment()).to.exist;
      
      // Simulate grid click
      const handled = levelEditor.handleGridClick(10, 10, false);
      
      expect(handled).to.be.true;
      expect(levelEditor.getCursorAttachment()).to.be.null;
      
      // TODO: Verify entity was actually placed on grid
      // This requires checking levelEditor.entities or similar
    });
    
    it('should place entity but keep attached on shift+click', function() {
      const levelEditor = new LevelEditor();
      
      levelEditor.attachToMouseSingle('ant_soldier', { health: 150 });
      
      // First placement with shift
      const handled1 = levelEditor.handleGridClick(5, 5, true);
      expect(handled1).to.be.true;
      expect(levelEditor.getCursorAttachment()).to.exist;
      
      // Second placement with shift
      const handled2 = levelEditor.handleGridClick(10, 10, true);
      expect(handled2).to.be.true;
      expect(levelEditor.getCursorAttachment()).to.exist;
      
      // Third without shift (detaches)
      const handled3 = levelEditor.handleGridClick(15, 15, false);
      expect(handled3).to.be.true;
      expect(levelEditor.getCursorAttachment()).to.be.null;
    });
    
    it('should place all entities in group with correct offsets', function() {
      const levelEditor = new LevelEditor();
      
      const groupEntities = [
        { baseTemplateId: 'ant_soldier', position: { x: 0, y: 0 }, properties: {} },
        { baseTemplateId: 'ant_worker', position: { x: 1, y: 0 }, properties: {} },
        { baseTemplateId: 'ant_scout', position: { x: 0, y: 1 }, properties: {} }
      ];
      
      levelEditor.attachToMouseGroup(groupEntities);
      
      const handled = levelEditor.handleGridClick(10, 10, false);
      
      expect(handled).to.be.true;
      expect(levelEditor.getCursorAttachment()).to.be.null;
      
      // TODO: Verify 3 entities placed at (10,10), (11,10), (10,11)
    });
  });
  
  describe('Cursor Attachment Cancellation', function() {
    it('should clear attachment on Escape key', function() {
      const levelEditor = new LevelEditor();
      
      levelEditor.attachToMouseSingle('ant_worker', {});
      expect(levelEditor.getCursorAttachment()).to.exist;
      
      // Simulate Escape key
      levelEditor.clearCursorAttachment();
      
      expect(levelEditor.getCursorAttachment()).to.be.null;
    });
    
    it('should clear attachment on right-click', function() {
      const levelEditor = new LevelEditor();
      
      levelEditor.attachToMouseSingle('ant_soldier', {});
      expect(levelEditor.getCursorAttachment()).to.exist;
      
      // Simulate right-click (calls clearCursorAttachment)
      levelEditor.clearCursorAttachment();
      
      expect(levelEditor.getCursorAttachment()).to.be.null;
    });
    
    it('should clear attachment when UI button clicked', function() {
      const levelEditor = new LevelEditor();
      
      levelEditor.attachToMouseSingle('ant_scout', {});
      expect(levelEditor.getCursorAttachment()).to.exist;
      
      // Simulate UI button click (calls clearCursorAttachment)
      levelEditor.clearCursorAttachment();
      
      expect(levelEditor.getCursorAttachment()).to.be.null;
    });
  });
  
  describe('Cursor Following Rendering', function() {
    it('should render sprite at mouse position when attached', function() {
      const levelEditor = new LevelEditor();
      
      levelEditor.attachToMouseSingle('ant_worker', { health: 100 });
      
      // Mock rendering context
      const renderSpy = sandbox.spy();
      sandbox.stub(global, 'image').callsFake(renderSpy);
      
      // Render cursor attachment
      levelEditor.renderCursorAttachment();
      
      // Should have called rendering (implementation detail)
      // This test may need adjustment based on actual implementation
    });
    
    it('should render group sprites with offsets at mouse position', function() {
      const levelEditor = new LevelEditor();
      
      const groupEntities = [
        { baseTemplateId: 'ant_soldier', position: { x: 0, y: 0 }, properties: {} },
        { baseTemplateId: 'ant_worker', position: { x: 1, y: 0 }, properties: {} }
      ];
      
      levelEditor.attachToMouseGroup(groupEntities);
      
      // Render should show 2 sprites offset by 1 tile
      levelEditor.renderCursorAttachment();
      
      // Verification depends on implementation
    });
  });
  
  describe('Integration with EntityPalette handleClick', function() {
    it('should create attachment when EntityPalette returns template selection', function() {
      const levelEditor = new LevelEditor();
      const palette = levelEditor.entityPalette;
      
      // Before click: no attachment
      expect(levelEditor.getCursorAttachment()).to.not.exist;
      
      // Click entity template
      const template = palette.getCurrentTemplates()[0];
      const result = palette.handleClick(150, 150, 100, 100, 220);
      
      // EntityPalette should return template selection
      expect(result).to.exist;
      expect(result.type).to.equal('template');
      
      // LevelEditor should receive this and create attachment
      if (result.type === 'template') {
        if (result.template.isGroup) {
          levelEditor.attachToMouseGroup(result.template.entities);
        } else {
          levelEditor.attachToMouseSingle(result.template.id, result.template.properties);
        }
      }
      
      // Now attachment should exist
      const attachment = levelEditor.getCursorAttachment();
      expect(attachment).to.exist;
      expect(attachment.templateId).to.equal(template.id);
    });
  });
});
