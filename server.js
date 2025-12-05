const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 4000;

// Serve static files from public/
app.use(express.static("public"));

// Simple quiz data
const questions = [
  {
    text: "Which language is most commonly used to build web frontends?",
    options: ["Python", "JavaScript", "C++", "Go"],
    correctIndex: 1
  },
  {
    text: "What does HTTP stand for?",
    options: [
      "Hyper Trainer Transfer Protocol",
      "Hyper Text Transfer Protocol",
      "High Transfer Text Protocol",
      "Hyperlink Transfer Text Process"
    ],
    correctIndex: 1
  },
  {
    text: "Which of these best describes an API?",
    options: [
      "A database",
      "A debugging tool",
      "A contract for how software can talk to each other",
      "A web browser plugin"
    ],
    correctIndex: 2
  }
];

let currentQuestionIndex = 0;
const players = {}; // socket.id -> { name, score }

// Helper to build state for all clients
function buildGameState() {
  const question = questions[currentQuestionIndex];
  const leaderboard = Object.values(players)
    .sort((a, b) => b.score - a.score);

  return {
    question: {
      text: question.text,
      options: question.options,
      index: currentQuestionIndex
    },
    leaderboard
  };
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // When a player joins, they send their name
  socket.on("join", (name) => {
    players[socket.id] = { name: name || "Player", score: 0 };
    io.to(socket.id).emit("joined", players[socket.id]);
    io.emit("state", buildGameState());
  });

  // Handle answer from a player
  socket.on("answer", (optionIndex) => {
    const question = questions[currentQuestionIndex];
    if (!question) return;

    const player = players[socket.id];
    if (!player) return;

    const correct = optionIndex === question.correctIndex;
    if (correct) {
      player.score += 1;
    }

    // Tell just this player if they were right
    io.to(socket.id).emit("answerResult", {
      correct,
      correctAnswer: question.options[question.correctIndex]
    });

    // Broadcast updated state to everyone
    io.emit("state", buildGameState());
  });

  // Move to next question (any player can trigger for now)
  socket.on("nextQuestion", () => {
    currentQuestionIndex = (currentQuestionIndex + 1) % questions.length;
    io.emit("state", buildGameState());
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    delete players[socket.id];
    io.emit("state", buildGameState());
  });
});

server.listen(PORT, () => {
  console.log("QuizArena server running on port", PORT);
});
