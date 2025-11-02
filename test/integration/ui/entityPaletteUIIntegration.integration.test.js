/**
 * EntityPalette UI Integration Tests
 * Tests CategoryRadioButtons + EntityPalette integration with real components
 * TDD Phase 3: Integration testing with real dependencies
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('EntityPalette UI Integration', function() {
  let dom, window, document;
  let EntityPalette, CategoryRadioButtons;
  let p5Mocks;

  beforeEach(function() {
    // Setup JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock p5.js drawing functions (real rendering in integration)
    p5Mocks = {
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textSize: sinon.stub(),
      textAlign: sinon.stub(),
      CENTER: 'center',
      LEFT: 'left',
      image: sinon.stub()
    };

    Object.keys(p5Mocks).forEach(key => {
      global[key] = p5Mocks[key];
      window[key] = p5Mocks[key];
    });

    // Load REAL CategoryRadioButtons (not mocked)
    delete require.cache[require.resolve('../../../Classes/ui/CategoryRadioButtons.js')];
    CategoryRadioButtons = require('../../../Classes/ui/UIComponents/radioButton/CategoryRadioButtons.js');
    global.CategoryRadioButtons = CategoryRadioButtons;
    window.CategoryRadioButtons = CategoryRadioButtons;

    // Load REAL EntityPalette
    delete require.cache[require.resolve('../../../Classes/ui/painter/entity/EntityPalette.js')];
    EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette.js');
  });

  afterEach(function() {
    sinon.restore();
    delete global.window;
    delete global.document;
    Object.keys(p5Mocks).forEach(key => {
      delete global[key];
    });
  });

  describe('CategoryRadioButtons Integration', function() {
    it('should change EntityPalette category when CategoryRadioButtons clicked', function() {
      const palette = new EntityPalette();
      expect(palette.getCategory()).to.equal('entities');

      // Simulate clicking the buildings button
      palette.categoryButtons.select('buildings');

      expect(palette.getCategory()).to.equal('buildings');
      expect(palette.categoryButtons.getSelected()).to.equal('buildings');
    });

    it('should clear selected template when category changes', function() {
      const palette = new EntityPalette();
      
      // Select a template in entities category
      palette.selectTemplate('ant_worker');
      expect(palette.getSelectedTemplateId()).to.equal('ant_worker');

      // Change to buildings category
      palette.categoryButtons.select('buildings');

      // Selected template should be cleared
      expect(palette.getSelectedTemplateId()).to.be.null;
    });

    it('should update template list when category changes', function() {
      const palette = new EntityPalette();
      
      const entitiesTemplates = palette.getCurrentTemplates();
      expect(entitiesTemplates.length).to.equal(7); // 7 ant templates

      palette.categoryButtons.select('buildings');
      const buildingsTemplates = palette.getCurrentTemplates();
      expect(buildingsTemplates.length).to.equal(3); // 3 building templates

      palette.categoryButtons.select('resources');
      const resourcesTemplates = palette.getCurrentTemplates();
      expect(resourcesTemplates.length).to.equal(4); // 4 resource templates
    });
  });

  describe('Template Selection Integration', function() {
    it('should update selected template when handleClick detects click', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities');

      // Click first template at (104, 104) with panel at (100, 50)
      const result = palette.handleClick(104, 104, 100, 50, 300);

      expect(result).to.exist;
      expect(result.type).to.equal('template');
      expect(palette.getSelectedTemplateId()).to.equal('ant_worker');
    });

    it('should handle multiple clicks on same template without errors', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities');

      // Click same template multiple times
      palette.handleClick(104, 104, 100, 50, 300);
      palette.handleClick(104, 104, 100, 50, 300);
      palette.handleClick(104, 104, 100, 50, 300);

      expect(palette.getSelectedTemplateId()).to.equal('ant_worker');
      expect(palette.hasSelection()).to.be.true;
    });

    it('should return null when clicking outside template grid', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities');

      // Click far outside grid
      const result = palette.handleClick(500, 500, 100, 50, 300);

      expect(result).to.be.null;
    });
  });

  describe('Panel Auto-Sizing Integration', function() {
    it('should auto-resize panel when category changes (different template counts)', function() {
      const palette = new EntityPalette();
      
      palette.setCategory('entities'); // 7 templates
      const entitiesSize = palette.getContentSize(300);

      palette.setCategory('buildings'); // 3 templates
      const buildingsSize = palette.getContentSize(300);

      palette.setCategory('resources'); // 4 templates
      const resourcesSize = palette.getContentSize(300);

      // All should fit in 1 row with width 300 (8 columns)
      // Height = 30 + 1 * 36 + 8 = 74
      expect(entitiesSize.height).to.equal(74);
      expect(buildingsSize.height).to.equal(74);
      expect(resourcesSize.height).to.equal(74);
    });

    it('should calculate different heights for narrow panels (multiple rows)', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities'); // 7 templates

      // Narrow width forces 2 rows: floor(144/36) = 4 cols, ceil(7/4) = 2 rows
      const narrowSize = palette.getContentSize(144);
      // Height = 30 + 2 * 36 + 8 = 110
      expect(narrowSize.height).to.equal(110);

      // Wide width fits 1 row: floor(300/36) = 8 cols, ceil(7/8) = 1 row
      const wideSize = palette.getContentSize(300);
      // Height = 30 + 1 * 36 + 8 = 74
      expect(wideSize.height).to.equal(74);
    });
  });

  describe('Rendering Integration', function() {
    it('should render CategoryRadioButtons and template grid together', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities');

      p5Mocks.rect.resetHistory();
      palette.render(100, 50, 300, 400);

      // Should have rendered rectangles for templates
      const rectCalls = p5Mocks.rect.getCalls();
      expect(rectCalls.length).to.be.at.least(7); // At least 7 entity templates
    });

    it('should work with all 3 categories rendering correctly', function() {
      const palette = new EntityPalette();

      // Test entities
      palette.setCategory('entities');
      p5Mocks.rect.resetHistory();
      palette.render(100, 50, 300, 400);
      expect(p5Mocks.rect.getCalls().length).to.be.at.least(7);

      // Test buildings
      palette.setCategory('buildings');
      p5Mocks.rect.resetHistory();
      palette.render(100, 50, 300, 400);
      expect(p5Mocks.rect.getCalls().length).to.be.at.least(3);

      // Test resources
      palette.setCategory('resources');
      p5Mocks.rect.resetHistory();
      palette.render(100, 50, 300, 400);
      expect(p5Mocks.rect.getCalls().length).to.be.at.least(4);
    });

    it('should persist selection state across renders', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities');
      palette.selectTemplate('ant_soldier');

      // Render multiple times
      palette.render(100, 50, 300, 400);
      palette.render(100, 50, 300, 400);
      palette.render(100, 50, 300, 400);

      // Selection should persist
      expect(palette.getSelectedTemplateId()).to.equal('ant_soldier');
      expect(palette.hasSelection()).to.be.true;
    });
  });
});
