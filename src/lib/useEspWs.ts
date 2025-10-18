'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

type Unsubscribe = () => void;

export function useEspWs() {
  const url = process.env.NEXT_PUBLIC_ESP_WS_URL || '';
  const wsRef = useRef<WebSocket | null>(null);
  const [ready, setReady] = useState(false);

  // keep subscribers even if the socket reconnects
  const subsRef = useRef(new Set<(msg: unknown) => void>());

  useEffect(() => {
    if (!url) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    const onOpen = () => setReady(true);
    const onClose = () => setReady(false);
    const onError = () => setReady(false);

    const dispatch = (data: unknown) => {
      // fan-out to current subscribers
      for (const cb of subsRef.current) {
        try {
          cb(data);
        } catch {
          // ignore subscriber errors
        }
      }
    };

    const onMessage = (e: MessageEvent) => {
      // support text (common) and Blob (some servers)
      if (typeof e.data === 'string') {
        try {
          dispatch(JSON.parse(e.data));
        } catch {
          // ignore malformed JSON
        }
      } else if (e.data instanceof Blob) {
        e.data
          .text()
          .then((t) => {
            try {
              dispatch(JSON.parse(t));
            } catch {
              // ignore
            }
          })
          .catch(() => {
            // ignore
          });
      }
    };

    ws.addEventListener('open', onOpen);
    ws.addEventListener('close', onClose);
    ws.addEventListener('error', onError);
    ws.addEventListener('message', onMessage);

    return () => {
      ws.removeEventListener('open', onOpen);
      ws.removeEventListener('close', onClose);
      ws.removeEventListener('error', onError);
      ws.removeEventListener('message', onMessage);
      // close only this instance and clear ref if it still points to it
      try {
        ws.close();
      } finally {
        if (wsRef.current === ws) wsRef.current = null;
      }
    };
  }, [url]);

  const send = useCallback((obj: unknown) => {
    const s = wsRef.current;
    if (s && s.readyState === WebSocket.OPEN) {
      s.send(JSON.stringify(obj));
    }
  }, []);


  const subscribe = useCallback(<T,>(fn: (msg: T) => void): Unsubscribe => {
    // wrap to erase type at storage boundary, re-cast when dispatching
    const wrapper = (msg: unknown) => fn(msg as T);
    subsRef.current.add(wrapper);
    return () => {
      subsRef.current.delete(wrapper);
    };
  }, []);

  return { ready, send, subscribe };
}
