// import { useEffect, useState } from "react";
// import { Button } from "../ui/button";
// import { eventBusInstance } from "@/learn/eventBus";


// export default function Event_one() {

//     const handleSendingAddItemEvent = (item: string) => {
//         console.log("item: ",item)
//         eventBusInstance.publish({ eventName: "ITEM_ADDED", payload: { itemName: item } })
//     }

//     useEffect(() => {
//     } , [])

//     const [item, setItem] = useState("")
    

//     return (
//         <div className="bg-red-500 h-full flex flex-col justify-center items-center p-4 m-5 border-10 border-black   ">
//             <input
//                 className="bg-black text-white rounded-2xl border-2 border-white m-2 pl-4"
//                 placeholder="item name"
//             value={item}    
//             onChange={(e) => {
//                 setItem(e.target.value)
//             }}
            
//             />

//             <Button onClick={() => {
//                 handleSendingAddItemEvent(item)
//             }}>
//                 trigger add item button
//             </Button>
//         </div>
//     )
// }