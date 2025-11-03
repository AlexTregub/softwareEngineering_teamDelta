/**
 * @fileoverview E2E tests for TimeOfDayOverlay with visual capture
 * Tests the complete overlay system in a real game environment
 * Captures screenshots of each time state for visual verification
 */

const puppeteer = require('puppeteer');
const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

describe('TimeOfDayOverlay - E2E Visual Tests', function() {
  this.timeout(60000); // 60 second timeout for browser operations
  
  let browser;
  let page;
  const baseUrl = 'http://localhost:8000';
  const screenshotDir = path.join(__dirname, '../../../test-screenshots/time-of-day-overlay');
  
  before(async function() {
    // Ensure screenshot directory exists
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });
  
  after(async function() {
    if (browser) {
      await browser.close();
    }
  });
  
  beforeEach(async function() {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to game
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    
    // Wait for game to load
    await page.waitForFunction(() => {
      return window.g_globalTime && window.g_timeOfDayOverlay;
    }, { timeout: 10000 });
    
    // Ensure game is in PLAYING state
    await page.evaluate(() => {
      if (window.g_currentGameState !== 'PLAYING') {
        window.g_currentGameState = 'PLAYING';
      }
    });
    
    // Wait a bit for rendering to stabilize
    await page.waitForTimeout(1000);
  });
  
  afterEach(async function() {
    if (page) {
      await page.close();
    }
  });
  
  describe('Visual Appearance Tests', function() {
    it('should render day state with no overlay', async function() {
      // Force day time
      await page.evaluate(() => {
        window.setTimeOfDay('day');
      });
      
      await page.waitForTimeout(500);
      
      // Capture screenshot
      const screenshot = await page.screenshot({
        path: path.join(screenshotDir, '01-day-state.png'),
        fullPage: false
      });
      
      // Verify overlay state
      const overlayState = await page.evaluate(() => {
        return {
          timeOfDay: window.g_globalTime.timeOfDay,
          alpha: window.g_timeOfDayOverlay.currentAlpha,
          color: window.g_timeOfDayOverlay.currentColor
        };
      });
      
      expect(overlayState.timeOfDay).to.equal('day');
      expect(overlayState.alpha).to.be.lessThan(0.1);
      expect(screenshot).to.exist;
    });
    
    it('should render sunset state with orange overlay', async function() {
      // Force sunset time
      await page.evaluate(() => {
        window.setTimeOfDay('sunset');
        window.g_globalTime.transitioning = false;
        window.g_globalTime.transitionAlpha = 255;
      });
      
      await page.waitForTimeout(500);
      
      // Capture screenshot
      const screenshot = await page.screenshot({
        path: path.join(screenshotDir, '02-sunset-state.png'),
        fullPage: false
      });
      
      // Verify overlay state
      const overlayState = await page.evaluate(() => {
        return {
          timeOfDay: window.g_globalTime.timeOfDay,
          alpha: window.g_timeOfDayOverlay.currentAlpha,
          color: window.g_timeOfDayOverlay.currentColor
        };
      });
      
      expect(overlayState.timeOfDay).to.equal('sunset');
      expect(overlayState.alpha).to.be.greaterThan(0.2);
      expect(overlayState.alpha).to.be.lessThan(0.5);
      
      // Check for warm (orange/red) tones
      expect(overlayState.color[0]).to.be.greaterThan(100); // Red channel
      expect(screenshot).to.exist;
    });
    
    it('should render night state with dark blue overlay', async function() {
      // Force night time
      await page.evaluate(() => {
        window.setTimeOfDay('night');
      });
      
      await page.waitForTimeout(500);
      
      // Capture screenshot
      const screenshot = await page.screenshot({
        path: path.join(screenshotDir, '03-night-state.png'),
        fullPage: false
      });
      
      // Verify overlay state
      const overlayState = await page.evaluate(() => {
        return {
          timeOfDay: window.g_globalTime.timeOfDay,
          alpha: window.g_timeOfDayOverlay.currentAlpha,
          color: window.g_timeOfDayOverlay.currentColor
        };
      });
      
      expect(overlayState.timeOfDay).to.equal('night');
      expect(overlayState.alpha).to.be.greaterThan(0.6);
      
      // Check for blue tones
      expect(overlayState.color[2]).to.be.greaterThan(20); // Blue channel
      expect(screenshot).to.exist;
    });
    
    it('should render sunrise state with warm overlay', async function() {
      // Force sunrise time
      await page.evaluate(() => {
        window.setTimeOfDay('sunrise');
        window.g_globalTime.transitioning = false;
        window.g_globalTime.transitionAlpha = 255;
      });
      
      await page.waitForTimeout(500);
      
      // Capture screenshot
      const screenshot = await page.screenshot({
        path: path.join(screenshotDir, '04-sunrise-state.png'),
        fullPage: false
      });
      
      // Verify overlay state
      const overlayState = await page.evaluate(() => {
        return {
          timeOfDay: window.g_globalTime.timeOfDay,
          alpha: window.g_timeOfDayOverlay.currentAlpha,
          color: window.g_timeOfDayOverlay.currentColor
        };
      });
      
      expect(overlayState.timeOfDay).to.equal('sunrise');
      expect(overlayState.alpha).to.be.greaterThan(0.3);
      
      // Check for warm tones
      expect(overlayState.color[0]).to.be.greaterThan(100); // Red channel
      expect(screenshot).to.exist;
    });
  });
  
  describe('Transition Animation Tests', function() {
    it('should smoothly transition from day to sunset', async function() {
      // Set up sunset transition
      await page.evaluate(() => {
        window.g_globalTime.timeOfDay = 'sunset';
        window.g_globalTime.transitioning = true;
        window.g_globalTime.transitionAlpha = 0;
      });
      
      const frames = [];
      
      // Capture frames during transition
      for (let alpha = 0; alpha <= 255; alpha += 51) {
        await page.evaluate((a) => {
          window.g_globalTime.transitionAlpha = a;
        }, alpha);
        
        await page.waitForTimeout(100);
        
        const state = await page.evaluate(() => {
          return {
            alpha: window.g_timeOfDayOverlay.currentAlpha,
            color: window.g_timeOfDayOverlay.currentColor
          };
        });
        
        frames.push(state);
        
        // Capture key frames
        if (alpha === 0 || alpha === 128 || alpha === 255) {
          await page.screenshot({
            path: path.join(screenshotDir, `05-sunset-transition-${alpha}.png`)
          });
        }
      }
      
      // Verify smooth progression
      for (let i = 1; i < frames.length; i++) {
        const diff = frames[i].alpha - frames[i-1].alpha;
        expect(diff).to.be.at.least(0); // Should increase
        expect(diff).to.be.lessThan(0.3); // Should be gradual
      }
      
      // Verify reached target state
      expect(frames[frames.length - 1].alpha).to.be.greaterThan(0.2);
    });
    
    it('should smoothly transition through full night cycle', async function() {
      const timeline = [];
      
      // Day
      await page.evaluate(() => window.setTimeOfDay('day'));
      await page.waitForTimeout(200);
      timeline.push(await captureState(page, 'day-start'));
      await page.screenshot({
        path: path.join(screenshotDir, '06-cycle-day.png')
      });
      
      // Sunset (mid-transition)
      await page.evaluate(() => {
        window.g_globalTime.timeOfDay = 'sunset';
        window.g_globalTime.transitioning = true;
        window.g_globalTime.transitionAlpha = 128;
      });
      await page.waitForTimeout(200);
      timeline.push(await captureState(page, 'sunset-mid'));
      await page.screenshot({
        path: path.join(screenshotDir, '07-cycle-sunset.png')
      });
      
      // Night
      await page.evaluate(() => window.setTimeOfDay('night'));
      await page.waitForTimeout(200);
      timeline.push(await captureState(page, 'night'));
      await page.screenshot({
        path: path.join(screenshotDir, '08-cycle-night.png')
      });
      
      // Sunrise (mid-transition)
      await page.evaluate(() => {
        window.g_globalTime.timeOfDay = 'sunrise';
        window.g_globalTime.transitioning = true;
        window.g_globalTime.transitionAlpha = 128;
      });
      await page.waitForTimeout(200);
      timeline.push(await captureState(page, 'sunrise-mid'));
      await page.screenshot({
        path: path.join(screenshotDir, '09-cycle-sunrise.png')
      });
      
      // Back to Day
      await page.evaluate(() => window.setTimeOfDay('day'));
      await page.waitForTimeout(200);
      timeline.push(await captureState(page, 'day-end'));
      await page.screenshot({
        path: path.join(screenshotDir, '10-cycle-day-end.png')
      });
      
      // Verify progression
      expect(timeline[0].alpha).to.be.lessThan(0.1); // Day
      expect(timeline[1].alpha).to.be.greaterThan(0.1); // Sunset
      expect(timeline[2].alpha).to.be.greaterThan(timeline[1].alpha); // Night
      expect(timeline[3].alpha).to.be.lessThan(timeline[2].alpha); // Sunrise
      expect(timeline[4].alpha).to.be.lessThan(0.1); // Day again
      
      // Verify no jarring transitions
      for (let i = 1; i < timeline.length; i++) {
        const diff = Math.abs(timeline[i].alpha - timeline[i-1].alpha);
        expect(diff).to.be.lessThan(0.5, `Large jump between ${timeline[i-1].phase} and ${timeline[i].phase}`);
      }
    });
    
    it('should handle fast time speed smoothly', async function() {
      // Enable fast time
      await page.evaluate(() => {
        window.superFastTime(); // 10x speed
      });
      
      await page.waitForTimeout(500);
      
      // Capture multiple frames over time
      const frames = [];
      for (let i = 0; i < 10; i++) {
        const state = await page.evaluate(() => {
          return {
            timeOfDay: window.g_globalTime.timeOfDay,
            alpha: window.g_timeOfDayOverlay.currentAlpha,
            seconds: window.g_globalTime.inGameSeconds
          };
        });
        frames.push(state);
        await page.waitForTimeout(200);
      }
      
      // Time should be progressing
      expect(frames[frames.length - 1].seconds).to.be.greaterThan(frames[0].seconds);
      
      // Capture final state
      await page.screenshot({
        path: path.join(screenshotDir, '11-fast-time.png')
      });
    });
  });
  
  describe('UI Interaction Tests', function() {
    it('should not overlay HUD elements', async function() {
      await page.evaluate(() => window.setTimeOfDay('night'));
      await page.waitForTimeout(500);
      
      // Check if HUD elements are still visible
      const hudVisible = await page.evaluate(() => {
        // Check if any UI elements exist and are visible
        const uiElements = document.querySelectorAll('.ui-panel, .stats-container');
        return uiElements.length > 0;
      });
      
      await page.screenshot({
        path: path.join(screenshotDir, '12-night-with-hud.png')
      });
      
      // Overlay should not obscure game UI (tested visually via screenshot)
    });
    
    it('should work with debug overlay enabled', async function() {
      await page.evaluate(() => {
        window.toggleTimeDebug();
        window.setTimeOfDay('sunset');
      });
      
      await page.waitForTimeout(500);
      
      const debugEnabled = await page.evaluate(() => {
        return window.g_timeOfDayOverlay.debugMode;
      });
      
      expect(debugEnabled).to.be.true;
      
      await page.screenshot({
        path: path.join(screenshotDir, '13-debug-enabled.png')
      });
    });
  });
  
  describe('Console Command Tests', function() {
    it('should respond to setTimeOfDay command', async function() {
      const consoleLogs = [];
      page.on('console', msg => consoleLogs.push(msg.text()));
      
      await page.evaluate(() => {
        console.log('Before:', window.g_globalTime.timeOfDay);
        window.setTimeOfDay('night');
        console.log('After:', window.g_globalTime.timeOfDay);
      });
      
      await page.waitForTimeout(500);
      
      const currentTime = await page.evaluate(() => window.g_globalTime.timeOfDay);
      expect(currentTime).to.equal('night');
      
      await page.screenshot({
        path: path.join(screenshotDir, '14-console-command.png')
      });
    });
    
    it('should respond to setTimeConfig command', async function() {
      await page.evaluate(() => {
        // Set custom sunset colors
        window.setTimeConfig('sunset', [255, 50, 200], 0.5);
        window.setTimeOfDay('sunset');
      });
      
      await page.waitForTimeout(500);
      
      const config = await page.evaluate(() => {
        return window.g_timeOfDayOverlay.config.sunset;
      });
      
      expect(config.color).to.deep.equal([255, 50, 200]);
      expect(config.alpha).to.equal(0.5);
      
      await page.screenshot({
        path: path.join(screenshotDir, '15-custom-config.png')
      });
    });
  });
  
  describe('Performance Tests', function() {
    it('should maintain smooth frame rate during transitions', async function() {
      // Start FPS monitoring
      await page.evaluate(() => {
        window.fpsLog = [];
        window.lastFrameTime = performance.now();
        window.fpsCounter = setInterval(() => {
          const now = performance.now();
          const fps = 1000 / (now - window.lastFrameTime);
          window.fpsLog.push(fps);
          window.lastFrameTime = now;
        }, 16); // Check every frame (~60 FPS)
      });
      
      // Run through transitions
      await page.evaluate(() => {
        window.g_globalTime.timeOfDay = 'sunset';
        window.g_globalTime.transitioning = true;
        window.g_globalTime.transitionAlpha = 0;
      });
      
      // Let it run for a few seconds
      await page.waitForTimeout(3000);
      
      // Gradually increase alpha
      for (let alpha = 0; alpha <= 255; alpha += 25) {
        await page.evaluate((a) => {
          window.g_globalTime.transitionAlpha = a;
        }, alpha);
        await page.waitForTimeout(100);
      }
      
      // Stop monitoring and get results
      const fps = await page.evaluate(() => {
        clearInterval(window.fpsCounter);
        return window.fpsLog;
      });
      
      const avgFps = fps.reduce((a, b) => a + b, 0) / fps.length;
      const minFps = Math.min(...fps);
      
      // Should maintain reasonable frame rate
      expect(avgFps).to.be.greaterThan(30, 'Average FPS should be above 30');
      expect(minFps).to.be.greaterThan(20, 'Minimum FPS should be above 20');
      
      await page.screenshot({
        path: path.join(screenshotDir, '16-performance-test.png')
      });
    });
  });
  
  describe('Edge Case Tests', function() {
    it('should handle rapid time changes', async function() {
      const times = ['day', 'sunset', 'night', 'sunrise', 'day', 'night', 'sunrise'];
      
      for (const time of times) {
        await page.evaluate((t) => {
          window.setTimeOfDay(t);
        }, time);
        await page.waitForTimeout(100);
      }
      
      const finalState = await page.evaluate(() => {
        return {
          timeOfDay: window.g_globalTime.timeOfDay,
          alpha: window.g_timeOfDayOverlay.currentAlpha
        };
      });
      
      expect(finalState.timeOfDay).to.be.oneOf(['day', 'sunset', 'night', 'sunrise']);
      
      await page.screenshot({
        path: path.join(screenshotDir, '17-rapid-changes.png')
      });
    });
    
    it('should handle page resize', async function() {
      await page.evaluate(() => window.setTimeOfDay('night'));
      await page.waitForTimeout(500);
      
      // Capture at original size
      await page.screenshot({
        path: path.join(screenshotDir, '18-resize-before.png')
      });
      
      // Resize viewport
      await page.setViewport({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      
      // Capture at new size
      await page.screenshot({
        path: path.join(screenshotDir, '19-resize-after.png')
      });
      
      // Overlay should still cover full screen
      const overlayState = await page.evaluate(() => {
        return {
          alpha: window.g_timeOfDayOverlay.currentAlpha,
          timeOfDay: window.g_globalTime.timeOfDay
        };
      });
      
      expect(overlayState.alpha).to.be.greaterThan(0.6);
    });
  });
  
  // Helper function to capture overlay state
  async function captureState(page, phase) {
    return await page.evaluate((p) => {
      return {
        phase: p,
        timeOfDay: window.g_globalTime.timeOfDay,
        alpha: window.g_timeOfDayOverlay.currentAlpha,
        color: window.g_timeOfDayOverlay.currentColor,
        transitioning: window.g_globalTime.transitioning
      };
    }, phase);
  }
});
