/**
 * Unit Tests: EntityPalette CRUD Operations
 * 
 * Tests for Create, Read, Update, Delete operations on custom entities.
 * This includes:
 * - addCustomEntity() - Create single custom entities
 * - getCustomEntity() - Read entity by ID
 * - renameCustomEntity() - Update entity name
 * - deleteCustomEntity() - Delete entity
 * - Unique ID generation
 * - LocalStorage persistence
 * - Duplicate name prevention
 * 
 * TDD Phase: RED (write tests first, expect failures)
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
    
    // Initialize with base templates
    this.categories.set('base', [
      { id: 'ant_worker', name: 'Worker Ant' },
      { id: 'ant_soldier', name: 'Soldier Ant' }
    ]);
    this.categories.set('custom', []);
  }
  
  setActiveCategory(categoryId) {
    this.activeCategory = categoryId;
    if (this.onChange) this.onChange(categoryId);
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

describe('EntityPalette - CRUD Operations', function() {
  let palette;
  
  beforeEach(function() {
    // Clear LocalStorage before each test
    localStorage.clear();
    
    // Create palette instance
    palette = new EntityPalette();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('addCustomEntity()', function() {
    it('should create a single custom entity with unique ID', function() {
      const entity = palette.addCustomEntity('My Elite Soldier', 'ant_soldier', {
        health: 200,
        movementSpeed: 50
      });
      
      expect(entity).to.exist;
      expect(entity.id).to.exist;
      expect(entity.id).to.match(/^custom_entity_\d+_[a-z0-9]+$/);
      expect(entity.customName).to.equal('My Elite Soldier');
      expect(entity.baseTemplateId).to.equal('ant_soldier');
      expect(entity.isGroup).to.be.false;
    });
    
    it('should save custom entity to LocalStorage', function() {
      palette.addCustomEntity('Fast Scout', 'ant_scout', {
        movementSpeed: 80
      });
      
      const stored = localStorage.getItem('antGame_customEntities');
      expect(stored).to.exist;
      
      const data = JSON.parse(stored);
      expect(data).to.be.an('array');
      expect(data.length).to.equal(1);
      expect(data[0].customName).to.equal('Fast Scout');
    });
    
    it('should add createdAt timestamp', function() {
      const entity = palette.addCustomEntity('Tank', 'ant_soldier', {
        health: 500
      });
      
      expect(entity.createdAt).to.exist;
      expect(entity.createdAt).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
    
    it('should preserve custom properties', function() {
      const entity = palette.addCustomEntity('Speedy', 'ant_worker', {
        health: 120,
        movementSpeed: 60,
        faction: 'player'
      });
      
      expect(entity.properties).to.exist;
      expect(entity.properties.health).to.equal(120);
      expect(entity.properties.movementSpeed).to.equal(60);
      expect(entity.properties.faction).to.equal('player');
    });
    
    it('should generate unique IDs for multiple entities', function() {
      const entity1 = palette.addCustomEntity('Entity 1', 'ant_worker', {});
      const entity2 = palette.addCustomEntity('Entity 2', 'ant_soldier', {});
      const entity3 = palette.addCustomEntity('Entity 3', 'ant_scout', {});
      
      expect(entity1.id).to.not.equal(entity2.id);
      expect(entity2.id).to.not.equal(entity3.id);
      expect(entity1.id).to.not.equal(entity3.id);
    });
    
    it('should add entity to custom templates array', function() {
      palette.addCustomEntity('Test Entity', 'ant_worker', {});
      
      const customTemplates = palette.getTemplates('custom');
      expect(customTemplates).to.be.an('array');
      expect(customTemplates.length).to.equal(1);
      expect(customTemplates[0].customName).to.equal('Test Entity');
    });
    
    it('should not allow duplicate names', function() {
      palette.addCustomEntity('Duplicate', 'ant_worker', {});
      
      // Try to add another with the same name
      const result = palette.addCustomEntity('Duplicate', 'ant_soldier', {});
      
      expect(result).to.be.null;
    });
    
    it('should handle empty properties object', function() {
      const entity = palette.addCustomEntity('Simple', 'ant_worker', {});
      
      expect(entity).to.exist;
      expect(entity.properties).to.deep.equal({});
    });
  });
  
  describe('getCustomEntity()', function() {
    it('should retrieve entity by ID', function() {
      const entity = palette.addCustomEntity('Findable', 'ant_worker', {
        health: 150
      });
      
      const retrieved = palette.getCustomEntity(entity.id);
      
      expect(retrieved).to.exist;
      expect(retrieved.id).to.equal(entity.id);
      expect(retrieved.customName).to.equal('Findable');
      expect(retrieved.properties.health).to.equal(150);
    });
    
    it('should return null for non-existent ID', function() {
      const retrieved = palette.getCustomEntity('fake_id_123');
      
      expect(retrieved).to.be.null;
    });
    
    it('should retrieve groups by ID', function() {
      const group = palette.addCustomEntityGroup('My Squad', [
        { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} }
      ]);
      
      const retrieved = palette.getCustomEntity(group.id);
      
      expect(retrieved).to.exist;
      expect(retrieved.isGroup).to.be.true;
      expect(retrieved.customName).to.equal('My Squad');
    });
  });
  
  describe('renameCustomEntity()', function() {
    it('should update entity name', function() {
      const entity = palette.addCustomEntity('Old Name', 'ant_worker', {});
      
      const result = palette.renameCustomEntity(entity.id, 'New Name');
      
      expect(result).to.be.true;
      
      const retrieved = palette.getCustomEntity(entity.id);
      expect(retrieved.customName).to.equal('New Name');
    });
    
    it('should update lastModified timestamp', function(done) {
      const entity = palette.addCustomEntity('Original', 'ant_worker', {});
      const originalTime = entity.createdAt;
      
      // Wait a tiny bit
      setTimeout(() => {
        palette.renameCustomEntity(entity.id, 'Renamed');
        
        const retrieved = palette.getCustomEntity(entity.id);
        expect(retrieved.lastModified).to.exist;
        expect(retrieved.lastModified).to.not.equal(originalTime);
        done();
      }, 10);
    });
    
    it('should preserve properties on rename', function() {
      const entity = palette.addCustomEntity('Before', 'ant_soldier', {
        health: 200,
        damage: 30
      });
      
      palette.renameCustomEntity(entity.id, 'After');
      
      const retrieved = palette.getCustomEntity(entity.id);
      expect(retrieved.properties.health).to.equal(200);
      expect(retrieved.properties.damage).to.equal(30);
    });
    
    it('should persist rename to LocalStorage', function() {
      const entity = palette.addCustomEntity('Test', 'ant_worker', {});
      palette.renameCustomEntity(entity.id, 'Renamed Test');
      
      const stored = localStorage.getItem('antGame_customEntities');
      const data = JSON.parse(stored);
      
      const saved = data.find(e => e.id === entity.id);
      expect(saved.customName).to.equal('Renamed Test');
    });
    
    it('should return false for non-existent ID', function() {
      const result = palette.renameCustomEntity('fake_id', 'New Name');
      
      expect(result).to.be.false;
    });
    
    it('should not allow renaming to duplicate name', function() {
      palette.addCustomEntity('Name 1', 'ant_worker', {});
      const entity2 = palette.addCustomEntity('Name 2', 'ant_soldier', {});
      
      const result = palette.renameCustomEntity(entity2.id, 'Name 1');
      
      expect(result).to.be.false;
    });
  });
  
  describe('deleteCustomEntity()', function() {
    it('should remove entity from list', function() {
      const entity = palette.addCustomEntity('To Delete', 'ant_worker', {});
      
      const result = palette.deleteCustomEntity(entity.id);
      
      expect(result).to.be.true;
      
      const customTemplates = palette.getTemplates('custom');
      expect(customTemplates.length).to.equal(0);
    });
    
    it('should remove entity from LocalStorage', function() {
      const entity = palette.addCustomEntity('To Delete', 'ant_worker', {});
      palette.deleteCustomEntity(entity.id);
      
      const stored = localStorage.getItem('antGame_customEntities');
      const data = JSON.parse(stored);
      
      expect(data.length).to.equal(0);
    });
    
    it('should return false for non-existent ID', function() {
      const result = palette.deleteCustomEntity('fake_id');
      
      expect(result).to.be.false;
    });
    
    it('should delete groups', function() {
      const group = palette.addCustomEntityGroup('Squad', [
        { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} }
      ]);
      
      const result = palette.deleteCustomEntity(group.id);
      
      expect(result).to.be.true;
      
      const customTemplates = palette.getTemplates('custom');
      expect(customTemplates.length).to.equal(0);
    });
  });
  
  describe('ID Generation', function() {
    it('should generate IDs with timestamp and random suffix', function() {
      const entity = palette.addCustomEntity('Test', 'ant_worker', {});
      
      expect(entity.id).to.match(/^custom_entity_\d{13}_[a-z0-9]{9}$/);
    });
    
    it('should generate different IDs in rapid succession', function() {
      const ids = new Set();
      
      for (let i = 0; i < 100; i++) {
        const entity = palette.addCustomEntity(`Entity ${i}`, 'ant_worker', {});
        ids.add(entity.id);
      }
      
      expect(ids.size).to.equal(100);
    });
  });
  
  describe('LocalStorage Integration', function() {
    it('should save mixed single entities and groups', function() {
      palette.addCustomEntity('Single 1', 'ant_worker', {});
      palette.addCustomEntityGroup('Group 1', [
        { baseTemplateId: 'ant_soldier', position: { x: 0, y: 0 }, properties: {} }
      ]);
      palette.addCustomEntity('Single 2', 'ant_scout', {});
      
      const stored = localStorage.getItem('antGame_customEntities');
      const data = JSON.parse(stored);
      
      expect(data.length).to.equal(3);
      
      const singles = data.filter(e => !e.isGroup);
      const groups = data.filter(e => e.isGroup);
      
      expect(singles.length).to.equal(2);
      expect(groups.length).to.equal(1);
    });
    
    it('should load custom entities from LocalStorage on initialization', function() {
      // Manually add data to LocalStorage
      const testData = [
        {
          id: 'custom_entity_123',
          customName: 'Preloaded',
          baseTemplateId: 'ant_worker',
          isGroup: false,
          properties: { health: 100 },
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('antGame_customEntities', JSON.stringify(testData));
      
      // Create new palette (should load from storage)
      const newPalette = new EntityPalette();
      
      const entity = newPalette.getCustomEntity('custom_entity_123');
      expect(entity).to.exist;
      expect(entity.customName).to.equal('Preloaded');
    });
  });
});
