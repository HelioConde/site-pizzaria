const CHAT_SOUND_SRC = `${import.meta.env.BASE_URL}sounds/new-message.mp3`;

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
  console.log("[CHAT SOUND] unlockChatSound chamado");
  console.log("[CHAT SOUND] src:", CHAT_SOUND_SRC);
  console.log("[CHAT SOUND] unlocked atual:", chatAudioUnlocked);
  console.log("[CHAT SOUND] unlockPromise ativa?", !!unlockPromise);

  if (chatAudioUnlocked) {
    console.log("[CHAT SOUND] já estava desbloqueado");
    return Promise.resolve(true);
  }

  if (unlockPromise) {
    console.log("[CHAT SOUND] unlock já em andamento");
    return unlockPromise;
  }

  unlockPromise = (async () => {
    try {
      const audio = getAudio();

      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0.01;
      audio.muted = true;

      console.log("[CHAT SOUND] tentando play mudo para desbloqueio");

      await audio.play();

      console.log("[CHAT SOUND] play mudo executado com sucesso");

      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      audio.volume = 0.65;

      chatAudioUnlocked = true;
      console.log("[CHAT SOUND] desbloqueado = true");

      if (pendingPlayCount > 0) {
        const queued = pendingPlayCount;
        pendingPlayCount = 0;
        console.log("[CHAT SOUND] reproduzindo sons pendentes:", queued);

        for (let i = 0; i < queued; i += 1) {
          setTimeout(() => {
            playChatSound();
          }, i * 120);
        }
      }

      return true;
    } catch (error) {
      chatAudioUnlocked = false;
      console.warn("[CHAT SOUND] bloqueado pelo navegador:", error);
      return false;
    } finally {
      unlockPromise = null;
      console.log("[CHAT SOUND] unlock finalizado");
    }
  })();

  return unlockPromise;
}

export function playChatSound() {
  console.log("[CHAT SOUND] playChatSound chamado");
  console.log("[CHAT SOUND] desbloqueado?", chatAudioUnlocked);
  console.log("[CHAT SOUND] unlock em andamento?", !!unlockPromise);
  console.log("[CHAT SOUND] src:", CHAT_SOUND_SRC);

  if (!chatAudioUnlocked) {
    pendingPlayCount += 1;
    console.warn(
      "[CHAT SOUND] ainda não desbloqueado, som enfileirado. pendingPlayCount =",
      pendingPlayCount
    );

    if (!unlockPromise) {
      console.warn("[CHAT SOUND] nenhum unlock em andamento no momento");
    }

    return;
  }

  try {
    const audio = getAudio();

    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = 0.65;

    const playResult = audio.play();

    if (playResult?.then) {
      playResult
        .then(() => {
          console.log("[CHAT SOUND] som tocando com sucesso");
        })
        .catch((error) => {
          console.warn("[CHAT SOUND] erro ao tocar:", error);
          chatAudioUnlocked = false;
        });
    } else {
      console.log("[CHAT SOUND] play sem promise, assumindo sucesso");
    }
  } catch (error) {
    console.warn("[CHAT SOUND] erro inesperado ao tocar:", error);
    chatAudioUnlocked = false;
  }
}

export function isChatSoundUnlocked() {
  return chatAudioUnlocked;
}