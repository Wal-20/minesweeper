let board = [];
const width = 30;
const height = 16;
const board_width = 30 * width - 14;
const board_height = 30 * height;

const mines_count = 50;
let mine_locations = new Set();
let tilesCleared = 0;
let game_over = false;

// algorithm specific variables
let minesConfirmed = new Set();
let tileScores = new Map(); // used to map each tile id with it's score, later used for evaluating number of surrounding mines
let safeTiles = [];

const directions = [-1, 0, 1]; // used as offsets for tile positions

function getRandomIndex(max) {
    return Math.floor(Math.random() * max);
}

window.onload = function() {
    startGame();
}


function startGame() {

    document.querySelector('.board').style.width = board_width + 'px';
    document.querySelector('.board').style.height = board_height + 'px';
    document.getElementById('mines-count').innerHTML = mines_count;
    document.getElementById('computer-play').addEventListener('click',computerMove);
     
    // populate the board
    for(let i = 0; i < height;i++){
        let row = [];
        for(let j = 0; j < width;j++){
            let tile = document.createElement("div");
            tile.id = i + '-' + j;
            tile.addEventListener('click',() => {
                clickTile(i,j);
                console.log('Score: ' + tileScores.get(i + '-' + j) + ' | bomb? ' + minesConfirmed.has(i + '-' + j));
            });
            tile.addEventListener('contextmenu',(event) => {
                if(!game_over && !board[i][j].classList.contains('tiles-cleared')) {
                    event.preventDefault(); // Disable right-click context menu
                    tile.innerText === '🚩' ? tile.innerText = '' : tile.innerText = '🚩';
                }
            });
            document.querySelector('.board').append(tile);
            row.push(tile);
            tileScores.set(tile.id,0); // used to calculate adjacent bombs later
        }
        board.push(row);
    }
}


function setMines() {

    while (mine_locations.size < mines_count) {
        let row = getRandomIndex(height);
        let column = getRandomIndex(width);
        let mineLocation = row + '-' + column;

        mine_locations.add(mineLocation);
    }
}


function revealMines(backgroundColor) {

    for (const tileID of mine_locations) {
        document.getElementById(tileID).innerHTML = "💣";
        document.getElementById(tileID).style.backgroundColor = backgroundColor;
    }
}


function clickTile(tileRow,tileColumn) {
    if(game_over) return;
    const tile = document.getElementById(tileRow + '-' + tileColumn);
    
    if(tile.innerText === "🚩")
        return;

    if(mine_locations.has(tile.id)) {
        revealMines('red');
        document.getElementById('game-over').innerHTML = "Game over!";
        document.querySelector('.board').classList.add('disabled');
        game_over = true;
        tile.style.backgroundColor = 'green'; // for debugging stop sweating
        return;
    }   

    //checking nearby tiles for bombs
    let coords = tile.id.split('-').map(Number);
    let row = coords[0];
    let column = coords[1];
    checkMines(row,column);
    console.log('safe tiles: ' + safeTiles.length);

    if(tilesCleared === (width * height) - mines_count) {
        revealMines('lightgray');
        document.getElementById('game-over').innerHTML = 'You won!!';
        game_over = true;
    }
}


function checkMines(row,column) {
    
    if(row < 0 || row >= height || column < 0 || column >= width) {
        return;
    }
    if(board[row][column].classList.contains('tiles-cleared')) {
        return;
    }
    
    if (safeTiles.includes(row + '-' + column) || minesConfirmed.has(row + '-' + column)) {
        const indexToRemove = safeTiles.indexOf(row + '-' + column);
        safeTiles.splice(indexToRemove, 1);
    }
    
    board[row][column].classList.add('tiles-cleared');
    board[row][column].innerText = ''; // in case a flag is placed on the tile
    tilesCleared++;
    
    if(tilesCleared === 1) {
        setMines();
    }
    
    let minesFound = 0;
    
    //check in all directions
    minesFound += countMines(row - 1,column);
    minesFound += countMines(row - 1,column + 1);
    minesFound += countMines(row - 1,column - 1);

    minesFound += countMines(row,column + 1);
    minesFound += countMines(row,column - 1);

    minesFound += countMines(row + 1,column);
    minesFound += countMines(row + 1,column - 1);
    minesFound += countMines(row + 1,column + 1);

    if(minesFound > 0) {
        board[row][column].innerText = minesFound;
        board[row][column].classList.add('x' + minesFound);
        board[row][column].classList.add('surrounded-by-mines');
        tileScores.set(row + '-' + column, minesFound);
        setTimeout(() => {
            evaluateSurroundingTiles(row,column); 
        }, 100);
        // Here we want to evaluate adjacent bombs, timeout is because not all tiles are evaluated when this is called, so we don't have the full picture
    }

    else {
        checkMines(row - 1,column);
        checkMines(row - 1,column + 1);
        checkMines(row - 1,column - 1);

        checkMines(row,column + 1);
        checkMines(row,column - 1);

        checkMines(row + 1,column);
        checkMines(row + 1,column + 1);
        checkMines(row + 1,column - 1);
    }

}


