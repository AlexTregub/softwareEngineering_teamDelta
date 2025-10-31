/**
 * EntityPalette Click Handling Bug Fix Tests
 * Tests that CategoryRadioButtons and template clicks work via handleClick
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('EntityPalette Click Handling Bug Fix', function() {
  let dom, window, document;
  let EntityPalette, CategoryRadioButtons;
  let p5Mocks;

  beforeEach(function() {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

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

    delete require.cache[require.resolve('../../../Classes/ui/CategoryRadioButtons.js')];
    CategoryRadioButtons = require('../../../Classes/ui/CategoryRadioButtons.js');
    global.CategoryRadioButtons = CategoryRadioButtons;
    window.CategoryRadioButtons = CategoryRadioButtons;

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

  describe('CategoryRadioButtons Click Detection', function() {
    it('should detect click on entities button (left side)', function() {
      const palette = new EntityPalette();
      palette.setCategory('buildings'); // Start with buildings
      
      // Click on entities button (first button, left side)
      // Panel at (100, 50), click at (120, 70) = relative (20, 20)
      const result = palette.handleClick(120, 70, 100, 50, 300);
      
      expect(result).to.exist;
      expect(result.type).to.equal('category');
      expect(result.category).to.equal('entities');
    });

    it('should detect click on buildings button (middle)', function() {
      const palette = new EntityPalette();
      
      // Click on buildings button (middle button)
      // Panel at (100, 50), click at (200, 70) = relative (100, 20)
      const result = palette.handleClick(200, 70, 100, 50, 300);
      
      expect(result).to.exist;
      expect(result.type).to.equal('category');
      expect(result.category).to.equal('buildings');
    });

    it('should detect click on resources button (right side)', function() {
      const palette = new EntityPalette();
      
      // Click on resources button (third button, right side)
      // Panel width 300 / 3 buttons = 100px per button
      // Resources button: 200-300, so click at 250
      // Panel at (100, 50), click at (350, 70) = relative (250, 20)
      const result = palette.handleClick(350, 70, 100, 50, 300);
      
      expect(result).to.exist;
      expect(result.type).to.equal('category');
      expect(result.category).to.equal('resources');
    });
  });

  describe('Template Click Detection', function() {
    it('should detect click on first template (top-left)', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities');
      
      // Click first template at grid position (4, 54)
      // Panel at (100, 50), click at (104, 104) = relative (4, 54)
      const result = palette.handleClick(104, 104, 100, 50, 300);
      
      expect(result).to.exist;
      expect(result.type).to.equal('template');
      expect(result.template.id).to.equal('ant_worker');
    });

    it('should detect click on second template in row', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities');
      
      // Click second template (one swatch to the right)
      // Each swatch is 36px wide (32 + 4 padding)
      // Panel at (100, 50), click at (144, 104) = relative (44, 54)
      const result = palette.handleClick(144, 104, 100, 50, 300);
      
      expect(result).to.exist;
      expect(result.type).to.equal('template');
      expect(result.template.id).to.equal('ant_soldier');
    });
  });
});
