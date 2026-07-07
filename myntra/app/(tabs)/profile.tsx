import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
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
  ChevronLeft,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import axios from "axios";
import API_URL from "@/constants/Api";

const { width } = Dimensions.get("window");

const menuGroups = [
  {
    title: "My Activity",
    items: [
      { icon: Package, label: "Orders", route: "/orders", badgeKey: "orders", color: "#3498db" },
      { icon: Heart, label: "Wishlist", route: "/wishlist", badgeKey: "wishlist", color: "#e74c3c" },
      { icon: Eye, label: "Recently Viewed", route: "/recently-viewed", badgeKey: "history", color: "#2ecc71" },
    ],
  },
  {
    title: "Account Settings",
    items: [
      { icon: Bell, label: "Notifications & Tasks", route: "/notifications", color: "#f1c40f" },
      { icon: CreditCard, label: "Payment Methods", route: "/payments", color: "#9b59b6" },
      { icon: MapPin, label: "Addresses", route: "/addresses", color: "#e67e22" },
      { icon: Settings, label: "Preferences & Settings", route: "/settings", color: "#95a5a6" },
    ],
  },
];

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
      console.log("Error fetching profile user stats:", error);
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
              className="hover-grow"
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
        {/* Banner Gradient Header Background */}
        <View style={styles.gradientHeader}>
          <View style={styles.gradientGlow} />
          <Text style={styles.gradientHeaderTitle}>MY PROFILE</Text>
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
              className="hover-grow hover-glow-button"
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
      {/* Premium Header Banner */}
      <View style={styles.gradientHeader}>
        <View style={styles.gradientGlow} />
        <Text style={styles.gradientHeaderTitle}>MY PROFILE</Text>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card overlapping the header */}
        <View style={styles.profileCard} className="hover-grow">
          <View style={styles.profileMain}>
            <View style={styles.avatarOutline}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
              </View>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.memberBadge}>
                <Sparkles size={11} color={theme === "dark" ? "#e5c158" : "#b8860b"} style={{ marginRight: 4 }} />
                <Text style={styles.memberBadgeText}>Silver Club Member</Text>
              </View>
            </View>
          </View>

          {/* Quick Stats Grid with modern circular cards */}
          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.statCol}
              onPress={() => router.push("/orders")}
            >
              <View style={styles.statIconWrap}>
                <Package size={18} color={colors.primary} />
              </View>
              <Text style={styles.statVal}>
                {loadingStats ? <ActivityIndicator size="small" color={colors.primary} /> : stats.orders}
              </Text>
              <Text style={styles.statLabel}>Orders</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity 
              style={styles.statCol}
              onPress={() => router.push("/wishlist")}
            >
              <View style={styles.statIconWrap}>
                <Heart size={18} color={colors.primary} />
              </View>
              <Text style={styles.statVal}>
                {loadingStats ? <ActivityIndicator size="small" color={colors.primary} /> : stats.wishlist}
              </Text>
              <Text style={styles.statLabel}>Wishlist</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity 
              style={styles.statCol}
              onPress={() => router.push("/recently-viewed")}
            >
              <View style={styles.statIconWrap}>
                <Eye size={18} color={colors.primary} />
              </View>
              <Text style={styles.statVal}>
                {loadingStats ? <ActivityIndicator size="small" color={colors.primary} /> : stats.history}
              </Text>
              <Text style={styles.statLabel}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Groups */}
        {menuGroups.map((group, gIdx) => (
          <View key={gIdx} style={styles.menuGroupSection}>
            <Text style={styles.menuGroupTitle}>{group.title}</Text>
            <View style={styles.menuGroupCard} className="hover-grow">
              {group.items.map((item, index) => {
                const badgeCount = item.badgeKey ? (stats as any)[item.badgeKey] : 0;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.menuItem,
                      index === group.items.length - 1 && styles.menuItemLast,
                    ]}
                    onPress={() => router.push(item.route as any)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[styles.menuItemIconBg, { backgroundColor: item.color + "15" }]}>
                        <item.icon size={18} color={item.color} />
                      </View>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                    </View>
                    <View style={styles.menuItemRight}>
                      {badgeCount > 0 && (
                        <View style={styles.menuItemBadge}>
                          <Text style={styles.menuItemBadgeText}>{badgeCount}</Text>
                        </View>
                      )}
                      <ChevronRight size={18} color={colors.subtext} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {renderThemeSelector()}

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          className="hover-grow hover-glow-button"
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
      backgroundColor: colors.background,
    },
    // Banner Gradient Header
    gradientHeader: {
      height: 180,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
    },
    gradientGlow: {
      position: "absolute",
      top: -50,
      width: width * 1.5,
      height: 250,
      borderRadius: width,
      backgroundColor: "rgba(255, 255, 255, 0.15)",
    },
    gradientHeaderTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: "#ffffff",
      letterSpacing: 3,
      marginTop: 20,
    },
    contentScroll: {
      flex: 1,
      marginTop: -40,
      paddingHorizontal: 16,
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
      shadowOpacity: 0.08,
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
    // Logged In Card
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 6,
      marginBottom: 20,
    },
    profileMain: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    avatarOutline: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + "15",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.primary + "40",
    },
    avatar: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    avatarText: {
      color: "#fff",
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: 1,
    },
    userDetails: {
      marginLeft: 16,
      flex: 1,
    },
    userName: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: 0.2,
      marginBottom: 2,
    },
    userEmail: {
      fontSize: 13,
      color: colors.subtext,
      marginBottom: 8,
    },
    memberBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: theme === "dark" ? "#2a221f" : "#fff8e7",
      borderWidth: 1,
      borderColor: theme === "dark" ? "#443a2b" : "#ffe8b3",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    memberBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme === "dark" ? "#e5c158" : "#b8860b",
    },
    statsRow: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 18,
      justifyContent: "space-between",
    },
    statCol: {
      flex: 1,
      alignItems: "center",
    },
    statIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary + "10",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 6,
    },
    statVal: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 11,
      color: colors.subtext,
      fontWeight: "600",
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.border,
      height: "60%",
      alignSelf: "center",
    },
    // Menu Group
    menuGroupSection: {
      marginBottom: 20,
    },
    menuGroupTitle: {
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      color: colors.subtext,
      marginBottom: 10,
      marginLeft: 6,
      letterSpacing: 1.2,
    },
    menuGroupCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 10,
      elevation: 2,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemLast: {
      borderBottomWidth: 0,
    },
    menuItemLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    menuItemIconBg: {
      width: 38,
      height: 38,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    menuItemLabel: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "600",
    },
    menuItemRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    menuItemBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginRight: 8,
    },
    menuItemBadgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "bold",
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
      shadowOpacity: 0.05,
      shadowRadius: 20,
      elevation: 3,
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
      marginBottom: 20,
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
