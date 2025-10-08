/**
 * Unit Tests for FactionManager
 * Tests core faction system functionality
 */

// Simple test framework for browser environment
const FactionTests = {
  results: [],
  
  test(name, testFn) {
    try {
      testFn();
      this.results.push({ name, status: 'PASS', error: null });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.push({ name, status: 'FAIL', error: error.message });
      console.error(`❌ ${name}: ${error.message}`);
    }
  },
  
  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
    }
  },
  
  assertTrue(condition, message = '') {
    if (!condition) {
      throw new Error(`Expected true, got false. ${message}`);
    }
  },
  
  assertFalse(condition, message = '') {
    if (condition) {
      throw new Error(`Expected false, got true. ${message}`);
    }
  },
  
  runAllTests() {
    console.log('🧪 Running Faction System Unit Tests...');
    this.results = [];
    
    // Test faction creation
    this.test('Faction Creation', () => {
      const fm = new FactionManager();
      const factionId = fm.createFaction('Test Faction', {r: 255, g: 0, b: 0}, 'player');
      
      this.assertTrue(factionId.startsWith('faction_'), 'Faction ID should have proper prefix');
      
      const faction = fm.getFaction(factionId);
      this.assertEqual(faction.name, 'Test Faction', 'Faction name should match');
      this.assertEqual(faction.type, 'player', 'Faction type should match');
      this.assertEqual(faction.color.r, 255, 'Faction color should match');
    });
    
    // Test relationship management
    this.test('Relationship Management', () => {
      const fm = new FactionManager();
      const faction1 = fm.createFaction('Faction 1', {r: 255, g: 0, b: 0}, 'player');
      const faction2 = fm.createFaction('Faction 2', {r: 0, g: 255, b: 0}, 'ai');
      
      // Test default relationship
      this.assertEqual(fm.getRelationship(faction1, faction2), RELATIONSHIP_TIERS.NEUTRAL, 'Default relationship should be neutral');
      
      // Test setting relationship
      fm.setRelationship(faction1, faction2, RELATIONSHIP_TIERS.ALLIED, 'test');
      this.assertEqual(fm.getRelationship(faction1, faction2), RELATIONSHIP_TIERS.ALLIED, 'Relationship should be updated');
      
      // Test relationship tier
      this.assertEqual(fm.getRelationshipTier(faction1, faction2), 'ALLIED', 'Relationship tier should match');
      
      // Test same faction relationship
      this.assertEqual(fm.getRelationship(faction1, faction1), RELATIONSHIP_TIERS.ALLIED, 'Same faction should be allied');
    });
    
    // Test relationship actions
    this.test('Relationship Actions', () => {
      const fm = new FactionManager();
      const faction1 = fm.createFaction('Faction 1', {r: 255, g: 0, b: 0}, 'player');
      const faction2 = fm.createFaction('Faction 2', {r: 0, g: 255, b: 0}, 'ai');
      
      const initialRelationship = fm.getRelationship(faction1, faction2);
      
      // Test positive action
      fm.handleRelationshipAction(faction1, faction2, 'GIFT_RESOURCES', { intensity: 1.0 });
      const afterGift = fm.getRelationship(faction1, faction2);
      this.assertTrue(afterGift > initialRelationship, 'Gift should improve relationship');
      
      // Test negative action
      fm.handleRelationshipAction(faction1, faction2, 'ATTACK_ANT', { intensity: 1.0 });
      const afterAttack = fm.getRelationship(faction1, faction2);
      this.assertTrue(afterAttack < afterGift, 'Attack should worsen relationship');
    });
    
    // Test Blood Enemy relationship
    this.test('Blood Enemy Relationships', () => {
      const fm = new FactionManager();
      const faction1 = fm.createFaction('Faction 1', {r: 255, g: 0, b: 0}, 'player');
      const faction2 = fm.createFaction('Faction 2', {r: 0, g: 255, b: 0}, 'ai');
      
      // Create blood enemy relationship
      fm.handleRelationshipAction(faction1, faction2, 'ATTACK_QUEEN', { 
        inOwnTerritory: true, 
        intensity: 1.0 
      });
      
      this.assertEqual(fm.getRelationshipTier(faction1, faction2), 'BLOOD_ENEMY', 'Queen attack should create blood enemy');
      this.assertFalse(fm.canRelationshipChange(faction1, faction2), 'Blood enemy relationship should not be changeable');
      
      // Try to improve relationship (should fail)
      const beforeImprovement = fm.getRelationship(faction1, faction2);
      fm.handleRelationshipAction(faction1, faction2, 'GIFT_RESOURCES', { intensity: 1.0 });
      const afterImprovement = fm.getRelationship(faction1, faction2);
      
      this.assertEqual(beforeImprovement, afterImprovement, 'Blood enemy relationship should not change');
    });
    
    // Test discovery system
    this.test('Faction Discovery', () => {
      const fm = new FactionManager();
      const faction1 = fm.createFaction('Faction 1', {r: 255, g: 0, b: 0}, 'player');
      const faction2 = fm.createFaction('Faction 2', {r: 0, g: 255, b: 0}, 'ai');
      
      // Initially should not be discovered
      this.assertFalse(fm.hasDiscovered(faction1, faction2), 'Factions should not be discovered initially');
      
      // Discover faction
      fm.discoverFaction(faction1, faction2);
      this.assertTrue(fm.hasDiscovered(faction1, faction2), 'Faction should be discovered');
      
      // Check known factions
      const knownFactions = fm.getKnownFactions(faction1);
      this.assertTrue(knownFactions.includes(faction2), 'Known factions should include discovered faction');
    });
    
    // Test territorial system
    this.test('Territorial System', () => {
      const fm = new FactionManager();
      const faction1 = fm.createFaction('Faction 1', {r: 255, g: 0, b: 0}, 'player', {x: 100, y: 100});
      
      // Test position in territory
      this.assertTrue(fm.isInTerritory(faction1, {x: 100, y: 100}), 'Center position should be in territory');
      this.assertTrue(fm.isInTerritory(faction1, {x: 120, y: 120}), 'Nearby position should be in territory');
      this.assertFalse(fm.isInTerritory(faction1, {x: 300, y: 300}), 'Far position should not be in territory');
    });
    
    // Test diplomatic status
    this.test('Diplomatic Status', () => {
      const fm = new FactionManager();
      const playerFaction = fm.createFaction('Player', {r: 255, g: 0, b: 0}, 'player');
      const aiFaction = fm.createFaction('AI', {r: 0, g: 255, b: 0}, 'ai');
      
      // Discover the AI faction
      fm.discoverFaction(playerFaction, aiFaction);
      
      const status = fm.getDiplomaticStatus(playerFaction);
      
      this.assertTrue(status !== null, 'Diplomatic status should not be null');
      this.assertEqual(status.playerFaction.name, 'Player', 'Player faction name should match');
      this.assertEqual(status.knownFactions.length, 1, 'Should have one known faction');
      this.assertEqual(status.knownFactions[0].faction.name, 'AI', 'Known faction should be AI');
    });
    
    // Test faction controller (if available)
    if (typeof FactionController !== 'undefined') {
      this.test('Faction Controller Integration', () => {
        // Create mock entity
        const mockEntity = {
          faction: 'test_faction',
          getPosition: () => ({x: 100, y: 100}),
          posX: 100,
          posY: 100
        };
        
        const controller = new FactionController(mockEntity);
        
        this.assertEqual(controller.getFactionId(), 'test_faction', 'Controller should have correct faction ID');
        
        // Test faction ID change
        controller.setFactionId('new_faction');
        this.assertEqual(controller.getFactionId(), 'new_faction', 'Faction ID should be updated');
        this.assertEqual(mockEntity.faction, 'new_faction', 'Entity faction should be updated');
      });
    }
    
    // Summary
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    console.log(`\n🧪 Faction System Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
      console.log('❌ Failed tests:');
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`  • ${result.name}: ${result.error}`);
      });
    } else {
      console.log('✅ All tests passed!');
    }
    
    return { passed, failed, results: this.results };
  }
};

// Auto-run tests in development
if (typeof window !== 'undefined') {
  window.FactionTests = FactionTests;
  
  // Run tests after faction system is loaded
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(() => {
      FactionTests.runAllTests();
    }, 1000);
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FactionTests;
}