// Game state
const gameState = {
  currentEon: 1,
  currentQuestion: 1,
  maxQuestions: 3,
  aspects: {
    truth: 50, // Starting at 50 (neutral)
    happiness: 50,
    autonomy: 50,
  },
  decisions: [],
  currentQuestionObj: null, // Added to store the current question object
};

// Audio elements
const audioElements = {
  ambientLoop: null,
  uiSelect: null,
  uiConfirm: null,
  screenTransition: null,
  monitorChange: null,
  eonEnd: null,
  eonStart: null,
  endingReveal: null,
};

// Cached data
let cachedData = {
  questions: null,
  snippets: null,
  endings: null,
};

// DOM elements
const elements = {};

// Initialize the game
async function init() {
  // Initialize sound state
  window.soundMuted = false;

  // Load DOM elements
  loadDOMElements();

  // Load audio
  loadAudio();

  // Load game data
  await loadGameData();

  // Set up intro sequence
  setupIntroSequence();

  // Add event listeners
  addEventListeners();

  // Set up window resize handling
  handleWindowResize();

  // Initialize sound button state
  initSoundButton();
}

// Initialize sound button to correct state
function initSoundButton() {
  const soundBtn = document.getElementById("sound-btn");
  if (soundBtn) {
    const soundIcon = soundBtn.querySelector(".sound-icon");

    if (window.soundMuted) {
      soundBtn.classList.remove("sound-on");
      soundBtn.classList.add("sound-off");
      soundIcon.textContent = "volume_off";
    } else {
      soundBtn.classList.add("sound-on");
      soundBtn.classList.remove("sound-off");
      soundIcon.textContent = "volume_up";
    }

    console.log(
      `Sound initialized to ${window.soundMuted ? "muted" : "unmuted"} state`
    );
  }
}

// Set up intro sequence with delayed elements
function setupIntroSequence() {
  // Show game description after title animation and start music
  setTimeout(() => {
    elements.gameDescription.classList.remove("hidden");
    // Start ambient music when description appears
    playAmbientMusic();
  }, 1500);

  // Show begin button after description
  setTimeout(() => {
    elements.beginBtn.classList.remove("hidden");
  }, 3000);
}

// Load DOM elements
function loadDOMElements() {
  // Screens
  elements.introScreen = document.getElementById("intro-screen");
  elements.bridgeScreen = document.getElementById("bridge-screen");
  elements.fullscreenOverlay = document.getElementById("fullscreen-overlay");

  // Intro elements
  elements.gameTitle = document.getElementById("game-title");
  elements.gameDescription = document.getElementById("game-description");

  // Buttons
  elements.beginBtn = document.getElementById("begin-btn");
  elements.continueBtn = document.getElementById("continue-btn");
  elements.startOverBtn = document.getElementById("start-over-btn");
  elements.choiceButtons = document.querySelectorAll(".choice");

  // Monitor elements - make sure to select the right elements
  elements.monitors = document.getElementById("monitors");
  elements.truthMonitorContainer = document.getElementById("truth-monitor");
  elements.happinessMonitorContainer =
    document.getElementById("happiness-monitor");
  elements.autonomyMonitorContainer =
    document.getElementById("autonomy-monitor");

  // Get the overlay images correctly
  elements.truthMonitor = document.querySelector("#truth-monitor .overlay");
  elements.happinessMonitor = document.querySelector(
    "#happiness-monitor .overlay"
  );
  elements.autonomyMonitor = document.querySelector(
    "#autonomy-monitor .overlay"
  );

  // Get bars
  elements.truthBar = document.getElementById("truth-bar");
  elements.happinessBar = document.getElementById("happiness-bar");
  elements.autonomyBar = document.getElementById("autonomy-bar");

  // Question elements
  elements.dilemmaTitle = document.getElementById("dilemma-title");
  elements.dilemmaText = document.getElementById("dilemma-text");

  // Overlay elements
  elements.overlayImg = document.getElementById("overlay-img");
  elements.overlayText = document.getElementById("overlay-text");

  // Info elements
  elements.currentEon = document.getElementById("current-eon");
  elements.questionsCounter = document.getElementById("questions-counter");
  elements.logContent = document.getElementById("log-content");

  // Log elements found or not found
  console.log(
    "Monitor elements loaded:",
    elements.truthMonitorContainer
      ? "Truth container OK"
      : "Truth container missing",
    elements.truthMonitor ? "Truth overlay OK" : "Truth overlay missing",
    elements.happinessMonitorContainer
      ? "Happiness container OK"
      : "Happiness container missing",
    elements.happinessMonitor
      ? "Happiness overlay OK"
      : "Happiness overlay missing",
    elements.autonomyMonitorContainer
      ? "Autonomy container OK"
      : "Autonomy container missing",
    elements.autonomyMonitor
      ? "Autonomy overlay OK"
      : "Autonomy overlay missing"
  );
}

// Load audio elements
function loadAudio() {
  audioElements.ambientLoop = new Audio("assets/audio/music/ambient_loop.mp3");
  audioElements.ambientLoop.loop = true;
  audioElements.ambientLoop.volume = 0.4;

  audioElements.uiSelect = new Audio("assets/audio/sfx/ui_select.wav");
  audioElements.uiConfirm = new Audio("assets/audio/sfx/ui_confirm.wav");
  audioElements.screenTransition = new Audio("assets/audio/sfx/ui_confirm.wav");
  audioElements.monitorChange = new Audio(
    "assets/audio/sfx/monitor_change.wav"
  );
  audioElements.eonEnd = new Audio("assets/audio/sfx/eon_end.wav");
  audioElements.eonStart = new Audio("assets/audio/sfx/eon_start.wav");
  audioElements.endingReveal = new Audio("assets/audio/sfx/ending_reveal.wav");
}

// Play ambient music
function playAmbientMusic() {
  // Don't start music if sound is muted
  if (window.soundMuted) {
    console.log("Not playing music because sound is muted");
    return;
  }

  // Check if browser supports autoplay
  const playPromise = audioElements.ambientLoop.play();

  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      console.log("Autoplay prevented:", error);

      // Auto-play was prevented, set up a click event to start music later
      document.addEventListener(
        "click",
        () => {
          // Only play if not muted
          if (!window.soundMuted) {
            audioElements.ambientLoop
              .play()
              .catch((e) => console.log("Still can't play audio:", e));
          }
        },
        { once: true }
      );

      // Also try to play when user interacts with any button
      document.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener(
          "mouseover",
          () => {
            // Only play if not muted
            if (!window.soundMuted) {
              audioElements.ambientLoop.play().catch(() => {});
            }
          },
          { once: true }
        );
      });
    });
  }
}

// Play sound effect
function playSFX(sfxName) {
  // Don't play sounds if muted
  if (window.soundMuted) return;

  if (audioElements[sfxName]) {
    audioElements[sfxName].currentTime = 0;
    audioElements[sfxName].play().catch((error) => {
      console.warn("Audio playback error:", error);
    });
  }
}

// Load game data
async function loadGameData() {
  try {
    // Load from assets/data/ directory
    const [questionsResponse, snippetsResponse, endingsResponse] =
      await Promise.all([
        fetch("assets/data/questions.json"),
        fetch("assets/data/snippets.json"),
        fetch("assets/data/endings.json"),
      ]);

    cachedData.questions = await questionsResponse.json();
    cachedData.snippets = await snippetsResponse.json();
    cachedData.endings = await endingsResponse.json();

    console.log("Game data loaded successfully from assets/data/");
  } catch (error) {
    console.error("Error loading game data:", error);
    alert("Failed to load game data. Please refresh the page and try again.");
  }
}

// Add event listeners
function addEventListeners() {
  // Begin button
  elements.beginBtn.addEventListener("click", startGame);

  // Continue button
  elements.continueBtn.addEventListener("click", continueFromOverlay);

  // Start Over button
  elements.startOverBtn.addEventListener("click", resetGame);

  // Sound toggle button
  const soundBtn = document.getElementById("sound-btn");
  if (soundBtn) {
    soundBtn.addEventListener("click", toggleSound);
  }

  // Choice buttons
  elements.choiceButtons.forEach((button) => {
    button.addEventListener("click", () =>
      handleChoice(parseInt(button.dataset.choice))
    );
  });
}

