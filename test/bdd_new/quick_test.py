#!/usr/bin/env python3
"""
Quick BDD Test Diagnostic
Just tests server startup and basic page loading
"""

import os
import sys
import time
import subprocess
from datetime import datetime
from pathlib import Path

# Add the test directory to Python path
test_dir = Path(__file__).parent.absolute()  # test/unified_bdd_tests/
project_root = test_dir.parent.parent        # project root directory 

print(f"🔍 Quick diagnostic:")
print(f"   Test dir: {test_dir}")
print(f"   Project root: {project_root}")
print(f"   Index.html exists: {(project_root / 'index.html').exists()}")

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def quick_test():
    # Start server
    print("🌐 Starting HTTP server on port 8000...")
    server = subprocess.Popen(
        ['python', '-m', 'http.server', '8000'],
        cwd=str(project_root),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    time.sleep(3)
    
    try:
        # Test server
        import urllib.request
        try:
            response = urllib.request.urlopen('http://localhost:8000', timeout=5)
            print(f"✅ Server responding: {response.getcode()}")
        except Exception as e:
            print(f"❌ Server test failed: {e}")
            return
        
        # Setup browser
        print("🌍 Setting up Chrome WebDriver...")
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-web-security')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        
        driver = webdriver.Chrome(options=chrome_options)
        driver.set_page_load_timeout(15)  # Short timeout
        
        print("🔗 Loading page...")
        try:
            driver.get('http://localhost:8000')
            print(f"✅ Page loaded: '{driver.title}'")
            print(f"   Source length: {len(driver.page_source)}")
            
            # Quick system check
            result = driver.execute_script('''
                return {
                    p5: typeof window.p5 !== 'undefined',
                    setup: typeof window.setup === 'function',
                    draw: typeof window.draw === 'function',
                    documentReady: document.readyState,
                    scripts: document.querySelectorAll('script').length
                };
            ''')
            
            print(f"   JavaScript status: {result}")
            
        except Exception as e:
            print(f"❌ Page load error: {e}")
        finally:
            driver.quit()
            
    finally:
        server.terminate()
        server.wait()

if __name__ == "__main__":
    quick_test()