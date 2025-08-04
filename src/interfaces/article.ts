export interface Article {
    id?: string;
    url: string;
    title?: string;
    content?: string;
    excerpt?: string;
    author?: string;
    summary?: string;
    publishedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    imageUrl?: string; // Optional field for the article image URL
    isFavorited?: boolean;
    isArchived?: boolean;
    notes?: object
}