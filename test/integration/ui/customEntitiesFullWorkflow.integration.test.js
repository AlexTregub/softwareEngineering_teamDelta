/**
 * Full Workflow Integration Tests: Custom Entities
 * 
 * Tests complete user workflows for custom entities:
 * - Add â†’ appears in list â†’ persists
 * - Rename â†’ updates in list + storage
 * - Delete â†’ confirmation â†’ removed
 * - Category switching â†’ persistence
 * - Page reload simulation â†’ restoration
 * - Multiple entities â†’ display
 * - Selection â†’ properties preserved
 */

const { expect } = require('chai');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');
const sinon = require('sinon');

// Setup global window object
if (typeof window === 'undefined') {
}

// Mock p5.js functions
global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
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

// Load classes - inheritance chain: UIObject â†’ Dialog â†’ ModalDialog
const UIObject = require('../../../Classes/ui/_baseObjects/UIObject.js');
global.UIObject = UIObject;
window.UIObject = UIObject;

const Dialog = require('../../../Classes/ui/_baseObjects/modalWindow/Dialog.js');
global.Dialog = Dialog;
window.Dialog = Dialog;

const ModalDialog = require('../../../Classes/ui/_baseObjects/modalWindow/ModalDialog.js');
global.ModalDialog = ModalDialog;
window.ModalDialog = ModalDialog;

