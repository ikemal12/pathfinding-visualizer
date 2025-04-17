let cols = 25;
let rows = 25;
let grid = [];
let cellSize;
let startCell = null;
let endCell = null;
let placing = "start"; // or "end", or "wall"

class Cell {
    constructor(i, j) {
      this.i = i;
      this.j = j;
      this.wall = false; // can become true for obstacles
    }
  
    show() {
        stroke(200);
      
        if (this === startCell) {
          fill(0, 255, 0); // green for start
        } else if (this === endCell) {
          fill(255, 0, 0); // red for end
        } else if (this.path) {
          fill(0, 0, 255); // blue for path
        } else {
          fill(this.wall ? 0 : 255); // black for walls, white for open space
        }
      
        rect(this.i * cellSize, this.j * cellSize, cellSize, cellSize);
      }
      
  }

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

function mousePressed() {
    let i = floor(mouseX / cellSize);
    let j = floor(mouseY / cellSize);
  
    if (i >= 0 && i < cols && j >= 0 && j < rows) {
      let cell = grid[i][j];
  
      if (placing === "start" && cell !== endCell) {
        startCell = cell;
        placing = "end"; 
      } else if (placing === "end" && cell !== startCell) {
        endCell = cell;
        placing = "wall"; 
      } else if (placing === "wall" && cell !== startCell && cell !== endCell) {
        cell.wall = !cell.wall;
      }
    }
  }

  function runDijkstra() {
    if (!startCell || !endCell) return;
  
    let distances = {};
    let previous = {};
    let unvisited = [];
  
    // Initialise distances and previous cells
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let cell = grid[i][j];
        let key = getKey(cell);
        distances[key] = Infinity;
        previous[key] = null;
        if (!cell.wall) unvisited.push(cell);
      }
    }
  
    distances[getKey(startCell)] = 0;
  
    while (unvisited.length > 0) {
      let current = getMinDistanceCell(unvisited, distances);
      if (!current) break;
  
      if (current === endCell) {
        reconstructPath(previous);
        return;
      }
  
      unvisited = unvisited.filter(c => c !== current);
  
      let neighbours = getNeighbours(current); 
      for (let neighbour of neighbours) {
        if (!unvisited.includes(neighbour)) continue;
  
        let alt = distances[getKey(current)] + 1;
  
        if (alt < distances[getKey(neighbour)]) {
          distances[getKey(neighbour)] = alt;
          previous[getKey(neighbour)] = current;
        }
      }
    }
  
    console.log("No path found.");
  }  

  function getKey(cell) {
    return `${cell.i},${cell.j}`; 
  }

  function getNeighbours(cell) {
    let neighbours = [];
    let {i, j} = cell;

    // Check all possible directions (up, down, left, right)
    if (i > 0) neighbours.push(grid[i - 1][j]); // up
    if (i < cols - 1) neighbours.push(grid[i + 1][j]); // down
    if (j > 0) neighbours.push(grid[i][j - 1]); // left
    if (j < rows - 1) neighbours.push(grid[i][j + 1]); // right

    return neighbours;
  }

  function getMinDistanceCell(unvisited, distances) {
    let minDist = Infinity;
    let minCell = null;
  
    for (let cell of unvisited) {
      let dist = distances[getKey(cell)];
      if (dist < minDist) {
        minDist = dist;
        minCell = cell;
      }
    }
  
    return minCell;
  }  

  function reconstructPath(previous) {
    let path = [];
    let current = endCell;
  
    if (!previous[getKey(current)]) {
      console.log("No path found.");
      return;
    }
  
    while (current !== startCell) {
      path.push(current);
      current = previous[getKey(current)];
  
      if (!current) {
        console.log("Broken path detected.");
        return;
      }
    }
  
    path.push(startCell);
    path.reverse();
  
    for (let cell of path) {
      cell.path = true;
    }
  
    redrawGrid();
  }  

  function redrawGrid() {
    background(255); // clear canvas with white background

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        grid[i][j].show();
      }
    }
  }
