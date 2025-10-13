// Shared debug rendering helper for entities
const DebugRenderer = {
  renderEntityDebug(entity) {
    try {
      if (typeof devConsoleEnabled === 'undefined' || !devConsoleEnabled) return;

      const pos = entity.getPosition ? entity.getPosition() : (entity._sprite && entity._sprite.pos) || { x: entity.posX, y: entity.posY };
      if (!pos || !entity.getCurrentState) return;

      if (typeof push === 'function') push();
      if (typeof noStroke === 'function') noStroke();
      if (typeof fill === 'function') fill(255);
      if (typeof textAlign === 'function') textAlign(LEFT);
      if (typeof textSize === 'function') textSize(10);

      if (typeof text === 'function') {
        text(`State: ${entity.getCurrentState()}`, pos.x, pos.y - 30);
        text(`Faction: ${entity._faction || entity.faction || 'unknown'}`, pos.x, pos.y - 20);
        if (entity.getEffectiveMovementSpeed && typeof entity.getEffectiveMovementSpeed === 'function') {
          const sp = entity.getEffectiveMovementSpeed();
          text(`Speed: ${typeof sp === 'number' ? sp.toFixed(1) : sp}`, pos.x, pos.y - 10);
        }
      }

      if (typeof pop === 'function') pop();
    } catch (e) {
      // best-effort, do not throw from debug renderer
      if (typeof console !== 'undefined') console.warn('DebugRenderer.renderEntityDebug error', e);
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DebugRenderer;
} else {
  // Attach to window for immediate global fallback usage
  if (typeof window !== 'undefined') window.DebugRenderer = DebugRenderer;
}
