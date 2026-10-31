
const ANSWERS = `about above actor adapt admit adult after again agent agree ahead alarm album alert alive allow alone along angle angry apple argue arise armor array aside asset audio avoid awake award aware badly baker basic beach begin being below bench black blame blank blind block blood board brain brand bread break brick brief bring broad brown build burst cabin candy carry catch cause chain chair chalk charm chart chase cheap check chest chief child chose civil claim class clean clear climb clock close cloud coach coast count court cover craft crane crash cream crowd crown curve daily dance depth dream dress drink drive earth eight empty enjoy enter equal error event every exact extra faith false fault field fifth fight final flame flash floor focus force frame fresh front fruit giant glass globe grace grade grain grand grape grass great green group guard guess guest guide happy heart heavy honey horse hotel house human ideal image input jelly joint judge juice knife laugh layer learn light limit lunch magic major march match maybe meant media metal money month moral mouse mouth movie music night noise north novel nurse ocean offer often order other paint panel paper party peace phone photo piano pilot pitch plain plane plant plate point power press price pride prize proof proud queen quick quiet radio raise range rapid reach ready river robot rough round route royal scale scene score sense shape share sharp sheep shelf shift shirt shore short sight skill sleep small smart smile smoke solid sound south space speak speed spend sport staff stage stand start state steam steel stone store storm story sugar sweet table taste teach thank theme thing think three tiger title today tooth topic total touch tower trace track trade train trust truth uncle union unity until upper usual value video visit voice waste watch water wheel where which while white whole woman world worry worth write young youth`
  .split(" ").filter(w => w.length === 5);
const ROWS = 6, COLS = 5;
const REQUIRE_REAL_WORD = false;
let answer, row, col, over, busy;
const $ = id => document.getElementById(id);
const tiles = [];            
const keyEls = {};           
function buildBoard(){
  $("board").innerHTML = "";
  tiles.length = 0;
  for (let r = 0; r < ROWS; r++){
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    tiles.push([]);
    for (let c = 0; c < COLS; c++){
      const t = document.createElement("div");
      t.className = "tile";
      rowEl.appendChild(t);
      tiles[r].push(t);
    }
    $("board").appendChild(rowEl);
  }
}

function buildKeyboard(){
  const layout = ["qwertyuiop", "asdfghjkl", "+zxcvbnm-"]; 
  $("kb").innerHTML = "";
  layout.forEach(keys => {
    const r = document.createElement("div");
    r.className = "krow";
    for (const ch of keys){
      const b = document.createElement("button");
      b.className = "k";
      if (ch === "+"){ b.textContent = "Enter"; b.classList.add("wide"); b.dataset.key = "Enter"; }
      else if (ch === "-"){ b.textContent = "⌫"; b.classList.add("wide"); b.dataset.key = "Backspace"; b.setAttribute("aria-label","Backspace"); }
      else { b.textContent = ch; b.dataset.key = ch; keyEls[ch] = b; }
      b.addEventListener("click", () => handleKey(b.dataset.key));
      r.appendChild(b);
    }
    $("kb").appendChild(r);
  });
}
function evaluate(guess, target){
  const result = Array(COLS).fill("absent");
  const left = {};
  for (let i = 0; i < COLS; i++){
    if (guess[i] === target[i]) result[i] = "correct";
    else left[target[i]] = (left[target[i]] || 0) + 1;
  }
  for (let i = 0; i < COLS; i++){
    if (result[i] !== "correct" && left[guess[i]] > 0){
      result[i] = "present";
      left[guess[i]]--;
    }
  }
  return result;
}
function handleKey(key){
  if (over || busy) return;
  if (key === "Enter") return submit();
  if (key === "Backspace"){
    if (col > 0){
      col--;
      tiles[row][col].textContent = "";
      tiles[row][col].classList.remove("filled");
    }
    return;
  }
  if (/^[a-z]$/i.test(key) && col < COLS){
    const t = tiles[row][col];
    t.textContent = key.toLowerCase();
    t.classList.add("filled");
    col++;
  }
}

function say(text){ $("msg").textContent = text; }

function reject(text){
  say(text);
  const el = tiles[row][0].parentElement;
  el.classList.remove("shake");
  void el.offsetWidth;             
  el.classList.add("shake");
  const b = $("bunny");
  b.classList.remove("oops"); void b.offsetWidth; b.classList.add("oops");
}

