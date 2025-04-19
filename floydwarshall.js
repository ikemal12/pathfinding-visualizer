let floydMatrix = [];
let floydPath = [];
let floydInProgress = false;
let intermediateCell = null;
let currentlyProcessingCells = [];
let visitedInFloyd = new Set(); 
let pathAnimationInProgress = false;
let batchProcessingComplete = false;

function runFloydWarshall() {
  if (pathfindingInProgress || !startCell || !endCell) return;
  
  pathfindingInProgress = true;
  floydInProgress = true;
  batchProcessingComplete = false;
  visitedCells = [];
  currentlyProcessingCells = [];
  intermediateCell = null;
  visitedInFloyd = new Set();
  statusMessage = "Running Floyd-Warshall algorithm..."; 
  
  initializeFloydMatrices();
  calculateFloydWarshall();
}

function initializeFloydMatrices() {
  let cellIndices = new Map(); 
  let indexToCells = []; 
  let index = 0;
  
  // First pass: identify non-wall cells and assign indices
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (!grid[i][j].wall) {
        cellIndices.set(`${i},${j}`, index);
        indexToCells[index] = {i, j};
        index++;
      }
    }
  }
  
  const totalValidCells = index;
  
  floydMatrix = Array(totalValidCells).fill().map(() => Array(totalValidCells).fill(Infinity));
  floydPath = Array(totalValidCells).fill().map(() => Array(totalValidCells).fill(null));
  
  // Set up initial distances
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j].wall) continue;
      
      const cellIndex = cellIndices.get(`${i},${j}`);
      floydMatrix[cellIndex][cellIndex] = 0;
      
      // Check direct neighbors
      let neighbors = getNeighbours(grid[i][j]);
      for (let neighbor of neighbors) {
        if (!neighbor.wall) {
          const neighborIndex = cellIndices.get(`${neighbor.i},${neighbor.j}`);
          floydMatrix[cellIndex][neighborIndex] = 1;
          floydPath[cellIndex][neighborIndex] = neighborIndex;
        }
      }
    }
  }
  
  floydMatrix.cellIndices = cellIndices;
  floydMatrix.indexToCells = indexToCells;
}

function calculateFloydWarshall() {
  const cellIndices = floydMatrix.cellIndices;
  const indexToCells = floydMatrix.indexToCells;
  const totalCells = indexToCells.length;

  let significantUpdates = [];
  let kProgress = 0;
  const batchSize = Math.max(10, Math.floor(totalCells / 20)); // Process 5% of cells per batch
  
  function processNextBatch() {
    if (kProgress >= totalCells) {
      batchProcessingComplete = true;
      const startIndex = cellIndices.get(`${startCell.i},${startCell.j}`);
      const endIndex = cellIndices.get(`${endCell.i},${endCell.j}`);
      
      if (startIndex === undefined || endIndex === undefined || 
          floydMatrix[startIndex][endIndex] === Infinity) {
        showStatusMessage("No path found between start and end points!", 5000);
        pathfindingInProgress = false;
        floydInProgress = false;
        return;
      }
      visualizeSignificantUpdates(significantUpdates, () => {
        reconstructFloydPath(startIndex, endIndex);
      });
      return;
    }
    
    const endK = Math.min(kProgress + batchSize, totalCells);
    let updatesInBatch = [];
    
    for (let k = kProgress; k < endK; k++) {
      const {i: kI, j: kJ} = indexToCells[k];
      intermediateCell = grid[kI][kJ];
      
      for (let i = 0; i < totalCells; i++) {
        if (floydMatrix[i][k] === Infinity) continue;
        
        for (let j = 0; j < totalCells; j++) {
          if (i === j || floydMatrix[k][j] === Infinity) continue;
    
          const newDist = floydMatrix[i][k] + floydMatrix[k][j];
          if (newDist < floydMatrix[i][j]) {
            floydMatrix[i][j] = newDist;
            floydPath[i][j] = floydPath[i][k];
            
            const {i: iI, j: iJ} = indexToCells[i];
            const {i: jI, j: jJ} = indexToCells[j];
            
            if ((Math.abs(iI - jI) + Math.abs(iJ - jJ) > 10) || 
                (grid[iI][iJ] === startCell || grid[iI][iJ] === endCell || 
                 grid[jI][jJ] === startCell || grid[jI][jJ] === endCell)) {
              
              updatesInBatch.push({
                from: grid[iI][iJ],
                to: grid[jI][jJ],
                via: intermediateCell,
                distance: newDist
              });
            }
          }
        }
      }
    }
    
    if (updatesInBatch.length > 0) {
      const startEndUpdates = updatesInBatch.filter(u => 
        u.from === startCell || u.from === endCell || 
        u.to === startCell || u.to === endCell);
      
      const selectedUpdates = startEndUpdates.length > 0 ? 
        startEndUpdates.slice(0, 2) : 
        updatesInBatch.sort(() => Math.random() - 0.5).slice(0, 2);
      
      significantUpdates.push(...selectedUpdates);
      currentlyProcessingCells = selectedUpdates.flatMap(u => [u.from, u.to]);
      visitedCells.push(intermediateCell);
    }

    kProgress = endK;
    
    if (indexToCells[endK - 1]) {
      const {i, j} = indexToCells[endK - 1];
      intermediateCell = grid[i][j];
    }
    
    statusMessage = `Computing shortest paths: ${Math.floor((kProgress / totalCells) * 100)}% complete`;
    redrawGrid();
    setTimeout(processNextBatch, 50);
  }
  processNextBatch();
}

