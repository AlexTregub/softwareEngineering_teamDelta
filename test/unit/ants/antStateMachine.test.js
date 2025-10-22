/* eslint-env mocha */
const { expect } = require('chai');
const AntStateMachine = require('../../Classes/ants/antStateMachine');

describe('AntStateMachine', () => {
  let sm;

  beforeEach(() => {
    sm = new AntStateMachine();
  });

  it('initializes with correct defaults', () => {
    expect(sm.primaryState).to.equal('IDLE');
    expect(sm.combatModifier).to.equal('OUT_OF_COMBAT');
    expect(sm.terrainModifier).to.equal('DEFAULT');
    expect(sm.preferredState).to.equal('GATHERING');
  });

  it('validates primary/combat/terrain lists', () => {
    expect(sm.isValidPrimary('MOVING')).to.be.true;
    expect(sm.isValidPrimary('NOPE')).to.be.false;
    expect(sm.isValidCombat('IN_COMBAT')).to.be.true;
    expect(sm.isValidCombat(null)).to.be.true;
    expect(sm.isValidCombat('FAKE')).to.be.false;
    expect(sm.isValidTerrain('IN_WATER')).to.be.true;
    expect(sm.isValidTerrain(null)).to.be.true;
    expect(sm.isValidTerrain('BAD')).to.be.false;
  });

  it('setPrimaryState accepts valid and rejects invalid', () => {
    const ok = sm.setPrimaryState('MOVING');
    expect(ok).to.be.true;
    expect(sm.primaryState).to.equal('MOVING');

    const bad = sm.setPrimaryState('FLYING');
    expect(bad).to.be.false;
    expect(sm.primaryState).to.equal('MOVING');
  });

  it('setCombatModifier and setTerrainModifier handle null and valid values', () => {
    expect(sm.setCombatModifier('IN_COMBAT')).to.be.true;
    expect(sm.combatModifier).to.equal('IN_COMBAT');

    expect(sm.setCombatModifier(null)).to.be.true;
    expect(sm.combatModifier).to.equal(null);

    expect(sm.setTerrainModifier('IN_WATER')).to.be.true;
    expect(sm.terrainModifier).to.equal('IN_WATER');

    expect(sm.setTerrainModifier(null)).to.be.true;
    expect(sm.terrainModifier).to.equal(null);
  });

  it('setState sets combinations and rejects invalid combos', () => {
    // valid
    expect(sm.setState('GATHERING', 'IN_COMBAT', 'IN_MUD')).to.be.true;
    expect(sm.getFullState()).to.equal('GATHERING_IN_COMBAT_IN_MUD');

    // invalid primary
    expect(sm.setState('FLAP', null, null)).to.be.false;

    // invalid combat
    expect(sm.setState('IDLE', 'BAD', null)).to.be.false;

    // invalid terrain
    expect(sm.setState('IDLE', null, 'BAD')).to.be.false;
  });

  it('getFullState and getCurrentState return expected strings', () => {
    sm.setState('MOVING', 'IN_COMBAT', 'ON_ROUGH');
    expect(sm.getFullState()).to.equal('MOVING_IN_COMBAT_ON_ROUGH');
    expect(sm.getCurrentState()).to.equal('MOVING');
  });

  it('canPerformAction covers branches correctly', () => {
    // default: IDLE, OUT_OF_COMBAT, DEFAULT
    expect(sm.canPerformAction('move')).to.be.true;
    expect(sm.canPerformAction('gather')).to.be.true;
    expect(sm.canPerformAction('attack')).to.be.false;

    sm.setCombatModifier('IN_COMBAT');
    expect(sm.canPerformAction('attack')).to.be.true;

    sm.setPrimaryState('BUILDING');
    expect(sm.canPerformAction('move')).to.be.false;
    expect(sm.canPerformAction('gather')).to.be.false;

    sm.setState('IDLE', 'OUT_OF_COMBAT', null);
    sm.setTerrainModifier('ON_SLIPPERY');
    expect(sm.canPerformAction('move')).to.be.false; // slippery blocks move
  });

  it('state query helpers return expected booleans', () => {
    sm.reset();
    expect(sm.isIdle()).to.be.true;
    expect(sm.isOutOfCombat()).to.be.true;
    expect(sm.isOnDefaultTerrain()).to.be.true;

    sm.setState('MOVING', 'IN_COMBAT', 'IN_MUD');
    expect(sm.isMoving()).to.be.true;
    expect(sm.isInCombat()).to.be.true;
    expect(sm.isInMud()).to.be.true;
  });

  it('clearModifiers and reset behave correctly and invoke callback', (done) => {
    let calls = 0;
    sm.setStateChangeCallback((oldS, newS) => { calls++; });
    sm.setState('GATHERING', 'IN_COMBAT', 'IN_WATER');
    expect(sm.getFullState()).to.equal('GATHERING_IN_COMBAT_IN_WATER');

    sm.clearModifiers();
    expect(sm.combatModifier).to.equal(null);
    expect(sm.terrainModifier).to.equal(null);

    sm.reset();
    expect(sm.primaryState).to.equal('IDLE');
    expect(sm.combatModifier).to.equal('OUT_OF_COMBAT');
    expect(sm.terrainModifier).to.equal('DEFAULT');

    // callback should have been called at least once (setState, clearModifiers, reset)
    expect(calls).to.be.at.least(1);
    done();
  });

  it('setPreferredState and ResumePreferredState work', () => {
    sm.setPreferredState('MOVING');
    sm.beginIdle();
    sm.ResumePreferredState();
    expect(sm.primaryState).to.equal('MOVING');
  });

  it('isValidAnyState and isInState utilities', () => {
    expect(sm.isValidAnyState('MOVING')).to.be.true;
    expect(sm.isValidAnyState('IN_COMBAT')).to.be.true;
    expect(sm.isValidAnyState('IN_WATER')).to.be.true;
    expect(sm.isValidAnyState('NOPE')).to.be.false;

    sm.setState('GATHERING', 'IN_COMBAT', 'IN_WATER');
    expect(sm.isInState('GATHERING_IN_COMBAT_IN_WATER')).to.be.true;
  });

  it('printState uses devConsoleEnabled global (no throw)', () => {
    // ensure printState does not throw if devConsoleEnabled undefined/false
    global.devConsoleEnabled = false;
    expect(() => sm.printState()).to.not.throw();
    global.devConsoleEnabled = true;
    expect(() => sm.printState()).to.not.throw();
  });

  it('getStateSummary contains expected structure', () => {
    sm.setState('GATHERING', null, null);
    const summary = sm.getStateSummary();
    expect(summary).to.include.keys('fullState', 'primary', 'combat', 'terrain', 'actions');
    expect(summary.primary).to.equal('GATHERING');
  });

  it('update is a no-op and does not throw', () => {
    expect(() => sm.update()).to.not.throw();
  });
});
