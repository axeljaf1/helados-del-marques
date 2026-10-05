"use strict";

/*
    ==========================================
    SERPIENTES Y ESCALERAS
    ==========================================

    Máximo: 5 jugadores
    Tablero: 100 casillas
    Sin backend
    Compatible con GitHub Pages
*/

// ==========================================
// CONFIGURACIÓN DEL JUEGO
// ==========================================

const BOARD_SIZE = 100;
const MAX_PLAYERS = 5;
const MIN_PLAYERS = 2;

const PLAYER_COLORS = [
    "#ef4444",
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#ec4899"
];

const DICE_SYMBOLS = {
    1: "⚀",
    2: "⚁",
    3: "⚂",
    4: "⚃",
    5: "⚄",
    6: "⚅"
};

// Serpientes
const SNAKES = {
    99: 54,
    95: 75,
    92: 73,
    87: 36,
    64: 60,
    48: 26,
    42: 21,
    25: 5
};

// Escaleras
const LADDERS = {
    2: 23,
    7: 29,
    8: 49,
    15: 47,
    28: 84,
    36: 44,
    51: 67,
    71: 91,
    78: 98
};

// ==========================================
// ESTADO
// ==========================================

let playerCount = 5;
let players = [];
let currentPlayer = 0;
let gameRunning = false;
let isMoving = false;

let zoom = 1;

const state = {
    cameraX: 0,
    cameraY: 0
};

// ==========================================
// ELEMENTOS
// ==========================================

const setupScreen = document.getElementById("setupScreen");
const gameScreen = document.getElementById("gameScreen");

const playerInputs = document.getElementById("playerInputs");
const playersPanel = document.getElementById("playersPanel");

const board = document.getElementById("board");
const boardCamera = document.getElementById("boardCamera");
const piecesLayer = document.getElementById("piecesLayer");

const turnName = document.getElementById("turnName");
const turnColor = document.getElementById("turnColor");
const statusText = document.getElementById("statusText");

const dice = document.getElementById("dice");
const rollBtn = document.getElementById("rollBtn");

const winnerModal = document.getElementById("winnerModal");
const winnerName = document.getElementById("winnerName");

const zoomValue = document.getElementById("zoomValue");


// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener("DOMContentLoaded", init);

function init() {

    createPlayerInputs(playerCount);

    document
        .querySelectorAll(".count-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                playerCount = Number(button.dataset.count);

                document
                    .querySelectorAll(".count-btn")
                    .forEach(btn => btn.classList.remove("active"));

                button.classList.add("active");

                createPlayerInputs(playerCount);
            });
        });

    document
        .getElementById("startGameBtn")
        .addEventListener("click", startGame);

    rollBtn.addEventListener("click", rollDice);

    document
        .getElementById("newGameBtn")
        .addEventListener("click", newGame);

    document
        .getElementById("restartBtn")
        .addEventListener("click", newGame);

    document
        .getElementById("zoomInBtn")
        .addEventListener("click", () => changeZoom(0.1));

    document
        .getElementById("zoomOutBtn")
        .addEventListener("click", () => changeZoom(-0.1));

    document
        .getElementById("resetCameraBtn")
        .addEventListener("click", resetCamera);

    createBoard();

    setupDragCamera();
}


// ==========================================
// CREAR JUGADORES
// ==========================================

function createPlayerInputs(count) {

    playerInputs.innerHTML = "";

    for (let i = 0; i < count; i++) {

        const row = document.createElement("div");
        row.className = "player-input";

        const color = document.createElement("span");
        color.className = "player-color";
        color.style.background = PLAYER_COLORS[i];

        const input = document.createElement("input");

        input.type = "text";
        input.maxLength = 18;
        input.placeholder = `Jugador ${i + 1}`;
        input.value = `Jugador ${i + 1}`;

        row.appendChild(color);
        row.appendChild(input);

        playerInputs.appendChild(row);
    }
}


// ==========================================
// CREAR TABLERO
// ==========================================

