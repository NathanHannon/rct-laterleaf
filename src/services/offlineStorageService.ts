import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Article } from '../interfaces/article';

interface LaterLeafDB extends DBSchema {
    offlineArticles: {
        key: string;
        value: {
            id: string;
            articleData: Article;
            savedAt: number;
        };
    };
}

let dbPromise: Promise<IDBPDatabase<LaterLeafDB>> | null = null;

const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<LaterLeafDB>('LaterLeafOfflineDB', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('offlineArticles')) {
                    db.createObjectStore('offlineArticles', { keyPath: 'id' });
                }
            },
        });
    }
    return dbPromise;
};

export const saveOfflineArticle = async (article: Article): Promise<void> => {
    const db = await getDB();
    await db.put('offlineArticles', {
        id: article.id,
        articleData: article,
        savedAt: Date.now(),
    });
};

export const getOfflineArticle = async (id: string): Promise<Article | null> => {
    const db = await getDB();
    const result = await db.get('offlineArticles', id);
    return result ? result.articleData : null;
};

export const removeOfflineArticle = async (id: string): Promise<void> => {
    const db = await getDB();
    await db.delete('offlineArticles', id);
};

export const isArticleOffline = async (id: string): Promise<boolean> => {
    const db = await getDB();
    const result = await db.get('offlineArticles', id);
    return !!result;
};

export const getAllOfflineArticles = async (): Promise<Article[]> => {
    const db = await getDB();
    const all = await db.getAll('offlineArticles');
    return all.sort((a, b) => b.savedAt - a.savedAt).map(item => item.articleData);
};
