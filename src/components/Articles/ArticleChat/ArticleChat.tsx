import { useState } from 'react';
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { useToastContext } from '../../../context/toastContextUtils';
import './ArticleChat.scss';

function getSuggestions(title?: string, summary?: string): string[] {
    const suggestions: string[] = [];

    // Always include a generic main point question
    if (title) {
        suggestions.push(`What are the key takeaways from this article?`);
    } else {
        suggestions.push('Summarise the main points');
    }

    // Context-aware suggestions based on content signals
    const text = `${title || ''} ${summary || ''}`.toLowerCase();

    if (text.match(/study|research|data|findings|evidence|experiment/)) {
        suggestions.push('What methodology was used in this research?');
        suggestions.push('Are there any limitations to these findings?');
    } else if (text.match(/opinion|argue|debate|controversy|disagree/)) {
        suggestions.push('What are the strongest counter-arguments?');
        suggestions.push('How balanced is the author\'s perspective?');
    } else if (text.match(/how to|guide|tutorial|step|tips|advice/)) {
        suggestions.push('What are the most actionable steps?');
        suggestions.push('What common mistakes should I avoid?');
    } else if (text.match(/announce|launch|release|update|new/)) {
        suggestions.push('Why does this matter?');
        suggestions.push('How does this compare to alternatives?');
    } else {
        suggestions.push('What assumptions does the author make?');
        suggestions.push('What are the practical implications?');
    }

    // Cap at 3 suggestions
    return suggestions.slice(0, 3);
}

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
    articleTitle?: string;
    articleSummary?: string;
}

const ArticleChat = ({ articleId, isOpen, onClose, userHasProAccess, articleTitle, articleSummary }: ArticleChatProps) => {
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const { showWarning } = useToastContext();
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
            showWarning(
                'Chat is a Pro feature',
                'Upgrade to access article chat and ask questions about this piece.',
                8000,
                {
                    label: 'View plans',
                    onClick: () => navigate('/pricing'),
                },
            );
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
                                    <div className="suggestion-chips">
                                        {getSuggestions(articleTitle, articleSummary).map((s, i) => (
                                            <button
                                                key={i}
                                                className="suggestion-chip"
                                                onClick={() => {
                                                    setChatInput('');
                                                    handleSendMessage(s);
                                                }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
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
