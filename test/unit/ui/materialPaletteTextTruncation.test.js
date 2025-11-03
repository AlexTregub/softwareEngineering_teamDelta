/**
 * Unit Tests: MaterialPalette Text Truncation Bug Fix
 * 
 * Tests to verify material names are not truncated prematurely.
 * Bug: "stone" appearing as "ston" due to 4-character limit
 * 
 * TDD Approach:
 * 1. Write failing test
 * 2. Fix the truncation logic
 * 3. Verify test passes
 */

const { expect } = require('chai');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('MaterialPalette - Text Truncation Bug Fix', function() {
  let MaterialPalette;
  let palette;

  beforeEach(function() {
    setupUITestEnvironment();

    // Load MaterialPalette
    MaterialPalette = require('../../../Classes/ui/MaterialPalette');

    // Create palette with test materials
    palette = new MaterialPalette(['moss', 'stone', 'dirt', 'grass']);
  });

  afterEach(function() {
    cleanupUITestEnvironment();
  });

  describe('Bug: Material Names Truncated Too Early', function() {
    it('should NOT truncate "stone" to "ston"', function() {
      // Render the palette
      palette.render(10, 10);

      // Find all text() calls
      const textCalls = global.text.getCalls();

      // Find the call that should render "stone"
      const stoneCalls = textCalls.filter(call => {
        const arg = call.args[0];
        return typeof arg === 'string' && arg.toLowerCase().includes('ston');
      });

      // Verify "stone" is rendered in full, not truncated
      expect(stoneCalls.length).to.be.greaterThan(0, 'Should have rendered stone material name');
      
      const stoneText = stoneCalls[0].args[0];
      expect(stoneText).to.equal('stone', 'Material name should be "stone", not truncated to "ston"');
    });

    it('should NOT truncate "grass" to "gras"', function() {
      palette.render(10, 10);

      const textCalls = global.text.getCalls();
      const grassCalls = textCalls.filter(call => {
        const arg = call.args[0];
        return typeof arg === 'string' && arg.toLowerCase().includes('gras');
      });

      expect(grassCalls.length).to.be.greaterThan(0, 'Should have rendered grass material name');
      
      const grassText = grassCalls[0].args[0];
      expect(grassText).to.equal('grass', 'Material name should be "grass", not truncated to "gras"');
    });

    it('should render full material names for all materials', function() {
      const materials = ['moss', 'stone', 'dirt', 'grass', 'water', 'sand'];
      const testPalette = new MaterialPalette(materials);
      
      testPalette.render(10, 10);

      const textCalls = global.text.getCalls();

      // Verify each material name is rendered in full
      materials.forEach(material => {
        const materialCalls = textCalls.filter(call => {
          const arg = call.args[0];
          return arg === material;
        });

        expect(materialCalls.length).to.equal(1, 
          `Material "${material}" should be rendered exactly once in full`);
      });
    });

    it('should handle longer material names without truncation', function() {
      const longMaterials = ['stone_variant_1', 'moss_dark_green', 'dirt_clay_mix'];
      const testPalette = new MaterialPalette(longMaterials);
      
      testPalette.render(10, 10);

      const textCalls = global.text.getCalls();

      // Verify long names are rendered in full (not just first 4 chars)
      longMaterials.forEach(material => {
        const materialCalls = textCalls.filter(call => {
          const arg = call.args[0];
          return arg === material;
        });

        expect(materialCalls.length).to.equal(1, 
          `Long material name "${material}" should be rendered in full`);
      });
    });

    it('should use appropriate text size for readability', function() {
      palette.render(10, 10);

      const textSizeCalls = global.textSize.getCalls();

      // Verify textSize was called with a readable size (not too small)
      expect(textSizeCalls.length).to.be.greaterThan(0, 'Should set text size');
      
      const sizes = textSizeCalls.map(call => call.args[0]);
      const minSize = Math.min(...sizes);
      
      expect(minSize).to.be.at.least(8, 
        'Text size should be at least 8px for readability');
    });
  });

  describe('Text Rendering Properties', function() {
    it('should center-align text on material swatches', function() {
      palette.render(10, 10);

      const textAlignCalls = global.textAlign.getCalls();
      
      expect(textAlignCalls.length).to.be.greaterThan(0, 'Should set text alignment');
      
      // Verify CENTER alignment was used
      const hasCenterAlign = textAlignCalls.some(call => {
        const args = call.args;
        // Check for CENTER constant or 'center' string
        return args.some(arg => 
          arg === 'CENTER' || arg === 'center' || arg === global.CENTER ||
          (typeof arg === 'number' && arg === 0) // CENTER constant value
        );
      });

      expect(hasCenterAlign).to.be.true;
    });

    it('should use white fill color for text visibility', function() {
      palette.render(10, 10);

      const fillCalls = global.fill.getCalls();

      // Find fill calls that set white color (before text rendering)
      const whiteFillCalls = fillCalls.filter(call => {
        const args = call.args;
        // Check for fill(255) or fill(255, 255, 255)
        return (args.length === 1 && args[0] === 255) ||
               (args.length === 3 && args[0] === 255 && args[1] === 255 && args[2] === 255);
      });

      expect(whiteFillCalls.length).to.be.greaterThan(0, 
        'Should use white fill for text visibility against material colors');
    });
  });

  describe('Edge Cases', function() {
    it('should handle empty material names gracefully', function() {
      const testPalette = new MaterialPalette(['', 'moss', 'stone']);
      
      expect(() => testPalette.render(10, 10)).to.not.throw();
    });

    it('should handle single-character material names', function() {
      const testPalette = new MaterialPalette(['m', 's', 'd']);
      
      testPalette.render(10, 10);

      const textCalls = global.text.getCalls();
      const singleCharCalls = textCalls.filter(call => 
        typeof call.args[0] === 'string' && call.args[0].length === 1
      );

      expect(singleCharCalls.length).to.be.at.least(3, 
        'Should render single-character names without truncation');
    });

    it('should handle very long material names', function() {
      const longName = 'super_ultra_mega_long_material_name_variant_dark';
      const testPalette = new MaterialPalette([longName]);
      
      testPalette.render(10, 10);

      const textCalls = global.text.getCalls();
      const longNameCalls = textCalls.filter(call => call.args[0] === longName);

      expect(longNameCalls.length).to.equal(1, 
        'Should render very long name in full (may need ellipsis in future)');
    });
  });
});
