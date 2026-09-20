export interface DiscoveredCandidates {

  type: RTCIceCandidateType | "unknown"
  protocol: RTCIceProtocol | "unknown"
  port: number | null
  address: string | null
  raw: string
}

export interface ParsedIceCandidate {
  foundation: string;
  component: "rtp" | "rtcp" | "unknown";
  protocol: "udp" | "tcp" | "unknown";
  priority: number;
  address: string;
  port: number;
  type: "host" | "srflx" | "prflx" | "relay" | "unknown";
  tcpType?: string;
  raw: string;
}




class IceCandidatesOperations {

  public localCandidates: DiscoveredCandidates[] = []
  public remoteCandidates: DiscoveredCandidates[] = []

  public trackCandidates(iceCandidate: RTCIceCandidate | RTCIceCandidateInit | string, origin: "local" | "remote") {

    let rawString = ""
    if (typeof iceCandidate === "string") {
      rawString = iceCandidate
    }
    else if ("candidate" in iceCandidate && iceCandidate.candidate) {
      rawString = iceCandidate.candidate
    }
    if (!rawString) return;

    const parsedCandidate = this.parseIceCandidateString(rawString)

    if (origin === "local") {
      this.localCandidates.push(parsedCandidate)
    } else {
      this.remoteCandidates.push(parsedCandidate)
    }
    console.log(
      `[${origin.toUpperCase()} PARSED]`,
      `type: ${parsedCandidate.type} | proto: ${parsedCandidate.protocol} | ip: ${parsedCandidate.address}:${parsedCandidate.port}`
    );
  }
  private parseIceCandidateString(candidateStr: string): ParsedIceCandidate {
    const fallback: ParsedIceCandidate = {
      foundation: "",
      component: "unknown",
      protocol: "unknown",
      priority: 0,
      address: "",
      port: 0,
      type: "unknown",
      raw: candidateStr,
    };

    if (!candidateStr || !candidateStr.startsWith("candidate:")) {
      return fallback;
    }

    // Split by whitespace
    const tokens = candidateStr.trim().split(/\s+/);

    // tokens[0] -> "candidate:2818006968"
    const foundation = tokens[0].replace("candidate:", "");

    // tokens[1] -> component ID: 1 is RTP, 2 is RTCP
    const componentId = parseInt(tokens[1], 10);
    const component = componentId === 1 ? "rtp" : componentId === 2 ? "rtcp" : "unknown";

    // tokens[2] -> transport protocol
    const protocol = (tokens[2]?.toLowerCase() === "tcp" || tokens[2]?.toLowerCase() === "udp")
      ? (tokens[2].toLowerCase() as "udp" | "tcp")
      : "unknown";

    // tokens[3] -> priority
    const priority = parseInt(tokens[3], 10) || 0;

    // tokens[4] -> connection address (IPv4 or IPv6)
    const address = tokens[4] || "";

    // tokens[5] -> port number
    const port = parseInt(tokens[5], 10) || 0;

    // Find the position of 'typ' keyword
    const typIndex = tokens.indexOf("typ");
    let type: ParsedIceCandidate["type"] = "unknown";

    if (typIndex !== -1 && tokens[typIndex + 1]) {
      const rawType = tokens[typIndex + 1].toLowerCase();
      if (rawType === "host" || rawType === "srflx" || rawType === "prflx" || rawType === "relay") {
        type = rawType;
      }
    }

    // Check optional tcptype (active, passive, so) if protocol is TCP
    const tcpTypeIndex = tokens.indexOf("tcptype");
    const tcpType = tcpTypeIndex !== -1 ? tokens[tcpTypeIndex + 1] : undefined;

    return {
      foundation,
      component,
      protocol,
      priority,
      address,
      port,
      type,
      tcpType,
      raw: candidateStr,
    };
  }

}


export const iceCandidatesInstance = new IceCandidatesOperations()
