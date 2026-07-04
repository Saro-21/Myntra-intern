import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import axios from "axios";
import { useAuth } from "./AuthContext";
import API_URL from "@/constants/Api";
import NotificationToast from "@/components/NotificationToast";

type NotificationContextType = {
  pushToken: string | null;
  registerForPushNotifications: () => Promise<void>;
  notifications: any[];
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  unreadCount: number;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure Expo notifications for native platforms
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Custom Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastBody, setToastBody] = useState("");

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Fetch all notifications from database
  const fetchNotifications = async () => {
    if (!user?._id) return;
    try {
      const res = await axios.get(`${API_URL}/notification?userId=${user._id}`);
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: any) => !n.read).length);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?._id) return;
    try {
      await axios.post(`${API_URL}/notification?action=mark-read`, {
        userId: user._id,
        all: true,
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark notifications as read:", e);
    }
  };

  // Register push notifications
  const registerForPushNotifications = async () => {
    try {
      let token = null;

      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && "Notification" in window) {
          const permission = await window.Notification.requestPermission();
          if (permission === "granted") {
            const storedToken =
              localStorage.getItem("web_push_token") ||
              `WebPushToken[${Math.random().toString(36).substring(2, 15)}]`;
            localStorage.setItem("web_push_token", storedToken);
            token = storedToken;
          }
        }
      } else {
        if (Device.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus === "granted") {
            const projectId =
              Constants?.expoConfig?.extra?.eas?.projectId ??
              Constants?.easConfig?.projectId;
            
            // Fallback device token request
            try {
              const pushTokenData = await Notifications.getDevicePushTokenAsync();
              token = pushTokenData.data;
            } catch (err) {
              // Try Expo Push Token if Device token request errors
              const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
              token = pushTokenData.data;
            }
          }
        } else {
          console.log("Must use physical device for Native Push Notifications");
        }
      }

      if (token) {
        setPushToken(token);
        
        // Register token with backend
        await axios.post(`${API_URL}/notification?action=register`, {
          userId: user?._id || null,
          token,
          deviceType: Platform.OS,
        });
      }
    } catch (e) {
      console.error("Error registering push token:", e);
    }
  };

  // Unregister token on logout
  const unregisterToken = async (token: string) => {
    try {
      await axios.post(`${API_URL}/notification?action=unregister`, { token });
    } catch (e) {
      console.error("Error unregistering push token:", e);
    }
  };

  // Register device token when user logs in / app starts
  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotifications();
      fetchNotifications();
    } else {
      // Clear token state on logout
      if (pushToken) {
        unregisterToken(pushToken);
        setPushToken(null);
      }
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, user?._id]);

  // Setup Notification Listeners
  useEffect(() => {
    if (Platform.OS === "web") {
      // Web Polling System: checks for new unread notifications every 5 seconds
      if (!isAuthenticated || !user?._id) return;

      const pollInterval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_URL}/notification?userId=${user._id}&unread=true`);
          const unreadNotifications = res.data;

          if (unreadNotifications.length > 0) {
            // Trigger in-app toast & browser notification for the latest one
            const latest = unreadNotifications[0];
            setToastTitle(latest.title);
            setToastBody(latest.body);
            setToastVisible(true);

            if (typeof window !== "undefined" && "Notification" in window) {
              if (window.Notification.permission === "granted") {
                new window.Notification(latest.title, { body: latest.body });
              }
            }

            // Mark these fetched unread items as read immediately so they aren't polled again
            await axios.post(`${API_URL}/notification?action=mark-read`, {
              userId: user._id,
              all: true,
            });

            // Update local notifications list
            fetchNotifications();
          }
        } catch (e) {
          console.error("Web notification polling error:", e);
        }
      }, 5000);

      return () => clearInterval(pollInterval);
    } else {
      // Native Listeners
      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          const { title, body } = notification.request.content;
          setToastTitle(title || "New Notification");
          setToastBody(body || "");
          setToastVisible(true);
          fetchNotifications();
        }
      );

      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data;
          // Handle navigation on click
          if (data && data.type) {
            if (data.type === "order_update") {
              router.push("/orders");
            } else if (data.type === "cart_abandonment") {
              router.push("/bag");
            }
          }
          fetchNotifications();
        }
      );

      return () => {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      };
    }
  }, [isAuthenticated, user?._id]);

  return (
    <NotificationContext.Provider
      value={{
        pushToken,
        registerForPushNotifications,
        notifications,
        fetchNotifications,
        markAllAsRead,
        unreadCount,
      }}
    >
      {children}
      <NotificationToast
        title={toastTitle}
        body={toastBody}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
