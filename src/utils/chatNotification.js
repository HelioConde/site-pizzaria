const CHAT_SOUND_SRC = `${import.meta.env.BASE_URL}sounds/new-chat.mp3`;

let titleBlinkInterval = null;
let originalTitle =
  typeof document !== "undefined" ? document.title : "Nova mensagem";

export function unlockChatAudio() {
  if (typeof window === "undefined") return;

  try {
    const audio = new Audio(CHAT_SOUND_SRC);
    audio.volume = 0.01;
    audio.preload = "auto";

    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      window.__chatAudioUnlocked = true;
    }).catch(() => {
      window.__chatAudioUnlocked = false;
    });
  } catch {
    window.__chatAudioUnlocked = false;
  }
}

export function playChatNotificationSound() {

  console.log(CHAT_SOUND_SRC)
  if (typeof window === "undefined") return false;
  if (!window.__chatAudioUnlocked) return false;

  try {
    const audio = new Audio(CHAT_SOUND_SRC);
    audio.volume = 0.45;
    audio.preload = "auto";
    audio.play().catch(() => {
      window.__chatAudioUnlocked = false;
    });
    return true;
  } catch {
    window.__chatAudioUnlocked = false;
    return false;
  }
}

export function startChatTitleBlink(text = "💬 Nova mensagem") {
  if (typeof document === "undefined") return;
  if (titleBlinkInterval) return;

  originalTitle = document.title;

  let toggle = false;

  titleBlinkInterval = setInterval(() => {
    document.title = toggle ? text : originalTitle;
    toggle = !toggle;
  }, 1000);
}

export function stopChatTitleBlink() {
  if (typeof document === "undefined") return;

  if (titleBlinkInterval) {
    clearInterval(titleBlinkInterval);
    titleBlinkInterval = null;
  }

  document.title = originalTitle;
}

export function showChatBrowserNotification(title, body) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: `${import.meta.env.BASE_URL}favicon.ico`,
    });

    notification.onclick = () => {
      window.focus();
    };
  }
}

export async function requestChatNotificationPermission() {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;

  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch (error) {
      console.warn("Não foi possível pedir permissão de notificação:", error);
    }
  }
}