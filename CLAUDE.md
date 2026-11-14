# Gridlock City (this repo)

The game is `index.html` (page, styles, menus) plus its script split into `js/01-core-map.js` … `js/09-menu.js` (with `js/08b-extras.js` between 08 and 09), loaded in order as
plain classic scripts (no build step; they share one global scope). Also `sw.js`, `manifest.json`, `version.json`. `2d.html` is the old top-down version.

**Load order matters across files:** a function declaration is only hoisted within its own file. Anything a file calls *while it
loads* (generation code, IIFEs) must already be defined in that file or an earlier one; `let`/`const` from a later file can't be
touched at load time either. After moving code, load the page and check the console. New script files go in `sw.js` ASSETS too.

`js/08b-extras.js` holds the v4.20 additions (PS2 look, key/pad remapping, debug menu and free camera, RC Wreckers, off-road runs,
the Dodo plane, unique stunt jumps, criminal rating). It hooks into the other files through a few one-line calls (`extrasTick`, `extrasHUD`,
`extrasMap`, `planeDrive`, `rcDrive`, `usjLaunch`/`usjLand`, `ps2Look`, `pedRim`); its progress lives in `STATS`, so it saves with the stats.
Key presses pass through its capture listener first, which rewrites `e.code` to the bound action: read `e.code`/`kd.*` as usual and remapping keeps working.

## Before touching anything that gets drawn
Read the **RENDERING RULES** block at the top of `js/08-render.js` (the `RENDER: PSEUDO-3D CHASE CAMERA` section).
There is no depth buffer, so draw order is depth. Past bugs from breaking those rules: see-through ambulance,
windshield glass showing through the bus and SWAT van roofs, the player vanishing on the El stairs.

## Climbable things
Everything the player can stand on is a walk surface in `WALKS` (plus building roofs via `bldAt`/`roofAbs`, car roofs
and the El train in `footFloor`). Roof ladders are a climbing state (`climbPre`/`climbPost`, `LADDERS`), not walk surfaces. Rules 8 and 9 of the RENDERING RULES cover keeping walk surfaces and visuals in step.
To test climbing, set keys (`keys.KeyW=true`) and step the game with `update(1/60)` in a loop while logging `player.jz`.

## Checking visuals
Run `python3 tests/smoke.py` (it loads the game headless and checks the core systems). For visuals, load `index.html` in headless Chrome (Playwright), call `newGame()`, then for a still shot set `game.paused=true`,
place the camera (`cam.x/cam.y/cam.yaw/cam.h`, `cam.gz=GH(cam.x,cam.y)`, `setCam()`) and screenshot. Look at new
vehicles and props from the front, back, both sides, from above, and at night (`clock=0.95`; noon is `clock=0.5`).
The city seed is random per browser profile, so place things relative to `hospitalSpawn` or a block index.

## City generation
Generation uses the seeded `R()` stream. Adding calls to `R()`/`pick()`/`rr()` inside generation changes the
whole city for every saved seed and moves the hidden packages in old saves. New generation steps use their own
seeded stream (see `livedIn()` after `genMap()`).

## Releasing
Bump `VERSION` (top of `js/01-core-map.js`), the `#verTxt` text in `index.html`, `version.json` (version + one-line notes) and the cache name in
`sw.js`; update the README features list. GitHub Pages serves `main`.
