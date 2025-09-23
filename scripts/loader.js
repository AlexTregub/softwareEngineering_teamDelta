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
        'Classes/ants/species.js',
        'Classes/ants/antWrapper.js',
        'Classes/ants/antStateMachine.js',
        'Classes/ants/faction.js',  // If it exists
        'Classes/ants/ants.js',
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

  // Load a single script with promise
  loadScript(src) {
    // Return existing promise if script is already loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }

    // Return resolved promise if script is already loaded
    if (this.loadedScripts.has(src)) {
      return Promise.resolve();
    }

    // Create new loading promise
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
        this.loadingPromises.delete(src);
        console.error(`✗ Failed to load: ${src}`);
        reject(new Error(`Failed to load script: ${src}`));
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
      
      // Dispatch event when loading is complete
      window.dispatchEvent(new CustomEvent('scriptsLoaded', {
        detail: { environment: this.environment, loadTime, scriptCount: scripts.length }
      }));
      
    } catch (error) {
      console.error('❌ Script loading failed:', error);
      throw error;
    }
  }

  // Get loading status
  getStatus() {
    return {
      environment: this.environment,
      loaded: Array.from(this.loadedScripts),
      loading: Array.from(this.loadingPromises.keys()),
      total: this.getScriptsForEnvironment().length
    };
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

// Log environment info
console.log('🔧 Environment Detection:');
console.log(`- URL: ${window.location.href}`);
console.log(`- Environment: ${scriptLoader.environment}`);
console.log(`- Scripts to load: ${scriptLoader.getScriptsForEnvironment().length}`);

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScriptLoader;
}