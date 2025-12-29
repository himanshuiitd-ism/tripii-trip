import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  chatbotLoadHistory,
  chatbotHandleUserMessage,
  addUserMessage,
} from "../../redux/chatbotSlice.js";
import InputArea from "./components/InputArea.jsx";
import InitialPage from "./components/InitialPage.jsx";
import ChatInterface from "./components/ChatInterface.jsx";
import styles from "./Chatbot.module.css";

function Chatbot() {
  const dispatch = useDispatch();
  const { messages, isLoading } = useSelector((state) => state.chatbot);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    dispatch(chatbotLoadHistory());
  }, [dispatch]);

  const sendMessage = () => {
    if (!inputValue.trim() || isLoading) return;

    const messageId = Date.now();

    // ✅ 1. Optimistic user message (IMMEDIATE UI)
    dispatch(
      addUserMessage({
        messageId,
        sender: "user",
        text: inputValue,
      })
    );

    // ✅ 2. Clear input instantly
    setInputValue("");

    // ✅ 3. Ask AI (AI message will arrive later)
    dispatch(chatbotHandleUserMessage(inputValue));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.scrollArea}>
        {messages.length === 0 ? (
          <InitialPage />
        ) : (
          <ChatInterface messages={messages} isLoading={isLoading} />
        )}
      </div>

      <div className={styles.inputContainer}>
        <InputArea
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSend={sendMessage}
          isLoading={isLoading}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
}

export default Chatbot;
