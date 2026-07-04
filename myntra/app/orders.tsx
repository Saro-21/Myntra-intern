import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Package,
  ChevronRight,
  MapPin,
  Truck,
  Clock,
  Calendar,
  CreditCard,
} from "lucide-react-native";
import React from "react";
import axios from "axios";
import API_URL from "@/constants/Api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function Orders() {
  const router = useRouter();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [orders, setorder] = useState<any>(null);
  const { theme, colors } = useTheme();

  const styles = getStyles(colors);

  useEffect(() => {
    const fetchproduct = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const res = await axios.get(`${API_URL}/order?userId=${user._id}`);
          setorder(res.data);
        } catch (error) {
          console.log(error);
          setIsLoading(false);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchproduct();
  }, [user]);

  const toggleOrderDetails = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <View style={styles.centerContainer}>
          <Package size={64} color={colors.subtext} />
          <Text style={styles.emptyText}>You haven't placed any orders yet</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.shopButtonText}>START SHOPPING</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <ScrollView style={styles.content}>
        {orders.map((order: any) => (
          <View key={order._id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderId}>Order #{order._id.slice(-8).toUpperCase()}</Text>
                <Text style={styles.orderDate}>Placed on {order.date}</Text>
              </View>
              <View style={[styles.statusContainer, { backgroundColor: theme === 'dark' ? '#182b20' : '#e6f4ea' }]}>
                <Package size={16} color={colors.success} />
                <Text style={styles.orderStatus}>{order.status}</Text>
              </View>
            </View>

            <View style={styles.itemsContainer}>
              {order.items.map((item: any, idx: number) => (
                <View key={idx} style={styles.orderItem}>
                  <Image
                    source={{ uri: item.productId?.images[0] }}
                    style={styles.itemImage}
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.brandName}>{item.productId?.brand}</Text>
                    <Text style={styles.itemName}>{item.productId?.name}</Text>
                    <Text style={styles.itemSize}>Size: {item.size}</Text>
                    <Text style={styles.itemPrice}>
                      {item.quantity} x ₹{item.price}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {expandedOrder === order._id && (
              <View style={styles.orderDetails}>
                <View style={styles.detailSection}>
                  <View style={styles.detailHeader}>
                    <MapPin size={20} color={colors.text} />
                    <Text style={styles.detailTitle}>Shipping Address</Text>
                  </View>
                  <Text style={styles.detailText}>{order.shippingAddress}</Text>
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.detailHeader}>
                    <CreditCard size={20} color={colors.text} />
                    <Text style={styles.detailTitle}>Payment Method</Text>
                  </View>
                  <Text style={styles.detailText}>{order.paymentMethod}</Text>
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.detailHeader}>
                    <Truck size={20} color={colors.text} />
                    <Text style={styles.detailTitle}>Tracking Information</Text>
                  </View>
                  {order.tracking ? (
                    <View style={styles.trackingInfo}>
                      <Text style={styles.trackingNumber}>
                        Tracking Number: {order.tracking.number}
                      </Text>
                      <Text style={styles.trackingCarrier}>
                        Carrier: {order.tracking.carrier}
                      </Text>
                      <View style={styles.timeline}>
                        {order.tracking.timeline.map((event: any, index: number) => (
                          <View key={index} style={styles.timelineEvent}>
                            <View style={styles.timelinePoint} />
                            <View style={styles.timelineContent}>
                              <Text style={styles.timelineStatus}>
                                {event.status}
                              </Text>
                              <Text style={styles.timelineLocation}>
                                {event.location}
                              </Text>
                              <Text style={styles.timelineTimestamp}>
                                {event.timestamp}
                              </Text>
                            </View>
                            {index !== order.tracking.timeline.length - 1 && (
                              <View style={styles.timelineLine} />
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.detailText}>Tracking information is not available yet.</Text>
                  )}
                </View>
              </View>
            )}

            <View style={styles.orderFooter}>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Order Total</Text>
                <Text style={styles.totalAmount}>₹{order.total}</Text>
              </View>
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => toggleOrderDetails(order._id)}
              >
                <Text style={styles.detailsButtonText}>
                  {expandedOrder === order._id ? "Hide Details" : "View Details"}
                </Text>
                <ChevronRight size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    emptyText: {
      fontSize: 16,
      color: colors.text,
      marginTop: 20,
      marginBottom: 20,
    },
    shopButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 40,
      paddingVertical: 15,
      borderRadius: 10,
    },
    shopButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
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
    orderCard: {
      backgroundColor: colors.card,
      borderRadius: 10,
      marginBottom: 15,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      overflow: "hidden",
    },
    orderHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    orderId: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    orderDate: {
      fontSize: 14,
      color: colors.subtext,
      marginTop: 2,
    },
    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 15,
    },
    orderStatus: {
      fontSize: 14,
      color: colors.success,
      marginLeft: 5,
      fontWeight: "600",
    },
    itemsContainer: {
      padding: 15,
    },
    orderItem: {
      flexDirection: "row",
      marginBottom: 15,
    },
    itemImage: {
      width: 80,
      height: 100,
      borderRadius: 5,
    },
    itemInfo: {
      flex: 1,
      marginLeft: 15,
    },
    brandName: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 2,
    },
    itemName: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 2,
    },
    itemSize: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 2,
    },
    itemPrice: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    orderDetails: {
      padding: 15,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    detailSection: {
      marginBottom: 20,
    },
    detailHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    detailTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginLeft: 10,
    },
    detailText: {
      fontSize: 14,
      color: colors.subtext,
      lineHeight: 20,
    },
    trackingInfo: {
      marginBottom: 15,
    },
    trackingNumber: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 5,
    },
    trackingCarrier: {
      fontSize: 14,
      color: colors.subtext,
    },
    timeline: {
      marginTop: 15,
    },
    timelineEvent: {
      flexDirection: "row",
      marginBottom: 20,
      position: "relative",
    },
    timelinePoint: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
      marginTop: 5,
      zIndex: 1,
    },
    timelineLine: {
      position: "absolute",
      left: 5,
      top: 17,
      width: 2,
      height: "100%",
      backgroundColor: colors.border,
    },
    timelineContent: {
      marginLeft: 15,
      flex: 1,
    },
    timelineStatus: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 2,
    },
    timelineLocation: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 2,
    },
    timelineTimestamp: {
      fontSize: 12,
      color: colors.subtext,
    },
    orderFooter: {
      padding: 15,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    totalLabel: {
      fontSize: 16,
      color: colors.subtext,
    },
    totalAmount: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    detailsButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
    },
    detailsButtonText: {
      fontSize: 16,
      color: colors.primary,
      marginRight: 5,
      fontWeight: "600",
    },
  });
