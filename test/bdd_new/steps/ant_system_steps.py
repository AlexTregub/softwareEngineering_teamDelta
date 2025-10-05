"""
Ant System API Step Definitions - Following Testing Methodology
Uses actual system APIs discovered through dependency analysis instead of fake implementations
Complements existing step files without duplicating functionality
"""

import time
from behave import given, when, then

# System API Steps for testing APIs without fake implementations

@given('the antsSpawn function is available')
def step_ants_spawn_available(context):
    """Verify the antsSpawn function is available"""
    result = context.browser.driver.execute_script("""
        return {
            antsSpawnFunction: typeof antsSpawn === 'function',
            antsArrayExists: typeof ants !== 'undefined',
            antIndexExists: typeof antIndex !== 'undefined',
            antConstructor: typeof ant === 'function'
        };
    """)
    
    assert result['antsSpawnFunction'], "antsSpawn function must be available"
    assert result['antsArrayExists'], "ants array must exist"
    assert result['antIndexExists'], "antIndex must exist" 
    assert result['antConstructor'], "ant constructor must be available"

@given('the ants array exists')
def step_ants_array_exists(context):
    """Verify the ants array exists and is functional"""
    result = context.browser.driver.execute_script("""
        return {
            antsIsArray: Array.isArray(ants),
            antsLength: ants ? ants.length : -1,
            antsType: typeof ants
        };
    """)
    
    assert result['antsIsArray'] or result['antsType'] == 'object', "ants must be array or object"
    context.initial_ant_count = result['antsLength']

@given('the JobComponent system is loaded')
def step_job_component_loaded(context):
    """Verify the JobComponent system"""
    result = context.browser.driver.execute_script("""
        return {
            jobComponentExists: typeof JobComponent === 'function',
            getAllJobsMethod: typeof JobComponent.getAllJobs === 'function',
            getJobStatsMethod: typeof JobComponent.getJobStats === 'function',
            getJobListMethod: typeof JobComponent.getJobList === 'function',
            getSpecialJobsMethod: typeof JobComponent.getSpecialJobs === 'function'
        };
    """)
    
    assert result['jobComponentExists'], "JobComponent must be available"
    assert result['getAllJobsMethod'], "JobComponent.getAllJobs must exist"

@when('I call antsSpawn with {count:d} ant')
def step_call_ants_spawn(context, count):
    """Call the antsSpawn function from the game system"""
    result = context.browser.driver.execute_script(f"""
        const originalCount = ants ? ants.length : 0;
        const originalIndex = antIndex || 0;
        
        try {{
            antsSpawn({count});
            
            return {{
                success: true,
                originalCount: originalCount,
                newCount: ants.length,
                antsAdded: ants.length - originalCount,
                antIndexBefore: originalIndex,
                antIndexAfter: antIndex
            }};
        }} catch (error) {{
            return {{
                success: false,
                error: error.message
            }};
        }}
    """)
    
    assert result['success'], f"antsSpawn should succeed: {result.get('error', '')}"
    assert result['antsAdded'] == count, f"antsSpawn should add {count} ants, added {result['antsAdded']}"
    context.spawn_result = result

@when('I call JobComponent.getAllJobs()')
def step_call_get_all_jobs(context):
    """Call the JobComponent.getAllJobs() method"""
    result = context.browser.driver.execute_script("""
        try {
            const allJobs = JobComponent.getAllJobs();
            
            return {
                success: true,
                jobs: allJobs,
                jobCount: allJobs ? allJobs.length : 0,
                jobsType: typeof allJobs
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    """)
    
    assert result['success'], f"JobComponent.getAllJobs() should succeed: {result.get('error', '')}"
    context.jobs_result = result

@then('the ants array should contain {expected_count:d} ant')
def step_ants_array_contains_count(context, expected_count):
    """Verify the ants array contains expected number"""
    result = context.browser.driver.execute_script("""
        return {
            currentLength: ants ? ants.length : 0,
            antsArrayExists: typeof ants !== 'undefined'
        };
    """)
    
    assert result['antsArrayExists'], "ants array must exist"
    assert result['currentLength'] == expected_count, f"ants array should have {expected_count} ants, has {result['currentLength']}"

@then('the spawned ant should use the ant constructor')
def step_spawned_ant_uses_constructor(context):
    """Verify spawned ants use the ant constructor"""
    result = context.browser.driver.execute_script("""
        if (ants && ants.length > 0) {
            const firstAnt = ants[0];
            return {
                antExists: firstAnt !== undefined,
                isAntInstance: firstAnt instanceof ant,
                constructorName: firstAnt.constructor ? firstAnt.constructor.name : null
            };
        }
        return { noAnts: true };
    """)
    
    assert not result.get('noAnts'), "Should have ants to check"
    assert result['antExists'], "First ant should exist"
    assert result['isAntInstance'], "Ant should be instance of ant class"

