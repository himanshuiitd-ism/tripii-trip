import { fetchChatHistory, sendPrompt, updateChatMessage } from "@/api/chatbot";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

/* ---------------- LOAD HISTORY ---------------- */
export const chatbotLoadHistory = createAsyncThunk("chat/load", async () => {
  const res = await fetchChatHistory();
  return res.data; // full history from DB
});

/* ---------------- SEND PROMPT ---------------- */
export const chatbotHandleUserMessage = createAsyncThunk(
  "chat/send",
  async (prompt) => {
    const res = await sendPrompt(prompt);
    return res.data; // ✅ ONLY AI message
  }
);

/* ---------------- EDIT AI MESSAGE ---------------- */
export const chatbotEditMessage = createAsyncThunk(
  "chat/edit",
  async ({ messageId, text }) => {
    await updateChatMessage(messageId, text);
    return { messageId, text };
  }
);

const chatbotSlice = createSlice({
  name: "chatbot",
  initialState: {
    messages: [],
    isLoading: false,
    error: null,
  },

  reducers: {
    /* ✅ Optimistic user message */
    addUserMessage: (state, action) => {
      state.messages.push(action.payload);
    },
  },

  extraReducers: (builder) => {
    builder

      /* LOAD */
      .addCase(chatbotLoadHistory.fulfilled, (state, action) => {
        state.messages = action.payload;
      })

      /* SEND */
      .addCase(chatbotHandleUserMessage.pending, (state) => {
        state.isLoading = true;
      })

      .addCase(chatbotHandleUserMessage.fulfilled, (state, action) => {
        state.isLoading = false;

        // ✅ push ONLY AI message
        state.messages.push(action.payload);
      })

      .addCase(chatbotHandleUserMessage.rejected, (state) => {
        state.isLoading = false;
        state.error = "Failed to get AI response";
      })

      /* EDIT */
      .addCase(chatbotEditMessage.fulfilled, (state, action) => {
        const { messageId, text } = action.payload;
        const msg = state.messages.find((m) => m.messageId === messageId);
        if (msg) {
          msg.text = text;
          msg.edited = true;
        }
      });
  },
});

export const { addUserMessage } = chatbotSlice.actions;
export default chatbotSlice.reducer;
