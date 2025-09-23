// Script Loader System for Ant Game
// Manages dynamic loading of JavaScript dependencies in proper order

class ScriptLoader {
  constructor() {
    this.loadedScripts = new Set();
    this.loadingPromises = new Map();
    this.environment = this.detectEnvironment();
    
    console.log(`🚀 Script Loader initialized (Environment: ${this.environment})`);
  }

  // Detect current environment
  detectEnvironment() {
    const hostname = window.location.hostname;
    const isDev = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
    const isTest = window.location.search.includes('test=true');
    
    if (isTest) return 'test';
    if (isDev) return 'development';
    return 'production';
  }

  // Script configuration organized by category and dependency order
  getScriptConfig() {
    return {
      // Core libraries (must load first)
      libraries: [
        'libraries/p5.min.js',
        'libraries/p5.sound.min.js'
      ],

      // Base game classes (no dependencies)
      foundation: [
        'Classes/resource.js',
        'Classes/coordinateSystem.js',
        'Classes/entities/sprite2d.js',
        'Classes/entities/stats.js',
        'Classes/terrianGen.js',
        'Classes/pathfinding.js',
        'Classes/grid.js'
      ],

      // Ant system (depends on foundation)
      ants: [
        'Classes/ants/ants.js',
        'Classes/ants/species.js',
        'Classes/ants/antWrapper.js',
        'Classes/ants/antStateMachine.js',
        'Classes/ants/faction.js',
        'Classes/ants/Queen.js'
      ],

      // Game systems (depends on foundation and ants)
      game: [
        'Classes/selectionBox.js',
        'Classes/menu.js'
      ],

      // Debug tools (development/test only)
      debug: [
        'debug/commandLine.js',
        'debug/testing.js'
      ],

      // Type utilities (development/test only)
      types: [
        'TypeTests/vectorTypeTests.js'
      ],

      // Test suites (test environment only)
      tests: [
        'test/selectionBox.test.js',
        'test/selectionBox.integration.test.js',
        'test/menu-button-diagnostics.test.js',
        'test/vectorTypeTests.test.js'
      ],

      // Main application entry point (loads last)
      main: [
        'sketch.js'
      ]
    };
  }

  // Get scripts to load based on environment
  getScriptsForEnvironment() {
    const config = this.getScriptConfig();
    const scripts = {
      production: [
        ...config.libraries,
        ...config.foundation,
        ...config.ants,
        ...config.game,
        ...config.main
      ],
      development: [
        ...config.libraries,
        ...config.foundation,
        ...config.ants,
        ...config.game,
        ...config.debug,
        ...config.types,
        ...config.main
      ],
      test: [
        ...config.libraries,
        ...config.foundation,
        ...config.ants,
        ...config.game,
        ...config.debug,
        ...config.types,
        ...config.tests,
        ...config.main
      ]
    };

    return scripts[this.environment] || scripts.production;
  }

  // Convert camelCase filename to PascalCase
  toPascalCase(filename) {
    // Extract directory and filename
    const lastSlash = filename.lastIndexOf('/');
    const directory = lastSlash >= 0 ? filename.substring(0, lastSlash + 1) : '';
    const file = lastSlash >= 0 ? filename.substring(lastSlash + 1) : filename;
    
    // Extract name and extension
    const lastDot = file.lastIndexOf('.');
    const name = lastDot >= 0 ? file.substring(0, lastDot) : file;
    const extension = lastDot >= 0 ? file.substring(lastDot) : '';
    
    // Convert to PascalCase (capitalize first letter)
    const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
    
    return directory + pascalName + extension;
  }

