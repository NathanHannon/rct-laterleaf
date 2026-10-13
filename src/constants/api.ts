const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
const apiVersion = (import.meta.env.VITE_API_URL_VERSION || 'v1').replace(/^\/+|\/+$/g, '');

export function apiUrl(path: string, version = apiVersion): string {
    const normalizedVersion = version.replace(/^\/+|\/+$/g, '');
    const normalizedPath = path.replace(/^\/+/, '');
    return `${apiBaseUrl}/${normalizedVersion}/${normalizedPath}`;
}