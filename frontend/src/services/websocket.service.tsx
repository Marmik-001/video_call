import { eventBusInstance } from "@/learn/eventBus"
import type { ClientMessage } from "@/types/websocket.types"
import { parseWebSocketResponse } from "@/utils/websocket.utils"


class Websocket {
    private ws: WebSocket | null = null
    
    /**
        connect
    **/
    public connect(url: string) {
        this.ws = new WebSocket(url)

        this.ws.onopen = this.wsOnOpenHandler

        this.ws.onclose = this.wsOnCloseHandler

        this.ws.onmessage = this.wsOnMessageHandler

        this.ws.onerror = this.wsOnErrorHandler
    }

    private wsOnMessageHandler (e: MessageEvent) {
    
        if (typeof e.data !== "string") {
            console.warn("Received non-string WebSocket frame:", e.data);
            return;
        }
        const data = parseWebSocketResponse(e.data)
        if (data instanceof Error) {
            console.error("corrupted message received from server: ", data)
            return;
        }
    
        if (data.type === "ERROR") {
            eventBusInstance.publish(`ERROR:${data.payload.code}`, data.payload)
            eventBusInstance.publish(`ERROR`, data.payload)
            return;
        }
    
        eventBusInstance.publish(data.type, data.payload)
    }

    private wsOnOpenHandler = () => {
    console.log("connection opened")
    }
    
    private wsOnCloseHandler = () => {
    console.log("connection closed")
    }

    private wsOnErrorHandler = (err: Event) => {
        console.error("Error: ", err)
        console.log("error detected, add, reconnecting logic here: ")
    }

    /**
     * emit events
     */
    public emit(message: ClientMessage) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message))
        } else {
            console.error("Not connected to the client, add retry logic here or on the component") 
        }
    }
}    

export const socketService = new Websocket()
