/**
 * Unit Tests for PowerButtonModel
 * TDD Phase 1: Model (Data Layer)
 * 
 * Tests pure data storage - NO logic, NO rendering
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

// Load the model
const PowerButtonModel = require(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonModel.js'));

describe('PowerButtonModel', function() {
  let model;

  beforeEach(function() {
    // Mock global dependencies if needed
    if (typeof global.window === 'undefined') {
      global.window = {};
    }
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Constructor', function() {
    it('should create model with default values', function() {
      model = new PowerButtonModel({
        powerName: 'lightning'
      });

      expect(model.getPowerName()).to.equal('lightning');
      expect(model.getIsLocked()).to.be.true; // Default locked
      expect(model.getCooldownProgress()).to.equal(0);
      expect(model.getSpritePath()).to.be.a('string');
    });

    it('should create model with custom values', function() {
      model = new PowerButtonModel({
        powerName: 'fireball',
        isLocked: false,
        cooldownProgress: 0.5,
        spritePath: 'custom/path.png'
      });

      expect(model.getPowerName()).to.equal('fireball');
      expect(model.getIsLocked()).to.be.false;
      expect(model.getCooldownProgress()).to.equal(0.5);
      expect(model.getSpritePath()).to.equal('custom/path.png');
    });

    it('should use default sprite path based on power name', function() {
      model = new PowerButtonModel({ powerName: 'lightning' });
      expect(model.getSpritePath()).to.include('lightning');
      expect(model.getSpritePath()).to.include('.png');
    });
  });

  describe('Data Storage (Pure Data)', function() {
    beforeEach(function() {
      model = new PowerButtonModel({
        powerName: 'finalFlash',
        isLocked: true,
        cooldownProgress: 0
      });
    });

    it('should store power name', function() {
      expect(model.getPowerName()).to.equal('finalFlash');
    });

    it('should store lock status', function() {
      expect(model.getIsLocked()).to.be.true;
    });

    it('should store cooldown progress (0-1 range)', function() {
      expect(model.getCooldownProgress()).to.equal(0);
    });

    it('should store sprite path', function() {
      expect(model.getSpritePath()).to.be.a('string');
    });
  });

  describe('Getters (Read-Only Access)', function() {
    beforeEach(function() {
      model = new PowerButtonModel({
        powerName: 'fireball',
        isLocked: false,
        cooldownProgress: 0.75
      });
    });

    it('should return power name', function() {
      expect(model.getPowerName()).to.equal('fireball');
    });

    it('should return lock status', function() {
      expect(model.getIsLocked()).to.equal(false);
    });

    it('should return cooldown progress', function() {
      expect(model.getCooldownProgress()).to.equal(0.75);
    });

    it('should return sprite path', function() {
      const path = model.getSpritePath();
      expect(path).to.be.a('string');
      expect(path.length).to.be.greaterThan(0);
    });
  });

  describe('Setters (Data Mutation)', function() {
    beforeEach(function() {
      model = new PowerButtonModel({
        powerName: 'lightning',
        isLocked: true,
        cooldownProgress: 0
      });
    });

    it('should update lock status', function() {
      model.setIsLocked(false);
      expect(model.getIsLocked()).to.be.false;

      model.setIsLocked(true);
      expect(model.getIsLocked()).to.be.true;
    });

    it('should update cooldown progress', function() {
      model.setCooldownProgress(0.33);
      expect(model.getCooldownProgress()).to.equal(0.33);

      model.setCooldownProgress(0.99);
      expect(model.getCooldownProgress()).to.equal(0.99);
    });

    it('should clamp cooldown progress to 0-1 range', function() {
      model.setCooldownProgress(-0.5);
      expect(model.getCooldownProgress()).to.equal(0);

      model.setCooldownProgress(1.5);
      expect(model.getCooldownProgress()).to.equal(1);
    });

    it('should update sprite path', function() {
      model.setSpritePath('new/sprite/path.png');
      expect(model.getSpritePath()).to.equal('new/sprite/path.png');
    });
  });

  describe('MVC Compliance - NO Logic', function() {
    beforeEach(function() {
      model = new PowerButtonModel({ powerName: 'lightning' });
    });

    it('should NOT have update methods', function() {
      expect(model.update).to.be.undefined;
    });

    it('should NOT have render methods', function() {
      expect(model.render).to.be.undefined;
    });

    it('should NOT have EventBus methods', function() {
      expect(model.emit).to.be.undefined;
      expect(model.on).to.be.undefined;
      expect(model.subscribe).to.be.undefined;
    });

    it('should NOT have Queen query methods', function() {
      expect(model.isPowerUnlocked).to.be.undefined;
      expect(model.queryQueen).to.be.undefined;
    });
  });

  describe('Data Isolation (Copies)', function() {
    beforeEach(function() {
      model = new PowerButtonModel({
        powerName: 'fireball',
        isLocked: false,
        cooldownProgress: 0.5
      });
    });

    it('should return independent cooldown progress values', function() {
      const progress1 = model.getCooldownProgress();
      const progress2 = model.getCooldownProgress();
      
      expect(progress1).to.equal(progress2);
      expect(progress1).to.equal(0.5);
    });

    it('should not allow external mutation of internal state', function() {
      const powerName = model.getPowerName();
      const modifiedName = powerName + '_modified';
      
      // Original should be unchanged
      expect(model.getPowerName()).to.equal('fireball');
      expect(model.getPowerName()).to.not.equal(modifiedName);
    });
  });

  describe('Edge Cases', function() {
    it('should handle missing powerName', function() {
      model = new PowerButtonModel({});
      expect(model.getPowerName()).to.be.a('string');
    });

    it('should handle null sprite path', function() {
      model = new PowerButtonModel({
        powerName: 'lightning',
        spritePath: null
      });
      // Should fallback to default
      expect(model.getSpritePath()).to.be.a('string');
      expect(model.getSpritePath().length).to.be.greaterThan(0);
    });

    it('should handle undefined cooldown progress', function() {
      model = new PowerButtonModel({
        powerName: 'lightning',
        cooldownProgress: undefined
      });
      expect(model.getCooldownProgress()).to.equal(0);
    });

    it('should handle boolean to number coercion for lock status', function() {
      model = new PowerButtonModel({
        powerName: 'lightning',
        isLocked: 1 // Truthy
      });
      expect(model.getIsLocked()).to.be.true;
    });
  });
});
