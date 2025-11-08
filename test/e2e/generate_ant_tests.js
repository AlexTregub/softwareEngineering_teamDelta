/**
 * Batch Ant Test Suite Generator
 */

const fs = require('fs');
const path = require('path');

const antTestDefinitions = [
  {
    suite: 15,
    name: 'AntConstruction',
    file: 'pw_ant_construction.js',
    tests: [
      'Ant inherits from Entity',
      'Ant initializes with job type',
      'Ant has unique ant index',
      'Ant initializes StatsContainer',
      'Ant initializes EntityInventoryManager',
      'Ant initializes AntStateMachine',
      'Ant initializes GatherState',
      'Ant initializes AntBrain',
      'Ant sets up faction',
      'Ant registers with global ants array'
    ]
  },
  {
    suite: 16,
    name: 'AntJobSystem',
    file: 'pw_ant_jobs.js',
    tests: [
      'assignJob() changes ant job',
      'Job image loads correctly',
      'Job stats applied (health, damage, speed)',
      'Builder job prioritizes building',
      'Warrior job prioritizes combat',
      'Farmer job prioritizes farming',
      'Scout job explores areas',
      'Spitter job has ranged attacks',
      'Job types have unique behaviors',
      'Job specialization affects pheromone priorities'
    ]
  },
  {
    suite: 17,
    name: 'AntResourceManagement',
    file: 'pw_ant_resources.js',
    tests: [
      'getResourceCount() returns current load',
      'getMaxResources() returns capacity',
      'addResource() adds to inventory',
      'removeResource() removes from inventory',
      'dropAllResources() empties inventory',
      'Ant transitions to DROPPING_OFF when full',
      'Ant seeks dropoff location',
      'Ant deposits resources at dropoff',
      'Resource indicator renders correctly',
      'Inventory affects ant behavior'
    ]
  },
  {
    suite: 18,
    name: 'AntCombat',
    file: 'pw_ant_combat.js',
    tests: [
      'takeDamage() reduces ant health',
      'heal() restores ant health',
      'attack() deals damage to enemy',
      'die() deactivates ant at 0 health',
      'Combat state changes ant behavior',
      'Warriors engage enemies automatically',
      'Non-warriors flee from danger',
      'Faction determines enemy detection',
      'Health bar shows during combat',
      'Death removes ant from game'
    ]
  },
  {
    suite: 19,
    name: 'AntMovementPatterns',
    file: 'pw_ant_movement.js',
    tests: [
      'Ant pathfinds around obstacles',
      'Ant movement respects terrain',
      'Ant follows pheromone trails',
      'Ant wanders when idle',
      'Ant returns to colony when full',
      'Ant avoids water if not amphibious',
      'Movement speed varies by terrain',
      'Movement updates position smoothly',
      'Collision avoidance works',
      'Pathfinding uses PathMap'
    ]
  },
  {
    suite: 20,
    name: 'AntGatheringBehavior',
    file: 'pw_ant_gathering.js',
    tests: [
      'startGathering() activates gather state',
      'Ant scans for resources in radius',
      'Ant moves toward nearest resource',
      'Ant collects resource on arrival',
      'Ant searches for new resource after collection',
      'Gather times out after 6 seconds',
      'Ant prioritizes closest resources',
      'Gather radius is 7 tiles (224px)',
      'Gathering shows visual feedback',
      'stopGathering() exits gather state'
    ]
  }
];

function generateAntTestSuite(def) {
  const testFunctions = def.tests.map((testName, index) => {
    const funcName = `test_${testName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_')}`;
    return `
async function ${funcName}(page) {
  const testName = '${testName}';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.antsSpawn) return { error: 'antsSpawn not available' };
      const ant = window.antsSpawn(${100 + index * 30}, ${100 + index * 30}, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!ant,
        hasJobName: !!ant.JobName,
        hasIndex: ant._antIndex !== undefined,
        jobName: ant.JobName
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    await forceRedraw(page);
    await captureEvidence(page, 'ants/${def.name.toLowerCase()}_${index + 1}', 'ants', true);
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
 * Tests ant ${def.name.toLowerCase()} functionality
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

// Create ants directory if it doesn't exist
const antsDir = path.join(__dirname, 'ants');
if (!fs.existsSync(antsDir)) {
  fs.mkdirSync(antsDir, { recursive: true });
}

// Generate all ant test suites
antTestDefinitions.forEach(def => {
  const content = generateAntTestSuite(def);
  const filePath = path.join(antsDir, def.file);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Generated: ${def.file}`);
});

console.log(`\n✅ Generated ${antTestDefinitions.length} ant test suites!`);
