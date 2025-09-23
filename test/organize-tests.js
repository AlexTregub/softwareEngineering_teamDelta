#!/usr/bin/env node

/**
 * Test Organization Script
 * Moves existing tests into organized folder structure
 */

const fs = require('fs');
const path = require('path');

class TestOrganizer {
  constructor() {
    this.testDir = path.join(process.cwd(), 'test');
    this.moves = [];
  }

  // Define where each test should go
  getTestMapping() {
    return {
      // Unit tests - test individual classes/functions
      unit: [
        'ant.test.js',
        'AntStateMachine.test.js', 
        'sprite2d.test.js',
        'vectorTypeTests.test.js'
      ],
      
      // Integration tests - test component interactions
      integration: [
        'selectionBox.node.test.js',
        'selectionBox.comprehensive.test.js',
        'selectionBox.integration.test.js',
        'antStructure.test.js',
        'faction-integration.test.js',
        'faction-integration-commandline.test.js',
        'spawn-interaction.regression.test.js'
      ],
      
      // System tests - test full system behavior
      system: [
        'scriptLoader.node.test.js',
        'scriptLoader.loadOrder.simple.test.js',
        'scriptLoader.loadOrder.test.js',
        'scriptLoader.namingConventions.test.js',
        'selectionBox.regression.test.js',
        'faction-statemachine.test.js',
        'menu-button-diagnostics.test.js'
      ],
      
      // Browser tests - require browser environment
      browser: [
        'scriptLoader.loadOrder.browser.test.html',
        'scriptLoader.browserIntegration.test.js'
      ],
      
      // Utils - test utilities and quick validation
      utils: [
        'selectionBox.simple.test.js',
        'selectionBox.test.js',
        'selectionBox.mock.js',
        'runtime-dependency-verification.js'
      ]
    };
  }

  // Check if file exists
  fileExists(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }

