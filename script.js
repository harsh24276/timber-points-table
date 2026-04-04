let totals = [];
let round = 1;
let playerNames = [];
let numPlayers = 3;
let eliminated = [];
let scoreHistory = [];
let currentGameId = null;
let halvedMsgs = {};

const eliminateSound = new Audio('faahh.mp3');
const winnerSound = new Audio('cheer.mp3'); 

function showToast(message, type) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function triggerCrazyCelebration() {
  var duration = 3 * 1000;
  var animationEnd = Date.now() + duration;
  var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  function randomInRange(min, max) { return Math.random() * (max - min) + min; }

  var interval = setInterval(function() {
    var timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) { return clearInterval(interval); }
    var particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
}

function saveGameState() {
  let history = JSON.parse(localStorage.getItem('timberGameHistoryList')) || [];
  if (!currentGameId) { currentGameId = new Date().getTime(); }
  const gameState = { id: currentGameId, date: new Date().toLocaleString(), totals, round, playerNames, numPlayers, eliminated, scoreHistory, halvedMsgs };
  const existingIndex = history.findIndex(g => g.id === currentGameId);
  if (existingIndex !== -1) { history[existingIndex] = gameState; } else { history.push(gameState); }
  localStorage.setItem('timberGameHistoryList', JSON.stringify(history));
}

function createPlayerInputs() {
  numPlayers = parseInt(document.getElementById('numPlayers').value);
  const div = document.getElementById('playerNamesDiv');
  div.innerHTML = '';
  for (let i = 0; i < numPlayers; i++) {
    const input = document.createElement('input');
    input.placeholder = `Player ${i+1} name`;
    input.id = `p${i}`;
    div.appendChild(input);
  }
}


createPlayerInputs();

function startGame() {
  currentGameId = null; 
  playerNames = [];
  totals = [];
  eliminated = [];
  scoreHistory = [];
  halvedMsgs = {}; 
  round = 1;

  for(let i=0;i<numPlayers;i++){
    let name = document.getElementById(`p${i}`).value.trim();
    if(!name) name = `Player ${i+1}`;
    playerNames.push(name);
    totals.push(0);
    eliminated.push(false);
  }

  document.getElementById('setupArea').style.display = 'none';
  document.getElementById('resetBtn').style.display = 'block';

  saveGameState(); 
  renderRoundInput();
  renderTable();
}

function renderRoundInput(){
  let html = `<hr style="border: 0; height: 1px; background: #ddd; margin: 20px 0;"><h3>Round ${round}</h3>`;
  for(let i=0;i<numPlayers;i++){
    if(eliminated[i]){
      html += `<div style="padding:12px;margin:8px 0;border-radius:8px;border:1px solid #e74c3c;background:#fff5f5;color:#e74c3c;font-weight:700;text-align:center;">💀 ${playerNames[i]} is Eliminated</div>`;
    } else {
      if(halvedMsgs[i]) {
        html += `<div style="color:#fff;background-color:#3498db;padding:4px 10px;border-radius:6px;font-weight:600;font-size:12px;margin:8px 0 -4px 0;display:inline-block;">${halvedMsgs[i]}</div>`;
      }
      html += `<input type="number" id="s${i}" placeholder="${playerNames[i]}'s score" min="0">`;
    }
  }
  html += `<button onclick="addRound()" style="margin-top: 15px;">Add Round</button>`;
  document.getElementById('gameArea').innerHTML = html;
}

function addRound(){
  const roundScores = [];
  let someoneEliminatedThisRound = false;
  
  halvedMsgs = {}; 

  for(let i=0;i<numPlayers;i++){
    if(eliminated[i]){
      roundScores.push('-');
      continue;
    }

    let val = parseInt(document.getElementById(`s${i}`).value) || 0;
    totals[i] += val;

    if(val > 0 && (totals[i] === 50 || totals[i] === 100)){
      const prevTotal = totals[i];
      totals[i] = Math.floor(totals[i]/2);
      halvedMsgs[i] = `✂️ Score reached ${prevTotal}, halved to ${totals[i]}!`;
    }

    if(totals[i] > 100){
      eliminated[i] = true;
      someoneEliminatedThisRound = true; 
    }
    roundScores.push(val);
  }

  scoreHistory.push(roundScores);

  const remaining = playerNames.filter((_,i)=>!eliminated[i]);
  
  if(remaining.length === 1){
    winnerSound.play().catch(e => console.log("Sound play error:", e));
    triggerCrazyCelebration(); 
    document.getElementById('gameArea').innerHTML = `<div class="winner">🏆 ${remaining[0]} WINS THE GAME! 🏆</div>`;
    renderTable();
    saveGameState();
    return;
  } else if (someoneEliminatedThisRound) {
    eliminateSound.play().catch(e => console.log("Sound play error:", e)); 
  }

  round++;
  saveGameState(); 
  renderRoundInput();
  renderTable();
}

function renderTable(){
  let html = `<div class="table-wrapper"><table><thead><tr>`;
  
  for(let i=0;i<numPlayers;i++){
    html += `<th>${playerNames[i]}</th>`;
  }
  html += `</tr></thead><tbody>`;

  for(let r=0;r<scoreHistory.length;r++){
    html += `<tr>`; 
    for(let i=0;i<numPlayers;i++){
      let val = scoreHistory[r][i];
      html += `<td>${val}</td>`;
    }
    html += `</tr>`;
  }
  
  html += `</tbody><tfoot><tr>`; 
  for(let i=0;i<numPlayers;i++){
    html += `<th>${totals[i]} ${eliminated[i]?'<br><span class="eliminated" style="font-size:11px;">(Eliminated)</span>':''}</th>`;
  }
  html += `</tr></tfoot></table></div>`;

  document.getElementById('gameArea').innerHTML += html;
}

function resetGame(){
  if(confirm("Do you want to exit the current game and go to the main menu? (Progress is saved in History)")) {
    currentGameId = null;
    document.getElementById('gameArea').innerHTML = '';
    document.getElementById('setupArea').style.display = 'block'; 
    document.getElementById('resetBtn').style.display = 'none'; 
  }
}

function openHistoryModal() {
  let history = JSON.parse(localStorage.getItem('timberGameHistoryList')) || [];
  let listDiv = document.getElementById('historyList');
  listDiv.innerHTML = '';

  if (history.length === 0) {
    listDiv.innerHTML = '<p style="color:#666; text-align:center;">No saved games found. Play a game first!</p>';
  } else {
    history.slice().reverse().forEach(game => {
      let div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <div style="font-size: 14px; color: #666; margin-bottom: 5px;">📅 ${game.date}</div>
        <div style="font-weight: 600; color: #333;">👥 ${game.playerNames.join(', ')}</div>
        <div style="font-size: 14px; color: #2e86de; margin-top: 5px;">🔄 Rounds Played: ${game.round - 1}</div>
      `;
      div.onclick = () => loadGameFromHistory(game.id);
      listDiv.appendChild(div);
    });
  }
  document.getElementById('historyModal').style.display = 'block';
}

function closeHistoryModal() {
  document.getElementById('historyModal').style.display = 'none';
}

function loadGameFromHistory(id) {
  let history = JSON.parse(localStorage.getItem('timberGameHistoryList')) || [];
  let game = history.find(g => g.id === id);
  
  if(game) {
    currentGameId = game.id;
    totals = game.totals;
    round = game.round;
    playerNames = game.playerNames;
    numPlayers = game.numPlayers;
    eliminated = game.eliminated;
    scoreHistory = game.scoreHistory;
    halvedMsgs = game.halvedMsgs || {};

    closeHistoryModal(); 
    document.getElementById('setupArea').style.display = 'none';
    document.getElementById('resetBtn').style.display = 'block';

    const remaining = playerNames.filter((_,i)=>!eliminated[i]);
    if(remaining.length === 1){
      triggerCrazyCelebration();
      document.getElementById('gameArea').innerHTML = `<div class="winner">🏆 ${remaining[0]} WINS THE GAME! 🏆</div>`;
      renderTable();
    } else {
      renderRoundInput();
      renderTable();
    }
  }
}

window.onclick = function(event) {
  let modal = document.getElementById('historyModal');
  if (event.target == modal) {
    modal.style.display = "none";
  }
}