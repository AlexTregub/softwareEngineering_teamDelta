/**
 * EntityPropertyEditor Unit Tests
 * Tests for entity property editing dialog
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityPropertyEditor', function() {
  let EntityPropertyEditor, ant;
  
  before(function() {
    // Mock global dependencies
    global.loadImage = sinon.stub().returns({ width: 32, height: 32 });
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    
    // Mock ant class
    global.ant = class MockAnt {
      constructor(x, y, w, h, speed, rot, img, job, faction) {
        this.posX = x;
        this.posY = y;
        this.JobName = job;
        this.faction = faction;
        this.health = 100;
        this.movementSpeed = speed;
        this.type = 'Ant';
      }
    };
    
    // Load EntityPropertyEditor
    const EntityPropertyEditorModule = require('../../../Classes/ui/EntityPropertyEditor');
    EntityPropertyEditor = EntityPropertyEditorModule.EntityPropertyEditor || EntityPropertyEditorModule;
  });
  
  afterEach(function() {
    sinon.resetHistory();
  });
  
  after(function() {
    sinon.restore();
    delete global.ant;
  });
  
  describe('Dialog Management', function() {
    it('should open dialog for entity', function() {
      const editor = new EntityPropertyEditor();
      const mockEntity = { type: 'Ant', JobName: 'Worker' };
      
      editor.open(mockEntity);
      expect(editor.isVisible()).to.be.true;
    });
    
    it('should close dialog', function() {
      const editor = new EntityPropertyEditor();
      const mockEntity = { type: 'Ant', JobName: 'Worker' };
      
      editor.open(mockEntity);
      editor.close();
      expect(editor.isVisible()).to.be.false;
    });
    
    it('should store reference to entity', function() {
      const editor = new EntityPropertyEditor();
      const mockEntity = { type: 'Ant', JobName: 'Worker' };
      
      editor.open(mockEntity);
      expect(editor.currentEntity).to.equal(mockEntity);
    });
    
    it('should clear entity reference on close', function() {
      const editor = new EntityPropertyEditor();
      const mockEntity = { type: 'Ant', JobName: 'Worker' };
      
      editor.open(mockEntity);
      editor.close();
      expect(editor.currentEntity).to.be.null;
    });
  });
  
  describe('Display Properties - Ant', function() {
    it('should display ant JobName property', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Soldier', 'player');
      
      editor.open(entity);
      expect(editor.getProperty('JobName')).to.equal('Soldier');
    });
    
    it('should display ant faction property', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Worker', 'enemy');
      
      editor.open(entity);
      expect(editor.getProperty('faction')).to.equal('enemy');
    });
    
    it('should display ant health property', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Scout', 'player');
      
      editor.open(entity);
      expect(editor.getProperty('health')).to.equal(100);
    });
    
    it('should display ant movement speed property', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 35, 0, null, 'Worker', 'player');
      
      editor.open(entity);
      expect(editor.getProperty('movementSpeed')).to.equal(35);
    });
  });
  
  describe('Display Properties - Resource', function() {
    it('should display resource type property', function() {
      const editor = new EntityPropertyEditor();
      const mockResource = {
        type: 'greenLeaf',
        canBePickedUp: true,
        weight: 0.5
      };
      
      editor.open(mockResource);
      expect(editor.getProperty('type')).to.equal('greenLeaf');
    });
    
    it('should display resource canBePickedUp property', function() {
      const editor = new EntityPropertyEditor();
      const mockResource = {
        type: 'stone',
        canBePickedUp: false,
        weight: 5
      };
      
      editor.open(mockResource);
      expect(editor.getProperty('canBePickedUp')).to.equal(false);
    });
    
    it('should display resource weight property', function() {
      const editor = new EntityPropertyEditor();
      const mockResource = {
        type: 'stick',
        canBePickedUp: true,
        weight: 0.6
      };
      
      editor.open(mockResource);
      expect(editor.getProperty('weight')).to.equal(0.6);
    });
  });
  
  describe('Display Properties - Building', function() {
    it('should display building type property', function() {
      const editor = new EntityPropertyEditor();
      const mockBuilding = {
        type: 'Building',
        buildingType: 'colony',
        size: { w: 64, h: 64 }
      };
      
      editor.open(mockBuilding);
      expect(editor.getProperty('buildingType')).to.equal('colony');
    });
    
    it('should display building size property', function() {
      const editor = new EntityPropertyEditor();
      const mockBuilding = {
        type: 'Building',
        buildingType: 'storage',
        size: { w: 48, h: 48 }
      };
      
      editor.open(mockBuilding);
      const size = editor.getProperty('size');
      expect(size).to.deep.equal({ w: 48, h: 48 });
    });
  });
  
  describe('Editing Properties', function() {
    it('should update property value', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Worker', 'player');
      
      editor.open(entity);
      editor.setProperty('faction', 'enemy');
      
      expect(editor.getProperty('faction')).to.equal('enemy');
    });
    
    it('should update multiple properties', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Worker', 'player');
      
      editor.open(entity);
      editor.setProperty('JobName', 'Soldier');
      editor.setProperty('faction', 'enemy');
      
      expect(editor.getProperty('JobName')).to.equal('Soldier');
      expect(editor.getProperty('faction')).to.equal('enemy');
    });
    
    it('should track pending changes before save', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Worker', 'player');
      
      editor.open(entity);
      editor.setProperty('faction', 'enemy');
      
      expect(editor.hasPendingChanges()).to.be.true;
    });
  });
  
  describe('Save Changes', function() {
    it('should apply changes to entity on save', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Worker', 'player');
      
      editor.open(entity);
      editor.setProperty('faction', 'enemy');
      editor.save();
      
      expect(entity.faction).to.equal('enemy');
    });
    
    it('should apply multiple changes on save', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Worker', 'player');
      
      editor.open(entity);
      editor.setProperty('JobName', 'Soldier');
      editor.setProperty('faction', 'enemy');
      editor.setProperty('health', 150);
      editor.save();
      
      expect(entity.JobName).to.equal('Soldier');
      expect(entity.faction).to.equal('enemy');
      expect(entity.health).to.equal(150);
    });
    
    it('should close dialog after save', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Worker', 'player');
      
      editor.open(entity);
      editor.setProperty('faction', 'enemy');
      editor.save();
      
      expect(editor.isVisible()).to.be.false;
    });
    
    it('should clear pending changes after save', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Worker', 'player');
      
      editor.open(entity);
      editor.setProperty('faction', 'enemy');
      editor.save();
      
      expect(editor.hasPendingChanges()).to.be.false;
    });
  });
  
  describe('Cancel Changes', function() {
    it('should discard changes on cancel', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Worker', 'player');
      const originalFaction = entity.faction;
      
      editor.open(entity);
      editor.setProperty('faction', 'enemy');
      editor.cancel();
      
      expect(entity.faction).to.equal(originalFaction);
    });
    
    it('should close dialog on cancel', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Worker', 'player');
      
      editor.open(entity);
      editor.setProperty('faction', 'enemy');
      editor.cancel();
      
      expect(editor.isVisible()).to.be.false;
    });
    
    it('should clear pending changes on cancel', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Worker', 'player');
      
      editor.open(entity);
      editor.setProperty('faction', 'enemy');
      editor.cancel();
      
      expect(editor.hasPendingChanges()).to.be.false;
    });
  });
  
  describe('Validation', function() {
    it('should prevent invalid property values', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Worker', 'player');
      
      editor.open(entity);
      
      // Try to set health to negative value
      expect(() => editor.setProperty('health', -50)).to.throw();
    });
    
    it('should validate JobName options', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Worker', 'player');
      
      editor.open(entity);
      
      // Valid JobName
      expect(() => editor.setProperty('JobName', 'Soldier')).to.not.throw();
      
      // Invalid JobName
      expect(() => editor.setProperty('JobName', 'InvalidJob')).to.throw();
    });
    
    it('should validate faction options', function() {
      const editor = new EntityPropertyEditor();
      const entity = new global.ant(100, 100, 32, 32, 30, 0, null, 'Worker', 'player');
      
      editor.open(entity);
      
      // Valid factions
      expect(() => editor.setProperty('faction', 'player')).to.not.throw();
      expect(() => editor.setProperty('faction', 'enemy')).to.not.throw();
      expect(() => editor.setProperty('faction', 'neutral')).to.not.throw();
      
      // Invalid faction
      expect(() => editor.setProperty('faction', 'invalid')).to.throw();
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle opening dialog with null entity', function() {
      const editor = new EntityPropertyEditor();
      
      expect(() => editor.open(null)).to.not.throw();
      expect(editor.isVisible()).to.be.false;
    });
    
    it('should handle getting property before opening', function() {
      const editor = new EntityPropertyEditor();
      
      expect(editor.getProperty('JobName')).to.be.null;
    });
    
    it('should handle save without opening', function() {
      const editor = new EntityPropertyEditor();
      
      expect(() => editor.save()).to.not.throw();
    });
    
    it('should handle cancel without opening', function() {
      const editor = new EntityPropertyEditor();
      
      expect(() => editor.cancel()).to.not.throw();
    });
  });
});
