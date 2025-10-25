/**
 * Validation Helper Utilities for E2E Tests
 * Provides data validation functions
 */

/**
 * Validate entity data structure
 * @param {Object} entityData - Entity data to validate
 * @throws {Error} If validation fails
 * @returns {boolean} True if valid
 */
function validateEntityData(entityData) {
  const required = ['id', 'type', 'isActive', 'position', 'size'];
  const missing = required.filter(field => entityData[field] === undefined);
  
  if (missing.length > 0) {
    throw new Error(`Missing entity fields: ${missing.join(', ')}`);
  }
  
  // Validate position
  if (!entityData.position.x || !entityData.position.y) {
    throw new Error('Invalid position: missing x or y');
  }
  
  // Validate size
  if (!entityData.size.x || !entityData.size.y) {
    throw new Error('Invalid size: missing x or y');
  }
  
  return true;
}

/**
 * Validate ant data structure
 * @param {Object} antData - Ant data to validate
 * @throws {Error} If validation fails
 * @returns {boolean} True if valid
 */
function validateAntData(antData) {
  // First validate as entity
  validateEntityData(antData);
  
  const antRequired = ['jobType', 'health'];
  const missing = antRequired.filter(field => antData[field] === undefined);
  
  if (missing.length > 0) {
    throw new Error(`Missing ant fields: ${missing.join(', ')}`);
  }
  
  // Validate job type
  const validJobs = ['Scout', 'Builder', 'Warrior', 'Farmer', 'Spitter', 'Queen'];
  if (!validJobs.includes(antData.jobType)) {
    throw new Error(`Invalid job type: ${antData.jobType}`);
  }
  
  // Validate health
  if (typeof antData.health !== 'number' || antData.health < 0) {
    throw new Error('Invalid health value');
  }
  
  return true;
}

/**
 * Validate controller availability
 * @param {Array<string>} controllers - Array of controller names
 * @param {Array<string>} required - Required controller names
 * @throws {Error} If required controllers missing
 * @returns {boolean} True if valid
 */
function validateControllers(controllers, required) {
  const missing = required.filter(name => !controllers.includes(name));
  
  if (missing.length > 0) {
    throw new Error(`Missing required controllers: ${missing.join(', ')}`);
  }
  
  return true;
}

/**
 * Validate position within bounds
 * @param {Object} position - Position object {x, y}
 * @param {Object} bounds - Bounds object {minX, minY, maxX, maxY}
 * @throws {Error} If position out of bounds
 * @returns {boolean} True if valid
 */
function validatePositionInBounds(position, bounds) {
  const { x, y } = position;
  const { minX = 0, minY = 0, maxX = Infinity, maxY = Infinity } = bounds;
  
  if (x < minX || x > maxX || y < minY || y > maxY) {
    throw new Error(
      `Position (${x}, ${y}) out of bounds [${minX}-${maxX}, ${minY}-${maxY}]`
    );
  }
  
  return true;
}

/**
 * Validate state machine state
 * @param {string} state - Current state
 * @param {Array<string>} validStates - Array of valid state names
 * @throws {Error} If state invalid
 * @returns {boolean} True if valid
 */
function validateState(state, validStates) {
  if (!validStates.includes(state)) {
    throw new Error(
      `Invalid state: ${state}. Valid states: ${validStates.join(', ')}`
    );
  }
  
  return true;
}

/**
 * Validate performance metrics
 * @param {Object} metrics - Performance metrics
 * @param {Object} thresholds - Threshold values
 * @throws {Error} If metrics below thresholds
 * @returns {Object} Validation results with details
 */
