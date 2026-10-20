import { FilesetResolver, HandLandmarker, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
import { sealGuides } from "./seal-guides.js";
import { createSealTutorial } from "./seal-tutorial.js";

const video = document.querySelector("#cameraVideo");
const canvas = document.querySelector("#effectsCanvas");
const context = canvas.getContext("2d");
const startButton = document.querySelector("#startCamera");
const cameraStage = document.querySelector("#cameraStage");
const cameraEmpty = document.querySelector("#cameraEmpty");
const loadingState = document.querySelector("#loadingState");
const statusPill = document.querySelector("#headerStatus");
const detectionIndicator = document.querySelector("#detectionIndicator");
const detectionText = document.querySelector("#detectionText");
const cameraMode = document.querySelector("#cameraMode");
const sequenceCount = document.querySelector("#sequenceCount");
const mobileSequenceCount = document.querySelector("#mobileSequenceCount");
const sequenceHint = document.querySelector("#sequenceHint");
const sequenceSlots = [...document.querySelectorAll(".sequence-slot")];
const spellCards = [...document.querySelectorAll(".spell-card")];
const sealGrid = document.querySelector("#sealGrid");
const learnedCount = document.querySelector("#learnedCount");
const soundToggle = document.querySelector("#soundToggle");
const handLabel = document.querySelector("#handLabel");
const castBanner = document.querySelector("#castBanner");
const castName = document.querySelector("#castName");
const toast = document.querySelector("#toast");
const holdProgress = document.querySelector("#holdProgress");
const stopCameraButton = document.querySelector("#stopCamera");
const trainingBanner = document.querySelector("#trainingBanner");
const trainingTitle = document.querySelector("#trainingTitle");
const trainingMessage = document.querySelector("#trainingMessage");
const practiceButton = document.querySelector("#practiceSequence");
const practiceCard = document.querySelector("#practiceCard");
const practiceClose = document.querySelector("#practiceClose");
const practiceImage = document.querySelector("#practiceImage");
const practiceTitle = document.querySelector("#practiceTitle");
const practiceCue = document.querySelector("#practiceCue");
const practiceCounter = document.querySelector("#practiceCounter");
const practiceLearn = document.querySelector("#practiceLearn");
const drawingUtils = new DrawingUtils(context);

const seals = [
  ["dragon", "Dragon"],
  ["tiger", "Tiger"],
  ["dog", "Dog"],
  ["rat", "Rat"],
  ["ram", "Ram"],
  ["horse", "Horse"],
  ["monkey", "Monkey"],
  ["bird", "Bird"],
  ["ox", "Ox"],
  ["serpent", "Serpent"],
  ["hare", "Hare"],
  ["boar", "Boar"],
];
const sealNames = Object.fromEntries(seals);
const sequences = {
  ember: ["dragon", "tiger", "ram"],
  tempest: ["horse", "bird", "rat"],
  mirror: ["serpent", "monkey", "hare"],
  stone: ["ox", "dog", "boar"],
  wisp: ["bird", "serpent", "tiger"],
  starfall: ["dragon", "hare", "monkey"],
};
const spellNames = {
  ember: "Ember crown",
  tempest: "Tempest thread",
  mirror: "Mirror tide",
  stone: "Stonewake",
  wisp: "Wisp gate",
  starfall: "Starfall seal",
};
const spellColors = {
  ember: "#ffad67",
  tempest: "#a5e8d4",
  mirror: "#83c9f1",
  stone: "#e0bd8a",
  wisp: "#d1a7ff",
  starfall: "#f5da8d",
};
const HOLD_DURATION = 520;
let selectedSpell = "ember";
let handLandmarks = null;
let detector = null;
let stream = null;
let lastVideoTime = -1;
let stableGesture = "";
let stableSince = 0;
let previousGesture = "";
let progress = [];
let soundEnabled = true;
let audioContext = null;
let toastTimeout = 0;
let castTimeout = 0;
let particles = [];
let lastFrame = 0;
let animationFrame = 0;
let castEffect = null;
let isCasting = false;
let sequenceTimeout = 0;
let trainingSession = null;
let handSets = [];
let matchedSeal = null;
let sealProfiles = loadSealProfiles();
let practiceMode = false;
const sealTutorial = createSealTutorial(beginSealTraining);

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  canvas.width = Math.round(bounds.width);
  canvas.height = Math.round(bounds.height);
  context.setTransform(1, 0, 0, 1, 0, 0);
}

