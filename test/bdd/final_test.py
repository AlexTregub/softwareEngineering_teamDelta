#!/usr/bin/env python3
"""
Final BDD Test - Use simple server approach
"""

import sys
import time
from pathlib import Path

test_dir = Path(__file__).parent.absolute()  
project_root = test_dir.parent.parent        

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def final_bdd_test():
    print("🚀 Final BDD Test - Game System Validation")
    print("=" * 60)
    
    # Use a simpler approach: serve from current directory 
    # and navigate to the right file
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--allow-file-access-from-files')
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # Try file:// protocol as backup
        file_url = f"file:///{str(project_root).replace(chr(92), '/')}/index.html"
        print(f"🔗 Loading via file protocol: {file_url}")
        
        driver.get(file_url)
        print(f"✅ Page loaded: '{driver.title}'")
        
        if driver.title == "" or "ANTS" not in driver.title:
            print("⚠️  Title doesn't look right, checking content...")
            
        # Check what actually loaded
        try:
            result = driver.execute_script('''
                return {
                    title: document.title,
                    scriptsLoaded: document.querySelectorAll('script').length,
                    hasP5: typeof window.p5 !== 'undefined',
                    documentReady: document.readyState
                };
            ''')
            
            print(f"📊 Initial check: {result}")
            
            if result['scriptsLoaded'] >= 10:  # Good sign
                print("✅ Scripts are loading, waiting for game systems...")
                
                # Wait for game systems
                for attempt in range(15):  # 30 seconds total
                    time.sleep(2)
                    
                    game_status = driver.execute_script('''
                        return {
                            p5Ready: typeof window.setup === 'function' && typeof window.draw === 'function',
                            buttonManager: typeof window.buttonGroupManager !== 'undefined',
                            renderManager: typeof window.g_renderLayerManager !== 'undefined',
                            actionFactory: typeof window.gameActionFactory !== 'undefined'
                        };
                    ''')
                    
                    systems_ready = all(game_status.values())
                    print(f"Attempt {attempt + 1}: p5={game_status['p5Ready']}, buttons={game_status['buttonManager']}, render={game_status['renderManager']}, actions={game_status['actionFactory']}")
                    
                    if systems_ready:
                        print("🎉 SUCCESS: All game systems loaded!")
                        
                        # Run a quick test
                        test_result = driver.execute_script('''
                            try {
                                // Test button manager
                                const buttonTest = window.buttonGroupManager && 
                                                 typeof window.buttonGroupManager.activeGroups !== 'undefined';
                                
                                // Test render manager  
                                const renderTest = window.g_renderLayerManager &&
                                                 typeof window.g_renderLayerManager.toggleLayer === 'function';
                                
                                // Test action factory
                                const actionTest = window.gameActionFactory &&
                                                 typeof window.gameActionFactory.executeAction === 'function';
                                
                                return {
                                    buttonManagerTest: buttonTest,
                                    renderManagerTest: renderTest,
                                    actionFactoryTest: actionTest,
                                    allTestsPassed: buttonTest && renderTest && actionTest
                                };
                            } catch (e) {
                                return { error: e.message };
                            }
                        ''')
                        
                        print(f"🧪 System tests: {test_result}")
                        
                        if test_result.get('allTestsPassed'):
                            print("✅ All systems are functional!")
                            return True
                        else:
                            print("⚠️  Some systems failed functional tests")
                            return False
                
                print("❌ Timeout waiting for game systems")
                return False
            else:
                print(f"❌ Only {result['scriptsLoaded']} scripts loaded, something is wrong")
                return False
                
        except Exception as e:
            print(f"❌ JavaScript execution failed: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    finally:
        driver.quit()

if __name__ == "__main__":
    success = final_bdd_test()
    if success:
        print("\n🎉 BDD Test PASSED: Game systems are working!")
        sys.exit(0)
    else:
        print("\n❌ BDD Test FAILED: Issues detected")
        sys.exit(1)