import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { performArticleAction } from '../src/services/articleActions.ts';
import type { ArticleAction } from '../src/services/articleActions.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

for (const action of ['delete', 'archive', 'bookmark'] as ArticleAction[]) {
    test(`failed ${action} does not run success updates or change the cached article`, async () => {
        globalThis.fetch = async () => new Response('', { status: 503 });
        const client = new QueryClient();
        const articles = [{ id: 'article-1', isBookmarked: false, isArchived: false }];
        client.setQueryData(['articles'], articles);
        let errorReported = false;
        let successReported = false;
        const mutation = new MutationObserver(client, {
            mutationFn: () => performArticleAction('article-1', action, 'test-token'),
            onSuccess: () => { successReported = true; client.setQueryData(['articles'], []); },
            onError: () => { errorReported = true; },
        });
        await assert.rejects(mutation.mutate());
        assert.equal(errorReported, true);
        assert.equal(successReported, false);
        assert.deepEqual(client.getQueryData(['articles']), articles);
        client.clear();
    });
    test(`successful ${action} uses the correct endpoint and succeeds without a JSON response`, async () => {
        globalThis.fetch = async (url, options) => {
            assert.equal(url, `/api/articles/article-1${action === 'delete' ? '' : `/${action}`}`);
            assert.equal(options?.method, action === 'delete' ? 'DELETE' : 'POST');
            assert.deepEqual(options?.headers, { Authorization: 'Bearer test-token' });
            return new Response(null, { status: 204 });
        };
        await performArticleAction('article-1', action, 'test-token');
    });
}

test('network failure is rejected so the UI can offer a retry', async () => {
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
    await assert.rejects(performArticleAction('article-1', 'delete', 'test-token'), TypeError);
});

test('missing authentication does not send an update', async () => {
    globalThis.fetch = async () => { assert.fail('Must not send an unauthenticated update'); };
    await assert.rejects(performArticleAction('article-1', 'bookmark', null), /sign in again/);
});