// Toggle sound on/off
function toggleSound() {
  const soundBtn = document.getElementById("sound-btn");
  const soundIcon = soundBtn.querySelector(".sound-icon");

  // Get current state
  const isSoundOn = soundBtn.classList.contains("sound-on");

  // Set the muted state for all audio elements
  window.soundMuted = isSoundOn; // If currently on, we'll mute it

  if (isSoundOn) {
    // Turn off all sounds
    console.log("Muting all sounds");

    // Pause the background music
    audioElements.ambientLoop.pause();

    // Update UI
    soundBtn.classList.remove("sound-on");
    soundBtn.classList.add("sound-off");
    soundIcon.textContent = "volume_off";
  } else {
    // Turn sound back on
    console.log("Unmuting sounds");

    // If the music should be playing now, restart it
    // Only restart if we're not on the intro screen or if music should be playing
    if (
      !elements.introScreen.classList.contains("hidden") ||
      elements.bridgeScreen.classList.contains("hidden") === false
    ) {
      // We're either on intro or bridge screen, where music plays
      audioElements.ambientLoop
        .play()
        .catch((e) => console.log("Couldn't restart background music:", e));
    }

    // Update UI
    soundBtn.classList.remove("sound-off");
    soundBtn.classList.add("sound-on");
    soundIcon.textContent = "volume_up";
  }
}

// Start the game
function startGame() {
  console.log("Game starting...");
  playSFX("uiConfirm");

  // Reset game state to ensure we're starting fresh
  gameState.currentEon = 1;
  gameState.currentQuestion = 1;
  gameState.decisions = [];

  // Log the current state of data loading
  console.log("Data loading status:", {
    questionsLoaded: cachedData.questions ? true : false,
    snippetsLoaded: cachedData.snippets ? true : false,
    endingsLoaded: cachedData.endings ? true : false,
  });

  // First fade out the intro screen
  elements.introScreen.style.transition = "opacity 0.8s ease-out";
  elements.introScreen.style.opacity = "0";

  // Wait for fade-out to complete before showing the bridge screen
  setTimeout(() => {
    // Use the showBridgeScreen function to transition to game screen
    showBridgeScreen();

    // Make bridge screen initially invisible for fade-in
    elements.bridgeScreen.style.opacity = "0";

    // Force a reflow to ensure the transition works
    elements.bridgeScreen.offsetHeight;

    // Fade in the bridge screen
    elements.bridgeScreen.style.transition = "opacity 0.8s ease-in";
    elements.bridgeScreen.style.opacity = "1";

    // Make sure monitor images are initially invisible for fade-in
    elements.truthMonitor.style.opacity = "0";
    elements.happinessMonitor.style.opacity = "0";
    elements.autonomyMonitor.style.opacity = "0";
    elements.truthMonitor.style.transition = "opacity 1.2s ease-in";
    elements.happinessMonitor.style.transition = "opacity 1.2s ease-in";
    elements.autonomyMonitor.style.transition = "opacity 1.2s ease-in";

    // Update monitors to show initial states
    updateMonitors();

    // Reset all question-related elements that might have been hidden
    const questionCard = document.getElementById("question-card");
    const choices = document.getElementById("choices");
    const dilemmaTitle = document.getElementById("dilemma-title");
    const dilemmaText = document.getElementById("dilemma-text");

    // Make the entire question card initially invisible
    if (questionCard) {
      // Set up for fade-in transition
      questionCard.classList.remove("hidden");
      questionCard.style.removeProperty("display");
      questionCard.style.removeProperty("visibility");
      questionCard.style.opacity = "0";
      questionCard.style.removeProperty("position");
      questionCard.style.removeProperty("z-index");
      questionCard.style.pointerEvents = "auto";

      // Set position
      questionCard.style.position = "absolute";
      questionCard.style.zIndex = "15";
      questionCard.style.bottom = "4%";

      // Ensure child elements are properly set up
      if (choices) {
        choices.style.display = "grid";
        choices.style.visibility = "visible";
      }

      if (dilemmaTitle) {
        dilemmaTitle.style.visibility = "visible";
        dilemmaTitle.style.display = "block";
      }

      if (dilemmaText) {
        dilemmaText.style.visibility = "visible";
        dilemmaText.style.display = "block";
      }

      // Make sure choice buttons are visible
      document.querySelectorAll(".choice").forEach((button) => {
        button.style.removeProperty("display");
        button.style.removeProperty("visibility");
        button.style.pointerEvents = "auto";
      });
    }

    // Load first question immediately
    loadQuestion();

    // Force a resize calculation to ensure everything fits
    adjustQuestionCardTextSizes();

    // Add fade-in effect for the question card after a short delay
    setTimeout(() => {
      if (questionCard) {
        questionCard.style.transition = "opacity 1s ease-in";
        questionCard.style.opacity = "1";
      }
    }, 500); // Longer delay to ensure bridge screen has faded in

    // Force monitor positions to update
    if (monitorCoordinates) {
      setTimeout(() => {
        setMonitorPositions(monitorCoordinates);
      }, 100);
    }
  }, 800);
}

