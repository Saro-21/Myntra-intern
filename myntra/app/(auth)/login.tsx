import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck, Sparkles } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { theme, colors } = useTheme();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  // Background floating orbs positions
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Basic entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle looping idle animation for the background orbs
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb1Y, { toValue: -15, duration: 3000, useNativeDriver: true }),
          Animated.timing(orb2Y, { toValue: 15, duration: 3500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(orb1Y, { toValue: 0, duration: 3000, useNativeDriver: true }),
          Animated.timing(orb2Y, { toValue: 0, duration: 3500, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 9, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const styles = getStyles(theme, colors);

  const handleLogin = async () => {
    setApiError("");
    if (!email.trim() || !password.trim()) {
      setApiError("Please enter both email and password.");
      shakeError();
      return;
    }
    try {
      setIsLoading(true);
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error(error);
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Invalid credentials. Please try again.";
      setApiError(errMsg);
      shakeError();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Background Graphic Orbs (Pure Styling to look like high-end visual design) */}
      <Animated.View style={[styles.glowOrb1, { transform: [{ translateY: orb1Y }] }]} />
      <Animated.View style={[styles.glowOrb2, { transform: [{ translateY: orb2Y }] }]} />

      {/* Hero Image Section */}
      <View style={styles.heroContainer}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
          }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlayGradient} />
      </View>

      {/* Brand Logo & Tag */}
      <Animated.View style={[styles.brandHeader, { transform: [{ scale: logoScale }] }]}>
        <Text style={styles.brandTitle}>M Y N T R A</Text>
        <View style={styles.taglineBadge}>
          <Sparkles size={11} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.taglineText}>ELEVATE YOUR STYLE</Text>
        </View>
      </Animated.View>

      {/* Dynamic Form Container */}
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
          },
        ]}
      >
        <Text style={styles.greetingTitle}>Welcome Back</Text>
        <Text style={styles.greetingSubtitle}>Sign in to access your curated collections</Text>

        {/* Action Error Box */}
        {apiError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {apiError}</Text>
          </View>
        ) : null}

        {/* Input Wrapper: Email */}
        <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
          <View style={[styles.iconContainer, emailFocused && styles.iconContainerFocused]}>
            <Mail size={16} color={emailFocused ? "#ffffff" : colors.subtext} />
          </View>
          <TextInput
            style={styles.inputField}
            placeholder="Email Address"
            placeholderTextColor={colors.subtext}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        {/* Input Wrapper: Password */}
        <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
          <View style={[styles.iconContainer, passwordFocused && styles.iconContainerFocused]}>
            <Lock size={16} color={passwordFocused ? "#ffffff" : colors.subtext} />
          </View>
          <TextInput
            style={[styles.inputField, { marginRight: 10 }]}
            placeholder="Password"
            placeholderTextColor={colors.subtext}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.visibilityToggle}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            {showPassword ? (
              <EyeOff size={16} color={colors.subtext} />
            ) : (
              <Eye size={16} color={colors.subtext} />
            )}
          </TouchableOpacity>
        </View>

        {/* Forgot password label */}
        <TouchableOpacity style={styles.forgotButton} activeOpacity={0.7}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <View style={styles.loginBtnContent}>
              <Text style={styles.loginBtnText}>SIGN IN</Text>
              <ArrowRight size={16} color="#ffffff" />
            </View>
          )}
        </TouchableOpacity>

        {/* Separator Line */}
        <View style={styles.separatorRow}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>OR CONNECT WITH</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Social / Shortcut Logins */}
        <View style={styles.socialButtonsRow}>
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/300/300221.png" }}
              style={styles.socialIcon}
            />
            <Text style={styles.socialBtnText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/0/747.png" }}
              style={[styles.socialIcon, theme === "dark" && { filter: "invert(1)" }]}
            />
            <Text style={styles.socialBtnText}>Apple</Text>
          </TouchableOpacity>
        </View>

        {/* Redirect Button */}
        <View style={styles.signupRedirectRow}>
          <Text style={styles.signupLabel}>New to Myntra? </Text>
          <TouchableOpacity onPress={() => router.push("/signup")} activeOpacity={0.7}>
            <Text style={styles.signupText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* SSL Shield verification */}
        <View style={styles.sslBadge}>
          <ShieldCheck size={12} color={colors.subtext} style={{ marginRight: 4 }} />
          <Text style={styles.sslText}>Secure 256-Bit SSL Connection</Text>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: string, colors: any) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
      position: "relative",
    },
    // Floating graphics
    glowOrb1: {
      position: "absolute",
      top: height * 0.28,
      left: -50,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: colors.primary + "18",
      filter: "blur(20px)",
      zIndex: 1,
    },
    glowOrb2: {
      position: "absolute",
      top: height * 0.44,
      right: -40,
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: "#9b59b615",
      filter: "blur(25px)",
      zIndex: 1,
    },
    // Hero Banner
    heroContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: height * 0.45,
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    imageOverlayGradient: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme === "dark" ? "rgba(20, 20, 20, 0.45)" : "rgba(0, 0, 0, 0.2)",
    },
    // Brand header
    brandHeader: {
      position: "absolute",
      top: height * 0.08,
      alignSelf: "center",
      alignItems: "center",
      zIndex: 10,
    },
    brandTitle: {
      fontSize: 32,
      fontWeight: "900",
      color: "#ffffff",
      letterSpacing: 8,
      textShadowColor: "rgba(0, 0, 0, 0.35)",
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 10,
    },
    taglineBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 63, 108, 0.8)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      marginTop: 8,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    taglineText: {
      fontSize: 9,
      fontWeight: "800",
      color: "#ffffff",
      letterSpacing: 1.5,
    },
    // Custom Card Panel
    card: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme === "dark" ? "rgba(28, 28, 30, 0.96)" : "rgba(255, 255, 255, 0.96)",
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      paddingHorizontal: 28,
      paddingTop: 32,
      paddingBottom: Platform.OS === "ios" ? 44 : 32,
      borderWidth: 1,
      borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -12 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 20,
      zIndex: 5,
    },
    greetingTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: 0.3,
    },
    greetingSubtitle: {
      fontSize: 13,
      color: colors.subtext,
      marginTop: 3,
      marginBottom: 24,
    },
    // Inputs
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginBottom: 12,
      paddingRight: 16,
    },
    inputWrapperFocused: {
      borderColor: colors.primary,
      backgroundColor: theme === "dark" ? "#222224" : "#fffcfd",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme === "dark" ? "#2e2e30" : "#f1f1f3",
      justifyContent: "center",
      alignItems: "center",
      margin: 4,
    },
    iconContainerFocused: {
      backgroundColor: colors.primary,
    },
    inputField: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      paddingVertical: 12,
      marginLeft: 10,
      fontWeight: "600",
    },
    visibilityToggle: {
      padding: 4,
    },
    forgotButton: {
      alignSelf: "flex-end",
      marginBottom: 20,
      padding: 2,
    },
    forgotText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: "700",
    },
    // Main button
    loginBtn: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 6,
      marginBottom: 24,
    },
    loginBtnDisabled: {
      opacity: 0.7,
    },
    loginBtnContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    loginBtnText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 2,
    },
    // Separator line
    separatorRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 18,
    },
    separatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    separatorText: {
      color: colors.subtext,
      fontSize: 10,
      fontWeight: "800",
      marginHorizontal: 12,
      letterSpacing: 1.2,
    },
    // Social connect buttons
    socialButtonsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 24,
    },
    socialBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme === "dark" ? "#2c2c2e" : "#f5f6f8",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 12,
      gap: 8,
    },
    socialIcon: {
      width: 18,
      height: 18,
    },
    socialBtnText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    // Redirect block
    signupRedirectRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    signupLabel: {
      fontSize: 13,
      color: colors.subtext,
      fontWeight: "500",
    },
    signupText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: "700",
    },
    // Security verification
    sslBadge: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      opacity: 0.65,
    },
    sslText: {
      fontSize: 10,
      color: colors.subtext,
      fontWeight: "600",
    },
  });
