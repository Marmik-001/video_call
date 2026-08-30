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
