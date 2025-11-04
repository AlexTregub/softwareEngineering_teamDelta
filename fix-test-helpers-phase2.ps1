# Phase 2: Add setupTestEnvironment() calls and cleanupTestEnvironment() in afterEach
# This script adds the actual helper calls to files that had imports added

$files = @(
    'test\integration\ui\newMapDialog.integration.test.js',
    'test\integration\ui\levelEditor_sidebar.integration.test.js',
    'test\integration\ui\levelEditorPanels_sidebar.integration.test.js',
    'test\integration\ui\entityPaletteUIIntegration.integration.test.js',
    'test\integration\ui\entityPaletteToastIntegration.integration.test.js',
    'test\integration\ui\entityPaletteModalIntegration.integration.test.js',
    'test\integration\ui\entityPaletteKeyboardShortcuts.integration.test.js',
    'test\integration\ui\entityPaletteCursorFollowing.integration.test.js',
    'test\integration\ui\entityPaintingTools.integration.test.js',
    'test\integration\ui\entityPainterPanelToggle.integration.test.js',
    'test\integration\ui\customEntitiesFullWorkflow.integration.test.js'
)

Write-Host "Adding setupTestEnvironment() calls..." -ForegroundColor Cyan
Write-Host ""

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "  SKIP: $file (not found)" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "Processing: $file" -ForegroundColor Green
    
    $content = Get-Content $fullPath -Raw
    
    # Add setupTestEnvironment() after the import
    if ($content -match "const \{ setupTestEnvironment, cleanupTestEnvironment \} = require\('\.\.\/\.\.\/helpers\/mvcTestHelpers'\);") {
        # Add the setup call after the import
        $content = $content -replace "(const \{ setupTestEnvironment, cleanupTestEnvironment \} = require\('\.\.\/\.\.\/helpers\/mvcTestHelpers'\);)", "`$1`n`n// Setup test environment`nsetupTestEnvironment({ rendering: true });"
        Write-Host "  + Added setupTestEnvironment() call" -ForegroundColor Gray
    }
    
    # Find describe blocks and add afterEach if missing
    $lines = $content -split "`n"
    $newLines = @()
    $inDescribe = $false
    $describeIndent = 0
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $newLines += $line
        
        # Detect describe block start
        if ($line -match "^(\s*)describe\(" -and $line -match "\{$") {
            $inDescribe = $true
            $describeIndent = $matches[1].Length
            
            # Check if next few lines already have afterEach
            $hasAfterEach = $false
            for ($j = $i + 1; $j -lt [Math]::Min($i + 10, $lines.Count); $j++) {
                if ($lines[$j] -match "afterEach\(") {
                    $hasAfterEach = $true
                    break
                }
            }
            
            # Add afterEach if missing
            if (-not $hasAfterEach) {
                $indent = " " * ($describeIndent + 2)
                $newLines += ""
                $newLines += "$indent  afterEach(function() {"
                $newLines += "$indent    cleanupTestEnvironment();"
                $newLines += "$indent  });"
                Write-Host "  + Added afterEach() hook at line $($i+1)" -ForegroundColor Gray
            }
        }
    }
    
    $newContent = $newLines -join "`n"
    
    if ($newContent -ne $content) {
        Set-Content $fullPath $newContent -NoNewline
        Write-Host "  [OK] Modified" -ForegroundColor Green
    } else {
        Write-Host "  [SKIP] No changes needed" -ForegroundColor DarkGray
    }
    
    Write-Host ""
}

Write-Host "Phase 2 complete!" -ForegroundColor Cyan
Write-Host "Run: npm run lint:test:integration" -ForegroundColor White
