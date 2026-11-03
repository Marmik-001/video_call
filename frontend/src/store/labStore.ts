import { create } from "zustand";

export type EventCategory = "SIGNALING" | "ICE" | "STATS" | "DATA_CHANNEL" | "CHAOS";

export interface LabEvent {
  id: string;
  timestamp: number;
  category: EventCategory;
  summary: string;
  details?: Record<string, unknown>;
}

export interface CandidateInfo {
  id: string;
  peer: "A" | "B";
  type: "host" | "srflx" | "relay" | "unknown";
  protocol: "udp" | "tcp" | "unknown";
  address: string;
  port: number;
  isMdns: boolean;
  raw: string;
}

export interface MailboxMessage {
  id: string;
  from: "A" | "B";
  to: "A" | "B";
  type: "offer" | "answer" | "candidate";
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
  summary: string;
}

export interface LabState {
  currentStep: number;
  isPaused: boolean;
  events: LabEvent[];
  mailbox: MailboxMessage[];
  gatheredCandidates: CandidateInfo[];
  sdpOffer: string | null;
  sdpAnswer: string | null;
  dataChannelMessages: { from: "A" | "B"; text: string; timestamp: number }[];
  peerAConnectionState: RTCPeerConnectionState;
  peerBConnectionState: RTCPeerConnectionState;
  localMediaStream: MediaStream | null;
  remoteMediaStream: MediaStream | null;
  mediaStatus: "idle" | "requesting" | "live" | "synthetic" | "error";

  // Actions
  setStep: (step: number) => void;
  setIsPaused: (paused: boolean) => void;
  pushEvent: (event: Omit<LabEvent, "id" | "timestamp">) => void;
  enqueueMailbox: (msg: Omit<MailboxMessage, "id">) => void;
  dequeueMailbox: () => MailboxMessage | undefined;
  clearMailbox: () => void;
  addGatheredCandidate: (cand: Omit<CandidateInfo, "id">) => void;
  setSdpOffer: (sdp: string) => void;
  setSdpAnswer: (sdp: string) => void;
  addDataChannelMessage: (msg: { from: "A" | "B"; text: string }) => void;
  setPeerAConnectionState: (state: RTCPeerConnectionState) => void;
  setPeerBConnectionState: (state: RTCPeerConnectionState) => void;
  setLocalMediaStream: (stream: MediaStream | null) => void;
  setRemoteMediaStream: (stream: MediaStream | null) => void;
  setMediaStatus: (status: "idle" | "requesting" | "live" | "synthetic" | "error") => void;
  reset: () => void;
}

const MAX_EVENT_BUFFER = 2000;

export const useLabStore = create<LabState>((set, get) => ({
  currentStep: 1,
  isPaused: true,
  events: [],
  mailbox: [],
  gatheredCandidates: [],
  sdpOffer: null,
  sdpAnswer: null,
  dataChannelMessages: [],
  peerAConnectionState: "new",
  peerBConnectionState: "new",
  localMediaStream: null,
  remoteMediaStream: null,
  mediaStatus: "idle",

  setStep: (step) => set({ currentStep: step }),
  setIsPaused: (paused) => set({ isPaused: paused }),

  pushEvent: (eventData) => {
    const newEvent: LabEvent = {
      ...eventData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    set((state) => {
      const updated = state.events.length >= MAX_EVENT_BUFFER
        ? [...state.events.slice(state.events.length - MAX_EVENT_BUFFER + 1), newEvent]
        : [...state.events, newEvent];
      return { events: updated };
    });
  },

  enqueueMailbox: (msg) => {
    const mailboxItem: MailboxMessage = {
      ...msg,
      id: crypto.randomUUID(),
    };
    set((state) => ({ mailbox: [...state.mailbox, mailboxItem] }));
  },

  dequeueMailbox: () => {
    const current = get().mailbox;
    if (current.length === 0) return undefined;
    const [head, ...rest] = current;
    set({ mailbox: rest });
    return head;
  },

  clearMailbox: () => set({ mailbox: [] }),

  addGatheredCandidate: (cand) => {
    const candidateInfo: CandidateInfo = {
      ...cand,
      id: crypto.randomUUID(),
    };
    set((state) => ({ gatheredCandidates: [...state.gatheredCandidates, candidateInfo] }));
  },

  setSdpOffer: (sdp) => set({ sdpOffer: sdp }),
  setSdpAnswer: (sdp) => set({ sdpAnswer: sdp }),

  addDataChannelMessage: (msg) =>
    set((state) => ({
      dataChannelMessages: [...state.dataChannelMessages, { ...msg, timestamp: Date.now() }],
    })),

  setPeerAConnectionState: (state) => set({ peerAConnectionState: state }),
  setPeerBConnectionState: (state) => set({ peerBConnectionState: state }),
  setLocalMediaStream: (stream) => set({ localMediaStream: stream }),
  setRemoteMediaStream: (stream) => set({ remoteMediaStream: stream }),
  setMediaStatus: (status) => set({ mediaStatus: status }),

  reset: () =>
    set({
      currentStep: 1,
      isPaused: true,
      events: [],
      mailbox: [],
      gatheredCandidates: [],
      sdpOffer: null,
      sdpAnswer: null,
      dataChannelMessages: [],
      peerAConnectionState: "new",
      peerBConnectionState: "new",
      localMediaStream: null,
      remoteMediaStream: null,
      mediaStatus: "idle",
    }),
}));
