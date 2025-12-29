import styles from "./ChatInterface.module.css";
import ReactMarkdown from "react-markdown";
import { useRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { SUNDAY_ICONS } from "./SundayIcons";
import { chatbotEditMessage } from "@/redux/chatbotSlice";

/* ---------------- SAFE JSON PARSER ---------------- */
function parseAIJSON(text) {
  if (typeof text !== "string") return null;

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed.days) && parsed.budget) return parsed;
    return null;
  } catch {
    return null;
  }
}

/* ---------------- EDITABLE PLAN COMPONENT ---------------- */
function TripPlanEditor({ plan, editable, onChange }) {
  const clone = () => structuredClone(plan);

  const updateTitle = (dayIdx, value) => {
    const p = clone();
    p.days[dayIdx].title = value;
    onChange(p);
  };

  const updatePoint = (dayIdx, pointIdx, value) => {
    const p = clone();
    p.days[dayIdx].points[pointIdx] = value;
    onChange(p);
  };

  const addPoint = (dayIdx) => {
    const p = clone();
    p.days[dayIdx].points.push("");
    onChange(p);
  };

  const removePoint = (dayIdx, pointIdx) => {
    const p = clone();
    p.days[dayIdx].points.splice(pointIdx, 1);
    onChange(p);
  };

  return (
    <div className={styles.planWrapper}>
      <div className={styles.planHeader}>
        <span className={styles.planBadge}>AI Travel Plan</span>
        <span className={styles.planSubtitle}>
          {editable ? "Editing plan" : "Structured & editable"}
        </span>
      </div>

      <div className={styles.daysGrid}>
        {plan.days.map((day, dIdx) => (
          <div key={day.day} className={styles.dayCard}>
            <div className={styles.dayHeader}>
              <span className={styles.dayNumber}>Day {day.day}</span>

              {editable ? (
                <input
                  className={styles.dayTitleInput}
                  value={day.title}
                  onChange={(e) => updateTitle(dIdx, e.target.value)}
                />
              ) : (
                <span className={styles.dayTitle}>{day.title}</span>
              )}
            </div>

            <ul className={styles.pointList}>
              {day.points.map((p, i) => (
                <li key={i}>
                  <span className={styles.bulletDot} />
                  {editable ? (
                    <>
                      <input
                        className={styles.pointInput}
                        value={p}
                        onChange={(e) => updatePoint(dIdx, i, e.target.value)}
                      />
                      <button
                        className={styles.deletePoint}
                        onClick={() => removePoint(dIdx, i)}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span>{p}</span>
                  )}
                </li>
              ))}
            </ul>

            {editable && (
              <button
                className={styles.addPointBtn}
                onClick={() => addPoint(dIdx)}
              >
                + Add point
              </button>
            )}
          </div>
        ))}
      </div>

      <div className={styles.budgetCard}>
        <div className={styles.budgetItem}>🚍 {plan.budget.transport}</div>
        <div className={styles.budgetItem}>🏨 {plan.budget.accommodation}</div>
        <div className={styles.budgetItem}>🍽 {plan.budget.local}</div>
      </div>
    </div>
  );
}

/* ---------------- MAIN CHAT UI ---------------- */
export default function ChatInterface({ messages, isLoading }) {
  const bottomRef = useRef(null);
  const dispatch = useDispatch();

  const userProfile = useSelector((s) => s.auth.userProfile);
  const sundayIcon =
    SUNDAY_ICONS[
      ((userProfile?.username || "").length + (userProfile?.level || 1)) %
        SUNDAY_ICONS.length
    ];

  const [editingId, setEditingId] = useState(null);
  const [editablePlan, setEditablePlan] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className={styles.chatHistoryContainer}>
      {messages.map((message) => {
        const isUser = message.sender === "user";

        const parsedPlan =
          !isUser &&
          typeof message.text === "string" &&
          message.text.trim().startsWith("{")
            ? parseAIJSON(message.text)
            : null;

        const isEditing = editingId === message.messageId;

        return (
          <div
            key={message.messageId}
            className={`${styles.messageWrapper} ${
              isUser ? styles.userWrapper : styles.botWrapper
            }`}
          >
            {!isUser && (
              <div className={styles.sundayHeader}>
                <div className={styles.sundayIcon}>{sundayIcon}</div>
                <div className={styles.sundayName}>Sunday</div>
              </div>
            )}

            <div
              className={`${styles.messageBubble} ${
                isUser
                  ? styles.userMessage
                  : parsedPlan
                  ? styles.botMessage
                  : styles.botDiscussionMessage
              }`}
            >
              {parsedPlan ? (
                isEditing ? (
                  <>
                    <TripPlanEditor
                      plan={editablePlan}
                      editable
                      onChange={setEditablePlan}
                    />

                    <div className={styles.editActions}>
                      <button
                        className={styles.primaryBtn}
                        onClick={() => {
                          dispatch(
                            chatbotEditMessage({
                              messageId: message.messageId,
                              text: JSON.stringify(editablePlan),
                            })
                          );
                          setEditingId(null);
                          setEditablePlan(null);
                        }}
                      >
                        Save
                      </button>

                      <button
                        className={styles.secondaryBtn}
                        onClick={() => {
                          setEditingId(null);
                          setEditablePlan(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <TripPlanEditor plan={parsedPlan} />

                    <div className={styles.planActions}>
                      <button
                        className={styles.secondaryBtn}
                        onClick={() => {
                          setEditingId(message.messageId);
                          setEditablePlan(structuredClone(parsedPlan));
                        }}
                      >
                        Edit Plan
                      </button>
                      <button className={styles.primaryBtn}>
                        Apply to Trip
                      </button>
                    </div>
                  </>
                )
              ) : (
                <ReactMarkdown>{message.text}</ReactMarkdown>
              )}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className={styles.loadingBubble}>
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