function updatePracticeCard() {
  const sequence = sequences[selectedSpell];
  const currentIndex = Math.min(progress.length, sequence.length - 1);
  const guide = sealGuides[sequence[currentIndex]];
  practiceCard.hidden = false;
  practiceImage.src = guide.image;
  practiceImage.alt = `Diagram: ${guide.name} hand seal`;
  practiceTitle.textContent = `${guide.name} seal`;
  practiceCue.textContent = `${guide.orientation}. ${guide.steps[0]}`;
  practiceCounter.textContent = `STEP ${currentIndex + 1} / ${sequence.length}`;
}

function loadSealProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem("sealcraft-seal-profiles") || "{}");
    if (stored && typeof stored === "object" && !Array.isArray(stored)) return stored;
  } catch (error) {
    console.error("Could not load saved hand-seal samples:", error);
  }
  return {};
}

function saveSealProfiles() {
  try {
    localStorage.setItem("sealcraft-seal-profiles", JSON.stringify(sealProfiles));
  } catch (error) {
    console.error("Could not save hand-seal samples:", error);
    showToast("Could not save this hand seal in your browser.");
  }
}

function renderSealLibrary() {
  sealGrid.innerHTML = "";
  seals.forEach(([id, name], index) => {
    const card = document.createElement("article");
    card.className = `seal-card${sealProfiles[id] ? " taught" : ""}`;
    card.dataset.seal = id;
    const ordinal = String(index + 1).padStart(2, "0");
    card.innerHTML = `<span class="seal-ordinal">${ordinal}</span><img class="seal-thumb" src="${sealGuides[id].image}" alt="" loading="lazy"><strong>${name}</strong><span class="seal-state">${sealProfiles[id] ? "✓ TAUGHT" : "NOT TAUGHT"}</span><span class="seal-card-actions"><button class="seal-learn" type="button">LEARN</button><button class="seal-teach" type="button">${sealProfiles[id] ? "RETEACH" : "TEACH"}</button></span>`;
    card.querySelector(".seal-learn").addEventListener("click", () => sealTutorial.open(id));
    card.querySelector(".seal-teach").addEventListener("click", () => beginSealTraining(id));
    sealGrid.append(card);
  });
  learnedCount.textContent = `${seals.filter(([id]) => sealProfiles[id]).length} / 12 TAUGHT`;
}

