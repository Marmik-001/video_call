import type { ServerMessage } from "@/types/websocket.types";


export function parseWebSocketResponse(
  data: string,
): ServerMessage | Error {
  try {
    return JSON.parse(data) ;
  } catch (err) {
    console.error("error in parsing data", err);
    if (err instanceof Error) {
      return err;
    }
      return new Error('error parsing')
  }
}

export function getSignalingUrl(): string {
  const envUrl = import.meta.env.VITE_SIGNALING_URL;
  if (envUrl) {
    return envUrl;
  }
  if (typeof window !== "undefined") {
    const isSecure = window.location.protocol === "https:";
    const protocol = isSecure ? "wss:" : "ws:";
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return `${protocol}//${window.location.hostname}:8080`;
    }
    return `${protocol}//${window.location.host}`;
  }
  return "ws://localhost:8080";
}
