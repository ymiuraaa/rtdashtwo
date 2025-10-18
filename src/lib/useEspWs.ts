'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

export function useEspWs() {
  const url = process.env.NEXT_PUBLIC_ESP_WS_URL || '';
  const wsRef = useRef<WebSocket | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!url) return;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    const onOpen = () => setReady(true);
    const onClose = () => setReady(false);
    const onError = () => setReady(false);

    ws.addEventListener('open', onOpen);
    ws.addEventListener('close', onClose);
    ws.addEventListener('error', onError);

    return () => {
      ws.removeEventListener('open', onOpen);
      ws.removeEventListener('close', onClose);
      ws.removeEventListener('error', onError);
      ws.close();
    };
  }, [url]);

  const send = useCallback((obj: unknown) => {
    const s = wsRef.current;
    if (s && s.readyState === WebSocket.OPEN) s.send(JSON.stringify(obj));
  }, []);

  const subscribe = useCallback((fn: (msg: any) => void) => {
    const s = wsRef.current;
    if (!s) return () => {};
    const handler = (e: MessageEvent) => {
      try { fn(JSON.parse(e.data)); } catch { /* ignore */ }
    };
    s.addEventListener('message', handler);
    return () => s.removeEventListener('message', handler);
  }, []);

  return { ready, send, subscribe };
}
