import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  Users,
  User,
  Crown,
  MessageCircle,
  Menu,
  X,
  Globe,
  MessageSquare,
  Video,
  Phone,
  Loader2,
  Plus,
  Image,
  FileText,
  UserPlus,
  Download,
  Trash2,
  MoreVertical,
  Mic,
  MicOff,
  VideoOff,
} from "lucide-react";
import axios from "axios";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import userImg from "@/assets/user.jpg";
import { encryptMessage, decryptMessage } from "@/utils/encryption";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

export default function TeamChat() {
  const { user } = useSelector((store) => store.auth);


  const [chats, setChats] = useState([]);
  const [chatMessages, setChatMessages] = useState({});
  const [activeChatId, setActiveChatId] = useState(null);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState({});
  const [connectionError, setConnectionError] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isChatsOpen, setIsChatsOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, messageId: null, imageUrl: null });
  const [deleteMenuOpen, setDeleteMenuOpen] = useState({});
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const readTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const chatsRef = useRef([]);
  const activeChatIdRef = useRef(null);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const localVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const peerConnectionsRef = useRef({});
  const pendingCandidatesRef = useRef({});
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callTargets, setCallTargets] = useState([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const firstRemoteEntry = useMemo(() => Object.entries(remoteStreams)[0] || null, [remoteStreams]);
  const remoteVideoRef = useRef(null);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || null,
    [chats, activeChatId]
  );
  const activeMessages = Array.isArray(chatMessages[activeChatId])
    ? chatMessages[activeChatId]
    : [];
  const isActiveChatLoading = !!messagesLoading[activeChatId];
  const canSendMessage = Boolean(activeChatId) && !roomsLoading && !connectionError;

  useEffect(() => {
    if (!isVideoCallOpen) return;
    const updateVideo = () => {
      if (!localVideoRef.current) return;
      const streamToShow = isScreenSharing ? localStream : (cameraStream || localStream);
      if (streamToShow) {
        try {
          if (localVideoRef.current.srcObject !== streamToShow) {
            localVideoRef.current.srcObject = streamToShow;
          }
          const p = localVideoRef.current.play();
          if (p && typeof p.then === "function") {
            p.catch((err) => {
              console.error("Error playing video:", err);
              setTimeout(updateVideo, 100);
            });
          }
        } catch (err) {
          console.error("Error setting video stream:", err);
          setTimeout(updateVideo, 100);
        }
      }
    };
    const timeoutId = setTimeout(updateVideo, 50);
    return () => clearTimeout(timeoutId);
  }, [isVideoCallOpen, localStream, cameraStream, isScreenSharing]);

  useEffect(() => {
    if (!isVideoCallOpen) return;
    const stream = firstRemoteEntry ? firstRemoteEntry[1] : null;
    if (remoteVideoRef.current && stream) {
      try {
        if (remoteVideoRef.current.srcObject !== stream) {
          remoteVideoRef.current.srcObject = stream;
        }
        const p = remoteVideoRef.current.play();
        if (p && typeof p.then === "function") { p.catch(() => undefined); }
      } catch { void 0; }
    }
  }, [isVideoCallOpen, firstRemoteEntry]);

  useEffect(() => {
    if (!isVideoCallOpen) return;
    const el = localVideoRef.current;
    const streamToShow = isScreenSharing ? localStream : (cameraStream || localStream);
    if (el && streamToShow) {
      try {
        if (el.srcObject !== streamToShow) {
          el.srcObject = streamToShow;
        }
        const p = el.play();
        if (p && typeof p.then === "function") { p.catch(() => undefined); }
      } catch { void 0; }
    } else if (el && !streamToShow) {
      try {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((s) => {
          setLocalStream((prev) => prev || s);
          setCameraStream((prev) => prev || s);
          try {
            if (el.srcObject !== s) { el.srcObject = s; }
            const p = el.play();
            if (p && typeof p.then === "function") { p.catch(() => undefined); }
          } catch { void 0; }
        }).catch(() => undefined);
      } catch { void 0; }
    }
  }, [isVideoCallOpen, localStream, cameraStream, isScreenSharing, isConnecting, remoteStreams]);

  useEffect(() => {
    if (!isVideoCallOpen) return;
    const bindLater = () => {
      const el = localVideoRef.current;
      const s = isScreenSharing ? localStream : (cameraStream || localStream);
      if (el && s) {
        try {
          if (el.srcObject !== s) { el.srcObject = s; }
          const p = el.play();
          if (p && typeof p.then === "function") { p.catch(() => undefined); }
        } catch { void 0; }
      }
    };
    const id = setTimeout(bindLater, 150);
    return () => clearTimeout(id);
  }, [isConnecting]);
  useEffect(() => {
    if (!user?._id || !API_BASE_URL) return;
    let ignore = false;

    const fetchRooms = async () => {
      setRoomsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setRoomsLoading(false);
          return;
        }
        const res = await axios.get(`${API_BASE_URL}/chat/rooms`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (ignore) return;
        const fetchedRooms = res.data?.rooms || [];
        setChats(fetchedRooms);
        const onlineSet = new Set();
        const counts = {};
        fetchedRooms.forEach((room) => {
          counts[room.id] = room.unreadCount || 0;
          room.participants?.forEach((p) => {
            if (p.isOnline) {
              onlineSet.add(p.id);
            }
          });
        });
        setUnreadCounts(counts);
        setOnlineUsers(onlineSet);
        setChatMessages((prev) => {
          const next = { ...prev };
          let updated = false;
          fetchedRooms.forEach((room) => {
            if (!next[room.id]) {
              next[room.id] = [];
              updated = true;
            }
          });
          Object.keys(next).forEach((roomId) => {
            if (!fetchedRooms.some((room) => room.id === roomId)) {
              delete next[roomId];
              updated = true;
            }
          });
          return updated ? next : prev;
        });
      } catch (error) {
        if (!ignore) {
          toast.error(
            error.response?.data?.message ||
              error.message ||
              "Unable to load chats"
          );
        }
      } finally {
        if (!ignore) {
          setRoomsLoading(false);
        }
      }
    };

    fetchRooms();

    return () => {
      ignore = true;
    };
  }, [user?._id]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!chats.length) {
      setActiveChatId(null);
      return;
    }

    if (activeChatId && chats.some((chat) => chat.id === activeChatId)) {
      return;
    }

    const preferredChat =
      chats.find((chat) => chat.meta?.scope === "team") ||
      chats.find((chat) => chat.meta?.scope === "withSupervisor") ||
      chats[0];

    setActiveChatId(preferredChat?.id || chats[0]?.id || null);
  }, [chats, activeChatId]);

  useEffect(() => {
    if (!user?._id || !SOCKET_BASE_URL) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socket = io(SOCKET_BASE_URL, {
      withCredentials: true,
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      forceNew: false,
      upgrade: true,
      rememberUpgrade: false,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
      setConnectionError(null);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      setConnectionError(null);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("Reconnection attempt", attemptNumber);
    });

    socket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
      setConnectionError("Reconnecting...");
    });

    socket.on("reconnect_failed", () => {
      console.error("Reconnection failed");
      setConnectionError("Unable to reconnect. Please refresh the page.");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionError(error.message || "Unable to connect to chat");
    });

    socket.on("chat:new-message", async (message) => {
      try {
        if (!message || !message.roomKey) {
          console.error("Invalid message received:", message);
          return;
        }

        // Get participants for decryption from current chats using ref
        const currentChats = chatsRef.current;
        const chat = currentChats.find((c) => c.id === message.roomKey);
        const participants = chat?.participants || [];
        const participantIds = participants.map((p) => String(p.id || p._id || p)).filter(Boolean);

        // Decrypt the message
        let decryptedMessage;
        try {
          decryptedMessage = await decryptMessage(
            message,
            message.roomKey,
            user?._id,
            participantIds
          );
        } catch (decryptError) {
          console.error("Error decrypting message:", decryptError);
          decryptedMessage = message;
        }

        setChatMessages((prev) => {
          const existingMessages = prev[decryptedMessage.roomKey] || [];
          // Check if message already exists to prevent duplicates
          const messageExists = existingMessages.some(
            (m) => m.id === decryptedMessage.id || 
            (m.timestamp === decryptedMessage.timestamp && m.sender?.id === decryptedMessage.sender?.id)
          );
          
          if (messageExists) {
            return prev;
          }
          
          return {
            ...prev,
            [decryptedMessage.roomKey]: [...existingMessages, decryptedMessage],
          };
        });

        const currentActiveChatId = activeChatIdRef.current;
        if (decryptedMessage.roomKey === currentActiveChatId && decryptedMessage.sender.id !== user?._id) {
          markMessagesAsRead(decryptedMessage.roomKey, [decryptedMessage.id]);
        } else if (decryptedMessage.sender.id !== user?._id) {
          setUnreadCounts((prev) => ({
            ...prev,
            [decryptedMessage.roomKey]: (prev[decryptedMessage.roomKey] || 0) + 1,
          }));
        }
      } catch (error) {
        console.error("Error processing new message:", error);
        // Still add message even if processing fails (for backward compatibility)
        if (message && message.roomKey) {
          setChatMessages((prev) => {
            const existingMessages = prev[message.roomKey] || [];
            const messageExists = existingMessages.some(
              (m) => m.id === message.id
            );
            if (messageExists) {
              return prev;
            }
            return {
              ...prev,
              [message.roomKey]: [...existingMessages, message],
            };
          });
        }
      }
    });

    socket.on("chat:rooms", (serverRooms) => {
      if (!serverRooms || !Array.isArray(serverRooms)) return;
      
      setChats(serverRooms);
      setRoomsLoading(false);
      const counts = {};
      const onlineSet = new Set();
      
      serverRooms.forEach((room) => {
        counts[room.id] = room.unreadCount || 0;
        setChatMessages((prev) => {
          if (!prev[room.id]) {
            return {
              ...prev,
              [room.id]: [],
            };
          }
          return prev;
        });
        room.participants?.forEach((p) => {
          const participantId = String(p.id || p._id || p);
          if (p.isOnline) {
            onlineSet.add(participantId);
          }
        });
      });
      setUnreadCounts(counts);
      setOnlineUsers(onlineSet);
    });

    socket.on("rtc:ring", (payload) => {
      const { from, roomKey } = payload || {};
      if (!from || !roomKey) return;
      const chatsList = chatsRef.current || [];
      const chat = chatsList.find((c) => String(c.id) === String(roomKey)) || null;
      setIncomingCall({ from, roomKey, chat });
    });

    socket.on("rtc:ring:accept", async (payload) => {
      const { from, roomKey } = payload || {};
      if (!from || !roomKey) return;
      if (!activeChatIdRef.current || String(roomKey) !== String(activeChatIdRef.current)) return;
      setIsConnecting(true);
      setCallTargets((prev) => (prev.includes(from) ? prev : [...prev, from]));
      await createConnectionAndOffer(from);
    });

    socket.on("rtc:ring:decline", (payload) => {
      const { from, roomKey } = payload || {};
      if (!from || !roomKey) return;
      if (!activeChatIdRef.current || String(roomKey) !== String(activeChatIdRef.current)) return;
      setCallTargets((prev) => prev.filter((id) => id !== from));
      toast.error("Call declined");
    });

    socket.on("rtc:offer", async (payload) => {
      try {
        const { from, roomKey, offer } = payload || {};
        if (!from || !roomKey) return;
        if (!activeChatIdRef.current || String(roomKey) !== String(activeChatIdRef.current)) return;
        let pc = peerConnectionsRef.current[from];
        if (!pc) {
          pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
          peerConnectionsRef.current[from] = pc;
          let ensuredStream = localStream || cameraStream;
          if (!ensuredStream) {
            ensuredStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(ensuredStream);
            setCameraStream(ensuredStream);
            setTimeout(() => {
              if (localVideoRef.current && ensuredStream) {
                try { 
                  localVideoRef.current.srcObject = ensuredStream;
                  const p = localVideoRef.current.play();
                  if (p && typeof p.then === "function") {
                    p.catch((err) => {
                      console.error("Error playing video in offer handler:", err);
                      setTimeout(() => {
                        if (localVideoRef.current && ensuredStream) {
                          try {
                            localVideoRef.current.srcObject = ensuredStream;
                            localVideoRef.current.play().catch(() => {});
                          } catch {}
                        }
                      }, 200);
                    });
                  }
                } catch (err) {
                  console.error("Error setting video in offer handler:", err);
                }
              }
            }, 100);
          }
          ensuredStream.getTracks().forEach((t) => {
            if (pc.getSenders().find(s => s.track === t)) return;
            pc.addTrack(t, ensuredStream);
          });
          pc.ontrack = (event) => {
            const stream = event.streams?.[0];
            if (!stream) return;
            setRemoteStreams((prev) => {
              const next = { ...prev };
              next[from] = stream;
              return next;
            });
            event.streams?.forEach((s) => {
              s.getTracks().forEach((track) => {
                track.onended = () => {
                  setRemoteStreams((prev) => {
                    const next = { ...prev };
                    if (next[from]) {
                      const updatedStream = new MediaStream(next[from].getTracks().filter(t => t !== track));
                      if (updatedStream.getTracks().length > 0) {
                        next[from] = updatedStream;
                      } else {
                        delete next[from];
                      }
                    }
                    return next;
                  });
                };
              });
            });
          };
          pc.oniceconnectionstatechange = () => {
            const s = pc.iceConnectionState;
            if (s === "connected" || s === "completed") { setIsConnecting(false); }
          };
          pc.onicecandidate = (e) => {
            if (e.candidate && socketRef.current?.connected) {
              socketRef.current.emit("rtc:candidate", { to: from, roomKey, candidate: e.candidate });
            }
          };
        }
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const queued = pendingCandidatesRef.current[from] || [];
        if (queued.length) {
          for (const c of queued) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
          }
          pendingCandidatesRef.current[from] = [];
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (socketRef.current?.connected) {
          socketRef.current.emit("rtc:answer", { to: from, roomKey, answer });
        }
        setIsVideoCallOpen(true);
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    socket.on("rtc:answer", async (payload) => {
      try {
        const { from, roomKey, answer } = payload || {};
        if (!from || !roomKey) return;
        if (!activeChatIdRef.current || String(roomKey) !== String(activeChatIdRef.current)) return;
        const pc = peerConnectionsRef.current[from];
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        const queued = pendingCandidatesRef.current[from] || [];
        if (queued.length) {
          for (const c of queued) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
          }
          pendingCandidatesRef.current[from] = [];
        }
      } catch {}
    });

    socket.on("rtc:candidate", async (payload) => {
      try {
        const { from, roomKey, candidate } = payload || {};
        if (!from || !roomKey) return;
        if (!activeChatIdRef.current || String(roomKey) !== String(activeChatIdRef.current)) return;
        if (!candidate) return;
        const pc = peerConnectionsRef.current[from];
        if (pc && pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
        } else {
          const q = pendingCandidatesRef.current[from] || [];
          pendingCandidatesRef.current[from] = [...q, candidate];
        }
      } catch {}
    });

    socket.on("rtc:end", (payload) => {
      const { from, roomKey } = payload || {};
      if (!from || !roomKey) return;
      if (!activeChatIdRef.current || String(roomKey) !== String(activeChatIdRef.current)) return;
      const pc = peerConnectionsRef.current[from];
      if (pc) {
        pc.close();
        delete peerConnectionsRef.current[from];
      }
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[from];
        return next;
      });
    });

    socket.on("chat:user-status", (data) => {
      if (!data || !data.userId) return;
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (data.isOnline) {
          next.add(String(data.userId));
        } else {
          next.delete(String(data.userId));
        }
        return next;
      });
      
      // Also update online status in chats
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat.participants) {
            const updatedParticipants = chat.participants.map((p) => {
              if (String(p.id || p._id || p) === String(data.userId)) {
                return { ...p, isOnline: data.isOnline };
              }
              return p;
            });
            return { ...chat, participants: updatedParticipants };
          }
          return chat;
        });
      });
    });

    socket.on("chat:messages-read", (data) => {
      if (data.roomKey === activeChatId) {
        setChatMessages((prev) => {
          const next = { ...prev };
          if (next[data.roomKey]) {
            next[data.roomKey] = next[data.roomKey].map((msg) => {
              if (data.messageIds.includes(msg.id) && !msg.readBy?.includes(data.userId)) {
                return {
                  ...msg,
                  readBy: [...(msg.readBy || []), data.userId],
                };
              }
              return msg;
            });
          }
          return next;
        });
      }
    });

    socket.on("chat:message-deleted", async (data) => {
      setChatMessages((prev) => {
        const next = { ...prev };
        if (next[data.roomKey]) {
          if (data.deleteForEveryone) {
            next[data.roomKey] = next[data.roomKey].map((msg) => {
              if (msg.id === data.messageId) {
                return {
                  ...msg,
                  isDeleted: true,
                  text: "This message was deleted",
                  attachments: [],
                  contactData: null,
                };
              }
              return msg;
            });
          } else {
            next[data.roomKey] = next[data.roomKey].filter(
              (msg) => msg.id !== data.messageId
            );
          }
        }
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id]);

  const markMessagesAsRead = useCallback(
    (roomKey, messageIds) => {
      if (!socketRef.current?.connected || !messageIds?.length) return;

      socketRef.current.emit(
        "chat:mark-read",
        { roomKey, messageIds },
        (response) => {
          if (response?.success) {
            setUnreadCounts((prev) => {
              const current = prev[roomKey] || 0;
              const newCount = Math.max(0, current - messageIds.length);
              return { ...prev, [roomKey]: newCount };
            });
          }
        }
      );
    },
    []
  );

  const fetchMessages = useCallback(
    async (roomId) => {
      if (!roomId || !API_BASE_URL) return;
      if (messagesLoading[roomId]) return;
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      setMessagesLoading((prev) => ({ ...prev, [roomId]: true }));
      try {
        const res = await axios.get(
          `${API_BASE_URL}/chat/rooms/${roomId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        // Get participants for decryption
        const chat = chats.find((c) => c.id === roomId);
        const participants = chat?.participants || [];
        const participantIds = participants.map((p) => p.id || p._id || p).filter(Boolean);

        // Decrypt all messages
        const decryptedMessages = await Promise.all(
          (res.data?.messages || []).map((message) =>
            decryptMessage(message, roomId, user?._id, participantIds)
          )
        );

        setChatMessages((prev) => ({
          ...prev,
          [roomId]: decryptedMessages,
        }));
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Unable to load messages"
        );
      } finally {
        setMessagesLoading((prev) => ({ ...prev, [roomId]: false }));
      }
    },
    [messagesLoading, chats, user?._id]
  );

  useEffect(() => {
    if (!activeChatId) return;
    if (chatMessages[activeChatId]?.length) {
      const unreadMessages = chatMessages[activeChatId].filter(
        (msg) => msg.sender.id !== user?._id && !msg.readBy?.includes(user?._id)
      );
      if (unreadMessages.length > 0) {
        markMessagesAsRead(activeChatId, unreadMessages.map((m) => m.id));
      }
    } else {
      fetchMessages(activeChatId);
    }
  }, [activeChatId, chatMessages, fetchMessages, user?._id, markMessagesAsRead]);

  useEffect(() => {
    if (activeChatId && chatMessages[activeChatId]?.length) {
      if (readTimeoutRef.current) {
        clearTimeout(readTimeoutRef.current);
      }
      readTimeoutRef.current = setTimeout(() => {
        const unreadMessages = chatMessages[activeChatId].filter(
          (msg) => msg.sender.id !== user?._id && !msg.readBy?.includes(user?._id)
        );
        if (unreadMessages.length > 0) {
          markMessagesAsRead(
            activeChatId,
            unreadMessages.map((m) => m.id)
          );
        }
      }, 1000);
    }
    return () => {
      if (readTimeoutRef.current) {
        clearTimeout(readTimeoutRef.current);
      }
    };
  }, [activeChatId, chatMessages, user?._id, markMessagesAsRead]);

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
  }, [activeMessages.length, activeChatId]);

  const handleSendMessage = async (attachments = [], messageType = "text", contactData = null) => {
    const messageText = inputValue.trim();
    if (!messageText && !attachments.length && !contactData) return;
    if (!activeChatId) return;

    if (!socketRef.current || !socketRef.current.connected) {
      toast.error("Chat connection unavailable");
      return;
    }

    try {
      // Get participants from active chat or from chats ref
      const currentChat = activeChat || chatsRef.current.find((c) => c.id === activeChatId);
      const participants = currentChat?.participants || [];
      const participantIds = participants.map((p) => p.id || p._id || p).filter(Boolean);

      // If no participants found, use current user as fallback for key derivation
      if (participantIds.length === 0 && user?._id) {
        participantIds.push(user._id);
      }

      // Prepare message object
      const messageToEncrypt = {
        text: messageText,
        messageType,
        attachments,
        contactData,
      };

      // Encrypt the message
      const encryptedMessage = await encryptMessage(
        messageToEncrypt,
        activeChatId,
        user?._id,
        participantIds
      );

      socketRef.current.emit(
        "chat:send",
        {
          roomKey: activeChatId,
          text: encryptedMessage.text || "",
          messageType,
          attachments: encryptedMessage.attachments || [],
          contactData: encryptedMessage.contactData || null,
          isEncrypted: true,
        },
        (response) => {
          if (!response?.success) {
            toast.error(response?.message || "Failed to send message");
          } else {
            setInputValue("");
          }
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file || !activeChatId) return;

    setUploading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API_BASE_URL}/chat/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        const attachment = res.data.attachment;
        handleSendMessage([attachment], type);
        setIsAttachmentMenuOpen(false);
      } else {
        toast.error("Failed to upload file");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        handleFileUpload(file, "image");
      } else {
        toast.error("Please select an image file");
      }
    }
    e.target.value = "";
  };

  const handleDocumentSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, "document");
    }
    e.target.value = "";
  };

  const handleContactShare = () => {
    if (!user?._id) {
      toast.error("User information not available");
      return;
    }

    const contactData = {
      userId: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone || "",
    };

    handleSendMessage([], "contact", contactData);
    setIsAttachmentMenuOpen(false);
  };

  const handleDeleteMessage = (messageId, deleteForEveryone = false) => {
    if (!socketRef.current?.connected) {
      toast.error("Chat connection unavailable");
      return;
    }

    socketRef.current.emit(
      "chat:delete",
      { messageId, deleteForEveryone },
      (response) => {
        if (!response?.success) {
          toast.error(response?.message || "Failed to delete message");
        }
        setDeleteMenuOpen((prev) => ({ ...prev, [messageId]: false }));
      }
    );
  };

  const handleImageDownload = (imageUrl, fileName) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = fileName || "image.jpg";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageContextMenu = (e, messageId, imageUrl) => {
    e.preventDefault();
    setContextMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
      messageId,
      imageUrl,
    });
  };

  useEffect(() => {
    const handleClick = () => {
      setContextMenu({ open: false, x: 0, y: 0, messageId: null, imageUrl: null });
    };

    if (contextMenu.open) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu.open]);

  const handleChatSelect = (chatId) => {
    setActiveChatId(chatId);
    setIsChatsOpen(false);
    setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));
  };

  const getChatIcon = (chat) => {
    if (chat.type === "public") return <Globe className="w-5 h-5 text-white" />;
    if (chat.type === "group") return <Users className="w-5 h-5 text-white" />;
    return <User className="w-5 h-5 text-white" />;
  };

  const startVideoCall = async () => {
    try {
      if (!activeChat || activeChat.type !== "individual" || !activeChat.participant) {
        toast.error("Select a person to call");
        return;
      }
      const stream = await getSafeUserMedia();
      setCameraStream(stream);
      setLocalStream(stream);
      activeChatIdRef.current = activeChatId;
      setIsVideoCallOpen(true);
      
      // Wait for dialog to open and video element to be ready
      setTimeout(() => {
        if (localVideoRef.current && stream) {
          try {
            localVideoRef.current.srcObject = stream;
            const p = localVideoRef.current.play();
            if (p && typeof p.then === "function") {
              p.catch((err) => {
                console.error("Error playing local video:", err);
                setTimeout(() => {
                  if (localVideoRef.current && stream) {
                    try {
                      localVideoRef.current.srcObject = stream;
                      localVideoRef.current.play().catch(() => {});
                    } catch {}
                  }
                }, 200);
              });
            }
          } catch (err) {
            console.error("Error setting local video:", err);
          }
        }
      }, 100);
      
      setCallTargets([activeChat.participant.id]);
      socketRef.current.emit("rtc:ring", { to: activeChat.participant.id, roomKey: activeChatId });
    } catch (err) {
      console.error("Error starting video call:", err);
      toast.error("Unable to access camera/microphone");
    }
  };

  const endVideoCall = () => {
    try {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (cameraStream && cameraStream !== localStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      setLocalStream(null);
      setCameraStream(null);
      setIsScreenSharing(false);
      setIsVideoCallOpen(false);
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      setRemoteStreams({});
      if (socketRef.current?.connected && callTargets.length) {
        callTargets.forEach((tid) => {
          socketRef.current.emit("rtc:end", { to: tid, roomKey: activeChatId, from: user?._id });
        });
      }
      setCallTargets([]);
      setIsConnecting(false);
      setMicEnabled(true);
      setCameraEnabled(true);
    } catch { void 0; }
  };

  const createConnectionAndOffer = async (targetId) => {
    if (!socketRef.current?.connected || !targetId) return;
    const roomKey = activeChatIdRef.current || activeChatId;
    if (!roomKey) return;
    let streamToUse = localStream || cameraStream;
    if (!streamToUse) {
      try {
        const s = await getSafeUserMedia();
        setCameraStream(s);
        setLocalStream(s);
        streamToUse = s;
      } catch { return; }
    }
    
    let pc = peerConnectionsRef.current[targetId];
    if (!pc) {
      pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      peerConnectionsRef.current[targetId] = pc;
      streamToUse.getTracks().forEach((t) => {
        if (pc.getSenders().find(s => s.track === t)) return;
        pc.addTrack(t, streamToUse);
      });
      pc.ontrack = (event) => {
        const stream = event.streams?.[0];
        if (!stream) return;
        setRemoteStreams((prev) => {
          const next = { ...prev };
          next[targetId] = stream;
          return next;
        });
        event.streams?.forEach((s) => {
          s.getTracks().forEach((track) => {
            track.onended = () => {
              setRemoteStreams((prev) => {
                const next = { ...prev };
                if (next[targetId]) {
                  const updatedStream = new MediaStream(next[targetId].getTracks().filter(t => t !== track));
                  if (updatedStream.getTracks().length > 0) {
                    next[targetId] = updatedStream;
                  } else {
                    delete next[targetId];
                  }
                }
                return next;
              });
            };
          });
        });
      };
      pc.oniceconnectionstatechange = () => {
        const s = pc.iceConnectionState;
        if (s === "connected" || s === "completed") { setIsConnecting(false); }
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socketRef.current.emit("rtc:candidate", { to: targetId, roomKey, candidate: e.candidate });
        }
      };
    }
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.emit("rtc:offer", { to: targetId, roomKey, offer, from: user?._id });
  };

  const toggleScreenShare = async () => {
    if (!localStream && !cameraStream) return;
    try {
      if (!isScreenSharing) {
        const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const screenTrack = display.getVideoTracks()[0];
        const audioTrack = display.getAudioTracks()[0];
        if (!screenTrack) return;
        
        const audioTracks = cameraStream ? cameraStream.getAudioTracks() : (localStream ? localStream.getAudioTracks() : []);
        const newStream = new MediaStream([screenTrack, ...(audioTrack ? [audioTrack] : audioTracks)]);
        
        Object.values(peerConnectionsRef.current).forEach(async (pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) {
            try {
              await sender.replaceTrack(screenTrack);
            } catch (err) {
              console.error("Error replacing track:", err);
            }
          }
        });
        
        setLocalStream(newStream);
        setIsScreenSharing(true);
        
        screenTrack.onended = async () => {
          if (cameraStream) {
            const camTrack = cameraStream.getVideoTracks()[0];
            if (camTrack) {
              Object.values(peerConnectionsRef.current).forEach(async (pc) => {
                const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
                if (sender) {
                  try {
                    await sender.replaceTrack(camTrack);
                  } catch (err) {
                    console.error("Error replacing track:", err);
                  }
                }
              });
            }
            setLocalStream(cameraStream);
            setIsScreenSharing(false);
          }
        };
      } else if (cameraStream) {
        const camTrack = cameraStream.getVideoTracks()[0];
        if (camTrack) {
          Object.values(peerConnectionsRef.current).forEach(async (pc) => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
            if (sender) {
              try {
                await sender.replaceTrack(camTrack);
              } catch (err) {
                console.error("Error replacing track:", err);
              }
            }
          });
        }
        setLocalStream(cameraStream);
        setIsScreenSharing(false);
      }
    } catch { toast.error("Unable to share screen"); }
  };

  const addParticipantToCall = async (participantId) => {
    if (!participantId) return;
    if (!localStream) {
      await startVideoCall();
    }
    setCallTargets((prev) => (prev.includes(participantId) ? prev : [...prev, participantId]));
    socketRef.current.emit("rtc:ring", { to: participantId, roomKey: activeChatId });
  };

  const acceptRing = async (from, roomKey) => {
    try {
      let stream = localStream || cameraStream;
      if (!stream) {
        stream = await getSafeUserMedia();
        setLocalStream(stream);
        setCameraStream(stream);
      }
      activeChatIdRef.current = roomKey;
      setActiveChatId(roomKey);
      setIsVideoCallOpen(true);
      setIsConnecting(true);
      
      // Wait for dialog to open before setting video
      setTimeout(() => {
        if (localVideoRef.current && stream) {
          try {
            localVideoRef.current.srcObject = stream;
            const p = localVideoRef.current.play();
            if (p && typeof p.then === "function") {
              p.catch((err) => {
                console.error("Error playing video on accept:", err);
                setTimeout(() => {
                  if (localVideoRef.current && stream) {
                    try {
                      localVideoRef.current.srcObject = stream;
                      localVideoRef.current.play().catch(() => {});
                    } catch {}
                  }
                }, 200);
              });
            }
          } catch (err) {
            console.error("Error setting video on accept:", err);
          }
        }
      }, 100);
      
      socketRef.current.emit("rtc:ring:accept", { to: from, roomKey });
      setIncomingCall(null);
    } catch (err) {
      console.error("Error accepting ring:", err);
      toast.error("Unable to start media");
    }
  };

  const declineRing = (from, roomKey) => {
    socketRef.current.emit("rtc:ring:decline", { to: from, roomKey });
    setIncomingCall(null);
  };

  const getSafeUserMedia = async () => {
    let videoTrack = null;
    let audioTrack = null;
    try {
      const both = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      const v = both.getVideoTracks()[0];
      const a = both.getAudioTracks()[0];
      if (v) videoTrack = v;
      if (a) audioTrack = a;
    } catch {
      try {
        const vOnly = await navigator.mediaDevices.getUserMedia({ video: true });
        const v = vOnly.getVideoTracks()[0];
        if (v) videoTrack = v;
      } catch { /* no video */ }
      try {
        const aOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
        const a = aOnly.getAudioTracks()[0];
        if (a) audioTrack = a;
      } catch { /* no audio */ }
    }
    if (!videoTrack && !audioTrack) {
      throw new Error("Media devices unavailable");
    }
    return new MediaStream([...(videoTrack ? [videoTrack] : []), ...(audioTrack ? [audioTrack] : [])]);
  };

  const toggleMic = () => {
    const targetStream = cameraStream || localStream;
    const tracks = targetStream ? targetStream.getAudioTracks() : [];
    const next = !micEnabled;
    tracks.forEach((t) => { t.enabled = next; });
    setMicEnabled(next);
  };

  const toggleCamera = () => {
    const targetStream = cameraStream || localStream;
    const tracks = targetStream ? targetStream.getVideoTracks() : [];
    const next = !cameraEnabled;
    tracks.forEach((t) => { t.enabled = next; });
    setCameraEnabled(next);
  };

  const getChatAvatar = (chat) => {
    const avatarSource = chat?.avatar || chat?.participant?.profilePic;
    if (avatarSource) {
      return <AvatarImage src={avatarSource} />;
    }
    return null;
  };

  const getChatTitle = (chat) => {
    if (!chat) return "Incoming Call";
    if (chat.type === "public") return "Public Chat";
    return chat.name || "Chat";
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!canSendMessage) return;
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now - messageDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return messageDate.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const shouldShowAvatar = (currentIndex) => {
    if (!Array.isArray(activeMessages) || !activeMessages.length) return false;
    if (currentIndex === 0) return true;
    const currentMsg = activeMessages[currentIndex];
    const prevMsg = activeMessages[currentIndex - 1];
    if (!currentMsg || !prevMsg) return true;
    return (
      currentMsg.sender.id !== prevMsg.sender.id ||
      new Date(currentMsg.timestamp) - new Date(prevMsg.timestamp) > 300000
    );
  };

  return (<>
    <div className="min-h-screen mt-15">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        {/* Sidebar */}
        <Sidebar portalType="supervisor" />

        {/* Main Chat Interface */}
        <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
          {/* Header */}
          <Card className="mb-5 p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl border-none">
            <div className="flex items-center justify-between">
              {/* Mobile Chats Toggle */}
              <button
                onClick={() => setIsChatsOpen(!isChatsOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 mr-3"
                aria-label="Toggle chats"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Left: Avatar + Title */}
              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  {activeChat?.avatar ? (
                    <Avatar className="w-14 h-14 border-2 border-purple-500/20 dark:border-gray-600">
                      {getChatAvatar(activeChat)}
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                        {activeChat.name?.[0]?.toUpperCase() || "C"}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      {activeChat ? getChatIcon(activeChat) : <MessageCircle className="w-7 h-7 text-white" />}
                    </div>
                  )}
                  {activeChat?.type === "individual" && activeChat?.participant ? (
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                        onlineUsers.has(activeChat.participant.id) ? "bg-green-500" : "bg-gray-400"
                      }`}
                    ></div>
                  ) : (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </div>

                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                    <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {activeChat ? getChatTitle(activeChat) : "Chat"}
                    </span>
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    {activeChat?.type === "public" ? (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        All students
                      </>
                    ) : activeChat?.type === "group" ? (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {activeChat.participants?.filter((p) => onlineUsers.has(p.id)).length || 0} online
                      </>
                    ) : activeChat?.participant ? (
                      <>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            onlineUsers.has(activeChat.participant.id) ? "bg-green-500" : "bg-gray-400"
                          }`}
                        ></span>
                        {onlineUsers.has(activeChat.participant.id) ? "Online" : "Offline"}
                      </>
                    ) : (
                      <>
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Online
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* ✅ Right: Call Buttons */}
              <div className="flex items-center gap-3">
                {/* Voice Call */}
                <button
                  onClick={() => console.log("Voice call")}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm"
                  aria-label="Voice Call"
                >
                  <Phone className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>

                {/* Video Call */}
                <button
                  onClick={startVideoCall}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm"
                  aria-label="Video Call"
                >
                  <Video className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </Card>


          {/* Chat Messages Container */}
          <Card className="flex-1 flex flex-col mb-5 bg-white dark:bg-gray-800 shadow-lg rounded-2xl border-none overflow-hidden">
            <div
              className="flex-1 overflow-y-auto p-6 space-y-4 
    bg-gradient-to-b from-gray-50/50 to-white 
    dark:from-gray-900/50 dark:to-gray-800 
    max-h-[70vh]"
            >
              {roomsLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : !activeChat ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  No chats available yet. Join or create a group to start collaborating.
                </div>
              ) : (
                <>
                  {isActiveChatLoading && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                    </div>
                  )}

                  {!isActiveChatLoading && activeMessages.length === 0 && (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
                      Start the conversation in {getChatTitle(activeChat)}.
                    </div>
                  )}

              {activeMessages.map((message, index) => {
                    const sender = message.sender || {};
                    const isCurrentUser = sender.id === user?._id;
                const showAvatar = shouldShowAvatar(index);
                    const isSupervisor = sender.role === "supervisor";

                return (
                  <div
                        key={message.id || `${message.roomKey}-${index}`}
                    className={`flex gap-3 ${isCurrentUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    {!isCurrentUser && showAvatar && (
                      <Avatar className="w-9 h-9 border-2 border-purple-500/20 dark:border-gray-600 flex-shrink-0">
                            <AvatarImage src={sender.profilePic || userImg} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                              {sender.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`flex flex-col gap-1 max-w-[75%] md:max-w-[65%] ${isCurrentUser ? "items-end" : "items-start"}`}>
                      {!isCurrentUser && showAvatar && (
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {sender.username || "Unknown"}
                          </span>
                          {isSupervisor && <Crown className="w-3 h-3 text-yellow-500 dark:text-yellow-400" />}
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-5 py-3 shadow-md relative group ${isCurrentUser
                          ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-sm"
                          : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-600"
                          }`}
                      >
                        {isCurrentUser && !message.isDeleted && (
                          <DropdownMenu open={deleteMenuOpen[message.id]} onOpenChange={(open) => setDeleteMenuOpen((prev) => ({ ...prev, [message.id]: open }))}>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-800 dark:bg-gray-700 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleDeleteMessage(message.id, false)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete for me
                              </DropdownMenuItem>
                              {isCurrentUser && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteMessage(message.id, true)}
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete for everyone
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {!isCurrentUser && !message.isDeleted && (
                          <DropdownMenu open={deleteMenuOpen[message.id]} onOpenChange={(open) => setDeleteMenuOpen((prev) => ({ ...prev, [message.id]: open }))}>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-800 dark:bg-gray-700 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleDeleteMessage(message.id, false)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete for me
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {message.isDeleted ? (
                          <div className="text-sm italic opacity-70">
                            This message was deleted
                          </div>
                        ) : (
                          <>
                            {message.messageType === "image" && message.attachments?.length > 0 && (
                              <div className="mb-2 rounded-lg overflow-hidden relative">
                                <img
                                  src={message.attachments[0].url}
                                  alt={message.attachments[0].fileName || "Image"}
                                  className="max-w-full max-h-64 object-contain rounded-lg cursor-pointer"
                                  onContextMenu={(e) => handleImageContextMenu(e, message.id, message.attachments[0].url)}
                                  onClick={(e) => {
                                    if (e.ctrlKey || e.metaKey) {
                                      handleImageDownload(message.attachments[0].url, message.attachments[0].fileName);
                                    }
                                  }}
                                />
                                {contextMenu.open && contextMenu.messageId === message.id && (
                                  <div
                                    className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[150px]"
                                    style={{ left: contextMenu.x, top: contextMenu.y }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => {
                                        handleImageDownload(contextMenu.imageUrl, message.attachments[0]?.fileName);
                                        setContextMenu({ open: false, x: 0, y: 0, messageId: null, imageUrl: null });
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <Download className="w-4 h-4" />
                                      Download
                                    </button>
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                                    <button
                                      onClick={() => {
                                        handleDeleteMessage(message.id, false);
                                        setContextMenu({ open: false, x: 0, y: 0, messageId: null, imageUrl: null });
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete for me
                                    </button>
                                    {isCurrentUser && (
                                      <button
                                        onClick={() => {
                                          handleDeleteMessage(message.id, true);
                                          setContextMenu({ open: false, x: 0, y: 0, messageId: null, imageUrl: null });
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Delete for everyone
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            {message.messageType === "document" && message.attachments?.length > 0 && (
                              <div className="mb-2 p-3 bg-black/10 dark:bg-white/10 rounded-lg flex items-center gap-3">
                                <FileText className="w-6 h-6 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {message.attachments[0].fileName || "Document"}
                                  </p>
                                  <p className="text-xs opacity-70">
                                    {(message.attachments[0].fileSize / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                                <a
                                  href={message.attachments[0].url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline"
                                >
                                  Download
                                </a>
                              </div>
                            )}
                            {message.messageType === "contact" && message.contactData && (
                              <div className="mb-2 p-3 bg-black/10 dark:bg-white/10 rounded-lg flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={message.contactData.profilePic || userImg} />
                                  <AvatarFallback>
                                    {message.contactData.username?.[0]?.toUpperCase() || "C"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">
                                    {message.contactData.username || "Contact"}
                                  </p>
                                  {message.contactData.phone && (
                                    <p className="text-xs opacity-70">{message.contactData.phone}</p>
                                  )}
                                  {message.contactData.email && (
                                    <p className="text-xs opacity-70">{message.contactData.email}</p>
                                  )}
                                </div>
                              </div>
                            )}
                            {message.text && (
                              <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                {message.text}
                              </div>
                            )}
                          </>
                        )}
                            <div className={`flex items-center gap-2 mt-2 ${isCurrentUser ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>
                              <span className="text-xs">{formatTime(message.timestamp)}</span>
                              {isCurrentUser && (
                                <span className="text-xs flex items-center">
                                  {(() => {
                                    if (activeChat?.type === "individual" && activeChat?.participant) {
                                      const recipientId = activeChat.participant.id;
                                      const isRead = message.readBy?.includes(recipientId);
                                      return (
                                        <span className="flex items-center ml-1">
                                          {isRead ? (
                                            <svg className="w-4 h-4 text-blue-300" fill="currentColor" viewBox="0 0 16 16">
                                              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                                              <path d="M13.854 5.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 12.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                                            </svg>
                                          ) : (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                                              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                                              <path d="M13.854 5.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 12.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                                            </svg>
                                          )}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </span>
                              )}
                        </div>
                      </div>
                    </div>

                    {isCurrentUser && showAvatar && (
                      <Avatar className="w-9 h-9 border-2 border-purple-500/20 dark:border-gray-600 flex-shrink-0">
                        <AvatarImage src={user?.profilePic || userImg} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                          {user?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                onChange={handleDocumentSelect}
                className="hidden"
              />
              <div className="flex gap-3 items-end">
                <Popover open={isAttachmentMenuOpen} onOpenChange={setIsAttachmentMenuOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      disabled={!canSendMessage || uploading}
                      className="px-4 py-6 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start" side="top">
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          imageInputRef.current?.click();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Image className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Photos</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Share images</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Documents</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Share files</p>
                        </div>
                      </button>
                      <button
                        onClick={handleContactShare}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Contact</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Share your contact</p>
                        </div>
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    disabled={!canSendMessage || uploading}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (!canSendMessage || uploading) return;
                      handleKeyPress(e);
                    }}
                    placeholder={
                      activeChat
                        ? "Type your message... (Press Enter to send)"
                        : "Select a chat to start messaging"
                    }
                    className="w-full pr-12 py-6 rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-gray-500 transition-all duration-200"
                  />
                </div>
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={(!inputValue.trim() && !uploading) || !canSendMessage || uploading}
                  className="px-6 py-6 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-500 hover:via-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              {connectionError && (
                <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 rounded-lg">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    {connectionError}
                  </p>
                  {socketRef.current && !socketRef.current.connected && (
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Reconnecting...
                    </p>
                  )}
                </div>
              )}
              {socketRef.current && socketRef.current.connected && !connectionError && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  ✓ Connected
                </p>
              )}
            </div>
          </Card>

        </main>

        {/* Mobile Chats Sidebar */}
        {isChatsOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsChatsOpen(false)}
            ></div>
            <aside className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-80 bg-white dark:bg-gray-800 shadow-2xl lg:hidden">
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
              <div className="flex-1 overflow-y-auto p-2 bg-white dark:bg-gray-800">
                <div className="space-y-1">
                  {roomsLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                    </div>
                  ) : chats.length ? (
                    chats.map((chat) => (
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
                            {chat.avatar || chat.participant?.profilePic ? (
                            <Avatar className="w-full h-full">
                              {getChatAvatar(chat)}
                              <AvatarFallback className="bg-transparent text-white">
                                {chat.name?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            getChatIcon(chat)
                          )}
                        </div>
                          <div className="flex-1 min-w-0 relative">
                            <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-sm font-medium truncate ${chat.id === activeChatId
                              ? "text-purple-900 dark:text-gray-100"
                              : "text-gray-900 dark:text-gray-100"
                              }`}
                          >
                            {getChatTitle(chat)}
                          </p>
                              {unreadCounts[chat.id] > 0 && (
                                <span className="flex-shrink-0 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                  {unreadCounts[chat.id] > 99 ? "99+" : unreadCounts[chat.id]}
                                </span>
                              )}
                            </div>
                          <p
                            className={`text-xs mt-1 truncate ${chat.id === activeChatId
                              ? "text-purple-700 dark:text-gray-300"
                              : "text-gray-500 dark:text-gray-400"
                              }`}
                          >
                            {chatMessages[chat.id]?.length > 0
                                ? `${chatMessages[chat.id][chatMessages[chat.id].length - 1]?.text?.substring(0, 30) || ""
                                }...`
                              : "No messages yet"}
                          </p>
                            {chat.type === "individual" && chat.participant && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {onlineUsers.has(chat.participant.id) ? (
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    Online
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                    Offline
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">
                      No chats available yet.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Desktop Chats Sidebar */}
        <aside className="hidden lg:flex flex-col w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-none overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Chats
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {chats.length} {chats.length === 1 ? "chat" : "chats"}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 bg-white dark:bg-gray-800">
            <div className="space-y-1">
              {roomsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                </div>
              ) : chats.length ? (
                chats.map((chat) => (
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
                        {chat.avatar || chat.participant?.profilePic ? (
                        <Avatar className="w-full h-full">
                          {getChatAvatar(chat)}
                          <AvatarFallback className="bg-transparent text-white">
                            {chat.name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        getChatIcon(chat)
                      )}
                    </div>
                      <div className="flex-1 min-w-0 relative">
                        <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-sm font-medium truncate ${chat.id === activeChatId
                          ? "text-purple-900 dark:text-gray-100"
                          : "text-gray-900 dark:text-gray-100"
                          }`}
                      >
                        {getChatTitle(chat)}
                      </p>
                          {unreadCounts[chat.id] > 0 && (
                            <span className="flex-shrink-0 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                              {unreadCounts[chat.id] > 99 ? "99+" : unreadCounts[chat.id]}
                            </span>
                          )}
                        </div>
                      <p
                        className={`text-xs mt-1 truncate ${chat.id === activeChatId
                          ? "text-purple-700 dark:text-gray-300"
                          : "text-gray-500 dark:text-gray-400"
                          }`}
                      >
                        {chatMessages[chat.id]?.length > 0
                            ? `${chatMessages[chat.id][chatMessages[chat.id].length - 1]?.text?.substring(0, 30) || ""
                            }...`
                          : "No messages yet"}
                      </p>
                        {chat.type === "individual" && chat.participant && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {onlineUsers.has(chat.participant.id) ? (
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                Online
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                Offline
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">
                  No chats available yet.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
    <Dialog open={isVideoCallOpen} onOpenChange={(open) => { if (!open) endVideoCall(); }}>
      <DialogContent className="sm:max-w-2xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-lg">Video Call</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {!isConnecting && Object.entries(remoteStreams).length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-gray-900 text-white rounded-xl p-8">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 mb-3 flex items-center justify-center">
                <Avatar>
                  {getChatAvatar(activeChat)}
                  <AvatarFallback>
                    {activeChat?.participant?.username?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <p className="text-sm">Calling {getChatTitle(activeChat)}...</p>
              <div className="flex items-center gap-4 mt-6">
                <button onClick={toggleCamera} className={`w-10 h-10 rounded-full flex items-center justify-center ${cameraEnabled ? "bg-gray-800" : "bg-gray-700"}`}>
                  {cameraEnabled ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
                </button>
                <button onClick={toggleMic} className={`w-10 h-10 rounded-full flex items-center justify-center ${micEnabled ? "bg-gray-800" : "bg-gray-700"}`}>
                  {micEnabled ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
                </button>
                <button onClick={endVideoCall} className="w-10 h-10 rounded-full flex items-center justify-center bg-red-600">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video
                autoPlay
                playsInline
                className="w-full h-80 md:h-[28rem] object-cover"
                ref={remoteVideoRef}
              />
              <div className="absolute top-3 right-3 w-36 h-24 rounded-lg overflow-hidden shadow-md bg-black/60 z-10">
                <video
                  ref={(el) => {
                    localVideoRef.current = el;
                    const s = isScreenSharing ? localStream : (cameraStream || localStream);
                    if (el && s) {
                      try {
                        if (el.srcObject !== s) { el.srcObject = s; }
                        const p = el.play();
                        if (p && typeof p.then === "function") { p.catch(() => undefined); }
                      } catch { void 0; }
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-5">
                <button
                  onClick={toggleCamera}
                  className={`w-11 h-11 rounded-full flex items-center justify-center ${cameraEnabled ? "bg-gray-800/80" : "bg-gray-700/80"}`}
                  aria-label="Toggle Video">
                  {cameraEnabled ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
                </button>
                <button
                  onClick={toggleMic}
                  className={`w-11 h-11 rounded-full flex items-center justify-center ${micEnabled ? "bg-gray-800/80" : "bg-gray-700/80"}`}
                  aria-label="Toggle Mute">
                  {micEnabled ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
                </button>
                <button
                  onClick={endVideoCall}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-red-600"
                  aria-label="End Call">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          )}
          {Object.entries(remoteStreams).length !== 0 && (
            <div className="flex items-center gap-2">
              <Button onClick={toggleScreenShare} className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {isScreenSharing ? "Stop Share" : "Share Screen"}
              </Button>
              {activeChat?.participants?.length ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Add Participant</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-1">
                      {activeChat.participants.filter((m) => m.id !== user?._id).map((m) => (
                        <button key={m.id} onClick={() => addParticipantToCall(m.id)} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                          {m.username}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : null}
              <Button onClick={endVideoCall} className="bg-red-600 hover:bg-red-700 text-white ml-auto">End Call</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={!!incomingCall} onOpenChange={(open) => { if (!open) setIncomingCall(null); }}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-white border border-gray-200">
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            <Avatar>
              {getChatAvatar(incomingCall?.chat)}
              <AvatarFallback>
                {incomingCall?.chat?.participant?.username?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
          <p className="mt-2 text-base font-semibold">{getChatTitle(incomingCall?.chat) || "Incoming Call"}</p>
          <p className="text-sm text-gray-500">Incoming video call...</p>
          <div className="flex items-center gap-6 mt-6">
            <button onClick={() => declineRing(incomingCall?.from, incomingCall?.roomKey)} className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => acceptRing(incomingCall?.from, incomingCall?.roomKey)} className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>);
}

