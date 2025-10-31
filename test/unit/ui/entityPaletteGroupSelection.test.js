/**
 * Unit Tests: EntityPalette Group Selection
 * 
 * Tests group selection functionality - selecting multiple entities on grid,
 * calculating relative positions, storing as group, and dynamic button text.
 * Following TDD Red phase - these tests will fail until implementation complete.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('EntityPalette - Group Selection', function() {
  let mockP5;
  let EntityPalette;
  let CategoryRadioButtons;
  let palette;
  let localStorageMock;
  let mockLevelEditor;
  
  before(function() {
    // Setup JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js constants
    global.CENTER = 'center';
    global.LEFT = 'left';
    global.RIGHT = 'right';
    global.TOP = 'top';
    global.CORNER = 'corner';
    
    // Sync constants to window
    window.CENTER = global.CENTER;
    window.LEFT = global.LEFT;
    window.RIGHT = global.RIGHT;
    window.TOP = global.TOP;
    window.CORNER = global.CORNER;
    
    // Mock p5.js functions
    mockP5 = {
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textSize: sinon.stub(),
      textAlign: sinon.stub(),
      image: sinon.stub(),
      imageMode: sinon.stub()
    };
    
    // Assign to both global and window
    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
      window[key] = mockP5[key];
    });
    
    // Mock localStorage
    localStorageMock = {
      data: {},
      getItem: sinon.stub().callsFake(function(key) {
        return this.data[key] || null;
      }),
      setItem: sinon.stub().callsFake(function(key, value) {
        this.data[key] = value;
      }),
      removeItem: sinon.stub().callsFake(function(key) {
        delete this.data[key];
      }),
      clear: sinon.stub().callsFake(function() {
        this.data = {};
      })
    };
    global.localStorage = localStorageMock;
    window.localStorage = localStorageMock;
    
    // Load actual classes
    CategoryRadioButtons = require('../../../Classes/ui/CategoryRadioButtons.js');
    EntityPalette = require('../../../Classes/ui/EntityPalette.js');
    
    // Sync to window
    global.CategoryRadioButtons = CategoryRadioButtons;
    window.CategoryRadioButtons = CategoryRadioButtons;
    global.EntityPalette = EntityPalette;
    window.EntityPalette = EntityPalette;
  });
  
  beforeEach(function() {
    // Clear localStorage before each test
    localStorageMock.clear();
    localStorageMock.getItem.resetHistory();
    localStorageMock.setItem.resetHistory();
    
    // Reset p5 stubs
    Object.values(mockP5).forEach(stub => stub.resetHistory());
    
    // Create mock Level Editor with selection system
    mockLevelEditor = {
      selectedEntities: [],
      getSelectedEntities: sinon.stub().callsFake(function() {
        return this.selectedEntities;
      }),
      clearSelection: sinon.stub().callsFake(function() {
        this.selectedEntities = [];
      })
    };
    
    // Make levelEditor available globally
    global.levelEditor = mockLevelEditor;
    window.levelEditor = mockLevelEditor;
    
    // Create fresh palette instance
    palette = new EntityPalette();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Selection Detection from Level Editor', function() {
    it('should detect when Level Editor has no selected entities', function() {
      mockLevelEditor.selectedEntities = [];
      
      const selected = palette.getSelectedEntitiesFromLevelEditor();
      
      expect(selected).to.be.an('array').that.is.empty;
    });
    
    it('should detect when Level Editor has 1 selected entity', function() {
      mockLevelEditor.selectedEntities = [
        {
          entity: { id: 'ant1', templateId: 'ant_worker', getProperties: () => ({ health: 100 }) },
          gridX: 10,
          gridY: 15
        }
      ];
      
      const selected = palette.getSelectedEntitiesFromLevelEditor();
      
      expect(selected).to.have.lengthOf(1);
      expect(selected[0].gridX).to.equal(10);
      expect(selected[0].gridY).to.equal(15);
    });
    
    it('should detect when Level Editor has multiple selected entities', function() {
      mockLevelEditor.selectedEntities = [
        {
          entity: { id: 'ant1', templateId: 'ant_worker', getProperties: () => ({}) },
          gridX: 10,
          gridY: 15
        },
        {
          entity: { id: 'ant2', templateId: 'ant_soldier', getProperties: () => ({}) },
          gridX: 12,
          gridY: 15
        },
        {
          entity: { id: 'ant3', templateId: 'ant_scout', getProperties: () => ({}) },
          gridX: 11,
          gridY: 16
        }
      ];
      
      const selected = palette.getSelectedEntitiesFromLevelEditor();
      
      expect(selected).to.have.lengthOf(3);
    });
  });
  
  describe('Relative Position Calculation', function() {
    it('should handle empty selection', function() {
      const result = palette._calculateRelativePositions([]);
      
      expect(result).to.be.an('array').that.is.empty;
    });
    
    it('should handle single entity with position (0, 0)', function() {
      const entities = [
        {
          entity: { id: 'ant1', templateId: 'ant_worker', getProperties: () => ({ health: 100 }) },
          gridX: 10,
          gridY: 15
        }
      ];
      
      const result = palette._calculateRelativePositions(entities);
      
      expect(result).to.have.lengthOf(1);
      expect(result[0].position).to.deep.equal({ x: 0, y: 0 });
      expect(result[0].baseTemplateId).to.equal('ant_worker');
    });
    
    it('should find topmost-leftmost entity as origin', function() {
      const entities = [
        {
          entity: { id: 'ant1', templateId: 'ant_worker', getProperties: () => ({}) },
          gridX: 12,
          gridY: 15
        },
        {
          entity: { id: 'ant2', templateId: 'ant_soldier', getProperties: () => ({}) },
          gridX: 10,
          gridY: 14
        },
        {
          entity: { id: 'ant3', templateId: 'ant_scout', getProperties: () => ({}) },
          gridX: 11,
          gridY: 16
        }
      ];
      
      const result = palette._calculateRelativePositions(entities);
      
      // Origin should be at (10, 14) - topmost (y=14) and leftmost (x=10)
      const origin = result.find(e => e.position.x === 0 && e.position.y === 0);
      expect(origin).to.exist;
      expect(origin.baseTemplateId).to.equal('ant_soldier');
    });
    
    it('should calculate correct offsets for all entities', function() {
      const entities = [
        {
          entity: { id: 'ant1', templateId: 'ant_worker', getProperties: () => ({}) },
          gridX: 10,
          gridY: 10
        },
        {
          entity: { id: 'ant2', templateId: 'ant_soldier', getProperties: () => ({}) },
          gridX: 12,
          gridY: 10
        },
        {
          entity: { id: 'ant3', templateId: 'ant_scout', getProperties: () => ({}) },
          gridX: 11,
          gridY: 11
        }
      ];
      
      const result = palette._calculateRelativePositions(entities);
      
      expect(result).to.have.lengthOf(3);
      
      // Origin at (10, 10)
      const origin = result.find(e => e.baseTemplateId === 'ant_worker');
      expect(origin.position).to.deep.equal({ x: 0, y: 0 });
      
      // Offset +2 right
      const soldier = result.find(e => e.baseTemplateId === 'ant_soldier');
      expect(soldier.position).to.deep.equal({ x: 2, y: 0 });
      
      // Offset +1 right, +1 down
      const scout = result.find(e => e.baseTemplateId === 'ant_scout');
      expect(scout.position).to.deep.equal({ x: 1, y: 1 });
    });
    
    it('should preserve entity properties', function() {
      const entities = [
        {
          entity: {
            id: 'ant1',
            templateId: 'ant_worker',
            getProperties: () => ({ health: 200, faction: 'player' })
          },
          gridX: 10,
          gridY: 15
        }
      ];
      
      const result = palette._calculateRelativePositions(entities);
      
      expect(result[0].properties).to.deep.equal({ health: 200, faction: 'player' });
    });
    
    it('should handle negative grid coordinates', function() {
      const entities = [
        {
          entity: { id: 'ant1', templateId: 'ant_worker', getProperties: () => ({}) },
          gridX: -5,
          gridY: -3
        },
        {
          entity: { id: 'ant2', templateId: 'ant_soldier', getProperties: () => ({}) },
          gridX: -3,
          gridY: -3
        }
      ];
      
      const result = palette._calculateRelativePositions(entities);
      
      // Origin at (-5, -3)
      const origin = result.find(e => e.baseTemplateId === 'ant_worker');
      expect(origin.position).to.deep.equal({ x: 0, y: 0 });
      
      // Offset +2 right
      const soldier = result.find(e => e.baseTemplateId === 'ant_soldier');
      expect(soldier.position).to.deep.equal({ x: 2, y: 0 });
    });
  });
  
  describe('Group Data Structure', function() {
    it('should create single entity structure (not a group)', function() {
      mockLevelEditor.selectedEntities = [
        {
          entity: { id: 'ant1', templateId: 'ant_worker', getProperties: () => ({ health: 100 }) },
          gridX: 10,
          gridY: 15
        }
      ];
      
      const groupData = palette.createGroupDataStructure('My Ant');
      
      expect(groupData.isGroup).to.be.false;
      expect(groupData.customName).to.equal('My Ant');
      expect(groupData.baseTemplateId).to.equal('ant_worker');
      expect(groupData.properties).to.deep.equal({ health: 100 });
    });
    
    it('should create group structure for multiple entities', function() {
      mockLevelEditor.selectedEntities = [
        {
          entity: { id: 'ant1', templateId: 'ant_worker', getProperties: () => ({ health: 100 }) },
          gridX: 10,
          gridY: 10
        },
        {
          entity: { id: 'ant2', templateId: 'ant_soldier', getProperties: () => ({ health: 150 }) },
          gridX: 12,
          gridY: 10
        }
      ];
      
      const groupData = palette.createGroupDataStructure('My Squad');
      
      expect(groupData.isGroup).to.be.true;
      expect(groupData.customName).to.equal('My Squad');
      expect(groupData.entities).to.be.an('array').with.lengthOf(2);
      expect(groupData.entities[0].baseTemplateId).to.equal('ant_worker');
      expect(groupData.entities[1].baseTemplateId).to.equal('ant_soldier');
    });
    
    it('should include relative positions in group entities', function() {
      mockLevelEditor.selectedEntities = [
        {
          entity: { id: 'ant1', templateId: 'ant_worker', getProperties: () => ({}) },
          gridX: 10,
          gridY: 10
        },
        {
          entity: { id: 'ant2', templateId: 'ant_soldier', getProperties: () => ({}) },
          gridX: 12,
          gridY: 11
        }
      ];
      
      const groupData = palette.createGroupDataStructure('Formation');
      
      expect(groupData.entities[0].position).to.deep.equal({ x: 0, y: 0 });
      expect(groupData.entities[1].position).to.deep.equal({ x: 2, y: 1 });
    });
    
    it('should generate unique ID with timestamp', function() {
      const groupData1 = palette.createGroupDataStructure('Group 1');
      const groupData2 = palette.createGroupDataStructure('Group 2');
      
      expect(groupData1.id).to.not.equal(groupData2.id);
      expect(groupData1.id).to.include('custom_group_');
    });
    
    it('should include createdAt timestamp', function() {
      const before = new Date().toISOString();
      const groupData = palette.createGroupDataStructure('My Group');
      const after = new Date().toISOString();
      
      expect(groupData.createdAt).to.exist;
      expect(groupData.createdAt >= before).to.be.true;
      expect(groupData.createdAt <= after).to.be.true;
    });
  });
  
  describe('Dynamic Button Text', function() {
    it('should show "Add New" when no entities selected', function() {
      mockLevelEditor.selectedEntities = [];
      
      const buttonText = palette.getAddButtonText();
      
      expect(buttonText).to.equal('➕ Add New Custom Entity');
    });
    
    it('should show "Store Selected Entity" for single selection', function() {
      mockLevelEditor.selectedEntities = [
        {
          entity: { id: 'ant1', templateId: 'ant_worker', getProperties: () => ({}) },
          gridX: 10,
          gridY: 15
        }
      ];
      
      const buttonText = palette.getAddButtonText();
      
      expect(buttonText).to.equal('💾 Store Selected Entity');
    });
    
    it('should show "Store Selected Entities (N)" for multiple selection', function() {
      mockLevelEditor.selectedEntities = [
        {
          entity: { id: 'ant1', templateId: 'ant_worker', getProperties: () => ({}) },
          gridX: 10,
          gridY: 10
        },
        {
          entity: { id: 'ant2', templateId: 'ant_soldier', getProperties: () => ({}) },
          gridX: 12,
          gridY: 10
        },
        {
          entity: { id: 'ant3', templateId: 'ant_scout', getProperties: () => ({}) },
          gridX: 11,
          gridY: 11
        }
      ];
      
      const buttonText = palette.getAddButtonText();
      
      expect(buttonText).to.equal('💾 Store Selected Entities (3)');
    });
    
    it('should update button text when selection changes', function() {
      mockLevelEditor.selectedEntities = [];
      expect(palette.getAddButtonText()).to.equal('➕ Add New Custom Entity');
      
      mockLevelEditor.selectedEntities = [
        {
          entity: { id: 'ant1', templateId: 'ant_worker', getProperties: () => ({}) },
          gridX: 10,
          gridY: 15
        }
      ];
      expect(palette.getAddButtonText()).to.equal('💾 Store Selected Entity');
      
      mockLevelEditor.selectedEntities.push({
        entity: { id: 'ant2', templateId: 'ant_soldier', getProperties: () => ({}) },
        gridX: 12,
        gridY: 15
      });
      expect(palette.getAddButtonText()).to.equal('💾 Store Selected Entities (2)');
    });
  });
  
  describe('Group Badge Rendering', function() {
    it('should render group badge for group entities', function() {
      palette.currentCategory = 'custom';
      palette._templates.custom = [
        {
          id: 'custom_group_001',
          customName: 'My Squad',
          isGroup: true,
          entities: [
            { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} },
            { baseTemplateId: 'ant_soldier', position: { x: 1, y: 0 }, properties: {} },
            { baseTemplateId: 'ant_scout', position: { x: 0, y: 1 }, properties: {} }
          ]
        }
      ];
      
      palette.render(10, 10, 200, 400);
      
      // Find text call with group badge
      const textCalls = mockP5.text.getCalls();
      const badgeCall = textCalls.find(call => 
        typeof call.args[0] === 'string' && 
        call.args[0].includes('GROUP')
      );
      
      expect(badgeCall).to.exist;
      expect(badgeCall.args[0]).to.include('(3)'); // 3 entities
    });
    
    it('should not render group badge for single entities', function() {
      palette.currentCategory = 'custom';
      palette._templates.custom = [
        {
          id: 'custom_001',
          customName: 'My Ant',
          isGroup: false,
          baseTemplateId: 'ant_worker',
          properties: {}
        }
      ];
      
      palette.render(10, 10, 200, 400);
      
      const textCalls = mockP5.text.getCalls();
      const badgeCall = textCalls.find(call => 
        typeof call.args[0] === 'string' && 
        call.args[0].includes('GROUP')
      );
      
      expect(badgeCall).to.be.undefined;
    });
  });
});
