#!/usr/bin/env node

/**
 * Integration Test Consolidation Script
 * Consolidates integration test files according to TEST_CONSOLIDATION_CHECKLIST.md
 */

const fs = require('fs');
const path = require('path');

// Helper function to consolidate test files
function consolidateTests(targetFile, sourceFiles, description) {
    console.log(`\n📦 Consolidating ${sourceFiles.length} files into: ${targetFile}`);
    
    const allContent = [];
    const commonRequires = new Set();
    const seenRequires = new Map();
    let totalTests = 0;
    
    for (const sourceFile of sourceFiles) {
        const fullPath = path.join(__dirname, sourceFile);
        
        if (!fs.existsSync(fullPath)) {
            console.warn(`  ⚠️  Source file not found: ${sourceFile}`);
            continue;
        }
        
        let content = fs.readFileSync(fullPath, 'utf8');
        const fileName = path.basename(sourceFile);
        
        // Remove common requires
        const commonPatterns = [
            /const\s+{\s*expect\s*}\s*=\s*require\(['"]chai['"]\);?\s*/g,
            /const\s+expect\s*=\s*require\(['"]chai['"]\)\.expect;?\s*/g,
            /const\s+sinon\s*=\s*require\(['"]sinon['"]\);?\s*/g,
            /const\s+{\s*JSDOM\s*}\s*=\s*require\(['"]jsdom['"]\);?\s*/g,
        ];
        
        for (const pattern of commonPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => commonRequires.add(match.trim()));
                content = content.replace(pattern, '');
            }
        }
        
        // Replace const with let
        content = content.replace(/^const\s+/gm, 'let ');
        
        // Track and comment out duplicate requires
        const requirePattern = /^(let|var)\s+(.+?)\s*=\s*require\([^)]+\);?/gm;
        content = content.replace(requirePattern, (match, keyword, varDecl) => {
            // Extract variable name (handle destructuring)
            const varMatch = varDecl.match(/^(?:\{[^}]+\}|[\w]+)/);
            if (!varMatch) return match;
            
            const key = varMatch[0].trim();
            if (seenRequires.has(key)) {
                return `// DUPLICATE REQUIRE REMOVED: ${match}`;
            }
            seenRequires.set(key, true);
            return match;
        });
        
        // Count tests
        const testCount = (content.match(/it\(/g) || []).length;
        totalTests += testCount;
        
        const wrappedContent = `
// ================================================================
// ${fileName} (${testCount} tests)
// ================================================================
${content}
`;
        
        allContent.push(wrappedContent);
        console.log(`  ✓ Processed: ${fileName} (${testCount} tests)`);
    }
    
    const targetDir = path.dirname(path.join(__dirname, targetFile));
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const header = `/**
 * Consolidated ${description} Integration Tests
 * Generated: ${new Date().toISOString()}
 * Source files: ${sourceFiles.length}
 * Total tests: ${totalTests}
 */

// Common requires
${Array.from(commonRequires).join('\n')}

`;
    
    const consolidatedContent = header + allContent.join('\n\n');
    fs.writeFileSync(path.join(__dirname, targetFile), consolidatedContent, 'utf8');
    console.log(`  ✅ Created: ${targetFile} (${totalTests} total tests)`);
    
    return { file: targetFile, sourceCount: sourceFiles.length, testCount: totalTests };
}

console.log('========================================');
console.log('📋 Integration Test Consolidation');
console.log('========================================');

const results = [];

// Category 1: UI Integration
console.log('\n[1/10] UI - Level Editor Integration');
results.push(consolidateTests(
    'test/integration/ui/levelEditor.integration.test.js',
    [
        'test/integration/ui/autoSizing.integration.test.js',
        'test/integration/ui/fixedPanelAutoSizing.integration.test.js',
        'test/integration/ui/levelEditorAutoSizing.integration.test.js',
        'test/integration/ui/levelEditorDoubleRenderPrevention.integration.test.js',
        'test/integration/ui/levelEditorPanelContentRendering.integration.test.js',
        'test/integration/ui/levelEditorPanels.integration.test.js',
        'test/integration/ui/levelEditorSidebar.integration.test.js',
        'test/integration/ui/levelEditor_dialogs.integration.test.js',
        'test/integration/ui/levelEditor_fileMenuBar.integration.test.js',
        'test/integration/ui/levelEditor_viewToggles.integration.test.js',
        'test/integration/ui/selectToolAndHoverPreview.integration.test.js',
        'test/integration/ui/terrainUI.integration.test.js',
        'test/integration/levelEditor/paintTransform.integration.test.js',
        'test/integration/levelEditor/tileRenderingInvestigation.integration.test.js',
        'test/integration/levelEditor/zoomFocusPoint.integration.test.js'
    ],
    'UI Level Editor'
));

console.log('\n[2/10] UI - Material Palette & Painting');
results.push(consolidateTests(
    'test/integration/ui/materialPalette.integration.test.js',
    [
        'test/integration/ui/materialPaletteCoordinateOffset.integration.test.js',
        'test/integration/ui/materialPalettePainting.integration.test.js',
        'test/integration/ui/gridTerrainAlignment.integration.test.js',
        'test/integration/levelEditor/completeMaterialPaintingFlow.test.js'
    ],
    'Material Palette & Painting'
));

console.log('\n[3/10] UI - Grid & Overlays');
results.push(consolidateTests(
    'test/integration/ui/gridOverlays.integration.test.js',
    [
        'test/integration/ui/dynamicGridOverlay.integration.test.js',
        'test/integration/ui/gridEdgeDetection.integration.test.js',
        'test/integration/ui/gridOverlay.v2.integration.test.js',
        'test/integration/ui/sparseTerrainMinimap.integration.test.js'
    ],
    'Grid & Overlays'
));

console.log('\n[4/10] UI - Panel System');
results.push(consolidateTests(
    'test/integration/ui/panels.integration.test.js',
    [
        'test/integration/ui/draggablePanel.growth.integration.test.js',
        'test/integration/ui/panelSizingIssues.integration.test.js',
        'test/integration/ui/scrollableContentArea.integration.test.js',
        'test/integration/ui/scrollIndicator.integration.test.js',
        'test/integration/ui/UIObject.integration.test.js',
        'test/integration/ui/propertiesPanelIntegration.test.js'
    ],
    'Panel System'
));

console.log('\n[5/10] Events Integration');
results.push(consolidateTests(
    'test/integration/events/events.integration.test.js',
    [
        'test/integration/events/eventManager.integration.test.js',
        'test/integration/events/eventSystem.integration.test.js',
        'test/integration/dialogue/dialogueEvent.integration.test.js',
        'test/integration/dialogue/eventEditorPanelDisplay.integration.test.js',
        'test/integration/ui/eventEditorDragToPlace.integration.test.js',
        'test/integration/ui/eventEditorPanel.integration.test.js',
        'test/integration/levelEditor/dragAndDrop.integration.test.js',
        'test/integration/levelEditor/eventDragWorkflow.integration.test.js',
        'test/integration/levelEditor/eventsPanel.integration.test.js',
        'test/integration/levelEditor/eventsPanelToggleBug.integration.test.js',
        'test/integration/levelEditor/propertiesPanel.integration.test.js'
    ],
    'Events System'
));

console.log('\n[6/10] File I/O Integration');
results.push(consolidateTests(
    'test/integration/io/fileIO.integration.test.js',
    [
        'test/integration/levelEditor/brushSizeMenu.integration.test.js',
        'test/integration/levelEditor/brushSizeScroll.integration.test.js',
        'test/integration/io/fileMenuBar_saveLoad.integration.test.js',
        'test/integration/ui/fileMenuBar.integration.test.js',
        'test/integration/levelEditor/filenameDisplay.integration.test.js',
        'test/integration/levelEditor/fileNew.integration.test.js',
        'test/integration/levelEditor/fileSaveExport.integration.test.js'
    ],
    'File I/O'
));

console.log('\n[7/10] Menu & Interaction');
results.push(consolidateTests(
    'test/integration/ui/menuInteraction.integration.test.js',
    [
        'test/integration/levelEditor/menuBlocking.integration.test.js',
        'test/integration/levelEditor/menuInteraction.integration.test.js',
        'test/integration/levelEditor/menuToLevelEditor.integration.test.js',
        'test/integration/levelEditor/scriptLoadingOrder.integration.test.js'
    ],
    'Menu & Interaction'
));

console.log('\n[8/10] Terrain Integration');
results.push(consolidateTests(
    'test/integration/terrain/terrain.integration.test.js',
    [
        'test/integration/terrain/customTerrain.imageMode.integration.test.js',
        'test/integration/terrain/gridTerrain.imageMode.integration.test.js',
        'test/integration/terrainUtils/fillBoundsLimit.integration.test.js',
        'test/integration/terrainUtils/gridTerrain.integration.test.js',
        'test/integration/terrainUtils/sizeCustomization.integration.test.js',
        'test/integration/terrainUtils/sparseTerrain.integration.test.js',
        'test/integration/terrainUtils/terrainSystem.integration.test.js',
        'test/integration/levelEditor/sparseTerrainIntegration.test.js'
    ],
    'Terrain'
));

console.log('\n[9/10] Rendering Integration');
results.push(consolidateTests(
    'test/integration/rendering/rendering.integration.test.js',
    [
        'test/integration/rendering/cacheManager.integration.test.js',
        'test/integration/rendering/CacheManager.tiled-integration.test.js',
        'test/integration/rendering/cameraTransform.integration.test.js',
        'test/integration/rendering/infiniteCanvas.integration.test.js',
        'test/integration/rendering/levelEditorRenderIntegration.test.js',
        'test/integration/rendering/renderController.integration.test.js',
        'test/integration/rendering/renderLayerManager.integration.test.js',
        'test/integration/levelEditor/rootCauseAnalysis.test.js',
        'test/integration/levelEditor/rootCauseFound_duplicateRenderMethods.test.js'
    ],
    'Rendering'
));

console.log('\n[10/10] Misc Integration (Debug, Entities, Maps, Managers)');
results.push(consolidateTests(
    'test/integration/misc/misc.integration.test.js',
    [
        'test/integration/debug/eventDebugManager.integration.test.js',
        'test/integration/entities/ant.controllers.integration.test.js',
        'test/integration/entities/entity.integration.test.js',
        'test/integration/maps/activeMap.integration.test.js',
        'test/integration/managers/soundManager.integration.test.js'
    ],
    'Miscellaneous'
));

console.log('\n========================================');
console.log('✅ Integration Test Consolidation Complete!');
console.log('========================================');
console.log(`\nProcessed ${results.length} categories`);
console.log(`Total consolidated files: ${results.reduce((sum, r) => sum + r.sourceCount, 0)}`);
console.log(`Total tests: ${results.reduce((sum, r) => sum + r.testCount, 0)}`);
