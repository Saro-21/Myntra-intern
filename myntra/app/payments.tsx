import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Linking, Platform,
  Modal, FlatList, Image,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft, CreditCard, FileText, CheckCircle2, XCircle,
  AlertCircle, ArrowUpRight, ChevronDown,
  Download, RefreshCw, X, Package, ArrowUpDown, Clock3,
  Receipt,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import axios from "axios";
import API_URL from "@/constants/Api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem {
  name: string;
  brand: string;
  image: string | null;
  size: string;
  quantity: number;
  price: number;
  lineTotal: number;
}
interface Transaction {
  _id: string;
  transactionId: string;
  amount: number;
  status: "pending" | "success" | "failed" | "refunded";
  paymentMethod: string;
  createdAt: string;
  receiptUrl?: string;
  items?: OrderItem[];
  shippingAddress?: string;
}

const STATUS_OPTIONS = ["All", "success", "pending", "failed", "refunded"];
const METHOD_OPTIONS = ["All", "card", "upi", "netbanking", "wallet", "cod"];
const SORT_OPTIONS = [
  { label: "Newest First", value: "desc" },
  { label: "Oldest First", value: "asc" },
];
const PAGE_SIZE = 15;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Payments() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, colors } = useTheme();

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [total, setTotal] = useState(0);

  // Filter state
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Expanded rows
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Receipt modal
  const [receiptTxn, setReceiptTxn] = useState<Transaction | null>(null);

  // Fallback orders when no transactions exist yet
  const [fallbackOrders, setFallbackOrders] = useState<Transaction[]>([]);

  const styles = getStyles(theme, colors);

  // ── Fetch transactions ──────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async (reset = true) => {
    if (!user) return;
    try {
      reset ? setIsLoading(true) : setIsLoadingMore(true);

      const params: Record<string, string> = {
        userId: user._id,
        limit: String(PAGE_SIZE),
        sort: sortOrder,
      };
      if (statusFilter !== "All") params.status = statusFilter;
      if (methodFilter !== "All") params.paymentMethod = methodFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (!reset && nextCursor) params.cursor = nextCursor;

      const res = await axios.get(`${API_URL}/transaction`, { params });
      const { data: txns = [], nextCursor: nc, hasNextPage: hnp, total: tot } = res.data;

      if (reset) {
        setTransactions(txns);
      } else {
        setTransactions(prev => [...prev, ...txns]);
      }
      setNextCursor(nc || null);
      setHasNextPage(!!hnp);
      setTotal(tot || txns.length);

      // Fallback: synthesize from orders if empty
      if (reset && txns.length === 0) {
        try {
          const ordRes = await axios.get(`${API_URL}/order?userId=${user._id}`);
          const orders: any[] = Array.isArray(ordRes.data) ? ordRes.data : [];
          const synth: Transaction[] = orders.map((o: any) => ({
            _id: o._id,
            transactionId: "ORD-" + (o._id as string).slice(-8).toUpperCase(),
            amount: o.total || 0,
            status: "success" as const,
            paymentMethod: (o.paymentMethod || "card").toLowerCase(),
            createdAt: o.createdAt || o.date || new Date().toISOString(),
            shippingAddress: o.shippingAddress,
            items: (o.items || []).map((item: any) => ({
              name: item.productId?.name || "Product",
              brand: item.productId?.brand || "",
              image: item.productId?.images?.[0] || null,
              size: item.size || "—",
              quantity: item.quantity || 1,
              price: item.price || 0,
              lineTotal: (item.price || 0) * (item.quantity || 1),
            })),
          }));
          setFallbackOrders(synth);
        } catch { /* ignore */ }
      } else {
        setFallbackOrders([]);
      }
    } catch (err) {
      console.log("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [user, statusFilter, methodFilter, sortOrder, startDate, endDate]);

  useEffect(() => { fetchTransactions(true); }, [fetchTransactions]);

  // ── Receipt modal: open preview, then optionally download PDF ───────────
  const handleReceipt = (txn: Transaction) => {
    setReceiptTxn(txn);
  };

  const downloadPdf = (receiptUrl?: string) => {
    if (!receiptUrl) return;
    if (Platform.OS === "web") {
      const a = document.createElement("a");
      a.href = receiptUrl;
      a.target = "_blank";
      a.rel = "noopener";
      a.click();
    } else {
      Linking.openURL(receiptUrl).catch(console.error);
    }
  };

  // ── CSV export ──────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!user) return;
    const params = new URLSearchParams({ userId: user._id });
    if (statusFilter !== "All") params.set("status", statusFilter);
    if (methodFilter !== "All") params.set("paymentMethod", methodFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const url = `${API_URL}/transaction/export?${params.toString()}`;
    if (Platform.OS === "web") {
      (window as any).open(url, "_blank");
    } else {
      Linking.openURL(url).catch(console.error);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return d; }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "success":  return "#22c55e";
      case "failed":   return "#ef4444";
      case "refunded": return "#f59e0b";
      default:         return "#3b82f6";
    }
  };
  const getStatusBg = (s: string) => {
    switch (s) {
      case "success":  return "#f0fdf4";
      case "failed":   return "#fef2f2";
      case "refunded": return "#fffbeb";
      default:         return "#eff6ff";
    }
  };

  const getStatusIcon = (s: string) => {
    const c = getStatusColor(s);
    switch (s) {
      case "success":  return <CheckCircle2 size={13} color={c} />;
      case "failed":   return <XCircle size={13} color={c} />;
      case "refunded": return <AlertCircle size={13} color={c} />;
      default:         return <Clock3 size={13} color={c} />;
    }
  };

  const displayList = transactions.length > 0 ? transactions : fallbackOrders;

  // ── Render item ─────────────────────────────────────────────────────────────
  const renderTransaction = ({ item: txn }: { item: Transaction }) => {
    const isExpanded = expandedId === txn._id;
    return (
      <View style={styles.txnCard}>
        {/* Header row — tap to expand */}
        <TouchableOpacity
          style={styles.txnHeader}
          onPress={() => setExpandedId(isExpanded ? null : txn._id)}
          activeOpacity={0.8}
        >
          <View style={styles.txnLeft}>
            <Text style={styles.txnId}>{txn.transactionId}</Text>
            <Text style={styles.txnDate}>{formatDate(txn.createdAt)}</Text>
            <View style={styles.methodChip}>
              <CreditCard size={10} color={colors.primary} />
              <Text style={styles.methodChipText}>{txn.paymentMethod.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.txnRight}>
            <Text style={styles.txnAmount}>₹{txn.amount.toLocaleString("en-IN")}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBg(txn.status) }]}>
              {getStatusIcon(txn.status)}
              <Text style={[styles.statusText, { color: getStatusColor(txn.status) }]}>
                {txn.status.toUpperCase()}
              </Text>
            </View>
            <ChevronDown
              size={16}
              color={colors.subtext}
              style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }], marginTop: 4 }}
            />
          </View>
        </TouchableOpacity>

        {/* Expanded: itemized breakdown + receipt */}
        {isExpanded && (
          <View style={styles.txnBody}>
            <View style={styles.divider} />

            {/* Items */}
            {txn.items && txn.items.length > 0 ? (
              <View>
                <Text style={styles.itemsHeading}>
                  <Package size={12} color={colors.subtext} /> Order Items
                </Text>
                {txn.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.itemImage} />
                    ) : (
                      <View style={[styles.itemImage, { backgroundColor: colors.inputBackground, justifyContent: "center", alignItems: "center" }]}>
                        <Package size={16} color={colors.subtext} />
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      {item.brand ? <Text style={styles.itemBrand}>{item.brand}</Text> : null}
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemMeta}>
                        Size: {item.size}  ·  Qty: {item.quantity}
                      </Text>
                    </View>
                    <View style={styles.itemPriceCol}>
                      <Text style={styles.itemUnitPrice}>₹{item.price.toLocaleString("en-IN")} each</Text>
                      <Text style={styles.itemLineTotal}>₹{item.lineTotal.toLocaleString("en-IN")}</Text>
                    </View>
                  </View>
                ))}

                {/* Total row */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Paid</Text>
                  <Text style={styles.totalValue}>₹{txn.amount.toLocaleString("en-IN")}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.noItemsRow}>
                <Text style={styles.noItemsText}>₹{txn.amount.toLocaleString("en-IN")} — Online Purchase</Text>
              </View>
            )}

            {/* Shipping address */}
            {txn.shippingAddress ? (
              <Text style={styles.shippingText}>📍 {txn.shippingAddress}</Text>
            ) : null}

            {/* Receipt button — always shown */}
            <TouchableOpacity
              style={styles.receiptBtn}
              activeOpacity={0.75}
              onPress={() => handleReceipt(txn)}
            >
              <Receipt size={15} color="#fff" />
              <Text style={styles.receiptBtnText}>View &amp; Download Receipt</Text>
              <ArrowUpRight size={13} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Receipt Preview Modal ── */}
      <Modal
        visible={!!receiptTxn}
        animationType="slide"
        transparent
        onRequestClose={() => setReceiptTxn(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Receipt size={20} color={colors.primary} />
                <Text style={styles.modalTitle}>Receipt Preview</Text>
              </View>
              <TouchableOpacity onPress={() => setReceiptTxn(null)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {receiptTxn && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>

                {/* Myntra branding strip */}
                <View style={styles.receiptBrandStrip}>
                  <Text style={styles.receiptBrandText}>MYNTRA</Text>
                  <Text style={styles.receiptBrandSub}>Official Purchase Receipt</Text>
                </View>

                {/* Status banner */}
                <View style={[styles.statusBanner, { backgroundColor: getStatusBg(receiptTxn.status) }]}>
                  {getStatusIcon(receiptTxn.status)}
                  <Text style={[styles.statusBannerText, { color: getStatusColor(receiptTxn.status) }]}>
                    {receiptTxn.status.toUpperCase()}
                  </Text>
                </View>

                {/* Key details grid */}
                <View style={styles.detailGrid}>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel}>Transaction ID</Text>
                    <Text style={styles.detailValue}>{receiptTxn.transactionId}</Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel}>Amount Paid</Text>
                    <Text style={[styles.detailValue, { color: colors.primary, fontSize: 20, fontWeight: "900" }]}>
                      ₹{receiptTxn.amount.toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel}>Payment Mode</Text>
                    <View style={styles.methodTag}>
                      <CreditCard size={12} color={colors.primary} />
                      <Text style={styles.methodTagText}>{receiptTxn.paymentMethod.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel}>Date &amp; Time</Text>
                    <Text style={styles.detailValue}>{formatDate(receiptTxn.createdAt)}</Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.receiptDivider} />

                {/* Order items */}
                {receiptTxn.items && receiptTxn.items.length > 0 && (
                  <View>
                    <Text style={styles.receiptSectionTitle}>ORDER ITEMS</Text>
                    {receiptTxn.items.map((item, idx) => (
                      <View key={idx} style={styles.receiptItemRow}>
                        {item.image ? (
                          <Image source={{ uri: item.image }} style={styles.receiptItemImg} />
                        ) : (
                          <View style={[styles.receiptItemImg, { backgroundColor: colors.inputBackground, justifyContent: "center", alignItems: "center" }]}>
                            <Package size={14} color={colors.subtext} />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          {item.brand ? <Text style={styles.receiptItemBrand}>{item.brand}</Text> : null}
                          <Text style={styles.receiptItemName}>{item.name}</Text>
                          <Text style={styles.receiptItemMeta}>Size: {item.size}  ·  Qty: {item.quantity}  ·  ₹{item.price.toLocaleString("en-IN")} each</Text>
                        </View>
                        <Text style={styles.receiptItemTotal}>₹{item.lineTotal.toLocaleString("en-IN")}</Text>
                      </View>
                    ))}

                    <View style={styles.receiptTotalRow}>
                      <Text style={styles.receiptTotalLabel}>Total Paid</Text>
                      <Text style={styles.receiptTotalValue}>₹{receiptTxn.amount.toLocaleString("en-IN")}</Text>
                    </View>
                  </View>
                )}

                {/* Shipping */}
                {receiptTxn.shippingAddress ? (
                  <Text style={styles.receiptShipping}>📍 Delivered to: {receiptTxn.shippingAddress}</Text>
                ) : null}

                <View style={styles.receiptDivider} />

                {/* Footer note */}
                <Text style={styles.receiptFooter}>
                  This is a digitally generated receipt. No signature required.
                </Text>

                {/* Download button */}
                <TouchableOpacity
                  style={styles.downloadBtn}
                  activeOpacity={0.8}
                  onPress={() => downloadPdf(receiptTxn.receiptUrl)}
                >
                  <Download size={18} color="#fff" />
                  <Text style={styles.downloadBtnText}>Download PDF Receipt</Text>
                </TouchableOpacity>

                <View style={{ height: 16 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Transactions</Text>
          {total > 0 && (
            <Text style={styles.headerSub}>{total} transaction{total !== 1 ? "s" : ""}</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => fetchTransactions(true)}>
            <RefreshCw size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleExport}>
            <Download size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Status pills */}
          {STATUS_OPTIONS.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.filterPill, statusFilter === s && styles.filterPillActive]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.filterPillText, statusFilter === s && styles.filterPillTextActive]}>
                {s === "All" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.pillDivider} />

          {/* Method pills */}
          {METHOD_OPTIONS.map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.filterPill, methodFilter === m && styles.filterPillActive]}
              onPress={() => setMethodFilter(m)}
            >
              <Text style={[styles.filterPillText, methodFilter === m && styles.filterPillTextActive]}>
                {m === "All" ? "All Methods" : m.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.pillDivider} />

          {/* Sort pills */}
          {SORT_OPTIONS.map(o => (
            <TouchableOpacity
              key={o.value}
              style={[styles.filterPill, sortOrder === o.value && styles.filterPillActive]}
              onPress={() => setSortOrder(o.value)}
            >
              <ArrowUpDown size={11} color={sortOrder === o.value ? "#fff" : colors.subtext} />
              <Text style={[styles.filterPillText, sortOrder === o.value && styles.filterPillTextActive]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transaction List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading transactions…</Text>
        </View>
      ) : displayList.length === 0 ? (
        <View style={styles.centered}>
          <CreditCard size={52} color={colors.subtext} />
          <Text style={styles.emptyTitle}>No Transactions Yet</Text>
          <Text style={styles.emptySub}>Your completed orders will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={t => t._id}
          renderItem={renderTransaction}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            hasNextPage ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => fetchTransactions(false)}
                disabled={isLoadingMore}
              >
                {isLoadingMore
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Text style={styles.loadMoreText}>Load More</Text>}
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const getStyles = (theme: string, colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme === "dark" ? "#0f0f0f" : "#f4f6fb" },

  // Header
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingTop: 52, paddingBottom: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, paddingHorizontal: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  headerSub: { fontSize: 11, color: colors.subtext, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 6 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.inputBackground,
    justifyContent: "center", alignItems: "center",
  },

  // Filter bar
  filterBar: {
    backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingVertical: 10,
  },
  filterScroll: { paddingHorizontal: 14, gap: 8, alignItems: "center" },
  filterPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
  },
  filterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterPillText: { fontSize: 11, fontWeight: "700", color: colors.subtext },
  filterPillTextActive: { color: "#fff" },
  pillDivider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 4 },

  // List
  listContent: { padding: 14, gap: 12, paddingBottom: 40 },

  // Transaction card
  txnCard: {
    backgroundColor: colors.card,
    borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  txnHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", padding: 16,
  },
  txnLeft: { flex: 1, gap: 4 },
  txnId: { fontSize: 13, fontWeight: "800", color: colors.text, letterSpacing: 0.5 },
  txnDate: { fontSize: 11, color: colors.subtext },
  methodChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.primary + "15",
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, alignSelf: "flex-start", marginTop: 2,
  },
  methodChipText: { fontSize: 9, fontWeight: "800", color: colors.primary, letterSpacing: 0.5 },
  txnRight: { alignItems: "flex-end", gap: 6 },
  txnAmount: { fontSize: 18, fontWeight: "900", color: colors.text },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },

  // Expanded body
  txnBody: { paddingHorizontal: 16, paddingBottom: 16 },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 14 },

  itemsHeading: { fontSize: 11, fontWeight: "800", color: colors.subtext, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 },
  itemImage: { width: 50, height: 50, borderRadius: 10, backgroundColor: colors.inputBackground },
  itemInfo: { flex: 1, gap: 2 },
  itemBrand: { fontSize: 9, fontWeight: "800", color: colors.primary, textTransform: "uppercase", letterSpacing: 0.5 },
  itemName: { fontSize: 12, fontWeight: "700", color: colors.text },
  itemMeta: { fontSize: 10, color: colors.subtext },
  itemPriceCol: { alignItems: "flex-end", gap: 2 },
  itemUnitPrice: { fontSize: 10, color: colors.subtext },
  itemLineTotal: { fontSize: 13, fontWeight: "800", color: colors.text },

  totalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.inputBackground, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, marginTop: 6, marginBottom: 12,
  },
  totalLabel: { fontSize: 13, fontWeight: "700", color: colors.subtext },
  totalValue: { fontSize: 16, fontWeight: "900", color: colors.text },

  noItemsRow: { marginBottom: 12 },
  noItemsText: { fontSize: 13, color: colors.text, fontWeight: "700" },

  shippingText: { fontSize: 11, color: colors.subtext, marginBottom: 12, lineHeight: 16 },

  receiptBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 18,
  },
  receiptBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // States
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  loadingText: { color: colors.subtext, fontSize: 13, marginTop: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: 12 },
  emptySub: { fontSize: 13, color: colors.subtext, textAlign: "center" },

  loadMoreBtn: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.primary,
    marginTop: 4,
  },
  loadMoreText: { color: colors.primary, fontWeight: "800", fontSize: 13 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: "92%",
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 20,
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  modalCloseBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.inputBackground,
    justifyContent: "center", alignItems: "center",
  },
  modalBody: { padding: 20, gap: 16 },

  // Receipt preview
  receiptBrandStrip: {
    alignItems: "center", paddingVertical: 18,
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
  receiptBrandText: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: 4 },
  receiptBrandSub: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 4 },

  statusBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 10, borderRadius: 12,
  },
  statusBannerText: { fontSize: 14, fontWeight: "800", letterSpacing: 1 },

  detailGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 12,
  },
  detailCell: {
    width: "46%", backgroundColor: colors.inputBackground,
    borderRadius: 14, padding: 14, gap: 4,
  },
  detailLabel: { fontSize: 10, fontWeight: "700", color: colors.subtext, textTransform: "uppercase", letterSpacing: 0.8 },
  detailValue: { fontSize: 13, fontWeight: "800", color: colors.text },
  methodTag: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: colors.primary + "18",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start",
  },
  methodTagText: { fontSize: 11, fontWeight: "800", color: colors.primary },

  receiptDivider: { height: 1, backgroundColor: colors.border },
  receiptSectionTitle: { fontSize: 10, fontWeight: "800", color: colors.subtext, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 },

  receiptItemRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  receiptItemImg: { width: 48, height: 48, borderRadius: 10 },
  receiptItemBrand: { fontSize: 9, fontWeight: "800", color: colors.primary, textTransform: "uppercase", letterSpacing: 0.5 },
  receiptItemName: { fontSize: 12, fontWeight: "700", color: colors.text },
  receiptItemMeta: { fontSize: 10, color: colors.subtext, marginTop: 2 },
  receiptItemTotal: { fontSize: 14, fontWeight: "900", color: colors.text },

  receiptTotalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.primary + "12",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    marginTop: 4,
  },
  receiptTotalLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  receiptTotalValue: { fontSize: 20, fontWeight: "900", color: colors.primary },

  receiptShipping: { fontSize: 11, color: colors.subtext, lineHeight: 18 },
  receiptFooter: { fontSize: 10, color: colors.subtext, textAlign: "center", fontStyle: "italic" },

  downloadBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: colors.primary,
    borderRadius: 16, paddingVertical: 16,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  downloadBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
