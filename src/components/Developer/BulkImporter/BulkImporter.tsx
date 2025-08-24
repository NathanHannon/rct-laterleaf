import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './BulkImporter.scss';

const BulkImporter: React.FC = () => {
    const { getToken } = useAuth();
    const [urls, setUrls] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    const handleImport = async () => {
        setIsImporting(true);
        setLogs(['🚀 Starting bulk import...']);

        const token = await getToken();
        if (!token) {
            setLogs(prev => [...prev, '🔥 Could not get authentication token. Are you signed in?']);
            setIsImporting(false);
            return;
        }

        const urlList = urls.split('\n').filter(url => url.trim() !== '');
        let successCount = 0;

        for (const [index, url] of urlList.entries()) {
            const logPrefix = `[${index + 1}/${urlList.length}]`;
            try {
                // Corrected endpoint to trigger full import pipeline
                const response = await fetch('/api/articles/import', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ url })
                });

                if (response.ok) {
                    successCount++;
                    setLogs(prev => [...prev, `✅ ${logPrefix} Successfully imported: ${url}`]);
                } else {
                    const errorText = await response.text();
                    setLogs(prev => [...prev, `❌ ${logPrefix} Failed for ${url}: ${response.status} - ${errorText}`]);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                setLogs(prev => [...prev, `🔥 ${logPrefix} Network error for ${url}: ${errorMessage}`]);
            }
            // Add a small delay to be kind to the API and allow processing
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setLogs(prev => [...prev, `\n🎉 Import complete! Successfully imported and processed ${successCount} of ${urlList.length} articles.`]);
        setIsImporting(false);
    };

    return (
        <div className="bulk-importer">
            <h2>Developer Bulk Importer</h2>
            <p>Paste article URLs below (one per line) to import them into your library.</p>
            <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://example.com/article-1&#10;https://example.com/article-2&#10;..."
                rows={15}
                disabled={isImporting}
            />
            <button onClick={handleImport} disabled={isImporting || !urls.trim()}>
                {isImporting ? 'Importing...' : 'Start Import'}
            </button>
            {logs.length > 0 && (
                <pre className="bulk-importer-logs">
                    {logs.join('\n')}
                </pre>
            )}
        </div>
    );
};

export default BulkImporter;