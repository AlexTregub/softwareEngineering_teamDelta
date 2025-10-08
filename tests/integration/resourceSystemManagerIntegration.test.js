/**
 * @fileoverview Test script for ResourceSystemManager integration
 * Tests the new unified resource management system and compatibility
 */

// Test the new ResourceSystemManager integration
function testResourceSystemManager() {
    if (typeof globalThis.logNormal === 'function') {
        globalThis.logNormal('Starting ResourceSystemManager integration test...');
    } else {
        console.log('Starting ResourceSystemManager integration test...');
    }
    
    let testsPassed = 0;
    let testsFailed = 0;
    
    // Test 1: Check if g_resourceManager exists and has correct type
    try {
        if (typeof g_resourceManager !== 'undefined' && g_resourceManager) {
            if (g_resourceManager.constructor.name === 'ResourceSystemManager') {
                console.log('✅ Test 1 PASSED: g_resourceManager is ResourceSystemManager');
                testsPassed++;
            } else {
                console.log('❌ Test 1 FAILED: g_resourceManager is not ResourceSystemManager:', g_resourceManager.constructor.name);
                testsFailed++;
            }
        } else {
            console.log('❌ Test 1 FAILED: g_resourceManager not available');
            testsFailed++;
        }
    } catch (e) {
        console.log('❌ Test 1 ERROR:', e.message);
        testsFailed++;
    }
    
    // Test 2: Check backward compatibility - g_resourceList should still work
    try {
        if (typeof g_resourceList !== 'undefined' && g_resourceList && typeof g_resourceList.getResourceList === 'function') {
            console.log('✅ Test 2 PASSED: g_resourceList backward compatibility maintained');
            testsPassed++;
        } else {
            console.log('❌ Test 2 FAILED: g_resourceList compatibility broken');
            testsFailed++;
        }
    } catch (e) {
        console.log('❌ Test 2 ERROR:', e.message);
        testsFailed++;
    }
    
    // Test 3: Check selectResource method exists and works
    try {
        if (g_resourceManager && typeof g_resourceManager.selectResource === 'function') {
            g_resourceManager.selectResource('food');
            if (g_resourceManager.getSelectedResourceType() === 'food') {
                console.log('✅ Test 3 PASSED: selectResource method works');
                testsPassed++;
            } else {
                console.log('❌ Test 3 FAILED: selectResource method doesn\'t set selection properly');
                testsFailed++;
            }
        } else {
            console.log('❌ Test 3 FAILED: selectResource method not available');
            testsFailed++;
        }
    } catch (e) {
        console.log('❌ Test 3 ERROR:', e.message);
        testsFailed++;
    }
    
    // Test 4: Check spawning functionality
    try {
        if (g_resourceManager && typeof g_resourceManager.forceSpawn === 'function') {
            const initialCount = g_resourceManager.getResourceList().length;
            g_resourceManager.forceSpawn();
            const afterCount = g_resourceManager.getResourceList().length;
            
            if (afterCount > initialCount) {
                console.log('✅ Test 4 PASSED: forceSpawn method works');
                testsPassed++;
            } else {
                console.log('❌ Test 4 FAILED: forceSpawn didn\'t increase resource count');
                testsFailed++;
            }
        } else {
            console.log('❌ Test 4 FAILED: forceSpawn method not available');
            testsFailed++;
        }
    } catch (e) {
        console.log('❌ Test 4 ERROR:', e.message);
        testsFailed++;
    }
    
    // Test 5: Check system status
    try {
        if (g_resourceManager && typeof g_resourceManager.getSystemStatus === 'function') {
            const status = g_resourceManager.getSystemStatus();
            if (status && typeof status.totalResources === 'number') {
                console.log('✅ Test 5 PASSED: getSystemStatus works');
                testsPassed++;
            } else {
                console.log('❌ Test 5 FAILED: getSystemStatus doesn\'t return proper status');
                testsFailed++;
            }
        } else {
            console.log('❌ Test 5 FAILED: getSystemStatus method not available');
            testsFailed++;
        }
    } catch (e) {
        console.log('❌ Test 5 ERROR:', e.message);
        testsFailed++;
    }
    
    // Summary
    const totalTests = testsPassed + testsFailed;
    console.log(`\n📊 ResourceSystemManager Test Summary:`);
    console.log(`   Tests Passed: ${testsPassed}/${totalTests}`);
    console.log(`   Tests Failed: ${testsFailed}/${totalTests}`);
    console.log(`   Success Rate: ${(testsPassed/totalTests*100).toFixed(1)}%`);
    
    if (testsFailed === 0) {
        console.log('🎉 All ResourceSystemManager integration tests passed!');
    } else {
        console.log('⚠️  Some ResourceSystemManager tests failed - check implementation');
    }
    
    return {
        passed: testsPassed,
        failed: testsFailed,
        total: totalTests
    };
}

// Auto-run test if we have access to the verbosity system
if (typeof globalThis !== 'undefined') {
    // Wait a bit for systems to initialize, then run test
    setTimeout(() => {
        if (typeof g_resourceManager !== 'undefined' && typeof g_resourceList !== 'undefined') {
            testResourceSystemManager();
        } else {
            console.log('⚠️  ResourceSystemManager test skipped - resource systems not initialized');
        }
    }, 1000);
}

// Export test function for manual testing
if (typeof globalThis !== 'undefined') {
    globalThis.testResourceSystemManager = testResourceSystemManager;
}