import { useState } from 'react';
import { useAuth } from "@clerk/react";
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ArticleChat.scss';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

interface ArticleChatProps {
    articleId: string;
    isOpen: boolean;
    onClose: () => void;
    userHasProAccess: boolean;
}

const ArticleChat = ({ articleId, isOpen, onClose, userHasProAccess }: ArticleChatProps) => {
    const { getToken } = useAuth();
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [savedChatHistory, setSavedChatHistory] = useState<ChatMessage[]>([]);
    const [isGeneratingChat, setIsGeneratingChat] = useState(false);
    const [chatInput, setChatInput] = useState('');

    const loadHistory = async () => {
        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/chat`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setSavedChatHistory(data.chatHistory || []);
            }
        } catch {
            // silently fail — user can still start a new chat
        }
    };

    // Load history when panel opens (but don't show it — just cache for recall button)
    const handleOpen = () => {
        setChatMessages([]);
        loadHistory();
    };

    const handleRecallHistory = () => {
        setChatMessages(savedChatHistory);
        setSavedChatHistory([]);
    };

    const handleSendMessage = async (message: string) => {
        if (!message.trim()) return;

        if (!userHasProAccess) {
            alert('Chat functionality is available for Pro users only. Please upgrade to access this feature.');
            return;
        }

        setIsGeneratingChat(true);

        try {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) throw new Error('Failed to generate chat response');

            const data = await response.json();
            setChatMessages(data.chatHistory || []);
        } catch {
            // no-op: could show an inline error in future
        } finally {
            setIsGeneratingChat(false);
        }
    };

    return (
        <AnimatePresence onExitComplete={() => setChatMessages([])}>
            {isOpen && (
                <motion.div
                    className="article-chat-panel"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    onAnimationStart={() => { if (isOpen) handleOpen(); }}
                >
                    <div className="chat-panel-header">
                        <h3>💬 Article Chat</h3>
                        <button onClick={onClose} className="close-chat-button" title="Close chat">
                            ✕
                        </button>
                    </div>
                    <div className="chat-interface">
                        <div className="chat-messages">
                            {chatMessages.length === 0 && !isGeneratingChat && (
                                <div className="chat-empty-state">
                                    <p>Ask anything about this article</p>
                                    {savedChatHistory.length > 0 && (
                                        <button
                                            className="recall-history-button"
                                            onClick={handleRecallHistory}
                                            title="Resume your previous conversation"
                                        >
                                            💬 Resume previous conversation
                                        </button>
                                    )}
                                </div>
                            )}
                            {chatMessages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`chat-message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                                >
                                    <div className="message-content">
                                        {msg.role === 'assistant' ? (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isGeneratingChat && (
                                <div className="chat-message assistant-message">
                                    <div className="message-content">
                                        <div className="typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="chat-input">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (chatInput.trim()) {
                                        handleSendMessage(chatInput);
                                        setChatInput('');
                                    }
                                }}
                            >
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask about this article..."
                                    disabled={isGeneratingChat}
                                    className="chat-input-field"
                                />
                                <button
                                    type="submit"
                                    disabled={isGeneratingChat || !chatInput.trim()}
                                    className="chat-send-button"
                                >
                                    Send
                                </button>
                            </form>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ArticleChat;
