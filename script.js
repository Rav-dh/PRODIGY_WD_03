// Game State
const state = {
    gameBoard: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    gameActive: false,
    gameMode: null, // 'friend' or 'ai'
    playerXName: 'Player X',
    playerOName: 'Player O',
    scoreX: 0,
    scoreO: 0,
    timeLeft: 60,
    timerInterval: null,
    aiDifficulty: 'easy',
    humanPlayerMark: 'X'
};

// Winning Combinations
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
];

// DOM Elements
const elements = {
    modeSelectionScreen: document.getElementById('mode-selection'),
    gameSetupScreen: document.getElementById('game-setup'),
    gameScreen: document.getElementById('game-screen'),
    gameEndModal: document.getElementById('game-end-modal'),
    playFriendBtn: document.getElementById('play-friend-btn'),
    playAiBtn: document.getElementById('play-ai-btn'),
    startGameBtn: document.getElementById('start-game-btn'),
    backFromGameBtn: document.getElementById('back-from-game-btn'),
    friendInputs: document.getElementById('friend-inputs'),
    playerXNameInput: document.getElementById('playerXName'),
    playerONameInput: document.getElementById('playerOName'),
    aiDifficultySection: document.getElementById('ai-difficulty'),
    difficultyButtons: document.querySelectorAll('.difficulty-btn'),
    playerChoiceButtons: document.querySelectorAll('.player-choice-btn'),
    displayPlayerXName: document.getElementById('displayPlayerXName'),
    displayPlayerOName: document.getElementById('displayPlayerOName'),
    scoreXDisplay: document.getElementById('scoreX'),
    scoreODisplay: document.getElementById('scoreO'),
    turnTextDisplay: document.getElementById('turnText'),
    timerDisplay: document.getElementById('timerDisplay'),
    gameBoardContainer: document.getElementById('game-board'),
    modalMessage: document.getElementById('modal-message'),
    replayBtn: document.getElementById('replay-btn'),
    exitBtn: document.getElementById('exit-btn'),
    aiThinking: document.getElementById('ai-thinking')
};

// Utility Functions
function switchScreen(screenToShow, screenToHide = null) {
    if (!screenToShow) return;
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.classList.add('hidden');
    });
    screenToShow.classList.remove('hidden');
    screenToShow.classList.add('active');
}

function updateScoreboard() {
    if (elements.scoreXDisplay && elements.scoreODisplay) {
        elements.scoreXDisplay.textContent = state.scoreX;
        elements.scoreODisplay.textContent = state.scoreO;
    }
}

function updateTurnDisplay() {
    if (elements.turnTextDisplay && elements.aiThinking) {
        elements.turnTextDisplay.textContent = state.currentPlayer === 'X' ? state.playerXName : state.playerOName;
        const isAITurn = state.gameMode === 'ai' && state.currentPlayer !== state.humanPlayerMark;
        elements.aiThinking.classList.toggle('hidden', !isAITurn);
    }
}

function createGameBoard() {
    if (!elements.gameBoardContainer) return;
    elements.gameBoardContainer.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', `Cell ${i + 1}, empty`);
        cell.addEventListener('click', handleCellClick);
        elements.gameBoardContainer.appendChild(cell);
    }
}

function resetGame() {
    state.gameBoard = ['', '', '', '', '', '', '', '', ''];
    state.currentPlayer = 'X';
    state.gameActive = true;
    createGameBoard();
    resetTimer();
    updateTurnDisplay();
    updateScoreboard();
    if (elements.gameEndModal) {
        elements.gameEndModal.classList.remove('active');
        elements.gameEndModal.setAttribute('aria-hidden', 'true');
    }
    document.querySelectorAll('.winning-cell').forEach(cell => cell.classList.remove('winning-cell'));
}

// Timer Functions
function startTimer() {
    clearInterval(state.timerInterval);
    state.timeLeft = 60;
    updateTimerDisplay();

    state.timerInterval = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay();
        if (state.timeLeft <= 0 && state.gameActive) {
            clearInterval(state.timerInterval);
            const opponent = state.currentPlayer === 'X' ? state.playerOName : state.playerXName;
            state.scoreX += state.currentPlayer === 'O' ? 1 : 0;
            state.scoreO += state.currentPlayer === 'X' ? 1 : 0;
            updateScoreboard();
            endGame(`Time's up! ${opponent} wins by timeout!`);
        }
    }, 1000);
}

function updateTimerDisplay() {
    if (elements.timerDisplay) {
        elements.timerDisplay.textContent = state.timeLeft;
        elements.timerDisplay.classList.remove('green-timer', 'yellow-timer', 'red-timer');
        elements.timerDisplay.classList.add(
            state.timeLeft <= 10 ? 'red-timer' :
            state.timeLeft <= 30 ? 'yellow-timer' : 'green-timer'
        );
    }
}

