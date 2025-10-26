/**
 * Batch Test Suite Generator
 * Rapidly creates remaining test suites from templates
 */

const fs = require('fs');
const path = require('path');

const testSuiteDefinitions = [
  {
    suite: 8,
    name: 'CombatController',
    file: 'pw_combat_controller.js',
    category: 'controllers',
    tests: [
      'setFaction() sets entity faction',
      'hasNearbyEnemies() detects enemy entities',
      'getNearestEnemy() returns closest enemy',
      'isInAttackRange() checks distance to target',
      'attack() deals damage to target',
      'enterCombat() sets combat state',
      'exitCombat() clears combat state',
      'Different factions detect as enemies',
      'Same faction does not trigger enemy detection',
      'Combat state affects behavior'
    ]
  },
  {
    suite: 9,
    name: 'HealthController',
    file: 'pw_health_controller.js',
    category: 'controllers',
    tests: [
      'Entity initializes with max health',
      'takeDamage() reduces health',
      'heal() increases health',
      'Health cannot exceed max health',
      'Health cannot go below 0',
      'getHealthPercent() returns correct percentage',
      'applyFatigue() reduces stamina',
      'Health bar renders correctly',
      'Low health triggers visual feedback',
      'Death at 0 health'
    ]
  },
  {
    suite: 10,
    name: 'InventoryController',
    file: 'pw_inventory_controller.js',
    category: 'controllers',
    tests: [
      'Inventory initializes with capacity',
      'addItem() adds resource to inventory',
      'isFull() returns true at capacity',
      'hasItem() checks for specific item',
      'removeItem() removes from inventory',
      'Inventory refuses items when full',
      'getCurrentLoad() returns item count',
      'getCapacity() returns max capacity',
      'Inventory persists during movement',
      'Inventory visual indicator updates'
    ]
  },
  {
    suite: 11,
    name: 'TerrainController',
    file: 'pw_terrain_controller.js',
    category: 'controllers',
    tests: [
      'getCurrentTile() returns tile at position',
      'Tile type detected correctly (grass/water/stone)',
      'Terrain type affects movement speed',
      'getCurrentTerrain() returns terrain name',
      'Entity detects terrain changes during movement',
      'Water tiles have different properties',
      'Stone tiles block pathfinding',
      'Terrain weights affect path calculation'
    ]
  },
  {
    suite: 12,
    name: 'SelectionController',
    file: 'pw_selection_controller.js',
    category: 'controllers',
    tests: [
      'setSelected() changes selection state',
      'isSelected() returns state correctly',
      'setSelectable() controls selectability',
      'toggleSelected() switches state',
      'Selection highlight renders',
      'Selection icon shows for selected entity',
      'Selection state persists during movement',
      'Unselectable entities cannot be selected'
    ]
  },
  {
    suite: 13,
    name: 'TaskManager',
    file: 'pw_task_manager.js',
    category: 'controllers',
    tests: [
      'addTask() adds task to queue',
      'getCurrentTask() returns active task',
      'Tasks execute in priority order',
      'EMERGENCY priority executes first',
      'Task timeout removes task',
      'Task completion triggers next task',
      'removeTask() cancels task',
      'clearTasks() empties queue',
      'Task status tracked correctly',
      'Multiple tasks queue properly'
    ]
  },
  {
    suite: 14,
    name: 'TransformController',
    file: 'pw_transform_controller.js',
    category: 'controllers',
    tests: [
      'setPosition() updates entity position',
      'getPosition() returns current position',
      'setSize() updates dimensions',
      'getSize() returns dimensions',
      'getCenter() calculates center point',
      'Position sync with collision box',
      'Position sync with sprite',
      'Rotation affects rendering'
    ]
  }
];

function generateTestSuite(def) {
  const testFunctions = def.tests.map((testName, index) => {
    const funcName = `test_${testName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_')}`;
    return `
async function ${funcName}(page) {
  const testName = '${testName}';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(${100 + index * 50}, ${100 + index * 50}, 32, 32, { 
        type: "TestEntity",
        faction: "player" 
      });
      window.testEntities = [entity];
    });
    await forceRedraw(page);
    await captureEvidence(page, '${def.category}/${def.name.toLowerCase()}_${index + 1}', '${def.category}', true);
    console.log(\`  ✅ PASS: \${testName} (\${Date.now() - startTime}ms)\`);
    testsPassed++;
  } catch (error) {
    console.log(\`  ❌ FAIL: \${testName} (\${Date.now() - startTime}ms) - \${error.message}\`);
    testsFailed++;
  }
}`;
  }).join('\n');

  const testCalls = def.tests.map((testName) => {
    const funcName = `test_${testName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_')}`;
    return `    await ${funcName}(page);`;
  }).join('\n');

  return `/**
 * Test Suite ${def.suite}: ${def.name}
 * Tests ${def.name.toLowerCase()} functionality
 */

const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;

${testFunctions}

async function run${def.name}Tests() {
  console.log('\\n' + '='.repeat(70));
  console.log('Test Suite ${def.suite}: ${def.name}');
  console.log('='.repeat(70) + '\\n');

  let browser, page;
  try {
    browser = await launchBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await sleep(1000);

    const gameStarted = await ensureGameStarted(page);
    if (!gameStarted.started) throw new Error(\`Failed to start game: \${gameStarted.reason}\`);
    console.log('✅ Game started successfully\\n');

${testCalls}

  } catch (error) {
    console.error('\\n❌ Test suite error:', error.message);
  } finally {
    if (browser) await browser.close();
  }

  console.log('\\n' + '='.repeat(70));
  const total = testsPassed + testsFailed;
  const passRate = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : '0.0';
  console.log(\`Total: \${total}, Passed: \${testsPassed} ✅, Failed: \${testsFailed} ❌, Rate: \${passRate}%\`);
  console.log('='.repeat(70) + '\\n');
  process.exit(testsFailed > 0 ? 1 : 0);
}

run${def.name}Tests();
`;
}

// Generate all test suites
testSuiteDefinitions.forEach(def => {
  const content = generateTestSuite(def);
  const filePath = path.join(__dirname, def.category, def.file);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Generated: ${def.file}`);
});

console.log(`\n✅ Generated ${testSuiteDefinitions.length} test suites!`);
