/**
 * Test Suite for Sprite2D Class (Mocha/Chai)
 */

const { expect } = require('chai');

// Mock global variables and dependencies
global.createVector = (x, y) => ({ 
  x: x || 0, 
  y: y || 0, 
  copy: function() { return { x: this.x, y: this.y, copy: this.copy }; }
});

// Mock p5.js rendering functions
global.push = () => {};
global.pop = () => {};
global.translate = (x, y) => {};
global.rotate = (angle) => {};
global.radians = (degrees) => degrees * (Math.PI / 180);
global.imageMode = (mode) => {};
global.image = (img, x, y, width, height) => {};
global.scale = (x, y) => {}; // Added missing scale function
global.tint = (c, alpha) => {}; // Added missing tint function
global.CENTER = 'center';

// Import the Sprite2D class
const Sprite2D = require('../../../Classes/rendering/Sprite2d.js');

describe('Sprite2D', function() {
  describe('Constructor', function() {
    it('should initialize with basic parameters', function() {
      const mockImg = { src: 'test-image.png' };
      const pos = createVector(10, 20);
      const size = createVector(30, 40);
      const rotation = 45;
      
      const sprite = new Sprite2D(mockImg, pos, size, rotation);
      
      expect(sprite.img).to.equal(mockImg);
      expect(sprite.pos).to.deep.include({ x: 10, y: 20 });
      expect(sprite.size).to.deep.include({ x: 30, y: 40 });
      expect(sprite.rotation).to.equal(45);
    });

    it('should default rotation to 0', function() {
      const mockImg = { src: 'test-image.png' };
      const pos = createVector(0, 0);
      const size = createVector(50, 50);
      
      const sprite = new Sprite2D(mockImg, pos, size);
      
      expect(sprite.rotation).to.equal(0);
    });

    it('should copy vectors not reference them', function() {
      const mockImg = { src: 'test-image.png' };
      const originalPos = createVector(100, 200);
      const originalSize = createVector(60, 80);
      
      const sprite = new Sprite2D(mockImg, originalPos, originalSize);
      
      // Modify original vectors
      originalPos.x = 999;
      originalPos.y = 999;
      originalSize.x = 999;
      originalSize.y = 999;
      
      // Sprite should have copied values
      expect(sprite.pos).to.deep.include({ x: 100, y: 200 });
      expect(sprite.size).to.deep.include({ x: 60, y: 80 });
    });

    it('should handle plain object vectors', function() {
      const mockImg = { src: 'test-image.png' };
      const pos = { x: 15, y: 25 };
      const size = { x: 35, y: 45 };
      
      const sprite = new Sprite2D(mockImg, pos, size);
      
      expect(sprite.pos).to.deep.include({ x: 15, y: 25 });
      expect(sprite.size).to.deep.include({ x: 35, y: 45 });
    });
  });

  describe('Setters', function() {
    it('setImage should update image', function() {
      const mockImg1 = { src: 'image1.png' };
      const mockImg2 = { src: 'image2.png' };
      const sprite = new Sprite2D(mockImg1, createVector(0, 0), createVector(50, 50));
      
      sprite.setImage(mockImg2);
      
      expect(sprite.img).to.equal(mockImg2);
    });

    it('setPosition should update and copy position', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(50, 50));
      const newPos = createVector(100, 150);
      
      sprite.setPosition(newPos);
      
      expect(sprite.pos).to.deep.include({ x: 100, y: 150 });
      
      // Verify it was copied
      newPos.x = 999;
      expect(sprite.pos).to.deep.include({ x: 100, y: 150 });
    });

    it('setPosition should handle plain objects', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(50, 50));
      const newPos = { x: 200, y: 250 };
      
      sprite.setPosition(newPos);
      
      expect(sprite.pos).to.deep.include({ x: 200, y: 250 });
    });

    it('setSize should update and copy size', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(50, 50));
      const newSize = createVector(80, 120);
      
      sprite.setSize(newSize);
      
      expect(sprite.size).to.deep.include({ x: 80, y: 120 });
      
      // Verify it was copied
      newSize.x = 999;
      expect(sprite.size).to.deep.include({ x: 80, y: 120 });
    });

    it('setSize should handle plain objects', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(50, 50));
      const newSize = { x: 90, y: 110 };
      
      sprite.setSize(newSize);
      
      expect(sprite.size).to.deep.include({ x: 90, y: 110 });
    });

    it('setRotation should update rotation', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(50, 50));
      
      sprite.setRotation(90);
      expect(sprite.rotation).to.equal(90);
      
      sprite.setRotation(-45);
      expect(sprite.rotation).to.equal(-45);
      
      sprite.setRotation(0);
      expect(sprite.rotation).to.equal(0);
    });
  });

  describe('Rendering', function() {
    beforeEach(function() {
      // Reset render functions
      global.push = () => {};
      global.pop = () => {};
      global.translate = () => {};
      global.rotate = () => {};
      global.imageMode = () => {};
      global.image = () => {};
    });

    it('render should execute without error', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(10, 20), createVector(50, 60), 30);
      expect(() => sprite.render()).to.not.throw();
    });

    it('render should call p5 functions in correct order', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(10, 20), createVector(50, 60), 30);
      
      const callOrder = [];
      global.push = () => callOrder.push('push');
      global.imageMode = () => callOrder.push('imageMode');
      global.translate = () => callOrder.push('translate');
      global.rotate = () => callOrder.push('rotate');
      global.image = () => callOrder.push('image');
      global.pop = () => callOrder.push('pop');
      global.scale = () => callOrder.push('scale');
      
      sprite.render();
      
      // Correct order: push → imageMode → translate → scale → rotate → image → pop
      expect(callOrder).to.deep.equal(['push', 'imageMode', 'translate', 'scale', 'rotate', 'image', 'pop']);
    });

    it('render should handle zero rotation', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(40, 40), 0);
      
      let rotateAngle = null;
      global.rotate = (angle) => { rotateAngle = angle; };
      
      sprite.render();
      
      expect(rotateAngle).to.equal(0);
    });
  });

  describe('Integration', function() {
    it('should support full lifecycle updates', function() {
      const mockImg1 = { src: 'initial.png' };
      const mockImg2 = { src: 'updated.png' };
      
      const sprite = new Sprite2D(mockImg1, createVector(0, 0), createVector(32, 32));
      
      sprite.setImage(mockImg2);
      sprite.setPosition(createVector(100, 150));
      sprite.setSize(createVector(64, 48));
      sprite.setRotation(45);
      
      expect(sprite.img).to.equal(mockImg2);
      expect(sprite.pos).to.deep.include({ x: 100, y: 150 });
      expect(sprite.size).to.deep.include({ x: 64, y: 48 });
      expect(sprite.rotation).to.equal(45);
      
      expect(() => sprite.render()).to.not.throw();
    });

    it('should handle vector method compatibility', function() {
      const posWithCopy = { x: 10, y: 20, copy: function() { return { x: this.x, y: this.y, copy: this.copy }; }};
      const sizeWithCopy = { x: 30, y: 40, copy: function() { return { x: this.x, y: this.y, copy: this.copy }; }};
      
      const sprite = new Sprite2D({ src: 'test.png' }, posWithCopy, sizeWithCopy);
      
      expect(sprite.pos).to.deep.include({ x: 10, y: 20 });
      expect(sprite.size).to.deep.include({ x: 30, y: 40 });
      
      const plainPos = { x: 50, y: 60 };
      const plainSize = { x: 70, y: 80 };
      
      sprite.setPosition(plainPos);
      sprite.setSize(plainSize);
      
      expect(sprite.pos).to.deep.include({ x: 50, y: 60 });
      expect(sprite.size).to.deep.include({ x: 70, y: 80 });
    });

    it('should create multiple independent sprites', function() {
      const mockImg = { src: 'test.png' };
      const sprites = [];
      
      for (let i = 0; i < 100; i++) {
        sprites.push(new Sprite2D(mockImg, createVector(i, i), createVector(20, 20), i));
      }
      
      expect(sprites).to.have.lengthOf(100);
      
      sprites[0].setPosition(createVector(999, 999));
      expect(sprites[1].pos).to.deep.include({ x: 1, y: 1 });
    });
  });
});
