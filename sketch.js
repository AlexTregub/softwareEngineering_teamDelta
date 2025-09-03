let ant1;

function setup() {
  createCanvas(640, 480);
  background(204);
  // Call handleImage() once the image loads or
  // call handleError() if an error occurs.

  
}

function draw(){
}

function mousePressed(){
  ant1 = loadImage('Images/Ant_tn.png', handleImage, handleError);
}

// Display the image.
function handleImage(img) {
  imageMode(CENTER);
  image(img, mouseX, mouseY, 30, 15);
  
  describe('ant');
}

// Log the error.
function handleError(event) {
  console.error('Oops!', event);
}