function setProgress(nextProgress) {
  progress = nextProgress;
  sequenceCount.textContent = `${progress.length} / 3`;
  mobileSequenceCount.textContent = `${progress.length} / 3`;
  const sequence = sequences[selectedSpell];
  sequenceSlots.forEach((slot, index) => {
    const id = sequence[index];
    const isTaught = Boolean(sealProfiles[id]);
    slot.querySelector("b").textContent = sealNames[id].slice(0, 3).toUpperCase();
    slot.classList.toggle("done", index < progress.length);
    slot.classList.toggle("active", index === progress.length);
    slot.classList.toggle("needs-teaching", !isTaught);
    slot.title = `${sealNames[id]}${isTaught ? " · taught" : " · teach this seal first"}`;
    slot.setAttribute("aria-label", `Step ${index + 1}: ${sealNames[id]}${isTaught ? ", taught. Open tutorial." : ", not taught yet. Open tutorial."}`);
    slot.onclick = () => sealTutorial.open(id);
  });
  if (progress.length === 0) {
    const firstSeal = sequence[0];
    sequenceHint.textContent = sealProfiles[firstSeal]
      ? `Start with ${sealNames[firstSeal]}.`
      : `Teach ${sealNames[firstSeal]} below, then start the sequence.`;
  } else if (progress.length < 3) {
    const nextSeal = sequence[progress.length];
    sequenceHint.textContent = sealProfiles[nextSeal]
      ? `Next: ${sealNames[nextSeal]}.`
      : `Next, teach the ${sealNames[nextSeal]} seal below.`;
  }
  else sequenceHint.textContent = "Sequence complete.";
  holdProgress.style.transform = "scaleX(0)";
  if (practiceMode && progress.length < 3) updatePracticeCard();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function describeHands(hands) {
  if (!hands || hands.length !== 2) return null;
  const ordered = [...hands].sort((first, second) => first[0].x - second[0].x);
  const palmScales = ordered.map((landmarks) => {
    const wrist = landmarks[0];
    return Math.max(...[5, 9, 13, 17].map((index) =>
      Math.hypot(landmarks[index].x - wrist.x, landmarks[index].y - wrist.y)
    ));
  });
  const scale = (palmScales[0] + palmScales[1]) / 2;
  const feature = [];
  ordered.forEach((landmarks, handIndex) => {
    const wrist = landmarks[0];
    const handScale = palmScales[handIndex];
    landmarks.forEach((point) => {
      feature.push(
        (point.x - wrist.x) / handScale,
        (point.y - wrist.y) / handScale,
        (point.z - wrist.z) / handScale
      );
    });
  });
  feature.push(
    (ordered[1][0].x - ordered[0][0].x) / scale,
    (ordered[1][0].y - ordered[0][0].y) / scale,
    (ordered[1][0].z - ordered[0][0].z) / scale
  );
  return feature;
}

function identifySeal(feature) {
  if (!feature) return null;
  const ranked = Object.entries(sealProfiles)
    .filter(([, sample]) => Array.isArray(sample) && sample.length === feature.length)
    .map(([id, sample]) => ({
      id,
      distance: Math.sqrt(sample.reduce((total, value, index) => total + (value - feature[index]) ** 2, 0) / sample.length),
    }))
    .sort((first, second) => first.distance - second.distance);
  if (!ranked.length || ranked[0].distance > 0.27) return null;
  if (ranked.length > 1 && ranked[1].distance - ranked[0].distance < 0.018) return null;
  return ranked[0].id;
}

function beginSealTraining(id) {
  if (!detector) {
    showToast("Enter the dojo first, then teach this seal with both hands in view.");
    return;
  }
  practiceMode = false;
  practiceButton.setAttribute("aria-pressed", "false");
  practiceCard.hidden = true;
  trainingSession = { id, startedAt: 0, samples: [] };
  setProgress([]);
  isCasting = false;
  stableGesture = "";
  previousGesture = "";
  sealGrid.querySelectorAll(".seal-card").forEach((card) => {
    const selected = card.dataset.seal === id;
    card.classList.toggle("training", selected);
    card.setAttribute("aria-pressed", String(selected));
  });
  trainingTitle.textContent = `Teach the ${sealNames[id]} seal`;
  trainingMessage.textContent = "Show its hand pose clearly to the camera";
  trainingBanner.hidden = false;
  showToast(`Show the ${sealNames[id]} pose in the camera and hold it steady.`);
}

function registerGesture(gesture, now) {
  if (isCasting) return;

  if (gesture !== stableGesture) {
    stableGesture = gesture;
    stableSince = now;
  }

  const holdTime = now - stableSince;
  holdProgress.style.transform = `scaleX(${Math.min(holdTime / HOLD_DURATION, 1)})`;
  handLabel.textContent = `HOLD STEADY · ${Math.min(Math.round(holdTime / HOLD_DURATION * 100), 100)}%`;
  if (holdTime < HOLD_DURATION || gesture === previousGesture) return;

  previousGesture = gesture;
  const expected = sequences[selectedSpell][progress.length];
  if (gesture === expected) {
    setProgress([...progress, gesture]);
    if (progress.length === 3) {
      practiceMode = false;
      practiceButton.setAttribute("aria-pressed", "false");
      practiceCard.hidden = true;
      castSpell();
    }
  } else if (gesture === sequences[selectedSpell][0]) {
    setProgress([gesture]);
    showToast("Sequence restarted — keep going.");
  } else {
    setProgress([]);
    sequenceHint.textContent = "Seal mismatch. Start the sequence again.";
    showToast("That seal did not match. Your sequence has reset.");
  }
}

function drawHand(landmarks) {
  if (!landmarks) return;
  handSets.forEach((hand) => {
    context.save();
    context.lineWidth = 2;
    context.strokeStyle = spellColors[selectedSpell];
    context.shadowColor = spellColors[selectedSpell];
    context.shadowBlur = 8;
    drawingUtils.drawConnectors(hand, HandLandmarker.HAND_CONNECTIONS, { color: `${spellColors[selectedSpell]}c9`, lineWidth: 2 });
    drawingUtils.drawLandmarks(hand, { color: "#fff3df", fillColor: spellColors[selectedSpell], lineWidth: 1, radius: 2.1 });
    context.restore();
  });
}

function emitParticles(now) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const center = handLandmarks?.[9];
  const x = center ? center.x * width : width * 0.5;
  const y = center ? center.y * height : height * 0.5;
  const color = spellColors[selectedSpell];
  for (let i = 0; i < 150; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.6 + Math.random() * (selectedSpell === "stone" ? 6.2 : 4.2);
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (selectedSpell === "ember" || selectedSpell === "starfall" ? 1.2 : 0),
      size: 1 + Math.random() * 4,
      born: now,
      life: 800 + Math.random() * 900,
      color,
      shape: selectedSpell === "stone" ? "shard" : selectedSpell === "starfall" ? "star" : "orb",
    });
  }
  castEffect = { spell: selectedSpell, start: now };
  cameraStage.classList.add("cast-flash");
  window.setTimeout(() => cameraStage.classList.remove("cast-flash"), 240);
}