  // Load a single script with promise and fallback to PascalCase
  loadScript(src) {
    // Return existing promise if script is already loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }

    // Return resolved promise if script is already loaded
    if (this.loadedScripts.has(src)) {
      return Promise.resolve();
    }

    // Create new loading promise with fallback
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false; // Preserve execution order
      
      script.onload = () => {
        this.loadedScripts.add(src);
        this.loadingPromises.delete(src);
        console.log(`✓ Loaded: ${src}`);
        resolve();
      };

      script.onerror = () => {
        // First attempt failed, try PascalCase version
        const pascalSrc = this.toPascalCase(src);
        
        if (pascalSrc !== src) {
          console.warn(`⚠️ Failed to load ${src}, trying PascalCase version: ${pascalSrc}`);
          
          const fallbackScript = document.createElement('script');
          fallbackScript.src = pascalSrc;
          fallbackScript.async = false;
          
          fallbackScript.onload = () => {
            this.loadedScripts.add(src); // Still track as original name
            this.loadingPromises.delete(src);
            console.log(`✓ Loaded (PascalCase fallback): ${pascalSrc}`);
            resolve();
          };
          
          fallbackScript.onerror = () => {
            this.loadingPromises.delete(src);
            console.error(`✗ Failed to load both versions: ${src} and ${pascalSrc}`);
            reject(new Error(`Failed to load script: ${src} (also tried ${pascalSrc})`));
          };
          
          // Remove the failed script and try the fallback
          document.head.removeChild(script);
          document.head.appendChild(fallbackScript);
        } else {
          this.loadingPromises.delete(src);
          console.error(`✗ Failed to load: ${src}`);
          reject(new Error(`Failed to load script: ${src}`));
        }
      };

      document.head.appendChild(script);
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  // Load scripts sequentially to preserve dependency order
  async loadScriptsSequentially(scripts) {
    let loaded = 0;
    
    for (const script of scripts) {
      try {
        await this.loadScript(script);
        loaded++;
        
        // Update progress if progress bar exists
        this.updateProgress(loaded, scripts.length);
        
      } catch (error) {
        console.error(`Failed to load ${script}:`, error);
        // Continue loading other scripts even if one fails
      }
    }
  }

  // Update loading progress
  updateProgress(loaded, total) {
    const percentage = (loaded / total) * 100;
    
    // Update progress bar if it exists
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
    
    // Update loading text
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv && loaded < total) {
      const statusText = loadingDiv.querySelector('p');
      if (statusText) {
        statusText.textContent = `Loading scripts... (${loaded}/${total})`;
      }
    }
    
    // Hide loading screen when complete
    if (loaded === total && loadingDiv) {
      setTimeout(() => {
        loadingDiv.style.display = 'none';
      }, 500);
    }
  }

