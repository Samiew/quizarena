const socket = io();

const joinScreen = document.getElementById("join-screen");
const gameScreen = document.getElementById("game-screen");
const nameInput = document.getElementById("nameInput");
const joinBtn = document.getElementById("joinBtn");
const playerInfo = document.getElementById("playerInfo");
const questionText = document.getElementById("questionText");
const optionsBox = document.getElementById("options");
const resultBox = document.getElementById("result");
const leaderboardList = document.getElementById("leaderboard");
const nextBtn = document.getElementById("nextBtn");

let myPlayer = null;

// Join game
joinBtn.addEventListener("click", () => {
  const name = nameInput.value.trim() || "Player";
  socket.emit("join", name);
});

// Server confirms join
socket.on("joined", (player) => {
  myPlayer = player;
  playerInfo.innerText = `You: ${player.name} | Score: ${player.score}`;
  joinScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
});

// Receive game state: question + leaderboard
socket.on("state", (state) => {
  if (!state || !state.question) return;

  // Update question
  questionText.innerText = state.question.text;
  optionsBox.innerHTML = "";
  resultBox.innerText = "";

  state.question.options.forEach((opt, index) => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.className = "option-btn";
    btn.onclick = () => {
      socket.emit("answer", index);
    };
    optionsBox.appendChild(btn);
  });

  // Update leaderboard
  leaderboardList.innerHTML = "";
  state.leaderboard.forEach((p) => {
    const li = document.createElement("li");
    li.innerText = `${p.name}: ${p.score}`;
    leaderboardList.appendChild(li);
  });

  if (myPlayer) {
    const me = state.leaderboard.find((p) => p.name === myPlayer.name);
    if (me) {
      playerInfo.innerText = `You: ${me.name} | Score: ${me.score}`;
    }
  }
});

// Show per-answer feedback
socket.on("answerResult", (info) => {
  resultBox.innerText = info.correct
    ? "✅ Correct!"
    : `❌ Incorrect. Correct answer: ${info.correctAnswer}`;
});

// Next question
nextBtn.addEventListener("click", () => {
  socket.emit("nextQuestion");
});
