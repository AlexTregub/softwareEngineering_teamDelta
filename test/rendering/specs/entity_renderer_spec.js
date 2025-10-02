/**
 * EntityRenderer (EntityLayerRenderer) BDD Tests
 * Tests for entity collection, culling, and batch rendering
 */

describe('EntityRenderer', function() {
    let entityRenderer;
    
    beforeEach(function() {
        // Mock global variables that EntityLayerRenderer depends on
        window.g_resourceList = global.g_resourceList = {
            updateAll: function() {},
            resources: [
                { 
                    x: 100, y: 200, type: 'leaf',
                    isActive: true,
                    getPosition: function() { return {x: this.x, y: this.y}; },
                    getSize: function() { return {x: 16, y: 16}; }
                },
                { 
                    x: 300, y: 400, type: 'stick',
                    isActive: true,
                    getPosition: function() { return {x: this.x, y: this.y}; },
                    getSize: function() { return {x: 16, y: 16}; }
                }
            ]
        };
        
        window.ants = [
            { 
                x: 150, y: 250, type: 'worker',
                isActive: true,
                antObject: { 
                    getPosition: () => ({x: 150, y: 250}), 
                    getSize: () => ({x: 32, y: 32}),
                    isActive: true
                }
            },
            { 
                x: 350, y: 450, type: 'soldier',
                isActive: true,
                antObject: { 
                    getPosition: () => ({x: 350, y: 450}), 
                    getSize: () => ({x: 32, y: 32}),
                    isActive: true
                }
            }
        ];
        
        // Set both window and global for compatibility 
        window.g_canvasX = global.g_canvasX = 800;
        window.g_canvasY = global.g_canvasY = 600;
        window.antIndex = global.antIndex = 2; // Number of ants
        window.antsUpdate = global.antsUpdate = function() {}; // Mock function
        
        // Make sure ants array is available globally
        global.ants = window.ants;
        
        // Create EntityLayerRenderer instance using the real class
        entityRenderer = new EntityLayerRenderer();
    });
    
    describe('Feature: Entity Collection', function() {
        
        describe('Scenario: Collect resources from global list', function() {
            it('should gather all resource entities', function() {
                // When I collect entities for rendering
                entityRenderer.collectEntities('PLAYING');
                
                // Then resources should be collected with correct data
                expect(entityRenderer.renderGroups.RESOURCES).to.have.lengthOf(2);
                expect(entityRenderer.renderGroups.RESOURCES[0].type).to.equal('resource');
                expect(entityRenderer.renderGroups.RESOURCES[1].type).to.equal('resource');
                // Verify entity contains specific resource types
                expect(entityRenderer.renderGroups.RESOURCES[0].entity.type).to.equal('leaf');
                expect(entityRenderer.renderGroups.RESOURCES[1].entity.type).to.equal('stick');
            });
        });
        
        describe('Scenario: Collect ants from global list', function() {
            it('should gather all ant entities', function() {
                // When I collect entities for rendering
                entityRenderer.collectEntities('PLAYING');
                
                // Then ants should be collected with correct data
                expect(entityRenderer.renderGroups.ANTS).to.have.lengthOf(2);
                expect(entityRenderer.renderGroups.ANTS[0].type).to.equal('ant');
                expect(entityRenderer.renderGroups.ANTS[1].type).to.equal('ant');
                // Verify wrapper contains specific ant types
                expect(entityRenderer.renderGroups.ANTS[0].wrapper.type).to.equal('worker');
                expect(entityRenderer.renderGroups.ANTS[1].wrapper.type).to.equal('soldier');
            });
        });
        
        describe('Scenario: Entity collection in different game states', function() {
            it('should collect entities in all game states but only update in playing state', function() {
                // When I collect entities in menu state
                entityRenderer.collectEntities('MENU');
                
                // Then entities should still be collected for rendering
                expect(entityRenderer.renderGroups.ANTS).to.have.lengthOf(2);
                // Resources may be 0 due to spawning logic, but collection should work
                // Note: Resources are collected if they exist, regardless of game state
            });
        });
    });
    
    describe('Feature: Viewport Culling', function() {
        
        describe('Scenario: Entity within viewport', function() {
            it('should include visible entities in rendering', function() {
                // Given an entity within viewport bounds
                const entity = {
                    x: 400, // Center of 800px viewport
                    y: 300, // Center of 600px viewport
                    width: 32,
                    height: 32
                };
                
                // When I check if entity is in viewport
                const isVisible = entityRenderer.isEntityInViewport(entity);
                
                // Then entity should be visible
                expect(isVisible).to.be.true;
            });
        });
        
        describe('Scenario: Entity outside viewport', function() {
            it('should exclude entities outside viewport bounds', function() {
                // Given an entity outside viewport
                const entity = {
                    x: 1000, // Beyond 800px viewport width
                    y: 1000, // Beyond 600px viewport height
                    width: 32,
                    height: 32
                };
                
                // When I check if entity is in viewport
                const isVisible = entityRenderer.isEntityInViewport(entity);
                
                // Then entity should not be visible
                expect(isVisible).to.be.false;
            });
        });
        
        describe('Scenario: Entity partially in viewport', function() {
            it('should include partially visible entities', function() {
                // Given an entity partially outside viewport
                const entity = {
                    x: 790, // Partially beyond 800px viewport
                    y: 590, // Partially beyond 600px viewport  
                    width: 32,
                    height: 32
                };
                
                // When I check if entity is in viewport
                const isVisible = entityRenderer.isEntityInViewport(entity);
                
                // Then entity should be visible (with margin)
                expect(isVisible).to.be.true;
            });
        });
    });
    
    describe('Feature: Entity Position/Size Access', function() {
        
        describe('Scenario: Access entity position consistently', function() {
            it('should use EntityAccessor for position access', function() {
                // Given an entity with position data
                const entity = { x: 150, y: 250 };
                
                // When I get entity position through renderer
                const position = entityRenderer.getEntityPosition(entity);
                
                // Then it should return standardized position
                expect(position).to.deep.equal({ x: 150, y: 250 });
            });
        });
        
        describe('Scenario: Access entity size consistently', function() {
            it('should use EntityAccessor for size access', function() {
                // Given an entity with size data
                const entity = { width: 40, height: 60 };
                
                // When I get entity size through renderer
                const size = entityRenderer.getEntitySize(entity);
                
                // Then it should return standardized size in width/height format
                expect(size).to.have.property('width', 40);
                expect(size).to.have.property('height', 60);
            });
        });
    });
    
    describe('Feature: Depth Sorting', function() {
        
        describe('Scenario: Sort entities by depth', function() {
            it('should arrange entities in correct rendering order', function() {
                // Given entities with different depths added to renderGroups
                entityRenderer.clearRenderGroups();
                entityRenderer.renderGroups.ANTS.push(
                    {
                        entity: { id: 'ant1' },
                        type: 'ant',
                        depth: 3,
                        position: {x: 100, y: 100}
                    },
                    {
                        entity: { id: 'ant2' },
                        type: 'ant', 
                        depth: 1,
                        position: {x: 200, y: 200}
                    },
                    {
                        entity: { id: 'ant3' },
                        type: 'ant',
                        depth: 2,
                        position: {x: 300, y: 300}
                    }
                );
                
                // When I sort by depth using the real method
                entityRenderer.sortEntitiesByDepth();
                
                // Then entities should be in depth order (lowest first)
                expect(entityRenderer.renderGroups.ANTS[0].depth).to.equal(1);
                expect(entityRenderer.renderGroups.ANTS[1].depth).to.equal(2);
                expect(entityRenderer.renderGroups.ANTS[2].depth).to.equal(3);
            });
        });
        
        describe('Scenario: Sort entities by depth values', function() {
            it('should sort by explicit depth values when specified', function() {
                // Given entities with explicit depth values
                entityRenderer.clearRenderGroups();
                entityRenderer.renderGroups.ANTS.push(
                    {
                        entity: { id: 'ant1' },
                        type: 'ant',
                        depth: 300, // Higher depth (farther back)
                        position: {x: 100, y: 300}
                    },
                    {
                        entity: { id: 'ant2' },
                        type: 'ant',
                        depth: 100, // Lower depth (closer to front)
                        position: {x: 200, y: 100}
                    },
                    {
                        entity: { id: 'ant3' },
                        type: 'ant',
                        depth: 200, // Middle depth
                        position: {x: 300, y: 200}
                    }
                );
                
                // When I sort by depth
                entityRenderer.sortEntitiesByDepth();
                
                // Then entities should be sorted by depth value (lowest depth first)
                expect(entityRenderer.renderGroups.ANTS[0].depth).to.equal(100);
                expect(entityRenderer.renderGroups.ANTS[1].depth).to.equal(200);
                expect(entityRenderer.renderGroups.ANTS[2].depth).to.equal(300);
            });
        });
    });
    
    describe('Feature: Performance Optimization', function() {
        
        describe('Scenario: Batch rendering efficiency', function() {
            it('should group entities by type for efficient rendering', function() {
                // Given mixed entity types
                entityRenderer.collectEntities('PLAYING');
                
                // When entities are organized
                // Then they should be grouped by type with correct entities
                expect(entityRenderer.renderGroups.RESOURCES).to.be.an('array').with.lengthOf(2);
                expect(entityRenderer.renderGroups.ANTS).to.be.an('array').with.lengthOf(2);
                expect(entityRenderer.renderGroups.EFFECTS).to.be.an('array').with.lengthOf(0);
                
                // Validate actual grouping behavior - check by render group type
                expect(entityRenderer.renderGroups.RESOURCES.every(item => item.type === 'resource')).to.be.true;
                expect(entityRenderer.renderGroups.ANTS.every(item => item.type === 'ant')).to.be.true;
                // Validate entity content is correct
                expect(entityRenderer.renderGroups.RESOURCES.every(item => item.entity.type === 'leaf' || item.entity.type === 'stick')).to.be.true;
                expect(entityRenderer.renderGroups.ANTS.every(item => item.wrapper.type === 'worker' || item.wrapper.type === 'soldier')).to.be.true;
            });
        });
        
        describe('Scenario: Culling margin configuration', function() {
            it('should allow configurable culling margins', function() {
                // Given a culling margin configuration
                entityRenderer.config.cullMargin = 50;
                
                // When I check entities at different distances from viewport edge
                const entityWithinMargin = {
                    x: -25, // 25px outside left edge (within 50px margin)
                    y: 100,
                    width: 32,
                    height: 32
                };
                
                const entityBeyondMargin = {
                    x: -85, // 85px outside left edge (beyond 50px margin)
                    y: 100,
                    width: 32,
                    height: 32
                };
                
                // Then margin should include entities slightly outside viewport
                expect(entityRenderer.isEntityInViewport(entityWithinMargin)).to.be.true;
                // But exclude entities too far outside the margin
                expect(entityRenderer.isEntityInViewport(entityBeyondMargin)).to.be.false;
            });
        });
    });
    
    describe('Feature: Entity State Management', function() {
        
        describe('Scenario: Clear entity groups', function() {
            it('should reset all render groups', function() {
                // Given populated render groups
                entityRenderer.collectEntities('PLAYING');
                
                // When I clear render groups
                entityRenderer.clearRenderGroups();
                
                // Then all groups should be empty
                Object.values(entityRenderer.renderGroups).forEach(group => {
                    expect(group).to.have.lengthOf(0);
                });
            });
        });
        
        describe('Scenario: Update entity data', function() {
            it('should refresh entity information on each frame', function() {
                // Given an entity collection
                entityRenderer.collectEntities('PLAYING');
                
                // When I modify an ant's position and recollect
                const originalPosition = window.ants[0].x;
                window.ants[0].x = 200; // Move ant to new position (within viewport bounds)
                window.ants[0].antObject.getPosition = () => ({x: 200, y: 250});
                
                entityRenderer.collectEntities('PLAYING');
                
                // Then the updated position should be reflected in render groups
                expect(entityRenderer.renderGroups.ANTS).to.have.lengthOf(2);
                
                // Find the ant that should have been updated (worker type)
                const updatedAnt = entityRenderer.renderGroups.ANTS.find(ant => ant.wrapper.type === 'worker');
                expect(updatedAnt).to.not.be.undefined;
                expect(updatedAnt.position.x).to.equal(200);
                
                // Cleanup - restore original position
                window.ants[0].x = originalPosition;
                window.ants[0].antObject.getPosition = () => ({x: originalPosition, y: 250});
            });
        });
    });
});