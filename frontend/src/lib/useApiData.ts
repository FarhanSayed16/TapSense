"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";

type Options = {
  /** Poll interval in ms. Default 0 = load once. Use 3000 for live overview. */
  refreshMs?: number;
};

export function useApiData<T>(path: string | null, options: Options = {}) {
  const { refreshMs = 0 } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const hasData = useRef(false);

  const reload = useCallback(async () => {
    if (!path) {
      setData(null);
      setLoading(false);
      hasData.current = false;
      return;
    }
    if (!hasData.current) setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<T>(path);
      setData(result);
      hasData.current = true;
    } catch (err) {
      if (!hasData.current) setData(null);
      setError(err instanceof ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void reload();
    if (!refreshMs || refreshMs < 500) return;
    const id = window.setInterval(() => void reload(), refreshMs);
    return () => window.clearInterval(id);
  }, [reload, refreshMs]);

  return { data, error, loading, reload };
}
