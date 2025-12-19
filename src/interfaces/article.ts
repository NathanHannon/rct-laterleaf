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
    isArchived: boolean;
    summary?: string;
    summaryStatus?: 'idle' | 'pending' | 'completed' | 'failed';
    audioLocation?: string;
    createdAt: string;
    isUrlOnly?: boolean; // Flag for URL-only entries that failed extraction

    // Rich metadata fields
    siteName?: string;
    siteIcon?: string;
    ogImage?: string;
    ogDescription?: string;
    themeColor?: string;
    ogType?: string;
    metadataScrapedAt?: string;
}