  // Move file to new location
  moveFile(oldPath, newPath) {
    try {
      // Create directory if it doesn't exist
      const newDir = path.dirname(newPath);
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
      }
      
      // Move the file
      fs.renameSync(oldPath, newPath);
      return true;
    } catch (error) {
      console.error(`❌ Failed to move ${oldPath} to ${newPath}: ${error.message}`);
      return false;
    }
  }

  // Organize tests into folders
  organizeTests() {
    console.log('🗂️  Organizing test files...\n');
    
    const mapping = this.getTestMapping();
    let movedCount = 0;
    let skippedCount = 0;
    
    for (const [category, files] of Object.entries(mapping)) {
      console.log(`📁 ${category.toUpperCase()} TESTS:`);
      
      for (const file of files) {
        const oldPath = path.join(this.testDir, file);
        const newPath = path.join(this.testDir, category, file);
        
        if (this.fileExists(oldPath)) {
          if (this.moveFile(oldPath, newPath)) {
            console.log(`   ✅ ${file} → ${category}/${file}`);
            this.moves.push({ file, from: file, to: `${category}/${file}`, success: true });
            movedCount++;
          } else {
            console.log(`   ❌ Failed to move ${file}`);
            this.moves.push({ file, from: file, to: `${category}/${file}`, success: false });
          }
        } else {
          console.log(`   ⚠️  ${file} (not found)`);
          skippedCount++;
        }
      }
      console.log('');
    }
    
    console.log(`📊 ORGANIZATION SUMMARY:`);
    console.log(`   ✅ Moved: ${movedCount} files`);
    console.log(`   ⚠️  Skipped: ${skippedCount} files (not found)`);
    
    return { movedCount, skippedCount, moves: this.moves };
  }

  // Update package.json with new test paths
  updatePackageJson() {
    console.log('\n🔧 Updating package.json test scripts...');
    
    const packagePath = path.join(process.cwd(), 'package.json');
    
    try {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // New test scripts with organized structure
      const newScripts = {
        "test": "node test/test-runner.js",
        "test:all": "node test/test-runner.js",
        "test:unit": "node test/test-runner.js unit",
        "test:integration": "node test/test-runner.js integration", 
        "test:system": "node test/test-runner.js system",
        "test:quick": "node test/test-runner.js utils",
        
        // Individual test categories
        "test:ants": "node test/unit/ant.test.js && node test/unit/AntStateMachine.test.js",
        "test:selection": "node test/integration/selectionBox.node.test.js",
        "test:scripts": "node test/system/scriptLoader.node.test.js",
        "test:load-order": "node test/system/scriptLoader.loadOrder.simple.test.js",
        
        // Legacy support (individual tests)
        "test:statemachine": "node test/unit/AntStateMachine.test.js",
        "test:ant": "node test/unit/ant.test.js",
        "test:sprite2d": "node test/unit/sprite2d.test.js",
        "test:structure": "node test/integration/antStructure.test.js",
        "test:selection-comprehensive": "node test/integration/selectionBox.comprehensive.test.js",
        "test:selection-regression": "node test/system/selectionBox.regression.test.js",
        "test:selection-simple": "node test/utils/selectionBox.simple.test.js",
        "test:spawn-interaction": "node test/integration/spawn-interaction.regression.test.js",
        "test:script-loader": "node test/system/scriptLoader.node.test.js",
        
        // Development helpers
        "test:watch": "npm run test -- --watch",
        "dev": "python -m http.server 8000",
        "start": "python -m http.server 8000"
      };
      
      packageData.scripts = { ...packageData.scripts, ...newScripts };
      
      fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
      console.log('   ✅ package.json updated with new test structure');
      
    } catch (error) {
      console.error(`   ❌ Failed to update package.json: ${error.message}`);
    }
  }

  // Create README files for each test category
  createReadmeFiles() {
    console.log('\n📝 Creating README files for test categories...');
    
    const readmeContent = {
      unit: `# Unit Tests

This folder contains unit tests that test individual classes and functions in isolation.

## Test Files:
- \`ant.test.js\` - Tests the core ant class functionality
- \`AntStateMachine.test.js\` - Tests ant behavior state management  
- \`sprite2d.test.js\` - Tests 2D sprite rendering system
- \`vectorTypeTests.test.js\` - Tests vector mathematics and types

## Running Unit Tests:
\`\`\`bash
npm run test:unit
\`\`\`

Unit tests should be fast, isolated, and test single responsibilities.`,

      integration: `# Integration Tests

This folder contains integration tests that verify component interactions and data flow.

## Test Files:
- \`selectionBox.node.test.js\` - Tests ant selection system integration
- \`selectionBox.comprehensive.test.js\` - Comprehensive selection system tests
- \`antStructure.test.js\` - Tests ant creation method compatibility
- \`faction-integration.test.js\` - Tests faction system integration
- \`spawn-interaction.regression.test.js\` - Tests spawning and interaction systems

## Running Integration Tests:
\`\`\`bash
npm run test:integration
\`\`\`

Integration tests verify that different components work together correctly.`,

      system: `# System Tests

This folder contains system-level tests that verify full application behavior and workflows.

## Test Files:
- \`scriptLoader.node.test.js\` - Tests script loading and naming conventions
- \`scriptLoader.loadOrder.simple.test.js\` - Tests script dependency loading order
- \`selectionBox.regression.test.js\` - Regression tests for selection system
- \`faction-statemachine.test.js\` - Tests faction state management

## Running System Tests:
\`\`\`bash
npm run test:system
\`\`\`

System tests verify end-to-end functionality and catch regressions.`,

      browser: `# Browser Tests

This folder contains tests that require a browser environment to run.

## Test Files:
- \`scriptLoader.loadOrder.browser.test.html\` - Interactive browser test page
- \`scriptLoader.browserIntegration.test.js\` - Browser-specific integration tests

## Running Browser Tests:
1. Start the development server: \`npm run dev\`
2. Open http://localhost:8000/test/browser/scriptLoader.loadOrder.browser.test.html
3. Click test buttons to run interactive tests

Browser tests verify functionality in the actual runtime environment.`,

      utils: `# Test Utils

This folder contains test utilities, mocks, and quick validation tests.

## Test Files:
- \`selectionBox.simple.test.js\` - Quick validation tests for selection
- \`selectionBox.mock.js\` - Mock objects for testing
- \`runtime-dependency-verification.js\` - Runtime dependency checking

## Running Utils Tests:
\`\`\`bash
npm run test:quick
\`\`\`

Utils provide testing infrastructure and quick smoke tests.`
    };
    
    for (const [category, content] of Object.entries(readmeContent)) {
      const readmePath = path.join(this.testDir, category, 'README.md');
      try {
        fs.writeFileSync(readmePath, content);
        console.log(`   ✅ Created ${category}/README.md`);
      } catch (error) {
        console.error(`   ❌ Failed to create ${category}/README.md: ${error.message}`);
      }
    }
  }

  // Main execution
  run() {
    console.log('🧹 TEST ORGANIZATION SCRIPT');
    console.log('============================\n');
    
    const result = this.organizeTests();
    this.updatePackageJson();
    this.createReadmeFiles();
    
    console.log('\n🎉 Test organization complete!');
    console.log('\n📖 New test structure:');
    console.log('   test/');
    console.log('   ├── unit/           # Individual class/function tests');
    console.log('   ├── integration/    # Component interaction tests');
    console.log('   ├── system/         # Full system behavior tests');
    console.log('   ├── browser/        # Browser-specific tests');
    console.log('   ├── utils/          # Test utilities and mocks');
    console.log('   └── test-runner.js  # Comprehensive test runner');
    
    console.log('\n🚀 New commands available:');
    console.log('   npm test            # Run all tests with summary');
    console.log('   npm run test:unit   # Run unit tests only');
    console.log('   npm run test:integration # Run integration tests');
    console.log('   npm run test:system # Run system tests');
    console.log('   npm run test:quick  # Run quick validation tests');
    
    return result;
  }
}

// Run if called directly
if (require.main === module) {
  const organizer = new TestOrganizer();
  organizer.run();
}

module.exports = TestOrganizer;