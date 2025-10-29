# Restore files from backup before consolidation
Write-Host "Restoring original test files from backup..." -ForegroundColor Cyan

$backupDir = "test\_backup_original_unit_tests"
$targetDir = "test\unit"

# Get all files from backup
$files = Get-ChildItem -Path $backupDir -File -Recurse

Write-Host "`nRestoring $($files.Count) files..." -ForegroundColor Yellow

foreach ($file in $files) {
    # Calculate relative path from backup root
    $relativePath = $file.FullName.Substring((Get-Item $backupDir).FullName.Length + 1)
    
    # Target path in test/unit
    $targetPath = Join-Path $targetDir $relativePath
    
    # Ensure directory exists
    $targetDir = Split-Path $targetPath -Parent
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    # Copy file
    Copy-Item -Path $file.FullName -Destination $targetPath -Force
    Write-Host "  RESTORED: $relativePath" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Restore Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Restored: $($files.Count) files" -ForegroundColor Cyan
