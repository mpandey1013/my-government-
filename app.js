// app.js - navigation, forms, localStorage
(function () {
  // helpers
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const showScreen = id => {
    qsa('.gameScreen').forEach(el => el.classList.remove('active'));
    const el = qs('#' + id);
    if (el) el.classList.add('active');
    window.scrollTo(0,0);
  };

  // storage keys
  const KEY = 'gov_sim_v1';

  // load/save
  function loadState() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return {}; }
  }
  function saveState(state) { localStorage.setItem(KEY, JSON.stringify(state || {})); }

  // start new game
  qs('#startNewGameButton') && qs('#startNewGameButton').addEventListener('click', () => showScreen('createProfileScreen'));

  // profile form
  const profileForm = qs('#profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = qs('#playerName').value.trim();
      const age = parseInt(qs('#playerAge').value,10);
      const city = qs('#playerCity').value.trim();
      const email = qs('#playerEmail').value.trim();
      const pass = qs('#playerPassword').value;

      const msgEl = qs('#profileMessage');
      if (!name || !email || !pass || !city || !age) {
        msgEl.textContent = 'Please complete all fields.';
        return;
      }
      if (age < 18) { msgEl.textContent = 'You must be at least 18.'; return; }
      // simple email check
      if (!/^\S+@\S+\.\S+$/.test(email)) { msgEl.textContent = 'Enter a valid email.'; return; }

      const state = loadState();
      state.profile = { name, age, city, email };
      saveState(state);
      msgEl.textContent = '';
      showScreen('partySelectionScreen');
    });
  }

  // back to main
  qsa('[data-action="back-to-main-menu"], [data-action="back-to-main"]').forEach(btn=>{
    btn.addEventListener('click', ()=> showScreen('mainMenuScreen'));
  });

  // party form
  const partyForm = qs('#partyForm');
  if (partyForm) {
    partyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = qs('#partyName').value.trim();
      const color = qs('#partyColor') ? qs('#partyColor').value.trim() : '';
      const slogan = qs('#partySlogan') ? qs('#partySlogan').value.trim() : '';
      const ideology = qs('#partyIdeology') ? qs('#partyIdeology').value : 'centrist';

      if (!name) {
        alert('Enter a party name.');
        return;
      }
      const state = loadState();
      state.party = { name, color, slogan, ideology };
      saveState(state);
      showScreen('policiesScreen');
    });
  }

  // policies: limit 3
  const policiesForm = qs('#policiesForm');
  if (policiesForm) {
    const checkboxes = qsa('#policiesForm input[type="checkbox"][name="policy"]');
    checkboxes.forEach(cb=>{
      cb.addEventListener('change', ()=> {
        const checked = checkboxes.filter(c=>c.checked);
        if (checked.length > 3) {
          // undo last change
          cb.checked = false;
          alert('You can choose up to 3 policies.');
        }
      });
    });
    policiesForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const chosen = checkboxes.filter(c=>c.checked).map(c=>c.value);
      const state = loadState();
      state.policies = chosen;
      saveState(state);
      showScreen('budgetScreen');
    });
    qsa('[data-action="back-to-party"]').forEach(b=>b.addEventListener('click', ()=> showScreen('partySelectionScreen')));
  }

  // budget form: ensure sums to 100
  const budgetForm = qs('#budgetForm');
  if (budgetForm) {
    budgetForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fields = ['budgetHealth','budgetEducation','budgetDefense','budgetInfrastructure','budgetWelfare'];
      const values = fields.map(id => parseFloat(qs('#'+id).value) || 0);
      const total = values.reduce((a,b)=>a+b,0);
      if (Math.round(total) !== 100) {
        alert('Budget must sum to 100%. Current: ' + total + '%');
        return;
      }
      const state = loadState();
      state.budget = {
        health: values[0],
        education: values[1],
        defense: values[2],
        infrastructure: values[3],
        welfare: values[4]
      };
      saveState(state);
      showScreen('reviewScreen');
      renderReview();
    });
    qsa('[data-action="back-to-policies"]').forEach(b=>b.addEventListener('click', ()=> showScreen('policiesScreen')));
  }

  // review
  function renderReview() {
    const state = loadState();
    const el = qs('#reviewSummary');
    if (!el) return;
    el.innerHTML = '';
    const add = (title, value) => {
      const div = document.createElement('div');
      div.style.marginBottom = '8px';
      div.innerHTML = '<strong>'+title+':</strong> ' + (value || '<em>—</em>');
      el.appendChild(div);
    };
    add('Player', state.profile ? `${state.profile.name} (${state.profile.age}), ${state.profile.city}` : '—');
    add('Email', state.profile ? state.profile.email : '—');
    if (state.party) {
      add('Party', `${state.party.name} — ${state.party.ideology}`);
      add('Slogan', state.party.slogan || '—');
    }
    add('Policies', state.policies && state.policies.length ? state.policies.join(', ') : '—');
    if (state.budget) {
      add('Budget', Object.entries(state.budget).map(([k,v])=>`${k}: ${v}%`).join(' · '));
    }
  }

  qs('#launchGameButton') && qs('#launchGameButton').addEventListener('click', ()=> {
    // go to gameplay
    showScreen('gameplayScreen');
    const state = loadState();
    qs('#gameplayData').textContent = JSON.stringify(state, null, 2);
  });

  // end government
  qs('#endGameButton') && qs('#endGameButton').addEventListener('click', ()=> {
    if (confirm('End this government and clear saved data?')) {
      localStorage.removeItem(KEY);
      alert('Data cleared. Returning to main menu.');
      showScreen('mainMenuScreen');
    }
  });

  // load game button: if saved state exists, go to review
  qs('#loadGameButton') && qs('#loadGameButton').addEventListener('click', ()=> {
    const s = loadState();
    if (!s || Object.keys(s).length===0) { alert('No saved game found. Start a new game.'); return; }
    renderReview();
    showScreen('reviewScreen');
  });

  // when page loads, if state exists maybe show main (default)
  document.addEventListener('DOMContentLoaded', ()=> {
    // nothing to auto-start
  });
})();
