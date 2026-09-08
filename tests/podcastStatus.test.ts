import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolvePodcastAudioUrl } from '../src/services/podcastStatus.ts';

test('saved podcast is playable before its status and captions request completes', () => {
    assert.equal(resolvePodcastAudioUrl(undefined, '/saved.mp3'), '/saved.mp3');
    assert.equal(resolvePodcastAudioUrl(undefined), null);
});

test('fresh status replaces an old saved URL', () => {
    assert.equal(resolvePodcastAudioUrl({ hasAudio: true, audioUrl: '/new.mp3' }, '/old.mp3'), '/new.mp3');
});

test('deletion or an empty server response never resurrects saved audio', () => {
    assert.equal(resolvePodcastAudioUrl(null, '/deleted.mp3'), null);
    assert.equal(resolvePodcastAudioUrl({ hasAudio: false, status: 'idle' }, '/deleted.mp3'), null);
    assert.equal(resolvePodcastAudioUrl({ hasAudio: false, status: 'pending' }, '/old.mp3'), null);
});
