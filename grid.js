let cols = 25;
let rows = 25;
let grid = [];
let cellSize;
let startCell = null;
let endCell = null;
let placing = "start"; 
let dragging = false;
let dragMode = null; 
let statusMessage = "";
let statusMessageTimeout = null;
let pathfindingInProgress = false;
let visitedCells = [];
let currentStep = 0;
let intervalID;

class Cell {
  constructor(i, j) {
    this.i = i;
    this.j = j;
    this.wall = false; 
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
  
  if (statusMessage) {
    textSize(20);
    textAlign(CENTER, CENTER);
    fill(255, 0, 0); 
    stroke(0);
    strokeWeight(2);
    text(statusMessage, width / 2, height - 30);
    noStroke();
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
      dragMode = cell.wall ? "remove" : "add";
      dragging = true;
      toggleWall(cell);
    }
  }
}

function mouseDragged() {
  if (!dragging) return;

  let i = floor(mouseX / cellSize);
  let j = floor(mouseY / cellSize);

  if (i >= 0 && i < cols && j >= 0 && j < rows) {
    let cell = grid[i][j];
    if (cell !== startCell && cell !== endCell) {
      toggleWall(cell);
    }
  }
}

function mouseReleased() {
  dragging = false;
  dragMode = null;
}

function toggleWall(cell) {
  if (dragMode === "add") {
    cell.wall = true;
  } else if (dragMode === "remove") {
    cell.wall = false;
  }
}

function showStatusMessage(message, duration = 3000) {
  statusMessage = message;
  clearTimeout(statusMessageTimeout);
  statusMessageTimeout = setTimeout(() => {
    statusMessage = "";
  }, duration);
}

function getKey(cell) {
  return `${cell.i},${cell.j}`; 
}

function getNeighbours(cell) {
  if (!cell) return [];
  
  let neighbours = [];
  let {i, j} = cell;

  if (i > 0) neighbours.push(grid[i - 1][j]); // up
  if (i < cols - 1) neighbours.push(grid[i + 1][j]); // down
  if (j > 0) neighbours.push(grid[i][j - 1]); // left
  if (j < rows - 1) neighbours.push(grid[i][j + 1]); // right

  return neighbours;
}

function redrawGrid() {
  background(255); // Clear canvas with white background

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let cell = grid[i][j];
      cell.show();
    }
  }

  for (let i = 0; i < visitedCells.length; i++) {
    let cell = visitedCells[i];
    fill(200, 200, 0); // yellow for visited cells
    noStroke();
    rect(cell.i * cellSize, cell.j * cellSize, cellSize, cellSize);
  }

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let cell = grid[i][j];
      if (cell.path) {
        fill(0, 0, 255); // blue for path cells
        noStroke();
        rect(cell.i * cellSize, cell.j * cellSize, cellSize, cellSize);
      }
    }
  }

  if (typeof enhanceGridWithFloydVisualization === 'function') {
    enhanceGridWithFloydVisualization();
  }
}

function resetGrid() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let cell = grid[i][j];
      cell.wall = false;
      cell.path = false;
    }
  }

  startCell = null;
  endCell = null;
  placing = "start";
  visitedCells = [];
  pathfindingInProgress = false;

  if (typeof resetFloydState === 'function') resetFloydState();
  redrawGrid();
}

function randomiseGrid() {
  resetGrid();

  let startI = floor(random(cols));
  let startJ = floor(random(rows));
  startCell = grid[startI][startJ];

  let endI, endJ;
  do {
    endI = floor(random(cols));
    endJ = floor(random(rows));
  } while (endI === startI && endJ === startJ); 

  endCell = grid[endI][endJ];

  // Randomly assign some walls
  let wallDensity = 0.25; 
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let cell = grid[i][j];
      if (cell !== startCell && cell !== endCell && random() < wallDensity) {
        cell.wall = true;
      }
    }
  }

  placing = "wall"; // allow user to add/remove walls afterwards if they want
  redrawGrid();
}

function reconstructPath(previous) {
  let path = [];
  let current = endCell;

  if (!previous[getKey(current)]) {
    showStatusMessage("No path found between start and end points!", 5000);
    console.log("No path found.");
    return;
  }

  while (current !== startCell) {
    path.push(current);
    current = previous[getKey(current)];
    if (!current) {
      showStatusMessage("Broken path detected, try repositioning points.", 5000);
      console.log("Broken path detected.");
      return;
    }
  }

  path.push(startCell);
  path.reverse(); 

  let pathIndex = 0;

  // Animate each step of the final path
  let interval = setInterval(() => {
    if (pathIndex < path.length) {
      let cell = path[pathIndex];
      cell.path = true;
      redrawGrid();
      pathIndex++;
    } else {
      clearInterval(interval);
    }
  }, 100); 
}