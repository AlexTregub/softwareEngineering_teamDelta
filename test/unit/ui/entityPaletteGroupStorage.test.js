/**
 * Unit Tests: EntityPalette Group Storage
 * Tests for saving/loading entity groups to LocalStorage
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock dependencies
global.localStorage = {
  _data: {},
  getItem: function(key) {
    return this._data[key] || null;
  },
  setItem: function(key, value) {
    this._data[key] = value;
  },
  clear: function() {
    this._data = {};
  }
};

describe('EntityPalette - Group Storage', function() {
  let EntityPalette, CategoryRadioButtons;
  let palette;
  
  beforeEach(function() {
    // Clear localStorage
    global.localStorage.clear();
    
    // Mock CategoryRadioButtons
    CategoryRadioButtons = class {
      constructor(callback) {
        this.selected = 'entities';
        this.height = 30;
        this.onChangeCallback = callback;
      }
      render() {}
      handleClick() { return null; }
      setSelected(id) { this.selected = id; }
    };
    global.CategoryRadioButtons = CategoryRadioButtons;
    
    // Load EntityPalette
    delete require.cache[require.resolve('../../../Classes/ui/EntityPalette.js')];
    EntityPalette = require('../../../Classes/ui/EntityPalette.js');
    
    palette = new EntityPalette();
    palette.setCategory('custom');
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.CategoryRadioButtons;
  });
  
  describe('addCustomEntityGroup()', function() {
    it('should create a group with multiple entities', function() {
      const groupName = 'Defense Squad';
      const entities = [
        {
          baseTemplateId: 'ant_soldier',
          position: { x: 0, y: 0 },
          properties: { health: 200, faction: 'player' }
        },
        {
          baseTemplateId: 'ant_soldier',
          position: { x: 2, y: 0 },
          properties: { health: 200, faction: 'player' }
        }
      ];
      
      const group = palette.addCustomEntityGroup(groupName, entities);
      
      expect(group).to.exist;
      expect(group.isGroup).to.be.true;
      expect(group.customName).to.equal(groupName);
      expect(group.entities).to.deep.equal(entities);
    });
    
    it('should generate unique ID for group', function() {
      const entities = [
        { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} },
        { baseTemplateId: 'ant_soldier', position: { x: 1, y: 0 }, properties: {} }
      ];
      
      const group1 = palette.addCustomEntityGroup('Group 1', entities);
      const group2 = palette.addCustomEntityGroup('Group 2', entities);
      
      expect(group1.id).to.not.equal(group2.id);
      expect(group1.id).to.include('custom_group_');
      expect(group2.id).to.include('custom_group_');
    });
    
    it('should add createdAt timestamp to group', function() {
      const entities = [
        { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} }
      ];
      
      const before = new Date().toISOString();
      const group = palette.addCustomEntityGroup('My Group', entities);
      const after = new Date().toISOString();
      
      expect(group.createdAt).to.exist;
      expect(group.createdAt >= before).to.be.true;
      expect(group.createdAt <= after).to.be.true;
    });
    
    it('should save group to custom templates array', function() {
      const entities = [
        { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} }
      ];
      
      const initialCount = palette.getCurrentTemplates().length;
      palette.addCustomEntityGroup('My Group', entities);
      
      expect(palette.getCurrentTemplates().length).to.equal(initialCount + 1);
    });
    
    it('should persist group to LocalStorage', function() {
      const entities = [
        { baseTemplateId: 'ant_soldier', position: { x: 0, y: 0 }, properties: { health: 150 } }
      ];
      
      palette.addCustomEntityGroup('Saved Group', entities);
      
      const stored = JSON.parse(global.localStorage.getItem('antGame_customEntities'));
      expect(stored).to.be.an('array');
      expect(stored.length).to.equal(1);
      expect(stored[0].customName).to.equal('Saved Group');
      expect(stored[0].isGroup).to.be.true;
    });
    
    it('should handle single entity as group (edge case)', function() {
      const entities = [
        { baseTemplateId: 'ant_queen', position: { x: 0, y: 0 }, properties: { health: 300 } }
      ];
      
      const group = palette.addCustomEntityGroup('Solo Queen', entities);
      
      expect(group.isGroup).to.be.true;
      expect(group.entities.length).to.equal(1);
    });
    
    it('should preserve entity properties in group', function() {
      const entities = [
        {
          baseTemplateId: 'ant_soldier',
          position: { x: 0, y: 0 },
          properties: { health: 250, movementSpeed: 40, faction: 'player' }
        },
        {
          baseTemplateId: 'ant_worker',
          position: { x: 1, y: 1 },
          properties: { health: 120, movementSpeed: 30, faction: 'player' }
        }
      ];
      
      const group = palette.addCustomEntityGroup('Mixed Squad', entities);
      
      expect(group.entities[0].properties.health).to.equal(250);
      expect(group.entities[0].properties.movementSpeed).to.equal(40);
      expect(group.entities[1].properties.health).to.equal(120);
    });
    
    it('should handle empty entities array gracefully', function() {
      const group = palette.addCustomEntityGroup('Empty Group', []);
      
      expect(group.isGroup).to.be.true;
      expect(group.entities).to.deep.equal([]);
    });
  });
  
  describe('loadCustomEntities() with groups', function() {
    it('should load groups from LocalStorage', function() {
      const groupData = {
        id: 'custom_group_123',
        customName: 'Saved Defense',
        isGroup: true,
        entities: [
          { baseTemplateId: 'ant_soldier', position: { x: 0, y: 0 }, properties: {} },
          { baseTemplateId: 'ant_soldier', position: { x: 2, y: 0 }, properties: {} }
        ],
        createdAt: new Date().toISOString()
      };
      
      global.localStorage.setItem('antGame_customEntities', JSON.stringify([groupData]));
      
      // Recreate palette to trigger load
      delete require.cache[require.resolve('../../../Classes/ui/EntityPalette.js')];
      EntityPalette = require('../../../Classes/ui/EntityPalette.js');
      palette = new EntityPalette();
      palette.setCategory('custom');
      
      const templates = palette.getCurrentTemplates();
      expect(templates.length).to.equal(1);
      expect(templates[0].isGroup).to.be.true;
      expect(templates[0].customName).to.equal('Saved Defense');
    });
    
    it('should load mixed single entities and groups', function() {
      const mixedData = [
        {
          id: 'custom_single_1',
          customName: 'Elite Worker',
          isGroup: false,
          baseTemplateId: 'ant_worker',
          properties: { health: 150 },
          createdAt: new Date().toISOString()
        },
        {
          id: 'custom_group_1',
          customName: 'Patrol Squad',
          isGroup: true,
          entities: [
            { baseTemplateId: 'ant_scout', position: { x: 0, y: 0 }, properties: {} },
            { baseTemplateId: 'ant_scout', position: { x: 1, y: 0 }, properties: {} }
          ],
          createdAt: new Date().toISOString()
        }
      ];
      
      global.localStorage.setItem('antGame_customEntities', JSON.stringify(mixedData));
      
      delete require.cache[require.resolve('../../../Classes/ui/EntityPalette.js')];
      EntityPalette = require('../../../Classes/ui/EntityPalette.js');
      palette = new EntityPalette();
      palette.setCategory('custom');
      
      const templates = palette.getCurrentTemplates();
      expect(templates.length).to.equal(2);
      expect(templates[0].isGroup).to.be.false;
      expect(templates[1].isGroup).to.be.true;
    });
  });
  
  describe('deleteCustomEntity() with groups', function() {
    it('should delete a group', function() {
      const entities = [
        { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} }
      ];
      
      const group = palette.addCustomEntityGroup('To Delete', entities);
      const initialCount = palette.getCurrentTemplates().length;
      
      const result = palette.deleteCustomEntity(group.id);
      
      expect(result).to.be.true;
      expect(palette.getCurrentTemplates().length).to.equal(initialCount - 1);
    });
    
    it('should remove group from LocalStorage', function() {
      const entities = [
        { baseTemplateId: 'ant_soldier', position: { x: 0, y: 0 }, properties: {} }
      ];
      
      const group = palette.addCustomEntityGroup('Temp Group', entities);
      palette.deleteCustomEntity(group.id);
      
      const stored = JSON.parse(global.localStorage.getItem('antGame_customEntities'));
      expect(stored.length).to.equal(0);
    });
  });
  
  describe('renameCustomEntity() with groups', function() {
    it('should rename a group', function() {
      const entities = [
        { baseTemplateId: 'ant_soldier', position: { x: 0, y: 0 }, properties: {} }
      ];
      
      const group = palette.addCustomEntityGroup('Old Name', entities);
      const result = palette.renameCustomEntity(group.id, 'New Name');
      
      expect(result).to.be.true;
      
      const templates = palette.getCurrentTemplates();
      const renamed = templates.find(t => t.id === group.id);
      expect(renamed.customName).to.equal('New Name');
    });
    
    it('should update lastModified timestamp on rename', function(done) {
      const entities = [
        { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} }
      ];
      
      const group = palette.addCustomEntityGroup('Original', entities);
      const originalTime = group.lastModified || group.createdAt;
      
      // Wait a tiny bit
      setTimeout(() => {
        palette.renameCustomEntity(group.id, 'Renamed');
        
        const templates = palette.getCurrentTemplates();
        const renamed = templates.find(t => t.id === group.id);
        expect(renamed.lastModified).to.exist;
        expect(renamed.lastModified > originalTime).to.be.true;
        done();
      }, 10);
    });
    
    it('should persist renamed group to LocalStorage', function() {
      const entities = [
        { baseTemplateId: 'ant_scout', position: { x: 0, y: 0 }, properties: {} }
      ];
      
      const group = palette.addCustomEntityGroup('Before', entities);
      palette.renameCustomEntity(group.id, 'After');
      
      const stored = JSON.parse(global.localStorage.getItem('antGame_customEntities'));
      expect(stored[0].customName).to.equal('After');
    });
  });
});
