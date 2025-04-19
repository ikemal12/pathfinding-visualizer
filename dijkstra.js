function runDijkstra() {
    if (pathfindingInProgress || !startCell || !endCell) return;
  
    pathfindingInProgress = true;
    visitedCells = [];
    currentStep = 0;
    statusMessage = "";
  
    let distances = {};
    let previous = {};
    let unvisited = [];
  
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
  
    function stepThrough() {
      if (unvisited.length === 0) {
        pathfindingInProgress = false;
        showStatusMessage("No path found between start and end points!", 5000); 
        console.log("No path found.");
        return;
      }
  
      let current = getMinDistanceCell(unvisited, distances);
  
      if (!current) {
        pathfindingInProgress = false;
        showStatusMessage("No path found between start and end points!", 5000);
        console.log("No path found - no valid cell to process.");
        return;
      }
      visitedCells.push(current); 
  
      if (current === endCell) {
        reconstructPath(previous);
        pathfindingInProgress = false;
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
  
      currentStep++;
      redrawGrid();  
  
      if (pathfindingInProgress) {
        intervalID = requestAnimationFrame(stepThrough);
      }
    }
  
    stepThrough();
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