// Update monitors based on current aspect values
function updateMonitors() {
  // Update aspect bars
  const truthBar = document.querySelector("#truth-bar");
  const happinessBar = document.querySelector("#happiness-bar");
  const autonomyBar = document.querySelector("#autonomy-bar");

  truthBar.style.setProperty("--bar-width", `${gameState.aspects.truth}%`);
  happinessBar.style.setProperty(
    "--bar-width",
    `${gameState.aspects.happiness}%`
  );
  autonomyBar.style.setProperty(
    "--bar-width",
    `${gameState.aspects.autonomy}%`
  );

  // Update monitor overlays
  const eon = gameState.currentEon;

  // More sensitive tier determination that uses the original 3 images
  // but changes them more frequently using dynamic thresholds
  const getSensitiveTierForAspect = (aspect) => {
    const value = gameState.aspects[aspect];

    // Make thresholds more sensitive in later eons
    // Eon 1: ~33/66, Eon 2: ~28/72, Eon 3: ~23/77
    const eonModifier = gameState.currentEon * 5;

    // Add randomization to create more variations between aspect changes
    // This causes monitor images to change more frequently and unpredictably
    const randomVariation = Math.floor(Math.random() * 7) - 3; // -3 to +3

    const lowThreshold = Math.max(
      15,
      Math.min(40, 33 - eonModifier + randomVariation)
    );
    const highThreshold = Math.max(
      60,
      Math.min(85, 66 + eonModifier + randomVariation)
    );

    if (value < lowThreshold) return "low";
    if (value < highThreshold) return "mid";
    return "high";
  };

  // Use the more sensitive tier function to get more frequent image changes
  const truthTier = getSensitiveTierForAspect("truth");
  const happinessTier = getSensitiveTierForAspect("happiness");
  const autonomyTier = getSensitiveTierForAspect("autonomy");

  // Prepare image paths
  const truthImagePath = `assets/images/monitors/truth_eon${eon}_${truthTier}.png`;
  const happinessImagePath = `assets/images/monitors/happiness_eon${eon}_${happinessTier}.png`;
  const autonomyImagePath = `assets/images/monitors/autonomy_eon${eon}_${autonomyTier}.png`;

  // Check if images need to change by comparing full paths
  const currentTruthSrc = elements.truthMonitor.src.split("/").pop();
  const currentHappinessSrc = elements.happinessMonitor.src.split("/").pop();
  const currentAutonomySrc = elements.autonomyMonitor.src.split("/").pop();

  const newTruthSrc = truthImagePath.split("/").pop();
  const newHappinessSrc = happinessImagePath.split("/").pop();
  const newAutonomySrc = autonomyImagePath.split("/").pop();

  const truthNeedsChange = currentTruthSrc !== newTruthSrc;
  const happinessNeedsChange = currentHappinessSrc !== newHappinessSrc;
  const autonomyNeedsChange = currentAutonomySrc !== newAutonomySrc;

  const imagesNeedChange =
    truthNeedsChange || happinessNeedsChange || autonomyNeedsChange;

  if (imagesNeedChange) {
    console.log("Monitor images changing - applying dissolve effect");

    // First preload all images to ensure smooth transitions
    const preloadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null); // Resolve even on error, just with null
        img.src = src;
        // Fallback
        setTimeout(() => resolve(img), 500);
      });
    };

    // Preload all new images first before any DOM manipulation
    const preloadImages = () => {
      return Promise.all([
        truthNeedsChange ? preloadImage(truthImagePath) : Promise.resolve(),
        happinessNeedsChange
          ? preloadImage(happinessImagePath)
          : Promise.resolve(),
        autonomyNeedsChange
          ? preloadImage(autonomyImagePath)
          : Promise.resolve(),
      ]);
    };

    // Hint to the browser that these elements will change, improving rendering performance
    if (truthNeedsChange) {
      elements.truthMonitorContainer.style.willChange = "contents";
      elements.truthMonitor.style.willChange = "opacity";
    }
    if (happinessNeedsChange) {
      elements.happinessMonitorContainer.style.willChange = "contents";
      elements.happinessMonitor.style.willChange = "opacity";
    }
    if (autonomyNeedsChange) {
      elements.autonomyMonitorContainer.style.willChange = "contents";
      elements.autonomyMonitor.style.willChange = "opacity";
    }

    // Only create clones for images that actually need to change
    const createAndAddClone = (
      originalMonitor,
      containerElement,
      newImagePath,
      needsChange
    ) => {
      if (!needsChange) return null;

      const clone = originalMonitor.cloneNode(false);
      clone.id = originalMonitor.id + "-clone";
      clone.src = newImagePath;
      clone.style.position = "absolute";
      clone.style.top = "0";
      clone.style.left = "0";
      clone.style.width = "100%";
      clone.style.height = "100%";
      clone.style.opacity = "0";
      clone.style.willChange = "opacity";

      // Make the dissolve effect smoother with cubic-bezier easing
      clone.style.transition = "opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)";
      clone.style.zIndex = "2"; // Above the original

      containerElement.appendChild(clone);
      return clone;
    };

    // Start the whole process after images are preloaded
    preloadImages().then(() => {
      // Create clone overlays only for images that need changing
      const truthMonitorClone = createAndAddClone(
        elements.truthMonitor,
        elements.truthMonitorContainer,
        truthImagePath,
        truthNeedsChange
      );

      const happinessMonitorClone = createAndAddClone(
        elements.happinessMonitor,
        elements.happinessMonitorContainer,
        happinessImagePath,
        happinessNeedsChange
      );

      const autonomyMonitorClone = createAndAddClone(
        elements.autonomyMonitor,
        elements.autonomyMonitorContainer,
        autonomyImagePath,
        autonomyNeedsChange
      );

      // Make sure original images are visible
      elements.truthMonitor.style.opacity = "1";
      elements.happinessMonitor.style.opacity = "1";
      elements.autonomyMonitor.style.opacity = "1";

      // Force a reflow to ensure transitions work
      if (truthMonitorClone) truthMonitorClone.offsetHeight;
      if (happinessMonitorClone) happinessMonitorClone.offsetHeight;
      if (autonomyMonitorClone) autonomyMonitorClone.offsetHeight;

      // Play sound effect
      playSFX("monitorChange");

      // Start the dissolve effect - fade in new images using requestAnimationFrame
      // for smoother animation synced with browser rendering
      requestAnimationFrame(() => {
        // Wrap in another rAF to ensure browser has time to process the first one
        requestAnimationFrame(() => {
          if (truthMonitorClone) truthMonitorClone.style.opacity = "1";
          if (happinessMonitorClone) happinessMonitorClone.style.opacity = "1";
          if (autonomyMonitorClone) autonomyMonitorClone.style.opacity = "1";
        });
      });

      // After dissolve completes, update the original monitors and remove clones
      setTimeout(() => {
        // Update the original monitor sources (they're already preloaded)
        if (truthNeedsChange) elements.truthMonitor.src = truthImagePath;
        if (happinessNeedsChange)
          elements.happinessMonitor.src = happinessImagePath;
        if (autonomyNeedsChange)
          elements.autonomyMonitor.src = autonomyImagePath;

        // Remove clones only after base images have had time to display
        setTimeout(() => {
          // Remove all clones at once
          if (truthMonitorClone && truthMonitorClone.parentNode)
            truthMonitorClone.parentNode.removeChild(truthMonitorClone);
          if (happinessMonitorClone && happinessMonitorClone.parentNode)
            happinessMonitorClone.parentNode.removeChild(happinessMonitorClone);
          if (autonomyMonitorClone && autonomyMonitorClone.parentNode)
            autonomyMonitorClone.parentNode.removeChild(autonomyMonitorClone);

          // Clean up will-change property to free resources
          if (truthNeedsChange) {
            elements.truthMonitorContainer.style.removeProperty("will-change");
            elements.truthMonitor.style.removeProperty("will-change");
          }
          if (happinessNeedsChange) {
            elements.happinessMonitorContainer.style.removeProperty(
              "will-change"
            );
            elements.happinessMonitor.style.removeProperty("will-change");
          }
          if (autonomyNeedsChange) {
            elements.autonomyMonitorContainer.style.removeProperty(
              "will-change"
            );
            elements.autonomyMonitor.style.removeProperty("will-change");
          }

          // Reposition monitors after cleanup
          if (monitorCoordinates) {
            setMonitorPositions(monitorCoordinates);
          }
        }, 200);
      }, 500);
    });
  } else {
    console.log("Monitor images unchanged - no dissolve effect needed");
  }

  // Log the current aspect values and tiers for debugging
  console.log(
    `Aspect values - Truth: ${gameState.aspects.truth} (${truthTier}), Happiness: ${gameState.aspects.happiness} (${happinessTier}), Autonomy: ${gameState.aspects.autonomy} (${autonomyTier})`
  );
}

// Get a random question for the current eon
function getRandomQuestion() {
  const eonQuestions =
    cachedData.questions.eons[gameState.currentEon - 1].questions;

  // Get all question IDs that have been asked in ANY eon of this game
  const askedQuestionIds = gameState.decisions.map(
    (decision) => decision.questionId
  );
  console.log("Previously asked questions:", askedQuestionIds);

  // Filter out questions that have already been asked in any eon
  const availableQuestions = eonQuestions.filter(
    (q) => !askedQuestionIds.includes(q.id)
  );
  console.log(
    `Available questions for Eon ${gameState.currentEon}:`,
    availableQuestions.length
  );

  // If we've run out of unique questions for this eon, use a fallback method
  if (availableQuestions.length === 0) {
    console.warn(
      "No unique questions available for this eon. Using fallback strategy."
    );

    // Fallback: Find questions that haven't been asked in the current eon
    // This ensures we at least don't repeat questions within the current eon
    const questionsNotAskedInCurrentEon = eonQuestions.filter(
      (q) =>
        !gameState.decisions.some(
          (d) => d.questionId === q.id && d.eon === gameState.currentEon
        )
    );

    if (questionsNotAskedInCurrentEon.length > 0) {
      const fallbackQuestion =
        questionsNotAskedInCurrentEon[
          Math.floor(Math.random() * questionsNotAskedInCurrentEon.length)
        ];
      console.log("Using fallback question:", fallbackQuestion.id);
      return fallbackQuestion;
    }

    // If we somehow exhausted all questions (should be extremely rare)
    console.error("Critical: No questions available at all!");
    return null;
  }

  // Return a random question from available ones
  const randomQuestion =
    availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

  console.log(
    `Selected question ${randomQuestion.id} for Eon ${gameState.currentEon}`
  );
  return randomQuestion;
}

// Load a random question
function loadQuestion() {
  const question = getRandomQuestion();

  if (!question) {
    console.error("No questions available");
    return;
  }

  // Set question text
  elements.dilemmaTitle.textContent = `Dilemma ${gameState.currentQuestion} of ${gameState.maxQuestions}`;
  elements.dilemmaText.textContent = question.prompt;

  // Set choice labels and classify by length for styling
  question.choices.forEach((choice, index) => {
    const button = elements.choiceButtons[index];
    const label = choice.label;

    // Set the text content
    button.textContent = label;

    // Remove any previous length classifications
    button.removeAttribute("data-length");

    // Classify based on text length to apply appropriate styling
    if (label.length > 60) {
      button.setAttribute("data-length", "very-long");
    } else if (label.length > 40) {
      button.setAttribute("data-length", "long");
    }

    console.log(
      `Button ${index} text: "${label.substring(0, 20)}..." length: ${
        label.length
      }`
    );
  });

  // No longer updating the questions counter since we're hiding it
  // Instead, just store the current question in game state
  gameState.currentQuestionObj = question;

  // Ensure text fits without scrolling by adjusting font size if needed
  adjustQuestionCardTextSizes();
}

