# Script to test all integration test files individually and report status

$testFiles = Get-ChildItem -Path "test\integration" -Filter "*.test.js" -Recurse

$passingFiles = @()
$failingFiles = @()
$errorFiles = @()

Write-Host "Testing $($testFiles.Count) integration test files..." -ForegroundColor Cyan
Write-Host ""

foreach ($file in $testFiles) {
    $relativePath = $file.FullName.Replace($PWD.Path + "\", "")
    Write-Host "Testing: $relativePath" -ForegroundColor Yellow
    
    # Run the test and capture output
    $output = & npx mocha $file.FullName --reporter json 2>&1 | Out-String
    
    # Try to parse as JSON
    try {
        # Extract JSON from output (skip debugger messages)
        $jsonStart = $output.IndexOf('{')
        if ($jsonStart -ge 0) {
            $jsonStr = $output.Substring($jsonStart)
            $result = $jsonStr | ConvertFrom-Json
            
            if ($result.stats.failures -eq 0 -and $result.stats.passes -gt 0) {
                Write-Host "  PASS: $($result.stats.passes) passing" -ForegroundColor Green
                $passingFiles += $relativePath
            }
            elseif ($result.stats.failures -gt 0) {
                Write-Host "  FAIL: $($result.stats.passes) passing, $($result.stats.failures) failing" -ForegroundColor Red
                $failingFiles += @{ Path = $relativePath; Passes = $result.stats.passes; Failures = $result.stats.failures }
            }
            else {
                Write-Host "  No tests found" -ForegroundColor Gray
            }
        }
        else {
            Write-Host "  ERROR: Could not parse output" -ForegroundColor Red
            $errorFiles += $relativePath
        }
    }
    catch {
        # Check if it's a require error or other critical error
        if ($output -match "Cannot find module|ENOENT|Error:") {
            Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
            $errorFiles += $relativePath
        }
        else {
            Write-Host "  Parse error (might still pass)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
}

# Summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "INTEGRATION TEST SUMMARY" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Files: $($testFiles.Count)" -ForegroundColor White
Write-Host "Passing: $($passingFiles.Count)" -ForegroundColor Green
Write-Host "Failing: $($failingFiles.Count)" -ForegroundColor Red
Write-Host "Errors: $($errorFiles.Count)" -ForegroundColor Red
Write-Host ""

if ($failingFiles.Count -gt 0) {
    Write-Host "Files with failing tests:" -ForegroundColor Red
    foreach ($file in $failingFiles) {
        Write-Host "  - $($file.Path): $($file.Passes) passing, $($file.Failures) failing" -ForegroundColor Red
    }
    Write-Host ""
}

if ($errorFiles.Count -gt 0) {
    Write-Host "Files with errors:" -ForegroundColor Red
    foreach ($file in $errorFiles) {
        Write-Host "  - $file" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "Done!" -ForegroundColor Cyan
