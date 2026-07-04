import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, ChevronRight } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import axios from "axios";
import API_URL from "@/constants/Api";

// const categories = [
//   {
//     id: 1,
//     name: "Men",
//     image:
//       "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&auto=format&fit=crop",
//   },
//   {
//     id: 2,
//     name: "Women",
//     image:
//       "https://images.unsplash.com/photo-1618244972963-dbad0c4abf18?w=500&auto=format&fit=crop",
//   },
//   {
//     id: 3,
//     name: "Kids",
//     image:
//       "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&auto=format&fit=crop",
//   },
//   {
//     id: 4,
//     name: "Beauty",
//     image:
//       "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop",
//   },
// ];

// const products = [
//   {
//     id: 1,
//     name: "Casual White T-Shirt",
//     brand: "Roadster",
//     price: "₹499",
//     discount: "60% OFF",
//     image:
//       "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop",
//   },
//   {
//     id: 2,
//     name: "Denim Jacket",
//     brand: "Levis",
//     price: "₹2499",
//     discount: "40% OFF",
//     image:
//       "https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?w=500&auto=format&fit=crop",
//   },
//   {
//     id: 3,
//     name: "Summer Dress",
//     brand: "ONLY",
//     price: "₹1299",
//     discount: "50% OFF",
//     image:
//       "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&auto=format&fit=crop",
//   },
//   {
//     id: 4,
//     name: "Classic Sneakers",
//     brand: "Nike",
//     price: "₹3499",
//     discount: "30% OFF",
//     image:
//       "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop",
//   },
// ];

const deals = [
  {
    id: 1,
    title: "Under ₹599",
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "40-70% Off",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop",
  },
];

import { useTheme } from "@/context/ThemeContext";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [product, setproduct] = useState<any>(null);
  const [categories, setcategories] = useState<any>(null);
  const { user } = useAuth();
  const { recentlyViewed } = useRecentlyViewed();
  const { colors } = useTheme();

  const styles = getStyles(colors);
  
  const handleProductPress = (productId: string | number) => {
    router.push(`/product/${productId}`);
  };
  useEffect(() => {
    const fetchproduct = async () => {
      try {
        setIsLoading(true);
        const cat = await axios.get(`${API_URL}/category`);
        const product = await axios.get(`${API_URL}/product`);
        setcategories(cat.data);
        setproduct(product.data);
      } catch (error) {
        console.log(error);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchproduct();
  }, []);
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>MYNTRA</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Search size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop",
        }}
        style={styles.banner}
      />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SHOP BY CATEGORY</Text>
          <TouchableOpacity style={styles.viewAll}>
            <Text style={styles.viewAllText}>View All</Text>
            <ChevronRight size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loader}
            />
          ) : !categories || categories.length === 0 ? (
            <Text style={styles.emptyText}>No categories available</Text>
          ) : (
            categories.map((category: any) => (
              <TouchableOpacity key={category._id} style={styles.categoryCard}>
                <Image
                  source={{ uri: category.image }}
                  style={styles.categoryImage}
                />
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DEALS OF THE DAY</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dealsScroll}
        >
          {deals.map((deal) => (
            <TouchableOpacity key={deal.id} style={styles.dealCard}>
              <Image source={{ uri: deal.image }} style={styles.dealImage} />
              <View style={styles.dealOverlay}>
                <Text style={styles.dealTitle}>{deal.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {recentlyViewed && recentlyViewed.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RECENTLY VIEWED</Text>
            <TouchableOpacity style={styles.viewAll} onPress={() => router.push("/recently-viewed")}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.recentlyViewedScroll}
          >
            {recentlyViewed.map((item) => (
              <TouchableOpacity
                key={item.productId}
                style={styles.recentlyViewedCard}
                onPress={() => handleProductPress(item.productId)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: item.images[0] }} style={styles.recentlyViewedImage} />
                <View style={styles.recentlyViewedInfo}>
                  <Text style={styles.recentlyViewedBrand} numberOfLines={1}>
                    {item.brand}
                  </Text>
                  <Text style={styles.recentlyViewedName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.recentlyViewedPrice}>₹{item.price}</Text>
                    <Text style={styles.recentlyViewedDiscount}>{item.discount}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TRENDING NOW</Text>
        </View>
        <View style={styles.productsGrid}>
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loader}
            />
          ) : !product || product.length === 0 ? (
            <Text style={styles.emptyText}>No Product available</Text>
          ) : ( 
            <View style={styles.productsGrid}>
              {product.map((product: any) => (
                <TouchableOpacity
                  key={product._id}
                  style={styles.productCard}
                  onPress={() => handleProductPress(product._id)}
                >
                  <Image
                    source={{ uri: product.images[0] }}
                    style={styles.productImage}
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.brandName}>{product.brand}</Text>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.productPrice}>{product.price}</Text>
                      <Text style={styles.discount}>{product.discount}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      paddingTop: 50,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    emptyText: {
      textAlign: "center",
      marginTop: 20,
      fontSize: 16,
      color: colors.subtext,
    },
    logo: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.primary,
    },
    searchButton: {
      padding: 8,
    },
    banner: {
      width: "100%",
      height: 200,
      resizeMode: "cover",
    },
    section: {
      padding: 15,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    viewAll: {
      flexDirection: "row",
      alignItems: "center",
    },
    viewAllText: {
      color: colors.primary,
      marginRight: 5,
    },
    categoriesScroll: {
      marginHorizontal: -15,
    },
    categoryCard: {
      width: 100,
      marginHorizontal: 8,
    },
    categoryImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    categoryName: {
      textAlign: "center",
      marginTop: 8,
      fontSize: 14,
      color: colors.text,
    },
    dealsScroll: {
      marginHorizontal: -15,
    },
    dealCard: {
      width: 280,
      height: 150,
      marginHorizontal: 8,
      borderRadius: 10,
      overflow: "hidden",
    },
    dealImage: {
      width: "100%",
      height: "100%",
    },
    dealOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
      padding: 15,
    },
    dealTitle: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
    },
    productsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -8,
    },
    productCard: {
      width: "48%",
      marginHorizontal: "1%",
      marginBottom: 15,
      backgroundColor: colors.card,
      borderRadius: 10,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    productImage: {
      width: "100%",
      height: 200,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    },
    productInfo: {
      padding: 10,
    },
    brandName: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 2,
    },
    productName: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 5,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    productPrice: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginRight: 8,
    },
    discount: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "500",
    },
    loader: {
      marginTop: 50,
    },
    recentlyViewedScroll: {
      marginHorizontal: -15,
      paddingLeft: 8,
    },
    recentlyViewedCard: {
      width: 140,
      marginHorizontal: 8,
      backgroundColor: colors.card,
      borderRadius: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      overflow: "hidden",
      marginBottom: 5,
    },
    recentlyViewedImage: {
      width: "100%",
      height: 120,
      resizeMode: "cover",
    },
    recentlyViewedInfo: {
      padding: 8,
    },
    recentlyViewedBrand: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.subtext,
      marginBottom: 2,
    },
    recentlyViewedName: {
      fontSize: 13,
      color: colors.text,
      marginBottom: 4,
    },
    recentlyViewedPrice: {
      fontSize: 13,
      fontWeight: "bold",
      color: colors.text,
      marginRight: 6,
    },
    recentlyViewedDiscount: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: "600",
    },
  });

