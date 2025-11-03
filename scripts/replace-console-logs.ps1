# Replace console.log with verboseLog across the codebase
# This script preserves test files that intentionally suppress logging

Write-Host "`n=== Console.log to verboseLog Replacement ===" -ForegroundColor Cyan
Write-Host "This will replace console.log calls with logNormal() for verbose logging control`n" -ForegroundColor Yellow

# Define file patterns to process
$includePaths = @(
    "Classes/**/*.js",
    "sketch.js",
    "debug/**/*.js"
)

# Define file patterns to exclude (tests often need to suppress or mock console)
$excludePatterns = @(
    "**/test/**",
    "**/tests/**",
    "**/*.test.js",
    "**/*.spec.js",
    "**/node_modules/**"
)

# Get all JavaScript files
$files = Get-ChildItem -Path . -Include *.js -Recurse | Where-Object {
    $filePath = $_.FullName
    $include = $false
    
    # Check if file matches include patterns
    foreach ($pattern in $includePaths) {
        if ($filePath -like "*$($pattern.Replace('/**', '*').Replace('/', '\'))*") {
            $include = $true
            break
        }
    }
    
    # Exclude test files
    foreach ($pattern in $excludePatterns) {
        if ($filePath -like "*$($pattern.Replace('/**', '*').Replace('/', '\'))*") {
            $include = $false
            break
        }
    }
    
    $include
}

$filesProcessed = 0
$totalReplacements = 0

Write-Host "Found $($files.Count) files to process`n" -ForegroundColor Green

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    
    # Skip if file already uses logNormal extensively
    if ($content -match "logNormal\(" -and $content -notmatch "console\.log\(") {
        Write-Host "  ⏭️  Skipping (already uses logNormal): $($file.Name)" -ForegroundColor Gray
        continue
    }
    
    # Count replacements in this file
    $matches = [regex]::Matches($content, "console\.log\(")
    $count = $matches.Count
    
    if ($count -eq 0) {
        continue
    }
    
    # Replace console.log with logNormal
    # Handles both single and multi-line console.log statements
    $content = $content -replace "console\.log\(", "logNormal("
    
    # Write back to file
    Set-Content -Path $file.FullName -Value $content -NoNewline
    
    $filesProcessed++
    $totalReplacements += $count
    
    Write-Host "  ✅ $($file.Name): $count replacement(s)" -ForegroundColor Green
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Files processed: $filesProcessed" -ForegroundColor Green
Write-Host "Total replacements: $totalReplacements" -ForegroundColor Green
Write-Host "`nNote: Test files were intentionally skipped to preserve test infrastructure`n" -ForegroundColor Yellow
