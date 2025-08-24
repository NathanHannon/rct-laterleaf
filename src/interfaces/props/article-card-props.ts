import type { Article } from "../article";

export interface ArticleCardProps {
    article: Article;
    onDelete: (id: string) => void;
    onArchive: (id: string) => void;
    onToggleBookmark: (id: string) => void;
    onAddToLibrary?: (id: string) => void; // Add new prop
}