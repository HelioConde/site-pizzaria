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