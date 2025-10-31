/**
 * Unit Tests: EntityPalette Custom Category
 * 
 * Tests LocalStorage persistence, custom category rendering, and CRUD operations.
 * Following TDD Red phase - these tests will fail until implementation complete.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('EntityPalette - Custom Category', function() {
  let mockP5;
  let EntityPalette;
  let CategoryRadioButtons;
  let palette;
  let localStorageMock;
  
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
    
    // Create fresh palette instance
    palette = new EntityPalette();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Custom Category Button', function() {
    it('should add 4th category button with save icon', function() {
      expect(palette.categoryButtons).to.exist;
      const categories = palette.categoryButtons.categories;
      
      expect(categories).to.have.lengthOf(4);
      expect(categories[3]).to.deep.include({
        id: 'custom',
        label: 'Custom',
        icon: '💾'
      });
    });
    
    it('should switch to custom category when button clicked', function() {
      palette.categoryButtons.handleClick(150, 15, 0, 0, 200); // Click 4th button
      
      expect(palette.currentCategory).to.equal('custom');
    });
  });
  
  describe('LocalStorage - Loading', function() {
    it('should load custom entities from localStorage on initialization', function() {
      const mockCustomEntities = [
        {
          id: 'custom_001',
          customName: 'Elite Soldier',
          isGroup: false,
          baseTemplateId: 'ant_soldier',
          properties: { health: 200, faction: 'player' }
        }
      ];
      
      localStorageMock.data['antGame_customEntities'] = JSON.stringify(mockCustomEntities);
      
      const newPalette = new EntityPalette();
      
      expect(localStorageMock.getItem.calledWith('antGame_customEntities')).to.be.true;
      expect(newPalette._templates.custom).to.deep.equal(mockCustomEntities);
    });
    
    it('should return empty array if localStorage has no custom entities', function() {
      const newPalette = new EntityPalette();
      
      expect(newPalette._templates.custom).to.be.an('array').that.is.empty;
    });
    
    it('should handle corrupted JSON in localStorage gracefully', function() {
      localStorageMock.data['antGame_customEntities'] = 'INVALID_JSON{{{';
      
      const newPalette = new EntityPalette();
      
      expect(newPalette._templates.custom).to.be.an('array').that.is.empty;
    });
    
    it('should handle missing localStorage gracefully', function() {
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;
      delete window.localStorage;
      
      const newPalette = new EntityPalette();
      
      expect(newPalette._templates.custom).to.be.an('array').that.is.empty;
      
      // Restore
      global.localStorage = originalLocalStorage;
      window.localStorage = originalLocalStorage;
    });
  });
  
  describe('LocalStorage - Saving', function() {
    it('should save custom entities to localStorage', function() {
      palette._templates.custom = [
        {
          id: 'custom_001',
          customName: 'My Custom Ant',
          isGroup: false,
          baseTemplateId: 'ant_worker',
          properties: { health: 150 }
        }
      ];
      
      palette._saveCustomEntities();
      
      expect(localStorageMock.setItem.calledOnce).to.be.true;
      expect(localStorageMock.setItem.firstCall.args[0]).to.equal('antGame_customEntities');
      
      const savedData = JSON.parse(localStorageMock.setItem.firstCall.args[1]);
      expect(savedData).to.have.lengthOf(1);
      expect(savedData[0].customName).to.equal('My Custom Ant');
    });
    
    it('should save empty array if no custom entities', function() {
      palette._templates.custom = [];
      
      palette._saveCustomEntities();
      
      expect(localStorageMock.setItem.calledOnce).to.be.true;
      const savedData = JSON.parse(localStorageMock.setItem.firstCall.args[1]);
      expect(savedData).to.be.an('array').that.is.empty;
    });
    
    it('should handle localStorage quota exceeded error', function() {
      palette._templates.custom = [{ id: 'test', customName: 'Test' }];
      
      localStorageMock.setItem.throws(new Error('QuotaExceededError'));
      
      // Should not throw error
      expect(() => palette._saveCustomEntities()).to.not.throw();
    });
  });
  
  describe('Custom Category Rendering', function() {
    it('should render empty state message when no custom entities', function() {
      palette.currentCategory = 'custom';
      palette._templates.custom = [];
      
      palette.render(10, 10, 200, 400);
      
      // Find text call with empty state message
      const textCalls = mockP5.text.getCalls();
      const emptyStateCall = textCalls.find(call => 
        typeof call.args[0] === 'string' && 
        call.args[0].includes('No custom entities')
      );
      
      expect(emptyStateCall).to.exist;
    });
    
    it('should render custom entity header with name', function() {
      palette.currentCategory = 'custom';
      palette._templates.custom = [
        {
          id: 'custom_001',
          customName: 'Elite Squad',
          isGroup: false,
          baseTemplateId: 'ant_soldier',
          properties: {}
        }
      ];
      
      palette.render(10, 10, 200, 400);
      
      // Find text call with custom name
      const textCalls = mockP5.text.getCalls();
      const nameCall = textCalls.find(call => 
        call.args[0] === 'Elite Squad'
      );
      
      expect(nameCall).to.exist;
    });
    
    it('should render rename button for each custom entity', function() {
      palette.currentCategory = 'custom';
      palette._templates.custom = [
        {
          id: 'custom_001',
          customName: 'My Entity',
          isGroup: false,
          baseTemplateId: 'ant_worker',
          properties: {}
        }
      ];
      
      palette.render(10, 10, 200, 400);
      
      // Find text call with rename icon
      const textCalls = mockP5.text.getCalls();
      const renameCall = textCalls.find(call => 
        call.args[0] === '✏️'
      );
      
      expect(renameCall).to.exist;
    });
    
    it('should render delete button (X) for each custom entity', function() {
      palette.currentCategory = 'custom';
      palette._templates.custom = [
        {
          id: 'custom_001',
          customName: 'My Entity',
          isGroup: false,
          baseTemplateId: 'ant_worker',
          properties: {}
        }
      ];
      
      palette.render(10, 10, 200, 400);
      
      // Find text call with X symbol
      const textCalls = mockP5.text.getCalls();
      const deleteCall = textCalls.find(call => 
        call.args[0] === '✕'
      );
      
      expect(deleteCall).to.exist;
    });
    
    it('should render "Add New Custom Entity" button at bottom', function() {
      palette.currentCategory = 'custom';
      palette._templates.custom = [];
      
      palette.render(10, 10, 200, 400);
      
      // Find text call with "Add New" text
      const textCalls = mockP5.text.getCalls();
      const addButtonCall = textCalls.find(call => 
        typeof call.args[0] === 'string' && 
        call.args[0].includes('Add New')
      );
      
      expect(addButtonCall).to.exist;
    });
    
    it('should render "Add New" button even when custom entities exist', function() {
      palette.currentCategory = 'custom';
      palette._templates.custom = [
        { id: 'custom_001', customName: 'Entity 1', isGroup: false, baseTemplateId: 'ant_worker', properties: {} }
      ];
      
      palette.render(10, 10, 200, 400);
      
      const textCalls = mockP5.text.getCalls();
      const addButtonCall = textCalls.find(call => 
        typeof call.args[0] === 'string' && 
        call.args[0].includes('Add New')
      );
      
      expect(addButtonCall).to.exist;
    });
    
    it('should not render "Add New" button when not in custom category', function() {
      palette.currentCategory = 'entities';
      
      palette.render(10, 10, 200, 400);
      
      const textCalls = mockP5.text.getCalls();
      const addButtonCall = textCalls.find(call => 
        typeof call.args[0] === 'string' && 
        call.args[0].includes('Add New')
      );
      
      expect(addButtonCall).to.be.undefined;
    });
  });
  
  describe('Dynamic Height Calculation', function() {
    it('should include "Add New" button height in custom category', function() {
      palette.currentCategory = 'custom';
      palette._templates.custom = [];
      
      const size = palette.getContentSize(200);
      
      // Should have button height (30) + add button height (50) + margin (16)
      expect(size.height).to.be.at.least(96); // 30 + 50 + 16
    });
    
    it('should calculate height with custom entities + add button', function() {
      palette.currentCategory = 'custom';
      palette._templates.custom = [
        { id: 'c1', customName: 'E1', isGroup: false, baseTemplateId: 'ant_worker', properties: {} },
        { id: 'c2', customName: 'E2', isGroup: false, baseTemplateId: 'ant_soldier', properties: {} }
      ];
      
      const size = palette.getContentSize(200);
      
      // Button (30) + 2 items (80px each) + padding (8 * 2) + add button (50) + margin (16)
      // = 30 + 160 + 16 + 50 + 16 = 272
      expect(size.height).to.equal(272);
    });
  });
  
  describe('Click Handling - Custom Actions', function() {
    it('should detect click on "Add New" button', function() {
      palette.currentCategory = 'custom';
      palette._templates.custom = [];
      
      const buttonHeight = 30;
      const clickY = buttonHeight + 16 + 10; // Below category buttons, in add button area
      
      const result = palette.handleClick(100, clickY, 10, 10, 200);
      
      expect(result).to.exist;
      expect(result.type).to.equal('addCustomEntity');
    });
    
    it('should detect click on rename button', function() {
      palette.currentCategory = 'custom';
      palette._templates.custom = [
        {
          id: 'custom_001',
          customName: 'My Entity',
          isGroup: false,
          baseTemplateId: 'ant_worker',
          properties: {}
        }
      ];
      
      // Click on rename button (right side of header)
      // Panel coords: panelX=10, panelY=10, width=200
      // Relative click: buttonHeight (30) + padding (8) + header middle (10) = 48
      // Absolute click: panelY + relY = 10 + 48 = 58
      const buttonHeight = 30;
      const clickY = 10 + buttonHeight + 8 + 10; // panelY + buttonHeight + padding + inside header
      const clickX = 10 + 200 - 8 - 35; // panelX + panelWidth - padding - rename button position
      
      const result = palette.handleClick(clickX, clickY, 10, 10, 200);
      
      expect(result).to.exist;
      expect(result.type).to.equal('rename');
      expect(result.entity).to.exist;
      expect(result.entity.id).to.equal('custom_001');
    });
    
    it('should detect click on delete button', function() {
      palette.currentCategory = 'custom';
      palette._templates.custom = [
        {
          id: 'custom_001',
          customName: 'My Entity',
          isGroup: false,
          baseTemplateId: 'ant_worker',
          properties: {}
        }
      ];
      
      // Click on delete button (far right of header)
      // Panel coords: panelX=10, panelY=10, width=200
      // Relative click: buttonHeight (30) + padding (8) + header middle (10) = 48
      // Absolute click: panelY + relY = 10 + 48 = 58
      const buttonHeight = 30;
      const clickY = 10 + buttonHeight + 8 + 10; // panelY + buttonHeight + padding + inside header
      const clickX = 10 + 200 - 8 - 5; // panelX + panelWidth - padding - delete button position (far right)
      
      const result = palette.handleClick(clickX, clickY, 10, 10, 200);
      
      expect(result).to.exist;
      expect(result.type).to.equal('delete');
      expect(result.entity).to.exist;
      expect(result.entity.id).to.equal('custom_001');
    });
    
    it('should detect click on custom entity body (not header buttons)', function() {
      palette.currentCategory = 'custom';
      palette._templates.custom = [
        {
          id: 'custom_001',
          customName: 'My Entity',
          isGroup: false,
          baseTemplateId: 'ant_worker',
          properties: {}
        }
      ];
      
      // Click on entity sprite area (middle of item, not header)
      const buttonHeight = 30;
      const itemBodyY = buttonHeight + 8 + 40; // Middle of item body
      
      const result = palette.handleClick(100, itemBodyY, 10, 10, 200);
      
      expect(result).to.exist;
      expect(result.type).to.equal('template');
      expect(result.template).to.exist;
      expect(result.template.id).to.equal('custom_001');
    });
  });
});
