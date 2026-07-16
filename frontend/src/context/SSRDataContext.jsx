import { createContext, useContext, useEffect, useState } from "react";

// Populated server-side per-request (see entry-server.jsx) and hydrated
// client-side from window.__SSR_DATA__ (see entry-client.jsx).
export const SSRDataContext = createContext({});

// Keys already consumed on this page load — ensures a remount of the same
// route (e.g. navigating away and back) fetches fresh data instead of
// replaying the original SSR snapshot forever.
const consumedKeys = new Set();

/**
 * Drop-in replacement for "useEffect + fetch on mount": if the server already
 * fetched `key` for this request, use that immediately (no loading flash, no
 * duplicate request). Otherwise falls back to the normal client-side fetch,
 * exactly like before SSR existed.
 */
export function useSSRFetch(key, fetcher, deps = []) {
  const ssrData = useContext(SSRDataContext);
  const hasPreloaded = key != null && !consumedKeys.has(key) && Object.prototype.hasOwnProperty.call(ssrData || {}, key);
  const [data, setData] = useState(hasPreloaded ? ssrData[key] : undefined);
  const [loading, setLoading] = useState(!hasPreloaded);

  useEffect(() => {
    if (hasPreloaded) {
      consumedKeys.add(key);
      return;
    }
    let alive = true;
    setLoading(true);
    Promise.resolve()
      .then(fetcher)
      .then((res) => {
        if (alive) setData(res);
      })
      .catch(() => {
        if (alive) setData(undefined);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [data, loading];
}
