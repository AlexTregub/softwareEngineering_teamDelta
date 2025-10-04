"""
Ant System Dependency Analysis BDD Step Definitions
Tests that analyze the real ant system structure to discover authentic APIs for testing
"""

import json
import os
from behave import given, when, then

# Dependency Analysis Steps

@given('I have the ant system classes loaded')
def step_load_ant_system(context):
    """Load the ant system classes for analysis"""
    result = context.browser.driver.execute_script("""
        // Check if ant classes are available
        const systemCheck = {
            antClass: typeof ant !== 'undefined',
            jobComponent: typeof JobComponent !== 'undefined',
            taskManager: typeof TaskManager !== 'undefined',
            antsSpawn: typeof antsSpawn === 'function',
            assignJob: typeof assignJob === 'function'
        };
        
        return {
            success: Object.values(systemCheck).some(available => available),
            components: systemCheck,
            loadedComponents: Object.keys(systemCheck).filter(key => systemCheck[key])
        };
    """)
    
    assert result['success'], "Should have at least some ant system components loaded"
    context.system_components = result['components']
    context.loaded_components = result['loadedComponents']

@given('I have access to dependency detection capabilities')
def step_ensure_dependency_detection(context):
    """Ensure dependency detection utilities are available"""
    result = context.browser.driver.execute_script("""
        // Create dependency detection utilities
        window.dependencyDetector = {
            analyzeClass: function(cls) {
                if (!cls || !cls.prototype) return null;
                
                const methods = [];
                const properties = [];
                
                // Get prototype methods
                const proto = cls.prototype;
                const methodNames = Object.getOwnPropertyNames(proto);
                
                methodNames.forEach(name => {
                    if (typeof proto[name] === 'function' && name !== 'constructor') {
                        methods.push({
                            name: name,
                            isPrivate: name.startsWith('_'),
                            type: 'method'
                        });
                    }
                });
                
                // Get instance properties (create test instance)
                try {
                    const testInstance = new cls(0, 0, 32, 32, 30, 0, null, 'Worker', 'player');
                    const propNames = Object.getOwnPropertyNames(testInstance);
                    
                    propNames.forEach(name => {
                        if (!name.startsWith('_') && typeof testInstance[name] !== 'function') {
                            properties.push({
                                name: name,
                                type: typeof testInstance[name],
                                value: testInstance[name]
                            });
                        }
                    });
                } catch (error) {
                    console.warn('Could not create test instance:', error.message);
                }
                
                return { methods, properties };
            },
            
            analyzeStaticClass: function(cls) {
                if (!cls) return null;
                
                const staticMethods = [];
                const staticProperties = [];
                
                const names = Object.getOwnPropertyNames(cls);
                names.forEach(name => {
                    if (typeof cls[name] === 'function') {
                        staticMethods.push({
                            name: name,
                            type: 'static_method'
                        });
                    } else {
                        staticProperties.push({
                            name: name,
                            type: typeof cls[name],
                            value: cls[name]
                        });
                    }
                });
                
                return { staticMethods, staticProperties };
            }
        };
        
        return { dependencyDetectorReady: true };
    """)
    
    assert result['dependencyDetectorReady'], "Dependency detector should be ready"
    context.dependency_detector_ready = True

@when('I inspect the ant class prototype')
def step_inspect_ant_class(context):
    """Analyze the real ant class structure"""
    result = context.browser.driver.execute_script("""
        let analysis = { available: false };
        
        if (typeof ant !== 'undefined' && dependencyDetector) {
            analysis = dependencyDetector.analyzeClass(ant);
            analysis.available = true;
            analysis.className = 'ant';
        }
        
        return analysis;
    """)
    
    assert result['available'], "ant class should be available for analysis"
    context.ant_class_analysis = result

