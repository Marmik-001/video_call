
// export interface ItemAddedPayload {
//     itemName :string
// }

// export interface ItemCountChangedPayload {
//     count: number
// }

// export type ItemRemovedPayload = {    
//     itemName: string
// } 

// export type PublishEventTypes =
//     | {
//         eventName: 'ITEM_ADDED',
//         payload: ItemAddedPayload
//     }
//     | {
//         eventName: 'ITEM_COUNT_CHANGED'
//         payload: ItemCountChangedPayload
//     }
//     // | {
//         eventName: "ITEM_REMOVED"
//         payload: null
//     // }


// export type SubscribeEventTypes = | 'ITEM_ADDED' | 'ITEM_COUNT_CHANGED' | 'ITEM_REMOVED'

import type { ErrorCode, ServerMessagePayload, ServerMessageType } from "./websocket.types";

export type EventType =
    | ServerMessageType
    | `ERROR:${ErrorCode}`

export type EventPayload = ServerMessagePayload