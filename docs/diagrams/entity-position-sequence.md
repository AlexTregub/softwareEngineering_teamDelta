# Entity Position Setting - Sequence Diagram

This diagram shows how entities (and subclasses like `ant`) set their position, including all the synchronized components.

```mermaid
sequenceDiagram

    participant User as User/Game Code
    participant Ant as Ant (extends Entity)
    participant Entity as Entity
    participant CollisionBox as CollisionBox2D
    participant Transform as TransformController
    participant Movement as MovementController
    participant Stats as StatsContainer
    participant Sprite as Sprite2d
    participant SpatialGrid as SpatialGridManager

    rect(0,0,0)
    Note over User,SpatialGrid: Direct Position Setting (setPosition)
    
    User->>+Ant: setPosition(x, y)
    Note right of Ant: Ant inherits setPosition from Entity
    Ant->>+Entity: setPosition(x, y)
    
    Entity->>+CollisionBox: setPosition(x, y)
    CollisionBox->>CollisionBox: this.x = x<br/>this.y = y
    CollisionBox-->>-Entity: return this
    
    Entity->>+Transform: setPosition(x, y)
    Note right of Transform: Updates StatsContainer if available
    Transform->>Stats: position.statValue.x = x<br/>position.statValue.y = y
    Transform->>Transform: _lastPosition.x = x<br/>_lastPosition.y = y
    Transform->>Transform: _isDirty = true
    Transform-->>-Entity: return
    
    Entity->>+SpatialGrid: updateEntity(this)
    Note right of SpatialGrid: Updates entity's grid cell
    SpatialGrid-->>-Entity: return
    
    Entity-->>-Ant: return
    Ant-->>-User: return

    Note over User,SpatialGrid: Next Frame: Transform Sync
    
    loop Every Frame
        Entity->>+Transform: update()
        alt _isDirty === true
            Transform->>+Sprite: setPosition(createVector(x, y))
            Sprite->>Sprite: this.pos.x = x<br/>this.pos.y = y
            Sprite-->>-Transform: return
            Transform->>Transform: _isDirty = false
        end
        Transform-->>-Entity: return
    end

    Note over User,SpatialGrid: Movement-Based Position Change
    
    User->>+Ant: moveToLocation(targetX, targetY)
    Note right of Ant: Delegates to MovementController
    Ant->>+Entity: moveToLocation(targetX, targetY)
    Entity->>+Movement: moveToLocation(targetX, targetY)
    
    Movement->>Movement: Store target position<br/>_targetPosition = {x, y}<br/>_isMoving = true
    Movement->>Ant: Flip sprite based on direction
    
    opt Pathfinding Available
        Movement->>Movement: findPath(start, end)
        Movement->>Movement: setPath(calculatedPath)
    end
    
    Movement-->>-Entity: return true
    Entity-->>-Ant: return true
    Ant-->>-User: return true

    Note over User,SpatialGrid: Frame-by-Frame Movement Update
    
    loop Every Frame (while moving)
        Entity->>+Movement: update()
        Movement->>+Entity: getCurrentPosition()
        Entity->>+Transform: getPosition()
        alt Has StatsContainer
            Transform->>Stats: return position.statValue
            Stats-->>Transform: {x, y}
        else Fallback
            Transform->>CollisionBox: return {x, y}
            CollisionBox-->>Transform: {x, y}
        end
        Transform-->>-Entity: {x, y}
        Entity-->>-Movement: currentPos {x, y}
        
        Movement->>Movement: Calculate direction vector<br/>Normalize direction<br/>Apply speed * deltaTime<br/>Apply terrain modifier
        Movement->>Movement: newPos = currentPos + (direction * step)
        
        Movement->>+Entity: setPosition(newPos.x, newPos.y)
        Entity->>+CollisionBox: setPosition(newPos.x, newPos.y)
        CollisionBox-->>-Entity: return
        Entity->>+Transform: setPosition(newPos.x, newPos.y)
        Transform->>Stats: position.statValue = newPos
        Transform->>Transform: _isDirty = true
        Transform-->>-Entity: return
        Entity->>+SpatialGrid: updateEntity(this)
        SpatialGrid-->>-Entity: return
        Entity-->>-Movement: return
        
        opt Also sync StatsContainer
            Movement->>Stats: position.statValue.x = newPos.x<br/>position.statValue.y = newPos.y
        end
        
        opt Also sync Sprite
            Movement->>Sprite: setPosition(newPos)
        end
        
        alt Distance to target < 1
            Movement->>Movement: _isMoving = false<br/>Snap to exact target
        end
        
        Movement-->>-Entity: return
    end

    Note over User,SpatialGrid: Legacy Ant posX/posY Setters
    
    User->>+Ant: ant.posX = 100
    Note right of Ant: Legacy setter for backward compatibility
    Ant->>Ant: const p = getPosition()
    Ant->>+Entity: setPosition(100, p.y)
    Entity->>CollisionBox: setPosition(100, p.y)
    Entity->>Transform: setPosition(100, p.y)
    Entity->>SpatialGrid: updateEntity(this)
    Entity-->>-Ant: return
    Ant-->>-User: return
```

## Key Position Storage Locations

1. **CollisionBox2D** - Primary authoritative source (`this.x`, `this.y`)
2. **TransformController** - Cached position (`_lastPosition.x`, `_lastPosition.y`)
3. **StatsContainer** - Legacy ant system (`position.statValue.x`, `position.statValue.y`)
4. **Sprite2d** - Visual rendering (`pos.x`, `pos.y`)

## Position Update Flow

### Direct Setting
```
User → Entity.setPosition() → CollisionBox + TransformController + SpatialGrid
     → (Next Frame) TransformController.update() → Sprite2d sync
```

### Movement-Based
```
User → Entity.moveToLocation() → MovementController stores target
     → (Each Frame) MovementController.update() calculates new position
     → MovementController.setEntityPosition() → Entity.setPosition()
     → CollisionBox + TransformController + StatsContainer + Sprite2d + SpatialGrid
```

## Synchronization Points

- **Immediate**: CollisionBox, TransformController (cached), SpatialGrid
- **Next Frame**: Sprite2d (via TransformController._isDirty flag)
- **During Movement**: StatsContainer and Sprite2d also updated directly by MovementController
