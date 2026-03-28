import React, { useState } from 'react';
import { useAuth } from "@clerk/react";
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faSpinner, faFileCsv, faFileCode } from '@fortawesome/free-solid-svg-icons';
import './ExportPage.scss';

const ExportPage: React.FC = () => {
    const { getToken } = useAuth();
    const [isExporting, setIsExporting] = useState<string | null>(null);

    const handleExport = async (format: 'csv' | 'html' | 'json') => {
        setIsExporting(format);

        try {
            const token = await getToken();
            const response = await fetch(`/api/export/${format}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to export data: ${response.statusText}`);
            }

            // Get the filename from the response headers
            const contentDisposition = response.headers.get('content-disposition');
            let filename = `laterleaf-export.${format}`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            // Create blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);

        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(null);
        }
    };

    const exportFormats = [
        {
            id: 'csv',
            name: 'CSV',
            description: 'Compatible with Excel, Readwise, Raindrop.io, and most services',
            icon: faFileCsv,
            details: 'Includes title, URL, summary, collections, tags, and metadata in spreadsheet format',
            color: '#10B981'
        },
        {
            id: 'html',
            name: 'HTML Bookmarks',
            description: 'Standard browser bookmark format compatible with most browsers and services',
            icon: faFileCode,
            details: 'Netscape bookmark format organized by collections, works with Pocket, browsers',
            color: '#E34F26'
        },
        {
            id: 'json',
            name: 'JSON',
            description: 'Complete structured data for developers and custom processing',
            icon: faFileCode,
            details: 'Full export with all metadata, relationships, and timestamps',
            color: '#6366F1'
        }
    ];

    return (
        <div className="export-page">
            <div className="page-container">
                <motion.header
                    className="premium-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                >
                    <div className="header-eyebrow">Data & Portability</div>
                    <h1 className="header-title">Export Your Data</h1>
                    <p className="header-subtitle">Download your saved articles, collections, and tags in various formats</p>
                    <div className="header-mesh"></div>
                </motion.header>

                <motion.div
                    className="export-formats"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: {
                            transition: {
                                staggerChildren: 0.1
                            }
                        }
                    }}
                >
                    {exportFormats.map((format) => (
                        <motion.div
                            key={format.id}
                            className="export-card"
                            variants={{
                                hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    filter: 'blur(0px)',
                                    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] }
                                }
                            }}
                        >
                            <div className="card-header">
                                <FontAwesomeIcon
                                    icon={format.icon}
                                    className="format-icon"
                                    style={{ color: format.color }}
                                />
                                <div className="format-info">
                                    <h3>{format.name}</h3>
                                    <p className="format-description">{format.description}</p>
                                </div>
                            </div>

                            <div className="format-details">
                                <p>{format.details}</p>
                            </div>

                            <button
                                className="export-button"
                                onClick={() => handleExport(format.id as 'csv' | 'html' | 'json')}
                                disabled={isExporting !== null}
                                style={{ borderColor: format.color }}
                            >
                                {isExporting === format.id ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faDownload} />
                                        Export as {format.name}
                                    </>
                                )}
                            </button>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div
                    className="export-info"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <h2>What's Included in Your Export</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <h4>📝 Article Data</h4>
                            <p>Titles, URLs, summaries, and content</p>
                        </div>
                        <div className="info-item">
                            <h4>📁 Collections</h4>
                            <p>Your organizational structure and collection names</p>
                        </div>
                        <div className="info-item">
                            <h4>🏷️ Tags</h4>
                            <p>All tags associated with your articles</p>
                        </div>
                        <div className="info-item">
                            <h4>⭐ Status</h4>
                            <p>Bookmarked and archive status for each article</p>
                        </div>
                        <div className="info-item">
                            <h4>📅 Dates</h4>
                            <p>When you saved each article</p>
                        </div>
                        <div className="info-item">
                            <h4>🔒 Privacy</h4>
                            <p>Only your data - export is private and secure</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="compatibility-info"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <h2>Service Compatibility</h2>
                    <div className="compatibility-grid">
                        <div className="compatibility-item">
                            <strong>CSV Format:</strong>
                            <span>Readwise, Raindrop.io, Notion, Excel, Google Sheets</span>
                        </div>
                        <div className="compatibility-item">
                            <strong>HTML Bookmarks:</strong>
                            <span>Chrome, Firefox, Safari, Pocket, Instapaper</span>
                        </div>
                        <div className="compatibility-item">
                            <strong>JSON Format:</strong>
                            <span>Custom applications, developers, future imports</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="privacy-note"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 }}
                >
                    <p>
                        <strong>Privacy Note:</strong> Your export contains only your personal data.
                        No user information from other accounts is included. The export is generated
                        securely and downloaded directly to your device.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default ExportPage;
