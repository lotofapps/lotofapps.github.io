# LotOfApps

Simple, privacy-friendly Android apps. This is the static landing page for the LotOfApps indie developer brand, built to be hosted on GitHub Pages.

## Tech stack

Plain HTML + CSS + vanilla JavaScript. No frameworks, no build step, no npm, no external JavaScript libraries. The only external resource is the Inter font from Google Fonts (`display=swap`).

## Files

- `index.html` — page shell, navigation, tab panels, policy containers
- `styles.css` — layout, theming (light/dark via CSS custom properties), typography
- `script.js` — client-side tab routing, hash deep linking, theme toggle, mobile menu
- `README.md` — this file

## GitHub Pages deployment

1. Push this folder to a GitHub repository on the `main` branch.
2. In the repository, go to **Settings → Pages**.
3. Under "Build and deployment" > "Source", select **Deploy from a branch**.
4. Choose branch `main` and folder `/ (root)`, then save.
5. The site publishes at `https://<user>.github.io/<repo>/`.

## Direct privacy policy URL (Google Play Console)

Submit this URL as the NoteApt privacy policy link:

```
https://<user>.github.io/<repo>/#noteapt-privacy
```

On a fresh page load this opens the **Policies** tab and scrolls directly to the NoteApt policy section. The section currently contains a placeholder only; the actual NoteApt Privacy Policy text will be inserted in a follow-up task. No privacy policy text is included in this release.

## Adding a future app

Three spots are marked with HTML comments:

1. **App card** — copy the `.app-card` block in `#panel-apps .app-grid` (TODO comment included).
2. **Submenu chip** — add an `<li><a href="#<slug>-privacy" data-policy="<slug>">...</a></li>` in `#policy-submenu` (commented template included).
3. **Policy section** — add a `<section id="<slug>-privacy" class="policy-document">` below the NoteApt section (commented template included), and register `#<slug>-privacy` in the `POLICY_ANCHORS` map in `script.js`.

## Theming

Colors are CSS custom properties on `:root` (light theme) and `[data-theme="dark"]`. The theme is initialized from `prefers-color-scheme`, can be toggled with the sun/moon button in the header, and is persisted in `localStorage`. No cookies or trackers are used.

## Local development

Open `index.html` directly in a browser, or serve the folder with any static file server. All asset paths are relative, so the page works both locally and under a GitHub Pages project subpath.