// Function to dynamically adjust text sizes and layout based on content
function adjustQuestionCardTextSizes() {
  const questionCard = document.getElementById("question-card");
  const dilemmaTitle = document.getElementById("dilemma-title");
  const dilemmaText = document.getElementById("dilemma-text");
  const choices = document.getElementById("choices");

  if (!questionCard || !dilemmaText) return;

  // 1. First adjust the dilemma text size based on length
  const textLength = dilemmaText.textContent.length;

  // Scale text based on length (longer text gets smaller font)
  let textScaleFactor = 1;

  if (textLength > 300) textScaleFactor = 0.9;
  if (textLength > 400) textScaleFactor = 0.85;
  if (textLength > 500) textScaleFactor = 0.8;

  // Apply the scaled size to the dilemma text
  const baseTextSize = getComputedStyle(document.documentElement)
    .getPropertyValue("--dilemma-text-size")
    .trim();
  const currentScale = getComputedStyle(document.documentElement)
    .getPropertyValue("--scale-factor")
    .trim();

  const newTextSize =
    parseFloat(baseTextSize) * parseFloat(currentScale) * textScaleFactor;
  dilemmaText.style.fontSize = `${newTextSize}rem`;

  // 2. Check if we need to adjust title sizing too
  if (dilemmaTitle) {
    // If text is very long, make title smaller too
    if (textLength > 450) {
      const baseTitleSize = getComputedStyle(document.documentElement)
        .getPropertyValue("--dilemma-title-size")
        .trim();
      const newTitleSize =
        parseFloat(baseTitleSize) * parseFloat(currentScale) * 0.9;
      dilemmaTitle.style.fontSize = `${newTitleSize}rem`;
    } else {
      // Reset to default size if not long text
      dilemmaTitle.style.fontSize = "";
    }
  }

  // 3. Adjust bottom margin for choices container if needed
  if (choices) {
    // Get total question card height and check if we need to adjust spacing
    const cardRect = questionCard.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Calculate how much space the card is taking (as percentage of viewport)
    const cardHeightPercent = (cardRect.height / windowHeight) * 100;

    console.log(`Card height: ${cardHeightPercent.toFixed(1)}% of viewport`);

    // If the card is taking too much vertical space, reduce margins and padding
    if (cardHeightPercent > 30) {
      choices.style.marginTop = "4px";
      questionCard.style.padding = "15px 20px";
    } else if (cardHeightPercent > 25) {
      choices.style.marginTop = "5px";
    } else {
      // Reset to default if there's enough space
      choices.style.marginTop = "";
      questionCard.style.padding = "";
    }
  }

  // 4. Check if card content exceeds the viewport and adjust as needed
  // Wait a moment for layout to adjust before checking overflow
  setTimeout(() => {
    const contentHeight = questionCard.scrollHeight;
    const visibleHeight = questionCard.clientHeight;
    const hasOverflow = contentHeight > visibleHeight;

    console.log(
      `Card sizing: content height ${contentHeight}px, visible height ${visibleHeight}px, overflow: ${hasOverflow}`
    );

    if (hasOverflow) {
      // Content overflows - ensure scrollbar is visible
      questionCard.style.overflowY = "auto";

      // If extremely tall content, consider additional text size reduction
      if (contentHeight > visibleHeight * 1.5) {
        // Further reduce text size to minimize scrolling
        const extraReduction = 0.9;
        dilemmaText.style.fontSize = `${
          parseFloat(newTextSize) * extraReduction
        }rem`;

        if (dilemmaTitle) {
          const currentSize = window.getComputedStyle(dilemmaTitle).fontSize;
          dilemmaTitle.style.fontSize = `${
            parseFloat(currentSize) * extraReduction
          }px`;
        }

        console.log(`Applied extra text reduction for extremely tall content`);
      }
    } else {
      // No overflow - we can hide the scrollbar
      questionCard.style.overflowY = "visible";
    }
  }, 50);

  console.log(
    `Adjusted layout: text size ${newTextSize}rem, text length ${textLength}`
  );
}

// Handle choice selection
function handleChoice(choiceIndex) {
  playSFX("uiSelect");

  const question = gameState.currentQuestionObj;
  const choice = question.choices[choiceIndex];

  // Get various UI elements
  const questionCard = document.getElementById("question-card");

  // Calculate amplification factor based on current eon
  // Using higher multipliers to create much more dramatic effects
  const amplificationFactor = 1.5 + gameState.currentEon * 0.5;

  // Amplify the effects
  const amplifiedTruth = Math.round(choice.effect.truth * amplificationFactor);
  const amplifiedHappiness = Math.round(
    choice.effect.happiness * amplificationFactor
  );
  const amplifiedAutonomy = Math.round(
    choice.effect.autonomy * amplificationFactor
  );

  console.log(
    `Choice effects amplified by ${amplificationFactor}x for Eon ${gameState.currentEon}`
  );
  console.log(
    `Original: T:${choice.effect.truth}, H:${choice.effect.happiness}, A:${choice.effect.autonomy}`
  );
  console.log(
    `Amplified: T:${amplifiedTruth}, H:${amplifiedHappiness}, A:${amplifiedAutonomy}`
  );

  // Update aspects with amplified effects
  gameState.aspects.truth = Math.max(
    0,
    Math.min(100, gameState.aspects.truth + amplifiedTruth)
  );
  gameState.aspects.happiness = Math.max(
    0,
    Math.min(100, gameState.aspects.happiness + amplifiedHappiness)
  );
  gameState.aspects.autonomy = Math.max(
    0,
    Math.min(100, gameState.aspects.autonomy + amplifiedAutonomy)
  );

  // Record decision with amplified effects
  gameState.decisions.push({
    eon: gameState.currentEon,
    questionId: question.id,
    choice: choiceIndex,
    effects: {
      truth: amplifiedTruth,
      happiness: amplifiedHappiness,
      autonomy: amplifiedAutonomy,
    },
  });

  // Add to log
  addToLog(question.prompt, choice.label);

  // Check if this was the last question
  const isLastQuestion = gameState.currentQuestion >= gameState.maxQuestions;

  // Update monitors first, before hiding question card
  updateMonitors();

  // Increment the question counter
  gameState.currentQuestion++;

  // If it was the last question, hide everything immediately
  if (isLastQuestion) {
    // Hide the question card immediately for the last question
    if (questionCard) {
      questionCard.classList.add("hidden");
      questionCard.style.display = "none";
      questionCard.style.visibility = "hidden";
      questionCard.style.opacity = "0";
      questionCard.style.position = "absolute";
      questionCard.style.zIndex = "-999";
      questionCard.style.pointerEvents = "none";
    }

    console.log("Question card hidden immediately for last question");

    // Give time to observe the monitors before showing splash/ending
    setTimeout(() => {
      // Proceed to splash screen or ending
      if (gameState.currentEon < 3) {
        showEonSplash();
      } else {
        // End of game
        showEnding();
      }
    }, 2000); // 2 second delay to observe monitors
  } else {
    // Not the last question, load the next one
    loadQuestion();
  }
}

// Add to decision log
function addToLog(dilemma, choice) {
  const logEntry = document.createElement("div");
  logEntry.classList.add("log-entry");
  logEntry.innerHTML = `
        <div class="log-dilemma">${dilemma}</div>
        <div class="log-choice">→ ${choice}</div>
    `;
  elements.logContent.appendChild(logEntry);
  elements.logContent.scrollTop = elements.logContent.scrollHeight;
}

// Show eon splash screen
function showEonSplash() {
  playSFX("eonEnd");

  // Prepare the overlay while it's still hidden
  elements.overlayImg.src = `assets/images/splash/splash${gameState.currentEon}.png`;

  // Set up all overlay elements for fade-in effect
  elements.overlayImg.style.opacity = "0";
  elements.overlayImg.style.transition = "opacity 1.5s ease-in";

  // Generate narrative snippets based on aspect changes
  const snippets = generateNarrativeSnippets();
  elements.overlayText.innerHTML = snippets.join("<br><br>");

  // Also make text invisible initially
  elements.overlayText.style.opacity = "0";
  elements.overlayText.style.transition = "opacity 1.5s ease-in";

  // Make continue button invisible initially and set text to "Continue"
  elements.continueBtn.textContent = "Continue"; // Reset the text to Continue for eon transitions
  elements.continueBtn.style.opacity = "0";
  elements.continueBtn.style.transition = "opacity 1.5s ease-in";
  elements.continueBtn.style.visibility = "visible";

  // Set overlay to transparent before showing it
  elements.fullscreenOverlay.style.opacity = "0";
  elements.fullscreenOverlay.classList.remove("hidden");

  // Force a reflow to ensure the opacity transition works
  elements.fullscreenOverlay.offsetHeight;

  // Add transition effect for the overlay
  elements.fullscreenOverlay.style.transition = "opacity 1s ease-in";
  elements.fullscreenOverlay.style.opacity = "1";

  // After the overlay fades in, fade in the image and text with a slight delay
  setTimeout(() => {
    elements.overlayImg.style.opacity = "1";

    // Fade in the text after the image starts to appear
    setTimeout(() => {
      elements.overlayText.style.opacity = "1";

      // Fade in the continue button after text appears
      setTimeout(() => {
        elements.continueBtn.style.opacity = "1";
      }, 800);
    }, 500);
  }, 500);

  console.log(`Transition to Eon ${gameState.currentEon}`);
}

