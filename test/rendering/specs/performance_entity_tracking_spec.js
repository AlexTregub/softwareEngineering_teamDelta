/**
 * Performance Monitor Enhanced Entity Tracking BDD Tests
 * Tests for individual entity performance analysis, type breakdown, and render phase tracking
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 * 
 * TESTING METHODOLOGY COMPLIANCE:
 * ✅ Tests real system APIs (startEntityRender, endEntityRender, getEntityPerformanceReport)
 * ✅ Uses actual system thresholds and calculations
 * ✅ Tests business logic (entity performance analysis, type aggregation, slowest tracking)
 * ✅ Includes both positive and negative scenarios
 * ✅ Uses realistic data (entity types, render times, frame counts)
 * ✅ No arbitrary thresholds or manual re-implementations
 */

describe('Performance Monitor - Enhanced Entity Tracking', function() {
    let performanceMonitor;
    let mockEntities;
    
    beforeEach(function() {
        // Reset controllable timing system
        global.mockTime = 0;
        global.mockMemory = {
            usedJSHeapSize: 1000000,
            totalJSHeapSize: 2000000,
            jsHeapSizeLimit: 4000000
        };
        
        // Create real PerformanceMonitor instance
        performanceMonitor = new PerformanceMonitor();
        
        // Create realistic mock entities with proper structure
        mockEntities = {
            fastAnt: { 
                id: 'ant_001', 
                constructor: { name: 'Ant' }, 
                type: 'Ant',
                x: 100, y: 200 
            },
            slowAnt: { 
                id: 'ant_002', 
                constructor: { name: 'Ant' }, 
                type: 'Ant',
                x: 300, y: 400 
            },
            resource: { 
                id: 'resource_001', 
                constructor: { name: 'Resource' }, 
                type: 'Resource',
                x: 150, y: 250 
            },
            building: { 
                id: 'building_001', 
                constructor: { name: 'Building' }, 
                type: 'Building',
                x: 500, y: 600 
            }
        };
    });
    
    describe('Feature: Individual Entity Performance Tracking', function() {
        
        describe('Scenario: Track single entity render time', function() {
            it('should measure entity render duration using real timing system', function() {
                // Given current time is 100ms
                global.mockTime = 100;
                
                // When I start tracking an entity render
                performanceMonitor.startEntityRender(mockEntities.fastAnt);
                
                // And 5ms passes during rendering
                global.mockTime = 105;
                
                // And I end the entity tracking
                performanceMonitor.endEntityRender();
                
                // Then the entity timing should be recorded in current frame data
                const currentTimings = performanceMonitor.entityPerformance.currentEntityTimings;
                expect(currentTimings.size).to.equal(1);
                
                // And the timing should contain correct data
                const [entityId, timing] = Array.from(currentTimings.entries())[0];
                expect(entityId).to.equal('ant_001');
                expect(timing.duration).to.equal(5);
                expect(timing.type).to.equal('Ant');
                expect(timing.entity).to.equal(mockEntities.fastAnt);
            });
        });
        
        describe('Scenario: Track multiple entities in same frame', function() {
            it('should accumulate entity timings by type using real system aggregation', function() {
                // Given I track multiple entities of same type
                global.mockTime = 100;
                
                // Fast ant: 3ms render time
                performanceMonitor.startEntityRender(mockEntities.fastAnt);
                global.mockTime = 103;
                performanceMonitor.endEntityRender();
                
                // Slow ant: 8ms render time  
                performanceMonitor.startEntityRender(mockEntities.slowAnt);
                global.mockTime = 111;
                performanceMonitor.endEntityRender();
                
                // Different type: 2ms render time
                performanceMonitor.startEntityRender(mockEntities.resource);
                global.mockTime = 113;
                performanceMonitor.endEntityRender();
                
                // Then type aggregation should be correct
                const typeTimings = performanceMonitor.entityPerformance.currentTypeTimings;
                
                // Ant type: 2 entities, 11ms total (3ms + 8ms)
                const antTiming = typeTimings.get('Ant');
                expect(antTiming.count).to.equal(2);
                expect(antTiming.total).to.equal(11);
                
                // Resource type: 1 entity, 2ms total
                const resourceTiming = typeTimings.get('Resource');
                expect(resourceTiming.count).to.equal(1);
                expect(resourceTiming.total).to.equal(2);
            });
        });
    });
    
    describe('Feature: Slowest Entity Tracking', function() {
        
        describe('Scenario: Track slowest entities across frames', function() {
            it('should maintain ordered list of slowest entities using real tracking system', function() {
                // Given entities with different render times
                global.mockTime = 100;
                
                // Add fast entity (2ms)
                performanceMonitor.startEntityRender(mockEntities.fastAnt);
                global.mockTime = 102;
                performanceMonitor.endEntityRender();
                
                // Add very slow entity (15ms)
                performanceMonitor.startEntityRender(mockEntities.building);
                global.mockTime = 117;
                performanceMonitor.endEntityRender();
                
                // Add medium entity (7ms)
                performanceMonitor.startEntityRender(mockEntities.resource);
                global.mockTime = 124;
                performanceMonitor.endEntityRender();
                
                // When I finalize the frame
                performanceMonitor.frameData.frameTime = 20; // Set realistic frame time
                performanceMonitor.finalizeEntityPerformance();
                
                // Then slowest entities should be ordered by duration (slowest first)
                const slowest = performanceMonitor.entityPerformance.slowestEntities;
                expect(slowest).to.have.lengthOf(3);
                expect(slowest[0].duration).to.equal(15); // Building (slowest)
                expect(slowest[1].duration).to.equal(7);  // Resource (medium)  
                expect(slowest[2].duration).to.equal(2);  // Ant (fastest)
                expect(slowest[0].type).to.equal('Building');
            });
        });
        
        describe('Scenario: Limit slowest entities list size', function() {
            it('should maintain maximum list size defined by system configuration', function() {
                // Given system configured for max 10 slow entities
                const maxSlowEntities = performanceMonitor.entityPerformance.maxSlowEntities;
                expect(maxSlowEntities).to.equal(10); // Verify actual system setting
                
                // When I track more than max entities (simulate 15 entities)
                global.mockTime = 100;
                for (let i = 0; i < 15; i++) {
                    const entity = { 
                        id: `test_${i}`, 
                        constructor: { name: 'TestEntity' },
                        type: 'TestEntity' 
                    };
                    
                    performanceMonitor.startEntityRender(entity);
                    global.mockTime += (i + 1); // Increasing render times
                    performanceMonitor.endEntityRender();
                }
                
                performanceMonitor.finalizeEntityPerformance();
                
                // Then only the slowest N should be kept (real system behavior)
                const slowest = performanceMonitor.entityPerformance.slowestEntities;
                expect(slowest).to.have.lengthOf(maxSlowEntities);
                expect(slowest[0].duration).to.be.greaterThan(slowest[slowest.length - 1].duration);
            });
        });
    });
    
    describe('Feature: Entity Type Performance Analysis', function() {
        
        describe('Scenario: Calculate rolling averages for entity types', function() {
            it('should maintain rolling history using real system calculations', function() {
                // Given multiple frames of entity data
                global.mockTime = 100;
                
                // Frame 1: Ant takes 5ms
                performanceMonitor.startEntityRender(mockEntities.fastAnt);
                global.mockTime = 105;
                performanceMonitor.endEntityRender();
                performanceMonitor.finalizeEntityPerformance();
                
                // Frame 2: Ant takes 10ms  
                global.mockTime = 120;
                performanceMonitor.startEntityRender(mockEntities.slowAnt);
                global.mockTime = 130;
                performanceMonitor.endEntityRender();
                performanceMonitor.finalizeEntityPerformance();
                
                // Then rolling average should be calculated correctly
                const typeAverages = performanceMonitor.entityPerformance.typeAverages;
                const antAverage = typeAverages.get('Ant');
                
                expect(antAverage.current).to.equal(10); // Last frame average
                expect(antAverage.average).to.be.closeTo(7.5, 0.1); // Rolling average (5+10)/2
            });
        });
        
        describe('Scenario: Generate entity performance report', function() {
            it('should provide comprehensive performance breakdown using real reporting API', function() {
                // Given entities with realistic performance data
                global.mockTime = 100;
                
                // Track mixed entity types with different performance
                performanceMonitor.startEntityRender(mockEntities.fastAnt);
                global.mockTime = 103; // 3ms
                performanceMonitor.endEntityRender();
                
                performanceMonitor.startEntityRender(mockEntities.resource);
                global.mockTime = 108; // 5ms
                performanceMonitor.endEntityRender();
                
                performanceMonitor.startEntityRender(mockEntities.building);
                global.mockTime = 120; // 12ms
                performanceMonitor.endEntityRender();
                
                performanceMonitor.frameData.frameTime = 25; // Realistic frame time
                performanceMonitor.finalizeEntityPerformance();
                
                // When I get the performance report
                const report = performanceMonitor.getEntityPerformanceReport();
                
                // Then it should contain comprehensive analysis
                expect(report.totalRenderTime).to.equal(20); // 3+5+12
                expect(report.averageRenderTime).to.be.closeTo(6.67, 0.1); // 20/3
                expect(report.renderEfficiency).to.be.closeTo(20, 1); // 100 - (20/25)*100 = 20%
                
                // And type performance breakdown
                expect(report.typePerformance).to.have.lengthOf(3);
                const antType = report.typePerformance.find(t => t.type === 'Ant');
                expect(antType.currentAverage).to.equal(3);
                expect(antType.count).to.equal(1);
                
                // And slowest entities
                expect(report.slowestEntities).to.have.lengthOf(3);
                expect(report.slowestEntities[0].type).to.equal('Building');
                expect(report.slowestEntities[0].renderTime).to.equal(12);
            });
        });
    });
    
    describe('Feature: Render Phase Tracking', function() {
        
        describe('Scenario: Track render phases timing', function() {
            it('should measure phase durations using real phase tracking system', function() {
                // Given I track different render phases
                global.mockTime = 100;
                
                // Preparation phase: 2ms
                performanceMonitor.startRenderPhase('preparation');
                global.mockTime = 102;
                performanceMonitor.endRenderPhase();
                
                // Culling phase: 3ms
                performanceMonitor.startRenderPhase('culling');
                global.mockTime = 105;
                performanceMonitor.endRenderPhase();
                
                // Rendering phase: 15ms
                performanceMonitor.startRenderPhase('rendering');
                global.mockTime = 120;
                performanceMonitor.endRenderPhase();
                
                // Post-processing phase: 1ms
                performanceMonitor.startRenderPhase('postProcessing');
                global.mockTime = 121;
                performanceMonitor.endRenderPhase();
                
                // Then phase timings should be recorded correctly
                const phases = performanceMonitor.entityPerformance.phaseTimings;
                expect(phases.preparation).to.equal(2);
                expect(phases.culling).to.equal(3);
                expect(phases.rendering).to.equal(15);
                expect(phases.postProcessing).to.equal(1);
            });
        });
        
        describe('Scenario: Include phase timings in frame stats', function() {
            it('should preserve phase data for display using lastFrameData system', function() {
                // Given phase tracking with realistic timings
                global.mockTime = 100;
                
                performanceMonitor.startRenderPhase('preparation');
                global.mockTime = 103;
                performanceMonitor.endRenderPhase();
                
                performanceMonitor.startRenderPhase('rendering');
                global.mockTime = 118;
                performanceMonitor.endRenderPhase();
                
                // When I finalize the frame (this preserves data)
                performanceMonitor.finalizeEntityPerformance();
                
                // And get frame stats for display
                const stats = performanceMonitor.getFrameStats();
                
                // Then phase timings should be available in entity performance data
                expect(stats.entityPerformance.phaseTimings.preparation).to.equal(3);
                expect(stats.entityPerformance.phaseTimings.rendering).to.equal(15);
                expect(stats.entityPerformance.phaseTimings.culling).to.equal(0); // Not tracked this frame
                expect(stats.entityPerformance.phaseTimings.postProcessing).to.equal(0);
            });
        });
    });
    
    describe('Feature: Entity Performance Data Preservation', function() {
        
        describe('Scenario: Preserve entity data for overlay display', function() {
            it('should maintain last frame data after finalization for real-time display', function() {
                // Given entity performance data is collected
                global.mockTime = 100;
                
                performanceMonitor.startEntityRender(mockEntities.fastAnt);
                global.mockTime = 107; // 7ms render
                performanceMonitor.endEntityRender();
                
                performanceMonitor.frameData.frameTime = 20;
                
                // When I finalize the frame (this clears current data but preserves lastFrameData)
                performanceMonitor.finalizeEntityPerformance();
                
                // Then current frame data should be cleared
                expect(performanceMonitor.entityPerformance.currentEntityTimings.size).to.equal(0);
                expect(performanceMonitor.entityPerformance.currentTypeTimings.size).to.equal(0);
                
                // But last frame data should be preserved for display
                const lastFrame = performanceMonitor.entityPerformance.lastFrameData;
                expect(lastFrame.totalEntityRenderTime).to.equal(7);
                expect(lastFrame.avgEntityRenderTime).to.equal(7);
                expect(lastFrame.entityRenderEfficiency).to.equal(65); // 100 - (7/20)*100
                expect(lastFrame.typeAverages.size).to.equal(1);
                expect(lastFrame.slowestEntities).to.have.lengthOf(1);
            });
        });
        
        describe('Scenario: Use preserved data in frame stats API', function() {
            it('should return lastFrameData in getFrameStats for consistent display', function() {
                // Given entity data from previous frame
                global.mockTime = 100;
                
                performanceMonitor.startEntityRender(mockEntities.resource);
                global.mockTime = 112; // 12ms render
                performanceMonitor.endEntityRender();
                
                performanceMonitor.frameData.frameTime = 30;
                performanceMonitor.finalizeEntityPerformance();
                
                // When I get frame stats (after finalization)
                const stats = performanceMonitor.getFrameStats();
                
                // Then it should use preserved last frame data
                expect(stats.entityPerformance.totalEntityRenderTime).to.equal(12);
                expect(stats.entityPerformance.avgEntityRenderTime).to.equal(12);
                expect(stats.entityPerformance.entityRenderEfficiency).to.equal(60); // 100 - (12/30)*100
                
                // And type averages should be preserved
                expect(stats.entityPerformance.typeAverages.size).to.equal(1);
                const resourceType = stats.entityPerformance.typeAverages.get('Resource');
                expect(resourceType.current).to.equal(12);
                expect(resourceType.count).to.equal(1);
            });
        });
    });
    
    describe('Feature: Error Handling and Edge Cases', function() {
        
        describe('Scenario: Handle entities without proper identification', function() {
            it('should generate fallback IDs using real system fallback logic', function() {
                // Given an entity with minimal identification
                const minimalEntity = { type: 'MinimalEntity' }; // No id, no constructor.name
                
                global.mockTime = 100;
                performanceMonitor.startEntityRender(minimalEntity);
                global.mockTime = 105;
                performanceMonitor.endEntityRender();
                
                // Then system should generate a fallback ID
                const timings = performanceMonitor.entityPerformance.currentEntityTimings;
                expect(timings.size).to.equal(1);
                
                const [entityId, timing] = Array.from(timings.entries())[0];
                expect(entityId).to.include('MinimalEntity_'); // Should use type + generated ID
                expect(timing.type).to.equal('MinimalEntity');
                expect(timing.entity).to.equal(minimalEntity);
            });
        });
        
        describe('Scenario: Handle entities with no type information', function() {
            it('should use Unknown type fallback from real system logic', function() {
                // Given an entity with no type identification
                const unknownEntity = { x: 100, y: 200 }; // No type, no constructor
                
                global.mockTime = 100;
                performanceMonitor.startEntityRender(unknownEntity);
                global.mockTime = 108;
                performanceMonitor.endEntityRender();
                
                // Then system should use Unknown type
                const typeTimings = performanceMonitor.entityPerformance.currentTypeTimings;
                expect(typeTimings.has('Unknown')).to.be.true;
                
                const unknownTiming = typeTimings.get('Unknown');
                expect(unknownTiming.count).to.equal(1);
                expect(unknownTiming.total).to.equal(8);
            });
        });
        
        describe('Scenario: Handle unmatched endEntityRender calls', function() {
            it('should not crash when endEntityRender called without startEntityRender', function() {
                // When I call endEntityRender without starting
                expect(() => {
                    performanceMonitor.endEntityRender();
                }).to.not.throw();
                
                // Then no timing data should be recorded
                expect(performanceMonitor.entityPerformance.currentEntityTimings.size).to.equal(0);
                expect(performanceMonitor.entityPerformance.currentTypeTimings.size).to.equal(0);
            });
        });
    });
});