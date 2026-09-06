import { useAuth } from '@clerk/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastContext } from '../context/toastContextUtils';
import { performArticleAction } from '../services/articleActions';
import type { ArticleAction } from '../services/articleActions';

export function useArticleActions() {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();
    const { showError } = useToastContext();

    return useMutation({
        mutationFn: async ({ articleId, action }: { articleId: string; action: ArticleAction }) => {
            await performArticleAction(articleId, action, await getToken());
        },
        onError: (error) => {
            showError('Change not saved', error instanceof Error ? error.message : 'Please try again.');
        },
        onSuccess: async (_, { articleId }) => {
            // Refresh every library view so favorites, archive, and search stay consistent.
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['articles'] }),
                queryClient.invalidateQueries({ queryKey: ['article', articleId] }),
            ]);
        },
    });
}