function resetTimer() {
    clearInterval(state.timerInterval);
    state.timeLeft = 60;
    updateTimerDisplay();
}

// Game Logic
function handleCellClick(event) {
    if (!state.gameActive) return;
    const clickedCell = event.target;
    const index = parseInt(clickedCell.dataset.index);
    if (isNaN(index) || state.gameBoard[index] !== '') return;

    state.gameBoard[index] = state.currentPlayer;
    clickedCell.textContent = state.currentPlayer;
    clickedCell.classList.add('marked', `${state.currentPlayer.toLowerCase()}-mark`);
    clickedCell.setAttribute('aria-label', `Cell ${index + 1}, marked ${state.currentPlayer}`);

    const result = checkGameResult();
    if (result) {
        endGame(result);
    } else {
        switchPlayer();
        startTimer();
        if (state.gameMode === 'ai' && state.currentPlayer !== state.humanPlayerMark) {
            setTimeout(makeAIMove, 700);
        }
    }
}

function switchPlayer() {
    state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
    updateTurnDisplay();
}

function checkGameResult() {
    for (const [a, b, c] of winningConditions) {
        if (state.gameBoard[a] && state.gameBoard[a] === state.gameBoard[b] && state.gameBoard[a] === state.gameBoard[c]) {
            [a, b, c].forEach(index => elements.gameBoardContainer.children[index].classList.add('winning-cell'));
            const winnerName = state.currentPlayer === 'X' ? state.playerXName : state.playerOName;
            state.scoreX += state.currentPlayer === 'X' ? 1 : 0;
            state.scoreO += state.currentPlayer === 'O' ? 1 : 0;
            updateScoreboard();
            let message = `Congratulations, ${winnerName} wins!`;
            if (state.gameMode === 'ai' && state.currentPlayer !== state.humanPlayerMark) {
                message = `Sorry, ${state.humanPlayerMark === 'X' ? state.playerXName : state.playerOName} loses. Better luck next time!`;
            }
            return message;
        }
    }
    if (!state.gameBoard.includes('')) {
        return `It's a Draw!`;
    }
    return null;
}

function endGame(message) {
    state.gameActive = false;
    clearInterval(state.timerInterval);
    if (elements.modalMessage && elements.gameEndModal) {
        elements.modalMessage.textContent = message;
        elements.gameEndModal.classList.add('active');
        elements.gameEndModal.setAttribute('aria-hidden', 'false');
    }
}

// AI Logic
// Easy: Random move
// Medium: Win if possible, block player win, else random
// Hard: Win, block, take center, corners, then sides
function makeAIMove() {
    if (!state.gameActive || !elements.gameBoardContainer) return;
    let move;
    switch (state.aiDifficulty) {
        case 'easy': move = getRandomEmptyCell(); break;
        case 'medium': move = getMediumAIMove(); break;
        case 'hard': move = getHardAIMove(); break;
    }
    if (move !== -1 && state.gameBoard[move] === '') {
        const cell = elements.gameBoardContainer.children[move];
        if (cell) {
            cell.classList.add('ai-move');
            handleCellClick({ target: cell });
        }
    }
}

function getRandomEmptyCell() {
    const emptyCells = state.gameBoard
        .map((cell, i) => cell === '' ? i : null)
        .filter(i => i !== null);
    return emptyCells.length ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : -1;
}

function getMediumAIMove() {
    const aiMark = state.humanPlayerMark === 'X' ? 'O' : 'X';
    const humanMark = state.humanPlayerMark;
    return findWinningMove(aiMark) !== -1 ? findWinningMove(aiMark) :
           findWinningMove(humanMark) !== -1 ? findWinningMove(humanMark) :
           getRandomEmptyCell();
}

function getHardAIMove() {
    const aiMark = state.humanPlayerMark === 'X' ? 'O' : 'X';
    const humanMark = state.humanPlayerMark;
    if (findWinningMove(aiMark) !== -1) return findWinningMove(aiMark);
    if (findWinningMove(humanMark) !== -1) return findWinningMove(humanMark);
    if (state.gameBoard[4] === '') return 4;
    const corners = [0, 2, 6, 8].filter(i => state.gameBoard[i] === '');
    if (corners.length) return corners[0];
    const sides = [1, 3, 5, 7].filter(i => state.gameBoard[i] === '');
    return sides.length ? sides[0] : getRandomEmptyCell();
}

function findWinningMove(mark) {
    for (const [a, b, c] of winningConditions) {
        const line = [state.gameBoard[a], state.gameBoard[b], state.gameBoard[c]];
        if (line.filter(cell => cell === mark).length === 2 && line.includes('')) {
            return [a, b, c][line.indexOf('')];
        }
    }
    return -1;
}

