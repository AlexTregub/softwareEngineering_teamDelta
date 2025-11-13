const { expect } = require('chai');

// Mock globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });
global.dist = (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2);
global.push = () => {};
global.pop = () => {};
global.noFill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.ellipse = () => {};

// Mock ant base class
class ant {
  constructor(posX, posY, sizeX, sizeY, movementSpeed, rotation, img, jobName, faction) {
    this.posX = posX;
    this.posY = posY;
    this._size = { x: sizeX, y: sizeY };
    this.movementSpeed = movementSpeed;
    this.rotation = rotation;
    this._image = img;
    this.jobName = jobName;
    this.faction = faction;
    this.isActive = true;
    this._commands = [];
  }
  getPosition() { return { x: this.posX, y: this.posY }; }
  getSize() { return this._size; }
  getImage() { return this._image; }
  moveToLocation(x, y) { this._lastMove = { x, y }; }
  addCommand(cmd) { this._commands.push(cmd); }
  update() {}
  render() {}
}

global.ant = ant;
global.JobImages = { Builder: { src: 'test.png' } };

// Load QueenAnt - Read entire file and eval it
const fs = require('fs');
const path = require('path');
const queenPath = path.join(__dirname, '..', '..', '..', 'Classes', 'ants', 'Queen.js');
let queenCode = fs.readFileSync(queenPath, 'utf8');

// Remove any trailing whitespace/newlines that might cause issues
queenCode = queenCode.trim();

// Create QueenAnt in global scope by evaluating the code
try {
  // Use Function constructor for safer eval in this context
  const fn = new Function('ant', 'JobImages', queenCode + '\nreturn QueenAnt;');
  const QueenAnt = fn(ant, global.JobImages);
  global.QueenAnt = QueenAnt;
} catch (e) {
  console.error('Failed to load QueenAnt:', e);
  // Fallback: direct eval
  eval(queenCode);
}

