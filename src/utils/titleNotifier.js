let intervalRef = null;
let blinking = false;
let originalTitle =
  typeof document !== "undefined" ? document.title : "Painel Admin";

export function startTitleBlink(message = "🔴 Nova mensagem") {
  if (typeof document === "undefined") return;
  if (blinking) return;

  originalTitle = document.title;
  blinking = true;

  let showAlert = false;

  intervalRef = setInterval(() => {
    document.title = showAlert ? message : originalTitle;
    showAlert = !showAlert;
  }, 1000);
}

export function stopTitleBlink() {
  if (typeof document === "undefined") return;

  if (intervalRef) {
    clearInterval(intervalRef);
    intervalRef = null;
  }

  blinking = false;
  document.title = originalTitle;
}

export function isTitleBlinking() {
  return blinking;
}