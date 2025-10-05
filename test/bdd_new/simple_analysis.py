#!/usr/bin/env python3
"""
Simple dependency analysis - step by step approach
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

def analyze_step_by_step():
    """Analyze dependencies step by step to isolate issues"""
    print("=== STEP-BY-STEP ANT SYSTEM ANALYSIS ===")
    
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        # Load game
        game_path = "file:///" + os.path.abspath("../../index.html").replace("\\", "/")
        driver.get(game_path)
        time.sleep(3)
        
        # Step 1: Basic availability check
        print("\n🔍 Step 1: Basic availability check...")
        result1 = driver.execute_script("""
            return {
                ant: typeof ant,
                antsSpawn: typeof antsSpawn,
                JobComponent: typeof JobComponent
            };
        """)
        print(f"   ant: {result1['ant']}")
        print(f"   antsSpawn: {result1['antsSpawn']}")  
        print(f"   JobComponent: {result1['JobComponent']}")
        
        # Step 2: Check if ant has prototype
        if result1['ant'] == 'function':
            print("\n🔍 Step 2: Checking ant prototype...")
            result2 = driver.execute_script("""
                return {
                    hasPrototype: ant.prototype !== undefined,
                    prototypeType: typeof ant.prototype
                };
            """)
            print(f"   Has prototype: {result2['hasPrototype']}")
            print(f"   Prototype type: {result2['prototypeType']}")
            
            # Step 3: Get method names safely
            if result2['hasPrototype']:
                print("\n🔍 Step 3: Getting method names...")
                result3 = driver.execute_script("""
                    try {
                        const proto = ant.prototype;
                        const names = Object.getOwnPropertyNames(proto);
                        const methods = names.filter(name => typeof proto[name] === 'function');
                        return {
                            success: true,
                            totalNames: names.length,
                            methodCount: methods.length,
                            methods: methods.slice(0, 10)  // First 10 methods only
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                """)
                
                if result3['success']:
                    print(f"   ✅ Total names: {result3['totalNames']}")
                    print(f"   ✅ Method count: {result3['methodCount']}")
                    print(f"   ✅ First methods: {result3['methods']}")
                else:
                    print(f"   ❌ Error: {result3['error']}")
        
        # Step 4: Check spawning functions
        if result1['antsSpawn'] == 'function':
            print("\n🔍 Step 4: Analyzing antsSpawn...")
            result4 = driver.execute_script("""
                try {
                    // Try to call antsSpawn with 0 ants (should be safe)
                    const originalLength = ants ? ants.length : 0;
                    
                    return {
                        success: true,
                        antsArrayExists: typeof ants !== 'undefined',
                        antsLength: originalLength,
                        canCallSpawn: true
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message
                    };
                }
            """)
            
            if result4['success']:
                print(f"   ✅ Ants array exists: {result4['antsArrayExists']}")
                print(f"   ✅ Current ants: {result4['antsLength']}")
            else:
                print(f"   ❌ Error: {result4['error']}")
        
        # Step 5: Check job system
        if result1['JobComponent'] == 'function':
            print("\n🔍 Step 5: Analyzing JobComponent...")
            result5 = driver.execute_script("""
                try {
                    const staticMethods = Object.getOwnPropertyNames(JobComponent)
                        .filter(name => typeof JobComponent[name] === 'function');
                    
                    return {
                        success: true,
                        staticMethods: staticMethods
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message
                    };
                }
            """)
            
            if result5['success']:
                print(f"   ✅ Static methods: {result5['staticMethods']}")
            else:
                print(f"   ❌ Error: {result5['error']}")
        
        print("\n=== ANALYSIS COMPLETE ===")
        print("✅ This step-by-step analysis shows what REAL APIs are available")
        print("✅ Use these APIs in tests instead of fake implementations")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    finally:
        driver.quit()

if __name__ == "__main__":
    success = analyze_step_by_step()
    sys.exit(0 if success else 1)