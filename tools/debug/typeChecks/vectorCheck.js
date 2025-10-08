// Vector Type Utilities
// ---------------------
// Small utilities to detect and classify vector-like values used across the project.
// Supports p5.Vector, plain objects with x/y(/z), and number arrays [x,y] or [x,y,z].

/**
 * isVector
 * --------
 * Determine whether a value represents a vector.
 * Accepts:
 *  - p5.Vector instances
 *  - Objects with numeric x and y (optionally z)
 *  - Arrays of length 2 or 3 containing numbers
 * @param {*} value - value to test
 * @returns {boolean} true when the value is a vector-like structure
 */
function isVector(value) {
  if (!value || typeof value !== 'object') return false;
  if (typeof p5 !== 'undefined' && value instanceof p5.Vector) return true;
  if (value.constructor && value.constructor.name === 'p5.Vector') return true;
  if (typeof value.x === 'number' && typeof value.y === 'number' &&
      Number.isFinite(value.x) && Number.isFinite(value.y)) return true;
  if (typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number' &&
      Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z)) return true;
  if (Array.isArray(value) && (value.length === 2 || value.length === 3) &&
      value.every(c => typeof c === 'number' && Number.isFinite(c))) return true;
  return false;
}

/**
 * isVector2D
 * ----------
 * Check specifically for a 2D vector shape.
 * @param {*} value
 * @returns {boolean}
 */
function isVector2D(value) {
  if (!isVector(value)) return false;
  if (typeof p5 !== 'undefined' && value instanceof p5.Vector) return value.z === undefined || value.z === 0;
  if (Array.isArray(value)) return value.length === 2;
  return typeof value.x === 'number' && typeof value.y === 'number' && value.z === undefined;
}

/**
 * isVector3D
 * ----------
 * Check specifically for a 3D vector shape.
 * @param {*} value
 * @returns {boolean}
 */
function isVector3D(value) {
  if (!isVector(value)) return false;
  if (typeof p5 !== 'undefined' && value instanceof p5.Vector) return value.z !== undefined && value.z !== 0;
  if (Array.isArray(value)) return value.length === 3;
  return typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number';
}

/**
 * isP5Vector
 * ----------
 * True when the value is a p5.Vector instance (robust across environments).
 * @param {*} value
 * @returns {boolean}
 */
function isP5Vector(value) {
  if (typeof p5 !== 'undefined' && value instanceof p5.Vector) return true;
  return !!(value && value.constructor && value.constructor.name === 'p5.Vector');
}

/**
 * getVectorType
 * -------------
 * Return a short descriptor for the vector form:
 *  - "p5Vector", "array2D", "array3D", "object2D", "object3D", "notVector"
 * @param {*} value
 * @returns {string}
 */
function getVectorType(value) {
  if (!isVector(value)) return "notVector";
  if (isP5Vector(value)) return "p5Vector";
  if (Array.isArray(value)) return value.length === 2 ? "array2D" : "array3D";
  if (typeof value.z === 'number' && Number.isFinite(value.z)) return "object3D";
  return "object2D";
}

// Browser globals
if (typeof window !== 'undefined') {
  window.isVector = isVector;
  window.isVector2D = isVector2D;
  window.isVector3D = isVector3D;
  window.isP5Vector = isP5Vector;
  window.getVectorType = getVectorType;
}

// Node/CommonJS exports
if (typeof module !== "undefined" && module.exports) {
  module.exports = { isVector, isVector2D, isVector3D, isP5Vector, getVectorType };
}