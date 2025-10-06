#!/usr/bin/env python3
"""
Simple browser test - just connect to existing server
"""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

def simple_browser_test():
    print("🌍 Testing Chrome WebDriver connection...")
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-web-security')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.set_page_load_timeout(10)
        
        print("🔗 Connecting to http://localhost:8000...")
        driver.get('http://localhost:8000')
        
        print(f"✅ Connected! Title: '{driver.title}'")
        print(f"   URL: {driver.current_url}")
        print(f"   Page source length: {len(driver.page_source)}")
        
        # Test JavaScript execution
        result = driver.execute_script('return document.readyState;')
        print(f"   Document state: {result}")
        
        # Check if basic objects exist
        basic_check = driver.execute_script('''
            return {
                hasWindow: typeof window !== 'undefined',
                hasDocument: typeof document !== 'undefined',
                scriptsCount: document.querySelectorAll('script').length,
                title: document.title
            };
        ''')
        print(f"   Basic check: {basic_check}")
        
        driver.quit()
        print("✅ Browser test completed successfully")
        
    except Exception as e:
        print(f"❌ Browser test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    simple_browser_test()