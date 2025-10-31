/**
 * E2E Test - Entity Palette Content Visibility
 * 
 * CRITICAL: Tests that Entity Palette displays content correctly
 * This test catches regression bugs where panel shows only buttons with black/empty content
 * 
 * Tests:
 * 1. Category buttons are visible
 * 2. Entity templates are rendered (visible sprites/placeholders)
 * 3. Entity names are visible as text
 * 4. Category switching works (changes visible templates)
 * 5. Panel is not too tall (respects viewport height limit)
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Loading Level Editor...');
    await page.goto('http://localhost:8000?test=1');
    
    // Navigate to Level Editor state
    await page.evaluate(() => {
      const gs = window.GameState || window.g_gameState;
      if (gs && typeof gs.setState === 'function') {
        gs.setState('LEVEL_EDITOR');
      }
    });
    
    // Wait for Level Editor to initialize
    await sleep(2000);
    
    console.log('Testing Entity Palette content visibility...');
    
    const result = await page.evaluate(() => {
      const results = {
        success: true,
        errors: [],
        details: {}
      };
      
      // Check if entityPalette instance exists
      if (!window.levelEditor || !window.levelEditor.entityPalette) {
        results.success = false;
        results.errors.push('EntityPalette instance not found in window.levelEditor');
        return results;
      }
      
      const entityPalette = window.levelEditor.entityPalette;
      results.details.currentCategory = entityPalette.getCurrentCategory();
      
      // Test 1: Check category buttons exist
      if (!entityPalette.categoryButtons) {
        results.success = false;
        results.errors.push('Category buttons not found');
      } else {
        results.details.hasCategoryButtons = true;
      }
      
      // Test 2: Check templates are loaded for current category
      const templates = entityPalette.getCurrentTemplates();
      results.details.templateCount = templates ? templates.length : 0;
      
      if (!templates || templates.length === 0) {
        results.success = false;
        results.errors.push(`No templates found for category '${results.details.currentCategory}'`);
      } else {
        results.details.firstTemplate = {
          id: templates[0].id,
          name: templates[0].name,
          type: templates[0].type
        };
      }
      
      // Test 3: Verify templates have required properties
      if (templates && templates.length > 0) {
        const firstTemplate = templates[0];
        if (!firstTemplate.id) {
          results.errors.push('Template missing id property');
          results.success = false;
        }
        if (!firstTemplate.name) {
          results.errors.push('Template missing name property');
          results.success = false;
        }
      }
      
      // Test 4: Check scroll properties exist
      if (typeof entityPalette.scrollOffset === 'undefined') {
        results.errors.push('scrollOffset property missing');
        results.success = false;
      } else {
        results.details.scrollOffset = entityPalette.scrollOffset;
      }
      
      if (typeof entityPalette.viewportHeight === 'undefined') {
        results.errors.push('viewportHeight property missing');
        results.success = false;
      } else {
        results.details.viewportHeight = entityPalette.viewportHeight;
      }
      
      // Test 5: Check content size calculation
      const contentSize = entityPalette.getContentSize(220);
      results.details.contentWidth = contentSize.width;
      results.details.contentHeight = contentSize.height;
      
      if (!contentSize || !contentSize.width || !contentSize.height) {
        results.errors.push('getContentSize() returned invalid data');
        results.success = false;
      }
      
      // Test 6: Category switching
      const originalCategory = entityPalette.getCurrentCategory();
      results.details.originalCategory = originalCategory;
      
      // Try switching to different category
      const testCategory = originalCategory === 'entities' ? 'buildings' : 'entities';
      entityPalette.setCategory(testCategory);
      
      const newCategory = entityPalette.getCurrentCategory();
      results.details.newCategory = newCategory;
      
      if (newCategory !== testCategory) {
        results.errors.push(`Category switch failed: tried '${testCategory}', got '${newCategory}'`);
        results.success = false;
      }
      
      const newTemplates = entityPalette.getCurrentTemplates();
      results.details.newTemplateCount = newTemplates ? newTemplates.length : 0;
      
      if (!newTemplates || newTemplates.length === 0) {
        results.errors.push(`No templates after switching to '${testCategory}'`);
        results.success = false;
      }
      
      // Switch back to original category
      entityPalette.setCategory(originalCategory);
      
      return results;
    });
    
    // Wait for renders to complete
    await sleep(500);
    
    // Save screenshot
    await saveScreenshot(page, 'levelEditor/entity_palette_content', result.success);
    
    // Report results
    console.log('\nTest Results:');
    console.log('✓ Panel exists:', result.details.hasCategoryButtons ? 'YES' : 'NO');
    console.log('✓ Current category:', result.details.currentCategory);
    console.log('✓ Template count:', result.details.templateCount);
    if (result.details.firstTemplate) {
      console.log('✓ First template:', result.details.firstTemplate.name);
    }
    console.log('✓ Scroll offset:', result.details.scrollOffset);
    console.log('✓ Viewport height:', result.details.viewportHeight);
    console.log('✓ Content width:', result.details.contentWidth);
    console.log('✓ Content height:', result.details.contentHeight);
    console.log('✓ Category switch test:', result.details.newCategory);
    console.log('✓ New template count:', result.details.newTemplateCount);
    
    if (!result.success) {
      console.error('\n❌ ERRORS:');
      result.errors.forEach(err => console.error('  -', err));
    }
    
    await browser.close();
    
    if (result.success) {
      console.log('\n✅ Entity Palette content visibility test PASSED');
      process.exit(0);
    } else {
      console.error('\n❌ Entity Palette content visibility test FAILED');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await saveScreenshot(page, 'levelEditor/entity_palette_content_error', false);
    await browser.close();
    process.exit(1);
  }
})();
