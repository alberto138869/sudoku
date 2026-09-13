const BASE_SOLUTION = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9], [4, 5, 6, 7, 8, 9, 1, 2, 3], [7, 8, 9, 1, 2, 3, 4, 5, 6],
  [2, 3, 4, 5, 6, 7, 8, 9, 1], [5, 6, 7, 8, 9, 1, 2, 3, 4], [8, 9, 1, 2, 3, 4, 5, 6, 7],
  [3, 4, 5, 6, 7, 8, 9, 1, 2], [6, 7, 8, 9, 1, 2, 3, 4, 5], [9, 1, 2, 3, 4, 5, 6, 7, 8],
];

const BASE_PUZZLE = [
  "..345.7.9", "45.7.912.", "089.23.5.", "2.4.67.9.", ".6.89.2.4",
  "8.12.4.6.", ".4.67.9.2", "6.8.12.4.", ".1.3.56.8",
];

const LEVELS = {
  easy: { label: "Fácil", extraClues: [[0, 0], [0, 1], [0, 5], [0, 7], [1, 2], [1, 4], [1, 8], [2, 0], [2, 3], [2, 6]] },
  medium: { label: "Média", extraClues: [] },
  hard: { label: "Difícil", extraClues: [], extraBlanks: [[0, 2], [4, 4], [8, 6], [1, 0], [7, 7]] },
};

const board = document.querySelector("#sudoku");
const status = document.querySelector("#status");
const difficulty = document.querySelector("#difficulty");
const timerElement = document.querySelector("#timer");
const mistakesElement = document.querySelector("#mistakes");
const scoreElement = document.querySelector("#score");

let solution = BASE_SOLUTION.map((row) => row.slice());
let puzzle = [];
let gameNumber = 0;
let elapsed = 0;
let mistakes = 0;
let score = 1000;
let timerId;

function setStatus(message, type = "") {
  status.textContent = message;
  status.className = `status ${type}`.trim();
}

function updateStats() {
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");
  timerElement.textContent = `${minutes}:${seconds}`;
  mistakesElement.textContent = mistakes;
  scoreElement.textContent = score;
}

function shiftedNumber(number, shift) {
  return ((number - 1 + shift) % 9) + 1;
}

function createGame(level) {
  const shift = gameNumber % 9;
  solution = BASE_SOLUTION.map((row) => row.map((number) => shiftedNumber(number, shift)));
  const grid = BASE_PUZZLE.map((row) => [...row].map((value) => (
    value === "." || value === "0" ? 0 : shiftedNumber(Number(value), shift)
  )));
  const settings = LEVELS[level];

  settings.extraClues?.forEach(([row, column]) => {
    grid[row][column] = solution[row][column];
  });
  settings.extraBlanks?.forEach(([row, column]) => {
    grid[row][column] = 0;
  });
  return grid;
}

function areInSameUnit(first, second) {
  const sameRow = first.dataset.row === second.dataset.row;
  const sameColumn = first.dataset.column === second.dataset.column;
  const sameBlock = Math.floor(first.dataset.row / 3) === Math.floor(second.dataset.row / 3)
    && Math.floor(first.dataset.column / 3) === Math.floor(second.dataset.column / 3);
  return sameRow || sameColumn || sameBlock;
}

function clearHighlights() {
  board.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("related", "same-number");
  });
}

function highlightCell(selected) {
  clearHighlights();
  board.querySelectorAll(".cell").forEach((cell) => {
    if (areInSameUnit(selected, cell)) cell.classList.add("related");
    if (selected.value && cell.value === selected.value) cell.classList.add("same-number");
  });
}

