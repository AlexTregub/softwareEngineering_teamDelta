/**
 * Browser Console Test for draggablePanelManager.getOrCreatePanel()
 * 
 * To use:
 * 1. Open the game in browser (http://localhost:8000)
 * 2. Open browser console (F12)
 * 3. Run: testGetOrCreatePanel()
 * 
 * This will test the getOrCreatePanel method in multiple ways.
 */

function testGetOrCreatePanel() {
  console.log('=== Testing draggablePanelManager.getOrCreatePanel() ===\n');

  if (!window.draggablePanelManager) {
    console.error('❌ draggablePanelManager not found! Make sure game has loaded.');
    return;
  }

  let allTestsPassed = true;

  try {
    // Test 1: Create new panel
    console.log('Test 1: Create new panel');
    const panel1 = draggablePanelManager.getOrCreatePanel('test-dialogue', {
      id: 'test-dialogue',
      title: 'Test Dialogue',
      position: { x: 100, y: 100 },
      size: { width: 300, height: 200 }
    });
    
    if (panel1) {
      console.log('✅ Panel created:', panel1.config.id);
      console.log('   Title:', panel1.config.title);
    } else {
      console.error('❌ Panel creation failed');
      allTestsPassed = false;
    }

    // Test 2: Get existing panel (should return same instance)
    console.log('\nTest 2: Get existing panel (should return same instance)');
    const panel2 = draggablePanelManager.getOrCreatePanel('test-dialogue', {
      id: 'test-dialogue',
      title: 'Different Title',
      position: { x: 200, y: 200 },
      size: { width: 400, height: 300 }
    });
    
    if (panel1 === panel2) {
      console.log('✅ Same panel instance returned');
    } else {
      console.error('❌ Different panel instance returned');
      allTestsPassed = false;
    }
    
    if (panel2.config.title === 'Test Dialogue') {
      console.log('✅ Title unchanged (original config preserved)');
    } else {
      console.error('❌ Title changed when it should not have');
      allTestsPassed = false;
    }

    // Test 3: Update existing panel with updateIfExists flag
    console.log('\nTest 3: Update existing panel config (updateIfExists=true)');
    const panel3 = draggablePanelManager.getOrCreatePanel('test-dialogue', {
      id: 'test-dialogue',
      title: 'Updated Title',
      position: { x: 300, y: 300 },
      size: { width: 500, height: 400 }
    }, true); // updateIfExists = true
    
    if (panel1 === panel3) {
      console.log('✅ Same panel instance returned');
    } else {
      console.error('❌ Different panel instance returned');
      allTestsPassed = false;
    }
    
    if (panel3.config.title === 'Updated Title') {
      console.log('✅ Title updated correctly');
    } else {
      console.error('❌ Title not updated. Got:', panel3.config.title);
      allTestsPassed = false;
    }

    // Test 4: Create second panel (different ID)
    console.log('\nTest 4: Create second panel with different ID');
    const panel4 = draggablePanelManager.getOrCreatePanel('test-dialogue-2', {
      id: 'test-dialogue-2',
      title: 'Second Dialogue',
      position: { x: 400, y: 100 },
      size: { width: 300, height: 200 }
    });
    
    if (panel4 && panel4 !== panel1) {
      console.log('✅ Second panel created as separate instance');
    } else {
      console.error('❌ Second panel creation failed or returned wrong instance');
      allTestsPassed = false;
    }

    // Test 5: DialogueEvent usage pattern
    console.log('\nTest 5: DialogueEvent usage pattern (simulate dialogue system)');
    
    // Simulate first dialogue
    const dialogue1Panel = draggablePanelManager.getOrCreatePanel('dialogue-display', {
      id: 'dialogue-display',
      title: 'Queen Ant',
      position: { x: 710, y: 880 },
      size: { width: 500, height: 160 }
    });
    
    if (dialogue1Panel && dialogue1Panel.config.title === 'Queen Ant') {
      console.log('✅ First dialogue panel created');
    } else {
      console.error('❌ First dialogue panel failed');
      allTestsPassed = false;
    }
    
    // Simulate second dialogue (reusing panel)
    const dialogue2Panel = draggablePanelManager.getOrCreatePanel('dialogue-display', {
      id: 'dialogue-display',
      title: 'Worker Ant',
      position: { x: 710, y: 880 },
      size: { width: 500, height: 160 }
    }, true); // Update with new speaker
    
    if (dialogue1Panel === dialogue2Panel && dialogue2Panel.config.title === 'Worker Ant') {
      console.log('✅ Dialogue panel reused and updated with new speaker');
    } else {
      console.error('❌ Dialogue panel reuse failed');
      allTestsPassed = false;
    }

    // Cleanup test panels
    console.log('\n=== Cleanup ===');
    console.log('Test panels visible. You can manually close them or refresh page.');

  } catch (error) {
    console.error('❌ Test error:', error);
    allTestsPassed = false;
  }

  console.log('\n=== Test Summary ===');
  if (allTestsPassed) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed. See errors above.');
  }

  return allTestsPassed;
}

// Make function available globally
if (typeof window !== 'undefined') {
  window.testGetOrCreatePanel = testGetOrCreatePanel;
  console.log('✅ testGetOrCreatePanel() loaded. Run it in console to test!');
}
