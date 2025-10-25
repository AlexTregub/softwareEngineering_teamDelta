/**
 * Smart Smoke Test Runner
 * 
 * Automatically manages the dev server:
 * 1. Checks if localhost:8000 is already running
 * 2. Starts server if needed
 * 3. Runs smoke tests
 * 4. Leaves server running (for development workflow)
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 8000;
const TEST_FILES = [
  'helper_smoke_test.js',
  '_smoke_camera_test.js'
];

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Check if server is already running on localhost:8000
 */
function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}`, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Wait for server to be ready
 */
function waitForServer(maxAttempts = 30, delayMs = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      
      http.get(`http://localhost:${PORT}`, (res) => {
        log(`✓ Server is ready on http://localhost:${PORT}`, colors.green);
        res.resume(); // Consume response data to free up memory
        resolve();
      }).on('error', (err) => {
        if (attempts >= maxAttempts) {
          reject(new Error(`Server did not start after ${maxAttempts} attempts (${maxAttempts * delayMs / 1000}s). Error: ${err.message}`));
          return;
        }
        
        setTimeout(check, delayMs);
      }).setTimeout(1000, function() {
        this.destroy();
        if (attempts >= maxAttempts) {
          reject(new Error(`Server did not start after ${maxAttempts} attempts (timeout)`));
          return;
        }
        setTimeout(check, delayMs);
      });
    };
    
    check();
  });
}

/**
 * Start the dev server
 */
async function startDevServer() {
  return new Promise((resolve, reject) => {
    log('\n🚀 Starting dev server...', colors.blue);
    
    // Use Python's http.server module
    const serverProcess = spawn('python', ['-m', 'http.server', PORT.toString()], {
      cwd: path.resolve(__dirname, '../..'),
      stdio: ['ignore', 'pipe', 'pipe'], // ignore stdin, pipe stdout/stderr
      shell: true,
      detached: false
    });
    
    let serverStarted = false;
    
    serverProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message.includes('Serving HTTP')) {
        serverStarted = true;
        log(`  ${message}`, colors.yellow);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      
      // Check if port is already in use
      if (message.includes('Address already in use') || message.includes('OSError')) {
        serverProcess.kill();
        reject(new Error(`Port ${PORT} is already in use. Please stop the existing server first.`));
        return;
      }
      
      // Only show actual errors (404, 500, etc.) not successful 200 responses
      if (message && !message.includes(' 200 -') && !message.includes(' 304 -')) {
        log(`  [Server] ${message}`, colors.red);
      }
    });
    
    serverProcess.on('error', (error) => {
      reject(new Error(`Failed to start server: ${error.message}`));
    });
    
    serverProcess.on('close', (code) => {
      if (code !== 0 && !serverStarted) {
        reject(new Error(`Server exited with code ${code} before starting`));
      }
    });
    
    // Store the process so we can optionally stop it later
    global.devServerProcess = serverProcess;
    
    // Give Python a moment to bind to the port
    setTimeout(() => resolve(serverProcess), 1000);
  });
}

/**
 * Run a single smoke test file
 */
function runTest(testFile) {
  return new Promise((resolve, reject) => {
    log(`\n📝 Running: ${testFile}`, colors.bright);
    
    const testProcess = spawn('node', [testFile], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        log(`✓ ${testFile} passed`, colors.green);
        resolve();
      } else {
        reject(new Error(`${testFile} failed with exit code ${code}`));
      }
    });
    
    testProcess.on('error', (error) => {
      reject(new Error(`Failed to run ${testFile}: ${error.message}`));
    });
  });
}

/**
 * Main execution
 */
async function main() {
  let serverWasStarted = false;
  
  try {
    log('\n' + '='.repeat(60), colors.blue);
    log('🔥 SMOKE TEST RUNNER', colors.bright + colors.blue);
    log('='.repeat(60) + '\n', colors.blue);
    
    // Check if server is already running
    const serverRunning = await checkServerRunning();
    
    if (serverRunning) {
      log('✓ Dev server already running on http://localhost:' + PORT, colors.green);
    } else {
      // Start the server
      await startDevServer();
      serverWasStarted = true;
      
      // Wait for it to be ready
      await waitForServer();
    }
    
    log('\n' + '-'.repeat(60), colors.blue);
    log('Running smoke tests...', colors.bright);
    log('-'.repeat(60) + '\n', colors.blue);
    
    // Run all smoke tests in sequence
    for (const testFile of TEST_FILES) {
      await runTest(testFile);
    }
    
    log('\n' + '='.repeat(60), colors.green);
    log('✓ ALL SMOKE TESTS PASSED', colors.bright + colors.green);
    log('='.repeat(60) + '\n', colors.green);
    
    if (serverWasStarted) {
      log('ℹ️  Dev server left running for development', colors.blue);
      log('   Stop with: Ctrl+C or kill the Python process\n', colors.blue);
    }
    
    process.exit(0);
    
  } catch (error) {
    log('\n' + '='.repeat(60), colors.red);
    log('✗ SMOKE TESTS FAILED', colors.bright + colors.red);
    log('='.repeat(60), colors.red);
    log(`\nError: ${error.message}\n`, colors.red);
    
    // Clean up server if we started it
    if (serverWasStarted && global.devServerProcess) {
      log('Stopping dev server...', colors.yellow);
      global.devServerProcess.kill();
    }
    
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\nInterrupted by user', colors.yellow);
  
  if (global.devServerProcess) {
    log('Stopping dev server...', colors.yellow);
    global.devServerProcess.kill();
  }
  
  process.exit(130);
});

// Run it!
main();
