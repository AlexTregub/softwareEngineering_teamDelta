let spriteSheets = {};
let animationData = {};

function animationPreloader() {
  spriteSheets = {
    "Queen": loadImage("Images/Animation/Queen.png"),
    "Warrior": loadImage("Images/Animation/Warrior.png"),
    "Scout": loadImage("Images/Animation/Scout.png"),
    "Builder": loadImage("Images/Animation/Builder.png"),
    "Farmer": loadImage("Images/Animation/Farmer.png"),
    
    // "Spitter": loadImage("Images/Animation/Spitter.png"),
  };
}

animationData = {
    "Walking": { 
        row: 1,          
        width: 16,
        height: 16,
        totalFrames: 2,
        frameDelay: 40,
        currentFrame: 0,
    },
    "Attack": { 
        row: 3,          
        width: 16,
        height: 16,
        totalFrames: 2,
        frameDelay: 50,
        currentFrame: 0,
    },
}

class AnimationManager {

    constructor() {}

    isAnimation(animationName){
        if(Object.keys(animationData).includes(animationName)){
            return true
        }
        return false;
    }

    play(antObj, animationName) {
        let job = antObj.jobName;
        let sheet = spriteSheets[job];
        let anim = animationData[animationName];
        if (!sheet || !anim) return;

        // update frame on delay
        if (frameCount % anim.frameDelay === 0) {
            // compute pixel coordinates
            let x = anim.currentFrame * anim.width;
            let y = anim.row * anim.height;

            // grab current frame from the sprite sheet
            let frame = sheet.get(x, y, anim.width, anim.height);
            antObj.setImage(frame);
            antObj.setSize(55, 55);

            // move to next frame or reset
            anim.currentFrame += 1;
            if (anim.currentFrame >= anim.totalFrames) {
            anim.currentFrame = 0;
            if (anim.default) {
                antObj.setImage(anim.default);
                antObj.setSize(55, 55);
            }
            }

        }
    }
}
