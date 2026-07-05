import {
  StyleSheet,
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import React, { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Search, X } from "lucide-react-native";
import axios from "axios";
import API_URL from "@/constants/Api";
import { useTheme } from "@/context/ThemeContext";

// const categories = [
//   {
//     id: 1,
//     name: "Men",
//     subcategories: [
//       "T-Shirts",
//       "Shirts",
//       "Jeans",
//       "Trousers",
//       "Suits",
//       "Activewear",
//     ],
//     image:
//       "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&auto=format&fit=crop",
//     products: [
//       {
//         id: 1,
//         name: "Casual White T-Shirt",
//         brand: "Roadster",
//         price: 499,
//         discount: "60% OFF",
//         image:
//           "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop",
//       },
//       {
//         id: 2,
//         name: "Denim Jacket",
//         brand: "Levis",
//         price: 2499,
//         discount: "40% OFF",
//         image:
//           "https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?w=500&auto=format&fit=crop",
//       },
//     ],
//   },
//   {
//     id: 2,
//     name: "Women",
//     subcategories: [
//       "Dresses",
//       "Tops",
//       "Ethnic Wear",
//       "Western Wear",
//       "Activewear",
//     ],
//     image:
//       "https://images.unsplash.com/photo-1618244972963-dbad0c4abf18?w=500&auto=format&fit=crop",
//     products: [
//       {
//         id: 3,
//         name: "Summer Dress",
//         brand: "ONLY",
//         price: 1299,
//         discount: "50% OFF",
//         image:
//           "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&auto=format&fit=crop",
//       },
//     ],
//   },
//   {
//     id: 3,
//     name: "Kids",
//     subcategories: [
//       "Boys Clothing",
//       "Girls Clothing",
//       "Infants",
//       "Toys",
//       "School Essentials",
//     ],
//     image:
//       "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&auto=format&fit=crop",
//     products: [],
//   },
//   {
//     id: 4,
//     name: "Beauty",
//     subcategories: [
//       "Makeup",
//       "Skincare",
//       "Haircare",
//       "Fragrances",
//       "Personal Care",
//     ],
//     image:
//       "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop",
//     products: [],
//   },
//   {
//     id: 5,
//     name: "Accessories",
//     subcategories: ["Watches", "Bags", "Jewellery", "Sunglasses", "Belts"],
//     image:
//       "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop",
//     products: [],
//   },
// ];

export default function TabTwoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setcategories] = useState<any>(null);
  const { colors } = useTheme();

  const styles = getStyles(colors);

  useEffect(() => {
    if (params && params.categoryId) {
      setSelectedCategory(params.categoryId as string);
    }
  }, [params]);

  useEffect(() => {
    const fetchproduct = async () => {
      try {
        setIsLoading(true);
        const cat = await axios.get(`${API_URL}/category`);
        setcategories(cat.data);
      } catch (error) {
        console.log(error);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchproduct();
  }, []);
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!categories) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.text }}>Categories not found</Text>
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
    setSelectedSubcategory(subcategoryId);
    setSearchQuery("");
  };
  const filtercategories = categories?.filter(
    (category: any) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.subcategory.some((subcategory: any) =>
        subcategory.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      category.productId.some(
        (product: any) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );
  const selectedcategorydata = selectedCategory
    ? categories?.find((cat: any) => cat._id === selectedCategory)
    : null;
  const renderProducts = (products: any) => {
    return products?.map((product: any) => (
      <TouchableOpacity
        key={product._id}
        style={styles.productCard}
        onPress={() => router.push(`/product/${product._id}`)}
      >
        <Image source={{ uri: product.images[0] }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.brandName}>{product.brand}</Text>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.price}</Text>
            <Text style={styles.discount}>{product.discount}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ));
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.subtext} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products, brands and more"
            placeholderTextColor={colors.subtext}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={clearSearch}>
              <X size={20} color={colors.subtext} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <ScrollView style={styles.content}>
        {!selectedCategory && (
          <View style={styles.categoriesGrid}>
            {filtercategories?.map((category: any) => (
              <TouchableOpacity
                key={category._id}
                style={styles.categoryCard}
                onPress={() => handleCategorySelect(category._id)}
              >
                <Image
                  source={{ uri: category.image }}
                  style={styles.categoryImage}
                />
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.subcategories}>
                      {category?.subcategory?.map((sub: any, index: any) => (
                        <View key={index} style={styles.subcategoryTag}>
                          <Text style={styles.subcategoryText}>{sub}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedcategorydata && (
          <View style={styles.categoryDetail}>
            <View style={styles.categoryHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={styles.backButtonText}>← Back to Categories</Text>
              </TouchableOpacity>
              <Text style={styles.categoryTitle}>
                {selectedcategorydata.name}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.subcategoriesScroll}
            >
              {selectedcategorydata.subcategory.map(
                (sub: any, index: any) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.subcategoryButton,
                      selectedSubcategory === sub && styles.selectedSubcategory,
                    ]}
                    onPress={() => handleSubcategorySelect(sub)}
                  >
                    <Text
                      style={[
                        styles.subcategoryButtonText,
                        selectedSubcategory === sub &&
                          styles.selectedSubcategoryText,
                      ]}
                    >
                      {sub}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
            <View style={styles.productsGrid}>
              {renderProducts(
                selectedSubcategory
                  ? selectedcategorydata?.productId.filter((prod: any) =>
                      prod.description
                        .toLowerCase()
                        .includes(selectedSubcategory.toLowerCase()) ||
                      prod.name
                        .toLowerCase()
                        .includes(selectedSubcategory.toLowerCase())
                    )
                  : selectedcategorydata?.productId
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) =>
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
      padding: 15,
      paddingTop: 50,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    searchContainer: {
      padding: 15,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderRadius: 10,
      padding: 10,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    content: {
      flex: 1,
    },
    categoriesGrid: {
      padding: 15,
    },
    categoryCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      marginBottom: 18,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryImage: {
      width: "100%",
      height: 220,
    },
    categoryInfo: {
      padding: 15,
    },
    categoryName: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 10,
      letterSpacing: 0.3,
    },
    subcategories: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    subcategoryTag: {
      backgroundColor: `${colors.primary}18`,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      marginRight: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: `${colors.primary}40`,
    },
    subcategoryText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "600",
    },
    categoryDetail: {
      flex: 1,
      padding: 15,
    },
    categoryHeader: {
      marginBottom: 15,
    },
    backButton: {
      marginBottom: 10,
    },
    backButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "600",
    },
    categoryTitle: {
      fontSize: 26,
      fontWeight: "900",
      color: colors.text,
      letterSpacing: 0.5,
    },
    subcategoriesScroll: {
      marginBottom: 15,
    },
    subcategoryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: colors.inputBackground,
      marginRight: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedSubcategory: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    subcategoryButtonText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "600",
    },
    selectedSubcategoryText: {
      color: "#fff",
      fontWeight: "800",
    },
    productsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    productCard: {
      width: "48%",
      backgroundColor: colors.card,
      borderRadius: 14,
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 6,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    productImage: {
      width: "100%",
      height: 240,
      resizeMode: "cover",
    },
    productInfo: {
      padding: 10,
    },
    brandName: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.subtext,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    productName: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
      fontWeight: "500",
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    price: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      marginRight: 8,
    },
    discount: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "700",
    },
  });