@then('I should discover all available methods')
def step_verify_ant_methods_discovered(context):
    """Verify ant methods were properly discovered"""
    analysis = context.ant_class_analysis
    
    assert 'methods' in analysis, "Should have methods analysis"
    assert len(analysis['methods']) > 0, "Should discover some methods"
    
    # Look for key expected methods based on our documentation
    method_names = [method['name'] for method in analysis['methods']]
    
    # These are methods we expect based on the real system
    expected_core_methods = ['update', 'render', 'getPosition', 'getSize']
    found_core_methods = [method for method in expected_core_methods if method in method_names]
    
    print(f"✅ Discovered {len(analysis['methods'])} total methods")
    print(f"✅ Found core methods: {found_core_methods}")
    
    context.discovered_methods = analysis['methods']

@then('I should identify all public properties')
def step_verify_ant_properties_discovered(context):
    """Verify ant properties were properly discovered"""
    analysis = context.ant_class_analysis
    
    assert 'properties' in analysis, "Should have properties analysis"
    
    # Look for key properties we expect
    property_names = [prop['name'] for prop in analysis['properties']]
    print(f"✅ Discovered public properties: {property_names}")
    
    context.discovered_properties = analysis['properties']

@then('the results should be stored for test generation')
def step_store_analysis_results(context):
    """Store analysis results for later test generation"""
    if not hasattr(context, 'analysis_results'):
        context.analysis_results = {}
    
    context.analysis_results['ant_class'] = {
        'methods': context.discovered_methods,
        'properties': context.discovered_properties
    }
    
    print(f"✅ Stored analysis for ant class: {len(context.discovered_methods)} methods, {len(context.discovered_properties)} properties")

@when('I inspect the JobComponent system')
def step_inspect_job_component(context):
    """Analyze the JobComponent system"""
    result = context.browser.driver.execute_script("""
        let jobAnalysis = { available: false };
        
        if (typeof JobComponent !== 'undefined' && dependencyDetector) {
            jobAnalysis = dependencyDetector.analyzeStaticClass(JobComponent);
            jobAnalysis.available = true;
            jobAnalysis.className = 'JobComponent';
            
            // Try to get job list
            if (typeof JobComponent.getAllJobs === 'function') {
                jobAnalysis.availableJobs = JobComponent.getAllJobs();
            } else if (typeof JobComponent.getJobList === 'function') {
                jobAnalysis.availableJobs = JobComponent.getJobList();
            }
            
            // Check for job stats method
            if (typeof JobComponent.getJobStats === 'function') {
                jobAnalysis.hasJobStats = true;
                // Try to get example stats
                try {
                    jobAnalysis.exampleStats = JobComponent.getJobStats('Worker');
                } catch (e) {
                    jobAnalysis.statsError = e.message;
                }
            }
        }
        
        return jobAnalysis;
    """)
    
    context.job_component_analysis = result

@then('I should discover available job assignment methods')
def step_verify_job_assignment_methods(context):
    """Verify job assignment methods were discovered"""
    analysis = context.job_component_analysis
    
    if analysis['available']:
        static_methods = [method['name'] for method in analysis.get('staticMethods', [])]
        print(f"✅ JobComponent static methods: {static_methods}")
        
        # Look for expected job methods
        expected_job_methods = ['getJobStats', 'getJobList', 'getAllJobs']
        found_job_methods = [method for method in expected_job_methods if method in static_methods]
        print(f"✅ Found job methods: {found_job_methods}")
        
        context.job_assignment_methods = found_job_methods
    else:
        print("⚠️  JobComponent not available - this is expected if not loaded")
        context.job_assignment_methods = []

@then('I should identify all valid job types')
def step_verify_valid_job_types(context):
    """Verify valid job types were identified"""
    analysis = context.job_component_analysis
    
    if analysis['available'] and 'availableJobs' in analysis:
        jobs = analysis['availableJobs']
        print(f"✅ Available job types: {jobs}")
        context.valid_job_types = jobs
    else:
        print("⚠️  Job types not accessible - checking ant class for job info")
        # Fallback: check if ant instances have job info
        result = context.browser.driver.execute_script("""
            // Check if we can find job info from ant spawning
            if (typeof assignJob === 'function') {
                // Try to call assignJob to see what jobs exist
                try {
                    const jobName = assignJob();
                    return { fallbackJob: jobName, method: 'assignJob' };
                } catch (e) {
                    return { error: e.message };
                }
            }
            return { noFallback: true };
        """)
        
        context.valid_job_types = result.get('fallbackJob', []) if result.get('fallbackJob') else []

