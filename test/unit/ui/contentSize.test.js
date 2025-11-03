const { expect } = require('chai');
const MaterialPalette = require('../../../Classes/ui/MaterialPalette');
const ToolBar = require('../../../Classes/ui/ToolBar');
const BrushSizeControl = require('../../../Classes/ui/BrushSizeControl');

describe('Content Size Calculations', function() {
  
  describe('MaterialPalette.getContentSize()', function() {
    it('should calculate size for 2-column grid with 3 materials', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      const size = palette.getContentSize();
      
      // Width: 2 cols × 40px + 3 × 5px spacing = 80 + 15 = 95px
      expect(size.width).to.equal(95);
      
      // Height: 2 rows × (40px + 5px) + 5px top = 2×45 + 5 = 95px
      expect(size.height).to.equal(95);
    });
    
    it('should calculate size for 4 materials (2 rows)', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt', 'grass']);
      const size = palette.getContentSize();
      
      // Width: same as above
      expect(size.width).to.equal(95);
      
      // Height: 2 rows × (40px + 5px) + 5px top = 95px
      expect(size.height).to.equal(95);
    });
    
    it('should calculate size for 5 materials (3 rows)', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt', 'grass', 'water']);
      const size = palette.getContentSize();
      
      // Width: same
      expect(size.width).to.equal(95);
      
      // Height: 3 rows × (40px + 5px) + 5px top = 3×45 + 5 = 140px
      expect(size.height).to.equal(140);
    });
    
    it('should handle single material (1 row)', function() {
      const palette = new MaterialPalette(['moss']);
      const size = palette.getContentSize();
      
      // Width: same
      expect(size.width).to.equal(95);
      
      // Height: 1 row × (40px + 5px) + 5px top = 50px
      expect(size.height).to.equal(50);
    });
    
    it('should handle empty materials array', function() {
      const palette = new MaterialPalette([]);
      const size = palette.getContentSize();
      
      // Width: same structure
      expect(size.width).to.equal(95);
      
      // Height: 0 rows × (40px + 5px) + 5px top = 5px
      expect(size.height).to.equal(5);
    });
  });
  
  describe('ToolBar.getContentSize()', function() {
    it('should calculate size for default 7 tools', function() {
      const toolbar = new ToolBar();
      const size = toolbar.getContentSize();
      
      // Width: 35px + 2 × 5px spacing = 45px
      expect(size.width).to.equal(45);
      
      // Height: 7 tools × (35px + 5px) + 5px top = 7×40 + 5 = 285px
      expect(size.height).to.equal(285);
    });
    
    it('should calculate size for custom 4 tools', function() {
      const toolbar = new ToolBar([
        { name: 'tool1', icon: '🔧', tooltip: 'Tool 1' },
        { name: 'tool2', icon: '🔨', tooltip: 'Tool 2' },
        { name: 'tool3', icon: '✏️', tooltip: 'Tool 3' },
        { name: 'tool4', icon: '🖌️', tooltip: 'Tool 4' }
      ]);
      const size = toolbar.getContentSize();
      
      // Width: same
      expect(size.width).to.equal(45);
      
      // Height: 4 tools × (35px + 5px) + 5px top = 4×40 + 5 = 165px
      expect(size.height).to.equal(165);
    });
    
    it('should calculate size for single tool', function() {
      const toolbar = new ToolBar([
        { name: 'brush', icon: '🖌️', tooltip: 'Brush' }
      ]);
      const size = toolbar.getContentSize();
      
      // Width: same
      expect(size.width).to.equal(45);
      
      // Height: 1 tool × (35px + 5px) + 5px top = 45px
      expect(size.height).to.equal(45);
    });
  });
  
  describe('BrushSizeControl.getContentSize()', function() {
    it('should return fixed dimensions', function() {
      const control = new BrushSizeControl();
      const size = control.getContentSize();
      
      expect(size.width).to.equal(90);
      expect(size.height).to.equal(50);
    });
    
    it('should return same size regardless of brush size', function() {
      const control1 = new BrushSizeControl(1);
      const control2 = new BrushSizeControl(5);
      const control3 = new BrushSizeControl(9);
      
      const size1 = control1.getContentSize();
      const size2 = control2.getContentSize();
      const size3 = control3.getContentSize();
      
      expect(size1.width).to.equal(90);
      expect(size1.height).to.equal(50);
      expect(size2.width).to.equal(90);
      expect(size2.height).to.equal(50);
      expect(size3.width).to.equal(90);
      expect(size3.height).to.equal(50);
    });
    
    it('should return same size regardless of min/max bounds', function() {
      const control = new BrushSizeControl(3, 1, 15);
      const size = control.getContentSize();
      
      expect(size.width).to.equal(90);
      expect(size.height).to.equal(50);
    });
  });
});
