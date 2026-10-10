# The Soul — An Interactive Film

Based on **THE SOUL THAT NEITHER HEAVEN NOR HELL COULD CLAIM**.

## Open the film

1. Extract the ZIP.
2. Keep the entire **Soul-Cinema** folder together.
3. Open **index.html** in a current desktop browser.
4. Choose **Enter the story**.

No installation, API key, account, build step, or internet connection is required for the visuals, story, or ambient sound. Narration uses your browser's speech synthesis; available voices and whether they work offline depend on your device.

On a phone, open the folder through a static web host or a local web server. Mobile file preview applications may not run JavaScript or load adjacent files.

## Controls

- Play / pause: the round button, or Space when a control is not focused.
- Previous / next scene: arrows, keyboard Left / Right, or swipe on the story.
- Chapters: jump to any of the seven chapters or the epilogue.
- Read story: view the complete original text.
- Sound: toggle a gentle synthesized ambient drone.
- Voice: toggle optional English browser narration.
- Motion: stop decorative animation. The operating system's reduced motion preference is respected on startup.
- Fullscreen: supported in browsers that provide the Fullscreen API.

The original Markdown is included unchanged as **story.md**. All 145 scenes preserve the original paragraph order. This is an illustrated interactive story, with original still artwork, camera movement, a real rotating WebGL wireframe soul, projected orbital rings, and drifting particles. It is not a rendered video or a full character animation production.

God's presence is represented through light rather than a physical figure. The dialogue is part of the supplied imagined tale.

## Folder

- index.html — cinematic interface and reading dialogs
- style.css — responsive design, atmosphere, and camera movement
- app.js — playback, narration, audio, controls, WebGL, and particles
- story.js — all story chapters and scene data, loaded without fetch
- story.md — original source
- images/ — three original cinematic illustrations and a grain texture
- ART_DIRECTION.md — image briefs

## Editing

Change the story paragraphs and beats in story.js to change playback. story.md is the source reference; changing it alone does not rebuild story.js. The artwork paths are local, and the page has no external libraries, fonts, trackers, or CDN dependencies.

## Verification

JavaScript syntax, original paragraph coverage, local asset references, and playback interactions were checked. Browser rendering and device-specific narration have not been visually verified in this environment.
