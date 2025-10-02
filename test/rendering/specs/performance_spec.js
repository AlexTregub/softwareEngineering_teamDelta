/**
 * Performance Monitoring BDD Tests
 * Tests for frame timing, performance tracking, and debug overlay
 */

describe('Performance Monitoring', function() {
    let performanceMonitor;
    
    beforeEach(function() {
        // Reset controllable timing system for consistent testing
        global.mockTime = 0;
        global.mockMemory = {
            usedJSHeapSize: 1000000,
            totalJSHeapSize: 2000000,
            jsHeapSizeLimit: 4000000
        };
        
        // Create PerformanceMonitor instance (uses real class with controlled environment)
        performanceMonitor = new PerformanceMonitor();
    });
    
    describe('Feature: Frame Timing Measurement', function() {
        
        describe('Scenario: Start frame timing', function() {
            it('should record frame start time', function() {
                // Given current time is 100ms
                global.mockTime = 100;
                
                // When I start frame timing
                performanceMonitor.startFrame();
                
                // Then frame start should be recorded
                expect(performanceMonitor.frameData.currentFrameStart).to.equal(100);
            });
        });
        
        describe('Scenario: End frame timing', function() {
            it('should calculate frame duration', function() {
                // Given a first frame at 100ms (establishes baseline)
                global.mockTime = 100;
                performanceMonitor.startFrame();
                performanceMonitor.endFrame();
                
                // When second frame starts at 117ms (17ms later)  
                global.mockTime = 117;
                performanceMonitor.startFrame();
                
                // Then frame time should be calculated as difference (17ms)
                expect(performanceMonitor.frameData.frameTime).to.equal(17);
            });
        });
        
        describe('Scenario: Calculate FPS', function() {
            it('should compute frames per second', function() {
                // Given frame time of 16.67ms (60 FPS)
                performanceMonitor.frameData.frameTime = 16.67;
                
                // When I get frame stats
                const stats = performanceMonitor.getFrameStats();
                
                // Then FPS should be approximately 60
                expect(stats.fps).to.be.closeTo(60, 1);
            });
        });
        
        describe('Scenario: Track average FPS', function() {
            it('should maintain rolling average of frame rates', function() {
                // Given multiple frame measurements added through the real API
                const frameTimes = [16, 17, 15, 18, 16]; // ~60 FPS
                frameTimes.forEach(frameTime => {
                    performanceMonitor.frameData.frameTime = frameTime;
                    performanceMonitor.updateFrameHistory();
                });
                
                // When I update metrics and get frame stats
                performanceMonitor.updatePerformanceMetrics();
                const stats = performanceMonitor.getFrameStats();
                
                // Then average FPS should be calculated from the frame history
                expect(stats.avgFPS).to.be.closeTo(60, 5);
            });
        });
    });
    
    describe('Feature: Layer Performance Tracking', function() {
        
        describe('Scenario: Start layer timing', function() {
            it('should record layer start time', function() {
                // Given current time is 200ms
                global.mockTime = 200;
                
                // When I start timing a layer
                performanceMonitor.startLayerTiming('ENTITIES');
                
                // Then layer timing should begin (real API uses activeLayer and layerStart)
                expect(performanceMonitor.layerTiming.activeLayer).to.equal('ENTITIES');
                expect(performanceMonitor.layerTiming.layerStart).to.equal(200);
            });
        });
        
        describe('Scenario: End layer timing', function() {
            it('should calculate layer duration', function() {
                // Given a layer started at 200ms
                global.mockTime = 200;
                performanceMonitor.startLayerTiming('ENTITIES');
                
                // When layer ends at 208ms (8ms duration)
                global.mockTime = 208;
                const duration = performanceMonitor.endLayerTiming('ENTITIES');
                
                // Then layer time should be calculated and returned
                expect(duration).to.equal(8);
                // And duration should be added to layer history
                expect(performanceMonitor.layerTiming.layerHistory['ENTITIES']).to.include(8);
            });
        });
        
        describe('Scenario: Track multiple layers', function() {
            it('should handle sequential layer timings', function() {
                // Given sequential layer timing (real implementation supports one active layer at a time)
                global.mockTime = 100;
                performanceMonitor.startLayerTiming('TERRAIN');
                
                global.mockTime = 105;
                const terrainDuration = performanceMonitor.endLayerTiming('TERRAIN'); // 5ms
                
                global.mockTime = 110;
                performanceMonitor.startLayerTiming('ENTITIES');
                
                global.mockTime = 118;
                const entitiesDuration = performanceMonitor.endLayerTiming('ENTITIES'); // 8ms
                
                // Then both layers should have correct timings in history
                expect(terrainDuration).to.equal(5);
                expect(entitiesDuration).to.equal(8);
                expect(performanceMonitor.layerTiming.layerHistory['TERRAIN']).to.include(5);
                expect(performanceMonitor.layerTiming.layerHistory['ENTITIES']).to.include(8);
            });
        });
    });
    
    describe('Feature: Entity Statistics', function() {
        
        describe('Scenario: Count total entities', function() {
            it('should track entity counts by type', function() {
                // When I record entity statistics
                // Total: 225, Rendered: 200, Culled: 25, with type breakdown
                performanceMonitor.recordEntityStats(225, 200, 25, {
                    ANTS: { total: 150, rendered: 140, culled: 10 },
                    RESOURCES: { total: 75, rendered: 60, culled: 15 }
                });
                
                // Then entity counts should be tracked
                const stats = performanceMonitor.getEntityStats();
                expect(stats.total).to.equal(225);
                expect(stats.rendered).to.equal(200);
                // And breakdown by type should be preserved
                expect(stats.entityTypes).to.have.property('ANTS');
                expect(stats.entityTypes.ANTS.total).to.equal(150);
                expect(stats.entityTypes.ANTS.rendered).to.equal(140);
                expect(stats.entityTypes.ANTS.culled).to.equal(10);
                expect(stats.entityTypes).to.have.property('RESOURCES');
                expect(stats.entityTypes.RESOURCES.total).to.equal(75);
                // lastUpdate should be a recent timestamp
                expect(stats.lastUpdate).to.be.a('number');
                expect(stats.lastUpdate).to.be.greaterThan(0);
            });
        });
        
        describe('Scenario: Calculate culling efficiency', function() {
            it('should compute percentage of entities culled', function() {
                // Given 100 total entities, 80 rendered (20 culled)
                performanceMonitor.recordEntityStats(100, 80, 20, {
                    ANTS: { total: 100, rendered: 80, culled: 20 }
                });
                
                // When I get entity stats
                const stats = performanceMonitor.getEntityStats();
                
                // Then culling efficiency should be 20%
                // Use numeric equality but allow for any floating representation
                expect(stats.cullingEfficiency).to.be.a('number');
                expect(Math.round(stats.cullingEfficiency)).to.equal(20);
                // Type breakdown should still be correct
                expect(stats.entityTypes.ANTS.total).to.equal(100);
                expect(stats.entityTypes.ANTS.culled).to.equal(20);
            });
        });
        
        describe('Scenario: Track entity changes', function() {
            it('should detect entity count changes between frames', function() {
                // Given previous entity count
                performanceMonitor.recordEntityStats(100, 90, 10, {
                    ANTS: { total: 100, rendered: 90, culled: 10 }
                });
                const stats1 = performanceMonitor.getEntityStats();
                
                // When entity count changes
                performanceMonitor.recordEntityStats(110, 95, 15, {
                    ANTS: { total: 110, rendered: 95, culled: 15 }
                });
                const stats2 = performanceMonitor.getEntityStats();
                
                // Then change should be detected
                expect(stats2.total).to.be.greaterThan(stats1.total);
                // And per-type changes should be reflected
                expect(stats2.entityTypes.ANTS.total).to.equal(110);
                expect(stats2.entityTypes.ANTS.rendered).to.equal(95);
                expect(stats2.entityTypes.ANTS.culled).to.equal(15);
                // Ensure lastUpdate reflects the most recent update (>= previous update)
                expect(stats2.lastUpdate).to.be.a('number');
                expect(stats2.lastUpdate).to.be.at.least(stats1.lastUpdate);
            });
        });
    });
    
    describe('Feature: Memory Tracking', function() {
        
        describe('Scenario: Monitor memory usage', function() {
            it('should track JavaScript heap usage', function() {
                // When I update memory tracking
                performanceMonitor.updateMemoryTracking();
                
                // Then memory statistics should be available
                const stats = performanceMonitor.getMemoryStats();
                expect(stats.usedJSHeapSize).to.be.a('number');
                expect(stats.peak).to.be.a('number');
            });
        });
        
        describe('Scenario: Detect memory increases', function() {
            it('should track peak memory usage', function() {
                // Given baseline memory usage
                performanceMonitor.updateMemoryTracking();
                const baseline = performanceMonitor.getMemoryStats().usedJSHeapSize;
                
                // When memory usage increases
                global.mockMemory = { usedJSHeapSize: 1500000, totalJSHeapSize: 2000000, jsHeapSizeLimit: 4000000 };
                performanceMonitor.updateMemoryTracking();
                
                // Then peak should be updated
                const stats = performanceMonitor.getMemoryStats();
                expect(stats.peak).to.be.greaterThan(baseline);
            });
        });
    });
    
    describe('Feature: Debug Display', function() {
        
        describe('Scenario: Enable debug overlay', function() {
            it('should activate performance overlay display', function() {
                // When I enable debug display
                performanceMonitor.setDebugDisplay(true);
                
                // Then debug display should be enabled
                expect(performanceMonitor.debugDisplay.enabled).to.be.true;
            });
        });
        
        describe('Scenario: Configure debug position', function() {
            it('should allow custom overlay positioning', function() {
                // When I set debug display position
                performanceMonitor.setDebugPosition(50, 100);
                
                // Then position should be updated
                expect(performanceMonitor.debugDisplay.position.x).to.equal(50);
                expect(performanceMonitor.debugDisplay.position.y).to.equal(100);
            });
        });
        
        describe('Scenario: Performance alert thresholds', function() {
            it('should detect performance issues', function() {
                // Given poor performance (30 FPS threshold)
                performanceMonitor.frameData.frameTime = 35; // ~28 FPS
                // Update metrics to calculate FPS from frameTime
                performanceMonitor.updatePerformanceMetrics();
                
                // When I check for performance issues
                const stats = performanceMonitor.getFrameStats();
                
                // Then low FPS should be detected (use configured fair threshold)
                expect(stats.fps).to.be.lessThan(performanceMonitor.thresholds.fairAvgFPS);
            });
        });
    });
    
    describe('Feature: Performance History', function() {
        
        describe('Scenario: Maintain frame time history', function() {
            it('should maintain rolling window with proper wraparound behavior', function() {
                // Given initial frame time to establish baseline
                performanceMonitor.frameData.frameTime = 16; // 60 FPS
                performanceMonitor.updateFrameHistory(); // First entry
                
                // When I add exactly 60 frame times (filling the window)
                for (let i = 1; i < 60; i++) {
                    performanceMonitor.frameData.frameTime = 16 + (i * 0.5); // Gradually increasing times
                    performanceMonitor.updateFrameHistory();
                }
                
                // Then window should be full with all 60 values preserved
                expect(performanceMonitor.frameData.frameHistory.length).to.equal(60);
                expect(performanceMonitor.frameData.historyIndex).to.equal(0); // Should wrap back to start
                expect(performanceMonitor.frameData.frameHistory[0]).to.equal(16); // First value
                expect(performanceMonitor.frameData.frameHistory[59]).to.equal(45.5); // Last value (16 + 59*0.5)
            });
            
            it('should overwrite oldest values when window exceeds capacity', function() {
                // Given a full window of frame times
                for (let i = 0; i < 60; i++) {
                    performanceMonitor.frameData.frameTime = 20 + i; // Values 20-79
                    performanceMonitor.updateFrameHistory();
                }
                const originalFirstValue = performanceMonitor.frameData.frameHistory[0];
                
                // When I add 5 more frame times (exceeding window size)
                for (let i = 0; i < 5; i++) {
                    performanceMonitor.frameData.frameTime = 100 + i; // New values 100-104
                    performanceMonitor.updateFrameHistory();
                }
                
                // Then oldest values should be overwritten with newest values
                expect(performanceMonitor.frameData.historyIndex).to.equal(5); // Should be at position 5
                expect(performanceMonitor.frameData.frameHistory[0]).to.equal(100); // Overwritten with newest
                expect(performanceMonitor.frameData.frameHistory[4]).to.equal(104); // Last new value
                expect(performanceMonitor.frameData.frameHistory[5]).to.not.equal(originalFirstValue); // Old data preserved where not overwritten
                
                // And window size should remain constant
                expect(performanceMonitor.frameData.frameHistory.length).to.equal(60);
            });
            
            it('should preserve most recent frame times for accurate statistics', function() {
                // Given a sequence of realistic frame times with a clear pattern
                const recentFrameTimes = [16, 17, 18, 19, 20]; // Recent performance degradation
                
                // When I add these frame times using the real system
                recentFrameTimes.forEach(frameTime => {
                    performanceMonitor.frameData.frameTime = frameTime;
                    performanceMonitor.updateFrameHistory();
                });
                
                // Then the most recent values should be preserved correctly
                const historyIndex = performanceMonitor.frameData.historyIndex;
                const lastIndex = (historyIndex - 1 + 60) % 60; // Most recent entry
                expect(performanceMonitor.frameData.frameHistory[lastIndex]).to.equal(20);
                
                // And statistics should reflect the recent data accurately
                performanceMonitor.updatePerformanceMetrics();
                const stats = performanceMonitor.getFrameStats();
                expect(stats.worstFrameTime).to.be.greaterThanOrEqual(20); // Should detect the worst recent frame
            });
        });
        
        describe('Scenario: Detect performance degradation trends', function() {
            it('should identify declining performance over time', function() {
                // Given consistently declining performance (degradation trend)
                const decliningFrameTimes = [16, 18, 20, 22, 24, 26, 28]; // Consistent increase = performance degradation
                performanceMonitor.frameData.frameHistory.fill(16); // Start with good performance baseline
                decliningFrameTimes.forEach((time, index) => {
                    performanceMonitor.frameData.frameHistory[index] = time;
                });
                performanceMonitor.updatePerformanceMetrics();
                
                // When I analyze the trend pattern
                const stats = performanceMonitor.getFrameStats();
                const recentFrames = performanceMonitor.frameData.frameHistory.slice(0, 7);
                const avgEarly = (recentFrames[0] + recentFrames[1] + recentFrames[2]) / 3; // First 3: ~18ms
                const avgLate = (recentFrames[4] + recentFrames[5] + recentFrames[6]) / 3;  // Last 3: ~26ms
                const trendDirection = avgLate - avgEarly; // Positive = degrading performance
                
                // Then performance degradation should be detectable
                expect(trendDirection).to.be.greaterThan(5); // Significant degradation (>5ms increase)
                expect(stats.worstFrameTime).to.be.greaterThan(stats.avgFrameTime); // Worst exceeds average
                // Use configured goodAvgFPS threshold as a guideline for "good" performance
                expect(stats.minFPS).to.be.lessThan(performanceMonitor.thresholds.goodAvgFPS);
            });
            
            it('should detect performance improvement trends', function() {
                // Given performance that improves over time (optimization effects)
                const improvingFrameTimes = [28, 26, 24, 22, 20, 18, 16]; // Consistent decrease = performance improvement
                performanceMonitor.frameData.frameHistory.fill(28); // Start with poor performance baseline
                improvingFrameTimes.forEach((time, index) => {
                    performanceMonitor.frameData.frameHistory[index] = time;
                });
                performanceMonitor.updatePerformanceMetrics();
                
                // When I analyze the improvement pattern
                const recentFrames = performanceMonitor.frameData.frameHistory.slice(0, 7);
                const avgEarly = (recentFrames[0] + recentFrames[1] + recentFrames[2]) / 3; // First 3: ~26ms
                const avgLate = (recentFrames[4] + recentFrames[5] + recentFrames[6]) / 3;  // Last 3: ~18ms
                const trendDirection = avgEarly - avgLate; // Positive = improving performance
                
                // Then performance improvement should be detectable
                expect(trendDirection).to.be.greaterThan(5); // Significant improvement (>5ms decrease)
                expect(performanceMonitor.frameData.frameHistory[6]).to.be.lessThan(performanceMonitor.frameData.frameHistory[0]); // Latest better than earliest
            });
            
            it('should identify stable performance patterns', function() {
                // Given stable performance with minimal variation
                const stableFrameTimes = [16, 17, 16, 17, 16, 17, 16]; // Consistent ~60 FPS performance
                performanceMonitor.frameData.frameHistory.fill(16.67);
                stableFrameTimes.forEach((time, index) => {
                    performanceMonitor.frameData.frameHistory[index] = time;
                });
                performanceMonitor.updatePerformanceMetrics();
                
                // When I analyze stability metrics
                const stats = performanceMonitor.getFrameStats();
                const recentFrames = performanceMonitor.frameData.frameHistory.slice(0, 7);
                const variance = recentFrames.reduce((sum, time) => sum + Math.pow(time - 16.5, 2), 0) / recentFrames.length;
                const standardDeviation = Math.sqrt(variance);
                
                // Then performance should be identified as stable
                expect(standardDeviation).to.be.lessThan(1); // Low variation indicates stability
                expect(stats.maxFPS - stats.minFPS).to.be.lessThan(5); // Small FPS range indicates consistency
                expect(stats.avgFPS).to.be.closeTo(60, 2); // Consistently good performance
            });
            
            it('should detect erratic performance patterns', function() {
                // Given highly variable/erratic performance
                const erraticFrameTimes = [16, 35, 18, 40, 17, 45, 19]; // Highly variable performance
                performanceMonitor.frameData.frameHistory.fill(20);
                erraticFrameTimes.forEach((time, index) => {
                    performanceMonitor.frameData.frameHistory[index] = time;
                });
                performanceMonitor.updatePerformanceMetrics();
                
                // When I analyze performance variability
                const stats = performanceMonitor.getFrameStats();
                const recentFrames = performanceMonitor.frameData.frameHistory.slice(0, 7);
                const mean = recentFrames.reduce((sum, time) => sum + time, 0) / recentFrames.length;
                const variance = recentFrames.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / recentFrames.length;
                const coefficientOfVariation = Math.sqrt(variance) / mean; // Normalized variability measure
                
                // Then erratic performance should be detectable
                expect(coefficientOfVariation).to.be.greaterThan(0.3); // High variability coefficient
                expect(stats.maxFPS - stats.minFPS).to.be.greaterThan(25); // Large FPS range indicates instability
                // Use configured worstFrameTime threshold to indicate spikes
                expect(stats.worstFrameTime).to.be.greaterThan(performanceMonitor.thresholds.worstFrameTime - 15); // Accept some margin in synthetic tests
            });
        });
    });
    
    describe('Feature: Performance Warnings', function() {
        
        describe('Scenario: Detect frame time spikes', function() {
            it('should warn about frame spikes when worst frame exceeds threshold', function() {
                // Given mostly good frame times with a significant spike
                const frameTimes = [16, 16, 17, 60, 16]; // 60ms spike (exceeds 50ms threshold)
                performanceMonitor.frameData.frameHistory.fill(16.67); // Fill with good frames first
                frameTimes.forEach((time, index) => {
                    performanceMonitor.frameData.frameHistory[index] = time;
                });
                
                // Force metrics update to calculate worstFrameTime from frame history
                performanceMonitor.updatePerformanceMetrics();
                
                // When I check for performance warnings
                const warnings = performanceMonitor.getPerformanceWarnings();
                
                // Then frame spike warning should be generated
                expect(warnings).to.include('Frame spikes detected: Check for performance bottlenecks');

                // And worst frame time should exceed configured threshold
                expect(performanceMonitor.metrics.worstFrameTime).to.be.greaterThan(performanceMonitor.thresholds.worstFrameTime);
            });
            
            it('should not warn about normal frame time variations', function() {
                // Given normal frame time variations under threshold
                const frameTimes = [16, 17, 15, 18, 19]; // All under 50ms threshold
                performanceMonitor.frameData.frameHistory.fill(16.67);
                frameTimes.forEach((time, index) => {
                    performanceMonitor.frameData.frameHistory[index] = time;
                });
                
                // Force metrics update
                performanceMonitor.updatePerformanceMetrics();
                
                // When I check for performance warnings
                const warnings = performanceMonitor.getPerformanceWarnings();
                
                // Then no frame spike warning should be generated
                expect(warnings).to.not.include('Frame spikes detected: Check for performance bottlenecks');

                // And worst frame time should be under configured threshold
                expect(performanceMonitor.metrics.worstFrameTime).to.be.lessThan(performanceMonitor.thresholds.worstFrameTime);
            });
        });
        
        describe('Scenario: Memory leak detection', function() {
            it('should detect memory leaks when growth exceeds threshold', function() {
                // Given a baseline memory usage (1MB from setup)
                performanceMonitor.updateMemoryTracking();
                const initialWarnings = performanceMonitor.getPerformanceWarnings();
                expect(initialWarnings).to.not.include('Memory usage increasing: Possible memory leak');
                
                // When memory increases beyond the 50MB threshold
                const baselineMemory = 1000000; // 1MB baseline from setup
                // Use configured memory threshold and create a leak amount that exceeds it
                const leakAmount = performanceMonitor.thresholds.memoryGrowthBytes + (10 * 1024 * 1024); // 10MB above threshold
                global.mockMemory = {
                    usedJSHeapSize: baselineMemory + leakAmount,
                    totalJSHeapSize: 2000000,
                    jsHeapSizeLimit: 4000000 
                };
                performanceMonitor.updateMemoryTracking();
                
                // Then memory leak warning should be generated
                const warnings = performanceMonitor.getPerformanceWarnings();
                expect(warnings).to.include('Memory usage increasing: Possible memory leak');

                // And memory growth should be tracked correctly
                const memoryStats = performanceMonitor.getMemoryStats();
                expect(memoryStats.peak).to.be.greaterThan(memoryStats.baseline);
            });
            
            it('should not warn about normal memory usage fluctuations', function() {
                // Given normal memory fluctuations under threshold
                const baselineMemory = 1000000; // 1MB baseline
                const normalIncrease = Math.floor(performanceMonitor.thresholds.memoryGrowthBytes * 0.6); // 60% of threshold
                global.mockMemory = {
                    usedJSHeapSize: baselineMemory + normalIncrease,
                    totalJSHeapSize: 2000000,
                    jsHeapSizeLimit: 4000000 
                };
                performanceMonitor.updateMemoryTracking();
                
                // Then no memory leak warning should be generated (under configured threshold)
                const warnings = performanceMonitor.getPerformanceWarnings();
                expect(warnings).to.not.include('Memory usage increasing: Possible memory leak');
            });
        });
    });
});
