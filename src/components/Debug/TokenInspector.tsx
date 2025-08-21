import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

interface TokenInfo {
    issuedAt: string;
    expiresAt: string;
    expiresInMinutes: number;
    expiresInSeconds: number;
    issuedAgoSeconds: number;
    metadata: unknown;
    payload: Record<string, unknown>;
}

const TokenInspector: React.FC = () => {
    const { getToken, isLoaded } = useAuth();
    const { user } = useUser();
    const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
    const [refreshCount, setRefreshCount] = useState(0);

    const inspectToken = useCallback(async () => {
        if (!isLoaded) return;

        try {
            const token = await getToken();
            if (token) {
                // Decode JWT payload (base64)
                const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>;

                const now = Math.floor(Date.now() / 1000);
                const exp = payload.exp as number;
                const iat = payload.iat as number;
                const expiresIn = exp - now;
                const issuedAgo = now - iat;

                setTokenInfo({
                    issuedAt: new Date(iat * 1000).toLocaleTimeString(),
                    expiresAt: new Date(exp * 1000).toLocaleTimeString(),
                    expiresInMinutes: Math.floor(expiresIn / 60),
                    expiresInSeconds: expiresIn,
                    issuedAgoSeconds: issuedAgo,
                    metadata: user?.publicMetadata || {},
                    payload: payload
                });

                setRefreshCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Token inspection failed:', error);
        }
    }, [isLoaded, getToken, user?.publicMetadata]);

    // Check token every 10 seconds
    useEffect(() => {
        if (isLoaded) {
            inspectToken();
            const interval = setInterval(inspectToken, 10000);
            return () => clearInterval(interval);
        }
    }, [isLoaded, inspectToken]);

    if (!isLoaded || !tokenInfo) {
        return <div>Loading token inspector...</div>;
    }

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'white',
            border: '2px solid #ccc',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '12px',
            maxWidth: '400px',
            zIndex: 9999,
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
            <h4>🔍 JWT Token Inspector</h4>
            <div><strong>Refresh Count:</strong> {refreshCount}</div>
            <div><strong>Issued:</strong> {tokenInfo.issuedAt}</div>
            <div><strong>Expires:</strong> {tokenInfo.expiresAt}</div>
            <div><strong>Expires in:</strong> {tokenInfo.expiresInMinutes}m {tokenInfo.expiresInSeconds % 60}s</div>
            <div><strong>Age:</strong> {Math.floor(tokenInfo.issuedAgoSeconds / 60)}m {tokenInfo.issuedAgoSeconds % 60}s</div>

            <h5>📋 Metadata:</h5>
            <pre style={{ fontSize: '10px', background: '#f5f5f5', padding: '5px' }}>
                {JSON.stringify(tokenInfo.metadata, null, 2)}
            </pre>

            <h5>🎫 JWT Claims:</h5>
            <div><strong>Sub:</strong> {String(tokenInfo.payload.sub)}</div>
            <div><strong>Session ID:</strong> {String(tokenInfo.payload.sid ?? '')}</div>
        </div>
    );
};

export default TokenInspector;
