export interface Article {
    id: string;
    userArticleId: string;
    url: string;
    title: string;
    content?: string;
    contentText?: string;
    contentHtml?: string;
    excerpt?: string;
    author?: string;
    publishedAt?: string;
    isBookmarked: boolean;
    isArchived: boolean;
    summary?: string;
    createdAt: string;
}