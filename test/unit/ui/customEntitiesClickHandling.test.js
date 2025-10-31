/**
 * Unit Tests: EntityPalette Click Handling for CRUD Actions
 * 
 * Tests click detection for:
 * - Rename button clicks
 * - Delete button clicks  
 * - "Add New Custom Entity" button clicks
 * - Template selection in custom category
 * 
 * These tests verify that handleClick() returns the correct action type
 * and entity data based on click coordinates.
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Setup global window object for JSDOM compatibility
if (typeof window === 'undefined') {
  global.window = {};
}

// Mock p5.js functions
global.createVector = sinon.stub().callsFake((x, y) => ({ x, y, mag: () => Math.sqrt(x*x + y*y) }));
global.loadImage = sinon.stub().returns({});
global.textWidth = sinon.stub().returns(50);
global.push = sinon.stub();
global.pop = sinon.stub();
global.fill = sinon.stub();
global.noStroke = sinon.stub();
global.stroke = sinon.stub();
global.rect = sinon.stub();
global.image = sinon.stub();
global.text = sinon.stub();
global.textAlign = sinon.stub();
global.textSize = sinon.stub();
global.LEFT = 'left';
global.RIGHT = 'right';
global.CENTER = 'center';
global.TOP = 'top';

// Sync to window
window.createVector = global.createVector;
window.loadImage = global.loadImage;
window.textWidth = global.textWidth;

// Mock LocalStorage
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = value;
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  }
};
global.localStorage = localStorageMock;
window.localStorage = localStorageMock;

// Load EntityPalette class
const EntityPalette = require('../../../Classes/ui/EntityPalette.js');

// Mock CategoryRadioButtons
global.CategoryRadioButtons = class CategoryRadioButtons {
  constructor(onChange) {
    this.onChange = onChange;
    this.categories = new Map();
    this.activeCategory = 'base';
    this.height = 30; // Button height
    
    this.categories.set('base', []);
    this.categories.set('custom', []);
  }
  
  setActiveCategory(categoryId) {
    this.activeCategory = categoryId;
    if (this.onChange) this.onChange(categoryId);
  }
  
  handleClick(mouseX, mouseY, x, y, width) {
    // Simple mock - just return null or category
    if (mouseY < this.height) {
      return { id: 'custom' };
    }
    return null;
  }
  
  loadCustomEntities() {
    const stored = localStorage.getItem('antGame_customEntities');
    if (stored) {
      const data = JSON.parse(stored);
      this.categories.set('custom', data);
    }
  }
};
window.CategoryRadioButtons = global.CategoryRadioButtons;

describe('EntityPalette - Click Handling for CRUD Actions', function() {
  let palette;
  
  beforeEach(function() {
    localStorage.clear();
    palette = new EntityPalette();
    palette.setCategory('custom');
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Rename Button Clicks', function() {
    it('should detect rename button click on custom entity', function() {
      // Add a custom entity
      const entity = palette.addCustomEntity('Test Entity', 'ant_worker', {});
      
      // Click coordinates for rename button
      // Panel: x=0, y=0, width=200
      // Rename button is in header (top 20px), right side before delete (~40px width)
      // Click at (160, 48) - in first item's header, rename button area
      const panelX = 0;
      const panelY = 0;
      const panelWidth = 200;
      const clickX = panelX + 140; // Right side, rename button
      const clickY = panelY + 48; // In header (30 button height + 8 padding + 10 in header)
      
      const result = palette.handleClick(clickX, clickY, panelX, panelY, panelWidth);
      
      expect(result).to.exist;
      expect(result.type).to.equal('rename');
      expect(result.entity).to.exist;
      expect(result.entity.id).to.equal(entity.id);
    });
    
    it('should detect rename button click on group', function() {
      const group = palette.addCustomEntityGroup('My Squad', [
        { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} }
      ]);
      
      const panelX = 0;
      const panelY = 0;
      const panelWidth = 200;
      const clickX = panelX + 140;
      const clickY = panelY + 48;
      
      const result = palette.handleClick(clickX, clickY, panelX, panelY, panelWidth);
      
      expect(result).to.exist;
      expect(result.type).to.equal('rename');
      expect(result.entity.isGroup).to.be.true;
    });
  });
  
  describe('Delete Button Clicks', function() {
    it('should detect delete button click on custom entity', function() {
      const entity = palette.addCustomEntity('Test Entity', 'ant_worker', {});
      
      // Delete button is far right (~15px width)
      // Click at (185, 48) - in first item's header, delete button area
      const panelX = 0;
      const panelY = 0;
      const panelWidth = 200;
      const clickX = panelX + 185; // Far right, delete button
      const clickY = panelY + 48;
      
      const result = palette.handleClick(clickX, clickY, panelX, panelY, panelWidth);
      
      expect(result).to.exist;
      expect(result.type).to.equal('delete');
      expect(result.entity).to.exist;
      expect(result.entity.id).to.equal(entity.id);
    });
    
    it('should detect delete button click on group', function() {
      const group = palette.addCustomEntityGroup('My Squad', [
        { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} }
      ]);
      
      const panelX = 0;
      const panelY = 0;
      const panelWidth = 200;
      const clickX = panelX + 185;
      const clickY = panelY + 48;
      
      const result = palette.handleClick(clickX, clickY, panelX, panelY, panelWidth);
      
      expect(result).to.exist;
      expect(result.type).to.equal('delete');
      expect(result.entity.isGroup).to.be.true;
    });
  });
  
  describe('Add New Custom Entity Button Clicks', function() {
    it('should detect "Add New" button click', function() {
      // Add some entities first to position the "Add New" button
      palette.addCustomEntity('Entity 1', 'ant_worker', {});
      palette.addCustomEntity('Entity 2', 'ant_soldier', {});
      
      // "Add New" button is at bottom, after all entities
      // Each item: 20px header + 80px body + 8px padding = 108px
      // Button height: 30px category buttons + 8 padding = 38px
      // First entity starts at 38px
      // Second entity starts at 38 + 108 = 146px
      // "Add New" button starts at 38 + 108 + 108 + 16 = 270px
      const panelX = 0;
      const panelY = 0;
      const panelWidth = 200;
      const clickX = panelX + 100; // Center of button
      const clickY = panelY + 285; // In "Add New" button area
      
      const result = palette.handleClick(clickX, clickY, panelX, panelY, panelWidth);
      
      expect(result).to.exist;
      expect(result.type).to.equal('addCustomEntity');
    });
    
    it('should show "Add New" button when custom category is empty', function() {
      // No entities, just the "Add New" button
      // Button starts at: 30 (category) + 8 (padding) + 16 (spacing) = 54px
      const panelX = 0;
      const panelY = 0;
      const panelWidth = 200;
      const clickX = panelX + 100;
      const clickY = panelY + 70; // In "Add New" button area
      
      const result = palette.handleClick(clickX, clickY, panelX, panelY, panelWidth);
      
      expect(result).to.exist;
      expect(result.type).to.equal('addCustomEntity');
    });
  });
  
  describe('Template Selection in Custom Category', function() {
    it('should select template when clicking body (not header buttons)', function() {
      const entity = palette.addCustomEntity('Test Entity', 'ant_worker', {});
      
      // Click in body area (below header)
      // Header is 20px, so click at y=60 (30 buttons + 8 padding + 20 header + 2px into body)
      const panelX = 0;
      const panelY = 0;
      const panelWidth = 200;
      const clickX = panelX + 50; // Left side, not on buttons
      const clickY = panelY + 60; // In body area
      
      const result = palette.handleClick(clickX, clickY, panelX, panelY, panelWidth);
      
      expect(result).to.exist;
      expect(result.type).to.equal('template');
      expect(result.template).to.exist;
      expect(result.template.id).to.equal(entity.id);
    });
    
    it('should select template when clicking header (but not buttons)', function() {
      const entity = palette.addCustomEntity('Test Entity', 'ant_worker', {});
      
      // Click in header area but not on rename/delete buttons (left side)
      const panelX = 0;
      const panelY = 0;
      const panelWidth = 200;
      const clickX = panelX + 20; // Left side of header
      const clickY = panelY + 48; // In header
      
      const result = palette.handleClick(clickX, clickY, panelX, panelY, panelWidth);
      
      expect(result).to.exist;
      expect(result.type).to.equal('template');
      expect(result.template.id).to.equal(entity.id);
    });
  });
  
  describe('Multiple Entities Click Detection', function() {
    it('should detect clicks on different entities', function() {
      const entity1 = palette.addCustomEntity('Entity 1', 'ant_worker', {});
      const entity2 = palette.addCustomEntity('Entity 2', 'ant_soldier', {});
      
      const panelX = 0;
      const panelY = 0;
      const panelWidth = 200;
      
      // Click first entity's delete button
      const result1 = palette.handleClick(panelX + 185, panelY + 48, panelX, panelY, panelWidth);
      expect(result1.type).to.equal('delete');
      expect(result1.entity.id).to.equal(entity1.id);
      
      // Click second entity's rename button
      // Second entity starts at 38 + 108 = 146px
      const result2 = palette.handleClick(panelX + 140, panelY + 156, panelX, panelY, panelWidth);
      expect(result2.type).to.equal('rename');
      expect(result2.entity.id).to.equal(entity2.id);
    });
  });
  
  describe('Edge Cases', function() {
    it('should return null when clicking outside entity areas', function() {
      palette.addCustomEntity('Entity 1', 'ant_worker', {});
      
      const panelX = 0;
      const panelY = 0;
      const panelWidth = 200;
      
      // Click way below all entities
      const result = palette.handleClick(panelX + 100, panelY + 500, panelX, panelY, panelWidth);
      
      expect(result).to.be.null;
    });
    
    it('should handle empty custom category', function() {
      // No entities, click where first entity would be
      const panelX = 0;
      const panelY = 0;
      const panelWidth = 200;
      
      const result = palette.handleClick(panelX + 100, panelY + 50, panelX, panelY, panelWidth);
      
      // Should return null or addCustomEntity button
      expect(result).to.satisfy((r) => r === null || r.type === 'addCustomEntity');
    });
  });
});
