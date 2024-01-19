let board = [];
const width = 30;
const height = 16;
const board_width = 30 * width - 14;
const board_height = 30 * height;

const mines_count = 50;
let mines_locations = [];
let tilesCleared = 0; // click all tiles except the ones containing a bomb

let flagEnabled = false;
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
    let uniqueMines = new Set();

    while (uniqueMines.size < mines_count) {
        let row = getRandomIndex(height);
        let column = getRandomIndex(width);
        let mineLocation = row + '-' + column;

        // Check if the mine location is unique
        if (!uniqueMines.has(mineLocation)) {
            uniqueMines.add(mineLocation);
            mines_locations.push(mineLocation);
        }
    }
    // console.log('Mine locations: ',uniqueMines);
}


function clickTile(tileRow,tileColumn) {
    if(gameOver) return;
    const tile = document.getElementById(tileRow + '-' + tileColumn);
    
    if(tile.innerText === "🚩")
    return;

    if(mines_locations.includes(tile.id)) {
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
        return;
    }
}


function revealMines(backgroundColor) {

    for (let i = 0; i < mines_count; i++) {
        let mineCoordinates = mines_locations[i].split('-');
        let row = mineCoordinates[0];
        let column = mineCoordinates[1];
        let tileID = row + '-' + column;
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
    
    board[row][column].classList.add('tiles-cleared');
    board[row][column].innerText = ''; // incase a flag is placed on the tile
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

    if(mines_locations.includes(row + '-' + column)) {
        return 1;
    }

    return 0;
}   

//---------------------------------------------------------------------------------- COMPUTER MOVE ---------------------------------------------------------------------------------------------------------------------------

let bombsConfirmed = new Set(); // push confirmed tile IDs to this set
let safeTiles = [];

let tileScores = new Map();

// we want to search the surrounding tiles for all cleared tiles, if the score == surrounding uncleared tiles, we can confirm those tiles as mines

function subtractScore(row, column) {
    if(bombsConfirmed.has(row + '-' + column)) return;

    bombsConfirmed.add(row + '-' + column);
    // subtract score of surrounding tiles
    if (row - 1 > -1) {
        const tileScore = tileScores.get((row - 1) + '-' + column);
        tileScores.set((row - 1) + '-' + column, tileScore - 1);
    }

    if (row + 1 < height) {
        const tileScore = tileScores.get((row + 1) + '-' + column);
        tileScores.set((row + 1) + '-' + column, tileScore - 1);
    }

    if (column - 1 > -1) {
        const tileScore = tileScores.get(row + '-' + (column - 1));
        tileScores.set(row + '-' + (column - 1), tileScore - 1);
    }

    if (column + 1 < width) {
        const tileScore = tileScores.get(row + '-' + (column + 1));
        tileScores.set(row + '-' + (column + 1), tileScore - 1);
    }

    if (column + 1 < width && row - 1 > -1) {
        const tileScore = tileScores.get((row - 1) + '-' + (column + 1));
        tileScores.set((row - 1) + '-' + (column + 1), tileScore - 1);
    }

    if (column - 1 > -1 && row - 1 > -1) {
        const tileScore = tileScores.get((row - 1) + '-' + (column - 1));
        tileScores.set((row - 1) + '-' + (column - 1), tileScore - 1);
    }

    if (column - 1 > -1 && row + 1 < height) {
        const tileScore = tileScores.get((row + 1) + '-' + (column - 1));
        tileScores.set((row + 1) + '-' + (column - 1), tileScore - 1);
    }

    if (column + 1 < width && row + 1 < height) {
        const tileScore = tileScores.get((row + 1) + '-' + (column + 1));
        tileScores.set((row + 1) + '-' + (column + 1), tileScore - 1);
    }
}

// when a bomb is confirmed subtract 1 from the score of all surrounding cleared tiles


function evaluateSurroundingTiles(row, column) {
    let unsafeTiles = new Set(); // if surrounding tiles are more than that tile's score, add them here
    let surroundingUncleared = 0;

    const addTileToUnsafe = (r, c) => {
        const tileId = r + '-' + c;
        if (r >= 0 && r < height && c >= 0 && c < width && !board[r][c].classList.contains('tiles-cleared')) {
            if(!bombsConfirmed.has(tileId)) {
                unsafeTiles.add(tileId);
                surroundingUncleared++;
            }
            else {
                subtractScore(r,c);
            }
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

    if (surroundingUncleared === tileScore && tileScore !== 0) {
        // grab all surrounding uncleared tiles and add them to bombsConfirmed
        console.log('Grab all surrounding uncleared tiles and add them to bombsConfirmed triggered by ' + row + '-' + column);
        for (let tileId of unsafeTiles) {
            let [r, c] = tileId.split('-').map(Number);
            subtractScore(r, c);
        }
        unsafeTiles.clear();
    } 
    else if (tileScore <= 0 && surroundingUncleared > 0) {
        // clear all tiles that are not bombs
        console.log('Clearing all tiles not bombs triggered by ' + row + '-' + column);
        for (let tileId of unsafeTiles) {
            if (!bombsConfirmed.has(tileId)) {
                safeTiles.push(tileId);
            }
        }
        unsafeTiles.clear();
    }
}

function computerMove() {

    if(gameOver) return;

    if (safeTiles.length > 0) {
        safeTiles.sort((a, b) => b.value - a.value);   // sort scores in reverse, prioritizing clearing tiles with the least scores
        let tileID = safeTiles.pop().split('-');
        let row = parseInt(tileID[0]);
        let column = parseInt(tileID[1]);
        clickTile(row, column);
    } 

    else {
        let row = getRandomIndex(height);
        let column = getRandomIndex(width);
        while(board[row][column].classList.contains('tiles-cleared')) {
            row = getRandomIndex(height);
            column = getRandomIndex(width);
        }
        clickTile(row, column);
    }
}




// function getSurroundingTiles(row,column) {
//     let surroundingTiles = [];
//     if(row - 1 > -1) {
//         surroundingTiles.push(row - 1 + '-' + column);
//     }
    
//     if(row + 1 < height) {
//         surroundingTiles.push(row + 1 + '-' + column);
//     }

//     if(column - 1 > -1) {
//         surroundingTiles.push(row + '-' + column - 1);
//     }
    
//     if(column + 1 < width) {
//         surroundingTiles.push(row + '-' + column + 1);
//     }

//     if(column + 1 < width && row - 1 > -1) {
//         surroundingTiles.push(row - 1 + '-' + column + 1);
//     }
    
//     if(column - 1 > -1 && row - 1 > -1) {
//         surroundingTiles.push(row - 1 + '-' + column - 1);
//     }

//     if(column - 1 > -1 && row + 1 > -1) {
//         surroundingTiles.push(row + 1 + '-' + column - 1);
//     }

//     if(column + 1 < width && row + 1 < height) {
//         surroundingTiles.push(row + 1 + '-' + column + 1);
//     }
//     return surroundingTiles;
// }

