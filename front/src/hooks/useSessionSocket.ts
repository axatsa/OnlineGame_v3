import { useEffect, useRef, useCallback, useState } from "react";

type Status = "connecting" | "open" | "closed" | "error";

interface UseSessionSocketOptions {
  url: string;
  onMessage: (data: Record<string, unknown>) => void;
  enabled?: boolean;
}

export function useSessionSocket({ url, onMessage, enabled = true }: UseSessionSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);
  const [status, setStatus] = useState<Status>("connecting");

  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!enabled || unmountedRef.current) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => {
      if (!unmountedRef.current) setStatus("open");
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        onMessageRef.current(data);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {
      if (!unmountedRef.current) setStatus("error");
    };

    ws.onclose = (evt) => {
      if (unmountedRef.current) return;
      setStatus("closed");
      // Don't reconnect on intentional closes (4001, 4003, 4004) or game-over
      if (evt.code >= 4000) return;
      reconnectTimerRef.current = setTimeout(() => {
        if (!unmountedRef.current) connect();
      }, 3000);
    };
  }, [url, enabled]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send, status };
}
