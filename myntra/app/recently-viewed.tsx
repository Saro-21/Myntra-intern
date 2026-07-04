import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Trash2, Eye, Clock } from "lucide-react-native";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { useTheme } from "@/context/ThemeContext";

const formatRelativeTime = (dateString: string) => {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
};

export default function RecentlyViewedScreen() {
  const router = useRouter();
  const { recentlyViewed, clearHistory, isLoading } = useRecentlyViewed();
  const { theme, colors } = useTheme();

  const styles = getStyles(theme, colors);

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recently Viewed</Text>
        </View>
        {recentlyViewed.length > 0 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearButton} activeOpacity={0.7}>
            <Trash2 size={20} color={colors.primary} />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : recentlyViewed.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}>
            <Eye size={48} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your history is empty</Text>
          <Text style={styles.emptySubtitle}>
            Products you view will show up here to help you keep track of your choices.
          </Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => router.replace("/")} activeOpacity={0.8}>
            <Text style={styles.shopButtonText}>START SHOPPING</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recentlyViewed}
          keyExtractor={(item: any) => item.productId}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => handleProductPress(item.productId)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: item.images[0] }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.brandName} numberOfLines={1}>{item.brand}</Text>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>₹{item.price}</Text>
                  <Text style={styles.discount}>{item.discount}</Text>
                </View>
                <View style={styles.timeRow}>
                  <Clock size={12} color={colors.subtext} />
                  <Text style={styles.viewedTime}>{formatRelativeTime(item.viewedAt)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const getStyles = (theme: string, colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingTop: 50,
      paddingBottom: 15,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    backButton: {
      padding: 8,
      marginRight: 5,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    clearButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 8,
      gap: 4,
    },
    clearText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 14,
    },
    listContent: {
      padding: 15,
    },
    productCard: {
      width: "47%",
      marginHorizontal: "1.5%",
      marginBottom: 15,
      backgroundColor: colors.card,
      borderRadius: 10,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
      overflow: "hidden",
    },
    productImage: {
      width: "100%",
      height: 180,
      resizeMode: "cover",
    },
    productInfo: {
      padding: 10,
    },
    brandName: {
      fontSize: 13,
      color: colors.subtext,
      fontWeight: "600",
      marginBottom: 2,
    },
    productName: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 5,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    productPrice: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
      marginRight: 8,
    },
    discount: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "600",
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 6,
    },
    viewedTime: {
      fontSize: 11,
      color: colors.subtext,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 30,
      backgroundColor: colors.background,
    },
    iconCircle: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: theme === 'myntra' ? colors.border : (theme === 'dark' ? '#251c20' : '#fff0f3'),
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 10,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.subtext,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 30,
    },
    shopButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 40,
      paddingVertical: 15,
      borderRadius: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 3,
    },
    shopButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "bold",
    },
  });

