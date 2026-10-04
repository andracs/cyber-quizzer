'use strict';
// QUIZ indsættes af build.js
const Q = QUIZ.spoergsmaal;
const roundName = Object.fromEntries(QUIZ.runder.map((r) => [r.id, r.navn]));
const LETTERS = ['A', 'B', 'C', 'D'];
const app = document.getElementById('app');
const bar = document.querySelector('.progress span');
const fmt = (n, q) => (q && q.aar ? String(n) : Number(n).toLocaleString('da-DK'));

// pos: -1 er forsiden, 0..n-1 er spørgsmål, n er resultatet
const state = { pos: -1, answers: Q.map(() => null), orders: {} };
let keyHandler = null;
let current = null;

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

// *kursiv* bliver til <em>
function rich(el, text) {
  String(text).split(/(\*[^*]+\*)/g).forEach((part) => {
    if (/^\*[^*]+\*$/.test(part)) el.append(h('em', { text: part.slice(1, -1) }));
    else if (part) el.append(part);
  });
  return el;
}

function show(...kids) {
  app.replaceChildren(...kids);
  window.scrollTo(0, 0);
}

// ------------------------------------------------------------ Navigation

function go(p) {
  p = Math.max(-1, Math.min(Q.length, p));
  state.pos = p;
  current = null;
  if (p === -1) intro();
  else if (p === Q.length) finish();
  else question(p);
  bar.style.width = (p < 0 ? 0 : p >= Q.length ? 100 : (100 * (p + 1)) / Q.length) + '%';
}

function restart() {
  state.answers = Q.map(() => null);
  state.orders = {};
  go(0);
}

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = e.target.tagName;
  if (tag === 'INPUT') {
    if (e.key === 'Enter' && keyHandler) keyHandler(e);
    return; // piletaster styrer slideren
  }
  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    e.preventDefault();
    if (state.pos < Q.length) go(state.pos + 1);
    return;
  }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    if (state.pos > -1) go(state.pos - 1);
    return;
  }
  if (tag === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return; // knappen klarer det selv
  if (keyHandler) keyHandler(e);
});

// ------------------------------------------------------------ Forside

function intro() {
  keyHandler = (e) => { if (e.key === 'Enter') { e.preventDefault(); go(0); } };
  const answered = state.answers.filter(Boolean).length;
  show(h('section', { class: 'intro' },
    h('p', { class: 'face', text: ':)', 'aria-hidden': 'true' }),
    h('h1', { text: QUIZ.titel }),
    h('p', { class: 'lede', text: `${QUIZ.undertitel}. ${Q.length} spørgsmål med forklaring efter hvert svar.` }),
    h('div', { class: 'actions' },
      h('button', { class: 'btn', type: 'button', text: answered ? 'Fortsæt' : 'Start quizzen', onclick: () => go(0) }),
      h('span', { class: 'hint', text: 'A til D vælger svar. Piletasterne bladrer frem og tilbage.' }))));
  app.querySelector('.btn').focus();
}

// ------------------------------------------------------------ Spørgsmål

function question(i) {
  const q = Q[i];
  const title = h('h1', { class: q.tekst.length > 150 ? 'long' : '' });
  rich(title, q.tekst);
  const body = h('div', {});
  show(
    h('div', { class: 'meta' },
      h('span', { class: 'nav' },
        h('button', { class: 'navbtn', type: 'button', 'aria-label': 'Forrige', text: '‹', onclick: () => go(i - 1) }),
        h('span', { class: 'pos-label', text: `${i + 1} af ${Q.length}` }),
        h('button', { class: 'navbtn', type: 'button', 'aria-label': 'Næste', text: '›', onclick: () => go(i + 1) })),
      h('span', { text: roundName[q.runde] })),
    title,
    body);
  const ui = TYPES[q.type](q, body, i);
  current = { i, ui };
  const saved = state.answers[i];
  if (saved) {
    ui.apply(saved.data);
    feedback(i, false);
  } else {
    keyHandler = ui.keys;
  }
}

// Kaldes når brugeren svarer
function answer(i, data) {
  if (!current || current.i !== i || state.answers[i]) return;
  const res = current.ui.apply(data);
  state.answers[i] = { ok: res.ok, detail: res.detail, data };
  feedback(i, true);
}

