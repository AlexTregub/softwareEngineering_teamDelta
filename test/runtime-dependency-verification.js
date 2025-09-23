// Runtime Dependency Verification Test
// This test verifies that scripts load in the correct order and dependencies are satisfied

console.log('🧪 Starting Runtime Dependency Verification Test');

// Wait for script loader to complete
window.addEventListener('scriptsLoaded', function(event) {
    console.log('📦 Scripts loaded, running dependency verification...');
    console.log(`Environment: ${event.detail.environment}`);
    console.log(`Load time: ${event.detail.loadTime}ms`);
    console.log(`Script count: ${event.detail.scriptCount}`);
    
    // Test critical dependencies
    const dependencyTests = [
        {
            name: 'p5 library',
            test: () => typeof p5 !== 'undefined',
            critical: true
        },
        {
            name: 'ant base class',
            test: () => typeof ant !== 'undefined',
            critical: true
        },
        {
            name: 'Species class extends ant',
            test: () => typeof Species !== 'undefined' && Species.prototype instanceof ant,
            critical: true
        },
        {
            name: 'Faction system',
            test: () => typeof Faction !== 'undefined' && typeof FactionRegistry !== 'undefined',
            critical: true
        },
        {
            name: 'sprite2d class',
            test: () => typeof sprite2d !== 'undefined',
            critical: false
        },
        {
            name: 'stats class',
            test: () => typeof stats !== 'undefined',
            critical: false
        },
        {
            name: 'Global faction registry',
            test: () => typeof globalFactionRegistry !== 'undefined',
            critical: true
        }
    ];
    
    let passedTests = 0;
    let criticalFailures = 0;
    
    console.log('\n🔍 Running dependency tests:');
    
    dependencyTests.forEach(({ name, test, critical }) => {
        try {
            const passed = test();
            if (passed) {
                console.log(`✅ ${name}: Available`);
                passedTests++;
            } else {
                console.warn(`⚠️ ${name}: Not available`);
                if (critical) criticalFailures++;
            }
        } catch (error) {
            console.error(`❌ ${name}: Error - ${error.message}`);
            if (critical) criticalFailures++;
        }
    });
    
    // Summary
    console.log(`\n📊 Dependency Test Results:`);
    console.log(`✅ Passed: ${passedTests}/${dependencyTests.length}`);
    console.log(`❌ Critical failures: ${criticalFailures}`);
    
    if (criticalFailures === 0) {
        console.log('🎉 All critical dependencies satisfied! Script loading order is correct.');
    } else {
        console.error('💥 Critical dependency failures detected! Script loading order may be incorrect.');
    }
    
    // Test inheritance hierarchy
    if (typeof ant !== 'undefined' && typeof Species !== 'undefined') {
        try {
            const testAnt = new ant(100, 100);
            const testSpecies = new Species(testAnt, 'Builder');
            
            console.log('\n🧬 Testing inheritance hierarchy:');
            console.log(`✅ Base ant instance created: ${testAnt.constructor.name}`);
            console.log(`✅ Species instance created: ${testSpecies.constructor.name}`);
            console.log(`✅ Species extends ant: ${testSpecies instanceof ant}`);
            console.log(`✅ Species has ant methods: ${typeof testSpecies.moveToLocation === 'function'}`);
        } catch (error) {
            console.error(`❌ Inheritance test failed: ${error.message}`);
        }
    }
    
    // Test faction system
    if (typeof Faction !== 'undefined' && typeof createFaction === 'function') {
        try {
            console.log('\n🏛️ Testing faction system:');
            const testFaction = createFaction('TestFaction', '#FF0000');
            console.log(`✅ Faction created: ${testFaction.name}`);
            console.log(`✅ Faction color: ${testFaction.color}`);
            console.log(`✅ Faction registry available: ${typeof getFactionRegistry === 'function'}`);
        } catch (error) {
            console.error(`❌ Faction test failed: ${error.message}`);
        }
    }
});

// Add verification method to script loader if available
if (typeof scriptLoader !== 'undefined' && scriptLoader.verifyDependencies) {
    window.addEventListener('scriptsLoaded', function() {
        setTimeout(() => {
            console.log('\n🔧 Running ScriptLoader dependency verification:');
            const issues = scriptLoader.verifyDependencies();
            
            if (issues.length === 0) {
                console.log('✅ ScriptLoader verification: All dependencies satisfied');
            } else {
                console.warn('⚠️ ScriptLoader verification found issues:');
                issues.forEach(issue => console.warn(`  - ${issue}`));
            }
        }, 200);
    });
}

console.log('⏳ Waiting for scripts to load...');