/**
 * circleNoFill Utility
 * --------------------
 * Draws a circle with no fill and a custom stroke color.
 * @arg {Vector3} color    - An vector3 with x, y, z properties representing RGB values (e.g., {x:255, y:0, z:0} for red).
 * @arg {Vector2} pos      - An vector2 with x, y properties representing the center position of the circle.
 * @arg {Number} diameter - The diameter of the circle in pixels.
 * @arg {Number} strokeW  - The stroke weight in pixels.
 *   
 * Example:
 *   circleNoFill({x:0, y:120, z:255}, {x:100, y:100}, 50);
 *
 * This function uses p5.js drawing context.
 */
function circleNoFill(color,pos,diameter,strokeW){
    push();
    noFill();
    strokeWeight(strokeW);
    stroke(color.x,color.y,color.z);
    circle(pos.x,pos.y,diameter);
    pop();
}

/**
 * circleFill Utility
 * --------------------
 * Draws a filled circle with no stroke.
 * @arg {Vector3} color    - An object with x, y, z properties representing RGB values for the fill.
 * @arg {Vector2} pos      - An object with x, y properties representing the center position of the circle.
 * @arg {Number}  diameter - The diameter of the circle in pixels.
 *
 * Example:
 *   circleFill({x:255, y:0, z:0}, {x:100, y:100}, 50);
 *
 * This function uses p5.js drawing context.
 */
function circleFill(color, pos, diameter) {
    push();
    noStroke();
    fill(color.x, color.y, color.z);
    circle(pos.x, pos.y, diameter);
    pop();
}

/**
 * circleCustom Utility
 * --------------------
 * Draws a circle with custom stroke and fill colors.
 * @arg {Vector3} clr1     - An object with x, y, z properties representing RGB values for the stroke.
 * @arg {Vector3} clr2     - An object with x, y, z properties representing RGB values for the fill.
 * @arg {Vector2} pos      - An object with x, y properties representing the center position of the circle.
 * @arg {Number}  diameter - The diameter of the circle in pixels.
 * @arg {Number}  strokeW  - The stroke weight in pixels.
 *
 * Example:
 *   circleCustom({x:0, y:120, z:255}, {x:255, y:255, z:0}, {x:100, y:100}, 50, 3);
 *
 * This function uses p5.js drawing context.
 */
function circleCustom(clr1, clr2, pos, diameter, strokeW) {
    push();
    strokeWeight(strokeW);
    stroke(clr1.x, clr1.y, clr1.z);
    fill(clr2.x, clr2.y, clr2.z);
    circle(pos.x, pos.y, diameter);
    pop();
}