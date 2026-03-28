export interface Article {
    id: string;
    userArticleId: string;
    url: string;
    title: string;
    content?: string;
    contentHtml?: string;
    excerpt?: string;
    imageUrl?: string;
    author?: string;
    publishDate?: string;
    isBookmarked: boolean;
    isLiked: boolean;
    isArchived: boolean;
    summary?: string;
    summaryStatus?: 'idle' | 'pending' | 'completed' | 'failed';
    summaryLanguage?: string;
    audioLocation?: string;
    narrationLocation?: string;
    narrationStatus?: string;
    createdAt: string;
    isUrlOnly?: boolean; // Flag for URL-only entries that failed extraction
    hasContent?: boolean; // Flag indicating if the user has access to the full content

    // Rich metadata fields
    siteName?: string;
    siteIcon?: string;
    ogImage?: string;
    ogDescription?: string;
    themeColor?: string;
    ogType?: string;
    metadataScrapedAt?: string;

    // Feed specific fields
    feedTitle?: string;
    feedUrl?: string;
    feedId?: string;
}
