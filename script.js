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
                    tile.innerText === '🚩' ? tile.innerText = '' : tile.innerText = '🚩';
                }})
            document.querySelector('.board').append(tile);
            row.push(tile);
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
    console.log('Mine locations: ',uniqueMines);
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
        let row = parseInt(mineCoordinates[0]);
        let column = parseInt(mineCoordinates[1]);
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
