import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronLeft,
  Play,
  Calendar,
  RefreshCw,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Smartphone,
  Info,
} from "lucide-react-native";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationContext";
import API_URL from "@/constants/Api";

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const {
    pushToken,
    notifications,
    fetchNotifications,
    markAllAsRead,
    unreadCount,
  } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [workerResult, setWorkerResult] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [hourlyCount, setHourlyCount] = useState(0);
  const [countdown, setCountdown] = useState<string | null>(null);

  const styles = getStyles(colors);

  const fetchJobsAndLogs = async () => {
    if (!user?._id) return;
    try {
      const res = await axios.get(
        `${API_URL}/notification?action=jobs-status&userId=${user._id}`
      );
      setJobs(res.data.jobs || []);
      setHourlyCount(res.data.hourlyCount || 0);

      // Check if there's a pending cart abandonment job and set countdown
      const cartJob = res.data.jobs?.find(
        (j: any) => j.type === "CART_ABANDONMENT" && j.status === "pending"
      );
      if (cartJob) {
        const scheduledTime = new Date(cartJob.scheduledAt).getTime();
        const diff = scheduledTime - Date.now();
        if (diff > 0) {
          const secs = Math.ceil(diff / 1000);
          setCountdown(`${Math.floor(secs / 60)}m ${secs % 60}s`);
        } else {
          setCountdown("Due (Trigger Worker!)");
        }
      } else {
        setCountdown(null);
      }
    } catch (e) {
      console.error("Failed to fetch jobs/logs:", e);
    }
  };

  useEffect(() => {
    fetchJobsAndLogs();
    fetchNotifications();
    
    // Poll jobs status every 4 seconds for live updates
    const interval = setInterval(fetchJobsAndLogs, 4000);
    return () => clearInterval(interval);
  }, [user?._id]);

  // Simulation 1: Trigger Real-time Notification (Order Update)
  const triggerRealtimeNotification = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/notification?action=trigger-realtime`, {
        userId: user._id,
        title: "Order Placed Successfully! 🎉",
        body: "Your order #MYN9872 has been received and is being processed by our warehouse.",
        data: { type: "order_update" },
      });
      setWorkerResult(res.data.runResult);
      await fetchJobsAndLogs();
      await fetchNotifications();
    } catch (e) {
      console.error(e);
      alert("Failed to trigger real-time notification");
    } finally {
      setLoading(false);
    }
  };

  // Simulation 2: Trigger Cart Abandonment (Scheduled Notification)
  const triggerCartAbandonment = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      // Step A: Add a mock product to the bag (to ensure cart isn't empty)
      // First find a valid product ID by doing GET /api/product
      const prodRes = await axios.get(`${API_URL}/product`);
      const testProduct = prodRes.data[0];
      
      if (testProduct) {
        await axios.post(`${API_URL}/bag`, {
          userId: user._id,
          productId: testProduct._id,
          size: "M",
          quantity: 1,
        });
      }

      // Step B: Trigger cart abandonment scheduling
      await axios.post(`${API_URL}/notification?action=trigger-scheduled`, {
        userId: user._id,
        title: "Cart Abandoned! 🛒",
        body: "Hey! You left items in your cart. Checkout now to get an extra 10% discount!",
        data: { type: "cart_abandonment" },
        delayMinutes: 1.5, // 1.5 minutes for rapid testing
      });

      await fetchJobsAndLogs();
    } catch (e) {
      console.error(e);
      alert("Failed to schedule cart abandonment reminder");
    } finally {
      setLoading(false);
    }
  };

  // Simulation 3: Manually Run Cron Worker
  const runCronWorker = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/notification?action=run-jobs`);
      setWorkerResult(res.data);
      await fetchJobsAndLogs();
      await fetchNotifications();
    } catch (e) {
      console.error(e);
      alert("Failed to execute queue worker");
    } finally {
      setLoading(false);
    }
  };

  // Simulation 4: Reset Demo State
  const resetDemoState = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      // Clear bag first
      const bagRes = await axios.get(`${API_URL}/bag?userId=${user._id}`);
      for (const item of bagRes.data) {
        await axios.delete(`${API_URL}/bag?itemId=${item._id}`);
      }

      await axios.delete(`${API_URL}/notification?action=reset-jobs&userId=${user._id}`);
      setWorkerResult(null);
      await fetchJobsAndLogs();
      await fetchNotifications();
    } catch (e) {
      console.error(e);
      alert("Failed to reset database states");
    } finally {
      setLoading(false);
    }
  };

  const getJobStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return styles.badgeGreen;
      case "processing":
        return styles.badgeBlue;
      case "failed":
        return styles.badgeRed;
      default:
        return styles.badgeOrange;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Dashboard</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Device Registration Info Banner */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Device Connection</Text>
          <View style={styles.statusRow}>
            <Smartphone size={24} color={pushToken ? "#07bc0c" : "#ff9900"} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusLabel}>
                {pushToken ? "Notification Token Registered" : "Push Token Offline"}
              </Text>
              <Text style={styles.statusSub} numberOfLines={1}>
                {pushToken || "Permissions not granted or on mock simulator"}
              </Text>
            </View>
          </View>
          <View style={styles.rateLimitRow}>
            <Info size={16} color={colors.primary} />
            <Text style={styles.rateLimitText}>
              Hourly Sent Count: <Text style={styles.boldText}>{hourlyCount} / 5</Text> notifications
            </Text>
          </View>
        </View>

        {/* Action simulations */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Testing Scenarios</Text>
          
          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={triggerRealtimeNotification}
              disabled={loading}
            >
              <Play size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Trigger Order Update</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#3f51b5" }]}
              onPress={triggerCartAbandonment}
              disabled={loading}
            >
              <Calendar size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Schedule Cart Reminder</Text>
            </TouchableOpacity>
          </View>

          {countdown && (
            <View style={styles.countdownContainer}>
              <Clock size={16} color="#3f51b5" />
              <Text style={styles.countdownText}>
                Abandonment Reminder timer: <Text style={styles.countdownValue}>{countdown}</Text>
              </Text>
            </View>
          )}

          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#009688" }]}
              onPress={runCronWorker}
              disabled={loading}
            >
              <RefreshCw size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Run Cron Worker</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#f44336" }]}
              onPress={resetDemoState}
              disabled={loading}
            >
              <Trash2 size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Reset DB State</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Worker Output Summary */}
        {workerResult && (
          <View style={[styles.card, styles.workerResultCard]}>
            <Text style={styles.cardSubTitle}>Worker Execution Output Summary</Text>
            <Text style={styles.codeText}>
              Processed: {workerResult.processedJobs} | Failed: {workerResult.failedAttempts}
            </Text>
            {workerResult.processed?.map((p: any, idx: number) => (
              <Text key={idx} style={styles.codeSubText}>
                • Job {p.jobId.substring(18)}: {p.status} {p.skipped ? "(Cart Empty, Skipped)" : ""}
              </Text>
            ))}
            {workerResult.errors?.map((e: any, idx: number) => (
              <Text key={idx} style={[styles.codeSubText, { color: "#f44336" }]}>
                • Job {e.jobId.substring(18)}: Failed (Attempt {e.attempt}): {e.error}
              </Text>
            ))}
          </View>
        )}

        {/* Job Queue Logs list */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Background Job Queue Queue</Text>
          {jobs.length === 0 ? (
            <Text style={styles.emptyText}>No background queue logs registered yet.</Text>
          ) : (
            jobs.map((job) => (
              <View key={job._id} style={styles.jobItem}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobType}>{job.type}</Text>
                  <View style={[styles.badge, getJobStatusStyle(job.status)]}>
                    <Text style={styles.badgeText}>{job.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.jobTitleText}>{job.title}</Text>
                <Text style={styles.jobScheduledTime}>
                  Scheduled: {new Date(job.scheduledAt).toLocaleTimeString()} (Attempts: {job.attempts}/{job.maxAttempts})
                </Text>
                {job.lastError && (
                  <View style={styles.jobErrorRow}>
                    <AlertTriangle size={14} color="#f44336" />
                    <Text style={styles.jobErrorText}>{job.lastError}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Push notifications logs history */}
        <View style={styles.card}>
          <View style={styles.historyHeader}>
            <Text style={styles.cardTitle}>Notification Center ({unreadCount} unread)</Text>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead}>
                <Text style={styles.markReadBtn}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>
          {notifications.length === 0 ? (
            <Text style={styles.emptyText}>No notifications received yet.</Text>
          ) : (
            notifications.map((notif) => (
              <View
                key={notif._id}
                style={[styles.notifItem, !notif.read && styles.notifUnread]}
              >
                <View style={styles.notifIconContainer}>
                  <Bell size={18} color={notif.read ? "#888" : colors.primary} />
                </View>
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, !notif.read && styles.boldText]}>
                    {notif.title}
                  </Text>
                  <Text style={styles.notifBody}>{notif.body}</Text>
                  <Text style={styles.notifTime}>
                    {new Date(notif.createdAt).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      paddingTop: 50,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 15,
      gap: 15,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 12,
    },
    cardSubTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 6,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    statusTextContainer: {
      flex: 1,
    },
    statusLabel: {
      fontSize: 15,
      fontWeight: "bold",
      color: colors.text,
    },
    statusSub: {
      fontSize: 13,
      color: colors.subtext,
    },
    rateLimitRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    rateLimitText: {
      fontSize: 13,
      color: colors.subtext,
    },
    boldText: {
      fontWeight: "bold",
      color: colors.text,
    },
    buttonGrid: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 10,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    actionBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 12,
      textAlign: "center",
    },
    countdownContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: "rgba(63, 81, 181, 0.08)",
      padding: 10,
      borderRadius: 8,
      marginBottom: 10,
    },
    countdownText: {
      fontSize: 13,
      color: "#3f51b5",
    },
    countdownValue: {
      fontWeight: "bold",
      fontSize: 14,
    },
    workerResultCard: {
      backgroundColor: "rgba(0, 150, 136, 0.05)",
      borderColor: "rgba(0, 150, 136, 0.2)",
    },
    codeText: {
      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
      fontSize: 13,
      color: colors.text,
      marginBottom: 6,
      fontWeight: "bold",
    },
    codeSubText: {
      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
      fontSize: 12,
      color: colors.subtext,
    },
    jobItem: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 10,
    },
    jobHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    jobType: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
    jobTitleText: {
      fontSize: 13,
      color: colors.subtext,
      marginBottom: 2,
    },
    jobScheduledTime: {
      fontSize: 11,
      color: colors.subtext,
    },
    jobErrorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
      backgroundColor: "rgba(244, 67, 54, 0.05)",
      padding: 6,
      borderRadius: 4,
    },
    jobErrorText: {
      fontSize: 11,
      color: "#f44336",
      flex: 1,
    },
    emptyText: {
      color: colors.subtext,
      textAlign: "center",
      paddingVertical: 20,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    badgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "bold",
    },
    badgeGreen: {
      backgroundColor: "#4caf50",
    },
    badgeBlue: {
      backgroundColor: "#2196f3",
    },
    badgeRed: {
      backgroundColor: "#f44336",
    },
    badgeOrange: {
      backgroundColor: "#ff9800",
    },
    historyHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    markReadBtn: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: "bold",
    },
    notifItem: {
      flexDirection: "row",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    notifUnread: {
      backgroundColor: "rgba(255, 63, 108, 0.04)",
      borderRadius: 8,
      marginHorizontal: -8,
      paddingHorizontal: 8,
    },
    notifIconContainer: {
      marginRight: 12,
      marginTop: 2,
    },
    notifContent: {
      flex: 1,
    },
    notifTitle: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 2,
    },
    notifBody: {
      fontSize: 13,
      color: colors.subtext,
      lineHeight: 16,
      marginBottom: 4,
    },
    notifTime: {
      fontSize: 11,
      color: colors.subtext,
    },
  });
