#!/usr/bin/env python3
"""
Debug script to check button structure
"""

import subprocess
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# Start server
server = subprocess.Popen(['python', '-m', 'http.server', '8000'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
time.sleep(2)

try:
    # Start browser
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    driver = webdriver.Chrome(options=chrome_options)
    
    # Load page
    driver.get('http://localhost:8000')
    time.sleep(8)  # Wait for full initialization
    
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
    
    print('Button Structure Debug:')
    import json
    print(json.dumps(result, indent=2))
    
    # Get console logs to see button creation errors
    console_logs = driver.get_log('browser')
    button_logs = [log for log in console_logs if 'button' in log['message'].lower() or 'debug' in log['message'].lower()]
    
    print('\nConsole Logs (Button/Debug related):')
    for log in button_logs[-10:]:  # Show last 10 relevant logs
        print(f"[{log['level']}] {log['message']}")
    
finally:
    if 'driver' in locals():
        driver.quit()
    server.terminate()
    server.wait()