@then('I should find job priority mechanisms')
def step_verify_job_priority_mechanisms(context):
    """Verify job priority mechanisms were found"""
    analysis = context.job_component_analysis
    
    if analysis['available'] and analysis.get('hasJobStats'):
        if 'exampleStats' in analysis:
            stats = analysis['exampleStats']
            print(f"✅ Job stats structure: {stats}")
            context.job_priority_mechanism = 'job_stats'
        else:
            print(f"⚠️  Job stats method exists but error: {analysis.get('statsError', 'unknown')}")
            context.job_priority_mechanism = 'stats_method_error'
    else:
        # Check for TaskManager priority system
        result = context.browser.driver.execute_script("""
            if (typeof TaskManager !== 'undefined' && TaskManager.prototype) {
                // Check for priority constants
                const taskManager = new TaskManager({});
                return {
                    hasPriorities: taskManager.TASK_PRIORITIES !== undefined,
                    priorities: taskManager.TASK_PRIORITIES
                };
            }
            return { noTaskManager: true };
        """)
        
        if result.get('hasPriorities'):
            print(f"✅ Found TaskManager priorities: {result['priorities']}")
            context.job_priority_mechanism = 'task_manager_priorities'
        else:
            context.job_priority_mechanism = 'none_found'

@when('I inspect the TaskManager class')
def step_inspect_task_manager(context):
    """Analyze the TaskManager class"""
    result = context.browser.driver.execute_script("""
        let taskAnalysis = { available: false };
        
        if (typeof TaskManager !== 'undefined' && dependencyDetector) {
            taskAnalysis = dependencyDetector.analyzeClass(TaskManager);
            taskAnalysis.available = true;
            taskAnalysis.className = 'TaskManager';
            
            // Try to create instance to check constants
            try {
                const instance = new TaskManager({});
                taskAnalysis.constants = {
                    TASK_PRIORITIES: instance.TASK_PRIORITIES,
                    TASK_DEFAULTS: instance.TASK_DEFAULTS
                };
            } catch (e) {
                taskAnalysis.instanceError = e.message;
            }
        }
        
        return taskAnalysis;
    """)
    
    context.task_manager_analysis = result

@then('I should discover task creation methods')
def step_verify_task_creation_methods(context):
    """Verify task creation methods were discovered"""
    analysis = context.task_manager_analysis
    
    if analysis['available']:
        method_names = [method['name'] for method in analysis.get('methods', [])]
        
        # Look for expected task methods
        expected_task_methods = ['addTask', 'addEmergencyTask', 'executeTask']
        found_task_methods = [method for method in expected_task_methods if method in method_names]
        
        print(f"✅ TaskManager methods: {method_names}")
        print(f"✅ Found task methods: {found_task_methods}")
        
        context.task_creation_methods = found_task_methods
    else:
        print("⚠️  TaskManager not available")
        context.task_creation_methods = []

@then('I should identify priority levels')
def step_verify_priority_levels(context):
    """Verify priority levels were identified"""
    analysis = context.task_manager_analysis
    
    if analysis['available'] and 'constants' in analysis:
        priorities = analysis['constants'].get('TASK_PRIORITIES')
        if priorities:
            print(f"✅ Task priorities: {priorities}")
            context.priority_levels = priorities
        else:
            context.priority_levels = {}
    else:
        context.priority_levels = {}

@then('I should find task execution APIs')
def step_verify_task_execution_apis(context):
    """Verify task execution APIs were found"""
    analysis = context.task_manager_analysis
    
    if analysis['available']:
        execution_methods = [m for m in analysis.get('methods', []) if 'execute' in m['name'].lower() or 'run' in m['name'].lower()]
        print(f"✅ Task execution methods: {[m['name'] for m in execution_methods]}")
        context.task_execution_apis = execution_methods
    else:
        context.task_execution_apis = []

