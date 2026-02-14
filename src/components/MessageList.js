import React, { useEffect, useRef } from "react";

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MessageList = ({ messages, user, typingUser }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  return (
    <div className="message-list">
      {messages.map((msg, index) => (
        <div
          key={msg._id || index}
          className={`message ${
            msg.sender === user.username ? "sent" : "received"
          }`}
        >
          <div className="msg-content">
            <strong>{msg.sender}: </strong>
            {msg.message}
          </div>

          <div className="msg-time">{formatTime(msg.createdAt)}</div>
        </div>
      ))}

      {typingUser && typingUser !== user.username && (
        <div className="message received typing-message">
          <div className="msg-content">
            <strong>{typingUser}: </strong>
            <span className="typing-dots">is typing...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef}></div>
    </div>
  );
};

export default MessageList;
