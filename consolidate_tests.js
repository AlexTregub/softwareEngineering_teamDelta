#!/usr/bin/env node

/**
 * Test Consolidation Script
 * Consolidates test files according to TEST_CONSOLIDATION_CHECKLIST.md
 */

const fs = require('fs');
const path = require('path');

// Helper function to consolidate test files
function consolidateTests(targetFile, sourceFiles, description) {
    console.log(`\n📦 Consolidating ${sourceFiles.length} files into: ${targetFile}`);
    
    const allContent = [];
    const commonRequires = new Set();
    const seenRequires = new Map(); // Track all requires across files
    let totalTests = 0;
    
    for (const sourceFile of sourceFiles) {
        const fullPath = path.join(__dirname, sourceFile);
        
        if (!fs.existsSync(fullPath)) {
            console.warn(`  ⚠️  Source file not found: ${sourceFile}`);
            continue;
        }
        
        let content = fs.readFileSync(fullPath, 'utf8');
        const fileName = path.basename(sourceFile);
        
        // Remove common requires that will be at the top of consolidated file
        const commonPatterns = [
            /const\s+{\s*expect\s*}\s*=\s*require\(['"]chai['"]\);?\s*/g,
            /const\s+expect\s*=\s*require\(['"]chai['"]\)\.expect;?\s*/g,
            /const\s+sinon\s*=\s*require\(['"]sinon['"]\);?\s*/g,
            /const\s+{\s*JSDOM\s*}\s*=\s*require\(['"]jsdom['"]\);?\s*/g,
        ];
        
        // Extract and track common requires before removing them
        for (const pattern of commonPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => commonRequires.add(match.trim()));
                content = content.replace(pattern, '');
            }
        }
        
        // Replace all other const declarations with let to avoid redeclaration errors
        content = content.replace(/^const\s+(\w+)\s*=/gm, 'let $1 =');
        
        // Track and comment out duplicate require statements
        const requirePattern = /^(let|const|var)\s+(\w+)\s*=\s*require\([^)]+\);?/gm;
        content = content.replace(requirePattern, (match, keyword, varName) => {
            const key = varName;
            if (seenRequires.has(key)) {
                // Duplicate - comment it out
                return `// DUPLICATE REQUIRE REMOVED: ${match}`;
            }
            seenRequires.set(key, true);
            return match.replace(/^const /, 'let '); // Ensure it's let
        });
        
        // Count tests
        const testCount = (content.match(/it\(/g) || []).length;
        totalTests += testCount;
        
        // Wrap content with clear separation
        const wrappedContent = `
// ================================================================
// ${fileName} (${testCount} tests)
// ================================================================
${content}
`;
        
        allContent.push(wrappedContent);
        console.log(`  ✓ Processed: ${fileName} (${testCount} tests)`);
    }
    
    // Create target directory if needed
    const targetDir = path.dirname(path.join(__dirname, targetFile));
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Build consolidated file
    const header = `/**
 * Consolidated ${description} Tests
 * Generated: ${new Date().toISOString()}
 * Source files: ${sourceFiles.length}
 * Total tests: ${totalTests}
 * 
 * This file contains all ${description.toLowerCase()} tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
${Array.from(commonRequires).join('\n')}

`;
    
    const consolidatedContent = header + allContent.join('\n\n');
    
    // Write to file
    fs.writeFileSync(path.join(__dirname, targetFile), consolidatedContent, 'utf8');
    console.log(`  ✅ Created: ${targetFile} (${totalTests} total tests)`);
    
    return { file: targetFile, sourceCount: sourceFiles.length, testCount: totalTests };
}

// ============================================================
// Main Consolidation Process
// ============================================================

console.log('========================================');
console.log('📋 Test Suite Consolidation');
console.log('========================================');

const results = [];

// Category 1: Controllers
console.log('\n[1/12] Controllers (Unit Tests)');
results.push(consolidateTests(
    'test/unit/controllers/controllers.test.js',
    [
        'test/unit/controllers/antUtilities.test.js',
        'test/unit/controllers/cameraController.test.js',
        'test/unit/controllers/cameraManager.test.js',
        'test/unit/controllers/combatController.test.js',
        'test/unit/controllers/debugRenderer.test.js',
        'test/unit/controllers/healthController.test.js',
        'test/unit/controllers/inventoryController.test.js',
        'test/unit/controllers/keyboardInputController.test.js',
        'test/unit/controllers/mouseInputController.test.js',
        'test/unit/controllers/movementController.test.js',
        'test/unit/controllers/renderController.test.js',
        'test/unit/controllers/selectionBoxController.test.js',
        'test/unit/controllers/selectionController.test.js',
        'test/unit/controllers/taskManager.test.js',
        'test/unit/controllers/terrainController.test.js',
        'test/unit/controllers/transformController.test.js',
        'test/unit/controllers/uiSelectionController.test.js'
    ],
    'Controller'
));

// Category 2A: UI - Panel System
console.log('\n[2/12] UI - Panel System (Unit Tests)');
results.push(consolidateTests(
    'test/unit/ui/panels.test.js',
    [
        'test/unit/ui/draggablePanel.test.js',
        'test/unit/ui/draggablePanelManager.test.js',
        'test/unit/ui/draggablePanelManager.getOrCreatePanel.test.js',
        'test/unit/ui/DraggablePanelManager.managedExternally.test.js',
        'test/unit/ui/draggablePanelManagerDoubleRender.test.js',
        'test/unit/ui/draggablePanelManagerMouseConsumption.test.js',
        'test/unit/ui/draggablePanelMouseConsumption.test.js',
        'test/unit/ui/DraggablePanel.columnHeightResize.test.js',
        'test/unit/ui/contentSize.test.js',
        'test/unit/ui/ScrollableContentArea.test.js',
        'test/unit/ui/ScrollIndicator.test.js',
        'test/unit/ui/LevelEditorPanels.test.js',
        'test/unit/ui/levelEditorPanelRendering.test.js',
        'test/unit/ui/propertiesPanel.test.js',
        'test/unit/ui/UIObject.test.js'
    ],
    'UI Panel System'
));

// Category 2B: UI - Level Editor
console.log('\n[3/12] UI - Level Editor (Unit Tests)');
results.push(consolidateTests(
    'test/unit/ui/levelEditor.test.js',
    [
        'test/unit/ui/brushSizePatterns.test.js',
        'test/unit/ui/eventEditorPanel.unit.test.js',
        'test/unit/ui/EventEditorPanel.test.js',
        'test/unit/ui/eventEditorDragToPlace.test.js',
        'test/unit/ui/fileMenuBar.test.js',
        'test/unit/ui/fileMenuBar_viewMenu.test.js',
        'test/unit/ui/levelEditorCamera.test.js',
        'test/unit/ui/levelEditorCameraInput.test.js',
        'test/unit/ui/levelEditorCameraTransform.test.js',
        'test/unit/ui/levelEditorClickHandling.test.js',
        'test/unit/ui/levelEditorTerrainHighlight.test.js',
        'test/unit/ui/levelEditorZoom.test.js',
        'test/unit/ui/materialPaletteInteraction.test.js',
        'test/unit/ui/materialPaletteTerrainTextures.test.js',
        'test/unit/ui/materialPaletteTextTruncation.test.js',
        'test/unit/ui/selectToolAndHoverPreview.test.js',
        'test/unit/ui/terrainUI.test.js',
        'test/unit/ui/viewMenuPanelToggle.test.js'
    ],
    'UI Level Editor'
));

// Category 2C: UI - File I/O Dialogs
console.log('\n[4/12] UI - File Dialogs (Unit Tests)');
results.push(consolidateTests(
    'test/unit/ui/fileDialogs.test.js',
    [
        'test/unit/ui/fileIO.test.js',
        'test/unit/ui/loadDialog_fileExplorer.test.js',
        'test/unit/ui/loadDialog_interactions.test.js',
        'test/unit/ui/loadDialog_render.test.js',
        'test/unit/ui/saveDialog_fileExplorer.test.js',
        'test/unit/ui/saveDialog_interactions.test.js',
        'test/unit/ui/saveDialog_render.test.js'
    ],
    'UI File Dialogs'
));

// Category 2D: UI - Grid & Minimap
console.log('\n[5/12] UI - Grid & Minimap (Unit Tests)');
results.push(consolidateTests(
    'test/unit/ui/gridAndMinimap.test.js',
    [
        'test/unit/ui/DynamicGridOverlay.test.js',
        'test/unit/ui/gridOverlay.test.js',
        'test/unit/ui/DynamicMinimap.test.js',
        'test/unit/ui/miniMap.test.js',
        'test/unit/ui/miniMap.debounce.test.js'
    ],
    'UI Grid & Minimap'
));

// Category 2E: UI - Menus & Buttons
console.log('\n[6/18] UI - Menus & Buttons (Unit Tests)');
results.push(consolidateTests(
    'test/unit/ui/menusAndButtons.test.js',
    [
        'test/unit/ui/verticalButtonList.test.js',
        'test/unit/ui/verticalButtonList.header.test.js',
        'test/unit/ui/selectionbox.all.test.js',
        'test/unit/ui/spawn-interaction.regression.test.js',
        'test/unit/ui/menuBar/BrushSizeMenuModule.test.js',
        'test/unit/ui/menuBar/fileMenuBarInteraction.test.js'
    ],
    'UI Menus & Buttons'
));

// Category 3: Managers
console.log('\n[7/12] Managers (Unit Tests)');
results.push(consolidateTests(
    'test/unit/managers/managers.test.js',
    [
        'test/unit/managers/AntManager.test.js',
        'test/unit/managers/BuildingManager.test.js',
        'test/unit/managers/eventManager.test.js',
        'test/unit/managers/eventManagerExport.test.js',
        'test/unit/managers/GameStateManager.test.js',
        'test/unit/managers/MapManager.test.js',
        'test/unit/managers/pheromoneControl.test.js',
        'test/unit/managers/ResourceManager.test.js',
        'test/unit/managers/ResourceSystemManager.test.js',
        'test/unit/managers/SpatialGridManager.test.js',
        'test/unit/managers/taskManager.test.js',
        'test/unit/managers/TileInteractionManager.test.js'
    ],
    'Manager'
));

// Category 4A: Terrain Core
console.log('\n[8/12] Terrain Core (Unit Tests)');
results.push(consolidateTests(
    'test/unit/terrain/terrain.test.js',
    [
        'test/unit/terrain/chunk.test.js',
        'test/unit/terrain/coordinateSystem.test.js',
        'test/unit/terrain/customLevels.test.js',
        'test/unit/terrain/customTerrain.test.js',
        'test/unit/terrain/grid.test.js',
        'test/unit/terrain/gridTerrain.test.js',
        'test/unit/terrain/gridTerrain.tileset.test.js',
        'test/unit/terrain/SparseTerrain.test.js',
        'test/unit/terrain/SparseTerrainCompatibility.test.js',
        'test/unit/terrain/SparseTerrainSizeCustomization.test.js',
        'test/unit/terrain/terrianGen.test.js'
    ],
    'Terrain Core'
));

// Category 4B: Terrain Editor
console.log('\n[9/12] Terrain Editor (Unit Tests)');
results.push(consolidateTests(
    'test/unit/terrainUtils/terrainEditor.test.js',
    [
        'test/unit/terrainUtils/terrainEditor.test.js',
        'test/unit/terrainUtils/terrainEditorBrushPatterns.test.js',
        'test/unit/terrainUtils/TerrainEditorFillBounds.test.js',
        'test/unit/terrainUtils/terrainEditorMaterialPainting.test.js',
        'test/unit/terrainUtils/terrainExporter.test.js',
        'test/unit/terrainUtils/terrainImporter.test.js',
        'test/unit/terrainUtils/customTerrainSizeValidation.test.js',
        'test/unit/terrainUtils/customTerrainTextureRendering.test.js'
    ],
    'Terrain Editor'
));

// Category 5: Rendering System
console.log('\n[10/12] Rendering System (Unit Tests)');
results.push(consolidateTests(
    'test/unit/rendering/rendering.test.js',
    [
        'test/unit/rendering/cacheManager.test.js',
        'test/unit/rendering/EffectsLayerRenderer.test.js',
        'test/unit/rendering/EntityAccessor.test.js',
        'test/unit/rendering/EntityDelegationBuilder.test.js',
        'test/unit/rendering/EntityLayerRenderer.test.js',
        'test/unit/rendering/PerformanceMonitor.test.js',
        'test/unit/rendering/sprite2d.test.js',
        'test/unit/rendering/UIController.test.js',
        'test/unit/rendering/UIDebugManager.test.js',
        'test/unit/rendering/UILayerRenderer.test.js',
        'test/unit/rendering/fullBufferCache.test.js'
    ],
    'Rendering System'
));

// Category 6: Systems
console.log('\n[11/12] Systems (Unit Tests)');
results.push(consolidateTests(
    'test/unit/systems/systems.test.js',
    [
        'test/unit/systems/BrushBase.test.js',
        'test/unit/systems/BuildingBrush.test.js',
        'test/unit/systems/Button.test.js',
        'test/unit/systems/collisionBox2D.test.js',
        'test/unit/systems/CoordinateConverter.test.js',
        'test/unit/systems/DraggablePanelSystem.test.js',
        'test/unit/systems/EnemyAntBrush.test.js',
        'test/unit/systems/Fireball.test.js',
        'test/unit/systems/FramebufferManager.test.js',
        'test/unit/systems/GatherDebugRenderer.test.js',
        'test/unit/systems/Lightning.test.js',
        'test/unit/systems/LightningAimBrush.test.js',
        'test/unit/systems/ResourceBrush.test.js',
        'test/unit/systems/ResourceNode.test.js',
        'test/unit/systems/shapes.test.js',
        'test/unit/systems/SpatialGrid.test.js',
        'test/unit/systems/textRenderer.test.js',
        'test/unit/systems/newPathfinding.test.js',
        'test/unit/systems/pathfinding.test.js',
        'test/unit/systems/pheromones.test.js'
    ],
    'Systems'
));

// Category 7: Ants
console.log('\n[12/18] Ants & Entities (Unit Tests)');
results.push(consolidateTests(
    'test/unit/ants/ants.test.js',
    [
        'test/unit/ants/antBrain.test.js',
        'test/unit/ants/ants.test.js',
        'test/unit/ants/antStateMachine.test.js',
        'test/unit/ants/gatherState.test.js',
        'test/unit/ants/jobComponent.test.js',
        'test/unit/ants/queen.test.js',
        'test/unit/containers/entity.test.js',
        'test/unit/containers/statsContainer.test.js',
        'test/unit/containers/dropoffLocation.test.js',
        'test/unit/managers/resource.movement.test.js'
    ],
    'Ants & Entities'
));

// Category 8: Dialogue System
console.log('\n[13/18] Dialogue System (Unit Tests)');
results.push(consolidateTests(
    'test/unit/dialogue/dialogue.test.js',
    [
        'test/unit/dialogue/DialogueEvent.test.js',
        'test/unit/dialogue/dialogueEventRegistration.test.js'
    ],
    'Dialogue System'
));

// Category 9: Events System
console.log('\n[14/18] Events System (Unit Tests)');
results.push(consolidateTests(
    'test/unit/events/events.test.js',
    [
        'test/unit/events/event.test.js',
        'test/unit/events/EventFlag.test.js',
        'test/unit/events/EventFlagLayer.test.js',
        'test/unit/events/eventTrigger.test.js'
    ],
    'Events System'
));

// Category 10: Debug System
console.log('\n[15/18] Debug System (Unit Tests)');
results.push(consolidateTests(
    'test/unit/debug/debug.test.js',
    [
        'test/unit/debug/eventDebugManager.test.js',
        'test/unit/debug/tracing.test.js'
    ],
    'Debug System'
));

// Category 11: Level Editor Features
console.log('\n[16/18] Level Editor Features (Unit Tests)');
results.push(consolidateTests(
    'test/unit/levelEditor/levelEditorFeatures.test.js',
    [
        'test/unit/levelEditor/brushPanelHidden.test.js',
        'test/unit/levelEditor/brushSizeScroll.test.js',
        'test/unit/levelEditor/dialogBlocking.test.js',
        'test/unit/levelEditor/eventsPanel.test.js',
        'test/unit/levelEditor/eventsToolsPanelIntegration.test.js',
        'test/unit/levelEditor/filenameDisplay.test.js',
        'test/unit/levelEditor/fileNew.test.js',
        'test/unit/levelEditor/fileSaveExport.test.js',
        'test/unit/levelEditor/menuBlocking.test.js',
        'test/unit/levelEditor/menuInteractionBlocking.test.js',
        'test/unit/levelEditor/propertiesPanel.test.js'
    ],
    'Level Editor Features'
));

// Category 12: Terrain Utils (Missing Files)
console.log('\n[17/17] Terrain Utils (Unit Tests)');
results.push(consolidateTests(
    'test/unit/terrainUtils/terrainUtils.test.js',
    [
        'test/unit/terrainUtils/chunk.test.js',
        'test/unit/terrainUtils/coordinateSystem.test.js',
        'test/unit/terrainUtils/customLevels.test.js',
        'test/unit/terrainUtils/customTerrain.test.js',
        'test/unit/terrainUtils/grid.test.js',
        'test/unit/terrainUtils/gridTerrain.test.js',
        'test/unit/terrainUtils/gridTerrain.tileset.test.js',
        'test/unit/terrainUtils/SparseTerrain.test.js',
        'test/unit/terrainUtils/SparseTerrainCompatibility.test.js',
        'test/unit/terrainUtils/SparseTerrainSizeCustomization.test.js',
        'test/unit/terrainUtils/terrianGen.test.js'
    ],
    'Terrain Utils'
));

console.log('\n========================================');
console.log('✅ Unit Test Consolidation Complete!');
console.log('========================================');
console.log(`\nProcessed ${results.length} categories`);
console.log(`Total consolidated files: ${results.reduce((sum, r) => sum + r.sourceCount, 0)}`);
console.log(`Total tests: ${results.reduce((sum, r) => sum + r.testCount, 0)}`);
