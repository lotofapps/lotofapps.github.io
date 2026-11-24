/* ==========================================================================
   LotOfApps — vanilla JavaScript
   - Client-side tab switching via the `hidden` attribute
   - Hash-based deep linking:
       #home        -> Home tab
       #apps        -> Apps tab
       #policies    -> Policies tab (shows default/first policy)
       #noteapt     -> Policies tab, show NoteApt policy (keeps #noteapt in URL)
       #musicplayer -> Policies tab, show Music Player policy (keeps #musicplayer in URL)
       #contact     -> Contact tab
   - Theme toggle persisted in localStorage
   - Accessible mobile hamburger menu
   ========================================================================== */

(function () {
  'use strict';

  var TABS = ['home', 'apps', 'policies', 'contact'];

  var ROUTES = {
    policies: { tab: 'policies', policy: 'noteapt', normalize: null },
    noteapt: { tab: 'policies', policy: 'noteapt', normalize: null },
    musicplayer: { tab: 'policies', policy: 'musicplayer', normalize: null },
    'noteapt-privacy': { tab: 'policies', policy: 'noteapt', normalize: null },
    'music-player-privacy': {
      tab: 'policies',
      policy: 'musicplayer',
      normalize: null,
    },
  };

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

  /* ---------- policy selection & tabs ---------- */
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

  function showPolicySection(policySlug) {
    var sections = doc.querySelectorAll('.policy-document');
    var targetSection = null;

    sections.forEach(function (sec) {
      var slug = sec.getAttribute('data-policy-section') || sec.id;
      var isMatch = slug === policySlug;
      sec.hidden = !isMatch;
      if (isMatch) {
        targetSection = sec;
      }
    });

    if (!targetSection && sections.length > 0) {
      sections[0].hidden = false;
      targetSection = sections[0];
    }

    syncPolicyActiveStates(policySlug);
    return targetSection;
  }

  function hideMobileMenu() {
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
    }
    if (siteNav) {
      siteNav.removeAttribute('data-open');
    }
  }

  function activateTab(id, policySlug) {
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
      var activePolicy = policySlug || 'noteapt';
      var sec = showPolicySection(activePolicy);
      scrollToElement(sec);
    } else {
      syncPolicyActiveStates('');
    }

    hideMobileMenu();
  }

  function scrollToElement(el) {
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
    var hash = location.hash.replace(/^#/, '');
    var route = ROUTES[hash];

    if (route) {
      if (route.normalize && location.hash !== '#' + route.normalize) {
        location.hash = '#' + route.normalize;
        return;
      }
      activateTab(route.tab, route.policy);
      return;
    }

    if (TABS.indexOf(hash) !== -1) {
      activateTab(hash);
      return;
    }

    activateTab('home');
  }

  /* ---------- anchor delegation & hover-only Policies trigger ---------- */
  if (policiesTrigger) {
    policiesTrigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  doc.addEventListener('click', function (e) {
    if (e.target.closest('#policies-trigger')) {
      e.preventDefault();
      return;
    }

    var link = e.target.closest('a[href^="#"]');
    if (!link) {
      return;
    }

    var href = link.getAttribute('href');
    var hash = href.slice(1);

    if (hash === '') {
      e.preventDefault();
      return;
    }

    var route = ROUTES[hash];
    if (route) {
      e.preventDefault();
      setHash(hash);
      activateTab(route.tab, route.policy);
      if (
        link.classList.contains('nav-dropdown-item') &&
        typeof link.blur === 'function'
      ) {
        link.blur();
      }
      return;
    }

    if (TABS.indexOf(hash) !== -1) {
      e.preventDefault();
      setHash(hash);
      activateTab(hash);
    }
  });

  /* ---------- mobile menu ---------- */
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
