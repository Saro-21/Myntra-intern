import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Eye, EyeOff, User, Mail, Lock, CheckCircle, ArrowRight, ShieldCheck, Sparkles } from "lucide-react-native";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function SignupScreen() {
  const { Signup } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ fullName: "", email: "", password: "" });
  const [focused, setFocused] = useState({ fullName: false, email: false, password: false });
  const { theme, colors } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  // Background floating orbs
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();

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

  const passwordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const pwdScore = passwordStrength(formData.password);
  const pwdColor = ["#ccc", "#ff3f6c", "#ff9800", "#ffc107", "#03a685"][pwdScore];
  const pwdLabel = ["", "Weak", "Fair", "Good", "Strong"][pwdScore];

  const validateForm = () => {
    let isValid = true;
    const newErrors = { fullName: "", email: "", password: "" };
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
      isValid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleSignup = async () => {
    setApiError("");
    if (validateForm()) {
      try {
        setIsLoading(true);
        await Signup(formData.fullName, formData.email, formData.password);
        router.replace("/(tabs)");
      } catch (error: any) {
        const errMsg =
          error.response?.data?.message ||
          error.message ||
          "Failed to create account. Please try again.";
        setApiError(errMsg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const setFieldFocus = (field: keyof typeof focused, val: boolean) =>
    setFocused((prev) => ({ ...prev, [field]: val }));

  const styles = getStyles(theme, colors);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Background Graphic Orbs */}
      <Animated.View style={[styles.glowOrb1, { transform: [{ translateY: orb1Y }] }]} />
      <Animated.View style={[styles.glowOrb2, { transform: [{ translateY: orb2Y }] }]} />

      {/* Hero Banner */}
      <View style={styles.heroContainer}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
          }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlayGradient} />
      </View>

      {/* Brand Header */}
      <Animated.View style={[styles.brandHeader, { transform: [{ scale: logoScale }] }]}>
        <Text style={styles.brandTitle}>M Y N T R A</Text>
        <View style={styles.taglineBadge}>
          <Sparkles size={11} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.taglineText}>FASHION FOR EVERYONE</Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: height * 0.28 }} />

        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.greetingTitle}>Create Account</Text>
          <Text style={styles.greetingSubtitle}>Join us to unlock premium shopping experience</Text>

          {apiError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>⚠ {apiError}</Text>
            </View>
          ) : null}

          {/* Full Name Field */}
          <View style={styles.fieldGroup}>
            <View
              style={[
                styles.inputWrapper,
                focused.fullName && styles.inputWrapperFocused,
                errors.fullName && styles.inputWrapperError,
              ]}
            >
              <View style={[styles.iconContainer, focused.fullName && styles.iconContainerFocused]}>
                <User size={16} color={focused.fullName ? "#ffffff" : colors.subtext} />
              </View>
              <TextInput
                style={styles.inputField}
                placeholder="Full Name"
                placeholderTextColor={colors.subtext}
                value={formData.fullName}
                onChangeText={(t) => setFormData({ ...formData, fullName: t })}
                onFocus={() => setFieldFocus("fullName", true)}
                onBlur={() => setFieldFocus("fullName", false)}
                autoComplete="name"
              />
              {formData.fullName.length > 1 && !errors.fullName && (
                <CheckCircle size={16} color={colors.success} style={{ marginRight: 6 }} />
              )}
            </View>
            {errors.fullName ? <Text style={styles.fieldError}>{errors.fullName}</Text> : null}
          </View>

          {/* Email Field */}
          <View style={styles.fieldGroup}>
            <View
              style={[
                styles.inputWrapper,
                focused.email && styles.inputWrapperFocused,
                errors.email && styles.inputWrapperError,
              ]}
            >
              <View style={[styles.iconContainer, focused.email && styles.iconContainerFocused]}>
                <Mail size={16} color={focused.email ? "#ffffff" : colors.subtext} />
              </View>
              <TextInput
                style={styles.inputField}
                placeholder="Email Address"
                placeholderTextColor={colors.subtext}
                value={formData.email}
                onChangeText={(t) => setFormData({ ...formData, email: t })}
                onFocus={() => setFieldFocus("email", true)}
                onBlur={() => setFieldFocus("email", false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {/\S+@\S+\.\S+/.test(formData.email) && !errors.email && (
                <CheckCircle size={16} color={colors.success} style={{ marginRight: 6 }} />
              )}
            </View>
            {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
          </View>

          {/* Password Field */}
          <View style={styles.fieldGroup}>
            <View
              style={[
                styles.inputWrapper,
                focused.password && styles.inputWrapperFocused,
                errors.password && styles.inputWrapperError,
              ]}
            >
              <View style={[styles.iconContainer, focused.password && styles.iconContainerFocused]}>
                <Lock size={16} color={focused.password ? "#ffffff" : colors.subtext} />
              </View>
              <TextInput
                style={[styles.inputField, { marginRight: 10 }]}
                placeholder="Password (min. 8 characters)"
                placeholderTextColor={colors.subtext}
                value={formData.password}
                onChangeText={(t) => setFormData({ ...formData, password: t })}
                onFocus={() => setFieldFocus("password", true)}
                onBlur={() => setFieldFocus("password", false)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.visibilityToggle}>
                {showPassword ? (
                  <EyeOff size={16} color={colors.subtext} />
                ) : (
                  <Eye size={16} color={colors.subtext} />
                )}
              </TouchableOpacity>
            </View>

            {/* Password strength bar */}
            {formData.password.length > 0 && (
              <View style={styles.strengthRow}>
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      { backgroundColor: i <= pwdScore ? pwdColor : colors.border },
                    ]}
                  />
                ))}
                <Text style={[styles.strengthLabel, { color: pwdColor }]}>{pwdLabel}</Text>
              </View>
            )}
            {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.signupBtn, isLoading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <View style={styles.btnInner}>
                <Text style={styles.signupBtnText}>CREATE ACCOUNT</Text>
                <ArrowRight size={16} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Connect separator */}
          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR CONNECT WITH</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Social connection shortcuts */}
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

          {/* Redirect to login */}
          <View style={styles.loginRedirectRow}>
            <Text style={styles.loginLabel}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/login")} activeOpacity={0.7}>
              <Text style={styles.loginText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* SSL Badge stamp */}
          <View style={styles.sslBadge}>
            <ShieldCheck size={12} color={colors.subtext} style={{ marginRight: 4 }} />
            <Text style={styles.sslText}>Secure 256-Bit SSL Connection</Text>
          </View>
        </Animated.View>
      </ScrollView>
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
      top: height * 0.22,
      left: -50,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: colors.primary + "15",
      filter: "blur(20px)",
      zIndex: 1,
    },
    glowOrb2: {
      position: "absolute",
      top: height * 0.38,
      right: -40,
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: "#9b59b612",
      filter: "blur(25px)",
      zIndex: 1,
    },
    // Hero Banner
    heroContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: height * 0.4,
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
      top: height * 0.07,
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    // Custom Card Panel
    card: {
      backgroundColor: theme === "dark" ? "rgba(28, 28, 30, 0.96)" : "rgba(255, 255, 255, 0.96)",
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      paddingHorizontal: 28,
      paddingTop: 32,
      paddingBottom: 40,
      borderWidth: 1,
      borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -12 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 20,
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
    errorBox: {
      backgroundColor: "rgba(255,63,108,0.1)",
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    errorBoxText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: "600",
    },
    fieldGroup: {
      marginBottom: 12,
    },
    // Inputs
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
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
    inputWrapperError: {
      borderColor: "#ff3f6c",
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
    fieldError: {
      color: "#ff3f6c",
      fontSize: 11,
      marginTop: 4,
      marginLeft: 4,
      fontWeight: "600",
    },
    strengthRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      gap: 5,
      paddingHorizontal: 4,
    },
    strengthBar: {
      flex: 1,
      height: 3,
      borderRadius: 2,
    },
    strengthLabel: {
      fontSize: 11,
      fontWeight: "800",
      marginLeft: 6,
      width: 45,
    },
    // Main button
    signupBtn: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 6,
      marginTop: 10,
      marginBottom: 24,
    },
    btnDisabled: {
      opacity: 0.7,
    },
    btnInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    signupBtnText: {
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
    loginRedirectRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    loginLabel: {
      fontSize: 13,
      color: colors.subtext,
      fontWeight: "500",
    },
    loginText: {
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