function feedback(i, fresh) {
  const q = Q[i];
  const a = state.answers[i];
  const last = i === Q.length - 1;
  const next = h('button', { class: 'btn', type: 'button', text: last ? 'Se resultatet' : 'Næste spørgsmål', onclick: () => go(i + 1) });
  const verdict = q.type === 'estimat' ? (a.ok ? 'Tæt nok på.' : 'Ikke tæt nok på.') : (a.ok ? 'Rigtigt.' : 'Ikke helt.');
  app.append(h('section', { class: 'feedback' + (fresh ? '' : ' still') },
    h('p', { class: 'verdict ' + (a.ok ? 'right' : 'wrong') }, verdict, a.detail ? h('span', { class: 'detail', text: ' ' + a.detail }) : null),
    rich(h('p', { class: 'explain' }), q.forklaring),
    h('div', { class: 'actions' }, next)));
  if (fresh) next.focus({ preventScroll: true });
  keyHandler = (e) => { if (e.key === 'Enter') { e.preventDefault(); go(i + 1); } };
}

function optionButton(key, text, onclick) {
  return h('button', { class: 'option', type: 'button', onclick },
    h('span', { class: 'key', text: key }),
    h('span', { class: 'text', text }),
    h('span', { class: 'mark' }));
}

function markOptions(buttons, rightIdx, chosenIdx) {
  buttons.forEach((b, k) => {
    b.disabled = true;
    if (k === rightIdx) {
      b.classList.add('is-right');
      b.querySelector('.mark').textContent = 'Rigtigt svar';
    } else if (k === chosenIdx) {
      b.classList.add('is-wrong');
      b.querySelector('.mark').textContent = 'Dit svar';
    } else {
      b.classList.add('is-muted');
    }
  });
}

const TYPES = {
  mc(q, body, i) {
    const buttons = q.svar.map((s, k) => optionButton(LETTERS[k], s, () => answer(i, k)));
    body.append(h('ul', { class: 'options' }, buttons.map((b) => h('li', {}, b))));
    return {
      apply(k) {
        markOptions(buttons, q.rigtigt, k);
        return { ok: k === q.rigtigt };
      },
      keys(e) {
        const k = LETTERS.indexOf(e.key.toUpperCase());
        const n = Number(e.key) - 1;
        if (k >= 0 && k < q.svar.length) answer(i, k);
        else if (n >= 0 && n < q.svar.length) answer(i, n);
      },
    };
  },

  sandtfalsk(q, body, i) {
    const buttons = ['Sandt', 'Falsk'].map((t, k) => optionButton(t[0], t, () => answer(i, k)));
    body.append(h('ul', { class: 'options tf' }, buttons.map((b) => h('li', {}, b))));
    return {
      apply(k) {
        markOptions(buttons, q.rigtigt ? 0 : 1, k);
        return { ok: (k === 0) === q.rigtigt };
      },
      keys(e) {
        const c = e.key.toUpperCase();
        if (c === 'S' || c === '1') answer(i, 0);
        if (c === 'F' || c === '2') answer(i, 1);
      },
    };
  },

  raekkefoelge(q, body, i) {
    // Samme blanding hver gang man kommer tilbage, men aldrig allerede rigtig
    if (!state.orders[i]) {
      let order;
      do {
        order = q.elementer.map((_, k) => k).sort(() => Math.random() - 0.5);
      } while (order.every((v, k) => v === k));
      state.orders[i] = order;
    }
    const order = state.orders[i];
    const picked = [];
    const list = h('ul', { class: 'options order' });
    const check = h('button', { class: 'btn', type: 'button', text: 'Tjek rækkefølgen', disabled: true, onclick: () => answer(i, picked.slice()) });
    const reset = h('button', { class: 'link', type: 'button', text: 'Start forfra', onclick: () => { picked.length = 0; draw(); } });
    const hint = h('p', { class: 'hint', text: 'Tryk på dem i rækkefølge. Tryk igen for at fortryde.' });
    const actions = h('div', { class: 'actions' }, check, reset);

    function draw() {
      list.replaceChildren(...order.map((id) => {
        const pos = picked.indexOf(id);
        return h('li', {}, h('button', {
          class: 'option' + (pos >= 0 ? ' placed' : ''),
          type: 'button',
          'aria-pressed': String(pos >= 0),
          onclick: () => {
            if (pos >= 0) picked.splice(pos);
            else picked.push(id);
            draw();
          },
        }, h('span', { class: 'pos', text: pos >= 0 ? pos + 1 : '' }), h('span', { class: 'text', text: q.elementer[id] }), h('span', { class: 'mark' })));
      }));
      check.disabled = picked.length !== order.length;
    }
    draw();
    body.append(hint, list, actions);

    return {
      apply(sel) {
        const k = sel.filter((id, pos) => id === pos).length;
        list.replaceChildren(...q.elementer.map((t, pos) => {
          const ok = sel[pos] === pos;
          return h('li', {}, h('div', { class: 'option ' + (ok ? 'is-right' : 'is-wrong') },
            h('span', { class: 'key', text: pos + 1 }),
            h('span', { class: 'text', text: t }),
            h('span', { class: 'mark', text: ok ? 'På plads' : `Du havde ${q.elementer[sel[pos]]}` })));
        }));
        hint.remove();
        actions.remove();
        const all = k === sel.length;
        return { ok: all, detail: all ? null : `${k} af ${sel.length} på plads.` };
      },
      keys(e) {
        if (e.key === 'Enter' && !check.disabled) {
          e.preventDefault();
          answer(i, picked.slice());
        }
      },
    };
  },

  estimat(q, body, i) {
    const step = q.trin || 1;
    let val = q.start ?? Math.round((q.min + q.max) / 2);
    const num = h('span');
    const range = h('input', { type: 'range', min: q.min, max: q.max, step, 'aria-label': 'Dit gæt' });
    const set = (x) => {
      val = Math.min(q.max, Math.max(q.min, Math.round(x / step) * step));
      range.value = val;
      num.textContent = fmt(val, q);
    };
    range.addEventListener('input', () => set(Number(range.value)));
    set(val);
    const actions = h('div', { class: 'actions' },
      h('button', { class: 'btn small', type: 'button', 'aria-label': 'Mindre', text: '-', onclick: () => set(val - step) }),
      h('button', { class: 'btn small', type: 'button', 'aria-label': 'Større', text: '+', onclick: () => set(val + step) }),
      h('button', { class: 'btn', type: 'button', text: 'Tjek mit gæt', onclick: () => answer(i, val) }));
    body.append(h('div', { class: 'estimate' },
      h('output', {}, num, h('small', { text: q.enhed || '' })),
      range,
      h('div', { class: 'ends' }, h('span', { text: fmt(q.min, q) }), h('span', { text: fmt(q.max, q) })),
      actions));
    return {
      apply(v) {
        set(v);
        range.disabled = true;
        actions.remove();
        const diff = Math.abs(v - q.rigtigt);
        const err = diff / Math.max(1, Math.abs(q.rigtigt));
        const pct = Math.round(err * 100);
        const ok = q.tolerance != null ? diff <= q.tolerance : err <= 0.15;
        const miss = q.tolerance != null ? (diff === 0 ? 'helt præcist' : `${fmt(diff, q)} ${q.aar ? 'år' : q.enhed || ''} ved siden af`.replace(/ +/g, ' ').trim()) : (pct === 0 ? 'helt præcist' : pct + ' % ved siden af');
        return {
          ok,
          detail: `Rigtigt svar: ${fmt(q.rigtigt, q)} ${q.enhed || ''}. Du gættede ${fmt(v, q)}, ${miss}.`.replace(/ +\./g, '.'),
        };
      },
      keys(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          answer(i, val);
        }
      },
    };
  },
};

