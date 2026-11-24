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
   - Header dropdown for Policies (desktop hover/focus, mobile accordion)
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

  // Default app shown when the Policies tab is opened.
  var DEFAULT_POLICY_APP = 'noteapt';

  var doc = document;
  var htmlEl = doc.documentElement;
  var metaTheme = doc.getElementById('meta-theme-color');
  var navToggle = doc.getElementById('nav-toggle');
  var siteNav = doc.getElementById('site-nav');
  var themeToggle = doc.getElementById('theme-toggle');

  // Header dropdown elements
  var policiesTrigger = doc.getElementById('policies-trigger');
  var policiesDropdown = doc.getElementById('policies-dropdown');
  var dropdownCloseTimer = null;

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

    // Policies trigger is a button, not a link — sync its aria-current separately
    if (policiesTrigger) {
      if (id === 'policies') {
        policiesTrigger.setAttribute('aria-current', 'page');
      } else {
        policiesTrigger.removeAttribute('aria-current');
      }
    }

    if (id === 'policies') {
      scrollToPolicy();
    }

    hideMobileMenu();
    closeDropdown();
  }

  function scrollToPolicy() {
    var el = doc.getElementById('noteapt-privacy');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ---------- header dropdown ---------- */
  function isMobileView() {
    return navToggle && getComputedStyle(navToggle).display !== 'none';
  }

  function openDropdown() {
    if (!policiesTrigger || !policiesDropdown) {
      return;
    }
    policiesTrigger.setAttribute('aria-expanded', 'true');
    policiesDropdown.removeAttribute('hidden');
    if (dropdownCloseTimer) {
      clearTimeout(dropdownCloseTimer);
      dropdownCloseTimer = null;
    }
  }

  function closeDropdown() {
    if (!policiesTrigger || !policiesDropdown) {
      return;
    }
    policiesTrigger.setAttribute('aria-expanded', 'false');
    policiesDropdown.setAttribute('hidden', '');
  }

  function scheduleClose() {
    dropdownCloseTimer = setTimeout(closeDropdown, 150);
  }

  function cancelClose() {
    if (dropdownCloseTimer) {
      clearTimeout(dropdownCloseTimer);
      dropdownCloseTimer = null;
    }
  }

  // Desktop hover with ~150ms close grace period
  if (policiesTrigger && policiesDropdown) {
    policiesTrigger.addEventListener('mouseenter', function () {
      cancelClose();
      openDropdown();
    });
    policiesTrigger.addEventListener('mouseleave', function () {
      scheduleClose();
    });
    policiesDropdown.addEventListener('mouseenter', function () {
      cancelClose();
    });
    policiesDropdown.addEventListener('mouseleave', function () {
      scheduleClose();
    });

    // Keyboard: Enter/Space navigates to #policies; ArrowDown opens dropdown + focuses first item
    policiesTrigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isMobileView()) {
          toggleMobilePolicies();
        } else {
          activateTab('policies');
          setHash('policies');
        }
        closeDropdown();
        return;
      }
      if (e.key === 'ArrowDown' && !isMobileView()) {
        e.preventDefault();
        openDropdown();
        var firstItem = policiesDropdown.querySelector('a');
        if (firstItem) {
          firstItem.focus();
        }
      }
    });

    // Keyboard nav within dropdown items
    policiesDropdown.addEventListener('keydown', function (e) {
      var items = Array.from(policiesDropdown.querySelectorAll('a'));
      var index = items.indexOf(e.target);
      if (index === -1) {
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        var next = items[(index + 1) % items.length];
        if (next) {
          next.focus();
        }
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        var prev = items[(index - 1 + items.length) % items.length];
        if (prev) {
          prev.focus();
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
        policiesTrigger.focus();
      }
    });
  }

  // Mobile accordion for Policies row
  function toggleMobilePolicies() {
    if (!policiesTrigger || !policiesDropdown) {
      return;
    }
    var expanded = policiesTrigger.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      closeDropdown();
    } else {
      openDropdown();
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
      closeDropdown();
      scrollToPolicy();
      return;
    }

    if (TABS.indexOf(hash) !== -1) {
      activateTab(hash || 'home');
      closeDropdown();
      return;
    }

    activateTab('home');
    closeDropdown();
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
        closeDropdown();
        scrollToPolicy();
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

    // Policies trigger click
    var trigger = e.target.closest('#policies-trigger, .nav-dropdown-trigger');
    if (trigger) {
      e.preventDefault();
      if (isMobileView()) {
        toggleMobilePolicies();
      } else {
        activateTab('policies');
        setHash('policies');
      }
      return;
    }

    // Outside click closes dropdown and mobile menu
    if (!siteNav.contains(e.target)) {
      closeDropdown();
      hideMobileMenu();
    }
  });

  /* ---------- mobile menu ---------- */
  navToggle.addEventListener('click', function () {
    var open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    siteNav.setAttribute('data-open', String(!open));
    closeDropdown();
  });

  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      hideMobileMenu();
      closeDropdown();
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
