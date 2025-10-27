/**
 * E2E Test: Brush Size Patterns Visual Verification
 * 
 * TDD Phase 3: E2E TESTS with screenshots
 * 
 * Tests:
 * 1. Brush size increments by 1 (1,2,3,4,5,6,7,8,9)
 * 2. Even sizes (2,4,6,8): Circular pattern
 * 3. Odd sizes (3,5,7,9): Square pattern
 * 4. Visual proof via screenshots
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
    let browser, page;
    let success = true;
    
    try {
        console.log('🚀 Starting E2E test: Brush Size Patterns');
        
        browser = await launchBrowser();
        page = await browser.newPage();
        
        await page.goto('http://localhost:8000?test=1');
        await sleep(1000);
        
        // CRITICAL: Ensure game started (bypass menu)
        console.log('🎮 Ensuring game started...');
        const gameStarted = await cameraHelper.ensureGameStarted(page);
        if (!gameStarted.started) {
            throw new Error('Failed to start game - still on menu');
        }
        await sleep(500);
        
        // Activate Level Editor
        console.log('📝 Activating Level Editor...');
        await page.evaluate(() => {
            if (typeof GameState !== 'undefined') {
                GameState.setState('LEVEL_EDITOR');
            }
            
            // Create and activate level editor
            if (typeof window.levelEditor === 'undefined') {
                const terrain = new CustomTerrain(20, 20, 32);
                window.levelEditor = new LevelEditor();
                window.levelEditor.initialize(terrain);
            }
            
            window.levelEditor.activate();
            
            // Force render
            if (typeof window.redraw === 'function') {
                window.redraw();
                window.redraw();
                window.redraw();
            }
        });
        await sleep(1000);
        
        // Test 1: Brush size steps by 1
        console.log('🔢 Test 1: Brush size increments 1->2->3->4->5...');
        const stepTest = await page.evaluate(() => {
            if (!window.levelEditor || !window.levelEditor.brushControl) {
                return { success: false, error: 'BrushControl not initialized' };
            }
            
            const sizes = [];
            window.levelEditor.brushControl.setSize(1);
            
            for (let i = 0; i < 9; i++) {
                sizes.push(window.levelEditor.brushControl.getSize());
                window.levelEditor.brushControl.increase();
            }
            
            // Should get [1,2,3,4,5,6,7,8,9]
            const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const success = JSON.stringify(sizes) === JSON.stringify(expected);
            
            return { success, sizes, expected };
        });
        
        if (!stepTest.success) {
            console.error('❌ Brush size step test failed:', stepTest);
            success = false;
        } else {
            console.log('✅ Brush sizes step by 1:', stepTest.sizes.join(','));
        }
        
        // Test 2: Odd size 3 creates square pattern (9 tiles)
        console.log('⬛ Test 2: Odd size 3 creates 3x3 square (9 tiles)...');
        const oddSize3Test = await page.evaluate(() => {
            window.levelEditor.brushControl.setSize(3);
            window.levelEditor.hoverPreviewManager.updateHover(10, 10, 'paint', 3);
            const tiles = window.levelEditor.hoverPreviewManager.getHoveredTiles();
            
            // Force render to show preview
            if (typeof window.redraw === 'function') {
                window.redraw();
                window.redraw();
            }
            
            return {
                success: tiles.length === 9,
                tileCount: tiles.length,
                pattern: 'square'
            };
        });
        
        if (!oddSize3Test.success) {
            console.error('❌ Odd size 3 test failed:', oddSize3Test);
            success = false;
        } else {
            console.log('✅ Size 3 creates square: 9 tiles');
        }
        
        await sleep(500);
        await saveScreenshot(page, 'ui/brush_size_3_square', oddSize3Test.success);
        
        // Test 3: Even size 4 creates circular pattern (< 16 tiles)
        console.log('⚪ Test 3: Even size 4 creates circular pattern...');
        const evenSize4Test = await page.evaluate(() => {
            window.levelEditor.brushControl.setSize(4);
            window.levelEditor.hoverPreviewManager.updateHover(10, 10, 'paint', 4);
            const tiles = window.levelEditor.hoverPreviewManager.getHoveredTiles();
            
            // Force render
            if (typeof window.redraw === 'function') {
                window.redraw();
                window.redraw();
            }
            
            return {
                success: tiles.length > 9 && tiles.length <= 16,
                tileCount: tiles.length,
                pattern: 'circular'
            };
        });
        
        if (!evenSize4Test.success) {
            console.error('❌ Even size 4 test failed:', evenSize4Test);
            success = false;
        } else {
            console.log('✅ Size 4 creates circular: ' + evenSize4Test.tileCount + ' tiles');
        }
        
        await sleep(500);
        await saveScreenshot(page, 'ui/brush_size_4_circular', evenSize4Test.success);
        
        // Test 4: Odd size 5 creates square pattern (25 tiles)
        console.log('⬛ Test 4: Odd size 5 creates 5x5 square (25 tiles)...');
        const oddSize5Test = await page.evaluate(() => {
            window.levelEditor.brushControl.setSize(5);
            window.levelEditor.hoverPreviewManager.updateHover(10, 10, 'paint', 5);
            const tiles = window.levelEditor.hoverPreviewManager.getHoveredTiles();
            
            // Force render
            if (typeof window.redraw === 'function') {
                window.redraw();
                window.redraw();
            }
            
            return {
                success: tiles.length === 25,
                tileCount: tiles.length,
                pattern: 'square'
            };
        });
        
        if (!oddSize5Test.success) {
            console.error('❌ Odd size 5 test failed:', oddSize5Test);
            success = false;
        } else {
            console.log('✅ Size 5 creates square: 25 tiles');
        }
        
        await sleep(500);
        await saveScreenshot(page, 'ui/brush_size_5_square', oddSize5Test.success);
        
        // Final summary screenshot
        console.log('📸 Taking final screenshot...');
        await sleep(500);
        await saveScreenshot(page, 'ui/brush_patterns_complete', success);
        
        if (success) {
            console.log('\n✅ All E2E brush pattern tests passed!');
            console.log('📸 Screenshots saved to test/e2e/screenshots/ui/');
        } else {
            console.error('\n❌ Some E2E tests failed - check screenshots');
        }
        
    } catch (error) {
        console.error('❌ E2E test error:', error);
        success = false;
        
        if (page) {
            await saveScreenshot(page, 'ui/brush_patterns_error', false);
        }
    } finally {
        if (browser) {
            await browser.close();
        }
        
        process.exit(success ? 0 : 1);
    }
})();