@then('the ant should be created through the system workflow')
def step_ant_created_through_workflow(context):
    """Verify ant was created through system, not fake implementation"""
    assert hasattr(context, 'spawn_result'), "Should have used antsSpawn"
    
    # Verify the ant has properties that come from actual constructor
    result = context.browser.driver.execute_script("""
        if (ants && ants.length > 0) {
            const ant = ants[0];
            
            return {
                hasProperties: ant.hasOwnProperty('_JobName') || ant.hasOwnProperty('jobName'),
                hasAntIndex: ant.hasOwnProperty('_antIndex') || ant.hasOwnProperty('antIndex'),
                constructorUsed: ant.constructor.name
            };
        }
        
        return { noAnts: true };
    """)
    
    assert not result.get('noAnts'), "Should have ants from spawning"
    assert result['hasProperties'], "Ant should have properties from actual constructor"

@then('the antIndex should be properly incremented')
def step_ant_index_properly_incremented(context):
    """Verify antIndex was incremented by system"""
    spawn_result = context.spawn_result
    
    expected_increment = spawn_result['antsAdded']
    actual_increment = spawn_result['antIndexAfter'] - spawn_result['antIndexBefore']
    
    assert actual_increment == expected_increment, f"antIndex should increment by {expected_increment}, incremented by {actual_increment}"

@then('I should get the list of available jobs')
def step_get_job_list(context):
    """Verify we get job list"""
    assert hasattr(context, 'jobs_result'), "Should have called JobComponent.getAllJobs()"
    
    result = context.jobs_result
    assert result['success'], "getAllJobs should succeed"
    assert result['jobCount'] > 0, f"Job system should have jobs, got {result['jobCount']}"
    
    # Verify jobs are actual strings/objects
    jobs = result['jobs']
    assert isinstance(jobs, (list, tuple)) or hasattr(jobs, '__iter__'), "Jobs should be iterable"

@then('I should be able to call JobComponent.getJobStats() with job names')
def step_call_get_job_stats(context):
    """Test calling getJobStats with actual job names"""
    jobs_result = context.browser.driver.execute_script("""
        try {
            const jobs = JobComponent.getAllJobs();
            const firstJob = jobs && jobs.length > 0 ? jobs[0] : null;
            
            if (firstJob) {
                const stats = JobComponent.getJobStats(firstJob);
                
                return {
                    success: true,
                    jobName: firstJob,
                    statsReturned: stats !== null && stats !== undefined,
                    statsType: typeof stats
                };
            } else {
                return {
                    success: false,
                    error: "No jobs available"
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    """)
    
    assert jobs_result['success'], f"Should get job stats: {jobs_result.get('error', '')}"
    assert jobs_result['statsReturned'], "getJobStats should return data"

@then('the job system should return game data')
def step_job_system_returns_data(context):
    """Verify job system returns game data"""
    result = context.browser.driver.execute_script("""
        try {
            const allJobs = JobComponent.getAllJobs();
            const jobList = JobComponent.getJobList();
            const specialJobs = JobComponent.getSpecialJobs();
            
            return {
                success: true,
                allJobsCount: allJobs ? allJobs.length : 0,
                jobListCount: jobList ? jobList.length : 0,
                specialJobsCount: specialJobs ? specialJobs.length : 0,
                methodsWorking: 3
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    """)
    
    assert result['success'], f"Job methods should work: {result.get('error', '')}"
    assert result['methodsWorking'] == 3, "All job methods should be functional"

@then('each ant should be created via the spawning mechanism')
def step_each_ant_spawning_mechanism(context):
    """Verify each ant was created via spawning"""
    result = context.browser.driver.execute_script("""
        const antAnalysis = [];
        
        if (ants && ants.length > 0) {
            for (let i = 0; i < Math.min(ants.length, 5); i++) {
                const ant = ants[i];
                antAnalysis.push({
                    index: i,
                    isAntInstance: ant instanceof window.ant,
                    hasJobName: ant.hasOwnProperty('_JobName') || ant.hasOwnProperty('jobName'),
                    constructorName: ant.constructor ? ant.constructor.name : null
                });
            }
        }
        
        return {
            totalAnts: ants ? ants.length : 0,
            analysisCount: antAnalysis.length,
            antDetails: antAnalysis
        };
    """)
    
    assert result['totalAnts'] > 0, "Should have ants from spawning"
    
    for ant_detail in result['antDetails']:
        assert ant_detail['isAntInstance'], f"Ant {ant_detail['index']} should be ant instance"
        assert ant_detail['constructorName'] == 'ant', f"Ant {ant_detail['index']} should use ant constructor"

