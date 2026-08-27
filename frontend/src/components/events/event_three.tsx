// import { eventBusInstance } from "@/learn/eventBus"
// import type { ItemCountChangedPayload } from "@/types/event.types"
// import { useEffect, useState } from "react"


// export default function Event_three() {

//     const [itemCount, SetItemCount] = useState<Number>(0)


//     const handleCountChange = (payload: ItemCountChangedPayload) => {
//         console.log('count: ',payload)
//         SetItemCount(payload.count)
//     }
//     useEffect(() => {


//         const unsubscribe = eventBusInstance.subscribe("ITEM_COUNT_CHANGED" , handleCountChange)

//         return () => {
//             unsubscribe();
//         }
//     } , [])

//     return (
//         <div className="bg-yellow-500 h-full flex flex-row justify-center items-center p-4 m-5 border-10 border-black ">
//             { itemCount }  
//         </div>
//     )
// }
