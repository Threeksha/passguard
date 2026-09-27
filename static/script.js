// ---------- Elements ----------
const pwInput = document.getElementById('pw');
const toggleBtn = document.getElementById('toggleBtn');
const meterFill = document.getElementById('meterFill');
const scoreLabel = document.getElementById('scoreLabel');
const statusLabel = document.getElementById('statusLabel');
const checksEl = document.getElementById('checks');
const breakdownEl = document.getElementById('breakdown');
const attackGrid = document.getElementById('attackGrid');
const weaknessListEl = document.getElementById('weaknessList');
const explainBtn = document.getElementById('explainBtn');
const explainOutput = document.getElementById('explainOutput');
const privacyMode = document.getElementById('privacyMode');
const whatIfInput = document.getElementById('whatIfInput');
const compareGrid = document.getElementById('compareGrid');
const generateBtn = document.getElementById('generateBtn');
const passphraseOutput = document.getElementById('passphraseOutput');
const gameBox = document.getElementById('gameBox');

let lastAnalysis = null;

// ---------- Data ----------
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password1',
  'letmein', 'welcome', 'monkey', 'dragon', 'iloveyou', '111111',
  '12345678', 'admin', 'login', 'starwars', 'football', 'sunshine'
];

const PASSPHRASE_WORDS = [
  'river', 'copper', 'orbit', 'maple', 'quartz', 'ember', 'falcon', 'harbor',
  'lantern', 'meadow', 'granite', 'willow', 'comet', 'thistle', 'canyon',
  'ripple', 'boulder', 'sparrow', 'tundra', 'velvet', 'ash', 'coral', 'drift',
  'flint', 'grove', 'horizon', 'ivory', 'jasper', 'kettle', 'lumen'
];

const GAME_EXAMPLES = [
  { pw: 'password123', label: 'Weak' },
  { pw: 'Tr0ub4dor&3', label: 'Fair' },
  { pw: 'correcthorsebatterystaple', label: 'Good' },
  { pw: 'X9$mK2#vL8@qP4', label: 'Strong' },
  { pw: 'qwerty', label: 'Weak' },
  { pw: 'MyDog$Name2024!', label: 'Good' },
];
let gameScore = { correct: 0, total: 0 };
let currentGamePw = null;

// ---------- Core analysis ----------
function hasSequential(pw) {
  const seqs = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const lower = pw.toLowerCase();
  for (const seq of seqs) {
    for (let i = 0; i <= seq.length - 3; i++) {
      if (lower.includes(seq.slice(i, i + 3))) return true;
    }
  }
  return false;
}

function hasRepeats(pw) {
  return /(.)\1\1/.test(pw);
}

function poolSize(pw) {
  let size = 0;
  if (/[a-z]/.test(pw)) size += 26;
  if (/[A-Z]/.test(pw)) size += 26;
  if (/[0-9]/.test(pw)) size += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) size += 32;
  return size;
}

function calcEntropy(pw) {
  const size = poolSize(pw);
  if (size === 0 || pw.length === 0) return 0;
  return +(pw.length * Math.log2(size)).toFixed(1);
}

