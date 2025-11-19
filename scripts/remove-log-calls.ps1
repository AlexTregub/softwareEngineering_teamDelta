# Script to remove logNormal, logQuiet, and logVerbose lines from JavaScript files
# Usage: .\scripts\remove-log-calls.ps1

param(
    [string]$Path = ".",
    [switch]$DryRun = $false
)

Write-Host "Searching for log function calls..." -ForegroundColor Cyan

# Get all JavaScript files, excluding node_modules and libraries
$jsFiles = Get-ChildItem -Path $Path -Recurse -Include *.js -Exclude *.min.js | 
    Where-Object { 
        $_.FullName -notmatch 'node_modules' -and 
        $_.FullName -notmatch 'libraries' -and
        $_.FullName -notmatch '\.vscode'
    }

$totalFiles = 0
$totalLines = 0

foreach ($file in $jsFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    
    # Remove lines containing logNormal, logQuiet, or logVerbose
    # This regex matches entire lines that contain these function calls
    $newContent = $content -split "`r?`n" | Where-Object {
        $_ -notmatch '^\s*logNormal\s*\(' -and
        $_ -notmatch '^\s*logQuiet\s*\(' -and
        $_ -notmatch '^\s*logVerbose\s*\(' -and
        $_ -notmatch '\blogNormal\s*\(' -and
        $_ -notmatch '\blogQuiet\s*\(' -and
        $_ -notmatch '\blogVerbose\s*\('
    } | Out-String
    
    # Count removed lines
    $originalLines = ($originalContent -split "`r?`n").Count
    $newLines = ($newContent -split "`r?`n").Count
    $removedLines = $originalLines - $newLines
    
    if ($removedLines -gt 0) {
        $totalFiles++
        $totalLines += $removedLines
        
        Write-Host "  $($file.FullName.Replace($PWD.Path + '\', ''))" -ForegroundColor Yellow
        Write-Host "    Removed $removedLines line(s)" -ForegroundColor Green
        
        if (-not $DryRun) {
            # Trim trailing whitespace and save
            $newContent = $newContent.TrimEnd()
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
        }
    }
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "  Files modified: $totalFiles" -ForegroundColor Green
Write-Host "  Lines removed: $totalLines" -ForegroundColor Green

if ($DryRun) {
    Write-Host "`n(Dry run - no files were modified)" -ForegroundColor Yellow
    Write-Host "Run without -DryRun to apply changes" -ForegroundColor Yellow
} else {
    Write-Host "`nDone!" -ForegroundColor Green
}
