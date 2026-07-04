import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
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
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import axios from "axios";
import API_URL from "@/constants/Api";

const menuGroups = [
  {
    title: "My Activity",
    items: [
      { icon: Package, label: "Orders", route: "/orders", badgeKey: "orders" },
      { icon: Heart, label: "Wishlist", route: "/wishlist", badgeKey: "wishlist" },
      { icon: Eye, label: "Recently Viewed", route: "/recently-viewed", badgeKey: "history" },
    ],
  },
  {
    title: "Account Settings",
    items: [
      { icon: Bell, label: "Notifications & Tasks", route: "/notifications" },
      { icon: CreditCard, label: "Payment Methods", route: "/payments" },
      { icon: MapPin, label: "Addresses", route: "/addresses" },
      { icon: Settings, label: "Preferences & Settings", route: "/settings" },
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
      // Fetch wishlist items
      const wlRes = await axios.get(`${API_URL}/wishlist?userId=${user._id}`);
      // Fetch order list
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
      <Text style={styles.sectionHeaderTitle}>Visual Experience</Text>
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
          <Text style={styles.headerTitle}>My Account</Text>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.guestCard}>
            <View style={styles.guestIconBg}>
              <User size={48} color={colors.primary} />
            </View>
            <Text style={styles.guestTitle}>Welcome to Myntra</Text>
            <Text style={styles.guestSubtitle}>
              Log in to track orders, save favorite items to your wishlist, customize themes, and unlock standard checkout.
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
            <Shield size={16} color={colors.subtext} />
            <Text style={styles.footerText}>Secure 256-bit SSL encryption. Antigravity Systems.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileMain}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>Silver Club Member</Text>
              </View>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.statCol}
              onPress={() => router.push("/orders")}
            >
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
            <View style={styles.menuGroupCard}>
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
                      <View style={styles.menuItemIconBg}>
                        <item.icon size={20} color={colors.primary} />
                      </View>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                    </View>
                    <View style={styles.menuItemRight}>
                      {badgeCount > 0 && (
                        <View style={styles.menuItemBadge}>
                          <Text style={styles.menuItemBadgeText}>{badgeCount}</Text>
                        </View>
                      )}
                      <ChevronRight size={20} color={colors.subtext} />
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
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={20} color={colors.primary} />
          <Text style={styles.logoutText}>Log Out Account</Text>
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Shield size={16} color={colors.subtext} />
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
    header: {
      padding: 20,
      paddingTop: 50,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      letterSpacing: 0.5,
    },
    content: {
      flex: 1,
      padding: 15,
    },
    // Guest State
    guestCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
      marginBottom: 20,
    },
    guestIconBg: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme === "dark" ? "#2a2a2a" : "#fff0f3",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    guestTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
      textAlign: "center",
    },
    guestSubtitle: {
      fontSize: 14,
      color: colors.subtext,
      lineHeight: 20,
      textAlign: "center",
      marginBottom: 24,
      paddingHorizontal: 10,
    },
    loginButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 40,
      paddingVertical: 14,
      borderRadius: 25,
      width: "100%",
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    loginButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "bold",
      letterSpacing: 1,
    },
    // Logged In State
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
      marginBottom: 20,
    },
    profileMain: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    avatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 3,
    },
    avatarText: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "bold",
      letterSpacing: 1,
    },
    userDetails: {
      marginLeft: 15,
      flex: 1,
    },
    userName: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 2,
    },
    userEmail: {
      fontSize: 13,
      color: colors.subtext,
      marginBottom: 6,
    },
    memberBadge: {
      alignSelf: "flex-start",
      backgroundColor: theme === "dark" ? "#2a221f" : "#fff8e7",
      borderWidth: 1,
      borderColor: theme === "dark" ? "#443a2b" : "#ffe8b3",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    memberBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme === "dark" ? "#e5c158" : "#b8860b",
    },
    statsRow: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 15,
      justifyContent: "space-between",
    },
    statCol: {
      flex: 1,
      alignItems: "center",
    },
    statVal: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
      color: colors.subtext,
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.border,
      height: "70%",
      alignSelf: "center",
    },
    // Menu Group
    menuGroupSection: {
      marginBottom: 20,
    },
    menuGroupTitle: {
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      color: colors.subtext,
      marginBottom: 8,
      marginLeft: 4,
      letterSpacing: 0.5,
    },
    menuGroupCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 5,
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
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme === "dark" ? "#222222" : "#fbf0f2",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    menuItemLabel: {
      fontSize: 15,
      color: colors.text,
      fontWeight: "500",
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
    // Theme Selector Card
    themeSection: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    sectionHeaderTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 2,
    },
    sectionHeaderSubtitle: {
      fontSize: 12,
      color: colors.subtext,
      marginBottom: 16,
    },
    themeOptionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 10,
    },
    themeCard: {
      width: "31%",
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
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
      borderColor: "rgba(0,0,0,0.1)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    swatchDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    themeCardLabel: {
      fontSize: 12,
      color: colors.text,
      fontWeight: "500",
    },
    themeCardLabelActive: {
      color: colors.primary,
      fontWeight: "bold",
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
      borderRadius: 12,
      backgroundColor: theme === "dark" ? "#22181a" : "#fff5f6",
      borderWidth: 1,
      borderColor: theme === "dark" ? "#442226" : "#ffe5e7",
      marginBottom: 20,
    },
    logoutText: {
      marginLeft: 10,
      fontSize: 15,
      color: colors.primary,
      fontWeight: "bold",
    },
    // Footer
    footerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 20,
      paddingHorizontal: 20,
      opacity: 0.7,
    },
    footerText: {
      fontSize: 11,
      color: colors.subtext,
      marginLeft: 6,
      textAlign: "center",
    },
  });
