// src/features/tripGallery/usePhotoDownload.native.js
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { downloadTripPhoto } from "@/api/trip";

export const usePhotoDownload = () => {
  const downloadPhoto = async (photoId) => {
    // 🔐 Ask permission
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Media permission not granted");
    }

    // ✅ Call API layer (NOT axios directly)
    const res = await downloadTripPhoto(photoId);
    const url = res.data.downloadUrl;

    // 📁 Temp file
    const fileUri =
      FileSystem.documentDirectory + `tripiitrip-photo-${Date.now()}.jpg`;

    // ⬇️ Download
    await FileSystem.downloadAsync(url, fileUri);

    // 💾 Save to gallery
    await MediaLibrary.saveToLibraryAsync(fileUri);
  };

  return { downloadPhoto };
};
