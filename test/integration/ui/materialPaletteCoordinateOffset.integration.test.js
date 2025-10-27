/**
 * Integration test to detect coordinate offset bug in MaterialPalette rendering
 * 
 * BUG: MaterialPalette textures render at wrong position because:
 * - LevelEditorPanels uses translate() + render(0,0)
 * - But TERRAIN_MATERIALS_RANGED render functions use absolute coordinates
 * - This causes textures to render at top-left instead of panel position
 * 
 * Expected behavior:
 * - Textures should render at contentArea.x + swatchX, contentArea.y + swatchY
 * - Not at swatchX, swatchY (ignoring the panel position)
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('MaterialPalette Coordinate Offset Bug Detection', function() {
  let sandbox;
  let mockP5;
  let materialPalette;
  let imageCallsSpy;
  let rectCallsSpy;
  let translateCalls;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    imageCallsSpy = [];
    rectCallsSpy = [];
    translateCalls = { x: 0, y: 0 };
    
    // Mock p5.js global functions
    mockP5 = {
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      strokeWeight: sandbox.stub(),
      noStroke: sandbox.stub(),
      imageMode: sandbox.stub(),
      rect: sandbox.stub().callsFake((x, y, w, h, r) => {
        // Record rect calls with current translate offset
        rectCallsSpy.push({ 
          x: x + translateCalls.x, 
          y: y + translateCalls.y, 
          w, h, r 
        });
      }),
      image: sandbox.stub().callsFake((img, x, y, w, h) => {
        // Record image calls - these use ABSOLUTE coords (ignoring translate)
        imageCallsSpy.push({ img, x, y, w, h });
      }),
      textAlign: sandbox.stub(),
      textSize: sandbox.stub(),
      text: sandbox.stub(),
      translate: sandbox.stub().callsFake((x, y) => {
        translateCalls.x += x;
        translateCalls.y += y;
      }),
      CENTER: 'center',
      CORNER: 'corner'
    };
    
    // Set globals
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.fill = mockP5.fill;
    global.stroke = mockP5.stroke;
    global.strokeWeight = mockP5.strokeWeight;
    global.noStroke = mockP5.noStroke;
    global.imageMode = mockP5.imageMode;
    global.rect = mockP5.rect;
    global.image = mockP5.image;
    global.textAlign = mockP5.textAlign;
    global.textSize = mockP5.textSize;
    global.text = mockP5.text;
    global.translate = mockP5.translate;
    global.CENTER = mockP5.CENTER;
    global.CORNER = mockP5.CORNER;
    
    // Sync to window for JSDOM
    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.stroke = global.stroke;
      window.strokeWeight = global.strokeWeight;
      window.noStroke = global.noStroke;
      window.imageMode = global.imageMode;
      window.rect = global.rect;
      window.image = global.image;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.text = global.text;
      window.translate = global.translate;
      window.CENTER = global.CENTER;
      window.CORNER = global.CORNER;
    }
    
    // Mock TERRAIN_MATERIALS_RANGED with render functions
    const MOSS_IMAGE = { name: 'moss.png' };
    const STONE_IMAGE = { name: 'stone.png' };
    const DIRT_IMAGE = { name: 'dirt.png' };
    
    global.TERRAIN_MATERIALS_RANGED = {
      'moss': [
        [0, 0.3],
        (x, y, size) => global.image(MOSS_IMAGE, x, y, size, size)
      ],
      'stone': [
        [0, 0.4],
        (x, y, size) => global.image(STONE_IMAGE, x, y, size, size)
      ],
      'dirt': [
        [0.4, 0.525],
        (x, y, size) => global.image(DIRT_IMAGE, x, y, size, size)
      ]
    };
    
    if (typeof window !== 'undefined') {
      window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
    }
    
    // Load MaterialPalette
    const MaterialPalette = require('../../../Classes/ui/MaterialPalette');
    materialPalette = new MaterialPalette(['moss', 'stone', 'dirt']);
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.TERRAIN_MATERIALS_RANGED;
    if (typeof window !== 'undefined') {
      delete window.TERRAIN_MATERIALS_RANGED;
    }
  });
  
  describe('Coordinate System Bug Detection (Regression Tests)', function() {
    it('should set imageMode to CORNER before rendering textures', function() {
      const panelX = 100;
      const panelY = 200;
      
      materialPalette.render(panelX, panelY);
      
      // Verify imageMode was called with CORNER
      expect(mockP5.imageMode.called).to.be.true;
      expect(mockP5.imageMode.calledWith('corner')).to.be.true;
    });
    
    it('should document that image() calls use absolute coordinates (not transformed)', function() {
      const panelX = 100;
      const panelY = 200;
      
      // If we were to use translate + render(0,0), textures would be offset
      mockP5.translate(panelX, panelY);
      materialPalette.render(0, 0);
      
      const firstImageCall = imageCallsSpy[0];
      
      // This documents the behavior: image() uses absolute coords
      // Texture renders at (5, 5) because it ignores translate()
      expect(firstImageCall.x).to.equal(5, 
        'image() uses absolute coords, not transformed coords'
      );
      expect(firstImageCall.y).to.equal(5, 
        'image() uses absolute coords, not transformed coords'
      );
    });
    
    it('should show that rect() calls DO respect translate() transformation', function() {
      const panelX = 100;
      const panelY = 200;
      
      // Simulate translate + render
      mockP5.translate(panelX, panelY);
      materialPalette.render(0, 0);
      
      // The highlight rectangle DOES work correctly
      const firstRectCall = rectCallsSpy[0];
      
      // rect() respects translate, so this works
      expect(firstRectCall.x).to.be.at.least(panelX, 
        'Rect X coordinate should include panel position'
      );
      expect(firstRectCall.y).to.be.at.least(panelY, 
        'Rect Y coordinate should include panel position'
      );
    });
    
    it('should demonstrate why we must use absolute coordinates (not translate)', function() {
      const panelX = 100;
      const panelY = 200;
      
      mockP5.translate(panelX, panelY);
      materialPalette.render(0, 0);
      
      // The first swatch has both a rect (highlight) and an image (texture)
      const firstRect = rectCallsSpy[0];
      const firstImage = imageCallsSpy[0];
      
      // They render at different positions when using translate
      const rectX = firstRect.x - 2; // rect is -2 for border
      const rectY = firstRect.y - 2;
      
      // This documents the mismatch - rect at ~103, image at 5
      expect(Math.abs(firstImage.x - rectX)).to.be.greaterThan(50, 
        'Image and rect have coordinate mismatch when using translate()'
      );
    });
  });
  
  describe('Correct Behavior - Passing Absolute Coordinates', function() {
    it('should render correctly when passed absolute coordinates directly', function() {
      const panelX = 100;
      const panelY = 200;
      
      // CORRECT approach - pass absolute coords directly (no translate)
      materialPalette.render(panelX, panelY);
      
      // Now textures should render at correct position
      const firstImageCall = imageCallsSpy[0];
      
      const expectedX = panelX + 5; // 105
      const expectedY = panelY + 5; // 205
      
      // This PASSES because we're using absolute coords
      expect(firstImageCall.x).to.equal(expectedX, 
        'Texture X coordinate should include panel position'
      );
      expect(firstImageCall.y).to.equal(expectedY, 
        'Texture Y coordinate should include panel position'
      );
    });
    
    it('should have all swatches rendered at correct absolute positions', function() {
      const panelX = 150;
      const panelY = 250;
      
      materialPalette.render(panelX, panelY);
      
      // Verify all 3 materials rendered
      expect(imageCallsSpy.length).to.equal(3, 'Should have 3 texture renders');
      
      // First swatch: (150+5, 250+5) = (155, 255)
      expect(imageCallsSpy[0].x).to.equal(155);
      expect(imageCallsSpy[0].y).to.equal(255);
      
      // Second swatch: same row, next column (155+45, 255) = (200, 255)
      expect(imageCallsSpy[1].x).to.equal(200);
      expect(imageCallsSpy[1].y).to.equal(255);
      
      // Third swatch: next row (155, 255+45) = (155, 300)
      expect(imageCallsSpy[2].x).to.equal(155);
      expect(imageCallsSpy[2].y).to.equal(300);
    });
  });
  
  describe('Real-world Scenario - LevelEditorPanels Integration (THE FIX)', function() {
    it('should pass with absolute coordinate approach (Option 1 fix - CURRENT CODE)', function() {
      // Fixed approach - pass absolute coords (this is what LevelEditorPanels now does)
      const contentArea = { x: 120, y: 180 };
      
      // Option 1 fix - DON'T use translate, pass absolute coords directly
      materialPalette.render(contentArea.x, contentArea.y);
      
      // CORRECT: Texture renders at (125, 185)
      const firstTexture = imageCallsSpy[0];
      
      // This PASSES with the fix
      expect(firstTexture.x).to.equal(contentArea.x + 5, 
        'Should render at panel position with absolute coords'
      );
      expect(firstTexture.y).to.equal(contentArea.y + 5, 
        'Should render at panel position with absolute coords'
      );
    });
    
    it('should render all panel content at correct positions', function() {
      const contentArea = { x: 120, y: 180 };
      
      materialPalette.render(contentArea.x, contentArea.y);
      
      // Verify all materials render at correct absolute positions
      expect(imageCallsSpy.length).to.equal(3);
      
      // First material at content area + spacing
      expect(imageCallsSpy[0].x).to.equal(125); // 120 + 5
      expect(imageCallsSpy[0].y).to.equal(185); // 180 + 5
      
      // Materials should be positioned correctly in grid
      expect(imageCallsSpy[1].x).to.be.greaterThan(contentArea.x);
      expect(imageCallsSpy[2].y).to.be.greaterThan(contentArea.y);
    });
  });
});
