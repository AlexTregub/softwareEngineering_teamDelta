/**
 * Integration Test: LevelEditor entity spawn data loading
 * Verifies entities load into _entitySpawnData (not placedEntities)
 * Tests the CORRECT Level Editor workflow for spawn markers
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs');

describe('LevelEditor._entitySpawnData loading (spawn markers)', function() {
  let LevelEditor, TerrainImporter, EntityPainter, EntityPalette;
  let levelEditor, mockTerrain;
  
  beforeEach(function() {
    // Setup JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock logging functions (stub for integration test)
    global.logVerbose = sinon.stub();
    global.logNormal = sinon.stub();
    global.logSilent = sinon.stub();
    global.logQuiet = sinon.stub();
    global.logDebug = sinon.stub();
    window.logVerbose = global.logVerbose;
    window.logNormal = global.logNormal;
    
    // Mock p5.js globals
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.image = sinon.stub();
    global.tint = sinon.stub();
    global.noTint = sinon.stub();
    global.imageMode = sinon.stub();
    global.noSmooth = sinon.stub();
    
    window.createVector = global.createVector;
    window.push = global.push;
    window.pop = global.pop;
    window.TILE_SIZE = 32;
    
    // Load classes
    LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    TerrainImporter = require('../../../Classes/terrainUtils/TerrainImporter');
    EntityPainter = require('../../../Classes/ui/painter/entity/EntityPainter');
    EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette');
    
    // Mock terrain
    mockTerrain = {
      tileSize: 32,
      exportToJSON: sinon.stub().returns({ metadata: {} }),
      render: sinon.stub()
    };
    
    // Mock dependencies
    global.SparseTerrain = sinon.stub().returns(mockTerrain);
    global.TerrainEditor = sinon.stub().returns({
      canUndo: sinon.stub().returns(false),
      canRedo: sinon.stub().returns(false)
    });
    global.MaterialPalette = sinon.stub().returns({
      selectMaterial: sinon.stub(),
      loadCategories: sinon.stub(),
      getSelectedMaterial: sinon.stub().returns('grass')
    });
    global.ToolBar = sinon.stub().returns({
      addButton: sinon.stub(),
      tools: {},
      getSelectedTool: sinon.stub().returns(null),
      onToolChange: null
    });
    global.MiniMap = sinon.stub().returns({});
    global.PropertiesPanel = sinon.stub().returns({
      setTerrain: sinon.stub(),
      setEditor: sinon.stub()
    });
    global.DynamicGridOverlay = sinon.stub().returns({});
    global.GridOverlay = sinon.stub().returns({});
    global.MapBoundaryOverlay = sinon.stub().returns({});
    global.SaveDialog = sinon.stub().returns({
      useNativeDialogs: true,
      onSave: null,
      onCancel: null
    });
    global.LoadDialog = sinon.stub().returns({
      useNativeDialogs: true,
      onLoad: null,
      onCancel: null
    });
    global.NewMapDialog = sinon.stub().returns({
      onConfirm: null,
      onCancel: null
    });
    global.NotificationManager = sinon.stub().returns({
      show: sinon.stub()
    });
    global.FileMenuBar = sinon.stub().returns({
      setLevelEditor: sinon.stub(),
      render: sinon.stub(),
      updateBrushSizeVisibility: sinon.stub(),
      updateToolModeToggle: sinon.stub()
    });
    global.SelectionManager = sinon.stub().returns({});
    global.HoverPreviewManager = sinon.stub().returns({});
    global.ShortcutManager = {
      register: sinon.stub()
    };
    global.EventEditorPanel = sinon.stub().returns({
      initialize: sinon.stub()
    });
    global.EventFlagLayer = sinon.stub().returns({});
    global.LevelEditorPanels = sinon.stub().returns({
      initialize: sinon.stub(),
      render: sinon.stub()
    });
    global.cameraManager = {
      cameraX: 0,
      cameraY: 0,
      cameraZoom: 1,
      screenToWorld: sinon.stub().returns({ worldX: 0, worldY: 0 })
    };
    
    window.SparseTerrain = global.SparseTerrain;
    window.TerrainEditor = global.TerrainEditor;
    window.MaterialPalette = global.MaterialPalette;
    window.ToolBar = global.ToolBar;
    window.MiniMap = global.MiniMap;
    window.PropertiesPanel = global.PropertiesPanel;
    window.DynamicGridOverlay = global.DynamicGridOverlay;
    window.GridOverlay = global.GridOverlay;
    window.MapBoundaryOverlay = global.MapBoundaryOverlay;
    window.SaveDialog = global.SaveDialog;
    window.LoadDialog = global.LoadDialog;
    window.NewMapDialog = global.NewMapDialog;
    window.NotificationManager = global.NotificationManager;
    window.FileMenuBar = global.FileMenuBar;
    window.SelectionManager = global.SelectionManager;
    window.HoverPreviewManager = global.HoverPreviewManager;
    window.EventEditorPanel = global.EventEditorPanel;
    window.EventFlagLayer = global.EventFlagLayer;
    window.LevelEditorPanels = global.LevelEditorPanels;
    window.EntityPainter = EntityPainter;
    window.EntityPalette = EntityPalette;
    window.cameraManager = global.cameraManager;
    
    // Create Level Editor instance
    levelEditor = new LevelEditor();
    levelEditor.initialize(mockTerrain);
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.window;
    delete global.document;
  });
  
  describe('loadFromData() - entity spawn data workflow', function() {
    it('should load entities into _entitySpawnData (not placedEntities)', function() {
      const data = {
        entities: [
          {
            id: 'entity_001',
            templateId: 'ant_queen',
            gridX: 10,
            gridY: 15,
            properties: { JobName: 'Queen', faction: 'player' }
          },
          {
            id: 'entity_002',
            templateId: 'resource_food',
            gridX: 20,
            gridY: 25,
            properties: { resourceType: 'food' }
          }
        ]
      };
      
      levelEditor.loadFromData(data);
      
      // Verify loaded into _entitySpawnData (spawn markers)
      expect(levelEditor._entitySpawnData).to.be.an('array');
      expect(levelEditor._entitySpawnData.length).to.equal(2);
      
      // Verify NOT loaded into placedEntities (runtime entities)
      if (levelEditor.entityPainter) {
        expect(levelEditor.entityPainter.placedEntities.length).to.equal(0);
      }
      
      // Verify first spawn point
      const spawn1 = levelEditor._entitySpawnData[0];
      expect(spawn1.id).to.equal('entity_001');
      expect(spawn1.templateId).to.equal('ant_queen');
      expect(spawn1.gridX).to.equal(10);
      expect(spawn1.gridY).to.equal(15);
      expect(spawn1.properties.JobName).to.equal('Queen');
      
      // Verify second spawn point
      const spawn2 = levelEditor._entitySpawnData[1];
      expect(spawn2.id).to.equal('entity_002');
      expect(spawn2.templateId).to.equal('resource_food');
      expect(spawn2.gridX).to.equal(20);
      expect(spawn2.gridY).to.equal(25);
    });
    
    it('should support gridX/gridY format (CaveTutorial.json)', function() {
      const data = {
        entities: [
          {
            templateId: 'ant_worker',
            gridX: 50,
            gridY: 60,
            properties: { JobName: 'Worker' }
          }
        ]
      };
      
      levelEditor.loadFromData(data);
      
      expect(levelEditor._entitySpawnData.length).to.equal(1);
      expect(levelEditor._entitySpawnData[0].gridX).to.equal(50);
      expect(levelEditor._entitySpawnData[0].gridY).to.equal(60);
    });
    
    it('should support gridPosition.{x,y} format (EntityPainter export)', function() {
      const data = {
        entities: [
          {
            templateId: 'building_nest',
            gridPosition: { x: 30, y: 40 },
            properties: { capacity: 100 }
          }
        ]
      };
      
      levelEditor.loadFromData(data);
      
      expect(levelEditor._entitySpawnData.length).to.equal(1);
      expect(levelEditor._entitySpawnData[0].gridX).to.equal(30);
      expect(levelEditor._entitySpawnData[0].gridY).to.equal(40);
    });
    
    it('should skip entities without coordinates', function() {
      const data = {
        entities: [
          {
            templateId: 'ant_queen',
            gridX: 10,
            gridY: 10,
            properties: {}
          },
          {
            templateId: 'invalid_entity',
            // NO COORDINATES
            properties: {}
          },
          {
            templateId: 'ant_worker',
            gridX: 20,
            gridY: 20,
            properties: {}
          }
        ]
      };
      
      levelEditor.loadFromData(data);
      
      // Only 2 valid entities should load
      expect(levelEditor._entitySpawnData.length).to.equal(2);
      expect(levelEditor._entitySpawnData[0].templateId).to.equal('ant_queen');
      expect(levelEditor._entitySpawnData[1].templateId).to.equal('ant_worker');
    });
    
    it('should generate IDs if missing', function() {
      const data = {
        entities: [
          {
            templateId: 'ant_worker',
            gridX: 10,
            gridY: 10,
            properties: {}
            // NO ID
          }
        ]
      };
      
      levelEditor.loadFromData(data);
      
      expect(levelEditor._entitySpawnData.length).to.equal(1);
      expect(levelEditor._entitySpawnData[0].id).to.be.a('string');
      expect(levelEditor._entitySpawnData[0].id).to.include('entity_');
    });
    
    it('should clear existing spawn data before loading', function() {
      // Add some existing spawn data
      levelEditor._entitySpawnData = [
        { id: 'old_1', templateId: 'ant_worker', gridX: 5, gridY: 5, properties: {} }
      ];
      
      const data = {
        entities: [
          {
            id: 'new_1',
            templateId: 'ant_queen',
            gridX: 10,
            gridY: 10,
            properties: {}
          }
        ]
      };
      
      levelEditor.loadFromData(data);
      
      // Old data should be gone
      expect(levelEditor._entitySpawnData.length).to.equal(1);
      expect(levelEditor._entitySpawnData[0].id).to.equal('new_1');
    });
    
    it('should preserve properties object', function() {
      const data = {
        entities: [
          {
            templateId: 'ant_queen',
            gridX: 10,
            gridY: 10,
            properties: {
              JobName: 'Queen',
              faction: 'player',
              health: 300,
              movementSpeed: 20,
              customProperty: 'customValue'
            }
          }
        ]
      };
      
      levelEditor.loadFromData(data);
      
      const spawn = levelEditor._entitySpawnData[0];
      expect(spawn.properties).to.deep.equal({
        JobName: 'Queen',
        faction: 'player',
        health: 300,
        movementSpeed: 20,
        customProperty: 'customValue'
      });
    });
  });
  
  describe('_getExportData() - entity spawn data export', function() {
    it('should export from _entitySpawnData (not placedEntities)', function() {
      // Add spawn data
      levelEditor._entitySpawnData = [
        {
          id: 'entity_001',
          templateId: 'ant_queen',
          gridX: 10,
          gridY: 15,
          properties: { JobName: 'Queen' }
        }
      ];
      
      // Add something to placedEntities (should NOT be exported)
      if (levelEditor.entityPainter) {
        levelEditor.entityPainter.placedEntities = [
          { type: 'Ant', posX: 320, posY: 480 }
        ];
      }
      
      const exportData = levelEditor._getExportData();
      
      // Should export from _entitySpawnData
      expect(exportData.entities).to.be.an('array');
      expect(exportData.entities.length).to.equal(1);
      expect(exportData.entities[0].templateId).to.equal('ant_queen');
      
      // Should NOT export from placedEntities
      expect(exportData.entities[0].type).to.be.undefined;
    });
    
    it('should include empty entities array if no spawn data', function() {
      levelEditor._entitySpawnData = [];
      
      const exportData = levelEditor._getExportData();
      
      expect(exportData.entities).to.be.an('array');
      expect(exportData.entities.length).to.equal(0);
    });
  });
  
  describe('renderEntitySpawnPoints() - visual rendering', function() {
    it('should render spawn points from _entitySpawnData', function() {
      levelEditor._entitySpawnData = [
        {
          id: 'entity_001',
          templateId: 'ant_queen',
          gridX: 10,
          gridY: 15,
          properties: {}
        }
      ];
      
      levelEditor.renderEntitySpawnPoints();
      
      // Verify rendering functions called
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
    });
    
    it('should not render if _entitySpawnData is empty', function() {
      levelEditor._entitySpawnData = [];
      
      levelEditor.renderEntitySpawnPoints();
      
      // Should early return without rendering
      expect(global.push.called).to.be.false;
    });
  });
});
