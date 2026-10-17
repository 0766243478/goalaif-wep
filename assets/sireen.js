/* ============================================================
   SIREEN v2 — Premium Website JavaScript
   Network visualization + interactions + animations
   ============================================================ */

(function() {
  'use strict';

  // ── Canvas Network Visualization (Hero) ────────────────────
  function initNetworkCanvas() {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(pointer: coarse)').matches;

    let width, height, dpr;
    let nodes = [];
    let edges = [];
    let mouse = { x: -1000, y: -1000, active: false };
    let rafId;
    let frameCount = 0;

    const NODE_COUNT = isMobile ? 25 : 45;
    const CONNECTION_DISTANCE = 180;
    const MOUSE_RADIUS = 220;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createNodes() {
      nodes = [];
      edges = [];

      // Central hub node
      nodes.push({
        x: width * 0.5,
        y: height * 0.45,
        vx: 0, vy: 0,
        radius: 5,
        type: 'hub',
        opacity: 1
      });

      // Hypothesis nodes (left cluster)
      for (let i = 0; i < NODE_COUNT * 0.35; i++) {
        nodes.push(createNode('hypothesis', 0.05, 0.35));
      }

      // Exploration nodes (center-left)
      for (let i = 0; i < NODE_COUNT * 0.25; i++) {
        nodes.push(createNode('explore', 0.30, 0.55));
      }

      // Execution nodes (center-right)
      for (let i = 0; i < NODE_COUNT * 0.25; i++) {
        nodes.push(createNode('execute', 0.55, 0.80));
      }

      // Evidence nodes (right)
      for (let i = 0; i < NODE_COUNT * 0.15; i++) {
        nodes.push(createNode('evidence', 0.80, 0.95));
      }

      // Build edges between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DISTANCE) {
            edges.push({ from: i, to: j, dist: dist });
          }
        }
      }
    }

    function createNode(type, xMin, xMax) {
      return {
        x: width * (xMin + Math.random() * (xMax - xMin)),
        y: height * (0.15 + Math.random() * 0.7),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: type === 'hub' ? 5 : (1.5 + Math.random() * 2.5),
        type: type,
        opacity: 0.3 + Math.random() * 0.5,
        pulsePhase: Math.random() * Math.PI * 2
      };
    }

    function getNodeColor(type, alpha) {
      switch (type) {
        case 'hub': return `rgba(0, 229, 255, ${alpha})`;
        case 'hypothesis': return `rgba(255, 183, 77, ${alpha})`;
        case 'explore': return `rgba(0, 229, 255, ${alpha})`;
        case 'execute': return `rgba(96, 165, 250, ${alpha})`;
        case 'evidence': return `rgba(61, 220, 132, ${alpha})`;
        default: return `rgba(138, 138, 154, ${alpha})`;
      }
    }

    function update() {
      if (isReducedMotion) return;

      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i];

        // Gentle drift
        n.x += n.vx;
        n.y += n.vy;

        // Boundary bounce
        if (n.x < 10 || n.x > width - 10) n.vx *= -1;
        if (n.y < 10 || n.y > height - 10) n.vy *= -1;

        // Mouse repulsion
        if (mouse.active) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS && dist > 0) {
            const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
            n.x += (dx / dist) * force * 2;
            n.y += (dy / dist) * force * 2;
          }
        }

        // Keep within bounds
        n.x = Math.max(10, Math.min(width - 10, n.x));
        n.y = Math.max(10, Math.min(height - 10, n.y));

        // Pulse
        n.pulsePhase += 0.02;
      }

      // Hub gentle float
      nodes[0].x = width * 0.5 + Math.sin(frameCount * 0.005) * 15;
      nodes[0].y = height * 0.45 + Math.cos(frameCount * 0.007) * 10;
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Draw edges
      for (const edge of edges) {
        const a = nodes[edge.from];
        const b = nodes[edge.to];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const alpha = Math.max(0, 1 - dist / CONNECTION_DISTANCE) * 0.15;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Draw nodes
      for (const n of nodes) {
        const pulse = isReducedMotion ? 1 : (0.8 + 0.2 * Math.sin(n.pulsePhase));
        const alpha = n.opacity * pulse;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = getNodeColor(n.type, alpha);
        ctx.fill();

        // Glow for hub
        if (n.type === 'hub') {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 229, 255, ${0.08 * pulse})`;
          ctx.fill();
        }
      }
    }

    function loop() {
      frameCount++;
      update();
      draw();
      rafId = requestAnimationFrame(loop);
    }

    // Mouse events
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });

    canvas.addEventListener('mouseleave', () => {
      mouse.active = false;
    });

    // Touch events
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - rect.left;
      mouse.y = e.touches[0].clientY - rect.top;
      mouse.active = true;
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      mouse.active = false;
    });

    // Visibility handling
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(loop);
      }
    });

    // Init
    resize();
    createNodes();
    loop();

    window.addEventListener('resize', () => {
      resize();
      createNodes();
    });
  }

  // ── Mobile Menu Toggle ─────────────────────────────────────
  function initMobileMenu() {
    const btn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.mobile-nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ── Intersection Observer Reveal ───────────────────────────
  function initReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.06,
      rootMargin: '0px 0px -30px 0px'
    });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  // ── Smooth Scroll for Anchor Links ─────────────────────────
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      });
    });
  }

  // ── Header Scroll Behavior (Hide/Show) ─────────────────────
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let lastScrollY = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Add scrolled class
          header.classList.toggle('scrolled', currentScrollY > 30);

          // Hide/show on scroll direction (only after 100px)
          if (currentScrollY > 100) {
            if (currentScrollY > lastScrollY) {
              header.classList.add('hidden');
            } else {
              header.classList.remove('hidden');
            }
          } else {
            header.classList.remove('hidden');
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ── Demo Tabs ──────────────────────────────────────────────
  function initDemoTabs() {
    const tabs = document.querySelectorAll('.demo-tab');
    const panels = document.querySelectorAll('.demo-panel');
    if (!tabs.length) return;

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t, j) => t.classList.toggle('active', j === i));
        panels.forEach((p, j) => p.classList.toggle('active', j === i));
      });
    });
  }

  // ── FAQ Accordion ──────────────────────────────────────────
  function initFaqAccordion() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(item => {
      const question = item.querySelector('.faq-question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        items.forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  }

  // ── Initialize ─────────────────────────────────────────────
  function init() {
    initNetworkCanvas();
    initMobileMenu();
    initReveal();
    initSmoothScroll();
    initHeaderScroll();
    initDemoTabs();
    initFaqAccordion();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
