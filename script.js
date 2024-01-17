let board = [];
const width = 30;
const height = 16;
const board_width = 40 * width;
const board_height = 40 * height;

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
    document.getElementById('flag-button').addEventListener('click',toggleFlag);
    document.getElementById('computer-play').addEventListener('click',computerMove);
    setMines();
    
    // populate the board
    for(let i = 0; i < height;i++){
        let row = [];
        for(let j = 0; j < width;j++){
            let tile = document.createElement("div");
            tile.id = i + '-' + j;
            tile.addEventListener('click',clickTile);
            tile.addEventListener('contextmenu',(event) => {
                if(!gameOver && !board[i][j].classList.contains('tiles-cleared')) {
                    event.preventDefault(); // Disable right-click context menu
                    tile.innerText === '❓' ? tile.innerText = '' : tile.innerText = '❓';
                }})
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


function clickTile() {
    if(gameOver) return;
    let tile = this;
    
    if(flagEnabled) {
        if(tile.innerText === '' && !tile.classList.contains('tiles-cleared')){
            tile.innerText = "🚩";
        }

        else if(tile.innerText === "🚩"){
            tile.innerText = '';
        }
        return;
    }
    if(tile.innerText === "🚩")
        return;

    if(mines_locations.includes(tile.id)) {
        revealMines('red');
        document.getElementById('game-over').innerHTML = "Game over!";
        document.querySelector('.board').classList.add('disabled');
        gameOver = true;
        return;
    }

    //checking nearby tiles for bombs
    let coords = tile.id.split('-');
    let row = parseInt(coords[0]);
    let column = parseInt(coords[1]);
    checkMines(row,column);

    if(tilesCleared === (width * height) - mines_count) {
        revealMines('lightgray');
        document.getElementById('game-over').innerHTML = 'You won!!';
        gameOver = true;
        return;
    }
}

function toggleFlag() {
    if(gameOver) return;

    if(flagEnabled) {
        flagEnabled = false;
        document.getElementById('flag-button').style.backgroundColor = 'lightgray';
    }
    
    else {
        flagEnabled = true;
        document.getElementById('flag-button').style.backgroundColor = 'darkgray';
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
        SearchSurrounding(row,column);
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

let bombsConfirmed = new Set(); // push confirmed tile IDs to this array
let unsafeTiles = [];   // if surrounding tiles are more than that tile's score, add them here
let safeTiles = [];

let tileScores = new Map();

// we want to search the surrounding tiles for all cleared tiles, if the score == surrounding uncleared tiles, we can confirm those tiles as mines

function subtractScore(row,column) {
    if(bombsConfirmed.has(row + '-' + column)) return;

    bombsConfirmed.add(row + '-' + column);
    // subtract score of surrounding tiles
    if(row - 1 > -1) {
        const tileScore = tileScores.get(row - 1 + '-' + column);
        tileScores.set(row - 1 + '-' + column,tileScore - 1);
    }
    
    if(row + 1 < height) {
        const tileScore = tileScores.get(row + 1 + '-' + column);
        tileScores.set(row + 1 + '-' + column,tileScore - 1);
    }

    if(column - 1 > -1) {
        const tileScore = tileScores.get(row + '-' + column + 1);
        tileScores.set(row + '-' + column + 1,tileScore - 1);
    }
    
    if(column + 1 < width) {
        const tileScore = tileScores.get(row + '-' + column + 1);
        tileScores.set(row + '-' + column + 1,tileScore - 1);
    }

    if(column + 1 < width && row - 1 > -1) {
        const tileScore = tileScores.get(row - 1 + '-' + column + 1);
        tileScores.set(row - 1 + '-' + column + 1,tileScore - 1);
    }
    
    if(column - 1 > -1 && row - 1 > -1) {
        const tileScore = tileScores.get(row - 1 + '-' + column - 1);
        tileScores.set(row - 1 + '-' + column - 1,tileScore - 1);
    }

    if(column - 1 > -1 && row + 1 > -1) {
        const tileScore = tileScores.get(row + 1 + '-' + column - 1);
        tileScores.set(row + 1 + '-' + column - 1,tileScore - 1);
    }

    if(column + 1 < width && row + 1 < height) {
        const tileScore = tileScores.get(row + 1 + '-' + column + 1);
        tileScores.set(row + 1 + '-' + column + 1,tileScore - 1);
    }
}
// when a bomb is confirmed subtract 1 from the score of all surrounding cleared tiles


function SearchSurrounding(row,column) {    // PRIORITY FOR SEARCHING IS FOR TILES WITH THE LEAST SCORES
    
    let surroundingUncleared = 0;
    if(row - 1 > -1 && !board[row - 1][column].classList.contains('tiles-cleared') && !bombsConfirmed.has(row - 1 + '-' + column)) {
        unsafeTiles.push(row - 1 + '-' + column);
        surroundingUncleared++;
    }
    
    if(row + 1 < height && !board[row + 1][column].classList.contains('tiles-cleared') && !bombsConfirmed.has(row + 1 + '-' + column)) {
        unsafeTiles.push(row + 1 + '-' + column);
        surroundingUncleared++;
    }

    if(column - 1 > -1 && !board[row][column - 1].classList.contains('tiles-cleared') && !bombsConfirmed.has(row + '-' + column - 1)) {
        unsafeTiles.push(row + '-' + column - 1);
        surroundingUncleared++;
    }
    
    if(column + 1 < width && !board[row][column + 1].classList.contains('tiles-cleared') && !bombsConfirmed.has(row + '-' + column + 1)) {
        unsafeTiles.push(row + '-' + column + 1);
        surroundingUncleared++;
    }
    
    if(column + 1 < width && row - 1 > -1 && !board[row - 1][column + 1].classList.contains('tiles-cleared') && !bombsConfirmed.has(row - 1 + '-' + column + 1)) {
        unsafeTiles.push(row - 1 + '-' + column + 1);
        surroundingUncleared++;
    }
    
    if(column - 1 > -1 && row - 1 > -1 && !board[row - 1][column - 1].classList.contains('tiles-cleared') && !bombsConfirmed.has(row - 1 + '-' + column - 1)) {
        unsafeTiles.push(row - 1 + '-' + column - 1);
        surroundingUncleared++;
    }

    if(column - 1 > -1 && row + 1 < height && !board[row + 1][column - 1].classList.contains('tiles-cleared') && !bombsConfirmed.has(row + 1 + '-' + column - 1)) {
        unsafeTiles.push(row + 1 + '-' + column - 1);
        surroundingUncleared++;
    }

    if(column + 1 < width && row + 1 < height && !board[row + 1][column + 1].classList.contains('tiles-cleared') && !bombsConfirmed.has(row + 1 + '-' + column + 1)) {
        unsafeTiles.push(row + 1 + '-' + column + 1);
        surroundingUncleared++;
    }
    if(surroundingUncleared === tileScores.get(row + '-' + column)) {
        // grab all surrounding uncleared tiles and add them to bombsConfirmed
        for(let i = 0; i < surroundingUncleared;i++) {
            let tileID = unsafeTiles.pop();
            let row = parseInt(tileID[0]);
            let column = parseInt(tileID[1]);
            subtractScore(row,column);
        }
    }

    else if(tileScores.get(row + '-' + column) === 0 && surroundingUncleared > 0) { // clear all tiles that are not bombs
        const surroundingTiles = getSurroundingTiles(row,column);
        for(let i = 0; i < surroundingTiles.length;i++) {
            safeTiles.push(surroundingTiles[i]);
        }
    }

}

function getSurroundingTiles(row,column) {
    let surroundingTiles = [];
    if(row - 1 > -1) {
        surroundingTiles.push(row - 1 + '-' + column);
    }
    
    if(row + 1 < height) {
        surroundingTiles.push(row + 1 + '-' + column);
    }

    if(column - 1 > -1) {
        surroundingTiles.push(row + '-' + column - 1);
    }
    
    if(column + 1 < width) {
        surroundingTiles.push(row + '-' + column + 1);
    }

    if(column + 1 < width && row - 1 > -1) {
        surroundingTiles.push(row - 1 + '-' + column + 1);
    }
    
    if(column - 1 > -1 && row - 1 > -1) {
        surroundingTiles.push(row - 1 + '-' + column - 1);
    }

    if(column - 1 > -1 && row + 1 > -1) {
        surroundingTiles.push(row + 1 + '-' + column - 1);
    }

    if(column + 1 < width && row + 1 < height) {
        surroundingTiles.push(row + 1 + '-' + column + 1);
    }
    return surroundingTiles;
}

function computerMove() {
    if (safeTiles.length > 0) {
        let tileID = safeTiles.pop().split('-');
        let row = parseInt(tileID[0]);
        let column = parseInt(tileID[1]);
        checkMines(row, column);
    } 
    else {
        let row = getRandomIndex(height);
        let column = getRandomIndex(width);
        while(board[row][column].classList.contains('tiles-cleared')) {
            row = getRandomIndex(height);
            column = getRandomIndex(width);
        }
        checkMines(row, column);
    }
}

function ReverseSortScores(tileScores) {
    return tileScores.sort((a, b) => b.value - a.value);
}