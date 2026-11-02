import type { EventPayload, EventType } from "@/types/event.types";

export type EventBusCallback<T = unknown> = (payload: T) => void;

class EventBus {
    private events: Map<string, Set<(payload: unknown) => void>> = new Map();

    public subscribe<T = EventPayload>(eventName: EventType, callback: EventBusCallback<T>) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set())
        }
        const listeners = this.events.get(eventName)
        const typedCallback = callback as (payload: unknown) => void;
        listeners?.add(typedCallback)
        return () => {
            listeners?.delete(typedCallback)
            if (listeners?.size === 0) {   
                this.events.delete(eventName)
            }
        }
    }

    public publish(eventType: EventType, payload: EventPayload) {
        const listeners = this.events.get(eventType)
        if (!listeners) return;
        
        listeners.forEach((callback) => {
            if (payload !== undefined && payload !== null) {
                callback(payload)
            }
        }) 
    }
}

export const eventBusInstance = new EventBus();