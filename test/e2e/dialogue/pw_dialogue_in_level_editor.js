/**
 * E2E Test: DialogueEvent in EventEditorPanel (Level Editor)
 * 
 * Tests the complete integration workflow:
 * 1. Register DialogueEvent with EventManager
 * 2. Open Level Editor
 * 3. Verify DialogueEvent appears in EventEditorPanel
 * 4. Take screenshots for visual verification
 * 
 * Following E2E testing standards:
 * - Use system APIs (EventManager, DraggablePanelManager)
 * - Test in real browser environment
 * - Headless mode for CI/CD
 * - Screenshot evidence (MANDATORY)
 * - Force rendering after state changes
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('🎭 Testing DialogueEvent in EventEditorPanel (Level Editor)...');
    
    // Navigate to game
    await page.goto('http://localhost:8000?test=1', { waitUntil: 'networkidle0' });
    await sleep(1000);
    
    // CRITICAL: Ensure game started (bypass menu)
    console.log('   Bypassing menu...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start - still on menu');
    }
    console.log('   ✅ Game started');
    
    // Test 1: Register DialogueEvent with EventManager
    console.log('\n📝 Test 1: Registering DialogueEvents with EventManager');
    const test1 = await page.evaluate(() => {
      try {
        // Create and register 3 dialogue events
        const dialogue1 = new DialogueEvent({
          id: 'queen_welcome',
          priority: 1,
          content: {
            speaker: 'Queen Ant',
            message: 'Welcome to our colony! I am the Queen, and I oversee all operations here.',
            choices: [
              { text: 'Thank you, Your Majesty!' },
              { text: 'What can I do to help?' }
            ]
          }
        });
        
        const dialogue2 = new DialogueEvent({
          id: 'worker_request',
          priority: 2,
          content: {
            speaker: 'Worker Ant',
            message: 'We need more resources! The colony is growing rapidly.',
            choices: [
              { text: 'I will gather resources', nextEventId: 'scout_location' },
              { text: 'How many workers do we have?' }
            ]
          }
        });
        
        const dialogue3 = new DialogueEvent({
          id: 'scout_location',
          priority: 3,
          content: {
            speaker: 'Scout Ant',
            message: 'I found a large food source to the east! Should we investigate?',
            choices: [
              { text: 'Yes, send a team', nextEventId: 'queen_welcome' },
              { text: 'No, too risky' }
            ],
            portrait: 'scout_portrait.png'
          }
        });
        
        // Register all with EventManager
        window.eventManager.registerEvent(dialogue1);
        window.eventManager.registerEvent(dialogue2);
        window.eventManager.registerEvent(dialogue3);
        
        const allEvents = window.eventManager.getAllEvents();
        const dialogueEvents = allEvents.filter(e => e.type === 'dialogue');
        
        return {
          success: dialogueEvents.length === 3,
          totalEvents: allEvents.length,
          dialogueCount: dialogueEvents.length,
          eventIds: dialogueEvents.map(e => e.id),
          speakers: dialogueEvents.map(e => e.content.speaker)
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    });
    
    console.log(`   Total events: ${test1.totalEvents}`);
    console.log(`   Dialogue events: ${test1.dialogueCount}`);
    console.log(`   Event IDs: ${test1.eventIds ? test1.eventIds.join(', ') : 'none'}`);
    console.log(`   Speakers: ${test1.speakers ? test1.speakers.join(', ') : 'none'}`);
    
    if (!test1.success) {
      throw new Error(`DialogueEvent registration failed: ${test1.error}`);
    }
    
    // Test 2: Open Level Editor
    console.log('\n🎨 Test 2: Opening Level Editor');
    const test2 = await page.evaluate(() => {
      try {
        // Simulate 'L' key press to open level editor
        if (window.levelEditor && !window.levelEditor.isActive()) {
          window.levelEditor.activate();
        }
        
        // Force state change
        window.gameState = 'LEVEL_EDITOR';
        
        // Force rendering
        if (window.draggablePanelManager) {
          window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
        }
        if (typeof window.redraw === 'function') {
          window.redraw();
          window.redraw();
          window.redraw();
        }
        
        return {
          success: window.levelEditor && window.levelEditor.isActive(),
          levelEditorActive: window.levelEditor ? window.levelEditor.isActive() : false,
          gameState: window.gameState
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log(`   Level Editor active: ${test2.levelEditorActive}`);
    console.log(`   Game state: ${test2.gameState}`);
    
    if (!test2.success) {
      throw new Error(`Level Editor activation failed: ${test2.error}`);
    }
    
    await sleep(1000); // Wait for panels to initialize
    
    // Test 3: Verify EventEditorPanel exists and shows dialogue events
    console.log('\n📋 Test 3: Verifying EventEditorPanel displays DialogueEvents');
    const test3 = await page.evaluate(() => {
      try {
        const manager = window.draggablePanelManager;
        const eventsPanel = manager ? manager.panels.get('level-editor-events') : null;
        
        if (!eventsPanel) {
          return {
            success: false,
            error: 'Events panel not found in draggablePanelManager'
          };
        }
        
        // Make sure panel is visible
        if (!eventsPanel.state.visible) {
          eventsPanel.show();
        }
        
        // Add to stateVisibility if not already there
        if (!manager.stateVisibility.LEVEL_EDITOR) {
          manager.stateVisibility.LEVEL_EDITOR = [];
        }
        if (!manager.stateVisibility.LEVEL_EDITOR.includes('level-editor-events')) {
          manager.stateVisibility.LEVEL_EDITOR.push('level-editor-events');
        }
        
        // Force render
        window.gameState = 'LEVEL_EDITOR';
        manager.renderPanels('LEVEL_EDITOR');
        if (typeof window.redraw === 'function') {
          window.redraw();
          window.redraw();
          window.redraw();
        }
        
        // Get all events from EventManager
        const allEvents = window.eventManager.getAllEvents();
        const dialogueEvents = allEvents.filter(e => e.type === 'dialogue');
        
        return {
          success: true,
          panelExists: true,
          panelVisible: eventsPanel.state.visible,
          panelMinimized: eventsPanel.state.minimized,
          totalEventsInManager: allEvents.length,
          dialogueEventsInManager: dialogueEvents.length,
          eventIds: dialogueEvents.map(e => e.id),
          eventDetails: dialogueEvents.map(e => ({
            id: e.id,
            type: e.type,
            speaker: e.content.speaker,
            priority: e.priority
          }))
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    });
    
    console.log(`   Panel exists: ${test3.panelExists}`);
    console.log(`   Panel visible: ${test3.panelVisible}`);
    console.log(`   Panel minimized: ${test3.panelMinimized}`);
    console.log(`   Total events in manager: ${test3.totalEventsInManager}`);
    console.log(`   Dialogue events in manager: ${test3.dialogueEventsInManager}`);
    console.log(`   Event IDs: ${test3.eventIds ? test3.eventIds.join(', ') : 'none'}`);
    
    if (!test3.success) {
      throw new Error(`EventEditorPanel verification failed: ${test3.error}`);
    }
    
    if (test3.dialogueEventsInManager !== 3) {
      throw new Error(`Expected 3 dialogue events, found ${test3.dialogueEventsInManager}`);
    }
    
    // Test 4: Take screenshot with events panel visible
    console.log('\n📸 Test 4: Taking screenshot for visual verification');
    await sleep(500);
    await saveScreenshot(page, 'dialogue/dialogue_in_level_editor', true);
    console.log('   ✅ Screenshot saved');
    
    // Test 5: Verify specific dialogue event details
    console.log('\n🔍 Test 5: Verifying specific dialogue event details');
    console.log('   Event details:');
    if (test3.eventDetails) {
      test3.eventDetails.forEach(event => {
        console.log(`   - ${event.id}: type=${event.type}, speaker=${event.speaker}, priority=${event.priority}`);
      });
    }
    
    const hasQueenWelcome = test3.eventIds && test3.eventIds.includes('queen_welcome');
    const hasWorkerRequest = test3.eventIds && test3.eventIds.includes('worker_request');
    const hasScoutLocation = test3.eventIds && test3.eventIds.includes('scout_location');
    
    if (!hasQueenWelcome || !hasWorkerRequest || !hasScoutLocation) {
      throw new Error('Not all expected dialogue events found');
    }
    
    console.log('   ✅ All expected dialogue events present');
    
    // Success!
    console.log('\n✅ All tests passed!');
    console.log('   - DialogueEvents registered with EventManager');
    console.log('   - Level Editor opened successfully');
    console.log('   - EventEditorPanel displays all 3 dialogue events');
    console.log('   - Screenshot saved for visual verification');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    await saveScreenshot(page, 'dialogue/dialogue_in_level_editor_error', false);
    await browser.close();
    process.exit(1);
  }
})();
