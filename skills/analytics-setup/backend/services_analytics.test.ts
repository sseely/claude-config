// Tests for captureEvent — run with the project's Vitest + Workers pool
// (see testing-setup/config/vitest.config.ts). ADAPT: update the Env import
// path to match this project's actual types module.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { captureEvent } from './services_analytics';
import { Env } from '../types';

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    POSTHOG_API_KEY: 'phc_test_key',
    POSTHOG_HOST: 'https://posthog.test',
    ...overrides,
  } as Env;
}

describe('captureEvent', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('no-ops and does not call fetch when consent is not granted', () => {
    captureEvent(makeEnv(), 'user-1', 'test_event', false);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('no-ops when POSTHOG_API_KEY is unset, even with consent granted', () => {
    captureEvent(makeEnv({ POSTHOG_API_KEY: undefined }), 'user-1', 'test_event', true);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts to PostHog when consent is granted and a key is configured', async () => {
    captureEvent(makeEnv(), 'user-1', 'test_event', true, { properties: { foo: 'bar' } });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://posthog.test/capture/');
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      api_key: 'phc_test_key',
      event: 'test_event',
      distinct_id: 'user-1',
      properties: { foo: 'bar' },
    });
  });

  it('warns naming the HTTP status on a non-2xx response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    captureEvent(makeEnv(), 'user-1', 'test_event', true);
    await vi.waitFor(() =>
      expect(console.warn).toHaveBeenCalledWith('[posthog]', 'test_event', 'HTTP 500')
    );
  });

  it('warns with the error message on a network-level rejection', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    captureEvent(makeEnv(), 'user-1', 'test_event', true);
    await vi.waitFor(() =>
      expect(console.warn).toHaveBeenCalledWith('[posthog]', 'test_event', 'network down')
    );
  });
});
