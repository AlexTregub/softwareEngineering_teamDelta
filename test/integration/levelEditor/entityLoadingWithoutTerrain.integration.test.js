/**
 * Integration Test: LevelEditor.loadFromData() - Entity loading without terrain
 * Verifies entities load even when terrain data is missing/invalid
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('LevelEditor.loadFromData() - Entity loading independence', function() {
  let LevelEditor, EntityPainter, EntityPalette, TerrainImporter;
  let levelEditor;
  
  beforeEach(function() {
    // Setup JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    window.createVector = global.createVector;
    
    // Load classes
    LevelEditor = require('../../Classes/systems/ui/LevelEditor');
    EntityPainter = require('../../Classes/ui/painter/entity/EntityPainter');
    EntityPalette = require('../../Classes/ui/painter/entity/EntityPalette');
    TerrainImporter = require('../../Classes/terrainUtils/TerrainImporter');
    
    // Mock terrain
    const mockTerrain = {
      importFromJSON: sinon.stub().returns(true)
    };
    
    // Mock dependencies for LevelEditor (minimal setup)
    global.SparseTerrain = sinon.stub().returns(mockTerrain);
    global.spatialGridManager = {
      addEntity: sinon.stub(),
      removeEntity: sinon.stub()
    };
    window.spatialGridManager = global.spatialGridManager;
    
    global.EventFlagLayer = sinon.stub().returns({});
    global.ToastNotification = sinon.stub().returns({
      show: sinon.spy()
    });
    global.Toolbar = sinon.stub().returns({
      addButton: sinon.spy(),
      tools: {}
    });
    global.FileMenuBar = sinon.stub().returns({});
    global.EventEditorPanel = sinon.stub().returns({
      initialize: sinon.spy()
    });
    global.LevelEditorPanels = sinon.stub().returns({
      initialize: sinon.spy()
    });
    global.LoadDialog = sinon.stub().returns({});
    global.SaveDialog = sinon.stub().returns({});
    global.ModalDialog = sinon.stub().returns({});
    
    window.SparseTerrain = global.SparseTerrain;
    window.EventFlagLayer = global.EventFlagLayer;
    window.ToastNotification = global.ToastNotification;
    window.Toolbar = global.Toolbar;
    window.FileMenuBar = global.FileMenuBar;
    window.EventEditorPanel = global.EventEditorPanel;
    window.LevelEditorPanels = global.LevelEditorPanels;
    window.LoadDialog = global.LoadDialog;
    window.SaveDialog = global.SaveDialog;
    window.ModalDialog = global.ModalDialog;
    window.EntityPainter = EntityPainter;
    window.EntityPalette = EntityPalette;
    
    levelEditor = new LevelEditor();
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.window;
    delete global.document;
    delete global.createVector;
  });
  
  it('should load entities even when terrain data is completely missing', function() {
    const data = {
      entities: [
        {
          templateId: 'ant_worker',
          gridX: 10,
          gridY: 10,
          properties: { JobName: 'Worker' }
        }
      ]
      // NO terrain, metadata, or tiles
    };
    
    levelEditor.loadFromData(data);
    
    expect(levelEditor.entityPainter.placedEntities.length).to.equal(1);
    expect(levelEditor.entityPainter.placedEntities[0].type).to.equal('Ant');
  });
  
  it('should load entities even when terrain import fails', function() {
    // Mock terrain import to fail
    const failingImporter = sinon.stub(TerrainImporter.prototype, 'importFromJSON').returns(false);
    
    const data = {
      terrain: { /* invalid data */ },
      entities: [
        {
          templateId: 'resource_food',
          gridX: 5,
          gridY: 5,
          properties: { resourceType: 'food' }
        }
      ]
    };
    
    levelEditor.loadFromData(data);
    
    expect(levelEditor.entityPainter.placedEntities.length).to.equal(1);
    expect(levelEditor.entityPainter.placedEntities[0].type).to.equal('Resource');
    
    failingImporter.restore();
  });
  
  it('should load entities with CaveTutorial.json format (gridX/gridY, no terrain)', function() {
    const data = {
      entities: [
        {
          id: 'entity_001',
          templateId: 'ant_queen',
          gridX: 89,
          gridY: 19,
          properties: {
            JobName: 'Queen',
            faction: 'player',
            health: 300
          }
        },
        {
          id: 'entity_002',
          templateId: 'resource_food',
          gridX: 50,
          gridY: 50,
          properties: {
            resourceType: 'food',
            amount: 100
          }
        }
      ]
      // NO terrain data (like CaveTutorial.json)
    };
    
    levelEditor.loadFromData(data);
    
    expect(levelEditor.entityPainter.placedEntities.length).to.equal(2);
    
    const queen = levelEditor.entityPainter.placedEntities.find(e => e.JobName === 'Queen');
    expect(queen).to.exist;
    expect(queen.posX).to.equal(89 * 32 + 16); // Grid to world + centering
    expect(queen.posY).to.equal(19 * 32 + 16);
    
    const food = levelEditor.entityPainter.placedEntities.find(e => e.type === 'Resource');
    expect(food).to.exist;
  });
  
  it('should show warning notification when only entities load', function() {
    const data = {
      entities: [
        {
          templateId: 'ant_worker',
          gridX: 10,
          gridY: 10,
          properties: {}
        }
      ]
    };
    
    levelEditor.loadFromData(data);
    
    // Check notification was called with warning
    expect(levelEditor.notifications.show.called).to.be.true;
    const notificationCall = levelEditor.notifications.show.getCall(0);
    expect(notificationCall.args[0]).to.include('Entities loaded');
    expect(notificationCall.args[1]).to.equal('warning');
  });
});
