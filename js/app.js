const screen = document.getElementById('screen');
const keys = document.querySelector('.keys');
let buffer = '0';
let justEvaluated = false;
let lastNumeric = null;

const keyMap = {
  Enter: 'EQUALS',
  '=': 'EQUALS',
  Backspace: 'BACK',
  Delete: 'CLEAR',
  c: 'CLEAR',
  C: 'CLEAR',
  '+': '+',
  '-': '-',
  '*': '×',
  x: '×',
  '×': '×',
  '/': '÷',
  '.': '.',
  0: '0',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9'
};

function updateScreen() {
  screen.textContent = buffer;
}

function canInsertDot() {
  const lastNumber = buffer.split(/[-+×÷]/).pop();
  return !lastNumber.includes('.');
}

function appendValue(v) {
  if (justEvaluated && /[0-9.]/.test(v)) {
    buffer = '0';
    justEvaluated = false;
  }
  if (buffer === '0' && /[0-9]/.test(v)) {
    buffer = v;
  } else if (v === '.') {
    if (canInsertDot()) buffer += v;
  } else {
    buffer += v;
  }
}

function appendOperator(op) {
  if (justEvaluated) {
    if (lastNumeric !== null) buffer = formatPlain(lastNumeric);
    justEvaluated = false;
  }
  if (/[-+×÷.]$/.test(buffer)) {
    buffer = buffer.replace(/[-+×÷.]$/, op);
  } else {
    buffer += op;
  }
}

function clearAll() {
  buffer = '0';
  justEvaluated = false;
  lastNumeric = null;
}

function backspace() {
  if (justEvaluated) {
    clearAll();
    return;
  }
  if (buffer.length <= 1) {
    buffer = '0';
    return;
  }
  buffer = buffer.slice(0, -1);
}

function tokenize(expr) {
  const mapped = expr.replace(/×/g, '*').replace(/÷/g, '/');
  const tokens = [];
  let num = '';
  for (const ch of mapped) {
    if ('0123456789.'.includes(ch)) {
      num += ch;
    } else if ('+-*/'.includes(ch)) {
      if (num !== '') {
        tokens.push(parseFloat(num));
        num = '';
      }
      tokens.push(ch);
    } else if (ch === ' ') {
      continue;
    } else {
      throw new Error('Carácter inválido');
    }
  }
  if (num !== '') tokens.push(parseFloat(num));
  return tokens;
}

function toRPN(tokens) {
  const output = [];
  const ops = [];
  const prec = { '+': 1, '-': 1, '*': 2, '/': 2 };
  for (const t of tokens) {
    if (typeof t === 'number') {
      output.push(t);
    } else if (['+', '-', '*', '/'].includes(t)) {
      while (ops.length && prec[ops[ops.length - 1]] >= prec[t]) {
        output.push(ops.pop());
      }
      ops.push(t);
    }
  }
  while (ops.length) output.push(ops.pop());
  return output;
}

function evalRPN(rpn) {
  const st = [];
  for (const t of rpn) {
    if (typeof t === 'number') {
      st.push(t);
    } else {
      if (st.length < 2) throw new Error('Expresión inválida');
      const b = st.pop();
      const a = st.pop();
      let r = 0;
      switch (t) {
        case '+': r = a + b; break;
        case '-': r = a - b; break;
        case '*': r = a * b; break;
        case '/': if (b === 0) throw new Error('División por 0'); r = a / b; break;
      }
      st.push(r);
    }
  }
  if (st.length !== 1) throw new Error('Expresión inválida');
  return st[0];
}

function toFixedTrim(n, dec = 12) {
  let s = n.toFixed(dec);
  s = s.replace(/\.?0+$/, '');
  return s;
}

function formatPlain(n) {
  const rounded = Math.round((n + Number.EPSILON) * 1e12) / 1e12;
  return toFixedTrim(rounded, 12);
}

function formatScientific(n, sig = 12) {
  if (n === 0) return '0';
  const [mRaw, eRaw] = n.toExponential(sig - 1).split('e');
  const m = mRaw.replace(/\.?0+$/, '');
  const e = parseInt(eRaw, 10);
  return m + 'x10^' + e;
}

function formatForDisplay(n) {
  if (!Number.isFinite(n)) return 'Error';
  const abs = Math.abs(n);
  const intDigits = abs === 0 ? 1 : Math.floor(Math.log10(abs)) + 1;
  if (intDigits >= 12 || (abs > 0 && abs < 1e-9)) return formatScientific(n, 12);
  const s = formatPlain(n);
  return s.length > 15 ? formatScientific(n, 12) : s;
}

function equals() {
  try {
    const cleaned = buffer.replace(/[-+×÷.]+$/, '').replace(/^[×÷]+/, '');
    const tokens = tokenize(cleaned);
    const rpn = toRPN(tokens);
    const result = evalRPN(rpn);
    lastNumeric = result;
    buffer = formatForDisplay(result);
    justEvaluated = true;
  } catch {
    buffer = 'Error';
    justEvaluated = true;
  }
}

keys.addEventListener('click', e => {
  const btn = e.target.closest('button.key');
  if (!btn) return;
  const action = btn.dataset.action;
  const val = btn.dataset.value;
  if (action === 'clear') { clearAll(); updateScreen(); return; }
  if (action === 'backspace') { backspace(); updateScreen(); return; }
  if (action === 'equals') { equals(); updateScreen(); return; }
  if (val) {
    if (/[0-9.]/.test(val)) appendValue(val);
    else appendOperator(val);
    updateScreen();
  }
});

document.addEventListener('keydown', ev => {
  const k = ev.key;
  if (k in keyMap) {
    ev.preventDefault();
    const mapped = keyMap[k];
    if (mapped === 'EQUALS') { equals(); updateScreen(); return; }
    if (mapped === 'BACK') { backspace(); updateScreen(); return; }
    if (mapped === 'CLEAR') { clearAll(); updateScreen(); return; }
    if (/[0-9.]/.test(mapped)) { appendValue(mapped); updateScreen(); return; }
    if (['+', '-', '×', '÷'].includes(mapped)) { appendOperator(mapped); updateScreen(); return; }
  }
});

updateScreen();