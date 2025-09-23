// Script Management Utilities
// Helper functions for managing the script loading system

class ScriptManager {
  static addScript(group, scriptPath, description = '') {
    if (!window.SCRIPT_CONFIG.scriptGroups[group]) {
      console.error(`Script group '${group}' does not exist`);
      return false;
    }
    
    window.SCRIPT_CONFIG.scriptGroups[group].scripts.push(scriptPath);
    console.log(`✓ Added ${scriptPath} to ${group} group`);
    return true;
  }

  static removeScript(group, scriptPath) {
    if (!window.SCRIPT_CONFIG.scriptGroups[group]) {
      console.error(`Script group '${group}' does not exist`);
      return false;
    }
    
    const scripts = window.SCRIPT_CONFIG.scriptGroups[group].scripts;
    const index = scripts.indexOf(scriptPath);
    
    if (index > -1) {
      scripts.splice(index, 1);
      console.log(`✓ Removed ${scriptPath} from ${group} group`);
      return true;
    }
    
    console.warn(`Script ${scriptPath} not found in ${group} group`);
    return false;
  }

  static listScripts(environment = null) {
    const env = environment || window.scriptLoader.environment;
    const groups = window.SCRIPT_CONFIG.scriptGroups;
    
    console.log(`📋 Scripts for ${env} environment:`);
    
    Object.entries(groups)
      .sort(([,a], [,b]) => a.order - b.order)
      .forEach(([groupName, group]) => {
        // Check if group should be included in this environment
        if (group.environments && !group.environments.includes(env)) {
          return;
        }
        
        console.log(`\n📁 ${groupName.toUpperCase()} (${group.description})`);
        group.scripts.forEach((script, index) => {
          console.log(`  ${index + 1}. ${script}`);
        });
      });
  }

  static analyzeLoadTime() {
    const status = window.scriptLoader.getStatus();
    console.log('⏱️  Loading Analysis:');
    console.log(`- Environment: ${status.environment}`);
    console.log(`- Total scripts: ${status.total}`);
    console.log(`- Loaded scripts: ${status.loaded.length}`);
    console.log(`- Currently loading: ${status.loading.length}`);
    
    if (status.loaded.length > 0) {
      console.log('\n✅ Successfully loaded:');
      status.loaded.forEach(script => console.log(`  - ${script}`));
    }
    
    if (status.loading.length > 0) {
      console.log('\n⏳ Currently loading:');
      status.loading.forEach(script => console.log(`  - ${script}`));
    }
  }

  static switchEnvironment(newEnv) {
    console.log(`🔄 Switching from ${window.scriptLoader.environment} to ${newEnv}`);
    console.log('⚠️  Note: Page reload required for environment change to take effect');
    
    // Update URL parameter
    const url = new URL(window.location);
    if (newEnv === 'test') {
      url.searchParams.set('test', 'true');
    } else {
      url.searchParams.delete('test');
    }
    
    window.history.pushState({}, '', url);
    window.location.reload();
  }

  static generateLoadOrder() {
    const groups = window.SCRIPT_CONFIG.scriptGroups;
    const env = window.scriptLoader.environment;
    
    console.log(`📝 Generated load order for ${env}:`);
    
    const orderedGroups = Object.entries(groups)
      .sort(([,a], [,b]) => a.order - b.order)
      .filter(([, group]) => !group.environments || group.environments.includes(env));
    
    let scriptIndex = 1;
    orderedGroups.forEach(([groupName, group]) => {
      console.log(`\n--- ${groupName.toUpperCase()} ---`);
      group.scripts.forEach(script => {
        console.log(`${scriptIndex.toString().padStart(2)}. ${script}`);
        scriptIndex++;
      });
    });
  }

  static checkNamingConventions() {
    return window.checkNamingConventions();
  }

  static fixNamingConventions() {
    console.log('🔧 Checking for naming convention issues...');
    
    const status = window.scriptLoader.getStatus();
    const conflicts = window.scriptLoader.checkNamingConflicts();
    
    if (conflicts.length > 0) {
      console.log(`⚠️ Found ${conflicts.length} potential naming conflicts:`);
      conflicts.forEach((conflict, index) => {
        console.log(`${index + 1}. ${conflict.camelCase} ↔ ${conflict.PascalCase}`);
        console.log(`   ${conflict.warning}`);
      });
      
      console.log('\n💡 Recommendations:');
      console.log('- Choose one naming convention for your team (camelCase recommended)');
      console.log('- Rename conflicting files to match your chosen convention');
      console.log('- Update script paths in config.js accordingly');
    } else {
      console.log('✅ No naming conflicts detected');
    }
    
    // Show convention breakdown
    const conventions = status.namingConventions;
    const totalFiles = Object.values(conventions).reduce((sum, files) => sum + files.length, 0);
    
    console.log('\n📊 Current naming convention usage:');
    Object.entries(conventions).forEach(([convention, files]) => {
      if (files.length > 0) {
        const percentage = ((files.length / totalFiles) * 100).toFixed(1);
        console.log(`${convention}: ${files.length} files (${percentage}%)`);
      }
    });
    
    return { conflicts, conventions };
  }
}

// Make utilities globally available
window.ScriptManager = ScriptManager;

// Convenience functions
window.addScript = (group, script) => ScriptManager.addScript(group, script);
window.removeScript = (group, script) => ScriptManager.removeScript(group, script);
window.listScripts = (env) => ScriptManager.listScripts(env);
window.analyzeLoading = () => ScriptManager.analyzeLoadTime();
window.switchEnv = (env) => ScriptManager.switchEnvironment(env);
window.fixNaming = () => ScriptManager.fixNamingConventions();

console.log('🛠️  Script management utilities loaded. Try:');
console.log('  - listScripts() - Show all scripts for current environment');
console.log('  - analyzeLoading() - Show loading status and timing');
console.log('  - switchEnv("test") - Switch to test environment');
console.log('  - addScript("debug", "path/to/script.js") - Add new script');
console.log('  - fixNaming() - Check and fix naming convention issues');
console.log('  - checkNamingConventions() - Analyze naming patterns');