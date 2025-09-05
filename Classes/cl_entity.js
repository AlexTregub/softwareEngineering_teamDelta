// Entity objects can interact with world

class entity extends stats {
    global_pos // Vector3, entity position on the in the world 
    size

  constructor(global_x,global_y,size,drawLayer) {
    this.global_x = global_x;
    this.global_y = global_y;
    this.size = size;
    this.drawLayer = drawLayer;
  };
      
 
}