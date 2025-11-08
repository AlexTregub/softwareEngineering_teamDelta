/**
 * @fileoverview Legacy type declarations - DEPRECATED
 * @deprecated This file is replaced by the automatic JSDoc system
 * 
 * NEW APPROACH - No maintenance required!
 * ========================================
 * 1. Add JSDoc comments directly to your class methods
 * 2. Global variables declared in types/global.d.ts  
 * 3. VS Code automatically compiles all type information
 * 4. IntelliSense works immediately everywhere!
 * 
 */

// =============================================================================
// MIGRATION NOTICE
// =============================================================================

if (typeof globalThis !== 'undefined') {
  globalThis.LEGACY_TYPES_LOADED = true;
  
  if (typeof globalThis.logVerbose === 'function') {
    globalThis.logVerbose("⚠️ game-types.js is deprecated. Use automatic JSDoc system instead.");
    globalThis.logVerbose("📖 See: docs/guides/automatic-intellisense.md");
  } else {
    console.log("⚠️ game-types.js is deprecated. Use automatic JSDoc system instead.");
  }
}

// =============================================================================
// HOW THE NEW SYSTEM WORKS
// =============================================================================

/**
 * Example: Add JSDoc directly to your class methods like this:
 * 
 * // In AntManager.js:
 * class AntManager {
 *   /**
 *    * Spawn multiple ants at positions
 *    * @param {number} count - Number of ants to spawn
 *    * @param {Object} [options] - Spawn options
 *    * @returns {number} Number actually spawned  
 *    * @memberof AntManager
 *    *\/
 *   spawnAnts(count, options = {}) {
 *     // Your implementation
 *   }
 * }
 * 
 * Result: g_antManager.spawnAnts() has full IntelliSense everywhere!
 * 
 * Benefits:
 * ✅ Zero maintenance - types stay in sync with code
 * ✅ Automatic - VS Code compiles all JSDoc instantly  
 * ✅ Scalable - each developer adds JSDoc to their own files
 * ✅ Accurate - no manual type definition files to update
 */

// This file is kept for backward compatibility only.
// All new type definitions should use JSDoc comments directly in class files.

// =============================================================================
// LEGACY CONTENT REMOVED
// =============================================================================

/**
 * All type definitions have been moved to the automatic JSDoc system.
 * 
 * To add IntelliSense for your functions:
 * 1. Open your class file (e.g., AntManager.js, ButtonGroupManager.js)
 * 2. Add JSDoc comments directly to your methods
 * 3. Save the file - IntelliSense updates automatically!
 * 
 * Global variables are declared in: types/global.d.ts
 * 
 * Example JSDoc:
 * /**
 *  * Spawn ants at positions
 *  * @param {number} count - Number to spawn
 *  * @param {Object} [options] - Spawn options
 *  * @returns {number} Number spawned
 *  * @memberof AntManager
 *  *\/
 * spawnAnts(count, options = {}) { ... }
 * 
 * Result: g_antManager.spawnAnts() has full IntelliSense everywhere!
 */

console.log("✨ Use automatic JSDoc system for IntelliSense - see docs/guides/automatic-intellisense.md");