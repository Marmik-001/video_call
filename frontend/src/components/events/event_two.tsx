// import { eventBusInstance } from "@/learn/eventBus"
// import { Button } from "../../components/ui/button"
// import { useEffect, useState } from "react"
// import type { ItemAddedPayload, PublishEventTypes } from "@/types/event.types"

// export default function Event_two() {


//     const [items , setItems] = useState<string[]>([])

//     const handleOnDeleteItem = (itemToDelete : string) => {
//         setItems((prev) => prev.filter(i => i !== itemToDelete))
//     }
//     const handleOnItemAdded = (payload: ItemAddedPayload) => {
//         const { itemName } = payload    
//         setItems(prev => [...prev , itemName])
//     }
//     useEffect(() => {

//         const unsubscribe = eventBusInstance.subscribe("ITEM_ADDED" , handleOnItemAdded)

//         return () => {
//             unsubscribe();
//         }

//     } , [])

//     useEffect(() => {
//         const eventData: PublishEventTypes = {
//             eventName: "ITEM_COUNT_CHANGED",
//             payload: {
//                 count: items.length
//             }
//         } 
//         eventBusInstance.publish(eventData)
//     } , [items])

//     return (
//         <div className="bg-blue-500 h-full flex flex-col overflow-scroll justify-center items-center p-4 m-5 border-10 border-black ">
//             <h1 className="size-10">Items</h1>
//             {
//                 items && items.map((item) => {
//                     console.log(item)
//                     return (
//                         <div key={item} className="bg-black text-white text-sm  pb-1 flex flex-row">
//                             <p className="p-2 m-2 size-10 bg-amber-700 w-full text-white">{item}</p>
//                             <Button onClick={() => {
//                                 handleOnDeleteItem(item)
//                             }}>Delete Item</Button>
//                         </div>
//                     )
//                 })
//             }
//         </div>
//     )
// }