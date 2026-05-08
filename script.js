//DOM reference
const testWrapper = document.querySelector(".test-wrapper");
const testArea = document.querySelector("#test-area");
const originTextEl = document.querySelector("#origin-text p");
const resetButton = document.querySelector("#reset");
const theTimer = document.querySelector(".timer");
const wpmDisplay = document.querySelector("#wpm");
const errorDisplay = document.querySelector("#error-count");
const scoreList = document.querySelector("#score-list");
const progressBar = document.querySelector("#progress-fill");

// State 
let intervalId = null;   // holds the setInterval reference
let secondsElapsed = 0;     // total hundredths of a second elapsed
let started = false;  // has the user begun typing?
let errorCount = 0;      // mistakes made this session
let currentOrigin = "";     // the active paragraph to match

// Paragraph Pool (Content Randomization)
// At least 5 paragraphs — a new one is chosen on each reset
const paragraphs = [
    "The quick brown fox jumps over the lazy dog near the river bank.",
    "Coding is not just about writing instructions for computers; it is a form of creative expression.",
    "The sunset painted the sky in shades of orange, pink, and deep violet over the mountains.",
    "Practice makes perfect, but nobody is perfect, so why practice? Just kidding — keep going.",
    "JavaScript is a lightweight, interpreted programming language with first-class functions.",
    "Every great journey begins with a single step, and every great program begins with a single line.",
    "The rain fell softly on the cobblestone streets of the old city as the lamplights flickered on."
];

// Helper: Add Leading Zero 
// Formats numbers below 10 as "09" instead of "9" for 00:00:00 display
function zeroPad(num) {
    return num < 10 ? "0" + num : String(num);
}

// Timer: Run 
// Increments secondsElapsed every 10ms and updates the clock display
function runTimer() {
    secondsElapsed++;
    const hundredths = secondsElapsed % 100;
    const totalSecs = Math.floor(secondsElapsed / 100);
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60);
    theTimer.textContent = zeroPad(mins) + ":" + zeroPad(secs) + ":" + zeroPad(hundredths);

    // Update WPM live while timer is running
    updateWPM();
}

//  Timer: Start 
// Guards against stacking: only starts if not already running
function startTimer() {
    if (intervalId !== null) return; // prevent double-start / stacking
    intervalId = setInterval(runTimer, 10);
}

// Timer: Stop 
function stopTimer() {
    clearInterval(intervalId);
    intervalId = null;
}

// WPM Calculation 
// Formula: (total characters typed / 5) / (elapsed seconds / 60)
// Dividing by 5 converts characters to "words" (standard definition)
function updateWPM() {
    const charsTyped = testArea.value.length;
    const totalSeconds = secondsElapsed / 100;
    if (totalSeconds === 0 || charsTyped === 0) {
        wpmDisplay.textContent = "0";
        return;
    }
    const wpm = Math.round((charsTyped / 5) / (totalSeconds / 60));
    wpmDisplay.textContent = wpm;
}

//  Text Matching 
// Uses .substring() to compare what the user typed against the
// This is the Accuracy Algorithm: if origin.substring(0, typed.length)
// matches typed exactly, the user is currently correct.
function matchText() {
    const typed = testArea.value;
    const origin = currentOrigin;

    // Update progress bar based on how far through the text the user is
    const progress = Math.min((typed.length / origin.length) * 100, 100);
    progressBar.style.width = progress + "%";

    // Completion check 
    // Stops the clock only when the full text matches exactly
    if (typed === origin) {
        stopTimer();
        testWrapper.style.borderColor = "#22c55e"; // green = done
        saveScore(secondsElapsed);
        renderScores();
        testArea.disabled = true;
        return;
    }

    // Accuracy check via .substring() 
    // Compares typed input against the same-length slice of origin
    if (origin.substring(0, typed.length) === typed) {
        testWrapper.style.borderColor = "#3b82f6"; // blue = correct so far
    } else {
        testWrapper.style.borderColor = "#ef4444"; // red = typo detected
        errorCount++;
        errorDisplay.textContent = errorCount;
    }
}

// Local Storage: Save Score
// Retrieves existing scores, adds new one, sorts by fastest time,
// keeps only top 3, then saves back with JSON.stringify
function saveScore(hundredths) {
    const scores = JSON.parse(localStorage.getItem("typingScores") || "[]");
    scores.push(hundredths);

    // Numerical sort (ascending = fastest first)
    // Without the callback, Array.sort() sorts alphabetically ("100" < "20")
    scores.sort(function (a, b) { return a - b; });
    scores.splice(3); // keep only top 3
    localStorage.setItem("typingScores", JSON.stringify(scores));
}

// Local Storage: Render Scores
// Reads scores from localStorage and dynamically creates <li> elements
function renderScores() {
    const scores = JSON.parse(localStorage.getItem("typingScores") || "[]");
    scoreList.innerHTML = "";
    if (scores.length === 0) {
        scoreList.innerHTML = "<li class='no-scores'>No scores yet!</li>";
        return;
    }
    scores.forEach(function (s, i) {
        const hundredths = s % 100;
        const totalSecs = Math.floor(s / 100);
        const secs = totalSecs % 60;
        const mins = Math.floor(totalSecs / 60);
        const timeStr = zeroPad(mins) + ":" + zeroPad(secs) + ":" + zeroPad(hundredths);
        const medals = ["🥇", "🥈", "🥉"];
        const li = document.createElement("li"); // dynamic element creation
        li.className = "score-item";
        li.textContent = medals[i] + " " + timeStr;
        scoreList.appendChild(li);
    });
}

// Randomize Text 
// Uses Math.random() * array.length to pick a random paragraph index
function randomizeParagraph() {
    const index = Math.floor(Math.random() * paragraphs.length);
    currentOrigin = paragraphs[index];
    originTextEl.textContent = currentOrigin;
}

//  Reset 
// Clears interval, resets all state, picks new paragraph, refocuses
function resetAll() {
    stopTimer();
    secondsElapsed = 0;
    started = false;
    errorCount = 0;

    theTimer.textContent = "00:00:00";
    testArea.value = "";
    testArea.disabled = false;
    wpmDisplay.textContent = "0";
    errorDisplay.textContent = "0";
    progressBar.style.width = "0%";
    testWrapper.style.borderColor = "#d1d5db"; // reset to grey

    randomizeParagraph();
    testArea.focus(); // focus management — user can type immediately
}

// Event Listeners 
// Using "input" event: fires on every character change including paste/delete.
// More reliable than keyup for detecting actual content changes.
testArea.addEventListener("input", function () {
    // Start timer on first keystroke
    if (!started && testArea.value.length > 0) {
        started = true;
        startTimer();
    }
    // Always check the text match
    matchText();
});

// Paste prevention — user must actually type the text
testArea.addEventListener("paste", function (e) {
    e.preventDefault();
});

resetButton.addEventListener("click", resetAll);

// Init
// On page load: set first paragraph and render any saved scores
randomizeParagraph();
renderScores();
testArea.focus();

// Clear Scores Button 
document.querySelector("#clear-scores").addEventListener("click", function () {
    localStorage.removeItem("typingScores");
    renderScores();
});