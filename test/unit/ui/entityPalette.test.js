/**
 * EntityPalette Unit Tests
 * Tests for entity template management and category switching
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityPalette', function() {
  let EntityPalette;
  
  before(function() {
    // Mock global dependencies
    global.loadImage = sinon.stub().returns({ width: 32, height: 32 });
    
    // Load EntityPalette class
    const EntityPaletteModule = require('../../../Classes/ui/EntityPalette');
    EntityPalette = EntityPaletteModule.EntityPalette || EntityPaletteModule;
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with Entities category by default', function() {
      const palette = new EntityPalette();
      expect(palette.currentCategory).to.equal('entities');
    });
    
    it('should load entity templates', function() {
      const palette = new EntityPalette();
      const templates = palette.getTemplates('entities');
      expect(templates).to.be.an('array');
      expect(templates.length).to.be.greaterThan(0);
    });
    
    it('should have no template selected initially', function() {
      const palette = new EntityPalette();
      expect(palette.getSelectedTemplate()).to.be.null;
    });
  });
  
  describe('Category Management', function() {
    it('should switch categories', function() {
      const palette = new EntityPalette();
      palette.setCategory('buildings');
      expect(palette.currentCategory).to.equal('buildings');
    });
    
    it('should clear selection when switching categories', function() {
      const palette = new EntityPalette();
      const templates = palette.getTemplates('entities');
      palette.selectTemplate(templates[0].id);
      expect(palette.getSelectedTemplate()).to.not.be.null;
      
      palette.setCategory('resources');
      expect(palette.getSelectedTemplate()).to.be.null;
    });
    
    it('should return templates for current category', function() {
      const palette = new EntityPalette();
      palette.setCategory('resources');
      const templates = palette.getCurrentTemplates();
      expect(templates).to.be.an('array');
      expect(templates[0]).to.have.property('category');
      expect(templates[0].category).to.be.oneOf(['food', 'materials', 'terrain']);
    });
    
    it('should return empty array for invalid category', function() {
      const palette = new EntityPalette();
      palette.setCategory('invalid');
      const templates = palette.getCurrentTemplates();
      expect(templates).to.be.an('array');
      expect(templates.length).to.equal(0);
    });
  });
  
  describe('Entity Selection', function() {
    it('should select entity template by id', function() {
      const palette = new EntityPalette();
      const templates = palette.getTemplates('entities');
      const firstTemplate = templates[0];
      
      palette.selectTemplate(firstTemplate.id);
      expect(palette.getSelectedTemplate()).to.equal(firstTemplate);
    });
    
    it('should clear selection', function() {
      const palette = new EntityPalette();
      const templates = palette.getTemplates('entities');
      palette.selectTemplate(templates[0].id);
      
      palette.clearSelection();
      expect(palette.getSelectedTemplate()).to.be.null;
    });
    
    it('should not change selection for invalid template id', function() {
      const palette = new EntityPalette();
      const templates = palette.getTemplates('entities');
      palette.selectTemplate(templates[0].id);
      const selected = palette.getSelectedTemplate();
      
      palette.selectTemplate('invalid_id');
      expect(palette.getSelectedTemplate()).to.equal(selected);
    });
  });
  
  describe('Template Retrieval', function() {
    it('should get templates by category', function() {
      const palette = new EntityPalette();
      const entityTemplates = palette.getTemplates('entities');
      const buildingTemplates = palette.getTemplates('buildings');
      const resourceTemplates = palette.getTemplates('resources');
      
      expect(entityTemplates).to.be.an('array');
      expect(buildingTemplates).to.be.an('array');
      expect(resourceTemplates).to.be.an('array');
    });
    
    it('should return empty array for invalid category in getTemplates', function() {
      const palette = new EntityPalette();
      const templates = palette.getTemplates('invalid');
      expect(templates).to.be.an('array');
      expect(templates.length).to.equal(0);
    });
    
    it('should have ant templates with required properties', function() {
      const palette = new EntityPalette();
      const antTemplates = palette.getTemplates('entities');
      
      antTemplates.forEach(template => {
        expect(template).to.have.property('id');
        expect(template).to.have.property('name');
        expect(template).to.have.property('image');
        expect(template).to.have.property('job');
      });
    });
    
    it('should have resource templates with required properties', function() {
      const palette = new EntityPalette();
      const resourceTemplates = palette.getTemplates('resources');
      
      resourceTemplates.forEach(template => {
        expect(template).to.have.property('id');
        expect(template).to.have.property('name');
        expect(template).to.have.property('image');
        expect(template).to.have.property('type');
        expect(template).to.have.property('category');
      });
    });
    
    it('should have building templates with required properties', function() {
      const palette = new EntityPalette();
      const buildingTemplates = palette.getTemplates('buildings');
      
      buildingTemplates.forEach(template => {
        expect(template).to.have.property('id');
        expect(template).to.have.property('name');
        expect(template).to.have.property('image');
        expect(template).to.have.property('type');
        expect(template).to.have.property('size');
      });
    });
  });
  
  describe('Validation', function() {
    it('should handle null category gracefully', function() {
      const palette = new EntityPalette();
      expect(() => palette.setCategory(null)).to.not.throw();
      expect(palette.getCurrentTemplates()).to.be.an('array');
    });
    
    it('should handle undefined category gracefully', function() {
      const palette = new EntityPalette();
      expect(() => palette.setCategory(undefined)).to.not.throw();
      expect(palette.getCurrentTemplates()).to.be.an('array');
    });
  });
});
