"""
Puppeteer Controller for Behave Tests

This module provides functions to control Puppeteer from Python Behave tests.
It uses subprocess to run Node.js scripts that control the browser.
"""

import subprocess
import json
import time
from pathlib import Path
from datetime import datetime


def ensure_page_ready(page_context):
    """
    Ensure the page is loaded and ready
    """
    # Page readiness is handled in environment.py before_scenario
    return True


def take_screenshot(page_context, name, scenario_name):
    """
    Take a screenshot using Puppeteer
    
    Args:
        page_context: The page context from Behave
        name: Screenshot name (e.g., 'entities_placed')
        scenario_name: Name of the scenario for folder organization
    """
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe_scenario = scenario_name.lower().replace(' ', '_').replace('/', '_')
    filename = f"{name}_{timestamp}.png"
    
    # Create screenshot directory
    screenshot_dir = Path('test/e2e/screenshots/bdd') / safe_scenario
    screenshot_dir.mkdir(parents=True, exist_ok=True)
    
    screenshot_path = screenshot_dir / filename
    
    # Call Node.js script to take screenshot
    script = f"""
    const puppeteer = require('puppeteer');
    
    (async () => {{
        try {{
            const browser = await puppeteer.connect({{ 
                browserWSEndpoint: '{page_context['ws_endpoint']}' 
            }});
            const pages = await browser.pages();
            const page = pages[{page_context['page_index']}];
            
            await page.screenshot({{ 
                path: '{screenshot_path.as_posix()}',
                fullPage: false
            }});
            
            console.log('SUCCESS');
            await browser.disconnect();
        }} catch (error) {{
            console.error('ERROR:', error.message);
            process.exit(1);
        }}
    }})();
    """
    
    result = subprocess.run(
        ['node', '-e', script],
        capture_output=True,
        text=True,
        timeout=10
    )
    
    if result.returncode != 0:
        print(f"⚠️  Screenshot failed: {result.stderr}")
    else:
        print(f"📸 Screenshot saved: {screenshot_path}")
    
    return str(screenshot_path)


def execute_js(page_context, js_code):
    """
    Execute JavaScript code in the browser page
    
    Args:
        page_context: The page context from Behave
        js_code: JavaScript code to execute (can be string or function)
    
    Returns:
        Result of the JavaScript execution
    """
    # Wrap code if it's a function
    if js_code.strip().startswith('async'):
        wrapped_code = f"({js_code})()"
    elif js_code.strip().startswith('()'):
        wrapped_code = js_code
    else:
        wrapped_code = f"(() => {{ {js_code} }})()"
    
    # Escape quotes for shell
    escaped_code = js_code.replace('`', '\\`').replace('$', '\\$')
    
    script = f"""
    const puppeteer = require('puppeteer');
    
    (async () => {{
        try {{
            const browser = await puppeteer.connect({{ 
                browserWSEndpoint: '{page_context['ws_endpoint']}' 
            }});
            const pages = await browser.pages();
            const page = pages[{page_context['page_index']}];
            
            const result = await page.evaluate({escaped_code});
            
            console.log(JSON.stringify({{ success: true, result: result }}));
            await browser.disconnect();
        }} catch (error) {{
            console.error(JSON.stringify({{ success: false, error: error.message }}));
            process.exit(1);
        }}
    }})();
    """
    
    result = subprocess.run(
        ['node', '-e', script],
        capture_output=True,
        text=True,
        timeout=30
    )
    
    if result.returncode != 0:
        error_msg = result.stderr
        try:
            error_data = json.loads(error_msg)
            raise RuntimeError(f"JavaScript execution failed: {error_data.get('error', 'Unknown error')}")
        except json.JSONDecodeError:
            raise RuntimeError(f"JavaScript execution failed: {error_msg}")
    
    try:
        response = json.loads(result.stdout)
        return response.get('result', {})
    except json.JSONDecodeError:
        # If not JSON, return raw output
        return {'output': result.stdout}


def click_at_position(page_context, x, y):
    """
    Click at specific screen coordinates
    
    Args:
        page_context: The page context from Behave
        x: X coordinate
        y: Y coordinate
    """
    script = f"""
    const puppeteer = require('puppeteer');
    
    (async () => {{
        const browser = await puppeteer.connect({{ 
            browserWSEndpoint: '{page_context['ws_endpoint']}' 
        }});
        const pages = await browser.pages();
        const page = pages[{page_context['page_index']}];
        
        await page.mouse.click({x}, {y});
        
        console.log('SUCCESS');
        await browser.disconnect();
    }})();
    """
    
    result = subprocess.run(
        ['node', '-e', script],
        capture_output=True,
        text=True,
        timeout=10
    )
    
    if result.returncode != 0:
        raise RuntimeError(f"Click failed: {result.stderr}")
    
    return True


def mouse_drag(page_context, x1, y1, x2, y2):
    """
    Drag mouse from (x1, y1) to (x2, y2)
    
    Args:
        page_context: The page context from Behave
        x1, y1: Start coordinates
        x2, y2: End coordinates
    """
    script = f"""
    const puppeteer = require('puppeteer');
    
    (async () => {{
        const browser = await puppeteer.connect({{ 
            browserWSEndpoint: '{page_context['ws_endpoint']}' 
        }});
        const pages = await browser.pages();
        const page = pages[{page_context['page_index']}];
        
        await page.mouse.move({x1}, {y1});
        await page.mouse.down();
        await page.mouse.move({x2}, {y2});
        await page.mouse.up();
        
        console.log('SUCCESS');
        await browser.disconnect();
    }})();
    """
    
    result = subprocess.run(
        ['node', '-e', script],
        capture_output=True,
        text=True,
        timeout=10
    )
    
    if result.returncode != 0:
        raise RuntimeError(f"Mouse drag failed: {result.stderr}")
    
    return True


def wait_for_condition(page_context, condition_js, timeout=5000):
    """
    Wait for a JavaScript condition to become true
    
    Args:
        page_context: The page context from Behave
        condition_js: JavaScript code that returns boolean
        timeout: Maximum wait time in milliseconds
    """
    script = f"""
    const puppeteer = require('puppeteer');
    
    (async () => {{
        const browser = await puppeteer.connect({{ 
            browserWSEndpoint: '{page_context['ws_endpoint']}' 
        }});
        const pages = await browser.pages();
        const page = pages[{page_context['page_index']}];
        
        await page.waitForFunction({condition_js}, {{ timeout: {timeout} }});
        
        console.log('SUCCESS');
        await browser.disconnect();
    }})();
    """
    
    result = subprocess.run(
        ['node', '-e', script],
        capture_output=True,
        text=True,
        timeout=(timeout / 1000) + 5
    )
    
    if result.returncode != 0:
        raise RuntimeError(f"Condition wait failed: {result.stderr}")
    
    return True


def sleep(seconds):
    """
    Sleep for specified seconds
    """
    time.sleep(seconds)