describe('QueenAnt', function() {
  let queen;
  let baseAnt;

  beforeEach(function() {
    baseAnt = new ant(400, 300, 60, 60, 30, 0, { src: 'queen.png' }, 'Queen', 'player');
    queen = new QueenAnt(baseAnt);
  });

  describe('Constructor', function() {
    it('should initialize with base ant properties', function() {
      expect(queen.posX).to.equal(400);
      expect(queen.posY).to.equal(300);
      expect(queen.faction).to.equal('player');
    });

    it('should initialize with default properties when no base ant', function() {
      const q = new QueenAnt(null);
      expect(q.posX).to.equal(400); // Default position
      expect(q.posY).to.equal(300);
    });

    it('should set Queen-specific properties', function() {
      expect(queen.commandRadius).to.equal(250);
      expect(queen.ants).to.be.an('array').that.is.empty;
      expect(queen.coolDown).to.be.false;
      expect(queen.showCommandRadius).to.be.false;
    });

    it('should initialize all power unlock flags to false', function() {
      expect(queen.unlockedPowers.fireball).to.be.false;
      expect(queen.unlockedPowers.lightning).to.be.false;
      expect(queen.unlockedPowers.blackhole).to.be.false;
      expect(queen.unlockedPowers.sludge).to.be.false;
      expect(queen.unlockedPowers.tidalWave).to.be.false;
    });

    it('should inherit from ant class', function() {
      expect(queen).to.be.instanceOf(ant);
    });
  });

  describe('addAnt', function() {
    it('should add ant to ants array', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      expect(queen.ants).to.have.lengthOf(1);
      expect(queen.ants[0]).to.equal(workerAnt);
    });

    it('should set ant faction to match queen', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'neutral');
      queen.addAnt(workerAnt);
      expect(workerAnt._faction).to.equal('player');
    });

    it('should handle null ant gracefully', function() {
      expect(() => queen.addAnt(null)).to.not.throw();
      expect(queen.ants).to.have.lengthOf(0);
    });

    it('should add multiple ants', function() {
      const ant1 = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(200, 200, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      expect(queen.ants).to.have.lengthOf(2);
    });
  });

  describe('removeAnt', function() {
    it('should remove ant from ants array', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.removeAnt(workerAnt);
      expect(queen.ants).to.have.lengthOf(0);
    });

    it('should handle removing non-existent ant', function() {
      const ant1 = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(200, 200, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.removeAnt(ant2);
      expect(queen.ants).to.have.lengthOf(1);
      expect(queen.ants[0]).to.equal(ant1);
    });

    it('should remove correct ant from multiple', function() {
      const ant1 = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(200, 200, 20, 20, 30, 0, null, 'Soldier', 'player');
      const ant3 = new ant(300, 300, 20, 20, 30, 0, null, 'Scout', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      queen.addAnt(ant3);
      queen.removeAnt(ant2);
      expect(queen.ants).to.have.lengthOf(2);
      expect(queen.ants).to.include(ant1);
      expect(queen.ants).to.include(ant3);
      expect(queen.ants).to.not.include(ant2);
    });
  });

  describe('broadcastCommand', function() {
    let nearAnt, farAnt;

    beforeEach(function() {
      // Ant within command radius (250)
      nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      // Ant outside command radius
      farAnt = new ant(1000, 1000, 20, 20, 30, 0, null, 'Scout', 'player');
      queen.addAnt(nearAnt);
      queen.addAnt(farAnt);
    });

    it('should send MOVE command to ants in range', function() {
      queen.broadcastCommand({ type: 'MOVE', x: 600, y: 500 });
      expect(nearAnt._lastMove).to.deep.equal({ x: 600, y: 500 });
      expect(farAnt._lastMove).to.be.undefined;
    });

    it('should send GATHER command to ants in range', function() {
      queen.broadcastCommand({ type: 'GATHER' });
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('GATHER');
      expect(farAnt._commands).to.have.lengthOf(0);
    });

    it('should send BUILD command to ants in range', function() {
      queen.broadcastCommand({ type: 'BUILD' });
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('BUILD');
    });

    it('should send DEFEND command with target', function() {
      const target = { x: 700, y: 700 };
      queen.broadcastCommand({ type: 'DEFEND', target: target });
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].target).to.equal(target);
    });

    it('should only affect ants within command radius', function() {
      // nearAnt is ~100 units away (within 250)
      // farAnt is ~840 units away (outside 250)
      queen.broadcastCommand({ type: 'GATHER' });
      expect(nearAnt._commands.length).to.be.greaterThan(0);
      expect(farAnt._commands).to.have.lengthOf(0);
    });

    it('should handle empty ants array', function() {
      queen.ants = [];
      expect(() => queen.broadcastCommand({ type: 'MOVE', x: 100, y: 100 })).to.not.throw();
    });
  });

  describe('commandAnt', function() {
    it('should send command to specific ant in array', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.commandAnt(workerAnt, { type: 'GATHER' });
      expect(workerAnt._commands).to.have.lengthOf(1);
      expect(workerAnt._commands[0].type).to.equal('GATHER');
    });

    it('should not send command to ant not in array', function() {
      const outsideAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.commandAnt(outsideAnt, { type: 'GATHER' });
      expect(outsideAnt._commands).to.have.lengthOf(0);
    });

    it('should send multiple commands to same ant', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.commandAnt(workerAnt, { type: 'GATHER' });
      queen.commandAnt(workerAnt, { type: 'BUILD' });
      expect(workerAnt._commands).to.have.lengthOf(2);
    });
  });

  describe('gatherAntsAt', function() {
    it('should broadcast MOVE command to specified coordinates', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.gatherAntsAt(600, 500);
      expect(nearAnt._lastMove).to.deep.equal({ x: 600, y: 500 });
    });

    it('should gather multiple ants', function() {
      const ant1 = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(450, 350, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      queen.gatherAntsAt(600, 500);
      expect(ant1._lastMove).to.exist;
      expect(ant2._lastMove).to.exist;
    });
  });

  describe('orderGathering', function() {
    it('should broadcast GATHER command', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.orderGathering();
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('GATHER');
    });
  });

  describe('orderBuilding', function() {
    it('should broadcast BUILD command', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.orderBuilding();
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('BUILD');
    });
  });

  describe('emergencyRally', function() {
    it('should gather all ants to queen position', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.emergencyRally();
      expect(nearAnt._lastMove).to.deep.equal({ x: queen.posX, y: queen.posY });
    });

    it('should rally multiple ants to queen', function() {
      const ant1 = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(450, 350, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      queen.emergencyRally();
      expect(ant1._lastMove).to.deep.equal({ x: 400, y: 300 });
      expect(ant2._lastMove).to.deep.equal({ x: 400, y: 300 });
    });
  });

  describe('Power Management', function() {
    describe('unlockPower', function() {
      it('should unlock valid power', function() {
        const result = queen.unlockPower('fireball');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.fireball).to.be.true;
      });

      it('should unlock all valid powers', function() {
        const powers = ['fireball', 'lightning', 'blackhole', 'sludge', 'tidalWave'];
        powers.forEach(power => {
          expect(queen.unlockPower(power)).to.be.true;
          expect(queen.unlockedPowers[power]).to.be.true;
        });
      });

      it('should return false for invalid power', function() {
        const result = queen.unlockPower('invalidPower');
        expect(result).to.be.false;
      });

      it('should allow unlocking already unlocked power', function() {
        queen.unlockPower('fireball');
        const result = queen.unlockPower('fireball');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.fireball).to.be.true;
      });
    });

    describe('lockPower', function() {
      it('should lock unlocked power', function() {
        queen.unlockPower('lightning');
        const result = queen.lockPower('lightning');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.lightning).to.be.false;
      });

      it('should return false for invalid power', function() {
        const result = queen.lockPower('invalidPower');
        expect(result).to.be.false;
      });

      it('should allow locking already locked power', function() {
        const result = queen.lockPower('blackhole');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.blackhole).to.be.false;
      });
    });

    describe('isPowerUnlocked', function() {
      it('should return true for unlocked power', function() {
        queen.unlockPower('sludge');
        expect(queen.isPowerUnlocked('sludge')).to.be.true;
      });

      it('should return false for locked power', function() {
        expect(queen.isPowerUnlocked('tidalWave')).to.be.false;
      });

      it('should return false for invalid power', function() {
        // isPowerUnlocked returns false for invalid/non-existent powers
        expect(queen.isPowerUnlocked('invalid')).to.be.false;
      });
    });

    describe('getUnlockedPowers', function() {
      it('should return empty array when no powers unlocked', function() {
        expect(queen.getUnlockedPowers()).to.be.an('array').that.is.empty;
      });

      it('should return array of unlocked powers', function() {
        queen.unlockPower('fireball');
        queen.unlockPower('lightning');
        const unlocked = queen.getUnlockedPowers();
        expect(unlocked).to.have.lengthOf(2);
        expect(unlocked).to.include('fireball');
        expect(unlocked).to.include('lightning');
      });

      it('should not include locked powers', function() {
        queen.unlockPower('fireball');
        queen.unlockPower('lightning');
        queen.lockPower('lightning');
        const unlocked = queen.getUnlockedPowers();
        expect(unlocked).to.have.lengthOf(1);
        expect(unlocked).to.include('fireball');
        expect(unlocked).to.not.include('lightning');
      });
    });

    describe('getAllPowers', function() {
      it('should return all power states', function() {
        queen.unlockPower('fireball');
        const allPowers = queen.getAllPowers();
        expect(allPowers).to.have.property('fireball', true);
        expect(allPowers).to.have.property('lightning', false);
        expect(allPowers).to.have.property('blackhole', false);
        expect(allPowers).to.have.property('sludge', false);
        expect(allPowers).to.have.property('tidalWave', false);
      });

      it('should return copy of powers object', function() {
        const powers = queen.getAllPowers();
        powers.fireball = true;
        expect(queen.unlockedPowers.fireball).to.be.false; // Original unchanged
      });
    });
  });

  describe('move', function() {
    it('should move up (w) with slower speed', function() {
      const startY = queen.posY;
      queen.move('w');
      expect(queen._lastMove.y).to.be.greaterThan(startY);
    });

    it('should move left (a)', function() {
      const startX = queen.posX;
      queen.move('a');
      expect(queen._lastMove.x).to.be.lessThan(startX);
    });

    it('should move down (s)', function() {
      const startY = queen.posY;
      queen.move('s');
      expect(queen._lastMove.y).to.be.lessThan(startY);
    });

    it('should move right (d)', function() {
      const startX = queen.posX;
      queen.move('d');
      expect(queen._lastMove.x).to.be.greaterThan(startX);
    });

    it('should move slower than normal ant (0.1x speed)', function() {
      queen.movementSpeed = 100;
      queen.move('d');
      const deltaX = queen._lastMove.x - queen.posX;
      expect(deltaX).to.equal(10); // 100 * 0.1
    });

    it('should handle invalid direction gracefully', function() {
      expect(() => queen.move('x')).to.not.throw();
    });
  });

  describe('update', function() {
    it('should call super.update', function() {
      let superCalled = false;
      const originalUpdate = ant.prototype.update;
      ant.prototype.update = function() { superCalled = true; };
      queen.update();
      expect(superCalled).to.be.true;
      ant.prototype.update = originalUpdate;
    });

    it('should not throw errors', function() {
      expect(() => queen.update()).to.not.throw();
    });
  });

  describe('render', function() {
    it('should call super.render', function() {
      let superCalled = false;
      const originalRender = ant.prototype.render;
      ant.prototype.render = function() { superCalled = true; };
      queen.render();
      expect(superCalled).to.be.true;
      ant.prototype.render = originalRender;
    });

    it('should not render command radius when showCommandRadius is false', function() {
      queen.showCommandRadius = false;
      let ellipseCalled = false;
      global.ellipse = () => { ellipseCalled = true; };
      queen.render();
      expect(ellipseCalled).to.be.false;
    });

    it('should render command radius when showCommandRadius is true', function() {
      queen.showCommandRadius = true;
      let ellipseCalled = false;
      global.ellipse = (x, y, d) => { 
        ellipseCalled = true;
        expect(d).to.equal(queen.commandRadius * 2);
      };
      queen.render();
      expect(ellipseCalled).to.be.true;
    });
  });

  describe('Edge Cases', function() {
    it('should handle very large commandRadius', function() {
      queen.commandRadius = 100000; // Very large radius
      const farAnt = new ant(9000, 9000, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(farAnt);
      queen.broadcastCommand({ type: 'GATHER' });
      // Distance from (400, 300) to (9000, 9000) is ~12200, so radius must be > 12200
      expect(farAnt._commands).to.have.lengthOf(1);
    });

    it('should handle zero commandRadius', function() {
      queen.commandRadius = 0;
      const nearAnt = new ant(400, 300, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.broadcastCommand({ type: 'GATHER' });
      // Only ant at exact same position would receive command
    });

    it('should handle negative commandRadius', function() {
      queen.commandRadius = -100;
      const nearAnt = new ant(400, 300, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.broadcastCommand({ type: 'GATHER' });
      // No ants should receive command with negative radius
      expect(nearAnt._commands).to.have.lengthOf(0);
    });

    it('should handle adding same ant multiple times', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.addAnt(workerAnt);
      expect(queen.ants).to.have.lengthOf(2);
      expect(queen.ants[0]).to.equal(queen.ants[1]);
    });

    it('should handle unlocking all powers then locking all', function() {
      const powers = ['fireball', 'lightning', 'blackhole', 'sludge', 'tidalWave'];
      powers.forEach(p => queen.unlockPower(p));
      expect(queen.getUnlockedPowers()).to.have.lengthOf(5);
      
      powers.forEach(p => queen.lockPower(p));
      expect(queen.getUnlockedPowers()).to.have.lengthOf(0);
    });
  });
});
