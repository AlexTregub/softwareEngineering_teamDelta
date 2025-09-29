/**
 * DropoffLocation
 * ---------------
 * Small, immobile dropoff that:
 *  - owns a small InventoryController (default capacity 2)
 *  - occupies a rectangle of grid tiles (grid coords)
 *  - can expand/retract (change tile footprint)
 *  - optionally marks a Grid instance with itself
 *  - draws the tiles it occupies in semi-opaque blue
 *
 * Usage:
 *   const d = new DropoffLocation(5,4,2,2,{tileSize:32,capacity:2,grid:myGrid});
 *   d.draw();            // render blue tiles
 *   d.expand(1,0);       // +1 tile width
 *   d.retract(0,1);      // -1 tile height
 *   d.depositResource(res);
 */
class DropoffLocation {
  constructor(gridX, gridY, widthTiles = 1, heightTiles = 1, opts = {}) {
    this.x = Math.floor(gridX);
    this.y = Math.floor(gridY);
    this.width = Math.max(1, Math.floor(widthTiles));
    this.height = Math.max(1, Math.floor(heightTiles));
    this.tileSize = opts.tileSize || (typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 32);
    this.grid = opts.grid || null; // optional Grid instance to mark
    // inventory: prefer provided InventoryController or global one
    const Inventory = (typeof opts.InventoryController !== 'undefined') ? opts.InventoryController :
                      (typeof InventoryController !== 'undefined') ? InventoryController : null;
    this.inventory = Inventory ? new Inventory(this, opts.capacity || 2) : null;
    this._filledOnGrid = false;
    if (this.grid) this._markGrid();
  }

  // Return array of tile coords this dropoff currently covers
  tiles() {
    const out = [];
    for (let yy = 0; yy < this.height; yy++) {
      for (let xx = 0; xx < this.width; xx++) {
        out.push([this.x + xx, this.y + yy]);
      }
    }
    return out;
  }

  // Mark the Grid (if provided) with this object at each tile (uses grid.set)
  _markGrid() {
    if (!this.grid) return;
    try {
      for (const t of this.tiles()) {
        this.grid.set(t, this);
      }
      this._filledOnGrid = true;
    } catch (e) {
      // don't throw in render code; log for debug
      console.warn("DropoffLocation._markGrid failed:", e);
    }
  }

  // Unmark grid tiles (set to NONE) — safe if grid exists
  _unmarkGrid() {
    if (!this.grid || !this._filledOnGrid) return;
    try {
      for (const t of this.tiles()) {
        this.grid.set(t, NONE);
      }
      this._filledOnGrid = false;
    } catch (e) { console.warn("DropoffLocation._unmarkGrid failed:", e); }
  }

  // Expand footprint by tile deltas (can be negative -> retract)
  expand(dx = 1, dy = 0) {
    if (dx === 0 && dy === 0) return;
    this._unmarkGrid();
    this.width = Math.max(1, this.width + dx);
    this.height = Math.max(1, this.height + dy);
    this._markGrid();
  }

  // Retract by absolute amounts (keeps at least 1x1)
  retract(dx = 1, dy = 0) {
    this.expand(-Math.abs(dx), -Math.abs(dy));
  }

  // Set absolute footprint
  setSize(widthTiles, heightTiles) {
    this._unmarkGrid();
    this.width = Math.max(1, Math.floor(widthTiles));
    this.height = Math.max(1, Math.floor(heightTiles));
    this._markGrid();
  }

  // Try to add a resource into inventory. Returns true on success.
  depositResource(resource) {
    if (!this.inventory) return false;
    return this.inventory.addResource(resource);
  }

  // Try to pull resources from an ant-like object that has an inventory or getResources()
  // returns number transferred
  acceptFromCarrier(carrier) {
    if (!carrier || !this.inventory) return 0;
    // carrier.inventory.transferAllTo exists? use it
    try {
      if (carrier.inventory && typeof carrier.inventory.transferAllTo === 'function') {
        return carrier.inventory.transferAllTo(this.inventory);
      }
      // otherwise, attempt to move slot-by-slot via getResources/addResource
      if (typeof carrier.getResources === 'function') {
        const res = carrier.getResources();
        let moved = 0;
        for (let i = 0; i < res.length; i++) {
          if (!res[i]) continue;
          if (this.inventory.addResource(res[i])) {
            // if carrier has removeResource, call it
            if (typeof carrier.removeResource === 'function') carrier.removeResource(i, false);
            else carrier.getResources()[i] = null;
            moved++;
          }
        }
        return moved;
      }
    } catch (e) {
      console.warn("DropoffLocation.acceptFromCarrier error:", e);
    }
    return 0;
  }

  // Draw blue overlay on occupied tiles. Uses p5 drawing functions.
  draw() {
    if (typeof push !== 'function') return; // p5 not available
    push();
    noStroke();
    fill(0, 0, 255, 120);
    for (const t of this.tiles()) {
      const px = t[0] * this.tileSize;
      const py = t[1] * this.tileSize;
      rect(px, py, this.tileSize, this.tileSize);
    }
    // draw thin outline
    stroke(0, 0, 200, 200);
    strokeWeight(2);
    noFill();
    rect(this.x * this.tileSize, this.y * this.tileSize, this.width * this.tileSize, this.height * this.tileSize);
    pop();
  }

  // Convenience: world pixel center
  getCenterPx() {
    const cx = (this.x + this.width / 2) * this.tileSize;
    const cy = (this.y + this.height / 2) * this.tileSize;
    return { x: cx, y: cy };
  }
}

// Expose to browser and Node
if (typeof window !== 'undefined') window.DropoffLocation = DropoffLocation;
if (typeof module !== 'undefined' && module.exports) module.exports = DropoffLocation;
