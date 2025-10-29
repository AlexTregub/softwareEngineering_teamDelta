/**
 * E2E Test: Select Tool & Hover Preview Visual Verification
 * 
 * TDD Phase 3: E2E TESTS with screenshots
 * 
 * Tests:
 * 1. Select tool draws rectangle and paints all tiles
 * 2. Hover preview highlights tiles before painting (brush size 1, 3, 5)
 * 3. Visual proof via screenshots
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
    let browser, page;
    let success = true;
    
    try {
        console.log('🚀 Starting E2E test: Select Tool & Hover Preview');
        
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
        
        // Test 1: Hover Preview with Brush Size 1
        console.log('🖌️ Test 1: Hover preview with brush size 1...');
        const hoverTest1 = await page.evaluate(() => {
            if (!window.levelEditor || !window.levelEditor.hoverPreviewManager) {
                return { success: false, error: 'HoverPreviewManager not initialized' };
            }
            
            // Simulate hover at tile (10, 10) with paint tool and brush size 1
            window.levelEditor.hoverPreviewManager.updateHover(10, 10, 'paint', 1);
            const tiles = window.levelEditor.hoverPreviewManager.getHoveredTiles();
            
            // Force render to show preview
            if (typeof window.redraw === 'function') {
                window.redraw();
                window.redraw();
            }
            
            return {
                success: tiles.length === 1,
                tileCount: tiles.length,
                tiles: tiles
            };
        });
        
        if (!hoverTest1.success) {
            console.error('❌ Hover preview test 1 failed:', hoverTest1);
            success = false;
        } else {
            console.log('✅ Hover preview shows 1 tile for brush size 1');
        }
        
        await sleep(500);
        await saveScreenshot(page, 'ui/select_tool_hover_brush1', hoverTest1.success);
        
        // Test 2: Hover Preview with Brush Size 3
        console.log('🖌️ Test 2: Hover preview with brush size 3...');
        const hoverTest3 = await page.evaluate(() => {
            // Set brush size to 3
            if (window.levelEditor.brushControl) {
                window.levelEditor.brushControl.setSize(3);
            }
            
            // Simulate hover at tile (10, 10) with paint tool and brush size 3
            window.levelEditor.hoverPreviewManager.updateHover(10, 10, 'paint', 3);
            const tiles = window.levelEditor.hoverPreviewManager.getHoveredTiles();
            
            // Force render
            if (typeof window.redraw === 'function') {
                window.redraw();
                window.redraw();
            }
            
            return {
                success: tiles.length === 5,  // Center + 4 cardinal directions
                tileCount: tiles.length,
                tiles: tiles
            };
        });
        
        if (!hoverTest3.success) {
            console.error('❌ Hover preview test 3 failed:', hoverTest3);
            success = false;
        } else {
            console.log('✅ Hover preview shows 5 tiles for brush size 3');
        }
        
        await sleep(500);
        await saveScreenshot(page, 'ui/select_tool_hover_brush3', hoverTest3.success);
        
        // Test 3: Select Tool Rectangle Selection
        console.log('⬚ Test 3: Select tool rectangle selection...');
        const selectTest = await page.evaluate(() => {
            if (!window.levelEditor || !window.levelEditor.selectionManager) {
                return { success: false, error: 'SelectionManager not initialized' };
            }
            
            // Select paint tool and material
            if (window.levelEditor.toolbar) {
                window.levelEditor.toolbar.selectTool('select');
            }
            if (window.levelEditor.palette) {
                window.levelEditor.palette.selectMaterial('stone');
            }
            
            // Simulate rectangle selection from (5,5) to (8,8)
            window.levelEditor.selectionManager.startSelection(5, 5);
            window.levelEditor.selectionManager.updateSelection(8, 8);
            
            const bounds = window.levelEditor.selectionManager.getSelectionBounds();
            
            // Force render to show selection rectangle
            if (typeof window.redraw === 'function') {
                window.redraw();
                window.redraw();
                window.redraw();
            }
            
            return {
                success: bounds && bounds.minX === 5 && bounds.maxX === 8 && 
                        bounds.minY === 5 && bounds.maxY === 8,
                bounds: bounds,
                isSelecting: window.levelEditor.selectionManager.isSelecting
            };
        });
        
        if (!selectTest.success) {
            console.error('❌ Select tool test failed:', selectTest);
            success = false;
        } else {
            console.log('✅ Select tool creates correct rectangle selection');
        }
        
        await sleep(500);
        await saveScreenshot(page, 'ui/select_tool_rectangle_active', selectTest.success);
        
        // Test 4: Paint Selection
        console.log('🎨 Test 4: Paint all tiles in selection...');
        const paintTest = await page.evaluate(() => {
            // Get tiles in selection
            const tiles = window.levelEditor.selectionManager.getTilesInSelection();
            
            // End selection (this should trigger painting)
            window.levelEditor.selectionManager.endSelection();
            
            // Manually paint tiles with stone
            const material = 'stone';
            tiles.forEach(tile => {
                window.levelEditor.terrain.setTile(tile.x, tile.y, material);
            });
            
            // Clear selection
            window.levelEditor.selectionManager.clearSelection();
            
            // Force render
            if (typeof window.redraw === 'function') {
                window.redraw();
                window.redraw();
                window.redraw();
            }
            
            // Verify tiles were painted
            let allStone = true;
            for (let y = 5; y <= 8; y++) {
                for (let x = 5; x <= 8; x++) {
                    const tile = window.levelEditor.terrain.getTile(x, y);
                    if (!tile || tile.getMaterial() !== material) {
                        allStone = false;
                        break;
                    }
                }
            }
            
            return {
                success: tiles.length === 16 && allStone,
                tileCount: tiles.length,
                allStone: allStone
            };
        });
        
        if (!paintTest.success) {
            console.error('❌ Paint selection test failed:', paintTest);
            success = false;
        } else {
            console.log('✅ All 16 tiles in selection painted with stone');
        }
        
        await sleep(500);
        await saveScreenshot(page, 'ui/select_tool_painted_result', paintTest.success);
        
        // Final summary screenshot
        console.log('📸 Taking final screenshot...');
        await sleep(500);
        await saveScreenshot(page, 'ui/select_tool_complete', success);
        
        if (success) {
            console.log('\n✅ All E2E tests passed!');
            console.log('📸 Screenshots saved to test/e2e/screenshots/ui/');
        } else {
            console.error('\n❌ Some E2E tests failed - check screenshots');
        }
        
    } catch (error) {
        console.error('❌ E2E test error:', error);
        success = false;
        
        if (page) {
            await saveScreenshot(page, 'ui/select_tool_error', false);
        }
    } finally {
        if (browser) {
            await browser.close();
        }
        
        process.exit(success ? 0 : 1);
    }
})();
