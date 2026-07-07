import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { MapPin, Plus, Trash2, Edit2, ChevronLeft, Check } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Address {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
}

export default function Addresses() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, colors } = useTheme();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");

  const styles = getStyles(theme, colors);

  useEffect(() => {
    loadAddresses();
  }, [user]);

  const loadAddresses = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(`addresses_${user._id}`);
      if (stored) {
        setAddresses(JSON.parse(stored));
      } else {
        // Mock initial address
        const initial: Address[] = [
          {
            id: "addr_1",
            name: user.name || "Sarabhoji M",
            phone: "9876543210",
            addressLine1: "12, Kasturba Gandhi Marg",
            addressLine2: "Connaught Place",
            city: "New Delhi",
            state: "Delhi",
            pinCode: "110001",
            isDefault: true,
          },
        ];
        await AsyncStorage.setItem(`addresses_${user._id}`, JSON.stringify(initial));
        setAddresses(initial);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!name.trim() || !phone.trim() || !addressLine1.trim() || !city.trim() || !state.trim() || !pinCode.trim()) {
      Alert.alert("Error", "Please fill in all required fields marked with *");
      return;
    }

    try {
      let updated: Address[] = [];
      if (editingAddress) {
        updated = addresses.map((addr) =>
          addr.id === editingAddress.id
            ? {
                ...addr,
                name,
                phone,
                addressLine1,
                addressLine2,
                city,
                state,
                pinCode,
              }
            : addr
        );
      } else {
        const newAddr: Address = {
          id: "addr_" + Date.now(),
          name,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          pinCode,
          isDefault: addresses.length === 0, // Default if first address
        };
        updated = [...addresses, newAddr];
      }

      await AsyncStorage.setItem(`addresses_${user._id}`, JSON.stringify(updated));
      setAddresses(updated);
      closeForm();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    Alert.alert("Delete Address", "Are you sure you want to delete this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const updated = addresses.filter((addr) => addr.id !== id);
            // If we deleted the default, set first one as default if any remain
            if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
              updated[0].isDefault = true;
            }
            await AsyncStorage.setItem(`addresses_${user._id}`, JSON.stringify(updated));
            setAddresses(updated);
          } catch (err) {
            console.log(err);
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    try {
      const updated = addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }));
      await AsyncStorage.setItem(`addresses_${user._id}`, JSON.stringify(updated));
      setAddresses(updated);
    } catch (err) {
      console.log(err);
    }
  };

  const openEdit = (addr: Address) => {
    setEditingAddress(addr);
    setName(addr.name);
    setPhone(addr.phone);
    setAddressLine1(addr.addressLine1);
    setAddressLine2(addr.addressLine2 || "");
    setCity(addr.city);
    setState(addr.state);
    setPinCode(addr.pinCode);
    setModalVisible(true);
  };

  const closeForm = () => {
    setEditingAddress(null);
    setName("");
    setPhone("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setState("");
    setPinCode("");
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Saved Addresses</Text>
          <Text style={styles.headerSubtitle}>Manage your delivery locations</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 100 }}>
          {addresses.map((addr) => (
            <View key={addr.id} style={[styles.addressCard, addr.isDefault && styles.defaultCard]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <MapPin size={18} color={colors.primary} />
                  <Text style={styles.nameText}>{addr.name}</Text>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(addr)}>
                    <Edit2 size={16} color={colors.subtext} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteAddress(addr.id)}>
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.addressText}>
                {addr.addressLine1}
                {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
              </Text>
              <Text style={styles.addressText}>
                {addr.city}, {addr.state} - {addr.pinCode}
              </Text>
              <Text style={styles.phoneText}>📞 Mobile: {addr.phone}</Text>

              {!addr.isDefault && (
                <TouchableOpacity style={styles.setDefaultBtn} onPress={() => handleSetDefault(addr.id)}>
                  <Check size={14} color={colors.primary} />
                  <Text style={styles.setDefaultText}>Set as Default Address</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {addresses.length === 0 && (
            <View style={styles.emptyView}>
              <MapPin size={48} color={colors.subtext} />
              <Text style={styles.emptyTitle}>No Addresses Found</Text>
              <Text style={styles.emptySubtitle}>Add a delivery address to get started.</Text>
            </View>
          )}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.addButton} activeOpacity={0.9} onPress={() => setModalVisible(true)}>
        <Plus size={20} color="#fff" />
        <Text style={styles.addButtonText}>ADD NEW ADDRESS</Text>
      </TouchableOpacity>

      {/* Address Form Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={closeForm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingAddress ? "Edit Address" : "Add Address"}</Text>
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor={colors.subtext}
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Mobile Number *"
                placeholderTextColor={colors.subtext}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <TextInput
                style={styles.input}
                placeholder="Address Line 1 (House No, Building) *"
                placeholderTextColor={colors.subtext}
                value={addressLine1}
                onChangeText={setAddressLine1}
              />
              <TextInput
                style={styles.input}
                placeholder="Address Line 2 (Locality, Area)"
                placeholderTextColor={colors.subtext}
                value={addressLine2}
                onChangeText={setAddressLine2}
              />
              <TextInput
                style={styles.input}
                placeholder="City *"
                placeholderTextColor={colors.subtext}
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={styles.input}
                placeholder="State *"
                placeholderTextColor={colors.subtext}
                value={state}
                onChangeText={setState}
              />
              <TextInput
                style={styles.input}
                placeholder="Pin Code *"
                placeholderTextColor={colors.subtext}
                keyboardType="numeric"
                value={pinCode}
                onChangeText={setPinCode}
              />

              <View style={styles.modalBtns}>
                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={closeForm}>
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSaveAddress}>
                  <Text style={styles.saveBtnText}>SAVE ADDRESS</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme: string, colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === "dark" ? colors.background : "#f8fafc",
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 52,
      paddingBottom: 16,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },
    headerTextWrap: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.subtext,
      marginTop: 2,
    },
    contentScroll: {
      flex: 1,
      padding: 16,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    addressCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    defaultCard: {
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    cardHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    nameText: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.text,
    },
    defaultBadge: {
      backgroundColor: "#fdf2f8",
      borderColor: "#fbcfe8",
      borderWidth: 0.5,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    defaultBadgeText: {
      fontSize: 9,
      color: "#db2777",
      fontWeight: "800",
    },
    cardActions: {
      flexDirection: "row",
      gap: 12,
    },
    actionBtn: {
      padding: 4,
    },
    addressText: {
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
      marginBottom: 4,
    },
    phoneText: {
      fontSize: 13,
      color: colors.subtext,
      marginTop: 6,
      fontWeight: "500",
    },
    setDefaultBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 14,
      paddingTop: 12,
    },
    setDefaultText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "700",
    },
    addButton: {
      position: "absolute",
      bottom: 24,
      left: 16,
      right: 16,
      backgroundColor: colors.primary,
      height: 52,
      borderRadius: 14,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
    addButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    emptyView: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 80,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      marginTop: 10,
    },
    emptySubtitle: {
      fontSize: 12,
      color: colors.subtext,
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: "85%",
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 16,
      textAlign: "center",
    },
    formScroll: {
      gap: 12,
    },
    input: {
      backgroundColor: theme === "dark" ? colors.inputBackground : "#f1f5f9",
      padding: 14,
      borderRadius: 12,
      fontSize: 14,
      marginBottom: 12,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalBtns: {
      flexDirection: "row",
      gap: 12,
      marginTop: 10,
      marginBottom: 20,
    },
    modalBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    cancelBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: "transparent",
    },
    cancelBtnText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "800",
    },
    saveBtn: {
      backgroundColor: colors.primary,
    },
    saveBtnText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "800",
    },
  });
