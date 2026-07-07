import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  FlatList,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, ChevronRight, Heart, Bell, TrendingUp } from "lucide-react-native";
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import axios from "axios";
import API_URL from "@/constants/Api";
import { useTheme } from "@/context/ThemeContext";

const bannerSlides = [
  {
    id: 1,
    uri: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&auto=format&fit=crop",
    tag: "NEW ARRIVALS",
    title: "Summer\nCollection 2025",
    cta: "Explore Now",
  },
  {
    id: 2,
    uri: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop",
    tag: "FLASH SALE",
    title: "Up to 70%\nOff Today Only",
    cta: "Shop Sale",
  },
  {
    id: 3,
    uri: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop",
    tag: "TRENDING",
    title: "Style Your\nEvery Moment",
    cta: "Discover",
  },
];

const deals = [
  {
    id: 1,
    title: "Under ₹599",
    subtitle: "Best Prices",
    badge: "HOT",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "40-70% Off",
    subtitle: "Limited Time",
    badge: "SALE",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "New In",
    subtitle: "Just Dropped",
    badge: "NEW",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&auto=format&fit=crop",
  },
];

const isWeb = Platform.OS === "web";

export default function Home() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const { user } = useAuth();
  const { recentlyViewed } = useRecentlyViewed();
  const { colors, theme } = useTheme();

  // Responsive layout
  const isWide = width > 1100;
  const isMid = width > 700;
  const productCols = isWide ? 5 : isMid ? 4 : 3;
  const dealCols = isWide ? 4 : isMid ? 3 : 3;
  const contentMaxWidth = isWide ? 1400 : "100%";

  const bannerWidth = isWide ? 1100 : width;
  const bannerHeight = isWide ? 380 : 240;

  const styles = getStyles(colors, theme, width, productCols);

  // Banner auto-scroll — web uses DOM scrollLeft, native uses scrollToIndex
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerFlatListRef = useRef<FlatList>(null);
  const webBannerRef = useRef<any>(null); // div ref for web
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeBannerRef = useRef(0); // shadow ref so interval closure has latest value
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    activeBannerRef.current = activeBanner;
  }, [activeBanner]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const next = (activeBannerRef.current + 1) % bannerSlides.length;
      setActiveBanner(next);
      if (Platform.OS === "web") {
        // Smooth CSS scroll on web
        const el = webBannerRef.current;
        if (el) {
          el.scrollTo({ left: next * bannerWidth, behavior: "smooth" });
        }
      } else {
        try {
          bannerFlatListRef.current?.scrollToIndex({ index: next, animated: true });
        } catch (_) {}
      }
    }, 3500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [bannerWidth]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const recUrl = user 
          ? `${API_URL}/recommendations?userId=${user._id}&limit=10`
          : `${API_URL}/recommendations?limit=10`;
        const [catRes, prodRes, recRes] = await Promise.all([
          axios.get(`${API_URL}/category`),
          axios.get(`${API_URL}/product`),
          axios.get(recUrl).catch(() => ({ data: [] })),
        ]);
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
        setRecommendations(Array.isArray(recRes.data) ? recRes.data : []);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleProductPress = (productId: string | number) => {
    router.push(`/product/${productId}`);
  };

  // Native-only renderBanner (FlatList item)
  const renderBannerNative = ({ item }: { item: typeof bannerSlides[0] }) => (
    <View style={[styles.bannerSlide, { width: bannerWidth, height: bannerHeight }]}>
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

  // Web-only inline CSS banner carousel using scroll-snap
  const webBannerInlineStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    overflowX: "auto",
    scrollSnapType: "x mandatory",
    scrollBehavior: "smooth",
    width: "100%",
    height: "100%",
    msOverflowStyle: "none",
    scrollbarWidth: "none",
  } as React.CSSProperties;

  const webSlideInlineStyle: React.CSSProperties = {
    minWidth: "100%",
    height: "100%",
    scrollSnapAlign: "start",
    flexShrink: 0,
    position: "relative",
    display: "flex",
    overflow: "hidden",
  } as React.CSSProperties;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ alignSelf: "center", width: "100%" }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View>
            <Text style={styles.logo}>MYNTRA</Text>
            <Text style={styles.greeting}>
              {user ? `Hi, ${user.name?.split(" ")[0]} 👋` : "Discover Fashion"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push("/notifications")}
            >
              <Bell size={20} color={colors.text} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push("/wishlist")}
            >
              <Heart size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push("/categories")}
          activeOpacity={0.7}
        >
          <Search size={17} color={colors.subtext} />
          <Text style={styles.searchPlaceholder}>Search brands, products & more...</Text>
        </TouchableOpacity>
      </View>

      {/* Banner Carousel */}
      <View style={[styles.bannerContainer, { width: bannerWidth, height: bannerHeight, alignSelf: "center" }]}>
        {Platform.OS === "web" ? (
          // ── Web: CSS scroll-snap carousel (reliable in all browsers) ──────────
          <div
            ref={webBannerRef}
            style={webBannerInlineStyle}
            onScroll={(e: any) => {
              const el = e.currentTarget;
              const idx = Math.round(el.scrollLeft / el.offsetWidth);
              if (idx >= 0 && idx < bannerSlides.length && idx !== activeBannerRef.current) {
                setActiveBanner(idx);
                activeBannerRef.current = idx;
              }
            }}
          >
            {bannerSlides.map((item) => (
              <div key={item.id} style={webSlideInlineStyle}>
                <img
                  src={item.uri}
                  alt={item.tag}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(0,0,0,0.38)",
                }} />
                <div style={{
                  position: "absolute",
                  bottom: 32,
                  left: 26,
                  right: 26,
                }}>
                  <div style={{
                    display: "inline-block",
                    background: colors.primary,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.5,
                    padding: "4px 10px",
                    borderRadius: 5,
                    marginBottom: 8,
                  }}>
                    {item.tag}
                  </div>
                  <div style={{
                    color: "#fff",
                    fontSize: 26,
                    fontWeight: 900,
                    lineHeight: "1.25",
                    marginBottom: 14,
                    whiteSpace: "pre-line",
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.5)",
                    padding: "8px 14px",
                    borderRadius: 22,
                    cursor: "pointer",
                  }}>
                    <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{item.cta}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // ── Native: FlatList with pagingEnabled ───────────────────────────────
          <FlatList
            ref={bannerFlatListRef}
            data={bannerSlides}
            renderItem={renderBannerNative}
            keyExtractor={(item) => String(item.id)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const idx = Math.round(offsetX / bannerWidth);
              if (idx !== activeBanner && idx >= 0 && idx < bannerSlides.length) {
                setActiveBanner(idx);
              }
            }}
            scrollEventThrottle={16}
            getItemLayout={(_, index) => ({
              length: bannerWidth,
              offset: bannerWidth * index,
              index,
            })}
          />
        )}
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

      {/* Deals Row */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>TODAY'S DEALS</Text>
            <Text style={styles.sectionSubtitle}>Limited time offers</Text>
          </View>
        </View>
        <View style={styles.dealsRow}>
          {deals.map((deal) => (
            <TouchableOpacity
              key={deal.id}
              style={styles.dealCard}
              className={isWeb ? "hover-grow" : undefined}
              activeOpacity={0.9}
            >
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
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20, marginLeft: 20 }} />
          ) : categories.length === 0 ? (
            <Text style={[styles.emptyText, { marginLeft: 16 }]}>No categories yet</Text>
          ) : (
            categories.map((cat: any) => (
              <TouchableOpacity
                key={cat._id}
                style={styles.categoryCard}
                className={isWeb ? "hover-grow" : undefined}
                onPress={() =>
                  router.push({ pathname: "/categories", params: { categoryId: cat._id } })
                }
                activeOpacity={0.85}
              >
                <View style={styles.categoryImageWrap}>
                  <Image source={{ uri: cat.image }} style={styles.categoryImage} resizeMode="cover" />
                  <View style={styles.categoryOverlay} />
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
              </TouchableOpacity>
            ))
          )}
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
                className={isWeb ? "hover-grow" : undefined}
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

      {/* You May Also Like (Personalized Recommendations) */}
      {recommendations && recommendations.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>YOU MAY ALSO LIKE</Text>
              <Text style={styles.sectionSubtitle}>
                {user ? "Personalized recommendations for you" : "Trending popular styles"}
              </Text>
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
            contentContainerStyle={styles.recentScroll}
          >
            {recommendations.map((item: any) => (
              <TouchableOpacity
                key={item._id}
                style={styles.recentCard}
                className={isWeb ? "hover-grow" : undefined}
                onPress={() => handleProductPress(item._id)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: item.images?.[0] }} style={styles.recentImage} />
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

      {/* Trending Now — Full Width Responsive Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>TRENDING NOW</Text>
            <Text style={styles.sectionSubtitle}>What everyone's wearing</Text>
          </View>
          <View style={styles.trendingBadge}>
            <TrendingUp size={12} color={colors.primary} />
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
                className={isWeb ? "hover-grow" : undefined}
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
                    <Heart size={14} color={colors.subtext} />
                  </TouchableOpacity>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.brandName} numberOfLines={1}>{product.brand}</Text>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>₹{product.price}</Text>
                    {product.discount && (
                      <View style={styles.discountChip}>
                        <Text style={styles.discountChipText}>{product.discount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const getStyles = (colors: any, theme: string, width: number, productCols: number) => {
  const PAD = 16;
  const GAP = 10;
  // Exact fit: subtract padding on both sides, distribute gap between cols
  const productCardWidth = Math.floor((width - PAD * 2 - GAP * (productCols - 1)) / productCols);
  const dealWidth = Math.floor((width - PAD * 2 - GAP * 2) / 3);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // Header
    header: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 4,
      paddingBottom: 12,
    },
    headerInner: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: PAD + 2,
      paddingTop: 52,
      paddingBottom: 12,
    },
    logo: {
      fontSize: 22,
      fontWeight: "900",
      color: colors.primary,
      letterSpacing: 4,
    },
    greeting: {
      fontSize: 12,
      color: colors.subtext,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
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
      top: 9,
      right: 9,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.primary,
      borderWidth: 1.5,
      borderColor: colors.card,
    },
    // Search
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: PAD,
      paddingHorizontal: 14,
      paddingVertical: 11,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    searchPlaceholder: {
      color: colors.subtext,
      fontSize: 13,
      flex: 1,
    },
    // Banner
    bannerContainer: {
      position: "relative",
      marginBottom: 4,
    },
    bannerSlide: {
      height: 240,
      position: "relative",
    },
    bannerImage: {
      width: "100%",
      height: "100%",
    },
    bannerOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.38)",
    },
    bannerContent: {
      position: "absolute",
      bottom: 32,
      left: 26,
      right: 26,
    },
    bannerTag: {
      alignSelf: "flex-start",
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 5,
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
      marginBottom: 14,
    },
    bannerCta: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: "rgba(255,255,255,0.18)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.5)",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 22,
      gap: 5,
    },
    bannerCtaText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },
    bannerDots: {
      position: "absolute",
      bottom: 14,
      right: 22,
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
      paddingHorizontal: PAD,
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
      marginTop: 2,
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
    // Deals Row — always fills full width
    dealsRow: {
      flexDirection: "row",
      gap: GAP,
    },
    dealCard: {
      flex: 1,
      height: 160,
      borderRadius: 14,
      overflow: "hidden",
      position: "relative",
    },
    dealImage: {
      width: "100%",
      height: "100%",
    },
    dealOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.42)",
    },
    dealBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 5,
    },
    dealBadgeText: {
      color: "#fff",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1,
    },
    dealContent: {
      position: "absolute",
      bottom: 10,
      left: 10,
    },
    dealTitle: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "800",
    },
    dealSubtitle: {
      color: "rgba(255,255,255,0.75)",
      fontSize: 10,
      fontWeight: "500",
    },
    // Categories horizontal scroll
    categoriesScroll: {
      paddingRight: 8,
      gap: 12,
    },
    categoryCard: {
      width: 96,
      alignItems: "center",
    },
    categoryImageWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      overflow: "hidden",
      borderWidth: 2.5,
      borderColor: colors.border,
    },
    categoryImage: {
      width: "100%",
      height: "100%",
    },
    categoryOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.04)",
    },
    categoryName: {
      textAlign: "center",
      marginTop: 7,
      fontSize: 11,
      color: colors.text,
      fontWeight: "700",
    },
    // Recently viewed
    recentScroll: {
      paddingRight: 8,
      gap: 12,
    },
    recentCard: {
      width: 130,
      backgroundColor: colors.card,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    recentImage: {
      width: "100%",
      height: 120,
    },
    recentInfo: {
      padding: 9,
    },
    recentBrand: {
      fontSize: 9,
      fontWeight: "800",
      color: colors.subtext,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    recentName: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.text,
      marginVertical: 2,
    },
    recentPrice: {
      fontSize: 13,
      fontWeight: "900",
      color: colors.primary,
    },
    // Trending badge
    trendingBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${colors.primary}18`,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      gap: 4,
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
    },
    trendingBadgeText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: "700",
    },
    // Products Grid — fills FULL width
    productsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: GAP,
    },
    productCard: {
      width: productCardWidth,
      backgroundColor: colors.card,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme === "dark" ? 0.25 : 0.07,
      shadowRadius: 10,
      elevation: 4,
    },
    productImageWrap: {
      position: "relative",
    },
    productImage: {
      width: "100%",
      height: 190,
    },
    productDiscountBadge: {
      position: "absolute",
      top: 8,
      left: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 5,
    },
    productDiscountText: {
      color: "#fff",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    wishlistBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme === "dark" ? "rgba(21,21,33,0.85)" : "rgba(255,255,255,0.9)",
      justifyContent: "center",
      alignItems: "center",
    },
    productInfo: {
      padding: 10,
    },
    brandName: {
      fontSize: 9,
      fontWeight: "800",
      color: colors.subtext,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    productName: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 17,
      marginBottom: 6,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    productPrice: {
      fontSize: 14,
      fontWeight: "900",
      color: colors.text,
    },
    discountChip: {
      backgroundColor: `${colors.primary}18`,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    },
    discountChipText: {
      fontSize: 9,
      fontWeight: "800",
      color: colors.primary,
    },
    loader: {
      marginVertical: 40,
    },
    emptyText: {
      color: colors.subtext,
      fontSize: 14,
      textAlign: "center",
      padding: 20,
    },
  });
};
