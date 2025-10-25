#!/usr/bin/env python3
"""
Minimal BDD Test - Just test if the game loads properly
"""

import os
import sys
import time
from pathlib import Path

# Add the test directory to Python path
test_dir = Path(__file__).parent.absolute()  
project_root = test_dir.parent.parent        

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def test_game_loading():
    print("🚀 Testing Game Loading in Browser")
    print("=" * 50)
    
    # Assume server is already running on port 8000
    url = 'http://localhost:8000/index.html'
    
    # Setup browser
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1920,1080')
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.set_page_load_timeout(15)
    
    try:
        print(f"🔗 Loading {url}...")
        driver.get(url)
        
        print(f"✅ Page loaded: '{driver.title}'")
        
        # Wait for JavaScript to load
        print("⏳ Waiting for JavaScript systems to load...")
        
        for attempt in range(10):  # 10 attempts, 2 seconds each = 20 seconds max
            try:
                result = driver.execute_script('''
                    return {
                        documentReady: document.readyState,
                        scriptsLoaded: document.querySelectorAll('script').length,
                        p5Ready: typeof window.setup === 'function' && typeof window.draw === 'function',
                        buttonManager: typeof window.buttonGroupManager !== 'undefined',
                        renderManager: typeof window.g_renderLayerManager !== 'undefined',
                        actionFactory: typeof window.gameActionFactory !== 'undefined',
                        title: document.title
                    };
                ''')
                
                print(f"Attempt {attempt + 1}: Scripts={result['scriptsLoaded']}, p5={result['p5Ready']}, buttons={result['buttonManager']}, render={result['renderManager']}, actions={result['actionFactory']}")
                
                if result['p5Ready'] and result['buttonManager'] and result['renderManager'] and result['actionFactory']:
                    print("✅ All game systems loaded successfully!")
                    return True
                    
                if result['scriptsLoaded'] < 10:
                    print(f"⚠️  Only {result['scriptsLoaded']} scripts loaded, expected 30+")
                    print(f"   Page title: '{result['title']}'")
                    if attempt == 0:  # Show page source on first attempt
                        source = driver.page_source[:2000]
                        print("   Page source preview:")
                        print(source)
                        if 'Directory listing' in source:
                            print("❌ Server is showing directory listing instead of index.html!")
                            return False
                        elif 'ANTS!' not in source:
                            print("❌ This doesn't look like the game page!")
                            return False
                
            except Exception as e:
                print(f"   JavaScript execution failed: {e}")
            
            time.sleep(2)
        
        print("❌ Game systems failed to load within timeout")
        return False
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    finally:
        driver.quit()

if __name__ == "__main__":
    success = test_game_loading()
    sys.exit(0 if success else 1)