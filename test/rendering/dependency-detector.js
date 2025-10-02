/**
 * Dependency Detector - Automatically detect and validate global dependencies
 * 
 * This system solves the problem: "What happens when real classes change their dependencies?"
 * 
 * Strategy:
 * 1. Automatically detect what globals real classes actually use
 * 2. Validate that our test mocks match real requirements  
 * 3. Provide warnings when dependencies change
 * 4. Generate migration guides when breaking changes occur
 */

const fs = require('fs');
const path = require('path');

class DependencyDetector {
  constructor() {
    // Known global categories to organize dependencies
    this.globalCategories = {
      gameState: ['antsUpdate', 'antsUpdateAndRender', 'gameState', 'GameState', 'g_resourceList', 'antCol'],
      p5js: ['createVector', 'translate', 'rotate', 'tint', 'radians', 'push', 'pop', 'fill', 'stroke', 'rect', 'ellipse'],
      browser: ['window', 'document', 'console', 'performance'],
      testing: ['global', 'process', 'require', 'module', 'exports']
    };
    
    this.detectedDependencies = new Set();
    this.mockRegistry = new Map();
  }

  /**
   * Scan real rendering classes to detect actual global dependencies
   */
  scanRealClassDependencies(renderingClassesPath) {
    const results = {
      dependencies: new Set(),
      byFile: {},
      byCategory: {},
      warnings: []
    };

    try {
      const files = this.getRenderingFiles(renderingClassesPath);
      
      for (const file of files) {
        const filePath = path.join(renderingClassesPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const fileDeps = this.extractGlobalsFromFile(content, file);
        
        results.byFile[file] = Array.from(fileDeps);
        fileDeps.forEach(dep => results.dependencies.add(dep));
      }

      // Categorize dependencies
      results.byCategory = this.categorizeDependencies(Array.from(results.dependencies));
      
      // Check for potential issues
      results.warnings = this.generateWarnings(results.byCategory);
      
      return results;
      
    } catch (error) {
      throw new Error(`Failed to scan dependencies: ${error.message}`);
    }
  }

  /**
   * Extract global variable usage from a file's content
   */
  extractGlobalsFromFile(content, fileName) {
    const globals = new Set();
    
    // Look for specific known globals we care about (excluding critical Node.js globals)
    const knownGlobals = [
      ...this.globalCategories.gameState,
      ...this.globalCategories.p5js
      // Exclude browser globals like console, window, document as they shouldn't be mocked
    ];
    
    // Simple search for each known global
    knownGlobals.forEach(globalName => {
      // Look for the global being used (not just declared)
      const usagePatterns = [
        new RegExp(`\\b${globalName}\\s*\\(`, 'g'), // Function calls
        new RegExp(`\\b${globalName}\\s*\\.`, 'g'), // Property access
        new RegExp(`\\b${globalName}\\s*\\[`, 'g'), // Array access
        new RegExp(`\\b${globalName}\\s*=`, 'g'),   // Assignment (might be usage)
      ];
      
      const isUsed = usagePatterns.some(pattern => {
        const matches = content.match(pattern);
        return matches && matches.length > 0;
      });
      
      if (isUsed) {
        // Make sure it's not a local declaration
        const localDeclarations = [
          `var ${globalName}`,
          `let ${globalName}`,
          `const ${globalName}`,
          `function ${globalName}`,
          `class ${globalName}`
        ];
        
        const isLocal = localDeclarations.some(decl => content.includes(decl));
        
        if (!isLocal) {
          globals.add(globalName);
        }
      }
    });
    
    return globals;
  }

  /**
   * Check if a name is likely a global variable
   */
  isLikelyGlobal(name, content) {
    // Skip if it's clearly a local variable, parameter, or property
    if (content.includes(`var ${name}`) || 
        content.includes(`let ${name}`) || 
        content.includes(`const ${name}`) ||
        content.includes(`function ${name}`) ||
        content.includes(`this.${name}`)) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if this is a known global from our categories
   */
  isKnownGlobal(name) {
    return Object.values(this.globalCategories).flat().includes(name);
  }

  /**
   * Check if this looks like a game-specific global
   */
  isLikelyGameGlobal(name) {
    const gameGlobalPatterns = [
      /^g_/, // Globals prefixed with g_
      /Update$/, // Functions ending with Update
      /Col$/, // Collections ending with Col
      /^ant/, // Ant-related variables
      /State$/ // State variables
    ];
    
    return gameGlobalPatterns.some(pattern => pattern.test(name));
  }

  /**
   * Get list of rendering files to scan
   */
  getRenderingFiles(renderingPath) {
    return fs.readdirSync(renderingPath)
      .filter(file => file.endsWith('.js') && !file.includes('test'));
  }

  /**
   * Categorize dependencies by their type
   */
  categorizeDependencies(dependencies) {
    const categorized = {};
    
    Object.keys(this.globalCategories).forEach(category => {
      categorized[category] = dependencies.filter(dep => 
        this.globalCategories[category].includes(dep)
      );
    });
    
    categorized.unknown = dependencies.filter(dep => 
      !Object.values(this.globalCategories).flat().includes(dep)
    );
    
    return categorized;
  }

  /**
   * Generate warnings about dependency issues
   */
  generateWarnings(categorized) {
    const warnings = [];
    
    if (categorized.unknown.length > 0) {
      warnings.push({
        type: 'UNKNOWN_DEPENDENCIES',
        message: `Detected unknown global dependencies: ${categorized.unknown.join(', ')}`,
        severity: 'HIGH',
        action: 'Add these to dependency detector categories or verify they are properly mocked'
      });
    }
    
    if (categorized.gameState.length > 5) {
      warnings.push({
        type: 'HIGH_COUPLING',
        message: `High coupling detected: ${categorized.gameState.length} game state dependencies`,
        severity: 'MEDIUM',
        action: 'Consider dependency injection to reduce coupling'
      });
    }
    
    return warnings;
  }

  /**
   * Validate that our test mocks cover all real dependencies
   */
  validateTestMocks(detectedDeps, testMocks) {
    const validation = {
      covered: [],
      missing: [],
      extra: [],
      issues: []
    };
    
    const detectedSet = new Set(detectedDeps);
    const mockSet = new Set(Object.keys(testMocks));
    
    // Find missing mocks
    detectedSet.forEach(dep => {
      if (mockSet.has(dep)) {
        validation.covered.push(dep);
      } else {
        validation.missing.push(dep);
      }
    });
    
    // Find extra mocks (potentially outdated)
    mockSet.forEach(mock => {
      if (!detectedSet.has(mock)) {
        validation.extra.push(mock);
      }
    });
    
    // Generate issues
    if (validation.missing.length > 0) {
      validation.issues.push({
        type: 'MISSING_MOCKS',
        message: `Tests are missing mocks for: ${validation.missing.join(', ')}`,
        severity: 'HIGH'
      });
    }
    
    if (validation.extra.length > 0) {
      validation.issues.push({
        type: 'OUTDATED_MOCKS',
        message: `Tests have outdated mocks: ${validation.extra.join(', ')}`,
        severity: 'LOW'
      });
    }
    
    return validation;
  }

  /**
   * Generate updated mock configuration based on real dependencies
   */
  generateMockConfiguration(dependencies) {
    const config = {};
    
    dependencies.forEach(dep => {
      if (this.globalCategories.gameState.includes(dep)) {
        config[dep] = this.generateGameStateMock(dep);
      } else if (this.globalCategories.p5js.includes(dep)) {
        config[dep] = this.generateP5Mock(dep);
      } else {
        config[dep] = this.generateGenericMock(dep);
      }
    });
    
    return config;
  }

  /**
   * Generate appropriate mock for game state globals
   */
  generateGameStateMock(dep) {
    const gameStateMocks = {
      antsUpdate: 'function() { /* Mock ant update */ }',
      antsUpdateAndRender: 'function() { /* Mock ant update and render */ }',
      gameState: '"PLAYING"',
      GameState: `{
        getState: () => 'PLAYING',
        onStateChange: (callback) => { 
          if (!global.GameState._callbacks) global.GameState._callbacks = [];
          global.GameState._callbacks.push(callback);
        },
        setState: (newState) => {
          const oldState = global.GameState._currentState || 'MENU';
          global.GameState._currentState = newState;
          if (global.GameState._callbacks) {
            global.GameState._callbacks.forEach(cb => cb(newState, oldState));
          }
        },
        _currentState: 'PLAYING'
      }`,
      g_resourceList: '{ resources: [], updateAll: function() {} }',
      antCol: '{ ants: [] }'
    };
    
    return gameStateMocks[dep] || '{}';
  }

  /**
   * Generate appropriate mock for p5.js globals
   */
  generateP5Mock(dep) {
    const p5Mocks = {
      createVector: '(x, y) => ({ x, y, copy: () => ({ x, y }) })',
      translate: 'function() {}',
      rotate: 'function() {}',
      tint: 'function() {}',
      radians: '(degrees) => degrees * Math.PI / 180',
      push: 'function() {}',
      pop: 'function() {}',
      fill: 'function() {}',
      stroke: 'function() {}',
      rect: 'function() {}',
      ellipse: 'function() {}',
      g_canvasX: '800',
      g_canvasY: '600'
    };
    
    return p5Mocks[dep] || 'function() {}';
  }

  /**
   * Generate generic mock
   */
  generateGenericMock(dep) {
    return '{}';
  }
}

module.exports = { DependencyDetector };