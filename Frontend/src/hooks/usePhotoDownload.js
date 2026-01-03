import { downloadTripPhoto } from "@/api/trip";

export const usePhotoDownload = () => {
  const downloadPhoto = async (photoId) => {
    const res = await downloadTripPhoto(photoId);
    const url = res.data.data.downloadUrl;

    const response = await fetch(url);
    const blob = await response.blob();

    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `tripiitrip-photo-${photoId}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(objectUrl);
  };

  return { downloadPhoto };
};