function formatDuration(seconds) {
  if (seconds < 1) return 'instantly';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)}d`;
  const years = seconds / 31536000;
  if (years < 1000) return `${Math.round(years)}y`;
  if (years < 1_000_000) return `${Math.round(years / 1000)}k years`;
  return `${(years / 1_000_000).toFixed(1)}M+ years`;
}

function attackEstimates(pw, isCommon, hasPattern) {
  const entropy = calcEntropy(pw);
  const combinations = Math.pow(2, entropy);

  // Dictionary attack: near-instant if it's a known common password.
  const dictionarySeconds = isCommon ? 0.001 : combinations / 1_000; // dictionary tools try common words fast

  // Brute force: realistic offline attack rate ~10 billion guesses/sec.
  const bruteForceSeconds = combinations / 10_000_000_000;

  // Pattern attack: much faster than brute force if a predictable pattern exists.
  const patternSeconds = hasPattern ? combinations / 1_000_000_000_000 : bruteForceSeconds;

  return {
    dictionary: formatDuration(dictionarySeconds),
    bruteForce: formatDuration(bruteForceSeconds),
    pattern: formatDuration(patternSeconds),
  };
}

function analyze(pw) {
  const checks = [
    { key: 'len12', label: '12+ characters', pass: pw.length >= 12 },
    { key: 'len8', label: '8+ characters', pass: pw.length >= 8 },
    { key: 'upper', label: 'Uppercase letter', pass: /[A-Z]/.test(pw) },
    { key: 'lower', label: 'Lowercase letter', pass: /[a-z]/.test(pw) },
    { key: 'number', label: 'Contains a number', pass: /[0-9]/.test(pw) },
    { key: 'symbol', label: 'Contains a symbol', pass: /[^a-zA-Z0-9]/.test(pw) },
  ];

  const isCommon = COMMON_PASSWORDS.includes(pw.toLowerCase());
  const seq = hasSequential(pw);
  const rep = hasRepeats(pw);

  const weaknesses = [];
  if (pw.length < 8) weaknesses.push('Too short — aim for at least 12 characters.');
  if (!/[A-Z]/.test(pw)) weaknesses.push('No uppercase letters.');
  if (!/[a-z]/.test(pw)) weaknesses.push('No lowercase letters.');
  if (!/[0-9]/.test(pw)) weaknesses.push('No numbers.');
  if (!/[^a-zA-Z0-9]/.test(pw)) weaknesses.push('No symbols — these add the most protection per character.');
  if (seq) weaknesses.push('Contains a predictable sequence (like "abc" or "123").');
  if (rep) weaknesses.push('Contains a repeated character run (like "aaa").');
  if (isCommon) weaknesses.push('This is one of the most commonly used passwords in the world.');

  const passCount = checks.filter(c => c.pass).length;
  let score = Math.round((passCount / checks.length) * 70); // checks = 70% of score
  const entropy = calcEntropy(pw);
  score += Math.min(30, Math.round(entropy / 3)); // entropy = up to 30%
  if (isCommon) score = Math.min(score, 15);
  if (seq || rep) score = Math.max(0, score - 15);
  score = Math.min(100, Math.max(0, pw.length === 0 ? 0 : score));

  let status;
  if (score < 40) status = 'Weak';
  else if (score < 65) status = 'Fair';
  else if (score < 90) status = 'Good';
  else status = 'Strong';

  const breakdown = [
    { label: 'Length', value: Math.min(100, Math.round((pw.length / 16) * 100)) },
    { label: 'Variety', value: Math.round((poolSize(pw) / 94) * 100) },
    { label: 'Unpredictability', value: (seq || rep || isCommon) ? 20 : 90 },
  ];

  const patterns = [];
  if (seq) patterns.push('sequential characters');
  if (rep) patterns.push('repeated characters');
  if (isCommon) patterns.push('common password match');

  return {
    checks, weaknesses, score, status, entropy, breakdown, isCommon,
    hasPattern: seq || rep || isCommon,
    patterns,
    attacks: attackEstimates(pw, isCommon, seq || rep || isCommon),
  };
}

// ---------- Render main analyzer ----------
function render() {
  const pw = pwInput.value;

  if (pw.length === 0) {
    meterFill.style.width = '0%';
    scoreLabel.textContent = '0';
    statusLabel.textContent = '—';
    checksEl.innerHTML = '';
    breakdownEl.innerHTML = '';
    attackGrid.style.display = 'none';
    weaknessListEl.innerHTML = '<p class="empty">Start typing to see feedback.</p>';
    explainBtn.disabled = true;
    lastAnalysis = null;
    return;
  }

  const result = analyze(pw);
  lastAnalysis = result;

  const colorMap = { Weak: 'var(--weak)', Fair: 'var(--fair)', Good: 'var(--good)', Strong: 'var(--strong)' };
  const color = colorMap[result.status];

  meterFill.style.width = result.score + '%';
  meterFill.style.background = color;
  scoreLabel.textContent = result.score;
  statusLabel.textContent = result.status;
  statusLabel.style.color = color;

  breakdownEl.innerHTML = result.breakdown.map(b => `
    <div class="breakdown-row">
      <span class="label">${b.label}</span>
      <div class="breakdown-track"><div class="breakdown-fill" style="width:${b.value}%"></div></div>
    </div>
  `).join('');

  checksEl.innerHTML = result.checks.map(c => `
    <div class="check ${c.pass ? 'pass' : 'fail'}"><span class="dot"></span>${c.label}</div>
  `).join('');

  attackGrid.style.display = 'grid';
  attackGrid.innerHTML = `
    <div class="attack-box"><div class="label">Dictionary</div><div class="value">${result.attacks.dictionary}</div></div>
    <div class="attack-box"><div class="label">Pattern-aware</div><div class="value">${result.attacks.pattern}</div></div>
    <div class="attack-box"><div class="label">Brute force</div><div class="value">${result.attacks.bruteForce}</div></div>
  `;

  if (result.weaknesses.length === 0) {
    weaknessListEl.innerHTML = '<p class="none">No major weaknesses found — this is a strong password.</p>';
  } else {
    weaknessListEl.innerHTML = '<ul>' + result.weaknesses.map(w => `<li>${w}</li>`).join('') + '</ul>';
  }

  explainOutput.textContent = '';
  explainBtn.disabled = privacyMode.checked;
}

toggleBtn.addEventListener('click', () => {
  const isPassword = pwInput.type === 'password';
  pwInput.type = isPassword ? 'text' : 'password';
  toggleBtn.textContent = isPassword ? 'Hide' : 'Show';
});

pwInput.addEventListener('input', render);
privacyMode.addEventListener('change', () => {
  explainBtn.disabled = privacyMode.checked || !lastAnalysis;
  if (privacyMode.checked) explainOutput.textContent = '';
});

// ---------- AI explain ----------
explainBtn.addEventListener('click', async () => {
  if (!lastAnalysis || privacyMode.checked) return;

  explainBtn.disabled = true;
  explainOutput.textContent = 'Asking the AI...';

  const passedChecks = lastAnalysis.checks.filter(c => c.pass).map(c => c.label);
  const failedChecks = lastAnalysis.checks.filter(c => !c.pass).map(c => c.label);

  try {
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: lastAnalysis.score,
        status: lastAnalysis.status,
        entropy: lastAnalysis.entropy,
        passedChecks, failedChecks,
        patternsFound: lastAnalysis.patterns,
      }),
    });
    const data = await res.json();
    explainOutput.textContent = data.explanation || `Couldn't get an explanation (${data.error || 'unknown error'}).`;
  } catch (e) {
    explainOutput.textContent = 'Could not reach the server. Is the Flask app running?';
  } finally {
    explainBtn.disabled = privacyMode.checked;
  }
});

