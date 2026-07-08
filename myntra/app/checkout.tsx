import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import API_URL from "@/constants/Api";
import { useRouter } from "expo-router";
import { CreditCard, MapPin, Truck, Smartphone } from "lucide-react-native";
import Toast from "react-native-toast-message";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";

type PaymentMethod = "Card" | "UPI";

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [bagTotal, setBagTotal] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Card");
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  // Shipping form state
  const [fullName, setFullName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("India");

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // UPI form state
  const [upiId, setUpiId] = useState("");

  // Validation report state
  const [validationReport, setValidationReport] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);

  // Run pre-checkout checks (validate stock, price drift, discontinued items)
  useEffect(() => {
    if (!user) return;
    setIsValidating(true);
    axios
      .get(`${API_URL}/bag/validate-checkout?userId=${user._id}`)
      .then((res) => {
        setValidationReport(res.data);
        setBagTotal(res.data.total || 0);
      })
      .catch((err) => {
        console.error("Cart validation failed:", err);
        setBagTotal(0);
      })
      .finally(() => {
        setIsValidating(false);
      });
  }, [user]);

  const handleplaceorder = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (validationReport && !validationReport.valid) {
      setOrderError("Cannot place order. Please resolve the out of stock items in your cart first.");
      return;
    }
    if (!fullName.trim() || !address1.trim() || !city.trim() || !postal.trim()) {
      setOrderError("Please fill in all required shipping fields.");
      return;
    }
    if (paymentMethod === "UPI") {
      if (!upiId.trim() || !upiId.includes("@")) {
        setOrderError("Please enter a valid UPI ID (e.g. name@upi).");
        return;
      }
    }
    if (paymentMethod === "Card" && !cardNumber.trim()) {
      setOrderError("Please enter your card number.");
      return;
    }

    const shippingAddress = `${fullName.trim()}, ${address1.trim()}${
      address2 ? ", " + address2.trim() : ""
    }, ${city.trim()}, ${state.trim()} ${postal.trim()}, ${country.trim()}`;

    try {
      setLoading(true);
      setOrderError("");
      await axios.post(`${API_URL}/order?action=create&userId=${user._id}`, {
        shippingAddress,
        paymentMethod,
      });
      Toast.show({
        type: 'success',
        text1: 'Order Placed Successfully!',
        text2: 'Your payment is confirmed and the order is placed.',
        position: 'top',
        visibilityTime: 4000,
      });
      router.push("/orders");
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Failed to place order. Please try again.";
      setOrderError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {isValidating ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ color: colors.subtext, marginTop: 8, fontSize: 13 }}>Validating cart stock & pricing...</Text>
          </View>
        ) : (
          <>
            {/* Validation Errors */}
            {validationReport && validationReport.errors && validationReport.errors.length > 0 && (
              <View style={styles.errorBanner}>
                <Text style={styles.bannerTitle}>Out of Stock Items Found</Text>
                {validationReport.errors.map((err: any, idx: number) => (
                  <Text key={idx} style={styles.bannerMessage}>• {err.message}</Text>
                ))}
                <TouchableOpacity style={styles.fixCartBtn} onPress={() => router.push("/bag")}>
                  <Text style={styles.fixCartText}>Return to Bag & Fix</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Validation Warnings */}
            {validationReport && validationReport.warnings && validationReport.warnings.length > 0 && (
              <View style={styles.warningBanner}>
                <Text style={[styles.bannerTitle, { color: "#b45309" }]}>Important Cart Updates</Text>
                {validationReport.warnings.map((warn: any, idx: number) => (
                  <Text key={idx} style={[styles.bannerMessage, { color: "#b45309" }]}>• {warn.message}</Text>
                ))}
              </View>
            )}
          </>
        )}

        {/* Shipping Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <MapPin size={20} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
          </View>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor={colors.subtext}
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={styles.input}
              placeholder="Address Line 1 *"
              placeholderTextColor={colors.subtext}
              value={address1}
              onChangeText={setAddress1}
            />
            <TextInput
              style={styles.input}
              placeholder="Address Line 2 (optional)"
              placeholderTextColor={colors.subtext}
              value={address2}
              onChangeText={setAddress2}
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="City *"
                placeholderTextColor={colors.subtext}
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="State"
                placeholderTextColor={colors.subtext}
                value={state}
                onChangeText={setState}
              />
            </View>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Postal Code *"
                placeholderTextColor={colors.subtext}
                keyboardType="numeric"
                value={postal}
                onChangeText={setPostal}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Country"
                placeholderTextColor={colors.subtext}
                value={country}
                onChangeText={setCountry}
              />
            </View>
          </View>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: "#7c3aed" }]}>
              <CreditCard size={20} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          {/* Toggle Tabs */}
          <View style={styles.paymentTabs}>
            <TouchableOpacity
              style={[
                styles.paymentTab,
                paymentMethod === "Card" && styles.paymentTabActive,
              ]}
              onPress={() => setPaymentMethod("Card")}
              activeOpacity={0.8}
            >
              <CreditCard
                size={18}
                color={paymentMethod === "Card" ? "#fff" : colors.subtext}
              />
              <Text
                style={[
                  styles.paymentTabText,
                  paymentMethod === "Card" && styles.paymentTabTextActive,
                ]}
              >
                Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentTab,
                paymentMethod === "UPI" && styles.paymentTabActive,
              ]}
              onPress={() => setPaymentMethod("UPI")}
              activeOpacity={0.8}
            >
              <Smartphone
                size={18}
                color={paymentMethod === "UPI" ? "#fff" : colors.subtext}
              />
              <Text
                style={[
                  styles.paymentTabText,
                  paymentMethod === "UPI" && styles.paymentTabTextActive,
                ]}
              >
                UPI
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card Details */}
          {paymentMethod === "Card" && (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Card Number"
                placeholderTextColor={colors.subtext}
                keyboardType="numeric"
                maxLength={19}
                value={cardNumber}
                onChangeText={(v) => {
                  const digits = v.replace(/\D/g, "").slice(0, 16);
                  setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
                }}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="MM / YY"
                  placeholderTextColor={colors.subtext}
                  maxLength={5}
                  value={expiry}
                  onChangeText={(v) => {
                    const digits = v.replace(/\D/g, "").slice(0, 4);
                    setExpiry(digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits);
                  }}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="CVV"
                  placeholderTextColor={colors.subtext}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={4}
                  value={cvv}
                  onChangeText={setCvv}
                />
              </View>
            </View>
          )}

          {/* UPI Details */}
          {paymentMethod === "UPI" && (
            <View style={styles.form}>
              <View style={styles.upiBox}>
                <Text style={styles.upiLabel}>Supported UPI Apps</Text>
                <View style={styles.upiAppsRow}>
                  {["GPay", "PhonePe", "Paytm", "BHIM", "Amazon Pay"].map((app) => (
                    <View key={app} style={styles.upiAppChip}>
                      <Text style={styles.upiAppText}>{app}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter UPI ID (e.g. name@upi) *"
                placeholderTextColor={colors.subtext}
                autoCapitalize="none"
                keyboardType="email-address"
                value={upiId}
                onChangeText={setUpiId}
              />
              <View style={styles.upiInfoBox}>
                <Text style={styles.upiInfoText}>
                  💡 You will receive a payment request on your UPI app after placing the order.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: "#059669" }]}>
              <Truck size={20} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {bagTotal === null ? "Loading..." : `₹${bagTotal}`}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={[styles.summaryValue, { color: "#22c55e", fontWeight: "700" }]}>
                FREE
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment via</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {paymentMethod === "UPI" ? `UPI • ${upiId || "—"}` : "Debit / Credit Card"}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {bagTotal === null ? "—" : `₹${bagTotal}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Error message */}
        {orderError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {orderError}</Text>
          </View>
        ) : null}

        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && { opacity: 0.7 }]}
          onPress={handleplaceorder}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.placeOrderButtonText}>
              PLACE ORDER · {bagTotal === null ? "" : `₹${bagTotal}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      padding: 15,
      paddingTop: 50,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 26, fontWeight: "900", color: colors.text, letterSpacing: 0.5 },
    content: { flex: 1, padding: 15 },
    section: {
      marginBottom: 20,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    sectionIconBg: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
    form: { gap: 10 },
    input: {
      backgroundColor: colors.inputBackground,
      padding: 14,
      borderRadius: 12,
      fontSize: 15,
      marginBottom: 8,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: { flexDirection: "row", justifyContent: "space-between" },
    halfInput: { width: "48%" },
    // Payment tabs
    paymentTabs: {
      flexDirection: "row",
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    paymentTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 10,
      gap: 6,
    },
    paymentTabActive: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 4,
    },
    paymentTabText: { fontSize: 14, fontWeight: "700", color: colors.subtext },
    paymentTabTextActive: { color: "#fff" },
    // UPI
    upiBox: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    upiLabel: { fontSize: 12, color: colors.subtext, fontWeight: "600", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
    upiAppsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    upiAppChip: {
      backgroundColor: `${colors.primary}22`,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: `${colors.primary}44`,
    },
    upiAppText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
    upiInfoBox: {
      backgroundColor: "rgba(34,197,94,0.08)",
      borderRadius: 10,
      padding: 12,
      borderLeftWidth: 3,
      borderLeftColor: "#22c55e",
    },
    upiInfoText: { color: "#22c55e", fontSize: 12, fontWeight: "600", lineHeight: 18 },
    // Summary
    summary: { gap: 10 },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    summaryLabel: { fontSize: 15, color: colors.subtext },
    summaryValue: { fontSize: 15, color: colors.text, fontWeight: "600" },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
      paddingTop: 12,
    },
    totalLabel: { fontSize: 18, fontWeight: "900", color: colors.text },
    totalValue: { fontSize: 18, fontWeight: "900", color: colors.primary },
    errorBox: {
      backgroundColor: "rgba(255,77,109,0.10)",
      borderLeftWidth: 3,
      borderLeftColor: "#ff4d6d",
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
    errorText: { color: "#ff4d6d", fontSize: 13, fontWeight: "700" },
    errorBanner: {
      backgroundColor: "rgba(239, 68, 68, 0.08)",
      borderColor: "rgba(239, 68, 68, 0.2)",
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderLeftColor: "#ef4444",
    },
    warningBanner: {
      backgroundColor: "rgba(245, 158, 11, 0.08)",
      borderColor: "rgba(245, 158, 11, 0.2)",
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderLeftColor: "#f59e0b",
    },
    bannerTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: "#ef4444",
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    bannerMessage: {
      fontSize: 12,
      color: "#b91c1c",
      lineHeight: 18,
      fontWeight: "600",
    },
    fixCartBtn: {
      backgroundColor: "#ef4444",
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignSelf: "flex-start",
      marginTop: 10,
    },
    fixCartText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },
    footer: {
      padding: 16,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    placeOrderButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 14,
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },
    placeOrderButtonText: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 0.5 },
  });
