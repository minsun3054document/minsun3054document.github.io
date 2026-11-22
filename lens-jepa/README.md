# LeNS-JEPA project page

Open `index.html` directly in a browser, or serve the folder:

    cd project_page && python3 -m http.server 8000   # then open http://localhost:8000

Local source for https://minsun3054document.github.io/lens-jepa/.
The folder is self-contained and can be uploaded to the existing GitHub Pages repository.
Paper and code buttons retain their existing “soon” state.

The content was refreshed on 2026-11-20 from the confirmed LeNS-JEPA manuscript.
The abstract is reproduced verbatim, with LaTeX converted to HTML and inline math.
Teaser, method overview, plug-in results, learned masks, robustness,
and planning examples are exported directly from the paper PDFs; matching PDF
copies are included beside the PNGs. The numerical tables retain the confirmed
paper results, including the component ablation. Native recoloring, new seed studies, and reviewer-preparation material are not included in the page. The original mask-training videos, mask frame gallery, and training statistics are retained.

The 26-second overview and three simultaneously visible task comparisons lead the page. Compact main-paper gains follow them. Planning videos, learned-mask evolution, and a gallery across all three base models precede the numerical results. The primary results link remains available.

The public demo and gallery focus on selected successful comparisons, with a replay button and explicit panel labels. Nine representative clips (three tasks for each base model) play as they enter view; the full filtered gallery initially shows 18 clips and adds 18 with “Show more clips”. Opening a tile reveals playback controls, full 50-query condition metrics, and clip provenance. All recorded video assets and source manifests, including archived reverse-outcome examples, are unchanged. Lazy source loading and viewport/tab visibility pause keep offscreen videos from playing; opening a video pauses the other players.

The mask section restores the original four videos (TwoRoom, PushT, Reacher, and all three), model/task tabs for validation-frame examples, and the training-statistics plot. Mask videos animate saved scorer checkpoints on three fixed validation frames per task; they are not masks applied during inference. The epoch label identifies the checkpoint; the curve shows masked-patch fraction in training batches. All clips cover 10 training epochs; final update counts come from the existing mask manifest (TwoRoom 51,380; PushT 139,330; Reacher 127,960).

The deployment target is the `lens-jepa/` folder on the `main` branch of
`minsun3054document/minsun3054document.github.io`. This standalone folder is the
editable local source; publishing commits its files to that existing repository.

## Contents
- `index.html`, `static/css/style.css`, `static/js/main.js`: the page.
- `static/js/data.js`: confirmed planning success and per-shift results. Relative mean changes use task-level values before rounding the displayed means.
- `static/js/manifest.js`: video lists built by a local build script from `static/videos/manifest.json` and `static/videos/mask/mask_manifest.json`.
- `static/images/`: current paper figures, exported directly from the corresponding vector PDFs.
- `static/videos/demo|failure/`: replays of the recorded test-time actions (LeWM vs LeWM + LeNS-JEPA), one clip per task and shift, chosen by a fixed rule (first test query where LeNS-JEPA succeeds and LeWM fails; failure/ = the reverse). Replay fidelity and selection rules are recorded in the manifests.
- External: Google Fonts (Inter, Space Grotesk, JetBrains Mono) and KaTeX 0.16.9 from jsDelivr.

## Local showcase update — 2026-11-22 KST

The submitted abstract, all measured result data, paper figure assets, and recorded videos are preserved. Web-only summary wording uses “encourages complementary roles” and “same inference architecture”; it does not claim complete nuisance factorization or measured zero latency. The video-first refresh uses the existing GitHub Pages URL and retains the original mask players, task comparisons, and model-filtered gallery.
