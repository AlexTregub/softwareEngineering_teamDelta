// Event flags
// Render flags, These flags tell the program what canvas layer has been rendered
// If the layer has been rendered, set to true / 1.
// When the flag is set to 0, the next time a draw is ran, CanvasObjects will render to the screen according 
// to MAP_Layer hierarchy (lowest -> highest). 
let Rendered_BG = 0;
let Rendered_Decor = 0;
let Rendered_Ground = 0;
let Rendered_Hill = 0;
let Rendered_Flying = 0;
let Rendered_UI = 0;
let Rendered_Menu = 0;

function ResetFlags(){
  Rendered_BG = 0;
  Rendered_Decor = 0;
  Rendered_Ground = 0;
  Rendered_Hill = 0;
  Rendered_Flying = 0;
  Rendered_UI = 0;
  Rendered_Menu = 0;
}

