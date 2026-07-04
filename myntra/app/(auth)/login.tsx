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
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react-native";
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
  const slideAnim = useRef(new Animated.Value(40)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
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
      {/* Hero Image */}
      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
        }}
        style={styles.heroImage}
        resizeMode="cover"
      />
      {/* Gradient overlay */}
      <View style={styles.gradientOverlay} />

      {/* Brand badge */}
      <View style={styles.brandBadge}>
        <Text style={styles.brandText}>MYNTRA</Text>
      </View>

      {/* Animated Card */}
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
          },
        ]}
      >
        <Text style={styles.title}>Welcome Back 👋</Text>
        <Text style={styles.subtitle}>Sign in to continue your fashion journey</Text>

        {/* Error */}
        {apiError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {apiError}</Text>
          </View>
        ) : null}

        {/* Email Field */}
        <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
          <Mail size={18} color={emailFocused ? colors.primary : colors.subtext} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email address"
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

        {/* Password Field */}
        <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
          <Lock size={18} color={passwordFocused ? colors.primary : colors.subtext} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Password"
            placeholderTextColor={colors.subtext}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.subtext} />
            ) : (
              <Eye size={18} color={colors.subtext} />
            )}
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotRow}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.loginBtnInner}>
              <Text style={styles.loginBtnText}>LOGIN</Text>
              <ArrowRight size={18} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Sign Up */}
        <TouchableOpacity
          style={styles.signupBtn}
          onPress={() => router.push("/signup")}
          activeOpacity={0.8}
        >
          <Text style={styles.signupBtnText}>CREATE NEW ACCOUNT</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you agree to our{" "}
          <Text style={styles.termsLink}>Terms of Use</Text> &{" "}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: string, colors: any) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    heroImage: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: height * 0.48,
      width: "100%",
    },
    gradientOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: height * 0.48,
      backgroundColor: "rgba(0,0,0,0.22)",
    },
    brandBadge: {
      position: "absolute",
      top: 56,
      alignSelf: "center",
    },
    brandText: {
      fontSize: 32,
      fontWeight: "900",
      color: "#fff",
      letterSpacing: 6,
      textShadowColor: "rgba(0,0,0,0.4)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
    },
    card: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 28,
      paddingBottom: 40,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 16,
    },
    title: {
      fontSize: 26,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.subtext,
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
    errorText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: "600",
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginBottom: 14,
      paddingHorizontal: 14,
      paddingVertical: 2,
    },
    inputWrapperFocused: {
      borderColor: colors.primary,
      backgroundColor: theme === "dark" ? "#252525" : "#fff8fa",
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      paddingVertical: 14,
    },
    eyeButton: {
      padding: 6,
    },
    forgotRow: {
      alignSelf: "flex-end",
      marginBottom: 20,
    },
    forgotText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: "600",
    },
    loginBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    loginBtnDisabled: {
      opacity: 0.7,
    },
    loginBtnInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    loginBtnText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 2,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.subtext,
      fontSize: 13,
      marginHorizontal: 12,
    },
    signupBtn: {
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.primary,
    },
    signupBtnText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 1.5,
    },
    termsText: {
      marginTop: 16,
      textAlign: "center",
      fontSize: 11,
      color: colors.subtext,
      lineHeight: 18,
    },
    termsLink: {
      color: colors.primary,
      fontWeight: "600",
    },
  });
