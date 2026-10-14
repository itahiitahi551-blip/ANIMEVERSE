# ANIMEVERSE

A mobile-friendly, browser-based anime-inspired 3D world built with Three.js.

## Current prototype
- Responsive Arabic (RTL) interface.
- Procedural stylized 3D character.
- Japanese-inspired garden scene with a path, pond, trees, lanterns, and a torii gate.
- Touch-friendly orbit camera and pinch zoom.
- Character rotation, camera distance, idle motion toggle, wave action, and reset controls.
- No build step required; Three.js modules are loaded from jsDelivr.

## Run locally
Serve the repository root using any static HTTP server, then open the local URL in a modern browser. ES modules and the import map generally do not work reliably when opening `index.html` directly through a `file://` URL.

## Deploy with GitHub Pages
1. Open **Settings → Pages**.
2. Choose **Deploy from a branch**.
3. Select branch `main` and folder `/(root)`.
4. Save and wait for the deployment to finish.

The site URL should be `https://itahiitahi551-blip.github.io/ANIMEVERSE/`.

## Project layout
- `index.html` — app entry and interface markup.
- `src/main.js` — Three.js scene, character, camera, and interactions.
- `src/style.css` — responsive styling and layout.

## Roadmap
1. Improve character proportions, face, and hair.
2. Add articulated joints and more animation states.
3. Add character customization and selectable environments.
4. Improve performance and accessibility on lower-end phones.

## Notes
This is an early procedural prototype, not a production-ready rigged character. An internet connection is required to load Three.js and the web font from their CDNs.
