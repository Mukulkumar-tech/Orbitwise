import { StrictMode, useState } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import useQuery from './useQuery.js';

afterEach(cleanup);

/** Minimal probe that renders whatever useQuery reports. */
function Probe({ fetcher, deps = [], options }) {
  const { data, isLoading, isError, isEmpty, error, refetch } = useQuery(fetcher, deps, options);
  return (
    <div>
      <span data-testid="status">
        {isLoading ? 'loading' : isError ? `error:${error.message}` : isEmpty ? 'empty' : String(data)}
      </span>
      <button type="button" onClick={refetch}>
        refetch
      </button>
    </div>
  );
}

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('useQuery', () => {
  it('shows loading, then the resolved data', async () => {
    render(<Probe fetcher={() => Promise.resolve('courses')} />);

    expect(screen.getByTestId('status').textContent).toBe('loading');

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('courses'));
  });

  it('resolves under StrictMode double-mounting', async () => {
    // Regression guard. StrictMode mounts, tears down, then remounts. A
    // mounted-flag that is only cleared on teardown stays false forever, so every
    // response gets discarded and the UI sits on its skeleton indefinitely.
    render(
      <StrictMode>
        <Probe fetcher={() => Promise.resolve('resolved-under-strict')} />
      </StrictMode>
    );

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('resolved-under-strict'));
  });

  it('reports an error and recovers on refetch', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('recovered');

    render(<Probe fetcher={fetcher} />);
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('error:boom'));

    await act(async () => {
      screen.getByRole('button', { name: 'refetch' }).click();
    });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('recovered'));
  });

  it('flags a successful-but-empty result separately from loading', async () => {
    render(<Probe fetcher={() => Promise.resolve([])} />);
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('empty'));
  });

  it('discards a slow earlier response when deps change', async () => {
    // The out-of-order race: a user types a filter, the first (slow) request
    // resolves after the second, and the UI ends up showing results for filters
    // the user has already moved past.
    const first = deferred();
    const second = deferred();

    function Harness() {
      const [query, setQuery] = useState('a');
      return (
        <div>
          <Probe fetcher={() => (query === 'a' ? first.promise : second.promise)} deps={[query]} />
          <button type="button" onClick={() => setQuery('b')}>
            change
          </button>
        </div>
      );
    }

    render(<Harness />);

    await act(async () => {
      screen.getByRole('button', { name: 'change' }).click();
    });

    // Second request resolves first, then the stale first one arrives late.
    await act(async () => {
      second.resolve('SECOND');
      await second.promise;
    });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('SECOND'));

    await act(async () => {
      first.resolve('FIRST-STALE');
      await first.promise;
    });

    // The late arrival must not overwrite the newer result.
    expect(screen.getByTestId('status').textContent).toBe('SECOND');
  });

  it('does not fetch while disabled', async () => {
    const fetcher = vi.fn().mockResolvedValue('never');
    render(<Probe fetcher={fetcher} options={{ enabled: false }} />);

    await waitFor(() => expect(screen.getByTestId('status').textContent).not.toBe('loading'));
    expect(fetcher).not.toHaveBeenCalled();
  });
});
