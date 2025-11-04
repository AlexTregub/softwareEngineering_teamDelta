# Phase 4: Comprehensive fix for ALL remaining integration test files
# This script removes duplicate JSDOM/sinon code and adds test helper setup

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 4: Comprehensive Test Helper Migration" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$stats = @{
    FilesProcessed = 0
    FilesModified = 0
    LinesRemoved = 0
    LinesAdded = 0
    ImportsAdded = 0
    AfterEachAdded = 0
}

# Get all integration test files with violations
Write-Host "Finding files with violations..." -ForegroundColor Yellow
$errorOutput = npm run lint:test:integration 2>&1 | Out-String
$fileMatches = [regex]::Matches($errorOutput, "([A-Z]:\\[^:]+\.test\.js)")
$files = $fileMatches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique | Where-Object { Test-Path $_ }

Write-Host "Found $($files.Count) files with violations" -ForegroundColor Green
Write-Host ""

foreach ($filePath in $files) {
    $relativePath = $filePath -replace [regex]::Escape($PSScriptRoot), ""
    $relativePath = $relativePath.TrimStart('\')
    
    $stats.FilesProcessed++
    Write-Host "[$($stats.FilesProcessed)/$($files.Count)] Processing: $relativePath" -ForegroundColor White
    
    $lines = Get-Content $filePath
    $newLines = @()
    $modified = $false
    $hasImport = $false
    $firstDescribeIndex = -1
    $hasAfterEach = $false
    
    # First pass: check for existing import and afterEach
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "setupTestEnvironment.*cleanupTestEnvironment") {
            $hasImport = $true
        }
        if ($lines[$i] -match "^\s*describe\(" -and $firstDescribeIndex -eq -1) {
            $firstDescribeIndex = $i
            # Check next 20 lines for afterEach
            for ($j = $i; $j -lt [Math]::Min($i + 20, $lines.Count); $j++) {
                if ($lines[$j] -match "afterEach.*cleanupTestEnvironment") {
                    $hasAfterEach = $true
                    break
                }
            }
        }
    }
    
    $linesRemoved = 0
    $importsToAdd = @()
    
    # Second pass: process file line by line
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $shouldSkip = $false
        
        # Remove JSDOM imports (all variations)
        if ($line -match "^\s*(const|let|var)\s*\{\s*JSDOM\s*\}\s*=\s*require\(['\`"]jsdom['\`"]\)") {
            Write-Host "  - Removed: JSDOM import (line $($i+1))" -ForegroundColor DarkGray
            $shouldSkip = $true
            $linesRemoved++
            $modified = $true
            if (-not $hasImport) {
                $importsToAdd += "setupTestEnvironment"
            }
        }
        # Remove sinon imports (if unused)
        elseif ($line -match "^\s*(const|let|var)\s+sinon\s*=\s*require\(['\`"]sinon['\`"]\)") {
            # Keep sinon import, but flag for checking
        }
        # Remove commented JSDOM creation
        elseif ($line -match "//\s*REMOVED:.*new JSDOM|//\s*dom\s*=\s*new JSDOM") {
            Write-Host "  - Removed: Commented JSDOM creation (line $($i+1))" -ForegroundColor DarkGray
            $shouldSkip = $true
            $linesRemoved++
            $modified = $true
        }
        # Remove active JSDOM creation
        elseif ($line -match "^\s*(const|let|var)?\s*dom\s*=\s*new JSDOM") {
            Write-Host "  - Removed: JSDOM creation (line $($i+1))" -ForegroundColor DarkGray
            $shouldSkip = $true
            $linesRemoved++
            $modified = $true
        }
        # Remove commented global assignments
        elseif ($line -match "//\s*REMOVED:.*global\.(window|document)") {
            Write-Host "  - Removed: Commented global assignment (line $($i+1))" -ForegroundColor DarkGray
            $shouldSkip = $true
            $linesRemoved++
            $modified = $true
        }
        # Remove active global.window assignments
        elseif ($line -match "^\s*global\.window\s*=") {
            Write-Host "  - Removed: global.window assignment (line $($i+1))" -ForegroundColor DarkGray
            $shouldSkip = $true
            $linesRemoved++
            $modified = $true
        }
        # Remove active global.document assignments
        elseif ($line -match "^\s*global\.document\s*=") {
            Write-Host "  - Removed: global.document assignment (line $($i+1))" -ForegroundColor DarkGray
            $shouldSkip = $true
            $linesRemoved++
            $modified = $true
        }
        # Replace sinon.restore() with cleanupTestEnvironment()
        elseif ($line -match "sinon\.restore\(\)") {
            $newLine = $line -replace "sinon\.restore\(\)", "cleanupTestEnvironment()"
            Write-Host "  - Replaced: sinon.restore() -> cleanupTestEnvironment() (line $($i+1))" -ForegroundColor DarkGray
            $newLines += $newLine
            $modified = $true
            if (-not $hasImport) {
                $importsToAdd += "cleanupTestEnvironment"
            }
            continue
        }
        # Remove manual p5.Vector creation
        elseif ($line -match "new p5\.Vector\(") {
            Write-Host "  - Warning: Manual p5.Vector usage found (line $($i+1)) - may need createVector()" -ForegroundColor Yellow
        }
        
        if (-not $shouldSkip) {
            $newLines += $line
        }
    }
    
    # Add imports if needed and not already present
    if ($importsToAdd.Count -gt 0 -and -not $hasImport) {
        $importLine = "const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');"
        
        # Find where to insert import (after other requires, before first describe)
        $insertIndex = 0
        for ($i = 0; $i -lt $newLines.Count; $i++) {
            if ($newLines[$i] -match "^\s*const|^\s*let|^\s*var") {
                $insertIndex = $i + 1
            }
            if ($newLines[$i] -match "^\s*describe\(") {
                break
            }
        }
        
        # Insert import with blank line
        $newLines = $newLines[0..($insertIndex-1)] + "" + $importLine + "" + $newLines[$insertIndex..($newLines.Count-1)]
        Write-Host "  + Added: Test helper imports" -ForegroundColor Green
        $stats.ImportsAdded++
        $modified = $true
        $hasImport = $true
    }
    
    # Add setupTestEnvironment() call if import was added
    if ($hasImport -and -not ($newLines -match "setupTestEnvironment\(")) {
        # Find first describe block
        for ($i = 0; $i -lt $newLines.Count; $i++) {
            if ($newLines[$i] -match "^\s*describe\(") {
                # Insert before describe
                $newLines = $newLines[0..($i-1)] + "setupTestEnvironment({ rendering: true });" + "" + $newLines[$i..($newLines.Count-1)]
                Write-Host "  + Added: setupTestEnvironment() call" -ForegroundColor Green
                $stats.LinesAdded++
                $modified = $true
                break
            }
        }
    }
    
    # Add afterEach() hook if needed
    if ($hasImport -and -not $hasAfterEach) {
        # Find first describe block
        for ($i = 0; $i -lt $newLines.Count; $i++) {
            if ($newLines[$i] -match "^\s*describe\(") {
                # Get indentation
                $indent = "  "
                if ($newLines[$i] -match "^(\s*)describe") {
                    $indent = $matches[1] + "  "
                }
                
                # Find opening brace and insert after it
                for ($j = $i; $j -lt [Math]::Min($i + 5, $newLines.Count); $j++) {
                    if ($newLines[$j] -match "\{") {
                        # Check if afterEach already exists in next 10 lines
                        $hasExisting = $false
                        for ($k = $j; $k -lt [Math]::Min($j + 10, $newLines.Count); $k++) {
                            if ($newLines[$k] -match "afterEach") {
                                $hasExisting = $true
                                break
                            }
                        }
                        
                        if (-not $hasExisting) {
                            $afterEachBlock = @(
                                "",
                                "$($indent)afterEach(function() {",
                                "$($indent)  cleanupTestEnvironment();",
                                "$($indent)});"
                            )
                            $newLines = $newLines[0..$j] + $afterEachBlock + $newLines[($j+1)..($newLines.Count-1)]
                            Write-Host "  + Added: afterEach() hook" -ForegroundColor Green
                            $stats.AfterEachAdded++
                            $modified = $true
                        }
                        break
                    }
                }
                break
            }
        }
    }
    
    # Write back if modified
    if ($modified) {
        $newLines | Out-File -FilePath $filePath -Encoding UTF8
        $stats.FilesModified++
        $stats.LinesRemoved += $linesRemoved
        Write-Host "  [OK] Modified ($linesRemoved lines removed)" -ForegroundColor Green
    } else {
        Write-Host "  [SKIP] No changes needed" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 4 Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Files Processed:     $($stats.FilesProcessed)" -ForegroundColor White
Write-Host "Files Modified:      $($stats.FilesModified)" -ForegroundColor White
Write-Host "Lines Removed:       $($stats.LinesRemoved)" -ForegroundColor White
Write-Host "Imports Added:       $($stats.ImportsAdded)" -ForegroundColor White
Write-Host "AfterEach Added:     $($stats.AfterEachAdded)" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next step: Run linting to verify" -ForegroundColor Yellow
Write-Host "  npm run lint:test:integration" -ForegroundColor Cyan