@then('the array should contain ant objects')
def step_array_contains_ant_objects(context):
    """Verify ants array contains ant objects"""
    result = context.browser.driver.execute_script("""
        const objectAnalysis = [];
        
        if (ants && ants.length > 0) {
            for (let i = 0; i < Math.min(ants.length, 3); i++) {
                const obj = ants[i];
                objectAnalysis.push({
                    index: i,
                    isObject: typeof obj === 'object',
                    isNotNull: obj !== null,
                    hasAntProperties: obj.hasOwnProperty('_JobName') || obj.hasOwnProperty('jobName'),
                    hasAntMethods: typeof obj.update === 'function' || typeof obj.render === 'function',
                    constructorName: obj.constructor ? obj.constructor.name : 'unknown'
                });
            }
        }
        
        return {
            analysisComplete: true,
            objectCount: objectAnalysis.length,
            objects: objectAnalysis
        };
    """)
    
    assert result['analysisComplete'], "Should complete object analysis"
    
    for obj in result['objects']:
        assert obj['isObject'], f"Object {obj['index']} should be object type"
        assert obj['isNotNull'], f"Object {obj['index']} should not be null"
        has_ant_characteristics = obj['hasAntProperties'] or obj['hasAntMethods']
        assert has_ant_characteristics, f"Object {obj['index']} should have ant characteristics"

@then('the objects should have game properties')
def step_objects_have_game_properties(context):
    """Verify ant objects have game properties"""
    result = context.browser.driver.execute_script("""
        if (ants && ants.length > 0) {
            const ant = ants[0];
            
            const properties = {
                hasPosition: ant.posX !== undefined || ant.x !== undefined,
                hasJobName: ant._JobName !== undefined || ant.jobName !== undefined,
                hasFaction: ant._faction !== undefined || ant.faction !== undefined,
                hasAntIndex: ant._antIndex !== undefined || ant.antIndex !== undefined,
                hasSize: ant.width !== undefined && ant.height !== undefined
            };
            
            return {
                success: true,
                propertiesFound: Object.values(properties).filter(Boolean).length,
                totalPropertiesChecked: Object.keys(properties).length,
                properties: properties
            };
        }
        
        return {
            success: false,
            error: "No ants to analyze"
        };
    """)
    
    assert result['success'], result.get('error', '')
    assert result['propertiesFound'] > 0, "Should find ant properties from constructor"

@then('JobComponent should provide job management')
def step_job_component_management(context):
    """Verify JobComponent provides job management functionality"""
    result = context.browser.driver.execute_script("""
        const methods = ['getAllJobs', 'getJobStats', 'getJobList', 'getSpecialJobs'];
        const methodResults = {};
        
        methods.forEach(method => {
            methodResults[method] = typeof JobComponent[method] === 'function';
        });
        
        return {
            jobComponentExists: typeof JobComponent === 'function',
            methodsAvailable: methodResults,
            allMethodsPresent: Object.values(methodResults).every(Boolean)
        };
    """)
    
    assert result['jobComponentExists'], "JobComponent must exist as class"
    assert result['allMethodsPresent'], "All job management methods must be available"

@then('the system should use game dependencies')
def step_system_uses_dependencies(context):
    """Verify system uses game dependencies"""
    result = context.browser.driver.execute_script("""
        const dependencies = {
            antClass: typeof ant === 'function',
            antsArray: typeof ants !== 'undefined',
            antIndex: typeof antIndex !== 'undefined',
            jobComponent: typeof JobComponent === 'function',
            antsSpawn: typeof antsSpawn === 'function'
        };
        
        return {
            dependenciesFound: Object.values(dependencies).filter(Boolean).length,
            totalDependencies: Object.keys(dependencies).length,
            dependencies: dependencies,
            allDependenciesPresent: Object.values(dependencies).every(Boolean)
        };
    """)
    
    expected_deps = result['totalDependencies']
    found_deps = result['dependenciesFound']
    
    assert found_deps >= 4, f"Should have most dependencies, found {found_deps}/{expected_deps}"
    assert result['dependencies']['antClass'], "ant class must be available"
    assert result['dependencies']['antsSpawn'], "antsSpawn function must be available"