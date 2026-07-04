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
import { Eye, EyeOff, User, Mail, Lock, CheckCircle, ArrowRight } from "lucide-react-native";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const { height } = Dimensions.get("window");

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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const styles = getStyles(theme, colors);

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

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop",
        }}
        style={styles.heroImage}
        resizeMode="cover"
      />
      <View style={styles.heroOverlay} />
      <View style={styles.brandBadge}>
        <Text style={styles.brandText}>MYNTRA</Text>
        <Text style={styles.brandTagline}>Fashion for Everyone</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Spacer to push form below image */}
        <View style={{ height: height * 0.3 }} />

        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.title}>Create Account ✨</Text>
          <Text style={styles.subtitle}>Join millions discovering fashion every day</Text>

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
              <User size={18} color={focused.fullName ? colors.primary : colors.subtext} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={colors.subtext}
                value={formData.fullName}
                onChangeText={(t) => setFormData({ ...formData, fullName: t })}
                onFocus={() => setFieldFocus("fullName", true)}
                onBlur={() => setFieldFocus("fullName", false)}
                autoComplete="name"
              />
              {formData.fullName.length > 1 && !errors.fullName && (
                <CheckCircle size={16} color={colors.success} />
              )}
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
              <Mail size={18} color={focused.email ? colors.primary : colors.subtext} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
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
                <CheckCircle size={16} color={colors.success} />
              )}
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
              <Lock size={18} color={focused.password ? colors.primary : colors.subtext} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password (min. 8 characters)"
                placeholderTextColor={colors.subtext}
                value={formData.password}
                onChangeText={(t) => setFormData({ ...formData, password: t })}
                onFocus={() => setFieldFocus("password", true)}
                onBlur={() => setFieldFocus("password", false)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? (
                  <EyeOff size={18} color={colors.subtext} />
                ) : (
                  <Eye size={18} color={colors.subtext} />
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

          {/* Submit */}
          <TouchableOpacity
            style={[styles.signupBtn, isLoading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.btnInner}>
                <Text style={styles.signupBtnText}>CREATE ACCOUNT</Text>
                <ArrowRight size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Already have an account?</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push("/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.loginBtnText}>LOGIN</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By signing up, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Use</Text> &{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
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
    },
    heroImage: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: height * 0.42,
      width: "100%",
    },
    heroOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: height * 0.42,
      backgroundColor: "rgba(0,0,0,0.28)",
    },
    brandBadge: {
      position: "absolute",
      top: 56,
      alignSelf: "center",
      alignItems: "center",
    },
    brandText: {
      fontSize: 30,
      fontWeight: "900",
      color: "#fff",
      letterSpacing: 6,
      textShadowColor: "rgba(0,0,0,0.4)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
    },
    brandTagline: {
      fontSize: 13,
      color: "rgba(255,255,255,0.85)",
      letterSpacing: 1.5,
      marginTop: 2,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    card: {
      backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 28,
      paddingBottom: 50,
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
    errorBoxText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: "600",
    },
    fieldGroup: {
      marginBottom: 14,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 2,
    },
    inputWrapperFocused: {
      borderColor: colors.primary,
      backgroundColor: theme === "dark" ? "#252525" : "#fff8fa",
    },
    inputWrapperError: {
      borderColor: "#ff3f6c",
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
    eyeBtn: {
      padding: 6,
    },
    fieldError: {
      color: "#ff3f6c",
      fontSize: 11,
      marginTop: 4,
      marginLeft: 4,
    },
    strengthRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      gap: 5,
    },
    strengthBar: {
      flex: 1,
      height: 3,
      borderRadius: 2,
    },
    strengthLabel: {
      fontSize: 11,
      fontWeight: "700",
      marginLeft: 6,
      width: 40,
    },
    signupBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    btnDisabled: {
      opacity: 0.7,
    },
    btnInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    signupBtnText: {
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
      fontSize: 12,
      marginHorizontal: 10,
    },
    loginBtn: {
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.primary,
    },
    loginBtnText: {
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
