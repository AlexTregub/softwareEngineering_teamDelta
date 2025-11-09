const { expect } = require('chai');
const sinon = require('sinon');

// Mock p5.js functions
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });
global.push = sinon.stub();
global.pop = sinon.stub();
global.noFill = sinon.stub();
global.stroke = sinon.stub();
global.strokeWeight = sinon.stub();
global.ellipse = sinon.stub();
global.translate = sinon.stub();
global.rotate = sinon.stub();
global.tint = sinon.stub();
global.image = sinon.stub();
global.rect = sinon.stub();

// Mock cameraManager
global.cameraManager = {
  worldToScreen: (x, y) => ({ x, y })
};

// Mock console.log
global.console.log = sinon.stub();

// Load MVC components
const AntModel = require('../../../Classes/baseMVC/models/AntModel');
const AntView = require('../../../Classes/baseMVC/views/AntView');
const AntController = require('../../../Classes/baseMVC/controllers/AntController');
const QueenController = require('../../../Classes/baseMVC/controllers/QueenController');

describe('QueenController', function() {
  let model, view, controller;

  beforeEach(function() {
    // Create queen MVC components
    model = new AntModel(400, 300, 60, 60, { 
      jobName: 'Queen',
      faction: 'player'
    });
    view = new AntView(model);
    controller = new QueenController(model, view);
    
    // Reset sinon stubs
    sinon.reset();
    if (global.console.log.reset) global.console.log.reset();
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Constructor', function() {
    it('should extend AntController', function() {
      expect(controller).to.be.instanceOf(AntController);
    });

    it('should initialize with default command radius', function() {
      expect(controller.commandRadius).to.equal(250);
    });

    it('should initialize empty ants array', function() {
      expect(controller.ants).to.be.an('array').that.is.empty;
    });

    it('should initialize coolDown to false', function() {
      expect(controller.coolDown).to.be.false;
    });

    it('should initialize showCommandRadius to false', function() {
      expect(controller.showCommandRadius).to.be.false;
    });

    it('should initialize all powers as locked', function() {
      expect(controller.unlockedPowers.fireball).to.be.false;
      expect(controller.unlockedPowers.lightning).to.be.false;
      expect(controller.unlockedPowers.blackhole).to.be.false;
      expect(controller.unlockedPowers.sludge).to.be.false;
      expect(controller.unlockedPowers.tidalWave).to.be.false;
      expect(controller.unlockedPowers.finalFlash).to.be.false;
    });

    it('should have access to model and view', function() {
      // Access via getters since _model/_view are private
      expect(controller._model).to.exist;
      expect(controller._view).to.exist;
    });
  });

  describe('Ant Management', function() {
    let workerAnt1, workerAnt2;

    beforeEach(function() {
      // Create worker ants (MVC objects)
      const worker1Model = new AntModel(100, 100, 32, 32, { jobName: 'Scout', faction: 'neutral' });
      const worker1View = new AntView(worker1Model);
      const worker1Controller = new AntController(worker1Model, worker1View);
      workerAnt1 = { model: worker1Model, view: worker1View, controller: worker1Controller };

      const worker2Model = new AntModel(200, 200, 32, 32, { jobName: 'Farmer', faction: 'neutral' });
      const worker2View = new AntView(worker2Model);
      const worker2Controller = new AntController(worker2Model, worker2View);
      workerAnt2 = { model: worker2Model, view: worker2View, controller: worker2Controller };
    });

    describe('addAnt', function() {
      it('should add ant to ants array', function() {
        controller.addAnt(workerAnt1);
        expect(controller.ants).to.have.lengthOf(1);
        expect(controller.ants[0]).to.equal(workerAnt1);
      });

      it('should set ant faction to match queen', function() {
        controller.addAnt(workerAnt1);
        expect(workerAnt1.model.getFaction()).to.equal('player');
      });

      it('should handle null ant gracefully', function() {
        expect(() => controller.addAnt(null)).to.not.throw();
        expect(controller.ants).to.have.lengthOf(0);
      });

      it('should add multiple ants', function() {
        controller.addAnt(workerAnt1);
        controller.addAnt(workerAnt2);
        expect(controller.ants).to.have.lengthOf(2);
      });

      it('should handle ant without model gracefully', function() {
        const badAnt = { view: {}, controller: {} };
        expect(() => controller.addAnt(badAnt)).to.not.throw();
        expect(controller.ants).to.have.lengthOf(1);
      });
    });

    describe('removeAnt', function() {
      it('should remove ant from ants array', function() {
        controller.addAnt(workerAnt1);
        controller.removeAnt(workerAnt1);
        expect(controller.ants).to.have.lengthOf(0);
      });

      it('should handle removing non-existent ant', function() {
        controller.addAnt(workerAnt1);
        controller.removeAnt(workerAnt2);
        expect(controller.ants).to.have.lengthOf(1);
        expect(controller.ants[0]).to.equal(workerAnt1);
      });

      it('should remove correct ant from multiple', function() {
        controller.addAnt(workerAnt1);
        controller.addAnt(workerAnt2);
        controller.removeAnt(workerAnt1);
        expect(controller.ants).to.have.lengthOf(1);
        expect(controller.ants[0]).to.equal(workerAnt2);
      });
    });
  });

  describe('Commands', function() {
    let workerAnt1, workerAnt2;

    beforeEach(function() {
      // Create worker ants within command radius
      const worker1Model = new AntModel(450, 350, 32, 32, { jobName: 'Scout', faction: 'player' });
      const worker1View = new AntView(worker1Model);
      const worker1Controller = new AntController(worker1Model, worker1View);
      worker1Controller.moveToLocation = sinon.stub();
      worker1Controller.addCommand = sinon.stub();
      workerAnt1 = { model: worker1Model, view: worker1View, controller: worker1Controller };

      // Worker 2 outside command radius
      const worker2Model = new AntModel(1000, 1000, 32, 32, { jobName: 'Farmer', faction: 'player' });
      const worker2View = new AntView(worker2Model);
      const worker2Controller = new AntController(worker2Model, worker2View);
      worker2Controller.moveToLocation = sinon.stub();
      worker2Controller.addCommand = sinon.stub();
      workerAnt2 = { model: worker2Model, view: worker2View, controller: worker2Controller };

      controller.addAnt(workerAnt1);
      controller.addAnt(workerAnt2);
    });

    describe('broadcastCommand', function() {
      it('should send MOVE command to ants within radius', function() {
        controller.broadcastCommand({ type: 'MOVE', x: 500, y: 400 });
        
        expect(workerAnt1.controller.moveToLocation.calledOnce).to.be.true;
        expect(workerAnt1.controller.moveToLocation.calledWith(500, 400)).to.be.true;
        expect(workerAnt2.controller.moveToLocation.called).to.be.false; // Outside radius
      });

      it('should send GATHER command to ants within radius', function() {
        controller.broadcastCommand({ type: 'GATHER' });
        
        expect(workerAnt1.controller.addCommand.calledOnce).to.be.true;
        expect(workerAnt1.controller.addCommand.calledWith({ type: 'GATHER' })).to.be.true;
        expect(workerAnt2.controller.addCommand.called).to.be.false; // Outside radius
      });

      it('should send BUILD command to ants within radius', function() {
        controller.broadcastCommand({ type: 'BUILD' });
        
        expect(workerAnt1.controller.addCommand.calledOnce).to.be.true;
        expect(workerAnt1.controller.addCommand.calledWith({ type: 'BUILD' })).to.be.true;
      });

      it('should send DEFEND command to ants within radius', function() {
        const target = { x: 600, y: 600 };
        controller.broadcastCommand({ type: 'DEFEND', target });
        
        expect(workerAnt1.controller.addCommand.calledOnce).to.be.true;
        expect(workerAnt1.controller.addCommand.calledWith({ type: 'DEFEND', target })).to.be.true;
      });

      it('should handle ants without controller gracefully', function() {
        const badAnt = { model: new AntModel(420, 320, 32, 32) };
        controller.ants.push(badAnt);
        
        expect(() => controller.broadcastCommand({ type: 'MOVE', x: 500, y: 400 })).to.not.throw();
      });

      it('should respect command radius boundary', function() {
        // Worker 1 is ~70 units away (within 250 radius)
        // Worker 2 is ~850 units away (outside 250 radius)
        controller.broadcastCommand({ type: 'GATHER' });
        
        expect(workerAnt1.controller.addCommand.called).to.be.true;
        expect(workerAnt2.controller.addCommand.called).to.be.false;
      });
    });

    describe('commandAnt', function() {
      it('should send command to specific ant', function() {
        controller.commandAnt(workerAnt1, { type: 'GATHER' });
        
        expect(workerAnt1.controller.addCommand.calledOnce).to.be.true;
        expect(workerAnt1.controller.addCommand.calledWith({ type: 'GATHER' })).to.be.true;
      });

      it('should not send command to ant not under control', function() {
        const outsideAnt = { 
          model: new AntModel(800, 800, 32, 32),
          controller: { addCommand: sinon.stub() }
        };
        
        controller.commandAnt(outsideAnt, { type: 'GATHER' });
        
        expect(outsideAnt.controller.addCommand.called).to.be.false;
      });
    });

    describe('gatherAntsAt', function() {
      it('should broadcast MOVE command to position', function() {
        controller.gatherAntsAt(500, 400);
        
        expect(workerAnt1.controller.moveToLocation.calledOnce).to.be.true;
        expect(workerAnt1.controller.moveToLocation.calledWith(500, 400)).to.be.true;
      });
    });

    describe('orderGathering', function() {
      it('should broadcast GATHER command', function() {
        controller.orderGathering();
        
        expect(workerAnt1.controller.addCommand.calledOnce).to.be.true;
        expect(workerAnt1.controller.addCommand.calledWith({ type: 'GATHER' })).to.be.true;
      });
    });

    describe('orderBuilding', function() {
      it('should broadcast BUILD command', function() {
        controller.orderBuilding();
        
        expect(workerAnt1.controller.addCommand.calledOnce).to.be.true;
        expect(workerAnt1.controller.addCommand.calledWith({ type: 'BUILD' })).to.be.true;
      });
    });

    describe('emergencyRally', function() {
      it('should rally ants to queen position', function() {
        controller.emergencyRally();
        
        expect(workerAnt1.controller.moveToLocation.calledOnce).to.be.true;
        expect(workerAnt1.controller.moveToLocation.calledWith(400, 300)).to.be.true;
      });
    });
  });

  describe('Power Management', function() {
    describe('unlockPower', function() {
      it('should unlock fireball power', function() {
        const result = controller.unlockPower('fireball');
        
        expect(result).to.be.true;
        expect(controller.unlockedPowers.fireball).to.be.true;
      });

      it('should unlock lightning power', function() {
        const result = controller.unlockPower('lightning');
        
        expect(result).to.be.true;
        expect(controller.unlockedPowers.lightning).to.be.true;
      });

      it('should log when power is unlocked', function() {
        controller.unlockPower('lightning');
        
        expect(global.console.log.calledOnce).to.be.true;
        expect(global.console.log.args[0][0]).to.include('lightning');
      });

      it('should reject invalid power', function() {
        const consoleWarn = sinon.stub(console, 'warn');
        const result = controller.unlockPower('invalidPower');
        
        expect(result).to.be.false;
        expect(consoleWarn.calledOnce).to.be.true;
        
        consoleWarn.restore();
      });

      it('should unlock multiple powers', function() {
        controller.unlockPower('fireball');
        controller.unlockPower('lightning');
        controller.unlockPower('blackhole');
        
        expect(controller.unlockedPowers.fireball).to.be.true;
        expect(controller.unlockedPowers.lightning).to.be.true;
        expect(controller.unlockedPowers.blackhole).to.be.true;
      });
    });

    describe('lockPower', function() {
      it('should lock previously unlocked power', function() {
        controller.unlockPower('fireball');
        const result = controller.lockPower('fireball');
        
        expect(result).to.be.true;
        expect(controller.unlockedPowers.fireball).to.be.false;
      });

      it('should return false for invalid power', function() {
        const result = controller.lockPower('invalidPower');
        expect(result).to.be.false;
      });
    });

    describe('isPowerUnlocked', function() {
      it('should return true for unlocked power', function() {
        controller.unlockPower('sludge');
        expect(controller.isPowerUnlocked('sludge')).to.be.true;
      });

      it('should return false for locked power', function() {
        expect(controller.isPowerUnlocked('tidalWave')).to.be.false;
      });
    });

    describe('getUnlockedPowers', function() {
      it('should return empty array when no powers unlocked', function() {
        const powers = controller.getUnlockedPowers();
        expect(powers).to.be.an('array').that.is.empty;
      });

      it('should return array of unlocked powers', function() {
        controller.unlockPower('fireball');
        controller.unlockPower('lightning');
        
        const powers = controller.getUnlockedPowers();
        expect(powers).to.have.lengthOf(2);
        expect(powers).to.include('fireball');
        expect(powers).to.include('lightning');
      });
    });

    describe('getAllPowers', function() {
      it('should return copy of all power states', function() {
        controller.unlockPower('blackhole');
        
        const powers = controller.getAllPowers();
        expect(powers.blackhole).to.be.true;
        expect(powers.fireball).to.be.false;
        expect(powers).to.have.property('lightning');
      });

      it('should return a copy, not reference', function() {
        const powers = controller.getAllPowers();
        powers.fireball = true;
        
        expect(controller.unlockedPowers.fireball).to.be.false;
      });
    });
    
    describe('Lightning Power Specific', function() {
      it('should unlock lightning independently', function() {
        expect(controller.isPowerUnlocked('lightning')).to.be.false;
        
        const result = controller.unlockPower('lightning');
        
        expect(result).to.be.true;
        expect(controller.isPowerUnlocked('lightning')).to.be.true;
      });
      
      it('should lock lightning power', function() {
        controller.unlockPower('lightning');
        expect(controller.isPowerUnlocked('lightning')).to.be.true;
        
        const result = controller.lockPower('lightning');
        
        expect(result).to.be.true;
        expect(controller.isPowerUnlocked('lightning')).to.be.false;
      });
      
      it('should include lightning in unlocked powers list', function() {
        controller.unlockPower('fireball');
        controller.unlockPower('lightning');
        controller.unlockPower('blackhole');
        
        const unlocked = controller.getUnlockedPowers();
        
        expect(unlocked).to.include('lightning');
        expect(unlocked).to.have.lengthOf(3);
      });
      
      it('should toggle lightning independently of other powers', function() {
        controller.unlockPower('fireball');
        controller.unlockPower('lightning');
        
        expect(controller.isPowerUnlocked('fireball')).to.be.true;
        expect(controller.isPowerUnlocked('lightning')).to.be.true;
        
        controller.lockPower('lightning');
        
        expect(controller.isPowerUnlocked('fireball')).to.be.true;
        expect(controller.isPowerUnlocked('lightning')).to.be.false;
      });
      
      it('should verify lightning in all powers state', function() {
        controller.unlockPower('lightning');
        
        const allPowers = controller.getAllPowers();
        
        expect(allPowers).to.have.property('lightning');
        expect(allPowers.lightning).to.be.true;
      });
    });
  });

  describe('WASD Movement', function() {
    beforeEach(function() {
      // Mock moveToLocation
      sinon.stub(controller, 'moveToLocation');
    });

    it('should move up with W key', function() {
      controller.move('w');
      
      expect(controller.moveToLocation.calledOnce).to.be.true;
      expect(controller.moveToLocation.args[0][0]).to.equal(400); // x unchanged
      expect(controller.moveToLocation.args[0][1]).to.equal(300.1); // y + 0.1
    });

    it('should move left with A key', function() {
      controller.move('a');
      
      expect(controller.moveToLocation.calledOnce).to.be.true;
      expect(controller.moveToLocation.args[0][0]).to.equal(399.9); // x - 0.1
      expect(controller.moveToLocation.args[0][1]).to.equal(300); // y unchanged
    });

    it('should move down with S key', function() {
      controller.move('s');
      
      expect(controller.moveToLocation.calledOnce).to.be.true;
      expect(controller.moveToLocation.args[0][0]).to.equal(400); // x unchanged
      expect(controller.moveToLocation.args[0][1]).to.equal(299.9); // y - 0.1
    });

    it('should move right with D key', function() {
      controller.move('d');
      
      expect(controller.moveToLocation.calledOnce).to.be.true;
      expect(controller.moveToLocation.args[0][0]).to.equal(400.1); // x + 0.1
      expect(controller.moveToLocation.args[0][1]).to.equal(300); // y unchanged
    });

    it('should handle invalid direction', function() {
      controller.move('x');
      
      expect(controller.moveToLocation.called).to.be.false;
    });

    it('should use slow queen speed', function() {
      // Queen moves at 0.1 speed (slow)
      controller.move('d');
      
      const deltaX = controller.moveToLocation.args[0][0] - 400;
      expect(deltaX).to.be.closeTo(0.1, 0.01);
    });
  });

  describe('Update & Render', function() {
    it('should call parent update', function() {
      const superUpdate = sinon.stub(AntController.prototype, 'update');
      
      controller.update();
      
      expect(superUpdate.calledOnce).to.be.true;
      superUpdate.restore();
    });

    it('should call parent render', function() {
      const superRender = sinon.stub(AntController.prototype, 'render');
      
      controller.render();
      
      expect(superRender.calledOnce).to.be.true;
      superRender.restore();
    });

    it('should render command radius when visible', function() {
      controller.showCommandRadius = true;
      controller.render();
      
      expect(global.push.called).to.be.true;
      expect(global.noFill.called).to.be.true;
      expect(global.stroke.called).to.be.true;
      expect(global.ellipse.called).to.be.true;
      expect(global.pop.called).to.be.true;
    });

    it('should not render command radius when hidden', function() {
      controller.showCommandRadius = false;
      
      const superRender = sinon.stub(AntController.prototype, 'render');
      controller.render();
      
      expect(global.ellipse.called).to.be.false;
      superRender.restore();
    });

    it('should use correct command radius size', function() {
      controller.showCommandRadius = true;
      controller.render();
      
      // ellipse called with (x, y, diameter)
      const ellipseCall = global.ellipse.getCall(0);
      expect(ellipseCall.args[2]).to.equal(500); // commandRadius * 2
    });
  });

  describe('Debug Info', function() {
    it('should include base ant debug info', function() {
      const debugInfo = controller.getDebugInfo();
      
      expect(debugInfo).to.have.property('type');
      expect(debugInfo).to.have.property('commandRadius');
    });

    it('should include queen-specific info', function() {
      controller.unlockPower('fireball');
      controller.unlockPower('lightning');
      const workerModel = new AntModel(450, 350, 32, 32);
      controller.addAnt({ model: workerModel, view: {}, controller: {} });
      
      const debugInfo = controller.getDebugInfo();
      
      expect(debugInfo.type).to.equal('Queen');
      expect(debugInfo.commandRadius).to.equal(250);
      expect(debugInfo.antsUnderCommand).to.equal(1);
      expect(debugInfo.unlockedPowers).to.include('fireball');
      expect(debugInfo.unlockedPowers).to.include('lightning');
      expect(debugInfo.showCommandRadius).to.be.false;
    });
  });
});
