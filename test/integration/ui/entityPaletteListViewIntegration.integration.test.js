/**
 * EntityPalette List View - Integration Tests
 * 
 * Tests real component interaction with:
 * - Real EntityPalette class
 * - Real CategoryRadioButtons
 * - Real template data
 * - Category switching
 * - Selection persistence
 * - Dynamic panel resizing
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Load real components
const EntityPalette = require('../../../Classes/ui/EntityPalette.js');

describe('EntityPalette List View - Integration', function() {
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
    
    // Mock CategoryRadioButtons if needed
    if (typeof global.CategoryRadioButtons === 'undefined') {
      global.CategoryRadioButtons = class {
        constructor(callback) {
          this.callback = callback;
          this.height = 30;
          this.selected = 'entities';
          this.categories = [
            { id: 'entities', label: 'Entities' },
            { id: 'buildings', label: 'Buildings' },
            { id: 'resources', label: 'Resources' }
          ];
        }
        
        render(x, y, width) {
          // Render buttons
        }
        
        handleClick(mouseX, mouseY, x, y, width) {
          // Simple click detection
          if (mouseY < this.height) {
            const buttonWidth = width / this.categories.length;
            const index = Math.floor(mouseX / buttonWidth);
            if (index >= 0 && index < this.categories.length) {
              this.selected = this.categories[index].id;
              if (this.callback) {
                this.callback(this.selected);
              }
              return { id: this.selected };
            }
          }
          return null;
        }
      };
      
      if (typeof window !== 'undefined') {
        window.CategoryRadioButtons = global.CategoryRadioButtons;
      }
    }
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('Real Component Rendering', function() {
    it('should render list view with real entity templates', function() {
      const palette = new EntityPalette();
      
      // EntityPalette loads real templates in constructor
      const templates = palette.getCurrentTemplates();
      expect(templates.length).to.be.greaterThan(0);
      
      palette.render(10, 10, 200, 300);
      
      // Should have rendered sprites and text for each template
      const rectCalls = mockP5.rect.getCalls();
      expect(rectCalls.length).to.be.greaterThan(0);
      
      const textCalls = mockP5.text.getCalls();
      expect(textCalls.length).to.be.greaterThan(0);
    });
    
    it('should render different templates for each category', function() {
      const palette = new EntityPalette();
      
      const entitiesCount = palette.getTemplates('entities').length;
      const buildingsCount = palette.getTemplates('buildings').length;
      const resourcesCount = palette.getTemplates('resources').length;
      
      expect(entitiesCount).to.be.greaterThan(0);
      expect(buildingsCount).to.be.greaterThan(0);
      expect(resourcesCount).to.be.greaterThan(0);
      
      // Different categories should have different counts
      expect(entitiesCount).to.not.equal(buildingsCount);
    });
    
    it('should render full entity names from real templates', function() {
      const palette = new EntityPalette();
      palette.render(10, 10, 200, 300);
      
      const textCalls = mockP5.text.getCalls();
      const names = textCalls.map(call => call.args[0]);
      
      // Should contain full names like "Worker Ant", not abbreviations
      const hasFullNames = names.some(name => 
        typeof name === 'string' && name.length > 3 && name.includes(' ')
      );
      
      expect(hasFullNames).to.be.true;
    });
  });
  
  describe('Category Switching', function() {
    it('should switch categories and show different templates', function() {
      const palette = new EntityPalette();
      
      const entitiesTemplates = palette.getCurrentTemplates();
      const firstEntityId = entitiesTemplates[0].id;
      
      palette.setCategory('buildings');
      
      const buildingsTemplates = palette.getCurrentTemplates();
      const firstBuildingId = buildingsTemplates[0].id;
      
      expect(firstEntityId).to.not.equal(firstBuildingId);
    });
    
    it('should clear selection when switching categories', function() {
      const palette = new EntityPalette();
      
      // Select a template
      palette.selectTemplate(palette.getCurrentTemplates()[0].id);
      expect(palette.hasSelection()).to.be.true;
      
      // Switch category
      palette.setCategory('buildings');
      
      // Selection should be cleared
      expect(palette.hasSelection()).to.be.false;
    });
    
    it('should resize panel when switching to category with different item count', function() {
      const palette = new EntityPalette();
      
      palette.setCategory('entities');
      const entitiesSize = palette.getContentSize(200);
      
      palette.setCategory('buildings');
      const buildingsSize = palette.getContentSize(200);
      
      // Different template counts should result in different heights
      expect(entitiesSize.height).to.not.equal(buildingsSize.height);
    });
  });
  
  describe('Click Detection with Real Templates', function() {
    it('should detect clicks on real entity templates', function() {
      const palette = new EntityPalette();
      const templates = palette.getCurrentTemplates();
      
      // Click on first item (panelX=10, panelY=10, click at Y=50)
      const result = palette.handleClick(100, 50, 10, 10, 200);
      
      expect(result).to.exist;
      expect(result.type).to.equal('template');
      expect(result.template.id).to.equal(templates[0].id);
    });
    
    it('should persist selection after rendering', function() {
      const palette = new EntityPalette();
      const templates = palette.getCurrentTemplates();
      
      // Click to select
      palette.handleClick(100, 50, 10, 10, 200);
      
      expect(palette.getSelectedTemplateId()).to.equal(templates[0].id);
      
      // Render again
      palette.render(10, 10, 200, 300);
      
      // Selection should persist
      expect(palette.getSelectedTemplateId()).to.equal(templates[0].id);
    });
    
    it('should handle clicks across all categories', function() {
      const palette = new EntityPalette();
      const categories = ['entities', 'buildings', 'resources'];
      
      categories.forEach(category => {
        palette.setCategory(category);
        const templates = palette.getCurrentTemplates();
        
        if (templates.length > 0) {
          const result = palette.handleClick(100, 50, 10, 10, 200);
          expect(result).to.exist;
          expect(result.template.id).to.equal(templates[0].id);
        }
      });
    });
  });
  
  describe('Dynamic Panel Resizing', function() {
    it('should calculate correct height for entities category', function() {
      const palette = new EntityPalette();
      palette.setCategory('entities');
      
      const templates = palette.getCurrentTemplates();
      const size = palette.getContentSize(200);
      
      // Height = buttonHeight (30) + (itemHeight (80) + padding (8)) * count + margin (16)
      const expectedMinHeight = 30 + (80 + 8) * templates.length + 16;
      
      expect(size.height).to.be.at.least(expectedMinHeight - 50);
    });
    
    it('should calculate correct height for buildings category', function() {
      const palette = new EntityPalette();
      palette.setCategory('buildings');
      
      const templates = palette.getCurrentTemplates();
      const size = palette.getContentSize(200);
      
      const expectedMinHeight = 30 + (80 + 8) * templates.length + 16;
      
      expect(size.height).to.be.at.least(expectedMinHeight - 50);
    });
    
    it('should handle category with many items', function() {
      const palette = new EntityPalette();
      
      // Find category with most items
      let maxCount = 0;
      let maxCategory = 'entities';
      
      ['entities', 'buildings', 'resources'].forEach(cat => {
        const count = palette.getTemplates(cat).length;
        if (count > maxCount) {
          maxCount = count;
          maxCategory = cat;
        }
      });
      
      palette.setCategory(maxCategory);
      const size = palette.getContentSize(200);
      
      // Should accommodate all items
      expect(size.height).to.be.greaterThan(100);
    });
  });
  
  describe('Template Data Integrity', function() {
    it('should preserve all template properties', function() {
      const palette = new EntityPalette();
      const template = palette.getCurrentTemplates()[0];
      
      expect(template).to.have.property('id');
      expect(template).to.have.property('name');
      expect(template).to.have.property('type');
      expect(template).to.have.property('properties');
    });
    
    it('should have valid properties for all entities', function() {
      const palette = new EntityPalette();
      const templates = palette.getTemplates('entities');
      
      templates.forEach(template => {
        expect(template.properties).to.exist;
        expect(template.properties).to.have.property('faction');
        expect(template.properties).to.have.property('health');
      });
    });
    
    it('should have valid properties for all buildings', function() {
      const palette = new EntityPalette();
      const templates = palette.getTemplates('buildings');
      
      templates.forEach(template => {
        expect(template.properties).to.exist;
        expect(template.properties).to.have.property('buildingType');
      });
    });
  });
});
