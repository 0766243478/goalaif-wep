/* ============================================================
   SIREEN Premium Website — Shared JavaScript
   ============================================================ */

(function() {
  'use strict';

  // ── Mobile Menu Toggle ─────────────────────────────────────
  function initMobileMenu() {
    const btn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.mobile-nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });

    // Close on outside click
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
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
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
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ── Header Scroll Effect ───────────────────────────────────
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          header.classList.toggle('scrolled', window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ── Demo Tabs (Homepage) ───────────────────────────────────
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
        // Close all others
        items.forEach(i => i.classList.remove('open'));
        // Toggle current
        if (!isOpen) item.classList.add('open');
      });
    });
  }

  // ── Initialize ─────────────────────────────────────────────
  function init() {
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
