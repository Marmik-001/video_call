import { Button } from "@/components/ui/button"
import { webRTCInstance } from "@/services/webRTC.service"
import type { CandidatePairReport } from "../iceCandidates.service"
import { useState } from "react"




const ConnectionTypeStats = () => {

  const [report, setReport] = useState<CandidatePairReport | null>()

  const handleGetSendersInfo = async () => {
    const stats: CandidatePairReport | undefined = await webRTCInstance.getCurrentConnectionStats()
    console.log("stats: ", stats)
    if (stats == undefined) {
      return;
    }
    setReport(stats)
  }


  return (

    <div>
      <Button onClick={handleGetSendersInfo}>
        GET senders info to log
      </Button>
      {
        report &&
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-sm font-mono space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="font-bold text-white text-base">{report.routeType}</span>
            <span className={`px-2 py-0.5 text-xs rounded font-semibold ${report.isRelayed ? "bg-amber-950 text-amber-400" : "bg-emerald-950 text-emerald-400"
              }`}>
              {report.protocol} • {report.isIpv6 ? "IPv6" : "IPv4"}
            </span>
          </div>

          <p className="text-neutral-400 text-xs">{report.summary} {report.performanceExpectation}</p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
              <div className="text-neutral-500 text-xs uppercase font-semibold">Local Endpoint</div>
              <div className="text-emerald-400 font-bold">{report.local.endpoint}</div>
              <div className="text-xs text-neutral-400">{report.local.type} ({report.local.ipScope})</div>
            </div>

            <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
              <div className="text-neutral-500 text-xs uppercase font-semibold">Remote Endpoint</div>
              <div className="text-blue-400 font-bold">{report.remote.endpoint}</div>
              <div className="text-xs text-neutral-400">{report.remote.type} ({report.remote.ipScope})</div>
            </div>
          </div>
        </div>
      }
      <div> {report?.isDirectP2P} </div>
    </ div>

  )

}

export default ConnectionTypeStats