// Event Listeners
function initialize() {
    if (!Object.values(elements).every(el => el || el === null)) {
        console.error('Missing DOM elements');
        return;
    }
    createGameBoard();
    switchScreen(elements.modeSelectionScreen);
    updateScoreboard();
    elements.difficultyButtons[0].classList.add('selected');
    elements.difficultyButtons[0].setAttribute('aria-checked', 'true');
    elements.playerChoiceButtons[0].classList.add('selected');
    elements.playerChoiceButtons[0].setAttribute('aria-checked', 'true');
}

elements.playFriendBtn.addEventListener('click', () => {
    state.gameMode = 'friend';
    elements.friendInputs.classList.remove('hidden');
    elements.aiDifficultySection.classList.add('hidden');
    switchScreen(elements.gameSetupScreen);
});

elements.playAiBtn.addEventListener('click', () => {
    state.gameMode = 'ai';
    elements.friendInputs.classList.add('hidden');
    elements.aiDifficultySection.classList.remove('hidden');
    switchScreen(elements.gameSetupScreen);
});

elements.difficultyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.difficultyButtons.forEach(b => {
            b.classList.remove('selected');
            b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-checked', 'true');
        state.aiDifficulty = btn.dataset.difficulty;
    });
});

elements.playerChoiceButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.playerChoiceButtons.forEach(b => {
            b.classList.remove('selected');
            b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-checked', 'true');
        state.humanPlayerMark = btn.dataset.playerMark;
        console.log(`Player chose to play as: ${state.humanPlayerMark}`); // Debug
    });
});

elements.startGameBtn.addEventListener('click', () => {
    state.scoreX = 0;
    state.scoreO = 0;
    if (state.gameMode === 'friend') {
        state.playerXName = elements.playerXNameInput.value.trim().slice(0, 20) || 'Player X';
        state.playerOName = elements.playerONameInput.value.trim().slice(0, 20) || 'Player O';
        if (state.playerXName === state.playerOName) {
            state.playerOName += ' 2';
            alert('Player names were identical; Player O name updated to avoid confusion.');
        }
        state.currentPlayer = 'X';
    } else {
        state.playerXName = state.humanPlayerMark === 'X' ? 'You (X)' : `AI (${state.aiDifficulty.toUpperCase()}) (X)`;
        state.playerOName = state.humanPlayerMark === 'O' ? 'You (O)' : `AI (${state.aiDifficulty.toUpperCase()}) (O)`;
        state.currentPlayer = 'X';
    }
    elements.displayPlayerXName.textContent = state.playerXName;
    elements.displayPlayerOName.textContent = state.playerOName;
    resetGame();
    startTimer();
    switchScreen(elements.gameScreen);
    if (state.gameMode === 'ai' && state.currentPlayer !== state.humanPlayerMark) {
        setTimeout(makeAIMove, 700);
    }
});

elements.backFromGameBtn.addEventListener('click', () => {
    clearInterval(state.timerInterval);
    resetGame();
    elements.playerXNameInput.value = 'Player X';
    elements.playerONameInput.value = 'Player O';
    elements.difficultyButtons.forEach(btn => {
        btn.classList.remove('selected');
        btn.setAttribute('aria-checked', 'false');
    });
    elements.difficultyButtons[0].classList.add('selected');
    elements.difficultyButtons[0].setAttribute('aria-checked', 'true');
    elements.playerChoiceButtons.forEach(btn => {
        btn.classList.remove('selected');
        btn.setAttribute('aria-checked', 'false');
    });
    elements.playerChoiceButtons[0].classList.add('selected');
    elements.playerChoiceButtons[0].setAttribute('aria-checked', 'true');
    state.aiDifficulty = 'easy';
    state.humanPlayerMark = 'X';
    switchScreen(elements.modeSelectionScreen);
});

elements.replayBtn.addEventListener('click', () => {
    resetGame();
    startTimer();
    if (state.gameMode === 'ai' && state.currentPlayer !== state.humanPlayerMark) {
        setTimeout(makeAIMove, 700);
    }
});

elements.exitBtn.addEventListener('click', () => {
    state.scoreX = 0;
    state.scoreO = 0;
    updateScoreboard();
    elements.playerXNameInput.value = 'Player X';
    elements.playerONameInput.value = 'Player O';
    elements.difficultyButtons.forEach(btn => {
        btn.classList.remove('selected');
        btn.setAttribute('aria-checked', 'false');
    });
    elements.difficultyButtons[0].classList.add('selected');
    elements.difficultyButtons[0].setAttribute('aria-checked', 'true');
    elements.playerChoiceButtons.forEach(btn => {
        btn.classList.remove('selected');
        btn.setAttribute('aria-checked', 'false');
    });
    elements.playerChoiceButtons[0].classList.add('selected');
    elements.playerChoiceButtons[0].setAttribute('aria-checked', 'true');
    state.aiDifficulty = 'easy';
    state.humanPlayerMark = 'X';
    resetGame();
    switchScreen(elements.modeSelectionScreen);
});

// Initialize
document.addEventListener('DOMContentLoaded', initialize);