// Script Configuration for Ant Game
// Central configuration for all JavaScript dependencies

const SCRIPT_CONFIG = {
  // Environment settings
  environments: {
    production: {
      includeDebug: false,
      includeTests: false,
      minified: true
    },
    development: {
      includeDebug: true,
      includeTests: false,
      minified: false
    },
    test: {
      includeDebug: true,
      includeTests: true,
      minified: false
    }
  },

  // Script groups in dependency order
  scriptGroups: {
    // External libraries (highest priority)
    libraries: {
      order: 1,
      scripts: [
        'libraries/p5.min.js',
        'libraries/p5.sound.min.js'
      ],
      description: 'External libraries and frameworks'
    },

    // Core utilities and base classes
    foundation: {
      order: 2,
      scripts: [
        'Classes/resource.js',
        'Classes/coordinateSystem.js',
        'Classes/entities/sprite2d.js',
        'Classes/entities/stats.js',
        'Classes/terrianGen.js',
        'Classes/pathfinding.js',
        'Classes/grid.js'
      ],
      description: 'Core game foundation classes'
    },

    // Ant system components
    ants: {
      order: 3,
      scripts: [
        'Classes/ants/species.js',
        'Classes/ants/antWrapper.js',
        'Classes/ants/antStateMachine.js',
        'Classes/ants/faction.js',
        'Classes/ants/ants.js',
        'Classes/ants/Queen.js'
      ],
      description: 'Ant behavior and management system'
    },

    // Game mechanics and UI
    game: {
      order: 4,
      scripts: [
        'Classes/selectionBox.js',
        'Classes/menu.js'
      ],
      description: 'Game mechanics and user interface'
    },

    // Development and debugging tools
    debug: {
      order: 5,
      scripts: [
        'debug/commandLine.js',
        'debug/testing.js',
        'scripts/utils.js',
        'scripts/validator.js'
      ],
      description: 'Debug and development utilities',
      environments: ['development', 'test']
    },

    // Type utilities and helpers
    types: {
      order: 6,
      scripts: [
        'TypeTests/vectorTypeTests.js'
      ],
      description: 'Type checking and validation utilities',
      environments: ['development', 'test']
    },

    // Test suites
    tests: {
      order: 7,
      scripts: [
        'test/selectionBox.test.js',
        'test/selectionBox.integration.test.js', 
        'test/menu-button-diagnostics.test.js',
        'test/vectorTypeTests.test.js',
        'test/scriptLoader.namingConventions.test.js',
        'test/scriptLoader.browserIntegration.test.js'
      ],
      description: 'Automated test suites',
      environments: ['test']
    },

    // Main application entry point
    main: {
      order: 8,
      scripts: [
        'sketch.js'
      ],
      description: 'Main application entry point'
    }
  },

  // Error handling configuration
  errorHandling: {
    continueOnError: true,
    retryAttempts: 2,
    retryDelay: 1000,
    criticalScripts: [
      'libraries/p5.min.js',
      'sketch.js'
    ]
  },

  // Performance settings
  performance: {
    parallelLoading: false, // Keep false to preserve dependency order
    showProgress: true,
    logTiming: true,
    preloadImages: false
  }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SCRIPT_CONFIG;
} else {
  window.SCRIPT_CONFIG = SCRIPT_CONFIG;
}