// Generate narrative snippets based on aspect changes
function generateNarrativeSnippets() {
  const result = [];
  const aspectChanges = calculateAspectChanges();

  // Log what we're working with
  console.log("Generating narrative snippets with:", aspectChanges);
  console.log("Using cached snippets:", cachedData.snippets);

  // Add a snippet for each aspect (truth, happiness, autonomy)
  for (const aspect in aspectChanges) {
    const direction = aspectChanges[aspect];

    // Check if we have snippets for this aspect
    if (cachedData.snippets && cachedData.snippets[aspect]) {
      // Get all snippets for this aspect
      const snippetPool = cachedData.snippets[aspect];

      // Get a random snippet from the pool
      if (snippetPool && snippetPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * snippetPool.length);
        const randomSnippet = snippetPool[randomIndex];
        result.push(randomSnippet);
        console.log(
          `Added snippet for ${aspect}: ${randomSnippet.substring(0, 30)}...`
        );
      } else {
        // Fallback if no snippets found
        result.push(`The ${aspect} of your civilization continues to evolve.`);
        console.log(`Using fallback snippet for ${aspect}`);
      }
    } else {
      // Fallback if structure is wrong
      result.push(`The ${aspect} of your civilization continues to evolve.`);
      console.log(
        `Using fallback snippet for ${aspect} - no snippets data found`
      );
    }
  }

  return result;
}

// Calculate aspect changes since last eon
function calculateAspectChanges() {
  const result = {};
  const previousEonDecisions = gameState.decisions.filter(
    (d) => d.eon < gameState.currentEon
  );

  // Default to "flat" if this is the first eon
  if (previousEonDecisions.length === 0) {
    return {
      truth: "flat",
      happiness: "flat",
      autonomy: "flat",
    };
  }

  // Calculate net change for each aspect
  const netChanges = {
    truth: 0,
    happiness: 0,
    autonomy: 0,
  };

  // Sum effects from current eon decisions
  gameState.decisions
    .filter((d) => d.eon === gameState.currentEon)
    .forEach((decision) => {
      netChanges.truth += decision.effects.truth;
      netChanges.happiness += decision.effects.happiness;
      netChanges.autonomy += decision.effects.autonomy;
    });

  // Determine direction for each aspect
  for (const aspect in netChanges) {
    if (netChanges[aspect] > 5) {
      result[aspect] = "up";
    } else if (netChanges[aspect] < -5) {
      result[aspect] = "down";
    } else {
      result[aspect] = "flat";
    }
  }

  return result;
}

// Continue from splash screen to next eon or reset game at ending
function continueFromOverlay() {
  playSFX("uiConfirm");

  // CRITICAL: If this is from the ending screen (reset game), immediately hide the bridge screen
  // This prevents ANY flicker of game screen
  if (elements.fullscreenOverlay.classList.contains("ending")) {
    elements.bridgeScreen.style.visibility = "hidden";
    elements.bridgeScreen.style.display = "none";
  }

  // Fade out all overlay elements
  elements.overlayImg.style.transition = "opacity 0.7s ease-out";
  elements.overlayText.style.transition = "opacity 0.7s ease-out";
  elements.continueBtn.style.transition = "opacity 0.5s ease-out";

  elements.overlayImg.style.opacity = "0";
  elements.overlayText.style.opacity = "0";
  elements.continueBtn.style.opacity = "0";

  // First fade out the overlay
  elements.fullscreenOverlay.style.transition = "opacity 0.7s ease-out";
  elements.fullscreenOverlay.style.opacity = "0";

  // Wait for fade out to complete
  setTimeout(() => {
    if (elements.fullscreenOverlay.classList.contains("ending")) {
      // Complete game reset when at ending screen
      console.log("Game over - performing complete reset");

      // Remove any special classes from the continue button
      const continueBtn = document.getElementById("continue-btn");
      if (continueBtn) {
        continueBtn.classList.remove("game-complete");
        continueBtn.textContent = "Continue"; // Reset text back to "Continue" for the next game
      }

      // Reset game state
      gameState.currentEon = 1;
      gameState.currentQuestion = 1;
      gameState.aspects = {
        truth: 50,
        happiness: 50,
        autonomy: 50,
      };
      gameState.decisions = [];
      gameState.currentQuestionObj = null;

      // Clear log
      elements.logContent.innerHTML = "";

      // Reset UI elements - bridge screen already hidden
      elements.fullscreenOverlay.classList.remove("ending");
      elements.fullscreenOverlay.classList.add("hidden");

      // Show intro screen with initial opacity of 0
      elements.introScreen.classList.remove("hidden");
      elements.introScreen.style.opacity = "0";

      // Force a reflow to ensure the opacity transitions work
      elements.introScreen.offsetHeight;

      // Fade in the intro screen
      elements.introScreen.style.transition = "opacity 0.8s ease-in";
      elements.introScreen.style.opacity = "1";

      // Reset bridge screen display property after the intro is showing
      setTimeout(() => {
        elements.bridgeScreen.style.removeProperty("display");
        elements.bridgeScreen.style.removeProperty("visibility");
      }, 100);

      // Hide start over button when back at intro
      elements.startOverBtn.style.display = "none";

      // Reset intro animations
      elements.gameDescription.classList.add("hidden");
      elements.beginBtn.classList.add("hidden");

      // Stop music
      audioElements.ambientLoop.pause();
      audioElements.ambientLoop.currentTime = 0;

      // Restart intro sequence with delayed elements
      setupIntroSequence();
    } else {
      // Continue to next eon
      const previousEon = gameState.currentEon;
      gameState.currentEon++;
      gameState.currentQuestion = 1;

      // Update eon display
      const eonNames = ["Awakening World", "Industrial Dusk", "Final Horizon"];
      elements.currentEon.textContent = `Eon ${gameState.currentEon}: ${
        eonNames[gameState.currentEon - 1]
      }`;

      // Style the current eon with Prime Directive font and larger size
      elements.currentEon.style.fontFamily = "'Orbitron', sans-serif";
      elements.currentEon.style.fontSize = "1.5rem";
      elements.currentEon.style.fontWeight = "bold";
      elements.currentEon.style.textShadow = "0 0 5px rgba(0, 200, 255, 0.7)";
      elements.currentEon.style.letterSpacing = "1px";
      elements.currentEon.style.marginBottom = "12px";

      // Hide the question counter
      if (elements.questionsCounter) {
        elements.questionsCounter.style.display = "none";
      }

      // Hide overlay
      elements.fullscreenOverlay.classList.add("hidden");

      // Reset opacity for next time
      elements.fullscreenOverlay.style.opacity = "1";

      // Play eon start sound
      playSFX("eonStart");

      // Create temporary overlay images for the dissolve effect
      const newEon = gameState.currentEon;

      // Determine the appropriate tier for each aspect based on current game state
      const getTierForAspect = (aspect) => {
        const value = gameState.aspects[aspect];
        if (value < 33) return "low";
        if (value < 66) return "mid";
        return "high";
      };

      // Get current tiers
      const truthTier = getTierForAspect("truth");
      const happinessTier = getTierForAspect("happiness");
      const autonomyTier = getTierForAspect("autonomy");

      // Create paths for new eon images using proper tiers
      const truthImagePath = `assets/images/monitors/truth_eon${newEon}_${truthTier}.png`;
      const happinessImagePath = `assets/images/monitors/happiness_eon${newEon}_${happinessTier}.png`;
      const autonomyImagePath = `assets/images/monitors/autonomy_eon${newEon}_${autonomyTier}.png`;

      console.log(
        `Using aspect tiers - Truth: ${truthTier}, Happiness: ${happinessTier}, Autonomy: ${autonomyTier}`
      );

      // Preload all images individually with a helper function
      const preloadImage = (src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
          // Fallback
          setTimeout(() => resolve(img), 500);
        });
      };

      // Preload all the images at once
      const preloadImages = () => {
        return Promise.all([
          preloadImage(truthImagePath),
          preloadImage(happinessImagePath),
          preloadImage(autonomyImagePath),
        ]);
      };

      // Setup question card - using display: none initially to prevent any flickering
      const questionCard = document.getElementById("question-card");
      if (questionCard) {
        questionCard.style.display = "none";
        questionCard.style.transition = "opacity 1s ease-in-out";
        questionCard.style.opacity = "0";
      }

      // Load question content while card is hidden
      loadQuestion();

      // Add will-change to elements before changes to improve rendering
      elements.truthMonitorContainer.style.willChange = "contents";
      elements.truthMonitor.style.willChange = "opacity";
      elements.happinessMonitorContainer.style.willChange = "contents";
      elements.happinessMonitor.style.willChange = "opacity";
      elements.autonomyMonitorContainer.style.willChange = "contents";
      elements.autonomyMonitor.style.willChange = "opacity";

      // Start preloading images
      preloadImages().then(() => {
        // Create clone monitors for the new eon images
        const createCloneMonitor = (originalMonitor, newImagePath) => {
          const clone = originalMonitor.cloneNode(false);
          clone.id = originalMonitor.id + "-clone";
          clone.src = newImagePath;
          clone.style.position = "absolute";
          clone.style.top = "0";
          clone.style.left = "0";
          clone.style.width = "100%";
          clone.style.height = "100%";
          clone.style.opacity = "0";
          clone.style.willChange = "opacity";

          // Make the dissolve effect smoother with cubic-bezier easing
          clone.style.transition =
            "opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)";
          clone.style.zIndex = "2"; // Above the original
          return clone;
        };

        // Create and add clones all at once
        const truthMonitorClone = createCloneMonitor(
          elements.truthMonitor,
          truthImagePath
        );
        const happinessMonitorClone = createCloneMonitor(
          elements.happinessMonitor,
          happinessImagePath
        );
        const autonomyMonitorClone = createCloneMonitor(
          elements.autonomyMonitor,
          autonomyImagePath
        );

        // Add clones to their respective containers
        elements.truthMonitorContainer.appendChild(truthMonitorClone);
        elements.happinessMonitorContainer.appendChild(happinessMonitorClone);
        elements.autonomyMonitorContainer.appendChild(autonomyMonitorClone);

        // Force a reflow to ensure transitions work
        truthMonitorClone.offsetHeight;
        happinessMonitorClone.offsetHeight;
        autonomyMonitorClone.offsetHeight;

        // Start the dissolve effect with double requestAnimationFrame for smoother animation
        requestAnimationFrame(() => {
          // Wrap in another rAF to ensure browser has time to process the first one
          requestAnimationFrame(() => {
            truthMonitorClone.style.opacity = "1";
            happinessMonitorClone.style.opacity = "1";
            autonomyMonitorClone.style.opacity = "1";
          });
        });

        // After dissolve nears completion, switch the original images
        setTimeout(() => {
          // Set the original monitors to the new images
          elements.truthMonitor.src = truthImagePath;
          elements.happinessMonitor.src = happinessImagePath;
          elements.autonomyMonitor.src = autonomyImagePath;

          // Make sure they're visible
          elements.truthMonitor.style.opacity = "1";
          elements.happinessMonitor.style.opacity = "1";
          elements.autonomyMonitor.style.opacity = "1";

          // Once the base images are updated, we can safely remove clones
          setTimeout(() => {
            // Remove all clones
            if (truthMonitorClone.parentNode)
              truthMonitorClone.parentNode.removeChild(truthMonitorClone);
            if (happinessMonitorClone.parentNode)
              happinessMonitorClone.parentNode.removeChild(
                happinessMonitorClone
              );
            if (autonomyMonitorClone.parentNode)
              autonomyMonitorClone.parentNode.removeChild(autonomyMonitorClone);

            // Clean up will-change property to free resources
            elements.truthMonitorContainer.style.removeProperty("will-change");
            elements.truthMonitor.style.removeProperty("will-change");
            elements.happinessMonitorContainer.style.removeProperty(
              "will-change"
            );
            elements.happinessMonitor.style.removeProperty("will-change");
            elements.autonomyMonitorContainer.style.removeProperty(
              "will-change"
            );
            elements.autonomyMonitor.style.removeProperty("will-change");

            // Reposition monitors
            if (monitorCoordinates) {
              setMonitorPositions(monitorCoordinates);
            }

            // Now prepare the question card
            if (questionCard) {
              // Configure all properties while hidden
              const choices = document.getElementById("choices");
              const dilemmaTitle = document.getElementById("dilemma-title");
              const dilemmaText = document.getElementById("dilemma-text");

              // Set up the question card completely
              questionCard.classList.remove("hidden");
              questionCard.style.removeProperty("visibility");
              questionCard.style.position = "absolute";
              questionCard.style.zIndex = "15";
              questionCard.style.bottom = "4%";
              questionCard.style.pointerEvents = "auto";

              // Setup child elements
              if (choices) {
                choices.style.display = "grid";
                choices.style.visibility = "visible";
              }

              if (dilemmaTitle) {
                dilemmaTitle.style.visibility = "visible";
                dilemmaTitle.style.display = "block";
              }

              if (dilemmaText) {
                dilemmaText.style.visibility = "visible";
                dilemmaText.style.display = "block";
              }

              // Make sure choice buttons are visible
              document.querySelectorAll(".choice").forEach((button) => {
                button.style.removeProperty("display");
                button.style.removeProperty("visibility");
                button.style.pointerEvents = "auto";
              });

              // Adjust text sizes while hidden
              adjustQuestionCardTextSizes();

              // IMPORTANT: Now make the card visible but still transparent
              questionCard.style.display = "block";
              // Add will-change for smoother opacity transition
              questionCard.style.willChange = "opacity";

              // Force a reflow to ensure the display change is processed
              questionCard.offsetHeight;

              // Add a small delay before starting opacity transition
              setTimeout(() => {
                console.log("Starting question card fade-in");
                questionCard.style.opacity = "1";

                // Remove will-change after transition completes
                setTimeout(() => {
                  questionCard.style.removeProperty("will-change");
                }, 1000);
              }, 50);
            }
          }, 200);
        }, 450);
      });
    }
  }, 750);
}

