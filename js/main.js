/* torn paper edges, drawn once from a seed */
document.querySelectorAll('[data-torn]').forEach(p => {
  let s = +p.dataset.torn; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  let d = 'M0 36 L0 ' + (14 + rnd()*10).toFixed(1);
  for (let x = 0; x <= 1000; x += 8 + rnd()*14) d += ` L${x.toFixed(1)} ${(4 + rnd()*26).toFixed(1)}`;
  p.setAttribute('d', d + ' L1000 18 L1000 36 Z');
});

/* fit the name to the width */
(function(){
  const h = document.querySelector('.name'), inner = h.querySelector('.in'), big = document.querySelector('.foot .big');
  function fit(el, inn){ el.style.fontSize = '100px'; const w = el.clientWidth; el.style.fontSize = Math.floor(100 * w / inn.getBoundingClientRect().width * 10) / 10 + 'px'; }
  function place(){
    fit(h, inner);
    const f = h.querySelector('.face'), n = document.getElementById('note');
    n.style.left = (f.offsetLeft + f.offsetWidth * .5) + 'px'; n.style.top = (f.offsetTop + f.offsetHeight + 8) + 'px';
  }
  const fitBig = () => { big.style.fontSize = '100px'; const s = document.createElement('span'); s.textContent = big.textContent; s.style.display = 'inline-block'; big.textContent = ''; big.appendChild(s); big.style.fontSize = Math.floor(100 * big.clientWidth / s.getBoundingClientRect().width * .96) + 'px'; };
  document.fonts.ready.then(() => { place(); fitBig(); }); place(); addEventListener('resize', place);
})();

/* live thing: the selection frame resizes like in a design tool */
(function(){
  const sel = document.getElementById('sel'), grip = document.getElementById('grip'), dim = document.getElementById('dim');
  let start = null, w0 = 0, k = 1;
  const base = () => sel.parentElement.clientWidth * .86;
  function set(v){ k = Math.max(.6, Math.min(1, v)); sel.style.width = (k * 86) + '%'; dim.textContent = Math.round(661 * k) + ' × ' + Math.round(992 * k); grip.setAttribute('aria-valuenow', Math.round(k * 100)); }
  grip.addEventListener('pointerdown', e => { start = e.clientX; w0 = sel.offsetWidth; grip.setPointerCapture(e.pointerId); e.preventDefault(); });
  grip.addEventListener('pointermove', e => { if (start === null) return; set((w0 + (e.clientX - start) * 2) / base()); });
  grip.addEventListener('pointerup', () => start = null);
  grip.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') set(k - .05); if (e.key === 'ArrowRight' || e.key === 'ArrowUp') set(k + .05); });
})();