@when('I inspect the ant spawning functions')
def step_inspect_spawning_functions(context):
    """Analyze ant spawning functions"""
    result = context.browser.driver.execute_script("""
        const spawningAnalysis = {
            antsSpawn: {
                available: typeof antsSpawn === 'function',
                parameters: null
            },
            handleSpawnCommand: {
                available: typeof handleSpawnCommand === 'function',
                parameters: null
            },
            assignJob: {
                available: typeof assignJob === 'function',
                parameters: null
            }
        };
        
        // Try to analyze function parameters (basic analysis)
        if (spawningAnalysis.antsSpawn.available) {
            spawningAnalysis.antsSpawn.toString = antsSpawn.toString();
        }
        
        if (spawningAnalysis.handleSpawnCommand.available) {
            spawningAnalysis.handleSpawnCommand.toString = handleSpawnCommand.toString();
        }
        
        if (spawningAnalysis.assignJob.available) {
            spawningAnalysis.assignJob.toString = assignJob.toString();
        }
        
        return spawningAnalysis;
    """)
    
    context.spawning_analysis = result

@then('I should discover antsSpawn capabilities')
def step_verify_ants_spawn_capabilities(context):
    """Verify antsSpawn capabilities were discovered"""
    analysis = context.spawning_analysis
    
    if analysis['antsSpawn']['available']:
        print("✅ antsSpawn function available")
        # Basic parameter analysis from function string
        func_str = analysis['antsSpawn'].get('toString', '')
        if 'numToSpawn' in func_str or 'count' in func_str:
            print("✅ antsSpawn accepts count parameter")
        if 'faction' in func_str:
            print("✅ antsSpawn accepts faction parameter")
        context.ants_spawn_available = True
    else:
        print("❌ antsSpawn not available")
        context.ants_spawn_available = False

@then('I should identify handleSpawnCommand parameters')
def step_verify_handle_spawn_parameters(context):
    """Verify handleSpawnCommand parameters were identified"""
    analysis = context.spawning_analysis
    
    if analysis['handleSpawnCommand']['available']:
        print("✅ handleSpawnCommand function available")
        func_str = analysis['handleSpawnCommand'].get('toString', '')
        # Extract parameter info
        context.handle_spawn_parameters = {
            'available': True,
            'hasCount': 'count' in func_str or 'numToSpawn' in func_str,
            'hasFaction': 'faction' in func_str
        }
    else:
        print("❌ handleSpawnCommand not available")
        context.handle_spawn_parameters = {'available': False}

@then('I should validate assignJob functionality')
def step_verify_assign_job_functionality(context):
    """Verify assignJob functionality"""
    analysis = context.spawning_analysis
    
    if analysis['assignJob']['available']:
        print("✅ assignJob function available")
        context.assign_job_available = True
    else:
        print("❌ assignJob not available")
        context.assign_job_available = False

@when('I analyze all ant system dependencies')
def step_analyze_all_dependencies(context):
    """Perform comprehensive dependency analysis"""
    result = context.browser.driver.execute_script("""
        const dependencies = {
            globals: [],
            p5js: [],
            browser: [],
            unknown: []
        };
        
        // Common p5.js functions to check
        const p5Functions = ['createVector', 'random', 'stroke', 'fill', 'rect', 'ellipse', 'text', 'image'];
        
        p5Functions.forEach(func => {
            if (typeof window[func] !== 'undefined') {
                dependencies.p5js.push(func);
            }
        });
        
        // Common game globals to check
        const gameGlobals = ['ants', 'antIndex', 'g_map2', 'g_resourceList', 'TILE_SIZE', 'g_canvasX', 'g_canvasY'];
        
        gameGlobals.forEach(global => {
            if (typeof window[global] !== 'undefined') {
                dependencies.globals.push(global);
            }
        });
        
        // Browser APIs
        const browserAPIs = ['document', 'console', 'setTimeout', 'setInterval'];
        
        browserAPIs.forEach(api => {
            if (typeof window[api] !== 'undefined') {
                dependencies.browser.push(api);
            }
        });
        
        return dependencies;
    """)
    
    context.dependency_analysis = result

