# Batch fix test files to use setupTestEnvironment() instead of manual JSDOM/sinon.restore()
# Usage: .\fix-test-helpers.ps1

$files = @(
    'test\integration\ui\panels.integration.test.js',
    'test\integration\ui\menuInteraction.integration.test.js',
    'test\integration\ui\newMapDialog.integration.test.js',
    'test\integration\ui\materialPalette.integration.test.js',
    'test\integration\ui\levelEditor_sidebar.integration.test.js',
    'test\integration\ui\levelEditorPanels_sidebar.integration.test.js',
    'test\integration\ui\levelEditor.integration.test.js',
    'test\integration\ui\gridOverlays.integration.test.js',
    'test\integration\ui\entityPaletteUIIntegration.integration.test.js',
    'test\integration\ui\entityPaletteToastIntegration.integration.test.js',
    'test\integration\ui\entityPaletteModalIntegration.integration.test.js',
    'test\integration\ui\entityPaletteKeyboardShortcuts.integration.test.js',
    'test\integration\ui\entityPaletteCursorFollowing.integration.test.js',
    'test\integration\ui\entityPaintingTools.integration.test.js',
    'test\integration\ui\entityPainterPanelToggle.integration.test.js',
    'test\integration\ui\customEntitiesFullWorkflow.integration.test.js'
)

$replacements = @{
    # Remove sinon.restore() calls
    '    sinon.restore();' = '    cleanupTestEnvironment();'
    '  sinon.restore();' = '  cleanupTestEnvironment();'
    
    # Remove JSDOM imports
    "const { JSDOM } = require('jsdom');" = ''
    'const { JSDOM } = require("jsdom");' = ''
    
    # Remove manual JSDOM creation (various patterns)
    'dom = new JSDOM' = '// REMOVED: dom = new JSDOM'
    'const dom = new JSDOM' = '// REMOVED: const dom = new JSDOM'
    'let dom = new JSDOM' = '// REMOVED: let dom = new JSDOM'
    
    # Remove global assignments
    'global.window = dom.window;' = '// REMOVED: global.window = dom.window;'
    'global.document = dom.window.document;' = '// REMOVED: global.document = dom.window.document;'
    'global.window = window;' = '// REMOVED: global.window = window;'
    'global.document = document;' = '// REMOVED: global.document = document;'
    'global.window = {' = '// REMOVED: global.window = {'
    '  global.window = {' = '  // REMOVED: global.window = {'
    'global.window = global;' = '// REMOVED: global.window = global;'
}

$stats = @{
    FilesProcessed = 0
    FilesModified = 0
    TotalReplacements = 0
}

Write-Host "Starting batch fix of test files..." -ForegroundColor Cyan
Write-Host ""

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "  SKIP: $file (not found)" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "Processing: $file" -ForegroundColor Green
    $stats.FilesProcessed++
    
    $content = Get-Content $fullPath -Raw
    $originalContent = $content
    $fileReplacements = 0
    
    # Check if file needs setupTestEnvironment import
    $needsImport = $false
    if ($content -match 'new JSDOM|sinon\.restore\(\)') {
        if ($content -notmatch 'setupTestEnvironment') {
            $needsImport = $true
        }
    }
    
    # Add import if needed
    if ($needsImport) {
        # Find first require statement and add after it
        if ($content -match "const \{ expect \} = require\('chai'\);") {
            $content = $content -replace "(const \{ expect \} = require\('chai'\);)", "`$1`nconst { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');"
            $fileReplacements++
            Write-Host "  + Added setupTestEnvironment import" -ForegroundColor Gray
        }
    }
    
    # Apply all replacements
    foreach ($pattern in $replacements.Keys) {
        $replacement = $replacements[$pattern]
        $matchCount = ([regex]::Matches($content, [regex]::Escape($pattern))).Count
        if ($matchCount -gt 0) {
            $content = $content -replace [regex]::Escape($pattern), $replacement
            $fileReplacements += $matchCount
            Write-Host "  - Replaced '$pattern' ($matchCount occurrences)" -ForegroundColor Gray
        }
    }
    
    # Save if modified
    if ($content -ne $originalContent) {
        Set-Content $fullPath $content -NoNewline
        $stats.FilesModified++
        $stats.TotalReplacements += $fileReplacements
        Write-Host "  [OK] Modified ($fileReplacements replacements)" -ForegroundColor Green
    } else {
        Write-Host "  [SKIP] No changes needed" -ForegroundColor DarkGray
    }
    
    Write-Host ""
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Batch Fix Summary:" -ForegroundColor Cyan
Write-Host "  Files Processed:    $($stats.FilesProcessed)" -ForegroundColor White
Write-Host "  Files Modified:     $($stats.FilesModified)" -ForegroundColor Green
Write-Host "  Total Replacements: $($stats.TotalReplacements)" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review changes: git diff" -ForegroundColor White
Write-Host "  2. Run linter: npm run lint:test:integration" -ForegroundColor White
Write-Host "  3. Run tests: npm test" -ForegroundColor White
