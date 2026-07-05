import { useState, useRef, useEffect } from "react";
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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import React from "react";
import { Eye, EyeOff, User, Mail, Lock, ShieldCheck, CheckCircle2 } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface AuthScreenProps {
  initialMode?: "login" | "signup";
}

export default function AuthScreen({ initialMode = "login" }: AuthScreenProps) {
  const { login, Signup } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  // Mode state: true = login, false = signup
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Validation errors
  const [errors, setErrors] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });

  // Input focus states
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Responsive state
  const [winWidth, setWinWidth] = useState(Dimensions.get("window").width);
  const [winHeight, setWinHeight] = useState(Dimensions.get("window").height);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const lightIntensity = useRef(new Animated.Value(0.85)).current;

  // Track resizing
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWinWidth(window.width);
      setWinHeight(window.height);
    });
    return () => subscription.remove();
  }, []);

  // Spotlight hum animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(lightIntensity, { toValue: 1.0, duration: 2500, useNativeDriver: true }),
        Animated.timing(lightIntensity, { toValue: 0.85, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const shakeCard = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 9, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { fullName: "", email: "", password: "", confirmPassword: "" };

    if (!isLogin) {
      if (!fullName.trim()) {
        newErrors.fullName = "Full name is required";
        isValid = false;
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
        isValid = false;
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        isValid = false;
      }
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email format";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    setApiError("");
    if (!validateForm()) {
      shakeCard();
      return;
    }

    try {
      setIsLoading(true);
      if (isLogin) {
        await login(email.trim(), password);
        router.replace("/(tabs)");
      } else {
        await Signup(fullName.trim(), email.trim(), password);
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error(error);
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        (isLogin ? "Invalid credentials. Please try again." : "Registration failed. Please try again.");
      setApiError(errMsg);
      shakeCard();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setApiError("");
    setErrors({ fullName: "", email: "", password: "", confirmPassword: "" });
    
    // Smooth transition between screens
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setIsLogin(!isLogin);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const isDesktop = winWidth > 768;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.mainContainer, { flexDirection: isDesktop ? "row" : "column" }]}>
        
        {/* Left Panel: Model Image (only on desktop/tablet) */}
        {isDesktop && (
          <View style={styles.leftPanel}>
            <Image
              source={require("@/assets/images/login-bg.jpg")}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay} />
            <View style={styles.brandOverlay}>
              <Text style={styles.brandSubtitle}>M Y N T R A  E L I T E</Text>
              <Text style={styles.brandTagline}>Elevate your daily lifestyle with curated premium fashion collections.</Text>
            </View>
          </View>
        )}

        {/* Right Panel: Interactive Form */}
        <View style={[styles.rightPanel, { flex: isDesktop ? 1 : undefined, height: isDesktop ? "100%" : winHeight }]}>
          {/* If on mobile, use the brick wall image as the right panel background */}
          {!isDesktop && (
            <>
              <Image
                source={require("@/assets/images/brick-wall.jpg")}
                style={styles.mobileBackgroundImage}
                resizeMode="cover"
              />
              <View style={styles.mobileOverlay} />
            </>
          )}

          {/* Wall Lamp Spotlight (both desktop and mobile) */}
          <View style={styles.lampContainer}>
            <View style={styles.lampBody} />
            <View style={styles.lampBulb} />
          </View>

          {/* Spotlight light cone */}
          <Animated.View style={[styles.spotlightWrapper, { opacity: lightIntensity, pointerEvents: "none" as any }]}>
            <LinearGradient
              colors={["rgba(255, 235, 170, 0.4)", "rgba(255, 235, 170, 0.04)", "transparent"]}
              style={styles.spotlightCone}
            />
          </Animated.View>

          <ScrollView
            contentContainerStyle={[styles.formScroll, { paddingTop: isDesktop ? 100 : 120 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.cardWrapper,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: shakeAnim }],
                },
              ]}
            >
              <View style={styles.glassCard}>
                <Text style={styles.cardTitle}>{isLogin ? "Login" : "Sign Up"}</Text>

                {apiError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠ {apiError}</Text>
                  </View>
                ) : null}

                {/* Full Name (Sign Up only) */}
                {!isLogin && (
                  <View style={styles.fieldGroup}>
                    <View style={[styles.inputWrapper, focusedField === "fullName" && styles.inputWrapperFocused, errors.fullName ? styles.inputWrapperError : null]}>
                      <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={fullName}
                        onChangeText={setFullName}
                        onFocus={() => setFocusedField("fullName")}
                        onBlur={() => setFocusedField(null)}
                        autoComplete="name"
                      />
                      <User size={16} color="rgba(255, 255, 255, 0.6)" style={styles.fieldIcon} />
                    </View>
                    {errors.fullName ? <Text style={styles.fieldError}>{errors.fullName}</Text> : null}
                  </View>
                )}

                {/* Email Address */}
                <View style={styles.fieldGroup}>
                  <View style={[styles.inputWrapper, focusedField === "email" && styles.inputWrapperFocused, errors.email ? styles.inputWrapperError : null]}>
                    <TextInput
                      style={styles.input}
                      placeholder={isLogin ? "Username / Email" : "Email Address"}
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                    <Mail size={16} color="rgba(255, 255, 255, 0.6)" style={styles.fieldIcon} />
                  </View>
                  {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <View style={[styles.inputWrapper, focusedField === "password" && styles.inputWrapperFocused, errors.password ? styles.inputWrapperError : null]}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Password"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
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
                  {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
                </View>

                {/* Confirm Password (Sign Up only) */}
                {!isLogin && (
                  <View style={styles.fieldGroup}>
                    <View style={[styles.inputWrapper, focusedField === "confirmPassword" && styles.inputWrapperFocused, errors.confirmPassword ? styles.inputWrapperError : null]}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Confirm Password"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onFocus={() => setFocusedField("confirmPassword")}
                        onBlur={() => setFocusedField(null)}
                        secureTextEntry={!showPassword}
                      />
                      <Lock size={16} color="rgba(255, 255, 255, 0.6)" style={styles.fieldIcon} />
                    </View>
                    {errors.confirmPassword ? <Text style={styles.fieldError}>{errors.confirmPassword}</Text> : null}
                  </View>
                )}

                {/* Options Row (Remember Me / Forgot Password - Login only) */}
                {isLogin && (
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
                )}

                {/* Submit button */}
                <TouchableOpacity
                  style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#0d0f14" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>{isLogin ? "Login" : "Register"}</Text>
                  )}
                </TouchableOpacity>

                {/* Footer redirection toggle */}
                <View style={styles.redirectRow}>
                  <Text style={styles.redirectLabel}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                  </Text>
                  <TouchableOpacity onPress={toggleMode} activeOpacity={0.7}>
                    <Text style={styles.redirectLink}>
                      {isLogin ? "Register" : "Login"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* SSL Badge */}
            <View style={styles.sslBadge}>
              <ShieldCheck size={12} color="rgba(255, 255, 255, 0.4)" style={{ marginRight: 4 }} />
              <Text style={styles.sslText}>Secure SSL Connection</Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#06080c",
  },
  mainContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  // Left Panel
  leftPanel: {
    flex: 1.2,
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(18, 12, 16, 0.25)",
  },
  brandOverlay: {
    position: "absolute",
    bottom: 60,
    left: 50,
    right: 50,
  },
  brandSubtitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 6,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginBottom: 10,
  },
  brandTagline: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 22,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Right Panel
  rightPanel: {
    backgroundColor: "#080b11",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  mobileBackgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  mobileOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(11, 15, 28, 0.72)",
  },
  // Wall Lamp Spotlight
  lampContainer: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    alignItems: "center",
    zIndex: 10,
  },
  lampBody: {
    width: 60,
    height: 36,
    backgroundColor: "#131722",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  lampBulb: {
    width: 22,
    height: 10,
    backgroundColor: "#ffebaa",
    borderRadius: 5,
    marginTop: -4,
    shadowColor: "#ffebaa",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  spotlightWrapper: {
    position: "absolute",
    top: 32,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.75,
    alignItems: "center",
    zIndex: 2,
    pointerEvents: "none",
  },
  spotlightCone: {
    width: "100%",
    height: "100%",
  },
  // Scroll and Form
  formScroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    width: "100%",
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    overflow: "hidden",
    zIndex: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 20,
    marginBottom: 20,
  },
  glassCard: {
    paddingHorizontal: 24,
    paddingVertical: 36,
    backgroundColor: "rgba(10, 14, 28, 0.85)",
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 28,
    letterSpacing: 1.2,
  },
  errorBox: {
    backgroundColor: "rgba(255, 77, 109, 0.12)",
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
  fieldGroup: {
    marginBottom: 14,
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 18,
    height: 50,
    width: "100%",
  },
  inputWrapperFocused: {
    borderColor: "rgba(255, 255, 255, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.07)",
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
    marginLeft: 12,
    fontWeight: "600",
  },
  // Options
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    paddingHorizontal: 4,
    width: "100%",
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
    borderColor: "rgba(255, 255, 255, 0.25)",
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
  // Submit
  submitBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
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
    width: "100%",
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
    opacity: 0.4,
  },
  sslText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
  },
});
