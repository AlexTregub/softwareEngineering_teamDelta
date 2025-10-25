const { expect } = require('chai');

// Load the module
class KeyboardInputController {
  constructor() {
    this.keyPressHandlers = [];
    this.keyReleaseHandlers = [];
    this.keyTypeHandlers = [];
    this.pressedKeys = new Set();
  }
  onKeyPress(fn) {
    if (typeof fn === 'function') this.keyPressHandlers.push(fn);
  }
  onKeyRelease(fn) {
    if (typeof fn === 'function') this.keyReleaseHandlers.push(fn);
  }
  onKeyType(fn) {
    if (typeof fn === 'function') this.keyTypeHandlers.push(fn);
  }
  handleKeyPressed(keyCode, key) {
    this.pressedKeys.add(keyCode);
    this.keyPressHandlers.forEach(fn => fn(keyCode, key));
  }
  handleKeyReleased(keyCode, key) {
    this.pressedKeys.delete(keyCode);
    this.keyReleaseHandlers.forEach(fn => fn(keyCode, key));
  }
  handleKeyTyped(key) {
    this.keyTypeHandlers.forEach(fn => fn(key));
  }
  isKeyDown(keyCode) {
    return this.pressedKeys.has(keyCode);
  }
}

describe('KeyboardInputController', function() {
  let controller;
  
  beforeEach(function() {
    controller = new KeyboardInputController();
  });
  
  describe('Constructor', function() {
    it('should initialize empty handler arrays', function() {
      expect(controller.keyPressHandlers).to.be.an('array').that.is.empty;
      expect(controller.keyReleaseHandlers).to.be.an('array').that.is.empty;
      expect(controller.keyTypeHandlers).to.be.an('array').that.is.empty;
    });
    
    it('should initialize empty pressed keys set', function() {
      expect(controller.pressedKeys).to.be.instanceof(Set);
      expect(controller.pressedKeys.size).to.equal(0);
    });
  });
  
  describe('Handler Registration', function() {
    describe('onKeyPress()', function() {
      it('should register key press handler', function() {
        const handler = () => {};
        controller.onKeyPress(handler);
        expect(controller.keyPressHandlers).to.include(handler);
      });
      
      it('should register multiple handlers', function() {
        const handler1 = () => {};
        const handler2 = () => {};
        controller.onKeyPress(handler1);
        controller.onKeyPress(handler2);
        expect(controller.keyPressHandlers).to.have.lengthOf(2);
      });
      
      it('should ignore non-function values', function() {
        controller.onKeyPress('not a function');
        controller.onKeyPress(null);
        controller.onKeyPress(undefined);
        expect(controller.keyPressHandlers).to.be.empty;
      });
    });
    
    describe('onKeyRelease()', function() {
      it('should register key release handler', function() {
        const handler = () => {};
        controller.onKeyRelease(handler);
        expect(controller.keyReleaseHandlers).to.include(handler);
      });
      
      it('should register multiple handlers', function() {
        const handler1 = () => {};
        const handler2 = () => {};
        controller.onKeyRelease(handler1);
        controller.onKeyRelease(handler2);
        expect(controller.keyReleaseHandlers).to.have.lengthOf(2);
      });
    });
    
    describe('onKeyType()', function() {
      it('should register key type handler', function() {
        const handler = () => {};
        controller.onKeyType(handler);
        expect(controller.keyTypeHandlers).to.include(handler);
      });
      
      it('should register multiple handlers', function() {
        const handler1 = () => {};
        const handler2 = () => {};
        controller.onKeyType(handler1);
        controller.onKeyType(handler2);
        expect(controller.keyTypeHandlers).to.have.lengthOf(2);
      });
    });
  });
  
  describe('Key Press Handling', function() {
    describe('handleKeyPressed()', function() {
      it('should add key to pressed keys set', function() {
        controller.handleKeyPressed(65, 'a');
        expect(controller.pressedKeys.has(65)).to.be.true;
      });
      
      it('should invoke all press handlers', function() {
        let count = 0;
        controller.onKeyPress(() => count++);
        controller.onKeyPress(() => count++);
        controller.handleKeyPressed(65, 'a');
        expect(count).to.equal(2);
      });
      
      it('should pass keyCode and key to handlers', function() {
        let capturedCode, capturedKey;
        controller.onKeyPress((code, key) => {
          capturedCode = code;
          capturedKey = key;
        });
        controller.handleKeyPressed(65, 'a');
        expect(capturedCode).to.equal(65);
        expect(capturedKey).to.equal('a');
      });
      
      it('should handle multiple keys pressed', function() {
        controller.handleKeyPressed(65, 'a');
        controller.handleKeyPressed(66, 'b');
        controller.handleKeyPressed(67, 'c');
        expect(controller.pressedKeys.size).to.equal(3);
      });
      
      it('should handle same key pressed multiple times', function() {
        controller.handleKeyPressed(65, 'a');
        controller.handleKeyPressed(65, 'a');
        expect(controller.pressedKeys.size).to.equal(1);
      });
    });
    
    describe('handleKeyReleased()', function() {
      it('should remove key from pressed keys set', function() {
        controller.handleKeyPressed(65, 'a');
        controller.handleKeyReleased(65, 'a');
        expect(controller.pressedKeys.has(65)).to.be.false;
      });
      
      it('should invoke all release handlers', function() {
        let count = 0;
        controller.onKeyRelease(() => count++);
        controller.onKeyRelease(() => count++);
        controller.handleKeyReleased(65, 'a');
        expect(count).to.equal(2);
      });
      
      it('should pass keyCode and key to handlers', function() {
        let capturedCode, capturedKey;
        controller.onKeyRelease((code, key) => {
          capturedCode = code;
          capturedKey = key;
        });
        controller.handleKeyReleased(65, 'a');
        expect(capturedCode).to.equal(65);
        expect(capturedKey).to.equal('a');
      });
      
      it('should handle releasing key that was not pressed', function() {
        expect(() => controller.handleKeyReleased(65, 'a')).to.not.throw();
        expect(controller.pressedKeys.has(65)).to.be.false;
      });
    });
    
    describe('handleKeyTyped()', function() {
      it('should invoke all type handlers', function() {
        let count = 0;
        controller.onKeyType(() => count++);
        controller.onKeyType(() => count++);
        controller.handleKeyTyped('a');
        expect(count).to.equal(2);
      });
      
      it('should pass key to handlers', function() {
        let capturedKey;
        controller.onKeyType((key) => { capturedKey = key; });
        controller.handleKeyTyped('x');
        expect(capturedKey).to.equal('x');
      });
      
      it('should handle special characters', function() {
        let capturedKey;
        controller.onKeyType((key) => { capturedKey = key; });
        controller.handleKeyTyped('!');
        expect(capturedKey).to.equal('!');
      });
    });
  });
  
  describe('isKeyDown()', function() {
    it('should return true for pressed key', function() {
      controller.handleKeyPressed(65, 'a');
      expect(controller.isKeyDown(65)).to.be.true;
    });
    
    it('should return false for unpressed key', function() {
      expect(controller.isKeyDown(65)).to.be.false;
    });
    
    it('should return false after key released', function() {
      controller.handleKeyPressed(65, 'a');
      controller.handleKeyReleased(65, 'a');
      expect(controller.isKeyDown(65)).to.be.false;
    });
    
    it('should handle checking multiple keys', function() {
      controller.handleKeyPressed(65, 'a');
      controller.handleKeyPressed(66, 'b');
      expect(controller.isKeyDown(65)).to.be.true;
      expect(controller.isKeyDown(66)).to.be.true;
      expect(controller.isKeyDown(67)).to.be.false;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle empty handlers gracefully', function() {
      expect(() => controller.handleKeyPressed(65, 'a')).to.not.throw();
      expect(() => controller.handleKeyReleased(65, 'a')).to.not.throw();
      expect(() => controller.handleKeyTyped('a')).to.not.throw();
    });
    
    it('should handle handler throwing exception', function() {
      controller.onKeyPress(() => { throw new Error('Handler error'); });
      expect(() => controller.handleKeyPressed(65, 'a')).to.throw();
    });
    
    it('should handle undefined key parameter', function() {
      expect(() => controller.handleKeyPressed(65, undefined)).to.not.throw();
    });
    
    it('should handle null keyCode', function() {
      expect(() => controller.handleKeyPressed(null, 'a')).to.not.throw();
    });
    
    it('should track many keys simultaneously', function() {
      for (let i = 0; i < 100; i++) {
        controller.handleKeyPressed(i, String.fromCharCode(i));
      }
      expect(controller.pressedKeys.size).to.equal(100);
    });
    
    it('should clear keys individually', function() {
      controller.handleKeyPressed(65, 'a');
      controller.handleKeyPressed(66, 'b');
      controller.handleKeyPressed(67, 'c');
      controller.handleKeyReleased(66, 'b');
      expect(controller.isKeyDown(65)).to.be.true;
      expect(controller.isKeyDown(66)).to.be.false;
      expect(controller.isKeyDown(67)).to.be.true;
    });
  });
});
