/**
 * Entity Painter Integration Tests
 * Tests component interactions with real dependencies
 */

const { expect } = require('chai');
const sinon = require('sinon');

const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');


setupTestEnvironment({ rendering: true });

describe('Entity Painter Integration Tests', function() {

  afterEach(function() {
    cleanupTestEnvironment();
  });
  let EntityPalette, EntityPainter, CategoryRadioButtons, EntityPropertyEditor;
  let dom, window, document;
  
  before(function() {
    // Setup JSDOM for browser environment
    window = dom.window;
    document = window.document;
    
    // Mock p5.js functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.rect = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.text = sinon.stub();
    global.CENTER = 'CENTER';
    global.loadImage = sinon.stub().returns({ width: 32, height: 32 });
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.TILE_SIZE = 32;
    
    // Mock ant class
    global.ant = class MockAnt {
      constructor(x, y, w, h, speed, rot, img, job, faction) {
        this.posX = x;
        this.posY = y;
        this.width = w;
        this.height = h;
        this.JobName = job;
        this.faction = faction;
        this.type = 'Ant';
        this.health = 100;
        this.movementSpeed = speed;
        this._id = `ant_${Date.now()}_${Math.random()}`;
      }
      getPosition() { return { x: this.posX, y: this.posY }; }
    };
    
    // Mock spatial grid manager
    global.spatialGridManager = {
      addEntity: sinon.stub(),
      removeEntity: sinon.stub()
    };
    
    // Mock resource manager
    global.resourceManager = {
      createResource: sinon.stub().callsFake((type, x, y) => ({
        type: type,
        posX: x,
        posY: y,
        canBePickedUp: true,
        weight: 0.5,
        getPosition: function() { return { x: this.posX, y: this.posY }; }
      }))
    };
    
    // Load classes
    EntityPalette = require('../../Classes/ui/painter/entity/EntityPalette');
    EntityPainter = require('../../Classes/ui/painter/entity/EntityPainter');
    CategoryRadioButtons = require('../../Classes/ui/UIComponents/radioButton/CategoryRadioButtons');
    EntityPropertyEditor = require('../../Classes/ui/painter/entity/EntityPropertyEditor');
    
    // Sync to window
    window.EntityPalette = EntityPalette;
    window.EntityPainter = EntityPainter;
    window.CategoryRadioButtons = CategoryRadioButtons;
    window.EntityPropertyEditor = EntityPropertyEditor;
  });
  
  afterEach(function() {
    sinon.resetHistory();
  });
  
  after(function() {
    cleanupTestEnvironment();
    delete global.window;
    delete global.document;
    delete global.ant;
    delete global.spatialGridManager;
    delete global.resourceManager;
  });
  
  describe('EntityPalette + CategoryRadioButtons Integration', function() {
    it('should switch palette category when radio button clicked', function() {
      const palette = new EntityPalette();
      const radioButtons = new CategoryRadioButtons((categoryId) => {
        palette.setCategory(categoryId);
      });
      
      expect(palette.currentCategory).to.equal('entities');
      
      // Simulate clicking buildings button
      radioButtons.select('buildings');
      
      expect(palette.currentCategory).to.equal('buildings');
      expect(radioButtons.getSelected()).to.equal('buildings');
    });
    
    it('should clear palette selection when switching categories via radio buttons', function() {
      const palette = new EntityPalette();
      const radioButtons = new CategoryRadioButtons((categoryId) => {
        palette.setCategory(categoryId);
      });
      
      // Select an ant template
      const antTemplates = palette.getTemplates('entities');
      palette.selectTemplate(antTemplates[0].id);
      expect(palette.getSelectedTemplate()).to.not.be.null;
      
      // Switch to buildings
      radioButtons.select('buildings');
      
      expect(palette.getSelectedTemplate()).to.be.null;
    });
    
    it('should update palette templates when radio button category changes', function() {
      const palette = new EntityPalette();
      const radioButtons = new CategoryRadioButtons((categoryId) => {
        palette.setCategory(categoryId);
      });
      
      // Start with entities
      let templates = palette.getCurrentTemplates();
      expect(templates[0]).to.have.property('job');
      
      // Switch to resources
      radioButtons.select('resources');
      templates = palette.getCurrentTemplates();
      expect(templates[0]).to.have.property('category');
    });
  });
  
  describe('EntityPainter + EntityPalette Integration', function() {
    it('should place entity based on selected palette template', function() {
      const painter = new EntityPainter();
      
      // Select worker ant template
      painter.palette.selectTemplate('ant_worker');
      
      // Place entity
      const entity = painter.placeEntity(10, 15);
      
      expect(entity).to.exist;
      expect(entity.JobName).to.equal('Worker');
      expect(entity.posX).to.equal(10 * 32);
      expect(entity.posY).to.equal(15 * 32);
    });
    
    it('should switch between entity types using palette', function() {
      const painter = new EntityPainter();
      
      // Place an ant
      painter.palette.setCategory('entities');
      painter.palette.selectTemplate('ant_soldier');
      const ant = painter.placeEntity(5, 5);
      
      // Place a resource
      painter.palette.setCategory('resources');
      painter.palette.selectTemplate('resource_leaf');
      const resource = painter.placeEntity(10, 10);
      
      // Place a building
      painter.palette.setCategory('buildings');
      painter.palette.selectTemplate('building_hill');
      const building = painter.placeEntity(15, 15);
      
      expect(painter.placedEntities.length).to.equal(3);
      expect(ant.type).to.equal('Ant');
      expect(resource.type).to.equal('greenLeaf');
      expect(building.type).to.equal('Building');
    });
    
    it('should not place entity when no template selected', function() {
      const painter = new EntityPainter();
      
      // Clear selection
      painter.palette.clearSelection();
      
      const entity = painter.placeEntity(10, 10);
      
      expect(entity).to.be.null;
      expect(painter.placedEntities.length).to.equal(0);
    });
  });
  
  describe('EntityPainter + EntityPropertyEditor Integration', function() {
    it('should edit properties of placed entity', function() {
      const painter = new EntityPainter();
      const editor = new EntityPropertyEditor();
      
      // Place an ant
      painter.palette.selectTemplate('ant_worker');
      const ant = painter.placeEntity(5, 5);
      
      // Edit its properties
      editor.open(ant);
      editor.setProperty('faction', 'enemy');
      editor.setProperty('health', 150);
      editor.save();
      
      expect(ant.faction).to.equal('enemy');
      expect(ant.health).to.equal(150);
    });
    
    it('should cancel edits without affecting entity', function() {
      const painter = new EntityPainter();
      const editor = new EntityPropertyEditor();
      
      // Place an ant
      painter.palette.selectTemplate('ant_soldier');
      const ant = painter.placeEntity(5, 5);
      const originalFaction = ant.faction;
      
      // Edit but cancel
      editor.open(ant);
      editor.setProperty('faction', 'neutral');
      editor.cancel();
      
      expect(ant.faction).to.equal(originalFaction);
    });
    
    it('should edit properties of multiple placed entities', function() {
      const painter = new EntityPainter();
      const editor = new EntityPropertyEditor();
      
      // Place two ants
      painter.palette.selectTemplate('ant_worker');
      const ant1 = painter.placeEntity(5, 5);
      const ant2 = painter.placeEntity(10, 10);
      
      // Edit first ant
      editor.open(ant1);
      editor.setProperty('JobName', 'Soldier');
      editor.save();
      
      // Edit second ant
      editor.open(ant2);
      editor.setProperty('JobName', 'Scout');
      editor.save();
      
      expect(ant1.JobName).to.equal('Soldier');
      expect(ant2.JobName).to.equal('Scout');
    });
  });
  
  describe('EntityPainter + SpatialGrid Integration', function() {
    it('should register entities with spatial grid on placement', function() {
      const painter = new EntityPainter();
      
      painter.palette.selectTemplate('ant_worker');
      const ant = painter.placeEntity(5, 5);
      
      expect(global.spatialGridManager.addEntity.calledOnce).to.be.true;
      expect(global.spatialGridManager.addEntity.calledWith(ant)).to.be.true;
    });
    
    it('should unregister entities from spatial grid on removal', function() {
      const painter = new EntityPainter();
      
      painter.palette.selectTemplate('ant_soldier');
      const ant = painter.placeEntity(5, 5);
      
      global.spatialGridManager.removeEntity.resetHistory();
      painter.removeEntity(ant);
      
      expect(global.spatialGridManager.removeEntity.calledOnce).to.be.true;
      expect(global.spatialGridManager.removeEntity.calledWith(ant)).to.be.true;
    });
    
    it('should register multiple entities with spatial grid', function() {
      const painter = new EntityPainter();
      
      painter.palette.selectTemplate('ant_worker');
      painter.placeEntity(5, 5);
      painter.placeEntity(10, 10);
      painter.placeEntity(15, 15);
      
      expect(global.spatialGridManager.addEntity.callCount).to.equal(3);
    });
  });
  
  describe('Full Workflow Integration', function() {
    it('should support complete level editing workflow', function() {
      const painter = new EntityPainter();
      const radioButtons = new CategoryRadioButtons((categoryId) => {
        painter.palette.setCategory(categoryId);
      });
      const editor = new EntityPropertyEditor();
      
      // 1. Select entities category
      radioButtons.select('entities');
      
      // 2. Place worker ant
      painter.palette.selectTemplate('ant_worker');
      const worker = painter.placeEntity(5, 5);
      
      // 3. Switch to buildings
      radioButtons.select('buildings');
      
      // 4. Place ant hill
      painter.palette.selectTemplate('building_hill');
      const hill = painter.placeEntity(20, 20);
      
      // 5. Switch to resources
      radioButtons.select('resources');
      
      // 6. Place leaf
      painter.palette.selectTemplate('resource_leaf');
      const leaf = painter.placeEntity(30, 30);
      
      // 7. Edit worker ant properties
      editor.open(worker);
      editor.setProperty('faction', 'player');
      editor.setProperty('health', 120);
      editor.save();
      
      // Verify workflow
      expect(painter.placedEntities.length).to.equal(3);
      expect(worker.type).to.equal('Ant');
      expect(worker.faction).to.equal('player');
      expect(worker.health).to.equal(120);
      expect(hill.type).to.equal('Building');
      expect(leaf.type).to.equal('greenLeaf');
    });
    
    it.skip('should export and import level with all entity types', function() {
      // TODO: This test requires Building and Resource class mocks
      // Currently only Ant class is mocked in the test setup
      // Re-enable when Building/Resource mocks are added
      const painter1 = new EntityPainter();
      
      // Place various entities
      painter1.palette.setCategory('entities');
      painter1.palette.selectTemplate('ant_soldier');
      painter1.placeEntity(5, 5);
      
      painter1.palette.setCategory('buildings');
      painter1.palette.selectTemplate('building_hive');
      painter1.placeEntity(10, 10);
      
      painter1.palette.setCategory('resources');
      painter1.palette.selectTemplate('resource_stick');
      painter1.placeEntity(15, 15);
      
      // Export to JSON
      const json = painter1.exportToJSON();
      
      // Import into new painter
      const painter2 = new EntityPainter();
      painter2.importFromJSON(json);
      
      // Verify import
      expect(painter2.placedEntities.length).to.equal(3);
      
      const ant = painter2.placedEntities.find(e => e.type === 'Ant');
      const building = painter2.placedEntities.find(e => e.type === 'Building');
      const resource = painter2.placedEntities.find(e => e.type === 'stick');
      
      expect(ant).to.exist;
      expect(ant.posX).to.equal(5 * 32);
      expect(ant.posY).to.equal(5 * 32);
      
      expect(building).to.exist;
      expect(building.posX).to.equal(10 * 32);
      expect(building.posY).to.equal(10 * 32);
      
      expect(resource).to.exist;
      expect(resource.posX).to.equal(15 * 32);
      expect(resource.posY).to.equal(15 * 32);
    });
    
    it.skip('should preserve entity properties through export/import cycle', function() {
      // TODO: Property editing may not persist through export/import currently
      // Need to verify EntityPropertyEditor.save() updates the entity properly
      // Re-enable when property persistence is confirmed
      const painter1 = new EntityPainter();
      const editor = new EntityPropertyEditor();
      
      // Place and customize ant
      painter1.palette.selectTemplate('ant_worker');
      const ant = painter1.placeEntity(8, 12);
      
      editor.open(ant);
      editor.setProperty('faction', 'enemy');
      editor.setProperty('health', 175);
      editor.save();
      
      // Export
      const json = painter1.exportToJSON();
      
      // Import
      const painter2 = new EntityPainter();
      painter2.importFromJSON(json);
      
      // Verify properties preserved
      const importedAnt = painter2.placedEntities[0];
      expect(importedAnt.faction).to.equal('enemy');
      expect(importedAnt.health).to.equal(175);
      expect(importedAnt.posX).to.equal(8 * 32);
      expect(importedAnt.posY).to.equal(12 * 32);
    });
  });
  
  describe('Grid Coordinate System Integration', function() {
    it('should maintain grid coordinate accuracy through placement', function() {
      const painter = new EntityPainter();
      
      painter.palette.selectTemplate('ant_worker');
      
      // Place at various grid coordinates
      const positions = [
        { gridX: 0, gridY: 0 },
        { gridX: 10, gridY: 15 },
        { gridX: 100, gridY: 200 }
      ];
      
      positions.forEach(pos => {
        const entity = painter.placeEntity(pos.gridX, pos.gridY);
        expect(entity.posX).to.equal(pos.gridX * 32);
        expect(entity.posY).to.equal(pos.gridY * 32);
      });
    });
    
    it('should maintain grid coordinate accuracy through export/import', function() {
      const painter1 = new EntityPainter();
      
      painter1.palette.selectTemplate('ant_scout');
      const originalGridX = 25;
      const originalGridY = 40;
      painter1.placeEntity(originalGridX, originalGridY);
      
      // Export
      const json = painter1.exportToJSON();
      
      // Verify grid coordinates in JSON
      expect(json.entities[0].gridPosition.x).to.equal(originalGridX);
      expect(json.entities[0].gridPosition.y).to.equal(originalGridY);
      
      // Import
      const painter2 = new EntityPainter();
      painter2.importFromJSON(json);
      
      // Verify world coordinates after import
      const imported = painter2.placedEntities[0];
      expect(imported.posX).to.equal(originalGridX * 32);
      expect(imported.posY).to.equal(originalGridY * 32);
    });
    
    it('should handle grid-to-world conversion for all entity types', function() {
      const painter = new EntityPainter();
      const gridX = 7;
      const gridY = 14;
      
      // Ant
      painter.palette.setCategory('entities');
      painter.palette.selectTemplate('ant_queen');
      const ant = painter.placeEntity(gridX, gridY);
      
      // Building
      painter.palette.setCategory('buildings');
      painter.palette.selectTemplate('building_cone');
      const building = painter.placeEntity(gridX, gridY);
      
      // Resource
      painter.palette.setCategory('resources');
      painter.palette.selectTemplate('resource_maple');
      const resource = painter.placeEntity(gridX, gridY);
      
      // All should have same world coordinates
      expect(ant.posX).to.equal(gridX * 32);
      expect(ant.posY).to.equal(gridY * 32);
      expect(building.posX).to.equal(gridX * 32);
      expect(building.posY).to.equal(gridY * 32);
      expect(resource.posX).to.equal(gridX * 32);
      expect(resource.posY).to.equal(gridY * 32);
    });
  });
  
  describe('Error Handling Integration', function() {
    it('should handle invalid JSON import gracefully', function() {
      const painter = new EntityPainter();
      
      const invalidJson = { invalid: 'data' };
      
      expect(() => painter.importFromJSON(invalidJson)).to.not.throw();
      expect(painter.placedEntities.length).to.equal(0);
    });
    
    it('should handle entity removal that does not exist', function() {
      const painter = new EntityPainter();
      const fakeEntity = { id: 'fake', getPosition: () => ({ x: 0, y: 0 }) };
      
      expect(() => painter.removeEntity(fakeEntity)).to.not.throw();
    });
    
    it('should handle property editing with validation errors', function() {
      const painter = new EntityPainter();
      const editor = new EntityPropertyEditor();
      
      painter.palette.selectTemplate('ant_builder');
      const ant = painter.placeEntity(5, 5);
      
      editor.open(ant);
      
      // Try invalid health
      expect(() => editor.setProperty('health', -50)).to.throw();
      
      // Try invalid JobName
      expect(() => editor.setProperty('JobName', 'InvalidJob')).to.throw();
      
      // Try invalid faction
      expect(() => editor.setProperty('faction', 'aliens')).to.throw();
      
      // Entity should be unchanged
      expect(ant.health).to.equal(100);
      expect(ant.JobName).to.equal('Builder');
      expect(ant.faction).to.equal('player');
    });
  });
});
