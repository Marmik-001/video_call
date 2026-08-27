// export interface emitEventsOptions<T> {
//   type: string;
//   payload: T;
// }
import { type EmitOptions } from "@/types/emitOptions.types";
export const emitEvents =(
  ws: WebSocket,
  { type, payload }: EmitOptions ,
) =>   {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }))
  } else {
    console.warn("ws not ready, current state: ",  ws.readyState)
  }
};
