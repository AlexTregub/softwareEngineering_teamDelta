/**
 * EntityPalette List View - Unit Tests (TDD Red Phase)
 * 
 * Tests list view rendering instead of grid layout:
 * - 64x64 sprites
 * - Full entity names (no abbreviations)
 * - Entity type, custom info, additional info
 * - Selection highlighting
 * - Dynamic height calculation
 * - Click detection on list items
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Load actual EntityPalette class
const EntityPalette = require('../../../Classes/ui/EntityPalette.js');

// Load CategoryRadioButtons if needed
try {
  const CategoryRadioButtons = require('../../../Classes/ui/CategoryRadioButtons.js');
  global.CategoryRadioButtons = CategoryRadioButtons;
  if (typeof window !== 'undefined') {
    window.CategoryRadioButtons = CategoryRadioButtons;
  }
} catch (e) {
  // CategoryRadioButtons not required for these tests
}

describe('EntityPalette - List View', function() {
  let sandbox;
  let mockP5;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js functions
    mockP5 = {
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      strokeWeight: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub(),
      textSize: sandbox.stub(),
      textAlign: sandbox.stub(),
      image: sandbox.stub(),
      noStroke: sandbox.stub(),
      color: sandbox.stub().returns('#ff0000'),
      LEFT: 'LEFT',
      CENTER: 'CENTER'
    };
    
    // Assign to global and window
    Object.assign(global, mockP5);
    if (typeof window !== 'undefined') {
      Object.assign(window, mockP5);
    }
    
    // Assign EntityPalette to global for consistency
    global.EntityPalette = EntityPalette;
    if (typeof window !== 'undefined') {
      window.EntityPalette = EntityPalette;
    }
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('List Item Rendering', function() {
    it('should render 64x64 sprite placeholder for each template', function() {
      const palette = new EntityPalette();
      palette._templates.entities = [
        { id: 'ant_worker', name: 'Worker Ant', type: 'Ant', sprite: null }
      ];
      
      palette.render(10, 10, 200, 300);
      
      // Should call rect() for sprite placeholder (64x64)
      const rectCalls = mockP5.rect.getCalls();
      const spriteCalls = rectCalls.filter(call => 
        call.args[2] === 64 && call.args[3] === 64
      );
      
      expect(spriteCalls.length).to.be.at.least(1, 'Should render at least one 64x64 sprite');
    });
    
    it('should render full entity name without abbreviation', function() {
      const palette = new EntityPalette();
      palette._templates.entities = [
        { id: 'ant_worker', name: 'Worker Ant', type: 'Ant' }
      ];
      
      palette.render(10, 10, 200, 300);
      
      const textCalls = mockP5.text.getCalls();
      const nameCall = textCalls.find(call => call.args[0] === 'Worker Ant');
      
      expect(nameCall).to.exist;
    });
    
    it('should render entity type information', function() {
      const palette = new EntityPalette();
      palette._templates.entities = [
        { id: 'ant_worker', name: 'Worker Ant', type: 'Ant' }
      ];
      
      palette.render(10, 10, 200, 300);
      
      const textCalls = mockP5.text.getCalls();
      const typeCall = textCalls.find(call => 
        typeof call.args[0] === 'string' && call.args[0].includes('Ant')
      );
      
      expect(typeCall).to.exist;
    });
    
    it('should render custom info from properties', function() {
      const palette = new EntityPalette();
      palette._templates.entities = [
        { 
          id: 'ant_soldier', 
          name: 'Soldier Ant', 
          type: 'Ant',
          properties: { faction: 'player', health: 200 }
        }
      ];
      
      palette.render(10, 10, 200, 300);
      
      const textCalls = mockP5.text.getCalls();
      const customCall = textCalls.find(call => 
        typeof call.args[0] === 'string' && 
        (call.args[0].includes('faction') || call.args[0].includes('player'))
      );
      
      expect(customCall).to.exist;
    });
    
    it('should render additional description if present', function() {
      const palette = new EntityPalette();
      palette._templates.entities = [
        { 
          id: 'ant_worker', 
          name: 'Worker Ant', 
          type: 'Ant',
          additionalInfo: 'Basic worker unit'
        }
      ];
      
      palette.render(10, 10, 200, 300);
      
      const textCalls = mockP5.text.getCalls();
      const descCall = textCalls.find(call => call.args[0] === 'Basic worker unit');
      
      expect(descCall).to.exist;
    });
    
    it('should calculate correct item height (80px per item)', function() {
      const palette = new EntityPalette();
      palette._templates.entities = [
        { id: 'ant1', name: 'Ant 1', type: 'Ant' },
        { id: 'ant2', name: 'Ant 2', type: 'Ant' }
      ];
      
      const size = palette.getContentSize(200);
      
      // 30px buttons + (80px * 2 items) + (8px padding * 2) + 16px margin
      const expectedMinHeight = 30 + (80 * 2) + (8 * 2) + 16;
      expect(size.height).to.be.at.least(expectedMinHeight - 50, 'Height should accommodate list items');
    });
    
    it('should handle empty template list gracefully', function() {
      const palette = new EntityPalette();
      palette._templates.entities = [];
      
      expect(() => {
        palette.render(10, 10, 200, 300);
      }).to.not.throw();
      
      const size = palette.getContentSize(200);
      expect(size.height).to.be.greaterThan(0);
    });
    
    it('should highlight selected item with gold border', function() {
      const palette = new EntityPalette();
      palette._templates.entities = [
        { id: 'ant_worker', name: 'Worker Ant', type: 'Ant' },
        { id: 'ant_soldier', name: 'Soldier Ant', type: 'Ant' }
      ];
      palette._selectedTemplateId = 'ant_soldier';
      
      palette.render(10, 10, 200, 300);
      
      // Should call stroke() with gold color for selected item
      const strokeCalls = mockP5.stroke.getCalls();
      const goldStroke = strokeCalls.find(call => {
        const arg = call.args[0];
        return typeof arg === 'string' && 
               (arg.toLowerCase().includes('gold') || arg === '#ffd700');
      });
      
      expect(goldStroke).to.exist;
    });
    
    it('should handle scrolling with many items', function() {
      const palette = new EntityPalette();
      // Create 20 templates to test scrolling
      palette._templates.entities = Array.from({ length: 20 }, (_, i) => ({
        id: `ant_${i}`,
        name: `Ant ${i}`,
        type: 'Ant'
      }));
      
      const size = palette.getContentSize(200);
      
      // With 20 items, height should be substantial
      const expectedMinHeight = 30 + (80 * 20);
      expect(size.height).to.be.at.least(expectedMinHeight * 0.5, 'Should accommodate many items');
    });
  });
  
  describe('Click Detection', function() {
    it('should detect click on first list item', function() {
      const palette = new EntityPalette();
      palette._templates.entities = [
        { id: 'ant_worker', name: 'Worker Ant', type: 'Ant' }
      ];
      
      // Click in first item area (below 30px buttons, in first 80px of list)
      const result = palette.handleClick(100, 50, 10, 10, 200);
      
      expect(result).to.exist;
      if (result && result.type === 'template') {
        expect(result.template.id).to.equal('ant_worker');
      }
    });
    
    it('should detect click on second list item', function() {
      const palette = new EntityPalette();
      palette._templates.entities = [
        { id: 'ant_worker', name: 'Worker Ant', type: 'Ant' },
        { id: 'ant_soldier', name: 'Soldier Ant', type: 'Ant' }
      ];
      
      // Click in second item area (30px buttons + 8px padding + 80px first item + 8px padding + into second item)
      // panelY=10, so absolute Y=146 means relY=136, which is 98px into list (hits second item)
      const result = palette.handleClick(100, 146, 10, 10, 200);
      
      expect(result).to.exist;
      if (result && result.type === 'template') {
        expect(result.template.id).to.equal('ant_soldier');
      }
    });
    
    it('should return null for click outside list bounds', function() {
      const palette = new EntityPalette();
      palette._templates.entities = [
        { id: 'ant_worker', name: 'Worker Ant', type: 'Ant' }
      ];
      
      // Click far below content
      const result = palette.handleClick(100, 500, 10, 10, 200);
      
      // Should return null or not change selection
      expect(result === null || result === undefined).to.be.true;
    });
    
    it('should update selected template ID on click', function() {
      const palette = new EntityPalette();
      palette._templates.entities = [
        { id: 'ant_worker', name: 'Worker Ant', type: 'Ant' },
        { id: 'ant_soldier', name: 'Soldier Ant', type: 'Ant' }
      ];
      
      palette.handleClick(100, 146, 10, 10, 200);
      
      expect(palette._selectedTemplateId).to.equal('ant_soldier');
    });
    
    it('should calculate dynamic panel height based on template count', function() {
      const palette = new EntityPalette();
      
      // Test with 1 template
      palette._templates.entities = [
        { id: 'ant1', name: 'Ant 1', type: 'Ant' }
      ];
      const size1 = palette.getContentSize(200);
      
      // Test with 5 templates
      palette._templates.entities = Array.from({ length: 5 }, (_, i) => ({
        id: `ant_${i}`,
        name: `Ant ${i}`,
        type: 'Ant'
      }));
      const size5 = palette.getContentSize(200);
      
      // Height should increase with more items
      expect(size5.height).to.be.greaterThan(size1.height);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle templates without sprites', function() {
      const palette = new EntityPalette();
      palette._templates.entities = [
        { id: 'ant_worker', name: 'Worker Ant', type: 'Ant', sprite: null }
      ];
      
      expect(() => {
        palette.render(10, 10, 200, 300);
      }).to.not.throw();
    });
    
    it('should handle templates without properties', function() {
      const palette = new EntityPalette();
      palette._templates.entities = [
        { id: 'ant_worker', name: 'Worker Ant', type: 'Ant' }
      ];
      
      expect(() => {
        palette.render(10, 10, 200, 300);
      }).to.not.throw();
    });
    
    it('should handle templates without additional info', function() {
      const palette = new EntityPalette();
      palette._templates.entities = [
        { id: 'ant_worker', name: 'Worker Ant', type: 'Ant', additionalInfo: null }
      ];
      
      expect(() => {
        palette.render(10, 10, 200, 300);
      }).to.not.throw();
    });
  });
});
