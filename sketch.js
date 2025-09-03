
let img;

// Load the image and create a p5.Image object.
function preload() {
  img = loadImage('/Entities/Ants/Ant.png');
}

function setup() {
  createCanvas(windowWidth, windowHight);

  // Draw the image.
  image(img, 0, 0);

  describe('Image of the underside of a white umbrella and a gridded ceiling.');
}

function draw() {
  background(220);
  ellipse(200, 200, 50, 50);
}


