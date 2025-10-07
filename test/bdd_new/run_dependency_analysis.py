#!/usr/bin/env python3
"""
Dedicated test runner for dependency analysis
Runs only the dependency analysis feature to avoid step definition conflicts
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

class SimpleBrowser:
    def __init__(self):
        self.driver = None
        
    def initialize_driver(self):
        """Initialize Chrome WebDriver for dependency analysis"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        return self.driver
    
    def load_game(self):
        """Load the game with all ant system classes"""
        game_path = "file:///" + os.path.abspath("../../index.html").replace("\\", "/")
        print(f"Loading game from: {game_path}")
        
        self.driver.get(game_path)
        time.sleep(3)  # Wait for game to load
        
        # Verify game loaded
        title = self.driver.title
        print(f"Game title: {title}")
        return title
    
    def close(self):
        if self.driver:
            self.driver.quit()

def run_dependency_analysis():
    """Run the ant system dependency analysis manually"""
    print("=== ANT SYSTEM DEPENDENCY ANALYSIS ===")
    
    browser = SimpleBrowser()
    
    try:
        # Initialize browser
        print("🔧 Initializing browser...")
        browser.initialize_driver()
        
        # Load game
        print("🎮 Loading game...")
        browser.load_game()
        
        # Run dependency analysis
        print("🔍 Analyzing ant system dependencies...")
        
        result = browser.driver.execute_script("""
            console.log('Starting system analysis...');
            
            // Check if ant classes are available
            const systemCheck = {
                antClass: typeof ant !== 'undefined',
                antPrototype: typeof ant !== 'undefined' && ant.prototype ? true : false,
                jobComponent: typeof JobComponent !== 'undefined',
                taskManager: typeof TaskManager !== 'undefined',
                antsSpawn: typeof antsSpawn === 'function',
                assignJob: typeof assignJob === 'function',
                antBaseSprite: typeof antBaseSprite !== 'undefined',
                createVector: typeof createVector !== 'undefined',
                statsContainer: typeof StatsContainer !== 'undefined',
                resourceManager: typeof ResourceManager !== 'undefined'
            };
            
            console.log('System check result:', systemCheck);
            
            return {
                success: Object.values(systemCheck).some(available => available),
                components: systemCheck,
                loadedComponents: Object.keys(systemCheck).filter(key => systemCheck[key])
            };
        """)
        
        print(f"✅ Components loaded: {result['loadedComponents']}")
        
        if result['success']:
            # Analyze ant class if available
            if result['components']['antClass']:
                print("\n🔍 Analyzing ant class...")
                ant_analysis = browser.driver.execute_script("""
                    console.log('Analyzing ant class prototype...');
                    const methods = [];
                    
                    // Get ant prototype methods only (safer)
                    if (ant && ant.prototype) {
                        const proto = ant.prototype;
                        const methodNames = Object.getOwnPropertyNames(proto);
                        
                        methodNames.forEach(name => {
                            if (typeof proto[name] === 'function' && name !== 'constructor') {
                                methods.push({
                                    name: name,
                                    isPrivate: name.startsWith('_')
                                });
                            }
                        });
                        
                        console.log('Found', methods.length, 'methods');
                    }
                    
                    return { 
                        methods: methods, 
                        skipInstance: true,
                        dependenciesAvailable: {
                            createVector: typeof createVector !== 'undefined',
                            statsContainer: typeof StatsContainer !== 'undefined',
                            resourceManager: typeof ResourceManager !== 'undefined'
                        }
                    };
                """)
                
                print(f"   📋 Methods found: {len(ant_analysis['methods'])}")
                public_methods = [m['name'] for m in ant_analysis['methods'] if not m['isPrivate']]
                print(f"   📋 Public methods: {public_methods}")
                
                print(f"   🔗 Dependencies: {ant_analysis['dependenciesAvailable']}")
                
                # Store key methods for rewriting tests
                context_methods = public_methods
            
            # Analyze spawning functions
            if result['components']['antsSpawn']:
                print("\n🔍 Analyzing spawning functions...")
                spawn_analysis = browser.driver.execute_script("""
                    return {
                        antsSpawn: {
                            available: typeof antsSpawn === 'function',
                            signature: antsSpawn.toString().substring(0, 100) + '...'
                        },
                        assignJob: {
                            available: typeof assignJob === 'function', 
                            signature: typeof assignJob === 'function' ? assignJob.toString().substring(0, 100) + '...' : null
                        }
                    };
                """)
                
                print(f"   ✅ antsSpawn available: {spawn_analysis['antsSpawn']['available']}")
                print(f"   ✅ assignJob available: {spawn_analysis['assignJob']['available']}")
            
            # Analyze job system
            if result['components']['jobComponent']:
                print("\n🔍 Analyzing JobComponent...")
                job_analysis = browser.driver.execute_script("""
                    const jobMethods = [];
                    
                    if (JobComponent) {
                        const names = Object.getOwnPropertyNames(JobComponent);
                        names.forEach(name => {
                            if (typeof JobComponent[name] === 'function') {
                                jobMethods.push(name);
                            }
                        });
                        
                        // Try to get available jobs
                        let availableJobs = [];
                        if (typeof JobComponent.getAllJobs === 'function') {
                            try {
                                availableJobs = JobComponent.getAllJobs();
                            } catch (e) {
                                console.warn('Error getting all jobs:', e);
                            }
                        }
                        
                        return {
                            methods: jobMethods,
                            availableJobs: availableJobs
                        };
                    }
                    
                    return { noJobComponent: true };
                """)
                
                if 'methods' in job_analysis:
                    print(f"   📋 JobComponent methods: {job_analysis['methods']}")
                    print(f"   🎯 Available jobs: {job_analysis['availableJobs']}")
            
            # Analyze dependencies
            print("\n🔍 Analyzing dependencies...")
            dep_analysis = browser.driver.execute_script("""
                const dependencies = {
                    p5js: [],
                    gameGlobals: [],
                    browser: []
                };
                
                // Check p5.js functions
                const p5Functions = ['createVector', 'random', 'stroke', 'fill', 'rect', 'ellipse', 'text'];
                p5Functions.forEach(func => {
                    if (typeof window[func] !== 'undefined') {
                        dependencies.p5js.push(func);
                    }
                });
                
                // Check game globals
                const gameGlobals = ['ants', 'antIndex', 'g_map2', 'g_resourceList', 'TILE_SIZE'];
                gameGlobals.forEach(global => {
                    if (typeof window[global] !== 'undefined') {
                        dependencies.gameGlobals.push(global);
                    }
                });
                
                return dependencies;
            """)
            
            print(f"   🎨 p5.js functions: {dep_analysis['p5js']}")
            print(f"   🎮 Game globals: {dep_analysis['gameGlobals']}")
            
            # Generate summary
            print("\n=== DEPENDENCY ANALYSIS SUMMARY ===")
            print("✅ REAL SYSTEM APIS DISCOVERED:")
            print(f"   - Ant class: {'Available' if result['components']['antClass'] else 'Not loaded'}")
            print(f"   - JobComponent: {'Available' if result['components']['jobComponent'] else 'Not loaded'}")  
            print(f"   - Spawning functions: {'Available' if result['components']['antsSpawn'] else 'Not loaded'}")
            
            print("\n🚨 CRITICAL FINDINGS:")
            if not result['components']['antClass']:
                print("   ❌ ant class not loaded - tests would fail")
            if not result['components']['jobComponent']:
                print("   ⚠️  JobComponent not loaded - job tests need fallback")
            
            print("\n✅ NEXT STEPS:")
            print("   1. Use discovered APIs in tests (not fake implementations)")
            print("   2. Mock the identified dependencies for browser testing")
            print("   3. Write tests that validate REAL system behavior")
            
            return True
        else:
            print("❌ No ant system components loaded")
            return False
            
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        return False
    
    finally:
        print("\n🔧 Cleaning up...")
        browser.close()

if __name__ == "__main__":
    success = run_dependency_analysis()
    sys.exit(0 if success else 1)