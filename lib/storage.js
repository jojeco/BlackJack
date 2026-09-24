import AsyncStorage from "@react-native-async-storage/async-storage";
import { serializeSave, parseSave } from "./blackjack.js";

const SAVE_KEY = "blackjack.save.v1";

export async function loadSave() {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    return parseSave(raw);
  } catch (err) {
    return parseSave(null);
  }
}

export async function writeSave(data) {
  try {
    await AsyncStorage.setItem(SAVE_KEY, serializeSave(data));
  } catch (err) {
    console.warn("Failed to save game state:", err);
  }
}
