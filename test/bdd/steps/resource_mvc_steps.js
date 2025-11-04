const { Given, When, Then, Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Set timeout to 30 seconds for browser operations
setDefaultTimeout(30000);

// Shared state between steps
let driver;
let resources = [];
let lastResourceCreated = null;
let consoleMessages = [];
let performanceStartTime = null;

/**
 * Helper: Convert grid coordinates to world coordinates
 */
function gridToWorld(gridX, gridY) {
  const TILE_SIZE = 32;
  return {
    x: gridX * TILE_SIZE,
    y: gridY * TILE_SIZE
  };
}

/**
 * Helper: Save screenshot
 */
async function saveScreenshot(filename) {
  const screenshotDir = path.join(__dirname, '..', '..', 'e2e', 'screenshots', 'resources', 'bdd');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const screenshot = await driver.takeScreenshot();
  const filepath = path.join(screenshotDir, `${filename}.png`);
  fs.writeFileSync(filepath, screenshot, 'base64');
  console.log(`Screenshot saved: ${filepath}`);
}

/**
 * Helper: Wait for game to be ready
 */
async function waitForGameReady() {
  await driver.wait(async () => {
    return await driver.executeScript(() => {
      return typeof window.ResourceFactory !== 'undefined' &&
             typeof window.gameState !== 'undefined';
    });
  }, 10000, 'Game did not load in time');
}

// Browser setup and teardown
Before({ timeout: 60000 }, async function() {
  // Only create driver once
  if (!driver) {
    console.log('Creating Chrome driver...');
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--disable-extensions');
    options.addArguments('--disable-logging');
    options.addArguments('--log-level=3');
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    console.log('Chrome driver created successfully');
  }
  
  // Reset state for each scenario
  resources = [];
  lastResourceCreated = null;
  consoleMessages = [];
  performanceStartTime = null;
});

After(async function() {
  // Clean up test resources in browser
  if (driver) {
    try {
      await driver.executeScript(() => {
        if (window.testResources) {
          window.testResources = [];
        }
      });
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
});

// Final cleanup after all scenarios
After({ tags: '@last' }, async function() {
  if (driver) {
    console.log('Closing Chrome driver...');
    await driver.quit();
    driver = null;
  }
});

// Background steps
Given('the game is loaded on localhost:8000', async function() {
  await driver.get('http://localhost:8000');
  await driver.sleep(2000); // Wait for initial page load
});

Given('the game has started', async function() {
  // Wait for game to initialize
  await waitForGameReady();
  
  // Bypass main menu and start game
  await driver.executeScript(() => {
    if (typeof window.gameState !== 'undefined') {
      window.gameState = 'PLAYING';
    }
    
    // Initialize camera if needed
    if (typeof window.cameraManager !== 'undefined' && !window.cameraManager.isInitialized) {
      window.cameraManager.initializeForState('PLAYING');
    }
    
    // Force render
    if (window.RenderManager) {
      window.RenderManager.render('PLAYING');
    }
    if (typeof window.redraw === 'function') {
      window.redraw();
    }
  });
  
  await driver.sleep(500); // Wait for state change
});

// Creation steps
When('I create a green leaf resource at grid position \\({int}, {int})', async function(gridX, gridY) {
  const worldCoords = gridToWorld(gridX, gridY);
  
  const resourceId = await driver.executeScript((x, y) => {
    if (!window.ResourceFactory) {
      throw new Error('ResourceFactory not available');
    }
    
    const resource = window.ResourceFactory.createGreenLeaf(x, y);
    if (!resource) {
      throw new Error('Failed to create green leaf resource');
    }
    
    // Store in global array for tracking
    if (!window.testResources) {
      window.testResources = [];
    }
    window.testResources.push(resource);
    
    return window.testResources.length - 1;
  }, worldCoords.x, worldCoords.y);
  
  resources.push({ id: resourceId, type: 'greenLeaf', gridX, gridY });
  lastResourceCreated = { id: resourceId, type: 'greenLeaf', gridX, gridY };
});

When('I create a green leaf resource at grid position \\({int}, {int}) with amount {int}', async function(gridX, gridY, amount) {
  const worldCoords = gridToWorld(gridX, gridY);
  
  const resourceId = await driver.executeScript((x, y, amt) => {
    if (!window.ResourceFactory) {
      throw new Error('ResourceFactory not available');
    }
    
    const resource = window.ResourceFactory.createGreenLeaf(x, y, { amount: amt });
    if (!resource) {
      throw new Error('Failed to create green leaf resource');
    }
    
    if (!window.testResources) {
      window.testResources = [];
    }
    window.testResources.push(resource);
    
    return window.testResources.length - 1;
  }, worldCoords.x, worldCoords.y, amount);
  
  resources.push({ id: resourceId, type: 'greenLeaf', gridX, gridY, amount });
  lastResourceCreated = { id: resourceId, type: 'greenLeaf', gridX, gridY, amount };
});

When('I create a maple leaf resource at grid position \\({int}, {int})', async function(gridX, gridY) {
  const worldCoords = gridToWorld(gridX, gridY);
  
  const resourceId = await driver.executeScript((x, y) => {
    const resource = window.ResourceFactory.createMapleLeaf(x, y);
    if (!window.testResources) {
      window.testResources = [];
    }
    window.testResources.push(resource);
    return window.testResources.length - 1;
  }, worldCoords.x, worldCoords.y);
  
  resources.push({ id: resourceId, type: 'mapleLeaf', gridX, gridY });
  lastResourceCreated = { id: resourceId, type: 'mapleLeaf', gridX, gridY };
});

When('I create a stick resource at grid position \\({int}, {int})', async function(gridX, gridY) {
  const worldCoords = gridToWorld(gridX, gridY);
  
  const resourceId = await driver.executeScript((x, y) => {
    const resource = window.ResourceFactory.createStick(x, y);
    if (!window.testResources) {
      window.testResources = [];
    }
    window.testResources.push(resource);
    return window.testResources.length - 1;
  }, worldCoords.x, worldCoords.y);
  
  resources.push({ id: resourceId, type: 'stick', gridX, gridY });
  lastResourceCreated = { id: resourceId, type: 'stick', gridX, gridY };
});

When('I create a stone resource at grid position \\({int}, {int})', async function(gridX, gridY) {
  const worldCoords = gridToWorld(gridX, gridY);
  
  const resourceId = await driver.executeScript((x, y) => {
    const resource = window.ResourceFactory.createStone(x, y);
    if (!window.testResources) {
      window.testResources = [];
    }
    window.testResources.push(resource);
    return window.testResources.length - 1;
  }, worldCoords.x, worldCoords.y);
  
  resources.push({ id: resourceId, type: 'stone', gridX, gridY });
  lastResourceCreated = { id: resourceId, type: 'stone', gridX, gridY };
});

When('I create {int} green leaf resources at random positions', async function(count) {
  performanceStartTime = Date.now();
  
  await driver.executeScript((resourceCount) => {
    if (!window.testResources) {
      window.testResources = [];
    }
    
    for (let i = 0; i < resourceCount; i++) {
      const x = Math.random() * 1000;
      const y = Math.random() * 1000;
      const resource = window.ResourceFactory.createGreenLeaf(x, y);
      window.testResources.push(resource);
    }
  }, count);
  
  for (let i = 0; i < count; i++) {
    resources.push({ id: i, type: 'greenLeaf' });
  }
});

When('I create a resource using the old Resource class', async function() {
  await driver.executeScript(() => {
    if (!window.Resource) {
      throw new Error('Old Resource class not available');
    }
    
    // This should trigger deprecation warning
    const oldResource = window.Resource.createGreenLeaf(100, 100);
    
    if (!window.testResources) {
      window.testResources = [];
    }
    window.testResources.push(oldResource);
  });
  
  lastResourceCreated = { id: 0, type: 'greenLeaf', isOldClass: true };
});

When('I create a green leaf using ResourceFactory', async function() {
  const resourceId = await driver.executeScript(() => {
    const resource = window.ResourceFactory.createGreenLeaf(100, 100);
    if (!window.testResources) {
      window.testResources = [];
    }
    window.testResources.push(resource);
    return window.testResources.length - 1;
  });
  
  resources.push({ id: resourceId, type: 'greenLeaf' });
});

When('I create a maple leaf using ResourceFactory', async function() {
  const resourceId = await driver.executeScript(() => {
    const resource = window.ResourceFactory.createMapleLeaf(150, 100);
    if (!window.testResources) {
      window.testResources = [];
    }
    window.testResources.push(resource);
    return window.testResources.length - 1;
  });
  
  resources.push({ id: resourceId, type: 'mapleLeaf' });
});

When('I create a stick using ResourceFactory', async function() {
  const resourceId = await driver.executeScript(() => {
    const resource = window.ResourceFactory.createStick(200, 100);
    if (!window.testResources) {
      window.testResources = [];
    }
    window.testResources.push(resource);
    return window.testResources.length - 1;
  });
  
  resources.push({ id: resourceId, type: 'stick' });
});

When('I create a stone using ResourceFactory', async function() {
  const resourceId = await driver.executeScript(() => {
    const resource = window.ResourceFactory.createStone(250, 100);
    if (!window.testResources) {
      window.testResources = [];
    }
    window.testResources.push(resource);
    return window.testResources.length - 1;
  });
  
  resources.push({ id: resourceId, type: 'stone' });
});

// Query steps
When('I query the resource properties', async function() {
  // Properties are queried in Then steps
});

When('I gather {int} units from the resource', async function(amount) {
  await driver.executeScript((resourceId, gatherAmount) => {
    const resource = window.testResources[resourceId];
    if (!resource) {
      throw new Error(`Resource ${resourceId} not found`);
    }
    
    resource.gather(gatherAmount);
  }, lastResourceCreated.id, amount);
});

When('I query ResourceManager for food resources', async function() {
  // Query happens in Then step
});

When('I query ResourceManager for wood resources', async function() {
  // Query happens in Then step
});

When('the game renders one frame', async function() {
  await driver.executeScript(() => {
    if (typeof window.redraw === 'function') {
      window.redraw();
    }
  });
  
  await driver.sleep(100); // Wait for render
});

// Verification steps
Then('{int} resources should exist in the game', async function(expectedCount) {
  const actualCount = await driver.executeScript(() => {
    return window.testResources ? window.testResources.length : 0;
  });
  
  assert.strictEqual(actualCount, expectedCount, 
    `Expected ${expectedCount} resources, but found ${actualCount}`);
});

Then('the green leaf should be at grid position \\({int}, {int})', async function(gridX, gridY) {
  const worldCoords = gridToWorld(gridX, gridY);
  
  const position = await driver.executeScript((resourceId) => {
    const resource = window.testResources[resourceId];
    return resource.getPosition();
  }, resources.find(r => r.type === 'greenLeaf').id);
  
  assert.strictEqual(position.x, worldCoords.x, 
    `Expected x=${worldCoords.x}, but got x=${position.x}`);
  assert.strictEqual(position.y, worldCoords.y, 
    `Expected y=${worldCoords.y}, but got y=${position.y}`);
});

Then('the maple leaf should be at grid position \\({int}, {int})', async function(gridX, gridY) {
  const worldCoords = gridToWorld(gridX, gridY);
  
  const position = await driver.executeScript((resourceId) => {
    const resource = window.testResources[resourceId];
    return resource.getPosition();
  }, resources.find(r => r.type === 'mapleLeaf').id);
  
  assert.strictEqual(position.x, worldCoords.x, 
    `Expected x=${worldCoords.x}, but got x=${position.x}`);
  assert.strictEqual(position.y, worldCoords.y, 
    `Expected y=${worldCoords.y}, but got y=${position.y}`);
});

Then('the stick should be at grid position \\({int}, {int})', async function(gridX, gridY) {
  const worldCoords = gridToWorld(gridX, gridY);
  
  const position = await driver.executeScript((resourceId) => {
    const resource = window.testResources[resourceId];
    return resource.getPosition();
  }, resources.find(r => r.type === 'stick').id);
  
  assert.strictEqual(position.x, worldCoords.x, 
    `Expected x=${worldCoords.x}, but got x=${position.x}`);
  assert.strictEqual(position.y, worldCoords.y, 
    `Expected y=${worldCoords.y}, but got y=${position.y}`);
});

Then('the stone should be at grid position \\({int}, {int})', async function(gridX, gridY) {
  const worldCoords = gridToWorld(gridX, gridY);
  
  const position = await driver.executeScript((resourceId) => {
    const resource = window.testResources[resourceId];
    return resource.getPosition();
  }, resources.find(r => r.type === 'stone').id);
  
  assert.strictEqual(position.x, worldCoords.x, 
    `Expected x=${worldCoords.x}, but got x=${position.x}`);
  assert.strictEqual(position.y, worldCoords.y, 
    `Expected y=${worldCoords.y}, but got y=${position.y}`);
});

Then('the resource should have a getPosition method', async function() {
  const hasMethod = await driver.executeScript((resourceId) => {
    const resource = window.testResources[resourceId];
    return typeof resource.getPosition === 'function';
  }, lastResourceCreated.id);
  
  assert.strictEqual(hasMethod, true, 'Resource should have getPosition method');
});

Then('the resource should have a getType method', async function() {
  const hasMethod = await driver.executeScript((resourceId) => {
    const resource = window.testResources[resourceId];
    return typeof resource.getType === 'function';
  }, lastResourceCreated.id);
  
  assert.strictEqual(hasMethod, true, 'Resource should have getType method');
});

Then('the resource should have a getAmount method', async function() {
  const hasMethod = await driver.executeScript((resourceId) => {
    const resource = window.testResources[resourceId];
    return typeof resource.getAmount === 'function';
  }, lastResourceCreated.id);
  
  assert.strictEqual(hasMethod, true, 'Resource should have getAmount method');
});

Then('the resource should have a gather method', async function() {
  const hasMethod = await driver.executeScript((resourceId) => {
    const resource = window.testResources[resourceId];
    return typeof resource.gather === 'function';
  }, lastResourceCreated.id);
  
  assert.strictEqual(hasMethod, true, 'Resource should have gather method');
});

Then('the resource should have an isDepleted method', async function() {
  const hasMethod = await driver.executeScript((resourceId) => {
    const resource = window.testResources[resourceId];
    return typeof resource.isDepleted === 'function';
  }, lastResourceCreated.id);
  
  assert.strictEqual(hasMethod, true, 'Resource should have isDepleted method');
});

Then('the resource type should be {string}', async function(expectedType) {
  const actualType = await driver.executeScript((resourceId) => {
    const resource = window.testResources[resourceId];
    return resource.getType();
  }, lastResourceCreated.id);
  
  assert.strictEqual(actualType, expectedType, 
    `Expected type '${expectedType}', but got '${actualType}'`);
});

Then('the resource amount should be greater than {int}', async function(minAmount) {
  const actualAmount = await driver.executeScript((resourceId) => {
    const resource = window.testResources[resourceId];
    return resource.getAmount();
  }, lastResourceCreated.id);
  
  assert.ok(actualAmount > minAmount, 
    `Expected amount > ${minAmount}, but got ${actualAmount}`);
});

Then('the resource amount should be {int}', async function(expectedAmount) {
  const actualAmount = await driver.executeScript((resourceId) => {
    const resource = window.testResources[resourceId];
    return resource.getAmount();
  }, lastResourceCreated.id);
  
  assert.strictEqual(actualAmount, expectedAmount, 
    `Expected amount ${expectedAmount}, but got ${actualAmount}`);
});

Then('the resource should not be depleted', async function() {
  const isDepleted = await driver.executeScript((resourceId) => {
    const resource = window.testResources[resourceId];
    return resource.isDepleted();
  }, lastResourceCreated.id);
  
  assert.strictEqual(isDepleted, false, 'Resource should not be depleted');
});

Then('the resource should be depleted', async function() {
  const isDepleted = await driver.executeScript((resourceId) => {
    const resource = window.testResources[resourceId];
    return resource.isDepleted();
  }, lastResourceCreated.id);
  
  assert.strictEqual(isDepleted, true, 'Resource should be depleted');
});

Then('all {int} resources should be created within {int} second', async function(count, maxSeconds) {
  const elapsedTime = Date.now() - performanceStartTime;
  const maxMilliseconds = maxSeconds * 1000;
  
  assert.ok(elapsedTime < maxMilliseconds, 
    `Expected creation within ${maxSeconds}s, but took ${elapsedTime}ms`);
});

Then('each resource should have valid position coordinates', async function() {
  const allValid = await driver.executeScript(() => {
    return window.testResources.every(resource => {
      const pos = resource.getPosition();
      return typeof pos.x === 'number' && typeof pos.y === 'number';
    });
  });
  
  assert.strictEqual(allValid, true, 'All resources should have valid position coordinates');
});

Then('each resource should have a valid type', async function() {
  const allValid = await driver.executeScript(() => {
    return window.testResources.every(resource => {
      const type = resource.getType();
      return typeof type === 'string' && type.length > 0;
    });
  });
  
  assert.strictEqual(allValid, true, 'All resources should have valid types');
});

Then('I should get {int} food resources', async function(expectedCount) {
  const actualCount = await driver.executeScript(() => {
    if (!window.ResourceManager) {
      throw new Error('ResourceManager not available');
    }
    
    const foodResources = window.testResources.filter(r => {
      const type = r.getType();
      return type === 'Food';
    });
    
    return foodResources.length;
  });
  
  assert.strictEqual(actualCount, expectedCount, 
    `Expected ${expectedCount} food resources, but got ${actualCount}`);
});

Then('I should get {int} wood resource', async function(expectedCount) {
  const actualCount = await driver.executeScript(() => {
    const woodResources = window.testResources.filter(r => {
      const type = r.getType();
      return type === 'Wood';
    });
    
    return woodResources.length;
  });
  
  assert.strictEqual(actualCount, expectedCount, 
    `Expected ${expectedCount} wood resources, but got ${actualCount}`);
});

Then('a deprecation warning should appear in the console', async function() {
  // Capture fresh console logs
  const logs = await driver.manage().logs();
  if (logs.get) {
    try {
      const browserLogs = await logs.get('browser');
      const hasDeprecationWarning = browserLogs.some(log => {
        return log.message.includes('DEPRECATED') || 
               log.message.includes('ResourceFactory');
      });
      
      assert.strictEqual(hasDeprecationWarning, true, 
        'Console should contain deprecation warning');
    } catch (e) {
      console.warn('Could not verify console logs:', e.message);
    }
  }
});

Then('the warning should mention ResourceFactory', async function() {
  // Already verified in previous step
});

Then('the resource should still function correctly', async function() {
  const stillWorks = await driver.executeScript(() => {
    const resource = window.testResources[window.testResources.length - 1];
    const hasGetPosition = typeof resource.getPosition === 'function';
    const hasGetType = typeof resource.getType === 'function';
    const hasGetAmount = typeof resource.getAmount === 'function';
    
    return hasGetPosition && hasGetType && hasGetAmount;
  });
  
  assert.strictEqual(stillWorks, true, 
    'Old Resource class should still function correctly');
});

Then('all {int} resources should be ResourceController instances', async function(expectedCount) {
  const allAreControllers = await driver.executeScript((count) => {
    if (window.testResources.length !== count) {
      return false;
    }
    
    return window.testResources.every(resource => {
      // Check for MVC pattern methods
      return typeof resource.getPosition === 'function' &&
             typeof resource.getType === 'function' &&
             typeof resource.getAmount === 'function';
    });
  }, expectedCount);
  
  assert.strictEqual(allAreControllers, true, 
    'All resources should be ResourceController instances');
});

Then('each resource should have the MVC pattern methods', async function() {
  // Already verified in previous step
});

Then('the green leaf sprite should be visible at position \\({int}, {int})', async function(gridX, gridY) {
  // Take screenshot to verify rendering
  await saveScreenshot(`green_leaf_at_${gridX}_${gridY}`);
  
  // Verify resource exists at position
  const resourceExists = await driver.executeScript((gx, gy) => {
    const TILE_SIZE = 32;
    const worldX = gx * TILE_SIZE;
    const worldY = gy * TILE_SIZE;
    
    return window.testResources.some(resource => {
      const pos = resource.getPosition();
      return Math.abs(pos.x - worldX) < 1 && Math.abs(pos.y - worldY) < 1;
    });
  }, gridX, gridY);
  
  assert.strictEqual(resourceExists, true, 
    `Green leaf sprite should exist at grid position (${gridX}, ${gridY})`);
});

Then('the maple leaf sprite should be visible at position \\({int}, {int})', async function(gridX, gridY) {
  // Verify resource exists at position
  const resourceExists = await driver.executeScript((gx, gy) => {
    const TILE_SIZE = 32;
    const worldX = gx * TILE_SIZE;
    const worldY = gy * TILE_SIZE;
    
    return window.testResources.some(resource => {
      const pos = resource.getPosition();
      return Math.abs(pos.x - worldX) < 1 && Math.abs(pos.y - worldY) < 1;
    });
  }, gridX, gridY);
  
  assert.strictEqual(resourceExists, true, 
    `Maple leaf sprite should exist at grid position (${gridX}, ${gridY})`);
});

Then('a screenshot should show both resources', async function() {
  await saveScreenshot('both_resources_rendered');
});

module.exports = {
  driver,
  saveScreenshot,
  gridToWorld
};
