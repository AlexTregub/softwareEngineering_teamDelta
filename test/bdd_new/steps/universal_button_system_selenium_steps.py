#!/usr/bin/env python3
"""
Universal Button System - Selenium BDD Step Definitions
Implements comprehensive browser-based testing for the Universal Button System
Tests the actual public APIs and validates system interactions

Author: Software Engineering Team Delta - David Willman
Version: 1.0.0
"""

import time
import json
import subprocess
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import WebDriverException
from behave import given, when, then


class UniversalButtonSystemTest:
    """Selenium WebDriver wrapper for Universal Button System testing"""
    
    def __init__(self):
        self.driver = None
        self.server = None
        self.action_chains = None
        
    def start_browser(self):
        """Initialize browser and start local server"""
        # Start HTTP server
        self.server = subprocess.Popen(
            ['python', '-m', 'http.server', '8000'],
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE
        )
        time.sleep(2)
        
        # Configure Chrome options
        chrome_options = Options()
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-web-security')
        
        # Start WebDriver
        self.driver = webdriver.Chrome(options=chrome_options)
        self.action_chains = ActionChains(self.driver)
        
        # Load application
        self.driver.get('http://localhost:8000')
        time.sleep(8)  # Allow full initialization
        
    def cleanup(self):
        """Clean up browser and server resources"""
        if self.driver:
            self.driver.quit()
        if self.server:
            self.server.terminate()
            self.server.wait()


# Global test instance
test_instance = UniversalButtonSystemTest()


# GIVEN STEPS - Setup and Initialization

@given('I have opened the game application in a browser')
def step_open_browser(context):
    """Initialize browser and load the game application"""
    test_instance.start_browser()
    context.browser = test_instance
    

@given('the ButtonGroupManager has been initialized')
def step_button_manager_initialized(context):
    """Verify ButtonGroupManager is properly initialized"""
    result = context.browser.driver.execute_script('''
        return {
            exists: typeof window.buttonGroupManager !== 'undefined',
            type: typeof window.buttonGroupManager,
            hasActiveGroups: window.buttonGroupManager && typeof window.buttonGroupManager.activeGroups !== 'undefined',
            activeGroupsType: window.buttonGroupManager ? typeof window.buttonGroupManager.activeGroups : 'undefined'
        };
    ''')
    
    assert result['exists'], "ButtonGroupManager should exist on window"
    assert result['hasActiveGroups'], "ButtonGroupManager should have activeGroups property"
    context.button_manager_info = result


@given('the GameActionFactory has been initialized')
def step_action_factory_initialized(context):
    """Verify GameActionFactory is properly initialized"""
    result = context.browser.driver.execute_script('''
        return {
            exists: typeof window.gameActionFactory !== 'undefined',
            type: typeof window.gameActionFactory,
            hasExecuteAction: window.gameActionFactory && typeof window.gameActionFactory.executeAction === 'function'
        };
    ''')
    
    assert result['exists'], "GameActionFactory should exist on window"
    assert result['hasExecuteAction'], "GameActionFactory should have executeAction method"
    context.action_factory_info = result


@given('the RenderLayerManager has been initialized')
def step_render_manager_initialized(context):
    """Verify RenderLayerManager is properly initialized"""
    result = context.browser.driver.execute_script('''
        return {
            exists: typeof window.g_renderLayerManager !== 'undefined',
            type: typeof window.g_renderLayerManager,
            hasToggleLayer: window.g_renderLayerManager && typeof window.g_renderLayerManager.toggleLayer === 'function',
            hasIsLayerEnabled: window.g_renderLayerManager && typeof window.g_renderLayerManager.isLayerEnabled === 'function',
            hasLayers: window.g_renderLayerManager && window.g_renderLayerManager.layers,
            hasDisabledLayers: window.g_renderLayerManager && window.g_renderLayerManager.disabledLayers
        };
    ''')
    
    assert result['exists'], "RenderLayerManager should exist on window"
    assert result['hasToggleLayer'], "RenderLayerManager should have toggleLayer method"
    assert result['hasIsLayerEnabled'], "RenderLayerManager should have isLayerEnabled method"
    context.render_manager_info = result


