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
import { Eye, EyeOff, User, Mail, Lock, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react-native";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";

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
  const slideAnim = useRef(new Animated.Value(50)).current;
  const lightIntensity = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
    ]).start();

    // Spotlight glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(lightIntensity, { toValue: 1.0, duration: 2500, useNativeDriver: true }),
        Animated.timing(lightIntensity, { toValue: 0.85, duration: 2000, useNativeDriver: true }),
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
  const pwdColor = ["#ccc", "#ff4d6d", "#ff9800", "#ffc107", "#2ecc71"][pwdScore];
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentSpacer} />

        {/* Glassmorphic Sign Up Card */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Register</Text>

            {apiError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>⚠ {apiError}</Text>
              </View>
            ) : null}

            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <View
                style={[
                  styles.inputWrapper,
                  focused.fullName && styles.inputWrapperFocused,
                  errors.fullName && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={formData.fullName}
                  onChangeText={(t) => setFormData({ ...formData, fullName: t })}
                  onFocus={() => setFieldFocus("fullName", true)}
                  onBlur={() => setFieldFocus("fullName", false)}
                  autoComplete="name"
                />
                <User size={16} color="rgba(255, 255, 255, 0.6)" style={styles.fieldIcon} />
              </View>
              {errors.fullName ? <Text style={styles.fieldError}>{errors.fullName}</Text> : null}
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <View
                style={[
                  styles.inputWrapper,
                  focused.email && styles.inputWrapperFocused,
                  errors.email && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={formData.email}
                  onChangeText={(t) => setFormData({ ...formData, email: t })}
                  onFocus={() => setFieldFocus("email", true)}
                  onBlur={() => setFieldFocus("email", false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <Mail size={16} color="rgba(255, 255, 255, 0.6)" style={styles.fieldIcon} />
              </View>
              {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <View
                style={[
                  styles.inputWrapper,
                  focused.password && styles.inputWrapperFocused,
                  errors.password && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Password (min. 8 chars)"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={formData.password}
                  onChangeText={(t) => setFormData({ ...formData, password: t })}
                  onFocus={() => setFieldFocus("password", true)}
                  onBlur={() => setFieldFocus("password", false)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.visibilityToggle}>
                  {showPassword ? (
                    <EyeOff size={16} color="rgba(255, 255, 255, 0.6)" />
                  ) : (
                    <Eye size={16} color="rgba(255, 255, 255, 0.6)" />
                  )}
                </TouchableOpacity>
                <Lock size={16} color="rgba(255, 255, 255, 0.6)" style={styles.fieldIcon} />
              </View>

              {/* Password strength bar */}
              {formData.password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: i <= pwdScore ? pwdColor : "rgba(255, 255, 255, 0.15)" },
                      ]}
                    />
                  ))}
                  <Text style={[styles.strengthLabel, { color: pwdColor }]}>{pwdLabel}</Text>
                </View>
              )}
              {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text style={styles.submitBtnText}>Register</Text>
              )}
            </TouchableOpacity>

            {/* Redirection */}
            <View style={styles.redirectRow}>
              <Text style={styles.redirectLabel}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/login")} activeOpacity={0.7}>
                <Text style={styles.redirectLink}>Sign In</Text>
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
  // Spotlight Lamp
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
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  contentSpacer: {
    height: height * 0.18,
  },
  // Card
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
    paddingVertical: 32,
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
  errorBoxText: {
    color: "#ff4d6d",
    fontSize: 13,
    fontWeight: "600",
  },
  fieldGroup: {
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 18,
    height: 50,
  },
  inputWrapperFocused: {
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  inputWrapperError: {
    borderColor: "#ff4d6d",
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
  fieldError: {
    color: "#ff4d6d",
    fontSize: 11,
    marginTop: 4,
    marginLeft: 14,
    fontWeight: "600",
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 5,
    paddingHorizontal: 12,
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
  // Submit Button
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
    marginTop: 10,
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
