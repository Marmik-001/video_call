export interface ParsedCandidate {
  type: "host" | "srflx" | "relay" | "unknown";
  protocol: "udp" | "tcp" | "unknown";
  address: string;
  port: number;
  isMdns: boolean;
  raw: string;
}

export function parseIceCandidate(candidateStr: string): ParsedCandidate {
  const parts = candidateStr.trim().split(/\s+/);
  const fallback: ParsedCandidate = {
    type: "unknown",
    protocol: "unknown",
    address: "unknown",
    port: 0,
    isMdns: false,
    raw: candidateStr,
  };

  if (parts.length < 8) return fallback;

  // SDP format: candidate:foundation component protocol priority address port typ type ...
  const protocol = (parts[2] || "").toLowerCase();
  const address = parts[4] || "unknown";
  const port = parseInt(parts[5] || "0", 10) || 0;
  
  const typIndex = parts.indexOf("typ");
  const candType = typIndex !== -1 && parts[typIndex + 1] ? parts[typIndex + 1].toLowerCase() : "unknown";

  const type: "host" | "srflx" | "relay" | "unknown" =
    candType === "host" || candType === "srflx" || candType === "relay"
      ? candType
      : "unknown";

  const proto: "udp" | "tcp" | "unknown" =
    protocol === "udp" || protocol === "tcp" ? protocol : "unknown";

  const isMdns = address.toLowerCase().endsWith(".local");

  return {
    type,
    protocol: proto,
    address,
    port,
    isMdns,
    raw: candidateStr,
  };
}
