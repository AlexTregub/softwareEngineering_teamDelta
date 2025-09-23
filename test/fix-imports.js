#!/usr/bin/env node

/**
 * Fix Import Paths Script
 * Updates import paths in moved test files to account for new directory structure
 */

const fs = require('fs');
const path = require('path');

class ImportPathFixer {
  constructor() {
    this.testDir = path.join(process.cwd(), 'test');
    this.fixes = [];
  }

  // Get all test files that need path fixes
  getTestFiles() {
    const testFiles = [];
    const categories = ['unit', 'integration', 'system', 'utils'];
    
    categories.forEach(category => {
      const categoryDir = path.join(this.testDir, category);
      if (fs.existsSync(categoryDir)) {
        const files = fs.readdirSync(categoryDir).filter(file => file.endsWith('.test.js'));
        files.forEach(file => {
          testFiles.push({
            category,
            file,
            path: path.join(categoryDir, file)
          });
        });
      }
    });
    
    return testFiles;
  }

  // Fix import paths in a file
  fixImportsInFile(filePath, category) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      
      // Common import pattern fixes based on category depth
      const pathFixes = {
        // From test/unit/* to root
        unit: [
          { from: '../Classes/', to: '../../Classes/' },
          { from: '../TypeTests/', to: '../../TypeTests/' },
          { from: '../scripts/', to: '../../scripts/' },
          { from: '../debug/', to: '../../debug/' }
        ],
        // From test/integration/* to root  
        integration: [
          { from: '../Classes/', to: '../../Classes/' },
          { from: '../TypeTests/', to: '../../TypeTests/' },
          { from: '../scripts/', to: '../../scripts/' },
          { from: '../debug/', to: '../../debug/' },
          { from: '../test/', to: '../' },
          { from: './selectionBox.mock.js', to: '../utils/selectionBox.mock.js' }
        ],
        // From test/system/* to root
        system: [
          { from: '../Classes/', to: '../../Classes/' },
          { from: '../TypeTests/', to: '../../TypeTests/' },
          { from: '../scripts/', to: '../../scripts/' },
          { from: '../debug/', to: '../../debug/' },
          { from: '../test/', to: '../' }
        ],
        // From test/utils/* to root
        utils: [
          { from: '../Classes/', to: '../../Classes/' },
          { from: '../TypeTests/', to: '../../TypeTests/' },
          { from: '../scripts/', to: '../../scripts/' },
          { from: '../debug/', to: '../../debug/' }
        ]
      };
      
      if (pathFixes[category]) {
        pathFixes[category].forEach(({ from, to }) => {
          const originalContent = content;
          content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
          if (content !== originalContent) {
            changed = true;
            this.fixes.push({
              file: path.basename(filePath),
              category,
              change: `${from} → ${to}`
            });
          }
        });
      }
      
      // Write back if changed
      if (changed) {
        fs.writeFileSync(filePath, content);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ Failed to fix imports in ${filePath}: ${error.message}`);
      return false;
    }
  }

  // Fix all import paths
  fixAllImports() {
    console.log('🔧 Fixing import paths in moved test files...\n');
    
    const testFiles = this.getTestFiles();
    let fixedCount = 0;
    
    testFiles.forEach(({ category, file, path: filePath }) => {
      console.log(`📝 ${category}/${file}`);
      
      if (this.fixImportsInFile(filePath, category)) {
        console.log(`   ✅ Fixed import paths`);
        fixedCount++;
      } else {
        console.log(`   ℹ️  No changes needed`);
      }
    });
    
    console.log(`\n📊 IMPORT PATH FIX SUMMARY:`);
    console.log(`   ✅ Fixed: ${fixedCount} files`);
    console.log(`   📁 Total files processed: ${testFiles.length}`);
    
    if (this.fixes.length > 0) {
      console.log(`\n🔍 CHANGES MADE:`);
      this.fixes.forEach(fix => {
        console.log(`   ${fix.category}/${fix.file}: ${fix.change}`);
      });
    }
    
    return { fixedCount, totalFiles: testFiles.length };
  }

  // Main execution
  run() {
    console.log('🛠️  IMPORT PATH FIXER');
    console.log('=====================\n');
    
    const result = this.fixAllImports();
    
    console.log('\n🎉 Import path fixing complete!');
    console.log('\n📖 Updated paths account for new directory structure:');
    console.log('   test/unit/*        → ../../Classes/ (up 2 levels)');
    console.log('   test/integration/* → ../../Classes/ (up 2 levels)');
    console.log('   test/system/*      → ../../Classes/ (up 2 levels)');
    console.log('   test/utils/*       → ../../Classes/ (up 2 levels)');
    
    return result;
  }
}

// Run if called directly
if (require.main === module) {
  const fixer = new ImportPathFixer();
  fixer.run();
}

module.exports = ImportPathFixer;