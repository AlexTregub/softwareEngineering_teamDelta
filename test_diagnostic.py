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
driver.get('http://localhost:8000/test_ui_classes.html')
time.sleep(2)

result = driver.execute_script("""
    return {
        ResourceDisplayComponent: typeof window.ResourceDisplayComponent,
        GameUIOverlay: typeof window.GameUIOverlay,
        scripts: Array.from(document.querySelectorAll('script')).map(s => s.src)
    };
""")

print('Result:', result)
driver.quit()
