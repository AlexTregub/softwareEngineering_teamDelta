# EntityDelegationBuilder API Documentation

> **Module**: `Classes/rendering/EntityDelegationBuilder.js`  
> **Version**: 1.0.0  
> **Last Updated**: October 2025

## Overview

The `EntityDelegationBuilder` class provides utility methods for automatically generating delegation methods on class prototypes, eliminating code repetition when delegating to controller patterns.

## Class: EntityDelegationBuilder

### Static Methods

#### `createDelegationMethods(entityClass, controllerProperty, methodList, namespace = null)`

**Parameters:**

- `entityClass` (Class): Target class to add methods to
- `controllerProperty` (string): Property name of the controller
- `methodList` (Array): Array of method names to delegate
- `namespace` (string, optional): Prefix for delegated method names

Automatically creates delegation methods on the entity class prototype.

**Implementation:**

```javascript
static createDelegationMethods(entityClass, controllerProperty, methodList, namespace = null) {
  methodList.forEach(methodName => {
    const targetName = namespace ? `${namespace}_${methodName}` : methodName;
    
    entityClass.prototype[targetName] = function(...args) {
      const controller = this[controllerProperty];
      if (controller && typeof controller[methodName] === 'function') {
        return controller[methodName](...args);
      } else {
        console.warn(`${this.constructor.name}: Method ${methodName} not available on ${controllerProperty}`);
        return null;
      }
    };
  });
}
```

## Usage Patterns

### Basic Delegation

```javascript
// Entity with RenderController
class Ant {
  constructor() {
    this.renderController = new RenderController(this);
  }
}

// Create delegation methods
EntityDelegationBuilder.createDelegationMethods(
  Ant, 
  'renderController', 
  ['setHighlight', 'clearHighlight', 'startAnimation', 'stopAnimation']
);

// Now ants can use controller methods directly
const ant = new Ant();
ant.setHighlight('SELECTED');  // Delegates to renderController.setHighlight()
ant.startAnimation('bob', 2000); // Delegates to renderController.startAnimation()
```

### Namespaced Delegation

```javascript
// Multiple controllers with namespace to avoid conflicts
class Entity {
  constructor() {
    this.renderController = new RenderController(this);
    this.movementController = new MovementController(this);
  }
}

// Render methods with 'render' namespace
EntityDelegationBuilder.createDelegationMethods(
  Entity,
  'renderController',
  ['setHighlight', 'startAnimation'],
  'render'
);

// Movement methods with 'move' namespace  
EntityDelegationBuilder.createDelegationMethods(
  Entity,
  'movementController', 
  ['setVelocity', 'stop'],
  'move'
);

// Usage with namespaces
const entity = new Entity();
entity.render_setHighlight('HOVER');  // renderController.setHighlight()
entity.move_setVelocity({x: 5, y: 0}); // movementController.setVelocity()
```

### Advanced Delegation Patterns

```javascript
// Complex entity with multiple specialized controllers
class AdvancedAnt {
  constructor() {
    this.renderController = new RenderController(this);
    this.aiController = new AIController(this);
    this.combatController = new CombatController(this);
    this.inventoryController = new InventoryController(this);
  }
}

// Delegate render methods
EntityDelegationBuilder.createDelegationMethods(
  AdvancedAnt, 
  'renderController',
  ['render', 'setHighlight', 'clearHighlight', 'startAnimation', 'stopAnimation', 'addEffect']
);

// Delegate AI methods
EntityDelegationBuilder.createDelegationMethods(
  AdvancedAnt,
  'aiController', 
  ['setState', 'getState', 'setTarget', 'clearTarget'],
  'ai'
);

// Delegate combat methods
EntityDelegationBuilder.createDelegationMethods(
  AdvancedAnt,
  'combatController',
  ['attack', 'takeDamage', 'heal', 'setHealth'],
  'combat'
);

// Usage
const ant = new AdvancedAnt();
ant.render();                    // Direct delegation
ant.ai_setState('GATHERING');    // Namespaced delegation
ant.combat_attack(target);       // Namespaced delegation
```

## Error Handling

### Method Availability Checking

The delegation builder includes automatic error handling for missing controllers or methods:

