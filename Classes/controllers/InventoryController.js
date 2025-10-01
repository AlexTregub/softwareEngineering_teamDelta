/**
 * InventoryController
 * -------------------
 * Simple fixed-size inventory for an entity (default capacity = 2).
 * - Tracks occupant (owner) and slot array.
 * - Calls resource.pickUp(owner) when storing and resource.drop() when removing.
 */
class InventoryController {
  constructor(owner, capacity = 2) {
    this.owner = owner;
    this.capacity = Math.max(1, capacity);
    this.slots = Array(this.capacity).fill(null);
  }

  // Return number of occupied slots
  getCount() { return this.slots.filter(s => s !== null).length; }

  // Return true when inventory is full
  isFull() { return this.getCount() >= this.capacity; }

  // Return true when inventory empty
  isEmpty() { return this.getCount() === 0; }

  // Get resource at slot index (or null)
  getSlot(index) { return this.slots[index] ?? null; }

  // Return shallow array copy of current resources
  getResources() { return this.slots.slice(); }

  // Add resource to first available slot. Calls resource.pickUp(owner).
  // Returns true on success, false if full or invalid resource.
  addResource(resource) {
    if (!resource) return false;
    const idx = this.slots.findIndex(s => s === null);
    if (idx === -1) return false;
    this.slots[idx] = resource;
    if (typeof resource.pickUp === 'function') resource.pickUp(this.owner);
    return true;
  }

  // Put resource into specific slot if free. Returns true/false.
  addResourceToSlot(index, resource) {
    if (!resource || index < 0 || index >= this.capacity) return false;
    if (this.slots[index] !== null) return false;
    this.slots[index] = resource;
    if (typeof resource.pickUp === 'function') resource.pickUp(this.owner);
    return true;
  }

  // Remove resource from slot and return it. Calls resource.drop() and, if global resources array exists, returns it to ground near owner.
  removeResource(index, dropToGround = true) {
    if (index < 0 || index >= this.capacity) return null;
    const res = this.slots[index];
    if (!res) return null;
    this.slots[index] = null;
    if (typeof res.drop === 'function') res.drop();
    // Place back on ground near owner when requested and global resources exists
    if (dropToGround && typeof resources !== 'undefined' && Array.isArray(resources)) {
      const ox = (this.owner && (this.owner.posX ?? this.owner.getPosition?.().x)) || 0;
      const oy = (this.owner && (this.owner.posY ?? this.owner.getPosition?.().y)) || 0;
      if (typeof res.posX !== 'undefined') { res.posX = ox + random(-10,10); res.posY = oy + random(-10,10); }
      resources.push(res);
    }
    return res;
  }

  // Drop all items (to ground if global resources present) and clear inventory.
  dropAll() {
    for (let i = 0; i < this.capacity; i++) {
      if (this.slots[i]) this.removeResource(i, true);
    }
  }

  // Check whether inventory contains a resource of given type
  containsType(type) {
    return this.slots.some(r => r && (r.type === type));
  }

  // Try to transfer all resources into another InventoryController. Returns number transferred.
  transferAllTo(targetInventory) {
    if (!targetInventory || typeof targetInventory.addResource !== 'function') return 0;
    let transferred = 0;
    for (let i = 0; i < this.capacity; i++) {
      const r = this.slots[i];
      if (!r) continue;
      if (targetInventory.addResource(r)) {
        this.slots[i] = null;
        transferred++;
      }
    }
    return transferred;
  }
}

// Expose for browser and Node
if (typeof window !== 'undefined') window.InventoryController = InventoryController;
if (typeof module !== 'undefined' && module.exports) module.exports = InventoryController;