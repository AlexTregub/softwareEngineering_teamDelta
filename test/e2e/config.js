/**
 * E2E Test Configuration
 * Central configuration for all end-to-end tests
 */

const path = require('path');

module.exports = {
  // Base URL for game server
  baseURL: 'http://localhost:8000',
  
  // Puppeteer browser configuration
  browser: {
    headless: true,
    slowMo: 0,
    args: [
      '--headless=new',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  },
  
  // Viewport configuration
  viewport: {
    width: 1920,
    height: 1080
  },
  
  // Timeout settings (milliseconds)
  timeouts: {
    navigation: 30000,
    default: 30000,
    test: 60000,
    action: 5000,
    screenshot: 2000
  },
  
  // Screenshot configuration
  screenshots: {
    enabled: true,
    path: path.join(__dirname, 'screenshots', 'pre-implementation'),
    captureOnFailure: true,
    captureOnSuccess: true,
    fullPage: false
  },
  
  // Video recording configuration
  videos: {
    enabled: false,
    path: path.join(__dirname, 'videos', 'pre-implementation'),
    recordOnFailure: true
  },
  
  // Test report configuration
  reports: {
    enabled: true,
    path: path.join(__dirname, 'reports'),
    format: 'json',
    includeScreenshots: true,
    includePerformance: true
  },
  
  // Performance benchmarks
  performance: {
    fps: {
      10: { min: 60, target: 60 },
      50: { min: 30, target: 40 },
      100: { min: 20, target: 25 }
    },
    memory: {
      max: 500, // MB
      warning: 400 // MB
    },
    frameTime: {
      max: 33.33, // ~30 FPS
      target: 16.67 // ~60 FPS
    }
  },
  
  // Game-specific configuration
  game: {
    canvas: {
      width: 1920,
      height: 1080
    },
    worldSize: {
      width: 2000,
      height: 2000
    },
    tileSize: 32,
    defaultJobTypes: ['Scout', 'Builder', 'Warrior', 'Farmer', 'Spitter'],
    validStates: [
      'IDLE', 'MOVING', 'GATHERING', 'DROPPING_OFF',
      'ATTACKING', 'DEFENDING', 'BUILDING', 'PATROL',
      'FOLLOWING', 'SOCIALIZING', 'MATING', 'FLEEING', 'DEAD'
    ]
  },
  
  // Test data factories
  factories: {
    entity: {
      x: 100,
      y: 100,
      width: 32,
      height: 32,
      type: 'TestEntity',
      movementSpeed: 2.0,
      selectable: true,
      faction: 'player'
    },
    ant: {
      x: 100,
      y: 100,
      sizex: 20,
      sizey: 20,
      movementSpeed: 30,
      rotation: 0,
      img: null,
      JobName: 'Scout',
      faction: 'player'
    },
    resource: {
      x: 300,
      y: 300,
      type: 'food',
      amount: 10,
      size: 16
    }
  },
  
  // Test categories and their settings
  categories: {
    entity: {
      enabled: true,
      timeout: 30000
    },
    controllers: {
      enabled: true,
      timeout: 30000
    },
    ants: {
      enabled: true,
      timeout: 30000
    },
    queen: {
      enabled: true,
      timeout: 30000
    },
    state: {
      enabled: true,
      timeout: 30000
    },
    brain: {
      enabled: true,
      timeout: 30000
    },
    resources: {
      enabled: true,
      timeout: 30000
    },
    spatial: {
      enabled: true,
      timeout: 30000
    },
    camera: {
      enabled: true,
      timeout: 30000
    },
    ui: {
      enabled: true,
      timeout: 30000
    },
    integration: {
      enabled: true,
      timeout: 60000
    },
    performance: {
      enabled: true,
      timeout: 120000
    }
  },
  
  // Retry configuration
  retry: {
    enabled: true,
    maxAttempts: 2,
    retryOnFailure: true,
    retryDelay: 1000
  },
  
  // Logging configuration
  logging: {
    enabled: true,
    level: 'info', // 'debug', 'info', 'warn', 'error'
    logToFile: true,
    logFile: path.join(__dirname, 'logs', 'test-run.log')
  },
  
  // Cleanup configuration
  cleanup: {
    screenshotsOlderThan: 7, // days
    reportsOlderThan: 30, // days
    logsOlderThan: 14 // days
  }
};