  // Load scripts in parallel within groups
  async loadScriptsInParallel(scripts) {
    const promises = scripts.map(script => this.loadScript(script));
    
    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Some scripts failed to load:', error);
    }
  }

  // Main loading function
  async loadAll() {
    console.log(`📦 Loading scripts for ${this.environment} environment...`);
    
    const startTime = performance.now();
    const scripts = this.getScriptsForEnvironment();
    
    try {
      // Load all scripts sequentially to preserve order
      await this.loadScriptsSequentially(scripts);
      
      const endTime = performance.now();
      const loadTime = (endTime - startTime).toFixed(2);
      
      console.log(`🎉 All scripts loaded successfully in ${loadTime}ms`);
      console.log(`📊 Loaded ${scripts.length} scripts in ${this.environment} mode`);
      
      // Verify dependencies after loading
      setTimeout(() => {
        const dependencyIssues = this.verifyDependencies();
        if (dependencyIssues.length === 0) {
          console.log('🔗 All script dependencies verified successfully');
        }
      }, 100); // Small delay to allow classes to be fully initialized
      
      // Dispatch event when loading is complete
      window.dispatchEvent(new CustomEvent('scriptsLoaded', {
        detail: { environment: this.environment, loadTime, scriptCount: scripts.length }
      }));
      
    } catch (error) {
      console.error('❌ Script loading failed:', error);
      throw error;
    }
  }

  // Get loading status with naming convention analysis
  getStatus() {
    return {
      environment: this.environment,
      loaded: Array.from(this.loadedScripts),
      loading: Array.from(this.loadingPromises.keys()),
      total: this.getScriptsForEnvironment().length,
      namingConventions: this.analyzeNamingConventions()
    };
  }

  // Verify critical dependencies are available at runtime
  verifyDependencies() {
    const dependencies = {
      'Classes/ants/species.js': ['ant'], // Species extends ant class
      'Classes/ants/antWrapper.js': ['ant'], // AntWrapper uses ant class
      'Classes/ants/Queen.js': ['ant'], // Queen extends ant class
      'Classes/ants/faction.js': ['FactionRegistry'], // Faction uses FactionRegistry
      'Classes/menu.js': ['sprite2d'], // Menu uses sprite2d
      'sketch.js': ['p5'] // sketch.js uses p5.js
    };
    
    const issues = [];
    
    for (const [script, deps] of Object.entries(dependencies)) {
      if (this.loadedScripts.has(script)) {
        for (const dep of deps) {
          try {
            // Check if the dependency exists in global scope
            if (typeof window[dep] === 'undefined' && typeof global !== 'undefined' && typeof global[dep] === 'undefined') {
              // For classes, check if they can be referenced
              if (dep === 'ant' && typeof ant === 'undefined') {
                issues.push(`${script} depends on 'ant' class but it's not available`);
              } else if (dep === 'FactionRegistry' && typeof FactionRegistry === 'undefined') {
                issues.push(`${script} depends on 'FactionRegistry' class but it's not available`);
              } else if (dep === 'sprite2d' && typeof sprite2d === 'undefined') {
                issues.push(`${script} depends on 'sprite2d' class but it's not available`);
              } else if (dep === 'p5' && typeof p5 === 'undefined') {
                issues.push(`${script} depends on 'p5' library but it's not available`);
              }
            }
          } catch (error) {
            issues.push(`${script} dependency check failed for '${dep}': ${error.message}`);
          }
        }
      }
    }
    
    if (issues.length > 0) {
      console.warn('⚠️ Dependency verification found issues:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
    } else {
      console.log('✅ All critical dependencies verified successfully');
    }
    
    return issues;
  }

  // Analyze naming conventions in script paths
  analyzeNamingConventions() {
    const scripts = this.getScriptsForEnvironment();
    const analysis = {
      camelCase: [],
      PascalCase: [],
      kebabCase: [],
      snake_case: [],
      unclear: []
    };

    scripts.forEach(script => {
      const filename = script.split('/').pop().split('.')[0]; // Get filename without extension
      
      if (/^[a-z][a-zA-Z0-9]*$/.test(filename)) {
        analysis.camelCase.push(script);
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(filename)) {
        analysis.PascalCase.push(script);
      } else if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(filename)) {
        analysis.kebabCase.push(script);
      } else if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(filename)) {
        analysis.snake_case.push(script);
      } else {
        analysis.unclear.push(script);
      }
    });

    return analysis;
  }

  // Check for potential naming convention conflicts
  checkNamingConflicts() {
    const scripts = this.getScriptsForEnvironment();
    const conflicts = [];
    
    scripts.forEach(script => {
      const pascalVersion = this.toPascalCase(script);
      if (pascalVersion !== script && scripts.includes(pascalVersion)) {
        conflicts.push({
          camelCase: script,
          PascalCase: pascalVersion,
          warning: 'Both camelCase and PascalCase versions exist'
        });
      }
    });

    return conflicts;
  }
}

// Global script loader instance
window.scriptLoader = new ScriptLoader();

// Environment detection utilities
window.isDevelopment = () => scriptLoader.environment === 'development';
window.isProduction = () => scriptLoader.environment === 'production';
window.isTest = () => scriptLoader.environment === 'test';

// Convenience function to add custom scripts
window.loadCustomScript = (src) => scriptLoader.loadScript(src);

// Naming convention utilities
window.checkNamingConventions = () => {
  const status = scriptLoader.getStatus();
  console.log('📝 Naming Convention Analysis:');
  
  Object.entries(status.namingConventions).forEach(([convention, files]) => {
    if (files.length > 0) {
      console.log(`\n${convention}:`);
      files.forEach(file => console.log(`  - ${file}`));
    }
  });
  
  const conflicts = scriptLoader.checkNamingConflicts();
  if (conflicts.length > 0) {
    console.log('\n⚠️ Potential Conflicts:');
    conflicts.forEach(conflict => {
      console.log(`  ${conflict.camelCase} vs ${conflict.PascalCase}`);
    });
  }
  
  return status.namingConventions;
};

// Test PascalCase fallback functionality
window.testPascalCaseFallback = (filename) => {
  const pascalVersion = scriptLoader.toPascalCase(filename);
  console.log(`Original: ${filename}`);
  console.log(`PascalCase: ${pascalVersion}`);
  return pascalVersion;
};

// Log environment info
console.log('🔧 Environment Detection:');
console.log(`- URL: ${window.location.href}`);
console.log(`- Environment: ${scriptLoader.environment}`);
console.log(`- Scripts to load: ${scriptLoader.getScriptsForEnvironment().length}`);

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScriptLoader;
}