// Show ending screen
function showEnding() {
  playSFX("endingReveal");

  // Determine ending based on final aspects
  const ending = determineEnding();

  // Use the ending image directly from the JSON
  elements.overlayImg.src = `assets/images/endings/${ending.img}`;

  // First make the image invisible
  elements.overlayImg.style.opacity = "0";
  elements.overlayImg.style.transition = "opacity 1.5s ease-in";

  // Use the text directly from the JSON
  elements.overlayText.innerHTML = ending.text.join("<br><br>");

  // Also make text invisible initially
  elements.overlayText.style.opacity = "0";
  elements.overlayText.style.transition = "opacity 1.5s ease-in";

  // Make continue button invisible initially
  const continueBtn = document.getElementById("continue-btn");
  if (continueBtn) {
    continueBtn.textContent = "Start New Game";
    continueBtn.style.opacity = "0";
    continueBtn.style.transition = "opacity 1.5s ease-in";
    continueBtn.style.visibility = "visible";
    continueBtn.classList.add("game-complete");
  }

  // Set up fade-in transition for ending screen
  elements.fullscreenOverlay.style.opacity = "0";
  elements.fullscreenOverlay.classList.remove("hidden");
  elements.fullscreenOverlay.classList.add("ending");

  // Force a reflow to ensure the opacity transition works
  elements.fullscreenOverlay.offsetHeight;

  // Add transition effect for the overlay
  elements.fullscreenOverlay.style.transition = "opacity 1.2s ease-in";
  elements.fullscreenOverlay.style.opacity = "1";

  // After the overlay fades in, fade in the image and text with a slight delay
  setTimeout(() => {
    elements.overlayImg.style.opacity = "1";

    // Fade in the text after the image starts to appear
    setTimeout(() => {
      elements.overlayText.style.opacity = "1";

      // Make sure the continue button is set up after text appears
      setTimeout(() => {
        if (continueBtn) {
          continueBtn.style.opacity = "1";

          // Ensure the button is visible by scrolling to it if needed
          setTimeout(() => {
            // Make sure the button is in view
            continueBtn.scrollIntoView({ behavior: "smooth", block: "center" });

            // Add a subtle pulse animation to draw attention to the button
            continueBtn.style.animation = "none";
            continueBtn.offsetHeight; // Trigger reflow
            continueBtn.style.animation = "pulseButton 2s infinite";
          }, 800);
        }
      }, 800);
    }, 500);
  }, 500);

  console.log("Showing ending:", ending.id);

  // Prepare game state for reset when user closes the ending screen
  // Store the final state in a temporary variable for potential analytics or summary
  const finalGameState = {
    aspects: { ...gameState.aspects },
    decisions: [...gameState.decisions],
    ending: ending.id,
  };

  console.log("Game complete. Final state saved:", finalGameState);

  // Add a keypress listener for space/enter to restart the game
  const keyHandler = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      resetGame();
      window.removeEventListener("keydown", keyHandler);
    }
  };
  window.addEventListener("keydown", keyHandler);
}

