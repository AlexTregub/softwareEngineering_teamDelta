/**
 * EntityAccessor BDD Tests
 * Converts our Behave scenarios to JavaScript Mocha/Chai tests
 */

describe('EntityAccessor', function() {
    
    describe('Feature: Standardized Entity Position Access', function() {
        
        describe('Scenario: Entity with getPosition method', function() {
            it('should return position from getPosition() method', function() {
                // Given an entity with a getPosition method
                const entity = {
                    getPosition: function() {
                        return { x: 100, y: 200 };
                    }
                };
                
                // When I request the entity position
                const position = EntityAccessor.getPosition(entity);
                
                // Then the position should be {x: 100, y: 200}
                expect(position).to.deep.equal({ x: 100, y: 200 });
            });
        });
        
        describe('Scenario: Entity with position property', function() {
            it('should return position from position property', function() {
                // Given an entity with a position property
                const entity = {
                    position: { x: 150, y: 250 }
                };
                
                // When I request the entity position
                const position = EntityAccessor.getPosition(entity);
                
                // Then the position should be {x: 150, y: 250}
                expect(position).to.deep.equal({ x: 150, y: 250 });
            });
        });
        
        describe('Scenario: Entity with sprite position', function() {
            it('should return position from sprite.pos', function() {
                // Given an entity with sprite position
                const entity = {
                    sprite: {
                        pos: { x: 75, y: 125 }
                    }
                };
                
                // When I request the entity position
                const position = EntityAccessor.getPosition(entity);
                
                // Then the position should be {x: 75, y: 125}
                expect(position).to.deep.equal({ x: 75, y: 125 });
            });
        });
        
        describe('Scenario: Entity with direct coordinates', function() {
            it('should return position from x, y properties', function() {
                // Given an entity with direct x, y coordinates
                const entity = {
                    x: 300,
                    y: 400
                };
                
                // When I request the entity position
                const position = EntityAccessor.getPosition(entity);
                
                // Then the position should be {x: 300, y: 400}
                expect(position).to.deep.equal({ x: 300, y: 400 });
            });
        });
        
        describe('Scenario: Entity with no position data', function() {
            it('should return default position {0, 0}', function() {
                // Given an entity with no position data
                const entity = {
                    someOtherProperty: "value"
                };
                
                // When I request the entity position
                const position = EntityAccessor.getPosition(entity);
                
                // Then the position should be {x: 0, y: 0}
                expect(position).to.deep.equal({ x: 0, y: 0 });
            });
        });
        
        describe('Scenario: Null entity', function() {
            it('should return default position for null entity', function() {
                // Given a null entity
                const entity = null;
                
                // When I request the entity position
                const position = EntityAccessor.getPosition(entity);
                
                // Then the position should be {x: 0, y: 0}
                expect(position).to.deep.equal({ x: 0, y: 0 });
            });
        });
    });
    
    describe('Feature: Standardized Entity Size Access', function() {
        
        describe('Scenario: Entity with getSize method', function() {
            it('should return size from getSize() method', function() {
                // Given an entity with a getSize method
                const entity = {
                    getSize: function() {
                        return { x: 32, y: 48 };
                    }
                };
                
                // When I request the entity size
                const size = EntityAccessor.getSize(entity);
                
                // Then the size should be {x: 32, y: 48}
                expect(size).to.deep.equal({ x: 32, y: 48 });
            });
        });
        
        describe('Scenario: Entity with size property', function() {
            it('should return size from size property with x,y format', function() {
                // Given an entity with size property in x,y format
                const entity = {
                    size: { x: 64, y: 64 }
                };
                
                // When I request the entity size
                const size = EntityAccessor.getSize(entity);
                
                // Then the size should be {x: 64, y: 64}
                expect(size).to.deep.equal({ x: 64, y: 64 });
            });
            
            it('should return size from size property with width,height format', function() {
                // Given an entity with size property in width,height format
                const entity = {
                    size: { width: 48, height: 32 }
                };
                
                // When I request the entity size
                const size = EntityAccessor.getSize(entity);
                
                // Then the size should be converted to {x: 48, y: 32}
                expect(size).to.deep.equal({ x: 48, y: 32 });
            });
        });
        
        describe('Scenario: Entity with direct width/height', function() {
            it('should return size from width, height properties', function() {
                // Given an entity with direct width, height properties
                const entity = {
                    width: 80,
                    height: 60
                };
                
                // When I request the entity size
                const size = EntityAccessor.getSize(entity);
                
                // Then the size should be {x: 80, y: 60}
                expect(size).to.deep.equal({ x: 80, y: 60 });
            });
        });
        
        describe('Scenario: Entity with no size data', function() {
            it('should return default size {20, 20}', function() {
                // Given an entity with no size data
                const entity = {
                    someOtherProperty: "value"
                };
                
                // When I request the entity size
                const size = EntityAccessor.getSize(entity);
                
                // Then the size should be {x: 20, y: 20}
                expect(size).to.deep.equal({ x: 20, y: 20 });
            });
        });
    });
    
    describe('Feature: Entity Format Conversion', function() {
        
        describe('Scenario: Convert to width/height format', function() {
            it('should convert size to width/height format for EntityRenderer', function() {
                // Given an entity with x,y size format
                const entity = {
                    getSize: function() {
                        return { x: 32, y: 48 };
                    }
                };
                
                // When I request size in width/height format
                const size = EntityAccessor.getSizeWH(entity);
                
                // Then the size should be {width: 32, height: 48}
                expect(size).to.have.property('width', 32);
                expect(size).to.have.property('height', 48);
            });
        });
        
        describe('Scenario: Get entity center point', function() {
            it('should calculate center from position and size', function() {
                // Given an entity with position and size
                const entity = {
                    getPosition: () => ({ x: 100, y: 200 }),
                    getSize: () => ({ x: 40, y: 60 })
                };
                
                // When I request the entity center
                const center = EntityAccessor.getCenter(entity);
                
                // Then the center should be calculated correctly
                expect(center).to.deep.equal({ x: 120, y: 230 });
            });
        });
        
        describe('Scenario: Get entity bounds', function() {
            it('should return complete bounds rectangle', function() {
                // Given an entity with position and size
                const entity = {
                    getPosition: () => ({ x: 50, y: 75 }),
                    getSize: () => ({ x: 30, y: 40 })
                };
                
                // When I request the entity bounds
                const bounds = EntityAccessor.getBounds(entity);
                
                // Then the bounds should include all properties
                expect(bounds).to.deep.equal({
                    x: 50,
                    y: 75,
                    width: 30,
                    height: 40
                });
            });
        });
    });
    
    describe('Feature: Entity Existence Checking', function() {
        
        describe('Scenario: Check position existence', function() {
            it('should detect entities with position data', function() {
                const entityWithPos = { x: 10, y: 20 };
                const entityWithoutPos = { color: "red" };
                
                expect(EntityAccessor.hasPosition(entityWithPos)).to.be.true;
                expect(EntityAccessor.hasPosition(entityWithoutPos)).to.be.false;
                expect(EntityAccessor.hasPosition(null)).to.be.false;
            });
        });
        
        describe('Scenario: Check size existence', function() {
            it('should detect entities with size data', function() {
                const entityWithSize = { width: 30, height: 40 };
                const entityWithoutSize = { color: "blue" };
                
                expect(EntityAccessor.hasSize(entityWithSize)).to.be.true;
                expect(EntityAccessor.hasSize(entityWithoutSize)).to.be.false;
                expect(EntityAccessor.hasSize(null)).to.be.false;
            });
        });
    });
});