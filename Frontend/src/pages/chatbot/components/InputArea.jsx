import styles from "./InputArea.module.css";
import { AiOutlineSend } from "react-icons/ai";
import { useEffect, useRef } from "react";

function InputArea({
  inputValue,
  setInputValue,
  onSend,
  isLoading,
  onKeyPress,
}) {
  const textAreaRef = useRef(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  return (
    <div className={styles.chatArea}>
      <textarea
        ref={textAreaRef}
        className={styles.inputField}
        placeholder="Ask Sunday AI..."
        value={inputValue}
        disabled={isLoading}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={onKeyPress}
      />

      <button
        className={styles.enterButton}
        disabled={isLoading || !inputValue.trim()}
        onClick={onSend}
      >
        <AiOutlineSend className={styles.submitIcon} />
      </button>
    </div>
  );
}

export default InputArea;
