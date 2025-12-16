const CLUES = {
  coat:      {title: "Shoes", text: "You found a clue in the shoes!", kind: "real"},
  chair:     {title: "Chair", text: "You found a clue in the sofa!", kind: "real"},
  table:     {title: "Table", text: "You found a clue in the table!", kind: "false"},
  fridge:    {title: "Fridge", text: "You found a clue in the fridge!", kind: "real"},
  leg:       {title: "Lamb", text: "You found a clue in the lamb! And the room key!", kind: "real", givesKey: true},
  bench:     {title: "Table", text: "You found a clue in the table!", kind: "real"},
  bed:       {title: "Bed", text: "You found the newspaper under the bed!", kind: "real", givesNewspaper: true},
  newspaper: {title: "Paper", text: "You found the police Paper: Read it to find who's guilty!", kind: "real", final: true}
};

/* --- State --- */
let state = {
  index: 0,
  clues: [],
  hasKey: false,
  foundPaper: false,
  suspect: null
};

/* --- DOM refs --- */
const carousel = document.getElementById('carousel');
const navBtns = Array.from(document.querySelectorAll('.nav-btn'));
const currentLocation = document.getElementById('currentLocation');
const clueList = document.getElementById('clueList');
const keyState = document.getElementById('keyState');
const paperState = document.getElementById('paperState');
const overlay = document.getElementById('overlay');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const suspectsEl = document.getElementById('suspects');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');

/* --- Initialization --- */
function init(){
  attachHotspots();
  attachNav();
  attachUI();
  renderUI();
  goTo(state.index, true);
}
init();

function canGoTo(target){
  const cur = state.index;

  // Exterior -> Hall
  if(cur === 0 && target === 1) return true;

  // Hall -> Living room
  if(cur === 1 && target === 2) return true;

  // Living room -> Kitchen ou Room
  if(cur === 2){
    if(target === 3) return true; // Kitchen
    if(target === 4){             // Room
      if(!state.hasKey){
        showModal("Locked door", "This door is locked. Find the key first!");
        return false;
      }
      return true;
    }
  }

  // Kitchen -> Living room
  if(cur === 3 && target === 2) return true;

  // Room -> Living room or Newspaper
  if(cur === 4){
    if(target === 2) return true;
    if(target === 5){
      if(!state.foundPaper){
        showModal("Nothing here", "You need to find the newspaper first!");
        return false;
      }
      return true;
    }
  }

  // Newspaper navigation (5-9)
  if(cur === 5 && target === 6) return true;
  if(cur === 6 && target === 7) return true;
  if(cur === 7 && target === 8) return true;
  if(cur === 8 && target === 9) return true;
  if(cur === 9 && target === 2) return true;

  return false;
}

function goTo(idx, instant=false){
  if(!instant && !canGoTo(idx)){
    flash("You can't go there yet");
    return;
  }
  state.index = idx;
  const offset = -idx * 100;
  carousel.style.transform = `translateX(${offset}%)`;
  updateSceneUI();
}

/* --- Attach nav buttons --- */
function attachNav(){
  navBtns.forEach(btn=>{
    btn.addEventListener('click', ()=> {
      const idx = Number(btn.dataset.index);
      goTo(idx);
    });
  });
}

/* --- Attach hotspots (data-action) --- */
function attachHotspots(){
  document.querySelectorAll('[data-action]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      const action = el.dataset.action;
      if(action === 'enter' || action === 'goto'){
        const target = Number(el.dataset.target);
        goTo(target);
      } else if(action === 'inspect'){
        const id = el.dataset.id;
        inspect(id);
      }
    });
    // keyboard support
    el.addEventListener('keydown', e=> {
      if(e.key === 'Enter' || e.key === ' ') { 
        e.preventDefault(); 
        el.click(); 
      }
    });
  });
}

/* --- Inspect objects / collect clues --- */
function inspect(id){
  if(!id || !CLUES[id]) return;
  
  // already found?
  if(state.clues.includes(id)){
    // Se for a cama e já tiver o jornal, ir para o jornal
    if(id === 'bed' && state.foundPaper){
      goTo(5);
      return;
    }
    showModal(CLUES[id].title, CLUES[id].text);
    return;
  }

  // collect
  state.clues.push(id);
  
  // gives key?
  if(CLUES[id].givesKey){
    state.hasKey = true;
    keyState.textContent = "Yes";
    flash("You got the room key!");
  }
  
  // gives newspaper?
  if(CLUES[id].givesNewspaper){
    state.foundPaper = true;
    paperState.textContent = "Yes";
    flash("You found the newspaper!");
    renderUI();
    // Ir para o jornal após um pequeno delay
    setTimeout(() => {
      goTo(5);
    }, 800);
    return; // Não mostrar o modal normal
  }
  
  // final?
  if(CLUES[id].final){
    state.foundPaper = true;
    paperState.textContent = "Yes";
  }

  renderUI();
  showModal(CLUES[id].title, CLUES[id].text);
}

