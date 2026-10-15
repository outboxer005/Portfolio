/* Optional visuals enhance content; navigation and theme never depend on a CDN. */
(function () {
  'use strict';
  const root = document.documentElement;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const touch = matchMedia('(pointer: coarse)').matches;
  const disposers = [];
  const on = (target, event, fn, options) => {
    target.addEventListener(event, fn, options);
    disposers.push(() => target.removeEventListener(event, fn, options));
  };
  const safely = (name, fn) => {
    try { fn(); } catch (error) { console.warn(`${name} unavailable; content remains usable.`, error); }
  };
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Storage is optional. */ } };
  safely('Theme', () => {
    const button = document.getElementById('themeBtn');
    const setTheme = theme => {
      root.dataset.theme = theme;
      button.textContent = theme.toUpperCase();
      button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
      save('theme', theme);
    };
    setTheme(read('theme') === 'light' ? 'light' : 'dark');
    button.hidden = false;
    on(button, 'click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  });
  let paused = read('motion') === 'paused';
  const moving = () => !media.matches && !paused && !document.hidden;
  const motionButton = document.getElementById('motionBtn');
  const motionChanged = () => {
    root.dataset.motion = paused || media.matches ? 'paused' : 'running';
    motionButton.textContent = media.matches ? 'Reduced motion enabled' : paused ? 'Resume motion' : 'Pause motion';
    motionButton.setAttribute('aria-pressed', String(paused || media.matches));
    motionButton.disabled = media.matches;
    window.dispatchEvent(new CustomEvent('portfolio:motion', {detail: {paused: !moving()}}));
  };
  motionButton.hidden = false;
  on(motionButton, 'click', () => { paused = !paused; save('motion', paused ? 'paused' : 'running'); motionChanged(); });
  on(media, 'change', motionChanged);
  on(document, 'visibilitychange', motionChanged);
  motionChanged();
  let closeMenu = () => {};
  safely('Mobile menu', () => {
    const button = document.getElementById('menuBtn');
    const panel = document.getElementById('mobileNav');
    const links = [...panel.querySelectorAll('a')];
    const setOpen = (open, returnFocus = false) => {
      panel.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      button.innerHTML = open ? 'CLOSE <span aria-hidden="true">−</span>' : 'MENU <span aria-hidden="true">+</span>';
      if (open) links[0].focus(); else if (returnFocus) button.focus();
    };
    closeMenu = () => setOpen(false);
    button.hidden = false;
    on(button, 'click', () => setOpen(panel.hidden));
    on(document, 'keydown', event => {
      if (panel.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false, true); }
      if (event.key === 'Tab') {
        if (event.shiftKey && document.activeElement === links[0]) { event.preventDefault(); button.focus(); }
        else if (!event.shiftKey && document.activeElement === links.at(-1)) { event.preventDefault(); button.focus(); }
        else if (document.activeElement === button) { event.preventDefault(); (event.shiftKey ? links.at(-1) : links[0]).focus(); }
      }
    });
    on(document, 'click', event => { if (!panel.hidden && !event.target.closest('.top-nav')) setOpen(false, true); });
    on(matchMedia('(min-width: 801px)'), 'change', event => { if (event.matches) setOpen(false); });
  });
  let lenis = null;
  let stopClock = () => {};
  safely('Smooth scroll', () => {
    if (typeof Lenis === 'undefined') return;
    const sync = () => {
      stopClock(); stopClock = () => {};
      if (!moving()) { lenis?.destroy(); lenis = null; return; }
      if (!lenis) {
        lenis = new Lenis({duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4});
        if (typeof ScrollTrigger !== 'undefined') lenis.on('scroll', ScrollTrigger.update);
      }
      // Exactly one clock: the GSAP ticker, or RAF if GSAP is unavailable.
      if (typeof gsap !== 'undefined') {
        const tick = time => lenis?.raf(time * 1000);
        gsap.ticker.add(tick);
        stopClock = () => gsap.ticker.remove(tick);
      } else {
        let id;
        const tick = time => { lenis?.raf(time); id = requestAnimationFrame(tick); };
        id = requestAnimationFrame(tick);
        stopClock = () => cancelAnimationFrame(id);
      }
    };
    on(window, 'portfolio:motion', sync); sync();
    disposers.push(() => { stopClock(); lenis?.destroy(); });
  });
  safely('Anchor navigation', () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => on(anchor, 'click', event => {
      const id = anchor.getAttribute('href').slice(1), target = document.getElementById(id);
      if (!target) return;
      event.preventDefault(); closeMenu();
      const offset = document.querySelector('.top-nav').getBoundingClientRect().bottom + 18;
      const focus = () => { if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1'); target.focus({preventScroll: true}); };
      history.pushState(null, '', `#${id}`);
      if (lenis && moving()) lenis.scrollTo(target, {offset: -offset, onComplete: focus});
      else { window.scrollTo({top: target.getBoundingClientRect().top + scrollY - offset, behavior: moving() ? 'smooth' : 'instant'}); focus(); }
    }));
  });
  safely('Custom cursor', () => {
    const dot = document.querySelector('.cursor-dot'), ring = document.querySelector('.cursor-ring');
    if (touch || !dot || !ring) return;
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, frame = 0;
    const tick = () => {
      if (!moving()) { frame = 0; document.body.classList.remove('cursor-ready'); return; }
      rx += (x - rx) * .18; ry += (y - ry) * .18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      if (Math.abs(x - rx) + Math.abs(y - ry) > .1) frame = requestAnimationFrame(tick); else frame = 0;
    };
    on(window, 'mousemove', event => {
      if (!moving()) return;
      x = event.clientX; y = event.clientY;
      dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      if (!frame) frame = requestAnimationFrame(tick);
      document.body.classList.add('cursor-ready');
    });
    on(window, 'portfolio:motion', () => { if (!moving()) { cancelAnimationFrame(frame); frame = 0; document.body.classList.remove('cursor-ready'); } });
    on(document, 'mouseout', event => { if (!event.relatedTarget) document.body.classList.remove('cursor-ready'); });
    on(document, 'keydown', event => { if (event.key === 'Tab') document.body.classList.remove('cursor-ready'); });
    document.querySelectorAll('[data-cursor]').forEach(el => {
      on(el, 'mouseenter', () => { ring.classList.remove('hover', 'cta', 'view'); ring.classList.add(el.dataset.cursor); });
      on(el, 'mouseleave', () => ring.classList.remove('hover', 'cta', 'view'));
    });
    disposers.push(() => cancelAnimationFrame(frame));
  });
  safely('Pointer depth', () => {
    if (touch) return;
    document.querySelectorAll('.magnetic, .continuation .tilt').forEach(el => {
      let rect;
      on(el, 'pointerenter', () => { rect = el.getBoundingClientRect(); });
      on(el, 'pointermove', event => {
        if (!moving() || !rect) return;
        const dx = (event.clientX - rect.left) / rect.width - .5, dy = (event.clientY - rect.top) / rect.height - .5;
        el.style.transform = el.classList.contains('magnetic') ? `translate(${dx * 22}px, ${dy * 22}px)` : `perspective(1000px) rotateX(${dy * -4}deg) rotateY(${dx * 4}deg)`;
        el.style.setProperty('--mx', `${(dx + .5) * 100}%`); el.style.setProperty('--my', `${(dy + .5) * 100}%`);
      });
      const reset = () => { el.style.transform = ''; };
      on(el, 'pointerleave', reset);
      on(window, 'portfolio:motion', () => { if (!moving()) reset(); });
    });
  });
  // Keep the original scramble timing/color while preserving meaningful nested markup.
  const scramble = el => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [];
    while (walker.nextNode()) nodes.push({node: walker.currentNode, text: walker.currentNode.textContent});
    const chars = '!<>-_\\/[]{}—=+*^?#________';
    const queue = nodes.map(item => {
      const wrapper = document.createElement('span');
      item.node.replaceWith(wrapper); wrapper.append(item.node);
      return {...item, wrapper, ranges: [...item.text].map(char => {
        const start = Math.floor(Math.random() * 40);
        return {char, start, end: start + Math.floor(Math.random() * 40), display: ''};
      })};
    });
    let frame = 0, request;
    const finish = () => queue.forEach(item => { item.node.textContent = item.text; item.wrapper.replaceWith(item.node); });
    const update = () => {
      if (!moving()) { finish(); return; }
      let complete = true;
      queue.forEach(item => {
        const fragment = document.createDocumentFragment();
        item.ranges.forEach(range => {
          if (frame >= range.end) fragment.append(document.createTextNode(range.char));
          else {
            complete = false;
            if (frame >= range.start) {
              if (!range.display || Math.random() < .28) range.display = chars[Math.floor(Math.random() * chars.length)];
              const character = document.createElement('span');
              character.style.color = 'var(--accent)'; character.style.opacity = '.55'; character.textContent = range.display;
              fragment.append(character);
            } else fragment.append(document.createTextNode(range.char));
          }
        });
        item.wrapper.replaceChildren(fragment);
      });
      if (complete) finish(); else { frame++; request = requestAnimationFrame(update); }
    };
    update(); disposers.push(() => { cancelAnimationFrame(request); finish(); });
  };
  safely('Hero entrance', () => {
    if (typeof gsap === 'undefined' || !moving()) return;
    // Original hero entrance timings, positions and easing.
    const heroTl = gsap.timeline({defaults: {ease: 'power3.out'}});
    heroTl
      .from('.hero-eyebrow', {y: 20, opacity: 0, duration: .7})
      .from('.hero-name .line', {y: 90, opacity: 0, duration: .9, stagger: .08}, '-=0.4')
      .from('.hero-role', {y: 20, opacity: 0, duration: .7}, '-=0.4')
      .from('.hero-tags .tag', {y: 20, opacity: 0, duration: .5, stagger: .05}, '-=0.4')
      .from('.hero-cta .btn', {y: 20, opacity: 0, duration: .5, stagger: .08}, '-=0.3')
      .from('.scroll-hint', {opacity: 0, y: 20, duration: .6}, '-=0.2');
    on(window, 'portfolio:motion', () => { if (!moving()) heroTl.progress(1); });
    document.querySelectorAll('[data-scramble]').forEach((el, i) => {
      const timer = setTimeout(() => { if (moving()) scramble(el); }, 700 + i * 120);
      disposers.push(() => clearTimeout(timer));
    });
  });
  safely('Section transitions', () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.matchMedia();
    context.add('(prefers-reduced-motion: no-preference)', () => {
      if (paused) return;
      document.querySelectorAll('.continuation .section-head, .continuation .proj-card, .continuation .exp-row').forEach(el => {
        gsap.from(el, {y: 18, duration: .55, ease: 'power2.out', scrollTrigger: {trigger: el, start: 'top 94%', once: true}});
      });
    });
    on(window, 'portfolio:motion', () => { if (!moving()) gsap.getTweensOf('.continuation *').forEach(tween => tween.progress(1)); });
    disposers.push(() => context.revert());
  });
  safely('Experience progression', () => {
    const timeline = document.querySelector('.exp');
    let active = false, frame = 0;
    const update = () => {
      frame = 0;
      if (!active || !moving()) return;
      const rect = timeline.getBoundingClientRect();
      timeline.style.setProperty('--timeline-progress', Math.max(0, Math.min(1, (innerHeight * .65 - rect.top) / rect.height)));
    };
    const io = new IntersectionObserver(entries => { active = entries[0].isIntersecting; update(); });
    io.observe(timeline);
    on(window, 'scroll', () => { if (active && !frame) frame = requestAnimationFrame(update); }, {passive:true});
    on(window, 'portfolio:motion', update);
    disposers.push(() => { io.disconnect(); cancelAnimationFrame(frame); });
  });
  safely('Ticker', () => { const ticker = document.getElementById('ticker'); if (ticker) ticker.insertAdjacentHTML('beforeend', ticker.innerHTML); });
  on(window, 'pagehide', event => { if (!event.persisted) disposers.splice(0).reverse().forEach(dispose => dispose()); });
})();
