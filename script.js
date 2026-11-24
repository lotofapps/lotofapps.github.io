/* ==========================================================================
   LotOfApps — vanilla JavaScript
   - Client-side tab switching via the `hidden` attribute
   - Hash-based deep linking:
       #home        -> Home tab
       #apps        -> Apps tab
       #policies    -> Policies tab, show NoteApt policy (default app)
       #contact     -> Contact tab
       #noteapt-privacy -> alias for #policies (normalized to #policies)
   - Theme toggle persisted in localStorage
   - Accessible mobile hamburger menu
   - Header dropdown for Policies is CSS-first (:hover/:focus-within).
     No JS navigation logic for dropdown items — they are plain anchors
     handled by the same hash router as every other nav link.
   ========================================================================== */

(function () {
  'use strict';

  // Tab identifiers; keys match `data-tab` on nav links and panel ids (`panel-<id>`)
  var TABS = ['home', 'apps', 'policies', 'contact'];

  // Hash-to-route map.
  // Each entry: { tab, policy, normalize }
  //   tab      : which tab to activate (always 'policies' for policy hashes)
  //   policy   : app slug whose policy section to show (matches data-policy)
  //   normalize: if set, rewrite location.hash to this value on load/click
  //              (e.g. '#noteapt-privacy' normalizes to '#policies')
  //
  // To wire up a future app policy, add an entry like:
  //   '<slug>-privacy': { tab: 'policies', policy: '<slug>', normalize: 'policies' },
  var ROUTES = {
    'policies': { tab: 'policies', policy: 'noteapt', normalize: null },
    'noteapt-privacy': { tab: 'policies', policy: 'noteapt', normalize: 'policies' },
  };

  var doc = document;
  var htmlEl = doc.documentElement;
  var metaTheme = doc.getElementById('meta-theme-color');
  var navToggle = doc.getElementById('nav-toggle');
  var siteNav = doc.getElementById('site-nav');
  var themeToggle = doc.getElementById('theme-toggle');

  /* ---------- theme ---------- */
  var THEME_KEY = 'lotofapps_theme';

  function systemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      htmlEl.dataset.theme = 'dark';
    } else {
      delete htmlEl.dataset.theme;
    }
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    if (metaTheme) {
      metaTheme.content = theme === 'dark' ? '#0b1020' : '#ffffff';
    }
  }

  function initTheme() {
    var stored = localStorage.getItem(THEME_KEY);
    applyTheme(stored ? stored : systemTheme());
  }

  themeToggle.addEventListener('click', function () {
    var current = htmlEl.dataset.theme === 'dark' ? 'dark' : 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  /* ---------- tabs ---------- */
  function hideMobileMenu() {
    navToggle.setAttribute('aria-expanded', 'false');
    siteNav.removeAttribute('data-open');
  }

  function activateTab(id) {
    if (TABS.indexOf(id) === -1) {
      id = 'home';
    }

    doc.querySelectorAll('section.panel').forEach(function (panel) {
      panel.hidden = panel.id !== 'panel-' + id;
    });

    doc.querySelectorAll('.site-nav a[data-tab]').forEach(function (link) {
      if (link.dataset.tab === id) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (id === 'policies') {
      scrollToPolicy();
    }

    hideMobileMenu();
  }

  function scrollToPolicy() {
    var el = doc.getElementById('noteapt-privacy');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ---------- hash helpers ---------- */
  function setHash(hash) {
    if (location.hash !== '#' + hash) {
      location.hash = '#' + hash;
    }
  }

  function onHashChange() {
    var hash = location.hash.slice(1);
    var route = ROUTES[hash];

    if (route) {
      // Policy anchor (e.g. #policies or #noteapt-privacy alias)
      if (route.normalize && location.hash !== '#' + route.normalize) {
        location.hash = '#' + route.normalize;
        return;
      }
      activateTab(route.tab);
      return;
    }

    if (TABS.indexOf(hash) !== -1) {
      activateTab(hash || 'home');
      return;
    }

    activateTab('home');
  }

  /* ---------- anchor delegation (in-page links) ---------- */
  doc.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (link) {
      var href = link.getAttribute('href');
      var hash = href.slice(1);

      if (hash === '') {
        // Placeholder link (e.g. "Get it on Google Play" before a real URL is added)
        e.preventDefault();
        return;
      }

      var route = ROUTES[hash];
      if (route) {
        e.preventDefault();
        activateTab(route.tab);
        if (route.normalize && location.hash !== '#' + route.normalize) {
          location.hash = '#' + route.normalize;
        } else {
          setHash(hash);
        }
        return;
      }

      if (TABS.indexOf(hash) !== -1) {
        e.preventDefault();
        location.hash = hash;
        return;
      }
    }
  });

  /* ---------- mobile menu ---------- */
  navToggle.addEventListener('click', function () {
    var open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    siteNav.setAttribute('data-open', String(!open));
  });

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
