import { Platform } from "react-native";

export async function requestNotificationPermission() {
  if (Platform.OS !== "web") return false;
  if (!("Notification" in window)) return false;
  
  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return Notification.permission === "granted";
}

interface ShowNotificationOptions {
  title: string;
  body: string;
  icon?: string;
}

export async function showWebNotification({ title, body, icon }: ShowNotificationOptions) {
  if (Platform.OS !== "web") return;
  if (!("Notification" in window)) return;

  const hasPermission = await requestNotificationPermission();
  if (hasPermission) {
    new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
    });
  }
}