// ------------------------------------------------------------ Resultat

function finish() {
  const right = state.answers.filter((a) => a && a.ok).length;
  const skipped = state.answers.filter((a) => !a).length;
  const share = right / Q.length;
  keyHandler = (e) => { if (e.key === 'Enter') { e.preventDefault(); restart(); } };
  let lede = right === Q.length ? 'Alle rigtige. Systemet er hærdet.' : 'Klik på et spørgsmål for at se det igen.';
  if (skipped) lede = `${skipped} spørgsmål er ikke besvaret. ${lede}`;
  show(h('section', { class: 'intro' },
    h('p', { class: 'face', text: share >= 0.8 ? ':D' : share >= 0.5 ? ':)' : ':|', 'aria-hidden': 'true' }),
    h('p', { class: 'score', text: `${right} af ${Q.length} rigtige` }),
    h('p', { class: 'lede', text: lede }),
    h('ol', { class: 'review' }, Q.map((q, k) => {
      const a = state.answers[k];
      const [cls, label] = !a ? ['skip', 'Ikke besvaret'] : a.ok ? ['ok', 'Rigtigt'] : ['miss', 'Forkert'];
      return h('li', {}, h('button', { type: 'button', onclick: () => go(k) },
        h('span', { class: 'n', text: k + 1 }),
        h('span', { class: 't', text: q.titel }),
        h('span', { class: 'r ' + cls, text: label })));
    })),
    h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', text: 'Tag quizzen igen', onclick: restart }))));
}

go(-1);
