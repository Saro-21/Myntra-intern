import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import API_URL from "@/constants/Api";
import { useRouter } from "expo-router";
import { CreditCard, MapPin, Truck } from "lucide-react-native";
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

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [bagTotal, setBagTotal] = useState<number | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  // Form state — shipping
  const [fullName, setFullName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("India");

  // Fetch actual bag total on mount
  useEffect(() => {
    if (!user) return;
    axios
      .get(`${API_URL}/bag?userId=${user._id}`)
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          const t = data.reduce(
            (sum: number, item: any) =>
              sum + (item.productId?.price || 0) * (item.quantity || 1),
            0
          );
          setBagTotal(t);
        } else {
          setBagTotal(data.total || 0);
        }
      })
      .catch(() => setBagTotal(0));
  }, [user]);

  const handleplaceorder = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!fullName.trim() || !address1.trim() || !city.trim() || !postal.trim()) {
      setOrderError("Please fill in all required shipping fields.");
      return;
    }
    const shippingAddress = `${fullName.trim()}, ${address1.trim()}${address2 ? ", " + address2.trim() : ""}, ${city.trim()}, ${state.trim()} ${postal.trim()}, ${country.trim()}`;
    try {
      setLoading(true);
      setOrderError("");
      await axios.post(`${API_URL}/order?action=create&userId=${user._id}`, {
        shippingAddress,
        paymentMethod: "Card",
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
      <ScrollView style={styles.content}>
        {/* Shipping Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={24} color={colors.primary} />
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

        {/* Payment Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Card Number"
              placeholderTextColor={colors.subtext}
              keyboardType="numeric"
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Expiry Date"
                placeholderTextColor={colors.subtext}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="CVV"
                placeholderTextColor={colors.subtext}
                keyboardType="numeric"
                secureTextEntry
              />
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Truck size={24} color={colors.primary} />
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
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={[styles.summaryValue, { color: "#2ecc71" }]}>FREE</Text>
            </View>
            <View style={[styles.summaryRow, styles.total]}>
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

        <View style={{ height: 8 }} />
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
            <Text style={styles.placeOrderButtonText}>PLACE ORDER</Text>
          )}
        </TouchableOpacity>
      </View>
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
      padding: 15,
    },
    section: {
      marginBottom: 20,
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 15,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginLeft: 10,
    },
    form: {
      gap: 10,
    },
    input: {
      backgroundColor: colors.inputBackground,
      padding: 15,
      borderRadius: 10,
      fontSize: 16,
      marginBottom: 10,
      color: colors.text,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    halfInput: {
      width: "48%",
    },
    summary: {
      gap: 10,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 5,
    },
    summaryLabel: {
      fontSize: 16,
      color: colors.subtext,
    },
    summaryValue: {
      fontSize: 16,
      color: colors.text,
    },
    total: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 10,
      paddingTop: 10,
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.primary,
    },
    errorBox: {
      backgroundColor: "rgba(255, 77, 109, 0.12)",
      borderLeftWidth: 3,
      borderLeftColor: "#ff4d6d",
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    errorText: {
      color: "#ff4d6d",
      fontSize: 13,
      fontWeight: "600",
    },
    footer: {
      padding: 15,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    placeOrderButton: {
      backgroundColor: colors.primary,
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
    },
    placeOrderButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
  });
