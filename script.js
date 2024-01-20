let board = [];
const width = 30;
const height = 16;
const board_width = 30 * width - 14;
const board_height = 30 * height;

const mines_count = 50;
let mine_locations = new Set();
let tilesCleared = 0;
let gameOver = false;

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
    document.addEventListener('keydown', function(event) {
        if (event.key === 'c' || event.key === ' ') {
            computerMove();
        }
    });
     
    // populate the board
    for(let i = 0; i < height;i++){
        let row = [];
        for(let j = 0; j < width;j++){
            let tile = document.createElement("div");
            tile.id = i + '-' + j;
            tile.addEventListener('click',() => {
                clickTile(parseInt(i),parseInt(j));
                console.log(tileScores.get(i + '-' + j));
            });
            tile.addEventListener('contextmenu',(event) => {
                if(!gameOver && !board[i][j].classList.contains('tiles-cleared')) {
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


function clickTile(tileRow,tileColumn) {
    if(gameOver) return;
    const tile = document.getElementById(tileRow + '-' + tileColumn);
    
    if(tile.innerText === "🚩")
    return;

    if(mine_locations.has(tile.id)) {
        revealMines('red');
        document.getElementById('game-over').innerHTML = "Game over!";
        document.querySelector('.board').classList.add('disabled');
        gameOver = true;
        tile.style.backgroundColor = 'green';
        return;
    }   

    //checking nearby tiles for bombs
    let coords = tile.id.split('-');
    let row = parseInt(coords[0]);
    let column = parseInt(coords[1]);
    checkMines(row,column);
    console.log('safe tiles: ' + safeTiles.length);

    if(tilesCleared === (width * height) - mines_count) {
        revealMines('lightgray');
        document.getElementById('game-over').innerHTML = 'You won!!';
        gameOver = true;
    }
}


function revealMines(backgroundColor) {

    for (const tileID of mine_locations) {
        document.getElementById(tileID).innerHTML = "💣";
        document.getElementById(tileID).style.backgroundColor = backgroundColor;
    }
}


function checkMines(row,column) {
    
    if(row < 0 || row >= height || column < 0 || column >= width) {
        return;
    }
    if(board[row][column].classList.contains('tiles-cleared')) {
        return;
    }
    
    if (safeTiles.includes(row + '-' + column) || bombsConfirmed.has(row + '-' + column)) {
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
    minesFound += checkTile(row - 1,column);
    minesFound += checkTile(row - 1,column + 1);
    minesFound += checkTile(row - 1,column - 1);

    minesFound += checkTile(row,column + 1);
    minesFound += checkTile(row,column - 1);

    minesFound += checkTile(row + 1,column);
    minesFound += checkTile(row + 1,column - 1);
    minesFound += checkTile(row + 1,column + 1);

    if(minesFound > 0) {
        board[row][column].innerText = minesFound;
        board[row][column].classList.add('x' + minesFound);
        tileScores.set(row + '-' + column, minesFound);
        evaluateSurroundingTiles(row,column);
        // Here we want to evaluate adjacent bombs
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


function checkTile(row,column) { 
    if(row < 0 || row >= height || column < 0 || column >= width) {
        return 0;
    }

    if(mine_locations.has(row + '-' + column)) {
        return 1;
    }

    return 0;
}   

// ----------------------------------------------------------------------------- COMPUTER MOVE ----------------------------------------------------------------------------- //

let bombsConfirmed = new Set(); // push confirmed tile IDs to this set
let tileScores = new Map();
let safeTiles = [];

// we want to search the surrounding tiles for all uncleared tiles, if the score == surrounding uncleared tiles, we can confirm those tiles are mines

function subtractScore(row, column) {
    const directions = [-1, 0, 1];

    bombsConfirmed.add(row + '-' + column);

    // Subtract score of surrounding tiles
    directions.forEach((rOffset) => {
        directions.forEach((cOffset) => {
            const r = row + rOffset;
            const c = column + cOffset;

            if (r >= 0 && r < height && c >= 0 && c < width) {
                const tileID = r + '-' + c;
                const tileScore = tileScores.get(tileID);
                tileScores.set(tileID, tileScore - 1);

                if(tileScores.get(tileID) === 0) {
                     // add all tiles that aren't bombs to safeTiles
                    let surroundingTiles = getSurroundingTiles(r,c);
                    for(const tile of surroundingTiles) {
                        let [surroundingRow,surroundingColumn] = tile.split('-').map(Number);
                        if (!bombsConfirmed.has(tile) && !safeTiles.includes(tile) && !board[surroundingRow][surroundingColumn].classList.contains('tiles-cleared')) 
                            safeTiles.push(tile);
                    }
                }
            }
        });
    });
}
// when a bomb is confirmed subtract 1 from the score of all surrounding cleared tiles


function evaluateSurroundingTiles(row, column) {
    let unsafeTiles = new Set(); // if surrounding tiles are more than that tile's score, add them here

    const addTileToUnsafe = (r, c) => {
        const tileID = r + '-' + c;
        if (r >= 0 && r < height && c >= 0 && c < width && !board[r][c].classList.contains('tiles-cleared')) {
            unsafeTiles.add(tileID);
        }
    };

    addTileToUnsafe(row - 1, column);
    addTileToUnsafe(row + 1, column);
    addTileToUnsafe(row, column - 1);
    addTileToUnsafe(row, column + 1);
    addTileToUnsafe(row - 1, column + 1);
    addTileToUnsafe(row - 1, column - 1);
    addTileToUnsafe(row + 1, column - 1);
    addTileToUnsafe(row + 1, column + 1);

    const tileScore = tileScores.get(row + '-' + column);

    if (unsafeTiles.size === tileScore && tileScore > 0) {    // if number of surrounding uncleared tiles == the tile's score and that tile's score > 0
        // grab all surrounding uncleared tiles and add them to bombsConfirmed
        for (let tileId of unsafeTiles) {
            let [r, c] = tileId.split('-').map(Number);
            subtractScore(r, c);
        }
    } 
}

function computerMove() {

    if(gameOver) return;

    if (safeTiles.length > 0) {
        safeTiles.sort((a,b) => tileScores.get(b) - tileScores.get(a)); // sort safe tile scores in descending order, giving priority to tiles with least scores
        let tileID = safeTiles.pop();
        let [row,column] = tileID.split('-').map(Number);
        clickTile(row, column);
        console.log(row + '-' + column + " popped from safeTiles")
    } 

    else {
        let row = getRandomIndex(height);
        let column = getRandomIndex(width);
        while(board[row][column].classList.contains('tiles-cleared') || bombsConfirmed.has(row + '-' + column)) {
            row = getRandomIndex(height);
            column = getRandomIndex(width);
        }
        console.log(row + '-' + column + ' randomly clicked')
        clickTile(row, column);
    }
}


function getSurroundingTiles(row,column) {
    let surroundingTiles = [];
    const directions = [-1,0,1];

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