// Determine ending based on final aspects with more granularity
function determineEnding() {
  // Enhanced tier determination - creates 5 tiers instead of 3 for more diverse endings
  const getDetailedTierForAspect = (aspect) => {
    const value = gameState.aspects[aspect];
    if (value < 20) return "very_low";
    if (value < 40) return "low";
    if (value < 60) return "mid";
    if (value < 80) return "high";
    return "very_high";
  };

  // Traditional 3-tier system for backward compatibility
  const getStandardTierForAspect = (aspect) => {
    const value = gameState.aspects[aspect];
    if (value < 33) return "low";
    if (value < 66) return "mid";
    return "high";
  };

  // Get standard tiers for compatibility with existing endings
  const truthTier = getStandardTierForAspect("truth");
  const happinessTier = getStandardTierForAspect("happiness");
  const autonomyTier = getStandardTierForAspect("autonomy");

  // Get detailed tiers for more nuanced selection
  const detailedTruthTier = getDetailedTierForAspect("truth");
  const detailedHappinessTier = getDetailedTierForAspect("happiness");
  const detailedAutonomyTier = getDetailedTierForAspect("autonomy");

  // Log the tiers for debugging
  console.log(
    `Ending determination - Standard tiers: T:${truthTier}, H:${happinessTier}, A:${autonomyTier}`
  );
  console.log(
    `Ending determination - Detailed tiers: T:${detailedTruthTier}, H:${detailedHappinessTier}, A:${detailedAutonomyTier}`
  );

  // Get raw values for weighted calculations
  const truthValue = gameState.aspects.truth;
  const happinessValue = gameState.aspects.happiness;
  const autonomyValue = gameState.aspects.autonomy;

  // Calculate dominant aspect (which aspect has highest value)
  const dominantAspect =
    truthValue >= happinessValue && truthValue >= autonomyValue
      ? "truth"
      : happinessValue >= truthValue && happinessValue >= autonomyValue
      ? "happiness"
      : "autonomy";

  // Calculate secondary aspect (second highest)
  let secondaryAspect;
  if (dominantAspect === "truth") {
    secondaryAspect =
      happinessValue >= autonomyValue ? "happiness" : "autonomy";
  } else if (dominantAspect === "happiness") {
    secondaryAspect = truthValue >= autonomyValue ? "truth" : "autonomy";
  } else {
    secondaryAspect = truthValue >= happinessValue ? "truth" : "happiness";
  }

  console.log(
    `Dominant aspect: ${dominantAspect}, Secondary aspect: ${secondaryAspect}`
  );

  // Determine if any aspect is extremely high or low (for special endings)
  // Use actual values rather than tiers for more precise evaluation
  const hasExtremeTier =
    truthValue >= 85 ||
    truthValue <= 15 ||
    happinessValue >= 85 ||
    happinessValue <= 15 ||
    autonomyValue >= 85 ||
    autonomyValue <= 15;

  // More precisely identify which aspect is extreme and in which direction
  let extremeAspect = null;
  let isExtremeHigh = false;

  // Find the most extreme aspect value (furthest from 50)
  const truthDistance = Math.abs(truthValue - 50);
  const happinessDistance = Math.abs(happinessValue - 50);
  const autonomyDistance = Math.abs(autonomyValue - 50);

  if (truthDistance >= happinessDistance && truthDistance >= autonomyDistance) {
    extremeAspect = "truth";
    isExtremeHigh = truthValue > 50;
  } else if (
    happinessDistance >= truthDistance &&
    happinessDistance >= autonomyDistance
  ) {
    extremeAspect = "happiness";
    isExtremeHigh = happinessValue > 50;
  } else {
    extremeAspect = "autonomy";
    isExtremeHigh = autonomyValue > 50;
  }

  // Determine if aspects are balanced or polarized
  const aspectRange =
    Math.max(truthValue, happinessValue, autonomyValue) -
    Math.min(truthValue, happinessValue, autonomyValue);
  const isBalanced = aspectRange < 30;
  const isPolarized = aspectRange > 60;

  console.log(
    `Aspect range: ${aspectRange}, Balanced: ${isBalanced}, Polarized: ${isPolarized}`
  );
  console.log(
    `Extreme aspect: ${extremeAspect}, High: ${isExtremeHigh}, Extreme value: ${hasExtremeTier}`
  );

  // NEW APPROACH: Multi-tier ending selection strategy with weighted randomization
  // Collect all potential endings that could match the player's outcome
  const potentialEndings = [];
  let totalWeight = 0;

  // 1. Check for detailed profile matches (highest priority)
  cachedData.endings.forEach((ending) => {
    if (ending.detailedProfile) {
      if (
        ending.detailedProfile.truth === detailedTruthTier &&
        ending.detailedProfile.happiness === detailedHappinessTier &&
        ending.detailedProfile.autonomy === detailedAutonomyTier
      ) {
        potentialEndings.push({ ending, weight: 100 }); // Highest weight
        totalWeight += 100;
      }
    }
  });

  // 2. Check for dominant/secondary aspect matches
  if (potentialEndings.length < 2) {
    // Add more if we don't have enough yet
    cachedData.endings.forEach((ending) => {
      if (
        ending.dominantAspect === dominantAspect &&
        ending.secondaryAspect === secondaryAspect
      ) {
        potentialEndings.push({ ending, weight: 80 });
        totalWeight += 80;
      }
    });
  }

  // 3. Check for extreme aspect matches
  if (hasExtremeTier) {
    cachedData.endings.forEach((ending) => {
      if (
        ending.extremeAspect === extremeAspect &&
        ((isExtremeHigh && ending.isExtremeHigh) ||
          (!isExtremeHigh && ending.isExtremeLow))
      ) {
        potentialEndings.push({ ending, weight: 70 });
        totalWeight += 70;
      }
    });
  }

  // 4. Check for balanced/polarized matches
  if (isBalanced) {
    cachedData.endings.forEach((ending) => {
      if (ending.isBalanced) {
        potentialEndings.push({ ending, weight: 60 });
        totalWeight += 60;
      }
    });
  }
  if (isPolarized) {
    cachedData.endings.forEach((ending) => {
      if (ending.isPolarized) {
        potentialEndings.push({ ending, weight: 60 });
        totalWeight += 60;
      }
    });
  }

  // 5. Check for traditional 3-tier matches
  cachedData.endings.forEach((ending) => {
    if (
      ending.profile &&
      ending.profile.truth === truthTier &&
      ending.profile.happiness === happinessTier &&
      ending.profile.autonomy === autonomyTier
    ) {
      potentialEndings.push({ ending, weight: 50 });
      totalWeight += 50;
    }
  });

  // 6. Add dominant aspect only matches as fallback
  if (potentialEndings.length < 2) {
    cachedData.endings.forEach((ending) => {
      if (ending.dominantAspect === dominantAspect) {
        potentialEndings.push({ ending, weight: 30 });
        totalWeight += 30;
      }
    });
  }

  // 7. Add mid-mid-mid ending as ultimate fallback
  if (potentialEndings.length === 0) {
    const midEnding = cachedData.endings.find(
      (ending) =>
        ending.profile &&
        ending.profile.truth === "mid" &&
        ending.profile.happiness === "mid" &&
        ending.profile.autonomy === "mid"
    );
    if (midEnding) {
      potentialEndings.push({ ending: midEnding, weight: 10 });
      totalWeight += 10;
    }
  }

  // Now select a random ending based on weights
  let matchingEnding = null;
  if (potentialEndings.length > 0) {
    // Randomly select based on weights
    const randomValue = Math.random() * totalWeight;
    let weightSum = 0;
    for (const potentialEnding of potentialEndings) {
      weightSum += potentialEnding.weight;
      if (randomValue <= weightSum) {
        matchingEnding = potentialEnding.ending;
        break;
      }
    }

    // Fallback if something went wrong with weighted selection
    if (!matchingEnding) {
      matchingEnding = potentialEndings[0].ending;
    }
  }

  // Ultimate fallback: mid-mid-mid ending
  if (!matchingEnding) {
    matchingEnding = cachedData.endings.find(
      (ending) =>
        ending.profile &&
        ending.profile.truth === "mid" &&
        ending.profile.happiness === "mid" &&
        ending.profile.autonomy === "mid"
    );
  }

  console.log(
    "Selected ending:",
    matchingEnding ? matchingEnding.id : "No matching ending found",
    `From ${potentialEndings.length} potential endings`
  );
  return matchingEnding;
}

