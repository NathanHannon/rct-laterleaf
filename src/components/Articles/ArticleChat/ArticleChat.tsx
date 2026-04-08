import { useState } from 'react';
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    const queryClient = useQueryClient();
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');

    const { data: savedChatHistory = [] } = useQuery({
        queryKey: ['chat-history', articleId],
        queryFn: async () => {
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}/chat`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) return [];
            const data = await response.json();
            return (data.chatHistory || []) as ChatMessage[];
        },
        enabled: isOpen,
    });

    const clearMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            await fetch(`/api/articles/${articleId}/chat/clear`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
        },
        onSuccess: () => {
            setChatMessages([]);
            queryClient.setQueryData(['chat-history', articleId], []);
        },
    });

    const sendMutation = useMutation({
        mutationFn: async (message: string) => {
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
            return response.json();
        },
        onSuccess: (data) => {
            setChatMessages(data.chatHistory || []);
        },
    });

    const handleOpen = () => {
        setChatMessages([]);
    };

    const handleRecallHistory = () => {
        setChatMessages(savedChatHistory);
        queryClient.setQueryData(['chat-history', articleId], []);
    };

    const handleSendMessage = (message: string) => {
        if (!message.trim()) return;

        if (!userHasProAccess) {
            alert('Chat functionality is available for Pro users only. Please upgrade to access this feature.');
            return;
        }

        sendMutation.mutate(message);
    };

    const isGeneratingChat = sendMutation.isPending;

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
                        <div className="chat-header-actions">
                            {chatMessages.length > 0 && (
                                <button onClick={() => clearMutation.mutate()} className="clear-chat-button" title="Clear chat history">
                                    🗑
                                </button>
                            )}
                            <button onClick={onClose} className="close-chat-button" title="Close chat">
                                ✕
                            </button>
                        </div>
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
