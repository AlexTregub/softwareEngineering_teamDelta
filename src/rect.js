push();
  strokeWeight(strokeWidth);
  if (shouldStroke) {
    // Use p5.color(...) when alpha is present so we pass a single Color object to stroke()
    if (typeof sCol.a !== 'undefined' && typeof color === 'function') {
      stroke(color(sCol.x, sCol.y, sCol.z, sCol.a));
    } else {
      stroke(sCol.x, sCol.y, sCol.z);
    }
  } else {
    noStroke();
  }

  if (shouldFill) {
    if (typeof fCol.a !== 'undefined' && typeof color === 'function') {
      fill(color(fCol.x, fCol.y, fCol.z, fCol.a));
    } else {
      fill(fCol.x, fCol.y, fCol.z);
    }
  } else {
    noFill();
  }

  rect(pos.x ?? pos[0] ?? 0, pos.y ?? pos[1] ?? 0, size.x ?? size[0] ?? 0, size.y ?? size[1] ?? 0);
  pop();