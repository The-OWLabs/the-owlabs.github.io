/* OWLabs — pixel owl, flight between perches, and the little interactions.
   You shouldn't need to touch this file to add work: edit projects.js instead. */
(function () {
  'use strict';

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var pad = function (n) { return String(n).padStart(2, '0'); };

  /* ───────────── Pixel sprites ───────────── */

  // The OWLabs logo, pixel for pixel (14 × 16).
  // d ear · p body · c eye · k pupil · a beak/feet · l belly
  var OWL = [
    '.d..........d.',
    '.dd........dd.',
    '.dppppppppppd.',
    'pppppppppppppp',
    'pccccppppccccp',
    'ccccccppcccccc',
    'cckkccppcckkcc',
    'cckkccaacckkcc',
    'ccccccaacccccc',
    'pccccppppccccp',
    'pppllllllllppp',
    'ppllpllllpllpp',
    'ppllllllllllpp',
    '.ppllpllpllpp.',
    '..pppppppppp..',
    '...aa....aa...'
  ];

  // Left-wing cells as [logo row, logo col]; mirrored for the right wing.
  var WINGS = {
    up: [[5,-3],[6,-3],[6,-2],[7,-3],[7,-2],[7,-1],[8,-3],[8,-2],[8,-1],[8,0],[9,-2],[9,-1],[9,0],[9,1],[10,-1],[10,0],[10,1],[10,2],[11,0],[11,1],[11,2],[12,1],[12,2],[13,2]],
    mid: [[10,-1],[10,0],[10,1],[10,2],[11,-3],[11,-2],[11,-1],[11,0],[11,1],[11,2],[12,-3],[12,-2],[12,-1],[12,0],[12,1],[12,2],[13,-2],[13,0],[13,1],[13,2]],
    down: [[11,2],[12,1],[12,2],[13,0],[13,1],[13,2],[14,-1],[14,0],[14,1],[14,2],[15,-2],[15,-1],[15,0],[15,1],[16,-3],[16,-2],[16,-1],[17,-3]]
  };
  var FLAP = ['up', 'mid', 'down', 'mid'];

  var PALETTES = {
    v: { d: '#4A3AC4', p: '#6D5CE7', c: '#F6EFE0', k: '#16142B', a: '#FFB124', l: '#B8ADFF' }, // Vineet / logo
    c: { d: '#2B6FA6', p: '#4C97D9', c: '#F6EFE0', k: '#16142B', a: '#FFB124', l: '#A9D6F7' }  // Chirag
  };

  var ICON_PAL = { o: '#F6EFE0', a: '#FFB124', p: '#6D5CE7', d: '#4A3AC4', l: '#B8ADFF', k: '#16142B' };
  var ICONS = {
    bulb:     ['..oooo..', '.oaaaao.', 'oaaaaaao', 'oaaaaaao', '.oaaaao.', '..oaao..', '..llll..', '...ll...'],
    gear:     ['...pp...', '.p.pp.p.', '..pppp..', 'pppkkppp', 'pppkkppp', '..pppp..', '.p.pp.p.', '...pp...'],
    rocket:   ['...oo...', '..oooo..', '..okko..', '..oooo..', '.doooood', 'dd.oo.dd', '..aaaa..', '...aa...'],
    question: ['..aaaa..', '.aa..aa.', '.....aa.', '....aa..', '...aa...', '...aa...', '........', '...aa...']
  };
  var MOON = ['...cccc...', '.cccccccc.', '.cmmccccc.', 'ccmmcccccc', 'cccccccmcc', 'cccccccccc', 'ccccmccccc', '.ccccccmc.', '.cccccccc.', '...cccc...'];
  var CLOUD = ['....fff.....', '..fffffff...', '.fffffffffff', 'ffffffffffff', '.ffffffffff.'];

  // Turn a character grid into one <path> per color (horizontal runs merged).
  function paths(grid, pal) {
    var runs = {}, order = [];
    for (var y = 0; y < grid.length; y++) {
      var row = grid[y], x = 0;
      while (x < row.length) {
        var ch = row[x];
        if (!pal[ch]) { x++; continue; }
        var n = 1;
        while (x + n < row.length && row[x + n] === ch) n++;
        if (!runs[ch]) { runs[ch] = []; order.push(ch); }
        runs[ch].push('M' + x + ' ' + y + 'h' + n + 'v1h-' + n + 'z');
        x += n;
      }
    }
    return order.map(function (ch) { return '<path fill="' + pal[ch] + '" d="' + runs[ch].join('') + '"/>'; }).join('');
  }
  function sprite(rows, pal) { return paths(rows.map(function (r) { return r.split(''); }), pal); }

  // opts: { pal, feet, wing: 'up'|'mid'|'down'|null, blink, gx, gy }  (gx/gy = gaze −1…1)
  function owl(opts) {
    var W = 26, H = 16, g = [], y, i;
    for (y = 0; y < H; y++) g.push(new Array(W).fill('.'));
    OWL.forEach(function (row, r) {
      for (i = 0; i < row.length; i++) if (row[i] !== '.') g[r][i + 6] = row[i] === 'k' ? 'c' : row[i];
    });
    if (!opts.feet) for (i = 0; i < W; i++) if (g[15][i] === 'a') g[15][i] = '.';
    if (opts.blink) {
      [1, 2, 3, 4, 9, 10, 11, 12].forEach(function (c) { g[7][c + 6] = 'k'; });
    } else {
      var gx = opts.gx || 0, gy = opts.gy || 0;
      [2, 3, 10, 11].forEach(function (c) { g[6 + gy][c + gx + 6] = 'k'; g[7 + gy][c + gx + 6] = 'k'; });
    }
    (WINGS[opts.wing] || []).forEach(function (cell) {
      var yy = cell[0] - 2;
      if (yy >= 0 && yy < H) { g[yy][cell[1] + 3] = 'd'; g[yy][22 - cell[1]] = 'd'; }
    });
    return paths(g, PALETTES[opts.pal || 'v']);
  }

  /* ───────────── Owl registry & animation state ───────────── */

  var anim = { frame: 0, blink: false, hoot: false, wave: -1, flying: false, dir: 1 };
  var gaze = {};            // key → {x, y}
  var gazeTargets = [];     // [{key, el}]
  var owls = [];            // [{el, opts(), key}]

  function addOwl(el, optsFn, gazeKey) {
    if (!el) return;
    owls.push({ el: el, opts: optsFn, key: '' });
    if (gazeKey) { gaze[gazeKey] = { x: 0, y: 0 }; gazeTargets.push({ key: gazeKey, el: el }); }
  }
  function paintOwls() {
    owls.forEach(function (o) {
      var opts = o.opts(), k = JSON.stringify(opts);
      if (k !== o.key) { o.key = k; o.el.innerHTML = owl(opts); }
    });
  }
  function flap() { return FLAP[anim.frame]; }

  var ticker = null;
  function startFlapping() {
    if (ticker) return;
    ticker = setInterval(function () {
      if (!(anim.flying || anim.hoot || anim.wave >= 0)) {
        clearInterval(ticker); ticker = null; anim.frame = 0; paintOwls(); return;
      }
      anim.frame = (anim.frame + 1) % 4;
      paintOwls();
    }, 110);
  }

  setInterval(function () {
    anim.blink = true; paintOwls();
    setTimeout(function () { anim.blink = false; paintOwls(); }, 150);
  }, 3900);

  var mx = 0, my = 0, raf = 0;
  document.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var changed = false;
      gazeTargets.forEach(function (t) {
        var r = t.el.getBoundingClientRect();
        var dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2), th = Math.max(24, r.width * 0.22);
        var nx = dx > th ? 1 : dx < -th ? -1 : 0, ny = dy > th ? 1 : dy < -th ? -1 : 0;
        if (nx !== gaze[t.key].x || ny !== gaze[t.key].y) { gaze[t.key] = { x: nx, y: ny }; changed = true; }
      });
      if (changed) paintOwls();
    });
  }, { passive: true });

  /* ───────────── Static owls & decor ───────────── */

  var moon = $('#moon');
  if (moon) moon.innerHTML = sprite(MOON, { c: '#F6EFE0', m: '#D9CFB4' });
  $$('.cloud').forEach(function (c) { c.innerHTML = sprite(CLOUD, { f: '#26254D' }); });

  addOwl($('#nav-owl'), function () { return { feet: true, blink: anim.blink, gx: gaze.nav.x, gy: gaze.nav.y }; }, 'nav');
  addOwl($('#foot-owl'), function () { return { feet: true }; });
  addOwl($('#hero-owl'), function () {
    return { feet: !anim.hoot, wing: anim.hoot ? flap() : null, blink: anim.blink && !anim.hoot, gx: gaze.hero.x, gy: gaze.hero.y };
  }, 'hero');

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ───────────── Hero owl: click to hoot ───────────── */

  var HOOTS = ['hoo!', 'hoo hoo!', 'real problems only.', 'follow me ↓', 'still building…', 'two of us, one owl.'];
  var hootI = 0, hootT = 0, bubbleT = 0;
  var bubble = $('#bubble');
  var heroBtn = $('#hero-owl-btn');
  if (heroBtn && bubble) heroBtn.addEventListener('click', function () {
    bubble.textContent = HOOTS[hootI++ % HOOTS.length];
    bubble.hidden = false;
    bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
    anim.hoot = true; startFlapping(); paintOwls();
    clearTimeout(hootT); clearTimeout(bubbleT);
    hootT = setTimeout(function () { anim.hoot = false; paintOwls(); }, 1200);
    bubbleT = setTimeout(function () { bubble.hidden = true; }, 2600);
  });

  /* ───────────── The flight between perches ───────────── */

  var CTA = {
    cta: true,
    title: 'Your problem next?',
    problem: 'Something in your day that should just work? Find us on GitHub and tell us about it.',
    tags: [],
    link: 'https://github.com/The-OWLabs',
    linkLabel: 'Find us on GitHub',
    icon: 'question'
  };
  var perches = (Array.isArray(window.OWLABS_PROJECTS) ? window.OWLABS_PROJECTS : []).concat([CTA]);

  var stage = $('#stage'), track = $('#track'), flyer = $('#flyer'), flyerInner = $('#flyer-inner');
  var dotsEl = $('#dots'), counter = $('#counter'), tourBtn = $('#tour');
  var cards = [], dots = [];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function svgEl(vb, w, h) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', vb); s.setAttribute('width', w); s.setAttribute('height', h);
    s.setAttribute('shape-rendering', 'crispEdges'); s.setAttribute('aria-hidden', 'true');
    return s;
  }

  perches.forEach(function (p, i) {
    var card = el('article', 'card');
    card.setAttribute('aria-label', 'Perch ' + pad(i + 1) + ': ' + p.title);

    var top = el('div', 'card-top');
    var icon = el('span', 'card-icon');
    var isvg = svgEl('0 0 8 8', 40, 40);
    isvg.innerHTML = sprite(ICONS[p.icon] || ICONS.bulb, ICON_PAL);
    icon.appendChild(isvg);
    var meta = el('div', 'card-meta');
    meta.appendChild(el('span', 'perch-no', 'PERCH ' + pad(i + 1)));
    meta.appendChild(el('span', 'status' + (p.cta ? ' status--cta' : p.link ? ' status--live' : ''),
      p.cta ? 'next perch' : p.link ? 'live' : 'in the works'));
    top.appendChild(icon); top.appendChild(meta);
    card.appendChild(top);

    card.appendChild(el('h3', null, p.title || 'Untitled'));
    card.appendChild(el('p', null, p.problem || ''));

    if (p.tags && p.tags.length) {
      var tags = el('div', 'tags');
      p.tags.forEach(function (t) { tags.appendChild(el('span', 'tag', t)); });
      card.appendChild(tags);
    }

    var foot = el('div', 'card-foot');
    if (p.link) {
      var a = el('a', 'btn btn--sm', (p.linkLabel || 'View project') + ' →');
      a.href = p.link; a.target = '_blank'; a.rel = 'noopener';
      foot.appendChild(a);
    } else {
      foot.appendChild(el('span', 'soon', 'link lands with the project'));
    }
    card.appendChild(foot);

    var hit = el('button', 'card-hit');
    hit.type = 'button';
    hit.setAttribute('aria-label', 'Fly the owl to perch ' + pad(i + 1) + ': ' + (p.title || ''));
    hit.addEventListener('click', function () { flyTo(i, false); });
    card.appendChild(hit);

    track.appendChild(card);
    cards.push(card);

    var dot = el('button', 'dot');
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Perch ' + pad(i + 1) + ': ' + (p.title || ''));
    dot.appendChild(el('span'));
    dot.addEventListener('click', function () { flyTo(i, false); });
    dotsEl.appendChild(dot);
    dots.push(dot);
  });

  var cur = 0, landed = 0, hopN = 0, landN = 0, landT = 0, tourT = 0;
  var tourOn = !reduceMotion;

  addOwl($('#fly-owl'), function () {
    return {
      feet: !anim.flying,
      wing: anim.flying ? flap() : null,
      blink: anim.blink && !anim.flying,
      gx: anim.flying ? anim.dir : 0,
      gy: anim.flying ? 0 : 1          // perched: looking down at the project
    };
  });

  function metrics() {
    var w = stage.clientWidth || 1200;
    var cardW = Math.max(260, Math.min(340, w - 64));
    var gap = w < 640 ? 36 : 72;
    return { cardW: cardW, gap: gap, step: cardW + gap };
  }

  function layout(ms) {
    var m = metrics();
    cards.forEach(function (c) { c.style.width = m.cardW + 'px'; });
    track.style.gap = m.gap + 'px';
    track.style.transitionDuration = (ms ? ms + 150 : 0) + 'ms';
    track.style.transitionDelay = (ms ? 120 : 0) + 'ms';
    track.style.transform = 'translateX(' + (-(cur * m.step + m.cardW / 2)) + 'px)';
    flyer.style.transitionDuration = (ms || 0) + 'ms';
    flyer.style.left = (cur * m.step + m.cardW / 2 - 78) + 'px';
  }

  function updateUi() {
    cards.forEach(function (c, i) { c.classList.toggle('is-active', i === landed); });
    dots.forEach(function (d, i) { d.setAttribute('aria-current', i === cur ? 'true' : 'false'); });
    counter.textContent = 'Perch ' + pad(cur + 1) + ' of ' + pad(perches.length) + ' · ' + perches[cur].title;
    tourBtn.textContent = tourOn ? 'Pause tour' : 'Auto tour';
    tourBtn.setAttribute('aria-pressed', tourOn ? 'true' : 'false');
  }

  function stopTour() { if (tourOn) { tourOn = false; clearTimeout(tourT); updateUi(); } }

  function scheduleTour(ms) {
    clearTimeout(tourT);
    if (!tourOn) return;
    tourT = setTimeout(function () {
      if (!tourOn) return;
      if (anim.flying) { scheduleTour(800); return; }
      flyTo(cur + 1, true);
    }, ms);
  }

  function flyTo(target, fromTour) {
    var n = perches.length;
    var j = ((target % n) + n) % n;
    if (!fromTour) stopTour();
    if (j === cur) return;

    var ms = reduceMotion ? 0 : Math.min(2300, 700 + Math.abs(j - cur) * 380);
    anim.dir = j > cur ? 1 : -1;
    cur = j;

    clearTimeout(landT);
    if (ms) {
      anim.flying = true;
      hopN++;
      flyerInner.className = hopN % 2 ? 'hop-a' : 'hop-b';
      flyerInner.style.animationDuration = ms + 'ms';
      startFlapping();
    }
    layout(ms);
    updateUi();
    paintOwls();

    landT = setTimeout(function () {
      anim.flying = false;
      landed = cur;
      landN++;
      flyerInner.style.animationDuration = '';
      flyerInner.className = landN % 2 ? 'land-a' : 'land-b';
      updateUi();
      paintOwls();
      if (fromTour) scheduleTour(5200);
    }, ms + 60);
  }

  $('#prev').addEventListener('click', function () { flyTo(cur - 1, false); });
  $('#next').addEventListener('click', function () { flyTo(cur + 1, false); });
  tourBtn.addEventListener('click', function () {
    tourOn = !tourOn;
    updateUi();
    if (tourOn) scheduleTour(900); else clearTimeout(tourT);
  });

  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); flyTo(cur + 1, false); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); flyTo(cur - 1, false); }
  });

  var touchX = null;
  stage.addEventListener('touchstart', function (e) { touchX = e.touches[0] ? e.touches[0].clientX : null; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (touchX == null || !e.changedTouches[0]) return;
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 40) flyTo(cur + (dx < 0 ? 1 : -1), false);
  });

  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(function () { layout(0); }).observe(stage);
  else window.addEventListener('resize', function () { layout(0); });

  /* ───────────── Team owls: hover to wave ───────────── */

  $$('.member').forEach(function (card) {
    var i = Number(card.getAttribute('data-member'));
    var svg = $('.owl', card);
    var key = 'member' + i;
    addOwl(svg, function () {
      var waving = anim.wave === i;
      return { pal: i === 1 ? 'c' : 'v', feet: !waving, wing: waving ? flap() : null, blink: anim.blink && !waving, gx: gaze[key].x, gy: gaze[key].y };
    }, key);
    var wave = function () { anim.wave = i; startFlapping(); paintOwls(); };
    var stop = function () { if (anim.wave === i) { anim.wave = -1; paintOwls(); } };
    card.addEventListener('mouseenter', wave);
    card.addEventListener('mouseleave', stop);
    $('.member-owl', card).addEventListener('click', function () { if (anim.wave === i) stop(); else wave(); });
  });

  /* ───────────── Go ───────────── */

  layout(0);
  updateUi();
  paintOwls();
  scheduleTour(4200);
})();