function visualizeSignificantUpdates(updates, onComplete) {
  const maxUpdatesToShow = 20;
  const updatesToVisualize = updates.length > maxUpdatesToShow ? 
    updates.sort(() => Math.random() - 0.5).slice(0, maxUpdatesToShow) : 
    updates;
  
  let updateIndex = 0;
  
  function showNextUpdate() {
    if (updateIndex >= updatesToVisualize.length) {
      currentlyProcessingCells = [];
      intermediateCell = null;
      redrawGrid();
      onComplete();
      return;
    }
    
    const update = updatesToVisualize[updateIndex];
    intermediateCell = update.via;
    currentlyProcessingCells = [update.from, update.to];
    statusMessage = `Found improved path between (${update.from.i},${update.from.j}) and (${update.to.i},${update.to.j}) via (${update.via.i},${update.via.j})`;
    
    redrawGrid();
    updateIndex++;
    setTimeout(showNextUpdate, 200);
  }
  
  if (updatesToVisualize.length > 0) {
    statusMessage = "Showing most significant path improvements...";
    showNextUpdate();
  } else {
    onComplete();
  }
}

function reconstructFloydPath(startIndex, endIndex) {
  const indexToCells = floydMatrix.indexToCells;
  let path = [];
  let currentIndex = startIndex;
  
  statusMessage = "Path found! Tracing route...";
  intermediateCell = null;
  currentlyProcessingCells = [];

  while (currentIndex !== endIndex) {
    const {i, j} = indexToCells[currentIndex];
    const cell = grid[i][j];
    path.push(cell);
    currentIndex = floydPath[currentIndex][endIndex];
    
    if (currentIndex === null || currentIndex === undefined || path.length > indexToCells.length) {
      showStatusMessage("Error reconstructing path!", 5000);
      pathfindingInProgress = false;
      floydInProgress = false;
      return;
    }
  }
  const {i: endI, j: endJ} = indexToCells[endIndex];
  path.push(grid[endI][endJ]);
  pathAnimationInProgress = true;
  let pathIndex = 0;
  let interval = setInterval(() => {
    if (pathIndex < path.length) {
      let cell = path[pathIndex];
      cell.path = true;
      redrawGrid();
      pathIndex++;
    } else {
      clearInterval(interval);
      pathAnimationInProgress = false;
      pathfindingInProgress = false;
      floydInProgress = false;
      showStatusMessage(`Path found! Length: ${path.length - 1} steps`, 5000);
    }
  }, 30);
}

function enhanceGridWithFloydVisualization() {
  if (floydInProgress) {
    if (batchProcessingComplete && !pathAnimationInProgress) {
      fill(0, 200, 0, 100); 
      noStroke();
      rect(0, 0, 80, 20);
    }
    
    if (intermediateCell) {
      fill(255, 150, 0, 200); 
      noStroke();
      rect(intermediateCell.i * cellSize, intermediateCell.j * cellSize, cellSize, cellSize);
      
      for (let r = 1; r <= 2; r++) {
        fill(255, 150, 0, 100 - r * 30);
        rect(intermediateCell.i * cellSize - r, intermediateCell.j * cellSize - r, 
             cellSize + 2*r, cellSize + 2*r);
      }
    }
    
    for (let cell of currentlyProcessingCells) {
      fill(150, 0, 255, 150); 
      noStroke();
      rect(cell.i * cellSize, cell.j * cellSize, cellSize, cellSize);
      
      if (intermediateCell && currentlyProcessingCells.length > 1) {
        stroke(255, 255, 0, 150); 
        strokeWeight(2);
        
        const firstCell = currentlyProcessingCells[0];
        if (currentlyProcessingCells.length > 1) {
          const lastCell = currentlyProcessingCells[1];
          
          // Draw path: first -> intermediate -> last
          line(
            firstCell.i * cellSize + cellSize/2, 
            firstCell.j * cellSize + cellSize/2,
            intermediateCell.i * cellSize + cellSize/2, 
            intermediateCell.j * cellSize + cellSize/2
          );
          
          line(
            intermediateCell.i * cellSize + cellSize/2, 
            intermediateCell.j * cellSize + cellSize/2,
            lastCell.i * cellSize + cellSize/2, 
            lastCell.j * cellSize + cellSize/2
          );
        }
      }
    }
  }
}

function resetFloydState() {
  floydMatrix = [];
  floydPath = [];
  floydInProgress = false;
  batchProcessingComplete = false;
  pathAnimationInProgress = false;
  intermediateCell = null;
  currentlyProcessingCells = [];
}