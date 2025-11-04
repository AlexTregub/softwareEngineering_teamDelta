# Phase 5: Fix parsing errors (broken object literals)
# Finds and removes orphaned object properties after global.window/document removal

Write-Host "Phase 5: Fixing parsing errors..." -ForegroundColor Cyan
Write-Host ""

# Get all files with parsing errors
$errorOutput = npm run lint:test:integration 2>&1 | Out-String
$lines = $errorOutput -split "`n"

$filesWithErrors = @{}

foreach ($line in $lines) {
    if ($line -match "^([A-Z]:\\[^:]+\.test\.js)") {
        $currentFile = $matches[1]
    }
    if ($line -match "Parsing error: Unexpected token" -and $currentFile) {
        if (-not $filesWithErrors.ContainsKey($currentFile)) {
            $filesWithErrors[$currentFile] = @()
        }
        # Extract line number
        if ($line -match "^\s*(\d+):\d+") {
            $filesWithErrors[$currentFile] += [int]$matches[1]
        }
    }
}

Write-Host "Found $($filesWithErrors.Count) files with parsing errors" -ForegroundColor Yellow
Write-Host ""

$stats = @{
    FilesFixed = 0
    LinesRemoved = 0
}

foreach ($filePath in $filesWithErrors.Keys) {
    $relativePath = $filePath -replace [regex]::Escape($PSScriptRoot), ""
    $relativePath = $relativePath.TrimStart('\')
    
    Write-Host "Processing: $relativePath" -ForegroundColor White
    
    $lines = Get-Content $filePath
    $newLines = @()
    $modified = $false
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $shouldSkip = $false
        
        # Check for orphaned object properties (lines starting with just property: value)
        # These appear after global.window = { was removed
        if ($line -match "^\s+(innerWidth|innerHeight|document|localStorage|location):\s*") {
            Write-Host "  - Removed: Orphaned property '$($matches[1])' (line $($i+1))" -ForegroundColor DarkGray
            $shouldSkip = $true
            $modified = $true
            $stats.LinesRemoved++
        }
        # Check for orphaned closing brace that belonged to removed object
        elseif ($line -match "^\s*\};\s*$" -and $i -gt 0) {
            # Check if previous line is also orphaned or was removed
            $prevLine = $lines[$i-1]
            if ($prevLine -match "^\s+(innerWidth|innerHeight|document|localStorage):" -or 
                $prevLine -match "^\s*$") {
                Write-Host "  - Removed: Orphaned closing brace (line $($i+1))" -ForegroundColor DarkGray
                $shouldSkip = $true
                $modified = $true
                $stats.LinesRemoved++
            }
        }
        
        if (-not $shouldSkip) {
            $newLines += $line
        }
    }
    
    if ($modified) {
        $newLines | Out-File -FilePath $filePath -Encoding UTF8
        $stats.FilesFixed++
        Write-Host "  [OK] Fixed" -ForegroundColor Green
    } else {
        Write-Host "  [SKIP] No orphaned properties found" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 5 Complete!" -ForegroundColor Green
Write-Host "Files Fixed:    $($stats.FilesFixed)" -ForegroundColor White
Write-Host "Lines Removed:  $($stats.LinesRemoved)" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan
