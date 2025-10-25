const { expect } = require('chai');

// Mock p5.js globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });

// Load the module
const CombatController = require('../../../Classes/controllers/CombatController.js');

describe('CombatController', function() {
  let mockEntity;
  let controller;
  
  beforeEach(function() {
    // Reset global ants array
    global.ants = [];
    global.antIndex = {};
    
    // Create minimal mock entity
    mockEntity = {
      _faction: 'player',
      faction: 'player',
      _stateMachine: {
        setCombatModifier: function(state) { this.combatModifier = state; },
        combatModifier: null
      },
      getPosition: function() { return { x: 100, y: 100 }; }
    };
    
    controller = new CombatController(mockEntity);
  });
  
  describe('Constructor', function() {
    it('should initialize with entity reference', function() {
      expect(controller._entity).to.equal(mockEntity);
    });
    
    it('should initialize empty enemies array', function() {
      expect(controller._nearbyEnemies).to.be.an('array').that.is.empty;
    });
    
    it('should initialize detection radius to 60', function() {
      expect(controller._detectionRadius).to.equal(60);
    });
    
    it('should initialize combat state to OUT_OF_COMBAT', function() {
      expect(controller._combatState).to.equal('OUT_OF_COMBAT');
    });
    
    it('should initialize action state to NONE', function() {
      expect(controller._combatActionState).to.equal('NONE');
    });
  });
  
  describe('Combat States', function() {
    it('should have OUT_OF_COMBAT state', function() {
      expect(CombatController._states.OUT).to.equal('OUT_OF_COMBAT');
    });
    
    it('should have IN_COMBAT state', function() {
      expect(CombatController._states.IN).to.equal('IN_COMBAT');
    });
    
    it('should have action states', function() {
      expect(CombatController._actionStates.ATTACK).to.equal('ATTACKING');
      expect(CombatController._actionStates.DEFEND).to.equal('DEFENDING');
      expect(CombatController._actionStates.SPIT).to.equal('SPITTING');
      expect(CombatController._actionStates.NONE).to.equal('NONE');
    });
  });
  
  describe('Faction Management', function() {
    describe('setFaction()', function() {
      it('should set entity faction', function() {
        controller.setFaction('enemy');
        expect(mockEntity._faction).to.equal('enemy');
      });
      
      it('should handle neutral faction', function() {
        controller.setFaction('neutral');
        expect(mockEntity._faction).to.equal('neutral');
      });
    });
    
    describe('getFaction()', function() {
      it('should return entity faction', function() {
        mockEntity._faction = 'player';
        expect(controller.getFaction()).to.equal('player');
      });
      
      it('should fallback to faction property', function() {
        delete mockEntity._faction;
        mockEntity.faction = 'enemy';
        expect(controller.getFaction()).to.equal('enemy');
      });
      
      it('should return neutral if no faction set', function() {
        delete mockEntity._faction;
        delete mockEntity.faction;
        expect(controller.getFaction()).to.equal('neutral');
      });
    });
  });
  
  describe('Detection Radius', function() {
    it('should set detection radius', function() {
      controller.setDetectionRadius(100);
      expect(controller._detectionRadius).to.equal(100);
    });
    
    it('should handle zero radius', function() {
      controller.setDetectionRadius(0);
      expect(controller._detectionRadius).to.equal(0);
    });
    
    it('should handle large radius', function() {
      controller.setDetectionRadius(500);
      expect(controller._detectionRadius).to.equal(500);
    });
  });
  
  describe('Enemy Detection', function() {
    describe('detectEnemies()', function() {
      it('should detect nearby enemies', function() {
        const enemy = {
          faction: 'enemy',
          getPosition: () => ({ x: 110, y: 110 }) // 14 pixels away
        };
        global.ants = [mockEntity, enemy];
        
        controller.detectEnemies();
        expect(controller._nearbyEnemies).to.have.lengthOf(1);
        expect(controller._nearbyEnemies[0]).to.equal(enemy);
      });
      
      it('should ignore same faction', function() {
        const ally = {
          faction: 'player',
          getPosition: () => ({ x: 110, y: 110 })
        };
        global.ants = [mockEntity, ally];
        
        controller.detectEnemies();
        expect(controller._nearbyEnemies).to.be.empty;
      });
      
      it('should ignore neutral entities', function() {
        const neutral = {
          faction: 'neutral',
          getPosition: () => ({ x: 110, y: 110 })
        };
        global.ants = [mockEntity, neutral];
        
        controller.detectEnemies();
        expect(controller._nearbyEnemies).to.be.empty;
      });
      
      it('should ignore self', function() {
        global.ants = [mockEntity];
        
        controller.detectEnemies();
        expect(controller._nearbyEnemies).to.be.empty;
      });
      
      it('should ignore enemies beyond detection radius', function() {
        const farEnemy = {
          faction: 'enemy',
          getPosition: () => ({ x: 200, y: 200 }) // 141 pixels away
        };
        global.ants = [mockEntity, farEnemy];
        controller._detectionRadius = 60;
        
        controller.detectEnemies();
        expect(controller._nearbyEnemies).to.be.empty;
      });
      
      it('should detect multiple enemies', function() {
        const enemy1 = {
          faction: 'enemy',
          getPosition: () => ({ x: 110, y: 110 })
        };
        const enemy2 = {
          faction: 'hostile',
          getPosition: () => ({ x: 90, y: 90 })
        };
        global.ants = [mockEntity, enemy1, enemy2];
        
        controller.detectEnemies();
        expect(controller._nearbyEnemies).to.have.lengthOf(2);
      });
      
      it('should handle missing ants array', function() {
        delete global.ants;
        expect(() => controller.detectEnemies()).to.not.throw();
        expect(controller._nearbyEnemies).to.be.empty;
      });
      
      it('should handle null entities in ants array', function() {
        global.ants = [null, mockEntity, null];
        expect(() => controller.detectEnemies()).to.not.throw();
      });
    });
    
    describe('calculateDistance()', function() {
      it('should calculate correct distance', function() {
        const entity1 = { getPosition: () => ({ x: 0, y: 0 }) };
        const entity2 = { getPosition: () => ({ x: 30, y: 40 }) };
        
        const distance = controller.calculateDistance(entity1, entity2);
        expect(distance).to.equal(50); // 3-4-5 triangle
      });
      
      it('should return 0 for same position', function() {
        const entity1 = { getPosition: () => ({ x: 100, y: 100 }) };
        const entity2 = { getPosition: () => ({ x: 100, y: 100 }) };
        
        const distance = controller.calculateDistance(entity1, entity2);
        expect(distance).to.equal(0);
      });
      
      it('should handle negative coordinates', function() {
        const entity1 = { getPosition: () => ({ x: -50, y: -50 }) };
        const entity2 = { getPosition: () => ({ x: 50, y: 50 }) };
        
        const distance = controller.calculateDistance(entity1, entity2);
        expect(distance).to.be.closeTo(141.42, 0.1);
      });
    });
  });
  
  describe('Combat State Management', function() {
    describe('getCombatState()', function() {
      it('should return current combat state', function() {
        expect(controller.getCombatState()).to.equal('OUT_OF_COMBAT');
      });
    });
    
    describe('setCombatState()', function() {
      it('should set combat state', function() {
        controller.setCombatState('IN_COMBAT');
        expect(controller._combatState).to.equal('IN_COMBAT');
      });
      
      it('should update state machine', function() {
        controller.setCombatState('IN_COMBAT');
        expect(mockEntity._stateMachine.combatModifier).to.equal('IN_COMBAT');
      });
      
      it('should trigger state change callback', function() {
        let oldState = null;
        let newState = null;
        
        controller.setStateChangeCallback((old, current) => {
          oldState = old;
          newState = current;
        });
        
        controller.setCombatState('IN_COMBAT');
        expect(oldState).to.equal('OUT_OF_COMBAT');
        expect(newState).to.equal('IN_COMBAT');
      });
      
      it('should handle missing state machine', function() {
        mockEntity._stateMachine = null;
        expect(() => controller.setCombatState('IN_COMBAT')).to.not.throw();
      });
    });
    
    describe('isInCombat()', function() {
      it('should return false initially', function() {
        expect(controller.isInCombat()).to.be.false;
      });
      
      it('should return true when in combat', function() {
        controller.setCombatState('IN_COMBAT');
        expect(controller.isInCombat()).to.be.true;
      });
      
      it('should return false when out of combat', function() {
        controller.setCombatState('IN_COMBAT');
        controller.setCombatState('OUT_OF_COMBAT');
        expect(controller.isInCombat()).to.be.false;
      });
    });
    
    describe('updateCombatState()', function() {
      it('should enter combat when enemies detected', function() {
        controller._nearbyEnemies = [{ faction: 'enemy' }];
        controller.updateCombatState();
        expect(controller.isInCombat()).to.be.true;
      });
      
      it('should exit combat when no enemies', function() {
        controller.setCombatState('IN_COMBAT');
        controller._nearbyEnemies = [];
        controller.updateCombatState();
        expect(controller.isInCombat()).to.be.false;
      });
      
      it('should stay in combat with enemies present', function() {
        controller.setCombatState('IN_COMBAT');
        controller._nearbyEnemies = [{ faction: 'enemy' }];
        controller.updateCombatState();
        expect(controller.isInCombat()).to.be.true;
      });
      
      it('should stay out of combat without enemies', function() {
        controller._nearbyEnemies = [];
        controller.updateCombatState();
        expect(controller.isInCombat()).to.be.false;
      });
    });
  });
  
  describe('Nearby Enemies', function() {
    it('should return nearby enemies array', function() {
      const enemies = controller.getNearbyEnemies();
      expect(enemies).to.be.an('array');
    });
    
    it('should return current enemies', function() {
      const enemy = { faction: 'enemy', getPosition: () => ({ x: 110, y: 110 }) };
      global.ants = [mockEntity, enemy];
      controller.detectEnemies();
      
      const enemies = controller.getNearbyEnemies();
      expect(enemies).to.have.lengthOf(1);
      expect(enemies[0]).to.equal(enemy);
    });
  });
  
  describe('Update Loop', function() {
    it('should detect enemies periodically', function(done) {
      const enemy = {
        faction: 'enemy',
        getPosition: () => ({ x: 110, y: 110 })
      };
      global.ants = [mockEntity, enemy];
      
      controller._lastEnemyCheck = Date.now() - 200; // Force check
      controller.update();
      
      setTimeout(() => {
        expect(controller._nearbyEnemies).to.have.lengthOf(1);
        done();
      }, 10);
    });
    
    it('should update combat state', function(done) {
      const enemy = {
        faction: 'enemy',
        getPosition: () => ({ x: 110, y: 110 })
      };
      global.ants = [mockEntity, enemy];
      
      controller._lastEnemyCheck = Date.now() - 200;
      controller.update();
      
      setTimeout(() => {
        expect(controller.isInCombat()).to.be.true;
        done();
      }, 10);
    });
    
    it('should respect check interval', function() {
      controller._lastEnemyCheck = Date.now();
      const initialCount = controller._nearbyEnemies.length;
      
      controller.update();
      
      expect(controller._nearbyEnemies).to.have.lengthOf(initialCount);
    });
  });
  
  describe('Callback System', function() {
    it('should register state change callback', function() {
      const callback = function() {};
      controller.setStateChangeCallback(callback);
      expect(controller._onStateChangeCallback).to.equal(callback);
    });
    
    it('should invoke callback on state change', function() {
      let invoked = false;
      controller.setStateChangeCallback(() => invoked = true);
      controller.setCombatState('IN_COMBAT');
      expect(invoked).to.be.true;
    });
  });
  
  describe('Debug Info', function() {
    it('should return debug information', function() {
      const info = controller.getDebugInfo();
      expect(info).to.be.an('object');
      expect(info.combatState).to.exist;
      expect(info.nearbyEnemyCount).to.exist;
      expect(info.detectionRadius).to.exist;
      expect(info.entityFaction).to.exist;
    });
    
    it('should include enemy count', function() {
      controller._nearbyEnemies = [{}, {}, {}];
      const info = controller.getDebugInfo();
      expect(info.nearbyEnemyCount).to.equal(3);
    });
    
    it('should include faction info', function() {
      mockEntity.faction = 'enemy';
      const info = controller.getDebugInfo();
      expect(info.entityFaction).to.equal('enemy');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle entities without getPosition method', function() {
      const enemy = { faction: 'enemy' };
      global.ants = [mockEntity, enemy];
      expect(() => controller.detectEnemies()).to.throw();
    });
    
    it('should handle undefined faction', function() {
      delete mockEntity.faction;
      delete mockEntity._faction;
      expect(controller.getFaction()).to.equal('neutral');
    });
    
    it('should handle rapid state changes', function() {
      for (let i = 0; i < 10; i++) {
        controller.setCombatState(i % 2 === 0 ? 'IN_COMBAT' : 'OUT_OF_COMBAT');
      }
      expect(controller.getCombatState()).to.equal('OUT_OF_COMBAT');
    });
    
    it('should handle callback throwing exception', function() {
      controller.setStateChangeCallback(() => {
        throw new Error('Callback error');
      });
      expect(() => controller.setCombatState('IN_COMBAT')).to.throw();
    });
  });
});
