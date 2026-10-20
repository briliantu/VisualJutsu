# Seal practice guide

## The twelve seals

Each in-app lesson includes an original diagram, three short pose-building steps, an orientation note, and a camera-positioning tip.

| Seal | Guide cue |
| --- | --- |
| Dragon | Join hands upright and place the left thumb over the right |
| Tiger | Press palms together and point the thumbs upward |
| Dog | Lay the left hand flat across the right fist |
| Rat | Join hands upright and keep the left thumb on the outside |
| Ram | Join hands vertically and rest the left thumb on top |
| Horse | Bring the index fingers together to make a triangle |
| Monkey | Hold hands horizontally with thumbs over the little fingers |
| Bird | Touch fingertips together at a peaked angle |
| Ox | Lay the right hand horizontally across the upright left hand |
| Serpent | Join hands and show the left thumb on the outside |
| Hare | Curl the fingers gently and keep the little fingers apart |
| Boar | Interlace the hands and keep the wrists comfortable |

These are concise teaching cues derived from the user-provided visual references. Hand anatomy and camera angle can vary; use the illustrated in-app guide and adjust until the pose is comfortable and clearly visible.

## App sequences

The six original elemental techniques use these three-seal sequences:

| Technique | Element | Sequence |
| --- | --- | --- |
| Ember Crown | Fire | Dragon → Tiger → Ram |
| Tempest Thread | Wind | Horse → Bird → Rat |
| Mirror Tide | Water | Serpent → Monkey → Hare |
| Stonewake | Earth | Ox → Dog → Boar |
| Wisp Gate | Spirit | Bird → Serpent → Tiger |
| Starfall Seal | Cosmos | Dragon → Hare → Monkey |

## Teach a pose to the camera

Seal shapes are complex and often similar. The app does not assume that it can recognize these twelve named poses out of the box. Instead, each person teaches a seal using the current camera and their own hands:

1. Open the site from `localhost` or an HTTPS origin and allow camera access.
2. Select **Teach** or **Reteach** on a seal card.
3. Match the pose shown in the lesson. Keep both hands in frame and hold steady until the progress indicator completes.
4. Repeat for every seal in the selected technique's sequence.
5. Start **Practice this sequence**, then hold each taught pose to advance.

Calibration uses normalized landmark coordinates from MediaPipe hand tracking. Samples are stored in this browser's local storage, not as photographs or video. Re-teach a pose if the camera angle, lighting, or hand positioning changes substantially.

The pose matcher is an experimental, single-example nearest-neighbor classifier. Similar poses may be confused; if a seal is recognized incorrectly, re-teach it with a clear camera view and check that it is distinct from the other saved samples. Comfortable hand positioning and good lighting improve tracking. Stop if a pose causes discomfort.
