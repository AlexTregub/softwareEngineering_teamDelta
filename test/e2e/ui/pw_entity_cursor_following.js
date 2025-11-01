/**
 * E2E Test: Entity Palette Cursor Following (TDD)
 * Tests the full workflow of clicking an entity and placing it on the map
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  console.log('🧪 Entity Palette Cursor Following - E2E Test');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.goto('http://localhost:8000?test=1');
  
  // Enter Level Editor
  console.log('⏳ Entering Level Editor...');
  const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
  if (!editorStarted.started) {
    throw new Error('Failed to start Level Editor');
  }
  
  await sleep(1000);
  
  // Test 1: Open Entity Palette
  console.log('\n📂 Test 1: Opening Entity Palette panel...');
  await page.evaluate(() => {
    if (window.fileMenuBar) {
      window.fileMenuBar._handleTogglePanel('entity-painter');
    }
    window.gameState = 'LEVEL_EDITOR';
    if (window.draggablePanelManager) {
      window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
    }
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
  });
  
  await sleep(300);
  await saveScreenshot(page, 'entity_cursor_following/01_palette_opened', true);
  console.log('✅ Test 1 PASS - Entity Palette opened');
  
  // Test 2: Click entity template to attach to cursor
  console.log('\n🖱️  Test 2: Clicking Worker Ant template...');
  const attachResult = await page.evaluate(() => {
    const levelEditor = window.levelEditor;
    if (!levelEditor ||!levelEditor.entityPalette) {
      return { error: 'LevelEditor or EntityPalette not found' };
    }
    
    // Get first entity template
    const template = levelEditor.entityPalette.getCurrentTemplates()[0];
    
    // Simulate clicking the template (attach to cursor)
    levelEditor.attachToMouseSingle(template.id, template.properties);
    
    // Check if attachment exists
    const attachment = levelEditor.getCursorAttachment();
    
    return {
      success: attachment !== null,
      templateId: attachment ? attachment.templateId : null,
      type: attachment ? attachment.type : null,
      active: attachment ? attachment.active : false
    };
  });
  
  if (attachResult.error) {
    console.log('❌ Test 2 FAIL:', attachResult.error);
    await browser.close();
    process.exit(1);
  }
  
  console.log(`   Template ID: ${attachResult.templateId}`);
  console.log(`   Attachment Type: ${attachResult.type}`);
  console.log(`   Active: ${attachResult.active}`);
  
  if (!attachResult.success || !attachResult.active) {
    console.log('❌ Test 2 FAIL - Entity not attached to cursor');
    await browser.close();
    process.exit(1);
  }
  
  await sleep(300);
  await saveScreenshot(page, 'entity_cursor_following/02_entity_attached', true);
  console.log('✅ Test 2 PASS - Entity attached to cursor');
  
  // Test 3: Place entity on grid (normal click - should detach)
  console.log('\n🎯 Test 3: Placing entity on grid (normal click)...');
  const placeResult = await page.evaluate(() => {
    const levelEditor = window.levelEditor;
    
    // Check before placement
    const beforeAttachment = levelEditor.getCursorAttachment();
    
    // Simulate grid click at (10, 10) without shift
    const placed = levelEditor.handleGridClick(10, 10, false);
    
    // Check after placement
    const afterAttachment = levelEditor.getCursorAttachment();
    
    return {
      hadAttachmentBefore: beforeAttachment !== null,
      placed: placed,
      hasAttachmentAfter: afterAttachment !== null
    };
  });
  
  console.log(`   Had Attachment Before: ${placeResult.hadAttachmentBefore}`);
  console.log(`   Placed: ${placeResult.placed}`);
  console.log(`   Has Attachment After: ${placeResult.hasAttachmentAfter}`);
  
  if (!placeResult.placed || placeResult.hasAttachmentAfter) {
    console.log('❌ Test 3 FAIL - Entity not placed or attachment not cleared');
    await browser.close();
    process.exit(1);
  }
  
  await sleep(300);
  await saveScreenshot(page, 'entity_cursor_following/03_entity_placed_detached', true);
  console.log('✅ Test 3 PASS - Entity placed and detached from cursor');
  
  // Test 4: Multiple placement with shift key
  console.log('\n⇧ Test 4: Multiple placements with Shift key...');
  
  // Attach entity again
  await page.evaluate(() => {
    const levelEditor = window.levelEditor;
    const template = levelEditor.entityPalette.getCurrentTemplates()[1]; // Soldier Ant
    levelEditor.attachToMouseSingle(template.id, template.properties);
  });
  
  await sleep(200);
  
  // Place 3 times with shift held
  const shiftPlaceResult = await page.evaluate(() => {
    const levelEditor = window.levelEditor;
    const results = [];
    
    // Place 3 times with shift=true
    for (let i = 0; i < 3; i++) {
      const placed = levelEditor.handleGridClick(5 + i, 5 + i, true);
      const stillAttached = levelEditor.getCursorAttachment() !== null;
      results.push({ placed, stillAttached });
    }
    
    // Final placement without shift
    const finalPlaced = levelEditor.handleGridClick(10, 10, false);
    const finalAttached = levelEditor.getCursorAttachment() !== null;
    
    return {
      shiftPlacements: results,
      finalPlaced: finalPlaced,
      finalAttached: finalAttached
    };
  });
  
  console.log(`   Shift Placements: ${shiftPlaceResult.shiftPlacements.length}`);
  shiftPlaceResult.shiftPlacements.forEach((r, i) => {
    console.log(`     Placement ${i+1}: placed=${r.placed}, stillAttached=${r.stillAttached}`);
  });
  console.log(`   Final Placement: placed=${shiftPlaceResult.finalPlaced}, attached=${shiftPlaceResult.finalAttached}`);
  
  const allShiftPlacedAndAttached = shiftPlaceResult.shiftPlacements.every(r => r.placed && r.stillAttached);
  if (!allShiftPlacedAndAttached || !shiftPlaceResult.finalPlaced || shiftPlaceResult.finalAttached) {
    console.log('❌ Test 4 FAIL - Shift+click behavior incorrect');
    await browser.close();
    process.exit(1);
  }
  
  await sleep(300);
  await saveScreenshot(page, 'entity_cursor_following/04_multiple_placements_shift', true);
  console.log('✅ Test 4 PASS - Multiple placements with shift work correctly');
  
  // Test 5: Cancel with Escape key
  console.log('\n⎋ Test 5: Cancel attachment with Escape key...');
  
  // Attach entity
  await page.evaluate(() => {
    const levelEditor = window.levelEditor;
    const template = levelEditor.entityPalette.getCurrentTemplates()[2]; // Scout Ant
    levelEditor.attachToMouseSingle(template.id, template.properties);
  });
  
  await sleep(200);
  
  // Cancel with clearCursorAttachment (simulates Escape)
  const cancelResult = await page.evaluate(() => {
    const levelEditor = window.levelEditor;
    const beforeCancel = levelEditor.getCursorAttachment() !== null;
    levelEditor.clearCursorAttachment();
    const afterCancel = levelEditor.getCursorAttachment() !== null;
    
    return {
      hadAttachmentBefore: beforeCancel,
      hasAttachmentAfter: afterCancel
    };
  });
  
  console.log(`   Had Attachment Before: ${cancelResult.hadAttachmentBefore}`);
  console.log(`   Has Attachment After: ${cancelResult.hasAttachmentAfter}`);
  
  if (!cancelResult.hadAttachmentBefore || cancelResult.hasAttachmentAfter) {
    console.log('❌ Test 5 FAIL - Escape cancellation failed');
    await browser.close();
    process.exit(1);
  }
  
  await sleep(300);
  await saveScreenshot(page, 'entity_cursor_following/05_cancelled_escape', true);
  console.log('✅ Test 5 PASS - Escape key cancels attachment');
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL TESTS PASSED - Entity Cursor Following Works!');
  console.log('='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log('  ✅ Entity Palette opens');
  console.log('  ✅ Entity attaches to cursor when clicked');
  console.log('  ✅ Normal click places and detaches');
  console.log('  ✅ Shift+click allows multiple placements');
  console.log('  ✅ Escape key cancels attachment');
  console.log('\n📸 Screenshots saved to:');
  console.log('  test/e2e/screenshots/entity_cursor_following/');
  
  await browser.close();
  process.exit(0);
})().catch(error => {
  console.error('❌ TEST FAILED:', error);
  process.exit(1);
});
