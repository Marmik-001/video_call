import { webRTCInstance } from "@/services/webRTC.service"
import { useEffect, useRef } from "react"


const UserVideo = () => {


  const peerVideoRef = useRef<HTMLVideoElement | null>(null)


  useEffect(() => {
    webRTCInstance.setOnRemoteStream((stream) => {
      console.log("UserVideo: received stream in component", stream.id);
      if (!peerVideoRef.current) return;

      peerVideoRef.current.srcObject = stream;

      // Force video playback to bypass browser autoplay restrictions
      peerVideoRef.current
        .play()
        .then(() => console.log("Remote video playing successfully"))
        .catch((err) => console.error("Autoplay prevented:", err));
    });

    return () => {
      if (peerVideoRef.current) {
        peerVideoRef.current.srcObject = null;
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
