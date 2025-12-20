// hooks/useSendRoomMessage.js
import { useState } from "react";
import { sendRoomMessage } from "@/api/room";

export default function useSendRoomMessage(roomId) {
  const [sending, setSending] = useState(false);

  const send = async ({ text, file, gifUrl }) => {
    const safeText = typeof text === "string" ? text.trim() : "";

    // 🚫 nothing to send
    if (!safeText && !file && !gifUrl) return;

    const formData = new FormData();

    // ✅ allow text + image + gif together
    if (safeText) formData.append("content", safeText);
    if (file) formData.append("media", file);
    if (gifUrl) formData.append("gifUrl", gifUrl);

    try {
      setSending(true);
      await sendRoomMessage(roomId, formData);
    } finally {
      setSending(false);
    }
  };

  return { send, sending };
}
