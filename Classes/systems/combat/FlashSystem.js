class FinalFlash{
    /*Final Flash
        Should be like final flash from DBZ
            Beam that charges as you hold down
            Multiple layers for shading effect
            Damage enemies in its path
            Fades after time
            Shoots whatever direction mouse points at
            Should be parabolic shape?
            MAKE SURE TO ADD FUN MUSIC
    */
    constructor(startX, startY, targetX, targetY){
        //Position Info
        this._x = startX;
        this._y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.angle = atan2(targetY - _y, targetX - _x);

        //Constant Beam info
        this.duration = 7000; //7 seconds
        this.width = 12;
        this.length = 20000; //Spans larger than the map (Grandiose (as it should be))
        this.damage = 0; //Damage increases over charge time
        this.beamSpeed = 700; //700 pixles per second

        //Beam specific info
        this.charging = false;
    }
    startCharging(){
        //Gradually increses 
    }
    fire(){
        //Displays beam
    }
}

class FinalFlashManager{
    constructor(){
        this.finalFlash = null;
        this.cooldown = 180000; //3 Minute cooldown (Since it's busted)
        this.lastFire = 0;
        this.canFire = false;
    }

    createFlash(startX, startY, targetX, targetY){
        this.finalFlash = new FinalFlash(startX, startY, targetX, targetY); //Can only have one
    }

    handleInput(){
        if(mouseIsPressed && this.canFire){ //If mouse pressed and cooldown over
            this.finalFlash.startCharging(); //Charge (starts power)
        }
        if(!mouseIsPressed && this.finalFlash.charging){ //If mouse let go while charging
            this.fireBeam(); //Fire final flash
        }
    }

    fireBeam(){ //Fires beams and resets counters
        this.canFire = false;
        this.lastFire = millis();
        this.finalFlash.fire();
    }

    update(){
        if(!this.canFire && (millis() - this.lastFire) > this.cooldown){ //If on cooldown and cooldown over
            this.canFire = true; //Allow next attack
        }
        this.finalFlash.update(); //Update final flash
    }
}

// let alpha = 0.005;      // Controls how wide the beam fans out
// let beamSpeed = 700;    // How fast it extends
// let maxLength = 20000;    // Max beam length
// let startTime;
// let originX, originY;
// let targetX, targetY;
// let mousePressTime = 0;
// let isMousePressedFlag = false;
// let isBeamActive = false;
// let chargedPower = 1.0;
// let beamFadeStartTime = 0;
// let isBeamFading = false;
// let fadeDuration = 500; // How long the fade out takes in milliseconds
// let beamDuration = 2000; // How long the beam stays active before fading (milliseconds)

// function setup() {
//   createCanvas(800, 400);
//   originX = 150;
//   originY = height / 2;
//   startTime = millis();
//   targetX = originX + 1; // avoid divide by zero
//   targetY = originY;
//   noStroke();
// }

// function draw() {
//   background(10, 10, 30);
  
//   let t = (millis() - startTime) / 400;
//   let L = isBeamActive ? min(beamSpeed * t, maxLength) : 0;
  
//   // Calculate power while charging
//   if (isMousePressedFlag) {
//     let pressDuration = millis() - mousePressTime;
//     // Power increases with press duration, capped at 3x normal power
//     chargedPower = min((pressDuration / 1000) * 0.3, 3.0);
//   }
  
//   // Check if beam should start fading (after beamDuration has passed)
//   if (isBeamActive && !isBeamFading && (millis() - startTime) > beamDuration) {
//     isBeamFading = true;
//     beamFadeStartTime = millis();
//   }
  
//   // Calculate angle toward target
//   let angle = atan2(targetY - originY, targetX - originX);

//   // Draw beam only if active and not completely faded
//   if (isBeamActive && !(isBeamFading && millis() - beamFadeStartTime >= fadeDuration)) {
//     push();
//     translate(originX, originY);
//     rotate(angle);
    
//     // Calculate fade progress (0 to 1)
//     let fadeProgress = 0;
//     if (isBeamFading) {
//       fadeProgress = min((millis() - beamFadeStartTime) / fadeDuration, 1.0);
//     }
    
//     // Apply power to beam properties
//     let currentAlpha = alpha * chargedPower;
//     let glowOpacity = 80 * chargedPower;
//     let coreOpacity = 200 * min(chargedPower, 1.5); // Don't make core too bright
    
//     // Apply fade to opacity
//     if (isBeamFading) {
//       glowOpacity *= (1 - fadeProgress);
//       coreOpacity *= (1 - fadeProgress);
//     }
    
//     fill(255, 255, 100, glowOpacity);
//     drawBeam(L, currentAlpha * 2, fadeProgress);

//     // Outer glow
//     fill(255, 255, 100, glowOpacity * 0.75);
//     drawBeam(L, currentAlpha * 1.4, fadeProgress);

//     // Core - gets brighter with power
//     fill(255, 255, 0, coreOpacity);
//     drawBeam(L, currentAlpha, fadeProgress);