```javascript
// If controller or method doesn't exist
ant.nonExistentMethod(); 
// Console output: "Ant: Method nonExistentMethod not available on renderController"
// Returns: null
```

### Safe Delegation Pattern

```javascript
// The generated methods are safe and won't crash if controller is missing
class SafeEntity {
  constructor(hasRenderController = false) {
    if (hasRenderController) {
      this.renderController = new RenderController(this);
    }
    // renderController might be undefined
  }
}

EntityDelegationBuilder.createDelegationMethods(
  SafeEntity,
  'renderController', 
  ['render', 'setHighlight']
);

const entityWithoutController = new SafeEntity(false);
entityWithoutController.render(); // Logs warning but doesn't crash
```

## Performance Considerations

### Method Generation Impact

- **One-time Cost**: Methods generated once during class definition
- **Runtime Efficiency**: Delegated methods have minimal overhead
- **Memory Usage**: Each method adds one function to prototype
- **Call Performance**: Single function call + property access overhead

### Best Practices

```javascript
// Generate methods once during class definition, not per instance
class OptimizedEntity {
  constructor() {
    this.renderController = new RenderController(this);
  }
}

// Do this ONCE after class definition
EntityDelegationBuilder.createDelegationMethods(
  OptimizedEntity,
  'renderController',
  ['render', 'setHighlight', 'clearHighlight']
);

// NOT in constructor or instance methods
```

## Integration Examples

### Game Entity Hierarchy

```javascript
// Base entity class
class GameEntity {
  constructor() {
    this.renderController = new RenderController(this);
    this.transformController = new TransformController(this);
  }
}

// Add common delegations to base class
EntityDelegationBuilder.createDelegationMethods(
  GameEntity,
  'renderController',
  ['render', 'setHighlight', 'clearHighlight']
);

EntityDelegationBuilder.createDelegationMethods(
  GameEntity, 
  'transformController',
  ['getPosition', 'setPosition', 'getRotation', 'setRotation']
);

// Specialized entities inherit delegations
class Ant extends GameEntity {
  constructor() {
    super();
    this.aiController = new AntAI(this);
  }
}

// Add ant-specific delegations
EntityDelegationBuilder.createDelegationMethods(
  Ant,
  'aiController', 
  ['setJob', 'getJob', 'findFood', 'returnToColony'],
  'ai'
);
```

### Controller Interface Standardization

```javascript
// Standardize controller interfaces across different entity types
const RENDER_METHODS = ['render', 'setHighlight', 'clearHighlight', 'startAnimation'];
const MOVEMENT_METHODS = ['move', 'stop', 'setVelocity', 'getVelocity'];
const AI_METHODS = ['setState', 'getState', 'update', 'setTarget'];

// Apply to multiple entity classes
[Ant, Spider, Beetle].forEach(EntityClass => {
  EntityDelegationBuilder.createDelegationMethods(EntityClass, 'renderController', RENDER_METHODS);
  EntityDelegationBuilder.createDelegationMethods(EntityClass, 'movementController', MOVEMENT_METHODS);
  EntityDelegationBuilder.createDelegationMethods(EntityClass, 'aiController', AI_METHODS, 'ai');
});
```

## TODO Enhancements

### Advanced Delegation Features

- **Method Interception**: Pre/post hooks for delegated methods
- **Conditional Delegation**: Delegate based on runtime conditions
- **Chain Delegation**: Delegate through multiple controller layers
- **Method Mapping**: Map method names during delegation

### Development Tools  

- **Delegation Inspector**: Runtime visualization of delegation chains
- **Performance Profiler**: Track delegation overhead and usage
- **Auto-Documentation**: Generate documentation for delegated methods
- **Type Safety**: TypeScript integration for type-safe delegation

### Error Enhancement

- **Custom Error Handlers**: Configurable error handling strategies
- **Fallback Methods**: Default implementations when controllers missing
- **Delegation Validation**: Compile-time validation of delegation targets
- **Debug Mode**: Enhanced debugging information for delegation failures

---

## See Also

- **[RenderController API Documentation](RenderController.md)** - Common delegation target
- **[EntityAccessor API Documentation](EntityAccessor.md)** - Related entity utility patterns
- **[Entity System Architecture Guide](../guides/entity-system.md)** - Entity design patterns
