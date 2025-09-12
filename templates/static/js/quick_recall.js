// quick_recall.js
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-button");
  const levelSelect = document.getElementById("level-select");
  const startScreen = document.getElementById("start-screen");
  const showing = document.getElementById("showing");
  const wordBox = document.getElementById("word-box");
  const recall = document.getElementById("recall");
  const slots = document.getElementById("slots");
  const choices = document.getElementById("choices");
  const feedback = document.getElementById("feedback");
  const skipBtn = document.getElementById("skip-button");

  let sequence = [];
  let userSelection = [];

  function speak(text){
    if("speechSynthesis" in window){
      const ut = new SpeechSynthesisUtterance(text);
      ut.rate = 0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(ut);
    }
  }

  async function fetchSequence(n){
    const res = await fetch(`/api/words?n=${n}`);
    const data = await res.json();
    return data.sequence;
  }

  function showWord(word){
    wordBox.textContent = word;
    speak(word);
  }

  function showSequenceThenRecall(seq){
    startScreen.classList.add("hidden");
    feedback.classList.add("hidden");
    showing.classList.remove("hidden");
    recall.classList.add("hidden");
    let i = 0;
    const revealMs = 1100; // how long each word is visible (tweakable)
    const pauseMs = 800;   // between words
    function step(){
      if(i < seq.length){
        showWord(seq[i]);
        i++;
        setTimeout(() => {
          wordBox.textContent = "";
          setTimeout(step, pauseMs);
        }, revealMs);
      } else {
        // finished showing sequence
        showing.classList.add("hidden");
        prepareRecall(seq);
      }
    }
    step();
  }

  function prepareRecall(seq){
    sequence = seq.slice();
    userSelection = [];
    slots.innerHTML = "";
    choices.innerHTML = "";
    // create empty slots
    for(let i=0;i<seq.length;i++){
      const div = document.createElement("div");
      div.className = "slot";
      div.dataset.index = i;
      div.textContent = "";
      slots.appendChild(div);
    }
    // create shuffled choices
    const shuffled = seq.slice().sort(()=>Math.random()-0.5);
    shuffled.forEach(w => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = w;
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => {
        // toggle selection only forward (append)
        if(btn.getAttribute("aria-pressed")==="true") return;
        btn.setAttribute("aria-pressed","true");
        userSelection.push(w);
        renderSelected();
        if(userSelection.length === sequence.length){
          checkAnswer();
        }
      });
      choices.appendChild(btn);
    });
    recall.classList.remove("hidden");
    speak("Get ready to recall.");
  }

  function renderSelected(){
    const slotEls = slots.querySelectorAll(".slot");
    slotEls.forEach((s, idx) => {
      s.textContent = userSelection[idx] || "";
    });
  }

  function checkAnswer(){
    const correct = sequence.join("|");
    const attempt = userSelection.join("|");
    if(correct === attempt){
      feedback.textContent = "Great memory! Ready for the next round?";
      feedback.classList.remove("hidden");
      feedback.className = "feedback";
      showNextButton(true);
      speak("Great job!");
    } else {
      feedback.textContent = `Close! The correct order was: ${sequence.join(" — ")}`;
      feedback.classList.remove("hidden");
      feedback.className = "feedback";
      showNextButton(false);
      speak("Let's try again.");
    }
  }

  function showNextButton(wasCorrect){
    const btn = document.createElement("button");
    btn.className = "primary-btn";
    btn.textContent = "NEXT ROUND";
    btn.addEventListener("click", () => {
      // continue at same difficulty (or increase if correct)
      const level = parseInt(levelSelect.value);
      let nextLevel = wasCorrect ? Math.min(level+1, 8) : level;
      levelSelect.value = nextLevel;
      startRound();
    });

    // replace existing content in feedback area
    const p = document.createElement("div");
    p.appendChild(btn);
    feedback.appendChild(document.createElement("div"));
    // append button (leave message above)
    feedback.appendChild(btn);
  }

  skipBtn.addEventListener("click", () => {
    showing.classList.add("hidden");
    prepareRecall(sequence); // allow recall early
  });

  function startRound(){
    // clear old UI
    showing.classList.add("hidden");
    recall.classList.add("hidden");
    feedback.classList.add("hidden");
    startScreen.classList.remove("hidden");

    const n = parseInt(levelSelect.value) || 3;
    fetchSequence(n).then(seq => {
      showSequenceThenRecall(seq);
    });
  }

  startBtn.addEventListener("click", startRound);

});
