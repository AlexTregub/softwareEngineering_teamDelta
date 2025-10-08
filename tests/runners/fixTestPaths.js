/**
 * Test File Path Fixer
 * Automatically updates all test files to use the correct paths after reorganization
 */

const fs = require('fs');
const path = require('path');

// Mapping of old paths to new paths - COMPREHENSIVE UPDATE
const pathMappings = {
  // === MISSING FILE ISSUES - Files that don't exist in old paths ===
  // These files need to be found in new locations
  '../src/core/systems/CollisionBox2D.js': '../src/core/systems/CollisionBox2D.js',
  '../src/core/systems/Button.js': '../src/core/systems/Button.js',
  '../src/core/managers/ResourceManager.js': '../src/core/managers/ResourceManager.js',
  '../src/controllers/MovementController.js': '../src/controllers/MovementController.js',
  '../src/controllers/RenderController.js': '../src/controllers/RenderController.js',
  '../src/controllers/TaskManager.js': '../src/controllers/TaskManager.js',
  '../src/game/ants/JobComponent.js': '../src/game/ants/JobComponent.js',
  '../src/game/world/resource.js': '../src/game/world/resource.js',
  '../src/game/world/resources.js': '../src/game/world/resources.js',
  '../src/core/entities/Entity.js': '../src/core/entities/Entity.js',
  '../src/core/systems/Sprite2d.js': '../src/core/systems/Sprite2d.js',
  
  // === UI COMPONENTS - Still in Classes but moved to components ===
  '../src/core/systems/ui/components/ButtonGroup.js': '../src/core/systems/ui/components/ButtonGroup.js',
  '../src/core/systems/ui/components/verticalButtonList.js': '../src/core/systems/ui/components/verticalButtonList.js',
  '../src/core/systems/ui/components/Slider.js': '../src/core/systems/ui/components/Slider.js',
  
  // === IMPORT WITHOUT EXTENSIONS ===
  '../src/core/systems/Button.js': '../src/core/systems/Button.js',
  '../src/core/systems/CollisionBox2D.js': '../src/core/systems/CollisionBox2D.js',
  '../src/core/managers/ResourceManager.js': '../src/core/managers/ResourceManager.js',
  '../src/core/systems/ui/components/ButtonGroup.js': '../src/core/systems/ui/components/ButtonGroup.js',
  
  // === DIRECT PATHS (no ../) ===
  'src/core/systems/CollisionBox2D.js': 'src/core/systems/CollisionBox2D.js',
  'src/core/systems/Button.js': 'src/core/systems/Button.js',
  'src/core/managers/ResourceManager.js': 'src/core/managers/ResourceManager.js',
  'src/game/ants/JobComponent.js': 'src/game/ants/JobComponent.js',
  'src/controllers/MovementController.js': 'src/controllers/MovementController.js',
  'src/controllers/RenderController.js': 'src/controllers/RenderController.js',
  'src/core/entities/Entity.js': 'src/core/entities/Entity.js',
  
  // === TEST ENVIRONMENT PATHS ===
  '../src/controllers/': '../src/controllers/',
  '../src/core/managers/': '../src/core/managers/',
  '../src/core/systems/': '../src/core/systems/',
  '../src/game/ants/': '../src/game/ants/',
  '../src/core/entities/': '../src/core/entities/',
};

/**
 * Fix paths in a single file
 */
function fixPathsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply all path mappings
    for (const [oldPath, newPath] of Object.entries(pathMappings)) {
      if (content.includes(oldPath)) {
        const regex = new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, newPath);
        modified = true;
        console.log(`  ✅ Fixed: ${oldPath} → ${newPath}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`📝 Updated: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`⚪ No changes needed: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Recursively find all test files and fix their paths
 */
function fixAllTestPaths(directory) {
  console.log('🔧 FIXING TEST FILE PATHS');
  console.log('================================================================================');
  console.log(`Scanning directory: ${directory}\n`);
  
  let totalFiles = 0;
  let fixedFiles = 0;
  
  function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
        processDirectory(filePath);
      } else if (file.endsWith('.test.js') || file.endsWith('.js')) {
        console.log(`\n📋 Processing: ${path.relative(directory, filePath)}`);
        totalFiles++;
        
        if (fixPathsInFile(filePath)) {
          fixedFiles++;
        }
      }
    });
  }
  
  processDirectory(directory);
  
  console.log('\n🎯 PATH FIXING COMPLETE');
  console.log('================================================================================');
  console.log(`📊 Files Processed: ${totalFiles}`);
  console.log(`🔧 Files Fixed: ${fixedFiles}`);
  console.log(`⚪ Files Unchanged: ${totalFiles - fixedFiles}`);
  console.log(`📈 Success Rate: ${totalFiles > 0 ? ((fixedFiles/totalFiles)*100).toFixed(1) : 0}%`);
  
  return { totalFiles, fixedFiles };
}

// Export for module usage
module.exports = {
  fixAllTestPaths,
  fixPathsInFile,
  pathMappings
};

// Run if called directly
if (require.main === module) {
  const testsDir = path.join(__dirname, '..');
  fixAllTestPaths(testsDir);
}