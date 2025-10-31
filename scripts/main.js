const PUZZLES = {
  photo: {
    answers: ["Monaco"],
    digit: "0",
    successMessage: "Sì! Ti ricordi perfettamente quel giorno 💛",
  },
  anime: {
    answers: ["HunterXHunter", "Hunter X Hunter", "HxH"],
    digit: "3",
    successMessage: "Giusto! Pronta a canticchiare insieme?",
    audio: "assets/audio/anime-theme.mp3",
  },
  date: {
    answers: ["28/12/2023", "28-12-2023", "28 12 2023", "28 dicembre 2023"],
    digit: "0",
    successMessage: "Quella data è scolpita nel cuore ❤️",
  },
  music: {
    answers: [
      "Knocking On Heaven's Door",
      "Knockin' On Heaven's Door",
      "Knocking on Heavens Door",
      "Knockin on Heavens Door",
    ],
    digit: "7",
    successMessage: "Esatto! La nostra colonna sonora.",
  },
};

const puzzleOrder = ["photo", "anime", "date", "music"];

const doorCode = puzzleOrder
  .map((puzzleId) => PUZZLES[puzzleId].digit)
  .join("");

const solvedPuzzles = new Set();
const digitSlots = document.querySelectorAll("#code-digits li");
const successSound = document.getElementById("success-sound");
const doorSound = document.getElementById("door-open-sound");
let animeSong;
const stopAnimeButton = document.querySelector("#puzzle-anime .stop-anime");

document.querySelectorAll(".answer-form").forEach((form) => {
  form.addEventListener("submit", handleAnswerSubmit);
});

document.querySelectorAll(".close-modal").forEach((button) => {
  button.addEventListener("click", () => {
    const dialog = button.closest("dialog");
    if (dialog) dialog.close();
  });
});

document.querySelectorAll(".frame-button").forEach((button) => {
  button.addEventListener("click", () => {
    const dialogId = button.dataset.target;
    const dialog = document.getElementById(dialogId);
    if (dialog && typeof dialog.showModal === "function") {
      dialog.showModal();
    }
  });
});

document.querySelector(".play-audio")?.addEventListener("click", () => {
  const clip = document.getElementById("memory-clip");
  clip?.currentTime && (clip.currentTime = 0);
  clip?.play()?.catch(() => {
    // L'utente può dover interagire prima di riprodurre l'audio; ignoriamo l'errore.
  });
});

stopAnimeButton?.addEventListener("click", () => {
  stopAnimePlayback();
});

document.getElementById("door-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const { code } = event.target.elements;
  const feedback = event.target.nextElementSibling;

  if (!code || !feedback) return;

  const userInput = code.value.trim();
  if (userInput === doorCode) {
    feedback.hidden = false;
    feedback.textContent = "La porta si apre lentamente...";
    feedback.className = "feedback success";
    doorSound?.play()?.catch(() => undefined);
    revealFinalMessage();
  } else {
    feedback.hidden = false;
    feedback.textContent = "Il tastierino lampeggia rosso. Codice errato.";
    feedback.className = "feedback error";
  }
});

function handleAnswerSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const puzzleId = form.dataset.puzzle;
  const puzzle = PUZZLES[puzzleId];

  if (!puzzle) return;

  const input = form.elements.namedItem("answer");
  const feedback = form.nextElementSibling;
  if (!(input instanceof HTMLInputElement) || !feedback) return;

  const userInput = normalizeAnswer(input.value);
  if (!userInput) return;

  if (isCorrectAnswer(puzzle, userInput)) {
    solvedPuzzles.add(puzzleId);
    lockForm(form);
    registerDigit(puzzleId, puzzle);
    displaySuccess(feedback, puzzle.successMessage);
    playSuccessCue(puzzleId, puzzle);
  } else {
    displayError(feedback, "Ops! Riprova, questa risposta non torna.");
  }
}

function normalizeAnswer(rawString) {
  return rawString
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/['’`´]/g, "")
    .replace(/\s+/g, " ");
}

function isCorrectAnswer(puzzle, normalizedUserInput) {
  const answers = Array.isArray(puzzle.answers)
    ? puzzle.answers
    : puzzle.answer
    ? [puzzle.answer]
    : [];

  return answers.some(
    (answer) => normalizedUserInput === normalizeAnswer(answer)
  );
}

function lockForm(form) {
  form
    .querySelectorAll("input, button")
    .forEach((field) => field.setAttribute("disabled", "true"));
}

function registerDigit(puzzleId, puzzle) {
  const slotIndex = puzzleOrder.indexOf(puzzleId);
  if (slotIndex < 0 || slotIndex >= digitSlots.length) return;

  digitSlots[slotIndex].textContent = puzzle.digit;
  digitSlots[slotIndex].classList.add("revealed");

  if (puzzleId === "photo") {
    unveilPhoto();
  }

  if (puzzleId === "anime") {
    document
      .querySelector("#puzzle-anime .anime-still")
      ?.classList.remove("blurred");
  }

  if (solvedPuzzles.size === puzzleOrder.length) {
    document
      .querySelector(".final-door .feedback")
      ?.setAttribute("hidden", "true");
  }
}

function displaySuccess(feedbackNode, message) {
  feedbackNode.hidden = false;
  feedbackNode.textContent = message;
  feedbackNode.className = "feedback success";
  successSound?.play()?.catch(() => undefined);
}

function displayError(feedbackNode, message) {
  feedbackNode.hidden = false;
  feedbackNode.textContent = message;
  feedbackNode.className = "feedback error";
}

function playSuccessCue(puzzleId, puzzle) {
  if (puzzleId === "photo") {
    const dialog = document.getElementById("photo-modal");
    setTimeout(() => dialog?.close(), 1500);
  }

  if (puzzleId === "anime" && puzzle.audio) {
    if (!animeSong) {
      animeSong = new Audio(puzzle.audio);
      animeSong.addEventListener("ended", hideAnimeStopButton);
    }
    animeSong.currentTime = 0;
    animeSong.play().then(showAnimeStopButton).catch(() => {
      // Se il browser blocca l'autoplay mostriamo comunque il tasto stop.
      showAnimeStopButton();
    });

    const dialog = document.getElementById("anime-modal");
    setTimeout(() => dialog?.close(), 1500);
  }
}

function unveilPhoto() {
  const photo = document.querySelector("#photo-modal .memory-photo");
  if (photo) {
    photo.classList.remove("blurred");
  }

  const note = document.createElement("div");
  note.className = "code-note";
  note.textContent = `Sul tavolo trovi un biglietto: la prima cifra è ${PUZZLES.photo.digit}.`;
  document.querySelector("#puzzle-photo")?.appendChild(note);
}

function stopAnimePlayback() {
  if (animeSong) {
    animeSong.pause();
    animeSong.currentTime = 0;
  }
  hideAnimeStopButton();
}

function showAnimeStopButton() {
  stopAnimeButton?.removeAttribute("hidden");
}

function hideAnimeStopButton() {
  stopAnimeButton?.setAttribute("hidden", "true");
}

function revealFinalMessage() {
  const finalSection = document.querySelector(".final-message");
  if (!finalSection) return;

  const doorForm = document.getElementById("door-form");
  doorForm
    ?.querySelectorAll("input, button")
    .forEach((field) => field.setAttribute("disabled", "true"));

  stopAnimePlayback();

  finalSection.hidden = false;
  finalSection.scrollIntoView({ behavior: "smooth" });
}
