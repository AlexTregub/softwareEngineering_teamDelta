from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time

opts = Options()
opts.add_argument('--headless=new')
opts.add_argument('--disable-logging')
opts.add_argument('--log-level=3')
opts.add_experimental_option('excludeSwitches', ['enable-logging'])

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
driver.get('http://localhost:8000/index.html')
time.sleep(5)  # Wait longer for full game to load

# Check for JavaScript errors
logs = driver.get_log('browser')
print('\n=== Browser Console Logs ===')
for log in logs:
    if log['level'] in ['SEVERE', 'ERROR']:
        print(f"{log['level']}: {log['message']}")

# Check what's loaded
result = driver.execute_script("""
    return {
        ResourceDisplayComponent: typeof window.ResourceDisplayComponent,
        GameUIOverlay: typeof window.GameUIOverlay,
        RenderManager: typeof window.RenderManager,
        EventManager: typeof window.EventManager,
        p5: typeof window.setup,
        errorCount: window.console ? 'console available' : 'no console',
        scriptCount: document.querySelectorAll('script').length
    };
""")

print('\n=== Window Objects ===')
for key, value in result.items():
    print(f'{key}: {value}')

driver.quit()
