import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import './FAQPage.scss';
import UpgradeButton from '../../../Common/Controls/UpgradeButton/UpgradeButton';

const FAQPage: React.FC = () => {
    const [openId, setOpenId] = useState<string | null>(null);

    const toggleItem = (id: string) => {
        setOpenId(openId === id ? null : id);
    };

    const faqData = [
        {
            id: 'what-is-laterleaf',
            question: 'What is Later Leaf?',
            answer: 'Later Leaf is a modern article management platform that helps you save, organize, and rediscover content that matters to you. We provide AI-powered summarization, smart organization tools, and advanced search capabilities to help you build your personal knowledge library.'
        },
        {
            id: 'how-to-save-articles',
            question: 'How do I save articles to Later Leaf?',
            answer: 'You can save articles by using our "Add Article" feature on the main dashboard. Simply paste the URL of any article, and Later Leaf will automatically fetch the content, generate a summary, and add it to your library. You can then organize it into collections and add tags for easy retrieval.'
        },
        {
            id: 'free-vs-pro',
            question: 'What\'s the difference between Free and Pro accounts?',
            answer: 'Free accounts include basic article saving, summarization, and organization features with a monthly limit on AI-generated summaries. Pro accounts offer unlimited summaries, advanced chat functionality to discuss articles with AI, priority support, and access to advanced search features.'
        },
        {
            id: 'how-to-upgrade',
            question: 'How do I upgrade to Pro?',
            answer: 'Upgrading to Pro is easy! Just go to the "Account" section in Later Leaf, and you\'ll see an option to upgrade to Pro. Follow the prompts to enter your payment information and choose your subscription plan. Once upgraded, you\'ll instantly unlock all Pro features.'
        },
        {
            id: 'ai-summarization',
            question: 'How does AI summarization work?',
            answer: 'Our AI analyzes the full text of saved articles and generates concise summaries that capture the key points and main ideas. The summaries are processed securely and are designed to help you quickly understand content without reading the entire article. You can regenerate summaries if needed.'
        },
        {
            id: 'data-privacy',
            question: 'Is my data private and secure?',
            answer: 'Yes, we take your privacy seriously. Your saved articles and personal data are encrypted and stored securely. We do not sell or share your personal information with third parties. AI processing is done securely with data protection measures in place. You can delete your account and data at any time.'
        },
        {
            id: 'collections',
            question: 'How do collections work?',
            answer: 'Collections allow you to organize related articles into groups. You can create collections for different topics, projects, or interests. Articles can be added to multiple collections, and you can easily view all articles within a specific collection. Collections help you keep your knowledge library organized and accessible.'
        },
        {
            id: 'search-functionality',
            question: 'How does the search feature work?',
            answer: 'Later Leaf offers intelligent search that looks through your article titles, content, summaries, and tags. Pro users get access to semantic search, which understands context and meaning, making it easier to find articles even if you don\'t remember exact keywords.'
        },
        {
            id: 'mobile-access',
            question: 'Can I access Later Leaf on mobile devices?',
            answer: 'Yes! Later Leaf is designed to be fully responsive and works great on mobile devices through your web browser. You can save, read, and organize articles from any device with internet access.'
        },
        {
            id: 'export-data',
            question: 'Can I export my data?',
            answer: 'Yes, you can export your saved articles and collections at any time. This includes the original article content, summaries, and your organizational structure. We believe your data should always be portable and accessible to you.'
        },
        {
            id: 'site-compatibility',
            question: 'Which websites work with LaterLeaf?',
            answer: 'LaterLeaf works well with many popular news sites, blogs, and open web content. However, some sites with heavy paywalls, complex javascript, or content protection may not be fully supported yet. We\'re continuously working to improve compatibility while respecting publishers\' rights.'
        },
        {
            id: 'account-deletion',
            question: 'How do I delete my account?',
            answer: 'You can delete your account through your account settings. When you delete your account, all your saved articles, collections, and personal data will be permanently removed from our servers. This action cannot be undone, so please make sure to export any data you want to keep first.'
        },
        {
            id: 'browser-support',
            question: 'Which browsers are supported?',
            answer: 'Later Leaf works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience.'
        },
        {
            id: 'technical-issues',
            question: 'I\'m experiencing technical issues. What should I do?',
            answer: 'If you\'re experiencing technical problems, try refreshing the page first. If the issue persists, please contact our technical support at tech@laterleaf.com with details about the problem, including your browser and operating system information.'
        },
        {
            id: 'billing-questions',
            question: 'I have questions about billing or my subscription.',
            answer: 'For billing inquiries, subscription changes, or payment issues, please contact our support team at support@laterleaf.com. We\'ll be happy to help you with any account-related questions.'
        },
        {
            id: 'feature-requests',
            question: 'Can I request new features?',
            answer: 'Absolutely! We love hearing from our users about features that would make Later Leaf more useful. Please send your feature requests and suggestions to support@laterleaf.com. We review all feedback and consider it for future updates.'
        }
    ];

    const categories = [
        {
            title: 'Getting Started',
            items: faqData.filter(item => ['what-is-laterleaf', 'how-to-save-articles', 'collections'].includes(item.id))
        },
        {
            title: 'Features & Functionality',
            items: faqData.filter(item => ['ai-summarization', 'search-functionality', 'free-vs-pro'].includes(item.id))
        },
        {
            title: 'Privacy & Security',
            items: faqData.filter(item => ['data-privacy', 'export-data', 'account-deletion'].includes(item.id))
        },
        {
            title: 'Technical Support',
            items: faqData.filter(item => ['site-compatibility', 'mobile-access', 'browser-support', 'technical-issues'].includes(item.id))
        },
        {
            title: 'Account & Billing',
            items: faqData.filter(item => ['billing-questions', 'feature-requests'].includes(item.id))
        }
    ];

    return (
        <div className="faq-page">
            <div className="page-container">
                <h1>Frequently Asked Questions</h1>

                <section className="intro">
                    <p>
                        Find answers to common questions about Later Leaf. If you can't find what you're looking for,
                        feel free to <a href="/contact">contact our support team</a>.
                    </p>
                </section>

                <div className="faq-content">
                    {categories.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="faq-category">
                            <h2>{category.title}</h2>
                            <div className="faq-items">
                                {category.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`faq-item ${openId === item.id ? 'open' : ''}`}
                                    >
                                        <button
                                            className="faq-question"
                                            onClick={() => toggleItem(item.id)}
                                            aria-expanded={openId === item.id ? 'true' : 'false'}
                                        >
                                            <span>{item.question}</span>
                                            <FontAwesomeIcon
                                                icon={faChevronDown}
                                                className={`chevron-icon ${openId === item.id ? 'up' : ''}`}
                                            />
                                        </button>
                                        {openId === item.id && (
                                            <div className="faq-answer">
                                                <p>{item.answer}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="contact-section">
                    <h2>Ready to Go Pro?</h2>
                    <p>Unlock unlimited AI summaries, article chat, and advanced features.</p>
                    <UpgradeButton />
                </div>

                <div className="contact-section">
                    <h2>Still have questions?</h2>
                    <p>
                        If you couldn't find the answer you were looking for, we're here to help!
                        Reach out to our support team and we'll get back to you as soon as possible.
                    </p>
                    <a href="/contact" className="contact-button">Contact Support</a>
                </div>
            </div>
        </div>
    );
};

export default FAQPage;
