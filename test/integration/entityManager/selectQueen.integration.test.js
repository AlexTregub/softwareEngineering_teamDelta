/**
 * Integration tests for EntityManager selectQueen function
 * Tests queen selection with camera focus and double-click behavior
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityManager.selectQueen() Integration Tests', function() {
  let entityManager;
  let mockQueen;
  let mockSelectionController;
  let mockCameraManager;
  let getQueenStub;
  let clock;
  
  before(function() {
    // Setup fake timers once for all tests
    clock = sinon.useFakeTimers();
  });
  
  after(function() {
    // Restore clock after all tests
    if (clock) clock.restore();
  });
  
  beforeEach(function() {
    // Reset clock to 0 for each test
    if (clock) clock.reset();
    
    // Setup global environment
    global.window = global.window || {};
    global.millis = () => clock.now;
    
    // Mock eventBus
    global.eventBus = {
      on: sinon.stub(),
      off: sinon.stub(),
      emit: sinon.stub()
    };
    
    // Create EntityManager instance
    const EntityManager = require('../../../Classes/globals/entityManager');
    entityManager = new EntityManager();
    
    // Create mock queen
    mockQueen = {
      _id: 'queen1',
      _faction: 'player',
      isSelected: false,
      getPosition: sinon.stub().returns({ x: 500, y: 300 })
    };
    
    // Mock getQueen global function
    getQueenStub = sinon.stub().returns(mockQueen);
    global.getQueen = getQueenStub;
    global.window.getQueen = getQueenStub;
    
    // Create mock selection controller
    mockSelectionController = {
      deselectAll: sinon.stub(),
      selectedEntities: []
    };
    global.g_selectionBoxController = mockSelectionController;
    
    // Create mock camera manager
    mockCameraManager = {
      focusOn: sinon.stub(),
      setPosition: sinon.stub()
    };
    global.g_cameraManager = mockCameraManager;
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.getQueen;
    delete global.window.getQueen;
    delete global.g_selectionBoxController;
    delete global.g_cameraManager;
    delete global.millis;
    delete global.eventBus;
  });
  
  describe('Basic Functionality', function() {
    it('should select the queen entity', function() {
      const selected = entityManager.selectQueen('player');
      
      expect(selected).to.equal(mockQueen);
      expect(getQueenStub.calledOnce).to.be.true;
    });
    
    it('should filter by faction', function() {
      const selected = entityManager.selectQueen('player');
      
      expect(selected._faction).to.equal('player');
    });
    
    it('should return null when no queen exists', function() {
      getQueenStub.returns(null);
      
      const selected = entityManager.selectQueen('player');
      
      expect(selected).to.be.null;
    });
    
    it('should return null when queen is wrong faction', function() {
      mockQueen._faction = 'enemy';
      
      const selected = entityManager.selectQueen('player');
      
      expect(selected).to.be.null;
    });
  });
  
  describe('Selection Controller Integration', function() {
    it('should call deselectAll before selecting queen', function() {
      entityManager.selectQueen('player');
      
      expect(mockSelectionController.deselectAll.calledOnce).to.be.true;
    });
    
    it('should set queen isSelected property to true', function() {
      entityManager.selectQueen('player');
      
      expect(mockQueen.isSelected).to.be.true;
    });
    
    it('should update selection controller selectedEntities', function() {
      entityManager.selectQueen('player');
      
      expect(mockSelectionController.selectedEntities).to.have.lengthOf(1);
      expect(mockSelectionController.selectedEntities[0]).to.equal(mockQueen);
    });
    
    it('should work without selection controller', function() {
      delete global.g_selectionBoxController;
      
      const selected = entityManager.selectQueen('player');
      
      expect(selected).to.equal(mockQueen);
    });
  });
  
  describe('Camera Focus Behavior', function() {
    it('should NOT focus camera on single click', function() {
      entityManager.selectQueen('player', false);
      
      expect(mockCameraManager.focusOn.called).to.be.false;
      expect(mockCameraManager.setPosition.called).to.be.false;
    });
    
    it('should focus camera when focusCamera parameter is true', function() {
      entityManager.selectQueen('player', true);
      
      expect(mockCameraManager.focusOn.calledOnce).to.be.true;
      expect(mockCameraManager.focusOn.calledWith(500, 300)).to.be.true;
    });
    
    it('should focus camera on double-click (within 500ms)', function() {
      // First click
      entityManager.selectQueen('player');
      expect(mockCameraManager.focusOn.called).to.be.false;
      
      // Second click within 500ms
      clock.tick(400);
      entityManager.selectQueen('player');
      
      expect(mockCameraManager.focusOn.calledOnce).to.be.true;
      expect(mockCameraManager.focusOn.calledWith(500, 300)).to.be.true;
    });
    
    it('should NOT focus camera on second click after 500ms', function() {
      // First click
      entityManager.selectQueen('player');
      
      // Second click after 500ms
      clock.tick(600);
      entityManager.selectQueen('player');
      
      expect(mockCameraManager.focusOn.called).to.be.false;
    });
    
    it('should use setPosition as fallback when focusOn unavailable', function() {
      delete mockCameraManager.focusOn;
      
      entityManager.selectQueen('player', true);
      
      expect(mockCameraManager.setPosition.calledOnce).to.be.true;
      expect(mockCameraManager.setPosition.calledWith(500, 300)).to.be.true;
    });
    
    it('should work without camera manager', function() {
      delete global.g_cameraManager;
      
      const selected = entityManager.selectQueen('player', true);
      
      expect(selected).to.equal(mockQueen);
      // Should not throw error even without camera manager
    });
  });
  
  describe('Double-Click Time Window', function() {
    it('should reset double-click timer after 500ms', function() {
      // First click
      entityManager.selectQueen('player');
      
      // Wait 600ms (outside window)
      clock.tick(600);
      
      // Second click (should not trigger camera)
      entityManager.selectQueen('player');
      expect(mockCameraManager.focusOn.called).to.be.false;
      
      // Third click within 500ms of second
      clock.tick(400);
      entityManager.selectQueen('player');
      
      expect(mockCameraManager.focusOn.calledOnce).to.be.true;
    });
    
    it('should track last select time per EntityManager instance', function() {
      // Create second EntityManager instance
      const EntityManager = require('../../../Classes/globals/entityManager');
      const entityManager2 = new EntityManager();
      
      // First manager's double-click
      entityManager.selectQueen('player');
      clock.tick(400);
      entityManager.selectQueen('player');
      
      // Should have focused camera (double-click on first manager)
      expect(mockCameraManager.focusOn.calledOnce).to.be.true;
      mockCameraManager.focusOn.resetHistory();
      
      // Advance time to separate the instances
      clock.tick(600);
      
      // Second manager's first click (different instance, should not trigger camera)
      entityManager2.selectQueen('player');
      
      // Should not focus because it's the first click on second manager
      expect(mockCameraManager.focusOn.called).to.be.false;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle queen without getPosition method', function() {
      delete mockQueen.getPosition;
      
      const selected = entityManager.selectQueen('player', true);
      
      expect(selected).to.equal(mockQueen);
      // Should not throw error, but won't focus camera
      expect(mockCameraManager.focusOn.called).to.be.false;
    });
    
    it('should handle getPosition returning null', function() {
      mockQueen.getPosition.returns(null);
      
      const selected = entityManager.selectQueen('player', true);
      
      expect(selected).to.equal(mockQueen);
      // Should not throw error, but won't focus camera
      expect(mockCameraManager.focusOn.called).to.be.false;
    });
    
    it('should handle missing faction property', function() {
      delete mockQueen._faction;
      
      const selected = entityManager.selectQueen('player');
      
      expect(selected).to.be.null;
    });
  });
  
  describe('Multiple Queen Selection Calls', function() {
    it('should maintain selection state across calls', function() {
      // First selection
      entityManager.selectQueen('player');
      expect(mockQueen.isSelected).to.be.true;
      
      // Second selection (same queen)
      entityManager.selectQueen('player');
      expect(mockQueen.isSelected).to.be.true;
      
      // deselectAll called before each selection
      expect(mockSelectionController.deselectAll.calledTwice).to.be.true;
    });
    
    it('should update selectedEntities array on each call', function() {
      entityManager.selectQueen('player');
      expect(mockSelectionController.selectedEntities).to.have.lengthOf(1);
      
      entityManager.selectQueen('player');
      expect(mockSelectionController.selectedEntities).to.have.lengthOf(1);
    });
  });
});
