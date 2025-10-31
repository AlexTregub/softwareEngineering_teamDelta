/**
 * EntityPalette UI Rendering Tests
 * Tests for CategoryRadioButtons integration and template grid rendering
 * TDD Red Phase: These tests should FAIL initially
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('EntityPalette UI Rendering', function() {
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

    // Mock p5.js drawing functions
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

    // Assign to both global and window
    Object.keys(p5Mocks).forEach(key => {
      global[key] = p5Mocks[key];
      window[key] = p5Mocks[key];
    });

    // Load CategoryRadioButtons
    delete require.cache[require.resolve('../../../Classes/ui/CategoryRadioButtons.js')];
    CategoryRadioButtons = require('../../../Classes/ui/CategoryRadioButtons.js');
    global.CategoryRadioButtons = CategoryRadioButtons;
    window.CategoryRadioButtons = CategoryRadioButtons;

    // Load EntityPalette
    delete require.cache[require.resolve('../../../Classes/ui/EntityPalette.js')];
    EntityPalette = require('../../../Classes/ui/EntityPalette.js');
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
    it('should create CategoryRadioButtons instance in constructor', function() {
      const palette = new EntityPalette();
      
      expect(palette.categoryButtons).to.exist;
      expect(palette.categoryButtons).to.be.instanceOf(CategoryRadioButtons);
    });

    it('should pass onChange callback to CategoryRadioButtons', function() {
      const palette = new EntityPalette();
      
      // Change category via CategoryRadioButtons
      palette.categoryButtons.select('buildings');
      
      // Verify EntityPalette's category updated
      expect(palette.getCategory()).to.equal('buildings');
    });

    it('should clear selected template when category changes', function() {
      const palette = new EntityPalette();
      
      // Select a template
      palette.selectTemplate('ant_worker');
      expect(palette.getSelectedTemplateId()).to.equal('ant_worker');
      
      // Change category
      palette.setCategory('buildings');
      
      // Selected template should be cleared
      expect(palette.getSelectedTemplateId()).to.be.null;
    });
  });

  describe('render() Method', function() {
    it('should call categoryButtons.render() with correct parameters', function() {
      const palette = new EntityPalette();
      const renderSpy = sinon.spy(palette.categoryButtons, 'render');
      
      palette.render(100, 50, 300, 400);
      
      expect(renderSpy.calledOnce).to.be.true;
      expect(renderSpy.calledWith(100, 50, 300)).to.be.true;
    });

    it('should render template grid below CategoryRadioButtons', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities');
      
      palette.render(100, 50, 300, 400);
      
      // Should draw rectangles for templates (7 entity templates)
      // Each template: 1 fill + 1 stroke + 1 strokeWeight + 1 rect + 1 text
      const rectCalls = p5Mocks.rect.getCalls().filter(call => {
        const y = call.args[1];
        return y >= 50 + 30; // Below radio buttons (50px offset + 30px buttons)
      });
      
      expect(rectCalls.length).to.be.at.least(7); // 7 entity templates
    });

    it('should highlight selected template with yellow background', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities');
      palette.selectTemplate('ant_worker');
      
      p5Mocks.fill.resetHistory();
      palette.render(100, 50, 300, 400);
      
      // Should have called fill with yellow/gold color for selected template
      const fillCalls = p5Mocks.fill.getCalls();
      const hasYellowFill = fillCalls.some(call => {
        const color = call.args[0];
        return color === '#FFD700' || color === 'yellow' || color === '#FFA500';
      });
      
      expect(hasYellowFill).to.be.true;
    });

    it('should calculate correct column count based on width', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities'); // 7 templates
      
      // Width 300 = floor(300 / 36) = 8 columns
      palette.render(0, 0, 300, 400);
      
      const rectCalls = p5Mocks.rect.getCalls().filter(call => {
        const y = call.args[1];
        return y >= 30 + 4; // Template grid area (30px buttons + 4px padding)
      });
      
      // 7 templates should be rendered
      expect(rectCalls.length).to.be.at.least(7);
    });

    it('should render text labels for templates', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities');
      
      p5Mocks.text.resetHistory();
      palette.render(100, 50, 300, 400);
      
      // Should render template names (first 3 chars)
      const textCalls = p5Mocks.text.getCalls();
      const templateTextCalls = textCalls.filter(call => {
        const text = call.args[0];
        return typeof text === 'string' && text.length <= 3;
      });
      
      expect(templateTextCalls.length).to.be.at.least(7); // 7 entity templates
    });

    it('should handle zero templates gracefully', function() {
      const palette = new EntityPalette();
      // Override templates to return empty array
      sinon.stub(palette, 'getCurrentTemplates').returns([]);
      
      expect(() => {
        palette.render(100, 50, 300, 400);
      }).to.not.throw();
      
      // Should still render CategoryRadioButtons
      expect(p5Mocks.push.called).to.be.true;
      expect(p5Mocks.pop.called).to.be.true;
    });
  });

  describe('handleClick() Method', function() {
    it('should delegate to CategoryRadioButtons for top 50px', function() {
      const palette = new EntityPalette();
      const handleClickSpy = sinon.spy(palette.categoryButtons, 'handleClick');
      
      // Click in CategoryRadioButtons area (y < 50)
      palette.handleClick(150, 25, 100, 50, 300);
      
      expect(handleClickSpy.calledOnce).to.be.true;
    });

    it('should return null for empty space clicks', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities');
      
      // Click far outside template grid
      const result = palette.handleClick(500, 500, 100, 50, 300);
      
      expect(result).to.be.null;
    });

    it('should select correct template based on grid position', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities');
      
      // Click first template (top-left of grid)
      // Panel at (100, 50), click at (104, 104) = relative (4, 54)
      const result = palette.handleClick(104, 104, 100, 50, 300);
      
      expect(result).to.exist;
      expect(result.type).to.equal('template');
      expect(result.template).to.exist;
      expect(result.template.id).to.equal('ant_worker'); // First entity template
    });

    it('should update _selectedTemplateId when template clicked', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities');
      
      // Click first template
      palette.handleClick(104, 104, 100, 50, 300);
      
      expect(palette.getSelectedTemplateId()).to.equal('ant_worker');
    });

    it('should return category change when CategoryRadioButtons clicked', function() {
      const palette = new EntityPalette();
      
      // Mock CategoryRadioButtons.handleClick to return an object with id
      sinon.stub(palette.categoryButtons, 'handleClick').returns({ id: 'buildings' });
      
      const result = palette.handleClick(150, 25, 100, 50, 300);
      
      expect(result).to.exist;
      expect(result.type).to.equal('category');
      expect(result.category).to.equal('buildings');
    });
  });

  describe('getContentSize() Method', function() {
    it('should return correct height based on template count', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities'); // 7 templates
      
      const size = palette.getContentSize(300); // width 300
      
      // Height = 30 (radio buttons) + rows * 36 + 8 (padding)
      // Cols = floor(300 / 36) = 8
      // Rows = ceil(7 / 8) = 1
      // Height = 30 + 1 * 36 + 8 = 74
      expect(size.height).to.equal(74);
    });

    it('should handle multiple rows correctly', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities'); // 7 templates
      
      // Narrow width forces multiple rows
      const size = palette.getContentSize(144); // floor(144/36) = 4 cols
      
      // 7 templates / 4 cols = 2 rows
      // Height = 30 + 2 * 36 + 8 = 110
      expect(size.height).to.equal(110);
    });

    it('should update when category changes', function() {
      const palette = new EntityPalette();
      
      palette.setCategory('entities'); // 7 templates
      const entitiesSize = palette.getContentSize(300);
      
      palette.setCategory('buildings'); // 3 templates
      const buildingsSize = palette.getContentSize(300);
      
      // Both should have same height (1 row each) but method should handle it
      expect(entitiesSize.height).to.be.a('number');
      expect(buildingsSize.height).to.be.a('number');
    });
  });
});