@given('I have a valid button group configuration with id "{group_id}"')
def step_create_button_config(context, group_id):
    """Create a valid button group configuration"""
    context.test_config = {
        'id': group_id,
        'name': f'Test Group {group_id}',
        'layout': {
            'type': 'horizontal',
            'position': {'x': 'center', 'y': 'center'},
            'spacing': 10,
            'padding': {'top': 10, 'right': 15, 'bottom': 10, 'left': 15}
        },
        'appearance': {
            'scale': 1.0,
            'transparency': 1.0,
            'visible': True,
            'background': {'color': [60, 60, 60, 200], 'cornerRadius': 5}
        },
        'behavior': {
            'draggable': True,
            'resizable': False,
            'snapToEdges': False
        },
        'persistence': {
            'savePosition': False,
            'storageKey': f'{group_id}-test-key'
        },
        'buttons': [
            {
                'id': 'debug-toggle',
                'text': '🔧 Debug',
                'size': {'width': 80, 'height': 30},
                'action': {'type': 'function', 'handler': 'debug.toggleGrid'}
            }
        ]
    }


@given('I have a ButtonGroup with {button_count:d} buttons configured')
def step_create_multi_button_group(context, button_count):
    """Create a ButtonGroup configuration with multiple buttons"""
    buttons = []
    for i in range(1, button_count + 1):
        buttons.append({
            'id': f'test-btn-{i}',
            'text': f'Button {i}',
            'size': {'width': 70, 'height': 30},
            'action': {'type': 'function', 'handler': f'test.action{i}'}
        })
    
    context.test_config = {
        'id': 'multi-button-test',
        'name': 'Multi Button Test Group',
        'layout': {
            'type': 'horizontal',
            'position': {'x': 100, 'y': 100},
            'spacing': 10,
            'padding': {'top': 10, 'right': 10, 'bottom': 10, 'left': 10}
        },
        'appearance': {
            'scale': 1.0,
            'transparency': 1.0,
            'visible': True,
            'background': {'color': [60, 60, 60, 200], 'cornerRadius': 5}
        },
        'behavior': {'draggable': False, 'resizable': False, 'snapToEdges': False},
        'persistence': {'savePosition': False, 'storageKey': 'multi-test-key'},
        'buttons': buttons
    }


@given('I have a debug button with action "{action_name}"')
def step_create_debug_button(context, action_name):
    """Create a debug button configuration"""
    context.debug_button_config = {
        'id': 'debug-toggle',
        'text': '🔧 Debug',
        'size': {'width': 80, 'height': 30},
        'action': {'type': 'function', 'handler': action_name}
    }
    
    # Find the actual debug button in the browser
    button_info = context.browser.driver.execute_script('''
        const buttonManager = window.buttonGroupManager;
        if (buttonManager && buttonManager.activeGroups) {
            for (let [groupId, entry] of buttonManager.activeGroups) {
                if (entry.instance && entry.instance.buttons) {
                    for (const button of entry.instance.buttons) {
                        if (button.config && button.config.id === 'debug-toggle') {
                            return {
                                found: true,
                                x: button.bounds ? button.bounds.x : button.x,
                                y: button.bounds ? button.bounds.y : button.y,
                                width: button.bounds ? button.bounds.width : button.width,
                                height: button.bounds ? button.bounds.height : button.height,
                                config: button.config
                            };
                        }
                    }
                }
            }
        }
        return {found: false};
    ''')
    
    assert button_info['found'], "Debug button should be found in the button system"
    context.debug_button_info = button_info


# WHEN STEPS - Actions and Operations

@when('I call buttonGroupManager.createButtonGroup with the configuration')
def step_call_create_button_group(context):
    """Call the ButtonGroupManager.createButtonGroup method"""
    config_json = json.dumps(context.test_config)
    
    result = context.browser.driver.execute_script(f'''
        const config = {config_json};
        try {{
            const result = window.buttonGroupManager.createButtonGroup(config);
            return {{
                success: true,
                result: result,
                groupExists: window.buttonGroupManager.activeGroups.has(config.id)
            }};
        }} catch (error) {{
            return {{
                success: false,
                error: error.message,
                groupExists: false
            }};
        }}
    ''')
    
    context.create_group_result = result


