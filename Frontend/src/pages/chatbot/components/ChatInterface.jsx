import styles from "./ChatInterface.module.css";
import ReactMarkdown from "react-markdown";
import { useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { SUNDAY_ICONS } from "./SundayIcons";

function ChatInterface({ messages, isLoading }) {
  const bottomRef = useRef(null);
  const userProfile = useSelector((s) => s.auth.userProfile);

  const username = userProfile?.username || "user";
  const level = userProfile?.level || 1;

  const iconIndex = (username.length + level) % SUNDAY_ICONS.length;
  const sundayIcon = SUNDAY_ICONS[iconIndex];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className={styles.chatHistoryContainer}>
      {messages.map((message) => {
        const isUser = message.sender === "user";

        return (
          <div
            key={message.id}
            className={`${styles.messageWrapper} ${
              isUser ? styles.userWrapper : styles.botWrapper
            }`}
          >
            {/* Show badge ONLY for AI messages */}
            {!isUser && (
              <div className={styles.sundayHeader}>
                <div className={styles.sundayIcon} style={{ fontSize: "35px" }}>
                  {sundayIcon}
                </div>
                <div className={styles.sundayName}>Sunday</div>
              </div>
            )}

            <div
              className={`${styles.messageBubble} ${
                isUser ? styles.userMessage : styles.botMessage
              }`}
            >
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className={styles.loadingBubble}>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
        </div>
      )}

      <div ref={bottomRef}></div>
    </div>
  );
}

export default ChatInterface;
