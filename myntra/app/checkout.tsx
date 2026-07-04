import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import API_URL from "@/constants/Api";
import { useRouter } from "expo-router";
import { CreditCard, MapPin, Truck } from "lucide-react-native";
import React from "react";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const styles = getStyles(colors);

  const handleplaceorder = async() => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      await axios.post(`${API_URL}/order?action=create&userId=${user._id}`, {
        shippingAddress: "123 Main Street, Apt 4B, New York, NY, 10001",
        paymentMethod: "Card",
      });
      router.push("/orders");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Shipping Address</Text>
          </View>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={colors.subtext}
              defaultValue="John Doe"
            />
            <TextInput
              style={styles.input}
              placeholder="Address Line 1"
              placeholderTextColor={colors.subtext}
              defaultValue="123 Main Street"
            />
            <TextInput
              style={styles.input}
              placeholder="Address Line 2"
              placeholderTextColor={colors.subtext}
              defaultValue="Apt 4B"
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="City"
                placeholderTextColor={colors.subtext}
                defaultValue="New York"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="State"
                placeholderTextColor={colors.subtext}
                defaultValue="NY"
              />
            </View>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Postal Code"
                placeholderTextColor={colors.subtext}
                defaultValue="10001"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Country"
                placeholderTextColor={colors.subtext}
                defaultValue="United States"
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
              defaultValue="**** **** **** 4242"
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Expiry Date"
                placeholderTextColor={colors.subtext}
                defaultValue="12/25"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="CVV"
                placeholderTextColor={colors.subtext}
                defaultValue="***"
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
              <Text style={styles.summaryValue}>₹3,798</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>₹99</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>₹190</Text>
            </View>
            <View style={[styles.summaryRow, styles.total]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹4,087</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={handleplaceorder}
        >
          <Text style={styles.placeOrderButtonText}>PLACE ORDER</Text>
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
      shadowOffset: {
        width: 0,
        height: 2,
      },
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

