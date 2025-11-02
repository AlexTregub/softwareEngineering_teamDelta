# Script to test all integration test files individually and report status

$testFiles = Get-ChildItem -Path "test\integration" -Filter "*.test.js" -Recurse

$passingFiles = @()
$failingFiles = @()

Write-Host "Testing $($testFiles.Count) integration test files..." -ForegroundColor Cyan
Write-Host ""

foreach ($file in $testFiles) {
    $relativePath = $file.FullName.Replace($PWD.Path + "\", "")
    Write-Host "Testing: " -NoNewline
    Write-Host "$relativePath" -ForegroundColor Yellow -NoNewline
    
    # Run the test silently and check exit code
    $null = & npx mocha $file.FullName 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " - PASS" -ForegroundColor Green
        $passingFiles += $relativePath
    }
    else {
        Write-Host " - FAIL" -ForegroundColor Red
        $failingFiles += $relativePath
    }
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "INTEGRATION TEST SUMMARY" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Files: $($testFiles.Count)" -ForegroundColor White
Write-Host "Passing: $($passingFiles.Count)" -ForegroundColor Green
Write-Host "Failing: $($failingFiles.Count)" -ForegroundColor Red
Write-Host ""

if ($failingFiles.Count -gt 0) {
    Write-Host "Files with failures:" -ForegroundColor Red
    foreach ($file in $failingFiles) {
        Write-Host "  - $file" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "Done!" -ForegroundColor Cyan
