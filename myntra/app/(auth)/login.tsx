import { useState, useRef } from "react";
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
import React, { useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { theme, colors } = useTheme();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const lightIntensity = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
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
    ]).start();

    // Gentle hum/flicker animation for the spotlight
    Animated.loop(
      Animated.sequence([
        Animated.timing(lightIntensity, { toValue: 1.0, duration: 2500, useNativeDriver: true }),
        Animated.timing(lightIntensity, { toValue: 0.85, duration: 2000, useNativeDriver: true }),
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
      {/* Background image of brick wall */}
      <Image
        source={require("@/assets/images/brick-wall.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      {/* Deep Blue-Dark overlay masking background */}
      <View style={styles.darkOverlay} />

      {/* Spotlight Lamp Fixture */}
      <View style={styles.lampContainer}>
        <View style={styles.lampBody} />
        <View style={styles.lampBulb} />
      </View>

      {/* Spotlight Light Cone */}
      <Animated.View style={[styles.spotlightWrapper, { opacity: lightIntensity }]}>
        <LinearGradient
          colors={["rgba(255, 235, 170, 0.4)", "rgba(255, 235, 170, 0.05)", "transparent"]}
          style={styles.spotlightCone}
        />
      </Animated.View>

      {/* Login Card Scroll Panel */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentSpacer} />

        {/* Glassmorphic Login Card */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
            },
          ]}
        >
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Login</Text>

            {/* Error Message Box */}
            {apiError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {apiError}</Text>
              </View>
            ) : null}

            {/* Username Input Field */}
            <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Username / Email"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <Mail size={16} color="rgba(255, 255, 255, 0.6)" style={styles.fieldIcon} />
            </View>

            {/* Password Input Field */}
            <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.visibilityToggle}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={16} color="rgba(255, 255, 255, 0.6)" />
                ) : (
                  <Eye size={16} color="rgba(255, 255, 255, 0.6)" />
                )}
              </TouchableOpacity>
              <Lock size={16} color="rgba(255, 255, 255, 0.6)" style={styles.fieldIcon} />
            </View>

            {/* Row: Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <CheckCircle2 size={12} color="#111" />}
                </View>
                <Text style={styles.optionText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.optionText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text style={styles.submitBtnText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Redirection */}
            <View style={styles.redirectRow}>
              <Text style={styles.redirectLabel}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/signup")} activeOpacity={0.7}>
                <Text style={styles.redirectLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* SSL stamp */}
        <View style={styles.sslBadge}>
          <ShieldCheck size={12} color="rgba(255, 255, 255, 0.4)" style={{ marginRight: 4 }} />
          <Text style={styles.sslText}>Secure SSL Connection</Text>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0d0f14",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  darkOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(11, 15, 28, 0.70)",
  },
  // Spotlight Lamp Fixture
  lampContainer: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    alignItems: "center",
    zIndex: 10,
  },
  lampBody: {
    width: 64,
    height: 38,
    backgroundColor: "#161b26",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  lampBulb: {
    width: 24,
    height: 12,
    backgroundColor: "#fff0c0",
    borderRadius: 6,
    marginTop: -4,
    shadowColor: "#fff0c0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  spotlightWrapper: {
    position: "absolute",
    top: 34,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.72,
    alignItems: "center",
    zIndex: 2,
    pointerEvents: "none",
  },
  spotlightCone: {
    width: "100%",
    height: "100%",
  },
  // Scroll content
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  contentSpacer: {
    height: height * 0.22,
  },
  // Glassmorphic card container
  cardWrapper: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    overflow: "hidden",
    zIndex: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 24,
    marginBottom: 24,
  },
  glassCard: {
    paddingHorizontal: 24,
    paddingVertical: 36,
    backgroundColor: "rgba(18, 25, 50, 0.82)",
  },
  cardTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 28,
    letterSpacing: 1.2,
  },
  errorBox: {
    backgroundColor: "rgba(255, 77, 109, 0.15)",
    borderLeftWidth: 3,
    borderLeftColor: "#ff4d6d",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#ff4d6d",
    fontSize: 13,
    fontWeight: "600",
  },
  // Inputs
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    marginBottom: 16,
    paddingHorizontal: 18,
    height: 50,
  },
  inputWrapperFocused: {
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#ffffff",
    height: "100%",
    fontWeight: "500",
  },
  fieldIcon: {
    marginLeft: 8,
  },
  visibilityToggle: {
    padding: 4,
    marginRight: 6,
  },
  // Options Row
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  checkboxChecked: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
  },
  optionText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "600",
  },
  // Button
  submitBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: "#0d0f14",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  // Redirect
  redirectRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  redirectLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.65)",
    fontWeight: "500",
  },
  redirectLink: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  // SSL
  sslBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    opacity: 0.5,
  },
  sslText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
  },
});
