#!/usr/bin/env python3
"""
Browser Context and Environment Setup
Provides browser automation context and environment configuration for Python BDD tests

This module sets up:
- Selenium WebDriver instances
- Browser automation contexts
- Test environment configuration
- Error handling and cleanup

Author: Software Engineering Team Delta - David Willman
Version: 2.0.0
"""

import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import WebDriverException
from webdriver_manager.chrome import ChromeDriverManager


class BrowserContext:
    """Browser automation context for BDD tests"""
    
    def __init__(self):
        self.driver = None
        self.headless = True
        self.timeout = 30
        self.window_size = (1280, 720)
        
    def setup_chrome_driver(self, headless=True):
        """Set up Chrome WebDriver with appropriate options"""
        chrome_options = Options()
        
        if headless:
            chrome_options.add_argument('--headless=new')
        
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--disable-web-security')
        chrome_options.add_argument(f'--window-size={self.window_size[0]},{self.window_size[1]}')
        
        try:
            # Use webdriver-manager to automatically download and manage ChromeDriver
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.implicitly_wait(self.timeout)
            return True
        except WebDriverException as e:
            print(f"Warning: ChromeDriver setup failed: {str(e)}")
            print("Tests will run in mock mode")
            return False
    
    def execute_script(self, script, *args):
        """Execute JavaScript in browser context"""
        if self.driver:
            try:
                return self.driver.execute_script(script, *args)
            except Exception as e:
                print(f"Script execution failed: {str(e)}")
                return None
        return None
    
    def get_log(self, log_type='browser'):
        """Get browser logs"""
        if self.driver:
            try:
                return self.driver.get_log(log_type)
            except Exception:
                return []
        return []
    
    def refresh(self):
        """Refresh current page"""
        if self.driver:
            self.driver.refresh()
    
    def cleanup(self):
        """Clean up browser resources"""
        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass
            self.driver = None


def before_all(context):
    """Set up test environment before all tests"""
    print("🔧 Setting up Python test environment...")
    
    # Create browser context
    context.browser = BrowserContext()
    
    # Try to set up real browser
    browser_ready = context.browser.setup_chrome_driver(headless=True)
    
    if browser_ready:
        print("✅ Browser automation ready")
        # Load test page
        test_html = """
        <!DOCTYPE html>
        <html>
        <head><title>Test Environment</title></head>
        <body>
            <canvas id="gameCanvas" width="800" height="600"></canvas>
            <div id="test-container"></div>
            <script>
                // Simulate game environment
                window.testEnvironment = true;
                console.log('Test environment initialized');
            </script>
        </body>
        </html>
        """
        context.browser.driver.get(f"data:text/html;charset=utf-8,{test_html}")
    else:
        print("⚠️  Browser automation not available - using mock mode")
    
    # Set up test data directories
    context.test_data_dir = os.path.join(os.path.dirname(__file__), '..', 'results')
    os.makedirs(context.test_data_dir, exist_ok=True)


def after_all(context):
    """Clean up test environment after all tests"""
    print("\n🧹 Cleaning up test environment...")
    
    if hasattr(context, 'browser'):
        context.browser.cleanup()
    
    print("✅ Test environment cleaned up")


def before_scenario(context, scenario):
    """Set up before each test scenario"""
    # Reset test state
    context.test_start_time = time.time()
    
    # Clear any previous test data
    if hasattr(context, 'browser') and context.browser.driver:
        context.browser.execute_script("console.clear();")


def after_scenario(context, scenario):
    """Clean up after each test scenario"""
    test_duration = time.time() - getattr(context, 'test_start_time', time.time())
    
    if scenario.status == 'failed':
        print(f"❌ Scenario failed: {scenario.name}")
        
        # Capture browser state for debugging
        if hasattr(context, 'browser') and context.browser.driver:
            try:
                # Save screenshot for failed tests
                screenshot_path = os.path.join(
                    context.test_data_dir, 
                    f"failed_{scenario.name.replace(' ', '_')}.png"
                )
                context.browser.driver.save_screenshot(screenshot_path)
                print(f"📷 Screenshot saved: {screenshot_path}")
            except Exception as e:
                print(f"Could not save screenshot: {str(e)}")
    
    elif scenario.status == 'passed':
        print(f"✅ Scenario passed: {scenario.name} ({test_duration:.2f}s)")


# Export context functions for behave
__all__ = ['before_all', 'after_all', 'before_scenario', 'after_scenario', 'BrowserContext']