//     pop();
    
//     // Check if fade is complete
//     if (isBeamFading && fadeProgress >= 1.0) {
//       isBeamActive = false;
//       isBeamFading = false;
//     }
//   }

//   // Origin (energy source) - shows charging state with growing size and changing pulse
//   let baseSize = 30;
//   let sourceSize = baseSize;
//   let sourceBrightness = 120;
  
//   if (isMousePressedFlag) {
//     // Growing effect while charging - size increases with power
//     let sizeMultiplier = 1.0 + (chargedPower - 1.0) * 0.8; // Grow up to 2.6x size
//     sourceSize = baseSize * sizeMultiplier;
    
//     // Pulse rate increases with power (faster pulsing as it charges)
//     let pulseRate = 0.01 + (chargedPower - 1.0) * 0.02; // Speed up pulse rate
//     let pulseIntensity = 10 + (chargedPower - 1.0) * 5; // Stronger pulses as it grows
    
//     let pulse = pulseIntensity * sin(millis() * pulseRate);
//     sourceSize += pulse;
//     sourceBrightness = 120 + 100 * sin(millis() * pulseRate);
//     fill(255, 255, sourceBrightness);
//   } else if (isBeamActive) {
//     // Active beam state - shrink back after firing
//     sourceSize = baseSize * min(chargedPower, 1.5);
//     sourceBrightness = 120 * min(chargedPower, 2.0);
//     fill(255, 255, sourceBrightness);
//   } else {
//     // Idle state
//     fill(255, 255, sourceBrightness);
//   }
  
//   ellipse(originX, originY, sourceSize, sourceSize);
  
//   // Display power level and instructions
//   fill(255);
//   textSize(16);
//   if (isMousePressedFlag) {
//     text("Charging: " + chargedPower.toFixed(1) + "x", 20, 30);
//     text("Release to fire!", 20, 50);
//   } else if (isBeamActive) {
//     let timeLeft = beamDuration - (millis() - startTime);
//     if (isBeamFading) {
//       text("Power: " + chargedPower.toFixed(1) + "x", 20, 30);
//       text("Beam fading...", 20, 50);
//     } else {
//       text("Power: " + chargedPower.toFixed(1) + "x", 20, 30);
//       text("Time left: " + (timeLeft/1000).toFixed(1) + "s", 20, 50);
//     }
//   } else {
//     text("Power: " + chargedPower.toFixed(1) + "x", 20, 30);
//     text("Click and hold to charge beam", 20, 50);
//   }
  
//   // Show charging progress bar when charging
//   if (isMousePressedFlag) {
//     let progress = (chargedPower - 1.0) / 2.0; // Convert to 0-1 range
//     drawProgressBar(20, 70, 200, 20, progress);
//   }
  
//   // Show beam duration progress bar when beam is active
//   if (isBeamActive && !isBeamFading) {
//     let beamProgress = (millis() - startTime) / beamDuration;
//     drawProgressBar(20, 100, 200, 10, beamProgress, color(0, 255, 255));
//   }
// }

// function drawBeam(length, a, fadeProgress = 0) {
//   let flareLength = 100;
//   let maxWidth = a * flareLength * flareLength;
  
//   // Apply fade to width - beam shrinks from sides
//   let widthMultiplier = 1.0 - fadeProgress;

//   beginShape();
//   // Top edge - from origin to tip
//   for (let x = 0; x <= length; x += 10) {
//     let w = (x < flareLength) ? maxWidth * sin((x / flareLength) * HALF_PI) : maxWidth;
//     w *= widthMultiplier; // Shrink width based on fade progress
//     vertex(x, -w);
//   }
//   // Bottom edge - from tip back to origin
//   for (let x = length; x >= 0; x -= 10) {
//     let w = (x < flareLength) ? maxWidth * sin((x / flareLength) * HALF_PI) : maxWidth;
//     w *= widthMultiplier; // Shrink width based on fade progress
//     vertex(x, w);
//   }
//   endShape();
// }

// function drawProgressBar(x, y, w, h, progress, barColor = null) {
//   // Background
//   fill(100);
//   rect(x, y, w, h);
  
//   // Progress
//   if (barColor) {
//     fill(barColor);
//   } else {
//     fill(255, 255, 0);
//   }
//   rect(x, y, w * progress, h);
  
//   // Border
//   noFill();
//   stroke(255);
//   strokeWeight(1);
//   rect(x, y, w, h);
//   noStroke();
// }

// function mousePressed() {
//   targetX = mouseX;
//   targetY = mouseY;
//   mousePressTime = millis();
//   isMousePressedFlag = true;
//   isBeamActive = false;
//   isBeamFading = false;
//   chargedPower = 1.0; // Reset to minimum power
// }

// function mouseReleased() {
//   if (isMousePressedFlag) {
//     isMousePressedFlag = false;
//     isBeamActive = true;
//     isBeamFading = false;
//     startTime = millis(); // Start the beam animation
//   }
// }