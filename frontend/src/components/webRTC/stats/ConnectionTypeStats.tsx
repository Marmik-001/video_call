import { Button } from "@/components/ui/button"
import { webRTCInstance } from "@/services/webRTC.service"




const ConnectionTypeStats = () => {

  const handleGetSendersInfo = () => {
    webRTCInstance.getCurrentConnectionStats()
  }

  return (

    <div>
      <Button onClick={handleGetSendersInfo}>
        GET senders info to log
      </Button>
    </ div>

  )

}

export default ConnectionTypeStats
