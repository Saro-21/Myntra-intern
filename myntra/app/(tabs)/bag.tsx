import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ShoppingBag, Minus, Plus, Trash2, ChevronRight,
  Tag, Bookmark, BookmarkX, RefreshCw, AlertTriangle,
} from "lucide-react-native";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import API_URL from "@/constants/Api";
import { useTheme } from "@/context/ThemeContext";
import { useWindowDimensions } from "react-native";

const isWeb = Platform.OS === "web";

export default function Bag() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const { width } = useWindowDimensions();
  const styles = getStyles(colors, theme);

  const [isLoading, setIsLoading] = useState(false);
  const [activeItems, setActiveItems] = useState<any[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [discontinuedItems, setDiscontinuedItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [conflictItem, setConflictItem] = useState<string | null>(null);

  // ── Fetch cart (cross-device sync: always fresh from server) ────────────
  const fetchBag = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/bag?userId=${user._id}`);
      const data = res.data;
      if (Array.isArray(data)) {
        // Legacy API compat
        setActiveItems(data.filter((i: any) => !i.savedForLater && !i.isDiscontinued));
        setSavedItems(data.filter((i: any) => i.savedForLater));
        setDiscontinuedItems(data.filter((i: any) => i.isDiscontinued));
        setTotal(data
          .filter((i: any) => !i.savedForLater && !i.isDiscontinued)
          .reduce((s: number, i: any) => s + (i.productId?.price || 0) * (i.quantity || 1), 0));
      } else {
        setActiveItems(data.activeItems || []);
        setSavedItems(data.savedItems || []);
        setDiscontinuedItems(data.discontinued || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchBag(); }, [fetchBag]);

  // ── Optimistic-locking quantity update — handles 409 conflict ───────────
  const handleQuantity = async (item: any, delta: number) => {
    const newQty = (item.quantity || 1) + delta;
    if (newQty < 1) return;
    setConflictItem(null);
    try {
      await axios.patch(`${API_URL}/bag?action=update-quantity`, {
        itemId: item._id,
        quantity: newQty,
        expectedVersion: item.__v ?? 0,
      });
      await fetchBag();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setConflictItem(item._id);
      } else {
        await fetchBag();
      }
    }
  };

  // ── Save for later (optimistic locking) ─────────────────────────────────
  const handleSaveForLater = async (item: any) => {
    try {
      await axios.patch(`${API_URL}/bag?action=save-for-later`, {
        itemId: item._id,
        expectedVersion: item.__v ?? 0,
      });
      await fetchBag();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setConflictItem(item._id);
      } else {
        await fetchBag();
      }
    }
  };

  // ── Move saved item back to active cart ──────────────────────────────────
  const handleMoveToCart = async (item: any) => {
    try {
      await axios.patch(`${API_URL}/bag?action=move-to-cart`, {
        itemId: item._id,
        expectedVersion: item.__v ?? 0,
      });
      await fetchBag();
    } catch {
      await fetchBag();
    }
  };

  // ── Remove item ──────────────────────────────────────────────────────────
  const handleDelete = async (itemId: string) => {
    const doDelete = async () => {
      try {
        await axios.delete(`${API_URL}/bag?itemId=${itemId}`);
        await fetchBag();
      } catch (err) {
        console.log(err);
      }
    };
    if (Platform.OS === "web") {
      if (window.confirm("Remove this item from bag?")) await doDelete();
    } else {
      Alert.alert("Remove Item", "Remove this item from bag?", [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  // ── Empty / unauthenticated states ───────────────────────────────────────
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Bag</Text>
        </View>
        <View style={styles.emptyState}>
          <ShoppingBag size={72} color={colors.primary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Your bag is empty</Text>
          <Text style={styles.emptySubtitle}>Login to view your saved items</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push("/login")}>
            <Text style={styles.ctaBtnText}>LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>Syncing your bag…</Text>
      </View>
    );
  }

  if (!isLoading && activeItems.length === 0 && savedItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Bag</Text>
        </View>
        <View style={styles.emptyState}>
          <ShoppingBag size={72} color={colors.primary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Your bag is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to get started</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push("/")}>
            <Text style={styles.ctaBtnText}>SHOP NOW</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Cart Item card ────────────────────────────────────────────────────────
  const CartItemCard = ({ item, saved = false }: { item: any; saved?: boolean }) => {
    const hasConflict = conflictItem === item._id;
    return (
      <View style={[styles.bagItem, saved && styles.savedItemCard]}>
        {saved && (
          <View style={styles.savedBadge}>
            <Bookmark size={10} color={colors.primary} />
            <Text style={styles.savedBadgeText}>SAVED FOR LATER</Text>
          </View>
        )}
        {hasConflict && (
          <View style={styles.conflictBanner}>
            <AlertTriangle size={14} color="#f59e0b" />
            <Text style={styles.conflictText}>
              Another session updated this item.
            </Text>
            <TouchableOpacity onPress={() => { setConflictItem(null); fetchBag(); }}>
              <RefreshCw size={14} color="#f59e0b" />
            </TouchableOpacity>
          </View>
        )}
        <Image
          source={{ uri: item.productId?.images?.[0] }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        <View style={styles.itemInfo}>
          <Text style={styles.brandName}>{item.productId?.brand}</Text>
          <Text style={styles.itemName} numberOfLines={2}>{item.productId?.name}</Text>
          <View style={styles.sizeRow}>
            <View style={styles.sizeBadge}>
              <Text style={styles.sizeText}>Size: {item.size}</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>₹{item.productId?.price}</Text>
            {item.priceAtAdd && item.priceAtAdd !== item.productId?.price && (
              <Text style={styles.priceChanged}>
                was ₹{item.priceAtAdd}
              </Text>
            )}
          </View>

          {!saved ? (
            <View style={styles.actionRow}>
              {/* Quantity controls */}
              <View style={styles.quantityContainer}>
                <TouchableOpacity style={styles.quantityButton} onPress={() => handleQuantity(item, -1)}>
                  <Minus size={13} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity style={styles.quantityButton} onPress={() => handleQuantity(item, 1)}>
                  <Plus size={13} color={colors.text} />
                </TouchableOpacity>
              </View>
              {/* Save for later */}
              <TouchableOpacity style={styles.iconAction} onPress={() => handleSaveForLater(item)}>
                <Bookmark size={16} color={colors.primary} />
              </TouchableOpacity>
              {/* Remove */}
              <TouchableOpacity style={styles.iconAction} onPress={() => handleDelete(item._id)}>
                <Trash2 size={16} color="#ff4d6d" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.moveToCartBtn} onPress={() => handleMoveToCart(item)}>
                <ShoppingBag size={13} color={colors.primary} />
                <Text style={styles.moveToCartText}>Move to Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconAction} onPress={() => handleDelete(item._id)}>
                <BookmarkX size={16} color="#ff4d6d" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shopping Bag</Text>
          <Text style={styles.headerSub}>
            {activeItems.length} active · {savedItems.length} saved
          </Text>
        </View>
        <TouchableOpacity onPress={fetchBag} style={styles.refreshBtn}>
          <RefreshCw size={17} color={colors.subtext} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Coupon strip */}
        <TouchableOpacity style={styles.couponStrip} activeOpacity={0.8}>
          <Tag size={16} color={colors.primary} />
          <Text style={styles.couponText}>Apply coupon / promo code</Text>
          <ChevronRight size={16} color={colors.subtext} />
        </TouchableOpacity>

        {/* ── Active Cart Items ─────────────────────────────────────────── */}
        {activeItems.length > 0 && (
          <>
            <View style={styles.sectionLabel}>
              <ShoppingBag size={14} color={colors.primary} />
              <Text style={styles.sectionLabelText}>CART ({activeItems.length})</Text>
            </View>
            {activeItems.map((item: any) => (
              <CartItemCard key={item._id} item={item} saved={false} />
            ))}
          </>
        )}

        {/* ── Discontinued warnings ─────────────────────────────────────── */}
        {discontinuedItems.length > 0 && (
          <View style={styles.discontinuedBanner}>
            <AlertTriangle size={16} color="#ef4444" />
            <Text style={styles.discontinuedText}>
              {discontinuedItems.length} item{discontinuedItems.length > 1 ? "s are" : " is"} no longer available and {discontinuedItems.length > 1 ? "have" : "has"} been flagged.
            </Text>
          </View>
        )}

        {/* ── Price Summary ─────────────────────────────────────────────── */}
        {activeItems.length > 0 && (
          <View style={styles.priceBreakdown}>
            <Text style={styles.priceBreakdownTitle}>PRICE DETAILS</Text>
            <View style={styles.priceDetailRow}>
              <Text style={styles.priceLabel}>Price ({activeItems.length} items)</Text>
              <Text style={styles.priceValue}>₹{total}</Text>
            </View>
            <View style={styles.priceDetailRow}>
              <Text style={styles.priceLabel}>Delivery Charges</Text>
              <Text style={[styles.priceValue, { color: "#22c55e" }]}>FREE</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceDetailRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>₹{total}</Text>
            </View>
          </View>
        )}

        {/* ── Save for Later section ────────────────────────────────────── */}
        {savedItems.length > 0 && (
          <>
            <View style={styles.sectionLabel}>
              <Bookmark size={14} color={colors.primary} />
              <Text style={styles.sectionLabelText}>SAVED FOR LATER ({savedItems.length})</Text>
            </View>
            {savedItems.map((item: any) => (
              <CartItemCard key={item._id} item={item} saved={true} />
            ))}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer — only show if active cart has items */}
      {activeItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerTotalLabel}>Total</Text>
            <Text style={styles.footerTotalAmount}>₹{total}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => router.push("/checkout")}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutButtonText}>PLACE ORDER →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: any, theme: string) =>
  StyleSheet.create({
    loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 18,
      paddingTop: 52,
      paddingBottom: 14,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerTitle: { fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: 0.5 },
    headerSub: { fontSize: 12, color: colors.subtext, marginTop: 2 },
    refreshBtn: { padding: 6 },
    content: { flex: 1 },
    emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
    emptyTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginTop: 12 },
    emptySubtitle: { fontSize: 14, color: colors.subtext, textAlign: "center" },
    ctaBtn: { backgroundColor: colors.primary, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
    ctaBtnText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 1 },
    couponStrip: {
      flexDirection: "row", alignItems: "center", gap: 10,
      margin: 14, padding: 14,
      backgroundColor: colors.card, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border, borderStyle: "dashed",
    },
    couponText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" },
    sectionLabel: {
      flexDirection: "row", alignItems: "center", gap: 6,
      paddingHorizontal: 14, paddingTop: 6, paddingBottom: 4,
    },
    sectionLabelText: { fontSize: 11, fontWeight: "800", color: colors.primary, letterSpacing: 1.5 },
    bagItem: {
      flexDirection: "row",
      backgroundColor: colors.card,
      marginHorizontal: 14, marginBottom: 12,
      borderRadius: 16, overflow: "hidden",
      borderWidth: 1, borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    savedItemCard: {
      borderColor: `${colors.primary}40`,
      borderStyle: "dashed",
      opacity: 0.9,
    },
    savedBadge: {
      position: "absolute", top: 8, left: 8, zIndex: 2,
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: `${colors.primary}18`,
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
    },
    savedBadgeText: { fontSize: 9, fontWeight: "800", color: colors.primary, letterSpacing: 1 },
    conflictBanner: {
      position: "absolute", top: 0, left: 0, right: 0, zIndex: 5,
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: "#fef3c7", padding: 8,
    },
    conflictText: { flex: 1, fontSize: 11, color: "#92400e", fontWeight: "600" },
    itemImage: { width: 110, height: 150 },
    itemInfo: { flex: 1, padding: 12, justifyContent: "space-between", paddingTop: 24 },
    brandName: { fontSize: 11, fontWeight: "700", color: colors.subtext, textTransform: "uppercase", letterSpacing: 0.5 },
    itemName: { fontSize: 13, color: colors.text, fontWeight: "500", lineHeight: 18, marginTop: 2 },
    sizeRow: { flexDirection: "row", marginTop: 5 },
    sizeBadge: {
      backgroundColor: colors.inputBackground,
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
      borderWidth: 1, borderColor: colors.border,
    },
    sizeText: { fontSize: 11, color: colors.text, fontWeight: "600" },
    priceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    itemPrice: { fontSize: 15, fontWeight: "800", color: colors.text },
    priceChanged: { fontSize: 11, color: "#f59e0b", fontWeight: "600", textDecorationLine: "line-through" },
    actionRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
    quantityContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
    quantityButton: {
      width: 26, height: 26, borderRadius: 7,
      backgroundColor: colors.inputBackground,
      borderWidth: 1, borderColor: colors.border,
      justifyContent: "center", alignItems: "center",
    },
    quantity: { marginHorizontal: 8, fontSize: 14, fontWeight: "700", color: colors.text, minWidth: 16, textAlign: "center" },
    iconAction: { padding: 5 },
    moveToCartBtn: {
      flexDirection: "row", alignItems: "center", gap: 5,
      backgroundColor: `${colors.primary}15`,
      paddingHorizontal: 10, paddingVertical: 5,
      borderRadius: 8, borderWidth: 1, borderColor: `${colors.primary}30`,
    },
    moveToCartText: { fontSize: 11, fontWeight: "700", color: colors.primary },
    discontinuedBanner: {
      flexDirection: "row", alignItems: "center", gap: 10,
      backgroundColor: "#fee2e2", margin: 14, padding: 12, borderRadius: 12,
    },
    discontinuedText: { flex: 1, fontSize: 12, color: "#dc2626", fontWeight: "600" },
    priceBreakdown: {
      margin: 14, padding: 16,
      backgroundColor: colors.card, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border,
    },
    priceBreakdownTitle: { fontSize: 11, fontWeight: "800", color: colors.subtext, letterSpacing: 1.5, marginBottom: 12 },
    priceDetailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    priceLabel: { fontSize: 14, color: colors.text },
    priceValue: { fontSize: 14, fontWeight: "600", color: colors.text },
    priceDivider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
    totalLabel: { fontSize: 15, fontWeight: "700", color: colors.text },
    totalAmount: { fontSize: 17, fontWeight: "800", color: colors.text },
    footer: {
      flexDirection: "row", alignItems: "center",
      padding: 14, paddingBottom: 20,
      backgroundColor: colors.card,
      borderTopWidth: 1, borderTopColor: colors.border, gap: 14,
    },
    footerTotal: { flex: 1 },
    footerTotalLabel: { fontSize: 12, color: colors.subtext },
    footerTotalAmount: { fontSize: 18, fontWeight: "800", color: colors.text },
    checkoutButton: { flex: 2, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
    checkoutButtonText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
  });
