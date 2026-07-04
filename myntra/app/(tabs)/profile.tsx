import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
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
} from "lucide-react-native";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const menuItems = [
  { icon: Package, label: "Orders", route: "/orders" },
  { icon: Heart, label: "Wishlist", route: "/wishlist" },
  { icon: Eye, label: "Recently Viewed", route: "/recently-viewed" },
  { icon: Bell, label: "Notifications & Tasks", route: "/notifications" },
  { icon: CreditCard, label: "Payment Methods", route: "/payments" },
  { icon: MapPin, label: "Addresses", route: "/addresses" },
  { icon: Settings, label: "Settings", route: "/settings" },
];

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, colors, setTheme, currentSelection } = useTheme();

  const styles = getStyles(colors);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const renderThemeSelector = () => (
    <View style={styles.themeSection}>
      <Text style={styles.themeSectionTitle}>Theme Preferences</Text>
      <View style={styles.themeOptionsRow}>
        {(["system", "light", "dark", "myntra"] as const).map((opt) => {
          const isActive = currentSelection === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.themeOptionButton,
                isActive && styles.themeOptionButtonActive,
              ]}
              onPress={() => setTheme(opt)}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  isActive && styles.themeOptionTextActive,
                ]}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
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
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.emptyState}>
            <User size={64} color={colors.primary} />
            <Text style={styles.emptyTitle}>
              Please login to view your profile
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.loginButtonText}>LOGIN</Text>
            </TouchableOpacity>
          </View>

          {renderThemeSelector()}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <User size={40} color="#fff" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuItemLeft}>
                <item.icon size={24} color={colors.icon} />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <ChevronRight size={24} color={colors.icon} />
            </TouchableOpacity>
          ))}
        </View>

        {renderThemeSelector()}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={24} color={colors.primary} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
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
    content: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      backgroundColor: colors.card,
      marginTop: 20,
      marginHorizontal: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyTitle: {
      fontSize: 18,
      color: colors.text,
      marginTop: 20,
      marginBottom: 20,
      textAlign: "center",
    },
    loginButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 40,
      paddingVertical: 15,
      borderRadius: 10,
    },
    loginButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      padding: 20,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    userDetails: {
      marginLeft: 15,
    },
    userName: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 5,
    },
    userEmail: {
      fontSize: 14,
      color: colors.subtext,
    },
    menuSection: {
      marginTop: 20,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 15,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    menuItemLabel: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 15,
    },
    themeSection: {
      marginTop: 20,
      padding: 20,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    themeSectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
    },
    themeOptionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    themeOptionButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      alignItems: "center",
    },
    themeOptionButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    themeOptionText: {
      fontSize: 14,
      color: colors.text,
    },
    themeOptionTextActive: {
      color: "#fff",
      fontWeight: "bold",
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 15,
      marginTop: 20,
      marginBottom: 30,
      marginHorizontal: 15,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    logoutText: {
      marginLeft: 10,
      fontSize: 16,
      color: colors.primary,
      fontWeight: "bold",
    },
  });

