import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ShoppingBag, Minus, Plus, Trash2, ChevronRight, Tag } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import API_URL from "@/constants/Api";
import { useTheme } from "@/context/ThemeContext";

const { width } = Dimensions.get("window");

export default function Bag() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [bagItems, setBagItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const { colors, theme } = useTheme();
  const styles = getStyles(colors, theme);

  useEffect(() => {
    fetchBag();
  }, [user]);

  const fetchBag = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/bag?userId=${user._id}`);
      const data = res.data;
      // Handle both array (old API) and object (new API with activeItems)
      if (Array.isArray(data)) {
        setBagItems(data);
        const t = data.reduce(
          (sum: number, item: any) => sum + (item.productId?.price || 0) * (item.quantity || 1),
          0
        );
        setTotal(t);
      } else {
        const active = data.activeItems || [];
        setBagItems(active);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await axios.delete(`${API_URL}/bag?itemId=${itemId}`);
      fetchBag();
    } catch (error) {
      console.log(error);
    }
  };

  const handleQuantity = async (item: any, delta: number) => {
    const newQty = (item.quantity || 1) + delta;
    if (newQty < 1) return;
    try {
      await axios.patch(`${API_URL}/bag?action=update-quantity`, {
        itemId: item._id,
        quantity: newQty,
        expectedVersion: item.__v ?? 0,
      });
      fetchBag();
    } catch {
      // Fallback: just refresh
      fetchBag();
    }
  };

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
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push("/login")}>
            <Text style={styles.loginButtonText}>LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isLoading && bagItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Bag</Text>
        </View>
        <View style={styles.emptyState}>
          <ShoppingBag size={72} color={colors.primary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Your bag is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to get started</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push("/")}>
            <Text style={styles.loginButtonText}>SHOP NOW</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Bag</Text>
        <Text style={styles.headerSub}>{bagItems.length} {bagItems.length === 1 ? "item" : "items"}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Coupon strip */}
        <TouchableOpacity style={styles.couponStrip} activeOpacity={0.8}>
          <Tag size={16} color={colors.primary} />
          <Text style={styles.couponText}>Apply coupon / promo code</Text>
          <ChevronRight size={16} color={colors.subtext} />
        </TouchableOpacity>

        {bagItems.map((item: any) => (
          <View key={item._id} style={styles.bagItem}>
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
              <Text style={styles.itemPrice}>₹{item.productId?.price}</Text>

              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleQuantity(item, -1)}
                >
                  <Minus size={14} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleQuantity(item, 1)}
                >
                  <Plus size={14} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleDelete(item._id)}
                >
                  <Trash2 size={18} color="#ff4d6d" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Price breakdown */}
        <View style={styles.priceBreakdown}>
          <Text style={styles.priceBreakdownTitle}>PRICE DETAILS</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Price ({bagItems.length} items)</Text>
            <Text style={styles.priceValue}>₹{total}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charges</Text>
            <Text style={[styles.priceValue, { color: "#2ecc71" }]}>FREE</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{total}</Text>
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Footer */}
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
    </View>
  );
}

const getStyles = (colors: any, theme: string) =>
  StyleSheet.create({
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 18,
      paddingTop: 52,
      paddingBottom: 14,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: 0.5,
    },
    headerSub: {
      fontSize: 13,
      color: colors.subtext,
      marginTop: 2,
    },
    content: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginTop: 12,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.subtext,
      textAlign: "center",
    },
    loginButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 40,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 8,
    },
    loginButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 1,
    },
    couponStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      margin: 14,
      padding: 14,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
    },
    couponText: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    bagItem: {
      flexDirection: "row",
      backgroundColor: colors.card,
      marginHorizontal: 14,
      marginBottom: 12,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3,
    },
    itemImage: {
      width: 110,
      height: 140,
    },
    itemInfo: {
      flex: 1,
      padding: 12,
      justifyContent: "space-between",
    },
    brandName: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.subtext,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    itemName: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
      lineHeight: 19,
      marginTop: 2,
    },
    sizeRow: {
      flexDirection: "row",
      marginTop: 6,
    },
    sizeBadge: {
      backgroundColor: colors.inputBackground,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sizeText: {
      fontSize: 11,
      color: colors.text,
      fontWeight: "600",
    },
    itemPrice: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      marginTop: 6,
    },
    quantityContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      gap: 4,
    },
    quantityButton: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    quantity: {
      marginHorizontal: 10,
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      minWidth: 18,
      textAlign: "center",
    },
    removeButton: {
      marginLeft: "auto",
      padding: 4,
    },
    priceBreakdown: {
      margin: 14,
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    priceBreakdownTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.subtext,
      letterSpacing: 1.5,
      marginBottom: 12,
    },
    priceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    priceLabel: {
      fontSize: 14,
      color: colors.text,
    },
    priceValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    priceDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 10,
    },
    totalLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    totalAmount: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.text,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      paddingBottom: 20,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 14,
    },
    footerTotal: {
      flex: 1,
    },
    footerTotalLabel: {
      fontSize: 12,
      color: colors.subtext,
    },
    footerTotalAmount: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    checkoutButton: {
      flex: 2,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    checkoutButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
  });
