# Phase 3: Delete remaining violating code (not just comment)
# This script REMOVES lines that ESLint is still catching

$files = @(
    'test\integration\ui\panels.integration.test.js',
    'test\integration\ui\menuInteraction.integration.test.js',
    'test\integration\ui\materialPalette.integration.test.js',
    'test\integration\ui\levelEditor.integration.test.js',
    'test\integration\ui\gridOverlays.integration.test.js'
)

Write-Host "Phase 3: Removing remaining violating lines..." -ForegroundColor Cyan
Write-Host ""

$stats = @{
    FilesProcessed = 0
    FilesModified = 0
    LinesRemoved = 0
}

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "  [SKIP] $file (not found)" -ForegroundColor Yellow
        continue
    }
    
    $stats.FilesProcessed++
    Write-Host "Processing: $file" -ForegroundColor White
    
    $content = Get-Content $fullPath -Raw
    $originalLength = $content.Length
    $linesRemoved = 0
    
    # Read line by line
    $lines = Get-Content $fullPath
    $newLines = @()
    $skipCount = 0
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $shouldSkip = $false
        
        # Check if line contains violations
        if ($line -match "let \{ JSDOM \} = require\('jsdom'\)") {
            Write-Host "  - Removed: JSDOM import (line $($i+1))" -ForegroundColor Green
            $shouldSkip = $true
            $linesRemoved++
        }
        elseif ($line -match "const \{ JSDOM \} = require") {
            Write-Host "  - Removed: JSDOM import (line $($i+1))" -ForegroundColor Green
            $shouldSkip = $true
            $linesRemoved++
        }
        elseif ($line -match "// REMOVED:.*new JSDOM") {
            Write-Host "  - Removed: Commented JSDOM creation (line $($i+1))" -ForegroundColor Green
            $shouldSkip = $true
            $linesRemoved++
        }
        elseif ($line -match "// REMOVED:.*global\.window") {
            Write-Host "  - Removed: Commented global.window (line $($i+1))" -ForegroundColor Green
            $shouldSkip = $true
            $linesRemoved++
        }
        elseif ($line -match "// REMOVED:.*global\.document") {
            Write-Host "  - Removed: Commented global.document (line $($i+1))" -ForegroundColor Green
            $shouldSkip = $true
            $linesRemoved++
        }
        elseif ($line -match "sinon\.restore\(\)") {
            Write-Host "  - Replaced: sinon.restore() -> cleanupTestEnvironment() (line $($i+1))" -ForegroundColor Green
            $line = $line -replace "sinon\.restore\(\)", "cleanupTestEnvironment()"
            $linesRemoved++
        }
        
        if (-not $shouldSkip) {
            $newLines += $line
        }
    }
    
    if ($linesRemoved -gt 0) {
        # Write back to file
        $newLines | Out-File -FilePath $fullPath -Encoding UTF8
        $stats.FilesModified++
        $stats.LinesRemoved += $linesRemoved
        Write-Host "  [OK] Removed $linesRemoved lines" -ForegroundColor Green
    } else {
        Write-Host "  [SKIP] No changes needed" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Phase 3 Complete!" -ForegroundColor Green
Write-Host "Files Processed: $($stats.FilesProcessed)" -ForegroundColor White
Write-Host "Files Modified:  $($stats.FilesModified)" -ForegroundColor White
Write-Host "Lines Removed:   $($stats.LinesRemoved)" -ForegroundColor White
Write-Host "===============================================" -ForegroundColor Cyan
