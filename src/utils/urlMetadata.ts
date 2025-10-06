/**
 * Utility functions for extracting URL metadata and creating rich previews
 */

export interface UrlMetadata {
    domain: string;
    siteName: string;
    favicon: string;
    isSecure: boolean;
}

/**
 * Extract metadata from a URL for rich preview display
 */
export function extractUrlMetadata(url: string): UrlMetadata {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;

        // Remove www. prefix for cleaner display
        const cleanDomain = domain.replace(/^www\./, '');

        // Generate site name from domain (capitalize first letter)
        const siteName = cleanDomain
            .split('.')
            .slice(0, -1) // Remove TLD
            .join('.')
            .split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('.');

        // Generate favicon URL
        const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

        return {
            domain: cleanDomain,
            siteName: siteName || cleanDomain,
            favicon,
            isSecure: urlObj.protocol === 'https:'
        };
    } catch {
        // Fallback for invalid URLs
        return {
            domain: 'Unknown Site',
            siteName: 'Unknown Site',
            favicon: '',
            isSecure: false
        };
    }
}

/**
 * Get a representative color for a domain (for gradient backgrounds)
 */
export function getDomainColor(domain: string): string {
    // Simple hash function to generate consistent colors
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
        const char = domain.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Generate HSL color with good saturation and lightness
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 55%)`;
}

/**
 * Format a URL for display (remove protocol, truncate if needed)
 */
export function formatUrlForDisplay(url: string, maxLength: number = 50): string {
    try {
        const urlObj = new URL(url);
        let displayUrl = urlObj.hostname + urlObj.pathname;

        // Remove trailing slash
        displayUrl = displayUrl.replace(/\/$/, '');

        // Truncate if too long
        if (displayUrl.length > maxLength) {
            displayUrl = displayUrl.substring(0, maxLength - 3) + '...';
        }

        return displayUrl;
    } catch {
        return url.length > maxLength ? url.substring(0, maxLength - 3) + '...' : url;
    }
}