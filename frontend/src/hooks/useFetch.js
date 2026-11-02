import { useState, useEffect, useCallback } from 'react';
import api, { errMsg } from '../services/api';

// Loads data from an API path whenever params change. Returns { data, loading, error, reload }.
export default function useFetch(url, params, enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const key = JSON.stringify(params || {});

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true); setError('');
    try { setData((await api.get(url, { params: JSON.parse(key) })).data); }
    catch (e) { setError(errMsg(e)); }
    finally { setLoading(false); }
  }, [url, key, enabled]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}
