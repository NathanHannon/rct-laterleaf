export type ArticleAction = 'delete' | 'archive' | 'bookmark';

const failureMessages: Record<ArticleAction, string> = {
    delete: 'The article could not be deleted. Please try again.',
    archive: 'The archive change could not be saved. Please try again.',
    bookmark: 'The favorite change could not be saved. Please try again.',
};

export async function performArticleAction(articleId: string, action: ArticleAction, token: string | null): Promise<void> {
    if (!token) throw new Error('Please sign in again to update your library.');
    const suffix = action === 'delete' ? '' : `/${action}`;
    const response = await fetch(`/api/articles/${encodeURIComponent(articleId)}${suffix}`, {
        method: action === 'delete' ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
    // A rejected promise keeps TanStack Query from treating a failed request as success.
    if (!response.ok) throw new Error(failureMessages[action]);
}
