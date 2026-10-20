import { sealGuides } from "./seal-guides.js";

export function createSealTutorial(onTeach) {
  const dialog = document.querySelector("#sealTutorial");
  const image = document.querySelector("#tutorialImage");
  const title = document.querySelector("#tutorialTitle");
  const subtitle = document.querySelector("#tutorialSubtitle");
  const steps = document.querySelector("#tutorialSteps");
  const tip = document.querySelector("#tutorialTip");
  const index = document.querySelector("#tutorialIndex");
  const previous = document.querySelector("#tutorialPrevious");
  const next = document.querySelector("#tutorialNext");
  const teach = document.querySelector("#tutorialTeach");
  const speak = document.querySelector("#tutorialSpeak");
  const close = document.querySelector("#tutorialClose");
  let activeSeal = "";
  let returnFocus = null;

  function stopSpeech() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speak.setAttribute("aria-pressed", "false");
    speak.textContent = "♫  READ GUIDE ALOUD";
  }

  function speakGuide() {
    if (!("speechSynthesis" in window)) return;
    stopSpeech();
    const guide = sealGuides[activeSeal];
    const utterance = new SpeechSynthesisUtterance(
      `${guide.name} seal. ${guide.orientation}. ${guide.steps.join(" ")} Camera tip: ${guide.tip}`
    );
    utterance.rate = 0.92;
    utterance.onend = stopSpeech;
    utterance.onerror = (event) => {
      stopSpeech();
      if (event.error !== "canceled" && event.error !== "interrupted") console.error("Could not read the seal guide:", event.error);
    };
    speak.setAttribute("aria-pressed", "true");
    speak.textContent = "■  STOP READING";
    window.speechSynthesis.speak(utterance);
  }

  function open(id) {
    const guide = sealGuides[id];
    if (!guide) return;
    stopSpeech();
    activeSeal = id;
    returnFocus = document.activeElement;
    image.src = guide.image;
    image.alt = `Original step-by-step hand pose diagram for the ${guide.name} seal`;
    title.textContent = `${guide.name} seal`;
    subtitle.textContent = guide.orientation;
    index.textContent = `${Object.keys(sealGuides).indexOf(id) + 1} / ${Object.keys(sealGuides).length}`;
    steps.replaceChildren(...guide.steps.map((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }));
    tip.textContent = guide.tip;
    previous.disabled = !Object.keys(sealGuides).slice(0, Object.keys(sealGuides).indexOf(id)).length;
    next.disabled = !Object.keys(sealGuides).slice(Object.keys(sealGuides).indexOf(id) + 1).length;
    if (!dialog.open) dialog.showModal();
    teach.focus();
  }

  function navigate(offset) {
    const ids = Object.keys(sealGuides);
    const nextIndex = ids.indexOf(activeSeal) + offset;
    if (nextIndex >= 0 && nextIndex < ids.length) open(ids[nextIndex]);
  }

  function handleDialogKeys(event) {
    if (!dialog.open || event.target.closest("button")) return;
    if (event.key === "ArrowLeft" && !previous.disabled) {
      event.preventDefault();
      navigate(-1);
    } else if (event.key === "ArrowRight" && !next.disabled) {
      event.preventDefault();
      navigate(1);
    }
  }

  previous.addEventListener("click", () => navigate(-1));
  next.addEventListener("click", () => navigate(1));
  speak.addEventListener("click", () => {
    if (speak.getAttribute("aria-pressed") === "true") stopSpeech();
    else speakGuide();
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    dialog.close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dialog.open) dialog.close();
  });
  dialog.addEventListener("keydown", handleDialogKeys);
  dialog.addEventListener("close", () => {
    stopSpeech();
    returnFocus?.focus();
  });
  teach.addEventListener("click", () => {
    dialog.close();
    onTeach(activeSeal);
  });

  if (!("speechSynthesis" in window)) speak.hidden = true;
  return { open, navigate };
}
