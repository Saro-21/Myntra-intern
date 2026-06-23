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
import { ArrowLeft, Trash2, Eye } from "lucide-react-native";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";

export default function RecentlyViewedScreen() {
  const router = useRouter();
  const { recentlyViewed, clearHistory, isLoading } = useRecentlyViewed();

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#3e3e3e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recently Viewed</Text>
        </View>
        {recentlyViewed.length > 0 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearButton} activeOpacity={0.7}>
            <Trash2 size={20} color="#ff3f6c" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ff3f6c" />
        </View>
      ) : recentlyViewed.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}>
            <Eye size={48} color="#ff3f6c" />
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
          keyExtractor={(item) => item.productId}
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
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
    color: "#3e3e3e",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 4,
  },
  clearText: {
    color: "#ff3f6c",
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
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
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
    color: "#888",
    fontWeight: "600",
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    color: "#3e3e3e",
    marginBottom: 5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3e3e3e",
    marginRight: 8,
  },
  discount: {
    fontSize: 12,
    color: "#ff3f6c",
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    backgroundColor: "#fff",
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff0f3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3e3e3e",
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: "#ff3f6c",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    shadowColor: "#ff3f6c",
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
