import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { Bell, X } from "lucide-react-native";

type NotificationToastProps = {
  title: string;
  body: string;
  visible: boolean;
  onDismiss: () => void;
};

export default function NotificationToast({
  title,
  body,
  visible,
  onDismiss,
}: NotificationToastProps) {
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide Down & Fade In
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: Platform.OS === "web" ? 20 : 50,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(-150);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.glassBackground} />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Bell size={20} color="#ff3f6c" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {body}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <X size={18} color="#888" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const { width } = Dimensions.get("window");
const toastWidth = Platform.OS === "web" ? Math.min(width - 40, 420) : width - 30;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    width: toastWidth,
    zIndex: 9999,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 63, 108, 0.2)",
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === "web" ? "rgba(255, 255, 255, 0.9)" : "#fff",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingRight: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 63, 108, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#282c3f",
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    color: "#696e79",
    lineHeight: 16,
  },
  closeButton: {
    padding: 6,
  },
});