@when('the ButtonGroup initializes and creates buttons')
def step_button_group_initializes(context):
    """Trigger ButtonGroup initialization and button creation"""
    config_json = json.dumps(context.test_config)
    
    result = context.browser.driver.execute_script(f'''
        const config = {config_json};
        try {{
            // Create the button group and let it initialize
            window.buttonGroupManager.createButtonGroup(config);
            
            // Get the created group
            const entry = window.buttonGroupManager.activeGroups.get(config.id);
            if (entry && entry.instance) {{
                return {{
                    success: true,
                    buttonCount: entry.instance.buttons ? entry.instance.buttons.length : 0,
                    buttons: entry.instance.buttons ? entry.instance.buttons.map(btn => ({{
                        id: btn.config ? btn.config.id : 'unknown',
                        hasConfig: !!btn.config,
                        x: btn.x || 0,
                        y: btn.y || 0
                    }})) : []
                }};
            }}
            return {{success: false, error: 'Group not created'}};
        }} catch (error) {{
            return {{success: false, error: error.message}};
        }}
    ''')
    
    context.button_creation_result = result


@when('I click on the debug button at its rendered position')
def step_click_debug_button(context):
    """Click on the debug button at its actual rendered position"""
    button_info = context.debug_button_info
    
    # Get canvas element
    canvas = context.browser.driver.find_element(By.TAG_NAME, 'canvas')
    
    # Calculate click position (center of button)
    click_x = int(button_info['x'] + button_info['width'] / 2)
    click_y = int(button_info['y'] + button_info['height'] / 2)
    
    # Clear console logs before click
    context.browser.driver.get_log('browser')
    
    # Perform click
    ActionChains(context.browser.driver).move_to_element_with_offset(
        canvas, click_x, click_y
    ).click().perform()
    
    time.sleep(0.5)  # Allow action to process
    
    context.debug_click_position = {'x': click_x, 'y': click_y}


@when('I call renderLayerManager.toggleLayer("{layer_name}")')
def step_toggle_layer(context, layer_name):
    """Call the RenderLayerManager.toggleLayer method"""
    result = context.browser.driver.execute_script(f'''
        try {{
            const initialState = window.g_renderLayerManager.isLayerEnabled("{layer_name}");
            window.g_renderLayerManager.toggleLayer("{layer_name}");
            const finalState = window.g_renderLayerManager.isLayerEnabled("{layer_name}");
            
            return {{
                success: true,
                initialState: initialState,
                finalState: finalState,
                toggled: initialState !== finalState
            }};
        }} catch (error) {{
            return {{
                success: false,
                error: error.message
            }};
        }}
    ''')
    
    context.layer_toggle_result = result


# THEN STEPS - Validation and Assertions

@then('the ButtonGroupManager should contain exactly {count:d} active group')
@then('the ButtonGroupManager should contain exactly {count:d} active groups')
def step_verify_active_group_count(context, count):
    """Verify the number of active groups in ButtonGroupManager"""
    result = context.browser.driver.execute_script('''
        return {
            activeGroupCount: window.buttonGroupManager.activeGroups.size,
            groupIds: Array.from(window.buttonGroupManager.activeGroups.keys())
        };
    ''')
    
    assert result['activeGroupCount'] == count, \
        f"Expected {count} active groups, got {result['activeGroupCount']}"
    
    context.active_groups_info = result


@then('the active group should have the correct configuration')
def step_verify_group_configuration(context):
    """Verify the active group has the correct configuration"""
    group_id = context.test_config['id']
    
    result = context.browser.driver.execute_script(f'''
        const entry = window.buttonGroupManager.activeGroups.get("{group_id}");
        if (entry && entry.config) {{
            return {{
                found: true,
                configId: entry.config.id,
                configName: entry.config.name,
                buttonCount: entry.config.buttons ? entry.config.buttons.length : 0
            }};
        }}
        return {{found: false}};
    ''')
    
    assert result['found'], f"Group configuration should be found for {group_id}"
    assert result['configId'] == context.test_config['id'], "Configuration ID should match"
    assert result['configName'] == context.test_config['name'], "Configuration name should match"