function renderBoard() {
  board.replaceChildren();
  puzzle.forEach((row, rowIndex) => row.forEach((value, columnIndex) => {
    const cell = document.createElement("input");
    cell.className = "cell";
    cell.type = "text";
    cell.inputMode = "numeric";
    cell.maxLength = 1;
    cell.dataset.row = rowIndex;
    cell.dataset.column = columnIndex;
    cell.setAttribute("aria-label", `Linha ${rowIndex + 1}, coluna ${columnIndex + 1}`);

    if (value) {
      cell.value = value;
      cell.readOnly = true;
      cell.classList.add("given");
    } else {
      cell.addEventListener("input", handleInput);
    }

    cell.addEventListener("focus", () => highlightCell(cell));
    cell.addEventListener("blur", clearHighlights);
    board.appendChild(cell);
  }));
}

function hasConflict(cell) {
  return [...board.querySelectorAll(".cell")].some((other) => (
    other !== cell && other.value === cell.value && areInSameUnit(cell, other)
  ));
}

function isSolved() {
  return [...board.querySelectorAll(".cell")].every((cell) => (
    cell.value && Number(cell.value) === solution[cell.dataset.row][cell.dataset.column]
  ));
}

function finishGame(message, type = "success") {
  clearInterval(timerId);
  setStatus(message, type);
}

function handleInput(event) {
  const cell = event.currentTarget;
  cell.value = cell.value.replace(/[^1-9]/g, "");
  cell.classList.remove("invalid");

  if (!cell.value) {
    setStatus("Em andamento");
    highlightCell(cell);
    return;
  }

  const row = Number(cell.dataset.row);
  const column = Number(cell.dataset.column);
  const incorrect = hasConflict(cell) || Number(cell.value) !== solution[row][column];

  if (incorrect) {
    cell.classList.add("invalid");
    mistakes += 1;
    score = Math.max(0, score - 50);
    setStatus(mistakes >= 3 ? "Cuidado: muitos erros" : "Confira essa resposta", "error");
  } else {
    setStatus("Em andamento");
  }

  updateStats();
  highlightCell(cell);
  if (isSolved()) {
    score = Math.max(0, score - elapsed);
    updateStats();
    finishGame("Parabéns! Sudoku resolvido");
  }
}

function startGame() {
  clearInterval(timerId);
  gameNumber += 1;
  puzzle = createGame(difficulty.value);
  elapsed = 0;
  mistakes = 0;
  score = 1000;
  document.querySelector("#challenge-title").textContent = `Dificuldade ${LEVELS[difficulty.value].label.toLowerCase()}`;
  renderBoard();
  updateStats();
  setStatus("Em andamento");
  timerId = setInterval(() => {
    elapsed += 1;
    score = Math.max(0, 1000 - mistakes * 50 - elapsed);
    updateStats();
  }, 1000);
}

difficulty.addEventListener("change", startGame);
document.querySelector("#new-game-button").addEventListener("click", startGame);

document.querySelector("#clear-button").addEventListener("click", () => {
  board.querySelectorAll(".cell:not(.given)").forEach((cell) => {
    cell.value = "";
    cell.classList.remove("invalid");
  });
  mistakes = 0;
  setStatus("Em andamento");
  updateStats();
});

document.querySelector("#hint-button").addEventListener("click", () => {
  const empty = [...board.querySelectorAll(".cell:not(.given)")].find((cell) => !cell.value);
  if (!empty) {
    setStatus("Não há casas vazias", "success");
    return;
  }

  empty.value = solution[empty.dataset.row][empty.dataset.column];
  empty.classList.remove("invalid");
  score = Math.max(0, score - 100);
  updateStats();
  highlightCell(empty);
  setStatus(isSolved() ? "Parabéns! Sudoku resolvido" : "Uma casa foi preenchida", "success");
  if (isSolved()) clearInterval(timerId);
});

document.querySelector("#solution-button").addEventListener("click", () => {
  board.querySelectorAll(".cell:not(.given)").forEach((cell) => {
    cell.value = solution[cell.dataset.row][cell.dataset.column];
    cell.classList.remove("invalid");
  });
  finishGame("Solução revelada");
});

startGame();
