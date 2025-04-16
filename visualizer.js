let cols = 25;
let rows = 25;
let grid = [];
let cellSize;

function setup() {
  createCanvas(600, 600);
  cellSize = width / cols;
  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      grid[i][j] = new Cell(i, j);
    }
  }
}

function draw() {
  background(255);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j].show();
    }
  }
}

class Cell {
  constructor(i, j) {
    this.i = i;
    this.j = j;
    this.wall = false; // can become true for obstacles
  }

  show() {
    stroke(200);
    fill(this.wall ? 0 : 255);
    rect(this.i * cellSize, this.j * cellSize, cellSize, cellSize);
  }
}
