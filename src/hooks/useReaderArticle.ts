import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Article } from '../interfaces/article';
import { getOfflineArticle, isArticleOffline, removeOfflineArticle, saveOfflineArticle } from '../services/offlineStorageService';
import { useToastContext } from '../context/toastContextUtils';

export function useReaderArticle(articleId: string | undefined) {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();
    const { showError } = useToastContext();
    const [isAvailableOffline, setIsAvailableOffline] = useState(false);
    const [isSavingOffline, setIsSavingOffline] = useState(false);

    const query = useQuery({
        queryKey: ['article', articleId],
        enabled: !!articleId,
        // Local storage must remain readable while TanStack Query knows we are offline.
        networkMode: 'always',
        queryFn: async ({ signal }) => {
            if (!articleId) return null;
            const offlineData = await getOfflineArticle(articleId).catch(() => null);
            if (!navigator.onLine) {
                if (offlineData) return offlineData;
                throw new Error('You are offline and this article is not saved for offline reading.');
            }
            const token = await getToken();
            const response = await fetch(`/api/articles/${articleId}`, { signal, headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) throw new Error('Failed to fetch article');
            const data = await response.json() as Article;
            // Storage limits should not prevent the online article from opening.
            if (offlineData) await saveOfflineArticle(data).catch(() => {
                showError('Offline copy not updated', 'You can still read this article online.');
            });
            return data;
        },
        refetchInterval: (query) => navigator.onLine && query.state.data?.summaryStatus === 'pending' ? 1000 : false,
    });

    useEffect(() => {
        let active = true;
        setIsAvailableOffline(false);
        if (articleId) {
            isArticleOffline(articleId).then(value => { if (active) setIsAvailableOffline(value); }).catch(() => { /* Online reading is still available. */ });
        }
        return () => { active = false; };
    }, [articleId]);

    const setArticle = (value: Article | null | undefined | ((previous: Article | null | undefined) => Article | null | undefined)) => {
        queryClient.setQueryData<Article | null>(['article', articleId], previous => {
            const next = typeof value === 'function' ? value(previous) : value;
            return next === undefined ? previous : next;
        });
    };

    const handleToggleOffline = async () => {
        if (!query.data || !articleId || isSavingOffline) return;
        setIsSavingOffline(true);
        try {
            if (isAvailableOffline) await removeOfflineArticle(articleId);
            else await saveOfflineArticle(query.data);
            setIsAvailableOffline(!isAvailableOffline);
        } catch {
            showError('Offline change not saved', 'Please check your available storage and try again.');
        } finally {
            setIsSavingOffline(false);
        }
    };

    return { ...query, setArticle, isAvailableOffline, isSavingOffline, handleToggleOffline };
}