function createBoard() {

    /*
        El tablero usa coordenadas de 0 a 100%.

        La casilla 1 comienza abajo a la izquierda.

        Cada fila cambia de dirección:

        1 → 2 → 3 → ...
        ...
        20 ← 19 ← 18 ...
    */

    for (let number = 1; number <= BOARD_SIZE; number++) {

        const cell = document.createElement("div");

        cell.className = "board-cell";
        cell.dataset.position = number;

        const coordinates = getCellCoordinates(number);

        cell.style.left = `${coordinates.x}%`;
        cell.style.top = `${coordinates.y}%`;
        cell.style.width = "10%";
        cell.style.height = "10%";

        cell.textContent = number;

        if (number === 1) {
            cell.classList.add("special-start");
        }

        if (number === 100) {
            cell.classList.add("special-end");
        }

        if (SNAKES[number]) {
            cell.classList.add("snake-cell");
        }

        if (LADDERS[number]) {
            cell.classList.add("ladder-cell");
        }

        board.appendChild(cell);
    }
}


// ==========================================
// COORDENADAS DE LAS CASILLAS
// ==========================================

function getCellCoordinates(position) {

    const index = position - 1;

    const row = Math.floor(index / 10);

    let column = index % 10;

    /*
        Las filas alternan dirección.
    */

    if (row % 2 === 1) {
        column = 9 - column;
    }

    /*
        El tablero visual comienza desde arriba,
        pero el juego comienza desde abajo.
    */

    const visualRow = 9 - row;

    return {
        x: column * 10 + 5,
        y: visualRow * 10 + 5
    };
}


// ==========================================
// INICIAR PARTIDA
// ==========================================

function startGame() {

    const inputs = playerInputs.querySelectorAll("input");

    players = [];

    inputs.forEach((input, index) => {

        const name =
            input.value.trim() ||
            `Jugador ${index + 1}`;

        players.push({
            id: index,
            name,
            position: 1,
            color: PLAYER_COLORS[index]
        });
    });

    currentPlayer = 0;
    gameRunning = true;
    isMoving = false;

    setupScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    winnerModal.classList.add("hidden");

    createPieces();
    updatePlayersPanel();
    updateTurn();

    resetCamera();

    statusText.textContent = "Tira el dado para comenzar.";
}


// ==========================================
// CREAR FICHAS
// ==========================================

function createPieces() {

    piecesLayer.innerHTML = "";

    players.forEach(player => {

        const piece = document.createElement("div");

        piece.className = `piece p${player.id + 1}`;

        piece.id = `piece-${player.id}`;

        piece.setAttribute(
            "aria-label",
            `Ficha de ${player.name}`
        );

        piecesLayer.appendChild(piece);

        positionPiece(player);
    });
}


// ==========================================
// POSICIONAR FICHA
// ==========================================

function positionPiece(player) {

    const piece = document.getElementById(
        `piece-${player.id}`
    );

    if (!piece) return;

    const coordinates =
        getPieceCoordinates(player.position);

    piece.style.left = `${coordinates.x}%`;
    piece.style.top = `${coordinates.y}%`;
}


// ==========================================
// COORDENADAS DE FICHA
// ==========================================

function getPieceCoordinates(position) {

    if (position <= 1) {

        /*
            Varias fichas comienzan juntas.

            Las desplazamos ligeramente para
            que puedan verse.
        */

        const index =
            Math.max(0, currentPlayer);

        return {
            x: 5 + index * 1.5,
            y: 95
        };
    }

    return getCellCoordinates(position);
}


// ==========================================
// TIRAR DADO
// ==========================================

