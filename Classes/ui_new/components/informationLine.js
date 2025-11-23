/**
 * Information Line Component
 * @module ui_new/components/informationLine
 *
 * This module defines the InformationLine class, which represents a single
 * line of information usually within a dropdown menu component.
 * Each information line can contain a sprite and a caption.
 */

class InformationLine {
    /**
     * Creates an InformationLine instance.
     * @param {Object} options - Configuration options for the information line.
     * @param {p5.Image} [options.sprite=null] - Optional sprite image for the line.
     * @param {string} [options.caption=""] - Caption text for the line.
     * @param {string} [options.id] - Unique identifier for the information line.
     * @param {color} [options.color=null] - Color associated with the information line.
     * @param {number} [options.textSize=12] - Text size for the caption.
     * @param {string} [options.textFont=null] - Text font for the caption.
     * @param {string} [options.textAlignment='left'] - Text alignment (left, center, right).
     * @param {number} [options.opacity=1] - Opacity of the information line (0-1).
     * @param {number} [options.padding=5] - Padding between sprite and caption.
     * @param {number} [options.paddingAbove=null] - Padding above the information line.
     * @param {number} [options.paddingBelow=null] - Padding below the information line.
     * @param {number} [options.paddingLeft=null] - Padding to the left of the information line.
     * @param {number} [options.paddingRight=null] - Padding to the right of the information line.
     * @param {string} [options.highlightColor='rgba(255, 255, 100, 0.2)'] - Highlight background color.
     */
    constructor(options = {}) {
        this.sprite = options.sprite ?? null;
        this.caption = options.caption ?? "";
        this.id = options.id ?? `infoLine_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        this.color = options.color ?? null;
        this.textSize = options.textSize ?? 12;
        this.textFont = options.textFont ?? null;
        this.textAlignment = options.textAlignment ?? 'left';
        this.opacity = options.opacity ?? 1;
        this.padding = options.padding ?? 5;
        this.paddingAbove = options.paddingAbove ?? null;
        this.paddingBelow = options.paddingBelow ?? null;
        this.paddingLeft = options.paddingLeft ?? null;
        this.paddingRight = options.paddingRight ?? null;
        this.isHighlighted = false;
        this.highlightColor = options.highlightColor ?? 'rgba(255, 255, 100, 0.2)';
        
        // Position and size (set by parent container)
        this.position = { x: 0, y: 0 };
        this.size = { width: 200, height: 32 };
        
        // Store eventBus instance for testing
        this.eventBus = eventBus;
        
        // Layout: [sprite, " : ", caption]
        this.layout = [this.sprite, " : ", this.caption];
    
        this._setupEventListeners();
    }

    setSprite(sprite) {
        this.sprite = sprite;
        this.layout[0] = sprite;
    }
    
    setCaption(caption) {
        this.caption = caption;
        this.layout[2] = caption;
    }
    
    setColor(color) {
        this.color = color;
    }
    
    setTextSize(textSize) {
        this.textSize = textSize;
    }
    
    setTextFont(textFont) {
        this.textFont = textFont;
    }
    
    setTextAlignment(textAlignment) {
        this.textAlignment = textAlignment;
    }
    
    setOpacity(opacity) {
        this.opacity = opacity;
    }
    
    setPadding(padding) {
        this.padding = padding;
    }
    
    setPaddingAbove(paddingAbove) {
        this.paddingAbove = paddingAbove;
    }
    
    setPaddingBelow(paddingBelow) {
        this.paddingBelow = paddingBelow;
    }
    
    setPaddingLeft(paddingLeft) {
        this.paddingLeft = paddingLeft;
    }
    
    setPaddingRight(paddingRight) {
        this.paddingRight = paddingRight;
    }
    
    setHighlighted(isHighlighted) {
        this.isHighlighted = isHighlighted;
    }

    _setupEventListeners() {
        // Listen for update events
        if (eventBus) {
            this.updateListener = (data) => this.update(data);
            eventBus.on(InformationLineSignals.UPDATE_INFORMATION_LINES, this.updateListener);
        }
    }

    /**
     * Render the information line
     * Layout: [sprite] " : " [caption]
     */
    render() {
        // Check if p5.js is available
        if (typeof push === 'undefined') {
            return;
        }

        push();
        
        // Apply opacity
        if (this.opacity < 1) {
            // Save current tint and apply opacity
            tint(255, 255 * this.opacity);
        }
        
        // Draw highlight background if highlighted
        if (this.isHighlighted) {
            fill(this.highlightColor);
            noStroke();
            rect(this.position.x - 2, this.position.y - 2, this.size.width + 4, this.size.height + 4, 4);
        }
        
        let currentX = this.position.x;
        const currentY = this.position.y;
        
        // Apply left padding
        if (this.paddingLeft) {
            currentX += this.paddingLeft;
        }
        
        // Draw sprite if available (layout[0])
        if (this.sprite) {
            imageMode(CORNER);
            const spriteSize = this.size.height - 4; // Leave some margin
            image(this.sprite, currentX, currentY + 2, spriteSize, spriteSize);
            currentX += spriteSize + this.padding;
        }
        
        // Draw separator " : " (layout[1])
        if (this.sprite && this.caption) {
            fill(this.color ?? 255);
            textSize(this.textSize);
            if (this.textFont) {
                textFont(this.textFont);
            }
            textAlign(LEFT, CENTER);
            text(" : ", currentX, currentY + this.size.height / 2);
            currentX += textWidth(" : ");
        }
        
        // Draw caption (layout[2])
        if (this.caption) {
            fill(this.color ?? 255);
            textSize(this.textSize);
            if (this.textFont) {
                textFont(this.textFont);
            }
            
            // Apply text alignment
            let alignment = LEFT;
            if (this.textAlignment === 'center') {
                alignment = CENTER;
            } else if (this.textAlignment === 'right') {
                alignment = RIGHT;
            }
            textAlign(alignment, CENTER);
            
            text(this.caption, currentX, currentY + this.size.height / 2);
        }
        
        // Reset tint
        if (this.opacity < 1) {
            noTint();
        }
        
        pop();
    }

    update(data) {
        // Handle update logic
        if (data?.caption !== undefined) this.setCaption(data.caption);
        if (data?.opacity !== undefined) this.setOpacity(data.opacity);
        if (data?.color !== undefined) this.setColor(data.color);
        if (data?.textSize !== undefined) this.setTextSize(data.textSize);
        if (data?.textFont !== undefined) this.setTextFont(data.textFont);
        if (data?.textAlignment !== undefined) this.setTextAlignment(data.textAlignment);
        if (data?.sprite !== undefined) this.setSprite(data.sprite);
        if (data?.padding !== undefined) this.setPadding(data.padding);
    }

    destroy() {
        // Cleanup: unsubscribe when instance is destroyed
        if (eventBus && this.updateListener) {
            eventBus.off(InformationLineSignals.UPDATE_INFORMATION_LINES, this.updateListener);
        }
    }
}

const InformationLineSignals = {
    UPDATE_INFORMATION_LINES: 'updateInformationLines',
};

// Export for Node.js test environments only
if (typeof module !== 'undefined' && module.exports && typeof window === 'undefined') {
    module.exports = { InformationLine, InformationLineSignals };
}