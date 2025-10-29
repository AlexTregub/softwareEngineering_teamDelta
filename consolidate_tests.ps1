# Test Consolidation Script
# This script consolidates test files according to TEST_CONSOLIDATION_CHECKLIST.md

param(
    [string]$Category = "all",
    [switch]$DryRun = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Consolidation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to consolidate files
function Consolidate-Tests {
    param(
        [string]$TargetFile,
        [string[]]$SourceFiles,
        [string]$TestType
    )
    
    Write-Host "Consolidating $($SourceFiles.Count) files into: $TargetFile" -ForegroundColor Yellow
    
    if ($DryRun) {
        Write-Host "  [DRY RUN] Would consolidate:" -ForegroundColor Gray
        foreach ($file in $SourceFiles) {
            Write-Host "    - $file" -ForegroundColor Gray
        }
        return
    }
    
    # Collect all test content
    $allContent = @()
    $allRequires = @{}
    
    foreach ($sourceFile in $SourceFiles) {
        $fullPath = Join-Path $PSScriptRoot $sourceFile
        if (-not (Test-Path $fullPath)) {
            Write-Warning "Source file not found: $sourceFile"
            continue
        }
        
        $content = Get-Content $fullPath -Raw
        $fileName = Split-Path $sourceFile -Leaf
        $fileNameNoExt = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
        
        # Extract requires (top of file until first describe)
        if ($content -match '(?s)(^.*?)(describe\()') {
            $requires = $matches[1]
            $testContent = $content.Substring($matches[1].Length)
            
            # Collect unique requires
            $requireLines = $requires -split "`n" | Where-Object { $_ -match "require\(|const |global\." }
            foreach ($line in $requireLines) {
                $allRequires[$line.Trim()] = $true
            }
            
            # Wrap test content in describe block with original filename
            $wrappedContent = @"

// ============================================================
// Tests from: $fileName
// ============================================================
describe('$fileNameNoExt', function() {
$testContent
});
"@
            $allContent += $wrappedContent
        }
        else {
            Write-Warning "Could not parse: $sourceFile"
        }
    }
    
    # Create target file
    $targetDir = Split-Path $TargetFile -Parent
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    # Build consolidated file
    $consolidatedContent = @"
/**
 * Consolidated $TestType Tests
 * Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
 * Source files: $($SourceFiles.Count)
 */

$($allRequires.Keys -join "`n")

"@
    
    $consolidatedContent += ($allContent -join "`n")
    
    # Write to file
    Set-Content -Path (Join-Path $PSScriptRoot $TargetFile) -Value $consolidatedContent -Encoding UTF8
    Write-Host "  ✓ Created: $TargetFile" -ForegroundColor Green
}

# Category 1: Controllers
if ($Category -eq "all" -or $Category -eq "controllers") {
    Write-Host "`n[1/12] Consolidating Controllers..." -ForegroundColor Cyan
    
    $controllerFiles = @(
        "test/unit/controllers/antUtilities.test.js",
        "test/unit/controllers/cameraController.test.js",
        "test/unit/controllers/cameraManager.test.js",
        "test/unit/controllers/combatController.test.js",
        "test/unit/controllers/debugRenderer.test.js",
        "test/unit/controllers/healthController.test.js",
        "test/unit/controllers/inventoryController.test.js",
        "test/unit/controllers/keyboardInputController.test.js",
        "test/unit/controllers/mouseInputController.test.js",
        "test/unit/controllers/movementController.test.js",
        "test/unit/controllers/renderController.test.js",
        "test/unit/controllers/selectionBoxController.test.js",
        "test/unit/controllers/selectionController.test.js",
        "test/unit/controllers/taskManager.test.js",
        "test/unit/controllers/terrainController.test.js",
        "test/unit/controllers/transformController.test.js",
        "test/unit/controllers/uiSelectionController.test.js"
    )
    
    Consolidate-Tests -TargetFile "test/unit/controllers/controllers.test.js" `
                      -SourceFiles $controllerFiles `
                      -TestType "Controller"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Consolidation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
