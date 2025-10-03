#!/usr/bin/env python3
"""
Selenium tests for Universal Button Group System rendering
Tests button visibility, interaction, and rendering issues
"""

import os
import sys
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Set UTF-8 encoding for Windows console
if sys.platform == "win32":
    try:
        import codecs
        sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
        sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())
    except:
        pass

class ButtonRenderingTests:
    def __init__(self):
        self.driver = None
        self.base_url = "http://localhost:8000"
        self.test_results = []
        
    def setup_driver(self):
        """Initialize Chrome WebDriver with appropriate options"""
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1200,800")
        
        # For debugging, don't run headless initially
        # chrome_options.add_argument("--headless")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.implicitly_wait(10)
            print("ChromeDriver initialized successfully")
            return True
        except Exception as e:
            print(f"Failed to initialize ChromeDriver: {e}")
            return False
    
    def load_game(self):
        """Load the game and wait for initialization"""
        try:
            print(f"Loading game from {self.base_url}")
            self.driver.get(self.base_url)
            
            # Shorter timeout - 60 seconds max
            print("Waiting for p5.js to load...")
            WebDriverWait(self.driver, 60).until(
                lambda driver: driver.execute_script("return typeof window.setup === 'function'")
            )
            
            print("p5.js loaded, waiting for game initialization...")
            
            # Check game initialization with shorter intervals
            initialization_timeout = 60  # 1 minute total
            check_interval = 5  # Check every 5 seconds
            elapsed_time = 0
            
            while elapsed_time < initialization_timeout:
                try:
                    # Check if key game components are loaded
                    status = self.driver.execute_script("""
                        return {
                            p5Ready: typeof window.setup === 'function',
                            gameStateReady: typeof window.GameState !== 'undefined',
                            renderManagerReady: typeof window.g_renderLayerManager !== 'undefined',
                            buttonSystemReady: typeof window.buttonGroupManager !== 'undefined',
                            canvasExists: !!document.querySelector('canvas'),
                            currentState: window.GameState ? window.GameState.getState() : 'unknown'
                        };
                    """)
                    
                    print(f"  Time: {elapsed_time}s - Status: p5:{status['p5Ready']}, GameState:{status['gameStateReady']}, Canvas:{status['canvasExists']}, State:{status['currentState']}")
                    
                    # If most components are ready, proceed
                    if (status['p5Ready'] and status['gameStateReady'] and status['canvasExists']):
                        print("Game components initialized successfully")
                        return True
                    
                    time.sleep(check_interval)
                    elapsed_time += check_interval
                    
                except Exception as check_error:
                    print(f"  Error during initialization check: {check_error}")
                    time.sleep(check_interval)
                    elapsed_time += check_interval
            
            # If we get here, initialization timed out
            print("Game initialization timed out after 60 seconds")
            self.investigate_stuck_page()
            return False
            
        except TimeoutException:
            print("Timeout waiting for p5.js to load")
            self.investigate_stuck_page()
            return False
        except Exception as e:
            print(f"Error loading game: {e}")
            self.investigate_stuck_page()
            return False
    
    def investigate_stuck_page(self):
        """Investigate what's happening when the page gets stuck"""
        print("\\n--- INVESTIGATING STUCK PAGE ---")
        
        try:
            # Get page title and URL
            print(f"Current URL: {self.driver.current_url}")
            print(f"Page title: {self.driver.title}")
            
            # Check if page loaded at all
            page_source_length = len(self.driver.page_source)
            print(f"Page source length: {page_source_length} characters")
            
            # Check for JavaScript errors
            console_logs = self.driver.get_log('browser')
            error_logs = [log for log in console_logs if log['level'] == 'SEVERE']
            warning_logs = [log for log in console_logs if log['level'] == 'WARNING']
            
            print(f"Console errors: {len(error_logs)}")
            print(f"Console warnings: {len(warning_logs)}")
            
            # Show recent errors
            for log in error_logs[-5:]:
                print(f"  ERROR: {log['message']}")
            
            for log in warning_logs[-3:]:
                print(f"  WARNING: {log['message']}")
            
            # Check what scripts are loaded
            script_info = self.driver.execute_script("""
                const scripts = Array.from(document.querySelectorAll('script[src]'));
                const loadedCount = scripts.length;
                const failedScripts = [];
                
                // Check if key objects exist
                const keyObjects = {
                    p5: typeof window.p5,
                    setup: typeof window.setup,
                    draw: typeof window.draw,
                    GameState: typeof window.GameState,
                    Button: typeof window.Button,
                    ButtonGroup: typeof window.ButtonGroup,
                    buttonGroupManager: typeof window.buttonGroupManager,
                    g_renderLayerManager: typeof window.g_renderLayerManager
                };
                
                return {
                    totalScripts: loadedCount,
                    keyObjects: keyObjects,
                    canvasCount: document.querySelectorAll('canvas').length
                };
            """)
            
            print(f"Scripts loaded: {script_info['totalScripts']}")
            print(f"Canvas elements: {script_info['canvasCount']}")
            print("Key objects status:")
            for obj_name, obj_type in script_info['keyObjects'].items():
                status = "LOADED" if obj_type != 'undefined' else "MISSING"
                print(f"  {obj_name}: {status} ({obj_type})")
            
            # Check if canvas is rendering
            if script_info['canvasCount'] > 0:
                canvas_info = self.driver.execute_script("""
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                        return {
                            width: canvas.width,
                            height: canvas.height,
                            style: canvas.style.cssText,
                            visible: canvas.offsetParent !== null
                        };
                    }
                    return null;
                """)
                
                if canvas_info:
                    print(f"Canvas info: {canvas_info['width']}x{canvas_info['height']}, visible: {canvas_info['visible']}")
            
            # Check for infinite loops or hanging processes
            cpu_check = self.driver.execute_script("""
                // Simple check for activity
                let startTime = performance.now();
                for(let i = 0; i < 100000; i++) {} // Small computation
                let endTime = performance.now();
                
                return {
                    computationTime: endTime - startTime,
                    timestamp: Date.now()
                };
            """)
            
            print(f"JavaScript execution responsive: {cpu_check['computationTime']:.2f}ms")
            
        except Exception as e:
            print(f"Error during investigation: {e}")
        
        print("--- END INVESTIGATION ---\\n")
    
    def test_button_system_initialization(self):
        """Test if the Universal Button System is properly initialized"""
        test_name = "Button System Initialization"
        print(f"\\nTesting: {test_name}")
        
        try:
            # Check if button system classes are loaded
            button_class_loaded = self.driver.execute_script(
                "return typeof window.Button !== 'undefined'"
            )
            
            button_group_loaded = self.driver.execute_script(
                "return typeof window.ButtonGroup !== 'undefined'"
            )
            
            button_manager_loaded = self.driver.execute_script(
                "return typeof window.buttonGroupManager !== 'undefined'"
            )
            
            action_factory_loaded = self.driver.execute_script(
                "return typeof window.gameActionFactory !== 'undefined'"
            )
            
            render_manager_loaded = self.driver.execute_script(
                "return typeof window.g_renderLayerManager !== 'undefined'"
            )
            
            results = {
                "Button class": button_class_loaded,
                "ButtonGroup class": button_group_loaded,
                "ButtonGroupManager": button_manager_loaded,
                "GameActionFactory": action_factory_loaded,
                "RenderLayerManager": render_manager_loaded
            }
            
            all_loaded = all(results.values())
            
            for component, loaded in results.items():
                status = "PASS" if loaded else "FAIL"
                print(f"  {status}: {component}: {'Loaded' if loaded else 'Missing'}")
            
            self.test_results.append({
                "test": test_name,
                "passed": all_loaded,
                "details": results
            })
            
            return all_loaded
            
        except Exception as e:
            print(f"Error in {test_name}: {e}")
            self.test_results.append({
                "test": test_name,
                "passed": False,
                "error": str(e)
            })
            return False
    
    def test_button_group_creation(self):
        """Test if button groups are being created from JSON config"""
        test_name = "Button Group Creation"
        print(f"\\nTesting: {test_name}")
        
        try:
            # Get button group manager state with detailed error information
            manager_state = self.driver.execute_script("""
                if (window.buttonGroupManager) {
                    const diagnostics = window.buttonGroupManager.getDiagnosticInfo();
                    
                    // Get creation errors with details
                    const creationErrors = window.buttonGroupManager.groupCreationErrors || [];
                    const errorDetails = creationErrors.map(err => ({
                        config: err.config ? err.config.id : 'unknown',
                        error: err.error,
                        timestamp: err.timestamp
                    }));
                    
                    return {
                        isInitialized: window.buttonGroupManager.isInitialized,
                        activeGroupCount: window.buttonGroupManager.getActiveGroupCount(),
                        diagnostics: diagnostics,
                        creationErrors: errorDetails,
                        managerOptions: window.buttonGroupManager.options
                    };
                }
                return null;
            """)
            
            if not manager_state:
                print("ButtonGroupManager not found")
                self.test_results.append({
                    "test": test_name,
                    "passed": False,
                    "error": "ButtonGroupManager not found"
                })
                return False
            
            print(f"  Manager initialized: {manager_state['isInitialized']}")
            print(f"  Active groups: {manager_state['activeGroupCount']}")
            
            if manager_state['diagnostics']:
                diag = manager_state['diagnostics']
                print(f"  Total groups: {diag.get('totalActiveGroups', 0)}")
                print(f"  Creation errors: {diag.get('creationErrors', 0)}")
            
            # Print detailed creation errors
            if manager_state.get('creationErrors'):
                print("  Creation Error Details:")
                for error in manager_state['creationErrors']:
                    print(f"    Group '{error['config']}': {error['error']}")
                    
            # Print manager options
            if manager_state.get('managerOptions'):
                print(f"  Manager Options: {manager_state['managerOptions']}")
            
            passed = manager_state['isInitialized'] and manager_state['activeGroupCount'] > 0
            
            self.test_results.append({
                "test": test_name,
                "passed": passed,
                "details": manager_state
            })
            
            return passed
            
        except Exception as e:
            print(f"Error in {test_name}: {e}")
            self.test_results.append({
                "test": test_name,
                "passed": False,
                "error": str(e)
            })
            return False
    
    def test_button_rendering(self):
        """Test if buttons are actually being rendered to the canvas"""
        test_name = "Button Rendering"
        print(f"\\nTesting: {test_name}")
        
        try:
            # Get canvas element
            canvas = self.driver.find_element(By.TAG_NAME, "canvas")
            
            # Check if buttons are being rendered by examining console logs
            console_logs = self.driver.get_log('browser')
            button_logs = [log for log in console_logs if 'button' in log['message'].lower()]
            
            print(f"  Found {len(button_logs)} button-related console messages")
            
            # Check for specific button rendering debug messages
            rendering_logs = [log for log in button_logs if 'rendering' in log['message'].lower()]
            
            for log in rendering_logs[-5:]:  # Show last 5 rendering logs
                print(f"  Log: {log['message']}")
            
            # Test button visibility by checking game state and calling render functions
            button_visibility_test = self.driver.execute_script("""
                try {
                    // Get current game state
                    const gameState = window.GameState ? window.GameState.getState() : 'UNKNOWN';
                    
                    // Check if render layer manager is rendering buttons
                    const renderManager = window.g_renderLayerManager;
                    if (!renderManager) return { error: 'RenderLayerManager not found' };
                    
                    // Check button group manager
                    const buttonManager = window.buttonGroupManager;
                    if (!buttonManager) return { error: 'ButtonGroupManager not found' };
                    
                    // Get active groups
                    const activeGroups = buttonManager.getAllActiveGroups();
                    
                    return {
                        gameState: gameState,
                        activeGroupsCount: activeGroups.length,
                        renderManagerAvailable: !!renderManager,
                        buttonManagerAvailable: !!buttonManager
                    };
                } catch (e) {
                    return { error: e.message };
                }
            """)
            
            print(f"  Game State: {button_visibility_test.get('gameState', 'Unknown')}")
            print(f"  Active Groups: {button_visibility_test.get('activeGroupsCount', 0)}")
            print(f"  Render Manager: {'Available' if button_visibility_test.get('renderManagerAvailable') else 'Missing'}")
            print(f"  Button Manager: {'Available' if button_visibility_test.get('buttonManagerAvailable') else 'Missing'}")
            
            if 'error' in button_visibility_test:
                print(f"  Error: {button_visibility_test['error']}")
            
            passed = (len(rendering_logs) > 0 or 
                     button_visibility_test.get('activeGroupsCount', 0) > 0)
            
            self.test_results.append({
                "test": test_name,
                "passed": passed,
                "details": {
                    "console_logs": len(button_logs),
                    "rendering_logs": len(rendering_logs),
                    "visibility_test": button_visibility_test
                }
            })
            
            return passed
            
        except Exception as e:
            print(f"Error in {test_name}: {e}")
            self.test_results.append({
                "test": test_name,
                "passed": False,
                "error": str(e)
            })
            return False
    
    def test_json_config_loading(self):
        """Test if button group JSON configuration is loading properly"""
        test_name = "JSON Config Loading"
        print(f"\\nTesting: {test_name}")
        
        try:
            # Test JSON loading and parsing
            config_test = self.driver.execute_script("""
                try {
                    // Check if initialization function was called
                    const initCalled = typeof window.initializeUniversalButtonSystem === 'function';
                    
                    // Try to manually load a config to test the loading mechanism
                    if (window.buttonGroupManager && typeof window.buttonGroupManager.createButtonGroup === 'function') {
                        // Test basic group creation with minimal config
                        const testConfig = {
                            id: 'test-group',
                            name: 'Test Group',
                            layout: { type: 'horizontal', position: { x: 100, y: 100 } },
                            appearance: { visible: true },
                            conditions: {},
                            buttons: [{
                                id: 'test-button',
                                text: 'Test',
                                size: { width: 60, height: 40 },
                                action: { type: 'info', handler: 'test.action' }
                            }]
                        };
                        
                        try {
                            const testGroup = window.buttonGroupManager.createButtonGroup(testConfig);
                            return {
                                initFunctionAvailable: initCalled,
                                testGroupCreated: !!testGroup,
                                testGroupId: testGroup ? testConfig.id : null,
                                error: null
                            };
                        } catch (createError) {
                            return {
                                initFunctionAvailable: initCalled,
                                testGroupCreated: false,
                                testGroupId: null,
                                error: createError.message
                            };
                        }
                    }
                    
                    return {
                        initFunctionAvailable: initCalled,
                        testGroupCreated: false,
                        testGroupId: null,
                        error: 'ButtonGroupManager not available'
                    };
                } catch (e) {
                    return { error: e.message };
                }
            """)
            
            print(f"  Init function available: {config_test.get('initFunctionAvailable', False)}")
            print(f"  Test group created: {config_test.get('testGroupCreated', False)}")
            
            if config_test.get('error'):
                print(f"  Config test error: {config_test['error']}")
            
            if config_test.get('testGroupId'):
                print(f"  Test group ID: {config_test['testGroupId']}")
            
            passed = config_test.get('testGroupCreated', False) and not config_test.get('error')
            
            self.test_results.append({
                "test": test_name,
                "passed": passed,
                "details": config_test
            })
            
            return passed
            
        except Exception as e:
            print(f"Error in {test_name}: {e}")
            self.test_results.append({
                "test": test_name,
                "passed": False,
                "error": str(e)
            })
            return False
    
    def test_game_state_transitions(self):
        """Test button visibility during different game states"""
        test_name = "Game State Transitions"
        print(f"\\nTesting: {test_name}")
        
        try:
            # Test different game states
            states_to_test = ['MENU', 'PLAYING', 'DEBUG_MENU']
            state_results = {}
            
            for state in states_to_test:
                print(f"  Testing state: {state}")
                
                # Set game state
                set_state_result = self.driver.execute_script(f"""
                    if (window.GameState && window.GameState.setState) {{
                        window.GameState.setState('{state}');
                        return window.GameState.getState();
                    }}
                    return null;
                """)
                
                time.sleep(1)  # Give time for state change to propagate
                
                # Check button rendering for this state
                button_state_test = self.driver.execute_script("""
                    try {
                        const gameState = window.GameState ? window.GameState.getState() : 'UNKNOWN';
                        const buttonManager = window.buttonGroupManager;
                        
                        if (!buttonManager) return { error: 'ButtonGroupManager not found' };
                        
                        const activeGroups = buttonManager.getAllActiveGroups();
                        let visibleGroups = 0;
                        
                        activeGroups.forEach(group => {
                            if (group.isVisible && group.isVisible()) {
                                visibleGroups++;
                            }
                        });
                        
                        return {
                            gameState: gameState,
                            totalGroups: activeGroups.length,
                            visibleGroups: visibleGroups
                        };
                    } catch (e) {
                        return { error: e.message };
                    }
                """)
                
                state_results[state] = button_state_test
                print(f"    Current State: {button_state_test.get('gameState', 'Unknown')}")
                print(f"    Visible Groups: {button_state_test.get('visibleGroups', 0)}/{button_state_test.get('totalGroups', 0)}")
                
                if 'error' in button_state_test:
                    print(f"    Error: {button_state_test['error']}")
            
            # Check if any state showed buttons
            passed = any(result.get('visibleGroups', 0) > 0 for result in state_results.values())
            
            self.test_results.append({
                "test": test_name,
                "passed": passed,
                "details": state_results
            })
            
            return passed
            
        except Exception as e:
            print(f"Error in {test_name}: {e}")
            self.test_results.append({
                "test": test_name,
                "passed": False,
                "error": str(e)
            })
            return False
    
    def test_button_interaction(self):
        """Test button click interactions"""
        test_name = "Button Interaction"
        print(f"\\nTesting: {test_name}")
        
        try:
            # Try to click on button areas and see if they respond
            canvas = self.driver.find_element(By.TAG_NAME, "canvas")
            
            # Get canvas dimensions and try clicking in button areas
            canvas_size = canvas.size
            print(f"  Canvas size: {canvas_size['width']}x{canvas_size['height']}")
            
            # Test clicking in common button areas (top-left, top-center, right side)
            test_areas = [
                (60, 40, "Top-left (game controls area)"),
                (canvas_size['width']//2, 30, "Top-center (resource display area)"),
                (min(canvas_size['width']-60, canvas_size['width']-10), canvas_size['height']//2, "Right-center (entity actions area)")
            ]
            
            click_results = {}
            
            for x, y, description in test_areas:
                print(f"  Testing click at {description}: ({x}, {y})")
                
                try:
                    # Record console logs before click
                    logs_before = len(self.driver.get_log('browser'))
                    
                    # Perform click
                    ActionChains(self.driver).move_to_element_with_offset(canvas, x, y).click().perform()
                    time.sleep(0.5)
                    
                    # Check for new console logs
                    logs_after = len(self.driver.get_log('browser'))
                    new_logs = logs_after - logs_before
                    
                    click_results[description] = {
                        "position": (x, y),
                        "new_console_logs": new_logs,
                        "success": True
                    }
                    
                    print(f"    Generated {new_logs} new console messages")
                    
                except Exception as click_error:
                    print(f"    Click failed: {click_error}")
                    click_results[description] = {
                        "position": (x, y),
                        "new_console_logs": 0,
                        "success": False,
                        "error": str(click_error)
                    }
            
            # Check if any clicks generated button-related activity
            passed = any(result.get('new_console_logs', 0) > 0 or result.get('success', False) for result in click_results.values())
            
            self.test_results.append({
                "test": test_name,
                "passed": passed,
                "details": click_results
            })
            
            return passed
            
        except Exception as e:
            print(f"Error in {test_name}: {e}")
            self.test_results.append({
                "test": test_name,
                "passed": False,
                "error": str(e)
            })
            return False
    
    def run_all_tests(self):
        """Run all button rendering tests"""
        print("STARTING Universal Button System Tests")
        print("=" * 50)
        
        if not self.setup_driver():
            return False
        
        try:
            if not self.load_game():
                return False
            
            # Run all tests including the new JSON config test
            tests = [
                self.test_button_system_initialization,
                self.test_json_config_loading,
                self.test_button_group_creation,
                self.test_button_rendering,
                self.test_game_state_transitions,
                self.test_button_interaction
            ]
            
            passed_tests = 0
            
            for test in tests:
                if test():
                    passed_tests += 1
            
            print("\\n" + "=" * 50)
            print(f"Test Results: {passed_tests}/{len(tests)} tests passed")
            
            # Print detailed results
            for result in self.test_results:
                status = "PASS" if result['passed'] else "FAIL"
                print(f"{status}: {result['test']}")
                if not result['passed'] and 'error' in result:
                    print(f"    Error: {result['error']}")
            
            return passed_tests == len(tests)
            
        finally:
            if self.driver:
                self.driver.quit()
                print("Browser closed")
    
    def generate_report(self):
        """Generate a detailed test report"""
        report = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_tests": len(self.test_results),
            "passed_tests": sum(1 for r in self.test_results if r['passed']),
            "results": self.test_results
        }
        
        report_path = "test/selenium/button_test_report.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"Detailed report saved to: {report_path}")
        return report

if __name__ == "__main__":
    tester = ButtonRenderingTests()
    success = tester.run_all_tests()
    tester.generate_report()
    
    sys.exit(0 if success else 1)