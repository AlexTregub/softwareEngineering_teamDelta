/**
 * E2E Test: TerrainEditor Actual Painting Patterns
 * 
 * TDD Phase 3: E2E TESTS with screenshots
 * 
 * Tests that actual painting (not just hover preview) uses correct patterns:
 * 1. Odd size 3: Paints 3x3 square (9 tiles)
 * 2. Even size 4: Paints circular pattern (~13 tiles)
 * 3. Odd size 5: Paints 5x5 square (25 tiles)
 * 4. Visual proof via screenshots
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
    let browser, page;
    let success = true;
    
    try {
        console.log('🚀 Starting E2E test: TerrainEditor Actual Painting Patterns');
        
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
        
        // Test 1: Paint with odd size 3 (should be 3x3 square = 9 tiles)
        console.log('⬛ Test 1: Paint with odd size 3 (3x3 square)...');
        const oddSize3Test = await page.evaluate(() => {
            window.levelEditor.brushControl.setSize(3);
            window.levelEditor.palette.selectMaterial('stone');
            
            // Paint at grid position (5, 5)
            window.levelEditor.editor.setBrushSize(3);
            window.levelEditor.editor.selectMaterial('stone');
            window.levelEditor.editor.paint(5, 5);
            
            // Count painted stone tiles in 3x3 area
            let count = 0;
            const paintedTiles = [];
            for (let y = 4; y <= 6; y++) {
                for (let x = 4; x <= 6; x++) {
                    const tile = window.levelEditor.terrain.getTile(x, y);
                    if (tile && tile.getMaterial() === 'stone') {
                        count++;
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            // Force render
            if (typeof window.redraw === 'function') {
                window.redraw();
                window.redraw();
            }
            
            return {
                success: count === 9,
                tileCount: count,
                expected: 9,
                paintedTiles: paintedTiles
            };
        });
        
        if (!oddSize3Test.success) {
            console.error('❌ Odd size 3 painting test failed:', oddSize3Test);
            success = false;
        } else {
            console.log('✅ Size 3 painted square: ' + oddSize3Test.tileCount + ' tiles');
        }
        
        await sleep(500);
        await saveScreenshot(page, 'ui/paint_size_3_square', oddSize3Test.success);
        
        // Test 2: Paint with even size 4 (should be circular ~13 tiles)
        console.log('⚪ Test 2: Paint with even size 4 (circular pattern)...');
        const evenSize4Test = await page.evaluate(() => {
            window.levelEditor.brushControl.setSize(4);
            window.levelEditor.palette.selectMaterial('moss');
            
            // Paint at grid position (10, 10)
            window.levelEditor.editor.setBrushSize(4);
            window.levelEditor.editor.selectMaterial('moss');
            window.levelEditor.editor.paint(10, 10);
            
            // Count painted moss tiles in 4x4 area
            let count = 0;
            for (let y = 8; y <= 12; y++) {
                for (let x = 8; x <= 12; x++) {
                    const tile = window.levelEditor.terrain.getTile(x, y);
                    if (tile && tile.getMaterial() === 'moss') {
                        count++;
                    }
                }
            }
            
            // Force render
            if (typeof window.redraw === 'function') {
                window.redraw();
                window.redraw();
            }
            
            return {
                success: count > 9 && count <= 16,
                tileCount: count,
                pattern: 'circular'
            };
        });
        
        if (!evenSize4Test.success) {
            console.error('❌ Even size 4 painting test failed:', evenSize4Test);
            success = false;
        } else {
            console.log('✅ Size 4 painted circular: ' + evenSize4Test.tileCount + ' tiles');
        }
        
        await sleep(500);
        await saveScreenshot(page, 'ui/paint_size_4_circular', evenSize4Test.success);
        
        // Test 3: Paint with odd size 5 (should be 5x5 square = 25 tiles)
        console.log('⬛ Test 3: Paint with odd size 5 (5x5 square)...');
        const oddSize5Test = await page.evaluate(() => {
            window.levelEditor.brushControl.setSize(5);
            window.levelEditor.palette.selectMaterial('grass');
            
            // Paint at grid position (15, 10)
            window.levelEditor.editor.setBrushSize(5);
            window.levelEditor.editor.selectMaterial('grass');
            window.levelEditor.editor.paint(15, 10);
            
            // Count painted grass tiles in 5x5 area
            let count = 0;
            for (let y = 8; y <= 12; y++) {
                for (let x = 13; x <= 17; x++) {
                    const tile = window.levelEditor.terrain.getTile(x, y);
                    if (tile && tile.getMaterial() === 'grass') {
                        count++;
                    }
                }
            }
            
            // Force render
            if (typeof window.redraw === 'function') {
                window.redraw();
                window.redraw();
            }
            
            return {
                success: count === 25,
                tileCount: count,
                expected: 25
            };
        });
        
        if (!oddSize5Test.success) {
            console.error('❌ Odd size 5 painting test failed:', oddSize5Test);
            success = false;
        } else {
            console.log('✅ Size 5 painted square: ' + oddSize5Test.tileCount + ' tiles');
        }
        
        await sleep(500);
        await saveScreenshot(page, 'ui/paint_size_5_square', oddSize5Test.success);
        
        // Final summary screenshot showing all painted patterns
        console.log('📸 Taking final comparison screenshot...');
        await sleep(500);
        await saveScreenshot(page, 'ui/paint_patterns_complete', success);
        
        if (success) {
            console.log('\n✅ All E2E painting pattern tests passed!');
            console.log('📸 Screenshots saved to test/e2e/screenshots/ui/');
            console.log('   - Size 3: 9 tiles (square)');
            console.log('   - Size 4: ~13 tiles (circular)');
            console.log('   - Size 5: 25 tiles (square)');
        } else {
            console.error('\n❌ Some E2E tests failed - check screenshots');
        }
        
    } catch (error) {
        console.error('❌ E2E test error:', error);
        success = false;
        
        if (page) {
            await saveScreenshot(page, 'ui/paint_patterns_error', false);
        }
    } finally {
        if (browser) {
            await browser.close();
        }
        
        process.exit(success ? 0 : 1);
    }
})();
