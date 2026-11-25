/* ==========================================================================
   LotOfApps — vanilla JavaScript
   - Single-page scroll navigation: all panels/policies always visible
   - Hash-based deep linking:
        #home             -> Home panel
        #apps             -> Apps panel
        #policies         -> Policies panel
        #noteapt          -> NoteApt privacy policy article
        #musicplayer      -> Music Player privacy policy article
        #noteapt-privacy  -> alias for NoteApt policy
        #music-player-privacy -> alias for Music Player policy
        #contact          -> Contact panel
   - Theme toggle persisted in localStorage
   - Accessible mobile hamburger menu
   ========================================================================== */

(function () {
  'use strict';

  var doc = document;
  var htmlEl = doc.documentElement;
  var metaTheme = doc.getElementById('meta-theme-color');
  var navToggle = doc.getElementById('nav-toggle');
  var siteNav = doc.getElementById('site-nav');
  var themeToggle = doc.getElementById('theme-toggle');
  var policiesTrigger = doc.getElementById('policies-trigger');

  /* ---------- theme ---------- */
  var THEME_KEY = 'lotofapps_theme';

  function systemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      htmlEl.dataset.theme = 'dark';
    } else {
      delete htmlEl.dataset.theme;
    }
    if (themeToggle) {
      themeToggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
      );
    }
    if (metaTheme) {
      metaTheme.content = theme === 'dark' ? '#090d16' : '#ffffff';
    }
  }

  function initTheme() {
    var stored = localStorage.getItem(THEME_KEY);
    applyTheme(stored ? stored : systemTheme());
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = htmlEl.dataset.theme === 'dark' ? 'dark' : 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }

  /* ---------- policy active states ---------- */
  function syncPolicyActiveStates(policySlug) {
    doc
      .querySelectorAll('.nav-dropdown-item[data-policy]')
      .forEach(function (item) {
        var matched = item.getAttribute('data-policy') === policySlug;
        item.classList.toggle('is-active', matched);
        if (matched) {
          item.setAttribute('aria-current', 'true');
        } else {
          item.removeAttribute('aria-current');
        }
      });

    doc.querySelectorAll('.policy-pill[data-policy]').forEach(function (pill) {
      pill.classList.toggle(
        'active',
        pill.getAttribute('data-policy') === policySlug,
      );
    });
  }

  /* ---------- scroll navigation ---------- */
  var SCROLL_MAP = {
    home: { selector: '#panel-home', tab: 'home', policy: '' },
    apps: { selector: '#panel-apps', tab: 'apps', policy: '' },
    policies: { selector: '#panel-policies', tab: 'policies', policy: '' },
    contact: { selector: '#panel-contact', tab: 'contact', policy: '' },
    noteapt: { selector: '#noteapt', tab: 'policies', policy: 'noteapt' },
    musicplayer: {
      selector: '#musicplayer',
      tab: 'policies',
      policy: 'musicplayer',
    },
    'noteapt-privacy': {
      selector: '#noteapt',
      tab: 'policies',
      policy: 'noteapt',
    },
    'music-player-privacy': {
      selector: '#musicplayer',
      tab: 'policies',
      policy: 'musicplayer',
    },
  };

  var lastScrolledHash = '';

  function resolveTarget(hash) {
    var entry = SCROLL_MAP[hash];
    if (!entry) {
      return null;
    }
    var el = doc.querySelector(entry.selector);
    if (!el && entry.policy) {
      el = doc.querySelector('.policy-document');
    }
    return { el: el, tab: entry.tab, policy: entry.policy };
  }

  function setHash(hash) {
    if (location.hash !== '#' + hash) {
      location.hash = '#' + hash;
    }
  }

  function scrollToTarget(target) {
    if (!target || !target.el) {
      return;
    }
    if (target.el.id && lastScrolledHash === '#' + target.el.id) {
      return;
    }
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.el.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'start',
    });
    if (target.el.id) {
      lastScrolledHash = '#' + target.el.id;
    }
  }

  function updateActiveStates(target) {
    doc.querySelectorAll('.site-nav a[data-tab]').forEach(function (link) {
      if (link.dataset.tab === target.tab) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
    syncPolicyActiveStates(target.policy);
  }

  /* ---------- mobile menu ---------- */
  function hideMobileMenu() {
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
    }
    if (siteNav) {
      siteNav.removeAttribute('data-open');
    }
  }

  /* ---------- anchor delegation ---------- */
  doc.addEventListener('click', function (e) {
    var trigger = e.target.closest('#policies-trigger');
    if (trigger) {
      e.preventDefault();
      var target = resolveTarget('policies');
      setHash('policies');
      scrollToTarget(target);
      updateActiveStates(target);
      hideMobileMenu();
      return;
    }

    var link = e.target.closest('a[href^="#"]');
    if (!link) {
      return;
    }

    var href = link.getAttribute('href') || '';
    var hash = href.slice(1);

    if (hash === '') {
      return;
    }

    var target = resolveTarget(hash);
    if (!target) {
      return;
    }

    e.preventDefault();
    setHash(hash);
    scrollToTarget(target);
    updateActiveStates(target);
    if (
      link.classList.contains('nav-dropdown-item') &&
      typeof link.blur === 'function'
    ) {
      link.blur();
    }
    hideMobileMenu();
  });

  /* ---------- hash handling ---------- */
  function onHashChange() {
    var hash = location.hash.replace(/^#/, '');
    var target = hash ? resolveTarget(hash) : null;
    if (target) {
      scrollToTarget(target);
      updateActiveStates(target);
      return;
    }
    // Empty or unknown hash: stay at top, Home highlighted
    updateActiveStates({
      el: doc.querySelector('#panel-home'),
      tab: 'home',
      policy: '',
    });
  }

  /* ---------- mobile menu toggle ---------- */
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      var open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      siteNav.setAttribute('data-open', String(!open));
    });
  }

  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      hideMobileMenu();
    }
  });

  /* ---------- init ---------- */
  function init() {
    initTheme();
    onHashChange();
    window.addEventListener('hashchange', onHashChange);
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
