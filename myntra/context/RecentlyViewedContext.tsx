import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import * as NativeSecureStore from "expo-secure-store";
import { Platform } from "react-native";
import axios from "axios";
import API_URL from "@/constants/Api";

// Web compatibility fallback wrapper
const SecureStore = Platform.OS === "web" ? {
  setItemAsync: async (key: string, val: string) => { localStorage.setItem(key, val); },
  getItemAsync: async (key: string) => localStorage.getItem(key),
  deleteItemAsync: async (key: string) => { localStorage.removeItem(key); },
} : NativeSecureStore;

export interface RecentlyViewedItem {
  productId: string;
  viewedAt: string; // ISO String
  name: string;
  brand: string;
  price: number;
  discount: string;
  images: string[];
}

type RecentlyViewedContextType = {
  recentlyViewed: RecentlyViewedItem[];
  addToRecentlyViewed: (product: any) => Promise<void>;
  clearHistory: () => Promise<void>;
  loadHistory: () => Promise<void>;
  isLoading: boolean;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export const RecentlyViewedProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load history on mount or when user changes
  useEffect(() => {
    loadHistory();
  }, [user, isAuthenticated]);

  const getStorageKey = () => {
    return user ? `recently_viewed_${user._id}` : "recently_viewed_anonymous";
  };

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const key = getStorageKey();
      const cached = await SecureStore.getItemAsync(key);
      let localItems: RecentlyViewedItem[] = cached ? JSON.parse(cached) : [];

      if (user) {
        // If logged in, also sync/fetch from server to merge and keep consistent
        // We'll read the anonymous cache first if it exists, to perform a final check of any leftover anonymous views
        const anonCached = await SecureStore.getItemAsync("recently_viewed_anonymous");
        const anonItems: RecentlyViewedItem[] = anonCached ? JSON.parse(anonCached) : [];

        // If there's anonymous items or we just want to fetch/sync from database
        const itemsToSync = [...anonItems, ...localItems];
        
        // Format for server sync request
        const syncPayload = itemsToSync.map(item => ({
          productId: item.productId,
          viewedAt: item.viewedAt,
        }));

        try {
          const res = await axios.post(`${API_URL}/recently-viewed?action=sync`, {
            userId: user._id,
            localHistory: syncPayload,
          });

          // Server returns populated views
          const serverViews = res.data;
          const mappedViews = serverViews.map((v: any) => {
            if (!v.productId) return null;
            return {
              productId: v.productId._id,
              viewedAt: v.viewedAt,
              name: v.productId.name || "",
              brand: v.productId.brand || "",
              price: v.productId.price || 0,
              discount: v.productId.discount || "",
              images: v.productId.images || [],
            };
          }).filter(Boolean);

          setRecentlyViewed(mappedViews);
          await SecureStore.setItemAsync(key, JSON.stringify(mappedViews));

          // Clear anonymous views since they are now synced
          if (anonItems.length > 0) {
            await SecureStore.deleteItemAsync("recently_viewed_anonymous");
          }
        } catch (serverErr) {
          console.error("Failed to sync recently viewed with server:", serverErr);
          // Fallback to local user items on network error
          setRecentlyViewed(localItems);
        }
      } else {
        // If anonymous, just set localItems
        setRecentlyViewed(localItems);
      }
    } catch (error) {
      console.error("Error loading recently viewed history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToRecentlyViewed = async (product: any) => {
    if (!product || !product._id) return;

    try {
      const newItem: RecentlyViewedItem = {
        productId: product._id,
        viewedAt: new Date().toISOString(),
        name: product.name || "",
        brand: product.brand || "",
        price: product.price || 0,
        discount: product.discount || "",
        images: product.images || [],
      };

      // 1. Update client state first (optimistic update & local cache)
      setRecentlyViewed(prev => {
        // Remove duplicate of the product if it exists
        const filtered = prev.filter(item => item.productId !== product._id);
        // Put the new item at the top (index 0) and limit to 20
        const updated = [newItem, ...filtered].slice(0, 20);

        // Save updated list to SecureStore async
        const key = getStorageKey();
        SecureStore.setItemAsync(key, JSON.stringify(updated)).catch(e => 
          console.error("Error saving updated recently viewed to storage:", e)
        );

        return updated;
      });

      // 2. If logged in, send product view to backend
      if (user) {
        axios.post(`${API_URL}/recently-viewed`, {
          userId: user._id,
          productId: product._id,
        }).catch(err => {
          console.error("Failed to save view to server:", err);
        });
      }
    } catch (error) {
      console.error("Error adding to recently viewed:", error);
    }
  };

  const clearHistory = async () => {
    try {
      const key = getStorageKey();
      await SecureStore.deleteItemAsync(key);
      setRecentlyViewed([]);

      if (user) {
        // If logged in, tell backend to clear too
        axios.delete(`${API_URL}/recently-viewed?userId=${user._id}`).catch(err => {
          console.error("Failed to delete user history from server:", err);
        });
      }
    } catch (error) {
      console.error("Error clearing recently viewed history:", error);
    }
  };

  return (
    <RecentlyViewedContext.Provider
      value={{ recentlyViewed, addToRecentlyViewed, clearHistory, loadHistory, isLoading }}
    >
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext);
  if (context === undefined) {
    throw new Error("useRecentlyViewed must be used within a RecentlyViewedProvider");
  }
  return context;
};
