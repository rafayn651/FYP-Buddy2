import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Send, Loader2, Trash2, Plus, MessageSquare, X, Menu } from "lucide-react";
import userImg from "@/assets/user.jpg";

export default function Chatbot() {
  const { user } = useSelector((store) => store.auth);
  const [chats, setChats] = useState([
    {
      id: 1,
      title: "New Chat",
      messages: [
        {
          id: 1,
          text: `👋 Hello ${user?.username?.split(" ")[0] || "there"}! I'm your FYP Buddy AI assistant. I can help you with:\n\n• Project ideas and suggestions\n• Research guidance\n• Documentation tips\n• Technical questions\n• Best practices\n\nWhat would you like to explore today?`,
          sender: "bot",
          timestamp: new Date(),
        },
      ],
      lastActivity: new Date(),
    },
  ]);
  const [activeChatId, setActiveChatId] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatsOpen, setIsChatsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId) || chats[0];

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  };

  useEffect(() => {
    // Only scroll when messages actually change, not on every render
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [activeChat?.messages]);

  const handleSendMessage = async (text = null) => {
    const messageText = text || inputValue.trim();
    if (!messageText && !text) return;

    // Add user message
    const userMessage = {
      id: activeChat.messages.length + 1,
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };

    // Update chat with new message
    const updatedChats = chats.map((chat) =>
      chat.id === activeChatId
        ? {
          ...chat,
          messages: [...chat.messages, userMessage],
          lastActivity: new Date(),
          title: chat.messages.length === 1 ? messageText.substring(0, 30) + (messageText.length > 30 ? "..." : "") : chat.title,
        }
        : chat
    );
    setChats(updatedChats);
    setInputValue("");
    setIsLoading(true);

    // Simulate bot response (Replace with actual API call)
    setTimeout(() => {
      const botResponse = {
        id: activeChat.messages.length + 2,
        text: `I understand you're asking about "${messageText}". This is a placeholder response. In the actual implementation, this would connect to your AI backend to provide intelligent responses. For now, I'm here to help you with your FYP journey! 🚀`,
        sender: "bot",
        timestamp: new Date(),
      };

      const finalChats = updatedChats.map((chat) =>
        chat.id === activeChatId
          ? {
            ...chat,
            messages: [...chat.messages, botResponse],
            lastActivity: new Date(),
          }
          : chat
      );
      setChats(finalChats);
      setIsLoading(false);
    }, 1500);
  };

  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [
        {
          id: 1,
          text: `👋 Hello ${user?.username?.split(" ")[0] || "there"}! I'm your FYP Buddy AI assistant. How can I help you today?`,
          sender: "bot",
          timestamp: new Date(),
        },
      ],
      lastActivity: new Date(),
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
    setIsChatsOpen(false); // Close mobile sidebar after creating new chat
  };

  const handleDeleteChat = (chatId, e) => {
    e.stopPropagation();
    if (chats.length === 1) {
      handleNewChat();
      setTimeout(() => {
        setChats((prev) => prev.filter((chat) => chat.id !== chatId));
        setActiveChatId(chats[0]?.id || Date.now());
      }, 0);
      return;
    }
    const updatedChats = chats.filter((chat) => chat.id !== chatId);
    setChats(updatedChats);
    if (chatId === activeChatId) {
      setActiveChatId(updatedChats[0]?.id || 1);
    }
  };

  const handleChatSelect = (chatId) => {
    setActiveChatId(chatId);
    setIsChatsOpen(false); // Close mobile sidebar after selecting chat
  };

  const handleClearChat = () => {
    const resetChat = {
      id: activeChatId,
      title: "New Chat",
      messages: [
        {
          id: 1,
          text: `👋 Hello ${user?.username?.split(" ")[0] || "there"}! I'm your FYP Buddy AI assistant. How can I help you today?`,
          sender: "bot",
          timestamp: new Date(),
        },
      ],
      lastActivity: new Date(),
    };

    setChats(chats.map((chat) => (chat.id === activeChatId ? resetChat : chat)));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen mt-15">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        {/* Sidebar */}
        <Sidebar portalType="student" />

        {/* Main Chat Interface */}
        <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
          {/* Header */}
          <Card className="mb-5 p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl border-none">
            <div className="flex items-center justify-between">
              {/* Mobile Chats Toggle Button */}
              <button
                onClick={() => setIsChatsOpen(!isChatsOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 mr-3"
                aria-label="Toggle chats"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                    <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      FYP Buddy AI
                    </span>
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Online • Ready to help
                  </p>
                </div>
              </div>
              <Button
                onClick={handleClearChat}
                variant="ghost"
                className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors duration-200"
                title="Clear Chat"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </Card>

          {/* Chat Messages Container */}
          <Card className="flex-1 flex flex-col mb-5 bg-white dark:bg-gray-800 shadow-lg rounded-2xl border-none overflow-hidden">

            {/* Chat Messages Section */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 
  bg-gradient-to-b from-gray-50/50 to-white 
  dark:from-gray-900/50 dark:to-gray-800 
  max-h-[70vh]">   {/* 👈 Limits height & enables scroll */}

              {activeChat.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  {/* Bot Avatar */}
                  {message.sender === "bot" && (
                    <Avatar className="w-9 h-9 border-2 border-purple-500/20 dark:border-gray-600">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-cyan-500 text-white">
                        <Bot className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-5 py-3 shadow-md ${message.sender === "user"
                        ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-sm"
                        : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-600"
                      }`}
                  >
                    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {message.text}
                    </div>
                    <div
                      className={`text-xs mt-2 ${message.sender === "user" ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                        }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {message.sender === "user" && (
                    <Avatar className="w-9 h-9 border-2 border-purple-500/20 dark:border-gray-600">
                      <AvatarImage src={user?.profilePic || userImg} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-cyan-500 text-white">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {/* Bot typing indicator */}
              {isLoading && (
                <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Avatar className="w-9 h-9 border-2 border-purple-500/20 dark:border-gray-600">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-cyan-500 text-white">
                      <Bot className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-sm px-5 py-3 shadow-md border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Section */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message... (Press Enter to send)"
                    disabled={isLoading}
                    className="w-full pr-12 py-6 rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-gray-500 transition-all duration-200"
                  />
                </div>
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-6 py-6 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                FYP Buddy AI can make mistakes. Check important information.
              </p>
            </div>

          </Card>

        </main>

        {/* Mobile Chats Overlay */}
        {isChatsOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsChatsOpen(false)}
            ></div>
            {/* Mobile Chats Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 z-50 flex flex-col w-80 bg-white dark:bg-gray-800 shadow-2xl lg:hidden transform transition-transform duration-300">
              {/* Chats Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chats</h2>
                <button
                  onClick={() => setIsChatsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                  aria-label="Close chats"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <Button
                  onClick={handleNewChat}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-500 dark:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>

              {/* Chats List */}
              <div className="flex-1 overflow-y-auto p-2 bg-white dark:bg-gray-800">
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleChatSelect(chat.id)}
                      className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${chat.id === activeChatId
                          ? "bg-purple-50 dark:bg-gray-700 border-2 border-purple-500 dark:border-gray-600"
                          : "bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${chat.id === activeChatId
                              ? "bg-gradient-to-br from-purple-500 to-purple-700 dark:bg-gray-600"
                              : "bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700"
                            }`}
                        >
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${chat.id === activeChatId
                                ? "text-purple-900 dark:text-gray-100"
                                : "text-gray-900 dark:text-gray-100"
                              }`}
                          >
                            {chat.title}
                          </p>
                          <p
                            className={`text-xs mt-1 truncate ${chat.id === activeChatId
                                ? "text-purple-700 dark:text-gray-300"
                                : "text-gray-500 dark:text-gray-400"
                              }`}
                          >
                            {chat.messages.length > 1
                              ? chat.messages[chat.messages.length - 1]?.text.substring(0, 40) + "..."
                              : "New conversation"}
                          </p>
                          <p
                            className={`text-xs mt-1 ${chat.id === activeChatId
                                ? "text-purple-600 dark:text-gray-400"
                                : "text-gray-400 dark:text-gray-500"
                              }`}
                          >
                            {chat.lastActivity.toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className={`lg:opacity-0 lg:group-hover:opacity-100 opacity-100 transition-opacity duration-200 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 ${chat.id === activeChatId
                              ? "text-purple-700 dark:text-gray-300"
                              : "text-gray-400 dark:text-gray-500"
                            }`}
                          title="Delete chat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chats Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  {chats.length} {chats.length === 1 ? "chat" : "chats"}
                </p>
              </div>
            </aside>
          </>
        )}

        {/* Desktop Chats Sidebar */}
        <aside className="hidden lg:flex flex-col w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-none overflow-hidden">
          {/* Chats Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Button
              onClick={handleNewChat}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-500 dark:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Chats List */}
          <div className="flex-1 overflow-y-auto p-2 bg-white dark:bg-gray-800">
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${chat.id === activeChatId
                      ? "bg-purple-50 dark:bg-gray-700 border-2 border-purple-500 dark:border-gray-600"
                      : "bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent"
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${chat.id === activeChatId
                          ? "bg-gradient-to-br from-purple-500 to-purple-700 dark:bg-gray-600"
                          : "bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700"
                        }`}
                    >
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${chat.id === activeChatId
                            ? "text-purple-900 dark:text-gray-100"
                            : "text-gray-900 dark:text-gray-100"
                          }`}
                      >
                        {chat.title}
                      </p>
                      <p
                        className={`text-xs mt-1 truncate ${chat.id === activeChatId
                            ? "text-purple-700 dark:text-gray-300"
                            : "text-gray-500 dark:text-gray-400"
                          }`}
                      >
                        {chat.messages.length > 1
                          ? chat.messages[chat.messages.length - 1]?.text.substring(0, 40) + "..."
                          : "New conversation"}
                      </p>
                      <p
                        className={`text-xs mt-1 ${chat.id === activeChatId
                            ? "text-purple-600 dark:text-gray-400"
                            : "text-gray-400 dark:text-gray-500"
                          }`}
                      >
                        {chat.lastActivity.toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 ${chat.id === activeChatId
                          ? "text-purple-700 dark:text-gray-300"
                          : "text-gray-400 dark:text-gray-500"
                        }`}
                      title="Delete chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chats Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              {chats.length} {chats.length === 1 ? "chat" : "chats"}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