/* works: taped prints fly through the page as you scroll; the nearest one plays its loop; a click opens it with sound */
const Works = (function(){
  const fly = document.getElementById('fly'), world = document.getElementById('world');
  const all = [...world.querySelectorAll('.print')], tabs = [...document.querySelectorAll('.tab')];
  const fT = document.getElementById('fTitle'), fK = document.getElementById('fKind'), fC = document.getElementById('fCount'), pen = document.getElementById('pen');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPOTS = [[-.2,-.03,-6],[.22,.05,5],[-.25,.07,-3],[.19,-.06,4],[-.08,.03,-5],[.25,0,3]];
  let items = [], flying = false, progress = 0, intro = 0, near = 0;
  const note = document.getElementById('nextNote'), noteName = document.getElementById('nextName'), bgword = document.getElementById('bgword');
  const nextSet = () => { const k = tabs.findIndex(t => t.getAttribute('aria-pressed') === 'true'); return tabs[(k + 1) % tabs.length]; };
  note.addEventListener('click', () => nextSet().click());
  const gap = () => innerWidth < 700 ? 520 : 640;
  const ofWord = () => (typeof I18n !== 'undefined' && I18n.get() === 'en') ? 'of' : 'de';
  function preview(p, on){
    if (on === !!p._on) return; p._on = on;
    if (on && !p._v){ const v = document.createElement('video'); v.className = 'pv'; v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true'); v.poster = p.querySelector('img').src; v.src = p.dataset.prev; p.querySelector('.open').insertBefore(v, p.querySelector('.play')); p._v = v; }
    if (p._v) on ? p._v.play().catch(()=>{}) : p._v.pause();
  }
  function caption(){
    const cur = items[near]; if (!cur) return;
    fT.textContent = cur.querySelector('figcaption b').textContent; fK.textContent = cur.querySelector('figcaption span').textContent;
    fC.textContent = (near + 1) + ' ' + ofWord() + ' ' + items.length;
  }
  function render(){
    const n = items.length, g = gap(), phone = innerWidth < 700;
    const cam = progress * (n - 1) * g - intro;
    let nd = 1e9, ni = 0;
    items.forEach((p, i) => {
      const sp = SPOTS[i % SPOTS.length], z = -i * g + cam;
      const x = sp[0] * innerWidth * (phone ? .3 : 1), y = sp[1] * innerHeight;
      const o = z > 260 ? Math.max(0, 1 - (z - 260) / 240) : z < -3400 ? 0 : z < -2400 ? (z + 3400) / 1000 : 1;
      p.style.transform = `translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotate(${sp[2]}deg)`;
      p.style.opacity = o; p.style.visibility = o < .02 ? 'hidden' : 'visible';
      p.style.pointerEvents = o > .6 && z < 200 ? 'auto' : 'none';
      if (Math.abs(z) < nd){ nd = Math.abs(z); ni = i; }
    });
    const nz = -n * g + cam + g * .55, nx = (phone ? .08 : .2) * innerWidth;
    note.style.transform = `translate(-50%,-50%) translate3d(${nx}px,${innerHeight * .04}px,${nz}px) rotate(4deg)`;
    note.style.opacity = nz < -3400 ? 0 : nz < -2400 ? (nz + 3400) / 1000 : 1;
    note.style.pointerEvents = nz > -900 ? 'auto' : 'none';
    near = ni;
    items.forEach((p, i) => preview(p, !reduce && i === near && nd < 520));
    pen.style.strokeDashoffset = 1 - progress;
    bgword.style.transform = `translate(${(.5 - progress) * 18}vw,-50%)`;
    caption();
  }
  function pick(set, animate){
    tabs.forEach(t => t.setAttribute('aria-pressed', t.dataset.set === set));
    all.forEach(p => { const on = p.dataset.set === set; p.hidden = !on; if (!on) preview(p, false); });
    items = all.filter(p => !p.hidden);
    fly.style.setProperty('--n', items.length);
    noteName.textContent = nextSet().textContent + ' →';
    bgword.textContent = tabs.find(t => t.dataset.set === set).textContent;
    if (!flying) return;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    if (animate && window.gsap){ const o = { v:1600 }; gsap.to(o, { v:0, duration:1.1, ease:'expo.out', onUpdate:() => { intro = o.v; render(); } }); }
    render();
  }
  tabs.forEach(t => t.addEventListener('click', () => {
    pick(t.dataset.set, true);
    if (flying && window.__lenis) window.__lenis.scrollTo(fly, { duration:1 });
    if (window.gsap && !reduce) gsap.fromTo(t, { rotation:-10, scale:.9 }, { rotation:0, scale:1, duration:.7, ease:'elastic.out(1,.5)' });
  }));
  world.addEventListener('click', e => { const b = e.target.closest('.open'); if (!b) return; const p = b.closest('.print'); Lightbox.open(items, items.indexOf(p)); });
  document.addEventListener('langchange', () => { caption(); const cur = tabs.find(t => t.getAttribute('aria-pressed') === 'true'); bgword.textContent = cur.textContent; noteName.textContent = nextSet().textContent + ' →'; });
  return {
    still(){ pick(tabs[0].dataset.set, false); },
    start(){
      flying = true; fly.classList.add('on'); pick(tabs[0].dataset.set, false);
      ScrollTrigger.create({ trigger:fly, start:'top top', end:'bottom bottom', scrub:.7, onUpdate:s => { progress = s.progress; render(); }, onRefresh:s => { progress = s.progress; render(); } });
      addEventListener('resize', render); render();
    }
  };
})();

/* lightbox: the piece opens as a taped sheet, with sound and controls */
const Lightbox = (function(){
  const lb = document.getElementById('lb'), sheet = document.getElementById('lbSheet'), vid = document.getElementById('lbVid');
  const tt = document.getElementById('lbTitle'), kk = document.getElementById('lbKind');
  let list = [], i = 0, opener = null;
  function show(k){
    i = (k + list.length) % list.length; const p = list[i];
    vid.poster = p.querySelector('img').src; vid.src = p.dataset.full; vid.play().catch(()=>{});
    tt.textContent = p.querySelector('figcaption b').textContent; kk.textContent = p.querySelector('figcaption span').textContent;
    if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(sheet, { y:-40, rotation:4, opacity:.4 }, { y:0, rotation:-1, opacity:1, duration:.6, ease:'back.out(1.8)' });
  }
  function open(l, k){ opener = document.activeElement; list = l; lb.hidden = false; document.body.style.overflow = 'hidden'; window.__lenis && window.__lenis.stop(); show(k < 0 ? 0 : k); document.getElementById('lbClose').focus(); }
  function close(){ vid.pause(); vid.removeAttribute('src'); vid.load(); lb.hidden = true; document.body.style.overflow = ''; window.__lenis && window.__lenis.start(); opener && opener.focus(); }
  document.getElementById('lbClose').onclick = close;
  document.getElementById('lbNext').onclick = () => show(i + 1);
  document.getElementById('lbPrev').onclick = () => show(i - 1);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'Tab'){ const f = [...lb.querySelectorAll('button,video')]; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); } } });
  return { open };
})();

