function textNoStroke(textArg,style) {
    push(); 
    noStroke();
    rectMode(CENTER)
    if (!containsEmoji(textArg)) textFont(style.textFont); 
    textSize(style.textSize);
    fill(style.textColor);  // white text
    textAlign(...style.textAlign);
    textArg();
    pop();
}

function containsEmoji(str) {
  return /[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}]/u.test(str);
}