function playAudioUnlock() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext ??= new AudioContextClass();
  if (audioContext.state === "suspended") {
    audioContext.resume().catch((error) => console.error("Could not enable cast audio:", error));
  }
}

function playCastSound() {
  if (!soundEnabled) return;
  playAudioUnlock();
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const notesBySpell = {
    ember: [164.81, 246.94, 369.99, 493.88],
    tempest: [196, 293.66, 440, 587.33],
    mirror: [220, 329.63, 440, 659.25],
    stone: [110, 146.83, 220, 293.66],
    wisp: [261.63, 392, 523.25, 783.99],
    starfall: [174.61, 261.63, 392, 587.33],
  };
  const notes = notesBySpell[selectedSpell];
  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    oscillator.type = selectedSpell === "stone" ? "sine" : index === 0 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.09);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (selectedSpell === "stone" ? 1.06 : 1.42), now + index * 0.09 + 0.32);
    gain.gain.setValueAtTime(0.0001, now + index * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.09 / (index + 1), now + index * 0.09 + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.09 + 0.78);
    filter.type = "lowpass";
    filter.frequency.value = selectedSpell === "stone" ? 700 : 3600;
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now + index * 0.09);
    oscillator.stop(now + index * 0.09 + 0.8);
  });

  const duration = 0.32;
  const noiseBuffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
  const samples = noiseBuffer.getChannelData(0);
  for (let i = 0; i < samples.length; i += 1) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
  const noise = audioContext.createBufferSource();
  const noiseFilter = audioContext.createBiquadFilter();
  const noiseGain = audioContext.createGain();
  noise.buffer = noiseBuffer;
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = selectedSpell === "stone" ? 240 : selectedSpell === "mirror" ? 1250 : 1900;
  noiseFilter.Q.value = 0.7;
  noiseGain.gain.setValueAtTime(0.055, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audioContext.destination);
  noise.start(now);
  noise.stop(now + duration);
}

function castSpell() {
  isCasting = true;
  cameraStage.dataset.technique = selectedSpell;
  castName.textContent = spellNames[selectedSpell];
  castBanner.classList.add("show");
  emitParticles(performance.now());
  playCastSound();
  window.clearTimeout(castTimeout);
  castTimeout = window.setTimeout(() => castBanner.classList.remove("show"), 2100);
  window.clearTimeout(sequenceTimeout);
  sequenceTimeout = window.setTimeout(() => {
    setProgress([]);
    isCasting = false;
  }, 1150);
}

