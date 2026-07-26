/* =============================================================
   Main interactions
   - Lenis smooth scroll
   - GSAP scroll-triggered reveals
   - Custom cursor
   - Text scramble
   - Magnetic buttons
   - Tilt cards
   - Number count-up
   - Theme toggle
   ============================================================= */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(pointer: coarse)').matches;

  /* ==================== LENIS SMOOTH SCROLL ==================== */
  let lenis = null;
  if (typeof Lenis !== 'undefined' && !reduce) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // GSAP ScrollTrigger sync
    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  // Anchor click smooth scroll fallback via Lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(el, { offset: -60 });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ==================== THEME TOGGLE ==================== */
  const themeBtn = document.getElementById('themeBtn');
  const root = document.documentElement;
  const setTheme = (t) => {
    root.setAttribute('data-theme', t);
    if (themeBtn) themeBtn.textContent = t.toUpperCase();
    try { localStorage.setItem('theme', t); } catch (e) {}
  };
  let stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) {}
  const initial = stored || 'dark';
  setTheme(initial);
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  /* ==================== CUSTOM CURSOR ==================== */
  if (!isTouch) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { x: pos.x, y: pos.y };

    window.addEventListener('mousemove', (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (dot) {
        dot.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
      }
    });

    const tickCursor = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      if (ring) {
        ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%)`;
      }
      requestAnimationFrame(tickCursor);
    };
    tickCursor();

    // Hover states
    document.querySelectorAll('[data-cursor]').forEach((el) => {
      const kind = el.getAttribute('data-cursor');
      el.addEventListener('mouseenter', () => {
        ring?.classList.remove('hover', 'cta', 'view');
        ring?.classList.add(kind);
      });
      el.addEventListener('mouseleave', () => {
        ring?.classList.remove('hover', 'cta', 'view');
      });
    });
  }

  /* ==================== MAGNETIC BUTTONS ==================== */
  if (!isTouch && !reduce) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      const strength = 22;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* ==================== TILT CARDS ==================== */
  if (!isTouch && !reduce) {
    document.querySelectorAll('.tilt').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = ((e.clientX - r.left) / r.width - 0.5);
        const dy = ((e.clientY - r.top) / r.height - 0.5);
        const rotX = dy * -6;
        const rotY = dx * 6;
        el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
      });
    });
  } else {
    // Still update the radial glow position on touch/reduce
    document.querySelectorAll('.card, .proj-card').forEach((c) => {
      c.addEventListener('mousemove', (e) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  /* ==================== TEXT SCRAMBLE ==================== */
  class Scramble {
    constructor(el) {
      this.el = el;
      this.chars = '!<>-_\\/[]{}—=+*^?#________';
      this.queue = [];
      this.frame = 0;
      this.frameRequest = 0;
      this.resolve = null;
      this.update = this.update.bind(this);
    }
    setText(newText) {
      const oldText = this.el.innerText;
      const length = Math.max(oldText.length, newText.length);
      const promise = new Promise((res) => (this.resolve = res));
      this.queue = [];
      for (let i = 0; i < length; i++) {
        const from = oldText[i] || '';
        const to = newText[i] || '';
        const start = Math.floor(Math.random() * 40);
        const end = start + Math.floor(Math.random() * 40);
        this.queue.push({ from, to, start, end });
      }
      cancelAnimationFrame(this.frameRequest);
      this.frame = 0;
      this.update();
      return promise;
    }
    update() {
      let output = '';
      let complete = 0;
      for (let i = 0; i < this.queue.length; i++) {
        let { from, to, start, end, char } = this.queue[i];
        if (this.frame >= end) {
          complete++;
          output += to;
        } else if (this.frame >= start) {
          if (!char || Math.random() < 0.28) {
            char = this.chars[Math.floor(Math.random() * this.chars.length)];
            this.queue[i].char = char;
          }
          output += `<span style="color:var(--accent);opacity:.55">${char}</span>`;
        } else {
          output += from;
        }
      }
      this.el.innerHTML = output;
      if (complete === this.queue.length) {
        this.resolve();
      } else {
        this.frameRequest = requestAnimationFrame(this.update);
        this.frame++;
      }
    }
  }

  /* ==================== GSAP SCROLL ANIMATIONS ==================== */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Hero intro
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .from('.hero-eyebrow', { y: 20, opacity: 0, duration: 0.7 })
      .from('.hero-name .line', { y: 90, opacity: 0, duration: 0.9, stagger: 0.08 }, '-=0.4')
      .from('.hero-role', { y: 20, opacity: 0, duration: 0.7 }, '-=0.4')
      .from('.hero-tags .tag', { y: 20, opacity: 0, duration: 0.5, stagger: 0.05 }, '-=0.4')
      .from('.hero-cta .btn', { y: 20, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.3')
      .from('.scroll-hint', { opacity: 0, y: 20, duration: 0.6 }, '-=0.2');

    // Scramble the hero name lines after entry
    if (!reduce) {
      const scrambleEls = document.querySelectorAll('[data-scramble]');
      scrambleEls.forEach((el, i) => {
        const original = el.textContent;
        el.setAttribute('data-original', original);
        setTimeout(() => {
          const scr = new Scramble(el);
          scr.setText(original);
        }, 700 + i * 120);
      });
    }

    // Fade-up on scroll for section-heads, cards, rows
    const groups = [
      '.section-head', '.about-lead', '.about-body', '.about-facets .facet',
      '.now-card', '.ach-hero', '.ach-item', '.ach-strip',
      '.exp-row', '.spec .card', '.proj-card', '.skill-group', '.prof',
      '.contact-card', 'footer'
    ];
    groups.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none'
          },
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out'
        });
      });
    });

    // Fill bars on scroll
    document.querySelectorAll('[data-fill]').forEach((el) => {
      gsap.to(el, {
        scrollTrigger: { trigger: el, start: 'top 88%' },
        width: el.dataset.fill + '%',
        duration: 1.6,
        ease: 'power3.out'
      });
    });

    // Section indices scramble on enter
    document.querySelectorAll('.section-idx').forEach((el) => {
      const original = el.textContent;
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => {
          if (reduce) return;
          const scr = new Scramble(el);
          scr.setText(original);
        }
      });
    });

    // Parallax on hero canvas already handled by scene.js scroll listener
  } else {
    // Fallback: just show everything
    document.querySelectorAll('[style*="opacity"]').forEach((el) => (el.style.opacity = 1));
  }

  /* ==================== COUNT-UP ==================== */
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1500;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const v = target * easeOut(p);
      el.textContent = decimals ? v.toFixed(decimals) : Math.floor(v).toString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        if (reduce) {
          const target = parseFloat(e.target.dataset.count);
          const decimals = parseInt(e.target.dataset.decimals || '0', 10);
          e.target.textContent = decimals ? target.toFixed(decimals) : target.toString();
        } else {
          runCount(e.target);
        }
        countIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el));

  /* ==================== TICKER DUPLICATE ==================== */
  const t = document.getElementById('ticker');
  if (t) t.innerHTML = t.innerHTML + t.innerHTML;

})();
