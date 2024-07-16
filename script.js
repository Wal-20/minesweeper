let board = [];
const width = 30;
const height = 16; // width should be divisible by height
const board_width = (30 * width - 14) + 'px';
const board_height = (30 * height) + 'px';

let mine_locations = new Set();
const mines_count = 50;
let flag_count = 0;

let tilesClearedSet = new Set();
let tilesClearedCount = 0;
let game_over = false;


// solver specific variables
let minesConfirmed = new Set(); // add discovered mines here
let tileScores = new Map(); // used to map each tile id with it's score, later used for evaluating number of surrounding mines
let safeTiles = [];
let solverActive = false; // so solver gets called only once


const directions = [-1, 0, 1]; // used as offsets for tile positions
const getRandomIndex = (max) => Math.floor(Math.random() * max);

window.onload = () => startGame();

function startGame() {
    
    document.querySelector('.board').style.width = board_width;
    document.querySelector('.board').style.height = board_height;
    document.getElementById('mines-count').innerHTML = mines_count;
    document.getElementById('flag-count').innerHTML = flag_count;
    document.getElementById('computer-play').addEventListener('click', function() {
		if(!solverActive) {
			solverActive = true;
			solve();
		} 
	});

    document.addEventListener('keydown', function(event) {
        if (!solverActive && (event.key === ' ' || event.key === 'Enter')) {
			solverActive = true;
			solve();
        }
    });
	
    window.addEventListener('contextmenu',(event) => {
        event.preventDefault(); // Disable right-click context menu
    });
    
    // populate the board
    for(let i = 0; i < height;i++){
        let row = [];
        for(let j = 0; j < width;j++){

            let tile = document.createElement("div");
            tile.id = i + '-' + j;

            tile.addEventListener('click',() => {
                clickTile(i,j);
                console.log('Score: ' + tileScores.get(i + '-' + j) + ' | bomb? ' + minesConfirmed.has(i + '-' + j) + ' | safe? ' + safeTiles.includes(i + '-' + j));
            });

            tile.addEventListener('contextmenu',() => {
                if(!game_over && !board[i][j].classList.contains('tiles-cleared')) {
                    if(tile.innerText === '🚩') {
                        tile.innerText = '';
                        flag_count--;
                    }
                    else {
                        tile.innerText = '🚩';
                        flag_count++;
                    }
                    document.getElementById('flag-count').innerHTML = flag_count;
                }
            });
            // toggle flag
            
            document.querySelector('.board').append(tile);
            row.push(tile);
            // tileScores.set(tile.id,0);
        }
        board.push(row);
    }
    setMines();
}


function setMines() {

    while (mine_locations.size < mines_count) {

        let row = getRandomIndex(height);
        let column = getRandomIndex(width);
        let mineLocation = row + '-' + column;

        mine_locations.add(mineLocation);
    }
}


function revealMines(bg_color) {

    for (const tileID of mine_locations) {
        document.getElementById(tileID).innerHTML = "💣";
        document.getElementById(tileID).style.backgroundColor = bg_color;
    }
}


function clickTile(row,column) {
    if(game_over) return;
    const tile = document.getElementById(row + '-' + column);
    
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
    checkMines(row,column);

    for(const tileID of tilesClearedSet) {
        const [r,c] = tileID.split('-').map(Number);
        evaluateSurroundingTiles(r,c);
    }
    
    console.log('safe tiles: ' + safeTiles.length);

    if(tilesClearedCount === (width * height) - mines_count) {
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

    if(board[row][column].innerText === '🚩') {
        flag_count--;
        document.getElementById('flag-count').innerText = flag_count;
        board[row][column].innerText = '';
    }
    // in case a flag is placed on the tile

    tilesClearedCount++;
    let minesFound = 0;
    
    //check in all directions
    directions.forEach((rOffset) => {
        directions.forEach((cOffset) => {
            const r = row + rOffset;
            const c = column + cOffset;
            if(r >= 0 && r < height && c >= 0 && c < width && mine_locations.has(r + '-' + c))
                minesFound++;
        })  // checking if row or column are out of bounds or that the tile contains a mine
    });

    if(minesFound > 0) {
        board[row][column].innerText = minesFound;
        board[row][column].classList.add('x' + minesFound);
        board[row][column].classList.add('surrounded-by-mines');
        const surroundingTiles = getSurroundingTiles(row,column);
        
        let surroundingMineCount = 0;
        for(tileID of surroundingTiles) {
            if(minesConfirmed.has(tileID)) surroundingMineCount++;
        }
        tileScores.set(row + '-' + column, minesFound - surroundingMineCount);
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
    tilesClearedSet.add(row + '-' + column);

}


// ----------------------------------------------------------------------------- SOLVER ALGORITHM ----------------------------------------------------------------------------- //
// AKA: recursion hell
// we want to search the surrounding tiles for all uncleared tiles, if the score == surrounding uncleared tiles, we can confirm those tiles are mines



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


function subtractScore(row, column) {

    if(minesConfirmed.has(row + '-' + column)) return;

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
        evaluateSurroundingTiles(r,c)

        let surroundingTiles = new Set(getSurroundingTiles(r,c))
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
// when a mine is confirmed subtract 1 from the score of all surrounding cleared tiles



// check whether tiles are safe, unsafe or contain mines according to their scores

function evaluateSurroundingTiles(row, column) { 
    let unsafeTiles = new Set();
    const surroundingTiles = getSurroundingTiles(row,column);
    const tileScore = tileScores.get(row + '-' + column);

    surroundingTiles.forEach((tileID) => {
        const [r,c] = tileID.split('-').map(Number);
        if (!board[r][c].classList.contains('tiles-cleared') && !minesConfirmed.has(r + ' - ' + c)) {
            unsafeTiles.add(tileID);
        }
    });

    if (unsafeTiles.size === tileScore && tileScore > 0) {    // if number of surrounding uncleared tiles == the tile's score and that tile's score > 0
        // grab all surrounding uncleared tiles and add them to minesConfirmed
        for (let tileID of unsafeTiles) {
            const [r, c] = tileID.split('-').map(Number);
            subtractScore(r,c);
        }
    }

}


function solve() {
    if (game_over) return;

    setTimeout(() => {

        if (safeTiles.length > 0) {
            safeTiles.sort((a, b) => tileScores.get(b) - tileScores.get(a)); // sorting in descending order
            let tileID = safeTiles.pop(); // giving priority for tiles with the least scores

            let [row, column] = tileID.split('-').map(Number);
            clickTile(row, column);
            console.log('(' + row + '-' + column + ") popped from safeTiles");
        }

        else {
            let row = getRandomIndex(height);
            let column = getRandomIndex(width);
            while (board[row][column].classList.contains('tiles-cleared') || board[row][column].innerText === '🚩') {
                row = getRandomIndex(height);
                column = getRandomIndex(width);
            }
            console.log('(' + row + '-' + column + ') randomly clicked');
            clickTile(row, column);
        }

        solve(); // continue the loop
        for(const mineID of minesConfirmed) {
            const [r,c] = mineID.split('-');
            if(board[r][c].innerText === '') {
                board[r][c].innerText = '🚩';
                flag_count++;
            }
            document.getElementById('flag-count').innerText = flag_count;
        }
        
    }, 70);
}


