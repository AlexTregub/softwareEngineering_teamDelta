#!/usr/bin/env python3
"""
Button Structure Debug Tool
Provides detailed diagnostic analysis of button system structure and dependencies.
Complements BDD tests with deep introspection capabilities.

Usage: python tests/integration/button_structure_debug.py
"""

import subprocess
import time
import os
import sys
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def start_server():
    """Start HTTP server if not already running"""
    try:
        import requests
        requests.get('http://localhost:8000', timeout=1)
        print("✓ Server already running")
        return None
    except:
        print("Starting HTTP server...")
        server = subprocess.Popen(['python', '-m', 'http.server', '8000'], 
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        time.sleep(2)
        return server

def create_debug_driver():
    """Create Chrome driver with appropriate options"""
    chrome_options = Options()
    chrome_options.add_argument('--headless')  # Run headless for integration testing
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    return webdriver.Chrome(options=chrome_options)

def analyze_button_structure(driver):
    """Analyze button structure and return detailed report"""
    
    # Debug button structure and dependencies
    result = driver.execute_script("""
        const buttonManager = window.buttonGroupManager;
        if (!buttonManager) return {error: "No button manager"};
        
        // Debug activeGroups directly
        console.log('🔍 Active groups Map size:', buttonManager.activeGroups ? buttonManager.activeGroups.size : 'undefined');
        console.log('🔍 Active groups Map:', buttonManager.activeGroups);
        
        const debugInfo = [];
        
        // Iterate through activeGroups Map directly
        if (buttonManager.activeGroups) {
            for (let [id, entry] of buttonManager.activeGroups) {
                console.log('🔍 Processing entry for:', id, entry);
                
                const groupInfo = {
                    id: id,
                    name: entry.config?.name || 'Unknown',
                    configButtons: entry.config?.buttons?.length || 0,
                    actualButtons: entry.instance?.buttons?.length || 0,
                    buttons: [],
                    buttonConfig: entry.config?.buttons || [],
                    instanceType: entry.instance?.constructor?.name || 'Unknown',
                    hasInstance: !!entry.instance,
                    instanceButtons: entry.instance?.buttons || []
                };
                
                if (entry.instance && entry.instance.buttons) {
                    for (const btn of entry.instance.buttons) {
                        groupInfo.buttons.push({
                            id: btn.config ? btn.config.id : "no-id",
                            text: btn.config ? btn.config.text : "no-text",
                            hasConfig: !!btn.config,
                            x: btn.x || 0,
                            y: btn.y || 0,
                            width: btn.width || 0,
                            height: btn.height || 0
                        });
                    }
                }
                debugInfo.push(groupInfo);
            }
        }
        
        // Check dependencies
        const dependencies = {
            Button: typeof window.Button,
            ButtonStyles: typeof window.ButtonStyles,
            ButtonStylesDynamic: typeof window.ButtonStyles !== 'undefined' ? typeof window.ButtonStyles.DYNAMIC : 'ButtonStyles undefined'
        };
        
        return {
            totalGroups: debugInfo.length,
            groups: debugInfo,
            dependencies: dependencies
        };
    """)
    
    return result

def get_console_logs(driver):
    """Get console logs related to buttons/debug"""
    try:
        console_logs = driver.get_log('browser')
        button_logs = [log for log in console_logs if 'button' in log['message'].lower() or 'debug' in log['message'].lower()]
        return button_logs[-10:]  # Show last 10 relevant logs
    except:
        return []

def run_button_structure_debug():
    """Main debug function"""
    server = None
    driver = None
    
    try:
        # Change to project root directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.join(script_dir, '..', '..')
        os.chdir(project_root)
        
        server = start_server()
        driver = create_debug_driver()
        
        # Load page and wait for initialization
        driver.get('http://localhost:8000')
        time.sleep(8)  # Wait for full initialization
        
        # Analyze button structure
        structure_result = analyze_button_structure(driver)
        
        print('Button Structure Debug Report:')
        print('=' * 50)
        print(json.dumps(structure_result, indent=2))
        
        # Get console logs
        console_logs = get_console_logs(driver)
        
        print('\nConsole Logs (Button/Debug related):')
        print('=' * 50)
        for log in console_logs:
            print(f"[{log['level']}] {log['message']}")
        
        # Summary
        if 'error' not in structure_result:
            print(f"\n📊 SUMMARY:")
            print(f"   Total Button Groups: {structure_result['totalGroups']}")
            print(f"   Dependencies Status: {structure_result['dependencies']}")
            if structure_result['groups']:
                total_buttons = sum(len(group['buttons']) for group in structure_result['groups'])
                print(f"   Total Buttons: {total_buttons}")
        else:
            print(f"\n❌ ERROR: {structure_result['error']}")
            
        return structure_result
        
    except Exception as e:
        print(f"❌ Debug execution failed: {e}")
        return {"error": str(e)}
        
    finally:
        if driver:
            driver.quit()
        if server:
            server.terminate()
            server.wait()

if __name__ == "__main__":
    """Run as standalone diagnostic tool"""
    print("🔍 Button Structure Debug Tool")
    print("Analyzing game button system structure...")
    result = run_button_structure_debug()
    
    if "error" in result:
        sys.exit(1)
    else:
        print("\n✅ Debug analysis complete!")
        sys.exit(0)