import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, ChevronRight, Heart, Bell, Sparkles } from "lucide-react-native";
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import axios from "axios";
import API_URL from "@/constants/Api";
import { useTheme } from "@/context/ThemeContext";
import { Animated } from "react-native";

const { width } = Dimensions.get("window");

const bannerSlides = [
  {
    id: 1,
    uri: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop",
    tag: "NEW ARRIVALS",
    title: "Summer\nCollection",
    cta: "Shop Now",
  },
  {
    id: 2,
    uri: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
    tag: "SALE",
    title: "Up to 70%\nOff",
    cta: "Explore Deals",
  },
  {
    id: 3,
    uri: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop",
    tag: "TRENDING",
    title: "Premium\nBrands",
    cta: "Discover",
  },
];

const deals = [
  {
    id: 1,
    title: "Under ₹599",
    subtitle: "Best Prices",
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&auto=format&fit=crop",
    badge: "HOT",
  },
  {
    id: 2,
    title: "40-70% Off",
    subtitle: "Limited Time",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop",
    badge: "SALE",
  },
  {
    id: 3,
    title: "New In",
    subtitle: "Just Dropped",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500&auto=format&fit=crop",
    badge: "NEW",
  },
];

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const { user } = useAuth();
  const { recentlyViewed } = useRecentlyViewed();
  const { colors, theme } = useTheme();
  const styles = getStyles(colors, theme);

  // Banner auto-scroll
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef<FlatList>(null);
  const bannerScrollX = useRef(new Animated.Value(0)).current;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % bannerSlides.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); // ← empty deps: created once, no memory leak

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [catRes, prodRes] = await Promise.all([
          axios.get(`${API_URL}/category`),
          axios.get(`${API_URL}/product`),
        ]);
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleProductPress = (productId: string | number) => {
    router.push(`/product/${productId}`);
  };

  const renderBanner = ({ item }: { item: typeof bannerSlides[0] }) => (
    <View style={styles.bannerSlide}>
      <Image source={{ uri: item.uri }} style={styles.bannerImage} resizeMode="cover" />
      <View style={styles.bannerOverlay} />
      <View style={styles.bannerContent}>
        <View style={styles.bannerTag}>
          <Text style={styles.bannerTagText}>{item.tag}</Text>
        </View>
        <Text style={styles.bannerTitle}>{item.title}</Text>
        <TouchableOpacity style={styles.bannerCta}>
          <Text style={styles.bannerCtaText}>{item.cta}</Text>
          <ChevronRight size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>MYNTRA</Text>
          <Text style={styles.greeting}>
            {user ? `Hi, ${user.name?.split(" ")[0]} 👋` : "Discover Fashion"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/notifications")}>
            <Bell size={22} color={colors.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/wishlist")}>
            <Heart size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => router.push("/categories")}
        activeOpacity={0.7}
      >
        <Search size={18} color={colors.subtext} />
        <Text style={styles.searchPlaceholder}>Search brands, products & more...</Text>
      </TouchableOpacity>

      {/* Promo Banner Carousel */}
      <View style={styles.bannerContainer}>
        <FlatList
          ref={bannerRef}
          data={bannerSlides}
          renderItem={renderBanner}
          keyExtractor={(item) => String(item.id)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: bannerScrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveBanner(idx);
          }}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />
        {/* Dots */}
        <View style={styles.bannerDots}>
          {bannerSlides.map((_, i) => (
            <View
              key={i}
              style={[styles.bannerDot, i === activeBanner && styles.bannerDotActive]}
            />
          ))}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>SHOP BY CATEGORY</Text>
            <Text style={styles.sectionSubtitle}>Explore our collections</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => router.push("/categories")}
          >
            <Text style={styles.viewAllText}>See All</Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
          ) : categories.length === 0 ? (
            <Text style={styles.emptyText}>No categories yet</Text>
          ) : (
            categories.map((cat: any) => (
              <TouchableOpacity
                key={cat._id}
                style={styles.categoryCard}
                onPress={() =>
                  router.push({ pathname: "/categories", params: { categoryId: cat._id } })
                }
                activeOpacity={0.85}
              >
                <View style={styles.categoryImageWrap}>
                  <Image source={{ uri: cat.image }} style={styles.categoryImage} />
                  <View style={styles.categoryOverlay} />
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* Deals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>TODAY'S DEALS</Text>
            <Text style={styles.sectionSubtitle}>Limited time offers</Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dealsScroll}
        >
          {deals.map((deal) => (
            <TouchableOpacity key={deal.id} style={styles.dealCard} activeOpacity={0.9}>
              <Image source={{ uri: deal.image }} style={styles.dealImage} resizeMode="cover" />
              <View style={styles.dealOverlay} />
              <View style={styles.dealBadge}>
                <Text style={styles.dealBadgeText}>{deal.badge}</Text>
              </View>
              <View style={styles.dealContent}>
                <Text style={styles.dealTitle}>{deal.title}</Text>
                <Text style={styles.dealSubtitle}>{deal.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Recently Viewed */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>RECENTLY VIEWED</Text>
              <Text style={styles.sectionSubtitle}>Continue where you left off</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push("/recently-viewed")}
            >
              <Text style={styles.viewAllText}>See All</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentScroll}
          >
            {recentlyViewed.map((item) => (
              <TouchableOpacity
                key={item.productId}
                style={styles.recentCard}
                onPress={() => handleProductPress(item.productId)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: item.images[0] }} style={styles.recentImage} />
                <View style={styles.recentInfo}>
                  <Text style={styles.recentBrand} numberOfLines={1}>{item.brand}</Text>
                  <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.recentPrice}>₹{item.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Trending Now */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>TRENDING NOW</Text>
            <Text style={styles.sectionSubtitle}>What everyone's wearing</Text>
          </View>
          <View style={styles.trendingBadge}>
            <Sparkles size={12} color={colors.primary} />
            <Text style={styles.trendingBadgeText}>Live</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : products.length === 0 ? (
          <Text style={styles.emptyText}>No products available</Text>
        ) : (
          <View style={styles.productsGrid}>
            {products.map((product: any) => (
              <TouchableOpacity
                key={product._id}
                style={styles.productCard}
                onPress={() => handleProductPress(product._id)}
                activeOpacity={0.9}
              >
                <View style={styles.productImageWrap}>
                  <Image
                    source={{ uri: product.images[0] }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  {product.discount && (
                    <View style={styles.productDiscountBadge}>
                      <Text style={styles.productDiscountText}>{product.discount}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.wishlistBtn}>
                    <Heart size={16} color={colors.subtext} />
                  </TouchableOpacity>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.brandName} numberOfLines={1}>{product.brand}</Text>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>₹{product.price}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const getStyles = (colors: any, theme: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 18,
      paddingTop: 52,
      paddingBottom: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    logo: {
      fontSize: 22,
      fontWeight: "900",
      color: colors.primary,
      letterSpacing: 3,
    },
    greeting: {
      fontSize: 12,
      color: colors.subtext,
      marginTop: 1,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.inputBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    notifDot: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.card,
    },
    // Search
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      margin: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    searchPlaceholder: {
      color: colors.subtext,
      fontSize: 14,
      flex: 1,
    },
    // Banner
    bannerContainer: {
      position: "relative",
      marginBottom: 4,
    },
    bannerSlide: {
      width,
      height: 210,
      position: "relative",
    },
    bannerImage: {
      width: "100%",
      height: "100%",
    },
    bannerOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    bannerContent: {
      position: "absolute",
      bottom: 32,
      left: 24,
      right: 24,
    },
    bannerTag: {
      alignSelf: "flex-start",
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
      marginBottom: 8,
    },
    bannerTagText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.5,
    },
    bannerTitle: {
      color: "#fff",
      fontSize: 26,
      fontWeight: "900",
      lineHeight: 32,
      marginBottom: 12,
    },
    bannerCta: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: "rgba(255,255,255,0.2)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.5)",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 4,
    },
    bannerCtaText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },
    bannerDots: {
      position: "absolute",
      bottom: 12,
      right: 20,
      flexDirection: "row",
      gap: 5,
    },
    bannerDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "rgba(255,255,255,0.4)",
    },
    bannerDotActive: {
      backgroundColor: "#fff",
      width: 18,
    },
    // Section
    section: {
      paddingHorizontal: 16,
      paddingTop: 22,
      paddingBottom: 4,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: 1.5,
    },
    sectionSubtitle: {
      fontSize: 11,
      color: colors.subtext,
      marginTop: 1,
    },
    viewAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    viewAllText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: "700",
    },
    // Categories
    categoriesScroll: {
      paddingRight: 8,
      gap: 12,
    },
    categoryCard: {
      width: 108,
      alignItems: "center",
    },
    categoryImageWrap: {
      width: 100,
      height: 100,
      borderRadius: 50,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: colors.border,
    },
    categoryImage: {
      width: "100%",
      height: "100%",
    },
    categoryOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.05)",
    },
    categoryName: {
      textAlign: "center",
      marginTop: 8,
      fontSize: 13,
      color: colors.text,
      fontWeight: "700",
    },

    // Deals
    dealsScroll: {
      gap: 12,
      paddingRight: 8,
    },
    dealCard: {
      width: 200,
      height: 130,
      borderRadius: 16,
      overflow: "hidden",
      position: "relative",
    },
    dealImage: {
      width: "100%",
      height: "100%",
    },
    dealOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.38)",
    },
    dealBadge: {
      position: "absolute",
      top: 10,
      right: 10,
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    dealBadgeText: {
      color: "#fff",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1,
    },
    dealContent: {
      position: "absolute",
      bottom: 12,
      left: 14,
    },
    dealTitle: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
    },
    dealSubtitle: {
      color: "rgba(255,255,255,0.75)",
      fontSize: 11,
      marginTop: 2,
    },
    // Recently Viewed
    recentScroll: {
      gap: 12,
      paddingRight: 8,
    },
    recentCard: {
      width: 130,
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    recentImage: {
      width: "100%",
      height: 110,
    },
    recentInfo: {
      padding: 8,
    },
    recentBrand: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.subtext,
      textTransform: "uppercase",
    },
    recentName: {
      fontSize: 12,
      color: colors.text,
      marginTop: 2,
    },
    recentPrice: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
      marginTop: 4,
    },
    // Trending badge
    trendingBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme === "dark" ? "#2a1f1f" : "#fff0f3",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme === "dark" ? "#4a2a2a" : "#ffd6df",
    },
    trendingBadgeText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: "700",
    },
    // Products
    productsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    productCard: {
      width: (width - 42) / 3,
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
      elevation: 3,
    },
    productImageWrap: {
      position: "relative",
    },
    productImage: {
      width: "100%",
      height: 180,
    },

    productDiscountBadge: {
      position: "absolute",
      top: 8,
      left: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    productDiscountText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "800",
    },
    wishlistBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme === "dark" ? "rgba(30,30,30,0.85)" : "rgba(255,255,255,0.88)",
      justifyContent: "center",
      alignItems: "center",
    },
    productInfo: {
      padding: 7,
    },
    brandName: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.subtext,
      textTransform: "uppercase",
      letterSpacing: 0.3,
      marginBottom: 1,
    },
    productName: {
      fontSize: 11,
      color: colors.text,
      lineHeight: 15,
      marginBottom: 4,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    productPrice: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.text,
    },
    emptyText: {
      color: colors.subtext,
      fontSize: 14,
      textAlign: "center",
      padding: 20,
    },
    loader: {
      marginTop: 40,
      marginBottom: 20,
    },
  });
