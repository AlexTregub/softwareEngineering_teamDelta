// Vector Type Testing Functions
// Provides utilities to check if a value is a vector in various formats

/**
 * Checks if a passed value is a vector and returns true/false
 * Supports multiple vector formats:
 * - p5.js Vector objects
 * - Objects with x, y properties (2D)
 * - Objects with x, y, z properties (3D)
 * - Arrays with 2 or 3 numeric elements
 * 
 * @param {*} value - The value to test
 * @returns {boolean} - True if the value is a vector, false otherwise
 */
function isVector(value) {
  // Check if value exists and is an object
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  // Check for p5.js Vector
  if (typeof p5 !== 'undefined' && value instanceof p5.Vector) {
    return true;
  }
  
  // Alternative p5.js Vector check for different environments
  if (value.constructor && value.constructor.name === 'p5.Vector') {
    return true;
  }
  
  // Check for object with x and y properties (2D vector)
  if (typeof value.x === 'number' && typeof value.y === 'number' && 
      !isNaN(value.x) && !isNaN(value.y) && 
      isFinite(value.x) && isFinite(value.y)) {
    return true;
  }
  
  // Check for object with x, y, and z properties (3D vector)
  if (typeof value.x === 'number' && 
      typeof value.y === 'number' && 
      typeof value.z === 'number' &&
      !isNaN(value.x) && !isNaN(value.y) && !isNaN(value.z) &&
      isFinite(value.x) && isFinite(value.y) && isFinite(value.z)) {
    return true;
  }
  
  // Check for array-like vector [x, y] or [x, y, z]
  if (Array.isArray(value) && 
      (value.length === 2 || value.length === 3) &&
      value.every(component => typeof component === 'number' && !isNaN(component) && isFinite(component))) {
    return true;
  }
  
  return false;
}

/**
 * Checks if a value is specifically a 2D vector
 * @param {*} value - The value to test
 * @returns {boolean} - True if the value is a 2D vector
 */
function isVector2D(value) {
  if (!isVector(value)) return false;
  
  // p5.js Vector with z = 0 or undefined
  if (value instanceof p5.Vector) {
    return value.z === 0 || value.z === undefined;
  }
  
  // Object with x, y but no z
  if (typeof value.x === 'number' && typeof value.y === 'number') {
    return value.z === undefined;
  }
  
  // Array with exactly 2 elements
  if (Array.isArray(value)) {
    return value.length === 2;
  }
  
  return false;
}

/**
 * Checks if a value is specifically a 3D vector
 * @param {*} value - The value to test
 * @returns {boolean} - True if the value is a 3D vector
 */
function isVector3D(value) {
  if (!isVector(value)) return false;
  
  // p5.js Vector with defined z
  if (value instanceof p5.Vector) {
    return value.z !== undefined && value.z !== 0;
  }
  
  // Object with x, y, and z
  if (typeof value.x === 'number' && 
      typeof value.y === 'number' && 
      typeof value.z === 'number') {
    return true;
  }
  
  // Array with exactly 3 elements
  if (Array.isArray(value)) {
    return value.length === 3;
  }
  
  return false;
}

/**
 * Checks if a value is a p5.js Vector specifically
 * @param {*} value - The value to test
 * @returns {boolean} - True if the value is a p5.js Vector object
 */
function isP5Vector(value) {
  if (typeof p5 !== 'undefined' && value instanceof p5.Vector) {
    return true;
  }
  
  // Alternative check for different environments
  if (value && value.constructor && value.constructor.name === 'p5.Vector') {
    return true;
  }
  
  return false;
}

/**
 * Gets the vector type as a string
 * @param {*} value - The value to analyze
 * @returns {string} - Type description ("p5Vector", "object2D", "object3D", "array2D", "array3D", "notVector")
 */
function getVectorType(value) {
  if (!isVector(value)) return "notVector";
  
  if (isP5Vector(value)) {
    return "p5Vector";
  }
  
  if (Array.isArray(value)) {
    return value.length === 2 ? "array2D" : "array3D";
  }
  
  if (typeof value.z === 'number' && !isNaN(value.z) && isFinite(value.z)) {
    return "object3D";
  }
  
  return "object2D";
}

// Make functions globally available in browser environment
if (typeof window !== 'undefined') {
  window.isVector = isVector;
  window.isVector2D = isVector2D;
  window.isVector3D = isVector3D;
  window.isP5Vector = isP5Vector;
  window.getVectorType = getVectorType;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isVector,
    isVector2D,
    isVector3D,
    isP5Vector,
    getVectorType
  };
}