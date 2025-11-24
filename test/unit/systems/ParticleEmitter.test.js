const { expect } = require('chai');
const sinon = require('sinon');

describe('ParticleEmitter - Explosion Mode', function() {
  let ParticleEmitter;
  let emitter;
  let mockP5;

  beforeEach(function() {
    // Mock p5.js globals
    global.millis = sinon.stub().returns(1000);
    global.deltaTime = 16;
    global.TWO_PI = Math.PI * 2;
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.noStroke = sinon.stub();
    global.fill = sinon.stub();
    global.ellipse = sinon.stub();

    // Load ParticleEmitter
    delete require.cache[require.resolve('../../../Classes/systems/ParticleEmitter.js')];
    ParticleEmitter = require('../../../Classes/systems/ParticleEmitter.js');
  });

  afterEach(function() {
    sinon.restore();
    delete global.millis;
    delete global.deltaTime;
    delete global.TWO_PI;
    delete global.push;
    delete global.pop;
    delete global.noStroke;
    delete global.fill;
    delete global.ellipse;
  });

  describe('Explosion Mode', function() {
    it('should create emitter with explosion mode', function() {
      emitter = new ParticleEmitter({
        x: 100,
        y: 100,
        emissionMode: 'explosion'
      });

      expect(emitter.emissionMode).to.equal('explosion');
    });

    it('should default to continuous mode', function() {
      emitter = new ParticleEmitter({
        x: 100,
        y: 100
      });

      expect(emitter.emissionMode).to.equal('continuous');
    });

    it('should emit particles with radial velocity in explosion mode', function() {
      emitter = new ParticleEmitter({
        x: 100,
        y: 100,
        emissionMode: 'explosion',
        speedRange: [5, 5], // Fixed speed for testing
        types: ['fire']
      });

      emitter.start();
      
      // Emit multiple particles
      for (let i = 0; i < 10; i++) {
        emitter.emitParticle();
      }

      expect(emitter.particles.length).to.equal(10);

      // Check that particles have non-zero velocity
      for (const particle of emitter.particles) {
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        expect(speed).to.be.greaterThan(0);
        expect(particle.vx).to.not.equal(0);
        expect(particle.vy).to.not.equal(0);
      }
    });

    it('should emit particles in different directions', function() {
      emitter = new ParticleEmitter({
        x: 100,
        y: 100,
        emissionMode: 'explosion',
        speedRange: [5, 5],
        types: ['fire']
      });

      emitter.start();
      
      // Emit 20 particles
      for (let i = 0; i < 20; i++) {
        emitter.emitParticle();
      }

      // Calculate angles
      const angles = emitter.particles.map(p => Math.atan2(p.vy, p.vx));
      
      // Check that we have varied angles (not all the same)
      const uniqueAngles = new Set(angles.map(a => a.toFixed(2)));
      expect(uniqueAngles.size).to.be.greaterThan(5); // Should have varied directions
    });

    it('should respect speedRange in explosion mode', function() {
      emitter = new ParticleEmitter({
        x: 100,
        y: 100,
        emissionMode: 'explosion',
        speedRange: [3, 10],
        types: ['fire']
      });

      emitter.start();
      
      for (let i = 0; i < 20; i++) {
        emitter.emitParticle();
      }

      // Check speeds are within range
      for (const particle of emitter.particles) {
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        expect(speed).to.be.at.least(3);
        expect(speed).to.be.at.most(10);
      }
    });

    it('should update particle positions based on velocity', function() {
      emitter = new ParticleEmitter({
        x: 100,
        y: 100,
        emissionMode: 'explosion',
        speedRange: [5, 5],
        types: ['fire'],
        gravity: 0, // No gravity for this test
        turbulence: 0 // No turbulence
      });

      emitter.start();
      emitter.emitParticle();

      const particle = emitter.particles[0];
      const initialX = particle.x;
      const initialY = particle.y;
      const vx = particle.vx;
      const vy = particle.vy;

      // Update once
      global.millis.returns(1016); // 16ms later
      emitter.update();

      // Position should have changed by velocity
      expect(particle.x).to.not.equal(initialX);
      expect(particle.y).to.not.equal(initialY);
      
      // Direction should match velocity direction
      const dx = particle.x - initialX;
      const dy = particle.y - initialY;
      
      // Check velocity direction matches position change (allowing for floating point)
      if (Math.abs(vx) > 0.1) {
        expect(Math.sign(dx)).to.equal(Math.sign(vx));
      }
      if (Math.abs(vy) > 0.1) {
        expect(Math.sign(dy)).to.equal(Math.sign(vy));
      }
    });
  });

  describe('Continuous Mode (original behavior)', function() {
    it('should emit particles upward for fire/smoke', function() {
      emitter = new ParticleEmitter({
        x: 100,
        y: 100,
        emissionMode: 'continuous',
        types: ['fire'],
        speedRange: [5, 5]
      });

      emitter.start();
      emitter.emitParticle();

      const particle = emitter.particles[0];
      expect(particle.vy).to.be.lessThan(0); // Negative Y = upward
    });

    it('should emit particles downward for rain', function() {
      emitter = new ParticleEmitter({
        x: 100,
        y: 100,
        emissionMode: 'continuous',
        types: ['rain'],
        speedRange: [5, 5]
      });

      emitter.start();
      emitter.emitParticle();

      const particle = emitter.particles[0];
      expect(particle.vy).to.be.greaterThan(0); // Positive Y = downward
    });
  });
});
