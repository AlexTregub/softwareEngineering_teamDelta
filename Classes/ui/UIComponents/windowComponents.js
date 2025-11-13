/**
 *  Window Components
 *  Small classes that don't really need their own files
 *  These are meant to be used to build windows
 */


/**
 * Modal Window Overlay:
 * Draws a full screen semi-transparent background, by default it would be black
 * For this to achieve the desired effect, render after objects you want covered up
 * but before objects you want full visable. This will start rendering in the top left corner,
 * so size only determines how large it is.
 * @param {Vector2} size - size of the screen for the overlay to cover
 * @param {Color} color - color of the overlay, defaults to black
 */
class modalWindowOverlay {
    constructor (color = (0,0,0,125), size = createVector(windowWidth,windowHeight)){
        this.size = size
        this.color = color
        this.buffer = buffer
    }

    /**
     * Change the size of the overlay
     * @param {Vector2} size - new size of the overlay screen
     */
    setSize(size) {
        this.size = size
    }

    /**
     * Render semi-transparent background
     * @param {p5.Graphics} buffer - Graphics buffer to render to
     */
    render(buffer) {
        const width = this.size ? this.size.x : buffer.width;
        const height = this.size ? this.size.y : buffer.height;
        
        buffer.fill(this.color[0], this.color[1], this.color[2], this.color[3]);
        buffer.noStroke();
        buffer.rect(0, 0, width, height);
    }
}