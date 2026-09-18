export interface DiscoveredCandidates {

  type: RTCIceCandidateType | "unknown"
  protocol: RTCIceProtocol | "unknown"
  port: number | null
  address: string | null
  raw: string
}




class IceCandidatesOperations {

  public localCandidates: DiscoveredCandidates[] = []
  public remoteCandidates: DiscoveredCandidates[] = []

  public trackCandidates(iceCandidate: RTCIceCandidate, origin: "local" | "remote") {

    const candidateData: DiscoveredCandidates = {
      port: iceCandidate.port,
      protocol: iceCandidate.protocol || "unknown",
      type: iceCandidate.type || "unknown",
      address: iceCandidate.address,
      raw: iceCandidate.candidate
    }
    if (origin === "local") {
      this.localCandidates.push(candidateData)
    } else {

      this.remoteCandidates.push(candidateData)
    }
    console.log(`${origin.toUpperCase()}, ${candidateData.type} , ${candidateData.address}:${candidateData.port}`)
  }
}


export const iceCandidatesInstance = new IceCandidatesOperations()