function countMines(row,column) { 
    
    if(row < 0 || row >= height || column < 0 || column >= width) {
        return 0;
    }

    if(mine_locations.has(row + '-' + column)) {
        return 1;
    }

    return 0;
}   

// ----------------------------------------------------------------------------- COMPUTER MOVE ----------------------------------------------------------------------------- //
// AKA: recursion hell
// we want to search the surrounding tiles for all uncleared tiles, if the score == surrounding uncleared tiles, we can confirm those tiles are mines

function subtractScore(row, column) {

    minesConfirmed.add(row + '-' + column);
    
    if (safeTiles.includes(row + '-' + column)) {
        const indexToRemove = safeTiles.indexOf(row + '-' + column);
        safeTiles.splice(indexToRemove, 1);
    }
    let tilesSurroundingMine = getSurroundingTiles(row,column);

    // Subtract score of surrounding tiles
    for(const surroundingTileID of tilesSurroundingMine) {
        
        const tileScore = tileScores.get(surroundingTileID);
        if(tileScore > 0) tileScores.set(surroundingTileID, tileScore - 1);
        
        const [r,c] = surroundingTileID.split('-').map(Number);
        let surroundingTiles = new Set(getSurroundingTiles(r,c));
        surroundingTiles.delete(row,column);

        if(tileScores.get(surroundingTileID) === 0 && board[r][c].classList.contains('surrounded-by-mines')) {  // if after the subtraction a tile has a score of zero, all surrounding bombs are found, so all other tiles are safe
            // add all tiles that aren't bombs to safeTiles
            for(const tileID of surroundingTiles) {
                let [surroundingRow,surroundingColumn] = tileID.split('-').map(Number);
                if (!minesConfirmed.has(tileID) && !safeTiles.includes(tileID) && !board[surroundingRow][surroundingColumn].classList.contains('tiles-cleared')) 
                    safeTiles.push(tileID);
            }
        }

    }
}
// when a bomb is confirmed subtract 1 from the score of all surrounding cleared tiles


function evaluateSurroundingTiles(row, column) {
    let unsafeTiles = new Set();
    const surroundingTiles = getSurroundingTiles(row,column);

    surroundingTiles.forEach((tileID) => {
        const [r,c] = tileID.split('-').map(Number);
        if (!board[r][c].classList.contains('tiles-cleared')) {
            unsafeTiles.add(tileID);
        }
    });

    const tileScore = tileScores.get(row + '-' + column);

    if (unsafeTiles.size === tileScore && tileScore > 0) {    // if number of surrounding uncleared tiles == the tile's score and that tile's score > 0
        // grab all surrounding uncleared tiles and add them to minesConfirmed
        for (let tileID of unsafeTiles) {
            let [r, c] = tileID.split('-').map(Number);
            subtractScore(r,c);
            unsafeTiles.delete(tileID);
        }
    }
   
}


function computerMove() {

    if(game_over) return;

    if (safeTiles.length > 0) {
        safeTiles.sort((a,b) => tileScores.get(b) - tileScores.get(a));
        let tileID = safeTiles.pop(); // giving priority for tiles with the least scores

        let [row,column] = tileID.split('-');
        clickTile(row, column);
        console.log(row + '-' + column + " popped from safeTiles")
    } 

    else {
        let row = getRandomIndex(height);
        let column = getRandomIndex(width);
        while(board[row][column].classList.contains('tiles-cleared') || minesConfirmed.has(row + '-' + column) && board[row][column].innerText === '🚩') {
            row = getRandomIndex(height);
            column = getRandomIndex(width);
        }
        console.log(row + '-' + column + ' randomly clicked')
        clickTile(row, column);
    }

    if(!game_over)
        for(const mineID of minesConfirmed) {
            const [r,c] = mineID.split('-');
            board[r][c].innerText = '🚩';
        } 
}


function getSurroundingTiles(row,column) {
    let surroundingTiles = [];

    directions.forEach((rOffset) => {
        directions.forEach((cOffset) => {
            const r = row + rOffset;
            const c = column + cOffset;

            if (r >= 0 && r < height && c >= 0 && c < width) {
                surroundingTiles.push(r + '-' + c);        
            }
        });
    });
    return surroundingTiles;
}
