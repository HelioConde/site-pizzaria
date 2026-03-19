const CHAT_SOUND_SRC = `${import.meta.env.BASE_URL}sounds/new-chat.mp3`;

let sharedAudio = null;
let chatAudioUnlocked = false;
let unlockPromise = null;
let pendingPlayCount = 0;

function getAudio() {
  if (!sharedAudio) {
    sharedAudio = new Audio(CHAT_SOUND_SRC);
    sharedAudio.preload = "auto";
  }

  return sharedAudio;
}

export function unlockChatSound() {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (chatAudioUnlocked) {
    return Promise.resolve(true);
  }

  if (unlockPromise) {
    return unlockPromise;
  }

  unlockPromise = (async () => {
    try {
      const audio = getAudio();

      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0.01;
      audio.muted = true;

      await audio.play();

      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      audio.volume = 0.65;

      chatAudioUnlocked = true;
      window.__chatAudioUnlocked = true;

      if (pendingPlayCount > 0) {
        const queued = pendingPlayCount;
        pendingPlayCount = 0;

        for (let i = 0; i < queued; i += 1) {
          setTimeout(() => {
            playChatSound();
          }, i * 120);
        }
      }

      return true;
    } catch (error) {
      chatAudioUnlocked = false;
      window.__chatAudioUnlocked = false;
      console.warn("[CHAT SOUND] bloqueado pelo navegador:", error);
      return false;
    } finally {
      unlockPromise = null;
    }
  })();

  return unlockPromise;
}

export function playChatSound() {
  if (typeof window === "undefined") return false;

  if (!chatAudioUnlocked) {
    pendingPlayCount += 1;
    return false;
  }

  try {
    const audio = getAudio();

    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = 0.65;

    const playResult = audio.play();

    if (playResult?.catch) {
      playResult.catch((error) => {
        console.warn("[CHAT SOUND] erro ao tocar:", error);
        chatAudioUnlocked = false;
        window.__chatAudioUnlocked = false;
      });
    }

    return true;
  } catch (error) {
    console.warn("[CHAT SOUND] erro inesperado ao tocar:", error);
    chatAudioUnlocked = false;
    window.__chatAudioUnlocked = false;
    return false;
  }
}

export function isChatSoundUnlocked() {
  return chatAudioUnlocked;
}