async function rollDice() {

    if (!gameRunning || isMoving) {
        return;
    }

    isMoving = true;

    rollBtn.disabled = true;

    const player = players[currentPlayer];

    statusText.textContent =
        `${player.name} está tirando el dado...`;

    /*
        Primero hacemos zoom hacia el tablero completo.
    */

    await focusBoard();

    dice.classList.add("rolling");

    /*
        Animación visual del dado.
    */

    for (let i = 0; i < 10; i++) {

        const temporaryNumber =
            Math.floor(Math.random() * 6) + 1;

        dice.innerHTML =
            `<span>${DICE_SYMBOLS[temporaryNumber]}</span>`;

        await wait(70);
    }

    const result =
        Math.floor(Math.random() * 6) + 1;

    dice.classList.remove("rolling");

    dice.innerHTML =
        `<span>${DICE_SYMBOLS[result]}</span>`;

    statusText.textContent =
        `${player.name} sacó ${result}.`;

    await wait(500);

    /*
        Calculamos destino.
    */

    let target = player.position + result;

    /*
        Regla clásica:
        si supera 100, no se mueve.
    */

    if (target > 100) {

        statusText.textContent =
            `${player.name} necesita sacar un número menor para llegar a 100.`;

        await wait(1200);

        nextTurn();

        return;
    }

    /*
        Movimiento casilla por casilla.
    */

    await movePlayerStepByStep(player, target);

    /*
        Revisar serpiente o escalera.
    */

    let finalPosition = target;

    if (LADDERS[target]) {

        finalPosition = LADDERS[target];

        statusText.textContent =
            `¡${player.name} encontró una escalera!`;

        await focusOnPosition(target);

        await wait(700);

        await movePlayerStepByStep(
            player,
            finalPosition,
            true
        );

    } else if (SNAKES[target]) {

        finalPosition = SNAKES[target];

        statusText.textContent =
            `¡${player.name} cayó en una serpiente!`;

        await focusOnPosition(target);

        await wait(700);

        await movePlayerStepByStep(
            player,
            finalPosition,
            true
        );
    }

    /*
        Comprobar victoria.
    */

    if (finalPosition === 100) {

        player.position = 100;

        positionPiece(player);

        await focusOnPosition(100);

        await wait(700);

        showWinner(player);

        isMoving = false;

        return;
    }

    /*
        Siguiente turno.
    */

    await wait(600);

    nextTurn();
}


// ==========================================
// MOVIMIENTO PASO A PASO
// ==========================================

async function movePlayerStepByStep(
    player,
    target,
    specialMove = false
) {

    const piece =
        document.getElementById(`piece-${player.id}`);

    if (piece) {
        piece.classList.add("moving");
    }

    const direction =
        target > player.position ? 1 : -1;

    while (player.position !== target) {

        player.position += direction;

        positionPiece(player);

        /*
            La cámara se enfoca en cada casilla.

            Esto produce el efecto de cámara
            siguiendo la ficha.
        */

        await focusOnPosition(
            player.position,
            specialMove
        );

        updatePlayersPanel();

        await wait(
            specialMove ? 170 : 220
        );
    }

    if (piece) {
        piece.classList.remove("moving");
    }
}


// ==========================================
// SIGUIENTE TURNO
// ==========================================

function nextTurn() {

    currentPlayer++;

    if (currentPlayer >= players.length) {
        currentPlayer = 0;
    }

    updateTurn();

    /*
        Volvemos primero al tablero completo.
    */

    focusBoard();

    isMoving = false;

    rollBtn.disabled = false;

    statusText.textContent =
        "Tira el dado.";
}


// ==========================================
// ACTUALIZAR TURNO
// ==========================================

function updateTurn() {

    const player =
        players[currentPlayer];

    if (!player) return;

    turnName.textContent =
        player.name;

    turnColor.style.background =
        player.color;

    updatePlayersPanel();
}


// ==========================================
// PANEL DE JUGADORES
// ==========================================

function updatePlayersPanel() {

    playersPanel.innerHTML = "";

    players.forEach((player, index) => {

        const row = document.createElement("div");

        row.className =
            "player-row" +
            (index === currentPlayer
                ? " current"
                : "");

        const color =
            document.createElement("span");

        color.className = "player-color";

        color.style.background =
            player.color;

        const info =
            document.createElement("div");

        info.className =
            "player-row-info";

        info.innerHTML = `
            <span class="player-row-name">
                ${escapeHTML(player.name)}
            </span>

            <span class="player-position">
                Casilla ${player.position}
            </span>
        `;

        row.appendChild(color);
        row.appendChild(info);

        playersPanel.appendChild(row);
    });
}


