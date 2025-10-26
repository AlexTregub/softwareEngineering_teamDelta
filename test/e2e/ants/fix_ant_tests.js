/**
 * Script to fix all ant test files to use correct ant constructor
 * The generated tests used wrong antsSpawn signature
 */

const fs = require('fs');
const path = require('path');

const antsDir = path.join(__dirname);
const testFiles = [
  'pw_ant_construction.js',
  'pw_ant_jobs.js',
  'pw_ant_resources.js',
  'pw_ant_combat.js',
  'pw_ant_movement.js',
  'pw_ant_gathering.js'
];

console.log('Fixing ant test files...\n');

testFiles.forEach(filename => {
  const filePath = path.join(antsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${filename} - file not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changesMade = 0;
  
  // Fix 1: Replace window.antsSpawn checks with window.ant
  const oldCheck = /if \(!window\.antsSpawn\)/g;
  const newCheck = 'if (!window.ant)';
  if (content.match(oldCheck)) {
    content = content.replace(oldCheck, newCheck);
    changesMade++;
  }
  
  // Fix 2: Replace error message
  const oldError = /return \{ error: 'antsSpawn not available' \}/g;
  const newError = "return { error: 'ant class not available' }";
  if (content.match(oldError)) {
    content = content.replace(oldError, newError);
    changesMade++;
  }
  
  // Fix 3: Replace antsSpawn() calls with new ant() constructor
  // Pattern: const ant = window.antsSpawn(x, y, w, h, speed, rot, img, job, faction);
  const oldSpawn = /const ant = window\.antsSpawn\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*null,\s*'(\w+)',\s*'(\w+)'\);/g;
  
  content = content.replace(oldSpawn, (match, x, y, w, h, speed, rot, job, faction) => {
    changesMade++;
    return `const testAnt = new window.ant(${x}, ${y}, ${w}, ${h}, ${speed}, ${rot}, null, '${job}', '${faction}');`;
  });
  
  // Fix 4: Update variable references from 'ant' to 'testAnt'
  const oldAntRef = /return \{\s*exists: !!/g;
  content = content.replace(oldAntRef, (match) => {
    return 'return {\n        exists: !!testAnt,\n        isEntity: testAnt instanceof window.Entity,\n        hasStatsContainer: !!testAnt.StatsContainer,\n        hasResourceManager: !!testAnt.resourceManager,\n        hasStateMachine: !!testAnt.stateMachine,\n        hasGatherState: !!testAnt.gatherState,\n        hasBrain: testAnt.brain !== undefined,\n        hasFaction: !!testAnt.faction,\n        hasJobName: !!testAnt.JobName,\n        hasIndex: testAnt._antIndex !== undefined,\n        jobName: testAnt.JobName,\n        faction: testAnt.faction,\n        type: testAnt.type,\n        exists: !!';
  });
  
  if (changesMade > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filename} (${changesMade} patterns replaced)`);
  } else {
    console.log(`✓  ${filename} - no changes needed`);
  }
});

console.log('\n✅ All ant test files processed!');
console.log('You can now run: npm run test:e2e:ants');
