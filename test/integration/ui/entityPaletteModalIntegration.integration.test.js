/**
 * Integration Tests: EntityPalette Modal Integration
 * 
 * Tests modal dialog integration with EntityPalette for:
 * - Add new custom entity modal
 * - Rename entity modal
 * - Delete confirmation modal
 * - Validation and callbacks
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Setup global window object
if (typeof window === 'undefined') {
  global.window = {};
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

// Load classes
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

describe('EntityPalette - Modal Integration', function() {
  let palette;
  
  beforeEach(function() {
    localStorage.clear();
    palette = new EntityPalette();
    palette.setCategory('custom');
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Add New Custom Entity Modal', function() {
    it('should show add modal with correct configuration', function() {
      const onConfirm = sinon.spy();
      
      palette.showAddCustomEntityModal(onConfirm);
      
      const modal = palette.getModal();
      expect(modal.isVisible()).to.be.true;
      expect(modal.title).to.include('Add New Custom Entity');
      expect(modal.hasInput).to.be.true;
      expect(modal.buttons).to.have.lengthOf(2);
    });
    
    it('should call onConfirm with trimmed name when saved', function() {
      const onConfirm = sinon.spy();
      
      palette.showAddCustomEntityModal(onConfirm);
      
      const modal = palette.getModal();
      modal.inputValue = '  Test Entity  ';
      
      // Click Save button (right side, primary)
      modal.handleClick(497, 410);
      
      expect(onConfirm.calledOnce).to.be.true;
      expect(onConfirm.calledWith('Test Entity')).to.be.true;
    });
    
    it('should prevent duplicate names in add modal', function() {
      palette.addCustomEntity('Existing Entity', 'ant_worker', {});
      
      const onConfirm = sinon.spy();
      palette.showAddCustomEntityModal(onConfirm);
      
      const modal = palette.getModal();
      modal.inputValue = 'Existing Entity';
      
      const isValid = modal.validateInput();
      expect(isValid).to.be.false;
      expect(modal.errorMessage).to.include('duplicate');
    });
    
    it('should prevent empty names in add modal', function() {
      const onConfirm = sinon.spy();
      palette.showAddCustomEntityModal(onConfirm);
      
      const modal = palette.getModal();
      modal.inputValue = '   ';
      
      const isValid = modal.validateInput();
      expect(isValid).to.be.false;
    });
  });
  
  describe('Rename Entity Modal', function() {
    it('should show rename modal with current name', function() {
      const entity = palette.addCustomEntity('Original Name', 'ant_worker', {});
      
      const onConfirm = sinon.spy();
      palette.showRenameEntityModal(entity, onConfirm);
      
      const modal = palette.getModal();
      expect(modal.isVisible()).to.be.true;
      expect(modal.title).to.include('Rename');
      expect(modal.inputValue).to.equal('Original Name');
      expect(modal.hasInput).to.be.true;
    });
    
    it('should call onConfirm with entity ID and new name', function() {
      const entity = palette.addCustomEntity('Original Name', 'ant_worker', {});
      
      const onConfirm = sinon.spy();
      palette.showRenameEntityModal(entity, onConfirm);
      
      const modal = palette.getModal();
      modal.inputValue = 'New Name';
      
      // Click Save button
      modal.handleClick(497, 410);
      
      expect(onConfirm.calledOnce).to.be.true;
      expect(onConfirm.calledWith(entity.id, 'New Name')).to.be.true;
    });
    
    it('should prevent renaming to duplicate name', function() {
      const entity1 = palette.addCustomEntity('Entity 1', 'ant_worker', {});
      const entity2 = palette.addCustomEntity('Entity 2', 'ant_soldier', {});
      
      const onConfirm = sinon.spy();
      palette.showRenameEntityModal(entity1, onConfirm);
      
      const modal = palette.getModal();
      modal.inputValue = 'Entity 2'; // Try to use existing name
      
      const isValid = modal.validateInput();
      expect(isValid).to.be.false;
      expect(modal.errorMessage).to.include('duplicate');
    });
    
    it('should allow renaming to same name (no change)', function() {
      const entity = palette.addCustomEntity('Entity 1', 'ant_worker', {});
      
      const onConfirm = sinon.spy();
      palette.showRenameEntityModal(entity, onConfirm);
      
      const modal = palette.getModal();
      modal.inputValue = 'Entity 1'; // Keep same name
      
      const isValid = modal.validateInput();
      expect(isValid).to.be.true; // Should be valid (it's the same entity)
    });
  });
  
  describe('Delete Entity Modal', function() {
    it('should show delete confirmation with entity name', function() {
      const entity = palette.addCustomEntity('Test Entity', 'ant_worker', {});
      
      const onConfirm = sinon.spy();
      palette.showDeleteEntityModal(entity, onConfirm);
      
      const modal = palette.getModal();
      expect(modal.isVisible()).to.be.true;
      expect(modal.title).to.include('Delete');
      expect(modal.message).to.include('Test Entity');
      expect(modal.message).to.include('cannot be undone');
      expect(modal.hasInput).to.be.false;
    });
    
    it('should call onConfirm with entity ID when confirmed', function() {
      const entity = palette.addCustomEntity('Test Entity', 'ant_worker', {});
      
      const onConfirm = sinon.spy();
      palette.showDeleteEntityModal(entity, onConfirm);
      
      const modal = palette.getModal();
      
      // Click Delete button (right side, primary)
      modal.handleClick(497, 410);
      
      expect(onConfirm.calledOnce).to.be.true;
      expect(onConfirm.calledWith(entity.id)).to.be.true;
    });
    
    it('should not delete when cancelled', function() {
      const entity = palette.addCustomEntity('Test Entity', 'ant_worker', {});
      
      const onConfirm = sinon.spy();
      palette.showDeleteEntityModal(entity, onConfirm);
      
      const modal = palette.getModal();
      
      // Click Cancel button (left side, secondary)
      modal.handleClick(302, 410);
      
      expect(onConfirm.called).to.be.false;
    });
    
    it('should show group type in delete confirmation', function() {
      const group = palette.addCustomEntityGroup('My Squad', [
        { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} }
      ]);
      
      const onConfirm = sinon.spy();
      palette.showDeleteEntityModal(group, onConfirm);
      
      const modal = palette.getModal();
      expect(modal.title).to.include('Group');
    });
  });
  
  describe('Modal Keyboard Shortcuts', function() {
    it('should confirm add modal with Enter key', function() {
      const onConfirm = sinon.spy();
      palette.showAddCustomEntityModal(onConfirm);
      
      const modal = palette.getModal();
      modal.inputValue = 'Test Entity';
      
      modal.handleKeyPress('Enter');
      
      expect(onConfirm.calledOnce).to.be.true;
      expect(onConfirm.calledWith('Test Entity')).to.be.true;
    });
    
    it('should cancel modal with Escape key', function() {
      const onConfirm = sinon.spy();
      palette.showDeleteEntityModal({ id: 'test', customName: 'Test' }, onConfirm);
      
      const modal = palette.getModal();
      
      modal.handleKeyPress('Escape');
      
      expect(modal.isVisible()).to.be.false;
      expect(onConfirm.called).to.be.false;
    });
  });
  
  describe('Full Add Workflow', function() {
    it('should add entity through modal workflow', function() {
      const onConfirm = sinon.spy((name) => {
        palette.addCustomEntity(name, 'ant_worker', { health: 150 });
      });
      
      palette.showAddCustomEntityModal(onConfirm);
      
      const modal = palette.getModal();
      modal.inputValue = 'New Entity';
      modal.handleClick(497, 410); // Click Save
      
      expect(onConfirm.calledWith('New Entity')).to.be.true;
      
      const entity = palette.getCustomEntity(onConfirm.returnValues[0]);
      // Entity was added by callback
      const allCustom = palette.getTemplates('custom');
      expect(allCustom.length).to.equal(1);
      expect(allCustom[0].customName).to.equal('New Entity');
    });
  });
  
  describe('Full Rename Workflow', function() {
    it('should rename entity through modal workflow', function() {
      const entity = palette.addCustomEntity('Original', 'ant_worker', {});
      
      const onConfirm = sinon.spy((entityId, newName) => {
        palette.renameCustomEntity(entityId, newName);
      });
      
      palette.showRenameEntityModal(entity, onConfirm);
      
      const modal = palette.getModal();
      modal.inputValue = 'Renamed';
      modal.handleClick(497, 410); // Click Save
      
      expect(onConfirm.calledWith(entity.id, 'Renamed')).to.be.true;
      
      const updated = palette.getCustomEntity(entity.id);
      expect(updated.customName).to.equal('Renamed');
    });
  });
  
  describe('Full Delete Workflow', function() {
    it('should delete entity through modal workflow', function() {
      const entity = palette.addCustomEntity('To Delete', 'ant_worker', {});
      
      const onConfirm = sinon.spy((entityId) => {
        palette.deleteCustomEntity(entityId);
      });
      
      palette.showDeleteEntityModal(entity, onConfirm);
      
      const modal = palette.getModal();
      modal.handleClick(497, 410); // Click Delete
      
      expect(onConfirm.calledWith(entity.id)).to.be.true;
      
      const deleted = palette.getCustomEntity(entity.id);
      expect(deleted).to.be.null;
    });
  });
});