// Mock CategoryRadioButtons
global.CategoryRadioButtons = class CategoryRadioButtons {
  constructor(onChange) {
    this.onChange = onChange;
    this.categories = new Map();
    this.activeCategory = 'base';
    this.height = 30;
    
    this.categories.set('base', []);
    this.categories.set('custom', []);
  }
  
  setActiveCategory(categoryId) {
    this.activeCategory = categoryId;
    if (this.onChange) this.onChange(categoryId);
  }
  
  handleClick(mouseX, mouseY, x, y, width) {
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

const EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette.js');

setupTestEnvironment({ rendering: true });

describe('Custom Entities - Full Workflow Integration', function() {
  let palette;
  
  beforeEach(function() {
    localStorage.clear();
    palette = new EntityPalette();
    palette.setCategory('custom');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('Add Workflow', function() {
    it('should add entity that appears in list and persists to LocalStorage', function() {
      // Add entity
      const entity = palette.addCustomEntity('Test Entity', 'ant_worker', {
        health: 150,
        movementSpeed: 40
      });
      
      expect(entity).to.exist;
      expect(entity.id).to.match(/^custom_entity_/);
      expect(entity.customName).to.equal('Test Entity');
      
      // Verify appears in list
      const templates = palette.getTemplates('custom');
      expect(templates).to.have.lengthOf(1);
      expect(templates[0].customName).to.equal('Test Entity');
      
      // Verify persists to LocalStorage
      const stored = localStorage.getItem('antGame_customEntities');
      expect(stored).to.exist;
      const data = JSON.parse(stored);
      expect(data).to.have.lengthOf(1);
      expect(data[0].customName).to.equal('Test Entity');
    });
    
    it('should preserve custom properties through add workflow', function() {
      const properties = {
        health: 200,
        movementSpeed: 50,
        damage: 30,
        faction: 'player'
      };
      
      const entity = palette.addCustomEntity('Elite Soldier', 'ant_soldier', properties);
      
      expect(entity.properties).to.deep.equal(properties);
      
      // Verify properties in storage
      const stored = JSON.parse(localStorage.getItem('antGame_customEntities'));
      expect(stored[0].properties).to.deep.equal(properties);
    });
  });
  
  describe('Rename Workflow', function() {
    it('should rename entity with updates in list and LocalStorage', function() {
      // Add entity
      const entity = palette.addCustomEntity('Original Name', 'ant_worker', {});
      const entityId = entity.id;
      
      // Rename
      const success = palette.renameCustomEntity(entityId, 'New Name');
      expect(success).to.be.true;
      
      // Verify updated in list
      const updated = palette.getCustomEntity(entityId);
      expect(updated.customName).to.equal('New Name');
      
      // Verify updated in LocalStorage
      const stored = JSON.parse(localStorage.getItem('antGame_customEntities'));
      expect(stored[0].customName).to.equal('New Name');
      expect(stored[0].lastModified).to.exist;
    });
    
    it('should preserve properties during rename', function() {
      const properties = { health: 150, movementSpeed: 40 };
      const entity = palette.addCustomEntity('Original', 'ant_worker', properties);
      
      palette.renameCustomEntity(entity.id, 'Renamed');
      
      const updated = palette.getCustomEntity(entity.id);
      expect(updated.properties).to.deep.equal(properties);
    });
  });
  
  describe('Delete Workflow', function() {
    it('should delete entity removing from list and LocalStorage', function() {
      // Add entity
      const entity = palette.addCustomEntity('To Delete', 'ant_worker', {});
      const entityId = entity.id;
      
      // Verify exists
      expect(palette.getCustomEntity(entityId)).to.exist;
      
      // Delete
      const success = palette.deleteCustomEntity(entityId);
      expect(success).to.be.true;
      
      // Verify removed from list
      expect(palette.getCustomEntity(entityId)).to.be.null;
      
      // Verify removed from LocalStorage
      const stored = localStorage.getItem('antGame_customEntities');
      const data = stored ? JSON.parse(stored) : [];
      expect(data).to.have.lengthOf(0);
    });
    
    it('should handle deleting non-existent entity gracefully', function() {
      const success = palette.deleteCustomEntity('non_existent_id');
      expect(success).to.be.false;
    });
  });
  
  describe('Category Switching', function() {
    it('should persist custom entities when switching categories', function() {
      // Add custom entity
      palette.addCustomEntity('Custom 1', 'ant_worker', {});
      
      // Switch to base category
      palette.setCategory('base');
      expect(palette.getCategory()).to.equal('base');
      
      // Switch back to custom
      palette.setCategory('custom');
      expect(palette.getCategory()).to.equal('custom');
      
      // Verify entity still exists
      const templates = palette.getTemplates('custom');
      expect(templates).to.have.lengthOf(1);
      expect(templates[0].customName).to.equal('Custom 1');
    });
    
    it('should maintain selection state when switching away and back', function() {
      const entity = palette.addCustomEntity('Custom 1', 'ant_worker', {});
      
      // Select entity
      palette.selectTemplate(entity.id);
      expect(palette.getSelectedTemplate()).to.exist;
      
      // Switch category (clears selection)
      palette.setCategory('base');
      expect(palette.getSelectedTemplate()).to.be.null;
      
      // Switch back
      palette.setCategory('custom');
      
      // Entity still exists but selection cleared
      expect(palette.getCustomEntity(entity.id)).to.exist;
    });
  });
  
  describe('Page Reload Simulation', function() {
    it('should restore custom entities from LocalStorage on initialization', function() {
      // Add entities
      palette.addCustomEntity('Entity 1', 'ant_worker', { health: 100 });
      palette.addCustomEntity('Entity 2', 'ant_soldier', { health: 200 });
      
      // Simulate page reload (create new palette instance)
      const newPalette = new EntityPalette();
      newPalette.setCategory('custom');
      
      // Verify entities restored
      const templates = newPalette.getTemplates('custom');
      expect(templates).to.have.lengthOf(2);
      expect(templates[0].customName).to.equal('Entity 1');
      expect(templates[1].customName).to.equal('Entity 2');
      expect(templates[0].properties.health).to.equal(100);
      expect(templates[1].properties.health).to.equal(200);
    });
    
    it('should restore empty custom list if no data in LocalStorage', function() {
      // Ensure clean storage
      localStorage.clear();
      
      const newPalette = new EntityPalette();
      newPalette.setCategory('custom');
      
      const templates = newPalette.getTemplates('custom');
      expect(templates).to.be.an('array').that.is.empty;
    });
  });
  
  describe('Multiple Entities', function() {
    it('should display all custom entities correctly', function() {
      // Add multiple entities
      palette.addCustomEntity('Worker 1', 'ant_worker', { health: 100 });
      palette.addCustomEntity('Worker 2', 'ant_worker', { health: 110 });
      palette.addCustomEntity('Soldier 1', 'ant_soldier', { health: 200 });
      palette.addCustomEntity('Soldier 2', 'ant_soldier', { health: 210 });
      
      const templates = palette.getTemplates('custom');
      expect(templates).to.have.lengthOf(4);
      
      // Verify order (chronological by creation)
      expect(templates[0].customName).to.equal('Worker 1');
      expect(templates[1].customName).to.equal('Worker 2');
      expect(templates[2].customName).to.equal('Soldier 1');
      expect(templates[3].customName).to.equal('Soldier 2');
    });
    
    it('should handle many custom entities (performance)', function() {
      // Add 50 entities
      for (let i = 1; i <= 50; i++) {
        palette.addCustomEntity(`Entity ${i}`, 'ant_worker', { health: 100 + i });
      }
      
      const templates = palette.getTemplates('custom');
      expect(templates).to.have.lengthOf(50);
      
      // Verify can retrieve any entity
      const entity25 = templates.find(e => e.customName === 'Entity 25');
      expect(entity25).to.exist;
      expect(entity25.properties.health).to.equal(125);
    });
  });
  
  describe('Selection Workflow', function() {
    it('should select custom entity and return full template', function() {
      const entity = palette.addCustomEntity('Custom Worker', 'ant_worker', {
        health: 150,
        movementSpeed: 45
      });
      
      palette.selectTemplate(entity.id);
      
      const selected = palette.getSelectedTemplate();
      expect(selected).to.exist;
      expect(selected.id).to.equal(entity.id);
      expect(selected.customName).to.equal('Custom Worker');
      expect(selected.baseTemplateId).to.equal('ant_worker');
      expect(selected.properties.health).to.equal(150);
    });
    
    it('should preserve properties when selecting custom entity', function() {
      const properties = {
        health: 200,
        movementSpeed: 50,
        damage: 35,
        faction: 'player',
        customProperty: 'value'
      };
      
      const entity = palette.addCustomEntity('Elite', 'ant_soldier', properties);
      palette.selectTemplate(entity.id);
      
      const selected = palette.getSelectedTemplate();
      expect(selected.properties).to.deep.equal(properties);
    });
  });
  
  describe('Mixed Single Entities and Groups', function() {
    it('should handle both single entities and groups in custom category', function() {
      // Add single entity
      const single = palette.addCustomEntity('Single', 'ant_worker', { health: 100 });
      
      // Add group
      const group = palette.addCustomEntityGroup('Squad', [
        { baseTemplateId: 'ant_soldier', position: { x: 0, y: 0 }, properties: {} },
        { baseTemplateId: 'ant_soldier', position: { x: 2, y: 0 }, properties: {} }
      ]);
      
      const templates = palette.getTemplates('custom');
      expect(templates).to.have.lengthOf(2);
      
      // Verify single entity
      expect(single.isGroup).to.be.false;
      
      // Verify group
      expect(group.isGroup).to.be.true;
      expect(group.entities).to.have.lengthOf(2);
    });
  });
  
  describe('Complete CRUD Cycle', function() {
    it('should execute full CRUD cycle on single entity', function() {
      // CREATE
      const entity = palette.addCustomEntity('Worker', 'ant_worker', { health: 100 });
      expect(palette.getTemplates('custom')).to.have.lengthOf(1);
      
      // READ
      const retrieved = palette.getCustomEntity(entity.id);
      expect(retrieved.customName).to.equal('Worker');
      
      // UPDATE (rename)
      palette.renameCustomEntity(entity.id, 'Elite Worker');
      const updated = palette.getCustomEntity(entity.id);
      expect(updated.customName).to.equal('Elite Worker');
      
      // DELETE
      palette.deleteCustomEntity(entity.id);
      expect(palette.getCustomEntity(entity.id)).to.be.null;
      expect(palette.getTemplates('custom')).to.have.lengthOf(0);
    });
  });
  
  describe('Error Handling', function() {
    it('should handle duplicate names gracefully', function() {
      palette.addCustomEntity('Duplicate', 'ant_worker', {});
      
      // Try to add duplicate
      const duplicate = palette.addCustomEntity('Duplicate', 'ant_soldier', {});
      expect(duplicate).to.be.null;
      
      // Verify only one exists
      expect(palette.getTemplates('custom')).to.have.lengthOf(1);
    });
    
    it('should handle rename to duplicate name', function() {
      palette.addCustomEntity('Name 1', 'ant_worker', {});
      const entity2 = palette.addCustomEntity('Name 2', 'ant_soldier', {});
      
      // Try to rename to duplicate
      const success = palette.renameCustomEntity(entity2.id, 'Name 1');
      expect(success).to.be.false;
      
      // Verify name unchanged
      const unchanged = palette.getCustomEntity(entity2.id);
      expect(unchanged.customName).to.equal('Name 2');
    });
    
    it('should handle corrupted LocalStorage data', function() {
      // Corrupt storage
      localStorage.setItem('antGame_customEntities', 'invalid json {]');
      
      // Should not crash, returns empty array
      const newPalette = new EntityPalette();
      newPalette.setCategory('custom');
      
      const templates = newPalette.getTemplates('custom');
      expect(templates).to.be.an('array').that.is.empty;
    });
  });
});
