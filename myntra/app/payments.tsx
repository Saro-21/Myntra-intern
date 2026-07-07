import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  CreditCard,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import axios from "axios";
import API_URL from "@/constants/Api";

interface Transaction {
  _id: string;
  transactionId: string;
  amount: number;
  status: "pending" | "success" | "failed" | "refunded";
  paymentMethod: string;
  createdAt: string;
  receiptUrl?: string;
}

export default function Payments() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, colors } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const styles = getStyles(theme, colors);

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/transaction?userId=${user._id}`);
      // The API returns { data: Transaction[], nextCursor: string, hasNextPage: boolean }
      if (res.data && Array.isArray(res.data.data)) {
        setTransactions(res.data.data);
      } else if (Array.isArray(res.data)) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.log("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReceipt = (receiptUrl: string) => {
    if (!receiptUrl) return;
    if (Platform.OS === "web") {
      window.open(receiptUrl, "_blank");
    } else {
      Linking.openURL(receiptUrl).catch((err) =>
        console.error("Couldn't open receipt URL", err)
      );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 size={16} color="#22c55e" />;
      case "failed":
        return <XCircle size={16} color="#ef4444" />;
      case "refunded":
        return <AlertCircle size={16} color="#f59e0b" />;
      default:
        return <ClockIcon size={16} color="#3b82f6" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Payments & Transactions</Text>
          <Text style={styles.headerSubtitle}>View paid bills and receipt logs</Text>
        </View>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {/* Saved Cards Section */}
        <Text style={styles.sectionHeading}>Saved Cards</Text>
        <View style={styles.cardWrapper}>
          <View style={styles.creditCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardType}>PLATINUM DEBIT</Text>
              <CreditCard size={20} color="#fff" />
            </View>
            <Text style={styles.cardNumber}>••••  ••••  ••••  4560</Text>
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.cardLabel}>CARD HOLDER</Text>
                <Text style={styles.cardValue}>{user?.name?.toUpperCase() || "SARABHOJI M"}</Text>
              </View>
              <View>
                <Text style={styles.cardLabel}>EXPIRES</Text>
                <Text style={styles.cardValue}>12 / 29</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Transaction History Section */}
        <Text style={styles.sectionHeading}>Transaction History</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : transactions.length === 0 ? (
          <View style={styles.emptyView}>
            <CreditCard size={48} color={colors.subtext} />
            <Text style={styles.emptyTitle}>No Transactions Yet</Text>
            <Text style={styles.emptySubtitle}>Any orders you place will appear here.</Text>
          </View>
        ) : (
          transactions.map((txn) => (
            <View key={txn._id} style={styles.txnCard}>
              <View style={styles.txnTop}>
                <View>
                  <Text style={styles.txnIdText}>ID: {txn.transactionId}</Text>
                  <Text style={styles.txnDateText}>{formatDate(txn.createdAt)}</Text>
                </View>
                <View style={styles.txnAmountWrap}>
                  <Text style={styles.txnAmountText}>₹{txn.amount}</Text>
                  <View style={[styles.statusBadge, styles[txn.status]]}>
                    {getStatusIcon(txn.status)}
                    <Text style={[styles.statusText, styles[`${txn.status}Text`]]}>
                      {txn.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.txnDivider} />

              <View style={styles.txnBottom}>
                <Text style={styles.payMethodText}>
                  Method: {txn.paymentMethod.toUpperCase()}
                </Text>
                {txn.receiptUrl && (
                  <TouchableOpacity
                    style={styles.receiptBtn}
                    activeOpacity={0.7}
                    onPress={() => txn.receiptUrl && handleDownloadReceipt(txn.receiptUrl)}
                  >
                    <FileText size={14} color={colors.primary} />
                    <Text style={styles.receiptBtnText}>PDF Receipt</Text>
                    <ArrowUpRight size={12} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Fallback helper for local clock icon if not imported
function ClockIcon({ size, color }: { size: number; color: string }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

const getStyles = (theme: string, colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === "dark" ? colors.background : "#f8fafc",
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 52,
      paddingBottom: 16,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },
    headerTextWrap: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.subtext,
      marginTop: 2,
    },
    contentScroll: {
      flex: 1,
      padding: 16,
    },
    sectionHeading: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.subtext,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 12,
      marginTop: 8,
      paddingHorizontal: 4,
    },
    cardWrapper: {
      marginBottom: 24,
      alignItems: "center",
    },
    creditCard: {
      width: "100%",
      maxWidth: 380,
      height: 200,
      borderRadius: 20,
      padding: 20,
      justifyContent: "space-between",
      backgroundColor: theme === "dark" ? "#1e1b4b" : "#4338ca",
      shadowColor: "#4338ca",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 15,
      elevation: 6,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardType: {
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.5,
    },
    cardNumber: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "700",
      letterSpacing: 2,
      marginVertical: 14,
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardLabel: {
      color: "rgba(255, 255, 255, 0.5)",
      fontSize: 8,
      fontWeight: "700",
      letterSpacing: 1,
      marginBottom: 4,
    },
    cardValue: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    txnCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    txnTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    txnIdText: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.text,
    },
    txnDateText: {
      fontSize: 11,
      color: colors.subtext,
      marginTop: 4,
    },
    txnAmountWrap: {
      alignItems: "flex-end",
    },
    txnAmountText: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.text,
      marginBottom: 6,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 9,
      fontWeight: "800",
    },
    // Status colors
    success: { backgroundColor: "#f0fdf4" },
    successText: { color: "#22c55e" },
    failed: { backgroundColor: "#fdf2f2" },
    failedText: { color: "#ef4444" },
    refunded: { backgroundColor: "#fffbeb" },
    refundedText: { color: "#d97706" },
    pending: { backgroundColor: "#eff6ff" },
    pendingText: { color: "#2563eb" },

    txnDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    txnBottom: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    payMethodText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.subtext,
    },
    receiptBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme === "dark" ? "#222" : "#fdf2f8",
      borderColor: colors.primary + "30",
      borderWidth: 1,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    receiptBtnText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: "700",
    },
    emptyView: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 60,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      marginTop: 10,
    },
    emptySubtitle: {
      fontSize: 12,
      color: colors.subtext,
    },
  });