function submit(){
  if (col < COLS) return reject("Not enough letters");
  const guess = tiles[row].map(t => t.textContent).join("");
  if (REQUIRE_REAL_WORD && !ANSWERS.includes(guess)) return reject("Not in word list");

  say("");
  const result = evaluate(guess, answer);
  busy = true;
  result.forEach((state, i) => {
    const t = tiles[row][i];
    setTimeout(() => t.classList.add("flip"), i * 300);
    setTimeout(() => t.classList.add(state), i * 300 + 250);
  });

  const thisRow = row;
  setTimeout(() => {
    updateKeyboard(guess, result);
    busy = false;
    if (result.every(s => s === "correct")){
      over = true;
      say(`You got it in ${thisRow + 1} ${thisRow ? "guesses" : "guess"}!`);
      celebrate(thisRow);
    } else if (thisRow === ROWS - 1){
      over = true;
      say(`The word was “${answer}”.`);
      setMood("sad");
    }
    if (over) $("again").style.display = "block";
  }, COLS * 300 + 100);

  row++; col = 0;
}
const rank = { absent: 1, present: 2, correct: 3 };
function updateKeyboard(guess, result){
  for (let i = 0; i < COLS; i++){
    const k = keyEls[guess[i]];
    const current = ["correct","present","absent"].find(s => k.classList.contains(s));
    if (!current || rank[result[i]] > rank[current]){
      k.classList.remove("correct","present","absent");
      k.classList.add(result[i]);
    }
  }
}
function setMood(m){ $("bunny").dataset.mood = m; } 
const STREAK_KEY = "wordle-streak";
const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
function loadStreak(){
  try { return JSON.parse(localStorage.getItem(STREAK_KEY)) || { count: 0, last: null }; }
  catch (e) { return { count: 0, last: null }; }
}
function currentStreak(){
  const s = loadStreak();
  return s.last !== null && today() - s.last <= 1 ? s.count : 0;  
}
function recordWin(){
  const s = loadStreak(), d = today();
  if (s.last === d) return;                                      
  s.count = s.last === d - 1 ? s.count + 1 : 1;
  s.last = d;
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(s)); } catch (e) {}
}
function showStreak(pop){
  const n = currentStreak(), el = $("streak");
  el.textContent = n === 0 ? "♡ start a streak!" : `♡ ${n} day streak`;
  if (pop){ el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
}

const HEART_SVG = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2 0 3.6 1.1 4.4 2.6.8-1.5 2.4-2.6 4.4-2.6 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z"/></svg>';
const HEART_COLORS = ["#ff7aa8", "#ff9dbd", "#f06595", "#ffb3cc"];
function rainHearts(n = 30){
  const box = $("hearts");
  for (let i = 0; i < n; i++){
    const h = document.createElement("span");
    const size = 18 + Math.random() * 26;
    h.className = "heart";
    h.innerHTML = HEART_SVG;
    h.style.cssText =
      `left:${Math.random() * 100}%;width:${size}px;height:${size}px;` +
      `color:${HEART_COLORS[i % HEART_COLORS.length]};--dx:${Math.random() * 90 - 45}px;` +
      `animation-duration:${2.6 + Math.random() * 2}s;animation-delay:${Math.random()}s`;
    box.appendChild(h);
    h.addEventListener("animationend", () => h.remove());
  }
}

function celebrate(winRow){
  setMood("happy");
  tiles[winRow].forEach((t, i) => {         
    t.style.animationDelay = `${i * 100}ms`;
    t.classList.add("bounce");
  });
  recordWin();
  showStreak(true);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) rainHearts();
}
function flashKey(key){
  const k = /^[a-z]$/i.test(key) ? key.toLowerCase() : key;
  const el = document.querySelector(`.k[data-key="${k}"]`);
  if (!el) return;
  el.classList.add("squish");
  setTimeout(() => el.classList.remove("squish"), 120);
}
function newGame(){
  answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
  row = 0; col = 0; over = false; busy = false;
  buildBoard(); buildKeyboard(); say("");
  setMood("curious"); $("hearts").innerHTML = ""; showStreak(false);
  $("again").style.display = "none";
}

document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Enter" && document.activeElement.tagName === "BUTTON") return; 
  flashKey(e.key);
  handleKey(e.key);
});
$("again").addEventListener("click", newGame);
newGame();