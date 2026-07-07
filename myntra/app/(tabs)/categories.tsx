import {
  StyleSheet,
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from "react-native";

import React, { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Search, X, ChevronRight, ArrowLeft, Tag, Grid } from "lucide-react-native";
import axios from "axios";
import API_URL from "@/constants/Api";
import { useTheme } from "@/context/ThemeContext";

export default function CategoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<any>(null);
  const { colors, theme } = useTheme();

  // Responsive columns for products
  const isWeb = Platform.OS === "web";
  const isWide = width > 900;
  const isMid = width > 600;
  const productCols = isWide ? 4 : isMid ? 3 : 2;
  const catCols = isWide ? 3 : isMid ? 2 : 1;

  const styles = getStyles(colors, theme, width, productCols, catCols);

  useEffect(() => {
    if (params && params.categoryId) {
      setSelectedCategory(params.categoryId as string);
    }
  }, [params]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const cat = await axios.get(`${API_URL}/category`);
        setCategories(cat.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <View style={styles.loaderInner}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Loading Collections...</Text>
        </View>
      </View>
    );
  }
  if (!categories) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.text, textAlign: "center", padding: 40 }}>
          No categories found
        </Text>
      </View>
    );
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };
  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
    setSearchQuery("");
  };
  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId === selectedSubcategory ? null : subcategoryId);
    setSearchQuery("");
  };

  const filteredCategories = categories?.filter(
    (category: any) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.subcategory.some((sub: any) =>
        sub.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      category.productId.some(
        (product: any) =>
          product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const selectedCategoryData = selectedCategory
    ? categories?.find((cat: any) => cat._id === selectedCategory)
    : null;

  const renderProductsGrid = (products: any[]) => {
    if (!products || products.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Grid size={48} color={colors.subtext} />
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubtext}>Try a different subcategory</Text>
        </View>
      );
    }
    return (
      <View style={styles.productsGrid}>
        {products.map((product: any) => (
          <TouchableOpacity
            key={product._id}
            style={styles.productCard}
            className={isWeb ? "hover-grow" : undefined}
            onPress={() => router.push(`/product/${product._id}`)}
            activeOpacity={0.9}
          >
            <View style={styles.productImageWrap}>
              <Image source={{ uri: product.images[0] }} style={styles.productImage} resizeMode="cover" />
              {product.discount && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{product.discount}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.wishlistBtn}>
                <Text style={{ fontSize: 16 }}>♡</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.brandName} numberOfLines={1}>{product.brand}</Text>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>₹{product.price}</Text>
                {product.discount && (
                  <View style={styles.discountTag}>
                    <Text style={styles.discountTagText}>{product.discount}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {selectedCategoryData ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setSelectedCategory(null)}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={colors.text} />
              <Text style={styles.backBtnText}>All Categories</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerTitleRow}>
              <Tag size={22} color={colors.primary} />
              <Text style={styles.headerTitle}>Shop by Category</Text>
            </View>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.subtext} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, brands & categories..."
            placeholderTextColor={colors.subtext}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
              <X size={16} color={colors.subtext} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Grid View */}
        {!selectedCategoryData && (
          <View style={styles.categoryGrid}>
            {filteredCategories?.map((category: any) => (
              <TouchableOpacity
                key={category._id}
                style={styles.categoryCard}
                className={isWeb ? "hover-grow" : undefined}
                onPress={() => handleCategorySelect(category._id)}
                activeOpacity={0.92}
              >
                <View style={styles.categoryImageWrap}>
                  <Image
                    source={{ uri: category.image }}
                    style={styles.categoryImage}
                    resizeMode="cover"
                  />
                  <View style={styles.categoryGradientOverlay} />
                  <View style={styles.categoryOverlayContent}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <View style={styles.categoryMeta}>
                      <Text style={styles.categoryProductCount}>
                        {category.productId?.length || 0} Products
                      </Text>
                      <View style={styles.categoryArrow}>
                        <ChevronRight size={14} color="#fff" />
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.categoryTags}>
                  {category.subcategory?.slice(0, 4).map((sub: string, i: number) => (
                    <View key={i} style={styles.subcategoryChip}>
                      <Text style={styles.subcategoryChipText}>{sub}</Text>
                    </View>
                  ))}
                  {category.subcategory?.length > 4 && (
                    <View style={[styles.subcategoryChip, styles.moreChip]}>
                      <Text style={styles.subcategoryChipText}>+{category.subcategory.length - 4} more</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Category Detail View */}
        {selectedCategoryData && (
          <View style={styles.categoryDetail}>
            {/* Hero Banner */}
            <View style={styles.heroWrap}>
              <Image
                source={{ uri: selectedCategoryData.image }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>{selectedCategoryData.name}</Text>
                <Text style={styles.heroSubtitle}>
                  {selectedCategoryData.productId?.length || 0} curated products
                </Text>
              </View>
            </View>

            {/* Subcategory Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subPillsScroll}
            >
              <TouchableOpacity
                style={[styles.subPill, !selectedSubcategory && styles.subPillActive]}
                onPress={() => setSelectedSubcategory(null)}
              >
                <Text style={[styles.subPillText, !selectedSubcategory && styles.subPillActiveText]}>
                  All
                </Text>
              </TouchableOpacity>
              {selectedCategoryData.subcategory.map((sub: string, i: number) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.subPill, selectedSubcategory === sub && styles.subPillActive]}
                  onPress={() => handleSubcategorySelect(sub)}
                >
                  <Text style={[styles.subPillText, selectedSubcategory === sub && styles.subPillActiveText]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Products Grid */}
            {renderProductsGrid(
              selectedSubcategory
                ? selectedCategoryData?.productId.filter((prod: any) =>
                    prod.description?.toLowerCase().includes(selectedSubcategory.toLowerCase()) ||
                    prod.name?.toLowerCase().includes(selectedSubcategory.toLowerCase())
                  )
                : selectedCategoryData?.productId
            )}
          </View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any, theme: string, width: number, productCols: number, catCols: number) => {
  const cardGap = 12;
  const catPad = 16;
  const productCardWidth = (width - catPad * 2 - cardGap * (productCols - 1)) / productCols;
  const catCardWidth = catCols === 1
    ? width - catPad * 2
    : (width - catPad * 2 - cardGap * (catCols - 1)) / catCols;

  return StyleSheet.create({
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    loaderInner: {
      alignItems: "center",
      gap: 16,
    },
    loaderText: {
      color: colors.subtext,
      fontSize: 14,
      fontWeight: "600",
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // Header
    header: {
      backgroundColor: colors.card,
      paddingTop: 52,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 4,
    },
    headerContent: {
      paddingHorizontal: catPad,
      marginBottom: 12,
    },
    headerTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: colors.text,
      letterSpacing: 0.3,
    },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    backBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    // Search
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: catPad,
      paddingHorizontal: 14,
      paddingVertical: 11,
      backgroundColor: colors.inputBackground,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      padding: 0,
    },
    clearBtn: {
      padding: 2,
    },
    content: {
      flex: 1,
    },
    // Category Grid
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: catPad,
      gap: cardGap,
    },
    categoryCard: {
      width: catCardWidth,
      backgroundColor: colors.card,
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: theme === "dark" ? 0.3 : 0.1,
      shadowRadius: 14,
      elevation: 8,
    },
    categoryImageWrap: {
      position: "relative",
      height: catCols === 1 ? 200 : 240,
    },
    categoryImage: {
      width: "100%",
      height: "100%",
    },
    categoryGradientOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "70%",
      backgroundColor: "rgba(0,0,0,0.52)",
    },
    categoryOverlayContent: {
      position: "absolute",
      bottom: 14,
      left: 16,
      right: 16,
    },
    categoryName: {
      fontSize: 22,
      fontWeight: "900",
      color: "#fff",
      letterSpacing: 0.4,
      marginBottom: 6,
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    categoryMeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    categoryProductCount: {
      fontSize: 12,
      color: "rgba(255,255,255,0.85)",
      fontWeight: "600",
    },
    categoryArrow: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    categoryTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: 12,
      gap: 6,
    },
    subcategoryChip: {
      backgroundColor: `${colors.primary}15`,
      borderWidth: 1,
      borderColor: `${colors.primary}35`,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    moreChip: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
    },
    subcategoryChipText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.primary,
    },
    // Category Detail
    categoryDetail: {
      flex: 1,
    },
    heroWrap: {
      height: 220,
      position: "relative",
      margin: catPad,
      borderRadius: 20,
      overflow: "hidden",
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    heroContent: {
      position: "absolute",
      bottom: 24,
      left: 24,
      right: 24,
    },
    heroTitle: {
      fontSize: 32,
      fontWeight: "900",
      color: "#fff",
      letterSpacing: 1,
      textShadowColor: "rgba(0,0,0,0.4)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    heroSubtitle: {
      fontSize: 13,
      color: "rgba(255,255,255,0.8)",
      fontWeight: "600",
      marginTop: 4,
    },
    // Subcategory Pills
    subPillsScroll: {
      paddingHorizontal: catPad,
      paddingBottom: 16,
      gap: 8,
    },
    subPill: {
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    subPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    subPillText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.subtext,
    },
    subPillActiveText: {
      color: "#fff",
    },
    // Products Grid
    productsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: catPad,
      gap: cardGap,
    },
    productCard: {
      width: productCardWidth,
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme === "dark" ? 0.25 : 0.08,
      shadowRadius: 10,
      elevation: 5,
    },
    productImageWrap: {
      position: "relative",
    },
    productImage: {
      width: "100%",
      height: 220,
    },
    discountBadge: {
      position: "absolute",
      top: 10,
      left: 10,
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    discountBadgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    wishlistBtn: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme === "dark" ? "rgba(30,30,50,0.85)" : "rgba(255,255,255,0.9)",
      justifyContent: "center",
      alignItems: "center",
    },
    productInfo: {
      padding: 12,
    },
    brandName: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.subtext,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 3,
    },
    productName: {
      fontSize: 13,
      color: colors.text,
      fontWeight: "600",
      lineHeight: 18,
      marginBottom: 8,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    price: {
      fontSize: 15,
      fontWeight: "900",
      color: colors.text,
    },
    discountTag: {
      backgroundColor: `${colors.primary}18`,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    discountTagText: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.primary,
    },
    // Empty state
    emptyState: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 60,
      gap: 12,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    emptySubtext: {
      fontSize: 13,
      color: colors.subtext,
    },
  });
};
