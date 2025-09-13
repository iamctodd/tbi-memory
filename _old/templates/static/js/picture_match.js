// picture_match.js
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("pm-start-btn");
  const levelSelect = document.getElementById("pm-level");
  const pmStart = document.getElementById("pm-start");
  const pmShowing = document.getElementById("pm-showing");
  const pmRow = document.getElementById("pm-row");
  const pmHear = document.getElementById("pm-hear");
  const pmReady = document.getElementById("pm-ready");
  const pmReorder = document.getElementById("pm-reorder");
  const pmReorderRow = document.getElementById("pm-reorder-row");
  const pmFeedback = document.getElementById("pm-feedback");

  let original = [];

  function speak(text){
    if("speechSynthesis" in window){
      const ut = new SpeechSynthesisUtterance(text);
      ut.rate = 0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(ut);
    }
  }

  async function fetchPictures(n){
    const res = await fetch(`/api/pictures?n=${n}`);
    const data = await res.json();
    return data.pictures;
  }

  function renderPics(rowEl, arr){
    rowEl.innerHTML = "";
    arr.forEach((p, idx) => {
      const d = document.createElement("div");
      d.className = "pm-card";
      d.dataset.index = idx;
      d.dataset.id = p.id;
      d.title = p.label;
      d.setAttribute("role","img");
      d.setAttribute("aria-label", p.label);
      d.innerHTML = `<div style="font-size:34px">${p.emoji}</div>`;
      rowEl.appendChild(d);
    });
  }

  startBtn.addEventListener("click", async () => {
    const n = parseInt(levelSelect.value) || 4;
    const pics = await fetchPictures(n);
    original = pics.slice();
    renderPics(pmRow, pics);
    pmStart.classList.add("hidden");
    pmShowing.classList.remove("hidden");
    speak("Observe the pictures in order.");
  });

  pmHear.addEventListener("click", () => {
    // build a short story using labels
    if(!original.length) return;
    const labels = original.map(p => p.label.toLowerCase());
    // naive story: "The {0} saw the {1} near the {2}..."
    const story = labels.join(" then ");
    speak("Here is a simple story: " + story);
  });

  pmReady.addEventListener("click", () => {
    // hide showing, create reorder UI (shuffled)
    pmShowing.classList.add("hidden");
    pmReorder.classList.remove("hidden");
    const shuffled = original.slice().sort(()=>Math.random()-0.5);
    renderReorder(shuffled);
  });

  function renderReorder(arr){
    pmReorderRow.innerHTML = "";
    arr.forEach((p, idx) => {
      const wrapper = document.createElement("div");
      wrapper.className = "pm-card";
      wrapper.dataset.id = p.id;
      wrapper.innerHTML = `<div style="font-size:34px">${p.emoji}</div>
          <div style="font-size:12px;margin-top:6px">${p.label}</div>
          <div style="margin-top:8px; display:flex; gap:6px; justify-content:center">
            <button class="move-left" aria-label="Move left">◀</button>
            <button class="move-right" aria-label="Move right">▶</button>
          </div>`;
      pmReorderRow.appendChild(wrapper);

      // wire move buttons
      const left = wrapper.querySelector(".move-left");
      const right = wrapper.querySelector(".move-right");
      left.addEventListener("click", () => moveCard(idx, -1));
      right.addEventListener("click", () => moveCard(idx, +1));
    });
  }

  function moveCard(index, dir){
    const nodes = Array.from(pmReorderRow.children);
    if(index < 0 || index >= nodes.length) return;
    const target = index + dir;
    if(target < 0 || target >= nodes.length) return;
    // swap DOM nodes
    const a = nodes[index];
    const b = nodes[target];
    pmReorderRow.insertBefore(b, a);
    // re-render to re-wire events
    const currentArr = Array.from(pmReorderRow.children).map(n => {
      return {
        id: n.dataset.id,
        emoji: n.querySelector("div").textContent.trim(),
        label: n.querySelector("div:nth-child(2)") ? n.querySelector("div:nth-child(2)").textContent : ""
      };
    });
    // re-render with new functions (preserve displayed order)
    renderReorder(currentArr);
    // after every move, check if matches original order
    checkOrder();
  }

  function checkOrder(){
    // compare displayed ids to original ids
    const current = Array.from(pmReorderRow.children).map(n => n.dataset.id);
    const orig = original.map(p => p.id);
    if(current.join("|") === orig.join("|")){
      pmFeedback.textContent = "Great! You restored the original order.";
      pmFeedback.className = "feedback";
      speak("Great! You restored the original order.");
    } else {
      pmFeedback.textContent = "";
      pmFeedback.className = "hidden";
    }
  }

});
