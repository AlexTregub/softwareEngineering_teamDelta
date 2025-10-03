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
            print(f" ChromeDriver initialized successfully")
            return True
        except Exception as e:
            print(f" Failed to initialize ChromeDriver: {e}")
            return False
    
    def load_game(self):
        """Load the game and wait for initialization"""
        try:
            print(f" Loading game from {self.base_url}")
            self.driver.get(self.base_url)
            
            # Wait for p5.js to load
            WebDriverWait(self.driver, 20).until(
                lambda driver: driver.execute_script("return typeof window.setup === 'function'")
            )
            
            # Wait for game initialization
            time.sleep(3)  # Give time for setup() to complete
            
            print(" Game loaded successfully")
            return True
            
        except TimeoutException:
            print(" Timeout waiting for game to load")
            return False
        except Exception as e:
            print(f" Error loading game: {e}")
            return False
    
    def test_button_system_initialization(self):
        """Test if the Universal Button System is properly initialized"""
        test_name = "Button System Initialization"
        print(f"\n Testing: {test_name}")
        
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
                status = "" if loaded else ""
                print(f"  {status} {component}: {'Loaded' if loaded else 'Missing'}")
            
            self.test_results.append({
                "test": test_name,
                "passed": all_loaded,
                "details": results
            })
            
            return all_loaded
            
        except Exception as e:
            print(f" Error in {test_name}: {e}")
            self.test_results.append({
                "test": test_name,
                "passed": False,
                "error": str(e)
            })
            return False
    
    def test_button_group_creation(self):
        """Test if button groups are being created from JSON config"""
        test_name = "Button Group Creation"
        print(f"\n Testing: {test_name}")
        
        try:
            # Get button group manager state
            manager_state = self.driver.execute_script("""
                if (window.buttonGroupManager) {
                    return {
                        isInitialized: window.buttonGroupManager.isInitialized,
                        activeGroupCount: window.buttonGroupManager.getActiveGroupCount(),
                        diagnostics: window.buttonGroupManager.getDiagnosticInfo()
                    };
                }
                return null;
            """)
            
            if not manager_state:
                print(" ButtonGroupManager not found")
                self.test_results.append({
                    "test": test_name,
                    "passed": False,
                    "error": "ButtonGroupManager not found"
                })
                return False
            
            print(f"   Manager initialized: {manager_state['isInitialized']}")
            print(f"   Active groups: {manager_state['activeGroupCount']}")
            
            if manager_state['diagnostics']:
                diag = manager_state['diagnostics']
                print(f"   Total groups: {diag.get('totalActiveGroups', 0)}")
                print(f"   Creation errors: {diag.get('creationErrors', 0)}")
            
            passed = manager_state['isInitialized'] and manager_state['activeGroupCount'] > 0
            
            self.test_results.append({
                "test": test_name,
                "passed": passed,
                "details": manager_state
            })
            
            return passed
            
        except Exception as e:
            print(f" Error in {test_name}: {e}")
            self.test_results.append({
                "test": test_name,
                "passed": False,
                "error": str(e)
            })
            return False
    
    def test_button_rendering(self):
        """Test if buttons are actually being rendered to the canvas"""
        test_name = "Button Rendering"
        print(f"\n Testing: {test_name}")
        
        try:
            # Get canvas element
            canvas = self.driver.find_element(By.TAG_NAME, "canvas")
            
            # Check if buttons are being rendered by examining console logs
            console_logs = self.driver.get_log('browser')
            button_logs = [log for log in console_logs if 'button' in log['message'].lower()]
            
            print(f"   Found {len(button_logs)} button-related console messages")
            
            # Check for specific button rendering debug messages
            rendering_logs = [log for log in button_logs if 'rendering' in log['message'].lower()]
            
            for log in rendering_logs[-5:]:  # Show last 5 rendering logs
                print(f"   {log['message']}")
            
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
            
            print(f"   Game State: {button_visibility_test.get('gameState', 'Unknown')}")
            print(f"   Active Groups: {button_visibility_test.get('activeGroupsCount', 0)}")
            print(f"   Render Manager: {'Available' if button_visibility_test.get('renderManagerAvailable') else 'Missing'}")
            print(f"   Button Manager: {'Available' if button_visibility_test.get('buttonManagerAvailable') else 'Missing'}")
            
            if 'error' in button_visibility_test:
                print(f"   Error: {button_visibility_test['error']}")
            
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
            print(f" Error in {test_name}: {e}")
            self.test_results.append({
                "test": test_name,
                "passed": False,
                "error": str(e)
            })
            return False
    
    def test_game_state_transitions(self):
        """Test button visibility during different game states"""
        test_name = "Game State Transitions"
        print(f"\n Testing: {test_name}")
        
        try:
            # Test different game states
            states_to_test = ['MENU', 'PLAYING', 'DEBUG_MENU']
            state_results = {}
            
            for state in states_to_test:
                print(f"   Testing state: {state}")
                
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
                    print(f"     Error: {button_state_test['error']}")
            
            # Check if any state showed buttons
            passed = any(result.get('visibleGroups', 0) > 0 for result in state_results.values())
            
            self.test_results.append({
                "test": test_name,
                "passed": passed,
                "details": state_results
            })
            
            return passed
            
        except Exception as e:
            print(f" Error in {test_name}: {e}")
            self.test_results.append({
                "test": test_name,
                "passed": False,
                "error": str(e)
            })
            return False
    
    def test_button_interaction(self):
        """Test button click interactions"""
        test_name = "Button Interaction"
        print(f"\n Testing: {test_name}")
        
        try:
            # Try to click on button areas and see if they respond
            canvas = self.driver.find_element(By.TAG_NAME, "canvas")
            
            # Get canvas dimensions and try clicking in button areas
            canvas_size = canvas.size
            print(f"   Canvas size: {canvas_size['width']}x{canvas_size['height']}")
            
            # Test clicking in common button areas (top-left, top-center, right side)
            test_areas = [
                (60, 40, "Top-left (game controls area)"),
                (canvas_size['width']//2, 30, "Top-center (resource display area)"),
                (canvas_size['width']-60, canvas_size['height']//2, "Right-center (entity actions area)")
            ]
            
            click_results = {}
            
            for x, y, description in test_areas:
                print(f"   Testing click at {description}: ({x}, {y})")
                
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
                    "new_console_logs": new_logs
                }
                
                print(f"     Generated {new_logs} new console messages")
            
            # Check if any clicks generated button-related activity
            passed = any(result['new_console_logs'] > 0 for result in click_results.values())
            
            self.test_results.append({
                "test": test_name,
                "passed": passed,
                "details": click_results
            })
            
            return passed
            
        except Exception as e:
            print(f" Error in {test_name}: {e}")
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
            
            # Run all tests
            tests = [
                self.test_button_system_initialization,
                self.test_button_group_creation,
                self.test_button_rendering,
                self.test_game_state_transitions,
                self.test_button_interaction
            ]
            
            passed_tests = 0
            
            for test in tests:
                if test():
                    passed_tests += 1
            
            print("\n" + "=" * 50)
            print(f" Test Results: {passed_tests}/{len(tests)} tests passed")
            
            # Print detailed results
            for result in self.test_results:
                status = " PASS" if result['passed'] else " FAIL"
                print(f"{status}: {result['test']}")
                if not result['passed'] and 'error' in result:
                    print(f"    Error: {result['error']}")
            
            return passed_tests == len(tests)
            
        finally:
            if self.driver:
                self.driver.quit()
                print(" Browser closed")
    
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
        
        print(f" Detailed report saved to: {report_path}")
        return report

if __name__ == "__main__":
    tester = ButtonRenderingTests()
    success = tester.run_all_tests()
    tester.generate_report()
    
    sys.exit(0 if success else 1)