# Move original test files to backup
# Keep only the consolidated files

$backupDir = "test/_backup_original_unit_tests"
$consolidatedFiles = @(
    "test/unit/controllers/controllers.test.js",
    "test/unit/ui/panels.test.js",
    "test/unit/ui/levelEditor.test.js",
    "test/unit/ui/fileDialogs.test.js",
    "test/unit/ui/gridAndMinimap.test.js",
    "test/unit/ui/menusAndButtons.test.js",
    "test/unit/managers/managers.test.js",
    "test/unit/terrain/terrain.test.js",
    "test/unit/terrainUtils/terrainEditor.test.js",
    "test/unit/rendering/rendering.test.js",
    "test/unit/systems/systems.test.js",
    "test/unit/ants/ants.test.js"
)

Write-Host "Moving original test files to backup..." -ForegroundColor Cyan

$movedCount = 0
$skippedCount = 0

# Get all .test.js files
$allTestFiles = Get-ChildItem -Path "test/unit" -Recurse -Filter "*.test.js"

foreach ($file in $allTestFiles) {
    $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
    
    # Skip if it's one of our consolidated files
    if ($consolidatedFiles -contains $relativePath) {
        Write-Host "  KEEP: $relativePath" -ForegroundColor Green
        $skippedCount++
        continue
    }
    
    # Skip sketch.test.js and gridTerrain.imageMode.test.js (root level tests)
    if ($file.Name -eq "sketch.test.js" -or $file.Name -eq "gridTerrain.imageMode.test.js") {
        Write-Host "  KEEP: $relativePath (root test)" -ForegroundColor Green
        $skippedCount++
        continue
    }
    
    # Move to backup
    $relativeDirFromUnit = $file.DirectoryName.Substring((Resolve-Path "test/unit").Path.Length)
    if ($relativeDirFromUnit.StartsWith("\")) {
        $relativeDirFromUnit = $relativeDirFromUnit.Substring(1)
    }
    
    $backupSubDir = Join-Path $backupDir $relativeDirFromUnit
    
    if (-not (Test-Path $backupSubDir)) {
        New-Item -ItemType Directory -Path $backupSubDir -Force | Out-Null
    }
    
    $destination = Join-Path $backupSubDir $file.Name
    Move-Item -Path $file.FullName -Destination $destination -Force
    Write-Host "  MOVED: $relativePath → backup" -ForegroundColor Yellow
    $movedCount++
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "File Movement Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Kept (consolidated): $skippedCount files" -ForegroundColor Green
Write-Host "Moved to backup: $movedCount files" -ForegroundColor Yellow
Write-Host "Backup location: $backupDir" -ForegroundColor Cyan
