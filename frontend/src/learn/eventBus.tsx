import type { ServerMessage, ServerMessageType } from "@/types/websocketResponse.types";


class EventBus {
    private events: Map<string, Set<Function>> = new Map();

    public subscribe(eventName: ServerMessageType, callback: Function) {
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

    public publish( event: ServerMessage)  {

        const listeners = this.events.get(event.type)

        if (!listeners) return;
        
        listeners?.forEach((callback) => {
            if (event?.payload) {

                callback(event.payload)
            }
        }) 
    }
}


export const eventBusInstance = new EventBus();