// faction-integration.test.js
// Comprehensive tests for faction-state machine integration

// Import dependencies
const { Faction, FactionRegistry, RELATIONSHIP_STATES, createFaction } = require('../Classes/ants/faction.js');
const AntStateMachine = require('../Classes/ants/antStateMachine.js');

// Mock ant class for testing
class MockAnt {
  constructor(faction = null) {
    this.faction = faction;
    this.stateMachine = new AntStateMachine(this);
    this.posX = 0;
    this.posY = 0;
  }

  onFactionRelationshipChange(factionName, oldState, newState, reason) {
    console.log(`Ant notified: ${factionName} relationship changed from ${oldState.name} to ${newState.name} (${reason})`);
  }
}

describe('Faction System Integration Tests', () => {
  let redFaction, blueFaction, greenFaction;
  let redAnt, blueAnt, greenAnt;

  beforeEach(() => {
    // Create factions
    redFaction = createFaction("Red", "#FF0000");
    blueFaction = createFaction("Blue", "#0000FF");
    greenFaction = createFaction("Green", "#00FF00");

    // Create ants
    redAnt = new MockAnt(redFaction);
    blueAnt = new MockAnt(blueFaction);
    greenAnt = new MockAnt(greenFaction);
  });

  describe('Basic Faction Functionality', () => {
    test('should create factions with correct properties', () => {
      expect(redFaction.name).toBe("Red");
      expect(redFaction.color).toBe("#FF0000");
      expect(redFaction.getAntCount()).toBe(1);
      expect(redFaction.getKnownFactionCount()).toBe(0);
    });

    test('should handle ant assignment correctly', () => {
      const newAnt = new MockAnt();
      expect(newAnt.faction).toBeNull();
      
      newAnt.faction = redFaction;
      expect(newAnt.faction).toBe(redFaction);
      expect(redFaction.getAntCount()).toBe(2);
    });

    test('should handle faction encounters', () => {
      redFaction.encounterFaction(blueFaction);
      
      expect(redFaction.getKnownFactionCount()).toBe(1);
      expect(redFaction.getRelationshipValue("Blue")).toBe(50); // Neutral
      expect(redFaction.getRelationshipState("Blue").name).toBe("NEUTRAL");
    });
  });

  describe('Relationship State Logic', () => {
    test('should return correct relationship states', () => {
      redFaction.relationships.set("Blue", 90);
      expect(redFaction.getRelationshipState("Blue").name).toBe("ALLIED");

      redFaction.relationships.set("Green", 10);
      expect(redFaction.getRelationshipState("Green").name).toBe("ENEMIES");

      redFaction.relationships.set("Yellow", 0);
      expect(redFaction.getRelationshipState("Yellow").name).toBe("BLOOD_ENEMIES");
    });

    test('should modify relationships correctly', () => {
      redFaction.encounterFaction(blueFaction);
      
      redFaction.modifyRelationship("Blue", 30, "Trade agreement");
      expect(redFaction.getRelationshipValue("Blue")).toBe(80);
      expect(redFaction.getRelationshipState("Blue").name).toBe("ALLIED");

      redFaction.modifyRelationship("Blue", -60, "Combat");
      expect(redFaction.getRelationshipValue("Blue")).toBe(20);
      expect(redFaction.getRelationshipState("Blue").name).toBe("NEUTRAL");
    });

    test('should not allow blood enemies to improve relations', () => {
      redFaction.relationships.set("Blue", 0);
      redFaction.modifyRelationship("Blue", 50, "Peace attempt");
      
      expect(redFaction.getRelationshipValue("Blue")).toBe(0);
      expect(redFaction.getRelationshipState("Blue").name).toBe("BLOOD_ENEMIES");
    });
  });

  describe('State Machine Integration', () => {
    test('should pass ant reference to state machine', () => {
      expect(redAnt.stateMachine._ant).toBe(redAnt);
    });

    test('should check faction permissions for actions', () => {
      // Set up hostile relationship
      redFaction.relationships.set("Blue", 10); // Enemies
      
      // Red ant should be able to attack blue ant
      expect(redAnt.stateMachine.canPerformAction("attack", blueAnt)).toBe(true);
      
      // Red ant should not be able to socialize with blue ant
      expect(redAnt.stateMachine.canPerformAction("socialize", blueAnt)).toBe(false);
    });

    test('should allow allied actions', () => {
      // Set up allied relationship
      redFaction.relationships.set("Blue", 90); // Allied
      
      // Red ant should not be able to attack blue ant
      expect(redAnt.stateMachine.canPerformAction("attack", blueAnt)).toBe(false);
      
      // Red ant should be able to socialize and trade with blue ant
      expect(redAnt.stateMachine.canPerformAction("socialize", blueAnt)).toBe(true);
      expect(redAnt.stateMachine.canPerformAction("trade", blueAnt)).toBe(true);
      expect(redAnt.stateMachine.canPerformAction("follow", blueAnt)).toBe(true);
    });

    test('should handle neutral relationships', () => {
      // Set up neutral relationship
      redFaction.relationships.set("Blue", 50); // Neutral
      
      // Red ant should not be able to attack blue ant
      expect(redAnt.stateMachine.canPerformAction("attack", blueAnt)).toBe(false);
      
      // Red ant should be able to socialize and trade with blue ant
      expect(redAnt.stateMachine.canPerformAction("socialize", blueAnt)).toBe(true);
      expect(redAnt.stateMachine.canPerformAction("trade", blueAnt)).toBe(true);
      
      // Red ant should not be able to follow blue ant (only allies)
      expect(redAnt.stateMachine.canPerformAction("follow", blueAnt)).toBe(false);
    });
  });

  describe('Automatic Faction Behaviors', () => {
    test('should trigger auto-attack for enemies on sight', () => {
      // Set up enemy relationship with attackOnSight
      redFaction.relationships.set("Blue", 10); // Enemies
      const relationship = redFaction.getRelationshipState("Blue");
      expect(relationship.attackOnSight).toBe(true);
      
      // Red ant should be out of combat initially
      expect(redAnt.stateMachine.isOutOfCombat()).toBe(true);
      
      // Trigger automatic behavior check
      redAnt.stateMachine.checkAutomaticFactionBehaviors([blueAnt]);
      
      // Red ant should now be in combat
      expect(redAnt.stateMachine.isInCombat()).toBe(true);
    });

    test('should trigger auto-assist for allies in combat', () => {
      // Set up allied relationship
      redFaction.relationships.set("Green", 90); // Allied
      
      // Green ant enters combat
      greenAnt.stateMachine.setCombatModifier("IN_COMBAT");
      
      // Red ant should be idle initially
      redAnt.stateMachine.setPrimaryState("IDLE");
      
      // Trigger automatic behavior check
      redAnt.stateMachine.checkAutomaticFactionBehaviors([greenAnt]);
      
      // Red ant should now be following (to help ally)
      expect(redAnt.stateMachine.isPrimaryState("FOLLOWING")).toBe(true);
    });

    test('should not trigger auto-behaviors for same faction', () => {
      const redAnt2 = new MockAnt(redFaction);
      
      redAnt.stateMachine.checkAutomaticFactionBehaviors([redAnt2]);
      
      // No state changes should occur
      expect(redAnt.stateMachine.isOutOfCombat()).toBe(true);
      expect(redAnt.stateMachine.isPrimaryState("IDLE")).toBe(true);
    });
  });

  describe('State-Based Permission Integration', () => {
    test('should combine state and faction permissions', () => {
      // Set up friendly relationship
      redFaction.relationships.set("Blue", 90); // Allied
      
      // Red ant is building - should not be able to attack even enemies
      redAnt.stateMachine.setPrimaryState("BUILDING");
      expect(redAnt.stateMachine.canPerformAction("attack", blueAnt)).toBe(false);
      
      // Red ant is in combat - should be able to attack
      redAnt.stateMachine.setCombatModifier("IN_COMBAT");
      redAnt.stateMachine.setPrimaryState("IDLE");
      
      // But faction relationship prevents attack
      expect(redAnt.stateMachine.canPerformAction("attack", blueAnt)).toBe(false);
    });

    test('should require both state and faction permission', () => {
      // Set up enemy relationship
      redFaction.relationships.set("Blue", 5); // Enemies
      
      // Red ant is out of combat - state doesn't allow attack
      redAnt.stateMachine.setCombatModifier("OUT_OF_COMBAT");
      expect(redAnt.stateMachine.canPerformAction("attack", blueAnt)).toBe(false);
      
      // Red ant enters combat - now both state and faction allow attack
      redAnt.stateMachine.setCombatModifier("IN_COMBAT");
      expect(redAnt.stateMachine.canPerformAction("attack", blueAnt)).toBe(true);
    });
  });

  describe('Ant Encounter System', () => {
    test('should handle first faction encounters', () => {
      expect(redFaction.getKnownFactionCount()).toBe(0);
      expect(blueFaction.getKnownFactionCount()).toBe(0);
      
      const relationship = redAnt.encounterAnt(blueAnt);
      
      expect(redFaction.getKnownFactionCount()).toBe(1);
      expect(blueFaction.getKnownFactionCount()).toBe(1);
      expect(relationship.name).toBe("NEUTRAL");
    });

    test('should return null for invalid encounters', () => {
      const neutralAnt = new MockAnt(); // No faction
      
      expect(redAnt.encounterAnt(neutralAnt)).toBeNull();
      expect(neutralAnt.encounterAnt(redAnt)).toBeNull();
    });
  });

  describe('Faction Registry', () => {
    test('should track all factions', () => {
      const registry = new FactionRegistry();
      
      const faction1 = new Faction("Test1");
      const faction2 = new Faction("Test2");
      
      registry.registerFaction(faction1);
      registry.registerFaction(faction2);
      
      expect(registry.getFactionCount()).toBe(2);
      expect(registry.getFactionNames()).toContain("Test1");
      expect(registry.getFactionNames()).toContain("Test2");
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  test('should handle null faction references safely', () => {
    const ant = new MockAnt();
    
    expect(() => ant.stateMachine.canPerformAction("attack", new MockAnt())).not.toThrow();
    expect(ant.stateMachine.canPerformAction("attack", new MockAnt())).toBe(true);
  });

  test('should handle invalid faction names', () => {
    const faction = new Faction("ValidName");
    
    expect(faction.changeName("123")).toBe(false);
    expect(faction.changeName("")).toBe(false);
    expect(faction.changeName("Valid-Name")).toBe(false);
    expect(faction.changeName("ValidName")).toBe(true);
  });

  test('should handle relationship bounds correctly', () => {
    const faction = new Faction("Test");
    faction.relationships.set("Other", 50);
    
    faction.modifyRelationship("Other", 100, "Max test");
    expect(faction.getRelationshipValue("Other")).toBe(100);
    
    faction.modifyRelationship("Other", -200, "Min test");
    expect(faction.getRelationshipValue("Other")).toBe(0);
  });
});

console.log("✅ All faction integration tests defined!");
console.log("Run with: npm test faction-integration.test.js");