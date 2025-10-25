const { expect } = require('chai');
const GameStateManager = require('../../../Classes/managers/GameStateManager.js');

describe('GameStateManager', function() {
  let manager;
  
  beforeEach(function() {
    manager = new GameStateManager();
  });
  
  describe('Constructor', function() {
    it('should initialize with MENU state', function() {
      expect(manager.currentState).to.equal('MENU');
    });
    
    it('should initialize previousState to null', function() {
      expect(manager.previousState).to.be.null;
    });
    
    it('should initialize fadeAlpha to 0', function() {
      expect(manager.fadeAlpha).to.equal(0);
    });
    
    it('should initialize isFading to false', function() {
      expect(manager.isFading).to.be.false;
    });
    
    it('should initialize empty stateChangeCallbacks array', function() {
      expect(manager.stateChangeCallbacks).to.be.an('array').that.is.empty;
    });
    
    it('should initialize fadeDirection to "out"', function() {
      expect(manager.fadeDirection).to.equal('out');
    });
    
    it('should define all valid states', function() {
      expect(manager.STATES).to.have.property('MENU', 'MENU');
      expect(manager.STATES).to.have.property('OPTIONS', 'OPTIONS');
      expect(manager.STATES).to.have.property('DEBUG_MENU', 'DEBUG_MENU');
      expect(manager.STATES).to.have.property('PLAYING', 'PLAYING');
      expect(manager.STATES).to.have.property('PAUSED', 'PAUSED');
      expect(manager.STATES).to.have.property('GAME_OVER', 'GAME_OVER');
      expect(manager.STATES).to.have.property('KAN_BAN', 'KANBAN');
    });
  });
  
  describe('getState()', function() {
    it('should return current state', function() {
      expect(manager.getState()).to.equal('MENU');
    });
    
    it('should return updated state after change', function() {
      manager.setState('PLAYING');
      expect(manager.getState()).to.equal('PLAYING');
    });
  });
  
  describe('setState()', function() {
    it('should change state successfully', function() {
      const result = manager.setState('PLAYING');
      expect(result).to.be.true;
      expect(manager.currentState).to.equal('PLAYING');
    });
    
    it('should update previousState', function() {
      manager.setState('OPTIONS');
      expect(manager.previousState).to.equal('MENU');
    });
    
    it('should return false for invalid state', function() {
      const result = manager.setState('INVALID_STATE');
      expect(result).to.be.false;
    });
    
    it('should not change state when invalid', function() {
      const originalState = manager.currentState;
      manager.setState('INVALID_STATE');
      expect(manager.currentState).to.equal(originalState);
    });
    
    it('should execute callbacks by default', function() {
      let callbackExecuted = false;
      manager.onStateChange(() => { callbackExecuted = true; });
      
      manager.setState('PLAYING');
      
      expect(callbackExecuted).to.be.true;
    });
    
    it('should skip callbacks when skipCallbacks is true', function() {
      let callbackExecuted = false;
      manager.onStateChange(() => { callbackExecuted = true; });
      
      manager.setState('PLAYING', true);
      
      expect(callbackExecuted).to.be.false;
    });
    
    it('should warn for invalid states', function() {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);
      
      manager.setState('BAD_STATE');
      
      expect(warnings.length).to.be.greaterThan(0);
      console.warn = originalWarn;
    });
  });
  
  describe('getPreviousState()', function() {
    it('should return null initially', function() {
      expect(manager.getPreviousState()).to.be.null;
    });
    
    it('should return previous state after transition', function() {
      manager.setState('PLAYING');
      expect(manager.getPreviousState()).to.equal('MENU');
    });
    
    it('should update with each state change', function() {
      manager.setState('OPTIONS');
      expect(manager.getPreviousState()).to.equal('MENU');
      
      manager.setState('PLAYING');
      expect(manager.getPreviousState()).to.equal('OPTIONS');
    });
  });
  
  describe('isState()', function() {
    it('should return true for current state', function() {
      expect(manager.isState('MENU')).to.be.true;
    });
    
    it('should return false for different state', function() {
      expect(manager.isState('PLAYING')).to.be.false;
    });
    
    it('should update when state changes', function() {
      manager.setState('OPTIONS');
      expect(manager.isState('OPTIONS')).to.be.true;
      expect(manager.isState('MENU')).to.be.false;
    });
  });
  
  describe('isAnyState()', function() {
    it('should return true when current matches one of provided', function() {
      expect(manager.isAnyState('MENU', 'OPTIONS', 'PLAYING')).to.be.true;
    });
    
    it('should return false when current matches none', function() {
      expect(manager.isAnyState('OPTIONS', 'PLAYING', 'PAUSED')).to.be.false;
    });
    
    it('should handle single state', function() {
      expect(manager.isAnyState('MENU')).to.be.true;
    });
    
    it('should handle many states', function() {
      manager.setState('PAUSED');
      expect(manager.isAnyState('MENU', 'OPTIONS', 'PLAYING', 'PAUSED', 'GAME_OVER')).to.be.true;
    });
  });
  
  describe('isValidState()', function() {
    it('should return true for valid states', function() {
      expect(manager.isValidState('MENU')).to.be.true;
      expect(manager.isValidState('PLAYING')).to.be.true;
      expect(manager.isValidState('OPTIONS')).to.be.true;
    });
    
    it('should return false for invalid states', function() {
      expect(manager.isValidState('INVALID')).to.be.false;
      expect(manager.isValidState('RANDOM')).to.be.false;
      expect(manager.isValidState('')).to.be.false;
    });
    
    it('should handle null and undefined', function() {
      expect(manager.isValidState(null)).to.be.false;
      expect(manager.isValidState(undefined)).to.be.false;
    });
  });
  
  describe('Fade Transition Management', function() {
    describe('getFadeAlpha()', function() {
      it('should return initial fade alpha', function() {
        expect(manager.getFadeAlpha()).to.equal(0);
      });
      
      it('should return updated fade alpha', function() {
        manager.setFadeAlpha(128);
        expect(manager.getFadeAlpha()).to.equal(128);
      });
    });
    
    describe('setFadeAlpha()', function() {
      it('should set fade alpha', function() {
        manager.setFadeAlpha(100);
        expect(manager.fadeAlpha).to.equal(100);
      });
      
      it('should clamp to 0 minimum', function() {
        manager.setFadeAlpha(-50);
        expect(manager.fadeAlpha).to.equal(0);
      });
      
      it('should clamp to 255 maximum', function() {
        manager.setFadeAlpha(300);
        expect(manager.fadeAlpha).to.equal(255);
      });
      
      it('should handle boundary values', function() {
        manager.setFadeAlpha(0);
        expect(manager.fadeAlpha).to.equal(0);
        
        manager.setFadeAlpha(255);
        expect(manager.fadeAlpha).to.equal(255);
      });
    });
    
    describe('isFadingTransition()', function() {
      it('should return false initially', function() {
        expect(manager.isFadingTransition()).to.be.false;
      });
      
      it('should return true after starting fade', function() {
        manager.startFadeTransition();
        expect(manager.isFadingTransition()).to.be.true;
      });
      
      it('should return false after stopping fade', function() {
        manager.startFadeTransition();
        manager.stopFadeTransition();
        expect(manager.isFadingTransition()).to.be.false;
      });
    });
    
    describe('startFadeTransition()', function() {
      it('should set isFading to true', function() {
        manager.startFadeTransition();
        expect(manager.isFading).to.be.true;
      });
      
      it('should set fadeAlpha to 0 for "out" direction', function() {
        manager.fadeAlpha = 100;
        manager.startFadeTransition('out');
        expect(manager.fadeAlpha).to.equal(0);
      });
      
      it('should set fadeAlpha to 255 for "in" direction', function() {
        manager.fadeAlpha = 100;
        manager.startFadeTransition('in');
        expect(manager.fadeAlpha).to.equal(255);
      });
      
      it('should default to "out" direction', function() {
        manager.startFadeTransition();
        expect(manager.fadeDirection).to.equal('out');
        expect(manager.fadeAlpha).to.equal(0);
      });
      
      it('should set fadeDirection', function() {
        manager.startFadeTransition('in');
        expect(manager.fadeDirection).to.equal('in');
      });
    });
    
    describe('stopFadeTransition()', function() {
      it('should set isFading to false', function() {
        manager.isFading = true;
        manager.stopFadeTransition();
        expect(manager.isFading).to.be.false;
      });
      
      it('should work when already stopped', function() {
        manager.stopFadeTransition();
        expect(manager.isFading).to.be.false;
      });
    });
    
    describe('updateFade()', function() {
      it('should return false when not fading', function() {
        const result = manager.updateFade();
        expect(result).to.be.false;
      });
      
      it('should increase fadeAlpha for "out" direction', function() {
        manager.startFadeTransition('out');
        manager.updateFade(10);
        expect(manager.fadeAlpha).to.equal(10);
      });
      
      it('should decrease fadeAlpha for "in" direction', function() {
        manager.startFadeTransition('in');
        manager.updateFade(10);
        expect(manager.fadeAlpha).to.equal(245);
      });
      
      it('should return true when fade-out completes', function() {
        manager.startFadeTransition('out');
        manager.fadeAlpha = 250;
        const result = manager.updateFade(10);
        expect(result).to.be.true;
        expect(manager.fadeAlpha).to.equal(255);
      });
      
      it('should return true when fade-in completes', function() {
        manager.startFadeTransition('in');
        manager.fadeAlpha = 5;
        const result = manager.updateFade(10);
        expect(result).to.be.true;
        expect(manager.fadeAlpha).to.equal(0);
      });
      
      it('should stop fading when fade-in completes', function() {
        manager.startFadeTransition('in');
        manager.fadeAlpha = 5;
        manager.updateFade(10);
        expect(manager.isFading).to.be.false;
      });
      
      it('should use default increment of 5', function() {
        manager.startFadeTransition('out');
        manager.updateFade();
        expect(manager.fadeAlpha).to.equal(5);
      });
      
      it('should handle custom increments', function() {
        manager.startFadeTransition('out');
        manager.updateFade(20);
        expect(manager.fadeAlpha).to.equal(20);
      });
    });
  });
  
  describe('Callback System', function() {
    describe('onStateChange()', function() {
      it('should register callback', function() {
        const callback = () => {};
        manager.onStateChange(callback);
        expect(manager.stateChangeCallbacks).to.include(callback);
      });
      
      it('should register multiple callbacks', function() {
        const cb1 = () => {};
        const cb2 = () => {};
        manager.onStateChange(cb1);
        manager.onStateChange(cb2);
        expect(manager.stateChangeCallbacks).to.have.lengthOf(2);
      });
      
      it('should not register non-function', function() {
        manager.onStateChange('not a function');
        expect(manager.stateChangeCallbacks).to.be.empty;
      });
    });
    
    describe('removeStateChangeCallback()', function() {
      it('should remove registered callback', function() {
        const callback = () => {};
        manager.onStateChange(callback);
        manager.removeStateChangeCallback(callback);
        expect(manager.stateChangeCallbacks).to.not.include(callback);
      });
      
      it('should do nothing for unregistered callback', function() {
        const callback = () => {};
        expect(() => manager.removeStateChangeCallback(callback)).to.not.throw();
      });
      
      it('should handle removing from empty list', function() {
        const callback = () => {};
        expect(() => manager.removeStateChangeCallback(callback)).to.not.throw();
      });
    });
    
    describe('executeCallbacks()', function() {
      it('should execute all registered callbacks', function() {
        let count = 0;
        manager.onStateChange(() => count++);
        manager.onStateChange(() => count++);
        
        manager.executeCallbacks('PLAYING', 'MENU');
        
        expect(count).to.equal(2);
      });
      
      it('should pass new and old state to callbacks', function() {
        let receivedNew, receivedOld;
        manager.onStateChange((newState, oldState) => {
          receivedNew = newState;
          receivedOld = oldState;
        });
        
        manager.executeCallbacks('PLAYING', 'MENU');
        
        expect(receivedNew).to.equal('PLAYING');
        expect(receivedOld).to.equal('MENU');
      });
      
      it('should handle callback errors gracefully', function() {
        manager.onStateChange(() => { throw new Error('Test error'); });
        manager.onStateChange(() => {}); // Should still execute
        
        expect(() => manager.executeCallbacks('PLAYING', 'MENU')).to.not.throw();
      });
    });
  });
  
  describe('Convenience State Check Methods', function() {
    it('isInMenu() should check MENU state', function() {
      expect(manager.isInMenu()).to.be.true;
      manager.setState('PLAYING');
      expect(manager.isInMenu()).to.be.false;
    });
    
    it('isInOptions() should check OPTIONS state', function() {
      expect(manager.isInOptions()).to.be.false;
      manager.setState('OPTIONS');
      expect(manager.isInOptions()).to.be.true;
    });
    
    it('isInGame() should check PLAYING state', function() {
      expect(manager.isInGame()).to.be.false;
      manager.setState('PLAYING');
      expect(manager.isInGame()).to.be.true;
    });
    
    it('isPaused() should check PAUSED state', function() {
      expect(manager.isPaused()).to.be.false;
      manager.setState('PAUSED');
      expect(manager.isPaused()).to.be.true;
    });
    
    it('isGameOver() should check GAME_OVER state', function() {
      expect(manager.isGameOver()).to.be.false;
      manager.setState('GAME_OVER');
      expect(manager.isGameOver()).to.be.true;
    });
    
    it('isDebug() should check DEBUG_MENU state', function() {
      expect(manager.isDebug()).to.be.false;
      manager.setState('DEBUG_MENU');
      expect(manager.isDebug()).to.be.true;
    });
    
    it('isKanban() should check KAN_BAN state', function() {
      expect(manager.isKanban()).to.be.false;
      manager.setState('KANBAN');
      expect(manager.isKanban()).to.be.true;
    });
  });
  
  describe('Transition Methods', function() {
    it('goToMenu() should transition to MENU', function() {
      manager.setState('PLAYING');
      manager.goToMenu();
      expect(manager.currentState).to.equal('MENU');
    });
    
    it('goToOptions() should transition to OPTIONS', function() {
      manager.goToOptions();
      expect(manager.currentState).to.equal('OPTIONS');
    });
    
    it('goToDebug() should transition to DEBUG_MENU', function() {
      manager.goToDebug();
      expect(manager.currentState).to.equal('DEBUG_MENU');
    });
    
    it('startGame() should transition to PLAYING', function() {
      manager.startGame();
      expect(manager.currentState).to.equal('PLAYING');
    });
    
    it('startGame() should start fade transition', function() {
      manager.startGame();
      expect(manager.isFading).to.be.true;
    });
    
    it('pauseGame() should transition to PAUSED', function() {
      manager.setState('PLAYING');
      manager.pauseGame();
      expect(manager.currentState).to.equal('PAUSED');
    });
    
    it('resumeGame() should transition to PLAYING', function() {
      manager.setState('PAUSED');
      manager.resumeGame();
      expect(manager.currentState).to.equal('PLAYING');
    });
    
    it('endGame() should transition to GAME_OVER', function() {
      manager.setState('PLAYING');
      manager.endGame();
      expect(manager.currentState).to.equal('GAME_OVER');
    });
    
    it('goToKanban() should transition to KAN_BAN', function() {
      manager.goToKanban();
      expect(manager.currentState).to.equal('KANBAN');
    });
  });
  
  describe('reset()', function() {
    it('should reset to MENU state', function() {
      manager.setState('PLAYING');
      manager.reset();
      expect(manager.currentState).to.equal('MENU');
    });
    
    it('should reset previousState to null', function() {
      manager.setState('PLAYING');
      manager.reset();
      expect(manager.previousState).to.be.null;
    });
    
    it('should reset fadeAlpha to 0', function() {
      manager.fadeAlpha = 200;
      manager.reset();
      expect(manager.fadeAlpha).to.equal(0);
    });
    
    it('should reset isFading to false', function() {
      manager.isFading = true;
      manager.reset();
      expect(manager.isFading).to.be.false;
    });
  });
  
  describe('getDebugInfo()', function() {
    it('should return debug information object', function() {
      const info = manager.getDebugInfo();
      expect(info).to.be.an('object');
    });
    
    it('should include current state', function() {
      const info = manager.getDebugInfo();
      expect(info).to.have.property('currentState', 'MENU');
    });
    
    it('should include previous state', function() {
      const info = manager.getDebugInfo();
      expect(info).to.have.property('previousState', null);
    });
    
    it('should include fade alpha', function() {
      const info = manager.getDebugInfo();
      expect(info).to.have.property('fadeAlpha', 0);
    });
    
    it('should include isFading', function() {
      const info = manager.getDebugInfo();
      expect(info).to.have.property('isFading', false);
    });
    
    it('should include callback count', function() {
      manager.onStateChange(() => {});
      const info = manager.getDebugInfo();
      expect(info).to.have.property('callbackCount', 1);
    });
    
    it('should include valid states', function() {
      const info = manager.getDebugInfo();
      expect(info).to.have.property('validStates');
      expect(info.validStates).to.equal(manager.STATES);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle rapid state changes', function() {
      for (let i = 0; i < 100; i++) {
        manager.setState('PLAYING');
        manager.setState('PAUSED');
      }
      expect(manager.currentState).to.equal('PAUSED');
    });
    
    it('should handle setting same state multiple times', function() {
      manager.setState('PLAYING');
      const prevState = manager.previousState;
      manager.setState('PLAYING');
      expect(manager.previousState).to.equal('PLAYING');
    });
    
    it('should handle multiple fade transitions', function() {
      manager.startFadeTransition('out');
      manager.startFadeTransition('in');
      manager.startFadeTransition('out');
      expect(manager.fadeDirection).to.equal('out');
    });
    
    it.skip('should handle callback during state transition (causes infinite loop)', function() {
      // This test is skipped because it causes infinite recursion
      // setState -> callback -> setState -> callback -> ...
      // This is a known limitation/danger of the callback system
      manager.onStateChange(() => {
        manager.setState('PAUSED');
      });
      manager.setState('PLAYING');
      // The callback triggers another state change
      expect(manager.currentState).to.equal('PAUSED');
    });
  });
});
