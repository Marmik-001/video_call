export interface CandidateAnalysis {
  type: string;
  protocol: string;
  endpoint: string;
  ipScope: "LAN (Private IPv4)" | "WAN (Public IPv4)" | "Global IPv6" | "Localhost" | "Unknown";
  role: string;
  component: "Media & Control (RTP/RTCP)" | "Control Only (RTCP)" | "Unknown";
  priority: number;
}
export interface CandidatePairReport {
  summary: string;
  routeType: "Direct LAN" | "Direct P2P (NAT Traversal)" | "TURN Relay" | "Mixed / Unknown";
  isDirectP2P: boolean;
  isRelayed: boolean;
  isIpv6: boolean;
  protocol: "UDP" | "TCP";
  local: CandidateAnalysis;
  remote: CandidateAnalysis;
  performanceExpectation: string;
  technicalDetails: {
    localFoundation: string;
    remoteFoundation: string;
    tcpType?: string;
  };
}
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
  public parseIceCandidateString(candidateStr: string): ParsedIceCandidate {
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
  private getIpScope(ip: string): CandidateAnalysis["ipScope"] {
    if (!ip) return "Unknown";
    if (ip === "127.0.0.1" || ip === "::1") return "Localhost";
    if (ip.includes(":")) return "Global IPv6";
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(ip)) {
      return "LAN (Private IPv4)";
    }
    return "WAN (Public IPv4)";
  }

  private getTypeDescription(type: string): string {
    switch (type) {
      case "host":
        return "Direct local network interface bound to your physical/virtual NIC.";
      case "srflx":
        return "Server Reflexive: Public IP and port mapped by your NAT router via STUN.";
      case "prflx":
        return "Peer Reflexive: Dynamically assigned NAT endpoint discovered during peer checks.";
      case "relay":
        return "TURN Relay: Routed through an intermediary TURN server (firewall fallback).";
      default:
        return "Unknown candidate classification.";
    }
  }

  private analyzeEndpoint(c: ParsedIceCandidate): CandidateAnalysis {
    return {
      type: c.type.toUpperCase(),
      protocol: c.protocol.toUpperCase(),
      endpoint: `${c.address}:${c.port}`,
      ipScope: this.getIpScope(c.address),
      role: this.getTypeDescription(c.type),
      component:
        c.component === "rtp"
          ? "Media & Control (RTP/RTCP)"
          : c.component === "rtcp"
            ? "Control Only (RTCP)"
            : "Unknown",
      priority: c.priority,
    };
  }

  public userReadableFormat(pair: RTCIceCandidatePair): CandidatePairReport | Error {
    if (!pair.local?.candidate || !pair.remote?.candidate) {
      console.error("Incomplete pair provided:", pair);
      return new Error("Invalid or incomplete candidate pair provided.");
    }

    const localParsed = this.parseIceCandidateString(pair.local.candidate);
    const remoteParsed = this.parseIceCandidateString(pair.remote.candidate);

    const localAnalysis = this.analyzeEndpoint(localParsed);
    const remoteAnalysis = this.analyzeEndpoint(remoteParsed);

    // Determine path characteristics
    const isRelayed = localParsed.type === "relay" || remoteParsed.type === "relay";
    const isDirectLan = localParsed.type === "host" && remoteParsed.type === "host";
    const isDirectP2P = !isRelayed && (localParsed.type === "srflx" || remoteParsed.type === "srflx" || isDirectLan);
    const isIpv6 = localAnalysis.ipScope === "Global IPv6" || remoteAnalysis.ipScope === "Global IPv6";
    const protocol = localParsed.protocol.toUpperCase() as "UDP" | "TCP";

    let routeType: CandidatePairReport["routeType"] = "Mixed / Unknown";
    let summary = "";
    let performanceExpectation = "";

    if (isRelayed) {
      routeType = "TURN Relay";
      summary = "Traffic is traversing an external TURN relay server.";
      performanceExpectation = "Higher latency due to server hop. Consumes relay bandwidth. Immune to NAT blocks.";
    } else if (isDirectLan) {
      routeType = "Direct LAN";
      summary = "Direct peer-to-peer over the local area network.";
      performanceExpectation = "Minimal latency (<5ms) and highest bandwidth. No internet routing involved.";
    } else if (isDirectP2P) {
      routeType = "Direct P2P (NAT Traversal)";
      summary = "Direct peer-to-peer across the public internet via NAT hole-punching.";
      performanceExpectation = "Optimal internet latency. Direct packet path between routers with no relay overhead.";
    }

    return {
      summary,
      routeType,
      isDirectP2P,
      isRelayed,
      isIpv6,
      protocol,
      local: localAnalysis,
      remote: remoteAnalysis,
      performanceExpectation,
      technicalDetails: {
        localFoundation: localParsed.foundation,
        remoteFoundation: remoteParsed.foundation,
        tcpType: localParsed.tcpType || remoteParsed.tcpType,
      },
    };
  }
}


export const iceCandidatesInstance = new IceCandidatesOperations()
