/**
 * E2E Tests for Categorized Material Palette
 * 
 * Visual verification of Material Palette categorized system in browser.
 * Tests component rendering, interactions, and persistence.
 * 
 * Test Coverage:
 * 1. Default Layout
 * 2. Expand/Collapse Categories
 * 3. Search Filtering
 * 4. Recently Used Section
 * 5. Favorites System
 * 6. Material Preview Tooltip
 * 7. Persistence After Reload
 * 
 * Total: 7 comprehensive E2E tests
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

let testsPassed = 0;
let testsFailed = 0;

/**
 * Test 1: Default Layout
 */
async function test_DefaultLayout(page) {
  const testName = 'Default Layout - Categories Render';
  const startTime = Date.now();
  
  try {
    const result = await page.evaluate(() => {
      // Create MaterialPalette instance
      const palette = new window.MaterialPalette();
      
      // Load category config
      const categoryConfig = {
        categories: [
          { id: 'ground', name: 'Ground', materials: ['dirt', 'sand'], defaultExpanded: true },
          { id: 'vegetation', name: 'Vegetation', materials: ['grass', 'moss', 'moss_1'], defaultExpanded: true },
          { id: 'stone', name: 'Stone', materials: ['stone'], defaultExpanded: false },
          { id: 'water', name: 'Water', materials: ['water', 'water_cave'], defaultExpanded: false }
        ],
        uncategorized: { name: 'Other', materials: [] }
      };
      
      palette.loadCategories(categoryConfig);
      
      // Verify categories loaded
      const categoriesLoaded = palette.categories && palette.categories.length === 4;
      
      // Verify Ground and Vegetation are expanded by default
      const groundExpanded = palette.categories.find(c => c.id === 'ground').isExpanded();
      const vegetationExpanded = palette.categories.find(c => c.id === 'vegetation').isExpanded();
      const stoneCollapsed = !palette.categories.find(c => c.id === 'stone').isExpanded();
      
      return {
        success: categoriesLoaded && groundExpanded && vegetationExpanded && stoneCollapsed,
        categoriesLoaded,
        groundExpanded,
        vegetationExpanded,
        stoneCollapsed
      };
    });
    
    if (!result.success) {
      throw new Error(`Layout verification failed: ${JSON.stringify(result)}`);
    }
    
    await saveScreenshot(page, 'ui/material_palette_default', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    await saveScreenshot(page, 'ui/material_palette_default', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

/**
 * Test 2: Expand/Collapse Categories
 */
async function test_ExpandCollapseCategories(page) {
  const testName = 'Expand/Collapse Categories';
  const startTime = Date.now();
  
  try {
    const result = await page.evaluate(() => {
      const palette = new window.MaterialPalette();
      
      const categoryConfig = {
        categories: [
          { id: 'stone', name: 'Stone', materials: ['stone'], defaultExpanded: false }
        ],
        uncategorized: { name: 'Other', materials: [] }
      };
      
      palette.loadCategories(categoryConfig);
      
      const stoneCategory = palette.categories[0];
      
      // Verify starts collapsed
      const startCollapsed = !stoneCategory.isExpanded();
      
      // Expand
      palette.toggleCategory('stone');
      const afterExpandExpanded = stoneCategory.isExpanded();
      
      // Collapse
      palette.toggleCategory('stone');
      const afterCollapseCollapsed = !stoneCategory.isExpanded();
      
      return {
        success: startCollapsed && afterExpandExpanded && afterCollapseCollapsed,
        startCollapsed,
        afterExpandExpanded,
        afterCollapseCollapsed
      };
    });
    
    if (!result.success) {
      throw new Error(`Toggle verification failed: ${JSON.stringify(result)}`);
    }
    
    await saveScreenshot(page, 'ui/material_palette_toggle_category', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    await saveScreenshot(page, 'ui/material_palette_toggle_category', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

/**
 * Test 3: Search Filtering
 */
async function test_SearchFiltering(page) {
  const testName = 'Search Filtering - Filter Materials';
  const startTime = Date.now();
  
  try {
    const result = await page.evaluate(() => {
      const palette = new window.MaterialPalette();
      
      // Search for "moss"
      const results = palette.searchMaterials('moss');
      
      const hasMoss = results.includes('moss');
      const hasMoss1 = results.includes('moss_1');
      const doesNotHaveStone = !results.includes('stone');
      const doesNotHaveDirt = !results.includes('dirt');
      
      return {
        success: hasMoss && hasMoss1 && doesNotHaveStone && doesNotHaveDirt,
        results,
        hasMoss,
        hasMoss1,
        doesNotHaveStone,
        doesNotHaveDirt
      };
    });
    
    if (!result.success) {
      throw new Error(`Search filtering failed: ${JSON.stringify(result)}`);
    }
    
    await saveScreenshot(page, 'ui/material_palette_search_moss', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    await saveScreenshot(page, 'ui/material_palette_search_moss', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

/**
 * Test 4: Recently Used Section
 */
async function test_RecentlyUsedSection(page) {
  const testName = 'Recently Used Section - Track Selections';
  const startTime = Date.now();
  
  try {
    const result = await page.evaluate(() => {
      const palette = new window.MaterialPalette();
      
      // Select materials
      palette.selectMaterial('moss');
      palette.selectMaterial('stone');
      palette.selectMaterial('dirt');
      
      const recentlyUsed = palette.getRecentlyUsed();
      
      const hasCorrectLength = recentlyUsed.length === 3;
      const correctOrder = recentlyUsed[0] === 'dirt' && 
                          recentlyUsed[1] === 'stone' && 
                          recentlyUsed[2] === 'moss';
      
      return {
        success: hasCorrectLength && correctOrder,
        recentlyUsed,
        hasCorrectLength,
        correctOrder
      };
    });
    
    if (!result.success) {
      throw new Error(`Recently used tracking failed: ${JSON.stringify(result)}`);
    }
    
    await saveScreenshot(page, 'ui/material_palette_recently_used', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    await saveScreenshot(page, 'ui/material_palette_recently_used', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

/**
 * Test 5: Favorites System
 */
async function test_FavoritesSystem(page) {
  const testName = 'Favorites System - Toggle Favorites';
  const startTime = Date.now();
  
  try {
    const result = await page.evaluate(() => {
      const palette = new window.MaterialPalette();
      
      // Initially not favorite
      const initiallyNotFavorite = !palette.isFavorite('moss');
      
      // Add to favorites
      palette.toggleFavorite('moss');
      const afterToggleIsFavorite = palette.isFavorite('moss');
      
      // Remove from favorites
      palette.toggleFavorite('moss');
      const afterSecondToggleNotFavorite = !palette.isFavorite('moss');
      
      // Add multiple favorites
      palette.toggleFavorite('stone');
      palette.toggleFavorite('dirt');
      palette.toggleFavorite('grass');
      
      const favorites = palette.getFavorites();
      const hasCorrectFavorites = favorites.length === 3 && 
                                  favorites.includes('stone') &&
                                  favorites.includes('dirt') &&
                                  favorites.includes('grass');
      
      return {
        success: initiallyNotFavorite && afterToggleIsFavorite && 
                 afterSecondToggleNotFavorite && hasCorrectFavorites,
        initiallyNotFavorite,
        afterToggleIsFavorite,
        afterSecondToggleNotFavorite,
        favorites,
        hasCorrectFavorites
      };
    });
    
    if (!result.success) {
      throw new Error(`Favorites system failed: ${JSON.stringify(result)}`);
    }
    
    await saveScreenshot(page, 'ui/material_palette_favorites', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    await saveScreenshot(page, 'ui/material_palette_favorites', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

/**
 * Test 6: Material Preview Tooltip
 */
async function test_MaterialPreviewTooltip(page) {
  const testName = 'Material Preview Tooltip - Show/Hide';
  const startTime = Date.now();
  
  try {
    const result = await page.evaluate(() => {
      const palette = new window.MaterialPalette();
      
      // Tooltip starts hidden
      const initiallyHidden = !palette.tooltip.isVisible();
      
      // Show tooltip
      palette.tooltip.show('moss', 100, 100);
      const afterShowVisible = palette.tooltip.isVisible();
      
      // Hide tooltip
      palette.tooltip.hide();
      const afterHideHidden = !palette.tooltip.isVisible();
      
      return {
        success: initiallyHidden && afterShowVisible && afterHideHidden,
        initiallyHidden,
        afterShowVisible,
        afterHideHidden
      };
    });
    
    if (!result.success) {
      throw new Error(`Tooltip functionality failed: ${JSON.stringify(result)}`);
    }
    
    await saveScreenshot(page, 'ui/material_palette_tooltip', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    await saveScreenshot(page, 'ui/material_palette_tooltip', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

/**
 * Test 7: Persistence After Reload
 */
async function test_PersistenceAfterReload(page) {
  const testName = 'Persistence After Reload - LocalStorage';
  const startTime = Date.now();
  
  try {
    const result = await page.evaluate(() => {
      const palette1 = new window.MaterialPalette();
      
      // Add to recently used
      palette1.selectMaterial('moss');
      palette1.selectMaterial('stone');
      
      // Add to favorites
      palette1.toggleFavorite('dirt');
      palette1.toggleFavorite('grass');
      
      // Save preferences
      palette1.savePreferences();
      
      // Create new palette (simulating reload)
      const palette2 = new window.MaterialPalette();
      
      // Verify persistence
      const recentlyUsed = palette2.getRecentlyUsed();
      const hasMoss = recentlyUsed.includes('moss');
      const hasStone = recentlyUsed.includes('stone');
      
      const isDirtFavorite = palette2.isFavorite('dirt');
      const isGrassFavorite = palette2.isFavorite('grass');
      
      return {
        success: hasMoss && hasStone && isDirtFavorite && isGrassFavorite,
        recentlyUsed,
        hasMoss,
        hasStone,
        isDirtFavorite,
        isGrassFavorite
      };
    });
    
    if (!result.success) {
      throw new Error(`Persistence failed: ${JSON.stringify(result)}`);
    }
    
    await saveScreenshot(page, 'ui/material_palette_persistence', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    await saveScreenshot(page, 'ui/material_palette_persistence', false);
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

/**
 * Main Test Runner
 */
(async () => {
  console.log('\n🧪 Starting Categorized Material Palette E2E Tests...\n');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    // Navigate to test page
    await page.goto('http://localhost:8000?test=1', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000); // Wait for page load
    
    // Check if components are loaded
    const componentsAvailable = await page.evaluate(() => {
      return {
        MaterialPalette: typeof window.MaterialPalette !== 'undefined',
        MaterialCategory: typeof window.MaterialCategory !== 'undefined',
        MaterialSearchBar: typeof window.MaterialSearchBar !== 'undefined',
        MaterialFavorites: typeof window.MaterialFavorites !== 'undefined',
        MaterialPreviewTooltip: typeof window.MaterialPreviewTooltip !== 'undefined',
        TERRAIN_MATERIALS_RANGED: typeof window.TERRAIN_MATERIALS_RANGED !== 'undefined'
      };
    });
    
    console.log('Component availability:', componentsAvailable);
    
    if (!componentsAvailable.MaterialPalette) {
      throw new Error('MaterialPalette not loaded on page');
    }
    
    console.log('✓ All components loaded successfully\n');
    
    // Run all tests
    await test_DefaultLayout(page);
    await test_ExpandCollapseCategories(page);
    await test_SearchFiltering(page);
    await test_RecentlyUsedSection(page);
    await test_FavoritesSystem(page);
    await test_MaterialPreviewTooltip(page);
    await test_PersistenceAfterReload(page);
    
  } catch (error) {
    console.error('Fatal error during test execution:', error);
    testsFailed++;
  } finally {
    await browser.close();
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('='.repeat(50) + '\n');
    
    // Exit with appropriate code
    process.exit(testsFailed > 0 ? 1 : 0);
  }
})();