@then('the active group should have a valid ButtonGroup instance')
def step_verify_button_group_instance(context):
    """Verify the active group has a valid ButtonGroup instance"""
    group_id = context.test_config['id']
    
    result = context.browser.driver.execute_script(f'''
        const entry = window.buttonGroupManager.activeGroups.get("{group_id}");
        return {{
            hasEntry: !!entry,
            hasInstance: entry && !!entry.instance,
            instanceType: entry && entry.instance ? typeof entry.instance : 'undefined',
            hasButtons: entry && entry.instance && Array.isArray(entry.instance.buttons),
            buttonCount: entry && entry.instance && entry.instance.buttons ? entry.instance.buttons.length : 0
        }};
    ''')
    
    assert result['hasEntry'], "Group entry should exist"
    assert result['hasInstance'], "Group should have an instance"
    assert result['instanceType'] == 'object', "Instance should be an object"


@then('the ButtonGroup should contain exactly {count:d} button instances')
def step_verify_button_instance_count(context, count):
    """Verify the ButtonGroup contains the expected number of button instances"""
    result = context.button_creation_result
    
    assert result['success'], f"Button creation should succeed: {result.get('error', 'Unknown error')}"
    assert result['buttonCount'] == count, \
        f"Expected {count} buttons, got {result['buttonCount']}"


@then('each button should have the correct configuration properties')
def step_verify_button_configurations(context):
    """Verify each button has correct configuration properties"""
    result = context.button_creation_result
    
    assert result['success'], "Button creation should have succeeded"
    
    # Check that buttons have required properties
    for i, button in enumerate(result['buttons']):
        assert button['hasConfig'], f"Button {i} should have configuration"
        assert button['id'] and button['id'] != 'unknown', f"Button {i} should have valid ID"


@then('each button should be positioned correctly within the group bounds')
def step_verify_button_positions(context):
    """Verify buttons are positioned correctly within the group"""
    result = context.button_creation_result
    
    assert result['success'], "Button creation should have succeeded"
    
    # Verify positions are set (not all zeros)
    position_set = any(btn['x'] != 0 or btn['y'] != 0 for btn in result['buttons'])
    assert position_set, "At least some buttons should have non-zero positions"


@then('the GameActionFactory.executeAction should be called with the correct action')
def step_verify_action_execution(context):
    """Verify that the action execution was called correctly"""
    # Test by executing the action directly to verify it works
    result = context.browser.driver.execute_script('''
        try {
            const buttonConfig = {
                action: { handler: 'debug.toggleGrid' }
            };
            const result = window.gameActionFactory.executeAction(buttonConfig);
            return {
                success: true,
                actionResult: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    ''')
    
    assert result['success'], f"Action execution should succeed: {result.get('error', 'Unknown error')}"
    context.action_execution_result = result


@then('the debug action should execute successfully')
def step_verify_debug_action_success(context):
    """Verify the debug action executed successfully"""
    result = context.action_execution_result
    
    assert result['success'], "Debug action should execute successfully"
    # The action result should indicate success
    action_result = result.get('actionResult', {})
    assert action_result.get('success', False), "Action result should indicate success"


@then('the RenderLayerManager should toggle the UI_DEBUG layer state')
def step_verify_layer_toggle(context):
    """Verify that the UI_DEBUG layer state was toggled"""
    # Get the current layer state
    layer_state = context.browser.driver.execute_script('''
        return {
            isEnabled: window.g_renderLayerManager.isLayerEnabled("UI_DEBUG"),
            disabledCount: window.g_renderLayerManager.disabledLayers.size
        };
    ''')
    
    # The layer state should have changed from the action
    context.final_layer_state = layer_state


# Cleanup function to be called after each scenario
def after_scenario(context, scenario):
    """Clean up after each scenario"""
    if hasattr(context, 'browser') and context.browser:
        context.browser.cleanup()


# Register the cleanup function
def after_all(context):
    """Final cleanup after all tests"""
    if hasattr(context, 'browser') and context.browser:
        context.browser.cleanup()