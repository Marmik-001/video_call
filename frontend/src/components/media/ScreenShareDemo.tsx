import {
  useEffect,
  useRef
} from "react"
import { Button } from "../ui/button"
import { useUserScreenShare } from "@/hooks/useUserScreenShare"

const SCREEN_SHARE_OPTIONS: DisplayMediaStreamOptions = {
  video: {
    displaySurface: "browser",
  },
  preferCurrentTab: false,
  selfBrowserSurface: "exclude",
  systemAudio: "include",
  surfaceSwitching: "include",
  monitorTypeSurfaces: "include",
};

export const ScreenShareDemo: React.FC = () => {

  const { stream, error, isLoading , requestPermission , stopScreenSharing } = useUserScreenShare({video:true})

  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  

  

  return (
    <div>
      {/*button for screen sharing*/}
      {
        !stream ? (
          <Button onClick={requestPermission} disabled={isLoading}>
            {
              isLoading ? "granting access..." : "Share screen"
            }
            
          </Button>
        ): (
            <>
              <Button onClick={stopScreenSharing}>Stop screen Sharing</Button>
            </>
        )
      }
{/*error handling*/}
      {
        error && 
        <p>
            Error : {" "}
            {error.name === 'NotAllowedError' ? "user declined permission" : `${error}` } 
        </p>
      }
      {/*screen sharing section*/}
      {
        stream && 
        <video ref={videoRef} autoPlay playsInline muted className="h-1/2 w-2xl"/>
      }
    </div>
  )
}

