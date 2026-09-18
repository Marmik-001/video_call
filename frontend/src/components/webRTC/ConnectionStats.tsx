import { useRef, useState } from "react"
import { Button } from "../ui/button"
import { webRTCInstance } from "@/services/webRTC.service"


interface StatsType {

}
const ConnectionStats = () => {

  const [currentStats, setCurrentStats] = useState<RTCStatsReport[]>([])
  const statsIntervalRef = useRef<number | null>(null)

  const startStatsReport = async () => {

    if (statsIntervalRef.current) {
      console.log("interval already exists")
      return;
    }
    statsIntervalRef.current = setInterval(async () => {
      const stats = await webRTCInstance.peerConnectionStats()
      if (!stats) {
        console.error("did not find stats")
        return;
      }

      const arrayStats = Array.from(stats.values())
      setCurrentStats(arrayStats)

    }, 1000)


    return
  }
  const stopStatsReport = async () => {
    if (!statsIntervalRef.current) {
      return;
    }
    clearInterval(statsIntervalRef.current)
    statsIntervalRef.current = null
    console.log("interval cleared")
  }

  return (
    <div>
      hello world
      <Button onClick={startStatsReport}> Get Stats </ Button>
      <Button onClick={stopStatsReport}> Stop Stats </Button>
      {


      }
    </div>
  )
}

export default ConnectionStats
