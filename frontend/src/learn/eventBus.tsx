import type { EventPayload, EventType } from "@/types/event.types";
import type { ServerMessage, ServerMessageType } from "@/types/websocket.types";


class EventBus {
    private events: Map<string, Set<Function>> = new Map();

    public subscribe(eventName: EventType ,  callback: Function) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName , new Set())
        }
        const listeners = this.events.get(eventName)
        listeners?.add(callback)
        return () => {
            listeners?.delete(callback)
            if (listeners?.size === 0) {   
                this.events.delete(eventName)
            }
        }
    }

    public publish( eventType: EventType ,  payload: EventPayload)  {

        const listeners = this.events.get(eventType)

        if (!listeners) return;
        
        listeners?.forEach((callback) => {
            if (payload) {

                callback(payload)
            }
        }) 
    }
}


export const eventBusInstance = new EventBus();