// Reset game to start a new playthrough
function resetGame(event) {
  // If event exists and it's from the Start Over button (not from ending screen)
  if (event && !elements.fullscreenOverlay.classList.contains("ending")) {
    // Confirm before resetting if in the middle of a game
    if (gameState.decisions.length > 0) {
      if (
        !confirm(
          "Are you sure you want to start over? All progress will be lost."
        )
      ) {
        return; // User canceled
      }
    }
  }

  // Play sound
  playSFX("uiConfirm");

  // CRITICAL: Immediately hide the bridge screen to prevent ANY flicker
  elements.bridgeScreen.style.visibility = "hidden";
  elements.bridgeScreen.style.display = "none";

  // Reset game state
  gameState.currentEon = 1;
  gameState.currentQuestion = 1;
  gameState.aspects = {
    truth: 50,
    happiness: 50,
    autonomy: 50,
  };
  gameState.decisions = [];

  // Reset continue button text to ensure consistency
  const continueBtn = document.getElementById("continue-btn");
  if (continueBtn) {
    continueBtn.textContent = "Continue";
    continueBtn.classList.remove("game-complete");
  }

  // Clear log
  elements.logContent.innerHTML = "";

  // Reset UI elements - bridge screen already hidden
  elements.fullscreenOverlay.classList.remove("ending");
  elements.fullscreenOverlay.classList.add("hidden");

  // Show intro screen with initial opacity of 0
  elements.introScreen.classList.remove("hidden");
  elements.introScreen.style.opacity = "0";

  // Force a reflow to ensure the opacity transitions work
  elements.introScreen.offsetHeight;

  // Fade in the intro screen
  elements.introScreen.style.transition = "opacity 0.8s ease-in";
  elements.introScreen.style.opacity = "1";

  // Reset bridge screen display property after the intro is showing
  setTimeout(() => {
    elements.bridgeScreen.style.removeProperty("display");
    elements.bridgeScreen.style.removeProperty("visibility");
  }, 100);

  // Hide start over button when back at intro
  elements.startOverBtn.style.display = "none";

  // Reset intro animations
  elements.gameDescription.classList.add("hidden");
  elements.beginBtn.classList.add("hidden");

  // Stop music
  audioElements.ambientLoop.pause();
  audioElements.ambientLoop.currentTime = 0;

  // Restart intro sequence with delayed elements
  setupIntroSequence();
}

// Handle window resize for proper scaling
function handleWindowResize() {
  // Initial resize
  adjustGameContainerSize();

  // Add event listener for window resize
  window.addEventListener("resize", adjustGameContainerSize);

  // Use ResizeObserver for more reliable size change detection
  if (window.ResizeObserver) {
    const gameContainer = document.getElementById("game-container");
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        console.log("Container resized, updating positions");
        if (monitorCoordinates) {
          setMonitorPositions(monitorCoordinates);
        }
      }
    });

    // Start observing game container size changes
    if (gameContainer) {
      resizeObserver.observe(gameContainer);
      console.log("Resize observer attached to game container");
    }
  }
}

// Adjust game container size based on window dimensions
function adjustGameContainerSize() {
  const gameContainer = document.getElementById("game-container");

  // Adjust scale factor based on viewport dimensions
  if (window.innerWidth < 500) {
    document.documentElement.style.setProperty("--scale-factor", "0.8");
  } else if (window.innerWidth < 800) {
    document.documentElement.style.setProperty("--scale-factor", "0.9");
  } else {
    document.documentElement.style.setProperty("--scale-factor", "1");
  }

  // Handle special cases for very low height
  if (window.innerHeight < 600) {
    document.documentElement.style.setProperty(
      "--content-height-adjustment",
      "0.85"
    );
  } else if (window.innerHeight < 500) {
    document.documentElement.style.setProperty(
      "--content-height-adjustment",
      "0.7"
    );
  } else {
    document.documentElement.style.setProperty(
      "--content-height-adjustment",
      "1"
    );
  }

  // Reposition monitors when window size changes
  if (monitorCoordinates) {
    setTimeout(() => {
      setMonitorPositions(monitorCoordinates);
    }, 100);
  }

  // Re-adjust question card text sizing if it exists (game is running)
  if (
    document.getElementById("question-card") &&
    !document.getElementById("question-card").classList.contains("hidden")
  ) {
    // Use a timeout to ensure CSS variables have been applied
    setTimeout(() => {
      adjustQuestionCardTextSizes();
    }, 150);
  }
}

// Show bridge screen (was removed in user edit)
function showBridgeScreen() {
  // Hide intro and show bridge
  elements.introScreen.classList.add("hidden");
  elements.bridgeScreen.classList.remove("hidden");

  // Show start-over button when on bridge screen
  elements.startOverBtn.style.display = "block";

  // Style the current eon with Prime Directive font and larger size
  const eonNames = ["Awakening World", "Industrial Dusk", "Final Horizon"];
  elements.currentEon.textContent = `Eon ${gameState.currentEon}: ${
    eonNames[gameState.currentEon - 1]
  }`;
  elements.currentEon.style.fontFamily = "'Orbitron', sans-serif";
  elements.currentEon.style.fontSize = "1.5rem";
  elements.currentEon.style.fontWeight = "bold";
  elements.currentEon.style.textShadow = "0 0 5px rgba(0, 200, 255, 0.7)";
  elements.currentEon.style.letterSpacing = "1px";
  elements.currentEon.style.marginBottom = "12px";

  // Hide the question counter
  if (elements.questionsCounter) {
    elements.questionsCounter.style.display = "none";
  }

  // Update monitors
  updateMonitors();

  // Play transition sound
  //playSFX("screenTransition");
}

// Position monitors and bars based on provided screen coordinates
function setMonitorPositions(coordinatesData) {
  // Get the background image to use as reference
  const bridgeBg = document.querySelector("#bridge-bg img");
  console.log(
    "Setting up monitor positions, background image dimensions:",
    bridgeBg ? `${bridgeBg.width}x${bridgeBg.height}` : "not loaded"
  );

  if (!bridgeBg || !bridgeBg.complete) {
    console.log(
      "Background image not fully loaded, will retry positioning later"
    );
    // Try again after a short delay
    setTimeout(() => setMonitorPositions(coordinatesData), 100);
    return;
  }

  // Apply coordinates to monitors
  for (const monitorId in coordinatesData.monitors) {
    const monitor = document.getElementById(monitorId);
    if (monitor) {
      const coords = coordinatesData.monitors[monitorId];
      console.log(`Positioning ${monitorId} with coordinates:`, coords);

      // Set the monitor position based on the background image's coordinates
      positionElementRelativeToBackground(
        monitor,
        coords.topLeft,
        coords.bottomRight,
        bridgeBg
      );

      // Ensure overlay is visible
      const overlay = monitor.querySelector(".overlay");
      if (overlay) {
        overlay.style.visibility = "visible";
        overlay.style.opacity = "1";

        // Make sure the image maintains its aspect ratio
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.objectFit = "contain";
      }
    } else {
      console.warn(`Monitor element not found: ${monitorId}`);
    }
  }

  // Apply coordinates to bar containers
  for (const barId in coordinatesData.bars) {
    const barContainer = document.getElementById(`${barId}-container`);
    if (barContainer) {
      const coords = coordinatesData.bars[barId];
      console.log(`Positioning ${barId} container with coordinates:`, coords);

      // Set the bar position based on the background image's coordinates
      positionElementRelativeToBackground(
        barContainer,
        coords.topLeft,
        coords.bottomRight,
        bridgeBg
      );
    } else {
      console.warn(`Bar container not found: ${barId}-container`);
    }
  }
}

// Helper function to position elements relative to background image
function positionElementRelativeToBackground(
  element,
  topLeft,
  bottomRight,
  bridgeBg
) {
  const bgRect = bridgeBg.getBoundingClientRect();

  // Skip if background image not fully loaded
  if (!bgRect.width || !bgRect.height) {
    console.log("Background image not ready yet, skipping positioning");
    return;
  }

  // Calculate positions as percentages of the background image
  const left = (topLeft.x / 100) * bgRect.width;
  const top = (topLeft.y / 100) * bgRect.height;
  const width = ((bottomRight.x - topLeft.x) / 100) * bgRect.width;
  const height = ((bottomRight.y - topLeft.y) / 100) * bgRect.height;

  // Apply calculated positions
  element.style.position = "absolute";
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;

  // Force redraw by accessing offsetHeight
  element.offsetHeight;
}

// Coordinates data structure with positioning relative to the background image
const monitorCoordinates = {
  monitors: {
    "truth-monitor": {
      topLeft: { x: 11.85, y: 28.75 },
      bottomRight: { x: 30.96, y: 51.5 },
    },
    "happiness-monitor": {
      topLeft: { x: 37.96, y: 25.0 },
      bottomRight: { x: 62.07, y: 55.25 },
    },
    "autonomy-monitor": {
      topLeft: { x: 68.94, y: 28.75 },
      bottomRight: { x: 88.18, y: 51.5 },
    },
  },
  bars: {
    "truth-bar": {
      topLeft: { x: 16.0, y: 52.5 },
      bottomRight: { x: 27.0, y: 54.5 },
    },
    "happiness-bar": {
      topLeft: { x: 45.5, y: 52.5 },
      bottomRight: { x: 56.5, y: 54.5 },
    },
    "autonomy-bar": {
      topLeft: { x: 74.0, y: 52.5 },
      bottomRight: { x: 85.0, y: 54.5 },
    },
  },
  labels: {},
};

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
