import * as NativeSecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Web compatibility fallback wrapper
const SecureStore = Platform.OS === "web" ? {
  setItemAsync: async (key: string, val: string) => { localStorage.setItem(key, val); },
  getItemAsync: async (key: string) => localStorage.getItem(key),
  deleteItemAsync: async (key: string) => { localStorage.removeItem(key); },
} : NativeSecureStore;

/*
Original imported module (fails on Web platform):
import * as SecureStore from "expo-secure-store";
*/

export const saveUserData = async (
  _id: string,
  name: string,
  email: string
) => {
  await SecureStore.setItemAsync("userid", _id);
  await SecureStore.setItemAsync("userName", name);
  await SecureStore.setItemAsync("userEmail", email);
};

export const getUserData = async () => {
  const _id = await SecureStore.getItemAsync("userid");
  const name = await SecureStore.getItemAsync("userName");
  const email = await SecureStore.getItemAsync("userEmail");
  return { _id, name, email };
};

export const clearUserData = async () => {
  await SecureStore.deleteItemAsync("userid");
  await SecureStore.deleteItemAsync("userName");
  await SecureStore.deleteItemAsync("userEmail");
};
