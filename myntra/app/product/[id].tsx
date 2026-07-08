import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Heart, ShoppingBag, ChevronRight, Bookmark } from "lucide-react-native";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { useTheme } from "@/context/ThemeContext";
import Toast from "react-native-toast-message";
import axios from "axios";
import API_URL from "@/constants/Api";

const isWeb = Platform.OS === "web";

// Mock product data - in a real app, this would come from an API
// const products = {
//   "1": {
//     id: 1,
//     name: "Casual White T-Shirt",
//     brand: "Roadster",
//     price: 499,
//     discount: "60% OFF",
//     description:
//       "Classic white t-shirt made from premium cotton. Perfect for everyday wear with a comfortable regular fit.",
//     sizes: ["S", "M", "L", "XL"],
//     images: [
//       "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop",
//       "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500&auto=format&fit=crop",
//       "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&auto=format&fit=crop",
//     ],
//   },
//   "2": {
//     id: 2,
//     name: "Denim Jacket",
//     brand: "Levis",
//     price: 2499,
//     discount: "40% OFF",
//     description:
//       "Classic denim jacket with a modern twist. Features premium quality denim and comfortable fit.",
//     sizes: ["S", "M", "L", "XL"],
//     images: [
//       "https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?w=500&auto=format&fit=crop",
//       "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop",
//       "https://images.unsplash.com/photo-1601933973783-43cf8a7d4c5f?w=500&auto=format&fit=crop",
//     ],
//   },
//   "3": {
//     id: 3,
//     name: "Summer Dress",
//     brand: "ONLY",
//     price: 1299,
//     discount: "50% OFF",
//     description:
//       "Flowy summer dress perfect for warm weather. Made from lightweight fabric with a flattering cut.",
//     sizes: ["XS", "S", "M", "L"],
//     images: [
//       "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&auto=format&fit=crop",
//       "https://images.unsplash.com/photo-1623609163859-ca93c959b98a?w=500&auto=format&fit=crop",
//       "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop",
//     ],
//   },
//   "4": {
//     id: 4,
//     name: "Classic Sneakers",
//     brand: "Nike",
//     price: 3499,
//     discount: "30% OFF",
//     description:
//       "Versatile sneakers that combine style and comfort. Perfect for both casual wear and light exercise.",
//     sizes: ["UK6", "UK7", "UK8", "UK9", "UK10"],
//     images: [
//       "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop",
//       "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=500&auto=format&fit=crop",
//       "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop",
//     ],
//   },
// };

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedSize, setSelectedSize] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoScrollTimer = useRef<NodeJS.Timeout>();
  const { user } = useAuth();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const [product, setproduct] = useState<any>(null);
  const [iswishlist, setiswishlist] = useState(false);
  const [isSavedForLater, setIsSavedForLater] = useState(false);
  const { theme, colors } = useTheme();
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const styles = getStyles(theme, colors, width);

  useEffect(() => {
    if (!id) return;

    const fetchproduct = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${API_URL}/product?id=${id}`);
        setproduct(res.data);

        if (res.data) {
          addToRecentlyViewed(res.data);
        }

        if (user && res.data) {
          const [wishlistRes, bagRes] = await Promise.all([
            axios.get(`${API_URL}/wishlist?userId=${user._id}`),
            axios.get(`${API_URL}/bag?userId=${user._id}`)
          ]);
          const inWishlist = wishlistRes.data.some((item: any) => item.productId?._id === res.data._id);
          setiswishlist(inWishlist);

          const savedItems = bagRes.data?.savedItems || [];
          const isSaved = savedItems.some((item: any) => item.productId?._id === res.data._id);
          setIsSavedForLater(isSaved);
        }

        // Fetch personalized recommendations (falls back to cold-start for anonymous)
        const recUrl = user
          ? `${API_URL}/recommendations?userId=${user._id}&limit=8`
          : `${API_URL}/recommendations?limit=8`;
        const recRes = await axios.get(recUrl);
        const recData = Array.isArray(recRes.data) ? recRes.data : [];
        // Exclude the current product from recommendations
        setRecommendations(recData.filter((p: any) => String(p._id) !== String(id)));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchproduct();
  }, [id, user]);

  useEffect(() => {
    // Start auto-scroll
    startAutoScroll();

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, []);

  const startAutoScroll = () => {
    autoScrollTimer.current = setInterval(() => {
      if (product && scrollViewRef.current) {
        const nextIndex = (currentImageIndex + 1) % product.images.length;
        scrollViewRef.current.scrollTo({
          x: nextIndex * width,
          animated: true,
        });
        setCurrentImageIndex(nextIndex);
      }
    }, 3000);
  };


  const handleAddwishlist = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      if (iswishlist) {
        // Find item in wishlist to delete it
        const wishlistRes = await axios.get(`${API_URL}/wishlist?userId=${user._id}`);
        const wishlistItem = wishlistRes.data.find((item: any) => item.productId?._id === product._id);
        if (wishlistItem) {
          await axios.delete(`${API_URL}/wishlist?itemId=${wishlistItem._id}`);
          setiswishlist(false);
        }
      } else {
        await axios.post(`${API_URL}/wishlist`, {
          userId: user._id,
          productId: product._id,
        });
        setiswishlist(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSaveForLater = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      if (isSavedForLater) {
        const bagRes = await axios.get(`${API_URL}/bag?userId=${user._id}`);
        const savedItem = (bagRes.data?.savedItems || []).find((item: any) => item.productId?._id === product._id);
        if (savedItem) {
          await axios.delete(`${API_URL}/bag?itemId=${savedItem._id}`);
          setIsSavedForLater(false);
          Toast.show({
            type: 'info',
            text1: 'Removed',
            text2: 'Item removed from Saved Items',
            position: 'top',
          });
        }
      } else {
        await axios.post(`${API_URL}/bag`, {
          userId: user._id,
          productId: product._id,
          size: selectedSize || "M",
          quantity: 1,
          savedForLater: true
        });
        setIsSavedForLater(true);
        import("@/utils/notifications").then(({ showWebNotification }) => {
          showWebNotification({
            title: "Saved for Later ❤️",
            body: `${product.name} has been saved for later.`,
          });
        });
        Toast.show({
          type: 'success',
          text1: 'Saved for Later',
          text2: 'Item has been saved for later',
          position: 'top',
        });
      }
    } catch (error) {
      console.log("Failed to save for later:", error);
    }
  };
  const handleAddToBag = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!selectedSize) {
      Toast.show({
        type: 'error',
        text1: 'Select Size',
        text2: 'Please select a size before adding to bag',
        position: 'top',
      });
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API_URL}/bag`, {
        userId: user._id,
        productId: product._id,
        size: selectedSize,
        quantity: 1,
      });
      import("@/utils/notifications").then(({ showWebNotification }) => {
        showWebNotification({
          title: "Added to Bag 🛍️",
          body: `${product.name} has been added to your bag.`,
        });
      });
      Toast.show({
        type: 'success',
        text1: 'Added to Bag',
        text2: 'Item has been added to your bag',
        position: 'top',
      });
      router.push("/bag");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
    // In a real app, this would add the item to the cart in your state management solution
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const imageIndex = Math.round(contentOffset.x / width);
    setCurrentImageIndex(imageIndex);

    // Reset auto-scroll timer when user manually scrolls
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      startAutoScroll();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {product.images.map((image: any, index: any) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={[styles.productImage, { width }]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          <View style={styles.pagination}>
            {product.images.map((_: any, index: any) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  currentImageIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.brand}>{product.brand}</Text>
              <Text style={styles.name}>{product.name}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSavedForLater && styles.saveButtonActive
                ]}
                onPress={handleSaveForLater}
                activeOpacity={0.7}
              >
                <Bookmark
                  size={16}
                  color={isSavedForLater ? "#fff" : colors.primary}
                  fill={isSavedForLater ? "#fff" : "none"}
                />
                <Text style={[styles.saveButtonText, isSavedForLater && styles.saveButtonTextActive]}>
                  {isSavedForLater ? "SAVED" : "SAVE"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.wishlistButton}
                onPress={handleAddwishlist}
              >
                <Heart
                  size={24}
                  color={iswishlist ? colors.primary : colors.icon}
                  fill={iswishlist ? colors.primary : "none"}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{product.price}</Text>
            <Text style={styles.discount}>{product.discount}</Text>
          </View>

          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.sizeSection}>
            <Text style={styles.sizeTitle}>Select Size</Text>
            <View style={styles.sizeGrid}>
              {product.sizes.map((size: any) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeButton,
                    selectedSize === size && styles.selectedSize,
                  ]}
                  onPress={() => setSelectedSize(size)}
                >
                  <Text
                    style={[
                      styles.sizeText,
                      selectedSize === size && styles.selectedSizeText,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── You May Also Like ─────────────────────────────────────────── */}
        {recommendations.length > 0 && (
          <View style={styles.recsSection}>
            <View style={styles.recsSectionHeader}>
              <View>
                <Text style={styles.recsSectionTitle}>YOU MAY ALSO LIKE</Text>
                <Text style={styles.recsSectionSub}>
                  {user ? "Personalised for you" : "Popular picks"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.recsViewAll}
                onPress={() => router.push("/categories")}
              >
                <Text style={styles.recsViewAllText}>See all</Text>
                <ChevronRight size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recsScroll}
            >
              {recommendations.map((rec: any) => (
                <TouchableOpacity
                  key={rec._id}
                  style={styles.recCard}
                  className={isWeb ? "hover-grow" : undefined}
                  onPress={() => router.push(`/product/${rec._id}`)}
                  activeOpacity={0.88}
                >
                  <Image
                    source={{ uri: rec.images?.[0] }}
                    style={styles.recImage}
                    resizeMode="cover"
                  />
                  {rec.discount && (
                    <View style={styles.recBadge}>
                      <Text style={styles.recBadgeText}>{rec.discount}</Text>
                    </View>
                  )}
                  <View style={styles.recInfo}>
                    <Text style={styles.recBrand} numberOfLines={1}>{rec.brand}</Text>
                    <Text style={styles.recName} numberOfLines={2}>{rec.name}</Text>
                    <Text style={styles.recPrice}>₹{rec.price}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addToBagButton}
          onPress={handleAddToBag}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <ShoppingBag size={20} color="#fff" />
              <Text style={styles.addToBagText}>ADD TO BAG</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme: string, colors: any, screenWidth: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
    carouselContainer: { position: "relative" },
    productImage: { height: 400 },
    pagination: {
      position: "absolute", bottom: 16,
      flexDirection: "row", width: "100%",
      justifyContent: "center", alignItems: "center",
    },
    paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)", marginHorizontal: 4 },
    paginationDotActive: { backgroundColor: "#fff", width: 10, height: 10, borderRadius: 5 },
    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: "transparent",
      alignSelf: "center",
    },
    saveButtonActive: {
      backgroundColor: colors.primary,
    },
    saveButtonText: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.primary,
      letterSpacing: 0.5,
    },
    saveButtonTextActive: {
      color: "#fff",
    },
    content: { padding: 20 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    brand: { fontSize: 16, color: colors.subtext, marginBottom: 5 },
    name: { fontSize: 20, fontWeight: "bold", color: colors.text, marginBottom: 10 },
    wishlistButton: { padding: 10 },
    priceContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
    price: { fontSize: 20, fontWeight: "bold", color: colors.text, marginRight: 10 },
    discount: { fontSize: 16, color: colors.primary },
    description: { fontSize: 16, color: colors.subtext, lineHeight: 24, marginBottom: 20 },
    sizeSection: { marginBottom: 20 },
    sizeTitle: { fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 10 },
    sizeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    sizeButton: {
      width: 60, height: 60, borderRadius: 30,
      borderWidth: 1, borderColor: colors.border,
      justifyContent: "center", alignItems: "center",
      backgroundColor: colors.card,
    },
    selectedSize: {
      borderColor: colors.primary,
      backgroundColor: theme === 'myntra' ? colors.border : (theme === 'dark' ? '#251c20' : '#fff4f4'),
    },
    sizeText: { fontSize: 16, color: colors.text },
    selectedSizeText: { color: colors.primary, fontWeight: "bold" },
    footer: { padding: 15, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
    addToBagButton: {
      backgroundColor: colors.primary,
      flexDirection: "row", justifyContent: "center", alignItems: "center",
      padding: 15, borderRadius: 10, gap: 10,
    },
    addToBagText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    emptyText: { fontSize: 16, color: colors.text, textAlign: "center", marginTop: 50 },
    // ── You May Also Like ──
    recsSection: { paddingTop: 8, paddingBottom: 20 },
    recsSectionHeader: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingHorizontal: 16, marginBottom: 12,
    },
    recsSectionTitle: { fontSize: 12, fontWeight: "800", color: colors.text, letterSpacing: 1.5 },
    recsSectionSub: { fontSize: 11, color: colors.subtext, marginTop: 2 },
    recsViewAll: { flexDirection: "row", alignItems: "center", gap: 2 },
    recsViewAllText: { fontSize: 12, fontWeight: "700", color: colors.primary },
    recsScroll: { paddingHorizontal: 14, gap: 12 },
    recCard: {
      width: 140,
      backgroundColor: colors.card,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1, borderColor: colors.border,
    },
    recImage: { width: "100%", height: 160 },
    recBadge: {
      position: "absolute", top: 8, left: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    },
    recBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
    recInfo: { padding: 8 },
    recBrand: { fontSize: 10, fontWeight: "700", color: colors.subtext, textTransform: "uppercase", letterSpacing: 0.5 },
    recName: { fontSize: 12, color: colors.text, fontWeight: "500", marginTop: 2, lineHeight: 16 },
    recPrice: { fontSize: 13, fontWeight: "800", color: colors.text, marginTop: 4 },
  });