function validatePerformance(metrics, thresholds) {
  const results = {
    passed: true,
    failures: []
  };
  
  if (thresholds.minFPS && metrics.fps < thresholds.minFPS) {
    results.passed = false;
    results.failures.push(
      `FPS ${metrics.fps} below threshold ${thresholds.minFPS}`
    );
  }
  
  if (thresholds.maxMemoryMB && metrics.memoryMB > thresholds.maxMemoryMB) {
    results.passed = false;
    results.failures.push(
      `Memory ${metrics.memoryMB}MB exceeds threshold ${thresholds.maxMemoryMB}MB`
    );
  }
  
  if (thresholds.maxFrameTimeMs && metrics.avgFrameTime > thresholds.maxFrameTimeMs) {
    results.passed = false;
    results.failures.push(
      `Frame time ${metrics.avgFrameTime}ms exceeds threshold ${thresholds.maxFrameTimeMs}ms`
    );
  }
  
  if (!results.passed) {
    throw new Error(`Performance validation failed:\n${results.failures.join('\n')}`);
  }
  
  return results;
}

/**
 * Validate collision detection
 * @param {Object} entity1 - First entity
 * @param {Object} entity2 - Second entity
 * @param {boolean} shouldCollide - Expected collision result
 * @returns {boolean} True if collision matches expectation
 */
function validateCollision(entity1, entity2, shouldCollide) {
  const { position: pos1, size: size1 } = entity1;
  const { position: pos2, size: size2 } = entity2;
  
  // Simple AABB collision check
  const collides = !(
    pos1.x + size1.x < pos2.x ||
    pos1.x > pos2.x + size2.x ||
    pos1.y + size1.y < pos2.y ||
    pos1.y > pos2.y + size2.y
  );
  
  if (collides !== shouldCollide) {
    throw new Error(
      `Collision validation failed: expected ${shouldCollide}, got ${collides}`
    );
  }
  
  return true;
}

/**
 * Validate distance between two positions
 * @param {Object} pos1 - First position {x, y}
 * @param {Object} pos2 - Second position {x, y}
 * @param {number} expectedDistance - Expected distance
 * @param {number} tolerance - Tolerance (default 5)
 * @throws {Error} If distance outside tolerance
 * @returns {number} Actual distance
 */
function validateDistance(pos1, pos2, expectedDistance, tolerance = 5) {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const actualDistance = Math.sqrt(dx * dx + dy * dy);
  
  const diff = Math.abs(actualDistance - expectedDistance);
  
  if (diff > tolerance) {
    throw new Error(
      `Distance validation failed: expected ${expectedDistance}±${tolerance}, got ${actualDistance}`
    );
  }
  
  return actualDistance;
}

/**
 * Validate array contains expected items
 * @param {Array} array - Array to check
 * @param {Array} expectedItems - Expected items
 * @param {boolean} exact - Whether array should contain ONLY these items
 * @throws {Error} If validation fails
 * @returns {boolean} True if valid
 */
function validateArrayContains(array, expectedItems, exact = false) {
  const missing = expectedItems.filter(item => !array.includes(item));
  
  if (missing.length > 0) {
    throw new Error(`Array missing expected items: ${missing.join(', ')}`);
  }
  
  if (exact) {
    const extra = array.filter(item => !expectedItems.includes(item));
    if (extra.length > 0) {
      throw new Error(`Array contains unexpected items: ${extra.join(', ')}`);
    }
  }
  
  return true;
}

/**
 * Validate numeric range
 * @param {number} value - Value to check
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @param {string} label - Label for error message
 * @throws {Error} If value out of range
 * @returns {boolean} True if valid
 */
function validateRange(value, min, max, label = 'Value') {
  if (value < min || value > max) {
    throw new Error(
      `${label} ${value} out of range [${min}, ${max}]`
    );
  }
  
  return true;
}

/**
 * Create custom validator
 * @param {Function} validationFn - Custom validation function
 * @param {string} errorMessage - Error message if validation fails
 * @returns {Function} Validator function
 */
function createValidator(validationFn, errorMessage) {
  return (value) => {
    if (!validationFn(value)) {
      throw new Error(errorMessage);
    }
    return true;
  };
}

module.exports = {
  validateEntityData,
  validateAntData,
  validateControllers,
  validatePositionInBounds,
  validateState,
  validatePerformance,
  validateCollision,
  validateDistance,
  validateArrayContains,
  validateRange,
  createValidator
};
