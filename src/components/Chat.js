import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import MessageList from "./MessageList";
import EmojiPicker from "emoji-picker-react";
import "./chat.css";

const socket = io("https://nova-chat-backend.vercel.app", {
  transports: ["polling"],
});

export const Chat = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");

  const [typingUser, setTypingUser] = useState("");
  const typingTimeoutRef = useRef(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get(
          "https://nova-chat-backend.vercel.app/users",
          {
            params: { currentUser: user.username },
          },
        );
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users", error);
      }
    };

    fetchUsers();

    socket.on("receive_message", (data) => {
      if (data.sender === currentChat || data.receiver === currentChat) {
        setMessages((prev) => [...prev, data]);
      }
    });

    socket.on("user_typing", (data) => {
      //show typing only for current chat person
      if (data.sender === currentChat) {
        setTypingUser(data.sender);

        //clear old timer
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        //set new timer
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser("");
        }, 1200);
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_typing");
    };
  }, [currentChat, user.username]);

  const fetchMessages = async (receiver) => {
    try {
      const { data } = await axios.get(
        "https://nova-chat-backend.vercel.app/messages",
        {
          params: { sender: user.username, receiver },
        },
      );

      setMessages(data);
      setCurrentChat(receiver);
      setTypingUser("");
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error fetching messages", error);
    }
  };

  const sendMessage = () => {
    if (!currentMessage.trim()) return;

    const messageData = {
      sender: user.username,
      receiver: currentChat,
      message: currentMessage,
    };

    socket.emit("send_message", messageData);

    setCurrentMessage("");
    setShowEmojiPicker(false);
  };

  const handleTyping = (e) => {
    setCurrentMessage(e.target.value);

    socket.emit("typing", {
      sender: user.username,
      receiver: currentChat,
    });
  };

  return (
    <div className="chat-container">
      <h2>Welcome, {user.username}</h2>

      <div className="chat-list">
        <h3>Chats</h3>
        {users.map((u) => (
          <div
            key={u._id}
            className={`chat-user ${currentChat === u.username ? "active" : ""}`}
            onClick={() => fetchMessages(u.username)}
          >
            {u.username}
          </div>
        ))}
      </div>

      {currentChat && (
        <div className="chat-window">
          <h5>You are chatting with {currentChat}</h5>

          <MessageList
            messages={messages}
            user={user}
            typingUser={typingUser}
          />

          <div className="message-input" style={{ position: "relative" }}>
            <button
              className="emoji-btn"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
            >
              😀
            </button>

            {showEmojiPicker && (
              <div className="emoji-picker-box">
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    setCurrentMessage((prev) => prev + emojiData.emoji);
                    setShowEmojiPicker(false);
                  }}
                />
              </div>
            )}

            <input
              type="text"
              placeholder="Type a message..."
              value={currentMessage}
              style={{ minWidth: "400px" }}
              onChange={handleTyping}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />

            <button className="btn-prime" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
