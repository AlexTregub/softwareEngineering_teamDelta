#!/usr/bin/env python3
"""
Behave Environment Configuration
Main environment setup for BDD tests using behave framework

This module provides:
- Browser setup and teardown hooks
- Test context initialization
- WebDriver management with automatic ChromeDriver handling

Author: Software Engineering Team Delta - David Willman
Version: 2.0.0
"""

import sys
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Add project root to path for imports
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

def before_all(context):
    """Set up browser before all tests"""
    print("Setting up browser environment...")
    
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-web-security")
    options.add_argument("--window-size=1280,720")
    
    try:
        # Use webdriver-manager to automatically download and manage ChromeDriver
        service = Service(ChromeDriverManager().install())
        context.driver = webdriver.Chrome(service=service, options=options)
        context.driver.implicitly_wait(10)
        print("Browser setup complete - headless Chrome with automatic ChromeDriver management")
    except Exception as e:
        print(f"Browser setup failed: {str(e)}")
        context.driver = None

def after_all(context):
    """Clean up browser after all tests"""
    if hasattr(context, 'driver') and context.driver:
        context.driver.quit()
        print("Browser cleanup complete")

def before_scenario(context, scenario):
    """Set up before each scenario"""
    if hasattr(context, 'driver') and context.driver:
        # Clear any existing page state
        try:
            context.driver.delete_all_cookies()
        except:
            pass  # Ignore if no page is loaded

def after_scenario(context, scenario):
    """Clean up after each scenario"""
    # Additional cleanup if needed
    pass