(function(){
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vids = document.querySelectorAll('video[data-v]');
  if (!reduce){ const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? e.target.play().catch(()=>{}) : e.target.pause()), { rootMargin:'80px' }); vids.forEach(v => io.observe(v)); }
  if (!window.gsap || reduce){ root.classList.remove('js'); Works.still(); return; }
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({ lerp:.1 }); window.__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const t = document.querySelector(a.getAttribute('href')); if (!t) return; e.preventDefault(); lenis.scrollTo(t, { duration:1.4, offset:-20 }); }));
  const nav = document.getElementById('nav'); let last = 0;
  lenis.on('scroll', ({ scroll }) => { nav.classList.toggle('hide', scroll > last && scroll > 300); last = scroll; });

  /* hero: letters drop onto the page, the stamp spins in, the note is drawn */
  const arrow = document.querySelector('.note path'), L = arrow.getTotalLength();
  gsap.set(arrow, { strokeDasharray:L, strokeDashoffset:L });
  gsap.timeline({ delay:.15 })
    .from('.name .ch:not(.face)', { yPercent:-140, rotation:() => gsap.utils.random(-25, 25), opacity:0, duration:1, ease:'bounce.out', stagger:.06 }, 0)
    .from('.name .face', { scale:0, rotation:-200, duration:1.2, ease:'back.out(1.8)' }, .35)
    .from('.stars svg', { scale:0, rotation:-90, duration:.7, ease:'back.out(3)', stagger:.08 }, .9)
    .to(arrow, { strokeDashoffset:0, duration:.7, ease:'power2.inOut' }, 1.2)
    .from('.note span', { opacity:0, x:-10, duration:.5 }, 1.6)
    .fromTo('[data-hero]', { opacity:0, y:20 }, { opacity:1, y:0, duration:.8, ease:'expo.out', stagger:.08 }, 1);
  gsap.to('.stars svg', { rotation:360, duration:14, ease:'none', repeat:-1, stagger:{ each:.5 } });
  gsap.to('.name .face img', { rotation:8, duration:2.4, yoyo:true, repeat:-1, ease:'sine.inOut' });

  /* band: two rows of words run in opposite directions with the scroll; the sticker lifts */
  gsap.utils.toArray('.band .row').forEach(r => {
    const dir = +r.dataset.dir;
    gsap.fromTo(r, { xPercent: dir < 0 ? 0 : -25 }, { xPercent: dir < 0 ? -25 : 0, ease:'none', scrollTrigger:{ trigger:'.band', start:'top bottom', end:'bottom top', scrub:true } });
  });
  gsap.fromTo('#sticker', { yPercent:18, rotation:-4 }, { yPercent:0, rotation:2, ease:'none', scrollTrigger:{ trigger:'.band', start:'top bottom', end:'center center', scrub:true } });

  /* the sticker can be dragged and springs back */
  const st = document.getElementById('sticker'); let sx, sy, drag = false;
  st.addEventListener('pointerdown', e => { drag = true; sx = e.clientX; sy = e.clientY; st.setPointerCapture(e.pointerId); st.style.cursor = 'grabbing'; gsap.to(st.firstElementChild, { scale:1.05, rotation:-3, duration:.3 }); });
  st.addEventListener('pointermove', e => { if (!drag) return; gsap.set(st.firstElementChild, { x:e.clientX - sx, y:e.clientY - sy }); });
  st.addEventListener('pointerup', () => { drag = false; st.style.cursor = ''; gsap.to(st.firstElementChild, { x:0, y:0, scale:1, rotation:0, duration:1.2, ease:'elastic.out(1,.45)' }); });

  /* works: the notebook's prints fly at you */
  Works.start(lenis);
  gsap.from('.tab', { y:-30, rotation:() => gsap.utils.random(-12, 12), opacity:0, duration:.8, ease:'back.out(2)', stagger:.08, scrollTrigger:{ trigger:'.tabs', start:'top 85%', once:true } });

  /* services: each time is circled by hand as it enters */
  gsap.utils.toArray('.slist ellipse').forEach(e => {
    gsap.set(e, { strokeDasharray:1, strokeDashoffset:1 });
    gsap.to(e, { strokeDashoffset:0, duration:.9, ease:'power2.inOut', scrollTrigger:{ trigger:e.closest('li'), start:'top 80%', once:true } });
  });

  /* contact note swings into place */
  gsap.from('.notecard', { rotation:6, y:60, duration:1.2, ease:'elastic.out(1,.6)', scrollTrigger:{ trigger:'.contact', start:'top 70%', once:true } });

  ScrollTrigger.batch('[data-rv]', { start:'top 90%', once:true, interval:.08,
    onEnter: b => gsap.to(b, { opacity:1, y:0, duration:.9, ease:'expo.out', stagger:.07, overwrite:true }) });
  gsap.from('.foot .big', { yPercent:50, ease:'none', scrollTrigger:{ trigger:'.foot', start:'top bottom', end:'bottom bottom', scrub:true } });
})();
