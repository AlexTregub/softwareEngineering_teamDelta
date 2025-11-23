// /**
//  * GameUIOverlay Component
//  * @module ui_new/components/gameUIOverlay
//  * 
//  * Main UI overlay for game screen that manages and renders multiple UI components.
//  * Provides a container for game-related UI elements that should be rendered on top of gameplay.
//  */

// class GameUIOverlay {
//     /**
//      * Create a GameUIOverlay
//      * @param {Object} p5Instance - p5.js instance for rendering
//      * @param {Object} [options={}] - Configuration options
//      * @param {boolean} [options.visible=true] - Initial visibility state
//      */
//     constructor(p5Instance, options = {}) {
//         this.p5 = p5Instance;
//         this.components = new Map();
//         this.isVisible = options.visible !== false;
//     }
//     
//     /**
//      * Add a component to the overlay
//      * @param {string} id - Component identifier
//      * @param {Object} component - Component instance with render() method
//      */
//     addComponent(id, component) {
//         this.components.set(id, component);
//     }
//     
//     /**
//      * Get a component by id
//      * @param {string} id - Component identifier
//      * @returns {Object|null} Component instance or null if not found
//      */
//     getComponent(id) {
//         return this.components.get(id) || null;
//     }
//     
//     /**
//      * Remove a component from the overlay
//      * @param {string} id - Component identifier
//      */
//     removeComponent(id) {
//         const component = this.components.get(id);
//         if (component) {
//             if (typeof component.destroy === 'function') {
//                 component.destroy();
//             }
//             this.components.delete(id);
//         }
//     }
//     
//     /**
//      * Show the overlay
//      */
//     show() {
//         this.isVisible = true;
//     }
//     
//     /**
//      * Hide the overlay
//      */
//     hide() {
//         this.isVisible = false;
//     }
//     
//     /**
//      * Toggle visibility
//      */
//     toggle() {
//         this.isVisible = !this.isVisible;
//     }
//     
//     /**
//      * Update all components (called before render)
//      * @private
//      */
//     _updateComponents() {
//         this.components.forEach(component => {
//             if (typeof component.update === 'function') {
//                 component.update();
//             }
//         });
//     }
//     
//     /**
//      * Render all components
//      */
//     render() {
//         if (!this.isVisible) return;
//         
//         this._updateComponents();
//         
//         this.components.forEach(component => {
//             if (typeof component.render === 'function') {
//                 component.render();
//             }
//         });
//     }
//     
//     /**
//      * Cleanup and destroy all components
//      */
//     destroy() {
//         this.components.forEach(component => {
//             if (typeof component.destroy === 'function') {
//                 component.destroy();
//             }
//         });
//         this.components.clear();
//     }
// }

// // Export for Node.js and browser
// if (typeof module !== 'undefined' && module.exports) {
//     module.exports = GameUIOverlay;
// }

// // Browser global
// if (typeof window !== 'undefined') {
//     window.GameUIOverlay = GameUIOverlay;
// }
