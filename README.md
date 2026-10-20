# Sealcraft

Sealcraft is a small, browser-only hand-seal learning and practice studio. Read an illustrated guide for each of twelve seals, teach the camera your own hand poses, and practice six original three-seal elemental techniques with live visual effects and synthesized sound.

> **Important:** Hand-pose recognition is experimental and needs to be calibrated for each person. The website does not reliably know the twelve seal names before you teach it your poses.

## Features

- Twelve original, illustrated hand-seal lessons with pose steps, orientation notes, and camera tips.
- A **Study all 12 lessons** path with previous/next navigation and optional browser text-to-speech.
- Two-hand webcam tracking with an on-screen hand-landmark overlay.
- Per-seal **Teach/Reteach** calibration using your own hand poses.
- Six original effects, each with its own three-seal sequence, animation palette, and generated sound:

  | Technique | Element | Seal sequence |
  | --- | --- | --- |
  | Ember Crown | Fire | Dragon → Tiger → Ram |
  | Tempest Thread | Wind | Horse → Bird → Rat |
  | Mirror Tide | Water | Serpent → Monkey → Hare |
  | Stonewake | Earth | Ox → Dog → Boar |
  | Wisp Gate | Spirit | Bird → Serpent → Tiger |
  | Starfall Seal | Cosmos | Dragon → Hare → Monkey |

- Guided practice that keeps the current seal illustration and instructions beside the camera.
- Responsive desktop and mobile layouts, reduced-motion styling, sound controls, and an explicit camera stop control.

## Run locally

There is no build step or project package installation. The site uses native JavaScript modules and loads hand tracking from a CDN, so keep an internet connection available.

1. Clone or download this repository.
2. Serve the repository root from `localhost` (opening `index.html` directly with `file://` will not work reliably with browser modules and camera permissions).
3. Open the local URL in a current version of Chrome or Edge and allow camera access.

For example, from the repository folder run:

```powershell
py -m http.server 8000
```

Or, if Python is installed as `python`:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000>. A VS Code static-server extension is another option. Webcam access requires `localhost` or HTTPS, a working webcam, and the browser's camera permission.

## Learn a seal

1. Open **Study all 12 lessons** or select **Learn** on an individual seal card.
2. Review its original pose drawing, orientation, three short steps, and camera tip. Use **Read guide aloud** where browser speech synthesis is available.
3. The guide cues are based on the labels and written pose notes in the two reference images supplied for this project. The supplied anime/manga panels themselves are **not** bundled in this repository; all twelve diagrams in `assets/seals/` are original, simplified illustrations.

For the complete pose cue list and limitations, see [`docs/SEAL-PRACTICE.md`](docs/SEAL-PRACTICE.md) and [`assets/seals/README.md`](assets/seals/README.md).

## Calibrate and practice

1. Select **Enter the dojo** and allow camera access.
2. Select **Teach** on a seal card. Match its guide with both hands visible, then hold the pose steady while the camera gathers samples.
3. Teach all three seals shown in your chosen technique's sequence. Re-teach them if your lighting, camera angle, or hand position changes.
4. Select a technique and press **Practice this sequence**. The in-camera practice card shows the current seal and advances when a saved pose is recognized.
5. Hold each recognized seal steady until the progress bar fills. Complete all three to trigger the original effect.

Training captures a single averaged example per seal. Similar poses can be confused. If recognition is inconsistent, re-teach the seal in good lighting, with both hands separated enough for the camera to see their shape. These guides are practice aids; stop if a pose feels uncomfortable.

## GitHub Pages

This is a static website and can be deployed from GitHub Pages without a build command:

1. Push the repository to GitHub.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the branch containing the site and the `/ (root)` folder, then save.
5. Open the published HTTPS site and allow camera access.

The page uses relative paths for its stylesheets, modules, and illustrations. Keep `index.html`, JavaScript/CSS files, and the `assets/` folder in the repository root structure when deploying.

## Privacy and external services

- Camera frames are read locally by the browser for hand tracking. The app does not record or upload camera video.
- Learned hand-pose landmark samples are saved in this browser's local storage under `sealcraft-seal-profiles`. They are not images or video. Clearing this site's browser storage removes the samples.
- The app downloads MediaPipe Tasks Vision from jsDelivr and its hand-landmarker model from Google Cloud Storage. Fonts load from Google Fonts. The app requires a network connection for those resources.
- This project does not contain Naruto footage, manga panels, or the anime soundtrack. The visual effects and Web Audio sound are original to this demo.

## Project structure

```text
.
├── index.html                  Main studio and tutorial dialog
├── app.js                      Webcam, calibration, sequence, and effects
├── seal-guides.js              Twelve lesson texts and illustration paths
├── seal-tutorial.js            Accessible tutorial dialog and speech
├── styles.css                  Main responsive studio styles
├── tutorial.css                Tutorial dialog styles
├── assets/
│   ├── sealcraft-mark.svg      Favicon
│   └── seals/                  Twelve original seal diagrams
├── docs/
│   └── SEAL-PRACTICE.md        Reference cues and calibration details
└── README.md
```

## License and references

No software license has been added yet. Unless a license is added, GitHub publication does not grant general permission to reuse or redistribute this project's code and original artwork. The user-supplied reference images are not included in the repository. See [`docs/SEAL-PRACTICE.md`](docs/SEAL-PRACTICE.md) for the project's reference-based descriptions.
