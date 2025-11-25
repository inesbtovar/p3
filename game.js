/* ===== Prototype game logic (Estilo 2) ===== */

/* --- Data (pistas) --- */
const CLUES = {
  coat:      {title: "Casaco do marido", text: "O casaco não mostra sinais de arrombamento nem luta. (relevante)", kind: "real"},
  chair:     {title: "Poltrona", text: "Fibras manchadas sugerem contacto com sangue. (relevante)", kind: "real"},
  whisky:    {title: "Copo de whisky", text: "O copo parece ter sido limpo; impressões removidas. (secundária)", kind: "false"},
  fridge:    {title: "Frigorífico", text: "Frigorífico aberto recentemente; restos de carne. (relevante)", kind: "real"},
  leg:       {title: "Perna de borrego", text: "A perna de borrego tem uma chave presa — encontraste a chave.", kind: "real", givesKey: true},
  bench:     {title: "Bancada", text: "Bancada molhada; uma faca está em falta. (relevante)", kind: "real"},
  newspaper: {title: "Jornal", text: "Encontras a confissão: a Esposa matou Patrick Maloney. Fim do caso.", kind: "real", final: true}
};

/* --- State --- */
let state = {
  index: 0,        // scene index: 0..4
  clues: [],       // ids encontrados
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

/* --- Navigation rules (flow) --- */
function canGoTo(target){
  const cur = state.index;
  if(cur === target) return true;
  // Exterior (0) -> Hall (1)
  if(cur === 0 && target === 1) return true;
  // Hall (1) -> Sala (2)
  if(cur === 1 && target === 2) return true;
  // Sala (2) -> Cozinha (3) or Quarto (4) (Quarto locked without key)
  if(cur === 2 && (target === 3 || target === 4)){
    if(target === 4 && !state.hasKey) return false;
    return true;
  }
  // Cozinha (3) -> Sala (2)
  if(cur === 3 && target === 2) return true;
  // Quarto (4) -> Sala (2)
  if(cur === 4 && target === 2) return true;
  return false;
}

function goTo(idx, instant=false){
  if(!canGoTo(idx)){
    flash("Não podes ir para aí ainda.");
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
      if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });
  });
}

/* --- Inspect objects / collect clues --- */
function inspect(id){
  if(!id || !CLUES[id]) return;
  // already found?
  if(state.clues.includes(id)){
    showModal(CLUES[id].title, CLUES[id].text);
    return;
  }

  // collect
  state.clues.push(id);
  // gives key?
  if(CLUES[id].givesKey){
    state.hasKey = true;
    keyState.textContent = "Sim";
    flash("Recolheste a chave!");
  }
  // final?
  if(CLUES[id].final){
    state.foundPaper = true;
    paperState.textContent = "Sim";
  }

  renderUI();
  showModal(CLUES[id].title, CLUES[id].text);
}

/* --- Render clues list and UI --- */
function renderUI(){
  // clues
  clueList.innerHTML = "";
  if(state.clues.length === 0){
    const e = document.createElement('div'); e.className = 'clue empty'; e.textContent = 'Nenhuma pista recolhida'; clueList.appendChild(e);
  } else {
    state.clues.forEach(id=>{
      const d = document.createElement('div'); d.className = 'clue'; d.textContent = CLUES[id].title + (CLUES[id].kind === 'real' ? ' — relevante' : ' — secundária');
      clueList.appendChild(d);
    });
  }
  // nav active
  navBtns.forEach(b => b.classList.toggle('active', Number(b.dataset.index) === state.index));
  // button door label update
  const door = document.getElementById('doorToQuarto');
  if(door){
    if(state.hasKey){
      door.textContent = "Porta para o Quarto (destrancada)";
      door.removeAttribute('aria-disabled');
      door.disabled = false;
      door.classList.remove('locked');
    } else {
      door.textContent = "Porta para o Quarto (trancada)";
      door.setAttribute('aria-disabled','true');
      door.disabled = true;
      door.classList.add('locked');
    }
  }
  // text indicators
  currentLocation.textContent = sceneName(state.index);
  keyState.textContent = state.hasKey ? "Sim" : "Não";
  paperState.textContent = state.foundPaper ? "Sim" : "Não";
}

/* --- Scene name --- */
function sceneName(idx){
  return ["Exterior","Hall","Sala","Cozinha","Quarto"][idx] || "";
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
overlay.addEventListener('click', e => { if(e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && overlay.classList.contains('show')) closeModal(); });
function closeModal(){ overlay.classList.remove('show'); overlay.setAttribute('aria-hidden','true'); }

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
      showModal("Escolhe um suspeito", "Selecciona primeiro um dos suspeitos antes de submeter.");
      return;
    }
    if(!state.foundPaper){
      showModal("Ainda não", "Encontra o jornal no Quarto antes de submeter a acusação final.");
      return;
    }
    const correct = state.suspect === 'Esposa';
    if(correct){
      showModal("Acusação correcta", "A Esposa matou Patrick Maloney com a perna de borrego. Encontraste o jornal com a confissão.");
    } else {
      showModal("Acusação errada", "A tua acusação está incorreta. Lê o jornal novamente para confirmar.");
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
    zIndex: 9999,
    boxShadow: '0 8px 30px rgba(0,0,0,0.7)'
  });
  document.body.appendChild(el);
  setTimeout(()=> el.style.opacity = '0', 1500);
  setTimeout(()=> el.remove(), 2200);
}

/* --- helpers --- */
function updateSceneUI(){ renderUI(); }

/* --- Reset game --- */
function resetGame(){
  state = { index: 0, clues: [], hasKey: false, foundPaper: false, suspect: null };
  document.querySelectorAll('.suspect').forEach(s => s.classList.remove('active'));
  renderUI();
  goTo(0, true);
}