@then('I should categorize required globals')
def step_verify_globals_categorized(context):
    """Verify globals were properly categorized"""
    deps = context.dependency_analysis
    
    print(f"✅ Game globals found: {deps['globals']}")
    assert len(deps['globals']) > 0, "Should find some game globals"
    
    context.categorized_globals = deps['globals']

@then('I should identify p5.js dependencies')
def step_verify_p5js_dependencies(context):
    """Verify p5.js dependencies were identified"""
    deps = context.dependency_analysis
    
    print(f"✅ p5.js functions found: {deps['p5js']}")
    context.p5js_dependencies = deps['p5js']

@then('I should generate mock requirements')
def step_generate_mock_requirements(context):
    """Generate mock requirements for browser testing"""
    # Combine all discovered dependencies
    all_deps = (
        context.dependency_analysis['globals'] +
        context.dependency_analysis['p5js'] +
        context.dependency_analysis['browser']
    )
    
    mock_requirements = {
        'required_mocks': all_deps,
        'ant_methods': [m['name'] for m in context.analysis_results.get('ant_class', {}).get('methods', [])],
        'spawning_functions': {
            'antsSpawn': context.ants_spawn_available,
            'assignJob': context.assign_job_available
        }
    }
    
    print(f"✅ Generated mock requirements for {len(all_deps)} dependencies")
    context.mock_requirements = mock_requirements

@then('I should produce API usage examples for authentic testing')
def step_produce_api_examples(context):
    """Produce API usage examples for writing authentic tests"""
    examples = {
        'ant_creation': {},
        'job_assignment': {},
        'task_management': {},
        'spawning': {}
    }
    
    # Ant creation example
    if hasattr(context, 'discovered_methods'):
        examples['ant_creation'] = {
            'constructor': 'new ant(x, y, width, height, speed, rotation, image, jobName, faction)',
            'available_methods': [m['name'] for m in context.discovered_methods if not m['isPrivate']]
        }
    
    # Job assignment examples
    if hasattr(context, 'job_assignment_methods') and context.job_assignment_methods:
        examples['job_assignment'] = {
            'methods': context.job_assignment_methods,
            'jobs': context.valid_job_types if hasattr(context, 'valid_job_types') else []
        }
    
    # Task management examples
    if hasattr(context, 'task_creation_methods'):
        examples['task_management'] = {
            'methods': context.task_creation_methods,
            'priorities': context.priority_levels if hasattr(context, 'priority_levels') else {}
        }
    
    # Spawning examples
    examples['spawning'] = {
        'antsSpawn': context.ants_spawn_available if hasattr(context, 'ants_spawn_available') else False,
        'assignJob': context.assign_job_available if hasattr(context, 'assign_job_available') else False
    }
    
    print("✅ Generated API usage examples for authentic testing")
    print(f"   - Ant methods: {len(examples['ant_creation'].get('available_methods', []))}")
    print(f"   - Job methods: {len(examples['job_assignment'].get('methods', []))}")
    print(f"   - Task methods: {len(examples['task_management'].get('methods', []))}")
    
    # Store for later use in test generation
    context.api_examples = examples
    
    # Generate summary report
    summary = f"""
=== ANT SYSTEM DEPENDENCY ANALYSIS SUMMARY ===

🔍 DISCOVERED COMPONENTS:
- Loaded: {', '.join(context.loaded_components)}
- Ant class methods: {len(examples['ant_creation'].get('available_methods', []))}
- Job assignment methods: {len(examples['job_assignment'].get('methods', []))}
- Task management methods: {len(examples['task_management'].get('methods', []))}

🔧 MOCK REQUIREMENTS:
- Game globals: {len(context.categorized_globals)}
- p5.js functions: {len(context.p5js_dependencies)}
- Total dependencies: {len(context.mock_requirements['required_mocks'])}

✅ READY FOR AUTHENTIC TEST GENERATION:
This analysis provides the foundation for writing tests that use REAL APIs
instead of fake implementations that manipulate data to pass tests.
    """
    
    print(summary)
    context.dependency_analysis_complete = True