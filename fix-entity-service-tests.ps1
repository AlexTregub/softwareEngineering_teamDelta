# Fix EntityService test file - add required parameters to spawn calls

$testFile = "test/unit/services/EntityService.test.js"
$content = Get-Content $testFile -Raw

# Add faction: 'player' to all Ant spawns without faction
$content = $content -replace "service\.spawn\('Ant', \{ x: (\d+), y: (\d+) \}\)", "service.spawn('Ant', { x: `$1, y: `$2, faction: 'player' })"

# Add buildingType and faction to all Building spawns without them
$content = $content -replace "service\.spawn\('Building', \{ x: (\d+), y: (\d+) \}\)", "service.spawn('Building', { x: `$1, y: `$2, buildingType: 'AntCone', faction: 'player' })"

# Add resourceType to all Resource spawns without it
$content = $content -replace "service\.spawn\('Resource', \{ x: (\d+), y: (\d+) \}\)", "service.spawn('Resource', { x: `$1, y: `$2, resourceType: 'greenLeaf' })"

# Add faction: 'player' to Ant spawns in loops
$content = $content -replace "service\.spawn\('Ant', \{ x: i \* 10, y: i \* 10 \}\)", "service.spawn('Ant', { x: i * 10, y: i * 10, faction: 'player' })"

$content | Set-Content $testFile -NoNewline

Write-Host "Fixed EntityService test file"