function drawTechnique(now) {
  if (!castEffect) return;
  const elapsed = now - castEffect.start;
  const duration = 1900;
  if (elapsed > duration) {
    castEffect = null;
    return;
  }

  const { spell } = castEffect;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const cx = width * 0.5;
  const cy = height * 0.49;
  const progress = elapsed / duration;
  const fade = Math.sin(Math.PI * progress);
  const size = Math.min(width, height) * (0.1 + progress * 0.56);
  const color = spellColors[spell];

  context.save();
  context.globalAlpha = Math.max(0, fade) * 0.88;
  context.strokeStyle = color;
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = spell === "ember" ? 26 : 15;
  context.lineWidth = spell === "stone" ? 3 : 2;

  if (spell === "ember" || spell === "starfall") {
    for (let ring = 0; ring < 3; ring += 1) {
      const radius = size * (0.45 + ring * 0.2);
      context.beginPath();
      context.ellipse(cx, cy, radius * (1 + ring * 0.12), radius * (spell === "ember" ? 0.44 : 0.7), progress * (ring % 2 ? -1 : 1), 0, Math.PI * 2);
      context.stroke();
    }
    for (let ray = 0; ray < 14; ray += 1) {
      const angle = ray * Math.PI / 7 + progress * 1.5;
      const inner = size * 0.16;
      const outer = size * (0.38 + ((ray % 3) * 0.09));
      context.beginPath();
      context.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      context.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      context.stroke();
    }
  } else if (spell === "tempest" || spell === "mirror") {
    for (let arc = 0; arc < 5; arc += 1) {
      const radius = size * (0.3 + arc * 0.13);
      context.beginPath();
      context.ellipse(cx, cy, radius, radius * (spell === "mirror" ? 0.56 : 0.78), progress * (arc % 2 ? 0.9 : -0.9), progress * 3 + arc, progress * 3 + arc + Math.PI * (spell === "mirror" ? 1.35 : 1.1));
      context.stroke();
    }
  } else if (spell === "stone") {
    for (let shard = 0; shard < 9; shard += 1) {
      const angle = shard * Math.PI * 2 / 9 + progress * 0.65;
      const radius = size * (0.62 + (shard % 2) * 0.13);
      context.beginPath();
      context.moveTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      context.lineTo(cx + Math.cos(angle + 0.18) * radius * 0.75, cy + Math.sin(angle + 0.18) * radius * 0.75);
      context.lineTo(cx + Math.cos(angle - 0.1) * radius * 0.36, cy + Math.sin(angle - 0.1) * radius * 0.36);
      context.closePath();
      context.stroke();
    }
  } else {
    const widthGate = size * 0.72;
    const heightGate = size * 1.14;
    context.beginPath();
    context.ellipse(cx, cy, widthGate * 0.5, heightGate * 0.5, 0, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.ellipse(cx, cy, widthGate * 0.36, heightGate * 0.4, 0, 0, Math.PI * 2);
    context.stroke();
    for (let glyph = 0; glyph < 8; glyph += 1) {
      const angle = glyph * Math.PI / 4 + progress * 0.5;
      context.beginPath();
      context.arc(cx + Math.cos(angle) * widthGate * 0.54, cy + Math.sin(angle) * heightGate * 0.48, 2 + (glyph % 2), 0, Math.PI * 2);
      context.fill();
    }
  }
  context.restore();
}

function drawEffects(now) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  context.clearRect(0, 0, width, height);
  if (handLandmarks) drawHand(handLandmarks);

  const elapsed = lastFrame ? now - lastFrame : 16;
  lastFrame = now;
  particles = particles.filter((particle) => now - particle.born < particle.life);
  particles.forEach((particle) => {
    const age = (now - particle.born) / particle.life;
    particle.x += particle.vx * elapsed / 16;
    particle.y += particle.vy * elapsed / 16;
    particle.vx *= 0.99;
    particle.vy += particle.shape === "shard" ? 0.12 : particle.shape === "star" ? 0.018 : -0.012;
    particle.vx *= 0.99;
    context.globalAlpha = Math.max(0, 1 - age);
    context.fillStyle = particle.color;
    context.shadowColor = particle.color;
    context.shadowBlur = particle.shape === "star" ? 14 : 9;
    context.beginPath();
    if (particle.shape === "shard" || particle.shape === "star") {
      context.moveTo(particle.x, particle.y - particle.size * 2);
      context.lineTo(particle.x + particle.size, particle.y);
      context.lineTo(particle.x, particle.y + particle.size * 2);
      context.lineTo(particle.x - particle.size, particle.y);
      context.closePath();
      context.fill();
    } else {
      context.arc(particle.x, particle.y, particle.size * (1 - age * 0.45), 0, Math.PI * 2);
      context.fill();
    }
  });
  drawTechnique(now);
  context.globalAlpha = 1;
  context.shadowBlur = 0;
}

