/* ==========================================================================
   LotOfApps — vanilla JavaScript
   - Client-side tab switching via the `hidden` attribute
   - Hash-based deep linking (#home, #apps, #policies, #contact, #noteapt-privacy)
   - Theme toggle persisted in localStorage
   - Accessible mobile hamburger menu
   ========================================================================== */

(function () {
  'use strict';

  // Tab identifiers; keys match `data-tab` on nav links and panel ids (`panel-<id>`)
  var TABS = ['home', 'apps', 'policies', 'contact'];

  // Policy anchors that open the Policies tab and scroll to a policy section.
  // To add a future app policy, register its anchor here, e.g. 'otherapp-privacy': 'otherapp'
  var POLICY_ANCHORS = {
    'noteapt-privacy': 'noteapt'
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
      syncSubmenuFromHash();
    }

    hideMobileMenu();
  }

  function scrollToElement(hash) {
    var el = doc.getElementById(hash.slice(1));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function setActivePolicy(slug) {
    doc.querySelectorAll('.policy-submenu a[data-policy]').forEach(function (chip) {
      if (chip.dataset.policy === slug) {
        chip.setAttribute('aria-current', 'true');
      } else {
        chip.removeAttribute('aria-current');
      }
    });
  }

  function syncSubmenuFromHash() {
    var slug = POLICY_ANCHORS[location.hash.slice(1)];
    if (slug) {
      setActivePolicy(slug);
    } else {
      doc.querySelectorAll('.policy-submenu a[data-policy]').forEach(function (chip) {
        chip.removeAttribute('aria-current');
      });
    }
  }

  function onHashChange() {
    var hash = location.hash.slice(1);

    if (!hash || TABS.indexOf(hash) !== -1) {
      activateTab(hash || 'home');
      return;
    }

    if (POLICY_ANCHORS[hash] !== undefined) {
      // e.g. https://<user>.github.io/<repo>/#noteapt-privacy — opened from Google Play Console
      activateTab('policies');
      scrollToElement(location.hash);
      syncSubmenuFromHash();
      return;
    }

    activateTab('home');
  }

  /* ---------- anchor delegation (in-page links) ---------- */
  doc.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) {
      return;
    }

    var href = link.getAttribute('href');
    var hash = href.slice(1);

    if (hash === '') {
      // Placeholder link (e.g. "Get it on Google Play" before a real URL is added)
      e.preventDefault();
      return;
    }

    if (TABS.indexOf(hash) !== -1) {
      e.preventDefault();
      location.hash = hash;
      return;
    }

    if (POLICY_ANCHORS[hash] !== undefined) {
      e.preventDefault();
      activateTab('policies');
      scrollToElement(location.hash);
      setActivePolicy(POLICY_ANCHORS[hash]);
      location.hash = hash;
      return;
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
