/**
 * @fileoverview Comprehensive MVC Ant Tests
 * Tests core ant functionality using the new MVC pattern (AntFactory, AntModel, AntView, AntController)
 * Replaces functionality tested in test/unit/ants/ant.test.js but with MVC architecture
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Load MVC classes
const AntModel = require('../../../Classes/baseMVC/models/AntModel.js');
const AntView = require('../../../Classes/baseMVC/views/AntView.js');
const AntController = require('../../../Classes/baseMVC/controllers/AntController.js');
const AntFactory = require('../../../Classes/baseMVC/factories/AntFactory.js');

describe('Ant MVC - Core Functionality', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.createVector = sandbox.stub().callsFake((x, y) => ({ 
      x, y, 
      copy() { return { x: this.x, y: this.y }; },
      add(v) { this.x += v.x; this.y += v.y; return this; },
      sub(v) { this.x -= v.x; this.y -= v.y; return this; },
      mult(n) { this.x *= n; this.y *= n; return this; },
      mag() { return Math.sqrt(this.x * this.x + this.y * this.y); },
      normalize() { const m = this.mag(); if (m > 0) { this.x /= m; this.y /= m; } return this; }
    }));
    global.dist = sandbox.stub().callsFake((x1, y1, x2, y2) => {
      return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    });
    
    // Sync window and global
    if (typeof window !== 'undefined') {
      window.createVector = global.createVector;
      window.dist = global.dist;
    }
  });

  afterEach(function() {
    sandbox.restore();
  });

  // ============================================================================
  // AntFactory.createAnt() Tests
  // ============================================================================

  describe('AntFactory.createAnt()', function() {
    it('should create ant MVC object with model, view, controller', function() {
      const antMVC = AntFactory.createAnt(100, 100, {
        faction: 'player',
        job: 'Scout'
      });

      expect(antMVC).to.exist;
      expect(antMVC.model).to.be.instanceOf(AntModel);
      expect(antMVC.view).to.be.instanceOf(AntView);
      expect(antMVC.controller).to.be.instanceOf(AntController);
    });

    it('should set position correctly', function() {
      const antMVC = AntFactory.createAnt(250, 350);

      expect(antMVC.model.getX()).to.equal(250);
      expect(antMVC.model.getY()).to.equal(350);
    });

    it('should set faction correctly', function() {
      const playerAnt = AntFactory.createAnt(100, 100, { faction: 'player' });
      const enemyAnt = AntFactory.createAnt(200, 200, { faction: 'enemy' });

      expect(playerAnt.model.getFaction()).to.equal('player');
      expect(enemyAnt.model.getFaction()).to.equal('enemy');
    });

    it('should set job correctly', function() {
      const scout = AntFactory.createAnt(100, 100, { job: 'Scout' });
      const warrior = AntFactory.createAnt(200, 200, { job: 'Warrior' });

      expect(scout.model.getJobName()).to.equal('Scout');
      expect(warrior.model.getJobName()).to.equal('Warrior');
    });

    it('should have default health', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      expect(antMVC.model.getHealth()).to.be.a('number');
      expect(antMVC.model.getHealth()).to.be.greaterThan(0);
      expect(antMVC.model.getHealth()).to.equal(antMVC.model.getMaxHealth());
    });

    it('should have default size', function() {
      const antMVC = AntFactory.createAnt(100, 100);
      const size = antMVC.model.getSize();

      expect(size).to.be.an('object');
      expect(size.x).to.be.a('number').greaterThan(0);
      expect(size.y).to.be.a('number').greaterThan(0);
    });

    it('should be active by default', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      expect(antMVC.model.isActive()).to.be.true;
    });
  });

  // ============================================================================
  // Position & Movement Tests
  // ============================================================================

  describe('Position & Movement', function() {
    it('should get position through model', function() {
      const antMVC = AntFactory.createAnt(150, 250);

      expect(antMVC.model.getX()).to.equal(150);
      expect(antMVC.model.getY()).to.equal(250);
      
      const pos = antMVC.model.getPosition();
      expect(pos.x).to.equal(150);
      expect(pos.y).to.equal(250);
    });

    it('should set position through model', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      antMVC.model.setPosition(300, 400);

      expect(antMVC.model.getX()).to.equal(300);
      expect(antMVC.model.getY()).to.equal(400);
    });

    it('should move to location through controller', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      antMVC.controller.moveToLocation(500, 600);

      // Verify pathfinding or movement was triggered
      // (exact position depends on pathfinding system)
      expect(antMVC.model.getX()).to.be.a('number');
      expect(antMVC.model.getY()).to.be.a('number');
    });

    it('should have movement speed', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      const speed = antMVC.model.getMovementSpeed();
      expect(speed).to.be.a('number').greaterThan(0);
    });

    it('should allow setting movement speed', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      antMVC.model.setMovementSpeed(5.5);

      expect(antMVC.model.getMovementSpeed()).to.equal(5.5);
    });
  });

  // ============================================================================
  // Health & Combat Tests
  // ============================================================================

  describe('Health & Combat', function() {
    it('should have health getter', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      expect(antMVC.model.getHealth()).to.be.a('number');
      expect(antMVC.model.getHealth()).to.be.greaterThan(0);
    });

    it('should have max health getter', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      const maxHealth = antMVC.model.getMaxHealth();
      expect(maxHealth).to.be.a('number').greaterThan(0);
      expect(antMVC.model.getHealth()).to.equal(maxHealth);
    });

    it('should take damage through controller', function() {
      const antMVC = AntFactory.createAnt(100, 100);
      const initialHealth = antMVC.model.getHealth();

      antMVC.controller.takeDamage(25);

      expect(antMVC.model.getHealth()).to.equal(initialHealth - 25);
    });

    it('should heal through controller', function() {
      const antMVC = AntFactory.createAnt(100, 100);
      
      // Damage first
      antMVC.controller.takeDamage(30);
      const damagedHealth = antMVC.model.getHealth();

      // Heal
      antMVC.controller.heal(15);

      expect(antMVC.model.getHealth()).to.equal(damagedHealth + 15);
    });

    it('should not heal above max health', function() {
      const antMVC = AntFactory.createAnt(100, 100);
      const maxHealth = antMVC.model.getMaxHealth();

      antMVC.controller.heal(999);

      expect(antMVC.model.getHealth()).to.equal(maxHealth);
    });

    it('should die when health reaches 0', function() {
      const antMVC = AntFactory.createAnt(100, 100);
      const maxHealth = antMVC.model.getMaxHealth();

      antMVC.controller.takeDamage(maxHealth + 100);

      expect(antMVC.model.getHealth()).to.be.at.most(0);
      expect(antMVC.model.isActive()).to.be.false;
    });

    it('should have attack damage property', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      const damage = antMVC.model.getAttackDamage();
      expect(damage).to.be.a('number').greaterThanOrEqual(0);
    });

    it('should have attack range property', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      const range = antMVC.model.getAttackRange();
      expect(range).to.be.a('number').greaterThan(0);
    });
  });

  // ============================================================================
  // Faction Tests
  // ============================================================================

  describe('Faction System', function() {
    it('should set player faction', function() {
      const antMVC = AntFactory.createAnt(100, 100, { faction: 'player' });

      expect(antMVC.model.getFaction()).to.equal('player');
    });

    it('should set enemy faction', function() {
      const antMVC = AntFactory.createAnt(100, 100, { faction: 'enemy' });

      expect(antMVC.model.getFaction()).to.equal('enemy');
    });

    it('should set neutral faction', function() {
      const antMVC = AntFactory.createAnt(100, 100, { faction: 'neutral' });

      expect(antMVC.model.getFaction()).to.equal('neutral');
    });

    it('should default to player faction if not specified', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      expect(antMVC.model.getFaction()).to.equal('player');
    });

    it('should allow changing faction', function() {
      const antMVC = AntFactory.createAnt(100, 100, { faction: 'player' });

      antMVC.model.setFaction('enemy');

      expect(antMVC.model.getFaction()).to.equal('enemy');
    });
  });

  // ============================================================================
  // Job System Tests
  // ============================================================================

  describe('Job System', function() {
    it('should assign Scout job', function() {
      const antMVC = AntFactory.createAnt(100, 100, { job: 'Scout' });

      expect(antMVC.model.getJobName()).to.equal('Scout');
    });

    it('should assign Warrior job', function() {
      const antMVC = AntFactory.createAnt(100, 100, { job: 'Warrior' });

      expect(antMVC.model.getJobName()).to.equal('Warrior');
    });

    it('should assign Worker job', function() {
      const antMVC = AntFactory.createAnt(100, 100, { job: 'Worker' });

      expect(antMVC.model.getJobName()).to.equal('Worker');
    });

    it('should default to Worker if job not specified', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      expect(antMVC.model.getJobName()).to.equal('Worker');
    });

    it('should allow changing job through controller', function() {
      const antMVC = AntFactory.createAnt(100, 100, { job: 'Scout' });

      antMVC.controller.assignJob('Warrior');

      expect(antMVC.model.getJobName()).to.equal('Warrior');
    });
  });

  // ============================================================================
  // Update & Render Tests
  // ============================================================================

  describe('Update & Render', function() {
    it('should have update method on controller', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      expect(antMVC.controller.update).to.be.a('function');
      expect(() => antMVC.controller.update()).to.not.throw();
    });

    it('should have render method on view', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      expect(antMVC.view.render).to.be.a('function');
      expect(() => antMVC.view.render()).to.not.throw();
    });

    it('should update multiple times without error', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      expect(() => {
        antMVC.controller.update();
        antMVC.controller.update();
        antMVC.controller.update();
      }).to.not.throw();
    });

    it('should render multiple times without error', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      expect(() => {
        antMVC.view.render();
        antMVC.view.render();
        antMVC.view.render();
      }).to.not.throw();
    });
  });

  // ============================================================================
  // Size Tests
  // ============================================================================

  describe('Size Properties', function() {
    it('should have size getter', function() {
      const antMVC = AntFactory.createAnt(100, 100);
      const size = antMVC.model.getSize();

      expect(size).to.be.an('object');
      expect(size.x).to.be.a('number');
      expect(size.y).to.be.a('number');
    });

    it('should allow setting size', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      antMVC.model.setSize(50, 50);
      const size = antMVC.model.getSize();

      expect(size.x).to.equal(50);
      expect(size.y).to.equal(50);
    });

    it('should have default size', function() {
      const antMVC = AntFactory.createAnt(100, 100);
      const size = antMVC.model.getSize();

      expect(size.x).to.be.greaterThan(0);
      expect(size.y).to.be.greaterThan(0);
    });
  });

  // ============================================================================
  // Active State Tests
  // ============================================================================

  describe('Active State', function() {
    it('should be active by default', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      expect(antMVC.model.isActive()).to.be.true;
    });

    it('should allow deactivating', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      antMVC.model.setActive(false);

      expect(antMVC.model.isActive()).to.be.false;
    });

    it('should allow reactivating', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      antMVC.model.setActive(false);
      antMVC.model.setActive(true);

      expect(antMVC.model.isActive()).to.be.true;
    });

    it('should deactivate when health reaches 0', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      antMVC.controller.takeDamage(9999);

      expect(antMVC.model.isActive()).to.be.false;
    });
  });

  // ============================================================================
  // Model-View-Controller Separation Tests
  // ============================================================================

  describe('MVC Architecture', function() {
    it('should have separate model, view, controller instances', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      expect(antMVC.model).to.not.equal(antMVC.view);
      expect(antMVC.model).to.not.equal(antMVC.controller);
      expect(antMVC.view).to.not.equal(antMVC.controller);
    });

    it('should reference model from controller', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      expect(antMVC.controller.model).to.equal(antMVC.model);
    });

    it('should reference model from view', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      expect(antMVC.view.model).to.equal(antMVC.model);
    });

    it('should update model state through controller', function() {
      const antMVC = AntFactory.createAnt(100, 100);
      const initialHealth = antMVC.model.getHealth();

      antMVC.controller.takeDamage(10);

      expect(antMVC.model.getHealth()).to.equal(initialHealth - 10);
    });

    it('should read model state from view', function() {
      const antMVC = AntFactory.createAnt(100, 100);

      const health = antMVC.view.model.getHealth();

      expect(health).to.equal(antMVC.model.getHealth());
    });
  });
});