function render(now) {
  animationFrame = requestAnimationFrame(render);
  if (!detector || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    drawEffects(now);
    return;
  }

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const result = detector.detectForVideo(video, now);
    handSets = result.landmarks ?? [];
    handLandmarks = handSets[0] ?? null;
    const feature = describeHands(handSets);
    matchedSeal = identifySeal(feature);

    if (trainingSession) {
      if (handSets.length === 2 && feature) {
        if (!trainingSession.startedAt) trainingSession.startedAt = now;
        trainingSession.samples.push(feature);
        const elapsed = now - trainingSession.startedAt;
        holdProgress.style.transform = `scaleX(${Math.min(elapsed / 1500, 1)})`;
        trainingMessage.textContent = `Hold steady · ${Math.min(Math.round(elapsed / 1500 * 100), 100)}%`;
        handLabel.textContent = `TEACHING · ${sealNames[trainingSession.id].toUpperCase()}`;
        if (elapsed >= 1500 && trainingSession.samples.length >= 12) {
          const sample = trainingSession.samples;
          sealProfiles[trainingSession.id] = sample[0].map((_, index) =>
            sample.reduce((total, current) => total + current[index], 0) / sample.length
          );
          saveSealProfiles();
          const trainedName = sealNames[trainingSession.id];
          trainingSession = null;
          trainingBanner.hidden = true;
          renderSealLibrary();
          setProgress(progress);
          holdProgress.style.transform = "scaleX(0)";
          showToast(`${trainedName} seal learned on this device.`);
        }
      } else {
        trainingSession.startedAt = 0;
        trainingSession.samples = [];
        holdProgress.style.transform = "scaleX(0)";
        trainingMessage.textContent = "Keep both hands visible in the camera";
        handLabel.textContent = "SHOW BOTH HANDS TO TEACH";
      }
    } else if (handSets.length === 2) {
      detectionIndicator.classList.add("ready");
      if (matchedSeal) {
        const name = sealNames[matchedSeal];
        handLabel.textContent = `SEAL · ${name.toUpperCase()}`;
        detectionText.textContent = `${name} seal recognized`;
        registerGesture(matchedSeal, now);
      } else {
        handLabel.textContent = "HANDS DETECTED · SHOW A TAUGHT SEAL";
        detectionText.textContent = "Two hands in view — match a taught seal";
        stableGesture = "";
        previousGesture = "";
        holdProgress.style.transform = "scaleX(0)";
      }
    } else {
      handLabel.textContent = "SHOW BOTH HANDS TO BEGIN";
      detectionIndicator.classList.remove("ready");
      detectionText.textContent = handSets.length ? "Bring both hands into view" : "Looking for both hands…";
      stableGesture = "";
      previousGesture = "";
      holdProgress.style.transform = "scaleX(0)";
    }
  }
  drawEffects(now);
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast("Camera access needs a secure connection. Open this page on localhost or HTTPS.");
    return;
  }

  startButton.disabled = true;
  if (soundEnabled) playAudioUnlock();
  loadingState.hidden = false;
  cameraStage.classList.add("loading");
  detectionText.textContent = "Requesting camera access…";
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    video.srcObject = stream;
    await video.play();

    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
    detector = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.55,
      minHandPresenceConfidence: 0.55,
      minTrackingConfidence: 0.5,
    });
    loadingState.hidden = true;
    cameraStage.classList.remove("loading");
    cameraStage.classList.add("camera-active");
    startButton.hidden = true;
    statusPill.classList.add("active");
    statusPill.querySelector("span").textContent = "CAMERA LIVE";
    cameraMode.textContent = "TRACKING ACTIVE";
    stopCameraButton.hidden = false;
    detectionText.textContent = "Looking for a hand…";
    resizeCanvas();
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(render);
  } catch (error) {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
    loadingState.hidden = true;
    cameraStage.classList.remove("loading");
    startButton.hidden = false;
    startButton.disabled = false;
    detectionText.textContent = "Camera is off";
    cameraMode.textContent = "AWAITING CAMERA";
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      showToast("Camera access was blocked. Allow camera permissions in your browser, then try again.");
    } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      showToast("No camera was found. Connect a webcam and try again.");
    } else {
      console.error("Could not start the hand-tracking camera:", error);
      showToast("Could not start the camera or load hand tracking. Check your connection and try again.");
    }
  }
}