// ==========================================
// CÁMARA
// ==========================================

function focusBoard() {

    return new Promise(resolve => {

        zoom = 1;

        board.style.transform =
            `translate(0px, 0px) scale(${zoom})`;

        updateZoomLabel();

        setTimeout(resolve, 650);
    });
}


function focusOnPosition(position, fast = false) {

    return new Promise(resolve => {

        const coordinates =
            getCellCoordinates(position);

        /*
            Coordenadas normalizadas.
        */

        const x =
            50 - coordinates.x;

        const y =
            50 - coordinates.y;

        /*
            Zoom dinámico.

            En pantallas grandes usamos más zoom.
        */

        zoom = fast ? 1.65 : 1.8;

        const cameraWidth =
            boardCamera.clientWidth;

        const cameraHeight =
            boardCamera.clientHeight;

        const boardWidth =
            board.clientWidth;

        const boardHeight =
            board.clientHeight;

        /*
            Calculamos desplazamiento aproximado.
        */

        const translateX =
            (x / 100) *
            boardWidth *
            (zoom - 1);

        const translateY =
            (y / 100) *
            boardHeight *
            (zoom - 1);

        board.style.transform =
            `translate(${translateX}px, ${translateY}px) scale(${zoom})`;

        updateZoomLabel();

        setTimeout(
            resolve,
            fast ? 80 : 180
        );
    });
}


// ==========================================
// ZOOM MANUAL
// ==========================================

function changeZoom(amount) {

    zoom += amount;

    zoom =
        Math.max(
            0.7,
            Math.min(2.5, zoom)
        );

    board.style.transform =
        `translate(0px, 0px) scale(${zoom})`;

    updateZoomLabel();
}


function resetCamera() {

    zoom = 1;

    board.style.transform =
        "translate(0px, 0px) scale(1)";

    updateZoomLabel();
}


function updateZoomLabel() {

    zoomValue.textContent =
        `${Math.round(zoom * 100)}%`;
}


// ==========================================
// ARRASTRAR TABLERO
// ==========================================

function setupDragCamera() {

    let dragging = false;

    let startX = 0;
    let startY = 0;

    let currentX = 0;
    let currentY = 0;

    boardCamera.addEventListener(
        "pointerdown",
        event => {

            if (isMoving) return;

            dragging = true;

            startX = event.clientX;
            startY = event.clientY;

            boardCamera.setPointerCapture(
                event.pointerId
            );
        }
    );

    boardCamera.addEventListener(
        "pointermove",
        event => {

            if (!dragging) return;

            currentX =
                event.clientX - startX;

            currentY =
                event.clientY - startY;

            board.style.transform =
                `translate(${currentX}px, ${currentY}px) scale(${zoom})`;
        }
    );

    boardCamera.addEventListener(
        "pointerup",
        () => {

            dragging = false;
        }
    );

    boardCamera.addEventListener(
        "pointercancel",
        () => {

            dragging = false;
        }
    );
}


// ==========================================
// GANADOR
// ==========================================

function showWinner(player) {

    gameRunning = false;

    winnerName.textContent =
        player.name;

    winnerModal.classList.remove(
        "hidden"
    );

    rollBtn.disabled = true;
}


// ==========================================
// NUEVA PARTIDA
// ==========================================

function newGame() {

    gameRunning = false;
    isMoving = false;

    winnerModal.classList.add("hidden");

    gameScreen.classList.add("hidden");
    setupScreen.classList.remove("hidden");

    dice.innerHTML = "<span>?</span>";

    resetCamera();

    createPlayerInputs(playerCount);
}


// ==========================================
// UTILIDADES
// ==========================================

function wait(milliseconds) {

    return new Promise(resolve => {

        setTimeout(
            resolve,
            milliseconds
        );
    });
}


function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}