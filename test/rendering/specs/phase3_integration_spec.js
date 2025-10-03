/**
 * Phase 3 Integration Tests - Complete System Validation
 * Tests Phase 3 components working together: UI, Effects, Performance Monitoring, User APIs
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 * 
 * TESTING METHODOLOGY COMPLIANCE:
 * ✅ Tests real system integration (UIController + PerformanceMonitor + EffectsRenderer + EntityDelegationBuilder)
 * ✅ Tests actual business workflows (debug system coordination, entity performance tracking, UI state management)
 * ✅ Uses realistic scenarios (game development debugging, performance optimization, user interaction)
 * ✅ Includes both positive and negative scenarios (system failures, missing components, edge cases)
 * ✅ Tests with actual classes working together, minimal mocks only where absolutely necessary
 * ✅ Validates real-world usage patterns and developer workflows
 * 
 * MOCKS USED AND WHY:
 * • mockP5: Simulates graphics rendering (necessary - graphics library dependency)
 * • mockGameState: Provides game context for UI rendering (necessary - external game system)
 * • mockKeyboard: Simulates user input for UI interaction (necessary - browser event system)
 * • mockTime: Controls timing for performance testing (necessary - deterministic timing)
 */

describe('Phase 3 Integration - Complete System Validation', function() {
    let uiController;
    let performanceMonitor;
    let effectsRenderer;
    let uiRenderer;
    let entityDelegationBuilder;
    
    let mockP5;
    let mockGameState;
    let mockKeyboard;
    let mockTime;
    let mockEntities;
    
    beforeEach(function() {
        // Mock p5.js for graphics operations (necessary - graphics library)
        mockP5 = {
            operations: [],
            width: 800,
            height: 600,
            mouseX: 0,
            mouseY: 0,
            // Drawing functions
            fill: function(...args) { this.operations.push({type: 'fill', args}); },
            stroke: function(...args) { this.operations.push({type: 'stroke', args}); },
            rect: function(...args) { this.operations.push({type: 'rect', args}); },
            ellipse: function(...args) { this.operations.push({type: 'ellipse', args}); },
            text: function(...args) { this.operations.push({type: 'text', args}); },
            textAlign: function(...args) { this.operations.push({type: 'textAlign', args}); },
            textSize: function(...args) { this.operations.push({type: 'textSize', args}); },
            push: function() { this.operations.push({type: 'push', args: []}); },
            pop: function() { this.operations.push({type: 'pop', args: []}); },
            noStroke: function() { this.operations.push({type: 'noStroke', args: []}); },
            translate: function(...args) { this.operations.push({type: 'translate', args}); },
            // Utility functions
            random: function(min, max) { 
                return max === undefined ? Math.random() * min : min + Math.random() * (max - min); 
            },
            textWidth: function(text) { return text.length * 8; },
            reset: function() { this.operations = []; }
        };
        Object.assign(global, mockP5);
        global.width = mockP5.width;
        global.height = mockP5.height;
        
        // Mock GameState (necessary - external game system)
        mockGameState = {
            currentState: 'PLAYING',
            stats: { wood: 200, food: 150, population: 18, maxPopulation: 25 },
            setState: function(state) { this.currentState = state; },
            startGame: function() { this.currentState = 'PLAYING'; return true; }
        };
        global.GameState = mockGameState;
        
        // Mock keyboard input (necessary - browser event system)
        mockKeyboard = {
            pressedKeys: new Set(),
            press: function(key) {
                this.pressedKeys.add(key);
                global.keyCode = this.getKeyCode(key);
                global.key = key;
            },
            release: function(key) {
                this.pressedKeys.delete(key);
            },
            getKeyCode: function(key) {
                const codes = {'Control': 17, 'Shift': 16, '1': 49, '2': 50, '3': 51, '`': 192};
                return codes[key] || key.charCodeAt(0);
            }
        };
        
        // Mock time system (necessary - deterministic timing for tests)
        mockTime = 0;
        global.performance = { now: () => mockTime };
        
        // Create realistic mock entities for testing
        mockEntities = {
            ants: [],
            resources: [],
            buildings: []
        };
        
        // Create ants with realistic properties
        for (let i = 0; i < 15; i++) {
            mockEntities.ants.push({
                id: `ant_${i}`,
                constructor: { name: 'Ant' },
                type: 'Ant',
                x: 100 + i * 50,
                y: 200 + Math.sin(i) * 30,
                state: i % 3 === 0 ? 'GATHERING' : 'MOVING',
                health: 90 + Math.random() * 10,
                render: function() { /* Mock render */ }
            });
        }
        
        // Create resources
        for (let i = 0; i < 8; i++) {
            mockEntities.resources.push({
                id: `resource_${i}`,
                constructor: { name: 'Resource' },
                type: 'Resource',
                x: 300 + i * 40,
                y: 350,
                resourceType: i % 2 === 0 ? 'wood' : 'food',
                render: function() { /* Mock render */ }
            });
        }
        
        // Mock existing debug systems
        global.toggleDevConsole = function() { global.devConsoleEnabled = !global.devConsoleEnabled; };
        global.devConsoleEnabled = false;
        global.getEntityDebugManager = function() {
            return {
                isEnabled: false,
                toggleEntityInspector: function() { this.isEnabled = !this.isEnabled; return this.isEnabled; }
            };
        };
        global.toggleCommandLine = function() { global.commandLineActive = !global.commandLineActive; };
        global.commandLineActive = false;
        
        // Initialize Phase 3 systems with real classes
        performanceMonitor = new PerformanceMonitor();
        global.g_performanceMonitor = performanceMonitor;
        
        effectsRenderer = new EffectsLayerRenderer();
        global.EffectsRenderer = effectsRenderer;
        
        uiRenderer = new UILayerRenderer();
        global.UIRenderer = uiRenderer;
        
        uiController = new UIController();
        
        // Set up mock console to track logs
        global.console = {
            logs: [],
            warns: [],
            log: function(...args) { this.logs.push(args.join(' ')); },
            warn: function(...args) { this.warns.push(args.join(' ')); }
        };
    });
    
    describe('Feature: Integrated Debug System Coordination', function() {
        
        describe('Scenario: Performance monitoring with UI coordination', function() {
            it('should coordinate performance monitoring display through UI and keyboard systems', function() {
                // Given performance monitor is tracking entity rendering
                mockTime = 1000;
                performanceMonitor.startFrame();
                
                // Simulate entity rendering with performance tracking
                mockEntities.ants.forEach(ant => {
                    performanceMonitor.startEntityRender(ant);
                    mockTime += 2; // 2ms per ant
                    performanceMonitor.endEntityRender();
                });
                
                performanceMonitor.frameData.frameTime = 35;
                performanceMonitor.finalizeEntityPerformance();
                
                // When I toggle performance overlay via UIController
                mockKeyboard.press('Control');
                mockKeyboard.press('Shift');
                global.keyCode = 49; // '1' key
                uiController.handleKeyPressed();
                
                // Then performance monitor should be enabled
                expect(performanceMonitor.debugDisplay.enabled).to.be.true;
                
                // And UI renderer should display performance data
                mockP5.reset();
                uiRenderer.renderDebugOverlay();
                
                const textOps = mockP5.operations.filter(op => op.type === 'text');
                
                // Should display entity performance data
                const entityPerformanceText = textOps.find(op => 
                    op.args[0].includes('Entity Render') && op.args[0].includes('30.00ms')
                );
                expect(entityPerformanceText).to.exist;
                
                // Should display entity type breakdown
                const antTypeText = textOps.find(op => 
                    op.args[0].includes('Ant:') && op.args[0].includes('15x')
                );
                expect(antTypeText).to.exist;
            });
        });
        
        describe('Scenario: Entity inspection with performance correlation', function() {
            it('should correlate entity selection with performance data and effects visualization', function() {
                // Given performance tracking is active for specific entities
                mockTime = 2000;
                const slowAnt = mockEntities.ants[0];
                const fastAnt = mockEntities.ants[1];
                
                // Track different render times
                performanceMonitor.startEntityRender(slowAnt);
                mockTime += 8; // Slow ant: 8ms
                performanceMonitor.endEntityRender();
                
                performanceMonitor.startEntityRender(fastAnt);
                mockTime += 2; // Fast ant: 2ms
                performanceMonitor.endEntityRender();
                
                performanceMonitor.frameData.frameTime = 20;
                performanceMonitor.finalizeEntityPerformance();
                
                // When I enable entity inspector
                mockKeyboard.press('Control');
                mockKeyboard.press('Shift');
                global.keyCode = 50; // '2' key
                uiController.handleKeyPressed();
                
                // And select the slow ant for inspection
                const entityDebugManager = getEntityDebugManager();
                entityDebugManager.selectedEntity = slowAnt;
                
                // Then UI should display both entity info and performance data
                uiRenderer.debugUI.entityInspector.enabled = true;
                mockP5.reset();
                uiRenderer.renderDebugOverlay();
                
                const textOps = mockP5.operations.filter(op => op.type === 'text');
                
                // Should display entity information
                const entityIdText = textOps.find(op => op.args[0].includes('ant_0'));
                expect(entityIdText).to.exist;
                
                // Should be able to correlate with performance data
                const performanceStats = performanceMonitor.getFrameStats();
                expect(performanceStats.entityPerformance.totalEntityRenderTime).to.equal(10); // 8 + 2
                
                // Should identify slowest entities
                expect(performanceStats.entityPerformance.slowestEntities[0].type).to.equal('Ant');
            });
        });
    });
    
    describe('Feature: Effects System Integration with Performance Monitoring', function() {
        
        describe('Scenario: Effects rendering with performance tracking', function() {
            it('should track effects rendering performance and coordinate with UI display', function() {
                // Given multiple visual effects are active
                mockTime = 3000;
                
                const effects = [
                    {
                        type: 'COMBAT_SPARKS',
                        position: { x: 200, y: 300 },
                        count: 20,
                        duration: 1500
                    },
                    {
                        type: 'HEALING_GLOW',
                        position: { x: 400, y: 250 },
                        intensity: 0.7,
                        duration: 2000
                    },
                    {
                        type: 'DUST_CLOUD',
                        position: { x: 150, y: 400 },
                        count: 15,
                        duration: 800
                    }
                ];
                
                effects.forEach(effect => effectsRenderer.addParticleEffect(effect));
                
                // When I render effects with performance monitoring
                performanceMonitor.startFrame();
                performanceMonitor.startRenderPhase('effects');
                
                mockP5.reset();
                effectsRenderer.render();
                
                performanceMonitor.endRenderPhase();
                performanceMonitor.frameData.frameTime = 18;
                performanceMonitor.finalizeEntityPerformance();
                
                // Then effects should be rendered
                expect(mockP5.operations.length).to.be.greaterThan(0);
                
                // And performance data should include effects timing
                const stats = performanceMonitor.getFrameStats();
                expect(stats.entityPerformance.phaseTimings.effects).to.be.greaterThan(0);
                
                // And UI can display both effects and performance
                uiRenderer.debugUI.performanceOverlay.enabled = true;
                mockP5.reset();
                uiRenderer.renderDebugOverlay();
                
                const textOps = mockP5.operations.filter(op => op.type === 'text');
                const effectsPhaseText = textOps.find(op => op.args[0].includes('effects:'));
                expect(effectsPhaseText).to.exist;
            });
        });
        
        describe('Scenario: Effect lifecycle coordination with UI feedback', function() {
            it('should coordinate effect expiration with UI state and performance cleanup', function() {
                // Given short-duration effects
                mockTime = 4000;
                
                const shortEffect = {
                    type: 'QUICK_FLASH',
                    duration: 100
                };
                
                const effectId = effectsRenderer.addVisualEffect(shortEffect);
                
                // Initially effect should exist
                let activeEffects = effectsRenderer.getActiveEffects();
                expect(activeEffects.visual).to.have.lengthOf(1);
                
                // When time advances past effect duration
                mockTime = 4150;
                effectsRenderer.update();
                
                // Then effect should be cleaned up
                activeEffects = effectsRenderer.getActiveEffects();
                expect(activeEffects.visual).to.have.lengthOf(0);
                
                // And UI should reflect updated effects count
                uiRenderer.debugUI.performanceOverlay.enabled = true;
                mockP5.reset();
                uiRenderer.renderDebugOverlay();
                
                // Performance overlay should show no active effects
                const textOps = mockP5.operations.filter(op => op.type === 'text');
                // UI should reflect the cleanup in effects statistics
                expect(textOps.some(op => op.args[0].includes('0 active'))).to.be.true;
            });
        });
    });
    
    describe('Feature: Entity Delegation API Integration', function() {
        
        describe('Scenario: Complete entity API with performance tracking', function() {
            it('should provide complete entity API that integrates with all Phase 3 systems', function() {
                // Given an entity class with complete delegation setup
                function TestEntity(x, y) {
                    this.x = x;
                    this.y = y;
                    this.id = `entity_${Math.random().toString(36).substr(2, 9)}`;
                    this.constructor = { name: 'TestEntity' };
                    this._renderController = {
                        highlightSelected: function() { return 'highlighted'; },
                        addEffect: function(effect) { return `effect_${effect.type}`; },
                        showDamageNumber: function(damage, color) { return `damage_${damage}`; },
                        render: function() { return 'rendered'; }
                    };
                }
                
                // Create complete delegation API
                const fullConfig = {
                    highlight: {
                        selected: 'highlightSelected'
                    },
                    effects: {
                        add: 'addEffect',
                        damageNumber: 'showDamageNumber'
                    },
                    rendering: {
                        render: 'render'
                    }
                };
                
                EntityDelegationBuilder.createNamespaceAPI(
                    TestEntity,
                    '_renderController',
                    fullConfig
                );
                
                // When I create entity and use the API
                const entity = new TestEntity(250, 350);
                
                // Then entity should have complete namespace API
                expect(entity.highlight.selected).to.be.a('function');
                expect(entity.effects.add).to.be.a('function');
                expect(entity.effects.damageNumber).to.be.a('function');
                expect(entity.rendering.render).to.be.a('function');
                
                // And API should work with performance tracking
                mockTime = 5000;
                performanceMonitor.startEntityRender(entity);
                
                const highlightResult = entity.highlight.selected();
                const effectResult = entity.effects.add({ type: 'GLOW' });
                const damageResult = entity.effects.damageNumber(25, [255, 0, 0]);
                
                mockTime += 3;
                performanceMonitor.endEntityRender();
                
                expect(highlightResult).to.equal('highlighted');
                expect(effectResult).to.equal('effect_GLOW');
                expect(damageResult).to.equal('damage_25');
                
                // And performance data should include this entity
                performanceMonitor.finalizeEntityPerformance();
                const stats = performanceMonitor.getFrameStats();
                expect(stats.entityPerformance.typeAverages.has('TestEntity')).to.be.true;
            });
        });
    });
    
    describe('Feature: Complete Workflow Integration', function() {
        
        describe('Scenario: Full debugging workflow', function() {
            it('should support complete developer debugging workflow using all Phase 3 systems', function() {
                // Scenario: Developer debugging performance issues
                
                // Step 1: Developer notices performance problem
                mockTime = 6000;
                performanceMonitor.startFrame();
                
                // Simulate heavy entity rendering load
                mockEntities.ants.forEach((ant, index) => {
                    performanceMonitor.startEntityRender(ant);
                    mockTime += (index % 3 === 0 ? 8 : 2); // Some ants are slow
                    performanceMonitor.endEntityRender();
                });
                
                performanceMonitor.frameData.frameTime = 45; // Poor performance
                performanceMonitor.finalizeEntityPerformance();
                
                // Step 2: Developer enables performance overlay
                mockKeyboard.press('Control');
                mockKeyboard.press('Shift');
                global.keyCode = 49;
                uiController.handleKeyPressed();
                
                expect(performanceMonitor.debugDisplay.enabled).to.be.true;
                
                // Step 3: Developer views performance data
                mockP5.reset();
                uiRenderer.renderDebugOverlay();
                
                const performanceTextOps = mockP5.operations.filter(op => 
                    op.type === 'text' && op.args[0].includes('Entity Render')
                );
                expect(performanceTextOps.length).to.be.greaterThan(0);
                
                // Step 4: Developer identifies slow entity types
                const stats = performanceMonitor.getFrameStats();
                expect(stats.entityPerformance.slowestEntities.length).to.be.greaterThan(0);
                expect(stats.entityPerformance.typeAverages.has('Ant')).to.be.true;
                
                // Step 5: Developer enables entity inspector to examine specific entities
                mockKeyboard.release('Control');
                mockKeyboard.release('Shift');
                mockKeyboard.press('Control');
                mockKeyboard.press('Shift');
                global.keyCode = 50;
                uiController.handleKeyPressed();
                
                const entityDebugManager = getEntityDebugManager();
                expect(entityDebugManager.isEnabled).to.be.true;
                
                // Step 6: Developer adds visual effect to highlight problematic entities
                const slowEntities = stats.entityPerformance.slowestEntities
                    .filter(e => e.duration > 5)
                    .slice(0, 3);
                
                slowEntities.forEach(entityInfo => {
                    effectsRenderer.addVisualEffect({
                        type: 'DEBUG_HIGHLIGHT',
                        target: { x: 200, y: 300 }, // Simulated entity position
                        color: [255, 0, 0, 180],
                        duration: 3000
                    });
                });
                
                const activeEffects = effectsRenderer.getActiveEffects();
                expect(activeEffects.visual.length).to.equal(3);
                
                // Step 7: Developer opens command line for detailed analysis
                global.keyCode = 192; // backtick
                uiController.handleKeyPressed();
                
                expect(global.commandLineActive).to.be.true;
            });
        });
        
        describe('Scenario: Real-time performance optimization workflow', function() {
            it('should support real-time performance optimization using integrated systems', function() {
                // Scenario: Performance-conscious development with live feedback
                
                // Initial high-performance state
                mockTime = 7000;
                performanceMonitor.startFrame();
                
                // Simulate light rendering load
                mockEntities.ants.slice(0, 5).forEach(ant => {
                    performanceMonitor.startEntityRender(ant);
                    mockTime += 1; // Fast rendering
                    performanceMonitor.endEntityRender();
                });
                
                performanceMonitor.frameData.frameTime = 12; // Good performance
                performanceMonitor.finalizeEntityPerformance();
                
                const initialStats = performanceMonitor.getFrameStats();
                expect(initialStats.frameTime).to.equal(12);
                
                // Developer adds more entities and monitors impact
                mockTime = 7100;
                performanceMonitor.startFrame();
                
                // Simulate increased load
                mockEntities.ants.forEach(ant => {
                    performanceMonitor.startEntityRender(ant);
                    mockTime += 2; // Moderate rendering time
                    performanceMonitor.endEntityRender();
                });
                
                // Add particle effects load
                effectsRenderer.addParticleEffect({
                    type: 'AMBIENT_DUST',
                    position: { x: 300, y: 300 },
                    count: 50,
                    duration: 5000
                });
                
                performanceMonitor.frameData.frameTime = 28; // Degraded performance
                performanceMonitor.finalizeEntityPerformance();
                
                const degradedStats = performanceMonitor.getFrameStats();
                expect(degradedStats.frameTime).to.be.greaterThan(initialStats.frameTime);
                
                // Performance overlay should show the degradation
                performanceMonitor.debugDisplay.enabled = true;
                mockP5.reset();
                uiRenderer.renderDebugOverlay();
                
                const textOps = mockP5.operations.filter(op => op.type === 'text');
                const frameTimeText = textOps.find(op => op.args[0].includes('28.00ms'));
                expect(frameTimeText).to.exist;
                
                // Effects system should automatically optimize if configured
                if (effectsRenderer.config.adaptiveQuality) {
                    effectsRenderer.reportPerformanceIssue('frame_time_high', { frameTime: 28 });
                    
                    const qualitySettings = effectsRenderer.getQualitySettings();
                    expect(qualitySettings.particleCount).to.be.lessThan(1.0);
                }
            });
        });
    });
    
    describe('Feature: System Resilience and Error Handling', function() {
        
        describe('Scenario: Graceful degradation when systems are unavailable', function() {
            it('should maintain functionality when individual Phase 3 systems fail', function() {
                // Simulate PerformanceMonitor failure
                global.g_performanceMonitor = null;
                
                // UIController should still work
                mockKeyboard.press('Control');
                mockKeyboard.press('Shift');
                global.keyCode = 49;
                
                expect(() => {
                    uiController.handleKeyPressed();
                }).to.not.throw();
                
                // UI Renderer should handle missing performance data
                uiRenderer.debugUI.performanceOverlay.enabled = true;
                
                expect(() => {
                    uiRenderer.renderDebugOverlay();
                }).to.not.throw();
                
                mockP5.reset();
                uiRenderer.renderDebugOverlay();
                
                const textOps = mockP5.operations.filter(op => op.type === 'text');
                const fallbackText = textOps.find(op => op.args[0].includes('unavailable'));
                expect(fallbackText).to.exist;
                
                // Effects system should continue working independently
                const effectId = effectsRenderer.addVisualEffect({
                    type: 'STANDALONE_EFFECT',
                    duration: 1000
                });
                
                expect(effectId).to.be.a('string');
                
                const activeEffects = effectsRenderer.getActiveEffects();
                expect(activeEffects.visual).to.have.lengthOf(1);
            });
        });
        
        describe('Scenario: System recovery and re-integration', function() {
            it('should re-integrate systems when they become available again', function() {
                // Start with missing systems
                global.g_performanceMonitor = null;
                global.EffectsRenderer = null;
                
                // Create new UIController
                const recoveredController = new UIController();
                
                // Systems should be detected as unavailable
                const logs = global.console.logs.join(' ');
                expect(logs).to.include('PerformanceMonitor not available');
                
                // Re-establish systems
                global.g_performanceMonitor = new PerformanceMonitor();
                global.EffectsRenderer = new EffectsLayerRenderer();
                
                // New controller should detect restored systems
                const reIntegratedController = new UIController();
                
                // And should work normally
                global.g_performanceMonitor.debugDisplay.enabled = false;
                
                mockKeyboard.press('Control');
                mockKeyboard.press('Shift');
                global.keyCode = 49;
                reIntegratedController.handleKeyPressed();
                
                expect(global.g_performanceMonitor.debugDisplay.enabled).to.be.true;
            });
        });
    });
});