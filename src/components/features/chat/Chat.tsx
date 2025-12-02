import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { Message, Player } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ChatProps {
    roomId: string;
    currentUser: Player;
    players: Player[];
}

export default function Chat({ roomId, currentUser, players }: ChatProps) {
    const { t, language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [hasUnread, setHasUnread] = useState(false);
    const isFirstLoad = useRef(true);

    // Listen for messages
    useEffect(() => {
        if (!roomId) return;

        const messagesRef = collection(db, "rooms", roomId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = [];
            snapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() } as Message);
            });
            setMessages(msgs);

            if (isFirstLoad.current) {
                isFirstLoad.current = false;
            } else if (!isOpen && msgs.length > messages.length) {
                // Only show unread if we have NEW messages (length increased) and chat is closed
                setHasUnread(true);
            }
        });

        return () => unsubscribe();
    }, [roomId, isOpen, messages.length]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            setHasUnread(false);
        }
    }, [messages, isOpen]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const messageData: any = {
                senderId: currentUser.id,
                senderName: currentUser.name,
                text: newMessage.trim(),
                createdAt: Date.now()
            };

            if (replyingTo) {
                messageData.replyTo = {
                    id: replyingTo.id,
                    senderName: replyingTo.senderName,
                    text: replyingTo.text
                };
            }

            await addDoc(collection(db, "rooms", roomId, "messages"), messageData);
            setNewMessage("");
            setReplyingTo(null);
            setShowEmojiPicker(false);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setNewMessage((prev) => prev + emojiData.emoji);
    };

    const handleReply = (msg: Message) => {
        setReplyingTo(msg);
        // Focus input
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (input) input.focus();
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-4 right-4 z-50 p-4 rounded-full shadow-lg transition-all duration-300 ${isOpen ? "bg-gray-200 text-black rotate-90" : "bg-black text-white hover:scale-110"
                    }`}
            >
                <span className="material-symbols-outlined text-2xl">
                    {isOpen ? "close" : "chat"}
                </span>
                {!isOpen && hasUnread && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-white"></span>
                )}
            </button>

            {/* Chat Window */}
            <div
                className={`fixed bottom-20 right-4 w-80 md:w-96 bg-white border border-black shadow-2xl z-40 transition-all duration-300 transform origin-bottom-right flex flex-col ${isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
                    }`}
                style={{ height: "400px", maxHeight: "60vh" }}
            >
                {/* Header */}
                <div className="bg-black text-white p-3 flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white">{t("chatTitle")}</h3>
                    <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-300">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {messages.length === 0 && (
                        <p className="text-center text-gray-400 text-xs italic mt-4">
                            {t("chatPlaceholder")}
                        </p>
                    )}
                    {messages.map((msg) => {
                        const isMe = msg.senderId === currentUser.id;
                        const isSystem = msg.senderId === "system";
                        const sender = players.find(p => p.id === msg.senderId);
                        const avatar = sender ? sender.avatar : "bear.png"; // Fallback

                        if (isSystem) {
                            return (
                                <div key={msg.id} className="flex items-center justify-center my-2 opacity-60">
                                    <div className="h-[1px] bg-gray-400 w-8"></div>
                                    <span className="mx-2 text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                                        {msg.translationKey ? t(msg.translationKey, msg.translationParams) : msg.text}
                                    </span>
                                    <div className="h-[1px] bg-gray-400 w-8"></div>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}
                            >
                                {!isMe && (
                                    <img
                                        src={`/animals/${avatar}`}
                                        className="w-6 h-6 rounded-full bg-white border border-gray-200 object-contain mb-1"
                                        alt={msg.senderName}
                                    />
                                )}

                                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                                    <div
                                        className={`p-2 rounded-2xl text-sm shadow-sm w-full relative group ${isMe
                                            ? "bg-black text-white rounded-br-none"
                                            : "bg-gray-200 text-black rounded-bl-none"
                                            }`}
                                    >
                                        {/* Reply Context */}
                                        {msg.replyTo && (
                                            <div className={`mb-2 p-2 rounded text-xs border-l-4 ${isMe ? "bg-gray-800 border-gray-500" : "bg-gray-300 border-gray-500"
                                                } opacity-80`}>
                                                <p className="font-bold text-[10px]">{msg.replyTo.senderName}</p>
                                                <p className="truncate">{msg.replyTo.text}</p>
                                            </div>
                                        )}

                                        {/* Reply Button (Visible on Hover) */}
                                        <button
                                            onClick={() => handleReply(msg)}
                                            className={`absolute top-0 ${isMe ? "-left-8" : "-right-8"} p-1 rounded-full bg-gray-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity`}
                                            title={t("reply")}
                                        >
                                            <span className="material-symbols-outlined text-sm text-black">reply</span>
                                        </button>
                                        {!isMe && (
                                            <p className="text-[10px] font-bold opacity-70 mb-1 uppercase tracking-wider truncate max-w-[150px]">
                                                {msg.senderName}
                                            </p>
                                        )}
                                        <p className="break-words">{msg.text}</p>
                                        <p className={`text-[9px] text-right mt-1 ${isMe ? "text-gray-300" : "text-gray-500"}`}>
                                            {new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' }).format(new Date(msg.createdAt))}
                                        </p>
                                    </div>
                                </div>

                                {isMe && (
                                    <img
                                        src={`/animals/${currentUser.avatar}`}
                                        className="w-6 h-6 rounded-full bg-black border border-gray-200 object-contain mb-1"
                                        alt="Me"
                                    />
                                )}
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Reply Preview */}
                {replyingTo && (
                    <div className="p-2 bg-gray-100 border-t border-gray-200 flex justify-between items-center">
                        <div className="text-xs border-l-4 border-black pl-2">
                            <p className="font-bold text-black">{t("replyingTo")} {replyingTo.senderName}</p>
                            <p className="text-gray-600 truncate max-w-[200px]">{replyingTo.text}</p>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-black">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                )}

                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div className="absolute bottom-16 left-0 w-full z-50">
                        <EmojiPicker
                            onEmojiClick={onEmojiClick}
                            width="100%"
                            height={300}
                            previewConfig={{ showPreview: false }}
                        />
                    </div>
                )}

                {/* Input */}
                <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 bg-white flex gap-2 items-center">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`text-gray-500 hover:text-black transition-colors ${showEmojiPicker ? "text-yellow-500" : ""}`}
                    >
                        <span className="material-symbols-outlined">sentiment_satisfied</span>
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t("chatPlaceholder")}
                        className="flex-1 text-sm outline-none border-b border-gray-300 focus:border-black transition-colors px-1 py-1"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="text-black disabled:text-gray-300 hover:scale-110 transition-transform"
                    >
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </form>
            </div>
        </>
    );
}