/* --- Render clues list and UI --- */
function renderUI(){
  // clues
  clueList.innerHTML = "";
  if(state.clues.length === 0){
    const e = document.createElement('div'); 
    e.className = 'clue empty'; 
    e.textContent = 'Got no clue'; 
    clueList.appendChild(e);
  } else {
    state.clues.forEach(id=>{
      const d = document.createElement('div'); 
      d.className = 'clue'; 
      d.textContent = CLUES[id].title + (CLUES[id].kind === 'real' ? ' — relevant' : ' — sec');
      clueList.appendChild(d);
    });
  }
  
  // nav active
  navBtns.forEach(b => b.classList.toggle('active', Number(b.dataset.index) === state.index));
  
  // button door label update
  const door = document.getElementById('doorToQuarto');
  if(door){
    if(state.hasKey){
      door.classList.remove('locked');
    } else {
      door.classList.add('locked');
    }
  }
  
  // text indicators
  currentLocation.textContent = sceneName(state.index);
  keyState.textContent = state.hasKey ? "Yes" : "No";
  paperState.textContent = state.foundPaper ? "Yes" : "No";
}

/* --- Scene name --- */
function sceneName(idx){
  return ["Exterior","Hall","Living room","Kitchen","Room", "Newspaper Page 1", "Newspaper Page 2", "Newspaper Page 3", "Newspaper Page 4", "Newspaper Page 5"][idx] || "";
}

/* --- Modal control --- */
function showModal(title, text){
  modalTitle.textContent = title;
  modalBody.textContent = text;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
  modalClose.focus();
}

modalClose.addEventListener('click', closeModal);
overlay.addEventListener('click', e => { 
  if(e.target === overlay) closeModal(); 
});
document.addEventListener('keydown', e => { 
  if(e.key === 'Escape' && overlay.classList.contains('show')) closeModal(); 
});

function closeModal(){ 
  overlay.classList.remove('show'); 
  overlay.setAttribute('aria-hidden','true');
}

/* --- UI attachments (suspects, submit, reset) --- */
function attachUI(){
  // suspects
  suspectsEl.addEventListener('click', e => {
    const btn = e.target.closest('.suspect');
    if(!btn) return;
    document.querySelectorAll('.suspect').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    state.suspect = btn.dataset.name;
  });

  // submit
  submitBtn.addEventListener('click', () => {
    if(!state.suspect){
      showModal("Choose a suspect", "Choose a suspect before submitting.");
      return;
    }
    if(!state.foundPaper){
      showModal("Not yet", "You need to find the newspaper before submitting the accusation.");
      return;
    }
    const correct = state.suspect === 'Esposa';
    if(correct){
      showModal("Correct accusation!", "The Wife killed Patrick Maloney with the lamb. You found the confession.");
    } else {
      showModal("Incorrect accusation", "Keep trying! Review the evidence.");
    }
  });

  // reset
  resetBtn.addEventListener('click', resetGame);
}

/* --- Utility: flash message (temporary) --- */
function flash(text){
  const el = document.createElement('div');
  el.textContent = text;
  Object.assign(el.style, {
    position: 'fixed',
    right: '18px',
    bottom: '18px',
    padding: '10px 14px',
    background: '#081621',
    border: '1px solid rgba(255,255,255,0.04)',
    color: '#eaf4ff',
    borderRadius: '8px',
    zIndex: '9999',
    boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
    transition: 'opacity 0.7s'
  });
  document.body.appendChild(el);
  setTimeout(()=> el.style.opacity = '0', 1500);
  setTimeout(()=> el.remove(), 2200);
}

/* --- helpers --- */
function updateSceneUI(){ 
  renderUI(); 
}

/* --- Reset game --- */
function resetGame(){
  state = { 
    index: 0, 
    clues: [], 
    hasKey: false, 
    foundPaper: false, 
    suspect: null 
  };
  document.querySelectorAll('.suspect').forEach(s => s.classList.remove('active'));
  renderUI();
  goTo(0, true);
}