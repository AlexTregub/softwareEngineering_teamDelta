/**
 * Entity Palette Panel Sizing Tests
 * 
 * Tests to verify:
 * 1. Panel height is constrained (not auto-sizing to full content)
 * 2. getContentSize() returns limited height to enable scrolling
 * 3. Scrolling activates when content exceeds viewport
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock p5.js globally
global.color = sinon.stub().returns({ levels: [0, 0, 0, 255] });
global.push = sinon.stub();
global.pop = sinon.stub();
global.fill = sinon.stub();
global.stroke = sinon.stub();
global.noStroke = sinon.stub();
global.strokeWeight = sinon.stub();
global.rect = sinon.stub();
global.textAlign = sinon.stub();
global.textSize = sinon.stub();
global.text = sinon.stub();
global.image = sinon.stub();
global.createVector = sinon.stub().callsFake((x, y) => ({ x, y, mag: () => 0 }));
global.LEFT = 'left';
global.CENTER = 'center';
global.TOP = 'top';
global.BOTTOM = 'bottom';

// Sync to window for JSDOM
if (typeof window !== 'undefined') {
  window.color = global.color;
  window.push = global.push;
  window.pop = global.pop;
  window.fill = global.fill;
  window.stroke = global.stroke;
  window.noStroke = global.noStroke;
  window.strokeWeight = global.strokeWeight;
  window.rect = global.rect;
  window.textAlign = global.textAlign;
  window.textSize = global.textSize;
  window.text = global.text;
  window.image = global.image;
  window.createVector = global.createVector;
  window.LEFT = global.LEFT;
  window.CENTER = global.CENTER;
  window.TOP = global.TOP;
  window.BOTTOM = global.BOTTOM;
}

// Load EntityPalette
const EntityPalette = require('../../../Classes/ui/EntityPalette.js');

// Mock CategoryRadioButtons
class MockCategoryRadioButtons {
  constructor() {
    this.height = 30;
    this.currentCategory = 'ants';
  }
  render() {}
  handleClick() { return null; }
  setCategory() {}
}
global.CategoryRadioButtons = MockCategoryRadioButtons;
if (typeof window !== 'undefined') window.CategoryRadioButtons = MockCategoryRadioButtons;

describe('EntityPalette Panel Sizing', function() {
  let palette;
  
  beforeEach(function() {
    // Reset stubs
    sinon.reset();
    
    // Create EntityPalette with many templates to test scrolling
    const manyTemplates = [
      { id: 'ant1', type: 'Ant', category: 'ants', name: 'Worker Ant', sprite: null },
      { id: 'ant2', type: 'Ant', category: 'ants', name: 'Soldier Ant', sprite: null },
      { id: 'ant3', type: 'Ant', category: 'ants', name: 'Scout Ant', sprite: null },
      { id: 'ant4', type: 'Ant', category: 'ants', name: 'Queen Ant', sprite: null },
      { id: 'ant5', type: 'Ant', category: 'ants', name: 'Forager Ant', sprite: null },
      { id: 'ant6', type: 'Ant', category: 'ants', name: 'Guard Ant', sprite: null },
      { id: 'ant7', type: 'Ant', category: 'ants', name: 'Builder Ant', sprite: null },
      { id: 'ant8', type: 'Ant', category: 'ants', name: 'Nurse Ant', sprite: null }
    ];
    
    palette = new EntityPalette(manyTemplates);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('getContentSize() with Many Templates', function() {
    it('should return limited height when content exceeds viewport', function() {
      // With 8 templates: 8 * 88px (80 item + 8 padding) = 704px for list
      // Plus category buttons (~30px) = ~734px total content
      // But viewportHeight = 320px (4 entries)
      
      const size = palette.getContentSize(220);
      
      console.log('[Test] Content size:', size);
      console.log('[Test] Viewport height:', palette.viewportHeight);
      console.log('[Test] Max scroll offset:', palette.maxScrollOffset);
      
      // FIXED: getContentSize() now caps height at viewport + fixed elements
      // This enables scrolling by preventing panel from auto-sizing to full content
      const maxExpectedHeight = palette.viewportHeight + 80; // viewport + category buttons + padding
      
      expect(size.height).to.be.greaterThan(palette.viewportHeight);
      expect(size.height).to.be.lessThanOrEqual(maxExpectedHeight);
    });
    
    it('should calculate maxScrollOffset correctly', function() {
      // Update scroll bounds (simulates what happens in setCategory)
      palette.updateScrollBounds();
      
      console.log('[Test] After updateScrollBounds:');
      console.log('[Test] - maxScrollOffset:', palette.maxScrollOffset);
      console.log('[Test] - viewportHeight:', palette.viewportHeight);
      
      // With 8 templates, content should be scrollable
      // maxScrollOffset should be > 0
      expect(palette.maxScrollOffset).to.be.greaterThan(0);
    });
  });
  
  describe('Panel Height Constraint (Integration)', function() {
    it('should limit panel height to enable scrolling', function() {
      // This test simulates what DraggablePanel does with contentSizeCallback
      const size = palette.getContentSize(220);
      
      console.log('[Test] Panel sizing behavior:');
      console.log('[Test] - Returned height:', size.height);
      console.log('[Test] - Viewport height:', palette.viewportHeight);
      console.log('[Test] - Should enable scrolling:', size.height > palette.viewportHeight);
      
      // FIXED: Panel height now capped to enable scrolling
      const maxExpectedHeight = palette.viewportHeight + 80; // viewport + category buttons + padding
      
      expect(size.height).to.be.greaterThan(palette.viewportHeight);
      expect(size.height).to.be.lessThanOrEqual(maxExpectedHeight);
      
      console.log('[Test] - Max expected height:', maxExpectedHeight);
      console.log('[Test] - Height within bounds:', size.height <= maxExpectedHeight);
    });
    
    it('should show ~3.5 templates visible at once', function() {
      const itemHeight = 80; // Height per template
      const padding = 8;
      const visibleItems = Math.floor(palette.viewportHeight / (itemHeight + padding));
      
      console.log('[Test] Viewport calculations:');
      console.log('[Test] - Item height:', itemHeight);
      console.log('[Test] - Padding:', padding);
      console.log('[Test] - Viewport height:', palette.viewportHeight);
      console.log('[Test] - Visible items:', visibleItems);
      
      // With viewportHeight = 320, should show ~3.6 items
      expect(visibleItems).to.be.closeTo(3, 1); // ~3-4 items visible
    });
  });
  
  describe('Scrolling Activation', function() {
    it('should enable scrolling when templates exceed viewport', function() {
      const templates = palette.getCurrentTemplates();
      const itemHeight = 80;
      const padding = 8;
      const totalContentHeight = templates.length * (itemHeight + padding);
      
      console.log('[Test] Scrolling conditions:');
      console.log('[Test] - Template count:', templates.length);
      console.log('[Test] - Total content height:', totalContentHeight);
      console.log('[Test] - Viewport height:', palette.viewportHeight);
      console.log('[Test] - Needs scrolling:', totalContentHeight > palette.viewportHeight);
      
      // With 8 templates (704px) and viewport (320px), should need scrolling
      expect(totalContentHeight).to.be.greaterThan(palette.viewportHeight);
      
      // Update scroll bounds
      palette.updateScrollBounds();
      
      // maxScrollOffset should be positive (scrolling possible)
      expect(palette.maxScrollOffset).to.be.greaterThan(0);
      console.log('[Test] - Max scroll offset:', palette.maxScrollOffset);
    });
  });
});
