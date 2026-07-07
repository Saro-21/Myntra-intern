import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  Package,
  Heart,
  CreditCard,
  MapPin,
  Settings,
  LogOut,
  ChevronRight,
  Eye,
  Bell,
  Clock,
  Shield,
  Sparkles,
  Camera,
  Star,
  Ticket,
  Lock,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import axios from "axios";
import API_URL from "@/constants/Api";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

const themeSwatches: Record<string, { bg: string; primary: string; label: string }> = {
  system: { bg: "#8e8e93", primary: "#636366", label: "System" },
  light: { bg: "#ffffff", primary: "#ff3f6c", label: "Light" },
  dark: { bg: "#1c1c1e", primary: "#ff527b", label: "Dark" },
  myntra: { bg: "#fff0f5", primary: "#ff3f6c", label: "Myntra" },
  lightBlue: { bg: "#f0f8ff", primary: "#0077ff", label: "Blue" },
  peacockGreen: { bg: "#e0f2f1", primary: "#008080", label: "Peacock" },
};

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, colors, setTheme, currentSelection } = useTheme();
  const { recentlyViewed } = useRecentlyViewed();

  const [stats, setStats] = useState({
    orders: 0,
    wishlist: 0,
    history: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const styles = getStyles(theme, colors);

  const fetchUserStats = async () => {
    if (!user) return;
    try {
      setLoadingStats(true);
      const wlRes = await axios.get(`${API_URL}/wishlist?userId=${user._id}`);
      const ordRes = await axios.get(`${API_URL}/order?userId=${user._id}`);
      
      setStats({
        wishlist: Array.isArray(wlRes.data) ? wlRes.data.length : 0,
        orders: Array.isArray(ordRes.data) ? ordRes.data.length : 0,
        history: recentlyViewed ? recentlyViewed.length : 0,
      });
    } catch (error) {
      console.log("Error fetching profile stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, [user, recentlyViewed]);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const renderThemeSelector = () => (
    <View style={styles.themeSection}>
      <View style={styles.themeSectionHeader}>
        <Sparkles size={16} color={colors.primary} />
        <Text style={styles.sectionHeaderTitle}>Visual Experience</Text>
      </View>
      <Text style={styles.sectionHeaderSubtitle}>Personalize the app aesthetics to your style</Text>
      
      <View style={styles.themeOptionsGrid}>
        {(Object.keys(themeSwatches)).map((opt) => {
          const isActive = currentSelection === opt;
          const swatch = themeSwatches[opt];
          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.themeCard,
                isActive && styles.themeCardActive,
              ]}
              onPress={() => setTheme(opt as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.swatchPreview, { backgroundColor: swatch.bg }]}>
                <View style={[styles.swatchDot, { backgroundColor: swatch.primary }]} />
              </View>
              <Text style={[styles.themeCardLabel, isActive && styles.themeCardLabelActive]}>
                {swatch.label}
              </Text>
              {isActive && <View style={styles.activeIndicatorDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your account & orders</Text>
          </View>
        </View>

        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.guestCard}>
            <View style={styles.guestIconBg}>
              <User size={38} color={colors.primary} />
            </View>
            <Text style={styles.guestTitle}>Welcome to Myntra</Text>
            <Text style={styles.guestSubtitle}>
              Log in to track orders, save items to your wishlist, customize themes, and unlock standard checkout.
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push("/login")}
              activeOpacity={0.9}
            >
              <Text style={styles.loginButtonText}>LOGIN / SIGNUP</Text>
            </TouchableOpacity>
          </View>

          {renderThemeSelector()}
          
          <View style={styles.footerContainer}>
            <Shield size={14} color={colors.subtext} />
            <Text style={styles.footerText}>Secure 256-bit SSL encryption. Antigravity Systems.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account & orders</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
            <Bell size={22} color={colors.text} />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7} onPress={() => router.push("/settings")}>
            <Settings size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileMain}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBorder}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop" }}
                  style={styles.avatarImage}
                />
              </View>
              <TouchableOpacity style={styles.cameraIconBtn} activeOpacity={0.8}>
                <Camera size={14} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.userDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user.name}</Text>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>👑 Pro Member</Text>
                </View>
              </View>
              <Text style={styles.userSubtitle}>Premium member since May 2024</Text>
              
              <TouchableOpacity style={styles.rewardsBadge} activeOpacity={0.8}>
                <Text style={styles.rewardsText}>⭐ 720 Reward Points  ›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statBox} onPress={() => router.push("/orders")}>
            <View style={[styles.statIconBg, { backgroundColor: "#fdf2f8" }]}>
              <Package size={20} color="#ec4899" />
            </View>
            <Text style={styles.statCountVal}>{stats.orders}</Text>
            <Text style={styles.statNameLabel}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statBox} onPress={() => router.push("/wishlist")}>
            <View style={[styles.statIconBg, { backgroundColor: "#fff5f5" }]}>
              <Heart size={20} color="#ff4d6d" />
            </View>
            <Text style={styles.statCountVal}>{stats.wishlist}</Text>
            <Text style={styles.statNameLabel}>Wishlist</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statBox}>
            <View style={[styles.statIconBg, { backgroundColor: "#faf5ff" }]}>
              <Star size={20} color="#a855f7" />
            </View>
            <Text style={styles.statCountVal}>12</Text>
            <Text style={styles.statNameLabel}>Reviews</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statBox}>
            <View style={[styles.statIconBg, { backgroundColor: "#f0fdf4" }]}>
              <Ticket size={20} color="#22c55e" />
            </View>
            <Text style={styles.statCountVal}>6</Text>
            <Text style={styles.statNameLabel}>Coupons</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Menu Tabs Card */}
        <View style={styles.quickMenuCard}>
          <TouchableOpacity style={styles.quickMenuItem} onPress={() => router.push("/orders")}>
            <Package size={20} color={colors.text} />
            <Text style={styles.quickMenuText}>My Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickMenuItem} onPress={() => router.push("/addresses")}>
            <MapPin size={20} color={colors.text} />
            <Text style={styles.quickMenuText}>Saved Addresses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickMenuItem} onPress={() => router.push("/payments")}>
            <CreditCard size={20} color={colors.text} />
            <Text style={styles.quickMenuText}>Payment Methods</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickMenuItem} onPress={() => router.push("/notifications")}>
            <Bell size={20} color={colors.text} />
            <Text style={styles.quickMenuText}>Notifications</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push("/orders")}>
            <Text style={styles.viewAllText}>View All ›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.recentOrderCard} activeOpacity={0.9} onPress={() => router.push("/orders")}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop" }}
            style={styles.recentOrderImg}
          />
          <View style={styles.recentOrderInfo}>
            <Text style={styles.recentOrderBrand}>Adidas Originals</Text>
            <Text style={styles.recentOrderName}>Men White Sneakers</Text>
            <Text style={styles.recentOrderSpecs}>Size: 9  •  Qty: 1</Text>
            <Text style={styles.recentOrderPrice}>₹3,599</Text>
          </View>
          <View style={styles.recentOrderRight}>
            <View style={styles.deliveredBadge}>
              <Text style={styles.deliveredBadgeText}>Delivered</Text>
            </View>
            <Text style={styles.deliveredDateText}>18 May, 2024</Text>
          </View>
          <ChevronRight size={18} color={colors.subtext} style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {/* Recommended For You Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Recommended For You</Text>
          <TouchableOpacity onPress={() => router.push("/categories")}>
            <Text style={styles.viewAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recsScroll}>
          {[
            { id: "rec1", brand: "Roadster", name: "Men Solid Crew Neck T-Shirt", price: "₹1,499", rating: "4.5 ★", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&auto=format&fit=crop" },
            { id: "rec2", brand: "Fastrack", name: "Classic Black Dial Analog Watch", price: "₹1,895", rating: "4.3 ★", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop" },
            { id: "rec3", brand: "HRX by Hrithik", name: "Running Shoes with Cushioned Sole", price: "₹1,299", rating: "4.6 ★", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop" },
            { id: "rec4", brand: "Wildcraft", name: "Water Resistant Hiking Backpack", price: "₹1,799", rating: "4.4 ★", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&auto=format&fit=crop" },
          ].map((item) => (
            <TouchableOpacity key={item.id} style={styles.recCard} activeOpacity={0.9} onPress={() => router.push(`/product/${item.id}`)}>
              <View style={styles.recCardImgWrap}>
                <Image source={{ uri: item.image }} style={styles.recCardImg} />
                <TouchableOpacity style={styles.recHeartBtn} activeOpacity={0.7}>
                  <Heart size={14} color="#777" />
                </TouchableOpacity>
              </View>
              <View style={styles.recCardContent}>
                <Text style={styles.recBrandText}>{item.brand}</Text>
                <Text style={styles.recNameText} numberOfLines={1}>{item.name}</Text>
                <View style={styles.recRow}>
                  <Text style={styles.recPriceText}>{item.price}</Text>
                  <Text style={styles.recRatingText}>{item.rating}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Account Settings Section */}
        <Text style={styles.menuGroupTitle}>Account Settings</Text>
        <View style={styles.settingsGroupCard}>
          <TouchableOpacity style={styles.settingsItem} onPress={() => router.push("/profile")}>
            <View style={styles.settingsIconBg}>
              <User size={18} color="#ec4899" />
            </View>
            <View style={styles.settingsItemTextWrap}>
              <Text style={styles.settingsItemTitle}>Personal Information</Text>
              <Text style={styles.settingsItemSubtitle}>Manage your personal details</Text>
            </View>
            <ChevronRight size={18} color={colors.subtext} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsItem} onPress={() => router.push("/settings")}>
            <View style={styles.settingsIconBg}>
              <Lock size={18} color="#ec4899" />
            </View>
            <View style={styles.settingsItemTextWrap}>
              <Text style={styles.settingsItemTitle}>Change Password</Text>
              <Text style={styles.settingsItemSubtitle}>Update your account password</Text>
            </View>
            <ChevronRight size={18} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        {renderThemeSelector()}

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#ff4d6d" />
          <Text style={styles.logoutText}>Log Out Account</Text>
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Shield size={14} color={colors.subtext} />
          <Text style={styles.footerText}>Secure 256-bit SSL encryption. Antigravity Systems.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: string, colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === "dark" ? colors.background : "#f8fafc",
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 52,
      paddingBottom: 16,
      backgroundColor: colors.card,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: colors.text,
      letterSpacing: 0.5,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.subtext,
      marginTop: 2,
    },
    headerIcons: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    headerIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme === "dark" ? "#222" : "#f1f5f9",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
    },
    bellBadge: {
      position: "absolute",
      top: 10,
      right: 11,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#ec4899",
      borderWidth: 1.5,
      borderColor: colors.card,
    },
    contentScroll: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    // Guest Card
    guestCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 28,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.05,
      shadowRadius: 20,
      elevation: 6,
      marginBottom: 20,
    },
    guestIconBg: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: theme === "dark" ? "#2a2224" : "#fff0f3",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    guestTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 10,
      textAlign: "center",
    },
    guestSubtitle: {
      fontSize: 13,
      color: colors.subtext,
      lineHeight: 20,
      textAlign: "center",
      marginBottom: 26,
      paddingHorizontal: 12,
    },
    loginButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 14,
      width: "100%",
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 5,
    },
    loginButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 1.5,
    },
    // Profile Main
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.03,
      shadowRadius: 15,
      elevation: 4,
      marginBottom: 16,
    },
    profileMain: {
      flexDirection: "row",
      alignItems: "center",
    },
    avatarContainer: {
      position: "relative",
    },
    avatarBorder: {
      width: 82,
      height: 82,
      borderRadius: 41,
      padding: 3,
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: "#ec4899",
      justifyContent: "center",
      alignItems: "center",
    },
    avatarImage: {
      width: 72,
      height: 72,
      borderRadius: 36,
    },
    cameraIconBtn: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: "#fff",
      width: 26,
      height: 26,
      borderRadius: 13,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: "#e2e8f0",
    },
    userDetails: {
      marginLeft: 16,
      flex: 1,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    userName: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    proBadge: {
      backgroundColor: "#fdf2f8",
      borderColor: "#fbcfe8",
      borderWidth: 0.5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
    },
    proBadgeText: {
      fontSize: 10,
      color: "#db2777",
      fontWeight: "800",
    },
    userSubtitle: {
      fontSize: 12,
      color: colors.subtext,
      marginTop: 4,
      marginBottom: 8,
    },
    rewardsBadge: {
      backgroundColor: theme === "dark" ? "#222" : "#f8fafc",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingVertical: 5,
      paddingHorizontal: 12,
      alignSelf: "flex-start",
    },
    rewardsText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.text,
    },
    // Stats Rows
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
      gap: 8,
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingVertical: 14,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.02,
      shadowRadius: 8,
      elevation: 2,
    },
    statIconBg: {
      width: 38,
      height: 38,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    statCountVal: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.text,
      marginBottom: 2,
    },
    statNameLabel: {
      fontSize: 11,
      color: colors.subtext,
      fontWeight: "600",
    },
    // Quick menu card
    quickMenuCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      paddingVertical: 16,
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      marginBottom: 20,
    },
    quickMenuItem: {
      alignItems: "center",
      gap: 6,
    },
    quickMenuText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.text,
    },
    // Section header
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionHeading: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.text,
    },
    viewAllText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
    },
    // Recent orders
    recentOrderCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    recentOrderImg: {
      width: 60,
      height: 60,
      borderRadius: 12,
    },
    recentOrderInfo: {
      marginLeft: 12,
      flex: 1,
    },
    recentOrderBrand: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.text,
    },
    recentOrderName: {
      fontSize: 11,
      color: colors.subtext,
      marginTop: 2,
    },
    recentOrderSpecs: {
      fontSize: 10,
      color: colors.subtext,
      marginTop: 4,
    },
    recentOrderPrice: {
      fontSize: 13,
      fontWeight: "900",
      color: colors.text,
      marginTop: 4,
    },
    recentOrderRight: {
      alignItems: "flex-end",
    },
    deliveredBadge: {
      backgroundColor: "#f0fdf4",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginBottom: 4,
    },
    deliveredBadgeText: {
      color: "#22c55e",
      fontSize: 9,
      fontWeight: "800",
    },
    deliveredDateText: {
      fontSize: 10,
      color: colors.subtext,
    },
    // Recommendations
    recsScroll: {
      paddingBottom: 20,
      gap: 12,
    },
    recCard: {
      width: 140,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      overflow: "hidden",
    },
    recCardImgWrap: {
      position: "relative",
    },
    recCardImg: {
      width: "100%",
      height: 140,
    },
    recHeartBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.85)",
      justifyContent: "center",
      alignItems: "center",
    },
    recCardContent: {
      padding: 10,
    },
    recBrandText: {
      fontSize: 9,
      fontWeight: "800",
      color: colors.subtext,
      textTransform: "uppercase",
    },
    recNameText: {
      fontSize: 11,
      color: colors.text,
      fontWeight: "600",
      marginTop: 2,
    },
    recRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 6,
    },
    recPriceText: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.text,
    },
    recRatingText: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: "700",
    },
    // Settings Group
    menuGroupTitle: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.subtext,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 10,
      marginTop: 10,
      paddingHorizontal: 4,
    },
    settingsGroupCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      overflow: "hidden",
      marginBottom: 20,
    },
    settingsItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingsIconBg: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#fdf2f8",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    settingsItemTextWrap: {
      flex: 1,
    },
    settingsItemTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    settingsItemSubtitle: {
      fontSize: 11,
      color: colors.subtext,
      marginTop: 2,
    },
    // Theme Selector
    themeSection: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.02,
      shadowRadius: 20,
      elevation: 2,
    },
    themeSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 4,
    },
    sectionHeaderTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.text,
    },
    sectionHeaderSubtitle: {
      fontSize: 12,
      color: colors.subtext,
      marginBottom: 16,
      marginLeft: 2,
    },
    themeOptionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 8,
    },
    themeCard: {
      width: "31%",
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 12,
      alignItems: "center",
      position: "relative",
      marginBottom: 4,
    },
    themeCardActive: {
      borderColor: colors.primary,
      backgroundColor: theme === "dark" ? "#2c2c2e" : "#fdf4f6",
    },
    swatchPreview: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: "rgba(0,0,0,0.06)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    swatchDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    themeCardLabel: {
      fontSize: 11,
      color: colors.text,
      fontWeight: "600",
    },
    themeCardLabelActive: {
      color: colors.primary,
      fontWeight: "800",
    },
    activeIndicatorDot: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    // Logout
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme === "dark" ? "#29181c" : "#fff0f2",
      borderWidth: 1,
      borderColor: theme === "dark" ? "#4a2027" : "#ffccd5",
      marginBottom: 30,
      gap: 8,
    },
    logoutText: {
      fontSize: 15,
      color: "#ff4d6d",
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    // Footer
    footerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 24,
      paddingHorizontal: 20,
      opacity: 0.6,
    },
    footerText: {
      fontSize: 11,
      color: colors.subtext,
      marginLeft: 6,
      textAlign: "center",
    },
  });