// ---------- What-if simulator ----------
whatIfInput.addEventListener('input', () => {
  if (!pwInput.value || !whatIfInput.value) {
    compareGrid.style.display = 'none';
    return;
  }
  const original = analyze(pwInput.value);
  const improved = analyze(whatIfInput.value);
  compareGrid.style.display = 'grid';
  compareGrid.innerHTML = `
    <div class="compare-box">
      <h3>Original</h3>
      <div class="score" style="color:${scoreColor(original.status)}">${original.score}/100</div>
      <div class="section-hint" style="margin:6px 0 0">${original.status}</div>
    </div>
    <div class="compare-box">
      <h3>Modified</h3>
      <div class="score" style="color:${scoreColor(improved.status)}">${improved.score}/100</div>
      <div class="section-hint" style="margin:6px 0 0">${improved.status}</div>
    </div>
  `;
});

function scoreColor(status) {
  return { Weak: 'var(--weak)', Fair: 'var(--fair)', Good: 'var(--good)', Strong: 'var(--strong)' }[status];
}

// ---------- Passphrase generator ----------
function randomWord() {
  return PASSPHRASE_WORDS[Math.floor(Math.random() * PASSPHRASE_WORDS.length)];
}

generateBtn.addEventListener('click', () => {
  const words = [randomWord(), randomWord(), randomWord()].map(
    w => w.charAt(0).toUpperCase() + w.slice(1)
  );
  const number = Math.floor(10 + Math.random() * 90);
  const symbols = ['!', '#', '$', '%', '&', '*'];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const passphrase = `${words.join('-')}-${number}${symbol}`;
  passphraseOutput.textContent = passphrase;
});

// ---------- Mini game ----------
function newGameRound() {
  currentGamePw = GAME_EXAMPLES[Math.floor(Math.random() * GAME_EXAMPLES.length)];
  gameBox.innerHTML = `
    <div class="game-pw">${currentGamePw.pw}</div>
    <div class="game-options">
      <button data-guess="Weak">Weak</button>
      <button data-guess="Fair">Fair</button>
      <button data-guess="Good">Good</button>
      <button data-guess="Strong">Strong</button>
    </div>
    <div class="game-feedback" id="gameFeedback"></div>
    <div class="game-score">Score: ${gameScore.correct} / ${gameScore.total}</div>
  `;
  gameBox.querySelectorAll('[data-guess]').forEach(btn => {
    btn.addEventListener('click', () => handleGuess(btn.dataset.guess));
  });
}

function handleGuess(guess) {
  gameScore.total++;
  const feedback = document.getElementById('gameFeedback');
  if (guess === currentGamePw.label) {
    gameScore.correct++;
    feedback.textContent = `Correct — that password is ${currentGamePw.label}.`;
  } else {
    feedback.textContent = `Not quite — that password is actually ${currentGamePw.label}.`;
  }
  setTimeout(newGameRound, 1200);
}

// ---------- Init ----------
render();
newGameRound();
