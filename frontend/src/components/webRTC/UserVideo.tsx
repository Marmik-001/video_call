import { webRTCInstance } from "@/services/webRTC.service"
import { useEffect, useRef } from "react"


const UserVideo = () => {


  const peerVideoRef = useRef<HTMLVideoElement | null>(null)


  useEffect(() => {
    webRTCInstance.setOnRemoteStream((stream) => {
      if (!peerVideoRef.current || !stream) {
        return
      }
      peerVideoRef.current.srcObject = stream
    })

    return () => {
      webRTCInstance.setOnRemoteStream(() => { })
      if (peerVideoRef.current) {
        peerVideoRef.current = null
      }
    }
  }, [])
  return (
    <div className="w-full h-full bg-black border-2 border-white p-2 m-2">


      <video className="w-full h-full object-cover" ref={peerVideoRef} playsInline autoPlay />
    </div>
  )
}
export default UserVideo
