function runAStar() {
    if (pathfindingInProgress || !startCell || !endCell) return;
  
    pathfindingInProgress = true;
    visitedCells = []; 
    currentStep = 0;
    statusMessage = "";
    
    let openSet = [];
    let cameFrom = {};
    let gScore = {};
    let fScore = {};
  
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let cell = grid[i][j];
        let key = getKey(cell);
        gScore[key] = Infinity;
        fScore[key] = Infinity;
      }
    }
  
    gScore[getKey(startCell)] = 0;
    fScore[getKey(startCell)] = heuristic(startCell, endCell);
    openSet.push(startCell);
  
    function stepThrough() {
      if (openSet.length === 0) {
        showStatusMessage("No path found between start and end points!", 5000);
        console.log("No path found.");
        pathfindingInProgress = false;
        return;
      }
  
      let current = openSet.reduce((a, b) =>
        fScore[getKey(a)] < fScore[getKey(b)] ? a : b
      );
  
      if (!current) {
        showStatusMessage("No path found between start and end points!", 5000);
        console.log("No path found - no valid cell to process.");
        pathfindingInProgress = false;
        return;
      }
  
      visitedCells.push(current);
      redrawGrid();
  
      if (current === endCell) {
        reconstructPath(cameFrom);
        pathfindingInProgress = false;
        return;
      }
  
      openSet = openSet.filter(c => c !== current);
  
      let neighbours = getNeighbours(current);
      for (let neighbour of neighbours) {
        if (neighbour.wall) continue;
  
        let tempG = gScore[getKey(current)] + 1;
  
        if (tempG < gScore[getKey(neighbour)]) {
          cameFrom[getKey(neighbour)] = current;
          gScore[getKey(neighbour)] = tempG;
          fScore[getKey(neighbour)] = tempG + heuristic(neighbour, endCell);
  
          if (!openSet.includes(neighbour)) {
            openSet.push(neighbour);
          }
        }
      }
  
      currentStep++;
  
      if (pathfindingInProgress) {
        intervalID = requestAnimationFrame(stepThrough);
      }
    }
  
    stepThrough();
  }
  
  function heuristic(a, b) {
    // Manhattan distance
    return abs(a.i - b.i) + abs(a.j - b.j);
  }