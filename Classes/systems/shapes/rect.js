
/**
 * rectCustom Utility
 * ------------------
 * Draws a rectangle with custom stroke and fill colors and optional
 * stroke/fill toggles. This is a small helper around p5.js drawing
 * functions that accepts simple vector-like objects for colors and
 * position/size.
 *
 * Parameters
 * @param {{x:number,y:number,z:number}} strokeColor
 *   Stroke color as an object with numeric x/y/z properties mapping to
 *   R/G/B channels (0-255). If `shouldStroke` is false this parameter
 *   is ignored.
 * @param {{x:number,y:number,z:number}} fillColor
 *   Fill color as an object with numeric x/y/z properties mapping to
 *   R/G/B channels (0-255). If `shouldFill` is false this parameter
 *   is ignored.
 * @param {number} [strokeWidth=1]
 *   Optional stroke weight in pixels. The implementation reads a
 *   `strokeW` variable from the surrounding scope; pass a numeric
 *   `strokeW` variable into the scope before calling if you need a
 *   specific width.
 * @param {{x:number,y:number}} pos
 *   Top-left position of the rectangle in screen pixels.
 * @param {{x:number,y:number}} size
 *   Width/height of the rectangle in pixels (size.x = width,
 *   size.y = height).
 * @param {boolean} shouldFill
 *   If true the rectangle will be filled with `fillColor`. If false no
 *   fill will be applied.
 * @param {boolean} shouldStroke
 *   If true the rectangle will be stroked with `strokeColor`. If false no
 *   stroke will be applied.
 *
 * Example
 *   // uses scoped strokeW variable
 *   strokeW = 2;
 *   rectCustom({x:0,y:0,z:0}, {x:255,y:0,z:0}, {x:10,y:10}, {x:100,y:50}, true, true);
 */
function rectCustom(strokeColor, fillColor, strokeWidth, pos, size, shouldFill, shouldStroke) {
    push();
    strokeWeight(strokeWidth);
    if (shouldStroke) { stroke(strokeColor.x, strokeColor.y, strokeColor.z); } else { noStroke(); }
    if (shouldFill) { fill(fillColor.x, fillColor.y, fillColor.z); } else { noFill(); }
    rect(pos.x, pos.y, size.x, size.y);
    pop();
}