function stopCamera() {
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  detector?.close();
  detector = null;
  video.srcObject = null;
  handLandmarks = null;
  handSets = [];
  matchedSeal = null;
  particles = [];
  castEffect = null;
  isCasting = false;
  trainingSession = null;
  practiceMode = false;
  practiceButton.setAttribute("aria-pressed", "false");
  window.clearTimeout(sequenceTimeout);
  window.clearTimeout(castTimeout);
  castBanner.classList.remove("show");
  stableGesture = "";
  previousGesture = "";
  setProgress([]);
  cancelAnimationFrame(animationFrame);
  context.clearRect(0, 0, canvas.width, canvas.height);
  cameraStage.classList.remove("camera-active", "loading");
  trainingBanner.hidden = true;
  practiceCard.hidden = true;
  delete cameraStage.dataset.technique;
  startButton.hidden = false;
  startButton.disabled = false;
  stopCameraButton.hidden = true;
  statusPill.classList.remove("active");
  statusPill.querySelector("span").textContent = "CAMERA OFF";
  cameraMode.textContent = "AWAITING CAMERA";
  detectionIndicator.classList.remove("ready");
  detectionText.textContent = "Camera is off";
  handLabel.textContent = "HAND TRACKING READY";
}

spellCards.forEach((card) => {
  card.addEventListener("click", () => {
    selectedSpell = card.dataset.spell;
    spellCards.forEach((item) => {
      const selected = item === card;
      item.classList.toggle("selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    setProgress([]);
    stableGesture = "";
    previousGesture = "";
    if (practiceMode) updatePracticeCard();
  });
});

startButton.addEventListener("click", startCamera);
stopCameraButton.addEventListener("click", stopCamera);
practiceButton.addEventListener("click", () => {
  if (!practiceMode) {
    practiceMode = true;
    practiceButton.setAttribute("aria-pressed", "true");
    setProgress([]);
    showToast("Follow the seal guide in the camera while you practice.");
    updatePracticeCard();
  } else {
    practiceMode = false;
    practiceButton.setAttribute("aria-pressed", "false");
    practiceCard.hidden = true;
  }
});
practiceClose.addEventListener("click", () => {
  practiceMode = false;
  practiceButton.setAttribute("aria-pressed", "false");
  practiceCard.hidden = true;
});
practiceLearn.addEventListener("click", () => {
  const sealId = sequences[selectedSpell][Math.min(progress.length, 2)];
  sealTutorial.open(sealId);
});
document.querySelector("#studyAllSeals").addEventListener("click", () => sealTutorial.open("dragon"));
soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.querySelector("span:last-child").textContent = soundEnabled ? "SOUND ON" : "SOUND OFF";
  if (soundEnabled) playAudioUnlock();
});
window.addEventListener("resize", resizeCanvas);
window.addEventListener("pagehide", () => {
  if (audioContext && audioContext.state !== "closed") audioContext.close();
});
window.addEventListener("pagehide", () => {
  stream?.getTracks().forEach((track) => track.stop());
  cancelAnimationFrame(animationFrame);
});

cameraEmpty.hidden = false;
renderSealLibrary();
setProgress([]);
resizeCanvas();
